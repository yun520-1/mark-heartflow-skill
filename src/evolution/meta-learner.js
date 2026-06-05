/**
 * MetaLearner v2.0.0 — 元学习器
 * 从经验中学习学习本身，具备独立的质量评估、模式提取和诊断能力。
 * 底层委托 MetaLearning 核心引擎执行具体学习策略。
 */

const { MetaLearning } = require('../core/self-evolution/meta-learning.js');

// ============================================================================
// 教训类别枚举
// ============================================================================
const LessonCategory = {
  TECHNICAL: 'technical',       // 技术/实现类教训
  BEHAVIORAL: 'behavioral',     // 行为/交互类教训
  STRATEGIC: 'strategic',       // 策略/决策类教训
  ARCHITECTURAL: 'architectural', // 架构/设计类教训
  PROCESS: 'process',           // 流程/工作流类教训
  SECURITY: 'security',         // 安全/风险类教训
  COMMUNICATION: 'communication', // 沟通/表达类教训
  GENERAL: 'general'            // 通用/其他
};

// ============================================================================
// 教训质量等级
// ============================================================================
const LessonQuality = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
};

// ============================================================================
// 类别关键词映射
// ============================================================================
const CATEGORY_KEYWORDS = {
  [LessonCategory.TECHNICAL]: ['api', 'function', 'code', 'bug', 'error', 'crash', '类型', '函数', '接口', '报错', '异常', '性能'],
  [LessonCategory.BEHAVIORAL]: ['respond', 'reply', 'reaction', 'behavior', '习惯', '反应', '行为', '响应', '方式'],
  [LessonCategory.STRATEGIC]: ['strategy', 'approach', 'method', 'plan', '方向', '策略', '方法', '方案', '路径', '优先级'],
  [LessonCategory.ARCHITECTURAL]: ['architecture', 'design', 'structure', 'pattern', '架构', '设计', '结构', '模式', '耦合'],
  [LessonCategory.PROCESS]: ['workflow', 'step', 'flow', 'pipeline', '流程', '步骤', '顺序', '工作流', '流程'],
  [LessonCategory.SECURITY]: ['security', 'auth', 'password', 'vulnerability', '安全', '权限', '密码', '漏洞', '风险'],
  [LessonCategory.COMMUNICATION]: ['clarify', 'explain', 'communicate', 'ask', '沟通', '说明', '询问', '确认', '反馈']
};

// ============================================================================
// 质量评分关键词
// ============================================================================
const QUALITY_PATTERNS = {
  completeness: {
    keywords: ['因为', '所以', '导致', '解决', '步骤', '方案', '结果', '原因', 'after', 'because', 'result', 'cause', 'fix', 'solution'],
    weight: 0.3
  },
  specificity: {
    keywords: ['v1', 'v2', '第', '次', '时', '场景', '当', '遇到', '遇到', 'in', 'when', 'at', 'during', 'scenario', 'case'],
    weight: 0.3
  },
  actionability: {
    keywords: ['应该', '可以', '需要', '建议', '记住', '下次', 'should', 'must', 'need', 'remember', 'next', 'always', 'never'],
    weight: 0.25
  },
  measurability: {
    keywords: ['秒', '分钟', '小时', '次', '%', '数字', '数量', 'ms', 'sec', 'min', 'times', 'count', 'rate', 'percent'],
    weight: 0.15
  }
};

// ============================================================================
// 默认配置
// ============================================================================
const DEFAULT_CONFIG = {
  maxHistory: 200,           // 最大保留教训数
  qualityThreshold: 0.3,     // 最低质量分数（低于此值的教训被标记为lowQuality）
  autoPruneThreshold: 100,   // 超过此数量自动修剪
  recallMaxCount: 10,        // recall() 最大返回数
  recallMinConfidence: 0.2   // recall() 最低置信度
};

// ============================================================================
// MetaLearner 类
// ============================================================================
class MetaLearner {
  constructor(hf = {}) {
    this.hf = hf;
    this.projectRoot = hf.rootPath || hf.projectRoot || process.cwd();
    this.core = null;
    this._history = [];       // 独立教训历史（持久化可选）
    this._stats = {
      totalLessons: 0,
      highQualityLessons: 0,
      byCategory: {},
      byQuality: {},
      lastLearnedAt: null,
      averageQuality: 0,
      qualitySum: 0
    };
    this._config = { ...DEFAULT_CONFIG };
  }

  boot() {
    this.core = new MetaLearning(this.projectRoot);
    return this;
  }

  // ========================================================================
  // 核心方法
  // ========================================================================

  /**
   * 学习一个教训 — 评估质量、提取模式、分类存储
   * @param {string|Object} lesson - 教训内容或 { content, context, source }
   * @returns {Object} 学习结果
   */
  learn(lesson) {
    const parsed = this._parseLesson(lesson);
    const quality = this._assessQuality(parsed.content);
    const category = this._categorize(parsed.content);
    const patterns = this._extractPatterns(parsed.content);
    const keywords = this._extractKeywords(parsed.content);

    const entry = {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      content: parsed.content,
      context: parsed.context || '',
      source: parsed.source || 'unknown',
      category,
      quality: quality.grade,
      qualityScore: quality.score,
      patterns,
      keywords,
      confidence: this._computeConfidence(quality.score, patterns.length, category),
      timestamp: new Date().toISOString(),
      accessCount: 0
    };

    this._history.push(entry);
    this._updateStats(entry);

    // 委托核心引擎进行深度元学习（如果可用）
    let coreResult = { learned: true, lesson };
    if (this.core && typeof this.core.learn === 'function') {
      try {
        const input = `${parsed.content}${parsed.context ? ' (context: ' + parsed.context + ')' : ''}`;
        coreResult = this.core.learn(input, { category, patterns, quality: quality.score });
      } catch (e) {
        coreResult = { learned: true, lesson, error: e.message };
      }
    }

    // 自动修剪（超过阈值）
    this._autoPrune();

    return {
      learned: true,
      lesson: parsed.content,
      id: entry.id,
      category,
      quality: quality.grade,
      qualityScore: quality.score,
      patterns: patterns.length,
      keywords: keywords.length,
      confidence: entry.confidence,
      coreResult
    };
  }

  /**
   * 回顾最相关的历史教训
   * @param {string} query - 查询内容
   * @param {Object} [opts] - 选项
   * @param {number} [opts.maxCount] - 最大返回数
   * @param {string} [opts.category] - 按类别筛选
   * @param {number} [opts.minConfidence] - 最低置信度
   * @returns {Object[]} 排序后的教训列表
   */
  recall(query, opts = {}) {
    const maxCount = opts.maxCount || this._config.recallMaxCount;
    const minConfidence = opts.minConfidence ?? this._config.recallMinConfidence;
    const queryLower = (query || '').toLowerCase();

    if (this._history.length === 0) return [];

    // 计算每个教训与查询的相关性
    const scored = this._history.map(entry => {
      const relevance = this._computeRelevance(entry, queryLower);
      const score = relevance * 0.6 + entry.confidence * 0.3 + entry.qualityScore * 0.1;
      return { ...entry, relevance, score };
    });

    // 筛选
    let filtered = scored.filter(e => e.score >= minConfidence);
    if (opts.category) {
      filtered = filtered.filter(e => e.category === opts.category);
    }

    // 按分数排序
    filtered.sort((a, b) => b.score - a.score);

    // 记录访问
    const top = filtered.slice(0, maxCount);
    for (const entry of top) {
      const found = this._history.find(e => e.id === entry.id);
      if (found) found.accessCount++;
    }

    return top.map(e => ({
      id: e.id,
      content: e.content,
      category: e.category,
      quality: e.quality,
      qualityScore: e.qualityScore,
      confidence: e.confidence,
      relevance: e.relevance,
      score: e.score,
      patterns: e.patterns,
      keywords: e.keywords,
      timestamp: e.timestamp
    }));
  }

  /**
   * 获取学习统计
   * @returns {Object}
   */
  getStats() {
    const coreStats = this.core && typeof this.core.getStats === 'function'
      ? this.core.getStats()
      : { strategies: [], patterns: 0, bestStrategy: 'none' };

    return {
      enabled: !!this.core,
      version: 'v2.0.0',
      lessons: {
        total: this._stats.totalLessons,
        highQuality: this._stats.highQualityLessons,
        averageQuality: parseFloat(this._stats.averageQuality.toFixed(3)),
        byCategory: { ...this._stats.byCategory },
        byQuality: { ...this._stats.byQuality },
        lastLearnedAt: this._stats.lastLearnedAt
      },
      core: coreStats,
      historySize: this._history.length,
      config: { ...this._config }
    };
  }

  /**
   * 获取诊断信息
   * @returns {Object}
   */
  getDiagnostics() {
    const stats = this.getStats();
    const recentLessons = this._history.slice(-10);

    // 质量趋势分析
    let qualityTrend = 'stable';
    if (this._history.length >= 10) {
      const recent = this._history.slice(-5);
      const older = this._history.slice(-10, -5);
      const recentAvg = recent.reduce((s, e) => s + e.qualityScore, 0) / recent.length;
      const olderAvg = older.reduce((s, e) => s + e.qualityScore, 0) / older.length;
      if (recentAvg > olderAvg + 0.1) qualityTrend = 'improving';
      else if (recentAvg < olderAvg - 0.1) qualityTrend = 'declining';
    }

    // 类别分布诊断
    const categoryEntries = Object.entries(this._stats.byCategory);
    const dominantCategory = categoryEntries.length > 0
      ? categoryEntries.sort((a, b) => b[1] - a[1])[0][0]
      : 'none';

    // 低质量教训占比
    const lowQualityCount = this._stats.byQuality[LessonQuality.POOR] || 0;
    const lowQualityRatio = stats.lessons.total > 0
      ? (lowQualityCount / stats.lessons.total).toFixed(2)
      : 0;

    return {
      healthy: lowQualityRatio <= 0.3,
      totalLessons: stats.lessons.total,
      qualityTrend,
      dominantCategory,
      lowQualityRatio: parseFloat(lowQualityRatio),
      averageQuality: stats.lessons.averageQuality,
      coreActive: stats.enabled,
      historyFull: this._history.length >= this._config.maxHistory * 0.9,
      recentLessons: recentLessons.map(e => ({
        id: e.id,
        qualityScore: e.qualityScore,
        category: e.category,
        patterns: e.patterns.length
      })),
      recommendations: this._generateRecommendations(stats, qualityTrend, lowQualityRatio)
    };
  }

  /**
   * 清理 — 空操作，保持接口兼容
   */
  shutdown() {
    this._history = [];
    this._stats = {
      totalLessons: 0, highQualityLessons: 0,
      byCategory: {}, byQuality: {},
      lastLearnedAt: null, averageQuality: 0, qualitySum: 0
    };
  }

  // ========================================================================
  // 内部方法
  // ========================================================================

  /**
   * 解析教训输入（支持字符串或对象）
   * @private
   */
  _parseLesson(lesson) {
    if (typeof lesson === 'string') {
      return { content: lesson, context: '', source: 'direct' };
    }
    if (lesson && typeof lesson === 'object') {
      return {
        content: String(lesson.content || lesson.lesson || ''),
        context: String(lesson.context || ''),
        source: String(lesson.source || 'unknown')
      };
    }
    return { content: String(lesson), context: '', source: 'unknown' };
  }

  /**
   * 评估教训质量（4维度加权评分）
   * @private
   * @returns {{ score: number, grade: string }}
   */
  _assessQuality(content) {
    if (!content || content.length < 5) return { score: 0, grade: LessonQuality.POOR };

    const lower = content.toLowerCase();
    let totalScore = 0;

    for (const [dimension, config] of Object.entries(QUALITY_PATTERNS)) {
      let matchCount = 0;
      for (const kw of config.keywords) {
        if (lower.includes(kw)) matchCount++;
      }
      const dimScore = Math.min(matchCount / 3, 1.0); // 最多3个匹配得满分
      totalScore += dimScore * config.weight;
    }

    // 长度加分（足够详细的教训更有价值）
    const lengthBonus = Math.min(content.length / 200, 0.15);
    totalScore = Math.min(totalScore + lengthBonus, 1.0);

    // 分级
    let grade;
    if (totalScore >= 0.7) grade = LessonQuality.EXCELLENT;
    else if (totalScore >= 0.5) grade = LessonQuality.GOOD;
    else if (totalScore >= 0.3) grade = LessonQuality.FAIR;
    else grade = LessonQuality.POOR;

    return { score: parseFloat(totalScore.toFixed(3)), grade };
  }

  /**
   * 自动分类教训
   * @private
   * @returns {string} 类别名
   */
  _categorize(content) {
    if (!content) return LessonCategory.GENERAL;
    const lower = content.toLowerCase();

    let bestCategory = LessonCategory.GENERAL;
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      // 加权：匹配越多越确定
      score = score / Math.max(keywords.length, 1);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // 阈值保护：低于阈值返回 GENERAL
    return bestScore >= 0.05 ? bestCategory : LessonCategory.GENERAL;
  }

  /**
   * 从教训内容中提取可复用模式
   * @private
   * @returns {string[]}
   */
  _extractPatterns(content) {
    if (!content || content.length < 10) return [];

    const lower = content.toLowerCase();
    const patterns = [];

    // 模式1: 条件模式（"当X时，应该Y"）
    if (/当.*时/.test(lower) || /when.*should/.test(lower) || /when.*must/.test(lower) || /when.*always/.test(lower)) {
      patterns.push('conditional-rule');
    }

    // 模式2: 因果模式（"因为X，所以Y"）
    if (/因为.*所以/.test(lower) || /because.*should/.test(lower) || /since.*must/.test(lower) || /because.*result/.test(lower)) {
      patterns.push('causal-chain');
    }

    // 模式3: 预防模式（"避免X" / "不要Y"）
    if (/避免|不要|never|avoid|prevent/.test(lower)) {
      patterns.push('prevention');
    }

    // 模式4: 验证模式（"检查X" / "确认Y"）
    if (/检查|确认|verify|check|validate|ensure/.test(lower)) {
      patterns.push('verification');
    }

    // 模式5: 顺序模式（"先X再Y" / "step1...step2"）
    if (/先.*再|first.*then|step\s*\d|步骤/.test(lower)) {
      patterns.push('ordered-steps');
    }

    // 模式6: 异常模式（"如果X失败" / "error case"）
    if (/失败|异常|error|fail|exception|edge\s*case/.test(lower)) {
      patterns.push('error-handling');
    }

    // 模式7: 推荐模式（"推荐X" / "建议Y"）
    if (/推荐|建议|recommend|suggest|prefer/.test(lower)) {
      patterns.push('recommendation');
    }

    // 模式8: 对比模式（"X优于Y" / "X vs Y"）
    if (/优于|better.*than|instead\s*of|rather\s*than|compared/.test(lower)) {
      patterns.push('comparison');
    }

    return patterns;
  }

  /**
   * 提取关键词
   * @private
   * @returns {string[]}
   */
  _extractKeywords(content) {
    if (!content || content.length < 5) return [];
    // 按标点/空格分割，取长度≥3的非停用词
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her',
      'was', 'one', 'our', 'out', 'has', 'have', 'been', 'some', 'them', 'than',
      'this', 'that', 'with', 'from', 'they', 'what', 'when', 'where', 'which',
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看',
      '好', '自己', '这', '他', '她', '它', '们']);
    const words = content.split(/[\s,，。！？、；：""''（）\(\)\[\]{}]+/);
    const unique = new Set();
    for (const w of words) {
      const clean = w.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '').toLowerCase();
      if (clean.length >= 2 && !stopWords.has(clean) && !/^\d+$/.test(clean)) {
        unique.add(clean);
      }
    }
    return Array.from(unique).slice(0, 10);
  }

  /**
   * 计算置信度（综合质量、模式数、类别确定性）
   * @private
   */
  _computeConfidence(qualityScore, patternCount, category) {
    const qualityFactor = qualityScore;
    const patternFactor = Math.min(patternCount / 4, 1.0);
    const categoryFactor = category === LessonCategory.GENERAL ? 0.5 : 0.9;
    return parseFloat(((qualityFactor * 0.5) + (patternFactor * 0.3) + (categoryFactor * 0.2)).toFixed(3));
  }

  /**
   * 计算教训与查询的相关性
   * @private
   */
  _computeRelevance(entry, queryLower) {
    if (!queryLower) return 0.5; // 无查询时返回中间值

    const contentLower = entry.content.toLowerCase();
    const contextLower = (entry.context || '').toLowerCase();
    const allText = contentLower + ' ' + contextLower;

    // 关键词重叠率
    const queryWords = queryLower.split(/[\s,，。]+/).filter(w => w.length >= 2);
    if (queryWords.length === 0) return 0.3;

    let matchCount = 0;
    for (const qw of queryWords) {
      if (allText.includes(qw)) matchCount++;
    }
    const overlap = matchCount / queryWords.length;

    // 类别匹配加分
    const categoryBoost = entry.keywords.some(k => queryLower.includes(k)) ? 0.15 : 0;

    // 模式匹配加分
    const patternBoost = entry.patterns.some(p => queryLower.includes(p)) ? 0.1 : 0;

    // 质量加权
    const qualityBoost = entry.qualityScore * 0.1;

    return Math.min(overlap + categoryBoost + patternBoost + qualityBoost, 1.0);
  }

  /**
   * 更新统计
   * @private
   */
  _updateStats(entry) {
    this._stats.totalLessons++;
    this._stats.lastLearnedAt = entry.timestamp;
    this._stats.qualitySum += entry.qualityScore;
    this._stats.averageQuality = this._stats.qualitySum / this._stats.totalLessons;

    // 按类别
    this._stats.byCategory[entry.category] = (this._stats.byCategory[entry.category] || 0) + 1;

    // 按质量
    this._stats.byQuality[entry.quality] = (this._stats.byQuality[entry.quality] || 0) + 1;

    // 高质量计数
    if (entry.quality === LessonQuality.EXCELLENT || entry.quality === LessonQuality.GOOD) {
      this._stats.highQualityLessons++;
    }
  }

  /**
   * 自动修剪（保留最新且有质量的教训）
   * @private
   */
  _autoPrune() {
    if (this._history.length <= this._config.autoPruneThreshold) return;

    // 按 (qualityScore + confidence) 排序，保留最好的
    this._history.sort((a, b) => (b.qualityScore + b.confidence) - (a.qualityScore + a.confidence));
    this._history = this._history.slice(0, this._config.maxHistory);

    // 重新按时间排序
    this._history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * 生成诊断建议
   * @private
   */
  _generateRecommendations(stats, qualityTrend, lowQualityRatio) {
    const recs = [];

    if (lowQualityRatio > 0.3) {
      recs.push('低质量教训比例过高，建议提供更详细、有因果关系的教训内容');
    }
    if (qualityTrend === 'declining') {
      recs.push('教训质量呈下降趋势，建议回顾并优化教训记录方式');
    }
    if (stats.lessons.total === 0) {
      recs.push('尚无教训记录，建议从当前经验开始积累');
    }
    if (this._history.length >= this._config.maxHistory * 0.9) {
      recs.push('教训历史接近容量上限，自动修剪已就绪');
    }
    if (!stats.enabled) {
      recs.push('核心元学习引擎未启动，部分功能受限');
    }

    // 检查类别多样性
    const categoryCount = Object.keys(this._stats.byCategory).length;
    if (stats.lessons.total > 10 && categoryCount <= 2) {
      recs.push('教训类别单一（仅' + categoryCount + '类），建议扩展关注领域');
    }

    return recs;
  }
}

module.exports = { MetaLearner, LessonCategory, LessonQuality };
