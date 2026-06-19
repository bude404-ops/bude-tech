#!/usr/bin/env node

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");
const express = require("express");

/**
 * =========================
 * STATE
 * =========================
 */

const STATE_FILE = "data/state.json";

let STATE = loadState();

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {
      phase: "init",
      cycle: 0,
      tasks: [],
      logs: []
    };
  }
}

function saveState() {
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(STATE, null, 2));
}

/**
 * =========================
 * LOGGING
 * =========================
 */

function log(msg) {
  console.log(`[CEO] ${msg}`);
  STATE.logs.push({ t: Date.now(), msg });
}

/**
 * =========================
 * GIT LAYER
 * =========================
 */

function git(cmd) {
  try {
    return execSync(cmd, { encoding: "utf-8" });
  } catch (e) {
    log(`GIT ERROR: ${cmd}`);
    return null;
  }
}

function ensureGit() {
  if (!fs.existsSync(".git")) {
    log("Init git repo");
    git("git init");
    git("git branch -M main");
  }

  if (!git("git remote get-url origin")) {
    log("Adding remote (EDIT THIS URL)");
    git("git remote add origin https://github.com/bude404-ops/Bude-Tech.git");
  }

  git('git config user.name "CEO BOT"');
  git('git config user.email "bot@local"');
}

function commitPush(msg) {
  git("git add .");
  const res = git(`git commit -m "${msg}"`);
  if (!res || res.includes("nothing to commit")) return;
  git("git push origin main");
  log("Pushed to GitHub");
}

/**
 * =========================
 * ENGINE
 * =========================
 */

class Engine {
  add(task) {
    STATE.tasks.push({
      id: crypto.randomUUID(),
      status: "pending",
      ...task
    });
  }

  run() {
    const pending = STATE.tasks.filter(t => t.status === "pending");

    for (const t of pending) {
      log(`TASK: ${t.type}`);

      try {
        if (t.type === "file") {
          fs.mkdirSync(path.dirname(t.path), { recursive: true });
          fs.writeFileSync(t.path, t.content);
          log(`FILE: ${t.path}`);
        }

        if (t.type === "code") {
          fs.mkdirSync(path.dirname(t.path), { recursive: true });
          fs.writeFileSync(
            t.path,
            `// AUTO GENERATED\nconsole.log("ACTIVE ${t.path}");`
          );
          log(`CODE: ${t.path}`);
        }

        t.status = "done";
      } catch (e) {
        t.status = "failed";
        log(e.message);
      }
    }

    // CLEANUP: Remove completed/failed tasks
    const before = STATE.tasks.length;
    STATE.tasks = STATE.tasks.filter(t => t.status === "pending");
    const cleared = before - STATE.tasks.length;
    if (cleared > 0) log(`Cleared ${cleared} finished tasks`);
  }

  hasPending() {
    return STATE.tasks.some(t => t.status === "pending");
  }
}

const ENGINE = new Engine();

/**
 * =========================
 * PHASES
 * =========================
 */

function bootstrap() {
  ["core", "backend", "frontend", "data"].forEach(d =>
    fs.mkdirSync(d, { recursive: true })
  );

  ENGINE.add({
    type: "file",
    path: "frontend/index.html",
    content: `<!DOCTYPE html>
<html>
<head><title>BUDE SYSTEM</title></head>
<body><h1>BUDE SYSTEM ONLINE</h1></body>
</html>`
  });

  STATE.phase = "plan";
}

function plan() {
  ENGINE.add({ type: "code", path: "backend/server.js" });
  ENGINE.add({ type: "code", path: "backend/api.js" });

  STATE.phase = "build";
  commitPush("PLAN phase");
}

function build() {
  ENGINE.add({ type: "code", path: "frontend/app.js" });
  ENGINE.add({ type: "code", path: "frontend/sw.js" });

  STATE.phase = "final";
  commitPush("BUILD phase");
}

function final() {
  ENGINE.add({
    type: "file",
    path: "package.json",
    content: JSON.stringify(
      {
        name: "bude-system",
        version: "1.0.0",
        scripts: { start: "node backend/server.js" }
      },
      null,
      2
    )
  });

  STATE.phase = "done";
  commitPush("FINAL phase");
}

/**
 * =========================
 * DASHBOARD (LIVE UI)
 * =========================
 */

function startDashboard() {
  const app = express();

  app.get("/", (req, res) => {
    res.send(`
      <html>
      <head>
        <title>CEO Dashboard</title>
        <style>
          body { font-family: Arial; background:#111; color:#fff; padding:20px; }
          .card { background:#222; padding:10px; margin:10px 0; border-radius:8px; }
        </style>
      </head>
      <body>
        <h1>🧠 BUDE CEO DASHBOARD</h1>

        <div class="card">
          <p>Phase: <b>${STATE.phase}</b></p>
          <p>Cycle: <b>${STATE.cycle}</b></p>
          <p>Tasks: <b>${STATE.tasks.filter(t => t.status === "pending").length} pending</b></p>
        </div>

        <div class="card">
          <h3>Logs</h3>
          ${(STATE.logs.slice(-10)).map(l => `<div>• ${l.msg}</div>`).join("")}
        </div>
      </body>
      </html>
    `);
  });

  app.listen(3000, () =>
    console.log("📊 Dashboard: http://localhost:3000")
  );
}

/**
 * =========================
 * LOOP — FIXED
 * =========================
 */

async function loop() {
  while (STATE.phase !== "done") {
    STATE.cycle++;

    console.log("\n====================");
    log(`CYCLE ${STATE.cycle} | ${STATE.phase}`);
    console.log("====================\n");

    ensureGit();

    // Phase logic: queue tasks for current phase
    switch (STATE.phase) {
      case "init":
        bootstrap();
        break;
      case "plan":
        plan();
        break;
      case "build":
        build();
        break;
      case "final":
        final();
        break;
    }

    // Wait for all tasks in this phase to finish
    while (ENGINE.hasPending()) {
      ENGINE.run();
      saveState();
      if (ENGINE.hasPending()) {
        log("Waiting for tasks...");
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    saveState();

    // Small delay before next phase
    if (STATE.phase !== "done") {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  log("✅ BUILD COMPLETE — All phases finished.");
  saveState();
}

/**
 * =========================
 * START
 * =========================
 */

function start() {
  log("Starting BUDE CEO FULL SYSTEM");
  startDashboard();
  loop();
}

start();
