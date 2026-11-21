# بيانات التدريب الخارجية — Dr Plant

تُخزّن الأرشيفات المفكوكة محلياً على Box تحت `data/external/2026-11/`. لا تُرفع الصور الخام إلى GitHub.

## المصادر المستخدمة في تدريب نوفمبر 2026

1. **Large-Scale Lemon Leaf Disease and Pest Image Dataset V3**
   - DOI: 10.17632/8d9fv6kpt3.3
   - URL: https://data.mendeley.com/datasets/8d9fv6kpt3/3
   - 17,586 صورة، 18 فئة، أربع مناطق في بنغلادش، CC BY 4.0.
   - لا توجد معرفات شجرة/مزرعة لكل صورة؛ التقسيم الحالي استكشافي على مستوى الصورة.

2. **Field-Based Citrus Leaf Disease Image Dataset V3**
   - DOI: 10.17632/szsms728jf.3
   - URL: https://data.mendeley.com/datasets/szsms728jf/3
   - 611 صورة، metadata.csv وrecommended_partition.csv، CC BY 4.0.
   - استخدمنا تقسيم أشجار مستقل، واستبعدنا IMG_0405 بسبب تعارض Tree_ID مع مسار الشجرة.

## مصادر لم تُدرّب بعد

- GVLiD V5: https://data.mendeley.com/datasets/wkymf8bhcg/5 — 3,477 صورة عنب، 4 فئات.
- FieldVitis V2: https://zenodo.org/records/17307846 — 555 صورة مشتقة من مجموعات منشورة؛ يلزم deduplication.
- Grape bunch powdery mildew severity: https://data.mendeley.com/datasets/z2f3vdc6nh/1 — 2,068 صورة عناقيد، ملف 4.21GB؛ مهمة مستقلة عن تشخيص الأوراق.

راجع الترخيص والإصدار ومصدر كل تسمية قبل إعادة الاستخدام أو التوزيع. لا تُخلط الأوراق والثمار/العناقيد في مصنف واحد.