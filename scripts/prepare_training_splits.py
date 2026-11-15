#!/usr/bin/env python3
"""Create leakage-resistant train/validation/test splits from an audited image manifest.

This script never copies images and never creates labels. It refuses to split until
every row has verified provenance, expert-reviewed labels, a valid image/XML pair,
a unique SHA-256, and a manually verified group ID (vineyard/plant/session).
"""
from __future__ import annotations

import argparse
import csv
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

SPLITS = ("train", "validation", "test")
RATIOS = {"train": 0.70, "validation": 0.15, "test": 0.15}
REQUIRED = {
    "relative_path", "sha256", "pairing_status", "xml_parse_ok", "labels",
    "provenance_verified", "expert_label_review", "group_id_for_split",
}


class ReadinessError(ValueError):
    pass


def read_manifest(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        missing = REQUIRED - set(reader.fieldnames or [])
        if missing:
            raise ReadinessError("Manifest is missing required columns: " + ", ".join(sorted(missing)))
        rows = list(reader)
    if not rows:
        raise ReadinessError("Manifest contains no image rows.")
    return rows


def validate_rows(rows: list[dict[str, str]]) -> dict[str, set[str]]:
    problems: list[str] = []
    hashes: dict[str, str] = {}
    group_classes: dict[str, set[str]] = defaultdict(set)
    class_groups: dict[str, set[str]] = defaultdict(set)

    for index, row in enumerate(rows, start=2):
        path = row.get("relative_path", "").strip() or f"CSV row {index}"
        reasons = []
        if row.get("pairing_status", "").strip() != "paired":
            reasons.append("image/XML pair is not uniquely paired")
        if row.get("xml_parse_ok", "").strip().lower() != "yes":
            reasons.append("XML did not parse successfully")
        if row.get("provenance_verified", "").strip().lower() != "yes":
            reasons.append("image provenance/license is not verified")
        if row.get("expert_label_review", "").strip().lower() != "yes":
            reasons.append("label has not been expert-reviewed")
        group = row.get("group_id_for_split", "").strip()
        if not group:
            reasons.append("group_id_for_split is empty")
        digest = row.get("sha256", "").strip().lower()
        if len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
            reasons.append("missing or invalid SHA-256")
        elif digest in hashes:
            reasons.append(f"exact duplicate of {hashes[digest]}")
        else:
            hashes[digest] = path
        labels = {label.strip() for label in row.get("labels", "").split("|") if label.strip()}
        if not labels or "UNNAMED" in labels:
            reasons.append("no usable named class label")
        if reasons:
            problems.append(f"{path}: " + "; ".join(reasons))
            continue
        group_classes[group].update(labels)
        for label in labels:
            class_groups[label].add(group)

    if problems:
        sample = "\n".join("- " + item for item in problems[:12])
        suffix = f"\n... and {len(problems) - 12} more row(s)" if len(problems) > 12 else ""
        raise ReadinessError(
            f"Training readiness gate rejected {len(problems)} row(s):\n{sample}{suffix}"
        )

    rare = {label: len(groups) for label, groups in class_groups.items() if len(groups) < 3}
    if rare:
        details = ", ".join(f"{label} ({count} groups)" for label, count in sorted(rare.items()))
        raise ReadinessError(
            "Each class must occur in at least three independent groups to appear in all "
            f"three splits; insufficient group coverage: {details}"
        )
    return group_classes


def assignment_cost(
    assignment: dict[str, str],
    group_sizes: dict[str, int],
    group_labels: dict[str, set[str]],
    total_images: int,
    total_class_images: Counter[str],
    group_label_counts: dict[str, Counter[str]],
) -> float:
    image_counts = Counter()
    class_counts = {split: Counter() for split in SPLITS}
    group_counts = Counter()
    for group, split in assignment.items():
        image_counts[split] += group_sizes[group]
        group_counts[split] += 1
        for label in group_labels[group]:
            class_counts[split][label] += group_label_counts[group][label]

    cost = 0.0
    for split in SPLITS:
        target_images = total_images * RATIOS[split]
        cost += 1.5 * ((image_counts[split] - target_images) / max(target_images, 1)) ** 2
        target_groups = len(group_sizes) * RATIOS[split]
        cost += 0.4 * ((group_counts[split] - target_groups) / max(target_groups, 1)) ** 2
        for label, total in total_class_images.items():
            target = total * RATIOS[split]
            cost += ((class_counts[split][label] - target) / max(target, 1)) ** 2
    return cost


def make_assignment(rows: list[dict[str, str]], group_classes: dict[str, set[str]], seed: int) -> dict[str, str]:
    group_sizes = Counter(row["group_id_for_split"].strip() for row in rows)
    group_label_counts: dict[str, Counter[str]] = defaultdict(Counter)
    total_class_images: Counter[str] = Counter()
    for row in rows:
        group = row["group_id_for_split"].strip()
        labels = {label.strip() for label in row["labels"].split("|") if label.strip()}
        for label in labels:
            group_label_counts[group][label] += 1
            total_class_images[label] += 1

    total_images = len(rows)
    groups_by_rarity = sorted(
        group_sizes,
        key=lambda group: (
            -sum(1 / len([g for g in group_classes if label in group_classes[g]]) for label in group_classes[group]),
            -group_sizes[group],
            group,
        ),
    )
    best_assignment = None
    best_cost = float("inf")

    # Try deterministic tie-break orders; accept only assignments with every class in every split.
    for attempt in range(256):
        rng = random.Random(seed + attempt)
        order = groups_by_rarity[:]
        # Shuffle only groups with equal rarity/size by using a seeded tie key.
        tie = {group: rng.random() for group in order}
        order.sort(key=lambda group: (
            -sum(1 / len([g for g in group_classes if label in group_classes[g]]) for label in group_classes[group]),
            -group_sizes[group],
            tie[group],
        ))
        assignment: dict[str, str] = {}
        for index, group in enumerate(order):
            empty = [split for split in SPLITS if split not in assignment.values()]
            choices = empty if len(order) - index == len(empty) else list(SPLITS)
            scored = []
            for split in choices:
                trial = dict(assignment)
                trial[group] = split
                scored.append((assignment_cost(trial, group_sizes, group_classes, total_images, total_class_images, group_label_counts), rng.random(), split))
            assignment[group] = min(scored)[2]

        coverage_ok = all(
            any(assignment[group] == split and label in group_classes[group] for group in group_classes)
            for label in total_class_images
            for split in SPLITS
        )
        if coverage_ok:
            cost = assignment_cost(assignment, group_sizes, group_classes, total_images, total_class_images, group_label_counts)
            if cost < best_cost:
                best_assignment, best_cost = assignment, cost
    if best_assignment is None:
        raise ReadinessError(
            "Could not produce a group-isolated split with every class represented in train, "
            "validation, and test. Add independently sourced groups or revise class scope; "
            "do not weaken the leakage gate."
        )
    return best_assignment


def write_outputs(rows: list[dict[str, str]], assignment: dict[str, str], out: Path, seed: int) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    output_rows = []
    for row in rows:
        item = dict(row)
        item["split"] = assignment[row["group_id_for_split"].strip()]
        output_rows.append(item)
    fields = list(output_rows[0].keys())
    if "split" not in fields:
        fields.append("split")
    with (out / "training-splits.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output_rows)

    class_counts = {split: Counter() for split in SPLITS}
    image_counts = Counter()
    groups = {split: set() for split in SPLITS}
    for row in output_rows:
        split = row["split"]
        image_counts[split] += 1
        groups[split].add(row["group_id_for_split"])
        for label in {x.strip() for x in row["labels"].split("|") if x.strip()}:
            class_counts[split][label] += 1
    report = {
        "status": "split_manifest_created_not_training",
        "seed": seed,
        "ratios_requested": RATIOS,
        "images_per_split": dict(image_counts),
        "groups_per_split": {split: len(groups[split]) for split in SPLITS},
        "class_image_counts_per_split": {
            split: dict(sorted(class_counts[split].items())) for split in SPLITS
        },
        "group_leakage_check": "passed",
        "images_copied": False,
        "model_trained": False,
        "limitations": [
            "This tool trusts the manually populated provenance_verified and expert_label_review fields; it does not independently verify them.",
            "Group IDs must represent the strongest available dependency boundary (prefer vineyard/site, plant, and capture session).",
            "Near-duplicate visual images require a separate perceptual review; SHA-256 only detects byte-identical files.",
            "Class coverage is enforced, but this is not a substitute for reviewing class balance or test-set representativeness.",
            "No images are copied and no model is trained.",
        ],
    }
    (out / "training-split-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="CSV manifest from the archive audit")
    parser.add_argument("--out", type=Path, required=True, help="Output directory")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    try:
        rows = read_manifest(args.manifest)
        groups = validate_rows(rows)
        assignment = make_assignment(rows, groups, args.seed)
        report = write_outputs(rows, assignment, args.out, args.seed)
    except (OSError, ReadinessError) as exc:
        parser.error(str(exc))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
