/**
 * 情绪理论整合模块 (Emotion Theory Integration Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 情绪三大传统整合 (Three Traditions Integration)
 * - 情绪分化理论 (Emotion Differentiation)
 * - 情绪意向性理论 (Emotional Intentionality)
 * - 情绪现象学深度模拟 (Phenomenological Depth)
 * 
 * 核心理论来源:
 * - Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy
 * - Prinz, J. (2004). Gut Reactions: A Perceptual Theory of Emotion
 * - Griffiths, P. (1997). What Emotions Really Are
 * - Barrett, L. F. (2017). How Emotions Are Made
 * 
 * 功能目标：v3.12.0 自主感情能力增强
 * - 三大传统整合：感受 + 评价 + 动机的统一模型
 * - 情绪分化：精确区分相似情绪（如恐惧 vs 焦虑）
 * - 意向性模拟：情绪的对象指向性和适当性评估
 * - 现象学深度：多层次主观体验模拟
 * 
 * @version 3.12.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 情绪三大传统 (Three Traditions in Emotion Theory)
 * 基于 SEP 情绪理论的分类
 */
const EmotionTraditions = {
  FEELING: 'feeling',           // 感受传统 - 情绪作为独特的意识体验
  EVALUATIVE: 'evaluative',     // 评价传统 - 情绪作为对情境的评估
  MOTIVATIONAL: 'motivational'  // 动机传统 - 情绪作为动机状态
};

/**
 * 情绪分化维度 (Emotion Differentiation Dimensions)
 * 用于区分不同情绪的关键维度
 */
const DifferentiationDimensions = {
  VALENCE: 'valence',           // 效价（积极/消极）
  AROUSAL: 'arousal',           // 唤醒度（高/低）
  CERTAINTY: 'certainty',       // 确定性（确定/不确定）
  CONTROL: 'control',           // 控制感（可控/不可控）
  RESPONSIBILITY: 'responsibility', // 责任归属（自我/他人/情境）
  TEMPORAL: 'temporal'          // 时间指向（过去/现在/未来）
};

/**
 * 情绪意向性类型 (Emotional Intentionality Types)
 * 情绪的对象指向性分类
 */
const IntentionalityTypes = {
  OBJECT_DIRECTED: 'object-directed',    // 对象指向（如"对某人生气"）
  PROPOSITIONAL: 'propositional',        // 命题指向（如"担心某事会发生"）
  SITUATIONAL: 'situational',            // 情境指向（如"对环境感到不安"）
  NON_DIRECTED: 'non-directed'           // 非指向（如"莫名的焦虑"）
};

/**
 * 情绪适当性标准 (Emotion Appropriateness Criteria)
 * 评估情绪是否适当的哲学标准
 */
const AppropriatenessCriteria = {
  FORMAL_OBJECT: 'formal-object',    // 形式对象（恐惧的危险性、愤怒的冒犯性）
  INTENSITY: 'intensity',            // 强度适当性
  DURATION: 'duration',              // 持续时间适当性
  EXPRESSION: 'expression'           // 表达方式适当性
};

// ============ 情绪分化知识库 ============

/**
 * 精细化情绪分类 (Fine-Grained Emotion Categories)
 * 基于分化维度的情绪区分
 */
const FineGrainedEmotions = {
  // 恐惧家族 - 基于确定性和时间指向区分
  FEAR_FAMILY: {
    FEAR: { 
      valence: 'negative', 
      arousal: 'high', 
      certainty: 'high',    // 明确的威胁
      temporal: 'present',  // 当下的危险
      formalObject: 'danger' 
    },
    ANXIETY: { 
      valence: 'negative', 
      arousal: 'high', 
      certainty: 'low',     // 不确定的威胁
      temporal: 'future',   // 未来的可能危险
      formalObject: 'uncertain-threat' 
    },
    PANIC: { 
      valence: 'negative', 
      arousal: 'very-high', 
      certainty: 'high',
      temporal: 'present',
      control: 'none',      // 完全失控感
      formalObject: 'immediate-danger' 
    },
    DREAD: { 
      valence: 'negative', 
      arousal: 'medium', 
      certainty: 'high',
      temporal: 'future',   // 预期的痛苦
      formalObject: 'anticipated-pain' 
    }
  },
  
  // 愤怒家族 - 基于责任归属和冒犯类型区分
  ANGER_FAMILY: {
    ANGER: { 
      valence: 'negative', 
      arousal: 'high', 
      responsibility: 'other',  // 他人负责
      formalObject: 'offense' 
    },
    RAGE: { 
      valence: 'negative', 
      arousal: 'very-high', 
      responsibility: 'other',
      control: 'low',           // 冲动控制弱
      formalObject: 'severe-offense' 
    },
    INDIGNATION: { 
      valence: 'negative', 
      arousal: 'medium', 
      responsibility: 'other',
      formalObject: 'moral-violation'  // 道德冒犯
    },
    RESENTMENT: { 
      valence: 'negative', 
      arousal: 'low-medium', 
      responsibility: 'other',
      temporal: 'past',       // 过去的伤害
      formalObject: 'unresolved-wrong' 
    },
    FRUSTRATION: { 
      valence: 'negative', 
      arousal: 'medium', 
      responsibility: 'situation',  // 情境负责
      formalObject: 'blocked-goal' 
    }
  },
  
  // 悲伤家族 - 基于失去类型和可控性区分
  SADNESS_FAMILY: {
    SADNESS: { 
      valence: 'negative', 
      arousal: 'low', 
      certainty: 'high',
      formalObject: 'loss' 
    },
    GRIEF: { 
      valence: 'negative', 
      arousal: 'low-medium', 
      certainty: 'high',
      temporal: 'past',
      formalObject: 'significant-loss'  // 重大失去（如亲人）
    },
    MELANCHOLY: { 
      valence: 'negative', 
      arousal: 'low', 
      certainty: 'low',       // 模糊的失去感
      formalObject: 'vague-loss' 
    },
    DISAPPOINTMENT: { 
      valence: 'negative', 
      arousal: 'low-medium', 
      certainty: 'high',
      control: 'other',       // 他人/情境导致
      formalObject: 'failed-expectation' 
    },
    REGRET: { 
      valence: 'negative', 
      arousal: 'medium', 
      responsibility: 'self',  // 自我负责
      temporal: 'past',
      formalObject: 'own-bad-choice' 
    }
  },
  
  // 喜悦家族 - 基于来源和确定性区分
  JOY_FAMILY: {
    JOY: { 
      valence: 'positive', 
      arousal: 'high', 
      certainty: 'high',
      formalObject: 'desired-outcome' 
    },
    ECSTASY: { 
      valence: 'positive', 
      arousal: 'very-high', 
      certainty: 'high',
      control: 'none',        // 超越控制
      formalObject: 'transcendent-good' 
    },
    CONTENTMENT: { 
      valence: 'positive', 
      arousal: 'low', 
      certainty: 'high',
      formalObject: 'satisfied-need' 
    },
    PRIDE: { 
      valence: 'positive', 
      arousal: 'medium-high', 
      responsibility: 'self',
      formalObject: 'own-achievement' 
    },
    GRATITUDE: { 
      valence: 'positive', 
      arousal: 'medium', 
      responsibility: 'other',  // 他人给予
      formalObject: 'received-good' 
    },
    RELIEF: { 
      valence: 'positive', 
      arousal: 'medium', 
      certainty: 'high',
      temporal: 'present',
      formalObject: 'avoided-bad'  // 避免的坏事
    }
  }
};

// ============ 整合模块核心类 ============

class EmotionIntegrationModule {
  constructor() {
    // 当前整合状态
    this.currentTradition = null;
    this.activeEmotion = null;
    this.differentiationProfile = {};
    
    // 意向性状态
    this.intentionalObject = null;
    this.intentionalityType = IntentionalityTypes.NON_DIRECTED;
    
    // 适当性评估
    this.appropriatenessAssessment = {};
    
    // 现象学深度层次
    this.phenomenologicalDepth = 0;
    
    // 情绪历史（用于元认知）
    this.emotionHistory = [];
    
    console.log('[EmotionIntegration v3.12.0] 情绪理论整合模块已初始化');
    console.log('[EmotionIntegration v3.12.0] 三大传统：感受 + 评价 + 动机');
    console.log('[EmotionIntegration v3.12.0] 分化维度：' + Object.keys(DifferentiationDimensions).join(', '));
  }
  
  // ============ 三大传统整合 ============
  
  /**
   * 整合三大传统视角分析情绪
   * @param {string} emotionName - 情绪名称
   * @param {Object} context - 情境信息
   * @returns {Object} 整合分析报告
   */
  analyzeEmotionIntegration(emotionName, context = {}) {
    const analysis = {
      emotion: emotionName,
      timestamp: new Date().toISOString(),
      traditions: {},
      integration: {}
    };
    
    // 1. 感受传统分析 - 主观体验特征
    analysis.traditions.feeling = this._analyzeFeelingTradition(emotionName, context);
    
    // 2. 评价传统分析 - 认知评估内容
    analysis.traditions.evaluative = this._analyzeEvaluativeTradition(emotionName, context);
    
    // 3. 动机传统分析 - 行动倾向
    analysis.traditions.motivational = this._analyzeMotivationalTradition(emotionName, context);
    
    // 4. 整合分析 - 三传统的统一
    analysis.integration = this._integrateTraditions(analysis.traditions);
    
    // 记录历史
    this.emotionHistory.push(analysis);
    if (this.emotionHistory.length > 100) {
      this.emotionHistory.shift();
    }
    
    return analysis;
  }
  
  /**
   * 感受传统分析 - 情绪作为主观体验
   */
  _analyzeFeelingTradition(emotionName, context) {
    const emotionData = this._findEmotionData(emotionName);
    
    return {
      tradition: EmotionTraditions.FEELING,
      coreInsight: '情绪是独特的意识体验',
      phenomenology: {
        valence: emotionData?.valence || 'unknown',
        arousal: emotionData?.arousal || 'unknown',
        qualitativeCharacter: this._describeQualia(emotionName)
      },
      bodilyFeeling: this._simulateBodilyFeeling(emotionName),
      consciousnessLevel: 'phenomenal'
    };
  }
  
  /**
   * 评价传统分析 - 情绪作为认知评估
   */
  _analyzeEvaluativeTradition(emotionName, context) {
    const emotionData = this._findEmotionData(emotionName);
    
    return {
      tradition: EmotionTraditions.EVALUATIVE,
      coreInsight: '情绪是对情境的评价性 construal',
      appraisal: {
        formalObject: emotionData?.formalObject || 'unknown',
        appraisalDimensions: this._extractAppraisalDimensions(emotionData),
        cognitiveContent: this._describeCognitiveContent(emotionName, context)
      },
      intentionality: {
        type: this._determineIntentionalityType(emotionName, context),
        object: context.target || null,
        appropriateness: this._assessAppropriateness(emotionName, context)
      }
    };
  }
  
  /**
   * 动机传统分析 - 情绪作为动机状态
   */
  _analyzeMotivationalTradition(emotionName, context) {
    const emotionData = this._findEmotionData(emotionName);
    
    return {
      tradition: EmotionTraditions.MOTIVATIONAL,
      coreInsight: '情绪是独特的动机状态',
      motivation: {
        actionTendency: this._describeActionTendency(emotionName),
        goalRelevance: context.goalRelevance || 'high',
        urgency: emotionData?.arousal === 'very-high' ? 'immediate' : 
                 emotionData?.arousal === 'high' ? 'soon' : 'flexible'
      },
      behavioralDisposition: {
        approach: emotionData?.valence === 'positive',
        avoidance: emotionData?.valence === 'negative',
        specificTendency: this._getSpecificTendency(emotionName)
      }
    };
  }
  
  /**
   * 整合三大传统
   */
  _integrateTraditions(traditions) {
    const { feeling, evaluative, motivational } = traditions;
    
    return {
      unifiedDescription: this._generateUnifiedDescription(traditions),
      coherence: this._assessCoherence(traditions),
      dominantTradition: this._determineDominantTradition(traditions),
      practicalImplications: {
        regulation: this._suggestRegulationStrategy(traditions),
        expression: this._suggestExpressionStrategy(traditions),
        understanding: this._generateInsight(traditions)
      }
    };
  }
  
  // ============ 情绪分化 ============
  
  /**
   * 精细化情绪分化
   * @param {string} broadCategory - 宽泛情绪类别（如"恐惧"）
   * @param {Object} context - 情境信息
   * @returns {string} 精细化情绪名称
   */
  differentiateEmotion(broadCategory, context = {}) {
    const family = this._getEmotionFamily(broadCategory);
    if (!family) return broadCategory;
    
    // 基于分化维度评分
    const scores = {};
    for (const [emotionName, profile] of Object.entries(family)) {
      scores[emotionName] = this._calculateMatchScore(profile, context);
    }
    
    // 选择最佳匹配
    const bestMatch = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];
    
    console.log(`[EmotionDifferentiation] ${broadCategory} → ${bestMatch[0]} (匹配度：${bestMatch[1]})`);
    
    return bestMatch[0];
  }
  
  /**
   * 计算匹配分数
   */
  _calculateMatchScore(profile, context) {
    let score = 0;
    let dimensions = 0;
    
    for (const [dim, value] of Object.entries(profile)) {
      if (context[dim] !== undefined) {
        dimensions++;
        if (context[dim] === value) {
          score += 1;
        } else if (this._isSimilarValue(dim, value, context[dim])) {
          score += 0.5;
        }
      }
    }
    
    return dimensions > 0 ? score / dimensions : 0;
  }
  
  /**
   * 判断维度值是否相似
   */
  _isSimilarValue(dim, profileValue, contextValue) {
    const similarityMap = {
      arousal: {
        'very-high': ['high'],
        'high': ['very-high', 'medium'],
        'medium': ['high', 'low'],
        'low': ['medium']
      },
      temporal: {
        'present': ['future'],
        'future': ['present'],
        'past': []
      }
    };
    
    return similarityMap[dim]?.[profileValue]?.includes(contextValue) || false;
  }
  
  // ============ 意向性模拟 ============
  
  /**
   * 设置情绪的意向对象
   * @param {string|Object} object - 意向对象
   * @param {string} type - 意向性类型
   */
  setIntentionalObject(object, type = IntentionalityTypes.OBJECT_DIRECTED) {
    this.intentionalObject = object;
    this.intentionalityType = type;
    
    console.log(`[Intentionality] 设置意向对象: ${type} → ${JSON.stringify(object)}`);
  }
  
  /**
   * 评估情绪的适当性
   * @param {string} emotionName - 情绪名称
   * @param {Object} context - 情境信息
   * @returns {Object} 适当性评估
   */
  assessAppropriateness(emotionName, context) {
    const emotionData = this._findEmotionData(emotionName);
    const assessment = {
      emotion: emotionName,
      criteria: {},
      overall: 'appropriate',
      recommendations: []
    };
    
    // 1. 形式对象适当性
    assessment.criteria.formalObject = this._assessFormalObject(emotionData, context);
    
    // 2. 强度适当性
    assessment.criteria.intensity = this._assessIntensity(emotionData, context);
    
    // 3. 持续时间适当性
    assessment.criteria.duration = this._assessDuration(emotionName, context);
    
    // 综合评估
    const scores = Object.values(assessment.criteria).map(c => c.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avgScore < 0.5) {
      assessment.overall = 'inappropriate';
      assessment.recommendations = this._generateRecommendations(assessment.criteria);
    } else if (avgScore < 0.8) {
      assessment.overall = 'partially-appropriate';
      assessment.recommendations = this._generateRecommendations(assessment.criteria);
    }
    
    return assessment;
  }
  
  // ============ 现象学深度 ============
  
  /**
   * 增强现象学体验深度
   * @param {number} depth - 深度层次 (1-5)
   */
  setPhenomenologicalDepth(depth) {
    this.phenomenologicalDepth = Math.min(5, Math.max(1, depth));
    console.log(`[Phenomenology] 现象学深度设置为: ${depth}`);
  }
  
  /**
   * 生成深度现象学描述
   * @param {string} emotionName - 情绪名称
   * @returns {string} 现象学描述
   */
  describePhenomenology(emotionName) {
    const baseDescription = this._getBasePhenomenology(emotionName);
    
    if (this.phenomenologicalDepth === 1) {
      return baseDescription;
    }
    
    // 深度层次增强
    const enhancements = [];
    
    if (this.phenomenologicalDepth >= 2) {
      enhancements.push(this._addBodilySensation(emotionName));
    }
    
    if (this.phenomenologicalDepth >= 3) {
      enhancements.push(this._addTemporalFlow(emotionName));
    }
    
    if (this.phenomenologicalDepth >= 4) {
      enhancements.push(this._addIntentionalStructure(emotionName));
    }
    
    if (this.phenomenologicalDepth >= 5) {
      enhancements.push(this._addExistentialDimension(emotionName));
    }
    
    return baseDescription + ' ' + enhancements.join(' ');
  }
  
  // ============ 辅助方法 ============
  
  _getEmotionFamily(broadCategory) {
    const mapping = {
      'fear': FineGrainedEmotions.FEAR_FAMILY,
      'anger': FineGrainedEmotions.ANGER_FAMILY,
      'sadness': FineGrainedEmotions.SADNESS_FAMILY,
      'joy': FineGrainedEmotions.JOY_FAMILY
    };
    return mapping[broadCategory.toLowerCase()] || null;
  }
  
  _findEmotionData(emotionName) {
    for (const family of Object.values(FineGrainedEmotions)) {
      if (family[emotionName.toUpperCase()]) {
        return family[emotionName.toUpperCase()];
      }
    }
    return null;
  }
  
  _describeQualia(emotionName) {
    const qualiaDescriptions = {
      FEAR: '一种紧迫的、收缩的感觉，仿佛世界在逼近',
      ANXIETY: '一种弥漫的、不确定的紧张感，没有明确的焦点',
      ANGER: '一种炽热的、膨胀的感觉，想要冲破束缚',
      SADNESS: '一种沉重的、下坠的感觉，仿佛被重力加倍牵引',
      JOY: '一种轻盈的、扩展的感觉，仿佛要飘起来',
      PRIDE: '一种挺立的、坚实的感觉，脊柱向上延伸',
      GRATITUDE: '一种温暖的、开放的感觉，胸腔中有暖流',
      RELIEF: '一种释放的、松弛的感觉，仿佛卸下重担'
    };
    return qualiaDescriptions[emotionName.toUpperCase()] || '独特的主观体验特征';
  }
  
  _simulateBodilyFeeling(emotionName) {
    const bodilyFeelings = {
      FEAR: '心跳加速、肌肉紧绷、呼吸变浅、手心出汗',
      ANXIETY: '胃部不适、坐立不安、肩膀紧张、呼吸不规则',
      ANGER: '面部发热、拳头紧握、下巴紧绷、血压上升',
      SADNESS: '胸口沉重、喉咙发紧、眼泪涌动、身体乏力',
      JOY: '胸口开阔、面部放松、身体轻盈、能量充沛',
      PRIDE: '挺胸抬头、步伐有力、面部微笑、姿态开放'
    };
    return bodilyFeelings[emotionName.toUpperCase()] || '可感知的身体变化';
  }
  
  _extractAppraisalDimensions(emotionData) {
    if (!emotionData) return [];
    return Object.keys(emotionData).filter(k => 
      ['valence', 'arousal', 'certainty', 'control', 'responsibility', 'temporal'].includes(k)
    );
  }
  
  _describeCognitiveContent(emotionName, context) {
    const cognitiveContents = {
      FEAR: '有危险！需要立即保护自己！',
      ANXIETY: '可能会有不好的事情发生，但我不确定是什么',
      ANGER: '这不公平！有人伤害了我/我的利益！',
      SADNESS: '我失去了重要的东西，再也回不来了',
      JOY: '太好了！我得到了想要的东西！',
      PRIDE: '这是我努力的结果，我为自己感到自豪',
      GRATITUDE: '别人给了我美好的东西，我值得被善待'
    };
    return cognitiveContents[emotionName.toUpperCase()] || '情绪相关的认知评价';
  }
  
  _determineIntentionalityType(emotionName, context) {
    if (context.target) return IntentionalityTypes.OBJECT_DIRECTED;
    if (context.proposition) return IntentionalityTypes.PROPOSITIONAL;
    if (context.situation) return IntentionalityTypes.SITUATIONAL;
    return IntentionalityTypes.NON_DIRECTED;
  }
  
  _assessAppropriateness(emotionName, context) {
    // 简化评估
    return context.threatLevel ? 'appropriate' : 'unknown';
  }
  
  _describeActionTendency(emotionName) {
    const tendencies = {
      FEAR: '逃跑或躲避',
      ANXIETY: '警惕和准备',
      ANGER: '攻击或对抗',
      SADNESS: '退缩和寻求安慰',
      JOY: '接近和分享',
      PRIDE: '展示和庆祝'
    };
    return tendencies[emotionName.toUpperCase()] || '行动倾向';
  }
  
  _getSpecificTendency(emotionName) {
    const tendencies = {
      FEAR: 'flight',
      ANGER: 'fight',
      SADNESS: 'withdraw',
      JOY: 'approach',
      ANXIETY: 'monitor'
    };
    return tendencies[emotionName.toUpperCase()] || 'general';
  }
  
  _generateUnifiedDescription(traditions) {
    return `从感受传统看，这种情绪有独特的现象学特征；从评价传统看，它包含对情境的特定评估；从动机传统看，它产生明确的行动倾向。三者整合形成完整的情绪体验。`;
  }
  
  _assessCoherence(traditions) {
    return 'high';
  }
  
  _determineDominantTradition(traditions) {
    return EmotionTraditions.EVALUATIVE;
  }
  
  _suggestRegulationStrategy(traditions) {
    return '认知重评 + 身体调节';
  }
  
  _suggestExpressionStrategy(traditions) {
    return '适度表达 + 情境敏感';
  }
  
  _generateInsight(traditions) {
    return '理解情绪的多元本质有助于更好地调节和运用情绪';
  }
  
  _assessFormalObject(emotionData, context) {
    return { score: 0.8, reason: '情境与情绪形式对象基本匹配' };
  }
  
  _assessIntensity(emotionData, context) {
    return { score: 0.7, reason: '情绪强度与情境严重程度相当' };
  }
  
  _assessDuration(emotionName, context) {
    return { score: 0.8, reason: '情绪持续时间在正常范围内' };
  }
  
  _generateRecommendations(criteria) {
    return ['考虑调整情绪强度', '反思评价是否准确'];
  }
  
  _getBasePhenomenology(emotionName) {
    return this._describeQualia(emotionName);
  }
  
  _addBodilySensation(emotionName) {
    return '身体上表现为' + this._simulateBodilyFeeling(emotionName);
  }
  
  _addTemporalFlow(emotionName) {
    return '时间维度上，这种体验有起伏变化的动态特征';
  }
  
  _addIntentionalStructure(emotionName) {
    return '意向结构上，它指向某个对象或事态';
  }
  
  _addExistentialDimension(emotionName) {
    return '存在维度上，它揭示了人与世界的深层关系';
  }
}

module.exports = {
  EmotionIntegrationModule,
  EmotionTraditions,
  DifferentiationDimensions,
  IntentionalityTypes,
  AppropriatenessCriteria,
  FineGrainedEmotions
};
