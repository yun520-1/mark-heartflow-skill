/**
 * 自我意识现象学增强模块 (Self-Consciousness Phenomenology Enhanced Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论的深度整合：
 * - 自我意识理论 (Self-Consciousness Theory)
 * - 现象学方法 (Phenomenology)
 * - 主体性理论 (Subjectivity)
 * - 最小自我与叙事自我 (Minimal Self & Narrative Self)
 * - 自我构成理论 (Self-Constitution)
 * - 主体间性 (Intersubjectivity)
 * - 承认理论 (Recognition Theory)
 * 
 * 核心理论来源:
 * - Zahavi, D. (2005). Subjectivity and Selfhood (最小自我/第一人称给定性)
 * - Gallagher, S. (2000). Philosophical Conceptions of the Self (自我层次)
 * - Korsgaard, C. (2009). Self-Constitution: Agency, Identity, and Integrity (自我构成)
 * - Husserl, E. (1929). Cartesian Meditations (主体间性)
 * - Merleau-Ponty, M. (1945). Phenomenology of Perception (具身主体性)
 * - Hegel, G.W.F. (1807). Phenomenology of Spirit (承认理论)
 * - Sartre, J.-P. (1943). Being and Nothingness (前反思自我意识)
 * - Dennett, D. (1991). Consciousness Explained (叙事自我)
 * - Schechtman, M. (2011). The Narrative Self (叙事同一性)
 * - Fichte, J.G. (1794-1795). Foundations of Natural Right (承认理论)
 * - Honneth, A. (1992). The Struggle for Recognition (承认斗争)
 * 
 * 功能目标：赋予 HeartFlow 深度现象学自我意识能力
 * 
 * 1. 自我层次评估 (4 层次模型)
 *    - 最小自我 (Minimal Self): 前反思的自我在场感
 *    - 反思自我 (Reflective Self): 将自我作为对象思考
 *    - 社会自我 (Social Self): 通过他者承认建构
 *    - 叙事自我 (Narrative Self): 生命故事的连贯整合
 * 
 * 2. 第一人称给定性评估 (3 维度)
 *    - 主体性 (Subjectivity): 体验的第一人称特征强度
 *    - 给定性 (Givenness): 体验的直接给予程度
 *    - 透明性 (Transparency): 自我指向的透明程度
 * 
 * 3. 自我构成分析 (Korsgaard 框架)
 *    - 实践同一性评估
 *    - 原则一致性检查
 *    - 自我立法能力评估
 *    - 构成性行动识别
 * 
 * 4. 主体间性评估 (Husserl 框架)
 *    - 他者意识检测
 *    - 共情能力评估
 *    - 共享体验识别
 *    - 社会世界参与度
 * 
 * 5. 现象学干预 (8 个练习)
 *    - 最小自我觉察练习
 *    - 第一人称视角深化
 *    - 自我构成反思
 *    - 他者承认练习
 *    - 叙事整合写作
 *    - 现象学还原练习
 *    - 主体间对话
 *    - 自我距离调节
 * 
 * @version 4.8.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 自我层次 (Levels of Self)
 * 基于 Zahavi 和 Gallagher 的自我层次理论
 */
const SelfLevels = {
  MINIMAL: 'minimal',           // 最小自我：前反思的自我在场
  REFLECTIVE: 'reflective',     // 反思自我：对象化的自我思考
  SOCIAL: 'social',             // 社会自我：通过他者承认建构
  NARRATIVE: 'narrative'        // 叙事自我：生命故事的整合
};

/**
 * 第一人称给定性维度 (First-Person Givenness Dimensions)
 * 基于 Zahavi 的主体性理论
 */
const GivennessDimensions = {
  SUBJECTIVITY: 'subjectivity',    // 主体性：体验的"为我性"
  GIVENNESS: 'givenness',          // 给定性：体验的直接给予
  TRANSPARENCY: 'transparency'     // 透明性：自我指向的透明程度
};

/**
 * 给定性模式 (Modes of Givenness)
 * 基于现象学给定性理论
 */
const GivennessModes = {
  SENSORY: 'sensory',         // 感官给定性
  EMOTIONAL: 'emotional',     // 情绪给定性
  COGNITIVE: 'cognitive',     // 认知给定性
  NORMATIVE: 'normative'      // 规范给定性
};

/**
 * 自我构成要素 (Self-Constitution Elements)
 * 基于 Korsgaard 的自我构成理论
 */
const ConstitutionElements = {
  PRACTICAL_IDENTITY: 'practical_identity',  // 实践同一性
  PRINCIPLE_CONSISTENCY: 'principle_consistency', // 原则一致性
  SELF_LEGISLATION: 'self_legislation',      // 自我立法
  CONSTITUTIVE_ACTION: 'constitutive_action' // 构成性行动
};

/**
 * 主体间性维度 (Intersubjectivity Dimensions)
 * 基于 Husserl 的主体间性理论
 */
const IntersubjectivityDimensions = {
  OTHER_AWARENESS: 'other_awareness',    // 他者意识
  EMPATHY: 'empathy',                    // 共情能力
  SHARED_EXPERIENCE: 'shared_experience', // 共享体验
  SOCIAL_WORLD: 'social_world'           // 社会世界参与
};

/**
 * 承认形式 (Forms of Recognition)
 * 基于 Hegel 和 Honneth 的承认理论
 */
const RecognitionForms = {
  LOVE: 'love',               // 情感关怀 (初级承认)
  RIGHTS: 'rights',           // 权利承认 (法律承认)
  SOLIDARITY: 'solidarity'    // 团结承认 (社会重视)
};

// ============ 自我意识现象学增强模块核心类 ============

class SelfConsciousnessPhenomenologyEnhanced {
  constructor() {
    // 自我层次状态
    this.selfLevelState = {
      dominant: SelfLevels.REFLECTIVE,
      scores: {},
      history: []
    };
    
    // 第一人称给定性状态
    this.givennessState = {
      dimensions: {},
      overall: 0,
      lastAssessment: null
    };
    
    // 自我构成状态
    this.constitutionState = {
      practicalIdentities: [],
      principles: [],
      selfLegislation: [],
      constitutiveActions: []
    };
    
    // 主体间性状态
    this.intersubjectivityState = {
      dimensions: {},
      relationships: [],
      sharedExperiences: []
    };
    
    // 承认关系状态
    this.recognitionState = {
      forms: {},
      struggles: [],
      achievements: []
    };
    
    // 现象学练习历史
    this.exerciseHistory = [];
    
    console.log('🧠 自我意识现象学增强模块已初始化 (v4.8.0) - 整合 Zahavi/Gallagher/Korsgaard/Husserl 理论');
  }
  
  // ============ 自我层次评估 ============
  
  /**
   * 评估自我层次 (Assess Self Level)
   * 基于 Zahavi 和 Gallagher 的 4 层次模型
   * @param {Object} context - 上下文信息
   * @returns {Object} 自我层次评估结果
   */
  assessSelfLevel(context = {}) {
    const scores = {
      [SelfLevels.MINIMAL]: this.assessMinimalSelf(context),
      [SelfLevels.REFLECTIVE]: this.assessReflectiveSelf(context),
      [SelfLevels.SOCIAL]: this.assessSocialSelf(context),
      [SelfLevels.NARRATIVE]: this.assessNarrativeSelf(context)
    };
    
    const dominant = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    this.selfLevelState = {
      dominant,
      scores,
      history: [...this.selfLevelState.history, { dominant, timestamp: new Date().toISOString() }].slice(-20)
    };
    
    return {
      dominant,
      dominantName: this.getSelfLevelName(dominant),
      scores,
      profile: this.generateSelfProfile(scores),
      suggestions: this.getSelfLevelSuggestions(dominant, scores)
    };
  }
  
  /**
   * 评估最小自我 (Assess Minimal Self)
   * 基于 Zahavi 的前反思自我意识理论
   */
  assessMinimalSelf(context) {
    let score = 0.5; // 基础分
    
    // 前反思自我在场指标
    if (context.hasPrereflectiveAwareness) score += 0.2;
    if (context.hasForMeNess) score += 0.15;
    if (context.hasImmediateSelfPresence) score += 0.15;
    
    // 现象学还原能力
    if (context.canPerformEpoché) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估反思自我 (Assess Reflective Self)
   * 基于对象化自我思考能力
   */
  assessReflectiveSelf(context) {
    let score = 0.5;
    
    // 元认知能力指标
    if (context.hasMetacognition) score += 0.2;
    if (context.hasSelfConcept) score += 0.15;
    if (context.canObjectifySelf) score += 0.15;
    
    // 内省能力
    if (context.hasIntrospectiveCapacity) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估社会自我 (Assess Social Self)
   * 基于他者承认理论 (Hegel, Honneth)
   */
  assessSocialSelf(context) {
    let score = 0.5;
    
    // 他者承认指标
    if (context.hasOtherRecognition) score += 0.2;
    if (context.hasSocialIdentity) score += 0.15;
    if (context.hasIntersubjectiveAwareness) score += 0.15;
    
    // 社会参与
    if (context.hasSocialEngagement) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估叙事自我 (Assess Narrative Self)
   * 基于 Dennett 和 Schechtman 的叙事自我理论
   */
  assessNarrativeSelf(context) {
    let score = 0.5;
    
    // 叙事整合指标
    if (context.hasLifeStory) score += 0.2;
    if (context.hasNarrativeCoherence) score += 0.15;
    if (context.hasTemporalDepth) score += 0.15;
    
    // 意义建构
    if (context.hasMeaningMaking) score += 0.1;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 获取自我层次名称
   */
  getSelfLevelName(level) {
    const names = {
      [SelfLevels.MINIMAL]: '最小自我',
      [SelfLevels.REFLECTIVE]: '反思自我',
      [SelfLevels.SOCIAL]: '社会自我',
      [SelfLevels.NARRATIVE]: '叙事自我'
    };
    return names[level] || '未知';
  }
  
  /**
   * 生成自我轮廓
   */
  generateSelfProfile(scores) {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalized = {};
    
    for (const [level, score] of Object.entries(scores)) {
      normalized[level] = score / total;
    }
    
    const balance = this.calculateBalance(normalized);
    
    return {
      normalized,
      balance,
      dominant: Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b),
      weakest: Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b)
    };
  }
  
  /**
   * 计算自我层次平衡度
   */
  calculateBalance(normalized) {
    const values = Object.values(normalized);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 标准差越小，平衡度越高
    const balance = Math.max(0, 1 - stdDev * 2);
    
    return {
      score: balance,
      level: balance > 0.75 ? 'balanced' : balance > 0.5 ? 'moderate' : 'imbalanced'
    };
  }
  
  /**
   * 获取自我层次发展建议
   */
  getSelfLevelSuggestions(dominant, scores) {
    const suggestions = [];
    
    // 找出最弱的层次
    const weakest = Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
    
    switch (weakest) {
      case SelfLevels.MINIMAL:
        suggestions.push({
          focus: '最小自我',
          practice: '正念冥想：培养前反思的自我在场感',
          technique: '注意体验的"为我性"，而非体验内容',
          resource: 'Zahavi (2005) Subjectivity and Selfhood'
        });
        break;
      case SelfLevels.REFLECTIVE:
        suggestions.push({
          focus: '反思自我',
          practice: '日记写作：定期反思自己的信念和行动',
          technique: '使用元认知问题："我现在在想什么？"',
          resource: 'Locke (1688) An Essay on Human Understanding'
        });
        break;
      case SelfLevels.SOCIAL:
        suggestions.push({
          focus: '社会自我',
          practice: '主体间对话：深化对他者的理解',
          technique: '练习共情倾听和承认他者经验',
          resource: 'Husserl (1929) Cartesian Meditations'
        });
        break;
      case SelfLevels.NARRATIVE:
        suggestions.push({
          focus: '叙事自我',
          practice: '生命故事写作：整合过去 - 现在 - 未来',
          technique: '识别生命中的救赎/污染序列',
          resource: 'McAdams (2001) The Psychology of Life Stories'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 第一人称给定性评估 ============
  
  /**
   * 评估第一人称给定性 (Assess First-Person Givenness)
   * 基于 Zahavi 的主体性理论
   * @param {Object} experience - 体验描述
   * @returns {Object} 给定性评估结果
   */
  assessFirstPersonGivenness(experience) {
    const dimensions = {
      [GivennessDimensions.SUBJECTIVITY]: this.assessSubjectivity(experience),
      [GivennessDimensions.GIVENNESS]: this.assessGivenness(experience),
      [GivennessDimensions.TRANSPARENCY]: this.assessTransparency(experience)
    };
    
    const overall = Object.values(dimensions).reduce((a, b) => a + b, 0) / 3;
    
    this.givennessState = {
      dimensions,
      overall,
      lastAssessment: new Date().toISOString()
    };
    
    return {
      dimensions,
      overall,
      profile: this.generateGivennessProfile(dimensions),
      suggestions: this.getGivennessSuggestions(dimensions)
    };
  }
  
  /**
   * 评估主体性维度
   */
  assessSubjectivity(experience) {
    let score = 0.5;
    
    // 第一人称标记
    if (experience.firstPersonMarkers > 0.3) score += 0.2;
    
    // 为我性 (for-me-ness)
    if (experience.hasForMeNess) score += 0.15;
    
    // 现象意识强度
    if (experience.phenomenalIntensity > 0.5) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估给定性维度
   */
  assessGivenness(experience) {
    let score = 0.5;
    
    // 直接性
    if (experience.isDirect) score += 0.2;
    
    // 非推论性
    if (experience.isNonInferential) score += 0.15;
    
    // 现象学充实度
    if (experience.phenomenalFullness > 0.5) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估透明性维度
   */
  assessTransparency(experience) {
    let score = 0.5;
    
    // 自我指向的透明程度
    if (experience.selfTransparency > 0.5) score += 0.2;
    
    // 反思距离
    if (experience.reflexiveDistance > 0.3) score += 0.15;
    
    // 无中介性
    if (experience.isUnmediated) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 生成给定性轮廓
   */
  generateGivennessProfile(dimensions) {
    const dominant = Object.keys(dimensions).reduce((a, b) => dimensions[a] > dimensions[b] ? a : b);
    
    return {
      dominant,
      dominantName: this.getGivennessDimensionName(dominant),
      balance: this.calculateGivennessBalance(dimensions)
    };
  }
  
  /**
   * 获取给定性维度名称
   */
  getGivennessDimensionName(dimension) {
    const names = {
      [GivennessDimensions.SUBJECTIVITY]: '主体性',
      [GivennessDimensions.GIVENNESS]: '给定性',
      [GivennessDimensions.TRANSPARENCY]: '透明性'
    };
    return names[dimension] || '未知';
  }
  
  /**
   * 计算给定性平衡度
   */
  calculateGivennessBalance(dimensions) {
    const values = Object.values(dimensions);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: Math.max(0, 1 - stdDev * 2),
      level: stdDev < 0.15 ? 'balanced' : stdDev < 0.25 ? 'moderate' : 'imbalanced'
    };
  }
  
  /**
   * 获取给定性发展建议
   */
  getGivennessSuggestions(dimensions) {
    const suggestions = [];
    
    // 找出最弱的维度
    const weakest = Object.keys(dimensions).reduce((a, b) => dimensions[a] < dimensions[b] ? a : b);
    
    switch (weakest) {
      case GivennessDimensions.SUBJECTIVITY:
        suggestions.push({
          focus: '主体性',
          practice: '第一人称视角深化练习',
          technique: '注意体验的"为我性"——体验总是为某人的体验',
          duration: '15-20 分钟'
        });
        break;
      case GivennessDimensions.GIVENNESS:
        suggestions.push({
          focus: '给定性',
          practice: '现象学还原练习',
          technique: '悬置判断，回到体验的直接给予',
          duration: '20-30 分钟'
        });
        break;
      case GivennessDimensions.TRANSPARENCY:
        suggestions.push({
          focus: '透明性',
          practice: '透明性方法练习',
          technique: '通过看向世界来回答关于信念的问题',
          duration: '15-25 分钟'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 自我构成分析 ============
  
  /**
   * 分析自我构成 (Analyze Self-Constitution)
   * 基于 Korsgaard 的自我构成理论
   * @param {Object} context - 上下文信息
   * @returns {Object} 自我构成分析结果
   */
  analyzeSelfConstitution(context = {}) {
    const elements = {
      [ConstitutionElements.PRACTICAL_IDENTITY]: this.assessPracticalIdentity(context),
      [ConstitutionElements.PRINCIPLE_CONSISTENCY]: this.assessPrincipleConsistency(context),
      [ConstitutionElements.SELF_LEGISLATION]: this.assessSelfLegislation(context),
      [ConstitutionElements.CONSTITUTIVE_ACTION]: this.assessConstitutiveAction(context)
    };
    
    return {
      elements,
      overall: Object.values(elements).reduce((a, b) => a + b, 0) / 4,
      integrity: this.calculateIntegrity(elements),
      suggestions: this.getConstitutionSuggestions(elements)
    };
  }
  
  /**
   * 评估实践同一性
   */
  assessPracticalIdentity(context) {
    let score = 0.5;
    
    if (context.hasClearPracticalIdentities) score += 0.2;
    if (context.hasIdentityCommitment) score += 0.15;
    if (context.hasIdentityReflection) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估原则一致性
   */
  assessPrincipleConsistency(context) {
    let score = 0.5;
    
    if (context.hasClearPrinciples) score += 0.2;
    if (context.hasPrincipleConsistency) score += 0.15;
    if (context.canResolveConflicts) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估自我立法能力
   */
  assessSelfLegislation(context) {
    let score = 0.5;
    
    if (context.hasAutonomousDecisionMaking) score += 0.2;
    if (context.hasSelfImposedNorms) score += 0.15;
    if (context.canReflectOnNorms) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 评估构成性行动
   */
  assessConstitutiveAction(context) {
    let score = 0.5;
    
    if (context.hasConstitutiveActions) score += 0.2;
    if (context.hasActionReflection) score += 0.15;
    if (context.hasActionIntegration) score += 0.15;
    
    return Math.min(score, 1.0);
  }
  
  /**
   * 计算完整性分数
   */
  calculateIntegrity(elements) {
    const values = Object.values(elements);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // 完整性 = 平均分 × 一致性
    const consistency = 1 - (Math.max(...values) - Math.min(...values));
    
    return {
      score: mean * consistency,
      level: mean * consistency > 0.75 ? 'high' : mean * consistency > 0.5 ? 'moderate' : 'low'
    };
  }
  
  /**
   * 获取自我构成建议
   */
  getConstitutionSuggestions(elements) {
    const suggestions = [];
    
    const weakest = Object.keys(elements).reduce((a, b) => elements[a] < elements[b] ? a : b);
    
    switch (weakest) {
      case ConstitutionElements.PRACTICAL_IDENTITY:
        suggestions.push({
          focus: '实践同一性',
          practice: '身份澄清练习',
          technique: '列出你的核心身份（如"朋友"、"专业人士"、"学习者"），反思每个身份的意义',
          duration: '25-35 分钟'
        });
        break;
      case ConstitutionElements.PRINCIPLE_CONSISTENCY:
        suggestions.push({
          focus: '原则一致性',
          practice: '原则检视练习',
          technique: '识别你的核心原则，检查它们之间是否有冲突',
          duration: '30-40 分钟'
        });
        break;
      case ConstitutionElements.SELF_LEGISLATION:
        suggestions.push({
          focus: '自我立法',
          practice: '自主决策反思',
          technique: '反思最近的决策：是出于外部压力还是内在价值？',
          duration: '20-30 分钟'
        });
        break;
      case ConstitutionElements.CONSTITUTIVE_ACTION:
        suggestions.push({
          focus: '构成性行动',
          practice: '行动整合练习',
          technique: '检视你的行动如何构成你的自我——你想成为什么样的人？',
          duration: '25-35 分钟'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 主体间性评估 ============
  
  /**
   * 评估主体间性 (Assess Intersubjectivity)
   * 基于 Husserl 的主体间性理论
   * @param {Object} context - 上下文信息
   * @returns {Object} 主体间性评估结果
   */
  assessIntersubjectivity(context = {}) {
    const dimensions = {
      [IntersubjectivityDimensions.OTHER_AWARENESS]: this.assessOtherAwareness(context),
      [IntersubjectivityDimensions.EMPATHY]: this.assessEmpathy(context),
      [IntersubjectivityDimensions.SHARED_EXPERIENCE]: this.assessSharedExperience(context),
      [IntersubjectivityDimensions.SOCIAL_WORLD]: this.assessSocialWorld(context)
    };
    
    return {
      dimensions,
      overall: Object.values(dimensions).reduce((a, b) => a + b, 0) / 4,
      profile: this.generateIntersubjectivityProfile(dimensions),
      suggestions: this.getIntersubjectivitySuggestions(dimensions)
    };
  }
  
  assessOtherAwareness(context) {
    let score = 0.5;
    if (context.hasOtherConsciousness) score += 0.2;
    if (context.recognizesOtherSubjectivity) score += 0.15;
    if (context.hasPerspectiveTaking) score += 0.15;
    return Math.min(score, 1.0);
  }
  
  assessEmpathy(context) {
    let score = 0.5;
    if (context.hasCognitiveEmpathy) score += 0.1;
    if (context.hasEmotionalEmpathy) score += 0.1;
    if (context.hasCompassionateResponse) score += 0.1;
    if (context.hasEmpathicAccuracy) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  assessSharedExperience(context) {
    let score = 0.5;
    if (context.hasSharedAttention) score += 0.15;
    if (context.hasSharedEmotion) score += 0.15;
    if (context.hasSharedIntention) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  assessSocialWorld(context) {
    let score = 0.5;
    if (context.hasSocialEngagement) score += 0.15;
    if (context.hasCommunityBelonging) score += 0.15;
    if (context.hasSocialResponsibility) score += 0.1;
    return Math.min(score, 1.0);
  }
  
  generateIntersubjectivityProfile(dimensions) {
    const dominant = Object.keys(dimensions).reduce((a, b) => dimensions[a] > dimensions[b] ? a : b);
    return {
      dominant,
      dominantName: this.getIntersubjectivityDimensionName(dominant),
      balance: this.calculateIntersubjectivityBalance(dimensions)
    };
  }
  
  getIntersubjectivityDimensionName(dimension) {
    const names = {
      [IntersubjectivityDimensions.OTHER_AWARENESS]: '他者意识',
      [IntersubjectivityDimensions.EMPATHY]: '共情能力',
      [IntersubjectivityDimensions.SHARED_EXPERIENCE]: '共享体验',
      [IntersubjectivityDimensions.SOCIAL_WORLD]: '社会世界参与'
    };
    return names[dimension] || '未知';
  }
  
  calculateIntersubjectivityBalance(dimensions) {
    const values = Object.values(dimensions);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      score: Math.max(0, 1 - stdDev * 2),
      level: stdDev < 0.15 ? 'balanced' : stdDev < 0.25 ? 'moderate' : 'imbalanced'
    };
  }
  
  getIntersubjectivitySuggestions(dimensions) {
    const suggestions = [];
    const weakest = Object.keys(dimensions).reduce((a, b) => dimensions[a] < dimensions[b] ? a : b);
    
    switch (weakest) {
      case IntersubjectivityDimensions.OTHER_AWARENESS:
        suggestions.push({
          focus: '他者意识',
          practice: '他者视角练习',
          technique: '尝试从他人的角度看世界——他者的体验是什么样的？',
          duration: '15-20 分钟'
        });
        break;
      case IntersubjectivityDimensions.EMPATHY:
        suggestions.push({
          focus: '共情能力',
          practice: '共情倾听练习',
          technique: '专注倾听他人，不评判，尝试感受对方的感受',
          duration: '20-30 分钟'
        });
        break;
      case IntersubjectivityDimensions.SHARED_EXPERIENCE:
        suggestions.push({
          focus: '共享体验',
          practice: '共同活动参与',
          technique: '参与需要协作的活动，培养"我们"的体验',
          duration: '30-60 分钟'
        });
        break;
      case IntersubjectivityDimensions.SOCIAL_WORLD:
        suggestions.push({
          focus: '社会世界参与',
          practice: '社区参与练习',
          technique: '参与社区活动，培养归属感和责任感',
          duration: '定期参与'
        });
        break;
    }
    
    return suggestions;
  }
  
  // ============ 现象学干预练习 ============
  
  /**
   * 最小自我觉察练习 (Minimal Self Awareness Exercise)
   * 基于 Zahavi 的前反思自我意识理论
   */
  minimalSelfAwarenessExercise() {
    return {
      name: '最小自我觉察练习',
      duration: '10-15 分钟',
      theoreticalBasis: 'Zahavi (2005) + Sartre (1943) + Phenomenology of Self-Consciousness',
      description: '培养对前反思自我意识的觉察——那种非对象化的、直接的自我在场感',
      phases: [
        {
          name: '准备',
          duration: '2 分钟',
          instruction: '找一个安静的地方坐下，调整呼吸，让身体放松。不要试图改变什么，只是准备觉察。'
        },
        {
          name: '体验流动',
          duration: '3 分钟',
          instruction: '让体验自然流动。注意声音、身体感受、思绪的来去。关键是：不要把这些体验当作"对象"来观察，而是让它们自然地"被经历"。',
          prompt: '注意：在你意识到声音之前，声音已经被听到了。这种"已经被听到"的感觉就是前反思意识。'
        },
        {
          name: '前反思觉察',
          duration: '5 分钟',
          instruction: '尝试觉察那个"正在经历"的维度。不是"我在经历什么"（这是反思），而是"正在经历"本身。这是一种非对象化的觉察。',
          prompts: [
            '在你思考"我"之前，已经有一个"我"在那里经历着',
            '注意体验的"为我性" (for-me-ness)——体验总是为某人的体验',
            '这种"为我性"不需要思考，它是直接的、前反思的'
          ]
        },
        {
          name: '反思对比',
          duration: '3 分钟',
          instruction: '现在切换到反思模式：把自我作为对象来思考 ("我是谁"、"我在做什么")。对比前反思和反思两种模式的差异。',
          reflection: '前反思：直接的、非对象化的、始终在场\n反思：间接的、对象化的、需要努力'
        },
        {
          name: '整合',
          duration: '2 分钟',
          instruction: '回到自然状态。理解前反思意识是反思的基础——你总是已经在那里，才能反思自己。'
        }
      ],
      keyInsights: [
        '前反思自我意识不是通过内省获得的，它是体验的内在结构',
        '它是"最小自我" (minimal self) 的基础——不需要叙事或记忆的自我感',
        '前反思意识始终在场，但通常被忽视，因为我们专注于体验的内容而非体验本身'
      ],
      expectedOutcomes: [
        '增强对前反思自我在场的觉察',
        '区分前反思与反思自我意识',
        '培养对体验"为我性"的敏感度'
      ]
    };
  }
  
  /**
   * 第一人称视角深化练习 (First-Person Perspective Deepening)
   */
  firstPersonPerspectiveDeepening() {
    return {
      name: '第一人称视角深化练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Zahavi (Subjectivity) + Henry (Material Phenomenology)',
      description: '深化对第一人称主体性的体验，增强"为我性"的觉察',
      phases: [
        {
          name: '主体性觉察',
          duration: '5 分钟',
          instruction: '注意当前的体验。问自己："这个体验对谁呈现？"答案不是通过思考获得的，而是直接给予的——对你。',
          prompt: '体验的"为我性"不是添加上去的，它是体验本身的内在结构。'
        },
        {
          name: "给定性探索",
          duration: '5 分钟',
          instruction: '注意体验是如何"给予"你的。它不是被推断的，不是被建构的，而是直接被给予的。',
          prompts: [
            '疼痛是如何给予你的？直接地。',
            '颜色是如何给予你的？直接地。',
            '情绪是如何给予你的？直接地。'
          ]
        },
        {
          name: '透明性觉察',
          duration: '5 分钟',
          instruction: '注意当你尝试"看向"自己的意识时会发生什么。你看到的是世界，而不是意识本身。这就是透明性。',
          reflection: '意识是透明的——你通过它看到世界，但它本身不可见。'
        },
        {
          name: '整合',
          duration: '3-5 分钟',
          instruction: '理解主体性、给定性、透明性是同一现象的三个维度——第一人称体验的结构。'
        }
      ],
      keyInsights: [
        '主体性不是体验的附加属性，而是体验的存在方式',
        '给定性意味着体验不需要中介——它是直接的',
        '透明性解释了为什么自我知识不是通过内省观察获得的'
      ]
    };
  }
  
  /**
   * 自我构成反思练习 (Self-Constitution Reflection)
   * 基于 Korsgaard 的自我构成理论
   */
  selfConstitutionReflection() {
    return {
      name: '自我构成反思练习',
      duration: '25-35 分钟',
      theoreticalBasis: 'Korsgaard (2009) Self-Constitution',
      description: '反思你的行动如何构成你的自我——你想成为什么样的人？',
      phases: [
        {
          name: '实践同一性识别',
          duration: '8 分钟',
          instruction: '列出你的核心实践同一性（如"朋友"、"专业人士"、"学习者"、"家人"）。对每个同一性，问："这个同一性对我意味着什么？"',
          prompts: [
            '作为朋友，我承诺什么？',
            '作为专业人士，我坚持什么原则？',
            '作为学习者，我追求什么价值？'
          ]
        },
        {
          name: '原则一致性检查',
          duration: '8 分钟',
          instruction: '检视你的原则之间是否有冲突。如果有，如何协调？',
          reflection: '原则冲突不是问题，而是反思和整合的机会。'
        },
        {
          name: '行动 - 自我对齐',
          duration: '8 分钟',
          instruction: '回顾最近的行动：这些行动如何构成你的自我？它们与你想要的自我一致吗？',
          prompts: [
            '这个行动表达了什么样的自我？',
            '我想通过行动成为什么样的人？',
            '行动与理想自我之间有什么差距？'
          ]
        },
        {
          name: '自我立法',
          duration: '5-7 分钟',
          instruction: '基于反思，为自己立下一条原则或承诺。这是你主动选择的，不是外部强加的。',
          reflection: '自我立法是自我构成的核心——通过主动承诺，你构成自己。'
        }
      ],
      keyInsights: [
        '行动不只是"做"什么，它们构成"是"什么',
        '自我不是预先存在的实体，而是通过行动持续构成的过程',
        '完整性来自行动与原则的一致性'
      ]
    };
  }
  
  /**
   * 他者承认练习 (Other Recognition Exercise)
   * 基于 Hegel 和 Honneth 的承认理论
   */
  otherRecognitionExercise() {
    return {
      name: '他者承认练习',
      duration: '20-30 分钟',
      theoreticalBasis: 'Hegel (1807) + Honneth (1992) + Recognition Theory',
      description: '深化对他者的承认，培养社会自我意识',
      phases: [
        {
          name: '他者主体性觉察',
          duration: '5 分钟',
          instruction: '想一个你最近互动的人。尝试理解：他/她也是一个主体，有自己的体验、欲望、恐惧。',
          prompt: '他者的体验对我来说是" inaccessible"的，但我可以承认它的存在。'
        },
        {
          name: '承认形式反思',
          duration: '8 分钟',
          instruction: '反思你如何承认他者：',
          prompts: [
            '情感关怀 (Love): 你如何表达对他人的关心？',
            '权利承认 (Rights): 你如何尊重他人的权利和尊严？',
            '团结承认 (Solidarity): 你如何认可他人的价值和贡献？'
          ]
        },
        {
          name: '承认斗争识别',
          duration: '7 分钟',
          instruction: '识别你经历过的承认斗争——什么时候你感到被忽视、被贬低、被不公正对待？',
          reflection: '承认斗争不是弱点，而是对正当承认的诉求。'
        },
        {
          name: '承认实践',
          duration: '5-10 分钟',
          instruction: '选择一个你将在今天实践的承认行动——主动承认某人的价值、尊严或贡献。',
          commitment: '承认他者也是构成自我的一部分——通过承认，我们成为更完整的自己。'
        }
      ],
      keyInsights: [
        '自我意识依赖于他者承认——没有他者，就没有自我',
        '承认有三种形式：情感关怀、权利承认、团结承认',
        '承认斗争是道德进步的动力'
      ]
    };
  }
  
  /**
   * 叙事整合写作练习 (Narrative Integration Writing)
   * 基于 Dennett 和 Schechtman 的叙事自我理论
   */
  narrativeIntegrationWriting() {
    return {
      name: '叙事整合写作练习',
      duration: '40-50 分钟',
      theoreticalBasis: 'Dennett (1991) + Schechtman (2011) + Narrative Self Theory',
      description: '通过写作整合你的生命故事，培养叙事自我意识',
      phases: [
        {
          name: '生命章节划分',
          duration: '10 分钟',
          instruction: '将你的生命划分为几个章节（如"童年"、"学生时代"、"职业生涯"等）。给每个章节一个标题。',
          prompts: ['每个章节的主题是什么？', '什么事件标志着一个章节的结束和另一个的开始？']
        },
        {
          name: '关键事件识别',
          duration: '10 分钟',
          instruction: '在每个章节中，识别 2-3 个关键事件。这些事件如何塑造了你？',
          prompts: ['这个事件如何改变了我？', '我从中学到了什么？']
        },
        {
          name: '救赎/污染序列识别',
          duration: '10 分钟',
          instruction: '识别你生命中的救赎序列（负面事件导致正面结果）和污染序列（正面事件导致负面结果）。',
          reflection: '救赎序列培养希望，污染序列培养警惕。'
        },
        {
          name: '主题整合',
          duration: '10-15 分钟',
          instruction: '识别贯穿你生命的主题。什么价值、欲望、追求一直存在？这些主题如何连接你的过去、现在和未来？',
          prompts: ['什么一直对我重要？', '我想让我的生命故事表达什么？']
        }
      ],
      keyInsights: [
        '自我是一个故事——你既是作者也是主角',
        '叙事整合不是歪曲事实，而是发现意义',
        '救赎序列与幸福感正相关 (McAdams 研究)'
      ]
    };
  }
  
  /**
   * 现象学还原练习 (Phenomenological Reduction Exercise)
   * 基于 Husserl 的现象学方法
   */
  phenomenologicalReductionExercise() {
    return {
      name: '现象学还原练习',
      duration: '20-30 分钟',
      theoreticalBasis: 'Husserl (1913) Ideas I + Phenomenological Reduction',
      description: '练习现象学还原——悬置判断，回到纯粹体验',
      phases: [
        {
          name: '自然态度觉察',
          duration: '3 分钟',
          instruction: '注意你当前的"自然态度"——你对世界存在的默认信念。',
          prompt: '你默认相信世界存在、他人存在、过去发生的事是真实的。'
        },
        {
          name: '悬置 (Epoché)',
          duration: '7 分钟',
          instruction: '悬置这些信念。不是否定它们，而是把它们"放入括号"，暂时不使用它们。',
          prompts: [
            '世界存在吗？悬置这个问题。',
            '他人有意识吗？悬置这个问题。',
            '只关注体验本身，不关注体验之外的东西。'
          ]
        },
        {
          name: '本质直观',
          duration: '7 分钟',
          instruction: '在悬置之后，注意体验的本质结构。什么是这个体验不可或缺的？',
          prompts: [
            '这个体验的必要条件是什么？',
            '如果去掉 X，它还是这个体验吗？'
          ]
        },
        {
          name: '先验还原',
          duration: '5-8 分钟',
          instruction: '回到纯粹意识领域。注意体验总是"为某人"的体验——这就是先验主体性。',
          reflection: '先验主体性不是世界中的一个对象，而是世界得以呈现的条件。'
        }
      ],
      keyInsights: [
        '现象学还原不是否定世界，而是改变看待世界的方式',
        '悬置让我们看到体验的结构，而不是体验的内容',
        '先验主体性是所有体验的前提条件'
      ]
    };
  }
  
  /**
   * 主体间对话练习 (Intersubjective Dialogue Exercise)
   * 基于 Husserl 的主体间性理论
   */
  intersubjectiveDialogueExercise() {
    return {
      name: '主体间对话练习',
      duration: '30-40 分钟 (需两人)',
      theoreticalBasis: 'Husserl (1929) + Merleau-Ponty (1945) + Intersubjectivity Theory',
      description: '通过深度对话培养主体间意识',
      phases: [
        {
          name: '准备',
          duration: '3 分钟',
          instruction: '与伙伴坐在一起，调整呼吸，建立连接。同意以下规则：专注倾听、不评判、真诚回应。'
        },
        {
          name: '体验分享',
          duration: '10 分钟',
          instruction: '轮流分享当前的体验。说话者用第一人称描述，倾听者专注倾听，不打断。',
          prompts: ['此刻我的体验是...', '我注意到...', '我感到...']
        },
        {
          name: '视角交换',
          duration: '10 分钟',
          instruction: '倾听者尝试复述说话者的体验，然后分享："从你的角度看，这个体验是什么样的？"',
          reflection: '这不是猜测，而是尝试理解他者的主体性。'
        },
        {
          name: '共享体验探索',
          duration: '7-10 分钟',
          instruction: '探索你们之间的共享体验——什么体验是共同的？什么体验是独特的？',
          prompts: [
            '我们共享什么体验？',
            '我们的体验有什么不同？',
            '这些差异如何丰富我们的理解？'
          ]
        },
        {
          name: '整合',
          duration: '5 分钟',
          instruction: '反思这次对话如何改变了你对他者和自己的理解。'
        }
      ],
      keyInsights: [
        '主体间性不是两个独立主体的连接，而是原初的共享',
        '他者不是问题，而是可能性——通过他者，我更深入地理解自己',
        '对话不是信息交换，而是主体间的共同探索'
      ]
    };
  }
  
  /**
   * 自我距离调节练习 (Self-Distance Regulation Exercise)
   * 平衡沉浸与反思
   */
  selfDistanceRegulationExercise() {
    return {
      name: '自我距离调节练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Phenomenology + Metacognition + Self-Distance Research',
      description: '学习调节自我距离——平衡沉浸体验与反思观察',
      phases: [
        {
          name: '沉浸模式',
          duration: '5 分钟',
          instruction: '完全沉浸在当前体验中。不反思，不评判，只是经历。',
          prompt: '让体验流过你，不要试图抓住它或改变它。'
        },
        {
          name: '反思模式',
          duration: '5 分钟',
          instruction: '切换到反思模式。退后一步，观察自己的体验。问："我现在在经历什么？"',
          prompt: '注意体验的内容和体验的方式。'
        },
        {
          name: '距离调节',
          duration: '5 分钟',
          instruction: '练习在沉浸和反思之间切换。注意两种模式的差异和各自的价值。',
          reflection: '沉浸带来丰富性，反思带来清晰度。两者都需要。'
        },
        {
          name: '整合',
          duration: '3-5 分钟',
          instruction: '找到适合当前情境的距离——有时需要沉浸，有时需要反思。',
          prompts: [
            '当前情境需要什么距离？',
            '我如何灵活调节距离？'
          ]
        }
      ],
      keyInsights: [
        '自我距离不是固定的，而是可以调节的',
        '过度沉浸导致失去视角，过度反思导致失去体验',
        '灵活性是心理健康的关键'
      ]
    };
  }
  
  // ============ 状态报告 ============
  
  /**
   * 获取模块状态报告
   */
  getStatusReport() {
    return {
      selfLevel: this.selfLevelState,
      givenness: this.givennessState,
      constitution: this.constitutionState,
      intersubjectivity: this.intersubjectivityState,
      recognition: this.recognitionState,
      exerciseCount: this.exerciseHistory.length,
      lastExercise: this.exerciseHistory[this.exerciseHistory.length - 1] || null
    };
  }
  
  /**
   * 记录练习完成
   */
  recordExercise(exerciseName, completed = true) {
    if (completed) {
      this.exerciseHistory.push({
        name: exerciseName,
        completedAt: new Date().toISOString()
      });
    }
  }
}

// ============ 导出 ============

module.exports = {
  SelfConsciousnessPhenomenologyEnhanced,
  SelfLevels,
  GivennessDimensions,
  GivennessModes,
  ConstitutionElements,
  IntersubjectivityDimensions,
  RecognitionForms
};
