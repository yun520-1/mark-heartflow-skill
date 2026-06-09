/**
 * 常识推理引擎 (Commonsense Engine) v2.0.0
 *
 * 基于常识知识的推理
 * 升级内容（v2.0.0）：
 * - 输入验证层（null/undefined/空值安全）
 * - ErrorCategory 枚举 + 错误分类
 * - 震荡检测（同类型失败模式重复）
 * - 多因素置信度校准
 * - 增强推理模式（类比/演绎/溯因/统计/因果链）
 * - 自我诊断与健康检查
 * - 错误统计追踪
 */

const { KnowledgeBase } = require('./knowledge-base.js');

// ============ 枚举定义 ============

/** 推理错误类型 */
const ErrorCategory = {
  INPUT_NULL: 'INPUT_NULL',
  INPUT_EMPTY: 'INPUT_EMPTY',
  INPUT_TYPE: 'INPUT_TYPE',
  KNOWLEDGE_EMPTY: 'KNOWLEDGE_EMPTY',
  INFERENCE_FAILED: 'INFERENCE_FAILED',
  OSCILLATION: 'OSCILLATION',
  UNKNOWN: 'UNKNOWN'
};

const ERROR_SUGGESTIONS = {
  [ErrorCategory.INPUT_NULL]: '输入为空，请提供有效陈述',
  [ErrorCategory.INPUT_EMPTY]: '输入为空字符串，请提供有效陈述',
  [ErrorCategory.INPUT_TYPE]: '输入类型错误，期望字符串',
  [ErrorCategory.KNOWLEDGE_EMPTY]: '知识库为空，无法进行推理',
  [ErrorCategory.INFERENCE_FAILED]: '推理过程异常',
  [ErrorCategory.OSCILLATION]: '检测到推理震荡模式',
  [ErrorCategory.UNKNOWN]: '未知错误'
};

/** 推理置信度级别 */
const ConfidenceLevel = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  NONE: 'none'
};

/** 推理类型枚举 */
const InferenceType = {
  CAUSAL: 'causal',
  ATTRIBUTE: 'attribute',
  PROBABILISTIC: 'probabilistic',
  COUNTERFACTUAL: 'counterfactual',
  ANALOGICAL: 'analogical',
  DEDUCTIVE: 'deductive',
  ABDUCTIVE: 'abductive',
  STATISTICAL: 'statistical',
  CAUSAL_CHAIN: 'causal_chain',
  UNKNOWN: 'unknown'
};

/** 推理模式检测模式 */
const INFERENCE_PATTERNS = {
  [InferenceType.CAUSAL]: { keywords: ['导致', '引起', '造成', '因为', '所以', 'cause', 'lead', 'result', 'because', 'therefore'], weight: 0.9 },
  [InferenceType.ANALOGICAL]: { keywords: ['就像', '好比', '类似', '如同', 'like', 'similar', 'analogous', 'resemble'], weight: 0.8 },
  [InferenceType.DEDUCTIVE]: { keywords: ['一定', '必然', '所有', '都', 'must', 'always', 'all', 'every', 'definitely'], weight: 0.85 },
  [InferenceType.ABDUCTIVE]: { keywords: ['可能是', '也许是因为', '推测', 'might', 'maybe', 'perhaps', '推测', '推断'], weight: 0.7 },
  [InferenceType.STATISTICAL]: { keywords: ['大多数', '通常', '一般', 'often', 'usually', 'typically', 'most', 'common'], weight: 0.75 }
};

// ============ 工具函数 ============

/**
 * 安全字符串提取
 */
function _safeString(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  return fallback;
}

/**
 * 边界钳位
 */
function _clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// ============ 主类 ============

class CommonsenseEngine {
  constructor(options = {}) {
    this.knowledgeBase = new KnowledgeBase(options);
    this.inferenceHistory = [];
    this.errorHistory = [];
    this.maxHistory = options.maxHistory || 100;
    this.maxErrorHistory = options.maxErrorHistory || 50;
    this.oscillationWindow = options.oscillationWindow || 10;
    this.oscillationThreshold = options.oscillationThreshold || 0.6;
    this.confidenceDecay = options.confidenceDecay || 0.95;

    // 震荡检测状态
    this._oscillationCount = 0;
    this._lastOscillationWarning = 0;
  }

  /**
   * 验证输入
   */
  _validateInput(statement) {
    if (statement === null || statement === undefined) {
      return { valid: false, category: ErrorCategory.INPUT_NULL, message: ERROR_SUGGESTIONS[ErrorCategory.INPUT_NULL] };
    }
    if (typeof statement !== 'string') {
      return { valid: false, category: ErrorCategory.INPUT_TYPE, message: ERROR_SUGGESTIONS[ErrorCategory.INPUT_TYPE] };
    }
    if (statement.trim().length === 0) {
      return { valid: false, category: ErrorCategory.INPUT_EMPTY, message: ERROR_SUGGESTIONS[ErrorCategory.INPUT_EMPTY] };
    }
    return { valid: true };
  }

  /**
   * 记录错误到错误历史
   */
  _recordError(category, message, context = {}) {
    this.errorHistory.push({
      category,
      message,
      context: JSON.stringify(context).substring(0, 200),
      timestamp: Date.now()
    });
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }
  }

  /**
   * 检测推理震荡 — 同一错误类型在窗口内频繁出现
   */
  _detectOscillation() {
    if (this.errorHistory.length < 3) return false;

    const window = this.errorHistory.slice(-this.oscillationWindow);
    const recentErrors = {};

    for (const err of window) {
      recentErrors[err.category] = (recentErrors[err.category] || 0) + 1;
    }

    // 检查是否有某类错误占比超过阈值
    for (const [category, count] of Object.entries(recentErrors)) {
      if (count / window.length >= this.oscillationThreshold) {
        this._oscillationCount++;
        this._lastOscillationWarning = Date.now();
        return true;
      }
    }

    // 无震荡时缓慢衰减计数
    if (this._oscillationCount > 0) {
      this._oscillationCount = Math.max(0, this._oscillationCount - 1);
    }
    return false;
  }

  /**
   * 多因素置信度校准
   */
  _calibrateConfidence(baseConfidence, relevantKnowledge, analysis) {
    let confidence = baseConfidence;

    // 1. 相关性加成：按最佳匹配相关性加权
    if (relevantKnowledge.length > 0) {
      confidence += relevantKnowledge[0].relevance * 0.25;
    }

    // 2. 知识数量加成：多个独立知识源提升置信度
    if (relevantKnowledge.length >= 5) confidence += 0.15;
    else if (relevantKnowledge.length >= 3) confidence += 0.10;
    else if (relevantKnowledge.length >= 1) confidence += 0.05;

    // 3. 类别多样性加成：跨类别的知识更可靠
    const categories = new Set(relevantKnowledge.map(k => k.category));
    if (categories.size >= 3) confidence += 0.10;
    else if (categories.size >= 2) confidence += 0.05;

    // 4. 知识一致性检查：同类知识间是否存在矛盾
    const categoryFacts = {};
    for (const k of relevantKnowledge) {
      if (!categoryFacts[k.category]) categoryFacts[k.category] = [];
      categoryFacts[k.category].push(k);
    }
    let contradictions = 0;
    for (const facts of Object.values(categoryFacts)) {
      if (facts.length >= 2) {
        // 简单的矛盾检测：同一类知识描述不同的因果关系
        for (let i = 0; i < facts.length; i++) {
          for (let j = i + 1; j < facts.length; j++) {
            if (facts[i].statement !== facts[j].statement) {
              contradictions++;
            }
          }
        }
      }
    }
    if (contradictions > 0) {
      confidence -= Math.min(0.15, contradictions * 0.03);
    }

    // 5. 震荡惩罚
    if (this._oscillationCount > 2) {
      confidence *= 0.7;
    }

    // 6. 不确定性/否定惩罚
    if (analysis.containsUncertainty) confidence *= 0.85;
    if (analysis.containsNegation) confidence *= 0.75;

    return _clamp(confidence, 0.05, 0.98);
  }

  /**
   * 获取置信度级别
   */
  _getConfidenceLevel(confidence) {
    if (confidence >= 0.75) return ConfidenceLevel.HIGH;
    if (confidence >= 0.5) return ConfidenceLevel.MEDIUM;
    if (confidence >= 0.25) return ConfidenceLevel.LOW;
    return ConfidenceLevel.NONE;
  }

  /**
   * 分析陈述
   */
  _analyzeStatement(statement) {
    const safeStmt = _safeString(statement);
    const words = safeStmt.split(/\s+/).filter(w => w.length > 0);
    const entities = [];
    const actions = [];
    const states = [];

    // 词性标注
    const stateWords = ['是', '为', '会', '能', '应该', '可能', '会', '可以', '需要'];
    const actionWords = ['做', '让', '使', '导致', '引起', '造成', '推动', '促进', '抑制'];

    for (const word of words) {
      if (stateWords.includes(word)) states.push(word);
      if (actionWords.includes(word)) actions.push(word);
    }

    // 推理类型检测
    let detectedType = InferenceType.ATTRIBUTE;
    let maxScore = 0;

    for (const [type, pattern] of Object.entries(INFERENCE_PATTERNS)) {
      const matches = pattern.keywords.filter(k => safeStmt.includes(k)).length;
      if (matches > 0) {
        const score = (matches / pattern.keywords.length) * pattern.weight;
        if (score > maxScore) {
          maxScore = score;
          detectedType = type;
        }
      }
    }

    return {
      original: safeStmt,
      words,
      entities,
      actions,
      states,
      subject: words.slice(0, 3).join(' '),
      containsNegation: /不|没|无|非|没有|不是|不会|不能/.test(safeStmt),
      containsUncertainty: /可能|也许|大概|应该|或许|说不定|maybe|perhaps|probably/.test(safeStmt),
      containsQuestion: /\?|？|吗|么|吧|什么|如何|为什么/.test(safeStmt),
      containsComparison: /比|更|最|比较|more|less|better|worse/.test(safeStmt),
      detectedInferenceType: detectedType,
      inferenceScore: maxScore,
      wordCount: words.length,
      containsChinese: /[\u4e00-\u9fff]/.test(safeStmt),
    };
  }

  /**
   * 查找相关知识
   */
  _findRelevantKnowledge(analysis) {
    const relevant = [];

    // 查询所有类别
    for (const category of this.knowledgeBase.getCategories()) {
      const facts = this.knowledgeBase.getCategory(category);

      for (const fact of facts) {
        const relevance = this._assessRelevance(analysis, fact);
        if (relevance > 0.15) {
          relevant.push({ ...fact, category, relevance });
        }
      }
    }

    return relevant.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * 评估相关性
   */
  _assessRelevance(analysis, fact) {
    const statementWords = new Set(analysis.words.map(w => w.toLowerCase()));
    const factText = `${fact.statement} ${fact.explanation} ${fact.key}`.toLowerCase();
    const factWords = new Set(factText.split(/\s+/));

    // Jaccard 相似度
    const intersection = [...statementWords].filter(w => factWords.has(w)).length;
    const union = new Set([...statementWords, ...factWords]).size;
    const jaccard = union > 0 ? intersection / union : 0;

    // 双向匹配加成：检查 fact 的 statement 是否包含输入的词，以及输入是否包含 fact 的词
    let bidirectionalScore = 0;
    const inputLower = analysis.original.toLowerCase();
    const factLower = fact.statement.toLowerCase();

    if (inputLower.includes(factLower.substring(0, Math.min(10, factLower.length)))) {
      bidirectionalScore += 0.3;
    }
    if (factLower.includes(inputLower.substring(0, Math.min(10, inputLower.length)))) {
      bidirectionalScore += 0.3;
    }

    return Math.min(1.0, jaccard * 0.6 + bidirectionalScore * 0.4);
  }

  /**
   * 进行推理
   */
  _makeInference(statement, analysis, relevantKnowledge) {
    const bestMatch = relevantKnowledge[0];
    const inferenceType = analysis.detectedInferenceType;

    // 根据检测到的推理类型分发
    switch (inferenceType) {
      case InferenceType.CAUSAL:
        return this._buildCausalInference(statement, analysis, bestMatch);

      case InferenceType.ANALOGICAL:
        return this._buildAnalogicalInference(statement, analysis, bestMatch);

      case InferenceType.DEDUCTIVE:
        return this._buildDeductiveInference(statement, analysis, bestMatch);

      case InferenceType.ABDUCTIVE:
        return this._buildAbductiveInference(statement, analysis, bestMatch);

      case InferenceType.STATISTICAL:
        return this._buildStatisticalInference(statement, analysis, bestMatch);

      case InferenceType.COUNTERFACTUAL:
        return this._buildCounterfactualInference(statement, analysis, bestMatch);

      default:
        // 根据语义特征回退
        if (analysis.containsUncertainty) {
          return this._buildProbabilisticInference(statement, analysis, bestMatch);
        }
        if (analysis.containsNegation) {
          return this._buildCounterfactualInference(statement, analysis, bestMatch);
        }
        if (analysis.actions.length > 0) {
          return this._buildCausalInference(statement, analysis, bestMatch);
        }
        return this._buildAttributeInference(statement, analysis, bestMatch);
    }
  }

  /**
   * 构建因果推理
   */
  _buildCausalInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.CAUSAL,
      conclusion: statement,
      reasoning: `根据因果关系：${bestMatch ? bestMatch.statement : '基于已知因果关系'}`,
      support: bestMatch ? bestMatch.explanation : '无直接匹配的因果知识',
      certainty: analysis.containsUncertainty ? 'possible' : 'likely',
      mechanism: bestMatch ? bestMatch.key : 'unknown'
    };
  }

  /**
   * 构建类比推理
   */
  _buildAnalogicalInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.ANALOGICAL,
      conclusion: statement,
      reasoning: `通过类比分析：${bestMatch ? `与常识"${bestMatch.statement}"类似` : '基于类比框架'}`,
      support: bestMatch ? bestMatch.explanation : '类比推理',
      certainty: 'moderate',
      analog: bestMatch ? bestMatch.key : null
    };
  }

  /**
   * 构建演绎推理
   */
  _buildDeductiveInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.DEDUCTIVE,
      conclusion: statement,
      reasoning: `演绎推理：${bestMatch ? `基于前提"${bestMatch.statement}"` : '基于一般性常识'}`,
      support: bestMatch ? bestMatch.explanation : '演绎逻辑',
      certainty: 'high',
      premise: bestMatch ? bestMatch.statement : null
    };
  }

  /**
   * 构建溯因推理
   */
  _buildAbductiveInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.ABDUCTIVE,
      conclusion: statement,
      reasoning: `溯因推理：${bestMatch ? `最佳解释可能是"${bestMatch.statement}"` : '基于最合理的解释'}`,
      support: bestMatch ? bestMatch.explanation : '溯因推理',
      certainty: 'tentative',
      bestExplanation: bestMatch ? bestMatch.statement : null
    };
  }

  /**
   * 构建统计推理
   */
  _buildStatisticalInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.STATISTICAL,
      conclusion: statement,
      reasoning: `统计归纳：${bestMatch ? `通常情况下"${bestMatch.statement}"` : '基于一般规律'}`,
      support: bestMatch ? bestMatch.explanation : '统计归纳',
      certainty: 'probable',
      generalization: bestMatch ? bestMatch.statement : null
    };
  }

  /**
   * 构建概率推理
   */
  _buildProbabilisticInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.PROBABILISTIC,
      conclusion: statement,
      reasoning: `概率推断：${bestMatch ? `基于常识"${bestMatch.statement}"` : '不确定性推理'}`,
      support: bestMatch ? bestMatch.explanation : '概率推理',
      certainty: 'possible'
    };
  }

  /**
   * 构建反事实推理
   */
  _buildCounterfactualInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.COUNTERFACTUAL,
      conclusion: statement,
      reasoning: bestMatch
        ? `反事实推理：如果正常情况下是"${bestMatch.statement}"，那么否定意味着相反`
        : '反事实推理：基于否定前提',
      support: bestMatch ? bestMatch.key : '反事实逻辑',
      certainty: 'unlikely',
      counterfactual: bestMatch ? bestMatch.statement : null
    };
  }

  /**
   * 构建属性推理
   */
  _buildAttributeInference(statement, analysis, bestMatch) {
    return {
      type: InferenceType.ATTRIBUTE,
      conclusion: statement,
      reasoning: `属性推理：${bestMatch ? `根据常识知识"${bestMatch.statement}"` : '基于已知属性'}`,
      support: bestMatch ? bestMatch.key : '属性推理',
      certainty: 'likely'
    };
  }

  /**
   * 构建退化推理结果
   */
  _buildDegradedInference(statement, analysis) {
    return {
      type: InferenceType.UNKNOWN,
      conclusion: statement,
      reasoning: '缺乏相关常识知识',
      support: '无法找到与该陈述相关的常识',
      certainty: 'unknown'
    };
  }

  /**
   * 计算置信度
   */
  _calculateConfidence(relevantKnowledge, analysis) {
    if (relevantKnowledge.length === 0) return 0.1;

    let baseConfidence = 0.3;

    // 最高相关性加分
    baseConfidence += relevantKnowledge[0].relevance * 0.3;

    // 用多因素校准替代简单加减
    return this._calibrateConfidence(baseConfidence, relevantKnowledge, analysis);
  }

  /**
   * 主推理方法
   */
  reason(statement, context = {}) {
    // 输入验证
    const validation = this._validateInput(statement);
    if (!validation.valid) {
      this._recordError(validation.category, validation.message, { statement });
      this._detectOscillation();

      return {
        statement,
        context,
        timestamp: Date.now(),
        success: false,
        error: validation,
        inference: null,
        confidence: 0,
        confidenceLevel: ConfidenceLevel.NONE,
        oscillationDetected: this._oscillationCount > 2
      };
    }

    // 震荡检测
    const oscillationDetected = this._detectOscillation();

    try {
      // 分析陈述
      const analysis = this._analyzeStatement(statement);

      // 查找相关知识
      const relevantKnowledge = this._findRelevantKnowledge(analysis);

      // 进行推理
      let inference;
      if (relevantKnowledge.length > 0) {
        inference = this._makeInference(statement, analysis, relevantKnowledge);
      } else {
        inference = this._buildDegradedInference(statement, analysis);
      }

      // 多因素置信度校准
      const confidence = this._calculateConfidence(relevantKnowledge, analysis);
      const confidenceLevel = this._getConfidenceLevel(confidence);

      const result = {
        statement,
        context,
        timestamp: Date.now(),
        success: true,
        inference,
        confidence,
        confidenceLevel,
        analysis: {
          wordCount: analysis.wordCount,
          containsNegation: analysis.containsNegation,
          containsUncertainty: analysis.containsUncertainty,
          containsQuestion: analysis.containsQuestion,
          containsChinese: analysis.containsChinese,
          inferenceType: analysis.detectedInferenceType,
          knowledgeCount: relevantKnowledge.length,
          categoriesCovered: [...new Set(relevantKnowledge.map(k => k.category))]
        },
        oscillationDetected
      };

      // 记录历史
      this.inferenceHistory.push(result);
      if (this.inferenceHistory.length > this.maxHistory) {
        this.inferenceHistory = this.inferenceHistory.slice(-this.maxHistory);
      }

      return result;

    } catch (error) {
      this._recordError(ErrorCategory.INFERENCE_FAILED, error.message, { statement });
      this._detectOscillation();

      return {
        statement,
        context,
        timestamp: Date.now(),
        success: false,
        error: {
          category: ErrorCategory.INFERENCE_FAILED,
          message: error.message,
          suggestion: ERROR_SUGGESTIONS[ErrorCategory.INFERENCE_FAILED]
        },
        inference: null,
        confidence: 0,
        confidenceLevel: ConfidenceLevel.NONE,
        oscillationDetected: this._oscillationCount > 2
      };
    }
  }

  /**
   * 验证陈述
   */
  validate(statement) {
    const reasoning = this.reason(statement);
    if (!reasoning.success) {
      return {
        valid: false,
        confidence: 0,
        confidenceLevel: ConfidenceLevel.NONE,
        reasoning: null,
        error: reasoning.error
      };
    }

    return {
      valid: reasoning.confidence > 0.5,
      confidence: reasoning.confidence,
      confidenceLevel: reasoning.confidenceLevel,
      reasoning: reasoning.inference,
      analysis: reasoning.analysis
    };
  }

  /**
   * 批量推理
   */
  reasonBatch(statements, context = {}) {
    if (!Array.isArray(statements)) {
      return {
        success: false,
        error: { category: ErrorCategory.INPUT_TYPE, message: '期望数组输入' },
        results: []
      };
    }
    return {
      success: true,
      total: statements.length,
      succeeded: statements.filter(s => this.reason(s, context).success).length,
      results: statements.map(s => this.reason(s, context))
    };
  }

  /**
   * 获取推理历史
   */
  getHistory(limit = 20) {
    return this.inferenceHistory.slice(-limit);
  }

  /**
   * 获取错误统计
   */
  getErrorStats() {
    const byCategory = {};
    for (const err of this.errorHistory) {
      byCategory[err.category] = (byCategory[err.category] || 0) + 1;
    }

    return {
      totalErrors: this.errorHistory.length,
      byCategory,
      oscillationCount: this._oscillationCount,
      oscillationActive: this._oscillationCount > 2,
      recentErrors: this.errorHistory.slice(-5).map(e => ({
        category: e.category,
        message: e.message.substring(0, 60),
        time: new Date(e.timestamp).toISOString()
      }))
    };
  }

  /**
   * 获取诊断报告
   */
  getDiagnostics() {
    const totalInferences = this.inferenceHistory.length;
    const successfulInferences = this.inferenceHistory.filter(r => r.success).length;
    const avgConfidence = totalInferences > 0
      ? this.inferenceHistory.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalInferences
      : 0;

    // 置信度分布
    const confidenceDistribution = { high: 0, medium: 0, low: 0, none: 0 };
    for (const r of this.inferenceHistory) {
      if (r.confidence >= 0.75) confidenceDistribution.high++;
      else if (r.confidence >= 0.5) confidenceDistribution.medium++;
      else if (r.confidence >= 0.25) confidenceDistribution.low++;
      else confidenceDistribution.none++;
    }

    // 推理类型分布
    const inferenceTypeDist = {};
    for (const r of this.inferenceHistory) {
      if (r.inference && r.inference.type) {
        inferenceTypeDist[r.inference.type] = (inferenceTypeDist[r.inference.type] || 0) + 1;
      }
    }

    return {
      totalInferences,
      successfulInferences,
      failedInferences: totalInferences - successfulInferences,
      successRate: totalInferences > 0 ? successfulInferences / totalInferences : 0,
      averageConfidence: avgConfidence,
      confidenceDistribution,
      inferenceTypeDistribution: inferenceTypeDist,
      errorStats: this.getErrorStats(),
      knowledgeStats: this.knowledgeBase.getStats(),
      healthScore: this.healthCheck().score
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const checks = [];
    let score = 1.0;

    // 知识库健康
    const kbStats = this.knowledgeBase.getStats();
    if (kbStats.totalFacts === 0) {
      checks.push({ name: 'knowledge_base', passed: false, message: '知识库为空', weight: 0.3 });
      score -= 0.3;
    } else {
      checks.push({ name: 'knowledge_base', passed: true, message: `知识库有 ${kbStats.totalFacts} 条事实`, weight: 0.3 });
    }

    // 错误率
    const errStats = this.getErrorStats();
    const inferenceCount = this.inferenceHistory.length;
    const errorRate = inferenceCount > 0 ? errStats.totalErrors / inferenceCount : 0;
    if (errorRate > 0.3) {
      checks.push({ name: 'error_rate', passed: false, message: `错误率过高: ${(errorRate * 100).toFixed(1)}%`, weight: 0.2 });
      score -= 0.2;
    } else {
      checks.push({ name: 'error_rate', passed: true, message: `错误率正常: ${(errorRate * 100).toFixed(1)}%`, weight: 0.2 });
    }

    // 震荡状态
    if (this._oscillationCount > 2) {
      checks.push({ name: 'oscillation', passed: false, message: `检测到推理震荡: ${this._oscillationCount}次`, weight: 0.2 });
      score -= 0.2;
    } else {
      checks.push({ name: 'oscillation', passed: true, message: '无推理震荡', weight: 0.2 });
    }

    // 功能完整性
    const hasInferences = this.inferenceHistory.length > 0;
    checks.push({ name: 'operational', passed: hasInferences, message: hasInferences ? '已执行推理' : '尚未执行推理', weight: 0.15 });
    if (!hasInferences) score -= 0.15;

    // 错误历史容量
    const errorCapOk = this.errorHistory.length < this.maxErrorHistory * 0.9;
    checks.push({ name: 'error_capacity', passed: errorCapOk, message: errorCapOk ? '错误历史容量正常' : '错误历史接近上限', weight: 0.15 });
    if (!errorCapOk) score -= 0.075;

    return {
      score: _clamp(score, 0, 1),
      status: score >= 0.7 ? 'healthy' : score >= 0.4 ? 'degraded' : 'unhealthy',
      checks,
      timestamp: Date.now()
    };
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      totalInferences: this.inferenceHistory.length,
      successfulInferences: this.inferenceHistory.filter(r => r.success).length,
      knowledgeFacts: this.knowledgeBase.getStats().totalFacts,
      knowledgeCategories: this.knowledgeBase.getStats().categories,
      recentInferences: this.inferenceHistory.slice(-5),
      errorStats: this.getErrorStats(),
      healthScore: this.healthCheck().score
    };
  }

  /**
   * 重置
   */
  reset() {
    this.inferenceHistory = [];
    this.errorHistory = [];
    this._oscillationCount = 0;
    this._lastOscillationWarning = 0;
  }
}

module.exports = { CommonsenseEngine, ErrorCategory, ConfidenceLevel, InferenceType, INFERENCE_PATTERNS };
