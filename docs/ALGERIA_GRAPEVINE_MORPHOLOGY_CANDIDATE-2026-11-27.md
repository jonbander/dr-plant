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
  - Zenodo API metadata explicitly declares `cc-by-4.0` for this exact image record. The full normalized API rights/file snapshot and the CC BY 4.0 legal code are archived under `research/licenses/algeria_grape_morphology_v1/` with SHA-256 checksums. This is the uploader's declared license; it does not independently audit the uploader's chain of title.
- Zenodo FINAL_MASKS record: https://zenodo.org/records/16883403
  - Lists `master_mask_datasheet.csv` (about 3 MB), `master_masks.h5` (about 12.3 GB), and `png_masks.zip` (about 12.1 GB).
  - The datasheet columns include `image_id`, `component_id`, bounding-box coordinates, `dataset`, `original_path`, `file_name`, and four metadata fields.
  - The publicly opened datasheet shows Algeria records before the first California record (the first California row appears at CSV line 684). This means the Algeria section has 683 mask/component rows, **not** necessarily 683 distinct source images. Distinct `original_path` values and one-to-many mask relations must be counted directly before use.
  - Zenodo API metadata independently confirms `cc-by-4.0` for FINAL_MASKS, and for the follow-up DETECT LEAVES, LEAF_MASKS (one of two), and 10 CLASS PREDICTION AND ALIGNMENT records. Exact record IDs, license identifiers, file sizes, and MD5 checksums are archived in `research/licenses/algeria_grape_morphology_v1/zenodo-records-2026-11-27.json`.
- Related open-access ampelographic study: Yahiaoui et al. (2024), *Novel insight into the identification of unexplored table grapes recovered from the Aures (Batna, Algeria): A first ampelographic and molecular characterization*, DOI 10.5073/vitis.2024.63.13. It reports 41 sampled vines, 14 distinct SSR genotypes, and OIV-based ampelographic measurements for novel Aures varieties. The paper is CC BY 4.0. This is contextual scientific evidence, **not** proof that the 477-image archive is the exact image collection used in that study, nor a license for the image archive.
  - Article: https://doi.org/10.5073/vitis.2024.63.13

## Blocking issues

1. **Declared license is now verified.** The exact ALGERIA image record and companion mask/metadata records declare CC BY 4.0 in the Zenodo API. This removes the missing-license blocker, but does not prove the uploader owns every underlying image right; retain attribution and source provenance, and do not overstate the legal review.
2. **Image-to-mask join is partially validated from checksum-verified metadata CSVs.** `LEAF_DATA_METADATA.csv` contains 477 Algeria source-image rows and 477 unique paths. The current `master_mask_datasheet.csv` contains 481 Algeria component rows across 477 unique source paths; four images have a second, very small component that needs visual review. The earlier 683-row count came from a stale indexed copy of the CSV and is superseded by the downloaded file whose MD5 matches the current Zenodo API. The DETECT LEAVES summary says 476 images were processed and 477 leaf crops were found. Its `LEAF_MASK_METADATA.csv` has 478 rows: 477 crop records plus one `NONE_DETECTED` blank-path record; there are 476 nonblank unique source paths. One input path, `AHMEUR_BOU_AHMEUR_ab_27.jpg`, is absent from predicted outputs. Another image, `ICHMOUL_ad_29.jpg`, has two near-identical crops with bounding-box IoU 0.9826, a duplicate-detection candidate.
3. **Mask provenance and quality are not Gold.** DETECT LEAVES explicitly describes its Algeria outputs as model-predicted leaf masks. The four extra components in the legacy mask datasheet are tiny fragments by bounding-box dimensions, and one duplicate crop pair has IoU 0.9826. These masks are pseudo-labels/candidates only until visually reviewed against source images; they are not Gold Masks.
4. **Biological independence is not established.** The metadata provides cultivar and adaxial/abaxial side labels but no vine/tree IDs. Filename parsing identifies 103 possible adaxial/abaxial paired leaf specimens among 287 side-index keys; 184 keys are unpaired. These are candidate leaf-specimen pairs, not verified vine groups. A suspected repeated Louali image appears under two different paths with identical mask bounding boxes; image SHA-256 is needed to confirm or reject the duplicate.
5. **Domain mismatch remains.** The collection is a morphology/germplasm source, not field disease imagery from the Syrian coast. It may help leaf-shape segmentation or representation learning only; it cannot validate disease recognition, curling, mite damage, or lesion detection.

## Safe proposed workflow

1. The declared CC BY 4.0 licenses and source-file MD5 values are now archived. Keep the original source attribution and exact record snapshots with every copy.
2. The small metadata CSVs have been checksum-verified and audited. The next data operation is a small, representative image sample from the 1.6 GB ALGERIA archive, not the 9.6 GB segmentation code archive or the 12+ GB mask archive.
3. Before any training, parse and quarantine:
   - distinct `original_path` count;
   - mask rows and component counts per source image;
   - missing image references;
   - duplicate paths and repeated views;
   - variety and side metadata;
   - image-to-mask filename/path join status.
4. If the join is complete and rights are verified, download a small, representative sample first. Verify archive MD5, file decode, image SHA-256, mask dimensions, mask/image alignment, and mask provenance. Review a stratified human sample before expanding.
5. Build biological/leaf-specimen grouping only from source records that support it. Keep all views/components from the same specimen together. Never use cultivar name, filename similarity, pHash, or image hash as a substitute for vine identity.
6. Register this source as a separate morphology-only dataset. Keep its split separate from disease datasets. It may later support leaf segmentation or shape pretraining, but no disease labels should be fabricated.

## Checksum-verified metadata audit — 2026-11-27

The exact small CSV files were downloaded only after the Zenodo API rights check. Every MD5 matched the checksum published by Zenodo:

| File | Size | Verified MD5 |
|---|---:|---|
| `LEAF_DATA_METADATA.csv` | 2,228,272 B | `ccef9350792840d2c87c4f3b20b8c577` |
| `LEAF_MASK_METADATA.csv` | 6,433,657 B | `f52fa4b908bf6ddb1ebaed36ff8acdaf` |
| `MASTER_LEAF_METADATA.csv` | 6,281,908 B | `eaffe8e3c7068b8cde98a2b671430cdd` |
| `LEAF_DETECTION_SUMMARY.csv` | 290 B | `1908419c1ed31db610debf0156aefe3c` |
| `master_mask_datasheet.csv` | 2,995,071 B | `2e9ed5ceb72ff4cf53412965bca73b26` |

### Counts and integrity findings

- Input inventory: 477 Algeria images, 477 distinct source paths.
- DETECT LEAVES summary: 476 images processed; 477 predicted leaf crops.
- `LEAF_MASK_METADATA.csv`: 478 rows including one `NONE_DETECTED` row with an empty source path; 477 crop records, 476 distinct nonblank source paths. The missing input path is `ALGERIA/SECOND_BATCH/AHMEUR_BOU_AHMEUR_ab/AHMEUR_BOU_AHMEUR_ab_27.jpg`.
- `MASTER_LEAF_METADATA.csv`: 477 rows, 476 distinct source paths. `ICHMOUL_ad_29.jpg` has two crop records whose boxes overlap at IoU 0.9826; quarantine one until visual review.
- `master_mask_datasheet.csv`: 481 Algeria component rows across all 477 unique source paths. Four paths have a second component; each second component is tiny relative to the primary leaf bounding box and should be treated as a possible segmentation artifact, not a second leaf.
- Variety labels in the leaf metadata: Ichmoul 70 crop rows, Babari 61, Amer Bouamar 63, Ichmoul Bacha 29, Louali 64, Bouabane des Aures 64, Tizi Ouinine 65, Ahmeur Bou Ahmeur 60, and one NA. The Ichmoul count includes the duplicate crop noted above.
- Side metadata: 109 adaxial, 282 abaxial, and 86 NA. Filename parsing yields 103 possible matched adaxial/abaxial pairs among 287 specimen-like keys; 184 keys are unpaired. These are not verified vine identities.
- No vine/tree/plot IDs are present in these metadata CSVs. The source therefore cannot support a verified vine-disjoint split.

A separate suspicious duplicate candidate appears in the legacy mask datasheet: `376_LOUALI_ID77.jpg` and `LOULI_ab_1.jpg` have identical component bounding boxes. This is not proof of duplicate image content; verify by downloading the two source images and comparing SHA-256/pHash before grouping.

### Verified Drive backup

The following eight small audit assets were uploaded to the user's Google Drive folder `DrPlant-ALGERIA-Morphology-2026-11-27`:

- five source metadata CSVs (`LEAF_DATA_METADATA.csv`, `LEAF_DETECTION_SUMMARY.csv`, `LEAF_MASK_METADATA.csv`, `MASTER_LEAF_METADATA.csv`, `master_mask_datasheet.csv`);
- the CC BY 4.0 legal code;
- the normalized Zenodo API rights/file snapshot;
- the SHA-256 manifest (the manifest is the seventh asset; there are five CSVs plus two provenance files and one checksum file = eight files total).

Each upload was opened/downloaded again from Drive and compared byte-for-byte using MD5 for the five CSVs and SHA-256 for the legal code, API snapshot, and checksum manifest. All comparisons matched. The corresponding SHA-256 list is archived at `research/licenses/algeria_grape_morphology_v1/SHA256SUMS.txt`. No original image archive or multi-GB model/mask archive was uploaded.

### Google Drive inventory

The connected Drive was searched before downloading these assets. It already contains the earlier French morphology model archive `DrPlant-Vitis-French-Morphology-Model-2026-11-24-v1.zip`, but no matching Algeria source archive or metadata CSVs. The seven audit assets listed above are now stored in a separate folder from that earlier model archive. The 1.6 GB ALGERIA image archive is still not downloaded.

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

**BLOCKED — metadata retrieval is complete, but no image archive has been added to Drive yet, no predicted mask is Gold, no vine-disjoint split exists, and no disease labels are present. No training or production integration.**

The source is promising enough to investigate further because of its North-African grape varieties and the companion mask datasheet. The next safe operation is rights verification and a small-datasheet audit, not model training.


## Sample-level visual audit update — 2026-11-27

A targeted 24-image sample (three per each of eight varieties) and 24 associated predicted mask crops was extracted without downloading the full 1.6 GB archive. Visual inspection shows detached leaves photographed on graph paper, not field images. This makes the source useful only for controlled leaf outline/lobe/vein morphology, not field disease recognition. A cross-path exact duplicate was confirmed: `376_LOUALI_ID77.jpg` and `LOULI_ab_1.jpg` have identical SHA-256 and identical predicted mask bytes. `ICHMOUL_ad_29.jpg` has two near-identical predicted crops (bbox IoU 0.9826; alpha-mask IoU 0.9573). `AHMEUR_BOU_AHMEUR_ab_27.jpg` visibly contains a leaf but has no predicted mask. The sample ZIP is in the Drive audit folder; its SHA-256 is recorded in `research/licenses/algeria_grape_morphology_v1/SHA256SUMS-v2.txt`. Full findings are in `docs/ALGERIA_GRAPE_SAMPLE_VISUAL_AUDIT-2026-11-27.md`.
