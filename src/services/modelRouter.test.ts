import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelAssetContract, MODEL_ROUTES, selectModelRoute } from './modelRouter';
import { CROPS_DATABASE } from '../data/cropsAndDiseases';

test('unknown crop abstains instead of selecting a model', () => {
  const result = selectModelRoute({ crop: undefined });
  assert.equal(result.status, 'unknown_crop');
  assert.equal(result.primary, undefined);
});

test('unsupported crop stays on the legacy screening path', () => {
  const crop = CROPS_DATABASE.find(item => item.id === 'tomato');
  const result = selectModelRoute({ crop });
  assert.equal(result.status, 'unsupported_crop');
  assert.equal(result.alternatives.length, 0);
});

test('lemon context prefers the lemon specialist over broad citrus', () => {
  const crop = CROPS_DATABASE.find(item => item.id === 'citrus_syrian');
  const result = selectModelRoute({ crop, context: 'lemon', allowResearchModels: true });
  assert.equal(result.status, 'selected');
  assert.equal(result.primary?.id, 'lemon-v3');
  assert.deepEqual(result.alternatives.map(route => route.id), ['citrus-field-v3', 'plantvillage-full-v2']);
});

test('general citrus defaults to the field specialist, not the broad PlantVillage model', () => {
  const crop = CROPS_DATABASE.find(item => item.id === 'citrus_syrian');
  const result = selectModelRoute({ crop, allowResearchModels: true });
  assert.equal(result.status, 'selected');
  assert.equal(result.primary?.id, 'citrus-field-v3');
  assert.deepEqual(result.alternatives.map(route => route.id), ['lemon-v3', 'plantvillage-full-v2']);
});

test('grape remains on its only registered broad research route until a field ONNX specialist exists', () => {
  const crop = CROPS_DATABASE.find(item => item.id === 'french_grape_leaf');
  const result = selectModelRoute({ crop, allowResearchModels: true });
  assert.equal(result.status, 'selected');
  assert.equal(result.primary?.id, 'plantvillage-full-v2');
});

test('research specialists are blocked by default', () => {
  const crop = CROPS_DATABASE.find(item => item.id === 'citrus_syrian');
  const result = selectModelRoute({ crop, context: 'citrus' });
  assert.equal(result.status, 'research_blocked');
  assert.equal(result.primary, undefined);
  assert.equal(result.alternatives[0].id, 'citrus-field-v3');
});

test('the registry keeps specialists separate and records real class counts', () => {
  assert.equal(MODEL_ROUTES.find(route => route.id === 'lemon-v3')?.classCount, 18);
  assert.equal(MODEL_ROUTES.find(route => route.id === 'citrus-field-v3')?.classCount, 4);
  assert.notEqual(
    MODEL_ROUTES.find(route => route.id === 'lemon-v3')?.classCount,
    MODEL_ROUTES.find(route => route.id === 'citrus-field-v3')?.classCount
  );
});

test('each specialist resolves its own audited artifact, labels, and preprocessing contract', () => {
  const expected: Record<string, readonly [string, string, number, 'stretch']> = {
    'plantvillage-full-v2': ['results/multicrop-plantvillage-v2/model-output-refined/plantvillage-full-multicrop-mobilenetv3-small.onnx', 'results/multicrop-plantvillage-v2/model-output-refined/labels.json', 38, 'stretch'],
    'lemon-v3': ['results/lemon-v3/lemon-v3-mobilenetv3-small-embedded.onnx', 'results/lemon-v3/labels.json', 18, 'stretch'],
    'citrus-field-v3': ['results/citrus-field-v3/citrus-field-v3-mobilenetv3-small-embedded.onnx', 'results/citrus-field-v3/labels.json', 4, 'stretch']
  } as const;
  for (const route of MODEL_ROUTES) {
    const contract = getModelAssetContract(route);
    assert.equal(contract.artifactPath, expected[route.id][0]);
    assert.equal(contract.labelsPath, expected[route.id][1]);
    assert.equal(contract.inputSize, expected[route.id][2] === 18 ? 128 : expected[route.id][2] === 4 ? 160 : 128);
    assert.equal(contract.resizeMode, expected[route.id][3]);
    assert.equal(contract.runtimeRunnable, false);
    assert.ok(contract.blockers.some(blocker => blocker.includes('labels')));
  }
  assert.equal(getModelAssetContract(MODEL_ROUTES[1]).externalDataPath, 'results/lemon-v3/lemon-v3-mobilenetv3-small.onnx.data');
  assert.equal(getModelAssetContract(MODEL_ROUTES[2]).externalDataPath, 'results/citrus-field-v3/citrus-field-v3-mobilenetv3-small.onnx.data');
});
