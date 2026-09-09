# Deployment & Access Guide

This stack runs on **100% free tiers**: **MongoDB Atlas** (database) + **Vercel**
(both the NestJS API and the Angular app). Total cost: ₹0.

```
Browser ──▶ Vercel (Angular)  ──▶  Vercel serverless (NestJS API)  ──▶  MongoDB Atlas
```

## Current live deployment

| Piece | Vercel project | URL |
|-------|----------------|-----|
| Frontend | `vendor-management` | https://vendor-management-jade.vercel.app |
| Backend API | `vendor-management-x1v1` | https://vendor-management-x1v1.vercel.app |

Both are connected to this GitHub repo, so **a push to `main` deploys both** —
there is no manual deploy step. `.github/workflows/ci.yml` builds both apps on
the same push, so a red CI run means the deploy is broken too.

Quick check after a deploy:

```bash
curl https://vendor-management-x1v1.vercel.app/health
curl https://vendor-management-x1v1.vercel.app/public/emergency
```

> The frontend's API URL comes from the `API_URL` env var on its Vercel project
> (see `frontend/set-env.js`), **not** from source. Section 3 below explains it.

> **Note:** section 2 documents Back4App, which is how the backend was first
> hosted. That container is gone and its `*.b4a.run` URL now 404s; the backend
> runs on Vercel serverless via `backend/api/index.ts` + `backend/vercel.json`.
> Back4App (or Koyeb/Fly/Railway with `backend/Dockerfile`) is still a valid
> alternative if you want a long-running process instead of lambdas —
> Socket.IO, for instance, needs one.

---

## 0. Prerequisites
- Code pushed to GitHub (already done: `AmanKabra1/vendor-management`).
- Free accounts: cloud.mongodb.com, back4app.com, vercel.com.

---

## 1. Database — MongoDB Atlas (free M0)
1. cloud.mongodb.com → **Build a Database** → **M0 (free)**.
2. **Database Access** → add a user (e.g. `vmuser` / a password).
3. **Network Access** → **Allow access from anywhere** (`0.0.0.0/0`).
4. **Connect → Drivers** → copy the string:
   `mongodb+srv://vmuser:<pass>@cluster0.xxxx.mongodb.net/vendor_management?retryWrites=true&w=majority`

---

## 2. Backend — Back4App Containers (free)
1. back4app.com → **Containers** → **Deploy from GitHub** → pick this repo.
2. **Root directory:** `backend`  ·  **Dockerfile:** `backend/Dockerfile` (auto-detected).
3. **Environment variables:**
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Atlas string from step 1 |
   | `JWT_SECRET` | a long random string |
   | `ADMIN_EMAIL` | `admin@vendor.com` |
   | `ADMIN_PASSWORD` | a strong password |
   | `GROQ_API_KEY` | *(optional)* AI chat |
   | `GMAIL_USER` / `GMAIL_APP_PASSWORD` | *(optional)* email |
   | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | *(optional)* payments |
4. Deploy → you get a URL like **`https://your-app.back4app.io`**.
5. Check it: open `https://your-app.back4app.io/api` (Swagger). The admin is auto-seeded on first boot.

> The app reads `process.env.PORT` (Back4App sets it) and binds `0.0.0.0`, so no port config needed. CORS already allows any origin.

---

## 3. Frontend — Vercel (free)
1. **Point the app at your backend** with the `API_URL` env var on the Vercel
   project (Settings → Environment Variables), e.g.
   `https://vendor-management-x1v1.vercel.app`. At build time
   `frontend/set-env.js` writes that into `environment.prod.ts`, so the URL
   lives in config rather than in source — don't hand-edit that file, it is
   overwritten on every build.
2. vercel.com → **Add New → Project** → import this repo.
3. **Root directory:** `frontend`  ·  Framework: **Angular**.
4. **Build command:** `npm run build`  ·  **Output directory:** `dist/frontend/browser`.
5. Deploy → you get **`https://your-app.vercel.app`**.

That URL is your live site — the landing page, login, all dashboards, maps, tracking and the public `/track/:id` link.

---

## 4. First access
- Visit **`https://your-app.vercel.app`** → marketing landing.
- **Admin:** log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → `/super` console (approve stores & riders).
- **Everyone else:** Register → Store / Rider / Customer / Wholesaler / Distributor.
- Demo end-to-end: register a store + rider → approve both as admin → store creates an order → assign nearby rider → rider Go Live → customer tracks → deliver with OTP → pay online (if Razorpay keys set).

---

## Local production preview (optional, Docker)
```bash
# set environment.prod.ts apiUrl to http://localhost:3000 first
docker compose up --build
# frontend → http://localhost:8080 , API → http://localhost:3000
```

## CI
`.github/workflows/ci.yml` builds both apps on every push/PR to `main`.

## Alternative free hosts
- Backend: **Koyeb**, **Fly.io**, **Railway** (all take the same `backend/Dockerfile`).
- Frontend: **Netlify**, **Cloudflare Pages** (output dir `dist/frontend/browser`).
