# Stage 4 — القرارات والتحسينات المثبتة وحالة Retrospectives

**تاريخ الفحص: 20 أكتوبر 2026 — Asia/Riyadh (UTC+3).** المرجع المنشور المفحوص هو [`development` عند `e6c69bf`](https://github.com/ghadi0alzhrani0/Mezyad/commit/e6c69bfbee7405b85bdaea94c89c27181455ccfa)، بعد دمج PR #11. هذا تحديث توثيق فقط؛ لا يشمل خدمات الحساب المحفوظة محليًا وغير المرفوعة، ولا نتائج اختباراتها. نجاح CI دليل تنفيذ اختبارات المصدر المحدد، وليس قبولًا نهائيًا لكل متطلبات Stage 4.

## قرارات وتحسينات لها أثر منشور

هذه ملاحظات مستندة إلى سجل التنفيذ؛ **ليست محاضر نقاش جماعي أو اقتباسات من أعضاء الفريق**. لا تتوفر أدلة تسمح بإسناد حضور اجتماع أو إجماع أو موعد Retro.

| التاريخ/المصدر | القرار أو التحسين المثبت | الأثر الذي يمكن التحقق منه | الحد |
| --- | --- | --- | --- |
| 20 أكتوبر — [PR #7](https://github.com/ghadi0alzhrani0/Mezyad/pull/7)، `b3f8eab` | دمج الواجهة مع Backend المعتمد مع الاحتفاظ بإصلاح الجلسة و`responseMeta` والتأكيدات | سجل الدمج واختبارات الجلسة؛ فصل أوامر React والمشغّل وE2E | لا يُستنتج منه اجتماع تخطيط أو قبول نهائي |
| 20 أكتوبر — PR #7 و[PR #8](https://github.com/ghadi0alzhrani0/Mezyad/pull/8) | CI مستقل وواضح ومحدود بالفروع الستة؛ الاحتفاظ بفحص `accounts` وحماية الفروع | فحوص مطلوبة قبل الدمج؛ `main` تلقى CI فقط | وجود الفحص لا يثبت وحده تغطية كل متطلبات المنتج |
| 20 أكتوبر — [PR #9](https://github.com/ghadi0alzhrani0/Mezyad/pull/9)، `baab54b` | معالجة عيوب ظهرت في مراجعة المتصفح بإصلاحات محددة واختبارات رجوع | دقة الأموال، الإغلاق، فقد صلاحية المشرف، تجديد الصور، والتركيز؛ CI ناجح | لا يعني عدم وجود عيوب أخرى؛ لم تُختبر كل الأجهزة فعليًا |
| 20 أكتوبر — PR #7/#9 و[سجل البنك](../docs/open-banking-blocker.md) | تأجيل البنك مع إبقاء الفشل صريحًا | عدم تحويل عدم توفر الخدمة إلى نجاح؛ أهلية الاختبار داخل قاعدة مؤقتة فقط | البنك ليس مكتملًا أو معتمدًا |
| 20 أكتوبر — [PR #11](https://github.com/ghadi0alzhrani0/Mezyad/pull/11)، `e6c69bf` | توثيق خطوات Figma الفعلية والفروق عن التطبيق دون نشر خدمات الحساب المحلية | [دليل تسعة فلوز](../docs/figma-flows.md)، Figma Make والسجل التاريخي محفوظان | قراءة التفاعلات ليست اختبار استخدام شاملًا لكل شاشة |

## ما يحتاج نقاشًا، لا يُسجَّل كقرار متفق عليه

| مقترح للنقاش | سبب طرحه | معيار تحقق مقترح | حالة المالك/التاريخ |
| --- | --- | --- | --- |
| Start — تثبيت محاضر العرض والقبول | لا توجد محاضر موثقة للسبرنتات الأربعة | موعد حقيقي، حضور موثّق، SHA، نتائج العرض والقصص المقبولة | يحتاج اتفاقًا؛ لا تكليف جديد لأحد هنا |
| Stop — الخلط بين مصدر محلي ونسخة مدمجة | خدمات الحساب جاهزة في تسليم محلي منفصل ولم تُنشر | مطابقة المصدر والعقد والاختبارات عند نشرها لاحقًا | مقترح إجراء؛ هذا التحديث لا يرفعها |
| Continue — اختبارات رجوع وعزل البيانات | PR #9 أصلح عيوبًا محددة مع اختبارها | ربط كل إصلاح بالدليل، وعدم اعتبار Mock بنكًا حقيقيًا | ممارسة مثبتة؛ استمرارها مقترح |
| Improve — ربط التخطيط والعيوب بأدلة أحدث | بعض حالات الخطة/Backlog/Bug Tracker أقدم من النسخة المدمجة | مراجعة السجلات بواسطة أصحابها دون محو تاريخها، وإثبات الإغلاق | ينتظر تنسيق الفريق؛ هذه الملفات لم تُعدّل |
| Improve — استكمال QA-14 والمراجعة البصرية | تغطية حالات وأحجام معينة لا تساوي كل الأجهزة/147 شاشة | قائمة حالات وعرض/لوحة مفاتيح ونتيجة موثقة لكل جزء مطلوب | المقترح غير مقبول أو مجدول تلقائيًا |

## اجتماعات Retrospective

حالة السبرنتات 1–4: **لا محضر اجتماع منشور يمكن التحقق منه**. سجل النقاشات والقرارات وأصحاب الإجراءات ومواعيدها فقط بعد حدوثها، ولا تحوّل الجدول أعلاه إلى محضر اجتماع. القوالب الأصلية أدناه محفوظة كسجل إعداد سابق.

---

## السجل التاريخي المحفوظ — 12–13 أكتوبر 2026

> النص التالي محفوظ كما كان. الأحكام والأعداد والقيود فيه تخص تاريخه ومصدره، ولا تستبدل الحالة الحالية أعلاه. القوالب ليست محاضر أحداث فعلية.

# Stage 4 — Sprint Retrospectives

A retrospective follows each real sprint review. It is not a prediction or a generic lessons-learned paragraph.

| Sprint | Meeting date | Start | Stop | Continue | Assigned improvement | Evidence |
|---|---|---|---|---|---|---|
| 1 | Pending | To be agreed | To be agreed | To be agreed | Owner/date pending | None yet |
| 2 | Pending | To be agreed | To be agreed | To be agreed | Owner/date pending | None yet |
| 3 | Pending | To be agreed | To be agreed | To be agreed | Owner/date pending | None yet |
| 4 | Pending | To be agreed | To be agreed | To be agreed | Owner/date pending | None yet |

## Prompts for the actual team discussion

- **Start:** Which missing test, process or review would prevent the same blocker next sprint?
- **Stop:** Which repeated action caused wasted work or risky merges?
- **Continue:** Which collaboration or technical practice measurably helped?
- **Improve:** Record one actionable change with owner, due date and a measurable verification criterion.

## Meeting template

**Date and participants:**  
**What worked (with example):**  
**What did not work (with example):**  
**Root cause:**  
**Improvement action:**  
**Owner and due date:**  
**How we will verify next sprint:**  
**Meeting link / notes:**
