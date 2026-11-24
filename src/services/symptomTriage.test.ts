import test from 'node:test';
import assert from 'node:assert/strict';
import { getSymptomCandidateId, getSymptomPatternLabel, SYMPTOM_PATTERN_OPTIONS } from './symptomTriage';

test('grape leaf patterns map only to their corresponding candidate records', () => {
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'white_powder'), 'grape_powdery_mildew');
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'downy_oil'), 'grape_downy_mildew');
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'blister_swell'), 'grape_leaf_blister_mite');
});

test('grape symptom patterns are not assigned to non-leaf organs or unrelated patterns', () => {
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'fruit', 'white_powder'), null);
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'target_rings'), null);
});

test('citrus leafminer and gummosis require matching symptom and plant part', () => {
  assert.equal(getSymptomCandidateId('citrus_syrian', 'leaves', 'silver_mines'), 'citrus_leafminer_syria');
  assert.equal(getSymptomCandidateId('citrus_syrian', 'stem', 'gummosis_sap'), 'citrus_gummosis_syria');
  assert.equal(getSymptomCandidateId('citrus_syrian', 'leaves', 'gummosis_sap'), null);
  assert.equal(getSymptomCandidateId('citrus_syrian', 'fruit', 'silver_mines'), null);
});

test('crop-specific patterns do not leak into unrelated crops', () => {
  assert.equal(getSymptomCandidateId('tomato', 'leaves', 'silver_mines'), null);
  assert.equal(getSymptomCandidateId('olive', 'leaves', 'white_powder'), null);
});

test('known leaf patterns map to olive, walnut, tomato, and wheat candidates', () => {
  assert.equal(getSymptomCandidateId('olive', 'leaves', 'target_rings'), 'olive_peacock_spot_syria');
  assert.equal(getSymptomCandidateId('walnut', 'leaves', 'target_rings'), null);
  assert.equal(getSymptomCandidateId('tomato', 'leaves', 'target_rings'), 'tomato_early_blight_syria');
  assert.equal(getSymptomCandidateId('wheat', 'leaves', 'rust_stripes'), 'wheat_stripe_rust_syria');
});

test('uncertain or unmatched patterns stay undetermined', () => {
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'unknown'), null);
  assert.equal(getSymptomCandidateId('unknown_crop', 'leaves', 'white_powder'), null);
  assert.equal(getSymptomPatternLabel('unknown'), 'شكل آخر / لست متأكداً');
  assert.equal(getSymptomPatternLabel('not-a-pattern'), 'نمط غير محدد');
});

test('citrus scab requires raised corky wart symptoms on leaves or fruit', () => {
  assert.equal(getSymptomCandidateId('citrus_syrian', 'leaves', 'citrus_scab_warts'), 'citrus_scab_syria');
  assert.equal(getSymptomCandidateId('citrus_syrian', 'fruit', 'citrus_scab_warts'), 'citrus_scab_syria');
  assert.equal(getSymptomCandidateId('citrus_syrian', 'stem', 'citrus_scab_warts'), null);
  assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', 'citrus_scab_warts'), null);
  assert.equal(getSymptomCandidateId('olive', 'leaves', 'citrus_scab_warts'), null);
});

test('morphological symptoms are represented independently from color', () => {
  const ids = SYMPTOM_PATTERN_OPTIONS.map((item) => item.id);
  for (const id of ['leaf_curl_up', 'leaf_curl_down', 'leaf_wrinkling', 'leaf_crumpling', 'leaf_puckering', 'leaf_twisting', 'leaf_cupping', 'vein_distortion', 'leaf_narrowing', 'surface_roughness']) {
    assert.ok(ids.includes(id as typeof ids[number]), `missing morphology symptom: ${id}`);
    assert.notEqual(getSymptomPatternLabel(id), 'نمط غير محدد');
  }
});

test('generic leaf deformation never becomes an automatic disease diagnosis', () => {
  for (const id of ['leaf_curl_up', 'leaf_curl_down', 'leaf_wrinkling', 'leaf_crumpling', 'leaf_puckering', 'leaf_twisting', 'vein_distortion', 'leaf_brittleness']) {
    assert.equal(getSymptomCandidateId('french_grape_leaf', 'leaves', id), null);
    assert.equal(getSymptomCandidateId('citrus_syrian', 'leaves', id), null);
    assert.equal(getSymptomCandidateId('olive', 'leaves', id), null);
  }
});
