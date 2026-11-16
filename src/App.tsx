import React, { useState, useEffect } from 'react';
import { 
  Camera, BookOpen, Calculator, HelpCircle, History, Sparkles, 
  WifiOff, CheckCircle2, Leaf, Shield, Info, Sprout, Share2, Award, CloudRain
} from 'lucide-react';
import { CameraScanner } from './components/CameraScanner';
import { DiagnosisResultModal } from './components/DiagnosisResultModal';
import { CropPestEncyclopedia } from './components/CropPestEncyclopedia';
import { TreatmentDoseCalculator } from './components/TreatmentDoseCalculator';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { ScanHistoryView } from './components/ScanHistoryView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScanResult } from './types/crop';
import { GrapeWeatherEarlyWarning } from './components/GrapeWeatherEarlyWarning';
import { analyzePlantOffline } from './services/offlineAiVisionEngine';
import { getOfflineScans, saveOfflineScan, updateScanNotes } from './services/historyStorage';

type TabType = 'scanner' | 'encyclopedia' | 'calculator' | 'wizard' | 'history' | 'weather';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('scanner');
  const [selectedCropId, setSelectedCropId] = useState<string>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<ScanResult | null>(null);
  const [scansHistory, setScansHistory] = useState<ScanResult[]>([]);

  // Calculator prefill state
  const [calcParams, setCalcParams] = useState({
    cropName: 'غير محدد',
    pestName: 'غير محدد',
    dose: '',
    safetyDays: 0
  });

  // Load offline history on mount
  const refreshScans = () => {
    const loaded = getOfflineScans();
    setScansHistory(loaded);
  };

  useEffect(() => {
    refreshScans();
  }, []);

  // Handle image capture from camera or gallery
  const handleImageCaptured = async (imageSrc: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzePlantOffline({
        imageSource: imageSrc,
        suggestedCropId: selectedCropId
      });

      // Save to offline storage
      saveOfflineScan(result);
      refreshScans();
      setCurrentDiagnosis(result);
    } catch (err) {
      console.error('Offline visual screening failed:', err);
      alert('حدث خطأ أثناء معالجة الصورة محلياً، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Open calculator from diagnosis modal
  const handleOpenCalculator = (cropName: string, pestName: string, dose: string, safetyDays: number) => {
    setCalcParams({ cropName, pestName, dose, safetyDays });
    setCurrentDiagnosis(null);
    setActiveTab('calculator');
  };

  // Save notes from modal
  const handleSaveNotes = (id: string, notes: string) => {
    updateScanNotes(id, notes);
    refreshScans();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans pb-20 md:pb-8 selection:bg-emerald-500 selection:text-white">
      {/* Top Header & Navbar */}
      <header className="sticky top-0 z-40 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-stone-900 rounded-[14px] flex items-center justify-center">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  حَصَاد | كاشف آفات الساحل السوري
                </h1>
                <span className="hidden sm:inline text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  الفحص المحلي دون إنترنت
                </span>
              </div>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                ورق العنب الفرنسي • الحمضيات • الجوز • الحمبلاس • الزيتون | مبيدات السوق السورية
              </p>
            </div>
          </div>

          {/* Right Controls: Offline Status + PWA Install Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <OfflineIndicator />
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Quick Offline & Syrian Coastal Capability Ribbon */}
      <div className="bg-emerald-950/60 border-b border-emerald-800/30 px-4 py-1.5 text-center text-[11px] text-emerald-300 flex items-center justify-center gap-2 flex-wrap">
        <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded font-bold text-white text-[10px]">🇸🇾 الساحل السوري</span>
        <span>مخصص لبيئة الساحل السوري • الفحص المحلي يعمل دون إنترنت، أما الإنذار الجوي فيحتاج اتصالاً وموقع المزرعة.</span>
      </div>

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block max-w-4xl mx-auto w-full px-4 pt-5 pb-2">
        <div className="flex bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 gap-1 text-xs font-bold text-stone-400">
          {[
            { id: 'scanner', label: '📸 الفاحص الذكي (الكاميرا)', icon: Camera },
            { id: 'encyclopedia', label: '📖 الموسوعة الحقلية', icon: BookOpen },
            { id: 'calculator', label: '🧮 حاسبة جرعات الرش', icon: Calculator },
            { id: 'wizard', label: '🧙 المساعد التشخيصي', icon: HelpCircle },
            { id: 'history', label: `📂 سجل الفحوصات (${scansHistory.length})`, icon: History },
            { id: 'weather', label: '🌦️ الإنذار المبكر', icon: CloudRain },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/40'
                    : 'hover:text-stone-200 hover:bg-stone-850'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            {/* Feature Pitch Banner */}
            <div className="text-center max-w-lg mx-auto space-y-1">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                وجّه الكاميرا نحو الورقة المصابة
              </h2>
              <p className="text-xs text-stone-400">
                يفحص ألوان الصورة ومساحة اللون الأخضر محلياً. هذه أداة فرز بصري أولي وليست نموذجاً لتشخيص الأمراض أو وصف العلاج.
              </p>
            </div>

            {/* Camera Viewfinder Component */}
            <CameraScanner
              selectedCropId={selectedCropId}
              onSelectCropId={setSelectedCropId}
              onImageCaptured={handleImageCaptured}
              isAnalyzing={isAnalyzing}
            />

            {/* Quick Tips Box */}
            <div className="max-w-xl mx-auto grid grid-cols-3 gap-2.5 text-center text-[11px] text-stone-400 pt-2">
              <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-emerald-400 block font-bold mb-0.5">☀️ إضاءة واضحة</span>
                <span>تجنب الظلال الكثيفة أثناء التصوير</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-emerald-400 block font-bold mb-0.5">🎯 تركيز البؤرة</span>
                <span>اجعل البقعة المصابة في منتصف الإطار</span>
              </div>
              <div className="p-2.5 rounded-2xl bg-stone-900 border border-stone-800">
                <span className="text-emerald-400 block font-bold mb-0.5">⚡ سرعة فائقة</span>
                <span>النتيجة لا تثبت وجود المرض أو غيابه</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'encyclopedia' && <CropPestEncyclopedia />}

        {activeTab === 'weather' && <GrapeWeatherEarlyWarning />}

        {activeTab === 'calculator' && (
          <TreatmentDoseCalculator
            initialCrop={calcParams.cropName}
            initialPest={calcParams.pestName}
            initialDose={calcParams.dose}
            initialSafetyDays={calcParams.safetyDays}
          />
        )}

        {activeTab === 'wizard' && (
          <DiagnosticWizard
            onCompleteDiagnosis={(scan) => {
              saveOfflineScan(scan);
              refreshScans();
              setCurrentDiagnosis(scan);
            }}
          />
        )}

        {activeTab === 'history' && (
          <ScanHistoryView
            scans={scansHistory}
            onSelectScan={(scan) => setCurrentDiagnosis(scan)}
            onRefreshScans={refreshScans}
          />
        )}
      </main>

      {/* Floating Diagnosis Result Modal */}
      {currentDiagnosis && (
        <DiagnosisResultModal
          scan={currentDiagnosis}
          onClose={() => setCurrentDiagnosis(null)}
          onSaveNotes={handleSaveNotes}
          onOpenCalculator={handleOpenCalculator}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800 px-2 py-1.5 flex items-center justify-around text-[10px] font-medium text-stone-400">
        {[
          { id: 'scanner', label: 'الفحص', icon: Camera },
          { id: 'encyclopedia', label: 'الموسوعة', icon: BookOpen },
          { id: 'calculator', label: 'الحاسبة', icon: Calculator },
          { id: 'wizard', label: 'المساعد', icon: HelpCircle },
          { id: 'history', label: 'السجل', icon: History, badge: scansHistory.length },
          { id: 'weather', label: 'الطقس', icon: CloudRain },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'hover:text-stone-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400 scale-110' : 'text-stone-400'}`} />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
