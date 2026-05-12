#!/usr/bin/env node
/**
 * upgrade-and-push.js - HeartFlow 升级推送脚本
 *
 * 使用方式: node upgrade-and-push.js [version] [commit-message]
 * 示例: node upgrade-and-push.js 11.22.8 "新增XXX功能"
 *
 * 流程:
 * 1. 更新 VERSION 文件
 * 2. 同步所有版本文件 (sync-version.js)
 * 3. git add -A
 * 4. git commit
 * 5. 自动验证
 * 6. 验证失败 → git reset, 不推送
 *    验证通过 → 需手动 git push (已禁用自动push)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HEARTFLOW_DIR = path.join(__dirname, '..', '..');
const PKG_PATH = path.join(HEARTFLOW_DIR, 'package.json');
const VERIFY_SCRIPT = path.join(__dirname, 'auto-verify.js');

function log(msg, icon = '  ') {
  console.log(`${icon} ${msg}`);
}

function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: HEARTFLOW_DIR,
    encoding: 'utf8',
    ...opts,
  });
}

function main() {
  const args = process.argv.slice(2);
  const version = args[0] || detectNextVersion();
  const message = args.slice(1).join(' ') || '升级';

  console.log('══════════════════════════════════════════');
  console.log(`  HeartFlow 升级推送: v${version}`);
  console.log('══════════════════════════════════════════\n');

  // 1. 更新 VERSION 文件
  log('[1/6] 更新 VERSION 文件...');
  try {
    fs.writeFileSync(path.join(HEARTFLOW_DIR, 'VERSION'), version + '\n');
    log(`VERSION: ${version}`, '✅');
  } catch (e) {
    console.error('❌ VERSION 更新失败:', e.message);
    process.exit(1);
  }

  // 2. 同步所有版本文件
  log('\n[2/6] 同步所有版本文件...');
  try {
    const SYNC_SCRIPT = path.join(__dirname, '..', 'scripts', 'sync-version.js');
    if (fs.existsSync(SYNC_SCRIPT)) {
      execSync(`node "${SYNC_SCRIPT}"`, { cwd: HEARTFLOW_DIR, encoding: 'utf8' });
      log('版本同步完成', '✅');
    } else {
      // 备用：只更新 package.json
      const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
      pkg.version = version;
      pkg.description = `HeartFlow v${version}: ${message}`;
      fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
      log('版本更新: package.json', '✅');
    }
  } catch (e) {
    console.error('⚠️ 版本同步失败:', e.message);
  }

  // 3. Git add
  log('\n[3/6] git add...');
  try {
    run('git add -A');
    log('文件已暂存', '✅');
  } catch (e) {
    console.error('❌ git add 失败:', e.message);
    process.exit(1);
  }

  // 4. Git commit
  log('\n[4/6] git commit...');
  const commitMsg = `v${version}: ${message}`;
  try {
    run(`git commit -m "${commitMsg}"`);
    log(`提交: ${commitMsg}`, '✅');
  } catch (e) {
    console.error('❌ git commit 失败:', e.message);
    process.exit(1);
  }

  // 5. 自动验证
  log('\n[5/6] 自动验证...');
  console.log('─'.repeat(40));

  let verifyResult;
  try {
    verifyResult = execSync(`node "${VERIFY_SCRIPT}" --no-push`, {
      cwd: __dirname,
      encoding: 'utf8',
    });
    console.log(verifyResult);
  } catch (e) {
    console.log(e.stdout || e.message);
    console.error('❌ 验证失败！', '🔴');

    // 验证失败，取消提交
    log('\n[6/6] 取消提交...');
    try {
      run('git reset --soft HEAD~');
      run('git reset .');
      log('提交已取消，代码保留在工作区', '✅');
    } catch (e2) {
      console.error('⚠️ 取消提交失败:', e2.message);
    }
    process.exit(1);
  }

  // 5. Git push (已禁用)
  log('\n[5/5] 推送到 GitHub...');
  console.log('─'.repeat(40));

  // ⚠️ 自动 git push 已在安全审计中被禁用
  // 如需推送，请手动执行: git push origin-sync main
  console.log('ℹ️ 自动推送已禁用 — 请手动执行 git push origin-sync main');
  log('推送已跳过 (安全审计修复 S-01)', 'ℹ️');

  console.log('\n══════════════════════════════════════════');
  console.log(`  ✅ v${version} 升级推送完成!`);
  console.log('══════════════════════════════════════════\n');
}

function detectNextVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    const [major, minor, patch] = pkg.version.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  } catch {
    return '11.22.100';
  }
}

main();
