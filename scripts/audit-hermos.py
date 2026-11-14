#!/usr/bin/env python3
"""Audit an extracted HERMOS Pascal VOC archive without modifying source files.

Usage:
  python scripts/audit-hermos.py /path/to/extracted-hermos --out /path/to/audit-output

Uses only the Python standard library. It hashes source images, checks image/XML
pairing, parses VOC objects and bounding boxes, and writes a provenance manifest
plus a machine-readable report. It does not decide whether labels are correct.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def text(parent: ET.Element, path: str) -> str:
    node = parent.find(path)
    return (node.text or "").strip() if node is not None else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path, help="Extracted dataset directory")
    parser.add_argument("--out", type=Path, required=True, help="Output directory")
    args = parser.parse_args()
    root = args.root.resolve()
    out = args.out.resolve()
    if not root.is_dir():
        parser.error(f"Not a directory: {root}")
    out.mkdir(parents=True, exist_ok=True)

    images = sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in IMAGE_EXTS)
    xmls = sorted(root.rglob("*.xml"))
    xml_by_stem = {}
    for p in xmls:
        xml_by_stem.setdefault(p.stem, []).append(p)

    class_counts: Counter[str] = Counter()
    hashes: dict[str, list[str]] = {}
    rows = []
    parse_errors = []
    invalid_boxes = []
    matched_xml = set()
    object_total = 0
    usable_boxes = 0
    for image_path in images:
        rel = image_path.relative_to(root).as_posix()
        digest = sha256(image_path)
        hashes.setdefault(digest, []).append(rel)
        candidates = xml_by_stem.get(image_path.stem, [])
        xml_path = candidates[0] if len(candidates) == 1 else None
        labels = []
        width = height = ""
        if xml_path:
            matched_xml.add(xml_path)
            try:
                tree = ET.parse(xml_path)
                annotation = tree.getroot()
                width = text(annotation, "size/width")
                height = text(annotation, "size/height")
                for obj in annotation.findall("object"):
                    name = text(obj, "name") or "UNNAMED"
                    object_total += 1
                    class_counts[name] += 1
                    box = obj.find("bndbox")
                    valid = False
                    if box is not None:
                        try:
                            xmin, ymin, xmax, ymax = [float(text(box, k)) for k in ("xmin", "ymin", "xmax", "ymax")]
                            valid = xmin < xmax and ymin < ymax
                            if width and height:
                                valid = valid and xmin >= 0 and ymin >= 0 and xmax <= float(width) and ymax <= float(height)
                        except ValueError:
                            valid = False
                    if valid:
                        usable_boxes += 1
                    else:
                        invalid_boxes.append({"image": rel, "label": name})
                    labels.append(name)
            except Exception as exc:
                parse_errors.append({"xml": xml_path.relative_to(root).as_posix(), "error": str(exc)})
        rows.append({
            "relative_path": rel,
            "sha256": digest,
            "xml_path": xml_path.relative_to(root).as_posix() if xml_path else "",
            "xml_match_count": len(candidates),
            "width_from_xml": width,
            "height_from_xml": height,
            "labels": "|".join(sorted(set(labels))),
            "object_count": len(labels),
            "provenance_verified": "no",
            "expert_label_review": "no",
            "group_id_for_split": "",
            "split": ""
        })

    duplicate_groups = [paths for paths in hashes.values() if len(paths) > 1]
    orphan_xml = sorted(p.relative_to(root).as_posix() for p in xmls if p not in matched_xml)
    unmatched_images = [r["relative_path"] for r in rows if not r["xml_path"] or r["xml_match_count"] != 1]
    report = {
        "dataset": "HERMOS",
        "source": "https://data.mendeley.com/datasets/j4xs3kh3fd/2",
        "license_claimed_by_landing_page": "CC BY 4.0",
        "archive_version_observed": "",
        "root": str(root),
        "image_files": len(images),
        "xml_files": len(xmls),
        "matched_images_with_one_xml": sum(1 for r in rows if r["xml_match_count"] == 1),
        "unmatched_or_ambiguous_images": unmatched_images,
        "orphan_xml_files": orphan_xml,
        "parsed_objects": object_total,
        "valid_bbox_objects": usable_boxes,
        "invalid_bbox_count": len(invalid_boxes),
        "class_object_counts": dict(sorted(class_counts.items())),
        "exact_duplicate_sha256_groups": duplicate_groups,
        "xml_parse_errors": parse_errors,
        "invalid_boxes": invalid_boxes,
        "limitations": [
            "This script checks structure and exact-byte duplicates, not visual near-duplicates.",
            "VOC object counts are not image-level class counts; one image may contain multiple objects.",
            "It does not verify biological correctness of labels or source-image licensing.",
            "It cannot infer vineyard, plant, date, or acquisition-session groups; fill group_id_for_split from verified metadata before splitting.",
            "Do not treat its output as approval to train until manual sampling and provenance/license review are complete."
        ]
    }
    with (out / "hermos-manifest.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]) if rows else [
            "relative_path", "sha256", "xml_path", "xml_match_count", "width_from_xml",
            "height_from_xml", "labels", "object_count", "provenance_verified",
            "expert_label_review", "group_id_for_split", "split"
        ])
        writer.writeheader()
        writer.writerows(rows)
    (out / "hermos-audit-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in (
        "image_files", "xml_files", "matched_images_with_one_xml", "parsed_objects",
        "valid_bbox_objects", "invalid_bbox_count", "class_object_counts",
        "exact_duplicate_sha256_groups"
    )}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
