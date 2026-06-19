const fs = require('fs').promises;

async function main() {
  console.log('Reflecting...');
  let memory;
  try { memory = JSON.parse(await fs.readFile('ceo/memory.json', 'utf8')); }
  catch { console.log('No memory'); return; }
  console.log('Runs:', memory.runs || 0);
  console.log('Done.');
}

main().catch(console.error);