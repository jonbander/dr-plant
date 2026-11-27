# Morphology V1 — تقوية إثبات استقلال المجموعات الحقلية (2026-11-27)

## التغيير

تم تشديد مدقق `scripts/research/audit_grape_morphology_v1.py`. لم يعد وجود `field_group_id` أو معرفات نبات/كرمة وموقع/مزرعة وجلسة كافياً وحده للسماح بادعاء تقييم حقلي مستقل.

يشترط الوضع الصارم الآن، لكل صف:

- هوية حقلية كاملة: `field_group_id` أو معرف نبات/كرمة + مزرعة/موقع + جلسة.
- مصدر موثق للهوية: `source_metadata` أو `field_log` أو `acquisition_manifest` أو `expert_annotation`.
- مرجع دليل غير فارغ وبصمة SHA-256 بطول 64 خانة.
- اسم المراجع وحالة `field_identity_status=verified`.
- عدم إعادة استخدام `group_id` أو معرّف pHash/المصدر على أنه `field_group_id`.
- استمرار منع انتقال أي هوية نبات/كرمة/مزرعة/موقع/جلسة بين train/val/test.

## الاختبارات الجديدة

أضيفت اختبارات تمنع:
- قبول field_group_id عشوائي بلا دليل.
- تمرير group_id نفسه على أنه field_group_id.
- قبول بصمة دليل غير صالحة.
- ادعاء استقلال حقلي عند غياب بيانات الإثبات.

## حدود الإثبات

المدقق يتحقق من اكتمال حقول سلسلة الإثبات وصيغة البصمة، لكنه لا يستطيع وحده إثبات صحة السجل الخارجي أو أصالة المراجع. يجب أن تكون مراجع الأدلة قابلة للمراجعة البشرية، ويجب ألا تُملأ هذه الحقول تخميناً. لا ينتج عن اجتياز هذا المدقق اعتماد تشخيصي أو جاهزية إنتاج.

## التشغيل

```bash
python3 -m unittest scripts.test_audit_grape_morphology_v1 -v
python3 scripts/research/audit_grape_morphology_v1.py \
  --manifest PATH/TO/manifest.csv \
  --output PATH/TO/audit.json \
  --require-field-independent
```
