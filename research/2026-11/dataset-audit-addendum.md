# Dataset audit addendum — 2026-11-21

## Corrections to the initial shortlist

The Field-Based Citrus Leaf Disease Image Dataset has a newer **V3** release dated 13 November 2026 (DOI: 10.17632/szsms728jf.3). It supersedes the V1 record listed in the initial audit. V3 includes 611 images, `metadata.csv`, and `recommended_partition.csv`; license CC BY 4.0.

The Lemon dataset V3 is DOI 10.17632/8d9fv6kpt3.3, published 4 November 2026. It contains 17,586 original images across 18 image-level categories, CC BY 4.0.

## Actual Box training runs

- Citrus V3: 610 images after quarantining one conflicting metadata/path row; split by tree ID with no tree overlap; 86.57% test accuracy and 85.76% macro-F1.
- Lemon V3: 17,586 images; 12,310 train / 2,638 validation / 2,638 test; 71.27% test accuracy and 66.34% macro-F1. The split is image-level because the dataset does not expose tree/plant IDs.
- Both models exported to ONNX and passed ONNX Checker and ONNX Runtime parity tests with 100% prediction agreement to PyTorch on the held-out sets.

These are source-domain exploratory results, not validated diagnostic performance in Syria. Neither model is enabled in the app.
