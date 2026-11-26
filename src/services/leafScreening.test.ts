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

/**
 * A green image with a checkerboard of two green shades. Both shades are
 * vegetation green, so the color gates pass, but the luma variation keeps
 * brightnessStdDev above the contrast gate (unlike a solid fill). Used to
 * isolate the resolution and blur behavior from the contrast gate.
 */
function texturedGreenImage(width: number, height: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const dark = (x + y) % 2 === 0;
      pixels[offset] = dark ? 30 : 60;
      pixels[offset + 1] = dark ? 120 : 180;
      pixels[offset + 2] = dark ? 50 : 80;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

/**
 * A smooth horizontal green gradient. Luma varies enough to clear the contrast
 * gate, but the gradual change keeps the Laplacian sharpness variance near zero
 * (a blurry image). Used to verify blur stays advisory.
 */
function blurryGreenGradient(width: number, height: number): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const t = width > 1 ? x / (width - 1) : 0;
      pixels[offset] = 30 + t * 30;
      pixels[offset + 1] = 120 + t * 60;
      pixels[offset + 2] = 50 + t * 30;
      pixels[offset + 3] = 255;
    }
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

test('brown pixels can be measured as color, without naming a disease', () => {
  const metrics = analyzeLeafPixels(solidImage(20, 20, 120, 65, 35), 20, 20);
  assert.ok(metrics.brownPercent > 90);
});

test('pixel buffer dimensions are validated', () => {
  assert.throws(() => analyzeLeafPixels(new Uint8ClampedArray(8), 2, 2));
});

test('low resolution photos are rejected', () => {
  const metrics = analyzeLeafPixels(solidImage(100, 100, 35, 150, 65), 100, 100);
  assert.equal(evaluateImageQuality(100, 100, metrics).isUsable, false);
});

test('high-resolution wide source passes the resolution gate despite a downscaled probe', () => {
  // A 4000x1000 source downscales to a 320x80 probe. The old gate
  // incorrectly rejected it because the probe's short edge is below 240.
  const metrics = analyzeLeafPixels(texturedGreenImage(320, 80), 320, 80);
  const quality = evaluateImageQuality(320, 80, metrics, 4000, 1000);
  assert.ok(!quality.warnings.some(warning => warning.includes('دقة الصورة منخفضة')));
  assert.equal(quality.isUsable, true);
});

test('high-resolution tall source passes the resolution gate despite a downscaled probe', () => {
  // A 1000x4000 source downscales to an 80x320 probe.
  const metrics = analyzeLeafPixels(texturedGreenImage(80, 320), 80, 320);
  const quality = evaluateImageQuality(80, 320, metrics, 1000, 4000);
  assert.ok(!quality.warnings.some(warning => warning.includes('دقة الصورة منخفضة')));
  assert.equal(quality.isUsable, true);
});

test('a truly tiny source is rejected even when the probe is large enough', () => {
  // Probe is a healthy 320x320, but the original source is only 120x120.
  const metrics = analyzeLeafPixels(solidImage(320, 320, 35, 150, 65), 320, 320);
  const quality = evaluateImageQuality(320, 320, metrics, 120, 120);
  assert.equal(quality.isUsable, false);
  assert.ok(quality.warnings.some(warning => warning.includes('دقة الصورة منخفضة')));
});

test('legacy three-argument calls default the source dimensions to the probe', () => {
  const metrics = analyzeLeafPixels(solidImage(100, 100, 35, 150, 65), 100, 100);
  // Omitting sourceWidth/sourceHeight must preserve the original behavior:
  // the probe dimensions drive the gate, so a 100x100 probe is rejected.
  assert.equal(evaluateImageQuality(100, 100, metrics).isUsable, false);
});

test('blur remains advisory and does not by itself mark the image unusable', () => {
  // A smooth gradient clears the contrast gate but has near-zero sharpness.
  const metrics = analyzeLeafPixels(blurryGreenGradient(320, 320), 320, 320);
  assert.ok(metrics.sharpnessVariance < 2);
  const quality = evaluateImageQuality(320, 320, metrics);
  assert.ok(quality.warnings.some(warning => warning.includes('مهزوزة')));
  assert.equal(quality.isUsable, true);
});
