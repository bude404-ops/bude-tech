import json
import time
import os
import threading
from datetime import datetime

# ==========================================================
# BudE Tech Brain v1.2 (FULL REPLACE)
# ==========================================================

SEED_FILE = "SEED.md"
MEMORY_FILE = "memory.json"
TASK_FILE = "tasks.json"

auto_enabled = True


# ----------------------------------------------------------
# LOAD SEED
# ----------------------------------------------------------

def load_seed():
    if not os.path.exists(SEED_FILE):
        return "NO SEED FOUND"
    with open(SEED_FILE, "r") as f:
        return f.read()


# ----------------------------------------------------------
# MEMORY SYSTEM
# ----------------------------------------------------------

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        return {
            "goals": [],
            "completed_tasks": [],
            "failed_tasks": [],
            "ideas": [],
            "logs": []
        }
    with open(MEMORY_FILE, "r") as f:
        return json.load(f)


def save_memory(memory):
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=2)


def log(message):
    memory = load_memory()

    entry = {
        "time": str(datetime.utcnow()),
        "message": message
    }

    memory["logs"].append(entry)

    print("[LOG]", message)
    save_memory(memory)


# ----------------------------------------------------------
# TASK SYSTEM
# ----------------------------------------------------------

def load_tasks():
    if not os.path.exists(TASK_FILE):
        return []
    with open(TASK_FILE, "r") as f:
        return json.load(f)


def save_tasks(tasks):
    with open(TASK_FILE, "w") as f:
        json.dump(tasks, f, indent=2)


def create_task(task_text):
    tasks = load_tasks()

    tasks.append({
        "id": len(tasks) + 1,
        "task": task_text,
        "status": "pending",
        "created": str(datetime.utcnow())
    })

    save_tasks(tasks)


def complete_task(task, tasks):
    task["status"] = "completed"
    task["completed"] = str(datetime.utcnow())
    save_tasks(tasks)


# ----------------------------------------------------------
# WORKERS
# ----------------------------------------------------------

class Worker:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def run(self, task):
        log(f"{self.name} working on: {task['task']}")

        result = f"{self.role} completed: {task['task']}"

        memory = load_memory()
        memory["completed_tasks"].append({
            "task": task,
            "result": result,
            "time": str(datetime.utcnow())
        })
        save_memory(memory)

        return result


workers = {
    "ENGINEER": Worker("Engineer", "Developer"),
    "CTO": Worker("CTO", "Architect"),
    "QA": Worker("QA", "Tester"),
    "RESEARCH": Worker("Research", "Finder"),
    "FINANCE": Worker("Finance", "Tracker"),
    "SECURITY": Worker("Security", "Protector"),
}


def assign_worker(task):
    t = task["task"].lower()

    if "build" in t or "code" in t:
        return workers["ENGINEER"]
    if "test" in t:
        return workers["QA"]
    if "research" in t:
        return workers["RESEARCH"]
    if "money" in t or "revenue" in t:
        return workers["FINANCE"]
    if "secure" in t:
        return workers["SECURITY"]

    return workers["CTO"]


# ----------------------------------------------------------
# AUTO MODE
# ----------------------------------------------------------

def auto_mode():
    global auto_enabled

    log("AUTO MODE STARTED")

    while True:

        if not auto_enabled:
            time.sleep(2)
            continue

        tasks = load_tasks()
        pending = [t for t in tasks if t["status"] == "pending"]

        if not pending:
            log("Idle - no tasks")
            time.sleep(3)
            continue

        for task in pending:
            worker = assign_worker(task)
            worker.run(task)

            tasks = load_tasks()
            for t in tasks:
                if t["id"] == task["id"]:
                    t["status"] = "completed"

            save_tasks(tasks)

        time.sleep(2)


# ----------------------------------------------------------
# STATUS
# ----------------------------------------------------------

def get_status():
    memory = load_memory()
    tasks = load_tasks()

    return {
        "tasks": len(tasks),
        "completed": len(memory["completed_tasks"]),
        "logs": len(memory["logs"]),
        "auto": auto_enabled
    }


# ----------------------------------------------------------
# BOOT
# ----------------------------------------------------------

if __name__ == "__main__":
    print(load_seed()[:200])
    log("Brain booted")
    auto_mode()
