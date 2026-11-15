import { Crop, DiseasePest } from '../types/crop';

export const DISEASES_DATABASE: DiseasePest[] = [
  // =========================================================================
  // --- 1. كَرْمَات وَوَرَق العِنَب الفَرَنْسِي (FRENCH GRAPEVINE - كرمات الساحل السوري) ---
  // =========================================================================
  {
    id: 'grape_powdery_mildew',
    nameAr: 'رَمَد العنب الفرنسي (البياض الدقيقي في كرمات الساحل)',
    nameEn: 'Grape Powdery Mildew (Uncinula necator)',
    scientificName: 'Uncinula necator / Erysiphe necator',
    category: 'fungal',
    severity: 'high',
    targetCropIds: ['french_grape_leaf', 'grape'],
    visualSymptomsAr: [
      'طبقة رمادية أو رماد أبيض ناعم يشبه بودرة الطحين يغطي السطح العلوي والسفلي لورق العنب الفرنسي',
      'التواء وتشوه حواف أوراق العنب الفتية وجفافها وتساقطها المبكر',
      'تشقق حبات العنب وظهور خطوط شبكية بنية متصلبة على العناقيد المصابة',
      'انبعاث رائحة ترابية شبيهة برائحة العفن أو الفطر من الكرمة المصابة'
    ],
    descriptionAr: 'من أشد أمراض كرمات العنب الفرنسي فتكاً في الساحل السوري وجباله (اللاذقية، طرطوس، مشتى الحلو، صافيتا، كسب). يطلق عليه المزارعون محلياً "الرَّمَد" أو "الغبارة"، وينشط بشدة مع ارتفاع الرطوبة الساحلية مع حرارة معتدلة إلى دافئة.',
    favorableConditionsAr: 'رطوبة جوية ساحلية عالية (70-85%) مع درجات حرارة بين 20-28 مئوية وظل داخلي بين فروع الكرمة المتشابكة.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'التوريق والتهوية الجيدة لعرائش وداليات العنب الفرنسي في جبال ووديان الساحل.',
      'تجنب زراعة الداليات في المنخفضات الرطبة المعزولة عن الرياح اللطيفة.'
    ],
    identificationTipsAr: [
      'مسحوق رمادي دقيقي يمسح بالإصبع، وتشوه نصل ورقة العنب الفرنسي.'
    ],
    visionSignatures: {
      dominantHues: ['white', 'pale_green'],
      spotTexture: 'powdery',
      targetPart: 'leaf'
    }
  },
  {
    id: 'grape_downy_mildew',
    nameAr: 'البياض الزغبي في العنب الفرنسي (الميلديو الساحلي)',
    nameEn: 'Grapevine Downy Mildew (Plasmopara viticola)',
    scientificName: 'Plasmopara viticola',
    category: 'fungal',
    severity: 'critical',
    targetCropIds: ['french_grape_leaf', 'grape'],
    visualSymptomsAr: [
      'بقع زيتية شفافة صفراء باهتة على الوجه العلوي للأوراق تشبه بقع الزيت (Oil spots)',
      'زغب أبيض قطني ناعم جداً على السطح السفلي المقابل للبقعة الزيتية في الصباح الرطب',
      'تحول البقع سريعاً إلى اللون البني المحروق وجفاف نصل الورقة وسقوط ورق العنب بالكامل',
      'انحناء وتصلب الشماريخ الزهرية وتلونها باللون البني وتعفن العناقيد'
    ],
    descriptionAr: 'يعد "الميلديو" أشرس أمراض كروم العنب في الساحل السوري نتيجة تكرار منخفضات الأمطار والضباب الساحلي في الربيع. يسبب تساقط ورق العنب الفرنسي وحرمان الفلاحين من موسمي الورق والثمار.',
    favorableConditionsAr: 'قاعدة (10-10-10): طول الفرخ 10 سم، هطول 10 ملم أمطار، وحرارة فوق 10 مئوية مع رطوبة مشبعة.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'رفع الأغصان والطرود عن ملامسة سطح التربة للحد من صعود الجراثيم بالرذاذ.',
      'قص الحشائش والأعشاب تحت العرائش لتخفيف الندى المتبخر.'
    ],
    identificationTipsAr: [
      'بقعة زيتية صفراء بالأعلى يقابلها زغب قطني أبيض في بطن الورقة.'
    ],
    visionSignatures: {
      dominantHues: ['yellow', 'white', 'brown'],
      spotTexture: 'water_soaked',
      targetPart: 'leaf'
    }
  },
  {
    id: 'grape_leaf_blister_mite',
    nameAr: 'حَلَم تبثر وتجعد أوراق العنب الفرنسي (الأكاروس البثري)',
    nameEn: 'Grape Leaf Blister Mite (Colomerus vitis)',
    scientificName: 'Colomerus vitis / Eriophyes vitis',
    category: 'pest',
    severity: 'medium',
    targetCropIds: ['french_grape_leaf', 'grape'],
    visualSymptomsAr: [
      'انتفاخات وبثور بارزة تشبه الثآليل على الوجه العلوي لورقة العنب الفرنسي',
      'ظهور نسيج زغبي أبيض أو سمني كثيف ومخملي في التجاويف المقابلة على السطح السفلي',
      'تحول النسيج المخملي لاحقاً إلى اللون الصدئي أو البني المحروق مع جفاف أطراف الورقة',
      'تشوه وتجعد أوراق القمم النامية الفتية وصعوبة تسويق ورق العنب كمنتج غذائي'
    ],
    descriptionAr: 'آفة أكاروسية مجهرية شائعة جداً في داليات الساحل السوري وجبال طرطوس واللاذقية. يعيش الأكاروس داخل النسيج الشعري السفلي ويفرز مواد تهيج نسيج الورقة فتتشكل البثور.',
    favorableConditionsAr: 'انطلاق الحلم من حراشف البراعم في أوائل الربيع مع بدء التوريق ودفء الطقس.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'مراقبة الأوراق الأولى في نيسان والتدخل فور ملاحظة أول بثرة بارزة.'
    ],
    identificationTipsAr: [
      'انتفاخ ثؤلولي من الأعلى يقابله ملمس لبادي صوفي أبيض أو بني من الأسفل.'
    ],
    visionSignatures: {
      dominantHues: ['pale_green', 'white', 'rust'],
      spotTexture: 'scattered_dots',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 2. الحِمْضِيَّات السُّورِيَّة (CITRUS - طرطوس، اللاذقية، جبلة، بانياس، سهل عكار) ---
  // =========================================================================
  {
    id: 'citrus_leafminer_syria',
    nameAr: 'مينوز الحمضيات (صانعة أنفاق أوراق الموالح الساحلية)',
    nameEn: 'Citrus Leafminer (Phyllocnistis citrella)',
    scientificName: 'Phyllocnistis citrella',
    category: 'pest',
    severity: 'high',
    targetCropIds: ['citrus_syrian', 'citrus'],
    visualSymptomsAr: [
      'أنفاق فضية متعرجة لماعة داخل بشرة الأوراق الغضة تشبه مجاري الأنهار',
      'التفاف وتقوقع الأوراق الحديثة وجفاف حوافها لتصبح هشة وسهلة التكسر',
      'توقف نمو الطرود الربيعية والصيفية في بساتين الحامض والبرتقال واليوسفي',
      'تسهيل دخول بكتيريا التقرح عبر الجروح الناتجة عن حفر اليرقات'
    ],
    descriptionAr: 'الآفة الأكثر إزعاجاً لبساتين الحمضيات في الساحل السوري (اللاذقية وطرطوس وجبلة وبانياس)، وتسمى محلياً "المينوز". تهاجم النموات الحديثة الغضة طوال فترات تدفق النمو.',
    favorableConditionsAr: 'الطقس الدافئ الساحلي الرطب (24-34°C) المتزامن مع خروج الطرود الحديثة للنمو في الربيع والصيف والخريف.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'برمجة التسميد الآزوتي والري لتجنب إخراج طرود غضة مستمرة في أوقات ذروة الحشرة.',
      'حماية شتول الحمضيات الصغيرة في المشاتل والبيوت المحمية بشباك حريرية دقيقة.',
      'الفحص الأسبوعي لبواطن الأوراق الطرية حديثة الظهور.'
    ],
    identificationTipsAr: [
      'أنفاق فضية متلألئة تحت الضوء مع التواء الورقة الغضة كالقوقعة.'
    ],
    visionSignatures: {
      dominantHues: ['white', 'pale_green'],
      spotTexture: 'chewed_holes',
      targetPart: 'leaf'
    }
  },
  {
    id: 'citrus_gummosis_syria',
    nameAr: 'تصمغ الحمضيات الساحلية وعفن الفيتوفثورا (Gummosis)',
    nameEn: 'Citrus Gummosis & Foot Rot (Phytophthora citrophthora)',
    scientificName: 'Phytophthora citrophthora / P. parasitica',
    category: 'fungal',
    severity: 'critical',
    targetCropIds: ['citrus_syrian', 'citrus'],
    visualSymptomsAr: [
      'سيلان صمغي بني ذهبي أو عنبري لزج يخرج من تشققات قلف جذع شجرة الحمضيات قرب سطح التربة',
      'اسوداد وموت أنسجة اللحاء والخشب تحت القلف وظهور رائحة حمضية متعفنة',
      'اصفرار عروق أوراق الشجرة تدريجياً، تساقط الثمار والأوراق، وموت أطراف الفروع العلوية (Dieback)',
      'انحسار اللحاء وتكون ندبة غائرة محاطة بجدر فلينية تؤدي في النهاية لموت الشجرة إذا حاصرت الجذع'
    ],
    descriptionAr: 'أخطر أمراض بساتين الليمون والبرتقال في الساحل السوري (سهل عكار، بانياس، طرطوس، جبلة) خاصة في الأراضي الطينية الثقيلة أو عند ملامسة مياه الري لجذع الشجرة مباشرة.',
    favorableConditionsAr: 'رطوبة أرضية زائدة، ركود مياه الري حول ساق الشجرة، وتربة ثقيلة سيئة الصرف مع حرارة بين 18-28 مئوية.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'تطعيم الحمضيات على أصل مقاوم مثل النارنج (الخشخاش) أو الفولكاميريانا، وتجنب الليمون المخرفش في الترب الطينية.',
      'إنشاء مصارف مائية لمنع تجمّع مياه الشتاء حول قواعد الأشجار.',
    ],
    identificationTipsAr: [
      'دموع صمغية عسلية أو بنية تخرج من تشققات قاعدة الجذع مع اصفرار قمة الشجرة.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'black', 'yellow'],
      spotTexture: 'water_soaked',
      targetPart: 'stem'
    }
  },
  {
    id: 'citrus_medfly_syria',
    nameAr: 'ذبابة فاكهة البحر الأبيض المتوسط (الميدفلاي في حمضيات الساحل)',
    nameEn: 'Mediterranean Fruit Fly (Ceratitis capitata)',
    scientificName: 'Ceratitis capitata',
    category: 'pest',
    severity: 'critical',
    targetCropIds: ['citrus_syrian', 'citrus'],
    visualSymptomsAr: [
      'وخزات ونقط دائرية بنية صغيرة محاطة بهالة صفراء أو خضراء على قشرة ثمار البرتقال واليوسفي والكلمنتينا',
      'تريث وليونة المنطقة المحيطة بوخزة وضع البيض مع انبعاث رائحة تخمر',
      'سقوط الثمار المصابة بكثافة على الأرض وتلف لب الثمرة بوجود يرقات ديدان بيضاء ناصعة في الداخل',
      'خسارة تسويقية كاملة للثمار المعدة للتصدير أو الاستهلاك المحلي'
    ],
    descriptionAr: 'الآفة الثمرية الأولى في الساحل السوري، تضع الإناث البيض تحت قشرة الثمار أثناء بدء التلوين والنضج، فتتغذى اليرقات على اللب وتسبب العفن والسقوط السريع.',
    favorableConditionsAr: 'أشهر الخريف الدافئة المعتدلة (أيلول، تشرين الأول، تشرين الثاني) أثناء نضج وتلوين أصناف الكلمنتينا وأبو صرة والماير.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'المكافحة الجماعية الموحدة لجميع بساتين القرية الساحلية لمنع انتقال الأسراب بين الحقول.',
      'التخلص من أشجار الصبار والتين المهملة القريبة التي تشكل عائلاً وسيطاً للذبابة في الصيف.'
    ],
    identificationTipsAr: [
      'ثقب وخز دقيق على جلد الثمرة محاط بهالة بنية رطبة مع ديدان بيضاء لينة بالداخل.'
    ],
    visionSignatures: {
      dominantHues: ['yellow', 'brown'],
      spotTexture: 'water_soaked',
      targetPart: 'fruit'
    }
  },
  {
    id: 'citrus_chlorosis_syria',
    nameAr: 'اصفرار ونقص حديد الحمضيات في الترب الكلسية الساحلية (الكلوروز)',
    nameEn: 'Citrus Iron Deficiency Chlorosis',
    scientificName: 'Physiological / Iron (Fe) Chlorosis',
    category: 'nutrient_deficiency',
    severity: 'medium',
    targetCropIds: ['citrus_syrian', 'citrus'],
    visualSymptomsAr: [
      'اصفرار ليموني ساطع بين عروق أوراق الحمضيات الفتية في قمة الشجرة والطرود الحديثة',
      'بقاء العروق الرئيسية والفرعية خضراء داكنة بارزة تشبه هيكل السمكة أو الشبكة الدقيقة',
      'تحول الأوراق للون الأبيض العاجي واحتراق حوافها وسقوطها في حالات النقص المزمن الحاد',
      'صغر حجم ثمار الليمون والبرتقال وتصلبها وسمك قشرتها مع تراجع حاد في كمية الإنتاج'
    ],
    descriptionAr: 'ظاهرة فسيولوجية واسعة الانتشار في بساتين الساحل السوري بسبب الطبيعة الكلسية للتربة وارتفاع نسبة كربونات الكالسيوم النشطة (pH > 7.8) مما يثبت عنصر الحديد في التربة ويمنع الجذور من امتصاصه.',
    favorableConditionsAr: 'الترب الكلسية البيضاء الشائعة في سفوح جبال اللاذقية وطرطوس، وزيادة الرطوبة والري غير المنضبط الذي يخنق الجذور.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'إجراء تحليل تربة لتحديد نسبة الكلس النشط قبل تأسيس البستان واختيار الأصول الملائمة (مثل الخشخاش النارنج).',
      'التسميد المتوازن وتجنب الإفراط في الفوسفور الذي يزيد من تثبيت الحديد والزنك.'
    ],
    identificationTipsAr: [
      'أوراق علوية صفراء فاقعة ذات شبكة عروق خضراء داكنة نقية.'
    ],
    visionSignatures: {
      dominantHues: ['yellow', 'pale_green'],
      spotTexture: 'scattered_dots',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 3. الجَوْز (WALNUT - جبال الساحل: صلنفة، كسب، مشتى الحلو، القدموس، الدريكيش) ---
  // =========================================================================
  {
    id: 'walnut_anthracnose_syria',
    nameAr: 'أنثراكنوز وتبقع أوراق الجوز (Gnomonia leptostyla)',
    nameEn: 'Walnut Anthracnose / Leaf Blotch',
    scientificName: 'Gnomonia leptostyla / Ophiognomonia leptostyla',
    category: 'fungal',
    severity: 'high',
    targetCropIds: ['walnut'],
    visualSymptomsAr: [
      'بقع دائرية إلى غير منتظمة بنية داكنة أو سوداء بمركز رمادي على أوراق الجوز',
      'ظهور هالة صفراء تحيط بالبقع النخرية على نصل الورقة',
      'التحام البقع وجفاف مساحات واسعة من الورقة وسقوط الأوراق مبكراً في تموز وآب',
      'بقع غائرة سوداء فحمية على القشرة الخضراء الخارجية لثمار الجوز تؤدي لضمور اللب وسواده'
    ],
    descriptionAr: 'المرض الفطري الأكثر خطورة على أشجار الجوز في مصايف وجبال الساحل السوري (صلنفة، مشتى الحلو، كسب، صافيتا، القدموس). ينتشر بكثافة خلال الربيع والصيف في الوديان الجبلية الرطبة ذات الضباب المتكرر.',
    favorableConditionsAr: 'فترات طويلة من الرطوبة الجوية والضباب وقطرات المطر الربيعي مع حرارة بين 18-24 مئوية.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'اختيار مواقع ذات تهوية جيدة وتجنب الزراعة في بطون الأودية المغمورة بالضباب طوال النهار.'
    ],
    identificationTipsAr: [
      'بقع بنية مسودة ذات مركز رمادي محاط بهالة صفراء على وريقات الجوز المركبة.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'black', 'yellow'],
      spotTexture: 'concentric_rings',
      targetPart: 'leaf'
    }
  },
  {
    id: 'walnut_codling_moth_syria',
    nameAr: 'دودة ثمار الجوز (حفار ثمار الجوز الجبلي Cydia pomonella)',
    nameEn: 'Walnut Codling Moth',
    scientificName: 'Cydia pomonella',
    category: 'pest',
    severity: 'critical',
    targetCropIds: ['walnut'],
    visualSymptomsAr: [
      'ثقوب نخرية عند قاعدة أو جانب ثمرة الجوز الخضراء يخرج منها براز بني محبب لليرقة',
      'سقوط ثمار الجوز الصغيرة في حزيران وتموز عند إصابة الجيل الأول',
      'اسوداد لب الجوز الداخلي وتآكله بالكامل مع تلف النواة عند كسر الجوزة',
      'وجود يرقة بيضاء أو قرنفلية برأس بني تتغذى داخل الثمرة'
    ],
    descriptionAr: 'حشرة اقتصادية مدمرة لمحصول الجوز والتفاحيات في المرتفعات الجبلية الساحلية السورية. تدخل اليرقات فور فقسها عبر قشرة الجوزة وتتغذى على اللب مسببة فساد المحصول.',
    favorableConditionsAr: 'حرارة معتدلة إلى دافئة في سفوح الجبال خلال حزيران وتموز وآب تتيح نشاط طيران الفراشات ليلاً.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'جمع الثمار المتساقطة المصابة دورياً والتخلص منها لمنع اكتمال دورة حياة اليرقات.',
    ],
    identificationTipsAr: [
      'ثقب جانبي في قشرة الجوزة مع نشارة وبراز بني مسود يخرج من الفتحة.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'black'],
      spotTexture: 'chewed_holes',
      targetPart: 'fruit'
    }
  },
  {
    id: 'walnut_bacterial_blight_syria',
    nameAr: 'اللفحة البكتيرية في الجوز (Xanthomonas arboricola)',
    nameEn: 'Walnut Bacterial Blight',
    scientificName: 'Xanthomonas arboricola pv. juglandis',
    category: 'bacterial',
    severity: 'critical',
    targetCropIds: ['walnut'],
    visualSymptomsAr: [
      'بقع مائية صغيرة تتحول سريعاً للون الأسود الفحمي المحروق على الأوراق والبراعم والأزهار',
      'التفاف وتشوه الوريقات الصغيرة المصابة وسقوط الأزهار المؤنثة والمذكرة',
      'بقع سوداء مائية غائرة على قشرة ثمار الجوز الفتية تخترق حتى القشرة الخشبية وتفسد اللب',
      'موت وجفاف الطرود الحديثة وتلونها باللون الأسود المحروق'
    ],
    descriptionAr: 'مرض بكتيري خطير جداً على أشجار الجوز في المناطق الجبلية الرطبة في كسب وصلنفة وجبال طرطوس. ينتقل عن طريق حبوب اللقاح ورذاذ المطر والرياح الربيعية الرطبة.',
    favorableConditionsAr: 'أمطار ربيعية مستمرة مع درجات حرارة بين 15-22 مئوية أثناء خروج النموات الزهرية والورقية.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'تجنب الري العلوي الرأسي الذي يبلل المجموع الخضري والزهري.',
    ],
    identificationTipsAr: [
      'بقع سوداء فحمية مائية على حواف الأوراق وقشرة ثمار الجوز الصغيرة.'
    ],
    visionSignatures: {
      dominantHues: ['black', 'brown'],
      spotTexture: 'water_soaked',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 4. الحِمْبَلَاس / الآس السَّاحِلِي (MYRTLE / HAMBLAS - اللاذقية وطرطوس) ---
  // =========================================================================
  {
    id: 'hamblas_powdery_mildew',
    nameAr: 'بياض أوراق الحمبلاس الدقيقي (آس الساحل السوري)',
    nameEn: 'Myrtle / Hamblas Powdery Mildew',
    scientificName: 'Erysiphe myrtillina / Oidium myrti',
    category: 'fungal',
    severity: 'medium',
    targetCropIds: ['myrtle_hamblas'],
    visualSymptomsAr: [
      'غشاء أبيض طباشيري يغطي أوراق شجيرة الحمبلاس الصغيرة والعطرية',
      'فقدان الأوراق للونها الأخضر الداكن اللامع وميلها للون الرمادي الباهت',
      'تجعد الأوراق العطرية وضعف نمو الثمار (حبات الحمبلاس السوداء والبيضاء)',
      'جفاف الأغصان الرفيعة الطرفية وتساقط الأوراق مبكراً'
    ],
    descriptionAr: 'يعد "الحمبلاس" (شجيرة الآس البرية والمزروعة) من رموز الطبيعة الساحلية السورية وثقافتها الشعبية. تصاب شجيراته بالبياض الدقيقي في أواخر الربيع والصيف الحار الرطب.',
    favorableConditionsAr: 'أجواء صيفية دافئة ورطبة ومواقع مظللة بين الصخور والأشجار الحراجية.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'زراعة شجيرات الحمبلاس في مواقع مشمسة جيدة الصرف والتهوية.',
      'تجنب الري الرأسي على الأوراق واستخدام الري بالتنقيط عند الساق.'
    ],
    identificationTipsAr: [
      'بودرة بيضاء ناصعة على الأوراق الجلدية الصغيرة اللامعة لشجيرة الحمبلاس.'
    ],
    visionSignatures: {
      dominantHues: ['white', 'pale_green'],
      spotTexture: 'powdery',
      targetPart: 'leaf'
    }
  },
  {
    id: 'hamblas_leaf_spot_syria',
    nameAr: 'تبقع أوراق الحمبلاس الفطري (Cercospora myrti)',
    nameEn: 'Myrtle / Hamblas Cercospora Leaf Spot',
    scientificName: 'Cercospora myrti / Septoria myrti',
    category: 'fungal',
    severity: 'medium',
    targetCropIds: ['myrtle_hamblas'],
    visualSymptomsAr: [
      'بقع دائرية إلى بيضاوية بنية محمرة أو أرجوانية بمركز رمادي شاحب على نصل أوراق الحمبلاس',
      'ظهور حافة أرجوانية أو كستنائية داكنة تحيط بكل بقعة',
      'اصفرار الأنسجة المحيطة بالبقع وسقوط الأوراق السفلية بكثافة',
      'فقدان الشجيرة لمظهرها الجمالي الأخضر اللامع وضعف المحصول العطري والثمري'
    ],
    descriptionAr: 'مرض تبقع شائع في غابات وحدائق الساحل السوري على شجيرات الحمبلاس والآس، يشتد بعد الأمطار الربيعية والخريفية الرطبة.',
    favorableConditionsAr: 'رطوبة جوية مرتفعة، أمطار متكررة، ودرجات حرارة بين 18-26 مئوية.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
    ],
    identificationTipsAr: [
      'بقع دائرية ذات حافة حمراء أرجوانية مميزة على أوراق الآس الجلدية.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'rust', 'yellow'],
      spotTexture: 'concentric_rings',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 5. الزَّيْتُون السَّاحِلِي (OLIVE - الخضيري، الدعيبلي، الصوراني) ---
  // =========================================================================
  {
    id: 'olive_peacock_spot_syria',
    nameAr: 'تبقع عين الطاووس في زيتون الساحل السوري (الخضيري والدعيبلي)',
    nameEn: 'Olive Peacock Spot (Spilocaea oleaginea)',
    scientificName: 'Spilocaea oleaginea / Cycloconium oleaginum',
    category: 'fungal',
    severity: 'high',
    targetCropIds: ['olive'],
    visualSymptomsAr: [
      'بقع دائرية داكنة محاطة بهالة صفراء ذهبية تشبه ريشة ذيل الطاووس على الوجه العلوي للورقة',
      'تحول نصل الأوراق المصابة إلى اللون الأصفر وسقوط الأوراق السفلية والداخلية بكثافة',
      'تعري أفرع الشجرة وعجزها عن التزهير وعقد المحصول في الموسم القادم',
      'حساسية عالية لصنفي الزيتون الساحلي (الخضيري والدعيبلي) في مناطق طرطوس واللاذقية الرطبة'
    ],
    descriptionAr: 'أخطر الأمراض الفطرية على أشجار الزيتون في الساحل السوري وجباله. ينشط في الخريف والربيع في بساتين جبلة، بانياس، الدريكيش، صافيتا، والحفة، ويؤدي إلى تعري الأشجار من أوراقها تماماً.',
    favorableConditionsAr: 'أيام خريفية وربيعية ماطرة ورطبة مع درجات حرارة بين 14-20 مئوية وتكاثف قطرات الندى.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'التقليم الهوائي المناسب والتخلص من النموات المتشابكة المظللة.',
      'جمع وحرق الأوراق المتساقطة المصابة تحت الأشجار لأنها مصدر اللقاح الأولي.'
    ],
    identificationTipsAr: [
      'دوائر بنية محاطة بهالة صفراء ذهبية فاقعة كعين الطاووس على وجه الورقة.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'yellow', 'black'],
      spotTexture: 'concentric_rings',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 6. بَنَدُورَة وبَطَاطَا السَّاحِل السُّورِي (محمية ومكشوفة: بانياس وعمريت وعكار) ---
  // =========================================================================
  {
    id: 'tomato_early_blight_syria',
    nameAr: 'اللفحة المبكرة في الطماطم الساحلية (Alternaria)',
    nameEn: 'Early Blight (Alternaria solani)',
    scientificName: 'Alternaria solani',
    category: 'fungal',
    severity: 'high',
    targetCropIds: ['tomato', 'potato', 'bell_pepper'],
    visualSymptomsAr: [
      'بقع بنية داكنة بحلقات دائرية متداخلة كهيكل الهدف الرماي (Target spots)',
      'هالة صفراء تحيط بالبقع النخرية على الأوراق السفلية والقديمة',
      'جفاف الأوراق تدريجياً واحتراقها مما يعرض الثمار لضربة الشمس',
      'بقع غائرة داكنة على ساق النبات وقرب عنق الثمرة'
    ],
    descriptionAr: 'شائعة جداً في البيوت المحمية في بانياس وعمريت وجبلة وسهل عكار نتيجة التكثيف والرطوبة العالية. تصيب الطماطم والبطاطس بكثرة.',
    favorableConditionsAr: 'حرارة بين 22-28 مئوية مع رطوبة عالية في البيوت البلاستيكية وندى مستمر.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'تجنب الري الرأسي أو تبليل المجموع الخضري بالماء والاعتماد على التنقيط.',
      'استخدام الملش البلاستيكي الأرضي لمنع تطاير الجراثيم من التربة إلى الأوراق.'
    ],
    identificationTipsAr: [
      'حلقات دائرية متحدة المركز تشبه لوحة الهدف داخل البقعة البنية.'
    ],
    visionSignatures: {
      dominantHues: ['brown', 'yellow', 'black'],
      spotTexture: 'concentric_rings',
      targetPart: 'leaf'
    }
  },
  {
    id: 'tuta_absoluta_syria',
    nameAr: 'توتا أبسلوتا (حافرة أنفاق الطماطم في البيوت البلاستيكية الساحلية)',
    nameEn: 'Tomato Leafminer (Tuta absoluta)',
    scientificName: 'Tuta absoluta',
    category: 'pest',
    severity: 'critical',
    targetCropIds: ['tomato', 'potato', 'bell_pepper'],
    visualSymptomsAr: [
      'أنفاق وبقع فضية شفافة عريضة مفرغة بين بشرتي ورقة الطماطم',
      'تجمع فضلات وبراز اليرقات الأسود أو البني المحبب بوضوح داخل الأنفاق المفرغة',
      'ثقوب نخرية عند مدخل الثمار وتحت الكأس الزهري تسبب العفن وتساقط البندورة',
      'مظهر كأن المحصول تعرض لحريق في حالات الإصابة الشديدة المهملة'
    ],
    descriptionAr: 'الآفة الأكثر تدميراً لمحصول البندورة المحمية في الساحل السوري (بانياس وعمريت وسهل ميعار شاكر). تتغذى يرقاتها بشراهة على الأوراق والقمم والثمار.',
    favorableConditionsAr: 'حرارة معتدلة إلى دافئة (20-30 مئوية) في البيوت المحمية الساحلية وتوفر العائل الباذنجاني.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'تركيب شباك مانعة للحشرات 50 مش على فتحات تهوية البيوت المحمية وأبواب مزدوجة محكمة.',
      'إزالة بقايا المحصول السابق فور انتهاء الموسم وحرقها خارج الحقل.'
    ],
    identificationTipsAr: [
      'أنفاق مفرغة شفافة عريضة مليئة بحبيبات براز سوداء مميزة.'
    ],
    visionSignatures: {
      dominantHues: ['white', 'brown', 'black'],
      spotTexture: 'chewed_holes',
      targetPart: 'leaf'
    }
  },

  // =========================================================================
  // --- 7. القَمْح وَالأَصْدَاء (WHEAT RUST - سهول عكار وجبلة والداخل) ---
  // =========================================================================
  {
    id: 'wheat_stripe_rust_syria',
    nameAr: 'صدأ القمح المخطط والأصفر في سهول الساحل والداخل',
    nameEn: 'Wheat Stripe Rust',
    scientificName: 'Puccinia striiformis',
    category: 'fungal',
    severity: 'critical',
    targetCropIds: ['wheat'],
    visualSymptomsAr: [
      'بثرات أو خطوط صفراء كبريتية وبرتقالية متوازية مع عروق ورقة القمح',
      'انتقال بودرة صفراء تلتصق بأصابع اليد كالغبار الكبريتي عند ملامسة الحقل',
      'جفاف الأوراق واحتراقها وضمور الحبوب داخل السنابل ونقص المحصول حتى 70%'
    ],
    descriptionAr: 'يهاجم محصول القمح في سهول عكار وجبلة والداخل السوري خلال الشتاء والربيع الرطب. ينتقل عبر الرياح بسرعة وبائية.',
    favorableConditionsAr: 'طقس رطب، ليالٍ باردة مشبعة بالندى (10-18 مئوية) مع رياح ربيعية تنقل الأبواغ.',
    organicTreatmentAr: [],
    chemicalTreatments: [],
    preventiveMeasuresAr: [
      'زراعة الأصناف المعتمدة من مراكز البحوث العلمية الزراعية السورية المقاومة للصدأ الأصفر (مثل شام ودوما).'
    ],
    identificationTipsAr: [
      'خطوط طولية صفراء وبرتقالية منتظمة كالمساطر على نصل ورقة القمح.'
    ],
    visionSignatures: {
      dominantHues: ['rust', 'yellow'],
      spotTexture: 'scattered_dots',
      targetPart: 'leaf'
    }
  }
];

// =========================================================================
// --- قَائِمَة المَحَاصِيل مَعَ التَّرْكِيز عَلَى السَّاحِل السُّورِي ---
// =========================================================================
export const CROPS_DATABASE: Crop[] = [
  {
    id: 'french_grape_leaf',
    nameAr: 'ورق العنب الفرنسي (كرمات الساحل وجباله)',
    nameEn: 'French Grapevine Leaf',
    scientificName: 'Vitis vinifera (French cultivars)',
    categoryAr: 'محاصيل الساحل السوري',
    icon: '🍇',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'جبال ووديان الساحل: مشتى الحلو، صافيتا، كسب، الدريكيش، الحفة، وريف اللاذقية',
    descriptionAr: 'صنف راقٍ ومطلوب جداً في الساحل السوري لإنتاج أوراق العنب الفاخرة للطبخ (اليبرق والمحاشي) وعناقيد المائدة. حساس لرمد العنب (البياض الدقيقي) والميلديو في فترات الرطوبة الساحلية.',
    optimalTemperatureAr: '18 - 28 مئوية',
    wateringAdviceAr: 'ري معتدل، وتقليم توريقي مستمر لتهوية العرائش في الوديان الساحلية المشبعة بالرطوبة.',
    commonDiseaseIds: [
      'grape_powdery_mildew',
      'grape_downy_mildew',
      'grape_leaf_blister_mite'
    ]
  },
  {
    id: 'citrus_syrian',
    nameAr: 'الحمضيات السورية (الساحلية: حامض، برتقال، كلمنتينا)',
    nameEn: 'Syrian Coastal Citrus',
    scientificName: 'Citrus limon / Citrus sinensis',
    categoryAr: 'محاصيل الساحل السوري',
    icon: '🍋',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'سهول الساحل السوري: طرطوس، اللاذقية، جبلة، بانياس، وسهل عكار',
    descriptionAr: 'عماد الاقتصاد الزراعي في الساحل السوري (الحامض البلدي، البرتقال أبو صرة، والكلمنتينا والماير). تتطلب حماية صارمة من المينوز، ذبابة الفاكهة (الميدفلاي)، والتصمغ الصمغي الفيتوفثورا.',
    optimalTemperatureAr: '20 - 32 مئوية',
    wateringAdviceAr: 'ري منتظم بالتنقيط أو الأحواض الحلقية مع تجنب ملامسة الماء لجذع الشجرة منعاً لمرض التصمغ.',
    commonDiseaseIds: [
      'citrus_leafminer_syria',
      'citrus_gummosis_syria',
      'citrus_medfly_syria',
      'citrus_chlorosis_syria'
    ]
  },
  {
    id: 'walnut',
    nameAr: 'شجرة الجوز (جبال اللاذقية وصلنفة وكسب ومشتى الحلو)',
    nameEn: 'Walnut Tree (Juglans regia)',
    scientificName: 'Juglans regia',
    categoryAr: 'أشجار جبلية وغابات',
    icon: '🪵',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'المرتفعات الجبلية الساحلية: صلنفة، كسب، مشتى الحلو، القدموس، وقمم اللاذقية وطرطوس',
    descriptionAr: 'شجرة معمرة مباركة تشتهر بها مصايف ومرتفعات الساحل السوري. تتميز بجودة خشبها وثمارها الغنية، لكنها مهددة بمرض الأنثراكنوز الفطري ودودة الثمار واللفحة البكتيرية في مواسم الضباب.',
    optimalTemperatureAr: '15 - 26 مئوية',
    wateringAdviceAr: 'تحتاج لتربة عميقة جيدة الصرف وري تكميلي منتظم في فترات الصيف الجبلي الجاف.',
    commonDiseaseIds: [
      'walnut_anthracnose_syria',
      'walnut_codling_moth_syria',
      'walnut_bacterial_blight_syria'
    ]
  },
  {
    id: 'myrtle_hamblas',
    nameAr: 'الحَمْبَلَاس (الآس الساحلي - ريحان الساحل السوري)',
    nameEn: 'Myrtle / Hamblas (Myrtus communis)',
    scientificName: 'Myrtus communis',
    categoryAr: 'محاصيل الساحل السوري',
    icon: '🌿',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'سائر أرياف وغابات الساحل السوري من وادي قنديل إلى أرواد وصافيتا وعكار',
    descriptionAr: 'شجيرة الآس الأيقونية في الساحل السوري، تسمى محلياً "الحمبلاس". تتميز بأوراقها الجلدية العطرية وثمارها الزرقاء والبيضاء المحبوبة. تصاب بالبياض الدقيقي وتبقع الأوراق الفطري.',
    optimalTemperatureAr: '16 - 28 مئوية',
    wateringAdviceAr: 'شجيرة قوية تتحمل الجفاف الساحلي لكن الري المعتدل يزيد من حلاوة الثمار ونضارة الأوراق العطرية.',
    commonDiseaseIds: [
      'hamblas_powdery_mildew',
      'hamblas_leaf_spot_syria'
    ]
  },
  {
    id: 'olive',
    nameAr: 'الزيتون الساحلي (الخضيري، الدعيبلي، الصوراني)',
    nameEn: 'Coastal Syrian Olive',
    scientificName: 'Olea europaea',
    categoryAr: 'أشجار مثمرة',
    icon: '🫒',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'تلال وسفوح الساحل: جبلة، بانياس، الدريكيش، صافيتا، والحفة',
    descriptionAr: 'من أقدم وأعرق أشجار الساحل السوري التي تنتج أطيب زيت زيتون خضيري. تتأثر بشدة بمرض تبقع عين الطاووس في الفصول الماطرة.',
    optimalTemperatureAr: '18 - 30 مئوية',
    wateringAdviceAr: 'ري تكميلي في حزيران وتموز لتحسين امتلاء حبات الزيتون ونسبة الزيت.',
    commonDiseaseIds: [
      'olive_peacock_spot_syria'
    ]
  },
  {
    id: 'tomato',
    nameAr: 'الطماطم المحمية والمكشوفة (بانياس، عمريت، سهل عكار)',
    nameEn: 'Tomato (Protected & Open Field)',
    scientificName: 'Solanum lycopersicum',
    categoryAr: 'خضروات',
    icon: '🍅',
    isSyrianCoastSpecialty: true,
    syrianCoastRegionAr: 'مجمعات البيوت البلاستيكية: بانياس، عمريت، ميعار شاكر، وسهل عكار',
    descriptionAr: 'عاصمة الزراعة المحمية في سورية، توفر الطماطم على مدار العام. تواجه ضغطاً كبيراً من حشرة التوتا أبسلوتا واللفحة المبكرة وفيروس التجعد.',
    optimalTemperatureAr: '20 - 28 مئوية',
    wateringAdviceAr: 'ري تنقيط صباحي محسوب لتجنب الرطوبة الزائدة داخل البيوت البلاستيكية.',
    commonDiseaseIds: [
      'tomato_early_blight_syria',
      'tuta_absoluta_syria'
    ]
  },
  {
    id: 'wheat',
    nameAr: 'القمح (سهول عكار وجبلة والداخل السوري)',
    nameEn: 'Syrian Wheat (Triticum)',
    scientificName: 'Triticum durum / T. aestivum',
    categoryAr: 'حبوب',
    icon: '🌾',
    isSyrianCoastSpecialty: false,
    syrianCoastRegionAr: 'سهول عكار وجبلة وسهول حماة وحلب والجزيرة',
    descriptionAr: 'محصول استراتيجي في سورية (أصناف بحوث شام ودوما)، يتطلب مراقبة مستمرة لصدأ القمح الأصفر والمخطط في الربيع.',
    optimalTemperatureAr: '12 - 22 مئوية',
    wateringAdviceAr: 'ريات حاسمة ومدروسة أثناء التفريع وطرد السنابل.',
    commonDiseaseIds: [
      'wheat_stripe_rust_syria'
    ]
  }
];

// Curated sample test leaves for instant offline AI verification
export const SAMPLE_TEST_LEAVES = [
  {
    titleAr: 'ورق عنب فرنسي: رَمَد العنب (بياض دقيقي)',
    cropId: 'french_grape_leaf',
    expectedDiseaseId: 'grape_powdery_mildew',
    previewColor: '#e2e8f0',
    descAr: 'ورقة عنب فرنسي مغبرة بمسحوق أبيض طباشيري (الرمد الشائع في كرمات الساحل ومشتى الحلو)',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="#1c1917"/>
      <!-- French Grape Palmate Leaf -->
      <path d="M 200 60 C 230 40, 270 60, 300 80 C 340 120, 350 180, 310 240 C 350 280, 330 340, 280 350 C 250 360, 220 340, 200 370 C 180 340, 150 360, 120 350 C 70 340, 50 280, 90 240 C 50 180, 60 120, 100 80 C 130 60, 170 40, 200 60 Z" fill="#15803d"/>
      <!-- Vein Structure -->
      <path d="M 200 370 L 200 70" stroke="#86efac" stroke-width="5" fill="none"/>
      <path d="M 200 280 L 290 120" stroke="#86efac" stroke-width="4" fill="none"/>
      <path d="M 200 280 L 110 120" stroke="#86efac" stroke-width="4" fill="none"/>
      <path d="M 200 310 L 290 270" stroke="#86efac" stroke-width="3" fill="none"/>
      <path d="M 200 310 L 110 270" stroke="#86efac" stroke-width="3" fill="none"/>
      <!-- Powdery Mildew White Mats (الرمد الساحلي) -->
      <circle cx="210" cy="180" r="45" fill="#f8fafc" opacity="0.85"/>
      <circle cx="270" cy="210" r="38" fill="#f1f5f9" opacity="0.8"/>
      <circle cx="140" cy="200" r="40" fill="#ffffff" opacity="0.82"/>
      <circle cx="170" cy="270" r="32" fill="#f8fafc" opacity="0.75"/>
      <circle cx="240" cy="280" r="30" fill="#e2e8f0" opacity="0.78"/>
    </svg>`
  },
  {
    titleAr: 'حمضيات الساحل: مينوز (صانعة أنفاق الأوراق)',
    cropId: 'citrus_syrian',
    expectedDiseaseId: 'citrus_leafminer_syria',
    previewColor: '#f1f5f9',
    descAr: 'ورقة ليمون ساحلية حديثة تظهر أنفاقاً فضية مفرغة متعرجة والتواء حواف الورقة',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="#18181b"/>
      <!-- Citrus Leaf blade -->
      <path d="M 200 40 C 310 90, 320 250, 240 350 C 210 380, 200 390, 195 390 C 190 390, 180 380, 150 350 C 70 250, 80 90, 190 40 Z" fill="#16a34a"/>
      <path d="M 195 50 Q 195 220 195 380" stroke="#86efac" stroke-width="5" fill="none"/>
      <!-- Serpentine Leafminer Mines (أنفاق المينوز الفضية) -->
      <path d="M 180 100 Q 240 120 220 160 T 270 220 T 210 270 T 260 320" stroke="#f8fafc" stroke-width="8" fill="none" opacity="0.9" stroke-linecap="round"/>
      <path d="M 170 140 Q 120 170 140 210 T 110 260 T 150 310" stroke="#f8fafc" stroke-width="7" fill="none" opacity="0.85" stroke-linecap="round"/>
      <!-- Curled and deformed leaf margin -->
      <path d="M 260 320 Q 290 350 250 370" stroke="#ca8a04" stroke-width="4" fill="none"/>
    </svg>`
  },
  {
    titleAr: 'شجرة الجوز: أنثراكنوز وتبقع أوراق الجوز',
    cropId: 'walnut',
    expectedDiseaseId: 'walnut_anthracnose_syria',
    previewColor: '#78350f',
    descAr: 'بقع بنية داكنة محاطة بهالة صفراء على وريقة جوز من جبال صلنفة ومشتى الحلو',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <defs>
        <radialGradient id="walnutSpot" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#180c02" />
          <stop offset="40%" stop-color="#451a03" />
          <stop offset="75%" stop-color="#78350f" />
          <stop offset="100%" stop-color="#facc15" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="#292524"/>
      <!-- Walnut Oval Compound Leaflet -->
      <path d="M 200 40 C 320 80, 330 250, 250 360 C 220 380, 200 390, 195 390 C 190 390, 170 380, 140 360 C 60 250, 70 80, 190 40 Z" fill="#15803d"/>
      <line x1="195" y1="45" x2="195" y2="385" stroke="#a7f3d0" stroke-width="6"/>
      <!-- Anthracnose Spots on Walnut -->
      <circle cx="240" cy="160" r="36" fill="url(#walnutSpot)"/>
      <circle cx="240" cy="160" r="24" fill="none" stroke="#291203" stroke-width="3"/>
      <circle cx="140" cy="230" r="30" fill="url(#walnutSpot)"/>
      <circle cx="140" cy="230" r="18" fill="none" stroke="#291203" stroke-width="2.5"/>
      <circle cx="230" cy="280" r="22" fill="url(#walnutSpot)"/>
    </svg>`
  },
  {
    titleAr: 'الحمبلاس (الآس): تبقع وبياض أوراق الحمبلاس',
    cropId: 'myrtle_hamblas',
    expectedDiseaseId: 'hamblas_leaf_spot_syria',
    previewColor: '#991b1b',
    descAr: 'أوراق حمبلاس ساحلية جلدية صغيرة عليها بقع كستنائية وبودرة بيضاء خفيفة',
    svgData: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
      <rect width="400" height="400" fill="#1e1b4b"/>
      <!-- Twig with small lanceolate Myrtle leaves -->
      <path d="M 200 380 Q 200 200 200 30" stroke="#78350f" stroke-width="8" fill="none"/>
      <!-- Leaf 1 -->
      <path d="M 200 280 C 270 260, 300 210, 290 170 C 250 180, 210 230, 200 280 Z" fill="#15803d"/>
      <!-- Leaf 2 -->
      <path d="M 200 220 C 130 200, 100 150, 110 110 C 150 120, 190 170, 200 220 Z" fill="#15803d"/>
      <!-- Leaf 3 -->
      <path d="M 200 150 C 260 130, 280 80, 270 50 C 230 60, 210 100, 200 150 Z" fill="#15803d"/>
      <!-- Reddish Cercospora spots on leaf 1 -->
      <circle cx="260" cy="200" r="16" fill="#881337" stroke="#facc15" stroke-width="2"/>
      <circle cx="240" cy="225" r="12" fill="#881337" stroke="#facc15" stroke-width="1.5"/>
      <!-- Powdery dusting -->
      <circle cx="150" cy="140" r="18" fill="#f8fafc" opacity="0.8"/>
      <circle cx="245" cy="80" r="14" fill="#f8fafc" opacity="0.75"/>
    </svg>`
  }
];
