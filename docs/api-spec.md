# Kabadiwala Connect — API Specification & Demo Architecture

## 1. Overview
Kabadiwala Connect is an integrated platform connecting households (Citizens), informal scrap collectors (Kabadiwalas), and Municipal Urban Local Bodies (ULBs) for fair scrap trade, digitized collection, and Extended Producer Responsibility (EPR) tracking.

Base URL: `http://localhost:5000/api`

---

## 2. Authentication Endpoints

### `POST /api/auth/register`
Register a new Citizen, Kabadiwala, or Admin user.
```json
{
  "name": "Ramesh Sharma",
  "phone": "9811100001",
  "password": "password123",
  "role": "CITIZEN"
}
```

### `POST /api/auth/login`
Authenticate user with phone and password.
```json
{
  "phone": "9811100001",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "c-1234",
      "name": "Ramesh Sharma",
      "phone": "9811100001",
      "role": "CITIZEN"
    }
  }
}
```

### `GET /api/auth/demo-users`
Helper endpoint to inspect pre-seeded demo personas for 1-click evaluation.

---

## 3. Scrap Rates & Pricing

### `GET /api/rates`
Returns current market price list by scrap category.
```json
{
  "success": true,
  "data": [
    { "category": "E-waste", "ratePerKg": 55.0, "unit": "kg" },
    { "category": "Metal", "ratePerKg": 36.0, "unit": "kg" },
    { "category": "Plastic", "ratePerKg": 18.0, "unit": "kg" },
    { "category": "Paper", "ratePerKg": 14.0, "unit": "kg" },
    { "category": "Glass", "ratePerKg": 5.0, "unit": "kg" },
    { "category": "Organic", "ratePerKg": 3.0, "unit": "kg" }
  ]
}
```

---

## 4. Pickup Management Endpoints

### `POST /api/pickups`
Citizen schedules a new scrap pickup.
```json
{
  "address": "Block D, Flat 402, Lajpat Nagar II, New Delhi",
  "latitude": 28.5700,
  "longitude": 77.2400,
  "scheduledAt": "2026-09-08T10:00:00.000Z",
  "notes": "Doorbell #402. Scrap bagged.",
  "items": [
    { "category": "Plastic", "estWeightKg": 12.0, "ratePerKg": 18.0 },
    { "category": "Paper", "estWeightKg": 8.0, "ratePerKg": 14.0 }
  ]
}
```

### `GET /api/pickups/my`
List pickups belonging to logged-in user (Citizen's requests or Kabadiwala's accepted jobs).

### `GET /api/pickups/nearby?lat=28.5685&lng=77.2412&radius=15`
Returns unassigned `REQUESTED` pickups within distance radius for collectors.

### `POST /api/pickups/:id/accept`
Kabadiwala accepts pickup request. Status changes to `ACCEPTED`.

### `POST /api/pickups/:id/in-progress`
Kabadiwala arrives at location. Status changes to `IN_PROGRESS`.

### `POST /api/pickups/:id/complete`
Collector enters verified scale weights. Generates `Transaction` and credits wallet.
```json
{
  "items": [
    { "category": "Plastic", "actualWeightKg": 12.5 },
    { "category": "Paper", "actualWeightKg": 8.0 }
  ]
}
```

---

## 5. Kabadiwala Wallet & Profile

### `GET /api/kabadiwala/wallet`
Returns wallet balance, total lifetime earnings, and transaction history.

### `GET /api/kabadiwala/profile`
Returns collector KYC verification status, vehicle type, rating, and completed job count.

---

## 6. Admin & EPR Endpoints

### `GET /api/admin/stats`
Aggregated metrics:
```json
{
  "success": true,
  "data": {
    "totalKg": 384.5,
    "activeKabadiwalas": 5,
    "verifiedPercent": 60,
    "totalRevenue": 8460,
    "categoryBreakdown": [
      { "category": "Paper", "kg": 145.0, "revenue": 2030 },
      { "category": "Plastic", "kg": 112.5, "revenue": 2016 }
    ],
    "environmentalImpact": {
      "co2SavedKg": 698.5,
      "treesSaved": 3.8,
      "waterSavedLiters": 8420,
      "landfillDivertedKg": 384.5
    }
  }
}
```

### `GET /api/admin/kabadiwalas`
Returns all collectors for KYC verification.

### `POST /api/admin/kabadiwalas/:id/verify`
Approve or reject collector verification (`{ "verified": true }`).

### `GET /api/admin/reports/epr`
Generates CPCB-compliant Extended Producer Responsibility audit certificate.

---

## 7. AI Scrap Classifier Microservice

### `POST /api/ml/classify` (or direct to FastAPI `http://localhost:8000/classify`)
Multipart form-data with `image` file:
```json
{
  "success": true,
  "data": {
    "category": "Plastic",
    "confidence": 0.95,
    "estRate": 18.0,
    "advice": "Rinse containers and remove caps for higher scrap value.",
    "filename": "plastic_bottles.jpg",
    "dimensions": "640x480"
  }
}
```
