import json
import time
import os
from datetime import datetime

# ==========================================================
# BudE Tech Brain v1.0
# Core Autonomous Runtime (SAFE FOUNDATION LAYER)
# ==========================================================

SEED_FILE = "SEED.md"
MEMORY_FILE = "memory.json"
TASK_FILE = "tasks.json"

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


def log(memory, message):
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


def add_task(tasks, task):
    tasks.append({
        "id": len(tasks) + 1,
        "task": task,
        "status": "pending",
        "created": str(datetime.utcnow())
    })
    return tasks


def complete_task(task):
    task["status"] = "completed"
    task["completed"] = str(datetime.utcnow())
    return task


# ----------------------------------------------------------
# WORKER SYSTEM (SIMULATED AGENTS)
# ----------------------------------------------------------

class Worker:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def run(self, task, memory):
        log(memory, f"{self.name} ({self.role}) working on: {task['task']}")

        # SIMPLE SIMULATION LOGIC (V1)
        result = f"{self.role} completed: {task['task']}"

        memory["completed_tasks"].append({
            "task": task,
            "result": result,
            "time": str(datetime.utcnow())
        })

        return result


# Create core workers
workers = {
    "CEO": Worker("CEO", "Planner"),
    "CTO": Worker("CTO", "Architect"),
    "ENGINEER": Worker("Engineer", "Developer"),
    "RESEARCH": Worker("Research", "Finder"),
    "QA": Worker("QA", "Tester"),
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
# AUTO MODE ENGINE
# ----------------------------------------------------------

def auto_mode():
    memory = load_memory()
    tasks = load_tasks()

    log(memory, "AUTO MODE STARTED")

    while True:
        tasks = load_tasks()

        pending = [t for t in tasks if t["status"] == "pending"]

        if not pending:
            log(memory, "No pending tasks. Idle cycle.")
            time.sleep(5)
            continue

        for task in pending:
            worker = assign_worker(task)
            result = worker.run(task, memory)

            log(memory, f"Result: {result}")

            task = complete_task(task)

        save_tasks(tasks)
        save_memory(memory)

        time.sleep(2)


# ----------------------------------------------------------
# SIMPLE INTERFACE
# ----------------------------------------------------------

def create_task(task_text):
    tasks = load_tasks()
    tasks = add_task(tasks, task_text)
    save_tasks(tasks)


def status():
    memory = load_memory()
    tasks = load_tasks()

    print("\n===== BUD E TECH STATUS =====")
    print("Tasks:", len(tasks))
    print("Logs:", len(memory["logs"]))
    print("Completed:", len(memory["completed_tasks"]))
    print("=============================\n")


# ----------------------------------------------------------
# BOOT
# ----------------------------------------------------------

if __name__ == "__main__":
    print("BudE Tech Brain v1 Booting...")
    print("Loading Seed...")
    print(load_seed()[:300], "...\n")

    status()

    # DEMO TASK (remove later)
    create_task("Build initial dashboard UI")

    # START AUTO MODE
    auto_mode()
