#!/usr/bin/env node

/**
 * BUDE TECH CEO v14.4 — GOVERNED AGENT CIVILIZATION ENGINE
 * Multi-agent voting + dependency graph + self-healing builds
 * FIXED: Dashboard auto-shuts down, writes static HTML for GitHub Pages
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { execSync } = require("child_process");

/* =========================
   CONFIG
========================= */

const CONFIG = {
  repoUrl: "https://github.com/bude404-ops/Bude-Tech.git",
  port: 3000,
  cycleDelay: 1200,
  maxCycles: 15,
  minSuccesses: 3
};

/* =========================
   STATE — Auto-reset stale
========================= */

const STATE_PATH = "data/state.json";

function freshState() {
  return {
    cycle: 0,
    phase: "init",
    goal: "build stable evolving web system",
    graph: {},
    reputation: { alpha: 1, beta: 1, gamma: 1 },
    history: [],
    logs: [],
    memory: { failures: {}, successes: {} },
    started: Date.now()
  };
}

function isStale(state) {
  if (!state || typeof state !== "object") return true;
  if (!state.started) return true;
  if (Date.now() - state.started > 300000) return true;
  if (!Array.isArray(state.history)) return true;
  if (typeof state.reputation !== "object") return true;
  return false;
}

function loadState() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (isStale(parsed)) {
      console.log("[CEO] Stale state detected — resetting");
      return freshState();
    }
    return parsed;
  } catch {
    return freshState();
  }
}

let STATE = loadState();

function saveState() {
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(STATE, null, 2));
}

function log(msg) {
  console.log("[CEO]", msg);
  STATE.logs.push({ t: Date.now(), msg });
}

/* =========================
   GIT
========================= */

function git(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" });
  } catch {
    return null;
  }
}

function gitSetup() {
  if (!fs.existsSync(".git")) {
    git("git init");
    git("git branch -M main");
  }
  if (!git("git remote get-url origin")) {
    git(`git remote add origin ${CONFIG.repoUrl}`);
  }
  git('git config user.name "CEO BOT"');
  git('git config user.email "bot@local"');
}

function commitPush(msg) {
  git("git add .");
  const r = git(`git commit -m "${msg}"`);
  if (!r || r.includes("nothing to commit")) return false;
  git("git push origin main");
  log("pushed");
  return true;
}

/* =========================
   STATIC DASHBOARD GENERATOR
   Writes dashboard.html to repo for GitHub Pages
========================= */

function generateStaticDashboard() {
  const successCount = Object.values(STATE.memory.successes).reduce((a, b) => a + b, 0);
  const failCount = Object.values(STATE.memory.failures).reduce((a, b) => a + b, 0);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUDE CEO v14.4</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 20px; line-height: 1.6; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(90deg, #4caf50, #81c784); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; max-width: 900px; margin: 0 auto; }
    .card { background: #151515; border: 1px solid #222; border-radius: 12px; padding: 1.2rem; }
    .card h3 { color: #4caf50; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .stat { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #1a1a1a; }
    .stat:last-child { border-bottom: none; }
    .stat .label { color: #888; }
    .stat .value { color: #fff; font-weight: 600; }
    .value.done { color: #4caf50; }
    .value.fail { color: #f44336; }
    .value.running { color: #ff9800; }
    .log { font-size: 0.8rem; color: #888; padding: 0.3rem 0; border-bottom: 1px solid #1a1a1a; }
    .log:last-child { border-bottom: none; }
    .log .time { color: #555; margin-right: 0.5rem; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.done { background: #1b3a1b; color: #4caf50; }
    .badge.fail { background: #3a1b1b; color: #f44336; }
    .footer { text-align: center; color: #444; font-size: 0.8rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #1a1a1a; }
    @media (max-width: 600px) { body { padding: 12px; } h1 { font-size: 1.4rem; } }
  </style>
</head>
<body>
  <h1>🧠 BUDE CEO v14.4</h1>
  <p class="subtitle">Governed Agent Civilization • Cycle ${STATE.cycle} / ${CONFIG.maxCycles} • Updated ${new Date().toLocaleString()}</p>

  <div class="grid">
    <div class="card">
      <h3>System Status</h3>
      <div class="stat"><span class="label">Phase</span><span class="value ${STATE.phase === 'done' ? 'done' : 'running'}">${STATE.phase}</span></div>
      <div class="stat"><span class="label">Successes</span><span class="value done">${successCount} / ${CONFIG.minSuccesses}</span></div>
      <div class="stat"><span class="label">Failures</span><span class="value fail">${failCount}</span></div>
    </div>

    <div class="card">
      <h3>Agent Reputation</h3>
      <div class="stat"><span class="label">Alpha</span><span class="value">${STATE.reputation.alpha.toFixed(3)}</span></div>
      <div class="stat"><span class="label">Beta</span><span class="value">${STATE.reputation.beta.toFixed(3)}</span></div>
      <div class="stat"><span class="label">Gamma</span><span class="value">${STATE.reputation.gamma.toFixed(3)}</span></div>
    </div>

    <div class="card">
      <h3>Build History</h3>
      ${STATE.history.map(h => `<div class="log"><span class="time">C${h.cycle}</span>${h.agent} → ${h.choice} <span class="badge ${h.success ? 'done' : 'fail'}">${h.success ? 'OK' : 'FAIL'}</span></div>`).join('')}
    </div>

    <div class="card">
      <h3>Memory</h3>
      <div class="stat"><span class="label">Successes</span><span class="value">${JSON.stringify(STATE.memory.successes)}</span></div>
      <div class="stat"><span class="label">Failures</span><span class="value">${JSON.stringify(STATE.memory.failures)}</span></div>
    </div>
  </div>

  <p class="footer">Built autonomously by BUDE CEO • <a href="https://github.com/bude404-ops/Bude-Tech" style="color:#4caf50">View Source</a></p>
</body>
</html>`;

  fs.writeFileSync("dashboard.html", html);
  log("dashboard.html generated");
}

/* =========================
   LIVE DASHBOARD (local dev)
========================= */

let server = null;

function dashboard() {
  server = http.createServer((req, res) => {
    if (req.url === "/json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(STATE, null, 2));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });

    const successCount = Object.values(STATE.memory.successes).reduce((a, b) => a + b, 0);
    const failCount = Object.values(STATE.memory.failures).reduce((a, b) => a + b, 0);

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BUDE CEO v14.4 LIVE</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #e0e0e0; padding: 20px; line-height: 1.6; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; background: linear-gradient(90deg, #4caf50, #81c784); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; max-width: 900px; }
    .card { background: #151515; border: 1px solid #222; border-radius: 12px; padding: 1.2rem; }
    .card h3 { color: #4caf50; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .stat { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #1a1a1a; }
    .stat:last-child { border-bottom: none; }
    .stat .label { color: #888; }
    .stat .value { color: #fff; font-weight: 600; }
    .value.done { color: #4caf50; }
    .value.fail { color: #f44336; }
    .value.running { color: #ff9800; }
    .log { font-size: 0.8rem; color: #888; padding: 0.3rem 0; border-bottom: 1px solid #1a1a1a; }
    .log:last-child { border-bottom: none; }
    .log .time { color: #555; margin-right: 0.5rem; }
    .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
    .badge.done { background: #1b3a1b; color: #4caf50; }
    .badge.fail { background: #3a1b1b; color: #f44336; }
    .refresh { position: fixed; top: 20px; right: 20px; background: #1a1a1a; border: 1px solid #333; color: #888; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-size: 0.8rem; }
    .refresh:hover { background: #222; color: #fff; }
    @media (max-width: 600px) { body { padding: 12px; } h1 { font-size: 1.4rem; } }
  </style>
</head>
<body>
  <h1>🧠 BUDE CEO v14.4 LIVE</h1>
  <p class="subtitle">Governed Agent Civilization • Cycle ${STATE.cycle} / ${CONFIG.maxCycles}</p>

  <div class="grid">
    <div class="card">
      <h3>System Status</h3>
      <div class="stat"><span class="label">Phase</span><span class="value ${STATE.phase === 'done' ? 'done' : 'running'}">${STATE.phase}</span></div>
      <div class="stat"><span class="label">Successes</span><span class="value done">${successCount} / ${CONFIG.minSuccesses}</span></div>
      <div class="stat"><span class="label">Failures</span><span class="value fail">${failCount}</span></div>
    </div>

    <div class="card">
      <h3>Agent Reputation</h3>
      <div class="stat"><span class="label">Alpha</span><span class="value">${STATE.reputation.alpha.toFixed(3)}</span></div>
      <div class="stat"><span class="label">Beta</span><span class="value">${STATE.reputation.beta.toFixed(3)}</span></div>
      <div class="stat"><span class="label">Gamma</span><span class="value">${STATE.reputation.gamma.toFixed(3)}</span></div>
    </div>

    <div class="card">
      <h3>Recent History</h3>
      ${STATE.history.slice(-5).map(h => {
        const d = new Date(h.cycle * 1200 + (STATE.started || Date.now()));
        const time = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
        return `<div class="log"><span class="time">${time}</span>${h.agent} → ${h.choice} <span class="badge ${h.success ? 'done' : 'fail'}">${h.success ? 'OK' : 'FAIL'}</span></div>`;
      }).join('')}
    </div>
  </div>

  <button class="refresh" onclick="location.reload()">↻ Refresh</button>
</body>
</html>`;

    res.end(html);
  }).listen(CONFIG.port);

  log("dashboard http://localhost:" + CONFIG.port);
}

function shutdownDashboard() {
  if (server) {
    server.close(() => {
      log("dashboard shut down");
    });
    server = null;
  }
}

/* =========================
   AGENTS
========================= */

function agentAlpha() {
  return { name: "api expansion", score: 8, agent: "alpha" };
}

function agentBeta() {
  return { name: "frontend upgrade", score: 7, agent: "beta" };
}

function agentGamma() {
  return { name: "system stability hardening", score: 9, agent: "gamma" };
}

/* =========================
   GOVERNANCE
========================= */

function vote(agents) {
  const scored = agents.map(a => {
    const weight = STATE.reputation[a.agent] || 1;
    return { ...a, final: a.score * weight };
  });
  scored.sort((a, b) => b.final - a.final);
  return scored[0];
}

/* =========================
   ARCHITECTURE
========================= */

function buildPlan(choice) {
  const plan = {};

  if (choice.name.includes("api")) {
    plan["backend/server.js"] = [
      "const http = require('http');",
      "",
      "http.createServer((req, res) => {",
      "  res.writeHead(200, { 'Content-Type': 'application/json' });",
      "  res.end(JSON.stringify({ ok: true, version: 'v14.4', time: Date.now() }));",
      "}).listen(process.env.PORT || 3000);",
      "",
      "console.log('API v14.4 running');"
    ].join("\n");
  }

  if (choice.name.includes("frontend")) {
    plan["frontend/index.html"] = [
      "<!DOCTYPE html>",
      "<html lang=\"en\">",
      "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"><title>BUDE v14</title></head>",
      "<body><h1>BUDE v14 UI</h1><p>Built by " + choice.agent + "</p></body>",
      "</html>"
    ].join("\n");
  }

  if (choice.name.includes("stability")) {
    plan["backend/health.js"] = [
      "module.exports = () => ({ status: 'OK', uptime: process.uptime() });"
    ].join("\n");
  }

  return plan;
}

/* =========================
   GRAPH
========================= */

function addGraph(file, status) {
  STATE.graph[file] = {
    status,
    version: (STATE.graph[file]?.version || 0) + 1,
    time: Date.now()
  };
}

/* =========================
   SAFE WRITE
========================= */

function writeSafe(file, content) {
  const backup = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    addGraph(file, "written");
    log("write " + file);
  } catch (e) {
    log("write failed " + file + ": " + e.message);
    if (backup) fs.writeFileSync(file, backup);
  }
}

/* =========================
   QA — Simple file validation
========================= */

function testRuntime() {
  return new Promise((resolve) => {
    const required = ["backend/server.js", "backend/health.js", "frontend/index.html"];
    let ok = true;

    for (const f of required) {
      if (!fs.existsSync(f)) {
        ok = false;
        log("MISSING: " + f);
      } else {
        const content = fs.readFileSync(f, "utf8");
        if (content.length < 10) {
          ok = false;
          log("EMPTY: " + f);
        }
      }
    }

    resolve(ok);
  });
}

/* =========================
   LEARNING
========================= */

function learn(choice, success) {
  if (!success) {
    STATE.memory.failures[choice.name] = (STATE.memory.failures[choice.name] || 0) + 1;
    STATE.reputation[choice.agent] *= 0.95;
    log(choice.agent + " rep down: " + STATE.reputation[choice.agent].toFixed(3));
  } else {
    STATE.memory.successes[choice.name] = (STATE.memory.successes[choice.name] || 0) + 1;
    STATE.reputation[choice.agent] *= 1.01;
    log(choice.agent + " rep up: " + STATE.reputation[choice.agent].toFixed(3));
  }
}

/* =========================
   LOOP
========================= */

function totalSuccesses() {
  return Object.values(STATE.memory.successes).reduce((a, b) => a + b, 0);
}

async function loop() {
  while (STATE.cycle < CONFIG.maxCycles) {
    STATE.cycle++;
    gitSetup();

    log("cycle " + STATE.cycle);

    if (totalSuccesses() >= CONFIG.minSuccesses) {
      log("Minimum successes reached. Finishing.");
      break;
    }

    const agents = [agentAlpha(), agentBeta(), agentGamma()];
    const choice = vote(agents);
    log("chosen: " + choice.name + " by " + choice.agent);

    const plan = buildPlan(choice);
    for (const [file, content] of Object.entries(plan)) {
      writeSafe(file, content);
    }

    const ok = await testRuntime();
    learn(choice, ok);

    STATE.history.push({
      cycle: STATE.cycle,
      choice: choice.name,
      agent: choice.agent,
      success: ok
    });

    // Generate static dashboard every cycle
    generateStaticDashboard();

    if (ok) {
      commitPush("v14.4 success cycle " + STATE.cycle);
    } else {
      log("failure — adapts next cycle");
    }

    saveState();

    if (STATE.cycle < CONFIG.maxCycles && totalSuccesses() < CONFIG.minSuccesses) {
      await new Promise(r => setTimeout(r, CONFIG.cycleDelay));
    }
  }

  log("BUILD COMPLETE");
  log("Total successes: " + totalSuccesses());
  log("Final reputation: " + JSON.stringify(STATE.reputation));
  saveState();

  // Final dashboard update
  generateStaticDashboard();
  shutdownDashboard();
}

/* =========================
   START
========================= */

function start() {
  log("Starting BUDE CEO v14.4");
  dashboard();
  loop();
}

start();
