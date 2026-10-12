# Product Backlog

Status legend: TODO / IN PROGRESS / DONE / BLOCKED. Initial statuses below are conservative.

| ID | Priority | Story/task | Sprint | Responsible | Dependency | Acceptance criterion | Status |
|---|---|---|---|---|---|---|---|
| B01 | Must | DB migrations and constraints | 1 | Abeer, Tala | PostgreSQL | Schema applies cleanly | IN PROGRESS |
| B02 | Must | Register/login/logout | 1 | Abeer, Ghadi | B01 | Authorized session works | IN PROGRESS |
| B03 | Must | Listing creation and images | 1 | Abeer, Ghadi; Aseel UI | B02 | Owner can submit for review | TODO |
| B04 | Must | Admin approve/reject | 2 | Abeer, Ghadi | B03 | Only admin reviews | TODO |
| B05 | Must | Public/private auctions | 2 | Abeer, Ghadi; Aseel UI | B04 | Access rules enforced | TODO |
| B06 | Must | Sandbox provider proof | 1–3 | Abeer, Ghadi | External provider | Real documented test call | BLOCKED |
| B07 | Must | Bid commitment | 3 | Abeer, Ghadi | B05, B06 | Eligibility check | TODO |
| B08 | Must | Atomic bid and idempotency | 3 | Abeer, Tala | B05, B07 | Concurrent bids consistent | TODO |
| B09 | Must | Auction closure/result | 3 | Abeer, Ghadi | B08 | Winner/no-winner correct | TODO |
| B10 | Must | React screens and polling | 1–4 | Aseel, Ghadi | B02–B09 | End-to-end UI flow | IN PROGRESS |
| B11 | Must | Integration and E2E tests | 4 | Tala, Aseel | B02–B10 | Actual test evidence | TODO |
| B12 | Must | Sprint reviews and metrics | 1–4 | All | Sprint meetings | Signed-off actual records | TODO |
| B13 | Could | Additional UI polish | 4 | Aseel, Ghadi | B10 | Accessibility review | TODO |
| B14 | Won't | Anti-sniping, WebSockets, escrow, real payment | — | — | Stage 3 defers | Not implemented | TODO |
