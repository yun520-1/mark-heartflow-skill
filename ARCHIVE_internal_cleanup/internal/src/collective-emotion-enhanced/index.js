/**
 * 集体情绪增强模块 (Collective Emotion Enhanced)
 * 
 * 理论来源:
 * - Stanford Encyclopedia of Philosophy - Collective Emotion
 * - Durkheim 集体欢腾理论 (Collective Effervescence)
 * - Scheler 共情现象学
 * - Walther 共享体验理论
 * - Von Scheve & Salmela 集体情绪理论
 * 
 * 版本：v4.6.0
 * 
 * 核心功能:
 * 1. 集体情绪识别 (5 类型)
 * 2. 集体情绪强度评估
 * 3. 集体情绪效价分析
 * 4. 集体情绪干预策略
 */

// ==================== 常量定义 ====================

// 集体情绪 5 类型
const COLLECTIVE_EMOTION_TYPES = {
  EMOTIONAL_CONTAGION: 'emotional_contagion',   // 情绪感染
  EMPATHIC_EMOTION: 'empathic_emotion',         // 共情情绪
  SHARED_EMOTION: 'shared_emotion',             // 共享情绪
  COLLECTIVE_EMOTION: 'collective_emotion',     // 集体情绪
  GROUP_CLIMATE: 'group_climate'                // 群体情绪氛围
};

// 集体情绪形成机制
const FORMATION_MECHANISMS = {
  MIMICRY: 'mimicry',               // 模仿
  SYNCHRONIZATION: 'synchronization', // 同步
  APPRAISAL: 'appraisal',           // 评价
  SOCIAL_APPRAISAL: 'social_appraisal', // 社会评价
  NORMATIVE: 'normative',           // 规范性
  RELATIONAL: 'relational'          // 关系性
};

// 集体情绪功能
const COLLECTIVE_EMOTION_FUNCTIONS = {
  SOCIAL_BONDING: 'social_bonding',       // 社会连接
  COORDINATION: 'coordination',           // 协调行动
  MEANING_MAKING: 'meaning_making',       // 意义建构
  IDENTITY_REINFORCEMENT: 'identity_reinforcement', // 认同强化
  MOTIVATION: 'motivation'                // 动机激发
};

// 情绪效价
const EMOTION_VALENCE = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  MIXED: 'mixed',
  NEUTRAL: 'neutral'
};

// 情绪唤醒度
const AROUSAL_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// ==================== 集体情绪识别 ====================

/**
 * 识别集体情绪类型
 * 
 * @param {string} situation - 情境描述
 * @param {object} groupContext - 群体情境信息
 * @returns {object} 集体情绪识别结果
 */
function identifyCollectiveEmotionType(situation, groupContext = {}) {
  const result = {
    type: null,
    confidence: 0,
    mechanism: null,
    characteristics: [],
    analysis: ''
  };

  // 1. 情绪感染检测
  const contagionMarkers = ['大家都', '所有人都', '不自觉地', '传染', '感染', '氛围'];
  const hasContagion = contagionMarkers.some(m => situation.includes(m));
  
  if (hasContagion) {
    result.type = COLLECTIVE_EMOTION_TYPES.EMOTIONAL_CONTAGION;
    result.mechanism = FORMATION_MECHANISMS.MIMICRY;
    result.confidence = 0.7;
    result.characteristics = [
      '自动性',
      '无意识模仿',
      '快速传播',
      '生理同步'
    ];
  }

  // 2. 共情情绪检测
  const empathicMarkers = ['感受到他的', '理解他的心情', '为他感到', '感同身受'];
  const hasEmpathy = empathicMarkers.some(m => situation.includes(m));
  
  if (hasEmpathy && !hasContagion) {
    result.type = COLLECTIVE_EMOTION_TYPES.EMPATHIC_EMOTION;
    result.mechanism = FORMATION_MECHANISMS.RELATIONAL;
    result.confidence = 0.75;
    result.characteristics = [
      '视角采择',
      '情感理解',
      '关心他人',
      '有意识'
    ];
  }

  // 3. 共享情绪检测
  const sharedMarkers = ['我们一起', '共同感受', '都经历', '同样的'];
  const hasShared = sharedMarkers.some(m => situation.includes(m));
  
  if (hasShared) {
    result.type = COLLECTIVE_EMOTION_TYPES.SHARED_EMOTION;
    result.mechanism = FORMATION_MECHANISMS.APPRAISAL;
    result.confidence = 0.8;
    result.characteristics = [
      '共同情境',
      '相似评价',
      '相互意识',
      '情感共鸣'
    ];
  }

  // 4. 集体情绪检测
  const collectiveMarkers = ['作为团队', '我们群体', '集体的', '共同的感受'];
  const hasCollective = collectiveMarkers.some(m => situation.includes(m));
  
  if (hasCollective && groupContext.groupIdentity) {
    result.type = COLLECTIVE_EMOTION_TYPES.COLLECTIVE_EMOTION;
    result.mechanism = FORMATION_MECHANISMS.NORMATIVE;
    result.confidence = 0.85;
    result.characteristics = [
      '群体层面',
      '集体意向性',
      '规范性期待',
      '身份相关'
    ];
  }

  // 5. 群体情绪氛围检测
  const climateMarkers = ['氛围', '气氛', '基调', '整体感觉'];
  const hasClimate = climateMarkers.some(m => situation.includes(m));
  
  if (hasClimate) {
    result.type = COLLECTIVE_EMOTION_TYPES.GROUP_CLIMATE;
    result.mechanism = FORMATION_MECHANISMS.SOCIAL_APPRAISAL;
    result.confidence = 0.7;
    result.characteristics = [
      '持续性',
      '弥漫性',
      '背景性',
      '影响个体'
    ];
  }

  // 分析
  if (result.type) {
    result.analysis = generateEmotionTypeAnalysis(result);
  }

  return result;
}

/**
 * 生成情绪类型分析
 */
function generateEmotionTypeAnalysis(result) {
  const analyses = {
    [COLLECTIVE_EMOTION_TYPES.EMOTIONAL_CONTAGION]: 
      '检测到情绪感染。这是一种自动的、无意识的情绪传播过程，通过面部表情、声音、姿势的模仿实现。',
    [COLLECTIVE_EMOTION_TYPES.EMPATHIC_EMOTION]: 
      '检测到共情情绪。这是通过理解他人处境而产生的情绪反应，需要有意识的视角采择。',
    [COLLECTIVE_EMOTION_TYPES.SHARED_EMOTION]: 
      '检测到共享情绪。多人因共同情境而产生相似情绪，并意识到彼此的情感状态。',
    [COLLECTIVE_EMOTION_TYPES.COLLECTIVE_EMOTION]: 
      '检测到集体情绪。这是群体层面的情绪，与群体身份和集体目标相关，具有规范性特征。',
    [COLLECTIVE_EMOTION_TYPES.GROUP_CLIMATE]: 
      '检测到群体情绪氛围。这是一种持续的、弥漫性的情绪基调，影响群体成员的情感体验。'
  };
  
  return analyses[result.type] || '无法确定集体情绪类型';
}

// ==================== 集体情绪强度评估 ====================

/**
 * 评估集体情绪强度
 * 
 * @param {object} emotionData - 情绪数据
 * @returns {object} 强度评估结果
 */
function assessCollectiveEmotionIntensity(emotionData) {
  const result = {
    overall: 0,
    dimensions: {},
    level: 'medium',
    factors: []
  };

  // 1. 参与度 (多少人参与)
  const participation = emotionData.participationRate || 0.5;
  result.dimensions.participation = participation;

  // 2. 同步性 (情绪表达的一致性)
  const synchrony = emotionData.emotionalSynchrony || 0.5;
  result.dimensions.synchrony = synchrony;

  // 3. 强度 (个体情绪强度)
  const intensity = emotionData.individualIntensity || 0.5;
  result.dimensions.intensity = intensity;

  // 4. 持续性 (情绪持续时间)
  const duration = emotionData.duration || 0.5;
  result.dimensions.duration = duration;

  // 5. 计算总体强度
  result.overall = (participation + synchrony + intensity + duration) / 4;

  // 6. 强度水平判定
  if (result.overall >= 0.75) {
    result.level = 'high';
    result.factors = ['高度参与', '强同步性', '情绪强烈', '持续稳定'];
  } else if (result.overall >= 0.5) {
    result.level = 'medium';
    result.factors = ['中等参与', '部分同步', '情绪适中'];
  } else {
    result.level = 'low';
    result.factors = ['参与不足', '同步性低', '情绪微弱'];
  }

  return result;
}

// ==================== 集体情绪效价分析 ====================

/**
 * 分析集体情绪的效价
 * 
 * @param {string} emotionDescription - 情绪描述
 * @returns {object} 效价分析结果
 */
function analyzeEmotionValence(emotionDescription) {
  const result = {
    valence: EMOTION_VALENCE.NEUTRAL,
    arousal: AROUSAL_LEVEL.MEDIUM,
    specificEmotions: [],
    functionalImpact: []
  };

  // 1. 积极情绪词
  const positiveEmotions = ['快乐', '兴奋', '自豪', '感激', '希望', '爱', '喜悦', '满足', '热情'];
  const positiveCount = positiveEmotions.filter(e => emotionDescription.includes(e)).length;

  // 2. 消极情绪词
  const negativeEmotions = ['悲伤', '愤怒', '恐惧', '焦虑', '羞愧', '内疚', '绝望', '厌恶', '沮丧'];
  const negativeCount = negativeEmotions.filter(e => emotionDescription.includes(e)).length;

  // 3. 效价判定
  if (positiveCount > 0 && negativeCount === 0) {
    result.valence = EMOTION_VALENCE.POSITIVE;
  } else if (negativeCount > 0 && positiveCount === 0) {
    result.valence = EMOTION_VALENCE.NEGATIVE;
  } else if (positiveCount > 0 && negativeCount > 0) {
    result.valence = EMOTION_VALENCE.MIXED;
  }

  // 4. 唤醒度评估
  const highArousalMarkers = ['激动', '强烈', '激烈', '爆发', '高涨'];
  const lowArousalMarkers = ['平静', '温和', '低沉', '缓慢', '平和'];
  
  if (highArousalMarkers.some(m => emotionDescription.includes(m))) {
    result.arousal = AROUSAL_LEVEL.HIGH;
  } else if (lowArousalMarkers.some(m => emotionDescription.includes(m))) {
    result.arousal = AROUSAL_LEVEL.LOW;
  }

  // 5. 具体情绪识别
  const allEmotions = [...positiveEmotions, ...negativeEmotions];
  result.specificEmotions = allEmotions.filter(e => emotionDescription.includes(e));

  // 6. 功能影响
  result.functionalImpact = getFunctionalImpact(result.valence, result.arousal);

  return result;
}

/**
 * 获取功能影响
 */
function getFunctionalImpact(valence, arousal) {
  const impacts = [];

  if (valence === EMOTION_VALENCE.POSITIVE) {
    impacts.push('增强群体凝聚力');
    impacts.push('促进合作行为');
    impacts.push('提升创造力');
    if (arousal === AROUSAL_LEVEL.HIGH) {
      impacts.push('激发行动动机');
    }
  }

  if (valence === EMOTION_VALENCE.NEGATIVE) {
    impacts.push('可能威胁群体稳定');
    impacts.push('需要情绪调节');
    if (arousal === AROUSAL_LEVEL.HIGH) {
      impacts.push('可能导致冲突');
      impacts.push('需要立即干预');
    } else {
      impacts.push('可能导致疏离');
    }
  }

  if (valence === EMOTION_VALENCE.MIXED) {
    impacts.push('情绪复杂，需要细致理解');
    impacts.push('可能存在内在冲突');
  }

  return impacts;
}

// ==================== 集体情绪干预策略 ====================

/**
 * 生成集体情绪干预策略
 * 
 * @param {object} emotionAssessment - 情绪评估结果
 * @returns {object} 干预策略
 */
function generateCollectiveEmotionIntervention(emotionAssessment) {
  const intervention = {
    type: null,
    goals: [],
    strategies: [],
    exercises: [],
    precautions: []
  };

  const { valence, arousal, level } = emotionAssessment;

  // 1. 积极高唤醒情绪 (如兴奋、热情)
  if (valence === EMOTION_VALENCE.POSITIVE && arousal === AROUSAL_LEVEL.HIGH) {
    intervention.type = 'channel_and_sustain';
    intervention.goals = [
      '保持积极情绪',
      '将能量导向建设性行动',
      '避免情绪耗尽'
    ];
    intervention.strategies = [
      '目标导向行动',
      '集体庆祝仪式',
      '能量管理'
    ];
    intervention.exercises = [
      getCollectiveCelebrationExercise(),
      getEnergyChannelingExercise()
    ];
    intervention.precautions = [
      '避免过度兴奋导致决策失误',
      '注意情绪可持续性'
    ];
  }

  // 2. 积极低唤醒情绪 (如平静、满足)
  else if (valence === EMOTION_VALENCE.POSITIVE && arousal === AROUSAL_LEVEL.LOW) {
    intervention.type = 'deepen_and_appreciate';
    intervention.goals = [
      '深化平静体验',
      '培养感恩和欣赏',
      '整合积极体验'
    ];
    intervention.strategies = [
      '正念品味',
      '感恩分享',
      '意义反思'
    ];
    intervention.exercises = [
      getCollectiveMindfulnessExercise(),
      getGratitudeSharingExercise()
    ];
  }

  // 3. 消极高唤醒情绪 (如愤怒、焦虑)
  else if (valence === EMOTION_VALENCE.NEGATIVE && arousal === AROUSAL_LEVEL.HIGH) {
    intervention.type = 'regulate_and_transform';
    intervention.goals = [
      '降低情绪强度',
      '建设性表达情绪',
      '转化情绪能量'
    ];
    intervention.strategies = [
      '共同调节',
      '情绪命名与验证',
      '问题导向行动'
    ];
    intervention.exercises = [
      getCollectiveRegulationExercise(),
      getConstructiveExpressionExercise()
    ];
    intervention.precautions = [
      '避免压抑情绪',
      '防止情绪升级',
      '需要专业支持时及时寻求'
    ];
  }

  // 4. 消极低唤醒情绪 (如悲伤、沮丧)
  else if (valence === EMOTION_VALENCE.NEGATIVE && arousal === AROUSAL_LEVEL.LOW) {
    intervention.type = 'support_and_revitalize';
    intervention.goals = [
      '提供社会支持',
      '逐步恢复活力',
      '寻找意义和希望'
    ];
    intervention.strategies = [
      '陪伴与支持',
      '小步行动',
      '意义重构'
    ];
    intervention.exercises = [
      getSupportCircleExercise(),
      getMeaningReconstructionExercise()
    ];
  }

  // 5. 混合情绪
  else if (valence === EMOTION_VALENCE.MIXED) {
    intervention.type = 'integrate_and_balance';
    intervention.goals = [
      '接纳情绪复杂性',
      '整合矛盾情感',
      '找到平衡点'
    ];
    intervention.strategies = [
      '情绪分化',
      '辩证思考',
      '整合叙事'
    ];
    intervention.exercises = [
      getEmotionDifferentiationExercise(),
      getIntegrativeNarrativeExercise()
    ];
  }

  return intervention;
}

// ==================== 练习技术 ====================

/**
 * 集体庆祝练习
 */
function getCollectiveCelebrationExercise() {
  return {
    name: '集体庆祝仪式',
    duration: '15-30 分钟',
    purpose: '强化积极情绪，增强群体凝聚力',
    steps: [
      {
        step: 1,
        title: '成就回顾',
        instruction: '轮流分享群体最近取得的成就或进步',
        duration: '5-8 分钟'
      },
      {
        step: 2,
        title: '情感表达',
        instruction: '表达对成就的积极情绪 (自豪、喜悦、感激)',
        duration: '5 分钟'
      },
      {
        step: 3,
        title: '庆祝仪式',
        instruction: '进行一个简单的庆祝仪式 (鼓掌、欢呼、拥抱等)',
        duration: '3-5 分钟'
      },
      {
        step: 4,
        title: '意义连接',
        instruction: '分享这个成就对群体和个人的意义',
        duration: '5-8 分钟'
      }
    ],
    notes: '庆祝仪式应真诚、自然，避免流于形式'
  };
}

/**
 * 集体调节练习
 */
function getCollectiveRegulationExercise() {
  return {
    name: '集体情绪调节练习',
    duration: '10-15 分钟',
    purpose: '共同调节高唤醒消极情绪',
    steps: [
      {
        step: 1,
        title: '共同呼吸',
        instruction: '所有人同步进行深呼吸 (吸气 4 秒，屏息 2 秒，呼气 6 秒)',
        duration: '3 分钟'
      },
      {
        step: 2,
        title: '情绪命名',
        instruction: '每人用一个词描述当前的情绪，不加评判',
        duration: '3-5 分钟'
      },
      {
        step: 3,
        title: '身体觉察',
        instruction: '注意情绪在身体中的感受，不做改变',
        duration: '3 分钟'
      },
      {
        step: 4,
        title: '共同意图',
        instruction: '共同设定一个调节意图 (如"我们一起平静下来")',
        duration: '2 分钟'
      }
    ],
    notes: '重点是共同体验，而非消除情绪'
  };
}

/**
 * 感恩分享练习
 */
function getGratitudeSharingExercise() {
  return {
    name: '感恩分享圈',
    duration: '15-20 分钟',
    purpose: '培养感恩情绪，增强群体连接',
    steps: [
      {
        step: 1,
        title: '个人反思',
        instruction: '静默思考：你感激群体中的什么？感激其他成员的什么？',
        duration: '3 分钟'
      },
      {
        step: 2,
        title: '轮流分享',
        instruction: '每人分享 1-2 件感激的事，其他成员倾听',
        duration: '10-15 分钟'
      },
      {
        step: 3,
        title: '接收与回应',
        instruction: '被感谢的成员简单回应 ("谢谢你看到")',
        duration: '2-3 分钟'
      }
    ],
    notes: '营造安全、真诚的氛围，不强迫分享'
  };
}

/**
 * 支持圈练习
 */
function getSupportCircleExercise() {
  return {
    name: '支持圈',
    duration: '20-30 分钟',
    purpose: '为经历困难的成员提供集体支持',
    steps: [
      {
        step: 1,
        title: '开场',
        intention: '设定支持、保密、不评判的基调',
        duration: '2 分钟'
      },
      {
        step: 2,
        title: '分享困难',
        instruction: '需要支持的成员分享自己的处境和感受',
        duration: '5-8 分钟'
      },
      {
        step: 3,
        title: '共情回应',
        instruction: '其他成员表达理解和共情 (非建议)',
        duration: '8-10 分钟'
      },
      {
        step: 4,
        title: '支持提供',
        instruction: '询问需要什么支持，成员提供具体帮助',
        duration: '5-8 分钟'
      }
    ],
    notes: '重点是陪伴和理解，而非解决问题'
  };
}

/**
 * 意义重构练习
 */
function getMeaningReconstructionExercise() {
  return {
    name: '集体意义重构',
    duration: '25-35 分钟',
    purpose: '从困难经历中寻找意义和成长',
    steps: [
      {
        step: 1,
        title: '经历描述',
        instruction: '描述群体经历的困难或挑战',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '影响探索',
        instruction: '探索这段经历对群体的影响 (积极和消极)',
        duration: '8 分钟'
      },
      {
        step: 3,
        title: '意义发现',
        instruction: '寻找这段经历带来的意义、学习或成长',
        duration: '8 分钟'
      },
      {
        step: 4,
        title: '未来导向',
        instruction: '基于新的理解，讨论群体未来的方向',
        duration: '5-8 分钟'
      }
    ],
    framework: '创伤后成长理论 (Post-Traumatic Growth)'
  };
}

/**
 * 情绪分化练习
 */
function getEmotionDifferentiationExercise() {
  return {
    name: '情绪分化练习',
    duration: '15-20 分钟',
    purpose: '区分和命名复杂情绪',
    steps: [
      {
        step: 1,
        title: '情绪清单',
        instruction: '列出当前体验到的所有情绪，不评判',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '情绪分类',
        instruction: '将情绪分类 (如：关于过去的/关于未来的，关于自己的/关于他人的)',
        duration: '5 分钟'
      },
      {
        step: 3,
        title: '情绪关系',
        instruction: '探索不同情绪之间的关系 (如：愤怒下可能有悲伤)',
        duration: '5 分钟'
      },
      {
        step: 4,
        title: '整合理解',
        instruction: '形成对复杂情绪的整体理解',
        duration: '3-5 分钟'
      }
    ],
    notes: '情绪分化本身就有调节作用'
  };
}

/**
 * 整合叙事练习
 */
function getIntegrativeNarrativeExercise() {
  return {
    name: '整合叙事练习',
    duration: '20-30 分钟',
    purpose: '将矛盾情感整合为连贯叙事',
    steps: [
      {
        step: 1,
        title: '对立面识别',
        instruction: '识别体验中的对立面 (如：希望/失望，爱/愤怒)',
        duration: '5 分钟'
      },
      {
        step: 2,
        title: '两者皆真',
        instruction: '承认对立面可以同时为真，不急于解决矛盾',
        duration: '5 分钟'
      },
      {
        step: 3,
        title: '整合叙事',
        instruction: '尝试将矛盾情感编织成一个更丰富的故事',
        duration: '8-10 分钟'
      },
      {
        step: 4,
        title: '分享与见证',
        instruction: '分享叙事，其他成员作为见证者',
        duration: '5 分钟'
      }
    ],
    framework: '辩证思维 + 叙事心理学'
  };
}

// ==================== 模块导出 ====================

module.exports = {
  // 常量
  COLLECTIVE_EMOTION_TYPES,
  FORMATION_MECHANISMS,
  COLLECTIVE_EMOTION_FUNCTIONS,
  EMOTION_VALENCE,
  AROUSAL_LEVEL,
  
  // 核心功能
  identifyCollectiveEmotionType,
  assessCollectiveEmotionIntensity,
  analyzeEmotionValence,
  generateCollectiveEmotionIntervention,
  
  // 练习技术
  getCollectiveCelebrationExercise,
  getCollectiveRegulationExercise,
  getGratitudeSharingExercise,
  getSupportCircleExercise,
  getMeaningReconstructionExercise,
  getEmotionDifferentiationExercise,
  getIntegrativeNarrativeExercise,
  
  // 版本信息
  version: '4.6.0',
  theorySource: 'SEP Collective Emotion + Durkheim + Scheler'
};
