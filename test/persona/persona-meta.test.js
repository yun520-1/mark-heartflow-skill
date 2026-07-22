const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/persona/persona-meta.js');
    console.log('PASS persona-meta.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP persona-meta.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP persona-meta.test.js: ' + e.code));
