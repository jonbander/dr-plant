import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Zap, Sparkles, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import { Crop } from '../types/crop';
import { CROPS_DATABASE, SAMPLE_TEST_LEAVES } from '../data/cropsAndDiseases';

interface CameraScannerProps {
  selectedCropId: string;
  onSelectCropId: (cropId: string) => void;
  onImageCaptured: (imageSrc: string, cropId?: string) => void;
  isAnalyzing: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  selectedCropId,
  onSelectCropId,
  onImageCaptured,
  isAnalyzing
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showSamplesModal, setShowSamplesModal] = useState(false);

  // Initialize or restart camera stream
  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('لم نتمكن من فتح الكاميرا مباشرة (قد تكون معطلة أو غير مسموحة). يمكنك استخدام زر "رفع صورة" بدلاً من ذلك.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture frame from video to canvas
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onImageCaptured(dataUrl);
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageCaptured(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  useEffect(() => {
    // Attempt auto camera start on mount
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col w-full max-w-xl mx-auto rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl">
      {/* Top Controls Bar: Crop Selector */}
      <div className="p-4 bg-stone-900/90 backdrop-blur-md border-b border-stone-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400">المحصول:</span>
          <select
            value={selectedCropId}
            onChange={(e) => onSelectCropId(e.target.value)}
            className="bg-stone-800 border border-stone-700 text-stone-100 text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="auto">اختر نوع المحصول أولاً</option>
            {CROPS_DATABASE.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.icon} {crop.nameAr}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowSamplesModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 text-xs font-medium transition"
          title="عينات تجريبية للأوراق المصابة"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>عينات جاهزة</span>
        </button>
      </div>

      {/* Main Viewfinder Box */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-black flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-stone-400 max-w-xs space-y-3">
            <Camera className="w-12 h-12 text-stone-600 animate-pulse" />
            <p className="text-xs leading-relaxed text-stone-400">
              {cameraError || 'الكاميرا غير مفعلة حالياً. يمكنك تفعيلها أو رفع صورة ورقة المحصول من المعرض.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => startCamera()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>تشغيل الكاميرا</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع صورة</span>
              </button>
            </div>
          </div>
        )}

        {/* Framing Crosshairs and Targeting Grid */}
        {isCameraActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="relative w-4/5 h-4/5 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />

              {/* Scanning beam line */}
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[bounce_2.5s_infinite]" />

              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] text-emerald-300 font-medium">
                ضع ورقة النبات أو مكان الإصابة داخل الإطار
              </div>
            </div>
          </div>
        )}

        {/* Camera switch button */}
        {isCameraActive && (
          <button
            onClick={toggleFacingMode}
            className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition"
            title="تبديل الكاميرا الخلفية / الأمامية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Analyzing Overlay Indicator */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <Sparkles className="w-7 h-7 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">جاري الفحص العصبي المحلي بدون نت...</p>
              <p className="text-xs text-emerald-300 mt-1">استخلاص الأنسجة، تحليل الكلوروز، ومطابقة الآفات</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-4 bg-stone-900 border-t border-stone-800 flex items-center justify-around gap-4">
        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-400 transition"
          title="اختيار صورة من المعرض"
        >
          <div className="w-11 h-11 rounded-2xl bg-stone-800 flex items-center justify-center border border-stone-700 hover:border-emerald-500/50">
            <Upload className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">من المعرض</span>
        </button>

        {/* Main Capture Shutter Button */}
        <button
          onClick={captureFrame}
          disabled={!isCameraActive || isAnalyzing}
          className="relative w-18 h-18 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 p-1 shadow-lg shadow-emerald-950/60 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition flex items-center justify-center cursor-pointer"
          title="التقاط صورة وتشخيص فوري"
        >
          <div className="w-full h-full rounded-full border-2 border-white/60 flex items-center justify-center bg-emerald-600/50">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-emerald-700" />
            </div>
          </div>
        </button>

        {/* Sample Leaves Quick Button */}
        <button
          onClick={() => setShowSamplesModal(true)}
          className="flex flex-col items-center gap-1 text-stone-400 hover:text-emerald-400 transition"
          title="تجربة عينة أوراق مصابة جاهزة"
        >
          <div className="w-11 h-11 rounded-2xl bg-stone-800 flex items-center justify-center border border-stone-700 hover:border-emerald-500/50">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">عينات فحص</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Sample Test Leaves Modal */}
      {showSamplesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-stone-900 border border-stone-800 p-5 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">عينات أوراق لفحص الذكاء الاصطناعي أوفلاين</h3>
              </div>
              <button
                onClick={() => setShowSamplesModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg text-xs"
              >
                إغلاق
              </button>
            </div>

            <p className="text-xs text-stone-400 mt-3 mb-4 leading-relaxed">
              اختر عينة لاختبار فئة مدرّبة بعد تحديد المحصول؛ بعض العينات التعليمية تمثل أمراضاً غير مفعّلة في النموذج الحالي وستُرفض بدلاً من تخمينها:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SAMPLE_TEST_LEAVES.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectCropId(sample.cropId);
                    onImageCaptured(sample.imageUrl || sample.svgData, sample.cropId);
                    setShowSamplesModal(false);
                  }}
                  className="group cursor-pointer rounded-xl bg-stone-800/80 hover:bg-stone-800 border border-stone-700 hover:border-emerald-500/60 p-3 transition flex flex-col items-center text-center space-y-2"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-stone-700 bg-stone-950 flex items-center justify-center">
                    <img
                      src={sample.imageUrl || sample.svgData}
                      alt={sample.titleAr}
                      className="w-full h-full object-contain group-hover:scale-105 transition"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">{sample.titleAr}</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-2">{sample.descAr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
