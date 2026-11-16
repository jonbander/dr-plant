export interface HourlyWeather {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  precipitation: number[];
  wind_speed_10m: number[];
}

export type WeatherRiskLevel = 'high' | 'moderate' | 'low' | 'unavailable';

export interface GrapeDownyMildewRisk {
  level: WeatherRiskLevel;
  headlineAr: string;
  detailsAr: string[];
  evaluatedAt: string;
  past24hRainMm: number | null;
  past24hAverageTemperatureC: number | null;
  forecastPrimaryTrigger: boolean;
  forecastHumidNightHours: number;
  dataWindowHours: number;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function hourOf(value: string): number | null {
  const match = value.match(/T(\\d{2}):/);
  return match ? Number(match[1]) : null;
}

function validAt(weather: HourlyWeather, index: number): boolean {
  return index >= 0
    && index < weather.time.length
    && finite(weather.temperature_2m[index])
    && finite(weather.relative_humidity_2m[index])
    && finite(weather.precipitation[index])
    && finite(weather.wind_speed_10m[index]);
}

function rainAndTemperatureTrigger(
  weather: HourlyWeather,
  start: number,
  end: number,
): boolean {
  const indices = Array.from({ length: end - start }, (_, offset) => start + offset);
  if (!indices.length || !indices.every((index) => validAt(weather, index))) return false;
  const rain = indices.reduce((sum, index) => sum + weather.precipitation[index], 0);
  const meanTemp = average(indices.map((index) => weather.temperature_2m[index]));
  return rain >= 10 && meanTemp !== null && meanTemp >= 10;
}

function longestFavourableNightHumidityRun(
  weather: HourlyWeather,
  start: number,
  end: number,
): number {
  let currentRun = 0;
  let longestRun = 0;
  for (let index = start; index < end; index += 1) {
    if (!validAt(weather, index)) {
      currentRun = 0;
      continue;
    }
    const hour = hourOf(weather.time[index]);
    const isNight = hour !== null && (hour >= 18 || hour < 6);
    const favourable = isNight
      && weather.relative_humidity_2m[index] >= 80
      && weather.temperature_2m[index] >= 10
      && weather.temperature_2m[index] <= 30;
    currentRun = favourable ? currentRun + 1 : 0;
    longestRun = Math.max(longestRun, currentRun);
  }
  return longestRun;
}

/**
 * Conservative weather indicator, not a calibrated disease forecast.
 * Weather API data cannot observe shoot length, soil wetness, canopy/leaf
 * wetness, existing inoculum, cultivar susceptibility, or vineyard practices.
 */
export function assessGrapeDownyMildewWeatherRisk(
  weather: HourlyWeather,
  currentTime: string,
): GrapeDownyMildewRisk {
  const currentIndex = weather.time.indexOf(currentTime);
  const arraysMatch = [
    weather.temperature_2m,
    weather.relative_humidity_2m,
    weather.precipitation,
    weather.wind_speed_10m,
  ].every((values) => values.length === weather.time.length);

  if (currentIndex < 0 || !arraysMatch || weather.time.length < 25) {
    return {
      level: 'unavailable',
      headlineAr: 'بيانات الطقس غير كافية لتقدير المؤشرات',
      detailsAr: ['لم تصل سلسلة الطقس الساعية كاملة أو لم يمكن تحديد الساعة الحالية.'],
      evaluatedAt: currentTime,
      past24hRainMm: null,
      past24hAverageTemperatureC: null,
      forecastPrimaryTrigger: false,
      forecastHumidNightHours: 0,
      dataWindowHours: weather.time.length,
    };
  }

  const pastStart = currentIndex - 23;
  const pastIndices = Array.from({ length: 24 }, (_, offset) => pastStart + offset);
  const pastComplete = pastIndices.every((index) => validAt(weather, index));
  const past24hRainMm = pastComplete
    ? pastIndices.reduce((sum, index) => sum + weather.precipitation[index], 0)
    : null;
  const past24hAverageTemperatureC = pastComplete
    ? average(pastIndices.map((index) => weather.temperature_2m[index]))
    : null;
  const pastPrimaryTrigger = pastComplete
    && past24hRainMm !== null
    && past24hAverageTemperatureC !== null
    && past24hRainMm >= 10
    && past24hAverageTemperatureC >= 10;

  const forecastEnd = Math.min(weather.time.length, currentIndex + 49);
  let forecastPrimaryTrigger = false;
  for (let start = currentIndex + 1; start + 24 <= forecastEnd; start += 1) {
    if (rainAndTemperatureTrigger(weather, start, start + 24)) {
      forecastPrimaryTrigger = true;
      break;
    }
  }

  const forecastHumidNightHours = longestFavourableNightHumidityRun(
    weather,
    currentIndex + 1,
    forecastEnd,
  );
  const humidNightSupport = forecastHumidNightHours >= 3;

  if (pastPrimaryTrigger || forecastPrimaryTrigger) {
    return {
      level: 'high',
      headlineAr: 'مؤشر طقس قوي يستدعي الانتباه للبياض الزغبي',
      detailsAr: [
        pastPrimaryTrigger
          ? 'الأمطار والحرارة خلال آخر 24 ساعة حققتا جزء الطقس من قاعدة 10:10:24.'
          : 'التوقعات تشير إلى احتمال تحقق جزء الطقس من قاعدة 10:10:24 خلال الساعات القادمة.',
        'هذه ليست إصابة مؤكدة: القاعدة تحتاج أيضاً إلى تحقق طول النموات ورطوبة التربة ومدة ابتلال الأوراق داخل الكرم.',
        'افحص الأوراق السفلية وراقب البقع الزيتية والزغب الأبيض أسفل الورقة، واستعن بمهندس زراعي عند الاشتباه.',
      ],
      evaluatedAt: currentTime,
      past24hRainMm,
      past24hAverageTemperatureC,
      forecastPrimaryTrigger,
      forecastHumidNightHours,
      dataWindowHours: weather.time.length,
    };
  }

  if (humidNightSupport) {
    return {
      level: 'moderate',
      headlineAr: 'ليالٍ رطبة قد تساعد على تهيؤ ظروف المرض',
      detailsAr: [
        'تظهر التوقعات ثلاث ساعات ليلية متتالية أو أكثر برطوبة نسبية لا تقل عن 80% وحرارة بين 10 و30°م.',
        'الرطوبة الجوية وحدها لا تثبت ابتلال الأوراق ولا تكفي لتأكيد حدوث عدوى؛ راقب الحقل بعد الليالي الرطبة.',
      ],
      evaluatedAt: currentTime,
      past24hRainMm,
      past24hAverageTemperatureC,
      forecastPrimaryTrigger,
      forecastHumidNightHours,
      dataWindowHours: weather.time.length,
    };
  }

  return {
    level: 'low',
    headlineAr: 'لا تظهر حالياً إشارة طقس قوية ضمن القواعد المبسطة',
    detailsAr: [
      'هذا لا يعني أن الكرم خالٍ من المرض أو أن الخطر معدوم.',
      'قد تختلف الرطوبة ومدة ابتلال الأوراق داخل الكرم عن بيانات الطقس الشبكية.',
    ],
    evaluatedAt: currentTime,
    past24hRainMm,
    past24hAverageTemperatureC,
    forecastPrimaryTrigger,
    forecastHumidNightHours,
    dataWindowHours: weather.time.length,
  };
}
