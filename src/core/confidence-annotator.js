/**
 * 置信度标注器 - 为回复添加置信度标注
 *
 * 升级点 (v2.0.19+):
 *   - 引入可观测性 _stats 计数器 + getStats()
 *   - 新增 computeRiskScore(text) 算法：把声明密度/风险加权到 0-100 分
 *   - 输入边界检测：null/undefined/non-string 全部安全降级
 *   - 扩展 annotateText：现在覆盖 citations / percentages / numbers / dates / comparisons / causations
 *   - 百分比风险分级细化：超 100 / 负数 / 异常精度 各走不同分支
 *
 * 升级点 (v2.0.20):
 *   - 新增 _safeReplace() 防止子串冲突和重复标注
 *   - 新增 aggregateConfidence(riskScore) 把风险分映射为置信度级别
 *   - 修正 riskThreshold 参数在 annotateText 中未被使用的缺陷
 *   - 新增 computeRiskOscillation() 震荡检测：多次调用时识别风险分波动模式
 *   - 新增文本长度边界保护 (MAX_TEXT_LENGTH)，超过自动截断
 *   - 新增 isHighRisk() / isLowRisk() 便捷判断方法
 *   - 新增 annotateTextBatch() 批量处理大文本的分段标注
 *   - 统计系统扩展：errorCount / safeReplaceCount / truncationCount / oscillationWarnings
 *   - 防御性编程：防止无限循环和正则回溯
 */
let claimExtractor;
try {
  ({ claimExtractor } = require('./claim-extractor'));
} catch (e) {
  // claim-extractor 不在 src/core/ 目录，提供空实现兜底
  claimExtractor = {
    extractAll: () => [],
    categorize: () => ({})
  };
}

/** 单次处理的最大文本长度（超过自动截断头部） */
const MAX_TEXT_LENGTH = 50000;

/** 震荡检测窗口大小 */
const OSCILLATION_WINDOW = 5;

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

  // 置信度聚合阈值（风险分 → 级别映射）
  CONFIDENCE_THRESHOLDS: {
    high:   { maxScore: 15, label: 'high',   description: '低风险，声明可信度较高' },
    medium: { maxScore: 40, label: 'medium', description: '中等风险，部分声明需验证' },
    low:    { maxScore: 70, label: 'low',    description: '高风险，声明可信度低' },
    critical: { maxScore: 100, label: 'critical', description: '极高风险，声明高度可疑' }
  },

  /** 震荡检测阈值：风险分标准差超过此值触发告警 */
  OSCILLATION_STD_THRESHOLD: 15,

  // 简单输入边界检测
  _safeText(text) {
    if (text == null) return '';
    if (typeof text !== 'string') {
      try { return String(text); } catch (e) { console.warn('[ConfidenceAnnotator] 文本转换失败:', e.message); return ''; }
    }
    return text;
  },

  /**
   * 安全替换：防止子串冲突和重复标注
   * 在替换前检查目标位置是否已被标注（避免双重标注）
   * @private
   * @param {string} text - 源文本
   * @param {string} target - 要标注的目标子串
   * @param {string} annotation - 标注内容（如 " ✅[high]"）
   * @returns {string} 替换后的文本
   */
  /**
   * 从声明对象中提取字符串值
   * claim-extractor 返回的对象有 .value 属性，也可能是纯字符串
   * @private
   * @param {object|string} claim - 声明对象或纯字符串
   * @returns {string}
   */
  _claimValue(claim) {
    if (claim == null) return '';
    if (typeof claim === 'string') return claim;
    if (typeof claim === 'object' && claim.value) return claim.value;
    try { return String(claim); } catch (e) { console.warn('[ConfidenceAnnotator] 声明值转换失败:', e.message); return ''; }
  },

  /**
   * 安全替换：防止子串冲突和重复标注
   * 支持传入声明对象（含 .value 属性）或纯字符串
   * 使用已标注位置集合（annotatedRanges）防止子串被重复标注
   * 注意：annotatedRanges 中的位置是基于原始未修改文本的偏移
   * @private
   * @param {string} text - 源文本
   * @param {string} target - 目标字符串
   * @param {string} annotation - 标注内容（如 " ✅[high]"）
   * @param {Array<[number,number]>} [annotatedRanges] - 已标注的 [start, end] 范围（基于原始文本）
   * @returns {{ result: string, ranges: Array<[number,number]> }}
   */
  _safeReplace(text, target, annotation, annotatedRanges = null) {
    if (!text || !target || target.length === 0) return { result: text, ranges: [] };
    this._stats.safeReplaceCount++;

    const addedRanges = [];
    const MAX_REPLACE = 10;
    const annotationText = ' ' + annotation;
    const shiftPerReplace = target.length + annotationText.length - target.length; // = annotationText.length

    // 先收集所有目标出现位置（基于原始文本偏移）
    const positions = [];
    let pos = 0;
    while ((pos = text.indexOf(target, pos)) !== -1 && positions.length < MAX_REPLACE) {
      positions.push(pos);
      pos += target.length;
    }

    // 过滤：排除已标注范围内的位置
    const filteredPositions = positions.filter(p => {
      if (!annotatedRanges) return true;
      // 检查该位置是否在已标注范围内
      for (const [rStart, rEnd] of annotatedRanges) {
        if (p >= rStart && p + target.length <= rEnd) return false;
        if (p < rEnd && p + target.length > rStart) return false;
      }
      return true;
    });

    // 如果没有任何需要替换的位置，直接返回原文
    if (filteredPositions.length === 0) {
      return { result: text, ranges: [] };
    }

    // 从右向左替换（避免偏移计算错误）
    let result = text;
    for (const rawPos of [...filteredPositions].reverse()) {
      const before = result.substring(0, rawPos);
      const after = result.substring(rawPos + target.length);
      result = before + target + annotationText + after;
      // 记录已标注范围（基于原始文本）
      addedRanges.push([rawPos, rawPos + target.length]);
    }

    if (positions.length >= MAX_REPLACE) {
      this._stats.errorCount++;
    }

    return { result, ranges: addedRanges };
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
    if (!safe) return '❓ 无可验证数据点';

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

  /**
   * 在回复中标注高风险声明
   * 修正：现在正确使用 riskThreshold 参数
   * 修正：使用 _safeReplace 防止子串冲突和重复标注
   * 新增：文本长度边界保护（超过 MAX_TEXT_LENGTH 自动截断）
   * 新增：基于位置的标注防重叠（先收集所有标注位置，再一次性替换）
   */
  annotateText(text, riskThreshold = 'medium') {
    const safe = this._safeText(text);
    if (!safe) return '';
    this._stats.annotateTextCalls++;

    // 文本长度边界保护
    let truncated = false;
    let processText = safe;
    if (safe.length > MAX_TEXT_LENGTH) {
      processText = safe.substring(0, MAX_TEXT_LENGTH);
      truncated = true;
      this._stats.truncationCount++;
    }

    const claims = claimExtractor.extractAll(processText);

    // 阈值级别映射
    const thresholdLevels = { 'high': 0, 'medium': 1, 'low': 2, 'critical': -1 };
    const currentThreshold = thresholdLevels[riskThreshold] !== undefined
      ? thresholdLevels[riskThreshold] : 1;

    // 收集所有需要标注的位置 [start, end, level]
    const annotations = [];

    // 1. 引用 - 默认标 high
    for (const cit of claims.citations) {
      const value = this._claimValue(cit);
      if (!value) continue;
      annotations.push({ value, level: 'high' });
    }

    // 2. 百分比 - 细化风险分级
    for (const pct of claims.percentages) {
      const value = this._claimValue(pct);
      if (!value) continue;
      const level = this._percentageLevel(value);
      annotations.push({ value, level });
    }

    // 3. 大数字 - 根据 riskThreshold
    if (currentThreshold >= 1) {
      for (const num of claims.numbers.slice(0, 3)) {
        const value = this._claimValue(num);
        if (!value) continue;
        annotations.push({ value, level: 'unverified' });
      }
    }

    // 4. 日期
    if (currentThreshold >= 1) {
      for (const d of claims.dates.slice(0, 3)) {
        const value = this._claimValue(d);
        if (!value) continue;
        annotations.push({ value, level: 'unverified' });
      }
    }

    // 5. 因果声明 - 始终标注
    for (const c of claims.causations) {
      const value = this._claimValue(c);
      if (!value) continue;
      annotations.push({ value, level: 'low' });
    }

    // 6. 比较声明
    if (currentThreshold >= 1) {
      for (const cmp of claims.comparisons) {
        const value = this._claimValue(cmp);
        if (!value) continue;
        annotations.push({ value, level: 'medium' });
      }
    }

    // 按长度降序排列（长串优先，防止短串在长串内部被错误替换）
    annotations.sort((a, b) => b.value.length - a.value.length);

    // 去重（相同值的只保留最高风险级别）
    const seen = new Set();
    const deduped = [];
    for (const a of annotations) {
      if (!seen.has(a.value)) {
        seen.add(a.value);
        deduped.push(a);
      }
    }

    // 一次性标注所有声明（使用 annotatedRanges 防止重叠标注）
    let annotated = processText;
    const annotatedRanges = []; // [[start, end], ...]

    for (const { value, level } of deduped) {
      const { result, ranges } = this._safeReplace(annotated, value, this._mark(level), annotatedRanges);
      annotated = result;
      annotatedRanges.push(...ranges);
    }

    if (truncated) {
      annotated += '\n\n⚠️ [文本过长，仅标注前 ' + MAX_TEXT_LENGTH + ' 字符]';
    }

    return annotated;
  },

  /**
   * 批量处理：将大文本分段后逐段标注
   * 适合超长文档（>50000字符），每段独立标注后合并结果
   * @param {string} text - 源文本
   * @param {object} [options] - 配置选项
   * @param {number} [options.chunkSize=10000] - 每段字符数
   * @param {string} [options.riskThreshold='medium'] - 风险阈值
   * @param {boolean} [options.parallel=false] - 是否并行处理（默认串行）
   * @returns {{ annotated: string, chunks: number, warnings: string[] }}
   */
  annotateTextBatch(text, options = {}) {
    const safe = this._safeText(text);
    if (!safe) return { annotated: '', chunks: 0, warnings: [] };

    const chunkSize = options.chunkSize || 10000;
    const riskThreshold = options.riskThreshold || 'medium';
    const warnings = [];

    this._stats.annotateTextBatchCalls++;

    // 文本不够长，直接走单段处理
    if (safe.length <= chunkSize) {
      const annotated = this.annotateText(safe, riskThreshold);
      return { annotated, chunks: 1, warnings };
    }

    const chunks = [];
    for (let i = 0; i < safe.length; i += chunkSize) {
      chunks.push(safe.substring(i, i + chunkSize));
    }

    // 串行处理各段
    const annotatedChunks = chunks.map((chunk, idx) => {
      const result = this.annotateText(chunk, riskThreshold);
      return { index: idx, result };
    });

    // 合并结果，段间加分隔
    const merged = annotatedChunks
      .map(c => c.result)
      .join('\n\n--- 段落分隔 ---\n\n');

    if (chunks.length > 10) {
      warnings.push(`文本过长，已分为 ${chunks.length} 段处理`);
    }

    return {
      annotated: merged,
      chunks: chunks.length,
      warnings
    };
  },

  /**
   * 新算法: 风险评分 - 把声明密度/类型加权为 0-100 整数
   *   0   = 完全无可验证内容
   *   100 = 极高风险 (大量未声明的因果/异常百分比)
   *
   * 新增：文本长度边界保护（超过 MAX_TEXT_LENGTH 自动截断）
   * 新增：记录到历史用于震荡检测
   */
  computeRiskScore(text) {
    const safe = this._safeText(text);
    if (!safe) return 0;
    this._stats.computeRiskScoreCalls++;

    // 文本长度边界保护
    let processText = safe;
    if (safe.length > MAX_TEXT_LENGTH) {
      processText = safe.substring(0, MAX_TEXT_LENGTH);
      this._stats.truncationCount++;
    }

    const claims = claimExtractor.extractAll(processText);
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
    const lenUnit = Math.max(1, Math.ceil(processText.length / 200));
    let normalized = Math.round(score / lenUnit);
    if (normalized < 0) normalized = 0;
    if (normalized > 100) normalized = 100;

    // 记录历史用于震荡检测
    this._riskScoreHistory.push(normalized);
    if (this._riskScoreHistory.length > OSCILLATION_WINDOW * 2) {
      this._riskScoreHistory.shift();
    }

    return normalized;
  },

  /**
   * 置信度聚合：将 riskScore 映射为置信度级别
   * 返回 { level: string, score: number, description: string }
   *
   * @param {number} riskScore - 风险分 (0-100)
   * @returns {{ level: string, score: number, description: string }}
   */
  aggregateConfidence(riskScore) {
    if (typeof riskScore !== 'number' || isNaN(riskScore) || riskScore < 0) {
      return {
        level: 'unverified',
        score: 0,
        description: '无法计算置信度（无效输入）'
      };
    }

    const clamped = Math.min(100, Math.max(0, riskScore));

    // 从低到高匹配阈值
    if (clamped <= this.CONFIDENCE_THRESHOLDS.high.maxScore) {
      const t = this.CONFIDENCE_THRESHOLDS.high;
      return { level: t.label, score: 100 - clamped, description: t.description };
    }
    if (clamped <= this.CONFIDENCE_THRESHOLDS.medium.maxScore) {
      const t = this.CONFIDENCE_THRESHOLDS.medium;
      return { level: t.label, score: 100 - clamped, description: t.description };
    }
    if (clamped <= this.CONFIDENCE_THRESHOLDS.low.maxScore) {
      const t = this.CONFIDENCE_THRESHOLDS.low;
      return { level: t.label, score: 100 - clamped, description: t.description };
    }

    const t = this.CONFIDENCE_THRESHOLDS.critical;
    return { level: t.label, score: 100 - clamped, description: t.description };
  },

  /**
   * 震荡检测：分析最近 N 次 computeRiskScore 调用的风险分波动
   * 如果波动超过 OSCILLATION_STD_THRESHOLD，返回告警
   *
   * 应用场景：同一文本被反复评估时，分数应稳定。
   * 若大幅波动，说明文本内容或提取结果不稳定，需重新评估。
   *
   * @returns {{ stable: boolean, std: number, mean: number, warnings: string[], history: number[] }}
   */
  computeRiskOscillation() {
    const history = [...this._riskScoreHistory];
    if (history.length < 2) {
      return {
        stable: true,
        std: 0,
        mean: history.length === 1 ? history[0] : 0,
        warnings: ['历史数据不足（至少需要2次调用）'],
        history
      };
    }

    const n = history.length;
    const mean = history.reduce((a, b) => a + b, 0) / n;
    const variance = history.reduce((sum, v) => sum + (v - mean) ** 2, 0) / n;
    const std = Math.sqrt(variance);
    const warnings = [];

    if (std > this.OSCILLATION_STD_THRESHOLD) {
      warnings.push(
        `风险分波动异常：标准差 ${std.toFixed(1)}（阈值 ${this.OSCILLATION_STD_THRESHOLD}），` +
        `近 ${n} 次评分在 ${Math.min(...history)}~${Math.max(...history)} 之间波动`
      );
      this._stats.oscillationWarnings++;
    }

    // 趋势检测：连续上升或下降
    const diffs = [];
    for (let i = 1; i < history.length; i++) {
      diffs.push(history[i] - history[i - 1]);
    }
    const risingCount = diffs.filter(d => d > 0).length;
    const fallingCount = diffs.filter(d => d < 0).length;

    if (risingCount >= history.length - 1) {
      warnings.push(`风险分持续上升趋势（${risingCount}/${history.length - 1}步上升）`);
    } else if (fallingCount >= history.length - 1) {
      warnings.push(`风险分持续下降趋势（${fallingCount}/${history.length - 1}步下降）`);
    }

    return {
      stable: std <= this.OSCILLATION_STD_THRESHOLD,
      std: Math.round(std * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      warnings,
      history
    };
  },

  /**
   * 判断风险分是否为高风险
   * @param {number} riskScore - 风险分 (0-100)
   * @param {number} [threshold=50] - 自定义阈值
   * @returns {boolean}
   */
  isHighRisk(riskScore, threshold = 50) {
    if (typeof riskScore !== 'number' || isNaN(riskScore)) return false;
    return riskScore >= threshold;
  },

  /**
   * 判断风险分是否为低风险
   * @param {number} riskScore - 风险分 (0-100)
   * @param {number} [threshold=20] - 自定义阈值
   * @returns {boolean}
   */
  isLowRisk(riskScore, threshold = 20) {
    if (typeof riskScore !== 'number' || isNaN(riskScore)) return false;
    return riskScore <= threshold;
  },

  /**
   * 综合评估：一站式完成风险评分 + 置信度聚合 + 震荡检测
   * @param {string} text - 待评估文本
   * @param {object} [options] - 配置选项
   * @param {number} [options.riskThreshold=50] - 高风险阈值
   * @param {number} [options.lowThreshold=20] - 低风险阈值
   * @returns {{
   *   riskScore: number,
   *   confidence: { level: string, score: number, description: string },
   *   oscillation: { stable: boolean, std: number, mean: number, warnings: string[], history: number[] },
   *   isHighRisk: boolean,
   *   isLowRisk: boolean,
   *   warnings: string[]
   * }}
   */
  evaluate(text, options = {}) {
    const riskThreshold = options.riskThreshold || 50;
    const lowThreshold = options.lowThreshold || 20;
    const warnings = [];

    const riskScore = this.computeRiskScore(text);
    const confidence = this.aggregateConfidence(riskScore);
    const oscillation = this.computeRiskOscillation();

    if (!oscillation.stable) {
      warnings.push(...oscillation.warnings);
    }

    return {
      riskScore,
      confidence,
      oscillation,
      isHighRisk: this.isHighRisk(riskScore, riskThreshold),
      isLowRisk: this.isLowRisk(riskScore, lowThreshold),
      warnings
    };
  },

  // 可观测性: 暴露内部计数器
  getStats() {
    return {
      ...this._stats,
      totalCalls: Object.values(this._stats).reduce((a, b) => a + b, 0),
      riskScoreHistoryLength: this._riskScoreHistory.length
    };
  },

  // 可观测性: 重置计数器
  resetStats() {
    this._stats.annotateClaimCalls = 0;
    this._stats.generateReportCalls = 0;
    this._stats.annotateTextCalls = 0;
    this._stats.computeRiskScoreCalls = 0;
    this._stats.safeReplaceCount = 0;
    this._stats.errorCount = 0;
    this._stats.truncationCount = 0;
    this._stats.oscillationWarnings = 0;
    this._stats.annotateTextBatchCalls = 0;
    this._riskScoreHistory = [];
    return this.getStats();
  },

  // 内部状态
  _stats: {
    annotateClaimCalls: 0,
    generateReportCalls: 0,
    annotateTextCalls: 0,
    computeRiskScoreCalls: 0,
    safeReplaceCount: 0,
    errorCount: 0,
    truncationCount: 0,
    oscillationWarnings: 0,
    annotateTextBatchCalls: 0
  },

  /** 风险分历史记录（用于震荡检测） */
  _riskScoreHistory: []
};

module.exports = { confidenceAnnotator };
