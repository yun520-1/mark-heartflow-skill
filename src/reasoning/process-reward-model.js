/**
 * ProcessRewardModel v1.0.0 — 步骤级推理奖励模型
 *
 * 灵感来源:
 * - "Let's Verify Step by Step" (Lightman et al., 2023) — 步骤级奖励标注
 * - "Process Supervision vs Outcome Supervision" — 过程奖励 vs 结果奖励
 * - "RewardBench" (2024) — 奖励模型评估基准
 * - MCTS + PRM (LLaMA-Berry, 2024) — 蒙特卡洛搜索中的过程指导
 *
 * 核心机制:
 * 1. 对推理链中每个步骤进行多维度评分 (0-1)
 * 2. 五个评分维度: 逻辑一致性 / 证据质量 / 完整性 / 清晰度 / 新颖性
 * 3. 识别弱步骤 (score < 0.5) 并生成改进建议
 * 4. 整体链级评分: 加权平均 + 最低步骤惩罚
 *
 * 步骤类型:
 * - premise    前提: 建立推理基础
 * - inference  推断: 从前提到结论的推理
 * - evidence   证据: 提供支持性证据
 * - conclusion 结论: 最终结论或答案
 * - counterargument 反论: 提出反对意见或替代视角
 *
 * 适用场景:
 * - 验证 LLM 推理链质量
 * - MCTS 搜索中的步骤选择
 * - 自动检测推理薄弱环节
 * - 生成推理改进建议
 */

const VERSION = '1.0.0';

// ─── 步骤类型定义 ─────────────────────────────────────────────────────────

/**
 * 步骤类型及其特征描述 / Step type definitions and characteristic descriptions
 */
const STEP_TYPES = {
  premise: {
    label: '前提',
    description: '建立推理基础的陈述',
    keyIndicators: ['假设', '已知', '定义', '前提', '给定', 'assume', 'given', 'definition'],
    baseWeight: { logical: 0.25, evidence: 0.20, completeness: 0.25, clarity: 0.20, novelty: 0.10 },
  },
  inference: {
    label: '推断',
    description: '从前提到结论的逻辑推理',
    keyIndicators: ['因此', '所以', '推出', '推导', '得出', 'therefore', 'thus', 'implies', 'follows'],
    baseWeight: { logical: 0.40, evidence: 0.15, completeness: 0.20, clarity: 0.15, novelty: 0.10 },
  },
  evidence: {
    label: '证据',
    description: '提供支持性数据或引用',
    keyIndicators: ['数据', '研究', '证明', '表明', '数据', 'evidence', 'study', 'data', 'shows'],
    baseWeight: { logical: 0.20, evidence: 0.40, completeness: 0.15, clarity: 0.15, novelty: 0.10 },
  },
  conclusion: {
    label: '结论',
    description: '总结性的最终判断',
    keyIndicators: ['综上所述', '总结', '最终', '结论', '因此', 'conclusion', 'summary', 'ultimately'],
    baseWeight: { logical: 0.30, evidence: 0.20, completeness: 0.30, clarity: 0.10, novelty: 0.10 },
  },
  counterargument: {
    label: '反论',
    description: '提出反对或替代视角',
    keyIndicators: ['然而', '但是', '反过来说', '另一方面', 'however', 'but', 'counter', 'alternatively'],
    baseWeight: { logical: 0.25, evidence: 0.25, completeness: 0.20, clarity: 0.15, novelty: 0.15 },
  },
};

// ─── 改进建议模板 / Improvement suggestion templates ───────────────────

const IMPROVEMENT_TEMPLATES = {
  logical: {
    low: [
      '此步骤的逻辑推导链条不完整，缺少关键的中间推理环节。建议补充 "{prevStep}" 到当前步骤之间的逻辑桥梁。',
      '推理跳步明显：从前提直接跳到结论，中间缺乏必要的演绎过程。请明确展示推理的每一步。',
      '该步骤存在逻辑跳跃，前后的论述没有建立清晰的因果关系。建议使用 "因为...所以..." 的结构重新表述。',
    ],
    medium: [
      '逻辑链条基本成立，但某些中间环节可以更严谨。建议补充前提假设的说明。',
      '推理方向正确，但推导过程的严密性有待加强。考虑添加反例检验。',
    ],
  },
  evidence: {
    low: [
      '该步骤缺乏具体证据支撑。如果这是一个事实性断言，请提供数据来源、研究引用或具体案例。',
      '仅有结论性陈述，没有支撑性证据。建议引用具体数据、实验结果或权威来源。',
      '论证过程缺少事实依据。请补充可验证的证据或明确标注为个人观点。',
    ],
    medium: [
      '有证据引用但不够具体。建议提供更详细的数据或来源信息。',
      '证据存在但说服力有限。可补充更多样本或交叉验证来源。',
    ],
  },
  completeness: {
    low: [
      '该步骤仅覆盖问题的一个方面，忽略了其他重要维度。请考虑问题的多角度分析。',
      '回答不完整，遗漏了关键考量因素。建议补充边界条件、例外情况或限制假设。',
      '分析深度不足，停留在表面层次。需要进一步深入探讨核心矛盾或根本原因。',
    ],
    medium: [
      '主要论点已覆盖，但细节部分可更全面。建议补充特殊情况说明。',
      '框架完整，但某些假设条件未充分讨论。可增加前提条件的显式声明。',
    ],
  },
  clarity: {
    low: [
      '表述模糊，读者难以准确理解推理意图。建议使用更精确的术语和更清晰的结构。',
      '句子结构复杂，核心论点被掩盖。请提炼关键句，使用简明直接的语言重述。',
      '概念混用或术语不一致导致理解困难。建议统一术语定义并澄清核心概念。',
    ],
    medium: [
      '意思基本清晰但表达可以更精炼。建议精简冗余表述。',
      '结构可改进：考虑使用列表、层次或对比来增强可读性。',
    ],
  },
  novelty: {
    low: [
      '该步骤完全是已有内容的重复，没有提供新的洞见。建议深入分析或提出创新视角。',
      '缺乏原创性思考，仅是对前序步骤的重述。请尝试从新的角度审视问题。',
    ],
    medium: [
      '有一定新意但深度不够。建议进一步扩展或深入该视角。',
      '提供了新视角但与其他步骤的关联性不强。可加强与传统观点的对比。',
    ],
  },
};

// ─── ProcessRewardModel 主类 ────────────────────────────────────────────

class ProcessRewardModel {
  /**
   * 构造过程奖励模型
   * @param {Object} options - 配置选项
   * @param {number} options.weakThreshold - 弱步骤阈值 (默认 0.5)
   * @param {number} options.chainPenaltyWeight - 最低步骤惩罚权重 (默认 0.15)
   * @param {boolean} options.enableTypeDetection - 是否启用步骤类型自动检测 (默认 true)
   * @param {number} options.minEvidenceLength - 最小证据长度 (默认 10)
   */
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      weakThreshold: options.weakThreshold ?? 0.5,
      chainPenaltyWeight: options.chainPenaltyWeight ?? 0.15,
      enableTypeDetection: options.enableTypeDetection ?? true,
      minEvidenceLength: options.minEvidenceLength ?? 10,
    };

    // 评分维度定义 / Scoring dimension definitions
    this.dimensions = {
      logical:       { label: '逻辑一致性', labelEn: 'Logical Consistency',      weight: 0.30 },
      evidence:      { label: '证据质量',   labelEn: 'Evidence Quality',         weight: 0.25 },
      completeness:  { label: '完整性',     labelEn: 'Completeness',             weight: 0.20 },
      clarity:       { label: '清晰度',     labelEn: 'Clarity',                  weight: 0.15 },
      novelty:       { label: '新颖性',     labelEn: 'Novelty',                  weight: 0.10 },
    };

    // 统计数据 / Statistics
    this.stats = {
      totalEvaluated: 0,
      totalChains: 0,
      averageScore: 0,
      weakStepCount: 0,
      dimensionAverages: {
        logical: 0, evidence: 0, completeness: 0, clarity: 0, novelty: 0,
      },
    };

    // 评分历史 (用于计算移动平均)
    this._scoreHistory = [];
    this._maxHistoryLength = 100;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  核心方法 — Core Methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 评估单个推理步骤 (0-1)
   * @param {Object} step - 推理步骤
   * @param {string} step.content - 步骤内容文本
   * @param {string} [step.type] - 步骤类型 (premise/inference/evidence/conclusion/counterargument)
   * @param {string} [step.id] - 步骤唯一标识
   * @param {Object} context - 推理上下文
   * @param {string} context.question - 原始问题
   * @param {string[]} [context.previousSteps] - 前序步骤内容
   * @param {Object[]} [context.evidencePool] - 可用证据池
   * @param {Object[]} allSteps - 完整推理链中的所有步骤
   * @returns {Object} 评分结果 { score, breakdown, type, weak, suggestions }
   */
  evaluateStep(step, context, allSteps = []) {
    if (!step || !step.content || typeof step.content !== 'string') {
      return { score: 0, error: 'step.content is required', step };
    }

    const stepType = this._detectStepType(step, context);
    const typeWeights = STEP_TYPES[stepType]?.baseWeight || STEP_TYPES.inference.baseWeight;

    // 获取前序步骤内容
    const prevContents = (context.previousSteps || []).map(s =>
      typeof s === 'string' ? s : (s.content || s.text || '')
    );

    // 获取证据池
    const evidencePool = (context.evidencePool || []).map(e =>
      typeof e === 'string' ? e : (e.content || e.text || '')
    );

    // ─── 五维度评分 ────────────────────────────────────────────────
    const breakdown = {
      logical:      this._scoreLogical(step.content, prevContents, stepType),
      evidence:     this._scoreEvidence(step.content, evidencePool, stepType),
      completeness: this._scoreCompleteness(step.content, context.question, stepType, allSteps),
      clarity:      this._scoreClarity(step.content, stepType),
      novelty:      this._scoreNovelty(step.content, prevContents, stepType),
    };

    // 加权计算总分
    let score = 0;
    for (const [dim, dimScore] of Object.entries(breakdown)) {
      score += dimScore * typeWeights[dim];
    }

    score = Math.round(Math.max(0, Math.min(1, score)) * 1000) / 1000;

    // 更新统计
    this.stats.totalEvaluated++;
    this._updateStats(score, breakdown);

    // 生成改进建议（仅对弱维度）
    const weakDims = Object.entries(breakdown)
      .filter(([_, s]) => s < this.config.weakThreshold)
      .map(([d, _]) => d);

    const suggestions = weakDims.length > 0
      ? weakDims.map(dim => this.suggestImprovements({ content: step.content, type: stepType, dimension: dim }))
      : [];

    return {
      score,
      breakdown,
      type: stepType,
      typeLabel: STEP_TYPES[stepType]?.label || stepType,
      weak: score < this.config.weakThreshold,
      weakDimensions: weakDims,
      suggestions,
      meta: {
        version: this.version,
        timestamp: Date.now(),
        evaluationCount: this.stats.totalEvaluated,
      },
    };
  }

  /**
   * 评估完整推理链
   * @param {Object[]} steps - 推理步骤数组
   * @param {Object[]} steps[].content - 步骤内容
   * @param {string} [steps[].type] - 步骤类型
   * @param {string} [steps[].id] - 步骤ID
   * @returns {Object} 链级评估结果
   */
  evaluateChain(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return { score: 0, error: 'steps array is required and non-empty', steps: [] };
    }

    const stepResults = [];
    const context = { question: '', previousSteps: [] };
    let prevContents = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      context.previousSteps = [...prevContents];

      const result = this.evaluateStep(step, context, steps);
      result.index = i;
      result.stepId = step.id || `step-${i}`;
      stepResults.push(result);

      prevContents.push(typeof step.content === 'string' ? step.content : '');
    }

    // 链级综合评分
    const individualScores = stepResults.map(r => r.score);
    const weightedAverage = individualScores.reduce((a, b) => a + b, 0) / individualScores.length;

    // 最低步骤惩罚: 任何步骤低于阈值则拉低总分
    const minScore = Math.min(...individualScores);
    const penalty = minScore < this.config.weakThreshold
      ? this.config.chainPenaltyWeight * (1 - minScore)
      : 0;

    const chainScore = Math.round(Math.max(0, Math.min(1, weightedAverage - penalty)) * 1000) / 1000;

    // 维度聚合
    const dimensionAgg = {};
    for (const dim of Object.keys(this.dimensions)) {
      const values = stepResults.map(r => r.breakdown[dim]);
      dimensionAgg[dim] = {
        average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000,
        min: Math.round(Math.min(...values) * 1000) / 1000,
        max: Math.round(Math.max(...values) * 1000) / 1000,
        label: this.dimensions[dim].label,
        labelEn: this.dimensions[dim].labelEn,
      };
    }

    // 统计
    this.stats.totalChains++;

    return {
      chainScore,
      weightedAverage: Math.round(weightedAverage * 1000) / 1000,
      penalty,
      minStepScore: Math.round(minScore * 1000) / 1000,
      stepCount: steps.length,
      weakStepCount: stepResults.filter(r => r.weak).length,
      steps: stepResults,
      dimensions: dimensionAgg,
      verdict: this._verdict(chainScore, stepResults),
      meta: {
        version: this.version,
        timestamp: Date.now(),
        chainIndex: this.stats.totalChains,
      },
    };
  }

  /**
   * 识别弱步骤 (score < 0.5)
   * @param {Object[]} steps - 推理步骤数组
   * @returns {Object[]} 弱步骤列表 { index, stepId, score, weakDimensions, topSuggestion }
   */
  findWeakSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return [];
    }

    const chainResult = this.evaluateChain(steps);

    return chainResult.steps
      .filter(s => s.weak)
      .map(s => ({
        index: s.index,
        stepId: s.stepId,
        score: s.score,
        type: s.type,
        typeLabel: s.typeLabel,
        weakDimensions: s.weakDimensions,
        topSuggestion: s.suggestions[0] || '无具体建议',
        content: steps[s.index]?.content?.substring(0, 100) || '',
      }))
      .sort((a, b) => a.score - b.score); // 最弱的排在前面
  }

  /**
   * 为弱步骤生成改进建议
   * @param {Object} step - 推理步骤
   * @param {string} step.content - 步骤内容
   * @param {string} [step.type] - 步骤类型
   * @param {string} [step.dimension] - 目标维度 (可选，默认分析所有低分维度)
   * @returns {string[]} 改进建议列表
   */
  suggestImprovements(step) {
    const content = step?.content || '';
    const stepType = step?.type || this._detectStepType({ content }, {});
    const targetDim = step?.dimension;

    const scores = {
      logical:     this._scoreLogical(content, [], stepType),
      evidence:    this._scoreEvidence(content, [], stepType),
      completeness: this._scoreCompleteness(content, '', stepType, []),
      clarity:     this._scoreClarity(content, stepType),
      novelty:     this._scoreNovelty(content, [], stepType),
    };

    // 确定需要改进的维度
    let dimsToImprove;
    if (targetDim && scores[targetDim] !== undefined) {
      dimsToImprove = [targetDim];
    } else {
      dimsToImprove = Object.entries(scores)
        .filter(([_, s]) => s < this.config.weakThreshold)
        .sort((a, b) => a[1] - b[1])
        .map(([d, _]) => d);
    }

    if (dimsToImprove.length === 0) {
      return ['该步骤整体质量良好，无需特定改进。'];
    }

    const suggestions = [];
    for (const dim of dimsToImprove) {
      const score = scores[dim];
      const templates = IMPROVEMENT_TEMPLATES[dim];
      if (!templates) continue;

      // 根据得分选择严重程度
      const tier = score < 0.3 ? 'low' : 'medium';
      const pool = templates[tier] || templates.low || [];
      if (pool.length > 0) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        suggestions.push(`[${this.dimensions[dim].label}] ${pick}`);
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('该步骤存在改进空间，建议重新审视推理逻辑和表述方式。');
    }

    return suggestions;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  内部评分方法 — Internal Scoring Methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 逻辑一致性评分 (30%)
   * 评估: 当前步骤是否从前序步骤逻辑推导而来
   */
  _scoreLogical(content, prevContents, stepType) {
    if (prevContents.length === 0) {
      // 第一步: 检查是否有清晰的起始性
      return this._hasLogicalMarkers(content) ? 0.8 : 0.5;
    }

    const prevText = prevContents.join(' ');
    const score = this._computeLogicalFlow(prevText, content);
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 证据质量评分 (25%)
   * 评估: 是否有支持性证据、数据或引用
   */
  _scoreEvidence(content, evidencePool, stepType) {
    let score = 0;

    // 数字引用 (数据点)
    const numberPattern = /\d+\.?\d*\s*[%％年次月日]|\d+\.?\d*\s*(?:percent|million|billion|kg|km|ms|GB|MB)/i;
    const hasNumbers = numberPattern.test(content);
    if (hasNumbers) score += 0.3;

    // 引用标记
    const citationPatterns = [
      /\[[\d,\s]+\]/,           // [1], [1,2,3]
      /\([\w\s]+,\s*\d{4}\)/,  // (Smith, 2023)
      /according to/i,
      /研究表明/i,
      /research shows/i,
      /evidence suggests/i,
    ];
    const hasCitations = citationPatterns.some(p => p.test(content));
    if (hasCitations) score += 0.3;

    // 具体例子/案例
    const examplePatterns = [/例如/i, /比如/i, /for example/i, /e.g\.|i\.e\./, /具体/i, /案例/i];
    const hasExamples = examplePatterns.some(p => p.test(content));
    if (hasExamples) score += 0.2;

    // 证据池匹配
    if (evidencePool.length > 0) {
      const matched = evidencePool.some(e => content.toLowerCase().includes(e.toLowerCase().slice(0, 20)));
      if (matched) score += 0.2;
    }

    // 证据类步骤的额外检查
    if (stepType === 'evidence') {
      if (!hasNumbers && !hasCitations) score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 完整性评分 (20%)
   * 评估: 是否覆盖问题的所有关键方面
   */
  _scoreCompleteness(content, question, stepType, allSteps) {
    let score = 0.5; // 基础分

    // 问题关键词覆盖
    if (question && question.trim()) {
      const questionWords = this._extractKeywords(question);
      const contentLower = content.toLowerCase();
      const coveredCount = questionWords.filter(w => contentLower.includes(w)).length;
      if (questionWords.length > 0) {
        score += Math.min(0.3, (coveredCount / questionWords.length) * 0.3);
      }
    }

    // 条件/边界说明
    if (/\b(如果|前提|条件|假设|边界|限制|前提条件下|unless|if|provided)\b/i.test(content)) {
      score += 0.1;
    }

    // 反面/例外讨论
    if (/\b(然而|但是|例外|另一方面|however|but|except|although)\b/i.test(content)) {
      score += 0.1;
    }

    // 链末步骤的完整性检查
    if (stepType === 'conclusion' && allSteps.length > 1) {
      // 结论是否涵盖了前面的推理
      const prevTopics = allSteps.slice(0, -1).map(s =>
        this._extractKeywords(typeof s.content === 'string' ? s.content : '')
      ).flat();

      const uniquePrevTopics = [...new Set(prevTopics)].slice(0, 10);
      const covered = uniquePrevTopics.filter(t =>
        content.toLowerCase().includes(t.toLowerCase())
      ).length;

      if (uniquePrevTopics.length > 0) {
        score += Math.min(0.15, (covered / uniquePrevTopics.length) * 0.15);
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 清晰度评分 (15%)
   * 评估: 表述是否清晰、结构是否合理
   */
  _scoreClarity(content, stepType) {
    let score = 0.5;

    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return 0.2;

    // 句长合理性 (太短=缺乏展开, 太长=结构混乱)
    const avgLength = content.length / Math.max(1, sentences.length);
    if (avgLength > 5 && avgLength < 80) score += 0.15;

    // 结构标记词
    const connectors = [
      /首先|第一| firstly|first/i,
      /其次|第二| secondly|second/i,
      /最后|最终| finally|ultimately/i,
      /因此|所以| therefore|thus|hence/i,
      /因为|由于| because|since|due to/i,
    ];
    const connectorCount = connectors.filter(p => p.test(content)).length;
    score += Math.min(0.2, connectorCount * 0.07);

    // 专业术语一致性 (大写缩略词是否定义)
    const acronyms = content.match(/\b[A-Z]{2,}\b/g) || [];
    const definedAcronyms = content.match(/\b[A-Z]{2,}\s*\([^)]+\)/g) || [];
    if (acronyms.length > definedAcronyms.length) {
      score -= 0.1; // 有未定义的缩略词
    }

    // 避免模糊表达
    const vaguePatterns = [
      /\b(大概|可能|也许|maybe|probably|somewhat|kind of|sort of|我觉得)\b/i,
    ];
    const vagueCount = vaguePatterns.reduce((c, p) => c + (p.test(content) ? 1 : 0), 0);
    score -= Math.min(0.15, vagueCount * 0.05);

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 新颖性评分 (10%)
   * 评估: 是否提供新的洞见而非简单重复
   */
  _scoreNovelty(content, prevContents, stepType) {
    if (prevContents.length === 0) {
      // 第一步: 基础分
      return stepType === 'premise' ? 0.6 : 0.7;
    }

    const prevText = prevContents.join(' ').toLowerCase();
    const contentLower = content.toLowerCase();

    // 简单 n-gram 重复检测
    const prevWords = prevText.split(/\s+/).filter(w => w.length > 2);
    const contentWords = contentLower.split(/\s+/).filter(w => w.length > 2);

    if (contentWords.length === 0) return 0.3;

    const overlapCount = contentWords.filter(w => prevWords.includes(w)).length;
    const overlapRatio = overlapCount / contentWords.length;

    // 反论天然具有新颖性
    let novelty = 1 - overlapRatio;
    if (stepType === 'counterargument') novelty += 0.15;

    // 创新标记词
    const innovationMarkers = [
      /新的|创新|novel|new approach| innovative/i,
      /首次|first|首次提出/i,
      /不同于|不同于|unlike|different from/i,
      /重新定义|reframe|redefine/i,
    ];
    const hasInnovation = innovationMarkers.some(p => p.test(content));
    if (hasInnovation) novelty += 0.1;

    return Math.max(0, Math.min(1, novelty));
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  辅助方法 — Helper Methods
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 自动检测步骤类型
   * @private
   */
  _detectStepType(step, context) {
    const content = (typeof step.content === 'string' ? step.content : '').toLowerCase();
    if (!content) return 'inference';

    // 显式类型优先
    if (step.type && STEP_TYPES[step.type]) {
      return step.type;
    }

    // 基于关键词匹配
    let bestType = 'inference';
    let bestScore = 0;

    for (const [type, config] of Object.entries(STEP_TYPES)) {
      const matchCount = config.keyIndicators.filter(ind =>
        content.includes(ind.toLowerCase())
      ).length;
      if (matchCount > bestScore) {
        bestScore = matchCount;
        bestType = type;
      }
    }

    // 基于位置推断
    if (context && Array.isArray(context.previousSteps) && context.previousSteps.length === 0) {
      if (bestScore === 0) bestType = 'premise';
    }

    return bestType;
  }

  /**
   * 计算逻辑流程连贯度
   * @private
   */
  _computeLogicalFlow(prevText, currentText) {
    const prevLower = prevText.toLowerCase();
    const currLower = currentText.toLowerCase();

    // 提取关键词 (简单实现)
    const prevKeywords = this._extractKeywords(prevLower);
    const currKeywords = this._extractKeywords(currLower);

    if (prevKeywords.length === 0 || currKeywords.length === 0) return 0.5;

    // 关键词重叠度 (适度重叠表示连贯, 完全重叠=重复, 零重叠=断裂)
    const overlap = prevKeywords.filter(k => currKeywords.includes(k)).length;
    const overlapRatio = overlap / currKeywords.length;

    // 连贯性: 中等重叠度最佳
    if (overlapRatio > 0.05 && overlapRatio < 0.5) return 0.7 + (1 - overlapRatio) * 0.3;
    if (overlapRatio >= 0.5) return 0.6;  // 重复
    return 0.3 + overlapRatio * 4;         // 断裂但有关键词链接
  }

  /**
   * 提取文本关键词 (简单词频法)
   * @private
   */
  _extractKeywords(text) {
    if (!text) return [];
    const stopWords = new Set([
      '的', '是', '在', '了', '和', '与', '或', '等', '这', '那', '有', '为', '以',
      'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall',
      'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off',
      'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when',
      'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very',
    ]);

    return text
      .split(/[\s,.\-;:!?，。！？；：、\n]+/)
      .filter(w => w.length > 1 && !stopWords.has(w.toLowerCase()));
  }

  /**
   * 检测逻辑标记词
   * @private
   */
  _hasLogicalMarkers(text) {
    const markers = [
      /假设|假设条件|前提是|首先/i,
      /因为|由于|鉴于|because|given|since/i,
      /已知|已知条件|we know/i,
    ];
    return markers.some(p => p.test(text));
  }

  /**
   * 评分评语 / Score verdict
   * @private
   */
  _verdict(chainScore, stepResults) {
    if (chainScore >= 0.8) return 'excellent';
    if (chainScore >= 0.65) return 'good';
    if (chainScore >= 0.5) return 'acceptable';
    if (chainScore >= 0.35) return 'weak';
    return 'invalid';
  }

  /**
   * 更新统计数据
   * @private
   */
  _updateStats(score, breakdown) {
    // 移动平均
    this._scoreHistory.push(score);
    if (this._scoreHistory.length > this._maxHistoryLength) {
      this._scoreHistory.shift();
    }
    this.stats.averageScore = Math.round(
      (this._scoreHistory.reduce((a, b) => a + b, 0) / this._scoreHistory.length) * 1000
    ) / 1000;

    // 维度平均值
    for (const dim of Object.keys(breakdown)) {
      this.stats.dimensionAverages[dim] = Math.round(
        (this.stats.dimensionAverages[dim] * (this.stats.totalEvaluated - 1) + breakdown[dim])
        / this.stats.totalEvaluated * 1000
      ) / 1000;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  公开 API — Public API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 获取模型统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      version: this.version,
      ...this.stats,
      config: this.config,
      stepTypes: Object.keys(STEP_TYPES),
      dimensions: Object.fromEntries(
        Object.entries(this.dimensions).map(([k, v]) => [k, { label: v.label, weight: v.weight }])
      ),
    };
  }

  /**
   * 重置统计信息
   */
  reset() {
    this.stats = {
      totalEvaluated: 0,
      totalChains: 0,
      averageScore: 0,
      weakStepCount: 0,
      dimensionAverages: { logical: 0, evidence: 0, completeness: 0, clarity: 0, novelty: 0 },
    };
    this._scoreHistory = [];
  }

  /**
   * 获取步骤类型定义
   * @returns {Object} 步骤类型定义
   */
  getStepTypes() {
    const result = {};
    for (const [key, val] of Object.entries(STEP_TYPES)) {
      result[key] = { label: val.label, description: val.description };
    }
    return result;
  }
}

module.exports = { ProcessRewardModel, VERSION };
