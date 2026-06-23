const GITHUB_USER = "bude404-ops";
const GITHUB_REPO = "Bude-Tech";
const GITHUB_FULL = "bude404-ops/Bude-Tech";

let autoWorkInterval = null;
let isAutoWorking = false;

// ─── TABS ───
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
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
/evolve — trigger single evolution cycle
/auto — toggle auto work mode
/task <desc> — queue new task
/focus <area> — set priority: agents, crypto, self, bugs, business
/token <key> — store GitHub token
/repo — open GitHub repo
/log — show evolution story
/clean — purge old logs
/clear — clear chat`);
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
            
        case 'focus':
            if (!args) {
                addChatMsg('bude', `Usage: /focus <area>
Areas: agents, crypto, self, bugs, business
Example: /focus business`);
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
            addChatMsg('bude', 'GitHub token stored.');
            break;
            
        case 'repo':
            window.open(`https://github.com/${GITHUB_FULL}`, '_blank');
            addChatMsg('bude', `Opening https://github.com/${GITHUB_FULL}`);
            break;
            
        case 'log':
            loadEvolution();
            switchTab('evolution');
            addChatMsg('bude', 'Evolution story loaded.');
            break;
            
        case 'clean':
            purgeOldLogs();
            addChatMsg('bude', 'Old logs purged.');
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
}

// ─── EVOLUTION STORY ───
async function loadEvolution() {
    const display = document.getElementById('evolution-display');
    display.innerHTML = '<div class="story-entry"><p>Loading evolution story...</p></div>';
    
    try {
        const mem = await fetchJson('system/memory.json');
        const log = await fetchText('system/evolution.log');
        let story = generateStory(mem, log);
        display.innerHTML = story;
    } catch (e) {
        display.innerHTML = '<div class="story-entry story-header"><h3>🌱 BudE is just getting started</h3><p>Run /evolve or tap AUTO WORK to begin.</p></div>';
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
    
    html += `<div class="story-entry story-header">
        <h2>🧬 BudE Evolution Story</h2>
        <p><strong>${cycles} cycles</strong> | Phase: <span class="phase-${phase}">${phase.toUpperCase()}</span></p>
    </div>`;
    
    if (modules.length > 0) {
        html += `<div class="story-entry">
            <h3>🔧 Core Modules</h3>
            <ul class="story-list">
                ${modules.map(m => `<li>✅ ${m.replace('agents/', '').replace('api/', '').replace('tools/', '').replace('.py', '')}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    if (business.length > 0) {
        html += `<div class="story-entry story-business">
            <h3>💰 Business Tools</h3>
            <ul class="story-list">
                ${business.map(b => `<li>💵 ${b.replace('api/', '').replace('tools/', '').replace('.py', '')}</li>`).join('')}
            </ul>
        </div>`;
    }
    
    if (upgrades.length > 0) {
        const latest = upgrades[upgrades.length - 1];
        html += `<div class="story-entry story-upgrade">
            <h3>🔄 Self-Upgrade</h3>
            <p>Last: <strong>${latest.files.join(', ')}</strong></p>
            <p class="story-time">${timeAgo(latest.time)}</p>
        </div>`;
    }
    
    if (log) {
        const recentLines = log.split('\n').filter(l => l.includes('Built:') || l.includes('PHASE ADVANCE')).slice(-5);
        if (recentLines.length > 0) {
            html += `<div class="story-entry">
                <h3>📋 Recent Activity</h3>
                <ul class="story-list">
                    ${recentLines.map(l => {
                        const msg = l.replace(/\[.*?\]\s*\[.*?\]\s*/, '');
                        if (msg.includes('Built:')) return `<li>🔨 ${msg.replace('Built: ', '')}</li>`;
                        if (msg.includes('PHASE ADVANCE')) return `<li>🚀 ${msg}</li>`;
                        return `<li>• ${msg}</li>`;
                    }).join('')}
                </ul>
            </div>`;
        }
    }
    
    if (errors.length > 0) {
        const latestError = errors[errors.length - 1];
        html += `<div class="story-entry story-error">
            <h3>⚠️ Latest Issue</h3>
            <p>${latestError.error}</p>
            <p class="story-time">${timeAgo(latestError.time)}</p>
        </div>`;
    }
    
    html += `<div class="story-entry story-focus">
        <h3>🎯 Current Focus</h3>
        <p>${focus === 'business' ? 'Building money-making tools.' : 
            focus === 'agents' ? 'Creating AI agent modules.' :
            focus === 'crypto' ? 'Developing crypto analysis tools.' :
            focus === 'build' ? 'Building core system modules.' :
            'General evolution.'}</p>
    </div>`;
    
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

function timeAgo(iso) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
}

async function purgeOldLogs() {
    try {
        const log = await fetchText('system/evolution.log');
        const lines = log.split('\n');
        const keepLines = lines.slice(-20);
        localStorage.setItem('bude_log_cleaned', keepLines.join('\n'));
        addChatMsg('bude', `Purged old logs. Kept last ${keepLines.length} entries.`);
    } catch (e) {
        addChatMsg('bude', 'No log file found.');
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
    addChatMsg('bude', `BudE OS v0.3 online. Repo: ${GITHUB_FULL}.`);
    addChatMsg('bude', 'Tap AUTO WORK to evolve, or type /help.');
});
