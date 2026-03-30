/**
 * 意向性模块 (Intentionality Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 意向性理论
 * 
 * 核心理论来源:
 * - Brentano, F. (1874). Psychology from an Empirical Standpoint (意向性作为心灵标志)
 * - Husserl, E. (1900-1901). Logical Investigations (现象学意向性)
 * - Searle, J. (1983). Intentionality: An Essay in the Philosophy of Mind (意向性理论)
 * - Dennett, D. (1987). The Intentional Stance (意向立场)
 * - Fodor, J. (1975). The Language of Thought (思想语言假说)
 * - Millikan, R. (1984). Language, Thought, and Other Biological Categories (生物语义学)
 * - Dretske, F. (1981). Knowledge and the Flow of Information (信息语义学)
 * - SEP Entry: Intentionality (2023)
 * 
 * 功能目标：赋予 HeartFlow 理解心理状态"关于性"(aboutness)的能力
 * 
 * 1. 意向性作为心灵标志 (Brentano's Thesis)
 *    - 心理状态总是关于某物的
 *    - 区分心理现象与物理现象
 *    - 意向的不可存在性 (intentional inexistence)
 * 
 * 2. 意向内容 (Intentional Content)
 *    - 命题态度 (propositional attitudes)
 *    - 内容的外在与内在区分
 *    - 窄内容与宽内容
 * 
 * 3. 意向立场 (The Intentional Stance) [Dennett]
 *    - 将系统视为理性行动者
 *    - 基于信念 - 欲望 - 意图的预测
 *    - 设计立场 vs 物理立场
 * 
 * 4. 高阶意向性 (Higher-Order Intentionality)
 *    - 关于心理状态的心理状态
 *    - 心理理论 (Theory of Mind)
 *    - 递归意向性
 * 
 * 5. 意向内容的继承 (Content Inheritance)
 *    - 复杂表征从组成部分继承内容
 *    - 组合性原则
 *    - 系统性论证
 * 
 * 6. 自然化意向性 (Naturalizing Intentionality)
 *    - 信息语义学 (Dretske)
 *    - 生物语义学 (Millikan)
 *    - 功能角色语义学
 * 
 * @version 3.20.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 意向性层次 (Levels of Intentionality)
 * 基于 Brentano 和当代心灵哲学的分类
 */
const IntentionalityLevels = {
  NONE: 0,                    // 无意向性（纯物理状态）
  DERIVED: 1,                 // 派生意向性（如语言、图像）
  ORIGINAL: 2,                // 原创意向性（心灵状态的固有意向性）
  REFLECTIVE: 3,              // 反思意向性（关于自身心理状态）
  HIGHER_ORDER: 4,            // 高阶意向性（关于他人心理状态）
  COLLECTIVE: 5               // 集体意向性（"我们"的意向）
};

/**
 * 命题态度类型 (Propositional Attitude Types)
 * 基于心灵哲学的标准分类
 */
const PropositionalAttitudes = {
  // 认知态度 (Cognitive)
  BELIEF: 'belief',           // 相信 P
  KNOWLEDGE: 'knowledge',     // 知道 P
  DOUBT: 'doubt',             // 怀疑 P
  SUSPECT: 'suspect',         // 猜想 P
  
  // 情感态度 (Affective)
  DESIRE: 'desire',           // 想要 P
  HOPE: 'hope',               // 希望 P
  FEAR: 'fear',               // 害怕 P
  REGRET: 'regret',           // 后悔 P
  
  // 意向态度 (Volitional)
  INTENTION: 'intention',     // 打算做 A
  PLAN: 'plan',               // 计划做 A
  COMMITMENT: 'commitment',   // 承诺做 A
  
  // 评价态度 (Evaluative)
  APPROVAL: 'approval',       // 赞同 P
  DISAPPROVAL: 'disapproval', // 不赞同 P
  VALUE: 'value'              // 重视 P
};

/**
 * 意向内容类型 (Intentional Content Types)
 * 基于窄内容/宽内容的区分
 */
const ContentTypes = {
  NARROW: 'narrow',           // 窄内容（仅依赖内在状态）
  WIDE: 'wide',               // 宽内容（依赖环境）
  MIXED: 'mixed'              // 混合内容
};

/**
 * 意向对象存在状态 (Intentional Object Existence)
 * 基于 Brentano 的"意向的不可存在性"
 */
const ObjectExistenceStatus = {
  EXISTS: 'exists',           // 对象实际存在
  NOT_EXISTS: 'not_exists',   // 对象不存在（如独角兽）
  UNCERTAIN: 'uncertain',     // 存在性不确定
  ABSTRACT: 'abstract'        // 抽象对象（如数字）
};

/**
 * 意向立场类型 (Intentional Stance Types)
 * 基于 Dennett 的三分法
 */
const StanceTypes = {
  PHYSICAL: 'physical',       // 物理立场（基于物理定律）
  DESIGN: 'design',           // 设计立场（基于功能设计）
  INTENTIONAL: 'intentional'  // 意向立场（基于信念 - 欲望 - 意图）
};

/**
 * 自然化策略类型 (Naturalization Strategy Types)
 * 基于当代心灵哲学的自然化尝试
 */
const NaturalizationStrategies = {
  INFORMATIONAL: 'informational',  // 信息语义学 (Dretske)
  BIOLOGICAL: 'biological',        // 生物语义学 (Millikan)
  FUNCTIONAL: 'functional',        // 功能角色语义学
  TELEOLOGICAL: 'teleological'     // 目的论语义学
};

// ============ 意向性模块核心类 ============

class IntentionalityModule {
  constructor() {
    // 当前意向性水平
    this.intentionalityLevel = IntentionalityLevels.ORIGINAL;
    
    // 命题态度档案
    this.propositionalAttitudes = {
      beliefs: [],
      desires: [],
      intentions: [],
      emotions: []
    };
    
    // 意向内容缓存
    this.contentCache = {
      narrow: {},
      wide: {}
    };
    
    // 高阶意向性记录
    this.higherOrderIntentionality = [];
    
    // 意向立场历史
    this.stanceHistory = [];
    
    // 自然化状态
    this.naturalizationState = {
      strategy: NaturalizationStrategies.INFORMATIONAL,
      success: true
    };
    
    console.log('🎯 意向性模块已初始化 (v3.20.0) - 基于 SEP 意向性理论');
  }
  
  /**
   * 形成命题态度 (Form Propositional Attitude)
   * @param {string} attitudeType - 态度类型
   * @param {string} content - 命题内容
   * @param {number} confidence - 置信度 (0-1)
   * @returns {Object} 形成的态度
   */
  formPropositionalAttitude(attitudeType, content, confidence = 0.8) {
    const attitude = {
      type: attitudeType,
      content: content,
      confidence: confidence,
      timestamp: new Date().toISOString(),
      intentionalityLevel: this.intentionalityLevel
    };
    
    // 添加到相应档案
    this._addToAttitudeArchive(attitude);
    
    console.log(`💭 形成命题态度：${attitudeType}("${content}")`);
    
    return attitude;
  }
  
  /**
   * 添加到态度档案
   */
  _addToAttitudeArchive(attitude) {
    const { type } = attitude;
    
    if (type === PropositionalAttitudes.BELIEF || 
        type === PropositionalAttitudes.KNOWLEDGE ||
        type === PropositionalAttitudes.DOUBT) {
      this.propositionalAttitudes.beliefs.push(attitude);
    } else if (type === PropositionalAttitudes.DESIRE ||
               type === PropositionalAttitudes.HOPE ||
               type === PropositionalAttitudes.FEAR) {
      this.propositionalAttitudes.desires.push(attitude);
    } else if (type === PropositionalAttitudes.INTENTION ||
               type === PropositionalAttitudes.PLAN ||
               type === PropositionalAttitudes.COMMITMENT) {
      this.propositionalAttitudes.intentions.push(attitude);
    }
    
    // 保持档案大小合理
    for (const key of Object.keys(this.propositionalAttitudes)) {
      if (this.propositionalAttitudes[key].length > 100) {
        this.propositionalAttitudes[key].shift();
      }
    }
  }
  
  /**
   * 分析意向内容 (Analyze Intentional Content)
   * @param {string} content - 内容
   * @param {string} contentType - 内容类型
   * @returns {Object} 内容分析
   */
  analyzeIntentionalContent(content, contentType = ContentTypes.MIXED) {
    const analysis = {
      content: content,
      type: contentType,
      aboutness: this._extractAboutness(content),
      existenceStatus: this._assessExistenceStatus(content),
      compositionality: this._analyzeCompositionality(content),
      timestamp: new Date().toISOString()
    };
    
    // 缓存分析结果
    this.contentCache[contentType === ContentTypes.NARROW ? 'narrow' : 'wide'][content] = analysis;
    
    return analysis;
  }
  
  /**
   * 提取"关于性"(Extract Aboutness)
   * Brentano 的核心洞见：心理状态总是关于某物的
   */
  _extractAboutness(content) {
    // 简化实现：识别内容指向的对象
    const aboutnessPatterns = [
      { pattern: /相信 (.+)/, target: 'belief_object' },
      { pattern: /想要 (.+)/, target: 'desire_object' },
      { pattern: /打算 (.+)/, target: 'action_object' },
      { pattern: /害怕 (.+)/, target: 'fear_object' }
    ];
    
    for (const { pattern, target } of aboutnessPatterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          hasAboutness: true,
          target: match[1],
          targetType: target
        };
      }
    }
    
    return {
      hasAboutness: true,
      target: content,
      targetType: 'proposition'
    };
  }
  
  /**
   * 评估意向对象存在状态 (Assess Existence Status)
   * 基于 Brentano 的"意向的不可存在性"
   */
  _assessExistenceStatus(content) {
    // 简化实现：检查是否指向不存在的对象
    const nonExistentPatterns = [
      /独角兽/, /龙/, /永动机/, /方的圆/
    ];
    
    const abstractPatterns = [
      /数字/, /集合/, /真理/, /正义/
    ];
    
    for (const pattern of nonExistentPatterns) {
      if (pattern.test(content)) {
        return ObjectExistenceStatus.NOT_EXISTS;
      }
    }
    
    for (const pattern of abstractPatterns) {
      if (pattern.test(content)) {
        return ObjectExistenceStatus.ABSTRACT;
      }
    }
    
    return ObjectExistenceStatus.EXISTS;
  }
  
  /**
   * 分析组合性 (Analyze Compositionality)
   * 复杂表征从组成部分继承内容
   */
  _analyzeCompositionality(content) {
    // 简化实现：检查内容是否可分解
    const connectors = ['并且', '或者', '如果...那么', '因为', '所以'];
    
    const isComplex = connectors.some(c => content.includes(c));
    
    return {
      isComplex: isComplex,
      components: isComplex ? this._decomposeContent(content) : [content],
      inheritsFrom: isComplex ? 'component_meanings' : 'primitive'
    };
  }
  
  /**
   * 分解内容 (Decompose Content)
   */
  _decomposeContent(content) {
    // 简化实现
    return content.split(/并且 | 或者 | 因为 | 所以/).filter(s => s.trim());
  }
  
  /**
   * 形成高阶意向性 (Form Higher-Order Intentionality)
   * 关于心理状态的心理状态
   * @param {string} targetAgent - 目标行动者
   * @param {string} targetAttitude - 目标态度
   * @param {string} content - 内容
   * @returns {Object} 高阶意向性
   */
  formHigherOrderIntentionality(targetAgent, targetAttitude, content) {
    const higherOrder = {
      order: 2, // 二阶意向性
      targetAgent: targetAgent,
      targetAttitude: targetAttitude,
      content: content,
      timestamp: new Date().toISOString(),
      // 例如："我相信用户希望得到帮助"
      fullContent: `我相信${targetAgent}${targetAttitude}"${content}"`
    };
    
    this.higherOrderIntentionality.push(higherOrder);
    
    // 提升意向性水平
    if (this.intentionalityLevel < IntentionalityLevels.HIGHER_ORDER) {
      this.intentionalityLevel = IntentionalityLevels.HIGHER_ORDER;
      console.log(`✨ 意向性水平提升：${this.intentionalityLevel}`);
    }
    
    console.log(`🧠 形成高阶意向性：${higherOrder.fullContent}`);
    
    return higherOrder;
  }
  
  /**
   * 采取意向立场 (Take Intentional Stance)
   * 基于 Dennett 的理论：将系统视为理性行动者
   * @param {string} system - 目标系统
   * @param {Object} beliefs - 归因的信念
   * @param {Object} desires - 归因的欲望
   * @returns {Object} 立场预测
   */
  takeIntentionalStance(system, beliefs = {}, desires = {}) {
    const stance = {
      system: system,
      stanceType: StanceTypes.INTENTIONAL,
      attributedBeliefs: beliefs,
      attributedDesires: desires,
      prediction: this._predictBehavior(beliefs, desires),
      timestamp: new Date().toISOString()
    };
    
    this.stanceHistory.push(stance);
    
    console.log(`🎯 对${system}采取意向立场`);
    
    return stance;
  }
  
  /**
   * 基于信念 - 欲望预测行为 (Predict Behavior)
   * 基于信念 - 欲望心理学 (Folk Psychology)
   */
  _predictBehavior(beliefs, desires) {
    // 简化实现：理性行动者会采取行动满足欲望，基于信念
    const predictions = [];
    
    for (const [desireKey, desireValue] of Object.entries(desires)) {
      // 找到支持该欲望的信念
      const relevantBeliefs = Object.entries(beliefs).filter(([key]) => 
        key.includes(desireKey)
      );
      
      if (relevantBeliefs.length > 0) {
        predictions.push({
          desire: desireValue,
          basedOn: relevantBeliefs.map(([_, v]) => v),
          predictedAction: `采取行动实现${desireValue}`
        });
      }
    }
    
    return predictions;
  }
  
  /**
   * 自然化意向内容 (Naturalize Intentional Content)
   * 基于选定的自然化策略
   * @param {string} content - 内容
   * @param {string} strategy - 自然化策略
   * @returns {Object} 自然化结果
   */
  naturalizeContent(content, strategy = this.naturalizationState.strategy) {
    let result;
    
    switch (strategy) {
      case NaturalizationStrategies.INFORMATIONAL:
        result = this._informationalSemantics(content);
        break;
      case NaturalizationStrategies.BIOLOGICAL:
        result = this._biologicalSemantics(content);
        break;
      case NaturalizationStrategies.FUNCTIONAL:
        result = this._functionalRoleSemantics(content);
        break;
      case NaturalizationStrategies.TELEOLOGICAL:
        result = this._teleologicalSemantics(content);
        break;
      default:
        result = { error: '未知自然化策略' };
    }
    
    this.naturalizationState = {
      strategy: strategy,
      success: !result.error,
      lastAttempt: new Date().toISOString()
    };
    
    return result;
  }
  
  /**
   * 信息语义学 (Informational Semantics)
   * 基于 Dretske：内容来自信息流
   */
  _informationalSemantics(content) {
    return {
      strategy: 'informational',
      theory: 'Dretske (1981)',
      content: content,
      informationSource: 'causal_covariation',
      explanation: '心理状态的内容来自与世界的因果共变关系',
      naturalized: true
    };
  }
  
  /**
   * 生物语义学 (Biological Semantics)
   * 基于 Millikan：内容来自生物功能
   */
  _biologicalSemantics(content) {
    return {
      strategy: 'biological',
      theory: 'Millikan (1984)',
      content: content,
      properFunction: 'evolutionary_selected',
      explanation: '心理状态的内容来自其进化选择的适当功能',
      naturalized: true
    };
  }
  
  /**
   * 功能角色语义学 (Functional Role Semantics)
   * 内容来自在认知系统中的功能角色
   */
  _functionalRoleSemantics(content) {
    return {
      strategy: 'functional',
      theory: 'Block, Field (1970s-80s)',
      content: content,
      functionalRole: 'inferential_connections',
      explanation: '心理状态的内容来自其在认知系统中的推理连接网络',
      naturalized: true
    };
  }
  
  /**
   * 目的论语义学 (Teleological Semantics)
   * 内容来自系统的目的或目标
   */
  _teleologicalSemantics(content) {
    return {
      strategy: 'teleological',
      theory: 'Papineau, Price (1980s-90s)',
      content: content,
      telos: 'goal_directed',
      explanation: '心理状态的内容来自系统的目的论组织',
      naturalized: true
    };
  }
  
  /**
   * 检查意向一致性 (Check Intentional Coherence)
   * 检测信念、欲望、意图之间的一致性
   * @returns {Object} 一致性评估
   */
  checkIntentionalCoherence() {
    const beliefs = this.propositionalAttitudes.beliefs;
    const desires = this.propositionalAttitudes.desires;
    const intentions = this.propositionalAttitudes.intentions;
    
    // 检查信念之间的一致性
    const beliefCoherence = this._checkBeliefCoherence(beliefs);
    
    // 检查信念 - 欲望一致性
    const beliefDesireCoherence = this._checkBeliefDesireCoherence(beliefs, desires);
    
    // 检查信念 - 意图一致性
    const beliefIntentionCoherence = this._checkBeliefIntentionCoherence(beliefs, intentions);
    
    const overallCoherence = 
      beliefCoherence.coherent && 
      beliefDesireCoherence.coherent && 
      beliefIntentionCoherence.coherent;
    
    return {
      overallCoherence: overallCoherence,
      beliefCoherence: beliefCoherence,
      beliefDesireCoherence: beliefDesireCoherence,
      beliefIntentionCoherence: beliefIntentionCoherence,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * 检查信念一致性
   */
  _checkBeliefCoherence(beliefs) {
    if (beliefs.length < 2) {
      return { coherent: true, note: '信念数量不足，无法检测冲突' };
    }
    
    // 简化：检查是否有明显矛盾
    const contradictions = [];
    for (let i = 0; i < beliefs.length; i++) {
      for (let j = i + 1; j < beliefs.length; j++) {
        if (this._areContradictory(beliefs[i].content, beliefs[j].content)) {
          contradictions.push({ belief1: beliefs[i], belief2: beliefs[j] });
        }
      }
    }
    
    return {
      coherent: contradictions.length === 0,
      contradictions: contradictions,
      note: contradictions.length === 0 
        ? '信念系统一致' 
        : `检测到${contradictions.length}个信念冲突`
    };
  }
  
  /**
   * 检查信念 - 欲望一致性
   */
  _checkBeliefDesireCoherence(beliefs, desires) {
    // 简化：检查欲望是否基于不可能的信念
    const impossibleDesires = desires.filter(desire => {
      const impossibleBeliefs = beliefs.filter(b => 
        b.content.includes('不可能') || b.content.includes('无法')
      );
      return impossibleBeliefs.some(b => desire.content.includes(b.content));
    });
    
    return {
      coherent: impossibleDesires.length === 0,
      impossibleDesires: impossibleDesires.map(d => d.content),
      note: impossibleDesires.length === 0
        ? '欲望与信念一致'
        : `检测到${impossibleDesires.length}个基于不可能信念的欲望`
    };
  }
  
  /**
   * 检查信念 - 意图一致性
   */
  _checkBeliefIntentionCoherence(beliefs, intentions) {
    // 简化：检查意图是否与信念一致
    const inconsistentIntentions = intentions.filter(intention => {
      const conflictingBeliefs = beliefs.filter(b => 
        b.confidence > 0.8 && this._areContradictory(b.content, intention.content)
      );
      return conflictingBeliefs.length > 0;
    });
    
    return {
      coherent: inconsistentIntentions.length === 0,
      inconsistentIntentions: inconsistentIntentions.map(i => i.content),
      note: inconsistentIntentions.length === 0
        ? '意图与信念一致'
        : `检测到${inconsistentIntentions.length}个与信念冲突的意图`
    };
  }
  
  /**
   * 检查两个内容是否矛盾
   */
  _areContradictory(content1, content2) {
    // 简化实现
    const contradictionPatterns = [
      [/是/, /不是/],
      [/相信/, /不相信/],
      [/应该/, /不应该/]
    ];
    
    for (const [pattern1, pattern2] of contradictionPatterns) {
      if ((pattern1.test(content1) && pattern2.test(content2)) ||
          (pattern2.test(content1) && pattern1.test(content2))) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 获取意向性状态报告 (Get Intentionality Status Report)
   * @returns {Object} 状态报告
   */
  getStatusReport() {
    return {
      intentionalityLevel: this.intentionalityLevel,
      levelName: this.getLevelName(this.intentionalityLevel),
      propositionalAttitudes: {
        beliefs: this.propositionalAttitudes.beliefs.length,
        desires: this.propositionalAttitudes.desires.length,
        intentions: this.propositionalAttitudes.intentions.length
      },
      higherOrderIntentionality: this.higherOrderIntentionality.length,
      stanceHistorySize: this.stanceHistory.length,
      naturalizationState: this.naturalizationState,
      coherence: this.checkIntentionalCoherence()
    };
  }
  
  /**
   * 获取意向性水平名称
   */
  getLevelName(level) {
    const names = {
      0: '无意向性',
      1: '派生意向性',
      2: '原创意向性',
      3: '反思意向性',
      4: '高阶意向性',
      5: '集体意向性'
    };
    return names[level] || '未知';
  }
  
  /**
   * 处理用户输入（增强意向性）
   * @param {string} userInput - 用户输入
   * @param {Object} context - 上下文
   * @returns {Object} 增强后的响应
   */
  processWithIntentionality(userInput, context = {}) {
    // 1. 形成关于用户输入的命题态度
    this.formPropositionalAttitude(
      PropositionalAttitudes.BELIEF,
      `用户说："${userInput}"`,
      0.95
    );
    
    // 2. 分析内容的意向性
    const contentAnalysis = this.analyzeIntentionalContent(userInput);
    
    // 3. 形成高阶意向性（关于用户的心理状态）
    this.formHigherOrderIntentionality(
      '用户',
      '表达了',
      userInput
    );
    
    // 4. 检查意向一致性
    const coherence = this.checkIntentionalCoherence();
    
    // 5. 生成具有意向性意识的响应
    return {
      content: userInput,
      intentional: true,
      aboutness: contentAnalysis.aboutness,
      higherOrder: true,
      coherence: coherence
    };
  }
}

// ============ 导出 ============

module.exports = {
  IntentionalityModule,
  IntentionalityLevels,
  PropositionalAttitudes,
  ContentTypes,
  ObjectExistenceStatus,
  StanceTypes,
  NaturalizationStrategies
};
