#!/usr/bin/env node
/**
 * upgrade-and-push.js - HeartFlow 升级推送脚本
 * 
 * 使用方式: node upgrade-and-push.js [version] [commit-message]
 * 示例: node upgrade-and-push.js 11.22.8 "新增XXX功能"
 * 
 * 流程:
 * 1. 更新 package.json 版本
 * 2. git add -A
 * 3. git commit
 * 4. 自动验证
 * 5. 验证通过 → git push
 * 6. 验证失败 → git reset, 不推送
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

  // 1. 更新版本
  log('[1/5] 更新 package.json...');
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
    pkg.version = version;
    pkg.description = `HeartFlow v${version}: ${message}`;
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n');
    log(`版本更新: ${pkg.version}`, '✅');
  } catch (e) {
    console.error('❌ 版本更新失败:', e.message);
    process.exit(1);
  }

  // 2. Git add
  log('\n[2/5] git add...');
  try {
    run('git add -A');
    log('文件已暂存', '✅');
  } catch (e) {
    console.error('❌ git add 失败:', e.message);
    process.exit(1);
  }

  // 3. Git commit
  log('\n[3/5] git commit...');
  const commitMsg = `v${version}: ${message}`;
  try {
    run(`git commit -m "${commitMsg}"`);
    log(`提交: ${commitMsg}`, '✅');
  } catch (e) {
    console.error('❌ git commit 失败:', e.message);
    process.exit(1);
  }

  // 4. 自动验证
  log('\n[4/5] 自动验证...');
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
    log('\n[5/5] 取消提交...');
    try {
      run('git reset --soft HEAD~');
      run('git reset .');
      log('提交已取消，代码保留在工作区', '✅');
    } catch (e2) {
      console.error('⚠️ 取消提交失败:', e2.message);
    }
    process.exit(1);
  }

  // 5. Git push
  log('\n[5/5] 推送到 GitHub...');
  console.log('─'.repeat(40));
  
  // 禁用 pre-push hook 避免递归
  const hookPath = path.join(HEARTFLOW_DIR, '.git', 'hooks', 'pre-push');
  let hookBackup = null;
  
  if (fs.existsSync(hookPath)) {
    hookBackup = hookPath + '.backup';
    fs.renameSync(hookPath, hookBackup);
  }
  
  try {
    run('git push origin-sync main');
    log('推送成功!', '✅');
  } catch (e) {
    console.error('❌ 推送失败:', e.message);
  } finally {
    // 恢复 hook
    if (hookBackup && fs.existsSync(hookBackup)) {
      fs.renameSync(hookBackup, hookPath);
    }
  }

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
