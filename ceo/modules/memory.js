const fs = require('fs').promises;

class Memory {
  constructor() {
    this.file = 'ceo/memory.json';
    this.data = {};
  }
  async load() {
    try { this.data = JSON.parse(await fs.readFile(this.file, 'utf8')); }
    catch { this.data = { runs: 0 }; }
    this.data.runs = (this.data.runs || 0) + 1;
  }
  async save() {
    await fs.mkdir('ceo', { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(this.data, null, 2));
  }
  get(k) { return this.data[k]; }
  set(k, v) { this.data[k] = v; }
}

module.exports = Memory;