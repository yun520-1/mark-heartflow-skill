/**
 * HeartFlow Upgrade Proposal Engine v1.3.0
 * Dynamic upgrade proposal with real codebase analysis.
 *
 * What's new in 1.3.0:
 * - Real file scanning: analyzes all src/core/ .js files for size, exports, imports
 * - Change detection: tracks file sizes over time via a lightweight manifest
 * - Dynamic priority scoring: based on file metrics, dependency depth, and complexity
 * - Dependency analysis: extracts require() patterns to build module dependency graph
 * - Risk assessment: evaluates upgrade risk based on dependency count and module size
 * - Upgrade history tracking: records past upgrades with timestamps
 *
 * 吸收来源: self-improving-agent v1.0.2 (base)
 * 吸收时间: 2026-06-04
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Constants ───────────────────────────────────────────────────────────────

const CORE_DIR = path.join(__dirname);
const MANIFEST_PATH = path.join(CORE_DIR, '.upgrade-manifest.json');
const UPGRADE_HISTORY_PATH = path.join(__dirname, '..', 'UPGRADE_REPORT.txt');

const UPGRADE_WEIGHTS = {
  SMALL_FILE_PRIORITY: 0.30,   // smaller files are easier targets
  COMPLEXITY_PRIORITY: 0.25,   // files with more exports = more impactful
  DEPENDENCY_PRIORITY: 0.20,   // highly depended-upon modules get priority
  STALENESS_PRIORITY: 0.15,    // files unchanged longest get priority
  SIZE_FIT_PRIORITY: 0.10,     // 1500-5000B files are ideal targets
};

const IDEAL_SIZE_MIN = 1500;
const IDEAL_SIZE_MAX = 5000;

// ─── File Analysis ───────────────────────────────────────────────────────────

/**
 * Scan all .js files in src/core/ (excluding heartflow.js and heartflow-engine.js)
 * @returns {Array<Object>} sorted by size ascending
 */
function scanCoreModules() {
  const results = [];
  const scanDir = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const stat = fs.statSync(fullPath);
        const relPath = path.relative(CORE_DIR, fullPath);
        // Skip the main engine files — they're too large and critical
        if (relPath === 'heartflow.js' || relPath === 'heartflow-engine.js') continue;
        results.push({
          name: entry.name,
          path: relPath,
          fullPath,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      }
    }
  };
  scanDir(CORE_DIR);
  results.sort((a, b) => a.size - b.size);
  return results;
}

/**
 * Extract require() dependencies from a module's source code
 * @param {string} source
 * @returns {Array<string>}
 */
function extractDependencies(source) {
  const deps = [];
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = requireRegex.exec(source)) !== null) {
    const dep = match[1];
    // Only track internal relative imports
    if (dep.startsWith('.') || dep.startsWith('..')) {
      deps.push(dep);
    }
  }
  return deps;
}

/**
 * Count exports from a module's source (module.exports assignments)
 * @param {string} source
 * @returns {number}
 */
function countExports(source) {
  const exportPatterns = [
    /module\.exports\s*=/g,
    /exports\.\w+/g,
    /module\.exports\s*\{/g,
  ];
  let count = 0;
  for (const pattern of exportPatterns) {
    const matches = source.match(pattern);
    if (matches) count += matches.length;
  }
  return Math.max(count, 1);
}

/**
 * Analyze a module for complexity indicators
 * @param {string} source
 * @returns {Object}
 */
function analyzeComplexity(source) {
  return {
    totalLines: source.split('\n').length,
    ifStatements: (source.match(/\bif\s*\(/g) || []).length,
    forLoops: (source.match(/\bfor\s*\(/g) || []).length,
    functionDeclarations: (source.match(/\bfunction\s+\w+/g) || []).length,
    arrowFunctions: (source.match(/=>\s*\{/g) || []).length + (source.match(/=>\s*\(/g) || []).length,
    asyncAwaits: (source.match(/\bawait\b/g) || []).length + (source.match(/\basync\b/g) || []).length,
    switchCases: (source.match(/\bcase\b/g) || []).length,
    ternaryOps: (source.match(/\?\s*.+\s*:/g) || []).length,
    tryCatches: (source.match(/\btry\s*\{/g) || []).length,
    classDeclarations: (source.match(/\bclass\s+\w+/g) || []).length,
  };
}

/**
 * Compute a composite complexity score from analysis
 * @param {Object} complexity
 * @returns {number}
 */
function computeComplexityScore(complexity) {
  return (
    complexity.ifStatements * 2 +
    complexity.forLoops * 3 +
    complexity.functionDeclarations * 1.5 +
    complexity.arrowFunctions * 1 +
    complexity.asyncAwaits * 2 +
    complexity.switchCases * 2 +
    complexity.ternaryOps * 1 +
    complexity.tryCatches * 3 +
    complexity.classDeclarations * 3
  );
}

/**
 * Check if a file has been upgraded before (from history)
 * @param {string} fileName
 * @param {Array<Object>} history
 * @returns {boolean}
 */
function wasRecentlyUpgraded(fileName, history) {
  if (!history || !history.length) return false;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return history.some(
    (h) => h.module === fileName && new Date(h.timestamp).getTime() > oneDayAgo
  );
}

// ─── Manifest / History ──────────────────────────────────────────────────────

/**
 * Load or create the upgrade manifest
 * @returns {Object}
 */
function loadManifest() {
  try {
    const data = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { created: new Date().toISOString(), snapshots: {} };
  }
}

/**
 * Save the upgrade manifest
 * @param {Object} manifest
 */
function saveManifest(manifest) {
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  } catch {
    // Non-critical; skip silently
  }
}

/**
 * Load upgrade history from UPGRADE_REPORT.txt
 * @returns {Array<Object>}
 */
function loadUpgradeHistory() {
  const history = [];
  try {
    const content = fs.readFileSync(UPGRADE_HISTORY_PATH, 'utf-8');
    const lines = content.split('\n');
    let currentEntry = null;
    for (const line of lines) {
      const tsMatch = line.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      if (tsMatch) {
        if (currentEntry) history.push(currentEntry);
        currentEntry = { timestamp: tsMatch[1], module: 'unknown', summary: '' };
      } else if (currentEntry && line.startsWith('Module: ')) {
        currentEntry.module = line.slice(8).trim();
      } else if (currentEntry && line.startsWith('Summary: ')) {
        currentEntry.summary = line.slice(9).trim();
      }
    }
    if (currentEntry) history.push(currentEntry);
  } catch {
    // No history yet
  }
  return history;
}

// ─── Priority Scoring ────────────────────────────────────────────────────────

/**
 * Score a module for upgrade priority (0-100)
 * @param {Object} mod - module info with analysis
 * @param {Object} manifest - upgrade manifest
 * @param {Array<Object>} history - upgrade history
 * @param {Object} depGraph - { moduleName: [dependentNames] }
 * @returns {number}
 */
function scoreUpgradePriority(mod, manifest, history, depGraph) {
  let score = 0;
  const size = mod.size;
  const prevSize = manifest.snapshots[mod.name];
  const wasUpgraded = wasRecentlyUpgraded(mod.name, history);
  const dependents = depGraph[mod.name] || [];

  // SMALL_FILE_PRIORITY: smaller files are easier to upgrade safely
  const sizeRatio = Math.max(0, 1 - size / 30000);
  score += sizeRatio * 100 * UPGRADE_WEIGHTS.SMALL_FILE_PRIORITY;

  // SIZE_FIT_PRIORITY: ideal upgrade targets are 1500-5000B
  if (size >= IDEAL_SIZE_MIN && size <= IDEAL_SIZE_MAX) {
    score += 100 * UPGRADE_WEIGHTS.SIZE_FIT_PRIORITY;
  } else if (size < IDEAL_SIZE_MIN) {
    // Files below 1500B are still good but less impactful
    score += 60 * UPGRADE_WEIGHTS.SIZE_FIT_PRIORITY;
  }

  // COMPLEXITY_PRIORITY: files with few exports are simpler to upgrade
  const exportCount = countExports(mod.source);
  if (exportCount <= 3) {
    score += 100 * UPGRADE_WEIGHTS.COMPLEXITY_PRIORITY;
  } else if (exportCount <= 6) {
    score += 70 * UPGRADE_WEIGHTS.COMPLEXITY_PRIORITY;
  }

  // DEPENDENCY_PRIORITY: fewer dependents = safer to upgrade
  const depCount = dependents.length;
  if (depCount === 0) {
    score += 100 * UPGRADE_WEIGHTS.DEPENDENCY_PRIORITY;
  } else if (depCount <= 2) {
    score += 60 * UPGRADE_WEIGHTS.DEPENDENCY_PRIORITY;
  }

  // STALENESS_PRIORITY: files unchanged longest
  if (prevSize && prevSize === size) {
    // File hasn't changed — staleness bonus
    const mtimeAge = Date.now() - mod.mtimeMs;
    const daysSinceChange = mtimeAge / (24 * 60 * 60 * 1000);
    const stalenessBonus = Math.min(100, daysSinceChange * 20);
    score += stalenessBonus * UPGRADE_WEIGHTS.STALENESS_PRIORITY;
  } else {
    // Recently changed — lower priority
    score += 10 * UPGRADE_WEIGHTS.STALENESS_PRIORITY;
  }

  // Penalty if recently upgraded (avoid thrashing)
  if (wasUpgraded) {
    score *= 0.3;
  }

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── Dependency Graph ────────────────────────────────────────────────────────

/**
 * Build a dependency graph from all scanned modules
 * @param {Array<Object>} modules
 * @returns {Object} { moduleName: [dependentModuleNames] }
 */
function buildDependencyGraph(modules) {
  // First pass: map module name -> relative path
  const nameToPath = {};
  for (const mod of modules) {
    nameToPath[mod.name] = mod.path;
  }

  // Second pass: for each module, find what depends on it
  const graph = {};
  for (const mod of modules) {
    graph[mod.name] = [];
  }

  for (const mod of modules) {
    const deps = mod.dependencies || [];
    for (const depPath of deps) {
      // Resolve the dependency to a module name
      const depFull = path.resolve(path.dirname(mod.fullPath), depPath);
      for (const other of modules) {
        const otherNoExt = other.fullPath.replace(/\.js$/, '');
        const depNoExt = depFull.replace(/\.js$/, '');
        if (depNoExt === otherNoExt || depNoExt === other.fullPath) {
          if (!graph[other.name]) graph[other.name] = [];
          if (!graph[other.name].includes(mod.name)) {
            graph[other.name].push(mod.name);
          }
        }
      }
    }
  }

  return graph;
}

// ─── Risk Assessment ─────────────────────────────────────────────────────────

/**
 * Assess the risk level of upgrading a module
 * @param {Object} mod - analyzed module
 * @param {Array} dependents
 * @returns {Object} { level: 'low'|'medium'|'high', reasons: Array<string> }
 */
function assessUpgradeRisk(mod, dependents) {
  const reasons = [];
  let riskScore = 0;

  // Size risk
  if (mod.size > 10000) {
    riskScore += 3;
    reasons.push('Large module (>10KB): higher regression surface');
  } else if (mod.size > 5000) {
    riskScore += 2;
    reasons.push('Medium module (>5KB): moderate regression surface');
  } else {
    reasons.push('Small module (<5KB): low regression surface');
  }

  // Dependency risk
  if (dependents.length > 5) {
    riskScore += 3;
    reasons.push(`Many dependents (${dependents.length}): high cascading impact`);
  } else if (dependents.length > 2) {
    riskScore += 2;
    reasons.push(`Some dependents (${dependents.length}): moderate cascading impact`);
  } else if (dependents.length === 0) {
    reasons.push('No dependents: zero cascading impact');
  }

  // Complexity risk
  const complexity = mod.complexity || { ifStatements: 0, forLoops: 0 };
  if (complexity.ifStatements > 15) {
    riskScore += 2;
    reasons.push(`High branching (${complexity.ifStatements} ifs): logic complexity`);
  }
  if (complexity.forLoops > 5) {
    riskScore += 1;
    reasons.push(`Many loops (${complexity.forLoops}): algorithmic complexity`);
  }

  let level;
  if (riskScore >= 6) level = 'high';
  else if (riskScore >= 3) level = 'medium';
  else level = 'low';

  return { level, score: riskScore, reasons };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Capture environment snapshot
 * @returns {Object}
 */
function captureEnvironmentSnapshot() {
  const now = new Date();
  return {
    timestamp: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    hour: now.getHours(),
    platform: process.platform,
    node: process.version,
    cpuCount: os.cpus().length,
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
    freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
  };
}

/**
 * Dynamically rank upgrade targets by scanning and analyzing the codebase.
 * Returns a prioritized list with risk assessment and upgrade suggestions.
 * @returns {Array<Object>}
 */
function rankUpgradeTargets() {
  const env = captureEnvironmentSnapshot();
  const manifest = loadManifest();
  const history = loadUpgradeHistory();

  // Scan all core modules
  const modules = scanCoreModules();
  if (modules.length === 0) {
    return [{
      target: 'upgrade-proposal',
      reason: 'Cannot scan src/core/ — directory may be inaccessible',
      priority: 0,
      risk: 'unknown',
      confidence: 0,
    }];
  }

  // Read and analyze each module
  const analyzedModules = [];
  for (const mod of modules) {
    let source = '';
    try {
      source = fs.readFileSync(mod.fullPath, 'utf-8');
    } catch {
      source = '';
    }
    mod.source = source;
    mod.dependencies = extractDependencies(source);
    mod.complexity = analyzeComplexity(source);
    mod.complexityScore = computeComplexityScore(mod.complexity);
    mod.exportCount = countExports(source);
    analyzedModules.push(mod);
  }

  // Build dependency graph
  const depGraph = buildDependencyGraph(analyzedModules);

  // Score and rank
  const scored = analyzedModules.map((mod) => {
    const score = scoreUpgradePriority(mod, manifest, history, depGraph);
    const dependents = depGraph[mod.name] || [];
    const risk = assessUpgradeRisk(mod, dependents);
    return {
      target: mod.path,
      name: mod.name,
      size: mod.size,
      lines: mod.complexity.totalLines,
      score,
      risk: risk.level,
      riskScore: risk.score,
      riskReasons: risk.reasons,
      dependents: dependents.length,
      exportCount: mod.exportCount,
      complexityScore: mod.complexityScore,
      ifCount: mod.complexity.ifStatements,
      loopCount: mod.complexity.forLoops,
      funcCount: mod.complexity.functionDeclarations + mod.complexity.arrowFunctions,
      asyncCount: mod.complexity.asyncAwaits,
      suggestedUpgrade: suggestUpgrade(mod, dependents),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Update manifest with current sizes
  const newManifest = loadManifest();
  for (const mod of modules) {
    newManifest.snapshots[mod.name] = mod.size;
  }
  newManifest.lastScan = env.timestamp;
  saveManifest(newManifest);

  return scored;
}

/**
 * Generate an upgrade suggestion based on module analysis
 * @param {Object} mod
 * @param {Array} dependents
 * @returns {string}
 */
function suggestUpgrade(mod, dependents) {
  const suggestions = [];

  // Files that are very small likely need more functionality
  if (mod.size < 2000) {
    suggestions.push('Add real decision logic: file scanning, change detection, dynamic behavior');
  } else if (mod.size < 3500) {
    suggestions.push('Add validation, error classification, or retry strategies');
  } else if (mod.size < 5000) {
    suggestions.push('Add state tracking, diff comparison, or confidence grading');
  }

  // Files with few exports could export more capabilities
  if (mod.exportCount <= 2) {
    suggestions.push('Export additional utility functions for broader integration');
  }

  // Files with no dependencies could benefit from integration
  if (mod.dependencies && mod.dependencies.length === 0) {
    suggestions.push('Consider integrating with related modules for richer functionality');
  }

  // Files with low branching could benefit from more robust decision logic
  if (mod.complexity && mod.complexity.ifStatements <= 2) {
    suggestions.push('Add conditional logic: edge case handling, state validation, error recovery');
  }

  return suggestions.length > 0 ? suggestions.join('; ') : 'Review for completeness';
}

/**
 * Build a complete upgrade proposal
 * @param {number} [topN=5] - number of top targets to include
 * @returns {Object}
 */
function buildUpgradeProposal(topN = 5) {
  const env = captureEnvironmentSnapshot();
  const targets = rankUpgradeTargets();
  const topTargets = targets.slice(0, topN);

  return {
    version: '1.3.0',
    timestamp: env.timestamp,
    env,
    totalModules: targets.length,
    targets: topTargets,
    summary: topTargets.length > 0
      ? `Top target: ${topTargets[0].target} (score: ${topTargets[0].score}/100, risk: ${topTargets[0].risk})`
      : 'No upgrade targets identified',
    recommended: topTargets[0] || null,
  };
}

module.exports = {
  captureEnvironmentSnapshot,
  rankUpgradeTargets,
  buildUpgradeProposal,
  // Exported for external use
  scanCoreModules,
  extractDependencies,
  analyzeComplexity,
  computeComplexityScore,
  assessUpgradeRisk,
  scoreUpgradePriority,
  buildDependencyGraph,
  suggestUpgrade,
};
