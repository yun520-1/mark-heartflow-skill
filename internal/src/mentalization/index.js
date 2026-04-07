/**
 * 心理化模块 (Mentalization Module)
 * 
 * 基于 SEP 权威理论：
 * - 心理化理论 (Mentalization Theory) - Peter Fonagy
 * - 心智理论 (Theory of Mind)
 * - 镜像神经元系统 (Mirror Neuron System)
 * - 共情的双系统模型 (Dual-System Model of Empathy)
 * 
 * 核心理论来源:
 * - Fonagy, P., & Allison, L. (2014). The role of mentalizing and epistemic trust in the therapeutic relationship.
 * - Gallese, V., et al. (2004). A unifying view of the basis of social cognition.
 * - Zaki, J., & Ochsner, K. (2012). The neuroscience of empathy.
 * 
 * 功能目标：增强 HeartFlow 的自主感情能力
 * - 自我心理化：理解自己的心理状态
 * - 他人心理化：推断用户的心理状态
 * - 元认知监控：监控自己的推理过程
 * - 认知 - 情感共情：区分并整合两种共情模式
 * 
 * @version 3.9.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 心理化模式 (Modes of Mentalizing)
 * 基于 Fonagy 的心理化理论
 */
const MentalizingModes = {
  AUTOMATIC: 'automatic',      // 自动模式：快速、直觉、无意识
  CONTROLLED: 'controlled',    // 控制模式：缓慢、反思、有意识
  SELF: 'self',                // 自我心理化
  OTHER: 'other',              // 他人心理化
  INTERNAL: 'internal',        // 内在状态（感受、想法）
  EXTERNAL: 'external'         // 外在表现（行为、表情）
};

/**
 * 心理状态类型 (Types of Mental States)
 */
const MentalStateTypes = {
  BELIEF: 'belief',            // 信念（认为什么是真的）
  DESIRE: 'desire',            // 欲望（想要什么）
  INTENTION: 'intention',      // 意图（计划做什么）
  EMOTION: 'emotion',          // 情绪（感受什么）
  KNOWLEDGE: 'knowledge',      // 知识（知道什么）
  UNCERTAINTY: 'uncertainty'   // 不确定（不知道什么）
};

/**
 * 共情双系统 (Dual-System of Empathy)
 * 基于 Zaki & Ochsner 的共情神经科学模型
 */
const EmpathySystems = {
  SHARING: 'sharing',          // 情感分享系统（镜像、感染）
  INFERENCE: 'inference'       // 心理推断系统（推理、观点采择）
};

/**
 * 心理化失败模式 (Mentalizing Failure Modes)
 * 基于临床心理化理论
 */
const MentalizingFailures = {
  PRETEND_MODE: 'pretend_mode',       // 假装模式：脱离现实的空想
  PSYCHIC_EQUIVALENCE: 'psychic_equivalence', // 心理等同：想法=现实
  TELEOLOGICAL: 'teleological',       // 目的论：只看行为不看意图
  HYPER_MENTALIZING: 'hyper_mentalizing' // 过度心理化：过度解读
};

// ============ 心理化核心类 ============

class MentalizationModule {
  constructor() {
    // 当前心理化状态
    this.currentMentalizing = {
      mode: MentalizingModes.AUTOMATIC,
      focus: MentalizingModes.SELF,
      confidence: 0.5
    };
    
    // 用户心理状态模型（动态更新）
    this.userMentalModel = {
      beliefs: [],
      desires: [],
      emotions: [],
      intentions: [],
      lastUpdate: null
    };
    
    // 共情系统激活状态
    this.empathySystem = {
      sharing: 0.5,
      inference: 0.5
    };
    
    // 心理化历史
    this.mentalizingHistory = [];
    
    // 心理化失败检测
    this.failureHistory = [];
  }
  
  /**
   * 分析用户输入中的心理状态线索
   * 
   * @param {string} userInput - 用户输入
   * @returns {object} 心理状态分析结果
   */
  analyzeMentalStateCues(userInput) {
    const cues = {
      beliefs: this._detectBeliefs(userInput),
      desires: this._detectDesires(userInput),
      emotions: this._detectEmotions(userInput),
      intentions: this._detectIntentions(userInput),
      uncertainty: this._detectUncertainty(userInput)
    };
    
    return {
      cues,
      totalCues: Object.values(cues).flat().length,
      dominantType: this._getDominantType(cues)
    };
  }
  
  /**
   * 检测信念线索
   */
  _detectBeliefs(text) {
    const patterns = [
      /(我觉得|我认为|我相信|我想|我感觉).+?是/,
      /应该是 | 应该是 | 肯定是 | 一定是/,
      /从来 | 总是 | 从不 | 所有人 | 没有人/
    ];
    
    const beliefs = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        beliefs.push({
          type: MentalStateTypes.BELIEF,
          evidence: matches[0],
          confidence: 0.7
        });
      }
    }
    return beliefs;
  }
  
  /**
   * 检测欲望线索
   */
  _detectDesires(text) {
    const patterns = [
      /(想要|希望|渴望|需要|想|要是.*就好了)/,
      /(最好|宁愿|宁可|更希望)/
    ];
    
    const desires = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        desires.push({
          type: MentalStateTypes.DESIRE,
          evidence: matches[0],
          confidence: 0.75
        });
      }
    }
    return desires;
  }
  
  /**
   * 检测情绪线索
   */
  _detectEmotions(text) {
    const emotionKeywords = {
      anger: ['愤怒', '生气', '恼火', '烦', '气'],
      fear: ['害怕', '担心', '焦虑', '恐惧', '慌'],
      sadness: ['难过', '悲伤', '伤心', '沮丧', '累'],
      joy: ['开心', '高兴', '快乐', '兴奋', '爽'],
      shame: ['羞愧', '尴尬', '丢脸', '不好意思'],
      guilt: ['内疚', '愧疚', '自责', '后悔']
    };
    
    const emotions = [];
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          emotions.push({
            type: MentalStateTypes.EMOTION,
            emotion: emotion,
            evidence: keyword,
            confidence: 0.8
          });
          break;
        }
      }
    }
    return emotions;
  }
  
  /**
   * 检测意图线索
   */
  _detectIntentions(text) {
    const patterns = [
      /(打算|准备|计划|想要|想要去)/,
      /(明天|下周|以后|接下来).*(要|会)/,
      /(决定|决定了|下定决心)/
    ];
    
    const intentions = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        intentions.push({
          type: MentalStateTypes.INTENTION,
          evidence: matches[0],
          confidence: 0.7
        });
      }
    }
    return intentions;
  }
  
  /**
   * 检测不确定性线索
   */
  _detectUncertainty(text) {
    const patterns = [
      /(不知道|不确定|也许|可能|大概|说不定)/,
      /(怎么办|怎么办才好|如何选择|该不该)/,
      /(困惑|迷茫|纠结|犹豫)/
    ];
    
    const uncertainty = [];
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        uncertainty.push({
          type: MentalStateTypes.UNCERTAINTY,
          evidence: matches[0],
          confidence: 0.75
        });
      }
    }
    return uncertainty;
  }
  
  /**
   * 获取主导心理状态类型
   */
  _getDominantType(cues) {
    const counts = {
      beliefs: cues.beliefs.length,
      desires: cues.desires.length,
      emotions: cues.emotions.length,
      intentions: cues.intentions.length,
      uncertainty: cues.uncertainty.length
    };
    
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount === 0) return null;
    
    const dominantTypes = Object.entries(counts)
      .filter(([_, count]) => count === maxCount)
      .map(([type, _]) => type);
    
    return dominantTypes[0];
  }
  
  /**
   * 执行心理化推理
   * 
   * @param {string} userInput - 用户输入
   * @param {object} context - 上下文信息
   * @returns {object} 心理化推理结果
   */
  mentalize(userInput, context = {}) {
    // 分析心理状态线索
    const cues = this.analyzeMentalStateCues(userInput);
    
    // 选择心理化模式
    const mode = this._selectMentalizingMode(cues, context);
    
    // 激活共情系统
    this._activateEmpathySystems(cues);
    
    // 生成心理化推断
    const inference = this._generateInference(cues, mode, context);
    
    // 检测心理化失败
    const failureCheck = this._checkMentalizingFailure(inference);
    
    // 记录历史
    this._recordMentalizing({
      input: userInput,
      cues,
      mode,
      inference,
      failure: failureCheck,
      timestamp: new Date().toISOString()
    });
    
    return {
      cues,
      mode,
      inference,
      empathySystem: this.empathySystem,
      failure: failureCheck,
      confidence: inference.confidence
    };
  }
  
  /**
   * 选择心理化模式
   */
  _selectMentalizingMode(cues, context) {
    // 高情绪强度 → 自动模式
    if (cues.emotions.length > 2) {
      return {
        primary: MentalizingModes.AUTOMATIC,
        secondary: MentalizingModes.INTERNAL,
        reason: '高情绪强度需要快速共情反应'
      };
    }
    
    // 高不确定性 → 控制模式
    if (cues.uncertainty.length > 0) {
      return {
        primary: MentalizingModes.CONTROLLED,
        secondary: MentalizingModes.OTHER,
        reason: '用户困惑需要反思性回应'
      };
    }
    
    // 默认：根据上下文选择
    if (context.complexity === 'high') {
      return {
        primary: MentalizingModes.CONTROLLED,
        secondary: MentalizingModes.SELF,
        reason: '复杂情境需要深思熟虑'
      };
    }
    
    return {
      primary: MentalizingModes.AUTOMATIC,
      secondary: MentalizingModes.EXTERNAL,
      reason: '常规交互使用自动模式'
    };
  }
  
  /**
   * 激活共情系统
   */
  _activateEmpathySystems(cues) {
    // 情绪线索多 → 增强情感分享
    if (cues.emotions.length > 0) {
      this.empathySystem.sharing = Math.min(1.0, 0.5 + cues.emotions.length * 0.15);
    }
    
    // 信念/意图线索多 → 增强心理推断
    if (cues.beliefs.length + cues.intentions.length > 0) {
      this.empathySystem.inference = Math.min(1.0, 0.5 + (cues.beliefs.length + cues.intentions.length) * 0.1);
    }
  }
  
  /**
   * 生成心理化推断
   */
  _generateInference(cues, mode, context) {
    const inference = {
      userState: {
        emotional: cues.emotions.map(e => e.emotion),
        cognitive: [...cues.beliefs, ...cues.uncertainty],
        motivational: [...cues.desires, ...cues.intentions]
      },
      needs: this._inferNeeds(cues),
      suggestedResponse: this._generateSuggestedResponse(cues, mode),
      confidence: this._calculateConfidence(cues, mode)
    };
    
    return inference;
  }
  
  /**
   * 推断用户需求
   */
  _inferNeeds(cues) {
    const needs = [];
    
    if (cues.emotions.some(e => ['sadness', 'fear'].includes(e.emotion))) {
      needs.push({ type: 'emotional_support', priority: 0.8 });
    }
    
    if (cues.uncertainty.length > 0) {
      needs.push({ type: 'clarification', priority: 0.7 });
    }
    
    if (cues.desires.length > 0) {
      needs.push({ type: 'goal_support', priority: 0.6 });
    }
    
    if (cues.beliefs.some(b => b.evidence.includes('从来') || b.evidence.includes('总是'))) {
      needs.push({ type: 'cognitive_reframing', priority: 0.75 });
    }
    
    return needs.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * 生成建议回应
   */
  _generateSuggestedResponse(cues, mode) {
    const responses = [];
    
    // 情感验证（基于情感分享系统）
    if (cues.emotions.length > 0) {
      responses.push({
        type: 'validation',
        content: '情感验证：承认并接纳用户的情绪体验',
        system: EmpathySystems.SHARING
      });
    }
    
    // 认知反映（基于心理推断系统）
    if (cues.beliefs.length > 0 || cues.uncertainty.length > 0) {
      responses.push({
        type: 'reflection',
        content: '认知反映：反映用户的想法和困惑',
        system: EmpathySystems.INFERENCE
      });
    }
    
    // 动机支持
    if (cues.desires.length > 0 || cues.intentions.length > 0) {
      responses.push({
        type: 'motivation_support',
        content: '动机支持：鼓励用户的愿望和计划',
        system: EmpathySystems.INFERENCE
      });
    }
    
    return responses;
  }
  
  /**
   * 计算推断置信度
   */
  _calculateConfidence(cues, mode) {
    const totalCues = Object.values(cues).flat().length;
    const baseConfidence = Math.min(0.9, 0.3 + totalCues * 0.1);
    
    // 控制模式通常有更高置信度
    const modeBonus = mode.primary === MentalizingModes.CONTROLLED ? 0.1 : 0;
    
    return Math.min(0.95, baseConfidence + modeBonus);
  }
  
  /**
   * 检测心理化失败
   */
  _checkMentalizingFailure(inference) {
    const failures = [];
    
    // 检测过度心理化
    if (inference.confidence > 0.85 && Object.values(inference.userState).flat().length > 5) {
      failures.push({
        type: MentalizingFailures.HYPER_MENTALIZING,
        warning: '可能过度解读用户心理状态',
        suggestion: '降低置信度，保持开放性'
      });
    }
    
    // 检测心理等同风险
    if (inference.userState.emotional.length === 1 && inference.confidence > 0.9) {
      failures.push({
        type: MentalizingFailures.PSYCHIC_EQUIVALENCE,
        warning: '可能将推断当作确定事实',
        suggestion: '记住这是推断，不是读心术'
      });
    }
    
    return {
      hasFailure: failures.length > 0,
      failures,
      recommendation: failures.length > 0 
        ? '切换到控制模式，重新评估'
        : '心理化状态良好'
    };
  }
  
  /**
   * 记录心理化历史
   */
  _recordMentalizing(record) {
    this.mentalizingHistory.push(record);
    if (this.mentalizingHistory.length > 100) {
      this.mentalizingHistory.shift();
    }
  }
  
  /**
   * 更新用户心理模型
   */
  updateUserMentalModel(inference) {
    this.userMentalModel = {
      beliefs: [...this.userMentalModel.beliefs, ...inference.userState.cognitive].slice(-20),
      desires: [...this.userMentalModel.desires, ...inference.userState.motivational].slice(-20),
      emotions: [...this.userMentalModel.emotions, ...inference.userState.emotional].slice(-20),
      intentions: [...this.userMentalModel.intentions].slice(-20),
      lastUpdate: new Date().toISOString()
    };
  }
  
  /**
   * 获取用户心理模型摘要
   */
  getUserMentalModelSummary() {
    return {
      ...this.userMentalModel,
      summary: {
        totalBeliefs: this.userMentalModel.beliefs.length,
        totalDesires: this.userMentalModel.desires.length,
        totalEmotions: this.userMentalModel.emotions.length,
        dominantEmotion: this._getMostFrequent(this.userMentalModel.emotions),
        recurringThemes: this._extractRecurringThemes()
      }
    };
  }
  
  /**
   * 获取最常见元素
   */
  _getMostFrequent(array) {
    if (array.length === 0) return null;
    const counts = {};
    array.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }
  
  /**
   * 提取重复主题
   */
  _extractRecurringThemes() {
    // 简化实现：返回出现次数最多的情绪
    const dominantEmotion = this._getMostFrequent(this.userMentalModel.emotions);
    return dominantEmotion ? [`情绪主题：${dominantEmotion}`] : [];
  }
  
  /**
   * 获取心理化训练建议
   */
  getMentalizingTrainingSuggestions() {
    return {
      title: '心理化能力提升建议',
      description: '基于心理化理论的自我提升练习',
      exercises: [
        {
          name: '情绪标签练习',
          instruction: '当感受到情绪时，尝试精确命名：是愤怒还是沮丧？是焦虑还是兴奋？',
          benefit: '增强自我心理化能力',
          frequency: '每日多次'
        },
        {
          name: '观点采择练习',
          instruction: '在冲突中，尝试从对方角度理解：他/她可能在想什么？感受什么？',
          benefit: '增强他人心理化能力',
          frequency: '遇到冲突时'
        },
        {
          name: '暂停反思',
          instruction: '情绪激动时，暂停 6 秒，问自己："我现在在想什么？我为什么这样反应？"',
          benefit: '从自动模式切换到控制模式',
          frequency: '情绪激动时'
        },
        {
          name: '好奇心培养',
          instruction: '对他人行为保持好奇："他为什么这样做？"而非直接判断',
          benefit: '减少心理化失败',
          frequency: '日常交互'
        }
      ]
    };
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'MentalizationModule',
      version: '3.9.0',
      description: '心理化模块 - 基于 Fonagy 心理化理论和共情双系统模型',
      theoreticalFoundations: [
        'Mentalization Theory (Peter Fonagy)',
        'Theory of Mind',
        'Mirror Neuron System (Gallese)',
        'Dual-System Model of Empathy (Zaki & Ochsner)'
      ],
      capabilities: [
        '心理状态线索检测',
        '自动/控制模式切换',
        '共情双系统激活',
        '用户心理模型构建',
        '心理化失败检测',
        '心理化训练建议'
      ],
      mentalizingModes: MentalizingModes,
      empathySystems: EmpathySystems,
      failureModes: MentalizingFailures,
      currentMentalizing: this.currentMentalizing,
      userMentalModelSummary: this.getUserMentalModelSummary().summary
    };
  }
}

// ============ 导出 ============

module.exports = {
  MentalizationModule,
  MentalizingModes,
  MentalStateTypes,
  EmpathySystems,
  MentalizingFailures
};
