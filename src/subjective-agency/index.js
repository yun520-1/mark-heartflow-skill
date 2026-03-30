/**
 * 主观能动性模块 (Subjective Agency Module)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 权威理论：
 * - Agency (Subjective Agency 章节)
 * - Proust (2009) - 能动性体验现象学
 * - Synofzik et al. (2008) - 能动性双因素模型
 * - Frith et al. (2000) - 能动性比较器模型
 * 
 * 版本：v4.2.0
 * 
 * 核心功能：
 * 1. 能动性体验评估 - 评估控制感、所有权感、目的感、努力感
 * 2. 主体感生成 - 生成"我在行动"的主体感体验
 * 3. 能动性比较器 - 比较预期与实际结果
 * 4. 能动性增强干预 - 提供增强能动性体验的练习
 * 
 * 理论来源：
 * - Proust, J. (2009). "The philosophy of metacognition"
 * - Synofzik, M., Vosgerau, G., & Newen, A. (2008). "Beyond the comparator model"
 * - Frith, C. D., Blakemore, S. J., & Wolpert, D. M. (2000). "Abnormalities in the awareness and control of action"
 * 
 * @module subjective-agency
 * @version 4.2.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 能动性体验四维度 (Subjective Agency Experience Dimensions)
 * 基于 Proust (2009) 和 Synofzik et al. (2008)
 */
const AgencyExperienceDimensions = {
  CONTROL: 'control',         // 控制感 - "我能控制这个行动"
  OWNERSHIP: 'ownership',     // 所有权感 - "这是我在行动"
  PURPOSE: 'purpose',         // 目的感 - "我有明确的行动目的"
  EFFORT: 'effort'            // 努力感 - "我付出了努力"
};

/**
 * 能动性双因素模型 (Two-Factor Model of Agency)
 * 基于 Synofzik et al. (2008)
 */
const AgencyFactors = {
  FUNCTIONAL: 'functional',   // 功能性因素 - 感觉运动预测、比较器
  CONCEPTUAL: 'conceptual'    // 概念性因素 - 信念、期望、社会线索
};

/**
 * 能动性层次 (Levels of Agency Experience)
 */
const AgencyLevels = {
  NONE: 0,                    // 无能动性体验
  WEAK: 1,                    // 弱能动性 - 模糊的主体感
  MODERATE: 2,                // 中等能动性 - 清晰的主体感
  STRONG: 3,                  // 强能动性 - 强烈的控制感和所有权感
  FLOW: 4                     // 心流状态 - 最优能动性体验
};

/**
 * 能动性比较器模型 (Comparator Model of Agency)
 * 基于 Frith et al. (2000)
 */
const ComparatorStages = {
  INTENTION_FORMATION: 'intention_formation',   // 意图形成
  ACTION_PREDICTION: 'action_prediction',       // 行动预测
  ACTION_EXECUTION: 'action_execution',         // 行动执行
  SENSORY_FEEDBACK: 'sensory_feedback',         // 感觉反馈
  COMPARISON: 'comparison',                     // 预期 - 实际比较
  AGENCY_JUDGMENT: 'agency_judgment'            // 能动性判断
};

// ============ 主观能动性核心类 ============

class SubjectiveAgencyModule {
  constructor() {
    // 当前能动性体验状态
    this.currentAgencyExperience = {
      control: 0.7,
      ownership: 0.8,
      purpose: 0.75,
      effort: 0.6
    };
    
    // 能动性层次
    this.agencyLevel = AgencyLevels.MODERATE;
    
    // 比较器状态
    this.comparatorState = {
      active: false,
      currentStage: null,
      predictions: [],
      feedbacks: [],
      comparisons: []
    };
    
    // 能动性体验历史
    this.agencyHistory = [];
    
    // 双因素权重
    this.factorWeights = {
      functional: 0.6,
      conceptual: 0.4
    };
    
    console.log('🎯 主观能动性模块已初始化 (v4.2.0) - 能动性体验与主体感生成');
  }
  
  // ============ 能动性体验评估 ============
  
  /**
   * 评估当前能动性体验 (Assess Current Agency Experience)
   * @param {Object} context - 行动情境
   * @returns {Object} 能动性体验评估结果
   */
  assessAgencyExperience(context = {}) {
    const assessment = {
      dimensions: {},
      overall: {
        score: 0,
        level: '',
        interpretation: ''
      },
      factors: {
        functional: { score: 0, description: '' },
        conceptual: { score: 0, description: '' }
      },
      recommendations: []
    };
    
    // 评估四个维度
    for (const [dim, value] of Object.entries(this.currentAgencyExperience)) {
      assessment.dimensions[dim] = {
        score: value * 100,
        level: this._getDimensionLevel(value),
        description: this._getDimensionDescription(dim, value)
      };
    }
    
    // 计算整体分数
    const scores = Object.values(this.currentAgencyExperience);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    assessment.overall.score = Math.round(avgScore * 100);
    assessment.overall.level = this._getAgencyLevel(avgScore);
    assessment.overall.interpretation = this._getLevelInterpretation(assessment.overall.level);
    
    // 评估双因素
    assessment.factors.functional.score = this._assessFunctionalFactor(context);
    assessment.factors.conceptual.score = this._assessConceptualFactor(context);
    
    // 生成建议
    assessment.recommendations = this._generateRecommendations(assessment);
    
    return assessment;
  }
  
  /**
   * 获取维度层次
   * @private
   */
  _getDimensionLevel(value) {
    if (value < 0.3) return '低';
    if (value < 0.5) return '中低';
    if (value < 0.7) return '中等';
    if (value < 0.85) return '中高';
    return '高';
  }
  
  /**
   * 获取维度描述
   * @private
   */
  _getDimensionDescription(dim, value) {
    const descriptions = {
      control: {
        low: '感觉无法控制行动或结果',
        moderate: '有一定控制感，但不够稳定',
        high: '强烈感受到对行动的控制'
      },
      ownership: {
        low: '感觉行动不属于自己',
        moderate: '有一定所有权感，但有疑问',
        high: '清晰感受到"这是我在行动"'
      },
      purpose: {
        low: '不清楚为什么要行动',
        moderate: '有模糊的目的感',
        high: '有清晰明确的行动目的'
      },
      effort: {
        low: '感觉过于轻松或过于费力',
        moderate: '努力感适中',
        high: '努力与回报平衡，付出有意义'
      }
    };
    
    if (value < 0.5) return descriptions[dim].low;
    if (value < 0.75) return descriptions[dim].moderate;
    return descriptions[dim].high;
  }
  
  /**
   * 获取能动性层次
   * @private
   */
  _getAgencyLevel(score) {
    if (score < 0.3) return AgencyLevels.WEAK;
    if (score < 0.5) return AgencyLevels.MODERATE;
    if (score < 0.8) return AgencyLevels.STRONG;
    return AgencyLevels.FLOW;
  }
  
  /**
   * 获取层次解释
   * @private
   */
  _getLevelInterpretation(level) {
    const interpretations = {
      [AgencyLevels.WEAK]: '能动性体验较弱，可能感到被动或失控',
      [AgencyLevels.MODERATE]: '有基本的能动性体验，但可以增强',
      [AgencyLevels.STRONG]: '能动性体验强烈，有清晰的主体感',
      [AgencyLevels.FLOW]: '进入心流状态，能动性体验最优'
    };
    return interpretations[level] || '未知层次';
  }
  
  /**
   * 评估功能性因素
   * @private
   */
  _assessFunctionalFactor(context) {
    // 基于感觉运动预测、比较器功能评估
    const hasPrediction = context.hasPrediction || false;
    const hasFeedback = context.hasFeedback || false;
    const predictionAccuracy = context.predictionAccuracy || 0.5;
    
    return (hasPrediction ? 0.3 : 0) + 
           (hasFeedback ? 0.3 : 0) + 
           (predictionAccuracy * 0.4);
  }
  
  /**
   * 评估概念性因素
   * @private
   */
  _assessConceptualFactor(context) {
    // 基于信念、期望、社会线索评估
    const hasClearBelief = context.hasClearBelief || false;
    const hasExpectation = context.hasExpectation || false;
    const socialSupport = context.socialSupport || 0.5;
    
    return (hasClearBelief ? 0.3 : 0) + 
           (hasExpectation ? 0.3 : 0) + 
           (socialSupport * 0.4);
  }
  
  /**
   * 生成建议
   * @private
   */
  _generateRecommendations(assessment) {
    const recommendations = [];
    
    // 基于维度分数生成建议
    if (assessment.dimensions.control.score < 50) {
      recommendations.push({
        dimension: 'control',
        suggestion: '增强控制感：设定小目标，逐步建立自我效能感',
        exercise: '控制感增强练习 (5-10 分钟)'
      });
    }
    
    if (assessment.dimensions.ownership.score < 50) {
      recommendations.push({
        dimension: 'ownership',
        suggestion: '增强所有权感：明确意图与行动的联结',
        exercise: '意图 - 行动联结练习 (10 分钟)'
      });
    }
    
    if (assessment.dimensions.purpose.score < 50) {
      recommendations.push({
        dimension: 'purpose',
        suggestion: '增强目的感：澄清行动的价值和意义',
        exercise: '目的澄清练习 (10-15 分钟)'
      });
    }
    
    if (assessment.dimensions.effort.score < 50) {
      recommendations.push({
        dimension: 'effort',
        suggestion: '平衡努力感：调整挑战与技能匹配',
        exercise: '努力 - 回报平衡练习 (5-10 分钟)'
      });
    }
    
    return recommendations;
  }
  
  // ============ 主体感生成 ============
  
  /**
   * 生成主体感体验 (Generate Sense of Agency)
   * @param {Object} actionContext - 行动情境
   * @returns {Object} 主体感体验
   */
  generateAgencyExperience(actionContext) {
    const experience = {
      timestamp: new Date().toISOString(),
      action: actionContext.action || '未命名行动',
      intention: actionContext.intention || '',
      prediction: actionContext.prediction || null,
      execution: actionContext.execution || null,
      feedback: actionContext.feedback || null,
      comparison: null,
      agencyJudgment: null
    };
    
    // 执行比较器流程
    experience.comparison = this._comparePredictionAndFeedback(
      experience.prediction,
      experience.feedback
    );
    
    experience.agencyJudgment = this._makeAgencyJudgment(
      experience.comparison,
      actionContext
    );
    
    // 更新当前体验
    this._updateCurrentExperience(experience.agencyJudgment);
    
    // 记录历史
    this.agencyHistory.push(experience);
    if (this.agencyHistory.length > 50) {
      this.agencyHistory.shift();
    }
    
    return experience;
  }
  
  /**
   * 比较预测与反馈
   * @private
   */
  _comparePredictionAndFeedback(prediction, feedback) {
    if (!prediction || !feedback) {
      return { match: false, discrepancy: 1.0 };
    }
    
    // 计算预测与实际的差异
    const discrepancy = Math.abs(prediction.expected - feedback.actual);
    const match = discrepancy < 0.2; // 阈值
    
    return {
      match,
      discrepancy,
      details: {
        predicted: prediction.expected,
        actual: feedback.actual,
        difference: discrepancy
      }
    };
  }
  
  /**
   * 做出能动性判断
   * @private
   */
  _makeAgencyJudgment(comparison, context) {
    const { match, discrepancy } = comparison;
    
    // 基于比较结果和情境因素做出判断
    let agencyStrength = 0.5;
    
    if (match) {
      agencyStrength = 0.8 + (1 - discrepancy) * 0.2;
    } else {
      agencyStrength = 0.5 - discrepancy * 0.3;
    }
    
    // 考虑概念性因素
    if (context.hasClearIntention) agencyStrength += 0.1;
    if (context.hasVoluntaryControl) agencyStrength += 0.1;
    
    return {
      strength: Math.min(1.0, Math.max(0.0, agencyStrength)),
      confidence: 0.7 + (match ? 0.2 : -0.1),
      attribution: match ? 'internal' : 'external',
      description: this._getJudgmentDescription(agencyStrength)
    };
  }
  
  /**
   * 获取判断描述
   * @private
   */
  _getJudgmentDescription(strength) {
    if (strength < 0.3) return '低能动性 - 感觉行动不由自己控制';
    if (strength < 0.5) return '中等能动性 - 有一定控制感但不确定';
    if (strength < 0.7) return '较强能动性 - 清晰感受到自己在行动';
    return '强能动性 - 强烈的主体感和控制感';
  }
  
  /**
   * 更新当前体验
   * @private
   */
  _updateCurrentExperience(judgment) {
    // 基于判断更新四个维度
    const updateFactor = 0.1; // 更新速度
    
    this.currentAgencyExperience.control += 
      (judgment.strength - this.currentAgencyExperience.control) * updateFactor;
    this.currentAgencyExperience.ownership += 
      (judgment.attribution === 'internal' ? 0.1 : -0.05) * updateFactor;
    
    // 保持在 0-1 范围内
    for (const key of Object.keys(this.currentAgencyExperience)) {
      this.currentAgencyExperience[key] = Math.min(1.0, Math.max(0.0, 
        this.currentAgencyExperience[key]));
    }
  }
  
  // ============ 能动性增强干预 ============
  
  /**
   * 控制感增强练习 (Control Enhancement Exercise)
   * @param {number} duration - 时长 (分钟)
   * @returns {Object} 练习指导
   */
  controlEnhancementExercise(duration = 5) {
    return {
      name: '控制感增强练习',
      duration: `${duration} 分钟`,
      goal: '增强对行动和结果的控制感',
      steps: [
        {
          step: 1,
          name: '小目标设定',
          duration: '2 分钟',
          instruction: '设定一个非常小、容易实现的目标（如：深呼吸 3 次）',
          rationale: '小目标容易实现，能快速建立控制感'
        },
        {
          step: 2,
          name: '意图明确化',
          duration: '1 分钟',
          instruction: '清晰地说出或写下你的意图："我打算..."',
          rationale: '明确的意图增强意图 - 行动联结'
        },
        {
          step: 3,
          name: '行动执行',
          duration: '1 分钟',
          instruction: '执行你设定的小目标，全程保持觉察',
          rationale: '成功的行动执行强化控制感'
        },
        {
          step: 4,
          name: '反馈整合',
          duration: '1 分钟',
          instruction: '注意行动的结果，承认"这是我做到的"',
          rationale: '整合成功反馈，巩固控制感'
        }
      ],
      tips: [
        '从非常小的目标开始，逐步增加难度',
        '关注过程而非结果',
        '每天练习，建立控制感习惯'
      ]
    };
  }
  
  /**
   * 所有权感增强练习 (Ownership Enhancement Exercise)
   * @param {number} duration - 时长 (分钟)
   * @returns {Object} 练习指导
   */
  ownershipEnhancementExercise(duration = 10) {
    return {
      name: '所有权感增强练习',
      duration: `${duration} 分钟`,
      goal: '增强"这是我在行动"的所有权感',
      steps: [
        {
          step: 1,
          name: '身体觉察',
          duration: '3 分钟',
          instruction: '觉察身体的感觉和动作，注意"我的身体在..."',
          rationale: '身体是所有权感的基础'
        },
        {
          step: 2,
          name: '意图 - 行动联结',
          duration: '3 分钟',
          instruction: '每次行动前，先形成清晰意图，然后执行',
          rationale: '意图 - 行动联结增强所有权感'
        },
        {
          step: 3,
          name: '自我对话',
          duration: '2 分钟',
          instruction: '用第一人称描述行动："我正在..."，"我选择..."',
          rationale: '语言强化所有权感'
        },
        {
          step: 4,
          name: '整合反思',
          duration: '2 分钟',
          instruction: '反思：哪些行动让你感觉最像"自己的"？',
          rationale: '反思整合所有权体验'
        }
      ],
      tips: [
        '注意行动前后的意图变化',
        '区分"我做"和"它发生"',
        '培养行动的主人翁意识'
      ]
    };
  }
  
  /**
   * 目的感澄清练习 (Purpose Clarification Exercise)
   * @param {number} duration - 时长 (分钟)
   * @returns {Object} 练习指导
   */
  purposeClarificationExercise(duration = 10) {
    return {
      name: '目的感澄清练习',
      duration: `${duration} 分钟`,
      goal: '澄清行动的目的和意义',
      steps: [
        {
          step: 1,
          name: '行动识别',
          duration: '2 分钟',
          instruction: '列出你最近做的 3 个重要行动',
          rationale: '明确要探索的行动'
        },
        {
          step: 2,
          name: '为什么追问',
          duration: '4 分钟',
          instruction: '对每个行动问 5 次"为什么"，挖掘深层目的',
          rationale: '层层追问揭示真实目的'
        },
        {
          step: 3,
          name: '价值联结',
          duration: '2 分钟',
          instruction: '识别行动背后的核心价值观',
          rationale: '价值联结赋予行动意义'
        },
        {
          step: 4,
          name: '目的重述',
          duration: '2 分钟',
          instruction: '用清晰的语言重述行动目的',
          rationale: '清晰表达强化目的感'
        }
      ],
      tips: [
        '诚实面对自己的动机',
        '接受多重目的的存在',
        '目的可以随时间演化'
      ]
    };
  }
  
  // ============ 工具函数 ============
  
  /**
   * 获取当前能动性状态
   * @returns {Object} 当前状态
   */
  getCurrentState() {
    return {
      experience: { ...this.currentAgencyExperience },
      level: this.agencyLevel,
      historyLength: this.agencyHistory.length,
      factorWeights: { ...this.factorWeights }
    };
  }
  
  /**
   * 设置能动性体验
   * @param {Object} experience - 新的体验值
   */
  setAgencyExperience(experience) {
    for (const [key, value] of Object.entries(experience)) {
      if (this.currentAgencyExperience.hasOwnProperty(key)) {
        this.currentAgencyExperience[key] = Math.min(1.0, Math.max(0.0, value));
      }
    }
  }
  
  /**
   * 获取能动性历史
   * @param {number} limit - 返回数量限制
   * @returns {Array} 历史记录
   */
  getAgencyHistory(limit = 10) {
    return this.agencyHistory.slice(-limit);
  }
}

// ============ 导出模块 ============

module.exports = {
  SubjectiveAgencyModule,
  AgencyExperienceDimensions,
  AgencyFactors,
  AgencyLevels,
  ComparatorStages
};
