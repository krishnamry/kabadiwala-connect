# Agent Work & Multi-Agent Coordination Logs

This directory (`work_logs/`) serves as the central coordination board, progress logger, and state checkpointing system for autonomous AI agents and pair-programming sessions.

It ensures that:
1. **Multiple agents can coordinate** without colliding or overwriting each other's work (via task ownership and file locks).
2. **Work history is preserved** with timestamped action logs and structured checkpoints.
3. **Interrupted tasks can resume seamlessly** from exact mid-flight states if an agent stops, crashes, hits token limits, or pauses.

---

## Directory Structure

```text
work_logs/
├── CURRENT_STATE.md      # Auto-generated live dashboard of active tasks, locks, and paused tasks
├── README.md             # This guide and multi-agent protocol specification
├── coordinator.py        # Python CLI tool for automating task lifecycle & checkpoints
├── active/               # Tasks currently in progress by an agent
│   └── TASK-*.md
├── paused/               # Tasks paused or stopped midway, waiting to be resumed
│   └── TASK-*.md
├── completed/            # Completed tasks with execution summaries & artifacts
│   └── TASK-*.md
├── checkpoints/          # Machine-readable JSON snapshots of intermediate states
│   └── CHK-*.json
└── templates/            # Standard templates
    ├── task_template.md
    └── checkpoint_template.json
```

---

## Quick Start CLI: `coordinator.py`

You or any agent can use `work_logs/coordinator.py` to manage tasks:

### 1. View Current Board & Status
```bash
python3 work_logs/coordinator.py list
```
View active locks and tasks in [`work_logs/CURRENT_STATE.md`](file:///home/krishna/KBD/work_logs/CURRENT_STATE.md).

To view full details, dirty files, and resume instructions for a specific task:
```bash
python3 work_logs/coordinator.py show <TASK_ID>
```

### 2. Claim / Start a New Task
```bash
python3 work_logs/coordinator.py create \
  --title "Implement Auth Middleware" \
  --agent "backend-agent" \
  --files "apps/api/src/auth.ts,apps/api/src/server.ts" \
  --goal "Add JWT authentication middleware to secure private endpoints"
```
*Note: If any specified files are already locked by another active agent, the coordinator will warn you of a collision!*

### 3. Record Progress & Intermediate Checkpoints
```bash
python3 work_logs/coordinator.py checkpoint TASK-20260918-001-implement-auth-middleware \
  --step "Completed JWT verification helper" \
  --next-step "Write integration tests in test_auth.ts" \
  --dirty-files "apps/api/src/auth.ts" \
  --notes "Tested token generation; need to handle token expiration"
```
*Optionally pass `--add-files "apps/api/src/test_auth.ts"` to dynamically add new locked files.*

### 4. Pause Work Midway (if agent stops or switches tasks)
```bash
python3 work_logs/coordinator.py pause TASK-20260918-001-implement-auth-middleware \
  --reason "Reached context window limit / waiting for DB migration" \
  --next-step "Apply DB migration with prisma migrate, then test auth endpoint" \
  --dirty-files "apps/api/src/auth.ts"
```
*This moves the task from `active/` to `paused/` and updates the resume instructions.*

### 5. Resume an Interrupted Task
When a new agent session starts or an agent is ready to pick up paused work:
```bash
python3 work_logs/coordinator.py resume TASK-20260918-001-implement-auth-middleware --agent "agent-session-2"
```
*This moves the task back to `active/`, verifies no file collisions exist, claims it, and prints the exact resume instructions and dirty file list.*

### 6. Mark Task Completed
```bash
python3 work_logs/coordinator.py complete TASK-20260918-001-implement-auth-middleware \
  --summary "JWT auth middleware successfully implemented and covered by unit tests."
```
*This releases file locks and moves the task to `completed/`.*

### 7. Sync Dashboard
```bash
python3 work_logs/coordinator.py sync
```
*Refreshes `CURRENT_STATE.md` based on active, paused, and completed files.*

---

## Agent Protocol: Standard Operating Procedure (SOP)

When an agent begins working in this codebase:

### Step 1: Check Current State
Before starting work, examine [`work_logs/CURRENT_STATE.md`](file:///home/krishna/KBD/work_logs/CURRENT_STATE.md):
- Check if there is an existing paused task that needs to be continued.
- Check if any target files are currently locked by another active agent.

### Step 2: Claiming or Resuming
- **If continuing paused work**: Run `python3 work_logs/coordinator.py resume <TASK_ID>` (or inspect the task file in `work_logs/paused/`). Read Section 3 ("Resume Checkpoint") carefully.
- **If starting new work**: Run `python3 work_logs/coordinator.py create ...` to register locks and create the tracking file in `work_logs/active/`.

### Step 3: During Execution (Incremental Checkpoints)
- Every major milestone (file edit, test run, or schema change), record a checkpoint or update the task's markdown file.
- Keep the `Resume Checkpoint` section updated:
  - What was just verified?
  - Which files are half-edited ("dirty")?
  - What is the exact next command or edit to run?

### Step 4: Graceful Handoff / Interruption
If the agent must stop before finishing:
1. Update `work_logs/active/<TASK_ID>.md` Section 3 with exact instructions for the resuming agent.
2. Run `python3 work_logs/coordinator.py pause <TASK_ID> --reason "<REASON>" --next-step "<NEXT_STEP>"`.
3. The task is safely moved to `work_logs/paused/`, allowing another agent to take over without data or context loss.

### Step 5: Completion
1. Ensure all criteria are checked off.
2. Run `python3 work_logs/coordinator.py complete <TASK_ID> --summary "<SUMMARY>"`.
3. Locks are automatically released and reflected in `CURRENT_STATE.md`.
