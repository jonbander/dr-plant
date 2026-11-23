# Dr Plant — research training results (23 November 2026)

This branch documents three source-specific exploratory model baselines trained from images not used in earlier project runs.

## Download the complete model bundle

[Download the full training bundle from Google Drive](https://drive.google.com/file/d/1I66zrshhVEvnM_pqnPlAYPf6gnYDK3wm/view?usp=sharing) (33 MB).

The ZIP contains PyTorch checkpoints, ONNX models and external-weight sidecars, evaluation summaries, training logs, split manifests, audit manifests and dataset-specific READMEs. Original image datasets are not redistributed.

SHA-256:
`61a5291c13f3d81c0aeef912eabe1137182b123f84c245fd8ab8adfac44cbd02`

## GVLiD V5 — grape Esca / Healthy

- Source: [Mendeley Data, DOI 10.17632/wkymf8bhcg.5](https://doi.org/10.17632/wkymf8bhcg.5), CC BY 4.0.
- Source archive: 3,477 images. Due to 1,344 folder/metadata label conflicts and duplicate issues, only 1,323 images with verified provenance and expert-review flags were retained.
- Retained labels: Esca (885), Healthy (438). Black Rot and Leaf Blight were excluded pending source clarification.
- Vineyard-disjoint split: 953 train / 195 validation / 175 test, with four held-out test vineyards.
- MobileNetV3-Small, 160 px, 8 epochs, CPU.
- Held-out test accuracy: 99.43%. Macro-F1: 99.29%.
- ONNX Runtime CPU evaluation reproduced held-out metrics.

## Citrus Leaf Disease Dataset — three classes

- Source: [Zenodo 11148332 v1](https://doi.org/10.5281/zenodo.11148332), source states CC BY 4.0.
- 1,863 unique SHA-256 images retained; 81 exact duplicate copies excluded. 16 perceptual near-duplicate pairs grouped before splitting.
- Classes: Anthracnose, Canker, Leaf Miner. There is no Healthy class.
- Grouped split: 1,192 train / 298 validation / 373 test.
- MobileNetV3-Small, 160 px, 8 epochs, CPU.
- Held-out test accuracy: 96.51%. Macro-F1: 93.13%. Balanced accuracy: 92.75%.
- ONNX Runtime CPU inference reproduced metrics on all 373 test images.

## Grape Leaf Health Classification — five classes, raw originals only

- Source: [Mendeley Data 378c69nwk5 v1](https://data.mendeley.com/datasets/378c69nwk5/1), CC BY 4.0.
- Streamed only the raw `Process_Images` folder from the 3.01 GB archive; augmented derivatives were excluded. Archive inventory: 3,001 raw entries although the source description says 3,000.
- Exact SHA-256 deduplication removed 427 repeated copies, leaving 2,574 unique raw images: Black Rot 533, Brown Spot 748, Downy Mildew 313, Healthy 744, Mites 236.
- 34 perceptual near-duplicate pairs grouped before a 1,647 train / 412 validation / 515 test split. Exact SHA overlap with five previously trained source manifests: zero.
- MobileNetV3-Small with balanced sampling, 160 px, 12 epochs, CPU.
- Best validation macro-F1: 63.73%. Held-out test accuracy: 61.17%. Macro-F1: 55.08%. Balanced accuracy: 55.27%.
- ONNX Runtime CPU inference reproduced metrics on all 515 held-out images. This is a weak exploratory baseline, not a deployable diagnostic model.

## Limitations — read before reuse

- These are exploratory source-specific baselines, not validated field diagnostic models.
- None has been validated on Syrian coastal field images.
- GVLiD's full four-class dataset remains blocked because of source label conflicts; only the safe two-class subset was used.
- Citrus and Grape Leaf Health labels were inherited from source folders and were not independently expert-reviewed by Dr Plant. No orchard/site metadata was available for these datasets.
- None of these models is integrated into the app's production multi-disease classifier. Do not use these models for pesticide decisions.

See `gvlid-v5/metrics.json`, `citrus-leaf-disease/metrics.json`, and `grape-leaf-health/metrics.json` for machine-readable metrics. See `FINAL-TRAINING-REPORT.md` for the consolidated report.


## Phase 1 independent audit and additional evaluation

See [PHASE1-INDEPENDENT-AUDIT.md](./PHASE1-INDEPENDENT-AUDIT.md) and the machine-readable results in [phase1-audit](./phase1-audit/).

- Rechecked the Grape Leaf Health checkpoint and ONNX model: predictions agree on all 515 held-out images.
- Validation-fitted temperature scaling reduced test ECE from 0.120 to 0.057 without changing accuracy.
- MobileNet embedding retrieval did not yet improve macro-F1; it remains experimental.
- A cross-source GVLiD stress test exposed weak rejection of unseen grape diseases: 73.2% of those images were forced into the Healthy class.
- Citrus image files and the GVLiD row-level source/split manifests are not included in the current bundle, so those results need additional reproducibility artifacts before further promotion.
- DINOv2 benchmarking is deferred until storage and CPU runtime are safely planned. No model is field-ready or integrated into production.
