# Model Card — Plasmopara V2 exploratory baseline

- **Task:** binary image classification (dataset folder labels: Disease / Healthy)
- **Architecture:** MobileNetV3-Small, ImageNet pretrained, final two feature blocks fine-tuned
- **Input:** RGB 128×128, ImageNet normalization
- **Dataset:** Zenodo 10.5281/zenodo.17368692, CC BY 4.0; 280 originals only
- **Split:** stratified image-level 70/15/15 (196/42/42); no plant/vine/site/session grouping available
- **Metrics:** validation accuracy 88.10%; test accuracy 73.81%; test macro-F1 73.79%
- **Known confounding:** Healthy images mostly carry iPad Pro EXIF dated 2024-07-10; most Disease images lack EXIF. This is severe source/class confounding.
- **Label status:** inherited source folder labels; no independent expert review
- **Out of scope:** Syrian vineyard field diagnosis, disease severity, treatment recommendations, app deployment
- **Decision:** research-only; blocked from production integration pending independent multi-site/plant evaluation and expert review
