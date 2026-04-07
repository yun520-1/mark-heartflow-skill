/**
 * 社会认同增强模块 (Social Identity Enhanced)
 * 
 * 理论来源:
 * - Stanford Encyclopedia of Philosophy - Social Identity
 * - Tajfel & Turner 社会认同理论 (Social Identity Theory)
 * - 认同融合理论 (Identity Fusion Theory)
 * - 关系性自我理论 (Relational Self Theory)
 * 
 * 版本：v4.6.0
 * 
 * 核心功能:
 * 1. 社会认同维度评估 (6 维度)
 * 2. 内外群体偏见检测
 * 3. 社会认同威胁识别
 * 4. 认同转换干预
 */

// ==================== 常量定义 ====================

// 社会认同评估 6 维度
const SOCIAL_IDENTITY_DIMENSIONS = {
  IDENTITY_SALIENCE: 'identity_salience',       // 认同显著性
  IDENTITY_FUSION: 'identity_fusion',           // 认同融合
  GROUP_SELF_ESTEEM: 'group_self_esteem',       // 群体自尊
  GROUP_EFFICACY: 'group_efficacy',             // 群体效能
  RELATIONAL_SELF: 'relational_self',           // 关系性自我
  COLLECTIVE_CONTINUITY: 'collective_continuity' // 集体连续性
};

// 社会认同威胁类型
const IDENTITY_THREAT_TYPES = {
  VALUE_THREAT: 'value_threat',               // 价值威胁
  DISTINCTIVENESS_THREAT: 'distinctiveness_threat', // 区分威胁
  CONTINUITY_THREAT: 'continuity_threat',     // 连续性威胁
  AUTHENTICITY_THREAT: 'authenticity_threat', // 真实性威胁
  STATUS_THREAT: 'status_threat',             // 地位威胁
  CATEGORIZATION_THREAT: 'categorization_threat' // 分类威胁
};

// 群体类型
const GROUP_TYPES = {
  PRIMARY: 'primary',         // 初级群体 (家庭、亲密朋友)
  SECONDARY: 'secondary',     // 次级群体 (工作团队、组织)
  SOCIAL_CATEGORY: 'social_category', // 社会类别 (性别、种族、国籍)
  MINORITY: 'minority',       // 少数群体
  MAJORITY: 'majority'        // 多数群体
};

// 认同状态
const IDENTITY_STATUS = {
  ACHIEVED: 'achieved',       // 已达成 (探索后承诺)
  FORECLOSURE: 'foreclosure', // 早闭 (未探索即承诺)
  MORATORIUM: 'moratorium',   // 延缓 (正在探索)
  DIFFUSION: 'diffusion'      // 弥散 (未探索未承诺)
};

// ==================== 社会认同维度评估 ====================

/**
 * 评估社会认同的 6 个维度
 * 
 * @param {object} selfReport - 自我报告数据
 * @param {object} behavioralData - 行为数据 (可选)
 * @returns {object} 社会认同评估结果
 */
function assessSocialIdentityDimensions(selfReport, behavioralData = {}) {
  const result = {
    dimensions: {},
    profile: null,
    strengths: [],
    areas_for_growth: [],
    recommendations: []
  };

  // 1. 认同显著性评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.IDENTITY_SALIENCE] = assessIdentitySalience(selfReport);
  
  // 2. 认同融合评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.IDENTITY_FUSION] = assessIdentityFusion(selfReport);
  
  // 3. 群体自尊评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.GROUP_SELF_ESTEEM] = assessGroupSelfEsteem(selfReport);
  
  // 4. 群体效能评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.GROUP_EFFICACY] = assessGroupEfficacy(selfReport);
  
  // 5. 关系性自我评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.RELATIONAL_SELF] = assessRelationalSelf(selfReport);
  
  // 6. 集体连续性评估
  result.dimensions[SOCIAL_IDENTITY_DIMENSIONS.COLLECTIVE_CONTINUITY] = assessCollectiveContinuity(selfReport);

  // 2. 生成认同画像
  result.profile = generateIdentityProfile(result.dimensions);

  // 3. 识别优势
  result.strengths = Object.entries(result.dimensions)
    .filter(([_, score]) => score >= 0.7)
    .map(([dim, score]) => ({ dimension: dim, score }));

  // 4. 识别成长领域
  result.areas_for_growth = Object.entries(result.dimensions)
    .filter(([_, score]) => score < 0.5)
    .map(([dim, score]) => ({ dimension: dim, score }));

  // 5. 生成建议
  result.recommendations = generateIdentityRecommendations(result.dimensions);

  return result;
}

/**
 * 评估认同显著性
 */
function assessIdentitySalience(selfReport) {
  // 显著性 = 该身份在自我概念中的重要程度
  const questions = [
    '这个身份对你来说有多重要？',
    '你多久想到一次这个身份？',
    '这个身份在多大程度上定义了你是谁？'
  ];
  
  // 简化评分 (实际应基于问卷)
  const importance = selfReport.importance || 0.5;
  const frequency = selfReport.thoughtFrequency || 0.5;
  const definitional = selfReport.definitionalLevel || 0.5;
  
  return (importance + frequency + definitional) / 3;
}

/**
 * 评估认同融合
 */
function assessIdentityFusion(selfReport) {
  // 融合 = 个人身份与群体身份的重叠程度
  const fusionIndicators = [
    selfReport.groupOverSelf,      // 群体利益高于个人
    selfReport.sacrificeWillingness, // 为群体牺牲意愿
    selfReport.agencyOverlap,      // 能动性重叠
    selfReport.relationalTies      // 关系纽带强度
  ];
  
  const validIndicators = fusionIndicators.filter(v => v !== undefined);
  if (validIndicators.length === 0) return 0.5;
  
  return validIndicators.reduce((a, b) => a + b, 0) / validIndicators.length;
}

/**
 * 评估群体自尊
 */
function assessGroupSelfEsteem(selfReport) {
  // 群体自尊 = 从群体成员身份获得的自尊感
  const privateRegard = selfReport.privateRegard || 0.5;  // 对群体的私人评价
  const publicRegard = selfReport.publicRegard || 0.5;    // 感知的他人评价
  
  return (privateRegard + publicRegard) / 2;
}

/**
 * 评估群体效能
 */
function assessGroupEfficacy(selfReport) {
  // 群体效能 = 群体实现目标的能力感
  const collectiveEfficacy = selfReport.collectiveEfficacy || 0.5;
  const goalAchievement = selfReport.goalAchievementHistory || 0.5;
  
  return (collectiveEfficacy + goalAchievement) / 2;
}

/**
 * 评估关系性自我
 */
function assessRelationalSelf(selfReport) {
  // 关系性自我 = 通过关系定义自我的程度
  const inclusionOfOtherInSelf = selfReport.inclusionOfOtherInSelf || 0.5;
  const relationalInterdependence = selfReport.relationalInterdependence || 0.5;
  
  return (inclusionOfOtherInSelf + relationalInterdependence) / 2;
}

/**
 * 评估集体连续性
 */
function assessCollectiveContinuity(selfReport) {
  // 集体连续性 = 群体历史延续性的感知
  const historicalContinuity = selfReport.historicalContinuity || 0.5;
  const futureContinuity = selfReport.futureContinuity || 0.5;
  
  return (historicalContinuity + futureContinuity) / 2;
}

/**
 * 生成认同画像
 */
function generateIdentityProfile(dimensions) {
  const avgScore = Object.values(dimensions).reduce((a, b) => a + b, 0) / Object.keys(dimensions).length;
  
  if (avgScore >= 0.75) {
    return {
      type: 'strong_integrated',
      label: '强整合型',
      description: '具有强烈且整合良好的社会认同，在群体中找到归属感和意义'
    };
  } else if (avgScore >= 0.5) {
    return {
      type: 'moderate',
      label: '中等型',
      description: '社会认同发展中等，某些维度较强，某些维度有待发展'
    };
  } else {
    return {
      type: 'weak_diffuse',
      label: '弱弥散型',
      description: '社会认同较弱或弥散，可能需要探索群体归属和身份意义'
    };
  }
}

/**
 * 生成认同发展建议
 */
function generateIdentityRecommendations(dimensions) {
  const recommendations = [];

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.IDENTITY_SALIENCE] < 0.5) {
    recommendations.push({
      dimension: '认同显著性',
      suggestion: '探索这个身份对你的意义，思考它如何塑造你的价值观和行为',
      exercise: '身份意义反思练习'
    });
  }

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.IDENTITY_FUSION] < 0.5) {
    recommendations.push({
      dimension: '认同融合',
      suggestion: '加强与群体的情感连接，参与群体活动增强归属感',
      exercise: '群体连接练习'
    });
  }

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.GROUP_SELF_ESTEEM] < 0.5) {
    recommendations.push({
      dimension: '群体自尊',
      suggestion: '关注群体的积极特质和成就，培养对群体的自豪感',
      exercise: '群体优势识别'
    });
  }

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.GROUP_EFFICACY] < 0.5) {
    recommendations.push({
      dimension: '群体效能',
      suggestion: '参与群体目标的实现过程，积累成功经验',
      exercise: '集体目标达成计划'
    });
  }

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.RELATIONAL_SELF] < 0.5) {
    recommendations.push({
      dimension: '关系性自我',
      suggestion: '深化与群体成员的关系，建立更强的情感纽带',
      exercise: '关系深化对话'
    });
  }

  if (dimensions[SOCIAL_IDENTITY_DIMENSIONS.COLLECTIVE_CONTINUITY] < 0.5) {
    recommendations.push({
      dimension: '集体连续性',
      suggestion: '了解群体的历史和传统，思考你对群体未来的贡献',
      exercise: '群体历史探索'
    });
  }

  return recommendations;
}

// ==================== 内外群体偏见检测 ====================

/**
 * 检测内外群体偏见
 * 
 * @param {string} statement - 用户陈述
 * @returns {object} 偏见检测结果
 */
function detectIngroupOutgroupBias(statement) {
  const result = {
    hasBias: false,
    biasType: null,
    intensity: 0,
    patterns: [],
    recommendations: []
  };

  // 1. 内外群体语言标记
  const ingroupMarkers = ['我们', '咱们', '自己人', '我们的', '同类'];
  const outgroupMarkers = ['他们', '那些人', '外人', '他们的', '异类'];
  
  const hasIngroup = ingroupMarkers.some(m => statement.includes(m));
  const hasOutgroup = outgroupMarkers.some(m => statement.includes(m));

  // 2. 评价性语言检测
  const positiveIngroup = ['我们优秀', '我们更好', '我们更聪明', '我们更道德'];
  const negativeOutgroup = ['他们差', '他们不好', '他们愚蠢', '他们不道德'];
  
  const hasPositiveIngroup = positiveIngroup.some(p => statement.includes(p));
  const hasNegativeOutgroup = negativeOutgroup.some(n => statement.includes(n));

  // 3. 偏见判定
  if (hasIngroup && hasOutgroup) {
    result.hasBias = true;
    result.biasType = 'categorization';
    result.intensity = 0.3;
    result.patterns.push('内外群体分类');
  }

  if (hasPositiveIngroup || hasNegativeOutgroup) {
    result.hasBias = true;
    result.biasType = 'evaluative';
    result.intensity = Math.min(1.0, result.intensity + 0.4);
    result.patterns.push('评价性偏见');
  }

  // 4. 刻板印象检测
  const stereotypeMarkers = ['都', '总是', '从不', '所有', '每个'];
  const hasStereotype = stereotypeMarkers.some(m => statement.includes(m)) && hasOutgroup;
  
  if (hasStereotype) {
    result.hasBias = true;
    result.biasType = 'stereotyping';
    result.intensity = Math.min(1.0, result.intensity + 0.3);
    result.patterns.push('刻板印象');
  }

  // 5. 建议
  if (result.hasBias) {
    result.recommendations = getBiasReductionRecommendations(result);
  }

  return result;
}

/**
 * 获取偏见减少建议
 */
function getBiasReductionRecommendations(biasResult) {
  const recommendations = [];

  if (biasResult.patterns.includes('内外群体分类')) {
    recommendations.push('意识到内外群体分类的自然倾向，尝试寻找共同点');
  }
  if (biasResult.patterns.includes('评价性偏见')) {
    recommendations.push('检查评价的客观性，避免基于群体身份的过度概括');
  }
  if (biasResult.patterns.includes('刻板印象')) {
    recommendations.push('将个体视为独立的人，而非群体的代表');
  }

  recommendations.push('增加与外群体成员的个体化接触');
  recommendations.push('寻找跨群体的共同身份和共同目标');

  return recommendations;
}

// ==================== 社会认同威胁识别 ====================

/**
 * 识别社会认同威胁
 * 
 * @param {string} situation - 情境描述
 * @returns {object} 威胁识别结果
 */
function identifyIdentityThreat(situation) {
  const result = {
    hasThreat: false,
    threatTypes: [],
    intensity: 0,
    emotionalImpact: [],
    copingStrategies: []
  };

  // 1. 价值威胁检测
  const valueThreatMarkers = ['被看不起', '被贬低', '不被尊重', '价值被质疑', '被否定'];
  if (valueThreatMarkers.some(m => situation.includes(m))) {
    result.threatTypes.push(IDENTITY_THREAT_TYPES.VALUE_THREAT);
    result.hasThreat = true;
    result.emotionalImpact.push('愤怒', '羞耻', '防御');
  }

  // 2. 区分威胁检测
  const distinctivenessThreatMarkers = ['没有特色', '被同化', '失去独特性', '模糊不清'];
  if (distinctivenessThreatMarkers.some(m => situation.includes(m))) {
    result.threatTypes.push(IDENTITY_THREAT_TYPES.DISTINCTIVENESS_THREAT);
    result.hasThreat = true;
    result.emotionalImpact.push('焦虑', '迷失', '困惑');
  }

  // 3. 连续性威胁检测
  const continuityThreatMarkers = ['断裂', '改变太多', '不再是', '传统丢失', '历史被否定'];
  if (continuityThreatMarkers.some(m => situation.includes(m))) {
    result.threatTypes.push(IDENTITY_THREAT_TYPES.CONTINUITY_THREAT);
    result.hasThreat = true;
    result.emotionalImpact.push('悲伤', '失落', '怀念');
  }

  // 4. 真实性威胁检测
  const authenticityThreatMarkers = ['不被承认', '被质疑资格', '假装的', '不够格'];
  if (authenticityThreatMarkers.some(m => situation.includes(m))) {
    result.threatTypes.push(IDENTITY_THREAT_TYPES.AUTHENTICITY_THREAT);
    result.hasThreat = true;
    result.emotionalImpact.push('委屈', '愤怒', '自我怀疑');
  }

  // 5. 强度评估
  result.intensity = result.threatTypes.length * 0.25;

  // 6. 应对策略
  if (result.hasThreat) {
    result.copingStrategies = getIdentityThreatCopingStrategies(result.threatTypes);
  }

  return result;
}

/**
 * 获取认同威胁应对策略
 */
function getIdentityThreatCopingStrategies(threatTypes) {
  const strategies = [];

  if (threatTypes.includes(IDENTITY_THREAT_TYPES.VALUE_THREAT)) {
    strategies.push({
      strategy: '价值重估',
      action: '重新确认群体和个人的内在价值，不依赖外部评价',
      exercise: '价值肯定练习'
    });
  }

  if (threatTypes.includes(IDENTITY_THREAT_TYPES.DISTINCTIVENESS_THREAT)) {
    strategies.push({
      strategy: '独特性强化',
      action: '识别和强化群体的独特特质和贡献',
      exercise: '群体优势地图'
    });
  }

  if (threatTypes.includes(IDENTITY_THREAT_TYPES.CONTINUITY_THREAT)) {
    strategies.push({
      strategy: '连续性重建',
      action: '连接过去、现在和未来，找到延续的线索',
      exercise: '生命故事整合'
    });
  }

  if (threatTypes.includes(IDENTITY_THREAT_TYPES.AUTHENTICITY_THREAT)) {
    strategies.push({
      strategy: '真实性确认',
      action: '确认自己的真实体验和归属感受',
      exercise: '真实性反思'
    });
  }

  // 通用策略
  strategies.push({
    strategy: '社会支持',
    action: '寻求群体内成员的理解和支持',
    exercise: '支持网络激活'
  });

  strategies.push({
    strategy: '认知重构',
    action: '重新解读威胁情境，寻找成长机会',
    exercise: '意义重构对话'
  });

  return strategies;
}

// ==================== 认同转换干预 ====================

/**
 * 提供认同转换干预
 * 
 * @param {string} currentIdentity - 当前认同状态
 * @param {string} desiredIdentity - 期望认同状态
 * @returns {object} 干预方案
 */
function designIdentityTransitionIntervention(currentIdentity, desiredIdentity) {
  const intervention = {
    phases: [],
    estimatedDuration: '',
    successMetrics: [],
    risks: [],
    supportNeeded: []
  };

  // 1. 阶段设计
  intervention.phases = [
    {
      phase: 1,
      title: '解构与觉察',
      duration: '2-4 周',
      goals: [
        '觉察当前认同的局限性',
        '理解认同转换的必要性',
        '处理分离焦虑'
      ],
      exercises: [
        '当前认同评估',
        '认同历史探索',
        '价值观澄清'
      ]
    },
    {
      phase: 2,
      title: '探索与实验',
      duration: '4-8 周',
      goals: [
        '探索新的认同可能性',
        '小范围实验新行为',
        '建立新的社会连接'
      ],
      exercises: [
        '可能自我探索',
        '行为实验日志',
        '榜样学习'
      ]
    },
    {
      phase: 3,
      title: '整合与承诺',
      duration: '4-6 周',
      goals: [
        '整合新旧认同元素',
        '做出认同承诺',
        '公开确认新身份'
      ],
      exercises: [
        '认同整合叙事',
        '承诺仪式',
        '社会宣告'
      ]
    },
    {
      phase: 4,
      title: '巩固与成长',
      duration: '持续',
      goals: [
        '巩固新认同',
        '应对挑战',
        '持续成长'
      ],
      exercises: [
        '定期反思',
        '支持群体参与',
        '成长记录'
      ]
    }
  ];

  intervention.estimatedDuration = '3-6 个月';

  intervention.successMetrics = [
    '新认同的内在一致性感',
    '社会功能改善',
    '主观幸福感提升',
    '关系质量改善'
  ];

  intervention.risks = [
    '认同混乱期延长',
    '社会支持不足',
    '旧认同的拉力',
    '新环境的排斥'
  ];

  intervention.supportNeeded = [
    '心理咨询师支持',
    '同伴支持群体',
    '家人理解',
    '安全探索环境'
  ];

  return intervention;
}

// ==================== 练习技术 ====================

/**
 * 社会认同地图绘制练习 (4 步)
 */
function getSocialIdentityMappingExercise() {
  return {
    name: '社会认同地图绘制',
    duration: '30-45 分钟',
    materials: ['大纸', '彩笔', '便利贴'],
    steps: [
      {
        step: 1,
        title: '识别重要身份',
        instruction: '列出所有对你重要的社会身份 (如：职业、家庭角色、兴趣爱好群体、文化身份等)',
        duration: '5-8 分钟',
        output: '身份清单'
      },
      {
        step: 2,
        title: '评估身份重要性',
        instruction: '为每个身份评分 (1-10 分)，表示它对你的重要程度',
        duration: '5 分钟',
        output: '重要性评分'
      },
      {
        step: 3,
        title: '绘制身份关系',
        instruction: '将身份画在纸上，用距离表示它们之间的关系 (近=和谐，远=冲突)',
        duration: '10-15 分钟',
        output: '身份地图'
      },
      {
        step: 4,
        title: '反思与整合',
        instruction: '观察地图，思考：哪些身份最核心？哪些有冲突？如何整合？',
        duration: '10-15 分钟',
        output: '整合洞察'
      }
    ],
    expectedOutcome: '清晰了解自己的社会认同结构，识别核心身份和潜在冲突'
  };
}

/**
 * 认同威胁应对框架
 */
function getIdentityThreatCopingFramework() {
  return {
    name: '认同威胁应对框架',
    immediateSteps: [
      {
        step: 1,
        action: '情绪觉察',
        instruction: '识别并命名当前的情绪 (愤怒、羞耻、焦虑等)',
        rationale: '情绪命名可以降低情绪强度'
      },
      {
        step: 2,
        action: '威胁识别',
        instruction: '明确是哪种类型的认同威胁 (价值/区分/连续性/真实性)',
        rationale: '准确识别有助于选择应对策略'
      },
      {
        step: 3,
        action: '暂停反应',
        instruction: '在做出反应前暂停，深呼吸，给自己思考空间',
        rationale: '避免冲动反应加剧威胁'
      }
    ],
    shortTermStrategies: [
      '寻求社会支持',
      '自我肯定练习',
      '认知重构',
      '问题聚焦应对'
    ],
    longTermStrategies: [
      '建立多元身份',
      '增强心理弹性',
      '发展支持网络',
      '价值观澄清'
    ]
  };
}

/**
 * 多重认同整合练习
 */
function getMultipleIdentityIntegrationExercise() {
  return {
    name: '多重认同整合练习',
    duration: '20-30 分钟',
    steps: [
      {
        step: 1,
        title: '识别冲突',
        instruction: '选择两个感觉有冲突的身份，描述冲突的具体表现',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '探索共同价值',
        instruction: '找出这两个身份背后的共同价值观或目标',
        duration: '5-8 分钟'
      },
      {
        step: 3,
        title: '寻找整合方式',
        instruction: '思考如何同时表达这两个身份，而非二选一',
        duration: '8-10 分钟'
      },
      {
        step: 4,
        title: '制定整合行动',
        instruction: '设计一个具体的行动，同时体现这两个身份',
        duration: '5-7 分钟'
      }
    ],
    example: {
      conflict: '职业身份 (竞争性) vs 家庭身份 ( nurturing)',
      commonValue: '成长与关怀',
      integration: '在工作中 mentor 新人，既发挥专业又体现关怀'
    }
  };
}

// ==================== 模块导出 ====================

module.exports = {
  // 常量
  SOCIAL_IDENTITY_DIMENSIONS,
  IDENTITY_THREAT_TYPES,
  GROUP_TYPES,
  IDENTITY_STATUS,
  
  // 核心功能
  assessSocialIdentityDimensions,
  detectIngroupOutgroupBias,
  identifyIdentityThreat,
  designIdentityTransitionIntervention,
  
  // 练习技术
  getSocialIdentityMappingExercise,
  getIdentityThreatCopingFramework,
  getMultipleIdentityIntegrationExercise,
  
  // 版本信息
  version: '4.6.0',
  theorySource: 'SEP Social Identity + Tajfel & Turner SIT'
};
