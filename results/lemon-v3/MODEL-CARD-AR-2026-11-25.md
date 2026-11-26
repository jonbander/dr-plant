# بطاقة نموذج الليمون V3 — استكمال تجريبي 2026-11-25

- المهمة: تصنيف صور أوراق الليمون إلى فئات مجموعة Lemon V3.
- البيانات: 17,586 صورة، المصدر Large-Scale Lemon Leaf Disease and Pest Image Dataset V3، DOI 10.17632/8d9fv6kpt3.3، الترخيص المسجل في المشروع CC BY 4.0.
- النموذج: MobileNetV3-Small، fine-tuning لآخر كتلتين، حجم الإدخال 128×128.
- التدريب: استكمال من checkpoint بعد العصر 6 إلى العصر 9؛ أفضل validation accuracy = 71.00%.
- التقسيم: train 12,310 / validation 2,638 / test 2,638، image-level stratified random split.
- النتائج: test accuracy 72.06%، macro-F1 67.46%، ONNX export success.
- الحالة: exploratory / non-independent image-level holdout.
- القيود: لا توجد معرفات شجرة/مزرعة موثقة لضمان استقلال التقسيم؛ خلفيات الصور مضبوطة/بيضاء؛ لا تحقق مستقل على الليمون السوري؛ لا يثبت النموذج سبب التشوه أو الاصفرار؛ لا يميز المرض من الآفة أو نقص العناصر دون بيانات مناسبة.
- الاستخدام: خط أساس بحثي فقط؛ غير معتمد للتشخيص أو التفعيل في التطبيق.
- الملفات: best-model.pt, lemon-v3-mobilenetv3-small.onnx, metrics.json, history.json, manifest.csv, refined-training-rerun.log, labels.json.
