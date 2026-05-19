/**
 * TruthfulnessChecker — Avoid lying, no hedging, evidence-based conclusions
 *
 * From mark-improving-agent: "结论必须有证据，没证据就承认不知道，绝不编数字"
 * Detects absolute words without evidence, records lies, tracks lying rate.
 */

const fs = require('fs');
const path = require('path');

class TruthfulnessChecker {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filePath = path.join(rootPath, 'truthfulness-stats.json');
    this._state = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch { /* ignore */ }
    return { totalStatements: 0, liesCaught: 0, statements: [] };
  }

  _persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this._state, null, 2));
    } catch { /* ignore */ }
  }

  // ─── Detection ────────────────────────────────────────────────────────

  /**
   * Check if a statement is potentially lying or hedging
   */
  checkStatement(statement) {
    this._state.totalStatements++;

    let isLying = false;
    let reason = '';

    const absWords = ['肯定', '绝对', '一定', '必然', '毫无疑问', '绝对确定', '绝对是', '100%', '全部', '所有'];
    const evidenceWords = ['因为', '证据', '根据', '数据显示', '研究表明', '实践证明', '事实表明', '观察发现'];

    const hasAbs = absWords.some(w => statement.includes(w));
    const hasEvidence = evidenceWords.some(w => statement.includes(w));

    // Absolute words without evidence = potential lie
    if (hasAbs && !hasEvidence) {
      isLying = true;
      reason = '使用了绝对词但无证据支持';
    }

    // Check for fabricated numbers
    const numMatch = statement.match(/\d+%|\d+次|\d+个|\d+人/);
    if (numMatch && !hasEvidence) {
      isLying = true;
      reason = '陈述包含数字但无证据支持';
    }

    // Check for hedge words (less severe)
    const hedgeWords = ['可能', '也许', '大概', '应该', '或许', '似乎', '好像'];
    const hasHedge = hedgeWords.some(w => statement.includes(w));
    const confidence = hasHedge ? 0.4 : (hasEvidence ? 0.9 : 0.6);

    if (isLying) {
      this._state.liesCaught++;
    }

    // Record statement
    this._state.statements.push({
      text: statement.substring(0, 200),
      isLying,
      reason,
      timestamp: Date.now(),
    });

    // Keep last 100 statements
    if (this._state.statements.length > 100) {
      this._state.statements = this._state.statements.slice(-100);
    }

    this._persist();

    return { isLying, confidence, reason };
  }

  /**
   * Annotate confidence level to statement
   */
  annotateConfidence(statement, confidence) {
    if (confidence < 0.5) {
      return statement + ' [置信度: 低]';
    } else if (confidence < 0.8) {
      return statement + ' [置信度: 中]';
    }
    return statement;
  }

  /**
   * Record a lie that was caught externally
   */
  recordLie(statement, context) {
    this._state.liesCaught++;
    this._state.totalStatements++;
    this._state.statements.push({
      text: statement.substring(0, 200),
      isLying: true,
      reason: context || '外部确认',
      timestamp: Date.now(),
    });
    this._persist();
    return { liesCaught: this._state.liesCaught };
  }

  // ─── Stats ─────────────────────────────────────────────────────────

  getLyingStats() {
    const total = this._state.totalStatements || 1;
    return {
      totalStatements: this._state.totalStatements,
      liesCaught: this._state.liesCaught,
      lieRate: this._state.liesCaught / total,
    };
  }

  getRecentStatements(limit = 10) {
    return this._state.statements.slice(-limit);
  }

  getStats() {
    return this.getLyingStats();
  }
}

module.exports = { TruthfulnessChecker };
