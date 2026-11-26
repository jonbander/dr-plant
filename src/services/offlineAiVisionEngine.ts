import { Crop, DiseasePest, ScanResult } from '../types/crop';
import { CROPS_DATABASE } from '../data/cropsAndDiseases';
import { analyzeLeafPixels, evaluateImageQuality } from './leafScreening';
import { classifyPlantDiseaseWithOnnx } from './onnxDiseaseClassifier';
import { selectModelRoute } from './modelRouter';

export interface AnalysisInput {
  imageSource: HTMLImageElement | HTMLCanvasElement | string;
  suggestedCropId?: string;
  /** Research-only opt-in; production keeps this false until all promotion gates pass. */
  allowResearchModels?: boolean;
}

const UNKNOWN_CROP: Crop = {
  id: 'unknown_crop',
  nameAr: 'محصول غير محدد',
  nameEn: 'Unspecified crop',
  scientificName: 'غير محدد',
  categoryAr: 'محاصيل الساحل السوري',
  icon: '🌱',
  descriptionAr: 'لم يتم اختيار نوع المحصول. لا يمكن استنتاج النوع النباتي من لون الصورة وحده.',
  optimalTemperatureAr: 'غير محدد',
  wateringAdviceAr: 'غير محدد',
  commonDiseaseIds: []
};

/**
 * Offline visual screening only.
 * This is deterministic pixel analysis, not a trained disease-recognition model.
 * It must never return a named disease or pesticide recommendation.
 */
export async function analyzePlantOffline(input: AnalysisInput): Promise<ScanResult> {
  const img = await loadImageElement(input.imageSource);
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  const scale = Math.min(1, 320 / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('تعذر إنشاء مساحة تحليل الصورة.');

  context.drawImage(img, 0, 0, width, height);
  const metrics = analyzeLeafPixels(context.getImageData(0, 0, width, height).data, width, height);
  const quality = evaluateImageQuality(width, height, metrics, sourceWidth, sourceHeight);
  const selectedCrop = input.suggestedCropId && input.suggestedCropId !== 'auto'
    ? CROPS_DATABASE.find(crop => crop.id === input.suggestedCropId)
    : undefined;
  const crop = selectedCrop || UNKNOWN_CROP;
  const routeDecision = selectModelRoute({
    crop: selectedCrop,
    allowResearchModels: input.allowResearchModels === true
  });

  const observedPatterns: string[] = [];
  if (metrics.yellowPercent >= 5) observedPatterns.push('توجد نسبة ملحوظة من البكسلات الصفراء ضمن المنطقة الخضراء المقدّرة؛ قد تتوافق مع اصفرار أو تغير لون.');
  if (metrics.brownPercent >= 4) observedPatterns.push('توجد بكسلات بنية/باهتة ضمن المنطقة النباتية المقدّرة؛ يلزم فحص شكل البقع وحدودها.');
  if (metrics.darkPercent >= 3) observedPatterns.push('توجد مناطق داكنة؛ لا يمكن تمييز النخر عن الظلال أو آثار التصوير بهذه الطريقة.');
  if (observedPatterns.length === 0) observedPatterns.push('لم تُرصد تغيرات لونية قوية وفق العتبات البسيطة؛ هذا لا يثبت أن النبات سليم.');

  const notes = [...quality.warnings];
  if (routeDecision.status === 'research_blocked' || routeDecision.status === 'unsupported_crop' || routeDecision.status === 'unknown_crop') {
    notes.push(routeDecision.reason);
  }
  if (quality.isUsable && routeDecision.status === 'selected' && input.allowResearchModels === true) {
    const modelResult = await classifyPlantDiseaseWithOnnx(img, selectedCrop?.id);
    notes.push(`مسار النموذج: ${routeDecision.primary?.id || 'غير محدد'}. ${modelResult.message}`);
    if (modelResult.status === 'possible_match' || modelResult.status === 'unsure' || modelResult.status === 'candidate_only') {
      notes.push('هذه نتيجة بحثية/احتمالية ضمن فئات النموذج فقط، وليست تشخيصاً مؤكداً ولا توصية علاجية.');
    }
  }
  notes.push('هذا تحليل ألوان ومساحة خضراء تقريبي، وليس نموذجاً مدرّباً لتحديد الأمراض أو الآفات.');
  notes.push('لا يتم تحديد نوع النبات تلقائياً. اختر المحصول الصحيح قبل تفسير الأعراض.');
  notes.push('لا تستخدم النتيجة لاختيار مبيد أو جرعة؛ يلزم فحص وجهي الورقة والسياق الحقلي.');

  const disease: DiseasePest = {
    id: 'visual_screening_only',
    nameAr: quality.isUsable ? 'مؤشرات بصرية أولية — المرض غير محدد' : 'الصورة غير كافية للفحص الأولي',
    nameEn: 'Preliminary visual screening only',
    scientificName: 'غير محدد',
    category: 'environmental',
    severity: 'low',
    targetCropIds: selectedCrop ? [selectedCrop.id] : [],
    visualSymptomsAr: observedPatterns,
    descriptionAr: 'لا يستطيع تحليل الألوان وحده التمييز بين المرض الفطري أو البكتيري أو الحشرة أو نقص العناصر أو الضرر البيئي. لا يوجد تشخيص مرضي مؤكد في هذه النتيجة.',
    favorableConditionsAr: 'غير متاح؛ يلزم تسجيل الطقس والرطوبة ومرحلة نمو النبات ومكان ظهور الأعراض.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [],
    identificationTipsAr: [
      'صوّر السطح العلوي والسفلي للورقة في ضوء طبيعي ومن دون فلاش.',
      'صوّر الورقة كاملة مع لقطة قريبة للعلامة، ثم صوّر عدة أوراق من نفس الشجرة.',
      'سجّل عمر النموات، ومكان الإصابة على الشجرة، وتاريخ ظهور الأعراض.'
    ],
    visionSignatures: {
      dominantHues: [],
      spotTexture: 'scattered_dots',
      targetPart: 'leaf'
    }
  };

  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = 120;
  thumbnailCanvas.height = 120;
  const thumbnailContext = thumbnailCanvas.getContext('2d');
  if (thumbnailContext) {
    thumbnailContext.fillStyle = '#171717';
    thumbnailContext.fillRect(0, 0, 120, 120);
    const thumbScale = Math.min(120 / sourceWidth, 120 / sourceHeight);
    const thumbWidth = sourceWidth * thumbScale;
    const thumbHeight = sourceHeight * thumbScale;
    thumbnailContext.drawImage(img, (120 - thumbWidth) / 2, (120 - thumbHeight) / 2, thumbWidth, thumbHeight);
  }

  return {
    id: 'scan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    timestamp: Date.now(),
    imageThumbnail: thumbnailCanvas.toDataURL('image/jpeg', 0.72),
    crop,
    diseaseOrPest: disease,
    confidence: 0,
    severity: 'low',
    diagnosticStatus: quality.isUsable ? 'screening_only' : 'insufficient_image',
    screeningNotesAr: notes,
    analysisData: {
      greenHealthIndex: Math.round(metrics.greenPercent),
      lesionSpotAreaPercentage: Math.min(100, Math.round(metrics.brownPercent + metrics.darkPercent)),
      chlorosisPercentage: Math.round(metrics.yellowPercent),
      necrosisPercentage: Math.round(metrics.brownPercent),
      powderyPercentage: 0,
      rustPercentage: 0,
      detectedHueSummary: observedPatterns.join(' '),
      leafContoursDetected: metrics.leafCoverage >= 4,
      boundingBoxes: []
    }
  };
}

function loadImageElement(source: HTMLImageElement | HTMLCanvasElement | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
      if (source.complete && source.naturalWidth > 0) resolve(source);
      else {
        source.onload = () => resolve(source);
        source.onerror = () => reject(new Error('تعذر تحميل الصورة.'));
      }
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
    if (typeof source === 'string') {
      image.src = source;
    } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
      image.src = source.toDataURL('image/jpeg', 0.88);
    } else {
      reject(new Error('نوع الصورة غير مدعوم.'));
    }
  });
}
