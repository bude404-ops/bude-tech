const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

// ─────────────────────────────────────────
// GROQ CLIENT (FIXED)
// ─────────────────────────────────────────
const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ─────────────────────────────────────────
// MEMORY SYSTEM
// ─────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(fs.readFileSync("company-state.json", "utf8"));
  } catch {
    return {
      features: [],
      revenue_score: 0.5,
      stability: 0.5,
      deployments: 0,
      failures: 0
    };
  }
}

function saveState(state) {
  fs.writeFileSync("company-state.json", JSON.stringify(state, null, 2));
}

// ─────────────────────────────────────────
// SAFE JSON PARSER (CRITICAL FIX)
// ─────────────────────────────────────────
function safeJSONParse(text, fallback = []) {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("⚠️ JSON parse failed, using fallback");
    return fallback;
  }
}

// ─────────────────────────────────────────
// FILE WRITER
// ─────────────────────────────────────────
function writeFile(file, content) {
  const full = path.join(process.cwd(), file);
  const dir = path.dirname(full);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(full, content);
}

// ─────────────────────────────────────────
// GROQ CALL WRAPPER
// ─────────────────────────────────────────
async function ask(model, system, user) {
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.4
  });

  return res.choices[0].message.content;
}

// ─────────────────────────────────────────
// 1. CTO AGENT
// ─────────────────────────────────────────
async function cto(issue, state) {
  return ask(
    "llama3-70b-8192",
    "You are a CTO. Turn ideas into structured technical direction.",
    JSON.stringify({ issue, state })
  );
}

// ─────────────────────────────────────────
// 2. PRODUCT AGENT
// ─────────────────────────────────────────
async function product(ctoOutput) {
  return ask(
    "llama3-70b-8192",
    "You are a product manager. Define features clearly.",
    ctoOutput
  );
}

// ─────────────────────────────────────────
// 3. ENGINEERING AGENT
// ─────────────────────────────────────────
async function engineer(productSpec) {
  const output = await ask(
    "mixtral-8x7b-32768",
    `You are a senior engineer.
Return ONLY valid JSON:
[
  { "file": "path", "content": "full file content" }
]`,
    productSpec
  );

  return safeJSONParse(output, [
    {
      file: "app/page.jsx",
      content: `export default function Page(){ return <div>Fallback Build</div>; }`
    }
  ]);
}

// ─────────────────────────────────────────
// 4. QA AGENT
// ─────────────────────────────────────────
async function qa(files) {
  return ask(
    "llama3-8b-8192",
    "You are QA. Find bugs or issues in the code.",
    JSON.stringify(files)
  );
}

// ─────────────────────────────────────────
// OPS SYSTEM (METRICS)
// ─────────────────────────────────────────
function ops(state, qaReport, success) {
  state.deployments++;

  if (success) {
    state.revenue_score += 0.02;
    state.stability += 0.03;
  } else {
    state.failures++;
    state.stability -= 0.05;
  }

  state.revenue_score = Math.max(0, Math.min(1, state.revenue_score));
  state.stability = Math.max(0, Math.min(1, state.stability));

  state.features.push({
    time: new Date().toISOString(),
    qaReport,
    success
  });

  return state;
}

// ─────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────
async function run(issuePath) {
  const issue = fs.readFileSync(issuePath, "utf8");
  let state = loadState();

  console.log("🧠 ISSUE:", issue);

  try {
    // CTO
    const ctoPlan = await cto(issue, state);
    console.log("CTO DONE");

    // PRODUCT
    const productSpec = await product(ctoPlan);
    console.log("PRODUCT DONE");

    // ENGINEER
    const files = await engineer(productSpec);
    console.log("ENGINEERING DONE");

    // QA
    const qaReport = await qa(files);
    console.log("QA DONE");

    const success = !qaReport.toLowerCase().includes("bad");

    // APPLY FILES
    for (const f of files) {
      writeFile(f.file, f.content);
    }

    // UPDATE STATE
    state = ops(state, qaReport, success);
    saveState(state);

    console.log("✅ RUN COMPLETE");
  } catch (err) {
    console.log("❌ SYSTEM ERROR:", err.message);

    state.failures++;
    saveState(state);
  }
}

// ENTRY
const issuePath = process.argv.slice(2)[0];
run(issuePath);
