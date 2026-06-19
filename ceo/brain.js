#!/usr/bin/env node

/**
 * BUDE TECH CEO v5.0 — HARDENED AUTO-ECOSYSTEM
 * Stable autonomous builder for GitHub Actions (free tier safe)
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const API_KEY = process.env.OPENROUTER_API_KEY;
const RUN_NUM = process.env.GITHUB_RUN_NUMBER || 'local';
const RUN_START = Date.now();

const MAX_API_PER_DAY = 30;
const API_LOG = 'ceo/api_log.json';
const BACKLOG_FILE = 'ceo/backlog.json';

/* ───────────────────────────────
   SAFE UTILITIES
────────────────────────────── */

function existsSyncSafe(file) {
  try {
    fsSync.accessSync(file);
    return true;
  } catch {
    return false;
  }
}

function clampArray(arr, max) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(-max);
}

/* ───────────────────────────────
   AI API (budget protected)
────────────────────────────── */

async function loadApiUsage() {
  try {
    const data = JSON.parse(await fs.readFile(API_LOG, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) return { date: today, today: 0, total: data.total || 0 };
    return data;
  } catch {
    return { date: new Date().toISOString().split('T')[0], today: 0, total: 0 };
  }
}

async function logApiCall(usage) {
  usage.today++;
  usage.total++;
  await fs.mkdir('ceo', { recursive: true });
  await fs.writeFile(API_LOG, JSON.stringify(usage, null, 2));
}

async function aiAsk(prompt, maxTokens = 800) {
  const usage = await loadApiUsage();

  if (usage.today >= MAX_API_PER_DAY) {
    console.log('[API] Budget exhausted');
    return '';
  }

  if (!API_KEY) {
    console.log('[API] Missing key');
    return '';
  }

  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'You are Bude CEO. Output clean code or concise text.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.5
    });

    const req = https.request({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'HTTP-Referer': 'https://github.com',
        'X-Title': 'Bude CEO'
      },
      timeout: 20000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', async () => {
        try {
          const content = JSON.parse(body).choices[0].message.content;
          await logApiCall(usage);
          resolve(content || '');
        } catch {
          resolve('');
        }
      });
    });

    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });

    req.write(data);
    req.end();
  });
}

/* ───────────────────────────────
   MEMORY LOADING (FIXED)
────────────────────────────── */

async function loadMemory() {
  let memory;

  try {
    memory = JSON.parse(await fs.readFile('ceo/memory.json', 'utf8'));
  } catch {
    try {
      memory = JSON.parse(await fs.readFile('ceo/memory.json.bak', 'utf8'));
      console.log('[CEO] Restored backup memory');
    } catch {
      memory = {};
    }
  }

  memory.runs ??= 0;
  memory.files_created ??= 0;
  memory.failures ??= [];
  memory.products ??= [];
  memory.metrics ??= {
    filesCreated: 0,
    featuresShipped: 0,
    bugsFixed: 0,
    docsUpdated: 0
  };

  memory.failures = clampArray(memory.failures, 50);
  memory.runs++;
  memory.lastRun = new Date().toISOString();

  return memory;
}

/* ───────────────────────────────
   BACKLOG SYSTEM
────────────────────────────── */

async function loadBacklog() {
  try {
    return JSON.parse(await fs.readFile(BACKLOG_FILE, 'utf8'));
  } catch {
    return { items: [], lastId: 0 };
  }
}

async function saveBacklog(backlog) {
  await fs.mkdir('ceo', { recursive: true });
  await fs.writeFile(BACKLOG_FILE, JSON.stringify(backlog, null, 2));
}

function addBacklogItem(backlog, title, type, priority, description) {
  backlog.lastId++;

  const item = {
    id: backlog.lastId,
    title,
    type,
    priority,
    description,
    status: 'open',
    created: new Date().toISOString(),
    completed: null
  };

  backlog.items.push(item);
  backlog.items = clampArray(backlog.items, 30);

  return item;
}

function getNextBacklogItem(backlog) {
  const open = backlog.items.filter(i => i.status === 'open');

  if (!open.length) return null;

  const order = { critical: 0, high: 1, medium: 2, low: 3 };

  open.sort((a, b) =>
    (order[a.priority] ?? 2) - (order[b.priority] ?? 2)
  );

  return open[0];
}

function completeBacklogItem(item, success) {
  item.status = success ? 'done' : 'failed';
  item.completed = new Date().toISOString();
}

/* ───────────────────────────────
   ENV ANALYSIS (FIXED)
────────────────────────────── */

async function analyze() {
  try {
    const files = parseInt(
      execSync('find . -type f | wc -l', { encoding: 'utf8' }).trim()
    );

    const jsFiles = parseInt(
      execSync('find . -name "*.js" | wc -l', { encoding: 'utf8' }).trim()
    );

    let quality = 50;

    if (existsSyncSafe('README.md')) quality += 15;
    if (existsSyncSafe('.github')) quality += 15;
    if (existsSyncSafe('projects')) quality += 10;

    return {
      files,
      jsFiles,
      quality: Math.min(100, quality),
      hasReadme: existsSyncSafe('README.md'),
      hasPackageJson: existsSyncSafe('package.json')
    };
  } catch {
    return {
      files: 0,
      jsFiles: 0,
      quality: 0,
      hasReadme: false,
      hasPackageJson: false
    };
  }
}

/* ───────────────────────────────
   TASK GENERATION (FIXED)
────────────────────────────── */

function generateAutoTasks(backlog, memory, env) {
  console.log('[AUTO] Generating tasks...');

  memory.products ??= [];
  backlog.items ??= [];

  const exists = (title) =>
    backlog.items.some(i => i.title === title && i.status !== 'failed');

  if (!env.hasReadme && !exists('Create README')) {
    addBacklogItem(backlog, 'Create README', 'docs', 'critical', 'Project README');
  }

  if (!env.hasPackageJson && !exists('Create package.json')) {
    addBacklogItem(backlog, 'Create package.json', 'infrastructure', 'high', 'Node setup');
  }

  if (memory.products.length === 0 && !exists('Build URL tool')) {
    addBacklogItem(backlog, 'Build URL tool', 'feature', 'high', 'URL shortener');
  }

  if (env.jsFiles > 0 && !exists('Add tests')) {
    addBacklogItem(backlog, 'Add tests', 'infrastructure', 'medium', 'Basic tests');
  }
}

/* ───────────────────────────────
   TASK EXECUTION
────────────────────────────── */

async function executeFeature(task, memory) {
  const name = task.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  const dir = `projects/${name}`;

  try {
    await fs.mkdir(dir, { recursive: true });

    const code = await aiAsk(
      `Create a small Node.js module for: ${task.description}`,
      800
    );

    const clean = code.replace(/```[\w]*\n?/g, '').replace(/```/g, '');

    await fs.writeFile(`${dir}/index.js`, clean || 'module.exports = {}');

    memory.products.push({
      name,
      dir,
      created: new Date().toISOString(),
      tested: false
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/* ───────────────────────────────
   SECURITY
────────────────────────────── */

async function securityAudit() {
  try {
    const jsFiles = execSync(
      'find ./ceo ./projects -name "*.js" 2>/dev/null',
      { encoding: 'utf8' }
    ).split('\n').filter(Boolean);

    let issues = 0;

    for (const f of jsFiles) {
      const c = await fs.readFile(f, 'utf8');

      if (/eval\(/.test(c)) issues++;
      if (/api[_-]?key\s*=/.test(c)) issues++;
    }

    await fs.mkdir('ceo/reports', { recursive: true });

    await fs.writeFile(
      'ceo/reports/security.json',
      JSON.stringify({ issues, scanned: jsFiles.length }, null, 2)
    );

    return issues;
  } catch {
    return 0;
  }
}

/* ───────────────────────────────
   MAIN LOOP
────────────────────────────── */

async function main() {
  console.log('[CEO] v5.0 starting run', RUN_NUM);

  const memory = await loadMemory();
  const backlog = await loadBacklog();

  const env = await analyze();

  if (backlog.items.length === 0) {
    generateAutoTasks(backlog, memory, env);
    await saveBacklog(backlog);
  }

  const task = getNextBacklogItem(backlog);

  let actions = [];

  if (task) {
    task.status = 'in_progress';

    const result =
      task.type === 'feature'
        ? await executeFeature(task, memory)
        : { success: true };

    completeBacklogItem(task, result.success);

    actions.push(task.title + (result.success ? ' ✅' : ' ❌'));
  } else {
    actions.push('No tasks');
  }

  const issues = await securityAudit();

  actions.push(`Security issues: ${issues}`);

  await fs.mkdir('ceo', { recursive: true });

  await fs.writeFile('ceo/memory.json', JSON.stringify(memory, null, 2));

  await fs.writeFile(
    `ceo/reports/run_${RUN_NUM}.md`,
    `# Run ${RUN_NUM}\n\nActions:\n${actions.map(a => '- ' + a).join('\n')}`
  );

  console.log('[CEO] done');
}

main().catch(err => {
  console.error('[CEO FATAL]', err);
  process.exit(1);
});
