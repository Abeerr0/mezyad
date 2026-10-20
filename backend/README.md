# Backend account development

Requires Node.js 20+ and PostgreSQL. From this directory:

```sh
npm ci
cp ../.env.example .env
# Set DATABASE_URL for your local development database.
psql "$DATABASE_URL" -f ../database/migrations/001_schema.sql
npm run dev
```

The `.env` file is loaded by the server. For the `psql` command, export the same
`DATABASE_URL` in the terminal first; `psql` does not read `.env` automatically.

Account endpoints are `POST /api/v1/auth/register`, `/login` and `/logout`.
Protected requests use `Authorization: Bearer <token>`. Existing unversioned
URLs are retained for compatibility. Registration always creates `USER`;
administrators must be provisioned separately. Passwords are hashed with bcrypt,
and only hashed session tokens are stored in PostgreSQL. Logout revokes the
current session. Successful sessions expire after seven days.

Names are required and limited to 160 characters. Email addresses are normalized
and limited to 254 characters. Registration passwords must contain at least
eight characters and fit within bcrypt's 72-byte UTF-8 limit.

## Tests

```sh
npm run check
npm test
```

Without `TEST_DATABASE_URL`, the database account suite is explicitly skipped.
To execute it, create a separate PostgreSQL database with a name ending in
`_test`, then run:

```sh
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mezyad_accounts_test npm test
```

The suite applies the existing migration and creates temporary test accounts.
It covers duplicate email (QA-01), invalid credentials (QA-02), admin permissions
(QA-03), registration validation, concurrent registration, hashed credentials,
session expiry, protected access and session revocation. It never uses banking
credentials or tests real payments.

## Local Figma design fixtures

After applying the existing migration to a disposable database ending in
`_test`, optionally seed the three listings already present on the approved
Figma homepage:

```sh
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mezyad_demo_test DEMO_SEED_ALLOWED=true npm run seed:design-demo
```

The database must exist before running this command. The script is opt-in and
refuses other database names. It creates fictional local records for the Hittin
villa, Porsche Carrera GT and NJD 1 plate, using the approved design images and
scenario prices. Prices are opening prices; no fictitious bids, commitments,
bank approvals or real customers are created. Re-running the script preserves
existing records. It is not a production seeding command.

Auction discovery/details now return their own category and image references
from the existing tables. Private listings remain excluded from public discovery,
and direct private detail access still requires authorization.

## Marketplace backend — branch `abeer`

From `backend/`, create the PostgreSQL database, set `DATABASE_URL` in `.env`,
then run `npm run db:setup`. This applies the existing ten-table migration and
five category seeds together in a transaction. Re-running is safe for the
existing schema; it is not a schema upgrade tool. Setup creates no customers,
bids or bank commitments.

### Listings and photos

`POST /api/v1/items` and `PATCH /api/v1/items/:id` accept multipart fields
`categoryId`, `title`, `description`, `category_fields` (a JSON object string),
and repeated `images` files, matching the Stage 4 listing form. Multipart
creation requires at least one photo. JSON remains supported for older clients.
Title: 1–240 characters; description: 1–20,000; category fields: an object.
Only the owner can edit a rejected listing. Its category stays fixed. New photos
replace old photos; omitting photos on edit preserves existing ones. Resubmission
clears review metadata and returns to `PENDING_REVIEW`. Rejection reasons must
contain nonblank text, up to 2,000 characters.

Image limits: six JPG/PNG/WebP files, 5 MiB per file, 20 million input pixels.
The server checks MIME, extension and decoded format, rejects corrupt/animated
images, strips metadata and writes resized JPEGs with random names. Listing and
image references are transactional. Failures remove new files; old files are
removed after a successful replacement.

`UPLOAD_DIR` defaults to `./uploads` relative to the backend working directory.
Keep it on persistent storage when deploying and back it up with PostgreSQL.
Uploads are excluded from Git and are not exposed by a static directory.
Authorized listing/detail responses issue image links valid for ten minutes,
usable in `<img>` without exposing the session token. Treat them as temporary
access credentials. Restart invalidates old links; re-fetch details for new ones.
This MVP uses one backend process: signing keys and attempt counters are local
to that process.

### Auctions and bidding

Existing `/api/v1` and legacy routes remain supported. Invalid UUID paths return
400 JSON. `GET /auctions` accepts `categoryId` and `status=SCHEDULED|ACTIVE|CLOSED`.
Public discovery excludes private auctions. `GET /auctions?scope=all` requires
ADMIN and supports monitoring all auctions; admins may view private details.
Invitation attempts allow ten per minute per user/auction, then 429 with
`Retry-After`. Login allows sixty attempts per fifteen minutes per IP.

Read responses calculate status using database time. Opening details activates
scheduled auctions when due or finalizes an ended auction exactly once.
Late bids are rejected even before a page visit. Bidding and closure use the
same auction row lock. Duplicate `requestId` returns 409. Money, ownership,
access, commitment and deadline checks precede atomic bid/price persistence.
`GET /auctions/:id/bids` accepts `limit` (1–100) and `offset` (0 or greater).
`/me/items` includes image links; `/me/auctions` shows owned and bid-on auctions.

### Open Banking: blocked on provider selection

The team has not selected a sandbox provider. `src/bank.js` is the integration
boundary, not a working adapter. Environment placeholders do not activate it.
Commitment POST returns 503 `BANK_SANDBOX_UNAVAILABLE`; it creates no approval.
Browser status/reference cannot approve a commitment. Private commitment GET
also requires an access grant.

Before implementing the adapter, supply the provider documentation, authorized
sandbox account/scopes, supported operation, consent/callback flow, and exact
rule mapping a trusted server response to SUCCESS. Keep secrets only in the
backend environment. Genuine success, rejection and timeout evidence remains
required by Stage 3. No funds-hold, proof-of-funds or transfer API was invented.

### QA

`npm test` now runs database, marketplace, upload, bidding and closure tests in
addition to account tests. PostgreSQL suites require a disposable
`TEST_DATABASE_URL` ending in `_test`; otherwise they explicitly skip.
Fixtures use isolated schemas and temporary photo folders, removed on shutdown.
Synthetic SUCCESS rows exist only in tests for downstream bidding, and do not
prove bank integration. The existing GitHub workflow runs these tests against
PostgreSQL 16 on pushes to `abeer`.

Marketplace UI files currently live under `Stage_4/`, outside
`frontend/src/marketplace/`. Connecting those screens is separate frontend work;
this branch does not claim a complete browser auction journey.


## Review against all four reports

`Stage_4/Report.MD` identifies `Stage_3/Report.MD` as the technical source of truth.
The original four reports are unchanged. The current implementation keeps
USER/ADMIN, ten PostgreSQL tables, REST polling and access-triggered closure.
Anti-sniping and the broader assistant from older stages are not silently added.
Stage 2 names SABB as the primary sandbox candidate and Al Rajhi as backup;
neither has a verified operation/credentials contract in Stage 3.

The listing parser accepts both `categoryId` (current UI) and `category` (Stage 3
API table), and rejects conflicting values. Money conversion separates whole
riyals and halalas before integer arithmetic to retain valid large prices.
Unauthorised private bid requests use the same 404 response as nonexistent
auctions. Incorrect invitation codes and nonexistent invitation targets share
the same 403 INVALID_CODE response. Neither response discloses private details.

`npm test` includes the seven previously packaged contract checks under
`tests/acceptance/`. They are normal assertions, not expected failures.
Their PostgreSQL results remain unverified until executed with TEST_DATABASE_URL.
