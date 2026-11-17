import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseCropScopedClass, stableSoftmax, type OnnxClassLabel, type OnnxModelManifest } from './onnxDiseaseClassifier';

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
  { id: 'tomato_early_blight', labelAr: 'اللفحة المبكرة في البندورة', cropId: 'tomato', diseaseId: 'tomato_early_blight' },
  { id: 'grape_black_rot', labelAr: 'العفن الأسود في العنب', cropId: 'grape', diseaseId: 'grape_black_rot' }
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
