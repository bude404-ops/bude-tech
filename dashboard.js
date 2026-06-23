const GITHUB_USER = "bude404-ops";
const GITHUB_REPO = "Bude-Tech";
const GITHUB_FULL = "bude404-ops/Bude-Tech";
const API_BASE = window.location.origin;

let autoWorkInterval = null;
let isAutoWorking = false;

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

// ─── AUTO WORK ───
function toggleAutoWork() {
    const btn = document.getElementById('auto-work-btn');
    const status = document.getElementById('auto-work-status');
    
    if (isAutoWorking) {
        clearInterval(autoWorkInterval);
        autoWorkInterval = null;
        isAutoWorking = false;
        btn.textContent = 'AUTO WORK: OFF';
        btn.classList.remove('active');
        status.textContent = 'Tap to start autonomous evolution';
        status.classList.remove('working');
        addChatMsg('bude', 'AUTO WORK stopped.');
    } else {
        isAutoWorking = true;
        btn.textContent = 'AUTO WORK: ON';
        btn.classList.add('active');
        status.textContent = 'Running evolution cycles every 30 seconds...';
        status.classList.add('working');
        addChatMsg('bude', 'AUTO WORK started! Running evolution cycles...');
        
        runEvolutionCycle();
        autoWorkInterval = setInterval(runEvolutionCycle, 30000);
    }
}

async function runEvolutionCycle() {
    const time = new Date().toLocaleTimeString();
    addChatMsg('bude', `[${time}] Triggering evolution cycle...`);
    showProgress(true);
    
    try {
        const triggered = await triggerGitHubWorkflow();
        
        if (triggered) {
            addChatMsg('bude', 'Evolution cycle queued on GitHub Actions.');
            await checkCommits();
        } else {
            addChatMsg('bude', 'GitHub trigger failed. Simulating local task generation...');
            simulateLocalEvolution();
        }
        
        loadStatus();
        loadTasks();
        
    } catch (e) {
        addChatMsg('bude', `Cycle error: ${e.message}`, 'ERROR');
    } finally {
        showProgress(false);
    }
}

function showProgress(show) {
    let bar = document.getElementById('progress-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'progress-bar';
        bar.className = 'progress-bar';
        bar.innerHTML = '<div class="progress-fill"></div>';
        document.querySelector('.auto-work-bar').appendChild(bar);
    }
    bar.style.display = show ? 'block' : 'none';
    if (show) {
        bar.querySelector('.progress-fill').style.width = '0%';
        setTimeout(() => bar.querySelector('.progress-fill').style.width = '100%', 100);
    }
}

async function checkCommits() {
    try {
        const resp = await fetch(`https://api.github.com/repos/${GITHUB_FULL}/commits?per_page=5`);
        const commits = await resp.json();
        
        const feed = document.getElementById('commit-feed');
        if (feed) {
            feed.innerHTML = commits.map(c => `
                <div class="commit-item">
                    <span class="commit-msg">${escapeHtml(c.commit.message)}</span>
                    <span class="commit-time">${timeAgo(c.commit.committer.date)}</span>
                </div>
            `).join('');
        }
        
        // Check if latest commit is from BudE
        const latest = commits[0];
        if (latest?.commit?.message?.includes('BudE evolution')) {
            addChatMsg('bude', `New code deployed! ${latest.commit.message}`);
        }
        
    } catch (e) {
        console.log('Commit check failed', e);
    }
}

async function triggerGitHubWorkflow() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        addChatMsg('bude', 'No GitHub token. Add one with /token <key> or cycles run on schedule only.');
        return false;
    }
    
    try {
        const resp = await fetch(`https://api.github.com/repos/${GITHUB_FULL}/actions/workflows/evolve.yml/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({ref: 'main'})
        });
        return resp.status === 204;
    } catch (e) {
        return false;
    }
}

function simulateLocalEvolution() {
    const tasks = [
        "Analyze current repo structure",
        "Identify missing dashboard components",
        "Plan next agent module",
        "Review evolution logs for errors",
        "Optimize existing code",
        "Check for self-upgrade opportunities"
    ];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    queueTask(`[AUTO] ${randomTask}`);
    addChatMsg('bude', `Auto-generated task: "${randomTask}"`);
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
/evolve — trigger single evolution cycle
/auto — toggle auto work mode
/task <desc> — queue new task
/tasks — view task list
/agent <type> — request agent module
/crypto <wallet> — analyze Solana wallet
/log — show evolution log
/commits — show recent commits
/token <key> — store GitHub token
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
            addChatMsg('bude', 'Triggering single evolution cycle...');
            runEvolutionCycle();
            break;
            
        case 'auto':
            toggleAutoWork();
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
            
        case 'commits':
            checkCommits();
            addChatMsg('bude', 'Loading recent commits...');
            break;
            
        case 'token':
            if (!args) {
                addChatMsg('bude', 'Usage: /token <github_personal_access_token>');
                return;
            }
            localStorage.setItem('github_token', args);
            addChatMsg('bude', 'GitHub token stored. Auto-work can now trigger real workflows.');
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
    } catch (e) {}
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
        const upgrades = mem?.upgrades_made?.length || 0;
        
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
                <h3>Self-Upgrades</h3>
                <div class="value" style="color:${upgrades>0?'#00ff88':'#888'}">${upgrades}</div>
            </div>
            <div class="status-card">
                <h3>Errors</h3>
                <div class="value" style="color:${errors>0?'#ff4444':'#00ff88'}">${errors}</div>
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
            list.innerHTML = '<li>No tasks. Use /task or tap AUTO WORK.</li>';
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
        display.textContent = 'No evolution log. Run /evolve or tap AUTO WORK.';
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
    checkCommits();
    addChatMsg('bude', `BudE OS v0.2 online. Repo: ${GITHUB_FULL}.`);
    addChatMsg('bude', 'Tap AUTO WORK to start autonomous evolution, or type /help for commands.');
});
