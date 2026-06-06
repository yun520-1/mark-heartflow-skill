#!/usr/bin/env node
/**
 * 心虫模块僵尸审计器
 * 1. 从入口 heartflow.js + heartflow-engine.js + 顶层 require 文件开始追踪
 * 2. 解析所有 require/import，构建传递闭包 R
 * 3. 列出 src/ 下不在 R 的文件
 * 4. 识别 stub（空 module.exports / 只有 placeholder）
 */

const fs = require('fs');
const path = require('path');

const ROOT = '__PROJECT_ROOT__';
const SRC = path.join(ROOT, 'src');

// 入口：heartflow.js + 顶层 test-boot.js 引用的
// 心虫的实际启动路径是：test-boot.js -> heartflow.js -> 传递闭包
const ENTRY_POINTS = [
  path.join(SRC, 'core/heartflow.js'),
  // 还可能从 SKILL.md 里有别的入口，先只从主入口
];

// resolve a require() argument relative to the importer's directory
function resolvePath(importer, spec) {
  // skip node built-ins and absolute module names not in src/
  if (spec.startsWith('node:') || fs.existsSync(spec)) {
    return null; // external
  }
  // relative require
  let base = path.resolve(path.dirname(importer), spec);
  // try .js, .json, /index.js
  const candidates = [
    base,
    base + '.js',
    base + '.json',
    path.join(base, 'index.js'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return c;
    }
  }
  return null;
}

// regex to match require(...) and import ... from ...
const RE_REQUIRE = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_IMPORT_FROM = /import\s+(?:[\w*\s{},]+\s+from\s+)?['"]([^'"]+)['"]/g;
const RE_IMPORT_DYNAMIC = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function extractDeps(file) {
  const src = fs.readFileSync(file, 'utf-8');
  const deps = new Set();
  for (const re of [RE_REQUIRE, RE_IMPORT_FROM, RE_IMPORT_DYNAMIC]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const spec = m[1];
      // skip node built-ins
      if (spec.startsWith('node:')) continue;
      // skip absolute non-file modules (no path separator at start or .. or .)
      if (!spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('\\')) {
        // could be a package in node_modules; skip unless it looks like local
        // we keep it but resolve will return null typically
        const resolved = resolvePath(file, spec);
        if (resolved) deps.add(resolved);
        continue;
      }
      const resolved = resolvePath(file, spec);
      if (resolved) deps.add(resolved);
    }
  }
  return deps;
}

// ── BFS build closure
const reachable = new Set();
const queue = [...ENTRY_POINTS];
for (const e of queue) reachable.add(e);

let guard = 0;
while (queue.length > 0 && guard++ < 10000) {
  const cur = queue.shift();
  let deps;
  try {
    deps = extractDeps(cur);
  } catch (e) {
    console.error(`[warn] read fail: ${cur} : ${e.message}`);
    continue;
  }
  for (const d of deps) {
    if (!reachable.has(d)) {
      reachable.add(d);
      queue.push(d);
    }
  }
}

// ── List all .js files in src/
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}
const allJs = walk(SRC);
allJs.sort();

// ── Zombies
const zombies = allJs.filter(f => !reachable.has(f));

// ── Stub detection
function detectStub(file) {
  let src;
  try { src = fs.readFileSync(file, 'utf-8'); } catch (e) { return { stub: true, type: 'unreadable' }; }
  // strip comments to avoid false positive
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
  // check module.exports
  const re = /module\.exports\s*=/g;
  const matches = [...code.matchAll(re)];
  if (matches.length === 0) {
    // no module.exports at all → silent module
    return { stub: true, type: 'no_module_exports' };
  }
  // last match
  const lastIdx = matches[matches.length - 1].index;
  const tail = code.slice(lastIdx).slice(0, 400);
  // empty object/class
  if (/module\.exports\s*=\s*\{\s*\}\s*;?\s*$/.test(tail) ||
      /module\.exports\s*=\s*class\s+\w+\s*\{\s*\}\s*;?\s*$/.test(tail) ||
      /module\.exports\s*=\s*function\s*\(\s*\)\s*\{\s*\}\s*;?\s*$/.test(tail)) {
    return { stub: true, type: 'empty_object/class/function' };
  }
  // placeholder
  if (/module\.exports\s*=\s*\{\s*\/\*\s*placeholder/i.test(tail) ||
      /module\.exports\s*=\s*\[\s*\]\s*;?\s*$/.test(tail) ||
      /TODO|FIXME|placeholder|not implemented/i.test(tail.slice(0, 200))) {
    return { stub: true, type: 'placeholder' };
  }
  return { stub: false };
}

const halfZombies = [];
for (const f of reachable) {
  // skip heartflow itself
  if (f === ENTRY_POINTS[0]) continue;
  const info = detectStub(f);
  if (info.stub) {
    halfZombies.push({ file: f, ...info });
  }
}

// ── Helper: line count
function locOf(file) {
  try { return fs.readFileSync(file, 'utf-8').split('\n').length; }
  catch (e) { return 0; }
}
function mtimeOf(file) {
  try {
    const s = fs.statSync(file);
    return s.mtime.toISOString().slice(0, 10);
  } catch (e) { return '?'; }
}

// ── SKILL.md / README.md mention
const SKILL_MD = fs.readFileSync(path.join(ROOT, 'SKILL.md'), 'utf-8');
const README_MD = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');

function basename(file) {
  return path.basename(file, '.js');
}
function mentioned(file, doc) {
  const base = basename(file);
  if (!base || base.length < 4) return false;
  // require word boundary
  return new RegExp(`\\b${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(doc);
}

// ── Output JSON
const result = {
  reachable: Array.from(reachable).sort(),
  zombies: zombies.map(f => ({
    path: path.relative(ROOT, f),
    mtime: mtimeOf(f),
    loc: locOf(f),
    skillMentioned: mentioned(f, SKILL_MD),
    readmeMentioned: mentioned(f, README_MD),
  })),
  halfZombies: halfZombies.map(h => ({
    path: path.relative(ROOT, h.file),
    stubType: h.type,
  })),
  totals: {
    totalJs: allJs.length,
    reachable: reachable.size,
    zombies: zombies.length,
    halfZombies: halfZombies.length,
  },
};

const out = path.join(ROOT, 'references/audit-result.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`Wrote ${out}`);
console.log(`total=${result.totals.totalJs} reachable=${result.totals.reachable} zombies=${result.totals.zombies} halfZombies=${result.totals.halfZombies}`);
