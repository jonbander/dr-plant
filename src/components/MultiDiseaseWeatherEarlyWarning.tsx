import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CloudRain, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { HourlyWeather } from '../services/grapeDownyMildewRisk';
import { assessMultiDiseaseWeatherRisk, MultiDiseaseWeatherAssessment } from '../services/multiDiseaseWeatherRisk';

interface SavedLocation { latitude: number; longitude: number; }
interface OpenMeteoResponse {
  current?: { time?: string };
  hourly?: HourlyWeather;
}

const STORAGE_KEY = 'drplant-weather-location-v2';
const CROPS = [
  { id: 'french_grape_leaf', label: 'العنب' },
  { id: 'citrus_syrian', label: 'الحمضيات' },
  { id: 'olive', label: 'الزيتون' },
  { id: 'tomato', label: 'البندورة' },
  { id: 'potato', label: 'البطاطا' },
  { id: 'wheat', label: 'القمح' },
];

function readSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SavedLocation;
    if (Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90
      && Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180) return value;
  } catch { /* Ignore invalid browser storage. */ }
  return null;
}

function statusLabel(status: string): string {
  if (status === 'high') return 'مؤشر طقس قوي';
  if (status === 'moderate') return 'ظروف تستحق المتابعة';
  if (status === 'low') return 'لا إشارة قوية ضمن القاعدة الحالية';
  if (status === 'not_ready') return 'قيد البحث والتحقق';
  return 'بيانات غير كافية';
}

function statusClass(status: string): string {
  if (status === 'high') return 'border-rose-500/40 bg-rose-950/30 text-rose-100';
  if (status === 'moderate') return 'border-amber-500/40 bg-amber-950/25 text-amber-100';
  if (status === 'low') return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-100';
  return 'border-stone-700 bg-stone-900 text-stone-200';
}

export const MultiDiseaseWeatherEarlyWarning: React.FC = () => {
  const [cropId, setCropId] = useState('french_grape_leaf');
  const [location, setLocation] = useState<SavedLocation | null>(null);
  const [assessment, setAssessment] = useState<MultiDiseaseWeatherAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWeather = useCallback(async (coords: SavedLocation, selectedCrop: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
        current: 'temperature_2m,relative_humidity_2m',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
        past_days: '1',
        forecast_days: '5',
        timezone: 'auto',
      });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      if (!response.ok) throw new Error(`تعذر جلب الطقس (HTTP ${response.status}).`);
      const payload = await response.json() as OpenMeteoResponse;
      if (!payload.current?.time || !payload.hourly) throw new Error('استجابة الطقس ناقصة؛ لم يصدر أي تقييم.');
      setAssessment(assessMultiDiseaseWeatherRisk(selectedCrop, payload.hourly, payload.current.time));
    } catch (cause) {
      setAssessment(null);
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
    if (location) void loadWeather(location, cropId);
  }, [location, cropId, loadWeather]);

  const chooseLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع. فعّل الموقع أو افتح التطبيق من متصفح حديث.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Session-only fallback. */ }
      setAssessment(null);
      setLocation(next);
    }, (geoError) => {
      setLoading(false);
      setError(geoError.code === geoError.PERMISSION_DENIED
        ? 'لم تسمح بتحديد الموقع. يمكنك تفعيل الإذن من إعدادات المتصفح ثم المحاولة.'
        : 'تعذر تحديد موقع المزرعة. تأكد من تفعيل GPS وحاول مجدداً.');
    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
  };

  return (
    <section className="max-w-3xl mx-auto space-y-4 text-stone-100" dir="rtl">
      <div className="rounded-3xl border border-stone-800 bg-stone-900 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <div>
            <h2 className="text-lg font-extrabold text-white">الإنذار المبكر متعدد الأمراض</h2>
            <p className="text-xs text-stone-400">تحليل الطقس لأكثر من مرض بحسب المحصول المختار</p>
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-bold text-stone-200">المحصول</span>
          <select value={cropId} onChange={(event) => setCropId(event.target.value)}
            className="w-full rounded-xl border border-stone-700 bg-stone-800 px-3 py-3 text-sm text-white">
            {CROPS.map((crop) => <option key={crop.id} value={crop.id}>{crop.label}</option>)}
          </select>
        </label>
        <p className="text-sm leading-7 text-stone-300">
          يجلب النظام بيانات الطقس مرة واحدة ثم يقيم ملفات الأمراض المسجلة لهذا المحصول. لكل مرض قواعده الخاصة؛
          لا نستخدم عتبات مرض واحد لتوقع مرض آخر.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={chooseLocation} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
            <MapPin className="h-4 w-4" /> {location ? 'تحديث موقع المزرعة' : 'استخدم موقع المزرعة'}
          </button>
          {location && <button type="button" onClick={() => void loadWeather(location, cropId)} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-200 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> تحديث الطقس
          </button>}
        </div>
        {error && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</p>}
      </div>

      {loading && <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 text-center text-sm text-stone-300">جارٍ جلب الطقس وتقييم ملفات الأمراض...</div>}

      {assessment && !loading && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-4">
            <h3 className="font-extrabold text-white">ملخص المحصول</h3>
            <p className="mt-2 text-sm leading-6 text-stone-300">{assessment.summaryAr}</p>
            <p className="mt-2 text-[11px] text-stone-500">عدد ملفات الأمراض: {assessment.assessments.length} — وقت التقييم: {assessment.evaluatedAt}</p>
          </div>
          {assessment.assessments.map((item) => (
            <article key={item.profileId} className={`rounded-2xl border p-4 space-y-2 ${statusClass(item.status)}`}>
              <div className="flex items-start gap-2">
                {item.status === 'high' || item.status === 'moderate'
                  ? <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
                  : <CloudRain className="mt-1 h-5 w-5 shrink-0" />}
                <div>
                  <div className="text-xs font-bold opacity-75">{statusLabel(item.status)}</div>
                  <h3 className="font-extrabold">{item.diseaseNameAr}</h3>
                  <p className="text-xs opacity-70">{item.pathogen}</p>
                </div>
              </div>
              <p className="text-sm leading-6">{item.headlineAr}</p>
              <ul className="list-disc space-y-1 pr-5 text-sm leading-6">
                {item.detailsAr.map((detail, index) => <li key={index}>{detail}</li>)}
              </ul>
              <p className="text-xs leading-5 opacity-75">{item.evidenceNoteAr}</p>
              {item.references.length > 0 && <div className="flex flex-wrap gap-3 text-xs underline">
                {item.references.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">المصدر العلمي</a>)}
              </div>}
            </article>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4 text-xs leading-6 text-amber-100">
        <strong>تنبيه علمي:</strong> الملف الذي يظهر «قيد البحث والتحقق» لا يملك بعد قاعدة إنذار معتمدة، وليس منخفض الخطر.
        وحتى المؤشر المرتفع يعني ملاءمة بعض ظروف الطقس فقط، ولا يثبت وجود الممرض أو حدوث عدوى ولا يصدر توصية رش.
        يلزم لاحقاً إدخال مرحلة نمو النبات وابتلال الأوراق وسجل المرض واللقاح والتحقق الحقلي.
      </div>
      <p className="text-center text-[11px] text-stone-500">
        بيانات الطقس: <a className="underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
        يلزم الإنترنت؛ موقع المزرعة يرسل مباشرة لمزود الطقس ولا يمر بخادم Dr.PLANT.
      </p>
    </section>
  );
};
