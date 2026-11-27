# Dr.Plant — بوابة التدريب الآلية (v1)

هذه البوابة تفصل بين **السماح بتجربة بحثية محدودة** وبين **اعتماد النموذج الهجين**. لا تعني `research_training_allowed=true` أن النموذج صالح للإنتاج أو أن تشخيصاته مؤكدة محلياً.

## حالات القرار

- `NO-GO`: أي نقص في بصمة الأصول أو التوقيع أو الترخيص أو مراجعة المصدر أو taxonomy أو استقلالية التقسيم أو متطلبات المهمة.
- `RESEARCH-GO`: اجتياز متطلبات Phase 0 للمجموعة/المهمة المحددة فقط. يسمح بتجربة بحثية قابلة لإعادة الإنتاج، وليس بتفعيل التطبيق أو نشر تشخيص.
- `HYBRID-ADOPTION-NO-GO`: الحالة الافتراضية بعد Phase 0. لا تتحول إلى GO إلا بعد تقرير Ablation مستقل يثبت فائدة الفروع، مع تحليل أثر وتباين البذور واختبار إحصائي مناسب على التنبؤات نفسها.

## الملفات التي يحددها profile

1. `delivery_manifest`: JSON يحوي `dataset_id`, `dataset_version`, `delivery_id`, `hash_scope=extracted_file_bytes` و`files[]`. لكل ملف `path`, `bytes`, `sha256`, و`record_count`، ويعيد الفاحص عدّ سجلات CSV/JSON حيث يمكن تحديدها آلياً (عدد سجلات الملف؛ للصور المفردة = 1). بصمة الأرشيف المضغوط، إن وجدت، تسجل منفصلة في `archive` ولا تحل محل بصمات الملفات المفكوكة.
2. `delivery_signature`: توقيع Ed25519 منفصل على البايتات الأصلية للـmanifest. يحتفظ المفتاح الخاص خارج المستودع؛ المفتاح العام الموثوق يمرره إعداد CI محمي بشكل مستقل، ولا يؤخذ من profile أو حزمة البيانات. لا نعتبر commit Git توقيع تسليم بيانات.
3. `dataset_profile`: ملف JSON بملف تعريف بيانات مستند إلى SPDX Dataset Profile-aligned record، يتضمن المصدر والإصدار والرخصة والاستخدام البحثي والتجاري وتوزيع الأوزان وإعادة التوزيع والإسناد وطريقة الجمع/المعالجة ومراجعة بشرية. يجب أن تكون `license_status=verified` و`research_training_use=allowed` مع تسجيل `commercial_use` و`redistribution` و`model_weight_distribution` صراحةً وأن يوقّع المراجع ملف التعريف بتوقيع منفصل. هذا سجل Dr.Plant متوافق حقلياً مع مبادئ SPDX Dataset Profile، وليس ادعاءً بأن الملف اجتاز مدقق المطابقة الرسمي لـSPDX.
4. `split_manifest`: CSV يحتوي `image_path, group_id, split, sha256, phash, near_duplicate_group_id`. يجب أن تمثل `group_id` أقوى حد استقلال بيولوجي مناسب: vineyard/block للعنب، tree للحمضيات، source/site/acquisition للبندورة. لا تقبل pHash cluster بديلاً عن هوية المجموعة البيولوجية.
5. `taxonomy_map`: JSON يربط كل فئة مستخدمة في التدريب إما بكود EPPO صالح ومراجع، أو يصرّح باستبعادها مع سبب. لا نفرض EPPO على الأعراض العامة أو الحالة السليمة أو الصنف أو الفينولوجيا أو نقص العناصر؛ يجب تصنيف هذه الفئات صراحةً كغير مرضية وعدم خلطها بمعرفات الأمراض.
6. `gold_mask_audit`: مطلوب فقط لمهام segmentation أو المهام التي تعتمد فعلياً على أقنعة مشتقة. يجب أن يصف نوع القناع (`leaf_mask` منفصل عن `lesion_mask`)، ومراجعتين مستقلتين لكل الصور المعتمدة، وحداً أدنى لعدد الصور يحدده profile/المهمة، ومقاييس `mean_pairwise_iou` و`mean_pairwise_dice` و`boundary_f1` مع عتبات خاصة بالمهمة داخل تقرير المراجعة، والخلافات وحسمها. لا توجد عتبة IoU أو عدد صور عالمي مفروض هنا. مهمة segmentation تتطلب `lesion_mask`، ومهمة `mask_derived_shape` تتطلب `leaf_mask`؛ استخدم profile منفصلاً لكل نوع.

## سياسة الاستقلال وكشف النسخ

- يجب ألا يظهر `group_id` في أكثر من split.
- يجب ألا يظهر SHA-256 واحد في أكثر من split.
- يجب أن تكون مراجعة near-duplicate موثقة بتقرير مستقل يتضمن الخوارزمية والإصدار والعتبة وعدد الأزواج العابرة للتقسيمات؛ وجود زوج غير محسوم أو عابر للتقسيمات يفشل البوابة.
- pHash وembeddings أدوات كشف مساعدة وليست برهاناً مطلقاً على غياب كل التحويرات. يجب مراجعة الأزواج المشتبه بها وتوثيق القرار.
- لا تُفرض نسب 70/15/15 إذا كان عدد المجموعات لا يسمح. استقلال الاختبار أهم من النسبة الشكلية.

## تشغيل محلي / CI

```bash
python scripts/research/validate-training-gate.py \
  --profile research/training-gates/profiles/<dataset>.json \
  --profile-signature research/training-gates/profiles/<dataset>.json.sig \
  --data-root /path/to/dataset \
  --trusted-public-key /path/to/protected/maintainer-ed25519.pem \
  --expected-task classification \
  --report artifacts/training-gate-report.json
```

يجب توقيع profile نفسه، وmanifest، وملف SPDX، وsplit manifest، وتقرير near-duplicate، وخريطة التصنيفات بالمفتاح الموثوق نفسه؛ كما يوقّع تقرير Gold Masks عند اشتراطه. يجب تشغيل هذا الفحص قبل أي استيراد/تدريب. فشل أي شرط يعيد exit code غير صفري. ملفات الصور الكبيرة لا يلزم وضعها في Git؛ يمكن للـrunner جلبها من مخزن معتمد، ثم تمرير جذرها إلى الفاحص.

## حدود v1

- الفاحص يتحقق من البايتات والحقول والتوقيعات والتقسيمات والوثائق التي يزوده بها profile؛ لا يستطيع إثبات صدق هوية الشجرة/الكرمة أو صحة المراجع البشرية من تلقاء نفسه.
- التوقيع يثبت أن حامل المفتاح وقّع الملف، ولا يثبت وحده صحة مضمون الترخيص. يجب أن تكون مراجعة المصدر والرخصة بشرية وموثقة. وإذا وُجدت أزواج pHash، فيلزم ملف حسم بشري موجود وموقّع أيضاً.
- `RESEARCH-GO` لا يفتح تدريب segmentation إن لم تتوفر Gold Masks مناسبة، ولا يجيز نشر نموذج إنتاجي.
- Ablation بوابة لاحقة مستقلة: Shape only, Color only, Texture only, التركيبات الثنائية، Full hybrid؛ مع effect size وتباين البذور واختبار paired مناسب (مثل McNemar عند ملاءمته). لا تستخدم مجموعة الاختبار لاختيار الفروع أو ضبطها.

## استخدام البوابة من أي workflow تدريبي

أضف خطوة `uses: ./.github/actions/verify-training-gate` بعد checkout وتجهيز البيانات وقبل أمر التدريب، مع `profile` و`data-root`. يوجد workflow يدوي `Dr.Plant training readiness` لتشغيل الفحص ورفع التقرير. لا يبدأ أي سكربت تدريب محمي إذا غابت وسائط البوابة أو أعادت `NO-GO`.

## تمرير البوابة إلى سكربت تدريب

أضف الوسائط الأربعة التالية إلى أي أمر تدريب محمي:

```bash
--training-profile path/to/profile.json \
--training-profile-signature path/to/profile.json.sig \
--training-data-root /path/to/extracted/dataset \
--training-trusted-public-key /path/to/protected/maintainer-ed25519.pem
```

في GitHub Actions يجب أن يأتي مسار المفتاح العام من متغير محمي `DRPLANT_TRAINING_GATE_PUBLIC_KEY_PATH`، لا من ملف بيانات أو إدخال workflow يختاره مشغّل التشغيل. عدم ضبط المتغير يجعل الفحص يفشل مغلقاً.

## Google Colab notebooks

دفاتر التدريب الستة الحالية تقرأ القيم الثلاث من Colab Secrets قبل أي تنزيل/تدريب: `DRPLANT_TRAINING_PROFILE`, `DRPLANT_TRAINING_PROFILE_SIGNATURE`, `DRPLANT_TRAINING_TRUSTED_PUBLIC_KEY`. تمرر الدفاتر هذه القيم مع جذر البيانات إلى سكربت التدريب المحمي. لا يبدأ التدريب إذا كانت الأسرار ناقصة أو إذا لم يجتز التحقق.


## تقوية إثبات هوية المجموعة البيولوجية

لم يعد وجود `group_id` غير فارغ كافياً. يجب أن يحتوي split manifest على:
`group_identity_source`, `group_identity_evidence_ref`,
`group_identity_evidence_sha256`, `group_identity_verified_by`,
`group_identity_status`.

يشير `group_identity_evidence_ref` إلى ملف JSON داخل جذر البيانات، ويجب أن تطابق بصمته SHA-256 القيمة المسجلة. يضم سجل الإثبات `group_id` و`grouping_unit` ومصدر الهوية ومرجع السجل الأصلي وبصمته ومراجع التحقق وتاريخه وحالة `verified`. يتحقق الفاحص من وجود السجل وبصماته وتطابقه مع صف الصورة ووحدة التجميع المحددة في profile. كما يرفض استعمال pHash أو SHA-256 أو معرف مجموعة النسخ القريبة كبديل عن الهوية البيولوجية.

يجب إدراج ملفات سجل الهوية والسجلات الأصلية المشار إليها ضمن delivery manifest وتوقيعها. هذا يرفع قابلية التدقيق ولا يثبت صدق المضمون وحده؛ تبقى مراجعة مصدر السجل وهوية الكرمة/الشجرة/الموقع مسؤولية بشرية موثقة.

## ربط ملف الاعتماد بنوع التدريب الفعلي

لا يكفي أن يعلن profile عن `task_scope`. يمرر كل مدخل تدريب قيمة `--expected-task` يحددها سجل مركزي داخل `scripts/training_gate_guard.py` ولا يستطيع مشغّل الأمر استبدالها. يجب أن يحتوي `task_scope` الموقّع على هذه المهمة بالضبط، وإلا تعيد البوابة `NO-GO`. المهام المقبولة حصراً: `classification`, `self_supervised`, `segmentation`, `mask_derived_shape`. تدريب `train_grape_morphology_fusion.py` مربوط بـ`mask_derived_shape` ولذلك يتطلب مراجعة Gold Leaf Masks؛ لا يمكن تمرير ملف تصنيف عادي له. كما أن workflow اليدوي يطلب نوع المهمة صراحةً، لكنه لا يتجاوز الربط الثابت داخل مدخل التدريب نفسه.


## ربط التنفيذ الفعلي ببيانات Phase 0

بعد نجاح الفاحص، يتحقق `training_gate_guard.py` أيضاً من أن `data_root` الفعلي الذي سيقرأه المدرّب يطابق جذر البيانات الذي فُحص، وأن ملف manifest الذي سيقرأه المدرّب هو الملف نفسه المحدد في profile الموقّع. أي اختلاف يعيد `NO-GO` قبل تحميل البيانات أو بدء التدريب. لذلك يجب أن يكون ملف split الموقّع هو نفسه manifest الذي يمرره المدرّب، ويمكن أن يحتوي أعمدة إضافية يحتاجها نموذج بعينه.

تم حجب ثلاثة مدخلات قديمة مؤقتاً لأنها تنشئ تقسيماتها داخلياً ولا تستهلك split الموقّع: `train_citrus_field_v3.py`, `train_lemon_v3_exploratory.py`, و`train_vitis_morphology.py`. يمكن إعادة فتحها بعد تعديلها لاستخدام manifest الموقّع نفسه. أما بقية المداخل المسجلة فتُلزم بتمرير جذر الصور وملف التقسيم الفعلي إلى guard.


كما يفحص split manifest اتساق الأعمدة التي تقرؤها سكربتات التدريب: إذا وُجد `relative_path` أو `processed_path` فيجب أن يطابق `image_path` حرفياً بعد تطبيع المسار؛ وإذا وُجد `class_label` فيجب أن يطابق `source_class`؛ وإذا وُجد `group_id_for_split` فيجب أن يطابق `group_id`. لا يُقبل split باسم `val` لأن مداخل التدريب المعتمدة تستخدم `validation`. بهذه الطريقة لا يستطيع صف التدريب الإشارة إلى صورة أو تسمية أو مجموعة مختلفة عن التي دققتها البوابة.
