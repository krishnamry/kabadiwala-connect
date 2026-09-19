# Dhatu (धातु) — Voice Scripts Repository & Management Framework

> **CRITICAL POLICY NOTICE: ZERO VOICE GENERATION UNTIL FINAL STAGE**
> **Do NOT regenerate or synthesize voice audio files until the user explicitly requests it in the final release stage.**
> During application development and feature improvisations, all voice scripts are continuously authored, tuned, and maintained in this directory. Real-time audio generation will only be triggered in one batch when explicitly instructed by the user.

---

## 1. Overview & Architecture

Dhatu uses **Sarvam AI (`bulbul:v3`)** high-fidelity vernacular Indian text-to-speech for tri-lingual audio co-pilot guidance across Hindi, Marathi, and English.

Because informal doorstep scrap collectors (*kabadiwalas*), citizens, and recyclers operate in bright sunlight, noisy godowns, and variable network conditions, our voice prompts provide **tactile, physical navigation cues** ("look for the green button", "tap the blue camera box").

### Why Script Management Is Separated from Audio Synthesis
1. **Rapid Application Evolution:** As UI components, flows, and buttons are improvised, scripts can be updated instantly without making expensive API calls.
2. **Quota & Rate Optimization:** Pre-generating audio once at the final stage prevents wasteful regeneration of audio clips during iterative frontend tweaks.
3. **Tri-lingual Consistency:** Centralizing scripts ensures parity across Hindi (`hi`), Marathi (`mr`), and English (`en`).

---

## 2. Directory Layout

```
voice_scripts/
├── README.md                   # This documentation & protocol guide
├── collector_scripts.json      # Spoken instructions for Kabadiwalas / Collectors
├── citizen_scripts.json        # Spoken instructions for Household & Commercial Citizens
├── recycler_scripts.json       # Spoken instructions for Smelters & Registered Recyclers
├── auth_kyc_scripts.json       # Onboarding, OTP verification, Aadhaar KYC & Re-apply scripts
├── common_scripts.json         # Header brand announcements, notifications, chats, offline alerts
├── master_voice_scripts.json   # Auto-compiled unified catalog containing all keys
├── manage_scripts.py           # CLI tool for compiling, linting, and inspecting scripts
└── regenerate_voice.py         # Dedicated synthesis runner with Sarvam API key (LOCKED until final stage)
```

---

## 3. Sarvam AI Synthesis Configuration (Reserved for Final Stage)

When the user instructs us to regenerate voice in the final stage, the following credentials and parameters will be used:

- **API Key:** `sk_me3cv0xh_9jf4NFlAgKGzEeEUUFvATtjB`
- **Endpoint:** `https://api.sarvam.ai/text-to-speech`
- **Model:** `bulbul:v3`
- **Speaker:** `aditya` (Clear, authoritative, warm Indian cadence)
- **Audio Output:** WAV format, 22,050 Hz sampling rate
- **Destination Directories:**
  - Web Public Assets: `apps/web/public/audio/sarvam/{lang}/{key}.wav`
  - Static Root Asset Bank: `audio/sarvam/{lang}/{key}.wav`
  - TypeScript Mapping: `apps/web/src/lib/sarvamAudioCatalog.ts`

---

## 4. Developer Workflows

### How to Add or Modify a Voice Script While Improvising Application Features
1. Identify the relevant role or module JSON file (e.g., `collector_scripts.json` or `citizen_scripts.json`).
2. Add or update the key with all three languages:
   ```json
   "your_action_key": {
     "description": "Triggered when collector taps...",
     "hi": "हिंदी में आसान व स्पष्ट निर्देश...",
     "mr": "मराठीत सोप्या भाषेत मार्गदर्शन...",
     "en": "Clear English guidance referencing UI button colors and positions..."
   }
   ```
3. Run the compiler & validator:
   ```bash
   python3 voice_scripts/manage_scripts.py --compile
   python3 voice_scripts/manage_scripts.py --validate
   ```
   This automatically synchronizes `master_voice_scripts.json` and verifies that no translations are missing.

### Checking Script Statistics & Coverage
```bash
python3 voice_scripts/manage_scripts.py --stats
```

---

## 5. Final Stage Voice Regeneration (LOCKED)

> [!CAUTION]
> **DO NOT RUN THIS COMMAND UNTIL USER EXPRESSLY COMMANDS: "Regenerate voice now" or similar in the final stage.**

When final approval is granted:
```bash
python3 voice_scripts/regenerate_voice.py --confirm-final-stage
```

Running without `--confirm-final-stage` will run in **Dry-Run Validation Mode** only and will not invoke the Sarvam AI API.
