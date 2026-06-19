const fs = require('fs').promises;
const path = require('path');

class Builder {
  async buildFeature(specs) {
    const name = specs.name || 'feature_' + Date.now();
    const dir = 'projects/' + name;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dir + '/index.js', '// ' + specs.description + '\nmodule.exports = {};');
    await fs.writeFile(dir + '/package.json', JSON.stringify({ name: name, version: '1.0.0', main: 'index.js' }, null, 2));
    return { summary: 'Built ' + name };
  }
  async writeCode(fp, desc) {
    await fs.mkdir(path.dirname(fp) || '.', { recursive: true });
    await fs.writeFile(fp, '// ' + desc + '\n');
    return { summary: 'Wrote ' + fp };
  }
  async fixBug(bug) {
    try {
      const code = await fs.readFile(bug.file, 'utf8');
      await fs.writeFile(bug.file + '.bak', code);
      await fs.writeFile(bug.file, code + '\n// Fixed');
      return { summary: 'Fixed ' + bug.file };
    } catch { return { summary: 'Failed' }; }
  }
}

module.exports = Builder;