import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsvFromScans, buildJsonExport, escapeCsvCell, protectSpreadsheetText } from './exportService';

const minimalScan = (overrides: Record<string, unknown> = {}) => ({
  id: 'scan-1',
  timestamp: Date.UTC(2026, 0, 2),
  imageThumbnail: 'data:image/jpeg;base64,abc',
  crop: { id: 'tomato', nameAr: 'بندورة', nameEn: 'Tomato', scientificName: 'Solanum lycopersicum' },
  diseaseOrPest: { id: 'sample', nameAr: 'بقعة', scientificName: '', category: 'fungal' },
  confidence: 0,
  severity: 'low',
  analysisData: { greenHealthIndex: 50, lesionSpotAreaPercentage: 2, chlorosisPercentage: 1, necrosisPercentage: 0 },
  ...overrides
}) as never;

test('CSV escapes commas, quotes and line breaks', () => {
  assert.equal(escapeCsvCell('a,"b"\nc'), '"a,""b""\nc"');
});

test('CSV neutralizes spreadsheet formula text', () => {
  assert.equal(protectSpreadsheetText('=HYPERLINK("x")'), '\'=HYPERLINK("x")');
  assert.equal(protectSpreadsheetText('  @SUM(A1:A2)'), '\'  @SUM(A1:A2)');
  assert.equal(escapeCsvCell('-1+2'), "'-1+2");
});

test('CSV includes Arabic text, a header row, and CRLF records', () => {
  const csv = buildCsvFromScans([minimalScan({ userNotes: 'ورقة مصابة' })]);
  assert.ok(csv.startsWith('timestamp_iso,crop_id'));
  assert.ok(csv.includes('بندورة'));
  assert.ok(csv.includes('ورقة مصابة'));
  assert.ok(csv.includes('\r\n'));
});

test('empty CSV remains valid and contains headers only', () => {
  const csv = buildCsvFromScans([]);
  assert.ok(csv.startsWith('timestamp_iso,'));
  assert.equal(csv.split('\r\n').length, 1);
});

test('JSON export round-trips and retains thumbnail data for backup', () => {
  const scan = minimalScan();
  const json = buildJsonExport([scan], 'مزرعتي', '2026-01-01T00:00:00.000Z');
  const parsed = JSON.parse(json);
  assert.equal(parsed.scan_count, 1);
  assert.equal(parsed.farm_name, 'مزرعتي');
  assert.equal(parsed.scans[0].imageThumbnail, 'data:image/jpeg;base64,abc');
});

test('JSON export supports an empty history', () => {
  const parsed = JSON.parse(buildJsonExport([], undefined, '2026-01-01T00:00:00.000Z'));
  assert.equal(parsed.scan_count, 0);
  assert.deepEqual(parsed.scans, []);
});
