const API_BASE = window.location.origin;

// ─── TABS ───
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'status') loadStatus();
    if (tabId === 'memory') loadMemory();
    if (tabId === 'tasks') loadTasks();
    if (tabId === 'evolution') loadEvolution();
}

// ─── CHAT ───
function sendMessage() {
    const input = document.getElementById('chat-message');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatMsg('user', msg);
    input.value = '';
    
    // Simulated BudE response (replace with real API later)
    setTimeout(() => {
        addChatMsg('bude', `Received: "${msg}". BudE evolution engine is active.`);
    }, 500);
}

function addChatMsg(sender, text) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.innerHTML = `<div class="sender">${sender.toUpperCase()}</div><div>${escapeHtml(text)}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── SYSTEM STATUS ───
async function loadStatus() {
    const grid = document.getElementById('status-grid');
    const status = document.getElementById('system-status');
    
    try {
        const mem = await fetchJson('system/memory.json');
        const cycles = mem?.evolution_cycles || 0;
        const last = mem?.last_cycle ? new Date(mem.last_cycle).toLocaleString() : 'Never';
        const model = mem?.last_model_used || 'None';
        const errors = mem?.errors?.length || 0;
        
        grid.innerHTML = `
            <div class="status-card">
                <h3>Evolution Cycles</h3>
                <div class="value">${cycles}</div>
            </div>
            <div class="status-card">
                <h3>Last Cycle</h3>
                <div class="value" style="font-size:0.9rem">${last}</div>
            </div>
            <div class="status-card">
                <h3>Last Model</h3>
                <div class="value" style="font-size:0.9rem">${model}</div>
            </div>
            <div class="status-card">
                <h3>Errors</h3>
                <div class="value" style="color:${errors>0?'#ff4444':'#00ff88'}">${errors}</div>
            </div>
        `;
        
        status.textContent = 'ONLINE';
        status.className = 'status online';
        
    } catch (e) {
        grid.innerHTML = '<div class="status-card"><h3>Status</h3><div class="value">Unavailable</div></div>';
        status.textContent = 'OFFLINE';
        status.className = 'status offline';
    }
}

// ─── MEMORY ───
async function loadMemory() {
    const display = document.getElementById('memory-display');
    try {
        const mem = await fetchJson('system/memory.json');
        display.textContent = JSON.stringify(mem, null, 2);
    } catch (e) {
        display.textContent = 'No memory file found. Run an evolution cycle first.';
    }
}

// ─── TASKS ───
async function loadTasks() {
    const list = document.getElementById('task-list');
    try {
        const mem = await fetchJson('system/memory.json');
        const tasks = mem?.tasks || [
            {id: 1, text: 'Initialize dashboard', done: true},
            {id: 2, text: 'Run first evolution cycle', done: false},
            {id: 3, text: 'Build agent modules', done: false},
            {id: 4, text: 'Add crypto analysis module', done: false}
        ];
        
        list.innerHTML = tasks.map(t => `
            <li class="${t.done ? 'done' : ''}">
                <span>${escapeHtml(t.text)}</span>
                <button class="task-toggle" onclick="toggleTask(${t.id})">${t.done ? 'Undo' : 'Done'}</button>
            </li>
        `).join('');
    } catch (e) {
        list.innerHTML = '<li>Failed to load tasks</li>';
    }
}

function toggleTask(id) {
    // Placeholder — real implementation would save to memory.json
    console.log('Toggle task', id);
}

// ─── EVOLUTION LOG ───
async function loadEvolution() {
    const display = document.getElementById('evolution-display');
    try {
        const log = await fetchText('system/evolution.log');
        display.textContent = log || 'No evolution log found.';
    } catch (e) {
        display.textContent = 'No evolution log found. Run an evolution cycle first.';
    }
}

// ─── UTILS ───
async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(r.status);
    return r.json();
}

async function fetchText(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(r.status);
    return r.text();
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
    loadStatus();
    addChatMsg('bude', 'BudE OS v0.2 initialized. Evolution engine standing by.');
});
