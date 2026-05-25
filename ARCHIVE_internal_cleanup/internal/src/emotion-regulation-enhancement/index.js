/**
 * 情绪调节增强模块 (Emotion Regulation Enhancement Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 和权威心理学研究：
 * - 情绪调节理论 (Emotion Regulation Theory)
 * - 情绪构成理论 (Emotion Components Theory)
 * - 认知重评策略 (Cognitive Reappraisal)
 * - 表达抑制策略 (Expressive Suppression)
 * - 注意部署策略 (Attentional Deployment)
 * 
 * 核心理论来源:
 * - Gross, J.J. (1998). The Emerging Field of Emotion Regulation
 * - Gross, J.J. & Thompson, R.A. (2007). Emotion Regulation: Conceptual Foundations
 * - SEP: Emotion, Cognitive Emotion, Embodied Cognition
 * 
 * 功能目标：增强 HeartFlow 的情绪调节能力
 * - 多策略调节：提供多种实证支持的情绪调节方法
 * - 情境适配：根据情境自动选择最佳调节策略
 * - 效果评估：追踪调节策略的有效性
 * - 个性化学习：基于用户反馈优化调节建议
 * 
 * @version 3.14.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 情绪调节策略类型 (基于 Gross 过程模型)
 */
const RegulationStrategies = {
  // 情境选择 (Situation Selection)
  SITUATION_SELECTION: 'situation_selection',
  
  // 情境修改 (Situation Modification)
  SITUATION_MODIFICATION: 'situation_modification',
  
  // 注意部署 (Attentional Deployment)
  ATTENTIONAL_DEPLOYMENT: 'attentional_deployment',
  
  // 认知改变 (Cognitive Change)
  COGNITIVE_REAPPRAISAL: 'cognitive_reappraisal',
  
  // 反应调整 (Response Modulation)
  RESPONSE_MODULATION: 'response_modulation',
  
  // 表达抑制 (Expressive Suppression)
  EXPRESSIVE_SUPPRESSION: 'expressive_suppression'
};

/**
 * 调节策略效果评估维度
 */
const EffectivenessDimensions = {
  EMOTIONAL_EXPERIENCE: 'emotional_experience',  // 主观情绪体验变化
  PHYSIOLOGICAL: 'physiological',                 // 生理反应变化
  BEHAVIORAL: 'behavioral',                       // 行为表达变化
  COGNITIVE: 'cognitive',                         // 认知功能影响
  SOCIAL: 'social',                               // 社交影响
  LONG_TERM_WELLBEING: 'long_term_wellbeing'      // 长期幸福感
};

/**
 * 情绪调节时机 (基于 Gross 过程模型的时间维度)
 */
const RegulationTiming = {
  ANTECEDENT: 'antecedent',  // 情绪反应发生前 (预防性)
  EARLY: 'early',            // 情绪反应早期
  PEAK: 'peak',              // 情绪反应高峰期
  LATE: 'late'               // 情绪反应后期 (善后)
};

// ============ 情绪调节策略库 ============

/**
 * 注意部署策略库
 */
const AttentionalStrategies = {
  /**
   * 分心 (Distraction)
   * 将注意力从情绪刺激转移到中性或积极刺激
   */
  DISTRACTION: {
    name: '分心',
    description: '将注意力转移到其他事物上',
    techniques: [
      '数数练习 (从 100 倒数，每次减 3)',
      '5-4-3-2-1 感官觉察 (5 样看到的、4 样触摸到的、3 样听到的、2 样闻到的、1 样尝到的)',
      '心理算术 (如 23×7=?)',
      '回忆愉快的记忆',
      '规划未来的活动'
    ],
    bestFor: ['anger', 'anxiety', 'acute_stress'],
    timing: RegulationTiming.EARLY,
    effectiveness: {
      shortTerm: 0.8,
      longTerm: 0.5,
      cognitiveCost: 'low'
    }
  },
  
  /**
   * 反刍中断 (Rumination Interruption)
   * 打断负面思维的循环
   */
  RUMINATION_INTERRUPTION: {
    name: '反刍中断',
    description: '主动打断反复思考负面事件的模式',
    techniques: [
      '思维停止技术 (心中大喊"停!")',
      '橡皮筋技巧 (手腕戴橡皮筋，弹一下提醒自己停止)',
      '设定"担忧时间" (每天固定 15 分钟专门担忧)',
      '转移至具体任务',
      '身体活动打断 (起身走动、伸展)'
    ],
    bestFor: ['depression', 'anxiety', 'worry'],
    timing: RegulationTiming.EARLY,
    effectiveness: {
      shortTerm: 0.7,
      longTerm: 0.6,
      cognitiveCost: 'medium'
    }
  },
  
  /**
   * 正念觉察 (Mindful Awareness)
   * 不加评判地观察当下体验
   */
  MINDFUL_AWARENESS: {
    name: '正念觉察',
    description: '以开放、好奇的态度观察当下体验',
    techniques: [
      '呼吸觉察 (专注于呼吸的进出)',
      '身体扫描 (从头到脚觉察身体感受)',
      '情绪命名 ("这是焦虑"、"这是愤怒")',
      '云朵想象 (情绪如天空中的云朵，来去自如)',
      'RAIN 技术 (Recognize 识别、Allow 允许、Investigate 探究、Non-identify 不认同)'
    ],
    bestFor: ['anxiety', 'anger', 'sadness', 'stress'],
    timing: RegulationTiming.EARLY,
    effectiveness: {
      shortTerm: 0.6,
      longTerm: 0.8,
      cognitiveCost: 'low'
    }
  }
};

/**
 * 认知重评策略库
 */
const CognitiveReappraisalStrategies = {
  /**
   * 重新解释 (Reinterpretation)
   * 改变对情境的理解和解释
   */
  REINTERPRETATION: {
    name: '重新解释',
    description: '从不同角度理解同一事件',
    techniques: [
      '成长视角 ("这件事教会了我什么？")',
      '他人视角 ("如果是我的朋友遇到这事，我会怎么安慰他？")',
      '时间视角 ("一年后这件事还重要吗？")',
      '积极重构 ("这虽然困难，但也是机会")',
      '去个人化 ("这不是针对我个人的")'
    ],
    bestFor: ['anger', 'sadness', 'disappointment', 'rejection'],
    timing: RegulationTiming.ANTECEDENT,
    effectiveness: {
      shortTerm: 0.7,
      longTerm: 0.8,
      cognitiveCost: 'medium'
    }
  },
  
  /**
   * 去中心化 (Decentering)
   * 从观察者视角看待自己的体验
   */
  DECENTERING: {
    name: '去中心化',
    description: '将自己从情境中抽离，以旁观者视角观察',
    techniques: [
      '第三人称自我对话 (用自己的名字而非"我")',
      '观察者想象 ("想象自己坐在剧院里看这一幕")',
      '时间旅行 ("未来的我会怎么看现在？")',
      '摄像机视角 ("如果有一台摄像机在记录，它会看到什么？")',
      '科学家视角 ("如果我是研究这个现象的科学家，我会怎么描述？")'
    ],
    bestFor: ['shame', 'embarrassment', 'anxiety', 'anger'],
    timing: RegulationTiming.EARLY,
    effectiveness: {
      shortTerm: 0.6,
      longTerm: 0.7,
      cognitiveCost: 'medium'
    }
  },
  
  /**
   * 意义建构 (Meaning Making)
   * 在困难情境中寻找意义和价值
   */
  MEANING_MAKING: {
    name: '意义建构',
    description: '从挑战中发现深层意义',
    techniques: [
      '价值连接 ("这件事与我的什么价值观相关？")',
      '成长叙事 ("这段经历如何让我成长？")',
      '帮助他人 ("我的经历能帮助到谁？")',
      '遗产思考 ("我想从这件事中创造什么？")',
      '存在意义 ("这如何让我更理解生命的意义？")'
    ],
    bestFor: ['grief', 'loss', 'trauma', 'existential_distress'],
    timing: RegulationTiming.LATE,
    effectiveness: {
      shortTerm: 0.4,
      longTerm: 0.9,
      cognitiveCost: 'high'
    }
  }
};

/**
 * 反应调整策略库
 */
const ResponseModulationStrategies = {
  /**
   * 渐进肌肉放松 (Progressive Muscle Relaxation)
   * 系统性地紧张和放松肌肉群
   */
  PMR: {
    name: '渐进肌肉放松',
    description: '通过肌肉紧张 - 放松循环释放身体紧张',
    techniques: [
      '脚部：蜷缩脚趾 5 秒，然后放松 10 秒',
      '小腿：绷紧小腿肌肉 5 秒，然后放松',
      '大腿：收紧大腿 5 秒，然后放松',
      '手部：握紧拳头 5 秒，然后松开',
      '手臂：弯曲二头肌 5 秒，然后放松',
      '肩膀：耸肩至耳朵 5 秒，然后放下',
      '面部：皱眉 5 秒，然后舒展',
      '全身：同时紧张所有肌肉 5 秒，然后完全放松'
    ],
    bestFor: ['anxiety', 'anger', 'stress', 'tension'],
    timing: RegulationTiming.PEAK,
    effectiveness: {
      shortTerm: 0.8,
      longTerm: 0.6,
      cognitiveCost: 'low'
    }
  },
  
  /**
   * 深呼吸调节 (Diaphragmatic Breathing)
   * 使用横膈膜进行深而慢的呼吸
   */
  DEEP_BREATHING: {
    name: '深呼吸调节',
    description: '通过深慢呼吸激活副交感神经系统',
    techniques: [
      '4-7-8 呼吸法 (吸气 4 秒，屏息 7 秒，呼气 8 秒)',
      '方块呼吸 (吸 4 秒 - 停 4 秒 - 呼 4 秒 - 停 4 秒)',
      '腹式呼吸 (手放腹部，感受起伏)',
      '延长呼气 (呼气时间是吸气的 2 倍)',
      '交替鼻孔呼吸'
    ],
    bestFor: ['anxiety', 'panic', 'anger', 'acute_stress'],
    timing: RegulationTiming.EARLY,
    effectiveness: {
      shortTerm: 0.8,
      longTerm: 0.6,
      cognitiveCost: 'low'
    }
  },
  
  /**
   * 安全地宣泄 (Safe Expression)
   * 在安全环境中表达情绪
   */
  SAFE_EXPRESSION: {
    name: '安全地宣泄',
    description: '以不伤害自己和他人的方式表达情绪',
    techniques: [
      '情绪写作 (自由书写 15 分钟，不审查)',
      '空椅技术 (对空椅子说话)',
      '艺术表达 (绘画、涂鸦情绪)',
      '身体释放 (跑步、打枕头、大声喊叫)',
      '向信任的人倾诉'
    ],
    bestFor: ['anger', 'grief', 'frustration', 'sadness'],
    timing: RegulationTiming.LATE,
    effectiveness: {
      shortTerm: 0.7,
      longTerm: 0.7,
      cognitiveCost: 'low'
    }
  }
};

// ============ 情绪调节增强模块 ============

class EmotionRegulationEnhancementModule {
  constructor(options = {}) {
    // 策略使用历史
    this.strategyHistory = [];
    
    // 策略效果评估档案
    this.effectivenessProfile = {};
    
    // 当前调节状态
    this.currentRegulationState = null;
    
    // 个性化策略偏好
    this.personalPreferences = {};
    
    // 初始化策略库
    this.strategyLibrary = {
      ...AttentionalStrategies,
      ...CognitiveReappraisalStrategies,
      ...ResponseModulationStrategies
    };
    
    console.log('[EmotionRegulationEnhancement] 模块初始化完成');
  }
  
  /**
   * 推荐调节策略
   * @param {string} emotion - 当前情绪
   * @param {number} intensity - 情绪强度 (1-10)
   * @param {object} context - 情境信息
   * @returns {object} 推荐的策略
   */
  recommendStrategy(emotion, intensity, context = {}) {
    const recommendations = [];
    
    // 基于情绪类型筛选策略
    const suitableStrategies = this.findSuitableStrategies(emotion);
    
    // 基于强度调整推荐
    const intensityAdjusted = this.adjustForIntensity(suitableStrategies, intensity);
    
    // 基于时机筛选
    const timing = this.determineTiming(intensity, context);
    const timingAdjusted = this.adjustForTiming(intensityAdjusted, timing);
    
    // 基于个人偏好排序
    const personalized = this.applyPersonalPreferences(timingAdjusted);
    
    // 返回最佳策略
    const bestStrategy = personalized[0];
    
    if (bestStrategy) {
      this.currentRegulationState = {
        emotion,
        intensity,
        context,
        recommendedStrategy: bestStrategy.key,
        timing,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      strategy: bestStrategy,
      alternatives: personalized.slice(1, 3),
      timing,
      rationale: this.generateRationale(bestStrategy, emotion, intensity)
    };
  }
  
  /**
   * 查找适合某情绪的策略
   */
  findSuitableStrategies(emotion) {
    const suitable = [];
    const emotionLower = emotion.toLowerCase();
    
    Object.entries(this.strategyLibrary).forEach(([key, strategy]) => {
      if (strategy.bestFor.some(e => e.toLowerCase() === emotionLower)) {
        suitable.push({ key, ...strategy });
      }
    });
    
    // 如果没有特定策略，返回通用策略
    if (suitable.length === 0) {
      return [
        { key: 'MINDFUL_AWARENESS', ...AttentionalStrategies.MINDFUL_AWARENESS },
        { key: 'DEEP_BREATHING', ...ResponseModulationStrategies.DEEP_BREATHING }
      ];
    }
    
    return suitable;
  }
  
  /**
   * 基于强度调整推荐
   */
  adjustForIntensity(strategies, intensity) {
    // 高强度：优先快速生效的生理调节
    if (intensity >= 8) {
      return strategies.filter(s => 
        s.effectiveness.shortTerm >= 0.7 && s.cognitiveCost === 'low'
      );
    }
    
    // 中等强度：平衡短期和长期效果
    if (intensity >= 5) {
      return strategies.sort((a, b) => 
        (b.effectiveness.shortTerm + b.effectiveness.longTerm) - 
        (a.effectiveness.shortTerm + a.effectiveness.longTerm)
      );
    }
    
    // 低强度：优先长期有益的策略
    return strategies.sort((a, b) => 
      b.effectiveness.longTerm - a.effectiveness.longTerm
    );
  }
  
  /**
   * 确定调节时机
   */
  determineTiming(intensity, context) {
    if (context.preventive) return RegulationTiming.ANTECEDENT;
    if (intensity >= 8) return RegulationTiming.PEAK;
    if (intensity >= 5) return RegulationTiming.EARLY;
    return RegulationTiming.LATE;
  }
  
  /**
   * 基于时机调整策略
   */
  adjustForTiming(strategies, timing) {
    return strategies
      .filter(s => s.timing === timing || this.isTimingCompatible(s.timing, timing))
      .sort((a, b) => {
        if (a.timing === timing && b.timing !== timing) return -1;
        if (a.timing !== timing && b.timing === timing) return 1;
        return 0;
      });
  }
  
  /**
   * 检查时机兼容性
   */
  isTimingCompatible(strategyTiming, currentTiming) {
    const order = [
      RegulationTiming.ANTECEDENT,
      RegulationTiming.EARLY,
      RegulationTiming.PEAK,
      RegulationTiming.LATE
    ];
    
    const strategyIndex = order.indexOf(strategyTiming);
    const currentIndex = order.indexOf(currentTiming);
    
    // 策略时机应在当前时机之前或相同
    return strategyIndex <= currentIndex;
  }
  
  /**
   * 应用个人偏好
   */
  applyPersonalPreferences(strategies) {
    if (Object.keys(this.personalPreferences).length === 0) {
      return strategies;
    }
    
    return strategies.sort((a, b) => {
      const aPref = this.personalPreferences[a.key] || 0;
      const bPref = this.personalPreferences[b.key] || 0;
      return bPref - aPref;
    });
  }
  
  /**
   * 生成推荐理由
   */
  generateRationale(strategy, emotion, intensity) {
    const rationale = {
      emotionMatch: `该策略对${emotion}情绪有实证支持的效果`,
      intensityMatch: intensity >= 8 
        ? '由于情绪强度较高，推荐快速生效的技巧' 
        : intensity >= 5 
          ? '该策略平衡了短期缓解和长期益处' 
          : '该策略有助于长期的情绪健康',
      evidenceBase: '基于 Gross 情绪调节过程模型和多项心理学研究'
    };
    
    return rationale;
  }
  
  /**
   * 记录策略使用
   * @param {string} strategyKey - 策略键
   * @param {object} outcome - 使用结果
   */
  recordUsage(strategyKey, outcome) {
    const record = {
      strategyKey,
      timestamp: new Date().toISOString(),
      ...this.currentRegulationState,
      outcome
    };
    
    this.strategyHistory.push(record);
    
    // 更新效果评估
    this.updateEffectivenessProfile(strategyKey, outcome);
    
    // 更新个人偏好
    this.updatePersonalPreference(strategyKey, outcome.effectiveness);
    
    // 保留最近 200 条记录
    if (this.strategyHistory.length > 200) {
      this.strategyHistory.shift();
    }
  }
  
  /**
   * 更新效果评估档案
   */
  updateEffectivenessProfile(strategyKey, outcome) {
    if (!this.effectivenessProfile[strategyKey]) {
      this.effectivenessProfile[strategyKey] = {
        usageCount: 0,
        totalEffectiveness: 0,
        byEmotion: {},
        byIntensity: { low: 0, medium: 0, high: 0 },
        byContext: {}
      };
    }
    
    const profile = this.effectivenessProfile[strategyKey];
    profile.usageCount++;
    profile.totalEffectiveness += outcome.effectiveness;
    
    // 按情绪分类
    const emotion = outcome.emotion || 'unknown';
    if (!profile.byEmotion[emotion]) {
      profile.byEmotion[emotion] = { count: 0, totalEffectiveness: 0 };
    }
    profile.byEmotion[emotion].count++;
    profile.byEmotion[emotion].totalEffectiveness += outcome.effectiveness;
    
    // 按强度分类
    const intensity = outcome.intensity || 5;
    const intensityCategory = intensity >= 8 ? 'high' : intensity >= 5 ? 'medium' : 'low';
    profile.byIntensity[intensityCategory] += outcome.effectiveness;
  }
  
  /**
   * 更新个人偏好
   */
  updatePersonalPreference(strategyKey, effectiveness) {
    const current = this.personalPreferences[strategyKey] || 0;
    // 移动平均：新值权重 0.3，旧值权重 0.7
    this.personalPreferences[strategyKey] = current * 0.7 + effectiveness * 0.3;
  }
  
  /**
   * 获取策略详细信息
   * @param {string} strategyKey - 策略键
   * @returns {object} 策略详情
   */
  getStrategyDetails(strategyKey) {
    const strategy = this.strategyLibrary[strategyKey];
    if (!strategy) {
      return null;
    }
    
    return {
      ...strategy,
      effectivenessProfile: this.effectivenessProfile[strategyKey] || null,
      personalPreference: this.personalPreferences[strategyKey] || 0
    };
  }
  
  /**
   * 获取所有可用策略
   * @returns {array} 策略列表
   */
  getAllStrategies() {
    return Object.entries(this.strategyLibrary).map(([key, strategy]) => ({
      key,
      name: strategy.name,
      description: strategy.description,
      bestFor: strategy.bestFor,
      effectiveness: strategy.effectiveness
    }));
  }
  
  /**
   * 获取使用历史
   * @param {number} limit - 返回记录数
   * @returns {array} 历史记录
   */
  getHistory(limit = 20) {
    return this.strategyHistory.slice(-limit);
  }
  
  /**
   * 获取效果报告
   * @returns {object} 效果评估报告
   */
  generateEffectivenessReport() {
    const report = {
      totalUsage: this.strategyHistory.length,
      strategiesUsed: Object.keys(this.effectivenessProfile).length,
      topStrategies: [],
      byEmotion: {},
      recommendations: []
    };
    
    // 计算各策略平均效果
    Object.entries(this.effectivenessProfile).forEach(([key, profile]) => {
      const avgEffectiveness = profile.totalEffectiveness / profile.usageCount;
      report.topStrategies.push({
        key,
        name: this.strategyLibrary[key]?.name || key,
        usageCount: profile.usageCount,
        avgEffectiveness: avgEffectiveness.toFixed(2)
      });
    });
    
    // 按效果排序
    report.topStrategies.sort((a, b) => 
      parseFloat(b.avgEffectiveness) - parseFloat(a.avgEffectiveness)
    );
    
    // 生成个性化建议
    if (report.topStrategies.length > 0) {
      const best = report.topStrategies[0];
      report.recommendations.push(
        `您使用效果最好的策略是"${best.name}"，建议继续练习和深化这一技能。`
      );
    }
    
    return report;
  }
  
  /**
   * 获取模块信息
   * @returns {object} 模块信息
   */
  getInfo() {
    return {
      name: 'EmotionRegulationEnhancementModule',
      version: '3.14.0',
      description: '情绪调节增强模块 - 基于 Gross 过程模型和 SEP 情绪理论',
      theoreticalFoundations: [
        'Gross Emotion Regulation Process Model',
        'SEP Emotion Components Theory',
        'Cognitive Reappraisal Research',
        'Attentional Deployment Studies',
        'Response Modulation Techniques'
      ],
      strategyCount: Object.keys(this.strategyLibrary).length,
      strategiesByCategory: {
        attentional: Object.keys(AttentionalStrategies).length,
        cognitive: Object.keys(CognitiveReappraisalStrategies).length,
        response: Object.keys(ResponseModulationStrategies).length
      },
      totalUsageCount: this.strategyHistory.length,
      uniqueStrategiesUsed: Object.keys(this.effectivenessProfile).length
    };
  }
}

// ============ 导出 ============

module.exports = {
  EmotionRegulationEnhancementModule,
  RegulationStrategies,
  EffectivenessDimensions,
  RegulationTiming,
  AttentionalStrategies,
  CognitiveReappraisalStrategies,
  ResponseModulationStrategies
};
