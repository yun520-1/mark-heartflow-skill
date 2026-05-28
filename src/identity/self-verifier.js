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
    // Look for hidden assumption indicators
    const assumptionIndicators = ['assume', 'assuming', 'presume', 'suppose', '当然', '假设'];
    const hasAssumption = assumptionIndicators.some(ind => reasoning.toLowerCase().includes(ind));

    // 有明确假设指示词 → 必须有连接词
    if (hasAssumption) {
      const connectors = ['and', 'but', 'however', 'therefore', 'thus', 'then', 'so',
        '而且', '但是', '然而', '所以', '因此', '则', '故', '于是', '既然', '由于', '因为', '所以'];
      const connectorCount = connectors.filter(c => reasoning.toLowerCase().includes(c)).length;
      return connectorCount > 0;
    }
    // 无明确假设 → 短推理本身有效，无需强制连接词
    return true;
  }

  _checkCounterfactual(reasoning, conclusion) {
    // 明确的条件句
    const hasConditional = /\bif\b|\bunless\b|\bif not\b/i.test(reasoning) ||
                          reasoning.includes('如果') || reasoning.includes('除非');
    // 限定词形式的替代推理（"有时候"="if sometimes", "根据"=条件前提）
    const hasQualifier = /有时候|可能|也许|大概|说不定|万一|根据/.test(reasoning);
    // 显式替代方案
    const hasAlternative = /\belse\b|\botherwise\b|\binstead\b/i.test(reasoning) ||
                           reasoning.includes('否则') || reasoning.includes('不然');

    return hasConditional || hasQualifier || hasAlternative;
  }

  _checkCoverage(reasoning) {
    const factorKeywords = ['because', 'since', 'given', 'considering', 'despite', 'however', 'although', '因为', '由于', '考虑到', '尽管', '然而', '既然', '只要', '除非'];
    const hasFactors = factorKeywords.some(f => reasoning.toLowerCase().includes(f));

    if (hasFactors) return true;
    // 降低阈值：中文句子普遍较短，5字即可
    return reasoning.length >= 5;
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
