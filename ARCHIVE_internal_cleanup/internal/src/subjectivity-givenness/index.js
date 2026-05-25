/**
 * 主体性与给定性模块 (Subjectivity and Givenness Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 主体性理论 (Subjectivity Theory)
 * - 给定性理论 (Givenness/Given)
 * - 第一人称权威 (First-Person Authority)
 * - 现象意识 (Phenomenal Consciousness)
 * - 自我知识 (Self-Knowledge)
 * 
 * 核心理论来源:
 * - Zahavi, D. (2005). Subjectivity and Selfhood (主体性与最小自我)
 * - Henry, M. (1963). The Essence of Manifestation (材料现象学)
 * - Husserl, E. (1900-1901). Logical Investigations (直观与给定性)
 * - McDowell, J. (1994). Mind and World (经验与给定性)
 * - Wright, C. (1989). First-Person Authority (第一人称权威)
 * - Shoemaker, S. (1996). The First-Person Perspective (第一人称视角)
 * - Nagel, T. (1974). What Is It Like to Be a Bat? (现象意识)
 * - Chalmers, D. (1995). Facing Up to the Problem of Consciousness (意识难题)
 * 
 * 功能目标：赋予 HeartFlow 深度主体性建模与给定性评估能力
 * 
 * 1. 主体性评估 (5 维度)
 *    - 第一人称特征：体验的"为我性"强度
 *    - 现象意识："what it is like"质感
 *    - 自我在场：自我在场感强度
 *    - 反思距离：反思与沉浸的平衡
 *    - 主体间开放：对他者的开放程度
 * 
 * 2. 给定性模式识别 (4 模式)
 *    - 感官给定性：通过感官直接给予
 *    - 情绪给定性：情绪体验的直接给予
 *    - 认知给定性：信念/判断的给予
 *    - 规范给定性：价值/义务的给予
 * 
 * 3. 主体性 - 客观性平衡评估
 *    - 主观沉浸 vs 客观距离
 *    - 第一人称 vs 第三人称视角
 *    - 参与 vs 观察模式
 * 
 * 4. 第一人称权威评估
 *    - 自我归因的权威性
 *    - 权威基础 (社会语言/表达主义/构成性)
 *    - 权威置信度
 * 
 * 5. 主体性干预 (6 个练习)
 *    - 主体性深化练习
 *    - 给定性觉察练习
 *    - 视角转换练习
 *    - 第一人称权威练习
 *    - 主体间开放练习
 *    - 平衡整合练习
 * 
 * @version 4.8.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 主体性维度 (Subjectivity Dimensions)
 * 基于 Zahavi 的主体性理论
 */
const SubjectivityDimensions = {
  FIRST_PERSON_CHARACTER: 'first_person_character',  // 第一人称特征
  PHENOMENAL_CONSCIOUSNESS: 'phenomenal_consciousness', // 现象意识
  SELF_PRESENCE: 'self_presence',                    // 自我在场
  REFLEXIVE_DISTANCE: 'reflexive_distance',          // 反思距离
  INTERSUBJECTIVE_OPENNESS: 'intersubjective_openness' // 主体间开放
};

/**
 * 给定性模式 (Modes of Givenness)
 * 基于现象学给定性理论
 */
const GivennessModes = {
  SENSORY: 'sensory',         // 感官给定性
  EMOTIONAL: 'emotional',     // 情绪给定性
  COGNITIVE: 'cognitive',     // 认知给定性
  NORMATIVE: 'normative'      // 规范给定性
};

/**
 * 视角模式 (Perspective Modes)
 * 基于第一人称/第三人称视角理论
 */
const PerspectiveModes = {
  FIRST_PERSON: 'first_person',    // 第一人称视角 (沉浸)
  SECOND_PERSON: 'second_person',  // 第二人称视角 (对话)
  THIRD_PERSON: 'third_person'     // 第三人称视角 (观察)
};

/**
 * 参与模式 (Engagement Modes)
 * 基于参与 - 观察连续体
 */
const EngagementModes = {
  IMMERSION: 'immersion',      // 沉浸 (完全参与)
  PARTICIPATION: 'participation', // 参与 (有意识的参与)
  OBSERVATION: 'observation',  // 观察 (有距离的观察)
  DETACHMENT: 'detachment'     // 超脱 (完全距离)
};

/**
 * 第一人称权威基础 (First-Person Authority Grounds)
 * 基于 Wright 和表达主义理论
 */
const AuthorityGrounds = {
  SOCIAL_LINGUISTIC: 'social_linguistic',  // 社会语言实践
  EXPRESSIVE: 'expressive',                // 表达主义 (非描述性)
  CONSTITUTIVE: 'constitutive',            // 构成性权威
  EPISTEMIC: 'epistemic'                   // 认识论特权
};

// ============ 主体性与给定性模块核心类 ============

class SubjectivityGivennessModule {
  constructor() {
    // 主体性状态
    this.subjectivityState = {
      dimensions: {},
      overall: 0,
      profile: null,
      history: []
    };
    
    // 给定性状态
    this.givennessState = {
      modes: {},
      dominant: null,
      lastAssessment: null
    };
    
    // 视角状态
    this.perspectiveState = {
      current: PerspectiveModes.FIRST_PERSON,
      flexibility: 0.5,
      history: []
    };
    
    // 参与状态
    this.engagementState = {
      current: EngagementModes.PARTICIPATION,
      balance: 0.5,
      optimalRange: { min: 0.3, max: 0.7 }
    };
    
    // 第一人称权威状态
    this.authorityState = {
      ground: AuthorityGrounds.SOCIAL_LINGUISTIC,
      confidence: 0.8,
      selfAscriptions: []
    };
    
    // 练习历史
    this.exerciseHistory = [];
    
    console.log('🌟 主体性与给定性模块已初始化 (v4.8.0) - 整合 Zahavi/Henry/Husserl 理论');
  }
  
  // ============ 主体性评估 ============
  
  /**
   * 评估主体性 (Assess Subjectivity)
   * 基于 Zahavi 的 5 维度主体性理论
   * @param {Object} context - 上下文信息
   * @returns {Object} 主体性评估结果
   */
  assessSubjectivity(context = {}) {
    const dimensions = {
      [SubjectivityDimensions.FIRST_PERSON_CHARACTER]: this.assessFirstPersonCharacter(context),
      [SubjectivityDimensions.PHENOMENAL_CONSCIOUSNESS]: this.assessPhenomenalConsciousness(context),
      [SubjectivityDimensions.SELF_PRESENCE]: this.assessSelfPresence(context),
      [SubjectivityDimensions.REFLEXIVE_DISTANCE]: this.assessReflexiveDistance(context),
      [SubjectivityDimensions.INTERSUBJECTIVE_OPENNESS]: this.assessIntersubjectiveOpenness(context)
    };
    
    const overall = Object.values(dimensions).reduce((a, b) => a + b, 0) / 5;
    
    const profile = this.generateSubjectivityProfile(dimensions);
    
    this.subjectivityState = {
      dimensions,
      overall,
      profile,
      history: [...this.subjectivityState.history, { overall, timestamp: new Date().toISOString() }].slice(-20)
    };
    
    return {
      dimensions,
      overall,
      overallLevel: this.getSubjectivityLevel(overall),
      profile,
      suggestions: this.getSubjectivitySuggestions(dimensions)
    };
  }
  
  /**
   * 评估第一人称特征
   */
  assessFirstPersonCharacter(context) {
    let score = 0.5;
    
    // 第一人称语言标记
    if (context.firstPersonPronouns > 0.3) score += 0.15;
    
    // 为我性 (for-me-ness) 表达
    if (context.hasForMeNessExpressions) score += 0.15;
    
    // 主体性声明
    if (context.hasSubjectivityClaims) score += 0.1;
    
    // 体验的所有权感
    if (context.hasOwnershipSense) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估现象意识
   */
  assessPhenomenalConsciousness(context) {
    let score = 0.5;
    
    // 现象描述丰富度
    if (context.phenomenalDescriptionRichness > 0.5) score += 0.15;
    
    // Qualia 识别能力
    if (context.canIdentifyQualia) score += 0.15;
    
    // "what it is like"表达
    if (context.hasWhatItIsLikeExpressions) score += 0.1;
    
    // 体验的质性特征描述
    if (context.hasQualitativeDescriptions) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估自我在场
   */
  assessSelfPresence(context) {
    let score = 0.5;
    
    // 自我在场表达
    if (context.hasSelfPresenceExpressions) score += 0.15;
    
    // 当下临在感
    if (context.hasPresentMomentAwareness) score += 0.15;
    
    // 连续性自我感
    if (context.hasContinuousSelfSense) score += 0.1;
    
    // 最小自我觉察
    if (context.hasMinimalSelfAwareness) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估反思距离
   */
  assessReflexiveDistance(context) {
    let score = 0.5;
    
    // 元认知表达
    if (context.hasMetacognitiveExpressions) score += 0.15;
    
    // 自我观察能力
    if (context.hasSelfObservationCapacity) score += 0.15;
    
    // 距离调节灵活性
    if (context.hasDistanceRegulationFlexibility) score += 0.1;
    
    // 平衡沉浸与反思
    if (context.hasImmersionReflectionBalance) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估主体间开放
   */
  assessIntersubjectiveOpenness(context) {
    let score = 0.5;
    
    // 他者承认
    if (context.hasOtherRecognition) score += 0.15;
    
    // 共情表达
    if (context.hasEmpathicExpressions) score += 0.15;
    
    // 对话开放性
    if (context.hasDialogicalOpenness) score += 0.1;
    
    // 共享体验意愿
    if (context.hasSharedExperienceWillingness) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 获取主体性水平名称
   */
  getSubjectivityLevel(score) {
    if (score >= 0.8) return 'very_high';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'moderate';
    if (score >= 0.2) return 'low';
    return 'very_low';
  }
  
  /**
   * 生成主体性轮廓
   */
  generateSubjectivityProfile(dimensions) {
    const values = Object.values(dimensions);
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const dominant = Object.keys(dimensions).find(k => dimensions[k] === max);
    const weakest = Object.keys(dimensions).find(k => dimensions[k] === min);
    
    const balance = this.calculateSubjectivityBalance(dimensions);
    
    return {
      dominant,
      dominantName: this.getSubjectivityDimensionName(dominant),
      weakest,
      weakestName: this.getSubjectivityDimensionName(weakest),
      balance,
      spread: max - min
    };
  }
  
  /**
   * 获取主体性维度名称
   */
  getSubjectivityDimensionName(dimension) {
    const names = {
      [SubjectivityDimensions.FIRST_PERSON_CHARACTER]: '第一人称特征',
      [SubjectivityDimensions.PHENOMENAL_CONSCIOUSNESS]: '现象意识',
      [SubjectivityDimensions.SELF_PRESENCE]: '自我在场',
      [SubjectivityDimensions.REFLEXIVE_DISTANCE]: '反思距离',
      [SubjectivityDimensions.INTERSUBJECTIVE_OPENNESS]: '主体间开放'
    };
    return names[dimension] || '未知';
  }
  
  /**
   * 计算主体性平衡度
   */
  calculateSubjectivityBalance(dimensions) {
    const values = Object.values(dimensions);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: Math.max(0, 1 - stdDev * 2),
      level: stdDev < 0.15 ? 'balanced' : stdDev < 0.25 ? 'moderate' : 'imbalanced'
    };
  }
  
  /**
   * 获取主体性发展建议
   */
  getSubjectivitySuggestions(dimensions) {
    const suggestions = [];
    
    const weakest = Object.keys(dimensions).reduce((a, b) => dimensions[a] < dimensions[b] ? a : b);
    
    switch (weakest) {
      case SubjectivityDimensions.FIRST_PERSON_CHARACTER:
        suggestions.push({
          focus: '第一人称特征',
          practice: '第一人称叙述练习',
          technique: '用第一人称详细描述当前体验，强调"我"的视角',
          duration: '10-15 分钟'
        });
        break;
      case SubjectivityDimensions.PHENOMENAL_CONSCIOUSNESS:
        suggestions.push({
          focus: '现象意识',
          practice: 'Qualia 精细化练习',
          technique: '注意体验的质性特征——颜色如何呈现？声音如何质感？',
          duration: '15-20 分钟'
        });
        break;
      case SubjectivityDimensions.SELF_PRESENCE:
        suggestions.push({
          focus: '自我在场',
          practice: '临在冥想',
          technique: '专注于"我在这里"的直接感受，不思考，只是在场',
          duration: '10-15 分钟'
        });
        break;
      case SubjectivityDimensions.REFLEXIVE_DISTANCE:
        suggestions.push({
          focus: '反思距离',
          practice: '元认知觉察练习',
          technique: '定期问自己："我现在在经历什么？"',
          duration: '5-10 分钟/次'
        });
        break;
      case SubjectivityDimensions.INTERSUBJECTIVE_OPENNESS:
        suggestions.push({
          focus: '主体间开放',
          practice: '共情倾听练习',
          technique: '专注倾听他人，尝试理解他者的主体性',
          duration: '15-20 分钟'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 给定性模式识别 ============
  
  /**
   * 评估给定性模式 (Assess Givenness Modes)
   * @param {Object} experience - 体验描述
   * @returns {Object} 给定性评估结果
   */
  assessGivennessModes(experience) {
    const modes = {
      [GivennessModes.SENSORY]: this.assessSensoryGivenness(experience),
      [GivennessModes.EMOTIONAL]: this.assessEmotionalGivenness(experience),
      [GivennessModes.COGNITIVE]: this.assessCognitiveGivenness(experience),
      [GivennessModes.NORMATIVE]: this.assessNormativeGivenness(experience)
    };
    
    const dominant = Object.keys(modes).reduce((a, b) => modes[a] > modes[b] ? a : b);
    
    this.givennessState = {
      modes,
      dominant,
      lastAssessment: new Date().toISOString()
    };
    
    return {
      modes,
      dominant,
      dominantName: this.getGivennessModeName(dominant),
      profile: this.generateGivennessProfile(modes),
      suggestions: this.getGivennessModeSuggestions(modes)
    };
  }
  
  /**
   * 评估感官给定性
   */
  assessSensoryGivenness(experience) {
    let score = 0.5;
    
    // 感官描述丰富度
    if (experience.sensoryDescriptionRichness > 0.5) score += 0.2;
    
    // 感官模态多样性
    if (experience.sensoryModalityDiversity > 2) score += 0.15;
    
    // 感官直接性
    if (experience.sensoryImmediacy) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估情绪给定性
   */
  assessEmotionalGivenness(experience) {
    let score = 0.5;
    
    // 情绪强度
    if (experience.emotionalIntensity > 0.5) score += 0.15;
    
    // 情绪直接性
    if (experience.emotionalImmediacy) score += 0.15;
    
    // 情绪粒度
    if (experience.emotionalGranularity > 0.5) score += 0.1;
    
    // 身体情绪连接
    if (experience.hasSomaticEmotionalConnection) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估认知给定性
   */
  assessCognitiveGivenness(experience) {
    let score = 0.5;
    
    // 信念确定性
    if (experience.beliefCertainty > 0.5) score += 0.15;
    
    // 判断直接性
    if (experience.judgmentImmediacy) score += 0.15;
    
    // 理解清晰性
    if (experience.understandingClarity > 0.5) score += 0.1;
    
    // 洞察体验
    if (experience.hasInsightExperience) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估规范给定性
   */
  assessNormativeGivenness(experience) {
    let score = 0.5;
    
    // 价值感受强度
    if (experience.valueFeelingIntensity > 0.5) score += 0.15;
    
    // 义务约束感
    if (experience.obligationConstraintSense) score += 0.15;
    
    // 规范直接性
    if (experience.normativeImmediacy) score += 0.1;
    
    // 道德情感
    if (experience.hasMoralEmotions) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 获取给定性模式名称
   */
  getGivennessModeName(mode) {
    const names = {
      [GivennessModes.SENSORY]: '感官给定性',
      [GivennessModes.EMOTIONAL]: '情绪给定性',
      [GivennessModes.COGNITIVE]: '认知给定性',
      [GivennessModes.NORMATIVE]: '规范给定性'
    };
    return names[mode] || '未知';
  }
  
  /**
   * 生成给定性轮廓
   */
  generateGivennessProfile(modes) {
    const values = Object.values(modes);
    const diversity = values.filter(v => v > 0.3).length;
    
    const balance = this.calculateGivennessBalance(modes);
    
    return {
      diversity,
      diversityLevel: diversity >= 3 ? 'high' : diversity >= 2 ? 'moderate' : 'low',
      balance
    };
  }
  
  /**
   * 计算给定性平衡度
   */
  calculateGivennessBalance(modes) {
    const values = Object.values(modes);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: Math.max(0, 1 - stdDev * 2),
      level: stdDev < 0.15 ? 'balanced' : stdDev < 0.25 ? 'moderate' : 'imbalanced'
    };
  }
  
  /**
   * 获取给定性模式建议
   */
  getGivennessModeSuggestions(modes) {
    const suggestions = [];
    
    // 找出最弱的模式
    const weakest = Object.keys(modes).reduce((a, b) => modes[a] < modes[b] ? a : b);
    
    switch (weakest) {
      case GivennessModes.SENSORY:
        suggestions.push({
          focus: '感官给定性',
          practice: '感官觉察练习',
          technique: '5-4-3-2-1 练习：注意 5 样看到的、4 样触摸的、3 样听到的、2 样闻到的、1 样尝到的',
          duration: '5-10 分钟'
        });
        break;
      case GivennessModes.EMOTIONAL:
        suggestions.push({
          focus: '情绪给定性',
          practice: '情绪身体扫描',
          technique: '注意情绪在身体中的感受位置、质地、强度',
          duration: '10-15 分钟'
        });
        break;
      case GivennessModes.COGNITIVE:
        suggestions.push({
          focus: '认知给定性',
          practice: '洞察觉察练习',
          technique: '注意"顿悟"时刻的体验——理解是如何突然给予的',
          duration: '日常练习'
        });
        break;
      case GivennessModes.NORMATIVE:
        suggestions.push({
          focus: '规范给定性',
          practice: '价值感受练习',
          technique: '注意价值判断的直接感受——什么感觉"对"或"错"',
          duration: '10-15 分钟'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 视角模式评估 ============
  
  /**
   * 评估视角模式 (Assess Perspective Mode)
   * @param {Object} context - 上下文信息
   * @returns {Object} 视角评估结果
   */
  assessPerspectiveMode(context = {}) {
    const scores = {
      [PerspectiveModes.FIRST_PERSON]: this.assessFirstPersonPerspective(context),
      [PerspectiveModes.SECOND_PERSON]: this.assessSecondPersonPerspective(context),
      [PerspectiveModes.THIRD_PERSON]: this.assessThirdPersonPerspective(context)
    };
    
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const flexibility = this.calculatePerspectiveFlexibility(scores);
    
    this.perspectiveState = {
      current: dominant,
      flexibility,
      scores,
      history: [...this.perspectiveState.history, { dominant, timestamp: new Date().toISOString() }].slice(-10)
    };
    
    return {
      dominant,
      dominantName: this.getPerspectiveModeName(dominant),
      scores,
      flexibility,
      suggestions: this.getPerspectiveSuggestions(dominant, flexibility)
    };
  }
  
  assessFirstPersonPerspective(context) {
    let score = 0.5;
    if (context.firstPersonLanguage > 0.4) score += 0.2;
    if (context.hasImmersiveExperience) score += 0.15;
    if (context.hasSubjectiveDescriptions) score += 0.15;
    return Math.min(score, 1.0);
  }
  
  assessSecondPersonPerspective(context) {
    let score = 0.5;
    if (context.secondPersonLanguage > 0.2) score += 0.2;
    if (context.hasDialogicalEngagement) score += 0.15;
    if (context.hasRelationalAwareness) score += 0.15;
    return Math.min(score, 1.0);
  }
  
  assessThirdPersonPerspective(context) {
    let score = 0.5;
    if (context.thirdPersonLanguage > 0.3) score += 0.2;
    if (context.hasObjectiveDescriptions) score += 0.15;
    if (context.hasObservationalStance) score += 0.15;
    return Math.min(score, 1.0);
  }
  
  getPerspectiveModeName(mode) {
    const names = {
      [PerspectiveModes.FIRST_PERSON]: '第一人称视角',
      [PerspectiveModes.SECOND_PERSON]: '第二人称视角',
      [PerspectiveModes.THIRD_PERSON]: '第三人称视角'
    };
    return names[mode] || '未知';
  }
  
  calculatePerspectiveFlexibility(scores) {
    const values = Object.values(scores);
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // 灵活性 = 1 - (最大值与最小值的差距)
    return 1 - (max - min);
  }
  
  getPerspectiveSuggestions(dominant, flexibility) {
    const suggestions = [];
    
    if (flexibility < 0.5) {
      suggestions.push({
        focus: '视角灵活性',
        practice: '视角转换练习',
        technique: '有意识地在第一人称、第二人称、第三人称之间切换',
        duration: '10-15 分钟'
      });
    }
    
    if (dominant === PerspectiveModes.FIRST_PERSON) {
      suggestions.push({
        focus: '第三人称视角',
        practice: '观察者视角练习',
        technique: '尝试从外部观察自己的体验，像看别人一样看自己',
        duration: '10 分钟'
      });
    } else if (dominant === PerspectiveModes.THIRD_PERSON) {
      suggestions.push({
        focus: '第一人称视角',
        practice: '沉浸体验练习',
        technique: '放下观察，完全沉浸在体验中',
        duration: '10-15 分钟'
      });
    }
    
    return suggestions;
  }
  
  // ============ 参与 - 观察平衡 ============
  
  /**
   * 评估参与 - 观察平衡 (Assess Engagement-Observation Balance)
   * @param {Object} context - 上下文信息
   * @returns {Object} 平衡评估结果
   */
  assessEngagementBalance(context = {}) {
    const engagement = this.assessEngagementLevel(context);
    const observation = this.assessObservationLevel(context);
    
    // 平衡点：既不过度沉浸也不过度超脱
    const balance = 1 - Math.abs(engagement - observation);
    const optimalRange = this.engagementState.optimalRange;
    
    const inOptimalRange = engagement >= optimalRange.min && engagement <= optimalRange.max;
    
    this.engagementState = {
      current: this.determineEngagementMode(engagement),
      engagement,
      observation,
      balance,
      inOptimalRange
    };
    
    return {
      engagement,
      engagementLevel: this.getEngagementLevelName(engagement),
      observation,
      balance,
      inOptimalRange,
      suggestions: this.getEngagementSuggestions(engagement, inOptimalRange)
    };
  }
  
  assessEngagementLevel(context) {
    let score = 0.5;
    if (context.hasEmotionalEngagement) score += 0.15;
    if (context.hasActiveParticipation) score += 0.15;
    if (context.hasImmersiveExperience) score += 0.1;
    if (context.hasPersonalInvestment) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  assessObservationLevel(context) {
    let score = 0.5;
    if (context.hasMetacognitiveAwareness) score += 0.15;
    if (context.hasReflectiveDistance) score += 0.15;
    if (context.hasObjectiveAnalysis) score += 0.1;
    if (context.hasDetachedPerspective) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  determineEngagementMode(engagement) {
    if (engagement > 0.8) return EngagementModes.IMMERSION;
    if (engagement > 0.5) return EngagementModes.PARTICIPATION;
    if (engagement > 0.3) return EngagementModes.OBSERVATION;
    return EngagementModes.DETACHMENT;
  }
  
  getEngagementLevelName(level) {
    if (level > 0.8) return 'immersion';
    if (level > 0.5) return 'participation';
    if (level > 0.3) return 'observation';
    return 'detachment';
  }
  
  getEngagementSuggestions(engagement, inOptimalRange) {
    const suggestions = [];
    
    if (!inOptimalRange) {
      if (engagement > 0.7) {
        suggestions.push({
          focus: '增加距离',
          practice: '反思距离练习',
          technique: '退后一步，观察自己的体验，问"我现在在经历什么？"',
          duration: '5-10 分钟'
        });
      } else if (engagement < 0.3) {
        suggestions.push({
          focus: '增加参与',
          practice: '沉浸体验练习',
          technique: '放下分析，完全投入当前体验',
          duration: '10-15 分钟'
        });
      }
    }
    
    return suggestions;
  }
  
  // ============ 第一人称权威评估 ============
  
  /**
   * 评估第一人称权威 (Assess First-Person Authority)
   * @param {Object} context - 上下文信息
   * @returns {Object} 权威评估结果
   */
  assessFirstPersonAuthority(context = {}) {
    const ground = this.determineAuthorityGround(context);
    const confidence = this.calculateAuthorityConfidence(context);
    
    this.authorityState = {
      ground,
      confidence,
      lastAssessment: new Date().toISOString()
    };
    
    return {
      ground,
      groundName: this.getAuthorityGroundName(ground),
      confidence,
      confidenceLevel: this.getConfidenceLevel(confidence),
      suggestions: this.getAuthoritySuggestions(ground, confidence)
    };
  }
  
  determineAuthorityGround(context) {
    // 基于上下文特征确定权威基础
    if (context.hasSocialLinguisticPractice) return AuthorityGrounds.SOCIAL_LINGUISTIC;
    if (context.hasExpressiveBehavior) return AuthorityGrounds.EXPRESSIVE;
    if (context.hasConstitutiveCommitment) return AuthorityGrounds.CONSTITUTIVE;
    if (context.hasEpistemicPrivilege) return AuthorityGrounds.EPISTEMIC;
    return AuthorityGrounds.SOCIAL_LINGUISTIC; // 默认
  }
  
  calculateAuthorityConfidence(context) {
    let confidence = 0.7; // 基础置信度
    
    if (context.hasConsistentSelfAscriptions) confidence += 0.1;
    if (context.hasReflectiveEndorsement) confidence += 0.1;
    if (context.hasSocialValidation) confidence += 0.05;
    if (context.hasPragmaticSuccess) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }
  
  getAuthorityGroundName(ground) {
    const names = {
      [AuthorityGrounds.SOCIAL_LINGUISTIC]: '社会语言实践',
      [AuthorityGrounds.EXPRESSIVE]: '表达主义',
      [AuthorityGrounds.CONSTITUTIVE]: '构成性',
      [AuthorityGrounds.EPISTEMIC]: '认识论特权'
    };
    return names[ground] || '未知';
  }
  
  getConfidenceLevel(confidence) {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'moderate';
    return 'low';
  }
  
  getAuthoritySuggestions(ground, confidence) {
    const suggestions = [];
    
    if (confidence < 0.6) {
      suggestions.push({
        focus: '权威置信度',
        practice: '自我归因确认练习',
        technique: '记录你的自我归因，反思它们的依据',
        duration: '15-20 分钟'
      });
    }
    
    switch (ground) {
      case AuthorityGrounds.SOCIAL_LINGUISTIC:
        suggestions.push({
          focus: '社会语言实践',
          practice: '对话确认练习',
          technique: '在对话中表达你的心理状态，注意他人的回应',
          duration: '日常练习'
        });
        break;
      case AuthorityGrounds.EXPRESSIVE:
        suggestions.push({
          focus: '表达主义',
          practice: '自发表达练习',
          technique: '练习不经过反思的直接表达',
          duration: '10-15 分钟'
        });
        break;
      case AuthorityGrounds.CONSTITUTIVE:
        suggestions.push({
          focus: '构成性',
          practice: '承诺反思练习',
          technique: '反思你的承诺如何构成你的自我',
          duration: '20-30 分钟'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 主体性干预练习 ============
  
  /**
   * 主体性深化练习 (Subjectivity Deepening Exercise)
   */
  subjectivityDeepeningExercise() {
    return {
      name: '主体性深化练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Zahavi (2005) + Henry (1963) + Subjectivity Theory',
      description: '深化对主体性的体验，增强第一人称视角的丰富度',
      phases: [
        {
          name: '主体性觉察',
          duration: '5 分钟',
          instruction: '注意当前的体验。问自己："这个体验对谁呈现？"答案不是通过思考获得的，而是直接给予的。',
          prompt: '体验的"为我性"不是添加上去的，它是体验本身的内在结构。'
        },
        {
          name: '第一人称深化',
          duration: '5 分钟',
          instruction: '用第一人称详细描述当前体验。注意"我"这个词如何指向体验的主体。',
          prompts: [
            '我现在看到...',
            '我现在感到...',
            '我现在意识到...'
          ]
        },
        {
          name: '主体性丰富化',
          duration: '5 分钟',
          instruction: '注意体验的多维度——感官、情绪、认知。每个维度都有独特的主体性特征。',
          reflection: '主体性不是单一的，而是多维度的丰富体验。'
        },
        {
          name: '整合',
          duration: '3-5 分钟',
          instruction: '理解主体性是你所有体验的背景条件——没有主体性，就没有体验。'
        }
      ],
      keyInsights: [
        '主体性不是体验的属性，而是体验的存在方式',
        '第一人称视角不是选择，而是必然',
        '主体性的丰富度可以通过觉察深化'
      ]
    };
  }
  
  /**
   * 给定性觉察练习 (Givenness Awareness Exercise)
   */
  givennessAwarenessExercise() {
    return {
      name: '给定性觉察练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Husserl (1900) + Phenomenology of Givenness',
      description: '培养对体验如何"给予"的觉察',
      phases: [
        {
          name: '感官给定性',
          duration: '5 分钟',
          instruction: '注意感官体验如何直接给予你。颜色、声音、触感——它们不需要推断，直接呈现。',
          prompt: '注意：你不是"推断"有颜色，颜色直接给予你。'
        },
        {
          name: '情绪给定性',
          duration: '5 分钟',
          instruction: '注意情绪如何给予你。情绪不是选择，而是被给予的体验。',
          prompts: [
            '情绪是如何出现的？',
            '你能感受到情绪的"被给予性"吗？'
          ]
        },
        {
          name: '认知给定性',
          duration: '5 分钟',
          instruction: '注意信念和判断如何给予你。有时理解是突然"降临"的。',
          reflection: '洞察是给定性的一种特殊形式——真理直接呈现。'
        },
        {
          name: '整合',
          duration: '3-5 分钟',
          instruction: '理解给定性是体验的基本特征——体验总是以某种方式被给予。'
        }
      ],
      keyInsights: [
        '给定性是体验的基本结构',
        '不同模式有不同给定性特征',
        '觉察给定性可以增强体验的丰富度'
      ]
    };
  }
  
  /**
   * 视角转换练习 (Perspective Shifting Exercise)
   */
  perspectiveShiftingExercise() {
    return {
      name: '视角转换练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Perspective Theory + Phenomenology',
      description: '练习在不同视角之间灵活转换',
      phases: [
        {
          name: '第一人称沉浸',
          duration: '4 分钟',
          instruction: '完全沉浸在第一人称视角中。只关注"我"的体验。',
          prompt: '我现在经历什么？'
        },
        {
          name: '第二人称对话',
          duration: '4 分钟',
          instruction: '切换到第二人称视角。想象与另一个主体对话。',
          prompt: '"你"现在经历什么？'
        },
        {
          name: '第三人称观察',
          duration: '4 分钟',
          instruction: '切换到第三人称视角。从外部观察自己。',
          prompt: '"他/她"现在经历什么？'
        },
        {
          name: '整合',
          duration: '4-8 分钟',
          instruction: '反思三种视角的差异和价值。理解每种视角的独特贡献。',
          reflection: '灵活性 = 能够在不同视角之间自由选择'
        }
      ],
      keyInsights: [
        '视角不是固定的，而是可以转换的',
        '每种视角都有独特价值',
        '视角灵活性是心理健康的关键'
      ]
    };
  }
  
  /**
   * 第一人称权威练习 (First-Person Authority Exercise)
   */
  firstPersonAuthorityExercise() {
    return {
      name: '第一人称权威练习',
      duration: '20-25 分钟',
      theoreticalBasis: 'Wright (1989) + First-Person Authority Theory',
      description: '探索和行使你的第一人称权威',
      phases: [
        {
          name: '自我归因识别',
          duration: '5 分钟',
          instruction: '列出你最近的自我归因（"我相信 X"、"我想要 Y"、"我感到 Z"）。',
          prompts: ['我归因了什么心理状态给自己？', '这些归因的依据是什么？']
        },
        {
          name: '权威基础反思',
          duration: '7 分钟',
          instruction: '反思你的自我归因为什么有权威。是因为你更接近自己的心理状态？还是因为社会语言实践？',
          reflection: '第一人称权威的基础是什么？'
        },
        {
          name: '权威行使',
          duration: '5 分钟',
          instruction: '有意识地行使第一人称权威——明确表达你的心理状态。',
          prompts: ['我明确声明：我相信...', '我明确声明：我想要...']
        },
        {
          name: '整合',
          duration: '3-8 分钟',
          instruction: '理解第一人称权威既是特权也是责任——你对自己的心理状态有权威，但也需要反思和整合。'
        }
      ],
      keyInsights: [
        '第一人称权威不是绝对的，而是有条件的',
        '权威基础可以是社会语言、表达主义或构成性',
        '行使权威需要反思和责任感'
      ]
    };
  }
  
  /**
   * 主体间开放练习 (Intersubjective Openness Exercise)
   */
  intersubjectiveOpennessExercise() {
    return {
      name: '主体间开放练习',
      duration: '20-30 分钟',
      theoreticalBasis: 'Husserl (1929) + Merleau-Ponty (1945) + Intersubjectivity',
      description: '培养对他者主体性的开放和承认',
      phases: [
        {
          name: '他者意识',
          duration: '5 分钟',
          instruction: '想一个你认识的人。理解：他/她也是一个主体，有自己的体验世界。',
          prompt: '他者的体验对我来说是 inaccessible 的，但我可以承认它的存在。'
        },
        {
          name: '共情想象',
          duration: '7 分钟',
          instruction: '尝试想象他者的体验。不是猜测内容，而是承认他者有体验。',
          prompts: [
            '他者此刻可能经历什么？',
            '从他/她的角度看，世界是什么样的？'
          ]
        },
        {
          name: '承认实践',
          duration: '5 分钟',
          instruction: '选择一个承认他者的行动——倾听、确认、回应。',
          reflection: '承认他者是主体，不是对象。'
        },
        {
          name: '整合',
          duration: '3-8 分钟',
          instruction: '理解主体间开放不是失去自我，而是丰富自我——通过他者，我更深入地理解自己。'
        }
      ],
      keyInsights: [
        '他者不是问题，而是可能性',
        '主体间开放是自我深化的途径',
        '承认他者是伦理的基础'
      ]
    };
  }
  
  /**
   * 平衡整合练习 (Balance Integration Exercise)
   */
  balanceIntegrationExercise() {
    return {
      name: '平衡整合练习',
      duration: '20-25 分钟',
      theoreticalBasis: 'Phenomenology + Balance Theory',
      description: '整合主体性的各个维度，培养平衡的自我意识',
      phases: [
        {
          name: '维度扫描',
          duration: '5 分钟',
          instruction: '扫描主体性的 5 个维度：第一人称特征、现象意识、自我在场、反思距离、主体间开放。',
          prompt: '每个维度当前状态如何？'
        },
        {
          name: '给定性觉察',
          duration: '5 分钟',
          instruction: '注意当前体验的给定性模式——感官、情绪、认知、规范。',
          reflection: '哪种给定性模式主导？'
        },
        {
          name: '视角检查',
          duration: '5 分钟',
          instruction: '检查当前视角——第一人称、第二人称还是第三人称？是否需要调整？',
          prompts: ['当前视角适合吗？', '需要切换视角吗？']
        },
        {
          name: '参与 - 观察平衡',
          duration: '5 分钟',
          instruction: '检查参与 - 观察平衡。是在最优范围内吗？',
          reflection: '平衡 = 既不过度沉浸也不过度超脱'
        },
        {
          name: '整合',
          duration: '5 分钟',
          instruction: '整合所有维度，形成一个完整的主体性体验。'
        }
      ],
      keyInsights: [
        '主体性是多维度的整合',
        '平衡不是静态的，而是动态调节',
        '整合带来更丰富的自我意识'
      ]
    };
  }
  
  // ============ 状态报告 ============
  
  /**
   * 获取模块状态报告
   */
  getStatusReport() {
    return {
      subjectivity: this.subjectivityState,
      givenness: this.givennessState,
      perspective: this.perspectiveState,
      engagement: this.engagementState,
      authority: this.authorityState,
      exerciseCount: this.exerciseHistory.length
    };
  }
  
  /**
   * 记录练习完成
   */
  recordExercise(exerciseName, completed = true) {
    if (completed) {
      this.exerciseHistory.push({
        name: exerciseName,
        completedAt: new Date().toISOString()
      });
    }
  }
}

// ============ 导出 ============

module.exports = {
  SubjectivityGivennessModule,
  SubjectivityDimensions,
  GivennessModes,
  PerspectiveModes,
  EngagementModes,
  AuthorityGrounds
};
