import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseCropScopedClass, getInputDrawRect, stableSoftmax, validateOnnxModelManifest, type OnnxClassLabel, type OnnxModelManifest } from './onnxDiseaseClassifier';

const baseManifest: OnnxModelManifest = {
  schemaVersion: 1,
  enabled: true,
  modelPath: '/models/plant-disease/model.onnx',
  labelsPath: '/models/plant-disease/labels.json',
  inputSize: 224,
  inputLayout: 'NCHW',
  channelOrder: 'RGB',
  normalization: 'image_net',
  resizeMode: 'center_crop',
  outputKind: 'logits',
  reviewStatus: 'candidate'
};

const classes: OnnxClassLabel[] = [
  { id: 'tomato_early_blight_syria', labelAr: 'اللفحة المبكرة في البندورة', cropId: 'tomato', diseaseId: 'tomato_early_blight_syria' },
  { id: 'grape_downy_mildew', labelAr: 'العفن الأسود في العنب', cropId: 'french_grape_leaf', diseaseId: 'grape_downy_mildew' }
];

test('softmax is numerically stable for large logits', () => {
  const result = stableSoftmax([10000, 10001, 9999]);
  assert.equal(result.length, 3);
  assert.ok(Math.abs(result.reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
  assert.ok(result[1] > result[0] && result[0] > result[2]);
});

test('model cannot infer crop when no crop was selected', () => {
  const result = chooseCropScopedClass([0.9, 0.1], classes, 'auto', baseManifest);
  assert.equal(result.status, 'needs_crop');
});

test('candidate model never emits an accepted disease match', () => {
  const result = chooseCropScopedClass([0.99, 0.01], classes, 'tomato', baseManifest);
  assert.equal(result.status, 'candidate_only');
});

test('model classes are restricted to the selected crop', () => {
  const validated: OnnxModelManifest = {
    ...baseManifest,
    reviewStatus: 'validated',
    thresholdsReviewed: true,
    minimumProbability: 0.5,
    minimumMargin: 0.1,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const result = chooseCropScopedClass([0.2, 0.99], classes, 'tomato', validated);
  assert.equal(result.status, 'unsure');
});

test('unknown or cross-crop disease labels are ignored', () => {
  const validated: OnnxModelManifest = {
    ...baseManifest,
    reviewStatus: 'validated',
    thresholdsReviewed: true,
    minimumProbability: 0.5,
    minimumMargin: 0.1,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const unknownClasses = [
    { id: 'invented', labelAr: 'مرض غير معروف', cropId: 'tomato', diseaseId: 'not-in-database' }
  ];
  const result = chooseCropScopedClass([1], unknownClasses, 'tomato', validated);
  assert.equal(result.status, 'unsupported_crop');
});

test('stretch preprocessing matches square Resize((size,size)) used by exploratory training', () => {
  assert.deepEqual(getInputDrawRect(400, 200, 128, 'stretch'), { x: 0, y: 0, width: 128, height: 128 });
});

test('center-crop preprocessing preserves aspect ratio and crops overflow symmetrically', () => {
  const rect = getInputDrawRect(400, 200, 128, 'center_crop');
  assert.equal(rect.width, 256);
  assert.equal(rect.height, 128);
  assert.equal(rect.x, -64);
  assert.equal(rect.y, 0);
});

test('invalid source dimensions are rejected', () => {
  assert.throws(() => getInputDrawRect(0, 100, 128, 'stretch'));
});

test('manifest contract rejects invalid dimensions and unknown resize modes', () => {
  assert.equal(validateOnnxModelManifest(baseManifest), true);
  assert.equal(validateOnnxModelManifest({ ...baseManifest, inputSize: 0 }), false);
  assert.equal(validateOnnxModelManifest({ ...baseManifest, resizeMode: 'letterbox' }), false);
  assert.equal(validateOnnxModelManifest({ ...baseManifest, modelPath: 'relative.onnx' }), false);
});
