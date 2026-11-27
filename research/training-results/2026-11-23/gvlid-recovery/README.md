# GVLiD row-level manifest recovery and model re-evaluation

Date: 2026-11-23

## What was recovered

The original row-level curation manifest was missing from the active workspace. It was reconstructed by joining the 3,477-row GVLiD metadata file, the companion repository's per-file SHA256 list and image-quality table, and the 1,323 curated image files retained in the workspace. The source record is Mendeley Data V5, DOI `10.17632/wkymf8bhcg.5`, CC BY 4.0.

Files:

- `source-image-inventory.csv`: metadata inventory for all 3,477 source image rows. Images not present locally remain metadata-only; no source image files were downloaded for this recovery.
- `recovered-image-manifest.csv`: the 1,323 curated files available locally, with source metadata, SHA256, perceptual hash, vineyard ID, reconstructed split and prior-experiment role.
- `recovery-audit.json`: audit counts, methods and limitations.
- `restored-split-evaluation.json`: model and external open-set evaluation outputs.

## Audit outcome

- 3,477 source metadata rows.
- 1,323 curated local image files retained: 885 Esca and 438 Healthy.
- All 1,323 current image SHA256 values match the source checksum table.
- The source inventory contains 1,344 folder-vs-metadata label conflicts.
- 446 exact-SHA duplicate groups contain 1,514 file rows; 3 groups cross class labels.
- The retained 1,323 images contain no exact-SHA duplicate groups and no perceptual duplicate groups at pHash Hamming distance ≤6.
- The retained GVLiD images have no pHash matches at Hamming distance ≤6 against the processed Grape Leaf Health Mendeley V1 images.
- The source quality table marks every source row `blurry_flag=1`; this is non-discriminating and was not used as a blanket exclusion.

The 2,154 non-retained source rows are marked `unused_in_GVLiD_model_experiment` and excluded/quarantined in the inventory. Where a metadata-label conflict or exact-duplicate group is evidenced, the reason is recorded. The inventory does not invent a reason for any row whose prior curation rationale is not recoverable.

## Reconstructed vineyard split

The prior training summary recorded the four held-out test vineyards and four validation vineyards. Those IDs were joined to the restored per-image metadata. The reconstructed counts exactly match the previous split summary:

| Split | Esca | Healthy | Total |
|---|---:|---:|---:|
| Train | 622 | 331 | 953 |
| Validation | 136 | 59 | 195 |
| Test | 127 | 48 | 175 |

The full source paper describes 34 vineyards; the curated subset used for this model contains 28 vineyard IDs. The source region is Maharashtra, India. Exact farm GPS coordinates are withheld from the public manifests; anonymized vineyard IDs and region/season metadata are retained. This does not establish transferability to Syrian coastal vineyards.

## Model re-evaluation

The saved MobileNetV3-Small checkpoint and ONNX export were evaluated again against the reconstructed held-out test rows. The ONNX model reproduced 174/175 predictions correctly (99.43% accuracy; confusion matrix `[[126, 1], [0, 48]]`). Checkpoint and ONNX argmax predictions agreed on all 175 test images; maximum absolute logit difference was approximately `3.4e-5`.

An independent Grape Leaf Health dataset was used as an open-set probe. It contains no Esca-positive images, so it cannot measure Esca sensitivity. At the exploratory raw-score threshold 0.85, the model generated false Esca alerts on 30/293 other-disease validation images and 37/366 other-disease test images, and on 0/119 and 0/149 healthy images respectively. The threshold was explored after inspecting both validation and test distributions, so test operating-point values are explicitly post-hoc/exploratory rather than a preregistered untouched threshold test.

Temperature scaling fitted to in-domain validation reduced in-domain NLL but increased false Esca alerts on external unseen-disease images. It is therefore not enabled in the pilot. The app displays raw model score, not a calibrated probability.

## Training and integration status

No new training was performed in this recovery task. The existing model is enabled only as an experimental two-class grape-leaf pilot. It is not accepted into the unified multi-crop model because it does not recognize other grape diseases, has no Syrian field validation, and still produces open-set false alerts. The app must never translate its source `Healthy` class into a claim that the leaf is healthy.

## Sources

- GVLiD Mendeley Data V5: https://data.mendeley.com/datasets/wkymf8bhcg/5
- Companion metadata/checksum repository: https://github.com/MilindGayakwad/DNN
- External Grape Leaf Health Mendeley V1: https://data.mendeley.com/datasets/378c69nwk5/1
