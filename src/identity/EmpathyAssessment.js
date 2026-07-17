/**
 * EmpathyAssessment - 共情能力评估
 * 来源: claude-clarity v1.8.2 吸收集成
 *
 * 基于人际反应指数 (Interpersonal Reactivity Index, IRI)
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
      reverse: true
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

    const quickQuestions = this.quickAssessment().questions;

    answers.forEach((answer, index) => {
      if (index < quickQuestions.length) {
        const q = quickQuestions[index];
        const score = q.reverse ? (6 - answer) : answer;
        dimensionScores[q.dimension] += score;
        dimensionCounts[q.dimension] += 1;
      }
    });

    const dimAverages = {};
    Object.entries(dimensionScores).forEach(([dim, score]) => {
      dimAverages[dim] = dimensionCounts[dim] > 0
        ? (score / dimensionCounts[dim]).toFixed(1)
        : 0;
    });

    const totalScore = Object.values(dimAverages).reduce((sum, v) => sum + parseFloat(v), 0) / 4 * 20;

    let level = '中等';
    if (totalScore >= 80) level = '很高';
    else if (totalScore >= 60) level = '高';
    else if (totalScore >= 40) level = '中等';
    else if (totalScore >= 20) level = '低';
    else level = '很低';

    return {
      totalScore: Math.round(totalScore),
      level,
      dimensions: dimAverages,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 快速共情分析（无需用户回答）
   * @param {string} text - 用户输入文本
   * @returns {object} 共情分析结果
   */
  analyzeText(text) {
    const lower = text.toLowerCase();
    const indicators = {
      PT: 0,  // 观点采择 - 用户是否尝试从他人角度看问题
      FS: 0,  // 幻想 - 用户是否使用比喻/故事表达
      EC: 0,  // 共情关注 - 用户是否表达关心/同情
      PD: 0   // 个人痛苦 - 用户是否表达焦虑/不安
    };

    if (/理解|角度|立场|观点|设身处地/.test(lower)) indicators.PT++;
    if (/比喻|像|故事|电影|小说/.test(lower)) indicators.FS++;
    if (/心疼|关心|同情|安慰|帮助|担心/.test(lower)) indicators.EC++;
    if (/焦虑|紧张|不安|害怕|担心|压力/.test(lower)) indicators.PD++;

    const hasEmpathy = indicators.EC > 0 || indicators.PT > 0;
    return {
      indicators,
      hasEmpathy,
      dominantDimension: Object.entries(indicators).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = EmpathyAssessment;
