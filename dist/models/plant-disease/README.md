# Dr.Plant — experimental multi-model image screening bundle

This bundle routes the selected crop to a matching ONNX model. It is a research/pilot feature, not an expert diagnosis system.

## Active routes

| Crop selected in app | Model | Supported source classes |
|---|---|---|
| French grape leaf | PlantVillage multi-crop v2, 38 outputs | Esca-like, Isariopsis leaf blight, source Healthy (Black Rot is suppressed due weak recall) |
| Syrian coastal citrus | Field-Based Citrus Leaf Disease V3 | California red scale-like, greasy spot-like, greening-like, source apparently healthy |
| Tomato | PlantVillage multi-crop v2, 38 outputs | Bacterial spot, Tomato Yellow Leaf Curl Virus, Tomato mosaic virus, source Healthy |

The shared PlantVillage model contains 38 output classes. The app exposes only the classes above with stronger source-test metrics; other outputs force abstention rather than being displayed as a disease candidate.

## Evidence and limitations

- PlantVillage multi-crop v2: 54,304 images / 38 classes / 14 crops; group-isolated source holdout. Overall test accuracy 89.36%, macro-F1 86.68%. This is controlled-background imagery, not field validation. The grape Black Rot class has weak source-test recall (62.71%) and is suppressed by the app; a top prediction in this class causes abstention.
- Citrus Field V3: CC BY 4.0 dataset, 611 source images, with a tree-disjoint test of 134 images. Test accuracy 86.57%, macro-F1 85.76%. Source collection was in Fes-Meknes, Morocco; labels include visual “-like” classes.
- Tomato route exposes only higher-scoring classes from the source report; weaker classes are deliberately hidden and lead to an uncertain result.
- No route has been validated on Syrian coastal farms, local cultivars, or real phone-camera samples at scale.
- Scores are raw softmax outputs, not calibrated probabilities. They are never displayed as diagnostic accuracy.
- A source “Healthy” class means only that the model did not select one of its learned disease classes. It is not proof that the plant is healthy.
- A separate 80-image grape subset probe (20 images per class) at the 0.90 score gate accepted 48 images; 47 were correct and 1 was wrong (97.9% among accepted, 60% coverage). This small source-image probe is not a field validation or a guarantee of real-world accuracy. The app does not infer crop automatically, does not recommend pesticides or doses, and must abstain when the selected crop conflicts with the model's top class or the score/margin gate.

## Data licensing and attribution

- PlantVillage full multi-crop data card: CC0 1.0, inherited from the upstream PlantVillage release. Cite Mohanty, Hughes & Salathé (2016), *Using deep learning for image-based plant disease detection*, DOI: 10.3389/fpls.2016.01419. The data card notes that it is a curated re-release of the upstream color images.
- Field-Based Citrus Leaf Disease Dataset V3: CC BY 4.0, DOI: 10.17632/szsms728jf.3. Attribute Wafae Hamdaoui and the dataset authors; images were collected in Fes-Meknes, Morocco.
- ONNX Runtime Web 1.22.0: MIT.

## Runtime

- ONNX Runtime Web 1.22.0, WASM backend, one thread.
- Preprocessing is model-specific: square resize (stretch) to 128px for PlantVillage and 160px for citrus, RGB, ImageNet normalization, NCHW.
- Models are cached for offline use by the PWA service worker.

## Rollback

Set `enabled` to `false` in `manifest.json` to disable all neural routes and retain the app's color/symptom screening. The previous Esca-only pilot remains in Git history and in `research/models/archive/`.
