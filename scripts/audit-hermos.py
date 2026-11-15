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
import math
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def text(parent: ET.Element, path: str) -> str:
    node = parent.find(path)
    return (node.text or "").strip() if node is not None else ""


def parse_positive_dimension(value: str) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and number > 0 else None


def parse_box(obj: ET.Element, width: float | None, height: float | None):
    box = obj.find("bndbox")
    if box is None:
        return None
    try:
        coords = [float(text(box, key)) for key in ("xmin", "ymin", "xmax", "ymax")]
    except (TypeError, ValueError):
        return None
    xmin, ymin, xmax, ymax = coords
    if not all(math.isfinite(value) for value in coords):
        return None
    if xmin < 0 or ymin < 0 or xmin >= xmax or ymin >= ymax:
        return None
    if width is not None and xmax > width:
        return None
    if height is not None and ymax > height:
        return None
    return coords


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path, help="Extracted dataset directory")
    parser.add_argument("--out", type=Path, required=True, help="Output directory")
    args = parser.parse_args()
    root = args.root.resolve()
    out = args.out.resolve()
    if not root.is_dir():
        parser.error(f"Not a directory: {root}")
    if out == root or root in out.parents:
        parser.error("Output directory must be outside the extracted dataset directory")
    out.mkdir(parents=True, exist_ok=True)

    images = sorted(
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in IMAGE_EXTS
    )
    xmls = sorted(
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() == ".xml"
    )
    xml_by_stem: dict[str, list[Path]] = {}
    for path in xmls:
        xml_by_stem.setdefault(path.stem.casefold(), []).append(path)
    image_by_stem: dict[str, list[Path]] = {}
    for path in images:
        image_by_stem.setdefault(path.stem.casefold(), []).append(path)

    class_object_counts: Counter[str] = Counter()
    class_image_counts: Counter[str] = Counter()
    hashes: dict[str, list[str]] = {}
    rows = []
    parse_errors = []
    invalid_boxes = []
    matched_xml = set()
    object_total = 0
    usable_boxes = 0
    images_with_valid_xml = 0
    images_with_objects = 0

    for image_path in images:
        rel = image_path.relative_to(root).as_posix()
        digest = sha256(image_path)
        hashes.setdefault(digest, []).append(rel)
        candidates = xml_by_stem.get(image_path.stem.casefold(), [])
        same_stem_images = image_by_stem.get(image_path.stem.casefold(), [])
        xml_path = candidates[0] if len(candidates) == 1 and len(same_stem_images) == 1 else None
        labels = []
        width_text = height_text = ""
        xml_parse_ok = False
        pairing_status = (
            "missing_xml" if not candidates else
            "ambiguous_xml_stem" if len(candidates) > 1 else
            "ambiguous_image_stem" if len(same_stem_images) > 1 else
            "paired"
        )

        if xml_path:
            matched_xml.add(xml_path)
            try:
                annotation = ET.parse(xml_path).getroot()
                xml_parse_ok = True
                images_with_valid_xml += 1
                width_text = text(annotation, "size/width")
                height_text = text(annotation, "size/height")
                width = parse_positive_dimension(width_text)
                height = parse_positive_dimension(height_text)
                for obj_index, obj in enumerate(annotation.findall("object"), start=1):
                    name = text(obj, "name") or "UNNAMED"
                    labels.append(name)
                    object_total += 1
                    class_object_counts[name] += 1
                    if parse_box(obj, width, height) is not None:
                        usable_boxes += 1
                    else:
                        invalid_boxes.append({
                            "image": rel,
                            "xml": xml_path.relative_to(root).as_posix(),
                            "object_index": obj_index,
                            "label": name,
                        })
                if labels:
                    images_with_objects += 1
                    class_image_counts.update(set(labels))
            except (ET.ParseError, OSError, ValueError) as exc:
                pairing_status = "xml_parse_error"
                parse_errors.append({
                    "xml": xml_path.relative_to(root).as_posix(),
                    "image": rel,
                    "error": str(exc),
                })

        rows.append({
            "relative_path": rel,
            "sha256": digest,
            "xml_path": xml_path.relative_to(root).as_posix() if xml_path else "",
            "xml_match_count": len(candidates),
            "xml_parse_ok": "yes" if xml_parse_ok else "no",
            "pairing_status": pairing_status,
            "width_from_xml": width_text,
            "height_from_xml": height_text,
            "labels": "|".join(sorted(set(labels))),
            "object_count": len(labels),
            "provenance_verified": "no",
            "expert_label_review": "no",
            "near_duplicate_review": "no",
            "group_id_for_split": "",
            "split": "",
        })

    duplicate_groups = [paths for paths in hashes.values() if len(paths) > 1]
    orphan_xml = sorted(
        path.relative_to(root).as_posix()
        for path in xmls if path not in matched_xml
    )
    unmatched_images = [
        row["relative_path"] for row in rows
        if row["pairing_status"] != "paired" or row["xml_parse_ok"] != "yes"
    ]
    report = {
        "dataset": "HERMOS",
        "source": "https://data.mendeley.com/datasets/j4xs3kh3fd/2",
        "license_claimed_by_landing_page": "CC BY 4.0",
        "archive_version_observed": "",
        "root": str(root),
        "image_files": len(images),
        "xml_files": len(xmls),
        "images_with_valid_xml": images_with_valid_xml,
        "unmatched_or_ambiguous_or_unparseable_images": unmatched_images,
        "orphan_xml_files": orphan_xml,
        "parsed_objects": object_total,
        "valid_bbox_objects": usable_boxes,
        "invalid_bbox_count": len(invalid_boxes),
        "class_object_counts": dict(sorted(class_object_counts.items())),
        "class_image_counts": dict(sorted(class_image_counts.items())),
        "images_with_objects": images_with_objects,
        "exact_duplicate_sha256_groups": duplicate_groups,
        "xml_parse_errors": parse_errors,
        "invalid_boxes": invalid_boxes,
        "limitations": [
            "This script checks structure and exact-byte duplicates, not visual near-duplicates; every image starts with near_duplicate_review=no.",
            "Object counts and image counts are reported separately; one image may contain multiple objects.",
            "A unique image and XML filename stem is required for pairing; duplicate image or XML stems are marked ambiguous rather than guessed.",
            "It does not verify biological correctness of labels or source-image licensing.",
            "It cannot infer vineyard, plant, date, or acquisition-session groups; fill group_id_for_split from verified metadata before splitting.",
            "Image dimensions are read from XML only; the script does not inspect actual image dimensions.",
            "Do not treat its output as approval to train until manual sampling and provenance/license review are complete.",
        ],
    }

    fields = [
        "relative_path", "sha256", "xml_path", "xml_match_count", "xml_parse_ok",
        "pairing_status", "width_from_xml", "height_from_xml", "labels", "object_count",
        "provenance_verified", "expert_label_review", "near_duplicate_review", "group_id_for_split", "split",
    ]
    with (out / "hermos-manifest.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    (out / "hermos-audit-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({key: report[key] for key in (
        "image_files", "xml_files", "images_with_valid_xml",
        "unmatched_or_ambiguous_or_unparseable_images", "parsed_objects",
        "valid_bbox_objects", "invalid_bbox_count", "class_object_counts",
        "class_image_counts", "exact_duplicate_sha256_groups",
    )}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
