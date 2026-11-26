# Dr.Plant — Training coverage snapshot (2026-11-25)

## Already trained (do not repeat blindly)
- PlantVillage full V2: 54,304 images; previous 38-class baseline.
- Lemon V3: 17,586 images; exploratory image-level split.
- Citrus Field V3: 610 images after one metadata/path conflict was quarantined; tree-held-out exploratory benchmark.
- Plasmopara Zenodo V2: 280 original images; exploratory image-level baseline.
- Grape Leaf Health Mendeley V1: 2,574 unique originals; grouped pHash split; weak 5-class exploratory baseline.
- Multi-Fruit V1: 2,308 images; new 18-class exploratory baseline completed 2026-11-25 (see `../results/multi-fruit-v1/`).
- Vitis morphology cultivar pilot: 127 of 504 French cultivar images used in a 14-class morphology pilot; not disease diagnosis.

## Not trained / blocked / unavailable
- NGLD V5: source archive restored and SHA-256 verified; 2,726 originals / 2,393 unique hashes, 333 exact duplicate copies removed. 462 prior-audit pHash candidate pairs grouped; 3 cross-class pairs (4 unique endpoints) quarantined. Trained 2,389 images in a pHash-group-disjoint 1,433/478/478 split. Test accuracy 74.06%, macro-F1 66.93%. No biological group IDs or expert label review; exploratory only. See `results/ngld-v5/`.
- GVLiD V5: prior curated two-class Esca/Healthy model already trained on 1,323 images with a vineyard-disjoint split (953/195/175); test accuracy 99.43%, macro-F1 99.29%. This high result remains source-specific and needs independent replication. Full 4-class training remains blocked: 1,344 metadata/folder conflicts and cross-vineyard duplicates collapse vineyard IDs; only 649 candidates remain after strict exclusion and are severely imbalanced.
- ESCA Mendeley V1: restored all 1,770 original images from Drive; all SHA-256 values match the prior audit manifest. Esca cam1/cam2; Healthy cam3 only, so camera is perfectly confounded with label. Training remains blocked for diagnostic classification. Source archive: `data/external/2026-11/esca-mendeley-v1/ESCA-Drive-Archive.zip`.
- FieldVitis V2: 555 images; derived from ESCA/PlantDoc/Grape Disease with strong source/EXIF confounding and no upstream mapping or independent plant/session IDs. Training blocked pending source mapping and label review.
- Citrus Zenodo V1: 1,944 files, 1,863 unique hashes and 80 exact-duplicate groups; record has no explicit dataset reuse license. Training blocked pending permission and provenance.
- Vitis morphology: 504 source images; only 127 were used in the cultivar pilot. The remaining images are not in the current Box project image directory, so cannot be trained locally until source archive is restored. Task remains cultivar morphology, not disease diagnosis.

## Important interpretation
“Not trained” does not automatically mean “safe to train.” The blocked sets need image/source/label resolution first. Keep separate task-specific models (leaf disease, pest/damage, fruit/bunch severity, cultivar morphology); do not merge incompatible label taxonomies. No research model in this snapshot is approved for production diagnosis or pesticide recommendations.
