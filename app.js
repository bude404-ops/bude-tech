let data = {};

async function loadData() {
  const state = await fetch('core/state.json').then(r => r.json());
  const employees = await fetch('core/employees.json').then(r => r.json());
  const tasks = await fetch('core/tasks.json').then(r => r.json());
  const activity = await fetch('core/activity.json').then(r => r.json());

  data = { state, employees, tasks, activity };
  render('home');
}

function render(tab) {
  const app = document.getElementById("app");

  if (tab === "home") {
    app.innerHTML = `
      <div class="card">
        <h2>🧠 BudE OS V17</h2>
        <p>Goal: ${data.state.goal}</p>
        <p>Version: ${data.state.version}</p>
      </div>
    `;
  }

  if (tab === "team") {
    app.innerHTML = Object.entries(data.employees).map(([k,v]) => `
      <div class="card">
        <h3>${k}</h3>
        <p>${v.role}</p>
        <p>Tasks: ${v.tasks}</p>
      </div>
    `).join("");
  }

  if (tab === "tasks") {
    app.innerHTML = data.tasks.map(t => `
      <div class="card">
        <h3>${t.task}</h3>
        <p>Status: ${t.status}</p>
        <p>Assigned: ${t.assigned_to}</p>
      </div>
    `).join("");
  }

  if (tab === "activity") {
    app.innerHTML = data.activity.map(a => `
      <div class="card">
        <p>${a.event}</p>
      </div>
    `).join("");
  }

  if (tab === "chat") {
    app.innerHTML = `
      <div class="card">
        <h3>💬 Command Center</h3>
        <input id="cmd" placeholder="add task / assign builder_1 task" />
        <button onclick="send()">Send</button>
      </div>
    `;
  }
}

async function send() {
  const cmd = document.getElementById("cmd").value;

  await fetch("core/state.json", {
    method: "PUT",
    body: JSON.stringify({ command: cmd })
  });

  location.reload();
}

function tab(name) {
  render(name);
}

loadData();
setInterval(loadData, 5000);
