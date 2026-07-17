#!/usr/bin/env node
/**
 * HeartFlow — 缺失模块全量审计（F6）
 *
 * 消除错误源：UPGRADE_PLAN 指出旧审计脚本有 bug（误把 ./ 相对路径排除，
 * 结果"0 缺失"不可信）。本脚本按实际 require/import resolve 跑全量扫描，
 * 区分三类，输出可机读结论：
 *
 *   [A] PATH_WRONG  —— 文件真实存在但 require 路径写错（可自动修复，是错误源）
 *   [B] ORPHAN      —— 文件不存在且已被 try/catch 优雅降级（可选子系统占位，安全）
 *   [C] UNRESOLVED  —— 文件不存在且未在启动流程被 try/catch 包裹（真危险，需立即修）
 *
 * 退出码：
 *   0 = 无 [C] 类（安全，仅有可修复的路径错误或安全降级占位）
 *   1 = 发现 [C] 类（真实破坏性缺失，必须处理）
 *
 * 用法：node scripts/audit-missing-requires.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Node 内置模块（非相对/非绝对路径的 require 一律视为可 resolve，跳过审计）
const BUILTINS = new Set([
  'path', 'fs', 'os', 'crypto', 'events', 'url', 'net', 'dns', 'http', 'https',
  'stream', 'util', 'assert', 'buffer', 'child_process', 'querystring', 'zlib',
  'readline', 'tty', 'cluster', 'dgram', 'timers', 'tls', 'worker_threads',
  'string_decoder', 'perf_hooks', 'async_hooks', 'vm', 'repl', 'punycode',
]);

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

// 收集 src 下所有 .js
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
}

const files = [];
if (fs.existsSync(SRC)) walk(SRC, files);

const RE_ARROW = /const\s+_\w+\s*=\s*\(\)\s*=>\s*require\(\s*["']([^"']+)["']\s*\)/g;
const RE_TOP = /^\s*(?:const|let|var)\s+\w+\s*=\s*require\(\s*["']([^"']+)["']\s*\)/gm;
const RE_INLINE = /require\(\s*["']([^"']+)["']\s*\)/g;

// 判断文件真实存在（含 .js 后缀与 index.js）
function exists(spec, fromDir) {
  if (!spec.startsWith('.')) return null; // 非相对路径（node_modules），跳过
  const base = path.resolve(fromDir, spec);
  const cands = [base, base + '.js', path.join(base, 'index.js')];
  for (const c of cands) {
    try { fs.accessSync(c); return c; } catch (_) {}
  }
  return null;
}

const findings = [];
const seen = new Set();

// 预扫描：标记所有"惰性 getter 定义"和"lazy 注册"中的 spec（这些属于安全降级占位）
const lazySpecs = new Set();
for (const f of files) {
  let code = '';
  try { code = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
  const codeNoComments = code
    .split('\n')
    .map(line => {
      const ci = line.indexOf('//');
      return ci >= 0 ? line.slice(0, ci) : line;
    })
    .join('\n');
  const reArrow = /\(\)\s*=>\s*require\(\s*["']([^"']+)["']\s*\)/g;
  let mm;
  while ((mm = reArrow.exec(codeNoComments))) lazySpecs.add(f + '::' + mm[1]);
  // lazy 注册：形如 path: '../xxx/yyy.js'
  const reLazy = /lazy\s*:\s*true[^}]*?path\s*:\s*["']([^"']+)["']/g;
  while ((mm = reLazy.exec(codeNoComments))) lazySpecs.add(f + '::' + mm[1]);
}

for (const f of files) {
  let code = '';
  try { code = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
  // 剥离注释：块注释 /** */ 与行内 //
  const codeNoComments = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // 块注释
    .split('\n')
    .map(line => {
      const ci = line.indexOf('//');
      return ci >= 0 ? line.slice(0, ci) : line;
    })
    .join('\n');
  const specs = new Set();
  let m;
  while ((m = RE_ARROW.exec(codeNoComments))) specs.add(m[1]);
  while ((m = RE_TOP.exec(codeNoComments))) specs.add(m[1]);
  while ((m = RE_INLINE.exec(codeNoComments))) specs.add(m[1]);

  for (const spec of specs) {
    // 跳过 node 内置模块与非相对路径（node_modules 依赖由 npm audit 负责）
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
    const real = exists(spec, path.dirname(f));
    if (real) continue; // 能 resolve，跳过
    const key = f + '::' + spec;
    if (seen.has(key)) continue;
    seen.add(key);
    // 惰性 getter / lazy 注册 → 安全降级占位（无论文件是否存在）
    if (lazySpecs.has(f + '::' + spec)) {
      findings.push({ from: path.relative(ROOT, f), spec, kind: 'lazy' });
      continue;
    }
    findings.push({ from: path.relative(ROOT, f), spec });
  }
}

// 分类：非 lazy 的待分类引用做真实 require 探测
const classified = { A: [], B: [], C: [] };
for (const item of findings) {
  if (item.kind === 'lazy') { classified.B.push(item); continue; }
  const fromFile = path.join(ROOT, item.from);
  try {
    require(path.resolve(path.dirname(fromFile), item.spec));
    classified.A.push(item);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      const base = path.basename(item.spec);
      const alt = findByName(base);
      if (alt) classified.A.push({ ...item, actual: path.relative(ROOT, alt) });
      // 文件全仓库不存在：判断是否被 try/catch 包裹（安全降级）
      else if (isInTryCatch(fromFile, item.spec)) classified.B.push(item);
      else classified.C.push(item);
    } else {
      classified.B.push(item);
    }
  }
}

function findByName(basename) {
  // basename 形如 self-model.js 或 ./self-model
  const name = basename.replace(/^\.\//, '').replace(/\.js$/, '');
  let hit = null;
  for (const f of files) {
    const bn = path.basename(f).replace(/\.js$/, '');
    if (bn === name) { hit = f; break; }
  }
  return hit;
}

// 判断 spec 是否处在 try { ... } 块内（安全降级）：
// 从 spec 位置向前找最近的 try {，若其后到 spec 之间花括号未闭合，则判定在 try 内。
function isInTryCatch(file, spec) {
  try {
    const code = fs.readFileSync(file, 'utf8');
    const idx = code.indexOf(spec);
    if (idx < 0) return false;
    const before = code.slice(0, idx);
    const lastTry = before.lastIndexOf('try');
    if (lastTry < 0) return false;
    // 从 lastTry 起到 spec 之间，统计花括号平衡
    const seg = code.slice(lastTry, idx);
    let depth = 0;
    for (const ch of seg) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    // depth > 0 说明 try 块尚未闭合，spec 在 try 内
    return depth > 0;
  } catch (_) { return false; }
}

// 输出
console.log(`\n=== HeartFlow 缺失模块审计 ===`);
console.log(`扫描文件: ${files.length} | 待分类引用: ${findings.length}\n`);

if (classified.A.length) {
  console.log(`[A] 路径写错（可修复，错误源）: ${classified.A.length}`);
  classified.A.forEach(x => console.log(`  - ${x.from} require '${x.spec}' → 实际应在 '${x.actual}'`));
}
if (classified.B.length) {
  console.log(`\n[B] 孤儿占位（已优雅降级，安全）: ${classified.B.length}`);
  classified.B.slice(0, 20).forEach(x => console.log(`  - ${x.from} require '${x.spec}'`));
  if (classified.B.length > 20) console.log(`  ... 及其他 ${classified.B.length - 20} 个`);
}
if (classified.C.length) {
  console.log(`\n[C] 真实破坏性缺失（未降级）: ${classified.C.length} ⚠️`);
  classified.C.forEach(x => console.log(`  - ${x.from} require '${x.spec}'`));
}

console.log('');
if (classified.C.length > 0) {
  console.log('❌ 发现未降级缺失模块，必须处理');
  process.exit(1);
} else {
  console.log('✅ 无 [C] 类破坏性缺失（仅有可修复路径错误或安全降级占位）');
  process.exit(0);
}
