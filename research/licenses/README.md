# سجل تراخيص ومصادر البيانات

هذا المجلد يحتفظ بنسخ نصوص التراخيص العامة (legal code) ولقطات صفحات/سجلات المصدر التي أعلنت الترخيص، مع بصمات SHA-256 في `research/licenses/SHA256SUMS.txt`.

**تنبيه مهم:** وجود نص CC BY/CC0 هنا لا يثبت وحده أن رافع البيانات يملك حقوق كل صورة. لذلك تميز خانة `license_status` بين إعلان المصدر الموثق وبين حالات الحقوق الملتبسة (خصوصاً الصور المسحوبة من محركات البحث أو مجموعات مشتقة). لا تنسخ ملف ترخيص عاماً إلى سجل مجهول وتعتبره منحة حقوق.

- Mendeley: لقطات صفحات الإصدار المحدد تحت مجلد المجموعة.
- Zenodo: JSON API snapshot، مع license ID المعلن من metadata.
- PlantDoc: ملف الترخيص العام لا يحل مشكلة حقوق الصور الخارجية الملتقطة من الويب.
- PlantVillage: نسخة CC BY-SA 3.0 مرفقة كمرجع لنص الترخيص؛ إعلان بطاقة المصدر يحتاج مطابقة إصدار المصدر واشتراطات ShareAlike قبل أي توزيع تجاري/تطبيق مغلق.
- FieldPlant وPlantTom: لم يتم العثور على منحة بيانات محددة قابلة للأرشفة للإصدار المستخدم؛ لذلك رُفضا حالياً.

- Algeria grape morphology: exact Zenodo API rights snapshots for ALGERIA, FINAL_MASKS, DETECT LEAVES, LEAF_MASKS and 10 CLASS PREDICTION are archived under `algeria_grape_morphology_v1/`; all five records declare CC BY 4.0. This records the uploader's declared license, not independent proof of underlying ownership.
- The Algeria morphology audit package has a separate SHA-256 manifest at `algeria_grape_morphology_v1/SHA256SUMS.txt`; the five raw metadata CSVs and two provenance files were separately uploaded to Google Drive and re-downloaded to verify exact hashes. The original image archive remains outside the project until a sample-level visual and duplicate audit is justified.
