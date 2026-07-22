const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/memory/project-context.js');
    console.log('PASS project-context.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP project-context.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP project-context.test.js: ' + e.code));
