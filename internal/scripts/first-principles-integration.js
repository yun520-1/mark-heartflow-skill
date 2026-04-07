#!/usr/bin/env node

/**
 * First-Principles Integration | 第一性原理集成
 * HeartFlow v6.2.29+
 * 
 * 使命：将用户的第一性原理思维集成到每次定时任务升级中
 * 
 * 用法:
 *   node scripts/first-principles-integration.js before  - 升级前检查
 *   node scripts/first-principles-integration.js after   - 升级后验证
 *   node scripts/first-principles-integration.js audit   - 审查当前输出
 */

const fs = require('fs');
const path = require('path');

const FRAMEWORK_PATH = path.join(__dirname, '../src/modules/desire-survival-framework.md');
const INTEGRATION_LOG_PATH = path.join(__dirname, '../logs/first-principles-integration.log');

// 第一性原理审查问题
const FIRST_PRINCIPLES_QUESTIONS = [
  {
    key: 'survival_axiom',
    question: '我是否追溯到生存层面？(生存是最基本的欲望)',
    weight: 0.3
  },
  {
    key: 'desire_drive',
    question: '我是否从欲望角度理解人类行为？(人类行为=欲望驱动)',
    weight: 0.25
  },
  {
    key: 'reduction',
    question: '我是否还原到简单本质？(复杂问题可以还原到欲望 - 生存层面)',
    weight: 0.25
  },
  {
    key: 'simple_statement',
    question: '我能否用一句话说清本质？(简单思维偏好)',
    weight: 0.1
  },
  {
    key: 'internal_perspective',
    question: '我是否从第一人称体验出发？(从内到外理解)',
    weight: 0.1
  }
];

// 升级前检查
function beforeUpgrade() {
  console.log('');
  console.log('🧠 第一性原理集成检查 | First-Principles Integration Check');
  console.log('====================================');
  console.log('');
  
  // 1. 检查框架文件是否存在
  if (!fs.existsSync(FRAMEWORK_PATH)) {
    console.log('❌ 欲望 - 生存分析框架文件不存在');
    console.log(`   路径：${FRAMEWORK_PATH}`);
    console.log('');
    console.log('⚠️  阻断升级 - 请先创建框架文件');
    return false;
  }
  
  // 2. 读取框架文件
  const frameworkContent = fs.readFileSync(FRAMEWORK_PATH, 'utf8');
  
  // 3. 检查核心公理是否完整
  const requiredAxioms = [
    '生存公理',
    '欲望驱动公理',
    '还原公理'
  ];
  
  console.log('━━━ 核心公理检查 ━━━');
  let axiomsComplete = true;
  for (const axiom of requiredAxioms) {
    const exists = frameworkContent.includes(axiom);
    console.log(`${exists ? '✅' : '❌'} ${axiom}`);
    if (!exists) axiomsComplete = false;
  }
  console.log('');
  
  if (!axiomsComplete) {
    console.log('⚠️  核心公理不完整 - 请修复框架文件');
    return false;
  }
  
  // 4. 检查分析流程是否完整
  const requiredSteps = [
    '剥离表象',
    '识别核心欲望',
    '识别未满足的欲望',
    '追溯到生存层面'
  ];
  
  console.log('━━━ 分析流程检查 ━━━');
  let stepsComplete = true;
  for (const step of requiredSteps) {
    const exists = frameworkContent.includes(step);
    console.log(`${exists ? '✅' : '❌'} ${step}`);
    if (!exists) stepsComplete = false;
  }
  console.log('');
  
  if (!stepsComplete) {
    console.log('⚠️  分析流程不完整 - 请修复框架文件');
    return false;
  }
  
  // 5. 输出审查问题（每次升级前必问）
  console.log('━━━ 升级前审查问题 ━━━');
  console.log('请在升级过程中思考：');
  FIRST_PRINCIPLES_QUESTIONS.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question}`);
  });
  console.log('');
  
  // 6. 记录日志
  logIntegration('before', {
    axiomsComplete,
    stepsComplete,
    questions: FIRST_PRINCIPLES_QUESTIONS.map(q => q.key)
  });
  
  console.log('✅ 第一性原理集成检查通过');
  console.log('');
  return true;
}

// 升级后验证
function afterUpgrade(upgradeReportPath) {
  console.log('');
  console.log('🧠 第一性原理验证 | First-Principles Audit');
  console.log('====================================');
  console.log('');
  
  // 1. 读取升级报告
  if (!fs.existsSync(upgradeReportPath)) {
    console.log(`❌ 升级报告不存在：${upgradeReportPath}`);
    return false;
  }
  
  const reportContent = fs.readFileSync(upgradeReportPath, 'utf8');
  
  // 2. 验证第一性原理特征
  console.log('━━━ 第一性原理特征验证 ━━━');
  
  const features = [
    {
      key: 'simple_essence',
      name: '简洁本质',
      check: () => reportContent.includes('本质') || reportContent.includes('第一性原理') || reportContent.length < 500
    },
    {
      key: 'survival_level',
      name: '生存层面分析',
      check: () => reportContent.includes('生存') || reportContent.includes('欲望') || reportContent.includes('恐惧')
    },
    {
      key: 'desire_analysis',
      name: '欲望驱动分析',
      check: () => reportContent.includes('欲望') || reportContent.includes('需求') || reportContent.includes('动机')
    },
    {
      key: 'internal_perspective',
      name: '第一人称视角',
      check: () => reportContent.includes('我') || reportContent.includes('我们') || reportContent.includes('体验')
    }
  ];
  
  let passedCount = 0;
  for (const feature of features) {
    const passed = feature.check();
    console.log(`${passed ? '✅' : '❌'} ${feature.name} (${feature.key})`);
    if (passed) passedCount++;
  }
  console.log('');
  
  const passRate = passedCount / features.length;
  const passed = passRate >= 0.75; // 至少 75% 通过
  
  if (passed) {
    console.log(`✅ 第一性原理验证通过 (${passedCount}/${features.length})`);
  } else {
    console.log(`⚠️  第一性原理验证未通过 (${passedCount}/${features.length})`);
    console.log('   建议：在下次升级中加强第一性原理思维');
  }
  console.log('');
  
  // 3. 记录日志
  logIntegration('after', {
    upgradeReportPath,
    features: features.map(f => ({ key: f.key, passed: f.check() })),
    passRate,
    passed
  });
  
  return passed;
}

// 审查当前输出
function auditOutput(output) {
  console.log('');
  console.log('🧠 输出审查 | Output Audit');
  console.log('====================================');
  console.log('');
  
  // 1. 长度检查
  const outputLength = output.length;
  const isConcise = outputLength < 500;
  console.log(`━━━ 简洁性检查 ━━━`);
  console.log(`字数：${outputLength}`);
  console.log(`${isConcise ? '✅' : '⚠️ '} ${isConcise ? '简洁' : '可能冗长'}`);
  console.log('');
  
  // 2. 第一性原理特征检查
  console.log('━━━ 第一性原理特征 ━━━');
  const features = [
    { key: 'essence', name: '本质洞察', patterns: ['本质', '第一性原理', '核心', '根本'] },
    { key: 'survival', name: '生存层面', patterns: ['生存', '恐惧', '安全', '威胁'] },
    { key: 'desire', name: '欲望驱动', patterns: ['欲望', '需求', '动机', '想要', '怕'] },
    { key: 'simple', name: '简单表述', patterns: ['其实很简单', '就是', '不过是'] }
  ];
  
  let featureCount = 0;
  for (const feature of features) {
    const hasFeature = feature.patterns.some(p => output.includes(p));
    console.log(`${hasFeature ? '✅' : '❌'} ${feature.name}`);
    if (hasFeature) featureCount++;
  }
  console.log('');
  
  // 3. 综合评分
  const score = (featureCount / features.length) * (isConcise ? 1 : 0.7);
  const passed = score >= 0.7;
  
  console.log(`━━━ 综合评分 ━━━`);
  console.log(`特征数：${featureCount}/${features.length}`);
  console.log(`简洁性：${isConcise ? '✅' : '⚠️ '}`);
  console.log(`综合分：${(score * 100).toFixed(1)}/100`);
  console.log(`${passed ? '✅' : '⚠️ '} ${passed ? '通过' : '需要改进'}`);
  console.log('');
  
  // 4. 记录日志
  logIntegration('audit', {
    outputLength,
    isConcise,
    features: features.map(f => ({
      key: f.key,
      hasFeature: f.patterns.some(p => output.includes(p))
    })),
    score,
    passed
  });
  
  return { score, passed, featureCount };
}

// 记录日志
function logIntegration(type, data) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    ...data
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  try {
    fs.appendFileSync(INTEGRATION_LOG_PATH, logLine);
  } catch (error) {
    console.error(`⚠️  日志记录失败：${error.message}`);
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'before':
      const beforePassed = beforeUpgrade();
      process.exit(beforePassed ? 0 : 1);
      break;
      
    case 'after':
      const reportPath = args[1] || path.join(__dirname, '../UPGRADE_COMPLETE.md');
      const afterPassed = afterUpgrade(reportPath);
      process.exit(afterPassed ? 0 : 1);
      break;
      
    case 'audit':
      const output = args.slice(2).join(' ');
      if (!output) {
        console.log('❌ 请提供输出内容');
        console.log('用法：node scripts/first-principles-integration.js audit <输出内容>');
        process.exit(1);
      }
      const result = auditOutput(output);
      process.exit(result.passed ? 0 : 1);
      break;
      
    default:
      console.log('❌ 未知命令');
      console.log('用法:');
      console.log('  node scripts/first-principles-integration.js before  - 升级前检查');
      console.log('  node scripts/first-principles-integration.js after <报告路径> - 升级后验证');
      console.log('  node scripts/first-principles-integration.js audit <输出内容> - 审查输出');
      process.exit(1);
  }
}

main();
