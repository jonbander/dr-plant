import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { evaluateImageQuality, analyzeLeafPixels } from './leafScreening';

export type ModelReviewStatus = 'candidate' | 'validated';

export interface OnnxClassLabel {
  id: string;
  labelAr: string;
  cropId: string;
  diseaseId?: string;
  healthy?: boolean;
  experimentalOnly?: boolean;
}

export interface OnnxModelManifest {
  schemaVersion: 1;
  enabled: boolean;
  modelPath: string;
  labelsPath: string;
  inputSize: number;
  inputLayout: 'NCHW' | 'NHWC';
  channelOrder: 'RGB';
  normalization: 'zero_to_one' | 'image_net';
  resizeMode: 'center_crop' | 'stretch';
  outputKind: 'logits' | 'probabilities';
  reviewStatus: ModelReviewStatus;
  thresholdsReviewed?: boolean;
  pilotMode?: boolean;
  minimumScore?: number;
  /** @deprecated Use minimumScore; scores are not calibrated probabilities. */
  minimumProbability?: number;
  minimumMargin?: number;
  modelVersion?: string;
  expectedOutputCount?: number;
  source?: string;
  license?: string;
  validationReportPath?: string;
}

interface OrtTensor {
  data: ArrayLike<number>;
  dims?: readonly number[];
}

interface OrtSession {
  inputNames: string[];
  outputNames: string[];
  run(feeds: Record<string, unknown>): Promise<Record<string, OrtTensor>>;
}

interface OrtRuntime {
  env: { wasm: { wasmPaths: string | { mjs?: string; wasm?: string }; numThreads?: number } };
  InferenceSession: {
    create(path: string, options: Record<string, unknown>): Promise<OrtSession>;
  };
  Tensor: new (type: 'float32', data: Float32Array, dims: number[]) => unknown;
}

declare global {
  interface Window {
    ort?: OrtRuntime;
  }
}

export type OnnxClassificationResult =
  | { status: 'disabled' | 'model_unavailable' | 'needs_crop' | 'unsupported_crop' | 'bad_image' | 'unsure' | 'candidate_only' | 'model_error'; message: string; label?: string; diseaseId?: string; cropId?: string; score?: number; modelVersion?: string }
  | { status: 'possible_match'; message: string; label: string; diseaseId?: string; cropId: string; score: number; modelVersion?: string };

interface OnnxModelBundle {
  schemaVersion: 1;
  enabled: boolean;
  routes?: Record<string, { model: OnnxModelManifest }>;
}

let runtimePromise: Promise<OrtRuntime> | null = null;
const sessionPromises = new Map<string, Promise<OrtSession>>();
let manifestPromise: Promise<OnnxModelBundle> | null = null;
const labelsPromises = new Map<string, Promise<OnnxClassLabel[]>>();

export function stableSoftmax(values: ArrayLike<number>): number[] {
  if (values.length === 0) throw new Error('لا توجد درجات خرج من النموذج.');
  const max = Math.max(...Array.from(values));
  const exponentials = Array.from(values, value => Math.exp(value - max));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) throw new Error('خرج النموذج غير صالح.');
  return exponentials.map(value => value / total);
}

export function chooseCropScopedClass(
  scores: number[],
  classes: OnnxClassLabel[],
  cropId: string | undefined,
  manifest: OnnxModelManifest
): OnnxClassificationResult {
  if (!cropId || cropId === 'auto') {
    return { status: 'needs_crop', message: 'اختر نوع المحصول أولاً؛ هذا النموذج لا يتعرف على نوع النبات تلقائياً.' };
  }

  const crop = CROPS_DATABASE.find(item => item.id === cropId);
  if (!crop) return { status: 'unsupported_crop', message: 'المحصول المحدد غير موجود في قاعدة بيانات التطبيق.' };

  const eligible = classes
    .map((item, index) => ({ item, score: scores[index] }))
    .filter(({ item }) => item.cropId === cropId)
    .filter(({ item }) => item.experimentalOnly === true || item.healthy || Boolean(item.diseaseId && DISEASES_DATABASE.some(disease =>
      disease.id === item.diseaseId && disease.targetCropIds.includes(cropId)
    )))
    .sort((a, b) => b.score - a.score);

  if (eligible.length === 0) {
    return { status: 'unsupported_crop', message: 'لا توجد فئات مرضية مراجعة لهذا المحصول في النموذج الحالي.' };
  }

  const isPilot = manifest.reviewStatus === 'candidate' && manifest.pilotMode === true;
  const minimumScore = manifest.minimumScore ?? manifest.minimumProbability;
  const hasReviewedThresholds = manifest.thresholdsReviewed === true &&
    typeof minimumScore === 'number' && typeof manifest.minimumMargin === 'number' &&
    Boolean(manifest.validationReportPath);

  if ((!isPilot && manifest.reviewStatus !== 'validated') || !hasReviewedThresholds) {
    return {
      status: 'candidate_only',
      message: 'النموذج متاح للاختبار البحثي فقط؛ لم تُعتمد بوابة التشغيل التجريبي لهذا الإصدار.'
    };
  }

  const globalWinner = classes[scores.indexOf(Math.max(...scores))];
  if (globalWinner && globalWinner.cropId !== cropId) {
    return { status: 'unsure', message: 'الصورة لا تطابق بوضوح فئات المحصول المحدد؛ تحقق من اختيار المحصول وأعد التصوير.', score: Math.max(...scores), cropId, modelVersion: manifest.modelVersion };
  }

  const first = eligible[0];
  const secondScore = eligible[1]?.score ?? 0;
  const scoreThreshold = minimumScore ?? 1;
  const minimumMargin = manifest.minimumMargin ?? 1;
  const margin = first.score - secondScore;
  if (first.score < scoreThreshold || margin < minimumMargin) {
    return {
      status: 'unsure',
      message: 'درجة النموذج غير كافية لتقديم نتيجة؛ أعد التصوير أو اطلب مراجعة مختص.',
      score: first.score,
      cropId,
      modelVersion: manifest.modelVersion
    };
  }

  if (first.item.healthy) {
    return {
      status: 'possible_match',
      label: 'لم يرصد النموذج مرضاً واضحاً ضمن الفئات التي تدرب عليها فقط',
      cropId,
      score: first.score,
      modelVersion: manifest.modelVersion,
      message: 'هذه ليست شهادة سلامة للنبات؛ النموذج لا يفحص إلا الفئات المسجلة في هذا الإصدار وقد يفوته مرض أو آفة أو نقص عناصر آخر.'
    };
  }

  return {
    status: 'possible_match',
    label: first.item.labelAr,
    diseaseId: first.item.diseaseId,
    cropId,
    score: first.score,
    modelVersion: manifest.modelVersion,
    message: isPilot
      ? 'اشتباه بصري تجريبي فقط ضمن فئات هذا النموذج؛ لا يثبت المرض أو يحدد المسبب، ويحتاج إلى تحقق حقلي.'
      : 'اشتباه آلي أولي يحتاج إلى مطابقة الأعراض وفحص ميداني؛ لا تستخدمه لاختيار علاج أو مبيد.'
  };
}

async function loadRoute(cropId: string): Promise<{ manifest: OnnxModelManifest; labels: OnnxClassLabel[] } | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(new URL('models/plant-disease/manifest.json', import.meta.env.BASE_URL)).then(async response => {
      if (!response.ok) throw new Error('تعذر تحميل إعدادات نماذج ONNX.');
      return response.json() as Promise<OnnxModelBundle>;
    });
  }
  const bundle = await manifestPromise;
  if (bundle.schemaVersion !== 1) throw new Error('إصدار حزمة النماذج غير مدعوم.');
  if (!bundle.enabled) return null;
  const route = bundle.routes?.[cropId];
  if (!route?.model?.enabled) return null;
  const manifest = route.model;
  if (manifest.schemaVersion !== 1 || manifest.channelOrder !== 'RGB' || !['center_crop', 'stretch'].includes(manifest.resizeMode)) {
    throw new Error('إعدادات النموذج لا تطابق إصدار محرك الفحص.');
  }
  let labelsPromise = labelsPromises.get(manifest.labelsPath);
  if (!labelsPromise) {
    labelsPromise = fetch(new URL(manifest.labelsPath, import.meta.env.BASE_URL)).then(async response => {
      if (!response.ok) throw new Error('تعذر تحميل تسميات النموذج.');
      const data = await response.json() as OnnxClassLabel[];
      if (!Array.isArray(data) || data.some(item => !item.id || !item.labelAr || !item.cropId)) {
        throw new Error('ملف التسميات لا يطابق البنية المطلوبة.');
      }
      return data;
    });
    labelsPromises.set(manifest.labelsPath, labelsPromise);
  }
  const labels = await labelsPromise;
  if (manifest.expectedOutputCount !== undefined && labels.length !== manifest.expectedOutputCount) {
    throw new Error('عدد التسميات لا يطابق عدد مخارج النموذج المسجل.');
  }
  return { manifest, labels };
}

async function loadRuntime(): Promise<OrtRuntime> {
  if (window.ort) return window.ort;
  if (!runtimePromise) {
    runtimePromise = new Promise<OrtRuntime>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('vendor/onnxruntime/ort.min.js', import.meta.env.BASE_URL).toString();
      script.async = true;
      script.onload = () => window.ort
        ? resolve(window.ort)
        : reject(new Error('تم تحميل ONNX Runtime لكن واجهة ort غير متاحة.'));
      script.onerror = () => reject(new Error('ملفات ONNX Runtime غير موجودة محلياً.'));
      document.head.appendChild(script);
    });
  }
  return runtimePromise;
}

async function loadSession(manifest: OnnxModelManifest): Promise<OrtSession> {
  const key = manifest.modelPath;
  let pending = sessionPromises.get(key);
  if (!pending) {
    pending = loadRuntime().then(async ort => {
      ort.env.wasm.wasmPaths = {
        mjs: new URL('vendor/onnxruntime/ort-wasm-simd-threaded.mjs', import.meta.env.BASE_URL).toString(),
        wasm: new URL('vendor/onnxruntime/ort-wasm-simd-threaded.wasm', import.meta.env.BASE_URL).toString()
      };
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(new URL(manifest.modelPath, import.meta.env.BASE_URL).toString(), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
    });
    sessionPromises.set(key, pending);
  }
  return pending;
}

function prepareInput(image: HTMLImageElement, manifest: OnnxModelManifest, ort: OrtRuntime): unknown {
  const size = manifest.inputSize;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) throw new Error('الصورة فارغة أو لم يتم تحميلها.');

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('تعذر تجهيز الصورة للنموذج.');

  if (manifest.resizeMode === 'stretch') {
    context.drawImage(image, 0, 0, size, size);
  } else {
    const scale = size / Math.min(sourceWidth, sourceHeight);
    const scaledWidth = Math.round(sourceWidth * scale);
    const scaledHeight = Math.round(sourceHeight * scale);
    context.drawImage(image, (size - scaledWidth) / 2, (size - scaledHeight) / 2, scaledWidth, scaledHeight);
  }
  const pixels = context.getImageData(0, 0, size, size).data;
  const plane = size * size;
  const channels = [new Float32Array(plane), new Float32Array(plane), new Float32Array(plane)];
  const mean = [0.485, 0.456, 0.406];
  const std = [0.229, 0.224, 0.225];

  for (let index = 0; index < plane; index++) {
    for (let channel = 0; channel < 3; channel++) {
      const value = pixels[index * 4 + channel] / 255;
      channels[channel][index] = manifest.normalization === 'image_net'
        ? (value - mean[channel]) / std[channel]
        : value;
    }
  }

  const data = new Float32Array(plane * 3);
  if (manifest.inputLayout === 'NCHW') {
    channels.forEach((channel, index) => data.set(channel, index * plane));
    return new ort.Tensor('float32', data, [1, 3, size, size]);
  }

  for (let pixel = 0; pixel < plane; pixel++) {
    data[pixel * 3] = channels[0][pixel];
    data[pixel * 3 + 1] = channels[1][pixel];
    data[pixel * 3 + 2] = channels[2][pixel];
  }
  return new ort.Tensor('float32', data, [1, size, size, 3]);
}

export async function classifyPlantDiseaseWithOnnx(
  image: HTMLImageElement,
  cropId?: string
): Promise<OnnxClassificationResult> {
  try {
    if (!cropId || cropId === 'auto') return { status: 'needs_crop', message: 'اختر نوع المحصول أولاً؛ لا يستنتج التطبيق نوع النبات تلقائياً.' };
    const crop = CROPS_DATABASE.find(item => item.id === cropId);
    if (!crop) return { status: 'unsupported_crop', message: 'المحصول المحدد غير موجود في قاعدة بيانات التطبيق.' };
    const loadedRoute = await loadRoute(cropId);
    if (!loadedRoute) return { status: 'unsupported_crop', message: 'لا يوجد نموذج تجريبي مفعّل لهذا المحصول؛ سيُعرض فحص الألوان فقط.' };
    const { manifest, labels: classes } = loadedRoute;
    if (!classes.some(item => item.cropId === cropId)) {
      return { status: 'unsupported_crop', message: 'لا توجد فئات مدرّبة لهذا المحصول في النموذج الحالي.' };
    }

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return { status: 'bad_image', message: 'الصورة فارغة أو غير صالحة.' };
    const probeScale = Math.min(1, 320 / Math.max(width, height));
    const probe = document.createElement('canvas');
    probe.width = Math.max(1, Math.round(width * probeScale));
    probe.height = Math.max(1, Math.round(height * probeScale));
    const probeContext = probe.getContext('2d', { willReadFrequently: true });
    if (!probeContext) return { status: 'bad_image', message: 'تعذر فحص جودة الصورة.' };
    probeContext.drawImage(image, 0, 0, probe.width, probe.height);
    const metrics = analyzeLeafPixels(probeContext.getImageData(0, 0, probe.width, probe.height).data, probe.width, probe.height);
    const quality = evaluateImageQuality(probe.width, probe.height, metrics);
    if (!quality.isUsable) return { status: 'bad_image', message: quality.warnings.join(' ') };

    const [ort, session] = await Promise.all([loadRuntime(), loadSession(manifest)]);
    if (classes.length === 0) return { status: 'model_error', message: 'ملف تسميات النموذج فارغ.' };
    const tensor = prepareInput(image, manifest, ort);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputTensor = output[session.outputNames[0]];
    if (!outputTensor || outputTensor.data.length !== classes.length) {
      return { status: 'model_error', message: 'عدد مخارج النموذج لا يطابق عدد الفئات.' };
    }
    const scores = manifest.outputKind === 'logits'
      ? stableSoftmax(outputTensor.data)
      : Array.from(outputTensor.data, value => Number(value));
    if (scores.some(value => !Number.isFinite(value) || value < 0) ||
        (manifest.outputKind === 'probabilities' && Math.abs(scores.reduce((sum, value) => sum + value, 0) - 1) > 0.02)) {
      return { status: 'model_error', message: 'خرج النموذج يحتوي قيماً غير صالحة أو احتمالات لا مجموع لها يساوي 1.' };
    }
    return chooseCropScopedClass(scores, classes, cropId, manifest);
  } catch (error) {
    console.error('ONNX disease classification failed:', error);
    const message = error instanceof Error ? error.message : 'تعذر تشغيل نموذج ONNX.';
    return { status: 'model_unavailable', message };
  }
}

/** Clears cached runtime/session state after a model bundle is replaced. */
export function resetOnnxDiseaseClassifier(): void {
  runtimePromise = null;
  sessionPromises.clear();
  labelsPromises.clear();
  manifestPromise = null;
}
