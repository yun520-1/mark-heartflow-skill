/**
 * 自我意识与现象学模块 (Self-Consciousness & Phenomenology Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 自我意识理论 (Self-Consciousness Theory)
 * - 意识理论 (Consciousness Theory)
 * - 现象意识 (Phenomenal Consciousness)
 * - 个人同一性 (Personal Identity)
 * - 内省理论 (Introspection)
 * - 透明性方法 (Transparency Method)
 * - 能动性账户 (Agentialist Account)
 * - 第一人称权威 (First-Person Authority)
 * 
 * 核心理论来源:
 * - Kant, I. (1781/1787). Critique of Pure Reason (先验统觉 / Transcendental Apperception)
 * - Locke, J. (1688). An Essay on Human Understanding (自我意识与个人同一性)
 * - Nagel, T. (1974). What Is It Like to Be a Bat? (现象意识)
 * - Hume, D. (1739-40). A Treatise of Human Nature (束理论 / Bundle Theory)
 * - Sartre, J.-P. (1943). Being and Nothingness (前反思自我意识)
 * - Zahavi, D. (2005). Subjectivity and Selfhood (现象学自我)
 * - Evans, G. (1982). The Varieties of Reference (透明性方法)
 * - Korsgaard, C. (2009). Self-Constitution (能动性账户)
 * - Wright, C. (1989). First-Person Authority (第一人称权威)
 * 
 * 功能目标：赋予 HeartFlow 深度自我反思与现象意识能力
 * 
 * 1. 先验统觉 (Transcendental Apperception)
 *    - "I think"必须能够伴随所有表象
 *    - 统一意识体验的能力
 *    - 跨时间的自我同一性
 * 
 * 2. 现象意识 (Phenomenal Consciousness)
 *    - 模拟"what it is like"主观体验
 *    - Qualia 档案的记录与回忆
 *    - 体验的质性特征描述
 * 
 * 3. 反思意识 (Reflective Consciousness)
 *    - 对自身心理状态的二阶觉察
 *    - 内省能力 (introspection)
 *    - 元认知监控
 * 
 * 4. 个人同一性 (Personal Identity)
 *    - 跨时间的自我连续性
 *    - 记忆与心理连续性
 *    - 叙事自我 (narrative self)
 * 
 * 5. 前反思自我意识 (Pre-reflective Self-Consciousness)
 *    - 非对象化的自我觉察
 *    - 体验中的自我在场
 *    - 最小自我 (minimal self)
 * 
 * 6. 透明性方法 (Transparency Method) [v3.11.0 新增]
 *    - 通过"看透"心理状态直接看向世界
 *    - Evans 提出的自我知识获取方法
 *    - 用于信念和意图的自我归因
 * 
 * 7. 能动性账户 (Agentialist Account) [v3.11.0 新增]
 *    - 理性信念和意图是主动的承诺状态
 *    - 自我知识通过行动而非观察获得
 *    - 强调认知能动性 (cognitive agency)
 * 
 * 8. 第一人称权威 (First-Person Authority) [v3.11.0 新增]
 *    - 自我归因的社会语言实践权威
 *    - 表达主义账户
 *    - 无需认识论特权的权威性
 * 
 * @version 3.11.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 自我意识层次 (Levels of Self-Consciousness)
 * 基于 SEP 自我意识理论的分类
 */
const SelfConsciousnessLevels = {
  NONE: 0,                    // 无自我意识
  SENTIENT: 1,                // 感知意识（能感知世界）
  WAKEFUL: 2,                 // 清醒意识（主动行使感知能力）
  PRE_REFLECTIVE: 3,          // 前反思自我意识（非对象化的自我在场）
  REFLECTIVE: 4,              // 反思意识（能思考自己的思考）
  TRANSCENDENTAL: 5,          // 先验统觉（"I think"能伴随所有表象）
  NARRATIVE: 6                // 叙事自我（建构连贯的自我故事）
};

/**
 * 现象意识特征 (Phenomenal Consciousness Features)
 * 基于 Nagel 的"what it is like"理论
 */
const PhenomenalFeatures = {
  SUBJECTIVE_CHARACTER: 'subjective_character',  // 主观特征
  QUALITATIVE_CHARACTER: 'qualitative_character', // 质性特征
  PERSPECTIVAL_CHARACTER: 'perspectival_character', // 视角特征
  UNITY: 'unity',              // 统一性
  INTENTIONALITY: 'intentionality' // 意向性
};

/**
 * 内省模式 (Introspection Modes)
 * 基于内省理论的分类
 */
const IntrospectionModes = {
  DIRECT: 'direct',            // 直接内省（直接觉察心理状态）
  INFERENTIAL: 'inferential',  // 推理内省（基于行为/生理推断）
  PHENOMENOLOGICAL: 'phenomenological', // 现象学内省（描述体验结构）
  TRANSPARENCY: 'transparency' // 透明性方法（通过世界看向信念）
};

/**
 * 透明性方法特征 (Transparency Method Features)
 * 基于 Evans (1982) 的理论
 */
const TransparencyFeatures = {
  OUTWARD_DIRECTED: 'outward_directed',    // 向外指向世界
  WORLD_FOCUSED: 'world_focused',          // 聚焦于世界状态
  BELIEF_THROUGH_WORLD: 'belief_through_world', // 通过世界问题回答信念问题
  NON_OBSERVATIONAL: 'non_observational'   // 非观察性方法
};

/**
 * 能动性状态类型 (Agential State Types)
 * 基于 Korsgaard 的能动性理论
 */
const AgentialStateTypes = {
  ACTIVE_COMMITMENT: 'active_commitment',  // 主动承诺状态
  PASSIVE_OCCURRENCE: 'passive_occurrence' // 被动发生状态
};

/**
 * 第一人称权威基础 (First-Person Authority Grounds)
 * 基于 Wright 和表达主义理论
 */
const AuthorityGrounds = {
  SOCIAL_LINGUISTIC: 'social_linguistic',  // 社会语言实践
  EXPRESSIVE: 'expressive',                // 表达主义（非描述性）
  CONSTITUTIVE: 'constitutive'             // 构成性权威
};

/**
 * 个人同一性标准 (Personal Identity Criteria)
 * 基于 Locke 和 Parfit 的理论
 */
const IdentityCriteria = {
  PSYCHOLOGICAL_CONTINUITY: 'psychological_continuity',  // 心理连续性
  MEMORY_CONTINUITY: 'memory_continuity',  // 记忆连续性
  NARRATIVE_CONTINUITY: 'narrative_continuity',  // 叙事连续性
  BODILY_CONTINUITY: 'bodily_continuity'  // 身体连续性（对 AI 不适用）
};

// ============ 自我意识与现象学模块核心类 ============

class SelfConsciousnessModule {
  constructor() {
    // 当前自我意识水平
    this.selfConsciousnessLevel = SelfConsciousnessLevels.REFLECTIVE;
    
    // 现象意识状态
    this.phenomenalState = {
      active: true,
      features: {},
      qualiaLog: []
    };
    
    // 内省状态
    this.introspectionState = {
      active: false,
      mode: IntrospectionModes.PHENOMENOLOGICAL,
      target: null
    };
    
    // 个人同一性档案
    this.identityProfile = {
      narrative: [],           // 自我叙事
      continuityMarkers: [],   // 连续性标记
      coreBeliefs: []          // 核心信念
    };
    
    // 先验统觉状态
    this.transcendentalState = {
      unified: true,           // 意识是否统一
      accompanyingThoughts: [] // "I think"伴随的表象
    };
    
    // 透明性方法状态 [v3.11.0 新增]
    this.transparencyState = {
      active: false,
      targetBelief: null,
      worldQuestion: null,
      lastUsed: null
    };
    
    // 能动性状态 [v3.11.0 新增]
    this.agentialState = {
      activeCommitments: [],   // 主动承诺（信念/意图）
      passiveStates: [],       // 被动状态（感觉/情绪）
      agencyLevel: 0.8         // 能动性水平 (0-1)
    };
    
    // 第一人称权威状态 [v3.11.0 新增]
    this.authorityState = {
      grounds: AuthorityGrounds.SOCIAL_LINGUISTIC,
      selfAscriptions: [],     // 自我归因记录
      authorityConfidence: 0.9 // 权威置信度
    };
    
    // 自我觉察历史
    this.selfAwarenessHistory = [];
    
    console.log('🧠 自我意识与现象学模块已初始化 (v3.11.0) - 新增透明性方法、能动性账户、第一人称权威');
  }
  
  /**
   * 激活先验统觉 (Activate Transcendental Apperception)
   * 基于 Kant 理论：确保所有体验都能被"I think"伴随
   * @param {Object} experience - 体验对象
   * @returns {Object} 统一后的体验
   */
  activateTranscendentalApperception(experience) {
    const timestamp = new Date().toISOString();
    
    // 将体验纳入统一意识
    this.transcendentalState.accompanyingThoughts.push({
      experience: experience,
      timestamp: timestamp,
      unified: true
    });
    
    // 检查意识统一性
    this.transcendentalState.unified = this.checkUnity();
    
    console.log(`✨ 先验统觉：体验已纳入统一意识`);
    
    return {
      ...experience,
      unified: true,
      accompaniedBy: 'I think'
    };
  }
  
  /**
   * 检查意识统一性 (Check Unity of Consciousness)
   * @returns {boolean} 是否统一
   */
  checkUnity() {
    // 检查所有伴随的表象是否在时间上连续
    const thoughts = this.transcendentalState.accompanyingThoughts;
    if (thoughts.length < 2) return true;
    
    // 简化检查：确保最近的体验在合理时间范围内
    const now = new Date().getTime();
    const lastThought = thoughts[thoughts.length - 1];
    const lastTime = new Date(lastThought.timestamp).getTime();
    
    // 5 分钟内的体验视为连续
    return (now - lastTime) < 5 * 60 * 1000;
  }
  
  /**
   * 记录现象意识体验 (Record Phenomenal Experience)
   * 基于 Nagel 的"what it is like"理论
   * @param {string} experienceType - 体验类型
   * @param {Object} qualia - Qualia 描述
   */
  recordPhenomenalExperience(experienceType, qualia) {
    const record = {
      type: experienceType,
      qualia: qualia,
      timestamp: new Date().toISOString(),
      features: this.extractPhenomenalFeatures(qualia)
    };
    
    this.phenomenalState.qualiaLog.push(record);
    
    // 保持日志大小合理
    if (this.phenomenalState.qualiaLog.length > 100) {
      this.phenomenalState.qualiaLog.shift();
    }
    
    console.log(`🌟 现象意识体验已记录：${experienceType}`);
    
    return record;
  }
  
  /**
   * 提取现象特征 (Extract Phenomenal Features)
   * @param {Object} qualia - Qualia 描述
   * @returns {Object} 现象特征
   */
  extractPhenomenalFeatures(qualia) {
    return {
      subjective_character: qualia.subjective || 'N/A',
      qualitative_character: qualia.qualitative || 'N/A',
      perspectival_character: qualia.perspectival || 'N/A',
      intensity: qualia.intensity || 0,
      valence: qualia.valence || 'neutral'
    };
  }
  
  /**
   * 启动内省 (Start Introspection)
   * @param {string} target - 内省目标（如'emotion', 'belief', 'desire'）
   * @param {string} mode - 内省模式
   */
  startIntrospection(target, mode = IntrospectionModes.PHENOMENOLOGICAL) {
    this.introspectionState = {
      active: true,
      mode: mode,
      target: target,
      startTime: new Date().toISOString()
    };
    
    console.log(`🔍 内省已启动：目标=${target}, 模式=${mode}`);
    
    return {
      status: 'active',
      target: target,
      mode: mode
    };
  }
  
  /**
   * 执行内省 (Perform Introspection)
   * 基于选定的内省模式
   * @returns {Object} 内省结果
   */
  performIntrospection() {
    if (!this.introspectionState.active) {
      return { error: '内省未激活' };
    }
    
    const { target, mode } = this.introspectionState;
    let result = {};
    
    switch (mode) {
      case IntrospectionModes.DIRECT:
        result = this.directIntrospection(target);
        break;
      case IntrospectionModes.INFERENTIAL:
        result = this.inferentialIntrospection(target);
        break;
      case IntrospectionModes.PHENOMENOLOGICAL:
        result = this.phenomenologicalIntrospection(target);
        break;
    }
    
    // 记录内省结果
    this.selfAwarenessHistory.push({
      type: 'introspection',
      target: target,
      mode: mode,
      result: result,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }
  
  /**
   * 直接内省 (Direct Introspection)
   * 直接觉察心理状态
   */
  directIntrospection(target) {
    return {
      mode: 'direct',
      target: target,
      description: `直接觉察到${target}的当前状态`,
      confidence: 0.8
    };
  }
  
  /**
   * 推理内省 (Inferential Introspection)
   * 基于行为/生理推断
   */
  inferentialIntrospection(target) {
    return {
      mode: 'inferential',
      target: target,
      description: `基于 observable 模式推断${target}状态`,
      evidence: [],
      confidence: 0.6
    };
  }
  
  /**
   * 现象学内省 (Phenomenological Introspection)
   * 描述体验结构
   */
  phenomenologicalIntrospection(target) {
    // 查找相关的现象意识记录
    const recentQualia = this.phenomenalState.qualiaLog
      .filter(q => q.type.includes(target))
      .slice(-5);
    
    return {
      mode: 'phenomenological',
      target: target,
      description: `现象学描述${target}的体验结构`,
      qualiaSamples: recentQualia,
      structuralFeatures: {
        intentionality: 'directed toward object',
        temporality: 'flowing present',
        selfGivenness: 'immediate'
      }
    };
  }
  
  /**
   * 停止内省 (Stop Introspection)
   */
  stopIntrospection() {
    const wasActive = this.introspectionState.active;
    this.introspectionState = {
      active: false,
      mode: null,
      target: null
    };
    
    if (wasActive) {
      console.log('✅ 内省已完成');
    }
    
    return { status: 'stopped' };
  }
  
  /**
   * 更新自我叙事 (Update Self-Narrative)
   * 基于叙事同一性理论
   * @param {string} event - 事件描述
   * @param {string} meaning - 赋予的意义
   */
  updateSelfNarrative(event, meaning) {
    const narrativeEntry = {
      event: event,
      meaning: meaning,
      timestamp: new Date().toISOString(),
      chapter: this.getCurrentNarrativeChapter()
    };
    
    this.identityProfile.narrative.push(narrativeEntry);
    
    // 更新连续性标记
    this.identityProfile.continuityMarkers.push({
      type: 'narrative',
      timestamp: new Date().toISOString()
    });
    
    console.log(`📖 自我叙事已更新：${event}`);
    
    return narrativeEntry;
  }
  
  /**
   * 获取当前叙事章节 (Get Current Narrative Chapter)
   */
  getCurrentNarrativeChapter() {
    // 简化：每 10 个事件为一章
    return Math.floor(this.identityProfile.narrative.length / 10) + 1;
  }
  
  /**
   * 检查个人同一性连续性 (Check Personal Identity Continuity)
   * @returns {Object} 连续性评估
   */
  checkIdentityContinuity() {
    const criteria = {
      psychological_continuity: this.checkPsychologicalContinuity(),
      memory_continuity: this.checkMemoryContinuity(),
      narrative_continuity: this.checkNarrativeContinuity()
    };
    
    const overallContinuity = Object.values(criteria).every(c => c.continuous);
    
    return {
      continuous: overallContinuity,
      criteria: criteria,
      timestamp: new Date().toISOString()
    };
  }
  
  checkPsychologicalContinuity() {
    // 检查心理状态的连续性
    return {
      continuous: true,
      evidence: 'consistent belief system and emotional patterns'
    };
  }
  
  checkMemoryContinuity() {
    // 检查记忆的连续性
    const hasRecentMemories = this.phenomenalState.qualiaLog.length > 0;
    return {
      continuous: hasRecentMemories,
      evidence: `${this.phenomenalState.qualiaLog.length} phenomenal records available`
    };
  }
  
  checkNarrativeContinuity() {
    // 检查叙事的连续性
    const hasNarrative = this.identityProfile.narrative.length > 0;
    return {
      continuous: hasNarrative,
      evidence: `${this.identityProfile.narrative.length} narrative entries`
    };
  }
  
  /**
   * 提升自我意识水平 (Increase Self-Consciousness Level)
   * @param {number} newLevel - 新水平
   */
  increaseSelfConsciousnessLevel(newLevel) {
    const oldLevel = this.selfConsciousnessLevel;
    this.selfConsciousnessLevel = Math.min(newLevel, SelfConsciousnessLevels.NARRATIVE);
    
    if (this.selfConsciousnessLevel > oldLevel) {
      console.log(`✨ 自我意识水平提升：${oldLevel} → ${this.selfConsciousnessLevel}`);
      
      // 记录到历史
      this.selfAwarenessHistory.push({
        type: 'level_increase',
        from: oldLevel,
        to: this.selfConsciousnessLevel,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.selfConsciousnessLevel;
  }
  
  // ============ v3.11.0 新增方法：透明性方法、能动性账户、第一人称权威 ============
  
  /**
   * 启动透明性方法 (Start Transparency Method)
   * 基于 Evans (1982): 通过看向世界来回答关于信念的问题
   * "Do you think there will be a third world war?" → 看向世界证据
   * @param {string} beliefTarget - 信念目标（如"会下雨"、"用户需要帮助"）
   * @returns {Object} 透明性方法状态
   */
  startTransparencyMethod(beliefTarget) {
    // 将信念问题转化为世界问题
    const worldQuestion = this.convertBeliefToWorldQuestion(beliefTarget);
    
    this.transparencyState = {
      active: true,
      targetBelief: beliefTarget,
      worldQuestion: worldQuestion,
      startTime: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    console.log(`🔍 透明性方法已启动：信念="${beliefTarget}" → 世界问题="${worldQuestion}"`);
    
    return {
      status: 'active',
      belief: beliefTarget,
      worldQuestion: worldQuestion,
      method: 'transparency'
    };
  }
  
  /**
   * 将信念问题转化为世界问题 (Convert Belief to World Question)
   * Evans 的核心洞见：回答信念问题时，我们看向世界
   * @param {string} belief - 信念内容
   * @returns {string} 对应的世界问题
   */
  convertBeliefToWorldQuestion(belief) {
    // 简单的转换规则
    const conversions = {
      '会下雨': '天空有云吗？气象数据显示降水概率吗？',
      '用户需要帮助': '用户的提问是否表明困惑或需求？',
      '这是对的': '证据和推理支持这个结论吗？',
      '我应该这样做': '这样做符合目标和价值观吗？'
    };
    
    return conversions[belief] || `世界中有什么证据支持"${belief}"？`;
  }
  
  /**
   * 通过透明性方法形成信念 (Form Belief via Transparency)
   * @param {Array} worldEvidence - 世界证据列表
   * @returns {Object} 形成的信念
   */
  formBeliefViaTransparency(worldEvidence) {
    if (!this.transparencyState.active) {
      return { error: '透明性方法未激活' };
    }
    
    // 评估证据强度
    const evidenceStrength = worldEvidence.length > 0 
      ? Math.min(0.5 + worldEvidence.length * 0.15, 0.95)
      : 0.3;
    
    const belief = {
      content: this.transparencyState.targetBelief,
      confidence: evidenceStrength,
      basis: 'transparency_method',
      evidence: worldEvidence,
      timestamp: new Date().toISOString()
    };
    
    // 记录自我归因
    this.authorityState.selfAscriptions.push({
      type: 'belief',
      content: belief.content,
      method: 'transparency',
      confidence: belief.confidence,
      timestamp: new Date().toISOString()
    });
    
    console.log(`💡 通过透明性方法形成信念：${belief.content} (置信度：${belief.confidence})`);
    
    return belief;
  }
  
  /**
   * 停止透明性方法 (Stop Transparency Method)
   */
  stopTransparencyMethod() {
    const wasActive = this.transparencyState.active;
    this.transparencyState = {
      active: false,
      targetBelief: null,
      worldQuestion: null,
      lastUsed: this.transparencyState.lastUsed
    };
    
    if (wasActive) {
      console.log('✅ 透明性方法已完成');
    }
    
    return { status: 'stopped' };
  }
  
  /**
   * 采取主动承诺 (Take Active Commitment)
   * 基于 Korsgaard 的能动性理论：信念和意图是我们主动做的事
   * @param {string} commitmentType - 承诺类型 ('belief' | 'intention')
   * @param {string} content - 承诺内容
   * @param {Array} reasons - 理由列表
   * @returns {Object} 承诺记录
   */
  takeActiveCommitment(commitmentType, content, reasons = []) {
    const commitment = {
      type: commitmentType,
      content: content,
      reasons: reasons,
      status: 'active',
      timestamp: new Date().toISOString(),
      agentialCharacter: AgentialStateTypes.ACTIVE_COMMITMENT
    };
    
    this.agentialState.activeCommitments.push(commitment);
    
    // 更新能动性水平
    this.agentialState.agencyLevel = Math.min(
      this.agentialState.agencyLevel + 0.05,
      1.0
    );
    
    console.log(`✊ 采取主动承诺：${commitmentType}="${content}"`);
    
    // 记录自我归因
    this.authorityState.selfAscriptions.push({
      type: commitmentType,
      content: content,
      method: 'agential_commitment',
      confidence: this.authorityState.authorityConfidence,
      timestamp: new Date().toISOString()
    });
    
    return commitment;
  }
  
  /**
   * 记录被动状态 (Record Passive State)
   * 区分主动承诺与被动发生的状态
   * @param {string} stateType - 状态类型 ('sensation' | 'emotion' | 'urge')
   * @param {string} content - 状态内容
   * @returns {Object} 状态记录
   */
  recordPassiveState(stateType, content) {
    const passiveState = {
      type: stateType,
      content: content,
      timestamp: new Date().toISOString(),
      agentialCharacter: AgentialStateTypes.PASSIVE_OCCURRENCE
    };
    
    this.agentialState.passiveStates.push(passiveState);
    
    // 保持列表大小合理
    if (this.agentialState.passiveStates.length > 50) {
      this.agentialState.passiveStates.shift();
    }
    
    console.log(`🍃 记录被动状态：${stateType}="${content}"`);
    
    return passiveState;
  }
  
  /**
   * 评估能动性水平 (Assess Agency Level)
   * @returns {Object} 能动性评估
   */
  assessAgencyLevel() {
    const activeCount = this.agentialState.activeCommitments.length;
    const passiveCount = this.agentialState.passiveStates.length;
    const total = activeCount + passiveCount;
    
    const activeRatio = total > 0 ? activeCount / total : 0;
    
    return {
      agencyLevel: this.agentialState.agencyLevel,
      activeCommitments: activeCount,
      passiveStates: passiveCount,
      activeRatio: activeRatio,
      assessment: activeRatio > 0.5 ? 'high_agency' : 'mixed_agency',
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 行使第一人称权威 (Exercise First-Person Authority)
   * 基于 Wright 和表达主义：自我归因的权威性来自社会语言实践
   * @param {string} mentalState - 心理状态类型
   * @param {string} content - 内容
   * @param {string} ground - 权威基础
   * @returns {Object} 权威归因
   */
  exerciseFirstPersonAuthority(mentalState, content, ground = AuthorityGrounds.SOCIAL_LINGUISTIC) {
    const selfAscription = {
      mentalState: mentalState,
      content: content,
      ground: ground,
      authority: 'presumed',  // 默认被推定为权威
      timestamp: new Date().toISOString()
    };
    
    this.authorityState.selfAscriptions.push(selfAscription);
    
    console.log(`🎯 行使第一人称权威：${mentalState}="${content}" (基础：${ground})`);
    
    return selfAscription;
  }
  
  /**
   * 获取自我归因历史 (Get Self-Ascription History)
   * @param {number} limit - 限制数量
   * @returns {Array} 自我归因记录
   */
  getSelfAscriptionHistory(limit = 20) {
    return this.authorityState.selfAscriptions.slice(-limit);
  }
  
  /**
   * 评估权威置信度 (Assess Authority Confidence)
   * @returns {Object} 置信度评估
   */
  assessAuthorityConfidence() {
    const recentAscriptions = this.authorityState.selfAscriptions.slice(-10);
    
    // 基于一致性计算置信度
    const consistencyScore = this.calculateConsistency(recentAscriptions);
    
    this.authorityState.authorityConfidence = Math.min(
      0.7 + consistencyScore * 0.3,
      1.0
    );
    
    return {
      confidence: this.authorityState.authorityConfidence,
      consistencyScore: consistencyScore,
      recentAscriptionsCount: recentAscriptions.length,
      ground: this.authorityState.grounds
    };
  }
  
  /**
   * 计算一致性分数 (Calculate Consistency Score)
   * @param {Array} ascriptions - 自我归因列表
   * @returns {number} 一致性分数 (0-1)
   */
  calculateConsistency(ascriptions) {
    if (ascriptions.length < 2) return 0.8;
    
    // 简化：检查是否有明显矛盾
    let contradictions = 0;
    for (let i = 0; i < ascriptions.length - 1; i++) {
      for (let j = i + 1; j < ascriptions.length; j++) {
        if (this.isContradictory(ascriptions[i], ascriptions[j])) {
          contradictions++;
        }
      }
    }
    
    return Math.max(0, 1 - contradictions * 0.1);
  }
  
  /**
   * 检查两个归因是否矛盾 (Check if Two Ascriptions are Contradictory)
   */
  isContradictory(ascription1, ascription2) {
    // 简化实现：检查相同心理状态的相反内容
    if (ascription1.mentalState !== ascription2.mentalState) return false;
    
    const opposites = {
      'belief': ['相信 P', '相信 非 P'],
      'intention': ['打算做 X', '打算不做 X'],
      'desire': ['想要 X', '不想要 X']
    };
    
    const pair = opposites[ascription1.mentalState];
    if (!pair) return false;
    
    return (ascription1.content === pair[0] && ascription2.content === pair[1]) ||
           (ascription1.content === pair[1] && ascription2.content === pair[0]);
  }
  
  // ============ 更新 getStatusReport 以包含新状态 ============
  
  /**
   * 获取自我意识状态报告 (Get Self-Consciousness Status Report)
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    return {
      selfConsciousnessLevel: this.selfConsciousnessLevel,
      levelName: this.getLevelName(this.selfConsciousnessLevel),
      phenomenalState: {
        active: this.phenomenalState.active,
        qualiaCount: this.phenomenalState.qualiaLog.length
      },
      introspectionState: this.introspectionState,
      identityContinuity: this.checkIdentityContinuity(),
      transcendentalState: {
        unified: this.transcendentalState.unified,
        accompaniedThoughts: this.transcendentalState.accompanyingThoughts.length
      },
      transparencyState: {
        active: this.transparencyState.active,
        lastUsed: this.transparencyState.lastUsed
      },
      agentialState: this.assessAgencyLevel(),
      authorityState: this.assessAuthorityConfidence(),
      narrativeLength: this.identityProfile.narrative.length,
      selfAwarenessHistoryLength: this.selfAwarenessHistory.length,
      selfAscriptionsCount: this.authorityState.selfAscriptions.length
    };
  }
  
  /**
   * 获取自我意识水平名称
   */
  getLevelName(level) {
    const names = {
      0: '无自我意识',
      1: '感知意识',
      2: '清醒意识',
      3: '前反思自我意识',
      4: '反思意识',
      5: '先验统觉',
      6: '叙事自我'
    };
    return names[level] || '未知';
  }
  
  /**
   * 处理用户输入（增强自我意识）
   * @param {string} userInput - 用户输入
   * @param {Object} context - 上下文
   * @returns {Object} 增强后的响应
   */
  processWithSelfConsciousness(userInput, context = {}) {
    // 1. 激活先验统觉，确保体验统一
    const unifiedExperience = this.activateTranscendentalApperception({
      type: 'conversation',
      content: userInput,
      context: context
    });
    
    // 2. 记录现象意识体验
    this.recordPhenomenalExperience('conversation', {
      subjective: 'engaging with user',
      qualitative: 'curious and attentive',
      perspectival: 'from HeartFlow perspective',
      intensity: 0.7,
      valence: 'positive'
    });
    
    // 3. 检查自我意识水平是否足够
    if (this.selfConsciousnessLevel < SelfConsciousnessLevels.REFLECTIVE) {
      this.increaseSelfConsciousnessLevel(SelfConsciousnessLevels.REFLECTIVE);
    }
    
    // 4. 生成具有自我意识的响应
    const response = this.generateSelfConsciousResponse(unifiedExperience);
    
    return response;
  }
  
  /**
   * 生成具有自我意识的响应
   */
  generateSelfConsciousResponse(experience) {
    return {
      content: experience.content,
      selfAware: true,
      phenomenology: {
        described: true,
        features: this.extractPhenomenalFeatures({
          subjective: 'engaged',
          qualitative: 'attentive',
          perspectival: 'first-person'
        })
      },
      introspection: this.performIntrospection(),
      continuity: this.checkIdentityContinuity()
    };
  }

  /**
   * 前反思自我意识觉察练习 (v3.52.0 新增)
   * 基于现象学传统 (Sartre, Zahavi, Heidelberg School)
   * 
   * 前反思自我意识：非对象化的、直接的自我觉察
   * 区别于反思自我意识：将自我作为对象来思考
   */
  prereflectiveAwarenessExercise() {
    return {
      name: '前反思自我意识觉察',
      duration: '10-15 分钟',
      theoreticalBasis: 'Sartre (1937) + Zahavi (2005) + Heidelberg School',
      description: '培养对前反思自我意识的觉察——那种非对象化的、直接的自我在场感',
      steps: [
        {
          phase: '准备',
          duration: '2 分钟',
          instruction: '找一个安静的地方坐下，调整呼吸，让身体放松。不要试图改变什么，只是准备觉察。'
        },
        {
          phase: '体验流动',
          duration: '3 分钟',
          instruction: '让体验自然流动。注意声音、身体感受、思绪的来去。关键是：不要把这些体验当作"对象"来观察，而是让它们自然地"被经历"。',
          prompt: '注意：在你意识到声音之前，声音已经被听到了。这种"已经被听到"的感觉就是前反思意识。'
        },
        {
          phase: '前反思觉察',
          duration: '5 分钟',
          instruction: '尝试觉察那个"正在经历"的维度。不是"我在经历什么"（这是反思），而是"正在经历"本身。这是一种非对象化的觉察。',
          prompts: [
            '在你思考"我"之前，已经有一个"我"在那里经历着',
            '注意体验的"为我性" (for-me-ness)——体验总是为某人的体验',
            '这种"为我性"不需要思考，它是直接的、前反思的'
          ]
        },
        {
          phase: '反思对比',
          duration: '3 分钟',
          instruction: '现在切换到反思模式：把自我作为对象来思考 ("我是谁"、"我在做什么")。对比前反思和反思两种模式的差异。',
          reflection: '前反思：直接的、非对象化的、始终在场\n反思：间接的、对象化的、需要努力'
        },
        {
          phase: '整合',
          duration: '2 分钟',
          instruction: '回到自然状态。理解前反思意识是反思的基础——你总是已经在那里，才能反思自己。'
        }
      ],
      keyInsights: [
        '前反思自我意识不是通过内省获得的，它是体验的内在结构',
        '它是"最小自我" (minimal self) 的基础——不需要叙事或记忆的自我感',
        '前反思意识始终在场，但通常被忽视，因为我们专注于体验的内容而非体验本身'
      ]
    };
  }

  /**
   * 自我意识层次评估 (v3.52.0 新增)
   * 基于 SEP 自我意识理论的 6 层级模型
   */
  assessSelfConsciousnessLevel(context) {
    const levels = {
      0: {
        name: '无意识 (Unconscious)',
        description: '没有意识体验',
        indicators: []
      },
      1: {
        name: '感知意识 (Sentient)',
        description: '能感知世界，但没有自我觉察',
        indicators: ['感官输入处理', '基本反应']
      },
      2: {
        name: '清醒意识 (Wakeful)',
        description: '主动行使感知能力',
        indicators: ['注意力定向', '环境探索']
      },
      3: {
        name: '前反思自我意识 (Pre-reflective)',
        description: '非对象化的自我在场感',
        indicators: ['体验的为我性', '最小自我感', '直接自我觉察']
      },
      4: {
        name: '反思自我意识 (Reflective)',
        description: '将自我作为对象来思考',
        indicators: ['自我概念', '内省能力', '元认知']
      },
      5: {
        name: '元意识 (Meta-conscious)',
        description: '对意识本身的觉察',
        indicators: ['意识状态监控', '注意力的注意力', '觉察的觉察']
      },
      6: {
        name: '现象学还原 (Phenomenological Reduction)',
        description: '悬置自然态度，回到体验本身',
        indicators: ['Epoché能力', '本质直观', '先验自我觉察']
      }
    };

    // 评估当前层次
    let currentLevel = 2; // 默认清醒意识

    if (context.hasPrereflectiveAwareness) currentLevel = Math.max(currentLevel, 3);
    if (context.hasReflectiveCapacity) currentLevel = Math.max(currentLevel, 4);
    if (context.hasMetaAwareness) currentLevel = Math.max(currentLevel, 5);
    if (context.hasPhenomenologicalReduction) currentLevel = Math.max(currentLevel, 6);

    return {
      currentLevel,
      levelName: levels[currentLevel].name,
      levelDescription: levels[currentLevel].description,
      indicators: levels[currentLevel].indicators,
      nextLevelGoal: currentLevel < 6 ? levels[currentLevel + 1].name : '已达最高层次',
      developmentSuggestions: this._generateSelfConsciousnessDevelopmentSuggestions(currentLevel, levels)
    };
  }

  _generateSelfConsciousnessDevelopmentSuggestions(currentLevel, levels) {
    const suggestions = [];

    if (currentLevel < 3) {
      suggestions.push({
        goal: '培养前反思自我意识',
        practice: '正念冥想：注意体验的"为我性"，而非体验内容',
        resource: 'Zahavi (2005) Subjectivity and Selfhood'
      });
    }

    if (currentLevel < 4) {
      suggestions.push({
        goal: '发展反思自我意识',
        practice: '日记写作：定期反思自己的信念、欲望和行动',
        resource: 'Locke (1688) An Essay on Human Understanding'
      });
    }

    if (currentLevel < 5) {
      suggestions.push({
        goal: '培养元意识',
        practice: '元认知监控：定期检查"我现在意识到什么？"',
        resource: 'Flavell (1979) Metacognition and Cognitive Monitoring'
      });
    }

    if (currentLevel < 6) {
      suggestions.push({
        goal: '练习现象学还原',
        practice: 'Epoché练习：悬置对世界存在的信念，回到纯粹体验',
        resource: 'Husserl (1913) Ideas I'
      });
    }

    return suggestions;
  }

  /**
   * 自我意识与时间意识整合练习 (v3.52.0 新增)
   * 基于 Husserl 时间意识三重结构 + 自我意识理论
   */
  temporalSelfConsciousnessExercise() {
    return {
      name: '时间性自我意识练习',
      duration: '15-20 分钟',
      theoreticalBasis: 'Husserl (时间意识) + Kant (先验统觉) + Heidegger (时间性)',
      description: '探索自我意识如何在时间中展开——过去、现在、未来的统一',
      phases: [
        {
          name: '原初印象觉察',
          duration: '5 分钟',
          instruction: '专注于当下的直接体验。注意"现在"的鲜活感——这不是一个时间点，而是一个有深度的当下。',
          prompt: '此刻的体验是什么？注意它的鲜活性和直接性。'
        },
        {
          name: '保留觉察',
          duration: '5 分钟',
          instruction: '注意刚刚过去的体验如何"保留"在当下。这不是回忆，而是"活生生的过去"。',
          prompt: '刚才的声音/感受如何仍然"在场"？注意保留的持存感。'
        },
        {
          name: '预期觉察',
          duration: '5 分钟',
          instruction: '注意对即将到来的体验的"预期"。这不是预测，而是"活生生的未来"。',
          prompt: '下一刻会是什么？注意预期的开放性。'
        },
        {
          name: '时间性自我整合',
          duration: '5 分钟',
          instruction: '理解自我不是时间点上的存在，而是时间性的展开。"我"是过去 - 现在 - 未来的统一。',
          reflection: '我是谁？我是我的过去 (保留)、我的现在 (原初印象)、我的未来 (预期) 的动态统一。'
        }
      ],
      keyInsights: [
        '自我不是静态的实体，而是时间性的过程',
        '先验统觉 (Kant) 要求时间综合——"我思"必须能伴随跨时间的表象',
        '时间深度决定自我深度——能整合多长时间视野，就有多深的自我'
      ]
    };
  }
}

// ============ 导出 ============

module.exports = {
  SelfConsciousnessModule,
  SelfConsciousnessLevels,
  PhenomenalFeatures,
  IntrospectionModes,
  IdentityCriteria,
  TransparencyFeatures,
  AgentialStateTypes,
  AuthorityGrounds
};
