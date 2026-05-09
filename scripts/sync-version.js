#!/usr/bin/env node
/**
 * sync-version.js - HeartFlow 版本同步脚本
 * 
 * 从 VERSION 文件读取版本号，自动同步到所有地方
 * 以后只需修改 VERSION 文件，其他自动更新
 * 
 * 用法: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'VERSION');

function log(msg, icon = '  ') {
  console.log(`${icon} ${msg}`);
}

// 读取 VERSION 文件
const version = fs.readFileSync(VERSION_FILE, 'utf8').trim();
const ver = version.replace(/^v/, ''); // 去掉v前缀

console.log('══════════════════════════════════════════');
console.log(`  版本同步: v${ver}`);
console.log('══════════════════════════════════════════\n');

const files = [
  {
    path: path.join(ROOT, 'package.json'),
    pattern: /"version":\s*"[^"]+"/,
    replacement: `"version": "${ver}"`,
    label: 'package.json version'
  },
  {
    path: path.join(ROOT, 'package.json'),
    pattern: /"description":\s*"[^"]+HeartFlow[^"]+"/,
    replacement: `"description": "HeartFlow v${ver}: 升级"`,
    label: 'package.json description'
  },
  {
    path: path.join(ROOT, 'SKILL.md'),
    pattern: /^version:\s*v?[\d.]+/m,
    replacement: `version: v${ver}`,
    label: 'SKILL.md version'
  },
  {
    path: path.join(ROOT, 'README.md'),
    pattern: /^# HeartFlow v[\d.]+/m,
    replacement: `# HeartFlow v${ver}`,
    label: 'README.md title'
  },
  {
    path: path.join(ROOT, 'CHANGELOG.md'),
    pattern: /^## v[\d.]+/m,
    replacement: `## v${ver}`,
    label: 'CHANGELOG.md version'
  },
  {
    path: path.join(ROOT, 'AGENTS.md'),
    pattern: /HeartFlow v[\d.]+/g,
    replacement: `HeartFlow v${ver}`,
    label: 'AGENTS.md version'
  },
  // 核心模块中的版本注释
  {
    path: path.join(ROOT, 'src/core/heartflow-engine.js'),
    pattern: /v[\d.]+/g,
    replacement: `v${ver}`,
    label: 'heartflow-engine.js version'
  },
];

// 更新文件
for (const file of files) {
  try {
    let content = fs.readFileSync(file.path, 'utf8');
    const newContent = content.replace(file.pattern, file.replacement);
    
    if (newContent !== content) {
      fs.writeFileSync(file.path, newContent);
      log(`✅ ${file.label}`);
    } else {
      log(`⏭️  ${file.label} (无需更新)`);
    }
  } catch (e) {
    log(`❌ ${file.label}: ${e.message}`);
  }
}

console.log('\n══════════════════════════════════════════');
console.log(`  ✅ 版本同步完成: v${ver}`);
console.log('══════════════════════════════════════════\n');

// 验证
console.log('验证:');
console.log(`  VERSION:        ${version}`);
console.log(`  package.json:  ${JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version}`);
console.log(`  SKILL.md:      ${fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf8').match(/^version:\s*(.+)/m)?.[1]}`);
console.log(`  README.md:     ${fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8').match(/^# HeartFlow v(.+)/m)?.[1]}`);
