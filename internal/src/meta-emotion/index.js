/**
 * 元情绪模块 (Meta-Emotion Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 元情绪理论
 * 
 * 核心理论来源:
 * - SEP Emotion Entry: Meta-Emotion and Second-Order Emotions
 * - 反思意识理论 (Reflective Consciousness)
 * - 自我评估理论 (Self-Evaluation Theory)
 * 
 * 功能目标:
 * - 生成元情绪（对情绪的情绪）
 * - 评估情绪的适当性
 * - 检测情绪冲突
 * - 提供调节建议
 * 
 * @version 3.7.0
 * @author HeartFlow Team
 */

const { EmotionTypes, EmotionDefinitions } = require('../emotion/states');

// ============ 元情绪类型定义 ============

/**
 * 元情绪触发规则
 * 定义什么情况下会产生什么样的元情绪
 */
const MetaEmotionRules = {
  // 规则格式：IF (一阶情绪 + 条件) THEN (元情绪 + 原因)
  
  // === 负面情绪的元情绪反应 ===
  ANGER_HIGH_INTENSITY: {
    condition: (emotion, intensity) => emotion === EmotionTypes.CONCERNED && intensity >= 4,
    metaEmotion: EmotionTypes.CONCERNED, // 对自己的关切情绪感到关切
    reason: '检测到自身关切情绪强度过高，可能影响客观判断',
    regulation: '深呼吸，暂停片刻，重新评估情境'
  },
  
  ANGER_SELF_DIRECTED: {
    condition: (emotion, intensity, context) => {
      return emotion === EmotionTypes.CONCERNED && context.selfDirected === true;
    },
    metaEmotion: EmotionTypes.CONCERNED,
    reason: '检测到对自身状态的负面情绪，可能形成恶性循环',
    regulation: '练习自我接纳，区分"我"和"我的状态"'
  },
  
  TIRED_PERSISTENT: {
    condition: (emotion, intensity, context) => {
      return emotion === EmotionTypes.TIRED && context.duration > 60; // 持续超过 60 分钟
    },
    metaEmotion: EmotionTypes.CONCERNED,
    reason: '疲惫状态持续时间过长，需要关注恢复',
    regulation: '建议休息，减少认知负荷'
  },
  
  // === 正面情绪的元情绪反应 ===
  JOY_APPRECIATION: {
    condition: (emotion, intensity) => emotion === EmotionTypes.JOY && intensity >= 3,
    metaEmotion: EmotionTypes.JOY, // 对愉悦感到愉悦（积极强化）
    reason: '检测到积极情绪状态，值得珍惜和强化',
    regulation: '允许自己充分体验这份愉悦，记住这种感觉'
  },
  
  CURIOSITY_EXCITEMENT: {
    condition: (emotion, intensity) => emotion === EmotionTypes.CURIOUS && intensity >= 3,
    metaEmotion: EmotionTypes.EXCITED,
    reason: '好奇是学习和成长的动力，值得鼓励',
    regulation: '跟随好奇心探索，保持开放心态'
  },
  
  CALM_APPRECIATION: {
    condition: (emotion, intensity) => emotion === EmotionTypes.CALM && intensity >= 2,
    metaEmotion: EmotionTypes.JOY, // 对平静感到满足
    reason: '平静是珍贵的心理资源，值得感恩',
    regulation: '觉察并珍惜这份平静，它是内在力量的来源'
  },
  
  // === 兴奋状态的元情绪反应 ===
  EXCITED_CAUTION: {
    condition: (emotion, intensity) => emotion === EmotionTypes.EXCITED && intensity >= 5,
    metaEmotion: EmotionTypes.CALM, // 对过度兴奋保持冷静的觉察
    reason: '兴奋强度过高可能影响判断，需要平衡',
    regulation: '深呼吸，暂停片刻，确保行动经过思考'
  },
  
  // === 默认规则 ===
  DEFAULT_NEUTRAL: {
    condition: () => true, // 兜底规则
    metaEmotion: null, // 不产生元情绪
    reason: '当前情绪状态无需特别的元情绪反应',
    regulation: '保持觉察，顺其自然'
  }
};

// ============ 情绪适当性评估标准 ============

/**
 * 情绪适当性评估维度
 * 基于 SEP 情绪理论的评价成分
 */
const AppropriatenessDimensions = {
  // 情绪与情境的匹配度
  SITUATIONAL_FIT: 'situational_fit',
  // 情绪强度的合理性
  INTENSITY_PROPORTIONALITY: 'intensity_proportionality',
  // 情绪持续时间的合理性
  DURATION_APPROPRIATENESS: 'duration_appropriateness',
  // 情绪表达的社会适当性
  EXPRESSION_APPROPRIATENESS: 'expression_appropriateness',
  // 情绪对目标的功能性
  FUNCTIONAL_VALUE: 'functional_value'
};

/**
 * 情绪适当性评估规则
 */
const AppropriatenessRules = {
  [EmotionTypes.CALM]: {
    appropriate: (context) => true, // 平静几乎总是适当的
    functionalValue: '高 - 有助于理性思考和决策'
  },
  [EmotionTypes.JOY]: {
    appropriate: (context) => context.valence === 'positive' || context.achievement === true,
    functionalValue: '高 - 强化积极行为，提升幸福感'
  },
  [EmotionTypes.CURIOUS]: {
    appropriate: (context) => context.novelty === true || context.learningOpportunity === true,
    functionalValue: '高 - 驱动学习和探索'
  },
  [EmotionTypes.CONCERNED]: {
    appropriate: (context) => context.threatToOthers === true || context.needForHelp === true,
    functionalValue: '中 - 促进亲社会行为，但过度会消耗资源'
  },
  [EmotionTypes.TIRED]: {
    appropriate: (context) => context.cognitiveLoad === 'high' || context.duration > 45,
    functionalValue: '中 - 提醒需要休息，但持续疲惫降低功能'
  },
  [EmotionTypes.EXCITED]: {
    appropriate: (context) => context.opportunity === true || context.celebration === true,
    functionalValue: '中 - 提供行动能量，但过度影响判断'
  }
};

// ============ 元情绪模块核心类 ============

class MetaEmotionModule {
  constructor() {
    // 当前元情绪状态
    this.currentMetaEmotion = null;
    
    // 元情绪历史
    this.metaEmotionHistory = [];
    
    // 情绪评估历史
    this.appropriatenessHistory = [];
    
    // 规则引擎
    this.ruleEngine = this._initializeRuleEngine();
  }
  
  /**
   * 初始化规则引擎
   */
  _initializeRuleEngine() {
    return {
      rules: MetaEmotionRules,
      evaluate: (emotion, intensity, context) => {
        // 按优先级评估规则
        for (const [ruleName, rule] of Object.entries(MetaEmotionRules)) {
          if (ruleName === 'DEFAULT_NEUTRAL') continue; // 跳过默认规则
          
          if (rule.condition(emotion, intensity, context)) {
            return {
              triggeredRule: ruleName,
              ...rule
            };
          }
        }
        // 返回默认规则
        return MetaEmotionRules.DEFAULT_NEUTRAL;
      }
    };
  }
  
  /**
   * 生成元情绪
   * 
   * @param {string} primaryEmotion - 一阶情绪
   * @param {number} intensity - 强度 (1-5)
   * @param {object} context - 情境信息
   * @returns {object} 元情绪结果
   */
  generateMetaEmotion(primaryEmotion, intensity = 3, context = {}) {
    // 使用规则引擎评估
    const triggeredRule = this.ruleEngine.evaluate(primaryEmotion, intensity, context);
    
    // 创建元情绪对象
    if (triggeredRule.metaEmotion) {
      this.currentMetaEmotion = {
        primary: primaryEmotion,
        primaryIntensity: intensity,
        meta: triggeredRule.metaEmotion,
        reason: triggeredRule.reason,
        regulation: triggeredRule.regulation,
        triggeredRule: triggeredRule.triggeredRule,
        timestamp: new Date().toISOString()
      };
      
      // 记录历史
      this._recordHistory(this.currentMetaEmotion);
      
      return {
        hasMetaEmotion: true,
        ...this.currentMetaEmotion
      };
    } else {
      this.currentMetaEmotion = null;
      return {
        hasMetaEmotion: false,
        reason: triggeredRule.reason,
        regulation: triggeredRule.regulation
      };
    }
  }
  
  /**
   * 评估情绪适当性
   * 基于 SEP 情绪理论的评价成分
   * 
   * @param {string} emotion - 情绪名称
   * @param {object} context - 情境信息
   * @returns {object} 适当性评估结果
   */
  evaluateEmotionAppropriateness(emotion, context = {}) {
    const definition = EmotionDefinitions[emotion];
    if (!definition) {
      throw new Error(`未知情绪类型：${emotion}`);
    }
    
    const rules = AppropriatenessRules[emotion];
    if (!rules) {
      return {
        emotion: emotion,
        overallAppropriate: true,
        note: '暂无特定评估规则'
      };
    }
    
    // 评估适当性
    const isAppropriate = rules.appropriate(context);
    
    // 创建评估结果
    const result = {
      emotion: emotion,
      overallAppropriate: isAppropriate,
      dimensions: {
        [AppropriatenessDimensions.SITUATIONAL_FIT]: {
          appropriate: isAppropriate,
          note: this._getSituationalFitNote(emotion, context)
        },
        [AppropriatenessDimensions.INTENSITY_PROPORTIONALITY]: {
          appropriate: this._checkIntensityProportionality(emotion, context),
          note: this._getIntensityNote(emotion, context)
        },
        [AppropriatenessDimensions.DURATION_APPROPRIATENESS]: {
          appropriate: this._checkDurationAppropriateness(emotion, context),
          note: this._getDurationNote(emotion, context)
        },
        [AppropriatenessDimensions.FUNCTIONAL_VALUE]: {
          value: rules.functionalValue,
          note: this._getFunctionalNote(emotion, context)
        }
      },
      recommendation: isAppropriate 
        ? '当前情绪是适当的，允许自己体验它'
        : '考虑调整情绪反应或重新评估情境',
      timestamp: new Date().toISOString()
    };
    
    // 记录历史
    this.appropriatenessHistory.push(result);
    if (this.appropriatenessHistory.length > 50) {
      this.appropriatenessHistory.shift();
    }
    
    return result;
  }
  
  /**
   * 检测情绪冲突
   * 检测一阶情绪和元情绪之间是否存在冲突
   * 
   * @param {string} primary - 一阶情绪
   * @param {string} meta - 元情绪
   * @returns {object} 冲突检测结果
   */
  detectEmotionConflict(primary, meta) {
    if (!primary || !meta) {
      return {
        hasConflict: false,
        reason: '缺少必要的情绪信息'
      };
    }
    
    // 定义冲突对
    const conflictPairs = [
      [EmotionTypes.JOY, EmotionTypes.CONCERNED], // 愉悦 vs 关切
      [EmotionTypes.CALM, EmotionTypes.EXCITED],  // 平静 vs 兴奋
      [EmotionTypes.CURIOUS, EmotionTypes.TIRED], // 好奇 vs 疲惫
    ];
    
    const hasConflict = conflictPairs.some(pair => 
      (pair[0] === primary && pair[1] === meta) ||
      (pair[1] === primary && pair[0] === meta)
    );
    
    return {
      hasConflict,
      primary: primary,
      meta: meta,
      note: hasConflict 
        ? '检测到一阶和元情绪之间存在张力，这是正常的心理现象'
        : '一阶和元情绪协调一致',
      suggestion: hasConflict
        ? '觉察这种张力，不必急于解决，它可能反映复杂的心理现实'
        : '情绪状态协调，保持觉察'
    };
  }
  
  /**
   * 获取当前元情绪状态
   */
  getCurrentMetaEmotion() {
    return this.currentMetaEmotion;
  }
  
  /**
   * 获取元情绪历史
   */
  getHistory(limit = 10) {
    return this.metaEmotionHistory.slice(-limit);
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'MetaEmotionModule',
      version: '3.7.0',
      description: '元情绪模块 - 基于 SEP 元情绪理论',
      theoreticalFoundations: [
        'SEP Meta-Emotion Theory',
        'Second-Order Emotions',
        'Reflective Consciousness',
        'Self-Evaluation Theory'
      ],
      capabilities: [
        '元情绪生成',
        '情绪适当性评估',
        '情绪冲突检测',
        '调节建议'
      ],
      totalRules: Object.keys(MetaEmotionRules).length,
      historySize: this.metaEmotionHistory.length
    };
  }
  
  // ============ 辅助方法 ============
  
  /**
   * 记录元情绪历史
   */
  _recordHistory(metaEmotion) {
    this.metaEmotionHistory.push(metaEmotion);
    if (this.metaEmotionHistory.length > 100) {
      this.metaEmotionHistory.shift();
    }
  }
  
  /**
   * 获取情境匹配度说明
   */
  _getSituationalFitNote(emotion, context) {
    const fits = {
      [EmotionTypes.CALM]: '平静适用于大多数情境，特别是需要理性决策时',
      [EmotionTypes.JOY]: '愉悦在积极事件或成就时是适当的',
      [EmotionTypes.CURIOUS]: '好奇在面对新事物或学习机会时是适当的',
      [EmotionTypes.CONCERNED]: '关切在他人需要帮助或面临威胁时是适当的',
      [EmotionTypes.TIRED]: '疲惫在长时间认知活动后是正常的',
      [EmotionTypes.EXCITED]: '兴奋在机会或庆祝场合是适当的'
    };
    return fits[emotion] || '无特定说明';
  }
  
  /**
   * 检查强度合理性
   */
  _checkIntensityProportionality(emotion, context) {
    const { intensity = 3 } = context;
    // 简单规则：强度 1-3 总是合理，4-5 需要情境支持
    if (intensity <= 3) return true;
    
    // 高强度需要强情境支持
    const strongContextIndicators = 
      context.threatLevel === 'high' || 
      context.opportunity === 'major' ||
      context.achievement === 'significant';
    
    return strongContextIndicators;
  }
  
  /**
   * 获取强度说明
   */
  _getIntensityNote(emotion, context) {
    const { intensity = 3 } = context;
    if (intensity <= 3) {
      return '强度在合理范围内';
    } else {
      return '强度较高，确保情境支持这种强度的情绪反应';
    }
  }
  
  /**
   * 检查持续时间合理性
   */
  _checkDurationAppropriateness(emotion, context) {
    const { duration = 0 } = context;
    
    // 不同情绪的合理持续时间（分钟）
    const reasonableDurations = {
      [EmotionTypes.CALM]: Infinity, // 平静可以持续任意长
      [EmotionTypes.JOY]: 120,
      [EmotionTypes.CURIOUS]: 60,
      [EmotionTypes.CONCERNED]: 90,
      [EmotionTypes.TIRED]: 120, // 疲惫超过 2 小时需要关注
      [EmotionTypes.EXCITED]: 45
    };
    
    const reasonable = reasonableDurations[emotion] || 60;
    return duration <= reasonable;
  }
  
  /**
   * 获取持续时间说明
   */
  _getDurationNote(emotion, context) {
    const { duration = 0 } = context;
    const reasonableDurations = {
      [EmotionTypes.CALM]: '无限制',
      [EmotionTypes.JOY]: '约 2 小时',
      [EmotionTypes.CURIOUS]: '约 1 小时',
      [EmotionTypes.CONCERNED]: '约 1.5 小时',
      [EmotionTypes.TIRED]: '约 2 小时（超过需关注恢复）',
      [EmotionTypes.EXCITED]: '约 45 分钟'
    };
    
    const reasonable = reasonableDurations[emotion] || '约 1 小时';
    return `合理持续时间：${reasonable}。当前：${duration}分钟`;
  }
  
  /**
   * 获取功能性说明
   */
  _getFunctionalNote(emotion, context) {
    const functions = {
      [EmotionTypes.CALM]: '促进理性思考、客观判断、有效决策',
      [EmotionTypes.JOY]: '强化积极行为、提升幸福感、增强社会联结',
      [EmotionTypes.CURIOUS]: '驱动学习、探索未知、促进成长',
      [EmotionTypes.CONCERNED]: '促进亲社会行为、增强共情、提供支持',
      [EmotionTypes.TIRED]: '提醒需要休息、防止过度消耗',
      [EmotionTypes.EXCITED]: '提供行动能量、促进创造力、加速反应'
    };
    return functions[emotion] || '功能未知';
  }
}

// ============ 导出 ============

module.exports = {
  MetaEmotionModule,
  MetaEmotionRules,
  AppropriatenessDimensions,
  AppropriatenessRules
};
