# Stage 4 — نتائج الاختبارات وحدود الأدلة الحالية

**تاريخ الفحص: 20 أكتوبر 2026 — Asia/Riyadh (UTC+3).** المرجع المنشور المفحوص هو [`development` عند `e6c69bf`](https://github.com/ghadi0alzhrani0/Mezyad/commit/e6c69bfbee7405b85bdaea94c89c27181455ccfa)، بعد دمج PR #11. هذا تحديث توثيق فقط؛ لا يشمل خدمات الحساب المحفوظة محليًا وغير المرفوعة، ولا نتائج اختباراتها. نجاح CI دليل تنفيذ اختبارات المصدر المحدد، وليس قبولًا نهائيًا لكل متطلبات Stage 4.

<a id="current-results"></a>
## 1. CI الحالي على المصدر المنشور

[تشغيل development رقم 39488077335](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335) يختبر كومت دمج PR #11، `e6c69bfbee7405b85bdaea94c89c27181455ccfa`. بدأ 20 أكتوبر 2026 الساعة 22:59 وانتهى 23:03 تقريبًا بتوقيت الرياض. قُرئت سجلات الوظائف نفسها، لا أرقام التقارير الأقدم فقط. PR #11 غيّر توثيقًا فقط فوق `baab54b`؛ هذه الأعداد تخص التطبيق المنشور ولا تتضمن خدمات الحساب الجديدة المحلية.

| الفحص والأمر | النتيجة الفعلية | البيئة والدليل المباشر |
| --- | --- | --- |
| Backend — `npm test` مع `TEST_DATABASE_URL` | **110 ناجحة؛ 0 فشل؛ 0 skipped** | [وظيفة PostgreSQL](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335/job/118853746101)؛ Ubuntu 24.04، Node 24.21.0، PostgreSQL 16.15 مؤقتة؛ العد يتضمن حالات Node المتداخلة |
| React — `npm test` داخل frontend | **367 ناجحة في 18 ملفًا؛ 0 فشل/معلّق** | [وظيفة React](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335/job/118853746163)؛ Ubuntu 24.04، Node 24.21.0، Vitest وبيانات شبكة مضبوطة؛ ليست بدلًا من تكامل Backend |
| مشغّل المتصفح — `npm run test:runner` | **6 ناجحة؛ 0 فشل؛ 0 skipped** | [وظيفة المشغّل](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335/job/118853746146)؛ Node 24.21.0؛ تشمل رفض الفشل والتجاوز والتقرير الناقص |
| Playwright — `npm run test:e2e` | **87 ناجحة؛ 0 unexpected؛ 0 skipped؛ 0 flaky** | [وظيفة E2E](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335/job/118853746132)؛ Ubuntu 24.04، Node 24.22.0، Chromium/Chrome for Testing 156.0.8078.4، PostgreSQL 16.15؛ خادم ومخطط جديدان لكل ملف |
| Production Build — `npm run build` | **PASS** | [وظيفة Build](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335/job/118853746235)؛ بناء Vite، وليس نشر إنتاج |
| Syntax / YAML وactionlint / فروقات التحديث / readiness / `accounts` | **كلها PASS** | [كامل وظائف التشغيل](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39488077335)؛ فحص `accounts` المطلوب نجح دون تجاوز الحماية |

التثبيت عبر `npm ci` وملفات القفل المنشورة. PostgreSQL تحتوي بيانات اصطناعية داخل اختبار معزول؛ لا بيانات مستخدمين حقيقية. اختبارات المزايدات الناجحة تستخدم أهلية اختبارية، ولا تثبت إرسالًا أو قبولًا أو حجز أموال لدى بنك. لا يُجمع عدد Node وVitest وPlaywright في رقم قبول واحد.

## 2. سلسلة نتائج أقدم — محلية وCI منفصلتان

| التاريخ والمصدر | نوع الدليل/النسخة | النتائج وحدودها |
| --- | --- | --- |
| 13 أكتوبر — `c3764b9`، [النتيجة الأصلية أدناه](#historical-testing)، [CI 38427016481](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/38427016481) | تشغيل محلي macOS/Node 24.19.0 وPostgreSQL 16.15، ثم CI لنفس محتوى التطبيق | Backend 22 وReact 30 وBuild PASS؛ نطاق الحساب/التصفح، لا السوق كاملًا |
| 13 أكتوبر — [Frontend QA Report](Frontend_QA_Report.md) و[summary.json](summary.json) | حزمة محلية اختُبرت فوق baseline `46a84e7`؛ التقرير يصف ذلك التسليم القديم، وهو الآن ملف منشور في development، أُضيف أصلًا في الكومت `ce0ab08e73ce4100b41a0c133e57aa9b741ae065` | React 47؛ Playwright 12؛ Build PASS. React على macOS/Node 24.19.0؛ المتصفح Docker Playwright/Linux/Node 24.21.0 وPostgreSQL 16. التقرير لا يثبت SHA نهائيًا للـoverlay المختبر؛ لا يُنسب إلى HEAD الحالي |
| 20 أكتوبر — `3f87ff3` كما يسميه التقرير المحلي، [native PostgreSQL validation](../docs/native-postgresql-validation.md)، [backend handoff](../docs/backend-handoff.md) | تحقق محلي Native PostgreSQL 16.15 في Alpine/QEMU، وليس GitHub CI عند كتابة التقرير؛ تعذر حل المعرّف المحلي `3f87ff3` إلى كومت GitHub وقت الفحص، فلا يُنسب إليه CI أو رابط كومت عام | Backend 110 وBrowser 14، صفر فشل/تجاوز؛ سجل handoff يورد أيضًا 55 اختبار React وBuild ناجحًا في ذلك التسليم. نتيجة PGlite/SQL smoke ليست دليل أقفال PostgreSQL المتزامنة |
| 20 أكتوبر — [PR #7](https://github.com/ghadi0alzhrani0/Mezyad/pull/7)، دمج `b3f8eab` | وصف PR يسجل الاختبار المحلي على المصدر المدمج وقاعدة PostgreSQL 16 معزولة؛ [CI الدمج](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39448638227) ناجح أيضًا | محليًا: Backend 110، React 283، Playwright 83، المشغّل 6، Build والفروقات PASS؛ إصدارات كل أداة المحلية الدقيقة ليست مسجلة في وصف PR. لا ننسب أعداد الوصف إلى سجلات CI دون قراءتها |
| 20 أكتوبر — [PR #9](https://github.com/ghadi0alzhrani0/Mezyad/pull/9)، دمج `baab54b` | وصف PR يسجل النتائج المحلية ومراجعة متصفح فعلية على PostgreSQL 16 معزولة؛ [CI الدمج](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39462589800) ناجح، 20:01–20:09 بتوقيت الرياض | محليًا: Backend 110، React 367، Playwright 87، المشغّل 6، Build والفروقات PASS. تلك أقدم من CI المفصل في §1؛ الزيادة عن PR #7 هي 84 React و4 Playwright، لا حذف أو تجاوز اختبارات للحصول على العدد |

النتائج المحلية محفوظة كما وصفتها الأدلة المنشورة، وليست إعادة تشغيل أجريت لهذه المهمة التوثيقية. لم يُشغّل التطبيق أو أي مجموعة اختبار كاملة محليًا هنا؛ أُجري فحص التوثيق و`git diff --check` فقط، وتبقى فحوص GitHub للرفع الجديد إلزامية.

## 3. QA المنشور وحالة دمجه

| المصدر المقروء فقط | حالة المصدر وقت الفحص | كيفية استخدامه |
| --- | --- | --- |
| [Frontend_QA_Report.md](Frontend_QA_Report.md)، تاريخ 13 أكتوبر | موجود في development `e6c69bf`؛ تقرير تاريخي | أعداد 47/12 وقيود الرفع آنذاك ليست الحالة الحالية؛ أدلة 20 أكتوبر واختبارات الصور أحدث |
| [docs/native-postgresql-validation.md](../docs/native-postgresql-validation.md)، تاريخ 20 أكتوبر ومصدر `3f87ff3` | موجود في development؛ تقرير محلي تاريخي ذو معرّف مختبر لم يمكن حله على GitHub، وعبارة «لم يُرفع» تعكس وقت كتابته | يثبت حدود الاختبار الأصلي؛ نجاح CI الحالي موثق مستقلًا في §1 |
| [Integration_QA_Traceability.md عند `4d794dd`](https://github.com/ghadi0alzhrani0/Mezyad/blob/4d794dd0725846f9e9b1cf18669416ecd49b864b/Stage_4/Integration_QA_Traceability.md) و[PR #10](https://github.com/ghadi0alzhrani0/Mezyad/pull/10) | **منشور على tala، PR مفتوح وغير مدمج**؛ التقرير يستشهد بمصدر `baab54b` وCI 39462589800 | مرجع مقروء لتتبّع DB-01–12 وQA-01–23، لا يُقدّم كملف مدمج أو قبول نهائي؛ لم يُنسخ أو يُعدّل التقرير أو كود الفرع |

### حدود التغطية الحالية

- اختبارات PostgreSQL الحالية تغطي التسجيل والجلسات والصلاحيات، إنشاء/تصحيح الإعلان والصور، خصوصية المزاد، قواعد الأسعار والوقت والتزامن و`requestId` والإغلاق والنتيجة والنشاط. [مصادر Backend](../backend/tests) هي دليل الحالات المنفذة، لا مجرد وجود route.
- اختبارات [React](../frontend/tests) و[E2E](../frontend/e2e) تغطي أجزاء واجهات البائع والمشرف والمزايد والحساب، بما فيها الصور المحفوظة وإعادة التقديم والنتيجة بعد Refresh. النجاح يخص الحالات المكتوبة فقط.
- **QA-07: جزئي** — الفشل عند غياب البنك لا يتحول إلى موافقة؛ نجاح/رفض/Timeout مزوّد حقيقي مؤجل وغير مختبر.
- **QA-14: جزئي** — حالات Loading/Empty/Error وأحجام 320/390/768/1440px وحركة التركيز مغطاة في حالات محددة؛ لا تدقيق شامل لكل شاشة أو جهاز أو قارئ شاشة. لا ادعاء مطابقة Figma بنسبة 100%.
- لا تنسب استعادة المسودة بعد Reload كامل إلى الاختبارات؛ المسودة الحالية في حالة React بين خطوات النموذج نفسه وعند فشل الطلب؛ لا يوجد تخزين لاستعادتها بعد مغادرة المسار أو Reload كامل. تحرير الحساب والاستعادة والإشعارات غير متاحة في المصدر المنشور، ونتائج خدماتها المحلية منفصلة تمامًا.
- [دليل Figma](../docs/figma-flows.md) يميز النجاح التمثيلي عن التكامل الحقيقي. محتوى الشروط والخصوصية والتواصل واعتماد الإنتاج والمنتور غير مثبتين؛ لذلك لا إعلان باكتمال Stage 4.

---

<a id="historical-testing"></a>
## السجل التاريخي المحفوظ — 12–13 أكتوبر 2026

> النص التالي محفوظ كما كان. الأحكام والأعداد والقيود فيه تخص تاريخه ومصدره، ولا تستبدل الحالة الحالية أعلاه. القوالب ليست محاضر أحداث فعلية.

# Stage 4 — Quality Assurance & Execution Evidence

**Snapshot:** 13 October 2026 · **Status:** Approved Figma account UI, account integration and catalog identity tested locally; full marketplace acceptance remains pending.

**Tested application revision:** [`c3764b9`](https://github.com/ghadi0alzhrani0/Mezyad/commit/c3764b989eb3c751ce8668d2430f22846dea0ae9),
on `feature/account-integration`, based on `86028b4ffc703550f0f4cf185ff2e996b628ed27`.
Local runs preceded that commit; GitHub CI subsequently passed for the same
application content. The following delivery update changes status documentation
only. These results cover the account/catalog subset, not full marketplace acceptance.

**Environment:** macOS 27.0.1 (Apple Silicon), Node.js 24.19.0, Docker Desktop
4.94.0, PostgreSQL 16.15, Vite 6.4.4 and Vitest 4.1.11. Browser checks used the
Codex in-app browser; physical-device compatibility was not tested.

## 1. Environment and commands

| Component | Prerequisite | Execution command | Verified result |
|---|---|---|---|
| DB | Disposable PostgreSQL 16.15 | Existing `database/migrations/001_schema.sql`, via `psql -v ON_ERROR_STOP=1` in the test container | PASS — ten tables and indexes created |
| DB seed | Migrated demo test DB | Existing `database/seeds/001_categories.sql`, via `psql -v ON_ERROR_STOP=1` | PASS — five categories inserted |
| Backend syntax | Node 24.19.0 + dependencies | `cd backend && npm run check` | PASS |
| Backend tests | Dedicated PostgreSQL test DB | `cd backend && TEST_DATABASE_URL=… npm test` | PASS — 22 runner entries, 0 failed, 0 skipped |
| Frontend tests | Vitest 4.1.11, jsdom | `cd frontend && npm test` | PASS — 30 tests in three files, 0 failed, 0 skipped |
| React bundle | Vite 6.4.4 | `cd frontend && npm run build` | PASS — 33 modules transformed |
| GitHub CI | Ubuntu runner + PostgreSQL 16, Node 24 | Account integration checks on `c3764b9` | PASS — backend syntax/tests, frontend tests and build |
| Account/browser integration | Running PostgreSQL/API/React | Register/login/logout; auction → login reload → same auction; category/gallery identity | PASS — account and browsing subset only |
| Full marketplace E2E | Complete listing/private/bidding UI + provider access | Public/private auction journeys | NOT RUN |

Lockfiles have been generated locally for both workspaces. Clean installation
using `npm ci --ignore-scripts --no-audit --no-fund` passed in each workspace;
the tests and build above passed after that installation. An earlier offline
frontend installation failed because the local npm cache lacked `yallist`;
installation with registry access resolved it. Both lockfiles are included in the
published account change set.

## 2. Full Stage 3 traceability

| ID | Check | Status |
|---|---|---|
| QA-01 | Duplicate email → 409 | PASS — PostgreSQL integration + Arabic UI feedback test |
| QA-02 | Wrong password → 401 | PASS — PostgreSQL integration + UI test + browser check |
| QA-03 | Non-admin review → 403 | PASS — USER denied; separately provisioned ADMIN approved test listing |
| QA-03A | Seller cannot bid own auction | NOT RUN |
| QA-03B | Same account can sell and bid elsewhere | NOT RUN |
| QA-04 | Auction from unapproved item rejected | NOT RUN |
| QA-05 | Invalid private code denied | NOT RUN |
| QA-06 | Direct private GET/bid denied | NOT RUN |
| QA-07 | Sandbox timeout/error → no false approval | NOT RUN |
| QA-08 | Bid below minimum rejected | NOT RUN |
| QA-09 | Duplicate requestId accepted at most once | NOT RUN |
| QA-10 | Simultaneous bids serialize consistently | NOT RUN |
| QA-11 | Bid at/after endTime rejected | NOT RUN |
| QA-12 | Close no-bid auction → no winner | NOT RUN |
| QA-13 | Repeated closure yields same result | NOT RUN |
| QA-14 | Empty/loading/error UI states | PARTIAL — account loading/error/retry states tested; empty public list observed; other journeys pending |
| QA-15 | Public auction E2E | NOT RUN |
| QA-16 | Private auction E2E | NOT RUN |
| QA-17 | Rejected item edit/resubmit | NOT RUN |
| QA-18 | First bid equals starting price | NOT RUN |
| QA-19 | Later bid below increment rejected | NOT RUN |
| QA-20 | Winner from another auction prohibited | NOT RUN |
| QA-21 | Own listing + other bids appear in activity | NOT RUN |
| QA-22 | Invalid/oversized image rejected | NOT RUN — feature missing |
| QA-23 | Late bid rejected; lazy closure finalized | NOT RUN |

## 3. High-risk test design

**Concurrent bidding:** Create two users with verified commitment; issue parallel requests for same auction and same threshold; assert accepted prices serialize, no duplicate `requestId`, and DB `current_price` equals highest accepted bid.

**Private auction:** Direct GET without grant → denied; incorrect code → denied; correct code → grant; verify no cross-user data leakage; add brute-force protection test when implemented.

**Banking:** Official authorized provider success/failure/timeout; preserve redacted request ID and response; never mark a simulated success as real integration.

**Closure:** No bids → no winner; repeat finalization → stable result; endTime passed → no late bids even before lazy closure; winner must belong to same auction.

## 4. Account and approved UI execution evidence — 13 October 2026

The backend run after catalog integration completed with `tests 22`, `pass 22`,
`fail 0`, `skipped 0` in approximately 8.4 seconds. This count includes the
parent integration test: 14 PostgreSQL subtests, five HTTP validation tests, the
health test, the money test, and the parent entry. It is not 22 independent
database scenarios.

The frontend run at 15:47 Riyadh time completed with `Test Files 3 passed`
and `Tests 30 passed`, in approximately 1.88 seconds. These component/client
tests use controlled responses; the separate browser check used a real Express
server and PostgreSQL database.

Additional verified account behavior:

- Normalized email, bcrypt password hashing, and fixed USER role on registration.
- Two simultaneous registrations for one email produce one account and one 409.
- Opaque session tokens are hashed in storage; missing, forged and expired tokens are denied.
- Logout revokes the current session without revoking another valid session.
- Passwords are cleared after registration/login and are not persisted in browser storage.
- A malformed successful response cannot produce a false registration/login success.
- Restored sessions are verified against the server before the account is shown.
- Network failures offer retry; failed logout does not claim success or discard the session.
- Public catalog records retain their own title, category and image; private metadata is excluded.
- Gallery data and description belong to the requested auction's listing.
- Category filters, item-specific navigation, return after login/reload and mismatched-response rejection are tested.
- Five-second polling updates prices; countdowns use English digits and stop at zero.
- Unavailable participation does not claim banking eligibility or submit a bid.

The plain account interface and standalone preview were removed. The application
now uses the approved Figma assets, color tokens and Arabic fonts, with local
font license texts. Twelve bundled image/font assets passed checksum checks.
At a 1440 px viewport the logo measured x=1180, y=6, width=178, height=62, and
the hero panel measured y=363, width=540, height=320, matching those reference
slots. Both fonts and all homepage images loaded. These are DOM/asset checks,
not a screenshot-based claim of pixel-perfect rendering.

The real browser journey reproduced an auction-return defect on login reload.
After fixing it, reload and login returned to the same Porsche ID, primary image
and three source thumbnails. Switching a thumbnail retained the same listing;
the property filter opened the Hittin villa with its own image and three empty
additional-photo slots. The actual participation endpoint returned its existing
503 unavailable-provider error; no commitment or bid was recorded as successful.

The three homepage examples are opt-in fictional test-database fixtures using
the approved design's images and scenario opening prices. They contain no real
bids, bank approvals, customer data or evidence of current market availability.
Phone collection and password recovery remain disabled pending approved
contracts; other listing/private/bidding journeys remain incomplete.

The browser check ran against API port `43117`, UI port `43118`, and the isolated
`mezyad_accounts_demo_test` database. It used fictional `example.invalid`
accounts, not customer data. Server-side session expiry was applied to that
fixture only, and reload returned to login with an Arabic explanation.

Responsive checks used 320, 390, 768 and 1440 px browser viewports. The measured
document width matched each viewport, and account controls stayed within it;
320 px validation focused the first invalid field correctly. This is viewport
testing, not proof of behavior on every physical phone or browser. No screenshots,
videos or browser traces were captured. The temporary viewport override was reset.

Dependency audits returned zero known vulnerabilities for backend production
dependencies and the complete frontend dependency tree on this date. This is
not a claim that the application has no security defects.

The account GitHub Actions workflow is published and executed on GitHub. Both
the [branch run](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/38426984741)
and [pull-request run](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/38427016481)
passed for `c3764b9` on 13 October 2026. The pull-request logs confirm 22 backend
runner entries with zero failures/skips, 30 frontend tests in three passing files,
and a successful frontend build. Ordinary account CI needs no banking credentials.

**Environment setup failures:** Native PostgreSQL initialization was blocked by
sandbox shared-memory restrictions, and the first connection attempt failed.
Docker Desktop subsequently started; all reported database passes above used
the working PostgreSQL 16.15 container, not that failed native instance.

**Protected deliverables:** Stage 1–3 and the existing database migration remain
unchanged. Stage 3 SHA-256 remains
`f41b15604e29da6f0982aa1c6367275307c80c38f8ce5c2ec3f3fd69cc40a11d`.

## 5. Test evidence entry (complete after each future real run)

| Field | Required |
|---|---|
| Date/time + executor | Actual run |
| Commit SHA | Tested source revision |
| Runtime | Node, PostgreSQL, browser versions |
| Test ID / command | Exact reproduction |
| Result | PASS / FAIL / BLOCKED / SKIPPED |
| Observed output | Logs or screenshot link |
| Bug | Issue ID if failed |
| Retest | Commit and result after fix |

**Release decision:** The published account change set has local and GitHub CI
execution evidence in [PR #2](https://github.com/ghadi0alzhrani0/Mezyad/pull/2).
The full marketplace is NOT READY — full E2E, image validation and
genuine sandbox integration are not verified. Banking remains blocked by
authorized provider access; no real banking test was executed in this work.
