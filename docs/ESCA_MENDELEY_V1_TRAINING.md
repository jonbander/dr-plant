# ESCA-dataset V1 — exploratory training record

- Source: Mendeley Data DOI `10.17632/89cnxc58kj.1` (Italy), CC BY 4.0.
- Archive: 1,770 JPEG images and 1,770 annotation rows.
- Labels: 888 Esca, 882 Healthy. Two near-duplicate healthy images were quarantined after a 64-bit DCT pHash screen (Hamming distance <= 5); final: 888 Esca, 880 Healthy.
- Split: stratified image-ID split, seed 42; train 1,237 / validation 265 / test 266. There are no verified vineyard, plant, or capture-session group IDs, so this is **not an independent vineyard/plant validation**.
- Model: ImageNet-pretrained MobileNetV3-Small, 10 epochs, batch 16.
- Best validation accuracy: 100.00%.
- Image-level test accuracy: 99.62%; macro-F1: 99.62% (test n=266).
- Confusion matrix, rows/columns `[Esca, Healthy]`: `[[134,0],[1,131]]`.
- Export: `esca-mobilenetv3-small.onnx`; ONNX checker and ONNX Runtime passed. PyTorch/ORT parity on 3 random tensors: max absolute difference `7.45e-7`, argmax identical.

## Interpretation / restrictions

These results are an exploratory within-source result only. The unusually high score may reflect source-specific visual cues and cannot be treated as evidence of field performance, generalization to unseen vineyards, or Syrian grape disease accuracy. The checkpoint is **not integrated into the production app**. It must not be used as a production diagnosis model without independent field validation and a calibrated abstention/uncertainty policy.

## Files

- `research/2026-11/esca-mendeley-v1/audit-report.json`
- `research/2026-11/esca-mendeley-v1/image-manifest.csv`
- `research/2026-11/esca-mendeley-v1/quarantined-images.csv`
- `research/2026-11/esca-mendeley-v1/splits/training-splits.csv`
- `results/esca-mendeley-v1/metrics.json`
- `results/esca-mendeley-v1/best-model.pt`
- `results/esca-mendeley-v1/esca-mobilenetv3-small.onnx`
- `results/esca-mendeley-v1/esca-mobilenetv3-small.validation.json`

## Pending source audits

GVLiD V5 is downloaded but blocked: folder labels and metadata disagree for 1,344 images, with extensive exact duplicates. Do not train until the authors clarify the correct labels/archive. Other pending candidates (Portugal 2026 grape, Plasmopara 2025, Olive Denizli, Morocco Olive, Turkey PlantDiseaseNet, OPTIMA) still require download/license/provenance and task-compatibility audits. Detection/UAV/fruit datasets stay separate from leaf classification.
