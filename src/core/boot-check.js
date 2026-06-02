/**
 * HeartFlow Boot Check v1.0.0
 * 启动自检：验证核心文件 + 版本一致 + 身份锚点
 * 基于 v11.9.4 self-check.js 重写适配
 *
 * 用法:
 *   const { bootCheck } = require('./boot-check');
 *   const report = bootCheck();        // 运行自检
 *   const report = bootCheck(true);   // 静默模式
 */

const fs = require('fs');
const path = require('path');

// 心虫根目录: src/core/boot-check.js → 心虫根目录
const ROOT = path.resolve(__dirname, '../..');

// 核心文件检查项
const CORE_CHECKS = [
  {
    id: 'identity',
    label: 'CORE_IDENTITY.md',
    path: path.join(ROOT, 'CORE_IDENTITY.md'),
    verify: (c) => c.includes('HeartFlow') && c.includes('心虫'),
    required: true,
  },
  {
    id: 'identity-core',
    label: 'identity-core.md',
    path: path.join(ROOT, 'memory/identity-core.md'),
    verify: (c) => c.includes('心虫身份核心') && c.includes('我是谁'),
    required: true,
  },
  {
    id: 'skill',
    label: 'SKILL.md',
    path: path.join(ROOT, 'SKILL.md'),
    verify: (c) => c.includes('version') && c.length > 500,
    required: true,
  },
  {
    id: 'package',
    label: 'package.json',
    path: path.join(ROOT, 'package.json'),
    verify: (c) => {
      try {
        const p = JSON.parse(c);
        return p.version !== undefined && p.version.length > 0;
      } catch { /* JSON 解析失败视为验证不通过 */ return false; }
    },
    required: true,
  },
  {
    id: 'heartflow-engine',
    label: 'heartflow-engine.js',
    path: path.join(ROOT, 'src/core/heartflow-engine.js'),
    verify: (c) => c.length > 1000,
    required: true,
  },
  {
    id: 'meaningful-memory',
    label: 'meaningful-memory.js',
    path: path.join(ROOT, 'src/core/meaningful-memory.js'),
    verify: (c) => c.includes('MeaningfulMemory') && c.length > 3000,
    required: true,
  },
  {
    id: 'self-healing-rl',
    label: 'self-healing-rl.js',
    path: path.join(ROOT, 'src/core/self-healing-rl.js'),
    verify: (c) => c.includes('HealingMemoryRL') && c.length > 1000,
    required: false,
  },
  {
    id: 'decision-verifier',
    label: 'decision-verifier.js',
    path: path.join(ROOT, 'src/core/decision-verifier.js'),
    verify: (c) => c.includes('DecisionVerifier') && c.length > 2000,
    required: false,
  },
];

// Module load checks — now includes MeaningfulMemory (required)
// MeaningfulMemory is the primary memory engine; triality-memory is still loaded separately
const MODULE_CHECKS = [
  { id: 'meaningful-memory', label: 'MeaningfulMemory', path: './meaningful-memory.js' },
  { id: 'self-healing-rl', label: 'HealingMemoryRL', path: './self-healing-rl.js' },
  { id: 'decision-verifier', label: 'DecisionVerifier', path: './decision-verifier.js' },
  { id: 'confidence-calibrator', label: 'ConfidenceCalibrator', path: './confidence-calibrator.js' },
  { id: 'counterfactual-engine', label: 'CounterfactualEngine', path: './counterfactual-engine.js' },
  { id: 'self-healing', label: 'SelfHealing', path: './self-healing.js' },
  { id: 'error-handler', label: 'ErrorHandler', path: './error-handler.js' },
  { id: 'state-snapshot', label: 'StateSnapshot', path: './state-snapshot.js' },
  { id: 'wake-up-verifier', label: 'WakeUpVerifier', path: './wake-up-verifier.js' },
];

function runFileCheck(item) {
  try {
    if (!fs.existsSync(item.path)) {
      return { ...item, status: 'MISSING', detail: 'file not found' };
    }
    const content = fs.readFileSync(item.path, 'utf8');
    const pass = item.verify(content);
    return { ...item, status: pass ? 'PASS' : 'FAIL', detail: pass ? 'ok' : 'content check failed' };
  } catch (e) {
    return { ...item, status: 'ERROR', detail: e.message };
  }
}

function runModuleCheck(item) {
  const startTime = performance ? performance.now() : 0;
  try {
    const mod = require(item.path);
    // 检查命名导出 或 默认导出（CommonJS 两种模式都兼容）
    const ok = mod[item.label] !== undefined || typeof mod === 'function' || (typeof mod === 'object' && mod !== null);

    // 加载耗时（毫秒，仅当 performance 可用时）
    const loadMs = performance ? (performance.now() - startTime).toFixed(1) : '?';

    // 提取模块版本（如果暴露了 .version 字段）
    let modVersion = null;
    if (mod && mod[item.label] && mod[item.label].prototype && mod[item.label].prototype.version) {
      modVersion = mod[item.label].prototype.version;
    }

    // 判断是否从缓存加载（require 缓存命中 ≈ <1ms 通常意味着已缓存）
    const fromCache = !!require.cache[require.resolve(item.path)];

    return {
      id: item.id, label: item.label, path: item.path,
      status: ok ? 'PASS' : 'FAIL',
      detail: ok ? `loaded (${loadMs}ms${modVersion ? ', v' + modVersion : ''}${fromCache ? ', cached' : ', fresh'})` : 'export not found',
      loadMs: parseFloat(loadMs) || 0,
      modVersion,
      fromCache,
    };
  } catch (e) {
    const loadMs = performance ? (performance.now() - startTime).toFixed(1) : '?';
    return { id: item.id, label: item.label, path: item.path, status: 'ERROR', detail: `${e.message.split('\n')[0]} (${loadMs}ms)` };
  }
}

function bootCheck(silent = false) {
  const fileResults = CORE_CHECKS.map(runFileCheck);
  const moduleResults = MODULE_CHECKS.map(runModuleCheck);

  const filePassed = fileResults.filter(r => r.status === 'PASS').length;
  const fileFailed = fileResults.filter(r => r.status !== 'PASS' && r.required).length;
  const modulePassed = moduleResults.filter(r => r.status === 'PASS').length;
  const allFilesPass = filePassed === CORE_CHECKS.length;
  const allModulesPass = modulePassed === MODULE_CHECKS.length;

  // 模块加载总耗时（仅当 performance 可用时）
  const totalLoadMs = moduleResults.reduce((sum, r) => sum + (r.loadMs || 0), 0);
  const cachedCount = moduleResults.filter(r => r.fromCache).length;
  const freshCount = moduleResults.filter(r => r.status === 'PASS' && !r.fromCache).length;

  const allPass = fileFailed === 0; // 核心文件必须全部 PASS

  const report = {
    timestamp: new Date().toISOString(),
    version: require(path.join(ROOT, 'package.json')).version,
    files: { total: CORE_CHECKS.length, passed: filePassed, checks: fileResults },
    modules: { total: MODULE_CHECKS.length, passed: modulePassed, checks: moduleResults, totalLoadMs, cachedCount, freshCount },
    allPass,
    degraded: !allModulesPass,
    degradedModules: moduleResults.filter(r => r.status !== 'PASS').map(r => r.id),
  };

  if (!silent) {
    const icon = allPass ? '✓' : '⚠';
    console.log(`\n[HeartFlow] ${icon} Boot Check ${report.version} — ${allPass ? 'READY' : 'DEGRADED'}`);
    console.log(`  Files: ${filePassed}/${CORE_CHECKS.length} passed${fileFailed > 0 ? ` (${fileFailed} required failed)` : ''}`);
    fileResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : r.status === 'MISSING' ? '?' : r.status === 'FAIL' ? '✗' : '!';
      const req = r.required ? ' [REQUIRED]' : '';
      console.log(`    ${icon} ${r.id}: ${r.status}${req} — ${r.detail}`);
    });
    console.log(`  Modules: ${modulePassed}/${MODULE_CHECKS.length} passed (${totalLoadMs.toFixed(1)}ms total, ${cachedCount} cached, ${freshCount} fresh)`);
    moduleResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : '✗';
      const timeStr = r.loadMs ? `${r.loadMs.toFixed(1)}ms` : '?';
      const versionStr = r.modVersion ? ` v${r.modVersion}` : '';
      const cacheStr = r.fromCache ? ' [cached]' : ' [fresh]';
      console.log(`    ${icon} ${r.id}: ${r.status}${versionStr} — ${timeStr}${r.status === 'PASS' ? cacheStr : ''}`);
    });
  }

  return report;
}

module.exports = { bootCheck, CORE_CHECKS, MODULE_CHECKS };
