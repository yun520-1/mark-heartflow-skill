#!/usr/bin/env node

/**
 * Auto-Upgrade - 自动升级脚本
 * HeartFlow v6.1.60
 * 
 * 用法:
 *   node scripts/auto-upgrade.js <upgrade_description>
 * 
 * 流程:
 * 1. 执行 git commit
 * 2. 运行自动评估
 * 3. 根据评估结果自动推送或等待审核
 */

const { execSync } = require('child_process');
const path = require('path');

const { autoEvaluate, generateEvaluateReport, executeDecision, logEvaluate } = require('../src/core/auto-evaluate');

// 获取升级描述
const upgradeDesc = process.argv.slice(2).join(' ') || '自动升级';

console.log('');
console.log('🚀 自动升级 | Auto-Upgrade');
console.log('====================================');
console.log(`升级描述：${upgradeDesc}`);
console.log('');

// 步骤 1: Git commit (如果还没提交)
console.log('步骤 1: Git 状态检查...');
try {
  const status = execSync('git status --porcelain', {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8'
  });
  
  const hasChanges = status.trim().length > 0;
  
  if (hasChanges) {
    console.log('检测到未提交变更，执行 commit...');
    execSync(`git add -A && git commit -m "v6.1.60: ${upgradeDesc}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Commit 完成');
  } else {
    console.log('✅ 无未提交变更');
  }
} catch (error) {
  console.log(`⚠️  Git 操作失败：${error.message}`);
}

console.log('');

// 步骤 2: 自动评估
console.log('步骤 2: 自动评估...');
const evalResults = autoEvaluate({ description: upgradeDesc });
console.log(generateEvaluateReport(evalResults));

// 步骤 3: 执行决策
console.log('步骤 3: 执行决策...');
const decision = executeDecision(evalResults);
console.log(decision.message);

// 步骤 4: 记录日志
logEvaluate(evalResults, decision);

console.log('');
console.log('====================================');
console.log('升级流程完成');
console.log('');

// 退出码
process.exit(decision.success ? 0 : 1);
