# Multi-Fruit Leaf Image Dataset V1 — original-only leaf-condition baseline

**Status:** 18-class exploratory condition classifier trained and exported. This is not a disease-only model and not independent by orchard/site/plant.

## Source and download

- Dataset: Multi-Fruit Leaf Image Dataset: Guava, Jackfruit, Mango, and Olive.
- DOI: `10.17632/82vn9k44ky.1`
- Source: https://data.mendeley.com/datasets/82vn9k44ky/1
- License: CC BY 4.0.
- The outer Mendeley archive is 818,654,658 bytes and contains two nested archives: Original Dataset.zip (100,461,868 bytes) and Augmented Dataset.zip (722,313,080 bytes), plus two class-count CSVs.
- To avoid downloading 18,000 augmented derivatives, only the original-only nested ZIP was retrieved using HTTP range requests.
- Original ZIP SHA-256: `142d2227cadea31ac5b139edfaadd446181b4a1a7fe6eaa8b92cfe5c9a6e02ee`.
- Download location: `/workspace/dr-plant/data/external/2026-11/multi-fruit-original/`.

## Audit

- 2,308 original images across 18 classes; all readable.
- No exact SHA-256 duplicates.
- 283 perceptual near-duplicate pairs at pHash Hamming distance <=6.
- 228 image paths involved in cross-label near-duplicate pairs were quarantined; same-label near-duplicate clusters were kept together in the split.
- No EXIF GPS on many images. Olive and guava EXIF GPS values show strong single-location clustering rather than independent multi-orchard coverage. Exact coordinates have been withheld from the public manifests and audit records. Several other classes have no GPS.
- All files have EXIF, but camera/date patterns are strongly tied to classes. These source-specific capture conditions can inflate image-level metrics.
- The outer CSV contains class totals only, not per-image location records. The description's per-image metadata claim could not be confirmed from the downloaded original-only archive.
- The source includes 18,000 augmented images; all were excluded.
- Cross-source comparison against NGLD v5, Plasmopara v2 and ESCA v1 found zero exact or pHash-near pairs (Hamming <=6).

Audit artifacts:

- `research/2026-11/multi-fruit-original-v1/source-metadata.json`
- `research/2026-11/multi-fruit-original-v1/image-manifest.csv`
- `research/2026-11/multi-fruit-original-v1/unique-image-manifest.csv`
- `research/2026-11/multi-fruit-original-v1/exploratory-splits.csv`
- `research/2026-11/multi-fruit-original-v1/near-duplicate-pairs.csv`
- `research/2026-11/multi-fruit-original-v1/quarantined-cross-label-near-duplicates.csv`
- `research/2026-11/multi-fruit-original-v1/audit-report.json`
- Cross-source review: `research/2026-11/cross-source-multifruit-duplicate-review.csv`
- Audit script: `scripts/audit_multi_fruit_original_v1.py`

## Training

- Task: leaf condition / health-state classification across four fruit crops; not a verified pathogen-only taxonomy.
- Architecture: MobileNetV3-Small, ImageNet pretrained.
- Seed 42; 8 epochs; batch 16; learning rate 0.0003; inverse-frequency class-weighted cross entropy.
- Split: 1,454 train / 315 validation / 311 test; perceptual clusters kept within one split.
- Site/plant independent split: unavailable; only exploratory image-level split.

| Metric | Result |
|---|---:|
| Best validation accuracy | 93.65% |
| Exploratory test accuracy | 91.96% |
| Exploratory test macro-F1 | 90.52% |

The Olive test subset is small (8–20 images per class). Confusion between Olive Healthy and Olive Mild Edge Damage remains visible. The dataset is from Bangladesh, and the class labels include senescence, young leaves, edge damage and pest damage, not only confirmed diseases. Do not use this model to diagnose olive pathogens.

## ONNX validation

- Checkpoint: `results/multi-fruit-original-v1/best-model.pt`.
- ONNX: `results/multi-fruit-original-v1/multi-fruit-condition-mobilenetv3-small.onnx`.
- ONNX checker: passed; ONNX Runtime: passed.
- Maximum absolute difference: `1.9669532775878906e-06`; argmax agreement: identical.

## Decision

Retain as a separate exploratory leaf-condition model. Do not merge its labels into the disease classifier or activate it as a diagnostic model. The Olive labels may be used as auxiliary visual-condition data only after expert review and external validation in olive groves outside the source capture site.
