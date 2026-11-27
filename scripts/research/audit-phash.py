#!/usr/bin/env python3
"""Compute a documented DCT perceptual hash and audit near-duplicate leakage.

Algorithm drplant-dct-phash-v1:
- ImageMagick auto-orient, flatten transparency on white, grayscale, Lanczos resize 32x32.
- Unnormalised 2-D DCT-II; retain top-left 8x8 coefficients.
- Threshold all 64 coefficients against their median; serialize row-major as 16 hex chars.
- Compare hashes by Hamming distance; project default review threshold is <= 6.

This is a project-defined versioned procedure, not a universal pHash standard.
"""
import argparse
import csv
import json
import shutil
import subprocess
import sys
from collections import Counter
from pathlib import Path
from math import cos, pi

HASH_SIZE = 8
IMAGE_SIZE = 32
ALGORITHM = 'drplant-dct-phash-v1'


def dct_vector(values):
    n = len(values)
    return [2.0 * sum(values[j] * cos(pi * (2 * j + 1) * k / (2 * n)) for j in range(n)) for k in range(n)]


def phash(image_path, convert='convert'):
    cmd = [convert, str(image_path), '-auto-orient', '-background', 'white', '-alpha', 'remove',
           '-colorspace', 'Gray', '-filter', 'Lanczos', '-resize', f'{IMAGE_SIZE}x{IMAGE_SIZE}!',
           '-depth', '8', 'gray:-']
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(f'image_decode_failed:{image_path}:{result.stderr.decode(errors="replace")[:200]}')
    if len(result.stdout) != IMAGE_SIZE * IMAGE_SIZE:
        raise RuntimeError(f'unexpected_pixel_buffer:{image_path}:{len(result.stdout)}')
    pixels = [list(result.stdout[i*IMAGE_SIZE:(i+1)*IMAGE_SIZE]) for i in range(IMAGE_SIZE)]
    # DCT on rows, then columns; separable DCT-II.
    rows = [dct_vector(row) for row in pixels]
    cols = [[rows[y][x] for y in range(IMAGE_SIZE)] for x in range(IMAGE_SIZE)]
    transformed_cols = [dct_vector(col) for col in cols]
    coeff = [[transformed_cols[x][y] for x in range(IMAGE_SIZE)] for y in range(IMAGE_SIZE)]
    low = [coeff[y][x] for y in range(HASH_SIZE) for x in range(HASH_SIZE)]
    ordered = sorted(low)
    median = (ordered[31] + ordered[32]) / 2.0
    bits = 0
    for value in low:
        bits = (bits << 1) | int(value > median)
    return f'{bits:016x}'


def hamming(a, b):
    return (int(a, 16) ^ int(b, 16)).bit_count()

def classify_status(pairs):
    if any(pair['cross_split'] for pair in pairs):
        return 'FAIL'
    return 'REVIEW_REQUIRED' if pairs else 'PASS'


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('manifest', type=Path)
    ap.add_argument('--image-root', required=True, type=Path)
    ap.add_argument('--image-path-col', default='image_path')
    ap.add_argument('--phash-col', default='phash')
    ap.add_argument('--split-col', default='split')
    ap.add_argument('--label-col', default='label')
    ap.add_argument('--threshold', type=int, default=6)
    ap.add_argument('--output', type=Path, required=True, help='CSV copy with computed pHash column')
    ap.add_argument('--report', type=Path, required=True)
    ap.add_argument('--pairs-report', type=Path, required=True)
    ap.add_argument('--convert', default='convert')
    a = ap.parse_args()
    if shutil.which(a.convert) is None:
        raise RuntimeError(f'imagemagick_convert_not_found:{a.convert}')
    with a.manifest.open(newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fields = list(reader.fieldnames or [])
    for col in (a.image_path_col, a.split_col, a.label_col):
        if col not in fields:
            raise ValueError(f'missing_column:{col}')
    if not rows:
        raise ValueError('empty_manifest')
    root = a.image_root.resolve()
    errors = []
    hashes = []
    for i, row in enumerate(rows, start=2):
        rel = Path(row.get(a.image_path_col, ''))
        image = (root / rel).resolve()
        try:
            image.relative_to(root)
        except ValueError:
            errors.append(f'row_{i}:path_escapes_image_root:{rel}')
            hashes.append('')
            continue
        if not image.is_file():
            errors.append(f'row_{i}:image_not_found:{rel}')
            hashes.append('')
            continue
        try:
            hashes.append(phash(image, a.convert))
        except Exception as exc:
            errors.append(f'row_{i}:{exc}')
            hashes.append('')
    if errors:
        report = {'status': 'FAIL', 'algorithm': ALGORITHM, 'rows': len(rows), 'errors': errors}
        a.report.parent.mkdir(parents=True, exist_ok=True)
        a.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2

    for row, value in zip(rows, hashes):
        row[a.phash_col] = value
    if a.phash_col not in fields:
        fields.append(a.phash_col)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    with a.output.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fields, lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)

    pairs = []
    distance_counts = Counter()
    for i in range(len(rows)):
        for j in range(i + 1, len(rows)):
            distance = hamming(hashes[i], hashes[j])
            if distance <= a.threshold:
                left, right = rows[i], rows[j]
                pair = {
                    'image_a': left[a.image_path_col], 'image_b': right[a.image_path_col],
                    'label_a': left[a.label_col], 'label_b': right[a.label_col],
                    'split_a': left[a.split_col], 'split_b': right[a.split_col],
                    'hamming_distance': distance,
                    'cross_split': left[a.split_col].strip().lower() != right[a.split_col].strip().lower(),
                    'cross_label': left[a.label_col].strip() != right[a.label_col].strip(),
                }
                pairs.append(pair)
                distance_counts[distance] += 1
    cross_split = [p for p in pairs if p['cross_split']]
    cross_label = [p for p in pairs if p['cross_label']]
    status = classify_status(pairs)
    pair_fields = ['image_a','image_b','label_a','label_b','split_a','split_b','hamming_distance','cross_split','cross_label']
    a.pairs_report.parent.mkdir(parents=True, exist_ok=True)
    with a.pairs_report.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=pair_fields, lineterminator='\n')
        writer.writeheader()
        writer.writerows(pairs)
    version = subprocess.run([a.convert, '-version'], capture_output=True, text=True).stdout.splitlines()[0]
    report = {
        'status': status, 'algorithm': ALGORITHM, 'implementation': version,
        'image_size': IMAGE_SIZE, 'hash_size': HASH_SIZE, 'threshold_hamming': a.threshold,
        'rows': len(rows), 'unique_phashes': len(set(hashes)),
        'near_duplicate_pairs': len(pairs), 'cross_split_pairs': len(cross_split),
        'cross_label_pairs': len(cross_label), 'distance_counts': dict(sorted(distance_counts.items())),
        'output_manifest': str(a.output), 'pairs_report': str(a.pairs_report),
        'scope_note': 'Every near-duplicate pair requires review. Cross-split pairs fail split isolation; same-split pairs still require deduplication/review, and cross-label pairs require label review. This audit does not prove vineyard IDs are biologically correct.'
    }
    a.report.parent.mkdir(parents=True, exist_ok=True)
    a.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 2 if status == 'FAIL' else 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, RuntimeError) as exc:
        print(json.dumps({'status': 'FAIL', 'error': str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        sys.exit(2)
