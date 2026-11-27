# بروتوكول التقسيم المستقل — Phase 0

## قواعد عامة
- التقسيم على مستوى المجموعة البيولوجية/المصدر قبل augmentation.
- SHA-256 يمنع النسخ المطابقة؛ perceptual hashes/قصاصات مشابهة تُجمع وتُراجع قبل الفصل.
- لا يُستنتج group ID من اسم ملف دون مصدر موثق.
- مجموعة calibration منفصلة عن test النهائي.
- نجاح السكربت يثبت فقط عدم التداخل في الحقول المقدمة؛ لا يثبت صحة المعرفات البيولوجية أو صحة التشخيص.

## المحاصيل
- **العنب:** vineyard/vine-disjoint. كل صور الكرمة الواحدة وجلساتها في split واحد؛ اختبار خارجي من كروم/مصادر غير مرئية.
- **الحمضيات:** tree-disjoint، ويفضل orchard/site-disjoint للاختبار الخارجي. لا يكفي random image split.
- **البندورة:** source-disjoint، مع فصل البيوت/المواقع عند توفرها.

## المدقق
`python scripts/research/verify-splits.py MANIFEST.csv --group-col GROUP --split-col split`

اختياري: `--hash-col sha256` لفحص SHA-256، و`--source-col source_id` لفصل المصدر. لنتائج out-of-fold CV: `--cv-fold-col fold --allow-splits=1,2,3`.

## نتائج فعلية محفوظة
- `research/split-checks/citrus-field-v3-tree-disjoint.json`: PASS؛ 610 صفوف، 14 شجرة، train=332/val=144/test=134، لا تداخل شجرة.
- `research/split-checks/vitis-morphology-oof-group-folds.json`: PASS؛ 127 تنبؤاً، 63 مجموعة كرمة، 3 folds، لا مجموعة موزعة عبر folds.

## حالات لا تجتاز
- pHash grouping فقط لا يعادل vine/tree/site independence.
- أي مصدر لا يوفر group IDs حقيقية لا يُسمى independent split، ويُرفض للتدريب/التقييم الذي يتطلب ذلك.
