# Browser-based ONNX disease classification

Dr Plant already has a deterministic color-screening pipeline. This optional ONNX adapter provides a separate local-inference path without changing the meaning of the existing screening result.

## Why the supplied snippet was not copied verbatim

- The model link and its exact artifact, class order, license, preprocessing and output tensor were not verified as a matching MobileNetV3-Small bundle.
- Stretching a leaf image to a square can distort symptoms; this adapter uses a documented center-crop contract.
- A fixed softmax cutoff such as 0.55 is not a calibrated confidence threshold.
- A generic disease name cannot safely be mapped to treatment instructions. The adapter never returns pesticide or treatment advice.
- The crop must be selected explicitly. A leaf-disease classifier is not a plant-species detector.
- Image quality checks are retained as a separate gate and are not treated as evidence that the model is correct.

## Current status

The app now ships experimental bundle v0.2.0 with three crop routes: French grape leaf and tomato use a 128px PlantVillage multi-crop MobileNetV3-Small ONNX; citrus uses a 160px Field-Based Citrus Leaf Disease MobileNetV3-Small ONNX. Route-specific manifests, labels, preprocessing, score/margin gates, and validation notes are stored under `public/models/plant-disease/`. Other crops use color-based preliminary screening. This bundle is not a Syrian-validated unified model.

## Browser runtime

Use ONNX Runtime Web (MIT) from its official package. Copy the `ort.min.js` and matching WASM distribution assets to `public/vendor/onnxruntime/`. The app loads these local assets only when a model is enabled. It sets one WASM thread for predictable memory/CPU use on lower-end Android devices.

## Model requirements

Each route manifest defines input size/layout, RGB channel order, normalization, model-specific resize mode (`stretch` or `center_crop`), output type, and validation report. The output label list must exactly match the graph output dimension. A class without a reviewed knowledge-base disease record may appear only as an experimental placeholder with no treatment details. Unsupported crops return an explicit unsupported status rather than being assigned a neighbouring crop's class.

## Promotion policy

A candidate can run in the app only when the manifest explicitly opts into `pilotMode`; the output remains an experimental possible match and never becomes a confirmed diagnosis. The current multi-model bundle exposes only selected source classes; weak classes are suppressed and the app abstains on unsupported outputs. Scores are raw and uncalibrated, and source Healthy is never a health confirmation. Promotion into a validated diagnostic model requires expert-reviewed local field images, group-disjoint splits by farm/season, external testing across phone cameras, per-class sensitivity/specificity, calibrated rejection, and Syrian coastal evaluation.

## References

- [ONNX Runtime Web installation and browser support](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- [ONNX Runtime JavaScript API](https://onnxruntime.ai/docs/api/js/)
- [PlantVillage edge-computing MobileNetV3-Small research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10748432/)
