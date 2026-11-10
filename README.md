# Vendor Management

Angular 19 frontend + NestJS backend + MongoDB. Live: https://vendor-management-jade.vercel.app

```
frontend/   Angular app
backend/    NestJS API (Vercel serverless entry: backend/api/index.ts)
docs/       DEPLOYMENT.md, USER-GUIDE.md, PROJECT-OVERVIEW.md
```

## Run locally

Requires Node 20+ and a MongoDB connection string (a free MongoDB Atlas M0 cluster works).

```bash
# 1. API  (http://localhost:3000)
cd backend
npm install
# create backend/.env with the variables below (never commit it)
npm run start:dev

# 2. Frontend  (http://localhost:4200)
cd frontend
npm install
npm start
```

The dev frontend calls `http://localhost:3000` (`frontend/src/environments/environment.ts`).

### Backend environment variables (names only)

| Name | Required | Purpose |
|------|----------|---------|
| `DATABASE_URL` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | token signing |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | yes | admin account seeded on first boot |
| `PORT` | no | defaults to 3000 |
| `GROQ_API_KEY`, `GROQ_MODEL` | no | AI chat |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | no | email |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | no | online payments |
| `DIGILOCKER_CLIENT_ID` | no | verification |

Frontend build variable: `API_URL` (backend base URL, read by `frontend/set-env.js`).

## Deploy free (Vercel + MongoDB Atlas)

Create two Vercel projects from this repo: root directory `backend` (set the backend variables above) and root directory `frontend` (set `API_URL` to the backend's Vercel URL; output `dist/frontend/browser`). Pushes to `main` redeploy both. Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
