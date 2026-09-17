# Dhatu (धातु) — Smartphone UI Design Gallery
### Enterprise-Grade Mobile Interface Concepts for Kabadiwala Connect
**Supported Viewports:** 360px – 480px (Android APK & Mobile Web)  
**Design Standard:** Industrial Precision (Apple / Stripe / Linear / Uber Freight)  

This directory contains the visual mockups and architectural design patterns for the smartphone redesign of **Kabadiwala Connect (Dhatu)**.

---

## Gallery Overview

| Screen | File | Description | Core Features Preserved |
|---|---|---|---|
| **1. Collector Feed & Lots** | [`01_collector_dashboard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg) | High-contrast main screen with 4-tab bottom bar, audio dock & FAB | Lot inventory, tabular pricing, live bids, trilingual TTS dock, sync pill |
| **2. Spoken Mandi Price Board** | [`02_spoken_mandi_price_board.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg) | Robinhood/Stripe-style market rate board with 7-day sparklines | Live scrap index, weekly deltas (+₹15), one-tap spoken audio (सुनें) |
| **3. Citizen 3-Step Booking Wizard** | [`03_citizen_3step_booking_wizard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg) | Consumer-grade e-waste pickup flow (Apple/Uber aesthetic) | Camera ML snapshot, weight steppers, indicative payout, CSR tree donation |
| **4. "More Tools" Bottom Sheet** | [`04_more_tools_bottom_sheet.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg) | Swipeable drawer housing all secondary operational tools | Dual-Tier KYC (FEAT-10), Recyclers (FEAT-08), QR Handover, Passbook, Safety |

---

## Detailed Screen Specifications

### 1. Collector Feed & Inventory Dashboard
- **File:** [01_collector_dashboard.jpg](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg)
- **Ergonomic Solves:**
  - Replaces the crowded 6-button bottom bar with a spacious **4-Destination Bar** (`Lots`, `Prices`, `Pickups`, `More`) with 56px touch heights.
  - Features a **Burnished Copper Floating Action Button (`+`)** positioned within easy thumb reach for rapid lot creation.
  - Integrates the **FEAT-01/04 Floating Voice Guidance Dock** with animated sound waves.
  - Tabular monospace numbers (`JetBrains Mono`) for all financial amounts and weights.

### 2. Spoken Mandi Price Board
- **File:** [02_spoken_mandi_price_board.jpg](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg)
- **Ergonomic Solves:**
  - High contrast designed for bright Indian outdoor sunlight.
  - Prominent **"Listen All (सुनें)"** vernacular audio trigger at top.
  - 7-day green trend sparklines for scrap price trajectory.
  - Clean card separation without nested cards or badge clutter.

### 3. Citizen 3-Step Doorstep Booking Wizard
- **File:** [03_citizen_3step_booking_wizard.jpg](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg)
- **Ergonomic Solves:**
  - Eliminates the 800-line single scrolling form in favor of a progressive 3-step wizard.
  - Camera snapshot with AI categorization badge (`High-Grade PCB • 94% match`).
  - Large tactile stepper buttons (`[- 2 Items +]`).
  - Live indicative value guarantee (`₹1,200 – ₹1,550`) and CSR green tree certificate toggle.

### 4. Swipeable "More Tools" Bottom Sheet
- **File:** [04_more_tools_bottom_sheet.jpg](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg)
- **Ergonomic Solves:**
  - Solves the mobile tab overflow without dropping any feature.
  - Houses all secondary and compliance workflows:
    - 🛡️ **KYC & Trust Badge** (Aadhaar onboarding & quota unblock)
    - 🏭 **Recyclers Directory** (Bayesian ranked CPCB partners)
    - 🎫 **Universal Sale Token Handover** (cryptographic QR transfer)
    - 📖 **Cash Passbook** (running balance & receipts)
    - ⚠️ **Safety & Hazard Guidance** (battery fire & CRT warnings)
    - ⚙️ **App Settings** (themes, language & cache)
