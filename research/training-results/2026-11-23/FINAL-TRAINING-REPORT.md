# Dr Plant — new research training results (23 November 2026)

Three source-specific exploratory baselines were trained from images not used in earlier project runs. Model artifacts are in the [Google Drive bundle](https://drive.google.com/file/d/1I66zrshhVEvnM_pqnPlAYPf6gnYDK3wm/view?usp=sharing).

## 1. GVLiD V5 — grape Esca vs Healthy

- Source: [Mendeley Data DOI 10.17632/wkymf8bhcg.5](https://doi.org/10.17632/wkymf8bhcg.5), CC BY 4.0.
- Original source: 3,477 images. Due to 1,344 folder/metadata label conflicts and duplicate issues, only 1,323 rows with verified provenance and expert-review flags were admitted.
- Classes retained: Esca 885, Healthy 438. Black Rot and Leaf Blight excluded.
- Vineyard-disjoint split: 953 train / 195 validation / 175 test; test uses four held-out vineyards.
- MobileNetV3-Small, 160px, 8 epochs, CPU. Held-out test accuracy 99.43%; macro-F1 99.29%.
- ONNX CPU inference was validated on the held-out set.

## 2. Citrus Leaf Disease Dataset — three classes

- Source: [Zenodo record 11148332](https://doi.org/10.5281/zenodo.11148332), v1, source states CC BY 4.0.
- 1,863 unique SHA-256 images retained; 81 exact duplicate copies excluded. 16 perceptual near-duplicate pairs grouped before splitting.
- Classes: Anthracnose, Canker, Leaf Miner. No healthy class.
- Grouped split: 1,192 train / 298 validation / 373 test.
- MobileNetV3-Small, 160px, 8 epochs, CPU. Test accuracy 96.51%; macro-F1 93.13%; balanced accuracy 92.75%.
- ONNX Runtime CPU inference reproduced metrics on all 373 test images.

## 3. Grape Leaf Health Classification — raw originals only

- Source: [Mendeley Data DOI 10.17632/378c69nwk5.1](https://data.mendeley.com/datasets/378c69nwk5/1), CC BY 4.0.
- The 3 GB archive was streamed by HTTP byte ranges; only the 3,001 raw `Process_Images` entries were used. Augmented images were excluded.
- Exact SHA-256 deduplication removed 427 repeated copies, leaving 2,574 unique images. The archive has 3,001 raw entries although the source description claims 3,000.
- Classes: Black Rot 533, Brown Spot 748, Downy Mildew 313, Mites 236, Healthy 744.
- 34 pHash near-duplicate pairs grouped before a 1,647 train / 412 validation / 515 test split. Exact SHA overlap with five previously trained source manifests was zero.
- MobileNetV3-Small with balanced sampling, 160px, 12 epochs, CPU. Best validation macro-F1 63.73%; held-out test accuracy 61.17%; macro-F1 55.08%; balanced accuracy 55.27%.
- ONNX Runtime CPU inference reproduced the metrics on all 515 test images. This result is modest and should not be deployed.

## Important limitations

- All three are exploratory source-specific models. None has been validated on Syrian coastal field images.
- GVLiD retained only two classes because of source label conflicts.
- Citrus and Grape Leaf Health use source folder labels that were not independently expert-reviewed by Dr Plant; neither source provides farm/site metadata.
- The Grape Leaf Health baseline has weak test performance, particularly for Black Rot, Downy Mildew and Mites.
- None is integrated into the production multi-disease classifier. Do not use them for pesticide decisions.
