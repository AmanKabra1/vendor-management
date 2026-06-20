# Deployment & Access Guide

This stack runs on **100% free tiers**: **MongoDB Atlas** (database) + **Back4App Containers** (backend) + **Vercel** (frontend). No Render. Total cost: ₹0.

```
Browser ──▶ Vercel (Angular)  ──▶  Back4App (NestJS API + Socket.IO)  ──▶  MongoDB Atlas
```

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
1. **Point the app at your backend:** edit `frontend/src/environments/environment.prod.ts`:
   ```ts
   export const environment = { production: true, apiUrl: 'https://your-app.back4app.io' };
   ```
   Commit & push.
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
