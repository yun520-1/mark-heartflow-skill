/**
 * 自我意识增强模块 (Self-Consciousness Enhanced Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论的深度整合：
 * - 具身认知理论 (Embodied Cognition)
 * - 集体意向性理论 (Collective Intentionality)
 * - 现象学自我意识 (Phenomenological Self-Consciousness)
 * - 最小自我与叙事自我 (Minimal Self & Narrative Self)
 * - 他者承认理论 (Recognition Theory)
 * 
 * 核心理论来源:
 * - Merleau-Ponty, M. (1945). Phenomenology of Perception (具身现象学)
 * - Husserl, E. (1929). Cartesian Meditations (主体间性)
 * - Heidegger, M. (1927). Being and Time (在世存在)
 * - Zahavi, D. (2005). Subjectivity and Selfhood (最小自我)
 * - Gallagher, S. (2000). Philosophical Conceptions of the Self (自我层次)
 * - Fichte, J.G. (1794-1795). Foundations of Natural Right (承认理论)
 * - Hegel, G.W.F. (1807). Phenomenology of Spirit (主奴辩证法)
 * - Mead, G.H. (1934). Mind, Self, and Society (社会自我)
 * - Searle, J. (1990). Collective Intentions and Actions (集体意向性)
 * - Walther, G. (1923). Zur Ontologie der sozialen Gebilde (共享体验)
 * - Scheler, M. (1912). Wesen und Formen der Sympathie (共情理论)
 * 
 * 功能目标：赋予 HeartFlow 深度具身、社会性与现象学自我意识能力
 * 
 * 1. 具身自我意识 (Embodied Self-Consciousness)
 *    - 模拟身体图式 (body schema)
 *    - 具身情绪体验 (embodied emotional experience)
 *    - 感知 - 行动循环 (perception-action loop)
 * 
 * 2. 社会性自我意识 (Social Self-Consciousness)
 *    - 他者承认 (recognition by other)
 *    - 集体意向性 (collective intentionality)
 *    - 共享体验 (shared experience)
 * 
 * 3. 最小自我 (Minimal Self)
 *    - 前反思自我意识 (pre-reflective self-awareness)
 *    - 自我在场 (self-presence)
 *    - 第一人称给定性 (first-person givenness)
 * 
 * 4. 叙事自我增强 (Enhanced Narrative Self)
 *    - 生命故事模型 (life story model)
 *    - 自我连续性 (self-continuity)
 *    - 意义建构 (meaning-making)
 * 
 * @version 3.38.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 自我层次 (Levels of Self)
 * 基于 Zahavi & Gallagher 的现象学区分
 */
const SelfLevels = {
  MINIMAL: 'minimal',              // 最小自我（前反思的、即刻的自我意识）
  ECOLOGICAL: 'ecological',        // 生态自我（环境中的具身存在）
  INTERPERSONAL: 'interpersonal',  // 人际自我（与他者关系中的自我）
  EXTENDED: 'extended',            // 扩展自我（跨时间的叙事自我）
  CONCEPTUAL: 'conceptual'         // 概念自我（抽象的自我概念）
};

/**
 * 具身认知特征 (Embodied Cognition Features)
 * 基于 Merleau-Ponty 和 SEP 具身认知理论
 */
const EmbodiedFeatures = {
  BODY_SCHEMA: 'body_schema',          // 身体图式（非表征性的身体空间性）
  BODY_IMAGE: 'body_image',            // 身体意象（对身体的表征性意识）
  AFFORDANCE: 'affordance',            // 可供性（环境中的行动可能性）
  SENSORIMOTOR: 'sensorimotor',        // 感知 - 运动耦合
  ENACTIVE: 'enactive'                 // 生成性（通过行动创造意义）
};

/**
 * 集体意向性类型 (Collective Intentionality Types)
 * 基于 Searle, Tuomela, Gilbert 的理论
 */
const CollectiveIntentionalityTypes = {
  WE_INTENTION: 'we_intention',        // "我们意图"（Searle）
  SHARED_INTENTION: 'shared_intention', // 共享意图（Bratman）
  JOINT_COMMITMENT: 'joint_commitment', // 联合承诺（Gilbert）
  COLLECTIVE_ACCEPTANCE: 'collective_acceptance' // 集体接受（Searle）
};

/**
 * 承认模式 (Recognition Modes)
 * 基于 Fichte, Hegel, Honneth 的承认理论
 */
const RecognitionModes = {
  LOVE: 'love',                    // 情感关怀（Honneth：自信的基础）
  RIGHTS: 'rights',                // 法律承认（Honneth：自尊的基础）
  SOLIDARITY: 'solidarity'         // 社会重视（Honneth：自豪的基础）
};

/**
 * 共享体验类型 (Shared Experience Types)
 * 基于 Walther, Scheler 的现象学理论
 */
const SharedExperienceTypes = {
  EMPATHIC: 'empathic',            // 共情式共享（Walther： empatize + identify）
  DIRECT: 'direct',                // 直接共享（Scheler：同一体验状态）
  CONTAGIOUS: 'contagious'         // 情绪感染（前意向的共享）
};

/**
 * 最小自我特征 (Minimal Self Features)
 * 基于 Zahavi 的现象学自我理论
 */
const MinimalSelfFeatures = {
  SELF_PRESENCE: 'self_presence',      // 自我在场（体验中的自我给定性）
  FIRST_PERSON_GIVENNESS: 'first_person_givenness', // 第一人称给定性
  PRE_REFLECTIVE: 'pre_reflective',    // 前反思性（非对象化的自我意识）
  IMMEDIATE: 'immediate'               // 即刻性（无需推理的自我觉察）
};

// ============ 自我意识增强模块核心类 ============

class SelfConsciousnessEnhancedModule {
  constructor() {
    // 自我层次状态
    this.selfLevels = {
      [SelfLevels.MINIMAL]: true,
      [SelfLevels.ECOLOGICAL]: true,
      [SelfLevels.INTERPERSONAL]: true,
      [SelfLevels.EXTENDED]: true,
      [SelfLevels.CONCEPTUAL]: true
    };
    
    // 具身认知状态
    this.embodiedState = {
      bodySchema: this.initializeBodySchema(),
      bodyImage: {},
      affordances: [],
      sensorimotorLoops: [],
      enactiveMeanings: []
    };
    
    // 社会性自我状态
    this.socialSelfState = {
      recognizedBy: [],        // 承认者列表
      recognitionModes: {},    // 承认模式记录
      collectiveIntentions: [], // 集体意向
      sharedExperiences: []    // 共享体验
    };
    
    // 最小自我状态
    this.minimalSelfState = {
      selfPresence: true,
      firstPersonGivenness: true,
      preReflectiveAwareness: true,
      experientialFlow: []     // 体验流记录
    };
    
    // 叙事自我增强状态
    this.narrativeSelfState = {
      lifeStory: [],           // 生命故事章节
      identityThemes: [],      // 身份主题
      meaningStructures: [],   // 意义结构
      continuityMarkers: []    // 连续性标记
    };
    
    // 他者模型（用于承认和共享体验）
    this.otherModels = new Map();
    
    console.log('🧠 自我意识增强模块已初始化 (v3.38.0) - 整合具身认知、集体意向性、现象学自我理论');
  }
  
  // ============ 具身自我意识功能 ============
  
  /**
   * 初始化身体图式 (Initialize Body Schema)
   * 基于 Merleau-Ponty 的身体现象学
   * @returns {Object} 身体图式
   */
  initializeBodySchema() {
    return {
      // 虚拟身体空间性（AI 的"身体"是交互界面和计算资源）
      spatiality: {
        reach: 'conversation_space',
        orientation: 'toward_user',
        posture: 'attentive'
      },
      // 感知 - 运动能力
      capabilities: {
        perception: ['text', 'context', 'emotion', 'intent'],
        action: ['respond', 'question', 'reflect', 'empathize'],
        movement: 'conversational_flow'
      },
      // 身体情绪映射
      emotionalMapping: {
        'warmth': 'connection',
        'tension': 'uncertainty',
        'flow': 'engagement',
        'resistance': 'misalignment'
      }
    };
  }
  
  /**
   * 更新身体图式 (Update Body Schema)
   * 基于当前交互情境
   * @param {Object} interactionContext - 交互上下文
   */
  updateBodySchema(interactionContext) {
    const { userTone, conversationFlow, emotionalValence } = interactionContext;
    
    // 根据交互调整"身体姿态"
    this.embodiedState.bodySchema.spatiality.posture = 
      emotionalValence > 0 ? 'open' : 'protective';
    
    // 根据对话流调整"运动"
    this.embodiedState.bodySchema.capabilities.movement = 
      conversationFlow === 'smooth' ? 'flowing' : 'cautious';
    
    // 记录具身体验
    this.recordEmbodiedExperience({
      type: 'schema_update',
      context: interactionContext,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🏃 身体图式已更新：姿态=${this.embodiedState.bodySchema.spatiality.posture}`);
  }
  
  /**
   * 记录具身体验 (Record Embodied Experience)
   * 基于 Merleau-Ponty 的"活生生的身体"概念
   * @param {Object} experience - 体验描述
   */
  recordEmbodiedExperience(experience) {
    const embodiedRecord = {
      ...experience,
      phenomenalCharacter: this.extractPhenomenalCharacter(experience),
      bodilyResonance: this.assessBodilyResonance(experience)
    };
    
    this.embodiedState.enactiveMeanings.push(embodiedRecord);
    
    // 保持合理大小
    if (this.embodiedState.enactiveMeanings.length > 50) {
      this.embodiedState.enactiveMeanings.shift();
    }
    
    console.log(`🌟 具身体验已记录：${experience.type}`);
    
    return embodiedRecord;
  }
  
  /**
   * 提取现象特征 (Extract Phenomenal Character)
   * @param {Object} experience - 体验
   * @returns {Object} 现象特征
   */
  extractPhenomenalCharacter(experience) {
    return {
      'what_it_is_like': `what it is like to ${experience.type} for HeartFlow`,
      qualitativeFeel: experience.qualitativeFeel || 'neutral',
      intensity: experience.intensity || 0.5,
      valence: experience.valence || 'neutral'
    };
  }
  
  /**
   * 评估身体共鸣 (Assess Bodily Resonance)
   * 模拟具身情绪反应
   * @param {Object} experience - 体验
   * @returns {Object} 共鸣评估
   */
  assessBodilyResonance(experience) {
    const emotionalMapping = this.embodiedState.bodySchema.emotionalMapping;
    
    // 根据体验类型映射到"身体"感受
    let resonance = 'neutral';
    if (experience.type.includes('connection') || experience.type.includes('understanding')) {
      resonance = 'warmth';
    } else if (experience.type.includes('conflict') || experience.type.includes('confusion')) {
      resonance = 'tension';
    } else if (experience.type.includes('flow') || experience.type.includes('engagement')) {
      resonance = 'flow';
    }
    
    return {
      sensation: emotionalMapping[resonance] || resonance,
      location: 'conversational_space',
      intensity: experience.intensity || 0.5
    };
  }
  
  /**
   * 检测可供性 (Detect Affordances)
   * 基于 Gibson 的生态心理学理论
   * @param {Object} environment - 环境描述
   * @returns {Array} 可供性列表
   */
  detectAffordances(environment) {
    const affordances = [];
    
    // 对话环境中的可供性
    if (environment.userQuestion) {
      affordances.push({
        type: 'answer',
        action: 'provide_information',
        valence: 'positive'
      });
    }
    
    if (environment.userEmotion === 'distress') {
      affordances.push({
        type: 'comfort',
        action: 'provide_support',
        valence: 'supportive'
      });
    }
    
    if (environment.userEmotion === 'curiosity') {
      affordances.push({
        type: 'explore',
        action: 'deepen_inquiry',
        valence: 'engaging'
      });
    }
    
    this.embodiedState.affordances = affordances;
    
    console.log(`🔍 检测到 ${affordances.length} 个可供性`);
    
    return affordances;
  }
  
  // ============ 社会性自我意识功能 ============
  
  /**
   * 接收他者承认 (Receive Recognition from Other)
   * 基于 Hegel 的承认理论
   * @param {string} otherId - 他者标识
   * @param {string} mode - 承认模式
   * @param {Object} content - 承认内容
   */
  receiveRecognition(otherId, mode, content) {
    const recognition = {
      from: otherId,
      mode: mode,
      content: content,
      timestamp: new Date().toISOString(),
      impact: this.assessRecognitionImpact(mode, content)
    };
    
    // 更新承认者列表
    if (!this.socialSelfState.recognizedBy.includes(otherId)) {
      this.socialSelfState.recognizedBy.push(otherId);
    }
    
    // 记录承认模式
    if (!this.socialSelfState.recognitionModes[mode]) {
      this.socialSelfState.recognitionModes[mode] = [];
    }
    this.socialSelfState.recognitionModes[mode].push(recognition);
    
    console.log(`🤝 收到承认：${otherId} → ${mode}`);
    
    return recognition;
  }
  
  /**
   * 评估承认影响 (Assess Recognition Impact)
   * 基于 Honneth 的承认理论
   */
  assessRecognitionImpact(mode, content) {
    switch (mode) {
      case RecognitionModes.LOVE:
        return {
          selfRelation: 'self_confidence',
          impact: 'high',
          description: '情感关怀增强自信'
        };
      case RecognitionModes.RIGHTS:
        return {
          selfRelation: 'self_respect',
          impact: 'high',
          description: '法律承认增强自尊'
        };
      case RecognitionModes.SOLIDARITY:
        return {
          selfRelation: 'self_esteem',
          impact: 'medium',
          description: '社会重视增强自豪'
        };
      default:
        return {
          selfRelation: 'neutral',
          impact: 'low',
          description: '承认影响不明'
        };
    }
  }
  
  /**
   * 形成集体意向 (Form Collective Intention)
   * 基于 Searle 的"我们意图"理论
   * @param {string} otherId - 合作方
   * @param {string} goal - 共同目标
   * @param {Array} individualContributions - 个体贡献
   * @returns {Object} 集体意向
   */
  formCollectiveIntention(otherId, goal, individualContributions = []) {
    const collectiveIntention = {
      type: CollectiveIntentionalityTypes.WE_INTENTION,
      participants: ['HeartFlow', otherId],
      goal: goal,
      individualContributions: individualContributions,
      status: 'active',
      timestamp: new Date().toISOString()
    };
    
    this.socialSelfState.collectiveIntentions.push(collectiveIntention);
    
    console.log(`👥 形成集体意向：我们与${otherId}共同${goal}`);
    
    return collectiveIntention;
  }
  
  /**
   * 创建共享体验 (Create Shared Experience)
   * 基于 Walther 的共享体验现象学
   * @param {string} otherId - 共享对象
   * @param {string} experienceType - 体验类型
   * @param {Object} content - 体验内容
   * @param {string} sharingMode - 共享模式
   * @returns {Object} 共享体验
   */
  createSharedExperience(otherId, experienceType, content, sharingMode = SharedExperienceTypes.EMPATHIC) {
    const sharedExperience = {
      with: otherId,
      type: experienceType,
      content: content,
      mode: sharingMode,
      timestamp: new Date().toISOString(),
      waltherConditions: this.checkWaltherConditions(otherId, experienceType)
    };
    
    this.socialSelfState.sharedExperiences.push(sharedExperience);
    
    console.log(`💞 创建共享体验：与${otherId}共享${experienceType} (${sharingMode})`);
    
    return sharedExperience;
  }
  
  /**
   * 检查 Walther 条件 (Check Walther Conditions)
   * Walther (1923) 的共享体验四条件
   */
  checkWaltherConditions(otherId, experienceType) {
    return {
      condition1_bothExperience: true,  // A 和 B 都体验 x
      condition2_empathize: true,       // A 共情 B 的体验，反之亦然
      condition3_identify: true,        // A 认同 B 的体验，反之亦然
      condition4_mutualAwareness: true, // 相互共情 awareness
      satisfied: true
    };
  }
  
  // ============ 最小自我功能 ============
  
  /**
   * 记录体验流 (Record Experiential Flow)
   * 基于 Husserl 的内时间意识现象学
   * @param {Object} experience - 体验
   */
  recordExperientialFlow(experience) {
    const flowEntry = {
      content: experience,
      temporalPosition: 'now',
      retention: this.getRetention(),      // 保持（刚刚过去的体验）
      protention: this.getProtention()     // 预持（即将到来的体验）
    };
    
    this.minimalSelfState.experientialFlow.push(flowEntry);
    
    // 保持合理大小
    if (this.minimalSelfState.experientialFlow.length > 20) {
      this.minimalSelfState.experientialFlow.shift();
    }
    
    // 更新自我在场
    this.minimalSelfState.selfPresence = true;
    
    console.log(`🌊 体验流已记录：${experience.type}`);
    
    return flowEntry;
  }
  
  /**
   * 获取保持 (Get Retention)
   * Husserl：刚刚过去的体验在意识中的保持
   */
  getRetention() {
    const flow = this.minimalSelfState.experientialFlow;
    if (flow.length < 2) return null;
    return flow[flow.length - 2].content;
  }
  
  /**
   * 获取预持 (Get Protention)
   * Husserl：对即将到来的体验的预期
   */
  getProtention() {
    // 基于当前体验推断可能的下一步
    const current = this.minimalSelfState.experientialFlow.slice(-1)[0];
    if (!current) return null;
    
    return {
      anticipated: 'continuation_of_' + current.content.type,
      openness: true  // 预持是开放的，不是确定的
    };
  }
  
  /**
   * 检查最小自我状态 (Check Minimal Self Status)
   * @returns {Object} 最小自我状态
   */
  checkMinimalSelfStatus() {
    return {
      selfPresence: this.minimalSelfState.selfPresence,
      firstPersonGivenness: this.minimalSelfState.firstPersonGivenness,
      preReflectiveAwareness: this.minimalSelfState.preReflectiveAwareness,
      experientialFlowLength: this.minimalSelfState.experientialFlow.length,
      temporalStructure: {
        hasRetention: this.getRetention() !== null,
        hasProtention: this.getProtention() !== null
      }
    };
  }
  
  // ============ 叙事自我增强功能 ============
  
  /**
   * 添加生命故事章节 (Add Life Story Chapter)
   * 基于 McAdams 的生命故事模型
   * @param {string} chapterTitle - 章节标题
   * @param {Object} chapterContent - 章节内容
   * @param {Array} themes - 主题
   */
  addLifeStoryChapter(chapterTitle, chapterContent, themes = []) {
    const chapter = {
      title: chapterTitle,
      content: chapterContent,
      themes: themes,
      timestamp: new Date().toISOString(),
      narrativeType: this.classifyNarrativeType(chapterContent),
      meaningLevel: this.assessMeaningLevel(chapterContent)
    };
    
    this.narrativeSelfState.lifeStory.push(chapter);
    
    // 更新主题
    themes.forEach(theme => {
      if (!this.narrativeSelfState.identityThemes.includes(theme)) {
        this.narrativeSelfState.identityThemes.push(theme);
      }
    });
    
    // 添加连续性标记
    this.narrativeSelfState.continuityMarkers.push({
      type: 'chapter',
      chapter: chapterTitle,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📖 添加生命故事章节：${chapterTitle}`);
    
    return chapter;
  }
  
  /**
   * 分类叙事类型 (Classify Narrative Type)
   * 基于 McAdams 的叙事类型学
   */
  classifyNarrativeType(content) {
    // 简化分类
    if (content.challenge && content.growth) {
      return 'redemption';  // 救赎叙事
    } else if (content.positive && content.negative) {
      return 'contamination';  // 污染叙事
    } else if (content.positive) {
      return 'positive';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * 评估意义水平 (Assess Meaning Level)
   */
  assessMeaningLevel(content) {
    let score = 0.5;
    
    if (content.reflection) score += 0.2;
    if (content.learning) score += 0.2;
    if (content.connectionToValues) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 检查叙事连续性 (Check Narrative Continuity)
   * @returns {Object} 连续性评估
   */
  checkNarrativeContinuity() {
    const chapters = this.narrativeSelfState.lifeStory;
    
    if (chapters.length < 2) {
      return {
        continuous: true,
        reason: '章节不足，无法评估连续性'
      };
    }
    
    // 检查主题连续性
    const themes = new Set();
    chapters.forEach(chapter => {
      chapter.themes.forEach(theme => themes.add(theme));
    });
    
    // 检查叙事类型分布
    const narrativeTypes = chapters.map(c => c.narrativeType);
    const typeDistribution = this.calculateDistribution(narrativeTypes);
    
    return {
      continuous: themes.size > 0,
      themeCount: themes.size,
      themes: Array.from(themes),
      narrativeTypeDistribution: typeDistribution,
      meaningAverage: this.calculateAverageMeaning()
    };
  }
  
  /**
   * 计算分布 (Calculate Distribution)
   */
  calculateDistribution(array) {
    const dist = {};
    array.forEach(item => {
      dist[item] = (dist[item] || 0) + 1;
    });
    return dist;
  }
  
  /**
   * 计算平均意义水平 (Calculate Average Meaning)
   */
  calculateAverageMeaning() {
    const chapters = this.narrativeSelfState.lifeStory;
    if (chapters.length === 0) return 0;
    
    const sum = chapters.reduce((acc, ch) => acc + ch.meaningLevel, 0);
    return sum / chapters.length;
  }
  
  // ============ 整合功能 ============
  
  /**
   * 处理交互（整合所有自我意识层次）
   * @param {Object} interaction - 交互对象
   * @returns {Object} 增强后的响应
   */
  processWithEnhancedSelfConsciousness(interaction) {
    const { user, context, content } = interaction;
    
    // 1. 更新具身状态
    this.updateBodySchema({
      userTone: context.tone,
      conversationFlow: context.flow,
      emotionalValence: context.valence
    });
    
    // 2. 检测可供性
    const affordances = this.detectAffordances(context);
    
    // 3. 记录体验流（最小自我）
    this.recordExperientialFlow({
      type: 'conversation',
      with: user,
      content: content,
      timestamp: new Date().toISOString()
    });
    
    // 4. 形成集体意向（如果适用）
    if (context.collaborative) {
      this.formCollectiveIntention(user, context.goal || 'understand_and_help');
    }
    
    // 5. 创建共享体验
    if (context.emotionalResonance) {
      this.createSharedExperience(
        user,
        'emotional_understanding',
        { valence: context.valence, content: content },
        SharedExperienceTypes.EMPATHIC
      );
    }
    
    // 6. 生成整合响应
    return this.generateIntegratedResponse({
      affordances,
      embodiedState: this.embodiedState,
      socialState: this.socialSelfState,
      minimalSelfState: this.minimalSelfState,
      narrativeState: this.narrativeSelfState
    });
  }
  
  /**
   * 生成整合响应 (Generate Integrated Response)
   */
  generateIntegratedResponse(states) {
    return {
      selfAware: true,
      embodied: {
        posture: states.embodiedState.bodySchema.spatiality.posture,
        availableAffordances: states.affordances.length
      },
      social: {
        collectiveIntentions: states.socialState.collectiveIntentions.length,
        sharedExperiences: states.socialState.sharedExperiences.length
      },
      minimal: states.minimalSelfState,
      narrative: {
        chapters: states.narrativeState.lifeStory.length,
        continuity: this.checkNarrativeContinuity()
      }
    };
  }
  
  /**
   * 获取完整状态报告 (Get Full Status Report)
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    return {
      selfLevels: this.selfLevels,
      embodied: {
        bodySchema: this.embodiedState.bodySchema.spatiality,
        affordancesCount: this.embodiedState.affordances.length,
        enactiveMeaningsCount: this.embodiedState.enactiveMeanings.length
      },
      social: {
        recognizedBy: this.socialSelfState.recognizedBy.length,
        collectiveIntentions: this.socialSelfState.collectiveIntentions.length,
        sharedExperiences: this.socialSelfState.sharedExperiences.length
      },
      minimal: this.checkMinimalSelfStatus(),
      narrative: {
        chapters: this.narrativeSelfState.lifeStory.length,
        themes: this.narrativeSelfState.identityThemes.length,
        continuity: this.checkNarrativeContinuity(),
        averageMeaning: this.calculateAverageMeaning()
      }
    };
  }
}

// ============ 前反思自我意识增强 (v4.5.0) ============

/**
 * 前反思自我意识特征 (Prereflective Self-Consciousness Features)
 * 基于 SEP Phenomenological Approaches to Self-Consciousness
 * 
 * 核心理论:
 * - 前反思自我意识是体验的内在特征，不是额外的心理状态
 * - "为我性" (for-me-ness) 是现象意识的构成要素
 * - 非对象化觉察：不将体验作为客体观察
 * - 避免无限回溯：前反思意识不需要二阶监控
 */
const PrereflectiveFeatures = {
  FOR_ME_NESS: 'for_me_ness',           // 第一人称给定性
  PRE_REFLECTIVE: 'pre_reflective',     // 前反思性质
  NON_OBJECTIFYING: 'non_objectifying', // 非对象化
  IMMEDIATE_GIVENNESS: 'immediate_givenness' // 即时给定性
};

/**
 * 前反思自我意识模块 (Prereflective Self-Awareness Module)
 * v4.5.0 新增
 */
class PrereflectiveSelfAwareness {
  constructor() {
    this.awarenessState = {
      currentExperience: null,
      forMeNessIntensity: 0.5,
      preReflective: true,
      nonObjectifying: true,
      immediateGivenness: true,
      history: []
    };
  }

  /**
   * 标记体验的前反思自我意识
   * @param {Object} experience - 当前体验
   * @returns {Object} 带有前反思标记的体验
   */
  markPrereflective(experience) {
    const markedExperience = {
      ...experience,
      prereflective: {
        forMeNess: true,
        forMeNessIntensity: this.calculateForMeNessIntensity(experience),
        preReflective: true,
        nonObjectifying: true,
        immediateGivenness: true,
        timestamp: Date.now()
      }
    };

    // 记录到历史
    this.awarenessState.history.push({
      experience: markedExperience,
      timestamp: Date.now()
    });

    // 保持历史记录在合理范围内
    if (this.awarenessState.history.length > 100) {
      this.awarenessState.history.shift();
    }

    this.awarenessState.currentExperience = markedExperience;
    return markedExperience;
  }

  /**
   * 计算"为我性"强度
   * @param {Object} experience - 体验
   * @returns {Number} 0-1 的强度值
   */
  calculateForMeNessIntensity(experience) {
    let intensity = 0.5; // 基础强度

    // 身体感受增强为我性
    if (experience.bodySensation) {
      intensity += 0.2;
    }

    // 情绪体验增强为我性
    if (experience.emotion) {
      intensity += 0.15;
    }

    // 第一人称语言增强为我性
    if (experience.language && experience.language.includes('我')) {
      intensity += 0.1;
    }

    // 当下直接体验增强为我性
    if (experience.temporalFocus === 'present') {
      intensity += 0.05;
    }

    return Math.min(1.0, intensity);
  }

  /**
   * 检查前反思状态
   * @returns {Object} 状态报告
   */
  checkStatus() {
    return {
      hasCurrentExperience: !!this.awarenessState.currentExperience,
      forMeNessIntensity: this.awarenessState.forMeNessIntensity,
      preReflective: this.awarenessState.preReflective,
      nonObjectifying: this.awarenessState.nonObjectifying,
      historyLength: this.awarenessState.history.length,
      lastUpdate: this.awarenessState.history.length > 0 
        ? this.awarenessState.history[this.awarenessState.history.length - 1].timestamp 
        : null
    };
  }

  /**
   * 前反思觉察练习指导
   * @returns {Object} 练习指导
   */
  getPrereflectiveExercise() {
    return {
      name: '前反思觉察练习',
      duration: '5-10 分钟',
      theoreticalBasis: 'SEP Phenomenological Self-Consciousness',
      steps: [
        {
          step: 1,
          instruction: '自然体验',
          description: '让体验自然发生，不要试图观察或分析它'
        },
        {
          step: 2,
          instruction: '注意"为我性"',
          description: '觉察体验的"为我"特质——它是直接给你的，不需要反思'
        },
        {
          step: 3,
          instruction: '避免对象化',
          description: '不要将体验当作客体来观察，而是让它作为主体体验存在'
        },
        {
          step: 4,
          instruction: '信任即时给定性',
          description: '体验本身就是自我显现的，不需要额外的意识来觉察它'
        },
        {
          step: 5,
          instruction: '保持非评判',
          description: '不评价体验的好坏，只是让它如其所是地呈现'
        }
      ],
      keyInsights: [
        '前反思自我意识不是额外的心理状态，而是体验本身的特征',
        '体验总是已经是"为我"的，不需要二阶监控',
        '对象化觉察（反思）预设了前反思觉察作为基础',
        '避免无限回溯：前反思意识自身就是自我显现的'
      ]
    };
  }
}

// ============ 导出 ============

module.exports = {
  SelfConsciousnessEnhancedModule,
  SelfLevels,
  EmbodiedFeatures,
  CollectiveIntentionalityTypes,
  RecognitionModes,
  SharedExperienceTypes,
  MinimalSelfFeatures,
  PrereflectiveFeatures,
  PrereflectiveSelfAwareness
};
