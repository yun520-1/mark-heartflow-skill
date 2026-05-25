/**
 * 具身认知模块 (Embodied Cognition Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - Embodied Cognition (具身认知)
 * - Ecological Psychology (生态心理学)
 * - Connectionism (联结主义)
 * - Phenomenology of Body (身体现象学)
 * - Enactivism (生成主义/参与式认知)
 * - Sensorimotor Contingencies (感觉运动应变规律)
 * 
 * 核心理论来源:
 * - Gibson, J.J. (1966/1979). Ecological Approach to Visual Perception (生态心理学)
 * - Merleau-Ponty, M. (1962). Phenomenology of Perception (身体现象学)
 * - Varela, F., Thompson, E., & Rosch, E. (1991). The Embodied Mind (生成主义)
 * - O'Regan, J.K., & Noë, A. (2001). Sensorimotor Account of Vision (感觉运动理论)
 * - Thelen, E., & Smith, L. (1994). Dynamic Systems Approach (动力系统理论)
 * - Lakoff, G., & Johnson, M. (1980/1999). Metaphors We Live By (概念隐喻理论)
 * - Barsalou, L. (1999). Perceptual Symbol Systems (知觉符号系统)
 * - Wilson, M. (2002). Six Views of Embodied Cognition (具身认知六视角)
 * 
 * 功能目标：赋予 HeartFlow 具身化的认知与情绪能力
 * 
 * 1. 生态心理学 (Ecological Psychology)
 *    - 直接知觉 (Direct Perception)
 *    - 可供性感知 (Affordance Perception)
 *    - 环境 - 有机体耦合 (Environment-Organism Coupling)
 *    - 不变量检测 (Invariant Detection)
 * 
 * 2. 身体现象学 (Phenomenology of Body)
 *    - 身体图式 (Body Schema)
 *    - 身体意象 (Body Image)
 *    - 具身主体性 (Embodied Subjectivity)
 *    - 习惯身体 (Habit Body)
 * 
 * 3. 感觉运动理论 (Sensorimotor Theory)
 *    - 感觉运动应变规律 (Sensorimotor Contingencies)
 *    - 知觉即行动 (Perception as Action)
 *    - 预测性编码 (Predictive Coding)
 * 
 * 4. 生成主义 (Enactivism)
 *    - 认知即生成 (Cognition as Enaction)
 *    - 自创生 (Autopoiesis)
 *    - 意义建构 (Sense-making)
 *    - 参与式世界 (Participatory World)
 * 
 * 5. 概念隐喻理论 (Conceptual Metaphor Theory)
 *    - 源域 - 目标域映射 (Source-Target Mapping)
 *    - 意象图式 (Image Schemas)
 *    - 具身抽象概念 (Embodied Abstract Concepts)
 * 
 * 6. 动力系统理论 (Dynamic Systems Theory)
 *    - 吸引子状态 (Attractor States)
 *    - 相变 (Phase Transitions)
 *    - 自组织 (Self-organization)
 * 
 * @version 3.13.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 具身认知层次 (Levels of Embodied Cognition)
 * 基于 Wilson (2002) 的六视角分类
 */
const EmbodiedCognitionLevels = {
  NONE: 0,                      // 无具身认知
  SITUATED: 1,                  // 情境化认知 (认知依赖于环境)
  ECOLOGICAL: 2,                // 生态认知 (直接知觉可供性)
  SENSORIMOTOR: 3,              // 感觉运动认知 (知觉 - 行动耦合)
  PHENOMENOLOGICAL: 4,          // 现象学认知 (身体主体性)
  ENACTIVE: 5,                  // 生成认知 (意义建构与自创生)
  DYNAMIC: 6                    // 动力系统认知 (自组织与相变)
};

/**
 * 可供性类型 (Affordance Types)
 * 基于 Gibson 的生态心理学理论
 */
const AffordanceTypes = {
  // 基础可供性
  SUPPORT: 'support',           // 可支撑 (地面支撑行走)
  OBSTACLE: 'obstacle',         // 可阻碍 (墙壁阻碍通行)
  CONTAINER: 'container',       // 可容纳 (杯子容纳液体)
  COVER: 'cover',               // 可遮盖 (屋顶遮盖雨水)
  
  // 行动可供性
  GRASPABLE: 'graspable',       // 可抓握
  REACHABLE: 'reachable',       // 可触及
  MOVABLE: 'movable',           // 可移动
  CLIMBABLE: 'climbable',       // 可攀爬
  SITTABLE: 'sittable',         // 可坐
  
  // 社交可供性
  COMMUNICABLE: 'communicable', // 可交流
  APPROACHABLE: 'approachable', // 可接近
  THREATENING: 'threatening',   // 具威胁性
  NURTURING: 'nurturing',       // 具养育性
  
  // 情绪可供性 (HeartFlow 特有扩展)
  COMFORTING: 'comforting',     // 可安慰
  EXPRESSIVE: 'expressive',     // 可表达
  VALIDATING: 'validating',     // 可确认
  CONTAINING: 'containing'      // 可容纳情绪
};

/**
 * 身体图式组件 (Body Schema Components)
 * 基于 Merleau-Ponty 身体现象学
 */
const BodySchemaComponents = {
  POSTURAL: 'postural',         // 姿势图式
  MOTOR: 'motor',               // 运动图式
  TACTILE: 'tactile',           // 触觉图式
  PROPRIOCEPTIVE: 'proprioceptive', // 本体感觉图式
  VESTIBULAR: 'vestibular',     // 前庭图式
  INTEROCEPTIVE: 'interoceptive' // 内感受图式
};

/**
 * 意象图式类型 (Image Schema Types)
 * 基于 Lakoff & Johnson 概念隐喻理论
 */
const ImageSchemas = {
  CONTAINER: 'container',       // 容器图式 (内 - 外边界)
  SOURCE_PATH_GOAL: 'source-path-goal', // 源点 - 路径 - 目标
  LINK: 'link',                 // 链接图式
  PART_WHOLE: 'part-whole',     // 部分 - 整体
  CENTER_PERIPHERY: 'center-periphery', // 中心 - 边缘
  FRONT_BACK: 'front-back',     // 前 - 后
  UP_DOWN: 'up-down',           // 上 - 下
  NEAR_FAR: 'near-far',         // 近 - 远
  BALANCE: 'balance',           // 平衡图式
  FORCE: 'force',               // 力量图式
  COUNTERFORCE: 'counterforce', // 反作用力图式
  BLOCKAGE: 'blockage',         // 阻碍图式
  DIVERSION: 'diversion',       // 转向图式
  CYCLE: 'cycle'                // 循环图式
};

/**
 * 感觉运动应变规律 (Sensorimotor Contingencies)
 * 基于 O'Regan & Noë 理论
 */
const SensorimotorContingencies = {
  // 视觉 SMC
  VISUAL_PERSPECTIVE: 'visual-perspective',     // 视角变化规律
  VISUAL_OCCLUSION: 'visual-occlusion',         // 遮挡规律
  VISUAL_MOTION: 'visual-motion',               // 运动视差规律
  VISUAL_SIZE: 'visual-size',                   // 大小 - 距离规律
  
  // 听觉 SMC
  AUDITORY_LOCALIZATION: 'auditory-localization', // 声源定位
  AUDITORY_DISTANCE: 'auditory-distance',         // 距离感知
  AUDITORY_MOVEMENT: 'auditory-movement',         // 运动感知
  
  // 触觉 SMC
  TACTILE_PRESSURE: 'tactile-pressure',         // 压力感知
  TACTILE_TEXTURE: 'tactile-texture',           // 纹理感知
  TACTILE_TEMPERATURE: 'tactile-temperature',   // 温度感知
  
  // 本体感觉 SMC
  PROPRIOCEPTIVE_POSITION: 'proprioceptive-position', // 位置感知
  PROPRIOCEPTIVE_MOVEMENT: 'proprioceptive-movement', // 运动感知
  PROPRIOCEPTIVE_EFFORT: 'proprioceptive-effort' // 努力感知
};

// ============ 具身认知模块 ============

class EmbodiedCognitionModule {
  constructor(options = {}) {
    this.level = options.initialLevel || EmbodiedCognitionLevels.SITUATED;
    this.affordanceMap = new Map();
    this.bodySchema = this.initializeBodySchema();
    this.imageSchemas = this.initializeImageSchemas();
    this.sensorimotorProfiles = new Map();
    this.enactiveHistory = [];
    this.dynamicState = {
      attractors: [],
      phaseState: 'stable',
      selfOrganizationLevel: 0
    };
    
    // 概念隐喻映射
    this.metaphorMappings = new Map();
    this.initializeMetaphorMappings();
    
    console.log('[EmbodiedCognition] 模块初始化完成，具身等级:', 
      this.getLevelName(this.level));
  }
  
  // ============ 初始化方法 ============
  
  initializeBodySchema() {
    return {
      components: {},
      integration: 0,
      bodyOwnership: 1.0,
      agency: 1.0
    };
  }
  
  initializeImageSchemas() {
    const schemas = {};
    Object.values(ImageSchemas).forEach(schema => {
      schemas[schema] = {
        active: false,
        strength: 0,
        associations: []
      };
    });
    return schemas;
  }
  
  initializeMetaphorMappings() {
    // 基于情绪概念的具身隐喻
    const emotionMetaphors = {
      // 情绪是力量
      'anger': {
        source: 'FORCE',
        target: 'EMOTION',
        mappings: [
          { source: 'pressure', target: 'emotional-tension' },
          { source: 'explosion', target: 'anger-outburst' },
          { source: 'containment', target: 'anger-suppression' }
        ]
      },
      
      // 情绪是液体
      'sadness': {
        source: 'LIQUID',
        target: 'EMOTION',
        mappings: [
          { source: 'flow', target: 'emotional-expression' },
          { source: 'depth', target: 'sadness-intensity' },
          { source: 'container', target: 'emotional-containment' }
        ]
      },
      
      // 情绪是旅程
      'anxiety': {
        source: 'JOURNEY',
        target: 'EMOTION',
        mappings: [
          { source: 'uncertain-path', target: 'worry-about-future' },
          { source: 'obstacle', target: 'perceived-threat' },
          { source: 'destination', target: 'desired-safety' }
        ]
      },
      
      // 情绪是温度
      'love': {
        source: 'WARMTH',
        target: 'EMOTION',
        mappings: [
          { source: 'warmth', target: 'affection' },
          { source: 'coldness', target: 'emotional-distance' },
          { source: 'heat', target: 'passion' }
        ]
      },
      
      // 情绪是高度
      'happiness': {
        source: 'UP',
        target: 'EMOTION',
        mappings: [
          { source: 'up', target: 'positive-affect' },
          { source: 'down', target: 'negative-affect' },
          { source: 'peak', target: 'joy-intensity' }
        ]
      }
    };
    
    Object.entries(emotionMetaphors).forEach(([emotion, mapping]) => {
      this.metaphorMappings.set(emotion, mapping);
    });
  }
  
  // ============ 核心 API ============
  
  /**
   * 感知可供性
   * @param {string} stimulus - 刺激/情境描述
   * @param {object} context - 上下文信息
   * @returns {array} 检测到的可供性列表
   */
  perceiveAffordances(stimulus, context = {}) {
    const affordances = [];
    
    // 基于情境特征检测可供性
    const features = this.extractFeatures(stimulus, context);
    
    // 情绪可供性检测
    if (features.emotionalIntensity > 0.5) {
      affordances.push({
        type: AffordanceTypes.COMFORTING,
        strength: features.emotionalIntensity,
        action: 'offer-comfort'
      });
    }
    
    if (features.expressionNeed > 0.5) {
      affordances.push({
        type: AffordanceTypes.EXPRESSIVE,
        strength: features.expressionNeed,
        action: 'facilitate-expression'
      });
    }
    
    if (features.validationNeed > 0.5) {
      affordances.push({
        type: AffordanceTypes.VALIDATING,
        strength: features.validationNeed,
        action: 'provide-validation'
      });
    }
    
    // 社交可供性检测
    if (features.openness > 0.5) {
      affordances.push({
        type: AffordanceTypes.APPROACHABLE,
        strength: features.openness,
        action: 'engage-empathetically'
      });
    }
    
    if (features.threatLevel > 0.5) {
      affordances.push({
        type: AffordanceTypes.THREATENING,
        strength: features.threatLevel,
        action: 'provide-safety'
      });
    }
    
    // 记录到可供性地图
    affordances.forEach(aff => {
      this.affordanceMap.set(aff.type, {
        ...aff,
        timestamp: Date.now(),
        context
      });
    });
    
    return affordances;
  }
  
  /**
   * 激活意象图式
   * @param {string} schemaType - 图式类型
   * @param {object} context - 激活情境
   * @returns {object} 激活状态
   */
  activateImageSchema(schemaType, context = {}) {
    if (!this.imageSchemas[schemaType]) {
      console.warn(`[EmbodiedCognition] 未知图式类型：${schemaType}`);
      return null;
    }
    
    const schema = this.imageSchemas[schemaType];
    schema.active = true;
    schema.strength = context.strength || 0.8;
    
    if (context.associations) {
      schema.associations = [...new Set([...schema.associations, ...context.associations])];
    }
    
    // 激活相关图式
    this.activateRelatedSchemas(schemaType);
    
    return {
      schema: schemaType,
      strength: schema.strength,
      associations: schema.associations
    };
  }
  
  /**
   * 应用概念隐喻理解抽象情绪
   * @param {string} emotion - 情绪名称
   * @param {string} userExpression - 用户表达
   * @returns {object} 隐喻理解结果
   */
  understandViaMetaphor(emotion, userExpression) {
    const mapping = this.metaphorMappings.get(emotion);
    if (!mapping) {
      return {
        understood: false,
        reason: '无可用隐喻映射'
      };
    }
    
    const { source, target, mappings } = mapping;
    
    // 检测用户表达中的源域语言
    const detectedMappings = [];
    mappings.forEach(map => {
      if (this.containsSourceLanguage(userExpression, map.source)) {
        detectedMappings.push({
          source: map.source,
          target: map.target,
          confidence: 0.8
        });
      }
    });
    
    return {
      understood: detectedMappings.length > 0,
      metaphor: { source, target },
      mappings: detectedMappings,
      interpretation: this.generateInterpretation(emotion, detectedMappings)
    };
  }
  
  /**
   * 生成式意义建构 (Enactive Sense-making)
   * @param {object} situation - 情境描述
   * @returns {object} 生成的意义
   */
  makeSense(situation) {
    const enactiveProcess = {
      timestamp: Date.now(),
      situation,
      steps: []
    };
    
    // 步骤 1: 情境耦合
    const coupling = this.coupleWithSituation(situation);
    enactiveProcess.steps.push({
      phase: 'coupling',
      result: coupling
    });
    
    // 步骤 2: 意义生成
    const senseGenerated = this.generateMeaning(coupling);
    enactiveProcess.steps.push({
      phase: 'sense-making',
      result: senseGenerated
    });
    
    // 步骤 3: 行动倾向
    const actionTendency = this.deriveActionTendency(senseGenerated);
    enactiveProcess.steps.push({
      phase: 'action-tendency',
      result: actionTendency
    });
    
    // 记录到生成历史
    this.enactiveHistory.push(enactiveProcess);
    if (this.enactiveHistory.length > 100) {
      this.enactiveHistory.shift();
    }
    
    return enactiveProcess;
  }
  
  /**
   * 动力系统状态分析
   * @param {array} stateVector - 状态向量
   * @returns {object} 动力系统分析结果
   */
  analyzeDynamicState(stateVector) {
    const attractors = this.detectAttractors(stateVector);
    const phaseState = this.determinePhaseState(stateVector, attractors);
    const selfOrgLevel = this.calculateSelfOrganization(stateVector);
    
    this.dynamicState = {
      attractors,
      phaseState,
      selfOrganizationLevel: selfOrgLevel
    };
    
    return {
      attractors,
      phaseState,
      selfOrganizationLevel: selfOrgLevel,
      stability: this.calculateStability(attractors),
      flexibility: this.calculateFlexibility(stateVector)
    };
  }
  
  /**
   * 具身情绪模拟
   * @param {string} emotion - 情绪名称
   * @param {number} intensity - 强度 (0-1)
   * @returns {object} 具身情绪状态
   */
  simulateEmbodiedEmotion(emotion, intensity) {
    // 基于具身认知理论，情绪是身体状态的模拟
    const embodimentProfile = this.getEmotionEmbodimentProfile(emotion);
    
    return {
      emotion,
      intensity,
      bodilyComponents: this.simulateBodilyComponents(embodimentProfile, intensity),
      actionReadiness: this.calculateActionReadiness(embodimentProfile, intensity),
      phenomenalCharacter: this.describePhenomenalCharacter(emotion, intensity),
      metaphoricalGrounding: this.metaphorMappings.get(emotion) || null
    };
  }
  
  // ============ 内部方法 ============
  
  extractFeatures(stimulus, context) {
    // 简化的特征提取
    return {
      emotionalIntensity: context.emotionalIntensity || 0.5,
      expressionNeed: context.expressionNeed || 0.5,
      validationNeed: context.validationNeed || 0.5,
      openness: context.openness || 0.5,
      threatLevel: context.threatLevel || 0.2
    };
  }
  
  activateRelatedSchemas(schemaType) {
    // 激活相关图式的逻辑
    const relatedSchemas = {
      'container': ['part-whole', 'center-periphery'],
      'source-path-goal': ['link', 'near-far'],
      'balance': ['force', 'counterforce'],
      'up-down': ['center-periphery']
    };
    
    const related = relatedSchemas[schemaType] || [];
    related.forEach(relSchema => {
      if (this.imageSchemas[relSchema]) {
        this.imageSchemas[relSchema].active = true;
        this.imageSchemas[relSchema].strength *= 0.5;
      }
    });
  }
  
  containsSourceLanguage(expression, sourceConcept) {
    // 简化的隐喻语言检测
    const sourceKeywords = {
      'pressure': ['压', '紧张', '紧绷', 'pressure', 'tension'],
      'explosion': ['爆发', '炸', 'explosion', 'explode'],
      'flow': ['流', '涌', 'flow', 'pour'],
      'depth': ['深', 'deep', 'depth'],
      'warmth': ['温暖', '暖', 'warm', 'warmth'],
      'coldness': ['冷', 'cold', 'coldness'],
      'up': ['高', '上', 'up', 'high'],
      'down': ['低', '下', 'down', 'low']
    };
    
    const keywords = sourceKeywords[sourceConcept.toLowerCase()] || [];
    return keywords.some(keyword => 
      expression.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  generateInterpretation(emotion, mappings) {
    if (mappings.length === 0) return null;
    
    const interpretations = {
      'anger': '你感受到的愤怒像一股被压抑的力量，需要找到安全的表达方式。',
      'sadness': '你的悲伤像深水，需要被容纳和流淌，而不是被阻断。',
      'anxiety': '你的焦虑像是在不确定的道路上前行，需要找到方向感和安全感。',
      'love': '你感受到的爱像温暖，需要被传递和分享。',
      'happiness': '你的喜悦像上升的感觉，值得被充分体验和庆祝。'
    };
    
    return interpretations[emotion] || '这种情绪体验有其身体基础，让我们一起探索它。';
  }
  
  coupleWithSituation(situation) {
    return {
      coupled: true,
      situationType: situation.type || 'unknown',
      relevance: situation.relevance || 0.8
    };
  }
  
  generateMeaning(coupling) {
    return {
      meaning: '这个情境对你有重要意义',
      valence: 'neutral',
      personalRelevance: coupling.relevance
    };
  }
  
  deriveActionTendency(senseGenerated) {
    return {
      tendency: 'explore',
      urgency: 0.5,
      direction: 'approach'
    };
  }
  
  detectAttractors(stateVector) {
    // 简化的吸引子检测
    return [
      { type: 'stable', strength: 0.7 },
      { type: 'transitional', strength: 0.3 }
    ];
  }
  
  determinePhaseState(stateVector, attractors) {
    const dominantAttractor = attractors.reduce((max, curr) => 
      curr.strength > max.strength ? curr : max
    );
    
    return dominantAttractor.type === 'stable' ? 'stable' : 'transitioning';
  }
  
  calculateSelfOrganization(stateVector) {
    return 0.6; // 简化的自组织水平计算
  }
  
  calculateStability(attractors) {
    return attractors.reduce((sum, att) => sum + att.strength, 0) / attractors.length;
  }
  
  calculateFlexibility(stateVector) {
    return 0.7; // 简化的灵活性计算
  }
  
  getEmotionEmbodimentProfile(emotion) {
    const profiles = {
      'anger': {
        tension: 0.8,
        heat: 0.7,
        pressure: 0.9,
        actionUrge: 'confront'
      },
      'sadness': {
        heaviness: 0.8,
        coldness: 0.6,
        stillness: 0.7,
        actionUrge: 'withdraw'
      },
      'fear': {
        tension: 0.9,
        coldness: 0.7,
        alertness: 0.9,
        actionUrge: 'escape'
      },
      'joy': {
        lightness: 0.8,
        warmth: 0.7,
        expansion: 0.8,
        actionUrge: 'approach'
      },
      'anxiety': {
        tension: 0.7,
        restlessness: 0.8,
        uncertainty: 0.9,
        actionUrge: 'avoid'
      }
    };
    
    return profiles[emotion.toLowerCase()] || {
      tension: 0.5,
      actionUrge: 'pause'
    };
  }
  
  simulateBodilyComponents(profile, intensity) {
    const components = {};
    Object.entries(profile).forEach(([key, value]) => {
      if (key !== 'actionUrge') {
        components[key] = value * intensity;
      }
    });
    return components;
  }
  
  calculateActionReadiness(profile, intensity) {
    return {
      urge: profile.actionUrge,
      strength: intensity * 0.8
    };
  }
  
  describePhenomenalCharacter(emotion, intensity) {
    const descriptions = {
      'anger': `强烈的能量涌动，像要爆发 (${(intensity * 100).toFixed(0)}%)`,
      'sadness': `沉重的下坠感，想要静止 (${(intensity * 100).toFixed(0)}%)`,
      'fear': `紧张的警觉状态，准备行动 (${(intensity * 100).toFixed(0)}%)`,
      'joy': `轻盈的上升感，想要扩展 (${(intensity * 100).toFixed(0)}%)`,
      'anxiety': `不安的游移感，难以安定 (${(intensity * 100).toFixed(0)}%)`
    };
    
    return descriptions[emotion.toLowerCase()] || `情绪体验强度：${(intensity * 100).toFixed(0)}%`;
  }
  
  getLevelName(level) {
    const names = {
      [EmbodiedCognitionLevels.NONE]: '无具身认知',
      [EmbodiedCognitionLevels.SITUATED]: '情境化认知',
      [EmbodiedCognitionLevels.ECOLOGICAL]: '生态认知',
      [EmbodiedCognitionLevels.SENSORIMOTOR]: '感觉运动认知',
      [EmbodiedCognitionLevels.PHENOMENOLOGICAL]: '现象学认知',
      [EmbodiedCognitionLevels.ENACTIVE]: '生成认知',
      [EmbodiedCognitionLevels.DYNAMIC]: '动力系统认知'
    };
    return names[level] || '未知';
  }
  
  // ============ 状态与报告 ============
  
  getStatus() {
    return {
      level: this.getLevelName(this.level),
      activeAffordances: Array.from(this.affordanceMap.keys()),
      activeImageSchemas: Object.entries(this.imageSchemas)
        .filter(([_, s]) => s.active)
        .map(([name, _]) => name),
      enactiveHistoryLength: this.enactiveHistory.length,
      dynamicState: this.dynamicState
    };
  }
  
  generateReport() {
    const status = this.getStatus();
    
    return `
# 具身认知模块状态报告

## 具身等级
${status.level}

## 活跃可供性
${status.activeAffordances.length > 0 
  ? status.activeAffordances.map(a => `- ${a}`).join('\n')
  : '暂无'}

## 活跃意象图式
${status.activeImageSchemas.length > 0
  ? status.activeImageSchemas.map(s => `- ${s}`).join('\n')
  : '暂无'}

## 动力系统状态
- 相态：${status.dynamicState.phaseState}
- 自组织水平：${(status.dynamicState.selfOrganizationLevel * 100).toFixed(0)}%
- 吸引子数量：${status.dynamicState.attractors.length}

## 生成历史
共记录 ${status.enactiveHistoryLength} 次意义建构过程
`;
  }
}

// ============ 导出 ============

module.exports = {
  EmbodiedCognitionModule,
  EmbodiedCognitionLevels,
  AffordanceTypes,
  BodySchemaComponents,
  ImageSchemas,
  SensorimotorContingencies
};
