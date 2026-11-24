# Stage 4: MVP Development

This stage documents Mezyad sprint planning, implementation, progress, reviews, testing and delivery. **Start with the [main Stage 4 report](Report.MD)** for the project narrative and links to evidence.

## Stage 4 Tasks

| Task | Main evidence |
| --- | --- |
| 0. Sprint Planning | [Main report — Sprint Planning](Report.MD#task-0-sprint-planning) |
| 1. Development | [Main report — Development](Report.MD#task-1-development-and-source-control) · [Backend](../backend/) · [Frontend](../frontend/) · [Database](../database/) |
| 2. Progress Monitoring | [Main report — Progress](Report.MD#task-2-progress-and-adjustments) · [Notion weekly plan](https://app.notion.com/p/4020bc42a08081198a73f34924d1cb71) |
| 3. Sprint Reviews and Retrospectives | [Main report — Reviews](Report.MD#task-3-sprint-reviews-and-retrospectives) |
| 4. Integration and QA Testing | [Main report — Testing](Report.MD#task-4-integration-and-qa) · [E2E Report](E2E_Report.md) · [Bug Tracker](Bug_Tracker.md) |
| 5. Deliverables | [Main report — Deliverables](Report.MD#task-5-deliverables) |

## Abeer — Task Reports

[All Abeer frontend, backend and database reports](Abeer-Task-Reports/) are retained in their original task-based structure.

| Task | Scope | Report | Supporting evidence |
| --- | --- | --- | --- |
| AS-08 | Loading, error and empty states | [AS-08](Abeer-Task-Reports/AS-08.md) | [Original report](AS08_States.md) · [Test output](evidence/as08-states.txt) |
| AS-09 | Frontend navigation and role-based access testing | [AS-09](Abeer-Task-Reports/AS-09.md) | [FE-13 testing](FE13_Aseel_Testing.md) · [Test output](evidence/fe13-abeer.txt) |
| FE-13 | Frontend integration and troubleshooting | [FE-13](Abeer-Task-Reports/FE-13.md) | [Testing report](FE13_Aseel_Testing.md) |

## Testing & Evidence

| Area | Where to start | Important limitation |
| --- | --- | --- |
| Backend / database automated tests | [Backend tests](../backend/tests/) · [Backend package scripts](../backend/package.json) | A test file existing is not proof that it passed on the latest commit. |
| Frontend component/integration checks | [FE-13 report](Abeer-Task-Reports/FE-13.md) · [Historical log](evidence/fe13-abeer.txt) | Historical jsdom/API evidence; not a full-browser E2E run. |
| UI loading/error/empty checks | [AS-08 report](Abeer-Task-Reports/AS-08.md) | Simulated-network tests on an earlier revision. |
| Navigation/role checks | [AS-09 report](Abeer-Task-Reports/AS-09.md) | Existing role/login/logout evidence; current merged browser retest remains separate. |
| Manual end-to-end journeys | [E2E report](E2E_Report.md) | Five browser journeys are recorded as passed in the report; deployment/commit-specific evidence should be attached. |
| Defects & retests | [Bug Tracker](Bug_Tracker.md) | Check dates and test environments before treating earlier status as current. |

## Project Links

- [Main Stage 4 delivery report](Report.MD)
- [Stage 4 Notion weekly plan](https://app.notion.com/p/4020bc42a08081198a73f34924d1cb71)
- [Stage 4 task board](https://app.notion.com/p/90d3ecedbaba461cbe3ce7933a409788?v=f0ebf28bea9144329e41627e5631ff57)
- [Development branch](https://github.com/Abeerr0/mezyad/tree/Development)
- [Live Mezyad website](https://mezyad1.com/)
