const fs = require("fs");
const path = require("path");

/**
 * ─────────────────────────────────────────
 * LOGGING SYSTEM (NEW)
 * ─────────────────────────────────────────
 */
const LOG_FILE = "agent-log.json";

function log(step, data) {
  const entry = {
    time: new Date().toISOString(),
    step,
    data
  };

  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
  }

  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

  console.log(`[${step}]`, data);
}

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
      success: 0,
      failure: 0,
      score: 0.5
    };
  }
}

function saveMemory(m) {
  fs.writeFileSync("agent-memory.json", JSON.stringify(m, null, 2));
}

/**
 * ─────────────────────────────────────────
 * SAFE FILE WRITER (FIXED ROOT ISSUE)
 * ─────────────────────────────────────────
 */
function writeFileSafe(file, content) {
  const safePath = path.join(process.cwd(), file); // 🔥 FIX: ensures repo root

  const dir = path.dirname(safePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(safePath, content);
  log("WRITE_FILE", { file: safePath });
}

/**
 * ─────────────────────────────────────────
 * PLANNER (DETERMINISTIC FOR STABILITY)
 * ─────────────────────────────────────────
 */
function planner(task) {
  log("PLANNER_INPUT", task);

  const t = task.toLowerCase();

  let plan = {
    goal: task,
    type: "generic",
    files: []
  };

  if (t.includes("dashboard")) {
    plan.type = "dashboard";
    plan.files.push("app/dashboard/page.jsx");
  } else if (t.includes("fix")) {
    plan.type = "fix";
    plan.files.push("app/error.jsx");
  } else {
    plan.files.push("app/page.jsx");
  }

  log("PLANNER_OUTPUT", plan);
  return plan;
}

/**
 * ─────────────────────────────────────────
 * GENERATOR
 * ─────────────────────────────────────────
 */
function generate(plan) {
  log("GENERATOR_START", plan);

  const files = plan.files.map(f => {
    return {
      file: f,
      content: `
export default function Page(){
  return (
    <div>
      <h1>BUDE AGENT OUTPUT</h1>
      <p>Task: ${plan.goal}</p>
      <p>Type: ${plan.type}</p>
    </div>
  );
}
`
    };
  });

  log("GENERATOR_OUTPUT", files);
  return files;
}

/**
 * ─────────────────────────────────────────
 * SIMPLE VALIDATION
 * ─────────────────────────────────────────
 */
function validate(files) {
  return files.map(f => ({
    ...f,
    valid: f.content.includes("return")
  }));
}

/**
 * ─────────────────────────────────────────
 * MAIN LOOP
 * ─────────────────────────────────────────
 */
function run(task) {
  log("RUN_START", task);

  const memory = loadMemory();

  // PLAN
  const plan = planner(task);

  // GENERATE
  let files = generate(plan);

  // VALIDATE
  files = validate(files);
  log("VALIDATION", files);

  // WRITE
  for (const f of files) {
    if (f.valid) {
      writeFileSafe(f.file, f.content);
    } else {
      log("SKIP_INVALID", f.file);
    }
  }

  // MEMORY UPDATE
  memory.runs++;

  if (files.every(f => f.valid)) {
    memory.success++;
  } else {
    memory.failure++;
  }

  memory.score = memory.success / memory.runs;

  saveMemory(memory);

  log("RUN_COMPLETE", memory);
}

const task = process.argv.slice(2).join(" ");
run(task);
