# تقرير بوابة الجاهزية Phase 0 — Dr.Plant

**تاريخ الحالة:** 2026-11-27
**حالة تدقيق قرارات البيانات: مغلق ضمن النطاق الحالي**
**قرار Phase 0 الكلي: NO-GO — لا يبدأ التدريب الهجين أو Phase 1 بعد.**

## 1. تدقيق مجموعات البيانات

- أُغلق سجل 16 مجموعة في `research/data-audit.csv`: **2 APPROVED بنطاق بحثي ضيق، و14 REJECTED** للتدريب التشخيصي الحالي.
- APPROVED:
  - `citrus_field_v3`: تصنيف أعراض بحثي فقط؛ 610 صورة، 14 شجرة، tree-disjoint train/val/test؛ اختبار `verify-splits.py` PASS دون تداخل Tree_ID. توجد صورة واحدة متعارضة Tree_ID في المصدر وتم عزلها.
  - `vitis_morphology`: تمثيل شكل/صنف فقط، لا تشخيص مرض؛ 504 صور/272 مجموعة كرمة/125 صنفاً في المرجع، والـpilot على 127 صورة/63 مجموعة/14 صنفاً باستخدام 3-fold StratifiedGroupKFold. فحص تعيين المجموعة إلى fold على OOF manifest PASS.
- 14 مجموعة مرفوضة للتدريب الحالي بأسباب محددة: حقوق/مصدر غير محسوم، عدم ملاءمة المحصول، غياب معرفات بيولوجية، تسرب صورة/مصدر، تحيز كاميرا، أو تسميات غير متجانسة.
- **تصحيح جوهري:** Citrus Zenodo V1 ليس مفقود الترخيص؛ Zenodo API يعلن CC BY 4.0. الرفض الحالي بسبب غياب معرفات الأشجار والمراجعة الخبيرة، لا بسبب الترخيص.
- **تصحيح جوهري:** BPLD هو Blackgram (Vigna mungo)، وليس مجموعة عنب/حمضيات؛ Leaf Crinkle فيها لا ينقل إلى محصول آخر.
- PlantTom: 4,819 صورة أصلية؛ 7,836 بعد augmentation؛ 9,352 object instances، لا 9,352 صورة أصلية.
- FieldPlant: 5,170 صورة و8,629 leaf annotations وفق الورقة؛ هذا لا يثبت lesion pixel masks.
- GVLiD V5: المصدر 3,477 صورة/4 فئات؛ النموذج الموجود استخدم subset من 1,323 صورة/فئتين فقط. عُثر لاحقاً على `split-manifest.csv` في فرع أرشيف GVLiD؛ لكنه إعادة بناء deterministic من vineyard assignments الموثقة، وليس ملف التقسيم الأصلي من وقت التدريب. اجتاز فحص metadata group/hash، بينما ملفات الصور الأصلية غير موجودة في مساحة العمل الحالية؛ لذلك لا يُعد اجتيازاً لبوابة الملفات.

## 2. Gold Masks

- `research/gold-masks-review.md` يوثق أن عدد Gold masks البشرية المثبتة = **0** حتى الآن.
- حزمة 24 صورة عنب أقنعة ورقية آلية مرشحة للمراجعة، وليست lesion masks ولا Gold masks.
- لا توجد أقنعة آفات معتمدة للعنب أو الحمضيات أو البندورة؛ تجزئة الآفة ممنوعة حالياً.

## 3. التسميات

- `public/models/plant-disease/labels.json` يساوي `[]`، أي صفر disease IDs.
- أُنشئ `research/label-map.json` مع قوائم الفئات المصدرية المتاحة، لكن كل app IDs غير قابلة للتعيين حالياً. الحالة `BLOCKED_NO_APP_DISEASE_IDS` و`activation_allowed=false`.
- لم تُخترع IDs ولم تُدمج أعراض أو آفات أو نقص غذائي في disease classes.

## 4. التقسيم المستقل

- `scripts/research/verify-splits.py` أُنشئ كمدقق fail-closed.
- Citrus Field V3: tree/SHA/image checks PASS على 610 سجلات و14 tree IDs، لكن pHash audit كشف 5 أزواج قرب (منها cross-split/cross-label)، لذلك split gate النهائي FAIL حتى المراجعة.
- Vitis morphology OOF: PASS على 127 سجلاً و63 مجموعة كرمة، لا تتوزع المجموعة على أكثر من fold.
- بقية مجموعات المرض لا تملك دليلاً بيولوجياً كافياً لاجتياز البروتوكول المحدد؛ بعضها لا يتوفر له tree/vine/site/source IDs. NGLD V5 يستخدم pHash-cluster grouping لا holdout حسب vineyard/plant/site؛ لا تعتبر pHash-only استقلالاً بيولوجياً.

## قرار البوابة — فصل البحث عن الإنتاج

**الحالة العامة الحالية: NO-GO**؛ لا يوجد حتى الآن profile بيانات/مهمة مكتمل وموقّع يحقق بوابة التدريب الجديدة.

لكن لا نخلط بين صلاحية التجربة البحثية واعتماد نموذج الإنتاج:

1. **Research Training GO** يُقيّم لكل dataset/task على حدة بعد إثبات سلامة الملفات والتوقيعات والترخيص والمراجعة البشرية وخريطة التصنيفات واستقلالية المجموعات وكشف النسخ القريبة. لا تشترط هذه البوابة وجود App disease IDs إذا كان الهدف تجربة بحثية موثقة، وكانت الفئات مرتبطة بـEPPO أو مصنفة صراحةً كفئات غير مرضية.
2. **Gold Masks** شرط فقط للمهام التي تعتمد عليها: `lesion_mask` لتدريب segmentation، و`leaf_mask` للمهام التي تستخرج الشكل من قناع ورقة. لا تمنع غيابها تدريب تصنيف صور لا يستخدم الأقنعة.
3. **Production activation** تبقى NO-GO حتى وجود App IDs معتمدة داخل `labels.json`، وربط كل فئات النموذج، والمعايرة والعتبات الخاصة بكل محصول، والتحقق الحقلي المناسب، ومراجعة السلامة. لا تتحول نتائج Research GO إلى تشخيص إنتاجي تلقائياً.
4. **Hybrid adoption GO** قرار لاحق بعد تجارب Ablation المستقلة وإثبات قيمة الفروع إحصائياً وعملياً؛ ليس شرطاً قبل أول تجربة بحثية.

لا تعديل على `main` أو manifest الإنتاج، ولا تفعيل أي نموذج.

## تحديث قوالب manifests — 2026-11-27

أُضيفت قوالب CSV فارغة للعنب والحمضيات والبندورة في `research/manifests/templates/` مع تعريف موحد للأعمدة وقواعد ملء موثقة في `research/manifests/README.md`. هذه قوالب فقط وليست manifests بيانات معتمدة ولا تغيّر حالة أي صف في `data-audit.csv`.

- الحمضيات: يوجد manifest فعلي سابق لـ Citrus Field V3 في `results/citrus-field-v3/manifest.csv` (610 صورة، 14 معرف شجرة، تقسيم 332/144/134). عُثر لاحقاً على الصور في نسخة الاستعادة الأخرى، وأُعيد حساب SHA-256 والتحقق من قابلية قراءة الملفات. بقي manifest النموذج المرجع؛ لا نستخدم `recommended_partition.csv` المختلف الذي يفشل tree-disjoint.
- العنب: يوجد `data/vitis-morphology/image-manifest.csv` يحوي مجموعات كروم وبصمات SHA-256، لكنه يصف صور تصنيف الأصناف ولا يمثل تقسيم تدريب مرضي. لا يُحوّل إلى manifest أمراض.
- البندورة: لم يُعثر على manifest صور مصدر قابل لإعادة التحقق في مساحة العمل الحالية؛ القالب ينتظر الأصول والوسوم الأصلية.

عُزّز `verify-splits.py` ليفشل عند manifest فارغ، ويدعم فحص وجود الملفات عبر `--image-root`، ويفرض train/val/test اختيارياً عبر `--require-all-splits`. SHA-256 موثق على أنه exact-duplicate hash فقط، وليس perceptual hash. اختبارات أدوات الاستخراج والتقسيم وpHash: 15/15 ناجحة.

**الحالة:** القوالب جاهزة للتعبئة؛ لم يُعلن PASS جديد ولم تتغير بوابة Phase 0 إلى GO.


## تحديث أداة الاستخراج وفحص الأصول — 2026-11-27

- أضيف `scripts/research/extract-manifest.py` لتوحيد CSV/JSON مع الاحتفاظ الحرفي بـgroup IDs والوسوم والتقسيمات، ودعم `path_map.json` (مسارات exact أو prefixes). لا يخترع معرفات أو بصمات. مع `--verify-images` يشترط وجود كل صورة ويعيد حساب SHA-256 من bytes الفعلية.
- أضيفت اختبارات مستقلة للأداة وملف `research/manifests/path_map.example.json`.
- استُخرج Citrus Field V3 إلى `research/manifests/staging/citrus-field-v3.csv`: 610 سجلات، 14 `tree_id`، وتوزيع 332/144/134. بعد العثور على الأصول في نسخة الاستعادة الأخرى أُعيد حساب 610 SHA-256 من الملفات، واجتاز فحص الصور والمجموعات والبصمات الحرفية. فحص pHash المستقل نُفّذ بعد ذلك: ظهر 5 أزواج متقاربة (4 داخل split وواحد train/val)؛ لذلك فحص SHA/group PASS لا يعني اكتمال منع التسرب.
- عُثر على الصور الـ610 في نسخة الاستعادة `/workspace/dr-plant/data/external/2026-11/citrus-field-v3/Field-Based Citrus Leaf Disease Image Dataset/Moroccan Citrus Leaf Dataset`. أُعيد حساب SHA-256 من كل ملف، وفحص الصور + tree IDs + exact hashes أعطى **PASS**. تقسيم manifest النموذج tree-held-out: 9 أشجار train و3 val و2 test.
- **تمييز ضروري:** `recommended_partition.csv` الأصلي منفصل عن manifest التدريب؛ يستخدم `Group_ID` على مستوى الورقة ويضع الأشجار نفسها عبر splits. فحصه باستخدام `Tree_ID` أعطى FAIL؛ لذلك لم نستخدمه. manifest النموذج المنقح هو الذي اجتاز tree-disjoint. الصف المتعارض `IMG_0405` (metadata T07 مقابل path T08) معزول مسبقاً. لا يزال هذا benchmark من بستان مغربي واحد وليس تحققاً سورياً. جميع الصور الـ610 نجحت في ImageMagick decode check؛ pHash/near-duplicate audit أظهر 5 أزواج تتطلب مراجعة، منها زوج train/val متعارض الوسم؛ بوابة الحمضيات FAIL مؤقتاً.
- عُثر على الأرشيفات كفروع Git: `archive/gvlid-v5-vineyard-holdout-2026-11-27` و`archive/ngld-v5-training-log-2026-11-27` و`archive/source-specific-models-and-coastal-evidence-2026-11-27`.
- GVLiD V5: استُخرجت مؤقتاً 1,323 صورة فعلية (Esca/Healthy) من `GVLiD.rar` في Drive، ثم حُققت كل صورة: 1,323/1,323 SHA-256 تطابق manifest الأرشيف، و1,323/1,323 أسماء/فئات تطابق source metadata. فحص المجموعة والبصمات والملفات أعطى PASS، وpHash DCT عند Hamming ≤5 أعطى صفر near-duplicate pairs أو cross-split pairs. النسبة الفعلية 72.0%/14.7%/13.2% بالصور، مع 20/4/4 بساتين؛ لم نفرض 70/15/15. لكن per-image split أُعيد بناؤه deterministic من 4 test و4 validation vineyards، ولم يكن الملف الأصلي موجوداً في ZIP؛ لذلك يبقى reconstruction موثقاً لا original split. كما أن SHA للأرشيف المضغوط نفسه يختلف عن archive-level SHA في تقرير التدقيق السابق، مع تطابق hashes لكل الصور الـ1,323 المختارة؛ وثّق ذلك في `gvlid-drive-archive-check.json`.
- NGLD V5: split groups من نوع `ngld-phash-audit-*`/pHash clusters. توثيق التدريب يصرّح بعدم وجود vineyard/plant/session IDs، ولذلك لا يُستخدم هذا الملف لإثبات vineyard-disjoint للعنب أو source/site-disjoint للبندورة. بقي baseline استكشافياً فقط.
- البندورة: لم نجد PlantTom أو FieldPlant source manifests في فروع الأرشيف المفحوصة، كما لم تُظهر عملية البحث بالاسمين في Google Drive أي نتائج. يوجد PlantVillage tomato manifest، لكنه مصدر lab-image ولا يُستبدل به PlantTom/FieldPlant field data. لم ننشئ tomato manifest.
- خريطة `research/manifests/path_map.gvlid.json` تسجل تحويل `esca/` و`healthy/` إلى `DATASET/...` داخل أرشيف Drive؛ استُخدمت فعلياً لاستخراج subset العنب والتحقق منه. بقي `path_map.example.json` نموذجاً عاماً فقط. أُزيلت نسخة RAR والصور المستخرجة المؤقتة بعد اكتمال الفحص لتوفير مساحة السحابة؛ الأصل ما زال في Drive.
- التسميات: `public/models/plant-disease/labels.json` ما زال `[]` (صفر app disease IDs). `research/label-map.json` يحتوي source classes، لكنه لا يستطيع تعيين app IDs؛ لا يجوز إنشاء `extract-labels.py` ليخترع IDs أو تفعيل أي mapping. الحالة `BLOCKED_NO_APP_DISEASE_IDS` كما هي.
- لا تزال قوالب العنب والحمضيات والبندورة دون manifests نهائية مجمدة: العنب اجتاز فحوص الصور/المجموعات/pHash لكنه يستخدم split معاد البناء؛ الحمضيات فشلت في pHash cross-split review؛ والبندورة تنتظر PlantTom/FieldPlant. ولا تغيير في قرار Phase 0: **NO-GO**.


## بوابة التدريب الآلية — 2026-11-27

أضيفت مواصفات v1 وفاحص fail-closed في `scripts/research/validate-training-gate.py` مع اختبارات تكامل، وComposite Action لاستخدامه داخل GitHub Actions، وworkflow يدوي باسم `Dr.Plant training readiness`. كما أضيف حارس إلزامي إلى 12 نقطة دخول تدريب Python و6 دفاتر Colab الحالية: لا تبدأ دون `--training-profile` و`--training-profile-signature` و`--training-data-root` و`--training-trusted-public-key`، ويجب أن ينجح فحص التوقيعات والبصمات والترخيص والتصنيفات والتقسيمات ومتطلبات الأقنعة حسب المهمة.

**هذه خطوة تنفيذية للبنية، وليست إغلاقاً لPhase 0.** لا يوجد حتى الآن profile بيانات فعلي مكتمل وموقّع يحقق شروط `RESEARCH-GO`، كما لا تزال الأقنعة الذهبية غير متوفرة لمهام segmentation. ولا يوجد تقرير Ablation مستقل؛ لذلك `hybrid_adoption_allowed=false` حتى بعد أي `RESEARCH-GO`. يلزم تشغيل الاختبارات وCI على الفرع، ثم إعداد profiles موقعة لكل dataset/task من أصوله الفعلية.


## تحديث استقلال المجموعات الحقلية وبوابة التدريب — 2026-11-27

- دُمج PR #40 في الفرع البحثي `research/grape-morphology-fusion-2026-11-26`، مع تقوية مدقق Morphology V1: لا يكفي وجود `field_group_id` وحده؛ يلزم مصدر الهوية ومرجع دليل وبصمة SHA-256 ومراجع وحالة تحقق موثقة. أضيفت اختبارات مستقلة لهذه الشروط، وشُغّلت في CI بنجاح.
- دُمج PR #41 في الفرع البحثي `research/morphology-v1-repair-2026-11-27` بعد مزامنة فرعه مع إصلاح V1. بوابة Phase 0 أصبحت تتحقق من أن `group_id` ليس pHash أو SHA أو اسم الصورة، وأن كل صف يشير إلى سجل هوية JSON داخل جذر البيانات، وبصمة السجل وبصمة المصدر الأصلي تطابقان الملفات الفعلية، وأن `group_id` و`grouping_unit` والمراجع متطابقة مع profile الموقّع.
- أُضيفت اختبارات تكامل تغطي حالة profile صحيح، وتسرب المجموعة بين train/test، ومحاولة استعمال pHash كمعرف بيولوجي، والتلاعب ببصمة سجل الهوية. تشغيل GitHub Actions على الدمج البحثي: PASS؛ شملت اختبارات Morphology V1 واختبارات بوابة التدريب وفحوص دفاتر Colab ونقاط بدء التدريب والبناء.
- عُدّلت قوالب manifests للعنب والحمضيات والبندورة لتتضمن حقول إثبات الهوية، وأضيف مثال توثيقي لسجل الهوية.

**حدود الإثبات:** التوقيع والبصمات تثبت سلامة الملفات وهوية الجهة التي وقّعت الحزمة، لكنها لا تثبت وحدها أن معرف الكرمة/الشجرة/المزرعة صحيح واقعياً. يجب مراجعة سجلات المصدر الأصلية بشرياً، وعدم اعتماد `verified` دون دليل قابل للفحص.

**قرار المرحلة:** Phase 0 ما زالت **NO-GO**. لم يُقدّم بعد profile حقيقي مكتمل وموقّع وفق المخطط الجديد، وما زالت أزواج pHash الخمسة في Citrus Field V3 بحاجة إلى حسم، وGold Masks البشرية = صفر، و`labels.json` بلا disease IDs. لم يبدأ تدريب جديد.

**حماية الإنتاج:** لم يتغير `main`؛ بقي على commit `94f39cfb2b7de97e3d3a31c6d316abe179ca45c0`. بقي `manifest.json` على `enabled=false` و`reviewStatus=candidate`.
