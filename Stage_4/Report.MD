# Mezyad — Stage 4: Sprint Execution, Monitoring, Reviews and Final QA

**Project:** Mezyad — High-Value Asset Auction Platform  
**Course:** Holberton Portfolio Project — Stage 4  
**Team:** Abeer Al-Saiari, Ghadi Al-Zahrani, Aseel Al-Zahrani, Tala Al-Hudaibi  
**Repository:** [Abeerr0/mezyad](https://github.com/Abeerr0/mezyad)  
**Technical baseline:** [Stage 3 Report](../Stage_3/Report.MD) (protected, unchanged)  
**Report prepared:** 12 October 2026  
**Implementation status:** **In progress; not a completed or verified MVP.**

> **Evidence integrity:** A plan is not a completed sprint. Code committed to GitHub is not proof that it has been executed successfully. Actual stand-ups, stakeholder feedback, tests, sandbox calls and deployment are reported only if independently evidenced. This report explicitly separates **planned**, **implemented in source**, **verified**, and **blocked**.

---

## 0. Plan and Define Sprints

### 0.1 Objective and development approach

The purpose of sprint planning is to transform the approved Stage 3 user stories into manageable, prioritized implementation tasks with clear ownership, dependencies, acceptance criteria and review checkpoints. We adopt **four one-week sprints**, corresponding to Stage 3 §8.1. Exact calendar start and end dates remain **to be confirmed by the team**; no fictional deadlines are presented.

The development baseline is **React**, **Node.js/Express**, **PostgreSQL**, REST APIs with periodic **polling**, and PostgreSQL transactions for safe bidding. We do **not** substitute MySQL, Redis or Socket.io. The Stage 3 data model defines **ten tables**. Anti-sniping, real payments, escrow, KYC and handover are not in the currently approved Stage 3 MVP.

### 0.2 MoSCoW prioritization

| Priority | User-facing scope | Reason |
|---|---|---|
| **Must Have** | Register/login/logout; User/Admin authorization; listing submission and review; public/private auction creation and access; commitment validation; atomic bids; auction closure and winner; basic React screens; QA | Required for the minimum end-to-end auction journey |
| **Must Have — external dependency** | Evidence of a genuine supported Saudi Open Banking sandbox operation | Required by the technical baseline; dependent on provider documentation and credentials |
| **Should Have** | Improved loading/error/empty states, pagination, accessible UI, expanded automated tests | Improves reliability and usability without changing core business logic |
| **Could Have** | Additional design polish and noncritical enhancements | Valuable only after core flow passes |
| **Won't Have this stage** | Anti-sniping, WebSockets, Redis, real financial settlement, escrow, real KYC, blockchain and handover | Outside the current Stage 3 implementation baseline |

### 0.3 Sprint schedule and acceptance checkpoints

| Sprint | Duration | Planned work | Acceptance checkpoint | Owner(s) | Deadline |
|---|---|---|---|---|---|
| **Sprint 1 — Foundation** | Week 1 (7 days) | Repository setup, PostgreSQL schema and seed, Express/React scaffolding, registration/login, first listing workflow, bank sandbox access investigation | Sign in and save a listing in PostgreSQL; document verified sandbox access or blocker | Abeer + Tala DB; Abeer + Ghadi backend; Aseel + Ghadi UI | End of Week 1; calendar date TBD |
| **Sprint 2 — Auctions** | Week 2 (7 days) | Admin approval/rejection, auction creation, public/private access, listing/auction screens | Seller submits listing → Admin approves → seller creates auction → eligible user accesses it | Abeer + Ghadi backend; Aseel + Ghadi UI; Tala QA | End of Week 2; calendar date TBD |
| **Sprint 3 — Commitment & Bidding** | Week 3 (7 days) | Sandbox commitment if authorized, bid eligibility, atomic PostgreSQL bidding, history, closure, results | Valid and concurrent bid scenarios pass; late bids rejected; winner recorded consistently | Abeer + Ghadi backend; Abeer + Tala DB; Tala + Aseel QA | End of Week 3; calendar date TBD |
| **Sprint 4 — Final Integration & QA** | Week 4 (7 days) | Full React–API–PostgreSQL integration, regression, negative/security tests, critical bug fixes, mentor demo rehearsal | Public and private auction journeys work without manual DB edits; evidence archived | Entire team; Tala + Aseel QA | End of Week 4; calendar date TBD |

### 0.4 Task decomposition and dependencies

| Backlog ID | Small task | Sprint | Priority | Responsible | Depends on | Acceptance |
|---|---|---|---|---|---|---|
| B01 | Schema, migrations, constraints and seed | 1 | Must | Abeer, Tala | PostgreSQL | Migration applies to clean DB |
| B02 | Register/login/logout and role guard | 1 | Must | Abeer, Ghadi | B01 | Valid sessions; invalid credentials rejected |
| B03 | Listing form, API, image validation | 1–2 | Must | Abeer, Ghadi, Aseel | B02 | Owner can submit valid listing and safe images |
| B04 | Admin listing review | 2 | Must | Abeer, Ghadi | B03 | Only Admin can approve/reject |
| B05 | Public/private auctions and access | 2 | Must | Abeer, Ghadi, Aseel | B04 | Private access requires code and grant |
| B06 | Official sandbox verification | 1–3 | Must | Abeer, Ghadi | Provider credentials/docs | Reproducible provider test, or explicit blocker |
| B07 | Commitment workflow | 3 | Must | Abeer, Ghadi | B05, B06 | No false commitment success |
| B08 | Atomic bidding and idempotency | 3 | Must | Abeer, Tala | B05, B07 | Concurrent updates consistent |
| B09 | Closure and auction result | 3 | Must | Abeer, Ghadi | B08 | Correct winner or no-winner result |
| B10 | RTL React screens and polling | 1–4 | Must | Aseel, Ghadi | B02–B09 | All main screens usable |
| B11 | Automated and manual E2E QA | 4 | Must | Tala, Aseel | B02–B10 | Tests executed and evidence recorded |
| B12 | Sprint tracking and reviews | 1–4 | Must | All | Real meetings | Dated, attributable records |
| B13 | Visual/accessibility polish | 4 | Should | Aseel, Ghadi | B10 | UX review evidence |

The detailed, maintainable backlog is [Product_Backlog.md](Product_Backlog.md).

### 0.5 Responsibilities and definition of done

- **Abeer Al-Saiari:** database with Tala; backend with Ghadi; implementation coordination and technical review.
- **Tala Al-Hudaibi:** database with Abeer; QA, integration review and test evidence with Aseel.
- **Ghadi Al-Zahrani:** backend with Abeer; frontend with Aseel; UI implementation coordination.
- **Aseel Al-Zahrani:** frontend with Ghadi; QA and integration review with Tala.

A task is **Done** only when implementation is merged after review, acceptance criteria are demonstrated, relevant tests have actually passed, bugs are documented, and evidence is linked. A merged file without test evidence remains **implemented but unverified**.

---

## 1. Execute Development Tasks

### 1.1 Repository and version-control workflow

The repository contains the protected Stage 3 specification and a separate Stage 4 implementation. Work was initially committed to a feature branch and submitted through [Pull Request #1](https://github.com/Abeerr0/mezyad/pull/1), then merged into `main`. The merge is evidence of source-control activity **only**; it is not evidence of passing tests or formal peer review.

Recommended ongoing workflow: issue/backlog item → named `feature/<task-id>-<description>` branch → small commits → PR → teammate review → tests → merge. Protect `Stage_3/Report.MD` from edits.

### 1.2 Implemented source files (not yet verified by execution)

| Component | Repository evidence | Source-level work present | Verification status |
|---|---|---|---|
| PostgreSQL schema | [001_schema.sql](../database/migrations/001_schema.sql) | Ten tables, foreign keys, constraints, indexes, bid request uniqueness and auction-result association | Migration not executed in a live DB here |
| Category seed | [001_categories.sql](../database/seeds/001_categories.sql) | Initial listing categories | Not executed |
| Express API | [app.js](../backend/src/app.js) | Auth, listing, admin review, auction, private access, commitment safety gate, bids, closure and activity routes | Not fully integration-tested |
| Session auth | [auth.js](../backend/src/auth.js) | Bearer sessions and admin guard | Not independently tested |
| React frontend | [main.jsx](../frontend/src/main.jsx) | Arabic RTL landing, public auction cards, polling, basic registration/login and detail view | Full UI flow incomplete |
| Initial automated test | [health.test.js](../backend/tests/health.test.js) | Health endpoint test source | Execution result not recorded |
| Repository setup | [README](../README.md), [.env.example](../.env.example) | Local setup guidance and safe environment template | Local reproduction not independently verified |

**Current implementation gaps:** multipart image upload and validation are missing; the React app lacks complete seller/admin/private-auction/bidding journeys; sandbox integration is not connected; comprehensive unit/integration/E2E tests are absent. Some routes are scaffolded but cannot yet support a complete production-quality workflow.

### 1.3 API scope and coding standards

The approved Stage 3 API specifies **18 endpoints** across authentication, listings, admin review, auctions, commitment, bids and My Activity. The backend source contains corresponding route handlers plus helper routes such as `/health` and `/categories`. Route presence does **not** establish contract compliance.

Coding conventions: use environment variables for secrets; parameterized PostgreSQL queries; hash passwords and session tokens; enforce role/ownership checks on the server; validate request inputs; return consistent `data` or `error.code/message` JSON; never accept a bid without a verified successful commitment; use `SELECT ... FOR UPDATE` for bid serialization.

### 1.4 Banking integration dependency

A genuine Saudi Open Banking sandbox provider, exact supported operation, authorized client credentials and consent flow are **not verified**. Accordingly the commitment creation endpoint deliberately returns a service-unavailable response rather than issuing fake `SUCCESS` records. This is a **blocking dependency** for an end-to-end real-sandbox bidding demonstration, not a completed integration. Mock tests, if later added, must be clearly labeled as mock-only.

---

## 2. Monitor Progress and Adjust

### 2.1 Daily stand-up protocol

A short daily stand-up should answer: (1) what was completed since the last meeting, (2) what is planned next, and (3) what is blocked. The task owner updates the backlog status (`TODO`, `IN PROGRESS`, `BLOCKED`, `DONE`) and links relevant commits, PRs, bugs and test runs.

**Actual meeting records:** No dated daily stand-up minutes have been supplied or verified. Therefore no meetings or individual contributions are claimed as already completed. Use the [Progress Tracker](Progress_Tracker.md) for actual entries.

### 2.2 Tracking metrics

| Metric | Formula | Current defensible result |
|---|---|---|
| Sprint velocity | Accepted backlog tasks completed in sprint | Not measured; no completed sprint record |
| Completion percentage | Accepted tasks / planned tasks × 100 | Not measured; sprint task totals not finalized |
| Open bug count | Verified discovered bugs minus verified fixed bugs | Not measured; QA execution pending |
| Bug resolution rate | Verified fixed bugs / verified discovered bugs × 100 | Not measured; denominator unavailable |
| Blocker count | Confirmed unresolved dependencies | At least one: real banking sandbox access/operation |

A committed feature does not count toward velocity until its acceptance criteria and evidence are complete.

### 2.3 Risk register and adjustment policy

| Risk | Impact | Mitigation | Owner |
|---|---|---|---|
| Sandbox provider approval unavailable | Blocks genuine commitment and full bid journey | Investigate official documentation; request access; document actual blocker; no fake pass | Abeer, Ghadi |
| Concurrent bids race | Incorrect price/winner | Transactional row locking and concurrency tests | Abeer, Tala |
| Frontend/API contract mismatch | Broken demo | API contract checklist and integration tests | Aseel, Ghadi |
| Image upload security | Unsafe or invalid listing files | File type/size validation and negative tests | Abeer, Ghadi |
| Incomplete sprint evidence | Reduced Stage 4 assessment confidence | Dated stand-ups, demos, PR and test links | All |
| Schedule slippage | Core journey unfinished | Prioritize Must Have tasks and record reassignments | All |

If a blocker affects a sprint goal, record the decision, responsible person, changed scope and date in the tracker. Do not silently mark blocked items complete.

---

## 3. Conduct Sprint Reviews and Retrospectives

### 3.1 Sprint review format

At the end of each sprint, demonstrate only accepted features against the checkpoint in §0.3. Record the date, attendees, commit/PR, demonstration scenario, actual result, stakeholder feedback, rejected items and carry-over tasks.

| Sprint | Planned demonstration | Actual review evidence | Status |
|---|---|---|---|
| 1 | Auth + saved listing + sandbox access status | No verified review minutes or demo | Pending |
| 2 | Seller → admin → public/private auction | No verified review minutes or demo | Pending |
| 3 | Commitment → atomic bid → closure | No verified review minutes or demo | Pending |
| 4 | Complete public/private E2E journey | No verified review minutes or demo | Pending |

See [Sprint_Reviews.md](Sprint_Reviews.md).

### 3.2 Retrospective format

After each review, the team records **what went well**, **what did not go well**, and **what to change next sprint**. Every improvement action must have an owner and a follow-up checkpoint. No quotes or feedback are attributed to teammates without an actual meeting.

| Sprint | What worked | Challenge | Action item | Status |
|---|---|---|---|---|
| 1 | To be recorded | To be recorded | To be agreed | Pending |
| 2 | To be recorded | To be recorded | To be agreed | Pending |
| 3 | To be recorded | To be recorded | To be agreed | Pending |
| 4 | To be recorded | To be recorded | To be agreed | Pending |

See [Retrospectives.md](Retrospectives.md).

---

## 4. Final Integration and QA Testing

### 4.1 Test strategy

1. **Static review:** verify endpoint names, data model, constraints, error shapes and React build configuration.
2. **Database tests:** apply schema/seed to a clean PostgreSQL database, check foreign keys, uniqueness, types and transaction rollback.
3. **API tests:** test authentication, authorization, listing review, private access, commitment failure handling and bid validation using a running server and test DB.
4. **Concurrency tests:** submit competing bids with separate sessions and ensure consistent price and winner.
5. **Browser E2E:** test registration, listing, admin review, auction discovery, private access, commitment, bidding, closing and My Activity using actual UI flows.
6. **Security/negative tests:** invalid image, unauthorized review, owner bidding, expired session, late bid, duplicate request ID, private data disclosure and bank failure.
7. **Regression:** rerun affected tests after fixes; attach logs/screenshots and exact commit SHA.

### 4.2 Traceability to Stage 3

| Stage 3 QA cases | Area | Expected evidence | Actual execution |
|---|---|---|---|
| QA-01, QA-02 | Duplicate email, invalid password | HTTP 409 / 401 test logs | Not recorded |
| QA-03, QA-03A, QA-03B | Admin permissions, owner restriction, dual user activity | API + integration tests | Not recorded |
| QA-04–QA-07 | Approval, private access, commitment failure | API and sandbox negative tests | Not recorded |
| QA-08–QA-11 | Bid minimum, duplicate request, concurrency, end time | Transactional integration tests | Not recorded |
| QA-12–QA-13 | Closure without bids and repeat closure | DB and API tests | Not recorded |
| QA-14–QA-16 | UI states and complete public/private flows | Browser E2E recordings | Not recorded |
| QA-17–QA-23 | Resubmission, price boundaries, winner integrity, activity, image upload and lazy closure | Integration and negative tests | Not recorded |

The IDs and expectations come from [Stage 3 §8.4](../Stage_3/Report.MD). **None of these tests are represented as passed without actual execution evidence.**

### 4.3 Reproduction commands

From the repository root, with PostgreSQL installed and configured:

```bash
# PostgreSQL setup
psql "$DATABASE_URL" -f database/migrations/001_schema.sql
psql "$DATABASE_URL" -f database/seeds/001_categories.sql

# Backend
cd backend
npm install
npm run check
npm test
npm run dev

# In a second terminal, from the repository root
cd frontend
npm install
npm run build
npm run dev
```

These are **instructions for a future run**, not a claim that the commands have passed. See [Testing_Report.md](Testing_Report.md) for test evidence and [Bug_Tracker.md](Bug_Tracker.md) for verified issues.

### 4.4 Final acceptance gate

The MVP is ready for final acceptance only after all Must Have features are demonstrated, the UI/API/DB work together, no critical bugs remain, real banking integration status is accurately disclosed, and test logs are attached. **This gate is not yet met.** No production environment has been deployed or verified.

---

## 5. Deliverables — Links and Evidence

| Requested deliverable | Link | Status |
|---|---|---|
| **Sprint Planning** | [Sprint Plan](Sprint_Plan.md) · [Product Backlog](Product_Backlog.md) | Plan documented; calendar dates TBD |
| **Sprint Reviews** | [Sprint Reviews](Sprint_Reviews.md) | Template; actual review records pending |
| **Retrospectives** | [Retrospectives](Retrospectives.md) | Template; actual meeting records pending |
| **Source Repository** | [Abeerr0/mezyad](https://github.com/Abeerr0/mezyad) | Available |
| **Source Control Evidence** | [Merged Pull Request #1](https://github.com/Abeerr0/mezyad/pull/1) | Verified merge; not proof of peer review |
| **Progress Tracking** | [Progress Tracker](Progress_Tracker.md) | Prepared; actual metrics pending |
| **Bug Tracking** | [Bug Tracker](Bug_Tracker.md) | Prepared; verified bugs not yet cataloged |
| **Testing Evidence and Results** | [Testing Report](Testing_Report.md) | Test plan present; execution evidence pending |
| **Backend Source** | [Express backend](../backend/src/app.js) | Source committed; not fully verified |
| **Frontend Source** | [React frontend](../frontend/src/main.jsx) | Initial UI committed; incomplete |
| **Database Source** | [PostgreSQL migration](../database/migrations/001_schema.sql) | Source committed; migration execution pending |
| **Production Environment** | No verified deployment URL | Not deployed |
| **Score of the Task** | Evaluator-assigned score | Not yet available |

### 5.1 Current assessment readiness

**Task 0:** substantial planning documentation exists, but real sprint calendar dates need agreement.  
**Task 1:** initial code exists; the full MVP and bank integration remain incomplete.  
**Task 2:** monitoring process exists; historical daily metrics and stand-ups are not evidenced.  
**Task 3:** review/retrospective templates exist; actual sessions must be conducted.  
**Task 4:** test plan exists; complete automated/manual execution evidence is missing.  
**Task 5:** source and document links are provided; production and testing links are explicitly pending.

### 5.2 Remaining actions before final submission

1. Confirm sprint dates and complete backlog ownership/acceptance checkpoints.
2. Finish image uploads, seller/admin/private auction and bidding React screens.
3. Obtain and verify an official Saudi banking sandbox operation, or document the unresolved external blocker accurately.
4. Run migrations and test suites in a real environment; record command outputs, commit SHA, dates and defects.
5. Hold actual sprint reviews and retrospectives, record evidence and update velocity.
6. Add verified deployment URL only if deployment actually succeeds.

---

## Appendix — Technical consistency

- **Database:** PostgreSQL; ten tables; no MySQL.
- **Backend:** Express REST; PostgreSQL transactional bid locking.
- **Frontend:** React with Arabic RTL design and polling.
- **User roles:** `USER` and `ADMIN`; one User can be seller and bidder in different auctions.
- **No unapproved changes:** Stage 3 report remains unchanged; design discrepancies are tracked separately in [Stage 3 Review Notes](../docs/STAGE_3_REVIEW_NOTES.md).
- **Financial safety:** No real payment, settlement or escrow is implemented or claimed.

**End of Stage 4 Report.**
