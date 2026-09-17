# Dhatu (धातु) — Flagship Smartphone UI Design Gallery
### Enterprise-Grade Mobile Interface Concepts for Kabadiwala Connect
**Supported Viewports:** 360px – 480px (Android Capacitor APK & Mobile Web)  
**Design Standard:** Industrial Precision (Apple / Stripe / Linear / Uber Freight)  
**Status:** Flagship Smartphone Concepts (v7.1.0 Definitive Alignment)  
**Referenced Master Document:** [`UI_REDESIGN_MASTER_PLAN.md`](file:///home/krishna/KBD/UI_REDESIGN_MASTER_PLAN.md)

---

## Gallery Overview

| Screen | Visual File | Design Description | Core Features Preserved & Logical Invariants |
|---|---|---|---|
| **1. Collector Feed & Lots** | [`01_collector_dashboard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg) | High-contrast main screen with 4-tab bottom bar, audio dock & FAB | Lot inventory, tabular pricing, live bids, trilingual TTS dock, sync pill, proactive KYC FAB |
| **2. Spoken Mandi Price Board** | [`02_spoken_mandi_price_board.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg) | Dark slate trading floor with 7-day green sparklines & spoken audio | Live scrap index, weekly deltas (+₹15), spoken audio (सुनें), Devanagari numeral normalization |
| **3. Citizen 3-Step Booking Wizard** | [`03_citizen_3step_booking_wizard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg) | Consumer-grade e-waste pickup flow (Apple/Uber aesthetic) | Camera ML snapshot, weight steppers, indicative payout, CSR tree donation, gesture guard |
| **4. "More Tools" Bottom Sheet** | [`04_more_tools_bottom_sheet.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg) | Swipeable drawer housing all secondary operational tools | Dual-Tier KYC (FEAT-10), Recyclers (FEAT-08), Handover QR Pass, Passbook, Safety, Back-button stack |

---

## Detailed Screen Specifications

### 1. Collector Feed & Inventory Dashboard
- **File:** [`01_collector_dashboard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg)
- **Ergonomic & Logical Solves:**
  - **4-Destination Bar:** Replaces the crowded 6-button bottom bar with a spacious bar (`Lots`, `Prices`, `Pickups`, `More`) with 56px touch heights.
  - **Segmented Control:** `My Lots (3)` and `Live Bids (1)` combined into a clean segmented toggle.
  - **Proactive KYC FAB:** Burnished copper floating action button (`+`) detects unverified quotas proactively before form submission.
  - **Floating Voice Guidance Dock:** Integrates FEAT-01/04 with animated golden sound wave.
  - **Tabular Monospace Numerals:** `JetBrains Mono` for all financial amounts (`₹8,500`, `₹5,760`).

### 2. Spoken Mandi Price Board
- **File:** [`02_spoken_mandi_price_board.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg)
- **Ergonomic & Logical Solves:**
  - **High Daylight Contrast:** Dark slate cards designed for outdoor visibility in bright Indian sunlight.
  - **Audio Engine Integration:** Prominent `Listen All (सुनें)` button powered by sentence chunking and heartbeat keep-alive.
  - **Market Trend Sparklines:** 7-day green trend sparklines for scrap price trajectory (`+₹15` / `▲ 5.6%`).
  - **Devanagari Normalization:** Accepts `०-९` keyboard input and converts to `0-9` without `NaN` parse errors.

### 3. Citizen 3-Step Doorstep Booking Wizard
- **File:** [`03_citizen_3step_booking_wizard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg)
- **Ergonomic & Logical Solves:**
  - **Progressive Disclosure:** 3-step wizard (`1. Items`, `2. Schedule`, `3. Confirm`) replacing the 800-line scrolling form.
  - **Camera ML Snapshot:** AI categorization badge (`High-Grade PCB • 94% match`).
  - **Tactile Steppers:** Large rounded buttons (`[- 2 Items • 4.5 kg +]`).
  - **Indicative Value Guarantee:** `₹1,200 – ₹1,550` with green trust shield.
  - **CSR Green Tree Donation:** Active switch with 80G tax benefit tag.

### 4. Swipeable "More Tools" Bottom Sheet Drawer
- **File:** [`04_more_tools_bottom_sheet.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg)
- **Ergonomic & Logical Solves:**
  - **Back-Button Stack Integration:** Pressing hardware/gesture back on Android dismisses the sheet smoothly without exiting the app.
  - **Secondary Tools Hub:**
    - 🛡️ **KYC & Trust Profile:** Aadhaar verification to unlock unlimited bidding.
    - 🏭 **Recyclers Directory:** Bayesian ranked CPCB partners.
    - 🎫 **Handover QR Pass:** Pre-weigh manifest QR pass for plant weighbridge entry.
    - 📖 **Cash Passbook:** Running balance (`₹18,400`) & completed sale receipts.
    - ⚠️ **Safety & Hazard Guides:** Battery fire & CRT tube warnings.
    - ⚙️ **App Settings:** Themes, language, & offline cache management.
  - **Navigation Invariant Alignment:** Underneath the sheet, the application maintains the unified 4-tab bar (`Lots`, `Prices`, `Pickups`, `More`).
