const fs = require("fs");
const path = require("path");

/**
 * ─────────────────────────────────────────
 * MEMORY SYSTEM (learning + evolution tracking)
 * ─────────────────────────────────────────
 */
function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync("agent-memory.json", "utf8"));
  } catch {
    return {
      projects: [],
      success_rate: 0.5,
      complexity_bias: "medium"
    };
  }
}

function saveMemory(m) {
  fs.writeFileSync("agent-memory.json", JSON.stringify(m, null, 2));
}

/**
 * ─────────────────────────────────────────
 * SYSTEM ARCHITECTURE DECIDER
 * ─────────────────────────────────────────
 */
function architect(task, memory) {
  const t = task.toLowerCase();

  let system = {
    frontend: [],
    api: [],
    data: [],
    modules: []
  };

  // FARM / AGRI SAAS (your real use case)
  if (t.includes("farm") || t.includes("livestock")) {
    system.frontend.push("dashboard", "animals", "paddocks", "finance");
    system.api.push("animals", "paddocks", "reports");
    system.data.push("animal_schema", "paddock_schema", "finance_schema");
    system.modules.push("auth", "reports");
  }

  // GENERIC SAAS
  else if (t.includes("saas") || t.includes("platform")) {
    system.frontend.push("dashboard", "settings");
    system.api.push("core");
    system.data.push("core_schema");
    system.modules.push("auth");
  }

  // FALLBACK SYSTEM
  else {
    system.frontend.push("home");
    system.api.push("basic");
    system.data.push("basic_schema");
    system.modules.push("core");
  }

  return system;
}

/**
 * ─────────────────────────────────────────
 * FILE GENERATORS
 * ─────────────────────────────────────────
 */

function write(file, content) {
  const dir = path.dirname(file);
  if (dir) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content);
}

function genPage(name) {
  return {
    file: `app/${name}/page.jsx`,
    content: `
export default function Page(){
  return <div>${name.toUpperCase()} MODULE</div>;
}
`
  };
}

function genAPI(name) {
  return {
    file: `app/api/${name}/route.js`,
    content: `
export async function GET(){
  return Response.json({ module: "${name}", status: "ok" });
}
`
  };
}

function genSchema(name) {
  return {
    file: `lib/schema/${name}.js`,
    content: `
export const ${name}Schema = {
  id: "string",
  created_at: "date",
  data: {}
};
`
  };
}

/**
 * ─────────────────────────────────────────
 * FACTORY ENGINE
 * ─────────────────────────────────────────
 */
function run(task) {
  let memory = loadMemory();

  const system = architect(task, memory);

  console.log("ARCHITECTURE:", system);

  let files = [];

  // FRONTEND
  for (const f of system.frontend) files.push(genPage(f));

  // API
  for (const a of system.api) files.push(genAPI(a));

  // DATA
  for (const d of system.data) files.push(genSchema(d));

  // MODULES (simple UI modules)
  for (const m of system.modules) {
    files.push(genPage(m));
  }

  // WRITE ALL FILES
  for (const f of files) {
    write(f.file, f.content);
    console.log("CREATED:", f.file);
  }

  // UPDATE MEMORY
  memory.projects.push({
    task,
    system,
    time: Date.now()
  });

  memory.success_rate = Math.min(1, memory.success_rate + 0.01);

  saveMemory(memory);

  console.log("MEMORY UPDATED:", memory);
}

const task = process.argv.slice(2).join(" ");
run(task);
