#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PACKAGE_FILE = path.join(ROOT, 'package.json');

function syncFromVersion(version) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf-8'));
  if (pkg.version !== version) {
    pkg.version = version;
    fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Updated package.json →', version);
  } else {
    console.log('package.json already at', version);
  }
  console.log('Version sync complete:', version);
}

// 优先从 VERSION 文件读取
const vf = path.join(ROOT, 'VERSION');
if (fs.existsSync(vf)) {
  const v = fs.readFileSync(vf, 'utf-8').trim();
  console.log('Source version (from VERSION file):', v);
  syncFromVersion(v);
  process.exit(0);
}

// 兜底：从 version.js 读取
const VERSION_FILE = path.join(ROOT, 'src', 'core', 'version.js');
const versionContent = fs.readFileSync(VERSION_FILE, 'utf-8');
const match = versionContent.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
if (match) {
  console.log('Source version (from version.js):', match[1]);
  syncFromVersion(match[1]);
} else {
  console.error('ERROR: Cannot find version');
  process.exit(1);
}
