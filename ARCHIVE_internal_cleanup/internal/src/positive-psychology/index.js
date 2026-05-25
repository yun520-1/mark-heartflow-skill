/**
 * 积极心理学模块 (Positive Psychology Module)
 * 
 * 基于 Martin Seligman 的 PERMA 模型和 Mihaly Csikszentmihalyi 的心流理论
 * 
 * 理论来源:
 * - Seligman, M. E. P. (2011). Flourish: A Visionary New Understanding of Happiness and Well-being
 * - Csikszentmihalyi, M. (1990). Flow: The Psychology of Optimal Experience
 * - Stanford Encyclopedia of Philosophy: Well-Being
 */

const PERMA_MODEL = {
  P: {
    name: '积极情绪 (Positive Emotion)',
    description: '体验愉悦、快乐、温暖等积极感受',
    techniques: [
      '三件好事练习 - 每天记录三件顺利的事',
      '感恩拜访 - 向帮助过的人表达感谢',
      '品味练习 - 专注体验当下的美好时刻'
    ],
    assessment: [
      '过去一周你有多少次感到快乐？',
      '你能够轻松识别自己的情绪吗？',
      '你经常体验积极情绪吗？'
    ]
  },
  E: {
    name: '投入 (Engagement)',
    description: '完全沉浸于活动中，进入心流状态',
    techniques: [
      '识别心流活动 - 找到让你忘记时间的活动',
      '技能 - 挑战平衡 - 调整任务难度匹配能力',
      '消除干扰 - 创造专注环境'
    ],
    assessment: [
      '你有多少次完全沉浸在某项活动中？',
      '你有明确的心流活动吗？',
      '你在工作中能体验到投入感吗？'
    ]
  },
  R: {
    name: '人际关系 (Relationships)',
    description: '建立积极、支持性的人际连接',
    techniques: [
      '主动建设性回应 - 热情回应他人的好消息',
      '善意行为 - 每周做三件好事',
      '深度倾听 - 专注理解他人而非回应'
    ],
    assessment: [
      '你有可以倾诉的朋友吗？',
      '你感到被他人理解和支持吗？',
      '你主动维护重要关系吗？'
    ]
  },
  M: {
    name: '意义 (Meaning)',
    description: '归属于超越自我的更大目标',
    techniques: [
      '价值观澄清 - 识别最重要的价值',
      '优势服务 - 用核心优势服务他人',
      '遗产练习 - 思考想留下的影响'
    ],
    assessment: [
      '你的生活有明确的目标感吗？',
      '你感到自己的工作有意义吗？',
      '你归属于某个更大的群体吗？'
    ]
  },
  A: {
    name: '成就 (Accomplishment)',
    description: '追求并实现目标，体验胜任感',
    techniques: [
      'SMART 目标 - 设定具体可衡量的目标',
      '进步追踪 - 记录小胜利',
      '优势运用 - 发挥核心优势达成目标'
    ],
    assessment: [
      '你有正在追求的目标吗？',
      '你经常体验成就感吗？',
      '你能坚持完成困难任务吗？'
    ]
  }
};

// 心流状态特征
FLOW_CHARACTERISTICS = {
  '完全专注': '注意力高度集中于当前活动',
  '行动与意识融合': '不再意识到自己正在行动',
  '自我意识消失': '忘记自己的身份和烦恼',
  '时间感扭曲': '时间过得飞快或变慢',
  '直接反馈': '清楚知道自己做得如何',
  '挑战 - 技能平衡': '任务难度与能力匹配',
  '掌控感': '感到能够应对挑战',
  '活动本身即目的': '活动本身就是奖励'
};

// 24 种品格优势 (VIA 分类)
CHARACTER_STRENGTHS = {
  '智慧与知识': [
    { name: '创造力', desc: '产生新颖且有价值的想法' },
    { name: '好奇心', desc: '对世界保持开放和探索' },
    { name: '判断力', desc: '全面思考后再做决定' },
    { name: '热爱学习', desc: '持续学习新知识和技能' },
    { name: '洞察力', desc: '提供明智的建议和指导' }
  ],
  '勇气': [
    { name: '勇敢', desc: '面对威胁和困难不退缩' },
    { name: '毅力', desc: '坚持完成既定目标' },
    { name: '真诚', desc: '真实地表达自己和感受' },
    { name: '热情', desc: '充满活力和热情地生活' }
  ],
  '仁爱': [
    { name: '爱', desc: '珍视与他人的亲密关系' },
    { name: '善良', desc: '帮助和关心他人' },
    { name: '社交智慧', desc: '理解自己和他人的动机' }
  ],
  '正义': [
    { name: '团队合作', desc: '为集体目标贡献力量' },
    { name: '公平', desc: '公正对待每个人' },
    { name: '领导力', desc: '组织并带领团队完成任务' }
  ],
  '节制': [
    { name: '宽容', desc: '原谅犯错的人' },
    { name: '谦虚', desc: '不夸大自己的成就' },
    { name: '审慎', desc: '谨慎做决定，不冒不必要风险' },
    { name: '自我调节', desc: '管理自己的情绪和行为' }
  ],
  '超越': [
    { name: '审美', desc: '欣赏美和卓越' },
    { name: '感恩', desc: '注意并感谢生活中的美好' },
    { name: '希望', desc: '对未来保持乐观和期待' },
    { name: '幽默', desc: '带给他人欢笑和乐趣' },
    { name: '灵性', desc: '与宇宙和更高意义连接' }
  ]
};

class PositivePsychologyModule {
  constructor() {
    this.name = '积极心理学模块';
    this.version = '1.0.0';
  }

  /**
   * PERMA 幸福感评估
   */
  assessPERMA() {
    return {
      model: 'PERMA',
      dimensions: Object.entries(PERMA_MODEL).map(([key, value]) => ({
        code: key,
        name: value.name,
        description: value.description,
        techniques: value.techniques,
        assessment: value.assessment
      })),
      instructions: '每个维度 1-10 分评分，识别最强的 2 个维度和最需要提升的 2 个维度'
    };
  }

  /**
   * 心流活动推荐
   */
  recommendFlowActivities(userInterests = []) {
    const flowConditions = {
      '明确目标': '设定清晰、具体的活动目标',
      '即时反馈': '选择能提供即时反馈的活动',
      '挑战匹配': '调整难度略高于当前技能水平 (10-20%)',
      '专注环境': '消除外部干扰，创造专注空间',
      '内在动机': '选择你真正感兴趣的活动'
    };

    const commonFlowActivities = {
      '创造性': ['绘画', '写作', '音乐创作', '编程', '设计'],
      '运动': ['攀岩', '游泳', '跑步', '瑜伽', '舞蹈'],
      '智力': ['阅读', '下棋', '解谜', '学习新语言', '研究'],
      '社交': ['深度对话', '教学', '团队合作', '表演'],
      '手工': ['园艺', '烹饪', '木工', '陶艺', '编织']
    };

    return {
      flowConditions,
      recommendedActivities: commonFlowActivities,
      tips: [
        '从你感兴趣的活动开始',
        '设定明确的目标和规则',
        '确保挑战略高于你的技能',
        '消除手机等干扰源',
        '记录心流体验的时间和感受'
      ]
    };
  }

  /**
   * 品格优势识别
   */
  identifyTopStrengths() {
    return {
      allStrengths: CHARACTER_STRENGTHS,
      identificationMethods: [
        {
          name: '自我反思',
          questions: [
            '做什么事情让你感到充满活力？',
            '别人经常称赞你什么品质？',
            '你最容易坚持做的事情是什么？',
            '什么情况下你感到最自信？'
          ]
        },
        {
          name: '他人反馈',
          method: '询问 5 个熟悉你的人，他们眼中的你的 3 个最大优势'
        },
        {
          name: '使用记录',
          method: '记录一周内每次感到充实和有成就感的时刻，分析背后的优势'
        }
      ],
      applicationTips: [
        '每天刻意运用一个核心优势',
        '用优势解决当前面临的挑战',
        '将优势与工作目标对齐',
        '帮助他人发现和运用他们的优势'
      ]
    };
  }

  /**
   * 生成积极干预建议
   */
  generateIntervention(userState = {}) {
    const interventions = {
      '情绪低落': {
        technique: '三件好事',
        instruction: '每晚睡前记录今天发生的三件好事，以及它们发生的原因',
        duration: '连续 7 天，每天 10 分钟',
        evidence: 'Seligman et al. (2005) - 显著提升幸福感，效果持续 6 个月'
      },
      '缺乏动力': {
        technique: '优势运用',
        instruction: '选择一个核心优势，用新的方式运用它一周',
        duration: '每天运用，持续 7 天',
        evidence: 'Seligman et al. (2005) - 提升幸福感，减少抑郁'
      },
      '人际关系困扰': {
        technique: '感恩拜访',
        instruction: '写一封感谢信给帮助过你的人，并亲自送达',
        duration: '一次性练习，约 1 小时',
        evidence: 'Seligman et al. (2005) - 即时提升幸福感'
      },
      '感到迷茫': {
        technique: '最佳自我愿景',
        instruction: '想象 5 年后的理想自己，详细描述那个场景',
        duration: '每周一次，每次 15 分钟',
        evidence: 'King (2001) - 提升积极情绪和生活意义感'
      },
      '压力过大': {
        technique: '品味练习',
        instruction: '选择一个日常活动 (如喝茶),专注体验每个细节',
        duration: '每天一次，每次 5-10 分钟',
        evidence: 'Bryant & Veroff (2007) - 增强积极情绪体验'
      }
    };

    return {
      availableInterventions: interventions,
      selectionGuide: '根据当前状态选择最匹配的干预技术',
      generalTips: [
        '选择一项练习，持续至少一周',
        '记录练习前后的情绪变化',
        '找到适合自己的练习时间和方式',
        '结合多项练习效果更佳'
      ]
    };
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: '基于 PERMA 模型和心流理论的积极心理学干预模块',
      features: [
        'PERMA 幸福感评估',
        '心流活动推荐',
        '品格优势识别',
        '积极干预建议'
      ],
      commands: ['/positive - 查看积极心理学介绍和练习']
    };
  }
}

// 导出模块
module.exports = {
  PositivePsychologyModule,
  PERMA_MODEL,
  FLOW_CHARACTERISTICS,
  CHARACTER_STRENGTHS
};
