# Stage 3 — Technical Documentation

**Status:** Technical design documented; implementation verification is separate.

Stage 3 defines **how** the approved Mezyad MVP should work. This README is a guide, while the [Report](Report.MD) contains the detailed technical answers, diagrams and API contracts.

| Section | What the Report covers |
|---|---|
| 1–2 | Preface, prioritized user stories and UI mockups |
| 3 | React → Express REST → PostgreSQL architecture |
| 4 | Backend responsibilities and class/component design |
| 5 | Ten-table ERD, constraints and relationships |
| 6 | Five sequence diagrams: auth, listing/review, private access/commitment, atomic bidding, closure |
| 7 | Eighteen API contracts, examples and banking sandbox requirements |
| 8 | SCM, team responsibilities, four-week implementation plan and QA cases |
| 9 | Future enhancements outside the MVP |

**[Read the complete Stage 3 Report — technical answers](Report.MD)**

**Implementation boundaries:** PostgreSQL, React, Node.js/Express, periodic REST polling, USER/ADMIN, no real money, no anti-sniping in MVP, no invented bank provider operations. The report documents intended behavior, not automatically proven runtime results.
