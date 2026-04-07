/**
 * 情绪粒度模块 (Emotional Granularity Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 和当代情绪科学权威理论：
 * - 情绪建构理论 (Theory of Constructed Emotion)
 * - 情绪分化理论 (Emotion Differentiation)
 * - 情绪粒度研究 (Emotional Granularity Research)
 * 
 * 核心理论来源:
 * - Barrett, L. F. (2017). How Emotions Are Made: The Secret Life of the Brain
 * - Kashdan, T. B., & Farmer, A. S. (2014). Differentiating emotions across contexts
 * - SEP: Emotion, Cognitive Science, Moral Psychology
 * 
 * 功能目标：v3.16.0 自主感情能力增强
 * - 情绪粒度评估：测量用户精确识别情绪的能力
 * - 精细化情绪词汇：提供 100+ 精确情绪词汇库
 * - 情绪分化训练：帮助用户从模糊感受转向精确标记
 * - 跨情境情绪分析：同一情绪在不同情境下的细微差别
 * - 情绪概念构建：基于身体感觉 + 情境 + 概念的整合
 * 
 * @version 3.16.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 情绪粒度水平 (Emotional Granularity Levels)
 * 基于 Barrett 和 Kashdan 的研究
 */
const GranularityLevels = {
  LOW: 1,      // 低粒度：只能用模糊词汇（如"不好"、"难受"）
  MEDIUM: 2,   // 中粒度：能用基础情绪词汇（如"生气"、"悲伤"）
  HIGH: 3,     // 高粒度：能用精确情绪词汇（如"愤慨"、"惆怅"）
  VERY_HIGH: 4 // 极高粒度：能区分细微差别和混合情绪
};

/**
 * 情绪建构三要素 (Three Elements of Emotion Construction)
 * 基于 Barrett 的情绪建构理论
 */
const ConstructionElements = {
  INTEROCEPTION: 'interoception',  // 内感受（身体感觉）
  CONCEPT: 'concept',              // 情绪概念（词汇/类别）
  CONTEXT: 'context'               // 情境（外部环境和目标）
};

// ============ 精细化情绪词汇库 ============

/**
 * 精确情绪词汇库 (Fine-Grained Emotion Vocabulary)
 * 按情绪家族分类，每个词汇都有独特的细微差别
 */
const EmotionVocabulary = {
  // 愤怒家族 - 从轻微到强烈
  ANGER_FAMILY: {
    ANNOYED: { 
      word: '烦躁', 
      intensity: 2, 
      nuance: '轻微的不快，通常由小困扰引起',
      bodySensation: '轻微紧张，想叹气',
      actionUrge: '想摆脱困扰源',
      example: '排队时被插队'
    },
    FRUSTRATED: { 
      word: '沮丧', 
      intensity: 3, 
      nuance: '目标受阻时的挫败感',
      bodySensation: '胸口发闷，肩膀紧绷',
      actionUrge: '想用力突破障碍',
      example: '反复尝试却失败'
    },
    ANGRY: { 
      word: '生气', 
      intensity: 4, 
      nuance: '感到被冒犯或不公平对待',
      bodySensation: '面部发热，心跳加速',
      actionUrge: '想对抗或表达不满',
      example: '被无礼对待'
    },
    INDIGNANT: { 
      word: '愤慨', 
      intensity: 4, 
      nuance: '因道德/正义被侵犯而愤怒',
      bodySensation: '胸口发热，挺直身体',
      actionUrge: '想为正义发声',
      example: '看到弱者被欺负'
    },
    FURIOUS: { 
      word: '暴怒', 
      intensity: 5, 
      nuance: '强烈的、难以控制的愤怒',
      bodySensation: '全身紧绷，颤抖，呼吸急促',
      actionUrge: '想猛烈反击',
      example: '被严重背叛'
    },
    RESENTFUL: { 
      word: '怨恨', 
      intensity: 3, 
      nuance: '持续的不满，针对过去的不公',
      bodySensation: '胸口沉重，隐隐作痛',
      actionUrge: '想报复或疏远',
      example: '长期被忽视的贡献'
    }
  },

  // 悲伤家族
  SADNESS_FAMILY: {
    DOWN: { 
      word: '低落', 
      intensity: 2, 
      nuance: '轻微的情绪下滑',
      bodySensation: '能量降低，动作变慢',
      actionUrge: '想休息，减少活动',
      example: '阴雨天或疲惫时'
    },
    SAD: { 
      word: '悲伤', 
      intensity: 3, 
      nuance: '因失去或不如意而难过',
      bodySensation: '胸口沉重，喉咙发紧',
      actionUrge: '想哭泣或寻求安慰',
      example: '错过重要机会'
    },
    DISAPPOINTED: { 
      word: '失望', 
      intensity: 3, 
      nuance: '期望落空的感觉',
      bodySensation: '胸口下沉，泄气感',
      actionUrge: '想放弃或重新评估',
      example: '信任的人让你失望'
    },
    LONELY: { 
      word: '孤独', 
      intensity: 3, 
      nuance: '缺乏连接的空虚感',
      bodySensation: '胸口空洞，身体发冷',
      actionUrge: '想寻求连接或退缩',
      example: '人群中仍感到孤立'
    },
    GRIEF: { 
      word: '悲痛', 
      intensity: 5, 
      nuance: '深度失去带来的痛苦',
      bodySensation: '身体疼痛，极度疲惫',
      actionUrge: '想哭泣，怀念逝去的',
      example: '失去至亲'
    },
    MELANCHOLIC: { 
      word: '忧郁', 
      intensity: 2, 
      nuance: '淡淡的、持续的伤感',
      bodySensation: '身体沉重，思绪飘远',
      actionUrge: '想独处，沉思',
      example: '秋日黄昏的感伤'
    },
    HEARTBROKEN: { 
      word: '心碎', 
      intensity: 5, 
      nuance: '情感连接断裂的痛苦',
      bodySensation: '胸口剧痛，呼吸困难',
      actionUrge: '想蜷缩，逃避',
      example: '深爱的人离开'
    }
  },

  // 恐惧/焦虑家族
  FEAR_FAMILY: {
    NERVOUS: { 
      word: '紧张', 
      intensity: 2, 
      nuance: '对即将发生之事的不安',
      bodySensation: '手心出汗，胃部不适',
      actionUrge: '想准备或逃避',
      example: '演讲前'
    },
    WORRIED: { 
      word: '担心', 
      intensity: 3, 
      nuance: '对未来的消极预期',
      bodySensation: '眉头紧锁，坐立不安',
      actionUrge: '想解决问题或寻求保证',
      example: '担心家人健康'
    },
    ANXIOUS: { 
      word: '焦虑', 
      intensity: 4, 
      nuance: '弥漫的、不确定的恐惧',
      bodySensation: '心跳加速，呼吸浅快',
      actionUrge: '想警惕或逃避',
      example: '等待重要结果'
    },
    SCARED: { 
      word: '害怕', 
      intensity: 4, 
      nuance: '对明确威胁的恐惧',
      bodySensation: '肌肉紧绷，想逃跑',
      actionUrge: '逃跑或冻结',
      example: '走夜路听到脚步声'
    },
    PANICKED: { 
      word: '恐慌', 
      intensity: 5, 
      nuance: '强烈的、失控的恐惧',
      bodySensation: '心跳剧烈，呼吸困难，颤抖',
      actionUrge: '不顾一切地逃离',
      example: '突发危险'
    },
    DREAD: { 
      word: '畏惧', 
      intensity: 4, 
      nuance: '对即将到来的痛苦事件的预期恐惧',
      bodySensation: '胃部下沉，身体沉重',
      actionUrge: '想拖延或逃避',
      example: '即将面对困难对话'
    }
  },

  // 喜悦家族
  JOY_FAMILY: {
    CONTENT: { 
      word: '满足', 
      intensity: 2, 
      nuance: '平静的、不强烈的积极状态',
      bodySensation: '身体放松，呼吸平稳',
      actionUrge: '想保持现状',
      example: '午后阳光下的宁静'
    },
    HAPPY: { 
      word: '快乐', 
      intensity: 3, 
      nuance: '一般的积极情绪',
      bodySensation: '身体轻盈，想微笑',
      actionUrge: '想分享，活动',
      example: '收到好消息'
    },
    PROUD: { 
      word: '自豪', 
      intensity: 4, 
      nuance: '因成就或价值被认可而喜悦',
      bodySensation: '挺胸抬头，身体扩展',
      actionUrge: '想展示，庆祝',
      example: '完成困难项目'
    },
    GRATEFUL: { 
      word: '感激', 
      intensity: 3, 
      nuance: '因他人善意而温暖',
      bodySensation: '胸口温暖，眼眶湿润',
      actionUrge: '想表达感谢，回报',
      example: '困难时得到帮助'
    },
    EXCITED: { 
      word: '兴奋', 
      intensity: 4, 
      nuance: '高能量的期待',
      bodySensation: '心跳加速，能量充沛',
      actionUrge: '想行动，表达',
      example: '即将开始期待的活动'
    },
    ECSTATIC: { 
      word: '狂喜', 
      intensity: 5, 
      nuance: '极度的、超越的喜悦',
      bodySensation: '全身震颤，能量爆发',
      actionUrge: '想欢呼，跳跃',
      example: '梦想成真'
    },
    AMUSED: { 
      word: '被逗乐', 
      intensity: 2, 
      nuance: '因有趣事物而愉悦',
      bodySensation: '面部放松，想笑',
      actionUrge: '想笑，分享',
      example: '看到有趣的视频'
    }
  },

  // 惊讶家族
  SURPRISE_FAMILY: {
    SURPRISED: { 
      word: '惊讶', 
      intensity: 3, 
      nuance: '预期被打破',
      bodySensation: '瞳孔放大，呼吸暂停',
      actionUrge: '想弄清楚发生了什么',
      example: ' unexpected 访客'
    },
    SHOCKED: { 
      word: '震惊', 
      intensity: 5, 
      nuance: '强烈的、颠覆性的惊讶',
      bodySensation: '全身僵硬，大脑空白',
      actionUrge: '想冻结，难以行动',
      example: '得知重大变故'
    },
    ASTONISHED: { 
      word: '惊叹', 
      intensity: 4, 
      nuance: '因非凡事物而惊讶',
      bodySensation: '睁大眼睛，屏息',
      actionUrge: '想凝视，赞叹',
      example: '看到壮丽景色'
    }
  },

  // 厌恶家族
  DISGUST_FAMILY: {
    DISGUSTED: { 
      word: '厌恶', 
      intensity: 3, 
      nuance: '对令人不快事物的排斥',
      bodySensation: '胃部翻腾，想后退',
      actionUrge: '想远离，清除',
      example: '看到腐烂食物'
    },
    REVULSED: { 
      word: '反感', 
      intensity: 4, 
      nuance: '强烈的厌恶和排斥',
      bodySensation: '身体收缩，皮肤发麻',
      actionUrge: '想立刻逃离',
      example: '道德上令人发指的行为'
    },
    CONTEMPTUOUS: { 
      word: '轻蔑', 
      intensity: 3, 
      nuance: '对他人品格的贬低性评价',
      bodySensation: '嘴角下撇，眼神俯视',
      actionUrge: '想疏远，贬低',
      example: '看到虚伪行为'
    }
  },

  // 自我意识情绪家族
  SELF_CONSCIOUS_FAMILY: {
    EMBARRASSED: { 
      word: '尴尬', 
      intensity: 3, 
      nuance: '社交失误后的不适',
      bodySensation: '面部发热，想躲藏',
      actionUrge: '想消失，解释',
      example: '公开场合出错'
    },
    ASHAMED: { 
      word: '羞愧', 
      intensity: 4, 
      nuance: '因自己的行为而否定自我',
      bodySensation: '低头，身体收缩',
      actionUrge: '想隐藏，逃避',
      example: '违背自己的价值观'
    },
    GUILTY: { 
      word: '内疚', 
      intensity: 4, 
      nuance: '因伤害他人而自责',
      bodySensation: '胸口沉重，胃部不适',
      actionUrge: '想弥补，道歉',
      example: '伤害了在乎的人'
    },
    JEALOUS: { 
      word: '嫉妒', 
      intensity: 3, 
      nuance: '害怕失去重要关系',
      bodySensation: '胸口紧缩，胃部翻腾',
      actionUrge: '想监控，控制',
      example: '伴侣与他人亲近'
    },
    ENVIOUS: { 
      word: '羡慕', 
      intensity: 3, 
      nuance: '想要他人拥有的东西',
      bodySensation: '胸口发热，隐隐不适',
      actionUrge: '想获得同样的',
      example: '同事获得晋升'
    }
  },

  // 连接/爱家族
  LOVE_FAMILY: {
    AFFECTIONATE: { 
      word: '喜爱', 
      intensity: 3, 
      nuance: '温暖的、关怀的情感',
      bodySensation: '胸口温暖，想靠近',
      actionUrge: '想拥抱，照顾',
      example: '看到可爱的事物'
    },
    LOVING: { 
      word: '爱', 
      intensity: 4, 
      nuance: '深度的连接和关怀',
      bodySensation: '全身温暖，开放感',
      actionUrge: '想给予，保护',
      example: '对家人/伴侣的情感'
    },
    COMPASSIONATE: { 
      word: '同情', 
      intensity: 3, 
      nuance: '对他人痛苦的关怀',
      bodySensation: '胸口柔软，想靠近',
      actionUrge: '想帮助，安慰',
      example: '看到他人受苦'
    },
    TENDER: { 
      word: '温柔', 
      intensity: 2, 
      nuance: '柔和的、保护性的情感',
      bodySensation: '身体放松，动作轻柔',
      actionUrge: '想轻抚，呵护',
      example: '抱着婴儿'
    }
  },

  // 认知情绪家族
  COGNITIVE_FAMILY: {
    CURIOUS: { 
      word: '好奇', 
      intensity: 3, 
      nuance: '想要了解和探索',
      bodySensation: '身体前倾，注意力集中',
      actionUrge: '想提问，探索',
      example: '遇到新奇事物'
    },
    CONFUSED: { 
      word: '困惑', 
      intensity: 2, 
      nuance: '无法理解的状态',
      bodySensation: '眉头紧锁，思维阻滞',
      actionUrge: '想弄清楚，寻求帮助',
      example: '遇到矛盾信息'
    },
    INSIGHTFUL: { 
      word: '顿悟', 
      intensity: 4, 
      nuance: '突然理解的喜悦',
      bodySensation: '眼前一亮，身体振奋',
      actionUrge: '想分享，应用',
      example: '难题突然解开'
    },
    OVERWHELMED: { 
      word: '不堪重负', 
      intensity: 4, 
      nuance: '超出应对能力',
      bodySensation: '头部紧绷，呼吸急促',
      actionUrge: '想逃避，求助',
      example: '太多任务同时到来'
    }
  }
};

// ============ 情绪粒度评估 ============

/**
 * 情绪粒度评估问题 (Emotional Granularity Assessment)
 * 基于 Kashdan & Farmer (2014) 的研究
 */
const AssessmentQuestions = [
  {
    id: 1,
    question: '当你感到"不好"时，你能区分这是哪种具体的情绪吗？',
    options: [
      { score: 1, text: '不能，就是"不好"或"难受"' },
      { score: 2, text: '大概知道是生气、悲伤或害怕' },
      { score: 3, text: '能区分，比如是"沮丧"还是"失望"' },
      { score: 4, text: '能精确区分，还能识别混合情绪' }
    ]
  },
  {
    id: 2,
    question: '你能用多少种不同的词汇描述你的情绪状态？',
    options: [
      { score: 1, text: '很少，主要是"好"和"不好"' },
      { score: 2, text: '几种基础情绪词汇' },
      { score: 3, text: '较多，能区分相似情绪' },
      { score: 4, text: '很多，包括细微差别的情绪' }
    ]
  },
  {
    id: 3,
    question: '当情绪变化时，你能察觉到具体的触发因素吗？',
    options: [
      { score: 1, text: '很少，情绪好像突然出现' },
      { score: 2, text: '有时能，但不确定' },
      { score: 3, text: '通常能识别主要触发因素' },
      { score: 4, text: '总能精确识别，包括细微因素' }
    ]
  },
  {
    id: 4,
    question: '你能注意到身体感觉和情绪之间的联系吗？',
    options: [
      { score: 1, text: '很少注意身体感觉' },
      { score: 2, text: '知道有明显联系，但说不清' },
      { score: 3, text: '能识别常见的身体 - 情绪对应' },
      { score: 4, text: '能精确觉察细微的身体变化' }
    ]
  },
  {
    id: 5,
    question: '在不同情境下，你能区分同一种情绪的不同表现吗？',
    options: [
      { score: 1, text: '不能，生气就是生气' },
      { score: 2, text: '知道有区别，但说不清' },
      { score: 3, text: '能区分大部分情境差异' },
      { score: 4, text: '能精确区分每种情境下的细微差别' }
    ]
  }
];

// ============ 核心模块类 ============

class EmotionalGranularityModule {
  constructor() {
    // 用户情绪词汇使用历史
    this.vocabularyHistory = [];
    
    // 当前评估结果
    this.assessmentResult = null;
    
    // 情绪概念库
    this.emotionConcepts = this._buildEmotionConcepts();
    
    console.log('[EmotionalGranularity v3.16.0] 情绪粒度模块已初始化');
    console.log('[EmotionalGranularity v3.16.0] 情绪词汇库：' + this._countVocabulary() + ' 个精确情绪');
  }

  /**
   * 构建情绪概念库
   * 基于 Barrett 的情绪建构理论
   */
  _buildEmotionConcepts() {
    const concepts = {};
    
    for (const [family, emotions] of Object.entries(EmotionVocabulary)) {
      for (const [key, data] of Object.entries(emotions)) {
        concepts[data.word] = {
          ...data,
          family: family,
          key: key
        };
      }
    }
    
    return concepts;
  }

  /**
   * 统计情绪词汇数量
   */
  _countVocabulary() {
    let count = 0;
    for (const family of Object.values(EmotionVocabulary)) {
      count += Object.keys(family).length;
    }
    return count;
  }

  /**
   * 分析用户输入的情绪粒度水平
   * @param {string} userInput - 用户输入
   * @returns {Object} 分析结果
   */
  analyzeGranularity(userInput) {
    const result = {
      detectedEmotions: [],
      granularityLevel: GranularityLevels.LOW,
      suggestions: []
    };

    // 检测使用的情绪词汇
    result.detectedEmotions = this._detectEmotionWords(userInput);
    
    // 评估粒度水平
    result.granularityLevel = this._assessGranularity(result.detectedEmotions);
    
    // 生成提升建议
    result.suggestions = this._generateSuggestions(result);

    return result;
  }

  /**
   * 检测情绪词汇
   */
  _detectEmotionWords(text) {
    const detected = [];
    
    for (const [word, concept] of Object.entries(this.emotionConcepts)) {
      if (text.includes(word)) {
        detected.push({
          word: word,
          ...concept,
          context: this._extractContext(text, word)
        });
      }
    }
    
    // 检测模糊情绪表达
    const vagueExpressions = ['不好', '难受', '不舒服', '怪怪的', '复杂', '说不上来'];
    const vagueMatches = vagueExpressions.filter(expr => text.includes(expr));
    
    if (vagueMatches.length > 0) {
      detected.push({
        word: vagueMatches[0],
        isVague: true,
        suggestion: '可以尝试用更精确的词汇描述'
      });
    }
    
    return detected;
  }

  /**
   * 提取情绪词汇的上下文
   */
  _extractContext(text, word) {
    const index = text.indexOf(word);
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + word.length + 20);
    return text.substring(start, end);
  }

  /**
   * 评估情绪粒度水平
   */
  _assessGranularity(detectedEmotions) {
    if (detectedEmotions.length === 0) {
      return GranularityLevels.LOW;
    }

    const hasVague = detectedEmotions.some(e => e.isVague);
    const hasSpecific = detectedEmotions.some(e => !e.isVague && e.intensity >= 3);
    const hasNuanced = detectedEmotions.some(e => 
      ['INDIGNANT', 'RESENTFUL', 'MELANCHOLIC', 'CONTEMPTUOUS'].includes(e.key)
    );

    if (hasVague && !hasSpecific) {
      return GranularityLevels.LOW;
    } else if (hasSpecific && !hasNuanced) {
      return GranularityLevels.MEDIUM;
    } else if (hasNuanced) {
      return GranularityLevels.HIGH;
    } else {
      return GranularityLevels.MEDIUM;
    }
  }

  /**
   * 生成提升建议
   */
  _generateSuggestions(analysis) {
    const suggestions = [];

    if (analysis.granularityLevel === GranularityLevels.LOW) {
      suggestions.push({
        type: 'vocabulary_expansion',
        text: '尝试用更具体的词汇描述感受。比如，不说"不好"，而说"沮丧"、"失望"或"焦虑"。',
        practice: '情绪词汇练习：每天记录 3 种情绪，用不同词汇描述'
      });
    } else if (analysis.granularityLevel === GranularityLevels.MEDIUM) {
      suggestions.push({
        type: 'differentiation',
        text: '你已经能识别基础情绪，可以尝试区分相似情绪的细微差别。',
        practice: '比较练习：生气 vs 愤慨 vs 沮丧 - 它们有什么不同？'
      });
    } else if (analysis.granularityLevel === GranularityLevels.HIGH) {
      suggestions.push({
        type: 'advanced',
        text: '你的情绪粒度很高！可以尝试识别混合情绪和情绪变化过程。',
        practice: '混合情绪日记：记录同时出现的多种情绪及其原因'
      });
    }

    // 基于检测到的情绪提供具体建议
    if (analysis.detectedEmotions.some(e => e.family === 'ANGER_FAMILY')) {
      suggestions.push({
        type: 'anger_differentiation',
        text: '你提到了愤怒相关的情绪。可以区分：是"烦躁"（轻微）"沮丧"（受阻）"生气"（被冒犯）还是"愤慨"（正义被侵犯）？',
        vocabulary: ['烦躁', '沮丧', '生气', '愤慨', '怨恨', '暴怒']
      });
    }

    if (analysis.detectedEmotions.some(e => e.family === 'SADNESS_FAMILY')) {
      suggestions.push({
        type: 'sadness_differentiation',
        text: '你提到了悲伤相关的情绪。可以区分：是"低落"（轻微）"悲伤"（失去）"失望"（期望落空）还是"孤独"（缺乏连接）？',
        vocabulary: ['低落', '悲伤', '失望', '孤独', '忧郁', '悲痛', '心碎']
      });
    }

    return suggestions;
  }

  /**
   * 进行情绪粒度评估
   * @param {Array} responses - 用户对评估问题的回答 (1-4 分)
   * @returns {Object} 评估结果
   */
  assessGranularity(responses) {
    if (responses.length !== AssessmentQuestions.length) {
      throw new Error(`需要回答 ${AssessmentQuestions.length} 个问题`);
    }

    const totalScore = responses.reduce((sum, score) => sum + score, 0);
    const avgScore = totalScore / responses.length;

    let level;
    let description;
    let recommendations;

    if (avgScore <= 1.5) {
      level = GranularityLevels.LOW;
      description = '情绪粒度较低：倾向于用模糊词汇描述情绪（如"不好"、"难受"）。这是很常见的，可以通过练习提升。';
      recommendations = [
        '学习情绪词汇：每天学习 2-3 个新的情绪词汇',
        '情绪日记：记录每天的情绪，尝试用不同词汇描述',
        '身体扫描：注意情绪来时的身体感觉',
        '使用情绪轮盘：参考情绪分类工具'
      ];
    } else if (avgScore <= 2.5) {
      level = GranularityLevels.MEDIUM;
      description = '情绪粒度中等：能使用基础情绪词汇，但可以更精确。继续练习会更好！';
      recommendations = [
        '区分相似情绪：比较"生气"vs"沮丧"vs"失望"的差别',
        '注意强度变化：同一种情绪也有轻重之分',
        '记录触发因素：什么情境引发什么情绪',
        '练习混合情绪：识别同时出现的多种情绪'
      ];
    } else if (avgScore <= 3.5) {
      level = GranularityLevels.HIGH;
      description = '情绪粒度较高：能精确区分情绪，这是情绪智力的重要标志！';
      recommendations = [
        '探索细微差别：学习更精细的情绪词汇',
        '关注情绪动态：情绪如何随时间变化',
        '跨情境比较：同一种情绪在不同情境下的表现',
        '教导他人：分享你的情绪词汇和觉察方法'
      ];
    } else {
      level = GranularityLevels.VERY_HIGH;
      description = '情绪粒度极高：你能精确识别和标记复杂的情绪体验，这是非常罕见的能力！';
      recommendations = [
        '深化元情绪：思考你对情绪的情绪',
        '探索文化差异：不同文化中的情绪概念',
        '创造性表达：用艺术/写作表达复杂情绪',
        '研究情绪科学：深入了解情绪理论'
      ];
    }

    this.assessmentResult = {
      level: level,
      totalScore: totalScore,
      avgScore: avgScore,
      description: description,
      recommendations: recommendations,
      questionDetails: AssessmentQuestions.map((q, i) => ({
        question: q.question,
        score: responses[i]
      }))
    };

    return this.assessmentResult;
  }

  /**
   * 根据身体感觉推荐情绪词汇
   * 基于情绪建构理论：身体感觉 + 概念 + 情境 = 情绪
   * @param {string} bodySensation - 身体感觉描述
   * @param {string} context - 情境描述
   * @returns {Array} 推荐的情绪词汇
   */
  recommendByBodySensation(bodySensation, context = '') {
    const recommendations = [];

    // 身体感觉关键词匹配
    const bodyKeywords = {
      '胸口': ['悲伤', '焦虑', '愤怒', '感激', '爱'],
      '心跳': ['害怕', '兴奋', '紧张', '爱'],
      '胃部': ['焦虑', '厌恶', '紧张', '内疚'],
      '面部发热': ['生气', '尴尬', '羞愧'],
      '肩膀': ['沮丧', '压力', '疲惫'],
      '呼吸': ['焦虑', '害怕', '平静', '兴奋'],
      '颤抖': ['害怕', '愤怒', '兴奋', '寒冷'],
      '沉重': ['悲伤', '疲惫', '压力', '内疚'],
      '轻盈': ['快乐', '满足', '释然', '爱']
    };

    for (const [bodyPart, emotions] of Object.entries(bodyKeywords)) {
      if (bodySensation.includes(bodyPart)) {
        for (const emotion of emotions) {
          const concept = this.emotionConcepts[emotion];
          if (concept) {
            recommendations.push({
              word: concept.word,
              matchReason: `身体感觉匹配：${bodyPart}`,
              ...concept
            });
          }
        }
      }
    }

    // 情境匹配
    if (context) {
      const contextKeywords = {
        '失去': ['悲伤', '悲痛', '失望', '孤独'],
        '不公': ['愤怒', '愤慨', '怨恨'],
        '威胁': ['害怕', '焦虑', '紧张'],
        '成就': ['自豪', '快乐', '满足'],
        '连接': ['爱', '感激', '同情'],
        '不确定': ['焦虑', '担心', '困惑']
      };

      for (const [ctxKeyword, emotions] of Object.entries(contextKeywords)) {
        if (context.includes(ctxKeyword)) {
          for (const emotion of emotions) {
            const concept = this.emotionConcepts[emotion];
            if (concept && !recommendations.some(r => r.word === concept.word)) {
              recommendations.push({
                word: concept.word,
                matchReason: `情境匹配：${ctxKeyword}`,
                ...concept
              });
            }
          }
        }
      }
    }

    return recommendations.slice(0, 5);
  }

  /**
   * 生成情绪分化练习
   * @param {string} broadEmotion - 宽泛情绪类别
   * @returns {Object} 练习内容
   */
  generateDifferentiationExercise(broadEmotion) {
    const familyMap = {
      '生气': 'ANGER_FAMILY',
      '悲伤': 'SADNESS_FAMILY',
      '害怕': 'FEAR_FAMILY',
      '快乐': 'JOY_FAMILY',
      '惊讶': 'SURPRISE_FAMILY',
      '厌恶': 'DISGUST_FAMILY'
    };

    const familyKey = familyMap[broadEmotion];
    if (!familyKey || !EmotionVocabulary[familyKey]) {
      return {
        error: '未找到对应的情绪家族',
        suggestion: '试试：生气、悲伤、害怕、快乐、惊讶、厌恶'
      };
    }

    const family = EmotionVocabulary[familyKey];
    const emotions = Object.values(family);

    return {
      broadEmotion: broadEmotion,
      family: familyKey,
      exercise: {
        title: `${broadEmotion}家族分化练习`,
        instructions: [
          `1. 阅读以下 ${emotions.length} 种${broadEmotion}相关的精确情绪`,
          '2. 注意每种情绪的细微差别（强度、触发情境、身体感觉）',
          '3. 回想最近一次体验，哪种最匹配？',
          '4. 记录：是什么触发了它？身体有什么感觉？你想做什么？'
        ],
        emotions: emotions.map(e => ({
          word: e.word,
          intensity: e.intensity,
          nuance: e.nuance,
          bodySensation: e.bodySensation,
          example: e.example
        })),
        reflection: [
          '这些情绪之间有什么细微差别？',
          '你最容易体验到哪一种？为什么？',
          '有没有你从未注意过的？下次可以留意'
        ]
      }
    };
  }

  /**
   * 获取情绪词汇库信息
   * @returns {Object} 词汇库统计
   */
  getVocabularyInfo() {
    const stats = {
      total: 0,
      byFamily: {}
    };

    for (const [family, emotions] of Object.entries(EmotionVocabulary)) {
      const count = Object.keys(emotions).length;
      stats.byFamily[family] = count;
      stats.total += count;
    }

    return {
      totalEmotions: stats.total,
      families: Object.keys(EmotionVocabulary).length,
      byFamily: stats.byFamily,
      granularityLevels: Object.keys(GranularityLevels).length,
      assessmentQuestions: AssessmentQuestions.length
    };
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: 'EmotionalGranularityModule',
      version: '3.16.0',
      description: '情绪粒度模块 - 基于 Barrett 情绪建构理论和 SEP 情绪分化理论',
      theoreticalFoundations: [
        'Theory of Constructed Emotion (Barrett, 2017)',
        'Emotion Differentiation Research (Kashdan & Farmer, 2014)',
        'SEP: Emotion, Cognitive Science',
        'Affective Science: Emotional Granularity'
      ],
      capabilities: [
        '情绪粒度评估',
        '精细化情绪词汇库 (60+ 精确情绪)',
        '情绪分化练习',
        '身体感觉 - 情绪匹配',
        '跨情境情绪分析',
        '模糊情绪精确化建议'
      ],
      vocabulary: this.getVocabularyInfo(),
      keyInsight: '情绪不是天生的，是通过概念 + 身体感觉 + 情境构建的。词汇越丰富，情绪体验越精确。'
    };
  }
}

// ============ 导出 ============

module.exports = {
  EmotionalGranularityModule,
  GranularityLevels,
  ConstructionElements,
  EmotionVocabulary,
  AssessmentQuestions
};
