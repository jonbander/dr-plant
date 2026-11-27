# GVLiD V5 — curated Esca vs Healthy vineyard-holdout model

**Status: research-only — not enabled in the app.**

## Source and curation

- Source: [Mendeley Data DOI 10.17632/wkymf8bhcg.5, version 5](https://data.mendeley.com/datasets/wkymf8bhcg/5); the official source page lists CC BY 4.0.
- The original archive contains 3,477 images. The strict audit found 1,344 folder/metadata label conflicts, extensive exact duplicates and cross-label duplicate groups.
- Only 1,323 images with matching SHA-256, provenance flags, and review flags were retained. Classes: Esca 885 and Healthy 438. Black Rot and Leaf Blight were excluded.
- The public audit manifest and reconstructed split manifest are under `research/2026-11/gvlid-v5/`. Exact GPS values are blank.

## Vineyard-disjoint evaluation

The training summary specifies 28 vineyards, with the following fixed assignment:

- Train: 20 vineyards, 953 images (622 Esca, 331 Healthy)
- Validation: 4 vineyards, 195 images (136 Esca, 59 Healthy)
- Test: 4 held-out vineyards — Vineyard_1, Vineyard_8, Vineyard_15, Vineyard_22 — 175 images (127 Esca, 48 Healthy)

The per-image `split-manifest.csv` was reconstructed deterministically from the documented vineyard IDs and the audited image manifest because the original training ZIP contained only split counts and vineyard assignments in its summary, not a complete per-image split file. This reconstruction reproduces the reported counts, but it is not the original training-time split file.

## Model and results

- Architecture: ImageNet-pretrained MobileNetV3-Small, 160×160 input.
- Training: CPU, 8 epochs, batch size 16; best checkpoint at epoch 6.
- Best validation accuracy: 100% (195 images).
- Held-out test accuracy: **99.43% (174/175)**.
- Held-out test macro-F1: **99.29%**; balanced accuracy: **99.61%**.
- Confusion matrix, class order `[Esca, Healthy]`: `[[126, 1], [0, 48]]`.
- ONNX Runtime CPU inference was evaluated across all 175 test images and reproduced the PyTorch metrics. The ONNX graph uses an external `.onnx.data` sidecar; both files must be kept together.

## Limitations and use

This is a strong source-specific two-class benchmark, but it is not a complete grape disease classifier and is not Syrian coastal validation. The four test vineyards are held out within one Indian source dataset, not an independent multi-country or Syrian field campaign. Source label/provenance review flags are not a substitute for independent local plant-pathologist validation. Do not infer Esca from a leaf-only image, use this model to exclude other diseases, or recommend pesticide treatment.

This model is distinct from the older `grape-esca-pilot-v0.1.0.onnx` archived in `research/models/archive/`; that older pilot had documented false-positive limitations. This curated GVLiD model remains a research artifact and is not registered as a production route.

## Artifacts

- `results/gvlid-v5-clean-2class/best-model.pt`
- `results/gvlid-v5-clean-2class/gvlid-esca-healthy-mobilenetv3-small.onnx`
- `results/gvlid-v5-clean-2class/gvlid-esca-healthy-mobilenetv3-small.onnx.data`
- Metrics, test report, history, split counts, reconstruction report and checksums are in the same folder.
