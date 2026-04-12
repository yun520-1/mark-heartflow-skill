#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_FILE = path.join(PROJECT_ROOT, 'package.json');
const VERSION_FILE = path.join(PROJECT_ROOT, 'VERSION.txt');

const newVersion = process.argv[2] || '8.0.1';

// 更新 package.json
const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE, 'utf8'));
pkg.version = newVersion;
pkg.releaseDate = new Date().toISOString().split('T')[0];
fs.writeFileSync(PACKAGE_FILE, JSON.stringify(pkg, null, 2));

// 更新 VERSION.txt
fs.writeFileSync(VERSION_FILE, newVersion);

console.log(`✅ 版本设置为 v${newVersion}`);
