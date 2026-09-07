# Kabadiwala Connect — Web Application Roadmap
### Core specs + ready-to-use build briefs for 6 members/AI coding agents

---

## 1. Scope Decision (Web-only build)

Since SIH judges primarily see a **demo on a laptop/projector**, build this as **one web application** (not separate mobile apps) with **3 role-based portals** sharing one backend:

1. **Citizen Portal** — sell scrap, schedule pickup
2. **Kabadiwala Portal** — simplified, large-icon, voice-assist UI for collectors
3. **Admin/Recycler/ULB Dashboard** — analytics, verification, EPR reports

One responsive React app, role-based routing, one backend, one database. This is faster to demo and easier for 6 people to build in parallel than native mobile.

---

## 2. Core Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + Vite + TypeScript + TailwindCSS** | Fast, component-driven, easy parallel work |
| UI components | shadcn/ui + lucide-react icons | Ready-made accessible components, saves time |
| State/data fetching | React Query (TanStack Query) + Zustand | Clean server-state vs UI-state separation |
| Backend | **Node.js + Express + TypeScript** | Familiar, fast to scaffold REST APIs |
| Database | **PostgreSQL** (via Prisma ORM) | Relational data (users, pickups, transactions) fits well |
| Auth | JWT + role-based middleware (citizen / kabadiwala / admin) | Simple, demo-friendly |
| Real-time | Socket.IO (pickup status updates, live map ping) | Optional but impressive live |
| Maps | Leaflet.js + OpenStreetMap (free, no API key hassle) | Avoids Google Maps billing setup during hackathon |
| AI/ML service | Python FastAPI microservice (image classification) called from Node backend | Keeps ML isolated, swappable |
| Payments (mock) | Razorpay test mode / mock wallet ledger | Don't burn time on real payment compliance |
| Hosting (demo) | Vercel (frontend) + Render/Railway (backend) + Supabase/Neon (Postgres) | Free tiers, quick deploy |

---

## 3. Repository Structure

```
kabadiwala-connect/
├── apps/
│   ├── web/                  # React frontend (all 3 portals)
│   │   ├── src/
│   │   │   ├── pages/citizen/
│   │   │   ├── pages/kabadiwala/
│   │   │   ├── pages/admin/
│   │   │   ├── components/
│   │   │   ├── lib/api.ts
│   │   │   └── store/
│   ├── api/                  # Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── controllers/
│   │   │   ├── models/ (prisma schema)
│   │   │   ├── middleware/
│   │   │   └── services/
│   └── ml-service/           # Python FastAPI (scrap classification)
├── packages/
│   └── shared-types/         # Shared TS interfaces (User, Pickup, Transaction)
└── docs/
    └── api-spec.md
```

---

## 4. Core Data Model (Prisma schema — hand this directly to Agent 1)

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  phone         String   @unique
  role          Role     // CITIZEN | KABADIWALA | ADMIN
  password      String
  createdAt     DateTime @default(now())
  kabadiwala    KabadiwalaProfile?
  pickupsSent   Pickup[] @relation("citizenPickups")
  pickupsTaken  Pickup[] @relation("kabadiwalaPickups")
}

enum Role {
  CITIZEN
  KABADIWALA
  ADMIN
}

model KabadiwalaProfile {
  id            String   @id @default(uuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  verified      Boolean  @default(false)
  reputationScore Float  @default(0)
  walletBalance Float    @default(0)
  latitude      Float?
  longitude     Float?
}

model Pickup {
  id            String   @id @default(uuid())
  citizenId     String
  citizen       User     @relation("citizenPickups", fields: [citizenId], references: [id])
  kabadiwalaId  String?
  kabadiwala    User?    @relation("kabadiwalaPickups", fields: [kabadiwalaId], references: [id])
  status        PickupStatus @default(REQUESTED)
  address       String
  latitude      Float
  longitude     Float
  scheduledAt   DateTime
  items         ScrapItem[]
  totalAmount   Float?
  createdAt     DateTime @default(now())
}

enum PickupStatus {
  REQUESTED
  ACCEPTED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model ScrapItem {
  id          String  @id @default(uuid())
  pickupId    String
  pickup      Pickup  @relation(fields: [pickupId], references: [id])
  category    String  // e.g. "Plastic", "Paper", "E-waste", "Metal"
  estWeightKg Float
  ratePerKg   Float
  imageUrl    String?
}

model Transaction {
  id            String   @id @default(uuid())
  pickupId      String
  amount        Float
  kabadiwalaId  String
  status        String   // PENDING | PAID
  createdAt     DateTime @default(now())
}
```

---

## 5. Core API Contract (hand this to Agents 1, 2, 3, 4)

```
Auth
POST   /api/auth/register        { name, phone, password, role }
POST   /api/auth/login           { phone, password } -> { token }

Citizen
POST   /api/pickups              create pickup request
GET    /api/pickups/my           list citizen's pickups
GET    /api/rates                current scrap price list

Kabadiwala
GET    /api/pickups/nearby       ?lat&lng&radius -> list of open requests
POST   /api/pickups/:id/accept
POST   /api/pickups/:id/complete { items: [{category, weightKg}] }
GET    /api/kabadiwala/wallet
GET    /api/kabadiwala/profile

Admin
GET    /api/admin/stats          totals: kg collected, active kabadiwalas, revenue
GET    /api/admin/kabadiwalas    list + verify/reject
POST   /api/admin/kabadiwalas/:id/verify
GET    /api/admin/reports/epr    exportable compliance report

ML
POST   /api/ml/classify          multipart image -> { category, confidence, estRate }
```

---

## 6. Timeline (same SIH 2026 calendar, web-build focused)

| Days | Milestone |
|---|---|
| Day 1 | Repo scaffold, schema finalized, Figma wireframes done, API contract frozen |
| Day 2–3 | Auth + core CRUD (pickups) working end-to-end (even with dummy data) |
| Day 4–5 | Role dashboards functional (citizen request flow, kabadiwala accept flow, admin stats) |
| Day 6 | ML classification integrated, map view live |
| Day 7 | Polish UI, seed realistic demo data, record demo video, build PPT slides from real screenshots |
| Day 8 | Buffer + rehearsal + bug fixes before submission |

---

## 7. Agent Build Briefs — Copy-paste ready for each of the 6 members

> Each brief below is written as a **self-contained prompt** — a member can hand it directly to an AI coding agent (Claude Code, Cursor, etc.) along with the schema/API contract above.

### 🧩 Agent 1 — Backend Core (Lead)
```
Build an Express + TypeScript + Prisma backend for "Kabadiwala Connect".
Use the Prisma schema and API contract provided (auth, pickups, ML proxy routes).
Requirements:
- JWT auth with role middleware (CITIZEN, KABADIWALA, ADMIN)
- Implement all Auth + Pickup CRUD routes from the API contract
- Add input validation (zod) and centralized error handling
- Seed script with 10 sample citizens, 5 kabadiwalas, 20 pickups, sample rates
- Return consistent JSON: { success, data, error }
Deliver: apps/api fully running with `npm run dev`, seeded DB, Postman collection.
```

### 🧩 Agent 2 — Payments, Wallet & Admin APIs
```
Extend the existing Express/Prisma backend (schema + contract attached).
Build:
- Wallet endpoints (balance, transaction history) for kabadiwala
- Mock payment completion flow: on pickup COMPLETED, create a Transaction, update wallet balance
- Admin stats endpoint aggregating: total kg collected, active/verified kabadiwala count, total transaction value, EPR-style category breakdown
- Kabadiwala verification endpoints (list unverified, approve/reject)
Deliver: fully tested routes + sample admin stats response matching this shape:
{ totalKg, activeKabadiwalas, verifiedPercent, totalRevenue, categoryBreakdown: [{category, kg}] }
```

### 🧩 Agent 3 — Citizen Portal (Frontend)
```
Build the Citizen portal in React + TypeScript + TailwindCSS + shadcn/ui, using React Query against the API contract provided.
Pages needed:
1. Login/Register
2. "New Pickup" — address input, map pin (Leaflet), add scrap items with category + est. weight, schedule date/time
3. "My Pickups" — list with status badges (Requested/Accepted/In Progress/Completed), click to view details
4. "Rate list" — current scrap prices by category (from /api/rates)
Use a clean, modern layout (rounded cards, soft shadows, green/eco color palette). Mobile-responsive.
```

### 🧩 Agent 4 — Kabadiwala Portal (Frontend)
```
Build the Kabadiwala portal — designed for LOW-LITERACY users:
- Large icons + minimal text, high color contrast
- "Nearby Requests" — map + list view of open pickups within radius, big "Accept" button
- "My Pickup" — active job screen: navigate, mark items collected (category + weight input via large +/- steppers), "Complete Pickup" button
- "Wallet" — big balance display, simple transaction list
- Add a text-to-speech button next to key instructions (use Web Speech API) to read instructions aloud
Use React + TypeScript + TailwindCSS, consistent with the citizen portal's design system but simplified.
```

### 🧩 Agent 5 — ML Microservice + Admin Dashboard Charts
```
Part A — ML service:
Build a Python FastAPI microservice with one endpoint POST /classify that accepts an image upload and returns
{ category: string, confidence: float, estRate: number }.
For the hackathon demo, use a pretrained lightweight image classifier (e.g. MobileNetV2 fine-tuned or a mocked rule-based classifier if time is short) mapping to categories: Plastic, Paper, Metal, E-waste, Glass, Organic.

Part B — Admin Dashboard (React):
Build charts (recharts) consuming /api/admin/stats:
- KPI cards: total kg collected, active kabadiwalas, verified %, revenue
- Bar chart: kg collected by category
- Line chart: pickups over time (last 30 days)
- Table: pending kabadiwala verifications with Approve/Reject buttons
```

### 🧩 Agent 6 — Design System, Landing Page, Docs & Demo Prep
```
1. Build a public landing page (React) explaining Kabadiwala Connect: hero section, problem statement, how it works (3-portal explainer), impact stats, call-to-action.
2. Create a shared Tailwind design system (colors, typography, spacing) used consistently across citizen/kabadiwala/admin portals — eco-friendly palette (greens/earth tones), accessible contrast.
3. Write README.md with setup instructions for all 3 apps (web, api, ml-service).
4. Prepare a demo data seeding script that tells a believable story (e.g. "Ramesh from Lajpat Nagar requests pickup → Suresh the kabadiwala accepts → completes with 12kg plastic, 5kg paper → admin dashboard updates live").
5. Draft the demo video script (2–3 min) walking through all 3 portals in sequence.
```

---

## 8. Integration & Demo-Day Checklist

- [ ] All 3 portals point to the same backend base URL (env var, not hardcoded)
- [ ] Seed data tells one coherent demo story across all screens
- [ ] Map, ML classification, and wallet updates all tested live (not just in isolation)
- [ ] One person owns the demo laptop/network fallback (offline video backup in case Wi-Fi fails at venue)
- [ ] PPT screenshots taken from the actual running app, not mockups
