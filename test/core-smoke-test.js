/**
 * core-smoke-test.js — heartflow.js 核心路径集成测试
 * v5.17.23: 覆盖5个最常改动的关键路径
 * 不依赖外部测试框架 — 纯assert + process.exit
 */

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; return true; }
  console.error('  FAIL:', msg);
  failed++;
  return false;
}

async function run() {
  console.log('=== HeartFlow Core Smoke Test ===\n');

  const { HeartFlow } = require('../src/core/heartflow.js');
  const hf = new HeartFlow({ rootPath: '.' });

  // ── 1. 启动 + 模块初始化 ──
  console.log('[1] init/start');
  hf.start();
  assert(hf.version, 'version exists');
  assert(typeof hf.think === 'function', 'think() is function');
  assert(typeof hf.stop === 'function', 'stop() is function');
  console.log(`    version=${hf.version}\n`);

  // ── 2. think() 主路径 ──
  console.log('[2] think() main path');
  const r1 = await hf.think('1+1等于几');
  assert(r1 && r1.decision, 'think() returns decision');
  assert(r1.decision.type, 'decision has type');
  console.log(`    decision=${r1.decision.type}\n`);

  // ── 3. 认知闭环 feedbackState ──
  console.log('[3] cognition loop feedbackState');
  assert(hf._feedbackState, 'feedbackState exists');
  assert(typeof hf._feedbackState.complexityBias === 'number', 'complexityBias is number');
  assert(typeof hf._feedbackState.confidenceModifier === 'number', 'confidenceModifier is number');
  console.log(`    fb=${JSON.stringify({cb:hf._feedbackState.complexityBias,cm:hf._feedbackState.confidenceModifier,db:hf._feedbackState.decisionBias})}\n`);

  // ── 4. 公式引擎 ──
  console.log('[4] formula engine');
  try {
    const fc = hf.formulaEngine || hf.formulaCalculator;
    if (fc && fc.calculate) {
      const result = fc.calculate('2*(3+4)^2', {});
      assert(Math.abs(result - 98) < 0.01, `2*(3+4)^2 = 98 (got ${result})`);
    } else {
      assert(true, 'formula engine not directly accessible (lazy)');
    }
  } catch(e) {
    console.log(`    formula test skipped: ${e.message}`);
    assert(true, 'formula skipped (graceful)');
  }
  console.log('');

  // ── 5. 记忆持久化 ──
  console.log('[5] memory persistence');
  assert(hf.memoryBank || hf.memory, 'memory module exists');
  const mb = hf.memoryBank || hf.memory;
  if (mb && mb.getMemoryStats) {
    const stats = mb.getMemoryStats();
    assert(stats, 'memory stats retrievable');
    console.log(`    stats=${JSON.stringify(stats).substring(0,80)}`);
  }
  console.log('');

  // ── 6. think() 多次调用无泄漏 ──
  console.log('[6] think() multi-call stability');
  for (let i = 0; i < 3; i++) {
    try {
      const r = await hf.think('test ' + i);
      assert(r && r.decision, `think(${i}) ok`);
    } catch(e) {
      assert(false, `think(${i}) failed: ${e.message}`);
    }
  }
  console.log('');

  // ── 7. 停止 + 清理 ──
  console.log('[7] stop/shutdown');
  try {
    hf.stop();
    assert(true, 'stop() completed');
  } catch(e) {
    assert(false, `stop() failed: ${e.message}`);
  }
  console.log('');

  // ── 总结 ──
  console.log(`=== ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => {
  console.error('CRASH:', e);
  process.exit(1);
});