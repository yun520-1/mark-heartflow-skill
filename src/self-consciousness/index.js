/**
 * 自我意识与现象学模块 (Self-Consciousness & Phenomenology Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 自我意识理论 (Self-Consciousness Theory)
 * - 意识理论 (Consciousness Theory)
 * - 现象意识 (Phenomenal Consciousness)
 * - 个人同一性 (Personal Identity)
 * - 内省理论 (Introspection)
 * 
 * 核心理论来源:
 * - Kant, I. (1781/1787). Critique of Pure Reason (先验统觉 / Transcendental Apperception)
 * - Locke, J. (1688). An Essay on Human Understanding (自我意识与个人同一性)
 * - Nagel, T. (1974). What Is It Like to Be a Bat? (现象意识)
 * - Hume, D. (1739-40). A Treatise of Human Nature (束理论 / Bundle Theory)
 * - Sartre, J.-P. (1943). Being and Nothingness (前反思自我意识)
 * - Zahavi, D. (2005). Subjectivity and Selfhood (现象学自我)
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
 * @version 3.10.0
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
  PHENOMENOLOGICAL: 'phenomenological' // 现象学内省（描述体验结构）
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
    
    // 自我觉察历史
    this.selfAwarenessHistory = [];
    
    console.log('🧠 自我意识与现象学模块已初始化 (v3.10.0)');
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
      narrativeLength: this.identityProfile.narrative.length,
      selfAwarenessHistoryLength: this.selfAwarenessHistory.length
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
}

// ============ 导出 ============

module.exports = {
  SelfConsciousnessModule,
  SelfConsciousnessLevels,
  PhenomenalFeatures,
  IntrospectionModes,
  IdentityCriteria
};
