import React, { useState, useEffect } from 'react';
import { 
  X, Volume2, VolumeX, CheckCircle, AlertTriangle, ShieldAlert, 
  FlaskConical, Leaf, Sprout, Clock, Bookmark, Share2, Printer, 
  Check, FileText, ChevronRight, Calculator, Activity
} from 'lucide-react';
import { ScanResult } from '../types/crop';
import { speakArabicDiagnosis, stopSpeech, isSpeaking } from '../services/speechService';

interface DiagnosisResultModalProps {
  scan: ScanResult;
  onClose: () => void;
  onSaveNotes: (id: string, notes: string) => void;
  onOpenCalculator: (cropName: string, pestName: string, dose: string, safetyDays: number) => void;
}

export const DiagnosisResultModal: React.FC<DiagnosisResultModalProps> = ({
  scan,
  onClose,
  onSaveNotes,
  onOpenCalculator
}) => {
  const [activeTab, setActiveTab] = useState<'organic' | 'chemical' | 'prevention' | 'analysis'>('organic');
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [notes, setNotes] = useState(scan.userNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { crop, diseaseOrPest, confidence, severity, analysisData } = scan;
  const isHealthy = diseaseOrPest.id === 'healthy_leaf';
  const isModelScreening = scan.diagnosticStatus === 'model_screening';
  const isScreeningOnly = Boolean(scan.diagnosticStatus);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Handle voice readout
  const toggleVoice = () => {
    if (isReadingAudio) {
      stopSpeech();
      setIsReadingAudio(false);
    } else {
      let speechText = '';
      if (isModelScreening) {
        speechText = `هذا نموذج بصري تجريبي متعدد الفئات بحسب المحصول. درجة النموذج ${scan.modelScore ?? 'غير متاحة'} وهي ليست احتمالاً معايراً. عدم رصد فئة معروفة لا يعني أن الورقة سليمة؛ قد تكون مصابة بمرض آخر. النتيجة لا تثبت التشخيص ولا تحدد علاجاً.`;
      } else if (isHealthy) {
        speechText = `قياسات اللون في صورة ${crop.nameAr} أظهرت نسبة اخضرار مقدرة ${analysisData.greenHealthIndex} بالمئة. هذا القياس لا يثبت سلامة النبات ولا يستبعد وجود مرض أو آفة؛ افحص النبات ميدانياً.`;
      } else if (isScreeningOnly) {
        speechText = 'هذه نتيجة فرز أولي فقط وليست تشخيصاً مؤكداً. لا تستخدمها لاختيار علاج أو مبيد.';
      } else {
        speechText = 'هذه نتيجة قديمة من إصدار سابق. نسبة التطابق غير معايرة ويجب التحقق منها ميدانياً.';
      }

      setIsReadingAudio(true);
      speakArabicDiagnosis(speechText, () => {
        setIsReadingAudio(false);
      });
    }
  };

  const handleSaveNotes = () => {
    onSaveNotes(scan.id, notes);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Severity styling
  const severityBadge = {
    low: { label: 'منخفض / طفيف', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
    medium: { label: 'متوسط الأثر', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
    high: { label: 'مرتفع / يتطلب تدخلاً', bg: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
    critical: { label: 'حرج / خطر وبائي', bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse' }
  }[severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-stone-900 border border-stone-800 shadow-2xl text-stone-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{crop.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">{crop.nameAr}</h2>
                <span className="text-xs text-stone-400 font-mono">({crop.scientificName})</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-amber-300 font-medium">{isScreeningOnly ? 'فرز أولي — ليس تشخيصاً مؤكداً' : 'نتيجة قديمة — دقتها غير متحققة'}</span>
                {crop.syrianCoastRegionAr && (
                  <span className="text-[10px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                    📍 {crop.syrianCoastRegionAr}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Read-out button */}
            <button
              onClick={toggleVoice}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isReadingAudio 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse' 
                  : 'bg-stone-800 border-stone-700 text-stone-300 hover:text-white'
              }`}
              title="الاستماع الصوتي للتشخيص"
            >
              {isReadingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">{isReadingAudio ? 'إيقاف الصوت' : 'استمع للتشخيص'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Main Hero Card: Photo with Bounding Boxes + Diagnosis Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 bg-stone-950/70 rounded-2xl p-4 border border-stone-800/80 items-center">
            {/* Image with bounding box overlays */}
            <div className="relative sm:col-span-5 aspect-square rounded-xl overflow-hidden border border-stone-800 bg-black flex items-center justify-center">
              {scan.diagnosticStatus === 'symptom_triage' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-400 bg-stone-900 p-4 text-center">
                  <Activity className="w-10 h-10 text-emerald-500" />
                  <span className="text-xs font-semibold">لم تُرفع صورة في هذا المسار</span>
                  <span className="text-[10px]">النتيجة مبنية على إجاباتك فقط</span>
                </div>
              ) : (
                <img
                  src={scan.imageThumbnail}
                  alt="صورة الفحص"
                  className="w-full h-full object-contain"
                />
              )}

              {/* Render detected lesion bounding boxes on top of image */}
              {analysisData.boundingBoxes.map((box, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    top: `${box.y}%`,
                    left: `${box.x}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                  className="border-2 border-rose-500 bg-rose-500/20 rounded-md shadow-[0_0_10px_rgba(244,63,94,0.6)] flex items-start justify-end p-0.5"
                >
                  <span className="bg-rose-600 text-[9px] text-white font-bold px-1 rounded shadow">
                    بؤرة إصابة {box.confidence}%
                  </span>
                </div>
              ))}
            </div>

            {/* Diagnosis Core Info */}
            <div className="sm:col-span-7 space-y-2.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-bold">
                {scan.diagnosticStatus === 'symptom_triage' ? (diseaseOrPest.id === 'unclassified_symptom' ? 'فرز أولي — السبب غير محدد' : 'مرشح للمقارنة من إجاباتك') : scan.diagnosticStatus === 'insufficient_image' ? 'الصورة غير كافية' : isModelScreening ? 'نموذج بصري تجريبي متعدد الفئات' : isScreeningOnly ? 'فحص بصري أولي فقط' : 'نتيجة محفوظة من إصدار سابق'}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {diseaseOrPest.nameAr}
              </h3>
              <p className="text-xs text-stone-400 italic font-serif">
                {diseaseOrPest.scientificName}
              </p>

              <p className="text-xs text-stone-300 leading-relaxed">
                {diseaseOrPest.descriptionAr}
              </p>
              {isModelScreening && typeof scan.modelScore === 'number' && (
                <div className="bg-stone-900 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-bold text-stone-200">درجة النموذج الخام</span>
                    <span className="block text-[10px] text-stone-500">ليست احتمالاً معايراً أو دقة تشخيصية</span>
                    {scan.modelVersion && <span className="block text-[10px] text-stone-500">{scan.modelVersion}</span>}
                  </div>
                  <span className="text-xl font-extrabold text-emerald-300 tabular-nums">{scan.modelScore}%</span>
                </div>
              )}

              {/* Pixel statistics are not applicable to the manual symptom wizard or ONNX pilot. */}
              {scan.diagnosticStatus !== 'symptom_triage' && !isModelScreening && (
                <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                    <span className="block text-stone-500">نسبة البكسلات الخضراء المقدّرة</span>
                    <span className="text-sm font-bold text-emerald-400">{analysisData.greenHealthIndex}%</span>
                  </div>
                  <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                    <span className="block text-stone-500">نسبة البكسلات المصنفة كبقع تقريباً</span>
                    <span className="text-sm font-bold text-amber-400">{analysisData.lesionSpotAreaPercentage}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observed Symptoms Checklist */}
          <div className="bg-stone-900/60 rounded-2xl p-4 border border-stone-800 space-y-2">
            <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{scan.diagnosticStatus === 'symptom_triage' || isModelScreening ? 'أعراض مرجعية للمقارنة — ليست أعراضاً مؤكدة في الصورة:' : 'المؤشرات المرصودة — لا تعني تشخيص مرض:'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {diseaseOrPest.visualSymptomsAr.map((symp, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-stone-300 bg-stone-850 p-2 rounded-xl border border-stone-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{symp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-amber-200">حدود النتيجة وما يلزم التحقق منه</h4>
            <p className="text-xs leading-6 text-stone-200">
              {scan.diagnosticStatus === 'symptom_triage'
                ? (diseaseOrPest.id === 'unclassified_symptom' ? 'لم يظهر تطابق محدد بين المحصول والجزء المتأثر والنمط المختار. السبب ما زال غير محدد، وقد يكون مرضياً أو حشرياً أو فسيولوجياً أو بيئياً.' : 'المرشح المعروض مبني على الأعراض التي اخترتها يدوياً للمقارنة فقط؛ وقد تتشابه أعراض أمراض مختلفة أو نقص العناصر أو أضرار الطقس.')
                : isModelScreening
                  ? 'هذا نموذج بصري تجريبي يختار فئات محدودة وفق المحصول. قد لا يكتشف أمراضاً أو آفات غير موجودة في بيانات تدريبه، ولا يجوز تفسير فئة Healthy على أنها إثبات لسلامة النبات. لم يُختبر ميدانياً على مزارع الساحل السوري، ودرجة النموذج غير معايرة.'
                : scan.diagnosticStatus === 'insufficient_image'
                  ? 'الصورة لم تجتز شروط الجودة الأساسية. لا يمكن تفسيرها حتى تعاد بصورة أوضح.'
                  : isScreeningOnly
                    ? 'هذه الأداة تقيس مؤشرات لونية بسيطة ولا تستخدم نموذجاً مدرّباً على صور حقول الساحل السوري. لا تحدد المرض ولا تستبعد الإصابة.'
                    : 'هذه نتيجة من إصدار سابق. لا توجد معايرة موثقة لنسبة التطابق أو شدة الإصابة، لذلك لا تعتمد عليها لاتخاذ قرار علاجي.'}
            </p>
            {(scan.screeningNotesAr || []).map((note, index) => <p key={index} className="text-xs text-stone-300 leading-5">• {note}</p>)}
            <div className="rounded-xl bg-stone-900/80 p-3 text-xs text-stone-200 leading-6">
              <strong className="text-amber-300">قبل أي علاج:</strong> افحص وجهي الورقة، وصوّر عدة أوراق، وسجّل المحصول والصنف وعمر النموات والطقس. لا تختَر مبيداً أو جرعة أو فترة أمان من هذه النتيجة؛ ارجع إلى ملصق منتج مسجّل محلياً ومهندس زراعي.
            </div>
            <ul className="list-disc pr-5 text-xs text-stone-300 space-y-1">
              {diseaseOrPest.identificationTipsAr.map((tip, index) => <li key={index}>{tip}</li>)}
            </ul>
          </div>
          {scan.diagnosticStatus !== 'symptom_triage' && !isModelScreening && (
            <div className="bg-stone-900/60 rounded-2xl p-4 border border-stone-800 space-y-2">
              <h4 className="text-xs font-bold text-stone-300">قياسات لونية تقريبية</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-950 rounded-lg p-2">أخضر مقدّر: {analysisData.greenHealthIndex}%</div>
              <div className="bg-stone-950 rounded-lg p-2">أصفر مقدّر: {analysisData.chlorosisPercentage}%</div>
              <div className="bg-stone-950 rounded-lg p-2">بني مقدّر: {analysisData.necrosisPercentage}%</div>
              <div className="bg-stone-950 rounded-lg p-2">{analysisData.detectedHueSummary}</div>
            </div>
              <p className="text-[10px] text-stone-500">هذه نسب بكسلات تقريبية وليست نسبة إصابة نسيجية أو احتمال مرض.</p>
            </div>
          )}
          {/* Farmer's Field Notes & Action Log */}
          <div className="bg-stone-900 rounded-2xl p-4 border border-stone-800 space-y-2.5">
            <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-emerald-400" />
              <span>ملاحظات الحقل والتوثيق (محفوظة محلياً):</span>
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: تم رش ربع الحقل الشمالي اليوم، ومتابعة التحسن بعد 3 أيام..."
                className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleSaveNotes}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : null}
                <span>{savedSuccess ? 'تم الحفظ' : 'حفظ الملاحظة'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
          >
            فحص ورقة أخرى
          </button>
        </div>
      </div>
    </div>
  );
};
