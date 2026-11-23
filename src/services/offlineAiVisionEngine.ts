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

function createModelPlaceholder(cropId: string, uncertain: boolean): DiseasePest {
  return {
    id: uncertain ? 'model_result_uncertain' : 'model_no_esca_pattern_detected',
    nameAr: uncertain ? 'نتيجة النموذج غير حاسمة' : 'لم يرصد النموذج نمطاً واضحاً متوافقاً مع Esca',
    nameEn: uncertain ? 'Uncertain model result' : 'No clear Esca-like pattern detected',
    scientificName: 'غير منطبق',
    category: 'undetermined',
    severity: 'low',
    targetCropIds: [cropId],
    visualSymptomsAr: [
      uncertain
        ? 'درجة النموذج لم تبلغ عتبة العرض؛ لا يمكن استنتاج وجود Esca أو غيابه.'
        : 'عدم رصد نمط Esca لا يعني أن الورقة سليمة، ولا يستبعد وجود مرض آخر.'
    ],
    descriptionAr: uncertain
      ? 'النموذج التجريبي لم يصل إلى درجة كافية لترجيح إحدى فئتيه. أعد التصوير أو اعرض العينة على مختص.'
      : 'النموذج لم يرصد نمطاً ورقياً قوياً متوافقاً مع Esca ضمن الفئتين اللتين تدرب عليهما. لا يفحص هذا النموذج بقية أمراض العنب أو الآفات أو نقص العناصر؛ لذلك لا تُفسّر النتيجة على أنها ورقة سليمة.',
    favorableConditionsAr: 'غير متاح؛ هذه نتيجة فرز بصري آلي وليست تشخيصاً زراعياً.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [],
    identificationTipsAr: [
      'افحص وجهي الورقة وعدة أوراق من الكرمة نفسها، ولا تعتمد على صورة واحدة.',
      'إذا ظهرت تخططات أو نخور، افحص الأفرع والخشب مع مهندس زراعي؛ أعراض أمراض الخشب قد تتشابه.',
      'النموذج الحالي لا يميّز البياض الزغبي أو الدقيقي أو العفن الأسود أو الأكاروس أو نقص العناصر.'
    ],
    visionSignatures: {
      dominantHues: [],
      spotTexture: 'scattered_dots',
      targetPart: 'leaf'
    }
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
 * The default workflow remains coarse color screening. When the user explicitly
 * selects French grape leaves, a limited Esca-vs-Healthy ONNX pilot is attempted.
 * The pilot never labels the leaf healthy and never recommends a treatment.
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
  if (quality.isUsable && selectedCrop?.id === 'french_grape_leaf') {
    const modelResult = await classifyPlantDiseaseWithOnnx(img, selectedCrop.id);
    if (modelResult.status === 'possible_match' || modelResult.status === 'unsure') {
      const disease = modelResult.diseaseId
        ? DISEASES_DATABASE.find(item => item.id === modelResult.diseaseId && item.targetCropIds.includes(selectedCrop.id))
        : undefined;
      const diseaseOrPest = disease
        ? { ...disease, nameAr: modelResult.label || 'النمط البصري أقرب إلى فئة Esca في النموذج', nameEn: 'Esca-like leaf pattern (experimental model)' }
        : createModelPlaceholder(selectedCrop.id, modelResult.status === 'unsure');
      const modelNotes = [
        'هذا نموذج تجريبي محدود لورق العنب: Esca مقابل فئة Healthy فقط؛ لا يتعرف على بقية أمراض العنب أو الآفات أو نقص العناصر.',
        'تدرب النموذج على صور من مزارع في ولاية ماهاراشترا بالهند؛ لم يُختبر ميدانياً على الساحل السوري.',
        'درجة النموذج المعروضة خام وغير معايرة؛ ليست احتمالاً طبياً أو نسبة موثوقية تشخيصية.',
        modelResult.message,
        'عدم رصد Esca لا يعني أن الورقة سليمة. لا تستخدم النتيجة لاختيار مبيد أو علاج.'
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
    if (modelResult.status !== 'disabled' && modelResult.status !== 'unsupported_crop') {
      notes.push(`تعذر تقديم نتيجة نموذجية؛ عُرض فحص الألوان فقط. ${modelResult.message}`);
    }
  } else if (selectedCrop?.id !== 'french_grape_leaf') {
    notes.push('النموذج العصبي التجريبي الحالي مخصص لفرز نمط Esca في ورق العنب فقط؛ هذا الفحص للمحصول المحدد يعتمد على مؤشرات الألوان البسيطة.');
  } else {
    notes.push('الصورة لم تجتز شروط الجودة؛ لم يُشغّل نموذج Esca التجريبي.');
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
      image.src = source;
    } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
      image.src = source.toDataURL('image/jpeg', 0.88);
    } else {
      reject(new Error('نوع الصورة غير مدعوم.'));
    }
  });
}
