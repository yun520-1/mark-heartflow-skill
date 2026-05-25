/**
 * 依恋风格定义 (Attachment Styles)
 * 基于 Bowlby & Ainsworth 的依恋理论
 * 
 * 四种依恋风格:
 * - 安全型 (Secure): 舒适于亲密，信任他人
 * - 焦虑型 (Anxious): 渴望亲密，担心被抛弃
 * - 回避型 (Avoidant): 回避亲密，强调独立
 * - 混乱型 (Disorganized): 矛盾，既渴望又害怕亲密
 */

module.exports = {
  // 依恋风格定义
  styles: {
    secure: {
      name: '安全型',
      code: 'SECURE',
      description: '舒适于亲密关系，信任他人，也能保持独立',
      characteristics: [
        '容易信任他人',
        '舒适于情感亲密',
        '能有效沟通需求',
        '在关系中感到安全',
        '能平衡亲密与独立',
        '冲突时寻求解决而非逃避'
      ],
      relationshipPatterns: {
        intimacy: '高',
        independence: '高',
        anxiety: '低',
        avoidance: '低'
      },
      supportStrategies: [
        '肯定其健康的关系模式',
        '鼓励继续保持开放沟通',
        '提供成长型建议而非修复型'
      ]
    },
    anxious: {
      name: '焦虑型 (痴迷型)',
      code: 'ANXIOUS',
      description: '渴望亲密，但担心被抛弃，需要持续确认',
      characteristics: [
        '强烈渴望亲密',
        '担心被抛弃/拒绝',
        '需要频繁确认',
        '对关系变化敏感',
        '可能过度依赖伴侣',
        '情绪波动较大',
        '容易解读负面信号'
      ],
      relationshipPatterns: {
        intimacy: '高 (过度渴望)',
        independence: '低',
        anxiety: '高',
        avoidance: '低'
      },
      triggers: [
        '伴侣没有及时回复',
        '感觉被冷落',
        '关系不确定性',
        '伴侣需要独处时间'
      ],
      supportStrategies: [
        '提供稳定的情感支持',
        '帮助识别焦虑触发点',
        '练习自我安抚技巧',
        '建立内在安全感',
        '减少过度寻求确认的行为',
        '培养独立兴趣和社交圈'
      ]
    },
    avoidant: {
      name: '回避型 (疏离型)',
      code: 'AVOIDANT',
      description: '回避亲密，强调独立，难以表达情感需求',
      characteristics: [
        '强调独立自主',
        '回避情感亲密',
        '难以表达脆弱',
        '在关系变近时退缩',
        '倾向于自我依赖',
        '可能显得冷漠',
        '压抑情感需求'
      ],
      relationshipPatterns: {
        intimacy: '低',
        independence: '高 (过度)',
        anxiety: '低 (压抑)',
        avoidance: '高'
      },
      triggers: [
        '伴侣要求更多亲密',
        '被期待表达情感',
        '关系进展太快',
        '感到被控制/束缚'
      ],
      supportStrategies: [
        '尊重其独立需求',
        '逐步鼓励情感表达',
        '帮助识别压抑的情感',
        '练习小步骤的脆弱表达',
        '理解独立与亲密可以共存'
      ]
    },
    disorganized: {
      name: '混乱型 (恐惧 - 回避型)',
      code: 'DISORGANIZED',
      description: '既渴望亲密又害怕受伤，行为矛盾',
      characteristics: [
        '对亲密关系矛盾',
        '既渴望又害怕靠近',
        '行为不可预测',
        '可能有创伤历史',
        '难以信任他人',
        '情绪调节困难',
        '在关系中感到困惑'
      ],
      relationshipPatterns: {
        intimacy: '矛盾 (渴望但害怕)',
        independence: '矛盾',
        anxiety: '高',
        avoidance: '高'
      },
      triggers: [
        '亲密关系进展',
        '信任被考验',
        '情感脆弱时刻',
        '关系冲突'
      ],
      supportStrategies: [
        '提供高度稳定的支持',
        '帮助识别矛盾情感',
        '创伤知情的回应',
        '鼓励专业心理支持',
        '练习情绪调节技巧',
        '建立安全的关系边界'
      ]
    }
  },

  // 依恋风格检测关键词
  keywords: {
    anxious: [
      '他为什么不回我消息',
      '他是不是不爱我了',
      '我是不是做错了什么',
      '他总是忽略我',
      '我需要他更多的关注',
      '我害怕失去他',
      '我总是在等他的消息',
      '他能不能多陪陪我',
      '我觉得他不重视我',
      '我很没有安全感',
      '他总是让我失望',
      '我需要确认他的爱',
      '我是不是很烦人',
      '他会不会离开我',
      '我感觉被抛弃了'
    ],
    avoidant: [
      '我需要空间',
      '我不想谈这个',
      '我一个人挺好的',
      '关系太麻烦了',
      '我不喜欢依赖别人',
      '他太粘人了',
      '我需要自由',
      '我不想被束缚',
      '感情会影响我的生活',
      '我还是习惯一个人',
      '我不想讨论感受',
      '这太情绪化了',
      '我需要冷静一下',
      '离我远点',
      '我不想承诺'
    ],
    disorganized: [
      '我想靠近他又怕受伤',
      '我不知道自己想要什么',
      '我害怕亲密关系',
      '我想要爱但我不敢',
      '我总是搞砸关系',
      '我不值得被爱',
      '我害怕被抛弃也害怕被束缚',
      '我的情绪很混乱',
      '我不知道怎么信任别人',
      '我总是在推开爱我的人',
      '我想要亲密但又害怕',
      '我很矛盾',
      '我不明白自己的感受',
      '我害怕再次受伤',
      '我无法维持关系'
    ],
    secure: [
      '我们沟通得很好',
      '我相信他',
      '我们有各自的空间但也亲密',
      '我们可以一起解决问题',
      '我感到安全',
      '我们互相支持',
      '我可以做我自己',
      '我们的关系很健康',
      '我信任我们的关系',
      '我们可以坦诚交流'
    ]
  },

  // 依恋风格评分维度
  dimensions: {
    anxiety: {
      name: '焦虑维度',
      description: '对被抛弃/拒绝的担忧程度',
      highScoreIndicators: [
        '频繁寻求确认',
        '担心被抛弃',
        '对关系变化敏感',
        '过度解读信号'
      ]
    },
    avoidance: {
      name: '回避维度',
      description: '对亲密/依赖的回避程度',
      highScoreIndicators: [
        '回避情感表达',
        '强调独立',
        '难以信任他人',
        '压抑情感需求'
      ]
    }
  },

  // 二维模型映射 (焦虑 x 回避)
  twoDimensionalModel: {
    lowAnxiety_lowAvoidance: 'secure',      // 安全型
    highAnxiety_lowAvoidance: 'anxious',    // 焦虑型
    lowAnxiety_highAvoidance: 'avoidant',   // 回避型
    highAnxiety_highAvoidance: 'disorganized' // 混乱型
  }
};
