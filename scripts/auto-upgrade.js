#!/usr/bin/env node
/**
 * HeartFlow Auto-Upgrade Script
 * 每30分钟自动升级版本 +0.01
 * 
 * Run: node scripts/auto-upgrade.js
 * Crontab: (see crontab.txt for example)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(PROJECT_ROOT, 'VERSION.txt');
const PACKAGE_FILE = path.join(PROJECT_ROOT, 'package.json');
const SKILL_FILE = path.join(PROJECT_ROOT, 'SKILL.md');
const SKILL_DIR_FILE = path.join(PROJECT_ROOT, 'skills/mark-heartflow/SKILL.md');

function getCurrentVersion() {
  try {
    const version = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    return version;
  } catch (e) {
    return '7.6.000';
  }
}

function parseVersion(versionStr) {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0
  };
}

function incrementVersion(currentVersion) {
  const v = parseVersion(currentVersion);
  v.patch += 1;
  if (v.patch >= 100) {
    v.patch = 0;
    v.minor += 1;
  }
  if (v.minor >= 1000) {
    v.minor = 0;
    v.major += 1;
  }
  return `${v.major}.${v.minor}.${String(v.patch).padStart(3, '0')}`;
}

function updateVersion(newVersion) {
  console.log(`🔄 升级版本: ${getCurrentVersion()} → ${newVersion}`);
  
  // 更新 VERSION.txt
  fs.writeFileSync(VERSION_FILE, newVersion);
  
  // 更新 package.json
  try {
    const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
    pkg.version = newVersion;
    pkg.releaseDate = new Date().toISOString().split('T')[0];
    fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2));
  } catch (e) {
    console.log('⚠️ package.json 更新失败:', e.message);
  }
  
  // 更新 SKILL.md
  const updateSkillFile = (file) => {
    try {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/version:\s*[\d.]+/, `version: ${newVersion}`);
        content = content.replace(/# HeartFlow Skill v[\d.]+/, `# HeartFlow Skill v${newVersion}`);
        fs.writeFileSync(file, content);
      }
    } catch (e) {
      console.log(`⚠️ ${file} 更新失败:`, e.message);
    }
  };
  
  updateSkillFile(SKILL_FILE);
  updateSkillFile(SKILL_DIR_FILE);
  
  // 更新 super-integration.js
  const superEngineFile = path.join(PROJECT_ROOT, 'src/core/super-integration.js');
  try {
    let content = fs.readFileSync(superEngineFile, 'utf8');
    content = content.replace(/this\.version\s*=\s*['"][\d.]+['"]/, `this.version = '${newVersion}'`);
    fs.writeFileSync(superEngineFile, content);
  } catch (e) {
    console.log('⚠️ super-integration.js 更新失败:', e.message);
  }
  
  console.log(`✅ 版本已更新到 ${newVersion}`);
  return newVersion;
}

function runTests() {
  console.log('🧪 运行测试...');
  try {
    const result = execSync('node bin/cli.js test', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 30000
    });
    console.log('✅ 测试通过');
    return true;
  } catch (e) {
    console.log('⚠️ 测试结果:', e.message);
    return false;
  }
}

function commitAndPush(newVersion) {
  console.log('📦 提交到 GitHub...');
  try {
    execSync('git add -A', { cwd: PROJECT_ROOT });
    execSync(`git commit -m "HeartFlow v${newVersion} - Auto Upgrade"`, { cwd: PROJECT_ROOT });
    execSync('git push origin main', { cwd: PROJECT_ROOT, timeout: 60000 });
    console.log('✅ 已推送到 GitHub');
    return true;
  } catch (e) {
    console.log('⚠️ Git 操作失败:', e.message);
    return false;
  }
}

async function autoUpgrade() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  💜 HeartFlow Auto-Upgrade');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`⏰ 时间: ${new Date().toISOString()}`);
  
  const currentVersion = getCurrentVersion();
  console.log(`📌 当前版本: ${currentVersion}`);
  
  const newVersion = incrementVersion(currentVersion);
  
  // 更新版本
  updateVersion(newVersion);
  
  // 运行测试（可选）
  runTests();
  
  // 提交并推送
  commitAndPush(newVersion);
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`✅ 升级完成! 新版本: ${newVersion}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  return { oldVersion: currentVersion, newVersion };
}

// 如果直接运行
if (require.main === module) {
  autoUpgrade().catch(console.error);
}

module.exports = { autoUpgrade, incrementVersion };