/**
 * 叙事身份评估模块 (Narrative Identity Assessment)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 叙事心理学理论：
 * - McAdams 生命故事模型 (Life Story Model of Identity)
 * - 叙事身份理论 (Narrative Identity Theory)
 * - 自传体推理 (Autobiographical Reasoning)
 * 
 * 版本：v4.1.0
 * 
 * 核心理论：
 * 1. 生命故事模型：人们通过构建和讲述自己的生命故事来理解自我
 * 2. 叙事身份：身份认同本质上是叙事建构
 * 3. 自传体推理：从个人经历中提取意义和洞察的能力
 * 
 * 评估维度：
 * - 叙事连贯性 (Narrative Coherence)
 * - 叙事复杂性 (Narrative Complexity)
 * - 叙事效价 (Narrative Valence)
 * - 意义建构 (Meaning Making)
 * - 成长导向 (Growth Orientation)
 * 
 * @module narrative-identity
 * @version 4.1.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 叙事身份维度 (Narrative Identity Dimensions)
 * 基于 McAdams 生命故事模型
 */
const NarrativeIdentityDimensions = {
  COHERENCE: 'coherence',       // 叙事连贯性 - 故事是否逻辑清晰
  COMPLEXITY: 'complexity',     // 叙事复杂性 - 故事的深度和层次
  VALENCE: 'valence',           // 叙事效价 - 整体积极/消极倾向
  MEANING_MAKING: 'meaning',    // 意义建构 - 从经历中提取意义的能力
  GROWTH: 'growth',             // 成长导向 - 关注成长vs停滞
  AGENCY: 'agency',             // 能动性 - 自我掌控感
  COMMUNION: 'communion'        // 共生性 - 关系和连接感
};

/**
 * 叙事主题类型 (Narrative Theme Types)
 * 基于 McAdams & McLean (2013)
 */
const NarrativeThemes = {
  AGENCY: {
    SELF_MASTERY: 'self_mastery',      // 自我掌控
    ACHIEVEMENT: 'achievement',        // 成就
    INDEPENDENCE: 'independence',      // 独立
    COURAGE: 'courage',                // 勇气
    EMPOWERMENT: 'empowerment'         // 赋能
  },
  COMMUNION: {
    LOVE: 'love',                      // 爱
    FRIENDSHIP: 'friendship',          // 友谊
    BELONGING: 'belonging',            // 归属
    CARE: 'care',                      // 关怀
    CONTRIBUTION: 'contribution'       // 贡献
  },
  REDEMPTION: 'redemption',            // 救赎序列
  CONTAMINATION: 'contamination'       // 污染序列
};

/**
 * 叙事身份评估量表 (Narrative Identity Scale)
 * 基于 Narrative Identity Scale (NIS) 和 Life Story Interview (LSI)
 */
const NarrativeIdentityScale = {
  // 叙事连贯性 (0-100)
  coherence: {
    score: 0,
    items: [
      '我的生命故事有清晰的主题',
      '我的经历之间有逻辑联系',
      '我能清楚地讲述我的人生',
      '我的故事让他人容易理解'
    ]
  },
  // 叙事复杂性 (0-100)
  complexity: {
    score: 0,
    items: [
      '我的故事有多层次的理解',
      '我能从多个角度看我的经历',
      '我的叙事包含复杂的情感',
      '我认识到故事的多种解释'
    ]
  },
  // 叙事效价 (0-100, 50=中性)
  valence: {
    score: 50,
    items: [
      '我的生命故事整体是积极的',
      '我相信未来会更好',
      '我从困难中学到了东西',
      '我的经历让我更强大'
    ]
  },
  // 意义建构 (0-100)
  meaning: {
    score: 0,
    items: [
      '我能从经历中找到意义',
      '我的经历塑造了我的价值观',
      '我理解为什么事情会发生',
      '我的故事有深层含义'
    ]
  },
  // 成长导向 (0-100)
  growth: {
    score: 0,
    items: [
      '我相信人可以改变和成长',
      '我从挑战中成长',
      '我视困难为学习机会',
      '我在成为更好的自己'
    ]
  },
  // 能动性 (0-100)
  agency: {
    score: 0,
    items: [
      '我能掌控自己的生活',
      '我的选择影响我的未来',
      '我是自己故事的主角',
      '我能实现自己的目标'
    ]
  },
  // 共生性 (0-100)
  communion: {
    score: 0,
    items: [
      '关系对我的生命很重要',
      '我与他人有深层连接',
      '我关心他人的福祉',
      '我为社群做贡献'
    ]
  }
};

// ============ 叙事身份评估类 ============

class NarrativeIdentityAssessment {
  constructor() {
    this.assessmentProfile = JSON.parse(JSON.stringify(NarrativeIdentityScale));
    this.narrativeHistory = [];
    this.keyScenes = [];
    this.narrativeThemes = {
      agency: 0,
      communion: 0,
      redemption: 0,
      contamination: 0
    };
  }

  /**
   * 评估叙事连贯性
   * @param {string} narrative - 用户的生命叙事
   * @returns {Object} 连贯性评估结果
   */
  assessCoherence(narrative) {
    const indicators = {
      temporalOrder: this._detectTemporalOrder(narrative),
      causalConnections: this._detectCausalConnections(narrative),
      thematicUnity: this._detectThematicUnity(narrative),
      narrativeClosure: this._detectNarrativeClosure(narrative)
    };

    const score = (
      indicators.temporalOrder * 0.3 +
      indicators.causalConnections * 0.3 +
      indicators.thematicUnity * 0.2 +
      indicators.narrativeClosure * 0.2
    ) * 100;

    return {
      dimension: 'coherence',
      score: Math.round(score),
      level: this._getLevel(score),
      indicators,
      feedback: this._generateCoherenceFeedback(indicators, score)
    };
  }

  /**
   * 评估叙事复杂性
   * @param {string} narrative - 用户的生命叙事
   * @returns {Object} 复杂性评估结果
   */
  assessComplexity(narrative) {
    const indicators = {
      perspectiveTaking: this._detectPerspectiveTaking(narrative),
      emotionalDepth: this._detectEmotionalDepth(narrative),
      nuanceRecognition: this._detectNuanceRecognition(narrative),
      selfReflection: this._detectSelfReflection(narrative)
    };

    const score = (
      indicators.perspectiveTaking * 0.25 +
      indicators.emotionalDepth * 0.25 +
      indicators.nuanceRecognition * 0.25 +
      indicators.selfReflection * 0.25
    ) * 100;

    return {
      dimension: 'complexity',
      score: Math.round(score),
      level: this._getLevel(score),
      indicators,
      feedback: this._generateComplexityFeedback(indicators, score)
    };
  }

  /**
   * 识别叙事主题
   * @param {string} narrative - 用户的生命叙事
   * @returns {Object} 主题识别结果
   */
  identifyThemes(narrative) {
    const themes = {
      agency: this._countAgencyThemes(narrative),
      communion: this._countCommunionThemes(narrative),
      redemption: this._detectRedemptionSequence(narrative),
      contamination: this._detectContaminationSequence(narrative)
    };

    const total = themes.agency + themes.communion + themes.redemption + themes.contamination;
    
    return {
      rawCounts: themes,
      proportions: {
        agency: total > 0 ? Math.round((themes.agency / total) * 100) : 0,
        communion: total > 0 ? Math.round((themes.communion / total) * 100) : 0,
        redemption: total > 0 ? Math.round((themes.redemption / total) * 100) : 0,
        contamination: total > 0 ? Math.round((themes.contamination / total) * 100) : 0
      },
      dominantTheme: this._getDominantTheme(themes),
      feedback: this._generateThemeFeedback(themes)
    };
  }

  /**
   * 评估意义建构能力
   * @param {string} narrative - 用户的生命叙事
   * @returns {Object} 意义建构评估结果
   */
  assessMeaningMaking(narrative) {
    const indicators = {
      lessonExtraction: this._detectLessons(narrative),
      valueFormation: this._detectValueFormation(narrative),
      purposeDiscovery: this._detectPurpose(narrative),
      identityIntegration: this._detectIdentityIntegration(narrative)
    };

    const score = (
      indicators.lessonExtraction * 0.3 +
      indicators.valueFormation * 0.25 +
      indicators.purposeDiscovery * 0.25 +
      indicators.identityIntegration * 0.2
    ) * 100;

    return {
      dimension: 'meaning',
      score: Math.round(score),
      level: this._getLevel(score),
      indicators,
      feedback: this._generateMeaningFeedback(indicators, score)
    };
  }

  /**
   * 完整叙事身份评估
   * @param {string} narrative - 用户的生命叙事
   * @returns {Object} 完整评估结果
   */
  fullAssessment(narrative) {
    const coherence = this.assessCoherence(narrative);
    const complexity = this.assessComplexity(narrative);
    const themes = this.identifyThemes(narrative);
    const meaning = this.assessMeaningMaking(narrative);

    const overallScore = Math.round(
      (coherence.score + complexity.score + meaning.score) / 3
    );

    return {
      overall: {
        score: overallScore,
        level: this._getLevel(overallScore),
        summary: this._generateOverallSummary(coherence, complexity, themes, meaning)
      },
      dimensions: {
        coherence,
        complexity,
        themes,
        meaning
      },
      recommendations: this._generateRecommendations(coherence, complexity, themes, meaning),
      timestamp: new Date().toISOString()
    };
  }

  // ============ 私有方法 ============

  _detectTemporalOrder(narrative) {
    const temporalMarkers = [
      '首先', '然后', '接着', '后来', '之后', '最后',
      '以前', '现在', '将来', '小时候', '长大后',
      '那年', '当时', '从此', '从此以后'
    ];
    const count = temporalMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 5, 1);
  }

  _detectCausalConnections(narrative) {
    const causalMarkers = [
      '因为', '所以', '因此', '导致', '结果',
      '由于', '使得', '造成', '源于', '致使'
    ];
    const count = causalMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 4, 1);
  }

  _detectThematicUnity(narrative) {
    const thematicWords = [
      '主题', '一直', '总是', '从来', '核心',
      '本质', '关键', '重要', '意义', '价值'
    ];
    const count = thematicWords.filter(m => narrative.includes(m)).length;
    return Math.min(count / 3, 1);
  }

  _detectNarrativeClosure(narrative) {
    const closureMarkers = [
      '终于', '现在明白了', '理解了', '接受了',
      '放下了', '和解', '成长了', '学会了'
    ];
    const count = closureMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 2, 1);
  }

  _detectPerspectiveTaking(narrative) {
    const perspectiveMarkers = [
      '从...角度看', '另一方面', '同时', '但是',
      '然而', '也许', '可能', '或许', '换个角度'
    ];
    const count = perspectiveMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 3, 1);
  }

  _detectEmotionalDepth(narrative) {
    const emotionWords = [
      '感到', '觉得', '情绪', '感受', '心情',
      '痛苦', '喜悦', '愤怒', '悲伤', '恐惧',
      '复杂', '矛盾', '纠结', '困惑', '释然'
    ];
    const count = emotionWords.filter(m => narrative.includes(m)).length;
    return Math.min(count / 4, 1);
  }

  _detectNuanceRecognition(narrative) {
    const nuanceMarkers = [
      '不完全', '部分是', '有时候', '在某些情况下',
      '取决于', '视情况而定', '既有...也有', '既...又'
    ];
    const count = nuanceMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 2, 1);
  }

  _detectSelfReflection(narrative) {
    const reflectionMarkers = [
      '我意识到', '我反思', '我思考', '我理解',
      '我明白', '我发现', '我学到', '我认识'
    ];
    const count = reflectionMarkers.filter(m => narrative.includes(m)).length;
    return Math.min(count / 3, 1);
  }

  _countAgencyThemes(narrative) {
    const agencyWords = [
      '我选择', '我决定', '我掌控', '我实现', '我成功',
      '我克服', '我战胜', '我独立', '我自主', '我负责'
    ];
    return agencyWords.filter(w => narrative.includes(w)).length;
  }

  _countCommunionThemes(narrative) {
    const communionWords = [
      '我们', '一起', '家人', '朋友', '爱',
      '关心', '帮助', '支持', '连接', '归属', '贡献'
    ];
    return communionWords.filter(w => narrative.includes(w)).length;
  }

  _detectRedemptionSequence(narrative) {
    const redemptionPatterns = [
      /困难.*成长/, /挫折.*学习/, /痛苦.*收获/,
      /失败.*成功/, /黑暗.*光明/, /低谷.*高峰/
    ];
    return redemptionPatterns.filter(p => p.test(narrative)).length;
  }

  _detectContaminationSequence(narrative) {
    const contaminationPatterns = [
      /美好.*失去/, /希望.*失望/, /成功.*失败/,
      /快乐.*痛苦/, /信任.*背叛/, /得到.*失去/
    ];
    return contaminationPatterns.filter(p => p.test(narrative)).length;
  }

  _detectLessons(narrative) {
    const lessonMarkers = ['学到', '学会', '懂得', '明白', '领悟', '收获'];
    return lessonMarkers.some(m => narrative.includes(m)) ? 1 : 0;
  }

  _detectValueFormation(narrative) {
    const valueMarkers = ['价值', '信念', '原则', '重要', '意义'];
    return valueMarkers.some(m => narrative.includes(m)) ? 1 : 0;
  }

  _detectPurpose(narrative) {
    const purposeMarkers = ['目标', '使命', '意义', '方向', '追求'];
    return purposeMarkers.some(m => narrative.includes(m)) ? 1 : 0;
  }

  _detectIdentityIntegration(narrative) {
    const integrationMarkers = ['我是', '我成为', '塑造了我', '定义了我'];
    return integrationMarkers.some(m => narrative.includes(m)) ? 1 : 0;
  }

  _getLevel(score) {
    if (score >= 80) return '很高';
    if (score >= 60) return '较高';
    if (score >= 40) return '中等';
    if (score >= 20) return '较低';
    return '很低';
  }

  _getDominantTheme(themes) {
    const max = Math.max(themes.agency, themes.communion, themes.redemption, themes.contamination);
    if (max === 0) return '无明显主题';
    if (themes.agency === max) return '能动性主题';
    if (themes.communion === max) return '共生主题';
    if (themes.redemption === max) return '救赎序列';
    if (themes.contamination === max) return '污染序列';
    return '混合主题';
  }

  _generateCoherenceFeedback(indicators, score) {
    if (score >= 80) {
      return '你的生命叙事非常连贯，有清晰的时间线和因果联系。这表明你对自己的经历有很好的整合能力。';
    } else if (score >= 60) {
      return '你的生命叙事较为连贯，但某些部分的联系可以更加清晰。尝试找出经历之间的因果关系。';
    } else if (score >= 40) {
      return '你的生命叙事有一定的连贯性，但可能需要更多的时间标记和因果连接来使故事更清晰。';
    } else {
      return '你的生命叙事连贯性较低。建议尝试按时间顺序梳理事件，并思考它们之间的联系。';
    }
  }

  _generateComplexityFeedback(indicators, score) {
    if (score >= 80) {
      return '你的叙事非常复杂且有深度，能从多角度理解经历。这显示了很高的自我反思能力。';
    } else if (score >= 60) {
      return '你的叙事有一定的复杂性。尝试从更多角度审视经历，探索其中的细微差别。';
    } else if (score >= 40) {
      return '你的叙事复杂性中等。可以试着思考经历的多面性，以及它们对你的不同影响。';
    } else {
      return '你的叙事相对简单。尝试深入探索经历背后的情感和多重含义。';
    }
  }

  _generateMeaningFeedback(indicators, score) {
    if (score >= 80) {
      return '你非常善于从经历中提取意义，这有助于你建立清晰的身份认同和生活方向。';
    } else if (score >= 60) {
      return '你有较好的意义建构能力。继续反思经历，探索它们如何塑造你的价值观和目标。';
    } else if (score >= 40) {
      return '你的意义建构能力中等。尝试问自己："这件事教会了我什么？"来深化理解。';
    } else {
      return '你的意义建构能力有提升空间。试着从每个重要经历中寻找学习和成长的機會。';
    }
  }

  _generateThemeFeedback(themes) {
    const feedback = [];
    
    if (themes.agency > themes.communion) {
      feedback.push('你的叙事中能动性主题较为突出，强调个人掌控和成就。');
    } else if (themes.communion > themes.agency) {
      feedback.push('你的叙事中共生主题较为突出，强调关系和连接。');
    } else {
      feedback.push('你的叙事中能动性和共生主题较为平衡。');
    }

    if (themes.redemption > themes.contamination) {
      feedback.push('你的叙事中救赎序列多于污染序列，显示成长导向。');
    } else if (themes.contamination > themes.redemption) {
      feedback.push('你的叙事中污染序列较多，可能需要关注如何从困难中寻找成长。');
    }

    return feedback.join(' ');
  }

  _generateOverallSummary(coherence, complexity, themes, meaning) {
    return `你的叙事身份整体${coherence.level}，连贯性${coherence.score}分，复杂性${complexity.score}分，意义建构${meaning.score}分。${themes.feedback}`;
  }

  _generateRecommendations(coherence, complexity, themes, meaning) {
    const recommendations = [];

    if (coherence.score < 60) {
      recommendations.push('尝试按时间顺序写下你的生命故事，找出事件之间的联系。');
    }

    if (complexity.score < 60) {
      recommendations.push('尝试从多个角度审视同一经历，探索其中的复杂情感。');
    }

    if (meaning.score < 60) {
      recommendations.push('对每个重要经历问自己："这件事教会了我什么？"');
    }

    if (themes.contamination > themes.redemption) {
      recommendations.push('尝试寻找困难经历中的成长和学习，重构为救赎叙事。');
    }

    return recommendations;
  }
}

// ============ 导出 ============

module.exports = {
  NarrativeIdentityAssessment,
  NarrativeIdentityDimensions,
  NarrativeThemes,
  NarrativeIdentityScale
};
