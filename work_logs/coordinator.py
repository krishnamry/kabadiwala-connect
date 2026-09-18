#!/usr/bin/env python3
"""
Agent Work Logs Coordinator
---------------------------
CLI and utility library to coordinate multi-agent work, manage file locks,
record checkpoints, pause/resume tasks across sessions, and prevent duplicate work.
"""

import argparse
import datetime
import json
import os
import re
import shutil
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ACTIVE_DIR = BASE_DIR / "active"
PAUSED_DIR = BASE_DIR / "paused"
COMPLETED_DIR = BASE_DIR / "completed"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
TEMPLATES_DIR = BASE_DIR / "templates"
CURRENT_STATE_FILE = BASE_DIR / "CURRENT_STATE.md"


def get_iso_timestamp():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_display_timestamp():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def ensure_dirs():
    for d in [ACTIVE_DIR, PAUSED_DIR, COMPLETED_DIR, CHECKPOINTS_DIR, TEMPLATES_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def parse_frontmatter(content: str):
    """Simple parser for YAML frontmatter between --- blocks."""
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not match:
        return {}, content
    yaml_text = match.group(1)
    body = match.group(2)
    meta = {}
    current_list_key = None

    for line in yaml_text.splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        list_match = re.match(r"^\s*-\s*(.*)$", line)
        if list_match and current_list_key:
            val = list_match.group(1).strip().strip('"').strip("'")
            meta[current_list_key].append(val)
            continue

        kv_match = re.match(r"^([a-zA-Z0-9_-]+):\s*(.*)$", line)
        if kv_match:
            k = kv_match.group(1).strip()
            v = kv_match.group(2).strip()
            if v == "" or v == "[]":
                meta[k] = []
                current_list_key = k if v == "" else None
            elif v.startswith("[") and v.endswith("]"):
                items = [x.strip().strip('"').strip("'") for x in v[1:-1].split(",") if x.strip()]
                meta[k] = items
                current_list_key = None
            elif v.lower() == "null":
                meta[k] = None
                current_list_key = None
            else:
                meta[k] = v.strip('"').strip("'")
                current_list_key = None
    return meta, body


def dump_frontmatter(meta: dict, body: str) -> str:
    lines = ["---"]
    for k, v in meta.items():
        if isinstance(v, list):
            if not v:
                lines.append(f"{k}: []")
            else:
                lines.append(f"{k}:")
                for item in v:
                    lines.append(f"  - {item}")
        elif v is None:
            lines.append(f"{k}: null")
        else:
            lines.append(f'{k}: "{v}"')
    lines.append("---")
    lines.append(body.strip("\n"))
    lines.append("")
    return "\n".join(lines)


def find_task_file(task_id: str):
    task_id_clean = task_id.strip()
    for directory in [ACTIVE_DIR, PAUSED_DIR, COMPLETED_DIR]:
        for file_path in directory.glob("*.md"):
            if file_path.stem == task_id_clean or file_path.name == task_id_clean or file_path.stem.startswith(task_id_clean):
                return file_path
    return None


def read_task(task_path: Path):
    content = task_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(content)
    return meta, body


def get_all_tasks():
    tasks = []
    for folder, state in [(ACTIVE_DIR, "ACTIVE"), (PAUSED_DIR, "PAUSED"), (COMPLETED_DIR, "COMPLETED")]:
        for f in sorted(folder.glob("*.md")):
            try:
                meta, _ = read_task(f)
                tasks.append({
                    "id": meta.get("id", f.stem),
                    "title": meta.get("title", f.stem),
                    "status": meta.get("status", state),
                    "agent": meta.get("assigned_agent", "unassigned"),
                    "updated_at": meta.get("updated_at", "unknown"),
                    "locked_files": meta.get("locked_files", []),
                    "path": f,
                    "folder_state": state
                })
            except Exception as e:
                tasks.append({
                    "id": f.stem,
                    "title": f"Error reading ({f.name})",
                    "status": "ERROR",
                    "agent": "unknown",
                    "updated_at": "unknown",
                    "locked_files": [],
                    "path": f,
                    "folder_state": state
                })
    return tasks


def update_current_state_dashboard():
    tasks = get_all_tasks()
    active_tasks = [t for t in tasks if t["folder_state"] == "ACTIVE"]
    paused_tasks = [t for t in tasks if t["folder_state"] == "PAUSED"]
    completed_tasks = [t for t in tasks if t["folder_state"] == "COMPLETED"]

    # Calculate active locked files
    locked_files_map = {}
    for t in active_tasks:
        for lf in t["locked_files"]:
            locked_files_map[lf] = t["id"]

    lines = [
        "# Current Multi-Agent Work State & Locks Dashboard",
        f"> *Last synced at: {get_display_timestamp()}*",
        "",
        "## 1. Active Tasks & Agents",
    ]

    if not active_tasks:
        lines.append("_No tasks currently running in active mode._")
    else:
        lines.append("| Task ID | Title | Assigned Agent | Last Updated | Locked Files |")
        lines.append("|---|---|---|---|---|")
        for t in active_tasks:
            locks = ", ".join(t["locked_files"]) if t["locked_files"] else "None"
            lines.append(f"| [`{t['id']}`](file://{t['path']}) | {t['title']} | `{t['agent']}` | {t['updated_at']} | `{locks}` |")

    lines.extend([
        "",
        "## 2. Paused / Interrupted Tasks (Ready to Resume)",
    ])
    if not paused_tasks:
        lines.append("_No tasks currently paused._")
    else:
        lines.append("| Task ID | Title | Previous Agent | Last Updated | File Link |")
        lines.append("|---|---|---|---|---|")
        for t in paused_tasks:
            lines.append(f"| [`{t['id']}`](file://{t['path']}) | {t['title']} | `{t['agent']}` | {t['updated_at']} | [Resume Task](file://{t['path']}) |")

    lines.extend([
        "",
        "## 3. Active File Locks (Collision Avoidance)",
    ])
    if not locked_files_map:
        lines.append("_No files currently locked._")
    else:
        lines.append("| Locked File Path | Held By Task |")
        lines.append("|---|---|")
        for path, tid in locked_files_map.items():
            lines.append(f"| `{path}` | `{tid}` |")

    lines.extend([
        "",
        "## 4. Recently Completed Tasks",
    ])
    if not completed_tasks:
        lines.append("_No completed tasks recorded yet._")
    else:
        lines.append(f"Total completed: **{len(completed_tasks)}**")
        lines.append("| Task ID | Title | Agent | Log File |")
        lines.append("|---|---|---|---|")
        for t in completed_tasks[-5:]:
            lines.append(f"| `{t['id']}` | {t['title']} | `{t['agent']}` | [`{t['path'].name}`](file://{t['path']}) |")

    CURRENT_STATE_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def cmd_list(args):
    ensure_dirs()
    tasks = get_all_tasks()
    if not tasks:
        print("No agent tasks recorded yet in work_logs/.")
        return

    print(f"\n{'STATUS':<12} {'TASK ID':<28} {'AGENT':<18} {'UPDATED':<22} {'TITLE'}")
    print("-" * 105)
    for t in tasks:
        print(f"{t['folder_state']:<12} {t['id']:<28} {t['agent']:<18} {t['updated_at']:<22} {t['title']}")
    print("-" * 105)
    print(f"Total: {len(tasks)} (Active: {sum(1 for t in tasks if t['folder_state'] == 'ACTIVE')}, "
          f"Paused: {sum(1 for t in tasks if t['folder_state'] == 'PAUSED')}, "
          f"Completed: {sum(1 for t in tasks if t['folder_state'] == 'COMPLETED')})\n")


def cmd_show(args):
    ensure_dirs()
    task_path = find_task_file(args.task_id)
    if not task_path:
        print(f"❌ Error: Task '{args.task_id}' not found.")
        sys.exit(1)

    meta, body = read_task(task_path)
    print("\n" + "=" * 80)
    print(f"TASK: {meta.get('id', task_path.stem)} [{meta.get('status', 'UNKNOWN')}]")
    print("=" * 80)
    print(f"Title:         {meta.get('title', 'Untitled')}")
    print(f"Agent:         {meta.get('assigned_agent', 'unassigned')}")
    print(f"Created:       {meta.get('created_at', 'unknown')}")
    print(f"Updated:       {meta.get('updated_at', 'unknown')}")
    print(f"Completed:     {meta.get('completed_at', 'None')}")
    print(f"File Location: {task_path}")
    print(f"Locked Files:  {', '.join(meta.get('locked_files', [])) or 'None'}")
    print("-" * 80)

    # Print resume checkpoint if available
    m = re.search(r"(## 3\. Resume Checkpoint.*?(?=## 4\.|$))", body, re.DOTALL)
    if m:
        print(m.group(1).strip())
        print("-" * 80)

    # Print recent execution log if available
    if "## 4. Execution History & Action Log" in body:
        m_log = re.search(r"## 4\. Execution History & Action Log.*?(?=## 5\.|$)", body, re.DOTALL)
        if m_log:
            print(m_log.group(0).strip())
            print("-" * 80)
    print()


def cmd_create(args):
    ensure_dirs()
    today_str = datetime.datetime.now().strftime("%Y%m%d")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", args.title.lower()).strip("-")[:30]
    existing = list(BASE_DIR.glob(f"**/*{today_str}*.md"))
    counter = len(existing) + 1
    task_id = f"TASK-{today_str}-{counter:03d}-{slug}"

    locked_files = [f.strip() for f in args.files.split(",") if f.strip()] if args.files else []

    # Check for file collisions
    active_tasks = [t for t in get_all_tasks() if t["folder_state"] == "ACTIVE"]
    for at in active_tasks:
        collisions = set(locked_files).intersection(set(at.get("locked_files", [])))
        if collisions:
            print(f"⚠️ WARNING: File collision detected! The following files are currently locked by active task '{at['id']}':")
            for c in collisions:
                print(f"   - {c}")
            if not args.force:
                print("Use --force to proceed anyway, or coordinate with the active task.")
                return

    template_file = TEMPLATES_DIR / "task_template.md"
    if template_file.exists():
        template_text = template_file.read_text(encoding="utf-8")
        meta, body = parse_frontmatter(template_text)
    else:
        meta = {}
        body = "# Task\n\n## 1. Context\n\n## 2. Checklist\n\n## 3. Resume Checkpoint\n\n## 4. Execution History"

    meta["id"] = task_id
    meta["title"] = args.title
    meta["status"] = "IN_PROGRESS"
    meta["assigned_agent"] = args.agent or "primary-agent"
    meta["created_at"] = get_iso_timestamp()
    meta["updated_at"] = get_iso_timestamp()
    meta["completed_at"] = None
    meta["locked_files"] = locked_files

    # Replace title placeholder in body
    body = re.sub(r"# Task:.*?\n", f"# Task: [{task_id}] {args.title}\n", body)
    if args.goal:
        body = re.sub(r"- \*\*Goal\*\*:.*?\n", f"- **Goal**: {args.goal}\n", body)

    file_path = ACTIVE_DIR / f"{task_id}.md"
    file_path.write_text(dump_frontmatter(meta, body), encoding="utf-8")
    update_current_state_dashboard()

    print(f"✅ Created active task: {task_id}")
    print(f"   Path: {file_path}")
    print(f"   Assigned: {meta['assigned_agent']}")
    if locked_files:
        print(f"   Locked files: {', '.join(locked_files)}")


def cmd_checkpoint(args):
    ensure_dirs()
    task_path = find_task_file(args.task_id)
    if not task_path:
        print(f"❌ Error: Task '{args.task_id}' not found.")
        sys.exit(1)

    meta, body = read_task(task_path)
    now_iso = get_iso_timestamp()
    meta["updated_at"] = now_iso
    if args.agent:
        meta["assigned_agent"] = args.agent

    # Dynamically add locked files if requested
    if getattr(args, "add_files", None):
        new_files = [f.strip() for f in args.add_files.split(",") if f.strip()]
        active_tasks = [t for t in get_all_tasks() if t["folder_state"] == "ACTIVE" and t["id"] != meta.get("id")]
        for at in active_tasks:
            collisions = set(new_files).intersection(set(at.get("locked_files", [])))
            if collisions:
                print(f"⚠️ WARNING: Collision on new files with active task '{at['id']}': {', '.join(collisions)}")
                if not getattr(args, "force", False):
                    print("Use --force to add anyway.")
                    return
        existing_locks = set(meta.get("locked_files", []))
        existing_locks.update(new_files)
        meta["locked_files"] = sorted(list(existing_locks))

    # Record structured checkpoint JSON
    chk_id = f"CHK-{meta['id']}-{int(datetime.datetime.now().timestamp())}"
    chk_data = {
        "checkpoint_id": chk_id,
        "task_id": meta["id"],
        "timestamp": now_iso,
        "agent_id": meta.get("assigned_agent", "unknown"),
        "status": meta.get("status", "IN_PROGRESS"),
        "current_step": args.step or "",
        "next_step": args.next_step or "",
        "notes": args.notes or "",
        "dirty_files": [f.strip() for f in args.dirty_files.split(",")] if args.dirty_files else []
    }
    chk_file = CHECKPOINTS_DIR / f"{chk_id}.json"
    chk_file.write_text(json.dumps(chk_data, indent=2), encoding="utf-8")

    # Update Resume Checkpoint in markdown body
    if args.step or args.next_step or args.notes:
        resume_block = [
            "## 3. Resume Checkpoint (CRITICAL FOR MIDWAY CONTINUATION)",
            f"> **Updated at: {get_display_timestamp()} by `{meta.get('assigned_agent', 'agent')}`**",
            "",
            f"- **Current State**: {args.step or 'In progress'}",
            f"- **Immediate Next Step**: {args.next_step or 'Continue work'}",
            f"- **Unfinished / Dirty Files**:",
        ]
        if args.dirty_files:
            for df in args.dirty_files.split(","):
                if df.strip():
                    resume_block.append(f"  - `{df.strip()}`")
        else:
            resume_block.append("  - None specified")

        resume_block.append(f"- **Notes / Blockers**: {args.notes or 'None'}\n")

        # Replace section 3
        pattern = r"## 3\. Resume Checkpoint.*?(?=## 4\.|$)"
        if re.search(pattern, body, re.DOTALL):
            body = re.sub(pattern, "\n".join(resume_block) + "\n", body, flags=re.DOTALL)
        else:
            body += "\n\n" + "\n".join(resume_block)

    # Append to Action Log table in markdown body
    log_row = f"| {get_display_timestamp()} | {args.step or 'Progress update'} | {args.dirty_files or 'None'} | {args.notes or 'OK'} |"
    if "## 4. Execution History & Action Log" in body:
        if "| Timestamp (UTC/Local) |" in body:
            parts = body.split("## 5. Artifacts")
            parts[0] = parts[0].rstrip() + "\n" + log_row + "\n\n"
            body = "## 5. Artifacts".join(parts)
        else:
            body = body.replace("## 4. Execution History & Action Log",
                                f"## 4. Execution History & Action Log\n\n| Timestamp | Action | Files | Outcome |\n|---|---|---|---|\n{log_row}\n")

    task_path.write_text(dump_frontmatter(meta, body), encoding="utf-8")
    update_current_state_dashboard()
    print(f"✅ Checkpoint saved for '{meta['id']}'")
    print(f"   Checkpoint file: {chk_file}")


def cmd_pause(args):
    ensure_dirs()
    task_path = find_task_file(args.task_id)
    if not task_path:
        print(f"❌ Error: Task '{args.task_id}' not found.")
        sys.exit(1)

    meta, body = read_task(task_path)
    now_iso = get_iso_timestamp()
    meta["status"] = "PAUSED"
    meta["updated_at"] = now_iso

    resume_block = [
        "## 3. Resume Checkpoint (CRITICAL FOR MIDWAY CONTINUATION)",
        f"> ⏸️ **PAUSED at: {get_display_timestamp()} by `{meta.get('assigned_agent', 'agent')}`**",
        "",
        f"- **Pause Reason**: {args.reason or 'Paused by agent'}",
        f"- **Immediate Next Step on Resume**: {args.next_step or 'Check last action log and resume checklist'}",
        f"- **Unfinished / Dirty Files**:",
    ]
    if args.dirty_files:
        for df in args.dirty_files.split(","):
            if df.strip():
                resume_block.append(f"  - `{df.strip()}`")
    else:
        resume_block.append("  - None specified")
    resume_block.append(f"- **Notes / Blockers**: {args.reason or 'None'}\n")

    pattern = r"## 3\. Resume Checkpoint.*?(?=## 4\.|$)"
    if re.search(pattern, body, re.DOTALL):
        body = re.sub(pattern, "\n".join(resume_block) + "\n", body, flags=re.DOTALL)
    else:
        body += "\n\n" + "\n".join(resume_block)

    # Append to log
    log_row = f"| {get_display_timestamp()} | PAUSED TASK | {args.dirty_files or 'None'} | Reason: {args.reason or 'Manual pause'} |"
    if "## 4. Execution History & Action Log" in body:
        parts = body.split("## 5. Artifacts")
        parts[0] = parts[0].rstrip() + "\n" + log_row + "\n\n"
        body = "## 5. Artifacts".join(parts)

    target_path = PAUSED_DIR / task_path.name
    if task_path != target_path:
        task_path.unlink()
    target_path.write_text(dump_frontmatter(meta, body), encoding="utf-8")
    update_current_state_dashboard()

    print(f"⏸️ Task '{meta['id']}' marked as PAUSED and moved to paused/")
    print(f"   Reason: {args.reason}")
    print(f"   Next step: {args.next_step}")
    print(f"   File: {target_path}")


def cmd_resume(args):
    ensure_dirs()
    task_path = find_task_file(args.task_id)
    if not task_path:
        print(f"❌ Error: Task '{args.task_id}' not found.")
        sys.exit(1)

    meta, body = read_task(task_path)
    now_iso = get_iso_timestamp()

    # Check collisions for locked files on resume
    locked_files = meta.get("locked_files", [])
    if locked_files:
        active_tasks = [t for t in get_all_tasks() if t["folder_state"] == "ACTIVE" and t["id"] != meta.get("id")]
        for at in active_tasks:
            collisions = set(locked_files).intersection(set(at.get("locked_files", [])))
            if collisions:
                print(f"⚠️ WARNING: Collision detected on resume! The following files are locked by '{at['id']}':")
                for c in collisions:
                    print(f"   - {c}")
                if not getattr(args, "force", False):
                    print("Cannot resume without releasing those files or specifying --force.")
                    sys.exit(1)

    meta["status"] = "IN_PROGRESS"
    meta["updated_at"] = now_iso
    if args.agent:
        meta["assigned_agent"] = args.agent

    log_row = f"| {get_display_timestamp()} | RESUMED TASK | None | Resumed by `{meta['assigned_agent']}` |"
    if "## 4. Execution History & Action Log" in body:
        parts = body.split("## 5. Artifacts")
        parts[0] = parts[0].rstrip() + "\n" + log_row + "\n\n"
        body = "## 5. Artifacts".join(parts)

    target_path = ACTIVE_DIR / task_path.name
    if task_path != target_path:
        task_path.unlink()
    target_path.write_text(dump_frontmatter(meta, body), encoding="utf-8")
    update_current_state_dashboard()

    print(f"▶️ Task '{meta['id']}' RESUMED and moved to active/")
    print(f"   Assigned Agent: {meta['assigned_agent']}")
    print(f"   File: {target_path}")

    # Extract and display resume checkpoint
    m = re.search(r"## 3\. Resume Checkpoint.*?(?=## 4\.|$)", body, re.DOTALL)
    if m:
        print("\n--- RESUME INSTRUCTIONS FOR AGENT ---")
        print(m.group(0).strip())
        print("------------------------------------\n")


def cmd_complete(args):
    ensure_dirs()
    task_path = find_task_file(args.task_id)
    if not task_path:
        print(f"❌ Error: Task '{args.task_id}' not found.")
        sys.exit(1)

    meta, body = read_task(task_path)
    now_iso = get_iso_timestamp()
    meta["status"] = "COMPLETED"
    meta["updated_at"] = now_iso
    meta["completed_at"] = now_iso
    # Release locked files
    meta["locked_files"] = []

    log_row = f"| {get_display_timestamp()} | COMPLETED TASK | None | Summary: {args.summary or 'Done'} |"
    if "## 4. Execution History & Action Log" in body:
        parts = body.split("## 5. Artifacts")
        parts[0] = parts[0].rstrip() + "\n" + log_row + "\n\n"
        body = "## 5. Artifacts".join(parts)

    if args.summary:
        body += f"\n\n## Completion Summary\n> Completed at {get_display_timestamp()}\n\n{args.summary}\n"

    target_path = COMPLETED_DIR / task_path.name
    if task_path != target_path:
        task_path.unlink()
    target_path.write_text(dump_frontmatter(meta, body), encoding="utf-8")
    update_current_state_dashboard()

    print(f"🎉 Task '{meta['id']}' marked as COMPLETED and moved to completed/")
    print(f"   Locks released. Path: {target_path}")


def cmd_sync(args):
    ensure_dirs()
    update_current_state_dashboard()
    print(f"✅ Synced state dashboard at: {CURRENT_STATE_FILE}")


def main():
    parser = argparse.ArgumentParser(description="Agent Work Logs Coordinator for Multi-Agent Tracking & Resumption")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # list
    p_list = subparsers.add_parser("list", help="List all agent tasks by status")

    # show
    p_show = subparsers.add_parser("show", help="Display full details and resume checkpoint of a task")
    p_show.add_argument("task_id", help="Task ID or filename stem")

    # create
    p_create = subparsers.add_parser("create", help="Create a new active task")
    p_create.add_argument("--title", required=True, help="Title of the task")
    p_create.add_argument("--agent", default="agent", help="Assigned agent ID or name")
    p_create.add_argument("--files", default="", help="Comma-separated list of locked file paths")
    p_create.add_argument("--goal", default="", help="High-level goal description")
    p_create.add_argument("--force", action="store_true", help="Force creation even if files are locked by another task")

    # checkpoint
    p_chk = subparsers.add_parser("checkpoint", help="Record progress checkpoint and update resume point")
    p_chk.add_argument("task_id", help="Task ID or filename stem")
    p_chk.add_argument("--step", required=True, help="Description of current step completed or in progress")
    p_chk.add_argument("--next-step", required=True, help="Exact next action for resuming agent")
    p_chk.add_argument("--notes", default="", help="Blockers, findings, or notes")
    p_chk.add_argument("--dirty-files", default="", help="Comma-separated files with in-progress changes")
    p_chk.add_argument("--add-files", default="", help="Comma-separated files to add to task's locked files")
    p_chk.add_argument("--agent", default="", help="Agent recording checkpoint")
    p_chk.add_argument("--force", action="store_true", help="Force adding locked files even if collision")

    # pause
    p_pause = subparsers.add_parser("pause", help="Pause task and move to paused/ with resume notes")
    p_pause.add_argument("task_id", help="Task ID or filename stem")
    p_pause.add_argument("--reason", required=True, help="Reason for pausing or stopping midway")
    p_pause.add_argument("--next-step", required=True, help="Exact instruction to resume")
    p_pause.add_argument("--dirty-files", default="", help="Files currently modified or half-done")

    # resume
    p_resume = subparsers.add_parser("resume", help="Resume a paused task and print next steps")
    p_resume.add_argument("task_id", help="Task ID or filename stem")
    p_resume.add_argument("--agent", default="", help="Agent resuming the task")
    p_resume.add_argument("--force", action="store_true", help="Force resume even if locked files collide with active task")

    # complete
    p_comp = subparsers.add_parser("complete", help="Complete task, release locks, and move to completed/")
    p_comp.add_argument("task_id", help="Task ID or filename stem")
    p_comp.add_argument("--summary", default="", help="Summary of work accomplished")

    # sync
    p_sync = subparsers.add_parser("sync", help="Refresh CURRENT_STATE.md dashboard")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    dispatch = {
        "list": cmd_list,
        "show": cmd_show,
        "create": cmd_create,
        "checkpoint": cmd_checkpoint,
        "pause": cmd_pause,
        "resume": cmd_resume,
        "complete": cmd_complete,
        "sync": cmd_sync,
    }

    cmd_fn = dispatch.get(args.command)
    if cmd_fn:
        cmd_fn(args)


if __name__ == "__main__":
    main()
