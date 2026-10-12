# Stage 4 — MVP Development

**[Read the complete Stage 4 Report — Tasks 0–5](Report.MD)**


**Baseline:** [Stage 3 technical report](../Stage_3/Report.MD) (read-only). This stage implements its approved design without editing it.

| Task | Evidence | Current status |
|---|---|---|
| 0. Plan and define sprints | [Sprint plan](Sprint_Plan.md), [Backlog](Product_Backlog.md) | Documented; dates pending team confirmation |
| 1. Execute development tasks | [Repository code](../backend/), [Frontend](../frontend/), [Schema](../database/migrations/001_schema.sql) | Partial implementation |
| 2. Monitor progress | [Progress tracker](Progress_Tracker.md) | Template prepared; no stand-ups invented |
| 3. Reviews and retrospectives | [Sprint reviews](Sprint_Reviews.md), [Retrospectives](Retrospectives.md) | Pending actual sprint meetings |
| 4. Integration and QA | [Test results](Testing_Report.md), [Bug tracker](Bug_Tracker.md) | Not fully executed; environment-dependent |
| 5. Deliverables | This index and linked evidence | Partial |

## Important boundaries
- PostgreSQL, **not MySQL**.
- React + Express + REST polling; no Socket.io or Redis.
- Stage 3 schema contains ten tables; do not silently add Seller/Bidder tables.
- Anti-sniping is a future enhancement in this Stage 3 revision.
- Bank sandbox integration requires real provider access and verified operations; mocks are not proof of real integration.
- No production deployment is claimed.

## Source repository
[Mezyad](https://github.com/Abeerr0/mezyad)

## Production environment
Not deployed. No URL to provide.

## Assessment score
Not assigned by the evaluator.
