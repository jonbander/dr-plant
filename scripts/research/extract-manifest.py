#!/usr/bin/env python3
"""Normalize an existing CSV/JSON source manifest without inventing metadata.

Path-map JSON format:
  {"paths": {"old/exact/path.jpg": "new/path.jpg"},
   "prefixes": {"/old/root/": "images/"}}

Example (CSV):
  python scripts/research/extract-manifest.py --input source.csv \
    --output research/manifests/grape.csv --dataset-id gvlid_v5 \
    --crop grape --image-col image_path --label-col class_label \
    --group-col vineyard_id --split-col split --source-id GVLiD_V5 \
    --group-evidence 'source archive: ...; verified vineyard/block IDs' \
    --path-map research/manifests/path_map.json --image-root data/external

The tool preserves source labels, group IDs, splits, and hashes. It never
creates missing group IDs or hashes. Use --verify-images to require every
mapped image to exist and recompute SHA-256 from its actual bytes.
"""
import argparse
import csv
import hashlib
import json
import sys
from pathlib import Path

COLUMNS = [
    'dataset_id', 'image_path', 'sha256', 'phash', 'group_id', 'source_id',
    'crop', 'label', 'split', 'annotation_type', 'annotation_ref', 'license_ref'
]


def load_rows(path):
    suffix = path.suffix.lower()
    if suffix == '.csv':
        with path.open(newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            return list(reader), list(reader.fieldnames or [])
    if suffix == '.json':
        obj = json.loads(path.read_text(encoding='utf-8'))
        if isinstance(obj, list):
            rows = obj
        elif isinstance(obj, dict):
            rows = next((obj[k] for k in ('rows', 'images', 'items', 'manifest')
                         if isinstance(obj.get(k), list)), None)
            if rows is None:
                raise ValueError('JSON must be a list or contain rows/images/items/manifest list')
        else:
            raise ValueError('Unsupported JSON manifest structure')
        if not all(isinstance(row, dict) for row in rows):
            raise ValueError('Every JSON manifest row must be an object')
        cols = sorted({key for row in rows for key in row})
        return rows, cols
    raise ValueError('Input must be .csv or .json')


def map_path(value, mapping):
    value = (value or '').strip()
    if not mapping or not value:
        return value
    exact = mapping.get('paths', {})
    if value in exact:
        return exact[value]
    for old, new in sorted(mapping.get('prefixes', {}).items(), key=lambda kv: len(kv[0]), reverse=True):
        if value.startswith(old):
            return new.rstrip('/') + '/' + value[len(old):].lstrip('/')
    return value


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--input', required=True, type=Path)
    ap.add_argument('--output', required=True, type=Path)
    ap.add_argument('--dataset-id', required=True)
    ap.add_argument('--crop', required=True, choices=['grape', 'citrus', 'tomato'])
    ap.add_argument('--image-col', required=True)
    ap.add_argument('--label-col', required=True)
    ap.add_argument('--group-col', required=True)
    ap.add_argument('--split-col', required=True)
    ap.add_argument('--source-col')
    ap.add_argument('--source-id', help='Constant source ID, used only if source-col is absent')
    ap.add_argument('--sha-col')
    ap.add_argument('--phash-col')
    ap.add_argument('--annotation-type-col')
    ap.add_argument('--annotation-ref-col')
    ap.add_argument('--license-col')
    ap.add_argument('--license-ref')
    ap.add_argument('--path-map', type=Path)
    ap.add_argument('--image-root', type=Path)
    ap.add_argument('--verify-images', action='store_true', help='Require every image to exist under image-root and recompute SHA-256')
    ap.add_argument('--group-evidence', required=True, help='Human-readable provenance for the meaning of group IDs')
    ap.add_argument('--report', type=Path)
    a = ap.parse_args()

    if not a.input.is_file():
        ap.error(f'input_not_found: {a.input}')
    if a.verify_images and not a.image_root:
        ap.error('--verify-images requires --image-root')
    rows, cols = load_rows(a.input)
    mapping = json.loads(a.path_map.read_text(encoding='utf-8')) if a.path_map else {}
    required = [a.image_col, a.label_col, a.group_col, a.split_col]
    if a.source_col:
        required.append(a.source_col)
    if a.sha_col:
        required.append(a.sha_col)
    if a.phash_col:
        required.append(a.phash_col)
    missing_cols = [col for col in required if col not in cols]
    if missing_cols:
        raise ValueError('missing_source_columns:' + ','.join(missing_cols))
    if not rows:
        raise ValueError('empty_source_manifest')

    out_rows = []
    errors = []
    split_counts = {}
    missing_group = missing_image = 0
    hashes_recomputed = 0
    for index, row in enumerate(rows, start=2):
        image_path = map_path(str(row.get(a.image_col) or ''), mapping)
        group_id = str(row.get(a.group_col) or '').strip()
        label = str(row.get(a.label_col) or '').strip()
        split = str(row.get(a.split_col) or '').strip()
        if not group_id:
            missing_group += 1
            errors.append(f'row_{index}:missing_group_id')
        if not image_path:
            missing_image += 1
            errors.append(f'row_{index}:missing_image_path')
        if not label:
            errors.append(f'row_{index}:missing_label')
        if not split:
            errors.append(f'row_{index}:missing_split')
        split_counts[split] = split_counts.get(split, 0) + 1

        source_hash = str(row.get(a.sha_col) or '').strip().lower() if a.sha_col else ''
        if a.verify_images:
            actual = a.image_root / image_path
            if not actual.is_file():
                errors.append(f'row_{index}:image_not_found:{actual}')
            else:
                actual_hash = sha256_file(actual)
                if source_hash and source_hash != actual_hash:
                    errors.append(f'row_{index}:source_sha256_mismatch')
                source_hash = actual_hash
                hashes_recomputed += 1

        source_id = (str(row.get(a.source_col) or '').strip() if a.source_col else '') or (a.source_id or '')
        out_rows.append({
            'dataset_id': a.dataset_id,
            'image_path': image_path,
            'sha256': source_hash,
            'phash': str(row.get(a.phash_col) or '').strip() if a.phash_col else '',
            'group_id': group_id,
            'source_id': source_id,
            'crop': a.crop,
            'label': label,
            'split': split,
            'annotation_type': str(row.get(a.annotation_type_col) or '').strip() if a.annotation_type_col else '',
            'annotation_ref': str(row.get(a.annotation_ref_col) or '').strip() if a.annotation_ref_col else '',
            'license_ref': (str(row.get(a.license_col) or '').strip() if a.license_col else '') or (a.license_ref or ''),
        })

    report = {
        'status': 'EXTRACTION_FAILED' if errors else ('EXTRACTED_UNVERIFIED' if not a.verify_images else 'EXTRACTED_IMAGES_VERIFIED'),
        'input': str(a.input), 'output': str(a.output), 'rows': len(rows),
        'crop': a.crop, 'dataset_id': a.dataset_id,
        'source_columns': {'image': a.image_col, 'label': a.label_col, 'group': a.group_col, 'split': a.split_col},
        'group_evidence': a.group_evidence,
        'path_map': str(a.path_map) if a.path_map else None,
        'split_counts': split_counts, 'missing_group_ids': missing_group,
        'missing_image_paths': missing_image, 'hashes_recomputed_from_files': hashes_recomputed,
        'errors': errors,
        'warning': 'Extraction is not scientific approval. Confirm group semantics, source lineage, licensing, and split suitability separately.'
    }
    if errors:
        text = json.dumps(report, ensure_ascii=False, indent=2)
        print(text)
        if a.report:
            a.report.parent.mkdir(parents=True, exist_ok=True)
            a.report.write_text(text + '\n', encoding='utf-8')
        return 2

    a.output.parent.mkdir(parents=True, exist_ok=True)
    with a.output.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(out_rows)
    if a.report:
        a.report.parent.mkdir(parents=True, exist_ok=True)
        a.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({'status': 'FAIL', 'error': str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(2)
