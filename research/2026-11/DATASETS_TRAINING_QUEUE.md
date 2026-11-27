# Pending dataset training queue — 2026-11

| Dataset | Crop/task | Audit status | Training decision |
|---|---|---|---|
| ESCA-dataset V1 (Mendeley 89cnxc58kj/1) | Grapevine leaf classification, Esca/Healthy | Downloaded; 1,770 decoded; two near-duplicate healthy images quarantined | Exploratory baseline trained; not vineyard-independent |
| GVLiD V5 (Mendeley wkymf8bhcg/5) | Grapevine leaf classification | Downloaded; 1,344 folder/metadata label conflicts; extensive exact duplicate groups | Blocked pending author clarification |
| North Portugal 2026 (Zenodo 17343473) | Grapevine field leaf classification | Paper describes 5 classes and 4 vineyard sites; Zenodo API currently returns 410 (record deleted) | Blocked: no retrievable archive |
| Plasmopara viticola 2025 (Zenodo 17368692 v2) | Grapevine leaf classification | 280 originals audited; 1,600 augmented derivatives excluded; 1 missing vs claimed count; no complete site/plant IDs; Zenodo Rights field unverified, so model weights and image manifests withheld | Historical aggregate metrics retained only; no model weights/ONNX redistributed pending rights confirmation; not independent by vineyard/site |
| Niphad Grape Leaf Disease Dataset V5 | Grapevine leaf classification | Downloaded; CC BY 4.0; 2,726 images, 333 extra exact copies quarantined, 415 pHash near-duplicate pairs, 4 cross-label images quarantined; no EXIF/site IDs | Exploratory 4-class MobileNetV3-Small trained and ONNX exported; not independent by site/plant |
| FieldVitis (Zenodo 17289931) | Grapevine leaf classification | 656 reported images; explicitly compiled from ESCA-dataset, PlantDoc and Grape Disease; Zenodo Rights field is blank and latest-version link needs checking | Blocked pending license and source-overlap audit |
| Grape Leaf dataset for Health Classification (Mendeley 378c69nwk5/1) | Grapevine leaf classification | 18,000 total reported includes 3,000 raw plus 15,000 augmented; CC BY 4.0; augmentation lineage and archive audit pending | Candidate; never split augmented derivatives across folds |
| Multi-Fruit Leaf Image Dataset V1 | Guava/Jackfruit/Mango/Olive leaf-condition classification | Original-only inner archive retrieved via range requests; CC BY 4.0; 2,308 originals; 18,000 augmented excluded; 283 pHash pairs and 228 cross-label paths quarantined; incomplete site metadata | Separate 18-class leaf-condition baseline trained and ONNX exported; not a disease-only model or site-independent |
| Grapevine Bunch Images with Powdery Mildew Severity V1 | Grape bunch severity classification | CC BY 4.0; 2,068 field images; 4.21 GB download; separate bunch task; not downloaded due current Box disk headroom | Pending; retrieve selectively when storage permits |
| Multi-Crop Disease Dataset Roboflow V3 | Multi-crop object detection | 21,875 images reported; 30 classes; archive explicitly declares Roboflow license `Private` | Blocked: no training/reuse without explicit permission |
| CitrusUAT | Citrus leaf abnormality / segmentation | Zenodo 8294078; license and archive annotation audit pending | Candidate; keep segmentation separate |
| Citrus Leaf Disease Dataset | Citrus classification + COCO detection | Zenodo 11148332; archive inspected; Rights field still unverified; no model weights/ONNX redistributed | Candidate; task-specific review pending |
| Olive Denizli | Olive leaf classification | GitHub archive and reuse permission audit pending | Not trained |
| Morocco Olive Diseases | Olive leaf classification | Dataset access/license unresolved | Not trained |
| Turkey PlantDiseaseNet | Multi-crop field classification | License, archive, class definitions pending | Not trained |
| OPTIMA | Multi-crop object detection | Detection annotations; version/license audit pending | Keep out of image classifier |
| LDD | Grapevine object detection/instance segmentation | Annotation/provenance audit pending | Keep separate task |
| Verticillium Olive UAV | Orchard-level remote sensing | UAV/field-level, not leaf classification | Separate model/task |
| CampanetaOrangeFruit | Orange fruit detection | Fruit/multispectral task | Separate model/task |
| DiaMOS | Pear leaf/fruit symptoms | Symptom labels need clinical interpretation | Auxiliary only, not named-disease classifier |

## Prior completed models to include in the later consolidated retraining

- Citrus Field V3 — 610 images, tree-disjoint split; test accuracy 86.57%, macro-F1 85.76%.
- Lemon V3 — 17,586 images, 18 classes; image-level split; test accuracy 71.27%, macro-F1 66.34%.
- PlantVillage V1 — 2,660 images, 38 classes; test accuracy 79.08%, macro-F1 78.30%.
- PlantVillage V2 — 54,304 images, 38 classes; test accuracy 89.36%, macro-F1 86.68%.

These metrics are source-specific and not directly comparable due to different datasets/splits. Do not pool them as one benchmark. Final consolidated training must use harmonized labels, provenance-aware deduplication, and source/plant/site-separated test sets where metadata permits.


## Weather early-warning status — 2026-11-21

- Grapevine downy mildew: conservative weather-rule screening remains in place; humid-night signal now uses >=4 consecutive night hours at RH >=95% and temperature >12°C. It is not a locally trained probability model.
- Olive peacock spot: added a browser weather panel that reproduces the published Roubal et al. (2013) two-input neural network weights (rain-event mean temperature + hours RH >85%). Source study: 325 classified rain events from one French orchard/cultivar; not calibrated for Syrian orchards.
- Both crops now show crop-specific scouting and preventive canopy/water-management suggestions; no automatic pesticide instruction.
- A local weather-event observation CSV template is provided at `research/2026-11/weather-event-observations-template.csv`. Genuine local retraining is blocked until multiple site/season groups have hourly weather and dated expert-confirmed infection/non-infection outcomes.
