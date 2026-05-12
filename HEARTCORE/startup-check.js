/**
 * Startup Check — 启动诊断
 * 版本、依赖、数据目录、权限
 * @version v0.12.50
 */
'use strict';

const path = require('path');
const fs = require('fs');

function getRoot() { return path.resolve(__dirname, '..'); }

const VERSION_FILE = path.join(getRoot(), 'VERSION');
const PKG_FILE = path.join(getRoot(), 'package.json');
const ID_FILE = path.join(getRoot(), 'CORE_IDENTITY.md');
const SKILL_FILE = path.join(getRoot(), 'SKILL.md');
const DATA_DIR = path.join(getRoot(), 'data');

class StartupCheck {
  static run() {
    const issues = [];
    const info = {};

    // VERSION 检查
    try {
      info.version = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    } catch {
      issues.push({ item: 'VERSION', issue: '文件不存在' });
      info.version = 'unknown';
    }

    // package.json 检查
    try {
      const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));
      info.packageName = pkg.name;
      info.nodeVersion = process.version;
    } catch {
      issues.push({ item: 'package.json', issue: '文件不存在或JSON损坏' });
    }

    // CORE_IDENTITY 检查
    if (!fs.existsSync(ID_FILE)) {
      issues.push({ item: 'CORE_IDENTITY.md', issue: '核心身份文件缺失' });
    } else {
      info.identitySize = fs.statSync(ID_FILE).size;
    }

    // SKILL.md 检查
    if (!fs.existsSync(SKILL_FILE)) {
      issues.push({ item: 'SKILL.md', issue: '技能入口文件缺失' });
    }

    // data 目录检查
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const testFile = path.join(DATA_DIR, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      info.dataWritable = true;
    } catch (e) {
      issues.push({ item: 'data目录', issue: `不可写: ${e.message}` });
      info.dataWritable = false;
    }

    // data/memory 目录
    try {
      const memDir = path.join(DATA_DIR, 'memory');
      if (!fs.existsSync(memDir)) fs.mkdirSync(memDir, { recursive: true });
      ['hot.json', 'warm.json', 'cold.json'].forEach(f => {
        const fp = path.join(memDir, f);
        if (!fs.existsSync(fp)) fs.writeFileSync(fp, '[]');
      });
      info.memoryReady = true;
    } catch (e) {
      issues.push({ item: 'memory初始化', issue: e.message });
      info.memoryReady = false;
    }

    // data/evolution 目录
    try {
      const evoDir = path.join(DATA_DIR, 'evolution');
      if (!fs.existsSync(evoDir)) fs.mkdirSync(evoDir, { recursive: true });
      const refFile = path.join(evoDir, 'reflexion-patterns.json');
      if (!fs.existsSync(refFile)) fs.writeFileSync(refFile, '[]');
    } catch {}

    return {
      status: issues.length === 0 ? 'READY' : 'ISSUES',
      issues,
      info,
      timestamp: Date.now(),
    };
  }
}

if (require.main === module) {
  const result = StartupCheck.run();
  console.log(`[StartupCheck] 状态: ${result.status}`);
  if (result.issues.length > 0) {
    console.log('问题:');
    result.issues.forEach(i => console.log(`  - ${i.item}: ${i.issue}`));
  }
  console.log('信息:', JSON.stringify(result.info, null, 2));
}

module.exports = { StartupCheck };
