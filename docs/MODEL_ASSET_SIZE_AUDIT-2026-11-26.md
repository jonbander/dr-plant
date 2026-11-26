# Dr.Plant model asset size audit — 2026-11-26

This is a byte-level inventory of model files present in the research branch. It is not a statement that any candidate is approved for production.

## Browser/ONNX candidates

| Specialist | Deployable ONNX artifact | Bytes | MiB | Notes |
|---|---|---:|---:|---|
| Multi-crop PlantVillage V2 | `results/multicrop-plantvillage-v2/model-output-refined/plantvillage-full-multicrop-mobilenetv3-small.onnx` | 6,236,849 | 5.948 | 38 classes; controlled-source research model |
| Lemon V3 | `results/lemon-v3/lemon-v3-mobilenetv3-small-embedded.onnx` | 6,415,735 | 6.119 | Embedded ONNX; 18 classes; Bangladesh white-background source |
| Citrus Field V3 | `results/citrus-field-v3/citrus-field-v3-mobilenetv3-small-embedded.onnx` | 6,358,335 | 6.064 | Embedded ONNX; 4 classes; single Moroccan orchard/campaign |

Combined ONNX payload for these three distinct candidates: **19,010,919 bytes = 18.131 MiB** (about 19.0 MB decimal), before labels, manifests, ONNX Runtime/WASM, application code, icons, fonts, and other assets.

## External-data ONNX variants

Lemon V3 and Citrus Field V3 also have split ONNX files of approximately 0.29 MiB plus external `.onnx.data` files of approximately 5.8 MiB each. They must be deployed as a matched pair; counting only the small `.onnx` file would materially understate the model size. Embedded variants avoid this two-file packaging requirement.

## Other research artifacts are not currently deployable browser models

- NGLD V5 continual-learning candidate is currently a PyTorch checkpoint in the verified Drive research bundle; it is not included in the three-model ONNX total and has not passed independent validation.
- The checked-in `results/ngld-v5/` baseline also contains PyTorch checkpoints, not an ONNX export.
- Plasmopara V2 and other research checkpoints are not to be added to the app bundle until their contracts, export, labels, and validation gates are completed.

## Packaging recommendation

1. Keep the APK/app shell separate from model weights where practical.
2. Offer an initial small install and download only the selected specialist packs; retain them for offline use after download.
3. Download packs only over an explicit user action or Wi-Fi preference, verify SHA-256 before activation, and keep the previous known-good pack for rollback.
4. Store model metadata (version, checksum, input contract, label map, evidence status, source/license, minimum runtime version) with each pack.
5. Do not enable any model for production diagnosis merely because its artifact is packaged. Current research candidates remain blocked from production by the registry's field-validation, expert-review, calibration, and unknown-rejection gates.

## Measurement method

Sizes were read from the checked-out repository files with Python `Path.stat().st_size`; MiB uses 1,048,576 bytes. This audit excludes duplicate copies, `.pt` training checkpoints, datasets, manifests, and training logs from the three-model runtime payload total.
