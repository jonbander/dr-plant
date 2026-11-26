# Dr.Plant — بنية موجّه النماذج وحالة الدمج

## ما تم تنفيذه

- أضيف `src/services/modelRouter.ts` كسجلّ صريح للنماذج المتخصصة وقرار اختيار قابل للاختبار.
- الموجّه لا يخلط logits أو الأوزان أو المقاييس بين نماذج ذات تصنيفات مختلفة.
- المحصول غير المحدد أو غير المدعوم يؤدي إلى الامتناع والعودة إلى الفحص اللوني الحالي.
- سياق `lemon` يفضّل Lemon V3، بينما سياق الحمضيات العام يفضّل Citrus Field V3. لا توجد نتيجة مشتركة بينهما.
- النماذج البحثية محجوبة افتراضياً. لا يمكن تفعيلها إلا عبر `allowResearchModels: true` في مسار بحثي صريح، وحتى عندها يبقى ملف الإنتاج الحالي معطلاً.
- رُبط مسار `analyzePlantOffline` بالموجّه وبخدمة ONNX مع الحفاظ على fallback السابق. التطبيق الحالي لا يغير نتيجة الفحص عندما تكون النماذج محجوبة أو غير متاحة.
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
- اختبار TypeScript: **42 ناجحاً، 0 فاشل**.
- فحص TypeScript: ناجح.
- بناء Vite/PWA: ناجح.
- ملف production manifest ما زال `enabled: false` وملف التسميات فارغاً عمداً إلى أن تكتمل بوابة الاعتماد.

## ما لم يُدعَ أنه منجز

لم تتم إضافة أي نموذج بحثي إلى `public/models/plant-disease/` أو تفعيله للإنتاج. لم تُثبت دقة على الساحل السوري، ولم تتم مراجعة التسميات بواسطة خبير موثق، ولم تُعاير عتبات الرفض على بيانات حقول مستقلة. لذلك لا تعرض النتيجة تشخيصاً مؤكداً ولا توصية مبيد.

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
