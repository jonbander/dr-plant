import { Crop, DiseasePest, ScanResult } from '../types/crop';
import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { analyzeLeafPixels, evaluateImageQuality } from './leafScreening';
import { classifyPlantDiseaseWithOnnx } from './onnxDiseaseClassifier';

export interface AnalysisInput {
  imageSource: HTMLImageElement | HTMLCanvasElement | string;
  suggestedCropId?: string;
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

function createScanId(): string {
  return 'scan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function createThumbnail(img: HTMLImageElement, sourceWidth: number, sourceHeight: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#171717';
    context.fillRect(0, 0, 120, 120);
    const scale = Math.min(120 / sourceWidth, 120 / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    context.drawImage(img, (120 - width) / 2, (120 - height) / 2, width, height);
  }
  return canvas.toDataURL('image/jpeg', 0.72);
}

function createModelPlaceholder(cropId: string, uncertain: boolean, label?: string): DiseasePest {
  const resultName = uncertain ? 'نتيجة النموذج غير حاسمة' : (label || 'اشتباه بصري ضمن فئات النموذج');
  return {
    id: uncertain ? 'model_result_uncertain' : 'model_experimental_candidate',
    nameAr: resultName,
    nameEn: uncertain ? 'Uncertain model result' : 'Experimental model candidate',
    scientificName: 'غير مؤكد — يلزم تحقق مختص',
    category: 'undetermined',
    severity: 'low',
    targetCropIds: [cropId],
    visualSymptomsAr: [uncertain
      ? 'لم تبلغ درجات النموذج العتبة التجريبية المطلوبة؛ لا يمكن ترجيح فئة بعينها.'
      : 'هذه الفئة هي الأقرب بين الفئات التي تدرب عليها النموذج فقط، وليست تشخيصاً مؤكداً.'],
    descriptionAr: uncertain
      ? 'النموذج التجريبي لم يصل إلى درجة كافية لترجيح إحدى فئاته. أعد التصوير أو اطلب مراجعة مختص.'
      : 'نتيجة فرز بصري تجريبية. قد تتشابه الأعراض مع أمراض أو آفات أو اضطرابات غير موجودة في بيانات التدريب؛ لا تعتمد عليها وحدها لتحديد المرض أو العلاج.',
    favorableConditionsAr: 'غير متاح؛ هذه نتيجة نموذج بصري تجريبي وليست تشخيصاً زراعياً.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [],
    identificationTipsAr: [
      'صوّر وجهي الورقة في ضوء طبيعي مع لقطة قريبة وأخرى للنبات كاملاً.',
      'قارن عدة أوراق من النبات نفسه وسجّل وقت ظهور الأعراض والظروف الجوية.',
      'اعرض النتيجة والصور على مهندس زراعي قبل اتخاذ أي إجراء علاجي.'
    ],
    visionSignatures: { dominantHues: [], spotTexture: 'scattered_dots', targetPart: 'leaf' }
  };
}

function toAnalysisData(metrics: ReturnType<typeof analyzeLeafPixels>, observedPatterns: string[]) {
  return {
    greenHealthIndex: Math.round(metrics.greenPercent),
    lesionSpotAreaPercentage: Math.min(100, Math.round(metrics.brownPercent + metrics.darkPercent)),
    chlorosisPercentage: Math.round(metrics.yellowPercent),
    necrosisPercentage: Math.round(metrics.brownPercent),
    powderyPercentage: 0,
    rustPercentage: 0,
    detectedHueSummary: observedPatterns.join(' '),
    leafContoursDetected: metrics.leafCoverage >= 4,
    boundingBoxes: []
  };
}

/**
 * When a supported crop is selected, the app routes to its corresponding experimental ONNX model.
 * Unsupported crops retain color screening only. No model result is an expert diagnosis.
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
  const quality = evaluateImageQuality(width, height, metrics);
  const selectedCrop = input.suggestedCropId && input.suggestedCropId !== 'auto'
    ? CROPS_DATABASE.find(crop => crop.id === input.suggestedCropId)
    : undefined;
  const crop = selectedCrop || UNKNOWN_CROP;
  const thumbnail = createThumbnail(img, sourceWidth, sourceHeight);

  const observedPatterns: string[] = [];
  if (metrics.yellowPercent >= 5) observedPatterns.push('توجد نسبة ملحوظة من البكسلات الصفراء ضمن المنطقة الخضراء المقدّرة؛ قد تتوافق مع اصفرار أو تغير لون.');
  if (metrics.brownPercent >= 4) observedPatterns.push('توجد بكسلات بنية/باهتة ضمن المنطقة النباتية المقدّرة؛ يلزم فحص شكل البقع وحدودها.');
  if (metrics.darkPercent >= 3) observedPatterns.push('توجد مناطق داكنة؛ لا يمكن تمييز النخر عن الظلال أو آثار التصوير بهذه الطريقة.');
  if (observedPatterns.length === 0) observedPatterns.push('لم تُرصد تغيرات لونية قوية وفق العتبات البسيطة؛ هذا لا يثبت أن النبات سليم.');

  const notes = [...quality.warnings];
  if (quality.isUsable && selectedCrop) {
    const modelResult = await classifyPlantDiseaseWithOnnx(img, selectedCrop.id);
    if (modelResult.status === 'possible_match' || modelResult.status === 'unsure') {
      const disease = modelResult.diseaseId
        ? DISEASES_DATABASE.find(item => item.id === modelResult.diseaseId && item.targetCropIds.includes(selectedCrop.id))
        : undefined;
      const diseaseOrPest = disease
        ? { ...disease, nameAr: modelResult.label || disease.nameAr, nameEn: 'Experimental visual model candidate' }
        : createModelPlaceholder(selectedCrop.id, modelResult.status === 'unsure', modelResult.label);
      const modelNotes = [
        `النموذج المستخدم: ${modelResult.modelVersion || 'إصدار تجريبي غير محدد'}.`,
        'الفئات المتاحة تختلف حسب المحصول؛ الأمراض غير الموجودة في بيانات النموذج لا يمكنه اكتشافها.',
        'درجة النموذج خام وغير معايرة، وليست نسبة احتمال أو دقة تشخيصية.',
        modelResult.message,
        'لا تستخدم النتيجة لاختيار مبيد أو جرعة أو علاج؛ يلزم التحقق الحقلي أو مراجعة مختص.'
      ];
      return {
        id: createScanId(),
        timestamp: Date.now(),
        imageThumbnail: thumbnail,
        crop,
        diseaseOrPest,
        confidence: 0,
        modelScore: typeof modelResult.score === 'number' ? Math.round(modelResult.score * 100) : undefined,
        modelVersion: modelResult.modelVersion,
        severity: diseaseOrPest.severity,
        diagnosticStatus: 'model_screening',
        screeningNotesAr: modelNotes,
        analysisData: toAnalysisData(metrics, observedPatterns)
      };
    }
    if (modelResult.status !== 'unsupported_crop' && modelResult.status !== 'disabled') {
      notes.push(`لم تكتمل نتيجة النموذج؛ عُرض فحص الألوان فقط. ${modelResult.message}`);
    } else {
      notes.push('لا يتوفر حالياً نموذج مدرّب لهذا المحصول؛ النتيجة تقتصر على مؤشرات الألوان ولا تحدد المرض.');
    }
  } else if (!quality.isUsable) {
    notes.push('الصورة لم تجتز شروط الجودة؛ لم يتم تشغيل النموذج العصبي.');
  } else {
    notes.push('اختر المحصول أولاً لتحديد ما إذا كان له نموذج تجريبي متاح.');
  }

  notes.push('هذا تحليل ألوان ومساحة خضراء تقريبي، وليس نموذجاً مدرّباً لتحديد الأمراض أو الآفات لهذا المحصول.');
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

  return {
    id: createScanId(),
    timestamp: Date.now(),
    imageThumbnail: thumbnail,
    crop,
    diseaseOrPest: disease,
    confidence: 0,
    severity: 'low',
    diagnosticStatus: quality.isUsable ? 'screening_only' : 'insufficient_image',
    screeningNotesAr: notes,
    analysisData: toAnalysisData(metrics, observedPatterns)
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
      const svgPrefix = 'data:image/svg+xml;utf8,';
      image.src = source.startsWith(svgPrefix)
        ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source.slice(svgPrefix.length))
        : source;
    } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
      image.src = source.toDataURL('image/jpeg', 0.88);
    } else {
      reject(new Error('نوع الصورة غير مدعوم.'));
    }
  });
}
