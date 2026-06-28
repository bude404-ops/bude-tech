import json
import time
import os
import threading
from datetime import datetime

# ==========================================================
# BudE Tech Brain v1.3 (COMPANY OS CORE)
# ==========================================================

SEED_FILE = "SEED.md"
MEMORY_FILE = "memory.json"
TASK_FILE = "tasks.json"

auto_enabled = True


# ----------------------------------------------------------
# MEMORY
# ----------------------------------------------------------

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {
            "logs": [],
            "completed_tasks": [],
            "workers": {},
            "github_actions": [],
            "solana": {
                "wallet": "NOT_CONNECTED",
                "revenue": 0,
                "transactions": []
            }
        }

    with open(MEMORY_FILE, "r") as f:
        return json.load(f)


def save_memory(m):
    with open(MEMORY_FILE, "w") as f:
        json.dump(m, f, indent=2)


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
    with open(TASK_FILE, "r") as f:
        return json.load(f)


def save_tasks(t):
    with open(TASK_FILE, "w") as f:
        json.dump(t, f, indent=2)


def create_task(text):
    t = load_tasks()
    t.append({
        "id": len(t)+1,
        "task": text,
        "status": "pending",
        "created": str(datetime.utcnow())
    })
    save_tasks(t)


# ----------------------------------------------------------
# WORKERS (DYNAMIC EVOLUTION)
# ----------------------------------------------------------

class Worker:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def run(self, task):
        log(f"{self.name} executing: {task['task']}")

        return f"{self.role} completed {task['task']}"


def get_workers():
    m = load_memory()

    # base workers
    base = {
        "CTO": Worker("CTO", "Architect"),
        "ENGINEER": Worker("Engineer", "Developer"),
        "QA": Worker("QA", "Tester"),
        "RESEARCH": Worker("Research", "Finder"),
        "FINANCE": Worker("Finance", "Revenue Analyst"),
    }

    # dynamic workers
    for w in m.get("workers", {}):
        base[w] = Worker(w, m["workers"][w]["role"])

    return base


def create_worker(name, role):
    m = load_memory()

    if "workers" not in m:
        m["workers"] = {}

    m["workers"][name] = {
        "role": role,
        "created": str(datetime.utcnow())
    }

    save_memory(m)
    log(f"NEW WORKER CREATED: {name} -> {role}")


def assign_worker(task):
    t = task["task"].lower()
    workers = get_workers()

    if "build" in t or "code" in t:
        return workers["ENGINEER"]
    if "test" in t:
        return workers["QA"]
    if "money" in t:
        return workers["FINANCE"]
    if "research" in t:
        return workers["RESEARCH"]

    return workers["CTO"]


# ----------------------------------------------------------
# GITHUB AUTONOMY LAYER (SIMULATED V1)
# ----------------------------------------------------------

def github_action(action, payload):
    m = load_memory()

    entry = {
        "time": str(datetime.utcnow()),
        "action": action,
        "payload": payload
    }

    m["github_actions"].append(entry)
    save_memory(m)

    log(f"GITHUB ACTION: {action} -> {payload}")


def process_github(task):
    t = task["task"].lower()

    if "repo" in t:
        github_action("create_repo", {"name": task["task"]})

    if "file" in t:
        github_action("create_file", {"content": task["task"]})


# ----------------------------------------------------------
# SOLANA LAYER (TRACKING ONLY)
# ----------------------------------------------------------

def solana_log(amount, note):
    m = load_memory()

    m["solana"]["revenue"] += amount
    m["solana"]["transactions"].append({
        "time": str(datetime.utcnow()),
        "amount": amount,
        "note": note
    })

    save_memory(m)

    log(f"SOLANA TX: +{amount} ({note})")


# ----------------------------------------------------------
# AUTO MODE
# ----------------------------------------------------------

def auto_mode():
    global auto_enabled

    log("AUTO MODE ACTIVE")

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

            process_github(task)

            if "earn" in task["task"].lower():
                solana_log(1.0, "simulated revenue")

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
        "workers": len(m["workers"]),
        "github_actions": len(m["github_actions"]),
        "solana_revenue": m["solana"]["revenue"],
        "auto": auto_enabled
    }


# ----------------------------------------------------------
# BOOT
# ----------------------------------------------------------

if __name__ == "__main__":
    log("BudE Tech V1.3 Booting")
    auto_mode()
