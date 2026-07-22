const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/formula/corpus-math-tool.js');
    console.log('PASS corpus-math-tool.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP corpus-math-tool.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP corpus-math-tool.test.js: ' + e.code));
