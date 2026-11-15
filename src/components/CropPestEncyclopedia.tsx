import React, { useState } from 'react';
import { Search, Filter, Leaf, Bug, AlertTriangle, ShieldCheck, ChevronLeft, Droplets, Thermometer, FlaskConical, Clock } from 'lucide-react';
import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { Crop, DiseasePest } from '../types/crop';

export const CropPestEncyclopedia: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<DiseasePest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter diseases based on search and category
  const filteredDiseases = DISEASES_DATABASE.filter((d) => {
    let matchesCategory = false;
    if (categoryFilter === 'all') {
      matchesCategory = true;
    } else if (categoryFilter === 'syrian_coast') {
      matchesCategory = d.targetCropIds.some((cid) => {
        const c = CROPS_DATABASE.find((x) => x.id === cid);
        return c?.isSyrianCoastSpecialty;
      });
    } else {
      matchesCategory = d.category === categoryFilter;
    }

    const matchesQuery = 
      d.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||      d.visualSymptomsAr.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Search and Category Filter Toolbar */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span>موسوعة المحاصيل والآفات الزراعية (بدون نت)</span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              مرجع أولي للأعراض والمحاصيل؛ معلومات العلاج قيد التحقق
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن آفة، محصول، أو عرض..."
              className="w-full bg-stone-950 border border-stone-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-800/80 text-xs font-medium">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'syrian_coast', label: '🌊 محاصيل الساحل السوري' },
            { id: 'fungal', label: '🍄 أمراض فطرية' },
            { id: 'pest', label: '🐛 آفات حشرية' },
            { id: 'bacterial', label: '🦠 بكتيرية' },
            { id: 'nutrient_deficiency', label: '🧪 نقص عناصر وتربة كلسية' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Crop Quick Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-stone-300">تصفح المحاصيل (مع التركيز على الساحل السوري):</h3>
          <span className="text-[11px] text-emerald-400 font-medium">اللاذقية • طرطوس • جبلة • بانياس • مشتى الحلو • كسب</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {CROPS_DATABASE.map((crop) => (
            <div
              key={crop.id}
              onClick={() => setSelectedCrop(selectedCrop?.id === crop.id ? null : crop)}
              className={`p-2.5 rounded-2xl border transition cursor-pointer flex flex-col items-center text-center space-y-1 ${
                selectedCrop?.id === crop.id
                  ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
              }`}
            >
              <span className="text-2xl">{crop.icon}</span>
              <span className="text-xs font-bold leading-tight">{crop.nameAr.split('(')[0]}</span>
              {crop.isSyrianCoastSpecialty && (
                <span className="text-[9px] bg-teal-500/15 text-teal-300 border border-teal-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                  ساحلي 🌊
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Crop Detail Card (if one clicked) */}
      {selectedCrop && (
        <div className="bg-stone-900/90 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedCrop.icon}</span>
              <div>
                <h3 className="text-base font-bold text-white">{selectedCrop.nameAr}</h3>
                <span className="text-xs text-stone-400 font-mono italic">{selectedCrop.scientificName}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedCrop(null)}
              className="text-stone-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-stone-800"
            >
              إلغاء التحديد
            </button>
          </div>

          {selectedCrop.syrianCoastRegionAr && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <span className="text-base">📍</span>
              <span><strong>مناطق الانتشار في الساحل السوري:</strong> {selectedCrop.syrianCoastRegionAr}</span>
            </div>
          )}

          <p className="text-xs text-stone-300 leading-relaxed">{selectedCrop.descriptionAr}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[11px]">الحرارة المثالية:</span>
                <span className="text-stone-200 font-medium">{selectedCrop.optimalTemperatureAr}</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="text-stone-400 block text-[11px]">إرشادات الري في مناخ الساحل:</span>
                <span className="text-stone-200 font-medium">{selectedCrop.wateringAdviceAr}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diseases / Pests Cards List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-stone-400 px-1">
          قائمة الآفات والأمراض المسجلة ({filteredDiseases.length}):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredDiseases.map((disease) => {
            const isCritical = disease.severity === 'critical';
            return (
              <div
                key={disease.id}
                onClick={() => setSelectedDisease(disease)}
                className="bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3 shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      disease.category === 'fungal' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                      disease.category === 'pest' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                      disease.category === 'viral' ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' :
                      'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                    }`}>
                      {disease.category === 'fungal' ? 'فطري' : disease.category === 'pest' ? 'حشري' : disease.category === 'viral' ? 'فيروسي' : 'نقص عناصر'}
                    </span>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {disease.severity === 'critical' ? 'خطر حرج' : disease.severity === 'high' ? 'عالي' : 'متوسط'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                    {disease.nameAr}
                  </h4>
                  <p className="text-[11px] text-stone-400 font-mono italic mt-0.5">
                    {disease.scientificName}
                  </p>

                  <p className="text-xs text-stone-300 mt-2 line-clamp-2 leading-relaxed">
                    {disease.descriptionAr}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
                  <span>عرض معلومات الآفة والأعراض</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disease Detail Popup Modal */}
      {selectedDisease && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">{selectedDisease.nameAr}</h3>
                <p className="text-xs text-stone-400 font-mono italic">{selectedDisease.scientificName}</p>
              </div>
              <button
                onClick={() => setSelectedDisease(null)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                إغلاق
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">{selectedDisease.descriptionAr}</p>

            {/* Symptoms */}
            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-emerald-400">الأعراض المرئية:</h5>
              <div className="space-y-1">
                {selectedDisease.visualSymptomsAr.map((symp, i) => (
                  <div key={i} className="text-xs text-stone-300 flex items-start gap-2 bg-stone-950 p-2 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{symp}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 space-y-2">
            <h5 className="text-xs font-bold text-amber-200">تنبيه بشأن العلاج والمبيدات</h5>
            <p className="text-xs leading-6 text-stone-200">
              بيانات العلاجات والجرعات وفترات الأمان في قاعدة المعلومات لم تُراجع بعد مقابل سجل المبيدات والملصقات الرسمية المحلية. لذلك لا نعرضها كتوصيات للاستخدام. لا تستخدم أي جرعة أو اسم تجاري من مصادر غير موثقة.
            </p>
            <p className="text-xs leading-6 text-stone-300">
              يمكن استخدام وصف الأعراض للمقارنة الأولية فقط. يجب تأكيد السبب مع مهندس زراعي، ثم اختيار منتج مسجل للمحصول والآفة واتباع ملصقه بالكامل.
            </p>
          </div>
          <div className="space-y-1.5">
            <h5 className="text-xs font-bold text-teal-300">إجراءات وقائية عامة — ليست علاجاً للمرض</h5>
            {selectedDisease.preventiveMeasuresAr.map((measure, i) => (
              <div key={i} className="text-xs text-stone-200 bg-stone-950 border border-stone-800 p-2.5 rounded-xl">{measure}</div>
            ))}
          </div>

            <button
              onClick={() => setSelectedDisease(null)}
              className="w-full mt-3 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition"
            >
              تم، إغلاق البطاقة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
