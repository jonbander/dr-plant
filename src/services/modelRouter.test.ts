import test from 'node:test';
import assert from 'node:assert/strict';
import { MODEL_ROUTES, selectModelRoute } from './modelRouter';
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
  assert.deepEqual(result.alternatives.map(route => route.id), ['plantvillage-full-v2', 'citrus-field-v3']);
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
