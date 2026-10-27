# Abeer backend and database handoff

Updated: 2026-10-24.
Repository: Abeerr0/mezyad. Delivery branch: abeer only.
Remote starting revision: 4c13522db2a25ffd8410386ff1e3cbf672db55ee.

## Scope
Complete Abeer's DB-01 through DB-09 and BE-01 through BE-05 against the current Stage 3 baseline.
Application implementation remains React, Express and PostgreSQL. Stage_3 is read only.
Existing team marketplace modules and tests were used as a reference and adapted to this personal backend. No team Git history or frontend changes are imported.
Authentication stays in the current application; both existing routes and the documented /api/v1 prefix work.

## Verified implementation
- Persist categoryFields on creation and rejected-listing resubmission, accepting the existing category_fields alias and rejecting conflicting values.
- Return stored images to the seller and authorized administrator, including list responses.
- Accept up to six JPG/PNG/WebP files, at most 5 MiB each; decode actual bytes, reject mismatched/corrupt data, re-encode JPEG and remove metadata.
- Store random file names, protect image reads with expiring signatures, and clean new files after database failure.
- Keep old images until replacement commits; only the rejected listing's seller can resubmit.
- Fetch list images in one batched query.
- Preserve the same auction-row transaction lock for bids and closure, fresh database time after lock waits and unique request IDs. Convert decimal amounts into exact integer cents without multiplying a floating-point fraction.
- Keep bank commitment unavailable until an authorized official sandbox operation is verified. Synthetic test fixtures do not count as banking evidence.

## Data model review
The migration and Stage 3 both contain ten tables:
users, user_sessions, categories, items, item_images, auctions, private_auction_access, bid_commitments, bids and auction_results.
Each documented field exists in the migration. Foreign keys connect sessions and listings to users, images to listings, auctions to listings, grants/commitments/bids to auction and user, and results to the same auction's winning bid.
Money uses numeric(14,2), dates use timestamptz, commitments/grants are unique per auction and user, and request_id is unique.

Notion naming differs: sessions maps to user_sessions; private_access maps to private_auction_access; commitments maps to bid_commitments.
Seller/Bidder are activities of the same USER in the current Stage 3, not separate tables.
Notion also names audit_logs, which the approved Stage 3 does not define. No audit table is silently added. DB-06 cannot be called fully complete under that literal Notion requirement until the scope is reconciled.

## Reproduction
Validated with Node.js 24.22.1 and native PostgreSQL 17.11 on Linux. PostgreSQL ran in a disposable local VM; VM tooling is not a project dependency.
From backend run npm ci, then npm run check.
Set DATABASE_URL to a local development database and run npm run db:setup. This creates tables and the five categories atomically; repeated setup must not duplicate them.
For integration tests use only a disposable TEST_DATABASE_URL whose database name ends in _test, then run npm run test:postgres.
Without that variable npm test runs unit checks and explicitly skips database cases. Skipped is not passed.
UPLOAD_DIR optionally selects private local file storage; uploaded files are excluded from Git.

## Verification ledger
- Date: 2026-10-24. Command: `npm run check` — passed.
- Command: `npm test` without a test database — 77 tests, 10 passed, 67 explicitly skipped, 0 failed. This is not integration evidence.
- Command: `npm run test:postgres` with an isolated PostgreSQL 17.11 database — 77 passed, 0 failed, 0 skipped (13.34 seconds).
- This run exercises the real setup script twice in an empty schema, database foreign keys/uniqueness, image storage/rollback, authorization, two simultaneous bid transactions, deadline revalidation after a lock wait and concurrent closure.
- Before implementation the new listing-fields test failed because the listing module did not exist.
- A new money regression reproduced valid `10000000.03` being rejected by floating-point precision checks. The decimal parser fixes it; the full native suite above ran after the fix.
- `git diff --check` passed. Stage_3, frontend and the existing schema/seed are unchanged.
- No PR, merge, teammate approval, production deployment, browser journey or official banking success is claimed. Local test completion does not satisfy the separate team merge/review definition of done.

## Task evidence
Codes below refer to the Notion task IDs. Some inherited test scenario labels use the same numbers for different checks; use each test's full name and file.

| المهمة | ملفات التنفيذ والجزء اللي تراجعينه | ملفات الاختبارات |
|---|---|---|
| DB-01 — مراجعة جداول قاعدة البيانات | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql) — الجداول والمفاتيح والعلاقات | [backend/tests/database.test.js](../backend/tests/database.test.js) |
| DB-02 — علاقات المستخدم والبائع والمزايد | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [backend/src/auth.js](../backend/src/auth.js) — users وitems.seller_id وbids.bidder_id والصلاحيات | [backend/tests/database.test.js](../backend/tests/database.test.js)، [backend/tests/bidding-closure.test.js](../backend/tests/bidding-closure.test.js) |
| DB-03 — جداول الإعلانات والصور | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [backend/src/listings.js](../backend/src/listings.js)، [backend/src/uploads.js](../backend/src/uploads.js) — حفظ الإعلان وربط الصور واسترجاعها | [backend/tests/database.test.js](../backend/tests/database.test.js)، [backend/tests/listing-images.test.js](../backend/tests/listing-images.test.js) |
| DB-04 — المزادات العامة والخاصة | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [backend/src/app.js](../backend/src/app.js)، [backend/src/auctions.js](../backend/src/auctions.js)، [backend/src/limits.js](../backend/src/limits.js) — إنشاء المزاد والدخول بالكود وحالة المزاد وحد المحاولات | [backend/tests/database.test.js](../backend/tests/database.test.js)، [backend/tests/marketplace.test.js](../backend/tests/marketplace.test.js)، [backend/tests/marketplace-fixes.test.js](../backend/tests/marketplace-fixes.test.js) |
| DB-05 — الالتزامات والمزايدات | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [backend/src/app.js](../backend/src/app.js)، [backend/src/bank.js](../backend/src/bank.js) — القيود والفهارس واستعلامات الالتزام والمزايدة | [backend/tests/database.test.js](../backend/tests/database.test.js)، [backend/tests/bidding-closure.test.js](../backend/tests/bidding-closure.test.js) |
| DB-06 — الجلسات والتدقيق | [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [backend/src/auth.js](../backend/src/auth.js)، [backend/src/app.js](../backend/src/app.js) — user_sessions وبصمة الرمز والدخول والخروج | [backend/tests/sessions.test.js](../backend/tests/sessions.test.js)، [backend/tests/database.test.js](../backend/tests/database.test.js) |
| DB-07 — تشغيل قاعدة نظيفة وبياناتها الأولية | [backend/scripts/setup-db.js](../backend/scripts/setup-db.js)، [database/migrations/001_schema.sql](../database/migrations/001_schema.sql)، [database/seeds/001_categories.sql](../database/seeds/001_categories.sql)، [backend/src/db.js](../backend/src/db.js) — تهيئة الجداول والتصنيفات وإعادة التشغيل بدون تكرار | [backend/tests/setup-db.test.js](../backend/tests/setup-db.test.js) |
| DB-08 — استعلامات البائع والأدمن | [backend/src/listings.js](../backend/src/listings.js)، [backend/src/app.js](../backend/src/app.js) — withImages وwithListingImages وقوائم الإعلانات وحالة المراجعة | [backend/tests/listing-images.test.js](../backend/tests/listing-images.test.js)، [backend/tests/marketplace.test.js](../backend/tests/marketplace.test.js) |
| DB-09 — تحديث السعر بالتزامن | [backend/src/app.js](../backend/src/app.js)، [backend/src/auctions.js](../backend/src/auctions.js)، [backend/src/money.js](../backend/src/money.js)، [backend/src/db.js](../backend/src/db.js) — مسار /auctions/:id/bids وقفل صف المزاد والهللات والتراجع عند الفشل | [backend/tests/bidding-closure.test.js](../backend/tests/bidding-closure.test.js)، [backend/tests/money.test.js](../backend/tests/money.test.js) |
| BE-01 — إنشاء الإعلان وتعديله | [backend/src/listings.js](../backend/src/listings.js)، [backend/src/app.js](../backend/src/app.js) — parseListingFields وwriteListing وربط المسارات وحفظ categoryFields | [backend/tests/listing-fields.test.js](../backend/tests/listing-fields.test.js)، [backend/tests/listing-images.test.js](../backend/tests/listing-images.test.js)، [backend/tests/marketplace.test.js](../backend/tests/marketplace.test.js) |
| BE-02 — إعادة إرسال الإعلان المرفوض | [backend/src/listings.js](../backend/src/listings.js)، [backend/src/app.js](../backend/src/app.js) — الملكية وحالة الرفض وإعادة الإرسال وسبب الرفض | [backend/tests/listing-images.test.js](../backend/tests/listing-images.test.js)، [backend/tests/marketplace.test.js](../backend/tests/marketplace.test.js) |
| BE-03 — رفع الصور والتحقق منها | [backend/src/uploads.js](../backend/src/uploads.js)، [backend/src/listings.js](../backend/src/listings.js) — النوع والحجم والعدد والحفظ والروابط واستبدال الصور وتنظيف الملفات | [backend/tests/uploads.unit.test.js](../backend/tests/uploads.unit.test.js)، [backend/tests/listing-images.test.js](../backend/tests/listing-images.test.js) |
| BE-04 — شروط قبول المزايدة | [backend/src/app.js](../backend/src/app.js)، [backend/src/auth.js](../backend/src/auth.js)، [backend/src/money.js](../backend/src/money.js)، [backend/src/auctions.js](../backend/src/auctions.js) — الوقت والمبلغ والصلاحية والالتزام ومنع التكرار وقفل الإغلاق | [backend/tests/bidding-closure.test.js](../backend/tests/bidding-closure.test.js)، [backend/tests/marketplace.test.js](../backend/tests/marketplace.test.js) |
| BE-05 — اختبار تعديلاتك وتوثيقها | [backend/package.json](../backend/package.json)، [backend/scripts/check.js](../backend/scripts/check.js)، [backend/scripts/test-postgres.js](../backend/scripts/test-postgres.js)، [docs/backend-handoff.md](../docs/backend-handoff.md) — أوامر الفحص والتشغيل ونتائج الاختبارات | [backend/tests/](../backend/tests/)، [backend/tests/helpers/qa-fixtures.js](../backend/tests/helpers/qa-fixtures.js)، [backend/tests/helpers/test-extension.js](../backend/tests/helpers/test-extension.js) |

DB-06 جزئية: audit_logs غير موجود في Stage 3 المعتمد. BE-04 مختبَرة برمجيًا وباقي التنسيق مع غدي. باقي المهام مكتملة من ناحية التنفيذ والاختبارات الموضحة أعلاه.

ترتيب المذاكرة: الجداول والعلاقات، ثم db.js، ثم auth.js، ثم listings.js وuploads.js، وبعدها مسار المزايدات في app.js مع money.js وauctions.js. بعد كل جزء افتحي اختباراته. نفس الملف ممكن يخدم أكثر من مهمة.

Comment and study-map review on 2026-10-24: short Saudi Arabic notes cover the important backend, database, upload, session and test sections. The Arabic task map links each task to its implementation and test files. Executable code, SQL, assertions and task completion statuses are unchanged. Calendar changes are outside this update.

## Remaining decisions and handoff
1. Resolve Notion's audit_logs requirement against the approved ten-table Stage 3. No schema or Stage 3 change was authorized for that discrepancy.
2. Ask Ghadi to review the bidding transaction contract: the same auction row is locked for bidding/closure; time is checked after lock acquisition; requestId is globally unique; failed requests roll back price and bid together. No coordination or teammate approval is recorded yet.
3. Real bank sandbox integration and frontend acceptance remain separate team work. BANK_SANDBOX_UNAVAILABLE is an intentional blocking response, not a successful commitment.
4. Upload this verified implementation to abeer only, then attach the resulting commit as Notion evidence. Do not merge or create a PR without Abeer's approval.
