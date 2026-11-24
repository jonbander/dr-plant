# Model card — Dr.Plant multi-model pilot v0.2.0

## Intended use
Research-only visual screening for selected leaf crops. Results are candidate visual patterns, not disease confirmations, and must not drive pesticide or treatment decisions.

## Routes and evidence

### French grape leaf — PlantVillage multi-crop v2
- 38 output classes; app only exposes Esca-like, Isariopsis leaf blight and source Healthy; Black Rot is suppressed.
- Overall source test accuracy 89.36%, macro-F1 86.68% on 10,948 source test images.
- Per-class F1: Black Rot 0.755 (recall 0.627), Esca 0.867, leaf blight 0.967, healthy 0.955.
- The app suppresses Black Rot and uses a conservative raw-score gate (0.90) because the initial browser smoke test showed Black Rot images could be mistaken for Esca. A separate 80-image source subset probe accepted 48 images, with 47 correct and 1 wrong (97.9% among accepted; 60% coverage). This small probe is exploratory only, not field validation.

### Syrian coastal citrus — Field-Based Citrus Leaf Disease V3
- Four source classes: California red scale-like, greasy spot-like, apparently healthy, greening-like.
- Tree-disjoint test: 134 images; accuracy 86.57%, macro-F1 85.76%.
- Source region: Fes-Meknes, Morocco. Not a Syrian validation set.

### Tomato — PlantVillage multi-crop v2
- App exposes only Bacterial Spot (source F1 0.821), Tomato Yellow Leaf Curl Virus (F1 0.949), Tomato mosaic virus (F1 0.863) and source Healthy (F1 0.893).
- Other tomato categories are suppressed because their source-test F1 was weaker; a suppressed top class results in abstention.

## Known limitations
- No model has Syrian coastal field validation or external local-cultivar validation.
- PlantVillage images have controlled backgrounds; domain shift to phone photos is expected.
- Citrus labels include “-like” categories and are visual labels, not all laboratory-confirmed pathogens.
- The model does not cover many important local problems, including grape downy/powdery mildew and mites, citrus scab/leafminer/gummosis/medfly, and numerous nutrient or abiotic disorders.
- Raw softmax scores are not calibrated probabilities. Thresholds are conservative experimental gates only.
- Source Healthy is never a healthy-plant diagnosis.

## Safety
Always show the experimental warning, allow abstention, and request expert review. Never prescribe a chemical or dose from model output.
