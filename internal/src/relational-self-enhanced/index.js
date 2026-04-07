/**
 * 关系性自我增强模块 (Relational Self Enhanced)
 * 
 * 理论来源:
 * - Stanford Encyclopedia of Philosophy - Self-Consciousness
 * - 关系性自我理论 (Relational Self Theory)
 * - 依恋理论 (Attachment Theory)
 * - 互赖理论 (Interdependence Theory)
 * - 关系现象学 (Relational Phenomenology)
 * 
 * 版本：v4.6.0
 * 
 * 核心功能:
 * 1. 关系性自我评估 (4 维度)
 * 2. 关系身份地图
 * 3. 关系冲突分析
 * 4. 关系成长干预
 */

// ==================== 常量定义 ====================

// 关系性自我 4 维度
const RELATIONAL_SELF_DIMENSIONS = {
  RELATIONAL_DEPENDENCE: 'relational_dependence',   // 关系依赖度
  RELATIONAL_AUTONOMY: 'relational_autonomy',       // 关系自主性
  RELATIONAL_BOUNDARIES: 'relational_boundaries',   // 关系边界
  RELATIONAL_INTEGRATION: 'relational_integration'  // 关系整合度
};

// 关系身份类型
const RELATIONAL_IDENTITY_TYPES = {
  FUSED: 'fused',               // 融合型 (边界模糊，高度依赖)
  DISCONNECTED: 'disconnected', // 疏离型 (边界僵硬，低度连接)
  HEALTHY: 'healthy',           // 健康型 (边界灵活，平衡依赖与自主)
  ENMESHED: 'enmeshed',         // 纠缠型 (过度卷入)
  AVOIDANT: 'avoidant'          // 回避型 (过度独立)
};

// 关系动力模式
const RELATIONAL_DYNAMICS = {
  PURSUIT_WITHDRAWAL: 'pursuit_withdrawal',   // 追逐 - 退缩
  MUTUAL_AVOIDANCE: 'mutual_avoidance',       // 互相回避
  MUTUAL_PURSUIT: 'mutual_pursuit',           // 互相追逐
  SECURE_CONNECTION: 'secure_connection'      // 安全连接
};

// 依恋风格
const ATTACHMENT_STYLES = {
  SECURE: 'secure',           // 安全型
  ANXIOUS: 'anxious',         // 焦虑型
  AVOIDANT: 'avoidant',       // 回避型
  DISORGANIZED: 'disorganized' // 混乱型
};

// ==================== 关系性自我评估 ====================

/**
 * 评估关系性自我的 4 个维度
 * 
 * @param {object} selfReport - 自我报告数据
 * @param {object} relationshipData - 关系数据 (可选)
 * @returns {object} 关系性自我评估结果
 */
function assessRelationalSelfDimensions(selfReport, relationshipData = {}) {
  const result = {
    dimensions: {},
    profile: null,
    attachmentStyle: null,
    dynamics: null,
    strengths: [],
    areas_for_growth: [],
    recommendations: []
  };

  // 1. 关系依赖度评估
  result.dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_DEPENDENCE] = 
    assessRelationalDependence(selfReport);

  // 2. 关系自主性评估
  result.dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_AUTONOMY] = 
    assessRelationalAutonomy(selfReport);

  // 3. 关系边界评估
  result.dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_BOUNDARIES] = 
    assessRelationalBoundaries(selfReport);

  // 4. 关系整合度评估
  result.dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_INTEGRATION] = 
    assessRelationalIntegration(selfReport);

  // 5. 生成关系身份画像
  result.profile = generateRelationalIdentityProfile(result.dimensions);

  // 6. 依恋风格推断
  result.attachmentStyle = inferAttachmentStyle(result.dimensions);

  // 7. 关系动力识别
  result.dynamics = identifyRelationalDynamics(selfReport);

  // 8. 识别优势
  result.strengths = Object.entries(result.dimensions)
    .filter(([_, score]) => score >= 0.7)
    .map(([dim, score]) => ({ dimension: dim, score }));

  // 9. 识别成长领域
  result.areas_for_growth = Object.entries(result.dimensions)
    .filter(([_, score]) => score < 0.5)
    .map(([dim, score]) => ({ dimension: dim, score }));

  // 10. 生成建议
  result.recommendations = generateRelationalRecommendations(result);

  return result;
}

/**
 * 评估关系依赖度
 */
function assessRelationalDependence(selfReport) {
  // 关系依赖度 = 自我定义对关系的依赖程度
  const indicators = [
    selfReport.needForApproval,      // 对认可的需求
    selfReport.fearOfAbandonment,    // 被抛弃恐惧
    selfReport.identityThroughOthers, // 通过他人定义自我
    selfReport.difficultyAlone       // 独处困难
  ];

  const validIndicators = indicators.filter(v => v !== undefined);
  if (validIndicators.length === 0) return 0.5;

  // 高分 = 过度依赖，低分 = 过度独立
  return validIndicators.reduce((a, b) => a + b, 0) / validIndicators.length;
}

/**
 * 评估关系自主性
 */
function assessRelationalAutonomy(selfReport) {
  // 关系自主性 = 在关系中保持自我的能力
  const indicators = [
    selfReport.maintainValues,       // 保持价值观
    selfReport.expressNeeds,         // 表达需求
    selfReport.makeIndependentChoices, // 独立选择
    selfReport.comfortWithDifference  // 接纳差异
  ];

  const validIndicators = indicators.filter(v => v !== undefined);
  if (validIndicators.length === 0) return 0.5;

  return validIndicators.reduce((a, b) => a + b, 0) / validIndicators.length;
}

/**
 * 评估关系边界
 */
function assessRelationalBoundaries(selfReport) {
  // 关系边界 = 建立和维护健康边界的能力
  const indicators = [
    selfReport.canSayNo,            // 能说不
    selfReport.protectPersonalSpace, // 保护个人空间
    selfReport.respectOthersBoundaries, // 尊重他人边界
    selfReport.flexibleBoundaries    // 边界灵活性
  ];

  const validIndicators = indicators.filter(v => v !== undefined);
  if (validIndicators.length === 0) return 0.5;

  return validIndicators.reduce((a, b) => a + b, 0) / validIndicators.length;
}

/**
 * 评估关系整合度
 */
function assessRelationalIntegration(selfReport) {
  // 关系整合度 = 多重关系的整合程度
  const indicators = [
    selfReport.consistentAcrossRelationships, // 跨关系一致性
    selfReport.integrateMultipleRoles,        // 整合多重角色
    selfReport.balancedInvestment,            // 平衡投入
    selfReport.coherentRelationalNarrative    // 连贯的关系叙事
  ];

  const validIndicators = indicators.filter(v => v !== undefined);
  if (validIndicators.length === 0) return 0.5;

  return validIndicators.reduce((a, b) => a + b, 0) / validIndicators.length;
}

/**
 * 生成关系身份画像
 */
function generateRelationalIdentityProfile(dimensions) {
  const dependence = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_DEPENDENCE];
  const autonomy = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_AUTONOMY];
  const boundaries = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_BOUNDARIES];

  // 健康型：中等依赖 + 高自主 + 好边界
  if (dependence >= 0.3 && dependence <= 0.7 && autonomy >= 0.6 && boundaries >= 0.6) {
    return {
      type: RELATIONAL_IDENTITY_TYPES.HEALTHY,
      label: '健康整合型',
      description: '在关系中既能保持自主性，又能建立亲密连接，边界灵活健康'
    };
  }

  // 融合型：高依赖 + 低自主 + 弱边界
  if (dependence >= 0.7 && autonomy < 0.5 && boundaries < 0.5) {
    return {
      type: RELATIONAL_IDENTITY_TYPES.FUSED,
      label: '融合型',
      description: '倾向于与他人融合，边界模糊，可能过度依赖关系定义自我'
    };
  }

  // 疏离型：低依赖 + 高自主 (僵化) + 僵硬边界
  if (dependence < 0.3 && boundaries < 0.4) {
    return {
      type: RELATIONAL_IDENTITY_TYPES.DISCONNECTED,
      label: '疏离型',
      description: '倾向于保持情感距离，边界僵硬，可能回避亲密连接'
    };
  }

  // 纠缠型：高依赖 + 低边界
  if (dependence >= 0.7 && boundaries < 0.5) {
    return {
      type: RELATIONAL_IDENTITY_TYPES.ENMESHED,
      label: '纠缠型',
      description: '过度卷入他人生活，难以区分自己和他人的情感/需求'
    };
  }

  // 回避型：低依赖 + 回避亲密
  if (dependence < 0.3 && autonomy >= 0.7) {
    return {
      type: RELATIONAL_IDENTITY_TYPES.AVOIDANT,
      label: '回避型',
      description: '强调独立，回避依赖和亲密，可能压抑关系需求'
    };
  }

  // 默认
  return {
    type: 'mixed',
    label: '混合型',
    description: '关系模式复杂，不同维度有不同特点'
  };
}

/**
 * 推断依恋风格
 */
function inferAttachmentStyle(dimensions) {
  const dependence = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_DEPENDENCE];
  const autonomy = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_AUTONOMY];
  const boundaries = dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_BOUNDARIES];

  // 安全型：平衡的依赖和自主
  if (dependence >= 0.3 && dependence <= 0.7 && autonomy >= 0.6) {
    return ATTACHMENT_STYLES.SECURE;
  }

  // 焦虑型：高依赖 + 低自主
  if (dependence >= 0.7 && autonomy < 0.5) {
    return ATTACHMENT_STYLES.ANXIOUS;
  }

  // 回避型：低依赖 + 高自主 (防御性)
  if (dependence < 0.3 && autonomy >= 0.7) {
    return ATTACHMENT_STYLES.AVOIDANT;
  }

  // 混乱型：矛盾的模式
  if (boundaries < 0.3 && (dependence < 0.3 || dependence >= 0.7)) {
    return ATTACHMENT_STYLES.DISORGANIZED;
  }

  return ATTACHMENT_STYLES.SECURE; // 默认
}

/**
 * 识别关系动力模式
 */
function identifyRelationalDynamics(selfReport) {
  const pursuit = selfReport.pursuitTendency || 0.5;
  const withdrawal = selfReport.withdrawalTendency || 0.5;

  if (pursuit >= 0.7 && withdrawal < 0.3) {
    return RELATIONAL_DYNAMICS.MUTUAL_PURSUIT;
  }
  if (pursuit < 0.3 && withdrawal >= 0.7) {
    return RELATIONAL_DYNAMICS.MUTUAL_AVOIDANCE;
  }
  if (pursuit >= 0.6 && withdrawal >= 0.6) {
    return RELATIONAL_DYNAMICS.PURSUIT_WITHDRAWAL;
  }
  return RELATIONAL_DYNAMICS.SECURE_CONNECTION;
}

/**
 * 生成关系成长建议
 */
function generateRelationalRecommendations(assessment) {
  const recommendations = [];
  const { dimensions, profile, attachmentStyle } = assessment;

  // 基于维度
  if (dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_DEPENDENCE] >= 0.7) {
    recommendations.push({
      area: '关系依赖',
      suggestion: '培养自我确认能力，减少对外部认可的依赖',
      exercise: '自我肯定练习'
    });
  }

  if (dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_AUTONOMY] < 0.5) {
    recommendations.push({
      area: '关系自主',
      suggestion: '练习在关系中表达自己的需求和价值观',
      exercise: '自主表达练习'
    });
  }

  if (dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_BOUNDARIES] < 0.5) {
    recommendations.push({
      area: '关系边界',
      suggestion: '学习设立和维护健康的个人边界',
      exercise: '边界设定练习'
    });
  }

  if (dimensions[RELATIONAL_SELF_DIMENSIONS.RELATIONAL_INTEGRATION] < 0.5) {
    recommendations.push({
      area: '关系整合',
      suggestion: '探索如何整合不同的关系角色和身份',
      exercise: '关系整合叙事'
    });
  }

  // 基于依恋风格
  if (attachmentStyle === ATTACHMENT_STYLES.ANXIOUS) {
    recommendations.push({
      area: '依恋模式',
      suggestion: '培养安全基地感，学习自我安抚',
      exercise: '安全基地可视化'
    });
  }

  if (attachmentStyle === ATTACHMENT_STYLES.AVOIDANT) {
    recommendations.push({
      area: '依恋模式',
      suggestion: '逐步开放情感表达，允许自己依赖他人',
      exercise: '渐进式脆弱练习'
    });
  }

  return recommendations;
}

// ==================== 关系身份地图 ====================

/**
 * 创建关系身份地图
 * 
 * @param {array} relationships - 重要关系列表
 * @returns {object} 关系身份地图
 */
function createRelationalIdentityMap(relationships) {
  const map = {
    coreRelationships: [],
    relationshipPatterns: [],
    identityInfluences: [],
    integrationOpportunities: []
  };

  // 1. 分类核心关系
  relationships.forEach(rel => {
    map.coreRelationships.push({
      name: rel.name,
      type: rel.type, // family, friend, partner, colleague
      closeness: rel.closeness || 0.5,
      influence: rel.influence || 0.5,
      quality: rel.quality || 0.5
    });
  });

  // 2. 识别关系模式
  const patterns = {};
  relationships.forEach(rel => {
    const pattern = rel.pattern || 'unknown';
    if (!patterns[pattern]) patterns[pattern] = [];
    patterns[pattern].push(rel.name);
  });
  
  for (const [pattern, names] of Object.entries(patterns)) {
    map.relationshipPatterns.push({
      pattern,
      relationships: names
    });
  }

  // 3. 分析身份影响
  relationships.forEach(rel => {
    if (rel.influence >= 0.7) {
      map.identityInfluences.push({
        relationship: rel.name,
        how: rel.identityInfluence,
        positive: rel.positiveInfluence,
        negative: rel.negativeInfluence
      });
    }
  });

  // 4. 识别整合机会
  map.integrationOpportunities = identifyIntegrationOpportunities(relationships);

  return map;
}

/**
 * 识别整合机会
 */
function identifyIntegrationOpportunities(relationships) {
  const opportunities = [];

  // 检查角色冲突
  const roleConflicts = findRoleConflicts(relationships);
  if (roleConflicts.length > 0) {
    opportunities.push({
      type: 'role_conflict_resolution',
      description: '解决角色冲突',
      relationships: roleConflicts
    });
  }

  // 检查支持网络缺口
  const supportGaps = identifySupportGaps(relationships);
  if (supportGaps.length > 0) {
    opportunities.push({
      type: 'support_network_expansion',
      description: '扩展支持网络',
      gaps: supportGaps
    });
  }

  // 检查关系平衡
  const balanceIssues = identifyBalanceIssues(relationships);
  if (balanceIssues.length > 0) {
    opportunities.push({
      type: 'relationship_rebalancing',
      description: '重新平衡关系投入',
      issues: balanceIssues
    });
  }

  return opportunities;
}

function findRoleConflicts(relationships) {
  // 简化实现
  return [];
}

function identifySupportGaps(relationships) {
  const gaps = [];
  const supportTypes = ['emotional', 'instrumental', 'informational', 'companionship'];
  
  supportTypes.forEach(type => {
    const hasSupport = relationships.some(r => r.supportTypes && r.supportTypes.includes(type));
    if (!hasSupport) {
      gaps.push(type);
    }
  });
  
  return gaps;
}

function identifyBalanceIssues(relationships) {
  const issues = [];
  const overInvested = relationships.filter(r => r.investment > 0.8 && r.quality < 0.5);
  
  if (overInvested.length > 0) {
    issues.push({
      type: 'over_investment',
      relationships: overInvested.map(r => r.name)
    });
  }
  
  return issues;
}

// ==================== 关系冲突分析 ====================

/**
 * 分析关系冲突
 * 
 * @param {string} conflictDescription - 冲突描述
 * @returns {object} 冲突分析结果
 */
function analyzeRelationalConflict(conflictDescription) {
  const result = {
    conflictType: null,
    underlyingIssues: [],
    relationalPatterns: [],
    interventionSuggestions: []
  };

  // 1. 冲突类型识别
  const conflictTypes = {
    boundary_violation: ['边界', '侵犯', '过度', '干涉', '隐私'],
    unmet_need: ['需要', '期望', '失望', '不被理解', '忽视'],
    value_conflict: ['价值观', '原则', '对错', '应该', '信念'],
    power_struggle: ['控制', '权力', '主导', '服从', '决定权'],
    attachment_trigger: ['抛弃', '忽视', '不回应', '疏远', '冷漠']
  };

  for (const [type, markers] of Object.entries(conflictTypes)) {
    if (markers.some(m => conflictDescription.includes(m))) {
      result.conflictType = type;
      break;
    }
  }

  // 2. 深层问题识别
  result.underlyingIssues = identifyUnderlyingIssues(conflictDescription);

  // 3. 关系模式识别
  result.relationalPatterns = identifyConflictPatterns(conflictDescription);

  // 4. 干预建议
  result.interventionSuggestions = getConflictInterventionSuggestions(result);

  return result;
}

function identifyUnderlyingIssues(description) {
  const issues = [];

  if (description.includes('不被理解') || description.includes('不被听到')) {
    issues.push('被理解的需要');
  }
  if (description.includes('不被尊重') || description.includes('被轻视')) {
    issues.push('被尊重的需要');
  }
  if (description.includes('被控制') || description.includes('被迫')) {
    issues.push('自主性的需要');
  }
  if (description.includes('被抛弃') || description.includes('被忽视')) {
    issues.push('安全依恋的需要');
  }

  return issues;
}

function identifyConflictPatterns(description) {
  const patterns = [];

  if (description.includes('总是') || description.includes('从不')) {
    patterns.push('绝对化思维');
  }
  if (description.includes('你让我') || description.includes '都是因为你')) {
    patterns.push('外归因模式');
  }
  if (description.includes('我应该') || description.includes('我不应该')) {
    patterns.push('应该思维');
  }

  return patterns;
}

function getConflictInterventionSuggestions(analysis) {
  const suggestions = [];

  if (analysis.conflictType === 'boundary_violation') {
    suggestions.push('明确表达边界需求和界限');
    suggestions.push('协商互相尊重的边界协议');
  }

  if (analysis.conflictType === 'unmet_need') {
    suggestions.push('识别并清晰表达自己的需要');
    suggestions.push('学习非暴力沟通方式');
  }

  if (analysis.conflictType === 'attachment_trigger') {
    suggestions.push('识别依恋触发点');
    suggestions.push '发展自我安抚能力');
    suggestions.push('与伴侣/朋友讨论依恋需要');
  }

  // 通用建议
  suggestions.push('暂停反应，先理解自己的情绪');
  suggestions.push('使用"我"陈述而非"你"指责');
  suggestions.push('寻求双赢解决方案');

  return suggestions;
}

// ==================== 关系成长干预 ====================

/**
 * 设计关系成长干预方案
 * 
 * @param {object} assessment - 关系性自我评估结果
 * @returns {object} 干预方案
 */
function designRelationalGrowthIntervention(assessment) {
  const intervention = {
    phases: [],
    estimatedDuration: '8-12 周',
    goals: [],
    successMetrics: []
  };

  const { profile, areas_for_growth } = assessment;

  // 阶段 1: 觉察与理解
  intervention.phases.push({
    phase: 1,
    title: '觉察与理解',
    duration: '2-3 周',
    goals: [
      '理解自己的关系模式',
      '识别关系中的触发点',
      '觉察依恋风格的影响'
    ],
    exercises: [
      getRelationalSelfMappingExercise(),
      getAttachmentStyleExploration()
    ]
  });

  // 阶段 2: 技能培养
  intervention.phases.push({
    phase: 2,
    title: '技能培养',
    duration: '3-4 周',
    goals: [
      '学习边界设定技能',
      '培养自主表达能力',
      '练习健康依赖'
    ],
    exercises: [
      getBoundarySettingExercise(),
      getAutonomousExpressionExercise(),
      getHealthyDependenceExercise()
    ]
  });

  // 阶段 3: 实践与整合
  intervention.phases.push({
    phase: 3,
    title: '实践与整合',
    duration: '3-5 周',
    goals: [
      '在真实关系中实践新技能',
      '整合不同的关系身份',
      '建立支持性关系网络'
    ],
    exercises: [
      getRelationshipPracticeExercise(),
      getIntegrativeNarrativeExercise(),
      getSupportNetworkBuilding()
    ]
  });

  intervention.goals = [
    '建立更健康的关系边界',
    '增强关系中的自主性',
    '培养安全依恋模式',
    '整合多重关系身份'
  ];

  intervention.successMetrics = [
    '关系满意度提升',
    '冲突频率降低',
    '自主表达增加',
    '边界维护能力提升'
  ];

  return intervention;
}

// ==================== 练习技术 ====================

/**
 * 关系身份地图绘制练习
 */
function getRelationalSelfMappingExercise() {
  return {
    name: '关系身份地图',
    duration: '30-45 分钟',
    materials: ['大纸', '彩笔', '便利贴'],
    steps: [
      {
        step: 1,
        title: '列出重要关系',
        instruction: '列出所有对你重要的关系 (家人、朋友、伴侣、同事等)',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '评估关系质量',
        instruction: '为每段关系评分 (1-10 分)：亲密度、支持度、满意度',
        duration: '8 分钟'
      },
      {
        step: 3,
        title: '绘制关系位置',
        instruction: '将关系画在纸上，距离中心越近表示越重要',
        duration: '10 分钟'
      },
      {
        step: 4,
        title: '反思身份影响',
        instruction: '思考：每段关系如何塑造你的身份？哪些是滋养的？哪些是消耗的？',
        duration: '10-15 分钟'
      }
    ],
    expectedOutcome: '清晰了解自己的关系网络结构和身份影响'
  };
}

/**
 * 边界设定练习
 */
function getBoundarySettingExercise() {
  return {
    name: '边界设定练习',
    duration: '20-30 分钟',
    steps: [
      {
        step: 1,
        title: '识别边界需求',
        instruction: '思考：在哪些关系中感到边界被侵犯？需要什么类型的边界？',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '边界陈述',
        instruction: '用"我需要..."的句式写下边界需求',
        duration: '5 分钟',
        example: '我需要独处时间来恢复能量'
      },
      {
        step: 3,
        title: '角色扮演',
        instruction: '练习向对方表达边界，可以用镜子或录音',
        duration: '10 分钟'
      },
      {
        step: 4,
        title: '行动计划',
        instruction: '选择一个关系，计划如何表达边界',
        duration: '5 分钟'
      }
    ],
    notes: '边界设定是技能，需要练习。从小边界开始。'
  };
}

/**
 * 自主表达练习
 */
function getAutonomousExpressionExercise() {
  return {
    name: '自主表达练习',
    duration: '15-20 分钟',
    steps: [
      {
        step: 1,
        title: '识别压抑',
        instruction: '回想最近一次没有表达真实想法/感受的情境',
        duration: '3 分钟'
      },
      {
        step: 2,
        title: '探索原因',
        instruction: '问自己：为什么没有表达？害怕什么？',
        duration: '5 分钟'
      },
      {
        step: 3,
        title: '重新表达',
        instruction: '写下你当时想说的话，用"我"陈述',
        duration: '5 分钟'
      },
      {
        step: 4,
        title: '未来计划',
        instruction: '计划下次类似情境如何表达',
        duration: '5 分钟'
      }
    ],
    framework: '自我决定理论 (SDT) - 自主性需要'
  };
}

/**
 * 健康依赖练习
 */
function getHealthyDependenceExercise() {
  return {
    name: '健康依赖练习',
    duration: '20-25 分钟',
    steps: [
      {
        step: 1,
        title: '依赖信念探索',
        instruction: '写下你对"依赖他人"的信念 (如"依赖=软弱")',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '信念挑战',
        instruction: '挑战这些信念：依赖一定是软弱的吗？健康依赖是什么样的？',
        duration: '5 分钟'
      },
      {
        step: 3,
        title: '小请求练习',
        instruction: '列出可以向他人提出的 3 个小请求',
        duration: '5 分钟'
      },
      {
        step: 4,
        title: '实践与反思',
        instruction: '实际提出请求，记录体验和感受',
        duration: '5-10 分钟'
      }
    ],
    notes: '健康依赖是相互的，不是单方面的索取'
  };
}

/**
 * 关系整合叙事练习
 */
function getIntegrativeNarrativeExercise() {
  return {
    name: '关系整合叙事',
    duration: '30-40 分钟',
    steps: [
      {
        step: 1,
        title: '关系时间线',
        instruction: '画出你的关系生命时间线，标记重要关系和转折点',
        duration: '10 分钟'
      },
      {
        step: 2,
        title: '主题识别',
        instruction: '识别时间线中的重复主题和模式',
        duration: '8 分钟'
      },
      {
        step: 3,
        title: '整合叙事',
        instruction: '写一个关于你关系历程的故事，包含挑战和成长',
        duration: '15 分钟'
      },
      {
        step: 4,
        title: '未来展望',
        instruction: '基于这个叙事，你希望未来的关系是什么样的？',
        duration: '5-8 分钟'
      }
    ],
    framework: '叙事心理学 + 生命故事模型'
  };
}

/**
 * 支持网络建设练习
 */
function getSupportNetworkBuilding() {
  return {
    name: '支持网络建设',
    duration: '25-30 分钟',
    steps: [
      {
        step: 1,
        title: '支持类型识别',
        instruction: '列出你需要的支持类型 (情感、实际、信息、陪伴)',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '网络映射',
        instruction: '对于每种支持，列出可以提供的人',
        duration: '8 分钟'
      },
      {
        step: 3,
        title: '缺口分析',
        instruction: '识别支持网络中的缺口',
        duration: '5 分钟'
      },
      {
        step: 4,
        title: '拓展计划',
        instruction: '制定计划填补支持缺口 (加入群体、加深关系等)',
        duration: '8-10 分钟'
      }
    ],
    notes: '支持网络需要主动建设和维护'
  };
}

// ==================== 模块导出 ====================

module.exports = {
  // 常量
  RELATIONAL_SELF_DIMENSIONS,
  RELATIONAL_IDENTITY_TYPES,
  RELATIONAL_DYNAMICS,
  ATTACHMENT_STYLES,
  
  // 核心功能
  assessRelationalSelfDimensions,
  createRelationalIdentityMap,
  analyzeRelationalConflict,
  designRelationalGrowthIntervention,
  
  // 练习技术
  getRelationalSelfMappingExercise,
  getBoundarySettingExercise,
  getAutonomousExpressionExercise,
  getHealthyDependenceExercise,
  getIntegrativeNarrativeExercise,
  getSupportNetworkBuilding,
  
  // 版本信息
  version: '4.6.0',
  theorySource: 'SEP Self-Consciousness + Relational Self Theory'
};
