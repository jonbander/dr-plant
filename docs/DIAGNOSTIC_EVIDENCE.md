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


## Mediterranean source audit update — 15 November 2026

### North Portugal field grape-leaf dataset: provenance details

The 2026 *Data in Brief* paper describes 5,267 in-situ RGB images collected during the 2024 and 2025 growing seasons from four vineyard sites in northern Portugal: UTAD (Folhadela, Vila Real; 462 m), Casa de Mateus Foundation (Mateus, Vila Real; 475 m), the Polytechnic Institute of Viana do Castelo (Refóios do Lima, Ponte de Lima; 50 m), and a small-scale vineyard in Abaças (Vila Real; 566 m). The five reported class counts are healthy 1,122; downy mildew 1,006; powdery mildew 1,126; Esca complex 1,000; and erineum mite 1,013. Healthy leaves include Loureiro, Viosinho, and Malvasia Fina; other varieties are also mentioned at some sites, but symptomatic-leaf cultivar identity was not always reliable. Images were taken with a Redmi Note 12 Pro under natural field lighting, with original 3000×3000 and reduced 1024×1024 JPEGs; EXIF timestamps/exposure and GPS may be available. The acquisition and initial class assignment were performed by one operator, followed by independent second-review quality control.

Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC13098524/ ; https://doi.org/10.5281/zenodo.17343473

**License gate:** the article itself is CC BY 4.0. The Zenodo record's own Rights metadata and archive/file terms could not be independently confirmed in this review. These are not interchangeable. Therefore the dataset remains a candidate only: do not download, mirror, redistribute, or train on its images until the Zenodo record-level license and any file-specific restrictions are verified. No images were copied and no archive was downloaded in this update.

**Split warning:** keep vineyard site and acquisition-date groups together in validation/test partitions where possible. A random image split can put near-identical scenes or same-vineyard conditions across train and test and may exaggerate generalization to new vineyards. The Portuguese dataset is not evidence from the Syrian coast; a separate coastal-Syria external test is still required.

### 2025 European grape downy-mildew resistance monitoring

The FRAC 2026 CAA Working Group report summarizes 2025 monitoring data for *Plasmopara viticola*. It reports regional CAA-resistance frequencies in multiple French and Italian wine regions and moderate-to-high or heterogeneous findings in parts of Spain and Portugal. The report says the estimates are based on monitoring data supplied by industry participants and multiple laboratories using different sensitivity methods. This is a resistance-management reference, not a disease-incidence survey, not an image dataset, and not evidence of resistance in Syria. Source: https://www.frac.info/media/gplfgmfu/minutes-of-the-2026-caa-meeting-recommendations-for-2026.pdf

### Training status

No model training was performed in this update. The Portugal image archive remains behind a record-level licensing gate. Do not treat the paper's reported model scores as Dr Plant performance. The next valid training step is to confirm a reusable dataset license, obtain the permitted archive, inspect files/metadata and labels, detect exact and near-duplicates, and construct site/date-aware splits before training a reproducible baseline.


### HERMOS metadata count discrepancy (Turkey)

A new cross-check found inconsistent counts across sources: the Mendeley Data Version 2 landing page currently displays **914 images / 13,904 labels**; the original 2022 HERMOS paper reports **492 images / 13,913 labels**; and the 2026 independent audit reports **492 image/XML pairs, 13,904 parsed objects, 13,765 usable regions, and 491 retained source images** after excluding one image with no usable canonical object. These are different reported scopes and should not be collapsed into one count. The 2026 audit's retained subset is suitable as a reproducibility reference, but the actual downloadable archive still needs inspection to establish the exact files and source-image count for Dr Plant. Sources: https://data.mendeley.com/datasets/j4xs3kh3fd/2 ; https://doi.org/10.1177/01655515221091892 ; https://pmc.ncbi.nlm.nih.gov/articles/PMC13667579/ .



## User-contributed grape and lemon field leads — 15 November 2026

The following five topics were supplied by a user familiar with local crop issues. They are recorded as **reported field leads**, not expert-confirmed diagnoses, prevalence claims, or training labels. No location, season, cultivar, specimen, or laboratory result accompanied the reports.

### Grapevine leaves

- **Spider mites (Tetranychidae):** UC IPM describes species-specific feeding patterns including yellow stippling, later necrosis, bronzing, leaf burn, and (for high populations of webspinning species) webbing. Different mite species produce different patterns; inspect leaf undersides with magnification and distinguish pest mites from predatory mites. Reference: https://ipm.ucanr.edu/agriculture/grape/webspinning-spider-mites/
- **Thrips (Thysanoptera):** UC IPM identifies grape thrips (*Drepanothrips reuteri*) and western flower thrips (*Frankliniella occidentalis*) as relevant grape pests. Feeding on emerging shoots can stunt shoots and cause leaf cupping or distortion in some conditions; fruit scarring is a separate symptom/task. Reference: https://ipm.ucanr.edu/agriculture/grape/thrips/


### Lemon / citrus leaves

- **Citrus leafminer (*Phyllocnistis citrella*):** larvae make shallow serpentine mines in young leaves; affected leaves can curl and become distorted. This is a citrus pest affecting lemon as well as other citrus. Reference: https://ipm.ucanr.edu/agriculture/citrus/citrus-leafminer/
- **Leaf yellowing/chlorosis:** nonspecific symptom with multiple possible nutritional, water, salinity, root, pest, and disease causes. It must remain a differential/symptom record rather than a single disease class until the cause is established.

### Implementation limits

These records are kept separate from image-training manifests. Do not promote them to `expert_confirmed` without documented review by a qualified reviewer, date, and method. For computer vision, distinguish visible symptom recognition (for example, a citrus leafminer serpentine mine) from causal diagnosis (for example, a particular nutrient deficiency). A yellow leaf alone is not a reliable label for a specific deficiency. Do not infer local prevalence or recommend pesticide products/rates from these references; regional registration and field validation are separate requirements.

References for grape pest symptoms: https://ipm.ucanr.edu/agriculture/grape/monitoring-insects-and-spider-mites/ ; https://ipm.ucanr.edu/agriculture/grape/thrips/ ; https://ipm.ucanr.edu/agriculture/grape/webspinning-spider-mites/


## Cross-tree nutrient deficiency and chlorosis reference

Nutrient deficiency is not specific to grapevine: it can affect many tree crops, including citrus and other fruit trees, as well as ornamental and landscape trees. The knowledge-base record has therefore been generalized from grape-only to `multiple_tree_crops`.

- **Important distinction:** yellowing is a symptom, not proof of nutrient deficiency. Nitrogen deficiency often causes more uniform paling of older leaves; iron or manganese problems may cause interveinal chlorosis on young leaves; magnesium and potassium patterns often begin on older foliage. These are broad clues, not universal rules.
- **Crop specificity:** symptom appearance, affected leaf age, nutrient thresholds and interpretation vary with tree species, cultivar, rootstock, soil, pH, season and climate. A pattern seen in citrus must not automatically be applied to olive, grape, stone fruit or another tree.
- **Differential causes:** unsuitable soil pH, salinity, waterlogging or drought, root injury/decay, pests, disease, nutrient imbalance and excess can resemble deficiency.
- **Evidence needed:** interpret symptoms in the context of the crop and site; soil testing and appropriately sampled leaf-tissue analysis are often needed before naming a specific deficient element or recommending fertilizer.

General and crop-specific references:
- UC IPM – Nutrient Deficiencies (woody plants and fruit/nut trees): https://ipm.ucanr.edu/home-and-landscape/nutrient-deficiencies/
- University of Maryland Extension – Nutrient Deficiency of Trees and Shrubs (updated 2026): https://www.extension.umd.edu/resource/nutrient-deficiency-trees-and-shrubs
- UC IPM – Common Nutrient Deficiency Symptoms: https://ipm.ucanr.edu/home-and-landscape/common-nutrient-deficiency-symptoms/
- UF/IFAS – Nutrition of Florida Citrus Trees: https://ask.ifas.ufl.edu/publication/SS670
- BC Tree Fruit Production Guide – Leaf Tissue Analysis and Interpretation: https://www.bctfpg.ca/horticulture/fruit-tree-nutrition/assessing-nutrient-requirements-in-fruit-trees-sampling-testing-and-interpretation/
- University of Delaware Extension – Identifying Nutrient Deficiencies: https://www.udel.edu/academics/colleges/canr/cooperative-extension/fact-sheets/identifying-nutrient-deficiencies-in-ornamental-plants/

This cross-tree reference does not mean that every nutrient disorder occurs in every tree species or that the same visual key applies to all trees. It is not a fertilizer prescription or a model-training label.

## User-contributed olive field lead — 15 November 2026

### Peacock spot / olive leaf spot (عين الطاووس)

The user identified peacock spot as an olive disease of interest. The record is classified as **reported**, not expert-confirmed; no location, cultivar, season, specimen, or diagnostic result was supplied.

- **Causal agent:** *Venturia oleaginea*; *Spilocaea oleagina* is a widely used synonym/anamorph name in extension literature.
- **Typical visible symptoms:** circular brownish to olive-green, gray, or dark spots, often developing concentric rings and a yellow halo. Symptoms are most often visible on the upper leaf surface. Severe/recurrent disease can cause yellowing and premature leaf drop, commonly more evident in the lower, humid canopy.
- **Favorable conditions:** rain, high relative humidity, prolonged leaf wetness, and mild temperatures. Infections may remain latent for an extended period, so visible symptoms can lag behind infection.
- **Diagnostic caution:** yellowing alone is not sufficient. Similar leaf discoloration can have other causes. Microscopic observation of fungal structures or appropriate laboratory testing can support confirmation; asymptomatic latent infection is harder to detect.

References:
- UC IPM – https://ipm.ucanr.edu/agriculture/olive/peacock-spot/
- Pacific Northwest Plant Disease Management Handbook (revision March 2026) – https://pnwhandbooks.org/plantdisease/host-disease/olive-olea-europaea-olive-leaf-spot-peacock-spot-peacocks-eye
- Updated scientific review (2022) – https://pmc.ncbi.nlm.nih.gov/articles/PMC9868462/
- RHS – https://www.rhs.org.uk/disease/olive-scab

This is a reference entry only. It is not a locally confirmed Syrian diagnosis, not a training label, and it does not provide pesticide or treatment recommendations.


## User-reported marginal leaf scorch field lead — 15 November 2026

The user described dry, brittle leaf edges and tips (choice 2: marginal/tip drying) and identified walnut and loquat as possible affected crops. This is recorded as a **reported symptom lead**, not as one named disease or a confirmed causal diagnosis.

- **Symptom name:** marginal leaf necrosis / leaf scorch. Leaf margins and tips become yellow-brown, dry and brittle; necrosis may extend inward.
- **Possible causes:** drought or restricted water uptake, hot/drying wind and heat, salinity or fertilizer-salt injury, nutrient imbalance, waterlogging/root damage/root rot, and some vascular pathogens. These causes can look alike.
- **Crop scope:** walnut (*Juglans* spp.) and loquat (*Eriobotrya japonica*) are the user-reported host leads. The available references support the general symptom differential and list environmental disorders for loquat, but do not establish that one specific cause is responsible in either crop.
- **Important distinction:** walnut blight typically begins as small dark-brown leaf specks with a yellowish-green halo and may affect flowers, shoots and developing nuts; do not merge this pattern with uniform marginal scorch.
- **Diagnostic caution:** do not infer *Xylella fastidiosa* or another pathogen from brown leaf margins alone. Consider whether symptoms affect one branch or the whole canopy, whether multiple species in the same area are affected, and recent irrigation, heat, salinity, fertilizer and spray history. Laboratory testing is needed for pathogen confirmation where indicated.

References:
- Washington State University Extension – https://hortsense.cahnrs.wsu.edu/fact-sheet/common-cultural-marginal-leaf-necrosis/
- UC IPM – https://ipm.ucanr.edu/home-and-landscape/leaf-scorch/
- Penn State Extension – https://extension.psu.edu/bacterial-leaf-scorch
- UC IPM – Loquat – https://ipm.ucanr.edu/home-and-landscape/loquat/
- Ask Extension – Loquat Leaf Browning (expert response, 21 February 2026) – https://ask.extension.org/kb/faq.php?id=924776
- UC IPM – Walnut Blight – https://ipm.ucanr.edu/home-and-landscape/walnut-blight/

This symptom entry is not a training label, locally confirmed diagnosis, or treatment recommendation.


## HERMOS archive audit preparation — 15 November 2026

The HERMOS Version 2 Mendeley landing page states CC BY 4.0 and currently displays 914 images and 13,904 annotations. The original dataset paper reports 492 source images and 13,913 annotations. A 2026 peer-reviewed follow-up reports 492 image/XML pairs, 13,904 parsed objects, 13,765 usable bounding-box objects, and 491 retained source images after its own filtering. These counts describe different reported scopes and must not be treated as interchangeable.

Sources:
- Mendeley Data V2: https://data.mendeley.com/datasets/j4xs3kh3fd/2
- Original HERMOS paper: https://doi.org/10.1177/01655515221091892
- 2026 HERMOS follow-up: https://pmc.ncbi.nlm.nih.gov/articles/PMC13667579/

A standard-library audit utility has been added at `scripts/audit-hermos.py`. After downloading and extracting the exact V2 archive, run:

```sh
python scripts/audit-hermos.py /path/to/extracted-hermos --out /path/to/audit-output
```

It creates a SHA-256 manifest and JSON report covering image/XML pairing, Pascal VOC object counts, bounding-box validity, class-object counts, orphan annotations, and exact-byte duplicates. It does **not** verify biological label correctness, visual near-duplicates, image-level licensing/provenance, or site/session identity. The manifest deliberately leaves provenance, expert review, group ID, and split fields unfilled.

**Current gate:** archive not yet downloaded or inspected in this repository workflow. Therefore no HERMOS images have been admitted to training, no split has been created, and no model has been trained. The CC BY 4.0 landing-page declaration is encouraging evidence, but archive-level attribution/provenance and exact-version checks remain pending. Do not use the landing-page's 914 figure as a verified source-image count.


## Lemon / citrus scab — reference-only record (15 November 2026)

- Causal agent for sour citrus scab: *Elsinoë fawcettii*.
- Typical signs: raised, rough, corky, wart-like lesions on young leaves and fruit; early lesions may be pale orange, pink or gray and darken; young leaves and fruit may become distorted.
- Distinguish this from citrus canker, melanose, leafminer galleries, gummosis and nonspecific chlorosis. A photograph alone may not resolve difficult cases; seek qualified plant-health or laboratory confirmation where needed.
- Do not confuse sour citrus scab (*E. fawcettii*) with sweet orange scab (*E. australis*).
- References: [UF/IFAS CH159](https://ask.ifas.ufl.edu/publication/CH159), [NSW DPIRD citrus field guide](https://www.dpird.nsw.gov.au/__data/assets/pdf_file/0008/1629467/Pests%2C-beneficials%2C-diseases-and-disorders-in-citrus.pdf), [UGA Extension B1520](https://extension.uga.edu/publications/detail.html?number=B1520).
- Evidence status remains `reference_only`; no current Syrian coastal specimen or expert confirmation was supplied.


## User-supplied model and dataset references — 22 November 2026

### Dr.Plant reference implementation

The linked upstream repository is a code/reference project, not an additional labelled dataset. The GitHub repository metadata currently reports `main` as its default branch, and a branch search returned only `main`; the supplied note about `master` and `deploy` does not match the currently visible branch list. Re-check the live repository before copying training or deployment code. Do not copy a model, class-index order, or preprocessing assumptions into this project without comparing the exact inference pipeline and label map. Upstream project: https://github.com/Pallav7533/Dr.Plant

### Classification datasets and licensing decisions

- **PlantVillage:** useful as a controlled-image baseline and to inspect the 38-category crop/disease label map. The GitHub README reports 54,306 images, 14 crops and 26 diseases; TensorFlow Datasets reports 54,303 examples in 38 classes and explains that its copy is republished from Mendeley with the background-only class removed. The GitHub dataset repository has no visible image-data LICENSE file, and secondary mirrors/catalogues report inconsistent terms. The paper's license is not a substitute for image rights. Metadata only; no download. Sources: https://github.com/spMohanty/PlantVillage-Dataset ; https://www.tensorflow.org/datasets/catalog/plant_village ; https://doi.org/10.3389/fpls.2016.01419 .
- **New Plant Diseases Dataset (Kaggle):** approximately 87,000 images/38 classes, but it is an augmented PlantVillage derivative rather than 87,000 independent field photographs. Published descriptions report substantial overlap with PlantVillage and offline augmentations. Treat it as a derivative variant, deduplicate/group augmentations by original source, and do not use the Kaggle copy until its actual terms and source-image rights are verified. Metadata only. Source: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset .
- **PlantDoc:** 2,598 images from 13 plant species; the repository declares CC BY 4.0 and describes cropped classification data, with a separate object-detection dataset. However, its README says the images were scraped from internet search engines. The repository-level license does not necessarily clear third-party photo copyrights. It is a promising field-like evaluation candidate only after image-level source/rights and label review. Metadata only. Source: https://github.com/pratikkayal/PlantDoc-Dataset .
- **PlantSeg:** v2 Zenodo record reports over 11,400 images, 115 plant-disease cases and pixel-level masks; archive size is 3.0 GB. Its current Rights field has a License heading but no value. The Nature paper describes per-image URLs and license metadata; those must be audited. This is a separate lesion-segmentation task, not an image-classification label set. No download. Sources: https://zenodo.org/records/13762907 ; https://www.nature.com/articles/s41597-025-06513-4 .
- **LeafNet / LeafBench:** paper reports 186,000 leaf images, 97 disease classes and 13,950 QA pairs; the LeafBench card describes a 2,910-image, six-task visual question-answering benchmark. Hugging Face access is gated; the dataset contains mixed public and in-house imagery, and upstream images retain their own rights. Dataset-card license tags are not sufficient to clear each embedded image. This is a future vision-language evaluation resource, not a drop-in classifier dataset. Metadata only. Sources: https://arxiv.org/abs/2602.13662 ; https://huggingface.co/datasets/enalis/LeafNet ; https://huggingface.co/datasets/enalis/LeafBench .

### Methodology papers and regional knowledge sources

- The 2025 multi-dataset paper is useful for its within-dataset and cross-dataset evaluation design, class-wise F1 scores, and confusion matrices. It reinforces the need to test transfer to a separate image source rather than relying on a random split. Source: https://www.mdpi.com/2571-8800/8/1/4 .
- The 2016 Mohanty et al. paper is foundational for PlantVillage and transfer-learning baselines, but controlled-background performance is not evidence of field reliability. Source: https://doi.org/10.3389/fpls.2016.01419 .
- The Arab Society for Plant Protection and Arab Journal of Plant Protection are high-value regional literature discovery sources; the journal is open access and indexed in CABI, AGRIS, Google Scholar and Scopus. Search papers by crop, pathogen, country, season and method; a regional paper is not automatically coastal-Syria confirmation. Sources: https://asplantprotection.org/ ; https://www.arabjournalpp.org/ .
- The ACSAD library is a useful Arabic agricultural reference catalogue. Treat catalog entries as discovery leads and verify the underlying publication, date and scientific content before adding disease claims. Source: https://acsad.org/المكتبة/ .
- The Geopard Arabic article is introductory material only; it should not establish a pathogen identity, diagnosis, treatment, or training label without a primary scientific or official extension source.

### Implications for Dr Plant

1. PlantVillage and New Plant Diseases overlap substantially; do not count them as independent datasets or merge their train/test splits. The Kaggle derivative's augmentation variants must remain grouped with their original image to prevent leakage.
2. PlantDoc is more field-like, but internet-scraped source rights and label provenance require image-by-image review before any image is copied or trained on.
3. PlantSeg masks support a future segmentation task only; do not convert mask pixels into disease-severity labels or mix masks with classification labels without a separately defined protocol.
4. LeafNet/LeafBench may support a later visual-language assistant benchmark, but gated access, mixed-source image licenses, and the difference between QA and classification must be preserved.
5. None of these sources is Mediterranean coastal-Syria evidence. Use them for generic pretraining or external stress tests only after rights and labels are audited; retain a fixed, independent coastal-Syria test set before enabling any model in the application.

No dataset files or images were downloaded, copied, redistributed, or used for training in this update. No model was trained and no diagnostic accuracy or improvement is claimed.
