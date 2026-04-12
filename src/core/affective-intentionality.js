/**
 * Affective Intentionality Computation - 情感意向性计算
 * 
 * 情感并非无意义的心理状态，而是总是"关于"某物的——
 * 这是情感哲学的核心洞见（Brentano, Husserl, Solomon）
 * 
 * 参考:
 * - Brentano, F. (1874). Psychology from an Empirical Standpoint
 * - Solomon, R.C. (2004). emotions. SEP (Stanford Encyclopedia of Philosophy)
 * - Goldie, P. (2000). The Emotions: A Philosophical Exploration
 * - Helm, B.W. (2001). Emotional Logic: How Reasoning Transforms Feeling
 * 
 * 核心公式:
 * - Affective Intentionality: I_A = W_i × I_o × E_v × (1 - D_d)
 * - Emotion-Value Loop: V_e = f(E, V_obj, C_context)
 * - Perceptual Theory of Emotion: P_e = S_o × A_r × C_c
 */

class AffectiveIntentionality {
  constructor() {
    this.version = '1.0.0';
    
    // 情感意向性维度
    this.dimensions = {
      intentionality: {
        name: '意向性',
        description: '情感总是指向某物的特性',
        weight: 0.3
      },
      evaluation: {
        name: '评价性',
        description: '情感包含对对象的价值判断',
        weight: 0.25
      },
      valence: {
        name: '效价',
        description: '正面/负面情感',
        weight: 0.2
      },
      agency: {
        name: '施事性',
        description: '情感中的主体性程度',
        weight: 0.15
      },
      dynamism: {
        name: '动力性',
        description: '情感的动机驱动能力',
        weight: 0.1
      }
    };
    
    // 情感类型映射
    this.emotionTypes = {
      joy: { intentionality: 0.7, evaluation: 0.8, valence: 0.9, agency: 0.6, dynamism: 0.7 },
      sadness: { intentionality: 0.9, evaluation: 0.7, valence: -0.7, agency: 0.3, dynamism: 0.4 },
      anger: { intentionality: 0.8, evaluation: 0.9, valence: -0.8, agency: 0.8, dynamism: 0.9 },
      fear: { intentionality: 0.9, evaluation: 0.6, valence: -0.9, agency: 0.2, dynamism: 0.8 },
      love: { intentionality: 0.95, evaluation: 0.9, valence: 0.95, agency: 0.5, dynamism: 0.6 },
      gratitude: { intentionality: 0.8, evaluation: 0.9, valence: 0.85, agency: 0.4, dynamism: 0.5 },
      envy: { intentionality: 0.7, evaluation: 0.8, valence: -0.6, agency: 0.5, dynamism: 0.6 },
      shame: { intentionality: 0.85, evaluation: 0.9, valence: -0.75, agency: 0.3, dynamism: 0.4 }
    };
  }
  
  /**
   * 计算情感意向性指数
   * I_A = W_i × I_o × E_v × (1 - D_d)
   * 
   * W_i = 意向性强度
   * I_o = 意向对象清晰度
   * E_v = 评价强度
   * D_d = 脱节度 (情感与情境的脱节)
   * 
   * @param {object} params - 情感参数
   * @returns {object} 意向性分析
   */
  computeIntentionality(params = {}) {
    const {
      type = 'joy',
      intentionalityStrength = 0.7,
      objectClarity = 0.7,
      evaluationStrength = 0.7,
      disengagement = 0.1
    } = params;
    
    // 基础意向性指数
    const I_A = intentionalityStrength * objectClarity * evaluationStrength * (1 - disengagement);
    
    // 意向对象分析
    const objectAnalysis = {
      clarity: objectClarity,
      type: params.objectType || 'unknown',
      presence: objectClarity * (1 - disengagement),
      interpretation: objectClarity > 0.7
        ? '意向对象清晰：情感明确指向某物'
        : objectClarity > 0.4
        ? '意向对象模糊：情感指向不够明确'
        : '意向对象缺失：情感可能为弥散状态'
    };
    
    // 情感类型特征
    const emotionProfile = this.emotionTypes[type] || {
      intentionality: 0.5, evaluation: 0.5, valence: 0, agency: 0.5, dynamism: 0.5
    };
    
    // 与类型基准的偏差
    const profileDeviation = Math.abs(emotionProfile.intentionality - intentionalityStrength) +
                             Math.abs(emotionProfile.evaluation - evaluationStrength);
    
    return {
      intentionalityIndex: I_A,
      objectAnalysis,
      emotionProfile,
      profileDeviation,
      isTypicalEmotion: profileDeviation < 0.3,
      interpretation: I_A > 0.5
        ? '强意向性情感：情感明确指向对象，具有心理学上的合理性'
        : I_A > 0.25
        ? '中等意向性情感：有一定指向性但不完全整合'
        : '弱意向性情感：情感可能与对象脱节，需要审视'
    };
  }
  
  /**
   * 情感感知理论计算
   * Solomon: "情感是有意图的判断"
   * 
   * P_e = S_o × A_r × C_c
   * S_o = 感知对象的显著性
   * A_r = 评价相关性
   * C_c = 情境适当性
   * 
   * @param {object} perception - 感知参数
   * @returns {object} 感知理论分析
   */
  perceptualTheory(perception = {}) {
    const {
      objectSalience = 0.7,
      relevance = 0.7,
      contextualAppropriateness = 0.7
    } = perception;
    
    // 情感感知指数
    const P_e = objectSalience * relevance * contextualAppropriateness;
    
    // 判断成分
    const judgmentComponent = {
      cognitive: (perception.cognitiveJudgment || 0.5) * relevance,
      evaluative: (perception.evaluativeJudgment || 0.5) * contextualAppropriateness,
      dispositional: (perception.dispositionalJudgment || 0.5) * objectSalience
    };
    
    // Solomon 的情感即判断命题检验
    const isJudgmentBased = (judgmentComponent.cognitive + judgmentComponent.evaluative) > 0.6;
    
    return {
      perceptualIndex: P_e,
      judgmentComponent,
      isJudgmentBased,
      interpretation: P_e > 0.5
        ? '情感感知整合良好：判断与感知协同'
        : '情感感知脱节：可能存在判断偏差'
    };
  }
  
  /**
   * 情感价值回路
   * 情感与价值相互生成
   * 
   * V_e = f(E, V_obj, C_context)
   * E = 情感状态
   * V_obj = 对象的价值
   * C_context = 情境因素
   * 
   * @param {object} valueLoop - 价值回路参数
   * @returns {object} 价值回路分析
   */
  emotionValueLoop(valueLoop = {}) {
    const {
      emotion = 0.5,
      objectValue = 0.5,
      contextFactor = 0.5,
      culturalNorm = 0.5
    } = valueLoop;
    
    // 价值生成强度
    const valueGeneration = emotion * objectValue * contextFactor;
    
    // 文化调节
    const culturalModulation = culturalNorm * 0.3 + 0.7;
    
    // 价值整合度
    const valueIntegration = Math.sqrt(emotion * objectValue) * culturalModulation;
    
    // 反馈回路强度
    const feedbackLoop = valueGeneration * (1 - Math.abs(emotion - objectValue));
    
    return {
      valueGeneration,
      culturalModulation,
      valueIntegration,
      feedbackLoop,
      interpretation: feedbackLoop > 0.4
        ? '价值回路强：情感与价值相互强化'
        : feedbackLoop > 0.2
        ? '价值回路中等：有一定相互影响'
        : '价值回路弱：情感与价值相对独立'
    };
  }
  
  /**
   * Helm 的情感动力逻辑
   * 情感的动机结构分析
   * 
   * @param {object} helm - Helm情感理论参数
   * @returns {object} Helm分析
   */
  helmEmotionalLogic(helm = {}) {
    const {
      desire = 0.5,
      belief = 0.5,
      emotionalResponse = 0.5,
      actionTendency = 0.5
    } = helm;
    
    // 情感-欲望-信念三角
    const edbTriangle = desire * belief * emotionalResponse;
    
    // 行动倾向强度
    const actionTendencyStrength = edbTriangle * actionTendency;
    
    // 情感理性 (Helm: 情感有其内在理性)
    const emotionalRationality = edbTriangle > 0.3 ? '理性情感' : '非理性情感';
    
    return {
      desire,
      belief,
      emotionalResponse,
      edbTriangle,
      actionTendencyStrength,
      emotionalRationality,
      interpretation: actionTendencyStrength > 0.4
        ? '情感具有行动驱动力：动机结构完整'
        : '情感行动驱动力弱：需要进一步整合'
    };
  }
  
  /**
   * 整合计算
   * @param {object} input - 综合输入
   * @returns {object} 完整分析
   */
  compute(input = {}) {
    const {
      type = 'joy',
      intentionalityStrength = 0.7,
      objectClarity = 0.7,
      evaluationStrength = 0.7,
      disengagement = 0.1,
      perception = {},
      valueLoop = {},
      helm = {}
    } = input;
    
    const intentionality = this.computeIntentionality({
      type,
      intentionalityStrength,
      objectClarity,
      evaluationStrength,
      disengagement
    });
    
    const perceptual = this.perceptualTheory(perception);
    const valueLoopAnalysis = this.emotionValueLoop(valueLoop);
    const helmAnalysis = this.helmEmotionalLogic(helm);
    
    // 综合情感意向性得分
    const compositeScore = 
      intentionality.intentionalityIndex * 0.35 +
      perceptual.perceptualIndex * 0.30 +
      valueLoopAnalysis.valueIntegration * 0.20 +
      helmAnalysis.edbTriangle * 0.15;
    
    return {
      intentionality,
      perceptual,
      valueLoop: valueLoopAnalysis,
      helm: helmAnalysis,
      compositeScore,
      timestamp: new Date().toISOString(),
      version: this.version
    };
  }
}

module.exports = AffectiveIntentionality;
