import json
import time
import os
import threading
from datetime import datetime

import update_engine
import sandbox
import safety_rules

# ==========================================================
# BudE Tech Brain V2.1 (AUTO UPDATE INTEGRATED)
# ==========================================================

auto_enabled = True

MEMORY_FILE = "memory.json"
TASK_FILE = "tasks.json"

UPGRADE_KEYWORDS = ["upgrade", "improve", "optimize", "better", "fix", "update"]


# ----------------------------------------------------------
# MEMORY
# ----------------------------------------------------------

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {
            "logs": [],
            "completed_tasks": [],
            "upgrades_generated": 0,
            "auto_updates_applied": 0
        }
    return json.load(open(MEMORY_FILE))


def save_memory(m):
    json.dump(m, open(MEMORY_FILE, "w"), indent=2)


def log(msg):
    m = load_memory()
    m["logs"].append({
        "time": str(datetime.utcnow()),
        "msg": msg
    })
    save_memory(m)
    print("[BUD-E]", msg)


# ----------------------------------------------------------
# TASKS
# ----------------------------------------------------------

def load_tasks():
    if not os.path.exists(TASK_FILE):
        return []
    return json.load(open(TASK_FILE))


def save_tasks(t):
    json.dump(t, open(TASK_FILE, "w"), indent=2)


def create_task(text):
    t = load_tasks()

    t.append({
        "id": len(t) + 1,
        "task": text,
        "status": "pending",
        "created": str(datetime.utcnow())
    })

    save_tasks(t)


# ----------------------------------------------------------
# WORKERS
# ----------------------------------------------------------

class Worker:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def run(self, task):
        log(f"{self.name} running: {task['task']}")
        return f"{self.role} completed {task['task']}"


def assign_worker(task):
    t = task["task"].lower()

    if "code" in t or "build" in t:
        return Worker("Engineer", "Developer")
    if "test" in t:
        return Worker("QA", "Tester")
    if "money" in t:
        return Worker("Finance", "Analyst")

    return Worker("CTO", "Architect")


# ----------------------------------------------------------
# SELF-UPGRADE DETECTION
# ----------------------------------------------------------

def needs_upgrade(task_text):
    t = task_text.lower()
    return any(k in t for k in UPGRADE_KEYWORDS)


def build_upgrade(task_text):
    """
    Creates structured upgrade and sends to update engine
    """

    change = {
        "file": "brain.py",
        "content": "# AI generated update placeholder\n# task: " + task_text + "\n"
    }

    safe, reason = sandbox.run_test(str(change))

    if not safe:
        log(f"UPGRADE BLOCKED: {reason}")
        return

    if not safety_rules.is_safe(str(change)):
        log("UPGRADE BLOCKED (SAFETY RULES)")
        return

    update_engine.add_upgrade(
        title="AI Self Upgrade",
        description=task_text,
        changes=[change]
    )

    m = load_memory()
    m["upgrades_generated"] += 1
    save_memory(m)

    log("UPGRADE QUEUED → update_engine")


# ----------------------------------------------------------
# AUTO EXECUTION LOOP
# ----------------------------------------------------------

def auto_mode():
    global auto_enabled

    log("AUTO MODE V2.1 STARTED")

    while True:

        if not auto_enabled:
            time.sleep(2)
            continue

        tasks = load_tasks()
        pending = [t for t in tasks if t["status"] == "pending"]

        if not pending:
            time.sleep(2)
            continue

        for task in pending:

            worker = assign_worker(task)
            result = worker.run(task)

            m = load_memory()
            m["completed_tasks"].append({
                "task": task,
                "result": result
            })

            save_memory(m)

            # SELF-UPGRADE HOOK
            if needs_upgrade(task["task"]):
                build_upgrade(task["task"])

            task["status"] = "done"

        save_tasks(tasks)

        time.sleep(2)


# ----------------------------------------------------------
# STATUS
# ----------------------------------------------------------

def get_status():
    m = load_memory()
    t = load_tasks()

    return {
        "tasks": len(t),
        "completed": len(m["completed_tasks"]),
        "upgrades_generated": m.get("upgrades_generated", 0),
        "auto": auto_enabled
    }


# ----------------------------------------------------------
# BOOT
# ----------------------------------------------------------

if __name__ == "__main__":
    log("BudE Tech V2.1 Booted")
    auto_mode()
