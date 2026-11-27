# Niphad Grape Leaf Disease Dataset V5 — exploratory training

**Status:** exploratory four-class baseline trained and exported; not production-ready and not independent by vineyard/site/plant.

## Source and license

- Dataset: Niphad Grape Leaf Disease Dataset (NGLD), version 5.
- DOI: `10.17632/8nnd2ypcv3.5`
- Source: https://data.mendeley.com/datasets/8nnd2ypcv3/5
- License shown on the dataset page: CC BY 4.0.
- Archive size: 25,960,266 bytes.
- SHA-256: `7b4b4f426e258ac0a317a72d399c1c22da4bc105aa8b65526391a413719b62aa`.
- Download location: `/workspace/dr-plant/data/external/2026-11/ngld-mendeley-v5/`.

## Audit

| Class | Archive images | Unique SHA images |
|---|---:|---:|
| Bacterial Leaf Spot | 100 | 100 |
| Downy Mildew | 966 | 966 |
| Healthy Leaves | 1,254 | 921 |
| Powdery Mildew | 406 | 406 |
| **Total** | **2,726** | **2,393** |

- 327 exact-duplicate groups contained 660 files; 333 extra copies were quarantined, retaining one canonical file per SHA-256 group.
- 415 perceptual near-duplicate pairs were found at pHash Hamming distance <=6. Same-label clusters were kept together in the split.
- Four images in two cross-label near-duplicate pairs were quarantined for manual review.
- No EXIF metadata was present in the audited image files.
- No verified orchard, plant, capture-session or country IDs are provided by the source. Labels have not been independently reviewed by a Dr Plant plant pathologist.
- Cross-source duplicate comparison against the current ESCA v1 and Plasmopara v2 image manifests found zero exact or pHash-near pairs (Hamming <=6). Other old corpora still require comparison before final consolidated training.

Audit artifacts:

- `research/2026-11/ngld-mendeley-v5/source-metadata.json`
- `research/2026-11/ngld-mendeley-v5/image-manifest.csv`
- `research/2026-11/ngld-mendeley-v5/unique-image-manifest.csv`
- `research/2026-11/ngld-mendeley-v5/exploratory-splits.csv`
- `research/2026-11/ngld-mendeley-v5/near-duplicate-pairs.csv`
- `research/2026-11/ngld-mendeley-v5/quarantined-exact-duplicates.csv`
- `research/2026-11/ngld-mendeley-v5/quarantined-cross-label-near-duplicates.csv`
- `research/2026-11/ngld-mendeley-v5/audit-report.json`
- Cross-source review: `research/2026-11/cross-source-grape-duplicate-review.csv`
- Audit script: `scripts/audit_ngld_mendeley_v5.py`

## Training

- Architecture: MobileNetV3-Small, ImageNet pretrained.
- Seed: 42; epochs: 8; batch size: 16; learning rate: 0.0003.
- Loss: inverse-frequency class-weighted cross entropy.
- Split: 1,659 train / 380 validation / 350 test. Perceptual near-duplicate clusters kept within one split.
- This is an image-level/near-duplicate-cluster exploratory split, not a vineyard/plant/session holdout.

| Metric | Result |
|---|---:|
| Best validation accuracy | 98.68% |
| Exploratory test accuracy | 98.29% |
| Exploratory test macro-F1 | 97.96% |

Confusion matrix, order `[Bacterial Leaf Spot, Downy Mildew, Healthy Leaves, Powdery Mildew]`:

```text
[[15, 0,   0,  0],
 [ 1,141,  3,  0],
 [ 0,  0, 130,  0],
 [ 0,  2,   0, 58]]
```

The test set contains only 15 Bacterial Leaf Spot images. The unusually high image-level scores may reflect source-specific backgrounds or repeated acquisition conditions. No claim is made about performance on unseen vineyards or Syrian grape varieties.

## ONNX validation

- Checkpoint: `results/ngld-mendeley-v5/best-model.pt`.
- ONNX: `results/ngld-mendeley-v5/ngld-mobilenetv3-small.onnx`.
- ONNX checker: passed.
- ONNX Runtime: passed.
- Max absolute difference: `5.4836273193359375e-06`.
- Argmax agreement: identical.

## Decision

Retain as a research baseline only. Do not activate in the app or merge directly with the Plasmopara/ESCA classifiers. Before consolidated retraining, verify the class taxonomy, obtain expert label review, compare with all old image corpora, and reserve a site/plant/season-independent evaluation set. In particular, `Bacterial Leaf Spot` should remain a source-specific class until its pathogen label is independently confirmed.
