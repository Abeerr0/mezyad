# Abeer — Backend and marketplace integration

Date: 2026-10-20. Delivery branch: `abeer` only.
Remote `abeer` was rechecked at `ecff165`; earlier local Abeer commits are retained.
No PR or merge is part of this delivery. Open Banking work is deferred by request.
Stage 1–4 Report.MD source files remain unchanged. Stage 4 identifies Stage 3 as
the technical baseline. React + Express + PostgreSQL and polling are retained.

## Delivered

- Validated multipart photos, safe random JPEG storage and signed retrieval;
  invalid uploads roll back references and clean new files.
- Canonical categoryFields and compatible category_fields, with conflict checks.
- Owned rejected-listing correction/resubmission; replace all photos or keep the
  current set; seller/admin details and review responses include photos.
- ADMIN dashboard counts and paged public/private auction monitoring/results.
- Persisted own participation and isWinner; no other bidder identity is exposed.
- Private invitation hashing/throttling and uniform failure responses; server
  clock state presentation, locked bid acceptance and idempotent closure.
- Existing Stage 4 React screens integrated into the active frontend, preserving
  its visual system; real FormData transport, API-origin photos, review, private
  access, dashboard, bidding/history and persisted results after reload.
- Required PostgreSQL test command and CI browser journeys, with isolated data.

## Executed validation

| Check | Result | Boundary |
|---|---|---|
| Backend syntax/unit/HTTP | 19 pass, 0 fail; 77 skipped | No native PostgreSQL locally |
| SQL functional smoke | 27 pass | Actual migration/seed/HTTP/files on PGlite 0.5.10 PostgreSQL WASM |
| React/component/API tests | 55 pass | Controlled network responses |
| Vite production build | Pass | Active application includes marketplace modules |
| Chromium browser journeys | 14 pass | Actual React + Express + SQL via PGlite socket 0.2.13; sequential app pool |
| Native PostgreSQL 16 / locks / races | NOT RUN | CI is prepared but has not run for these unpublished commits |

Browser scenarios cover registration/session/logout; public details; incorrect
and correct private codes; USER admin denial; admin review; private creation;
accepted bids/history; no-bids closure; activity; corrupt-image refusal;
responsive geometry at 320/390/768/1440px; public winner after reload;
photo upload/reject/correct/approve/public-auction flow; and private winner/loser
after reload with dashboard verification. Downstream bidding uses clearly
synthetic SUCCESS fixtures only inside disposable test schemas, never a normal
application bypass. This is not provider verification.

Native acceptance requires TEST_DATABASE_URL for an isolated database ending in
_test. Run `npm run test:postgres` in backend and `npm run test:e2e` in frontend.
These native suites retain genuine concurrent row-lock/closure tests. WASM
results must not be presented as proof of native multi-session correctness.

## Remaining external items

- GitHub connection refuses repository writes with 403 Resource not accessible
  by integration. Local commits are not a remote upload. Only abeer may be
  updated when write access becomes available; no PR/merge is authorized now.
- Native PostgreSQL runtime is unavailable in this environment. Its tests and
  CI still need an actual execution result before acceptance.
- Open Banking is explicitly deferred. The current fail-closed boundary remains;
  no mentor message was sent and no approval was fabricated.

Current evidence is in docs/evidence. Older Stage_4/Abeer_* records describe an
older local revision; this handoff supersedes their execution status.
