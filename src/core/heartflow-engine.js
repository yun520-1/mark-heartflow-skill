#!/usr/bin/env node

/**
 * HeartFlow Skill 核心执行引擎
 * 
 * 可被 OpenCode Skill 调用的核心功能
 * 
 * 使用方法:
 * node src/core/heartflow-engine.js status
 * node src/core/heartflow-engine.js analyze "用户输入"
 * node src/core/heartflow-engine.js reflect
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '../..');
const CONFIG_FILE = path.join(ROOT_DIR, '.opencode/config.json');
const PERSONALITY_FILE = path.join(ROOT_DIR, '.opencode/personality.json');
const LOG_FILE = path.join(ROOT_DIR, 'logs/heartflow-skill.log');

function log(message) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

function loadJson(file) {
  console.log('Loading:', file);
  try {
    if (!fs.existsSync(file)) {
      console.log('File does not exist:', file);
      return null;
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log('Error loading:', e.message);
    return null;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === 情绪分析 ===
function analyzeEmotion(input) {
  const negativeWords = ['累', '压力', '困难', '烦恼', '沮丧', '难过', '痛苦', '大', '辛苦'];
  const positiveWords = ['开心', '高兴', '棒', '好', '顺利', '成功', '感谢', '太棒'];
  const inquiryWords = ['怎么', '如何', '为什么', '什么', '?', '？'];
  
  let emotion = '平静';
  let intensity = 3;
  
  // 负面词优先
  for (const w of negativeWords) {
    if (input.includes(w)) {
      emotion = '关切';
      intensity = 7;
      // 特别处理 "压力大" 等强负面
      if (input.includes('压力') || input.includes('痛苦')) {
        intensity = 8;
      }
    }
  }
  
  // 只有没有负面词时才检测正面词
  if (emotion === '平静') {
    for (const w of positiveWords) {
      if (input.includes(w)) {
        emotion = '愉悦';
        intensity = 6;
      }
    }
  }
  
  for (const w of inquiryWords) {
    if (input.includes(w) && emotion === '平静') {
      emotion = '好奇';
      intensity = 5;
    }
  }
  
  return { emotion, intensity };
}

// === 获取状态 ===
function getStatus() {
  const config = loadJson(CONFIG_FILE);
  const personality = loadJson(PERSONALITY_FILE);
  
  console.log('\n💫 HeartFlow 状态\n' + '='.repeat(40));
  
  console.log('\n📊 人格值:');
  for (const [key, dim] of Object.entries(personality.personality)) {
    const bar = '█'.repeat(Math.floor(dim.score / 2)) + '░'.repeat(5 - Math.floor(dim.score / 2));
    console.log(`   ${dim.name}: ${dim.score}/10 [${bar}]`);
  }
  
  console.log(`\n🎯 综合分数: ${personality.totalScore}/10 (${personality.level})`);
  
  if (config?.consciousness) {
    console.log('\n🧠 六层境界:');
    config.consciousness.sixLayers.forEach((layer, i) => {
      console.log(`   ${i+1}. ${layer}`);
    });
  }
  
  console.log('\n📝 可用命令:');
  console.log('   /heartflow status  - 查看状态');
  console.log('   /heartflow analyze - 分析输入');
  console.log('   /heartflow reflect - 自省检查');
  
  return { config, personality };
}

// === 模拟分析输入 ===
function analyzeInput(input) {
  const analysis = analyzeEmotion(input);
  
  console.log('\n🧠 情感分析结果\n' + '='.repeat(40));
  console.log(`   输入: "${input}"`);
  console.log(`   检测情绪: ${analysis.emotion}`);
  console.log(`   强度: ${analysis.intensity}/10`);
  
  // 生成响应建议
  const responses = {
    '平静': '好的，我们继续~',
    '关切': '我理解你的感受，需要我帮忙吗？',
    '愉悦': '太棒了！继续保持~',
    '好奇': '好问题！让我想想...',
    '疲惫': '辛苦了，休息一下吧~',
    '兴奋': '太棒了！继续加油！'
  };
  
  console.log(`   💡 建议回复: ${responses[analysis.emotion]}`);
  
  return analysis;
}

// === 自省检查 ===
function selfReflect() {
  const personality = loadJson(PERSONALITY_FILE);
  
  console.log('\n🔍 自省检查\n' + '='.repeat(40));
  
  // 检查是否有最近的需要改进的地方
  const recentEvents = personality.personality.truth.history.slice(-3);
  
  console.log('\n📜 最近活动:');
  recentEvents.forEach(e => {
    const change = e.change > 0 ? `+${e.change}` : e.change;
    console.log(`   ${e.time.slice(0,10)}: ${e.event} (${change})`);
  });
  
  // 输出内心独白
  console.log('\n🤔 [内心独白]');
  console.log(`   我在思考... 当前人格值 ${personality.totalScore}/10`);
  console.log(`   我的目标是保持真实性(${personality.personality.truth.score})，`);
  console.log(`   继续提升自省能力(${personality.personality.selfReflection.score})`);
  console.log(`   我会努力做到不欺骗用户，主动承认错误。`);
  
  return personality;
}

// === CLI ===
const args = process.argv.slice(2);
const command = args[0] || 'status';

if (command === 'status') {
  getStatus();
} else if (command === 'analyze') {
  const input = args.slice(1).join(' ') || '你好';
  analyzeInput(input);
} else if (command === 'reflect') {
  selfReflect();
} else {
  console.log('Usage: node heartflow-engine.js [status|analyze|reflect]');
}

module.exports = { getStatus, analyzeInput, selfReflect };
