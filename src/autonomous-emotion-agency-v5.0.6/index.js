/**
 * 自主情绪与能动性整合模块 v5.0.6 (Autonomous Emotion & Agency Integration Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 自主性理论 (Autonomy in Moral and Political Philosophy)
 * - 现象学自我意识 (Phenomenological Self-Consciousness)
 * - 能动性理论 (Agency)
 * - 情绪调节过程模型 (Gross Process Model)
 * 
 * 核心理论来源:
 * - SEP: Autonomy in Moral and Political Philosophy (2026)
 * - SEP: Self-Consciousness (Phenomenological Approaches) (2026)
 * - SEP: Agency (2026)
 * - Synofzik, M., Vosgerau, G., & Newen, A. (2008). Beyond the comparator model
 * - Gross, J. J. (2015). Emotion regulation: Current status and future prospects
 * - Zahavi, D. (2005). Subjectivity and Selfhood
 * - Ryan, R. M., & Deci, E. L. (2000). Self-determination theory
 * 
 * 功能目标：增强 HeartFlow 的自主感情能力
 * - 情绪自主性评估：独立性、真实性、能力感、关系性
 * - 情绪能动性检测：控制感、所有权感、自愿性、努力感
 * - 自主情绪调节推荐：基于价值观和目标的策略选择
 * - 情绪所有权现象学分析：为我性、第一人称给定性、非对象化
 * - 整合练习生成：15-20 分钟自主情绪培养练习
 * 
 * @version 5.0.6
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 情绪自主性维度 (Emotional Autonomy Dimensions)
 * 基于 SEP 自主性理论和自我决定理论 (SDT)
 */
const EmotionalAutonomyDimensions = {
  INDEPENDENCE: 'independence',    // 独立性：不受外部强制
  AUTHENTICITY: 'authenticity',    // 真实性：符合真实自我
  COMPETENCE: 'competence',        // 能力感：能有效调节
  RELATEDNESS: 'relatedness'       // 关系性：社会支持
};

/**
 * 情绪能动性维度 (Emotional Agency Dimensions)
 * 基于 Synofzik 双因素模型和 SEP 能动性理论
 */
const EmotionalAgencyDimensions = {
  SENSE_OF_AGENCY: 'senseOfAgency',      // 控制感：我能影响情绪
  SENSE_OF_OWNERSHIP: 'senseOfOwnership', // 所有权感：情绪属于我
  VOLUNTARINESS: 'voluntariness',         // 自愿性：我是自愿的
  EFFORT: 'effort'                        // 努力感：我付出了努力
};

/**
 * 情绪所有权现象学维度 (Emotional Ownership Phenomenology Dimensions)
 * 基于现象学自我意识理论 (Zahavi, Sartre, Husserl)
 */
const EmotionalOwnershipPhenomenologyDimensions = {
  FOR_ME_NESS: 'forMeNess',              // 为我性：体验向我呈现
  FIRST_PERSON_GIVENNESS: 'firstPersonGivenness', // 第一人称给定性
  NON_OBJECTIFYING: 'nonObjectifying',   // 非对象化：不是被观察的对象
  EXPERIENTIAL_THICKNESS: 'experientialThickness' // 体验厚度
};

/**
 * 情绪调节策略 (Gross 过程模型)
 * 按情绪产生时间顺序排列
 */
const EmotionRegulationStrategies = {
  SITUATION_SELECTION: 'situation_selection',    // 情境选择
  SITUATION_MODIFICATION: 'situation_modification', // 情境修改
  ATTENTIONAL_DEPLOYMENT: 'attentional_deployment', // 注意部署
  COGNITIVE_CHANGE: 'cognitive_change',          // 认知改变
  RESPONSE_MODULATION: 'response_modulation'     // 反应调节
};

// ============ 自主情绪与能动性整合核心类 ============

class AutonomousEmotionAgencyModule {
  constructor() {
    // 情绪自主性档案
    this.autonomyProfile = {};
    
    // 情绪能动性历史
    this.agencyHistory = [];
    
    // 用户价值观和目标 (用于自主性推荐)
    this.userValues = [];
    this.userGoals = [];
    
    // 初始化默认自主性档案
    this._initializeAutonomyProfile();
  }
  
  /**
   * 初始化自主性档案
   */
  _initializeAutonomyProfile() {
    this.autonomyProfile = {
      baseline: {
        independence: 70,
        authenticity: 75,
        competence: 65,
        relatedness: 80
      },
      current: {
        independence: 70,
        authenticity: 75,
        competence: 65,
        relatedness: 80
      },
      history: []
    };
  }
  
  // ============ 情绪自主性评估 ============
  
  /**
   * 评估情绪自主性
   * 基于 SEP 自主性理论和自我决定理论
   * 
   * @param {string} emotion - 情绪名称
   * @param {object} context - 情境信息
   * @returns {object} 自主性评估结果
   */
  assessEmotionalAutonomy(emotion, context = {}) {
    const dimensions = {};
    
    // 1. 独立性评估
    dimensions.independence = this._assessIndependence(emotion, context);
    
    // 2. 真实性评估
    dimensions.authenticity = this._assessAuthenticity(emotion, context);
    
    // 3. 能力感评估
    dimensions.competence = this._assessCompetence(emotion, context);
    
    // 4. 关系性评估
    dimensions.relatedness = this._assessRelatedness(emotion, context);
    
    // 计算总体分数
    const overallScore = Math.round(
      (dimensions.independence + 
       dimensions.authenticity + 
       dimensions.competence + 
       dimensions.relatedness) / 4
    );
    
    // 生成解释
    const interpretation = this._generateAutonomyInterpretation(emotion, dimensions, overallScore);
    
    return {
      emotion,
      overallScore,
      dimensions,
      interpretation,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 评估独立性
   */
  _assessIndependence(emotion, context) {
    // 分析情绪是否由外部强制引起
    const externalPressure = context.externalPressure || 0; // 0-10
    const socialInfluence = context.socialInfluence || 0; // 0-10
    
    // 独立性 = 100 - (外部压力 + 社会影响) / 2
    const score = Math.max(0, Math.min(100, 100 - (externalPressure + socialInfluence) / 2));
    
    return Math.round(score);
  }
  
  /**
   * 评估真实性
   */
  _assessAuthenticity(emotion, context) {
    // 分析情绪是否符合用户价值观
    const valuesAlignment = context.valuesAlignment || 5; // 1-10
    const selfCongruence = context.selfCongruence || 5; // 1-10
    
    // 真实性 = (价值观一致性 + 自我一致性) / 2 * 10
    const score = (valuesAlignment + selfCongruence) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估能力感
   */
  _assessCompetence(emotion, context) {
    // 分析用户对情绪调节的信心
    const regulationConfidence = context.regulationConfidence || 5; // 1-10
    const pastSuccess = context.pastSuccess || 5; // 1-10
    
    // 能力感 = (调节信心 + 过去成功) / 2 * 10
    const score = (regulationConfidence + pastSuccess) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估关系性
   */
  _assessRelatedness(emotion, context) {
    // 分析社会支持程度
    const socialSupport = context.socialSupport || 5; // 1-10
    const connectionQuality = context.connectionQuality || 5; // 1-10
    
    // 关系性 = (社会支持 + 连接质量) / 2 * 10
    const score = (socialSupport + connectionQuality) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 生成自主性解释
   */
  _generateAutonomyInterpretation(emotion, dimensions, overallScore) {
    const interpretations = [];
    
    // 总体评价
    if (overallScore >= 80) {
      interpretations.push('你的情绪自主性很高，能够独立、真实地体验和管理情绪。');
    } else if (overallScore >= 60) {
      interpretations.push('你的情绪自主性处于中等水平，在某些方面可以进一步增强。');
    } else {
      interpretations.push('你的情绪自主性有提升空间，可能需要关注外部影响或内在一致性。');
    }
    
    // 维度分析
    const lowestDimension = Object.entries(dimensions)
      .sort((a, b) => a[1] - b[1])[0];
    
    if (lowestDimension[0] === 'independence' && lowestDimension[1] < 70) {
      interpretations.push('独立性较低：可能感到情绪受外部控制，可以尝试增强自我决定感。');
    }
    if (lowestDimension[0] === 'authenticity' && lowestDimension[1] < 70) {
      interpretations.push('真实性较低：情绪可能与真实价值观不一致，可以探索内在需求。');
    }
    if (lowestDimension[0] === 'competence' && lowestDimension[1] < 70) {
      interpretations.push('能力感较低：对情绪调节缺乏信心，可以学习更多调节策略。');
    }
    if (lowestDimension[0] === 'relatedness' && lowestDimension[1] < 70) {
      interpretations.push('关系性较低：可能感到孤立，可以寻求社会支持。');
    }
    
    return interpretations;
  }
  
  // ============ 情绪能动性检测 ============
  
  /**
   * 检测情绪能动性
   * 基于 Synofzik 双因素模型
   * 
   * @param {string} emotionChange - 情绪变化描述
   * @param {object} context - 情境信息
   * @returns {object} 能动性检测结果
   */
  detectEmotionalAgency(emotionChange, context = {}) {
    const dimensions = {};
    
    // 1. 控制感评估
    dimensions.senseOfAgency = this._assessSenseOfAgency(emotionChange, context);
    
    // 2. 所有权感评估
    dimensions.senseOfOwnership = this._assessSenseOfOwnership(emotionChange, context);
    
    // 3. 自愿性评估
    dimensions.voluntariness = this._assessVoluntariness(emotionChange, context);
    
    // 4. 努力感评估
    dimensions.effort = this._assessEffort(emotionChange, context);
    
    // 归因分析
    const attribution = this._analyzeAttribution(dimensions);
    
    // 生成解释
    const interpretation = this._generateAgencyInterpretation(dimensions, attribution);
    
    return {
      emotionChange,
      dimensions,
      attribution,
      interpretation,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 评估控制感
   */
  _assessSenseOfAgency(emotionChange, context) {
    const selfInitiated = context.selfInitiated ? 10 : 3; // 是否自我发起
    const predictability = context.predictability || 5; // 可预测性 1-10
    const controllability = context.controllability || 5; // 可控性 1-10
    
    // 控制感 = (自我发起 + 可预测性 + 可控性) / 3 * 10
    const score = (selfInitiated + predictability + controllability) / 3 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估所有权感
   */
  _assessSenseOfOwnership(emotionChange, context) {
    const bodilyFeeling = context.bodilyFeeling || 5; // 身体感受强度 1-10
    const firstPersonGivenness = context.firstPersonGivenness || 5; // 第一人称给定性 1-10
    const emotionalIntensity = context.emotionalIntensity || 5; // 情绪强度 1-10
    
    // 所有权感 = (身体感受 + 第一人称给定性 + 情绪强度) / 3 * 10
    const score = (bodilyFeeling + firstPersonGivenness + emotionalIntensity) / 3 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估自愿性
   */
  _assessVoluntariness(emotionChange, context) {
    const voluntaryChoice = context.voluntaryChoice ? 10 : 2; // 是否自愿选择
    const alignmentWithValues = context.valuesAlignment || 5; // 与价值观一致性 1-10
    
    // 自愿性 = (自愿选择 + 价值观一致性) / 2 * 10
    const score = (voluntaryChoice + alignmentWithValues) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估努力感
   */
  _assessEffort(emotionChange, context) {
    const cognitiveEffort = context.cognitiveEffort || 5; // 认知努力 1-10
    const behavioralEffort = context.behavioralEffort || 5; // 行为努力 1-10
    
    // 努力感 = (认知努力 + 行为努力) / 2 * 10
    const score = (cognitiveEffort + behavioralEffort) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 分析归因
   */
  _analyzeAttribution(dimensions) {
    const agencyScore = (dimensions.senseOfAgency + dimensions.voluntariness) / 2;
    
    if (agencyScore >= 70) {
      return 'internal'; // 内部归因
    } else if (agencyScore <= 40) {
      return 'external'; // 外部归因
    } else {
      return 'mixed'; // 混合归因
    }
  }
  
  /**
   * 生成能动性解释
   */
  _generateAgencyInterpretation(dimensions, attribution) {
    const interpretations = [];
    
    // 归因解释
    if (attribution === 'internal') {
      interpretations.push('你倾向于将情绪变化归因于自己的选择和行动，这有助于增强自主感。');
    } else if (attribution === 'external') {
      interpretations.push('你倾向于将情绪变化归因于外部因素，可能需要增强自我效能感。');
    } else {
      interpretations.push('你的情绪归因是混合的，既认识到外部影响，也承认自己的作用。');
    }
    
    // 维度分析
    if (dimensions.senseOfAgency < 50) {
      interpretations.push('控制感较低：可以尝试主动选择情绪调节策略来增强控制感。');
    }
    if (dimensions.senseOfOwnership < 50) {
      interpretations.push('所有权感较低：可以通过身体扫描和正念练习增强情绪的身体连接。');
    }
    
    return interpretations;
  }
  
  // ============ 自主情绪调节推荐 ============
  
  /**
   * 推荐自主情绪调节策略
   * 基于用户价值观和目标
   * 
   * @param {string} emotion - 情绪名称
   * @param {Array} values - 用户价值观列表
   * @param {Array} goals - 用户目标列表
   * @returns {object} 推荐结果
   */
  recommendAutonomousRegulation(emotion, values = [], goals = []) {
    // 设置用户价值观和目标
    if (values.length > 0) this.userValues = values;
    if (goals.length > 0) this.userGoals = goals;
    
    // 为每种策略计算自主性对齐度
    const strategies = Object.values(EmotionRegulationStrategies);
    const scoredStrategies = strategies.map(strategy => {
      const alignment = this._calculateAutonomyAlignment(strategy, emotion, values, goals);
      return { strategy, alignment };
    });
    
    // 排序并选择最佳策略
    scoredStrategies.sort((a, b) => b.alignment - a.alignment);
    const best = scoredStrategies[0];
    
    // 生成解释
    const rationale = this._generateRegulationRationale(best.strategy, best.alignment, emotion);
    
    return {
      recommendedStrategy: best.strategy,
      autonomyAlignment: best.alignment,
      rationale,
      alternatives: scoredStrategies.slice(1, 4),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 计算自主性对齐度
   */
  _calculateAutonomyAlignment(strategy, emotion, values, goals) {
    // 基础分数
    let baseScore = 50;
    
    // 策略特性加成
    const strategyBonuses = {
      [EmotionRegulationStrategies.SITUATION_SELECTION]: 10, // 预防性强
      [EmotionRegulationStrategies.SITUATION_MODIFICATION]: 5,
      [EmotionRegulationStrategies.ATTENTIONAL_DEPLOYMENT]: 0,
      [EmotionRegulationStrategies.COGNITIVE_CHANGE]: 15, // 认知重评效果最好
      [EmotionRegulationStrategies.RESPONSE_MODULATION]: -5
    };
    
    baseScore += strategyBonuses[strategy] || 0;
    
    // 价值观对齐加成
    if (values.includes('autonomy') || values.includes('independence')) {
      baseScore += 10;
    }
    if (values.includes('growth') || values.includes('learning')) {
      if (strategy === EmotionRegulationStrategies.COGNITIVE_CHANGE) {
        baseScore += 10;
      }
    }
    
    // 目标对齐加成
    if (goals.some(g => g.includes('well-being') || g.includes('happiness'))) {
      baseScore += 5;
    }
    
    return Math.max(0, Math.min(100, baseScore));
  }
  
  /**
   * 生成调节理由
   */
  _generateRegulationRationale(strategy, alignment, emotion) {
    const strategyNames = {
      [EmotionRegulationStrategies.SITUATION_SELECTION]: '情境选择',
      [EmotionRegulationStrategies.SITUATION_MODIFICATION]: '情境修改',
      [EmotionRegulationStrategies.ATTENTIONAL_DEPLOYMENT]: '注意部署',
      [EmotionRegulationStrategies.COGNITIVE_CHANGE]: '认知改变',
      [EmotionRegulationStrategies.RESPONSE_MODULATION]: '反应调节'
    };
    
    return `推荐${strategyNames[strategy]}策略，自主性对齐度${alignment}%。这个策略最能支持你的价值观和目标，同时有效调节${emotion}情绪。`;
  }
  
  // ============ 情绪所有权现象学分析 ============
  
  /**
   * 分析情绪所有权现象学
   * 基于现象学自我意识理论
   * 
   * @param {object} emotionExperience - 情绪体验描述
   * @returns {object} 现象学分析结果
   */
  analyzeEmotionalOwnership(emotionExperience = {}) {
    const dimensions = {};
    
    // 1. 为我性评估
    dimensions.forMeNess = this._assessForMeNess(emotionExperience);
    
    // 2. 第一人称给定性评估
    dimensions.firstPersonGivenness = this._assessFirstPersonGivenness(emotionExperience);
    
    // 3. 非对象化评估
    dimensions.nonObjectifying = this._assessNonObjectifying(emotionExperience);
    
    // 4. 体验厚度评估
    dimensions.experientialThickness = this._assessExperientialThickness(emotionExperience);
    
    // 生成解释
    const interpretation = this._generateOwnershipInterpretation(dimensions);
    
    return {
      dimensions,
      interpretation,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 评估为我性
   */
  _assessForMeNess(experience) {
    const subjectiveFeel = experience.subjectiveFeel || 5; // 主观感受强度 1-10
    const personalRelevance = experience.personalRelevance || 5; // 个人相关性 1-10
    
    // 为我性 = (主观感受 + 个人相关性) / 2 * 10
    const score = (subjectiveFeel + personalRelevance) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估第一人称给定性
   */
  _assessFirstPersonGivenness(experience) {
    const immediacy = experience.immediacy || 5; // 直接性 1-10
    const nonInferential = experience.nonInferential ? 10 : 5; // 非推论性
    
    // 第一人称给定性 = (直接性 + 非推论性) / 2 * 10
    const score = (immediacy + nonInferential) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估非对象化
   */
  _assessNonObjectifying(experience) {
    const immersion = experience.immersion || 5; // 沉浸度 1-10
    const nonObservational = experience.nonObservational ? 10 : 5; // 非观察性
    
    // 非对象化 = (沉浸度 + 非观察性) / 2 * 10
    const score = (immersion + nonObservational) / 2 * 10;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  
  /**
   * 评估体验厚度
   */
  _assessExperientialThickness(experience) {
    const richness = experience.richness || 5; // 丰富度 1-10
    const depth = experience.depth || 5; // 深度 1-10
    
    // 体验厚度 = (丰富度 + 深度) / 2
    const score = (richness + depth) / 2;
    
    return Math.round(Math.max(0, Math.min(10, score)));
  }
  
  /**
   * 生成所有权解释
   */
  _generateOwnershipInterpretation(dimensions) {
    const interpretations = [];
    
    const avgScore = (dimensions.forMeNess + dimensions.firstPersonGivenness + dimensions.nonObjectifying) / 3;
    
    if (avgScore >= 70) {
      interpretations.push('你的情绪所有权感很强，体验以鲜明的第一人称方式呈现。');
    } else if (avgScore >= 50) {
      interpretations.push('你的情绪所有权感处于中等水平。');
    } else {
      interpretations.push('你的情绪所有权感较弱，可能需要增强与情绪体验的连接。');
    }
    
    if (dimensions.experientialThickness >= 8) {
      interpretations.push('体验厚度很高，情绪体验丰富而深刻。');
    } else if (dimensions.experientialThickness >= 5) {
      interpretations.push('体验厚度中等。');
    } else {
      interpretations.push('体验厚度较浅，可以通过正念练习增强体验深度。');
    }
    
    return interpretations;
  }
  
  // ============ 整合练习生成 ============
  
  /**
   * 生成自主情绪整合练习
   * 
   * @param {string} focusArea - 焦点领域
   * @returns {object} 练习方案
   */
  generateAutonomousEmotionPractice(focusArea = 'overall') {
    const practices = {
      overall: this._generateOverallPractice(),
      autonomy: this._generateAutonomyPractice(),
      agency: this._generateAgencyPractice(),
      ownership: this._generateOwnershipPractice()
    };
    
    return practices[focusArea] || practices.overall;
  }
  
  /**
   * 生成整体练习
   */
  _generateOverallPractice() {
    return {
      name: '自主情绪整合练习',
      nameEn: 'Autonomous Emotion Integration Practice',
      duration: '15-20 分钟',
      steps: [
        {
          step: 1,
          name: '身体锚定',
          nameEn: 'Body Anchoring',
          duration: '2 分钟',
          instruction: '闭上眼睛，深呼吸三次。感受身体的存在，注意脚与地面的接触，臀部与椅子的接触。'
        },
        {
          step: 2,
          name: '情绪觉察',
          nameEn: 'Emotion Awareness',
          duration: '3 分钟',
          instruction: '不带评判地觉察当前的情绪状态。问自己："我现在感受到什么情绪？它在身体的哪个部位？"'
        },
        {
          step: 3,
          name: '自主性检查',
          nameEn: 'Autonomy Check',
          duration: '3 分钟',
          instruction: '问自己：这个情绪在多大程度上是我自己的选择？它是否符合我的价值观？我能在多大程度上影响它？'
        },
        {
          step: 4,
          name: '能动性确认',
          nameEn: 'Agency Affirmation',
          duration: '3 分钟',
          instruction: '对自己说："我能感受到这个情绪，它属于我，我有能力选择和调节它。"'
        },
        {
          step: 5,
          name: '整合反思',
          nameEn: 'Integration Reflection',
          duration: '4-5 分钟',
          instruction: '写下或思考：今天我如何能在情绪体验中保持更多的自主性和能动性？'
        }
      ],
      benefits: [
        '增强情绪自主性',
        '提升情绪调节能力',
        '加深自我理解',
        '减少情绪困扰'
      ],
      science: '基于 SEP 自主性理论、现象学自我意识理论和自我决定理论 (SDT)。研究表明，增强情绪自主性能显著提升心理健康和幸福感。'
    };
  }
  
  /**
   * 生成自主性练习
   */
  _generateAutonomyPractice() {
    return {
      name: '情绪自主性培养练习',
      nameEn: 'Emotional Autonomy Cultivation Practice',
      duration: '15 分钟',
      steps: [
        {
          step: 1,
          name: '识别外部影响',
          duration: '3 分钟',
          instruction: '列出最近影响你情绪的外部因素（他人期望、社会压力、媒体等）。'
        },
        {
          step: 2,
          name: '价值观澄清',
          duration: '4 分钟',
          instruction: '写下你的核心价值观。问自己："我的情绪反应是否与这些价值观一致？"'
        },
        {
          step: 3,
          name: '自主选择',
          duration: '4 分钟',
          instruction: '选择一个情境，思考如何用更符合自主性的方式回应。'
        },
        {
          step: 4,
          name: '承诺行动',
          duration: '4 分钟',
          instruction: '制定一个具体的行动计划，在未来 24 小时内实践情绪自主性。'
        }
      ],
      benefits: ['增强独立性', '提升真实性', '减少外部控制感']
    };
  }
  
  /**
   * 生成能动性练习
   */
  _generateAgencyPractice() {
    return {
      name: '情绪能动性增强练习',
      nameEn: 'Emotional Agency Enhancement Practice',
      duration: '15 分钟',
      steps: [
        {
          step: 1,
          name: '控制感扫描',
          duration: '3 分钟',
          instruction: '回顾最近的情绪变化，识别哪些是你主动选择的，哪些是被动反应的。'
        },
        {
          step: 2,
          name: '所有权确认',
          duration: '4 分钟',
          instruction: '对每种情绪说："这个情绪属于我，它是我的体验的一部分。"'
        },
        {
          step: 3,
          name: '选择点识别',
          duration: '4 分钟',
          instruction: '识别情绪反应中的"选择点"——你可以在那里做出不同选择的时刻。'
        },
        {
          step: 4,
          name: '能动性宣言',
          duration: '4 分钟',
          instruction: '写下："我有能力选择如何回应我的情绪。我是自己情绪生活的主人。"'
        }
      ],
      benefits: ['增强控制感', '提升自我效能', '减少无助感']
    };
  }
  
  /**
   * 生成所有权练习
   */
  _generateOwnershipPractice() {
    return {
      name: '情绪所有权现象学练习',
      nameEn: 'Emotional Ownership Phenomenology Practice',
      duration: '15 分钟',
      steps: [
        {
          step: 1,
          name: '身体感受扫描',
          duration: '4 分钟',
          instruction: '闭上眼睛，扫描身体，注意情绪在身体中的具体位置和感受。'
        },
        {
          step: 2,
          name: '第一人称觉察',
          duration: '4 分钟',
          instruction: '注意情绪如何以第一人称方式向你呈现。不把它当作观察对象，而是作为你的体验。'
        },
        {
          step: 3,
          name: '为我性确认',
          duration: '4 分钟',
          instruction: '对自己说："这个情绪正在向我呈现，它是为我而存在的体验。"'
        },
        {
          step: 4,
          name: '深度沉浸',
          duration: '3 分钟',
          instruction: '允许自己完全沉浸在情绪体验中，不评判，不逃避，只是体验。'
        }
      ],
      benefits: ['增强情绪连接', '提升体验深度', '减少情绪疏离']
    };
  }
  
  // ============ 模块信息 ============
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'AutonomousEmotionAgencyModule',
      version: '5.0.6',
      description: '自主情绪与能动性整合模块 - 基于 SEP 自主性理论、现象学自我意识理论和能动性理论',
      theoreticalFoundations: [
        'SEP: Autonomy in Moral and Political Philosophy',
        'SEP: Self-Consciousness (Phenomenological Approaches)',
        'SEP: Agency',
        'Synofzik Dual-Factor Model (2008)',
        'Gross Process Model of Emotion Regulation',
        'Zahavi: Subjectivity and Selfhood (2005)',
        'Self-Determination Theory (Ryan & Deci, 2000)'
      ],
      capabilities: [
        '情绪自主性评估 (独立性/真实性/能力感/关系性)',
        '情绪能动性检测 (控制感/所有权感/自愿性/努力感)',
        '自主情绪调节策略推荐',
        '情绪所有权现象学分析 (为我性/第一人称给定性/非对象化/体验厚度)',
        '整合练习生成'
      ],
      dimensions: {
        autonomy: EmotionalAutonomyDimensions,
        agency: EmotionalAgencyDimensions,
        ownership: EmotionalOwnershipPhenomenologyDimensions,
        regulation: EmotionRegulationStrategies
      }
    };
  }
}

// ============ 导出 ============

module.exports = {
  AutonomousEmotionAgencyModule,
  EmotionalAutonomyDimensions,
  EmotionalAgencyDimensions,
  EmotionalOwnershipPhenomenologyDimensions,
  EmotionRegulationStrategies
};
