const GITHUB_USER = "bude404-ops";
const GITHUB_REPO = "Bude-Tech";
const GITHUB_FULL = "bude404-ops/Bude-Tech";
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

// ─── CHAT / COMMANDS ───
function sendMessage() {
    const input = document.getElementById('chat-message');
    const msg = input.value.trim();
    if (!msg) return;
    
    addChatMsg('user', msg);
    input.value = '';
    
    if (msg.startsWith('/')) {
        handleCommand(msg);
    } else {
        addChatMsg('bude', 'Freeform chat requires AI backend. Use /help for commands.');
    }
}

function handleCommand(cmd) {
    const parts = cmd.slice(1).split(' ');
    const action = parts[0];
    const args = parts.slice(1).join(' ');
    
    switch(action) {
        case 'help':
            addChatMsg('bude', `BUDĒ COMMANDS:
/help — show commands
/status — refresh system status
/memory — view memory.json
/evolve — trigger evolution cycle
/task <desc> — queue new task
/tasks — view task list
/agent <type> — request agent module
/crypto <wallet> — analyze Solana wallet
/log — show evolution log
/repo — open GitHub repo
/clear — clear chat`);
            break;
            
        case 'status':
            loadStatus();
            switchTab('status');
            addChatMsg('bude', 'System status refreshed.');
            break;
            
        case 'memory':
            loadMemory();
            switchTab('memory');
            addChatMsg('bude', 'Memory loaded.');
            break;
            
        case 'evolve':
            addChatMsg('bude', 'Queueing evolution cycle...');
            queueCommand('evolve', 'Trigger evolution cycle');
            break;
            
        case 'task':
            if (!args) {
                addChatMsg('bude', 'Usage: /task <description>');
                return;
            }
            queueTask(args);
            addChatMsg('bude', `Task queued: "${args}"`);
            break;
            
        case 'tasks':
            loadTasks();
            switchTab('tasks');
            addChatMsg('bude', 'Task list loaded.');
            break;
            
        case 'agent':
            if (!args) {
                addChatMsg('bude', 'Usage: /agent <coder|researcher|architect|crypto|all>');
                return;
            }
            queueCommand('agent', args);
            addChatMsg('bude', `Agent request queued: ${args}`);
            break;
            
        case 'crypto':
            if (!args) {
                addChatMsg('bude', 'Usage: /crypto <wallet_address>');
                return;
            }
            queueCommand('crypto', args);
            addChatMsg('bude', `Crypto analysis queued for: ${args}`);
            break;
            
        case 'log':
            loadEvolution();
            switchTab('evolution');
            addChatMsg('bude', 'Evolution log loaded.');
            break;
            
        case 'repo':
            window.open(`https://github.com/${GITHUB_FULL}`, '_blank');
            addChatMsg('bude', `Opening https://github.com/${GITHUB_FULL}`);
            break;
            
        case 'clear':
            document.getElementById('chat-box').innerHTML = '';
            addChatMsg('bude', 'Chat cleared.');
            break;
            
        default:
            addChatMsg('bude', `Unknown: /${action}. Type /help.`);
    }
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

// ─── QUEUE SYSTEM ───
async function queueCommand(type, data) {
    const queue = await loadQueue();
    queue.push({
        id: Date.now(),
        type: type,
        data: data,
        timestamp: new Date().toISOString(),
        status: 'pending'
    });
    await saveQueue(queue);
}

async function queueTask(text) {
    await queueCommand('task', text);
}

async function loadQueue() {
    try {
        const r = await fetch('system/queue.json');
        if (!r.ok) return [];
        return await r.json();
    } catch (e) {
        return [];
    }
}

async function saveQueue(queue) {
    localStorage.setItem('bude_queue', JSON.stringify(queue));
    try {
        await fetch('http://localhost:5000/queue', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(queue)
        });
    } catch (e) {
        // API not running, localStorage fallback
    }
}

// ─── SYSTEM STATUS ───
async function loadStatus() {
    const grid = document.getElementById('status-grid');
    const status = document.getElementById('system-status');
    
    try {
        const mem = await fetchJson('system/memory.json');
        const cycles = mem?.evolution_cycles || 0;
        const last = mem?.last_cycle ? timeAgo(mem.last_cycle) : 'Never';
        const model = mem?.last_model_used || 'None';
        const errors = mem?.errors?.length || 0;
        const queue = (await loadQueue()).length;
        
        grid.innerHTML = `
            <div class="status-card">
                <h3>Evolution Cycles</h3>
                <div class="value">${cycles}</div>
            </div>
            <div class="status-card">
                <h3>Last Cycle</h3>
                <div class="value" style="font-size:0.85rem">${last}</div>
            </div>
            <div class="status-card">
                <h3>Active Model</h3>
                <div class="value" style="font-size:0.85rem">${model}</div>
            </div>
            <div class="status-card">
                <h3>Queue</h3>
                <div class="value" style="color:${queue>0?'#ffaa00':'#00ff88'}">${queue}</div>
            </div>
            <div class="status-card">
                <h3>Errors</h3>
                <div class="value" style="color:${errors>0?'#ff4444':'#00ff88'}">${errors}</div>
            </div>
            <div class="status-card">
                <h3>Repo</h3>
                <div class="value" style="font-size:0.75rem">${GITHUB_FULL}</div>
            </div>
        `;
        
        status.textContent = 'ONLINE';
        status.className = 'status online';
        
    } catch (e) {
        grid.innerHTML = '<div class="status-card"><h3>System</h3><div class="value">Booting</div></div>';
        status.textContent = 'OFFLINE';
        status.className = 'status offline';
    }
}

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
}

// ─── MEMORY ───
async function loadMemory() {
    const display = document.getElementById('memory-display');
    try {
        const mem = await fetchJson('system/memory.json');
        display.textContent = JSON.stringify(mem, null, 2);
    } catch (e) {
        display.textContent = 'No memory file found. Run /evolve first.';
    }
}

// ─── TASKS ───
async function loadTasks() {
    const list = document.getElementById('task-list');
    try {
        const mem = await fetchJson('system/memory.json');
        const memTasks = mem?.tasks || [];
        const queue = await loadQueue();
        const queuedTasks = queue.filter(q => q.type === 'task' && q.status === 'pending');
        
        const allTasks = [
            ...memTasks.map(t => ({...t, source: 'memory'})),
            ...queuedTasks.map(q => ({id: q.id, text: q.data, done: false, source: 'queue'}))
        ];
        
        if (allTasks.length === 0) {
            list.innerHTML = '<li>No tasks. Use /task <description> to add one.</li>';
            return;
        }
        
        list.innerHTML = allTasks.map(t => `
            <li class="${t.done ? 'done' : ''}">
                <span>${escapeHtml(t.text)} ${t.source === 'queue' ? '<small>[queued]</small>' : ''}</span>
                ${!t.done ? `<button class="task-toggle" onclick="completeTask(${t.id})">Done</button>` : ''}
            </li>
        `).join('');
    } catch (e) {
        list.innerHTML = '<li>Failed to load tasks</li>';
    }
}

function completeTask(id) {
    addChatMsg('bude', `Task ${id} marked complete. Will sync on next /evolve.`);
}

// ─── EVOLUTION LOG ───
async function loadEvolution() {
    const display = document.getElementById('evolution-display');
    try {
        const log = await fetchText('system/evolution.log');
        const lines = log.split('\n').slice(-50).join('\n');
        display.textContent = lines || 'Log is empty.';
    } catch (e) {
        display.textContent = 'No evolution log. Run /evolve first.';
    }
}

// ─── UTILS ───
async function fetchJson(path) {
    const r = await fetch(path + '?t=' + Date.now());
    if (!r.ok) throw new Error(r.status);
    return r.json();
}

async function fetchText(path) {
    const r = await fetch(path + '?t=' + Date.now());
    if (!r.ok) throw new Error(r.status);
    return r.text();
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
    loadStatus();
    addChatMsg('bude', `BudE OS v0.2 online. Repo: ${GITHUB_FULL}. Type /help for commands.`);
});
