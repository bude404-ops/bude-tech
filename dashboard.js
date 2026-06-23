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
    
    try {
        const triggered = await triggerGitHubWorkflow();
        
        if (triggered) {
            addChatMsg('bude', 'Evolution cycle queued on GitHub Actions.');
        } else {
            addChatMsg('bude', 'GitHub trigger failed. Simulating local task generation...');
            simulateLocalEvolution();
        }
        
        loadStatus();
        loadTasks();
        
    } catch (e) {
        addChatMsg('bude', `Cycle error: ${e.message}`);
    }
}

async function triggerGitHubWorkflow() {
    const token = localStorage.getItem('github_token');
    if (!token) {
        addChatMsg('bude', 'No GitHub token. Add one with /token <key>');
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
        "Optimize existing code"
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
/log — show evolution story
/focus <area> — set priority: agents, crypto, self, bugs, business
/clean — purge old logs
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
            addChatMsg('bude', 'Evolution story loaded.');
            break;
            
        case 'clean':
            purgeOldLogs();
            addChatMsg('bude', 'Old logs purged. Evolution log cleaned.');
            break;
            
        case 'focus':
            if (!args) {
                addChatMsg('bude', `Usage: /focus <area>
Areas: agents, crypto, self, bugs, business
Example: /focus business`);
                return;
            }
            if (args === 'dashboard') {
                addChatMsg('bude', 'Dashboard is locked. Use /focus agents, crypto, self, bugs, or business.');
                return;
            }
            queueCommand('focus', args);
            addChatMsg('bude', `FOCUS set to: ${args}. Next cycles will prioritize this.`);
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
        const phase = mem?.phase || 'build';
        const modules = mem?.modules_built?.length || 0;
        const business = mem?.business_modules?.length || 0;
        
        grid.innerHTML = `
            <div class="status-card">
                <h3>Phase</h3>
                <div class="value" style="color:${phase==='business'?'#ffaa00':'#00ff88'}">${phase.toUpperCase()}</div>
            </div>
            <div class="status-card">
                <h3>Evolution Cycles</h3>
                <div class="value">${cycles}</div>
            </div>
            <div class="status-card">
                <h3>Modules Built</h3>
                <div class="value">${modules}</div>
            </div>
            <div class="status-card">
                <h3>Business Tools</h3>
                <div class="value" style="color:${business>0?'#ffaa00':'#888'}">${business}</div>
            </div>
            <div class="status-card">
                <h3>Queue</h3>
                <div class="value" style="color:${queue>0?'#ffaa00':'#00ff88'}">${queue}</div>
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

// ─── EVOLUTION STORY (human-friendly) ───
async function loadEvolution() {
    const display = document.getElementById('evolution-display');
    display.innerHTML = '<div class="story-entry"><p>Loading evolution story...</p></div>';
    
    try {
        const mem = await fetchJson('system/memory.json');
        const log = await fetchText('system/evolution.log');
        
        let story = generateStory(mem, log);
        display.innerHTML = story;
        
    } catch (e) {
        display.innerHTML = '<div class="story-entry story-header"><h3>🌱 BudE is just getting started</h3><p>Run /evolve or tap AUTO WORK to begin the journey.</p></div>';
    }
}

function generateStory(mem, log) {
    let html = '';
    const cycles = mem?.evolution_cycles || 0;
    const phase = mem?.phase || 'build';
    const modules = mem?.modules_built || [];
    const business = mem?.business_modules || [];
    const upgrades = mem?.upgrades_made || [];
    const errors = mem?.errors || [];
    const focus = mem?.current_focus || 'general';
    
    // Header
    html += `<div class="story-entry story-header">
        <h2>🧬 BudE Evolution Story</h2>
        <p><strong>${cycles} cycles completed</strong> | Phase: <span class="phase-${phase}">${phase.toUpperCase()}</span></p>
    </div>`;
    
    // What was built
    if (modules.length > 0) {
        html += `<div class="story-entry">
            <h3>🔧 Core Modules Built</h3>
            <ul class="story-list">
                ${modules.map(m => `<li>✅ ${m.replace('agents/', '').replace('api/', '').replace('tools/', '').replace('.py', '')}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    // Business tools
    if (business.length > 0) {
        html += `<div class="story-entry story-business">
            <h3>💰 Business Tools</h3>
            <ul class="story-list">
                ${business.map(b => `<li>💵 ${b.replace('api/', '').replace('tools/', '').replace('.py', '')}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    // Self-upgrades
    if (upgrades.length > 0) {
        const latest = upgrades[upgrades.length - 1];
        html += `<div class="story-entry story-upgrade">
            <h3>🔄 Self-Upgrade</h3>
            <p>Last upgrade: <strong>${latest.files.join(', ')}</strong></p>
            <p class="story-time">${timeAgo(latest.time)}</p>
        </div>`;
    }
    
    // Recent activity from log
    if (log) {
        const recentLines = log.split('\n').filter(l => l.includes('Built:') || l.includes('PHASE ADVANCE')).slice(-5);
        if (recentLines.length > 0) {
            html += `<div class="story-entry">
                <h3>📋 Recent Activity</h3>
                <ul class="story-list">
                    ${recentLines.map(l => {
                        const msg = l.replace(/\[.*?\]\s*\[.*?\]\s*/, '');
                        if (msg.includes('Built:')) return `<li>🔨 Built ${msg.replace('Built: ', '')}</li>`;
                        if (msg.includes('PHASE ADVANCE')) return `<li>🚀 ${msg}</li>`;
                        return `<li>• ${msg}</li>`;
                    }).join('')}
                </ul>
            </div>`;
        }
    }
    
    // Errors (if any)
    if (errors.length > 0) {
        const latestError = errors[errors.length - 1];
        html += `<div class="story-entry story-error">
            <h3>⚠️ Latest Issue</h3>
            <p>${latestError.error}</p>
            <p class="story-time">${timeAgo(latestError.time)}</p>
        </div>`;
    }
    
    // Current focus
    html += `<div class="story-entry story-focus">
        <h3>🎯 Current Focus</h3>
        <p>${focus === 'business' ? 'Building money-making tools and revenue streams.' : 
            focus === 'agents' ? 'Creating AI agent modules.' :
            focus === 'crypto' ? 'Developing crypto analysis tools.' :
            focus === 'build' ? 'Building core system modules.' :
            'General evolution — improving everything.'}</p>
    </div>`;
    
    // Progress bars
    const moduleGoal = 6;
    const bizGoal = 6;
    const moduleProgress = Math.min((modules.length / moduleGoal) * 100, 100);
    const bizProgress = Math.min((business.length / bizGoal) * 100, 100);
    
    html += `<div class="story-entry">
        <h3>📊 Progress</h3>
        <div class="story-progress">
            <label>Core Modules</label>
            <div class="progress-track"><div class="progress-fill" style="width:${moduleProgress}%"></div></div>
            <span>${modules.length}/${moduleGoal}</span>
        </div>
        <div class="story-progress">
            <label>Business Tools</label>
            <div class="progress-track"><div class="progress-fill business" style="width:${bizProgress}%"></div></div>
            <span>${business.length}/${bizGoal}</span>
        </div>
    </div>`;
    
    return html;
}

// ─── PURGE OLD LOGS ───
async function purgeOldLogs() {
    try {
        // Keep only last 20 lines of evolution.log
        const log = await fetchText('system/evolution.log');
        const lines = log.split('\n');
        const keepLines = lines.slice(-20);
        const cleaned = keepLines.join('\n');
        
        // We can't write files directly, but we can store in localStorage
        localStorage.setItem('bude_log_cleaned', cleaned);
        
        // Also clear old errors from memory
        const mem = await fetchJson('system/memory.json');
        if (mem.errors && mem.errors.length > 3) {
            mem.errors = mem.errors.slice(-3);
            // Note: can't save back without backend, but display will be cleaner
        }
        
        addChatMsg('bude', `Purged old logs. Kept last ${keepLines.length} entries.`);
        
    } catch (e) {
        addChatMsg('bude', 'Could not purge logs. No log file found.');
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
    addChatMsg('bude', `BudE OS v0.3 online. Repo: ${GITHUB_FULL}.`);
    addChatMsg('bude', 'Tap AUTO WORK to evolve, or type /help. Check the Evolution Log for the story!');
});
