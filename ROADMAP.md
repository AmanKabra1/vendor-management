# Project Roadmap

This repository starts as a **Vendor Management System** (NestJS + Angular) and is
evolving toward **RideFleet** — a shared delivery-rider platform (think Zepto / Blinkit /
Uber, but riders are shared across stores and platforms).

The whole stack is built to run on **100% free tiers**.

---

## ✅ Phase 0 — Vendor Management Foundation (DONE)

The current, working application. Committed in phases in this repo.

**Backend (NestJS + SQLite + TypeORM)**
- Vendor, Purchase Order and Historical Performance modules (full CRUD).
- Automatic performance-metrics engine (on-time delivery, quality, response time,
  fulfillment) with historical snapshots.
- **JWT authentication** + **bcrypt** password hashing.
- **Role-based access control**: `admin` vs `vendor`, with `@Roles()` / `RolesGuard`.
- Per-vendor data scoping (a vendor can only read/touch its own data).
- CORS, global validation, Swagger docs at `/api`, auto-seeded admin account.

**Frontend (Angular 19 + Bootstrap)**
- Login / Register, JWT interceptor, route + role guards.
- **Admin portal**: dashboard, vendor CRUD, purchase-order management, vendor
  detail with a performance history chart.
- **Vendor portal**: my orders (acknowledge), my performance.

**Demo admin:** `admin@vendor.com` / `admin123`

---

## 🧭 Tech Stack (all free tier)

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript |
| Frontend | Angular + Bootstrap |
| Database | SQLite today → **MongoDB Atlas** (free 512MB) for RideFleet |
| Auth | JWT + bcrypt |
| Maps | Leaflet.js + OpenStreetMap (no key) |
| Real-time | Socket.IO |
| AI chatbot | Groq API (free tier, llama-3.3-70b) |
| Email | Resend (free 100/day) |
| File upload | Cloudinary (free 25GB) |
| Frontend deploy | Vercel |
| Backend deploy | Back4App containers |
| CI/CD | GitHub Actions |

> Deployment explicitly avoids Render; uses Vercel + Back4App + MongoDB Atlas.

---

## 🚀 RideFleet Evolution — Phased Plan

### Phase 1 — Foundation
- [ ] Migrate persistence to MongoDB Atlas (Mongoose) **or** keep TypeORM and add Postgres (Neon/Supabase free).
- [ ] Expand roles: `SUPER_ADMIN`, `STORE_OWNER` (admin), `RIDER`, `CUSTOMER`.
- [ ] Approval workflow: SuperAdmin approves stores and riders; document (KYC) verification.
- [ ] Store/Outlet entity + owner registration.
- [ ] Rider entity: vehicle, documents, availability (`AVAILABLE / ON_DELIVERY / OFFLINE`),
      working zones, time-slot scheduling, platform preferences (Uber / Zomato / Direct…).
- [ ] Public landing page + seed data.

### Phase 2 — Core Features
- [ ] Order / Delivery lifecycle: `CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED / CANCELLED`.
- [ ] **SuperAdmin dashboard** — platform analytics, approvals, user/store/rider management.
- [ ] **Store Owner dashboard** — create orders, browse & hire nearby available riders.
- [ ] **Rider dashboard** — accept orders, update status, earnings, schedule, KYC upload.
- [ ] **Maps (Leaflet + OSM)** — nearby riders, route plotting, live delivery tracking.
- [ ] **Real-time tracking (Socket.IO)** — rider broadcasts location; store + customer see live.
- [ ] **Public customer tracking page** (no login, link-based).
- [ ] **Email notifications** (Resend) — welcome, approvals, order events.

### Phase 3 — Advanced Features
- [ ] **AI chatbot (Groq)** — context-aware support widget on every dashboard.
- [ ] Reviews & ratings (store↔rider↔customer).
- [ ] Advanced analytics + CSV export.
- [ ] **Edge cases** — rider no-show auto-reassign, cancellation rules, race-condition-safe
      assignment, retry on failed delivery, CRON timeouts, surge pricing, radius enforcement.
- [ ] KYC document verification (Cloudinary).
- [ ] In-app notifications + toast system.

### Phase 4 — Polish & Deployment
- [ ] Mobile responsive + PWA.
- [ ] Universal search / filter / pagination.
- [ ] Docker for both services.
- [ ] **CI/CD** — GitHub Actions auto-deploy (backend → Back4App, frontend → Vercel).
- [ ] Security hardening — rate limiting, Helmet, OTP expiry, account lockout.
- [ ] Final docs + screenshots.

---

## 🌳 Git Workflow

```
main                 → production
└── develop          → integration
    ├── feat/auth
    ├── feat/orders
    ├── feat/maps
    ├── feat/chatbot
    └── feat/deployment
```

**Phase tags**
```
v0.1.0  Phase 1: Foundation
v0.2.0  Phase 2: Core features
v0.3.0  Phase 3: Advanced features
v1.0.0  Phase 4: Production ready
```

See [`docs/RideFleet-Project-Roadmap.md`](docs/RideFleet-Project-Roadmap.md) for the full
commit-by-commit plan and ready-to-use build prompts.
