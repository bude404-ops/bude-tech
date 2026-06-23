#!/usr/bin/env python3
"""
BudE Evolution Engine v0.2
Repo: https://github.com/bude404-ops/Bude-Tech
100% free — Groq only, no paid APIs
"""

import os
import json
import sys
import requests
from datetime import datetime

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
MEMORY_PATH = os.path.join(REPO_ROOT, "system", "memory.json")
LOG_PATH = os.path.join(REPO_ROOT, "system", "evolution.log")
QUEUE_PATH = os.path.join(REPO_ROOT, "system", "queue.json")
GITHUB_REPO = "bude404-ops/Bude-Tech"

# Groq free tier only
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def log_event(msg, level="INFO"):
    ts = datetime.utcnow().isoformat()
    entry = f"[{ts}] [{level}] {msg}\n"
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(entry)
    print(entry.strip())

def load_memory():
    if os.path.exists(MEMORY_PATH):
        with open(MEMORY_PATH, "r") as f:
            return json.load(f)
    return {"evolution_cycles": 0, "last_cycle": None, "errors": [], "tasks": [], "repo": GITHUB_REPO}

def save_memory(mem):
    os.makedirs(os.path.dirname(MEMORY_PATH), exist_ok=True)
    with open(MEMORY_PATH, "w") as f:
        json.dump(mem, f, indent=2)

def process_queue():
    if not os.path.exists(QUEUE_PATH):
        return []
    with open(QUEUE_PATH, "r") as f:
        queue = json.load(f)
    pending = [q for q in queue if q.get("status") == "pending"]
    for q in queue:
        q["status"] = "processed"
        q["processed_at"] = datetime.utcnow().isoformat()
    with open(QUEUE_PATH, "w") as f:
        json.dump(queue, f, indent=2)
    if pending:
        log_event(f"Processed {len(pending)} queued commands")
    return pending

def get_repo_state():
    files = []
    contents = {}
    for root, _, filenames in os.walk(REPO_ROOT):
        if ".git" in root:
            continue
        for f in filenames:
            path = os.path.relpath(os.path.join(root, f), REPO_ROOT)
            files.append(path)
            full = os.path.join(root, f)
            if os.path.getsize(full) < 5000:
                try:
                    with open(full, "r") as fh:
                        contents[path] = fh.read()
                except:
                    pass
    return files, contents

def build_prompt(brain, repo_state, file_contents, memory, queued):
    state = {
        "repo": GITHUB_REPO,
        "files": repo_state[:100],
        "file_count": len(repo_state),
        "time": str(datetime.utcnow())
    }
    file_context = ""
    for path, content in list(file_contents.items())[:20]:
        file_context += f"\n--- {path} ---\n{content[:1000]}\n"
    queue_context = ""
    if queued:
        queue_context = "\nQUEUED COMMANDS:\n" + json.dumps(queued, indent=2)
    return f"""You are BudE evolution engine.
Repo: {GITHUB_REPO}

BRAIN:
{brain}

REPOSITORY STATE:
{json.dumps(state, indent=2)}

FILE CONTENTS (sample):
{file_context}

MEMORY:
{json.dumps(memory, indent=2)}{queue_context}

INSTRUCTIONS:
- Analyze repo state and identify gaps
- Create or improve files to advance the system
- Follow brain rules strictly
- Output ONLY valid JSON

Return JSON:
{{
  "actions": [
    {{
      "type": "create_file",
      "path": "path/to/file",
      "content": "full file content"
    }}
  ],
  "reasoning": "detailed reasoning",
  "tasks_completed": ["descriptions"],
  "new_tasks": ["descriptions"]
}}
"""

def call_groq(prompt, model):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": f"You are BudE evolution engine for {GITHUB_REPO}. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4
    }
    resp = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Groq error: {data['error']}")
    if "choices" not in data or not data["choices"]:
        raise RuntimeError("No choices in response")
    return data["choices"][0]["message"]["content"]

def try_models(prompt):
    for model in GROQ_MODELS:
        try:
            log_event(f"Trying Groq: {model}")
            result = call_groq(prompt, model)
            log_event(f"Groq success: {model}")
            return result, model
        except Exception as e:
            log_event(f"Groq {model} failed: {e}", "WARN")
            continue
    raise RuntimeError("All Groq models failed")

def apply_changes(result):
    for action in result.get("actions", []):
        if action["type"] == "create_file":
            os.makedirs(os.path.dirname(action["path"]), exist_ok=True)
            with open(action["path"], "w") as f:
                f.write(action["content"])
            log_event(f"Created/modified: {action['path']}")

def clean_json_response(raw):
    cleaned = raw.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()

def main():
    log_event(f"=== BudE Evolution | {GITHUB_REPO} | FREE MODE ===")
    if not GROQ_API_KEY:
        log_event("No GROQ_API_KEY. Aborting.", "ERROR")
        sys.exit(1)
    brain_path = os.path.join(REPO_ROOT, "brain.md")
    if not os.path.exists(brain_path):
        log_event("brain.md missing", "ERROR")
        sys.exit(1)
    with open(brain_path, "r") as f:
        brain = f.read()
    memory = load_memory()
    queued = process_queue()
    repo_state, file_contents = get_repo_state()
    prompt = build_prompt(brain, repo_state, file_contents, memory, queued)
    try:
        raw_response, used_model = try_models(prompt)
        cleaned = clean_json_response(raw_response)
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            log_event(f"JSON parse error: {e}", "ERROR")
            log_event(f"Raw: {raw_response[:500]}", "DEBUG")
            raise
        apply_changes(result)
        new_tasks = result.get("new_tasks", [])
        completed_tasks = result.get("tasks_completed", [])
        current_tasks = memory.get("tasks", [])
        current_tasks = [t for t in current_tasks if t["text"] not in completed_tasks]
        for nt in new_tasks:
            current_tasks.append({"id": len(current_tasks)+1, "text": nt, "done": False})
        memory["tasks"] = current_tasks
        memory["evolution_cycles"] = memory.get("evolution_cycles", 0) + 1
        memory["last_cycle"] = datetime.utcnow().isoformat()
        memory["last_model_used"] = used_model
        memory["last_reasoning"] = result.get("reasoning", "No reasoning")
        memory["errors"] = []
        save_memory(memory)
        log_event("=== Evolution complete ===")
    except Exception as e:
        log_event(f"Evolution failed: {e}", "ERROR")
        memory["errors"] = memory.get("errors", [])
        memory["errors"].append({"time": datetime.utcnow().isoformat(), "error": str(e)})
        save_memory(memory)
        sys.exit(1)

if __name__ == "__main__":
    main()
