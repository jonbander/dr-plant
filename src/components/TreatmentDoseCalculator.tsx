import React, { useState } from 'react';
import { Calculator, Droplet, AlertTriangle, ShieldCheck, Check, Sparkles, Scale } from 'lucide-react';

interface TreatmentDoseCalculatorProps {
  initialCrop?: string;
  initialPest?: string;
  initialDose?: string;
  initialSafetyDays?: number;
}

export const TreatmentDoseCalculator: React.FC<TreatmentDoseCalculatorProps> = ({
  initialCrop = 'ورق العنب الفرنسي',
  initialPest = 'غير محدد',
  initialDose = '',
  initialSafetyDays = 0
}) => {
  const [tankLiters, setTankLiters] = useState<number>(20); // Default 20L backpack sprayer (رشاشة ظهرية)
  const [dosePer100L, setDosePer100L] = useState<number>(0);
  const [unit, setUnit] = useState<'ml' | 'gm'>('ml');
  const [customTank, setCustomTank] = useState<string>('');
  const [sprayMethod, setSprayMethod] = useState<'backpack' | 'tank' | 'tractor'>('backpack');

  // Parse initial dose if provided
  React.useEffect(() => {
    const num = parseFloat(initialDose);
    if (Number.isFinite(num) && num > 0) {
      setDosePer100L(num);
      if (initialDose.includes('جم') || initialDose.includes('g')) {
        setUnit('gm');
      } else {
        setUnit('ml');
      }
    }
    else setDosePer100L(0);
  }, [initialDose]);

  // Total required dose: (tankLiters / 100) * dosePer100L
  const activeLiters = customTank ? parseFloat(customTank) || tankLiters : tankLiters;
  const validCalculation = Number.isFinite(activeLiters) && activeLiters > 0 && activeLiters <= 100000 && Number.isFinite(dosePer100L) && dosePer100L > 0;
  const calculatedDose = validCalculation ? ((activeLiters / 100) * dosePer100L).toFixed(1) : '';

  return (
    <div className="w-full max-w-xl mx-auto bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-100 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">حاسبة جرعات الرش والمبيدات الحقلية</h2>
          <p className="text-xs text-stone-400">حساب رياضي فقط لجرعة تدخلها من ملصق العبوة المسجّلة</p>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="space-y-4">
        {/* Preset Tank Size Selection */}
        <div>
          <label className="block text-xs font-bold text-stone-300 mb-2">نوع وسعة خزان الرش:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'رشاشة ظهر (20 لتر)', value: 20 },
              { label: 'برميل رش (100 لتر)', value: 100 },
              { label: 'تانكي جرار (600 لتر)', value: 600 }
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setTankLiters(preset.value);
                  setCustomTank('');
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition ${
                  tankLiters === preset.value && !customTank
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Tank Input */}
        <div>
          <label className="block text-xs font-medium text-stone-400 mb-1">أو أدخل سعة خزان مخصصة (باللتر):</label>
          <div className="relative">
            <input
              type="number"
              value={customTank}
              onChange={(e) => setCustomTank(e.target.value)}
              placeholder="مثال: 16 لتر، 200 لتر..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-500">لتر ماء</span>
          </div>
        </div>

        {/* Recommended Dose Per 100L */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">الجرعة المكتوبة على الملصق لكل 100 لتر:</label>
            <input
              type="number"
              min="0"
              step="any"
              value={dosePer100L || ''}
              onChange={(e) => setDosePer100L(parseFloat(e.target.value) || 0)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">وحدة القياس:</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnit('ml')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  unit === 'ml'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                مل / سم³ (سائل)
              </button>
              <button
                type="button"
                onClick={() => setUnit('gm')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                  unit === 'gm'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                جرام (مسحوق)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-300">الكمية الحسابية للخزان</span>
          <span className="text-xs text-stone-400">سعة الخزان: {activeLiters} لتر</span>
        </div>
        {validCalculation ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white">{calculatedDose}</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">{unit === 'ml' ? 'ملليلتر' : 'غرام'}</span>
            </div>
            <p className="text-[11px] text-stone-300">هذه عملية حسابية للجرعة التي أدخلتها، وليست توصية بأن المنتج مناسب للمحصول أو المرض.</p>
          </>
        ) : (
          <p className="text-sm text-amber-200">أدخل جرعة مؤكدة من ملصق العبوة وسعة خزان صحيحة أكبر من صفر ليظهر الحساب.</p>
        )}
      </div>
      {/* Agricultural Safety Checklist */}
      <div className="bg-stone-950/70 rounded-2xl p-4 border border-stone-800 space-y-2 text-xs">
        <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>تنبيهات ومعايير السلامة أثناء الرش:</span>
        </h4>
        <ul className="space-y-1.5 text-stone-300 text-[11px]">
          <li className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>الرش في الصباح الباكر أو بعد انكسار حرارة الشمس لتفادي حروق الأوراق.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>فترة ما قبل الحصاد وفترة إعادة الدخول تختلفان حسب المنتج والمحصول والبلد؛ اتبع الملصق المحلي فقط.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>ارتداء القفازات والكمامة وعدم الرش في اتجاه الرياح المعاكسة.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
