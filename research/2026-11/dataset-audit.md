# Dr Plant — Dataset refresh (2026-11-21)

This folder records a source audit based on the dataset shortlist supplied by the project owner. It does not claim that downloaded images have been added or that a model has been trained.

## Newly identified / materially updated sources

| Dataset | Latest verified record | Content | License / status | Dr Plant use |
|---|---|---|---|---|
| Large-Scale Lemon Leaf Disease and Pest Image Dataset from Bangladesh | Mendeley V3, 2026-11-04, DOI 10.17632/8d9fv6kpt3.3 | 17,586 original field-collected lemon images, 18 image-level categories, four collection locations, 2025 season | CC BY 4.0; metadata and class descriptions need review | Highest-priority citrus candidate; download and audit before training |
| Field-Based Citrus Leaf Disease Image Dataset | Mendeley V1, 2026-10-15, DOI 10.17632/szsms728jf.1 | 611 expert-annotated field images: healthy, greasy spot, greening, California red scale; Fes-Meknes, Morocco | CC BY 4.0 | Strong small field-domain supplement; leaves and fruits must be separated by task |
| Grapevine Bunch Images with Powdery Mildew Severity Labels | Mendeley V1, 2026-10-13, DOI 10.17632/z2f3vdc6nh.1 | 2,068 field bunch images, ordinal grades healthy/mild/moderate/severe; one Moroccan vineyard and one season | CC BY 4.0 | Separate fruit/bunch severity model, not a leaf classifier |
| Multi-Fruit Leaf Image Dataset (includes olive) | Mendeley V1, 2026-01-14, DOI 10.17632/82vn9k44ky.1 | 2,308 original images across guava/jackfruit/mango/olive; 18,000 augmented versions also supplied | CC BY 4.0 | Olive exploratory pretraining only; use originals, not augmented copies, until split lineage is audited |
| GVLiD grapevine leaves | Mendeley V5, DOI 10.17632/wkymf8bhcg.5 | 3,477 field-acquired 1080px images; black rot, Esca, leaf blight, healthy | CC BY 4.0 | High-priority grape benchmark; verify metadata and class folder agreement |
| FieldVitis | Zenodo V2, DOI 10.5281/zenodo.17307846 | Field-style grape leaves, four classes; small and imbalanced | Open record; inspect license/attribution of source images before redistribution | Supplementary grape benchmark, never treat as independent of its source datasets without deduplication |

## Previously known sources rechecked

- CitrusUAT (Zenodo DOI 10.5281/zenodo.8294078): still 953 orange-leaf images, 12 classes, with image/mask/ROI assets. HLB labels have qPCR support. Useful for segmentation and orange abnormality classification; not a substitute for field validation.
- Citrus Leaf Disease Dataset (Zenodo DOI 10.5281/zenodo.11148332): still lists two archives, citrus.rar and orange_detection_COCO.rar. The landing page does not provide enough label detail to approve training until archives and annotation schema are inspected.
- GVLiD's V5 record supersedes earlier versions. A Hugging Face mirror/reformat reports 3,477 images and four classes, but its accompanying notes flag metadata templating and one mismatch between disease metadata and class folder. Validate the actual V5 archive and metadata before use.
- FieldVitis Zenodo V1 explicitly says a newer version exists; V2 is DOI 10.5281/zenodo.17307846. V2 has 555 images (158 healthy, 39 black rot, 200 Esca, 158 leaf blight) and is assembled from ESCA-dataset, PlantDoc, and Grape Disease sources. This makes source-level duplicate checks essential.

## Not verified in this refresh

- Lemon Plant Leaf Diseases Dataset (Zenodo): exact record/version and license were not independently confirmed in this search; do not ingest until a stable DOI and license are verified.
- Olive Leaf Image Dataset (Kaggle): candidate is known, but exact version, image provenance, license and overlap with the newer multi-fruit olive subset were not audited.
- Jordan22: keep as a candidate regional dataset; recheck its current release, labels and license before ingestion.

## Training and evaluation gates

1. Download datasets into a separate cache/data location; do not commit raw image archives to Git.
2. Preserve source, DOI/version, license, original filename, class label, crop/plant identity, farm/site, date/season, device and image dimensions in a manifest.
3. Deduplicate exact hashes and perceptual near-duplicates across all sources. FieldVitis is derived from other datasets, so it must not be treated as an independent external test set.
4. Split by farm/site/plant/season where known. Derive crops and augmentations only after assigning the original image to a split.
5. Keep leaves, fruit/bunches, masks and ROIs as distinct task types. Do not mix bunch severity labels into leaf disease classes.
6. Keep visually similar but etiologically different categories distinct; map source labels to a canonical taxonomy only after plant-pathologist review.
7. Evaluate on a held-out Syrian coastal set before any user-facing disease claim. Report per-class sensitivity, specificity, macro-F1, confusion matrix and calibration.
8. Add an explicit unknown/unsupported and low-image-quality abstention path. Never force a disease label when confidence or image quality is inadequate.

## Source links

- Lemon V3: https://data.mendeley.com/datasets/8d9fv6kpt3/3
- Field citrus: https://data.mendeley.com/datasets/szsms728jf/1
- Grape bunch severity: https://data.mendeley.com/datasets/z2f3vdc6nh/1
- Multi-fruit / olive: https://data.mendeley.com/datasets/82vn9k44ky/1
- GVLiD V5: https://data.mendeley.com/datasets/wkymf8bhcg/5
- GVLiD paper: https://www.nature.com/articles/s41597-026-07431-9
- FieldVitis V2: https://zenodo.org/records/17307846
- CitrusUAT: https://zenodo.org/records/8294078
- Citrus Leaf Disease Dataset: https://zenodo.org/records/11148332

Audit date: 2026-11-21.
