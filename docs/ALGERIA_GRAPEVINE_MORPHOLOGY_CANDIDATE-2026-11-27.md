# Candidate source audit: Algerian grapevine morphology and leaf masks

**Audit date:** 2026-11-27  
**Status:** CANDIDATE ONLY — blocked from training and redistribution pending source-rights and asset-integrity checks  
**Scope:** leaf segmentation / shape representation only; not disease diagnosis

## Why this source matters

A newly identified Zenodo collection contains an Algeria-specific grapevine leaf archive with 477 images across eight named varieties, including Ichmoul, Tizi Ouinine, Bouabane des Aures, Louali, Amer Bouamar, Babari, Ahmeur Bou Ahmeur, and Ichmoul Bacha. The archive is listed as 1.6 GB (record DOI 10.5281/zenodo.16883367).

A companion record, FINAL_MASKS (DOI 10.5281/zenodo.16883403), publishes a master mask datasheet and more than 24,900 segmented grapevine-leaf masks across several source collections. Its datasheet includes `dataset`, `original_path`, `file_name`, and metadata fields, which appear to provide a path for matching Algeria images to mask records.

This is relevant to Dr.Plant's morphology objective because it may provide leaf silhouettes and shape examples from a Mediterranean/North-African grape germplasm context. It does **not** provide grape disease labels in the described Algeria collection and must not be treated as disease-training data.

## Verified public facts

- Zenodo ALGERIA record: https://zenodo.org/records/16883367
  - Record description: 477 grapevine leaf images and eight named Algerian varieties.
  - Listed file: `ALGERIA.zip`, approximately 1.6 GB.
  - The record's visible HTML exposes a generic Rights/License heading but does not display a specific license identifier. Do not infer a license from the article or from a related record.
- Zenodo FINAL_MASKS record: https://zenodo.org/records/16883403
  - Lists `master_mask_datasheet.csv` (about 3 MB), `master_masks.h5` (about 12.3 GB), and `png_masks.zip` (about 12.1 GB).
  - The datasheet columns include `image_id`, `component_id`, bounding-box coordinates, `dataset`, `original_path`, `file_name`, and four metadata fields.
  - The publicly opened datasheet shows Algeria records before the first California record (the first California row appears at CSV line 684). This means the Algeria section has 683 mask/component rows, **not** necessarily 683 distinct source images. Distinct `original_path` values and one-to-many mask relations must be counted directly before use.
  - NLM's dataset catalog describes FINAL_MASKS as CC BY 4.0, but the rights statement must still be reconciled against the exact Zenodo record metadata and the underlying image archive. NLM record: https://datasetcatalog.nlm.nih.gov/dataset?q=0002015640
- Related open-access ampelographic study: Yahiaoui et al. (2024), *Novel insight into the identification of unexplored table grapes recovered from the Aures (Batna, Algeria): A first ampelographic and molecular characterization*, DOI 10.5073/vitis.2024.63.13. It reports 41 sampled vines, 14 distinct SSR genotypes, and OIV-based ampelographic measurements for novel Aures varieties. The paper is CC BY 4.0. This is contextual scientific evidence, **not** proof that the 477-image archive is the exact image collection used in that study, nor a license for the image archive.
  - Article: https://doi.org/10.5073/vitis.2024.63.13

## Blocking issues

1. **Image license is unresolved.** The ALGERIA image record does not expose a specific license identifier in the visible record. The article's CC BY 4.0 license does not automatically license the separate image archive. Do not download for training, redistribute, or copy into Dr.Plant until the record-level grant is verified.
2. **Image-to-mask join is not yet validated.** The mask datasheet has 683 Algeria component rows before the California section, while the image record advertises 477 images. These are different units and may be compatible, but the exact number of unique source paths, missing images, duplicate paths, and multi-component masks must be computed from the full CSV.
3. **Mask provenance and quality are unknown.** The public description calls them segmented masks but does not establish whether each mask is manually annotated, machine-generated, or manually corrected. They are not Gold Masks for Dr.Plant until provenance and quality are independently audited.
4. **Biological independence is not established.** Variety labels are not vine/tree IDs. Front/back or repeated views of the same leaf may occur. Filename suffixes, batch folders, and variety names cannot be promoted to verified vine identity without source evidence.
5. **Domain mismatch remains.** The collection is a morphology/germplasm source, not field disease imagery from the Syrian coast. It may help leaf-shape segmentation or representation learning only; it cannot validate disease recognition, curling, mite damage, or lesion detection.

## Safe proposed workflow

1. Verify the exact license for the ALGERIA image archive and the matching mask files from Zenodo metadata/API or written source confirmation. Keep the source records and checksums in the license archive.
2. Retrieve only the small master datasheet first. Do not download the 1.6 GB image archive or 24 GB mask archive until the rights check passes.
3. Parse the datasheet to produce an Algeria-only inventory with:
   - distinct `original_path` count;
   - mask rows and component counts per source image;
   - missing image references;
   - duplicate paths and repeated views;
   - variety and side metadata;
   - image-to-mask filename/path join status.
4. If the join is complete and rights are verified, download a small, representative sample first. Verify archive MD5, file decode, image SHA-256, mask dimensions, mask/image alignment, and mask provenance. Review a stratified human sample before expanding.
5. Build biological/leaf-specimen grouping only from source records that support it. Keep all views/components from the same specimen together. Never use cultivar name, filename similarity, pHash, or image hash as a substitute for vine identity.
6. Register this source as a separate morphology-only dataset. Keep its split separate from disease datasets. It may later support leaf segmentation or shape pretraining, but no disease labels should be fabricated.

## Additional pipeline discovered after the first audit

A later Zenodo record, DETECT LEAVES (DOI 10.5281/zenodo.20090333), explicitly lists the same ALGERIA source under its `LEAF_DATA/ALGERIA` input and publishes small metadata files alongside the processing archive:

- `LEAF_DATA_METADATA.csv`
- `LEAF_DETECTION_SUMMARY.csv`
- `LEAF_MASK_METADATA.csv`
- `MASTER_LEAF_METADATA.csv`

The record description says the pipeline standardizes images to a 1024-pixel longest side, trains a YOLOv26-nano leaf-segmentation model, then predicts individual leaf masks and stores parent-image paths, source dataset, bounding boxes, and crop transformations. It explicitly describes the resulting masks as predicted masks. The same pipeline description says its training data were randomly partitioned 80/10/10 after shuffling. Therefore:

- The metadata files may resolve the one-to-many image-to-mask join and let us count Algeria masks without downloading the large archives.
- Algeria masks generated by inference are **pseudo-labels/predictions**, not human Gold Masks.
- The segmentation model's reported random image split is not proof of vine/specimen independence and must not be used as a validated benchmark.
- The 9.6 GB processing archive and 1.9 GB reduced-image archive are not needed for the next audit step. Prefer retrieving only the small CSV metadata files, after checking their exact record-level rights.

A second record, 10 CLASS PREDICTION AND ALIGNMENT (DOI 10.5281/zenodo.20241355), describes a downstream morphology pipeline that predicts ten anatomical regions/classes from leaf masks: mid/distal/proximal lobes, primary and secondary veins, and petiolar junction. It uses Euler Characteristic Transform features and aligns leaves by the petiolar junction and midvein. This is highly relevant to Dr.Plant's shape/vein representation objective, but it is still an anatomical morphology pipeline, not a disease or lesion detector. Its training annotations, split independence, license, and generalization need separate review before any reuse.

Links:
- DETECT LEAVES: https://zenodo.org/records/20090333
- 10 CLASS PREDICTION AND ALIGNMENT: https://zenodo.org/records/20241355

**Revised next audit operation:** retrieve only the small metadata CSVs from the DETECT LEAVES record; compute exact Algeria image/mask counts, join coverage, specimen/view relationships, and source IDs. Do not retrieve the 9.6 GB model archive or 12+ GB mask archive yet.

## Decision

**BLOCKED — no download, no training, no Gold Mask designation, no production integration.**

The source is promising enough to investigate further because of its North-African grape varieties and the companion mask datasheet. The next safe operation is rights verification and a small-datasheet audit, not model training.
