# Mezyad | مِزياد

Stage 4 implementation workspace for the high-value asset auction MVP.

**Status:** Development scaffold and PostgreSQL schema; not a completed production application. See [Stage 4](Stage_4/README.md) for progress, blockers and evidence. [Stage 3 technical specification](Stage_3/Report.MD) remains unchanged.

## Technology
React frontend, Node.js/Express API, PostgreSQL database. REST polling for auction updates. PostgreSQL row locks for bid consistency. No MySQL, Redis, or Socket.io.

## Local setup
1. Install Node.js 20+ and PostgreSQL 15+.
2. Create a PostgreSQL database called `mezyad`.
3. Copy `.env.example` to `backend/.env` and set `DATABASE_URL` and `SESSION_SECRET`.
4. Run `psql "$DATABASE_URL" -f database/migrations/001_schema.sql` then `psql "$DATABASE_URL" -f database/seeds/001_categories.sql`.
5. Run `npm install` in `backend/`, then `npm run dev`.
6. Run `npm install` in `frontend/`, then `npm run dev`.

**Security:** Do not commit .env, bank credentials, or real user data. Sandbox banking is not verified or connected. Do not use real money.

## Repository
- [Stage 3](Stage_3/Report.MD): locked technical specification.
- [Stage 4](Stage_4/README.md): sprint plan, tracking, QA and evidence.
- [Database migration](database/migrations/001_schema.sql): PostgreSQL schema.
- [Backend](backend/): Express API implementation.
- [Frontend](frontend/): React client.

## Team
Abeer + Tala: database. Abeer + Ghadi: backend. Aseel + Ghadi: frontend. Tala + Aseel: QA and integration review.
