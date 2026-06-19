#!/usr/bin/env node

/**
 * BUDE TECH CEO v9 — SINGLE FILE AUTONOMOUS ENGINE
 * Planner → Architect → Builder → QA → DevOps → Dashboard
 * Fully self-contained, zero dependencies
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
  files: {},
  logs: []
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

    const html = `
    <html><body style="background:#111;color:#fff;font-family:Arial">
    <h1>BUDE CEO v9</h1>
    <p>Phase: ${STATE.phase}</p>
    <p>Cycle: ${STATE.cycle}</p>
    <h3>Backlog</h3>
    <pre>${JSON.stringify(STATE.backlog, null, 2)}</pre>
    <h3>Logs</h3>
    <pre>${STATE.logs.slice(-10).map(l => l.msg).join("\n")}</pre>
    </body></html>`;
    
    res.end(html);
  }).listen(3000);

  log("dashboard http://localhost:3000");
}

/* =========================
   TEMPLATE SYSTEM (compressed)
========================= */

const T = {
  express: () => `
const express = require('express');
const app = express();
app.use(express.json());

app.get('/', (req,res)=>res.json({ok:true}));

app.listen(3000,()=>console.log('server running'));
`,

  auth: () => `
module.exports = {
 login:u=>u==="admin",
 register:()=>true
};
`,

  frontend: () => `
<!DOCTYPE html>
<html>
<body>
<h1>BUDE APP</h1>
<script src="app.js"></script>
</body>
</html>
`,

  appjs: () => `
console.log("frontend active");
`
};

/* =========================
   PLANNER
========================= */

function planner() {
  const ideas = [
    {
      name: "auth system",
      files: {
        "backend/auth.js": T.auth(),
        "backend/server.js": T.express()
      }
    },
    {
      name: "frontend shell",
      files: {
        "frontend/index.html": T.frontend(),
        "frontend/app.js": T.appjs()
      }
    }
  ];

  const pick = ideas[Math.floor(Math.random() * ideas.length)];
  STATE.backlog.push({
    id: crypto.randomUUID(),
    ...pick,
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
   QA
========================= */

function qa() {
  for (const item of STATE.backlog) {
    if (item.status !== "qa") continue;

    // lightweight validation
    let ok = true;

    for (const t of item.tasks) {
      if (!fs.existsSync(t.file)) ok = false;
    }

    item.status = ok ? "done" : "failed";
  }

  STATE.phase = "devops";
}

/* =========================
   DEVOPS
========================= */

function devops() {
  const done = STATE.backlog.filter(b => b.status === "done");

  if (done.length > 0) {
    commitPush("auto build cycle " + STATE.cycle);
  }

  STATE.backlog = STATE.backlog.filter(b => b.status !== "done");

  STATE.phase = "init";
}

/* =========================
   LOOP
========================= */

async function loop() {
  while (true) {
    STATE.cycle++;
    gitSetup();

    log("cycle " + STATE.cycle + " phase " + STATE.phase);

    switch (STATE.phase) {
      case "init": planner(); break;
      case "architect": architect(); break;
      case "builder": builder(); break;
      case "qa": qa(); break;
      case "devops": devops(); break;
    }

    saveState();

    await new Promise(r => setTimeout(r, 1500));
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
