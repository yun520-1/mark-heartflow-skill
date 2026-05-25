/**
 * 人本主义心理学模块 (v2.5.0 新增)
 * 基于马斯洛需求层次理论和罗杰斯无条件积极关注
 * 
 * 核心理念:
 * - 人有自我实现的倾向
 * - 无条件积极关注促进成长
 * - 关注人的潜能和积极面
 * 
 * 来源：人本主义心理学经典理论
 */

const MaslowHierarchy = {
  LEVEL_1_PHYSIOLOGICAL: 'physiological',     // 生理需求
  LEVEL_2_SAFETY: 'safety',                   // 安全需求
  LEVEL_3_LOVE_BELONGING: 'love_belonging',   // 归属与爱
  LEVEL_4_ESTEEEM: 'esteem',                  // 尊重需求
  LEVEL_5_SELF_ACTUALIZATION: 'self_actualization' // 自我实现
};

// 各层次需求关键词
const NeedKeywords = {
  [MaslowHierarchy.LEVEL_1_PHYSIOLOGICAL]: [
    '累', '困', '饿', '饿', '身体', '休息', '睡觉', '吃', '喝', '健康'
  ],
  [MaslowHierarchy.LEVEL_2_SAFETY]: [
    '安全', '稳定', '担心', '害怕', '风险', '保障', '工作', '收入', '房子'
  ],
  [MaslowHierarchy.LEVEL_3_LOVE_BELONGING]: [
    '孤独', '朋友', '家人', '关系', '爱', '被爱', '归属', '团队', '陪伴'
  ],
  [MaslowHierarchy.LEVEL_4_ESTEEEM]: [
    '认可', '尊重', '成就', '价值', '自信', '能力', '成功', '失败', '面子'
  ],
  [MaslowHierarchy.LEVEL_5_SELF_ACTUALIZATION]: [
    '成长', '潜能', '梦想', '意义', '目标', '成为', '实现', '使命', '天赋'
  ]
};

class HumanisticPsychologyModule {
  constructor() {
    this.unconditionalPositiveRegard = true;
  }

  /**
   * 分析用户需求层次
   * @param {string} userInput - 用户输入
   * @returns {Object} 需求分析结果
   */
  analyzeNeeds(userInput) {
    const result = {
      detectedLevels: [],
      primaryNeed: null,
      growthOrientation: null,
      response: null
    };

    // 检测各层次需求
    for (const [level, keywords] of Object.entries(NeedKeywords)) {
      const matchCount = keywords.filter(kw => userInput.includes(kw)).length;
      if (matchCount > 0) {
        result.detectedLevels.push({
          level: level,
          matchCount: matchCount,
          keywords: keywords.filter(kw => userInput.includes(kw))
        });
      }
    }

    // 确定主要需求（按层次从低到高）
    if (result.detectedLevels.length > 0) {
      result.detectedLevels.sort((a, b) => {
        const levelOrder = Object.values(MaslowHierarchy);
        return levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level);
      });
      result.primaryNeed = result.detectedLevels[0];
    }

    // 评估成长导向
    result.growthOrientation = this._assessGrowthOrientation(userInput);

    // 生成回应
    result.response = this._generateResponse(result);

    return result;
  }

  /**
   * 评估成长导向
   */
  _assessGrowthOrientation(text) {
    const growthIndicators = [
      '想成为', '想要成长', '想改变', '希望更好', '学习', '进步',
      '探索', '发现', '创造', '实现', '追求', '意义'
    ];

    const count = growthIndicators.filter(ind => text.includes(ind)).length;

    if (count >= 3) {
      return {
        level: 'high',
        description: '强烈的自我实现倾向'
      };
    } else if (count >= 1) {
      return {
        level: 'medium',
        description: '有成长意愿'
      };
    } else {
      return {
        level: 'low',
        description: '当前关注基本需求'
      };
    }
  }

  /**
   * 生成人本主义回应
   */
  _generateResponse(analysis) {
    const responses = [];

    // 无条件积极关注
    responses.push({
      type: 'unconditional_positive_regard',
      text: this._getUnconditionalPositiveRegard(analysis),
      source: '卡尔·罗杰斯'
    });

    // 需求层次支持
    if (analysis.primaryNeed) {
      responses.push({
        type: 'need_support',
        text: this._getNeedSupport(analysis.primaryNeed.level),
        level: analysis.primaryNeed.level
      });
    }

    // 成长导向鼓励
    if (analysis.growthOrientation.level === 'high') {
      responses.push({
        type: 'growth_encouragement',
        text: this._getGrowthEncouragement(),
        source: '亚伯拉罕·马斯洛'
      });
    }

    return responses;
  }

  /**
   * 获取无条件积极关注回应
   */
  _getUnconditionalPositiveRegard(analysis) {
    const templates = [
      '我感受到你正在经历一些不容易的事情。无论你现在感觉如何，你的感受都是有效的，值得被倾听和理解。',
      '谢谢你愿意分享这些。在这里，你可以做真实的自己，不需要评判或伪装。',
      '我听到你了。你的体验是独特的，也是重要的。',
      '无论你在人生的哪个阶段，无论你有什么样的感受，你都值得被接纳和理解。'
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * 获取需求层次支持
   */
  _getNeedSupport(level) {
    const support = {
      [MaslowHierarchy.LEVEL_1_PHYSIOLOGICAL]: {
        text: '听起来你的身体在发出信号。照顾好基本的生理需求是重要的第一步——休息、饮食、运动。只有身体得到照顾，我们才有余力关注其他方面。',
        suggestions: [
          '保证充足的睡眠',
          '规律饮食',
          '适度运动',
          '给自己休息的时间'
        ]
      },
      [MaslowHierarchy.LEVEL_2_SAFETY]: {
        text: '你似乎在关注安全和稳定的问题。这是很自然的需求。在变化和不确定的环境中，寻求安全感是人之常情。',
        suggestions: [
          '识别什么是可控的',
          '建立日常规律',
          '培养应对技能',
          '寻求社会支持'
        ]
      },
      [MaslowHierarchy.LEVEL_3_LOVE_BELONGING]: {
        text: '你表达了对连接和归属的渴望。人是社会性动物，我们需要被看见、被理解、被爱。这种渴望是健康的，也是普遍的。',
        suggestions: [
          '主动联系关心的人',
          '参与社群活动',
          '练习真诚表达',
          '培养深度关系'
        ]
      },
      [MaslowHierarchy.LEVEL_4_ESTEEEM]: {
        text: '你在思考关于认可和价值的问题。被尊重、被认可是重要的需求，但真正的自信也来自内在的自我接纳。',
        suggestions: [
          '记录小成就',
          '练习自我肯定',
          '设定可实现目标',
          '区分外在评价与内在价值'
        ]
      },
      [MaslowHierarchy.LEVEL_5_SELF_ACTUALIZATION]: {
        text: '你在探索关于成长和自我实现的问题。这是人类最高层次的需求——成为你能成为的人，发挥你的潜能。',
        suggestions: [
          '探索你的热情所在',
          '设定有意义的目标',
          '投入创造性活动',
          '活出你的价值观'
        ]
      }
    };

    return support[level] || {
      text: '我理解你的感受。让我们一起探索什么对你最重要。',
      suggestions: []
    };
  }

  /**
   * 获取成长鼓励
   */
  _getGrowthEncouragement() {
    const quotes = [
      {
        text: '一个人能够成为什么，他就必须成为什么。',
        author: '亚伯拉罕·马斯洛',
        source: '《动机与人格》'
      },
      {
        text: '自我实现不是终点，而是一个过程。它是充分、无私地体验生活中的每一刻。',
        author: '亚伯拉罕·马斯洛'
      },
      {
        text: '好的人生是一个过程，而不是一种状态；它是一个方向，而不是一个目的地。',
        author: '卡尔·罗杰斯'
      }
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  /**
   * 获取马斯洛需求层次说明
   */
  getMaslowHierarchyInfo() {
    return {
      title: '马斯洛需求层次理论',
      levels: [
        {
          level: 5,
          name: '自我实现',
          description: '发挥潜能，成为自己能成为的人',
          examples: ['追求梦想', '创造性表达', '个人成长', '寻找意义']
        },
        {
          level: 4,
          name: '尊重需求',
          description: '被认可、被尊重、自信',
          examples: ['成就', '地位', '自信', '能力感']
        },
        {
          level: 3,
          name: '归属与爱',
          description: '友谊、亲密关系、归属感',
          examples: ['家庭', '朋友', '团队', '社群']
        },
        {
          level: 2,
          name: '安全需求',
          description: '安全、稳定、保障',
          examples: ['工作保障', '健康', '财产', '秩序']
        },
        {
          level: 1,
          name: '生理需求',
          description: '生存所需的基本条件',
          examples: ['食物', '水', '睡眠', '住所']
        }
      ],
      coreIdea: '低层次需求满足后，人会追求更高层次的需求'
    };
  }

  /**
   * 获取罗杰斯无条件积极关说明
   */
  getUnconditionalPositiveRegardInfo() {
    return {
      title: '无条件积极关注',
      description: '卡尔·罗杰斯提出的心理治疗核心条件',
      principles: [
        '接纳对方如其所是，不评判',
        '相信人有自我实现的倾向',
        '创造安全的心理空间',
        '真诚地关注对方的体验'
      ],
      impact: '当人感受到无条件的接纳时，更容易开放自己，探索内在，实现成长'
    };
  }
}

module.exports = {
  MaslowHierarchy,
  NeedKeywords,
  HumanisticPsychologyModule
};
