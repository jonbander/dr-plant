#!/usr/bin/env python3
"""Create an explicitly non-independent exploratory image-level split.

Exact byte-identical images with one consistent label stay together. If the
same bytes appear under conflicting labels, every copy in that hash group is
quarantined and excluded; the script never chooses a label arbitrarily.

This does NOT prevent near-duplicate, same-plant, same-session, or same-site
leakage. Never use its metrics as evidence of generalization to unseen farms.
"""
import argparse
import csv
import json
import random
from collections import Counter, defaultdict
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    args.out.mkdir(parents=True, exist_ok=True)
    split_csv = args.out / "exploratory-splits.csv"
    report_json = args.out / "exploratory-split-report.json"
    quarantine_csv = args.out / "quarantined-conflicting-label-duplicates.csv"
    # Never leave a previous successful run looking like the result of this run.
    for stale in (split_csv, report_json, quarantine_csv):
        stale.unlink(missing_ok=True)

    with args.manifest.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))

    required = {"relative_path", "sha256", "class_label"}
    if not rows or not required.issubset(rows[0]):
        parser.error("Manifest is empty or missing relative_path, sha256, class_label")

    hashes = defaultdict(list)
    hash_labels = defaultdict(set)
    for row in rows:
        sha = row["sha256"].strip().lower()
        label = row["class_label"].strip()
        if len(sha) != 64 or any(char not in "0123456789abcdef" for char in sha):
            parser.error("Invalid SHA-256: " + row["relative_path"])
        if not label:
            parser.error("Empty class label: " + row["relative_path"])
        hashes[sha].append(row)
        hash_labels[sha].add(label)

    conflicting = {
        sha: items for sha, items in hashes.items() if len(hash_labels[sha]) > 1
    }
    quarantined_rows = [
        row for items in conflicting.values() for row in items
    ]
    if quarantined_rows:
        fields = list(rows[0]) + ["quarantine_reason"]
        with quarantine_csv.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            for row in quarantined_rows:
                item = dict(row)
                item["quarantine_reason"] = (
                    "identical_sha256_has_conflicting_class_labels"
                )
                writer.writerow(item)

    # Keep only hash groups whose label is unambiguous. Never select one of
    # the conflicting labels, and never split copies of one hash group apart.
    valid_hashes = {
        sha: items for sha, items in hashes.items() if sha not in conflicting
    }
    class_groups = defaultdict(list)
    for sha, items in valid_hashes.items():
        class_groups[next(iter(hash_labels[sha]))].append(sha)

    unique_counts = {label: len(groups) for label, groups in sorted(class_groups.items())}
    too_small = {label: count for label, count in unique_counts.items() if count < 3}
    if too_small:
        report = {
            "status": "blocked_insufficient_unique_images_after_quarantine",
            "images_in_manifest": len(rows),
            "quarantined_conflicting_label_images": len(quarantined_rows),
            "quarantined_conflicting_hash_groups": len(conflicting),
            "unique_unambiguous_images_per_class": unique_counts,
            "classes_with_fewer_than_three_unique_images": too_small,
            "quarantine_file": quarantine_csv.name if quarantined_rows else None,
            "warning": (
                "No split was created. Resolve the source labels or obtain more "
                "unambiguous images; do not bypass the duplicate-label quarantine."
            ),
        }
        report_json.write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        parser.error(
            "Fewer than 3 unambiguous unique images remain in one or more classes "
            "after quarantine: " + json.dumps(too_small, ensure_ascii=False)
        )

    assignment = {}
    rng = random.Random(args.seed)
    for label, groups in sorted(class_groups.items()):
        rng.shuffle(groups)
        count = len(groups)
        n_test = max(1, round(count * 0.15))
        n_validation = max(1, round(count * 0.15))
        if n_test + n_validation >= count:
            n_test = n_validation = 1
        for index, sha in enumerate(groups):
            split = (
                "test" if index < n_test
                else "validation" if index < n_test + n_validation
                else "train"
            )
            assignment[sha] = split

    output_rows = []
    for sha, items in valid_hashes.items():
        for row in items:
            item = dict(row)
            item["split"] = assignment[sha]
            item["group_id_for_split"] = "exact-sha256:" + sha
            output_rows.append(item)

    with split_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(output_rows[0]))
        writer.writeheader()
        writer.writerows(output_rows)

    report = {
        "status": "exploratory_non_independent_split",
        "split_method": (
            "stratified image-level 70/15/15 within each class; "
            "exact SHA-256 duplicates kept together"
        ),
        "images_in_manifest": len(rows),
        "images_in_splits": len(output_rows),
        "images_per_split": dict(Counter(row["split"] for row in output_rows)),
        "classes": dict(Counter(row["class_label"] for row in output_rows)),
        "unique_unambiguous_images_per_class": unique_counts,
        "exact_duplicate_hash_groups": len(valid_hashes),
        "quarantined_conflicting_label_images": len(quarantined_rows),
        "quarantined_conflicting_hash_groups": len(conflicting),
        "quarantine_file": quarantine_csv.name if quarantined_rows else None,
        "group_leakage_check": "exact byte-identical files kept together only",
        "independent_by_site_plant_session": False,
        "near_duplicate_review": (
            "not performed by this split; perceptual near-duplicates may cross splits"
        ),
        "expert_label_review": "not performed by this split",
        "warning": (
            "Exploratory debugging baseline only. Results must not be reported as "
            "independent test accuracy or generalization to new farms/regions."
        ),
    }
    report_json.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
