import test from 'node:test';
import assert from 'node:assert/strict';
import { assessMultiDiseaseWeatherRisk } from './multiDiseaseWeatherRisk';
import { HourlyWeather } from './grapeDownyMildewRisk';

function fixture(currentIndex = 24): HourlyWeather {
  const time = Array.from({ length: 73 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 5, 1, index - currentIndex));
    return date.toISOString().slice(0, 16);
  });
  return {
    time,
    temperature_2m: time.map(() => 20),
    relative_humidity_2m: time.map(() => 55),
    precipitation: time.map(() => 0),
    wind_speed_10m: time.map(() => 1),
  };
}

const CURRENT = '2026-06-01T00:00';

test('grape assessment returns separate disease profiles and does not reuse one rule', () => {
  const result = assessMultiDiseaseWeatherRisk('french_grape_leaf', fixture(), CURRENT);
  assert.equal(result.status, 'assessed');
  assert.deepEqual(result.assessments.map((item) => item.profileId), ['grape_downy_mildew', 'grape_powdery_mildew', 'grape_botrytis']);
  assert.equal(result.assessments[0].status, 'low');
  assert.equal(result.assessments[1].status, 'not_ready');
  assert.equal(result.assessments[2].status, 'not_ready');
});

test('weather trigger applies only to the disease with the documented rule', () => {
  const weather = fixture();
  for (let index = 1; index <= 24; index += 1) weather.precipitation[index] = 0.5;
  const result = assessMultiDiseaseWeatherRisk('french_grape_leaf', weather, CURRENT);
  assert.equal(result.assessments[0].status, 'high');
  assert.equal(result.assessments[1].status, 'not_ready');
  assert.equal(result.assessments[2].status, 'not_ready');
});

test('multi-disease registry lists crop-specific candidates without false low-risk claims', () => {
  const result = assessMultiDiseaseWeatherRisk('citrus_syrian', fixture(), CURRENT);
  assert.equal(result.assessments.length, 1);
  assert.equal(result.assessments[0].diseaseNameAr, 'جرب الحمضيات');
  assert.equal(result.assessments[0].status, 'not_ready');
  assert.match(result.assessments[0].headlineAr, /قيد التطوير/);
});

test('unsupported crop returns no profiles and does not imply disease absence', () => {
  const result = assessMultiDiseaseWeatherRisk('unknown_crop', fixture(), CURRENT);
  assert.equal(result.status, 'no_profiles');
  assert.match(result.summaryAr, /لا يعني ذلك غياب/);
});
