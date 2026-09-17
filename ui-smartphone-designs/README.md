# Dhatu (धातु) — Flagship Smartphone UI Design Gallery
### Enterprise-Grade Mobile Interface Concepts for Kabadiwala Connect
**Supported Viewports:** 360px – 480px (Android APK & Mobile Web)  
**Design Standard:** Industrial Precision (Apple / Stripe / Linear / Uber Freight)  
**Status:** Enhanced Flagship Mockups with Complete Logical Correctness  

This directory contains the visual mockups and architectural design patterns for the smartphone redesign of **Kabadiwala Connect (Dhatu)**.

---

## Gallery Overview

| Screen | File | Description | Core Features Preserved & Logical Invariants |
|---|---|---|---|
| **1. Collector Feed & Lots** | [`01_collector_dashboard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg) | High-contrast main screen with 4-tab bottom bar, audio dock & FAB | Lot inventory, tabular pricing, live bids, trilingual TTS dock, sync pill, proactive KYC FAB |
| **2. Spoken Mandi Price Board** | [`02_spoken_mandi_price_board.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg) | Robinhood/Stripe-style market rate board with 7-day sparklines | Live scrap index, weekly deltas (+₹15), spoken audio (सुनें), Devanagari numeral normalization |
| **3. Citizen 3-Step Booking Wizard** | [`03_citizen_3step_booking_wizard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg) | Consumer-grade e-waste pickup flow (Apple/Uber aesthetic) | Camera ML snapshot, weight steppers, indicative payout, CSR tree donation, gesture guard |
| **4. "More Tools" Bottom Sheet** | [`04_more_tools_bottom_sheet.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg) | Swipeable drawer housing all secondary operational tools | Dual-Tier KYC (FEAT-10), Recyclers (FEAT-08), QR Handover, Passbook, Safety, Back-button stack |

---

## Detailed Screen Specifications

### 1. Collector Feed & Inventory Dashboard
- **File:** [01_collector_dashboard.jpg](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg)
- **Ergonomic & Logical Solves:**
  - **4-Destination Bar:** Replaces the crowded 6-button bottom bar with a spacious bar (`Lots`, `Prices`, `Pickups`, `More`) with 56px touch heights.
  - **Segmented Control:** `Active Lots (3)` and `Live Bids (1)` combined into a clean segmented toggle.
  - **Proactive KYC FAB:** Burnished copper floating action button (`+`) detects unverified quotas proactively before form submission.
  - **Floating Voice Guidance Dock:** Integrates FEAT-01/04 with animated sound wave.
  - **Tabular Monospace Numerals:** `JetBrains Mono` for all financial amounts (`AI Value: ₹8,000`, `Top Bid: ₹8,500 by EcoRecycle`).

### 2. Spoken Mandi Price Board
- **File:** [02_spoken_mandi_price_board.jpg](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg)
- **Ergonomic & Logical Solves:**
  - **High Daylight Contrast:** Dark slate cards designed for outdoor visibility in bright Indian sunlight.
  - **Audio Engine Integration:** Prominent `Listen All (सुनें)` button powered by sentence chunking and heartbeat keep-alive.
  - **Market Trend Sparklines:** 7-day green trend sparklines for scrap price trajectory.
  - **Devanagari Normalization:** Accepts `०-९` keyboard input and converts to `0-9` without `NaN` parse errors.

### 3. Citizen 3-Step Doorstep Booking Wizard
- **File:** [03_citizen_3step_booking_wizard.jpg](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg)
- **Ergonomic & Logical Solves:**
  - **Progressive Disclosure:** 3-step wizard (`1. Items`, `2. Schedule`, `3. Confirm`) replacing the 800-line scrolling form.
  - **Camera ML Snapshot:** AI categorization badge (`High-Grade PCB • 94% match`).
  - **Tactile Steppers:** Large rounded buttons (`[- 2 Items • 4.5 kg +]`).
  - **Indicative Value Guarantee:** `₹1,200 – ₹1,550` with green trust shield.
  - **CSR Green Tree Donation:** Active switch with 80G tax benefit tag.

### 4. Swipeable "More Tools" Bottom Sheet Drawer
- **File:** [04_more_tools_bottom_sheet.jpg](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg)
- **Ergonomic & Logical Solves:**
  - **Back-Button Stack Integration:** Pressing hardware/gesture back on Android dismisses the sheet smoothly without exiting the app.
  - **Secondary Tools Hub:**
    - 🛡️ **KYC & Trust Badges** (Aadhaar verification to unlock unlimited bidding)
    - 🏭 **Recyclers Directory** (Bayesian ranked CPCB partners)
    - 🎫 **Universal Sale Token Handover** (cryptographic QR transfer)
    - 📖 **Cash Passbook** (running balance ₹18,400)
    - ⚠️ **Safety & Hazard Guidance** (battery fire & CRT warnings)
    - ⚙️ **App Settings** (themes, language & cache)
