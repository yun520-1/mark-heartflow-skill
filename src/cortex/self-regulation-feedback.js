/**
 * Self-Regulation Feedback System v1.0.1
 * 
 * 来源论文: Handbook of Self-Regulation: Research, Theory, and Applications
 *           Carver, C.S. & Scheier, M.F., 2005 | Citations: 3659
 * 
 * 核心思想:
 * 自我调节是一个闭环反馈系统:
 * 1. Self-Monitoring (自我监控) - 观察自身状态
 * 2. Standard-Setting (标准设定) - 确定目标
 * 3. Feedback Comparison (反馈比较) - 比较现状与目标
 * 4. Self-Regulation Efforts (自我调节努力) - 缩小差距的行动
 * 
 * 整合到 HeartFlow 的认知评估系统 (cognitive-appraisal.js):
 * - 在每次评估后跟踪结果
 * - 监控应对策略的有效性
 * - 基于反馈调整未来评估
 * - 闭环: 评估 → 执行 → 结果 → 学习 → 改进评估
 */

const fs = require('fs');
const path = require('path');

class SelfRegulationFeedback {
  constructor(options = {}) {
    this.memoryPath = options.memoryPath || null;
    this.feedbackHistory = [];
    this.maxHistorySize = options.maxHistorySize || 200;
    
    // 反馈评估维度 (来自 Handbook of Self-Regulation)
    this.evaluationDimensions = {
      goalClarity: { weight: 0.20, desc: '目标清晰度' },
      selfMonitoring: { weight: 0.15, desc: '自我监控质量' },
      discrepancyDetection: { weight: 0.20, desc: '差距检测能力' },
      adjustmentSpeed: { weight: 0.15, desc: '调整速度' },
      copingEffectiveness: { weight: 0.30, desc: '应对有效性' }
    };
    
    // 加载历史反馈
    if (this.memoryPath) {
      this._load();
    }
  }

  /**
   * 记录一次评估的结果反馈
   * @param {object} appraisalResult - 来自 cognitive-appraisal.js 的评估结果
   * @param {object} outcome - 执行结果
   * @returns {object} 反馈分析结果
   */
  recordFeedback(appraisalResult, outcome) {
    const evaluation = this._evaluateFeedback(appraisalResult, outcome);
    
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      
      // 输入评估
      appraisal: {
        threatType: appraisalResult.threatType,
        copingStrategy: appraisalResult.copingStrategy || appraisalResult.suggestedCoping,
        confidence: appraisalResult.confidence || 0.5,
        dimensions: appraisalResult.dimensions || {}
      },
      
      // 执行结果
      outcome: {
        success: outcome.success || false,
        effectiveness: outcome.effectiveness || 0.5,
        unexpected: outcome.unexpected || false,
        details: outcome.details || ''
      },
      
      // 反馈评估
      evaluation: evaluation
    };
    
    this.feedbackHistory.push(entry);
    
    // 保持历史大小
    if (this.feedbackHistory.length > this.maxHistorySize) {
      this.feedbackHistory = this.feedbackHistory.slice(-this.maxHistorySize);
    }
    
    // 持久化
    if (this.memoryPath) {
      this._save();
    }
    
    return {
      feedbackId: entry.id,
      evaluation: evaluation,
      adjustedConfidence: this._adjustConfidence(appraisalResult.confidence || 0.5, evaluation),
      recommendations: this._generateRecommendations(appraisalResult, outcome, evaluation)
    };
  }

  /**
   * 评估反馈质量
   */
  _evaluateFeedback(appraisal, outcome) {
    const scores = {};
    const dims = this.evaluationDimensions;
    
    // 目标清晰度 - 威胁类型是否明确
    scores.goalClarity = appraisal.threatType && appraisal.threatType !== 'neutral' ? 0.8 : 0.4;
    
    // 自我监控质量 - 是否有充分的维度评估
    scores.selfMonitoring = Object.keys(appraisal.dimensions || {}).length >= 4 ? 0.8 : 0.5;
    
    // 差距检测能力 - 评估的置信度与实际结果的一致性
    const confDiff = Math.abs((appraisal.confidence || 0.5) - (outcome.success ? 0.8 : 0.3));
    scores.discrepancyDetection = 1 - confDiff;
    
    // 调整速度 - 基于结果修正的速度
    scores.adjustmentSpeed = outcome.unexpected ? 0.6 : 0.9;
    
    // 应对有效性 - 应对策略与结果的一致性
    scores.copingEffectiveness = outcome.effectiveness;
    
    // 加权总分
    let total = 0;
    let weightSum = 0;
    for (const [dim, score] of Object.entries(scores)) {
      const weight = dims[dim]?.weight || 0.2;
      total += score * weight;
      weightSum += weight;
    }
    
    return {
      dimensionScores: scores,
      overallScore: total / weightSum,
      isPositive: outcome.success,
      isExpected: !outcome.unexpected
    };
  }

  /**
   * 基于反馈调整置信度
   */
  _adjustConfidence(originalConfidence, evaluation) {
    const delta = evaluation.overallScore - 0.5;
    const adjustment = delta * 0.2; // 最大调整幅度 20%
    return Math.max(0.1, Math.min(0.9, originalConfidence + adjustment));
  }

  /**
   * 生成改进建议
   */
  _generateRecommendations(appraisal, outcome, evaluation) {
    const recs = [];
    
    if (evaluation.dimensionScores.discrepancyDetection < 0.5) {
      recs.push('下次评估时应更谨慎地给出置信度');
    }
    
    if (evaluation.dimensionScores.goalClarity < 0.5) {
      recs.push('需要更明确地识别威胁类型');
    }
    
    if (outcome.unexpected) {
      recs.push('结果出乎意料，应该分析原因并更新评估标准');
    }
    
    if (evaluation.dimensionScores.copingEffectiveness < 0.5) {
      const strategy = appraisal.copingStrategy;
      const alternatives = {
        'problem_focused': '考虑使用情感-focused策略',
        'emotion_focused': '考虑使用问题-focused策略',
        'meaning_focused': '考虑结合问题-focused和情感-focused策略'
      };
      recs.push(alternatives[strategy] || '考虑更换应对策略');
    }
    
    return recs;
  }

  /**
   * 获取统计摘要
   */
  getStats() {
    if (this.feedbackHistory.length === 0) {
      return { totalEntries: 0, averageScore: 0, recentTrend: 'no data' };
    }
    
    const recent = this.feedbackHistory.slice(-20);
    const avgScore = recent.reduce((sum, e) => sum + e.evaluation.overallScore, 0) / recent.length;
    
    // 计算趋势
    const halfPoint = Math.floor(recent.length / 2);
    const firstHalf = recent.slice(0, halfPoint);
    const secondHalf = recent.slice(halfPoint);
    const firstAvg = firstHalf.reduce((s, e) => s + e.evaluation.overallScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, e) => s + e.evaluation.overallScore, 0) / secondHalf.length;
    
    let trend = 'stable';
    if (secondAvg - firstAvg > 0.1) trend = 'improving';
    if (firstAvg - secondAvg > 0.1) trend = 'declining';
    
    return {
      totalEntries: this.feedbackHistory.length,
      averageScore: Math.round(avgScore * 100) / 100,
      recentTrend: trend,
      lastEntry: this.feedbackHistory[this.feedbackHistory.length - 1]
    };
  }

  /**
   * 获取学习到的模式
   */
  getLearnedPatterns() {
    const patterns = {
      byThreatType: {},
      byCopingStrategy: {},
      byConfidenceRange: {}
    };
    
    for (const entry of this.feedbackHistory) {
      const threat = entry.appraisal.threatType;
      const strategy = entry.appraisal.copingStrategy;
      const confRange = entry.appraisal.confidence >= 0.7 ? 'high' : entry.appraisal.confidence >= 0.4 ? 'medium' : 'low';
      
      // 按威胁类型统计
      if (!patterns.byThreatType[threat]) {
        patterns.byThreatType[threat] = { count: 0, totalScore: 0, successCount: 0 };
      }
      patterns.byThreatType[threat].count++;
      patterns.byThreatType[threat].totalScore += entry.evaluation.overallScore;
      if (entry.outcome.success) patterns.byThreatType[threat].successCount++;
      
      // 按应对策略统计
      if (!patterns.byCopingStrategy[strategy]) {
        patterns.byCopingStrategy[strategy] = { count: 0, totalScore: 0, successCount: 0 };
      }
      patterns.byCopingStrategy[strategy].count++;
      patterns.byCopingStrategy[strategy].totalScore += entry.evaluation.overallScore;
      if (entry.outcome.success) patterns.byCopingStrategy[strategy].successCount++;
      
      // 按置信度范围统计
      if (!patterns.byConfidenceRange[confRange]) {
        patterns.byConfidenceRange[confRange] = { count: 0, totalScore: 0, successCount: 0 };
      }
      patterns.byConfidenceRange[confRange].count++;
      patterns.byConfidenceRange[confRange].totalScore += entry.evaluation.overallScore;
      if (entry.outcome.success) patterns.byConfidenceRange[confRange].successCount++;
    }
    
    // 计算平均分
    for (const cat of Object.values(patterns)) {
      for (const [key, data] of Object.entries(cat)) {
        data.avgScore = data.count > 0 ? Math.round((data.totalScore / data.count) * 100) / 100 : 0;
        data.successRate = data.count > 0 ? Math.round((data.successCount / data.count) * 100) : 0;
      }
    }
    
    return patterns;
  }

  _load() {
    try {
      const file = path.join(this.memoryPath, 'self-regulation-feedback.json');
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        this.feedbackHistory = data.history || [];
      }
    } catch (e) {
    }
  }

  _save() {
    try {
      const file = path.join(this.memoryPath, 'self-regulation-feedback.json');
      fs.writeFileSync(file, JSON.stringify({
        history: this.feedbackHistory,
        savedAt: new Date().toISOString()
      }, null, 2));
    } catch (e) {
    }
  }
}

module.exports = { SelfRegulationFeedback };