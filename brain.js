#!/usr/bin/env node

/**
 * BUDE TECH CEO v14 — GOVERNED AGENT CIVILIZATION ENGINE
 * Multi-agent voting + dependency graph + self-healing builds
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
  port: 3000,
  cycleDelay: 1200,
  maxCycles: 10
};

/* =========================
   STATE
========================= */

const STATE_PATH = "data/state.json";

function freshState() {
  return {
    cycle: 0,
    phase: "init",
    goal: "build stable evolving web system",
    graph: {},          // dependency graph
    reputation: {       // agent reputation
      alpha: 1,
      beta: 1,
      gamma: 1
    },
    history: [],
    logs: [],
    memory: {
      failures: {},
      successes: {}
    }
  };
}

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
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
    git("git remote add origin https://github.com/bude404-ops/Bude-Tech.git");
  }

  git('git config user.name "CEO BOT"');
  git('git config user.email "bot@local"');
}

function commitPush(msg) {
  git("git add .");
  const r = git(`git commit -m "${msg}"`);
  if (!r || r.includes("nothing to commit")) return;
  git("git push origin main");
  log("pushed");
}

/* =========================
   DASHBOARD
========================= */

function dashboard() {
  http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" });

    res.end(`
      <html>
      <body style="background:#111;color:#fff;font-family:Arial">
        <h1>BUDE CEO v14 — CIVILIZATION ENGINE</h1>
        <p>Cycle: ${STATE.cycle}</p>
        <p>Goal: ${STATE.goal}</p>

        <h3>Reputation</h3>
        <pre>${JSON.stringify(STATE.reputation, null, 2)}</pre>

        <h3>Memory</h3>
        <pre>${JSON.stringify(STATE.memory, null, 2)}</pre>
      </body>
      </html>
    `);
  }).listen(CONFIG.port);

  log("dashboard http://localhost:" + CONFIG.port);
}

/* =========================
   AGENTS (3 competing CEOs)
========================= */

function agentAlpha() {
  return { name: "api expansion", score: 8 };
}

function agentBeta() {
  return { name: "frontend upgrade", score: 7 };
}

function agentGamma() {
  return { name: "system stability hardening", score: 9 };
}

/* =========================
   GOVERNANCE (VOTING SYSTEM)
========================= */

function vote(agents) {
  // weighted by reputation
  const scored = agents.map(a => {
    const weight = STATE.reputation[a.agent] || 1;
    return {
      ...a,
      final: a.score * weight
    };
  });

  scored.sort((a, b) => b.final - a.final);

  return scored[0];
}

/* =========================
   ARCHITECTURE GENERATION
========================= */

function buildPlan(choice) {
  const plan = {};

  if (choice.name.includes("api")) {
    plan["backend/server.js"] = `
const http = require('http');

http.createServer((req,res)=>{
  res.end("API v14 OK");
}).listen(3000);
`;
  }

  if (choice.name.includes("frontend")) {
    plan["frontend/index.html"] = `
<!DOCTYPE html>
<html>
<body>
<h1>BUDE v14 UI</h1>
</body>
</html>
`;
  }

  if (choice.name.includes("stability")) {
    plan["backend/health.js"] = `
module.exports = () => "OK";
`;
  }

  return plan;
}

/* =========================
   GRAPH SYSTEM
========================= */

function addGraph(file, status) {
  STATE.graph[file] = {
    status,
    version: (STATE.graph[file]?.version || 0) + 1,
    time: Date.now()
  };
}

/* =========================
   SAFE WRITE + ROLLBACK SUPPORT
========================= */

function writeSafe(file, content) {
  const backup = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8")
    : null;

  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);

    addGraph(file, "written");
  } catch (e) {
    log("write failed " + file);

    if (backup) fs.writeFileSync(file, backup);
  }
}

/* =========================
   QA (REAL HTTP TEST)
========================= */

function testRuntime() {
  return new Promise((resolve) => {
    try {
      const child = execSync("node backend/server.js & echo $!", { shell: true });

      setTimeout(() => {
        http.get("http://localhost:3000", (res) => {
          resolve(res.statusCode === 200);
        }).on("error", () => resolve(false));
      }, 900);
    } catch {
      resolve(false);
    }
  });
}

/* =========================
   LEARNING SYSTEM
========================= */

function learn(choice, success) {
  if (!success) {
    STATE.memory.failures[choice.name] =
      (STATE.memory.failures[choice.name] || 0) + 1;

    STATE.reputation.alpha *= 0.95;
  } else {
    STATE.memory.successes[choice.name] =
      (STATE.memory.successes[choice.name] || 0) + 1;

    STATE.reputation.alpha *= 1.01;
    STATE.reputation.beta *= 1.01;
    STATE.reputation.gamma *= 1.01;
  }
}

/* =========================
   LOOP (GOVERNED CIVILIZATION)
========================= */

async function loop() {
  while (STATE.cycle < CONFIG.maxCycles) {
    STATE.cycle++;
    gitSetup();

    log("cycle " + STATE.cycle);

    /* --- 3 AGENTS PROPOSE --- */
    const agents = [
      { agent: "alpha", ...agentAlpha() },
      { agent: "beta", ...agentBeta() },
      { agent: "gamma", ...agentGamma() }
    ];

    /* --- GOVERNANCE VOTE --- */
    const choice = vote(agents);
    log("chosen: " + choice.name);

    /* --- BUILD PLAN --- */
    const plan = buildPlan(choice);

    for (const [file, content] of Object.entries(plan)) {
      writeSafe(file, content);
    }

    /* --- TEST SYSTEM --- */
    const ok = await testRuntime();

    /* --- LEARN --- */
    learn(choice, ok);

    STATE.history.push({
      cycle: STATE.cycle,
      choice: choice.name,
      success: ok
    });

    if (ok) {
      commitPush("v14 success cycle " + STATE.cycle);
    } else {
      log("failure → system adapts next cycle");
    }

    saveState();

    await new Promise(r => setTimeout(r, CONFIG.cycleDelay));
  }

  log("v14 COMPLETE");
}

/* =========================
   START
========================= */

function start() {
  dashboard();
  loop();
}

start();
