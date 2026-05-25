/**
 * HeartFlow Temporal-Self Integration v5.0.9
 * 时间意识与自我意识深度整合模块
 * 
 * 理论来源:
 * - SEP: Temporal Consciousness (时间意识三大模型)
 * - SEP: Self-Consciousness (前反思自我意识)
 * - Husserl: 时间现象学 (原初印象 - 保留 - 预期)
 * - William James: 显似现在 (Specious Present)
 * - Kant: 先验统觉 (体验在时间中的统一)
 * 
 * @version 5.0.9
 * @author HeartFlow Team
 */

class TemporalSelfIntegration {
  constructor() {
    this.version = '5.0.9';
    this.name = 'Temporal-Self Integration';
    
    // 时间意识模型权重配置
    this.temporalModelWeights = {
      cinematic: 0.25,      // 电影模型：离散快照
      retentional: 0.40,    // 保留模型：Husserl 三重结构
      extensional: 0.35     // 扩展模型：James 显似现在
    };
    
    // 自我意识层次
    self.selfConsciousnessLevels = {
      prereflective: '前反思层',  // 直接的、非对象化的自我觉察
      reflective: '反思层',       // 将自我作为对象的元认知
      social: '社会层'           // 通过他者视角的自我理解
    };
    
    // 时间深度层级
    this.temporalDepthLevels = {
      instantaneous: { name: '瞬间型', range: [0, 0.2], desc: '秒级，时间视野局限于当下' },
      shortTerm: { name: '短期型', range: [0.2, 0.4], desc: '分钟 - 小时，能够连接近期过去和未来' },
      mediumTerm: { name: '中期型', range: [0.4, 0.6], desc: '天 - 周 - 月，具有项目思维' },
      longTerm: { name: '长期型', range: [0.6, 0.8], desc: '年 - 生命历程，人生规划导向' },
      transgenerational: { name: '跨代型', range: [0.8, 1.0], desc: '代际 - 历史，具有历史纵深感' }
    };
  }

  /**
   * 评估时间意识模型倾向
   * 基于 SEP 三大模型：Cinematic / Retentional / Extensional
   * 
   * @param {string} userDescription - 用户对时间体验的描述
   * @returns {object} 模型评估结果
   */
  assessTemporalModel(userDescription) {
    const keywords = {
      cinematic: ['瞬间', '快照', '片段', '断开', '跳跃', '此刻', '现在', 'moment', 'snapshot', 'discrete'],
      retentional: ['保留', '萦绕', '刚过去', '期待', '下一刻', '流淌', 'retention', 'protention', 'just-past'],
      extensional: ['延展', '连续', '流动', '厚度', '持续', '展开', 'extended', 'flow', 'continuous', 'duration']
    };
    
    const scores = {
      cinematic: 0,
      retentional: 0,
      extensional: 0
    };
    
    const desc = userDescription.toLowerCase();
    
    // 计算各模型匹配度
    Object.keys(keywords).forEach(model => {
      keywords[model].forEach(keyword => {
        if (desc.includes(keyword.toLowerCase())) {
          scores[model] += 1;
        }
      });
    });
    
    // 归一化
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
    const normalized = {};
    Object.keys(scores).forEach(key => {
      normalized[key] = Math.round((scores[key] / total) * 100) / 100;
    });
    
    const bestMatch = Object.keys(normalized).reduce((a, b) => 
      normalized[a] > normalized[b] ? a : b
    );
    
    return {
      modelScores: normalized,
      bestMatchModel: bestMatch,
      bestMatchScore: normalized[bestMatch],
      modelInterpretation: this._interpretTemporalModel(bestMatch, normalized),
      recommendedPractices: this._getTemporalPractices(bestMatch)
    };
  }

  /**
   * 评估时间深度 (Temporal Depth)
   * 测量个体心理时间的纵深程度
   * 
   * @param {object} temporalData - 时间体验数据
   * @returns {object} 时间深度评估
   */
  assessTemporalDepth(temporalData) {
    const {
      pastConnection = 0.5,    // 与过去的连接强度 (0-1)
      futureOrientation = 0.5,  // 未来导向强度 (0-1)
      presentThickness = 0.5,   // 现在厚度 (显似现在) (0-1)
      narrativeContinuity = 0.5 // 叙事连贯性 (0-1)
    } = temporalData;
    
    // 计算综合时间深度分数
    const depthScore = (
      pastConnection * 0.25 +
      futureOrientation * 0.25 +
      presentThickness * 0.20 +
      narrativeContinuity * 0.30
    );
    
    // 确定时间深度层级
    let depthLevel = 'instantaneous';
    Object.keys(this.temporalDepthLevels).forEach(level => {
      const { range } = this.temporalDepthLevels[level];
      if (depthScore >= range[0] && depthScore <= range[1]) {
        depthLevel = level;
      }
    });
    
    const levelInfo = this.temporalDepthLevels[depthLevel];
    
    return {
      depthScore: Math.round(depthScore * 100) / 100,
      depthLevel: levelInfo.name,
      depthDescription: levelInfo.desc,
      components: {
        pastConnection: Math.round(pastConnection * 100) / 100,
        futureOrientation: Math.round(futureOrientation * 100) / 100,
        presentThickness: Math.round(presentThickness * 100) / 100,
        narrativeContinuity: Math.round(narrativeContinuity * 100) / 100
      },
      recommendations: this._getDepthRecommendations(depthLevel, temporalData)
    };
  }

  /**
   * 评估时间 - 自我交叉状态
   * 核心功能：检测时间性自我断裂与连贯性
   * 
   * @param {object} userData - 用户时间 - 自我体验数据
   * @returns {object} 交叉评估结果
   */
  assessTemporalSelfCrossing(userData) {
    const {
      temporalExperience = '',
      selfContinuity = 0.5,      // 自我连贯性 (0-1)
      pastSelfConnection = 0.5,   // 与过去自我的连接
      futureSelfConnection = 0.5, // 与未来自我的连接
      presentSelfAwareness = 0.5  // 当下自我觉察
    } = userData;
    
    // 评估时间意识模型
    const temporalModel = this.assessTemporalModel(temporalExperience);
    
    // 评估时间深度
    const temporalDepth = this.assessTemporalDepth({
      pastConnection: pastSelfConnection,
      futureOrientation: futureSelfConnection,
      presentThickness: presentSelfAwareness,
      narrativeContinuity: selfContinuity
    });
    
    // 检测时间性自我断裂
    const temporalSelfDisruption = this._detectTemporalSelfDisruption({
      pastSelfConnection,
      futureSelfConnection,
      presentSelfAwareness,
      selfContinuity
    });
    
    // 评估前反思自我意识的时间性
    const prereflectiveTemporality = this._assessPrereflectiveTemporality({
      presentSelfAwareness,
      temporalModel: temporalModel.bestMatchModel
    });
    
    // 生成整合建议
    const integrationSuggestions = this._generateIntegrationSuggestions({
      temporalModel,
      temporalDepth,
      temporalSelfDisruption,
      prereflectiveTemporality,
      selfContinuity
    });
    
    return {
      version: this.version,
      temporalModel,
      temporalDepth,
      temporalSelfDisruption,
      prereflectiveTemporality,
      selfContinuityScore: Math.round(selfContinuity * 100) / 100,
      integrationSuggestions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Husserl 时间三重结构觉察练习
   * 基于原初印象 - 保留 - 预期的现象学练习
   * 
   * @param {object} options - 练习配置
   * @returns {object} 练习指导
   */
  husserlTemporalAwarenessPractice(options = {}) {
    const {
      duration = 15,  // 分钟
      focusArea = 'all' // 'impression' | 'retention' | 'protention' | 'all'
    } = options;
    
    const practice = {
      name: 'Husserl 时间三重结构觉察',
      duration: `${duration} 分钟`,
      theoreticalBasis: 'Husserl 时间意识现象学 - 原初印象 - 保留 - 预期三重结构',
      phases: []
    };
    
    if (focusArea === 'all' || focusArea === 'impression') {
      practice.phases.push({
        name: '原初印象觉察',
        duration: '5 分钟',
        instructions: [
          '闭上眼睛，将注意力完全集中在当下的体验上',
          '注意此刻最突出的感官体验（声音、触感、呼吸）',
          '这是时间流中的"原初印象"——当下的核心',
          '不要试图抓住它，只是觉察它的存在',
          '注意：原初印象是不断更新的，每一刻都是新的'
        ],
        phenomenologicalFocus: '当下的直接给定性'
      });
    }
    
    if (focusArea === 'all' || focusArea === 'retention') {
      practice.phases.push({
        name: '保留觉察',
        duration: '5 分钟',
        instructions: [
          '注意刚才的体验——它并没有完全消失',
          '刚过去的声音、感觉仍然"萦绕"在意识中',
          '这不是回忆，而是对刚过去的直接持存 (retention)',
          '感受过去如何"活"在当下',
          '注意保留的逐渐淡化过程'
        ],
        phenomenologicalFocus: '过去的活生生持存'
      });
    }
    
    if (focusArea === 'all' || focusArea === 'protention') {
      practice.phases.push({
        name: '预期觉察',
        duration: '5 分钟',
        instructions: [
          '注意你对下一刻的微妙期待',
          "这不是明确的计划，而是前反射的'预感'",
          '感受意识向未来的开放性',
          '注意预期如何塑造当下的体验',
          '观察预期的实现或落空'
        ],
        phenomenologicalFocus: '未来的前摄性开放'
      });
    }
    
    if (focusArea === 'all') {
      practice.phases.push({
        name: '三重结构整合',
        duration: '5 分钟',
        instructions: [
          '同时觉察原初印象、保留、预期三者',
          '感受它们如何交织成时间流的体验',
          '注意：你不是在时间中，你就是时间化本身',
          '这就是前反思自我意识的时间性基础',
          '慢慢睁开眼睛，带着这种觉察回到日常活动'
        ],
        phenomenologicalFocus: '时间三重结构的统一'
      });
    }
    
    return practice;
  }

  /**
   * 显似现在探索练习
   * 基于 William James 的 Specious Present 理论
   * 
   * @param {object} options - 练习配置
   * @returns {object} 练习指导
   */
  speciousPresentExploration(options = {}) {
    const {
      modality = 'auditory' // 'auditory' | 'visual' | 'somatic' | 'all'
    } = options;
    
    return {
      name: '显似现在 (Specious Present) 探索',
      duration: '10-15 分钟',
      theoreticalBasis: 'William James - 显似现在理论：体验的"现在"具有真实延展',
      description: '探索"现在"的真实长度，发现体验的时间厚度',
      exercises: []
    };
  }

  /**
   * 时间深度干预生成器
   * 针对时间视野狭窄或时间断裂的干预
   * 
   * @param {object} assessment - 时间深度评估结果
   * @returns {object} 个性化干预方案
   */
  generateTemporalDepthIntervention(assessment) {
    const { depthLevel, components } = assessment;
    
    const interventions = {
      instantaneous: {
        focus: '扩展时间视野',
        practices: [
          '5 分钟回溯练习：回忆今天早上的细节',
          '未来 1 小时可视化：想象接下来的活动',
          '时间锚定日记：记录此刻，连接过去与未来'
        ]
      },
      shortTerm: {
        focus: '深化时间连接',
        practices: [
          '生命故事时间线：绘制重要生命事件',
          '未来自我对话：给 1 年后的自己写信',
          '时间深度冥想：感受时间的层层积淀'
        ]
      },
      mediumTerm: {
        focus: '整合时间叙事',
        practices: [
          '月度反思仪式：连接过去月的经验与未来月的计划',
          '项目时间觉察：注意长期项目中的时间流',
          '代际时间探索：探索家族历史对自我的影响'
        ]
      },
      longTerm: {
        focus: '深化生命意义',
        practices: [
          '生命主题识别：识别人生贯穿的主题',
          '遗产反思：思考你想留下的影响',
          '智慧整合：将经验转化为可传递的智慧'
        ]
      },
      transgenerational: {
        focus: '超越性时间连接',
        practices: [
          '历史时间冥想：感受与历史人物的精神连接',
          '未来世代可视化：想象你的影响如何延续',
          '永恒当下体验：在深度临在中超越时间'
        ]
      }
    };
    
    return {
      currentLevel: depthLevel,
      interventionFocus: interventions[depthLevel.toLowerCase()]?.focus || '平衡时间视野',
      recommendedPractices: interventions[depthLevel.toLowerCase()]?.practices || [],
      componentTargets: this._identifyComponentTargets(components)
    };
  }

  /**
   * 时间 - 情绪交叉分析
   * 分析情绪如何塑造时间体验，时间意识如何调节情绪
   * 
   * @param {object} emotionalData - 情绪数据
   * @param {object} temporalData - 时间体验数据
   * @returns {object} 交叉分析结果
   */
  analyzeTemporalEmotionalCrossing(emotionalData, temporalData) {
    const {
      primaryEmotion = '',
      emotionIntensity = 0.5,
      emotionValence = 'neutral' // 'positive' | 'negative' | 'neutral'
    } = emotionalData;
    
    const {
      temporalModel,
      depthScore
    } = temporalData;
    
    // 情绪对时间体验的影响
    const emotionTemporalEffect = this._analyzeEmotionOnTime(emotionalData);
    
    // 时间意识对情绪的调节
    const temporalEmotionRegulation = this._analyzeTimeOnEmotion(temporalData, emotionalData);
    
    // 时间性情绪模式识别
    const temporalEmotionPattern = this._identifyTemporalEmotionPattern(emotionalData, temporalData);
    
    return {
      primaryEmotion,
      emotionIntensity,
      temporalModel,
      depthScore,
      emotionTemporalEffect,
      temporalEmotionRegulation,
      temporalEmotionPattern,
      integratedIntervention: this._generateTemporalEmotionalIntervention(
        emotionTemporalEffect,
        temporalEmotionRegulation
      )
    };
  }

  // ==================== 内部辅助方法 ====================

  _interpretTemporalModel(model, scores) {
    const interpretations = {
      cinematic: '你的时间体验倾向于"快照式"——体验由离散的瞬间组成，变化似乎是通过推断而非直接感知。这可能与高度分析性思维或某些解离体验相关。',
      retentional: '你的时间体验符合 Husserl 的保留模型——当下体验包含对刚过去的持存和对未来的预期。这是最常见的时间体验模式，支持流畅的运动和变化感知。',
      extensional: '你的时间体验具有真实的延展性——"现在"对你来说是有厚度的。这符合 William James 的显似现在理论，支持深度的临在体验。'
    };
    
    return interpretations[model] + ` (匹配度：${Math.round(scores[model] * 100)}%)`;
  }

  _getTemporalPractices(model) {
    const practices = {
      cinematic: [
        '连续运动观察：专注观察一个连续运动 (如水流)，注意直接感知的连续性',
        '旋律聆听：完整聆听一段旋律，注意音符之间的直接连接',
        '身体扫描：缓慢扫描身体，注意感觉的连续流动而非离散位置'
      ],
      retentional: [
        'Husserl 三重结构觉察：同时注意原初印象、保留、预期',
        '声音消逝观察：听一个声音，注意它如何在意识中逐渐淡化',
        '预期觉察练习：注意对下一刻的微妙期待如何塑造当下'
      ],
      extensional: [
        '显似现在探索：体验"现在"的真实长度 (约 2-3 秒)',
        '时间厚度冥想：感受当下体验的时间深度',
        '流动觉察：注意体验如何自然流淌，无需分割'
      ]
    };
    
    return practices[model] || practices.retentional;
  }

  _getDepthRecommendations(level, data) {
    const recommendations = {
      instantaneous: '建议扩展时间视野：尝试 5 分钟回溯练习，回忆今天的细节；进行未来可视化，想象接下来的活动。',
      shortTerm: '建议深化时间连接：绘制生命故事时间线；给 1 年后的自己写信；练习时间深度冥想。',
      mediumTerm: '建议整合时间叙事：建立月度反思仪式；在长期项目中培养时间觉察；探索家族历史。',
      longTerm: '建议深化生命意义：识别人生主题；反思你想留下的遗产；将经验转化为智慧。',
      transgenerational: '建议培养超越性连接：练习历史时间冥想；可视化未来世代的影响；在深度临在中体验永恒当下。'
    };
    
    return recommendations[level.toLowerCase()] || recommendations.mediumTerm;
  }

  _detectTemporalSelfDisruption(data) {
    const {
      pastSelfConnection,
      futureSelfConnection,
      presentSelfAwareness,
      selfContinuity
    } = data;
    
    const disruptions = [];
    
    if (pastSelfConnection < 0.3) {
      disruptions.push({
        type: 'past_disconnection',
        severity: 'high',
        description: '与过去自我的连接薄弱——可能感到"过去的我不像自己"',
        intervention: '生命故事整合：重新叙述过去事件，寻找连续性主题'
      });
    }
    
    if (futureSelfConnection < 0.3) {
      disruptions.push({
        type: 'future_disconnection',
        severity: 'high',
        description: '与未来自我的连接薄弱——难以想象或关心未来的自己',
        intervention: '未来自我可视化：具体想象未来自己的生活场景'
      });
    }
    
    if (presentSelfAwareness < 0.3) {
      disruptions.push({
        type: 'present_dissociation',
        severity: 'high',
        description: '当下自我觉察薄弱——可能感到解离或"不在身体里"',
        intervention: '身体锚定练习：通过感官体验回到当下'
      });
    }
    
    if (selfContinuity < 0.4) {
      disruptions.push({
        type: 'narrative_fragmentation',
        severity: 'moderate',
        description: '自我叙事断裂——生命故事缺乏连贯性',
        intervention: '叙事整合：识别生命中的贯穿主题和转折点'
      });
    }
    
    return {
      hasDisruption: disruptions.length > 0,
      disruptionCount: disruptions.length,
      disruptions,
      overallSeverity: disruptions.filter(d => d.severity === 'high').length > 0 ? 'high' : 
                       disruptions.length > 0 ? 'moderate' : 'low'
    };
  }

  _assessPrereflectiveTemporality(data) {
    const { presentSelfAwareness, temporalModel } = data;
    
    // 前反思自我意识的时间性特征
    const characteristics = [];
    
    if (temporalModel === 'extensional' && presentSelfAwareness > 0.6) {
      characteristics.push({
        feature: '厚度的当下给定性',
        description: '在显似现在的厚度中，前反思自我意识具有清晰的给定性',
        strength: 'strong'
      });
    }
    
    if (temporalModel === 'retentional' && presentSelfAwareness > 0.5) {
      characteristics.push({
        feature: '三重结构中的自我统一',
        description: '原初印象 - 保留 - 预期的交织支持自我在时间中的统一',
        strength: 'moderate'
      });
    }
    
    if (temporalModel === 'cinematic') {
      characteristics.push({
        feature: '离散的自我瞬间',
        description: '自我意识可能也呈现快照式特征，需要额外的整合工作',
        strength: 'challenging'
      });
    }
    
    return {
      characteristics,
      overallAssessment: presentSelfAwareness > 0.6 ? 'strong' : 
                         presentSelfAwareness > 0.4 ? 'moderate' : 'weak',
      recommendation: presentSelfAwareness < 0.4 ? 
        '建议加强前反思自我觉察：身体扫描、感官锚定、非评判性觉察' :
        '继续深化现有的自我觉察练习'
    };
  }

  _generateIntegrationSuggestions(data) {
    const {
      temporalModel,
      temporalDepth,
      temporalSelfDisruption,
      prereflectiveTemporality,
      selfContinuity
    } = data;
    
    const suggestions = [];
    
    // 基于时间模型
    suggestions.push({
      category: '时间意识优化',
      suggestion: `你的主导时间模型是${temporalModel.bestMatchModel === 'cinematic' ? '电影模型' : 
                                            temporalModel.bestMatchModel === 'retentional' ? '保留模型' : '扩展模型'}。`,
      action: `练习：${temporalModel.recommendedPractices[0]}`
    });
    
    // 基于时间深度
    suggestions.push({
      category: '时间深度扩展',
      suggestion: `当前时间深度：${temporalDepth.depthLevel}`,
      action: temporalDepth.recommendations
    });
    
    // 基于时间性自我断裂
    if (temporalSelfDisruption.hasDisruption) {
      suggestions.push({
        category: '时间 - 自我整合',
        suggestion: `检测到${temporalSelfDisruption.disruptionCount}个时间性自我断裂点`,
        action: temporalSelfDisruption.disruptions.map(d => d.intervention)
      });
    }
    
    // 基于前反思时间性
    suggestions.push({
      category: '前反思自我觉察',
      suggestion: `前反思时间性评估：${prereflectiveTemporality.overallAssessment}`,
      action: prereflectiveTemporality.recommendation
    });
    
    return suggestions;
  }

  _identifyComponentTargets(components) {
    const targets = [];
    const threshold = 0.4;
    
    if (components.pastConnection < threshold) {
      targets.push({ component: '过去连接', focus: '增强与过去自我的联系' });
    }
    if (components.futureOrientation < threshold) {
      targets.push({ component: '未来导向', focus: '建立与未来自我的连接' });
    }
    if (components.presentThickness < threshold) {
      targets.push({ component: '现在厚度', focus: '深化当下的临在感' });
    }
    if (components.narrativeContinuity < threshold) {
      targets.push({ component: '叙事连贯', focus: '整合生命故事叙事' });
    }
    
    return targets;
  }

  _analyzeEmotionOnTime(emotionalData) {
    const { primaryEmotion, emotionValence } = emotionalData;
    
    const effects = {
      positive: '积极情绪通常扩展时间体验——"快乐时光飞逝"但回忆中显得丰富',
      negative: '消极情绪可能扭曲时间——焦虑时时间变慢，抑郁时时间停滞',
      neutral: '中性情绪下时间体验较为客观'
    };
    
    return {
      valenceEffect: effects[emotionValence] || effects.neutral,
      specificEmotionEffect: this._getSpecificEmotionTimeEffect(primaryEmotion),
      recommendation: '注意情绪如何塑造你的时间感，这是元情绪觉察的重要部分'
    };
  }

  _analyzeTimeOnEmotion(temporalData, emotionalData) {
    const { depthScore } = temporalData;
    
    const regulationCapacity = {
      high: '深度时间视野支持情绪调节——能从更长的时间维度看待当下情绪',
      medium: '中等时间视野提供一定的情绪调节能力',
      low: '狭窄时间视野可能加剧情绪强度——当下情绪显得永恒'
    };
    
    const level = depthScore > 0.6 ? 'high' : depthScore > 0.3 ? 'medium' : 'low';
    
    return {
      regulationCapacity: regulationCapacity[level],
      suggestion: level === 'low' ? 
        '练习时间扩展：想象 1 天/1 周/1 年后如何看待此刻的情绪' :
        '继续深化时间视角，将其作为情绪调节的资源'
    };
  }

  _identifyTemporalEmotionPattern(emotionalData, temporalData) {
    // 识别常见的时间 - 情绪模式
    const patterns = [];
    
    if (emotionalData.emotionValence === 'negative' && temporalData.depthScore < 0.3) {
      patterns.push({
        pattern: '情绪时间收缩',
        description: '消极情绪 + 狭窄时间视野 = 情绪显得永恒且无法逃避',
        intervention: '时间扩展技术：主动回忆过去类似情绪的消退，想象未来的缓解'
      });
    }
    
    if (emotionalData.primaryEmotion === '焦虑' && temporalData.temporalModel?.bestMatchModel === 'cinematic') {
      patterns.push({
        pattern: '碎片化焦虑',
        description: '快照式时间体验 + 焦虑 = 对每个"瞬间"的威胁过度警觉',
        intervention: '连续性重建：注意呼吸的连续流动，感受时间的延展性'
      });
    }
    
    return {
      identifiedPatterns: patterns,
      generalObservation: '时间意识和情绪相互塑造——觉察这一交互是调节的关键'
    };
  }

  _generateTemporalEmotionalIntervention(emotionEffect, regulationEffect) {
    return {
      integratedApproach: '时间 - 情绪整合干预',
      steps: [
        '1. 情绪觉察：识别当前情绪及其强度',
        '2. 时间觉察：注意此刻的时间体验 (快/慢/停滞/流动)',
        '3. 交互觉察：注意情绪如何塑造时间感，时间感如何影响情绪',
        '4. 时间扩展：主动扩展时间视野 (回忆过去，想象未来)',
        '5. 重新评估：从扩展的时间视角重新看待当下情绪',
        '6. 整合：将此刻情绪放入更大的时间叙事中'
      ],
      theoreticalBasis: '整合 SEP 时间意识理论与情绪调节研究'
    };
  }

  _getSpecificEmotionTimeEffect(emotion) {
    const effects = {
      '焦虑': '焦虑加速主观时间流逝感，同时使当下显得延长 (矛盾效应)',
      '抑郁': '抑郁使时间显得停滞、缓慢，未来显得遥远且不可及',
      '愤怒': '愤怒收缩时间视野到当下威胁，忽略过去和未来',
      '悲伤': '悲伤延长对过去的反刍，未来显得黯淡',
      '快乐': '快乐加速时间流逝 ("时光飞逝")，但丰富记忆编码',
      '恐惧': '恐惧使时间显得极慢 (威胁监测增强)，视野收缩到威胁源'
    };
    
    return effects[emotion] || '情绪对时间体验的影响因人而异';
  }
}

module.exports = TemporalSelfIntegration;
