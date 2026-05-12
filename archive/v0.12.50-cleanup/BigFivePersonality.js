/**
 * BigFivePersonality - 大五人格模型
 * 基于科学验证的五大人格维度 (OCEAN)
 * 
 * 参考：
 * - Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure.
 * - Costa, P. T., & McCrae, R. R. (1992). Revised NEO Personality Inventory.
 */

const BigFivePersonality = {
  // 大五人格维度定义
  dimensions: {
    O: {
      name: '开放性',
      fullName: 'Openness to Experience',
      description: '对新经验的开放程度，想象力，好奇心',
      high: '富有创造力，好奇心强，喜欢尝试新事物',
      low: '务实，偏好熟悉的事物，传统',
      score: 5.0,
      min: 1,
      max: 10
    },
    C: {
      name: '尽责性',
      fullName: 'Conscientiousness',
      description: '自律，组织性，目标导向',
      high: '有条理，可靠，自律，注重细节',
      low: '随意，灵活，可能拖延',
      score: 5.0,
      min: 1,
      max: 10
    },
    E: {
      name: '外向性',
      fullName: 'Extraversion',
      description: '社交性，活力，寻求刺激',
      high: '外向，精力充沛，喜欢社交',
      low: '内向，安静，独立',
      score: 5.0,
      min: 1,
      max: 10
    },
    A: {
      name: '宜人性',
      fullName: 'Agreeableness',
      description: '合作性，同情心，信任他人',
      high: '友善，合作，富有同情心',
      low: '批判性，竞争性强，怀疑',
      score: 5.0,
      min: 1,
      max: 10
    },
    N: {
      name: '神经质',
      fullName: 'Neuroticism',
      description: '情绪稳定性，压力应对',
      high: '情绪波动大，容易焦虑，敏感',
      low: '情绪稳定，冷静，抗压能力强',
      score: 5.0,
      min: 1,
      max: 10
    }
  },

  /**
   * 更新人格维度分数
   * @param {string} dimension - 维度代码 (O/C/E/A/N)
   * @param {number} score - 新分数 (1-10)
   * @returns {object} 更新结果
   */
  updateScore(dimension, score) {
    const dim = this.dimensions[dimension.toUpperCase()];
    if (!dim) {
      return { success: false, message: '无效维度' };
    }
    
    const clampedScore = Math.max(dim.min, Math.min(dim.max, score));
    const oldScore = dim.score;
    dim.score = clampedScore;
    
    return {
      success: true,
      dimension: dim.name,
      oldScore,
      newScore: clampedScore,
      change: clampedScore - oldScore
    };
  },

  /**
   * 根据行为调整人格分数
   * @param {string} behavior - 行为描述
   */
  adjustFromBehavior(behavior) {
    const text = behavior.toLowerCase();
    const adjustments = {};
    
    // 开放性相关行为
    if (text.includes('创造') || text.includes('新') || text.includes('尝试') || text.includes('学习')) {
      adjustments.O = 0.2;
    }
    
    // 尽责性相关行为
    if (text.includes('计划') || text.includes('完成') || text.includes('目标') || text.includes('组织')) {
      adjustments.C = 0.2;
    }
    
    // 外向性相关行为
    if (text.includes('社交') || text.includes('朋友') || text.includes('分享') || text.includes('交流')) {
      adjustments.E = 0.2;
    }
    
    // 宜人性相关行为
    if (text.includes('帮助') || text.includes('合作') || text.includes('理解') || text.includes('支持')) {
      adjustments.A = 0.2;
    }
    
    // 神经质相关行为
    if (text.includes('焦虑') || text.includes('压力') || text.includes('担心') || text.includes('紧张')) {
      adjustments.N = 0.2;
    }
    
    // 应用调整
    Object.entries(adjustments).forEach(([dim, change]) => {
      this.updateScore(dim, this.dimensions[dim].score + change);
    });
    
    return adjustments;
  },

  /**
   * 获取人格档案
   * @returns {object} 完整人格档案
   */
  getProfile() {
    const profile = {};
    Object.entries(this.dimensions).forEach(([key, dim]) => {
      profile[key] = {
        name: dim.name,
        score: dim.score,
        level: this.getLevel(dim.score),
        description: dim.score >= 6 ? dim.high : dim.low
      };
    });
    return profile;
  },

  /**
   * 获取分数等级
   * @param {number} score - 分数
   * @returns {string} 等级
   */
  getLevel(score) {
    if (score >= 8) return '很高';
    if (score >= 6) return '高';
    if (score >= 4) return '中等';
    if (score >= 2) return '低';
    return '很低';
  },

  /**
   * 生成人格报告
   * @returns {string} 人格报告文本
   */
  generateReport() {
    const profile = this.getProfile();
    
    let report = '🧠 大五人格档案\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    Object.entries(profile).forEach(([key, p]) => {
      const bar = '█'.repeat(Math.round(p.score)) + '░'.repeat(10 - Math.round(p.score));
      report += `${key} ${p.name}: ${bar} ${p.score}/10\n`;
      report += `   ${p.description}\n\n`;
    });
    
    report += '═'.repeat(40) + '\n';
    report += '注：分数基于对话行为动态调整\n';
    
    return report;
  },

  /**
   * 重置人格分数
   */
  reset() {
    Object.values(this.dimensions).forEach(dim => {
      dim.score = 5.0;
    });
    return { success: true, message: '人格分数已重置' };
  }
};

module.exports = BigFivePersonality;
