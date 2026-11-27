# Archived source-specific model experiments — November 2026

This document records five additional source-specific experiments preserved from the November 22 research branch. Their weights and ONNX exports are retained for reproducibility only. None is registered as an app route, enabled for diagnosis, or validated on Syrian coastal farms.

| Experiment | Source / license | Test images | Test accuracy | Macro-F1 | Main limitation |
|---|---|---:|---:|---:|---|
| Citrus Leaf Disease Zenodo V1 | Zenodo 10.5281/zenodo.11148332; license unverified | 281 | 98.93% | 98.01% | Three abnormal classes only; no healthy class; filename-derived labels; image-level split; weights withheld |
| ESCA Mendeley V1 | Mendeley 10.17632/89cnxc58kj.1; CC BY 4.0 | 266 | 99.62% | 99.62% | Image-level split; no verified vineyard/plant/session IDs |
| Multi-Fruit Original V1 | Mendeley 10.17632/82vn9k44ky.1; CC BY 4.0 | 311 | 91.96% | 90.52% | Mixed crop and condition taxonomy; not a disease-only classifier; image-level split |
| NGLD Mendeley V5 alternate run | Mendeley 10.17632/8nnd2ypcv3.5; CC BY 4.0 | 350 | 98.29% | 97.96% | Image-level/near-duplicate-cluster split; no biological site/plant/session IDs |
| Plasmopara Zenodo V2 alternate run | Zenodo 10.5281/zenodo.17368692; license unverified | 42 | 95.24% | 95.23% | Small test set; strong class imbalance in EXIF GPS availability; no biological grouping; weights withheld |

## Important metric reconciliation

The Citrus Zenodo V1 and Plasmopara Zenodo V2 source records do not currently expose a verifiable Rights value. Their aggregate metrics are retained for historical transparency, but their model weights, ONNX files, and image-level manifests are withheld from `main` pending license confirmation. The other three model artifacts below are retained under their verified CC BY 4.0 dataset terms.

These results must not replace earlier or stricter baselines:

- The NGLD alternate image-level run (98.29%) is distinct from the grouped visual-similarity baseline already in the registry (74.06%). The grouped result is more conservative; neither establishes unseen-vineyard performance.
- The Plasmopara alternate run (95.24%) is distinct from the earlier 73.81% baseline. Reconcile the exact split, preprocessing, and run configuration before selecting either.
- The Multi-Fruit alternate run (91.96%) is distinct from the earlier 65.96% run and used a different quarantine/split protocol. It is a mixed condition taxonomy, not a universal disease classifier.
- High ESCA accuracy on an image-level split does not establish sensitivity on unseen vineyards or prove that leaf-only images can diagnose a trunk-disease complex.
- Citrus Zenodo V1 has no healthy class, so it cannot distinguish normal leaves from disease or unknown disorders.

The three redistributed ONNX files (ESCA, Multi-Fruit, NGLD) passed ONNX checker and ONNX Runtime validation in the originating research run. The two unverified-license model exports are not included in `main`. Export parity verifies conversion, not biological correctness or field generalization. Source images are not included in GitHub.

## Evidence and privacy handling

- Per-dataset audit reports, source metadata, split manifests, duplicate reviews, and audit scripts are retained under `research/2026-11/` and `scripts/`.
- Exact GPS values have been removed from public CSV manifests and metadata. Aggregate counts and the fact of source-location clustering are retained where relevant.
- The three redistributed model sources have verified CC BY 4.0 terms. Two Zenodo sources remain license-unverified and their weights/ONNX and image-level manifests are withheld. No raw image archive is included in this repository change.
- The central model evidence registry has separate IDs for all five historical experiments; the two unverified-license runs point only to aggregate metrics, and `productionModel.enabled` remains `false`.

## Olive peacock-spot weather research

A published southern-France model by Roubal et al. (2013) relates rain-event temperature and duration of relative humidity above 85% to olive peacock-spot infection. It is documented in `docs/SYRIAN_COAST_EVIDENCE.md` as a Mediterranean reference only. The older experimental browser service that mapped its output to fixed high/moderate/low thresholds was not merged: those cutoffs are not locally calibrated for Syria and should not be exposed as a Syrian risk probability.

## Promotion gate

Do not add any of these five models to `public/models/`, the app router, or the user-facing diagnosis flow without: verified class mapping, image/source review, expert label assessment, plant/site/season-independent testing, calibration, unknown rejection, Android end-to-end testing, and a documented rollback path.
