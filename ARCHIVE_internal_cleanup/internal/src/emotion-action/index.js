/**
 * Emotion-Action Module - 情绪与行动模块
 * 
 * 基于 SEP 情绪理论中情绪与行动关系的权威研究
 * 
 * 核心理论:
 * - 情绪如何驱动行为 (Motivational Theory of Emotion)
 * - 情绪 vs 欲望 vs 动机
 * - 情绪在实践推理中的作用
 * - 情绪 - 行动映射 (Emotion-Action Mapping)
 * 
 * 理论来源:
 * - SEP: Emotion - Section on Motivation and Action
 * - Frijda (1986): The Emotions - 行动倾向理论
 * - Scarantino (2014): Motivational View of Emotions
 * - Davidson (1963): Actions, Reasons, and Causes
 * 
 * @version 3.49.0
 * @author HeartFlow Team
 */

class EmotionActionModule {
  constructor() {
    this.name = 'Emotion-Action Module';
    this.version = '3.49.0';
    this.description = '情绪与行动关系分析与干预';
    
    // 情绪 - 行动倾向映射 (Frijda)
    this.actionTendencies = {
      // 恐惧 → 逃避/回避
      fear: {
        primaryTendency: 'escape',
        actionUrge: '逃离或回避威胁源',
        behavioralPatterns: ['回避', '逃跑', '躲藏', '冻结'],
        adaptiveFunction: '保护自身安全',
        maladaptivePatterns: ['过度回避', '恐惧症', '恐慌发作'],
        intervention: '渐进暴露 + 认知重构'
      },
      
      // 愤怒 → 攻击/移除障碍
      anger: {
        primaryTendency: 'attack',
        actionUrge: '移除冒犯源或障碍',
        behavioralPatterns: ['对抗', '攻击', '争论', '坚持'],
        adaptiveFunction: '维护边界和权益',
        maladaptivePatterns: ['暴力', '被动攻击', '压抑愤怒'],
        intervention: '愤怒管理 + 果断训练'
      },
      
      // 悲伤 → 退缩/寻求支持
      sadness: {
        primaryTendency: 'withdraw',
        actionUrge: '退缩并寻求支持',
        behavioralPatterns: ['退缩', '哭泣', '寻求安慰', '反思'],
        adaptiveFunction: '促进恢复和社会联结',
        maladaptivePatterns: ['抑郁', '社会隔离', '反刍'],
        intervention: '行为激活 + 社会支持'
      },
      
      // 愉悦/快乐 → 接近/维持
      joy: {
        primaryTendency: 'approach',
        actionUrge: '接近并维持愉悦源',
        behavioralPatterns: ['接近', '分享', '庆祝', '创造'],
        adaptiveFunction: '强化有益行为和关系',
        maladaptivePatterns: ['成瘾', '冲动行为', '躁狂'],
        intervention: '正念愉悦 + 价值导向行动'
      },
      
      // 厌恶 → 排斥/清除
      disgust: {
        primaryTendency: 'expel',
        actionUrge: '排斥或清除厌恶物',
        behavioralPatterns: ['推开', '呕吐', '清洁', '避免'],
        adaptiveFunction: '避免污染和疾病',
        maladaptivePatterns: ['强迫清洁', '进食障碍', '过度敏感'],
        intervention: '暴露反应预防'
      },
      
      // 惊讶 → 注意/探索
      surprise: {
        primaryTendency: 'orient',
        actionUrge: '注意并探索新异刺激',
        behavioralPatterns: ['注视', '倾听', '探索', '询问'],
        adaptiveFunction: '快速适应环境变化',
        maladaptivePatterns: ['惊吓反应过度', '注意力分散'],
        intervention: '注意力训练'
      },
      
      // 羞愧 → 隐藏/退缩
      shame: {
        primaryTendency: 'hide',
        actionUrge: '隐藏自己避免被看见',
        behavioralPatterns: ['低头', '回避目光', '退缩', '沉默'],
        adaptiveFunction: '维护社会关系',
        maladaptivePatterns: ['社交焦虑', '自我贬低', '退缩'],
        intervention: '自我同情 + 羞耻复原力'
      },
      
      // 内疚 → 修复/补偿
      guilt: {
        primaryTendency: 'repair',
        actionUrge: '修复伤害或补偿',
        behavioralPatterns: ['道歉', '补偿', '弥补', '改变'],
        adaptiveFunction: '维护道德关系',
        maladaptivePatterns: ['过度内疚', '强迫性道歉', '自我惩罚'],
        intervention: '宽恕 + 修复性行动'
      },
      
      // 自豪 → 展示/维持
      pride: {
        primaryTendency: 'display',
        actionUrge: '展示成就并维持',
        behavioralPatterns: ['挺胸', '微笑', '分享', '庆祝'],
        adaptiveFunction: '强化成就和社会地位',
        maladaptivePatterns: ['自恋', '傲慢', '虚假自豪'],
        intervention: '真实自豪培养'
      },
      
      // 嫉妒 → 竞争/保护
      envy: {
        primaryTendency: 'compete',
        actionUrge: '竞争或保护所有物',
        behavioralPatterns: ['比较', '竞争', '保护', '模仿'],
        adaptiveFunction: '激励自我提升',
        maladaptivePatterns: ['恶意嫉妒', '破坏行为', '怨恨'],
        intervention: '欣赏式嫉妒 + 自我提升'
      },
      
      // 感激 → 回报/联结
      gratitude: {
        primaryTendency: 'reciprocate',
        actionUrge: '回报善意并加强联结',
        behavioralPatterns: ['感谢', '回报', '分享', '联结'],
        adaptiveFunction: '促进互惠和社会联结',
        maladaptivePatterns: ['感激不足', '过度回报压力'],
        intervention: '感激练习 + 接受训练'
      },
      
      // 希望 → 追求/坚持
      hope: {
        primaryTendency: 'pursue',
        actionUrge: '追求期望的目标',
        behavioralPatterns: ['计划', '努力', '坚持', '乐观'],
        adaptiveFunction: '激励目标追求',
        maladaptivePatterns: ['盲目乐观', '不切实际', '失望'],
        intervention: '现实希望 + 路径思维'
      }
    };
    
    // 情绪动机强度量表
    this.motivationIntensityScale = {
      1: '极弱 - 几乎不产生行动冲动',
      2: '弱 - 轻微的行动倾向',
      3: '中等 - 明确的行动冲动但可控制',
      4: '强 - 强烈的行动冲动，需要努力控制',
      5: '极强 - 几乎无法控制的行动冲动'
    };
    
    // 实践推理中的情绪作用
    this.emotionInPracticalReasoning = {
      // 情绪提供行动理由
      providingReasons: {
        description: '情绪本身可以作为行动的理由',
        example: '因为害怕所以逃避，因为愤怒所以对抗',
        rationality: '情绪理由可以是理性的，如果情绪本身是适当的'
      },
      
      // 情绪影响权重分配
      weightingInfluence: {
        description: '情绪影响对不同行动理由的权重分配',
        example: '恐惧使安全理由权重增加，愤怒使公平理由权重增加',
        rationality: '这种影响通常是适应性的，但可能过度'
      },
      
      // 情绪框定情境
      framingEffect: {
        description: '情绪框定了对情境的理解',
        example: '愤怒框定为冒犯，恐惧框定为威胁',
        rationality: '情绪框定可以是准确的也可能是扭曲的'
      },
      
      // 情绪承诺行动
      committingToAction: {
        description: '情绪承诺于特定行动路径',
        example: '愤怒承诺于对抗，内疚承诺于修复',
        rationality: '情绪承诺提供行动动力，但需要理性审查'
      }
    };
  }
  
  /**
   * 分析情绪的行动倾向
   * @param {string} emotion - 情绪名称
   * @param {number} intensity - 情绪强度 (1-5)
   * @returns {Object} 行动倾向分析
   */
  analyzeActionTendency(emotion, intensity = 3) {
    const normalizedEmotion = emotion.toLowerCase();
    const tendency = this.actionTendencies[normalizedEmotion];
    
    if (!tendency) {
      return {
        emotion,
        found: false,
        message: `未找到 "${emotion}" 的行动倾向数据`
      };
    }
    
    return {
      emotion,
      intensity,
      found: true,
      primaryTendency: tendency.primaryTendency,
      actionUrge: tendency.actionUrge,
      behavioralPatterns: tendency.behavioralPatterns,
      adaptiveFunction: tendency.adaptiveFunction,
      maladaptivePatterns: tendency.maladaptivePatterns,
      intervention: tendency.intervention,
      motivationLevel: this.motivationIntensityScale[intensity],
      actionReadiness: this._calculateActionReadiness(intensity)
    };
  }
  
  /**
   * 计算行动准备度
   * @private
   */
  _calculateActionReadiness(intensity) {
    if (intensity <= 2) return '低 - 可以理性思考';
    if (intensity <= 3) return '中 - 情绪开始影响决策';
    if (intensity <= 4) return '高 - 强烈行动冲动，需要觉察';
    return '极高 - 几乎自动化反应，需要暂停';
  }
  
  /**
   * 评估情绪 - 行动一致性
   * @param {string} emotion - 当前情绪
   * @param {string} actualAction - 实际采取的行动
   * @param {string} valuedAction - 符合价值观的行动
   * @returns {Object} 一致性评估
   */
  assessEmotionActionAlignment(emotion, actualAction, valuedAction) {
    const tendency = this.actionTendencies[emotion.toLowerCase()];
    
    if (!tendency) {
      return {
        alignment: 'unknown',
        message: '无法评估未知情绪的行动倾向'
      };
    }
    
    const isAutomatic = this._isAutomaticResponse(actualAction, tendency);
    const isValueAligned = actualAction === valuedAction;
    const isAdaptive = this._isAdaptiveResponse(actualAction, tendency);
    
    let alignment;
    if (isValueAligned && isAdaptive) {
      alignment = 'optimal';
    } else if (isAdaptive && !isValueAligned) {
      alignment = 'adaptive_but_misaligned';
    } else if (!isAdaptive && isValueAligned) {
      alignment = 'value_aligned_but_maladaptive';
    } else {
      alignment = 'misaligned';
    }
    
    return {
      emotion,
      actualAction,
      valuedAction,
      alignment,
      isAutomatic,
      isValueAligned,
      isAdaptive,
      naturalTendency: tendency.primaryTendency,
      suggestions: this._generateAlignmentSuggestions(alignment, tendency)
    };
  }
  
  /**
   * 判断是否为自动化反应
   * @private
   */
  _isAutomaticResponse(action, tendency) {
    return tendency.behavioralPatterns.some(pattern => 
      action.includes(pattern) || action === tendency.primaryTendency
    );
  }
  
  /**
   * 判断是否为适应性反应
   * @private
   */
  _isAdaptiveResponse(action, tendency) {
    const maladaptiveKeywords = ['过度', '强迫', '暴力', '完全', '从不'];
    return !maladaptiveKeywords.some(keyword => action.includes(keyword));
  }
  
  /**
   * 生成一致性建议
   * @private
   */
  _generateAlignmentSuggestions(alignment, tendency) {
    const suggestions = [];
    
    switch (alignment) {
      case 'optimal':
        suggestions.push('继续保持这种平衡的行动方式');
        suggestions.push('注意觉察情绪提供的信息，但不被其控制');
        break;
        
      case 'adaptive_but_misaligned':
        suggestions.push('虽然行动是适应性的，但与你的价值观不一致');
        suggestions.push('探索如何在保护自己和坚持价值之间找到平衡');
        break;
        
      case 'value_aligned_but_maladaptive':
        suggestions.push('虽然行动符合价值观，但方式可能不健康');
        suggestions.push(`考虑替代方案：${tendency.intervention}`);
        break;
        
      case 'misaligned':
        suggestions.push('当前行动既不符合价值观也不适应');
        suggestions.push('建议暂停，觉察情绪冲动，选择更有智慧的回应');
        suggestions.push(`参考干预策略：${tendency.intervention}`);
        break;
    }
    
    return suggestions;
  }
  
  /**
   * 情绪驱动的实践推理分析
   * @param {string} emotion - 情绪
   * @param {string} situation - 情境描述
   * @param {string} proposedAction - 拟采取的行动
   * @returns {Object} 实践推理分析
   */
  analyzePracticalReasoning(emotion, situation, proposedAction) {
    const tendency = this.actionTendencies[emotion.toLowerCase()];
    
    if (!tendency) {
      return {
        emotion,
        found: false,
        message: '无法分析未知情绪的实践推理'
      };
    }
    
    // 分析情绪如何影响推理
    const reasoningAnalysis = {
      emotion,
      situation,
      proposedAction,
      
      // 情绪提供的行动理由
      emotionReason: {
        type: '情绪驱动理由',
        content: `因为感到${emotion}，所以想要${tendency.actionUrge}`,
        validity: '需要评估情绪是否适当'
      },
      
      // 情绪对权重分配的影响
      weightingEffect: {
        description: `${emotion} 增强了某些理由的权重`,
        enhanced: this._getEnhancedReasons(emotion),
        diminished: this._getDiminishedReasons(emotion)
      },
      
      // 情绪的情境框定
      framingEffect: {
        description: `${emotion} 框定了你对情境的理解`,
        frame: this._getEmotionalFrame(emotion),
        alternativeFrames: this._getAlternativeFrames(emotion)
      },
      
      // 行动承诺
      commitment: {
        level: this._assessCommitmentLevel(emotion),
        description: `${emotion} 承诺于${tendency.primaryTendency}的行动路径`,
        flexibility: this._assessFlexibility(emotion)
      },
      
      // 理性审查建议
      rationalReview: this._generateRationalReview(emotion, situation, proposedAction)
    };
    
    return reasoningAnalysis;
  }
  
  /**
   * 获取情绪增强的理由类型
   * @private
   */
  _getEnhancedReasons(emotion) {
    const mapping = {
      fear: ['安全理由', '自我保护'],
      anger: ['公平理由', '尊严维护'],
      sadness: ['恢复理由', '寻求支持'],
      joy: ['联结理由', '创造理由'],
      disgust: ['纯洁理由', '健康理由'],
      guilt: ['道德理由', '关系修复'],
      shame: ['社会接纳理由', '形象维护']
    };
    return mapping[emotion.toLowerCase()] || ['相关价值理由'];
  }
  
  /**
   * 获取情绪减弱的理由类型
   * @private
   */
  _getDiminishedReasons(emotion) {
    const mapping = {
      fear: ['成长理由', '探索理由'],
      anger: ['关系理由', '长远考虑'],
      sadness: ['行动理由', '目标追求'],
      guilt: ['自我关怀理由', '前进理由']
    };
    return mapping[emotion.toLowerCase()] || ['其他价值理由'];
  }
  
  /**
   * 获取情绪的情境框定
   * @private
   */
  _getEmotionalFrame(emotion) {
    const frames = {
      fear: '威胁 - 危险框架',
      anger: '冒犯 - 不公框架',
      sadness: '损失 - 分离框架',
      joy: '获得 - 联结框架',
      disgust: '污染 - 厌恶框架',
      guilt: '伤害 - 责任框架',
      shame: '缺陷 - 暴露框架'
    };
    return frames[emotion.toLowerCase()] || '情绪框架';
  }
  
  /**
   * 获取替代框定
   * @private
   */
  _getAlternativeFrames(emotion) {
    const alternatives = {
      fear: ['挑战框架', '学习机会框架'],
      anger: ['误解框架', '沟通机会框架'],
      sadness: ['自然过程框架', '成长空间框架'],
      guilt: ['学习机会框架', '修复可能性框架']
    };
    return alternatives[emotion.toLowerCase()] || ['替代视角'];
  }
  
  /**
   * 评估行动承诺水平
   * @private
   */
  _assessCommitmentLevel(emotion) {
    const levels = {
      fear: '高 - 强烈逃避承诺',
      anger: '高 - 强烈对抗承诺',
      joy: '中 - 灵活接近承诺',
      sadness: '中 - 退缩但可调整',
      guilt: '高 - 强烈修复承诺'
    };
    return levels[emotion.toLowerCase()] || '中等承诺';
  }
  
  /**
   * 评估行动灵活性
   * @private
   */
  _assessFlexibility(emotion) {
    const flexibility = {
      fear: '低 - 倾向于单一逃避反应',
      anger: '低 - 倾向于单一对抗反应',
      joy: '高 - 多种接近方式可选',
      sadness: '中 - 可调整退缩程度'
    };
    return flexibility[emotion.toLowerCase()] || '中等灵活性';
  }
  
  /**
   * 生成理性审查建议
   * @private
   */
  _generateRationalReview(emotion, situation, proposedAction) {
    return {
      questions: [
        `我的${emotion}情绪是否基于准确的情境评估？`,
        `除了${proposedAction}，还有其他更智慧的回应方式吗？`,
        `这个行动符合我的长期价值观吗？`,
        `如果情绪强度降低一半，我会做出不同选择吗？`,
        `这个行动会加强还是削弱我重视的关系？`
      ],
      pauseTechnique: 'STOP 技术：暂停 (Stop) → 呼吸 (Take breath) → 观察 (Observe) → 选择 (Proceed)',
      wisdomCheck: '问自己："这是情绪冲动还是智慧回应？"'
    };
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      features: [
        '12 种情绪的行动倾向分析',
        '情绪 - 行动一致性评估',
        '实践推理中的情绪作用分析',
        '情绪动机强度评估',
        '适应性 vs 非适应性行动模式识别'
      ],
      commands: ['/emotion-action - 查看情绪与行动关系介绍']
    };
  }
}

module.exports = { EmotionActionModule };
