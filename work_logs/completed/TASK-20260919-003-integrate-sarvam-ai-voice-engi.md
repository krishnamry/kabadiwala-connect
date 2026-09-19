---
id: "TASK-20260919-003-integrate-sarvam-ai-voice-engi"
title: "Integrate Sarvam AI Voice Engine and Comprehensive Spoken Instructions across Collector Dashboard"
status: "COMPLETED"
assigned_agent: "Antigravity"
created_at: "2026-09-19T01:56:09Z"
updated_at: "2026-09-19T02:29:56Z"
completed_at: "2026-09-19T02:29:56Z"
locked_files: []
dependencies: []
---
# Task: [TASK-20260919-003-integrate-sarvam-ai-voice-engi] Integrate Sarvam AI Voice Engine and Comprehensive Spoken Instructions across Collector Dashboard

## 1. Context & Objectives
- **Goal**: Replace browser/fallback voices with Sarvam AI API (bulbul:v3). Pre-generate, save, and cache offline audio files for zero-latency playback. Integrate vernacular voice guidance throughout the Collector Dashboard for non-smartphone-friendly informal collectors across Hindi, Marathi, and English.
- **Trigger**: User request or parent task delegation.
- **Success Criteria**:
  - [ ] Criteria 1
  - [ ] Criteria 2

## 2. Work Breakdown & Status Checklist
- [x] Step 1: Completed preliminary analysis
- [/] Step 2: In-progress implementation step
- [ ] Step 3: Pending verification / testing step
- [ ] Step 4: Final documentation / review

## 3. Resume Checkpoint (CRITICAL FOR MIDWAY CONTINUATION)
> ⏸️ **PAUSED at: 2026-09-19 07:39:10 by `Antigravity`**

- **Pause Reason**: User requested to delete v2 version
- **Immediate Next Step on Resume**: Continue Sarvam AI voice engine integration
- **Unfinished / Dirty Files**:
  - `apps/web/src/pages/kabadiwala/KabadiwalaDashboard.tsx`
- **Notes / Blockers**: User requested to delete v2 version

## 4. Execution History & Action Log
| Timestamp (UTC/Local) | Step / Action | Files Touched | Outcome / Observation |
|-----------------------|---------------|---------------|-----------------------|
| YYYY-MM-DD HH:MM | Initialized task | None | Task created and claimed |
| YYYY-MM-DD HH:MM | Refactored module | `src/auth.ts` | Tests passed |
| 2026-09-19 07:30:49 | PAUSED TASK | None | Reason: Paused while focusing on user request to check backend |
| 2026-09-19 07:39:10 | PAUSED TASK | apps/web/src/pages/kabadiwala/KabadiwalaDashboard.tsx | Reason: User requested to delete v2 version |
| 2026-09-19 07:46:06 | RESUMED TASK | None | Resumed by `Antigravity` |
| 2026-09-19 07:59:56 | COMPLETED TASK | None | Summary: Successfully integrated Sarvam AI voice engine across the Dhatu collector platform: generated 81 pre-recorded WAV clips across Hindi, Marathi, and English covering all 27 critical actions and walkthroughs; built 4-tier Sarvam voice service with static offline playback, IndexedDB caching, live API fallback, and Android TTS fallback; wired spoken instructions and audio keys into Header Briefing, Lot Creator (walkthrough, camera, weight stepper, hub location, success), Live Bidding Room (walkthrough, accept bid), Price Board (daily overview and 8 major commodity items), Recyclers Directory, Handover QR Gate Pass, Passbook Ledger, KYC Desk, Citizen Pickups (walkthrough, OTP verification, accepted, completed), and a Persistent Mobile Floating Voice Co-Pilot Dock; build verified with 0 errors. |

## 5. Artifacts & Deliverables
- Output files created:
  - `path/to/output`
- Tests run:
  - Command: `npm test` -> Result: PASS


## Completion Summary
> Completed at 2026-09-19 07:59:56

Successfully integrated Sarvam AI voice engine across the Dhatu collector platform: generated 81 pre-recorded WAV clips across Hindi, Marathi, and English covering all 27 critical actions and walkthroughs; built 4-tier Sarvam voice service with static offline playback, IndexedDB caching, live API fallback, and Android TTS fallback; wired spoken instructions and audio keys into Header Briefing, Lot Creator (walkthrough, camera, weight stepper, hub location, success), Live Bidding Room (walkthrough, accept bid), Price Board (daily overview and 8 major commodity items), Recyclers Directory, Handover QR Gate Pass, Passbook Ledger, KYC Desk, Citizen Pickups (walkthrough, OTP verification, accepted, completed), and a Persistent Mobile Floating Voice Co-Pilot Dock; build verified with 0 errors.
