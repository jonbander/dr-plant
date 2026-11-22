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

## Mediterranean evidence refresh — 22 November 2026

### New grape-leaf reference differentials

The following entries were added to `data/knowledge-base.json` as `reference_only`. They are reference material for future differential diagnosis, not local Syrian reports, expert-confirmed cases, or model-training labels.

- **Grapevine black rot — `Phyllosticta ampelicida` (syn. `Guignardia bidwellii`):** EPPO lists *Phyllosticta ampelicida* as the preferred name and *Guignardia bidwellii* as a synonym. INRAE ePhytia's French grapevine reference shows circular/polygonal tan-brown leaf lesions with darker margins and black pycnidia in mature spots; the pathogen can also affect canes and bunches. Keep leaf, cane and bunch images as separate organ tasks. Sources: https://gd.eppo.int/taxon/GUIGBI ; https://ephytia.inrae.fr/en/D/1929 ; https://apps.extension.umn.edu/garden/diagnose/plant/fruit/grape/leavesspots.html . The linked INRAE images were not downloaded or copied; their image-reuse terms were not verified.
- **Esca complex:** INRAE describes Esca as a multifactorial trunk-disease syndrome, not a single leaf pathogen. Foliar symptoms may include irregular interveinal discoloration/necrosis (tiger-stripe appearance); severe apoplexy can cause sudden vine wilting and leaf drying, sometimes after a rainy period followed by strong summer heat. Wood examination may reveal white soft rot and central/sectorial brown necrosis, with several associated fungi. A leaf-only photograph is insufficient to diagnose Esca. Source: https://ephytia.inrae.fr/en/C/6969/Grapevine-Main-symptoms .
- **Grape erineum mite — `Colomerus vitis`:** UC IPM describes round warty swellings on the upper leaf surface with corresponding felt-like patches on the underside. This is a mite pest, not a fungal mildew; several strains may occur and visible symptoms do not always establish species identity. Keep it separate from Tetranychid spider mites and fungal disease classes. Source: https://ipm.ucanr.edu/home-and-landscape/grape-erineum-mite/ .

These are Mediterranean-relevant reference pages (not proof of occurrence in Latakia or Tartous). Do not infer local prevalence from them.

### New downy-mildew research

- **Italy, published 18 November 2026:** a *Plant Disease* ahead-of-print study analysed 164 *Plasmopara viticola* sporangia suspensions from Apulia, Calabria, Veneto, Friuli Venezia Giulia, Lombardy and Piedmont. All sampled isolates were assigned to the aestivalis clade. The authors report low overall population diversity and greater variability in northern samples, but caution that the north/south comparison used different sampling strategies and sample sizes. This is population-genetics evidence, not a disease-incidence survey, image dataset, or Syrian population result. DOI: https://doi.org/10.1094/PDIS-05-26-0915-RE .
- **Swiss vineyard spore monitoring, published 30 March 2026:** an open-access study tested automated air-flow cytometry for airborne *P. viticola* sporangia against microscopy and qPCR during a 2023 pilot and the 2024 season. Agreement strengthened later in the season (reported maxima r=0.94 against microscopy and r=0.83 against DNA quantification), while correlations were weaker early during leaf development and flowering. This supports the research value of biological spore observations alongside weather, but it does not supply a validated Syrian weather threshold or a low-cost sensor implementation. DOI: https://doi.org/10.1128/aem.02152-25 .

### Dataset audit and licensing decisions

- **Spain/Norway grape downy-mildew dataset (Zenodo, version 2, 16 October 2025):** the record describes 281 high-resolution grape-leaf images in two classes (healthy and *Plasmopara*-infected), collected from vineyards in Spain and Norway; the ZIP is listed as 1.0 GB. The Zenodo Rights area displays a License heading but no license value. No country-level counts, collection dates, cultivar details or sufficiently detailed diagnostic protocol are exposed on the landing page. Status: metadata-only candidate; do not download, mirror, redistribute or train until the dataset-level and file/image rights are verified. Source: https://zenodo.org/records/17368692 .
- **Morocco field citrus dataset (Mendeley, version 1, 15 October 2026):** the record lists 611 manually annotated images from Fes-Meknes and four labels (healthy, greasy spot, greening and California red scale), and displays CC BY 4.0. However, the description explicitly says the collection contains both citrus leaves and fruits, with no per-organ or per-class counts. The contributor attributes annotation to a named domain expert, but the reviewer’s credentials, diagnostic method and laboratory confirmation are not documented on the landing page. The record-level CC BY declaration is recorded, but individual file/image rights and attribution still need package-level review. Status: metadata-only candidate; no download or training. If rights are verified later, leaf and fruit images must be separated into distinct tasks. Source: https://data.mendeley.com/datasets/szsms728jf/1 .
- **FieldVitis:** the Zenodo record's Rights section does not display a license value. Its description names CC BY 4.0 upstream sources, but those upstream licenses do not automatically license the compiled/cropped FieldVitis archive or every included image. Its status has been corrected to `candidate_dataset_license_unverified`; no archive download or use is permitted until every image's original source and reuse terms are traceable. Source: https://zenodo.org/records/17307846 .
- **GVLiD (India; already indexed, audit details expanded):** the primary 2026 *Scientific Data* descriptor reports collection at 34 vineyards in Tasgaon, Sangli district, Maharashtra, during July–November 2023. Both upper and lower sides of leaves were photographed; the collection mixes in-situ vineyard photographs with ex-situ neutral-grey-board images. The final 3,477 images came from 3,792 raw images after 15 corrupt files, 200 blurred/overexposed files and 100 near-duplicates were removed. The paper reports expert labeling and inter-/intra-rater agreement on a subset (κ=0.86–0.92), but this does not replace an independent audit of the package. Keep paired sides of the same leaf together in one data split and separate in-situ from ex-situ images when evaluating field generalization. The paper reports that healthy images are overrepresented by about 1.65×. The Mendeley V5 record lists CC BY 4.0, but package-level image attribution still needs verification. Sources: https://www.nature.com/articles/s41597-026-07431-9 ; https://data.mendeley.com/datasets/wkymf8bhcg/5 .
  
  A third-party Hugging Face reformat preview lists 28 vineyard IDs and shows capture-time examples dated 15 June 2023, whereas the primary paper reports 34 vineyards and a July–November 2023 collection period. Treat those mirror metadata fields as unresolved; do not use the reformat as the authoritative source for site/date grouping until reconciled against the original Mendeley V5 archive. Source: https://huggingface.co/datasets/Project-AgML/gvlid_grapevine_leaf_disease .
  
### Public community scan

Publicly searchable community results were considered only as leads. This review did not find a sufficiently traceable, openly accessible grower post with enough crop, location, date, image provenance and independent diagnostic evidence to add as a disease record. No private groups or restricted content were accessed, and no social-media caption was used as a training label.

### Training and image status for this update

No dataset archive was downloaded, no individual images were copied or redistributed, no new training manifest was populated, and no model training or evaluation was performed. The newly added disease entries remain `reference_only`; no record was promoted to `expert_confirmed`. The next valid dataset step is rights verification followed by package-level provenance, label, class-balance and duplicate audits, then farm/site/season-aware splitting. No model or diagnostic behavior was changed.
