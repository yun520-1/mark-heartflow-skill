/**
 * HeartFlow Self-Audit Engine v1.0.0
 * 基于 code-engine 封装的6维度自审计模块
 *
 * 审计维度:
 *   1. 模块复杂度审计（圈复杂度分布）
 *   2. 代码质量审计（空值检查、边界条件、安全漏洞）
 *   3. 版本一致性审计（VERSION vs SKILL.md vs version.js）
 *   4. 模块间依赖审计（谁依赖谁，循环依赖）
 *   5. 函数大小分布审计（超大函数需要拆分）
 *   6. 死代码/未使用导出审计
 *
 * 支持单模块审计和全库审计两种模式。
 * 可被 cron 任务直接调用（通过 runAudit() 入口）。
 *
 * @module self-audit
 * @author HeartFlow Core Team
 * @version 1.0.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { CodeEngine } = require('./code-engine.js');
const { VERSION, getVersion } = require('./version.js');

// ============================================================================
// 常量
// ============================================================================

/** 项目根目录（self-audit.js 在 src/core/，向上两级） */
const ROOT = path.resolve(__dirname, '../..');

/** 默认忽略的目录 */
const IGNORE_DIRS = ['node_modules', '.git', '__pycache__', 'dist', 'build',
  '.next', '.nuxt', 'venv', '.venv', 'env', '.env', 'coverage', '.nyc_output',
  'data', 'memory', 'logs', 'backup'];

/** 超大函数阈值（行数） */
const LARGE_FUNCTION_THRESHOLD = 50;

/** 圈复杂度告警阈值 */
const COMPLEXITY_WARN_THRESHOLD = 10;
const COMPLEXITY_CRIT_THRESHOLD = 20;

/** 死代码引用阈值：少于等于此引用次数的导出视为可疑 */
const DEAD_CODE_REF_THRESHOLD = 1;

/** 死代码审计：最大扫描文件数（防止 OOM） */
const DEAD_CODE_MAX_FILES = 200;

/** 死代码审计：每个文件最大导出检查数 */
const DEAD_CODE_MAX_EXPORTS_PER_FILE = 20;

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 递归扫描目录下所有代码文件
 * @param {string} dirPath - 目录路径
 * @param {string[]} [ignoreDirs] - 忽略的目录名列表
 * @returns {string[]} 文件路径数组
 */
function scanCodeFiles(dirPath, ignoreDirs = IGNORE_DIRS) {
  const results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (!ignoreDirs.includes(entry.name) && !entry.name.startsWith('.')) {
          results.push(...scanCodeFiles(fullPath, ignoreDirs));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.py'].includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (e) {
    // 跳过权限不足的目录
  }
  return results;
}

/**
 * 读取文件内容，失败返回 null
 * @param {string} filePath
 * @returns {string|null}
 */
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * 读取并解析 JSON 文件，失败返回 null
 * @param {string} filePath
 * @returns {Object|null}
 */
function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 将文件路径转为相对于 ROOT 的简洁路径
 * @param {string} filePath
 * @returns {string}
 */
function relativePath(filePath) {
  return path.relative(ROOT, filePath);
}

/**
 * 提取文件中的 export 名称列表
 * @param {string} content - 文件内容
 * @returns {string[]} 导出的标识符列表
 */
function extractExports(content) {
  const exports = [];

  // module.exports = xxx
  const m1 = content.match(/module\.exports\s*=\s*(\w+)/g);
  if (m1) m1.forEach(m => {
    const name = m.match(/module\.exports\s*=\s*(\w+)/);
    if (name) exports.push(name[1]);
  });

  // module.exports.xxx = ...
  const m2 = content.match(/module\.exports\.(\w+)\s*=/g);
  if (m2) m2.forEach(m => {
    const name = m.match(/module\.exports\.(\w+)/);
    if (name) exports.push(name[1]);
  });

  // exports.xxx = ...
  const m3 = content.match(/exports\.(\w+)\s*=/g);
  if (m3) m3.forEach(m => {
    const name = m.match(/exports\.(\w+)/);
    if (name) exports.push(name[1]);
  });

  // export function xxx / export const xxx / export class xxx
  const m4 = content.match(/export\s+(?:function|const|let|var|class)\s+(\w+)/g);
  if (m4) m4.forEach(m => {
    const name = m.match(/export\s+(?:function|const|let|var|class)\s+(\w+)/);
    if (name) exports.push(name[1]);
  });

  // export { xxx, yyy }
  const m5 = content.match(/export\s+\{([^}]+)\}/g);
  if (m5) m5.forEach(m => {
    const inner = m.match(/export\s+\{([^}]+)\}/);
    if (inner) {
      inner[1].split(',').forEach(s => {
        const trimmed = s.trim();
        if (trimmed && !trimmed.startsWith('*')) {
          // Handle "as" aliases: xxx as yyy -> take the original name
          const asMatch = trimmed.match(/(\w+)\s+as\s+\w+/);
          exports.push(asMatch ? asMatch[1] : trimmed);
        }
      });
    }
  });

  // export default xxx
  const m6 = content.match(/export\s+default\s+(\w+)/g);
  if (m6) m6.forEach(m => {
    const name = m.match(/export\s+default\s+(\w+)/);
    if (name) exports.push(name[1]);
  });

  return [...new Set(exports)];
}

/**
 * 统计代码中某个标识符的引用次数（排除声明和导出行）
 * @param {string} content - 文件内容
 * @param {string} name - 标识符名称
 * @returns {number}
 */
function countReferences(content, name) {
  if (!name || name.length < 2) return 999;
  const regex = new RegExp(`\\b${name}\\b`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

// ============================================================================
// 6维度审计函数
// ============================================================================

/**
 * 维度1: 模块复杂度审计
 * 扫描所有文件的函数圈复杂度，统计分布
 *
 * @param {CodeEngine} engine - CodeEngine 实例
 * @param {string[]} files - 文件路径列表
 * @param {Map<string, {content:string, lang:string}>} fileContents - 文件内容 Map
 * @returns {Object} 复杂度审计报告
 */
function auditComplexity(engine, files, fileContents) {
  const allFunctions = [];
  const complexityBuckets = {
    low: 0,        // 0-5
    moderate: 0,   // 6-10
    high: 0,       // 11-15
    veryHigh: 0,   // 16-20
    critical: 0    // 21+
  };

  for (const [filePath, { content, lang }] of fileContents.entries()) {
    const analysis = engine.analyzeCode(content, lang);
    for (const func of analysis.functions) {
      const cpx = func.complexity || 0;
      allFunctions.push({
        file: relativePath(filePath),
        function: func.name || '(anonymous)',
        line: func.line || 0,
        complexity: cpx,
        params: func.params || []
      });
      if (cpx <= 5) complexityBuckets.low++;
      else if (cpx <= 10) complexityBuckets.moderate++;
      else if (cpx <= 15) complexityBuckets.high++;
      else if (cpx <= 20) complexityBuckets.veryHigh++;
      else complexityBuckets.critical++;
    }
  }

  // 按复杂度降序排列
  allFunctions.sort((a, b) => b.complexity - a.complexity);

  const hotspots = allFunctions.filter(f => f.complexity >= COMPLEXITY_WARN_THRESHOLD);
  const totalFuncs = allFunctions.length;

  return {
    summary: {
      totalFunctions: totalFuncs,
      totalHotspots: hotspots.length,
      averageComplexity: totalFuncs > 0
        ? Math.round(allFunctions.reduce((s, f) => s + f.complexity, 0) / totalFuncs * 100) / 100
        : 0,
      maxComplexity: totalFuncs > 0 ? allFunctions[0].complexity : 0
    },
    distribution: complexityBuckets,
    hotspots: hotspots.slice(0, 30), // 最多返回30个热点
    allFunctions: allFunctions.slice(0, 100) // 最多返回100个
  };
}

/**
 * 维度2: 代码质量审计
 * 对每个文件执行 reviewCode 审查，汇总问题
 *
 * @param {CodeEngine} engine - CodeEngine 实例
 * @param {string[]} files - 文件路径列表
 * @param {Map<string, {content:string, lang:string}>} fileContents - 文件内容 Map
 * @returns {Object} 代码质量审计报告
 */
function auditCodeQuality(engine, files, fileContents) {
  const allIssues = [];
  let totalScore = 0;
  let reviewedCount = 0;
  const issuesByFile = {};

  for (const [filePath, { content, lang }] of fileContents.entries()) {
    const review = engine.reviewCode(content, lang);
    const relPath = relativePath(filePath);

    if (review.issues && review.issues.length > 0) {
      for (const issue of review.issues) {
        allIssues.push({
          file: relPath,
          line: issue.line || 0,
          type: issue.type,
          severity: issue.severity || 'low',
          message: issue.message || issue.description || '',
          code: issue.code || ''
        });
      }
      issuesByFile[relPath] = {
        issueCount: review.issueCount || review.issues.length,
        criticalCount: review.criticalCount || 0,
        highCount: review.highCount || 0,
        score: review.score || 0
      };
    } else {
      issuesByFile[relPath] = { issueCount: 0, criticalCount: 0, highCount: 0, score: 100 };
    }

    totalScore += review.score || 100;
    reviewedCount++;
  }

  // 按严重级别统计
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const issue of allIssues) {
    if (severityCounts[issue.severity] !== undefined) {
      severityCounts[issue.severity]++;
    }
  }

  // 按类型统计
  const typeCounts = {};
  for (const issue of allIssues) {
    typeCounts[issue.type] = (typeCounts[issue.type] || 0) + 1;
  }

  return {
    summary: {
      totalFiles: reviewedCount,
      filesWithIssues: Object.values(issuesByFile).filter(v => v.issueCount > 0).length,
      totalIssues: allIssues.length,
      criticalCount: severityCounts.critical,
      highCount: severityCounts.high,
      mediumCount: severityCounts.medium,
      lowCount: severityCounts.low,
      averageScore: reviewedCount > 0 ? Math.round(totalScore / reviewedCount) : 100
    },
    issuesByType: typeCounts,
    issuesByFile,
    topIssues: allIssues.slice(0, 50) // 最多返回50个问题
  };
}

/**
 * 维度3: 版本一致性审计
 * 对比 VERSION 文件、package.json、SKILL.md、version.js、heartflow.js 中的版本号
 *
 * @returns {Object} 版本一致性审计报告
 */
function auditVersionConsistency() {
  const sources = {};

  // VERSION 文件
  const versionFileContent = readFileSafe(path.join(ROOT, 'VERSION'));
  if (versionFileContent !== null) {
    sources.VERSION_FILE = versionFileContent.trim();
  }

  // package.json
  const pkg = readJsonSafe(path.join(ROOT, 'package.json'));
  if (pkg && pkg.version) {
    sources.package_json = pkg.version;
  }

  // SKILL.md (frontmatter + title)
  const skillContent = readFileSafe(path.join(ROOT, 'SKILL.md'));
  if (skillContent !== null) {
    const fmMatch = skillContent.match(/version:\s*"?([^"\n]+)"?/);
    if (fmMatch) sources.SKILL_MD_frontmatter = fmMatch[1].trim();
    const titleMatch = skillContent.match(/# HeartFlow.*?v(\d+\.\d+\.\d+)/);
    if (titleMatch) sources.SKILL_MD_title = titleMatch[1];
  }

  // version.js
  const vjsContent = readFileSafe(path.join(ROOT, 'src/core/version.js'));
  if (vjsContent !== null) {
    const constMatch = vjsContent.match(/const\s+VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/);
    if (constMatch) sources.version_js_const = constMatch[1];
    const docMatch = vjsContent.match(/v(\d+\.\d+\.\d+)/);
    if (docMatch) sources.version_js_doc = docMatch[1];
  }

  // heartflow.js
  const hfContent = readFileSafe(path.join(ROOT, 'src/core/heartflow.js'));
  if (hfContent !== null) {
    const constMatch = hfContent.match(/const\s+VERSION\s*=\s*['"](\d+\.\d+\.\d+)['"]/);
    if (constMatch) sources.heartflow_js_const = constMatch[1];
    const docMatch = hfContent.match(/HeartFlow\s+v(\d+\.\d+\.\d+)/);
    if (docMatch) sources.heartflow_js_doc = docMatch[1];
  }

  // docs/README.md
  const docsContent = readFileSafe(path.join(ROOT, 'docs/README.md'));
  if (docsContent !== null) {
    const m = docsContent.match(/Current Version.*?v(\d+\.\d+\.\d+)/);
    if (m) sources.docs_README = m[1];
  }

  // 分析一致性
  const values = Object.values(sources).filter(Boolean);
  const uniqueValues = [...new Set(values)];

  const isConsistent = uniqueValues.length <= 1;
  const canonicalVersion = values[0] || 'unknown';

  const discrepancies = [];
  if (!isConsistent) {
    for (const [source, version] of Object.entries(sources)) {
      if (version !== canonicalVersion) {
        discrepancies.push({ source, expected: canonicalVersion, actual: version });
      }
    }
  }

  return {
    summary: {
      isConsistent,
      canonicalVersion,
      uniqueVersions: uniqueValues,
      sourceCount: Object.keys(sources).length,
      discrepancyCount: discrepancies.length
    },
    sources,
    discrepancies
  };
}

/**
 * 维度4: 模块间依赖审计
 * 分析依赖图、循环依赖、依赖统计
 *
 * @param {CodeEngine} engine - CodeEngine 实例
 * @param {string[]} files - 文件路径列表
 * @param {Map<string, {content:string, lang:string}>} fileContents - 文件内容 Map
 * @returns {Object} 依赖审计报告
 */
function auditDependencies(engine, files, fileContents) {
  const auditResult = engine.auditCodebase(ROOT);

  // 构建依赖矩阵：谁依赖谁
  const depMatrix = {};
  const reverseDeps = {};

  for (const [fileRel, info] of Object.entries(auditResult.dependencyGraph || {})) {
    depMatrix[fileRel] = info.dependencies.map(d => d.module);
    for (const dep of info.dependencies) {
      if (!reverseDeps[dep.module]) reverseDeps[dep.module] = [];
      reverseDeps[dep.module].push(fileRel);
    }
  }

  // 统计每个模块的被依赖次数
  const depCounts = {};
  for (const [fileRel, deps] of Object.entries(depMatrix)) {
    depCounts[fileRel] = {
      dependsOn: deps.length,
      dependedBy: (reverseDeps[fileRel] || []).length
    };
  }

  // 找出高耦合模块（被依赖最多的）
  const highCoupling = Object.entries(depCounts)
    .filter(([, c]) => c.dependedBy >= 5)
    .map(([file, c]) => ({ file, ...c }))
    .sort((a, b) => b.dependedBy - a.dependedBy);

  // 找出孤立模块（零依赖且零被依赖）
  const isolated = Object.entries(depCounts)
    .filter(([, c]) => c.dependsOn === 0 && c.dependedBy === 0)
    .map(([file]) => ({ file }));

  return {
    summary: {
      totalModules: Object.keys(depMatrix).length,
      circularDependencyCount: (auditResult.circularDependencies || []).length,
      highCouplingCount: highCoupling.length,
      isolatedCount: isolated.length,
      totalDependencyEdges: Object.values(depMatrix)
        .reduce((s, deps) => s + deps.filter(d => d.startsWith('.')).length, 0)
    },
    dependencyGraph: auditResult.dependencyGraph,
    circularDependencies: auditResult.circularDependencies || [],
    coupling: {
      highCoupling: highCoupling.slice(0, 20),
      isolated: isolated.slice(0, 20)
    },
    depCounts: Object.entries(depCounts)
      .map(([file, c]) => ({ file, ...c }))
      .sort((a, b) => b.dependedBy - a.dependedBy)
      .slice(0, 50)
  };
}

/**
 * 维度5: 函数大小分布审计
 * 统计函数行数分布，标记超大函数
 *
 * @param {CodeEngine} engine - CodeEngine 实例
 * @param {string[]} files - 文件路径列表
 * @param {Map<string, {content:string, lang:string}>} fileContents - 文件内容 Map
 * @returns {Object} 函数大小审计报告
 */
function auditFunctionSize(engine, files, fileContents) {
  const allFunctions = [];
  const sizeBuckets = {
    tiny: 0,       // 1-10行
    small: 0,      // 11-30行
    medium: 0,     // 31-50行
    large: 0,      // 51-100行
    huge: 0        // 100+行
  };

  for (const [filePath, { content, lang }] of fileContents.entries()) {
    const analysis = engine.analyzeCode(content, lang);
    for (const func of analysis.functions) {
      const startLine = func.line || 0;
      const endLine = func.endLine || startLine;
      const lineCount = endLine - startLine + 1;

      const funcInfo = {
        file: relativePath(filePath),
        function: func.name || '(anonymous)',
        line: startLine,
        endLine,
        lineCount,
        complexity: func.complexity || 0
      };
      allFunctions.push(funcInfo);

      if (lineCount <= 10) sizeBuckets.tiny++;
      else if (lineCount <= 30) sizeBuckets.small++;
      else if (lineCount <= 50) sizeBuckets.medium++;
      else if (lineCount <= 100) sizeBuckets.large++;
      else sizeBuckets.huge++;
    }
  }

  // 按行数降序排列
  allFunctions.sort((a, b) => b.lineCount - a.lineCount);

  const largeFunctions = allFunctions.filter(f => f.lineCount >= LARGE_FUNCTION_THRESHOLD);
  const totalFuncs = allFunctions.length;

  return {
    summary: {
      totalFunctions: totalFuncs,
      largeFunctionCount: largeFunctions.length,
      averageLineCount: totalFuncs > 0
        ? Math.round(allFunctions.reduce((s, f) => s + f.lineCount, 0) / totalFuncs * 100) / 100
        : 0,
      maxLineCount: totalFuncs > 0 ? allFunctions[0].lineCount : 0,
      threshold: LARGE_FUNCTION_THRESHOLD
    },
    distribution: sizeBuckets,
    largeFunctions: largeFunctions.slice(0, 30),
    topFunctions: allFunctions.slice(0, 50)
  };
}

/**
 * 维度6: 死代码/未使用导出审计
 * 扫描导出的标识符，检查是否在项目其他位置被引用
 *
 * @param {string[]} files - 文件路径列表
 * @returns {Object} 死代码审计报告
 */
function auditDeadCode(files) {
  // 收集所有文件的导出
  const fileExports = {}; // file -> { exportName: refCount }

  // 限制文件数量防止 OOM
  const scanFiles = files.length > DEAD_CODE_MAX_FILES
    ? files.slice(0, DEAD_CODE_MAX_FILES)
    : files;

  // 限制总内容大小防止 OOM（最多扫描 5MB 文件内容）
  let totalContentSize = 0;
  const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // 5MB

  // 预读取所有文件内容（只读一次，避免反复 I/O）
  const fileContentCache = new Map();
  for (const filePath of scanFiles) {
    if (totalContentSize >= MAX_CONTENT_BYTES) break;
    const content = readFileSafe(filePath);
    if (content !== null) {
      totalContentSize += Buffer.byteLength(content, 'utf-8');
      fileContentCache.set(filePath, content);
    }
  }

  for (const [filePath, content] of fileContentCache) {
    const exports = extractExports(content);
    if (exports.length > 0) {
      // 限制每个文件的导出检查数量
      const limitedExports = exports.slice(0, DEAD_CODE_MAX_EXPORTS_PER_FILE);
      fileExports[relativePath(filePath)] = limitedExports;
    }
  }

  const suspiciousExports = [];

  for (const [file, exportNames] of Object.entries(fileExports)) {
    for (const name of exportNames) {
      let totalRefs = 0;
      let refFiles = [];

      for (const [otherPath, otherContent] of fileContentCache) {
        if (otherPath === path.join(ROOT, file)) continue; // 跳过自身
        const count = countReferences(otherContent, name);
        if (count > 0) {
          totalRefs += count;
          refFiles.push(relativePath(otherPath));
        }
      }

      // 只有定义自身（声明+导出），外部引用次数 ≤ 阈值
      if (totalRefs <= DEAD_CODE_REF_THRESHOLD) {
        suspiciousExports.push({
          file,
          exportName: name,
          externalReferences: totalRefs,
          referencedBy: refFiles
        });
      }
    }
  }

  // 按引用次数升序排列
  suspiciousExports.sort((a, b) => a.externalReferences - b.externalReferences);

  return {
    summary: {
      totalFilesWithExports: Object.keys(fileExports).length,
      totalExports: Object.values(fileExports).reduce((s, exs) => s + exs.length, 0),
      suspiciousExportsCount: suspiciousExports.length,
      threshold: DEAD_CODE_REF_THRESHOLD
    },
    suspiciousExports: suspiciousExports.slice(0, 50)
  };
}

// ============================================================================
// 审计报告结构
// ============================================================================

/**
 * 创建空的审计报告骨架
 * @returns {Object}
 */
function createReport() {
  return {
    meta: {
      engine: 'HeartFlow Self-Audit Engine v1.0.0',
      timestamp: new Date().toISOString(),
      project: 'HeartFlow / 引擎',
      projectRoot: ROOT
    },
    summary: {
      totalDimensions: 6,
      dimensionsPassed: 0,
      dimensionsWarned: 0,
      dimensionsFailed: 0,
      totalIssues: 0,
      criticalCount: 0,
      highCount: 0,
      overallHealth: 'unknown',
      duration: 0
    },
    dimensions: {},
    raw: {}
  };
}

// ============================================================================
// 审计维度判断阈值
// ============================================================================

const DIMENSION_THRESHOLDS = {
  complexity: {
    pass: { hotspots: 0 },
    warn: { hotspots: 5 },
    fail: { hotspots: 10 }
  },
  codeQuality: {
    pass: { score: 90 },
    warn: { score: 75 },
    fail: { score: 60 }
  },
  versionConsistency: {
    pass: { discrepancies: 0 },
    warn: { discrepancies: 2 },
    fail: { discrepancies: 3 }
  },
  dependencies: {
    pass: { circularDeps: 0 },
    warn: { circularDeps: 2 },
    fail: { circularDeps: 5 }
  },
  functionSize: {
    pass: { largeFuncs: 0 },
    warn: { largeFuncs: 5 },
    fail: { largeFuncs: 15 }
  },
  deadCode: {
    pass: { suspicious: 0 },
    warn: { suspicious: 5 },
    fail: { suspicious: 15 }
  }
};

/**
 * 根据指标计算维度状态
 * @param {string} dimension - 维度名称
 * @param {Object} data - 审计数据
 * @returns {string} 'pass' | 'warn' | 'fail'
 */
function evaluateDimensionStatus(dimension, data) {
  const th = DIMENSION_THRESHOLDS[dimension];
  if (!th) return 'warn';

  switch (dimension) {
    case 'complexity':
      if (data.summary.totalHotspots <= th.pass.hotspots) return 'pass';
      if (data.summary.totalHotspots <= th.warn.hotspots) return 'warn';
      return 'fail';
    case 'codeQuality':
      if (data.summary.averageScore >= th.pass.score) return 'pass';
      if (data.summary.averageScore >= th.warn.score) return 'warn';
      return 'fail';
    case 'versionConsistency':
      if (data.summary.discrepancyCount <= th.pass.discrepancies) return 'pass';
      if (data.summary.discrepancyCount <= th.warn.discrepancies) return 'warn';
      return 'fail';
    case 'dependencies':
      if (data.summary.circularDependencyCount <= th.pass.circularDeps) return 'pass';
      if (data.summary.circularDependencyCount <= th.warn.circularDeps) return 'warn';
      return 'fail';
    case 'functionSize':
      if (data.summary.largeFunctionCount <= th.pass.largeFuncs) return 'pass';
      if (data.summary.largeFunctionCount <= th.warn.largeFuncs) return 'warn';
      return 'fail';
    case 'deadCode':
      if (data.summary.suspiciousExportsCount <= th.pass.suspicious) return 'pass';
      if (data.summary.suspiciousExportsCount <= th.warn.suspicious) return 'warn';
      return 'fail';
    default:
      return 'warn';
  }
}

// ============================================================================
// 主审计入口
// ============================================================================

/**
 * 执行全库审计（6维度）
 *
 * @param {Object} [opts] - 选项
 * @param {string} [opts.mode='full'] - 'full' | 'single'
 * @param {string} [opts.singleFile] - 单模块审计时的文件路径
 * @param {boolean} [opts.includeRaw=false] - 是否在报告中包含原始审计数据
 * @returns {Object} 结构化审计报告
 */
function runAudit(opts = {}) {
  const startTime = Date.now();
  const mode = opts.mode || 'full';
  const includeRaw = opts.includeRaw || false;

  const engine = new CodeEngine();
  const report = createReport();
  report.meta.mode = mode;

  // 确定要审计的文件
  let files;
  if (mode === 'single' && opts.singleFile) {
    const targetFile = path.resolve(ROOT, opts.singleFile);
    if (!fs.existsSync(targetFile)) {
      report.error = `文件不存在: ${targetFile}`;
      report.summary.overallHealth = 'error';
      return report;
    }
    files = [targetFile];
  } else {
    files = scanCodeFiles(ROOT);
  }

  // 读取所有文件内容
  const fileContents = new Map();
  for (const filePath of files) {
    const content = readFileSafe(filePath);
    if (content !== null) {
      const ext = path.extname(filePath).toLowerCase();
      let lang = 'javascript';
      if (['.ts', '.tsx', '.mts', '.cts'].includes(ext)) lang = 'typescript';
      else if (['.py', '.pyw', '.pyx'].includes(ext)) lang = 'python';
      fileContents.set(filePath, { content, lang });
    }
  }

  // ========================================================================
  // 维度1: 模块复杂度审计
  // ========================================================================
  const complexityResult = auditComplexity(engine, files, fileContents);
  const complexityStatus = evaluateDimensionStatus('complexity', complexityResult);
  report.dimensions.complexity = {
    name: '模块复杂度审计',
    status: complexityStatus,
    summary: complexityResult.summary,
    distribution: complexityResult.distribution,
    hotspots: complexityResult.hotspots
  };

  // ========================================================================
  // 维度2: 代码质量审计
  // ========================================================================
  const qualityResult = auditCodeQuality(engine, files, fileContents);
  const qualityStatus = evaluateDimensionStatus('codeQuality', qualityResult);
  report.dimensions.codeQuality = {
    name: '代码质量审计',
    status: qualityStatus,
    summary: qualityResult.summary,
    issuesByType: qualityResult.issuesByType,
    issuesByFile: qualityResult.issuesByFile,
    topIssues: qualityResult.topIssues
  };

  // ========================================================================
  // 维度3: 版本一致性审计
  // ========================================================================
  const versionResult = auditVersionConsistency();
  const versionStatus = evaluateDimensionStatus('versionConsistency', versionResult);
  report.dimensions.versionConsistency = {
    name: '版本一致性审计',
    status: versionStatus,
    summary: versionResult.summary,
    sources: versionResult.sources,
    discrepancies: versionResult.discrepancies
  };

  // ========================================================================
  // 维度4: 模块间依赖审计
  // ========================================================================
  const depResult = auditDependencies(engine, files, fileContents);
  const depStatus = evaluateDimensionStatus('dependencies', depResult);
  report.dimensions.dependencies = {
    name: '模块间依赖审计',
    status: depStatus,
    summary: depResult.summary,
    coupling: depResult.coupling,
    circularDependencies: depResult.circularDependencies,
    depCounts: depResult.depCounts
  };

  // ========================================================================
  // 维度5: 函数大小分布审计
  // ========================================================================
  const funcSizeResult = auditFunctionSize(engine, files, fileContents);
  const funcSizeStatus = evaluateDimensionStatus('functionSize', funcSizeResult);
  report.dimensions.functionSize = {
    name: '函数大小分布审计',
    status: funcSizeStatus,
    summary: funcSizeResult.summary,
    distribution: funcSizeResult.distribution,
    largeFunctions: funcSizeResult.largeFunctions
  };

  // ========================================================================
  // 维度6: 死代码/未使用导出审计
  // ========================================================================
  const deadCodeResult = auditDeadCode(files);
  const deadCodeStatus = evaluateDimensionStatus('deadCode', deadCodeResult);
  report.dimensions.deadCode = {
    name: '死代码/未使用导出审计',
    status: deadCodeStatus,
    summary: deadCodeResult.summary,
    suspiciousExports: deadCodeResult.suspiciousExports
  };

  // ========================================================================
  // 汇总
  // ========================================================================
  const dimensionStatuses = [
    complexityStatus, qualityStatus, versionStatus,
    depStatus, funcSizeStatus, deadCodeStatus
  ];
  const passed = dimensionStatuses.filter(s => s === 'pass').length;
  const failed = dimensionStatuses.filter(s => s === 'fail').length;
  const warned = dimensionStatuses.filter(s => s === 'warn').length;

  const totalIssues = (qualityResult.summary.totalIssues || 0) +
    (depResult.summary.circularDependencyCount || 0) +
    (funcSizeResult.summary.largeFunctionCount || 0) +
    (deadCodeResult.summary.suspiciousExportsCount || 0);

  const criticalCount = qualityResult.summary.criticalCount || 0;
  const highCount = qualityResult.summary.highCount || 0;

  let overallHealth;
  if (failed > 0) overallHealth = 'critical';
  else if (warned > 0) overallHealth = 'warning';
  else if (passed === 6) overallHealth = 'healthy';
  else overallHealth = 'degraded';

  report.summary = {
    totalDimensions: 6,
    dimensionsPassed: passed,
    dimensionsWarned: warned,
    dimensionsFailed: failed,
    totalIssues,
    criticalCount,
    highCount,
    overallHealth,
    duration: Date.now() - startTime,
    filesScanned: files.length,
    filesAnalyzed: fileContents.size
  };

  if (includeRaw) {
    report.raw = {
      complexity: complexityResult,
      codeQuality: qualityResult,
      versionConsistency: versionResult,
      dependencies: depResult,
      functionSize: funcSizeResult,
      deadCode: deadCodeResult
    };
  }

  return report;
}

/**
 * 执行单模块审计
 *
 * @param {string} filePath - 相对于项目根的文件路径
 * @param {Object} [opts] - 选项（透传给 runAudit）
 * @returns {Object} 审计报告
 */
function auditSingleModule(filePath, opts = {}) {
  return runAudit({ ...opts, mode: 'single', singleFile: filePath });
}

/**
 * 执行全库审计（runAudit 的别名，便于 cron 调用）
 *
 * @param {Object} [opts] - 选项
 * @returns {Object} 审计报告
 */
function auditFullCodebase(opts = {}) {
  return runAudit({ ...opts, mode: 'full' });
}

/**
 * 生成可读的审计摘要文本
 *
 * @param {Object} report - 审计报告
 * @returns {string} 可读的摘要
 */
function formatAuditSummary(report) {
  if (!report || report.error) {
    return `[Self-Audit] ERROR: ${report ? report.error : 'Unknown error'}`;
  }

  const s = report.summary;
  const lines = [];
  lines.push('╔══════════════════════════════════════════════════════╗');
  lines.push('║         HeartFlow Self-Audit Report                   ║');
  lines.push('║                    v1.0.0                            ║');
  lines.push('╚══════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  Mode:           ${report.meta.mode}`);
  lines.push(`  Duration:       ${s.duration}ms`);
  lines.push(`  Files Scanned:  ${s.filesScanned}`);
  lines.push(`  Files Analyzed: ${s.filesAnalyzed}`);
  lines.push('');
  lines.push(`  [Overall Health] ${s.overallHealth.toUpperCase()}`);
  lines.push(`  Passed: ${s.dimensionsPassed}/${s.totalDimensions}  |  Warned: ${s.dimensionsWarned}  |  Failed: ${s.dimensionsFailed}`);
  lines.push(`  Total Issues: ${s.totalIssues}  |  Critical: ${s.criticalCount}  |  High: ${s.highCount}`);
  lines.push('');

  // 每个维度的简况
  const dims = report.dimensions;
  if (dims.complexity) {
    const icon = dims.complexity.status === 'pass' ? '✓' : dims.complexity.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [复杂度]   热点:${dims.complexity.summary.totalHotspots}  平均复杂度:${dims.complexity.summary.averageComplexity}`);
  }
  if (dims.codeQuality) {
    const icon = dims.codeQuality.status === 'pass' ? '✓' : dims.codeQuality.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [质量]     问题:${dims.codeQuality.summary.totalIssues}  评分:${dims.codeQuality.summary.averageScore}`);
  }
  if (dims.versionConsistency) {
    const icon = dims.versionConsistency.status === 'pass' ? '✓' : dims.versionConsistency.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [版本]     源:${dims.versionConsistency.summary.sourceCount}  不一致:${dims.versionConsistency.summary.discrepancyCount}`);
  }
  if (dims.dependencies) {
    const icon = dims.dependencies.status === 'pass' ? '✓' : dims.dependencies.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [依赖]     循环:${dims.dependencies.summary.circularDependencyCount}  高耦合:${dims.dependencies.summary.highCouplingCount}`);
  }
  if (dims.functionSize) {
    const icon = dims.functionSize.status === 'pass' ? '✓' : dims.functionSize.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [函数大小] 超大函数:${dims.functionSize.summary.largeFunctionCount}  平均行数:${dims.functionSize.summary.averageLineCount}`);
  }
  if (dims.deadCode) {
    const icon = dims.deadCode.status === 'pass' ? '✓' : dims.deadCode.status === 'warn' ? '⚠' : '✗';
    lines.push(`  ${icon} [死代码]   可疑导出:${dims.deadCode.summary.suspiciousExportsCount}`);
  }

  lines.push('');
  lines.push('═'.repeat(54));
  lines.push(s.overallHealth === 'healthy'
    ? '  RESULT: ✓ ALL DIMENSIONS PASSED'
    : `  RESULT: ${s.dimensionsFailed} DIMENSION(S) FAILED — SEE ABOVE`);
  lines.push('═'.repeat(54));

  return lines.join('\n');
}

// ============================================================================
// 导出
// ============================================================================

module.exports = {
  // 主入口
  runAudit,
  auditFullCodebase,
  auditSingleModule,

  // 各维度审计（可单独调用）
  auditComplexity,
  auditCodeQuality,
  auditVersionConsistency,
  auditDependencies,
  auditFunctionSize,
  auditDeadCode,

  // 工具函数
  formatAuditSummary,
  evaluateDimensionStatus,

  // 常量
  ROOT,
  VERSION,
  LARGE_FUNCTION_THRESHOLD,
  COMPLEXITY_WARN_THRESHOLD,
  COMPLEXITY_CRIT_THRESHOLD
};
