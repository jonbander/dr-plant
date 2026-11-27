# GVLiD V5 — curated Esca vs Healthy baseline

Source: Mendeley Data DOI `10.17632/wkymf8bhcg.5`, version 5, CC BY 4.0.

## Dataset gate and curation
- Source archive: 3,477 images; metadata contains 3,477 rows.
- The archive's folder labels and metadata disagree on 1,344 files. In addition, the audit found extensive exact duplicates (446 duplicate groups / 1,514 files) and three cross-label duplicate groups.
- Only the 1,323 rows in `research/2026-11/gvlid-v5/image-manifest.csv` were admitted. Every admitted row is marked `provenance_verified=yes` and `expert_label_review=yes`, and each extracted file's SHA-256 was checked against the manifest.
- Admitted classes: Esca (885) and Healthy (438). Black Rot and Leaf Blight were not included because the strict audit did not leave a verified, duplicate-safe subset for them.
- Exact SHA-256 overlap with the existing ESCA V1, NGLD V5 and Plasmopara V2 manifests: zero. This is not a claim that perceptual near-duplicates across all sources have been fully excluded.

## Grouped split
Vineyard-disjoint split (28 vineyards):
- Train: 20 vineyards, 953 images (622 Esca, 331 Healthy)
- Validation: 4 vineyards, 195 images (136 Esca, 59 Healthy)
- Test: 4 vineyards (Vineyard_1, Vineyard_8, Vineyard_15, Vineyard_22), 175 images (127 Esca, 48 Healthy)

## Training
- MobileNetV3-Small transfer learning, CPU, image size 160, 8 epochs, batch 16.
- Best checkpoint: epoch 6 (first epoch to reach the top validation accuracy).
- Best validation accuracy: 100% (195 images).
- Held-out test accuracy: 99.43% (174/175).
- Held-out test macro-F1: 99.29%.
- Confusion matrix, class order [Esca, Healthy]: `[[126, 1], [0, 48]]`.
- ONNX model exported and CPU inference validated; see `results/mobilenetv3-small/`.

## Important limitations
This is an exploratory, source-specific two-class model, not a complete grape disease classifier. The high score is based on four held-out vineyards from the same dataset and requires independent replication. The source is not Syrian coastal field data. Do not replace or merge this checkpoint into the app's multi-disease classifier without further validation, label harmonization, confidence calibration, unknown-class rejection, and a separate Syrian field test.

The original ZIP contained split counts and vineyard IDs in the training summary but no per-image split assignment. `research/2026-11/gvlid-v5/split-manifest.csv` is therefore a deterministic reconstruction from the documented test/validation vineyard IDs; see `split-reconstruction.json`. It reproduces all reported split and class counts but is not represented as the original training-time split file.

This curated GVLiD model is distinct from the older `grape-esca-pilot-v0.1.0.onnx` artifact, whose separate failure report remains in `research/models/archive/`.
