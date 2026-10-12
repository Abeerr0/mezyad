# QA Execution and Evidence

**Status:** Not yet fully executed. A documentation review or successful JSON parsing is not proof that the API, PostgreSQL, or browser application works.

## Planned commands
- `npm ci && npm test` in `backend/`
- `npm ci && npm run build` in `frontend/`
- Apply `database/migrations/001_schema.sql` to a fresh PostgreSQL database.
- Run E2E journeys with a running API and database.

## Stage 3 QA traceability
| IDs | Coverage | Actual result |
|---|---|---|
| QA-01–QA-03B | Authentication, roles and dual activity | Not run |
| QA-04–QA-07 | Listings, private access, commitment | Not run |
| QA-08–QA-13 | Bidding, concurrency, closure | Not run |
| QA-14–QA-23 | UX, end-to-end, pricing, images and closure | Not run |

## External dependency
Saudi Open Banking provider, test credentials and supported operation are unverified. No real sandbox success is claimed. Mock success must be marked mock-only.

## Evidence template
Date: TBD
Commit SHA: TBD
Runtime / database version: TBD
Command: TBD
Passed / failed / skipped: TBD
Logs / screenshots / PR: TBD
