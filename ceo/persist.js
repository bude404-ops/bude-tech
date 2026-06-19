const fs = require('fs').promises;

async function main() {
  console.log('Saving...');
  const dirs = ['ceo/reports', 'ceo/strategies', 'projects', 'content'];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dir + '/.gitkeep', '');
  }
  console.log('Done.');
}

main().catch(console.error);