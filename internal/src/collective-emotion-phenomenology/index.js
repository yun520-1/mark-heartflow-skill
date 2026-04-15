/**
 * 集体情绪现象学模块 (Collective Emotion Phenomenology Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 集体意向性理论
 * 来源：Stanford Encyclopedia of Philosophy - Collective Intentionality (2024)
 * 
 * 核心理论框架:
 * - Scheler (1912): 共同悲伤 - 集体情绪不是个体情绪的聚合
 * - Walther (1923): 共享体验四条件 (体验 + 移情 + 认同 + 相互意识)
 * - Durkheim (1898): 集体意识 - 大众情绪中个体无法用个人观点解释
 * - Searle (1990): We-Intention - 不可还原为个体意向的集体意向
 * - Gilbert (1990): 联合承诺理论
 * - Schmid (2013): 信任框架分析
 * 
 * 核心功能:
 * - 集体情绪检测：识别"我们情绪"vs"个体情绪聚合"
 * - 移情 - 认同链分析：Walther 共享体验模型实现
 * - 集体情绪效价：区分积极/消极集体情绪
 * - 大众情绪识别：Durkheim 式集体意识检测
 * - 集体情绪干预：基于集体认同的调节策略
 * 
 * 关键区分:
 * - 真正集体情绪：不可还原的"我们感受"
 * - 情绪感染：个体情绪在群体中传播
 * - 情绪聚合：多个个体同时有相似情绪但无集体性
 * 
 * @module collective-emotion-phenomenology
 * @version 4.9.0
 * @since HeartFlow v4.9.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 集体情绪类型 (Types of Collective Emotion)
 * 基于 SEP 集体意向性理论的分类
 */
const CollectiveEmotionTypes = {
  /**
   * 真正集体情绪 (Genuine Collective Emotion)
   * Scheler 模型：共同悲伤的父母 - 一个情绪被多人共享
   * 特征：情绪主体是"我们"而非"我 + 你"
   */
  GENUINE_COLLECTIVE: 'genuine_collective',
  
  /**
   * 情绪感染 (Emotional Contagion)
   * 个体情绪在群体中传播，但保持个体性
   * 特征：因果链传递，无集体意向性
   */
  CONTAGION: 'contagion',
  
  /**
   * 情绪聚合 (Emotional Aggregation)
   * 多个个体同时有相似情绪但无集体性
   * 特征：平行发生，无相互意识
   */
  AGGREGATION: 'aggregation',
  
  /**
   * 大众情绪 (Mass Emotion)
   * Durkheim 模型：集体意识超越个体
   * 特征：个体无法用个人观点解释的情绪体验
   */
  MASS_EMOTION: 'mass_emotion',
  
  /**
   * 共享情绪 (Shared Emotion)
   * Walther 模型：需要移情 + 认同 + 相互意识
   * 特征：完整的共享体验结构
   */
  SHARED: 'shared'
};

/**
 * Walther 共享体验四条件 (Walther's Four Conditions for Shared Experience)
 * 基于 Gerda Walther (1923) 的现象学分析
 */
const WaltherConditions = {
  /**
   * 条件 1: 共同体验
   * A 体验 x，B 也体验 x
   */
  CO_EXPERIENCE: 'co_experience',
  
  /**
   * 条件 2: 移情
   * A 移情 B 的体验，B 也移情 A 的体验
   */
  EMPATHY: 'empathy',
  
  /**
   * 条件 3: 认同
   * A 认同 B 的体验，B 也认同 A 的体验
   */
  IDENTIFICATION: 'identification',
  
  /**
   * 条件 4: 相互意识
   * A 意识到 B 的认同，B 也意识到 A 的认同
   */
  MUTUAL_AWARENESS: 'mutual_awareness'
};

/**
 * 集体情绪效价类型 (Valence Types of Collective Emotion)
 */
const CollectiveValence = {
  /**
   * 积极集体情绪
   * 如：集体喜悦、团结感、共同希望
   */
  POSITIVE: 'positive',
  
  /**
   * 消极集体情绪
   * 如：集体悲伤、共同愤怒、群体焦虑
   */
  NEGATIVE: 'negative',
  
  /**
   * 混合集体情绪
   * 如：悲喜交加的集体体验
   */
  MIXED: 'mixed',
  
  /**
   * 中性集体情绪
   * 如：集体专注、共同好奇
   */
  NEUTRAL: 'neutral'
};

// ============ 集体情绪现象学分析器 ============

class CollectiveEmotionPhenomenology {
  constructor() {
    // 分析配置
    this.config = {
      // Walther 条件阈值
      waltherThreshold: 0.7,
      // 集体情绪阈值
      collectiveThreshold: 0.65,
      // 情绪感染阈值
      contagionThreshold: 0.5,
      // 条件权重
      conditionWeights: {
        coExperience: 0.25,
        empathy: 0.30,
        identification: 0.25,
        mutualAwareness: 0.20
      }
    };
    
    // 集体情绪理论知识库
    this.theoryBase = this._initializeTheoryBase();
  }
  
  /**
   * 初始化理论知识库
   */
  _initializeTheoryBase() {
    return {
      // 集体情绪原型案例
      prototypes: {
        // Scheler 共同悲伤
        scheler_grief: {
          type: CollectiveEmotionTypes.GENUINE_COLLECTIVE,
          description: '父母在垂死孩子的病床前共同悲伤',
          features: {
            irreducibility: '悲伤不是"我的 + 你的"，而是"我们的"',
            unity: '一个情绪被两人共享',
            nonInstrumental: '不是为了对方而悲伤，而是一起悲伤'
          },
          waltherConditions: {
            coExperience: 1.0,
            empathy: 0.9,
            identification: 0.9,
            mutualAwareness: 0.8
          }
        },
        
        // 八月狂热 (Scheler 分析的一战爆发时集体狂热)
        august_madness: {
          type: CollectiveEmotionTypes.MASS_EMOTION,
          description: '1914 年 8 月一战爆发时欧洲各国的集体狂热',
          features: {
            durkheimian: '集体意识超越个体理性',
            uncontrollable: '个体无法用个人观点解释',
            collectiveEffervescence: '集体兴奋状态'
          },
          waltherConditions: {
            coExperience: 0.9,
            empathy: 0.4, // 低移情，更多是感染
            identification: 0.7,
            mutualAwareness: 0.3 // 低相互意识
          }
        },
        
        // 团队胜利喜悦
        team_victory: {
          type: CollectiveEmotionTypes.SHARED,
          description: '球队获胜后队员共同的喜悦',
          features: {
            weIntention: '我们一起赢了',
            jointCommitment: '共同的训练和承诺',
            mutualRecognition: '相互承认贡献'
          },
          waltherConditions: {
            coExperience: 1.0,
            empathy: 0.8,
            identification: 0.9,
            mutualAwareness: 0.9
          }
        },
        
        // 音乐会观众情绪感染
        concert_contagion: {
          type: CollectiveEmotionTypes.CONTAGION,
          description: '音乐会观众被表演者情绪感染',
          features: {
            causalChain: '从表演者到观众的单向传递',
            noJointCommitment: '无联合承诺',
            parallelExperience: '平行体验而非共享'
          },
          waltherConditions: {
            coExperience: 0.8,
            empathy: 0.5,
            identification: 0.4,
            mutualAwareness: 0.2
          }
        },
        
        // 社交媒体愤怒聚合
        social_media_aggregation: {
          type: CollectiveEmotionTypes.AGGREGATION,
          description: '社交媒体上多人对同一事件的愤怒',
          features: {
            simultaneous: '同时发生但无协调',
            noMutualAwareness: '彼此不知道对方存在',
            commonCause: '共同原因但无集体意向'
          },
          waltherConditions: {
            coExperience: 0.7,
            empathy: 0.2,
            identification: 0.2,
            mutualAwareness: 0.1
          }
        }
      }
    };
  }
  
  /**
   * 分析用户描述中的集体情绪
   * 
   * @param {string} userDescription - 用户描述
   * @param {object} context - 上下文信息
   * @returns {object} 集体情绪分析结果
   */
  analyzeCollectiveEmotion(userDescription, context = {}) {
    const analysis = {
      description: userDescription,
      analysisTime: new Date().toISOString(),
      
      // 集体情绪类型判定
      typeDetection: {
        detected: false,
        type: null,
        confidence: 0,
        alternativeTypes: []
      },
      
      // Walther 条件评估
      waltherAssessment: this._initializeWaltherAssessment(),
      
      // 集体情绪特征分析
      featureAnalysis: {
        irreducibility: 0,    // 不可还原性
        unity: 0,             // 统一性
        jointCommitment: 0,   // 联合承诺
        mutualObligation: 0,  // 相互义务
        trustLevel: 0         // 信任水平
      },
      
      // 效价分析
      valenceAnalysis: {
        type: CollectiveValence.NEUTRAL,
        score: 0,
        indicators: []
      },
      
      // 理论归属
      theoreticalAlignment: {
        scheler: 0,      // Scheler 共同情绪模型匹配度
        walther: 0,      // Walther 共享体验模型匹配度
        durkheim: 0,     // Durkheim 集体意识模型匹配度
        searle: 0,       // Searle 我们意向模型匹配度
        gilbert: 0       // Gilbert 联合承诺模型匹配度
      },
      
      // 干预建议
      intervention: {
        needed: false,
        type: null,
        suggestions: []
      }
    };
    
    const lowerDesc = userDescription.toLowerCase();
    
    // === 1. 语言标记分析 ===
    const linguisticMarkers = this._analyzeLinguisticMarkers(lowerDesc);
    
    // === 2. Walther 条件评估 ===
    const waltherScores = this._evaluateWaltherConditions(userDescription, context);
    analysis.waltherAssessment = waltherScores;
    
    // === 3. 集体情绪类型判定 ===
    const typeDetection = this._detectCollectiveEmotionType(
      linguisticMarkers,
      waltherScores,
      context
    );
    analysis.typeDetection = typeDetection;
    
    // === 4. 特征分析 ===
    analysis.featureAnalysis = this._analyzeCollectiveFeatures(
      userDescription,
      typeDetection,
      waltherScores
    );
    
    // === 5. 效价分析 ===
    analysis.valenceAnalysis = this._analyzeValence(userDescription, context);
    
    // === 6. 理论归属分析 ===
    analysis.theoreticalAlignment = this._analyzeTheoreticalAlignment(
      waltherScores,
      analysis.featureAnalysis
    );
    
    // === 7. 干预建议 ===
    analysis.intervention = this._generateIntervention(
      typeDetection,
      analysis.featureAnalysis,
      analysis.valenceAnalysis,
      context
    );
    
    return analysis;
  }
  
  /**
   * 初始化 Walther 评估
   */
  _initializeWaltherAssessment() {
    return {
      [WaltherConditions.CO_EXPERIENCE]: {
        score: 0,
        maxScore: 1.0,
        indicators: [],
        assessment: 'not_assessed'
      },
      [WaltherConditions.EMPATHY]: {
        score: 0,
        maxScore: 1.0,
        indicators: [],
        assessment: 'not_assessed'
      },
      [WaltherConditions.IDENTIFICATION]: {
        score: 0,
        maxScore: 1.0,
        indicators: [],
        assessment: 'not_assessed'
      },
      [WaltherConditions.MUTUAL_AWARENESS]: {
        score: 0,
        maxScore: 1.0,
        indicators: [],
        assessment: 'not_assessed'
      },
      overallScore: 0,
      isSharedExperience: false
    };
  }
  
  /**
   * 分析语言标记
   */
  _analyzeLinguisticMarkers(description) {
    const markers = {
      weIntention: 0,
      collectiveNouns: 0,
      sharedAction: 0,
      mutualReference: 0
    };
    
    // 我们意向标记
    const weMarkers = [
      { pattern: /我们 (一起 | 共同 | 联合)/g, weight: 3 },
      { pattern: /咱们/g, weight: 2 },
      { pattern: /我俩 | 我们俩/g, weight: 2 },
      { pattern: /大家一起/g, weight: 1.5 }
    ];
    weMarkers.forEach(({ pattern, weight }) => {
      const matches = description.match(pattern);
      if (matches) markers.weIntention += matches.length * weight;
    });
    
    // 集体名词
    const collectiveNouns = [
      { pattern: /团队 | 团体 | 集体 | 群体 | 家庭 | 社区/g, weight: 2 },
      { pattern: /我们 (的 | 家 | 团队 | 群体)/g, weight: 2 }
    ];
    collectiveNouns.forEach(({ pattern, weight }) => {
      const matches = description.match(pattern);
      if (matches) markers.collectiveNouns += matches.length * weight;
    });
    
    // 共享行动
    const sharedActions = [
      { pattern: /共同 (经历 | 感受 | 体验 | 面对 | 承担)/g, weight: 3 },
      { pattern: /一起 (哭 | 笑 | 难过 | 开心 | 愤怒)/g, weight: 3 },
      { pattern: /互相 (支持 | 理解 | 安慰)/g, weight: 2 }
    ];
    sharedActions.forEach(({ pattern, weight }) => {
      const matches = description.match(pattern);
      if (matches) markers.sharedAction += matches.length * weight;
    });
    
    // 相互指涉
    const mutualRefs = [
      { pattern: /彼此 | 互相 | 相互/g, weight: 2 },
      { pattern: /他 (也 | 都) | 她 (也 | 都)/g, weight: 1 }
    ];
    mutualRefs.forEach(({ pattern, weight }) => {
      const matches = description.match(pattern);
      if (matches) markers.mutualReference += matches.length * weight;
    });
    
    return markers;
  }
  
  /**
   * 评估 Walther 条件
   */
  _evaluateWaltherConditions(description, context) {
    const assessment = this._initializeWaltherAssessment();
    const lowerDesc = description.toLowerCase();
    
    // === 条件 1: 共同体验 ===
    const coExperienceIndicators = [
      /共同 (经历 | 体验 | 感受)/g,
      /一起 (经历 | 面对 | 度过)/g,
      /我们 (都 | 也) (感到 | 觉得 | 体验)/g,
      /同时 (感到 | 觉得)/g
    ];
    coExperienceIndicators.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        assessment[WaltherConditions.CO_EXPERIENCE].indicators.push(pattern.source);
        assessment[WaltherConditions.CO_EXPERIENCE].score += 0.25;
      }
    });
    assessment[WaltherConditions.CO_EXPERIENCE].score = Math.min(1.0, assessment[WaltherConditions.CO_EXPERIENCE].score);
    
    // === 条件 2: 移情 ===
    const empathyIndicators = [
      /理解 (他 | 她) 的 (感受 | 心情 | 痛苦)/g,
      /能 (体会 | 感受 | 明白) (他 | 她)/g,
      / (他 | 她) 的 (感受 | 心情) 感染了我/g,
      /感同身受 | 将心比心/g
    ];
    empathyIndicators.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        assessment[WaltherConditions.EMPATHY].indicators.push(pattern.source);
        assessment[WaltherConditions.EMPATHY].score += 0.25;
      }
    });
    assessment[WaltherConditions.EMPATHY].score = Math.min(1.0, assessment[WaltherConditions.EMPATHY].score);
    
    // === 条件 3: 认同 ===
    const identificationIndicators = [
      /我们 (的 | 共同) (感受 | 心情 | 情绪)/g,
      /这 (也 | 就) 是 (我 | 我们) 的 (感受 | 心情)/g,
      / (我 | 我们) 的 (感受 | 心情) 是 (一样 | 相同 | 相似) 的/g,
      /认同 (他 | 她) 的 (感受 | 观点)/g
    ];
    identificationIndicators.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        assessment[WaltherConditions.IDENTIFICATION].indicators.push(pattern.source);
        assessment[WaltherConditions.IDENTIFICATION].score += 0.25;
      }
    });
    assessment[WaltherConditions.IDENTIFICATION].score = Math.min(1.0, assessment[WaltherConditions.IDENTIFICATION].score);
    
    // === 条件 4: 相互意识 ===
    const mutualAwarenessIndicators = [
      / (他 | 她) 知道 (我 | 我们) 的 (感受 | 心情)/g,
      /彼此 (都 | 也) (知道 | 明白 | 理解)/g,
      /互相 (知道 | 了解 | 意识) 到/g,
      /我们 (都 | 也) 知道对方/g
    ];
    mutualAwarenessIndicators.forEach(pattern => {
      if (pattern.test(lowerDesc)) {
        assessment[WaltherConditions.MUTUAL_AWARENESS].indicators.push(pattern.source);
        assessment[WaltherConditions.MUTUAL_AWARENESS].score += 0.25;
      }
    });
    assessment[WaltherConditions.MUTUAL_AWARENESS].score = Math.min(1.0, assessment[WaltherConditions.MUTUAL_AWARENESS].score);
    
    // 计算总体分数
    const { conditionWeights } = this.config;
    assessment.overallScore = 
      assessment[WaltherConditions.CO_EXPERIENCE].score * conditionWeights.coExperience +
      assessment[WaltherConditions.EMPATHY].score * conditionWeights.empathy +
      assessment[WaltherConditions.IDENTIFICATION].score * conditionWeights.identification +
      assessment[WaltherConditions.MUTUAL_AWARENESS].score * conditionWeights.mutualAwareness;
    
    assessment.isSharedExperience = assessment.overallScore >= this.config.waltherThreshold;
    
    // 设置评估等级
    this._setWaltherAssessmentLevel(assessment[WaltherConditions.CO_EXPERIENCE]);
    this._setWaltherAssessmentLevel(assessment[WaltherConditions.EMPATHY]);
    this._setWaltherAssessmentLevel(assessment[WaltherConditions.IDENTIFICATION]);
    this._setWaltherAssessmentLevel(assessment[WaltherConditions.MUTUAL_AWARENESS]);
    
    return assessment;
  }
  
  /**
   * 设置 Walther 评估等级
   */
  _setWaltherAssessmentLevel(condition) {
    const score = condition.score;
    if (score >= 0.8) condition.assessment = 'strong';
    else if (score >= 0.6) condition.assessment = 'moderate';
    else if (score >= 0.4) condition.assessment = 'weak';
    else condition.assessment = 'absent';
  }
  
  /**
   * 检测集体情绪类型
   */
  _detectCollectiveEmotionType(linguisticMarkers, waltherScores, context) {
    const result = {
      detected: false,
      type: null,
      confidence: 0,
      alternativeTypes: []
    };
    
    const { overallScore: waltherScore } = waltherScores;
    const { weIntention, collectiveNouns, sharedAction, mutualReference } = linguisticMarkers;
    
    // 计算各类型的分数
    const typeScores = {
      [CollectiveEmotionTypes.GENUINE_COLLECTIVE]: this._scoreGenuineCollective(waltherScores, linguisticMarkers),
      [CollectiveEmotionTypes.SHARED]: this._scoreShared(waltherScores, linguisticMarkers),
      [CollectiveEmotionTypes.MASS_EMOTION]: this._scoreMassEmotion(waltherScores, linguisticMarkers),
      [CollectiveEmotionTypes.CONTAGION]: this._scoreContagion(waltherScores, linguisticMarkers),
      [CollectiveEmotionTypes.AGGREGATION]: this._scoreAggregation(waltherScores, linguisticMarkers)
    };
    
    // 找出最高分类型
    const sortedTypes = Object.entries(typeScores).sort((a, b) => b[1] - a[1]);
    const [topType, topScore] = sortedTypes[0];
    
    if (topScore >= this.config.collectiveThreshold) {
      result.detected = true;
      result.type = topType;
      result.confidence = topScore;
      result.alternativeTypes = sortedTypes.slice(1, 3).map(([type, score]) => ({
        type,
        score,
        confidence: score >= this.config.collectiveThreshold ? 'possible' : 'unlikely'
      }));
    }
    
    return result;
  }
  
  /**
   * 评分：真正集体情绪
   */
  _scoreGenuineCollective(walther, linguistic) {
    // Scheler 模型：高共同体验 + 高认同 + 不可还原性标记
    const baseScore = (
      walther[WaltherConditions.CO_EXPERIENCE].score * 0.35 +
      walther[WaltherConditions.IDENTIFICATION].score * 0.35 +
      walther[WaltherConditions.EMPATHY].score * 0.15 +
      walther[WaltherConditions.MUTUAL_AWARENESS].score * 0.15
    );
    
    // 不可还原性标记 bonus
    let irreducibilityBonus = 0;
    if (/我们的 (感受 | 心情 | 悲伤 | 喜悦)/.test(linguistic.weIntention)) irreducibilityBonus += 0.1;
    if (/不是.*而是.*一起/.test(linguistic.sharedAction)) irreducibilityBonus += 0.1;
    
    return Math.min(1.0, baseScore + irreducibilityBonus);
  }
  
  /**
   * 评分：共享情绪
   */
  _scoreShared(walther, linguistic) {
    // Walther 模型：四条件均衡高分
    const { coExperience, empathy, identification, mutualAwareness } = walther;
    const balance = 1 - (Math.max(coExperience.score, empathy.score, identification.score, mutualAwareness.score) - 
                         Math.min(coExperience.score, empathy.score, identification.score, mutualAwareness.score));
    
    return walther.overallScore * 0.8 + balance * 0.2;
  }
  
  /**
   * 评分：大众情绪
   */
  _scoreMassEmotion(walther, linguistic) {
    // Durkheim 模型：高共同体验 + 低相互意识 + 集体名词
    const baseScore = (
      walther[WaltherConditions.CO_EXPERIENCE].score * 0.4 +
      (1 - walther[WaltherConditions.MUTUAL_AWARENESS].score) * 0.3 +
      Math.min(1.0, linguistic.collectiveNouns / 3) * 0.3
    );
    return baseScore;
  }
  
  /**
   * 评分：情绪感染
   */
  _scoreContagion(walther, linguistic) {
    // 感染模型：中等共同体验 + 低移情/认同/相互意识
    const baseScore = (
      walther[WaltherConditions.CO_EXPERIENCE].score * 0.4 +
      (1 - walther[WaltherConditions.EMPATHY].score) * 0.2 +
      (1 - walther[WaltherConditions.IDENTIFICATION].score) * 0.2 +
      (1 - walther[WaltherConditions.MUTUAL_AWARENESS].score) * 0.2
    );
    return baseScore;
  }
  
  /**
   * 评分：情绪聚合
   */
  _scoreAggregation(walther, linguistic) {
    // 聚合模型：低 Walther 分数 + 同时性标记
    const waltherPenalty = 1 - walther.overallScore;
    const simultaneityBonus = /同时 | 都 | 一起 (但 | 却)/.test(linguistic.sharedAction) ? 0.2 : 0;
    return waltherPenalty * 0.7 + simultaneityBonus;
  }
  
  /**
   * 分析集体情绪特征
   */
  _analyzeCollectiveFeatures(description, typeDetection, waltherScores) {
    const features = {
      irreducibility: 0,
      unity: 0,
      jointCommitment: 0,
      mutualObligation: 0,
      trustLevel: 0
    };
    
    const lowerDesc = description.toLowerCase();
    
    // 不可还原性
    if (/我们的.*不是.*而是/.test(lowerDesc)) features.irreducibility = 0.9;
    else if (/一起.*感受/.test(lowerDesc)) features.irreducibility = 0.7;
    else features.irreducibility = waltherScores[WaltherConditions.IDENTIFICATION].score * 0.7;
    
    // 统一性
    features.unity = (
      waltherScores[WaltherConditions.CO_EXPERIENCE].score * 0.4 +
      waltherScores[WaltherConditions.IDENTIFICATION].score * 0.4 +
      waltherScores[WaltherConditions.MUTUAL_AWARENESS].score * 0.2
    );
    
    // 联合承诺
    if (/承诺 | 约定 | 决定一起/.test(lowerDesc)) features.jointCommitment = 0.9;
    else if (/共同 (目标 | 计划 | 努力)/.test(lowerDesc)) features.jointCommitment = 0.7;
    else features.jointCommitment = waltherScores.overallScore * 0.6;
    
    // 相互义务
    if (/应该 | 必须 | 有责任.*一起/.test(lowerDesc)) features.mutualObligation = 0.8;
    else if (/彼此.*支持 | 互相.*帮助/.test(lowerDesc)) features.mutualObligation = 0.6;
    else features.mutualObligation = waltherScores[WaltherConditions.MUTUAL_AWARENESS].score * 0.5;
    
    // 信任水平 (Schmid 信任框架)
    if (/信任 | 相信 | 放心/.test(lowerDesc)) features.trustLevel = 0.9;
    else if (/可靠 | 依赖/.test(lowerDesc)) features.trustLevel = 0.7;
    else features.trustLevel = waltherScores[WaltherConditions.EMPATHY].score * 0.6;
    
    return features;
  }
  
  /**
   * 分析效价
   */
  _analyzeValence(description, context) {
    const result = {
      type: CollectiveValence.NEUTRAL,
      score: 0,
      indicators: []
    };
    
    const lowerDesc = description.toLowerCase();
    
    // 积极情绪标记
    const positiveMarkers = [
      /喜悦 | 开心 | 快乐 | 幸福 | 兴奋 | 激动 | 自豪 | 骄傲/g,
      /希望 | 期待 | 乐观 | 信心/g,
      /团结 | 凝聚 | 归属 | 支持/g
    ];
    let positiveScore = 0;
    positiveMarkers.forEach(pattern => {
      const matches = lowerDesc.match(pattern);
      if (matches) {
        positiveScore += matches.length * 0.2;
        result.indicators.push(`积极标记：${matches[0]}`);
      }
    });
    
    // 消极情绪标记
    const negativeMarkers = [
      /悲伤 | 难过 | 痛苦 | 悲痛 | 哀伤/g,
      /愤怒 | 生气 | 愤慨 | 不满/g,
      /焦虑 | 恐惧 | 害怕 | 担忧/g,
      /失望 | 绝望 | 无助/g
    ];
    let negativeScore = 0;
    negativeMarkers.forEach(pattern => {
      const matches = lowerDesc.match(pattern);
      if (matches) {
        negativeScore += matches.length * 0.2;
        result.indicators.push(`消极标记：${matches[0]}`);
      }
    });
    
    // 计算净效价
    const netScore = positiveScore - negativeScore;
    result.score = netScore;
    
    if (netScore > 0.3) result.type = CollectiveValence.POSITIVE;
    else if (netScore < -0.3) result.type = CollectiveValence.NEGATIVE;
    else if (positiveScore > 0.3 && negativeScore > 0.3) result.type = CollectiveValence.MIXED;
    else result.type = CollectiveValence.NEUTRAL;
    
    return result;
  }
  
  /**
   * 分析理论归属
   */
  _analyzeTheoreticalAlignment(waltherScores, features) {
    return {
      scheler: (features.irreducibility + features.unity) / 2,
      walther: waltherScores.overallScore,
      durkheim: (1 - waltherScores[WaltherConditions.MUTUAL_AWARENESS].score) * 0.5 + features.unity * 0.5,
      searle: waltherScores[WaltherConditions.CO_EXPERIENCE].score * 0.5 + features.jointCommitment * 0.5,
      gilbert: (features.jointCommitment + features.mutualObligation) / 2
    };
  }
  
  /**
   * 生成干预建议
   */
  _generateIntervention(typeDetection, features, valence, context) {
    const intervention = {
      needed: false,
      type: null,
      suggestions: []
    };
    
    // 消极集体情绪需要干预
    if (valence.type === CollectiveValence.NEGATIVE && features.unity > 0.6) {
      intervention.needed = true;
      intervention.type = 'collective_regulation';
      intervention.suggestions = [
        '集体情绪调节：引导群体关注积极应对策略',
        '增强相互支持：强化群体内的移情和理解',
        '重构集体叙事：从"共同受害"转向"共同应对"',
        '建立集体效能感：强调群体的应对资源和能力'
      ];
    }
    
    // 大众情绪 (可能非理性) 需要觉察
    if (typeDetection.type === CollectiveEmotionTypes.MASS_EMOTION) {
      intervention.needed = true;
      intervention.type = 'awareness_building';
      intervention.suggestions = [
        '集体情绪觉察：帮助识别情绪来源和影响',
        '个体反思空间：在集体情绪中保持个体判断',
        '多元视角引入：避免集体思维的单一化'
      ];
    }
    
    // 低信任集体情绪需要建设
    if (features.trustLevel < 0.5 && typeDetection.detected) {
      intervention.needed = true;
      intervention.type = 'trust_building';
      intervention.suggestions = [
        '信任建设：增加群体内的透明度和可靠性',
        '联合承诺强化：明确共同目标和责任',
        '相互认可：增强成员间的价值认可'
      ];
    }
    
    return intervention;
  }
  
  // ============ 导出 ============
  
  getInfo() {
    return {
      name: 'CollectiveEmotionPhenomenology',
      version: '4.9.0',
      description: '集体情绪现象学模块 - 基于 SEP 集体意向性理论',
      theoreticalFoundations: [
        'Scheler (1912): 共同悲伤理论',
        'Walther (1923): 共享体验四条件',
        'Durkheim (1898): 集体意识理论',
        'Searle (1990): We-Intention 理论',
        'Gilbert (1990): 联合承诺理论',
        'Schmid (2013): 信任框架分析'
      ],
      capabilities: [
        '集体情绪类型检测',
        'Walther 条件评估',
        '集体情绪特征分析',
        '效价分析',
        '理论归属分析',
        '干预建议生成'
      ],
      config: this.config
    };
  }
}

// ============ 导出 ============

module.exports = {
  CollectiveEmotionPhenomenology,
  CollectiveEmotionTypes,
  WaltherConditions,
  CollectiveValence
};
