#!/usr/bin/env node
/**
 * HeartFlow 版本同步脚本
 * 读取 VERSION 文件，+0.0.1，然后同步到所有引用位置
 * 
 * 用法: node scripts/sync-version.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readVersion() {
  return fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim();
}

function incVersion(v) {
  const parts = v.split('.');
  const patch = parseInt(parts[2] || '0') + 1;
  return `${parts[0]}.${parts[1]}.${patch}`;
}

function writeVersion(v) {
  fs.writeFileSync(path.join(ROOT, 'VERSION'), v + '\n');
  console.log(`[sync-version] VERSION → ${v}`);
}

function syncPackageJson(v) {
  const p = path.join(ROOT, 'package.json');
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  d.version = v;
  fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
  console.log(`[sync-version] package.json → ${v}`);
}

function syncSkillMd(v) {
  const p = path.join(ROOT, 'SKILL.md');
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/^version:\s*["']?[\d.]+["']?/m, `version: "${v}"`);
  fs.writeFileSync(p, c);
  console.log(`[sync-version] SKILL.md → ${v}`);
}

function syncHeartflowJs(v) {
  const p = path.join(ROOT, 'src/core/heartflow.js');
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/^const VERSION = '[\d.]+';/m, `const VERSION = '${v}';`);
  fs.writeFileSync(p, c);
  console.log(`[sync-version] heartflow.js → ${v}`);
}

const old = readVersion();
const next = incVersion(old);

writeVersion(next);
syncPackageJson(next);
syncSkillMd(next);
syncHeartflowJs(next);

console.log(`\n✅ 版本 ${old} → ${next}`);
