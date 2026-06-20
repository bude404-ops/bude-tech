const fs = require("fs");
const path = require("path");

/**
 * ─────────────────────────────────────────
 * MEMORY SYSTEM
 * ─────────────────────────────────────────
 */
function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync("agent-memory.json", "utf8"));
  } catch {
    return {
      runs: 0,
      passes: 0,
      failures: 0,
      critique_hits: 0,
      repair_actions: 0,
      score: 0.5
    };
  }
}

function saveMemory(m) {
  fs.writeFileSync("agent-memory.json", JSON.stringify(m, null, 2));
}

/**
 * ─────────────────────────────────────────
 * AGENTS
 * ─────────────────────────────────────────
 */

const Planner = {
  run(task) {
    return {
      goal: task,
      architecture: task.toLowerCase().includes("dashboard")
        ? "dashboard-app"
        : "generic-app"
    };
  }
};

const Builder = {
  run(plan) {
    return [{
      file: "app/page.jsx",
      content: `
export default function Page(){
  return <div>Built: ${plan.goal}</div>;
}
`
    }];
  }
};

const Critic = {
  run(files) {
    let issues = [];

    for (const f of files) {
      if (!f.content.includes("return")) {
        issues.push("Missing return in component");
      }
      if (f.content.length < 50) {
        issues.push("Too small / incomplete code");
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }
};

const Tester = {
  run(files) {
    let pass = true;

    for (const f of files) {
      if (f.content.includes("undefined")) pass = false;
      if (f.content.length < 30) pass = false;
    }

    return pass;
  }
};

const Repair = {
  run(files, critique) {
    if (critique.passed) return files;

    return files.map(f => ({
      ...f,
      content: `
export default function Fixed(){
  return <div>Auto-repaired safe output</div>;
}
`
    }));
  }
};

/**
 * ─────────────────────────────────────────
 * WRITER
 * ─────────────────────────────────────────
 */
function write(file, content) {
  const dir = path.dirname(file);
  if (dir) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content);
}

/**
 * ─────────────────────────────────────────
 * SWARM ORCHESTRATION LOOP
 * ─────────────────────────────────────────
 */
function run(task) {
  let memory = loadMemory();

  // 1. PLAN
  const plan = Planner.run(task);
  console.log("PLAN:", plan);

  // 2. BUILD
  let files = Builder.run(plan);
  console.log("BUILT FILES:", files.length);

  // 3. CRITIQUE
  const critique = Critic.run(files);
  console.log("CRITIQUE:", critique);

  // 4. TEST
  const testResult = Tester.run(files);
  console.log("TEST:", testResult);

  // 5. REPAIR (if needed)
  if (!critique.passed || !testResult) {
    files = Repair.run(files, critique);
    memory.repair_actions++;
  }

  // 6. WRITE OUTPUT
  for (const f of files) {
    write(f.file, f.content);
    console.log("CREATED:", f.file);
  }

  // 7. MEMORY UPDATE
  memory.runs++;

  if (critique.passed && testResult) {
    memory.passes++;
  } else {
    memory.failures++;
  }

  memory.score = memory.passes / (memory.runs || 1);

  saveMemory(memory);

  console.log("MEMORY:", memory);
}

const task = process.argv.slice(2).join(" ");
run(task);
