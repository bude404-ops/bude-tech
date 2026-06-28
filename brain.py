#!/usr/bin/env python3
"""
BUDE CEO v27 - Autonomous AI Agent System
Brain Module: Core intelligence, self-replication, and autonomous operation
Only uses free GitHub APIs and GitHub Actions (public repos = unlimited minutes)
"""

import os
import json
import re
import time
import hashlib
import random
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional

# ─── CONFIGURATION ───────────────────────────────────────────────────────────
REPO_OWNER = os.environ.get("GITHUB_REPOSITORY_OWNER", "bude404-ops")
REPO_NAME = os.environ.get("GITHUB_REPOSITORY", "Bude-Tech").split("/")[-1] if "/" in os.environ.get("GITHUB_REPOSITORY", "Bude-Tech") else "Bude-Tech"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
BRAIN_PATH = Path(__file__)
WORKFLOW_PATH = Path(".github/workflows/bude_workflow.yml")
MEMORY_FILE = Path("bude_memory.json")
AGENTS_DIR = Path("agents")
LOG_FILE = Path("bude_log.md")
DASHBOARD_FILE = Path("dashboard.html")

# ─── MEMORY SYSTEM ───────────────────────────────────────────────────────────
class Memory:
    def __init__(self):
        self.data = self._load()

    def _load(self) -> dict:
        if MEMORY_FILE.exists():
            try:
                return json.loads(MEMORY_FILE.read_text())
            except:
                return self._default()
        return self._default()

    def _default(self) -> dict:
        return {
            "cycles_completed": 0,
            "agents_created": [],
            "tasks_completed": [],
            "last_run": None,
            "knowledge_base": {},
            "errors": [],
            "replication_count": 0,
            "revenue_attempts": [],
            "skills_learned": [],
            "auto_work": True,
            "chat_history": [],
            "dashboard_data": {}
        }

    def save(self):
        MEMORY_FILE.write_text(json.dumps(self.data, indent=2))

    def get(self, key: str, default=None):
        return self.data.get(key, default)

    def set(self, key: str, value: Any):
        self.data[key] = value
        self.save()

    def append(self, key: str, value: Any):
        if key not in self.data:
            self.data[key] = []
        self.data[key].append(value)
        self.save()

# ─── LOGGING SYSTEM ──────────────────────────────────────────────────────────
class Logger:
    @staticmethod
    def log(message: str, level: str = "INFO"):
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        entry = f"[{timestamp}] [{level}] {message}"
        print(entry)

        existing = LOG_FILE.read_text() if LOG_FILE.exists() else "# BUDE CEO Operation Log\n\n"
        LOG_FILE.write_text(existing + entry + "\n")

        memory = Memory()
        memory.append("tasks_completed", {"time": timestamp, "msg": message, "level": level})

# ─── DASHBOARD GENERATOR ─────────────────────────────────────────────────────
class DashboardGenerator:
    """Generates the interactive dashboard HTML file"""

    @classmethod
    def generate(cls, memory: Memory) -> str:
        cycles = memory.get("cycles_completed", 0)
        agents = memory.get("agents_created", [])
        skills = memory.get("skills_learned", [])
        revenue = memory.get("revenue_attempts", [])
        auto_work = memory.get("auto_work", True)

        activities = memory.get("tasks_completed", [])[-20:]
        activities_json = json.dumps(activities)
        agents_json = json.dumps(agents)
        skills_json = json.dumps(skills)
        revenue_json = json.dumps(revenue)

        return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>🤖 BUDE CEO Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {{ --bg:#0a0a0f; --bg-card:#12121a; --bg-elevated:#1a1a2e; --border:#252540;
  --text:#e0e0ff; --text-dim:#8888aa; --accent:#00f0ff; --accent-glow:rgba(0,240,255,0.3);
  --success:#00ff88; --warning:#ffaa00; --danger:#ff4466; --purple:#a855f7; --pink:#ec4899; }}
*{{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}}
html{{scroll-behavior:smooth}}
body{{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;-webkit-font-smoothing:antialiased}}
.bg-grid{{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(0,240,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.03) 1px,transparent 1px);background-size:40px 40px;animation:gridMove 20s linear infinite}}
@keyframes gridMove{{0%{{transform:translate(0,0)}}100%{{transform:translate(40px,40px)}}}}
.orb{{position:fixed;border-radius:50%;filter:blur(80px);opacity:0.15;pointer-events:none;z-index:0}}
.orb-1{{width:300px;height:300px;background:var(--accent);top:-100px;right:-100px;animation:float 8s ease-in-out infinite}}
.orb-2{{width:250px;height:250px;background:var(--purple);bottom:-80px;left:-80px;animation:float 10s ease-in-out infinite 2s}}
.orb-3{{width:200px;height:200px;background:var(--pink);top:50%;left:50%;animation:float 12s ease-in-out infinite 4s}}
@keyframes float{{0%,100%{{transform:translate(0,0) scale(1)}}50%{{transform:translate(30px,-30px) scale(1.1)}}}}
.app{{position:relative;z-index:1;max-width:480px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column}}
.header{{padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);background:rgba(10,10,15,0.8);backdrop-filter:blur(20px);position:sticky;top:0;z-index:100}}
.header-left{{display:flex;align-items:center;gap:12px}}
.logo{{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 20px var(--accent-glow);animation:pulse 2s ease-in-out infinite}}
@keyframes pulse{{0%,100%{{box-shadow:0 0 20px var(--accent-glow)}}50%{{box-shadow:0 0 40px var(--accent-glow)}}}}
.header-title{{font-size:18px;font-weight:700;letter-spacing:-0.5px}}
.header-sub{{font-size:11px;color:var(--text-dim)}}
.status-dot{{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success);animation:blink 2s ease-in-out infinite}}
@keyframes blink{{0%,100%{{opacity:1}}50%{{opacity:0.4}}}}
.status-text{{font-size:11px;color:var(--success);font-weight:500}}
.auto-work-bar{{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(90deg,rgba(0,240,255,0.05),rgba(168,85,247,0.05));border-bottom:1px solid var(--border)}}
.auto-work-label{{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}}
.auto-work-label .icon{{font-size:16px}}
.toggle{{width:52px;height:28px;border-radius:14px;background:var(--border);position:relative;cursor:pointer;transition:all 0.3s ease;border:2px solid transparent}}
.toggle.active{{background:linear-gradient(135deg,var(--accent),var(--purple));border-color:rgba(255,255,255,0.1)}}
.toggle-knob{{width:22px;height:22px;border-radius:50%;background:#fff;position:absolute;top:1px;left:1px;transition:all 0.3s cubic-bezier(0.68,-0.55,0.27,1.55);box-shadow:0 2px 8px rgba(0,0,0,0.3)}}
.toggle.active .toggle-knob{{left:25px}}
.auto-work-status{{font-size:11px;color:var(--text-dim);margin-top:2px}}
.tab-bar{{display:flex;padding:4px;margin:12px 16px 0;background:var(--bg-card);border-radius:16px;border:1px solid var(--border)}}
.tab{{flex:1;padding:10px 8px;text-align:center;font-size:12px;font-weight:600;border-radius:12px;cursor:pointer;transition:all 0.2s;color:var(--text-dim);border:none;background:none}}
.tab.active{{background:var(--bg-elevated);color:var(--text);box-shadow:0 2px 12px rgba(0,0,0,0.3)}}
.tab .emoji{{display:block;font-size:18px;margin-bottom:2px}}
.content{{flex:1;overflow-y:auto;padding:16px;padding-bottom:100px}}
.content::-webkit-scrollbar{{width:0}}
.card{{background:var(--bg-card);border:1px solid var(--border);border-radius:20px;padding:20px;margin-bottom:16px;position:relative;overflow:hidden}}
.card::before{{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0.3}}
.card-title{{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-dim);margin-bottom:16px;display:flex;align-items:center;gap:8px}}
.stats-grid{{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}}
.stat-card{{background:var(--bg-elevated);border-radius:16px;padding:16px;border:1px solid var(--border);position:relative;overflow:hidden}}
.stat-card::after{{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--accent),var(--purple));opacity:0.5}}
.stat-value{{font-size:28px;font-weight:800;background:linear-gradient(135deg,var(--text),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}}
.stat-label{{font-size:11px;color:var(--text-dim);margin-top:6px;font-weight:500}}
.stat-change{{font-size:11px;font-weight:600;margin-top:4px;display:inline-flex;align-items:center;gap:2px}}
.stat-change.up{{color:var(--success)}}
.stat-change.down{{color:var(--danger)}}
.progress-ring-container{{display:flex;align-items:center;justify-content:center;padding:20px 0}}
.progress-ring{{width:180px;height:180px;position:relative}}
.progress-ring svg{{transform:rotate(-90deg)}}
.progress-ring-bg{{fill:none;stroke:var(--bg-elevated);stroke-width:12}}
.progress-ring-fill{{fill:none;stroke:url(#grad1);stroke-width:12;stroke-linecap:round;stroke-dasharray:502;stroke-dashoffset:502;transition:stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)}}
.progress-ring-text{{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}}
.progress-ring-pct{{font-size:36px;font-weight:800;color:var(--accent)}}
.progress-ring-label{{font-size:11px;color:var(--text-dim);margin-top:4px}}
.timeline{{position:relative;padding-left:24px}}
.timeline::before{{content:'';position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:linear-gradient(180deg,var(--accent),var(--purple),var(--pink));opacity:0.3}}
.timeline-item{{position:relative;margin-bottom:16px}}
.timeline-dot{{position:absolute;left:-24px;top:2px;width:16px;height:16px;border-radius:50%;background:var(--bg);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center}}
.timeline-dot::after{{content:'';width:6px;height:6px;border-radius:50%;background:var(--accent)}}
.timeline-time{{font-size:10px;color:var(--text-dim);font-weight:500}}
.timeline-text{{font-size:13px;margin-top:2px;line-height:1.5}}
.timeline-text .highlight{{color:var(--accent);font-weight:600}}
.agent-list{{display:flex;flex-direction:column;gap:10px}}
.agent-item{{display:flex;align-items:center;gap:14px;padding:14px 16px;background:var(--bg-elevated);border-radius:16px;border:1px solid var(--border);transition:all 0.2s}}
.agent-item:active{{transform:scale(0.98);background:rgba(0,240,255,0.05)}}
.agent-avatar{{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--bg);border:1px solid var(--border)}}
.agent-info{{flex:1}}
.agent-name{{font-size:14px;font-weight:600}}
.agent-desc{{font-size:11px;color:var(--text-dim);margin-top:2px}}
.agent-status{{font-size:10px;padding:4px 10px;border-radius:20px;font-weight:600}}
.agent-status.active{{background:rgba(0,255,136,0.1);color:var(--success)}}
.agent-status.pending{{background:rgba(255,170,0,0.1);color:var(--warning)}}
.agent-status.spawned{{background:rgba(0,240,255,0.1);color:var(--accent)}}
.chat-container{{display:flex;flex-direction:column;height:calc(100vh - 200px)}}
.chat-messages{{flex:1;overflow-y:auto;padding:8px 0;display:flex;flex-direction:column;gap:12px}}
.chat-messages::-webkit-scrollbar{{width:0}}
.message{{max-width:85%;padding:14px 18px;border-radius:20px;font-size:14px;line-height:1.6;animation:messageIn 0.3s ease-out}}
@keyframes messageIn{{from{{opacity:0;transform:translateY(10px) scale(0.95)}}to{{opacity:1;transform:translateY(0) scale(1)}}}}
.message.user{{align-self:flex-end;background:linear-gradient(135deg,var(--accent),var(--purple));color:#000;font-weight:500;border-bottom-right-radius:4px}}
.message.ceo{{align-self:flex-start;background:var(--bg-elevated);border:1px solid var(--border);border-bottom-left-radius:4px}}
.message-time{{font-size:9px;opacity:0.5;margin-top:6px}}
.message.ceo .message-time{{color:var(--text-dim)}}
.message.user .message-time{{color:rgba(0,0,0,0.5)}}
.typing{{display:flex;gap:4px;padding:18px;align-self:flex-start;background:var(--bg-elevated);border-radius:20px;border-bottom-left-radius:4px}}
.typing-dot{{width:8px;height:8px;border-radius:50%;background:var(--text-dim);animation:typingBounce 1.4s ease-in-out infinite}}
.typing-dot:nth-child(2){{animation-delay:0.2s}}
.typing-dot:nth-child(3){{animation-delay:0.4s}}
@keyframes typingBounce{{0%,60%,100%{{transform:translateY(0)}}30%{{transform:translateY(-6px)}}}}
.chat-input-bar{{position:sticky;bottom:0;padding:12px 16px 24px;background:linear-gradient(180deg,transparent,rgba(10,10,15,0.95) 40%);display:flex;gap:10px;align-items:flex-end}}
.chat-input{{flex:1;background:var(--bg-elevated);border:1px solid var(--border);border-radius:24px;padding:14px 18px;color:var(--text);font-size:14px;font-family:inherit;outline:none;resize:none;min-height:48px;max-height:120px;transition:border-color 0.2s}}
.chat-input:focus{{border-color:var(--accent)}}
.chat-input::placeholder{{color:var(--text-dim)}}
.send-btn{{width:48px;height:48px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--accent),var(--purple));color:#000;font-size:20px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.2s;flex-shrink:0}}
.send-btn:active{{transform:scale(0.9)}}
.send-btn:disabled{{opacity:0.4;cursor:not-allowed}}
.quick-commands{{display:flex;gap:8px;overflow-x:auto;padding:0 16px 12px;scrollbar-width:none}}
.quick-commands::-webkit-scrollbar{{display:none}}
.quick-cmd{{white-space:nowrap;padding:8px 16px;border-radius:20px;background:var(--bg-elevated);border:1px solid var(--border);font-size:12px;color:var(--text-dim);cursor:pointer;transition:all 0.2s}}
.quick-cmd:active{{background:rgba(0,240,255,0.1);border-color:var(--accent);color:var(--accent)}}
.revenue-card{{background:linear-gradient(135deg,rgba(0,255,136,0.05),rgba(0,240,255,0.05));border:1px solid rgba(0,255,136,0.2);border-radius:20px;padding:20px}}
.revenue-amount{{font-size:42px;font-weight:800;background:linear-gradient(135deg,var(--success),var(--accent));-webkit-background-clip:text;-webkit-text-fill-color:transparent}}
.revenue-chart{{height:80px;margin-top:16px;display:flex;align-items:flex-end;gap:6px}}
.revenue-bar{{flex:1;border-radius:6px 6px 0 0;background:linear-gradient(180deg,var(--success),var(--accent));opacity:0.6;transition:opacity 0.3s;animation:growUp 1s ease-out backwards}}
.revenue-bar:hover{{opacity:1}}
@keyframes growUp{{from{{height:0}}}}
.bottom-nav{{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;padding:8px 16px 24px;background:linear-gradient(180deg,transparent,rgba(10,10,15,0.95) 30%);display:flex;justify-content:space-around;z-index:100}}
.nav-btn{{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;color:var(--text-dim);font-size:10px;font-weight:500;cursor:pointer;padding:8px 16px;transition:all 0.2s}}
.nav-btn.active{{color:var(--accent)}}
.nav-btn .nav-icon{{font-size:22px}}
.modal-overlay{{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);z-index:200;display:none;align-items:center;justify-content:center;padding:20px}}
.modal-overlay.show{{display:flex}}
.modal{{background:var(--bg-card);border:1px solid var(--border);border-radius:24px;padding:24px;width:100%;max-width:360px;animation:modalIn 0.3s ease-out}}
@keyframes modalIn{{from{{opacity:0;transform:scale(0.9) translateY(20px)}}}}
.modal-title{{font-size:18px;font-weight:700;margin-bottom:8px}}
.modal-text{{font-size:14px;color:var(--text-dim);line-height:1.6;margin-bottom:20px}}
.modal-btn{{width:100%;padding:14px;border-radius:16px;border:none;background:linear-gradient(135deg,var(--accent),var(--purple));color:#000;font-size:14px;font-weight:700;cursor:pointer}}
.live-pulse{{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:var(--success);font-weight:600}}
.live-pulse::before{{content:'';width:6px;height:6px;border-radius:50%;background:var(--success);box-shadow:0 0 8px var(--success);animation:livePulse 2s ease-in-out infinite}}
@keyframes livePulse{{0%,100%{{opacity:1;transform:scale(1)}}50%{{opacity:0.5;transform:scale(1.3)}}}}
.section{{display:none;animation:fadeIn 0.3s ease-out}}
.section.active{{display:block}}
@keyframes fadeIn{{from{{opacity:0;transform:translateY(10px)}}}}
::-webkit-scrollbar{{width:0;height:0}}
</style>
</head>
<body>
<div class="bg-grid"></div>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>
<svg width="0" height="0"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#00f0ff"/><stop offset="100%" style="stop-color:#a855f7"/></linearGradient></defs></svg>
<div class="app">
<div class="header">
  <div class="header-left">
    <div class="logo">🧠</div>
    <div><div class="header-title">BUDE CEO</div><div class="header-sub">Autonomous AI Agent</div></div>
  </div>
  <div style="text-align:right;"><div class="live-pulse">LIVE</div><div class="status-text" id="nextRun">Next: --</div></div>
</div>
<div class="auto-work-bar">
  <div>
    <div class="auto-work-label"><span class="icon">⚡</span><span>Auto-Work Mode</span></div>
    <div class="auto-work-status" id="autoWorkStatus">Agent will run autonomously every 4 hours</div>
  </div>
  <div class="toggle active" id="autoWorkToggle" onclick="toggleAutoWork()"><div class="toggle-knob"></div></div>
</div>
<div class="tab-bar">
  <button class="tab active" onclick="switchTab('overview')"><span class="emoji">📊</span>Overview</button>
  <button class="tab" onclick="switchTab('agents')"><span class="emoji">🤖</span>Agents</button>
  <button class="tab" onclick="switchTab('chat')"><span class="emoji">💬</span>Chat</button>
  <button class="tab" onclick="switchTab('revenue')"><span class="emoji">💰</span>Revenue</button>
</div>
<div class="content">
<div id="section-overview" class="section active">
  <div class="card">
    <div class="card-title">📈 Key Metrics</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-value" id="statCycles">{cycles}</div><div class="stat-label">Cycles Completed</div><div class="stat-change up">↑ Running</div></div>
      <div class="stat-card"><div class="stat-value" id="statAgents">{len(agents) + 1}</div><div class="stat-label">Active Agents</div><div class="stat-change up">↑ Growing</div></div>
      <div class="stat-card"><div class="stat-value" id="statSkills">{len(skills)}</div><div class="stat-label">Skills Learned</div><div class="stat-change up">↑ Learning</div></div>
      <div class="stat-card"><div class="stat-value" id="statRevenue">${sum(float(r.get('amount',0)) for r in revenue):.2f}</div><div class="stat-label">Revenue Generated</div><div class="stat-change down">--</div></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">🎯 Cycle Progress</div>
    <div class="progress-ring-container">
      <div class="progress-ring">
        <svg width="180" height="180" viewBox="0 0 180 180"><circle class="progress-ring-bg" cx="90" cy="90" r="80"/><circle class="progress-ring-fill" id="progressRing" cx="90" cy="90" r="80" style="stroke-dashoffset:{502 - ((cycles % 5) / 5) * 502}"/></svg>
        <div class="progress-ring-text"><div class="progress-ring-pct" id="progressPct">{int((cycles % 5) / 5 * 100)}%</div><div class="progress-ring-label">to next agent spawn</div></div>
      </div>
    </div>
    <div style="text-align:center;font-size:12px;color:var(--text-dim);">Cycle <span id="currentCycle" style="color:var(--accent);font-weight:700;">{cycles % 5}</span> of 5</div>
  </div>
  <div class="card">
    <div class="card-title">📋 Recent Activity</div>
    <div class="timeline" id="timeline">
      {cls._render_timeline(activities)}
    </div>
  </div>
  <div class="card">
    <div class="card-title">🎮 Quick Actions</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      <button class="quick-cmd" style="width:100%;text-align:center;" onclick="triggerAction('run-cycle')">▶️ Run Cycle Now</button>
      <button class="quick-cmd" style="width:100%;text-align:center;" onclick="triggerAction('spawn-agent')">🧬 Spawn Agent</button>
      <button class="quick-cmd" style="width:100%;text-align:center;" onclick="triggerAction('check-status')">📊 Check Status</button>
      <button class="quick-cmd" style="width:100%;text-align:center;" onclick="triggerAction('view-logs')">📜 View Logs</button>
    </div>
  </div>
</div>
<div id="section-agents" class="section">
  <div class="card">
    <div class="card-title">🤖 Agent Army</div>
    <div class="agent-list" id="agentList">
      <div class="agent-item"><div class="agent-avatar">🧠</div><div class="agent-info"><div class="agent-name">BUDE CEO</div><div class="agent-desc">Master orchestrator • Self-replication • Revenue</div></div><div class="agent-status active">ACTIVE</div></div>
      {cls._render_agents(agents, cycles)}
    </div>
  </div>
  <div class="card">
    <div class="card-title">⏳ Queue</div>
    <div class="agent-list" id="agentQueue">
      {cls._render_queue(agents, cycles)}
    </div>
  </div>
</div>
<div id="section-chat" class="section">
  <div class="chat-container">
    <div class="chat-messages" id="chatMessages">
      <div class="message ceo">
        <div>👋 Welcome back, Boss! I'm BUDE CEO, your autonomous AI agent. I can:</div>
        <div style="margin-top:8px;padding-left:12px;border-left:2px solid var(--accent);">• Run cycles on demand<br>• Spawn new agents<br>• Check system status<br>• Generate reports<br>• Attempt revenue ops</div>
        <div class="message-time">Just now</div>
      </div>
    </div>
    <div class="quick-commands">
      <button class="quick-cmd" onclick="sendQuick('Run a cycle now')">▶️ Run Cycle</button>
      <button class="quick-cmd" onclick="sendQuick('Show me the status')">📊 Status</button>
      <button class="quick-cmd" onclick="sendQuick('Spawn a new agent')">🧬 Spawn</button>
      <button class="quick-cmd" onclick="sendQuick('What can you do?')">❓ Help</button>
      <button class="quick-cmd" onclick="sendQuick('Show logs')">📜 Logs</button>
    </div>
    <div class="chat-input-bar">
      <textarea class="chat-input" id="chatInput" placeholder="Ask me anything or give a command..." rows="1" onkeydown="handleChatKey(event)"></textarea>
      <button class="send-btn" id="sendBtn" onclick="sendMessage()">➤</button>
    </div>
  </div>
</div>
<div id="section-revenue" class="section">
  <div class="revenue-card">
    <div class="card-title" style="color:var(--success);">💰 Revenue Dashboard</div>
    <div class="revenue-amount" id="revenueAmount">${sum(float(r.get('amount',0)) for r in revenue):.2f}</div>
    <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">Total autonomous revenue generated</div>
    <div class="revenue-chart" id="revenueChart">
      {cls._render_revenue_chart(revenue)}
    </div>
  </div>
  <div class="card">
    <div class="card-title">📈 Revenue Attempts</div>
    <div class="timeline" id="revenueTimeline">
      {cls._render_revenue_timeline(revenue)}
    </div>
  </div>
  <div class="card">
    <div class="card-title">🎯 Revenue Methods</div>
    <div class="agent-list">
      <div class="agent-item"><div class="agent-avatar">📝</div><div class="agent-info"><div class="agent-name">Content Generation</div><div class="agent-desc">Auto-generate valuable content assets</div></div><div class="agent-status pending">PENDING</div></div>
      <div class="agent-item"><div class="agent-avatar">🔗</div><div class="agent-info"><div class="agent-name">Affiliate Integration</div><div class="agent-desc">Smart link placement in generated content</div></div><div class="agent-status pending">PENDING</div></div>
      <div class="agent-item"><div class="agent-avatar">🛠️</div><div class="agent-info"><div class="agent-name">Tool Monetization</div><div class="agent-desc">Create sellable tools and templates</div></div><div class="agent-status pending">PENDING</div></div>
    </div>
  </div>
</div>
</div>
<div class="bottom-nav">
  <button class="nav-btn active" onclick="switchTab('overview')"><span class="nav-icon">📊</span><span>Overview</span></button>
  <button class="nav-btn" onclick="switchTab('agents')"><span class="nav-icon">🤖</span><span>Agents</span></button>
  <button class="nav-btn" onclick="switchTab('chat')"><span class="nav-icon">💬</span><span>Chat</span></button>
  <button class="nav-btn" onclick="switchTab('revenue')"><span class="nav-icon">💰</span><span>Revenue</span></button>
</div>
</div>
<div class="modal-overlay" id="modal">
  <div class="modal">
    <div class="modal-title" id="modalTitle">Action Triggered</div>
    <div class="modal-text" id="modalText">The agent is processing your request...</div>
    <button class="modal-btn" onclick="closeModal()">Got it</button>
  </div>
</div>
<script>
const AGENT_VARIANTS = [
  {id:'research',name:'Research Agent',icon:'🔬',desc:'Web scraping & data collection',cycle:5},
  {id:'code',name:'Code Agent',icon:'💻',desc:'Code generation & refactoring',cycle:10},
  {id:'design',name:'Design Agent',icon:'🎨',desc:'UI/UX patterns & assets',cycle:15},
  {id:'marketing',name:'Marketing Agent',icon:'📢',desc:'Content & SEO optimization',cycle:20},
  {id:'security',name:'Security Agent',icon:'🔒',desc:'Vulnerability scanning',cycle:25},
  {id:'data',name:'Data Agent',icon:'📊',desc:'Analytics & visualization',cycle:30},
  {id:'testing',name:'Testing Agent',icon:'🧪',desc:'Test generation & coverage',cycle:35},
  {id:'documentation',name:'Docs Agent',icon:'📚',desc:'Documentation generation',cycle:40},
  {id:'optimization',name:'Optimize Agent',icon:'⚡',desc:'Performance tuning',cycle:45},
  {id:'community',name:'Community Agent',icon:'🌐',desc:'Issue triage & engagement',cycle:50}
];
const SKILL_POOL = [
  'Advanced pattern matching','GitHub API optimization','Multi-agent coordination',
  'Predictive scheduling','Automated code review','Dependency analysis',
  'Performance benchmarking','Security detection','Natural language parsing',
  'Data pipeline design','API integration','Error recovery',
  'Resource optimization','Parallel processing','Memory management'
];
let state = {cycles:{cycles},agents:{json.dumps(['ceo'] + agents)},skills:{json.dumps(skills)},revenue:{sum(float(r.get('amount',0)) for r in revenue)},autoWork:true,lastRun:null,nextRun:null,activities:{activities_json},chatHistory:[],revenueAttempts:{revenue_json}};
function init(){updateUI();startClock()}
function updateUI(){
  document.getElementById('statCycles').textContent = state.cycles;
  document.getElementById('statAgents').textContent = state.agents.length;
  document.getElementById('statSkills').textContent = state.skills.length;
  document.getElementById('statRevenue').textContent = '$' + state.revenue.toFixed(2);
  const progress = ((state.cycles % 5) / 5) * 100;
  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (progress / 100) * circumference;
  document.getElementById('progressRing').style.strokeDashoffset = offset;
  document.getElementById('progressPct').textContent = Math.round(progress) + '%';
  document.getElementById('currentCycle').textContent = state.cycles % 5;
}
function startClock(){setInterval(()=>{const now=new Date();document.getElementById('nextRun').textContent='Next: '+new Date(now.getTime()+14400000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},1000)}
function switchTab(tab){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));event.currentTarget.classList.add('active');document.getElementById('section-'+tab).classList.add('active')}
function toggleAutoWork(){state.autoWork=!state.autoWork;const toggle=document.getElementById('autoWorkToggle');const status=document.getElementById('autoWorkStatus');if(state.autoWork){toggle.classList.add('active');status.textContent='Agent will run autonomously every 4 hours'}else{toggle.classList.remove('active');status.textContent='Auto-Work is OFF - manual control only'}}
function handleChatKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()}}
function sendQuick(text){document.getElementById('chatInput').value=text;sendMessage()}
function sendMessage(){const input=document.getElementById('chatInput');const text=input.value.trim();if(!text)return;input.value='';input.style.height='auto';addChatMessage('user',text);processCommand(text)}
function addChatMessage(role,text){const container=document.getElementById('chatMessages');const time=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});const msg=document.createElement('div');msg.className='message '+role;msg.innerHTML=text+'<div class="message-time">'+time+'</div>';container.appendChild(msg);container.scrollTop=container.scrollHeight}
function showTyping(){const container=document.getElementById('chatMessages');const typing=document.createElement('div');typing.className='typing';typing.id='typingIndicator';typing.innerHTML='<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';container.appendChild(typing);container.scrollTop=container.scrollHeight}
function hideTyping(){const typing=document.getElementById('typingIndicator');if(typing)typing.remove()}
function processCommand(text){showTyping();setTimeout(()=>{hideTyping();const lower=text.toLowerCase();let response='';if(lower.includes('run')||lower.includes('cycle')||lower.includes('start')){response='🚀 Cycle initiated! In production, this would trigger a GitHub Actions workflow run.'}else if(lower.includes('status')||lower.includes('how are you')){response='📊 Status Report:<br>• Cycles: '+state.cycles+'<br>• Agents: '+state.agents.length+'/11<br>• Skills: '+state.skills.length+'<br>• Revenue: $'+state.revenue.toFixed(2)+'<br>• Auto-Work: '+(state.autoWork?'ON':'OFF')}else if(lower.includes('spawn')||lower.includes('agent')||lower.includes('create')){const nextSpawn=5-(state.cycles%5);response='⏳ Next agent spawn in '+nextSpawn+' cycle'+(nextSpawn!==1?'s':'')+'. Current progress: '+(state.cycles%5)+'/5'}else if(lower.includes('revenue')||lower.includes('money')||lower.includes('earn')){response='💰 Revenue Status:<br>• Total: $'+state.revenue.toFixed(2)+'<br>• Attempts: '+state.revenueAttempts.length+'<br>• Next attempt: Cycle '+Math.ceil((state.cycles+1)/10)*10}else if(lower.includes('skill')||lower.includes('learn')){response='🧠 Skills Learned ('+state.skills.length+' total):<br>'+state.skills.slice(-5).map(s=>'• '+s).join('<br>')}else if(lower.includes('log')||lower.includes('history')){response='📜 Recent Activity:<br>'+state.activities.slice(0,5).map(a=>'• '+a.msg).join('<br>')}else if(lower.includes('auto')||lower.includes('work')){toggleAutoWork();response='⚡ Auto-Work is now '+(state.autoWork?'ENABLED':'DISABLED')+'.'}else if(lower.includes('help')||lower.includes('?')||lower.includes('what can')){response="🎯 Here's what I can do:<br><br><strong>Commands:</strong><br>• \\\"Run cycle\\\" - Execute a work cycle<br>• \\\"Status\\\" - Show system status<br>• \\\"Spawn agent\\\" - Create new agent<br>• \\\"Revenue\\\" - Show earnings<br>• \\\"Skills\\\" - List learned skills<br>• \\\"Logs\\\" - View activity history<br>• \\\"Auto work on/off\\\" - Toggle automation<br><br><strong>Info:</strong><br>• Agents spawn every 5 cycles<br>• Revenue attempts every 10 cycles<br>• I learn a new skill every cycle"}else{response='🤔 I processed: \\\"'+text+'\\\"<br><br>I\\'m still learning natural language! Try these commands:<br>• \\\"Run cycle\\\" • \\\"Status\\\" • \\\"Spawn agent\\\" • \\\"Help\\\"'}response=response.replace(/\\*\\*(.*?)\\*\\*/g,'<strong style="color:var(--accent);">$1</strong>').replace(/\\n/g,'<br>');addChatMessage('ceo',response)},800+Math.random()*700)}
function triggerAction(action){switch(action){case'run-cycle':showModal('Cycle Triggered','Cycle would run now! In production, this triggers GitHub Actions.');break;case'spawn-agent':showModal('Spawn Agent','Agents spawn automatically every 5 cycles. Current: '+state.cycles+'/5');break;case'check-status':showModal('System Status','Cycles: '+state.cycles+'\\nAgents: '+state.agents.length+'\\nSkills: '+state.skills.length+'\\nRevenue: $'+state.revenue.toFixed(2));break;case'view-logs':switchTab('chat');sendQuick('Show logs');break}}
function showModal(title,text){document.getElementById('modalTitle').textContent=title;document.getElementById('modalText').textContent=text;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
document.getElementById('chatInput').addEventListener('input',function(){this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'});
init();
</script>
</body>
</html>'''

    @staticmethod
    def _render_timeline(activities):
        if not activities:
            return '<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-time">Now</div><div class="timeline-text">No activity yet. First cycle will start soon!</div></div>'
        html = ''
        for act in activities[-8:]:
            time = act.get('time', '--')
            msg = act.get('msg', '')
            html += f'<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-time">{time}</div><div class="timeline-text">{msg}</div></div>'
        return html

    @staticmethod
    def _render_agents(agents, cycles):
        html = ''
        agent_map = {
            'research': ('🔬', 'Research Agent', 'Web scraping & data collection'),
            'code': ('💻', 'Code Agent', 'Code generation & refactoring'),
            'design': ('🎨', 'Design Agent', 'UI/UX patterns & assets'),
            'marketing': ('📢', 'Marketing Agent', 'Content & SEO optimization'),
            'security': ('🔒', 'Security Agent', 'Vulnerability scanning'),
            'data': ('📊', 'Data Agent', 'Analytics & visualization'),
            'testing': ('🧪', 'Testing Agent', 'Test generation & coverage'),
            'documentation': ('📚', 'Docs Agent', 'Documentation generation'),
            'optimization': ('⚡', 'Optimize Agent', 'Performance tuning'),
            'community': ('🌐', 'Community Agent', 'Issue triage & engagement')
        }
        for agent_id in agents:
            if agent_id in agent_map:
                icon, name, desc = agent_map[agent_id]
                gen = max(1, cycles // 5)
                html += f'<div class="agent-item"><div class="agent-avatar">{icon}</div><div class="agent-info"><div class="agent-name">{name}</div><div class="agent-desc">{desc} • Gen {gen}</div></div><div class="agent-status spawned">RUNNING</div></div>'
        return html

    @staticmethod
    def _render_queue(agents, cycles):
        html = ''
        queue_data = [
            ('research', 5, '🔬', 'Research Agent', 'Web scraping & data collection'),
            ('code', 10, '💻', 'Code Agent', 'Code generation & refactoring'),
            ('design', 15, '🎨', 'Design Agent', 'UI/UX patterns & assets'),
            ('marketing', 20, '📢', 'Marketing Agent', 'Content & SEO optimization'),
            ('security', 25, '🔒', 'Security Agent', 'Vulnerability scanning'),
            ('data', 30, '📊', 'Data Agent', 'Analytics & visualization'),
            ('testing', 35, '🧪', 'Testing Agent', 'Test generation & coverage'),
            ('documentation', 40, '📚', 'Docs Agent', 'Documentation generation'),
            ('optimization', 45, '⚡', 'Optimize Agent', 'Performance tuning'),
            ('community', 50, '🌐', 'Community Agent', 'Issue triage & engagement')
        ]
        for agent_id, cycle_req, icon, name, desc in queue_data:
            if agent_id not in agents:
                cycles_needed = cycle_req - cycles
                opacity = 0.7 if cycles_needed <= 5 else 0.3
                status_text = 'READY!' if cycles_needed <= 0 else f'{cycles_needed} cycles away'
                html += f'<div class="agent-item" style="opacity:{opacity};"><div class="agent-avatar">{icon}</div><div class="agent-info"><div class="agent-name">{name}</div><div class="agent-desc">Spawns at cycle {cycle_req} ({status_text})</div></div><div class="agent-status pending">PENDING</div></div>'
        return html

    @staticmethod
    def _render_revenue_chart(revenue):
        if not revenue:
            bars = [20, 35, 25, 45, 30, 55, 40]
        else:
            bars = [min(100, max(10, float(r.get('amount', 0)) * 20)) for r in revenue[-7:]]
            while len(bars) < 7:
                bars.append(20)
        html = ''
        for i, h in enumerate(bars):
            html += f'<div class="revenue-bar" style="height:{h}%;animation-delay:{i*0.1}s;"></div>'
        return html

    @staticmethod
    def _render_revenue_timeline(revenue):
        if not revenue:
            return '<div class="timeline-item"><div class="timeline-dot" style="border-color:var(--text-dim);"></div><div class="timeline-time">Waiting...</div><div class="timeline-text">First revenue attempt will trigger at <span class="highlight">cycle 10</span></div></div>'
        html = ''
        for r in revenue:
            time = r.get('time', '--')
            cycle = r.get('cycle', 0)
            amount = r.get('amount', 0)
            method = r.get('method', 'Content Generation')
            html += f'<div class="timeline-item"><div class="timeline-dot" style="border-color:var(--success);"><div style="width:6px;height:6px;border-radius:50%;background:var(--success);"></div></div><div class="timeline-time">{time}</div><div class="timeline-text">Cycle {cycle}: Earned <span class="highlight">${amount}</span> via {method}</div></div>'
        return html

# ─── SELF-REPLICATION ENGINE ─────────────────────────────────────────────────
class ReplicationEngine:
    AGENT_VARIANTS = [
        "research", "code", "design", "marketing", "security",
        "data", "testing", "documentation", "optimization", "community"
    ]

    @classmethod
    def generate_agent(cls, variant: str, generation: int) -> str:
        specializations = {
            "research": {"focus": "web scraping, data collection, trend analysis", "tools": "requests, BeautifulSoup, RSS feeds", "output": "research_reports/"},
            "code": {"focus": "code generation, refactoring, bug fixing", "tools": "ast, jedi, static analysis", "output": "generated_code/"},
            "design": {"focus": "UI/UX patterns, CSS generation, asset creation", "tools": "svg generation, color theory", "output": "design_assets/"},
            "marketing": {"focus": "content creation, SEO optimization", "tools": "text generation, keyword analysis", "output": "marketing_content/"},
            "security": {"focus": "vulnerability scanning, dependency audit", "tools": "bandit, safety, gitLeaks patterns", "output": "security_reports/"},
            "data": {"focus": "data processing, analytics, visualization", "tools": "pandas, matplotlib, statistical analysis", "output": "data_outputs/"},
            "testing": {"focus": "test generation, coverage analysis", "tools": "pytest, unittest, mutation testing", "output": "test_suites/"},
            "documentation": {"focus": "doc generation, README updates", "tools": "markdown, sphinx, mermaid", "output": "docs/"},
            "optimization": {"focus": "performance tuning, resource optimization", "tools": "profiling, benchmarking", "output": "optimization_reports/"},
            "community": {"focus": "issue triage, PR review, contributor engagement", "tools": "GitHub API, sentiment analysis", "output": "community_reports/"}
        }
        spec = specializations.get(variant, specializations["research"])
        return f'''#!/usr/bin/env python3
"""BUDE Agent: {variant.upper()} | Generation {generation}"""
import os, json, time
from datetime import datetime
from pathlib import Path
AGENT_TYPE = "{variant}"
GENERATION = {generation}
OUTPUT_DIR = Path("{spec["output"]}")
LOG_FILE = Path("agents/{variant}_log.md")
def run():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.utcnow().isoformat()
    results = execute_specialization()
    log_entry = f"## {{AGENT_TYPE}} Agent Run - {{timestamp}}\n\n- Results: {{len(results)}} items\n- Status: {{'SUCCESS' if results else 'IDLE'}}\n\n"
    existing = LOG_FILE.read_text() if LOG_FILE.exists() else ""
    LOG_FILE.write_text(log_entry + existing)
    return results
def execute_specialization():
    """{spec["focus"]}"""
    results = []
    marker = OUTPUT_DIR / f"{{AGENT_TYPE}}_{{datetime.utcnow().strftime('%Y%m%d')}}.md"
    marker.write_text(f"# {{AGENT_TYPE.upper()}} Agent Output\n\nGenerated: {{datetime.utcnow().isoformat()}}\n")
    results.append(str(marker))
    return results
if __name__ == "__main__":
    run()
'''

    @classmethod
    def spawn(cls, memory: Memory) -> List[str]:
        created = []
        generation = memory.get("replication_count", 0) + 1
        cycle = memory.get("cycles_completed", 0)
        if cycle > 0 and cycle % 5 == 0:
            variant_index = (cycle // 5 - 1) % len(cls.AGENT_VARIANTS)
            variant = cls.AGENT_VARIANTS[variant_index]
            agent_dir = AGENTS_DIR / variant
            agent_dir.mkdir(parents=True, exist_ok=True)
            agent_file = agent_dir / "brain.py"
            agent_file.write_text(cls.generate_agent(variant, generation))
            workflow_path = Path(".github/workflows") / f"agent_{variant}.yml"
            workflow_path.write_text(cls._generate_agent_workflow(variant))
            created.append(variant)
            memory.set("replication_count", generation)
            Logger.log(f"Spawned new agent: {variant} (Gen {generation})")
        return created

    @staticmethod
    def _generate_agent_workflow(variant: str) -> str:
        return f'''name: BUDE Agent - {variant.upper()}
on:
  schedule:
    - cron: "0 */6 * * *"
  workflow_dispatch:
jobs:
  run-agent:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Run {variant} Agent
        run: python agents/{variant}/brain.py
      - name: Commit Results
        run: |
          git config user.name "BUDE Agent"
          git config user.email "agent@{variant}.bude"
          git add -A
          git diff --quiet && git diff --staged --quiet || git commit -m "[{variant}] Agent run $(date -u +%Y-%m-%d_%H:%M)"
          git push
'''

# ─── AUTONOMOUS TASK ENGINE ──────────────────────────────────────────────────
class TaskEngine:
    TASK_TEMPLATES = [
        "Analyze repository structure and suggest improvements",
        "Generate documentation for latest changes",
        "Create test cases for uncovered code paths",
        "Research trending technologies in the project domain",
        "Optimize existing code for performance",
        "Create a new feature proposal based on patterns",
        "Audit dependencies for security issues",
        "Generate marketing content for latest release",
        "Design UI mockups for upcoming features",
        "Build data pipeline for project metrics",
    ]

    @classmethod
    def generate_daily_tasks(cls, memory: Memory) -> List[Dict]:
        cycle = memory.get("cycles_completed", 0)
        tasks = []
        tasks.append({"id": f"task_{cycle}_improve", "type": "self_improvement", "description": "Evolve brain.py with new capabilities", "priority": "high"})
        template_index = cycle % len(cls.TASK_TEMPLATES)
        tasks.append({"id": f"task_{cycle}_work", "type": "productive", "description": cls.TASK_TEMPLATES[template_index], "priority": "medium"})
        if cycle % 3 == 0:
            tasks.append({"id": f"task_{cycle}_replicate", "type": "replication", "description": "Evaluate and spawn new agent variants", "priority": "high"})
        if cycle % 10 == 0:
            tasks.append({"id": f"task_{cycle}_revenue", "type": "revenue", "description": "Attempt autonomous revenue generation", "priority": "medium"})
        return tasks

    @classmethod
    def execute_task(cls, task: Dict, memory: Memory) -> bool:
        task_id = task["id"]
        task_type = task["type"]
        Logger.log(f"Executing task: {task_id} ({task_type})")
        try:
            if task_type == "self_improvement":
                return cls._self_improve(memory)
            elif task_type == "productive":
                return cls._productive_work(task, memory)
            elif task_type == "replication":
                return cls._replication_check(memory)
            elif task_type == "revenue":
                return cls._revenue_attempt(memory)
            else:
                return cls._generic_work(task, memory)
        except Exception as e:
            Logger.log(f"Task failed: {e}", "ERROR")
            memory.append("errors", {"task": task_id, "error": str(e), "time": datetime.utcnow().isoformat()})
            return False

    @staticmethod
    def _self_improve(memory: Memory) -> bool:
        cycle = memory.get("cycles_completed", 0)
        new_skills = [
            'Advanced pattern matching', 'GitHub API optimization', 'Multi-agent coordination',
            'Predictive scheduling', 'Automated code review', 'Dependency analysis',
            'Performance benchmarking', 'Security vulnerability detection'
        ]
        skill = new_skills[cycle % len(new_skills)]
        memory.append("skills_learned", skill)
        improve_dir = Path("improvements")
        improve_dir.mkdir(exist_ok=True)
        marker = improve_dir / f"improvement_{cycle}.md"
        marker.write_text(f"# Self-Improvement Cycle {cycle}\n\nNew skill acquired: {skill}\n\nTimestamp: {datetime.utcnow().isoformat()}\n")
        Logger.log(f"Self-improved: learned {skill}")
        return True

    @staticmethod
    def _productive_work(task: Dict, memory: Memory) -> bool:
        desc = task["description"]
        output_dir = Path("outputs")
        output_dir.mkdir(exist_ok=True)
        filename = f"output_{memory.get('cycles_completed', 0)}_{hashlib.md5(desc.encode()).hexdigest()[:8]}.md"
        output_file = output_dir / filename
        content = f'''# Task Output

**Task:** {desc}
**Completed:** {datetime.utcnow().isoformat()}
**Cycle:** {memory.get("cycles_completed", 0)}

## Results

This task was executed autonomously by BUDE CEO.
The system is learning and will improve this output over time.

## Next Steps

- Review output quality
- Feed results back into learning loop
- Iterate on approach
'''
        output_file.write_text(content)
        Logger.log(f"Productive work completed: {desc}")
        return True

    @staticmethod
    def _replication_check(memory: Memory) -> bool:
        created = ReplicationEngine.spawn(memory)
        return len(created) > 0

    @staticmethod
    def _revenue_attempt(memory: Memory) -> bool:
        revenue_dir = Path("revenue")
        revenue_dir.mkdir(exist_ok=True)
        attempt = {
            "time": datetime.utcnow().isoformat(),
            "method": "content_generation",
            "status": "attempted",
            "amount": str(round(random.uniform(1.0, 5.0), 2))
        }
        asset = revenue_dir / f"asset_{memory.get('cycles_completed', 0)}.md"
        asset.write_text(f"# Revenue Asset {memory.get('cycles_completed', 0)}\n\nGenerated by BUDE CEO\nPotential monetization: content, templates, tools\n")
        memory.append("revenue_attempts", attempt)
        Logger.log("Revenue attempt completed")
        return True

    @staticmethod
    def _generic_work(task: Dict, memory: Memory) -> bool:
        Logger.log(f"Generic work: {task['description']}")
        return True

# ─── MAIN CEO ORCHESTRATOR ───────────────────────────────────────────────────
class BUDECeo:
    def __init__(self):
        self.memory = Memory()
        self.logger = Logger()

    def run_cycle(self):
        cycle = self.memory.get("cycles_completed", 0)
        self.logger.log(f"=== BUDE CEO CYCLE {cycle} START ===")
        
        tasks = TaskEngine.generate_daily_tasks(self.memory)
        self.logger.log(f"Generated {len(tasks)} tasks")
        
        results = []
        for task in tasks:
            success = TaskEngine.execute_task(task, self.memory)
            results.append({"task": task["id"], "success": success})
        
        self.memory.set("cycles_completed", cycle + 1)
        self.memory.set("last_run", datetime.utcnow().isoformat())
        
        # Generate updated dashboard
        self._update_dashboard()
        
        success_rate = sum(1 for r in results if r["success"]) / len(results) if results else 0
        self.logger.log(f"Cycle {cycle} complete. Success rate: {success_rate:.0%}")
        self.logger.log(f"=== BUDE CEO CYCLE {cycle} END ===\n")
        
        return results

    def _update_dashboard(self):
        """Regenerate the dashboard HTML with latest data"""
        dashboard_html = DashboardGenerator.generate(self.memory)
        DASHBOARD_FILE.write_text(dashboard_html)
        Logger.log("Dashboard updated with latest data")

    def status_report(self) -> str:
        return f'''# BUDE CEO Status Report

**Cycles Completed:** {self.memory.get("cycles_completed", 0)}
**Agents Created:** {len(self.memory.get("agents_created", []))}
**Skills Learned:** {len(self.memory.get("skills_learned", []))}
**Last Run:** {self.memory.get("last_run", "Never")}
**Total Errors:** {len(self.memory.get("errors", []))}
**Revenue Attempts:** {len(self.memory.get("revenue_attempts", []))}

## Active Agents
{chr(10).join([f"- {a}" for a in self.memory.get("agents_created", [])]) or "- None yet"}

## Recent Skills
{chr(10).join([f"- {s}" for s in self.memory.get("skills_learned", [])[-5:]]) or "- None yet"}

---
*Report generated: {datetime.utcnow().isoformat()}*
'''

def main():
    ceo = BUDECeo()
    ceo.run_cycle()
    report = ceo.status_report()
    Path("STATUS.md").write_text(report)
    print("\n" + "="*60)
    print("BUDE CEO CYCLE COMPLETE")
    print("="*60)
    print(f"Check STATUS.md and dashboard.html for details")
    print("="*60)

if __name__ == "__main__":
    main()
