const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  let state = {};

  try {
    state = JSON.parse(fs.readFileSync("data/state.json", "utf-8"));
  } catch {
    state = { phase: "unknown", cycle: 0, tasks: [], logs: [] };
  }

  const html = `
  <html>
  <head>
    <title>BUDE CEO Dashboard</title>
    <style>
      body { font-family: Arial; background:#111; color:#fff; padding:20px; }
      .card { background:#222; padding:15px; margin:10px 0; border-radius:10px; }
      .log { font-size:12px; color:#aaa; }
      .good { color:#4caf50; }
      .warn { color:#ff9800; }
    </style>
  </head>
  <body>
    <h1>🧠 BUDE CEO DASHBOARD</h1>

    <div class="card">
      <h2>System Status</h2>
      <p>Phase: <b>${state.phase}</b></p>
      <p>Cycle: <b>${state.cycle}</b></p>
      <p>Tasks: <b>${state.tasks?.length || 0}</b></p>
    </div>

    <div class="card">
      <h2>Recent Logs</h2>
      ${(state.logs || [])
        .slice(-10)
        .reverse()
        .map(l => `<div class="log">• ${l.msg}</div>`)
        .join("")}
    </div>

    <div class="card">
      <h2>Pending Tasks</h2>
      ${(state.tasks || [])
        .filter(t => t.status === "pending")
        .map(t => `<div class="log">📁 ${t.type} → ${t.path || t.goal}</div>`)
        .join("")}
    </div>

  </body>
  </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`📊 Dashboard running on http://localhost:${PORT}`);
});
