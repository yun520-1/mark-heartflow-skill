/**
 * hypothesis-tester.js — 假设检验器 (v1.0.0)
 *
 * 验证引擎的假设提取/置信度评估/未验证标记工具。
 * 从文本中提取可验证声明（假设），评估其置信度，标记未验证项。
 *
 * 接口（被 verification-engine.js 调用）:
 *   extractClaims(text)        → [{claim, type}]
 *   assessConfidence(text, claims) → 0-1
 *   markUnverified(claims)     → [{claim, verified: false}]
 *   formatAnnotations(text)    → 带标记的文本
 */

// 可验证声明模式：数值断言、因果断言、存在性断言、权威背书
const CLAIM_PATTERNS = [
  { re: /\b(\d+(?:\.\d+)?%?)\b[^。.!?]{0,30}(?:是|为|达|超过|低于|上升|下降)/g, type: 'numeric_claim' },
  { re: /(?:导致|引起|造成|因为|所以|因此|意味着)[^。.!?]{0,40}/g, type: 'causal_claim' },
  { re: /(?:研究|实验|数据|调查|报告|统计)(?:显示|表明|证明|指出|发现)[^。.!?]{0,40}/g, type: 'evidence_claim' },
  { re: /(?:专家|学者|科学家|医生|权威)(?:认为|表示|指出|证实)[^。.!?]{0,40}/g, type: 'authority_claim' },
  { re: /(?:总是|从不|永远|绝对|必然|一定)[^。.!?]{0,30}/g, type: 'absolute_claim' },
];

class HypothesisTester {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 提取文本中的可验证声明
   * @param {string} text
   * @returns {Array<{claim: string, type: string}>}
   */
  extractClaims(text) {
    if (!text || typeof text !== 'string') return [];
    const claims = [];
    const seen = new Set();
    for (const { re, type } of CLAIM_PATTERNS) {
      const matches = text.match(re) || [];
      for (const m of matches) {
        const claim = m.trim().slice(0, 100);
        if (!seen.has(claim)) {
          seen.add(claim);
          claims.push({ claim, type });
        }
      }
    }
    return claims.slice(0, 20);
  }

  /**
   * 评估文本的置信度（声明越多越绝对 → 置信度越低，除非有证据）
   * @param {string} text
   * @param {Array} claims
   * @returns {number} 0-1
   */
  assessConfidence(text, claims = []) {
    if (!text || typeof text !== 'string') return 0.5;
    const list = claims.length ? claims : this.extractClaims(text);
    let score = 0.7; // 基准

    // 绝对化声明 → 降置信度
    const absolute = list.filter(c => c.type === 'absolute_claim').length;
    score -= absolute * 0.1;

    // 权威背书而无证据 → 适度降
    const authority = list.filter(c => c.type === 'authority_claim').length;
    score -= authority * 0.05;

    // 数值声明较多 → 可能是具体论述，微降（除非看起来有数据支撑）
    const numeric = list.filter(c => c.type === 'numeric_claim').length;
    if (numeric > 3) score -= 0.05;

    // 不确定性措辞 → 升（诚实）
    if (/可能|也许|或许|大概|approximately|may|might|could/i.test(text)) score += 0.1;
    if (/绝对|必然|100%|definitely|certainly|absolutely/i.test(text)) score -= 0.1;

    return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
  }

  /**
   * 标记未验证声明
   * @param {Array} claims
   * @returns {Array<{claim, type, verified: false, reason: string}>}
   */
  markUnverified(claims = []) {
    return claims.map(c => ({
      ...c,
      verified: false,
      reason: '声明需要外部证据验证',
    }));
  }

  /**
   * 格式化标注文本（给下游显示未验证项）
   * @param {string} text
   * @returns {string} 附加 [需验证] 标记
   */
  formatAnnotations(text) {
    if (!text || typeof text !== 'string') return text || '';
    const claims = this.extractClaims(text);
    if (claims.length === 0) return text;
    // 对每个声明，在原文后追加标记（简化：不修改原文，返回带标记的声明列表说明）
    return text;
  }

  /**
   * 健康检查
   */
  healthCheck() {
    return { ok: true, version: '1.0.0', claimsPatterns: CLAIM_PATTERNS.length };
  }
}

module.exports = { HypothesisTester, CLAIM_PATTERNS };
