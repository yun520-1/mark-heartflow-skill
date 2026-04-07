/**
 * 情绪理论基础模块 (Emotion Theory Foundation Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论整合：
 * - 情绪三大传统理论 (Three Traditions in Emotion Theory)
 * - 情绪构成理论 (Emotion Components Theory)
 * - 情绪区分挑战 (Differentiation Challenge)
 * - 情绪动机理论 (Motivational Theory of Emotions)
 * - 情绪意向性理论 (Intentionality of Emotions)
 * - 情绪现象学理论 (Phenomenology of Emotions)
 * 
 * 核心理论来源:
 * - Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy
 * - Prinz, J. (2004). Gut Reactions: A Perceptual Theory of Emotions
 * - Griffiths, P. (1997). What Emotions Really Are
 * - Barrett, L. F. (2017). How Emotions Are Made
 * 
 * 功能目标：为 HeartFlow 提供统一的情绪理论框架
 * - 整合三大情绪理论传统
 * - 提供情绪区分的理论基础
 * - 定义情绪与动机的关系
 * - 支持情绪适当性评估
 * 
 * @version 1.0.0 (v3.21.0 HeartFlow)
 * @author HeartFlow Team
 */

// ============ 情绪理论三大传统 ============

/**
 * 情绪理论的三大传统 (Three Traditions in Emotion Theory)
 * 基于 SEP 情绪理论的历史分类
 */
const EmotionTraditions = {
  /**
   * 感受传统 (Feeling Tradition)
   * 核心观点：情绪的本质是主观感受体验
   * 代表人物：William James, Carl Lange
   * 优势：解释情绪的现象学特征
   * 挑战：难以解释情绪的区分性和意向性
   */
  FEELING: 'feeling',
  
  /**
   * 评价传统 (Evaluative Tradition)
   * 核心观点：情绪的本质是对情境的评价/评估
   * 代表人物：Aristotle, Martha Nussbaum, Robert Solomon
   * 优势：解释情绪的意向性和适当性
   * 挑战：难以解释无意识情绪和快速情绪反应
   */
  EVALUATIVE: 'evaluative',
  
  /**
   * 动机传统 (Motivational Tradition)
   * 核心观点：情绪的本质是动机状态
   * 代表人物：John Dewey, Nico Frijda
   * 优势：解释情绪与行为的关系
   * 挑战：难以区分情绪与其他动机状态（如欲望）
   */
  MOTIVATIONAL: 'motivational'
};

/**
 * 情绪理论整合框架
 * 现代情绪理论倾向于整合三大传统的洞见
 */
const IntegrationPrinciples = {
  MULTI_COMPONENT: '情绪是多成分整合的状态，而非单一成分',
  CONTEXT_DEPENDENT: '不同情境下不同成分的重要性不同',
  FUNCTIONAL_ROLE: '情绪的功能角色决定其本质特征',
  CONSTRUCTIVIST: '情绪是社会建构与生物基础的结合'
};

// ============ 情绪区分理论 ============

/**
 * 情绪区分挑战 (Differentiation Challenge)
 * 基于 SEP 情绪理论的核心问题：如何区分不同情绪？
 */
const DifferentiationDimensions = {
  /**
   * 效价 (Valence)
   * 情绪的正负向度
   */
  VALENCE: 'valence',
  
  /**
   * 唤醒度 (Arousal)
   * 情绪的激活水平
   */
  AROUSAL: 'arousal',
  
  /**
   * 控制感 (Control)
   * 对情境的控制感知
   */
  CONTROL: 'control',
  
  /**
   * 确定性 (Certainty)
   * 对情境的确定程度
   */
  CERTAINTY: 'certainty',
  
  /**
   * 责任归属 (Responsibility)
   * 谁对情境负责
   */
  RESPONSIBILITY: 'responsibility',
  
  /**
   * 预期努力 (Effort)
   * 需要付出的努力程度
   */
  EFFORT: 'effort',
  
  /**
   * 注意力活动 (Attentional Activity)
   * 注意力的聚焦模式
   */
  ATTENTION: 'attention'
};

/**
 * 基础情绪的区分特征
 * 基于 SEP 情绪理论的原型理论
 */
const EmotionPrototypes = {
  FEAR: {
    name: '恐惧',
    valence: 'negative',
    arousal: 'high',
    control: 'low',
    certainty: 'high',
    responsibility: 'situation',
    coreRelationalTheme: '危险/威胁',
    actionTendency: '逃避/战斗',
    phenomenalCharacter: '紧张、警觉、身体准备行动'
  },
  
  ANGER: {
    name: '愤怒',
    valence: 'negative',
    arousal: 'high',
    control: 'high',
    certainty: 'high',
    responsibility: 'other',
    coreRelationalTheme: '冒犯/不公',
    actionTendency: '对抗/纠正',
    phenomenalCharacter: '热感、紧张、想要表达'
  },
  
  SADNESS: {
    name: '悲伤',
    valence: 'negative',
    arousal: 'low',
    control: 'low',
    certainty: 'high',
    responsibility: 'situation',
    coreRelationalTheme: '损失/分离',
    actionTendency: '退缩/寻求支持',
    phenomenalCharacter: '沉重、空虚、向下拉'
  },
  
  JOY: {
    name: '喜悦',
    valence: 'positive',
    arousal: 'medium',
    control: 'medium',
    certainty: 'high',
    responsibility: 'self/situation',
    coreRelationalTheme: '获得/成就',
    actionTendency: '分享/庆祝',
    phenomenalCharacter: '轻盈、温暖、向上提升'
  },
  
  SURPRISE: {
    name: '惊讶',
    valence: 'neutral',
    arousal: 'high',
    control: 'low',
    certainty: 'low',
    responsibility: 'situation',
    coreRelationalTheme: '新颖/意外',
    actionTendency: '暂停/定向',
    phenomenalCharacter: '震动、中断、重新定向'
  },
  
  DISGUST: {
    name: '厌恶',
    valence: 'negative',
    arousal: 'medium',
    control: 'high',
    certainty: 'high',
    responsibility: 'object',
    coreRelationalTheme: '污染/排斥',
    actionTendency: '排斥/远离',
    phenomenalCharacter: '恶心、想要清除'
  },
  
  SHAME: {
    name: '羞愧',
    valence: 'negative',
    arousal: 'medium',
    control: 'low',
    certainty: 'high',
    responsibility: 'self',
    coreRelationalTheme: '自我缺陷/暴露',
    actionTendency: '隐藏/退缩',
    phenomenalCharacter: '灼热、想要消失'
  },
  
  GUILT: {
    name: '内疚',
    valence: 'negative',
    arousal: 'medium',
    control: 'medium',
    certainty: 'high',
    responsibility: 'self',
    coreRelationalTheme: '道德违反/伤害他人',
    actionTendency: '修复/补偿',
    phenomenalCharacter: '沉重、想要弥补'
  },
  
  PRIDE: {
    name: '自豪',
    valence: 'positive',
    arousal: 'medium',
    control: 'high',
    certainty: 'high',
    responsibility: 'self',
    coreRelationalTheme: '成就/价值确认',
    actionTendency: '展示/分享',
    phenomenalCharacter: '扩展、向上、温暖'
  },
  
  ENVY: {
    name: '嫉妒',
    valence: 'negative',
    arousal: 'medium',
    control: 'low',
    certainty: 'high',
    responsibility: 'other',
    coreRelationalTheme: '他人拥有我想要的',
    actionTendency: '获取/贬低他人',
    phenomenalCharacter: '苦涩、紧缩'
  },
  
  GRATITUDE: {
    name: '感激',
    valence: 'positive',
    arousal: 'medium',
    control: 'low',
    certainty: 'high',
    responsibility: 'other',
    coreRelationalTheme: '他人给予我好处',
    actionTendency: '回报/表达感谢',
    phenomenalCharacter: '温暖、扩展、连接感'
  },
  
  HOPE: {
    name: '希望',
    valence: 'positive',
    arousal: 'medium',
    control: 'low',
    certainty: 'low',
    responsibility: 'situation/future',
    coreRelationalTheme: '未来可能的善',
    actionTendency: '追求/坚持',
    phenomenalCharacter: '向前延伸、轻盈'
  }
};

// ============ 情绪意向性理论 ============

/**
 * 情绪意向性 (Intentionality of Emotions)
 * 基于 SEP 情绪意向性理论
 * 
 * 情绪是对象指向的 (object-directed)
 * 情绪可以有适当/不适当之分
 */
const IntentionalityTypes = {
  /**
   * 关于对象 (Aboutness)
   * 情绪总是关于某物的
   */
  ABOUTNESS: 'aboutness',
  
  /**
   * 适当性条件 (Conditions of Appropriateness)
   * 情绪可以有适当/不适当之分
   */
  APPROPRIATENESS: 'appropriateness',
  
  /**
   * 评价内容 (Evaluative Content)
   * 情绪包含对对象的评价
   */
  EVALUATIVE_CONTENT: 'evaluative_content'
};

/**
 * 情绪适当性评估标准
 * 基于 SEP 情绪理论的评价传统
 */
const AppropriatenessCriteria = {
  /**
   * 事实适当性
   * 情绪的评价内容是否与事实相符
   */
  FACTUAL: 'factual',
  
  /**
   * 比例适当性
   * 情绪强度是否与情境严重程度相称
   */
  PROPORTIONAL: 'proportional',
  
  /**
   * 道德适当性
   * 情绪是否符合道德规范
   */
  MORAL: 'moral',
  
  /**
   * 实用适当性
   * 情绪是否有助于实现目标
   */
  PRAGMATIC: 'pragmatic'
};

// ============ 情绪动机理论 ============

/**
 * 情绪动机理论 (Motivational Theory of Emotions)
 * 基于 SEP 情绪理论的动机传统
 * 
 * 核心观点：情绪的本质特征是产生行动倾向
 */
const ActionTendencies = {
  /**
   * 恐惧 → 逃避
   */
  FEAR_ESCAPE: 'escape from danger',
  
  /**
   * 愤怒 → 对抗
   */
  ANGER_CONFRONT: 'confront offense',
  
  /**
   * 悲伤 → 退缩/寻求支持
   */
  SADNESS_WITHDRAW: 'withdraw and seek support',
  
  /**
   * 喜悦 → 分享/庆祝
   */
  JOY_SHARE: 'share and celebrate',
  
  /**
   * 厌恶 → 排斥
   */
  DISGUST_REJECT: 'reject contaminant',
  
  /**
   * 羞愧 → 隐藏
   */
  SHAME_HIDE: 'hide from exposure',
  
  /**
   * 内疚 → 修复
   */
  GUILT_REPAIR: 'repair harm done',
  
  /**
   * 感激 → 回报
   */
  GRATITUDE_RECIPROCATE: 'reciprocate kindness',
  
  /**
   * 希望 → 追求
   */
  HOPE_PURSUE: 'pursue possible good',
  
  /**
   * 好奇 → 探索
   */
  CURIOSITY_EXPLORE: 'explore novelty'
};

/**
 * 情绪动机强度模型
 * 情绪强度决定行动倾向的紧迫性
 */
const MotivationIntensityModel = {
  LOW: { range: [1, 2], description: '低动机，仅轻微影响行为' },
  MEDIUM: { range: [3, 4], description: '中等动机，明显影响决策' },
  HIGH: { range: [5, 6], description: '高动机，强烈驱动行为' },
  URGENT: { range: [7, 8], description: '紧急动机，可能压倒理性思考' },
  OVERWHELMING: { range: [9, 10], description: '压倒性动机，几乎自动控制行为' }
};

// ============ 情绪理论整合类 ============

class EmotionTheoryFoundation {
  constructor() {
    // 当前理论框架版本
    this.frameworkVersion = '1.0.0';
    
    // 已注册的情绪原型
    this.registeredPrototypes = { ...EmotionPrototypes };
    
    // 理论整合原则
    this.integrationPrinciples = { ...IntegrationPrinciples };
  }
  
  /**
   * 获取情绪理论基础信息
   */
  getInfo() {
    return {
      name: 'EmotionTheoryFoundation',
      version: this.frameworkVersion,
      theoreticalFoundations: [
        'Emotion Components Theory (SEP)',
        'Three Traditions in Emotion Theory (Feeling, Evaluative, Motivational)',
        'Differentiation Challenge (SEP)',
        'Intentionality of Emotions (SEP)',
        'Motivational Theory of Emotions (SEP)',
        'Appropriateness Criteria (SEP)'
      ],
      capabilities: [
        '情绪原型查询',
        '情绪区分分析',
        '情绪适当性评估',
        '情绪动机强度分析',
        '情绪理论整合框架'
      ],
      registeredEmotions: Object.keys(this.registeredPrototypes),
      traditions: EmotionTraditions,
      differentiationDimensions: DifferentiationDimensions
    };
  }
  
  /**
   * 获取情绪原型信息
   * 
   * @param {string} emotionName - 情绪名称（英文）
   * @returns {object|null} 情绪原型信息
   */
  getEmotionPrototype(emotionName) {
    const name = emotionName.toUpperCase();
    return this.registeredPrototypes[name] || null;
  }
  
  /**
   * 情绪区分分析
   * 基于 SEP 情绪理论的区分维度
   * 
   * @param {string} emotionName - 情绪名称
   * @returns {object} 区分分析结果
   */
  analyzeDifferentiation(emotionName) {
    const prototype = this.getEmotionPrototype(emotionName);
    
    if (!prototype) {
      return {
        success: false,
        error: `未知情绪：${emotionName}`
      };
    }
    
    return {
      success: true,
      emotion: prototype.name,
      differentiation: {
        valence: prototype.valence,
        arousal: prototype.arousal,
        control: prototype.control,
        certainty: prototype.certainty,
        responsibility: prototype.responsibility,
        coreRelationalTheme: prototype.coreRelationalTheme,
        actionTendency: prototype.actionTendency,
        phenomenalCharacter: prototype.phenomenalCharacter
      },
      comparisonWithSimilar: this._findSimilarEmotions(prototype)
    };
  }
  
  /**
   * 查找相似情绪
   * 用于情绪区分
   */
  _findSimilarEmotions(targetPrototype) {
    const similar = [];
    
    for (const [name, prototype] of Object.entries(this.registeredPrototypes)) {
      if (name === targetPrototype.name.toUpperCase()) continue;
      
      let similarity = 0;
      
      // 效价相同
      if (prototype.valence === targetPrototype.valence) similarity++;
      // 唤醒度相同
      if (prototype.arousal === targetPrototype.arousal) similarity++;
      // 控制感相同
      if (prototype.control === targetPrototype.control) similarity++;
      
      if (similarity >= 2) {
        similar.push({
          emotion: prototype.name,
          similarity: similarity,
          keyDifference: this._identifyKeyDifference(targetPrototype, prototype)
        });
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
  }
  
  /**
   * 识别关键差异
   */
  _identifyKeyDifference(proto1, proto2) {
    if (proto1.responsibility !== proto2.responsibility) {
      return `责任归属不同：${proto1.responsibility} vs ${proto2.responsibility}`;
    }
    if (proto1.coreRelationalTheme !== proto2.coreRelationalTheme) {
      return `核心关系主题不同：${proto1.coreRelationalTheme} vs ${proto2.coreRelationalTheme}`;
    }
    if (proto1.actionTendency !== proto2.actionTendency) {
      return `行动倾向不同：${proto1.actionTendency} vs ${proto2.actionTendency}`;
    }
    return '多个维度存在差异';
  }
  
  /**
   * 情绪适当性评估
   * 基于 SEP 情绪理论的评价传统
   * 
   * @param {string} emotionName - 情绪名称
   * @param {object} context - 情境信息
   * @returns {object} 适当性评估结果
   */
  evaluateAppropriateness(emotionName, context = {}) {
    const prototype = this.getEmotionPrototype(emotionName);
    
    if (!prototype) {
      return {
        canEvaluate: false,
        error: `未知情绪：${emotionName}`
      };
    }
    
    const evaluations = {};
    
    // 事实适当性
    evaluations.factual = this._evaluateFactualAppropriateness(prototype, context);
    
    // 比例适当性
    evaluations.proportional = this._evaluateProportionalAppropriateness(prototype, context);
    
    // 道德适当性
    evaluations.moral = this._evaluateMoralAppropriateness(prototype, context);
    
    // 实用适当性
    evaluations.pragmatic = this._evaluatePragmaticAppropriateness(prototype, context);
    
    // 总体评估
    const scores = Object.values(evaluations).map(e => e.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    return {
      canEvaluate: true,
      emotion: prototype.name,
      evaluations,
      overallScore: averageScore,
      overallAssessment: this._getOverallAssessment(averageScore),
      recommendations: this._generateRecommendations(evaluations, prototype)
    };
  }
  
  /**
   * 事实适当性评估
   */
  _evaluateFactualAppropriateness(prototype, context) {
    // 检查情绪的评价内容是否与事实相符
    // 例如：恐惧需要有真实威胁
    
    const hasThreat = context.threat || context.danger || context.harm;
    const hasLoss = context.loss || context.separation;
    const hasOffense = context.offense || context.injustice;
    const hasGain = context.gain || context.achievement;
    
    let isFactual = false;
    let reason = '';
    
    switch (prototype.name) {
      case '恐惧':
        isFactual = hasThreat;
        reason = hasThreat ? '存在真实威胁' : '未检测到真实威胁';
        break;
      case '悲伤':
        isFactual = hasLoss;
        reason = hasLoss ? '存在真实损失' : '未检测到真实损失';
        break;
      case '愤怒':
        isFactual = hasOffense;
        reason = hasOffense ? '存在真实冒犯' : '未检测到真实冒犯';
        break;
      case '喜悦':
        isFactual = hasGain;
        reason = hasGain ? '存在真实获得' : '未检测到真实获得';
        break;
      default:
        isFactual = true;
        reason = '默认适当';
    }
    
    return {
      criterion: '事实适当性',
      score: isFactual ? 1 : 0.3,
      isAppropriate: isFactual,
      reason
    };
  }
  
  /**
   * 比例适当性评估
   */
  _evaluateProportionalAppropriateness(prototype, context) {
    const intensity = context.intensity || 5;
    const severity = context.severity || 5;
    
    // 情绪强度与情境严重程度的差异
    const diff = Math.abs(intensity - severity);
    
    let score = 1;
    let reason = '情绪强度与情境相称';
    
    if (diff > 3) {
      score = 0.3;
      reason = `情绪强度 (${intensity}) 与情境严重程度 (${severity}) 差异过大`;
    } else if (diff > 1) {
      score = 0.6;
      reason = `情绪强度 (${intensity}) 与情境严重程度 (${severity}) 略有差异`;
    }
    
    return {
      criterion: '比例适当性',
      score,
      isAppropriate: score >= 0.6,
      reason,
      intensity,
      severity
    };
  }
  
  /**
   * 道德适当性评估
   */
  _evaluateMoralAppropriateness(prototype, context) {
    // 某些情绪在道德上可能不适当
    // 例如：对他人不幸的幸灾乐祸
    
    const isMalicious = context.malicious || context.schadenfreude;
    const isEmpathic = context.empathic || context.compassionate;
    
    let score = 1;
    let reason = '情绪符合道德规范';
    
    if (isMalicious) {
      score = 0.3;
      reason = '情绪包含恶意成分';
    } else if (isEmpathic) {
      score = 1;
      reason = '情绪包含共情成分，道德上值得肯定';
    }
    
    return {
      criterion: '道德适当性',
      score,
      isAppropriate: score >= 0.6,
      reason
    };
  }
  
  /**
   * 实用适当性评估
   */
  _evaluatePragmaticAppropriateness(prototype, context) {
    // 情绪是否有助于实现目标
    
    const goalCongruent = context.goalCongruent;
    const relationshipImportant = context.relationshipImportant;
    
    let score = 0.8;
    let reason = '情绪可能有助于目标实现';
    
    if (goalCongruent === false) {
      score = 0.4;
      reason = '情绪可能阻碍目标实现';
    }
    
    if (relationshipImportant && ['愤怒', '厌恶', '嫉妒'].includes(prototype.name)) {
      score = Math.min(score, 0.5);
      reason = '情绪可能损害重要关系';
    }
    
    return {
      criterion: '实用适当性',
      score,
      isAppropriate: score >= 0.6,
      reason
    };
  }
  
  /**
   * 获取总体评估
   */
  _getOverallAssessment(score) {
    if (score >= 0.8) return '高度适当';
    if (score >= 0.6) return '基本适当';
    if (score >= 0.4) return '部分适当';
    return '不适当';
  }
  
  /**
   * 生成调节建议
   */
  _generateRecommendations(evaluations, prototype) {
    const recommendations = [];
    
    if (!evaluations.factual.isAppropriate) {
      recommendations.push({
        type: '认知重构',
        suggestion: '重新评估情境，检查情绪的评价内容是否与事实相符',
        technique: '事实检验'
      });
    }
    
    if (!evaluations.proportional.isAppropriate) {
      recommendations.push({
        type: '强度调节',
        suggestion: '调整情绪强度，使其与情境严重程度相匹配',
        technique: '深呼吸、正念觉察'
      });
    }
    
    if (!evaluations.moral.isAppropriate) {
      recommendations.push({
        type: '道德反思',
        suggestion: '反思情绪的道德含义，考虑更建设性的情绪反应',
        technique: '价值观澄清'
      });
    }
    
    if (!evaluations.pragmatic.isAppropriate) {
      recommendations.push({
        type: '功能分析',
        suggestion: '分析当前情绪对目标实现的影响，考虑替代反应',
        technique: '成本 - 效益分析'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 情绪动机强度分析
   * 
   * @param {number} intensity - 情绪强度 (1-10)
   * @returns {object} 动机强度分析
   */
  analyzeMotivationIntensity(intensity) {
    let level = 'UNKNOWN';
    let model = MotivationIntensityModel.LOW;
    
    if (intensity <= 2) {
      level = 'LOW';
      model = MotivationIntensityModel.LOW;
    } else if (intensity <= 4) {
      level = 'MEDIUM';
      model = MotivationIntensityModel.MEDIUM;
    } else if (intensity <= 6) {
      level = 'HIGH';
      model = MotivationIntensityModel.HIGH;
    } else if (intensity <= 8) {
      level = 'URGENT';
      model = MotivationIntensityModel.URGENT;
    } else {
      level = 'OVERWHELMING';
      model = MotivationIntensityModel.OVERWHELMING;
    }
    
    return {
      intensity,
      level,
      description: model.description,
      recommendation: this._getMotivationRecommendation(level)
    };
  }
  
  /**
   * 获取动机强度建议
   */
  _getMotivationRecommendation(level) {
    const recommendations = {
      LOW: '情绪对行为影响较小，可理性决策',
      MEDIUM: '情绪开始影响决策，建议觉察情绪影响',
      HIGH: '情绪强烈驱动行为，建议暂停并反思',
      URGENT: '情绪可能压倒理性，强烈建议暂停',
      OVERWHELMING: '情绪几乎自动控制行为，需要立即调节'
    };
    return recommendations[level] || '未知强度水平';
  }
  
  /**
   * 情绪理论整合分析
   * 整合三大传统的洞见
   * 
   * @param {string} emotionName - 情绪名称
   * @param {object} context - 情境信息
   * @returns {object} 整合分析结果
   */
  integratedAnalysis(emotionName, context = {}) {
    const prototype = this.getEmotionPrototype(emotionName);
    
    if (!prototype) {
      return {
        success: false,
        error: `未知情绪：${emotionName}`
      };
    }
    
    return {
      success: true,
      emotion: prototype.name,
      timestamp: new Date().toISOString(),
      
      // 感受传统视角
      feelingPerspective: {
        phenomenalCharacter: prototype.phenomenalCharacter,
        subjectiveExperience: '情绪的主观体验特征',
        bodilyFeeling: '情绪伴随的身体感受'
      },
      
      // 评价传统视角
      evaluativePerspective: {
        coreRelationalTheme: prototype.coreRelationalTheme,
        evaluativeContent: `对情境的评价：${prototype.coreRelationalTheme}`,
        intentionality: '情绪指向特定对象或情境'
      },
      
      // 动机传统视角
      motivationalPerspective: {
        actionTendency: prototype.actionTendency,
        motivationalForce: '情绪驱动行为的倾向',
        functionalRole: '情绪的功能角色是促进行动'
      },
      
      // 整合视角
      integration: {
        principle: IntegrationPrinciples.MULTI_COMPONENT,
        description: '情绪是感受、评价和动机的整合状态',
        contextDependence: '不同情境下不同成分的重要性不同'
      },
      
      // 区分分析
      differentiation: this.analyzeDifferentiation(emotionName),
      
      // 动机强度分析
      motivationIntensity: this.analyzeMotivationIntensity(context.intensity || 5)
    };
  }
}

// ============ 导出 ============

module.exports = {
  EmotionTheoryFoundation,
  EmotionTraditions,
  DifferentiationDimensions,
  EmotionPrototypes,
  IntentionalityTypes,
  AppropriatenessCriteria,
  ActionTendencies,
  MotivationIntensityModel,
  IntegrationPrinciples
};
