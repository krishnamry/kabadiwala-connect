# ♻️ Kabadiwala Connect — Smart Informal Waste & EPR Integration Platform
> **Smart India Hackathon (SIH 2026)** — Transforming India's informal scrap collection ecosystem into a digitized, traceable, and legally compliant circular economy.

### 📱 Android APK Download
[![Download APK](https://img.shields.io/badge/Download%20APK-v1.0.6%20Latest-emerald?style=for-the-badge&logo=android&logoColor=white)](https://github.com/krishnamry/kabadiwala-connect/releases/download/v1.0.6/KabadiwalaConnect.apk)
[![Releases](https://img.shields.io/badge/GitHub-Releases%20(v1.0.6)-blue?style=for-the-badge&logo=github)](https://github.com/krishnamry/kabadiwala-connect/releases)

> 📦 **Direct Download:** [**KabadiwalaConnect.apk (v1.0.6)**](https://github.com/krishnamry/kabadiwala-connect/releases/download/v1.0.6/KabadiwalaConnect.apk) *(10.28 MB)*  
> 📁 **Repository Path:** [`releases/KabadiwalaConnect.apk`](./releases/KabadiwalaConnect.apk) or [`KabadiwalaConnect.apk`](./KabadiwalaConnect.apk)

---

## 🌟 Executive Summary & Problem Solved
Over 80% of India's post-consumer recyclable waste is collected by the informal sector: **over 4 million door-to-door waste collectors (*कबाड़ीवाले*)**. However:
1. **Citizens** lack convenient, transparent doorstep pickup and fair rates.
2. **Kabadiwalas** are marginalized, low-literacy workers vulnerable to volatile middlemen commissions without formal banking.
3. **Municipalities (ULBs) & Brands** face stringent Central Pollution Control Board (CPCB) **Extended Producer Responsibility (EPR)** quotas without verifiable digital audit trails.

**Kabadiwala Connect** bridges this gap with **one unified web application** featuring **3 role-specific portals**:
- **Citizen Portal**: Schedule doorstep pickups, get instant AI image classification of scrap, view live market rates.
- **Kabadiwala Portal**: High-contrast, low-literacy UI with voice narration (Web Speech API in Hindi), large `+`/`-` weight steppers, and instant digital wallet payouts.
- **Admin & ULB Dashboard**: Citywide scrap flow analytics, Kabadiwala KYC verification, and downloadable CPCB-standard EPR audit certificates.

---

## 🏗️ Architecture & Monorepo Structure

```
kabadiwala-connect/
├── apps/
│   ├── web/                  # Responsive React + Vite + TypeScript + TailwindCSS
│   │   ├── src/
│   │   │   ├── components/   # LeafletMap, VoiceAssistButton, Navbar
│   │   │   ├── pages/citizen/    # Schedule pickup, AI photo scan, rate card
│   │   │   ├── pages/kabadiwala/ # Voice-assist, nearby jobs, steppers, wallet
│   │   │   ├── pages/admin/      # Charts, KPI cards, KYC approval, EPR export
│   │   │   ├── pages/auth/       # 1-Click Judge/Demo Switcher & Login
│   │   │   └── lib/api.ts        # Typed API client
│   ├── api/                  # Node.js + Express + TypeScript + Prisma ORM
│   │   ├── prisma/           # SQLite schema & realistic storyline seed
│   │   └── src/
│   │       ├── routes/       # Auth, Pickups, Kabadiwala, Admin, ML Proxy
│   │       └── middleware/   # JWT auth, role validation, centralized errors
│   └── ml-service/           # Python FastAPI microservice (Scrap Classifier)
│       ├── main.py           # Image heuristic & vision classification
│       └── requirements.txt  # FastAPI, Pillow, Uvicorn
├── packages/
│   └── shared-types/         # Shared TypeScript models (User, Pickup, EPR)
└── docs/
    └── api-spec.md           # Full REST API specification
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js**: v18 or higher (Node v22 recommended)
- **Python**: 3.10+ (for ML microservice)

### 2. Backend (Express + Prisma)
```bash
cd apps/api
npm install
npm run prisma:push   # Creates SQLite dev.db
npm run seed          # Seeds 10 citizens, 5 kabadiwalas, 20 pickups, scrap rates
npm run dev           # Runs on http://localhost:5000
```

### 3. Frontend (React + Vite)
```bash
cd apps/web
npm install
npm run dev           # Runs on http://localhost:3000
```

### 4. AI Scrap Classifier Microservice (Python FastAPI)
```bash
cd apps/ml-service
python3 -m venv venv
./venv/bin/pip install -r requirements.txt
./venv/bin/python3 main.py  # Runs on http://localhost:8000
```

---

## 🎭 3-Minute SIH Demo Storyline (Ramesh ➔ Suresh ➔ NDMC)

Use the **1-Click Demo Switcher** in the top navigation bar or login page:

1. **Step 1: Citizen Schedules Pickup (Ramesh Sharma)**
   - Click **Ramesh (Citizen)** in navbar.
   - Go to **New Request**.
   - Click **Scan Scrap Photo** and pick any scrap image ➔ AI automatically identifies category and estimated price!
   - Click on the Leaflet map to set your doorstep pin and hit **Confirm & Schedule Pickup**.

2. **Step 2: Kabadiwala Collects & Weighs (Suresh Kumar)**
   - Switch to **Suresh (Collector)** in navbar.
   - Click the **Voice Assist (बोलकर सुनें)** button to hear instructions in Hindi.
   - See open nearby requests on the live Delhi map.
   - Open **चालू काम (Active Job)**: adjust digital scale weights with the large `+` / `-` steppers (e.g. 12kg Plastic, 8kg Paper).
   - Click **काम पूरा करें व भुगतान प्राप्त करें** ➔ Instantly transfers ₹417 into Suresh's digital wallet!

3. **Step 3: Municipal ULB / EPR Audit (NDMC Admin)**
   - Switch to **NDMC (Admin/EPR)** in navbar.
   - Observe live aggregated KPIs: total kg diverted, CO₂ abated, trees saved.
   - Navigate to **Kabadiwala KYC Verifications** to approve/verify informal collectors.
   - Click **EPR Compliance Center** and hit **Export EPR Report** to generate the official CPCB audit certificate!

---

## 📊 Pre-Seeded Demo Credentials

| Role | Name | Phone | Password | Key Characteristic |
|---|---|---|---|---|
| **Citizen** | Ramesh Sharma | `9811100001` | `password123` | Lajpat Nagar resident with scheduled pickups |
| **Kabadiwala** | Suresh Kumar | `9876543210` | `password123` | Verified collector with E-Rickshaw & wallet |
| **Admin/ULB** | Municipal NDMC | `9999900000` | `password123` | Regulatory authority with full analytics & EPR exports |
| **Kabadiwala** | Raju Rastogi | `9876543211` | `password123` | Pedal rickshaw collector |
| **Kabadiwala** | Mohammed Irfan | `9876543212` | `password123` | Unverified collector (demonstrates KYC approval workflow) |

---

## 🌿 Environmental Impact Standard (CPCB Formulae)
- **CO₂ Abatement**: 1.82 kg CO₂ saved per kg recycled dry waste.
- **Trees Preserved**: 1 metric ton of recycled paper saves 17 mature trees.
- **Landfill Diversion**: 100% mass diversion from Ghazipur / Bhalswa landfill dumps.
- **Water Conservation**: 26 liters saved per kg recycled paper.
