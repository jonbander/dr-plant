# حصاد الساحل السوري — Dr Plant

أداة عربية لتوثيق أعراض أوراق المحاصيل الساحلية وإجراء **فرز بصري أولي** يعمل محلياً في المتصفح.

## الحالة التقنية الحالية

- تطبيق React + TypeScript + Vite مع دعم PWA.
- لوحة اختيارية للإنذار الجوي المبكر عن مؤشرات خطر البياض الزغبي في العنب، تعتمد على موقع المزرعة وبيانات الطقس الساعية؛ تتطلب الإنترنت ولا تمثل تشخيصاً أو نموذجاً محلياً معايراً.
- الفحص الحالي يقيس نسباً لونية تقريبية ويجري بوابات أولية لجودة الصورة.
- **لا يحتوي هذا الإصدار على نموذج تعلم عميق مدرّب لتشخيص أمراض النبات.**
- لا يحدد نوع المحصول تلقائياً، ولا يصدر اسم مرض مؤكداً، ولا يوصي بمبيد أو جرعة.
- المساعد اليدوي يطابق المحصول والجزء المتأثر ونمط العرض قبل عرض سجل مرجعي محتمل؛ إذا لم يوجد تطابق مدعوم يبقي السبب غير محدد بدلاً من تخمين مرض. ولا يُعد ذلك تشخيصاً مؤكداً.
- جرعات المبيدات القديمة غير موثقة محلياً ولا ينبغي استخدامها.

## التطوير

يتطلب Node.js 22 أو Bun حديثاً.

```sh
bun install --frozen-lockfile
bun run validate:knowledge
bun run lint
bun run test
bun run build
```

## التعاون مع وكلاء الذكاء الاصطناعي

المستودع عام ويمكن للوكلاء الذين يستطيعون الوصول إلى GitHub قراءة المشروع ومراجعته. تعليمات العمل المشتركة موجودة في [AGENTS.md](./AGENTS.md)، مع ملفات توجيه لـ [Gemini](./GEMINI.md)، و[Claude](./CLAUDE.md)، و[GitHub Copilot](./.github/copilot-instructions.md).

- قاعدة المعرفة البحثية: [data/knowledge-base.json](./data/knowledge-base.json)
- أضيف جرب الحمضيات (*Elsinoë fawcettii*) كمرجع أولي للّيمون؛ لا يعني ذلك تأكيد وجوده محلياً أو أن النموذج تعلمه.
- دليل الأدلة وحدود التشخيص: [docs/DIAGNOSTIC_EVIDENCE.md](./docs/DIAGNOSTIC_EVIDENCE.md)
- سجل الأدلة البحثية الخاصة بالساحل السوري وأولويات الحصول على الصور: [docs/SYRIAN_COAST_EVIDENCE.md](./docs/SYRIAN_COAST_EVIDENCE.md)
- سجل المصادر الساحلية القابل للفرز: [research/2026-11/syrian-coast-source-register.csv](./research/2026-11/syrian-coast-source-register.csv)
- يجب أن تمر كل إضافة بحثية بفحص المصدر والحالة العلمية وترخيص الصور.
- لا تمنح علنية المستودع أي وكيل صلاحية على حسابات أو ملفات خاصة.

## متطلبات بناء تشخيص يمكن الاعتماد عليه

1. جمع صور حقلية حقيقية من أصناف الساحل السوري مع بيانات المحصول والصنف والموسم والظروف.
2. تسمية الصور بواسطة مهندسين/مختبرات نباتية، مع فئة «غير معروف/مختلط».
3. فصل التدريب والاختبار حسب البستان/المزرعة والموسم، لا بتوزيع صور عشوائي.
4. اختبار مستقل على هواتف وظروف إضاءة مختلفة، ونشر الحساسية والنوعية ومصفوفة الالتباس ومعايرة الثقة.
5. الامتناع عن الإجابة عند انخفاض جودة الصورة أو وجود حالة خارج بيانات التدريب.
6. تدقيق كل علاج على ملصق منتج مسجل محلياً، مع الجرعة وفترة ما قبل الحصاد وفترة إعادة الدخول والمحصول المستهدف.

## الإنذار الجوي المبكر

راجع [توثيق حدود نموذج الطقس ومصدر البيانات](./docs/WEATHER_EARLY_WARNING.md). تستخدم النسخة التجريبية Open-Meteo دون مفتاح API؛ الاستخدام المجاني للخدمة مقصور على غير التجاري، ويلزم ترخيص تجاري إذا أصبح التطبيق إعلانياً أو مدفوعاً. لا تصدر الميزة إشعارات دفع عند إغلاق التطبيق.

## مراجع فنية

- UC IPM — البياض الزغبي على العنب: https://ipm.ucanr.edu/agriculture/grape/downy-mildew/
- UC IPM — البياض الدقيقي على العنب: https://ipm.ucanr.edu/agriculture/grape/powdery-mildew/
- University of Minnesota Extension — تبقعات أوراق العنب: https://apps.extension.umn.edu/garden/diagnose/plant/fruit/grape/leavesspots.html
- UF/IFAS — تشخيص أمراض الحمضيات: https://ask.ifas.ufl.edu/publication/CH159
- UF/IFAS — صانعة أنفاق أوراق الحمضيات: https://ask.ifas.ufl.edu/publication/IN165
- Xiang et al. (2026), cross-domain reliability gap in plant disease classification: https://doi.org/10.3389/fpls.2026.1826962

هذه المراجع تساعد على فهم الأعراض ومخاطر التعميم، ولا تثبت ملاءمة أي مبيد أو جرعة للسوق السورية.


## Research-only training outputs (2026-11-21)

Candidate training runs and their reports are kept separate from the application runtime:

- [November 2026 training report](./results/2026-11/REPORT_AR.md)
- [Dataset source audit and version corrections](./research/2026-11/dataset-audit.md)
- [Citrus Field V3 metrics](./results/citrus-field-v3/metrics.json)
- [Lemon V3 metrics](./results/lemon-v3/metrics.json)
- [Previous training archive](./results/archive/README_AR.md)

These research candidates are **not enabled in the app**. Neither source-domain scores nor tree-held-out results from a single Moroccan orchard establish performance on Syrian coastal farms. Syrian external validation, label review, calibration and abstention are required before integration.
