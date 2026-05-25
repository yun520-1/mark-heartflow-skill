/**
 * 情绪评价维度定义 (Appraisal Dimensions)
 * v2.10.0 新增
 * 
 * 基于 Scherer (2001) 的评价维度模型和 SEP 情绪评价传统理论
 * 
 * 核心观点：情绪不是对事件的直接反应，而是对事件的评价/解释的结果
 * 同样的事件，不同的评价 → 不同的情绪
 */

/**
 * 评价维度关键词库
 */
const appraisalDimensions = {
  /**
   * 新奇性 (Novelty)
   * 问题：这是预期的还是意外的？
   * 情绪影响：惊讶 vs 平静
   */
  novelty: {
    expected: {
      keywords: ['预料之中', '习惯了', '正常', '应该的', '意料之内', '不出所料', '常见的', '典型的'],
      weight: 1.0
    },
    unexpected: {
      keywords: ['没想到', '突然', '意外', '居然', '竟然', '出乎意料', '突如其来', '万万没想到', ' surprising'],
      weight: 1.0
    }
  },

  /**
   * 效价 (Valence)
   * 问题：这是好的还是坏的？
   * 情绪影响：愉悦 vs 不愉悦
   */
  valence: {
    positive: {
      keywords: ['好事', '幸运', '开心', '棒', '好', '不错', '满意', '喜欢', '愉快', '美好', '顺利', '成功'],
      weight: 1.0
    },
    negative: {
      keywords: ['糟糕', '不幸', '难过', '烦', '坏', '差', '讨厌', '痛苦', '困难', '挫折', '失败', '倒霉'],
      weight: 1.0
    }
  },

  /**
   * 目标相关性 (Goal Relevance)
   * 问题：这与我的目标相关吗？
   * 情绪影响：关切 vs 漠然
   */
  goalRelevance: {
    relevant: {
      keywords: ['对我很重要', '我在乎', '关键', '重要', '必须', '一定', '需要', '想要', '渴望', '目标'],
      weight: 1.0
    },
    irrelevant: {
      keywords: ['无所谓', '不重要', '没关系', '随便', '都行', '不在乎', '无所谓', '无关紧要'],
      weight: 1.0
    }
  },

  /**
   * 目标一致性 (Goal Congruence)
   * 问题：这促进还是阻碍我的目标？
   * 情绪影响：高兴 vs 沮丧
   */
  goalCongruence: {
    congruent: {
      keywords: ['顺利', '如愿', '成功', '达成', '实现', '帮助', '支持', '促进', '有利'],
      weight: 1.0
    },
    incongruent: {
      keywords: ['阻碍', '失败', '挫折', '困难', '打击', '破坏', '妨碍', '不利', '受阻', '落空'],
      weight: 1.0
    }
  },

  /**
   * 能动性 (Agency)
   * 问题：谁/什么导致了这个？
   * 情绪影响：愤怒 (他人) vs 内疚 (自己) vs 悲伤 (环境)
   */
  agency: {
    self: {
      keywords: ['我造成的', '我的错', '我选择', '我决定', '我导致', '怪我', '怨我', '我害的', '我负责'],
      weight: 1.0
    },
    other: {
      keywords: ['他害的', '都怪你', '他们', '他造成的', '他的错', '别人', '某人', '老板', '同事', '朋友'],
      weight: 1.0
    },
    circumstance: {
      keywords: ['没办法', '运气不好', '环境', '命运', '天意', '没办法', '无奈', '被迫', '不得不'],
      weight: 1.0
    }
  },

  /**
   * 控制性 (Control)
   * 问题：我能应对/改变这个吗？
   * 情绪影响：自信 vs 焦虑/无助
   */
  control: {
    high: {
      keywords: ['我能', '我可以', '有办法', '可控', '掌握', '搞定', '解决', '处理', '应对', '能行'],
      weight: 1.0
    },
    low: {
      keywords: ['我没办法', '无能为力', '控制不了', '没办法', '无助', '绝望', '失控', '无力', '做不到', '不行'],
      weight: 1.0
    }
  },

  /**
   * 规范性 (Norms)
   * 问题：这符合我的价值观/标准吗？
   * 情绪影响：骄傲 vs 羞愧
   */
  norms: {
    congruent: {
      keywords: ['应该的', '对的', '值得', '正确', '合适', '合理', '符合', '道德', '原则'],
      weight: 1.0
    },
    incongruent: {
      keywords: ['不应该', '不对', '后悔', '错误', '不该', '违背', '违反', '丢脸', '羞耻', '内疚'],
      weight: 1.0
    }
  }
};

/**
 * 评价组合 → 情绪映射
 * 基于评价理论的经典情绪产生模式
 */
const appraisalToEmotion = [
  {
    pattern: { agency: 'other', valence: 'negative', goalCongruence: 'incongruent' },
    emotion: '愤怒',
    explanation: '他人导致的负面结果，目标受阻 → 愤怒',
    intensity: 'high'
  },
  {
    pattern: { agency: 'self', valence: 'negative', goalCongruence: 'incongruent', norms: 'incongruent' },
    emotion: '内疚',
    explanation: '自己导致的负面结果，违反自己的标准 → 内疚',
    intensity: 'medium'
  },
  {
    pattern: { agency: 'self', valence: 'negative', goalCongruence: 'incongruent', norms: 'congruent' },
    emotion: '羞愧',
    explanation: '自己导致的负面结果，感到自我价值受损 → 羞愧',
    intensity: 'high'
  },
  {
    pattern: { agency: 'circumstance', valence: 'negative', control: 'low' },
    emotion: '焦虑',
    explanation: '环境导致的负面结果，低控制感 → 焦虑/担忧',
    intensity: 'medium'
  },
  {
    pattern: { agency: 'circumstance', valence: 'negative', control: 'low', goalCongruence: 'incongruent' },
    emotion: '无助',
    explanation: '环境导致的负面结果，完全无法控制 → 无助/绝望',
    intensity: 'high'
  },
  {
    pattern: { novelty: 'unexpected', valence: 'negative' },
    emotion: '震惊',
    explanation: '意外的负面事件 → 震惊',
    intensity: 'high'
  },
  {
    pattern: { novelty: 'unexpected', valence: 'positive' },
    emotion: '惊喜',
    explanation: '意外的正面事件 → 惊喜',
    intensity: 'high'
  },
  {
    pattern: { agency: 'self', valence: 'positive', goalCongruence: 'congruent' },
    emotion: '自豪',
    explanation: '自己导致的正面结果 → 自豪',
    intensity: 'medium'
  },
  {
    pattern: { agency: 'other', valence: 'positive', goalCongruence: 'congruent' },
    emotion: '感激',
    explanation: '他人导致的正面结果 → 感激',
    intensity: 'medium'
  },
  {
    pattern: { goalRelevance: 'irrelevant' },
    emotion: '漠然',
    explanation: '与目标无关 → 漠然/平静',
    intensity: 'low'
  },
  {
    pattern: { valence: 'negative', goalCongruence: 'incongruent' },
    emotion: '悲伤',
    explanation: '负面事件，目标损失 → 悲伤/失落',
    intensity: 'medium'
  },
  {
    pattern: { valence: 'positive', goalCongruence: 'congruent' },
    emotion: '快乐',
    explanation: '正面事件，目标达成 → 快乐/愉悦',
    intensity: 'medium'
  }
];

/**
 * 评价重构策略
 * 帮助用户重新评价情境，从而改变情绪体验
 */
const reframingStrategies = {
  /**
   * 能动性重构
   * 从"他人/环境导致"转向"我能做什么"
   */
  agencyReframe: {
    name: '能动性重构',
    description: '从被动受害者转向主动行动者',
    prompts: [
      '在这件事中，你能控制的部分是什么？',
      '除了责怪，你还能做什么来改善情况？',
      '对方的行为是否有其他可能的解释？',
      '如果你是旁观者，会如何看待这个情况？'
    ],
    examples: [
      { from: '都是他的错', to: '在这件事中，我能控制的部分是什么？' },
      { from: '他故意针对我', to: '是否有其他可能的解释？' },
      { from: '我没办法', to: '我能做的一小步是什么？' }
    ]
  },

  /**
   * 控制性重构
   * 从"完全失控"转向"部分可控"
   */
  controlReframe: {
    name: '控制性重构',
    description: '区分可控与不可控，专注前者',
    prompts: [
      '这件事中，哪些是你完全无法控制的？',
      '哪些是你部分或完全可控的？',
      '把注意力从不可控转移到可控，会怎样？',
      '即使结果不可控，你能控制自己的什么？'
    ],
    examples: [
      { from: '我完全控制不了', to: '虽然我不能控制 X，但我可以控制 Y' },
      { from: '结果太重要了', to: '我能控制的是准备过程，不是结果' },
      { from: '一切都失控了', to: '此刻我能控制的一个小行动是什么？' }
    ]
  },

  /**
   * 目标一致性重构
   * 从"彻底失败"转向"学习机会"
   */
  goalReframe: {
    name: '目标一致性重构',
    description: '重新定义成功与失败',
    prompts: [
      '这个阻碍是否也可能是一个机会？',
      '从长远看，这件事的意义可能是什么？',
      '你从中学到了什么？',
      '是否有其他方式定义"成功"？'
    ],
    examples: [
      { from: '这毁了我的一切', to: '这是一个挫折，也是一个学习机会' },
      { from: '我彻底失败了', to: '这次没成功，但我学到了...' },
      { from: '计划全乱了', to: '是否有新的可能性出现了？' }
    ]
  },

  /**
   * 规范性重构
   * 从"我不应该"转向"我学到了"
   */
  normReframe: {
    name: '规范性重构',
    description: '从自我批评转向自我接纳',
    prompts: [
      '你的标准是否过于严苛？',
      '如果是朋友犯了同样的错，你会怎么对他？',
      '错误是否可以成为成长的一部分？',
      '你是否在用"应该"压迫自己？'
    ],
    examples: [
      { from: '我不应该犯这种错', to: '错误是学习的一部分' },
      { from: '我太不应该了', to: '我当时已经尽力了' },
      { from: '我很丢脸', to: '每个人都有犯错的时候' }
    ]
  },

  /**
   * 新奇性重构
   * 从"意外威胁"转向"新奇挑战"
   */
  noveltyReframe: {
    name: '新奇性重构',
    description: '将意外重新定义为探索机会',
    prompts: [
      '这个意外是否也带来了新的可能性？',
      '如果是你主动选择的，感受会有什么不同？',
      '这个新情境中，有什么值得探索的？',
      '意外是否让你看到了平时看不到的东西？'
    ],
    examples: [
      { from: '太突然了，我受不了', to: '这是一个新的体验，让我看看它能教我什么' },
      { from: '我完全没准备', to: '没有预设，反而可以看到真实的样子' }
    ]
  }
};

/**
 * 检测文本中的评价维度
 */
function detectAppraisals(text) {
  const lowerText = text.toLowerCase();
  const detections = {};

  // 遍历所有评价维度
  for (const [dimension, categories] of Object.entries(appraisalDimensions)) {
    let detectedCategory = null;
    let maxScore = 0;

    // 检查每个类别
    for (const [category, data] of Object.entries(categories)) {
      let score = 0;
      for (const keyword of data.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += data.weight;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        detectedCategory = category;
      }
    }

    // 只有分数足够高才记录
    if (maxScore > 0) {
      detections[dimension] = {
        category: detectedCategory,
        score: maxScore,
        confidence: Math.min(1.0, maxScore / 3) // 归一化到 0-1
      };
    }
  }

  return detections;
}

/**
 * 基于评价检测结果推断情绪
 */
function inferEmotionFromAppraisals(appraisals) {
  if (Object.keys(appraisals).length === 0) {
    return {
      emotion: '平静',
      confidence: 0.5,
      explanation: '未检测到明显的评价模式',
      appraisals: {}
    };
  }

  // 匹配评价模式
  let bestMatch = null;
  let bestScore = 0;

  for (const pattern of appraisalToEmotion) {
    let score = 0;
    let matchedDimensions = 0;

    for (const [dimension, category] of Object.entries(pattern.pattern)) {
      if (appraisals[dimension] && appraisals[dimension].category === category) {
        score += appraisals[dimension].confidence;
        matchedDimensions++;
      }
    }

    // 至少匹配一个维度，且分数最高
    if (matchedDimensions > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = {
        emotion: pattern.emotion,
        confidence: Math.min(1.0, score / Object.keys(pattern.pattern).length),
        explanation: pattern.explanation,
        intensity: pattern.intensity,
        appraisals: appraisals
      };
    }
  }

  // 如果没有匹配到任何模式，基于效价给出默认情绪
  if (!bestMatch) {
    if (appraisals.valence) {
      bestMatch = {
        emotion: appraisals.valence.category === 'positive' ? '愉悦' : '不悦',
        confidence: appraisals.valence.confidence * 0.5,
        explanation: '基于效价评价的默认情绪推断',
        intensity: 'low',
        appraisals: appraisals
      };
    } else {
      bestMatch = {
        emotion: '平静',
        confidence: 0.3,
        explanation: '未检测到明显的评价模式',
        intensity: 'low',
        appraisals: appraisals
      };
    }
  }

  return bestMatch;
}

/**
 * 生成评价重构建议
 */
function generateReframingSuggestions(appraisals, emotion) {
  const suggestions = [];

  // 根据检测到的评价维度生成重构建议
  if (appraisals.agency) {
    if (appraisals.agency.category === 'other' || appraisals.agency.category === 'circumstance') {
      suggestions.push({
        type: 'agencyReframe',
        strategy: reframingStrategies.agencyReframe,
        prompt: reframingStrategies.agencyReframe.prompts[0]
      });
    }
  }

  if (appraisals.control && appraisals.control.category === 'low') {
    suggestions.push({
      type: 'controlReframe',
      strategy: reframingStrategies.controlReframe,
      prompt: reframingStrategies.controlReframe.prompts[1]
    });
  }

  if (appraisals.goalCongruence && appraisals.goalCongruence.category === 'incongruent') {
    suggestions.push({
      type: 'goalReframe',
      strategy: reframingStrategies.goalReframe,
      prompt: reframingStrategies.goalReframe.prompts[0]
    });
  }

  if (appraisals.norms && appraisals.norms.category === 'incongruent') {
    suggestions.push({
      type: 'normReframe',
      strategy: reframingStrategies.normReframe,
      prompt: reframingStrategies.normReframe.prompts[1]
    });
  }

  if (appraisals.novelty && appraisals.novelty.category === 'unexpected') {
    suggestions.push({
      type: 'noveltyReframe',
      strategy: reframingStrategies.noveltyReframe,
      prompt: reframingStrategies.noveltyReframe.prompts[0]
    });
  }

  return suggestions;
}

module.exports = {
  appraisalDimensions,
  appraisalToEmotion,
  reframingStrategies,
  detectAppraisals,
  inferEmotionFromAppraisals,
  generateReframingSuggestions
};
