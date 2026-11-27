# خطة التنفيذ الموحّدة لتطوير Dr.Plant — 2026-11-27

## القرار
اعتماد المقترح المقدم من المستخدم مع خارطة Morphology السابقة، دون لمس `main` أو تغيير بوابة الإنتاج. التنفيذ يبدأ بتثبيت جودة الأقنعة ثم توحيد السجل، قبل أي تدريب هجين.

## ترتيب التنفيذ
1. **Gold Masks ومراجعة عزل الورقة:** عينة 24 صورة من 504 صور العنب الفرنسية، موزعة على 12 مرشح آلي بمكوّنين، و11 حالة بمكوّن واحد، وحالة بلا مكوّن. 24 مجموعة كرمة و23 صنفاً. أداة مراجعة محلية تصدر JSON؛ لا توجد أقنعة ذهبية حتى يراجعها إنسان.
2. **سجل الأصول:** `research/model-registry.json` هو الفهرس البحثي المنظم، مع الاحتفاظ بـ`data/model-evidence-registry.json` كسجل تاريخي قائم. الحقول غير المثبتة تبقى null؛ لا تُختلق تراخيص أو بصمات.
3. **فجوات التسميات:** `research/label-gap-report.json` يقارن تسميات المصادر بملف التطبيق. الملف الحالي `public/models/plant-disease/labels.json` فارغ، لذا جميع المطابقات غير محسومة ولا يجوز اختراع Disease IDs.
4. **Feature Store:** بعد مراجعة Gold Masks، نفصل leaf silhouette عن lesion masks وعن color/texture. تحفظ الميزات مع hash الصورة وإصدار extractor ومصدر annotation؛ لا نعيد حسابها عند كل تجربة.
5. **تجزئة الآفات:** لا نعتمد YOLO/SAM قبل التحقق من وجود pixel masks/تعليقات صالحة والترخيص. Detection boxes لا تكفي لاشتقاق مساحة آفة دقيقة. SAM أداة annotation مساعدة فقط.
6. **النموذج الهجين:** ثلاث تجارب متكافئة على نفس group/source splits: لون وملمس، شكل وتشوه، ثم الدمج. لا نبدأ Cross-Attention أو multi-task قبل إثبات الفائدة وتوفر annotations المناسبة.
7. **التقييم:** per-class metrics، cross-source، group-disjoint، calibration، unknown rejection، failure analysis، وتفسير بصري. GVLiD/NGLD وغيرها خطوط أساس منفصلة لا أوزان إنتاج.
8. **بوابة الإنتاج:** تبقى `enabled=false` و`reviewStatus=candidate`. لا تغيير قبل ربط labels، preprocessing parity، ONNX/device validation، مراجعة خبير، واختبار حقلي مستقل.

## قيود علمية
- مجموعة Dryad الفرنسية صور مورفولوجيا مضبوطة وليست صوراً حقلية سورية ولا تشخيص أمراض.
- أقنعة HSV الآلية candidates فقط؛ لا تُستخدم كـground truth.
- قناع الورقة لا يساوي قناع الآفة. قياس silhouette لا يثبت الالتفاف أو التجعد ثلاثي الأبعاد.
- أرقام PlantTom/PlantDoc وتعليقاتها لا تعتمد قبل فحص الأرشيف الأصلي ونوع annotation والترخيص.
- لا تنقل الأوزان الكبيرة ولا تحذف نسخ الأرشيف. يسجل registry مساراتها وبصماتها المتاحة فقط.

## المخرجات الأولية
- `results/vitis-morphology-gold-masks-2026-11-27/` حزمة مراجعة 24 صورة وأداة HTML محلية.
- `research/model-registry.json` سجل موحد موسع.
- `research/label-gap-report.json` تقرير فجوات التسميات.
