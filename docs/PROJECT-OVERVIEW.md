# RideFleet — How the Website Works (End to End)

A plain-English guide to everything this website does and how to use it. No code —
just what each person sees and the steps they follow.

---

## 1. What is RideFleet?

RideFleet is a **local-commerce platform for Indian towns, kasbas and small cities** —
every kind of shop in the bazaar, a shared pool of delivery riders, the udhaar credit
book that those shops actually run on, and an emergency phone directory that works
without an account.

- **Customers** order from any nearby shop — kirana, medical, water can, gas cylinder,
  sabzi, hardware — pay cash, UPI or on their **khata**, and set repeat orders.
- **Shop owners** (any of ~40 shop types) take orders, publish a rate list, keep the
  udhaar khata, work a refill round and hire a nearby rider.
- **Shop staff** have their own login for the counter.
- **Riders** are shared across shops, on their own schedule.
- **Wholesalers & distributors** supply the shops (the B2B chain behind the shelf).
- **Field sales agents** sign shops up town by town, working a visit pipeline.
- **Service providers** (electrician, plumber, tanker, tempo) list themselves too.
- A **Super Admin** approves who operates and curates the emergency directory.

Think: *the town's bazaar, its credit book and its emergency numbers, on a cheap phone
that may only have 2G.*

---

## 2. The people (roles) and what each can do

| Role | What they do |
|------|--------------|
| **Super Admin** | Approves shops, riders & suppliers; curates local emergency numbers; sees all orders/stats. |
| **Shop Owner** | Lists any shop type, takes orders, publishes rates, keeps the khata, runs refills, hires riders. |
| **Shop Staff** | Own login for the counter — takes orders and writes khata, but cannot change shop settings. |
| **Rider** | Sets availability + location, accepts orders, delivers with an OTP, sees nearby help requests. |
| **Customer** | Orders from any shop (list, photo or rate board), tracks the rider, sees their own khata. |
| **Wholesaler** | Lists bulk products; fulfils restock orders from shops/distributors. |
| **Distributor** | Middleman — buys from wholesalers, sells to kiranas (both buyer and seller). |
| **Field Sales Agent** | Works a shop-by-shop beat: logs visits, sets follow-ups, earns per shop that goes live. |
| **Service Provider** | Lists a service (electrician, plumber, tanker, tempo, mechanic) instead of a shelf. |

Everyone signs up at **Register** and picks their role from an illustrated card. Shops,
riders, suppliers, sales agents and service providers go **live only after the Super
Admin approves them**. Shop staff are gated differently: the owner attaches them to the
shop by email or mobile.

---

## 2a. Shop types

Categories are grouped by what a person comes looking for, and each carries a Hindi
label and an icon:

- **Food & daily needs** — kirana, sabzi, fruit, dairy, bakery, sweets, meat & fish,
  dhaba, tiffin
- **Medical & emergency** — chemist, clinic, path lab, ambulance, veterinary, fire safety
- **Home & utility** — water can & tanker, LPG gas, hardware, electrical, plumbing,
  cement & building material, furniture, utensils, fuel
- **Everyday shopping** — stationery, xerox & online form work, cosmetics, clothes,
  footwear, mobile & recharge, electronics, pooja samagri, toys
- **Farm & village trade** — seeds & fertiliser, cattle feed, poultry, aata chakki
- **Services** — salon, tailor, laundry, repair & mechanic, courier, tempo & transport

---

## 2b. What makes it work in a small town

These are the features aimed squarely at a kasba rather than a metro:

| Feature | Why it matters here |
|---------|--------------------|
| **Udhaar khata** | Goods now, payment on salary day, is how most kirana business is settled. Shopkeeper and customer see the same balance, which ends payday disputes. A WhatsApp reminder is one tap. |
| **Emergency directory** | 112, 108, 101, 100, 1906, 1912, 1091, 1098, 1077, 1962 are **built into the app as constants**, so the screen renders instantly with no login, no map load and no network. Local ambulance / hospital / blood bank / tanker numbers are added and verified by the admin. |
| **Repeat refills** | Water can, gas cylinder, milk, cattle feed — the shop gets a dated round each morning (overdue first), and nobody runs out of drinking water because they forgot to call. |
| **Hindi ↔ English** | One tap switches the whole app; it also follows the device language on the first visit. Shop names, item names and rate lists all carry a local-script field. |
| **Data saver mode** | Turns maps, photos and animation off entirely — Leaflet is never even initialised, so no tiles are downloaded. Plus a bigger-text mode. |
| **Landmark addresses** | Street names often don't exist and a GPS pin lands on the wrong lane, so landmark + mohalla are first-class fields and ride along in what the rider reads. |
| **Tap to call / WhatsApp** | The first thing someone needs is a working phone number, not a checkout. Every shop row has a call button and a pre-filled WhatsApp order message. |
| **Public shop directory** | Search by pincode, mohalla, shop type or item — logged out. The account is only needed to place a *tracked* order. |
| **Shutter switch** | One toggle pauses today's orders when the shop closes, without going offline. |
| **Rate list, not SKUs** | Small shops keep no inventory system, so they publish a simple rate board customers can tap items off. Loose Indian units (pav, adha kilo, bora, can, cylinder) included. |
| **Phone orders** | The counter can type in an order that arrived by phone call, which is how most of it still arrives — and that's what makes tracking and khata work at all. |
| **UPI deep links** | A khata balance can be cleared straight from the customer's UPI app. |

---

## 3. The big picture

```
Customer ─▶ Kirana store ─▶ hires a nearby Rider ─▶ delivers to Customer (live-tracked, OTP)
                ▲
                └── restocks from ── Distributor ─▶ Wholesaler   (the supply chain)

Super Admin approves stores & riders and oversees the whole platform.
```

---

## 4. Step-by-step journeys

### A) Customer orders groceries from a kirana
1. Register/login as **Customer** → you land on **Order Groceries**.
2. Set your **delivery location** — type your address and press **Search**, or tap **GPS**
   (you never need to know latitude/longitude; it's filled for you).
3. Press **Find nearby kirana stores** → approved shops appear on a map and as a list.
4. Pick a store → write your **shopping list** (one item per line) and/or **upload a photo**
   of a handwritten list. Optionally add itemised lines (helps the bill).
5. **Place order (COD)**. The store is notified.
6. Track it: **Track** opens a live page showing the rider moving on the map + a status
   timeline. **Pay online** (if enabled) or pay cash. **Invoice** shows the itemised bill
   (items + delivery/rider fee + total).

### B) Store owner fulfils an order
1. Register/login as **Store Owner** → **My Store & Orders**.
2. Create your **store** (name, category, location via address/GPS). Wait for **admin approval**.
3. Verify identity in the **KYC** box (Aadhaar) to build trust.
4. When a customer order arrives, open it → **Find rider** → a map shows **available riders
   nearby** → **Assign** the closest one. A **4-digit OTP** is generated.
5. Watch progress; share the **customer tracking link** if needed.

### C) Rider delivers
1. Register/login as **Rider** → **Rider Hub** → create your rider profile (vehicle).
2. Wait for **admin approval**; set your **location** (address/GPS) and go **AVAILABLE**.
3. When assigned an order: **Accept → Picked up → 📡 Go Live** (shares your GPS so the store
   and customer see you move) → **Deliver** by entering the customer's **OTP**.
4. Your delivery count and earnings update automatically.

### D) Super Admin runs the platform
1. Login as **admin** → **Admin Console** (one place, tabbed).
2. **Overview**: pending stores & riders → **Approve / Reject**.
3. **Stores / Riders / Orders / Vendors** tabs: see and manage everything platform-wide.

### E) Supply chain (B2B restock)
1. **Wholesaler/Distributor** logs in → **Supply Chain** → adds products to their **catalog**.
2. A **kirana** (or distributor) opens **Supply Chain** → picks a supplier → adds items to a
   cart → **places a restock order**.
3. The supplier moves it **Accept → Dispatch**; the buyer confirms **Received**.

---

## 5. Features built into the site

- **Accounts & roles** — secure login (JWT), 9 roles, password show/hide.
- **Public pages (no login)** — `/shops` shop directory and `/emergency` helpline
  directory, plus the existing `/track/:id` link.
- **Khata (udhaar) ledger** — credit and payment lines per customer (keyed by mobile,
  not by an account), running balances, per-shop and per-customer views.
- **Refill subscriptions** — daily / alternate-day / weekly / fortnightly / monthly /
  on-demand, with a "due today" round for the shop and a snooze for the customer.
- **Emergency & SOS** — national helplines, verified local numbers, safety steps in both
  languages, and an in-app help request that reaches nearby riders and shops.
- **Field sales pipeline** — leads, visit log, follow-up dates, onboarding credit.
- **Approvals & KYC** — admin approves stores/riders; Aadhaar verification (checksum-validated).
- **Maps** — nearby stores/riders and live delivery on free OpenStreetMap.
- **Live tracking** — rider location streams every few seconds (WebSockets); public
  no-login tracking link for customers.
- **Orders** — full lifecycle with a 4-digit **OTP** handoff, status timeline, and **invoices**.
- **Fair pricing** — delivery/rider fee = ₹20 base + ₹8/km (auto from distance).
- **Payments** — online via Razorpay (UPI/cards) with cash-on-delivery fallback.
- **B2B supply chain** — wholesaler/distributor catalogs + restock orders.
- **Notifications** — email on register/approval/assignment (Gmail).
- **AI assistant** — a Groq-powered help chat on every signed-in page.
- **Landing page** — a public marketing homepage with an animated map.

---

## 6. How to run it

- **Local:** start `backend` (`npm run start:dev`) and `frontend` (`npm start`) →
  open http://localhost:4200. Admin login: `admin@vendor.com` / `admin123`.
- **Live (free hosting):** see **[DEPLOYMENT.md](DEPLOYMENT.md)** — MongoDB Atlas +
  Back4App (backend) + Vercel (frontend).

Optional integrations are off by default and the app still runs without them; add keys to
turn each on: `GMAIL_*` (email), `GROQ_API_KEY` (AI), `RAZORPAY_*` (payments).

---

## 7. A note on emails

Emails are sent through **Gmail SMTP** using your Google **App Password**, so they go **from
your own Gmail address** (`amankabra.it24@gmail.com`). Recipients see the sender as
**“RideFleet &lt;amankabra.it24@gmail.com&gt;”** — the name *RideFleet*, but the real address
is your Gmail. To send from a branded address like `noreply@ridefleet.com` you'd need to own
that domain and use a provider (e.g. Resend) — not required for the app to work.
