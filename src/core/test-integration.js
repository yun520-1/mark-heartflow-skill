#!/usr/bin/env node
/**
 * HeartFlow 引擎集成测试
 */

const engine = require('./heartflow-engine');

console.log('═══════════════════════════════════════════════════════');
console.log('       HeartFlow 引擎集成测试 v2.2.1');
console.log('═══════════════════════════════════════════════════════\n');

// 1. 初始化测试
console.log('【1】初始化测试:');
const init = engine.initialize();
console.log(`   自适应调节: ${init.modules.adaptive ? '✅' : '❌'}`);
console.log(`   多智能体编排: ${init.modules.orchestrator ? '✅' : '❌'}`);
console.log(`   错误处理器: ${init.modules.errorHandler ? '✅' : '❌'}`);
console.log(`   状态快照: ${init.modules.snapshot ? '✅' : '❌'}`);
if (init.recoveredFrom) {
  console.log(`   从快照恢复: ${new Date(init.recoveredFrom).toLocaleString()}`);
}
console.log('');

// 2. 自适应调节测试
console.log('【2】自适应调节测试:');
const testCases = [
  { state: 'deep-flow', intensity: 0.9, complexity: 0.3 },
  { state: 'distracted', intensity: 0.5, complexity: 0.5 },
  { state: 'anxious', intensity: 0.8, complexity: 0.8 },
  { state: 'bored', intensity: 0.3, complexity: 0.2 }
];

for (const tc of testCases) {
  const policy = engine.adaptiveController.adjustPolicy(tc, tc.complexity);
  console.log(`   ${tc.state}: ${policy.frequency} | ${policy.style} | ${policy.message}`);
}
console.log('');

// 3. 多智能体测试
console.log('【3】多智能体测试:');
const agents = engine.agentOrchestrator.getStatus();
for (const a of agents) {
  console.log(`   ${a.id}: ${a.weight} | ${a.status}`);
}
console.log('');

// 4. 错误处理测试
console.log('【4】错误处理测试:');
const testError = new Error('Test error');
engine.errorHandler.capture(testError, { test: true });
const stats = engine.errorHandler.getStats();
console.log(`   错误类型: ${Object.keys(stats).join(', ') || '无'}`);
const history = engine.errorHandler.getHistory(1);
console.log(`   最新错误: ${history[0]?.type || '无'}`);
console.log('');

// 5. 快照测试
console.log('【5】快照测试:');
const state = { flow: 'testing', score: 85 };
const snap = engine.stateSnapshot.create(state, 'test-run');
console.log(`   创建快照: ${snap.filename}`);
const latest = engine.stateSnapshot.getLatest();
console.log(`   最新快照: ${latest ? latest.label : '无'}`);
console.log('');

// 6. 完整流程测试
console.log('【6】完整流程测试:');
engine.processInput('我想进入心流状态').then(result => {
  console.log(`   执行成功: ${result.success}`);
  console.log(`   阶段数: ${Object.keys(result.stages).length}`);
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('       测试完成');
  console.log('═══════════════════════════════════════════════════════');
});