# Mezyad — Stage 4 Report

**Project:** Mezyad — Online Auction Platform  
**Team:** Abeer Al-Saiari, Ghadi Al-Zahrani, Aseel Al-Zahrani, Tala Al-Hudaibi  
**School:** Holberton School  
**Stage:** 4 — MVP Development

This stage covers our sprint plan, development work, progress, team reviews, and testing. We used GitHub for code and Notion for task tracking. Detailed technical work is linked below.

## Task 0 — Plan and Define Sprints

We planned the work over **six weeks, from 11 October to 21 November 2026**. The weekly plan lists the tasks, owners, due dates, and progress.

| Week | Dates | Main goal | Main work |
| --- | --- | --- | --- |
| Week 1 | 11–17 Oct | Project setup | Database, accounts, login, and shared UI |
| Week 2 | 18–24 Oct | Authentication and home page | Listing APIs, admin review, and auction pages |
| Week 3 | 25–31 Oct | First half of core features | Listings, auction rules, and bidding preparation |
| Week 4 | 1–7 Nov | Complete core features | Main auction and bidding workflows |
| Week 5 | 8–14 Nov | Extra features and integrations | Activity pages, commitments, and frontend/API connection |
| Week 6 | 15–21 Nov | Testing | Check implemented features and record bugs and results |

We used task priorities to work on essential features first. In MoSCoW terms, **Must Have** means features needed for the MVP (accounts, listings, review, auctions, bids, results). **Should Have** means important improvements. **Could Have** means optional improvements. **Won't Have** means work outside the MVP, such as real payment settlement and ownership transfer. The actual Notion task board uses High, Medium, and Low priority labels.

Account and listing work came before auction and bidding work. Team members and due dates are listed for each task in Notion.

**Planning and assignments:** [Six-week plan](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) · [Task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link).

## Task 1 — Execute Development Tasks

We built Mezyad using **React** for the user interface, **Express** for the API, and **PostgreSQL** for data. We divided the work into features and connected them during development.

| Area | What we completed | Evidence |
| --- | --- | --- |
| Accounts | Users can register, verify email, sign in, and manage a session. The API checks identity and account access. | [FE-01](Abeer-Task-Reports/FE-01.md), [FE-02](Abeer-Task-Reports/FE-02.md), [DB-06](Abeer-Task-Reports/DB-06.md) |
| Listings | Sellers can add item details and images. Admins can review an item; a rejected item can be edited and sent again. | [FE-05](Abeer-Task-Reports/FE-05.md), [FE-06](Abeer-Task-Reports/FE-06.md), [BE-01](Abeer-Task-Reports/BE-01.md), [BE-02](Abeer-Task-Reports/BE-02.md), [BE-03](Abeer-Task-Reports/BE-03.md) |
| Auctions | Sellers can set up auctions for approved items. Visitors can browse public auctions; private auctions require an access code. | [FE-03](Abeer-Task-Reports/FE-03.md), [FE-04](Abeer-Task-Reports/FE-04.md), [FE-07](Abeer-Task-Reports/FE-07.md), [FE-08](Abeer-Task-Reports/FE-08.md), [DB-04](Abeer-Task-Reports/DB-04.md) |
| Bidding | Eligible users can complete a test commitment, submit a bid, and view bid history. The backend checks the bid and updates the saved price. | [FE-12](Abeer-Task-Reports/FE-12.md), [FE-18](Abeer-Task-Reports/FE-18.md), [BE-04](Abeer-Task-Reports/BE-04.md), [DB-09](Abeer-Task-Reports/DB-09.md) |
| Results and account pages | The website displays auction outcomes, user activity, personal auctions, and help pages. | [FE-10](Abeer-Task-Reports/FE-10.md), [FE-16](Abeer-Task-Reports/FE-16.md), [FE-17](Abeer-Task-Reports/FE-17.md), [FE-19](Abeer-Task-Reports/FE-19.md) |
| Integration and shared UI | Shared components and API helpers connect pages, account data, and auction data. | [FE-14](Abeer-Task-Reports/FE-14.md), [FE-20](Abeer-Task-Reports/FE-20.md), [FE-21](Abeer-Task-Reports/FE-21.md), [AS-08](Abeer-Task-Reports/AS-08.md), [AS-09](Abeer-Task-Reports/AS-09.md) |

The table describes the main implemented work. Some individual reports still note items to fix or test, so a working feature does not mean every detail is finished. More implementation details are in [Abeer's task reports](Abeer-Task-Reports/) and [Ghadi's backend reports](Ghadi%20Task%20reports/).

We kept the work on the [Development branch](https://github.com/Abeerr0/mezyad/tree/Development). The [commit history](https://github.com/Abeerr0/mezyad/commits/Development) and [pull requests](https://github.com/Abeerr0/mezyad/pulls) show the recorded changes.

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

We used the weekly goals to check which features were ready and which issues needed more work. Related code and test records are linked below.

| Week | What we checked | Evidence |
| --- | --- | --- |
| Week 1 | Database setup, accounts, and shared pages | [Week 1 plan](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) · [FE-01](Abeer-Task-Reports/FE-01.md) |
| Week 2 | Login, listings, and admin review | [FE-02](Abeer-Task-Reports/FE-02.md) · [Listing review test](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |
| Week 3 | Listing corrections and auction rules | [BE-02](Abeer-Task-Reports/BE-02.md) · [DB-04](Abeer-Task-Reports/DB-04.md) |
| Week 4 | Core auction, bidding, and result flows | [FE-12](Abeer-Task-Reports/FE-12.md) · [BE-04](Abeer-Task-Reports/BE-04.md) |
| Week 5 | Commitment and frontend/API integration | [FE-18](Abeer-Task-Reports/FE-18.md) · [FE-20](Abeer-Task-Reports/FE-20.md) |
| Week 6 | Testing and fixing issues | [Integration report](Integration_Testing_Report.md) · [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |

**What went well:** The main user journeys were connected and tested.  
**Challenges:** Payment provider access, API path errors, and simultaneous bids.  
**What we learned:** Check integrations early, test error cases, and record fixes.

These are weekly work and testing records. Separate formal meeting minutes for each sprint review or retrospective are not confirmed by the linked evidence.

**Weekly plan:** [Six-week plan](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) · [Task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link).

## Task 4 — Final Integration and QA Testing

We used unit tests, integration tests, and end-to-end (E2E) tests to check the MVP.

| Test type | What it checked | Recorded evidence |
| --- | --- | --- |
| Unit tests | Individual backend functions and selected admin behavior | [Ghadi's backend task and testing reports](Ghadi%20Task%20reports/) · [Admin unit test](Stage%204%20Tests%20/Unit%20Test/admin.test.mjs) · [BE-05](Abeer-Task-Reports/BE-05.md) |
| Integration tests | Frontend, backend, database, and main workflows together | [Integration report](Integration_Testing_Report.md) · [Results](Integration-Testing-evidence/accepted-unified-summary.json): **58 passed, 0 failed** in the recorded isolated run |
| E2E tests | Registration, listing review, public/private auctions, and closure | [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md): **5 scenarios passed** in the recorded browser run |

The E2E payment steps used **Moyasar Test Mode**. These results apply to the documented test runs, not every possible case or future version. Problems and fixes are listed in the [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md).

## Task 5 — Deliverables

| Deliverable | Link |
| --- | --- |
| Sprint planning and tasks | [Six-week plan](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) · [Notion task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57&source=copy_link) |
| Sprint reviews and retrospectives | [Task 3 summary](#task-3--conduct-sprint-reviews-and-retrospectives) · [Team workspace](https://app.notion.com/p/Mezyad-Stage-4-4020bc42a08081198a73f34924d1cb71?source=copy_link) |
| Source repository | [GitHub — Development](https://github.com/Abeerr0/mezyad/tree/Development) |
| Bug tracking | [Bug Tracker](Stage%204%20Tests%20/Bug_Tracker.md) |
| Unit testing | [Ghadi's backend reports](Ghadi%20Task%20reports/) · [Admin unit test](Stage%204%20Tests%20/Unit%20Test/admin.test.mjs) · [BE-05](Abeer-Task-Reports/BE-05.md) |
| Integration testing | [Integration report](Integration_Testing_Report.md) |
| E2E testing | [E2E report](Stage%204%20Tests%20/E2E%20Test%20/E2E_Report.md) |
| Production environment | [Mezyad website](https://mezyad1.com/) |

**Hosting:** Render  
**Domain:** GoDaddy  
**Website:** https://mezyad1.com/  
**YouTube Demo:**
