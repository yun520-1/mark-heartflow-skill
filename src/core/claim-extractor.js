/**
 * 声明提取器 - 从文本中提取可验证的声明
 */
const claimExtractor = {
  // 提取所有声明
  extractAll(text) {
    return {
      citations: this.extractCitations(text),
      percentages: this.extractPercentages(text),
      numbers: this.extractNumbers(text),
      dates: this.extractDates(text),
      comparisons: this.extractComparisons(text),
      causations: this.extractCausations(text)
    };
  },

  // 提取学术引用
  extractCitations(text) {
    const patterns = [
      /\[@\w+.*?\]/g,
      /\([A-Z][a-z]+(?:\s+(?:et\s+al\.|&\s+[A-Z][a-z]+))?,?\s*\d{4}\)/g
    ];
    const results = [];
    for (const p of patterns) {
      const matches = text.match(p);
      if (matches) results.push(...matches);
    }
    return [...new Set(results)];
  },

  // 提取百分比
  extractPercentages(text) {
    return text.match(/\b\d+(?:\.\d+)?%/g) || [];
  },

  // 提取数字
  extractNumbers(text) {
    return text.match(/\b[1-9]\d{2,}(?:,\d{3})*(?:\.\d+)?\b/g) || [];
  },

  // 提取日期
  extractDates(text) {
    return text.match(/\b(?:19|20)\d{2}[-/\s年](?:0[1-9]|1[0-2])?[-/\s月]?(?:0[1-9]|[12]\d|3[01])?[日]?\b/g) || [];
  },

  // 提取比较（"比...多/少/大/小"）
  extractComparisons(text) {
    return text.match(/\b(?:比|超过|低于|多于|少于|大于|小于|高[于]?|低[于]?|多[于]?|少[于]?)\s*\S+/g) || [];
  },

  // 提取因果声明（"导致/引起/造成/因为...所以"）
  extractCausations(text) {
    const patterns = [
      /(?:导致|引起|造成|致使)\s*\S+/g,
      /(?:因为|由于)\s*\S+[^。]*?(?:所以|因此|因而)/g,
      /(?:证明|表明|说明)\s*\S+[^。]*?(?:导致|引起)/g
    ];
    const results = [];
    for (const p of patterns) {
      const matches = text.match(p);
      if (matches) results.push(...matches);
    }
    return [...new Set(results)];
  },

  // 分类
  categorize(claims) {
    const verified = [];
    const uncertain = [];
    const needsCheck = [];

    if (claims.citations.length > 0) verified.push(...claims.citations);
    if (claims.percentages.length > 0) needsCheck.push(...claims.percentages);
    if (claims.numbers.length > 0) needsCheck.push(...claims.numbers);
    if (claims.comparisons.length > 0) uncertain.push(...claims.comparisons);
    if (claims.causations.length > 0) uncertain.push(...claims.causations);

    return { verified, uncertain, needsCheck };
  }
};

module.exports = { claimExtractor };
