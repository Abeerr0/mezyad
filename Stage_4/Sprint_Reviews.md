# Stage 4 — العروض المثبتة وحالة Sprint Reviews

**تاريخ الفحص: 20 أكتوبر 2026 — Asia/Riyadh (UTC+3).** المرجع المنشور المفحوص هو [`development` عند `e6c69bf`](https://github.com/ghadi0alzhrani0/Mezyad/commit/e6c69bfbee7405b85bdaea94c89c27181455ccfa)، بعد دمج PR #11. هذا تحديث توثيق فقط؛ لا يشمل خدمات الحساب المحفوظة محليًا وغير المرفوعة، ولا نتائج اختباراتها. نجاح CI دليل تنفيذ اختبارات المصدر المحدد، وليس قبولًا نهائيًا لكل متطلبات Stage 4.

## ما عُرض أو جُرّب فعلًا

| التاريخ | النسخة والمصدر | نوع الدليل والنتيجة | الملاحظات وحدود الاستنتاج |
| --- | --- | --- | --- |
| 13 أكتوبر 2026 | [`c3764b9`](https://github.com/ghadi0alzhrani0/Mezyad/commit/c3764b989eb3c751ce8668d2430f22846dea0ae9)، [Testing Report التاريخي](Testing_Report.md#historical-testing) | تجربة حساب/تصفح في المتصفح على React وExpress وPostgreSQL معزولة؛ التسجيل والدخول والخروج والعودة للمزاد وRefresh | تحقق هندسي محلي؛ لا تسجيل اجتماع أو حضور أو قبول منتور؛ ليس عرضًا كاملًا للمزاد والبنك |
| 20 أكتوبر 2026 | رأس PR #9: [`21e5570`](https://github.com/ghadi0alzhrani0/Mezyad/commit/21e55708f526c85bad1ceb177e320912bbb3695c)، [وصف PR #9](https://github.com/ghadi0alzhrani0/Mezyad/pull/9) | الوصف المنشور يثبت مراجعة تفاعلية حقيقية بالمتصفح على PostgreSQL 16 وحسابات اصطناعية معزولة، ثم تصحيحات المبالغ والإغلاق وخصوصية المشرف والصور والتركيز | لا يحدد الوصف موعد اجتماع أو حضورًا أو ملاحظات منتور. نتائج 367 React و87 Playwright و110 Backend و6 للمشغّل نتائج فحوص منفصلة، وليست عدد تجارب يدوية |
| 20 أكتوبر 2026 | [PR #11](https://github.com/ghadi0alzhrani0/Mezyad/pull/11)، `96fefa0` ثم دمج `e6c69bf` | توثيق التصميم المنشور: الفلوز التسعة وقراءة تفاعلات 74 شاشة وفتح رابط البروتوتايب | مراجعة بنية التصميم والتوثيق، وليست تجربة تشغيل يدوي لجميع شاشات التطبيق أو اجتماع Sprint Review |

[دليل الفلوز التسعة المنشور](../docs/figma-flows.md) هو مرجع ترتيب العرض، ولا يُعاد تنفيذه أو تعديله هنا. نجاح السيناريو التمثيلي في Figma لا يثبت نجاح بنك أو حفظًا في قاعدة البيانات.

## اجتماعات المراجعة والقبول التي تنتظر دليلًا

| السبرنت بحسب الخطة المنشورة | وضع الاجتماع | ما يمكن الاستناد إليه عند العرض | ما لم يُوثّق |
| --- | --- | --- | --- |
| 1 — Foundation | غير موثق | أدلة الحساب وقاعدة البيانات؛ [نتائج الاختبارات](Testing_Report.md) | التاريخ، الحضور، القصص المقبولة/المرفوضة، ملاحظات المنتور |
| 2 — Marketplace | غير موثق | الصور وتصحيح الإعلان والمراجعة والإنشاء العام والخاص في PR #7/#9 والاختبارات | اجتماع عرض وموافقته؛ لا يُحوّل نجاح CI إلى قبول قصص |
| 3 — Bidding | غير موثق؛ البنك مؤجل | دقة المزايدة والرفض والإغلاق والنتيجة في اختبارات معزولة | عرض تكامل مصرفي حقيقي؛ أهلية الاختبار الاصطناعية ليست بديلًا عنه |
| 4 — QA | غير موثق | فحوص development الناجحة وتقرير QA المنشور/المقترح مع بيان حالة الدمج | عرض نهائي موثق، مراجعة الحالات غير المغطاة وقرار قبول التسليم |

لا تُملأ أسماء حضور أو أقوال أو تواريخ اجتماعات بأثر رجعي. سجل ما حدث فعلًا مع SHA ودليل، وافصل **عرضًا هندسيًا** عن **اجتماع مراجعة** وعن **قبول أصحاب المصلحة**. قوالب 12–13 أكتوبر أدناه باقية للتعبئة عند وجود حدث حقيقي.

---

## السجل التاريخي المحفوظ — 12–13 أكتوبر 2026

> النص التالي محفوظ كما كان. الأحكام والأعداد والقيود فيه تخص تاريخه ومصدره، ولا تستبدل الحالة الحالية أعلاه. القوالب ليست محاضر أحداث فعلية.

# Stage 4 — Sprint Reviews

**Do not confuse demonstration scripts with completed meetings.** Each review below is a planned acceptance event. Actual dates, attendees, feedback and outcomes must be recorded only after the meeting.

| Sprint | Demo script | Evidence to collect | Meeting status |
|---|---|---|---|
| 1 — Foundation | Register → log in → create listing → inspect DB | Commit, screen recording, SQL result | Not documented |
| 2 — Marketplace | Seller submits → admin approves → seller creates public/private auction → access control | PR, demo, API status log | Not documented |
| 3 — Bidding | Authorized bank commitment → bid, concurrent bids, closure | Provider evidence, parallel test logs, result row | Blocked on provider; review not documented |
| 4 — QA | Public and private browser E2E + negative tests | Browser demo, QA report, defect list | Not documented |

## Review record — copy for each real meeting

**Sprint:**  
**Date/time:**  
**Attendees / mentor:**  
**Commit SHA:**  
**Sprint goal:**  
**Demonstrated scenario and actual outcome:**  
**Accepted stories / rejected stories:**  
**Stakeholder feedback (verbatim only if authorized):**  
**Bugs and carry-over:**  
**Action / owner / due date:**  
**Evidence links:**

**Acceptance rule:** “Demonstrated” requires a running system and reproducible proof, not merely a route or screenshot in source control.
