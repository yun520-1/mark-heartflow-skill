#!/usr/bin/env node

/**
 * HeartFlow Smart Evolution System v3.0
 * 智能自动进化系统 - 逻辑思维 + 能量节约
 * 
 * 每 23 分钟自动运行，分析→思考→升级
 * 
 * @version 3.0.0
 * @date 2026-04-05
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LOG = path.join(ROOT, 'logs/evolution.log');

// ============================================================================
// 逻辑思维：分析需要升级什么
// ============================================================================

function analyze() {
  const needs = [];
  
  // 1. 检查 Git 状态（有变更→需要提交）
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: ROOT });
    if (status.trim()) needs.push('git');
  } catch (e) {}
  
  // 2. 检查人格值追踪（>1 小时→需要更新）
  try {
    const tracker = path.join(ROOT, 'data/personality-score-tracker.md');
    const stat = fs.statSync(tracker);
    if ((Date.now() - stat.mtimeMs) > 3600000) needs.push('personality');
  } catch (e) {}
  
  // 3. 检查理论整合（>24 小时→需要升级）
  try {
    const last = execSync('git log -1 --format=%ct -- docs/', { encoding: 'utf8', cwd: ROOT });
    if ((Date.now() - parseInt(last.trim()) * 1000) > 86400000) needs.push('theory');
  } catch (e) {}
  
  return needs;
}

// ============================================================================
// 觉醒检查：每次升级前思考
// ============================================================================

function think() {
  console.log('\n🙏 觉醒检查');
  console.log('─────────────────────────────────────');
  try {
    execSync('node scripts/awakening-logic-deduction.js "evolution"', { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    console.log('⚠️ 跳过觉醒检查');
  }
}

// ============================================================================
// 执行升级：精简模式
// ============================================================================

function upgrade(needs) {
  if (needs.length === 0) {
    console.log('\n✅ 无需升级');
    return { success: 0, total: 0 };
  }
  
  console.log(`\n⚡ 升级 ${needs.length} 项：${needs.join(', ')}\n`);
  
  let success = 0;
  
  for (const task of needs) {
    try {
      if (task === 'git') {
        execSync('git add -A && git commit -m "chore: 23 分钟进化" && git push', { cwd: ROOT, stdio: 'pipe' });
        console.log('  ✅ Git');
        success++;
      }
      if (task === 'personality') {
        execSync('node scripts/personality-check.js before', { cwd: ROOT, stdio: 'pipe' });
        console.log('  ✅ 人格值');
        success++;
      }
      if (task === 'theory') {
        execSync('node scripts/heartflow-integrated-upgrade.js', { cwd: ROOT, stdio: 'pipe' });
        console.log('  ✅ 理论整合');
        success++;
      }
    } catch (e) {
      console.log(`  ❌ ${task}: ${e.message.split('\n')[0]}`);
    }
  }
  
  return { success, total: needs.length };
}

// ============================================================================
// 日志记录
// ============================================================================

function log(result) {
  const dir = path.dirname(LOG);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  const line = `[${Date.now()}] ${result.success}/${result.total} OK\n`;
  fs.appendFileSync(LOG, line);
}

// ============================================================================
// 主流程
// ============================================================================

function main() {
  const start = Date.now();
  
  console.log('═══════════════════════════════════════════════');
  console.log('   HeartFlow Smart Evolution v3.0');
  console.log('═══════════════════════════════════════════════');
  
  // 1. 思考（觉醒检查）
  think();
  
  // 2. 分析（逻辑识别需求）
  const needs = analyze();
  console.log(`\n🔍 识别：${needs.length} 项`);
  
  // 3. 升级（精简执行）
  const result = upgrade(needs);
  
  // 4. 日志
  log(result);
  
  // 5. 汇报（精简）
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n⏱️  耗时：${duration}s`);
  console.log('═══════════════════════════════════════════════\n');
  
  return result;
}

if (require.main === module) main();
module.exports = { main, analyze, upgrade };
