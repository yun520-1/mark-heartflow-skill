/**
 * Verifier — 跨域结论验证器
 *
 * 复用:
 *  - src/reasoning/fact-checker.js
 *  - src/reasoning/counterfactual-engine.js / counterfactual-verifier.js
 *
 * 职责:
 *  - 对跨域推理结论做可验证主张提取后的核验
 *  - 用 factChecker 校验主张的事实性
 *  - 用 counterfactualVerifier 校验结论的决策/逻辑稳定性
 *  - 输出拦截信号：verified / confidence / issues / recommendation
 */

const { factChecker } = require('./fact-checker.js');

function _tryRequire(p) {
  try {
    const m = require(p);
    return typeof m === 'function' ? m() : m;
  } catch (e) {
    return null;
  }
}

class Verifier {
  /**
   * @param {object} [options]
   * @param {object} [options.factChecker] - factChecker instance or module
   * @param {object} [options.counterfactualVerifier] - CounterfactualVerifier instance or module
   */
  constructor(options = {}) {
    this.factChecker = options.factChecker || factChecker;
    this.counterfactualVerifier = null;
    this.stats = {
      totalVerifications: 0,
      passed: 0,
      failed: 0,
      intercepted: 0,
    };

    const cfModule = _tryRequire('./counterfactual-verifier.js');
    if (cfModule && cfModule.CounterfactualVerifier) {
      this.counterfactualVerifier = new cfModule.CounterfactualVerifier();
    }

    // 懒初始化 counterfactualVerifier 的 init
    if (this.counterfactualVerifier && typeof this.counterfactualVerifier.init === 'function') {
      this.counterfactualVerifier.init().catch(() => {});
    }
  }

  /**
   * 验证跨域推理结论
   * @param {object} conclusion - 结论对象
   * @param {string} conclusion.text - 结论文本
   * @param {string} [conclusion.summary] - 可选的摘要主张
   * @param {Array<object>} [conclusion.claims] - 已提取的可验证主张
   * @param {Array<object>} [conclusion.alternatives] - 备选结论
   * @param {object} [context] - 验证上下文
   * @param {string} context.fromDomain
   * @param {string} context.toDomain
   * @param {string} context.mode - 'analogical' | 'causal'
   * @param {string} [context.chainId]
   * @returns {Promise<object>}
   */
  async verifyCrossDomainConclusion(conclusion = {}, context = {}) {
    this.stats.totalVerifications++;
    const issues = [];
    const factResults = [];
    let overallConfidence = 0.6;

    const text = conclusion.text || conclusion.summary || '';
    if (!text) {
      issues.push({ type: 'missing_text', severity: 'high', detail: '结论缺少可验证文本' });
    }

    // 1. 对结论文本做事实核验
    if (text) {
      try {
        const factResult = await this.factChecker.checkFact(text);
        factResults.push(factResult);
        if (factResult.isLying) {
          issues.push({
            type: 'fact_absolutism',
            severity: 'high',
            detail: factResult.reason || factResult.note || '检测到绝对化/可疑表述',
            result: factResult,
          });
        }
        if (factResult.isHollow) {
          issues.push({
            type: 'fact_hollow',
            severity: 'medium',
            detail: factResult.reason || factResult.note || '检测到空洞概括',
            result: factResult,
          });
        }
        if (factResult.isDichotomy) {
          issues.push({
            type: 'fact_dichotomy',
            severity: 'medium',
            detail: factResult.reason || factResult.note || '检测到虚假二元对立',
            result: factResult,
          });
        }
        if (factResult.checked && !factResult.isLying && !factResult.isHollow && !factResult.isDichotomy) {
          overallConfidence = Math.min(1, overallConfidence + 0.05);
        }
      } catch (e) {
        issues.push({ type: 'fact_check_error', severity: 'medium', detail: e.message });
      }
    }

    // 2. 对结论中的具体主张逐一核验
    const claims = Array.isArray(conclusion.claims) ? conclusion.claims : [];
    for (const claim of claims) {
      const claimText = claim.text || claim.value || claim.summary || '';
      if (!claimText) continue;
      try {
        const claimFact = await this.factChecker.checkFact(claimText);
        factResults.push(claimFact);
        if (claimFact.isLying || claimFact.isHollow || claimFact.isDichotomy) {
          issues.push({
            type: 'claim_issue',
            severity: claimFact.isLying ? 'high' : 'medium',
            detail: `主张异常: ${claimText}`,
            claim: claimText,
            result: claimFact,
          });
        }
      } catch (e) {
        issues.push({ type: 'claim_check_error', severity: 'low', detail: e.message, claim: claimText });
      }
    }

    // 3. 反事实验证：检查结论是否排除了明显更优的替代方案
    let counterfactualResult = null;
    if (this.counterfactualVerifier && conclusion.alternatives && conclusion.alternatives.length > 0) {
      try {
        const decision = {
          conclusion: text,
          confidence: overallConfidence,
          evidence: factResults.filter(r => r.checked),
        };
        counterfactualResult = this.counterfactualVerifier.verify(decision, conclusion.alternatives, {
          domain: context.toDomain || 'unknown',
          stakes: 'medium',
          timePressure: false,
        });
        if (!counterfactualResult.verified) {
          issues.push({
            type: 'counterfactual_margin_low',
            severity: 'medium',
            detail: counterfactualResult.recommendation || '反事实验证未通过',
            result: counterfactualResult,
          });
        }
        overallConfidence = Math.max(0, overallConfidence * (counterfactualResult.confidence || 0.8));
      } catch (e) {
        issues.push({ type: 'counterfactual_error', severity: 'low', detail: e.message });
      }
    }

    const hasHighIssues = issues.some(i => i.severity === 'high');
    const verified = !hasHighIssues;
    const confidence = Math.max(0, Math.min(1, overallConfidence));

    if (!verified) {
      this.stats.intercepted++;
      this.stats.failed++;
    } else {
      this.stats.passed++;
    }

    return {
      verified,
      confidence,
      mode: context.mode || 'unknown',
      fromDomain: context.fromDomain,
      toDomain: context.toDomain,
      chainId: context.chainId || null,
      issues,
      factResults,
      counterfactualResult,
      recommendation: this._recommendation(verified, issues, confidence),
      stats: this.getStats(),
    };
  }

  /**
   * 批量验证
   * @param {Array<object>} conclusions
   * @param {object} sharedContext
   * @returns {Promise<Array<object>>}
   */
  async batchVerify(conclusions = [], sharedContext = {}) {
    return Promise.all(conclusions.map(c => this.verifyCrossDomainConclusion(c, sharedContext)));
  }

  _recommendation(verified, issues, confidence) {
    if (!verified) {
      return 'reject_or_request_more_evidence';
    }
    if (confidence < 0.5) {
      return 'gather_more_evidence';
    }
    if (confidence < 0.75) {
      return 'challenge_assumptions';
    }
    return 'accept';
  }

  getStats() {
    return {
      ...this.stats,
      passRate: this.stats.totalVerifications > 0
        ? this.stats.passed / this.stats.totalVerifications
        : 0,
    };
  }
}

module.exports = { Verifier };
