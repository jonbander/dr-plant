# Dr.Plant — Phase 1 data and model audit

**Date:** 2026-11-23  
**Status:** Initial audit and low-cost evaluation experiments completed. No existing model weights, original source images, or previous training outputs were deleted or replaced.

## Executive findings

1. The grape five-class MobileNetV3-Small baseline is reproducible from its saved checkpoint on the 515-image held-out split. With the exact torchvision preprocessing, PyTorch and ONNX predictions agree on all 515 images. Accuracy is **61.17%**, macro-F1 **55.08%**, and balanced accuracy **55.27%**. This remains a weak research baseline.
2. Temperature scaling fitted on the validation split improves calibration on the held-out test split: ECE falls from **0.120 to 0.057** and NLL from **1.043 to 0.966**, with unchanged accuracy. This is a calibration improvement, not a diagnostic-accuracy improvement.
3. A nearest-neighbour retrieval test using the grape model's penultimate embeddings does not yet justify replacing the classifier. Top-5 majority-vote accuracy is **62.14%**, but macro-F1 is **53.57%**, below the classifier's 55.08%.
4. The two-class GVLiD Esca/Healthy model was stress-tested on 515 held-out images from a separate grape dataset. It classified **91.3%** of that dataset's Healthy images as Healthy, but also classified **73.2%** of the other four disease categories as Healthy. The Esca-probability AUROC separating these unseen disease categories from Healthy was only **0.624**. This is an open-set warning: the binary model does not know how to reject unfamiliar diseases.
5. The Citrus split manifest can be re-audited from its stored pHash values: 16 image pairs at Hamming distance <=6 were found, and no connected near-duplicate component crosses train/validation/test. However, the actual Citrus image files are absent from the current workspace, so inference could not be independently rerun here.
6. The current GVLiD folder contains the 1,323 curated images and model outputs, but not the full row-level split manifest or original audit manifest. Its high reported score therefore cannot yet be fully reconstructed from the files in this workspace alone.

## Dataset and artifact audit

| Dataset | Available locally | Existing split/evidence | Current limitation |
|---|---|---|---|
| GVLiD V5, Esca vs Healthy | 1,323 curated images, checkpoint, ONNX, report | Report states vineyard-disjoint split: 953/195/175 | Row-level split and source audit manifests are not in this workspace; test result needs a complete reproducibility bundle |
| Citrus Leaf Disease, Zenodo 11148332 | Model, report, 1,863-row split manifest | pHash re-audit confirms 16 pairs and zero cross-split components | Source images are absent; labels are not Dr.Plant expert-confirmed; no orchard/site groups |
| Grape Leaf Health, Mendeley 378c69nwk5 | 2,574 unique processed images, image manifest, split manifest, checkpoints, ONNX | 1,647/412/515 split; zero group overlap across splits | Groups isolate known near-duplicates only; no farm/site/plant/session IDs; labels are folder-derived |

The three datasets are not a single compatible classification task. Their class vocabularies differ, and they must not be merged into one classifier without an explicit label ontology and source-aware evaluation.

## Grape model: reproducibility, calibration, and retrieval

Saved artifacts were loaded and evaluated using the exact model checkpoint and torchvision preprocessing (`Resize((160,160))`, `ToTensor`, ImageNet normalization). PyTorch and ONNX had **100% prediction agreement** on all 515 held-out test images.

### Baseline

- Accuracy: 61.17%
- Macro-F1: 55.08%
- Balanced accuracy: 55.27%
- Held-out test size: 515

### Temperature scaling

A single temperature was selected by minimizing validation negative log-likelihood only (T = 1.439). It was then applied to the untouched test logits.

| Metric | Before | After |
|---|---:|---:|
| Test NLL | 1.043 | 0.966 |
| Test ECE (15 bins) | 0.120 | 0.057 |
| Test accuracy | 61.17% | 61.17% |

Interpretation: confidence estimates became better calibrated on this split, but the classifier did not become more accurate. The temperature is dataset-specific and must not be treated as a universal Dr.Plant threshold.

### Embedding retrieval

Cosine nearest-neighbour search used the penultimate MobileNetV3 representation, with the training split as the reference library and test split as queries.

| Retrieval | Accuracy | Macro-F1 |
|---|---:|---:|
| Classifier | 61.17% | 55.08% |
| 1-NN | 59.81% | 52.53% |
| 3-NN majority | 60.58% | 53.19% |
| 5-NN majority | 62.14% | 53.57% |

Interpretation: top-5 retrieval slightly increases raw accuracy but reduces macro-F1. It is not yet a better diagnostic head. Next retrieval experiments should compare class-balanced voting, similarity thresholds, and a classifier/retrieval hybrid on validation data before one final test evaluation.

Detailed result: `phase1-audit/grape-phase1-evaluation.json`.

## GVLiD open-set stress test

The GVLiD model has only two output classes: Esca and Healthy. It was applied to the held-out test images from the separate five-class Grape Leaf Health dataset. The four non-Healthy source classes are treated only as **unseen categories** for this stress test; they are not relabelled as Esca.

- 149 source-Healthy images: 91.3% predicted Healthy.
- 366 images from the four unseen disease categories: 26.8% predicted Esca and 73.2% predicted Healthy.
- AUROC using Esca probability as an unseen-disease score: 0.624.

Interpretation: a two-class classifier can confidently force unfamiliar diseases into one of its known classes. This supports adding an explicit unknown/reject path, but this single proxy test is not enough to choose or validate a production rejection threshold.

Detailed result: `phase1-audit/gvlid-external-open-set-probe.json`.

## Reproducibility and environment constraints

- Existing Python environment: Python 3.12.3, PyTorch 2.15.0, torchvision present, ONNX Runtime present, scikit-learn present.
- CUDA is unavailable; all current experiments ran on CPU.
- DINOv2/timm/transformers are not installed and no DINOv2 checkpoint is cached.
- Available filesystem space is approximately 797 MB (97% used). A large model download or installation is intentionally deferred until storage is safely addressed. No unrelated workspaces or previous datasets were deleted to make room.
- Existing repository tests for dataset auditing and split preparation passed: 14 tests across the three test modules.

## Corrective priorities before more training

1. Restore or regenerate the Citrus source images and row-level audit artifacts so its ONNX test can be independently rerun.
2. Restore the GVLiD row-level source/audit/split manifests and verify every test image maps to the declared held-out vineyard IDs.
3. Keep the grape source labels provisional until independent plant-pathology review is available; preserve the weak baseline as a research result rather than promoting it.
4. Add an explicit reject/unknown output contract and evaluate it with genuinely out-of-taxonomy images, not just softmax confidence.
5. Run cross-source comparisons only where class definitions are genuinely equivalent; never count unrelated diseases as the same label.
6. After the data/evidence audit is complete, benchmark a cached or compact foundation encoder against the MobileNet baseline. Do not download DINOv2 until storage and CPU runtime are planned.

## Safety and deployment status

No model is promoted to the app or described as field-ready. No disease-specific pesticide treatment is generated from these experiments. The current results are research baselines only and do not establish performance on Syrian coastal farms.

## Project validation status

- `node scripts/validate-knowledge-base.mjs`: passed (12 disease records, 8 datasets).
- `scripts/test_audit_image_classification_dataset.py`: 3 tests passed.
- `scripts/test_prepare_classification_splits.py`: 3 tests passed.
- `scripts/test_prepare_training_splits.py`: 8 tests passed.
- TypeScript lint could not run because `tsc` is not installed in this workspace; `bun` is also unavailable. App tests and production build were not run because the local Node dependencies are not installed. No application source code was changed in this phase.