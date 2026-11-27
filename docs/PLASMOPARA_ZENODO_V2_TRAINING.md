# Plasmopara viticola image baseline — Zenodo v2

**Status:** completed exploratory training; not production-ready and not independent by vineyard/site/plant.

## Source and archive verification

- Dataset: *A dataset for early detection and classification of Plasmopara disease*, Zenodo v2.
- DOI: `10.5281/zenodo.17368692`
- Source: https://zenodo.org/records/17368692
- License status: **unverified**. The current Zenodo Rights field could not be independently confirmed; do not redistribute model weights or source-image manifests.
- Archive: `Plasmopara Dataset.zip`, 1,026,640,779 bytes.
- MD5 verified: `a1f372d90a5277d5bd5d6dc4e30169a7`.
- Download location: `/workspace/dr-plant/data/external/2026-11/plasmopara-zenodo-v2/`.

## Audit findings

| Item | Result |
|---|---:|
| Original disease images | 129 |
| Original healthy images | 151 |
| Total original images found | 280 |
| Claimed count on record | 281 |
| Readable images | 280 |
| Exact duplicate groups | 0 |
| Perceptual near-duplicate pairs (pHash Hamming <=6) | 0 |
| Pre-augmented derivatives excluded | 1,600 |

The archive contains 800 augmented Disease images and 800 augmented Healthy images. These were excluded from training because source-to-derivative lineage is not documented and derivatives must not be allowed to cross evaluation splits. The archive has 280 originals, one fewer than the 281 stated on the landing page; author clarification remains desirable.

EXIF contains GPS on only 14/129 Disease images and 134/151 Healthy images. Coverage is incomplete and class-imbalanced. It does not provide reliable per-image vineyard, plant, session or country grouping. The dataset description mentions Spain and Norway, but these locations cannot be assigned to every image. No Dr Plant plant-pathologist review has been completed.

Audit artifacts:

- `research/2026-11/plasmopara-zenodo-v2/source-metadata.json`
- `research/2026-11/plasmopara-zenodo-v2/image-manifest.csv`
- `research/2026-11/plasmopara-zenodo-v2/exploratory-splits.csv`
- `research/2026-11/plasmopara-zenodo-v2/near-duplicate-pairs.csv`
- `research/2026-11/plasmopara-zenodo-v2/audit-report.json`
- Audit script: `scripts/audit_plasmopara_zenodo_v2.py`

## Exploratory training

- Architecture: MobileNetV3-Small, ImageNet pretrained.
- Seed: 42.
- Epochs: 8.
- Batch size: 16.
- Learning rate: 0.0003.
- Image size at model input: 224 x 224.
- Split: 196 train / 42 validation / 42 test, stratified by class; exact and perceptual near-duplicate groups kept together.
- Grouping limitation: image/near-duplicate cluster only; not independent by vineyard, plant, session or country.

| Metric | Result |
|---|---:|
| Best validation accuracy | 88.10% |
| Exploratory test accuracy | 95.24% |
| Exploratory test macro-F1 | 95.23% |

Confusion matrix, order `[Disease, Healthy]`:

```text
[[19, 0],
 [ 2,21]]
```

The 42-image test set is small. These figures describe only this within-source exploratory split and must not be described as accuracy on unseen vineyards or Syrian fields. The class label `Disease` is the dataset's own Plasmopara-infected label; it is not an independent laboratory diagnosis by Dr Plant.

## ONNX export and validation

The originating research branch recorded an ONNX export and parity check, but the model weights and ONNX file are not redistributed in `main` because the dataset license could not be verified. Aggregate metrics are retained only.

## Decision

Keep the aggregate result as a historical research note only. Do not redistribute or use the originating model weights until the dataset license is verified. Even after rights are confirmed, the model remains blocked by the small image-level split, incomplete GPS coverage, missing biological grouping, and lack of independent expert review.
