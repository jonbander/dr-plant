import {
  assessGrapeDownyMildewWeatherRisk,
  GrapeDownyMildewRisk,
  HourlyWeather,
} from './grapeDownyMildewRisk';

export type DiseaseWeatherStatus = 'enabled' | 'research_required';
export type DiseaseWeatherLevel = 'high' | 'moderate' | 'low' | 'unavailable' | 'not_ready';

export interface DiseaseWeatherProfile {
  id: string;
  cropId: string;
  cropNameAr: string;
  diseaseNameAr: string;
  pathogen: string;
  status: DiseaseWeatherStatus;
  evidenceNoteAr: string;
  references: string[];
  ruleId?: 'grape_downy_mildew_10_10_24';
}

export interface DiseaseWeatherAssessment {
  profileId: string;
  cropId: string;
  cropNameAr: string;
  diseaseNameAr: string;
  pathogen: string;
  status: DiseaseWeatherLevel;
  headlineAr: string;
  detailsAr: string[];
  evidenceNoteAr: string;
  references: string[];
  evaluatedAt: string;
  sourceRisk?: GrapeDownyMildewRisk;
}

export interface MultiDiseaseWeatherAssessment {
  cropId: string;
  evaluatedAt: string;
  status: 'assessed' | 'no_profiles';
  assessments: DiseaseWeatherAssessment[];
  summaryAr: string;
}

/**
 * Only profiles with a documented, implemented rule are enabled.
 * Candidate profiles deliberately remain visible but cannot emit a risk level
 * until their pathogen-specific epidemiology, local inputs and validation are
 * documented. This prevents one disease's weather thresholds being reused
 * for unrelated pathogens.
 */
export const DISEASE_WEATHER_PROFILES: DiseaseWeatherProfile[] = [
  {
    id: 'grape_downy_mildew',
    cropId: 'french_grape_leaf',
    cropNameAr: 'العنب',
    diseaseNameAr: 'البياض الزغبي',
    pathogen: 'Plasmopara viticola',
    status: 'enabled',
    evidenceNoteAr: 'مؤشر طقس مبسط مبني على جزء من قاعدة 10:10:24 ودعم الرطوبة الليلية؛ ليس نموذج عدوى محلياً معايراً.',
    references: [
      'https://ipm.ucanr.edu/agriculture/grape/downy-mildew/',
      'https://cals.cornell.edu/integrated-pest-management/grapevine-downy-mildew-plasmopara-viticola-fruit-fact-sheet',
      'https://content.ces.ncsu.edu/north-carolina-winegrape-growers-guide/chapter-8-pest-management',
    ],
    ruleId: 'grape_downy_mildew_10_10_24',
  },
  {
    id: 'grape_powdery_mildew',
    cropId: 'french_grape_leaf',
    cropNameAr: 'العنب',
    diseaseNameAr: 'البياض الدقيقي',
    pathogen: 'Erysiphe necator',
    status: 'research_required',
    evidenceNoteAr: 'يلزم نموذج مستقل يراعي الحرارة والرطوبة ومرحلة نمو العنب وحساسية الصنف واللقاح؛ لا يجوز استعارة قاعدة البياض الزغبي.',
    references: ['https://ipm.ucanr.edu/agriculture/grape/powdery-mildew/'],
  },
  {
    id: 'grape_botrytis',
    cropId: 'french_grape_leaf',
    cropNameAr: 'العنب',
    diseaseNameAr: 'العفن الرمادي',
    pathogen: 'Botrytis cinerea',
    status: 'research_required',
    evidenceNoteAr: 'يتطلب نموذجاً يراعي ابتلال الأنسجة ومرحلة الإزهار/تطور العنقود وكثافة المجموع الخضري؛ الطقس العام وحده غير كافٍ.',
    references: ['https://ipm.ucanr.edu/agriculture/grape/botrytis-bunch-rot/'],
  },
  {
    id: 'citrus_scab',
    cropId: 'citrus_syrian',
    cropNameAr: 'الحمضيات',
    diseaseNameAr: 'جرب الحمضيات',
    pathogen: 'Elsinoë fawcettii',
    status: 'research_required',
    evidenceNoteAr: 'يلزم ربط المطر وابتلال الأنسجة الحديثة بفترة نمو الأوراق/الثمار ومصادر اللقاح، والتحقق من ملاءمة النموذج للحمضيات المحلية.',
    references: ['https://ask.ifas.ufl.edu/publication/CH159'],
  },
  {
    id: 'olive_peacock_spot',
    cropId: 'olive',
    cropNameAr: 'الزيتون',
    diseaseNameAr: 'عين الطاووس / تبقع أوراق الزيتون',
    pathogen: 'Venturia oleaginea',
    status: 'research_required',
    evidenceNoteAr: 'يلزم نموذج خاص بمدة ابتلال الأوراق ودرجة الحرارة والمطر والغطاء الشجري والعدوى الكامنة؛ الرطوبة وحدها لا تكفي.',
    references: [
      'https://ipm.ucanr.edu/agriculture/olive/peacock-spot/',
      'https://pnwhandbooks.org/plantdisease/host-disease/olive-olea-europaea-olive-leaf-spot-peacock-spot-peacocks-eye',
    ],
  },
  {
    id: 'tomato_early_blight',
    cropId: 'tomato',
    cropNameAr: 'البندورة',
    diseaseNameAr: 'اللفحة المبكرة',
    pathogen: 'Alternaria solani',
    status: 'research_required',
    evidenceNoteAr: 'يلزم نموذج مستقل يجمع الحرارة وابتلال الأوراق والرطوبة وعمر النبات وبقايا المحصول؛ لا توجد عتبات محلية معايرة ضمن المشروع بعد.',
    references: [],
  },
  {
    id: 'potato_late_blight',
    cropId: 'potato',
    cropNameAr: 'البطاطا',
    diseaseNameAr: 'اللفحة المتأخرة',
    pathogen: 'Phytophthora infestans',
    status: 'research_required',
    evidenceNoteAr: 'يلزم تطبيق نموذج وبائي خاص باللفحة المتأخرة مع تحقق الحرارة والرطوبة/ابتلال الأوراق ووجود اللقاح، ثم معايرته محلياً.',
    references: [],
  },
  {
    id: 'wheat_stripe_rust',
    cropId: 'wheat',
    cropNameAr: 'القمح',
    diseaseNameAr: 'الصدأ الأصفر',
    pathogen: 'Puccinia striiformis f. sp. tritici',
    status: 'research_required',
    evidenceNoteAr: 'يلزم ربط الحرارة والرطوبة ومرحلة نمو القمح ومعلومات انتشار اللقاح الإقليمي؛ لا يصدر هذا الإصدار إنذاراً لهذا المرض.',
    references: [],
  },
];

function unavailableAssessment(
  profile: DiseaseWeatherProfile,
  evaluatedAt: string,
  status: 'not_ready' | 'unavailable',
  detailsAr: string[],
): DiseaseWeatherAssessment {
  return {
    profileId: profile.id,
    cropId: profile.cropId,
    cropNameAr: profile.cropNameAr,
    diseaseNameAr: profile.diseaseNameAr,
    pathogen: profile.pathogen,
    status,
    headlineAr: status === 'not_ready'
      ? 'قواعد الإنذار لهذا المرض قيد التطوير والتحقق'
      : 'بيانات الطقس غير كافية لتقييم هذا المرض',
    detailsAr,
    evidenceNoteAr: profile.evidenceNoteAr,
    references: profile.references,
    evaluatedAt,
  };
}

/**
 * Evaluates every registered disease for the selected crop.
 * "not_ready" is intentionally not a low-risk result: it means no validated
 * disease-specific rule is available and the app must not imply safety.
 */
export function assessMultiDiseaseWeatherRisk(
  cropId: string,
  weather: HourlyWeather,
  currentTime: string,
  profiles: DiseaseWeatherProfile[] = DISEASE_WEATHER_PROFILES,
): MultiDiseaseWeatherAssessment {
  const matching = profiles.filter((profile) => profile.cropId === cropId);
  if (matching.length === 0) {
    return {
      cropId,
      evaluatedAt: currentTime,
      status: 'no_profiles',
      assessments: [],
      summaryAr: 'لا توجد ملفات إنذار مرتبطة بهذا المحصول في قاعدة المعرفة الحالية؛ لا يعني ذلك غياب مخاطر الأمراض.',
    };
  }

  const assessments = matching.map((profile): DiseaseWeatherAssessment => {
    if (profile.status !== 'enabled' || profile.ruleId !== 'grape_downy_mildew_10_10_24') {
      return unavailableAssessment(
        profile,
        currentTime,
        'not_ready',
        ['لم تُعتمد بعد قاعدة طقس خاصة بهذا المرض. لن نستخدم عتبات مرض آخر بديلاً عنها.'],
      );
    }

    const result = assessGrapeDownyMildewWeatherRisk(weather, currentTime);
    return {
      profileId: profile.id,
      cropId: profile.cropId,
      cropNameAr: profile.cropNameAr,
      diseaseNameAr: profile.diseaseNameAr,
      pathogen: profile.pathogen,
      status: result.level,
      headlineAr: result.headlineAr,
      detailsAr: result.detailsAr,
      evidenceNoteAr: profile.evidenceNoteAr,
      references: profile.references,
      evaluatedAt: currentTime,
      sourceRisk: result,
    };
  });

  const actionable = assessments.filter((item) => item.status !== 'not_ready' && item.status !== 'unavailable');
  const elevated = actionable.filter((item) => item.status === 'high' || item.status === 'moderate');
  const summaryAr = elevated.length
    ? `ظهرت مؤشرات طقس تستحق المتابعة لـ ${elevated.length} مرض/أمراض من أصل ${matching.length} ملفات مرتبطة بالمحصول. هذه مؤشرات وليست تشخيصاً أو توصية رش.`
    : 'لم تظهر إشارة قوية ضمن قواعد الأمراض المفعّلة؛ بعض الأمراض ما زالت بلا نموذج طقس معتمد، لذلك لا تعني النتيجة أن الخطر معدوم.';

  return {
    cropId,
    evaluatedAt: currentTime,
    status: 'assessed',
    assessments,
    summaryAr,
  };
}
