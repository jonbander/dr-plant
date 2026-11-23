# Dr Plant — dataset training queue snapshot (23 November 2026)

| Dataset | Current state | Decision |
|---|---|---|
| GVLiD V5 (Mendeley wkymf8bhcg/5) | 1,323 safe Esca/Healthy images trained; 2,154 excluded due to metadata conflicts/duplicate quarantine | Two-class exploratory baseline only; full four-class use remains blocked |
| Citrus Leaf Disease (Zenodo 11148332 v1) | 1,863 unique images trained; 81 exact duplicate copies excluded; 16 perceptual pairs grouped | Three-class exploratory baseline; source labels unverified by Dr Plant |
| Grape Leaf Health Classification (Mendeley 378c69nwk5/1) | 3,001 raw entries audited; 427 exact duplicate copies removed; 2,574 unique raw images trained; 34 pHash pairs grouped; augmented derivatives excluded | Five-class exploratory baseline; 61.17% test accuracy / 55.08% macro-F1; weak result, not deployable |
| North Portugal 2026 (Zenodo 17343473) | Zenodo API returns 410; archive unavailable | Blocked until archive becomes retrievable |
| FieldVitis (Zenodo 17289931) | Compiled from other sources; license field blank; source overlap not resolved | Blocked pending rights and overlap audit |
| Grapevine bunch powdery mildew severity | 2,068 field bunch images; 4.21 GB download | Separate bunch-severity task; not a leaf classifier |
| CitrusUAT | Segmentation annotations and license need audit | Keep segmentation separate |
| Citrus orange-fruit COCO archive | Object-detection task | Keep separate from leaf classifier |
| Olive Denizli / Morocco Olive / Turkey PlantDiseaseNet | Access, labels, rights and provenance need review | Pending |
| Multi-Crop Roboflow V3 | Explicitly Private license | Do not train/reuse without permission |
| OPTIMA / LDD / CampanetaOrangeFruit / Verticillium Olive UAV | Detection, segmentation, fruit or remote-sensing tasks | Separate task pipelines |

## Training policy

- Keep classification, object detection, segmentation, bunch severity and UAV tasks separate.
- Verify archive integrity, source rights, class definitions, duplicate groups and provenance before training.
- Prefer farm/site/plant/season-disjoint splits. If unavailable, explicitly label the result as exploratory and do not claim field generalization.
- Never include augmented derivatives in a test fold when their source image is in train.
- Keep original datasets, checkpoints and prior baselines; remove only verified temporary files or regenerable caches.
- All models remain research artifacts until independent expert review and Syrian coastal field validation.
