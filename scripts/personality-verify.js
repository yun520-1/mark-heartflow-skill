#!/usr/bin/env node

/**
 * Personality Verify - 数字强制核实脚本
 * HeartFlow Companion v6.0.3
 * 
 * 用法:
 *   node scripts/personality-verify.js word_count <file>
 *   node scripts/personality-verify.js file_count <dir>
 *   node scripts/personality-verify.js version <dir>
 *   node scripts/personality-verify.js git_log <n>
 *   node scripts/personality-verify.js date
 *   node scripts/personality-verify.js git_status
 * 
 * 输出原始命令结果，不经过任何处理
 */

const { execSync } = require('child_process');

const COMMANDS = {
  'word_count': (target) => `wc -w ${target}`,
  'file_count': (target) => `find ${target} -type f | wc -l`,
  'version': (target) => `cat ${target}/package.json | grep version`,
  'git_log': (n) => `git log --oneline -${n}`,
  'date': () => 'date',
  'git_status': () => 'git status --short',
  'ls': (target) => `ls -la ${target}`,
  'cat': (target) => `cat ${target}`
};

function verify(type, target) {
  if (!COMMANDS[type]) {
    console.error(`❌ 不支持的核实类型：${type}`);
    console.error('支持的类型：word_count, file_count, version, git_log, date, git_status, ls, cat');
    process.exit(1);
  }

  const command = COMMANDS[type](target);

  try {
    const result = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    
    // 输出原始结果，不做任何处理
    console.log(result.trim());
    
    return result.trim();
  } catch (error) {
    console.error(`❌ 核实失败：${error.message}`);
    process.exit(1);
  }
}

// 主执行
const type = process.argv[2];
const target = process.argv[3];

if (!type) {
  console.error('用法：node personality-verify.js <type> [target]');
  console.error('类型：word_count, file_count, version, git_log, date, git_status, ls, cat');
  process.exit(1);
}

verify(type, target);
