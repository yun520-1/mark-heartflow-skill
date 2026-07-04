#!/usr/bin/env node
// sync-version.js — 将版本号从 src/core/version.js 同步到其他文件
// 用法: node scripts/sync-version.js
// 在 prepublishOnly 中自动调用

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'src', 'core', 'version.js');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

// 从 version.js 读取版本号（唯一真相源）
const versionContent = fs.readFileSync(VERSION_FILE, 'utf-8');
const match = versionContent.match(/const VERSION = '([^']+)'/);
if (!match) {
  console.error('ERROR: Cannot find version in src/core/version.js');
  process.exit(1);
}
const version = match[1];
console.log('Source version:', version);

// 同步到 package.json
const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
if (pkg.version !== version) {
  pkg.version = version;
  fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
  console.log('Updated package.json →', version);
} else {
  console.log('package.json already at', version);
}

console.log('Version sync complete:', version);
