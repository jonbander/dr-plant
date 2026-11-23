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

The adapter, local ONNX Runtime Web 1.22.0 WASM assets, and a 160px MobileNetV3-Small model bundle are now shipped for a narrow experimental French-grape Esca pilot. The manifest is enabled only with `reviewStatus: candidate` and `pilotMode: true`. It runs only when the user explicitly selects French grape leaves. It does not replace the unified multi-crop model; other crops still use color-based preliminary screening.

## Browser runtime

Use ONNX Runtime Web (MIT) from its official package. Copy the `ort.min.js` and matching WASM distribution assets to `public/vendor/onnxruntime/`. The app loads these local assets only when a model is enabled. It sets one WASM thread for predictable memory/CPU use on lower-end Android devices.

## Model requirements

The model manifest defines input size/layout, RGB channel order, normalization, center-crop resize, output type, source and license. The output label list must exactly match the graph output dimension. Disease IDs must exist in the Dr Plant knowledge base and include the selected crop in their target list. Unsupported crops return an explicit unsupported status rather than being assigned a neighbouring crop's class.

## Promotion policy

A candidate can run in the app only when the manifest explicitly opts into `pilotMode`; the output remains an experimental possible match and never becomes a confirmed diagnosis. The current Esca pilot has only two source classes and cannot identify other grape diseases. It uses a raw score threshold, displays that score as uncalibrated, and never labels a no-Esca result as healthy. Promotion into the unified model requires a new fixed independent test, external Esca-positive field images, no material per-class regression, calibrated crop-specific rejection, and Syrian coastal evaluation.

## References

- [ONNX Runtime Web installation and browser support](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- [ONNX Runtime JavaScript API](https://onnxruntime.ai/docs/api/js/)
- [PlantVillage edge-computing MobileNetV3-Small research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10748432/)
