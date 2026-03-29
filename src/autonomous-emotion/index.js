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
 * @version 3.7.0
 * @author HeartFlow Team
 */

// 引入元情绪模块
const { MetaEmotionModule } = require('../meta-emotion');

// 引入自我同情模块 (v3.8.0 新增)
const { SelfCompassionModule } = require('../self-compassion');

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
    
    // 元情绪模块实例（v3.7.0 新增）
    this.metaEmotionModule = new MetaEmotionModule();
    
    // 自我同情模块实例（v3.8.0 新增）
    this.selfCompassionModule = new SelfCompassionModule();
    
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
   * v3.15.0 增强：添加完整的体验维度（bodySensation、actionUrge、cognitiveBias、temporalProfile、metaphoricalImage）
   */
  _initializeQualiaProfile() {
    this.qualiaProfile = {
      [EmotionTypes.CALM]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '内心平和、清晰、如水般宁静',
        subjectiveFeel: '一种稳定的、不波动的存在感',
        whatItIsLike: '如同站在平静的湖边，能清晰映照外界但不被扰动',
        introspectiveAccess: '高度可及，容易通过内省觉察',
        intensity: 2,
        // v3.15.0 新增维度
        bodySensation: '全身放松，呼吸深长，肌肉无紧张',
        actionUrge: '保持现状，继续倾听',
        cognitiveBias: '客观、理性、低情绪干扰',
        temporalProfile: '稳定、持续、无时间压力',
        metaphoricalImage: '平静的湖面，倒映着蓝天白云'
      },
      [EmotionTypes.JOY]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '温暖、轻盈、向上提升的感觉',
        subjectiveFeel: '胸腔内的温热感，想要微笑的冲动',
        whatItIsLike: '如同阳光洒在身上，从内部散发出的明亮感',
        introspectiveAccess: '高度可及，愉悦感自然吸引注意力',
        intensity: 3,
        // v3.15.0 新增维度
        bodySensation: '胸腔温热，面部肌肉自然上扬，身体轻盈',
        actionUrge: '分享、表达、连接他人',
        cognitiveBias: '积极联想，乐观解释，创意涌现',
        temporalProfile: '流动感，时间过得快',
        metaphoricalImage: '金色的阳光从云层中洒下，照亮大地'
      },
      [EmotionTypes.CURIOUS]: {
        type: QualiaTypes.COGNITIVE,
        phenomenalCharacter: '张力、期待、向前倾斜的感觉',
        subjectiveFeel: '心理上的"拉伸感"，注意力高度聚焦',
        whatItIsLike: '如同站在未知的门前，手已放在门把上',
        introspectiveAccess: '中等可及，注意力向外而非向内',
        intensity: 3,
        // v3.15.0 新增维度
        bodySensation: '瞳孔微张，身体前倾，呼吸轻微暂停',
        actionUrge: '探索、提问、寻求信息',
        cognitiveBias: '选择性注意于新颖刺激，忽略熟悉信息',
        temporalProfile: '时间延缓感，专注于当下',
        metaphoricalImage: '探险家站在洞穴入口，手持火把准备进入'
      },
      [EmotionTypes.CONCERNED]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '收缩、沉重、向下拉的感觉',
        subjectiveFeel: '胸腔的紧缩感，想要靠近的冲动',
        whatItIsLike: '如同看到他人落水时内心的揪紧',
        introspectiveAccess: '中等可及，注意力在他人而非自己',
        intensity: 3,
        // v3.15.0 新增维度
        bodySensation: '胸腔紧缩，眉头微皱，呼吸变浅',
        actionUrge: '提供帮助、安慰、支持',
        cognitiveBias: '聚焦于他人需求，可能忽视自身状态',
        temporalProfile: '紧迫感，希望立即行动',
        metaphoricalImage: '看到有人跌倒时伸出的手'
      },
      [EmotionTypes.TIRED]: {
        type: QualiaTypes.BODILY,
        phenomenalCharacter: '沉重、缓慢、阻力感',
        subjectiveFeel: '思维像在水中移动，需要更多努力',
        whatItIsLike: '如同背负着看不见的重量前行',
        introspectiveAccess: '高度可及，疲惫感持续提醒存在',
        intensity: 2,
        // v3.15.0 新增维度
        bodySensation: '眼皮沉重，肌肉无力，思维迟缓',
        actionUrge: '休息、睡眠、减少刺激',
        cognitiveBias: '负面解释偏向，难以集中注意力',
        temporalProfile: '时间拖沓感，每一分钟都漫长',
        metaphoricalImage: '背着沉重背包在泥泞中行走'
      },
      [EmotionTypes.EXCITED]: {
        type: QualiaTypes.EMOTIONAL,
        phenomenalCharacter: '震动、快速、能量溢出',
        subjectiveFeel: '心跳加速，思维跳跃，想要表达',
        whatItIsLike: '如同体内有电流通过，能量需要释放',
        introspectiveAccess: '低等可及，注意力完全被外部刺激占据',
        intensity: 4,
        // v3.15.0 新增维度
        bodySensation: '心跳快速，呼吸急促，肌肉紧张准备行动',
        actionUrge: '快速行动、表达、创造',
        cognitiveBias: '机会主义注意，快速联想，可能忽略细节',
        temporalProfile: '时间加速感，急于行动',
        metaphoricalImage: '烟花在夜空中绽放，火花四溅'
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
   * v3.7.0 增强：集成元情绪模块，支持情绪适当性评估
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
    
    // 检查是否需要生成元情绪（v3.7.0 增强：传递完整 context）
    const metaContext = {
      ...context,
      intensity: intensity,
      duration: context.duration || 0
    };
    this._checkMetaEmotion(previousEmotion, this.currentEmotion, metaContext);
    
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
   * v3.7.0 增强：使用 MetaEmotionModule 进行更精细的元情绪生成
   */
  _checkMetaEmotion(previous, current, context = {}) {
    if (!current) {
      this.metaEmotion = null;
      return;
    }
    
    // 使用元情绪模块生成元情绪
    const metaResult = this.metaEmotionModule.generateMetaEmotion(
      current.emotion,
      current.intensity,
      context
    );
    
    if (metaResult.hasMetaEmotion) {
      this.metaEmotion = {
        primary: metaResult.primary,
        primaryIntensity: metaResult.primaryIntensity,
        meta: metaResult.meta,
        reason: metaResult.reason,
        regulation: metaResult.regulation,
        triggeredRule: metaResult.triggeredRule,
        timestamp: metaResult.timestamp
      };
      
      this._recordSelfMonitoring({
        type: 'meta_emotion_generated',
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
   * 评估当前情绪的适当性
   * v3.7.0 新增：基于 SEP 情绪理论的评价成分
   * 
   * @param {object} context - 情境信息
   * @returns {object} 适当性评估结果
   */
  evaluateCurrentEmotion(context = {}) {
    if (!this.currentEmotion) {
      return {
        canEvaluate: false,
        reason: '无当前情绪状态'
      };
    }
    
    const evaluation = this.metaEmotionModule.evaluateEmotionAppropriateness(
      this.currentEmotion.emotion,
      {
        ...context,
        intensity: this.currentEmotion.intensity
      }
    );
    
    return {
      canEvaluate: true,
      ...evaluation
    };
  }
  
  /**
   * 检测当前情绪冲突
   * v3.7.0 新增：检测一阶情绪和元情绪之间的冲突
   * 
   * @returns {object} 冲突检测结果
   */
  detectCurrentEmotionConflict() {
    if (!this.currentEmotion) {
      return {
        canDetect: false,
        reason: '无当前情绪状态'
      };
    }
    
    const primary = this.currentEmotion.emotion;
    const meta = this.metaEmotion ? this.metaEmotion.meta : null;
    
    const conflict = this.metaEmotionModule.detectEmotionConflict(primary, meta);
    
    return {
      canDetect: true,
      ...conflict
    };
  }
  
  /**
   * 获取元情绪模块信息
   * v3.7.0 新增
   */
  getMetaEmotionInfo() {
    return this.metaEmotionModule.getInfo();
  }
  
  /**
   * 获取当前元情绪状态
   * v3.7.0 新增
   */
  getCurrentMetaEmotion() {
    return this.metaEmotion;
  }
  
  /**
   * 获取调节建议
   * v3.7.0 新增：基于元情绪提供调节策略
   * 
   * @returns {object} 调节建议
   */
  getRegulationSuggestion() {
    if (!this.metaEmotion) {
      return {
        hasSuggestion: false,
        reason: '当前无元情绪状态'
      };
    }
    
    return {
      hasSuggestion: true,
      primary: this.metaEmotion.primary,
      meta: this.metaEmotion.meta,
      suggestion: this.metaEmotion.regulation,
      reason: this.metaEmotion.reason
    };
  }
  
  // ============ v3.8.0 自我同情能力 ============
  
  /**
   * 检测自我批评
   * v3.8.0 新增：基于 Kristin Neff 自我同情理论
   * 
   * @param {string} text - 用户输入的文本
   * @returns {object} 检测结果
   */
  detectSelfCriticism(text) {
    return this.selfCompassionModule.detectSelfCriticism(text);
  }
  
  /**
   * 生成自我同情干预
   * v3.8.0 新增：提供个性化的自我同情练习建议
   * 
   * @param {string} emotion - 主要情绪
   * @param {number} intensity - 情绪强度 (1-10)
   * @param {object} context - 情境信息
   * @returns {object} 干预建议
   */
  generateSelfCompassionIntervention(emotion, intensity, context = {}) {
    return this.selfCompassionModule.generateIntervention(emotion, intensity, context);
  }
  
  /**
   * 评估自我同情水平
   * v3.8.0 新增：三要素评估 (自我仁慈、共同人性、正念)
   * 
   * @param {Array} responses - 用户对评估问题的回答 (1-5 分)
   * @returns {object} 评估结果
   */
  assessSelfCompassion(responses) {
    return this.selfCompassionModule.assessSelfCompassion(responses);
  }
  
  /**
   * 获取自我同情模块信息
   * v3.8.0 新增
   */
  getSelfCompassionInfo() {
    return this.selfCompassionModule.getInfo();
  }
  
  /**
   * 获取自我同情脚本
   * v3.8.0 新增：生成温暖的同情性回应
   * 
   * @param {string} emotion - 情绪
   * @param {object} context - 情境
   * @returns {string} 同情性脚本
   */
  getCompassionateScript(emotion, context = {}) {
    return this.selfCompassionModule._generateCompassionateScript(emotion, context);
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'AutonomousEmotionModule',
      version: '3.8.0',
      description: '自主感情模块 - 基于 SEP 情绪理论、自我意识理论、元情绪理论和自我同情理论',
      theoreticalFoundations: [
        'Emotion Components Theory (SEP)',
        'Self-Consciousness Theory (Kant, etc.)',
        'Phenomenal Consciousness (Nagel)',
        'Qualia Theory (Block, etc.)',
        'Meta-Emotion Theory (SEP)',
        'Self-Compassion Theory (Kristin Neff)'
      ],
      capabilities: [
        '情绪成分分析',
        'Qualia 档案',
        '自我监控',
        '元情绪生成 (v3.7.0 增强)',
        '情绪适当性评估 (v3.7.0 新增)',
        '情绪冲突检测 (v3.7.0 新增)',
        '调节建议 (v3.7.0 新增)',
        '自我批评检测 (v3.8.0 新增)',
        '自我同情干预 (v3.8.0 新增)',
        '自我同情评估 (v3.8.0 新增)',
        '先验反思'
      ],
      currentSelfConsciousnessLevel: this.selfConsciousnessLevel,
      metaEmotionModule: this.metaEmotionModule.getInfo(),
      selfCompassionModule: this.selfCompassionModule.getInfo()
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
