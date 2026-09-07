# 🎬 Kabadiwala Connect — SIH 2026 Video Demo Script (2–3 Minutes)
> **Track**: Smart Waste Management & Circular Economy  
> **Platform**: Unified Web Application (Citizen • Kabadiwala • ULB/CPCB Admin)  
> **Target Run Time**: 2 Minutes 50 Seconds  

---

## ⏱️ Video Structure Overview

| Timestamp | Segment | Actor / Persona | Screen Displayed | Core Value Demonstrated |
|---|---|---|---|---|
| **0:00 – 0:30** | Hook & Problem Statement | Narrator | SIH Landing Page | 4M informal collectors, zero digital traceability |
| **0:30 – 1:15** | Act I: Citizen Doorstep Flow | Ramesh Sharma | Citizen Portal | AI Scrap Camera Scan + Map Pinning |
| **1:15 – 2:05** | Act II: Collector Pickup & Scale | Suresh Kumar | Kabadiwala Portal | Hindi Voice Assist + Scale Steppers + Wallet |
| **2:05 – 2:35** | Act III: Municipal ULB & EPR Audit | NDMC Admin | Admin Dashboard | Real-time CPCB ESG Offsets + EPR Certificate |
| **2:35 – 2:50** | Outro & Future Impact | Narrator | Architecture & Impact | Formalization of India's Circular Economy |

---

## 🎙️ Detailed Scene-by-Scene Script

### 🎬 Scene 1: The Problem & The Solution (0:00 – 0:30)
* **Visual**: Camera pans across the landing page at `http://localhost:3000`. Highlights the dynamic stats counter (421 kg collected, ₹8,764 disbursed, 766 kg CO₂ abated) and the 3-portal architecture diagram.
* **Narrator (Voiceover)**:
  > *"Every single day, India generates over 150,000 tonnes of solid waste. Over 80% of all post-consumer recyclables are recovered not by municipal trucks, but by over 4 million informal waste collectors—our local kabadiwalas.*  
  > *Yet, citizens struggle with unpredictable rates, collectors face exploitation due to low literacy, and brands under CPCB EPR regulations lack any verifiable, digital audit trail.*  
  > *Introducing **Kabadiwala Connect**—one unified web platform connecting Citizens, Collectors, and Municipal Regulators."*

---

### 🎬 Scene 2: Citizen Schedules Pickup with AI Vision (0:30 – 1:15)
* **Visual**: Presenter clicks **"Ramesh (Citizen)"** in the top 1-click demo switcher. 
* **Screen**: Citizen Dashboard shows active requests and the live Scrap Rate Card. Presenter clicks **"Schedule Doorstep Pickup"**.
* **Action**:
  1. Presenter clicks **"Scan Scrap Photo"** and selects a photo of plastic bottles.
  2. The FastAPI ML classifier immediately detects: `Plastic (PET) — 94.2% Confidence — ₹18.00 / kg`.
  3. Estimated weight auto-fills to `12.0 kg` (Total: ₹216).
  4. Presenter clicks on the interactive **Leaflet Map** to drop a doorstep pin at Lajpat Nagar II.
  5. Presenter clicks **"Confirm & Schedule Pickup"**.
* **Narrator (Voiceover)**:
  > *"Meet Ramesh from Lajpat Nagar. Instead of throwing recyclables into mixed trash, Ramesh opens Kabadiwala Connect. Using our lightweight AI image classifier, he snaps a photo of sorted scrap. The platform instantly identifies the polymer type, matches Delhi market rates, and pins his exact gate location on OpenStreetMap with zero billing friction."*

---

### 🎬 Scene 3: Low-Literacy Kabadiwala Portal & Scale Verification (1:15 – 2:05)
* **Visual**: Presenter switches to **"Suresh (Collector)"** using the navbar demo switcher.
* **Screen**: The screen transforms into a high-contrast, large-icon interface designed specifically for low-literacy informal workers.
* **Action**:
  1. Presenter clicks the **"बोलकर सुनें (Voice Assist)"** audio button.
  2. Browser speaks in clear Hindi:  
     *(Audio)*: *"नमस्कार सुरेश जी! आपके क्षेत्र लाजपत नगर में नया कबाड़ पिकअप उपलब्ध है। कृपया विवरण देखें।"*
  3. Presenter opens **"Nearby Requests"**—sees Ramesh's request 1.2 km away and taps the giant green **"स्वीकार करें (Accept)"** button.
  4. Presenter opens **"चालू काम (Active Job)"**: on the digital scale interface, taps the large `+` and `-` touch steppers to adjust verified weights (Plastic: 14.5 kg, Paper: 8.0 kg).
  5. Presenter taps **"काम पूरा करें व भुगतान प्राप्त करें"**.
  6. **Wallet Screen** instantly pops up showing a newly credited ₹373 payout and ledger transaction entry!
* **Narrator (Voiceover)**:
  > *"Now let's switch to Suresh Kumar, an informal collector with an e-rickshaw. Notice how the UI adapts: high contrast, 60-pixel touch targets, and native Web Speech API Hindi voice narration for zero-literacy barriers.*  
  > *Suresh accepts the job nearby, arrives at Ramesh's doorstep, and enters the exact weights using large scale steppers. The moment he completes the order, ₹373 is transferred directly into his in-app digital wallet—eliminating middlemen cuts and creating formal banking history."*

---

### 🎬 Scene 4: ULB Regulatory Monitoring & CPCB EPR Compliance (2:05 – 2:35)
* **Visual**: Presenter clicks **"NDMC (Admin/EPR)"** in the demo switcher.
* **Screen**: The New Delhi Municipal Council administrative dashboard loads instantly.
* **Action**:
  1. Presenter highlights the **30-Day Trend Chart**, showing daily collection spikes and landfill diversion.
  2. Points to the live **CPCB Environmental Impact Cards**: 766 kg CO₂ abated, 2.3 trees saved, 5,272 liters of water preserved.
  3. Switches to the **"Kabadiwala KYC Verifications"** tab: shows collector Mohammed Irfan pending verification. Clicks **"Approve"**—badge updates to verified green!
  4. Switches to **"EPR Compliance Center"** tab and clicks **"Export EPR Report"** to download the certified cryptographic JSON audit trail.
* **Narrator (Voiceover)**:
  > *"Finally, we look through the lens of NDMC and CPCB regulators. Every single transaction completed by Suresh immediately feeds into the municipal dashboard.*  
  > *Here, urban local bodies monitor real-time scrap diversion trends across municipal wards, verify informal collectors into formal welfare schemes, and generate tamper-evident CPCB Extended Producer Responsibility certificates—giving recycling credits to multinational consumer brands."*

---

### 🎬 Scene 5: Impact & Conclusion (2:35 – 2:50)
* **Visual**: Return to the full architecture slide or landing page hero screen. Team logo and repository link displayed.
* **Narrator (Voiceover)**:
  > *"Kabadiwala Connect does not replace the informal sector—it empowers it. By combining AI computer vision, vernacular voice assistance, and immutable EPR traceability, we are formalizing 4 million workers and accelerating India toward a cleaner, zero-landfill future.*  
  > *Thank you, judges!"*

---

## 🎯 Tips for the Presenter & Camera Operator
1. **Resolution**: Record at 1080p (1920x1080) at 60 FPS in Chrome full screen (press `F11`).
2. **Audio**: Ensure system audio is recorded so the Web Speech API Hindi voice prompt is loud and clear.
3. **Pacing**: Allow 1.5 seconds after each button click for the visual state change to register on video.
4. **Offline Backup**: Keep `start-demo.sh` running locally so no internet latency affects the recording.
