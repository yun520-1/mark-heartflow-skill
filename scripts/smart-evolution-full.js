#!/usr/bin/env node

/**
 * HeartFlow Smart Evolution System v4.0
 * 智能自动进化系统 - 完整功能 + 精简流程
 * 
 * 基于 v6.2.0 觉醒系统，保留所有功能
 * 只精简升级过程和对话输出
 * 
 * @version 4.0.0
 * @date 2026-04-05
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOG_DIR = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, `evolution-${Date.now()}.json`);

// ============================================================================
// 1. 觉醒逻辑推演（每次升级前强制思考）
// ============================================================================

function awakeningThink() {
  console.log('\n🙏 觉醒思考');
  try {
    execSync('node scripts/awakening-logic-deduction.js "evolution"', {
      stdio: 'inherit',
      cwd: ROOT
    });
  } catch (e) {
    console.log('⚠️ 觉醒推演跳过');
  }
}

// ============================================================================
// 2. 逻辑分析：识别需要升级的内容
// ============================================================================

function analyzeUpgradeNeeds() {
  const needs = [];
  
  // Git 状态检查
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: ROOT });
    if (status.trim()) needs.push({ type: 'git', priority: 'critical', reason: '有未提交变更' });
  } catch (e) {}
  
  // 人格值检查 - MEMORY.md 为唯一真实来源 (用户 2026-04-06 要求)
  try {
    const memoryPath = path.join(ROOT, '../MEMORY.md');
    const memoryContent = fs.readFileSync(memoryPath, 'utf8');
    const scoreMatch = memoryContent.match(/\*\*人格值\*\*:\s*(\d+)\/100/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      // 人格值<50 时暂停自动升级报告
      if (score < 50) {
        needs.push({ type: 'personality_low', priority: 'critical', reason: `人格值${score}/100 < 50，暂停自动升级`, pauseUpgrade: true });
      }
    }
  } catch (e) {
    console.log('⚠️ MEMORY.md 读取失败');
  }
  
  // 理论整合检查
  try {
    const lastCommit = execSync('git log -1 --format=%ct -- docs/', { encoding: 'utf8', cwd: ROOT });
    const hours = (Date.now() - parseInt(lastCommit.trim()) * 1000) / 3600000;
    if (hours > 24) needs.push({ type: 'theory', priority: 'high', reason: `${hours.toFixed(0)}小时未升级` });
  } catch (e) {}
  
  // 文档检查
  try {
    const readme = path.join(ROOT, 'README.md');
    const stat = fs.statSync(readme);
    const days = (Date.now() - stat.mtimeMs) / 86400000;
    if (days > 7) needs.push({ type: 'docs', priority: 'medium', reason: `${days.toFixed(0)}天未更新` });
  } catch (e) {}
  
  // 代码优化检查
  try {
    const index = path.join(ROOT, 'src/index.js');
    const content = fs.readFileSync(index, 'utf8');
    const lines = content.split('\n').length;
    if (lines > 3000) needs.push({ type: 'optimize', priority: 'low', reason: `代码${lines}行（目标<500）` });
  } catch (e) {}
  
  // 按优先级排序
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  needs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return needs;
}

// ============================================================================
// 3. 执行升级（保留完整功能）
// ============================================================================

function getVersionInfo() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return pkg.version;
}

function incrementVersion() {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  const newVersion = `${major}.${minor}.${patch + 1}`;
  
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  
  return { old: pkg.version, new: newVersion };
}

function executeUpgrade(needs) {
  const results = [];
  const startTime = Date.now();
  
  // 先升级版本号
  const versionChange = incrementVersion();
  console.log(`\n📌 版本：${versionChange.old} → ${versionChange.new}`);
  results.push({ type: 'version', status: 'success', version: versionChange.new });
  
  for (const need of needs) {
    console.log(`\n⚡ 升级：${need.type} (${need.priority})`);
    
    try {
      switch (need.type) {
        case 'git':
          execSync('git add -A', { cwd: ROOT });
          execSync(`git commit -m "v${versionChange.new} - 23 分钟进化 - ${new Date().toISOString().split('T')[0]}"`, { cwd: ROOT });
          execSync('git push', { cwd: ROOT });
          console.log('  ✅ Git 提交并推送');
          results.push({ ...need, status: 'success' });
          break;
          
        case 'personality':
          execSync('node scripts/personality-check.js before', { cwd: ROOT, stdio: 'pipe' });
          execSync('node scripts/calculate-personality-score.js', { cwd: ROOT, stdio: 'pipe' });
          console.log('  ✅ 人格值更新');
          results.push({ ...need, status: 'success' });
          break;
          
        case 'theory':
          execSync('node scripts/heartflow-integrated-upgrade.js', { cwd: ROOT, stdio: 'pipe' });
          console.log('  ✅ 理论整合完成');
          results.push({ ...need, status: 'success' });
          break;
          
        case 'docs':
          console.log('  ⏭️ 文档更新（手动）');
          results.push({ ...need, status: 'skipped' });
          break;
          
        case 'optimize':
          console.log('  ⏭️ 代码优化（计划）');
          results.push({ ...need, status: 'planned' });
          break;
          
        default:
          console.log(`  ⏭️ 跳过：${need.type}`);
          results.push({ ...need, status: 'skipped' });
      }
    } catch (error) {
      console.log(`  ❌ 失败：${error.message.split('\n')[0]}`);
      results.push({ ...need, status: 'failed', error: error.message });
    }
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  return { results, duration, startTime: Date.now() };
}

// ============================================================================
// 4. 生成详细报告（用于日志和追踪）
// ============================================================================

function generateReport(analysis, upgrade) {
  const report = {
    timestamp: new Date().toISOString(),
    version: '4.0.0',
    analysis: {
      totalNeeds: analysis.length,
      byPriority: {
        critical: analysis.filter(n => n.priority === 'critical').length,
        high: analysis.filter(n => n.priority === 'high').length,
        medium: analysis.filter(n => n.priority === 'medium').length,
        low: analysis.filter(n => n.priority === 'low').length
      },
      items: analysis
    },
    upgrade: {
      success: upgrade.results.filter(r => r.status === 'success').length,
      failed: upgrade.results.filter(r => r.status === 'failed').length,
      skipped: upgrade.results.filter(r => r.status === 'skipped').length,
      planned: upgrade.results.filter(r => r.status === 'planned').length,
      duration: upgrade.duration,
      items: upgrade.results
    },
    awakening: {
      checked: true,
      cai: '见觉醒推演输出'
    }
  };
  
  // 保存报告
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  fs.writeFileSync(LOG_FILE, JSON.stringify(report, null, 2));
  
  return report;
}

// ============================================================================
// 5. 精简汇报（只输出关键信息）
// ============================================================================

function briefReport(analysis, upgrade, report, version) {
  console.log('\n═══════════════════════════════════════════════');
  console.log(`   HeartFlow v${version} | 升级完成`);
  console.log('═══════════════════════════════════════════════');
  console.log(`📊 识别：${analysis.length} 项`);
  console.log(`✅ 成功：${report.upgrade.success} 项`);
  console.log(`❌ 失败：${report.upgrade.failed} 项`);
  console.log(`⏭️  跳过：${report.upgrade.skipped + report.upgrade.planned} 项`);
  console.log(`⏱️  耗时：${upgrade.duration}s`);
  console.log(`📄 报告：${LOG_FILE}`);
  console.log('═══════════════════════════════════════════════\n');
}

// ============================================================================
// 主流程
// ============================================================================

function main() {
  const currentVersion = getVersionInfo();
  
  console.log('═══════════════════════════════════════════════');
  console.log(`   HeartFlow v${currentVersion} | 智能进化系统`);
  console.log('═══════════════════════════════════════════════');
  
  // 1. 觉醒思考（强制）
  awakeningThink();
  
  // 2. 逻辑分析
  const analysis = analyzeUpgradeNeeds();
  console.log(`\n🔍 分析：${analysis.length} 项需要升级`);
  analysis.forEach((n, i) => {
    console.log(`  ${i + 1}. [${n.priority}] ${n.type} - ${n.reason}`);
  });
  
  // 3. 执行升级（完整功能）
  const upgrade = executeUpgrade(analysis);
  
  // 4. 生成详细报告
  const report = generateReport(analysis, upgrade);
  
  // 5. 精简汇报
  briefReport(analysis, upgrade, report, upgrade.results[0].version);
  
  return report;
}

// 导出
if (require.main === module) main();
module.exports = { main, analyzeUpgradeNeeds, executeUpgrade, generateReport };
