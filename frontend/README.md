# Frontend account integration

Requires Node.js 20+ and a running Mezyad backend. From this directory:

```sh
npm ci
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend origin if it uses another port. This value is
public client configuration; never place bank credentials or server secrets in
the frontend environment. The backend's `FRONTEND_ORIGIN` must match the Vite
origin (normally `http://localhost:5173`).

`AuthProvider` provides account access and the shared authenticated API client.
`AccountPanel` handles registration, login, logout, field validation and Arabic
feedback. Sessions survive reloads in the same tab using `sessionStorage`; a
stored session is verified with the existing protected `/api/v1/me/items`
endpoint before the account is shown. Passwords are never persisted. The stored
user summary is for display; the backend remains responsible for authorization.
Failed logout retains the session and offers a retry instead of claiming success.

## Current Figma flow guide — 20 October 2026

[Approved design](https://www.figma.com/design/mbc0Qc5e0hR8dIaqQjbMMN/Mezyad-1?node-id=0-1&t=duPXFdrLWmK9ZKc0-1) ·
[Interactive prototype](https://www.figma.com/proto/mbc0Qc5e0hR8dIaqQjbMMN/Mezyad-1?node-id=0-1&t=duPXFdrLWmK9ZKc0-1) ·
[Complete nine-flow walkthrough](../docs/figma-flows.md).

This separate guide documents Figma Design, its current interactions and the
uploaded development source. Figma Make documentation in the Stage 3 report is
unchanged. Other stage reports retain their historical evidence; locally
prepared, unpublished account-service changes are not part of this update.

## Approved interface

The only application interface follows the approved [Figma Design](https://www.figma.com/design/mbc0Qc5e0hR8dIaqQjbMMN/Mezyad-1?node-id=2-2).
Its wordmark, photographs, ivory/gold colors, El Messiri headings and Noto Sans
Arabic body text are bundled locally. Font license texts are included alongside
the fonts. Asset hashes and reference node IDs are in `public/design-assets.json`.
The previous plain interface and the standalone visual preview have been removed.

The home, browsing, auction details and account screens use the same visual
system. Auction cards, category filters and galleries read records from Express;
each card opens its own auction ID. A validated auction ID is retained in the
login/registration URL, including across reloads. There are no customer-facing
links to alternative prototypes or Figma pages.

In the uploaded development snapshot reviewed on 20 October 2026, profile
editing, password-recovery submission and notifications remain unavailable;
the interface does not claim a save, sent email or an empty server inbox.
Registration sends only name, email and password; phone storage is unsupported.
Legal and contact pages explain that approved text or a contact service is not
yet available. Unpublished local account services are excluded from this snapshot.

Public auction and details data are polled every five seconds. A rejected or
mismatched API response produces an error instead of another item's screen.
Countdowns use English digits and do not override server-side deadlines.
Bank participation currently returns the existing unavailable-provider error;
the UI does not claim that a commitment or a bid succeeded.

For the three local design fixtures shown on the homepage, use the opt-in seed
described in the [backend guide](../backend/README.md). These fixtures are design
scenarios, not evidence of live listings, actual market prices or accepted bids.

```sh
npm test
npm run build
```

The component and API-client tests use controlled network responses. They test
UI behavior and do not replace the backend PostgreSQL integration suite or a
full browser journey against a running server.

Actual local execution results and remaining acceptance work are recorded in
[Stage 4 Testing Report](../Stage_4/Testing_Report.md). The account workflow passed
on GitHub for the published application revision; links and results are recorded
in that report.


## Stage 4 marketplace integration on abeer

The existing Stage_4 screens are now active under src/marketplace. The original
Stage reports remain unchanged. Account actions open listings, rejected-owner
corrections, auction creation, private access and, for ADMIN, review/monitoring.

Listing forms send real multipart FormData with canonical categoryFields. The
browser adds the multipart boundary. Up to six JPG/PNG/WebP photos of 5 MiB each
are allowed; the backend independently checks decoded content. New photos
replace all current photos; resubmission without new photos retains them.
Seller and admin pages render signed image paths against VITE_API_URL.

Result screens read participation.hasBid and result.isWinner from the server,
so personal outcomes survive reloads. A non-participant sees a generic result.
No bank success is fabricated; Open Banking is deferred by request.

### Browser QA against native PostgreSQL

Install backend dependencies too. Use a dedicated database ending in _test:

```sh
npx playwright install --with-deps chromium
TEST_DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/mezyad_browser_test npm run test:e2e
```

The harness runs Express and Vite on 44017/44018, isolates tables in a disposable
schema and stores photos in a temporary directory. Synthetic SUCCESS fixtures
exist only inside this test schema to exercise downstream bidding; they are
not bank verification or a production fallback. No screenshots/video/traces
are recorded. Test outputs default to /tmp/frontend-browser-results.

### Optional browser smoke with PostgreSQL WASM

If native PostgreSQL is unavailable, install tooling outside the project:

```sh
npm install --prefix /tmp/mezyad-sql-qa @electric-sql/pglite@0.5.10 @electric-sql/pglite-socket@0.2.13
PGLITE_INSTALL_DIR=/tmp/mezyad-sql-qa npm run test:browser-smoke
```

Use BROWSER_EXECUTABLE_PATH only if Chromium is already installed elsewhere.
This optional check executes actual React, Express, HTTP, image storage and SQL.
The test harness restricts its application pool to one connection for this
single-connection engine. It does not prove native row locking/concurrency.
PGlite is never imported by the production app.

Historical native validation on **20 October 2026**, for code `3f87ff3`,
recorded **14/14** browser journeys against PostgreSQL 16.15 with the normal
application pool. This is the linked source snapshot, not the current suite's
total. The earlier WASM smoke is supplemental. Native runtime and evidence:
[validation record](../docs/native-postgresql-validation.md).
