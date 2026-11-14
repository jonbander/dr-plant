export type DiseaseCategory = 
  | 'fungal' 
  | 'bacterial' 
  | 'viral' 
  | 'pest' 
  | 'nutrient_deficiency' 
  | 'environmental';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ChemicalTreatment {
  pesticideName: string;
  activeIngredient: string;
  dosePer100L: string;
  safetyIntervalDays: number; // فترة أمان ما قبل الحصاد PHI
  safetyNotesAr: string;
}

export interface DiseasePest {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  category: DiseaseCategory;
  severity: SeverityLevel;
  targetCropIds: string[];
  visualSymptomsAr: string[];
  descriptionAr: string;
  favorableConditionsAr: string; // الظروف الجوية المشجعة (رطوبة، حرارة)
  organicTreatmentAr: string[];
  chemicalTreatments: ChemicalTreatment[];
  preventiveMeasuresAr: string[];
  identificationTipsAr: string[];
  // Spectral and visual characteristics for offline computer vision engine
  visionSignatures: {
    dominantHues: ('yellow' | 'brown' | 'white' | 'black' | 'rust' | 'mosaic' | 'pale_green')[];
    spotTexture: 'powdery' | 'concentric_rings' | 'scattered_dots' | 'leaf_curling' | 'chewed_holes' | 'water_soaked' | 'scorch';
    targetPart: 'leaf' | 'stem' | 'fruit' | 'whole_plant';
  };
}

export interface Crop {
  id: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  categoryAr: 'خضروات' | 'محاصيل حقلية' | 'أشجار مثمرة' | 'نخيل' | 'حبوب' | 'محاصيل الساحل السوري' | 'أشجار جبلية وغابات';
  icon: string;
  descriptionAr: string;
  optimalTemperatureAr: string;
  wateringAdviceAr: string;
  isSyrianCoastSpecialty?: boolean;
  syrianCoastRegionAr?: string;
  commonDiseaseIds: string[];
  sampleLeaves?: {
    healthy: string;
    diseasedSample: string;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  severity: SeverityLevel;
}

export interface OfflineVisionAnalysis {
  greenHealthIndex: number; // 0 - 100%
  lesionSpotAreaPercentage: number;
  chlorosisPercentage: number;
  necrosisPercentage: number;
  powderyPercentage: number;
  rustPercentage: number;
  detectedHueSummary: string;
  leafContoursDetected: boolean;
  boundingBoxes: BoundingBox[];
}

export interface ScanResult {
  id: string;
  timestamp: number;
  imageThumbnail: string; // base64
  crop: Crop;
  diseaseOrPest: DiseasePest;
  confidence: number; // 0 - 100%
  severity: SeverityLevel;
  analysisData: OfflineVisionAnalysis;
  userNotes?: string;
  resolved?: boolean;
}

export interface DoseCalculation {
  cropName: string;
  tankVolumeLiters: number;
  targetPest: string;
  recommendedDosePer100L: string;
  totalRequiredPesticide: string;
  safetyIntervalDays: number;
  sprayingTipsAr: string[];
}
