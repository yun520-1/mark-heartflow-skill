/**
 * 置信度标注器 - 为回复添加置信度标注
 */
const { claimExtractor } = require('./claim-extractor');

const confidenceAnnotator = {
  // 标注格式定义
  LEVELS: {
    high: { symbol: '✅', color: '绿', meaning: '多来源确认或用户已验证' },
    medium: { symbol: '⚠️', color: '黄', meaning: '单来源或推断' },
    low: { symbol: '❌', color: '红', meaning: '未核实或存疑' },
    unverified: { symbol: '❓', color: '灰', meaning: '需要验证' }
  },

  // 生成标注
  _mark(level) {
    const info = this.LEVELS[level] || this.LEVELS.unverified;
    return `${info.symbol}[${level}]`;
  },

  // 为声明添加标注
  annotateClaim(claim, level = 'unverified') {
    return `${claim} ${this._mark(level)}`;
  },

  // 为整段文字生成标注报告
  generateAnnotationReport(text) {
    const claims = claimExtractor.extractAll(text);
    const categorized = claimExtractor.categorize(claims);
    const lines = [];

    if (categorized.verified.length > 0) {
      lines.push(`✅ 已验证声明: ${categorized.verified.length}处`);
    }
    if (categorized.needsCheck.length > 0) {
      lines.push(`⚠️ 需验证数据: ${categorized.needsCheck.length}处`);
      lines.push(`  示例: ${categorized.needsCheck.slice(0, 3).join(', ')}`);
    }
    if (categorized.uncertain.length > 0) {
      lines.push(`❌ 因果/比较声明: ${categorized.uncertain.length}处 (需谨慎)`);
    }
    if (categorized.verified.length === 0 && categorized.needsCheck.length === 0) {
      lines.push('❓ 无可验证数据点');
    }

    return lines.join('\n');
  },

  // 格式化单个标注
  formatAnnotation(claim, level) {
    const info = this.LEVELS[level] || this.LEVELS.unverified;
    return `[${level}]${claim}`;
  },

  // 在回复中标注高风险声明
  annotateText(text, riskThreshold = 'medium') {
    const claims = claimExtractor.extractAll(text);
    let annotated = text;

    // 标注百分比
    for (const pct of claims.percentages) {
      const level = pct > '100' ? 'low' : 'unverified';
      annotated = annotated.replace(pct, `${pct} ${this._mark(level)}`);
    }

    // 标注大数字
    for (const num of claims.numbers.slice(0, 3)) {
      annotated = annotated.replace(num, `${num} ${this._mark('unverified')}`);
    }

    return annotated;
  }
};

module.exports = { confidenceAnnotator };
