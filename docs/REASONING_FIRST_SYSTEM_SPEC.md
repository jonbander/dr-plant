# Dr.PLANT Reasoning-First Diagnostic System

**Status:** architectural specification; implementation and validation are staged. This document defines the product's central capability target. It does not claim that the current app already performs expert-level reasoning.

## Mission

Build Dr.PLANT as an evidence-grounded plant-health reasoning assistant, not merely a closed-set image classifier. It should analyze visible leaf evidence, combine it with crop and environmental context, compare plausible causes, and handle unfamiliar cases conservatively.

The goal is not to eliminate training. The goal is to reduce dependence on having a labelled training example for every disease, cultivar, symptom pattern, and capture condition.

## Five foundational capabilities

### 1. Visual understanding

Represent observations separately and explicitly:

- Colour: chlorosis, interveinal chlorosis, reddening/bronzing, browning, necrosis, blackening, mosaic/mottling, water-soaked or oily appearance.
- Shape: curling up/down, rolling, wrinkling, crumpling, puckering, twisting, cupping, blistering, narrowing, abnormal size, margin and vein distortion.
- Surface appearance: visible powder, downy growth, raised/corky lesions, scarring, mines, cracking, brittleness, thickening and collapse.
- Venation and spatial distribution: along/between veins, margins, tip, isolated lesions, whole leaf, young vs mature leaves, upper vs lower surface.
- Image reliability: focus, resolution, exposure, occlusion, leaf visibility, compression and whether multiple leaves/plants are present.

Ordinary RGB images do not directly measure tactile texture. Record only visible surface cues; request macro images or physical examination when texture cannot be inferred.

### 2. Agricultural understanding

Interpret observations in context: crop/species, cultivar if known, plant part, leaf age, growth stage, farm/site, season, recent weather, irrigation, soil/water conditions, management and symptom distribution across plants. Missing context must remain explicitly missing, not silently assumed.

### 3. Differential reasoning

Generate a shortlist across causal groups: fungal/oomycete/bacterial/viral pathogens, insects and mites, nutrient disorders, water/heat/cold/salinity/herbicide/physical injury, mixed causes and unknown.

For every candidate, record:
- supporting observations;
- contradicting observations;
- expected signs or context not yet observed;
- evidence quality and source;
- what additional observation would best distinguish it.

A symptom is not a diagnosis. Generic curling, yellowing or spotting must never automatically map to one pathogen.

### 4. Scientific evidence reasoning

Use an auditable knowledge layer with source, date, crop, region, disease, host range, epidemiology, symptom descriptions, differential features, evidence grade and limitations. Distinguish established evidence, regional evidence, plausible hypotheses and unverified reports.

Weather favourability, pathogen presence, observed symptoms, diagnosis and treatment are separate concepts. Weather rules must be disease-specific and regionally validated. Missing inputs mean not assessable, not low risk. Do not generate pesticide product, dose or timing instructions from a symptom guess or weather indicator alone.

### 5. Unknown and out-of-distribution handling

Detect and abstain on poor-quality, unfamiliar, mixed, unsupported or out-of-distribution cases. Return:
- what is visibly observed;
- which causes remain plausible and why;
- what cannot currently be concluded;
- the next most useful evidence to collect (e.g. underside, close-up, whole plant, multiple leaves, lab test or local expert);
- a confidence/calibration statement that is validated rather than fabricated.

Never force an unfamiliar case into the nearest known disease class.

## Target system architecture

1. **Image intake and quality gate:** preserve original resolution where possible, inspect actual decoded dimensions, avoid destructive resizing/compression, and provide clear recapture guidance.
2. **Visual encoder:** benchmark compact pretrained/frozen visual encoders against existing MobileNetV3-Small baselines on identical audited splits. Do not download large checkpoints until storage and compute are confirmed.
3. **Multi-task observation heads:** separate outputs for crop/plant-part (only where supported), symptom attributes, disease candidates, image quality and unknown/OOD signals. Keep symptom observations independent of disease labels.
4. **Evidence retrieval:** retrieve crop- and region-relevant vetted knowledge with source traceability; distinguish retrieved facts from model inference.
5. **Differential reasoning engine:** compare candidates against positive, negative and missing evidence; ask targeted follow-up questions instead of guessing.
6. **Context and weather layer:** add site, phenology and disease-specific weather models with explicit uncertainty and independent validation.
7. **Case memory and review:** retain only appropriately consented and provenance-tracked cases; expert-confirmed corrections may update the knowledge base after review, never silently become training labels.
8. **User report:** Arabic-first explanation with observations, ranked differential, evidence, uncertainty, missing information and safe next steps.

## Staged implementation plan and gates

### Phase 0 — Baseline and data integrity
- Inventory all existing model files, datasets, manifests, splits, metrics and app inference paths.
- Restore row-level GVLiD and Citrus manifests.
- Audit unused images for provenance, license, labels, image quality, exact/perceptual duplicates and exclusions.
- Preserve SHA256/pHash and group splits by farm/site, plant and capture session; use season where available.
- Do not train on unaudited images or claim a model was trained when only code or metadata changed.

**Gate:** reproducible dataset manifests and leakage-controlled train/validation/test splits.

### Phase 1 — Reliable visual observations
- Fix and test image upload/camera quality: original dimensions, orientation, decode path, thumbnail-vs-original handling and compression.
- Define symptom annotation schema and annotation guidance.
- Evaluate visual features and symptom multi-label prediction separately from disease classification.

**Gate:** image quality tests and independently reviewed symptom labels; no disease inference based solely on generic morphology.

### Phase 2 — Cross-domain and unknown-case evaluation
- Restore and evaluate existing GVLiD/Citrus baselines.
- Run cross-dataset evaluation and class-wise error analysis.
- Add calibration, selective prediction, OOD/unknown rejection and abstention.
- Keep farm/site/plant/session groups isolated; report macro-F1, per-class precision/recall, balanced accuracy, calibration, AUROC/AUPR for unknown detection, selective risk/coverage and source-wise results.

**Gate:** documented external performance and safe rejection behavior; no promotion based on a single aggregate accuracy.

### Phase 3 — Foundation visual encoder experiment
- Compare frozen compact DINOv2 features (start with ViT-S/14 only if resources permit) to MobileNetV3-Small on the exact same verified splits.
- If weights are not cached or memory/storage is insufficient, stop before a large download and prepare an Android-friendly Colab/Drive workflow.
- Consider distillation to a compact mobile student only after the teacher shows independent cross-domain benefit.

**Gate:** reproducible improvement on external and unknown cases, not merely random-split accuracy.

### Phase 4 — Differential reasoning and evidence retrieval
- Implement structured candidate generation with supporting, contradicting and missing evidence.
- Add targeted follow-up selection (underside, macro, whole plant, other leaves, crop/stage/weather).
- Attach citations/source IDs and evidence grades to knowledge entries and diagnostic explanations.
- Add explicit non-pathogen and mixed-cause alternatives.

**Gate:** blinded case review against expert-labelled cases, including ambiguous and unfamiliar examples.

### Phase 5 — Multi-disease environmental risk
- Add one disease profile at a time with independent epidemiological references and tests.
- Back-test against region/season-matched disease observations and weather.
- Validate false alerts, missed events, lead time and calibration before enabling a profile.
- Keep weather favourability separate from diagnosis and treatment.

**Gate:** prospective field validation before production alerts.

### Phase 6 — Field validation and controlled release
- Evaluate across Syrian coastal farms, cultivars, seasons, phones and lighting conditions.
- Include unfamiliar diseases, nutrient problems, abiotic stress, mixed symptoms and healthy leaves.
- Publish model/data cards, limitations, rollback plan and independent acceptance results.
- No experimental model enters the Android/PWA production path until gates are met.

## Mandatory evaluation: unseen-case challenge

Maintain a locked evaluation suite containing:
- diseases absent from the training labels;
- crops or cultivars not represented in training where feasible;
- new farms, seasons, phones and lighting;
- nutrient deficiencies and abiotic stress that mimic disease;
- mixed infections and non-specific symptoms;
- blurred, low-resolution and partial images;
- healthy leaves and genuinely unknown cases.

Score not only top-1 disease accuracy but also symptom fidelity, differential quality, evidence correctness, calibration, appropriate abstention, false certainty and the usefulness of requested follow-up evidence. Expert reviewers should judge whether the system's reasoning is supported, not just whether its final disease name matches.

## Non-negotiable data and release policy

- Dataset candidates are not training-ready by default.
- Verify dataset and image-level rights, provenance, labels, quality and duplicates.
- Keep immutable manifests, source/version, hashes, exclusion reasons, split reports, configs, seeds, metrics and model cards for every run.
- Never split near-duplicates or augmented derivatives across train/test.
- Preserve prior checkpoints and rollback capability.
- Record actual commands, environment, hardware, artifacts and test results.
- Do not merge to `main` or promote a model without explicit approval and independent acceptance.

## Current truth

The existing code provides a symptom taxonomy and an initial multi-disease weather registry. The weather registry currently has one implemented grape downy-mildew rule; other profiles remain not ready. This specification is a plan, not evidence that the reasoning engine, DINOv2 model, expert-level diagnosis or unseen-disease generalization is already implemented.
