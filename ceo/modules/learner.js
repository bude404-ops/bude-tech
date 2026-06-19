const fs = require('fs').promises;

class Learner {
  constructor() {
    this.kbFile = 'ceo/knowledge.json';
    this.failFile = 'ceo/failures.json';
    this.kb = {};
    this.failures = [];
  }
  async load() {
    try { this.kb = JSON.parse(await fs.readFile(this.kbFile, 'utf8')); }
    catch { this.kb = { created: new Date().toISOString(), patterns: [] }; }
    try { this.failures = JSON.parse(await fs.readFile(this.failFile, 'utf8')); }
    catch { this.failures = []; }
  }
  async recordFailure(action, err) {
    this.failures.push({ t: new Date().toISOString(), action: action.type, err: err.message });
    if (this.failures.length > 50) this.failures = this.failures.slice(-50);
    await this.saveFails();
  }
  async getRecent(n) { return this.failures.slice(-n); }
  async saveFails() {
    await fs.mkdir('ceo', { recursive: true });
    await fs.writeFile(this.failFile, JSON.stringify(this.failures, null, 2));
  }
}

module.exports = Learner;