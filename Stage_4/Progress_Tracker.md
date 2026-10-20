# Stage 4 — حالة التقدم المثبتة

**تاريخ الفحص: 20 أكتوبر 2026 — Asia/Riyadh (UTC+3).** المرجع المنشور المفحوص هو [`development` عند `e6c69bf`](https://github.com/ghadi0alzhrani0/Mezyad/commit/e6c69bfbee7405b85bdaea94c89c27181455ccfa)، بعد دمج PR #11. هذا تحديث توثيق فقط؛ لا يشمل خدمات الحساب المحفوظة محليًا وغير المرفوعة، ولا نتائج اختباراتها. نجاح CI دليل تنفيذ اختبارات المصدر المحدد، وليس قبولًا نهائيًا لكل متطلبات Stage 4.

## المنجز المنشور والمختبر

| المجال | ما ثبت | الدليل والحدود |
| --- | --- | --- |
| تكامل Frontend مع Backend | صور API الموقعة، تصحيح الإعلان المرفوض، حقول الفئة، المشرف العام والخاص، والنتيجة الشخصية بعد Refresh ضمن العقود المتاحة | [PR #7](https://github.com/ghadi0alzhrani0/Mezyad/pull/7)، دمج `b3f8eab`، ثم إصلاحات [PR #9](https://github.com/ghadi0alzhrani0/Mezyad/pull/9) ودمج `baab54b`؛ [التغطية وحدودها](Testing_Report.md#current-results) |
| تثبيت واجهات المزاد والمراجعة | دقة المبالغ، منع المزايدة بعد الإغلاق، إخفاء بيانات المشرف بعد تغير الصلاحية، تجديد الصور، وإدارة التركيز | [PR #9](https://github.com/ghadi0alzhrani0/Mezyad/pull/9)، رأس التطبيق `21e5570`؛ تجربة متصفح هندسية موثقة في وصفه، دون ادعاء اجتماع قبول |
| الاختبارات الحالية | Backend: 110؛ React: 367؛ Playwright: 87؛ المشغّل: 6؛ Build ناجح | [CI على `e6c69bf`](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335)، 20 أكتوبر؛ صفر فشل/تجاوز، وPlaywright صفر flaky؛ ليست أعداد قصص مقبولة |
| تنظيم CI | فحوص مستقلة و`accounts` مطلوب؛ نطاق التشغيل للفروع الستة المعتمدة | [PR #7](https://github.com/ghadi0alzhrani0/Mezyad/pull/7)؛ [PR #8](https://github.com/ghadi0alzhrani0/Mezyad/pull/8) حدّث CI فقط في `main`، ولم ينقل إليه تطبيق development |
| توثيق التصميم | الفلوز التسعة ونقاط بدايتها وخطواتها الفعلية والفروق عن التطبيق | [PR #11](https://github.com/ghadi0alzhrani0/Mezyad/pull/11)، [دليل الفلوز](../docs/figma-flows.md)؛ قراءة 74 شاشة مرتبطة، وليست شهادة مطابقة كل الشاشات الـ147 |

التسلسل محفوظ: **إنشاء الإعلان → `PENDING_REVIEW` → قرار ADMIN → `APPROVED` → اختيار البائع `PUBLIC` أو `PRIVATE` → إعداد الأسعار والمواعيد → إنشاء المزاد**. لا ينشئ المشرف المزاد ولا تنشئه الموافقة تلقائيًا.

## المتبقي والمؤجل والعوائق

| البند | الحالة الحالية | ما يلزم لإغلاقه |
| --- | --- | --- |
| تعديل الحساب والاستعادة والإشعارات | غير متاحة في development المفحوص؛ العمل المحلي المنفصل ليس منشورًا أو مدمجًا | نشر Backend المعتمد ودمجه واختبار التكامل قبل اعتبار هذه الخدمات متاحة؛ لا تُنسب نتائج الحزمة المحلية إلى CI أعلاه |
| Banking Sandbox | **مؤجل بقرار النطاق**؛ `BANK_SANDBOX_UNAVAILABLE` يبقى فشلًا صريحًا | عقد وتشغيل مزود معتمد إذا أعيد فتح نطاق البنك؛ أهلية `SUCCESS` في الاختبارات اصطناعية فقط؛ [السجل المنشور](../docs/open-banking-blocker.md) |
| QA-14 والمطابقة الشاملة | تغطية حالات محددة موجودة؛ التدقيق الشامل لكل شاشة/حالة وجهاز غير مثبت | استكمال دليل QA والمراجعة البصرية؛ لا تعني اختبارات قياسات 320/390/768/1440px مطابقة بصرية كاملة أو اختبار أجهزة فعلية |
| المسودة بعد إعادة تحميل كاملة | تبقى بين خطوات النموذج نفسه وعند فشل الطلب؛ مغادرة المسار أو Reload كامل لا تحفظها | قرار نطاق واختبار استعادة مناسب؛ نقص Frontend معروف، لا يُخفى على أنه عائق Database |
| الشروط والخصوصية والتواصل | محتوى وقناة تواصل معتمدان غير موثقين | اعتماد المحتوى ثم ربطه؛ لا تأليف نصوص أو قناة اتصال بديلة |
| Sprint Reviews / Retrospectives والقبول | توجد أدلة تنفيذ هندسية، ولا توجد محاضر تثبت اجتماعًا أو حضورًا أو قبول منتور | [حالة العروض](Sprint_Reviews.md)، [القرارات والمقترحات](Retrospectives.md)؛ توثيق الحدث الحقيقي عند حصوله |
| إنتاج فعلي | لا رابط إنتاج معتمد في الملفات المنشورة؛ GitHub Deployments فارغ وEnvironments = 0 وقت الفحص | URL وإعداد تشغيل ودليل فحص بيئة إنتاج؛ CI وlocalhost ليسا نشرًا إنتاجيًا |

## مصادر التخطيط وQA دون تعديل عمل الفريق

- [Sprint Plan](Sprint_Plan.md) و[Product Backlog](Product_Backlog.md) منشوران، لكن مواعيد السبرنت والنقاط المقبولة غير موثقة، وبعض حالات التنفيذ فيهما أقدم من الأدلة أعلاه. لم يُعدّل أي منهما ولم تُغيّر مسؤوليات الفريق.
- [Bug Tracker](Bug_Tracker.md) يتضمن فجوات تاريخية. أدلة الصور والواجهات والتزامن الأحدث تدعم إعادة مطابقة GAP-01/02/04/05 مع الاختبارات؛ لا ندّعي أن مالكة السجل أغلقتها أو أن كل عيب ممكن حُلّ.
- [Frontend QA Report](Frontend_QA_Report.md) و[التوثيق الأصلي لاختبارات PostgreSQL](../docs/native-postgresql-validation.md) منشوران كأدلة تاريخية، بأعداد تخص مصادرهما؛ لا تُستبدل بالأعداد الحالية.
- تقرير Database/Backend QA في [PR #10](https://github.com/ghadi0alzhrani0/Mezyad/pull/10) **مفتوح وغير مدمج وقت الفحص**؛ قُرئ فقط. [التقرير عند `4d794dd`](https://github.com/ghadi0alzhrani0/Mezyad/blob/4d794dd0725846f9e9b1cf18669416ecd49b864b/Stage_4/Integration_QA_Traceability.md) يستشهد باختبار `baab54b`، ولا يُعامل كملف موجود في development أو كقبول نهائي.

## قياس التقدم

لا نسبة اكتمال أو Velocity أو Burndown محسوبة: لا توجد قاعدة نقاط مخططة ومقبولة أو سجل حضور يمكن التحقق منه. أعداد الاختبارات ليست بديلًا لهذه المقاييس. حالة التسليم: **تطبيق مدمج ذو اختبارات ناجحة ضمن الحدود المذكورة؛ اكتمال Stage 4 وقبولها النهائي غير مثبتين**.

---

## السجل التاريخي المحفوظ — 12–13 أكتوبر 2026

> النص التالي محفوظ كما كان. الأحكام والأعداد والقيود فيه تخص تاريخه ومصدره، ولا تستبدل الحالة الحالية أعلاه. القوالب ليست محاضر أحداث فعلية.

# Stage 4 — Sprint Monitoring Dashboard

**Snapshot: 13 October 2026.** Includes local and GitHub CI account execution
evidence for the published change set. Full marketplace acceptance remains pending;
historical sprint completion is not inferred from this work.

## Current engineering snapshot

| Area | Source exists? | Acceptance verified? | Next gate |
|---|---|---|---|
| PostgreSQL schema + seed | Yes | Fresh migration + category seed passed locally; full integrity QA pending | FK/integrity assertions |
| Authentication + permissions API | Yes | QA-01/02/03 + session checks passed locally and in GitHub CI | QA-03A/B remain pending |
| Listing and admin review API | Yes | No | QA-04/17 |
| Image upload | No | No | Implement + QA-22 |
| Public/private auction API | Yes | No | QA-05/06 |
| Commitment provider | Fail-closed placeholder | No | Official sandbox integration |
| Atomic bidding + closure API | Yes | No | QA-08–13, QA-18–20, QA-23 |
| React frontend | Partial | Approved Figma account UI, item identity/navigation, polling and countdown tested locally and in GitHub CI | Full listing/private/bidding UI and E2E |
| QA execution | HTTP/PostgreSQL account/catalog + React suites | 22 backend runner entries + 30 frontend tests passed locally and in GitHub CI | Remaining Stage 3 QA cases |
| Reviews and retros | Templates | No | Actual meeting evidence |

## Actual sprint metrics

| Sprint | Planned points | Accepted points | Velocity | Bug resolution | Actual stand-up record |
|---|---:|---:|---|---|---|
| 1 | Not baselined | Not verified | N/A | N/A | Not supplied |
| 2 | Not baselined | Not verified | N/A | N/A | Not supplied |
| 3 | Not baselined | Not verified | N/A | N/A | Not supplied |
| 4 | Not baselined | Not verified | N/A | N/A | Not supplied |

**Formulas:** Completion = accepted / planned × 100; velocity = accepted story points per sprint; bug resolution = verified fixed / verified discovered × 100. Do not calculate if no real denominator.

## Daily stand-up entry

**Date:**  
**Attendees:**  
**Yesterday — completed with link:**  
**Today — task and owner:**  
**Blockers and age:**  
**Escalation / next action:**  
**Updated backlog IDs:**  
**Meeting/Discord/Notion evidence:**

## Escalation

The verified external blocker is access to an official supported banking sandbox operation. Escalate with provider name, access request date, requested scope and mentor decision; do not invent these details.
