export type SymptomPlantPart = 'leaves' | 'stem' | 'fruit';

export const SYMPTOM_PATTERN_OPTIONS = [
  { id: 'white_powder', title: 'مسحوق أبيض كبودرة الطحين', desc: 'قد يظهر مع البياض الدقيقي، ويحتاج فحص وجهي الورقة' },
  { id: 'downy_oil', title: 'بقع زيتية صفراء وزغب أبيض بالأسفل', desc: 'نمط قد يتوافق مع البياض الزغبي في العنب' },
  { id: 'silver_mines', title: 'أنفاق فضية متعرجة داخل الورقة', desc: 'قد تتوافق مع صانعة أنفاق أوراق الحمضيات' },
  { id: 'citrus_scab_warts', title: 'نتوءات فلينية خشنة ومرتفعة على الورقة أو الثمرة', desc: 'قد تتوافق مع جرب الحمضيات؛ يلزم التفريق عن أضرار أخرى' },
  { id: 'gummosis_sap', title: 'سيلان صمغي من قلف الجذع', desc: 'يحتاج فحص الجذع والجذور والصرف' },
  { id: 'fruit_punctures', title: 'ثقوب أو وخزات في الثمار', desc: 'أسبابها تختلف حسب المحصول ويجب فحص الثمرة' },
  { id: 'iron_yellowing', title: 'اصفرار بين العروق مع بقاء العروق خضراء', desc: 'عرض غير نوعي؛ لا يثبت نقص الحديد وحده' },
  { id: 'blister_swell', title: 'بثور وانتفاخات على ورق العنب', desc: 'قد تتوافق مع حلم تبثر أوراق العنب' },
  { id: 'target_rings', title: 'بقع دائرية بحلقات متداخلة', desc: 'نمط غير نوعي وقد يظهر في أكثر من مرض' },
  { id: 'rust_stripes', title: 'خطوط أو بثرات صدئية متوازية على الورقة', desc: 'نمط قد يتوافق مع أصداء الحبوب' },

  // Morphology is recorded independently from color and causal diagnosis.
  { id: 'leaf_curl_up', title: 'التفاف حواف الورقة إلى الأعلى', desc: 'تشوه شكلي؛ قد يرتبط بآفات أو إجهاد أو مرض ولا يحدد السبب وحده' },
  { id: 'leaf_curl_down', title: 'التفاف الورقة إلى الأسفل', desc: 'تشوه شكلي غير نوعي؛ يلزم ربطه بالمحصول وعمر الورقة والظروف' },
  { id: 'leaf_rolling', title: 'انطواء الورقة أو تدحرجها طولياً', desc: 'قد ينتج عن حشرات أو إجهاد مائي أو عوامل أخرى' },
  { id: 'leaf_wrinkling', title: 'تجعد واضح في سطح الورقة', desc: 'عرض بنيوي قد يظهر دون بقع لونية واضحة' },
  { id: 'leaf_crumpling', title: 'تكرمش أو انكماش نسيج الورقة', desc: 'عرض شكلي غير نوعي؛ لا يثبت مرضاً بعينه' },
  { id: 'leaf_puckering', title: 'تغضن أو تنقير وانتفاخ غير منتظم', desc: 'قد يترافق مع تغذية حلم/حشرات أو نمو غير طبيعي' },
  { id: 'leaf_twisting', title: 'التواء محور الورقة أو عنقها', desc: 'تشوه اتجاهي؛ يجب فحص النموات الحديثة والساق' },
  { id: 'leaf_cupping', title: 'تقعر الورقة بشكل يشبه الكأس', desc: 'قد يرتبط بآفات أو إجهاد أو اختلالات نمو' },
  { id: 'leaf_margin_distortion', title: 'حواف غير منتظمة أو ملتوية', desc: 'عرض غير نوعي ويحتاج مقارنة بأوراق سليمة من النبات نفسه' },
  { id: 'vein_distortion', title: 'تشوه العروق أو بروزها أو انحناؤها', desc: 'يحتاج فحص نمط العروق وعمر الورقة والأعراض المصاحبة' },
  { id: 'leaf_narrowing', title: 'ورقة ضيقة أو ممدودة بشكل غير طبيعي', desc: 'اختلاف شكلي قد يرتبط بالنمو أو عوامل مرضية وبيئية' },
  { id: 'leaf_size_distortion', title: 'صغر أو تضخم غير طبيعي في حجم الورقة', desc: 'يجب مقارنة أوراق من العمر والفرع نفسيهما' },
  { id: 'surface_roughness', title: 'خشونة أو سماكة غير معتادة في سطح الورقة', desc: 'صفة ملمسية وليست تشخيصاً سببياً' },
  { id: 'leaf_brittleness', title: 'هشاشة أو تيبس غير معتاد في الورقة', desc: 'قد يرتبط بالجفاف أو الملوحة أو المرض أو ضرر كيميائي' },
  { id: 'mixed_morphology', title: 'عدة تشوهات شكلية معاً', desc: 'سجّل الأعراض منفصلة ولا تفترض مرضاً واحداً' },
  { id: 'unknown', title: 'شكل آخر / لست متأكداً', desc: 'لا نفرض مرضاً عند عدم وضوح الأعراض' },
] as const;

export type SymptomPatternId = typeof SYMPTOM_PATTERN_OPTIONS[number]['id'];

export function getSymptomPatternLabel(patternId: string): string {
  return SYMPTOM_PATTERN_OPTIONS.find((pattern) => pattern.id === patternId)?.title
    ?? 'نمط غير محدد';
}

/**
 * Returns a candidate record only for an explicitly supported crop/part/pattern
 * combination. Generic deformation patterns intentionally stay undetermined:
 * curl, wrinkles and distortion have many infectious and non-infectious causes.
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
    if (patternId === 'citrus_scab_warts' && (affectedPart === 'leaves' || affectedPart === 'fruit')) return 'citrus_scab_syria';
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
