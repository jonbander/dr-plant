# Grapevine Esca pilot v0.1.0

**Status:** experimental pilot candidate; not validated for Syrian coastal diagnosis and not integrated into the unified multi-crop model.

## Intended use

A narrow, offline visual-screening experiment for selected French-grape leaf images. It returns one of two model classes: an Esca-like foliar pattern or no clear Esca-like pattern detected. It is not a general grape disease classifier.

## Critical limitations

- The model was trained only on two source labels: `Esca` and `Healthy`.
- It does not identify downy mildew, powdery mildew, black rot, mites, nutrient deficiencies, or abiotic injury.
- “No Esca-like pattern detected” does **not** mean the leaf or vine is healthy.
- Training images are from Maharashtra, India, not the Syrian coast.
- There is no Syrian expert-reviewed field test and no external Esca-positive dataset in the current probe.
- The displayed score is raw softmax output, not a calibrated probability.
- No pesticide, dose, or treatment recommendation is produced.

## Data and license

GVLiD Mendeley Data V5, DOI [10.17632/wkymf8bhcg.5](https://data.mendeley.com/datasets/wkymf8bhcg/5), CC BY 4.0. Attribution: Shikalgar et al. (2026), GVLiD, Mendeley Data V5. The recovered image manifest and source inventory are in `research/training-results/2026-11-23/gvlid-recovery/`.

## Model details

- Architecture: MobileNetV3-Small
- Input: 160×160 RGB, NCHW
- Normalization: ImageNet mean/std
- Runtime: ONNX Runtime Web 1.22.0, WASM CPU, one thread
- Operating threshold: raw model score ≥0.85 and top-two margin ≥0.70. This is an exploratory screening gate, not a calibrated probability threshold.

## Evaluation

The restored vineyard-disjoint GVLiD test split contains 175 images and reproduced 174 correct argmax predictions (99.43% source-specific accuracy). An external Grape Leaf Health probe contains no Esca-positive images; at the pilot threshold it produced false Esca alerts on about 10.1% of the other-disease proxy images in its test split and none of the 149 healthy images. These figures are exploratory and do not establish Syrian field performance.

See [`validation-report.json`](./validation-report.json) and the full recovered audit under `research/training-results/2026-11-23/gvlid-recovery/`.

## Rollback

The previous app behavior was color-based screening only. Disable this pilot by setting `enabled` to `false` in `manifest.json` or revert the pilot integration commit. The prior behavior and model candidate artifacts are retained.

A representative browser-pipeline failure was recorded: one external Brown Spot image passed image-quality checks and received an Esca-like top-class score of 92%. A Black Rot example was rejected as uncertain at 76%. This demonstrates both the open-set false-positive risk and the rejection behavior; see `failure-report.json`. An approximate quality-gate replay accepted 271/515 external test images and rejected 244/515 for image quality, so some real field images may need retaking.

The source checkpoint is retained in the previously verified Drive archive [DrPlant-Training-Results-2026-11-23-v3.zip](https://drive.google.com/file/d/1I66zrshhVEvnM_pqnPlAYPf6gnYDK3wm/view?usp=sharing), archive SHA256 `61a5291c13f3d81c0aeef912eabe1137182b123f84c245fd8ab8adfac44cbd02`. The exact `best.pt` entry was extracted and its SHA256 verified as `41c5c17030ddfb5bf3a3d3bb73201237a9611ac75857d2190f36b8284bdc0307`.
