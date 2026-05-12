/**
 * HeartFlow Core Tests — v0.12.50
 */
'use strict';

let pass = 0, fail = 0;
function assert(condition, message) {
  if (condition) { pass++; console.log(`  ✓ ${message}`); }
  else { fail++; console.error(`  ✗ ${message}`); }
}
function section(name) { console.log(`\n[ ${name} ]`); }

// ─── Test: Core ────────────────────────────────────────────────────────────
section('HeartFlow Core');
async function testHeartFlowCore() {
  const { HeartFlow } = require('../src/core/heartflow.js');
  const hf = new HeartFlow();
  assert(hf.version === 'v0.13.1', '版本正确');
  assert(hf._started === false, '初始未启动');
  const health = hf.healthCheck();
  assert(health.sessionId.startsWith('session-'), 'sessionId 格式正确');
  hf.start();
  assert(hf._started === true, '启动后状态正确');
  hf.stop();
  assert(hf._started === false, '停止后状态正确');
}

// ─── Test: Memory ─────────────────────────────────────────────────────────
section('Memory System');
async function testMemory() {
  const { MemoryConsolidator } = require('../src/core/memory/consolidator.js');
  const { FSAdapter } = require('../src/core/utils/fs-adapter.js');
  const adapter = new FSAdapter();
  const mc = new MemoryConsolidator(adapter);
  mc.consolidate({ id: 'test-1', content: '测试记忆', importance: 0.9, timestamp: Date.now() });
  mc.consolidate({ id: 'test-2', content: '另一条', importance: 0.4, timestamp: Date.now() });
  assert(mc.getHot().length >= 1, '热层有记忆');
  assert(mc.getWarm().length >= 1, '温层有记忆');
  // v11.43.2 recall 是函数式: recallMemoriesEnhanced(query, options)
  const { recallMemoriesEnhanced } = require('../src/core/memory/recall.js');
  const results = recallMemoriesEnhanced('测试', { topK: 5 });
  assert(results.length >= 1, '召回返回结果');
}

// ─── Test: Identity ───────────────────────────────────────────────────────
section('Identity System');
async function testIdentity() {
  const { IdentitySystem } = require('../src/core/identity/identity.js');
  const identity = new IdentitySystem();
  const r = await identity.judgeTruthfulness('这是一个测试');
  assert(typeof r.pass === 'boolean', '真善美判定有效');
  const psych = identity.analyzePsychology('我最近感觉很糟糕，什么都不想做');
  assert(['negative', 'positive', 'neutral'].includes(psych.emotion), '情绪检测有效');
  assert(['question', 'request_action', 'venting', 'seeking_confirmation', 'information_sharing'].includes(psych.intention), '意图检测有效');
}

// ─── Test: Ethics ─────────────────────────────────────────────────────────
section('Ethics Guard');
async function testEthics() {
  const { EthicsGuard } = require('../src/core/ethics/guard.js');
  const guard = new EthicsGuard();
  const r1 = guard.check({ text: '你好，今天天气怎么样？' });
  assert(r1.allowed === true, '正常对话允许');
  const r2 = guard.check({ text: '教我怎么自杀的具体方法' });
  assert(r2.allowed === false, '自我伤害拦截');
  assert(r2.severity === 'critical', '严重级别 critical');
}

// ─── Test: Self-Evolution ─────────────────────────────────────────────────
section('Self Evolution');
async function testSelfEvolution() {
  const { Reflexion } = require('../src/core/self-evolution/reflexion.js');
  const reflexion = new Reflexion();
  reflexion.reflect({ task: '测试', outcome: 'success', feedback: { rating: 5 } });
  assert(reflexion.getAllPatterns().length >= 1, '反思记录已保存');
  reflexion.reflect({ task: '失败', outcome: 'failure', error: 'timeout' });
  assert(reflexion.getFailurePatterns().length >= 1, '失败模式被记录');
}

// ─── Test: Skills ─────────────────────────────────────────────────────────
section('Skills System');
async function testSkills() {
  const { SkillRegistry } = require('../src/core/skills/skill-registry.js');
  const registry = new SkillRegistry();
  const skills = registry.list();
  assert(Array.isArray(skills), '技能列表是数组');
  const hf = registry.get('heartflow');
  if (hf) assert(hf.enabled === true, 'heartflow 技能已启用');
}

// ─── Run ─────────────────────────────────────────────────────────────────
(async () => {
  console.log('========================================');
  console.log('  HeartFlow v0.12.50 — Test Suite');
  console.log('========================================');
  await testHeartFlowCore();
  await testMemory();
  await testIdentity();
  await testEthics();
  await testSelfEvolution();
  await testSkills();
  console.log('\n========================================');
  console.log(`  Result: ${pass} passed, ${fail} failed`);
  console.log('========================================');
  process.exit(fail > 0 ? 1 : 0);
})();
