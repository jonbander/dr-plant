# Algeria grape morphology sample — visual and duplicate audit

**Date:** 2026-11-27  
**Sample:** 24 source images across eight Algerian grape varieties, three images per variety  
**Status:** research-only; no training authorized

## Sample construction

A 24-image targeted sample was extracted from the CC BY 4.0 ALGERIA archive using HTTP byte-range reads of the ZIP central directory and selected members. The 1.6 GB archive was not downloaded in full. For each source image, the corresponding predicted crop mask(s) were extracted from the CC BY 4.0 LEAF_MASKS archive using the DETECT LEAVES metadata mapping.

The sample package contains:
- 24 original JPEG images;
- 24 predicted RGBA mask crops (one source image has two crops; one source image has no crop);
- original source paths, image/mask SHA-256 hashes, bounding boxes and crop transforms in `sample-manifest.json`;
- an overlay contact sheet and this audit README.

The package is `ALGERIA-MORPHOLOGY-SAMPLE-24-2026-11-27.zip`, 146,284,916 bytes, SHA-256:
`edb94158b6602614baf168daba47589efeb466609d7820df0fe1249f2e799a55`.

It is stored in Google Drive folder `DrPlant-ALGERIA-Morphology-2026-11-27`. The archive was downloaded again from Drive and the SHA-256 matched byte-for-byte.

## Visual finding: not field imagery

All 24 inspected source photos show detached grape leaves placed flat on graph paper. The grid provides scale and helps measure blade outline, lobes, petiole, and veins. These are controlled specimen images, not leaves photographed while attached to vines in natural field scenes.

**Appropriate use:** leaf segmentation, outline geometry, lobe shape, vein/petiole morphology, and a controlled-domain morphology baseline.

**Inappropriate use:** field disease diagnosis, lesion localization, mite/thrips symptom detection, nutrient deficiency recognition, leaf curling in situ, or Syrian field validation. The source archive has no disease/pest/nutrient labels and no vine/tree/plot IDs.

## Confirmed duplicate and mask defects

1. **Cross-path exact duplicate.** `376_LOUALI_ID77.jpg` and `LOULI_ab_1.jpg` are byte-identical (3,274,136 bytes; SHA-256 `36395d1ba71a633be802f0f8a603f03da704715e398a9519341e84993dae54d5`) despite different paths and sample entries. Their predicted mask PNGs are also byte-identical (SHA-256 `5975664d236da53b513338a8359f2a3504c86e94934bfed2339f3ebc96f82baa`). They must be treated as one image group and must never cross train/validation/test.
2. **Duplicate detection within one source image.** `ICHMOUL_ad_29.jpg` has two predicted crops: `ID002004_ALGERIA_L00.png` and `ID002004_ALGERIA_L01.png`. Their source bounding boxes have IoU 0.9826 and their alpha masks have pixel IoU 0.9573. This is a duplicate-detection candidate, not two independent leaves.
3. **False-negative candidate.** `AHMEUR_BOU_AHMEUR_ab_27.jpg` visibly contains a grape leaf on graph paper but has no predicted mask entry. This is a missed-leaf candidate in the segmentation pipeline.
4. The legacy master-mask datasheet has 481 Algeria components across 477 source paths. Four extra components have tiny bounding boxes relative to the primary leaf component; treat them as likely segmentation fragments pending visual confirmation.

## Split and identity implications

- The exact duplicate pair is now proven by image SHA-256, not merely pHash or matching bounding boxes.
- Filename-derived adaxial/abaxial pairs can help keep front/back views of a leaf specimen together, but do not establish vine identity.
- No source metadata field identifies the parent vine/tree/plot. A vine-disjoint split cannot be constructed from this dataset.
- A specimen-level split may be possible after the original collection protocol is documented and the candidate front/back pairs are reviewed.

## Decision for Dr.Plant

**Keep the source BLOCKED for disease training and Gold Mask use.** It is a useful candidate for controlled leaf-shape/vein representation research, but masks are model predictions, not manually verified ground truth. It must remain separate from field disease datasets. Do not merge its cultivar names into disease labels.

## Next safe operation

Evaluate the 10-class anatomical pipeline (lobes, primary/secondary veins, petiolar junction) on this 24-image sample only, with the predicted masks treated as inputs/pseudo-labels. Inspect whether its anatomical outputs are stable and whether its feature extractor can add useful shape/vein descriptors to Dr.Plant. No training on disease labels and no production integration until separate field data and verified biological grouping are available.
