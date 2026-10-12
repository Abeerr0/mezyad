# Mezyad | مِزياد

**Mezyad** is a digital auction platform project for high-value and rare assets. This repository keeps each Holberton portfolio stage organized: **README = short stage guide; Report = complete answers to that stage's tasks.**

## Portfolio stages

| Stage | Purpose | Formal answers | Status |
|---|---|---|---|
| **1 — Idea Development** | Team formation, research, evaluation and MVP idea | [Stage 1 Report](Stage_1/Report.MD) | Completed; **100/100** (team-reported) |
| **2 — Project Charter** | SMART goals, stakeholders, scope, risks and milestones | [Stage 2 Report](Stage_2/Report.MD) | Revised to align with Stage 3 |
| **3 — Technical Documentation** | Architecture, ERD, 5 sequences, APIs and QA | [Stage 3 Report](Stage_3/Report.MD) | Design documented |
| **4 — MVP Development** | Sprint execution, code, tracking, QA and evidence | [Stage 4 Report](Stage_4/Report.MD) | Source started; full acceptance pending |
| **5 — Project Closure** | Final demo, results and handoff | Not yet prepared | Future stage |

### Navigate each stage

[Stage 1 Guide](Stage_1/README.MD) · [Stage 2 Guide](Stage_2/README.MD) · [Stage 3 Guide](Stage_3/README.MD) · [Stage 4 Guide](Stage_4/README.md)

## One consistent approved MVP

**Workflow:** Register/login → create category-specific asset listing with images → admin approve/reject → create public/private auction → verify private access (when required) → verified Saudi Open Banking sandbox commitment → submit server-validated bid → view history and updated price → close auction → persist winner/no-winner result.

**Stack:** React (frontend), Node.js/Express REST (backend), PostgreSQL (10 tables), periodic GET polling for auction updates. Same `USER` identity may sell and bid on other users' auctions; `ADMIN` moderates. Server-side database transactions and auction-row locking protect bid correctness.

**Out of scope:** anti-sniping in the current MVP, Socket.io/WebSockets, Redis, real transfers, escrow, real KYC, handover, predictive pricing, blockchain and IoT. The description assistant is a simple client-side helper. The exact authorized Saudi Open Banking sandbox operation and access are **not yet verified**; fake approval is prohibited.

**History versus final design:** Stage 1 is preserved unchanged because it documents the original brainstorm and was graded 100/100. Stage 2's revised charter records the later scope refinements. Stage 3 is the final technical baseline; Stage 4 documents implementation status without inventing tests or deployments.

## Team responsibilities

| Member | Areas |
|---|---|
| Abeer Al-Saiari | Database with Tala; backend with Ghadi |
| Ghadi Al-Zahrani | Backend with Abeer; frontend with Aseel |
| Aseel Al-Zahrani | Frontend with Ghadi; QA/integration with Tala |
| Tala Al-Hudaibi | Database with Abeer; QA/integration with Aseel |

## Timeline

Stage 1: Week 1 · Stage 2: Weeks 2–3 · Stage 3: Weeks 4–5 · Stage 4: Weeks 6–10 · Stage 5: Weeks 11–12.

[Source synchronization and technical decision notes](docs/SOURCE_SYNC_AND_STAGE3_REVIEW.md)
