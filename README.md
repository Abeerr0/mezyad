# Mezyad | مِزياد

<img src="frontend/public/images/mezyad-logo.png" alt="شعار مزياد" width="320">
Mezyad is a web-based auction platform for high-value and rare assets.

## Project stages

| Stage | Guide | Full report |
|---|---|---|
| 1 — Idea Development | [README](Stage_1/README.MD) | [Report](Stage_1/Report.MD) |
| 2 — Project Charter | [README](Stage_2/README.MD) | [Report](Stage_2/Report.MD) |
| 3 — Technical Documentation | [README](Stage_3/README.MD) | [Report](Stage_3/Report.MD) |
| 4 — MVP Development | [README](Stage_4/README.md) | [Report](Stage_4/Report.MD) |

## Platform

Sellers submit asset listings for administrator review. Approved listings may be offered through public or private auctions. Eligible participants complete a bid commitment step before bidding. The server validates bid amounts, eligibility and deadlines, then records the winner or a no-winner outcome.

## Technology

- React frontend
- Node.js / Express REST API
- PostgreSQL database
- Periodic REST polling for auction updates
- Moyasar in test mode for bid commitments


## Team

Abeer Al-Saiari · Ghadi Al-Zahrani · Aseel Al-Zahrani · Tala Al-Hudaibi

## Source code

- [Backend](backend/)
- [Frontend](frontend/)
- [Database](database/)

## Run locally

Requires Node.js 24, npm, and Docker Desktop for the local PostgreSQL database.

### Backend

From the repository root, start PostgreSQL and create the backend environment file (first setup only):

```bash
docker compose up -d db
cp .env.example backend/.env
```

Set `JWT_SECRET` and any required local credentials in `backend/.env`. Do not commit this file.

```bash
cd backend
npm ci
npm run db:setup
npm run dev
```

Backend: `http://localhost:3000`

### Frontend

Open a **second terminal** in the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Frontend: `http://localhost:5173`

For more backend environment details, see [backend setup](backend/README.md).
