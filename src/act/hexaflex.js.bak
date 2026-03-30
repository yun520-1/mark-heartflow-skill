/**
 * ACT 六边形模型 (Hexaflex Model)
 * 接受与承诺疗法 (Acceptance and Commitment Therapy) 的六个核心过程
 * 
 * 参考来源:
 * - Hayes, S. C., Strosahl, K. D., & Wilson, K. G. (1999). Acceptance and Commitment Therapy
 * - Hayes, S. C. (2004). Acceptance and Commitment Therapy, Relational Frame Theory
 * 
 * 核心理念:
 * > 心理灵活性 = 接纳 + 正念 + 价值观行动
 * > 痛苦不可避免，但挣扎是可选的
 * > 不要与想法战斗，而是带着它们前行
 */

module.exports = {
  // 六个核心过程
  coreProcesses: {
    acceptance: {
      name: '接纳 (Acceptance)',
      code: 'ACCEPTANCE',
      description: '主动拥抱内在体验（想法、感受、记忆），而非回避或控制',
      opposite: '经验性回避 (Experiential Avoidance)',
      keyConcepts: [
        '允许感受存在，不与之战斗',
        '为痛苦腾出空间',
        '接纳不是放弃，而是停止无效的挣扎',
        '感受是暂时的，会自然流动'
      ],
      techniques: [
        {
          name: '扩张练习',
          steps: [
            '注意身体里的感受在哪里',
            '给这个感受腾出空间',
            '深呼吸，让空气流向这个区域',
            '允许感受存在，不推开它'
          ]
        },
        {
          name: '接纳声明',
          steps: [
            '我注意到我有一个 [感受]',
            '我允许这个感受存在',
            '我不需要喜欢它，只需要允许它',
            '它会来，也会走'
          ]
        }
      ],
      prompts: [
        '如果给这个感受腾出空间，会发生什么？',
        '你愿意允许这个感受存在，哪怕它不舒服吗？',
        '与这个感受战斗，对你有什么帮助或伤害？'
      ]
    },

    defusion: {
      name: '认知解离 (Cognitive Defusion)',
      code: 'DEFUSION',
      description: '与想法保持距离，看到想法只是想法，不是事实',
      opposite: '认知融合 (Cognitive Fusion)',
      keyConcepts: [
        '想法只是文字/图像，不是现实',
        '你不需要相信每个想法',
        '想法会来会走，你不必跟随',
        '观察想法，而非陷入想法'
      ],
      techniques: [
        {
          name: '想法命名',
          steps: [
            '注意出现的想法',
            '给它一个标签："这是一个想法"',
            '或者说："我正在想..."',
            '看着它飘过，像云一样'
          ]
        },
        {
          name: '唱出想法',
          steps: [
            '把困扰你的想法用儿歌调子唱出来',
            '注意想法的变化',
            '想法还是那些词，但感觉不同了'
          ]
        },
        {
          name: '感谢心智',
          steps: [
            '当批判性想法出现时',
            '说："谢谢，心智"',
            '承认心智在试图保护你',
            '然后选择你想要的行动'
          ]
        }
      ],
      prompts: [
        '如果把这个想法看作只是脑中的文字，会怎样？',
        '这个想法是事实，还是只是想法？',
        '如果把这个想法唱出来，会有什么不同？'
      ]
    },

    presentMoment: {
      name: '当下觉察 (Present Moment)',
      code: 'PRESENT',
      description: '有意识地觉察此时此地，而非陷入过去或未来',
      opposite: '心智游移 (Mind Wandering)',
      keyConcepts: [
        '当下是唯一真实存在的时刻',
        '过去已去，未来未至',
        '觉察带来选择和自由',
        '正念不是清空头脑，而是觉察'
      ],
      techniques: [
        {
          name: '5-4-3-2-1 锚定',
          steps: [
            '注意 5 个你能看到的东西',
            '注意 4 个你能触摸到的东西',
            '注意 3 个你能听到的声音',
            '注意 2 个你能闻到的气味',
            '注意 1 个你能尝到的味道'
          ]
        },
        {
          name: '呼吸锚定',
          steps: [
            '注意呼吸时空气进出鼻孔的感觉',
            '注意胸腹的起伏',
            '当心智游移时，温和地带回呼吸',
            '不评判，只是觉察'
          ]
        }
      ],
      prompts: [
        '此刻，你注意到了什么？',
        '你的注意力现在在哪里？',
        '如果完全投入当下这一刻，会怎样？'
      ]
    },

    selfAsContext: {
      name: '自我作为背景 (Self-as-Context)',
      code: 'SELF',
      description: '觉察到有一个不变的"观察性自我"，不同于想法和感受',
      opposite: '概念化自我 (Conceptualized Self)',
      keyConcepts: [
        '你是觉察本身，不是被觉察的内容',
        '想法和感受会变化，但觉察者不变',
        '像天空容纳天气，你容纳所有体验',
        '你不是你的故事，你是故事的见证者'
      ],
      techniques: [
        {
          name: '棋盘隐喻',
          steps: [
            '想象你是一个棋盘',
            '黑白棋子是你的想法和感受',
            '棋子会争斗、移动、变化',
            '但棋盘始终在那里，容纳一切'
          ]
        },
        {
          name: '天空与天气',
          steps: [
            '想象你是广阔的天空',
            '想法和感受是飘过的云',
            '云会变化（乌云、白云、暴雨）',
            '但天空始终在那里，不被云定义'
          ]
        }
      ],
      prompts: [
        '谁在觉察这些想法和感受？',
        '如果退后一步观察，会看到什么？',
        '你是棋手，还是棋盘？'
      ]
    },

    values: {
      name: '价值观 (Values)',
      code: 'VALUES',
      description: '澄清你真正想要成为什么样的人，过什么样的生活',
      opposite: '价值观不清/他人期望 (Unclear Values)',
      keyConcepts: [
        '价值观是方向，不是目标',
        '价值观是你选择的，不是外界强加的',
        '价值观指引行动',
        '每一天都可以按价值观生活'
      ],
      domains: [
        { name: '关系', questions: ['你想成为什么样的伴侣/朋友/家人？', '你重视什么样的连接？'] },
        { name: '工作/事业', questions: ['工作对你意味着什么？', '你想贡献什么？'] },
        { name: '健康', questions: ['你如何照顾自己的身体和心灵？', '健康对你意味着什么？'] },
        { name: '成长/学习', questions: ['你想学习什么？', '成长对你意味着什么？'] },
        { name: '休闲/乐趣', questions: ['什么让你感到快乐？', '你如何平衡工作与休息？'] },
        { name: '精神/意义', questions: ['什么让你感到生命有意义？', '你与更大的事物有什么连接？'] }
      ],
      techniques: [
        {
          name: '价值观澄清',
          steps: [
            '想象你的 80 岁生日',
            '你希望人们如何描述你？',
            '你希望因为什么被记住？',
            '这反映了什么价值观？'
          ]
        },
        {
          name: '价值观罗盘',
          steps: [
            '列出对你最重要的 5 个价值观',
            '给每个价值观打分 (1-10)：你现在的活出程度',
            '选择一个价值观，思考明天可以采取的一个小行动'
          ]
        }
      ],
      prompts: [
        '对你来说，什么真正重要？',
        '你想成为什么样的人？',
        '如果按价值观生活，你会做什么不同的事？'
      ]
    },

    committedAction: {
      name: '承诺行动 (Committed Action)',
      code: 'ACTION',
      description: '基于价值观采取具体、可行的行动，即使有不适',
      opposite: '冲动/回避/瘫痪 (Impulsivity/Avoidance/Inaction)',
      keyConcepts: [
        '行动是改变的钥匙',
        '小步骤也能带来大变化',
        '带着不适前行，而非等待不适消失',
        '承诺意味着持续，不是一次性'
      ],
      techniques: [
        {
          name: 'SMART 目标',
          steps: [
            'Specific (具体): 明确要做什么',
            'Measurable (可衡量): 如何知道完成了',
            'Achievable (可实现): 现实可行',
            'Relevant (相关): 与价值观一致',
            'Time-bound (限时): 设定时间'
          ]
        },
        {
          name: '障碍预演',
          steps: [
            '设想可能遇到的障碍',
            '预想应对策略',
            '如果 X 发生，我就做 Y',
            '承诺即使困难也继续'
          ]
        }
      ],
      prompts: [
        '基于你的价值观，下一步可以做什么？',
        '即使有不适，你愿意采取什么行动？',
        '一个小的、可行的第一步是什么？'
      ]
    }
  },

  // 心理灵活性评估维度
  flexibilityDimensions: {
    acceptance: '你允许内在体验存在的程度',
    defusion: '你与想法保持距离的能力',
    presentMoment: '你觉察当下的程度',
    selfAsContext: '你接触观察性自我的能力',
    values: '你清楚自己价值观的程度',
    committedAction: '你按价值观行动的程度'
  },

  // 常见心理僵化模式
  inflexibilityPatterns: {
    avoidance: {
      name: '经验性回避',
      description: '试图控制或消除不适的内在体验',
      examples: ['压抑情绪', '逃避触发情境', '物质滥用', '强迫行为'],
      actResponse: '接纳练习'
    },
    fusion: {
      name: '认知融合',
      description: '把想法当作事实，被想法控制',
      examples: ['"我不够好"=事实', '灾难化思维', '过度概括'],
      actResponse: '解离练习'
    },
    pastFuture: {
      name: '陷入过去/未来',
      description: '注意力不在当下',
      examples: ['反刍过去', '担忧未来', '自动化生活'],
      actResponse: '当下觉察练习'
    },
    unclearValues: {
      name: '价值观不清',
      description: '不清楚什么真正重要',
      examples: ['随波逐流', '为他人期望而活', '空虚感'],
      actResponse: '价值观澄清'
    },
    inaction: {
      name: '无效行动',
      description: '行动与价值观不一致',
      examples: ['拖延', '冲动行为', '回避行动'],
      actResponse: '承诺行动计划'
    }
  }
};
