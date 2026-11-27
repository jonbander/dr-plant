# حسم فئات الحمضيات — Citrus Pairs Resolution

**الحالة: BLOCKED — توثيق المصدر اكتمل، لكن لا يوجد أي disease ID إنتاجي معتمد.**  
**التاريخ:** 2026-11-27  
**الفرع:** `research/morphology-v2`

## 0) النتيجة الحاكمة

تمت مقارنة الملفات الفعلية، وتبيّن أن المسودة الأصلية تخلط بين مجموعتي فئات مختلفتين:

1. **Citrus Field V3**: أربع فئات مصدرية فقط: California red scale-like، Greasy spot-like، apparently healthy، greening-like.
2. **Lemon V3**: 18 فئة مصدرية، منها Anthracnose وCitrus Canker وCitrus Leafminer.

لا يجوز اعتبار فئات Lemon V3 جزءاً من مخرجات نموذج Citrus Field V3. كما أن `public/models/plant-disease/labels.json` على فرع البحث الحالي يساوي مصفوفة فارغة `[]`؛ لذلك لا يوجد أي disease ID إنتاجي يمكن ربطه الآن.

**لا يتم تفعيل نموذج الحمضيات ولا تعديل labels.json أو manifest.json نتيجة هذا الملف.**

## 1) مصادر التحقق الفعلية

| المصدر | الفرع/المسار | SHA blob | النتيجة |
|---|---|---|---|
| App citrus pilot labels | `feature/coastal-leaf-diagnosis-v2-pilot:public/models/plant-disease/citrus-field-labels.json` | `a6a5fd9c5337294a5b478d3dfba632d4d7d5c88d` | 4 IDs تجريبية فقط، وكلها experimentalOnly=true |
| Citrus Field V3 source labels | `research/morphology-v2:results/citrus-field-v3/labels.json` | `10168f6fa0639b5178e671d03acf0d4df4da90c5` | 4 فئات مصدرية |
| Lemon V3 source labels | `research/morphology-v2:results/lemon-v3/labels.json` | `3ec2f0549ea0160635315c966fdf3bcc03ac7b93` | 18 فئة مصدرية |
| Production labels source of truth | `research/morphology-v2:public/models/plant-disease/labels.json` | `fe51488c7066f6687ef680d6bfaa4f7768ef205c` | `[]` — صفر IDs |
| Research label map | `research/morphology-v2:research/label-map.json` | `efb70d79a6a2e093ceb726a9b4ba260262e39089` | BLOCKED_NO_APP_DISEASE_IDS، activation_allowed=false |
| Citrus model validation | `feature/coastal-leaf-diagnosis-v2-pilot:public/models/plant-disease/citrus-field-validation.json` | `221821dcbdfe112a063d9ca52d254188d3d7ec5d` | اختبار 134 صورة، شجرة مستقلة؛ مصدر مغربي، وليس تحققاً سورياً |

## 2) خريطة فئات Citrus Field V3 الفعلية

| فئة المصدر كما هي | App pilot ID كما هو | طبيعة الربط | الحالة الإنتاجية |
|---|---|---|---|
| California red scale-like (Aonidiella aurantii) | `citrus_scale_like` | EXACT على مستوى اسم الفئة التجريبية فقط | BLOCKED — لا disease ID إنتاجي |
| Greasy spot-like - Zasmidium citri-griseum (anciennement Mycosphaerella citri) | `citrus_greasy_spot_like` | EXACT على مستوى اسم الفئة التجريبية فقط | BLOCKED — لا disease ID إنتاجي |
| apparently healthy | `citrus_source_healthy` | EXACT على مستوى فئة المصدر فقط؛ ليست شهادة صحة النبات | BLOCKED — لا disease ID إنتاجي |
| greening-like | `citrus_greening_like` | EXACT على مستوى اسم الفئة التجريبية فقط | BLOCKED — لا disease ID إنتاجي |

ملاحظة: IDs الأربعة موجودة في ملف pilot، لكن جميعها تحمل `experimentalOnly: true`. لا تُنسخ إلى `labels.json` الإنتاجي ولا تعامل كمعرّفات مرضية معتمدة.

## 3) حسم أسماء Anthracnose / Canker / Leafminer

هذه الأسماء مأخوذة من `results/lemon-v3/labels.json`، وليست من قائمة مخرجات Citrus Field V3.

| فئة Lemon V3 المصدرية | القرار بالنسبة إلى Citrus Field V3 | سبب القرار | ملاحظة |
|---|---|---|---|
| Anthracnose | DROP من خريطة Citrus Field V3 | ليست فئة ضمن مخرجات Citrus Field V3 الأربع | تبقى فئة مصدرية مستقلة في Lemon V3؛ لا يعني DROP حذفها من كل المشروع |
| Citrus Canker | DROP من خريطة Citrus Field V3 | ليست فئة ضمن مخرجات Citrus Field V3 الأربع | لا تُدمج تلقائياً مع أي فئة `-like` |
| Citrus Leafminer | DROP من خريطة Citrus Field V3 | ليست فئة ضمن مخرجات Citrus Field V3 الأربع | مسارات الأنفاق علامة بصرية مهمة، لكنها لا تثبت وجود فئة في هذا النموذج أو تطابق disease ID |

هذه القرارات تخص **خريطة نموذج Citrus Field V3 فقط**، ولا تحسم صلاحية Lemon V3 أو صحة وسومه.

## 4) فصل الفئات الوصفية

- `scale-like` و`greasy spot-like` و`greening-like` تبقى أوصافاً/أنماطاً مصدرية تجريبية، ولا تتحول إلى تشخيصات مؤكدة.
- لا يوجد أساس في الملفات الحالية لدمج greasy spot-like مع greening-like؛ فهما فئتان منفصلتان في المصدر.
- لا يجوز تحويل `apparently healthy` إلى ادعاء أن النبات سليم. المعنى التشغيلي يظل: لم يرصد النموذج نمطاً مرضياً واضحاً ضمن فئاته فقط.
- لا تُستخدم `EXACT` هنا إلا لوصف تطابق اسم فئة المصدر مع pilot ID، وليس اعتماداً مرضياً أو إنتاجياً.

## 5) قيود النموذج والأدلة

بطاقة النموذج تصف هذه الفئات بأنها فئات مصدرية، وتوضح أن بيانات Citrus Field V3 من منطقة فاس-مكناس بالمغرب، وأنها ليست تحققاً سورياً، وأن بعض الوسوم `-like` بصرية وليست مؤكدة مخبرياً. ملف التحقق يذكر 134 صورة اختبار مستقلة حسب الشجرة، بدقة 86.57% وMacro-F1 قدره 85.76% ضمن نطاق مجموعة المصدر فقط. لا يجوز تعميم هذه الأرقام على الساحل السوري أو اعتبارها احتمالات معايرة.

## 6) شروط إعادة فتح الحسم الإنتاجي

- [x] نسخ فئات Citrus Field V3 الأربع حرفياً من ملف labels المصدر.
- [x] نسخ IDs الأربعة حرفياً من ملف pilot.
- [x] فصل Lemon V3 عن Citrus Field V3 ومنع خلط فئاتهما.
- [x] التحقق من ملف labels.json الإنتاجي.
- [ ] إضافة disease IDs معتمدة إلى مصدر الحقيقة بقرار تصنيفي مستقل ومراجَع.
- [ ] ربط كل فئة مصدرية بـ EXACT أو MERGE أو DROP إلى ID إنتاجي موثق، دون دمج آلي.
- [ ] مراجعة خبير للفئات الوصفية قبل أي ادعاء تشخيصي محدد.
- [ ] تحديث label-map بعد اعتماد IDs فقط.
- [ ] اجتياز بوابة البيانات والأقنعة والمعايرة والتحقق الميداني قبل تفعيل النموذج.

## 7) التوقيع

- المقرر: غير موقّع
- المراجع الخبير: غير متوفر في الأصول التي جرى فحصها
- الحالة: **BLOCKED_NO_APP_DISEASE_IDS**
- قرار التدريب/التفعيل: **NO-GO**
