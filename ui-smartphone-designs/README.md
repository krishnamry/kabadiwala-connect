# Dhatu (धातु) — Flagship Smartphone UI Design Gallery
### Enterprise-Grade Mobile Interface Concepts for Kabadiwala Connect
**Supported Viewports:** 360px – 480px (Android Capacitor APK & Mobile Web)  
**Design Standard:** Industrial Precision (Apple / Stripe / Linear / Uber Freight)  
**Status:** Refined Flagship Concepts with Researched Micro-Improvements (v8.1.0)  
**Referenced Master Document:** [`UI_REDESIGN_MASTER_PLAN.md`](file:///home/krishna/KBD/UI_REDESIGN_MASTER_PLAN.md)  
**Interactive React Simulator:** [`apps/web/src/pages/design-preview/DesignPreviewPage.tsx`](file:///home/krishna/KBD/apps/web/src/pages/design-preview/DesignPreviewPage.tsx)

---

## Gallery Overview

| Screen | Visual File | Design Description | Core Features Preserved & Researched Micro-Improvements |
|---|---|---|---|
| **1. Collector Feed & Lots** | [`01_collector_dashboard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/01_collector_dashboard.jpg) | Hero-scale main screen with 4-tab bottom bar, audio dock & circular FAB | Real PCB/Cu stock photography, tabular pricing, `⏱ 2h 14m left` auction countdown, inline `Accept Bid ➔`, `● Synced 2m ago` heartbeat |
| **2. Spoken Mandi Price Board** | [`02_spoken_mandi_price_board.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/02_spoken_mandi_price_board.jpg) | High-contrast dark slate trading floor with 7-day sparklines & spoken audio | `📍 Mayapuri Hub` APMC geographic anchor, `Day Range: ₹250–₹275`, 4 commodity cards (PCBs, Cu, Batteries, ICs), Bhashini spoken voice |
| **3. Citizen 3-Step Booking Wizard** | [`03_citizen_3step_booking_wizard.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/03_citizen_3step_booking_wizard.jpg) | Consumer-grade e-waste pickup flow (Cashify/Uber aesthetic) | Real laptop photo, `94% match` ML tag, `🛡️ 100% Certified Data Wiping Included`, logical Step 1 CTA (`Continue to Slot ➔`), zero cancellation fee |
| **4. "More Tools" Bottom Sheet** | [`04_more_tools_bottom_sheet.jpg`](file:///home/krishna/KBD/ui-smartphone-designs/04_more_tools_bottom_sheet.jpg) | Elevated native drawer over frosted glass blurred feed | Collector ID header (`Suresh Kumar • KBD-9421 • Tier-2 Verified`), 4-tab bar consistency underneath, offline cache buffer (`3 Lots Offline`) |

---

## Researched Micro-Improvements Breakdown

Following rigorous UX research into informal worker vernacular interfaces (Bhashini/NITI Aayog) and circular electronics logistics (Cashify/Uber Freight), we applied the following 8 micro-improvements:

### 1. Collector Feed (`01_collector_dashboard.jpg`)
1. **Active Auction Timer Pill (`⏱ 2h 14m left`):** Prevents anxiety for scrap collectors by clearly communicating remaining bidding window and anti-sniping protection (`+2m extension`).
2. **Inline Direct Accept Action (`Accept Bid ➔`):** Allows 1-tap bid acceptance directly from the lot card without forcing nested navigation.
3. **Network & Sync Heartbeat (`● Synced 2m ago • 4G`):** Provides instant psychological reassurance in rural or industrial scrapyards with spotty connectivity.
4. **Physical Grade Classification (`Grade-A High Yield`):** Eliminates classification ambiguity between collectors and authorized recyclers.

### 2. Spoken Mandi Price Board (`02_spoken_mandi_price_board.jpg`)
5. **Geographic APMC Mandi Anchor (`📍 Mayapuri Hub • Delhi`):** Grounds commodity prices to specific regional wholesale scrap hubs, accounting for inter-state freight differences.
6. **Day Range Spread (`Day Range: ₹250 – ₹275`):** Displays modal market spreads alongside spot prices, preventing local middleman exploitation.
7. **Expanded 4-Commodity Grid:** Complete coverage for PCBs (`₹265/kg`), Copper Cables (`₹480/kg`), Lithium Batteries (`₹145/kg`), and IC Processors (`₹620/kg`).
8. **Vernacular Speed Adjustment (`1.0x / 1.2x`):** Empowers high-frequency collectors to listen at accelerated rates.

### 3. Citizen 3-Step Wizard (`03_citizen_3step_booking_wizard.jpg`)
9. **Logical Step-Progression CTA:** On Step 1 (`1. Items`), CTA clearly reads `Continue to Slot Selection (Step 2/3) ➔` rather than skipping directly to confirmation.
10. **Data Security Reassurance (Cashify Model):** `🛡️ 100% Certified Data Wiping & Green Certificate Included` directly eliminates citizen hesitation when parting with old laptops or phones.
11. **Risk-Free Micro-Copy:** `Zero Cancellation Fee • Free Doorstep Inspection` establishes immediate trust.

### 4. Secondary Tools Drawer (`04_more_tools_bottom_sheet.jpg`)
12. **Collector Profile Strip:** Displays `Suresh Kumar • ID: KBD-9421 • Tier-2 Verified (₹1,00,000 Limit)` inside the drawer header.
13. **Offline Storage Buffer Indicator:** `📦 3 Lots Stored Offline • IndexedDB Active` ensures work continues seamlessly during cellular blackouts.
14. **Bottom Bar Consistency:** Locks the underlying navigation strictly to the canonical 4 tabs (`Lots`, `Prices`, `Pickups`, `More`).

---

## Visual Craft Specifications

- **Device Frame:** Floating 3D Titanium Chassis with realistic studio lighting and soft contact drop shadow.
- **Color Palette:** Warm Patina Copper (`#B85D19`), Forest Emerald (`#166534`), Deep Obsidian Slate (`#090D16`), and Warm Linen (`#F8F9FA`).
- **Typography:** Display titles in bold sans-serif, prices in `JetBrains Mono` tabular lining numerals (`₹8,500`).
- **Image Processing Standard:** Processed with PIL at 98% quality with 4:4:4 chroma subsampling, enhanced edge sharpness (1.18x), and dynamic contrast tuning (1.05x).
