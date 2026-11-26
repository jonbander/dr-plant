# Offline ONNX Runtime Web bundle

This directory contains the locally served browser loader and WASM binary used by the optional ONNX adapter. The application never fetches the runtime from a CDN. The files are copied from the `onnxruntime-web` distribution and must be replaced as a matched pair when upgrading the runtime.

The production model manifest remains disabled until model promotion gates pass.
