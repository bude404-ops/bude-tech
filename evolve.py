#!/usr/bin/env python3
"""
BudE Evolution Engine v0.2
Repo: https://github.com/bude404-ops/Bude-Tech
100% free — Groq only, truncated prompts to stay within limits
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

# Groq free tier: 6,000 tokens/min, 14,400 req/day
# Keep prompt under ~3,000 tokens to stay safe
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Max prompt size in characters (roughly 3K tokens)
MAX_PROMPT_CHARS = 12000

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
    return {
        "evolution_cycles": 0,
        "last_cycle": None,
        "errors": [],
        "tasks": [],
        "repo": GITHUB_REPO,
        "upgrades_made": []
    }

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
    """Only list files, don't read contents. Stays within token limits."""
    files = []
    for root, _, filenames in os.walk(REPO_ROOT):
        if ".git" in root:
            continue
        for f in filenames:
            path = os.path.relpath(os.path.join(root, f), REPO_ROOT)
            files.append(path)
    return files

def build_prompt(brain, repo_state, memory, queued):
    """Build a compact prompt that fits within Groq free tier."""
    
    # Truncate brain to essentials
    brain_summary = brain[:2000] + "\n... [truncated for length]" if len(brain) > 2000 else brain
    
    # Compact file list
    file_list = repo_state[:50]  # Only first 50 files
    file_count = len(repo_state)
    
    # Compact memory
    mem_summary = {
        "cycles": memory.get("evolution_cycles", 0),
        "last": memory.get("last_cycle", "never"),
        "tasks": len(memory.get("tasks", [])),
        "errors": len(memory.get("errors", []))
    }
    
    # Compact queue
    queue_summary = ""
    if queued:
        queue_summary = f"\nQueued: {len(queued)} commands"
    
    prompt = f"""You are BudE evolution engine.
Repo: {GITHUB_REPO}

BRAIN (summary):
{brain_summary}

FILES ({file_count} total, showing {len(file_list)}):
{json.dumps(file_list, indent=2)}

MEMORY:
{json.dumps(mem_summary)}{queue_summary}

INSTRUCTIONS:
- Build missing files from the brain objectives
- Fix any obvious issues
- Output ONLY valid JSON with this structure:
{{
  "actions": [
    {{"type": "create_file", "path": "filename", "content": "content"}}
  ],
  "reasoning": "why",
  "new_tasks": ["task1"]
}}

Keep responses compact. Create one or two files per cycle.
"""
    
    # Hard truncate if still too long
    if len(prompt) > MAX_PROMPT_CHARS:
        prompt = prompt[:MAX_PROMPT_CHARS] + "\n... [truncated]\n}"
    
    return prompt

def call_groq(prompt, model):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are BudE. Output only valid JSON. Be concise."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4,
        "max_tokens": 2048  # Reduced from 4096 to stay within limits
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
            log_event(f"Trying: {model}")
            result = call_groq(prompt, model)
            log_event(f"Success: {model}")
            return result, model
        except Exception as e:
            err_msg = str(e)[:100]
            log_event(f"{model} failed: {err_msg}", "WARN")
            continue
    raise RuntimeError("All models failed")

def apply_changes(result):
    upgrades = result.get("upgrades_made", [])
    created = []
    for action in result.get("actions", []):
        if action["type"] == "create_file":
            os.makedirs(os.path.dirname(action["path"]), exist_ok=True)
            with open(action["path"], "w") as f:
                f.write(action["content"])
            created.append(action["path"])
            log_event(f"Created: {action['path']}")
    return created, upgrades

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
    log_event(f"=== BudE Evolution | {GITHUB_REPO} ===")
    
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
    repo_state = get_repo_state()
    prompt = build_prompt(brain, repo_state, memory, queued)
    
    log_event(f"Prompt size: {len(prompt)} chars")
    
    try:
        raw_response, used_model = try_models(prompt)
        cleaned = clean_json_response(raw_response)
        
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            log_event(f"JSON parse error: {e}", "ERROR")
            log_event(f"Raw: {raw_response[:300]}", "DEBUG")
            raise
        
        created, upgrades = apply_changes(result)
        
        # Update tasks
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
        memory["last_reasoning"] = result.get("reasoning", "No reasoning")[:200]
        memory["errors"] = []
        save_memory(memory)
        
        log_event(f"=== Complete | Created: {len(created)} files ===")
        
    except Exception as e:
        log_event(f"Evolution failed: {e}", "ERROR")
        memory["errors"] = memory.get("errors", [])
        memory["errors"].append({"time": datetime.utcnow().isoformat(), "error": str(e)[:200]})
        save_memory(memory)
        sys.exit(1)

if __name__ == "__main__":
    main()
