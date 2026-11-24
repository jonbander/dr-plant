# Dr.PLANT — Multi-symptom diagnosis and multi-disease early warning

**Roadmap status:** implementation foundation added; model training and field validation remain pending.

## Product requirement

Dr.PLANT must not treat plant disease as a color-only classification problem. The diagnostic system must learn both disease identity and observable symptoms, including structural deformation even when no obvious color lesion exists.

### Visual symptom ontology

Store symptoms as multi-label observations, independently from the causal diagnosis:

- **Color:** chlorosis/yellowing, interveinal chlorosis, browning, necrosis, blackening, bronzing, mosaic/mottling, water-soaked or oily appearance.
- **Shape and deformation:** upward/downward curling, rolling, wrinkling, crumpling, puckering, blistering, twisting, cupping, narrowing/elongation, abnormal leaf size, irregular margins, vein distortion.
- **Texture and surface:** powdery growth, rough/corky tissue, scarring, raised lesions, mines/galleries, brittleness, abnormal thickening, surface collapse.
- **Spatial pattern:** margin, tip, between veins, along veins, isolated spots, whole leaf, young flush versus mature foliage, upper versus lower leaf surface.
- **Context:** crop/species, cultivar where known, plant part, leaf age, growth stage, site, season, image quality, and whether symptoms occur on one leaf or across multiple plants.

A symptom label is not a disease label. Curling or wrinkling can arise from pathogens, mites/insects, herbicide drift, water stress, salinity, nutrient disorders, heat, or physical injury. Generic morphology must therefore produce symptom observations and a differential, not an automatic pathogen diagnosis.

## Model architecture experiments

1. Preserve the current MobileNetV3-Small baselines and all checkpoints.
2. Benchmark a frozen DINOv2 visual encoder with a lightweight linear/prototype head against the same leakage-controlled datasets. Do not fine-tune the foundation backbone by default; the current research evidence warns that full fine-tuning can harm cross-domain transfer.
3. Train separate heads for:
   - crop/species identification (where labels support it);
   - disease category (multi-class or hierarchical, source-aware);
   - visible symptom attributes (multi-label);
   - image/leaf quality and unknown/out-of-distribution rejection.
4. Compare a frozen DINOv2 teacher with a compact student (MobileNetV3 or another mobile CNN) using knowledge distillation only after teacher performance is independently established.
5. Keep object detection/segmentation as a separate task: detect individual leaves in complex field scenes before classifying them, without mixing leaf, fruit, bunch, and UAV labels into one target.
6. Report macro-F1, per-class precision/recall, balanced accuracy, calibration, unknown-detection AUROC/AUPR, selective risk/coverage, and cross-source performance. Never use a single aggregate accuracy as the promotion gate.

### Data policy

- FieldPlant is a high-priority field dataset candidate: its paper describes 5,170 plantation images and 8,629 annotated leaves across 27 disease classes, with pathologist-supervised annotation.
- PlantDoc is a useful in-the-wild benchmark, but its labels and source composition need auditing.
- PlantTom is a tomato-specific object-detection dataset candidate; augmented image counts must be distinguished from original independent images.
- Dataset candidates are not automatically training-ready. Verify archive identity, dataset-level and image-level rights, provenance, class ontology, expert label review, exact and perceptual duplicates, and group metadata before admission.
- Split by farm/site, plant and capture session, preferably season as well. Keep near-duplicates and augmented derivatives with their source group.
- Keep an audit manifest, hashes, source/version record, exclusion reasons, split report and model card for every run.
- Do not assume a field dataset collected in another country represents the Syrian coast.

## Multi-disease weather early warning

The weather feature must evolve from a single-disease panel into a crop-aware portfolio of disease-specific risk assessments.

### Required behavior

- The grower selects the crop (and, where possible, cultivar, growth stage, farm location and observed symptoms).
- Fetch hourly and recent weather once, then evaluate every disease profile registered for that crop.
- Return a ranked list of diseases with elevated weather-favourability indicators, the evidence behind each indicator, the forecast window, missing inputs and the reason for the alert.
- Keep risk categories disease-specific. Never copy the grape downy mildew 10:10:24 rule to powdery mildew, Botrytis, citrus scab, olive peacock spot, tomato early blight, potato late blight, rusts or other pathogens.
- Distinguish weather favourability from pathogen presence, infection probability, symptom diagnosis and treatment recommendation.
- If a profile is not calibrated or required inputs are missing, show “not yet assessable” rather than “low risk”.
- Combine weather with crop phenology, canopy/leaf wetness (if measured), inoculum/disease history, cultivar susceptibility and local observations as each validated profile requires.
- Provide a multi-disease overview, but retain disease-specific explanations and uncertainty.

### Current software foundation

`src/services/multiDiseaseWeatherRisk.ts` introduces a crop-aware registry and aggregator. It currently has one implemented weather rule (grape downy mildew), reusing the existing conservative 10:10:24/night-humidity indicator. It registers grape powdery mildew, grape Botrytis, citrus scab, olive peacock spot, tomato early blight, potato late blight and wheat stripe rust as research candidates; these correctly return `not_ready`, not a false low-risk result.

This is an extensible foundation, not yet the finished multi-disease forecasting system. Additional disease profiles must be populated only after their epidemiological rules and evidence are reviewed and tested. A multi-disease panel should not be advertised as fully operational while most profiles remain pending.

### Validation path

1. Unit-test every rule at boundary conditions and with missing weather values.
2. Back-test each profile against historical disease observations and weather from the same region/season where possible.
3. Evaluate false-alert rate, missed-event rate, lead time, calibration and performance across sites/seasons.
4. Conduct prospective field validation with agronomists before enabling an alert in production.
5. Do not issue pesticide timing, product or dose advice from weather favourability alone.

## Current constraints and next actions

- The repository's existing vision path is color/pixel screening, not a trained field diagnosis model.
- Existing exploratory models are source-specific and not deployable; the grape five-class baseline had 61.17% accuracy / 55.08% macro-F1, while the binary GVLiD model showed serious unknown-disease confusion in external testing.
- The latest audit reports no CUDA, no cached DINOv2 weights, and limited free disk space. Do not download a large encoder or datasets until storage and compute are planned.
- Continue restoring row-level GVLiD/Citrus manifests, auditing unused candidate images and licenses, and running the planned independent/open-set checks before any promotion.
- The next model experiment should compare a frozen compact DINOv2 encoder (start with ViT-S/14 if memory permits) to the existing MobileNetV3-Small baseline on the exact same verified splits. If no compatible cached weights or sufficient memory exist, stop before a large download and prepare an Android-friendly Colab/Drive run instead.
- No experimental model is promoted into the Android/PWA app without reproducible results and external validation. No current metric establishes accuracy on Syrian coastal farms.


## Project foundation: reasoning-first Dr.PLANT

The five foundational capabilities and the staged implementation gates are now specified in [REASONING_FIRST_SYSTEM_SPEC.md](./REASONING_FIRST_SYSTEM_SPEC.md): (1) visual understanding, (2) agricultural context, (3) differential reasoning, (4) evidence-grounded scientific reasoning, and (5) unknown/OOD handling. This is the project's central product requirement, not an optional feature.

The success criterion is generalization to carefully held-out diseases, crops, sites and symptom patterns through evidence-based reasoning and calibrated abstention—not memorization of every disease image. Training remains necessary for visual competence, but each new disease must not require a dedicated labelled training set before Dr.PLANT can form and evaluate a cautious differential. Phase gates, unseen-case challenge design, data integrity rules and release restrictions are defined in the system specification.
