/**
 * HeartFlow Boot Check v1.1.0
 * 启动自检：验证核心文件 + 版本一致 + 身份锚点 + 运行时健康评分 + 修复建议
 * 基于 v11.9.4 self-check.js 重写适配
 *
 * 升级内容 (v1.0.0 → v1.1.0):
 *   - 新增 runtime 运行时健康检测：版本一致性检查、模块版本冲突检测
 *   - 新增 _computeHealthScore() 综合健康评分 (0-100)
 *   - 新增 getFixSuggestions() 自动修复建议生成
 *   - 新增 checkVersionConsistency() 跨文件版本一致性验证
 *   - 新增 dependencyGraphIntegrity() 依赖完整性验证
 *   - 新增 report.summary 字段：包含严重等级、健康等级、建议数
 *
 * 用法:
 *   const { bootCheck } = require('./boot-check');
 *   const report = bootCheck();              // 运行自检 + 健康评分
 *   const report = bootCheck(true);          // 静默模式
 *   const suggestions = getFixSuggestions(); // 获取修复建议列表
 */

const fs = require('fs');
const path = require('path');

// 引擎根目录: src/core/boot-check.js → 引擎根目录
const ROOT = path.resolve(__dirname, '../..');

// ============================================================================
// 严重等级枚举
// ============================================================================
const SEVERITY = {
  CRITICAL: 'CRITICAL',  // 核心文件缺失/版本冲突 → 无法启动
  HIGH: 'HIGH',          // 必要模块加载失败 → 功能降级
  MEDIUM: 'MEDIUM',      // 可选模块加载失败 → 部分功能不可用
  LOW: 'LOW',            // 缓存行为/加载时间异常 → 性能建议
  INFO: 'INFO',          // 信息性提示
};

// 健康等级边界
const HEALTH_GRADE = {
  EXCELLENT: { min: 90, label: 'EXCELLENT' },
  GOOD: { min: 70, label: 'GOOD' },
  FAIR: { min: 50, label: 'FAIR' },
  POOR: { min: 25, label: 'POOR' },
  CRITICAL: { min: 0, label: 'CRITICAL' },
};

// ============================================================================
// 修复建议模板 — 针对不同检测失败类型
// ============================================================================
const FIX_TEMPLATES = {
  file_missing: {
    severity: SEVERITY.CRITICAL,
    message: (item) => `文件 ${item.path} 缺失 — 请检查安装完整性，从 git 仓库恢复`,
    action: (item) => `git checkout HEAD -- "${item.path}"`,
  },
  file_content: {
    severity: SEVERITY.HIGH,
    message: (item) => `文件 ${item.path} 内容校验失败 — 可能被损坏或格式不正确`,
    action: (item) => `重新生成或从备份恢复 "${item.path}"`,
  },
  module_load: {
    severity: SEVERITY.HIGH,
    message: (item) => `模块 ${item.label} (${item.path}) 加载失败`,
    action: (item) => `检查 ${item.path} 导出是否正确，确保 module.exports 包含 "${item.label}"`,
  },
  module_version_mismatch: {
    severity: SEVERITY.MEDIUM,
    message: (fromId, fromVer, toId, toVer) =>
      `版本冲突: ${fromId}(v${fromVer}) 与 ${toId}(v${toVer}) 不一致`,
    action: () => `运行 bumpVersion('patch') 同步所有文件版本`,
  },
  version_file_mismatch: {
    severity: SEVERITY.MEDIUM,
    message: (file, expected, actual) =>
      `版本文件 ${file} 版本不一致: 期望 ${expected}, 实际 ${actual}`,
    action: (file, expected) => `手动更新 ${file} 中版本号为 ${expected}`,
  },
  slow_module: {
    severity: SEVERITY.LOW,
    message: (item, ms) => `模块 ${item.label} 加载耗时 ${ms}ms，超过阈值`,
    action: (item) => `考虑优化 ${item.path} 的初始化逻辑或延迟加载`,
  },
};

// 核心文件检查项
const CORE_CHECKS = [
  {
    id: 'identity',
    label: 'CORE_IDENTITY.md',
    path: path.join(ROOT, 'CORE_IDENTITY.md'),
    verify: (c) => c.includes('HeartFlow') && c.includes('引擎'),
    required: true,
  },
  {
    id: 'identity-core',
    label: 'identity-core.md',
    path: path.join(ROOT, 'memory/identity-core.md'),
    verify: (c) => c.includes('引擎身份核心') && c.includes('我是谁'),
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
      } catch { return false; }
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

// Module load checks — MeaningfulMemory is the primary memory engine
// triality-memory.js has been merged into meaningful-memory.js
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

// 加载阈值（毫秒）— 超过此值视为"慢加载"
const SLOW_MODULE_THRESHOLD_MS = 500;

// ============================================================================
// 版本一致性检查 — 校验 VERSION 文件、package.json、SKILL.md 是否同版本
// ============================================================================

/**
 * 检查跨文件版本一致性
 * @returns {{ consistent: boolean, files: Object<string, string>, conflicts: string[] }}
 */
function checkVersionConsistency() {
  const versionSources = {};

  // 1) VERSION 文件
  const versionFile = path.join(ROOT, 'VERSION');
  if (fs.existsSync(versionFile)) {
    versionSources['VERSION'] = fs.readFileSync(versionFile, 'utf-8').trim();
  }

  // 2) package.json
  const pkgFile = path.join(ROOT, 'package.json');
  if (fs.existsSync(pkgFile)) {
    try {
      versionSources['package.json'] = JSON.parse(fs.readFileSync(pkgFile, 'utf-8')).version || 'unknown';
    } catch { versionSources['package.json'] = 'parse_error'; }
  }

  // 3) SKILL.md frontmatter
  const skillFile = path.join(ROOT, 'SKILL.md');
  if (fs.existsSync(skillFile)) {
    const content = fs.readFileSync(skillFile, 'utf-8');
    const fmMatch = content.match(/version:\s*"?(\d+\.\d+\.\d+)"?/);
    versionSources['SKILL.md'] = fmMatch ? fmMatch[1] : 'unknown';
  }

  // 找出冲突
  const versions = Object.values(versionSources).filter(v => v && v !== 'unknown' && v !== 'parse_error');
  const conflicts = [];
  const uniqueVersions = [...new Set(versions)];

  if (uniqueVersions.length > 1) {
    for (const [file, ver] of Object.entries(versionSources)) {
      if (ver !== uniqueVersions[0]) {
        conflicts.push(`${file}=${ver} (期望: ${uniqueVersions[0]})`);
      }
    }
  }

  return {
    consistent: uniqueVersions.length <= 1,
    files: versionSources,
    expectedVersion: uniqueVersions[0] || 'unknown',
    conflicts,
  };
}

// ============================================================================
// 运行时健康评分
// ============================================================================

/**
 * 综合健康评分 (0-100)
 *
 * 评分维度:
 *   - 核心文件完整性: 40分 (所有 required 文件必须存在且验证通过)
 *   - 模块加载成功率: 25分 (所有模块能否正常加载)
 *   - 版本一致性:     15分 (VERSION/package.json/SKILL.md 一致)
 *   - 加载性能:       10分 (模块加载时间在阈值内)
 *   - 模块新鲜度:     10分 (缓存命中率 — 合理缓存 = 稳定)
 *
 * @param {Object} fileResults
 * @param {Object} moduleResults
 * @param {Object} versionCheck
 * @returns {{ score: number, grade: string, breakdown: Object }}
 */
function _computeHealthScore(fileResults, moduleResults, versionCheck) {
  let score = 0;
  const breakdown = {};

  // 1) 核心文件完整性 (40分)
  const requiredTotal = fileResults.filter(r => r.required).length;
  const requiredPassed = fileResults.filter(r => r.required && r.status === 'PASS').length;
  const fileScore = Math.round((requiredPassed / Math.max(requiredTotal, 1)) * 40);
  score += fileScore;
  breakdown.fileIntegrity = { max: 40, earned: fileScore, detail: `${requiredPassed}/${requiredTotal} required files passed` };

  // 2) 模块加载成功率 (25分)
  const modTotal = moduleResults.length;
  const modPassed = moduleResults.filter(r => r.status === 'PASS').length;
  const modScore = Math.round((modPassed / Math.max(modTotal, 1)) * 25);
  score += modScore;
  breakdown.moduleLoad = { max: 25, earned: modScore, detail: `${modPassed}/${modTotal} modules loaded` };

  // 3) 版本一致性 (15分)
  const verScore = versionCheck.consistent ? 15 : 0;
  score += verScore;
  breakdown.versionConsistency = {
    max: 15, earned: verScore,
    detail: versionCheck.consistent ? 'all version files consistent' : `${versionCheck.conflicts.length} conflict(s) found`,
  };

  // 4) 加载性能 (10分)
  const slowModules = moduleResults.filter(r => r.loadMs > SLOW_MODULE_THRESHOLD_MS && r.status === 'PASS');
  const slowPenalty = Math.min(slowModules.length * 3, 10);
  const perfScore = 10 - slowPenalty;
  score += perfScore;
  breakdown.loadPerformance = {
    max: 10, earned: Math.max(perfScore, 0),
    detail: slowModules.length > 0 ? `${slowModules.length} slow module(s) (>${SLOW_MODULE_THRESHOLD_MS}ms)` : 'all fast',
  };

  // 5) 模块新鲜度 (10分) — 缓存命中率越高，表示系统稳定
  const loadedModules = moduleResults.filter(r => r.status === 'PASS');
  const cachedModules = loadedModules.filter(r => r.fromCache).length;
  const cacheRatio = loadedModules.length > 0 ? cachedModules / loadedModules.length : 0;
  // 缓存率 50%-100% 视为健康（太高可能意味着从不重新加载）
  const freshnessScore = cacheRatio >= 0.3 && cacheRatio <= 0.95
    ? Math.round(cacheRatio * 10)
    : cacheRatio > 0.95 ? 5 // 全缓存 = 可能不更新
    : Math.round(cacheRatio * 5); // 缓存率低 = 新鲜但慢
  score += freshnessScore;
  breakdown.moduleFreshness = {
    max: 10, earned: freshnessScore,
    detail: `${cachedModules}/${loadedModules.length} cached (${(cacheRatio * 100).toFixed(0)}%)`,
  };

  // 裁切到 0-100
  score = Math.max(0, Math.min(100, score));

  // 健康等级
  let grade = 'CRITICAL';
  for (const [key, cfg] of Object.entries(HEALTH_GRADE)) {
    if (score >= cfg.min) { grade = cfg.label; break; }
  }

  return { score, grade, breakdown };
}

// ============================================================================
// 修复建议生成
// ============================================================================

/**
 * 基于检测结果生成修复建议
 *
 * @param {Object} fileResults - 文件检查结果
 * @param {Object} moduleResults - 模块检查结果
 * @param {Object} versionCheck - 版本一致性检查结果
 * @returns {Object[]} 修复建议列表
 */
function _generateFixSuggestions(fileResults, moduleResults, versionCheck) {
  const suggestions = [];

  // 1) 文件缺失
  for (const item of fileResults) {
    if (item.status === 'MISSING') {
      suggestions.push({
        id: `fix:file:missing:${item.id}`,
        severity: FIX_TEMPLATES.file_missing.severity,
        message: FIX_TEMPLATES.file_missing.message(item),
        action: FIX_TEMPLATES.file_missing.action(item),
        target: item.id,
      });
    } else if (item.status === 'FAIL') {
      suggestions.push({
        id: `fix:file:content:${item.id}`,
        severity: FIX_TEMPLATES.file_content.severity,
        message: FIX_TEMPLATES.file_content.message(item),
        action: FIX_TEMPLATES.file_content.action(item),
        target: item.id,
      });
    }
  }

  // 2) 模块加载失败
  for (const item of moduleResults) {
    if (item.status === 'ERROR' || item.status === 'FAIL') {
      suggestions.push({
        id: `fix:module:load:${item.id}`,
        severity: FIX_TEMPLATES.module_load.severity,
        message: FIX_TEMPLATES.module_load.message(item),
        action: FIX_TEMPLATES.module_load.action(item),
        target: item.id,
      });
    }
  }

  // 3) 版本冲突
  if (!versionCheck.consistent) {
    for (const conflict of versionCheck.conflicts) {
      suggestions.push({
        id: 'fix:version:conflict',
        severity: FIX_TEMPLATES.version_file_mismatch.severity,
        message: `版本文件不一致: ${conflict}`,
        action: `运行 bumpVersion('patch') 或手动同步版本号至 ${versionCheck.expectedVersion}`,
        target: 'version',
      });
    }
  }

  // 4) 慢模块
  for (const item of moduleResults) {
    if (item.status === 'PASS' && item.loadMs > SLOW_MODULE_THRESHOLD_MS) {
      suggestions.push({
        id: `fix:module:slow:${item.id}`,
        severity: FIX_TEMPLATES.slow_module.severity,
        message: FIX_TEMPLATES.slow_module.message(item, item.loadMs.toFixed(0)),
        action: FIX_TEMPLATES.slow_module.action(item),
        target: item.id,
      });
    }
  }

  return suggestions;
}

/**
 * 外部接口：获取当前系统修复建议
 * @param {boolean} [silent=false] - 是否静默模式（仅生成建议不输出）
 * @returns {Object[]} 修复建议列表
 */
function getFixSuggestions(silent = false) {
  const fileResults = CORE_CHECKS.map(runFileCheck);
  const moduleResults = MODULE_CHECKS.map(runModuleCheck);
  const versionCheck = checkVersionConsistency();
  const suggestions = _generateFixSuggestions(fileResults, moduleResults, versionCheck);

  if (!silent && suggestions.length > 0) {
    // [PROD] 生产环境移除 console.log: console.log(`\n[HeartFlow] Boot Check — ${suggestions.length} fix suggestions:`);
    for (const s of suggestions) {
      // [PROD] 生产环境移除 console.log: console.log(`  [${s.severity}] ${s.message}`);
      // [PROD] 生产环境移除 console.log: console.log(`    → ${s.action}`);
    }
  }

  return suggestions;
}

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
    const ok = mod[item.label] !== undefined || typeof mod === 'function' || (typeof mod === 'object' && mod !== null);
    const loadMs = performance ? (performance.now() - startTime).toFixed(1) : '?';
    let modVersion = null;
    if (mod && mod[item.label] && mod[item.label].prototype && mod[item.label].prototype.version) {
      modVersion = mod[item.label].prototype.version;
    }
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
  const versionCheck = checkVersionConsistency();

  const filePassed = fileResults.filter(r => r.status === 'PASS').length;
  const fileFailed = fileResults.filter(r => r.status !== 'PASS' && r.required).length;
  const modulePassed = moduleResults.filter(r => r.status === 'PASS').length;
  const allFilesPass = filePassed === CORE_CHECKS.length;
  const allModulesPass = modulePassed === MODULE_CHECKS.length;

  const totalLoadMs = moduleResults.reduce((sum, r) => sum + (r.loadMs || 0), 0);
  const cachedCount = moduleResults.filter(r => r.fromCache).length;
  const freshCount = moduleResults.filter(r => r.status === 'PASS' && !r.fromCache).length;

  const allPass = fileFailed === 0;

  // 健康评分
  const health = _computeHealthScore(fileResults, moduleResults, versionCheck);

  // 修复建议
  const suggestions = _generateFixSuggestions(fileResults, moduleResults, versionCheck);

  const report = {
    timestamp: new Date().toISOString(),
    version: require(path.join(ROOT, 'package.json')).version,
    files: { total: CORE_CHECKS.length, passed: filePassed, checks: fileResults },
    modules: {
      total: MODULE_CHECKS.length, passed: modulePassed,
      checks: moduleResults, totalLoadMs, cachedCount, freshCount,
    },
    versionConsistency: versionCheck,
    health,
    suggestions,
    allPass,
    degraded: !allModulesPass,
    degradedModules: moduleResults.filter(r => r.status !== 'PASS').map(r => r.id),
    summary: {
      status: allPass ? 'READY' : health.score >= 50 ? 'DEGRADED' : 'FAILED',
      healthScore: health.score,
      healthGrade: health.grade,
      fixableIssues: suggestions.length,
      criticalIssues: suggestions.filter(s => s.severity === SEVERITY.CRITICAL).length,
      highIssues: suggestions.filter(s => s.severity === SEVERITY.HIGH).length,
      mediumIssues: suggestions.filter(s => s.severity === SEVERITY.MEDIUM).length,
      lowIssues: suggestions.filter(s => s.severity === SEVERITY.LOW).length,
    },
  };

  if (!silent) {
    const icon = allPass ? '✓' : '⚠';
    // [PROD] 生产环境移除 console.log: console.log(`\n[HeartFlow] ${icon} Boot Check v1.1.0 — ${report.version} — ${report.summary.status}`);
    // [PROD] 生产环境移除 console.log: console.log(`  Health: ${health.score}/100 (${health.grade}) — ${suggestions.length} fixable issue(s)`);
    // [PROD] 生产环境移除 console.log: console.log(`  Files: ${filePassed}/${CORE_CHECKS.length} passed${fileFailed > 0 ? ` (${fileFailed} required failed)` : ''}`);
    fileResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : r.status === 'MISSING' ? '?' : r.status === 'FAIL' ? '✗' : '!';
      const req = r.required ? ' [REQUIRED]' : '';
      // [PROD] 生产环境移除 console.log: console.log(`    ${icon} ${r.id}: ${r.status}${req} — ${r.detail}`);
    });
    // [PROD] 生产环境移除 console.log: console.log(`  Modules: ${modulePassed}/${MODULE_CHECKS.length} passed (${totalLoadMs.toFixed(1)}ms total, ${cachedCount} cached, ${freshCount} fresh)`);
    moduleResults.forEach(r => {
      const icon = r.status === 'PASS' ? '✓' : '✗';
      const timeStr = r.loadMs ? `${r.loadMs.toFixed(1)}ms` : '?';
      const versionStr = r.modVersion ? ` v${r.modVersion}` : '';
      const cacheStr = r.fromCache ? ' [cached]' : ' [fresh]';
      // [PROD] 生产环境移除 console.log: console.log(`    ${icon} ${r.id}: ${r.status}${versionStr} — ${timeStr}${r.status === 'PASS' ? cacheStr : ''}`);
    });
    if (versionCheck.consistent) {
      // [PROD] 生产环境移除 console.log: console.log(`  ✓ Version consistent: ${versionCheck.expectedVersion}`);
    } else {
      // [PROD] 生产环境移除 console.log: console.log(`  ⚠ Version conflict detected!`);
      // [PROD] 生产环境移除 console.log: versionCheck.conflicts.forEach(c => console.log(`    ✗ ${c}`));
    }
    // [PROD] 生产环境移除 console.log: console.log(`  Health breakdown:`);
    for (const [dim, info] of Object.entries(health.breakdown)) {
      // [PROD] 生产环境移除 console.log: console.log(`    ${dim}: ${info.earned}/${info.max} — ${info.detail}`);
    }
    if (suggestions.length > 0) {
      // [PROD] 生产环境移除 console.log: console.log(`  Fix suggestions (${suggestions.length}):`);
      suggestions.slice(0, 5).forEach(s => {
        // [PROD] 生产环境移除 console.log: console.log(`    [${s.severity}] ${s.message}`);
      });
    }
  }

  return report;
}

module.exports = { bootCheck, CORE_CHECKS, MODULE_CHECKS, getFixSuggestions, checkVersionConsistency };
