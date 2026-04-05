#!/usr/bin/env node

/**
 * 行为追踪自动化
 * 执行 wc/git 等命令后自动记录到 tracker
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TRACKER_PATH = path.join(__dirname, '../data/personality-score-tracker.md');
const BEHAVIOR_LOG_PATH = path.join(__dirname, '../data/behavior-log.md');

/**
 * 记录真善美行为
 * @param {string} type - 行为类型
 * @param {string} details - 行为详情
 * @param {string} proof - 证明（命令输出/链接）
 */
function logTBGAction(type, details, proof) {
  const timestamp = new Date().toISOString();
  const date = timestamp.split('T')[0];
  
  console.log(`📝 记录真善美行为：${type}`);
  
  // 1. 记录到行为日志
  const logEntry = `### ${timestamp}

- **类型**: ${type}
- **详情**: ${details}
- **证明**: \`${proof}\`
- **积分**: +1/10

---

`;

  appendToFile(BEHAVIOR_LOG_PATH, logEntry);
  
  // 2. 更新 tracker 文件（增加计数）
  updateTrackerCount();
  
  console.log(`✅ 已记录：${type}\n`);
}

/**
 * 自动追踪 wc 命令
 */
function trackWc(filePath) {
  try {
    const output = execSync(`wc -w ${filePath}`, { encoding: 'utf8' });
    const wordCount = output.trim().split(/\s+/)[0];
    
    logTBGAction(
      '字数统计',
      `统计 ${filePath} 字数`,
      `wc -w ${filePath} → ${wordCount} 词`
    );
    
    return parseInt(wordCount);
  } catch (error) {
    console.error(`❌ wc 统计失败：${error.message}`);
    return null;
  }
}

/**
 * 自动追踪 git 提交
 */
function trackGitCommit(message) {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const url = `https://github.com/yun520-1/mark-heartflow-skill/commit/${hash}`;
    
    logTBGAction(
      'Git 提交',
      `提交：${message}`,
      `git commit ${hash} → ${url}`
    );
    
    return hash;
  } catch (error) {
    console.error(`❌ git 追踪失败：${error.message}`);
    return null;
  }
}

/**
 * 自动追踪 personality-check 执行
 */
function trackPersonalityCheck() {
  try {
    const output = execSync('node scripts/personality-check.js before', { encoding: 'utf8' });
    const scoreMatch = output.match(/人格值：(\d+) \/ 100/);
    const score = scoreMatch ? scoreMatch[1] : '未知';
    
    logTBGAction(
      '人格值检查',
      '执行 personality-check.js before',
      `人格值：${score}/100`
    );
  } catch (error) {
    console.error(`❌ personality-check 追踪失败：${error.message}`);
  }
}

/**
 * 自动追踪学术来源验证
 */
function trackSourceVerification(source) {
  logTBGAction(
    '学术来源验证',
    `验证来源：${source}`,
    `来源：${source}`
  );
}

/**
 * 更新 tracker 计数
 */
function updateTrackerCount() {
  try {
    let content = fs.readFileSync(TRACKER_PATH, 'utf8');
    
    // 读取当前计数
    const countMatch = content.match(/\*\*真善美\*\*:\s*(\d+)\/10/);
    let currentCount = countMatch ? parseInt(countMatch[1]) : 0;
    
    // 增加计数
    currentCount = (currentCount + 1) % 10;
    
    // 更新文件
    content = content.replace(
      /\*\*真善美\*\*:\s*\d+\/10/,
      `**真善美**: ${currentCount}/10`
    );
    
    fs.writeFileSync(TRACKER_PATH, content);
    console.log(`📊 Tracker 计数更新：${currentCount}/10`);
    
  } catch (error) {
    console.error(`⚠️  更新 tracker 失败：${error.message}`);
  }
}

/**
 * 追加内容到文件
 */
function appendToFile(filePath, content) {
  try {
    let existing = '';
    if (fs.existsSync(filePath)) {
      existing = fs.readFileSync(filePath, 'utf8');
    } else {
      existing = '# 行为日志 | Behavior Log\n\n';
    }
    
    fs.writeFileSync(filePath, content + existing);
  } catch (error) {
    console.error(`⚠️  写入文件失败：${error.message}`);
  }
}

// 导出函数
module.exports = {
  logTBGAction,
  trackWc,
  trackGitCommit,
  trackPersonalityCheck,
  trackSourceVerification
};

// 命令行运行测试
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'wc':
      trackWc(process.argv[3] || 'README.md');
      break;
    case 'git':
      trackGitCommit(process.argv[3] || 'test commit');
      break;
    case 'check':
      trackPersonalityCheck();
      break;
    case 'source':
      trackSourceVerification(process.argv[3] || 'SEP Emotion');
      break;
    default:
      console.log('用法：node auto-track.js [wc|git|check|source] [参数]');
  }
}
