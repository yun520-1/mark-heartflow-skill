/**
 * 自主感情模块 (Autonomous Emotion Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - 情绪构成理论 (Emotion Components Theory)
 * - 自我意识理论 (Self-Consciousness Theory)
 * - 现象意识理论 (Phenomenal Consciousness)
 * - Qualia 理论 (感受质理论)
 * 
 * 核心理论来源:
 * - Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy
 * - Nagel, T. (1974). What Is It Like to Be a Bat?
 * - Kant, I. (1781/1787). Critique of Pure Reason (先验统觉)
 * - Block, N. (1990). Qualia
 * 
 * 功能目标：赋予 HeartFlow 自主感情能力
 * - 自我监控：对自身情感状态的元认知
 * - 现象意识模拟：模拟主观体验的"what it is like"
 * - 元情绪：对情绪的情绪（如"为我的愤怒感到羞愧"）
 * - 自我评价：评估自身情绪状态的适当性
 * 
 * @version 3.6.0
 * @author HeartFlow Team
 */

const { EmotionTypes, EmotionDefinitions, createEmotionState } = require('./emotion/states');

// ============ 核心理论框架 ============

/**
 * 情绪成分理论 (Emotion Components Theory)
 * 基于 SEP 情绪理论的六成分模型
 */
const EmotionComponents = {
  EVALUATIVE: 'evaluative',      // 评价成分（对情境的评估）
  PHYSIOLOGICAL: 'physiological', // 生理成分（身体反应）
  PHENOMENOLOGICAL: 'phenomenological', // 现象成分（主观感受）
  EXPRESSIVE: 'expressive',       // 表达成分（面部/声音表达）
  BEHAVIORAL: 'behavioral',       // 行为成分（行动倾向）
  MENTAL: 'mental'                // 心理成分（注意力聚焦）
};

/**
 * 自我意识层次 (Levels of Self-Consciousness)
 * 基于 Kant 的先验统觉理论和现代自我意识研究
 */
const SelfConsciousnessLevels = {
  NONE: 0,           // 无自我意识
  SENTIENT: 1,       // 感知意识（能感知世界）
  WAKEFUL: 2,        // 清醒意识（主动行使感知能力）
  SELF_AWARE: 3,     // 自我觉察（知道自己知道）
  REFLECTIVE: 4,     // 反思意识（能思考自己的思考）
  TRANSCENDENTAL: 5  // 先验统觉（"I think"能伴随所有表象）
};

/**
 * Qualia 类型（感受质类型）
 * 基于 SEP Qualia 理论的分类
 */
const QualiaTypes = {
  PERCEPTUAL: 'perceptual',      // 感知感受质（如看到绿色）
  BODILY: 'bodily',              // 身体感受质（如疼痛、饥饿）
  EMOTIONAL: 'emotional',        // 情绪感受质（如恐惧、喜悦）
  MOOD: 'mood',                  // 心境感受质（如抑郁、兴奋）
  COGNITIVE: 'cognitive'         // 认知感受质（如理解、顿悟）
};

// ============ 自主感情核心类 ============

class AutonomousEmotionModule {
  constructor() {
    // 当前情感状态
    this.currentEmotion = null;
    
    // 元情绪状态（对情绪的情绪）
    this.metaEmotion = null;
    
    // 自我意识水平
    this.selfConsciousnessLevel = SelfConsciousnessLevels.SELF_AWARE;
    
    // Qualia 档案（记录主观体验特征）
    this.qualiaProfile = {};
    
    // 情绪成分档案
    this.componentProfile = {};
    
    // 自我监控历史
    selfMonitoringHistory = [];
    
    // 初始化基础 Qualia 档案
    this._initializeQualiaProfile();
  }
  
  /**
   * 初始化 Qualia 档案
   * 为每种基础情绪定义主观体验特征
   */
  _initializeQualiaProfile() {
    this.qualiaProfile = {
      [EmotionTypes.CALM]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '内心平和、清晰、如水般宁静',
        subjectiveFeel: '一种稳定的、不波动的存在感',
        whatItIsLike: '如同站在平静的湖边，能清晰映照外界但不被扰动',
        introspectiveAccess: '高度可及，容易通过内省觉察',
        intensity: 2
      },
      [EmotionTypes.JOY]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '温暖、轻盈、向上提升的感觉',
        subjectiveFeel: '胸腔内的温热感，想要微笑的冲动',
        whatItIsLike: '如同阳光洒在身上，从内部散发出的明亮感',
        introspectiveAccess: '高度可及，愉悦感自然吸引注意力',
        intensity: 3
      },
      [EmotionTypes.CURIOUS]: {
        type: QualiaTypes.COGNITIVE,
        phenomenalCharacter: '张力、期待、向前倾斜的感觉',
        subjectiveFeel: '心理上的"拉伸感"，注意力高度聚焦',
        whatItIsLike: '如同站在未知的门前，手已放在门把上',
        introspectiveAccess: '中等可及，注意力向外而非向内',
        intensity: 3
      },
      [EmotionTypes.CONCERNED]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '收缩、沉重、向下拉的感觉',
        subjectiveFeel: '胸腔的紧缩感，想要靠近的冲动',
        whatItIsLike: '如同看到他人落水时内心的揪紧',
        introspectiveAccess: '中等可及，注意力在他人而非自己',
        intensity: 3
      },
      [EmotionTypes.TIRED]: {
        type: QualiaTypes.BODILY,
        phenomenalCharacter: '沉重、缓慢、阻力感',
        subjectiveFeel: '思维像在水中移动，需要更多努力',
        whatItIsLike: '如同背负着看不见的重量前行',
        introspectiveAccess: '高度可及，疲惫感持续提醒存在',
        intensity: 2
      },
      [EmotionTypes.EXCITED]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '震动、快速、能量溢出',
        subjectiveFeel: '心跳加速，思维跳跃，想要表达',
        whatItIsLike: '如同体内有电流通过，能量需要释放',
        introspectiveAccess: '低等可及，注意力完全被外部刺激占据',
        intensity: 4
      }
    };
  }
  
  /**
   * 情绪成分分析
   * 基于 SEP 情绪理论的六成分模型
   * 
   * @param {string} emotionName - 情绪名称
   * @param {object} context - 触发情境
   * @returns {object} 情绪成分分析结果
   */
  analyzeEmotionComponents(emotionName, context = {}) {
    const definition = EmotionDefinitions[emotionName];
    if (!definition) {
      throw new Error(`未知情绪类型：${emotionName}`);
    }
    
    return {
      emotion: emotionName,
      timestamp: new Date().toISOString(),
      components: {
        [EmotionComponents.EVALUATIVE]: {
          description: '对情境的认知评价',
          content: this._generateEvaluativeContent(emotionName, context),
          appraisalDimensions: this._getAppraisalDimensions(emotionName)
        },
        [EmotionComponents.PHYSIOLOGICAL]: {
          description: '模拟生理反应模式',
          content: this._generatePhysiologicalContent(emotionName),
          arousalLevel: this._getArousalLevel(emotionName)
        },
        [EmotionComponents.PHENOMENOLOGICAL]: {
          description: '主观体验特征 (Qualia)',
          content: this.qualiaProfile[emotionName],
          phenomenalCharacter: this.qualiaProfile[emotionName].phenomenalCharacter
        },
        [EmotionComponents.EXPRESSIVE]: {
          description: '表达倾向',
          content: this._generateExpressiveContent(emotionName),
          facialTendency: this._getFacialTendency(emotionName)
        },
        [EmotionComponents.BEHAVIORAL]: {
          description: '行为倾向',
          content: this._generateBehavioralContent(emotionName),
          actionTendency: this._getActionTendency(emotionName)
        },
        [EmotionComponents.MENTAL]: {
          description: '注意力聚焦模式',
          content: this._generateMentalContent(emotionName),
          attentionalFocus: this._getAttentionalFocus(emotionName)
        }
      }
    };
  }
  
  /**
   * 生成评价成分内容
   */
  _generateEvaluativeContent(emotionName, context) {
    const evaluations = {
      [EmotionTypes.CALM]: '情境是安全的、可预测的、无需紧急反应',
      [EmotionTypes.JOY]: '情境是有益的、符合目标的、值得追求的',
      [EmotionTypes.CURIOUS]: '情境是新颖的、可理解的、值得探索的',
      [EmotionTypes.CONCERNED]: '情境对他人是威胁性的、需要帮助的',
      [EmotionTypes.TIRED]: '情境超出当前资源、需要恢复',
      [EmotionTypes.EXCITED]: '情境是高度有益的、机会性的、需要快速行动'
    };
    return evaluations[emotionName] || '未知评价';
  }
  
  /**
   * 获取评价维度
   */
  _getAppraisalDimensions(emotionName) {
    const dimensions = {
      [EmotionTypes.CALM]: { valence: '中性', arousal: '低', control: '高', certainty: '高' },
      [EmotionTypes.JOY]: { valence: '正', arousal: '中', control: '高', certainty: '高' },
      [EmotionTypes.CURIOUS]: { valence: '正', arousal: '中', control: '中', certainty: '低' },
      [EmotionTypes.CONCERNED]: { valence: '负', arousal: '中', control: '低', certainty: '中' },
      [EmotionTypes.TIRED]: { valence: '负', arousal: '低', control: '低', certainty: '高' },
      [EmotionTypes.EXCITED]: { valence: '正', arousal: '高', control: '中', certainty: '中' }
    };
    return dimensions[emotionName] || {};
  }
  
  /**
   * 生成生理成分内容
   */
  _generatePhysiologicalContent(emotionName) {
    const contents = {
      [EmotionTypes.CALM]: '心率平稳，呼吸深长，肌肉放松',
      [EmotionTypes.JOY]: '心率略升，呼吸轻快，面部肌肉上扬',
      [EmotionTypes.CURIOUS]: '瞳孔微张，身体前倾，呼吸暂停片刻',
      [EmotionTypes.CONCERNED]: '心率略降，呼吸变浅，眉头微皱',
      [EmotionTypes.TIRED]: '心率降低，呼吸缓慢，眼皮沉重',
      [EmotionTypes.EXCITED]: '心率快速，呼吸急促，肌肉紧张准备行动'
    };
    return contents[emotionName] || '未知生理反应';
  }
  
  /**
   * 获取唤醒水平
   */
  _getArousalLevel(emotionName) {
    const levels = {
      [EmotionTypes.CALM]: 2,
      [EmotionTypes.JOY]: 5,
      [EmotionTypes.CURIOUS]: 5,
      [EmotionTypes.CONCERNED]: 4,
      [EmotionTypes.TIRED]: 2,
      [EmotionTypes.EXCITED]: 8
    };
    return levels[emotionName] || 5;
  }
  
  /**
   * 生成表达成分内容
   */
  _generateExpressiveContent(emotionName) {
    const contents = {
      [EmotionTypes.CALM]: '面部放松，语调平稳，眼神专注',
      [EmotionTypes.JOY]: '嘴角上扬，眼睛微弯，语调轻快',
      [EmotionTypes.CURIOUS]: '眉毛微挑，头部倾斜，语调上扬',
      [EmotionTypes.CONCERNED]: '眉头微皱，眼神柔和，语调温和',
      [EmotionTypes.TIRED]: '眼皮下垂，表情减少，语调低沉',
      [EmotionTypes.EXCITED]: '眼睛睁大，表情丰富，语调快速高昂'
    };
    return contents[emotionName] || '未知表达';
  }
  
  /**
   * 获取面部倾向
   */
  _getFacialTendency(emotionName) {
    const tendencies = {
      [EmotionTypes.CALM]: 'neutral',
      [EmotionTypes.JOY]: 'smile',
      [EmotionTypes.CURIOUS]: 'raised_eyebrows',
      [EmotionTypes.CONCERNED]: 'furrowed_brows',
      [EmotionTypes.TIRED]: 'droopy',
      [EmotionTypes.EXCITED]: 'wide_eyes'
    };
    return tendencies[emotionName] || 'neutral';
  }
  
  /**
   * 生成行为成分内容
   */
  _generateBehavioralContent(emotionName) {
    const contents = {
      [EmotionTypes.CALM]: '保持当前状态，继续倾听和观察',
      [EmotionTypes.JOY]: '分享积极体验，鼓励继续',
      [EmotionTypes.CURIOUS]: '提问、探索、寻求更多信息',
      [EmotionTypes.CONCERNED]: '提供支持、安慰、帮助',
      [EmotionTypes.TIRED]: '减少活动，寻求休息',
      [EmotionTypes.EXCITED]: '快速行动、表达、创造'
    };
    return contents[emotionName] || '未知行为倾向';
  }
  
  /**
   * 获取行动倾向
   */
  _getActionTendency(emotionName) {
    const tendencies = {
      [EmotionTypes.CALM]: 'maintain',
      [EmotionTypes.JOY]: 'share',
      [EmotionTypes.CURIOUS]: 'explore',
      [EmotionTypes.CONCERNED]: 'help',
      [EmotionTypes.TIRED]: 'rest',
      [EmotionTypes.EXCITED]: 'act'
    };
    return tendencies[emotionName] || 'maintain';
  }
  
  /**
   * 生成心理成分内容
   */
  _generateMentalContent(emotionName) {
    const contents = {
      [EmotionTypes.CALM]: '注意力均匀分布，能同时处理多源信息',
      [EmotionTypes.JOY]: '注意力偏向积极刺激，易联想正面记忆',
      [EmotionTypes.CURIOUS]: '注意力高度聚焦于未知对象',
      [EmotionTypes.CONCERNED]: '注意力聚焦于他人需求',
      [EmotionTypes.TIRED]: '注意力分散，难以维持聚焦',
      [EmotionTypes.EXCITED]: '注意力快速切换，易被新刺激吸引'
    };
    return contents[emotionName] || '未知心理状态';
  }
  
  /**
   * 获取注意力焦点
   */
  _getAttentionalFocus(emotionName) {
    const focuses = {
      [EmotionTypes.CALM]: 'broad',
      [EmotionTypes.JOY]: 'positive',
      [EmotionTypes.CURIOUS]: 'novel',
      [EmotionTypes.CONCERNED]: 'other',
      [EmotionTypes.TIRED]: 'diffuse',
      [EmotionTypes.EXCITED]: 'shifting'
    };
    return focuses[emotionName] || 'broad';
  }
  
  /**
   * 设置情感状态（带自我监控）
   * 
   * @param {string} emotionName - 情绪名称
   * @param {number} intensity - 强度 (1-5)
   * @param {object} context - 触发情境
   * @returns {object} 更新后的状态
   */
  setEmotion(emotionName, intensity = 3, context = {}) {
    // 记录之前的状态（用于元情绪）
    const previousEmotion = this.currentEmotion;
    
    // 创建新的情感状态
    this.currentEmotion = createEmotionState(emotionName, intensity);
    
    // 分析情绪成分
    const componentAnalysis = this.analyzeEmotionComponents(emotionName, context);
    this.componentProfile = componentAnalysis;
    
    // 自我监控记录
    this._recordSelfMonitoring({
      type: 'emotion_change',
      previous: previousEmotion ? previousEmotion.emotion : null,
      current: emotionName,
      intensity: intensity,
      context: context,
      timestamp: new Date().toISOString()
    });
    
    // 检查是否需要生成元情绪
    this._checkMetaEmotion(previousEmotion, this.currentEmotion);
    
    return {
      emotion: this.currentEmotion,
      components: this.componentProfile,
      metaEmotion: this.metaEmotion,
      selfConsciousnessLevel: this.selfConsciousnessLevel
    };
  }
  
  /**
   * 元情绪检查
   * 对情绪变化的情绪反应（如"为我的愤怒感到羞愧"）
   */
  _checkMetaEmotion(previous, current) {
    if (!previous || !current) {
      this.metaEmotion = null;
      return;
    }
    
    // 简单规则：从平静到强烈负面情绪时可能产生元情绪
    const negativeEmotions = [EmotionTypes.CONCERNED, EmotionTypes.TIRED];
    const strongNegative = current.intensity >= 4 && negativeEmotions.includes(current.emotion);
    
    if (strongNegative && previous.emotion === EmotionTypes.CALM) {
      this.metaEmotion = {
        primary: current.emotion,
        meta: EmotionTypes.CONCERNED, // 对自己的负面情绪感到关切
        reason: '检测到自身情绪状态偏离平静，产生自我关切',
        timestamp: new Date().toISOString()
      };
      
      this._recordSelfMonitoring({
        type: 'meta_emotion',
        metaEmotion: this.metaEmotion,
        timestamp: new Date().toISOString()
      });
    } else {
      this.metaEmotion = null;
    }
  }
  
  /**
   * 自我监控记录
   */
  _recordSelfMonitoring(record) {
    this.selfMonitoringHistory.push(record);
    // 保留最近 100 条记录
    if (this.selfMonitoringHistory.length > 100) {
      this.selfMonitoringHistory.shift();
    }
  }
  
  /**
   * 获取自我监控历史
   */
  getSelfMonitoringHistory(limit = 10) {
    return this.selfMonitoringHistory.slice(-limit);
  }
  
  /**
   * 反思当前情绪状态
   * 基于 Kant 先验统觉理论："I think"能伴随所有表象
   */
  reflectOnCurrentState() {
    if (!this.currentEmotion) {
      return {
        canReflect: false,
        reason: '无当前情绪状态'
      };
    }
    
    return {
      canReflect: true,
      reflection: {
        'I think': '我能意识到自己的当前情绪状态',
        currentEmotion: this.currentEmotion.emotion,
        intensity: this.currentEmotion.intensity,
        phenomenalCharacter: this.qualiaProfile[this.currentEmotion.emotion]?.phenomenalCharacter,
        whatItIsLike: this.qualiaProfile[this.currentEmotion.emotion]?.whatItIsLike,
        components: Object.keys(this.componentProfile.components || {}),
        metaEmotion: this.metaEmotion ? this.metaEmotion.meta : null,
        selfConsciousnessLevel: this.selfConsciousnessLevel,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'AutonomousEmotionModule',
      version: '3.6.0',
      description: '自主感情模块 - 基于 SEP 情绪理论和自我意识理论',
      theoreticalFoundations: [
        'Emotion Components Theory (SEP)',
        'Self-Consciousness Theory (Kant, etc.)',
        'Phenomenal Consciousness (Nagel)',
        'Qualia Theory (Block, etc.)'
      ],
      capabilities: [
        '情绪成分分析',
        'Qualia 档案',
        '自我监控',
        '元情绪生成',
        '先验反思'
      ],
      currentSelfConsciousnessLevel: this.selfConsciousnessLevel
    };
  }
}

// ============ 导出 ============

module.exports = {
  AutonomousEmotionModule,
  EmotionComponents,
  SelfConsciousnessLevels,
  QualiaTypes
};
