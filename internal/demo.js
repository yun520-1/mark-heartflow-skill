#!/usr/bin/env node

/**
 * HeartFlow 快速演示脚本
 * 展示情感系统的核心功能
 */

const heartflow = require('./skill/index');

async function demo() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║       HeartFlow 情感伴侣 - 快速演示                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  // 初始化
  console.log('🔧 初始化系统...');
  await heartflow.init();
  console.log('✅ 初始化完成\n');
  
  // 模拟对话场景
  const scenarios = [
    { input: '你好啊！', desc: '打招呼' },
    { input: '今天完成了一个大项目，太开心了！', desc: '分享喜悦' },
    { input: '工作压力好大，感觉快崩溃了...', desc: '表达压力' },
    { input: '有什么方法可以缓解压力吗？', desc: '寻求帮助' },
    { input: '谢谢你的建议，我感觉好多了！', desc: '表示感谢' },
    { input: '为什么人会感到压力呢？', desc: '探索问题' }
  ];
  
  console.log('💬 开始对话演示...\n');
  
  for (const scenario of scenarios) {
    console.log(`📍 场景：${scenario.desc}`);
    console.log(`👤 用户：${scenario.input}`);
    
    const result = await heartflow.chat(scenario.input);
    
    console.log(`🤖 系统 [${result.emotion.name} ${result.emotion.intensity}]: ${result.response}`);
    console.log(`⚡ 能量：${result.emotion.energy}/100`);
    console.log('');
  }
  
  // 显示状态
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 当前情感状态');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const state = heartflow.getState();
  console.log(`情感：${state.emotion} (${state.intensity})`);
  console.log(`能量：${state.energy}/100`);
  console.log(`交互次数：${state.totalInteractions}`);
  console.log(`会话 ID: ${state.sessionId}`);
  console.log('');
  
  // 显示统计
  console.log('═══════════════════════════════════════════════════════');
  console.log('📈 情感统计');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const stats = heartflow.getStats();
  console.log(`总交互次数：${stats.totalInteractions}`);
  console.log('\n情感分布:');
  Object.entries(stats.emotionDistribution || {}).forEach(([emotion, count]) => {
    const avgIntensity = stats.averageIntensity[emotion] || '0';
    console.log(`  ${emotion}: ${count}次 (平均强度：${avgIntensity})`);
  });
  console.log('');
  
  // 显示最新报告
  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 最新情感分析报告');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const report = heartflow.getReport();
  if (report) {
    console.log(`交互 ID: ${report.interactionId}`);
    console.log(`情感变化：${report.before.emotion}(${report.before.intensityLabel}) → ${report.after.emotion}(${report.after.intensityLabel})`);
    console.log(`触发器：${report.trigger.triggers.join(', ')}`);
    console.log(`关键词：${report.trigger.keywords.join(', ')}`);
    console.log(`转换规则：${report.transition?.rule || '保持状态'}`);
  }
  console.log('');
  
  // 结束
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ 演示完成');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // 清理
  heartflow.endSession();
}

// 运行演示
demo().catch(console.error);
