# Evidence and limits of the current workflow

The current camera workflow measures coarse HSV color proportions, estimates green-like pixels, and applies basic photo-quality gates. These are image statistics, not plant pathology features. Background foliage, shadows, pesticide residues, leaf age, nutrient disorders, and camera white balance can change the measurements.

The software intentionally does not map these measurements to a pathogen name and does not infer crop species from color.

## Why no disease classifier is enabled

A disease classifier must be trained and independently evaluated on representative field photographs. A 2026 cross-domain study found a 67.7 percentage-point accuracy drop when a model moved from controlled PlantVillage imagery to field-sourced PlantDoc images, while mean confidence remained 79.76%. This demonstrates why confidence scores and laboratory dataset accuracy cannot establish field reliability.

Reference: https://doi.org/10.3389/fpls.2026.1826962

## Symptom references for future expert-reviewed content

- Grapevine downy mildew: https://ipm.ucanr.edu/agriculture/grape/downy-mildew/
- Grapevine powdery mildew: https://ipm.ucanr.edu/agriculture/grape/powdery-mildew/
- Other grape leaf spots: https://apps.extension.umn.edu/garden/diagnose/plant/fruit/grape/leavesspots.html
- Citrus leafminer: https://ask.ifas.ufl.edu/publication/IN165
- Citrus disease symptom guide: https://ask.ifas.ufl.edu/publication/CH159

## Not yet validated

No expert-labelled Syrian coastal image dataset, independent test set, calibration report, or official Syrian pesticide-registration source is included. This release must not advertise diagnostic accuracy, disease certainty, or locally approved pesticide rates.
