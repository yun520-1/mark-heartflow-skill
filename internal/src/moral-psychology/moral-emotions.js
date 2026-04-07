/**
 * 道德情感识别模块 (Moral Emotions Recognition)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 道德心理学理论：
 * - 道德情感理论 (Moral Emotions Theory)
 * - Haidt 道德基础理论 (Moral Foundations Theory)
 * - 道德情感分类 (Classification of Moral Emotions)
 * 
 * 版本：v4.1.0
 * 
 * 核心理论：
 * 1. 道德情感分类 (Haidt, 2003):
 *    - 自我意识情感：羞耻、内疚、尴尬、自豪
 *    - 他人批评情感：愤怒、厌恶、轻蔑
 *    - 他人赞美情感：感激、敬畏、提升感
 *    - 同情情感：同情、怜悯、关怀
 * 
 * 2. 道德基础理论 (Haidt & Joseph, 2004):
 *    - 伤害/关怀 (Harm/Care)
 *    - 公平/互惠 (Fairness/Reciprocity)
 *    - 内群体/忠诚 (Ingroup/Loyalty)
 *    - 权威/尊重 (Authority/Respect)
 *    - 纯洁/神圣 (Purity/Sanctity)
 *    - 自由/压迫 (Liberty/Oppression) - 后期添加
 * 
 * 3. 道德情感功能：
 *    - 快速道德判断
 *    - 道德行为动机
 *    - 社会规范维护
 *    - 道德身份建构
 * 
 * @module moral-emotions
 * @version 4.1.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 道德情感分类 (Classification of Moral Emotions)
 * 基于 Haidt (2003) 的道德情感理论
 */
const MoralEmotionCategories = {
  // 自我意识情感 (Self-Conscious Emotions)
  SELF_CONSCIOUS: {
    SHAME: 'shame',           // 羞耻 - 对自我的负面评价
    GUILT: 'guilt',           // 内疚 - 对行为的负面评价
    EMBARRASSMENT: 'embarrassment', // 尴尬 - 社会性不适
    PRIDE: 'pride',           // 自豪 - 对成就的正面评价
    AUTHENTIC_PRIDE: 'authentic_pride', // 真实自豪 - 基于努力
    HUBRISTIC_PRIDE: 'hubristic_pride'  // 傲慢自豪 - 基于天赋
  },
  
  // 他人批评情感 (Other-Condemning Emotions)
  OTHER_CONDEMNING: {
    ANGER: 'anger',           // 愤怒 - 对道德违规的反应
    DISGUST: 'disgust',       // 厌恶 - 对污染的反应
    CONTEMPT: 'contempt'      // 轻蔑 - 对低劣的反应
  },
  
  // 他人赞美情感 (Other-Praising Emotions)
  OTHER_PRAISING: {
    GRATITUDE: 'gratitude',   // 感激 - 对他人的善意
    AWE: 'awe',               // 敬畏 - 对宏大事物
    ELEVATION: 'elevation',   // 提升感 - 对道德榜样
    ADMIRATION: 'admiration'  // 钦佩 - 对卓越表现
  },
  
  // 同情情感 (Suffering Emotions)
  COMPASSION: {
    SYMPATHY: 'sympathy',     // 同情 - 对他人的痛苦
    PITY: 'pity',             // 怜悯 - 对不幸
    COMPASSION: 'compassion', // 关怀 - 想帮助的愿望
    EMPATHY: 'empathy'        // 共情 - 感受他人感受
  }
};

/**
 * 道德基础 (Moral Foundations)
 * 基于 Haidt & Joseph (2004) 的道德基础理论
 */
const MoralFoundations = {
  CARE: {
    name: '关怀/伤害',
    emotion: '同情、怜悯',
    virtue: '关怀、善良',
    vice: '伤害、残忍',
    trigger: '看到他人受苦',
    description: '关注他人的福祉，避免造成伤害'
  },
  FAIRNESS: {
    name: '公平/欺骗',
    emotion: '愤怒、感激',
    virtue: '公平、正义',
    vice: '欺骗、不公',
    trigger: '看到不公平对待',
    description: '关注公平对待和互惠原则'
  },
  LOYALTY: {
    name: '忠诚/背叛',
    emotion: '愤怒、自豪',
    virtue: '忠诚、爱国',
    vice: '背叛、叛徒',
    trigger: '看到群体背叛',
    description: '关注群体归属和忠诚'
  },
  AUTHORITY: {
    name: '权威/颠覆',
    emotion: '尊重、愤怒',
    virtue: '尊重、服从',
    vice: '颠覆、无礼',
    trigger: '看到不尊重权威',
    description: '关注社会秩序和等级'
  },
  PURITY: {
    name: '纯洁/堕落',
    emotion: '厌恶、敬畏',
    virtue: '纯洁、节制',
    vice: '堕落、污染',
    trigger: '看到不洁事物',
    description: '关注身体和精神的纯洁'
  },
  LIBERTY: {
    name: '自由/压迫',
    emotion: '愤怒、反抗',
    virtue: '自由、自主',
    vice: '压迫、暴政',
    trigger: '看到压迫行为',
    description: '关注个人自由和自主权'
  }
};

/**
 * 道德情感评估量表 (Moral Emotion Assessment Scale)
 */
const MoralEmotionScale = {
  // 道德情感识别能力 (0-100)
  recognition: {
    score: 0,
    items: [
      '我能识别自己的道德情感',
      '我能区分内疚和羞耻',
      '我能识别他人的道德情感',
      '我理解道德情感的来源'
    ]
  },
  // 道德情感表达能力 (0-100)
  expression: {
    score: 0,
    items: [
      '我能适当表达道德情感',
      '我的情感表达与情境匹配',
      '我能用语言描述道德情感',
      '我的表达被他人理解'
    ]
  },
  // 道德情感调节能力 (0-100)
  regulation: {
    score: 0,
    items: [
      '我能调节过度的道德情感',
      '我不会被道德情感淹没',
      '我能从负面道德情感中恢复',
      '我能培养积极的道德情感'
    ]
  },
  // 道德情感整合能力 (0-100)
  integration: {
    score: 0,
    items: [
      '我的道德情感与价值观一致',
      '道德情感指导我的行为',
      '我从道德情感中学习',
      '道德情感帮助我成长'
    ]
  }
};

// ============ 道德情感识别类 ============

class MoralEmotionsRecognition {
  constructor() {
    this.emotionProfile = JSON.parse(JSON.stringify(MoralEmotionScale));
    this.moralFoundationProfile = {
      care: 50,
      fairness: 50,
      loyalty: 50,
      authority: 50,
      purity: 50,
      liberty: 50
    };
    this.emotionHistory = [];
  }

  /**
   * 识别道德情感类型
   * @param {string} description - 用户对情感体验的描述
   * @returns {Object} 情感识别结果
   */
  identifyEmotion(description) {
    const result = {
      primary: null,
      category: null,
      intensity: 0,
      moralFoundation: null,
      confidence: 0,
      analysis: {}
    };

    // 检测自我意识情感
    const selfConsciousScore = this._detectSelfConsciousEmotions(description);
    // 检测他人批评情感
    const otherCondemningScore = this._detectOtherCondemningEmotions(description);
    // 检测他人赞美情感
    const otherPraisingScore = this._detectOtherPraisingEmotions(description);
    // 检测同情情感
    const compassionScore = this._detectCompassionEmotions(description);

    const scores = {
      [MoralEmotionCategories.SELF_CONSCIOUS.GUILT]: selfConsciousScore.guilt,
      [MoralEmotionCategories.SELF_CONSCIOUS.SHAME]: selfConsciousScore.shame,
      [MoralEmotionCategories.OTHER_CONDEMNING.ANGER]: otherCondemningScore.anger,
      [MoralEmotionCategories.OTHER_CONDEMNING.DISGUST]: otherCondemningScore.disgust,
      [MoralEmotionCategories.OTHER_PRAISING.GRATITUDE]: otherPraisingScore.gratitude,
      [MoralEmotionCategories.OTHER_PRAISING.AWE]: otherPraisingScore.awe,
      [MoralEmotionCategories.COMPASSION.SYMPATHY]: compassionScore.sympathy,
      [MoralEmotionCategories.COMPASSION.COMPASSION]: compassionScore.compassion
    };

    // 找出主要情感
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        result.primary = emotion;
        result.intensity = Math.round(score * 100);
        result.confidence = Math.min(score * 1.5, 1);
      }
    }

    // 确定情感类别
    if (selfConsciousScore.total >= otherCondemningScore.total &&
        selfConsciousScore.total >= otherPraisingScore.total &&
        selfConsciousScore.total >= compassionScore.total) {
      result.category = 'self_conscious';
    } else if (otherCondemningScore.total >= otherPraisingScore.total &&
               otherCondemningScore.total >= compassionScore.total) {
      result.category = 'other_condemning';
    } else if (otherPraisingScore.total >= compassionScore.total) {
      result.category = 'other_praising';
    } else {
      result.category = 'compassion';
    }

    // 识别道德基础
    result.moralFoundation = this._identifyMoralFoundation(description);

    // 生成分析
    result.analysis = this._generateEmotionAnalysis(result, description);

    return result;
  }

  /**
   * 评估道德基础倾向
   * @param {string[]} responses - 用户对道德情境的反应
   * @returns {Object} 道德基础评估结果
   */
  assessMoralFoundations(responses) {
    const profile = {
      care: this._assessCareFoundation(responses),
      fairness: this._assessFairnessFoundation(responses),
      loyalty: this._assessLoyaltyFoundation(responses),
      authority: this._assessAuthorityFoundation(responses),
      purity: this._assessPurityFoundation(responses),
      liberty: this._assessLibertyFoundation(responses)
    };

    const scores = Object.values(profile);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    return {
      profile,
      dominant: this._getDominantFoundation(profile),
      balance: this._calculateBalance(scores),
      interpretation: this._interpretProfile(profile, avg)
    };
  }

  /**
   * 道德情感干预建议
   * @param {Object} emotionResult - 情感识别结果
   * @returns {Object} 干预建议
   */
  generateIntervention(emotionResult) {
    const interventions = {
      guilt: this._guiltIntervention(emotionResult),
      shame: this._shameIntervention(emotionResult),
      anger: this._angerIntervention(emotionResult),
      disgust: this._disgustIntervention(emotionResult),
      gratitude: this._gratitudeIntervention(emotionResult),
      compassion: this._compassionIntervention(emotionResult)
    };

    return interventions[emotionResult.primary] || {
      general: '请进一步描述你的情感体验，以便我提供更具体的建议。'
    };
  }

  // ============ 私有方法 ============

  _detectSelfConsciousEmotions(description) {
    const guiltMarkers = ['内疚', '愧疚', '后悔', '对不起', '不应该', '做错'];
    const shameMarkers = ['羞耻', '丢脸', '没脸', '自卑', '不如人', '抬不起头'];
    
    const guiltScore = guiltMarkers.filter(m => description.includes(m)).length / guiltMarkers.length;
    const shameScore = shameMarkers.filter(m => description.includes(m)).length / shameMarkers.length;

    return {
      guilt: guiltScore,
      shame: shameScore,
      total: (guiltScore + shameScore) / 2
    };
  }

  _detectOtherCondemningEmotions(description) {
    const angerMarkers = ['愤怒', '生气', '气愤', '恼火', '不公平', '凭什么'];
    const disgustMarkers = ['厌恶', '恶心', '肮脏', '龌龊', '受不了'];
    const contemptMarkers = ['轻蔑', '鄙视', '瞧不起', '低劣', '可笑'];

    return {
      anger: angerMarkers.filter(m => description.includes(m)).length / angerMarkers.length,
      disgust: disgustMarkers.filter(m => description.includes(m)).length / disgustMarkers.length,
      contempt: contemptMarkers.filter(m => description.includes(m)).length / contemptMarkers.length,
      total: 0
    };
  }

  _detectOtherPraisingEmotions(description) {
    const gratitudeMarkers = ['感激', '感谢', '感恩', '谢谢', '幸运'];
    const aweMarkers = ['敬畏', '震撼', '伟大', '崇高', '渺小'];
    const elevationMarkers = ['感动', '鼓舞', '榜样', '崇高', '提升'];

    return {
      gratitude: gratitudeMarkers.filter(m => description.includes(m)).length / gratitudeMarkers.length,
      awe: aweMarkers.filter(m => description.includes(m)).length / aweMarkers.length,
      elevation: elevationMarkers.filter(m => description.includes(m)).length / elevationMarkers.length,
      total: 0
    };
  }

  _detectCompassionEmotions(description) {
    const sympathyMarkers = ['同情', '可怜', '不幸', '难过', '心疼'];
    const compassionMarkers = ['关怀', '帮助', '支持', '陪伴', '想帮'];

    return {
      sympathy: sympathyMarkers.filter(m => description.includes(m)).length / sympathyMarkers.length,
      compassion: compassionMarkers.filter(m => description.includes(m)).length / compassionMarkers.length,
      total: 0
    };
  }

  _identifyMoralFoundation(description) {
    const foundations = {
      care: ['伤害', '痛苦', '受苦', '关怀', '善良', '残忍'],
      fairness: ['公平', '公正', '平等', '正义', '欺骗', '不公'],
      loyalty: ['忠诚', '背叛', '团体', '国家', '叛徒', '归属'],
      authority: ['尊重', '权威', '秩序', '服从', '无礼', '颠覆'],
      purity: ['纯洁', '肮脏', '神圣', '堕落', '污染', '节制'],
      liberty: ['自由', '压迫', '自主', '权利', '暴政', '解放']
    };

    const scores = {};
    for (const [foundation, markers] of Object.entries(foundations)) {
      scores[foundation] = markers.filter(m => description.includes(m)).length / markers.length;
    }

    const maxFoundation = Object.entries(scores)
      .reduce((a, b) => a[1] > b[1] ? a : b, ['care', 0])[0];

    return {
      primary: maxFoundation,
      scores,
      description: MoralFoundations[maxFoundation.toUpperCase()]?.description || ''
    };
  }

  _assessCareFoundation(responses) {
    const careMarkers = ['关心', '帮助', '伤害', '痛苦', '善良'];
    const score = responses.filter(r => careMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _assessFairnessFoundation(responses) {
    const fairnessMarkers = ['公平', '正义', '平等', '权利'];
    const score = responses.filter(r => fairnessMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _assessLoyaltyFoundation(responses) {
    const loyaltyMarkers = ['忠诚', '团体', '归属', '国家'];
    const score = responses.filter(r => loyaltyMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _assessAuthorityFoundation(responses) {
    const authorityMarkers = ['尊重', '权威', '秩序', '传统'];
    const score = responses.filter(r => authorityMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _assessPurityFoundation(responses) {
    const purityMarkers = ['纯洁', '神圣', '节制', '污染'];
    const score = responses.filter(r => purityMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _assessLibertyFoundation(responses) {
    const libertyMarkers = ['自由', '自主', '权利', '压迫'];
    const score = responses.filter(r => libertyMarkers.some(m => r.includes(m))).length;
    return Math.min((score / responses.length) * 100, 100);
  }

  _getDominantFoundation(profile) {
    const entries = Object.entries(profile);
    const max = entries.reduce((a, b) => a[1] > b[1] ? a : b);
    return {
      foundation: max[0],
      name: MoralFoundations[max[0].toUpperCase()].name,
      score: max[1]
    };
  }

  _calculateBalance(scores) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 10) return '非常平衡';
    if (stdDev < 20) return '较为平衡';
    if (stdDev < 30) return '中等平衡';
    return '不平衡';
  }

  _interpretProfile(profile, avg) {
    const interpretations = [];
    
    interpretations.push(`你的道德基础整体强度为${Math.round(avg)}分。`);
    
    const dominant = this._getDominantFoundation(profile);
    interpretations.push(`你最突出的道德基础是${dominant.name}。`);
    
    const weak = Object.entries(profile)
      .filter(([, score]) => score < 30)
      .map(([key]) => MoralFoundations[key.toUpperCase()].name);
    
    if (weak.length > 0) {
      interpretations.push(`你可能较少关注：${weak.join('、')}。`);
    }

    return interpretations.join(' ');
  }

  _generateEmotionAnalysis(result, description) {
    return {
      emotionName: this._getEmotionName(result.primary),
      category: this._getCategoryName(result.category),
      description: `你正在体验${result.emotionName}，这是一种${result.category}。`,
      trigger: this._identifyTrigger(result.category),
      function: this._explainFunction(result.primary),
      suggestion: this._generateSuggestion(result.primary)
    };
  }

  _getEmotionName(emotion) {
    const names = {
      guilt: '内疚', shame: '羞耻', anger: '愤怒',
      disgust: '厌恶', gratitude: '感激', awe: '敬畏',
      sympathy: '同情', compassion: '关怀'
    };
    return names[emotion] || emotion;
  }

  _getCategoryName(category) {
    const names = {
      self_conscious: '自我意识情感',
      other_condemning: '他人批评情感',
      other_praising: '他人赞美情感',
      compassion: '同情情感'
    };
    return names[category] || category;
  }

  _identifyTrigger(category) {
    const triggers = {
      self_conscious: '通常由自我评价或社会评价触发',
      other_condemning: '通常由他人道德违规触发',
      other_praising: '通常由他人道德行为触发',
      compassion: '通常由他人痛苦触发'
    };
    return triggers[category] || '';
  }

  _explainFunction(emotion) {
    const functions = {
      guilt: '内疚促使你修复关系、弥补过错',
      shame: '羞耻促使你符合社会规范、避免排斥',
      anger: '愤怒促使你对抗不公、维护正义',
      disgust: '厌恶促使你远离污染、保持纯洁',
      gratitude: '感激促使你回报善意、维系关系',
      awe: '敬畏促使你超越自我、连接宏大',
      sympathy: '同情促使你关注他人、提供帮助',
      compassion: '关怀促使你采取行动、减轻痛苦'
    };
    return functions[emotion] || '';
  }

  _generateSuggestion(emotion) {
    const suggestions = {
      guilt: '尝试弥补过错，原谅自己，从中学习',
      shame: '区分行为和身份，接纳不完美的自己',
      anger: '表达感受而非攻击，寻求公平解决方案',
      disgust: '反思厌恶来源，区分真实威胁和偏见',
      gratitude: '表达感谢，记录感恩，传递善意',
      awe: '保持开放，体验宏大，培养谦卑',
      sympathy: '倾听理解，提供陪伴，适度帮助',
      compassion: '采取行动，设定边界，避免倦怠'
    };
    return suggestions[emotion] || '请进一步描述你的体验';
  }

  _guiltIntervention(result) {
    return {
      name: '内疚干预',
      steps: [
        '1. 识别具体行为：明确是什么行为让你感到内疚',
        '2. 评估责任：你真的应该为此负责吗？',
        '3. 弥补行动：有什么可以弥补的方式？',
        '4. 自我宽恕：学习后原谅自己，继续前行',
        '5. 未来预防：如何避免类似情况？'
      ],
      reflection: '内疚是有价值的情感，它提示你违背了自己的价值观。但它不应该定义你的身份。'
    };
  }

  _shameIntervention(result) {
    return {
      name: '羞耻干预',
      steps: [
        '1. 区分行为和身份：你的行为不等于你的价值',
        '2. 挑战羞耻想法：这些想法真实吗？有帮助吗？',
        '3. 自我同情：像对待朋友一样对待自己',
        '4. 寻求支持：与信任的人分享你的感受',
        '5. 价值重连：重新连接你的核心价值观'
      ],
      reflection: '羞耻说"我不好"，内疚说"我做了不好的事"。记住：你的价值不取决于完美。'
    };
  }

  _angerIntervention(result) {
    return {
      name: '愤怒干预',
      steps: [
        '1. 暂停反应：深呼吸，给自己时间',
        '2. 识别触发：是什么让你愤怒？',
        '3. 评估公平：真的不公平吗？还是误解？',
        '4. 建设性表达：用"我"陈述表达感受',
        '5. 寻求解决：聚焦问题解决而非指责'
      ],
      reflection: '愤怒提示你感知到不公。它可以是改变的动力，但需要建设性表达。'
    };
  }

  _disgustIntervention(result) {
    return {
      name: '厌恶干预',
      steps: [
        '1. 识别来源：是什么触发厌恶？',
        '2. 评估威胁：这是真实威胁还是心理反应？',
        '3. 探索根源：这种厌恶从哪里来？',
        '4. 挑战偏见：是否有文化或社会偏见？',
        '5. 培养开放：尝试理解和接纳差异'
      ],
      reflection: '厌恶保护你远离污染，但也可能导致不必要的偏见。保持开放心态。'
    };
  }

  _gratitudeIntervention(result) {
    return {
      name: '感激培养',
      steps: [
        '1. 识别恩惠：谁给了你什么帮助？',
        '2. 承认意图：对方是有意为之吗？',
        '3. 认识价值：这个帮助对你有多重要？',
        '4. 表达感谢：用语言或行动表达感激',
        '5. 传递善意：将善意传递给他人'
      ],
      reflection: '感激连接你与他人，增强幸福感。每天记录三件感恩的事。'
    };
  }

  _compassionIntervention(result) {
    return {
      name: '关怀培养',
      steps: [
        '1. 正念觉察：注意他人的痛苦',
        '2. 共同人性：认识到痛苦是普遍的',
        '3. 情感共鸣：允许自己感受他人的痛苦',
        '4. 行动意愿：思考如何帮助',
        '5. 设定边界：避免关怀倦怠'
      ],
      reflection: '关怀是道德行动的核心。记住：照顾自己才能持续照顾他人。'
    };
  }
}

// ============ 导出 ============

module.exports = {
  MoralEmotionsRecognition,
  MoralEmotionCategories,
  MoralFoundations,
  MoralEmotionScale
};
