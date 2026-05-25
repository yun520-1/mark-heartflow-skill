/**
 * 假设测试器 - 提取和验证声明的真实性
 */
const hypothesisTester = {
  // 提取文本中所有可验证的声明
  extractClaims(text) {
    const claims = [];

    // 学术引用
    const citations = text.match(/\[@\w+.*?\]|\([A-Z][a-z]+,\s*\d{4}\)/g) || [];

    // 百分比声明
    const percentages = text.match(/\b\d+%|\b\d+\.\d+%/g) || [];

    // 具体数字（>1000 的数字通常需要验证）
    const numbers = text.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];

    // 日期声明
    const dates = text.match(/\b(?:19|20)\d{2}[-/年](?:0[1-9]|1[0-2])?[-/月]?(?:0[1-9]|[12]\d|3[01])?[日]?\b/g) || [];

    // 技术术语准确性（简单检查）
    const techTerms = text.match(/\b(?:API|GPU|CPU|RAM|ROM)\b/g) || [];

    return {
      citations: [...new Set(citations)],
      percentages: [...new Set(percentages)],
      numbers: [...new Set(numbers)],
      dates: [...new Set(dates)],
      techTerms: [...new Set(techTerms)],
      hasUnverified: citations.length === 0 && (percentages.length > 0 || numbers.length > 0)
    };
  },

  // 评估声明置信度
  assessConfidence(text, context = {}) {
    const claims = this.extractClaims(text);
    let score = 0.5; // 基础分

    // 有学术引用 +0.3
    if (claims.citations.length > 0) score += 0.3;

    // 有百分比 +0.1
    if (claims.percentages.length > 0) score += 0.1;

    // 用户已确认 +0.2
    if (context.userVerified) score += 0.2;

    // 有外部来源 +0.2
    if (context.hasExternalSource) score += 0.2;

    // 包含"不确定"词 -0.2
    if (/大概|可能|也许|probably|might|maybe/i.test(text)) score -= 0.2;

    score = Math.min(1, Math.max(0, score));

    let level;
    if (score >= 0.8) level = 'high';
    else if (score >= 0.5) level = 'medium';
    else level = 'low';

    return { score: Math.round(score * 100) / 100, level, annotation: `[${level}]` };
  },

  // 为声明生成未核实标记
  markUnverified(claims) {
    if (!claims.hasUnverified) return '';
    return ' ⚠️[未核实]';
  },

  // 格式化输出：每个声明及置信度
  formatAnnotations(text) {
    const claims = this.extractClaims(text);
    const parts = [];

    if (claims.citations.length > 0) {
      parts.push(`学术引用 ${claims.citations.length} 处 [high]`);
    }
    if (claims.percentages.length > 0) {
      parts.push(`百分比 ${claims.percentages.join(', ')}`);
    }
    if (claims.numbers.length > 0) {
      parts.push(`数据 ${claims.numbers.slice(0, 2).join(', ')}`);
    }
    if (claims.hasUnverified) {
      parts.push('存在未核实数据 ⚠️[unverified]');
    }

    return parts.length > 0 ? parts.join(' | ') : null;
  }
};

module.exports = { hypothesisTester };
