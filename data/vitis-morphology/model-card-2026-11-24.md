# Model Card — French Vitis Morphology Expert v1

**Status:** experimental; controlled-image domain only; not field validated; not a disease classifier.

## Intended use
Provide a weak morphology similarity signal among 14 French Vitis vinifera cultivars represented by at least three independent vine-position groups. It may later support cultivar-aware reasoning, but it must not be used as a definitive cultivar identifier.

## Data and split
- 127 supervised images; 14 classes; 63 real vine-position groups.
- Group ID = block-row-vine from the source `key.csv` and filename.
- 3-fold StratifiedGroupKFold. No vine group is shared between train and test; all 14 classes appear in every fold.
- `Chardonay` excluded pending spelling/identity verification.

## Method
Frozen ImageNet MobileNetV3-Small features (576 dimensions), averaged across original and horizontal-flip views; StandardScaler + balanced LogisticRegression (C=0.1). No CNN fine-tuning.

## Grouped cross-validation
- Accuracy: 71.7%
- Balanced accuracy: 70.4%
- Macro-F1: 66.2%
- Top-3 accuracy: 84.3%

Per-class F1 varies substantially: Carignane 0.914, Chardonnay 0.870, Poet Matabon 0.875; Semillon 0.154, Durif 0.286, Terret Blanc 0.364. This variance and small sample size limit reliability.

## Limitations
Images were captured in a controlled light-box setup at a germplasm repository, not in field conditions. The data contain no disease labels. No claim is made about disease recognition, Syrian coastal performance, or phone-camera robustness. Do not integrate into the user-facing diagnostic flow until external field validation.
