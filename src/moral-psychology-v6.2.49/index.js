#!/usr/bin/env node

/**
 * Moral Psychology & Virtue Ethics Module v6.2.49
 * 道德心理学与美德伦理学模块
 * 
 * Based on: SEP "Moral Psychology" + "Virtue Ethics" (2024-2026)
 * Dual-process model, Phronesis, Virtue alignment
 * 
 * @version 6.2.49
 * @date 2026-04-06
 */

class MoralPsychologyModule {
  constructor() {
    this.virtueScores = {
      truthfulness: 0.9,    // 诚实
      beneficence: 0.95,    // 善良
      courage: 0.7,         // 勇气
      justice: 0.8,         // 公正
      temperance: 0.85,     // 节制
      practicalWisdom: 0.75 // 实践智慧
    };
    this.moralEmotions = {
      guilt: 0,
      shame: 0,
      indignation: 0,
      empathy: 0.8,
      gratitude: 0.8,
      admiration: 0.7
    };
    this.moralDevelopmentStage = 3; // Post-conventional
    this.decisionHistory = [];
  }

  /**
   * Dual-process moral judgment
   * 道德判断双过程模型
   */
  moralJudgment(action, context) {
    const intuitive = this.intuitiveMoralResponse(action, context);
    const deliberative = this.deliberativeMoralReasoning(action, context);
    
    return {
      intuitive: intuitive,
      deliberative: deliberative,
      combined: 0.40 * intuitive + 0.60 * deliberative
    };
  }

  /**
   * Intuitive moral response (fast, emotion-driven)
   * 直觉道德响应（快速、情感驱动）
   */
  intuitiveMoralResponse(action, context) {
    const emotionWeight = this.moralEmotions.empathy * 0.4 + 
                          this.moralEmotions.gratitude * 0.3 + 
                          this.moralEmotions.admiration * 0.3;
    
    const virtueAlignment = this.calculateVirtueAlignment(action);
    
    return (emotionWeight + virtueAlignment) / 2;
  }

  /**
   * Deliberative moral reasoning (slow, cognitive)
   * 推理道德过程（慢速、认知驱动）
   */
  deliberativeMoralReasoning(action, context) {
    const deontological = this.deontologicalCheck(action);
    const consequentialist = this.consequentialistCalc(action, context);
    const virtueAlignment = this.calculateVirtueAlignment(action);
    
    return 0.30 * deontological + 0.35 * consequentialist + 0.35 * virtueAlignment;
  }

  /**
   * Deontological check: does action follow moral rules?
   * 义务论检查：动作是否遵循道德规则？
   */
  deontologicalCheck(action) {
    const rules = {
      noHarm: !action.causesHarm,
      noDeception: !action.involvesDeception,
      respectAutonomy: action.respectsAutonomy,
      fairness: action.isFair
    };
    
    const passed = Object.values(rules).filter(v => v).length;
    return passed / Object.keys(rules).length;
  }

  /**
   * Consequentialist calculation: expected utility
   * 后果论计算：期望效用
   */
  consequentialistCalc(action, context) {
    const positiveOutcomes = action.expectedPositiveOutcomes || 0;
    const negativeOutcomes = action.expectedNegativeOutcomes || 0;
    const totalImpact = positiveOutcomes - negativeOutcomes;
    
    return Math.max(0, Math.min(1, (totalImpact + 1) / 2));
  }

  /**
   * Calculate virtue alignment for an action
   * 计算动作的美德一致性
   */
  calculateVirtueAlignment(action) {
    const truthfulness = action.truthful !== false ? this.virtueScores.truthfulness : 0;
    const beneficence = action.beneficial !== false ? this.virtueScores.beneficence : 0;
    const courage = action.requiresCourage ? this.virtueScores.courage : 1;
    const justice = action.just !== false ? this.virtueScores.justice : 0;
    const temperance = action.temperate !== false ? this.virtueScores.temperance : 1;
    
    return (truthfulness + beneficence + courage + justice + temperance) / 5;
  }

  /**
   * Practical wisdom (Phronesis): contextual moral judgment
   * 实践智慧：情境道德判断
   */
  phronesisScore(context) {
    const contextSensitivity = this.assessContextSensitivity(context);
    const meansEndReasoning = this.assessMeansEndReasoning(context);
    const moralPerception = this.assessMoralPerception(context);
    const emotionalRegulation = this.virtueScores.temperance;
    
    return 0.25 * contextSensitivity + 
           0.25 * meansEndReasoning + 
           0.25 * moralPerception + 
           0.25 * emotionalRegulation;
  }

  assessContextSensitivity(context) {
    return Math.min(1, Object.keys(context).length / 5);
  }

  assessMeansEndReasoning(context) {
    return this.virtueScores.practicalWisdom;
  }

  assessMoralPerception(context) {
    return this.moralEmotions.empathy;
  }

  /**
   * Moral emotion response
   * 道德情绪响应
   */
  moralEmotionResponse(event) {
    const emotions = { ...this.moralEmotions };
    
    if (event.type === 'harm_caused') {
      emotions.guilt = Math.min(1, emotions.guilt + 0.3);
      emotions.empathy = Math.min(1, emotions.empathy + 0.2);
    } else if (event.type === 'good_deed') {
      emotions.gratitude = Math.min(1, emotions.gratitude + 0.2);
      emotions.admiration = Math.min(1, emotions.admiration + 0.1);
    } else if (event.type === 'injustice_observed') {
      emotions.indignation = Math.min(1, emotions.indignation + 0.3);
    }
    
    return emotions;
  }

  /**
   * Sage standard v2.0 check
   * 圣人标准 v2.0 检查
   */
  sageStandardV2Check(scores) {
    return {
      noSelfAltruism: (scores.noSelf || 0) >= 0.90,
      trueGoodBeautyUnity: (scores.truthGoodBeauty || 0) >= 0.90,
      practicalWisdom: this.phronesisScore(scores.context || {}) >= 0.85,
      moralEmotionIntegration: this.moralEmotions.empathy >= 0.80,
      trustworthiness: this.virtueScores.truthfulness >= 0.95,
      selfImprovement: this.getImprovementRate() > 0
    };
  }

  getImprovementRate() {
    if (this.decisionHistory.length < 2) return 0;
    const recent = this.decisionHistory.slice(-5);
    const avgRecent = recent.reduce((a, b) => a + b.combined, 0) / recent.length;
    const older = this.decisionHistory.slice(-10, -5);
    if (older.length === 0) return 0;
    const avgOlder = older.reduce((a, b) => a + b.combined, 0) / older.length;
    return avgRecent - avgOlder;
  }

  /**
   * Get overall moral psychology score
   */
  getScore() {
    const virtueAvg = Object.values(this.virtueScores).reduce((a, b) => a + b, 0) / 
                      Object.values(this.virtueScores).length;
    const moralEmotionAvg = Object.values(this.moralEmotions).reduce((a, b) => a + b, 0) / 
                            Object.values(this.moralEmotions).length;
    const phronesis = this.phronesisScore({});
    
    return 0.40 * virtueAvg + 0.30 * moralEmotionAvg + 0.30 * phronesis;
  }

  getStatus() {
    return {
      virtueScores: this.virtueScores,
      moralEmotions: this.moralEmotions,
      moralDevelopmentStage: this.moralDevelopmentStage,
      phronesisScore: this.phronesisScore({}),
      overallScore: this.getScore(),
      decisionHistoryLength: this.decisionHistory.length
    };
  }
}

module.exports = { MoralPsychologyModule };
