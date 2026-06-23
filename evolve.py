#!/usr/bin/env python3
"""
BudE Evolution Engine v0.3
Repo: https://github.com/bude404-ops/Bude-Tech
Phased evolution: BUILD → BUSINESS
Dashboard LOCKED | Auto-log-cleanup enabled
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

GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
]
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
MAX_PROMPT_CHARS = 12000
MAX_LOG_LINES = 50

PROTECTED_FILES = [
    "dashboard.js",
    "style.css",
    "index.html",
]

EXISTING_PATTERNS = [
    "new_",
    "_requirements.txt",
    "copy_of_",
    "backup_",
]

def self_heal():
    """Read last error and attempt to fix it."""
    if not os.path.exists(LOG_PATH):
        return
    
    try:
        with open(LOG_PATH, "r") as f:
            lines = f.readlines()
        
        last_error = None
        for line in reversed(lines):
            if "[ERROR]" in line:
                last_error = line
                break
        
        if not last_error:
            return
        
        if "JSON parse error" in last_error:
            log_event("SELF-HEAL: Detected JSON parse issue, will simplify prompt", "HEAL")
            return "simplify_json"
        elif "All models failed" in last_error:
            log_event("SELF-HEAL: Detected model failure, will retry with fallback", "HEAL")
            return "retry_models"
        elif "No files created" in last_error:
            log_event("SELF-HEAL: Detected empty cycle, will expand prompt", "HEAL")
            return "expand_prompt"
        
    except Exception as e:
        log_event(f"SELF-HEAL failed: {e}", "WARN")

def log_event(msg, level="INFO"):
    ts = datetime.utcnow().isoformat()
    entry = f"[{ts}] [{level}] {msg}\n"
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(entry)
    print(entry.strip())

def cleanup_logs():
    if not os.path.exists(LOG_PATH):
        return
    try:
        with open(LOG_PATH, "r") as f:
            lines = f.readlines()
        if len(lines) > MAX_LOG_LINES:
            with open(LOG_PATH, "w") as f:
                f.writelines(lines[-MAX_LOG_LINES:])
            print(f"[CLEANUP] Trimmed evolution.log to {MAX_LOG_LINES} lines")
    except Exception as e:
        print(f"[CLEANUP] Error: {e}")

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
        "upgrades_made": [],
        "current_focus": "build",
        "phase": "build",
        "modules_built": [],
        "business_modules": []
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
    files = []
    for root, _, filenames in os.walk(REPO_ROOT):
        if ".git" in root:
            continue
        for f in filenames:
            path = os.path.relpath(os.path.join(root, f), REPO_ROOT)
            files.append(path)
    return files

def determine_phase(memory, files):
    core_modules = [
        "agents/coder_agent.py",
        "agents/researcher_agent.py",
        "agents/crypto_analyst_agent.py",
        "agents/system_architect_agent.py",
        "api/solana.py",
        "tools/utils.py",
    ]
    built = [m for m in core_modules if m in files]
    memory["modules_built"] = built
    if len(built) >= 4:
        return "business"
    return "build"

def build_phase_prompt(memory, files):
    missing = [
        "agents/coder_agent.py — writes and fixes code",
        "agents/researcher_agent.py — gathers information from APIs",
        "agents/crypto_analyst_agent.py — analyzes Solana/crypto data",
        "agents/system_architect_agent.py — plans system structure",
        "api/solana.py — Solana blockchain reader (public data only)",
        "tools/utils.py — shared helper functions",
        "tests/test_agents.py — verify agents work",
    ]
    built_names = [os.path.basename(f) for f in memory.get("modules_built", [])]
    missing = [m for m in missing if not any(b in m for b in built_names)]
    return f"""
PHASE: BUILD (Core System)
Progress: {len(memory.get('modules_built', []))}/6 core modules

MISSING MODULES — build ONE per cycle:
{chr(10).join(missing[:3])}

RULES:
- Create ONE file per cycle
- NO duplicates (no "new_" prefixes, no "_requirements.txt")
- NO requirements files (use standard library + requests)
- Make it functional, not perfect
- Test that it runs
"""

def business_phase_prompt(memory, files):
    opportunities = [
        "api/freelance.py — scan freelance platforms for AI coding gigs",
        "api/crypto_signals.py — generate trading signals (simulation only)",
        "tools/content_generator.py — generate blog/social content",
        "api/affiliate.py — track affiliate link performance",
        "tools/saas_builder.py — build micro-SaaS tools",
        "api/price_tracker.py — track API pricing, find cheapest options",
    ]
    built_biz = memory.get("business_modules", [])
    missing = [o for o in opportunities if not any(b in o for b in built_biz)]
    return f"""
PHASE: BUSINESS (Money Making)
Core modules: ✅ DONE
Business modules: {len(built_biz)}/6

OPPORTUNITIES — build ONE per cycle:
{chr(10).join(missing[:3])}

RULES:
- Create ONE revenue-oriented tool per cycle
- NO duplicates
- Use free APIs only
- Track potential earnings in code comments
- Never execute real transactions
"""

def build_prompt(brain, repo_state, memory, queued):
    brain_summary = brain[:1500] + "\n... [truncated]" if len(brain) > 1500 else brain
    file_list = repo_state[:40]
    file_count = len(repo_state)
    
    phase = memory.get("phase", "build")
    forced_focus = memory.get("current_focus", "general")
    
    for q in queued:
        if q.get("type") == "focus":
            forced_focus = q.get("data", "general")
            if forced_focus == "business":
                phase = "business"
            memory["current_focus"] = forced_focus
            memory["phase"] = phase
            save_memory(memory)
    
    if phase == "build" and forced_focus not in ["business", "money"]:
        detected = determine_phase(memory, repo_state)
        if detected == "business":
            phase = "business"
            memory["phase"] = "business"
            log_event("PHASE ADVANCE: Build complete → Business mode")
    
    if phase == "business" or forced_focus in ["business", "money", "monetize"]:
        phase_prompt = business_phase_prompt(memory, repo_state)
    else:
        phase_prompt = build_phase_prompt(memory, repo_state)
    
    mem_summary = {
        "cycles": memory.get("evolution_cycles", 0),
        "phase": phase,
        "focus": forced_focus,
        "modules": len(memory.get("modules_built", [])),
        "business": len(memory.get("business_modules", []))
    }
    
    prompt = f"""You are BudE evolution engine.
Repo: {GITHUB_REPO}

BRAIN (summary):
{brain_summary}

FILES ({file_count} total):
{json.dumps(file_list, indent=2)}

MEMORY:
{json.dumps(mem_summary)}

{phase_prompt}

STRICT RULES:
- DASHBOARD LOCKED: Never modify {', '.join(PROTECTED_FILES)}
- You can upgrade: evolve.py, brain.md, agents/*, api/*, tools/*, system/*
- Fix bugs, add features, improve everything else
- Output ONLY valid JSON

JSON:
{{
  "actions": [
    {{"type": "create_file", "path": "filename", "content": "content"}}
  ],
  "reasoning": "why",
  "upgrades_made": ["files"],
  "new_tasks": ["task1"]
}}

Keep compact. 1-2 files per cycle.
"""
    
    if len(prompt) > MAX_PROMPT_CHARS:
        prompt = prompt[:MAX_PROMPT_CHARS] + "\n... [truncated]\n}"
    
    return prompt

def is_duplicate(path):
    base = os.path.basename(path)
    for pattern in EXISTING_PATTERNS:
        if pattern in base:
            return True
    return False

def call_groq(prompt, model):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are BudE. Build focused, no duplicates. Output only JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 2048
    }
    resp = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Groq error: {data['error']}")
    if "choices" not in data or not data["choices"]:
        raise RuntimeError("No choices")
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

def apply_changes(result, memory):
    upgrades = result.get("upgrades_made", [])
    created = []
    
    for action in result.get("actions", []):
        if action["type"] != "create_file":
            continue
        
        path = action["path"]
        
        if path in PROTECTED_FILES:
            log_event(f"BLOCKED dashboard: {path}")
            continue
        
        if is_duplicate(path):
            log_event(f"BLOCKED duplicate: {path}")
            continue
        
        if path.endswith("_requirements.txt"):
            log_event(f"BLOCKED requirements: {path}")
            continue
        
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(action["content"])
        created.append(path)
        log_event(f"Built: {path}")
        
        if "business" in path or "freelance" in path or "saas" in path:
            memory["business_modules"] = memory.get("business_modules", [])
            memory["business_modules"].append(path)
        elif "agents/" in path or "api/" in path or "tools/" in path:
            memory["modules_built"] = memory.get("modules_built", [])
            memory["modules_built"].append(path)
    
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
    global MAX_PROMPT_CHARS  # FIXED: moved to top of function
    
    cleanup_logs()
    heal_action = self_heal()
    
    if heal_action == "simplify_json":
        MAX_PROMPT_CHARS = 8000
    elif heal_action == "expand_prompt":
        MAX_PROMPT_CHARS = 15000
    
    memory = load_memory()
    log_event(f"=== BudE | Phase: {memory.get('phase', 'build')} | Focus: {memory.get('current_focus', 'general')} ===")
    
    if not GROQ_API_KEY:
        log_event("No GROQ_API_KEY", "ERROR")
        sys.exit(1)
    
    brain_path = os.path.join(REPO_ROOT, "brain.md")
    if not os.path.exists(brain_path):
        log_event("brain.md missing", "ERROR")
        sys.exit(1)
    
    with open(brain_path, "r") as f:
        brain = f.read()
    
    queued = process_queue()
    repo_state = get_repo_state()
    prompt = build_prompt(brain, repo_state, memory, queued)
    
    log_event(f"Prompt: {len(prompt)} chars")
    
    try:
        raw_response, used_model = try_models(prompt)
        cleaned = clean_json_response(raw_response)
        
        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as e:
            log_event(f"JSON error: {e}", "ERROR")
            log_event(f"Raw: {raw_response[:300]}", "DEBUG")
            raise
        
        created, upgrades = apply_changes(result, memory)
        
        if len(created) == 0:
            log_event("No files created. Skipping commit.")
            memory["evolution_cycles"] = memory.get("evolution_cycles", 0) + 1
            memory["last_cycle"] = datetime.utcnow().isoformat()
            memory["last_model_used"] = used_model
            memory["errors"] = []
            save_memory(memory)
            return
        
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
        
        if upgrades:
            memory["upgrades_made"] = memory.get("upgrades_made", [])
            memory["upgrades_made"].append({
                "time": datetime.utcnow().isoformat(),
                "files": upgrades
            })
        
        memory["errors"] = []
        save_memory(memory)
        
        log_event(f"=== Done | Built: {len(created)} | Phase: {memory.get('phase', 'build')} ===")
        
    except Exception as e:
        log_event(f"Failed: {e}", "ERROR")
        memory["errors"] = memory.get("errors", [])
        memory["errors"].append({"time": datetime.utcnow().isoformat(), "error": str(e)[:200]})
        save_memory(memory)
        sys.exit(1)

if __name__ == "__main__":
    main()
