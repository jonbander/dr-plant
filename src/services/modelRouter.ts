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
  labelsPath: string;
  externalDataPath?: string;
  /** Browser-served paths are intentionally absent until a compatible app bundle exists. */
  runtimeModelPath?: string;
  runtimeLabelsPath?: string;
  runtimeManifestPath?: string;
  labelMappingStatus: 'missing' | 'verified';
  lifecycle: ModelLifecycle;
  evidenceStatus: EvidenceStatus;
  supportsBrowserOnnx: boolean;
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

export interface ModelAssetContract {
  modelId: string;
  artifactPath: string;
  labelsPath: string;
  externalDataPath?: string;
  inputSize: number;
  resizeMode: ModelRoute['resizeMode'];
  runtimeRunnable: boolean;
  blockers: readonly string[];
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
    artifactPath: 'results/multicrop-plantvillage-v2/model-output-refined/plantvillage-full-multicrop-mobilenetv3-small.onnx',
    labelsPath: 'results/multicrop-plantvillage-v2/model-output-refined/labels.json',
    labelMappingStatus: 'missing',
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
    artifactPath: 'results/lemon-v3/lemon-v3-mobilenetv3-small-embedded.onnx',
    labelsPath: 'results/lemon-v3/labels.json',
    externalDataPath: 'results/lemon-v3/lemon-v3-mobilenetv3-small.onnx.data',
    labelMappingStatus: 'missing',
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
    artifactPath: 'results/citrus-field-v3/citrus-field-v3-mobilenetv3-small-embedded.onnx',
    labelsPath: 'results/citrus-field-v3/labels.json',
    externalDataPath: 'results/citrus-field-v3/citrus-field-v3-mobilenetv3-small.onnx.data',
    labelMappingStatus: 'missing',
    lifecycle: 'research_only',
    evidenceStatus: 'reference_only',
    supportsBrowserOnnx: true,
    limitations: ['One Moroccan orchard/campaign; labels include symptom-like categories.']
  }
];

export function getModelAssetContract(route: ModelRoute): ModelAssetContract {
  const blockers: string[] = [];
  if (!route.runtimeManifestPath || !route.runtimeModelPath || !route.runtimeLabelsPath) {
    blockers.push('browser-served model manifest, ONNX path, or labels path is missing');
  }
  if (route.labelMappingStatus !== 'verified') {
    blockers.push('research labels are not mapped to verified application disease IDs');
  }
  if (route.lifecycle !== 'production_candidate') {
    blockers.push(`lifecycle is ${route.lifecycle}`);
  }
  return {
    modelId: route.id,
    artifactPath: route.artifactPath,
    labelsPath: route.labelsPath,
    externalDataPath: route.externalDataPath,
    inputSize: route.inputSize,
    resizeMode: route.resizeMode,
    runtimeRunnable: blockers.length === 0,
    blockers
  };
}

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
  // Prefer crop specialists over the broad PlantVillage reference model.
  // With no sub-crop context, general citrus should use the field specialist;
  // an explicit lemon context selects the lemon specialist.
  const priority = (route: ModelRoute): number => {
    if (context === 'lemon') {
      return route.context === 'lemon' ? 0 : route.context === 'citrus' ? 1 : 2;
    }
    if (context === 'citrus' || context === 'unknown') {
      return route.context === 'citrus' ? 0 : route.context === 'lemon' ? 1 : 2;
    }
    return route.context === context ? 0 : 1;
  };
  const ordered = [...candidates].sort((a, b) => priority(a) - priority(b));
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
