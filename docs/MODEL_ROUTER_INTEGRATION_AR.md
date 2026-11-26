# Dr.Plant — بنية موجّه النماذج وحالة الدمج

## ما تم تنفيذه

- أضيف `src/services/modelRouter.ts` كسجلّ صريح للنماذج المتخصصة وقرار اختيار قابل للاختبار.
- الموجّه لا يخلط logits أو الأوزان أو المقاييس بين نماذج ذات تصنيفات مختلفة.
- المحصول غير المحدد أو غير المدعوم يؤدي إلى الامتناع والعودة إلى الفحص اللوني الحالي.
- سياق `lemon` يفضّل Lemon V3، بينما سياق الحمضيات العام يفضّل Citrus Field V3. لا توجد نتيجة مشتركة بينهما.
- النماذج البحثية محجوبة افتراضياً. لا يمكن تفعيلها إلا عبر `allowResearchModels: true` في مسار بحثي صريح، وحتى عندها يبقى ملف الإنتاج الحالي معطلاً.
- رُبط مسار `analyzePlantOffline` بالموجّه وبخدمة ONNX مع تمرير `ModelRoute` المحدد صراحةً؛ لم يعد المصنف يسقط إلى manifest الإنتاج العام عند اختيار نموذج بحثي.
- أصبحت caches الخاصة بالـ manifest والتسميات والجلسات مفهرسة بـ `modelId`، لا بمتغيرات عالمية مشتركة بين النماذج.
- يحلّ كل route مسار ONNX المضمّن، ملف التسميات، ملف `.onnx.data` المنفصل عند وجوده، وحجم/طريقة الإدخال الفعلية. أصول المتصفح ومسارات التسميات المتوافقة مع التطبيق غير موجودة حالياً، لذلك يرفض المصنف التشغيل برسالة blocker واضحة.
- أضيف ONNX Runtime Web محلياً تحت `public/vendor/onnxruntime/`؛ لا يعتمد المسار على CDN أو الإنترنت بعد تثبيت الأصول.

## عقود النماذج الموجودة

| النموذج | الفئات | الإدخال | إعادة التحجيم | الحالة |
|---|---:|---|---|---|
| PlantVillage V2 | 38 | NCHW، RGB، ImageNet | stretch | `research_only` |
| Lemon V3 | 18 | NCHW، RGB، ImageNet، 128×128 | stretch | `research_only` |
| Citrus Field V3 | 4 | NCHW، RGB، ImageNet، 160×160 | stretch | `research_only` |
| NGLD V5 | 4 | PyTorch research checkpoint | غير قابل للتشغيل بالمتصفح حالياً | خارج التطبيق |

تم الاحتفاظ بنسخ `.onnx` المنفصلة وملفات `.onnx.data` ونسخ embedded دون حذف. لا يُعد وجود ملف ONNX اعتماداً للإنتاج.

## فحص بصمة Lemon V3

تم تشغيل `python3 scripts/validate_model_artifacts.py`. نجح الفحص، والبصمة المسجلة الحالية لملف `results/lemon-v3/best-model.pt` تطابق الملف الموجود في الفرع. لا يوجد استبدال عشوائي للأوزان ولا تعديل بصمة بلا تحقق. سجلّ النموذج والعقود ونتيجة ONNX محفوظة مع الأصول؛ النسخ السابقة بقيت في تاريخ Git.

## ما تم إثباته

- فحص SHA-256 للأصول المسجلة: ناجح.
- تطابق عدد الفئات مع العقود: ناجح لـ Lemon V3 وCitrus Field V3.
- تحقق مستقل مسجل من تطابق Torch/ONNX موجود في `results/*/onnx-validation.json` للأصول البحثية، وليس اختباراً ميدانياً سورياً.
- اختبار TypeScript: **45 ناجحاً، 0 فاشل**.
- فحص TypeScript: ناجح.
- بناء Vite/PWA: ناجح.
- ملف production manifest ما زال `enabled: false` وملف التسميات فارغاً عمداً إلى أن تكتمل بوابة الاعتماد.

## ما لم يُدعَ أنه منجز

**النماذج التي تنفذ فعلياً حالياً: لا يوجد نموذج من النماذج الثلاثة.** عند `allowResearchModels: true` يختار الموجّه route صحيحاً، ثم يرفض المصنف التشغيل قبل تحميل manifest الإنتاج لأن الأصول ليست browser-served ولأن ملفات التسميات الخام لم تُربط بمعرّفات أمراض التطبيق. هذا مقصود وليس نجاحاً زائفاً. لم تتم إضافة أي نموذج بحثي إلى `public/models/plant-disease/` أو تفعيله للإنتاج. لم تُثبت دقة على الساحل السوري، ولم تُراجع التسميات بواسطة خبير موثق، ولم تُعاير عتبات الرفض على بيانات حقول مستقلة.

ما يزال التحقق الفعلي من Android، وقياس الذاكرة والزمن على أجهزة ممثلة، واختبار الصور الحقلية المستقلة، واختبار fallback/rollback على حزمة مفعّلة، أعمالاً لاحقة قبل أي ترقية.

## تشغيل الاختبارات

```sh
python3 scripts/validate_model_artifacts.py
./node_modules/.bin/tsx --test src/services/leafScreening.test.ts \
  src/services/symptomTriage.test.ts \
  src/services/grapeDownyMildewRisk.test.ts \
  src/services/onnxDiseaseClassifier.test.ts \
  src/services/modelRouter.test.ts \
  src/services/exportService.test.ts
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/vite build
```
