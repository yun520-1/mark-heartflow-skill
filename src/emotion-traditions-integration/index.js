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
    this.version = '1.0.0';
    this.source = 'SEP Emotion Theory';
    
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
        '整合分数计算'
      ]
    };
  }
}

module.exports = EmotionTraditionsIntegration;
