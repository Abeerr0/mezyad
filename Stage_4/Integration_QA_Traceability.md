# Database and Backend Integration QA Traceability

## Evidence baseline

- **Source under review:** `origin/development` at `baab54b444c1ff8c647267d9713c5905e1579b1a`.
- **CI evidence:** [GitHub Actions run 39462589800](https://github.com/ghadi0alzhrani0/Mezyad/actions/runs/39462589800), workflow run **#45**, triggered by a push to `development` on 20 October 2026 at 17:01 as displayed by GitHub (time zone not shown). The run completed successfully in 8m 6s.
- **Executed CI jobs:** backend PostgreSQL 16 tests, React tests, Playwright integration tests, backend syntax, production build, browser-runner checks, YAML/actionlint, whitespace update check, and the final required-check summary all succeeded. The backend and React jobs also succeeded at their “reject skipped tests” steps. The Playwright job ran every browser spec with a fresh server and schema.
- **Scope of this record:** source and existing test review tied to that CI run. No tests were rerun for this documentation change. No case totals are claimed because the run summary inspected here confirms job outcomes but does not expose a verified per-case count.
- **Requirements source:** Stage 3 `Report.MD`, cases QA-01–QA-23. Existing Stage 4 reports are historical snapshots and remain unchanged; their older status rows are not evidence for this source revision.

## Database QA

Every case below maps to an existing check in `backend/tests/database.test.js`. The PostgreSQL 16 CI job passed, including its check that no backend tests were skipped. These results apply to the isolated test database used by CI.

| Case | Requirement | Existing check | Result and boundary |
|---|---|---|---|
| DB-01 | Migration has the ten Stage 3 core tables and each has a primary key. | `DB-01` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-02 | Account, category, and session identifiers are unique; account roles are constrained. | `DB-02` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-03 | Foreign keys reject orphan listings, images, sessions, bids, and grants. | `DB-03` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-04 | Listing, auction, visibility, and commitment status values reject invalid states. | `DB-04` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-05 | Prices and increments are positive; auction end follows start. | `DB-05` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-06 | One auction per listing; private access codes are hashed and public auctions have no code. | `DB-06` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-07 | A user can have only one private grant and one commitment per auction. | `DB-07` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-08 | Request IDs are globally unique; money uses `numeric(14,2)`. | `DB-08` / QA-09 | PASS in the referenced PostgreSQL 16 CI run. |
| DB-09 | A winning bid must belong to the same auction as its result. | `DB-09` / QA-20 | PASS in the referenced PostgreSQL 16 CI run. |
| DB-10 | No-bid auctions can have a null winner; each auction has at most one result. | `DB-10` / QA-12, QA-13 | PASS in the referenced PostgreSQL 16 CI run. |
| DB-11 | Deleting an unauctioned item or free account cascades the specified references. | `DB-11` | PASS in the referenced PostgreSQL 16 CI run. |
| DB-12 | Timestamps are timezone-aware and the four lookup indexes exist. | `DB-12` | PASS in the referenced PostgreSQL 16 CI run. |

## Backend integration and acceptance traceability

The result and tested revision for each row below are the evidence baseline above: SHA `baab54b444c1ff8c647267d9713c5905e1579b1a`, CI run 39462589800 on 20 October 2026. File paths and case titles identify the existing checks; the CI job results show those checks were part of the passing source run.

| Case | Requirement | Existing test source / named check | Result and limits |
|---|---|---|---|
| QA-01 | Duplicate normalized registration email returns 409 and creates no second account. | `backend/tests/accounts.integration.test.js` — “QA-01: duplicate normalized email returns 409 without another user” | PASS — PostgreSQL integration. |
| QA-02 | Wrong password returns 401 and does not create a session. | `backend/tests/accounts.integration.test.js` — login failure assertions | PASS — PostgreSQL integration; no real customer account data. |
| QA-03 | A USER cannot review a listing; ADMIN review records the decision. | `backend/tests/marketplace.test.js` — “QA-03: USER cannot review; ADMIN approval records reviewer and review time”; `frontend/e2e/admin-v4.spec.js` — USER review denial | PASS — API and browser authorization checks. |
| QA-03A | A seller cannot bid on their own auction, even with a test commitment. | `backend/tests/bidding-closure.test.js` — “QA-03A: owner cannot bid even with a synthetic SUCCESS commitment”; `frontend/e2e/bidder-v5.spec.js` — owner blocked by screen and API | PASS — `SUCCESS` is a synthetic fixture isolated to test data, not bank verification. |
| QA-03B | One USER may own an auction and bid in another owner’s auction. | `backend/tests/bidding-closure.test.js` — “QA-03B: the same USER can own an auction and bid in another owner's auction” | PASS — PostgreSQL integration. |
| QA-04 | Pending, rejected, or another owner’s unapproved listing cannot be auctioned. | `backend/tests/marketplace.test.js` — “QA-04: pending/rejected listings and another owner's approved listing cannot be auctioned”; `frontend/e2e/review-v2.spec.js` — rejected listing remains blocked | PASS — API and browser checks. |
| QA-05 | An invalid private invitation code grants no access. | `backend/tests/marketplace.test.js` — “QA-05: wrong private invitation code creates no access grant”; `backend/tests/marketplace-fixes.test.js` — rate-limit and uniform failure checks; `frontend/e2e/journeys.spec.js` — wrong code denied | PASS — does not establish genuine bank eligibility. |
| QA-06 | Private details, history, bids, and commitment are denied without an access grant. | `backend/tests/marketplace.test.js` — “QA-06: direct private details/history/bidding/commitment require an access grant”; `backend/tests/acceptance/qa.contract-gaps.test.js` — private bid denial; `frontend/e2e/bidder-v5.spec.js` — direct access and revocation | PASS — tests use isolated fixtures. |
| QA-07 | Provider failure or timeout never becomes a false approval. | `backend/tests/marketplace.test.js` — “COMMIT-01 / QA-07 partial: unavailable bank fails closed”; `frontend/e2e/bidder-v5.spec.js` — unavailable commitment blocks bids | PASS for fail-closed behavior. **DEFERRED:** genuine provider success, rejection, and timeout have not been verified because authorized sandbox access and an approved operation are unavailable. Follow-up owner recorded in `docs/open-banking-blocker.md`: project owner/mentor; no individual assignee is recorded. |
| QA-08 | A bid below the starting price is rejected without changing the price. | `backend/tests/bidding-closure.test.js` — “QA-08: first bid below starting price is rejected without changing price” | PASS — PostgreSQL integration. Later-bid increments are covered by QA-19. |
| QA-09 | Reusing one request ID accepts at most one bid. | `backend/tests/bidding-closure.test.js` — “QA-09” and “QA-09 concurrent replay”; `backend/tests/database.test.js` — global request UUID uniqueness | PASS — includes concurrent replay against PostgreSQL. |
| QA-10 | Simultaneous same-price bids serialize consistently. | `backend/tests/bidding-closure.test.js` — “QA-10: two simultaneous same-price bids serialize; loser sees the updated price” | PASS — PostgreSQL row-lock integration. |
| QA-11 | Bids at or after the deadline are rejected using server time, including after waiting on a row lock. | `backend/tests/bidding-closure.test.js` — “QA-11” and “BID-06 / QA-11”; `frontend/e2e/bidder-v5.spec.js` — deadline after confirmation | PASS — PostgreSQL and browser integration. |
| QA-12 | An expired auction with no bids closes without a winner. | `backend/tests/bidding-closure.test.js` — “QA-12: ended auction without bids closes with a null winner”; `backend/tests/database.test.js` — DB-10 | PASS — PostgreSQL integration. |
| QA-13 | Repeated or concurrent closure produces one stable result. | `backend/tests/bidding-closure.test.js` — “QA-13: repeated and concurrent detail requests preserve one stable closure result” | PASS — PostgreSQL integration. |
| QA-14 | Empty, loading, and error states are communicated accurately. | `frontend/e2e/shared-v6.spec.js` — missing notification service is distinct from an empty inbox; catalog network error retries the original endpoint; `frontend/e2e/final-review.spec.js` — history failure/retry | PARTIAL — those named states passed in the Playwright run; this evidence does not claim an exhaustive audit of every route and state. |
| QA-15 | Public auction journey preserves identity, bidding, and final outcome. | `frontend/e2e/journeys.spec.js` — public details, accepted bid, and winner; `frontend/e2e/backend-integration.spec.js` — approved seller creates public auction; `frontend/e2e/closeout.spec.js` — high-value bid | PASS for the exercised public journey. Test bidding uses synthetic test eligibility; no provider result is implied. |
| QA-16 | Private auction journey enforces invitation and access rules. | `frontend/e2e/journeys.spec.js` — wrong/correct code and private creation; `frontend/e2e/bidder-v5.spec.js` — private accepted bid; `backend/tests/marketplace.test.js` — QA-05/06 | PASS for tested access and application behavior. Bid eligibility in the successful bid journey is synthetic test data. |
| QA-17 | A rejected listing can be corrected and resubmitted to pending review. | `backend/tests/marketplace.test.js` — “QA-17”; `backend/tests/listing-images.test.js` — “QA-17 images”; `backend/tests/acceptance/qa.contract-gaps.test.js` — corrected category fields; `frontend/e2e/backend-integration.spec.js` — saved photos and fields after rejection | PASS — API, PostgreSQL, and browser checks. |
| QA-18 | The first eligible bid may equal the starting price. | `backend/tests/bidding-closure.test.js` — “QA-18: first bid at starting price is accepted and price/history update together” | PASS — PostgreSQL integration with test eligibility. |
| QA-19 | A later bid below the required increment is rejected; the exact increment is accepted. | `backend/tests/bidding-closure.test.js` — “QA-19: later bid enforces increment; exact increment is accepted” | PASS — PostgreSQL integration. |
| QA-20 | A winning bid from another auction cannot be recorded for this auction. | `backend/tests/database.test.js` — “DB-09 / QA-20”; `backend/tests/bidding-closure.test.js` — winner belongs to auction | PASS — database constraint and closure checks. |
| QA-21 | My Activity includes the user’s listings and participation in another auction. | `backend/tests/marketplace.test.js` — “QA-21 API only: My Activity includes own listing/auction and bids in another auction”; `frontend/e2e/journeys.spec.js` — “My Activity includes own listings and eligible auction participation” | PASS — API and browser evidence; eligibility data is confined to the disposable test database. |
| QA-22 | Invalid, spoofed, corrupt, oversized, or excessive image uploads are rejected without leftovers. | `backend/tests/listing-images.test.js` — “QA-22: spoofed MIME, wrong extension, corrupt image, oversized file and too many images are rejected without leftovers”; `frontend/e2e/seller-v3.spec.js` — corrupt image refusal | PASS — exercised cases only; not a load or penetration test. |
| QA-23 | A late bid remains rejected without a page visit; the next detail request finalizes the result. | `backend/tests/bidding-closure.test.js` — “QA-23: no page visit is needed to reject late bids; next detail access finalizes result”; `backend/tests/monitoring.integration.test.js` — expired auction results | PASS — PostgreSQL integration. |

## Deferred items and evidence limits

- **Genuine Open Banking integration:** deferred. The current server fails closed when the provider is unavailable. Test-only `SUCCESS` records demonstrate downstream bid handling in disposable databases and are not evidence of provider approval, consent, funds hold, or transfer. The approved provider, operation, and sandbox access remain unconfirmed; follow-up is assigned to the project owner/mentor in the existing blocker record, with no named individual.
- **QA-14 completeness:** partial as shown above. Only the identified browser states are evidenced here.
- **Draft restoration after a full refresh:** an existing UX limitation, not a Database QA failure or implementation task in this scope. Draft state is retained during in-app navigation and request failure; it is not restored after a full refresh.
- **Account recovery and notifications:** unavailable service/API behaviors remain deferred according to the current source and CI checks. They are not classified here as database defects.
- **Historic result totals:** older reports describe earlier source revisions. This report does not copy their counts or status labels as current evidence.

## Scope and delivery check

This is a new traceability record for the current source revision. No database, backend, frontend, workflow, previous report, or test file was changed. No test suite was run for this record. The delivery change is limited to `Stage_4/Integration_QA_Traceability.md`.
