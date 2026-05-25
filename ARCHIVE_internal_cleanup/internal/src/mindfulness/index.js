/**
 * 正念与接纳模块 (Mindfulness & Acceptance Module)
 * 
 * 基于 Jon Kabat-Zinn 的 MBSR 和 Steven Hayes 的 ACT 疗法
 * 
 * 理论来源:
 * - Kabat-Zinn, J. (1990). Full Catastrophe Living: Using the Wisdom of Your Body and Mind to Face Stress, Pain, and Illness
 * - Hayes, S. C., Strosahl, K. D., & Wilson, K. G. (2012). Acceptance and Commitment Therapy (2nd ed.)
 * - Stanford Encyclopedia of Philosophy: Mindfulness
 */

// 正念的核心态度 (Kabat-Zinn)
MINDFUL_ATTITUDES = {
  '不评判': '对体验保持开放，不贴好坏标签',
  '耐心': '允许事物按其自己的节奏展开',
  '初心': '以新鲜的眼光看待每一刻',
  '信任': '信任自己的直觉和内在智慧',
  '不强求': '不强迫结果，接纳当下',
  '接纳': '如实地看见事物的本来面目',
  '放下': '不执着于愉悦体验，不抗拒不愉悦体验'
};

// 正念冥想练习库
MINDFULNESS_PRACTICES = {
  '基础呼吸冥想': {
    duration: '5-20 分钟',
    instructions: [
      '找个舒适的姿势坐下，背部挺直但不僵硬',
      '轻轻闭上眼睛，或目光柔和地注视前方',
      '将注意力带到呼吸上，感受气息进出身体',
      '注意呼吸的自然节奏，不需要控制它',
      '当注意力飘走时，温和地承认它，然后回到呼吸',
      '对自己保持耐心和友善，走神是正常的'
    ],
    benefits: ['提升专注力', '减少压力', '增强情绪调节'],
    tips: '从每天 5 分钟开始，逐渐增加到 20 分钟'
  },
  '身体扫描': {
    duration: '10-45 分钟',
    instructions: [
      '平躺或舒适地坐着',
      '将注意力带到左脚，感受任何感觉',
      '慢慢向上移动：左腿、右脚、右腿...',
      '依次扫描：腹部、胸部、背部、手臂、手、肩膀、颈部、面部、头顶',
      '对每个部位保持好奇，不试图改变什么',
      '如果发现紧张，轻轻呼气，让那个部位放松'
    ],
    benefits: ['增强身体觉察', '释放紧张', '改善睡眠'],
    tips: '适合睡前练习，帮助放松入睡'
  },
  '正念行走': {
    duration: '10-30 分钟',
    instructions: [
      '选择一个安静的地方，可以来回走 10-20 步',
      '站立，感受双脚与地面的接触',
      '慢慢开始行走，注意力集中在脚底的感觉',
      '感受抬脚、移动、落地的每个动作',
      '走到达终点后，暂停，转身，继续走',
      '当注意力飘走，温和地带回脚步的感觉'
    ],
    benefits: ['结合运动与冥想', '提升身体觉察', '适合久坐人群'],
    tips: '可以室内外进行，速度比平时慢一些'
  },
  '5-4-3-2-1 觉察练习': {
    duration: '3-5 分钟',
    instructions: [
      '停下来，深呼吸几次',
      '找出 5 样你能看到的东西',
      '找出 4 样你能触摸到的东西',
      '找出 3 样你能听到的声音',
      '找出 2 样你能闻到的气味',
      '找出 1 样你能尝到的味道',
      '最后，注意你此刻的整体感受'
    ],
    benefits: ['快速回到当下', '缓解焦虑', '随时可做'],
    tips: '焦虑或压力时立即使用，效果显著'
  },
  '正念呼吸空间': {
    duration: '3 分钟',
    instructions: [
      '第一步 (1 分钟): 觉察 - 问自己"我此刻的体验是什么？"注意想法、情绪、身体感觉',
      '第二步 (1 分钟): 聚焦 - 将注意力完全集中在呼吸上',
      '第三步 (1 分钟): 扩展 - 将觉察从呼吸扩展到全身，然后进入下一步行动'
    ],
    benefits: ['快速重置', '适合工作间隙', '提升觉察力'],
    tips: '每小时做一次，作为"心理休息"'
  },
  '慈心冥想 (Loving-Kindness)': {
    duration: '10-20 分钟',
    instructions: [
      '舒适地坐下，闭上眼睛',
      '先对自己说："愿我平安，愿我健康，愿我快乐，愿我自在"',
      '想象一个你爱的人，对他们说同样的祝福',
      '想象一个中性的人 (如陌生人)，送上祝福',
      '想象一个你感到困难的人，尝试送上祝福',
      '最后，将所有众生包括在内，送上祝福'
    ],
    benefits: ['增强同理心', '减少愤怒', '提升积极情绪'],
    tips: '如果对困难的人感到困难，可以先跳过'
  }
};

// ACT 核心过程 (Hexaflex)
ACT_PROCESSES = {
  '接纳': {
    description: '拥抱内在体验，而非抗拒或逃避',
    practices: [
      '给情绪命名："这是焦虑"',
      '允许感受存在，不试图改变它',
      '为情绪腾出空间，与它共处',
      '区分"疼痛"和"痛苦"（抗拒带来的额外痛苦）'
    ],
    metaphors: [
      '乘客上车：想法和感受像乘客，你是司机',
      '河流：情绪像河水，让它流过，不要筑坝'
    ]
  },
  '认知解离': {
    description: '看见想法只是想法，不是事实',
    practices: [
      '给想法加前缀："我有一个想法..."',
      '用奇怪的声音重复困扰的想法',
      '把想法写在纸上，看着它',
      '感谢心智提供的想法'
    ],
    metaphors: [
      '树叶随溪水流：想法像树叶，看着它飘过',
      '脑中的收音机：想法像背景噪音，不需要关掉'
    ]
  },
  '当下觉察': {
    description: '觉察此时此地，而非沉浸在过去或未来',
    practices: [
      '注意此刻的呼吸、身体感觉、周围环境',
      '五感觉察：看、听、触、闻、尝',
      '正念呼吸空间练习',
      '日常活动正念化（如正念饮食、正念洗澡）'
    ],
    metaphors: [
      '聚光灯：注意力像聚光灯，照亮此刻'
    ]
  },
  '自我作为背景': {
    description: '你是觉察的场域，而非被觉察的内容',
    practices: [
      '区分"思考的自我"和"观察的自我"',
      '注意那个一直在觉察的部分',
      '练习：从不同视角看自己（儿童、成人、智者）'
    ],
    metaphors: [
      '天空与天气：你是天空，想法情绪是天气',
      '棋盘与棋子：你是棋盘，不是棋子'
    ]
  },
  '价值观': {
    description: '澄清你真正想要的生活方向',
    practices: [
      '80 岁生日宴会：想象别人如何评价你',
      '价值观卡片排序',
      '墓志铭练习：你想留下什么',
      '理想一天：描述完美的一天'
    ],
    domains: [
      '家庭', '友谊', '健康', '学习', '工作',
      '休闲', '灵性', '社区', '环境'
    ]
  },
  '承诺行动': {
    description: '基于价值观采取具体行动',
    practices: [
      '设定与价值对齐的 SMART 目标',
      '识别并克服行动障碍',
      '小步前进，庆祝进步',
      '承诺 - 行动- 反思循环'
    ],
    frameworks: [
      'WOOP: Wish, Outcome, Obstacle, Plan',
      '如果 - 那么计划：如果 X 发生，那么我做 Y'
    ]
  }
};

// 接纳技术库
ACCEPTANCE_TECHNIQUES = {
  '扩展': {
    name: '扩展 (Expansion)',
    steps: [
      '觉察：注意身体的感觉在哪里',
      '呼吸：对着那个感觉呼吸，为它腾出空间',
      '允许：允许它在那里，不试图改变它',
      '观察：带着好奇观察它的形状、颜色、质地'
    ],
    useCase: '应对强烈情绪或身体不适'
  },
  '冲浪': {
    name: '冲动冲浪 (Urge Surfing)',
    steps: [
      '觉察冲动的出现',
      '注意它在身体里的感觉',
      '想象自己在冲浪，随着冲动起伏',
      '知道它会达到高峰然后自然消退'
    ],
    useCase: '应对成瘾、强迫行为、情绪化进食'
  },
  '观察者立场': {
    name: '观察者立场',
    steps: [
      '注意你正在经历什么',
      '同时注意那个"正在注意"的部分',
      '安住于观察者的位置',
      '看着体验来去，你是不变的背景'
    ],
    useCase: '与困难体验保持距离'
  }
};

class MindfulnessModule {
  constructor() {
    this.name = '正念与接纳模块';
    this.version = '1.0.0';
  }

  /**
   * 获取正念练习推荐
   */
  recommendPractice(userState = {}, availableTime = 10) {
    const practices = Object.entries(MINDFULNESS_PRACTICES)
      .filter(([_, practice]) => {
        const duration = parseInt(practice.duration);
        return duration <= availableTime;
      })
      .map(([name, practice]) => ({
        name,
        ...practice
      }));

    // 根据状态推荐
    let recommendation;
    if (userState.stress === 'high' || userState.anxiety === 'high') {
      recommendation = practices.find(p => p.name === '5-4-3-2-1 觉察练习') || practices[0];
    } else if (userState.sleep === 'poor') {
      recommendation = practices.find(p => p.name === '身体扫描') || practices[0];
    } else if (userState.focus === 'poor') {
      recommendation = practices.find(p => p.name === '基础呼吸冥想') || practices[0];
    } else {
      recommendation = practices[0];
    }

    return {
      recommended: recommendation,
      allPractices: practices,
      tips: [
        '选择固定的时间和地点练习',
        '从短时间开始，逐渐增加',
        '不追求"完美"的冥想',
        '走神是正常的，关键是温和地回来'
      ]
    };
  }

  /**
   * ACT 六边形评估
   */
  assessHexaflex() {
    return {
      model: 'ACT Hexaflex',
      processes: Object.entries(ACT_PROCESSES).map(([key, value]) => ({
        name: key,
        description: value.description,
        practices: value.practices,
        metaphors: value.metaphors
      })),
      assessment: [
        '在每个过程上，1-10 分评分你的灵活性',
        '识别最强的 2 个过程',
        '识别最需要提升的 2 个过程'
      ],
      integration: '六个过程相互支持，共同构成心理灵活性'
    };
  }

  /**
   * 生成接纳干预
   */
  generateAcceptanceIntervention(emotionType = 'anxiety') {
    const interventions = {
      '焦虑': {
        technique: '扩展 + 冲浪',
        steps: [
          '停下来，觉察焦虑在身体的哪个部位',
          '对着那个部位呼吸，为它腾出空间',
          '允许焦虑存在，不试图推开它',
          '想象焦虑像海浪，你在学习冲浪',
          '知道它会达到高峰然后自然消退'
        ],
        duration: '5-10 分钟',
        evidence: 'Hayes et al. (2012) - ACT 对焦虑障碍有效'
      },
      '抑郁': {
        technique: '慈心冥想 + 价值观行动',
        steps: [
          '先做 5 分钟慈心冥想，对自己友善',
          '澄清一个重要的价值观',
          '设定一个与价值对齐的小行动',
          '承诺在今天完成它，无论情绪如何'
        ],
        duration: '15-20 分钟',
        evidence: 'ACT 对抑郁有效，尤其是结合承诺行动'
      },
      '愤怒': {
        technique: '正念呼吸空间 + 认知解离',
        steps: [
          '做 3 分钟呼吸空间，回到当下',
          '注意愤怒的想法，给它们加前缀',
          '"我有一个想法：这不公平"',
          '感谢心智提供的保护性想法',
          '选择基于价值观的回应方式'
        ],
        duration: '10 分钟',
        evidence: '正念减少反应性，增强情绪调节'
      },
      '压力': {
        technique: '身体扫描 + 扩展',
        steps: [
          '做 10 分钟身体扫描，觉察紧张部位',
          '对每个紧张部位做扩展练习',
          '呼吸进入紧张区域，允许它存在',
          '注意紧张与放松的交替'
        ],
        duration: '15 分钟',
        evidence: 'MBSR 显著降低压力水平'
      }
    };

    return {
      intervention: interventions[emotionType] || interventions['压力'],
      allInterventions: interventions,
      generalPrinciples: [
        '接纳不是放弃，而是停止无效的挣扎',
        '情绪本身不痛苦，抗拒情绪才痛苦',
        '允许感受存在，同时选择有价值的行动',
        '练习越多，效果越明显'
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
      description: '基于 MBSR 和 ACT 的正念与接纳干预模块',
      features: [
        '6 种正念冥想练习',
        'ACT 六边形评估',
        '接纳技术库',
        '情绪特异性干预'
      ],
      commands: ['/mindfulness - 查看正念练习和 ACT 介绍']
    };
  }
}

// 导出模块
module.exports = {
  MindfulnessModule,
  MINDFUL_ATTITUDES,
  MINDFULNESS_PRACTICES,
  ACT_PROCESSES,
  ACCEPTANCE_TECHNIQUES
};
