import React, { useState } from 'react';
import { HelpCircle, ChevronLeft, ChevronRight, Check, Sparkles, RotateCcw } from 'lucide-react';
import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { DiseasePest, ScanResult } from '../types/crop';

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
    let matchedDisease: DiseasePest = DISEASES_DATABASE[0];

    if (selectedCropId === 'french_grape_leaf') {
      if (primaryPattern === 'downy_oil') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'grape_downy_mildew') || matchedDisease;
      } else if (primaryPattern === 'blister_swell') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'grape_leaf_blister_mite') || matchedDisease;
      } else {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'grape_powdery_mildew') || matchedDisease;
      }
    } else if (selectedCropId === 'citrus_syrian') {
      if (affectedPart === 'stem' || primaryPattern === 'gummosis_sap') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'citrus_gummosis_syria') || matchedDisease;
      } else if (affectedPart === 'fruit' || primaryPattern === 'fruit_punctures') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'citrus_medfly_syria') || matchedDisease;
      } else if (primaryPattern === 'iron_yellowing') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'citrus_chlorosis_syria') || matchedDisease;
      } else {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'citrus_leafminer_syria') || matchedDisease;
      }
    } else if (selectedCropId === 'walnut') {
      if (affectedPart === 'fruit' || primaryPattern === 'fruit_punctures') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'walnut_codling_moth_syria') || matchedDisease;
      } else if (primaryPattern === 'black_burn') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'walnut_bacterial_blight_syria') || matchedDisease;
      } else {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'walnut_anthracnose_syria') || matchedDisease;
      }
    } else if (selectedCropId === 'myrtle_hamblas') {
      if (primaryPattern === 'white_powder') {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'hamblas_powdery_mildew') || matchedDisease;
      } else {
        matchedDisease = DISEASES_DATABASE.find(d => d.id === 'hamblas_leaf_spot_syria') || matchedDisease;
      }
    } else if (selectedCropId === 'wheat' && primaryPattern === 'rust_stripes') {
      matchedDisease = DISEASES_DATABASE.find(d => d.id === 'wheat_stripe_rust_syria') || matchedDisease;
    } else if (selectedCropId === 'olive') {
      matchedDisease = DISEASES_DATABASE.find(d => d.id === 'olive_peacock_spot_syria') || matchedDisease;
    } else if (primaryPattern === 'silver_mines') {
      matchedDisease = DISEASES_DATABASE.find(d => d.id === 'tuta_absoluta_syria') || matchedDisease;
    } else {
      matchedDisease = DISEASES_DATABASE.find(d => d.targetCropIds.includes(selectedCropId)) || DISEASES_DATABASE[0];
    }

    // Synthesize scan result
    const synthesizedScan: ScanResult = {
      id: 'wizard_' + Date.now(),
      timestamp: Date.now(),
      imageThumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23065f46"/><circle cx="50" cy="50" r="30" fill="%2334d399"/></svg>',
      crop: selectedCrop,
      diseaseOrPest: matchedDisease,
      confidence: 0,
      severity: 'low',
      diagnosticStatus: 'symptom_triage',
      screeningNotesAr: ['هذا احتمال أولي وفق اختياراتك وليس تشخيصاً مؤكداً.', 'لم تُحلّل صورة ولم تُقَس شدة الإصابة أو نسبة انتشارها.', 'لا تعتمد على الجرعات وأسماء المبيدات القديمة قبل التحقق من تسجيل المنتج وملصقه المحلي.'],
      analysisData: {
        greenHealthIndex: 0,
        lesionSpotAreaPercentage: 0,
        chlorosisPercentage: 0,
        necrosisPercentage: 0,
        powderyPercentage: 0,
        rustPercentage: 0,
        detectedHueSummary: 'لم يتم تحليل صورة؛ هذه إجابات المستخدم فقط.',
        leafContoursDetected: false,
        boundingBoxes: []
      },
      userNotes: 'تم التشخيص عبر المساعد الحقلي التفاعلي بدون كاميرا.'
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
            {[
              { id: 'white_powder', title: 'مسحوق أبيض كبودرة الطحين (رمد العنب أو بياض الحمبلاس)', desc: 'عرض كلاسيكي للرمد الدقيقي في كرمات الساحل' },
              { id: 'downy_oil', title: 'بقع زيتية صفراء وزغب أبيض قطني بالأسفل (ميلديو العنب)', desc: 'البياض الزغبي الخطير في منخفضات الساحل الرطبة' },
              { id: 'silver_mines', title: 'أنفاق فضية متعرجة لماعة والتواء النموات الغضة (مينوز)', desc: 'صانعة أنفاق أوراق الحمضيات والبندورة الساحلية' },
              { id: 'gummosis_sap', title: 'سيلان صمغي بني عسلي من قلف الجذع (تصمغ الحمضيات)', desc: 'عفن الفيتوفثورا في الترب الطينية والرطبة' },
              { id: 'fruit_punctures', title: 'ثقوب بالثمار وتساقطها مع ديدان داخلية (ذبابة الفاكهة/دودة الجوز)', desc: 'الميدفلاي في الحمضيات وحفار ثمار الجوز' },
              { id: 'iron_yellowing', title: 'اصفرار ليموني ساطع بين العروق الخضراء (كلوروز الترب الكلسية)', desc: 'نقص امتصاص الحديد الشائع في جبال وتلال الساحل' },
              { id: 'blister_swell', title: 'بثور وانتفاخات ثؤلولية على السطح وزغب صوفي بالأسفل', desc: 'حلم تبثر وتجعد ورق العنب الفرنسي' },
              { id: 'target_rings', title: 'بقع بنية مسودة دائرية بحلقات متداخلة كهيكل الهدف', desc: 'أنثراكنوز الجوز وتبقعات اللفحة المبكرة' }
            ].map((pattern) => (
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
