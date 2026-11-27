# Dr.Plant model asset size audit — 2026-11-27

This is a byte-level inventory of exported model files present in the research branch. It is not a statement that any candidate is approved for production or currently downloaded by the app.

## Exported ONNX artifacts (research-only; not app-enabled)

| Candidate | Artifact | Bytes | MiB | Notes |
|---|---|---:|---:|---|
| Multi-crop PlantVillage V2 | `results/multicrop-plantvillage-v2/model-output-refined/plantvillage-full-multicrop-mobilenetv3-small.onnx` | 6,236,849 | 5.948 | 38 classes; controlled-source research model |
| Lemon V3 | `results/lemon-v3/lemon-v3-mobilenetv3-small-embedded.onnx` | 6,415,735 | 6.119 | Embedded ONNX; 18 classes; Bangladesh white-background source |
| Citrus Field V3 | `results/citrus-field-v3/citrus-field-v3-mobilenetv3-small-embedded.onnx` | 6,358,335 | 6.064 | Embedded ONNX; 4 classes; single Moroccan orchard/campaign |
| Grape continual fine-tune candidate | `results/grape-morphology-fusion-2026-11-26/grape-leaf-continual-finetune-candidate-160.onnx` | 6,101,549 | 5.819 | Five grape-leaf classes; research-only, not registered as an app route |

The three current specialist routes account for **19,010,919 bytes = 18.130 MiB**. Including the separate grape research candidate gives **25,112,468 bytes = 23.949 MiB**. These are artifact sizes only, before labels, manifests, application code, icons, fonts, and runtime files.

## ONNX Runtime browser files

| Runtime file | Bytes | MiB |
|---|---:|---:|
| `public/vendor/onnxruntime/ort.min.js` | 371,810 | 0.355 |
| `public/vendor/onnxruntime/ort-wasm-simd-threaded.wasm` | 14,848,852 | 14.161 |

The two runtime files total **15,220,662 bytes = 14.516 MiB**. If all four ONNX artifacts and both runtime files were fetched, the combined payload would be approximately **40,333,130 bytes = 38.465 MiB**, excluding labels and other app assets. This is a theoretical payload total, not the current installed app size or an assertion that the PWA precaches these files.

## External-data ONNX variants

Lemon V3 and Citrus Field V3 also have split ONNX files of approximately 0.29 MiB plus external `.onnx.data` files of approximately 5.8 MiB each. They must be deployed as a matched pair; counting only the small `.onnx` file would materially understate the model size. Embedded variants avoid this two-file packaging requirement.

## Runtime and promotion status

- The current model router lists PlantVillage V2, Lemon V3, and Citrus Field V3 as `research_only`; their browser runtime paths and verified app label mappings are intentionally absent.
- The grape continual fine-tune candidate is stored as a research artifact but is not yet registered as an app route.
- No candidate is enabled for production diagnosis. The grape ONNX export has numerical parity with its PyTorch candidate on the validation set, but that does not establish Syrian field accuracy.
- NGLD V5 continual-learning candidate is currently a PyTorch checkpoint in the verified Drive research bundle; it is not included in the ONNX total and has not passed independent validation.
- Plasmopara V2 and other research checkpoints are not to be added to the app bundle until their contracts, export, labels, and validation gates are completed.

## Packaging recommendation

1. Keep the APK/app shell separate from model weights where practical.
2. Offer an initial small install and download only the selected specialist packs; retain them for offline use after download.
3. Download packs only over an explicit user action or Wi-Fi preference, verify SHA-256 before activation, and keep the previous known-good pack for rollback.
4. Store model metadata (version, checksum, input contract, label map, evidence status, source/license, minimum runtime version) with each pack.
5. Do not enable any model for production diagnosis merely because its artifact is packaged. Current research candidates remain blocked from production by the registry's field-validation, expert-review, calibration, and unknown-rejection gates.

## Measurement method

Sizes were read from the checked-out repository files with `Path.stat().st_size`; MiB uses 1,048,576 bytes. This audit excludes duplicate copies, `.pt` training checkpoints, datasets, manifests, and training logs from the ONNX model payload total.
