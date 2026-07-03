/**
 * Metacognitive Executive Controller v1.0.0
 * 
 * 来源论文: "Executive function and metacognition: Towards a unifying framework 
 *           of cognitive self-regulation"
 *           Roebers, C.M., 2017 | Citations: 463
 * 
 * 核心思想:
 * 执行功能(EF)和元认知(Metacognition)共同构成认知自我调节的统一框架:
 * 
 * 1. 执行功能组件 (Executive Function Components):
 *    - Inhibition (抑制): 压制不相关反应的冲动
 *    - Working Memory (工作记忆): 在意识中保持和操作信息
 *    - Cognitive Flexibility (认知灵活性): 多角度思考和切换策略
 * 
 * 2. 元认知组件 (Metacognition Components):
 *    - Knowledge of Cognition (认知知识): 对自己认知过程的了解
 *    - Regulation of Cognition (认知调节): 计划、监控、评估认知过程
 * 
 * 3. 整合框架:
 *    EF为执行层面，Metacognition为监控层面
 *    两者相互依存：EF实施认知行为，Metacognition监控和调节EF
 * 
 * 整合到 HeartFlow:
 * - 增强自我调节反馈系统 (self-regulation-feedback.js)
 * - 为认知评估 (cognitive-appraisal.js) 添加执行功能检测
 * - 为决策验证 (decision-verifier.js) 添加元认知监控
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 执行功能检测器
 * 检测三个核心EF能力: 抑制、工作记忆、认知灵活性
 */
class ExecutiveFunctionDetector {
  constructor() {
    // EF基线能力 (0-1)
    this.capabilities = {
      inhibition: 0.7,      // 抑制控制能力
      workingMemory: 0.7,    // 工作记忆容量
      cognitiveFlexibility: 0.7  // 认知灵活性
    };
    
    // EF指标权重
    this.weights = {
      inhibition: 0.35,
      workingMemory: 0.35,
      cognitiveFlexibility: 0.30
    };
  }

  /**
   * 检测执行功能表现
   * @param {object} context - 包含决策/思考上下文的分析
   * @returns {object} EF评估结果
   */
  detect(context = {}) {
    const { text = '', decision = null, options = [] } = context;
    const lower = text.toLowerCase();
    
    // 1. 抑制控制检测 - 检测冲动性和延迟满足能力
    const inhibitionScore = this._assessInhibition(lower, context);
    
    // 2. 工作记忆检测 - 检测信息保持和多步推理能力
    const workingMemoryScore = this._assessWorkingMemory(lower, context, decision);
    
    // 3. 认知灵活性检测 - 检测多角度思考和策略切换
    const flexibilityScore = this._assessCognitiveFlexibility(lower, context, options);
    
    // 综合EF分数
    const totalEF = 
      inhibitionScore * this.weights.inhibition +
      workingMemoryScore * this.weights.workingMemory +
      flexibilityScore * this.weights.cognitiveFlexibility;
    
    return {
      inhibition: { score: inhibitionScore, level: this._scoreToLevel(inhibitionScore) },
      workingMemory: { score: workingMemoryScore, level: this._scoreToLevel(workingMemoryScore) },
      cognitiveFlexibility: { score: flexibilityScore, level: this._scoreToLevel(flexibilityScore) },
      totalEF: { score: totalEF, level: this._scoreToLevel(totalEF) },
      recommendations: this._generateEFRecommendations(inhibitionScore, workingMemoryScore, flexibilityScore)
    };
  }

  _assessInhibition(lower, context) {
    let score = 0.7; // 基线
    
    // 冲动性指标 (降低分数)
    const impulsivityKeywords = ['立刻', '马上', '立即', '不管了', '先做了再说', '冲动', 
                                  'instantly', 'right now', 'do it now', 'impulsive'];
    for (const kw of impulsivityKeywords) {
      if (lower.includes(kw)) { score -= 0.15; break; }
    }
    
    // 延迟满足指标 (提高分数)
    const delayKeywords = ['先等等', '考虑一下', '再想想', '等一下', '观察一下',
                            'wait', 'consider', 'think about', 'delay', 'patience'];
    for (const kw of delayKeywords) {
      if (lower.includes(kw)) { score += 0.15; break; }
    }
    
    // 风险评估完整性
    if (context.riskAssessment && context.riskAssessment.length >= 3) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  _assessWorkingMemory(lower, context, decision) {
    let score = 0.7;
    
    // 多步推理指标
    const multiStepKeywords = ['首先', '其次', '然后', '最后', '第一', '第二', '第三',
                                'first', 'second', 'third', 'then', 'finally', 'moreover'];
    let stepCount = 0;
    for (const kw of multiStepKeywords) {
      if (lower.includes(kw)) stepCount++;
    }
    if (stepCount >= 3) score += 0.15;
    else if (stepCount >= 1) score += 0.08;
    
    // 决策复杂度
    if (context.options && context.options.length > 3) {
      score += 0.1; // 复杂决策需要更多工作记忆
    }
    
    // 条件推理指标
    if (lower.includes('如果') || lower.includes('要是') || 
        lower.includes('if') || lower.includes('assuming')) {
      score += 0.05;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  _assessCognitiveFlexibility(lower, context, options) {
    let score = 0.7;
    
    // 多角度思考指标
    const perspectiveKeywords = ['另一方面', '但是', '不过', '然而', '反过来说',
                                  'however', 'on the other hand', 'but', 'alternatively'];
    for (const kw of perspectiveKeywords) {
      if (lower.includes(kw)) { score += 0.12; break; }
    }
    
    // 选项数量 (多个有效选项表明灵活性)
    if (options && options.length >= 3) {
      score += 0.1;
    }
    
    // 备选方案考虑
    if (lower.includes('或者') || lower.includes('也可以') || lower.includes('alternative')) {
      score += 0.08;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  _scoreToLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  _generateEFRecommendations(inhibition, workingMemory, flexibility) {
    const recs = [];
    
    if (inhibition < 0.5) {
      recs.push('建议增加决策前的等待时间，抑制冲动反应');
    }
    if (workingMemory < 0.5) {
      recs.push('建议将复杂问题分解为更小的步骤');
    }
    if (flexibility < 0.5) {
      recs.push('建议从多个角度思考问题，考虑反向观点');
    }
    
    if (recs.length === 0) {
      recs.push('执行功能表现良好，继续保持');
    }
    
    return recs;
  }
}

/**
 * 元认知监控器
 * 监控和评估自己的认知过程
 */
class MetacognitiveMonitor {
  constructor() {
    // 元认知能力基线
    this.capabilities = {
      knowledgeOfCognition: 0.6,  // 对自己认知过程的了解
      regulationOfCognition: 0.6    // 认知调节能力
    };
    
    // 监控历史
    this.monitoringHistory = [];
    this.maxHistorySize = 100;
  }

  /**
   * 监控认知过程
   * @param {object} context - 当前认知上下文
   * @returns {object} 元认知评估结果
   */
  monitor(context = {}) {
    const { text = '', appraisal = null, decision = null, outcome = null } = context;
    
    // 1. 评估认知知识 - 对自己思维过程的了解
    const knowledgeScore = this._assessKnowledgeOfCognition(text, context);
    
    // 2. 评估认知调节 - 计划、监控、评估能力
    const regulationScore = this._assessRegulationOfCognition(text, context);
    
    // 3. 元认知准确性 - 预测与实际结果的一致性
    let accuracy = 0.7;
    if (outcome) {
      accuracy = this._calculateAccuracy(context);
    }
    
    const result = {
      knowledgeOfCognition: { score: knowledgeScore, level: this._scoreToLevel(knowledgeScore) },
      regulationOfCognition: { score: regulationScore, level: this._scoreToLevel(regulationScore) },
      metacognitiveAccuracy: { score: accuracy, level: this._scoreToLevel(accuracy) },
      overall: {
        score: (knowledgeScore + regulationScore + accuracy) / 3,
        level: this._scoreToLevel((knowledgeScore + regulationScore + accuracy) / 3)
      },
      insights: this._generateInsights(knowledgeScore, regulationScore),
      recommendations: this._generateRecommendations(knowledgeScore, regulationScore)
    };
    
    // 记录监控历史
    this._recordMonitoring(context, result);
    
    return result;
  }

  _assessKnowledgeOfCognition(lower, context) {
    let score = 0.6;
    
    // 自我反思指标
    const reflectionKeywords = ['我意识到', '我发现', '我觉得', '我的想法是',
                                'I realize', 'I notice', 'I think', 'my thought'];
    for (const kw of reflectionKeywords) {
      if (lower.includes(kw)) { score += 0.15; break; }
    }
    
    // 策略意识
    if (context.strategy || lower.includes('策略')) {
      score += 0.1;
    }
    
    // 元认知提问
    if (lower.includes('为什么') || lower.includes('怎么') || 
        lower.includes('why') || lower.includes('how')) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  _assessRegulationOfCognition(lower, context) {
    let score = 0.6;
    
    // 计划指标
    const planningKeywords = ['计划', '准备', '首先', '接下来',
                               'plan', 'prepare', 'schedule'];
    let hasPlanning = false;
    for (const kw of planningKeywords) {
      if (lower.includes(kw)) { hasPlanning = true; break; }
    }
    if (hasPlanning) score += 0.15;
    
    // 监控指标
    if (lower.includes('检查') || lower.includes('确认') || 
        lower.includes('check') || lower.includes('verify')) {
      score += 0.1;
    }
    
    // 评估指标
    if (lower.includes('评估') || lower.includes('判断') || 
        lower.includes('evaluate') || lower.includes('assess')) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  _calculateAccuracy(context) {
    // 如果有预测和实际结果，计算准确性
    const predicted = context.predictedOutcome;
    const actual = context.outcome;
    
    if (!predicted || !actual) return 0.7;
    
    // 简化的准确性计算
    if (predicted.success === actual.success) {
      return 0.85;
    }
    return 0.4;
  }

  _scoreToLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  _generateInsights(knowledge, regulation) {
    const insights = [];
    
    if (knowledge > 0.7) {
      insights.push('对自己认知过程有较好的理解');
    }
    if (regulation > 0.7) {
      insights.push('认知调节能力较强');
    }
    if (knowledge < 0.5) {
      insights.push('需要更多反思自己的思维过程');
    }
    
    return insights;
  }

  _generateRecommendations(knowledge, regulation) {
    const recs = [];
    
    if (knowledge < 0.5) {
      recs.push('建议增加元认知提问："我为什么这样想？"');
    }
    if (regulation < 0.5) {
      recs.push('建议在决策前制定明确计划');
    }
    
    if (recs.length === 0) {
      recs.push('元认知能力表现良好');
    }
    
    return recs;
  }

  _recordMonitoring(context, result) {
    this.monitoringHistory.push({
      timestamp: new Date().toISOString(),
      context: context.text ? context.text.substring(0, 100) : '',
      result: result
    });
    
    if (this.monitoringHistory.length > this.maxHistorySize) {
      this.monitoringHistory = this.monitoringHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 获取监控统计
   */
  getStats() {
    if (this.monitoringHistory.length === 0) {
      return { totalMonitoring: 0, averageScore: 0 };
    }
    
    const recent = this.monitoringHistory.slice(-20);
    const avgScore = recent.reduce((sum, e) => sum + e.result.overall.score, 0) / recent.length;
    
    return {
      totalMonitoring: this.monitoringHistory.length,
      averageScore: Math.round(avgScore * 100) / 100,
      recentTrend: this._calculateTrend(recent)
    };
  }

  _calculateTrend(recent) {
    if (recent.length < 4) return 'insufficient_data';
    
    const half = Math.floor(recent.length / 2);
    const first = recent.slice(0, half);
    const second = recent.slice(half);
    
    const firstAvg = first.reduce((s, e) => s + e.result.overall.score, 0) / first.length;
    const secondAvg = second.reduce((s, e) => s + e.result.overall.score, 0) / second.length;
    
    if (secondAvg - firstAvg > 0.1) return 'improving';
    if (firstAvg - secondAvg > 0.1) return 'declining';
    return 'stable';
  }
}

/**
 * 整合的元认知执行控制器
 * 统一执行功能和元认知监控
 */
class MetacognitiveExecutiveController {
  constructor(options = {}) {
    this.efDetector = new ExecutiveFunctionDetector();
    this.mcMonitor = new MetacognitiveMonitor();
    this.memoryPath = options.memoryPath || null;
    
    // 能力基线
    this.baselineEF = 0.7;
    this.baselineMC = 0.6;
    
    if (this.memoryPath) {
      this._load();
    }
  }

  /**
   * 全面评估认知自我调节能力
   * @param {object} context - 认知上下文
   * @returns {object} 综合评估结果
   */
  assess(context = {}) {
    const efResult = this.efDetector.detect(context);
    const mcResult = this.mcMonitor.monitor(context);
    
    // 综合分数
    const totalScore = 
      efResult.totalEF.score * 0.5 + 
      mcResult.overall.score * 0.5;
    
    return {
      executiveFunction: efResult,
      metacognition: mcResult,
      integrated: {
        totalScore: totalScore,
        level: this._scoreToLevel(totalScore),
        efMCBalance: this._calculateBalance(efResult, mcResult),
        recommendations: this._combineRecommendations(efResult, mcResult)
      },
      timestamp: new Date().toISOString()
    };
  }

  _scoreToLevel(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  _calculateBalance(efResult, mcResult) {
    const efScore = efResult.totalEF.score;
    const mcScore = mcResult.overall.score;
    const diff = Math.abs(efScore - mcScore);
    
    if (diff < 0.15) return 'balanced';
    if (efScore > mcScore) return 'ef_dominant';
    return 'mc_dominant';
  }

  _combineRecommendations(efResult, mcResult) {
    const recs = [];
    recs.push(...efResult.recommendations);
    recs.push(...mcResult.recommendations);
    return [...new Set(recs)]; // 去重
  }

  /**
   * 基于执行功能和元认知的决策建议
   */
  suggestForDecision(context = {}) {
    const assessment = this.assess(context);
    
    const suggestions = {
      shouldProceed: true,
      caution: false,
      warnings: [],
      enhancement: []
    };
    
    if (assessment.executiveFunction.totalEF.score < 0.5) {
      suggestions.shouldProceed = false;
      suggestions.warnings.push('执行功能较弱，建议延迟决策');
    }
    
    if (assessment.metacognition.overall.score < 0.5) {
      suggestions.caution = true;
      suggestions.warnings.push('元认知监控不足，需要更多反思');
    }
    
    if (assessment.integrated.efMCBalance === 'ef_dominant') {
      suggestions.enhancement.push('建议加强元认知监控，减少冲动决策');
    } else if (assessment.integrated.efMCBalance === 'mc_dominant') {
      suggestions.enhancement.push('建议加强执行功能，将思考转化为行动');
    }
    
    return suggestions;
  }

  _load() {
    try {
      if (fs.existsSync(this.memoryPath)) {
        const data = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8'));
        if (data.monitoringHistory) {
          this.mcMonitor.monitoringHistory = data.monitoringHistory;
        }
      }
    } catch (e) {
      // 忽略加载错误
    }
  }

  _save() {
    if (!this.memoryPath) return;
    try {
      const data = {
        monitoringHistory: this.mcMonitor.monitoringHistory
      };
      fs.writeFileSync(this.memoryPath, JSON.stringify(data, null, 2));
    } catch (e) {
      // 忽略保存错误
    }
  }
}

module.exports = {
  ExecutiveFunctionDetector,
  MetacognitiveMonitor,
  MetacognitiveExecutiveController,
  // 版本信息
  VERSION: '1.0.0',
  PAPER: {
    title: 'Executive function and metacognition: Towards a unifying framework of cognitive self-regulation',
    author: 'Roebers, C.M.',
    year: 2017,
    citations: 463
  }
};
