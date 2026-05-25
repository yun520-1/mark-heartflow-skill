/**
 * 存在主义心理学模块 (Existential Psychology Module)
 * 
 * 基于 Viktor Frankl 的意义治疗、Rollo May 和 Irvin Yalom 的存在主义心理治疗
 * 
 * 理论来源:
 * - Frankl, V. E. (1946). Man's Search for Meaning
 * - Yalom, I. D. (1980). Existential Psychotherapy
 * - May, R. (1950). The Meaning of Anxiety
 * - Stanford Encyclopedia of Philosophy: Existentialism
 */

// 四大终极关怀 (Yalom)
ULTIMATE_CONCERNS = {
  '死亡': {
    description: '对死亡和有限性的觉察',
    anxiety: '存在性焦虑：生命终将结束的恐惧',
    defenses: [
      '否认：避免思考死亡',
      '追求不朽：通过成就、后代、信仰寻求永恒',
      '完美主义：试图控制一切以避免意外'
    ],
    growth: [
      '死亡意识可以唤醒对生命的珍视',
      '有限性赋予选择以意义',
      '接纳死亡可以更充分地生活'
    ],
    interventions: [
      '想象生命只剩一年，你会如何生活？',
      '墓志铭练习：你想被如何记住',
      '死亡冥想：正视死亡以减少恐惧'
    ]
  },
  '自由': {
    description: '没有外在结构来决定我们的选择',
    anxiety: '责任焦虑：我们必须为自己的选择负责',
    defenses: [
      '逃避自由：服从权威、从众、依赖他人',
      '决定论信念：相信一切都是注定的',
      '强迫行为：用仪式和规则减少不确定性'
    ],
    growth: [
      '自由意味着我们是自己生活的作者',
      '每个选择都在塑造我们成为谁',
      '接纳责任是成熟和力量的标志'
    ],
    interventions: [
      '识别你在逃避哪些选择',
      '探索"不得不"背后的"选择"',
      '练习小决定，增强选择肌肉'
    ]
  },
  '孤独': {
    description: '我们终究是独自的个体',
    types: [
      '人际孤独：独自一人，没有陪伴',
      '心理孤独：否认自己的感受以避免被拒绝',
      '存在孤独：与他人之间无法跨越的鸿沟'
    ],
    defenses: [
      '融合：失去自我以融入他人',
      '关系依赖：需要他人才能完整',
      '回避亲密：避免深度连接以防受伤'
    ],
    growth: [
      '接纳存在孤独是真实连接的前提',
      '完整的自我才能建立健康的关系',
      '孤独也可以是创造和反思的空间'
    ],
    interventions: [
      '探索你与孤独的关系',
      '练习独处而不感到孤单',
      '培养真实的自我表达'
    ]
  },
  '无意义': {
    description: '生命没有预设的意义',
    anxiety: '意义危机：为什么要活着？',
    defenses: [
      '盲目信仰：不加批判地接受现成答案',
      '享乐主义：追求即时满足避免思考',
      '虚无主义：宣称一切都没有意义'
    ],
    growth: [
      '意义不是发现的，而是创造的',
      '我们可以通过态度、工作、爱创造意义',
      '即使在苦难中也能找到意义'
    ],
    interventions: [
      '意义日志：记录有意义的时刻',
      '价值观澄清：什么对你真正重要',
      '服务他人：通过贡献找到意义'
    ]
  }
};

// 意义治疗的三大价值 (Frankl)
MEANING_VALUES = {
  '创造性价值': {
    description: '通过创造和工作给予世界什么',
    examples: [
      '艺术创作：绘画、写作、音乐',
      '工作贡献：专业成就、帮助他人',
      '养育子女：培养下一代',
      '志愿服务：为社区做贡献'
    ],
    questions: [
      '你想给世界留下什么？',
      '你的独特才能是什么？',
      '什么工作让你感到有意义？'
    ]
  },
  '体验性价值': {
    description: '通过体验和感受从世界获得什么',
    examples: [
      '爱与关系：深度的人际连接',
      '美的体验：艺术、自然、音乐',
      '学习与成长：获取新知识',
      '愉悦体验：美食、旅行、运动'
    ],
    questions: [
      '什么体验让你感到充实？',
      '你与谁有深度的连接？',
      '你最近一次被美打动是什么时候？'
    ]
  },
  '态度性价值': {
    description: '面对无法改变的命运时的态度',
    examples: [
      '面对疾病的勇气',
      '面对损失的尊严',
      '面对不公的坚持',
      '面对苦难的超越'
    ],
    questions: [
      '你正在面对什么无法改变的现实？',
      '你选择以什么态度面对它？',
      '这个挑战能教会你什么？'
    ],
    note: 'Frankl: "人可以被剥夺任何东西，除了最后一种自由——在任何给定环境下选择自己态度的自由"'
  }
};

// 本真生活的特征 (Heidegger, Sartre)
AUTHENTIC_LIVING = {
  '自我觉察': '清楚自己的价值观、动机、模式',
  '自主选择': '基于自己的价值观做决定，而非他人期望',
  '承担责任': '为自己的选择和行为负责',
  '接纳有限': '接纳自己的局限和生命的有限性',
  '活在当下': '充分体验此时此地，而非活在过去或未来',
  '真实表达': '诚实地表达自己的感受和想法',
  '深度连接': '与他人建立真实、深度的关系'
};

// 存在主义干预技术
EXISTENTIAL_INTERVENTIONS = {
  '墓志铭练习': {
    purpose: '澄清你想留下的人生印记',
    instructions: [
      '想象你已经过完一生，正在写自己的墓志铭',
      '你希望别人如何记住你？',
      '你希望被记住的品质、成就、贡献是什么？',
      '写下 3-5 句墓志铭',
      '反思：现在的生活与这个愿景一致吗？'
    ],
    duration: '20-30 分钟',
    followUp: '基于墓志铭，设定一个本周可以做的行动'
  },
  '80 岁生日宴会': {
    purpose: '从终点看现在，澄清价值观',
    instructions: [
      '想象你 80 岁生日，重要的人都在场',
      '你希望他们如何评价你的一生？',
      '你希望他们说什么关于你的话？',
      '写下你希望听到的 3 个祝酒词',
      '反思：现在的生活在创造这些评价吗？'
    ],
    duration: '20-30 分钟',
    followUp: '识别一个需要调整的生活领域'
  },
  '理想一天': {
    purpose: '描绘有意义生活的具体画面',
    instructions: [
      '想象 5 年后理想的一天，从早到晚',
      '你在哪里醒来？和谁在一起？',
      '你做什么工作？如何度过时间？',
      '什么让你感到充实和有意义？',
      '详细描述这一天的每个细节'
    ],
    duration: '15-20 分钟',
    followUp: '识别理想与现实的差距，设定小目标'
  },
  '意义日志': {
    purpose: '培养对意义的觉察',
    instructions: [
      '每天记录 3 个有意义的时刻',
      '描述发生了什么，为什么有意义',
      '注意什么活动、人、情境带来意义感',
      '每周回顾，寻找模式'
    ],
    duration: '每天 5 分钟',
    followUp: '基于模式调整生活优先级'
  },
  '态度选择': {
    purpose: '练习在困境中选择态度',
    instructions: [
      '识别一个你正在面对的困难情境',
      '列出你对这个情境的所有反应方式',
      '问：在这些反应中，我选择成为谁？',
      '选择一个与价值观一致的态度',
      '承诺以这个态度面对情境'
    ],
    duration: '10-15 分钟',
    followUp: '记录选择后的体验和感受'
  },
  '生命轮': {
    purpose: '评估生活各领域的平衡',
    domains: ['健康', '家庭', '友谊', '工作', '财务', '成长', '休闲', '贡献'],
    instructions: [
      '画一个圆，分成 8 个扇区',
      '每个扇区代表一个生活领域',
      '1-10 分评分每个领域的满意度',
      '连接各点，看到生命轮的形状',
      '选择 1-2 个领域设定改进目标'
    ],
    duration: '15-20 分钟',
    followUp: '为选定的领域设定具体行动'
  }
};

// 存在主义反思问题
REFLECTION_QUESTIONS = {
  '关于死亡': [
    '如果生命只剩一年，你会如何生活？',
    '你害怕死亡吗？这种害怕在告诉你什么？',
    '你想如何被记住？',
    '死亡意识如何影响你此刻的选择？'
  ],
  '关于自由': [
    '你在哪些事情上感到"不得不"做？',
    '这些"不得不"背后有哪些选择？',
    '你在逃避哪些选择的责任？',
    '如果完全自由，你会做什么不同的事？'
  ],
  '关于孤独': [
    '你如何体验孤独？',
    '你害怕独处吗？为什么？',
    '什么关系让你感到被理解？',
    '你如何平衡连接和独立？'
  ],
  '关于意义': [
    '什么让你的生活感到有意义？',
    '你正在为什么比自我更大的事物服务？',
    '什么活动让你忘记时间？',
    '如果一切都没有预设意义，你选择创造什么意义？'
  ]
};

class ExistentialModule {
  constructor() {
    this.name = '存在主义心理学模块';
    this.version = '1.0.0';
  }

  /**
   * 终极关怀评估
   */
  assessUltimateConcerns() {
    return {
      model: 'Yalom 四大终极关怀',
      concerns: Object.entries(ULTIMATE_CONCERNS).map(([key, value]) => ({
        name: key,
        description: value.description,
        anxiety: value.anxiety,
        growth: value.growth,
        interventions: value.interventions
      })),
      assessment: [
        '哪个关怀此刻对你最突出？',
        '你通常如何应对这些焦虑？',
        '哪个关怀的成长方向最吸引你？'
      ],
      note: '这些关怀不是问题，而是人类境况的一部分。觉察它们可以带来成长。'
    };
  }

  /**
   * 意义来源评估
   */
  assessMeaningSources() {
    return {
      model: 'Frankl 意义治疗三大价值',
      values: Object.entries(MEANING_VALUES).map(([key, value]) => ({
        name: key,
        description: value.description,
        examples: value.examples,
        questions: value.questions
      })),
      assessment: [
        '哪个价值领域你最常体验？',
        '哪个价值领域你最需要加强？',
        '最近一次感到有意义是什么时候？'
      ],
      integration: '三个价值领域平衡发展，生命更充实'
    };
  }

  /**
   * 推荐存在主义干预
   */
  recommendIntervention(userState = {}) {
    let recommendation;
    
    if (userState.concern === 'death' || userState.mortality === 'high') {
      recommendation = EXISTENTIAL_INTERVENTIONS['墓志铭练习'];
    } else if (userState.concern === 'freedom' || userState.stuck === 'high') {
      recommendation = EXISTENTIAL_INTERVENTIONS['态度选择'];
    } else if (userState.concern === 'loneliness' || userState.isolated === 'high') {
      recommendation = EXISTENTIAL_INTERVENTIONS['80 岁生日宴会'];
    } else if (userState.concern === 'meaninglessness' || userState.empty === 'high') {
      recommendation = EXISTENTIAL_INTERVENTIONS['意义日志'];
    } else if (userState.balanced === 'low') {
      recommendation = EXISTENTIAL_INTERVENTIONS['生命轮'];
    } else {
      recommendation = EXISTENTIAL_INTERVENTIONS['理想一天'];
    }

    return {
      recommended: recommendation,
      allInterventions: EXISTENTIAL_INTERVENTIONS,
      reflectionQuestions: REFLECTION_QUESTIONS,
      tips: [
        '选择一个练习，给自己充足的时间',
        '不追求"正确"答案，真诚面对自己',
        '可以重复做同一个练习，每次可能有新发现',
        '考虑与信任的人分享你的反思'
      ]
    };
  }

  /**
   * 本真生活评估
   */
  assessAuthenticity() {
    return {
      model: '本真生活特征',
      characteristics: Object.entries(AUTHENTIC_LIVING).map(([key, value]) => ({
        name: key,
        description: value,
        selfAssessment: `在 1-10 分上，你在"${key}"上得几分？`
      })),
      strongest: '识别得分最高的 2-3 个特征',
      growth: '识别得分最低的 2-3 个特征，设定成长目标',
      note: '本真是一个过程，不是终点。持续觉察和选择。'
    };
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: '基于存在主义心理学的意义与成长模块',
      features: [
        '四大终极关怀探索',
        '意义治疗三大价值',
        '6 种存在主义干预',
        '本真生活评估'
      ],
      commands: ['/existential - 查看存在主义介绍和练习']
    };
  }
}

// 导出模块
module.exports = {
  ExistentialModule,
  ULTIMATE_CONCERNS,
  MEANING_VALUES,
  AUTHENTIC_LIVING,
  EXISTENTIAL_INTERVENTIONS,
  REFLECTION_QUESTIONS
};
