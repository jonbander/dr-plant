# Evidence and limits of the current workflow

The current camera workflow measures coarse HSV color proportions, estimates green-like pixels, and applies basic photo-quality gates. These are image statistics, not plant pathology features. Background foliage, shadows, pesticide residues, leaf age, nutrient disorders, and camera white balance can change the measurements.

The software intentionally does not map these measurements to a pathogen name and does not infer crop species from color.

## Why no disease classifier is enabled

A disease classifier must be trained and independently evaluated on representative field photographs. A 2026 cross-domain study found a 67.7 percentage-point accuracy drop when a model moved from controlled PlantVillage imagery to field-sourced PlantDoc images, while mean confidence remained 79.76%. This demonstrates why confidence scores and laboratory dataset accuracy cannot establish field reliability.

Reference: https://doi.org/10.3389/fpls.2026.1826962

## Symptom references for future expert-reviewed content

- Grapevine downy mildew: https://ipm.ucanr.edu/agriculture/grape/downy-mildew/
- Grapevine powdery mildew: https://ipm.ucanr.edu/agriculture/grape/powdery-mildew/
- Other grape leaf spots: https://apps.extension.umn.edu/garden/diagnose/plant/fruit/grape/leavesspots.html
- Citrus leafminer: https://ask.ifas.ufl.edu/publication/IN165
- Citrus disease symptom guide: https://ask.ifas.ufl.edu/publication/CH159

## New research leads reviewed on 15 November 2026

- **Grape bunch powdery mildew severity dataset (Morocco):** 2,068 in-situ bunch photographs with four image-level visible-severity grades, published 13 October 2026. The Mendeley record lists CC BY 4.0. Source: https://data.mendeley.com/datasets/z2f3vdc6nh/1. It is a candidate for a separate bunch-level task, not a leaf classifier. The labels describe visible symptoms; they are not stated to be laboratory-confirmed infection measurements. The dataset comes from one vineyard and one season.
- **Citrus tristeza virus in Syria:** a peer-reviewed 2008 first report describes a 2006 survey and serological testing in citrus-growing locations in Latakia (including Jableh) and Tartous. Source: https://apsjournals.apsnet.org/doi/10.1094/PDIS-92-10-1468C. This is a historical regional record, not evidence of current prevalence or an individual tree's infection. Laboratory testing is required.
- **Grapevine dead-arm in southern Syria:** a 2025 paper reports isolation of Phomopsis viticola from symptomatic grapevine samples collected in Sweida during 2020–2022. Source: https://www.arabjournalpp.org/article/2025/02/4675/. Sweida is not the Syrian coast; this does not confirm coastal occurrence. Taxonomic synonymy with Diaporthe ampelina should be checked against current authoritative taxonomy before merging records.
- **GVLiD 2026 descriptor:** the 3,477-image grape leaf dataset has a peer-reviewed Scientific Data descriptor with field collection and metadata details: https://www.nature.com/articles/s41597-026-07431-9. It is already indexed in the knowledge base; no duplicate dataset entry was added.

All datasets remain candidates, not integrated training data. No image files were copied, no dataset was downloaded or independently audited, and no model was trained in this update.

## Not yet validated

No expert-labelled Syrian coastal image dataset, independent test set, calibration report, or official Syrian pesticide-registration source is included. This release must not advertise diagnostic accuracy, disease certainty, or locally approved pesticide rates.

- **North Portugal grapevine leaf field dataset (2026):** 5,267 field RGB images across five classes (healthy, downy mildew, powdery mildew, Esca complex, erineum mite), collected at four vineyard sites during the 2024 and 2025 growing seasons. The paper reports natural vineyard lighting, smartphone acquisition, and a second reviewer for final annotation quality control. Zenodo record: https://zenodo.org/records/17343473; DOI: https://doi.org/10.5281/zenodo.17343473. The article is CC BY 4.0, but the Zenodo dataset record's own license and archive terms still require direct verification before download/reuse. This is a high-priority candidate for a leaf-only baseline; it is not Syrian coastal data and transfer must be tested independently. Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC13098524/.


- **HERMOS audit clarification (Turkey):** the original 2022 paper reports 492 images and 13,913 Pascal VOC annotations. A 2026 CC BY 4.0 study reports retaining 491 source images and 13,765 regions after its own audit/filtering. These are different reporting scopes; inspect the actual Mendeley Version 2 archive before selecting the training manifest. Sources: https://doi.org/10.1177/01655515221091892 and https://pmc.ncbi.nlm.nih.gov/articles/PMC13667579/.

## Model-training status and gate

The Mediterranean scope now includes field datasets from northern Portugal and western Turkey, but no training run has been performed. Before training, download only datasets whose repository-level and file-level reuse terms are verified; audit archive integrity, labels, duplicates, class balance, and site/date metadata. Keep leaf, bunch, and fruit tasks separate. Prefer group-based splits by vineyard/site and season over random image splits to reduce leakage. The first baseline should be reproducible and report per-class precision/recall/F1, macro-F1, confusion matrix, and a fixed independent test result. Retrain only after newly audited data or corrected labels are added, and compare each run against the same held-out test set. No model should be promoted into the app until external coastal-Syria evaluation is available.
