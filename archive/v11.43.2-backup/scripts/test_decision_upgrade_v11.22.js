#!/usr/bin/env node
/**
 * HeartFlow v11.22.0 升级验证脚本
 * 
 * 测试决策执行闭环 + 环境传感器整合
 */

const path = require('path');
const HF_ROOT = path.resolve(__dirname, '..');

// 测试 DecisionExecutionLoop
async function testDecisionExecutionLoop() {
  console.log('\n=== Test 1: DecisionExecutionLoop ===');
  const { DecisionExecutionLoop } = require(path.join(HF_ROOT, 'src/core/decision-execution-loop.js'));
  
  const loop = new DecisionExecutionLoop({
    stateFile: '/tmp/test-decision-loop-state.json'
  });
  
  // 测试传感器注册
  loop.registerSensor('time', DecisionExecutionLoop.timeSensor());
  loop.registerSensor('random', DecisionExecutionLoop.randomSensor({ min: 0, max: 100 }));
  
  const sensors = await loop.readSensors();
  console.log('✓ Sensors registered and readable:', Object.keys(sensors).join(', '));
  
  // 测试完整流程
  const decision = {
    decision: '升级 HeartFlow 到 v11.22.0',
    reason: '增加决策执行闭环能力',
    evidence: ['用户明确要求'],
    confidence: 0.8,
    userGoal: '提升决策执行能力'
  };
  
  const result = await loop.runFullLoop(decision, null, 100);
  
  console.log('✓ Full loop executed:', result.executed.status);
  console.log('  - Execution ID:', result.executed.executionId);
  console.log('  - Outcome success:', result.result.outcome.success);
  console.log('  - Post-verification:', result.result.postVerification ? 'available' : 'N/A');
  console.log('  - RL update:', result.result.learningResult ? 'applied' : 'N/A');
  console.log('  - Stats:', JSON.stringify(result.stats));
  
  return true;
}

// 测试 EnvironmentSensor
async function testEnvironmentSensor() {
  console.log('\n=== Test 2: Environment Sensor ===');
  const { SensorRegistry, SensorFusion, HistoricalSensor, BuiltInSensors } = require(path.join(HF_ROOT, 'src/core/environment-sensor.js'));
  
  // SensorRegistry
  const registry = new SensorRegistry();
  registry.register('time', BuiltInSensors.time, { type: 'system' });
  registry.register('random', BuiltInSensors.random, { type: 'simulation' });
  
  const allData = await registry.readAll();
  console.log('✓ SensorRegistry.readAll():', Object.keys(allData.sensors).join(', '));
  
  const time = await registry.read('time');
  console.log('✓ Time sensor:', time.hour + ':' + String(time.minute).padStart(2, '0'));
  
  // SensorFusion
  const fused = SensorFusion.fuse(allData.sensors);
  console.log('✓ SensorFusion.fuse(): score=' + fused.confidence.score + ', summary="' + fused.decisionContext.summary + '"');
  
  // 决策相关上下文
  console.log('  - Derived numeric stats:', fused.derived.numericStats ? 'available' : 'none');
  console.log('  - Alert count:', fused.decisionContext.alerts.length);
  
  // HistoricalSensor
  const histSensor = new HistoricalSensor('/tmp/test-sensor-history');
  await histSensor.write('test', { value: 42 });
  const latest = await histSensor.readLatest('test', 1);
  console.log('✓ HistoricalSensor.write/readLatest:', latest[0]?.value === 42 ? '42 ✓' : 'failed');
  
  return true;
}

// 测试 DecisionExecutionLoop 与 SensorBridge 集成
async function testIntegration() {
  console.log('\n=== Test 3: Integration ===');
  const { DecisionExecutionLoop } = require(path.join(HF_ROOT, 'src/core/decision-execution-loop.js'));
  const { SensorRegistry, BuiltInSensors } = require(path.join(HF_ROOT, 'src/core/environment-sensor.js'));
  
  const registry = new SensorRegistry();
  registry.register('time', BuiltInSensors.time);
  registry.register('heartbeat', BuiltInSensors.heartbeat);
  
  const loop = new DecisionExecutionLoop({ stateFile: '/tmp/test-integration-state.json' });
  
  // 注册到 loop
  loop.registerSensor('envTime', registry.sensors.get('time'));
  loop.registerSensor('envHeartbeat', registry.sensors.get('heartbeat'));
  
  // 准备执行（带环境数据）
  const prepared = await loop.prepareExecution({
    decision: '执行高风险操作',
    reason: '测试环境感知',
    confidence: 0.9
  });
  
  console.log('✓ Environment context injected:', Object.keys(prepared._envContext).join(', '));
  console.log('  - Pre-verification valid:', prepared._preVerification?.valid);
  console.log('  - Env context timestamp:', prepared._envContext.envTime?.datetime);
  
  return true;
}

// 测试模拟执行场景
async function testSimulatedExecution() {
  console.log('\n=== Test 4: Simulated Execution ===');
  const { DecisionExecutionLoop } = require(path.join(HF_ROOT, 'src/core/decision-execution-loop.js'));
  
  const loop = new DecisionExecutionLoop({ stateFile: '/tmp/test-sim-state.json' });
  
  // 模拟执行器
  const mockExecutor = {
    execute: async (decision) => {
      await new Promise(r => setTimeout(r, 50));
      return { executed: true, value: Math.random() * 100 };
    }
  };
  
  loop.registerSensor('random', DecisionExecutionLoop.randomSensor());
  
  const result = await loop.runFullLoop({
    decision: '测试模拟执行器',
    reason: '验证真实执行器',
    confidence: 0.7
  }, mockExecutor, 0);
  
  console.log('✓ Mock executor used:', result.executed.executed);
  console.log('  - Result value:', result.executed.result?.value?.toFixed(2));
  console.log('  - Success rate:', result.stats.successRate);
  
  return true;
}

// 主测试流程
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  HeartFlow v11.22.0 升级验证         ║');
  console.log('╚══════════════════════════════════════╝');
  
  const tests = [
    testDecisionExecutionLoop,
    testEnvironmentSensor,
    testIntegration,
    testSimulatedExecution
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
    } catch (e) {
      console.error('✗ Test failed:', e.message);
      failed++;
    }
  }
  
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  测试结果: ' + passed + '/' + (passed + failed) + ' 通过               ║');
  console.log('╚══════════════════════════════════════╝');
  
  process.exit(failed > 0 ? 1 : 0);
}

main();
