# Next training cycle: unused-image recovery, audit and controlled training

**Project rule:** The user's approved first priority is to train on images that have not been used in any previous Dr.PLANT training run. "Unused" does not mean "automatically safe to train". Every candidate must first pass source/license, image integrity, label, duplicate and split-leakage checks. Images that fail remain quarantined with reasons; they are not silently discarded or relabelled.

## 1. Reconcile what has already been used

The 23 November 2026 training report records these source-specific exploratory runs:

| Source | Previously used unique images | Existing exclusions / limitations | Next action |
|---|---:|---|---|
| GVLiD V5 | 1,323 (Esca 885, Healthy 438) | 2,154 excluded/quarantined due to metadata conflicts/duplicate issues; only two classes retained | Recover row-level source/audit/split manifests and source archive; re-audit excluded rows individually. Do not train the 2,154 as a batch. |
| Citrus Leaf Disease, Zenodo 11148332 v1 | 1,863 | 81 exact duplicate copies excluded; 16 perceptual pairs grouped; source images absent from current workspace; labels not independently reviewed | Recover exact archive and manifest; verify archive checksum/version; reproduce split and ONNX evaluation before any extension. |
| Grape Leaf Health, Mendeley 378c69nwk5 v1 | 2,574 raw originals | 427 exact duplicate copies excluded; 34 pHash pairs grouped; augmented derivatives excluded; 3,001 raw entries vs source description 3,000 | Recover raw archive and image/split manifests; reconcile all source entries against previous-run SHA-256 manifests. Do not treat augmented derivatives as new independent images. |

These three sets total 5,760 unique image records used in the documented baselines, but that sum is not a count of globally unique images across all sources. Cross-source identity must be resolved by hashes and, where feasible, perceptual matching.

## 2. Recover reproducibility artifacts before training

The repository currently contains summaries and metrics, but the Phase 1 audit explicitly says the complete GVLiD row-level manifests and Citrus source images are absent from the workspace. Recover from the archived Drive training bundle and/or the original licensed source archives:

- exact archive files and their SHA-256 checksums;
- row-level source manifests, class labels, source paths and exclusion reasons;
- exact and perceptual duplicate-group manifests;
- prior train/validation/test assignments and group IDs;
- training configuration, random seeds, checkpoint hashes, ONNX hashes and logs;
- all previous-run SHA-256 manifests, to prevent accidentally reusing images as "new".

The published training bundle SHA-256 is recorded in `SHA256SUMS.txt`; verify it after retrieval before extracting. Never overwrite the original bundle or prior checkpoints.

## 3. Build a global unused-image ledger

Create one canonical row per candidate image with at least:

- dataset ID/version, archive hash, source URL and retrieval date;
- original relative path, byte size, decoded dimensions, format and decode status;
- SHA-256, perceptual hash and duplicate-component ID;
- source label, label origin, label confidence and expert-review status;
- license/provenance status at image/package level;
- plant part/task (leaf, fruit, bunch, cane, segmentation, detection);
- crop/species/cultivar/region/collection date/site/plant/session only when supplied by source metadata;
- prior-use status: train, validation, test, excluded, unknown;
- decision: eligible, quarantine, or blocked, with a reason.

Compare every candidate hash against every prior training manifest, not only the same dataset. A file with unknown prior-use status is not eligible until reconciled. Exact duplicates across different sources count as already seen. Near-duplicates must be grouped and manually reviewed; derivatives never cross splits.

## 4. Revisit excluded and unused candidates in this order

1. **GVLiD quarantined 2,154 rows:** determine which are duplicate copies, metadata conflicts, unsupported classes, ambiguous source paths or potentially recoverable valid examples. Resolve only from source records and image-level evidence. Keep unresolved rows quarantined.
2. **Citrus source archive and manifests:** restore missing image files and verify the existing 1,863-image run; then inspect any source images not represented in its prior training manifest.
3. **Grape Leaf Health archive:** reconcile all 3,001 raw entries, the 2,574 previously used unique images, and the 427 exact duplicates; inspect any unaccounted raw entries. Do not count augmented derivatives as new evidence.
4. **Other pending candidates:** North Portugal 2026 remains blocked while its Zenodo archive endpoint returns 410; FieldVitis remains blocked by unresolved license and source overlap; CitrusUAT is a segmentation task; bunch powdery-mildew images are a separate bunch-severity task; fruit detection, UAV and olive datasets remain separate tasks until their rights/labels/task fit are audited. Private-licensed Roboflow data must not be reused without permission.
5. **Newly sourced datasets:** prioritize leaf-level, field-collected and regionally relevant crops (grape first, then Syrian coastal crops and citrus, followed by other crops). Register candidates only; no training until the complete archive audit and split gates pass.

## 5. Training rules and evaluation

- Keep different tasks and incompatible class ontologies separate; do not merge unrelated source-folder labels into one diagnosis class.
- Keep farm/site/plant/session groups isolated when real metadata exists. If it does not, disclose the limitation and classify the run as exploratory; never invent group IDs.
- Preserve a locked independent test set. Never tune thresholds, select models or revise labels based on the final test set.
- Report per-class precision/recall/F1, macro-F1, balanced accuracy, confusion matrix, calibration, source-wise and group-wise performance.
- Add external-domain and unknown/OOD challenges, including nutrient disorders, abiotic stress, mixed symptoms, healthy leaves and unseen diseases.
- A training run is complete only when its command, environment, data manifest hash, split hash, config, seed, checkpoint hash, logs and metrics are saved and independently reproducible.
- Do not deploy or promote a model based on high source-split accuracy alone. Require expert review and Syrian coastal field validation.

## 6. Immediate execution status and blocker

This plan is committed as the work order for the next data cycle. The current repository evidence does not include the original image archives or all required row-level manifests in the active workspace. Therefore no new training command can responsibly be run yet. The next concrete operation is recovery and checksum verification of the 23 November Drive bundle and source archives, followed by construction of the global unused-image ledger. If the bundle cannot be fetched in the current cloud/browser environment, preserve this plan and report the exact missing artifact rather than pretending training occurred.
