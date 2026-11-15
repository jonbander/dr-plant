export type SymptomPlantPart = 'leaves' | 'stem' | 'fruit';

export const SYMPTOM_PATTERN_OPTIONS = [
  { id: 'white_powder', title: 'مسحوق أبيض كبودرة الطحين', desc: 'قد يظهر مع البياض الدقيقي، ويحتاج فحص وجهي الورقة' },
  { id: 'downy_oil', title: 'بقع زيتية صفراء وزغب أبيض بالأسفل', desc: 'نمط قد يتوافق مع البياض الزغبي في العنب' },
  { id: 'silver_mines', title: 'أنفاق فضية متعرجة داخل الورقة', desc: 'قد تتوافق مع صانعة أنفاق أوراق الحمضيات' },
  { id: 'gummosis_sap', title: 'سيلان صمغي من قلف الجذع', desc: 'يحتاج فحص الجذع والجذور والصرف' },
  { id: 'fruit_punctures', title: 'ثقوب أو وخزات في الثمار', desc: 'أسبابها تختلف حسب المحصول ويجب فحص الثمرة' },
  { id: 'iron_yellowing', title: 'اصفرار بين العروق مع بقاء العروق خضراء', desc: 'عرض غير نوعي؛ لا يثبت نقص الحديد وحده' },
  { id: 'blister_swell', title: 'بثور وانتفاخات على ورق العنب', desc: 'قد تتوافق مع حلم تبثر أوراق العنب' },
  { id: 'target_rings', title: 'بقع دائرية بحلقات متداخلة', desc: 'نمط غير نوعي وقد يظهر في أكثر من مرض' },
  { id: 'rust_stripes', title: 'خطوط أو بثرات صدئية متوازية على الورقة', desc: 'نمط قد يتوافق مع أصداء الحبوب' },
  { id: 'unknown', title: 'شكل آخر / لست متأكداً', desc: 'لا نفرض مرضاً عند عدم وضوح الأعراض' },
] as const;

export type SymptomPatternId = typeof SYMPTOM_PATTERN_OPTIONS[number]['id'];

export function getSymptomPatternLabel(patternId: string): string {
  return SYMPTOM_PATTERN_OPTIONS.find((pattern) => pattern.id === patternId)?.title
    ?? 'نمط غير محدد';
}

/**
 * Returns a candidate record only for an explicitly supported crop/part/pattern
 * combination. A null result means the wizard must keep the cause undetermined.
 */
export function getSymptomCandidateId(
  cropId: string,
  affectedPart: SymptomPlantPart,
  patternId: string,
): string | null {
  if (patternId === 'unknown') return null;

  if (cropId === 'french_grape_leaf' && affectedPart === 'leaves') {
    if (patternId === 'white_powder') return 'grape_powdery_mildew';
    if (patternId === 'downy_oil') return 'grape_downy_mildew';
    if (patternId === 'blister_swell') return 'grape_leaf_blister_mite';
  }

  if (cropId === 'citrus_syrian') {
    if (patternId === 'gummosis_sap' && affectedPart === 'stem') return 'citrus_gummosis_syria';
    if (patternId === 'fruit_punctures' && affectedPart === 'fruit') return 'citrus_medfly_syria';
    if (patternId === 'iron_yellowing' && affectedPart === 'leaves') return 'citrus_chlorosis_syria';
    if (patternId === 'silver_mines' && affectedPart === 'leaves') return 'citrus_leafminer_syria';
  }

  if (cropId === 'walnut') {
    if (patternId === 'fruit_punctures' && affectedPart === 'fruit') return 'walnut_codling_moth_syria';
  }

  if (cropId === 'myrtle_hamblas' && affectedPart === 'leaves' && patternId === 'white_powder') {
    return 'hamblas_powdery_mildew';
  }

  if (cropId === 'olive' && affectedPart === 'leaves' && patternId === 'target_rings') {
    return 'olive_peacock_spot_syria';
  }

  if (cropId === 'tomato' && affectedPart === 'leaves' && patternId === 'target_rings') {
    return 'tomato_early_blight_syria';
  }

  if (cropId === 'wheat' && affectedPart === 'leaves' && patternId === 'rust_stripes') {
    return 'wheat_stripe_rust_syria';
  }

  return null;
}
