import { CROPS_DATABASE, DISEASES_DATABASE } from '../data/cropsAndDiseases';
import { evaluateImageQuality, analyzeLeafPixels } from './leafScreening';
import type { ModelRoute } from './modelRouter';

export type ModelReviewStatus = 'candidate' | 'validated';

export interface OnnxClassLabel {
  id: string;
  labelAr: string;
  cropId: string;
  diseaseId?: string;
  healthy?: boolean;
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
  resizeMode: 'stretch' | 'center_crop';
  outputKind: 'logits' | 'probabilities';
  reviewStatus: ModelReviewStatus;
  thresholdsReviewed?: boolean;
  minimumProbability?: number;
  minimumMargin?: number;
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
  env: { wasm: { wasmPaths: string; numThreads?: number } };
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
  | { status: 'disabled' | 'model_unavailable' | 'needs_crop' | 'unsupported_crop' | 'bad_image' | 'unsure' | 'candidate_only' | 'model_error'; message: string; label?: string; diseaseId?: string; cropId?: string }
  | { status: 'possible_match'; message: string; label: string; diseaseId?: string; cropId: string };

let runtimePromise: Promise<OrtRuntime> | null = null;
const sessionPromises = new Map<string, Promise<OrtSession>>();
const manifestPromises = new Map<string, Promise<OnnxModelManifest>>();
const labelsPromises = new Map<string, Promise<OnnxClassLabel[]>>();

export function validateOnnxModelManifest(value: unknown): value is OnnxModelManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<OnnxModelManifest>;
  return manifest.schemaVersion === 1 &&
    typeof manifest.enabled === 'boolean' &&
    typeof manifest.modelPath === 'string' && manifest.modelPath.startsWith('/') &&
    typeof manifest.labelsPath === 'string' && manifest.labelsPath.startsWith('/') &&
    Number.isInteger(manifest.inputSize) && Number(manifest.inputSize) > 0 &&
    (manifest.inputLayout === 'NCHW' || manifest.inputLayout === 'NHWC') &&
    manifest.channelOrder === 'RGB' &&
    (manifest.normalization === 'zero_to_one' || manifest.normalization === 'image_net') &&
    (manifest.resizeMode === 'stretch' || manifest.resizeMode === 'center_crop') &&
    (manifest.outputKind === 'logits' || manifest.outputKind === 'probabilities') &&
    (manifest.reviewStatus === 'candidate' || manifest.reviewStatus === 'validated');
}

export function validateRouteLabels(route: ModelRoute, classes: OnnxClassLabel[]): string | null {
  if (classes.length !== route.classCount) {
    return `عدد التسميات (${classes.length}) لا يطابق عقد النموذج (${route.classCount}).`;
  }
  if (new Set(classes.map(item => item.id)).size !== classes.length) {
    return 'ملف التسميات يحتوي معرفات مكررة.';
  }
  return null;
}

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
    .filter(({ item }) => item.healthy || Boolean(item.diseaseId && DISEASES_DATABASE.some(disease =>
      disease.id === item.diseaseId && disease.targetCropIds.includes(cropId)
    )))
    .sort((a, b) => b.score - a.score);

  if (eligible.length === 0) {
    return { status: 'unsupported_crop', message: 'لا توجد فئات مرضية مراجعة لهذا المحصول في النموذج الحالي.' };
  }

  if (manifest.reviewStatus !== 'validated' || manifest.thresholdsReviewed !== true ||
      typeof manifest.minimumProbability !== 'number' || typeof manifest.minimumMargin !== 'number' ||
      !manifest.validationReportPath) {
    return {
      status: 'candidate_only',
      message: 'النموذج متاح للاختبار البحثي فقط؛ لم تُعتمد معايرته واختباره المستقل على صور الحقول الساحلية.'
    };
  }

  const first = eligible[0];
  const secondScore = eligible[1]?.score ?? 0;
  const margin = first.score - secondScore;
  if (first.score < manifest.minimumProbability || margin < manifest.minimumMargin) {
    return { status: 'unsure', message: 'نتيجة النموذج غير حاسمة. لا يمكن تحديد مرض من هذه الصورة.' };
  }

  if (first.item.healthy) {
    return {
      status: 'possible_match',
      label: 'لم يرصد النموذج مرضاً من الفئات التي تدرب عليها',
      cropId,
      message: 'هذه النتيجة لا تثبت خلو النبات من المرض؛ قد تكون المشكلة غير موجودة ضمن فئات النموذج.'
    };
  }

  return {
    status: 'possible_match',
    label: first.item.labelAr,
    diseaseId: first.item.diseaseId,
    cropId,
    message: 'اشتباه آلي أولي يحتاج إلى مطابقة الأعراض وفحص ميداني؛ لا تستخدمه لاختيار علاج أو مبيد.'
  };
}

async function loadManifest(modelId: string, path: string): Promise<OnnxModelManifest> {
  let pending = manifestPromises.get(modelId);
  if (!pending) {
    pending = fetch(path).then(async response => {
      if (!response.ok) throw new Error('تعذر تحميل إعدادات نموذج ONNX.');
      return response.json() as Promise<OnnxModelManifest>;
    });
    manifestPromises.set(modelId, pending);
  }
  return pending;
}

async function loadLabels(modelId: string, path: string): Promise<OnnxClassLabel[]> {
  let pending = labelsPromises.get(modelId);
  if (!pending) {
    pending = fetch(path).then(async response => {
      if (!response.ok) throw new Error('تعذر تحميل تسميات النموذج.');
      const data = await response.json() as OnnxClassLabel[];
      if (!Array.isArray(data) || data.some(item => !item.id || !item.labelAr || !item.cropId)) {
        throw new Error('ملف التسميات لا يطابق البنية المطلوبة.');
      }
      return data;
    });
    labelsPromises.set(modelId, pending);
  }
  return pending;
}

async function loadRuntime(): Promise<OrtRuntime> {
  if (window.ort) return window.ort;
  if (!runtimePromise) {
    runtimePromise = new Promise<OrtRuntime>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/vendor/onnxruntime/ort.min.js';
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

async function loadSession(modelId: string, manifest: OnnxModelManifest): Promise<OrtSession> {
  let pending = sessionPromises.get(modelId);
  if (!pending) {
    pending = loadRuntime().then(async ort => {
      ort.env.wasm.wasmPaths = '/vendor/onnxruntime/';
      ort.env.wasm.numThreads = 1;
      return ort.InferenceSession.create(manifest.modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
    });
    sessionPromises.set(modelId, pending);
  }
  return pending;
}

export function getInputDrawRect(sourceWidth: number, sourceHeight: number, size: number, resizeMode: OnnxModelManifest['resizeMode']) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || size <= 0) throw new Error('أبعاد الصورة أو الإدخال غير صالحة.');
  if (resizeMode === 'stretch') return { x: 0, y: 0, width: size, height: size };
  const scale = size / Math.min(sourceWidth, sourceHeight);
  return { x: (size - sourceWidth * scale) / 2, y: (size - sourceHeight * scale) / 2, width: sourceWidth * scale, height: sourceHeight * scale };
}

function prepareInput(image: HTMLImageElement, manifest: OnnxModelManifest, ort: OrtRuntime): unknown {
  const size = manifest.inputSize;
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) throw new Error('الصورة فارغة أو لم يتم تحميلها.');

  const drawRect = getInputDrawRect(sourceWidth, sourceHeight, size, manifest.resizeMode);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('تعذر تجهيز الصورة للنموذج.');

  context.drawImage(
    image,
    drawRect.x,
    drawRect.y,
    drawRect.width,
    drawRect.height
  );
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
  cropId?: string,
  route?: ModelRoute
): Promise<OnnxClassificationResult> {
  try {
    const modelId = route?.id ?? 'production';
    if (route && (!route.runtimeManifestPath || !route.runtimeModelPath || !route.runtimeLabelsPath || route.labelMappingStatus !== 'verified')) {
      return {
        status: 'model_unavailable',
        message: `النموذج ${route.displayName} محجوب: لا توجد حزمة متصفح منشورة مع ربط تسميات متحقق إلى معرّفات التطبيق. الأصل البحثي محفوظ في ${route.artifactPath}.`
      };
    }
    const manifest = await loadManifest(modelId, route?.runtimeManifestPath ?? '/models/plant-disease/manifest.json');
    if (!manifest.enabled) return { status: 'disabled', message: 'نموذج الكشف العصبي غير مفعّل بعد.' };
    if (!validateOnnxModelManifest(manifest)) {
      return { status: 'model_error', message: 'إعدادات النموذج لا تطابق إصدار محرك الفحص.' };
    }
    const classes = await loadLabels(modelId, route?.runtimeLabelsPath ?? manifest.labelsPath);
    if (route) {
      const labelError = validateRouteLabels(route, classes);
      if (labelError) return { status: 'model_error', message: labelError };
    }
    if (!cropId || cropId === 'auto') return chooseCropScopedClass([], classes, cropId, manifest);

    const crop = CROPS_DATABASE.find(item => item.id === cropId);
    if (!crop) return { status: 'unsupported_crop', message: 'المحصول المحدد غير مدعوم.' };
    if (!classes.some(item => item.cropId === cropId)) {
      return { status: 'unsupported_crop', message: 'لا توجد فئات مدربة ومراجعة لهذا المحصول في النموذج الحالي.' };
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
    const quality = evaluateImageQuality(probe.width, probe.height, metrics, width, height);
    if (!quality.isUsable) return { status: 'bad_image', message: quality.warnings.join(' ') };

    const [ort, session] = await Promise.all([loadRuntime(), loadSession(modelId, manifest)]);
    if (classes.length === 0) {
      return { status: 'model_error', message: 'ملف تسميات النموذج فارغ.' };
    }
    const tensor = prepareInput(image, manifest, ort);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputTensor = output[session.outputNames[0]];
    if (!outputTensor || outputTensor.data.length !== classes.length ||
        (outputTensor.dims && (outputTensor.dims[outputTensor.dims.length - 1] !== classes.length ||
          outputTensor.dims.reduce((product, dimension) => product * dimension, 1) !== classes.length))) {
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
  manifestPromises.clear();
  labelsPromises.clear();
}
