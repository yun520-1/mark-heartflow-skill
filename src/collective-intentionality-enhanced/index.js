/**
 * 集体意向性增强模块 (Collective Intentionality Enhanced)
 * 
 * 理论来源：Stanford Encyclopedia of Philosophy - Collective Intentionality
 * - Searle 集体意向性理论
 * - Bratman 共享意向性理论
 * - Gilbert 联合承诺理论
 * - Schmid 信任理论
 * 
 * 版本：v4.6.0
 * 
 * 核心功能:
 * 1. We-Intention 检测 (区分个体意图与集体意图)
 * 2. 集体承诺评估
 * 3. 共享目标识别
 * 4. 集体责任归因
 * 5. 信任评估
 */

// ==================== 常量定义 ====================

const COLLECTIVE_INTENTIONALITY_TYPES = {
  // 个体意图
  I_INTENTION: 'i_intention',
  // 集体意图
  WE_INTENTION: 'we_intention',
  // 共享目标
  SHARED_GOAL: 'shared_goal',
  // 联合承诺
  JOINT_COMMITMENT: 'joint_commitment',
  // 集体责任
  COLLECTIVE_RESPONSIBILITY: 'collective_responsibility'
};

// We-Intention 的关键特征
const WE_INTENTION_FEATURES = {
  GOAL_SHARING: 'goal_sharing',           // 目标共享性
  ACTION_INTERDEPENDENCE: 'action_interdependence', // 行动互赖性
  MUTUAL_RESPONSIVENESS: 'mutual_responsiveness',   // 相互响应性
  COMMITMENT_BINDING: 'commitment_binding',         // 承诺约束性
  IDENTITY_FUSION: 'identity_fusion'                // 身份融合度
};

// 集体意向性检测维度
const DETECTION_DIMENSIONS = {
  // 目标维度
  goalAlignment: {
    weight: 0.25,
    indicators: ['共同目标', '一起', '我们', '团队目标', '合作']
  },
  // 互赖维度
  interdependence: {
    weight: 0.20,
    indicators: ['需要彼此', '互相依赖', '协作', '配合', '分工']
  },
  // 响应维度
  mutualResponsiveness: {
    weight: 0.20,
    indicators: ['回应', '调整', '适应对方', '协调', '同步']
  },
  // 承诺维度
  commitment: {
    weight: 0.20,
    indicators: ['承诺', '约定', '责任', '义务', '保证']
  },
  // 信任维度
  trust: {
    weight: 0.15,
    indicators: ['信任', '相信', '可靠', '放心', '依赖']
  }
};

// 集体承诺类型
const COMMITMENT_TYPES = {
  // Gilbert 联合承诺
  JOINT: 'joint',
  // 个人承诺聚合
  AGGREGATE: 'aggregate',
  // 规范性承诺
  NORMATIVE: 'normative',
  // 情感性承诺
  AFFECTIVE: 'affective'
};

// 信任评估维度
const TRUST_DIMENSIONS = {
  COMPETENCE: 'competence',     // 能力信任
  INTEGRITY: 'integrity',       // 诚信信任
  BENEVOLENCE: 'benevolence',   // 善意信任
  PREDICTABILITY: 'predictability' // 可预测性信任
};

// ==================== We-Intention 检测 ====================

/**
 * 检测 We-Intention (集体意图)
 * 
 * @param {string} statement - 用户的陈述
 * @param {object} context - 情境信息 (是否涉及他人、群体等)
 * @returns {object} We-Intention 评估结果
 */
function detectWeIntention(statement, context = {}) {
  const result = {
    type: COLLECTIVE_INTENTIONALITY_TYPES.I_INTENTION,
    confidence: 0,
    dimensions: {},
    features: {},
    analysis: ''
  };

  // 1. 语言标记检测
  const weMarkers = ['我们', '咱们', '一起', '共同', '团队', '大家一起', ' collectively'];
  const iMarkers = ['我', '自己', '个人', '独自', '我自己'];
  
  const hasWeMarker = weMarkers.some(marker => statement.includes(marker));
  const hasIMarker = iMarkers.some(marker => statement.includes(marker));

  // 2. 维度评分
  let totalScore = 0;
  let totalWeight = 0;

  for (const [dim, config] of Object.entries(DETECTION_DIMENSIONS)) {
    const score = detectDimension(statement, dim, config.indicators);
    result.dimensions[dim] = score;
    totalScore += score * config.weight;
    totalWeight += config.weight;
  }

  result.confidence = totalScore / totalWeight;

  // 3. 特征分析
  result.features = {
    [WE_INTENTION_FEATURES.GOAL_SHARING]: result.dimensions.goalAlignment > 0.5,
    [WE_INTENTION_FEATURES.ACTION_INTERDEPENDENCE]: result.dimensions.interdependence > 0.5,
    [WE_INTENTION_FEATURES.MUTUAL_RESPONSIVENESS]: result.dimensions.mutualResponsiveness > 0.5,
    [WE_INTENTION_FEATURES.COMMITMENT_BINDING]: result.dimensions.commitment > 0.5,
    [WE_INTENTION_FEATURES.IDENTITY_FUSION]: result.dimensions.trust > 0.5
  };

  // 4. 类型判定
  if (result.confidence >= 0.7 && hasWeMarker) {
    result.type = COLLECTIVE_INTENTIONALITY_TYPES.WE_INTENTION;
    result.analysis = '检测到强烈的集体意图 (We-Intention)。用户表达的是"我们"共同的意向，而非单纯的个人意图聚合。';
  } else if (result.confidence >= 0.5) {
    result.type = COLLECTIVE_INTENTIONALITY_TYPES.SHARED_GOAL;
    result.analysis = '检测到共享目标。用户表达的目标涉及他人，但集体意向性强度中等。';
  } else {
    result.type = COLLECTIVE_INTENTIONALITY_TYPES.I_INTENTION;
    result.analysis = '主要是个体意图。虽然可能涉及他人，但核心是个人层面的意向。';
  }

  // 5. 结合情境调整
  if (context.groupSetting) {
    result.confidence = Math.min(1.0, result.confidence + 0.1);
  }
  if (context.historyOfCollaboration) {
    result.dimensions.commitment = Math.min(1.0, result.dimensions.commitment + 0.15);
  }

  return result;
}

/**
 * 检测单个维度的得分
 */
function detectDimension(statement, dimension, indicators) {
  let score = 0;
  
  for (const indicator of indicators) {
    if (statement.includes(indicator)) {
      score += 0.3;
    }
  }

  // 语义分析增强 (简化版)
  if (dimension === 'goalAlignment') {
    if (statement.includes('目标') || statement.includes('目的')) {
      score += 0.2;
    }
  }

  return Math.min(1.0, score);
}

// ==================== 集体承诺评估 ====================

/**
 * 评估集体承诺的强度和类型
 * 
 * @param {string} commitment - 承诺陈述
 * @param {array} participants - 参与者列表
 * @returns {object} 承诺评估结果
 */
function assessCollectiveCommitment(commitment, participants = []) {
  const result = {
    type: COMMITMENT_TYPES.AGGREGATE,
    strength: 0,
    bindingForce: 0,
    mutuality: 0,
    analysis: {}
  };

  // 1. 承诺类型检测
  const jointMarkers = ['我们一起承诺', '我们约定', '我们共同决定', '说好了'];
  const aggregateMarkers = ['我承诺', '我会', '我保证'];
  const normativeMarkers = ['应该', '必须', '有责任', '义务'];
  const affectiveMarkers = ['愿意', '想要', '希望', '期待'];

  const hasJoint = jointMarkers.some(m => commitment.includes(m));
  const hasAggregate = aggregateMarkers.some(m => commitment.includes(m));
  const hasNormative = normativeMarkers.some(m => commitment.includes(m));
  const hasAffective = affectiveMarkers.some(m => commitment.includes(m));

  // 2. 类型判定
  if (hasJoint && participants.length > 1) {
    result.type = COMMITMENT_TYPES.JOINT;
    result.bindingForce = 0.9;
  } else if (hasNormative) {
    result.type = COMMITMENT_TYPES.NORMATIVE;
    result.bindingForce = 0.7;
  } else if (hasAffective) {
    result.type = COMMITMENT_TYPES.AFFECTIVE;
    result.bindingForce = 0.5;
  } else {
    result.type = COMMITMENT_TYPES.AGGREGATE;
    result.bindingForce = 0.4;
  }

  // 3. 承诺强度评估
  const strengthFactors = {
    explicitness: hasJoint ? 1.0 : (hasAggregate ? 0.7 : 0.5),
    publicity: participants.length > 2 ? 1.0 : 0.6,
    specificity: commitment.length > 20 ? 0.9 : 0.5,
    temporality: commitment.includes('一直') || commitment.includes('永远') ? 1.0 : 0.7
  };

  result.strength = Object.values(strengthFactors).reduce((a, b) => a + b, 0) / 4;

  // 4. 相互性评估
  result.mutuality = participants.length > 1 ? 
    (hasJoint ? 0.9 : 0.5) : 0;

  // 5. 分析
  result.analysis = {
    type: result.type,
    strengthLevel: result.strength >= 0.8 ? '强' : (result.strength >= 0.5 ? '中' : '弱'),
    bindingLevel: result.bindingForce >= 0.8 ? '强约束' : (result.bindingForce >= 0.5 ? '中等约束' : '弱约束'),
    recommendations: getCommitmentRecommendations(result)
  };

  return result;
}

/**
 * 获取承诺强化建议
 */
function getCommitmentRecommendations(assessment) {
  const recommendations = [];

  if (assessment.type === COMMITMENT_TYPES.AGGREGATE) {
    recommendations.push('考虑将个人承诺转化为联合承诺，增强约束力');
  }
  if (assessment.strength < 0.5) {
    recommendations.push('明确承诺的具体内容和执行方式');
  }
  if (assessment.mutuality < 0.5) {
    recommendations.push('确认所有参与者的承诺一致性');
  }
  if (assessment.bindingForce < 0.5) {
    recommendations.push('建立承诺的监督和执行机制');
  }

  return recommendations;
}

// ==================== 共享目标识别 ====================

/**
 * 识别和分析共享目标
 * 
 * @param {string} goalStatement - 目标陈述
 * @returns {object} 共享目标分析
 */
function identifySharedGoal(goalStatement) {
  const result = {
    isShared: false,
    clarity: 0,
    alignment: 0,
    interdependence: 0,
    actionPlan: null
  };

  // 1. 共享性检测
  const sharedMarkers = ['一起', '共同', '我们', '团队', '合作', '协作'];
  result.isShared = sharedMarkers.some(m => goalStatement.includes(m));

  // 2. 目标清晰度评估
  const clarityFactors = {
    specific: goalStatement.length > 15,
    measurable: goalStatement.includes('完成') || goalStatement.includes('达到'),
    timeBound: goalStatement.includes('之前') || goalStatement.includes('后') || /\d/.test(goalStatement)
  };
  result.clarity = Object.values(clarityFactors).filter(Boolean).length / 3;

  // 3. 目标一致性 (简化版)
  result.alignment = result.isShared ? 0.8 : 0.3;

  // 4. 互赖性评估
  const interdependenceMarkers = ['需要', '依靠', '配合', '分工', '各自'];
  result.interdependence = interdependenceMarkers.filter(m => goalStatement.includes(m)).length / interdependenceMarkers.length;

  // 5. 行动计划建议
  if (result.isShared && result.clarity > 0.5) {
    result.actionPlan = {
      steps: [
        '明确每个参与者的角色和责任',
        '建立沟通和协调机制',
        '设定里程碑和检查点',
        '建立反馈和调整机制'
      ]
    };
  }

  return result;
}

// ==================== 集体责任归因 ====================

/**
 * 分析集体责任归因
 * 
 * @param {string} situation - 情境描述
 * @param {array} participants - 参与者
 * @returns {object} 责任归因分析
 */
function analyzeCollectiveResponsibility(situation, participants = []) {
  const result = {
    type: 'individual', // individual, shared, distributed
    distribution: [],
    factors: {},
    recommendations: []
  };

  // 1. 责任类型判定
  const hasCollectiveMarkers = ['我们', '大家一起', '团队', '共同'].some(m => situation.includes(m));
  const hasIndividualMarkers = ['我', '我自己', '个人'].some(m => situation.includes(m));

  if (hasCollectiveMarkers && participants.length > 1) {
    result.type = 'shared';
  } else if (hasIndividualMarkers) {
    result.type = 'individual';
  } else {
    result.type = 'distributed';
  }

  // 2. 责任分配因素
  result.factors = {
    causality: 0.5,    // 因果贡献
    control: 0.5,      // 控制程度
    knowledge: 0.5,    // 知情程度
    voluntariness: 0.5 // 自愿程度
  };

  // 3. 责任分配建议
  if (result.type === 'shared') {
    result.distribution = participants.map(p => ({
      participant: p,
      responsibility: 1 / participants.length,
      role: '共同承担'
    }));
    result.recommendations = [
      '建立集体责任机制',
      '明确每个人的具体贡献',
      '定期检视责任履行情况'
    ];
  } else if (result.type === 'distributed') {
    result.recommendations = [
      '根据角色和能力分配责任',
      '建立责任追溯机制',
      '确保责任与权力匹配'
    ];
  }

  return result;
}

// ==================== 信任评估 ====================

/**
 * 评估信任水平
 * 
 * @param {string} trustStatement - 信任相关陈述
 * @returns {object} 信任评估结果
 */
function assessTrust(trustStatement) {
  const result = {
    overall: 0.5,
    dimensions: {},
    level: 'medium',
    recommendations: []
  };

  // 信任维度检测
  const dimensionKeywords = {
    [TRUST_DIMENSIONS.COMPETENCE]: ['能力', '专业', '擅长', '可以', '能'],
    [TRUST_DIMENSIONS.INTEGRITY]: ['诚实', '守信', '可靠', '正直', '原则'],
    [TRUST_DIMENSIONS.BENEVOLENCE]: ['关心', '帮助', '支持', '善意', '好意'],
    [TRUST_DIMENSIONS.PREDICTABILITY]: ['一直', '总是', '通常', '习惯', '稳定']
  };

  let totalScore = 0;
  for (const [dim, keywords] of Object.entries(dimensionKeywords)) {
    const score = keywords.filter(k => trustStatement.includes(k)).length / keywords.length;
    result.dimensions[dim] = score;
    totalScore += score;
  }

  result.overall = totalScore / 4;

  // 信任水平判定
  if (result.overall >= 0.7) {
    result.level = 'high';
  } else if (result.overall >= 0.4) {
    result.level = 'medium';
  } else {
    result.level = 'low';
    result.recommendations = getTrustBuildingRecommendations(result.dimensions);
  }

  return result;
}

/**
 * 获取信任建立建议
 */
function getTrustBuildingRecommendations(dimensions) {
  const recommendations = [];

  if (dimensions[TRUST_DIMENSIONS.COMPETENCE] < 0.5) {
    recommendations.push('展示专业能力和可靠性');
  }
  if (dimensions[TRUST_DIMENSIONS.INTEGRITY] < 0.5) {
    recommendations.push('保持言行一致，遵守承诺');
  }
  if (dimensions[TRUST_DIMENSIONS.BENEVOLENCE] < 0.5) {
    recommendations.push('表达关心和善意，主动提供支持');
  }
  if (dimensions[TRUST_DIMENSIONS.PREDICTABILITY] < 0.5) {
    recommendations.push('建立稳定的行为模式，增强可预测性');
  }

  return recommendations;
}

// ==================== 练习技术 ====================

/**
 * 集体目标澄清练习 (5 步)
 */
function getCollectiveGoalClarificationExercise() {
  return {
    name: '集体目标澄清练习',
    duration: '15-20 分钟',
    steps: [
      {
        step: 1,
        title: '个人目标表达',
        instruction: '每个参与者独立写下自己对集体目标的理解和期望',
        duration: '3-5 分钟'
      },
      {
        step: 2,
        title: '目标分享',
        instruction: '轮流分享个人目标理解，不做评判，只倾听',
        duration: '5-8 分钟'
      },
      {
        step: 3,
        title: '共同点识别',
        instruction: '找出所有人目标理解中的共同点和差异点',
        duration: '3-5 分钟'
      },
      {
        step: 4,
        title: '整合目标',
        instruction: '基于共同点，共同制定一个整合的集体目标陈述',
        duration: '5-7 分钟'
      },
      {
        step: 5,
        title: '承诺确认',
        instruction: '每个参与者确认对整合目标的承诺程度 (1-10 分)',
        duration: '2-3 分钟'
      }
    ],
    expectedOutcome: '形成清晰、共享的集体目标，增强集体意向性'
  };
}

/**
 * 联合承诺评估工具
 */
function getJointCommitmentAssessment() {
  return {
    name: '联合承诺评估工具',
    questions: [
      {
        id: 1,
        question: '这个承诺是明确表达出来的，还是隐含的？',
        options: ['明确表达', '部分明确', '隐含'],
        scores: [1.0, 0.6, 0.3]
      },
      {
        id: 2,
        question: '所有参与者都清楚承诺的内容吗？',
        options: ['完全清楚', '部分清楚', '不清楚'],
        scores: [1.0, 0.6, 0.2]
      },
      {
        id: 3,
        question: '承诺是公开的还是私下的？',
        options: ['公开', '半公开', '私下'],
        scores: [1.0, 0.6, 0.3]
      },
      {
        id: 4,
        question: '是否有违反承诺的后果机制？',
        options: ['有明确后果', '有模糊后果', '无后果'],
        scores: [1.0, 0.5, 0.2]
      },
      {
        id: 5,
        question: '参与者对承诺的认同程度如何？',
        options: ['高度认同', '中等认同', '低度认同'],
        scores: [1.0, 0.6, 0.3]
      }
    ],
    interpretation: {
      high: '5-4 分：强联合承诺，具有高约束力',
      medium: '3 分：中等联合承诺，需要强化',
      low: '2 分及以下：弱联合承诺，建议重新协商'
    }
  };
}

/**
 * 信任修复干预框架
 */
function getTrustRepairFramework() {
  return {
    name: '信任修复干预框架',
    phases: [
      {
        phase: 1,
        title: '承认与诊断',
        actions: [
          '承认信任受损的事实',
          '诊断信任受损的原因 (能力/诚信/善意/可预测性)',
          '评估受损程度'
        ]
      },
      {
        phase: 2,
        title: '道歉与解释',
        actions: [
          '真诚道歉 (不找借口)',
          '提供合理解释 (非辩解)',
          '表达修复意愿'
        ]
      },
      {
        phase: 3,
        title: '补偿与改正',
        actions: [
          '提供适当补偿',
          '制定改正计划',
          '设定时间表'
        ]
      },
      {
        phase: 4,
        title: '监控与验证',
        actions: [
          '建立监控机制',
          '定期验证进展',
          '接受反馈'
        ]
      },
      {
        phase: 5,
        title: '重建与巩固',
        actions: [
          '持续展示可信任行为',
          '逐步恢复信任',
          '巩固新信任基础'
        ]
      }
    ],
    notes: '信任修复需要时间，不可急于求成。不同维度的信任受损需要不同的修复策略。'
  };
}

// ==================== 模块导出 ====================

module.exports = {
  // 常量
  COLLECTIVE_INTENTIONALITY_TYPES,
  WE_INTENTION_FEATURES,
  DETECTION_DIMENSIONS,
  COMMITMENT_TYPES,
  TRUST_DIMENSIONS,
  
  // 核心功能
  detectWeIntention,
  assessCollectiveCommitment,
  identifySharedGoal,
  analyzeCollectiveResponsibility,
  assessTrust,
  
  // 练习技术
  getCollectiveGoalClarificationExercise,
  getJointCommitmentAssessment,
  getTrustRepairFramework,
  
  // 版本信息
  version: '4.6.0',
  theorySource: 'SEP Collective Intentionality'
};
