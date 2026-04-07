#!/usr/bin/env node
/**
 * HeartFlow V2 快速测试脚本
 * 
 * 用法：node test-v2.js
 */

const heartflow = require('./skill/index');

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     HeartFlow V2 - 隐式学习系统测试                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 初始化
  await heartflow.init({ userId: 'test_user' });
  
  // 测试场景
  const scenarios = [
    {
      name: '场景 1: 用户表达疲惫',
      input: '今天工作好累啊，压力好大...',
      expectedEmotion: '关切'
    },
    {
      name: '场景 2: 用户表达感谢',
      input: '谢谢你听我说这些，感觉好多了',
      expectedEmotion: '愉悦'
    },
    {
      name: '场景 3: 用户提出问题',
      input: '你说为什么有些人就是学不会爱别人呢？',
      expectedEmotion: '好奇'
    },
    {
      name: '场景 4: 用户分享成功',
      input: '我做到了！项目终于上线了！',
      expectedEmotion: '兴奋'
    },
    {
      name: '场景 5: 平静对话',
      input: '嗯，我就是随便聊聊',
      expectedEmotion: '平静'
    }
  ];
  
  console.log('=== 开始测试 ===\n');
  
  for (const scenario of scenarios) {
    console.log(`📍 ${scenario.name}`);
    console.log(`   用户: "${scenario.input}"`);
    
    const result = await heartflow.chat(scenario.input);
    
    console.log(`   HeartFlow: "${result.response}"`);
    console.log(`   情感：${result.emotion.name} (${result.emotion.intensity})`);
    console.log(`   信任度：${result.userProfile.trustLevel}`);
    console.log(`   共情深度：Level ${result.userProfile.empathyDepthLevel}`);
    console.log(`   学习效果：${result.internalState.learningEffect.effectivenessScore.toFixed(3)}`);
    console.log('');
  }
  
  // 最终统计
  const stats = heartflow.getStats();
  
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                    测试统计                            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`总交互次数：${stats.totalInteractions}`);
  console.log(`平均学习效果：${stats.learningStats.averageEffectiveness}`);
  console.log(`正面强化：${stats.learningStats.positiveReinforcements}`);
  console.log(`负面强化：${stats.learningStats.negativeReinforcements}`);
  console.log('');
  console.log(`用户信任度：${stats.userProfile.trustLevel}/100`);
  console.log(`共情深度等级：Level ${stats.userProfile.empathyDepthLevel}`);
  console.log(`用户标签：${stats.userProfile.tags.join(', ')}`);
  console.log(`偏好情感：${stats.userProfile.preferredEmotion || '暂无'}`);
  console.log('');
  
  // 情感分布
  console.log('情感分布:');
  Object.entries(stats.emotionDistribution || {}).forEach(([emotion, count]) => {
    console.log(`  ${emotion}: ${count}次`);
  });
  
  console.log('\n✅ V2 测试完成！\n');
}

runTests().catch(console.error);
