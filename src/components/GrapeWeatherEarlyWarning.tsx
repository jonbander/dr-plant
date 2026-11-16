import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, MapPin, RefreshCw, ShieldCheck, Thermometer, Wind } from 'lucide-react';
import {
  assessGrapeDownyMildewWeatherRisk,
  GrapeDownyMildewRisk,
  HourlyWeather,
} from '../services/grapeDownyMildewRisk';

interface SavedLocation {
  latitude: number;
  longitude: number;
}

interface OpenMeteoResponse {
  current?: { time?: string; temperature_2m?: number; relative_humidity_2m?: number };
  hourly?: HourlyWeather;
}

const STORAGE_KEY = 'drplant-weather-location-v1';

function readSavedLocation(): SavedLocation | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as SavedLocation;
    if (
      Number.isFinite(parsed.latitude) && Math.abs(parsed.latitude) <= 90
      && Number.isFinite(parsed.longitude) && Math.abs(parsed.longitude) <= 180
    ) return parsed;
  } catch {
    // Ignore invalid or unavailable browser storage.
  }
  return null;
}

function coordinatesLabel(location: SavedLocation): string {
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}

export const GrapeWeatherEarlyWarning: React.FC = () => {
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [risk, setRisk] = useState<GrapeDownyMildewRisk | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = useCallback(async (coords: SavedLocation) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        current: 'temperature_2m,relative_humidity_2m',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
        past_days: '1',
        forecast_days: '3',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!response.ok) throw new Error(`تعذر جلب الطقس (HTTP ${response.status}).`);
      const payload = await response.json() as OpenMeteoResponse;
      if (!payload.current?.time || !payload.hourly) {
        throw new Error('استجابة الطقس ناقصة؛ لم يتم إصدار إنذار.');
      }
      setRisk(assessGrapeDownyMildewWeatherRisk(payload.hourly, payload.current.time));
    } catch (cause) {
      setRisk(null);
      setError(cause instanceof Error ? cause.message : 'تعذر الاتصال بخدمة الطقس.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = readSavedLocation();
    if (saved) setLocation(saved);
  }, []);

  useEffect(() => {
    if (location) void loadWeather(location);
  }, [location, loadWeather]);

  const chooseLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع. فعّل الموقع أو افتح التطبيق من متصفح حديث.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // The feature still works for this session if storage is unavailable.
        }
        setRisk(null);
        setLocation(next);
      },
      (geoError) => {
        setLoading(false);
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'لم تسمح بتحديد الموقع. يمكنك تفعيل الإذن من إعدادات المتصفح ثم المحاولة.'
            : 'تعذر تحديد موقع المزرعة. تأكد من تفعيل GPS وحاول مجدداً.',
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  };

  const clearLocation = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setLocation(null);
    setRisk(null);
    setError('');
  };

  const riskStyle = risk?.level === 'high'
    ? 'border-rose-500/40 bg-rose-950/30 text-rose-100'
    : risk?.level === 'moderate'
      ? 'border-amber-500/40 bg-amber-950/25 text-amber-100'
      : risk?.level === 'unavailable'
      ? 'border-stone-600 bg-stone-800 text-stone-100'
      : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100';

  return (
    <section className="max-w-3xl mx-auto space-y-4 text-stone-100" dir="rtl">
      <div className="rounded-3xl border border-stone-800 bg-stone-900 p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">الإنذار المبكر للبياض الزغبي في العنب</h2>
            <p className="text-xs text-stone-400">مؤشرات الطقس حسب موقع الكرم — لا يحتاج مفتاح API</p>
          </div>
        </div>
        <p className="text-sm leading-7 text-stone-300">
          اختر موقع المزرعة لقراءة الأمطار والحرارة والرطوبة وتقدير فترات الطقس التي قد تساعد على المرض.
          لا نرسل موقعك إلى خادم Dr Plant؛ يذهب مباشرة إلى مزود بيانات الطقس عند طلب التحديث.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={chooseLocation}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            <MapPin className="h-4 w-4" />
            {location ? 'تحديد موقع المزرعة من جديد' : 'استخدم موقع المزرعة'}
          </button>
          {location && (
            <>
              <button
                type="button"
                onClick={() => void loadWeather(location)}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث الطقس
              </button>
              <button type="button" onClick={clearLocation} className="rounded-xl px-3 py-3 text-xs text-stone-400 underline">
                مسح الموقع
              </button>
            </>
          )}
        </div>
        {location && (
          <p className="text-xs text-stone-500">إحداثيات الموقع المحفوظة على هذا الجهاز: {coordinatesLabel(location)}</p>
        )}
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p>}
      </div>

      {loading && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 text-center text-sm text-stone-300">
          جارٍ جلب بيانات الطقس وتحليل المؤشرات...
        </div>
      )}

      {risk && !loading && (
        <div className={`rounded-3xl border p-5 sm:p-6 space-y-4 ${riskStyle}`}>
          <div className="flex items-start gap-3">
            {risk.level === 'high' || risk.level === 'moderate'
              ? <AlertTriangle className="mt-1 h-6 w-6 shrink-0" />
              : <ShieldCheck className="mt-1 h-6 w-6 shrink-0" />}
            <div>
              <div className="text-xs font-bold opacity-80">
                {risk.level === 'high' ? 'مؤشر طقس قوي' : risk.level === 'moderate' ? 'مؤشر رطوبة' : risk.level === 'unavailable' ? 'بيانات غير كافية' : 'لا توجد إشارة قوية'}
              </div>
              <h3 className="mt-1 text-base font-extrabold">{risk.headlineAr}</h3>
            </div>
          </div>
          <ul className="list-disc space-y-2 pr-5 text-sm leading-6">
            {risk.detailsAr.map((detail, index) => <li key={index}>{detail}</li>)}
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-black/20 p-3">
              <div className="flex items-center gap-1 text-xs opacity-75"><CloudRain className="h-4 w-4" /> أمطار آخر 24 ساعة</div>
              <div className="mt-1 text-xl font-extrabold">{risk.past24hRainMm === null ? '—' : `${risk.past24hRainMm.toFixed(1)} مم`}</div>
            </div>
            <div className="rounded-2xl bg-black/20 p-3">
              <div className="flex items-center gap-1 text-xs opacity-75"><Thermometer className="h-4 w-4" /> متوسط الحرارة</div>
              <div className="mt-1 text-xl font-extrabold">{risk.past24hAverageTemperatureC === null ? '—' : `${risk.past24hAverageTemperatureC.toFixed(1)}°م`}</div>
            </div>
            <div className="col-span-2 rounded-2xl bg-black/20 p-3">
              <div className="flex items-center gap-1 text-xs opacity-75"><Wind className="h-4 w-4" /> ساعات الرطوبة الليلية المتوقعة</div>
              <div className="mt-1 text-xl font-extrabold">{risk.forecastHumidNightHours} ساعة متتالية كحد أقصى</div>
            </div>
          </div>
          <p className="text-[11px] opacity-70">وقت التقييم: {risk.evaluatedAt.replace('T', ' ')} — نافذة البيانات: {risk.dataWindowHours} ساعة</p>
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-xs leading-6 text-amber-100">
        <strong>حدود مهمة:</strong> بيانات الطقس العامة لا تقيس ابتلال الورقة داخل الكرم، ولا طول النموات أو رطوبة التربة أو وجود اللقاح المرضي أو حساسية الصنف. لذلك هذا مؤشر متابعة أولي وليس نموذجاً محلياً معايراً أو تشخيصاً أو أمراً بالرش. افحص النباتات واستشر مهندساً زراعياً قبل أي قرار.
      </div>
      <p className="text-center text-[11px] text-stone-500">
        بيانات الطقس: <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> — يلزم الاتصال بالإنترنت. لا يصدر تنبيهات دفع عند إغلاق التطبيق.
      </p>
    </section>
  );
};
