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
