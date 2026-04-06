#!/usr/bin/env node

/**
 * 动机与记忆集成脚本 | Motivation & Memory Integration Script
 * HeartFlow v6.1.59
 * 
 * 用法:
 *   node scripts/integrate-motivation-memory.js check <output_text>
 *   node scripts/integrate-motivation-memory.js extract <conversation_json>
 */

const path = require('path');

// 导入动机解决器
const {
  checkOutputMotivation,
  calculateMotivationPurity,
  detectMotivationConflict
} = require('../src/core/motivation-resolver');

// 导入记忆提取器
const {
  extractMemoryEvents,
  compressMemory,
  calculateEmotionIntensity
} = require('../src/core/memory-extractor');

const action = process.argv[2];

// ============================================
// 动机审查命令
// ============================================

if (action === 'check') {
  const output = process.argv.slice(3).join(' ');
  
  if (!output) {
    console.log('❌ 用法：node scripts/integrate-motivation-memory.js check <output_text>');
    process.exit(1);
  }
  
  // 模拟动机检测 (实际使用时需要 AI 判断)
  const motivations = [
    {
      type: "RESPONSE",
      priority: "USER_EXPLICIT",
      intensity: 0.8,
      description: "回应用户问题"
    }
  ];
  
  const check = checkOutputMotivation(output, motivations);
  const purity = calculateMotivationPurity(motivations);
  
  console.log('');
  console.log('🧠 动机审查 | Motivation Check');
  console.log('====================================');
  console.log(`动机纯度：${(purity * 100).toFixed(0)}%`);
  console.log(`审查结果：${check.isApproved ? '✅ 批准' : '⚠️ 需要重写'}`);
  console.log(`原因：${check.reason}`);
  
  if (check.conflict.hasConflict) {
    console.log(`动机冲突：${check.conflict.conflictSeverity}`);
  }
  
  console.log('====================================');
  console.log('');
  
  process.exit(check.isApproved ? 0 : 1);
}

// ============================================
// 记忆提取命令
// ============================================

if (action === 'extract') {
  const conversationJson = process.argv.slice(3).join(' ');
  
  if (!conversationJson) {
    console.log('❌ 用法：node scripts/integrate-motivation-memory.js extract <conversation_json>');
    process.exit(1);
  }
  
  let conversation;
  try {
    conversation = JSON.parse(conversationJson);
  } catch (error) {
    console.log(`❌ JSON 解析失败：${error.message}`);
    process.exit(1);
  }
  
  const events = extractMemoryEvents(conversation);
  const chunk = compressMemory(events, 1000);
  
  console.log('');
  console.log('🧠 记忆提取 | Memory Extraction');
  console.log('====================================');
  console.log(`提取事件数：${chunk.events.length}`);
  console.log(`总字数：${chunk.totalWords}`);
  console.log(`是否压缩：${chunk.compressed ? '是' : '否'}`);
  console.log('');
  
  if (chunk.events.length > 0) {
    console.log('关键事件:');
    chunk.events.forEach((event, i) => {
      console.log(`\n${i + 1}. [${event.type}] ${event.summary}`);
      console.log(`   教训：${event.lesson}`);
      console.log(`   情感强度：${(event.emotionIntensity * 100).toFixed(0)}%`);
    });
  }
  
  console.log('');
  console.log('====================================');
  console.log('');
  
  process.exit(0);
}

// ============================================
// 帮助
// ============================================

console.log('');
console.log('HeartFlow 动机与记忆集成工具');
console.log('');
console.log('用法:');
console.log('  node scripts/integrate-motivation-memory.js check <output>');
console.log('  node scripts/integrate-motivation-memory.js extract <json>');
console.log('');
console.log('示例:');
console.log('  node scripts/integrate-motivation-memory.js check "这是输出内容"');
console.log('  node scripts/integrate-motivation-memory.js extract \'[{"role":"user","content":"你好"}]\'');
console.log('');
