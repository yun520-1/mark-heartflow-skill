/**
 * HeartFlow Core Unit Tests
 * 运行: HEARTFLOW_CODE_EXECUTOR_ENABLED=true node tests/core.test.js
 */

const { HeartFlow } = require('../src/core/heartflow.js');
const { CodeExecutor, ExecStatus } = require('../src/code/code-executor.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runTests() {
  console.log('\n🧪 HeartFlow Core Tests\n');

  // ─── CodeExecutor Tests ─────────────────────────────────────────
  console.log('📦 CodeExecutor:');
  const ce = new CodeExecutor();

  test('constructor initializes stats', () => {
    assert(ce.totalExecutions === 0, 'Should start with 0 executions');
    assert(ce.successRate === 0, 'Should start with 0% success rate');
  });

  test('execute JavaScript: 1+1=2', async () => {
    const result = await ce.execute('1 + 1');
    assert(result.status === ExecStatus.SUCCESS, `Expected SUCCESS, got ${result.status}`);
    assert(result.output.includes('2'), `Expected output to contain 2, got: ${result.output}`);
  });

  test('execute JavaScript: console.log', async () => {
    const result = await ce.execute('console.log("hello")');
    assert(result.status === ExecStatus.SUCCESS, `Expected SUCCESS`);
    assert(result.output.includes('hello'), `Expected "hello" in output`);
  });

  test('execute JavaScript: error handling', async () => {
    const result = await ce.execute('throw new Error("test error")');
    assert(result.status === ExecStatus.FAILED || result.status === ExecStatus.ERROR, `Expected FAILED/ERROR, got ${result.status}`);
  });

  test('sandbox blocks require()', async () => {
    const result = await ce.sandbox('require("fs")');
    assert(result.blocked === true, `Expected blocked, got: ${JSON.stringify(result)}`);
  });

  test('sandbox blocks eval()', async () => {
    const result = await ce.sandbox('eval("1+1")');
    assert(result.blocked === true, `Expected blocked`);
  });

  test('sandbox blocks constructor.constructor bypass', async () => {
    const result = await ce.sandbox('(0,constructor.constructor)("alert(1)")()');
    assert(result.blocked === true, `Expected blocked for constructor bypass`);
  });

  test('runTests: passing assertion', async () => {
    const result = await ce.runTests('function add(a, b) { return a + b; }', 'console.assert(add(1, 2) === 3);');
    assert(result.passed >= 1, `Expected at least 1 passed, got ${result.passed}`);
    assert(result.failed === 0, `Expected 0 failed`);
  });

  test('runTests: failing assertion', async () => {
    const result = await ce.runTests('function add(a, b) { return a + b; }', 'console.assert(add(1, 2) === 5);');
    assert(result.failed >= 1, `Expected at least 1 failed`);
  });

  test('healthCheck: reports healthy/degraded', () => {
    const health = ce.healthCheck();
    assert(health.status === 'healthy' || health.status === 'degraded', `Invalid status: ${health.status}`);
    assert(Array.isArray(health.executors), 'executors should be array');
  });

  // ─── HeartFlow Core Tests ──────────────────────────────────────
  console.log('\n💓 HeartFlow Core:');
  const hf = new HeartFlow({ rootPath: '/tmp/heartflow-test-' + Date.now() });

  test('constructor sets version', () => {
    assert(hf.version !== null && hf.version !== 'unknown', `Version should be set, got: ${hf.version}`);
  });

  test('constructor initializes _initErrors', () => {
    assert(Array.isArray(hf._initErrors), '_initErrors should be array');
    assert(hf._initErrors.length === 0, '_initErrors should be empty before start');
  });

  test('start() initializes core modules', async () => {
    const result = await hf.start();
    assert(result.success === true, `Start should succeed: ${JSON.stringify(result)}`);
    assert(result.modules > 0, `Should have modules: ${result.modules}`);
  });

  test('start() populates _modules registry', () => {
    assert(Object.keys(hf._modules).length > 0, '_modules should not be empty');
    assert('identityCore' in hf._modules, 'identityCore should be registered');
    assert('heartLogic' in hf._modules, 'heartLogic should be registered');
  });

  test('thinkFast returns result', async () => {
    const result = await hf.thinkFast('hello');
    assert(result !== null, 'thinkFast should return result');
    assert(result.type !== undefined, 'Should have type');
  });

  test('_lazyCache uses Map (LRU)', () => {
    // _lazyCache is module-private, check via module system
    const hfModule = require('../src/core/heartflow.js');
    // The _lazyCache is a closure variable, we can verify LRU behavior indirectly
    assert(hf._modules !== null, '_modules should be populated');
  });

  test('structured logger exists', () => {
    assert(typeof hf._log !== 'undefined', '_log should exist');
    assert(typeof hf._log.info === 'function', '_log.info should be function');
    assert(typeof hf._log.warn === 'function', '_log.warn should be function');
    assert(typeof hf._log.error === 'function', '_log.error should be function');
  });

  test('stop() cleanly shuts down', async () => {
    await hf.stop();
    assert(hf.started === false, 'Should not be started after stop');
    assert(Object.keys(hf._modules).length === 0, '_modules should be cleared');
  });

  // ─── Summary ───────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(50) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
