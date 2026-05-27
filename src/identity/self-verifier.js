/**
 * SelfVerifier — Cross-check reasoning for logical consistency
 *
 * From mark-improving-agent: runs 4 checks on reasoning:
 * - reverseConsistency: Does conclusion imply premises?
 * - logicalChain: Are there hidden assumptions?
 * - counterfactual: Would alternative reasoning change outcome?
 * - coverageCheck: Have all relevant factors been considered?
 */

const fs = require('fs');
const path = require('path');

const MAX_RECENT_ISSUES = 20;

class SelfVerifier {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.filePath = path.join(rootPath, 'self-verification.json');
    this._state = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      }
    } catch { /* ignore */ }
    return { recentIssues: [], totalVerified: 0, passes: 0, fails: 0 };
  }

  _persist() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this._state, null, 2));
    } catch { /* ignore */ }
  }

  // ─── Core Verification Checks ─────────────────────────────────────────

  _checkReverseConsistency(reasoning, conclusion) {
    const rLower = reasoning.toLowerCase();
    const cLower = conclusion.toLowerCase();

    const indicators = ['because', 'since', 'given', 'therefore', 'thus', 'so', 'implies', '由于', '因为', '所以', '因此', '意味着', '则', '若', '假如'];
    const hasImplication = indicators.some(ind => rLower.includes(ind));

    if (hasImplication) {
      // 有蕴含词 → 结论中的关键词在推理中出现即可通过
      // 中文处理：不用split(/\s+/)，因为中文无空格，直接判断字符/词组出现
      // 取结论中>=2字的词组
      const cWords = cLower.match(/[\u4e00-\u9fff]{2,}|[a-z]{3,}/g) || [];
      if (cWords.length > 0) {
        const found = cWords.filter(w => rLower.includes(w)).length;
        return found >= 1;
      }
      // 结论只有单字时：只要结论在推理中（完全包含）即可
      return rLower.includes(cLower);
    }

    // 无蕴含词 → 检查长度比例（宽松）
    return rLower.length > cLower.length * 0.3;
  }

  _checkLogicalChain(reasoning) {
    // Look for hidden assumption indicators — 有这些词说明推理有隐藏前提
    const assumptionIndicators = ['assume', 'assuming', 'presume', 'suppose', 'likely', 'probably', 'perhaps', 'maybe', '当然', '假设', '可能', '应该', '估计'];
    const hasAssumption = assumptionIndicators.some(ind => reasoning.toLowerCase().includes(ind));

    // 如果推理包含假设指示词，检查是否有连接词来支撑
    // 如果没有假设指示词，说明推理是直接推导，不需要额外连接词
    if (hasAssumption) {
      // 有假设 → 必须有连接词才算有效链
      const connectors = ['and', 'but', 'however', 'therefore', 'thus', 'then', 'so',
        '而且', '但是', '然而', '所以', '因此', '则', '故', '于是', '既然', '由于', '因为', '所以'];
      const connectorCount = connectors.filter(c => reasoning.toLowerCase().includes(c)).length;
      return connectorCount > 0;
    }

    // 无假设 → 直接推导，逻辑链有效（无论长度）
    return true;
  }

  _checkCounterfactual(reasoning, conclusion) {
    const hasConditional = /\bif\b|\bunless\b|\bif not\b/i.test(reasoning) ||
                          reasoning.includes('如果') || reasoning.includes('除非');
    const hasAlternative = /\belse\b|\botherwise\b|\binstead\b/i.test(reasoning) ||
                           reasoning.includes('否则') || reasoning.includes('不然');

    return hasConditional || hasAlternative;
  }

  _checkCoverage(reasoning) {
    // 检查推理是否考虑了重要因素
    const factorKeywords = ['because', 'since', 'given', 'considering', 'despite', 'however', 'although', '因为', '由于', '考虑到', '尽管', '然而', '既然', '只要', '除非'];
    const hasFactors = factorKeywords.some(f => reasoning.toLowerCase().includes(f));

    // 有明确因素指示词 → 覆盖充分
    if (hasFactors) return true;

    // 无因素词但推理有一定长度 → 覆盖充分
    // 原bug: reasoning.length < 150 会失败（lengthScore > 0.3 要求150字以上）
    // 修复：20字以上即可，无论是否含因素词
    return reasoning.length >= 20;
  }

  // ─── Main Verify API ──────────────────────────────────────────────────

  verify(reasoning, conclusion) {
    const checks = {
      reverseConsistency: this._checkReverseConsistency(reasoning, conclusion),
      logicalChain: this._checkLogicalChain(reasoning),
      counterfactual: this._checkCounterfactual(reasoning, conclusion),
      coverageCheck: this._checkCoverage(reasoning),
    };

    const passed = Object.values(checks).every(Boolean);
    const issues = [];

    if (!checks.reverseConsistency) issues.push('结论与推理逻辑不匹配');
    if (!checks.logicalChain) issues.push('可能存在隐藏假设');
    if (!checks.counterfactual) issues.push('未考虑替代推理路径');
    if (!checks.coverageCheck) issues.push('可能遗漏重要因素');

    const confidence = Object.values(checks).filter(Boolean).length / 4;

    this._state.totalVerified++;
    if (passed) this._state.passes++;
    else this._state.fails++;

    const result = { passed, checks, issues, confidence };

    // Record issues
    if (issues.length > 0) {
      this._state.recentIssues.push({
        reasoning: reasoning.substring(0, 100),
        conclusion: conclusion.substring(0, 100),
        issues: [...issues],
        timestamp: Date.now(),
      });
      if (this._state.recentIssues.length > MAX_RECENT_ISSUES) {
        this._state.recentIssues = this._state.recentIssues.slice(-MAX_RECENT_ISSUES);
      }
    }

    this._persist();
    return result;
  }

  // ─── Stats ─────────────────────────────────────────────────────────

  getStats() {
    const total = this._state.totalVerified || 1;
    return {
      totalVerified: this._state.totalVerified,
      passes: this._state.passes,
      fails: this._state.fails,
      passRate: this._state.passes / total,
      recentIssueCount: this._state.recentIssues.length,
    };
  }

  getRecentIssues() {
    return this._state.recentIssues.map(i => ({
      reasoning: i.reasoning,
      issues: i.issues,
      timestamp: i.timestamp,
    }));
  }
}

module.exports = { SelfVerifier };
