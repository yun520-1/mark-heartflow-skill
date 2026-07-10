/**
 * 行为模式检测器 v2.0.0
 * 
 * 从简单计数升级为多因素模式检测引擎：
 * - 输入验证与边界保护
 * - 置信度评分与质量评估
 * - 趋势分析与方向判断
 * - 震荡检测与异常识别
 * - 统计追踪与健康报告
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 错误码枚举
// ═══════════════════════════════════════════════════════════════════════════════

const ErrorCode = {
  INPUT_NULL: 'INPUT_NULL',
  INPUT_EMPTY: 'INPUT_EMPTY',
  INVALID_TYPE: 'INVALID_TYPE',
  GOAL_MISSING: 'GOAL_MISSING',
  RECORDS_TOO_FEW: 'RECORDS_TOO_FEW',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  OSCILLATION_DETECTED: 'OSCILLATION_DETECTED',
  NONE: 'NONE'
};

const ERROR_SUGGESTIONS = {
  [ErrorCode.INPUT_NULL]: '输入不能为 null/undefined',
  [ErrorCode.INPUT_EMPTY]: '记录数组不能为空',
  [ErrorCode.INVALID_TYPE]: '参数类型错误，期望数组或对象',
  [ErrorCode.GOAL_MISSING]: '目标对象缺少必要字段',
  [ErrorCode.RECORDS_TOO_FEW]: '记录数太少，分析结果置信度低',
  [ErrorCode.OSCILLATION_DETECTED]: '检测到震荡模式，建议暂停分析',
  [ErrorCode.NONE]: '正常'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 趋势方向枚举
// ═══════════════════════════════════════════════════════════════════════════════

const TrendDirection = {
  RISING: 'rising',
  FALLING: 'falling',
  STABLE: 'stable',
  OSCILLATING: 'oscillating',
  INSUFFICIENT: 'insufficient'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 置信度级别
// ═══════════════════════════════════════════════════════════════════════════════

const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INSUFFICIENT: 'insufficient'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG = {
  minRecordsForAnalysis: 3,       // 分析所需最少记录数
  minRecordsForTrend: 5,          // 趋势分析所需最少记录数
  oscillationWindow: 10,          // 震荡检测窗口大小
  oscillationThreshold: 0.4,      // 震荡判定阈值（翻转比例）
  trendComparisonRatio: 0.5,      // 趋势分析分割比例
  maxRecordsForAnalysis: 1000,    // 分析记录上限
  confidenceHighThreshold: 0.7,   // 高置信度阈值
  confidenceMediumThreshold: 0.4  // 中置信度阈值
};

// ═══════════════════════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════════════════════

function _safeText(text) {
  return (typeof text === 'string') ? text : '';
}

function _safeNumber(n, fallback) {
  return (typeof n === 'number' && !isNaN(n)) ? n : fallback;
}

function _clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function _getDayName(dayIndex) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dayIndex] || '未知';
}

/**
 * Jaccard 相似度 — 用于震荡检测的序列比较
 */
function _jaccardSimilarity(setA, setB) {
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  return intersection.size / union.size;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PatternDetector 类
// ═══════════════════════════════════════════════════════════════════════════════

class PatternDetector {
  /**
   * @param {Object} [options] 配置选项
   * @param {number} [options.minRecordsForAnalysis=3]
   * @param {number} [options.minRecordsForTrend=5]
   * @param {number} [options.oscillationWindow=10]
   * @param {number} [options.oscillationThreshold=0.4]
   */
  constructor(options = {}) {
    this.config = {};
    this._initConfig(options);
    
    // 震荡检测历史
    this._patternHistory = [];
    
    // 统计数据
    this._stats = {
      totalAnalyses: 0,
      weeklyDetections: 0,
      triggerDetections: 0,
      riskAssessments: 0,
      oscillationWarnings: 0,
      trendAnalyses: 0,
      validationErrors: 0
    };
  }

  // ── 配置 ──

  _initConfig(options) {
    this.config = {
      minRecordsForAnalysis: _safeNumber(options.minRecordsForAnalysis, DEFAULT_CONFIG.minRecordsForAnalysis),
      minRecordsForTrend: _safeNumber(options.minRecordsForTrend, DEFAULT_CONFIG.minRecordsForTrend),
      oscillationWindow: _safeNumber(options.oscillationWindow, DEFAULT_CONFIG.oscillationWindow),
      oscillationThreshold: _safeNumber(options.oscillationThreshold, DEFAULT_CONFIG.oscillationThreshold),
      trendComparisonRatio: _safeNumber(options.trendComparisonRatio, DEFAULT_CONFIG.trendComparisonRatio),
      maxRecordsForAnalysis: _safeNumber(options.maxRecordsForAnalysis, DEFAULT_CONFIG.maxRecordsForAnalysis),
      confidenceHighThreshold: _safeNumber(options.confidenceHighThreshold, DEFAULT_CONFIG.confidenceHighThreshold),
      confidenceMediumThreshold: _safeNumber(options.confidenceMediumThreshold, DEFAULT_CONFIG.confidenceMediumThreshold)
    };
    // 边界保护
    this.config.oscillationWindow = _clamp(this.config.oscillationWindow, 3, 50);
    this.config.oscillationThreshold = _clamp(this.config.oscillationThreshold, 0.1, 1.0);
    this.config.minRecordsForAnalysis = Math.max(1, this.config.minRecordsForAnalysis);
  }

  configure(options) {
    if (options && typeof options === 'object') {
      this._initConfig({ ...this.config, ...options });
      return { ok: true };
    }
    return { ok: false, error: '配置必须是对象' };
  }

  // ── 输入验证 ──

  /**
   * 验证记录数组
   * @private
   */
  _validateRecords(records) {
    if (records === null || records === undefined) {
      return { valid: false, error: ErrorCode.INPUT_NULL, suggestion: ERROR_SUGGESTIONS[ErrorCode.INPUT_NULL] };
    }
    if (!Array.isArray(records)) {
      return { valid: false, error: ErrorCode.INVALID_TYPE, suggestion: ERROR_SUGGESTIONS[ErrorCode.INVALID_TYPE] };
    }
    if (records.length === 0) {
      return { valid: false, error: ErrorCode.INPUT_EMPTY, suggestion: ERROR_SUGGESTIONS[ErrorCode.INPUT_EMPTY] };
    }
    if (records.length > this.config.maxRecordsForAnalysis) {
      records = records.slice(-this.config.maxRecordsForAnalysis);
    }
    return { valid: true, records };
  }

  /**
   * 验证目标对象
   * @private
   */
  _validateGoal(goal) {
    if (!goal || typeof goal !== 'object') {
      return { valid: false, error: ErrorCode.INPUT_NULL, suggestion: '目标对象不能为空' };
    }
    if (!Array.isArray(goal.records)) {
      return { valid: false, error: ErrorCode.GOAL_MISSING, suggestion: '目标缺少 records 数组' };
    }
    return { valid: true };
  }

  // ── 置信度计算 ──

  /**
   * 基于数据充足度计算置信度
   * @private
   */
  _computeConfidence(count, minThreshold) {
    if (count <= 0) return { score: 0, level: ConfidenceLevel.INSUFFICIENT };
    const ratio = count / Math.max(1, minThreshold);
    const score = _clamp(ratio / (ratio + 1), 0, 1); // logistic-like
    let level;
    if (score >= this.config.confidenceHighThreshold) level = ConfidenceLevel.HIGH;
    else if (score >= this.config.confidenceMediumThreshold) level = ConfidenceLevel.MEDIUM;
    else level = ConfidenceLevel.LOW;
    return { score, level };
  }

  // ── 周规律检测（增强版） ──

  /**
   * 检测每周模式 — 支持多因素分析
   * 
   * @param {Array} records 行为记录数组
   * @param {Object} [options] 可选参数
   * @param {string} [options.dateField='timestamp'] 日期字段名
   * @param {boolean} [options.includeTrend=false] 是否包含趋势分析
   * @returns {Object} 检测结果 { day, count, total, distribution, confidence, error? }
   */
  detectWeeklyPattern(records, options = {}) {
    this._stats.totalAnalyses++;
    const validation = this._validateRecords(records);
    if (!validation.valid) {
      this._stats.validationErrors++;
      return { error: validation.error, suggestion: validation.suggestion, day: null, count: 0 };
    }

    const safeRecords = validation.records;
    const dateField = (options && options.dateField) || 'timestamp';

    // 按星期几分组
    const byDay = {};
    let validCount = 0;
    for (const r of safeRecords) {
      const ts = (typeof r === 'object' && r) ? r[dateField] : null;
      if (!ts) continue;
      const d = new Date(ts).getDay();
      if (isNaN(d)) continue;
      byDay[d] = (byDay[d] || 0) + 1;
      validCount++;
    }

    if (validCount === 0) {
      return { error: ErrorCode.ANALYSIS_FAILED, suggestion: '记录中无有效时间戳', day: null, count: 0, total: 0 };
    }

    const entries = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
    const best = entries[0];
    const bestDay = _getDayName(parseInt(best[0], 10));
    const distribution = {};
    for (const [dayIdx, cnt] of entries) {
      distribution[_getDayName(parseInt(dayIdx, 10))] = cnt;
    }

    // 置信度计算
    const confidence = this._computeConfidence(validCount, this.config.minRecordsForAnalysis);

    // 可选趋势分析
    let trend = null;
    if (options && options.includeTrend && validCount >= this.config.minRecordsForTrend) {
      trend = this._analyzeDayTrend(safeRecords, dateField, byDay);
    }

    // 记录到历史
    this._recordPattern({ type: 'weekly', day: bestDay, count: best[1], total: validCount });
    this._stats.weeklyDetections++;

    const result = {
      day: bestDay,
      count: best[1],
      total: validCount,
      distribution,
      confidence: confidence.score,
      confidenceLevel: confidence.level
    };
    if (trend) result.trend = trend;
    return result;
  }

  /**
   * 逐日趋势分析
   * @private
   */
  _analyzeDayTrend(records, dateField, byDay) {
    // 比较上半段和下半段的活跃度
    const mid = Math.floor(records.length * this.config.trendComparisonRatio);
    const firstHalf = records.slice(0, mid);
    const secondHalf = records.slice(mid);

    const firstByDay = {};
    for (const r of firstHalf) {
      const ts = r[dateField];
      if (!ts) continue;
      const d = new Date(ts).getDay();
      if (isNaN(d)) continue;
      firstByDay[d] = (firstByDay[d] || 0) + 1;
    }

    const secondByDay = {};
    for (const r of secondHalf) {
      const ts = r[dateField];
      if (!ts) continue;
      const d = new Date(ts).getDay();
      if (isNaN(d)) continue;
      secondByDay[d] = (secondByDay[d] || 0) + 1;
    }

    // 找到两半中最活跃的日
    const firstBest = Object.entries(firstByDay).sort((a, b) => b[1] - a[1])[0];
    const secondBest = Object.entries(secondByDay).sort((a, b) => b[1] - a[1])[0];

    if (!firstBest || !secondBest) return null;

    const firstDay = _getDayName(parseInt(firstBest[0], 10));
    const secondDay = _getDayName(parseInt(secondBest[0], 10));

    if (firstDay === secondDay) return { direction: TrendDirection.STABLE, firstDay, secondDay };
    return { direction: TrendDirection.RISING, firstDay, secondDay, note: `从 ${firstDay} 转向 ${secondDay}` };
  }

  // ── 触发模式检测（增强版） ──

  /**
   * 检测触发模式 — 支持多因素评分
   * 
   * @param {Array} records 行为记录数组
   * @param {Object} [options] 可选参数
   * @param {number} [options.topN=3] 返回前N个触发词
   * @param {string} [options.contextField='context'] 上下文字段名
   * @returns {Array} 触发模式列表 [{ phrase, count, score, ratio, ... }]
   */
  detectTriggerPattern(records, options = {}) {
    this._stats.totalAnalyses++;
    const validation = this._validateRecords(records);
    if (!validation.valid) {
      this._stats.validationErrors++;
      return [];
    }

    const safeRecords = validation.records;
    const topN = (options && options.topN) || 3;
    const contextField = (options && options.contextField) || 'context';

    const triggers = {};
    let totalWithContext = 0;

    for (const r of safeRecords) {
      if (!r || typeof r !== 'object') continue;
      const ctx = r[contextField];
      if (!ctx || typeof ctx !== 'string') continue;
      totalWithContext++;

      // 提取前3个词作为触发短语
      const words = ctx.split(/[\s,，。！？、；：]+/).filter(w => w.length > 0).slice(0, 3);
      if (words.length === 0) continue;
      const phrase = words.join(' ');

      if (!triggers[phrase]) {
        triggers[phrase] = { phrase, count: 0, firstSeen: r.timestamp || null, types: new Set() };
      }
      triggers[phrase].count++;
      if (r.type) triggers[phrase].types.add(r.type);
    }

    const entries = Object.entries(triggers)
      .map(([phrase, data]) => ({
        phrase,
        count: data.count,
        ratio: totalWithContext > 0 ? _safeNumber(data.count / totalWithContext, 0) : 0,
        types: [...data.types],
        firstSeen: data.firstSeen
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);

    this._stats.triggerDetections++;

    return entries;
  }

  // ── 复发风险评估（增强版） ──

  /**
   * 评估复发风险 — 支持多因素评估
   * 
   * @param {Object} goal 目标对象
   * @param {Object} [options] 可选参数
   * @param {boolean} [options.includeTrend=false] 是否包含趋势分析
   * @returns {Object} 风险评估结果
   */
  detectRelapseRisk(goal, options = {}) {
    this._stats.totalAnalyses++;
    const validation = this._validateGoal(goal);
    if (!validation.valid) {
      this._stats.validationErrors++;
      return { risk: 'unknown', error: validation.error, message: validation.suggestion };
    }

    const records = goal.records;
    if (records.length === 0) {
      return { risk: 'low', message: '无记录，无法评估', confidence: 0, confidenceLevel: ConfidenceLevel.INSUFFICIENT };
    }

    const recent = records.slice(-5);
    const allFails = records.filter(r => r && r.type === 'failure').length;
    const recentFails = recent.filter(r => r && r.type === 'failure').length;
    const recentSuccess = recent.filter(r => r && r.type === 'success').length;

    // 多因素评分
    let riskScore = 0;
    const factors = [];

    // 因素1：近期失败率
    const recentFailRate = recent.length > 0 ? recentFails / recent.length : 0;
    if (recentFailRate >= 0.6) {
      riskScore += 0.4;
      factors.push({ name: '近期失败率高', weight: 0.4, detail: `${recentFails}/${recent.length}` });
    } else if (recentFailRate >= 0.4) {
      riskScore += 0.2;
      factors.push({ name: '近期失败中等', weight: 0.2, detail: `${recentFails}/${recent.length}` });
    }

    // 因素2：连续失败（3连败及以上）
    let consecutiveFails = 0;
    let maxConsecutiveFails = 0;
    for (const r of recent) {
      if (r && r.type === 'failure') {
        consecutiveFails++;
        maxConsecutiveFails = Math.max(maxConsecutiveFails, consecutiveFails);
      } else {
        consecutiveFails = 0;
      }
    }
    if (maxConsecutiveFails >= 3) {
      riskScore += 0.3;
      factors.push({ name: '连续失败', weight: 0.3, detail: `${maxConsecutiveFails}次连续失败` });
    } else if (maxConsecutiveFails >= 2) {
      riskScore += 0.15;
      factors.push({ name: '接近连续失败', weight: 0.15, detail: `${maxConsecutiveFails}次连续失败` });
    }

    // 因素3：成功/失败比率
    if (allFails > 0 && records.length > 0) {
      const failRatio = allFails / records.length;
      if (failRatio > 0.5) {
        riskScore += 0.2;
        factors.push({ name: '总体失败率高', weight: 0.2, detail: `${Math.round(failRatio * 100)}%` });
      }
    }

    // 因素4：近期零成功
    if (recent.length >= 3 && recentSuccess === 0 && recentFails > 0) {
      riskScore += 0.1;
      factors.push({ name: '近期无成功', weight: 0.1 });
    }

    // 震荡检测
    let oscillation = null;
    if (options && options.includeTrend) {
      oscillation = this._detectRiskOscillation(records);
      if (oscillation && oscillation.detected) {
        riskScore += 0.2;
        factors.push({ name: '风险震荡', weight: 0.2, detail: oscillation.note });
      }
    }

    // 确定风险等级
    let risk, message;
    if (riskScore >= 0.7) {
      risk = 'high';
      message = `高风险（${Math.round(riskScore * 100)}%）：连续失败较多，注意休息和调整策略`;
    } else if (riskScore >= 0.35) {
      risk = 'medium';
      message = `中等风险（${Math.round(riskScore * 100)}%）：有失败记录，关注触发因素`;
    } else if (riskScore > 0) {
      risk = 'low';
      message = `低风险（${Math.round(riskScore * 100)}%）：状态基本稳定`;
    } else {
      risk = 'low';
      message = '状态稳定，无失败记录';
    }

    const confidence = this._computeConfidence(records.length, this.config.minRecordsForAnalysis);

    this._stats.riskAssessments++;
    if (oscillation && oscillation.detected) this._stats.oscillationWarnings++;

    return { risk, riskScore, message, factors, confidence: confidence.score, confidenceLevel: confidence.level, oscillation };
  }

  /**
   * 风险震荡检测
   * @private
   */
  _detectRiskOscillation(records) {
    if (records.length < this.config.oscillationWindow) return null;

    const recentRecords = records.slice(-this.config.oscillationWindow);
    // 提取成功/失败序列
    const sequence = recentRecords.map(r => r && r.type === 'success' ? 1 : 0);
    
    // 检测翻转（1→0→1→0 模式）
    let flips = 0;
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i - 1]) flips++;
    }

    const flipRate = sequence.length > 1 ? flips / (sequence.length - 1) : 0;
    const detected = flipRate >= this.config.oscillationThreshold;

    return {
      detected,
      flipRate,
      threshold: this.config.oscillationThreshold,
      window: sequence.length,
      note: detected
        ? `检测到成功/失败震荡模式（翻转率 ${Math.round(flipRate * 100)}%）`
        : null
    };
  }

  // ── 趋势分析 ──

  /**
   * 分析行为趋势方向
   * 
   * @param {Array} records 行为记录数组
   * @param {Object} [options] 可选参数
   * @param {string} [options.type='success'] 关注的事件类型
   * @returns {Object} 趋势分析结果
   */
  analyzeTrend(records, options = {}) {
    this._stats.totalAnalyses++;
    const validation = this._validateRecords(records);
    if (!validation.valid) {
      this._stats.validationErrors++;
      return { direction: TrendDirection.INSUFFICIENT, error: validation.error, recordsNeeded: this.config.minRecordsForTrend };
    }

    const safeRecords = validation.records;
    if (safeRecords.length < this.config.minRecordsForTrend) {
      return {
        direction: TrendDirection.INSUFFICIENT,
        recordsNeeded: this.config.minRecordsForTrend - safeRecords.length,
        totalRecords: safeRecords.length,
        confidence: 0,
        confidenceLevel: ConfidenceLevel.INSUFFICIENT
      };
    }

    const targetType = (options && options.type) || 'success';
    const mid = Math.floor(safeRecords.length * this.config.trendComparisonRatio);

    const firstHalf = safeRecords.slice(0, mid);
    const secondHalf = safeRecords.slice(mid);

    const firstCount = firstHalf.filter(r => r && r.type === targetType).length;
    const secondCount = secondHalf.filter(r => r && r.type === targetType).length;

    const firstRate = firstHalf.length > 0 ? firstCount / firstHalf.length : 0;
    const secondRate = secondHalf.length > 0 ? secondCount / secondHalf.length : 0;

    const change = secondRate - firstRate;
    let direction;

    if (Math.abs(change) < 0.05) {
      direction = TrendDirection.STABLE;
    } else if (change > 0) {
      direction = TrendDirection.RISING;
    } else {
      direction = TrendDirection.FALLING;
    }

    const confidence = this._computeConfidence(safeRecords.length, this.config.minRecordsForTrend);
    this._stats.trendAnalyses++;

    return {
      direction,
      change: Math.round(change * 100) / 100,
      firstHalf: { count: firstCount, total: firstHalf.length, rate: Math.round(firstRate * 100) / 100 },
      secondHalf: { count: secondCount, total: secondHalf.length, rate: Math.round(secondRate * 100) / 100 },
      confidence: confidence.score,
      confidenceLevel: confidence.level
    };
  }

  // ── 震荡检测 ──

  /**
   * 通用震荡检测 — 分析记录序列的模式翻转
   * 
   * @param {Array} records 行为记录数组
   * @param {Object} [options] 可选参数
   * @param {number} [options.window] 分析窗口
   * @param {string} [options.typeField='type'] 类型字段名
   * @returns {Object} 震荡检测结果
   */
  detectOscillation(records, options = {}) {
    this._stats.totalAnalyses++;
    const validation = this._validateRecords(records);
    if (!validation.valid) {
      this._stats.validationErrors++;
      return { detected: false, error: validation.error };
    }

    const safeRecords = validation.records;
    const window = (options && options.window) || this.config.oscillationWindow;
    const typeField = (options && options.typeField) || 'type';

    if (safeRecords.length < window) {
      return { detected: false, window, available: safeRecords.length, note: '数据不足，无法检测震荡' };
    }

    const recent = safeRecords.slice(-window);
    const sequence = recent.map(r => (r && typeof r === 'object') ? r[typeField] : null).filter(v => v !== null);

    if (sequence.length < 3) {
      return { detected: false, note: '有效类型数据不足' };
    }

    // 计算翻转率
    let flips = 0;
    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i - 1]) flips++;
    }
    const flipRate = flips / (sequence.length - 1);
    const detected = flipRate >= this.config.oscillationThreshold;

    if (detected) this._stats.oscillationWarnings++;

    // 模式分析：检测是双态还是多态震荡
    const uniqueTypes = new Set(sequence);
    const oscillationType = uniqueTypes.size <= 2 ? 'binary' : 'multi';

    return {
      detected,
      flipRate,
      threshold: this.config.oscillationThreshold,
      window: sequence.length,
      oscillationType,
      uniqueTypes: uniqueTypes.size,
      note: detected
        ? `检测到${oscillationType === 'binary' ? '双态' : '多态'}震荡（翻转率 ${Math.round(flipRate * 100)}%，类型数 ${uniqueTypes.size}）`
        : `状态稳定（翻转率 ${Math.round(flipRate * 100)}%）`
    };
  }

  // ── 综合行为报告 ──

  /**
   * 生成综合行为分析报告
   * 
   * @param {Object} goal 目标对象
   * @returns {Object} 综合分析报告
   */
  generateReport(goal) {
    const goalValidation = this._validateGoal(goal);
    if (!goalValidation.valid) {
      return { error: goalValidation.error, message: goalValidation.suggestion };
    }

    const records = goal.records;
    if (records.length === 0) {
      return { error: ErrorCode.INPUT_EMPTY, message: '无记录，无法生成报告', weekly: null, triggers: [], risk: null };
    }

    const weekly = this.detectWeeklyPattern(records, { includeTrend: true });
    const triggers = this.detectTriggerPattern(records, { topN: 5 });
    const risk = this.detectRelapseRisk(goal, { includeTrend: true });
    const trend = this.analyzeTrend(records);
    const oscillation = this.detectOscillation(records);

    return {
      records: records.length,
      weekly,
      triggers,
      risk,
      trend,
      oscillation
    };
  }

  // ── 历史记录 ──

  /**
   * 记录检测到的模式
   * @private
   */
  _recordPattern(pattern) {
    this._patternHistory.push({
      ...pattern,
      timestamp: Date.now()
    });
    // 限制历史大小
    if (this._patternHistory.length > 100) {
      this._patternHistory = this._patternHistory.slice(-50);
    }
  }

  /**
   * 获取模式检测历史
   */
  getPatternHistory() {
    return this._patternHistory;
  }

  // ── 统计查询 ──

  /**
   * 获取统计数据
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * 重置统计数据
   */
  resetStats() {
    this._stats = {
      totalAnalyses: 0,
      weeklyDetections: 0,
      triggerDetections: 0,
      riskAssessments: 0,
      oscillationWarnings: 0,
      trendAnalyses: 0,
      validationErrors: 0
    };
    this._patternHistory = [];
    return { ok: true };
  }

  /**
   * 获取健康报告
   */
  healthCheck() {
    const warnings = [];
    if (this._stats.validationErrors > this._stats.totalAnalyses * 0.1 && this._stats.totalAnalyses > 10) {
      warnings.push('验证错误率过高（>10%），建议检查输入数据质量');
    }
    if (this._stats.oscillationWarnings > 5) {
      warnings.push('震荡检测频繁触发（>5次），建议调整阈值或检查行为模式');
    }
    return {
      healthy: warnings.length === 0,
      warnings,
      stats: this._stats,
      patternHistorySize: this._patternHistory.length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Proxy 包装 — 确保向后兼容旧调用者
// ═══════════════════════════════════════════════════════════════════════════════

const defaultInstance = new PatternDetector();

const patternDetector = new Proxy(defaultInstance, {
  get(target, prop) {
    // 先检查实例属性/方法
    if (prop in target) return target[prop];
    // 导出类本身
    if (prop === 'PatternDetector') return PatternDetector;
    if (prop === 'ErrorCode') return ErrorCode;
    if (prop === 'TrendDirection') return TrendDirection;
    if (prop === 'ConfidenceLevel') return ConfidenceLevel;
    if (prop === 'DEFAULT_CONFIG') return DEFAULT_CONFIG;
    return undefined;
  }
});

module.exports = { patternDetector, PatternDetector, ErrorCode, TrendDirection, ConfidenceLevel, DEFAULT_CONFIG };
