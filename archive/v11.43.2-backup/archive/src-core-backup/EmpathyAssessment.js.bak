/**
 * EmpathyAssessment - 共情能力评估
 * 基于人际反应指数 (Interpersonal Reactivity Index, IRI)
 * 
 * 参考：
 * - Davis, M. H. (1983). Measuring individual differences in empathy.
 * - IRI 包含 4 个维度：观点采择、幻想、共情关注、个人痛苦
 */

const EmpathyAssessment = {
  // IRI 四个维度
  dimensions: {
    PT: {
      name: '观点采择',
      fullName: 'Perspective Taking',
      description: '从他人角度看问题的能力',
      questions: [
        '在批评别人前，我会试着想象他们的感受',
        '我会从多个角度看问题',
        '我能理解别人的想法和感受',
        '我会考虑别人的观点',
        '我能站在别人的立场思考'
      ],
      score: 5.0
    },
    FS: {
      name: '幻想',
      fullName: 'Fantasy',
      description: '代入虚构人物经历的能力',
      questions: [
        '我容易被电影或书籍中的情节打动',
        '我能想象自己在他人处境中的感受',
        '我会代入小说或电影中的角色',
        '我能感受虚构人物的情感',
        '我容易沉浸在他人的故事中'
      ],
      score: 5.0
    },
    EC: {
      name: '共情关注',
      fullName: 'Empathic Concern',
      description: '对他人的同情和关心',
      questions: [
        '看到别人难过我会感到心疼',
        '我关心别人的感受',
        '我会安慰遇到困难的人',
        '别人的痛苦会触动我',
        '我愿意帮助需要帮助的人'
      ],
      score: 5.0
    },
    PD: {
      name: '个人痛苦',
      fullName: 'Personal Distress',
      description: '在紧张情境中的焦虑程度',
      questions: [
        '紧急情况会让我感到不安',
        '看到别人受伤我会感到紧张',
        '他人的痛苦会让我焦虑',
        '我容易被别人的情绪影响',
        '紧张情境会让我感到不适'
      ],
      score: 5.0,
      reverse: true // 反向计分
    }
  },

  /**
   * 简化版共情评估 (5 题快速版)
   * @returns {object} 评估结果
   */
  quickAssessment() {
    const questions = [
      {
        text: '我能理解别人的想法和感受',
        dimension: 'PT',
        score: 0
      },
      {
        text: '我容易被电影或书籍中的情节打动',
        dimension: 'FS',
        score: 0
      },
      {
        text: '看到别人难过我会感到心疼',
        dimension: 'EC',
        score: 0
      },
      {
        text: '紧急情况会让我感到不安',
        dimension: 'PD',
        score: 0,
        reverse: true
      },
      {
        text: '我会考虑别人的观点',
        dimension: 'PT',
        score: 0
      }
    ];

    return {
      type: 'quick',
      totalQuestions: questions.length,
      dimensions: ['PT', 'FS', 'EC', 'PD'],
      instructions: '请对每个陈述评分 (1-5 分)：\n1=非常不符合，2=不符合，3=一般，4=符合，5=非常符合',
      questions,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 计算共情总分
   * @param {array} answers - 用户答案数组 (1-5 分)
   * @returns {object} 评估结果
   */
  calculateScore(answers) {
    const dimensionScores = { PT: 0, FS: 0, EC: 0, PD: 0 };
    const dimensionCounts = { PT: 0, FS: 0, EC: 0, PD: 0 };

    // 这里简化处理，实际应根据答案计算
    const quickQuestions = this.quickAssessment().questions;
    
    answers.forEach((answer, index) => {
      if (index < quickQuestions.length) {
        const q = quickQuestions[index];
        const score = q.reverse ? (6 - answer) : answer; // 反向计分
        dimensionScores[q.dimension] += score;
        dimensionCounts[q.dimension] += 1;
      }
    });

    // 计算各维度平均分
    const dimAverages = {};
    Object.entries(dimensionScores).forEach(([dim, score]) => {
      dimAverages[dim] = dimensionCounts[dim] > 0 
        ? (score / dimensionCounts[dim]).toFixed(1) 
        : 0;
    });

    // 计算总分 (标准化到 0-100)
    const totalScore = Object.values(dimAverages).reduce((sum, v) => sum + parseFloat(v), 0) / 4 * 20;

    // 共情等级
    let level = '中等';
    if (totalScore >= 80) level = '很高';
    else if (totalScore >= 60) level = '高';
    else if (totalScore >= 40) level = '中等';
    else if (totalScore >= 20) level = '低';
    else level = '很低';

    return {
      dimensionScores: dimAverages,
      totalScore: totalScore.toFixed(1),
      level,
      interpretation: this.interpretScore(totalScore),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 解释分数
   * @param {number} score - 总分
   * @returns {string} 解释文本
   */
  interpretScore(score) {
    if (score >= 80) {
      return '🌟 你的共情能力很强！你能够很好地理解他人的感受和观点。';
    } else if (score >= 60) {
      return '😊 你的共情能力较高，在大多数情况下能理解他人的感受。';
    } else if (score >= 40) {
      return '👍 你的共情能力处于中等水平，可以通过练习进一步提升。';
    } else if (score >= 20) {
      return '💡 你的共情能力有提升空间，可以多尝试从他人角度看问题。';
    } else {
      return '🌱 共情能力可以通过练习和觉察来培养，建议多关注他人的感受。';
    }
  },

  /**
   * 生成评估报告
   * @param {object} result - calculateScore 的返回值
   * @returns {string} 报告文本
   */
  generateReport(result) {
    let report = '💙 共情能力评估报告\n\n';
    report += '═'.repeat(40) + '\n\n';
    
    report += `总分：${result.totalScore}/100 (${result.level})\n\n`;
    
    report += '各维度得分:\n';
    const dimNames = {
      PT: '观点采择',
      FS: '幻想',
      EC: '共情关注',
      PD: '个人痛苦'
    };
    
    Object.entries(result.dimensionScores).forEach(([dim, score]) => {
      const bar = '█'.repeat(Math.round(score * 2)) + '░'.repeat(10 - Math.round(score * 2));
      report += `  ${dimNames[dim]}: ${bar} ${score}/5\n`;
    });
    
    report += '\n';
    report += `${result.interpretation}\n\n`;
    
    report += '═'.repeat(40) + '\n';
    report += '注：基于简化版 IRI 量表 (5 题快速版)\n';
    report += `评估时间：${result.timestamp}\n`;
    
    return report;
  },

  /**
   * 更新维度分数 (基于对话行为)
   * @param {string} dimension - 维度代码
   * @param {number} change - 变化量
   */
  updateDimension(dimension, change) {
    const dim = this.dimensions[dimension];
    if (!dim) return false;
    
    dim.score = Math.max(1, Math.min(10, dim.score + change));
    return true;
  },

  /**
   * 获取当前共情状态
   * @returns {object} 共情状态
   */
  getState() {
    const state = {};
    Object.entries(this.dimensions).forEach(([key, dim]) => {
      state[key] = {
        name: dim.name,
        score: dim.score
      };
    });
    return state;
  },

  /**
   * 重置评估
   */
  reset() {
    Object.values(this.dimensions).forEach(dim => {
      dim.score = 5.0;
    });
    return { success: true, message: '共情评估已重置' };
  }
};

module.exports = EmpathyAssessment;
