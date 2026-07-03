/**
 * time-extension.js — 时间延伸分析层 v1.0.0
 *
 * 核心问题：心虫只分析"当前选择"的即时逻辑正确性，但缺乏时间维度延伸。
 * 谈雨玟案例暴露了：心虫分析到"赢了复仇"，但没分析"复仇之后她一生怎么过"。
 *
 * 这个模块解决：
 *   任何"怎么做"的建议之前，自动做四个时间维度的延伸分析。
 *
 * 四个分析维度：
 *   1. 短期（做了之后立刻发生什么）—— 即时后果链
 *   2. 中期（做了之后1-5年发生什么）—— 人生转折区间
 *   3. 长期（做了之后10年+，当事人的一生会变成什么样）—— 终局叙事
 *   4. 替代方案（如果不做这个选择，人生会怎样）—— 反事实人生线
 *
 * 输出格式：结构化数据，可直接被 philosophy-to-decision.js 和 decision-router.js 消费。
 *
 * 设计原则：
 * - 不修改任何已有模块
 * - 输出是"延伸分析报告"，不是决策指令本身
 * - 决策路由层（philosophyToDecision / decisionRouter）消费这个报告再做决策
 * - 所有维度即使数据不足也输出框架（空字段+置信度低）
 */

const VERSION = '1.0.0';

// ─── 时间维度配置 ──────────────────────────────────────────────────────────

const TIME_DIMENSIONS = {
  SHORT_TERM: {
    id: 'shortTerm',
    label: '短期',
    range: '立即~6个月',
    weight: 0.25,           // 在综合评分中的权重
  },
  MID_TERM: {
    id: 'midTerm',
    label: '中期',
    range: '1年~5年',
    weight: 0.35,           // 人生转折区间，权重最高
  },
  LONG_TERM: {
    id: 'longTerm',
    label: '长期',
    range: '10年+',
    weight: 0.25,           // 终局影响
  },
  ALTERNATIVE: {
    id: 'alternative',
    label: '替代方案',
    range: '反事实人生线',
    weight: 0.15,           // 反事实权重稍低
  },
};

// ─── 领域知识库 ────────────────────────────────────────────────────────────
// 各领域的时间延伸特征模板，用于指导分析方向
// 非硬编码结论，只是"这个领域通常要考虑什么"

const DOMAIN_TEMPLATES = {
  revenge: {
    label: '复仇/报复',
    shortTerm: ['即时满足感', '法律风险', '关系断裂', '社会评价变化'],
    midTerm: ['复仇后的空虚循环', '人生方向迷失', '持续的人际损耗', '可能的法律后果'],
    longTerm: ['终局: 以仇人为锚的一生', '错过其他人生可能性', '人格定型化'],
    alternative: ['宽恕带来的自由', '把能量投向自我建设', '长期: 超越而非对抗'],
  },
  relationship: {
    label: '人际关系',
    shortTerm: ['情绪波动', '关系状态变化', '社交圈影响'],
    midTerm: ['信任重建/断裂', '人生伴侣选择', '家庭结构变化'],
    longTerm: ['终局: 长期关系质量', '对下一代的影响', '晚年社交支持网络'],
    alternative: ['独处 vs 妥协', '不同关系模式的人生差异'],
  },
  career: {
    label: '职业/事业',
    shortTerm: ['收入变化', '工作节奏改变', '技能要求变化'],
    midTerm: ['职业天花板', '行业赛道选择', '能力积累方向'],
    longTerm: ['终局: 职业生涯顶点形态', '退休生活质量', '人生意义感来源'],
    alternative: ['不同赛道的人生对比', '稳定 vs 冒险的终局差异'],
  },
  finance: {
    label: '财务/投资',
    shortTerm: ['现金流影响', '短期风险敞口'],
    midTerm: ['复利效应/债务螺旋', '财务自由度变化', '抗风险能力'],
    longTerm: ['终局: 财务安全 vs 财务自由', '对下一代的影响', '晚年选择权'],
    alternative: ['不同资产配置的人生差异', '消费 vs 投资的终局对比'],
  },
  health: {
    label: '健康/身体',
    shortTerm: ['身体感受变化', '医疗干预即时影响'],
    midTerm: ['疾病进程逆转/恶化', '生活质量变化', '医疗负担'],
    longTerm: ['终局: 健康寿命', '晚年自理能力', '对家人的影响'],
    alternative: ['不干预的自然病程', '不同治疗路径的终局对比'],
  },
  study: {
    label: '学习/教育',
    shortTerm: ['时间投入', '短期成绩/技能提升'],
    midTerm: ['知识体系构建', '竞争壁垒形成', '机会窗口'],
    longTerm: ['终局: 认知层次差异', '人生选择权扩展', '自我实现路径'],
    alternative: ['不深造的人生路径', '不同学习方向终局差异'],
  },
  general: {
    label: '通用',
    shortTerm: ['即时后果', '近期影响', '初始反馈'],
    midTerm: ['积累效应', '路径依赖', '机会成本'],
    longTerm: ['终局形态', '人生叙事', '意义感来源'],
    alternative: ['不做此选择的人生线', '其他选项的终局对比'],
  },
};

// ─── 时间延伸分析结果类 ────────────────────────────────────────────────────

class TimeExtensionReport {
  /**
   * @param {string} subject - 分析对象（决策/建议/选择的描述）
   * @param {object} dimensions - 四个维度的分析结果
   * @param {number} overallScore - 综合评分（-1 ~ 1，负=建议不做，正=建议做）
   * @param {number} confidence - 综合置信度 (0-1)
   * @param {string} summary - 一句话总结
   */
  constructor(subject, dimensions, overallScore, confidence, summary) {
    this.subject = subject;
    this.version = VERSION;
    this.timestamp = Date.now();
    this.dimensions = dimensions;        // { shortTerm, midTerm, longTerm, alternative }
    this.overallScore = overallScore;     // -1 ~ 1
    this.confidence = confidence;         // 0-1
    this.summary = summary;              // 一句话总结
    this.riskFlags = [];                 // 高风险信号
    this.opportunityFlags = [];          // 高机会信号
  }

  addRiskFlag(flag) { this.riskFlags.push(flag); }
  addOpportunityFlag(flag) { this.opportunityFlags.push(flag); }

  toJSON() {
    return {
      subject: this.subject,
      version: this.version,
      timestamp: this.timestamp,
      dimensions: this.dimensions,
      overallScore: this.overallScore,
      confidence: this.confidence,
      summary: this.summary,
      riskFlags: this.riskFlags,
      opportunityFlags: this.opportunityFlags,
    };
  }

  /**
   * 转换为 philosophy-to-decision 可消费的格式
   */
  toDecisionRationale() {
    return {
      module: 'timeExtension',
      version: VERSION,
      overallScore: this.overallScore,
      confidence: this.confidence,
      summary: this.summary,
      risks: this.riskFlags,
      opportunities: this.opportunityFlags,
      // 各维度关键信号
      signals: {
        urgentNegative: this.riskFlags.filter(f => f.dimension === 'shortTerm' && f.type === 'negative'),
        trendAccelerating: this.riskFlags.filter(f => f.trend === 'accelerating'),
        terminalRisk: this.riskFlags.filter(f => f.dimension === 'longTerm' && f.type === 'negative'),
        alternativeUpside: this.opportunityFlags.filter(f => f.dimension === 'alternative'),
      },
    };
  }

  /**
   * 转换为 decision-router 可消费的格式
   */
  toRouterInput() {
    return {
      source: 'timeExtension',
      type: 'timeExtensionAnalysis',
      score: this.overallScore,
      confidence: this.confidence,
      dimensions: {
        shortTerm: this.dimensions.shortTerm.score,
        midTerm: this.dimensions.midTerm.score,
        longTerm: this.dimensions.longTerm.score,
        alternative: this.dimensions.alternative.score,
      },
      metadata: {
        summary: this.summary,
        riskCount: this.riskFlags.length,
        opportunityCount: this.opportunityFlags.length,
      },
    };
  }
}

// ─── 时间维度分析类 ────────────────────────────────────────────────────────

class TimeDimensionAnalysis {
  /**
   * @param {string} id - 维度标识
   * @param {string} label - 显示名称
   * @param {string} range - 时间范围描述
   */
  constructor(id, label, range) {
    this.id = id;
    this.label = label;
    this.range = range;
    this.score = 0;              // -1 ~ 1，负=负面预期，正=正面预期
    this.confidence = 0;         // 0-1
    this.narrative = '';         // 叙事描述
    this.keyPoints = [];         // 关键影响点 [{type, description, severity}]
    this.uncertainty = 0;        // 不确定性程度 (0-1)
  }

  setScore(score, confidence) {
    this.score = Math.max(-1, Math.min(1, score));
    this.confidence = Math.max(0, Math.min(1, confidence));
  }

  addPoint(type, description, severity = 0.5) {
    this.keyPoints.push({ type, description, severity });
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      range: this.range,
      score: this.score,
      confidence: this.confidence,
      narrative: this.narrative,
      keyPoints: this.keyPoints,
      uncertainty: this.uncertainty,
    };
  }
}

// ─── 时间延伸分析引擎 ──────────────────────────────────────────────────────

class TimeExtensionEngine {
  /**
   * @param {object} heartFlow - HeartFlow 主实例引用
   */
  constructor(heartFlow) {
    this.name = 'TimeExtensionEngine';
    this.version = VERSION;
    this.hf = heartFlow;

    // 分析历史
    this._history = [];
    this._maxHistory = 100;

    // 统计
    this._stats = {
      totalAnalyses: 0,
      bySubject: {},
    };
  }

  /**
   * 核心方法：对给定的决策/建议/选择做时间延伸分析
   *
   * @param {string} subject - 待分析的决策/建议描述
   * @param {object} [options] - 可选的上下文
   * @param {string} [options.domain] - 领域（revenge/relationship/career/finance/health/study/general）
   * @param {object} [options.personContext] - 当事人背景（年龄、状态、价值观等）
   * @param {object} [options.psychologyResult] - 心理学分析结果（如有）
   * @param {object} [options.philosophyResult] - 哲学分析结果（如有）
   * @returns {TimeExtensionReport}
   */
  analyze(subject, options = {}) {
    if (!subject || typeof subject !== 'string') {
      return this._emptyReport(subject || '(empty)', '需要有效的分析对象');
    }

    const domain = this._detectDomain(subject, options.domain);
    const template = DOMAIN_TEMPLATES[domain] || DOMAIN_TEMPLATES.general;
    const personContext = options.personContext || {};

    // ─── 四个维度分析 ─────────────────────────────────────────────

    const shortTerm = this._analyzeShortTerm(subject, template, personContext);
    const midTerm = this._analyzeMidTerm(subject, template, personContext, shortTerm);
    const longTerm = this._analyzeLongTerm(subject, template, personContext, shortTerm, midTerm);
    const alternative = this._analyzeAlternative(subject, template, personContext, shortTerm, midTerm, longTerm);

    // ─── 综合评分 ─────────────────────────────────────────────────

    const overallScore = this._computeOverallScore({ shortTerm, midTerm, longTerm, alternative });
    const confidence = this._computeOverallConfidence({ shortTerm, midTerm, longTerm, alternative });
    const summary = this._generateSummary(subject, overallScore, confidence, shortTerm, longTerm, alternative);

    // ─── 构建报告 ─────────────────────────────────────────────────

    const report = new TimeExtensionReport(
      subject,
      { shortTerm: shortTerm.toJSON(), midTerm: midTerm.toJSON(), longTerm: longTerm.toJSON(), alternative: alternative.toJSON() },
      overallScore,
      confidence,
      summary,
    );

    // ─── 提取风险与机会信号 ───────────────────────────────────────

    this._extractSignals(report, { shortTerm, midTerm, longTerm, alternative });

    // ─── 记录 ─────────────────────────────────────────────────────

    this._recordAnalysis(subject, report);

    return report;
  }

  /**
   * 快速分析——只输出综合评分和一句话结论
   */
  quickAnalyze(subject, options = {}) {
    const report = this.analyze(subject, options);
    return {
      subject: report.subject,
      overallScore: report.overallScore,
      confidence: report.confidence,
      summary: report.summary,
      riskCount: report.riskFlags.length,
      opportunityCount: report.opportunityFlags.length,
      terminalRisks: report.riskFlags.filter(f => f.dimension === 'longTerm').length,
    };
  }

  // ─── 四维度分析器 ───────────────────────────────────────────────

  /**
   * 短期分析：做了之后立刻发生什么
   */
  _analyzeShortTerm(subject, template, personContext) {
    const analysis = new TimeDimensionAnalysis('shortTerm', '短期', '立即~6个月');

    // 基于模板生成关键点
    const points = template.shortTerm || DOMAIN_TEMPLATES.general.shortTerm;
    let negativeCount = 0;
    let positiveCount = 0;

    for (const point of points) {
      // 基于关键词判断正负面倾向
      const isNegative = this._isNegativeKeyword(point);
      const isPositive = this._isPositiveKeyword(point);
      const severity = isNegative ? 0.6 : isPositive ? 0.5 : 0.4;

      analysis.addPoint(
        isNegative ? 'negative' : isPositive ? 'positive' : 'neutral',
        point,
        severity,
      );

      if (isNegative) negativeCount++;
      if (isPositive) positiveCount++;
    }

    // 短期：通常不确定性较低，但波动大
    const netScore = (positiveCount - negativeCount) / Math.max(points.length, 1);
    analysis.setScore(netScore * 0.8, 0.6); // 短期置信度中等（即时影响可观察但后果不确定）
    analysis.uncertainty = 0.3;

    analysis.narrative = this._buildNarrative('短期', template.shortTerm, netScore);

    return analysis;
  }

  /**
   * 中期分析：做了之后1-5年发生什么
   */
  _analyzeMidTerm(subject, template, personContext, shortTerm) {
    const analysis = new TimeDimensionAnalysis('midTerm', '中期', '1年~5年');

    const points = template.midTerm || DOMAIN_TEMPLATES.general.midTerm;
    let negativeCount = 0;
    let positiveCount = 0;

    for (const point of points) {
      const isNegative = this._isNegativeKeyword(point);
      const isPositive = this._isPositiveKeyword(point);
      const severity = isNegative ? 0.7 : isPositive ? 0.6 : 0.4;

      analysis.addPoint(
        isNegative ? 'negative' : isPositive ? 'positive' : 'neutral',
        point,
        severity,
      );

      if (isNegative) negativeCount++;
      if (isPositive) positiveCount++;
    }

    // 中期：路径依赖开始显现，不确定性升高
    const netScore = (positiveCount - negativeCount) / Math.max(points.length, 1);

    // 中期受短期结果影响（正反馈/负反馈循环）
    const shortTermInfluence = shortTerm.score * 0.2; // 短期的20%影响中期判断
    analysis.setScore(
      Math.max(-1, Math.min(1, netScore * 0.7 + shortTermInfluence)),
      0.45, // 中期置信度较低（变量增多）
    );
    analysis.uncertainty = 0.5;

    analysis.narrative = this._buildNarrative('中期', template.midTerm, netScore);

    return analysis;
  }

  /**
   * 长期分析：做了之后10年+，当事人一生会变成什么样
   */
  _analyzeLongTerm(subject, template, personContext, shortTerm, midTerm) {
    const analysis = new TimeDimensionAnalysis('longTerm', '长期', '10年+');

    const points = template.longTerm || DOMAIN_TEMPLATES.general.longTerm;
    let negativeCount = 0;
    let positiveCount = 0;

    for (const point of points) {
      const isNegative = this._isNegativeKeyword(point);
      const isPositive = this._isPositiveKeyword(point);
      const severity = isNegative ? 0.85 : isPositive ? 0.75 : 0.5; // 长期影响权重最高

      analysis.addPoint(
        isNegative ? 'negative' : isPositive ? 'positive' : 'neutral',
        point,
        severity,
      );

      if (isNegative) negativeCount++;
      if (isPositive) positiveCount++;
    }

    // 长期：复合效应放大，但不确定性极高
    const netScore = (positiveCount - negativeCount) / Math.max(points.length, 1);

    // 长期受中期路径的复合影响
    const midTermInfluence = midTerm.score * 0.3;
    const shortTermInfluence = shortTerm.score * 0.1;
    analysis.setScore(
      Math.max(-1, Math.min(1, netScore * 0.5 + midTermInfluence + shortTermInfluence)),
      0.3, // 长期置信度最低
    );
    analysis.uncertainty = 0.7;

    analysis.narrative = this._buildNarrative('长期', template.longTerm, netScore);

    return analysis;
  }

  /**
   * 替代方案分析：如果不做这个选择，人生会怎样
   */
  _analyzeAlternative(subject, template, personContext, shortTerm, midTerm, longTerm) {
    const analysis = new TimeDimensionAnalysis('alternative', '替代方案', '反事实人生线');

    const points = template.alternative || DOMAIN_TEMPLATES.general.alternative;
    let negativeCount = 0;
    let positiveCount = 0;

    for (const point of points) {
      const isNegative = this._isNegativeKeyword(point);
      const isPositive = this._isPositiveKeyword(point);
      const severity = isPositive ? 0.7 : 0.5;

      analysis.addPoint(
        isNegative ? 'negative' : isPositive ? 'positive' : 'neutral',
        point,
        severity,
      );

      if (isNegative) negativeCount++;
      if (isPositive) positiveCount++;
    }

    // 替代方案评分：正=替代方案更好（建议不做），负=当前方案更好（建议做）
    // 通常替代方案有"确定性损失"和"可能性收益"的权衡
    const netScore = (positiveCount - negativeCount) / Math.max(points.length, 1);

    // 替代方案与当前方案的对比：如果长期评分低，替代方案相对价值升高
    const currentValue = (shortTerm.score + midTerm.score + longTerm.score) / 3;
    const alternativeRelativeScore = netScore - currentValue * 0.3;

    analysis.setScore(
      Math.max(-1, Math.min(1, alternativeRelativeScore)),
      0.35, // 反事实置信度低
    );
    analysis.uncertainty = 0.65;

    analysis.narrative = this._buildNarrative('替代方案', template.alternative, netScore);

    return analysis;
  }

  // ─── 综合计算 ───────────────────────────────────────────────────

  /**
   * 计算综合评分（加权平均）
   */
  _computeOverallScore(dimensions) {
    const weights = {
      shortTerm: TIME_DIMENSIONS.SHORT_TERM.weight,
      midTerm: TIME_DIMENSIONS.MID_TERM.weight,
      longTerm: TIME_DIMENSIONS.LONG_TERM.weight,
      alternative: TIME_DIMENSIONS.ALTERNATIVE.weight,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const [key, dim] of Object.entries(dimensions)) {
      const w = weights[key] || 0;
      weightedSum += dim.score * w;
      totalWeight += w;
    }

    // 替代方案评分反向：替代方案评分高 = 当前方案不好
    // 所以在综合评分中，替代方案评分的负值被加入（替代方案越好，当前方案评分越低）
    const alternativeDim = dimensions.alternative;
    weightedSum -= alternativeDim.score * weights.alternative;

    return Math.max(-1, Math.min(1, weightedSum / totalWeight));
  }

  /**
   * 计算综合置信度
   */
  _computeOverallConfidence(dimensions) {
    const confidences = Object.values(dimensions).map(d => d.confidence);
    if (confidences.length === 0) return 0;

    // 使用加权平均（较远的时间维度置信度更低，自然降低整体置信度）
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    // 再打一个"长期不确定性折扣"
    const longTermUncertainty = dimensions.longTerm?.uncertainty || 0.5;
    return avgConfidence * (1 - longTermUncertainty * 0.3);
  }

  // ─── 信号提取 ───────────────────────────────────────────────────

  _extractSignals(report, dimensions) {
    // 风险信号
    for (const [dimKey, dim] of Object.entries(dimensions)) {
      if (dim.score < -0.3) {
        const negativePoints = dim.keyPoints.filter(p => p.type === 'negative');
        for (const point of negativePoints.slice(0, 2)) {
          report.addRiskFlag({
            dimension: dimKey,
            type: 'negative',
            severity: Math.abs(dim.score),
            description: point.description,
            trend: dimKey === 'shortTerm' ? 'immediate' :
                   dimKey === 'midTerm' ? 'accelerating' : 'terminal',
          });
        }
      }
    }

    // 机会信号
    for (const [dimKey, dim] of Object.entries(dimensions)) {
      if (dim.score > 0.3) {
        const positivePoints = dim.keyPoints.filter(p => p.type === 'positive');
        for (const point of positivePoints.slice(0, 2)) {
          report.addOpportunityFlag({
            dimension: dimKey,
            type: 'positive',
            strength: dim.score,
            description: point.description,
          });
        }
      }
    }

    // 特殊信号：短期正面但长期负面（陷阱信号）
    if (dimensions.shortTerm.score > 0.3 && dimensions.longTerm.score < -0.3) {
      report.addRiskFlag({
        dimension: 'cross',
        type: 'trap',
        severity: Math.abs(dimensions.longTerm.score),
        description: '短期愉悦但长期有害——这是一个陷阱选择',
        trend: 'deceptive',
      });
    }

    // 特殊信号：短期痛苦但长期正面（成长信号）
    if (dimensions.shortTerm.score < -0.3 && dimensions.longTerm.score > 0.3) {
      report.addOpportunityFlag({
        dimension: 'cross',
        type: 'growth',
        strength: dimensions.longTerm.score,
        description: '短期痛苦但长期有益——这是一个成长选择',
        trend: 'transformative',
      });
    }
  }

  // ─── 辅助方法 ───────────────────────────────────────────────────

  /**
   * 检测输入所属领域
   */
  _detectDomain(subject, hint) {
    if (hint && DOMAIN_TEMPLATES[hint]) return hint;

    const lower = subject.toLowerCase();
    if (/复仇|报复|恨|仇|报复|vengeance|revenge|retaliate/i.test(lower)) return 'revenge';
    if (/关系|恋爱|婚姻|分手|结婚|离婚|感情|relationship|marriage|love|breakup/i.test(lower)) return 'relationship';
    if (/工作|职业|辞职|跳槽|创业|career|job|quit|startup|promotion/i.test(lower)) return 'career';
    if (/投资|理财|买房|买股票|财务|finance|invest|stock|money|loan/i.test(lower)) return 'finance';
    if (/健康|生病|治疗|手术|吃药|health|surgery|treatment|disease|pain/i.test(lower)) return 'health';
    if (/学习|考试|上学|考研|读书|study|exam|school|university|degree/i.test(lower)) return 'study';

    return 'general';
  }

  _isNegativeKeyword(text) {
    const negatives = ['空虚', '断裂', '迷失', '损失', '风险', '恶化', '冲突',
      '负担', '伤害', '后果', '定型', '错过', '对抗', '损耗', '限制',
      'void', 'loss', 'risk', 'damage', 'conflict', 'burden', 'harm'];
    return negatives.some(n => text.includes(n));
  }

  _isPositiveKeyword(text) {
    const positives = ['自由', '建设', '成长', '超越', '机会', '扩展', '安全',
      '信任', '质量', '支持', '选择权', '超越', '实现', '积累',
      'freedom', 'growth', 'opportunity', 'trust', 'safety', 'build', 'beyond'];
    return positives.some(p => text.includes(p));
  }

  _buildNarrative(label, points, netScore) {
    if (netScore > 0.3) {
      return `${label}预期偏向正面。${points.slice(0, 2).join('，')}`;
    } else if (netScore < -0.3) {
      return `${label}预期偏向负面。${points.slice(0, 2).join('，')}`;
    }
    return `${label}影响中性，取决于具体执行方式。`;
  }

  _generateSummary(subject, overallScore, confidence, shortTerm, longTerm, alternative) {
    const scoreDesc = overallScore > 0.3 ? '建议考虑执行' :
                      overallScore < -0.3 ? '建议谨慎或避免' : '需要更多信息';

    // 检测陷阱/成长信号
    let specialNote = '';
    if (shortTerm.score > 0.3 && longTerm.score < -0.3) {
      specialNote = ' ⚠️ 这是一个陷阱选择：短期愉悦但长期有害。';
    } else if (shortTerm.score < -0.3 && longTerm.score > 0.3) {
      specialNote = ' 🌱 这是一个成长选择：短期痛苦但长期有益。';
    }

    // 替代方案对比
    let altNote = '';
    if (alternative.score > 0.3) {
      altNote = ` 替代方案可能有更好的长期结果。`;
    } else if (alternative.score < -0.3) {
      altNote = ` 当前选择在长期上优于替代方案。`;
    }

    return `对"${subject.substring(0, 60)}"的时间延伸分析：${scoreDesc}（评分: ${overallScore.toFixed(2)}, 置信度: ${(confidence * 100).toFixed(0)}%）${specialNote}${altNote}`;
  }

  _emptyReport(subject, reason) {
    return new TimeExtensionReport(
      subject,
      {
        shortTerm: new TimeDimensionAnalysis('shortTerm', '短期', '立即~6个月').toJSON(),
        midTerm: new TimeDimensionAnalysis('midTerm', '中期', '1年~5年').toJSON(),
        longTerm: new TimeDimensionAnalysis('longTerm', '长期', '10年+').toJSON(),
        alternative: new TimeDimensionAnalysis('alternative', '替代方案', '反事实人生线').toJSON(),
      },
      0,
      0,
      `时间延伸分析未能完成：${reason}`,
    );
  }

  // ─── 记录与统计 ─────────────────────────────────────────────────

  _recordAnalysis(subject, report) {
    this._history.push({
      subject: subject.substring(0, 100),
      timestamp: report.timestamp,
      overallScore: report.overallScore,
      confidence: report.confidence,
      summary: report.summary,
    });

    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }

    this._stats.totalAnalyses++;
    const domain = this._detectDomain(subject);
    this._stats.bySubject[domain] = (this._stats.bySubject[domain] || 0) + 1;
  }

  getStats() {
    return {
      ...this._stats,
      version: VERSION,
      historyLength: this._history.length,
    };
  }

  getRecentAnalyses(limit = 5) {
    return this._history.slice(-limit);
  }

  /**
   * 销毁/清理
   */
  destroy() {
    this._history = [];
    this._stats = { totalAnalyses: 0, bySubject: {} };
  }
}

// ─── 导出 ──────────────────────────────────────────────────────────────────

module.exports = {
  TimeExtensionEngine,
  TimeExtensionReport,
  TimeDimensionAnalysis,
  TIME_DIMENSIONS,
  DOMAIN_TEMPLATES,
  VERSION,
};
