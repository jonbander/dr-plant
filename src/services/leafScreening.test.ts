import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLeafPixels, evaluateImageQuality } from './leafScreening';

function solidImage(width: number, height: number, red: number, green: number, blue: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const offset = index * 4;
    pixels[offset] = red;
    pixels[offset + 1] = green;
    pixels[offset + 2] = blue;
    pixels[offset + 3] = 255;
  }
  return pixels;
}

test('green pixels are measured as vegetation color, not as a disease label', () => {
  const metrics = analyzeLeafPixels(solidImage(20, 20, 35, 150, 65), 20, 20);
  assert.equal(metrics.leafCoverage, 100);
  assert.equal(metrics.greenPercent, 100);
  assert.equal(metrics.yellowPercent, 0);
  assert.equal(metrics.brownPercent, 0);
});

test('yellow pixels are reported as a color proportion only', () => {
  const metrics = analyzeLeafPixels(solidImage(20, 20, 190, 170, 45), 20, 20);
  assert.ok(metrics.yellowPercent > 90);
  assert.equal(metrics.greenPercent, 0);
});

test('a non-green image fails the vegetation coverage gate', () => {
  const metrics = analyzeLeafPixels(solidImage(320, 320, 90, 90, 90), 320, 320);
  const quality = evaluateImageQuality(320, 320, metrics);
  assert.equal(quality.isUsable, false);
  assert.ok(quality.warnings.some(warning => warning.includes('الأنسجة الخضراء')));
});

test('pixel buffer dimensions are validated', () => {
  assert.throws(() => analyzeLeafPixels(new Uint8ClampedArray(8), 2, 2));
});

test('low resolution photos are rejected', () => {
  const metrics = analyzeLeafPixels(solidImage(100, 100, 35, 150, 65), 100, 100);
  assert.equal(evaluateImageQuality(100, 100, metrics).isUsable, false);
});
