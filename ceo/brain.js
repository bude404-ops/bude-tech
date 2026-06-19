#!/usr/bin/env node

/**
 * BUDE TECH CEO v6.0 — FINAL AUTONOMOUS SOFTWARE FACTORY
 * Real GitHub PR-based self-building system
 */

const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");
const { Octokit } = require("@octokit/rest");

/* ───────────────────────────────
   CONFIG
────────────────────────────── */

const API_KEY = process.env.OPENROUTER_API_KEY;
const RUN_ID = process.env.GITHUB_RUN_NUMBER || "local";

const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

const MAX_API_PER_DAY = 25;

const MEMORY_FILE = "ceo/memory.json";
const BACKLOG_FILE = "ceo/backlog.json";
const API_LOG = "ceo/api_log.json";
const LOCK_FILE = "ceo/run.lock";

/* ───────────────────────────────
   GITHUB CLIENT
────────────────────────────── */

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/* ───────────────────────────────
   SAFE UTILITIES
────────────────────────────── */

function exists(file) {
  try {
    fsSync.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function atomicWrite(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, data);
  await fs.rename(tmp, file);
}

/* ───────────────────────────────
   RUN LOCK
────────────────────────────── */

async function acquireLock() {
  try {
    if (exists(LOCK_FILE)) return false;
    await atomicWrite(LOCK_FILE, Date.now().toString());
    return true;
  } catch {
    return false;
  }
}

/* ───────────────────────────────
   AI LAYER (OPENROUTER)
────────────────────────────── */

async function aiAsk(prompt, maxTokens = 900) {
  if (!API_KEY) return "";

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    }, (res) => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json?.choices?.[0]?.message?.content || "");
        } catch {
          resolve("");
        }
      });
    });

    req.on("error", () => resolve(""));

    req.write(JSON.stringify({
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        { role: "system", content: "You are a senior software architect. Output production-ready code only." },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.4
    }));

    req.end();
  });
}

/* ───────────────────────────────
   MEMORY
────────────────────────────── */

async function loadMemory() {
  try {
    return JSON.parse(await fs.readFile(MEMORY_FILE, "utf8"));
  } catch {
    return {
      runs: 0,
      products: [],
      failures: []
    };
  }
}

/* ───────────────────────────────
   BACKLOG ENGINE
────────────────────────────── */

async function loadBacklog() {
  try {
    return JSON.parse(await fs.readFile(BACKLOG_FILE, "utf8"));
  } catch {
    return { items: [], lastId: 0 };
  }
}

async function saveBacklog(b) {
  await atomicWrite(BACKLOG_FILE, JSON.stringify(b, null, 2));
}

function addTask(b, title, type, priority, desc) {
  if (b.items.find(i => i.title === title && i.status !== "failed")) return;

  b.lastId++;

  b.items.push({
    id: b.lastId,
    title,
    type,
    priority,
    description: desc,
    status: "open",
    created: new Date().toISOString()
  });
}

function getTask(b) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };

  return b.items
    .filter(i => i.status === "open")
    .sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2))[0];
}

/* ───────────────────────────────
   GITHUB AUTONOMY LAYER
────────────────────────────── */

async function createBranch(branch) {
  const base = await octokit.repos.getBranch({
    owner: OWNER,
    repo: REPO,
    branch: "main"
  });

  await octokit.git.createRef({
    owner: OWNER,
    repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: base.data.commit.sha
  });
}

async function commitAndPush(branch, files, message) {
  execSync(`git checkout -b ${branch} || git checkout ${branch}`);

  for (const f of files) {
    await fs.mkdir(path.dirname(f.path), { recursive: true });
    await fs.writeFile(f.path, f.content);
  }

  execSync("git add .");
  execSync(`git commit -m "${message}"`);
  execSync(`git push origin ${branch}`);
}

async function createPR(branch, title, body) {
  return octokit.pulls.create({
    owner: OWNER,
    repo: REPO,
    head: branch,
    base: "main",
    title,
    body
  });
}

/* ───────────────────────────────
   DEV AGENT (REAL CODE BUILDER)
────────────────────────────── */

async function devBuild(task) {
  const name = task.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
  const branch = `auto/${name}`;

  const code = await aiAsk(
    `Build a REAL production Node.js project.

Task:
${task.description}

Return:
- index.js
- package.json (if needed)
- README.md

No explanation. Only code.`,
    1200
  );

  const files = [
    {
      path: `projects/${name}/index.js`,
      content: code
    },
    {
      path: `projects/${name}/README.md`,
      content: `# ${task.title}\nAuto-generated module by BUDE CEO v6`
    }
  ];

  await createBranch(branch);
  await commitAndPush(branch, files, `feat: ${task.title}`);
  await createPR(branch, task.title, "Auto-generated autonomous PR");

  return { branch, success: true };
}

/* ───────────────────────────────
   QA AGENT (LIGHT VALIDATION)
────────────────────────────── */

function qaCheck(code) {
  if (!code) return false;
  if (code.includes("eval(")) return false;
  return true;
}

/* ───────────────────────────────
   TASK GENERATION
────────────────────────────── */

function generateTasks(b, m) {
  if (!b.items.length) {
    addTask(b, "Build URL Shortener", "feature", "high", "Create a simple URL shortener API");
    addTask(b, "Build API Core", "feature", "critical", "Create base Express API service");
    addTask(b, "Build Dashboard UI", "feature", "medium", "Create admin dashboard frontend");
  }
}

/* ───────────────────────────────
   MAIN EXECUTION ENGINE
────────────────────────────── */

async function main() {
  const ok = await acquireLock();
  if (!ok) {
    console.log("[CEO] locked");
    return;
  }

  const memory = await loadMemory();
  const backlog = await loadBacklog();

  memory.runs++;

  generateTasks(backlog, memory);

  const task = getTask(backlog);

  let log = [];

  if (task) {
    task.status = "running";

    try {
      const result = await devBuild(task);

      task.status = "done";
      log.push(`${task.title} → PR created (${result.branch})`);
    } catch (e) {
      task.status = "failed";
      memory.failures.push(task.title);
      log.push(`${task.title} FAILED`);
    }
  } else {
    log.push("No tasks available");
  }

  memory.lastRun = new Date().toISOString();

  await atomicWrite(MEMORY_FILE, JSON.stringify(memory, null, 2));
  await saveBacklog(backlog);

  await atomicWrite(
    `ceo/reports/run_${RUN_ID}.md`,
    `# Run ${RUN_ID}\n\n` + log.map(l => "- " + l).join("\n")
  );

  console.log("[CEO] completed run");
}

main().catch(err => {
  console.error("[CEO FATAL]", err);
  process.exit(1);
});
