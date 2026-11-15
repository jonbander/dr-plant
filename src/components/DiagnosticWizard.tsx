import React, { useState } from 'react';
import { HelpCircle, ChevronLeft, ChevronRight, Check, Sparkles, RotateCcw } from 'lucide-react';
import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { DiseasePest, ScanResult } from '../types/crop';
import { SYMPTOM_PATTERN_OPTIONS, getSymptomCandidateId, getSymptomPatternLabel } from '../services/symptomTriage';

interface DiagnosticWizardProps {
  onCompleteDiagnosis: (scan: ScanResult) => void;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({ onCompleteDiagnosis }) => {
  const [step, setStep] = useState<number>(1);
  const [selectedCropId, setSelectedCropId] = useState<string>('tomato');
  const [affectedPart, setAffectedPart] = useState<'leaves' | 'stem' | 'fruit'>('leaves');
  const [primaryPattern, setPrimaryPattern] = useState<string>('');

  const selectedCrop = CROPS_DATABASE.find(c => c.id === selectedCropId) || CROPS_DATABASE[0];

  const handleFinish = () => {
    const candidateId = getSymptomCandidateId(selectedCropId, affectedPart, primaryPattern);
    const matchedDisease = candidateId
      ? DISEASES_DATABASE.find((disease) => disease.id === candidateId)
      : undefined;
    const partLabel = affectedPart === 'leaves'
      ? 'الأوراق'
      : affectedPart === 'stem'
        ? 'الساق أو الجذع'
        : 'الثمار';
    const patternLabel = getSymptomPatternLabel(primaryPattern);

    // Never force a disease name when the crop/organ/pattern combination is unsupported.
    const triageRecord: DiseasePest = matchedDisease ?? {
      id: 'unclassified_symptom',
      nameAr: 'أعراض غير محددة — يلزم استكمال الفحص',
      nameEn: 'Unclassified plant symptoms',
      scientificName: 'لم يتم تحديد مسبب مرضي',
      category: 'undetermined',
      severity: 'low',
      targetCropIds: [selectedCropId],
      visualSymptomsAr: [
        `الموضع الذي حددته: ${partLabel}`,
        `النمط الذي وصفته: ${patternLabel}`,
      ],
      descriptionAr: 'لم يظهر تطابق محدد وموثوق بين المحصول والجزء المتأثر والنمط المختار. قد تكون الأسباب مرضية أو حشرية أو فسيولوجية أو مرتبطة بالطقس والري والتربة. لا تُنسب الحالة إلى مرض بعينه من هذه الإجابات وحدها.',
      favorableConditionsAr: 'لم تُحدد ظروف الإصابة أو تاريخها؛ يلزم تسجيل الطقس والري والتسميد وتوزع الأعراض في الحقل.',
      organicTreatmentAr: [],
      chemicalTreatments: [],
      preventiveMeasuresAr: [
        'وثّق الأعراض وصوّر أكثر من ورقة أو جزء مصاب مع صورة كاملة للنبات.',
        'قارن النباتات المصابة والسليمة وسجّل تاريخ ظهور الأعراض والري والتسميد والرش.',
      ],
      identificationTipsAr: [
        'افحص وجهي الورقة والأفرع والثمار بحسب موضع العرض.',
        'اطلب مراجعة مهندس زراعي أو مختبر عند استمرار الأعراض أو انتشارها.',
      ],
      visionSignatures: {
        dominantHues: [],
        spotTexture: 'scorch',
        targetPart: affectedPart === 'leaves' ? 'leaf' : affectedPart === 'stem' ? 'stem' : 'fruit',
      },
    };

    const synthesizedScan: ScanResult = {
      id: 'wizard_' + Date.now(),
      timestamp: Date.now(),
      imageThumbnail: '',
      crop: selectedCrop,
      diseaseOrPest: triageRecord,
      confidence: 0,
      severity: 'low',
      diagnosticStatus: 'symptom_triage',
      screeningNotesAr: [
        'هذا فرز أولي مبني على إجاباتك فقط، وليس تشخيصاً مؤكداً.',
        `الموضع الذي حددته: ${partLabel}.`,
        `النمط الذي اخترته: ${patternLabel}.`,
        candidateId && matchedDisease
          ? 'اسم المرض المعروض سجل مرجعي محتمل للمقارنة، وليس تأكيداً لوجوده.'
          : 'لم يُفرض اسم مرض؛ السبب ما زال غير محدد.',
        'لم تُحلّل صورة ولم تُقَس شدة الإصابة أو نسبة انتشارها.',
        'لا تعتمد على هذه النتيجة لاختيار علاج أو مبيد أو جرعة.',
      ],
      analysisData: {
        greenHealthIndex: 0,
        lesionSpotAreaPercentage: 0,
        chlorosisPercentage: 0,
        necrosisPercentage: 0,
        powderyPercentage: 0,
        rustPercentage: 0,
        detectedHueSummary: 'لم يتم تحليل صورة؛ هذه إجابات المستخدم فقط.',
        leafContoursDetected: false,
        boundingBoxes: [],
      },
      userNotes: 'فرز أعراض يدوي — لا توجد صورة مرفوعة ولا تشخيص مؤكد.',
    };

    onCompleteDiagnosis(synthesizedScan);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-100 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-2.5">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">المساعد التشخيصي الذكي (خطوة بخطوة)</h2>
            <p className="text-xs text-stone-400">فرز أولي للأعراض — لا يصدر تشخيصاً مؤكداً أو توصية مبيد</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/30">
          خطوة {step} من 3
        </span>
      </div>

      {/* Step 1: Select Crop */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-stone-300">1. حدد نوع المحصول الذي ترغب في فحصه:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CROPS_DATABASE.map((crop) => (
              <button
                key={crop.id}
                type="button"
                onClick={() => setSelectedCropId(crop.id)}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  selectedCropId === crop.id
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-stone-850 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <span className="text-2xl">{crop.icon}</span>
                <span className="text-xs font-bold">{crop.nameAr}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>التالي: تحديد مكان الإصابة</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Part Affected */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-stone-300">2. أين يتركز الضرر أو العَرَض في النبات؟</h3>
          <div className="space-y-2.5">
            {[
              { id: 'leaves', label: '🍃 على الأوراق (سفلية أو قمم نامية)', desc: 'بقع، اصفرار، مسحوق أبيض، تجعد أو ثقوب' },
              { id: 'stem', label: '🪵 على الساق أو الجذع الرئيسي', desc: 'نشارة، سيلان صمغي، اسوداد العنق، أو تعفن القواعد' },
              { id: 'fruit', label: '🍅 على الثمار أو الدرنات', desc: 'قروح، عفن طري، بقع مائية، أو ثقوب نخرية' }
            ].map((part) => (
              <div
                key={part.id}
                onClick={() => setAffectedPart(part.id as any)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                  affectedPart === part.id
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-stone-850 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="text-xs font-bold">{part.label}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{part.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="py-2.5 px-4 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
            >
              رجوع
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>التالي: شكل وتفاصيل العَرَض</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Symptom Pattern */}
      {step === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-stone-300">3. ما هو الشكل الأكثر مطابقة لما تراه بالعين؟</h3>
          <div className="space-y-2">
            {SYMPTOM_PATTERN_OPTIONS.map((pattern) => (
              <div
                key={pattern.id}
                onClick={() => setPrimaryPattern(pattern.id)}
                className={`p-3 rounded-2xl border cursor-pointer transition ${
                  primaryPattern === pattern.id
                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                    : 'bg-stone-850 border-stone-800 text-stone-300 hover:border-stone-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300">{pattern.title}</div>
                <div className="text-[11px] text-stone-400 mt-0.5">{pattern.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(2)}
              className="py-2.5 px-4 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
            >
              رجوع
            </button>
            <button
              onClick={handleFinish}
              disabled={!primaryPattern}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              <Sparkles className="w-4 h-4" />
              <span>عرض احتمال أولي للمراجعة</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
