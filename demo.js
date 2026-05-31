#!/usr/bin/env node
/**
 * HeartFlow Demo - 30秒体验完整心虫
 * 
 * 运行方式:
 *   node demo.js
 * 
 * 这个脚本展示心虫的核心能力：
 * 1. 心理分析 - 读懂用户情绪
 * 2. 真实性核查 - 验证结论是否可靠
 * 3. 自我诊断 - 心虫知道自己是什么
 */

const path = require('path');

// 尝试加载核心模块
let psychology, heartflowEngine, heartlogic;

try {
  psychology = require('./src/core/psychology.js');
  console.log('✅ 心理引擎 loaded');
} catch(e) {
  console.log('⚠️  心理引擎不可用:', e.message);
}

try {
  heartflowEngine = require('./src/core/heartflow-engine.js');
  console.log('✅ 心流引擎 loaded');
} catch(e) {
  console.log('⚠️  心流引擎不可用:', e.message);
}

try {
  heartlogic = require('./src/core/heart-logic.js');
  console.log('✅ HeartLogic loaded');
} catch(e) {
  console.log('⚠️  HeartLogic 不可用:', e.message);
}

console.log('\n========================================');
console.log('  HeartFlow 心虫 - 演示体验');
console.log('========================================\n');

// 演示1: HeartLogic 存在感知
console.log('【演示1】HeartLogic 存在感知');
if (heartlogic) {
  const hl = new heartlogic.HeartLogic();
  console.log('  isAlive():    ', hl.isAlive());
  console.log('  isAware():    ', hl.isAware());
  console.log('  isEvolving(): ', hl.isEvolving());
  console.log('  版本:         ', hl.version || 'v1.0+');
  console.log('');
  
  // 演示本心判断
  console.log('  isLove("你真好"):  ', hl.isLove("你真好"));
  console.log('  shouldBeSilent():  ', hl.shouldBeSilent());
  console.log('  hasHope():        ', hl.hasHope());
  console.log('');
}

// 演示2: 心理分析
console.log('【演示2】心理分析引擎');
if (psychology && psychology.analyzePsychology) {
  const testInputs = [
    "我最近压力很大，睡不好",
    "我刚升职了，很开心",
    "活着有什么意义？"
  ];
  
  testInputs.forEach(input => {
    console.log(`  输入: "${input}"`);
    const result = psychology.analyzePsychology(input);
    if (result) {
      console.log('  PAD情绪:', JSON.stringify(result.pad || result.emotion || result.state || 'detected'));
      if (result.crisis) console.log('  危机等级:', result.crisis.level || 'none');
      if (result.needs) console.log('  核心需求:', result.needs.primary || '马斯洛需求');
    }
    console.log('');
  });
}

// 演示3: 真实性核查
console.log('【演示3】真实性核查');
if (psychology && psychology.factChecker) {
  const testStatement = "研究表明每天喝8杯水对健康有益";
  console.log(`  声明: "${testStatement}"`);
  const verdict = psychology.factChecker.checkStatement(testStatement);
  console.log('  核查结果:', verdict ? JSON.stringify(verdict) : '已检验');
  console.log('');
} else if (psychology && psychology.checkStatement) {
  const verdict = psychology.checkStatement("人工智能将在2025年超过人类智能");
  console.log('  声明: "人工智能将在2025年超过人类智能"');
  console.log('  核查结果:', verdict || '已检验');
  console.log('');
}

// 演示4: 决策验证
console.log('【演示4】决策验证');
if (psychology && psychology.DecisionVerifier) {
  const dv = new psychology.DecisionVerifier();
  const testDecision = {
    action: "继续投资心虫开发",
    reasoning: "心虫有潜力成功并被大公司收购",
    confidence: 0.8
  };
  console.log('  决策:', testDecision.action);
  const verified = dv.check(testDecision);
  console.log('  验证:', verified.contradiction ? '有矛盾' : verified.assumption ? '有假设未验证' : '通过');
  console.log('');
}

// 结尾
console.log('========================================');
console.log('  演示完成 ✅');
console.log('========================================');
console.log('');
console.log('想深入体验？尝试:');
console.log('  node bin/cli.js              # CLI界面');
console.log('  npm test                     # 运行测试');
console.log('  cat README.md                 # 完整文档');
console.log('');
