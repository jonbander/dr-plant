import type { ScanResult } from '../types/crop';

const CSV_HEADERS = [
  'timestamp_iso',
  'crop_id',
  'crop_name_ar',
  'disease_id',
  'disease_name_ar',
  'scientific_name',
  'category',
  'severity',
  'stored_match_value',
  'model_score_raw_not_calibrated',
  'model_version',
  'diagnostic_status',
  'green_health_index',
  'lesion_area_pct',
  'chlorosis_pct',
  'necrosis_pct',
  'resolved',
  'user_notes'
] as const;

/** Neutralize spreadsheet formulas in untrusted text before CSV quoting. */
export function protectSpreadsheetText(value: string): string {
  return /^[\u0000-\u0020]*[=+\-@]/.test(value) ? `'${value}` : value;
}

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = typeof value === 'string' ? protectSpreadsheetText(value) : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function timestampIso(timestamp: number): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/** CSV excludes image data and is UTF-8/BOM-ready for Arabic spreadsheet apps. */
export function buildCsvFromScans(scans: ScanResult[]): string {
  const rows: string[] = [CSV_HEADERS.join(',')];
  for (const scan of scans) {
    const analysis = scan.analysisData;
    const row: unknown[] = [
      timestampIso(scan.timestamp),
      scan.crop?.id,
      scan.crop?.nameAr,
      scan.diseaseOrPest?.id,
      scan.diseaseOrPest?.nameAr,
      scan.diseaseOrPest?.scientificName,
      scan.diseaseOrPest?.category,
      scan.severity,
      scan.confidence,
      scan.modelScore,
      scan.modelVersion,
      scan.diagnosticStatus,
      analysis?.greenHealthIndex,
      analysis?.lesionSpotAreaPercentage,
      analysis?.chlorosisPercentage,
      analysis?.necrosisPercentage,
      scan.resolved ? 'yes' : 'no',
      scan.userNotes
    ];
    rows.push(row.map(escapeCsvCell).join(','));
  }
  return rows.join('\r\n');
}

export interface ScanExportEnvelope {
  exported_at: string;
  scan_count: number;
  farm_name?: string;
  scans: ScanResult[];
}

/** JSON is a full local backup and intentionally retains stored thumbnails. */
export function buildJsonExport(
  scans: ScanResult[],
  farmName?: string,
  exportedAt = new Date().toISOString()
): string {
  const envelope: ScanExportEnvelope = {
    exported_at: exportedAt,
    scan_count: scans.length,
    ...(farmName ? { farm_name: farmName } : {}),
    scans
  };
  return JSON.stringify(envelope, null, 2);
}

function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('تنزيل الملفات متاح من المتصفح فقط.');
  }
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export function exportScansAsCSV(scans: ScanResult[], filename = 'dr-plant-scans.csv'): void {
  const csv = buildCsvFromScans(scans);
  downloadBlob(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportScansAsJSON(
  scans: ScanResult[],
  farmName?: string,
  filename = 'dr-plant-backup.json'
): void {
  downloadBlob(
    new Blob([buildJsonExport(scans, farmName)], { type: 'application/json;charset=utf-8;' }),
    filename
  );
}
