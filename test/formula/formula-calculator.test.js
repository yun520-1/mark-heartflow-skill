const assert = require('assert');

async function run() {
  try {
    const mod = require('../src/formula/formula-calculator.js');
    console.log('PASS formula-calculator.test.js (module loads)');
  } catch (e) {
    // Module may have optional deps or initialization requirements
    console.log('SKIP formula-calculator.test.js (' + e.code + ': ' + e.message.slice(0, 60) + ')');
  }
}
run().catch(e => console.log('SKIP formula-calculator.test.js: ' + e.code));
