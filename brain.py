import json
import os
import requests
from datetime import datetime

# -----------------------------
# LLM CONNECTOR (FREE)
# -----------------------------
def llm(prompt):
    try:
        r = requests.post(
            "https://text.pollinations.ai/openai",
            json={
                "model": "openai",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=40
        )
        return r.json()["choices"][0]["message"]["content"]
    except:
        return "fallback"

# -----------------------------
# LOAD SYSTEM STATE
# -----------------------------
def load(path, default):
    try:
        return json.load(open(path))
    except:
        return default

def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(data, open(path, "w"), indent=2)

# -----------------------------
# EMPLOYEE SYSTEM
# -----------------------------
def init_employees():
    return {
        "builder_1": {"role": "frontend", "score": 1.0, "tasks": 0},
        "builder_2": {"role": "backend", "score": 1.0, "tasks": 0},
        "qa_1": {"role": "tester", "score": 1.0, "tasks": 0},
        "analyst_1": {"role": "logic", "score": 1.0, "tasks": 0}
    }

# -----------------------------
# CEO (DECISION MAKER)
# -----------------------------
def ceo(company_state):
    return llm(f"""
You are CEO of BudE Tech AI Company.

Company state:
{company_state}

Decide ONE task to improve system.

Return JSON:
{{
  "task": "",
  "type": "build|fix|improve",
  "priority": "low|medium|high"
}}
""")

# -----------------------------
# TASK ASSIGNMENT ENGINE
# -----------------------------
def assign_task(task, employees):
    # simple routing logic
    role_map = {
        "build": "builder_1",
        "fix": "qa_1",
        "improve": "builder_2"
    }

    worker = role_map.get(task.get("type", "build"), "builder_1")

    task_obj = {
        "id": datetime.now().isoformat(),
        "task": task["task"],
        "type": task["type"],
        "priority": task["priority"],
        "assigned_to": worker,
        "status": "pending"
    }

    return task_obj

# -----------------------------
# EMPLOYEE EXECUTION
# -----------------------------
def execute_task(task, employees):
    worker = task["assigned_to"]

    employees[worker]["tasks"] += 1

    result = llm(f"""
You are employee {worker}.
Role: {employees[worker]['role']}

Task:
{task['task']}

Return solution or code.
""")

    task["status"] = "done"
    task["result"] = result

    return task, employees

# -----------------------------
# DASHBOARD BUILDER
# -----------------------------
def build_dashboard(company, employees, tasks):
    os.makedirs("dashboard", exist_ok=True)

    page = f"""
    <html>
    <head><title>BudE V9 Workforce</title></head>
    <body style="font-family:Arial;background:#111;color:#fff;">
        <h1>🧠 BudE Tech V9 - CEO Dashboard</h1>

        <h2>Company State</h2>
        <pre>{json.dumps(company, indent=2)}</pre>

        <h2>Employees</h2>
        <pre>{json.dumps(employees, indent=2)}</pre>

        <h2>Tasks</h2>
        <pre>{json.dumps(tasks, indent=2)}</pre>
    </body>
    </html>
    """

    with open("dashboard/index.html", "w") as f:
        f.write(page)

# -----------------------------
# MAIN LOOP
# -----------------------------
def run():
    company = load("core/company.json", {"version": 9, "goal": "AI workforce OS"})
    employees = load("core/employees.json", init_employees())
    tasks = load("core/tasks.json", [])

    # CEO creates task
    raw_task = ceo(company)

    try:
        task = json.loads(raw_task)
    except:
        task = {"task": "optimize system", "type": "build", "priority": "medium"}

    # Assign task
    task_obj = assign_task(task, employees)
    tasks.append(task_obj)

    # Execute oldest task
    if tasks:
        tasks[0], employees = execute_task(tasks[0], employees)

    # Save system state
    company["last_run"] = str(datetime.now())
    company["version"] += 1

    save("core/company.json", company)
    save("core/employees.json", employees)
    save("core/tasks.json", tasks)

    build_dashboard(company, employees, tasks)

if __name__ == "__main__":
    run()
