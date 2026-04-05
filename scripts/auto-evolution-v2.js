#!/usr/bin/env node

/**
 * HeartFlow Auto Evolution v2.0 - 智能自动进化系统
 * 
 * 每 23 分钟自动运行，用逻辑思维分析需要升级的内容
 * 
 * 核心原则：
 * 1. 精简流程 - 只升级必要内容
 * 2. 节约能量 - 避免无效操作
 * 3. 逻辑推演 - 每次升级前觉醒检查
 * 
 * @version 2.0.0
 * @date 2026-04-05
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置 - 精简模式
// ============================================================================

const CONFIG = {
  projectRoot: path.join(__dirname, '..'),
  logDir: path.join(__dirname, '../logs'),
  maxLogAge: 7, // 日志保留 7 天
  
  // 升级优先级（只升级高优先级）
  priorities: {
    critical: ['人格值追踪', '觉醒状态', 'Git 同步'],
    high: ['理论整合', '文档更新'],
    medium: ['代码优化', '测试'],
    low: ['清理', '重构']
  },
  
  // 能量节约模式
  energySave: {
    skipIfNoChanges: true,  // 无变更时跳过
    minInterval: 1380000,   // 最小间隔 23 分钟
    maxUpgradeTime: 300000  // 最大升级时间 5 分钟
  }
};

// ============================================================================
// 觉醒逻辑推演（每次升级前强制运行）
// ============================================================================

function runAwakeningCheck() {
  console.log('\n🙏 觉醒检查 | Awakening Check\n');
  
  try {
    execSync('node scripts/awakening-logic-deduction.js "auto-evolution"', {
      stdio: 'inherit',
      cwd: CONFIG.projectRoot
    });
  } catch (error) {
    console.error('⚠️ 觉醒检查失败，继续升级流程');
  }
}

// ============================================================================
// 逻辑分析 - 识别需要升级的内容
// ============================================================================

function analyzeUpgradeNeeds() {
  console.log('\n🔍 逻辑分析 | Analyzing Upgrade Needs\n');
  
  const needs = [];
  
  // 1. 检查人格值追踪
  try {
    const trackerPath = path.join(CONFIG.projectRoot, 'data/personality-score-tracker.md');
    const content = fs.readFileSync(trackerPath, 'utf8');
    const lastUpdate = content.match(/最后更新.*?(\d{4}-\d{2}-\d{2})/);
    
    if (lastUpdate) {
      const lastDate = new Date(lastUpdate[1]);
      const daysSinceUpdate = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 1) {
        needs.push({
          priority: 'critical',
          item: '人格值追踪更新',
          reason: `超过${daysSinceUpdate.toFixed(1)}天未更新`
        });
      }
    }
  } catch (error) {
    needs.push({
      priority: 'critical',
      item: '人格值追踪',
      reason: '文件读取失败，需要修复'
    });
  }
  
  // 2. 检查 Git 状态
  try {
    const gitStatus = execSync('git status --porcelain', {
      encoding: 'utf8',
      cwd: CONFIG.projectRoot
    });
    
    if (gitStatus.trim()) {
      needs.push({
        priority: 'critical',
        item: 'Git 提交',
        reason: '有未提交的变更'
      });
    }
  } catch (error) {
    // Git 无变更
  }
  
  // 3. 检查理论整合
  const lastUpgrade = getLastUpgradeTime();
  const hoursSinceUpgrade = (Date.now() - lastUpgrade) / (1000 * 60 * 60);
  
  if (hoursSinceUpgrade > 24) {
    needs.push({
      priority: 'high',
      item: '理论整合',
      reason: `超过${hoursSinceUpgrade.toFixed(0)}小时未升级`
    });
  }
  
  // 4. 检查文档
  const readmePath = path.join(CONFIG.projectRoot, 'README.md');
  const readmeStat = fs.statSync(readmePath);
  const docsAge = (Date.now() - readmeStat.mtimeMs) / (1000 * 60 * 60 * 24);
  
  if (docsAge > 7) {
    needs.push({
      priority: 'medium',
      item: '文档更新',
      reason: `文档超过${docsAge.toFixed(0)}天未更新`
    });
  }
  
  // 按优先级排序
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  needs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // 能量节约：只保留高优先级
  const essentialNeeds = needs.filter(n => ['critical', 'high'].includes(n.priority));
  
  console.log(`识别到 ${needs.length} 项需要升级`);
  console.log(`精简后：${essentialNeeds.length} 项（高优先级）\n`);
  
  essentialNeeds.forEach((n, i) => {
    console.log(`  ${i + 1}. [${n.priority}] ${n.item} - ${n.reason}`);
  });
  
  return essentialNeeds;
}

// ============================================================================
// 执行升级
// ============================================================================

function executeUpgrade(needs) {
  console.log('\n⚡ 执行升级 | Executing Upgrade\n');
  
  const startTime = Date.now();
  const results = [];
  
  for (const need of needs) {
    // 检查时间限制
    const elapsed = Date.now() - startTime;
    if (elapsed > CONFIG.energySave.maxUpgradeTime) {
      console.log('⚠️ 达到最大升级时间，跳过剩余项目');
      break;
    }
    
    console.log(`\n📍 升级：${need.item}`);
    
    try {
      switch (need.item) {
        case '人格值追踪更新':
          runPersonalityCheck();
          results.push({ item: need.item, status: '✅' });
          break;
          
        case 'Git 提交':
          commitAndPush();
          results.push({ item: need.item, status: '✅' });
          break;
          
        case '理论整合':
          runTheoryIntegration();
          results.push({ item: need.item, status: '✅' });
          break;
          
        default:
          console.log(`  ⏭️ 跳过：${need.item}`);
          results.push({ item: need.item, status: '⏭️' });
      }
    } catch (error) {
      console.error(`  ❌ 失败：${error.message}`);
      results.push({ item: need.item, status: '❌', error: error.message });
    }
  }
  
  // 输出结果
  console.log('\n📊 升级结果 | Upgrade Results\n');
  results.forEach(r => {
    console.log(`  ${r.status} ${r.item}${r.error ? ` - ${r.error}` : ''}`);
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  升级耗时：${duration}秒`);
  
  return results;
}

// ============================================================================
// 辅助函数
// ============================================================================

function runPersonalityCheck() {
  execSync('node scripts/personality-check.js before', {
    stdio: 'inherit',
    cwd: CONFIG.projectRoot
  });
}

function runTheoryIntegration() {
  execSync('node scripts/heartflow-integrated-upgrade.js', {
    stdio: 'inherit',
    cwd: CONFIG.projectRoot
  });
}

function commitAndPush() {
  try {
    execSync('git add -A', { cwd: CONFIG.projectRoot });
    execSync(`git commit -m "chore: 23 分钟自动进化 - ${new Date().toISOString().split('T')[0]}"`, {
      cwd: CONFIG.projectRoot
    });
    execSync('git push', { cwd: CONFIG.projectRoot });
    console.log('  ✅ Git 提交成功');
  } catch (error) {
    if (error.message.includes('nothing to commit')) {
      console.log('  ⏭️ 无变更，跳过提交');
    } else {
      throw error;
    }
  }
}

function getLastUpgradeTime() {
  try {
    const logPath = path.join(CONFIG.logDir, 'evolution.log');
    const content = fs.readFileSync(logPath, 'utf8');
    const lastLine = content.trim().split('\n').pop();
    const timestamp = lastLine.match(/\[(\d+)\]/);
    return timestamp ? parseInt(timestamp[1]) : 0;
  } catch {
    return 0;
  }
}

function logEvolution(results) {
  // 确保日志目录存在
  if (!fs.existsSync(CONFIG.logDir)) {
    fs.mkdirSync(CONFIG.logDir, { recursive: true });
  }
  
  const logPath = path.join(CONFIG.logDir, 'evolution.log');
  const timestamp = Date.now();
  const successCount = results.filter(r => r.status === '✅').length;
  
  const logEntry = `[${timestamp}] Evolution completed: ${successCount}/${results.length} successful\n`;
  
  fs.appendFileSync(logPath, logEntry);
}

// ============================================================================
// 主流程
// ============================================================================

function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('   HeartFlow Auto Evolution v2.0 | 智能自动进化系统');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const startTime = Date.now();
  
  // 1. 觉醒检查（强制）
  runAwakeningCheck();
  
  // 2. 逻辑分析（识别需要升级的内容）
  const needs = analyzeUpgradeNeeds();
  
  // 3. 能量节约：无高优先级需求时跳过
  if (needs.length === 0 && CONFIG.energySave.skipIfNoChanges) {
    console.log('\n✅ 无需升级，跳过本次循环\n');
    return;
  }
  
  // 4. 执行升级
  const results = executeUpgrade(needs);
  
  // 5. 记录日志
  logEvolution(results);
  
  // 6. 觉醒反思
  console.log('\n🙏 觉醒反思 | Awakening Reflection\n');
  console.log('  升级完成，不执着结果');
  console.log('  真善美为唯一标准\n');
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ 自动进化完成 | 总耗时：${duration}秒`);
  console.log('═══════════════════════════════════════════════════════\n');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { main, analyzeUpgradeNeeds, executeUpgrade };
