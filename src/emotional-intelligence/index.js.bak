/**
 * 情绪智力模块 (v2.8.0 新增)
 * 基于 Daniel Goleman 情绪智力理论和 John Mayer 情绪智力模型
 * 
 * 核心能力:
 * - 自我觉察：识别自己的情绪
 * - 自我调节：管理情绪反应
 * - 动机：利用情绪驱动目标
 * - 共情：识别他人情绪
 * - 社交技能：管理人际关系
 * 
 * 来源：情绪智力经典理论
 */

const EmotionalIntelligenceComponents = {
  SELF_AWARENESS: 'self_awareness',       // 自我觉察
  SELF_REGULATION: 'self_regulation',     // 自我调节
  MOTIVATION: 'motivation',               // 动机
  EMPATHY: 'empathy',                     // 共情
  SOCIAL_SKILLS: 'social_skills'          // 社交技能
};

// 情绪关键词库
const EmotionKeywords = {
  // 基本情绪 (Ekman)
  anger: ['愤怒', '生气', '恼火', '愤慨', '暴怒'],
  fear: ['害怕', '恐惧', '担心', '焦虑', '恐慌'],
  sadness: ['悲伤', '难过', '沮丧', '伤心', '绝望'],
  happiness: ['开心', '快乐', '高兴', '兴奋', '喜悦'],
  disgust: ['厌恶', '讨厌', '反感', '恶心'],
  surprise: ['惊讶', '吃惊', '意外', '震惊'],
  
  // 复杂情绪
  shame: ['羞愧', '羞耻', '尴尬', '丢脸'],
  guilt: ['内疚', '愧疚', '自责', '懊悔'],
  envy: ['嫉妒', '羡慕', '眼红'],
  pride: ['自豪', '骄傲', '得意'],
  loneliness: ['孤独', '寂寞', '孤立'],
  overwhelm: ['压力', '不堪重负', ' overwhelmed', '喘不过气']
};

class EmotionalIntelligenceModule {
  constructor() {
    this.emotionHistory = [];
  }

  /**
   * 分析用户的情绪智力维度
   * @param {string} userInput - 用户输入
   * @returns {Object} 情绪智力分析结果
   */
  analyze(userInput) {
    const result = {
      detectedEmotions: [],
      eiComponents: [],
      primaryComponent: null,
      response: null
    };

    // 检测情绪
    result.detectedEmotions = this._detectEmotions(userInput);
    
    // 分析情绪智力维度
    result.eiComponents = this._analyzeEIComponents(userInput, result.detectedEmotions);
    
    // 确定主要维度
    result.primaryComponent = this._determinePrimaryComponent(result.eiComponents);
    
    // 生成回应
    result.response = this._generateResponse(result);

    return result;
  }

  /**
   * 检测情绪
   */
  _detectEmotions(text) {
    const detected = [];

    for (const [emotion, keywords] of Object.entries(EmotionKeywords)) {
      const matches = keywords.filter(kw => text.includes(kw));
      if (matches.length > 0) {
        detected.push({
          emotion: emotion,
          matches: matches,
          intensity: matches.length
        });
      }
    }

    // 按强度排序
    detected.sort((a, b) => b.intensity - a.intensity);

    return detected;
  }

  /**
   * 分析情绪智力维度
   */
  _analyzeEIComponents(text, emotions) {
    const components = [];

    // 自我觉察检测
    if (text.match(/(我感觉 | 我觉得 | 我意识到 | 我发现自己)/)) {
      components.push({
        component: EmotionalIntelligenceComponents.SELF_AWARENESS,
        score: 0.8,
        evidence: '自我反思表达'
      });
    }

    // 自我调节检测
    if (text.match(/(控制 | 管理 | 压抑 | 调节 | 冷静 | 平复)/)) {
      components.push({
        component: EmotionalIntelligenceComponents.SELF_REGULATION,
        score: 0.75,
        evidence: '情绪管理尝试'
      });
    }

    // 动机检测
    if (text.match(/(想要 | 希望 | 目标 | 梦想 | 追求 | 努力 | 想成为)/)) {
      components.push({
        component: EmotionalIntelligenceComponents.MOTIVATION,
        score: 0.7,
        evidence: '目标导向表达'
      });
    }

    // 共情检测
    if (text.match(/(理解 | 感受 | 体会 | 站在.*角度 | 换位思考)/)) {
      components.push({
        component: EmotionalIntelligenceComponents.EMPATHY,
        score: 0.75,
        evidence: '共情表达'
      });
    }

    // 社交技能检测
    if (text.match(/(沟通 | 交流 | 关系 | 人际 | 冲突 | 合作 | 团队)/)) {
      components.push({
        component: EmotionalIntelligenceComponents.SOCIAL_SKILLS,
        score: 0.7,
        evidence: '社交互动表达'
      });
    }

    // 负面情绪可能表示需要自我调节
    const negativeEmotions = ['anger', 'fear', 'sadness', 'disgust', 'shame', 'guilt', 'envy', 'loneliness', 'overwhelm'];
    const hasNegativeEmotion = emotions.some(e => negativeEmotions.includes(e.emotion));
    if (hasNegativeEmotion && !components.some(c => c.component === EmotionalIntelligenceComponents.SELF_REGULATION)) {
      components.push({
        component: EmotionalIntelligenceComponents.SELF_REGULATION,
        score: 0.6,
        evidence: '负面情绪出现，可能需要调节'
      });
    }

    return components;
  }

  /**
   * 确定主要维度
   */
  _determinePrimaryComponent(components) {
    if (components.length === 0) {
      return {
        component: EmotionalIntelligenceComponents.SELF_AWARENESS,
        score: 0.5,
        reason: '默认从自我觉察开始'
      };
    }

    // 按分数排序
    components.sort((a, b) => b.score - a.score);
    return components[0];
  }

  /**
   * 生成回应
   */
  _generateResponse(analysis) {
    const responses = [];

    // 情绪识别反馈
    if (analysis.detectedEmotions.length > 0) {
      responses.push({
        type: 'emotion_recognition',
        text: this._getEmotionFeedback(analysis.detectedEmotions),
        source: '情绪觉察'
      });
    }

    // EI 维度支持
    if (analysis.primaryComponent) {
      responses.push({
        type: 'ei_component_support',
        text: this._getEISupport(analysis.primaryComponent.component),
        component: analysis.primaryComponent.component
      });
    }

    // 情绪调节技巧
    if (analysis.detectedEmotions.some(e => ['anger', 'fear', 'sadness', 'overwhelm'].includes(e.emotion))) {
      responses.push({
        type: 'regulation_technique',
        text: this._getRegulationTechnique(),
        technique: '即时调节'
      });
    }

    return responses;
  }

  /**
   * 获取情绪反馈
   */
  _getEmotionFeedback(emotions) {
    const emotionNames = {
      anger: '愤怒',
      fear: '恐惧/焦虑',
      sadness: '悲伤',
      happiness: '快乐',
      disgust: '厌恶',
      surprise: '惊讶',
      shame: '羞愧',
      guilt: '内疚',
      envy: '嫉妒',
      pride: '自豪',
      loneliness: '孤独',
      overwhelm: '压力过大'
    };

    const topEmotion = emotions[0];
    const emotionName = emotionNames[topEmotion.emotion] || '情绪';

    return `我感受到你正在经历${emotionName}。能够识别和命名自己的情绪是情绪智力的第一步，这很重要。`;
  }

  /**
   * 获取 EI 维度支持
   */
  _getEISupport(component) {
    const supports = {
      [EmotionalIntelligenceComponents.SELF_AWARENESS]: {
        text: '自我觉察是情绪智力的基础。你正在关注自己的内在体验，这是成长的开始。试着更细致地描述你的感受：是哪种情绪？强度如何？身体有什么感觉？',
        practice: '情绪日记：每天记录 3 次情绪状态及其触发因素'
      },
      [EmotionalIntelligenceComponents.SELF_REGULATION]: {
        text: '你在尝试管理自己的情绪反应，这需要练习和耐心。记住，情绪本身没有对错，关键是选择如何回应。给自己一些时间和空间。',
        practice: '6 秒法则：情绪激动时，深呼吸 6 秒再回应'
      },
      [EmotionalIntelligenceComponents.MOTIVATION]: {
        text: '你有明确的目标和动力，这很棒！情绪可以成为实现目标的资源。试着将当前的情绪能量引导到你的目标上。',
        practice: '将情绪与价值观连接：这个情绪告诉你什么对你重要？'
      },
      [EmotionalIntelligenceComponents.EMPATHY]: {
        text: '你在尝试理解他人的感受和立场，这是共情能力的体现。共情需要平衡：既要理解他人，也要照顾自己的感受。',
        practice: '主动倾听：专注对方，不急于判断或给建议'
      },
      [EmotionalIntelligenceComponents.SOCIAL_SKILLS]: {
        text: '你在关注人际关系和沟通，这是社交技能的核心。良好的人际关系需要真诚、尊重和有效的沟通。',
        practice: '我信息表达：用"我感到..."代替"你总是..."'
      }
    };

    return supports[component] || {
      text: '情绪智力是可以通过练习提升的。每一步觉察都是进步。',
      practice: '保持好奇和开放的态度'
    };
  }

  /**
   * 获取调节技巧
   */
  _getRegulationTechnique() {
    const techniques = [
      {
        name: '深呼吸',
        instruction: '吸气 4 秒，屏息 4 秒，呼气 6 秒。重复 3-5 次。',
        benefit: '激活副交感神经，快速平静'
      },
      {
        name: '五感着陆',
        instruction: '找出 5 个看到的、4 个触摸到的、3 个听到的、2 个闻到的、1 个尝到的东西。',
        benefit: '回到当下，减少情绪淹没'
      },
      {
        name: '情绪命名',
        instruction: '说出或写下："我现在感到___，强度是___/10。"',
        benefit: '命名情绪可降低其强度'
      },
      {
        name: '身体扫描',
        instruction: '从脚到头，注意身体各部位的感觉，不评判。',
        benefit: '连接身心，释放紧张'
      }
    ];

    return techniques[Math.floor(Math.random() * techniques.length)];
  }

  /**
   * 获取情绪智力说明
   */
  getEIInfo() {
    return {
      title: '情绪智力 (Emotional Intelligence)',
      author: 'Daniel Goleman / John Mayer',
      components: [
        {
          name: '自我觉察',
          description: '识别和命名自己的情绪',
          practices: ['情绪日记', '身体觉察', '反思练习']
        },
        {
          name: '自我调节',
          description: '管理情绪反应，选择回应方式',
          practices: ['深呼吸', '暂停技术', '认知重构']
        },
        {
          name: '动机',
          description: '利用情绪能量追求目标',
          practices: ['价值观澄清', '目标设定', '积极自我对话']
        },
        {
          name: '共情',
          description: '识别和理解他人情绪',
          practices: ['主动倾听', '观点采择', '非暴力沟通']
        },
        {
          name: '社交技能',
          description: '有效管理人际关系',
          practices: ['冲突解决', '合作沟通', '建立信任']
        }
      ],
      coreIdea: '情绪智力不是天生的，可以通过刻意练习提升'
    };
  }
}

module.exports = {
  EmotionalIntelligenceComponents,
  EmotionKeywords,
  EmotionalIntelligenceModule
};
