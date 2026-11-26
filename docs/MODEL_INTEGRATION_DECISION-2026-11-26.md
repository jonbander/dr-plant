# Dr.Plant — model integration decision gate

**Current decision: do not merge model weights. Prefer a routed collection of specialists, with a shared evidence/output contract.**

## Why not average or merge weights now?
The current crop/disease models have different architectures, input sizes, class vocabularies, training datasets, preprocessing, and calibration. Direct parameter averaging or weight-space merging is unsafe unless architectures, tensor shapes, neuron alignment, training lineage, and normalization/preprocessing are demonstrably compatible. Even same-architecture models can have permutation/representation mismatch. The NGLD candidate is a small internal improvement on a source-specific four-class task and is not a reason to blend it into other crop models.

## Recommended architecture to evaluate
1. Keep each specialist checkpoint immutable and versioned (grape, lemon/citrus, multicrop).
2. Add a crop/species router that can abstain when crop identity is uncertain.
3. Run only relevant specialists; normalize their outputs into a common evidence schema: crop, condition, evidence label, calibrated confidence, supporting visual cues, model/version, input/preprocessing contract.
4. Use late fusion only when two specialists cover the same crop/condition and their validation data support calibration and complementarity. Do not average raw scores across unrelated label spaces.
5. If Android latency/storage later requires a single compact model, distill the routed ensemble into a student using a carefully curated, crop-balanced dataset and specialist soft targets. Preserve specialists as fallback.
6. Keep the knowledge base locally synchronized for offline analysis; do not call the central knowledge service for every photo.

## Mandatory gates before any production integration
- Architecture/class/preprocessing compatibility tests and checksum verification.
- Independent split by orchard/farm, plant, and capture session; no image or near-duplicate leakage.
- Per-class precision/recall/F1, confusion matrices, calibration (ECE/Brier), selective risk/unknown rejection, and latency/RAM measurements on representative Android devices.
- Retention tests on every existing crop model after each incremental update; rollback to the exact prior checkpoint on regression.
- Syrian coastal field set reviewed by qualified agronomists; distinguish local confirmed evidence from foreign references.
- Seasonal normal states and non-disease causes must be represented to reduce false positives.

## NGLD pilot status
Candidate: research-only. Teacher 74.06% accuracy / 66.93% macro-F1; candidate 74.48% / 67.64% on the same India-source pHash-group-isolated test split. Small gain; Healthy slightly regressed, Powdery unchanged. No Syrian field validation. Keep candidate separate pending independent evaluation.

## Next experiment
Build an offline router prototype using the existing models as separate specialists, without modifying any weights. Benchmark crop routing and output normalization first. Only then test late fusion on overlapping classes; consider distillation after collecting balanced, independent data.
