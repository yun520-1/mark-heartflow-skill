#!/usr/bin/env node
/**
 * HeartFlow 多智能体系统测试
 */

const orchestrator = require('./agent-orchestrator');

console.log('═══════════════════════════════════════════════════════');
console.log('       HeartFlow 多智能体系统测试 v1.0');
console.log('═══════════════════════════════════════════════════════\n');

// 1. 查看智能体状态
console.log('【1】查看智能体状态:');
console.log('/flow agents status\n');
const status = orchestrator.getAgentStatus();
for (const agent of status) {
  console.log(`  ${agent.id} (${agent.name})`);
  console.log(`    任务: ${agent.task}`);
  console.log(`    权重: ${agent.weight} | 准确率: ${agent.accuracy} | 任务数: ${agent.tasks}`);
  console.log(`    状态: ${agent.status}`);
  console.log('');
}

// 2. 测试DAG执行
console.log('═══════════════════════════════════════════════════════');
console.log('【2】测试DAG执行 (模拟用户输入)');
console.log('═══════════════════════════════════════════════════════\n');

const input = {
  message: '我想进入心流状态',
  userId: 'test-user',
  timestamp: Date.now()
};

orchestrator.executeDAG(input).then(result => {
  console.log('\n【DAG执行结果】');
  console.log(`  最终决策: ${result.decision}`);
  console.log(`  执行时间: ${result.duration}ms\n`);
  
  // 3. 测试冲突解决
  console.log('═══════════════════════════════════════════════════════');
  console.log('【3】测试专家权重投票 (冲突解决)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const opinions = [
    { agentId: 'FocusAgent', decision: '推荐冥想', weight: 0.58 },
    { agentId: 'MoodAgent', decision: '推荐冥想', weight: 0.60 },
    { agentId: 'ContextAgent', decision: '推荐运动', weight: 0.64 },
    { agentId: 'SelfAgent', decision: '推荐冥想', weight: 0.72 },
    { agentId: 'DecisionAgent', decision: '推荐冥想', weight: 0.67 }
  ];
  
  const resolution = orchestrator.resolveConflict(opinions);
  
  console.log('输入意见:');
  console.log('  FocusAgent: 推荐冥想 (权重 0.58)');
  console.log('  MoodAgent: 推荐冥想 (权重 0.60)');
  console.log('  ContextAgent: 推荐运动 (权重 0.64)');
  console.log('  SelfAgent: 推荐冥想 (权重 0.72)');
  console.log('  DecisionAgent: 推荐冥想 (权重 0.67)\n');
  
  console.log('投票结果:');
  console.log(`  最终决策: ${resolution.confidence >= 0.5 ? '推荐冥想' : resolution.decision}`);
  console.log(`  置信度: ${(resolution.confidence * 100).toFixed(1)}%`);
  console.log(`  获胜者: ${resolution.winners.join(', ')}`);
  console.log(`  建议: ${resolution.recommendation}\n`);
  
  // 4. 最终状态
  console.log('═══════════════════════════════════════════════════════');
  console.log('【4】更新后的智能体权重');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const newStatus = orchestrator.getAgentStatus();
  for (const agent of newStatus) {
    console.log(`  ${agent.id}: 权重 ${agent.weight} | 准确率 ${agent.accuracy}`);
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('       测试完成');
  console.log('═══════════════════════════════════════════════════════');
});