# سجل النسخ الاحتياطية على Google Drive

آخر تحديث: 2026-11-25 (v9)

## نسخة مؤكدة على Drive

- المسار: `My Drive/esca-mendeley-v1/`
- المصدر المحلي السابق: `data/external/2026-11/esca-mendeley-v1/`
- حالة الرفع: اكتمل في واجهة Google Drive بعد ظهور `1777 of 1777` مع علامة نجاح.
- الإجراء المحلي: حُذف المجلد المحلي بعد اكتمال الرفع لتوفير مساحة الكمبيوتر السحابي.
- الحجم المحلي قبل الحذف: نحو 904 MiB.
- ملاحظة الاسترجاع: عند الحاجة، أعد تنزيل مجلد `esca-mendeley-v1` من Google Drive إلى `data/external/2026-11/` ثم تحقق من عدد الملفات والبصمات قبل استخدامه في التدريب.

## عناصر لم يثبت رفعها في هذه الجلسة

لم يكتمل رفع مجلد `data/external/2026-11/` كاملاً؛ أُلغيت محاولة رفعه بعد أن أظهرت الواجهة 27,345 عنصراً وكان النقل بطيئاً. ملاحظة تاريخية: فشلت محاولة رفع هذين الملفين في جلسة سابقة، لكن مراجعة Drive بتاريخ 2026-11-24 وجدت نسختيهما هناك بالاسم والحجم المطابقين؛ لذلك حُذفت النسخ المحلية المطابقة لاحقاً كما هو موثق أدناه.

## قاعدة الحذف

لا تُحذف أي مجموعة بيانات أو أوزان محلية إلا بعد التأكد من اكتمال رفع النسخة المقابلة على Drive، والتحقق من اسمها وعدد ملفاتها وحجمها، ثم تسجيل المسار هنا.

## مراجعة Drive وتنظيف النسخ المحلية — 2026-11-24

تمت مراجعة قائمة My Drive للحساب المسجل، وظهرت الملفات التالية بأسمائها وأحجامها المطابقة للنسخ المحلية (الأحجام المعروضة في واجهة Drive مقربة):

- `citrus.rar` — 186.6 MB
- `DrPlant-Models-2026-11-22.zip` — 16.4 MB
- `DrPlant-Training-Report-2026-11-23.md` — 4 KB
- `DrPlant-Training-Results-2026-11-23.zip` — 21.8 MB
- `DrPlant-Training-Results-2026-11-23-v2.zip` — 21.8 MB
- `DrPlant-Training-Results-2026-11-23-v3.zip` — 33 MB
- `DrPlant-Transfer-2026-11-24.zip` — 51.4 MB
- `multicrop-original.zip` — 932.8 MB
- `ngld-v5.zip` — 25.3 MB
- `orange_detection_COCO.rar` — 66.3 MB
- `original-images.zip` — 95.8 MB
- `Plasmopara Dataset.zip` — 979.1 MB
- `SHA256SUMS.txt`, `SHA256SUMS-v2.txt`, `SHA256SUMS-v3.txt`

بعد مطابقة الاسم والحجم الظاهر، حُذفت النسخ المحلية المطابقة فقط، بما فيها الملفات الخمسة الموجودة داخل مجلد `DrPlant-Transfer-2026-11-24` ونسخة v3 المكررة في مجلد نتائج البحث. لم تُحذف مجلدات البيانات المستخرجة أو ملفات المصدر الأخرى أو ملفات الأوزان خارج هذه النسخ المطابقة.

تنبيه تدقيقي: التحقق تم من ظهور العناصر في Drive ومطابقة الاسم والحجم المعروض؛ لم نتمكن في هذه الخطوة من استخراج MD5/SHA256 من خوادم Drive نفسها، لذلك لا نصفه بأنه تحقق تشفيري كامل من محتوى النسخة البعيدة. بقي هذا السجل محلياً ولم يُرفع بعد.

## GVLiD V5 audit and source archive — 2026-11-24

- `GVLiD.rar` — ظهر في My Drive بعد الرفع مع رسالة `2 uploads complete`؛ الحجم الظاهر 860.5 MB، والحجم المحلي قبل التنظيف 902,251,054 bytes.
- بصمة SHA-256 المحلية للأرشيف: `3c867ee21e799fc6a695917a1281e3e7190ed49ac7c74f8fcb98308091eaa76f` (لم يُتحقق من بصمة الخادم البعيد؛ مطابقة Drive هنا بالاسم والحجم الظاهر فقط).
- `DrPlant-GVLiD-v5-Audit-2026-11-24.zip` — ظهر في My Drive مع رسالة اكتمال الرفع؛ الحجم الظاهر 337 KB، والحجم المحلي 345,021 bytes.
- الحزمة تشمل manifest، مراجعة metadata، أزواج perceptual-hash للمراجعة اليدوية، تقارير التدقيق، ترخيص المصدر وملفاته الوصفية.
- قرار الاستخدام: لا تدريب على هذه الدفعة حالياً بسبب تعارض أسماء المجلدات مع metadata، وتكرارات متعارضة، وأزواج تشابه تحتاج مراجعة. التفاصيل في `data/gvlid-v5-full-audit/README-AR.md`.
- بعد التحقق من ظهور النسختين في Drive، حُذفت النسخة المحلية من الأرشيف ومجلد الاستخراج المؤقت وحزمة ZIP المحلية فقط؛ بقيت ملفات التدقيق المفهرسة داخل المشروع.

## NGLD V5 audit — 2026-11-24

- أرشيف المصدر `ngld-v5.zip` موجود مسبقاً على My Drive (25.3 MB بحسب الواجهة)؛ لا توجد نسخة محلية من الأرشيف بعد التنظيف السابق.
- `DrPlant-NGLD-v5-Audit-2026-11-24.zip` — رُفع إلى My Drive وظهر في القائمة بحجم 122 KB؛ الحجم المحلي قبل الحذف 124,824 bytes.
- النتائج: 2,726 صورة، 2,393 بصمة فريدة، 327 مجموعة تكرار مطابق، 333 ملفاً زائداً، صفر تطابق SHA مع 8 manifests تاريخية، و462 زوج تشابه perceptual مرشحاً.
- قرار التدريب: لا تدريب معتمد لغياب معرفات موثقة للمزرعة/الكرمة/جلسة التصوير؛ لا يُستبدل ذلك بمعرفات مخمّنة من أسماء الملفات.
- المصدر والترخيص: Mendeley Data V5، DOI `10.17632/8nnd2ypcv3.5`، CC BY 4.0.

## GVLiD V5 corrected integrity audit — 2026-11-24

- `DrPlant-GVLiD-v5-Audit-2026-11-24-v2.zip` — حزمة تدقيق مصححة تشمل مطابقة 3,477/3,477 بصمة مع المستودع الرسمي، 1,068 ملفاً زائداً بتكرار مطابق، 437 مجموعة تكرار عابرة لمعرفات الكروم، ونتيجة أن جميع 28 معرف Vineyard متصلة بعد ربط التكرارات.
- الحزمة v2 تستبدل تفسير v1 الأولي الذي لم يكن قد احتسب روابط التكرار العابرة للكروم. احتفظنا بـv1 كسجل تاريخي ولم نعدّل النسخة القديمة.
- الحجم المحلي للحزمة v2 قبل الرفع: 458,843 bytes. لم تُحذف أي بيانات مصدر إضافية؛ ملف GVLiD.rar الأصلي ما زال محفوظاً على Drive فقط.
- قرار التدريب يبقى موقوفاً حتى حل تعارضات التصنيف والتكرار وإنشاء تقسيم مستقل صحيح.
- تأكيد الرفع: ظهر `DrPlant-GVLiD-v5-Audit-2026-11-24-v2.zip` في My Drive بحجم 448 KB، ورسالة الواجهة أكدت اكتمال الرفع. المطابقة هنا بالاسم والحجم الظاهر، وليس تحقق SHA-256 عن بُعد.

## ESCA-dataset V1 eligibility audit — 2026-11-24

- المصدر الأصلي موجود مسبقاً على Drive داخل `esca-mendeley-v1/extracted/esca_dataset`؛ لا حاجة لرفع نسخة المصدر مرة ثانية.
- `DrPlant-ESCA-Mendeley-v1-Audit-2026-11-24.zip` — حزمة التدقيق فقط، حجمها المحلي قبل الرفع 118,903 bytes.
- نتائج الجرد: 1,770 صورة، 1,770 بصمة فريدة، لا تكرارات SHA، وزوجان فقط مرشحان لتشابه perceptual.
- مانع التدريب: Healthy كلها من cam3، وEsca كلها من cam1/cam2؛ الفئة متطابقة مع مصدر الكاميرا، ولا يوجد leaf/plant ID. لا تدريب تشخيصي.
- ترخيص مجموعة البيانات حسب صفحة Mendeley: CC BY 4.0. ترخيص المقالة العلمية مختلف ويخص المقالة نفسها.
- النسخة المحلية المؤقتة نُزّلت من Drive فقط للفحص؛ ستُحذف بعد رفع تقرير التدقيق والتحقق منه. تبقى النسخة الأصلية في Drive.
- تأكيد الرفع: `DrPlant-ESCA-Mendeley-v1-Audit-2026-11-24.zip` ظهر في My Drive مع رسالة `1 upload complete`؛ الحجم المحلي قبل الحذف 118,903 bytes. لم يُتحقق من SHA-256 على الخادم البعيد.

## Vitis French morphology expert v1 — 2026-11-24

- `DrPlant-Vitis-French-Morphology-Model-2026-11-24-v1.zip` — رُفع إلى My Drive، الحجم الظاهر 10.3 MB، ويحتوي المصنف، أوزان MobileNetV3-Small المسبقة، مرجع embeddings الفرنسي، manifest، key.csv، تقارير 3-fold group CV، السكربتات وModel Card.
- SHA-256 المحلي للحزمة: `5b1ccf5a755cc3ea77de11b259fe79e67774556d04c60503bef38bddd01cbf51`؛ لم يتم التحقق من SHA عن بُعد، والتحقق من Drive بالاسم والحجم الظاهر ورسالة اكتمال الرفع.
- التدريب: خبير شكل/تشابه صنفي فقط، 14 صنفاً فرنسياً، 127 صورة، 63 مجموعة كرمة، 3 طيات Group CV. Accuracy 71.72%، Balanced Accuracy 70.44%، Macro-F1 66.23%، Top-3 84.29%. ليس مصنف أمراض ولا مفعلاً في التطبيق.
- بعد ظهور الحزمة في Drive، حُذفت النسخة المحلية المضغوطة، أوزان النموذج والـembeddings الثقيلة، والصور الفرنسية المؤقتة، وملفات تنزيل الأرشيف المؤقتة. بقيت manifests والتقارير والسكربتات الصغيرة في المشروع.
- مساحة Box الحرة بعد التنظيف: 4.2 GB. مصدر الصور العام يمكن إعادة تنزيله من Dryad/Zenodo عند الحاجة؛ لم نحتفظ بنسخة محلية من الصور.

## 2026-11-25 — Lemon V3 refined exploratory training package

- `DrPlant-LemonV3-Training-2026-11-25.zip` — رُفع إلى My Drive وظهر في قائمة الملفات بحجم 5.7 MB مع رسالة اكتمال الرفع.
- Local package: `/workspace/backups/DrPlant-LemonV3-Training-2026-11-25.zip`; size 5.7 MB. SHA-256 المحلي: `b110eb2c5e27df7470b4f43ab43c7a59ec4d3efe6f1984c9fdb8178ac1a16419`. لم يتم التحقق من SHA-256 على خادم Drive؛ التأكيد بالاسم والحجم الظاهر ورسالة اكتمال الرفع.
- Contents: best-model.pt, ONNX model, labels, manifest, training history, metrics, rerun log, Arabic Model Card, and training script.
- Training resumed from checkpoint after epoch 6 and completed through epoch 9; test accuracy 72.06%, macro-F1 67.46%; ONNX export succeeded. The test split is image-level, not independent by plant/farm.
- Package and source outputs remain on Box; no local files were deleted.

## 2026-11-25 — Plasmopara V2 exploratory baseline

- الحزمة: `DrPlant-Plasmopara-V2-Exploratory-Training-2026-11-25.zip`؛ حالة الرفع النهائية: مؤكدة على My Drive بعد اكتمال الرفع وظهورها في قائمة الملفات بحجم 23 MB (تقريب الواجهة).
- المصدر: Zenodo DOI `10.5281/zenodo.17368692`، CC BY 4.0.
- 280 صورة أصلية فقط (129 Disease، 151 Healthy)، مع استبعاد 1,600 مشتق اصطناعي. 280 SHA فريدة؛ لا exact duplicates؛ لا pHash pairs عند Hamming <=8؛ لا exact SHA overlap مع manifests التدريب السابقة التي فُحصت.
- التقسيم stratified image-level: 196/42/42؛ لا توجد معرفات مستقلة للمزرعة/الكرمة/النبات/جلسة التصوير.
- MobileNetV3-Small، 8 عصور CPU: validation 88.10%، test 73.81%، macro-F1 73.79%.
- تحذير حاسم: 127/151 Healthy تحمل EXIF لجهاز iPad Pro بتاريخ 2024-07-10، بينما 113/129 Disease بلا EXIF؛ يوجد confounding قوي بين الفئة ومصدر التصوير. التسميات غير مراجعة مستقلاً من خبير. النموذج بحثي فقط ولا يدمج بالتطبيق.
- محتويات الحزمة: best-model.pt، training-checkpoint.pt، metrics، manifest، audit summary، source metadata، report، model card، training log، وسكربت التدريب.
- اكتمل التحقق المستقل: نُزّلت النسخة من Drive باستخدام معرّف الملف `1A0aupSTSGkHNccRjw5FkjL0sP3U54HeK` إلى ملف مؤقت، ثم طوبقت بايتاً ببايت مع النسخة المحلية. الحجم الدقيق للطرفين `24,151,918` bytes، وSHA-256 للطرفين `b7e83a3f1d6acdbcb74b407bd30147711ba5e1cf7ab27965dec83f3f69022903`، وفحص ZIP للنسخة المنزّلة نجح (`unzip -t`: no errors). هذا تحقق تشفيري عبر تنزيل مستقل، وليس مجرد مطابقة اسم/حجم الواجهة.
- بعد اكتمال مطابقة Drive وتوثيقها على GitHub، نُظّفت النسخ المحلية الثقيلة المحددة فقط: حُذف ZIP المحلي (24,151,918 bytes) وملفا `best-model.pt` و`training-checkpoint.pt` من مجلد `model-output`، بعد أن ثبتت مطابقة الحزمة السحابية بايتاً ببايت. بقيت manifests والتقارير والـmetrics والسكربتات وملفات metadata والسجل الصغير محلياً. لم تُحذف أي بيانات مصدر أو نماذج/تدريبات أخرى.


## 2026-11-25 — Plasmopara V2 Drive integrity verification

- Drive file ID: `1A0aupSTSGkHNccRjw5FkjL0sP3U54HeK` (My Drive).
- Independent download size: `24,151,918` bytes; local archive size: `24,151,918` bytes.
- SHA-256 (local and independently downloaded Drive copy): `b7e83a3f1d6acdbcb74b407bd30147711ba5e1cf7ab27965dec83f3f69022903` — exact match.
- `cmp` byte-for-byte comparison: PASS. `unzip -t` on downloaded copy: PASS, no compressed-data errors.
- Upload route: Chrome DevTools Protocol file-input transfer to the already authenticated Google Drive session (not the previously failing Drive picker workflow); Drive displayed the file and an upload-complete notification.
- Cleanup decision: only the Plasmopara archive and its associated local training-output directory may be removed after the updated register is published and verified on GitHub. No other datasets/models are in scope.


## Local cleanup confirmation — 2026-11-25

- Removed only the Plasmopara V2 package ZIP and its two packaged weight/checkpoint files from the local training output after the Drive archive had passed byte-for-byte SHA-256 verification.
- Retained the small local audit summary, image manifest, source metadata, metrics, report, model card, training script, and log (about 88 KB total).
- No other dataset, training run, model, or source image was deleted.
