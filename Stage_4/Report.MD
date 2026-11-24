# Mezyad — Stage 4 Report

**Project:** Mezyad — Online Auction Platform  
**Team:** Abeer Al-Saiari, Ghadi Al-Zahrani, Aseel Al-Zahrani, Tala Al-Hudaibi  
**School:** Holberton School  
**Stage:** 4 — MVP Development

This stage covers our sprint plan, development work, progress, team reviews, and testing. We used GitHub for code and Notion for task tracking. Detailed technical work is linked below instead of repeated here.

## Task 0 — Plan and Define Sprints

We planned four one-week sprints. Tasks were ordered so that accounts and listings came before auctions, and auctions came before bidding and final testing.

| Sprint | Main work | Team responsibilities |
| --- | --- | --- |
| S1 — Foundation | Database setup, accounts, login, and first listings | Abeer and Tala: database; Abeer and Ghadi: backend; Abeer: user pages; Aseel: admin pages |
| S2 — Marketplace | Listing review, auction setup, and private access | Abeer and Ghadi: backend; Abeer: user pages; Aseel: admin; Tala: QA |
| S3 — Bidding | Test commitment, bidding rules, history, and closure | Abeer and Ghadi: backend; Abeer and Tala: bid checks; Tala and Aseel: QA |
| S4 — Integration | Connect features, test user journeys, fix problems, prepare demo | All team members |

**Priority (MoSCoW):** Must Have: accounts, listings, admin review, public/private auctions, bids, and results. Should Have: better usability and more tests. Could Have: extra UI improvements. Won't Have for this MVP: real payment settlement and ownership transfer.

The work and responsibilities were tracked in the [Stage 4 Notion task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link). The sprint order follows the approved [Stage 3 plan](../Stage_3/Report.MD).

## Task 1 — Execute Development Tasks

We developed the MVP in React, Express, and PostgreSQL. The main work is listed here; each link leads to a detailed report or source evidence.

| Work | What we built | Evidence |
| --- | --- | --- |
| Accounts | Registration, email verification, login, and sessions | [FE-01](Abeer-Task-Reports/FE-01.md), [FE-02](Abeer-Task-Reports/FE-02.md), [DB-06](Abeer-Task-Reports/DB-06.md) |
| Listings | Add items and images, review, reject, edit, and resubmit | [FE-05](Abeer-Task-Reports/FE-05.md), [FE-06](Abeer-Task-Reports/FE-06.md), [BE-01](Abeer-Task-Reports/BE-01.md), [BE-02](Abeer-Task-Reports/BE-02.md), [BE-03](Abeer-Task-Reports/BE-03.md) |
| Auctions | Create auctions, browse them, and enter private auctions | [FE-03](Abeer-Task-Reports/FE-03.md), [FE-07](Abeer-Task-Reports/FE-07.md), [FE-08](Abeer-Task-Reports/FE-08.md) |
| Bidding | Test commitment, bid checks, prices, and bid history | [FE-12](Abeer-Task-Reports/FE-12.md), [FE-18](Abeer-Task-Reports/FE-18.md), [BE-04](Abeer-Task-Reports/BE-04.md), [DB-09](Abeer-Task-Reports/DB-09.md) |
| Results | Auction closure, activity, and winner/no-winner results | [FE-10](Abeer-Task-Reports/FE-10.md), [FE-17](Abeer-Task-Reports/FE-17.md) |
| UI and QA | Shared components, navigation, integration, and test coverage | [FE-20](Abeer-Task-Reports/FE-20.md), [FE-21](Abeer-Task-Reports/FE-21.md), [AS-08](Abeer-Task-Reports/AS-08.md), [AS-09](Abeer-Task-Reports/AS-09.md) |

We used the [Development branch](https://github.com/Abeerr0/mezyad/tree/Development) to bring the work together. Changes can be checked in the [commit history](https://github.com/Abeerr0/mezyad/commits/Development) and [pull requests](https://github.com/Abeerr0/mezyad/pulls).

## Task 2 — Monitor Progress and Adjust

We followed task status in Notion and used the bug tracker to record problems and fixes.

| Issue | What we did |
| --- | --- |
| Listing images and rejected listings | Improved image handling and checked the edit-and-resubmit flow. |
| Bid page did not recognize an approved commitment | Fixed the frontend API path and retested it locally. |
| Two bids could arrive at the same time | Used database transactions and row locking to protect the auction price. |
| Official banking sandbox was not available | Used **Moyasar Test Mode** to test the commitment flow. This is not a real bank integration. |

Evidence: [Notion task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link) · [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md).

## Task 3 — Conduct Sprint Reviews and Retrospectives

We checked the main results of each sprint against the planned features:

| Sprint | Features reviewed | Related evidence |
| --- | --- | --- |
| S1 | Registration, login, and listings | [Account and listing tests](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |
| S2 | Listing approval and public/private auctions | [E2E results](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |
| S3 | Test commitment, valid/invalid bids, and auction results | [Bidding report](Abeer-Task-Reports/BE-04.md) · [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md) |
| S4 | Full workflows and final integration | [Integration report](Integration_Testing_Report.md) · [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |

**What went well:** The main user journeys were connected and tested.  
**Challenges:** Payment provider access, API path errors, and bids arriving together.  
**What we learned:** Test connected features early, check API paths, and record bugs clearly.

The links above show feature and test evidence. Separate dated sprint review or retrospective meeting minutes are not included in this report.

## Task 4 — Final Integration and QA Testing

We used unit tests, integration tests, and end-to-end (E2E) tests to check the MVP.

| Test type | What it checked | Recorded evidence |
| --- | --- | --- |
| Unit tests | Individual backend functions and selected admin behavior | [Backend test files](../backend/tests/) · [Unit test file](Stage%204%20Tests%20/Unit%20Test/admin.test.mjs) · [Backend test notes](Abeer-Task-Reports/BE-05.md) |
| Integration tests | Frontend, backend, database, and main workflows together | [Integration report](Integration_Testing_Report.md) · [Results](Integration-Testing-evidence/accepted-unified-summary.json): **58 passed, 0 failed** in the recorded isolated run |
| E2E tests | Registration, listing review, public/private auctions, and closure | [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md): **5 scenarios passed** in the recorded browser run |

The E2E payment steps used **Moyasar Test Mode**. These results apply to the documented test runs, not every possible case or future version. Problems and fixes are listed in the [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md).

## Task 5 — Deliverables

| Deliverable | Link |
| --- | --- |
| Sprint planning and tasks | [Notion task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link) |
| Sprint reviews and retrospectives | [Task 3 summary](#task-3--conduct-sprint-reviews-and-retrospectives) · [Team workspace](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) |
| Source repository | [GitHub — Development](https://github.com/Abeerr0/mezyad/tree/Development) |
| Bug tracking | [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md) |
| Unit testing | [Backend tests](../backend/tests/) · [Admin unit test](Stage%204%20Tests%20/Unit%20Test/admin.test.mjs) |
| Integration testing | [Integration report](Integration_Testing_Report.md) |
| E2E testing | [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |
| Production environment | [Mezyad website](https://mezyad1.com/) |

**Hosting:** Render  
**Domain:** GoDaddy  
**Website:** https://mezyad1.com/  
**YouTube Demo:**
