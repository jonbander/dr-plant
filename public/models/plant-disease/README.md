# Plant disease model bundle

The active bundle is an **experimental French-grape Esca screening pilot**, not a validated general disease classifier.

- Model: `grape-esca-pilot.onnx`
- Version: `grape-esca-pilot-v0.1.0`
- Ordered labels: `labels.json` (`Esca`, then source-labeled `Healthy`)
- Runtime manifest: `manifest.json`
- Validation report: `validation-report.json`
- Training configuration (partial): `training-config.json`
- Model card: `MODEL_CARD.md`

The model is limited to Esca-like leaf patterns vs the source's Healthy class. A no-Esca output is **not** a healthy diagnosis. Other grape diseases are not recognized. The score is not calibrated. Syrian coastal field validation has not been performed.

Model and dataset attribution: Shikalgar et al. (2026), GVLiD, Mendeley Data V5, DOI 10.17632/wkymf8bhcg.5, CC BY 4.0.

ONNX Runtime Web 1.22.0 is MIT-licensed. Runtime assets are vendored under `public/vendor/onnxruntime/`.

Representative failure cases are recorded in `failure-report.json`. The training checkpoint is retained in the verified Drive archive linked from `MODEL_CARD.md`; the app-serving ONNX artifact is embedded and versioned in this repository.
