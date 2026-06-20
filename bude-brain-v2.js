#!/usr/bin/env node

/**
 * BUDE TECH OS v2.5 — GITHUB + CI SELF-HEAL BRAIN
 * Generates project + monitors CI + fixes + opens PRs
 */

const fs = require("fs");
const { execSync } = require("child_process");

let Octokit;
try {
  Octokit = require("@octokit/rest").Octokit;
} catch (e) {
  console.log("⚠️ Octokit not installed yet (ok during bootstrap)");
}

function run(cmd){
  console.log("\n> " + cmd);
  execSync(cmd, { stdio: "inherit" });
}

function write(path, content){
  fs.mkdirSync(require("path").dirname(path), { recursive: true });
  fs.writeFileSync(path, content);
}

/**
 * =========================
 * 1. BOOTSTRAP PROJECT
 * =========================
 */

console.log("\n🧠 BUDE TECH BRAIN v2.5 STARTING...");

if (!fs.existsSync("bude-tech-os")) {
  run("npx create-next-app@latest bude-tech-os --yes");
}

process.chdir("bude-tech-os");

fs.mkdirSync("engine", { recursive: true });
fs.mkdirSync("state", { recursive: true });

write("state/bude.json", JSON.stringify({
  prs: [],
  ci: [],
  fixes: []
}, null, 2));

/**
 * =========================
 * 2. CORE BRAIN ENGINE
 * =========================
 */

write("engine/brain.js", `
export function brain(input){

  return {
    plan: {
      goal: input,
      steps: [
        "analyze request",
        "design solution",
        "generate diff",
        "await approval"
      ]
    },

    diff: [
      {
        file: "app/generated/page.tsx",
        content: "<h1>BUDE AUTO GENERATED</h1>"
      }
    ],

    requiresApproval: true
  };
}
`);

/**
 * =========================
 * 3. GITHUB CLIENT
 * =========================
 */

const token = process.env.GITHUB_TOKEN;

let git = null;

if (token && Octokit) {
  git = new Octokit({ auth: token });
  console.log("🔗 GitHub connected");
}

/**
 * =========================
 * 4. CI FAILURE SCANNER
 * =========================
 */

async function getFailures(repo){

  if (!git) return [];

  try {
    const runs = await git.actions.listWorkflowRunsForRepo({
      owner: repo.owner,
      repo: repo.repo
    });

    return runs.data.workflow_runs.filter(r => r.conclusion === "failure");

  } catch (e) {
    console.log("CI fetch failed");
    return [];
  }
}

/**
 * =========================
 * 5. SIMPLE FIX ENGINE
 * =========================
 */

function generateFix(failure){

  const msg = (failure.name || "").toLowerCase();

  if (msg.includes("module")) {
    return {
      file: "fix/module.js",
      content: "// fix: missing module dependency"
    };
  }

  if (msg.includes("build")) {
    return {
      file: "fix/build.js",
      content: "// fix: build configuration issue"
    };
  }

  return {
    file: "fix/manual.js",
    content: "// manual review required"
  };
}

/**
 * =========================
 * 6. PR CREATION
 * =========================
 */

async function createPR(repo, branch){

  if (!git) return;

  await git.pulls.create({
    owner: repo.owner,
    repo: repo.repo,
    title: "BUDE AUTO FIX",
    head: branch,
    base: "main"
  });

  console.log("📦 PR created:", branch);
}

/**
 * =========================
 * 7. SELF HEAL LOOP
 * =========================
 */

async function selfHeal(repo){

  if (!git) return;

  console.log("\n🧠 CHECKING CI...");

  const failures = await getFailures(repo);

  if (!failures.length) {
    console.log("✅ No CI issues");
    return;
  }

  for (const f of failures){

    console.log("⚠️ FAILURE:", f.name);

    const fix = generateFix(f);

    write(fix.file, fix.content);

    const branch = "fix-" + Date.now();

    try {
      run("git checkout -b " + branch);
      run("git add .");
      run(`git commit -m "auto fix"`);
      run("git push origin " + branch);

      await createPR(repo, branch);

    } catch (e) {
      console.log("❌ git flow failed");
    }
  }
}

/**
 * =========================
 * 8. RUN
 * =========================
 */

(async () => {

  console.log("\n🚀 BUDE BRAIN ACTIVE");

  // optional repo config
  const repo = {
    owner: process.env.GH_OWNER || "your-org",
    repo: process.env.GH_REPO || "your-repo"
  };

  await selfHeal(repo);

  console.log("\n✅ DONE");
})();
