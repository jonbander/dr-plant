# Citrus Leaf Disease Dataset — Zenodo V1 exploratory baseline

**Status:** archived research-only three-class abnormality model; not a complete citrus diagnostic model.

## Source and task

- Zenodo record: [10.5281/zenodo.11148332](https://doi.org/10.5281/zenodo.11148332). The current Rights field could not be independently confirmed; license status is **unverified**.
- Classification archive: 1,944 images; filename-derived counts: Anthracnose 221, Canker 341, Leaf Miner 1,382.
- The archive contains no healthy class. A separate COCO/YOLO archive is a detection task and was not mixed into this image classifier.
- Labels were derived from filename prefixes; Dr.Plant has not independently confirmed pathogen identity. No biological site/plant/session holdout is available.

## Exploratory training result

- Architecture: ImageNet-pretrained MobileNetV3-Small.
- Split: 1,305 train / 277 validation / 281 test; image-level, not independent by site/plant/session.
- Classes: `Anthracnose`, `Canker`, `Leaf Miner`.
- Test accuracy: 98.93%; macro-F1: 98.01%.
- ONNX export passed ONNX checker and ONNX Runtime validation.

The high source-domain score must not be treated as Syrian orchard accuracy or proof of pathogen identity. In particular, because there is no healthy class, this model cannot decide whether an apparently normal leaf is healthy or detect an unrepresented disease. Do not use it for field diagnosis, pesticide selection, or treatment advice.

## Files and redistribution decision

- Aggregate audit and source metadata only: `research/2026-11/citrus-leaf-disease-zenodo-v1/`
- Aggregate metrics only: `results/citrus-leaf-disease-zenodo-v1/metrics.json`

The source images, image-level manifests, model weights and ONNX export are not included in main because the current Zenodo Rights field could not be verified. They remain in the unmerged research branch pending license confirmation. Do not redistribute or activate this model until rights are established.
