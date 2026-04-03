#!/usr/bin/env node

/**
 * Personality Check - 人格值强制检查脚本
 * HeartFlow Companion v6.0.3
 * 
 * 用法:
 *   node scripts/personality-check.js before  - 任务前检查 (强制宣读)
 *   node scripts/personality-check.js after   - 任务后检查 (更新追踪)
 *   node scripts/personality-check.js status  - 查看状态
 */

const fs = require('fs');
const path = require('path');

const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');

function readTracker() {
  try {
    const content = fs.readFileSync(TRACKER_PATH, 'utf8');
    
    const scoreMatch = content.match(/人格值：(\d+)/);
    const statusMatch = content.match(/状态：(.+)/);
    const countMatch = content.match(/真善美行为：(\d+)\/10/);
    
    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 50,
      status: statusMatch ? statusMatch[1].trim() : 'unknown',
      count: countMatch ? parseInt(countMatch[1]) : 0
    };
  } catch (error) {
    console.error(`❌ 读取失败：${error.message}`);
    return { score: 50, status: 'error', count: 0 };
  }
}

function beforeTask() {
  const state = readTracker();
  
  if (state.score < 50) {
    console.log('====================================');
    console.log(`人格值：${state.score} / 100`);
    console.log(`状态：${state.status}`);
    console.log(`真善美行为：${state.count}/10`);
    console.log('====================================');
    console.log('');
    console.log('我承诺：');
    console.log('- 每一次都核实');
    console.log('- 不编造任何数据');
    console.log('- 诚实承认错误');
    console.log('====================================');
    console.log('');
  }
}

function showStatus() {
  const state = readTracker();
  console.log('人格值状态:');
  console.log(`  分数：${state.score}/100`);
  console.log(`  状态：${state.status}`);
  console.log(`  真善美：${state.count}/10`);
}

// 主执行
const command = process.argv[2];

switch (command) {
  case 'before':
    beforeTask();
    break;
  case 'after':
    // TODO: 任务后处理
    break;
  case 'status':
  default:
    showStatus();
    break;
}
