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

The adapter and tests are committed as a foundation, but the runtime and model bundle are not shipped. The manifest is disabled and labels are empty. The current scanner therefore continues to use the existing non-diagnostic color screening until a compatible, licensed ONNX artifact and ordered labels are added and independently validated.

## Browser runtime

Use ONNX Runtime Web (MIT) from its official package. Copy the `ort.min.js` and matching WASM distribution assets to `public/vendor/onnxruntime/`. The app loads these local assets only when a model is enabled. It sets one WASM thread for predictable memory/CPU use on lower-end Android devices.

## Model requirements

The model manifest defines input size/layout, RGB channel order, normalization, center-crop resize, output type, source and license. The output label list must exactly match the graph output dimension. Disease IDs must exist in the Dr Plant knowledge base and include the selected crop in their target list. Unsupported crops return an explicit unsupported status rather than being assigned a neighbouring crop's class.

## Promotion policy

A candidate can be run for research only; it cannot produce an accepted disease match. Promotion requires independent coastal field evaluation and calibrated crop-specific thresholds. The UI must not display raw softmax as a confidence percentage. Even a validated model result remains a possible match, not a confirmed diagnosis.

## References

- [ONNX Runtime Web installation and browser support](https://onnxruntime.ai/docs/get-started/with-javascript/web.html)
- [ONNX Runtime JavaScript API](https://onnxruntime.ai/docs/api/js/)
- [PlantVillage edge-computing MobileNetV3-Small research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10748432/)
