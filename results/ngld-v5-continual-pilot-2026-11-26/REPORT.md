# NGLD V5 Continual-Learning Pilot — 2026-11-26

**Status: research candidate only — not approved for app/production.**

## Inputs and audit
- Dataset: Niphad Grape Leaf Disease Dataset V5, DOI [10.17632/8nnd2ypcv3.5](https://doi.org/10.17632/8nnd2ypcv3.5), CC BY 4.0.
- Restored source archive: 55,219,865 bytes; SHA-256 `d7bf92c55781403e1d2154c16ef774a125d42e1c5bfc6ee64c3a300421d278e8`, matched the backup register.
- Audited manifest: 2,389 images; train 1,433 / validation 478 / test 478.
- All image paths existed and all per-image SHA-256 values matched (0 missing, 0 mismatches).
- pHash groups did not overlap across splits. This is not proof of independence by vineyard, plant, or capture session.
- Classes: Bacterial Leaf Spot (100), Downy Mildew (964), Healthy Leaves (926), Powdery Mildew (399).
- Labels have not been independently reviewed by a plant-pathology expert.

## Method
- MobileNetV3-Small; existing best checkpoint used as a frozen teacher.
- Student initialized from the exact teacher weights; teacher checkpoint left unchanged.
- Self-supervised two-view contrastive learning plus frozen-teacher knowledge distillation, using only the train split as unlabeled images.
- Last two feature blocks and classifier head unfrozen; 3 epochs, batch size 8, learning rate 0.00002, input 160 px, CPU-only.
- Recovery checkpoint saved after every epoch.

## Held-out source-test comparison
| Metric | Teacher | Candidate | Change |
|---|---:|---:|---:|
| Accuracy | 74.06% | 74.48% | +0.42 percentage points |
| Macro-F1 | 66.93% | 67.64% | +0.70 percentage points |

### Per-class F1
| Class | Teacher | Candidate | Change |
|---|---:|---:|---:|
| Bacterial Leaf Spot | 53.97% | 56.14% | +2.17 pp |
| Downy Mildew | 76.43% | 77.60% | +1.17 pp |
| Healthy Leaves | 79.74% | 79.21% | -0.52 pp |
| Powdery Mildew | 57.60% | 57.60% | 0.00 pp |

Bacterial Leaf Spot test support is only 20 images. Overall gain is small; Healthy regressed slightly and Powdery did not improve.

## Decision and limitations
- Do not promote or integrate candidate weights into production.
- This pilot demonstrates that the incremental training path runs while preserving the teacher; it does not demonstrate reliable field improvement.
- The test set has now been used for comparison and must be treated as development data in future experiments.
- No Syrian field validation; no independent farm/plant/session split; no expert-reviewed labels.
- The four-class task cannot support claims about unseen diseases or broad grape pathology.

## Artifacts
- Candidate checkpoint and epoch recovery state are in the Drive package below.
- Detailed metrics and training script are preserved in the same package.
- Original teacher remains preserved separately.

[Verified Drive package](https://drive.google.com/file/d/1YJ6pgmeOsLZ17vOiAb9PjGfW7hY2_37X/view) — 18,412,232 bytes; SHA-256 `2e4722c38af1e521116b4cd6f31fa3a2cb1b36768bfeb1d71bb149b22792e2f3`. The uploaded copy was downloaded again, byte-compared with the source, and passed `unzip -t`.

## Checkpoint fingerprints
- Teacher SHA-256: `47103964b7c3c501daee3a7a206334ccaf3e3225bf02f642cc54b845a60c5c94`
- Candidate SHA-256: `42de27f1dd22f00654f3214733b0ac43bd13a77021f1ecd80fddd9f2c8226d70`
- Training script SHA-256: `7b2d01117433c63fdb888dd1afb00516519923a07c7123e4b25cdb96a38a1aad`
- Manifest SHA-256: `a5d35bbbf1269c5aaf1384ad3b5bcf56c96ab1b4ba17d18be9748392863fe5c8`
