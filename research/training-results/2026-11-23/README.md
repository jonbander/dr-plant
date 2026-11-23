# Dr Plant — research training results (23 November 2026)

This branch adds two source-specific exploratory model baselines trained from images not used in the earlier project runs.

## Download the full artifacts

[Download the complete training bundle from Google Drive](https://drive.google.com/file/d/1MpCyZOyeeIw8UJRfnAHh1rvgU2UJLI0a/view?usp=sharing)

The ZIP includes both PyTorch checkpoints, ONNX models and external-weight sidecars, evaluation summaries, training logs, split manifests and dataset-specific model cards. The original image datasets are not redistributed in this bundle.

SHA-256:
`d766428011616b3596287f65564a5d5dc28653a6338842c101c279ec847d3b1c`

## GVLiD V5 — grape Esca / Healthy

- Source: [Mendeley Data, DOI 10.17632/wkymf8bhcg.5](https://doi.org/10.17632/wkymf8bhcg.5), CC BY 4.0.
- Source archive: 3,477 images. Due to 1,344 folder/metadata label conflicts and duplicate issues, only 1,323 images with verified provenance and expert-review flags were retained; extracted file SHA-256 values matched the curated manifest.
- Retained labels: Esca (885), Healthy (438). Black Rot and Leaf Blight were excluded pending source clarification.
- Vineyard-disjoint split: 953 train / 195 validation / 175 test, with four held-out test vineyards.
- MobileNetV3-Small, 160 px, 8 epochs, CPU.
- Best validation accuracy: 100%. Held-out test accuracy: 99.43%. Macro-F1: 99.29%.
- ONNX Runtime CPU evaluation reproduced the held-out test metrics.

## Citrus Leaf Disease Dataset — three classes

- Source: [Zenodo 11148332 v1](https://doi.org/10.5281/zenodo.11148332), source states CC BY 4.0.
- 1,863 unique SHA-256 images retained; 81 extra exact copies excluded. 16 perceptual near-duplicate pairs were grouped before splitting.
- Classes: Anthracnose, Canker, Leaf Miner. There is no Healthy class.
- Grouped split: 1,192 train / 298 validation / 373 test. No detected near-duplicate group crosses splits.
- MobileNetV3-Small, 160 px, 8 epochs, CPU.
- Best validation accuracy: 96.31%. Held-out test accuracy: 96.51%. Macro-F1: 93.13%. Balanced accuracy: 92.75%.
- ONNX Runtime CPU inference across all 373 test images reproduced the PyTorch metrics.

## Limitations — read before reuse

- These are exploratory source-specific baselines, not validated field diagnostic models.
- Neither model has been tested on Syrian coastal field images.
- GVLiD's full four-class dataset remains blocked because of source label conflicts; only the safe two-class subset was used.
- Citrus labels were inherited from source folders/filenames and were not independently expert-reviewed by Dr Plant. No orchard/site metadata was available; grouping only prevents known near-duplicate leakage, not farm leakage.
- Neither model is integrated into the app's production multi-disease classifier. Do not use these models for pesticide decisions.

See `gvlid-v5/metrics.json` and `citrus-leaf-disease/metrics.json` for machine-readable metrics and limitations.
