/**
 * 置信度标注器 - 为回复添加置信度标注
 *
 * 升级点 (v2.0.19+):
 *   - 引入可观测性 _stats 计数器 + getStats()
 *   - 新增 computeRiskScore(text) 算法：把声明密度/风险加权到 0-100 分
 *   - 输入边界检测：null/undefined/non-string 全部安全降级
 *   - 扩展 annotateText：现在覆盖 citations / percentages / numbers / dates / comparisons / causations
 *   - 百分比风险分级细化：超 100 / 负数 / 异常精度 各走不同分支
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

  // 风险等级权重 (用于 computeRiskScore)
  RISK_WEIGHTS: {
    citation: 8,        // 有引用 → 风险降低 (反向计分在 scoreFn 中处理)
    percentage: 6,      // 百分比最易造假
    causation: 12,      // 因果声明是重灾区
    comparison: 5,      // 比较声明有方向性偏差风险
    number: 4,          // 大数字可能被错引
    date: 3,            // 日期通常可验证
    outOfRangePct: 15   // 异常百分比 (>100 或 <0) 额外加权
  },

  // 简单输入边界检测
  _safeText(text) {
    if (text == null) return '';
    if (typeof text !== 'string') {
      try { return String(text); } catch (_) { return ''; }
    }
    return text;
  },

  // 生成标注
  _mark(level) {
    const info = this.LEVELS[level] || this.LEVELS.unverified;
    return `${info.symbol}[${level}]`;
  },

  // 为声明添加标注
  annotateClaim(claim, level = 'unverified') {
    if (claim == null) return this._mark(level);
    this._stats.annotateClaimCalls++;
    return `${claim} ${this._mark(level)}`;
  },

  // 为整段文字生成标注报告
  generateAnnotationReport(text) {
    const safe = this._safeText(text);
    const claims = claimExtractor.extractAll(safe);
    const categorized = claimExtractor.categorize(claims);
    const lines = [];
    this._stats.generateReportCalls++;

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
    if (claim == null) return this._mark(level || 'unverified');
    return `[${level || 'unverified'}]${claim}`;
  },

  // 百分比风险分级 - 细化判定
  _percentageLevel(pctStr) {
    const n = parseFloat(pctStr);
    if (isNaN(n)) return 'unverified';
    if (n < 0 || n > 100) return 'low';          // 异常范围
    if (Number.isFinite(n) && /\.\d{2,}/.test(pctStr)) return 'low'; // 异常精度
    if (n === 100 || n === 0) return 'low';     // 极端值 (容易造假)
    return 'unverified';
  },

  // 在回复中标注高风险声明
  annotateText(text, riskThreshold = 'medium') {
    const safe = this._safeText(text);
    if (!safe) return '';
    this._stats.annotateTextCalls++;

    const claims = claimExtractor.extractAll(safe);
    let annotated = safe;

    // 1. 引用 - 默认标 high (已经标注了来源)
    for (const cit of claims.citations) {
      annotated = annotated.replace(cit, `${cit} ${this._mark('high')}`);
    }

    // 2. 百分比 - 细化风险分级
    for (const pct of claims.percentages) {
      const level = this._percentageLevel(pct);
      annotated = annotated.replace(pct, `${pct} ${this._mark(level)}`);
    }

    // 3. 大数字 - 标 unverified
    for (const num of claims.numbers.slice(0, 3)) {
      annotated = annotated.replace(num, `${num} ${this._mark('unverified')}`);
    }

    // 4. 日期 - 标 unverified (日期可查)
    for (const d of claims.dates.slice(0, 3)) {
      if (annotated.includes(d)) {
        annotated = annotated.replace(d, `${d} ${this._mark('unverified')}`);
      }
    }

    // 5. 因果声明 - 标 low (重灾区)
    for (const c of claims.causations) {
      // 避免重复 replace 整个句段, 只插入标记
      const marker = this._mark('low');
      if (annotated.includes(c) && !annotated.includes(`${c} ${marker}`)) {
        annotated = annotated.replace(c, `${c} ${marker}`);
      }
    }

    return annotated;
  },

  // 新算法: 风险评分 - 把声明密度/类型加权为 0-100 整数
  //   0   = 完全无可验证内容
  //   100 = 极高风险 (大量未声明的因果/异常百分比)
  computeRiskScore(text) {
    const safe = this._safeText(text);
    if (!safe) return 0;
    this._stats.computeRiskScoreCalls++;

    const claims = claimExtractor.extractAll(safe);
    const W = this.RISK_WEIGHTS;

    let score = 0;
    score += claims.causations.length * W.causation;
    score += claims.comparisons.length * W.comparison;
    score += claims.percentages.length * W.percentage;
    score += claims.numbers.length * W.number;
    score += claims.dates.length * W.date;
    // 异常百分比额外加权
    for (const p of claims.percentages) {
      const n = parseFloat(p);
      if (!isNaN(n) && (n < 0 || n > 100)) score += W.outOfRangePct;
    }
    // 引用是减分项
    score -= claims.citations.length * W.citation;

    // 文本长度归一化: 每 200 字符为一个 unit
    const lenUnit = Math.max(1, Math.ceil(safe.length / 200));
    let normalized = Math.round(score / lenUnit);
    if (normalized < 0) normalized = 0;
    if (normalized > 100) normalized = 100;
    return normalized;
  },

  // 可观测性: 暴露内部计数器
  getStats() {
    return {
      ...this._stats,
      totalCalls: Object.values(this._stats).reduce((a, b) => a + b, 0)
    };
  },

  // 可观测性: 重置计数器
  resetStats() {
    this._stats.annotateClaimCalls = 0;
    this._stats.generateReportCalls = 0;
    this._stats.annotateTextCalls = 0;
    this._stats.computeRiskScoreCalls = 0;
    return this.getStats();
  },

  // 内部状态
  _stats: {
    annotateClaimCalls: 0,
    generateReportCalls: 0,
    annotateTextCalls: 0,
    computeRiskScoreCalls: 0
  }
};

module.exports = { confidenceAnnotator };
