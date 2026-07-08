/**
 * 直觉引擎（独立模块）
 * 
 * 功能：
 * 1. 根据情境快速判断（基于规则）
 * 2. 支持多种直觉类型（social, danger, opportunity）
 * 3. 可配置（规则权重、随机性）
 * 
 * 用法：
 * const IntuitionEngine = require('./intuition-engine.js');
 * const engine = new IntuitionEngine();
 * const result = engine.quickJudge('朋友突然沉默', 'social');
 */

class IntuitionEngine {
  constructor(options = {}) {
    this.rules = {
      social: [
        { pattern: '突然沉默',judgment: '他可能心情不好，需要空间。', confidence: 0.7 },
        { pattern: '主动帮忙',judgment: '他是真心想帮你。', confidence: 0.8 },
        { pattern: '避免眼神',judgment: '他可能隐瞒了什么。', confidence: 0.6 },
      ],
      danger: [
        { pattern: '深夜陌生来电',judgment: '小心诈骗。', confidence: 0.9 },
        { pattern: '邮件要求密码',judgment: '这是钓鱼邮件。', confidence: 0.95 },
      ],
      opportunity: [
        { pattern: '新技能受欢迎',judgment: '这是个学习的好机会。', confidence: 0.75 },
        { pattern: '行业趋势变化',judgment: '提前布局可能有利。', confidence: 0.7 },
      ],
    };
    this.randomness = options.randomness || 0.1;  // 10% 随机性
  }

  /**
   * 快速判断
   * @param {string} situation - 情境描述
   * @param {string} type - 直觉类型（social, danger, opportunity）
   * @returns {object} - {judgment, confidence, reason}
   */
  quickJudge(situation, type = 'social') {
    // 1. 匹配规则
    const rules = this.rules[type] || [];
    let bestMatch = null;
    let bestScore = -1;

    rules.forEach(rule => {
      if (situation.includes(rule.pattern)) {
        const score = rule.confidence + (Math.random() - 0.5) * this.randomness;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = rule;
        }
      }
    });

    // 2. 如果没有匹配，返回默认判断
    if (!bestMatch) {
      return {
        judgment: '情境不明确，建议观察更多线索。',
        confidence: 0.3,
        reason: '没有匹配的规则',
      };
    }

    // 3. 返回判断
    return {
      judgment: bestMatch.judgment,
      confidence: bestScore,
      reason: `匹配规则：${bestMatch.pattern}`,
    };
  }

  /**
   * 添加自定义规则
   */
  addRule(type, pattern, judgment, confidence = 0.5) {
    if (!this.rules[type]) {
      this.rules[type] = [];
    }
    this.rules[type].push({ pattern, judgment, confidence });
  }

  /**
   * 获取所有支持的类型
   */
  getTypes() {
    return Object.keys(this.rules);
  }
}

module.exports = { IntuitionEngine };
