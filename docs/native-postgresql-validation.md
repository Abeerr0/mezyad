# Native PostgreSQL validation — abeer

Date: 2026-10-20. Tested code: `3f87ff3` on `abeer`.

All 110 backend test entries passed, with zero failures, skipped or cancelled
entries. The previously skipped database suites ran. The account integration
suite expands into 14 nested checks, so the full count is 110 rather than the
96 entries reported by unit-only mode. All 14 browser journeys also passed
against this native database.

## Runtime

PostgreSQL 16.15, x86_64-alpine-linux-musl, compiled by Alpine cc 15.2.0, 64-bit.
It ran as the ordinary postgres user inside an isolated Alpine 3.23 / Linux
6.18.0-3-virt VM, QEMU 8.2.2 TCG with two vCPUs. Database encoding was UTF8.
The official Alpine installation image checksum was verified. PostgreSQL and
pgcrypto were installed from the signed Alpine repositories.

This was an ordinary multi-process PostgreSQL server, not PGlite, canned SQL
responses or an application database adapter. The backend used its normal pg
pool; the browser harness did not set E2E_SQL_ENGINE=pglite. Local-only host
forwarding exposed the disposable mezyad_native_test database to test processes.
The VM and its in-memory test data were destroyed after the successful run.

## Failure corrected

The first run produced 59 passing entries and 37 setup failures. Multiple test
files concurrently attempted CREATE EXTENSION IF NOT EXISTS pgcrypto, causing
pg_extension_name_index duplicate-key errors before those suites could execute.
The shared test helper now uses a transaction-level advisory lock only around
extension creation. Both account and marketplace fixtures use it. Tests remain
parallel; application bid/closure locking and production migrations are unchanged.

After this change the entire backend suite passed: 110/110, zero skipped.

## Concurrency and permissions actually checked

- Concurrent duplicate account registration accepts one account.
- Same request UUID submitted concurrently accepts one bid.
- Simultaneous same-price bids serialize and observe the updated minimum.
- A bid blocked by a row lock rechecks the deadline after acquiring the lock.
- Database failures roll back both bid/price and closure/result changes.
- Concurrent detail requests retain one stable result.
- Queued bid/closure after deadline cannot create a late winning bid.
- A bid validated before deadline commits before waiting closure and can win.
- Foreign keys, uniqueness, money constraints and winner-auction integrity.
- Seller ownership, ADMIN permissions, private access, image references and
  persisted winner/loser privacy after reload.

## Reproduction on a normal PostgreSQL 16 installation

Create a dedicated disposable database whose name ends in _test. The test user
must be allowed to create schemas and pgcrypto. Set TEST_DATABASE_URL in the
terminal; never use a database containing real user information.

From backend:

```sh
npm ci
npm run test:postgres
```

From frontend, retaining TEST_DATABASE_URL:

```sh
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
```

Evidence: native-postgresql-backend.txt, native-postgresql-browser.txt,
native-postgresql-browser-results.json and native-runtime.txt in docs/evidence.
GitHub CI has not run for the unpublished local commits. Open Banking is deferred;
SUCCESS rows exist only as explicit synthetic test fixtures for downstream bids.
No provider success, PR, merge or successful repository upload is claimed.
