# ONNX plant-disease model bundle

The classifier is intentionally disabled in `manifest.json`. Do not enable it by changing a flag alone.

## Required files

- `model.onnx`: exact model artifact whose architecture and input/output contract have been verified.
- `labels.json`: ordered output classes. Each entry must include `id`, `labelAr`, and an existing `cropId`. Disease classes must also include a `diseaseId` that exists in the app knowledge base and targets that crop. Healthy classes use `healthy: true`.
- `manifest.json`: model-specific preprocessing and validation metadata.

## ONNX Runtime Web assets

Place the matching ONNX Runtime Web distribution files under `public/vendor/onnxruntime/`:
- `ort.min.js`
- the WASM files from the same package version (including the SIMD single-thread WASM binary used by the selected build).

The application loads the runtime locally, so inference does not send leaf photos to a third-party service. Do not mix runtime JavaScript and WASM files from different versions.

## Manifest promotion gate

A candidate model stays disabled / research-only until all of the following are documented:

1. Source URL, exact version/revision, file checksum and license for both model weights and training data.
2. Input dimensions, channel layout, color order, resizing/cropping policy, normalization, output tensor and exact ordered labels verified against the exported graph.
3. Every output class mapped to an existing crop and, where applicable, a disease entry whose target crop includes that crop.
4. Independent evaluation on field photographs from the Syrian coast, grouped by orchard/site, plant and capture session to prevent leakage.
5. Per-crop and per-class precision/recall, macro-F1, confusion matrix, class coverage and failure analysis.
6. Probability calibration and crop-specific rejection thresholds reviewed on a separate validation set. Raw softmax output is not a calibrated confidence score.
7. A plant-health reviewer approves the disease-label mapping and the validation report is checked into the repository.

Only then may `reviewStatus` become `validated`, `thresholdsReviewed` become `true`, and `enabled` become `true`.

## Scope and safety

- PlantVillage-trained models are not automatically valid for coastal Syrian field photos; controlled-background datasets can have substantial domain shift.
- The current app catalog contains many crops without reviewed disease mappings. A model only supports the crops explicitly listed in its labels.
- Crop selection is required; this classifier does not identify the plant species.
- A healthy-class output means only that none of the model's known disease classes scored highest; it does not prove the plant is healthy.
- No pesticide, dose, spray schedule or treatment suggestion is generated from model output.
- This is image classification, not lesion localization or object detection.
