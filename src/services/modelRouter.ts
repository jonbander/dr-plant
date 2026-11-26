import type { Crop } from '../types/crop';

export type EvidenceStatus = 'reference_only' | 'suspected' | 'reported' | 'expert_confirmed';
export type ModelLifecycle = 'disabled' | 'research_only' | 'production_candidate';
export type CropContext = 'unknown' | 'citrus' | 'lemon' | 'grape';

export interface ModelRoute {
  id: string;
  displayName: string;
  cropIds: readonly string[];
  context: CropContext;
  classCount: number;
  inputSize: number;
  resizeMode: 'stretch' | 'center_crop';
  artifactPath: string;
  lifecycle: ModelLifecycle;
  evidenceStatus: EvidenceStatus;
  supportsBrowserOnnx: boolean;
  externalDataPath?: string;
  limitations: readonly string[];
}

export interface RouteRequest {
  crop: Crop | undefined;
  context?: CropContext;
  allowResearchModels?: boolean;
}

export interface RouteDecision {
  status: 'selected' | 'unknown_crop' | 'unsupported_crop' | 'research_blocked';
  primary?: ModelRoute;
  alternatives: ModelRoute[];
  reason: string;
}

/**
 * Registry of immutable specialists. It is intentionally data-only: the router
 * never averages logits, weights, or metrics from different label spaces.
 */
export const MODEL_ROUTES: readonly ModelRoute[] = [
  {
    id: 'plantvillage-full-v2',
    displayName: 'PlantVillage V2 multicrop',
    cropIds: ['french_grape_leaf', 'citrus_syrian'],
    context: 'unknown',
    classCount: 38,
    inputSize: 128,
    resizeMode: 'stretch',
    artifactPath: '/models/plant-disease/plantvillage-full-multicrop-v2.onnx',
    lifecycle: 'research_only',
    evidenceStatus: 'reference_only',
    supportsBrowserOnnx: true,
    limitations: ['Controlled-source PlantVillage data; no Syrian coastal field validation.']
  },
  {
    id: 'lemon-v3',
    displayName: 'Lemon V3 specialist',
    cropIds: ['citrus_syrian'],
    context: 'lemon',
    classCount: 18,
    inputSize: 128,
    resizeMode: 'stretch',
    artifactPath: '/models/plant-disease/lemon-v3.onnx',
    lifecycle: 'research_only',
    evidenceStatus: 'reference_only',
    supportsBrowserOnnx: true,
    limitations: ['Bangladesh image-level split; not independent by orchard or session.']
  },
  {
    id: 'citrus-field-v3',
    displayName: 'Citrus Field V3 specialist',
    cropIds: ['citrus_syrian'],
    context: 'citrus',
    classCount: 4,
    inputSize: 160,
    resizeMode: 'stretch',
    artifactPath: '/models/plant-disease/citrus-field-v3.onnx',
    lifecycle: 'research_only',
    evidenceStatus: 'reference_only',
    supportsBrowserOnnx: true,
    limitations: ['One Moroccan orchard/campaign; labels include symptom-like categories.']
  }
];

export function selectModelRoute(request: RouteRequest): RouteDecision {
  if (!request.crop || request.crop.id === 'unknown_crop') {
    return {
      status: 'unknown_crop',
      alternatives: [],
      reason: 'لا يمكن اختيار نموذج متخصص قبل تحديد نوع المحصول؛ لا يستنتج الموجّه المحصول من اللون وحده.'
    };
  }
  const candidates = MODEL_ROUTES.filter(route => route.cropIds.includes(request.crop!.id));
  if (candidates.length === 0) {
    return {
      status: 'unsupported_crop',
      alternatives: [],
      reason: 'لا يوجد نموذج متخصص مسجل لهذا المحصول؛ سيستمر الفحص البصري المحدود فقط.'
    };
  }
  const context = request.context ?? 'unknown';
  const ordered = [...candidates].sort((a, b) => {
    const aExact = a.context === context ? 0 : 1;
    const bExact = b.context === context ? 0 : 1;
    return aExact - bExact;
  });
  const primary = ordered[0];
  if (primary.lifecycle === 'research_only' && !request.allowResearchModels) {
    return {
      status: 'research_blocked',
      alternatives: ordered,
      reason: 'النماذج المتاحة بحثية فقط ولم تجتز بوابة الاعتماد الحقلي؛ لم يتم تشغيلها في الإنتاج.'
    };
  }
  return {
    status: 'selected',
    primary,
    alternatives: ordered.slice(1),
    reason: `تم اختيار ${primary.displayName} دون دمج مخرجات نماذج ذات تصنيفات مختلفة.`
  };
}
