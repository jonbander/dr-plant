#!/usr/bin/env python3
"""Fail-closed audit for grape Morphology V1 manifests.

This tool checks split leakage and evidence readiness. A pHash component is
only a near-duplicate grouping key; it is never treated as a plant/farm/site
identity or as proof of field-independent evaluation.
"""
from __future__ import annotations

import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Iterable

REQUIRED = ("relative_path", "source_sha256", "class_label", "split", "group_id")
SPLITS = {"train", "val", "validation", "test"}
FIELD_ID_COLUMNS = ("field_group_id", "plant_id", "vine_id", "farm_id", "site_id", "session_id")
ANNOTATION_COLUMNS = ("label_status", "reviewer_id", "annotation_type", "leaf_mask_path", "lesion_mask_path")


def _clean(value: object) -> str:
    return str(value or "").strip()


def _split(value: str) -> str:
    value = value.strip().lower()
    return "val" if value == "validation" else value


def audit_rows(rows: list[dict[str, str]], require_field_independent: bool = False,
               require_expert_labels: bool = False, require_manual_masks: bool = False) -> dict:
    errors: list[str] = []
    warnings: list[str] = []
    if not rows:
        errors.append("manifest_empty")

    headers = set(rows[0].keys()) if rows else set()
    missing = [column for column in REQUIRED if column not in headers]
    if missing:
        errors.append("missing_required_columns:" + ",".join(missing))

    seen_paths: dict[str, int] = {}
    hashes: dict[str, set[str]] = defaultdict(set)
    groups: dict[str, set[str]] = defaultdict(set)
    identity_splits: dict[str, dict[str, set[str]]] = {
        col: defaultdict(set) for col in FIELD_ID_COLUMNS if col in headers
    }
    class_counts: dict[str, Counter] = defaultdict(Counter)
    split_counts: Counter = Counter()
    blank_counts: Counter = Counter()
    invalid_splits: list[int] = []

    for index, row in enumerate(rows, start=2):
        path = _clean(row.get("relative_path"))
        if not path:
            errors.append(f"row_{index}:missing_relative_path")
        elif path in seen_paths:
            errors.append(f"row_{index}:duplicate_relative_path:first_at_{seen_paths[path]}")
        else:
            seen_paths[path] = index

        split = _split(_clean(row.get("split")))
        if split not in SPLITS:
            invalid_splits.append(index)
        else:
            split_counts[split] += 1
            label = _clean(row.get("class_label"))
            if label:
                class_counts[split][label] += 1
            else:
                blank_counts["class_label"] += 1

        digest = _clean(row.get("source_sha256")).lower()
        if digest:
            hashes[digest].add(split)
        else:
            blank_counts["source_sha256"] += 1

        group = _clean(row.get("group_id"))
        if group:
            groups[group].add(split)
        else:
            blank_counts["group_id"] += 1

        for column, mapping in identity_splits.items():
            value = _clean(row.get(column))
            if value:
                mapping[value].add(split)
            else:
                blank_counts[column] += 1

        for column in ("source_license", "source_dataset"):
            if column in headers and not _clean(row.get(column)):
                blank_counts[column] += 1
        for column in ANNOTATION_COLUMNS:
            if column in headers and not _clean(row.get(column)):
                blank_counts[column] += 1

    if invalid_splits:
        errors.append("invalid_split_rows:" + ",".join(map(str, invalid_splits[:50])))

    hash_leaks = [key for key, values in hashes.items() if len(values) > 1]
    group_leaks = [key for key, values in groups.items() if len(values) > 1]
    identity_leaks = {
        column: [key for key, values in mapping.items() if len(values) > 1]
        for column, mapping in identity_splits.items()
    }
    identity_leaks = {k: v for k, v in identity_leaks.items() if v}
    if hash_leaks:
        errors.append(f"exact_hash_cross_split_leakage:{len(hash_leaks)}")
    if group_leaks:
        errors.append(f"group_id_cross_split_leakage:{len(group_leaks)}")
    for column, values in identity_leaks.items():
        errors.append(f"{column}_cross_split_leakage:{len(values)}")

    populated_identity = {
        column: sum(bool(_clean(row.get(column))) for row in rows)
        for column in FIELD_ID_COLUMNS if column in headers
    }
    has_explicit_field_group = populated_identity.get("field_group_id", 0) == len(rows) and bool(rows)
    has_plant_and_site = (
        (populated_identity.get("plant_id", 0) == len(rows) or populated_identity.get("vine_id", 0) == len(rows))
        and (populated_identity.get("farm_id", 0) == len(rows) or populated_identity.get("site_id", 0) == len(rows))
        and populated_identity.get("session_id", 0) == len(rows)
        and bool(rows)
    )
    field_independent_ready = has_explicit_field_group or has_plant_and_site
    if not field_independent_ready:
        warnings.append("pHash_or_source_grouping_is_not_field_independent")
        warnings.append("missing_complete_field_identity:need_field_group_id_or_plant_vine_plus_site_farm_and_session")
    if require_field_independent and not field_independent_ready:
        errors.append("field_independent_split_required_but_field_identity_incomplete")

    if require_expert_labels:
        if not {"label_status", "reviewer_id"}.issubset(headers):
            errors.append("expert_label_columns_missing")
        else:
            bad = [i for i, row in enumerate(rows, start=2)
                   if _clean(row.get("label_status")) != "expert_confirmed" or not _clean(row.get("reviewer_id"))]
            if bad:
                errors.append(f"non_expert_or_unreviewed_labels:{len(bad)}")

    if require_manual_masks:
        if "leaf_mask_path" not in headers:
            errors.append("leaf_mask_path_column_missing")
        else:
            missing_masks = sum(not _clean(row.get("leaf_mask_path")) for row in rows)
            if missing_masks:
                errors.append(f"manual_leaf_masks_missing:{missing_masks}")

    if not any(_clean(row.get("source_license")) for row in rows):
        warnings.append("source_license_not_recorded")
    if not any(_clean(row.get("source_dataset")) for row in rows):
        warnings.append("source_dataset_not_recorded")

    all_classes = sorted({label for counts in class_counts.values() for label in counts})
    class_distribution = {
        split: {label: class_counts[split].get(label, 0) for label in all_classes}
        for split in sorted(split_counts)
    }
    if "test" not in split_counts:
        warnings.append("no_test_split_present")
    if "test" in split_counts and len(class_counts["test"]) != len(all_classes):
        warnings.append("test_split_missing_one_or_more_classes")

    status = "blocked" if errors else ("near_duplicate_only_not_field_independent" if not field_independent_ready else "field_grouped_manifest_audited")
    return {
        "schema_version": 1,
        "status": status,
        "rows": len(rows),
        "split_counts": dict(sorted(split_counts.items())),
        "class_distribution": class_distribution,
        "unique_source_sha256": len(hashes),
        "unique_group_ids": len(groups),
        "exact_hash_cross_split_leakage_count": len(hash_leaks),
        "group_id_cross_split_leakage_count": len(group_leaks),
        "field_identity_populated_rows": populated_identity,
        "field_independent_ready": field_independent_ready,
        "identity_cross_split_leakage": {k: len(v) for k, v in identity_leaks.items()},
        "blank_field_counts": dict(sorted(blank_counts.items())),
        "errors": errors,
        "warnings": warnings,
        "claims_allowed": {
            "near_duplicate_isolation": not hash_leaks and not group_leaks and not invalid_splits and not errors,
            "field_independent_evaluation": field_independent_ready and not identity_leaks and not errors,
            "expert_confirmed_labels": bool(require_expert_labels and not any("expert" in e or "label" in e for e in errors)),
            "manual_leaf_segmentation": bool(require_manual_masks and not any("mask" in e for e in errors)),
            "diagnostic_or_production_readiness": False,
        },
        "note": "This audit validates manifest structure and split separation only. It does not establish label correctness, mask quality, diagnostic accuracy, or production readiness.",
    }


def read_manifest(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--require-field-independent", action="store_true")
    parser.add_argument("--require-expert-labels", action="store_true")
    parser.add_argument("--require-manual-masks", action="store_true")
    args = parser.parse_args()

    report = audit_rows(read_manifest(args.manifest), args.require_field_independent,
                        args.require_expert_labels, args.require_manual_masks)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": report["status"], "rows": report["rows"],
                      "errors": report["errors"], "warnings": report["warnings"],
                      "output": str(args.output)}, ensure_ascii=False, indent=2))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
