# PostgreSQL and API mapping

From `backend/`, run `npm run db:setup` after creating the database and setting
`DATABASE_URL` in `.env`. It applies `001_schema.sql` and `001_categories.sql`
atomically, creating five categories and no users or banking records.

| Table | Used by |
|---|---|
| users | Register/login, USER/ADMIN permissions and ownership |
| user_sessions | Hashed sessions, expiry and logout |
| categories | Listing picker and auction filters |
| items | Submission, admin review and resubmission |
| item_images | Saved image references and listing/gallery responses |
| auctions | Public/private schedules, prices and row locks |
| private_auction_access | Verified invitation grants |
| bid_commitments | Own status and eligibility; real writer blocked on provider |
| bids | Atomic accepted bids, unique request UUID and history |
| auction_results | One stable winner/no-winner outcome per auction |

The winner foreign key includes auction ID, preventing a foreign auction's bid
being recorded as winner. Bids and closure lock the same auction row.
Money is `numeric(14,2)` and timestamps are timezone-aware. Existing constraints
cover these rules; this change needs no new tables or migration.

`backend/tests/database.test.js` checks the ten tables, foreign keys, status and
price constraints, indexes, timestamp types, unique requests and winner integrity.
Other integration suites verify actual API reads/writes. Only use a disposable
`TEST_DATABASE_URL` ending in `_test`. Test schemas and fixtures are removed.
