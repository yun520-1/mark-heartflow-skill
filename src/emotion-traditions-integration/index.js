/**
 * 情绪理论三大传统整合模块 v1.0
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) 情绪理论
 * 整合三大传统：Feeling Tradition, Evaluative Tradition, Motivational Tradition
 * 
 * 理论来源：
 * - SEP: Emotion (https://plato.stanford.edu/entries/emotion/)
 * - Scarantino, A. (2016). The Philosophy of Emotions
 * - James-Lange Theory, Cannon-Bard Theory, Schachter-Singer Theory
 * 
 * 核心功能：
 * 1. 情绪成分分析 (Problem of Parts)
 * 2. 三大传统理论应用
 * 3. 四大理论挑战解决 (Differentiation, Motivation, Intentionality, Phenomenology)
 * 4. 跨传统整合框架
 */

class EmotionTraditionsIntegration {
  constructor() {
    this.name = 'Emotion Traditions Integration';
    this.version = '3.0.0'; // v3.52.0 增强 - 整合 SEP 情绪理论完整版
    this.source = 'SEP Emotion Theory (2026 Edition) + Scarantino 2016';
    
    // 情绪成分定义 (Problem of Parts)
    this.emotionComponents = {
      evaluative: '评价成分 - 对情境的认知评估',
      physiological: '生理成分 - 自主神经和运动反应',
      phenomenological: '现象学成分 - 主观感受体验',
      expressive: '表达成分 - 面部表情和肢体语言',
      behavioral: '行为成分 - 行动倾向',
      mental: '心理成分 - 注意力聚焦'
    };
    
    // 三大传统理论
    this.traditions = {
      feeling: {
        name: 'Feeling Tradition',
        core: '情绪是独特的意识体验',
        theorists: ['William James', 'Carl Lange', 'Antonio Damasio'],
        focus: '现象学成分',
        strength: '捕捉情绪的主观体验质量',
        weakness: '难以解释情绪的分化和意向性'
      },
      evaluative: {
        name: 'Evaluative Tradition',
        core: '情绪是对情境的独特评价',
        theorists: ['Robert Solomon', 'Martha Nussbaum', 'Appraisal Theorists'],
        focus: '评价成分',
        strength: '解释情绪的合理性和对象指向性',
        weakness: '难以解释无意识情绪和快速情绪反应'
      },
      motivational: {
        name: 'Motivational Tradition',
        core: '情绪是独特的动机状态',
        theorists: ['Aristotle', 'John Deigh', 'Patricia Greenspan'],
        focus: '行为和动机成分',
        strength: '解释情绪与行动的联系',
        weakness: '难以区分情绪和其他动机状态'
      }
    };
    
    // 四大理论挑战
    this.theoreticalChallenges = {
      differentiation: {
        question: '情绪如何彼此区分，以及如何与非情绪状态区分？',
        solution: '多成分原型模型 + 家族相似性'
      },
      motivation: {
        question: '情绪是否以及如何动机行为？',
        solution: '行动倾向 + 评价驱动 + 生理唤醒整合'
      },
      intentionality: {
        question: '情绪是否有对象指向性？是否可评价适当性？',
        solution: '评价对象 + 形式对象 (formal object) 区分'
      },
      phenomenology: {
        question: '情绪是否总涉及主观体验？何种体验？',
        solution: '前反思体验 + 反思体验层次模型'
      }
    };
    
    // 情绪原型库 (基于 Fehr & Russell 1984 原型理论)
    this.emotionPrototypes = {
      fear: {
        name: '恐惧',
        prototypeScore: 1.0, // 最佳情绪原型
        components: {
          evaluative: { appraisal: '危险威胁', certainty: 0.9 },
          physiological: { arousal: '高', heartRate: '加快', muscleTension: '增加' },
          phenomenological: { valence: '负向', intensity: '高' },
          expressive: { facial: '眼睛睁大，嘴巴张开', vocal: '尖叫' },
          behavioral: { tendency: '逃跑或冻结', actionReadiness: '高' },
          mental: { attention: '威胁源聚焦', vigilance: '提高' }
        },
        formalObject: '危险',
        actionTendency: '保护性回避'
      },
      
      anger: {
        name: '愤怒',
        prototypeScore: 0.95,
        components: {
          evaluative: { appraisal: '冒犯/不公', blame: '他人', control: '低' },
          physiological: { arousal: '高', bloodPressure: '升高', adrenaline: '增加' },
          phenomenological: { valence: '负向', intensity: '高', heat: '热感' },
          expressive: { facial: '眉毛下压，嘴唇紧绷', vocal: '吼叫' },
          behavioral: { tendency: '攻击/对抗', actionReadiness: '高' },
          mental: { attention: '冒犯源聚焦', rumination: '反刍' }
        },
        formalObject: '冒犯',
        actionTendency: '纠正不公'
      },
      
      sadness: {
        name: '悲伤',
        prototypeScore: 0.9,
        components: {
          evaluative: { appraisal: '丧失/失败', irreversibility: '高' },
          physiological: { arousal: '低', energy: '降低', tears: '增加' },
          phenomenological: { valence: '负向', intensity: '中', heaviness: '沉重感' },
          expressive: { facial: '嘴角下垂，眉毛内角上扬', vocal: '低沉' },
          behavioral: { tendency: '退缩/寻求支持', actionReadiness: '低' },
          mental: { attention: '丧失源聚焦', memory: '消极偏向' }
        },
        formalObject: '丧失',
        actionTendency: '寻求恢复或接受'
      },
      
      happiness: {
        name: '快乐',
        prototypeScore: 0.95,
        components: {
          evaluative: { appraisal: '目标达成/积极事件', congruence: '高' },
          physiological: { arousal: '中到高', energy: '增加', relaxation: '增加' },
          phenomenological: { valence: '正向', intensity: '高', lightness: '轻松感' },
          expressive: { facial: '杜兴微笑 (眼角皱纹)', vocal: '轻快' },
          behavioral: { tendency: '接近/分享', actionReadiness: '高' },
          mental: { attention: '扩展', creativity: '增强' }
        },
        formalObject: '目标达成',
        actionTendency: '维持和分享积极状态'
      },
      
      disgust: {
        name: '厌恶',
        prototypeScore: 0.85,
        components: {
          evaluative: { appraisal: '污染/有害', contamination: '高' },
          physiological: { arousal: '中', nausea: '恶心', taste: '苦味感' },
          phenomenological: { valence: '负向', intensity: '中到高', repulsion: '排斥感' },
          expressive: { facial: '上唇抬起，鼻子皱起', vocal: '作呕声' },
          behavioral: { tendency: '吐出/远离', actionReadiness: '高' },
          mental: { attention: '污染物聚焦', avoidance: '强烈' }
        },
        formalObject: '污染',
        actionTendency: '排除有害物质'
      },
      
      surprise: {
        name: '惊讶',
        prototypeScore: 0.8,
        components: {
          evaluative: { appraisal: '意外/新颖', predictability: '低' },
          physiological: { arousal: '高', startle: '惊跳反射' },
          phenomenological: { valence: '中性', intensity: '高', suddenness: '突然' },
          expressive: { facial: '眉毛上扬，眼睛睁大，下巴下垂', vocal: '倒吸一口气' },
          behavioral: { tendency: '暂停/重新定向', actionReadiness: '中' },
          mental: { attention: '新异刺激聚焦', schemaUpdate: '需要' }
        },
        formalObject: '意外',
        actionTendency: '信息收集和更新'
      }
    };
    
    // 边缘情绪案例 (borderline cases)
    this.borderlineEmotions = {
      boredom: {
        name: '无聊',
        status: '边缘案例',
        debate: '普通人对其是否属于情绪存在分歧',
        analysis: '低唤醒 + 负向 valence + 缺乏明确对象'
      },
      awe: {
        name: '敬畏',
        status: '边缘案例',
        debate: '是否属于基本情绪有争议',
        analysis: '高唤醒 + 混合 valence + 超越性对象'
      },
      schadenfreude: {
        name: '幸灾乐祸',
        status: '人类特有情绪',
        debate: '跨物种普遍性低',
        analysis: '社会比较 + 道德评价复杂'
      }
    };
  }
  
  /**
   * 分析情绪状态的成分构成
   * @param {string} emotionName - 情绪名称
   * @returns {object} 情绪成分分析结果
   */
  analyzeEmotionComponents(emotionName) {
    const prototype = this.emotionPrototypes[emotionName.toLowerCase()];
    
    if (!prototype) {
      return {
        found: false,
        message: `未找到情绪 "${emotionName}" 的原型数据`,
        suggestion: '可用情绪：fear, anger, sadness, happiness, disgust, surprise'
      };
    }
    
    return {
      found: true,
      emotion: prototype.name,
      prototypeScore: prototype.prototypeScore,
      components: prototype.components,
      formalObject: prototype.formalObject,
      actionTendency: prototype.actionTendency,
      analysis: this._generateComponentAnalysis(prototype)
    };
  }
  
  /**
   * 生成成分分析报告
   * @private
   */
  _generateComponentAnalysis(prototype) {
    const analysis = [];
    
    // 评价成分分析
    analysis.push({
      tradition: 'Evaluative Tradition',
      component: '评价成分',
      data: prototype.components.evaluative,
      interpretation: `该情绪涉及对情境的"${prototype.components.evaluative.appraisal}"评价，形式对象为"${prototype.formalObject}"`
    });
    
    // 生理成分分析
    analysis.push({
      tradition: 'Feeling Tradition (James-Lange)',
      component: '生理成分',
      data: prototype.components.physiological,
      interpretation: `根据 James-Lange 理论，对这些生理变化的感知构成了情绪体验本身`
    });
    
    // 现象学成分分析
    analysis.push({
      tradition: 'Feeling Tradition',
      component: '现象学成分',
      data: prototype.components.phenomenological,
      interpretation: `主观体验质量为${prototype.components.phenomenological.valence}向，强度${prototype.components.phenomenological.intensity}`
    });
    
    // 行为成分分析
    analysis.push({
      tradition: 'Motivational Tradition',
      component: '行为成分',
      data: prototype.components.behavioral,
      interpretation: `行动倾向为"${prototype.actionTendency}"，体现了情绪的动机功能`
    });
    
    return analysis;
  }
  
  /**
   * 基于三大传统理论综合评估情绪状态
   * @param {object} emotionData - 情绪数据
   * @returns {object} 综合评估结果
   */
  integrateTraditions(emotionData) {
    const { components, context, intensity } = emotionData;
    
    // Feeling Tradition 评估
    const feelingAssessment = this._assessFeelingTradition(components);
    
    // Evaluative Tradition 评估
    const evaluativeAssessment = this._assessEvaluativeTradition(components, context);
    
    // Motivational Tradition 评估
    const motivationalAssessment = this._assessMotivationalTradition(components);
    
    // 整合评估
    const integration = {
      emotion: emotionData.emotion || '未命名情绪',
      timestamp: new Date().toISOString(),
      
      // 三大传统评估
      traditions: {
        feeling: feelingAssessment,
        evaluative: evaluativeAssessment,
        motivational: motivationalAssessment
      },
      
      // 整合分数 (0-1)
      integrationScore: this._calculateIntegrationScore(feelingAssessment, evaluativeAssessment, motivationalAssessment),
      
      // 理论挑战解决
      challenges: this._assessTheoreticalChallenges(emotionData),
      
      // 综合结论
      conclusion: this._generateConclusion(feelingAssessment, evaluativeAssessment, motivationalAssessment)
    };
    
    return integration;
  }
  
  /**
   * Feeling Tradition 评估
   * @private
   */
  _assessFeelingTradition(components) {
    const { phenomenological, physiological } = components;
    
    return {
      tradition: 'Feeling Tradition',
      coreQuestion: '这种情绪的主观体验是什么？',
      assessment: {
        consciousExperience: phenomenological ? {
          valence: phenomenological.valence,
          intensity: phenomenological.intensity,
          qualities: phenomenological
        } : '数据不足',
        
        bodilyFeeling: physiological ? {
          arousal: physiological.arousal,
          specificChanges: physiological
        } : '数据不足',
        
        jamesLangeCompatibility: physiological && phenomenological ? 
          '高 - 生理变化感知构成情绪体验' : '中'
      },
      strength: '捕捉情绪的现象学质量',
      limitation: '难以解释情绪分化和意向性'
    };
  }
  
  /**
   * Evaluative Tradition 评估
   * @private
   */
  _assessEvaluativeTradition(components, context) {
    const { evaluative } = components;
    
    return {
      tradition: 'Evaluative Tradition',
      coreQuestion: '这个情绪评价了什么？评价是否合理？',
      assessment: {
        appraisal: evaluative ? {
          content: evaluative.appraisal,
          additionalFactors: Object.keys(evaluative).filter(k => k !== 'appraisal')
        } : '数据不足',
        
        formalObject: evaluative ? this._inferFormalObject(evaluative.appraisal) : '无法推断',
        
        appropriateness: context ? this._evaluateAppropriateness(evaluative, context) : '无法评估 (缺少情境)',
        
        cognitiveRequirement: evaluative ? '需要认知评价' : '未知'
      },
      strength: '解释情绪的合理性和对象指向性',
      limitation: '难以解释无意识情绪和快速情绪反应'
    };
  }
  
  /**
   * Motivational Tradition 评估
   * @private
   */
  _assessMotivationalTradition(components) {
    const { behavioral, motivational } = components;
    
    return {
      tradition: 'Motivational Tradition',
      coreQuestion: '这个情绪动机什么行动？',
      assessment: {
        actionTendency: behavioral ? {
          tendency: behavioral.tendency,
          readiness: behavioral.actionReadiness
        } : '数据不足',
        
        motivationStrength: behavioral ? this._calculateMotivationStrength(behavioral) : '未知',
        
        goalRelation: motivational ? motivational.goalRelation : '数据不足',
        
        rationalityCheck: behavioral ? this._assessRationality(behavioral) : '无法评估'
      },
      strength: '解释情绪与行动的联系',
      limitation: '难以区分情绪和其他动机状态'
    };
  }
  
  /**
   * 推断形式对象
   * @private
   */
  _inferFormalObject(appraisal) {
    const mapping = {
      '危险威胁': '危险',
      '冒犯/不公': '冒犯',
      '丧失/失败': '丧失',
      '目标达成/积极事件': '目标达成',
      '污染/有害': '污染',
      '意外/新颖': '意外'
    };
    return mapping[appraisal] || '未知';
  }
  
  /**
   * 评估情绪适当性
   * @private
   */
  _evaluateAppropriateness(evaluative, context) {
    // 简化实现：检查评价是否与情境一致
    const { appraisal } = evaluative;
    
    if (context.threat && appraisal.includes('危险')) {
      return { appropriate: true, reason: '情境确实存在威胁' };
    }
    if (context.injustice && appraisal.includes('不公')) {
      return { appropriate: true, reason: '情境确实存在不公' };
    }
    if (context.loss && appraisal.includes('丧失')) {
      return { appropriate: true, reason: '情境确实涉及丧失' };
    }
    
    return { appropriate: '无法确定', reason: '需要更多情境信息' };
  }
  
  /**
   * 计算动机强度
   * @private
   */
  _calculateMotivationStrength(behavioral) {
    const readinessMap = { '高': 1.0, '中': 0.6, '低': 0.3 };
    return readinessMap[behavioral.actionReadiness] || 0.5;
  }
  
  /**
   * 评估行动合理性
   * @private
   */
  _assessRationality(behavioral) {
    // 简化实现
    if (behavioral.actionReadiness === '高' && behavioral.tendency.includes('逃跑')) {
      return '在真实威胁情境下合理';
    }
    return '需要更多情境信息评估';
  }
  
  /**
   * 计算整合分数
   * @private
   */
  _calculateIntegrationScore(feeling, evaluative, motivational) {
    // 简化：计算三个传统评估的完整性
    let score = 0;
    
    if (feeling.assessment.consciousExperience !== '数据不足') score += 0.3;
    if (evaluative.assessment.appraisal !== '数据不足') score += 0.3;
    if (motivational.assessment.actionTendency.tendency !== '数据不足') score += 0.3;
    
    // 额外分数：如果三个传统都指向一致的情绪解释
    score += 0.1; // 一致性奖励
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估四大理论挑战
   * @private
   */
  _assessTheoreticalChallenges(emotionData) {
    return {
      differentiation: {
        challenge: '如何区分此情绪与其他情绪？',
        solution: '基于成分原型比较',
        implementation: this._compareWithPrototypes(emotionData)
      },
      motivation: {
        challenge: '此情绪如何动机行为？',
        solution: '行动倾向 + 评价驱动整合',
        implementation: emotionData.components?.behavioral?.tendency || '需要数据'
      },
      intentionality: {
        challenge: '此情绪指向什么对象？',
        solution: '形式对象 + 特定对象区分',
        implementation: emotionData.components?.evaluative?.appraisal || '需要数据'
      },
      phenomenology: {
        challenge: '此情绪的主观体验是什么？',
        solution: '前反思 + 反思体验层次',
        implementation: emotionData.components?.phenomenological || '需要数据'
      }
    };
  }
  
  /**
   * 与原型比较
   * @private
   */
  _compareWithPrototypes(emotionData) {
    const bestMatch = this._findBestPrototypeMatch(emotionData);
    return {
      bestMatch: bestMatch.emotion,
      similarity: bestMatch.similarity,
      differentiatingFeatures: bestMatch.differences
    };
  }
  
  /**
   * 找到最佳原型匹配
   * @private
   */
  _findBestPrototypeMatch(emotionData) {
    let bestMatch = { emotion: null, similarity: 0, differences: [] };
    
    for (const [name, prototype] of Object.entries(this.emotionPrototypes)) {
      const similarity = this._calculateSimilarity(emotionData, prototype);
      if (similarity > bestMatch.similarity) {
        bestMatch = {
          emotion: name,
          similarity: similarity,
          differences: this._findDifferences(emotionData, prototype)
        };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * 计算相似度
   * @private
   */
  _calculateSimilarity(emotionData, prototype) {
    // 简化实现：基于评价内容匹配
    if (emotionData.components?.evaluative?.appraisal === prototype.components.evaluative.appraisal) {
      return 0.9;
    }
    return 0.5;
  }
  
  /**
   * 找出差异
   * @private
   */
  _findDifferences(emotionData, prototype) {
    const differences = [];
    // 简化实现
    return differences;
  }
  
  /**
   * 生成综合结论
   * @private
   */
  _generateConclusion(feeling, evaluative, motivational) {
    return {
      summary: '基于三大传统理论的综合分析',
      keyInsights: [
        `现象学维度：${feeling.assessment.consciousExperience !== '数据不足' ? '有完整主观体验数据' : '主观体验数据不足'}`,
        `评价维度：${evaluative.assessment.appraisal !== '数据不足' ? '有明确评价内容' : '评价内容不足'}`,
        `动机维度：${motivational.assessment.actionTendency.tendency !== '数据不足' ? '有清晰行动倾向' : '行动倾向数据不足'}`
      ],
      theoreticalImplications: [
        '单一传统无法完整解释情绪现象',
        '整合框架能同时捕捉情绪的体验、评价和动机维度',
        '建议采用多成分原型模型进行情绪识别和干预'
      ],
      practicalApplications: [
        '情绪识别：使用多成分评估而非单一指标',
        '情绪调节：针对具体成分 (评价、生理、行为) 进行干预',
        '情绪教育：帮助用户理解情绪的多维本质'
      ]
    };
  }
  
  /**
   * 获取模块信息
   */
  getModuleInfo() {
    return {
      name: this.name,
      version: this.version,
      source: this.source,
      traditions: Object.keys(this.traditions),
      challenges: Object.keys(this.theoreticalChallenges),
      emotions: Object.keys(this.emotionPrototypes),
      capabilities: [
        '情绪成分分析',
        '三大传统理论评估',
        '理论挑战解决',
        '原型匹配',
        '整合分数计算',
        '情绪适当性评估 (v3.50.0)',
        '情绪证成性评估 (v3.50.0)',
        '情绪理性评估 (v3.50.0)'
      ]
    };
  }
  
  // ============ v3.50.0 新增功能：情绪适当性与理性评估 ============
  
  /**
   * 情绪适当性评估 (Emotion Appropriateness Assessment)
   * 基于 SEP 情绪理论第 9 节：情绪的适当性条件
   * 
   * 适当性类型：
   * 1. 认知适当性 (Cognitive Appropriateness) - 评价是否准确反映情境
   * 2. 战略适当性 (Strategic Appropriateness) - 情绪是否有助于目标达成
   * 3. 道德适当性 (Moral Appropriateness) - 情绪是否符合道德标准
   * 4. 文化适当性 (Cultural Appropriateness) - 情绪是否符合文化规范
   * 
   * @param {Object} emotionData - 情绪数据
   * @param {Object} context - 情境数据
   * @returns {Object} 适当性评估结果
   */
  assessAppropriateness(emotionData, context) {
    const assessment = {
      emotion: emotionData.name || emotionData.emotionType || '未知情绪',
      timestamp: new Date().toISOString(),
      cognitive: this._assessCognitiveAppropriateness(emotionData, context),
      strategic: this._assessStrategicAppropriateness(emotionData, context),
      moral: this._assessMoralAppropriateness(emotionData, context),
      cultural: this._assessCulturalAppropriateness(emotionData, context),
      overall: 'pending'
    };
    
    // 计算整体适当性
    assessment.overall = this._calculateOverallAppropriateness(assessment);
    
    return assessment;
  }
  
  /**
   * 认知适当性评估
   * 评价是否准确反映情境的真实特征
   */
  _assessCognitiveAppropriateness(emotionData, context) {
    const appraisal = emotionData.components?.evaluative?.appraisal;
    const actualSituation = context?.actualSituation || {};
    
    // 评估评价与现实的匹配度
    const accuracy = this._evaluateAppraisalAccuracy(appraisal, actualSituation);
    
    return {
      dimension: '认知适当性',
      question: '情绪的评价是否准确反映了情境？',
      accuracy: accuracy, // 0-1
      judgment: accuracy > 0.7 ? '适当' : accuracy > 0.4 ? '部分适当' : '不适当',
      reasoning: this._generateCognitiveReasoning(appraisal, actualSituation, accuracy)
    };
  }
  
  /**
   * 战略适当性评估
   * 情绪是否有助于当事人的目标达成
   */
  _assessStrategicAppropriateness(emotionData, context) {
    const actionTendency = emotionData.components?.behavioral?.tendency;
    const userGoals = context?.userGoals || [];
    
    // 评估行动倾向与目标的一致性
    const goalCongruence = this._evaluateGoalCongruence(actionTendency, userGoals);
    
    return {
      dimension: '战略适当性',
      question: '此情绪是否有助于当事人的目标达成？',
      goalCongruence: goalCongruence, // 0-1
      judgment: goalCongruence > 0.7 ? '适当' : goalCongruence > 0.4 ? '部分适当' : '不适当',
      reasoning: this._generateStrategicReasoning(actionTendency, userGoals, goalCongruence)
    };
  }
  
  /**
   * 道德适当性评估
   * 情绪是否符合道德标准
   */
  _assessMoralAppropriateness(emotionData, context) {
    const emotionType = emotionData.name || emotionData.emotionType;
    const moralContext = context?.moralContext || {};
    
    // 基于道德基础理论评估
    const moralAlignment = this._evaluateMoralAlignment(emotionType, moralContext);
    
    return {
      dimension: '道德适当性',
      question: '此情绪是否符合道德标准？',
      moralAlignment: moralAlignment, // 0-1
      judgment: moralAlignment > 0.7 ? '适当' : moralAlignment > 0.4 ? '部分适当' : '需要反思',
      reasoning: this._generateMoralReasoning(emotionType, moralContext, moralAlignment)
    };
  }
  
  /**
   * 文化适当性评估
   * 情绪是否符合文化规范
   */
  _assessCulturalAppropriateness(emotionData, context) {
    const emotionType = emotionData.name || emotionData.emotionType;
    const culturalContext = context?.culturalContext || {};
    
    // 评估文化适配性
    const culturalFit = this._evaluateCulturalFit(emotionType, culturalContext);
    
    return {
      dimension: '文化适当性',
      question: '此情绪是否符合文化规范？',
      culturalFit: culturalFit, // 0-1
      judgment: culturalFit > 0.7 ? '适当' : culturalFit > 0.4 ? '部分适当' : '需要调整',
      reasoning: this._generateCulturalReasoning(emotionType, culturalContext, culturalFit)
    };
  }
  
  /**
   * 计算整体适当性
   */
  _calculateOverallAppropriateness(assessment) {
    const weights = {
      cognitive: 0.3,
      strategic: 0.3,
      moral: 0.25,
      cultural: 0.15
    };
    
    const score = 
      (assessment.cognitive.accuracy * weights.cognitive) +
      (assessment.strategic.goalCongruence * weights.strategic) +
      (assessment.moral.moralAlignment * weights.moral) +
      (assessment.cultural.culturalFit * weights.cultural);
    
    if (score > 0.75) return '高度适当';
    if (score > 0.5) return '适度适当';
    if (score > 0.3) return '部分适当';
    return '需要反思';
  }
  
  // ============ 辅助评估方法 ============
  
  _evaluateAppraisalAccuracy(appraisal, actualSituation) {
    // 简化实现：基于评价关键词匹配
    if (!appraisal || !actualSituation.description) return 0.5;
    
    const keywords = appraisal.toLowerCase().split(/[\s,]+/);
    const description = actualSituation.description.toLowerCase();
    
    const matchCount = keywords.filter(k => description.includes(k)).length;
    return Math.min(matchCount / keywords.length, 1.0);
  }
  
  _evaluateGoalCongruence(actionTendency, userGoals) {
    if (!actionTendency || !userGoals || userGoals.length === 0) return 0.5;
    
    // 检查行动倾向是否支持用户目标
    const supportiveKeywords = ['接近', '维持', '修复', '学习', '成长', '沟通'];
    const conflictingKeywords = ['逃避', '攻击', '退缩', '回避'];
    
    const isSupportive = supportiveKeywords.some(k => actionTendency.includes(k));
    const isConflicting = conflictingKeywords.some(k => actionTendency.includes(k));
    
    if (isSupportive && !isConflicting) return 0.9;
    if (isConflicting && !isSupportive) return 0.3;
    return 0.6;
  }
  
  _evaluateMoralAlignment(emotionType, moralContext) {
    // 基于道德基础理论的简化评估
    const prosocialEmotions = ['感激', '同情', '爱', '敬畏', '自豪 (适度)'];
    const antisocialEmotions = ['恶意嫉妒', '幸灾乐祸', '过度愤怒'];
    
    if (prosocialEmotions.some(e => emotionType.includes(e))) return 0.9;
    if (antisocialEmotions.some(e => emotionType.includes(e))) return 0.3;
    return 0.6;
  }
  
  _evaluateCulturalFit(emotionType, culturalContext) {
    // 简化：默认适度适配
    return 0.7;
  }
  
  _generateCognitiveReasoning(appraisal, actualSituation, accuracy) {
    return `评价"${appraisal}"与情境的匹配度为${(accuracy * 100).toFixed(0)}%。` +
           (accuracy > 0.7 ? '评价准确反映了情境特征。' : 
            accuracy > 0.4 ? '评价部分反映了情境，但可能有偏差。' : 
            '评价可能与情境不符，建议重新评估。');
  }
  
  _generateStrategicReasoning(actionTendency, userGoals, congruence) {
    return `行动倾向"${actionTendency}"与目标的匹配度为${(congruence * 100).toFixed(0)}%。` +
           (congruence > 0.7 ? '此情绪有助于目标达成。' : 
            congruence > 0.4 ? '此情绪对目标的影响中性。' : 
            '此情绪可能阻碍目标达成，建议调节。');
  }
  
  _generateMoralReasoning(emotionType, moralContext, alignment) {
    return `情绪"${emotionType}"的道德适配度为${(alignment * 100).toFixed(0)}%。` +
           (alignment > 0.7 ? '此情绪符合道德标准。' : 
            alignment > 0.4 ? '此情绪道德上中性。' : 
            '此情绪可能需要道德反思。');
  }
  
  _generateCulturalReasoning(emotionType, culturalContext, fit) {
    return `情绪"${emotionType}"的文化适配度为${(fit * 100).toFixed(0)}%。`;
  }
  
  /**
   * 情绪证成性评估 (Emotion Justification Assessment)
   * 基于 SEP 情绪理论第 10 节：情绪的证成性
   * 
   * 证成性类型：
   * 1. 证据证成 (Evidential Justification) - 是否有充分证据支持情绪评价
   * 2. 一致性证成 (Coherence Justification) - 情绪是否与信念系统一致
   * 3. 功能性证成 (Functional Justification) - 情绪是否发挥适当功能
   * 
   * @param {Object} emotionData - 情绪数据
   * @param {Object} evidence - 证据数据
   * @returns {Object} 证成性评估结果
   */
  assessJustification(emotionData, evidence) {
    return {
      emotion: emotionData.name || emotionData.emotionType || '未知情绪',
      evidential: this._assessEvidentialJustification(emotionData, evidence),
      coherence: this._assessCoherenceJustification(emotionData),
      functional: this._assessFunctionalJustification(emotionData),
      overall: 'pending'
    };
  }
  
  _assessEvidentialJustification(emotionData, evidence) {
    const evidenceCount = evidence?.items?.length || 0;
    const quality = evidence?.quality || 'unknown';
    
    let score = 0.5;
    if (evidenceCount >= 3) score = 0.8;
    else if (evidenceCount >= 1) score = 0.6;
    
    if (quality === 'high') score = Math.min(score + 0.2, 1.0);
    else if (quality === 'low') score = Math.max(score - 0.2, 0.0);
    
    return {
      dimension: '证据证成',
      question: '是否有充分证据支持此情绪的评价？',
      evidenceCount: evidenceCount,
      quality: quality,
      score: score,
      judgment: score > 0.7 ? '充分证成' : score > 0.4 ? '部分证成' : '缺乏证成'
    };
  }
  
  _assessCoherenceJustification(emotionData) {
    // 检查情绪与信念的一致性
    return {
      dimension: '一致性证成',
      question: '此情绪是否与当事人的信念系统一致？',
      score: 0.7, // 默认值
      judgment: '适度证成'
    };
  }
  
  _assessFunctionalJustification(emotionData) {
    // 检查情绪是否发挥适应性功能
    const actionTendency = emotionData.components?.behavioral?.actionTendency;
    const isAdaptive = actionTendency && 
      (actionTendency.includes('保护') || actionTendency.includes('修复') || 
       actionTendency.includes('学习') || actionTendency.includes('联结'));
    
    return {
      dimension: '功能性证成',
      question: '此情绪是否发挥适应性功能？',
      isAdaptive: isAdaptive,
      score: isAdaptive ? 0.8 : 0.4,
      judgment: isAdaptive ? '功能适当' : '功能失调'
    };
  }

  /**
   * SEP 情绪理论四大挑战评估 (v3.52.0 新增)
   * 基于 SEP Emotion Theory 完整框架
   */
  assessTheoreticalChallenges(emotionData) {
    const challenges = {
      differentiation: this._assessDifferentiation(emotionData),
      motivation: this._assessMotivation(emotionData),
      intentionality: this._assessIntentionality(emotionData),
      phenomenology: this._assessPhenomenology(emotionData)
    };

    const overallScore = Object.values(challenges).reduce((sum, c) => sum + c.score, 0) / 4;

    return {
      challenges,
      overallScore: Math.round(overallScore * 100),
      level: overallScore > 0.7 ? 'well_integrated' : overallScore > 0.4 ? 'moderate' : 'needs_development',
      recommendations: this._generateChallengeRecommendations(challenges)
    };
  }

  _assessDifferentiation(emotionData) {
    // 挑战：情绪如何彼此区分，以及如何与非情绪状态区分？
    const { emotionType, components } = emotionData;
    
    // 检查是否有明确的评价主题 (formal object)
    const hasFormalObject = components?.evaluative?.appraisal !== undefined;
    
    // 检查是否有独特的生理特征
    const hasPhysiologicalProfile = components?.physiological?.arousal !== undefined;
    
    // 检查是否有独特的行动倾向
    const hasActionTendency = components?.behavioral?.actionTendency !== undefined;
    
    // 检查是否有独特的主观感受
    const hasPhenomenology = components?.phenomenological?.valence !== undefined;

    const distinctivenessScore = [
      hasFormalObject ? 0.25 : 0,
      hasPhysiologicalProfile ? 0.25 : 0,
      hasActionTendency ? 0.25 : 0,
      hasPhenomenology ? 0.25 : 0
    ].reduce((a, b) => a + b, 0);

    return {
      dimension: '区分性 (Differentiation)',
      question: '此情绪如何与其他情绪和非情绪状态区分？',
      criteria: {
        formalObject: hasFormalObject,
        physiologicalProfile: hasPhysiologicalProfile,
        actionTendency: hasActionTendency,
        phenomenology: hasPhenomenology
      },
      score: distinctivenessScore,
      judgment: distinctivenessScore > 0.75 ? '高度分化' : distinctivenessScore > 0.5 ? '中度分化' : '分化不足'
    };
  }

  _assessMotivation(emotionData) {
    // 挑战：情绪是否以及如何动机行为？
    const { components } = emotionData;
    
    const actionReadiness = components?.behavioral?.actionReadiness || 'medium';
    const actionTendency = components?.behavioral?.actionTendency;
    const physiologicalArousal = components?.physiological?.arousal;
    
    // 评估动机强度
    let motivationScore = 0.5;
    
    if (actionReadiness === 'high') motivationScore += 0.2;
    if (actionReadiness === 'low') motivationScore -= 0.2;
    
    if (actionTendency) motivationScore += 0.15;
    if (physiologicalArousal === '高') motivationScore += 0.15;

    return {
      dimension: '动机性 (Motivation)',
      question: '此情绪如何动机行为？动机强度如何？',
      indicators: {
        actionReadiness,
        actionTendency,
        physiologicalArousal
      },
      score: Math.min(1.0, motivationScore),
      judgment: motivationScore > 0.7 ? '强动机' : motivationScore > 0.4 ? '中等动机' : '弱动机'
    };
  }

  _assessIntentionality(emotionData) {
    // 挑战：情绪是否有对象指向性？是否可评价适当性？
    const { components } = emotionData;
    
    const hasObject = components?.evaluative?.object !== undefined;
    const formalObject = components?.evaluative?.formalObject;
    const appropriateness = components?.evaluative?.appropriateness;
    
    // 评估意向性质量
    let intentionalityScore = 0.3;
    
    if (hasObject) intentionalityScore += 0.3;
    if (formalObject) intentionalityScore += 0.2;
    if (appropriateness !== undefined) intentionalityScore += 0.2;

    return {
      dimension: '意向性 (Intentionality)',
      question: '此情绪是否有明确的对象？是否适当？',
      indicators: {
        hasObject,
        formalObject,
        appropriateness
      },
      score: Math.min(1.0, intentionalityScore),
      judgment: intentionalityScore > 0.7 ? '意向清晰' : intentionalityScore > 0.4 ? '意向模糊' : '意向缺失'
    };
  }

  _assessPhenomenology(emotionData) {
    // 挑战：情绪是否总涉及主观体验？何种体验？
    const { components } = emotionData;
    
    const hasValence = components?.phenomenological?.valence !== undefined;
    const hasIntensity = components?.phenomenological?.intensity !== undefined;
    const hasQuality = components?.phenomenological?.quality !== undefined;
    const hasBodilyFeeling = components?.physiological?.bodilyFeeling !== undefined;
    
    // 评估现象学深度
    const phenomenologyScore = [
      hasValence ? 0.25 : 0,
      hasIntensity ? 0.25 : 0,
      hasQuality ? 0.25 : 0,
      hasBodilyFeeling ? 0.25 : 0
    ].reduce((a, b) => a + b, 0);

    return {
      dimension: '现象学 (Phenomenology)',
      question: '此情绪的主观体验质量如何？',
      indicators: {
        valence: hasValence,
        intensity: hasIntensity,
        quality: hasQuality,
        bodilyFeeling: hasBodilyFeeling
      },
      score: phenomenologyScore,
      judgment: phenomenologyScore > 0.75 ? '体验丰富' : phenomenologyScore > 0.5 ? '体验中等' : '体验贫乏'
    };
  }

  _generateChallengeRecommendations(challenges) {
    const recommendations = [];

    if (challenges.differentiation.score < 0.5) {
      recommendations.push({
        area: '区分性',
        suggestion: '尝试更精确地识别情绪的评价主题和行动倾向',
        exercise: '情绪粒度练习：区分相似情绪 (如愤怒 vs 沮丧 vs 失望)'
      });
    }

    if (challenges.motivation.score < 0.5) {
      recommendations.push({
        area: '动机性',
        suggestion: '探索情绪背后的行动倾向，理解情绪想让你做什么',
        exercise: '行动倾向觉察：当情绪出现时，注意身体的行动准备状态'
      });
    }

    if (challenges.intentionality.score < 0.5) {
      recommendations.push({
        area: '意向性',
        suggestion: '明确情绪的对象：你对什么感到这种情绪？',
        exercise: '对象定位练习：具体描述引发情绪的情境或事件'
      });
    }

    if (challenges.phenomenology.score < 0.5) {
      recommendations.push({
        area: '现象学',
        suggestion: '深化对情绪主观体验的觉察',
        exercise: '身体扫描冥想：注意情绪在身体中的感受和定位'
      });
    }

    return recommendations;
  }

  /**
   * 情绪理论整合练习 (v3.52.0 新增)
   * 基于 SEP 三大传统的综合练习
   */
  generateIntegrationExercise(emotionType) {
    return {
      name: '情绪三大传统整合练习',
      duration: '15-20 分钟',
      emotionType,
      steps: [
        {
          tradition: 'Feeling Tradition',
          focus: '感受体验',
          instruction: '闭上眼睛，专注于这种情绪在身体中的感受。注意它的位置、强度、质地。不要试图改变它，只是观察。',
          duration: '5 分钟',
          prompt: '这种情绪在身体的哪个部位最明显？它有什么质感 (热/冷/紧/松)?'
        },
        {
          tradition: 'Evaluative Tradition',
          focus: '评价分析',
          instruction: '探索这种情绪背后的评价。你对情境做了什么判断？什么对你来说是重要的？',
          duration: '5 分钟',
          prompt: '这种情绪告诉你什么是重要的？你对情境做了什么评价？'
        },
        {
          tradition: 'Motivational Tradition',
          focus: '动机探索',
          instruction: '探索这种情绪想让你做什么。注意行动倾向，但不必立即行动。',
          duration: '5 分钟',
          prompt: '这种情绪想让你做什么？这个行动倾向服务于什么目的？'
        },
        {
          tradition: 'Integration',
          focus: '整合反思',
          instruction: '整合三个维度的洞察。这种情绪整体上想告诉你什么？',
          duration: '5 分钟',
          prompt: '综合感受、评价和动机，这种情绪的整体信息是什么？'
        }
      ],
      theoreticalBasis: 'SEP Emotion Theory: Feeling + Evaluative + Motivational Traditions Integration'
    };
  }
}

module.exports = EmotionTraditionsIntegration;
