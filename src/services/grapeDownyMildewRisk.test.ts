import test from 'node:test';
import assert from 'node:assert/strict';
import { assessGrapeDownyMildewWeatherRisk, HourlyWeather } from './grapeDownyMildewRisk';

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

test('10 mm rain and mean temperature above 10C triggers strong weather indicator', () => {
  const weather = fixture();
  for (let index = 1; index <= 24; index += 1) weather.precipitation[index] = 0.5;
  const result = assessGrapeDownyMildewWeatherRisk(weather, CURRENT);
  assert.equal(result.level, 'high');
  assert.match(result.detailsAr[0], /قاعدة 10:10:24/);
});

test('three consecutive humid night hours trigger moderate, not high, indicator', () => {
  const weather = fixture();
  // Forecast night after current time: 18:00, 19:00, 20:00.
  const start = weather.time.indexOf('2026-06-01T18:00');
  for (let index = start; index < start + 3; index += 1) {
    weather.relative_humidity_2m[index] = 85;
  }
  const result = assessGrapeDownyMildewWeatherRisk(weather, CURRENT);
  assert.equal(result.level, 'moderate');
  assert.equal(result.forecastHumidNightHours, 3);
});

test('dry weather returns low indicator without claiming zero disease risk', () => {
  const result = assessGrapeDownyMildewWeatherRisk(fixture(), CURRENT);
  assert.equal(result.level, 'low');
  assert.match(result.detailsAr[0], /لا يعني أن الكرم خالٍ/);
});

test('missing current hour returns unavailable rather than a false low risk', () => {
  const result = assessGrapeDownyMildewWeatherRisk(fixture(), '2099-01-01T00:00');
  assert.equal(result.level, 'unavailable');
});
