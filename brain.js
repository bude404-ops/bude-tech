#!/usr/bin/env node

/**
 * BUDE TECH CEO v10 — SWARM INTELLIGENCE CORE
 * Goal-driven autonomous dev system (single-file)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const http = require("http");

/* =========================
   STATE
========================= */

const STATE_PATH = "data/state.json";

const DEFAULT_STATE = {
  cycle: 0,
  phase: "init",
  backlog: [],
  completed: [],
  logs: [],
  memory: {
    builtFeatures: {},
    scoreHistory: {}
  }
};

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return DEFAULT_STATE;
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

  git('git config user.email "bot@local"');
  git('git config user.name "CEO BOT"');
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
      <h1>BUDE CEO v10</h1>
      <p>Phase: ${STATE.phase}</p>
      <p>Cycle: ${STATE.cycle}</p>

      <h3>Backlog</h3>
      <pre>${JSON.stringify(STATE.backlog, null, 2)}</pre>

      <h3>Completed</h3>
      <pre>${JSON.stringify(STATE.completed.slice(-5), null, 2)}</pre>

      <h3>Memory</h3>
      <pre>${JSON.stringify(STATE.memory, null, 2)}</pre>
    </body>
    </html>
    `);
  }).listen(3000);

  log("dashboard running http://localhost:3000");
}

/* =========================
   TEMPLATE SYSTEM
========================= */

const T = {
  express: () => `
const express = require('express');
const app = express();

app.get("/", (req,res)=>res.json({ok:true}));

app.listen(3000);
`,

  auth: () => `
module.exports = {
 login: (u,p) => u==="admin" && p==="admin"
};
`,

  frontend: () => `
<!DOCTYPE html>
<html><body><h1>BUDE APP</h1></body></html>
`
};

/* =========================
   FEATURE ENGINE
========================= */

const FEATURE_CATALOG = [
  {
    name: "auth system",
    impact: 9,
    complexity: 6,
    files: {
      "backend/auth.js": T.auth(),
      "backend/server.js": T.express()
    }
  },
  {
    name: "frontend shell",
    impact: 6,
    complexity: 4,
    files: {
      "frontend/index.html": T.frontend()
    }
  },
  {
    name: "api core",
    impact: 8,
    complexity: 5,
    files: {
      "backend/server.js": T.express()
    }
  }
];

/* =========================
   SCORING ENGINE (NEW IN V10)
========================= */

function score(feature) {
  const memoryPenalty = STATE.memory.builtFeatures[feature.name] ? 5 : 0;

  const score =
    feature.impact * 2 -
    feature.complexity -
    memoryPenalty;

  return score;
}

/* =========================
   PLANNER (SMART SELECTION)
========================= */

function planner() {
  const scored = FEATURE_CATALOG
    .map(f => ({ ...f, score: score(f) }))
    .sort((a, b) => b.score - a.score);

  const chosen = scored[0];

  log(`selected feature: ${chosen.name} (score ${chosen.score})`);

  STATE.backlog.push({
    id: crypto.randomUUID(),
    ...chosen,
    status: "pending"
  });

  STATE.phase = "architect";
}

/* =========================
   ARCHITECT
========================= */

function architect() {
  for (const item of STATE.backlog) {
    if (item.status !== "pending") continue;

    item.tasks = Object.entries(item.files).map(([file, content]) => ({
      file,
      content
    }));

    item.status = "built";
  }

  STATE.phase = "builder";
}

/* =========================
   BUILDER
========================= */

function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function builder() {
  for (const item of STATE.backlog) {
    if (item.status !== "built") continue;

    for (const t of item.tasks) {
      writeFile(t.file, t.content);
      log("write " + t.file);
    }

    item.status = "qa";
  }

  STATE.phase = "qa";
}

/* =========================
   QA (IMPROVED CHECKS)
========================= */

function qa() {
  for (const item of STATE.backlog) {
    if (item.status !== "qa") continue;

    let ok = true;

    for (const t of item.tasks) {
      if (!fs.existsSync(t.file)) ok = false;

      // basic sanity check
      const content = fs.readFileSync(t.file, "utf8");
      if (content.length < 10) ok = false;
    }

    item.status = ok ? "done" : "failed";
  }

  STATE.phase = "devops";
}

/* =========================
   DEVOPS + LEARNING
========================= */

function devops() {
  const done = STATE.backlog.filter(b => b.status === "done");

  for (const f of done) {
    STATE.completed.push(f.name);

    STATE.memory.builtFeatures[f.name] = true;
    STATE.memory.scoreHistory[f.name] = (STATE.memory.scoreHistory[f.name] || 0) + 1;
  }

  if (done.length > 0) {
    commitPush("v10 auto build cycle " + STATE.cycle);
  }

  STATE.backlog = STATE.backlog.filter(b => b.status !== "done");

  STATE.phase = "init";
}

/* =========================
   LOOP (TRUE SWARM)
========================= */

async function loop() {
  while (true) {
    STATE.cycle++;

    gitSetup();

    log(`cycle ${STATE.cycle} | phase ${STATE.phase}`);

    switch (STATE.phase) {
      case "init":
        planner();
        break;
      case "architect":
        architect();
        break;
      case "builder":
        builder();
        break;
      case "qa":
        qa();
        break;
      case "devops":
        devops();
        break;
    }

    saveState();

    await new Promise(r => setTimeout(r, 1200));
  }
}

/* =========================
   START
========================= */

function start() {
  dashboard();
  loop();
}

start();
