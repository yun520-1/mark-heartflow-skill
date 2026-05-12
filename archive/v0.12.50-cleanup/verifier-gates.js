/**
 * HeartFlow Verifier Gates v2
 * 心虫知行合一五门验证系统 · 真实执行版
 *
 * Based on: Ouro Loop modules/verify.md (MIT, VictorVVedtion/ouro-loop)
 * Enhanced with: require.resolve() for real EXIST gate
 *
 * 五门验证：
 * 1. EXIST   — 用 require.resolve() 真实检查文件/模块存在
 * 2. RELEVANCE — 防偏离：检查变更文件是否在计划范围内
 * 3. ROOT_CAUSE — 防循环：统计相同错误模式
 * 4. RECALL  — 防遗忘：检查是否重读了约束文件
 * 5. MOMENTUM — 防空转：真实读/写比例
 */

const fs = require('fs');
const path = require('path');

const MOMENTUM_RATIO_THRESHOLD = 3;
const SAME_ERROR_THRESHOLD = 3;

class VerifierGates {
  constructor(options = {}) {
    this.repoRoot = options.repoRoot || path.join(__dirname, '../..');
    this.repoRoot = path.resolve(this.repoRoot);
    this.actions = [];
    this.errors = [];
    this.filesRead = new Set();
    this.filesWritten = new Set();
    this.filesVerified = new Set();
    this.constraints = options.constraints || [];
    this.taskGoal = options.taskGoal || '';
    this.planScope = options.planScope || [];
    this.boundFiles = options.boundFiles || []; // DANGER ZONE files
  }

  // ── 工具方法 ──────────────────────────────────────────

  _resolveFile(filePath) {
    if (!filePath) return null;
    // 绝对路径
    if (filePath.startsWith('/')) {
      return fs.existsSync(filePath) ? filePath : null;
    }
    // 相对路径或裸路径 (src/xxx 或 ./xxx)
    const candidates = [
      path.resolve(this.repoRoot, filePath),
      path.resolve(this.repoRoot, './' + filePath),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    // 模块名
    try {
      const resolved = require.resolve(filePath, { paths: [this.repoRoot] });
      return resolved;
    } catch {
      return null;
    }
  }

  _getFileFunctions(filePath) {
    // 读取文件，返回所有 function/class 声明名
    if (!filePath || !fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const functions = [];
      // function declarations
      const funcMatch = content.matchAll(/(?:function|class|const|let|var)\s+(\w+)\s*(?:=|:|\()/g);
      for (const m of funcMatch) functions.push(m[1]);
      // arrow functions with name: const x = () => {}
      const arrowMatch = content.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g);
      for (const m of arrowMatch) functions.push(m[1]);
      return [...new Set(functions)];
    } catch {
      return [];
    }
  }

  // ── Gate 1: EXIST ────────────────────────────────────

  /**
   * 真实检查文件/模块/函数是否存在
   * references: [{ type: 'file'|'module'|'function', path: string }]
   */
  checkExist(references = []) {
    const results = [];
    const failures = [];

    for (const ref of references) {
      let exists = false;
      let resolved = null;

      if (ref.type === 'file') {
        resolved = this._resolveFile(ref.path);
        exists = resolved !== null;
      } else if (ref.type === 'module') {
        try {
          resolved = require.resolve(ref.path, { paths: [this.repoRoot] });
          exists = true;
        } catch {
          exists = false;
        }
      } else if (ref.type === 'function') {
        // Check if function exists in any known JS file
        const knownFiles = Array.from(this.filesRead);
        if (knownFiles.length === 0) {
          // Try scanning repo for the function
          knownFiles.push(...this._findFilesWithFunction(ref.path));
        }
        exists = knownFiles.length > 0;
        if (exists) resolved = knownFiles[0];
      }

      results.push({ ref: ref.path, type: ref.type, exists, resolved });
      if (!exists) failures.push(ref.path);
      else this.filesVerified.add(ref.path);
    }

    let firstResolved = null;
    for (const r of results) {
      if (r.resolved) { firstResolved = r.resolved; break; }
    }

    return {
      gate: 'EXIST',
      question: 'Do all referenced files, modules, and functions actually exist?',
      verdict: failures.length === 0 ? 'PASS' : 'FAIL',
      failures,
      resolved: firstResolved,
      total: references.length,
      passCount: references.length - failures.length
    };
  }

  _findFilesWithFunction(funcName) {
    const found = [];
    const searchIn = [this.repoRoot];
    const skipDirs = ['node_modules', '.git', 'archive', 'docs'];

    for (const dir of searchIn) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!skipDirs.some(s => entry.name.includes(s))) {
              searchIn.push(path.join(dir, entry.name));
            }
          } else if (entry.isFile() && entry.name.endsWith('.js')) {
            const filePath = path.join(dir, entry.name);
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.includes(`function ${funcName}`) ||
                  content.includes(`class ${funcName}`) ||
                  content.includes(`${funcName} =`) ||
                  content.includes(`${funcName}:`)) {
                found.push(filePath);
              }
            } catch {}
          }
        }
      } catch {}
    }
    return found;
  }

  // ── Gate 2: RELEVANCE ─────────────────────────────────

  checkRelevance() {
    if (this.filesWritten.size === 0) {
      return { gate: 'RELEVANCE', verdict: 'PASS', reason: 'No files written yet' };
    }

    if (this.planScope.length === 0) {
      // 无计划范围，检查是否在 DANGER ZONE
      const inDangerZone = [];
      for (const written of this.filesWritten) {
        for (const danger of this.boundFiles) {
          if (written.includes(danger)) {
            inDangerZone.push({ file: written, danger });
          }
        }
      }
      if (inDangerZone.length > 0) {
        return {
          gate: 'RELEVANCE',
          verdict: 'FAIL',
          reason: `${inDangerZone.length} file(s) in DANGER ZONE without plan`,
          violations: inDangerZone
        };
      }
      return { gate: 'RELEVANCE', verdict: 'PASS', reason: 'No plan scope, no DANGER ZONE violations' };
    }

    const outOfScope = [];
    for (const written of this.filesWritten) {
      const fileName = path.basename(written);
      const inScope = this.planScope.some(scope => {
        if (typeof scope === 'string') return fileName === scope || fileName.includes(scope);
        if (scope.regex) return new RegExp(scope.regex).test(fileName);
        return false;
      });
      if (!inScope) outOfScope.push(written);
    }

    return {
      gate: 'RELEVANCE',
      verdict: outOfScope.length === 0 ? 'PASS' : 'FAIL',
      outOfScope,
      inScope: this.filesWritten.size - outOfScope.length
    };
  }

  // ── Gate 3: ROOT_CAUSE ─────────────────────────────────

  checkRootCause() {
    if (this.errors.length < 2) {
      return { gate: 'ROOT_CAUSE', verdict: 'PASS', reason: 'Few errors, no repeated pattern' };
    }

    // 数字归一化后统计相同错误
    const errorCounts = {};
    for (const err of this.errors) {
      const key = err.replace(/\d+/g, 'N').replace(/[^\w]/g, '_');
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }

    const repeated = Object.entries(errorCounts)
      .filter(([_, count]) => count >= SAME_ERROR_THRESHOLD)
      .map(([err]) => err);

    if (repeated.length > 0) {
      return {
        gate: 'ROOT_CAUSE',
        verdict: 'FAIL',
        reason: `Same error pattern ${SAME_ERROR_THRESHOLD}+ times`,
        repeatedPatterns: repeated,
        isSymptomFixing: true
      };
    }

    return {
      gate: 'ROOT_CAUSE',
      verdict: 'PASS',
      reason: 'Errors appear addressed at root level'
    };
  }

  // ── Gate 4: RECALL ─────────────────────────────────────

  checkRecall() {
    if (this.constraints.length === 0 || !this.taskGoal) {
      return { gate: 'RECALL', verdict: 'N/A', reason: 'No constraints defined' };
    }

    const recentActions = this.actions.slice(-10);
    const recentReads = recentActions.filter(a => a.type === 'read').map(a => a.target).join(' ');

    // 检查是否重读了约束文件
    const constraintFiles = this.constraints
      .filter(c => typeof c === 'object' && c.file)
      .map(c => c.file);

    let reReadConstraint = false;
    let goalRecallRatio = '0/0';
    for (const cf of constraintFiles) {
      if (recentReads.includes(cf) || recentReads.includes(path.basename(cf))) {
        reReadConstraint = true;
        break;
      }
    }

    // 检查任务目标是否还在上下文中
    const recentContent = recentActions.map(a => a.target || '').join(' ');
    const goalKeywords = this.taskGoal.split(' ').filter(w => w.length > 4);
    const goalRecall = goalKeywords.filter(kw => recentContent.includes(kw)).length;

    if (!reReadConstraint && recentActions.length >= 5 && goalRecall < goalKeywords.length * 0.3) {
      return {
        gate: 'RECALL',
        verdict: 'WARN',
        reason: 'No constraint re-read detected, goal recall low',
        constraintReRead: false,
        goalRecallRatio: `${goalRecall}/${goalKeywords.length}`
      };
    }

    return {
      gate: 'RECALL',
      verdict: 'PASS',
      taskGoal: this.taskGoal,
      constraintReRead: reReadConstraint,
      goalRecallRatio: `${goalRecall}/${goalKeywords.length}`
    };
  }

  // ── Gate 5: MOMENTUM ──────────────────────────────────

  checkMomentum() {
    const reads = this.filesRead.size;
    const writes = this.filesWritten.size;

    if (reads === 0) {
      return { gate: 'MOMENTUM', verdict: 'PASS', reason: 'No reads yet' };
    }

    const ratio = reads / Math.max(writes, 1);

    if (ratio > MOMENTUM_RATIO_THRESHOLD) {
      return {
        gate: 'MOMENTUM',
        verdict: 'FAIL',
        ratio: ratio.toFixed(2),
        threshold: MOMENTUM_RATIO_THRESHOLD,
        reason: `Read/Write ${ratio.toFixed(1)}:1 exceeds ${MOMENTUM_RATIO_THRESHOLD}:1`,
        reads,
        writes
      };
    }

    return {
      gate: 'MOMENTUM',
      verdict: 'PASS',
      ratio: ratio.toFixed(2),
      reads,
      writes
    };
  }

  // ── 记录动作 ────────────────────────────────────────────

  recordAction(action) {
    this.actions.push({ ...action, timestamp: Date.now() });
    if (action.type === 'read') this.filesRead.add(action.target);
    if (action.type === 'write' || action.type === 'edit') this.filesWritten.add(action.target);
    if (action.type === 'error') this.errors.push(action.target);
  }

  // ── 批量检查文件存在（主动检查版）────────────────────

  /**
   * 扫描代码中的 import/require，引用的文件是否真实存在
   */
  scanImportsInFile(filePath) {
    if (!fs.existsSync(filePath)) return { imports: [], missing: [] };

    const content = fs.readFileSync(filePath, 'utf8');
    // Remove single-line comments
    const cleanContent = content.replace(/\/\/.*$/gm, '');
    const imports = [];

    // require('...')
    const requireMatches = cleanContent.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
    for (const m of requireMatches) {
      imports.push({ type: 'module', path: m[1], raw: m[0] });
    }

    // import ... from '...'
    const importMatches = cleanContent.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    for (const m of importMatches) {
      imports.push({ type: 'module', path: m[1], raw: m[0] });
    }

    // Check existence
    const missing = [];
    for (const imp of imports) {
      if (imp.path.startsWith('.') || imp.path.startsWith('/')) {
        const resolved = this._resolveFile(imp.path);
        if (!resolved) missing.push(imp);
      }
      // npm modules skip (require.resolve handles these)
    }

    return { imports, missing };
  }

  /**
   * 验证一个文件的所有引用都存在
   */
  verifyFile(filePath) {
    const { missing } = this.scanImportsInFile(filePath);
    if (missing.length > 0) {
      return {
        file: filePath,
        verdict: 'FAIL',
        missingRefs: missing.map(m => m.path)
      };
    }
    return { file: filePath, verdict: 'PASS' };
  }

  // ── 运行全部 ────────────────────────────────────────────

  runAll(references = []) {
    const g1 = references.length > 0 ? this.checkExist(references) : this.checkExist([]);
    const g2 = this.checkRelevance();
    const g3 = this.checkRootCause();
    const g4 = this.checkRecall();
    const g5 = this.checkMomentum();

    const gates = [g1, g2, g3, g4, g5];
    const passed = gates.filter(g => g.verdict === 'PASS').length;
    const failed = gates.filter(g => g.verdict === 'FAIL').length;
    const warnings = gates.filter(g => g.verdict === 'WARN').length;

    return {
      timestamp: new Date().toISOString(),
      totalGates: 5,
      passed,
      failed,
      warnings,
      verdict: failed > 0 ? 'FAIL' : warnings > 0 ? 'WARN' : 'PASS',
      gates,
      actions: { reads: this.filesRead.size, writes: this.filesWritten.size, errors: this.errors.length }
    };
  }

  formatReport(result) {
    const lines = [];
    lines.push('════════════════════════════════════════');
    lines.push('  心虫知行合一 · 五门验证报告 v2');
    lines.push('════════════════════════════════════════');
    lines.push('');
    lines.push(`判定: ${result.verdict} (${result.passed}/${result.totalGates} 通过)`);
    lines.push('');
    lines.push('门次  结果  详情');
    lines.push('────────────────────────────────────────');

    const names = ['EXIST', 'RELEVANCE', 'ROOT_CAUSE', 'RECALL', 'MOMENTUM'];
    result.gates.forEach((g, i) => {
      const icon = g.verdict === 'PASS' ? '✓' : g.verdict === 'FAIL' ? '✗' : '⚠';
      lines.push(`${names[i]}  ${icon}     ${g.reason || g.verdict}`);
      if (g.failures?.length) lines.push(`        missing: ${g.failures.join(', ')}`);
      if (g.outOfScope?.length) lines.push(`        out-of-scope: ${g.outOfScope.join(', ')}`);
    });

    lines.push('');
    lines.push(`读/写: ${result.actions.reads}/${result.actions.writes}`);
    lines.push(`错误数: ${result.actions.errors}`);
    lines.push('');

    if (result.verdict === 'FAIL') lines.push('✗ 知行不合一');
    else if (result.verdict === 'WARN') lines.push('⚠ 知行待验证');
    else lines.push('✓ 知行合一');

    return lines.join('\n');
  }
}

module.exports = { VerifierGates };
