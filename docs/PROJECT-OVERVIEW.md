# RideFleet — How the Website Works (End to End)

A plain-English guide to everything this website does and how to use it. No code —
just what each person sees and the steps they follow.

---

## 1. What is RideFleet?

RideFleet is a **shared delivery + local-commerce platform** for Indian towns and
cities. It connects four kinds of people through one pool of delivery riders:

- **Customers** order daily groceries from a nearby **kirana** (local) store.
- **Store owners** (kiranas) receive those orders and hire a nearby rider to deliver.
- **Riders** are shared — they accept deliveries from any store, on their own schedule.
- **Wholesalers & distributors** supply the stores (the B2B "supply chain" behind the shop).
- A **Super Admin** runs the platform and approves who can operate.

Think: *Blinkit/Zepto meets a shared Uber-style rider pool, plus the wholesale supply
chain that stocks the shops.*

---

## 2. The people (roles) and what each can do

| Role | What they do |
|------|--------------|
| **Super Admin** | Approves stores & riders, sees all orders/stats, manages everything. |
| **Store Owner** (kirana) | Lists their shop, takes customer orders, hires riders, restocks from suppliers. |
| **Rider** | Sets availability + location, accepts orders, delivers with an OTP, tracks earnings. |
| **Customer** | Sends a grocery list (typed or photo) to a kirana, tracks the rider live, pays. |
| **Wholesaler** | Lists bulk products; fulfils restock orders from stores/distributors. |
| **Distributor** | Middleman — buys from wholesalers, sells to kiranas (both buyer and seller). |

Everyone signs up at **Register** and picks their role. Stores and riders go **live only
after the Super Admin approves them**.

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

- **Accounts & roles** — secure login (JWT), 6 roles, password show/hide.
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
