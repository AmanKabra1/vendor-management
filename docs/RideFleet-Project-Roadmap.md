# RideFleet — Delivery Rider Management Platform
## Complete Project Roadmap with Phases, Commits & Deployment

---

## Project Overview

A platform connecting store owners, delivery riders, and customers — like
Zepto/Blinkit/Uber but where riders are shared across platforms. Store owners hire
available riders in their area, riders choose which deliveries to accept (Uber one hour,
Zomato the next), and everything is verified, tracked, and mapped.

---

## Tech Stack (100% Free Tier)

| Layer | Technology | Why |
|-------|-----------|-----|
| Backend | NestJS + TypeScript | Already in place, production-ready |
| Frontend | Angular 17+ | Already in place |
| Database | MongoDB Atlas (free 512MB) | Free, flexible schema, great for geo queries |
| Auth | JWT + bcrypt (built-in) | No paid service needed |
| Maps | Leaflet.js + OpenStreetMap | 100% free, no API key needed |
| Real-time | Socket.IO | Free, built into NestJS |
| AI Chatbot | Groq API (free tier) | Fast inference, generous free tier |
| Email | Resend (free 100/day) / EmailJS | No dedicated server needed |
| File Upload | Cloudinary (free 25GB) | Profile + KYC document images |
| SMS (optional) | Twilio (free trial) | OTP verification |
| Frontend Deploy | Vercel (free) | Best for Angular |
| Backend Deploy | Back4App Containers (free) | Container hosting |
| DB Hosting | MongoDB Atlas (free M0) | 512MB |
| CI/CD | GitHub Actions (free) | Auto deploy on push |

> Deployment intentionally avoids Render and other paid-by-default hosts.

---

## Repository Structure (target)

```
ridefleet/
├── .github/workflows/        # deploy-backend.yml, deploy-frontend.yml
├── backend/
│   └── src/
│       ├── auth/             # JWT, guards, strategies
│       ├── users/            # User entity + CRUD
│       ├── riders/           # Rider profiles, availability
│       ├── stores/           # Store owner profiles
│       ├── orders/           # Delivery orders
│       ├── tracking/         # Real-time GPS tracking
│       ├── notifications/    # Email + push
│       ├── chat/             # AI chatbot (Groq)
│       ├── payments/         # Payment tracking
│       ├── reviews/          # Ratings & reviews
│       ├── analytics/        # Dashboard analytics
│       ├── documents/        # KYC document verification
│       └── common/           # Guards, decorators, pipes
├── frontend/
│   └── src/app/
│       ├── core/             # Guards, interceptors, services
│       ├── shared/           # Shared components, pipes
│       ├── auth/             # Login, register, forgot password
│       ├── landing/          # Public landing page
│       ├── super-admin/      # SuperAdmin dashboard
│       ├── admin/            # Store owner dashboard
│       ├── rider/            # Rider dashboard
│       └── customer/         # Customer tracking page
├── docs/                     # API.md, DEPLOYMENT.md, ARCHITECTURE.md
├── docker-compose.yml
└── README.md
```

---

## PHASE 1 — Foundation (Commits 1-8)
**Goal: Auth + user roles + database + basic CRUD**

1. **feat: initialize backend with DB connection** — ConfigModule, DB module, global
   ValidationPipe, CORS, Swagger at `/api/docs`, health check, `.env.example`.
2. **feat: User schema with role-based access** — roles `SUPER_ADMIN, STORE_OWNER, RIDER,
   CUSTOMER`; verified/approved/active flags; address with coordinates; indexes.
3. **feat: JWT auth with role guards** — register/login/profile/forgot-password, bcrypt,
   `JwtStrategy`, `JwtAuthGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`, seed SuperAdmin.
4. **feat: Store schema + owner registration** — categories, GeoJSON coordinates,
   `PENDING/APPROVED/REJECTED/SUSPENDED`, `/stores/nearby` geo query, owner-scoped access.
5. **feat: Rider schema + availability** — vehicle, documents, `currentLocation`,
   availability status, working zones, time slots, platform preferences, `/riders/nearby`.
6. **feat: Angular scaffold + auth pages** — login (role-based redirect), register (tabs),
   AuthService, AuthInterceptor, guards per role.
7. **feat: public landing page** — hero, how-it-works, features, CTA.
8. **feat: seed data + README** — SuperAdmin, sample stores/riders/orders.

## PHASE 2 — Core Features (Commits 9-16)
**Goal: Orders, dashboards, maps, real-time tracking**

9. **feat: Order schema + lifecycle** — `CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT →
   DELIVERED / CANCELLED`, OTP on assignment, timeline array, auto distance/ETA.
10. **feat: SuperAdmin dashboard** — overview stats, pending approvals, user/store/rider
    management, all-orders, charts (Chart.js), settings.
11. **feat: Store Owner dashboard** — create orders, find/hire nearby riders, my orders,
    reports.
12. **feat: Rider dashboard** — available orders (accept/reject), active delivery + map,
    earnings, weekly schedule, profile + KYC upload.
13. **feat: Leaflet maps** — reusable map component, custom markers, route line, radius
    circle, Nominatim geocoding, OSRM routing (all free).
14. **feat: real-time tracking (Socket.IO)** — rider location broadcast, order rooms, live
    ETA, JWT-validated handshake, client TrackingService with reconnect.
15. **feat: public customer tracking page** — link-based, live map, status timeline, ETA.
16. **feat: email notifications (Resend)** — welcome, approvals, order assigned/delivered,
    password reset; queued via event emitter, non-blocking.

## PHASE 3 — Advanced Features (Commits 17-22)
17. **feat: AI chatbot (Groq)** — context-aware widget (knows role, orders, actions),
    `llama-3.3-70b-versatile`, chat history persisted.
18. **feat: reviews & ratings** — store↔rider↔customer, weighted aggregate, moderation.
19. **feat: advanced analytics** — per-role dashboards, CSV export.
20. **feat: edge cases** — rider no-show auto-reassign, cancellation rules, reject-to-pool,
    failed-delivery retries, concurrent-assignment locking, CRON timeouts, surge pricing,
    radius enforcement, duplicate prevention.
21. **feat: KYC document verification** — Cloudinary upload, SuperAdmin verify/reject,
    auto-approve when complete.
22. **feat: push notifications + toasts** — bell with badge, notification center, sound alert.

## PHASE 4 — Polish + Deployment (Commits 23-28)
23. **feat: responsive + PWA** — sidebar → bottom nav, manifest, offline fallback.
24. **feat: universal search/filter/pagination** — server-side, URL query params.
25. **feat: Docker** — multi-stage backend, nginx frontend, compose files.
26. **feat: CI/CD (GitHub Actions)** — test + deploy backend (Back4App) and frontend (Vercel).
27. **feat: security hardening** — throttler, Helmet, sanitization, OTP expiry, lockout.
28. **docs: comprehensive documentation** — README, API docs, deployment guide, demo creds.

---

## Deployment Guide (all free)

### 1. Database — MongoDB Atlas
Create a free M0 cluster, a DB user, whitelist `0.0.0.0/0`, grab the connection string
`mongodb+srv://user:pass@cluster.mongodb.net/ridefleet`.

### 2. Backend — Back4App Containers
Connect the GitHub repo, build path `./backend`, Dockerfile `./backend/Dockerfile`,
set env vars (`DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `GROQ_API_KEY`,
`CLOUDINARY_URL`).

**Backend Dockerfile**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 3. Frontend — Vercel
Import repo, root dir `frontend`, build `ng build --configuration=production`,
output `dist/frontend/browser`, env `API_URL=https://<backend>.back4app.io/api`.

### 4. File Storage — Cloudinary (free 25GB)
### 5. AI Chatbot — Groq (free, llama-3.3-70b-versatile)
### 6. Email — Resend (free 100/day)

| Service | Free Tier | Use |
|---------|-----------|-----|
| Back4App | 250K req/mo | Backend containers |
| Vercel | 100GB bandwidth | Frontend |
| Koyeb / Fly.io | small instance | Backend alternative |
| Supabase / Neon | ~500MB Postgres | DB alternative |

---

## Adapting the existing Vendor Management System

The current repo already has NestJS + Angular with JWT auth and admin/vendor roles. To
evolve toward RideFleet:

1. **Migrate persistence** — SQLite/TypeORM → MongoDB/Mongoose (or Postgres on Neon),
   preserving endpoints and the metrics-calculation logic.
2. **Vendor performance charts** — line (metrics over time), donut (order status), bar
   (response time), comparison vs category average (Chart.js / ng2-charts).
3. **Vendor self-service** — profile/documents, acknowledge & ship POs, invoices,
   messaging, notification bell (scoped by `vendorId` from JWT).
4. **Admin bulk operations** — CSV import/export, bulk email, bulk approve/reject,
   multi-select toolbars with progress + confirm dialogs.
5. **Reporting dashboard** — vendor scorecards, procurement summary, risk report,
   delivery & quality trends, date-range + CSV export.

---

## Git Workflow

**Branches**
```
main → production
develop → integration
  feat/auth, feat/orders, feat/maps, feat/chatbot, feat/deployment
```

**Commit message format**
```
feat: ...      fix: ...      docs: ...
style: ...     refactor: ... test: ...    chore: ...
```

**Phase tags**
```
v0.1.0  Phase 1: Foundation
v0.2.0  Phase 2: Core features
v0.3.0  Phase 3: Advanced features
v1.0.0  Phase 4: Production ready
```
