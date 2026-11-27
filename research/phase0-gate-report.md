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
- Citrus Field V3: PASS على 610 سجلات، 14 tree IDs، صفر تداخل بين train/val/test.
- Vitis morphology OOF: PASS على 127 سجلاً و63 مجموعة كرمة، لا تتوزع المجموعة على أكثر من fold.
- بقية مجموعات المرض لا تملك دليلاً بيولوجياً كافياً لاجتياز البروتوكول المحدد؛ بعضها لا يتوفر له tree/vine/site/source IDs. NGLD V5 يستخدم pHash-cluster grouping لا holdout حسب vineyard/plant/site؛ لا تعتبر pHash-only استقلالاً بيولوجياً.

## قرار البوابة

**NO-GO.** أُغلقت قرارات قبول/رفض المرشحات، لكن هذا لا يغلق Phase 0 الكلي. يمنع بدء Phase 1 أو التدريب الهجين حتى:
1. توفير معرفات أمراض تطبيقية موثقة داخل `labels.json` ثم استكمال label-map بمراجعة علمية.
2. إنتاج Gold leaf masks وlesion masks بمراجعة بشرية مستقلة ومؤهلة وقياسات IoU/Dice/Boundary.
3. استكمال manifests وتقارير الاستقلال للمصادر المرشحة التي ستستخدم فعلياً في التدريب؛ لا يعاد فتح أي مصدر مرفوض بلا قرار جديد.

لا تعديل على `main` أو manifest الإنتاج، ولا تفعيل أي نموذج.

## تحديث قوالب manifests — 2026-11-27

أُضيفت قوالب CSV فارغة للعنب والحمضيات والبندورة في `research/manifests/templates/` مع تعريف موحد للأعمدة وقواعد ملء موثقة في `research/manifests/README.md`. هذه قوالب فقط وليست manifests بيانات معتمدة ولا تغيّر حالة أي صف في `data-audit.csv`.

- الحمضيات: يوجد manifest فعلي سابق لـ Citrus Field V3 في `results/citrus-field-v3/manifest.csv` (610 صورة، 14 معرف شجرة، تقسيم 332/144/134). بقي هو المصدر المرجعي؛ لم تُنسخ مسارات الصور أو تُخترع SHA-256 جديدة لأن ملفات الصور الأصلية غير موجودة في مساحة العمل الحالية للتحقق من البايتات.
- العنب: يوجد `data/vitis-morphology/image-manifest.csv` يحوي مجموعات كروم وبصمات SHA-256، لكنه يصف صور تصنيف الأصناف ولا يمثل تقسيم تدريب مرضي. لا يُحوّل إلى manifest أمراض.
- البندورة: لم يُعثر على manifest صور مصدر قابل لإعادة التحقق في مساحة العمل الحالية؛ القالب ينتظر الأصول والوسوم الأصلية.

عُزّز `verify-splits.py` ليفشل عند manifest فارغ، ويدعم فحص وجود الملفات عبر `--image-root`، ويفرض train/val/test اختيارياً عبر `--require-all-splits`. SHA-256 موثق على أنه exact-duplicate hash فقط، وليس perceptual hash. اختبارات المدقق السبعة ناجحة.

**الحالة:** القوالب جاهزة للتعبئة؛ لم يُعلن PASS جديد ولم تتغير بوابة Phase 0 إلى GO.


## تحديث أداة الاستخراج وفحص الأصول — 2026-11-27

- أضيف `scripts/research/extract-manifest.py` لتوحيد CSV/JSON مع الاحتفاظ الحرفي بـgroup IDs والوسوم والتقسيمات، ودعم `path_map.json` (مسارات exact أو prefixes). لا يخترع معرفات أو بصمات. مع `--verify-images` يشترط وجود كل صورة ويعيد حساب SHA-256 من bytes الفعلية.
- أضيفت اختبارات مستقلة للأداة وملف `research/manifests/path_map.example.json`.
- استُخرج Citrus Field V3 إلى `research/manifests/staging/citrus-field-v3.csv`: 610 سجلات، 14 `tree_id`، وتوزيع 332/144/134. هذا استخراج metadata فقط.
- إعادة فحص الملفات الفعلية في مساحة العمل الحالية أعطت **FAIL**: لا يوجد أي من مسارات الصور الـ610 محلياً (0/610)، كما أن manifest المصدر لا يحتوي SHA-256. لا يجوز اعتباره اجتيازاً لبوابة الملفات حتى توفير الأصول وخريطة مسارات صحيحة ثم إعادة حساب hashes.
- عُثر على الأرشيفات كفروع Git: `archive/gvlid-v5-vineyard-holdout-2026-11-27` و`archive/ngld-v5-training-log-2026-11-27` و`archive/source-specific-models-and-coastal-evidence-2026-11-27`.
- GVLiD V5: استُخرجت 1,323 صورة إلى `research/manifests/staging/grape-gvlid-v5-reconstructed.csv` مع 28 vineyard IDs، وتقسيم 953/195/175، وفئتي Esca/Healthy. فحص `verify-splits.py` للـmetadata اجتاز: صفر group leakage وصفر exact SHA leakage. لكن المصدر نفسه يوضح أن per-image split أُعيد بناؤه deterministic من 4 test و4 validation vineyards، ولم يكن الملف الأصلي موجوداً في ZIP. كما أن 0/1,323 صورة متاحة محلياً لإعادة حساب SHA؛ لذلك هذه نتيجة metadata-only وليست file-verified ولا manifest نهائياً.
- NGLD V5: split groups من نوع `ngld-phash-audit-*`/pHash clusters. توثيق التدريب يصرّح بعدم وجود vineyard/plant/session IDs، ولذلك لا يُستخدم هذا الملف لإثبات vineyard-disjoint للعنب أو source/site-disjoint للبندورة. بقي baseline استكشافياً فقط.
- البندورة: لم نجد PlantTom أو FieldPlant source manifests في فروع الأرشيف المفحوصة. يوجد PlantVillage tomato manifest، لكنه مصدر lab-image ولا يُستبدل به PlantTom/FieldPlant field data. لم ننشئ tomato manifest.
- خريطة المسارات الحالية نموذج فارغ `research/manifests/path_map.example.json`؛ لم نخترع وجهة محلية للصور غير الموجودة. عند توفير الصور، تُملأ خريطة exact/prefix ثم يعاد الاستخراج مع `--verify-images` لإعادة حساب SHA-256 من الملفات.
- التسميات: `public/models/plant-disease/labels.json` ما زال `[]` (صفر app disease IDs). `research/label-map.json` يحتوي source classes، لكنه لا يستطيع تعيين app IDs؛ لا يجوز إنشاء `extract-labels.py` ليخترع IDs أو تفعيل أي mapping. الحالة `BLOCKED_NO_APP_DISEASE_IDS` كما هي.
- لا تزال قوالب العنب والبندورة دون manifests نهائية، وملف الحمضيات في staging فقط. ولا تغيير في قرار Phase 0: **NO-GO**.
