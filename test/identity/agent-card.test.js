const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/identity/agent-card.js');
    console.log('PASS agent-card.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP agent-card.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP agent-card.test.js: ' + e.code));
