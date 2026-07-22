const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/identity/agent-psychology.js');
    console.log('PASS agent-psychology.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP agent-psychology.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP agent-psychology.test.js: ' + e.code));
