# Dr Plant training-data readiness and split protocol

This protocol prepares a reproducible split manifest only after a dataset has passed its source, licensing, pairing, and label-review gates. It does **not** download data, create labels, copy images, train a model, or certify diagnostic performance.

## Required upstream work

1. Obtain the exact dataset archive and record its version, source URL, retrieval date, archive checksum, and applicable license.
2. Verify redistribution/use rights for the dataset package and the actual image files. A paper's license is not automatically the dataset's license.
3. Run the dataset-specific structural audit (for HERMOS, `scripts/audit-hermos.py`) and resolve ambiguous image/XML pairs, malformed annotations, invalid boxes, and exact duplicates.
4. Review labels against the original source and have a qualified plant-health reviewer verify the biological label. Do not convert social posts or unverified field leads into training labels.
5. Populate the audit manifest fields:
   - `provenance_verified=yes` only after image-level rights and provenance are documented.
   - `expert_label_review=yes` only after the label review is documented.
   - `near_duplicate_review=yes` only after perceptual/manual near-duplicate review is complete for that image and any duplicate groups have been reconciled.
   - `group_id_for_split` with the strongest known dependency group, preferably vineyard/site and then plant/capture session. Do not invent group IDs where metadata is absent.

## Create a split manifest

After the gates above are complete:

```sh
python scripts/prepare_training_splits.py /path/to/audit/hermos-manifest.csv --out /path/to/training-split-output --seed 42
```

The script requires:
- a uniquely paired, parseable image/XML record;
- a valid SHA-256 and no byte-identical duplicate images;
- explicit near-duplicate review for every image;
- verified provenance/license and expert-reviewed labels;
- a non-empty group ID for every image;
- each class to occur in at least three independent groups;
- every class to appear in train, validation, and test.

It creates `training-splits.csv` and `training-split-report.json`, using group-isolated 70/15/15 train/validation/test targets. The split search is deterministic for a fixed seed and rejects the dataset if it cannot preserve class coverage without group leakage.

## Important limitations

- The script trusts the two manually reviewed yes/no fields; it cannot prove that the review happened.
- Group IDs must be based on real provenance metadata. A random or filename-derived ID is not a valid substitute.
- SHA-256 detects exact byte duplicates only. Near-duplicate photographs require perceptual/manual review before training.
- A successful split is not evidence that classes are balanced, labels are biologically correct, or the test set represents coastal Syrian farms.
- Do not train or promote a model until near-duplicate review, class balance review, independent test design, and dataset-specific licensing checks are complete.


## Lemon image-classification candidates — citrus scab (15 November 2026)

Two public candidate records list citrus-scab classes and CC BY 4.0 on their Mendeley Data landing pages:

| Dataset | Images | Scab class | Collection region | Current decision |
|---|---:|---:|---|---|
| LemonLENS V2 | 4,500 | 500 | Baburhat, Chandpur, Bangladesh | Candidate; archive and package identity need inspection |
| LLD V1 | 4,775 | 333 | Kushtia and Khulna, Bangladesh | Candidate; archive and group/duplicate metadata need inspection |

Sources:
- [LemonLENS V2](https://data.mendeley.com/datasets/ccwh64fr2r/2), DOI `10.17632/ccwh64fr2r.2`.
- [LLD V1](https://data.mendeley.com/datasets/9ywvpv3xtg/1), DOI `10.17632/9ywvpv3xtg.1`.

Both are Bangladesh datasets, not Syrian coastal data. The landing pages list CC BY 4.0, but the exact downloaded packages, file-level provenance/terms, class-folder contents, label quality, exact/near duplicates, and real dependency groups have not yet been audited. LLD reports a short collection window (20–28 August 2023); LemonLENS reports a 2.65 GB and a 4.13 GB archive option, which must be reconciled before choosing the canonical file.

**Training decision:** these records are registered as candidates only. Do not train from landing-page counts, do not mark the images as expert-confirmed, and do not split individual images randomly. No archive is present in the repository, no audited image manifest exists for either dataset, and no training run has been performed. The first eligible task is a source/archive audit and a group-aware split feasibility check. If trustworthy site/session groups cannot be recovered, these datasets cannot support a leakage-resistant independent test and should not be used to claim generalization.


## Reproducible image-classification baseline (15 November 2026)

The repository now contains an optional PyTorch MobileNetV3-Small baseline for lemon or grape **leaf-image classification**, separate from HERMOS Pascal-VOC lesion detection.

### Dataset candidates and source review

- **Large-Scale Lemon Leaf Disease and Pest Dataset, V3**: Mendeley record published 4 November 2026; 17,586 images, 18 categories including citrus scab, four named sites in Bangladesh, collection period 2 March–28 May 2025, CC BY 4.0. V3 does not expose per-class counts in its description. Earlier V1/V2 counts must not be carried forward. The dataset claims expert review, but the archive and image-level grouping remain unaudited. [V3 record](https://data.mendeley.com/datasets/8d9fv6kpt3/3).
- **LemonLENS V2**: 4,500 images and 500 per class including citrus scab, from one named collection area in Bangladesh; CC BY 4.0. Archive size options differ (2.65 GB and 4.13 GB), so canonical package identity must be checked. [V2 record](https://data.mendeley.com/datasets/ccwh64fr2r/2).
- **LLD V1**: 4,775 images including 333 citrus-scab images, collected in Kushtia and Khulna, Bangladesh over 20–28 August 2023; CC BY 4.0. Per-image site/session mapping is not stated. [V1 record](https://data.mendeley.com/datasets/9ywvpv3xtg/1).
- **HERMOS V2**: grape leaf object-detection annotations in Pascal VOC XML; keep separate from image-level classification datasets. [V2 record](https://data.mendeley.com/datasets/j4xs3kh3fd/2).
- **North Portugal grape leaves**: candidate only; the paper's CC BY 4.0 license does not substitute for checking the Zenodo dataset's own Rights metadata and file terms. [Zenodo record](https://zenodo.org/records/17343473).

Mendeley states that public datasets can be downloaded through its public API, but the documented API uses OAuth2 for API requests. No archive download or checksum verification is claimed here. Mendeley also states that it does not currently validate or curate the contents of deposited datasets; a depositor's description is not independent verification.

### Local audit commands

```sh
python scripts/audit_image_classification_dataset.py /path/to/extracted/class-folders \
  --dataset-id 8d9fv6kpt3 --version 3 --license "CC BY 4.0" --out audit --verify-images
python scripts/test_audit_image_classification_dataset.py
```

The audit writes `image-manifest.csv` and `archive-audit-report.json`, computes SHA-256, counts class folders, detects byte-identical duplicates, and optionally checks image decoding with Pillow. Provenance, expert-review, near-duplicate and group fields intentionally default to unverified/empty.

### Review, split and train gates

After source-level and expert review, populate the manifest flags and verified `group_id_for_split` values. Do not invent site/plant/session identifiers from filenames. Then run:

```sh
python scripts/prepare_classification_splits.py audit/image-manifest.csv --out splits
python scripts/train_image_classifier.py /path/to/extracted/class-folders splits/training-splits.csv --out model-output --epochs 12 --batch-size 32 --pretrained
```

Install optional dependencies with `pip install -r requirements-training.txt`. The training script selects checkpoints using validation accuracy and evaluates the held-out test split once. It reports per-class metrics, macro-F1 and a confusion matrix.

**Current blocker:** public landing pages name collection sites but do not establish that every image can be assigned to a specific independent site/plant/session group. LemonLENS names one collection area; LLD gives two districts and a nine-day window; HERMOS and Portugal grape archives still need their own package audit. If the archive cannot supply at least three genuine independent groups per class, the group-aware split script deliberately refuses training. A random image split would not be independent and must not be presented as held-out generalization.

### Model scope

MobileNetV3-Small is a baseline classifier, not an integrated production diagnosis system. It does not prove pathogen identity, local prevalence, or accuracy in Syrian coastal orchards. Do not merge model weights into the app or describe the app as trained until an actual archive audit, group-isolated training run, independent evaluation, and deployment integration are completed.


## Android-friendly Colab runner

Notebook: [DrPlant Lemon V3 exploratory training](../notebooks/DrPlant_Lemon_V3_Exploratory_Training.ipynb).

Open it in Colab from the GitHub file page, choose a GPU runtime if available, and run the cells in order. It attempts the Mendeley public API download and falls back to a Google Drive ZIP path if API access requires OAuth. It records the archive hash, audits class counts and exact duplicates, creates an explicitly non-independent exploratory split, trains MobileNetV3-Small, and saves the checkpoint and metrics to Google Drive. Do not use the exploratory metrics as independent test performance.


### Conflicting exact-image labels in exploratory splits

The exploratory splitter groups byte-identical images by SHA-256. If one hash appears under more than one class label, **all rows in that hash group are quarantined** in `quarantined-conflicting-label-duplicates.csv`; none is assigned to train, validation, or test. The report records the number of quarantined files and hash groups. This avoids arbitrarily trusting one of two contradictory labels. If quarantine leaves fewer than three unique unambiguous images in any class, the split is blocked and a report with status `blocked_insufficient_unique_images_after_quarantine` is written. Resolve the source data or obtain additional valid images; do not disable this check.

The Colab notebook checks the split command's exit status before reading its report or starting training, so a failed split cannot be followed by a misleading `FileNotFoundError` or accidental training on stale outputs.


## Immediate post-training delivery and confirmed-knowledge integration (mandatory)

This is the default operating sequence for every future research/training batch. **Training and backup run in parallel; verified results are integrated into the project immediately rather than left only in a notebook or chat.**

### A. After every training run

1. Save the complete reproducible run: source/version/license, archive checksum when available, image manifest, group split, code/config, pretrained and trained weights, metrics, per-class results, confusion matrix, limitations, and a model card.
2. Package the run as one versioned artifact and upload it to Google Drive immediately after the run finishes. Do not wait until the end of a large research phase. If a run is too large, split it into clearly named packages and upload each package as soon as it is complete.
3. Confirm the exact uploaded filename, successful completion, and displayed size in Drive. Record the local SHA-256 and upload evidence in `docs/DRIVE_BACKUP_REGISTER.md`. A displayed filename/size is not remote cryptographic verification; state that limitation unless a remote checksum was actually compared.
4. Only after confirming the Drive copy, remove the corresponding heavy local archive, temporary images, embeddings, checkpoints, and package. Keep the small source code, manifests, metrics, model card, audit reports, and backup register in the project. Never delete the only copy of any artifact.
5. If upload or verification fails, keep the local copy and retry using another method; do not delete it to free space.

### B. Immediately integrate confirmed information into the project

1. When a scientific fact, dataset metadata, license, source, symptom relationship, or other finding is confirmed, add it in the same work session to the appropriate project location: `data/knowledge-base.json`, a crop/disease reference document, dataset registry, or evidence documentation. Include the source URL/DOI, evidence status, date/version where relevant, and limitations. Run `bun run validate:knowledge` after knowledge-base changes.
2. Keep evidence levels explicit: reference-only, suspected, reported, or expert-confirmed. A paper or dataset description alone does not make a local Syrian field diagnosis expert-confirmed. Never upgrade evidence status merely because multiple models agree.
3. For each completed training run, immediately add a project-side model/dataset record and a short result summary linking to the Drive artifact, code, manifest, metrics, model card, intended use, and known limitations. Do not leave the model's existence discoverable only from Drive or chat.
4. Add confirmed knowledge to the shared knowledge base immediately; do not wait for another training cycle. Conversely, a knowledge update does not automatically require weight retraining. Retrain only when the new verified data are suitable and enough to justify it.

### C. Model integration and merge gate

1. A completed training run is immediately attached to the project as a versioned, documented research artifact. It is **not** automatically activated in the user-facing app.
2. Before activation or merging model weights into the app, verify the input/output contract, preprocessing, class mapping, calibration/abstention behavior, independent group/site test, per-class metrics, and regression tests against the current model/version. Preserve the previous working model and make rollback possible.
3. If a model is only a controlled-image morphology pilot, exploratory classifier, or otherwise not field validated, register it as experimental and keep it outside disease diagnosis. Do not present it as a disease model or as validated for Syrian coastal farms.
4. After all gates pass, integrate the versioned model and required metadata into the model registry/app, run tests/build, document the change, and only then propose or perform the code merge. Never replace a working model merely because a new run completed.

### D. Parallel-work checklist

For each batch, track these two workstreams together:

- **Research/training:** source and license audit → image/label/duplicate review → group-isolated evaluation → model card and metrics.
- **Preservation/integration:** package → Drive upload → verify → update backup register → delete only verified heavy local copies; at the same time, add confirmed findings and the run record to the project.

A batch is not considered finished until both workstreams are recorded, or any blocked step is explicitly reported with its reason.
