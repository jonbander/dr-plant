import React, { useState, useEffect } from 'react';
import { 
  X, Volume2, VolumeX, CheckCircle, AlertTriangle, ShieldAlert, 
  FlaskConical, Leaf, Sprout, Clock, Bookmark, Share2, Printer, 
  Check, FileText, ChevronRight, Calculator, Activity
} from 'lucide-react';
import { ScanResult } from '../types/crop';
import { speakArabicDiagnosis, stopSpeech, isSpeaking } from '../services/speechService';
import confetti from 'canvas-confetti';

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

  useEffect(() => {
    // If healthy, throw celebratory green confetti
    if (isHealthy) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#facc15']
      });
    }

    return () => {
      stopSpeech();
    };
  }, [isHealthy]);

  // Handle voice readout
  const toggleVoice = () => {
    if (isReadingAudio) {
      stopSpeech();
      setIsReadingAudio(false);
    } else {
      let speechText = '';
      if (isHealthy) {
        speechText = `تهانينا! محصول ${crop.nameAr} بحالة صحية ممتازة ونضرة. نسبة الاخضرار ${analysisData.greenHealthIndex} بالمئة ولا توجد أي إصابات فطرية أو حشرية ملحوظة.`;
      } else {
        const topOrganic = diseaseOrPest.organicTreatmentAr[0] || '';
        const topChem = diseaseOrPest.chemicalTreatments[0]?.pesticideName || '';
        speechText = `تشخيص ذكاء اصطناعي محلي بدون إنترنت: تم رصد إصابة على محصول ${crop.nameAr} بمرض ${diseaseOrPest.nameAr}، بنسبة تأكيد ${confidence} بالمئة، ودرجة خطورة ${severity === 'critical' ? 'حرجة' : severity === 'high' ? 'عالية' : 'متوسطة'}. التوصية العاجلة: ${topOrganic}. وفي حال الرش الكيميائي يوصى باستخدام ${topChem}.`;
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
                <span className="text-xs text-emerald-400 font-medium">تشخيص ذكاء اصطناعي محلي فوري</span>
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
              <img
                src={scan.imageThumbnail}
                alt="ورقة الفحص"
                className="w-full h-full object-cover"
              />

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
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${severityBadge.bg}`}>
                  {severityBadge.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  تطابق {confidence}%
                </span>
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

              {/* Mini Spectral Progress stats */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                  <span className="block text-stone-500">مؤشر الاخضرار الصحي</span>
                  <span className="text-sm font-bold text-emerald-400">{analysisData.greenHealthIndex}%</span>
                </div>
                <div className="bg-stone-900 p-2 rounded-lg border border-stone-800">
                  <span className="block text-stone-500">نسبة التبقع والنخر</span>
                  <span className="text-sm font-bold text-amber-400">{analysisData.lesionSpotAreaPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observed Symptoms Checklist */}
          <div className="bg-stone-900/60 rounded-2xl p-4 border border-stone-800 space-y-2">
            <h4 className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>الأعراض المرصودة والمطابقة للآفة:</span>
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

          {/* Action Tabs for Treatments */}
          <div className="space-y-3">
            <div className="flex border-b border-stone-800 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('organic')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 transition border-b-2 ${
                  activeTab === 'organic'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Leaf className="w-4 h-4" />
                <span>العلاج العضوي والحيوي ({diseaseOrPest.organicTreatmentAr.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('chemical')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 transition border-b-2 ${
                  activeTab === 'chemical'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>المبيدات الكيميائية الموصى بها ({diseaseOrPest.chemicalTreatments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('prevention')}
                className={`pb-2.5 px-3 flex items-center gap-1.5 transition border-b-2 ${
                  activeTab === 'prevention'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>الممارسات الوقائية</span>
              </button>
            </div>

            {/* Tab 1: Organic & Biological */}
            {activeTab === 'organic' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                  🌱 <strong>حلول عضوية آمنة 100%:</strong> خالية من المتبقيات الكيميائية وتحافظ على الأعداء الحيوية ونظافة المحصول.
                </div>
                <div className="space-y-2">
                  {diseaseOrPest.organicTreatmentAr.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-xs text-stone-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                        {idx + 1}
                      </div>
                      <p className="leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Chemical Pesticides with PHI */}
            {activeTab === 'chemical' && (
              <div className="space-y-3">
                {diseaseOrPest.chemicalTreatments.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400 bg-stone-800/40 rounded-xl">
                    لا يتطلب هذا العارض تدخلاً كيميائياً (يمكن حله عضوياً وبتعديل برنامج التسميد والري).
                  </div>
                ) : (
                  diseaseOrPest.chemicalTreatments.map((chem, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-stone-850 border border-stone-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{chem.pesticideName}</h5>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                              🇸🇾 معتمد بالسوق السوري
                            </span>
                          </div>
                          <span className="text-xs text-stone-400 font-mono">المادة الفعالة: {chem.activeIngredient}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>فترة الأمان (PHI): {chem.safetyIntervalDays} أيام</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                          <span className="text-stone-400 block text-[11px]">الجرعة الموصى بها:</span>
                          <span className="font-bold text-emerald-400">{chem.dosePer100L}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                          <span className="text-stone-400 block text-[11px]">ملاحظات الرش والسلامة:</span>
                          <span className="text-stone-300">{chem.safetyNotesAr}</span>
                        </div>
                      </div>

                      {/* Calculator button for this pesticide */}
                      <button
                        onClick={() => {
                          onOpenCalculator(crop.nameAr, chem.pesticideName, chem.dosePer100L, chem.safetyIntervalDays);
                        }}
                        className="w-full mt-1 py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-750 border border-stone-700 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>احسب كمية المبيد اللازمة لخزان الرش الخاص بك</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Cultural & Preventive */}
            {activeTab === 'prevention' && (
              <div className="space-y-2">
                {diseaseOrPest.preventiveMeasuresAr.map((measure, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-800/60 border border-stone-700/60 text-xs text-stone-200">
                    <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{measure}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

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
