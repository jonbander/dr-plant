# Review of `dr-plant-patches.zip`

The uploaded bundle was inspected file by file. This PR adopts the parts that are useful and safe to integrate now, rather than copying the bundle wholesale.

## Adopted: CSV and JSON scan export

- CSV is generated locally and includes scan metadata, Arabic crop/disease names, the existing stored screening fields and user notes.
- CSV uses UTF-8 with BOM and RFC-4180-style quoting for spreadsheet compatibility.
- Text fields beginning with spreadsheet formula characters are prefixed to reduce CSV formula-injection risk.
- JSON is a full backup and retains the thumbnails already stored with scan records.
- The scan-history screen now offers both export formats.
- Export generation has unit tests for quoting, formula neutralization, Arabic content, empty history and JSON round-tripping.

## Deferred: IndexedDB history replacement

The proposed `historyStorage.ts` is not a drop-in replacement for the current app:

- Existing app and component call sites use synchronous `getOfflineScans`, `saveOfflineScan`, `deleteOfflineScan`, `updateScanNotes` and settings APIs. The proposed replacement changes these to asynchronous APIs and requires a coordinated caller/startup migration.
- The proposed migration copies scan history but does not migrate the existing settings key from localStorage.
- Its migration flag is set before the IndexedDB transaction succeeds, and transaction errors are swallowed, so a failed migration may not retry in the same page session.
- The proposed cross-tab subscription does not actually publish change messages.
- The claimed IndexedDB quota is not guaranteed across browsers/devices.

It should be redesigned and integrated as a separate change with transaction-completion handling, retryable migration, settings migration, quota errors and tests against the real call sites.

## Deferred: PDF export

The bundle's PDF path needs dependencies not present in the repository. It also uses jsPDF's default Helvetica font for Arabic text, which does not provide Arabic shaping/right-to-left rendering. The `includeThumbnails` option is declared but not implemented. It should not be offered until Arabic font embedding, RTL layout and image inclusion are implemented and visually verified.

## Deferred: extra image texture metrics

The added Sobel/GLCM/dark-cluster metrics are descriptive only and do not classify disease. The dark-cluster heuristic operates on the whole image, not a segmented leaf mask, so it can count dark background regions as lesion clusters. The bundle does not include the synthetic-image tests it says are required, and its performance estimate is not measured on target Android devices. The existing color/quality screening remains unchanged in this PR.

## ONNX model

This bundle does not contain an ONNX model, verified ordered labels, model preprocessing contract, model license or field validation. It therefore does not enable automatic disease diagnosis. The separate ONNX foundation remains disabled until those requirements are met.
