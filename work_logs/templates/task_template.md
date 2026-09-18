---
id: TASK-YYYYMMDD-001
title: "Task Title Here"
status: IN_PROGRESS # Options: PENDING, IN_PROGRESS, PAUSED, COMPLETED, BLOCKED, FAILED
assigned_agent: "agent-name-or-id"
created_at: "YYYY-MM-DDTHH:MM:SSZ"
updated_at: "YYYY-MM-DDTHH:MM:SSZ"
completed_at: null
locked_files:
  - path/to/file1.ts
  - path/to/file2.ts
dependencies: []
---

# Task: [TASK-ID] Task Title Here

## 1. Context & Objectives
- **Goal**: Clear statement of what needs to be achieved.
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
> **If the agent terminates, runs out of context, or pauses midway, the next agent picks up from this section.**

- **Current State**: Summary of current status and what was just being worked on.
- **Last Verified Step**: Last step that was confirmed working.
- **Unfinished / Dirty Files**:
  - `path/to/file.ts`: Explanation of half-completed changes or pending fixes.
- **Immediate Next Step**: Exact instruction for what the resuming agent must do first (e.g., "Run `npm test` to verify auth fix, then edit line 124 of `api/index.ts`").
- **Known Blockers / Notes**: Any error messages, pending responses, or dependencies.

## 4. Execution History & Action Log
| Timestamp (UTC/Local) | Step / Action | Files Touched | Outcome / Observation |
|-----------------------|---------------|---------------|-----------------------|
| YYYY-MM-DD HH:MM | Initialized task | None | Task created and claimed |
| YYYY-MM-DD HH:MM | Refactored module | `src/auth.ts` | Tests passed |

## 5. Artifacts & Deliverables
- Output files created:
  - `path/to/output`
- Tests run:
  - Command: `npm test` -> Result: PASS
