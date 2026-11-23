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

test('pilot mode allows a clearly-scored Esca candidate only when explicitly enabled', () => {
  const pilotManifest: OnnxModelManifest = {
    ...baseManifest,
    modelVersion: 'grape-esca-pilot-v0.1.0',
    pilotMode: true,
    thresholdsReviewed: true,
    minimumScore: 0.85,
    minimumMargin: 0.7,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const pilotLabels: OnnxClassLabel[] = [
    { id: 'grape_esca', labelAr: 'النمط البصري أقرب إلى فئة Esca (لا يؤكد المرض)', cropId: 'french_grape_leaf', diseaseId: 'grape_esca' },
    { id: 'grape_no_esca_pattern', labelAr: 'لم يرصد النموذج نمط Esca واضحاً', cropId: 'french_grape_leaf', healthy: true }
  ];
  const result = chooseCropScopedClass(
    [0.91, 0.09],
    pilotLabels,
    'french_grape_leaf',
    pilotManifest
  );
  assert.equal(result.status, 'possible_match');
  assert.equal(result.diseaseId, 'grape_esca');
  assert.ok(Math.abs((result.score ?? 0) - 0.91) < 1e-6);
  assert.equal(result.modelVersion, 'grape-esca-pilot-v0.1.0');
});

test('the source Healthy class is never translated into a healthy-plant diagnosis', () => {
  const pilotManifest: OnnxModelManifest = {
    ...baseManifest,
    modelVersion: 'grape-esca-pilot-v0.1.0',
    pilotMode: true,
    thresholdsReviewed: true,
    minimumScore: 0.85,
    minimumMargin: 0.7,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const pilotLabels: OnnxClassLabel[] = [
    { id: 'grape_esca', labelAr: 'النمط البصري أقرب إلى فئة Esca (لا يؤكد المرض)', cropId: 'french_grape_leaf', diseaseId: 'grape_esca' },
    { id: 'grape_no_esca_pattern', labelAr: 'لم يرصد النموذج نمط Esca واضحاً', cropId: 'french_grape_leaf', healthy: true }
  ];
  const result = chooseCropScopedClass(
    [0.07, 0.93],
    pilotLabels,
    'french_grape_leaf',
    pilotManifest
  );
  assert.equal(result.status, 'possible_match');
  assert.ok(result.label?.includes('لم يرصد'));
  assert.ok(result.message.includes('لا يعني أن الورقة سليمة'));
  assert.equal(result.diseaseId, undefined);
});

test('pilot gate rejects scores below threshold instead of forcing a class', () => {
  const pilotManifest: OnnxModelManifest = {
    ...baseManifest,
    pilotMode: true,
    thresholdsReviewed: true,
    minimumScore: 0.85,
    minimumMargin: 0.7,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const pilotLabels: OnnxClassLabel[] = [
    { id: 'grape_esca', labelAr: 'النمط البصري أقرب إلى فئة Esca (لا يؤكد المرض)', cropId: 'french_grape_leaf', diseaseId: 'grape_esca' },
    { id: 'grape_no_esca_pattern', labelAr: 'لم يرصد النموذج نمط Esca واضحاً', cropId: 'french_grape_leaf', healthy: true }
  ];
  const result = chooseCropScopedClass(
    [0.78, 0.22],
    pilotLabels,
    'french_grape_leaf',
    pilotManifest
  );
  assert.equal(result.status, 'unsure');
  assert.ok(Math.abs((result.score ?? 0) - 0.78) < 1e-6);
});

test('candidate models remain blocked unless pilot mode is explicitly enabled', () => {
  const pilotManifest: OnnxModelManifest = {
    ...baseManifest,
    pilotMode: false,
    thresholdsReviewed: true,
    minimumScore: 0.85,
    minimumMargin: 0.7,
    validationReportPath: '/models/plant-disease/validation-report.json'
  };
  const pilotLabels: OnnxClassLabel[] = [
    { id: 'grape_esca', labelAr: 'النمط البصري أقرب إلى فئة Esca (لا يؤكد المرض)', cropId: 'french_grape_leaf', diseaseId: 'grape_esca' },
    { id: 'grape_no_esca_pattern', labelAr: 'لم يرصد النموذج نمط Esca واضحاً', cropId: 'french_grape_leaf', healthy: true }
  ];
  const result = chooseCropScopedClass(
    [0.99, 0.01],
    pilotLabels,
    'french_grape_leaf',
    pilotManifest
  );
  assert.equal(result.status, 'candidate_only');
});
