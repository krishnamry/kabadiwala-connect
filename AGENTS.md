# Agent Work Guidelines & Multi-Agent Coordination Protocol

All autonomous agents and pair-programming assistants operating in this repository must follow this coordination protocol to prevent file collisions, avoid duplicate work, and guarantee seamless resumption of tasks interrupted midway.

---

## 1. Multi-Agent Coordination System (`work_logs/`)

The repository maintains an active coordination dashboard and task tracking board under `work_logs/`:
- **Live State Dashboard**: [`work_logs/CURRENT_STATE.md`](file:///home/krishna/KBD/work_logs/CURRENT_STATE.md)
- **Active Tasks**: `work_logs/active/`
- **Paused / Interrupted Tasks**: `work_logs/paused/`
- **Completed Tasks**: `work_logs/completed/`
- **State Checkpoints**: `work_logs/checkpoints/`
- **Coordinator CLI**: `python3 work_logs/coordinator.py`

---

## 2. Mandatory Agent Workflow

### Step 1: Pre-Execution State & Lock Inspection
Before writing code or editing files:
1. Examine [`work_logs/CURRENT_STATE.md`](file:///home/krishna/KBD/work_logs/CURRENT_STATE.md).
2. Check if a task matching the user's request is currently **Paused** in `work_logs/paused/`. If so, **resume it** rather than starting from scratch.
3. Check the **Active File Locks** section. Do not modify files locked by another active agent without explicit coordination.

### Step 2: Claiming or Resuming a Task
- **To Resume a Paused Task**:
  ```bash
  python3 work_logs/coordinator.py resume <TASK_ID> --agent "<AGENT_NAME>"
  ```
  Read the printed **Resume Instructions** and examine the listed `dirty_files`.
- **To Create a New Task**:
  ```bash
  python3 work_logs/coordinator.py create \
    --title "<Short Descriptive Title>" \
    --agent "<Agent Name or ID>" \
    --files "comma,separated,target/files.ts" \
    --goal "<Clear objective of this task>"
  ```

### Step 3: During Execution (Checkpoints)
For multi-step or non-trivial implementations:
- After completing a milestone, test run, or substantial edit, record a checkpoint:
  ```bash
  python3 work_logs/coordinator.py checkpoint <TASK_ID> \
    --step "<What was just completed>" \
    --next-step "<Exact next action>" \
    --dirty-files "<Files modified or unverified>" \
    --notes "<Findings, test results, or warnings>"
  ```
- If additional files need to be edited during the task, add them to locks:
  ```bash
  python3 work_logs/coordinator.py checkpoint <TASK_ID> --step "..." --next-step "..." --add-files "new/file.ts"
  ```

### Step 4: Graceful Handoff When Stopping Midway (CRITICAL)
If you must stop work before completing the task (e.g., reaching turn limit, context limit, waiting on external input, or pausing):
1. **Never leave the codebase in an untracked broken state without documentation.**
2. Run the pause command:
   ```bash
   python3 work_logs/coordinator.py pause <TASK_ID> \
     --reason "<Why the task was paused>" \
     --next-step "<Exact next command or edit for resuming agent>" \
     --dirty-files "<Paths to files with in-flight modifications>"
   ```
3. This moves the task to `work_logs/paused/` and releases locks so the next agent can immediately resume exactly where you left off.

### Step 5: Task Completion
When all acceptance criteria are met and verified:
```bash
python3 work_logs/coordinator.py complete <TASK_ID> --summary "<Summary of changes and verification outcome>"
```
This releases all file locks, records completion history, and moves the task to `work_logs/completed/`.
