import json
import os
from datetime import datetime

def load(path, default):
    try:
        return json.load(open(path))
    except:
        return default

def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

# ---------------- STATE ----------------
def init_state():
    return {
        "version": 17,
        "goal": "Production SaaS AI OS",
        "paused": False,
        "last_run": str(datetime.now()),
        "pending_action": None
    }

def init_employees():
    return {
        "builder_1": {"role": "frontend", "tasks": 0},
        "builder_2": {"role": "backend", "tasks": 0},
        "qa_1": {"role": "tester", "tasks": 0},
        "analyst_1": {"role": "logic", "tasks": 0}
    }

# ---------------- TASKS ----------------
def create_task(text, assigned="builder_1"):
    return {
        "id": str(datetime.now()),
        "task": text,
        "assigned_to": assigned,
        "status": "backlog",
        "result": None
    }

def execute(task, employees):
    worker = task["assigned_to"]
    employees[worker]["tasks"] += 1
    task["status"] = "done"
    task["result"] = f"Completed: {task['task']}"
    return task, employees

# ---------------- CEO ----------------
def ceo(state):
    ideas = [
        "Improve mobile UX system",
        "Enhance Kanban workflow",
        "Optimize task execution engine",
        "Add AI suggestion layer"
    ]
    return ideas[state["version"] % len(ideas)]

# ---------------- ACTION SYSTEM ----------------
def handle_action(action, tasks, activity):
    if not action:
        return tasks, activity

    if action["type"] == "create":
        tasks.append(create_task(action["text"], action.get("assigned", "builder_1")))
        activity.append({"event": f"Created task: {action['text']}"})

    if action["type"] == "approve":
        for t in tasks:
            if t["status"] == "done":
                t["status"] = "approved"
                break

    if action["type"] == "reject":
        for t in tasks:
            if t["status"] == "done":
                t["status"] = "rejected"
                break

    return tasks, activity

# ---------------- MAIN LOOP ----------------
def run():
    state = load("core/state.json", init_state())
    employees = load("core/employees.json", init_employees())
    tasks = load("core/tasks.json", [])
    activity = load("core/activity.json", [])

    # CEO generates task
    if not state["paused"]:
        tasks.append(create_task(ceo(state)))

    # auto progress system
    for t in tasks:
        if t["status"] == "backlog":
            t["status"] = "progress"
        elif t["status"] == "progress":
            t, employees = execute(t, employees)

    # frontend action hook
    action = state.get("pending_action")
    if action:
        tasks, activity = handle_action(action, tasks, activity)
        state["pending_action"] = None

    state["version"] += 1
    state["last_run"] = str(datetime.now())

    save("core/state.json", state)
    save("core/employees.json", employees)
    save("core/tasks.json", tasks)
    save("core/activity.json", activity)

if __name__ == "__main__":
    run()
