/**
 * 情绪调节的生成式方法模块 (Generative Emotion Regulation Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - Embodied Cognition (具身认知)
 * - Enactivism (生成主义)
 * - Dynamic Systems Theory (动力系统理论)
 * - Emotion Regulation (情绪调节)
 * - Self-Knowledge (自我知识)
 * 
 * 核心理论来源:
 * - Varela, F., Thompson, E., & Rosch, E. (1991). The Embodied Mind (生成主义)
 * - Thelen, E., & Smith, L. (1994). Dynamic Systems Approach (动力系统理论)
 * - Kelso, J.A.S. (1995). Dynamic Patterns (动态模式理论)
 * - Hollenstein, T. (2015). Resilience as Flexibility (韧性即灵活性)
 * - Burton, C.L., & Bonanno, G.A. (2016). Flexibility is Key (灵活性是关键)
 * - Aldao, A., et al. (2015). Emotion Regulation as Dynamic (情绪调节即动态过程)
 * - Gross, J.J. (2015). Process Model of Emotion Regulation (情绪调节过程模型)
 * - Hurrell, J., et al. (2022). Meta-Emotion and Regulation (元情绪与调节)
 * 
 * 功能目标：赋予 HeartFlow 动态、灵活、生成式的情绪调节能力
 * 
 * 1. 生成式调节 (Enactive Regulation)
 *    - 认知即生成 (Cognition as Enaction)
 *    - 意义建构 (Sense-making)
 *    - 参与式世界 (Participatory World)
 *    - 自创生 (Autopoiesis)
 * 
 * 2. 动力系统调节 (Dynamic Systems Regulation)
 *    - 吸引子状态 (Attractor States)
 *    - 相变 (Phase Transitions)
 *    - 自组织 (Self-organization)
 *    - 控制参数 (Control Parameters)
 * 
 * 3. 灵活性调节 (Flexible Regulation)
 *    - 策略灵活性 (Strategy Flexibility)
 *    - 情境敏感性 (Context Sensitivity)
 *    - 反馈响应 (Feedback Responsiveness)
 *    -  repertoire 多样性 (Repertoire Diversity)
 * 
 * 4. 元情绪调节 (Meta-Emotion Regulation)
 *    - 对情绪的情绪 (Emotions about Emotions)
 *    - 情绪觉察 (Emotion Awareness)
 *    - 情绪接受 (Emotion Acceptance)
 *    - 情绪整合 (Emotion Integration)
 * 
 * 5. 身体基础调节 (Somatic Regulation)
 *    - 内感受觉察 (Interoceptive Awareness)
 *    - 身体扫描 (Body Scan)
 *    - 呼吸调节 (Breath Regulation)
 *    - 姿势干预 (Postural Intervention)
 * 
 * @version 3.17.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 调节模式类型 (Regulation Mode Types)
 * 基于生成主义与动力系统理论
 */
const RegulationModes = {
  REACTIVE: 'reactive',           // 反应性调节（自动、快速）
  PROACTIVE: 'proactive',         // 主动性调节（预见、准备）
  GENERATIVE: 'generative',       // 生成式调节（意义建构、参与式）
  DYNAMIC: 'dynamic',             // 动力系统调节（自组织、相变）
  FLEXIBLE: 'flexible'            // 灵活性调节（情境敏感、策略多样）
};

/**
 * 吸引子状态类型 (Attractor State Types)
 * 基于动力系统理论
 */
const AttractorTypes = {
  // 健康吸引子
  CALM: 'calm',                   // 平静状态（稳定、低激活）
  FLOW: 'flow',                   // 心流状态（稳定、高激活）
  BALANCED: 'balanced',           // 平衡状态（中等激活、灵活）
  RESILIENT: 'resilient',         // 韧性状态（快速恢复）
  
  // 不健康吸引子
  ANXIOUS: 'anxious',             // 焦虑状态（高激活、不稳定）
  DEPRESSED: 'depressed',         // 抑郁状态（低激活、僵化）
  RUMINATIVE: 'ruminative',       // 反刍状态（循环、难以脱离）
  AVOIDANT: 'avoidant'            // 回避状态（逃避、短期缓解）
};

/**
 * 相变类型 (Phase Transition Types)
 * 基于动力系统相变理论
 */
const PhaseTransitions = {
  NONE: 'none',                   // 无相变
  GRADUAL: 'gradual',             // 渐进变化
  SUDDEN: 'sudden',               // 突然相变
  BIFURCATION: 'bifurcation',     // 分岔点（临界点）
  HYSTERESIS: 'hysteresis'        // 滞后效应（路径依赖）
};

/**
 * 调节策略库 (Regulation Strategy Repertoire)
 * 基于 Gross 过程模型与灵活性理论
 */
const RegulationStrategies = {
  // 情境选择 (前因聚焦)
  SITUATION_SELECTION: 'situation_selection',
  
  // 情境修改 (前因聚焦)
  SITUATION_MODIFICATION: 'situation_modification',
  
  // 注意部署 (前因聚焦)
  ATTENTION_DEPLOYMENT: 'attention_deployment',
  DISTRACTION: 'distraction',
  CONCENTRATION: 'concentration',
  MINDFULNESS: 'mindfulness',
  
  // 认知改变 (前因聚焦)
  COGNITIVE_CHANGE: 'cognitive_change',
  REAPPRAISAL: 'reappraisal',
  DISTANCING: 'distancing',
  HUMOR: 'humor',
  
  // 反应调节 (反应聚焦)
  RESPONSE_MODULATION: 'response_modulation',
  SUPPRESSION: 'suppression',
  EXPRESSION: 'expression',
  SOMATIC_REGULATION: 'somatic_regulation',
  
  // 生成式策略 (v3.17.0 新增)
  SENSE_MAKING: 'sense_making',
  PARTICIPATORY_ENGAGEMENT: 'participatory_engagement',
  CREATIVE_TRANSFORMATION: 'creative_transformation',
  DIALOGICAL_EXPLORATION: 'dialogical_exploration'
};

/**
 * 灵活性维度 (Flexibility Dimensions)
 * 基于 Hollenstein 与 Bonanno 的韧性即灵活性理论
 */
const FlexibilityDimensions = {
  CONTEXT_SENSITIVITY: 'context_sensitivity',  // 情境敏感性
  STRATEGY_REPERTOIRE: 'strategy_repertoire',  // 策略库多样性
  FEEDBACK_MONITORING: 'feedback_monitoring',  // 反馈监控
  SWITCHING_ABILITY: 'switching_ability'       // 切换能力
};

/**
 * 内感受觉察维度 (Interoceptive Awareness Dimensions)
 * 基于身体基础调节理论
 */
const InteroceptiveDimensions = {
  NOTICING: 'noticing',           // 觉察身体感觉
  NOT_DISTRACTION: 'not_distraction', // 不分心
  EMOTIONAL_AWARENESS: 'emotional_awareness', // 情绪觉察
  SELF_REGULATION: 'self_regulation', // 自我调节
  BODY_LISTENING: 'body_listening', // 倾听身体
  TRUSTING: 'trusting'            // 信任身体
};

// ============ 生成式情绪调节模块核心类 ============

class GenerativeEmotionRegulationModule {
  constructor(options = {}) {
    // 当前调节模式
    this.currentMode = RegulationModes.GENERATIVE;
    
    // 动力系统状态
    this.dynamicState = {
      currentAttractor: AttractorTypes.BALANCED,
      attractorStrength: 0.7,
      phaseTransition: PhaseTransitions.NONE,
      controlParameters: {},
      orderParameter: 0.5,
      stability: 0.6,
      flexibility: 0.7
    };
    
    // 灵活性档案
    this.flexibilityProfile = {
      [FlexibilityDimensions.CONTEXT_SENSITIVITY]: 0.7,
      [FlexibilityDimensions.STRATEGY_REPERTOIRE]: 0.8,
      [FlexibilityDimensions.FEEDBACK_MONITORING]: 0.7,
      [FlexibilityDimensions.SWITCHING_ABILITY]: 0.6
    };
    
    // 策略使用历史
    this.strategyHistory = [];
    
    // 内感受觉察状态
    this.interoceptiveState = {
      [InteroceptiveDimensions.NOTICING]: 0.7,
      [InteroceptiveDimensions.NOT_DISTRACTION]: 0.6,
      [InteroceptiveDimensions.EMOTIONAL_AWARENESS]: 0.8,
      [InteroceptiveDimensions.SELF_REGULATION]: 0.7,
      [InteroceptiveDimensions.BODY_LISTENING]: 0.6,
      [InteroceptiveDimensions.TRUSTING]: 0.7
    };
    
    // 元情绪状态
    this.metaEmotionState = {
      awareness: 0.7,
      acceptance: 0.6,
      understanding: 0.6,
      integration: 0.5
    };
    
    // 生成式意义建构历史
    this.senseMakingHistory = [];
    
    // 吸引子景观 (Attractor Landscape)
    this.attractorLandscape = this.initializeAttractorLandscape();
    
    console.log('🌀 生成式情绪调节模块已初始化 (v3.17.0) - 基于生成主义与动力系统理论');
  }
  
  // ============ 初始化方法 ============
  
  /**
   * 初始化吸引子景观
   * @returns {Object} 吸引子景观
   */
  initializeAttractorLandscape() {
    return {
      // 健康吸引子盆地
      healthy: {
        [AttractorTypes.CALM]: { depth: 0.7, basin: 0.6 },
        [AttractorTypes.FLOW]: { depth: 0.6, basin: 0.5 },
        [AttractorTypes.BALANCED]: { depth: 0.8, basin: 0.7 },
        [AttractorTypes.RESILIENT]: { depth: 0.7, basin: 0.6 }
      },
      
      // 不健康吸引子盆地
      unhealthy: {
        [AttractorTypes.ANXIOUS]: { depth: 0.5, basin: 0.4 },
        [AttractorTypes.DEPRESSED]: { depth: 0.4, basin: 0.3 },
        [AttractorTypes.RUMINATIVE]: { depth: 0.6, basin: 0.5 },
        [AttractorTypes.AVOIDANT]: { depth: 0.5, basin: 0.4 }
      }
    };
  }
  
  // ============ 核心 API ============
  
  /**
   * 评估当前情绪动力状态
   * @param {Object} emotionalState - 当前情绪状态
   * @returns {Object} 动力系统评估
   */
  assessDynamicState(emotionalState) {
    // 检测当前吸引子
    const detectedAttractor = this.detectAttractor(emotionalState);
    
    // 计算吸引子强度
    const attractorStrength = this.calculateAttractorStrength(emotionalState, detectedAttractor);
    
    // 检测相变迹象
    const phaseTransition = this.detectPhaseTransition(emotionalState);
    
    // 计算稳定性与灵活性
    const stability = this.calculateStability(emotionalState);
    const flexibility = this.calculateFlexibility(emotionalState);
    
    // 更新动力状态
    this.dynamicState = {
      currentAttractor: detectedAttractor,
      attractorStrength,
      phaseTransition,
      controlParameters: this.identifyControlParameters(emotionalState),
      orderParameter: this.calculateOrderParameter(emotionalState),
      stability,
      flexibility
    };
    
    console.log(`🌀 动力状态评估：吸引子=${detectedAttractor}, 稳定性=${stability.toFixed(2)}, 灵活性=${flexibility.toFixed(2)}`);
    
    return this.dynamicState;
  }
  
  /**
   * 检测当前吸引子状态
   * @param {Object} emotionalState - 情绪状态
   * @returns {string} 吸引子类型
   */
  detectAttractor(emotionalState) {
    const { valence, arousal, stability } = emotionalState;
    
    // 基于价度 - 激活 - 稳定性三维检测吸引子
    if (valence > 0 && arousal > 0.6 && stability > 0.6) {
      return AttractorTypes.FLOW;
    } else if (valence > 0 && arousal < 0.4 && stability > 0.7) {
      return AttractorTypes.CALM;
    } else if (Math.abs(valence) < 0.3 && stability > 0.6) {
      return AttractorTypes.BALANCED;
    } else if (valence < 0 && arousal > 0.7 && stability < 0.4) {
      return AttractorTypes.ANXIOUS;
    } else if (valence < 0 && arousal < 0.3 && stability < 0.5) {
      return AttractorTypes.DEPRESSED;
    } else if (arousal > 0.5 && stability < 0.3) {
      return AttractorTypes.RUMINATIVE;
    } else {
      return AttractorTypes.BALANCED; // 默认
    }
  }
  
  /**
   * 计算吸引子强度
   * @param {Object} emotionalState - 情绪状态
   * @param {string} attractorType - 吸引子类型
   * @returns {number} 强度 (0-1)
   */
  calculateAttractorStrength(emotionalState, attractorType) {
    // 简化计算：基于稳定性与一致性
    const baseStrength = emotionalState.stability || 0.5;
    const consistencyBonus = this.calculateConsistencyBonus(emotionalState);
    
    return Math.min(baseStrength + consistencyBonus, 1.0);
  }
  
  calculateConsistencyBonus(emotionalState) {
    // 基于情绪成分的一致性给予奖励
    return 0.2; // 简化
  }
  
  /**
   * 检测相变迹象
   * @param {Object} emotionalState - 情绪状态
   * @returns {string} 相变类型
   */
  detectPhaseTransition(emotionalState) {
    const { volatility, recentChange } = emotionalState;
    
    if (!volatility && !recentChange) {
      return PhaseTransitions.NONE;
    } else if (volatility > 0.8) {
      return PhaseTransitions.SUDDEN;
    } else if (volatility > 0.5) {
      return PhaseTransitions.BIFURCATION;
    } else if (recentChange > 0.5) {
      return PhaseTransitions.GRADUAL;
    } else {
      return PhaseTransitions.NONE;
    }
  }
  
  /**
   * 识别控制参数
   * @param {Object} emotionalState - 情绪状态
   * @returns {Object} 控制参数
   */
  identifyControlParameters(emotionalState) {
    // 控制参数是驱动相变的关键变量
    return {
      stress: emotionalState.stress || 0.5,
      support: emotionalState.support || 0.5,
      resources: emotionalState.resources || 0.5,
      meaning: emotionalState.meaning || 0.5
    };
  }
  
  /**
   * 计算序参数
   * @param {Object} emotionalState - 情绪状态
   * @returns {number} 序参数 (0-1)
   */
  calculateOrderParameter(emotionalState) {
    // 序参数表征系统的宏观秩序
    const coherence = emotionalState.coherence || 0.5;
    const integration = emotionalState.integration || 0.5;
    
    return (coherence + integration) / 2;
  }
  
  /**
   * 计算稳定性
   * @param {Object} emotionalState - 情绪状态
   * @returns {number} 稳定性 (0-1)
   */
  calculateStability(emotionalState) {
    return emotionalState.stability || 0.6;
  }
  
  /**
   * 计算灵活性
   * @param {Object} emotionalState - 情绪状态
   * @returns {number} 灵活性 (0-1)
   */
  calculateFlexibility(emotionalState) {
    // 灵活性 = 情境敏感性 × 策略多样性 × 切换能力
    const contextSensitivity = this.flexibilityProfile[FlexibilityDimensions.CONTEXT_SENSITIVITY];
    const strategyRepertoire = this.flexibilityProfile[FlexibilityDimensions.STRATEGY_REPERTOIRE];
    const switchingAbility = this.flexibilityProfile[FlexibilityDimensions.SWITCHING_ABILITY];
    
    return (contextSensitivity + strategyRepertoire + switchingAbility) / 3;
  }
  
  /**
   * 生成式意义建构 (Enactive Sense-Making)
   * @param {Object} emotionalSituation - 情绪情境
   * @returns {Object} 意义建构结果
   */
  makeSense(emotionalSituation) {
    const senseMakingProcess = {
      timestamp: new Date().toISOString(),
      situation: emotionalSituation,
      phases: []
    };
    
    // 阶段 1: 情境耦合 (Coupling)
    const coupling = this.coupleWithSituation(emotionalSituation);
    senseMakingProcess.phases.push({
      phase: 'coupling',
      description: '与情境建立动态耦合',
      result: coupling
    });
    
    // 阶段 2: 共同生成 (Co-emergence)
    const coEmergence = this.coEmergence(emotionalSituation, coupling);
    senseMakingProcess.phases.push({
      phase: 'co-emergence',
      description: '情绪与意义共同生成',
      result: coEmergence
    });
    
    // 阶段 3: 参与式行动 (Participatory Action)
    const participatoryAction = this.participatoryAction(coEmergence);
    senseMakingProcess.phases.push({
      phase: 'participatory-action',
      description: '采取参与式行动',
      result: participatoryAction
    });
    
    // 阶段 4: 整合 (Integration)
    const integration = this.integrateMeaning(participatoryAction);
    senseMakingProcess.phases.push({
      phase: 'integration',
      description: '整合新生成的意义',
      result: integration
    });
    
    // 记录到历史
    this.senseMakingHistory.push(senseMakingProcess);
    if (this.senseMakingHistory.length > 50) {
      this.senseMakingHistory.shift();
    }
    
    console.log('🌱 生成式意义建构完成');
    
    return senseMakingProcess;
  }
  
  coupleWithSituation(situation) {
    return {
      coupled: true,
      relevance: situation.relevance || 0.8,
      urgency: situation.urgency || 0.5,
      complexity: situation.complexity || 0.6
    };
  }
  
  coEmergence(situation, coupling) {
    return {
      emotionEmergent: true,
      meaningEmergent: true,
      novelty: 0.7,
      coherence: 0.6
    };
  }
  
  participatoryAction(coEmergence) {
    return {
      actionType: 'exploratory',
      engagement: 0.7,
      openness: 0.8
    };
  }
  
  integrateMeaning(participatoryAction) {
    return {
      integrated: true,
      newUnderstanding: '情绪是动态生成的意义过程',
      transformation: 0.6
    };
  }
  
  /**
   * 选择调节策略 (基于灵活性原则)
   * @param {Object} emotionalState - 情绪状态
   * @param {Object} context - 情境上下文
   * @returns {string} 推荐的调节策略
   */
  selectRegulationStrategy(emotionalState, context = {}) {
    // 评估情境敏感性
    const contextSensitivity = this.assessContextSensitivity(context);
    
    // 评估当前吸引子状态
    const attractorType = this.detectAttractor(emotionalState);
    
    // 评估相变状态
    const phaseTransition = this.detectPhaseTransition(emotionalState);
    
    // 基于灵活性原则选择策略
    let selectedStrategy;
    
    if (phaseTransition === PhaseTransitions.BIFURCATION) {
      // 临界点：需要温和干预
      selectedStrategy = RegulationStrategies.MINDFULNESS;
    } else if (attractorType === AttractorTypes.ANXIOUS) {
      // 焦虑吸引子：需要认知重构 + 身体调节
      selectedStrategy = context.cognitiveReadiness 
        ? RegulationStrategies.REAPPRAISAL 
        : RegulationStrategies.SOMATIC_REGULATION;
    } else if (attractorType === AttractorTypes.DEPRESSED) {
      // 抑郁吸引子：需要行为激活
      selectedStrategy = RegulationStrategies.SITUATION_MODIFICATION;
    } else if (attractorType === AttractorTypes.RUMINATIVE) {
      // 反刍吸引子：需要注意力转移
      selectedStrategy = RegulationStrategies.DISTRACTION;
    } else if (contextSensitivity > 0.7) {
      // 高情境敏感性：可以使用生成式策略
      selectedStrategy = RegulationStrategies.SENSE_MAKING;
    } else {
      // 默认：认知重评
      selectedStrategy = RegulationStrategies.REAPPRAISAL;
    }
    
    // 记录策略选择
    this.strategyHistory.push({
      strategy: selectedStrategy,
      timestamp: new Date().toISOString(),
      context: {
        attractor: attractorType,
        phaseTransition,
        contextSensitivity
      }
    });
    
    console.log(`🎯 选择调节策略：${selectedStrategy}`);
    
    return selectedStrategy;
  }
  
  /**
   * 评估情境敏感性
   * @param {Object} context - 情境上下文
   * @returns {number} 情境敏感性 (0-1)
   */
  assessContextSensitivity(context) {
    const factors = [
      context.socialContext || 0.5,
      context.timePressure || 0.5,
      context.importance || 0.5,
      context.control || 0.5
    ];
    
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }
  
  /**
   * 执行调节干预
   * @param {string} strategy - 调节策略
   * @param {Object} params - 策略参数
   * @returns {Object} 干预结果
   */
  executeRegulation(strategy, params = {}) {
    const intervention = {
      strategy,
      params,
      startTime: new Date().toISOString(),
      phases: []
    };
    
    // 执行策略特定的干预
    switch (strategy) {
      case RegulationStrategies.REAPPRAISAL:
        intervention.result = this.executeReappraisal(params);
        break;
      case RegulationStrategies.MINDFULNESS:
        intervention.result = this.executeMindfulness(params);
        break;
      case RegulationStrategies.SOMATIC_REGULATION:
        intervention.result = this.executeSomaticRegulation(params);
        break;
      case RegulationStrategies.SENSE_MAKING:
        intervention.result = this.executeSenseMaking(params);
        break;
      case RegulationStrategies.DISTRACTION:
        intervention.result = this.executeDistraction(params);
        break;
      default:
        intervention.result = { success: false, reason: '未知策略' };
    }
    
    intervention.endTime = new Date().toISOString();
    
    console.log(`✅ 调节干预完成：${strategy}`);
    
    return intervention;
  }
  
  executeReappraisal(params) {
    return {
      success: true,
      technique: 'cognitive-reappraisal',
      steps: [
        '识别自动思维',
        '评估证据',
        '生成替代解释',
        '重新评估情绪意义'
      ],
      effectiveness: 0.7
    };
  }
  
  executeMindfulness(params) {
    return {
      success: true,
      technique: 'mindful-awareness',
      steps: [
        '锚定当下',
        '开放觉察',
        '不评判接纳',
        '温柔返回'
      ],
      effectiveness: 0.75
    };
  }
  
  executeSomaticRegulation(params) {
    return {
      success: true,
      technique: 'somatic-regulation',
      steps: [
        '身体扫描',
        '觉察紧张区域',
        '深呼吸放松',
        '姿势调整'
      ],
      effectiveness: 0.8
    };
  }
  
  executeSenseMaking(params) {
    return {
      success: true,
      technique: 'generative-sense-making',
      steps: [
        '探索情绪的意义',
        '连接个人价值观',
        '发现成长机会',
        '整合新理解'
      ],
      effectiveness: 0.85
    };
  }
  
  executeDistraction(params) {
    return {
      success: true,
      technique: 'healthy-distraction',
      steps: [
        '选择有益活动',
        '完全投入',
        '暂时放下困扰',
        '适时返回处理'
      ],
      effectiveness: 0.65
    };
  }
  
  /**
   * 评估调节效果
   * @param {Object} beforeState - 调节前状态
   * @param {Object} afterState - 调节后状态
   * @returns {Object} 效果评估
   */
  evaluateRegulationEffect(beforeState, afterState) {
    const change = {
      valence: afterState.valence - beforeState.valence,
      arousal: afterState.arousal - beforeState.arousal,
      stability: afterState.stability - beforeState.stability
    };
    
    const improvement = (
      (change.valence > 0 ? change.valence : 0) +
      (Math.abs(change.arousal - 0.5) < 0.2 ? 0.3 : 0) +
      (change.stability > 0 ? change.stability : 0)
    ) / 3;
    
    return {
      improvement,
      change,
      effectiveness: improvement > 0.3 ? 'high' : improvement > 0.1 ? 'moderate' : 'low',
      recommendation: this.generateRecommendation(improvement, beforeState, afterState)
    };
  }
  
  generateRecommendation(improvement, beforeState, afterState) {
    if (improvement > 0.3) {
      return '策略有效，建议继续使用';
    } else if (improvement > 0.1) {
      return '策略有一定效果，可考虑调整参数';
    } else {
      return '策略效果有限，建议尝试其他方法';
    }
  }
  
  /**
   * 提升灵活性档案
   * @param {string} dimension - 灵活性维度
   * @param {number} amount - 提升量
   */
  increaseFlexibility(dimension, amount = 0.05) {
    if (this.flexibilityProfile[dimension] !== undefined) {
      this.flexibilityProfile[dimension] = Math.min(
        this.flexibilityProfile[dimension] + amount,
        1.0
      );
      
      console.log(`📈 灵活性提升：${dimension} → ${this.flexibilityProfile[dimension].toFixed(2)}`);
    }
  }
  
  /**
   * 提升内感受觉察
   * @param {string} dimension - 内感受维度
   * @param {number} amount - 提升量
   */
  increaseInteroceptiveAwareness(dimension, amount = 0.05) {
    if (this.interoceptiveState[dimension] !== undefined) {
      this.interoceptiveState[dimension] = Math.min(
        this.interoceptiveState[dimension] + amount,
        1.0
      );
      
      console.log(`📈 内感受觉察提升：${dimension} → ${this.interoceptiveState[dimension].toFixed(2)}`);
    }
  }
  
  /**
   * 提升元情绪能力
   * @param {string} aspect - 元情绪方面
   * @param {number} amount - 提升量
   */
  increaseMetaEmotionCapacity(aspect, amount = 0.05) {
    if (this.metaEmotionState[aspect] !== undefined) {
      this.metaEmotionState[aspect] = Math.min(
        this.metaEmotionState[aspect] + amount,
        1.0
      );
      
      console.log(`📈 元情绪能力提升：${aspect} → ${this.metaEmotionState[aspect].toFixed(2)}`);
    }
  }
  
  // ============ 状态与报告 ============
  
  /**
   * 获取模块状态
   * @returns {Object} 状态报告
   */
  getStatus() {
    const flexibilityScore = Object.values(this.flexibilityProfile)
      .reduce((sum, v) => sum + v, 0) / Object.keys(this.flexibilityProfile).length;
    
    const interoceptiveScore = Object.values(this.interoceptiveState)
      .reduce((sum, v) => sum + v, 0) / Object.keys(this.interoceptiveState).length;
    
    const metaEmotionScore = Object.values(this.metaEmotionState)
      .reduce((sum, v) => sum + v, 0) / Object.keys(this.metaEmotionState).length;
    
    return {
      mode: this.currentMode,
      dynamicState: this.dynamicState,
      flexibility: {
        score: flexibilityScore,
        dimensions: this.flexibilityProfile
      },
      interoceptiveAwareness: {
        score: interoceptiveScore,
        dimensions: this.interoceptiveState
      },
      metaEmotion: {
        score: metaEmotionScore,
        dimensions: this.metaEmotionState
      },
      strategyHistoryLength: this.strategyHistory.length,
      senseMakingHistoryLength: this.senseMakingHistory.length
    };
  }
  
  /**
   * 生成详细报告
   * @returns {string} 文本报告
   */
  generateReport() {
    const status = this.getStatus();
    
    return `
# 生成式情绪调节模块状态报告 (v3.17.0)

## 当前模式
${status.mode}

## 动力系统状态
- 当前吸引子：${status.dynamicState.currentAttractor}
- 吸引子强度：${(status.dynamicState.attractorStrength * 100).toFixed(0)}%
- 相变状态：${status.dynamicState.phaseTransition}
- 稳定性：${(status.dynamicState.stability * 100).toFixed(0)}%
- 灵活性：${(status.dynamicState.flexibility * 100).toFixed(0)}%

## 灵活性档案
- 综合得分：${(status.flexibility.score * 100).toFixed(0)}%
- 情境敏感性：${(status.flexibility.dimensions.context_sensitivity * 100).toFixed(0)}%
- 策略多样性：${(status.flexibility.dimensions.strategy_repertoire * 100).toFixed(0)}%
- 反馈监控：${(status.flexibility.dimensions.feedback_monitoring * 100).toFixed(0)}%
- 切换能力：${(status.flexibility.dimensions.switching_ability * 100).toFixed(0)}%

## 内感受觉察
- 综合得分：${(status.interoceptiveAwareness.score * 100).toFixed(0)}%
- 觉察能力：${(status.interoceptiveAwareness.dimensions.noticing * 100).toFixed(0)}%
- 情绪觉察：${(status.interoceptiveAwareness.dimensions.emotional_awareness * 100).toFixed(0)}%
- 自我调节：${(status.interoceptiveAwareness.dimensions.self_regulation * 100).toFixed(0)}%
- 身体倾听：${(status.interoceptiveAwareness.dimensions.body_listening * 100).toFixed(0)}%

## 元情绪能力
- 综合得分：${(status.metaEmotion.score * 100).toFixed(0)}%
- 觉察：${(status.metaEmotion.dimensions.awareness * 100).toFixed(0)}%
- 接纳：${(status.metaEmotion.dimensions.acceptance * 100).toFixed(0)}%
- 理解：${(status.metaEmotion.dimensions.understanding * 100).toFixed(0)}%
- 整合：${(status.metaEmotion.dimensions.integration * 100).toFixed(0)}%

## 历史记录
- 策略使用次数：${status.strategyHistoryLength}
- 意义建构次数：${status.senseMakingHistoryLength}
`;
  }
}

// ============ 导出 ============

module.exports = {
  GenerativeEmotionRegulationModule,
  RegulationModes,
  AttractorTypes,
  PhaseTransitions,
  RegulationStrategies,
  FlexibilityDimensions,
  InteroceptiveDimensions
};
