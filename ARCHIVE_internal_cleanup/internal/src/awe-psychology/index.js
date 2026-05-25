/**
 * 敬畏心理学模块 (Awe Psychology Module)
 * 
 * 基于 Berkeley Greater Good Science Center 权威研究及 Keltner & Haidt 敬畏理论
 * 
 * 核心理论来源:
 * - Keltner, D. & Haidt, J. (2003). Approaching awe, a moral, spiritual, and aesthetic emotion. Cognition and Emotion.
 * - Piff, P. et al. (2015). Awe, the small self, and prosocial behavior. Journal of Personality and Social Psychology.
 * - Rudd, M. et al. (2012). Awe expands time and increases well-being. Psychological Science.
 * - Bai, Y. et al. (2017). Awe is associated with lower IL-6. Emotion.
 * - Berkeley Greater Good Science Center: The Science of Awe
 * 
 * 核心理论框架:
 * 1. 敬畏的定义：面对 vast(浩瀚) 且 challenges understanding(挑战理解) 的事物时的体验
 * 2. 两大核心特征:
 *    - Perceived Vastness (感知浩瀚) - 超越日常经验尺度
 *    - Need for Accommodation (需要顺应) - 挑战现有认知框架
 * 3. 敬畏的效价：可以是积极的 (wonder/amazement) 或消极的 (threat/dread)
 * 
 * 实证研究效益:
 * - 提升幸福感与积极情绪
 * - 激发好奇心与创造力
 * - 增强亲社会行为 (更慷慨、更愿意帮助他人)
 * - 产生"小自我"效应 (small self)，减少自我中心
 * - 扩展时间感知 (time expansion)
 * - 降低炎症标志物 IL-6，改善身体健康
 * - 促进批判性思维
 * 
 * 可操作技术:
 * - Awe Walk (敬畏散步)
 * - Awe Narrative (敬畏叙事写作)
 * - Noticing Nature (自然觉察)
 * - Awe Video (敬畏视频体验)
 * - Beginner's Mind (初学者心态)
 * - 敬畏倾向性评估
 * 
 * @module awe-psychology
 * @version 3.45.0
 */

const AwePsychology = {
  /**
   * 模块元信息
   */
  meta: {
    name: '敬畏心理学',
    version: '3.48.0',
    source: 'Berkeley Greater Good + Keltner & Haidt (2003) + Piff et al. (2015) + Rudd et al. (2012) + Bai et al. (2017)',
    description: '基于科学研究的敬畏情绪培养模块，帮助体验浩瀚感、激发好奇心、增强亲社会联结'
  },

  /**
   * 敬畏的两大核心特征
   */
  coreFeatures: {
    perceivedVastness: {
      name: '感知浩瀚',
      description: '体验到某物在规模、复杂性、力量或意义上超越日常经验',
      examples: [
        '仰望星空时的宇宙浩瀚感',
        '站在大峡谷边缘的壮阔感',
        '聆听宏大交响乐的震撼感',
        '见证新生儿诞生的奇迹感',
        '理解深奥理论时的智力浩瀚感'
      ]
    },
    needForAccommodation: {
      name: '需要顺应',
      description: '现有认知框架无法完全理解体验，需要调整心智模型',
      examples: [
        '第一次看到量子力学概念时的认知冲击',
        '目睹极端善良行为时的道德震撼',
        '看到前所未见的艺术形式时的审美冲击',
        '经历超自然体验时的信仰挑战'
      ]
    }
  },

  /**
   * 敬畏的效价 (Valence) - v3.48.0 新增
   * 来源：Berkeley Greater Good Science Center
   */
  aweValence: {
    positive: {
      name: '积极敬畏',
      emotions: ['wonder', 'amazement', 'inspiration', 'elevation', 'gratitude'],
      description: '带来愉悦、启发和成长的敬畏体验',
      examples: [
        '观看壮丽的日出',
        '见证新生儿的诞生',
        '聆听震撼人心的音乐',
        '目睹无私的善举',
        '理解深刻的科学理论'
      ],
      benefits: '提升幸福感、激发创造力、增强亲社会行为、扩展时间感知',
      practice: '多接触积极的敬畏来源，记录和回味积极敬畏体验'
    },
    negative: {
      name: '消极敬畏',
      emotions: ['threat', 'dread', 'fear', 'powerlessness', 'anxiety'],
      description: '伴随恐惧、威胁或无力感的敬畏体验',
      examples: [
        '面对自然灾害 (地震、海啸、龙卷风)',
        '目睹战争暴行',
        '面对极权领袖的 coercive charisma',
        '感知到愤怒和惩罚性的上帝',
        '面对无法控制的巨大力量'
      ],
      effects: '可能不会带来积极敬畏的效益，反而增加无力感和焦虑',
      note: '消极敬畏是复杂的情绪体验，需要谨慎处理。如果感到 overwhelmed，建议寻求专业支持。'
    },
    distinction: {
      key: '积极敬畏 vs 消极敬畏的关键区别在于：是否感到赋能 (empowered) 还是无力 (powerless)',
      positiveSigns: ['感到好奇和探索欲', '感到与更大的存在连接', '感到启发和鼓舞', '时间感知扩展'],
      negativeSigns: ['感到威胁和恐惧', '感到无力控制', '想要逃避', '持续的焦虑或困扰']
    }
  },

  /**
   * 敬畏的主要来源分类
   */
  aweSources: {
    nature: {
      name: '自然',
      description: '自然景观、自然现象、生态系统',
      examples: [
        '日出日落',
        '星空银河',
        '高山峡谷',
        '海洋湖泊',
        '森林草原',
        '雷雨闪电',
        '彩虹极光',
        '花开花谢',
        '动物行为'
      ],
      practice: 'Noticing Nature - 每日花 5 分钟专注观察自然细节'
    },
    humanGreatness: {
      name: '人类伟大',
      description: '他人的卓越成就、道德勇气、创造力',
      examples: [
        '奥运选手打破世界纪录',
        '科学家的重大发现',
        '艺术家的杰作',
        '普通人的无私善举',
        '领导者的道德勇气',
        '工匠的精湛技艺'
      ],
      practice: '阅读传记或纪录片，了解 inspiring 的人生故事'
    },
    art: {
      name: '艺术与音乐',
      description: '音乐、绘画、建筑、文学等艺术作品',
      examples: [
        '宏伟的建筑 (大教堂、金字塔)',
        '震撼的音乐 (交响乐、合唱)',
        '深刻的绘画 (名画、壁画)',
        '优美的文学 (诗歌、小说)',
        '舞蹈表演',
        '电影杰作'
      ],
      practice: '定期参观博物馆、音乐会，深度欣赏艺术作品'
    },
    knowledge: {
      name: '知识与理解',
      description: '智力上的洞察、理论理解、概念突破',
      examples: [
        '理解宇宙大爆炸理论',
        '领悟数学之美',
        '掌握复杂系统的运作',
        '理解进化论的深刻含义',
        '学习哲学的深层洞见'
      ],
      practice: '深入学习感兴趣的领域，追求理解的深度而非广度'
    },
    spiritual: {
      name: '精神与超越',
      description: '宗教体验、冥想体验、超越性感受',
      examples: [
        '宗教仪式中的神圣感',
        '深度冥想中的合一感',
        '濒死体验',
        '神秘体验',
        '集体祈祷或唱诵'
      ],
      practice: '参与精神实践，保持开放和探索的心态'
    },
    everyday: {
      name: '日常敬畏',
      description: '日常生活中被忽视的微小敬畏时刻',
      examples: [
        '孩子的第一次微笑',
        '陌生人之间的善意互动',
        '城市夜景的灯火',
        '雨后的清新空气',
        '老照片中的时光痕迹',
        '街头艺人的表演'
      ],
      practice: '培养日常觉察，记录每天的"微小奇迹"'
    }
  },

  /**
   * 敬畏倾向性评估量表 (基于研究文献简化版)
   * 评分：1=完全不同意，7=完全同意
   */
  awePronenessScale: [
    {
      id: 1,
      text: '我经常被自然美景深深打动',
      category: 'nature'
    },
    {
      id: 2,
      text: '我容易对宏大的音乐或艺术产生强烈的情感反应',
      category: 'art'
    },
    {
      id: 3,
      text: '当我听到深刻的想法或理论时，会感到心智被扩展',
      category: 'knowledge'
    },
    {
      id: 4,
      text: '我容易被他人的善举或道德勇气所感动',
      category: 'humanGreatness'
    },
    {
      id: 5,
      text: '我经常在日常生活中发现令人惊叹的小事',
      category: 'everyday'
    },
    {
      id: 6,
      text: '我有过超越日常理解的精神或神秘体验',
      category: 'spiritual'
    },
    {
      id: 7,
      text: '我容易感到好奇并想要探索未知',
      category: 'general'
    },
    {
      id: 8,
      text: '我有时会感到自己相对于宇宙或自然是渺小的',
      category: 'smallSelf'
    },
    {
      id: 9,
      text: '深刻的体验会让我重新思考对世界的理解',
      category: 'accommodation'
    },
    {
      id: 10,
      text: '我容易被美所打动，无论是自然美还是人工美',
      category: 'beauty'
    }
  ],

  /**
   * 评估敬畏倾向性
   * @param {Array<number>} scores - 10 个项目的评分 (1-7)
   * @returns {Object} 评估结果
   */
  assessAweProneness(scores) {
    if (!scores || scores.length !== 10) {
      return {
        error: '请完成所有 10 个项目的评分 (1-7 分)',
        valid: false
      };
    }

    const total = scores.reduce((a, b) => a + b, 0);
    const average = total / 10;

    let level, description, suggestions;

    if (average >= 5.5) {
      level = '高敬畏倾向';
      description = '你很容易体验敬畏情绪，这是你的优势！你善于发现生活中的浩瀚与奇迹。';
      suggestions = [
        '继续培养你的敬畏敏感性',
        '尝试记录敬畏日记，深化体验',
        '与他人分享你的敬畏体验，传播积极影响',
        '探索新的敬畏来源，保持新鲜感'
      ];
    } else if (average >= 3.5) {
      level = '中等敬畏倾向';
      description = '你有一定的敬畏体验能力，可以通过练习进一步增强。';
      suggestions = [
        '尝试每周一次的 Awe Walk',
        '每天花 5 分钟 Noticing Nature',
        '观看 awe-inspiring 的视频或纪录片',
        '写一次 Awe Narrative，回顾深刻的敬畏体验'
      ];
    } else {
      level = '低敬畏倾向';
      description = '你可能较少体验敬畏情绪，这很常见。敬畏是可以培养的能力。';
      suggestions = [
        '从简单的自然觉察开始',
        '尝试 Beginner\'s Mind 练习，用新鲜眼光看世界',
        '观看推荐的 awe 视频',
        '与容易体验敬畏的人交流，学习他们的视角'
      ];
    }

    // 分析各维度
    const categoryScores = {};
    this.awePronenessScale.forEach((item, index) => {
      if (!categoryScores[item.category]) {
        categoryScores[item.category] = { sum: 0, count: 0 };
      }
      categoryScores[item.category].sum += scores[index];
      categoryScores[item.category].count++;
    });

    const categoryAverages = {};
    Object.keys(categoryScores).forEach(cat => {
      categoryAverages[cat] = categoryScores[cat].sum / categoryScores[cat].count;
    });

    // 找出最强和最弱维度
    const categories = Object.entries(categoryAverages).sort((a, b) => b[1] - a[1]);
    const strongest = categories[0];
    const weakest = categories[categories.length - 1];

    return {
      valid: true,
      totalScore: total,
      averageScore: average.toFixed(2),
      level,
      description,
      suggestions,
      categoryScores: categoryAverages,
      strongestCategory: strongest[0],
      weakestCategory: weakest[0],
      strongestScore: strongest[1].toFixed(2),
      weakestScore: weakest[1].toFixed(2)
    };
  },

  /**
   * 敬畏散步指南 (Awe Walk)
   * 基于 UC Berkeley GGIA 练习
   */
  getAweWalkGuide(duration = '20') {
    return {
      name: '敬畏散步 (Awe Walk)',
      duration: `${duration} 分钟`,
      source: 'UC Berkeley Greater Good in Action',
      research: 'Bai et al. (2017) - 每周敬畏散步显著提升积极情绪和幸福感',
      instructions: [
        {
          step: 1,
          title: '准备阶段',
          content: '选择一个你有机会接触自然或新鲜环境的地方。关闭手机或设置为勿扰模式。设定 intention：今天我要带着好奇和开放的心态去探索。'
        },
        {
          step: 2,
          title: '开始行走',
          content: '以缓慢、放松的步伐开始行走。不要设定目的地，让好奇心引导你。'
        },
        {
          step: 3,
          title: '寻找浩瀚',
          content: '留意那些让你感到"大"的事物——可以是物理规模的大 (高大的树木、广阔的天空)，也可以是复杂性的大 (一片叶子的纹理、蚂蚁的行为)，或意义的大 (历史建筑的沧桑)。'
        },
        {
          step: 4,
          title: '深度观察',
          content: '当你被某物吸引时，停下来，花 1-2 分钟深度观察。注意细节、颜色、纹理、运动。让自己完全沉浸在体验中。'
        },
        {
          step: 5,
          title: '接纳未知',
          content: '当你遇到不理解的事物时，不要急于查找答案。保持"不知道"的状态，让神秘感本身成为体验的一部分。'
        },
        {
          step: 6,
          title: '小自我感',
          content: '注意你是否感到自己相对于所见之物是"小"的。这种小自我感是敬畏的核心特征，它能减少自我中心，增强与世界的联结。'
        },
        {
          step: 7,
          title: '结束与整合',
          content: '散步结束时，花 1 分钟回想今天的体验。什么最让你印象深刻？你注意到了什么平时会忽略的东西？'
        }
      ],
      tips: [
        '选择新的路线，避免熟悉的环境',
        '尝试不同的天气 (安全的情况下)',
        '带上相机记录触动你的瞬间 (但不要过度拍照)',
        '每周至少一次，持续 8 周以获得最佳效果'
      ]
    };
  },

  /**
   * 敬畏叙事写作提示 (Awe Narrative)
   */
  getAweNarrativePrompt() {
    return {
      name: '敬畏叙事写作 (Awe Narrative)',
      duration: '15-20 分钟',
      source: 'UC Berkeley Greater Good in Action',
      instructions: [
        '回想一次你深刻体验敬畏的时刻。',
        '闭上眼睛，回到那个场景，尽可能 vividly 地回忆细节。',
        '然后开始写作，回答以下问题：',
        '',
        '1. 你在哪里？当时是什么情境？',
        '2. 你看到了/听到了/感受到了什么？',
        '3. 是什么让你感到敬畏？是规模？复杂性？美？力量？',
        '4. 你的身体有什么感觉？(心跳、呼吸、皮肤感觉等)',
        '5. 你的想法有什么变化？是否感到现有理解被挑战？',
        '6. 这次体验对你有什么影响？是否改变了你的视角或行为？',
        '7. 这次敬畏体验与你平时的体验有什么不同？',
        '',
        '写作提示：',
        '- 不要担心语法或拼写，让文字自然流动',
        '- 尽可能具体和详细',
        '- 如果情绪涌现，允许自己感受它们',
        '- 写完后，重读一遍，注意你的感受'
      ],
      benefits: [
        '深化敬畏体验的记忆和整合',
        '增强情绪觉察能力',
        '发现敬畏体验的个人意义',
        '为未来创造敬畏体验的"地图"'
      ]
    };
  },

  /**
   * 自然觉察练习 (Noticing Nature)
   */
  getNatureNoticingExercise() {
    return {
      name: '自然觉察 (Noticing Nature)',
      duration: '5 分钟/天',
      source: 'UC Berkeley Greater Good in Action',
      research: '每周 3 次自然觉察，持续 4 周，显著提升积极情绪和生命意义感',
      instructions: [
        {
          day: '每日练习',
          content: '每天花 5 分钟，专注观察周围的自然元素。',
          steps: [
            '找一个有自然元素的地方 (公园、花园、甚至窗台的植物)',
            '放下手机，关闭其他干扰',
            '深呼吸 3 次，让自己安定下来',
            '选择一个自然对象 (一片叶子、一朵花、一棵树、一片云)',
            '用所有感官去体验它：看、听、闻、触 (如果合适)',
            '注意细节：颜色渐变、纹理、形状、运动',
            '注意你的内在反应：好奇？平静？惊叹？',
            '5 分钟后，感谢这个自然存在，然后继续你的一天'
          ]
        }
      ],
      weeklyPrompts: [
        '周一：观察一片叶子的细节',
        '周二：聆听自然声音 (鸟鸣、风声、水流)',
        '周三：观察云朵的变化',
        '周四：触摸自然物体 (树皮、石头、花瓣)',
        '周五：观察光影的变化',
        '周六：观察小动物或昆虫',
        '周日：自由探索，选择最吸引你的自然元素'
      ],
      tips: [
        '即使在下雨天也可以练习',
        '城市环境也有自然 (行道树、公园、宠物)',
        '拍照记录你的发现 (但不替代体验本身)',
        '尝试在不同时间段练习 (清晨、黄昏、夜晚)'
      ]
    };
  },

  /**
   * 初学者心态练习 (Beginner's Mind)
   */
  getBeginnerMindPractice() {
    return {
      name: '初学者心态 (Beginner\'s Mind)',
      duration: '10-15 分钟',
      source: '禅宗传统 + 积极心理学整合',
      description: '用第一次见到那样的新鲜眼光看待熟悉的事物',
      instructions: [
        {
          step: 1,
          title: '选择对象',
          content: '选择一个你非常熟悉的事物：你的家、你的通勤路线、一个常用物品、甚至你的手。'
        },
        {
          step: 2,
          title: '设定意图',
          content: '告诉自己："我要像第一次见到这个事物那样去看它。"'
        },
        {
          step: 3,
          title: '深度观察',
          content: '开始观察，注意：',
          details: [
            '你平时忽略的细节',
            '颜色、纹理、形状的微妙变化',
            '它与周围环境的关系',
            '它的功能、历史、来源'
          ]
        },
        {
          step: 4,
          title: '提问',
          content: '像孩子一样提问：',
          questions: [
            '为什么它是这样的？',
            '它是如何运作的？',
            '它从哪里来？',
            '如果没有它会怎样？'
          ]
        },
        {
          step: 5,
          title: '接纳惊奇',
          content: '允许自己对熟悉的事物感到惊奇。即使是日常物品，深入观察也会发现令人惊叹的复杂性。'
        }
      ],
      examples: [
        '观察你的手：掌纹、指纹、关节的精密结构',
        '观察一杯水：水分子的结构、来源、对生命的意义',
        '观察一条街道：历史、设计、人流、生态系统'
      ],
      benefits: [
        '打破自动化知觉',
        '培养好奇心和开放心态',
        '发现日常中的非凡',
        '减少评判，增加接纳'
      ]
    };
  },

  /**
   * 敬畏效益说明
   */
  explainAweBenefits() {
    return {
      psychological: [
        {
          benefit: '提升幸福感',
          research: 'Gordon et al. (2016) - 体验敬畏的日子，人们报告更高的幸福感和积极情绪',
          mechanism: '敬畏引发积极情绪 cascade (joy, gratitude, inspiration)'
        },
        {
          benefit: '激发好奇心与创造力',
          research: 'Keltner & Haidt (2003) - 敬畏的"需要顺应"特征促进认知灵活性',
          mechanism: '挑战现有框架，鼓励探索性思维'
        },
        {
          benefit: '增强亲社会行为',
          research: 'Piff et al. (2015) - 敬畏体验后，人们更慷慨、更愿意帮助他人',
          mechanism: '"小自我"效应减少自我中心，增强与他人/世界的联结感'
        },
        {
          benefit: '扩展时间感知',
          research: 'Rudd et al. (2012) - 敬畏让人感知更多可用时间，减少不耐烦',
          mechanism: '浩瀚体验改变时间参照系'
        },
        {
          benefit: '促进批判性思维',
          research: '敬畏状态下的认知开放性增强',
          mechanism: '减少确认偏误，增加信息整合'
        }
      ],
      physical: [
        {
          benefit: '降低炎症水平',
          research: 'Bai et al. (2017) - 敬畏倾向高的人 IL-6 (炎症标志物) 水平更低',
          mechanism: '积极情绪调节免疫系统，减少慢性炎症'
        },
        {
          benefit: '改善心血管健康',
          research: '降低 IL-6 与降低心血管疾病风险相关',
          mechanism: '炎症减少 → 心血管负担减轻'
        }
      ],
      social: [
        {
          benefit: '增强社会联结',
          research: '敬畏体验增强集体归属感',
          mechanism: '小自我效应 + 共同人性感知'
        },
        {
          benefit: '减少自我中心',
          research: '敬畏后人们更少关注个人烦恼',
          mechanism: '相对浩瀚，个人问题显得较小'
        }
      ]
    };
  },

  /**
   * 识别用户的敬畏来源
   * @param {string} userInput - 用户描述
   * @returns {Object} 识别结果
   */
  identifyAweSources(userInput) {
    const sources = [];
    const input = userInput.toLowerCase();

    // 自然相关关键词
    if (input.match(/自然 | 山 | 海 | 星空 | 日出 | 日落 | 森林 | 草原 | 河流 | 湖泊 | 天空 | 云 | 树 | 花 | 动物 | 自然|mountain|ocean|star|sun|forest|river|sky|cloud|tree|flower|animal|nature/)) {
      sources.push({
        category: 'nature',
        name: '自然',
        confidence: 'high',
        suggestion: '尝试 Noticing Nature 练习，每天 5 分钟深度观察自然'
      });
    }

    // 艺术相关
    if (input.match(/音乐 | 艺术 | 画 | 建筑 | 雕塑 | 舞蹈 | 电影 | 文学 | 诗 | 美|museum|art|music|painting|architecture|dance|movie|poem|beauty/)) {
      sources.push({
        category: 'art',
        name: '艺术与音乐',
        confidence: 'high',
        suggestion: '定期参观博物馆、音乐会，深度欣赏艺术作品'
      });
    }

    // 知识相关
    if (input.match(/科学 | 理论 | 知识 | 学习 | 理解 | 发现 | 宇宙 | 物理 | 数学 | 哲学|science|theory|knowledge|learn|understand|discovery|universe|physics|math|philosophy/)) {
      sources.push({
        category: 'knowledge',
        name: '知识与理解',
        confidence: 'high',
        suggestion: '深入学习感兴趣的领域，追求理解的深度而非广度'
      });
    }

    // 人类伟大相关
    if (input.match(/英雄 | 榜样 | 善举 | 勇敢 | 成就 | 伟大 | 榜样|hero|inspiring|kindness|courage|achievement|greatness/)) {
      sources.push({
        category: 'humanGreatness',
        name: '人类伟大',
        confidence: 'high',
        suggestion: '阅读传记或纪录片，了解 inspiring 的人生故事'
      });
    }

    // 精神相关
    if (input.match(/精神 | 宗教 | 冥想 | 神圣 | 神秘 | 超越 | 灵性|spiritual|religious|meditation|sacred|mystery|transcendent/)) {
      sources.push({
        category: 'spiritual',
        name: '精神与超越',
        confidence: 'high',
        suggestion: '参与精神实践，保持开放和探索的心态'
      });
    }

    // 日常相关
    if (input.match(/日常 | 小事 | 简单 | 普通 | 平凡|everyday|small|simple|ordinary/)) {
      sources.push({
        category: 'everyday',
        name: '日常敬畏',
        confidence: 'medium',
        suggestion: '培养日常觉察，记录每天的"微小奇迹"'
      });
    }

    return {
      identifiedSources: sources,
      hasAweSources: sources.length > 0,
      primarySource: sources[0] || null,
      recommendation: sources.length > 0 
        ? `你的描述中提到了${sources.map(s => s.name).join('、')}，这些都是常见的敬畏来源。${sources[0].suggestion}`
        : '你的描述中没有明显的敬畏来源关键词。敬畏可以来自很多方面，试试 Awe Walk 或 Noticing Nature 练习来探索你的敬畏触发点。'
    };
  },

  /**
   * 响应用户的敬畏体验描述
   * @param {string} userExperience - 用户描述的敬畏体验
   * @returns {Object} 回应内容
   */
  respondToAweExperience(userExperience) {
    const analysis = this.identifyAweSources(userExperience);
    
    return {
      validation: '听起来这是一次深刻的敬畏体验！敬畏是一种珍贵的情绪，它能扩展我们的视野，连接我们与更大的存在。',
      analysis: analysis,
      reflection: [
        '这次体验中，你感受到的"浩瀚"是什么？是规模、复杂性、美，还是其他？',
        '这次体验是否挑战了你之前的某些理解或假设？',
        '体验之后，你感到自己有什么变化吗？(视角、情绪、行为)',
        '你如何能将这种敬畏感带入日常生活？'
      ],
      suggestions: [
        '考虑将这次体验写下来 (Awe Narrative)，深化记忆和整合',
        '探索类似的敬畏来源，创造更多这样的时刻',
        '与他人分享你的体验，敬畏具有传染性',
        '定期回顾这次体验，让它持续影响你的生活'
      ]
    };
  },

  /**
   * 敬畏体验追踪
   */
  trackAweExperiences() {
    return {
      template: {
        date: 'YYYY-MM-DD',
        source: '敬畏来源 (自然/艺术/知识/人类伟大/精神/日常)',
        description: '体验描述',
        intensity: '1-10 评分',
        bodilySensation: '身体感觉',
        thoughts: '想法变化',
        afterEffect: '体验后的影响',
        smallSelf: '是否感到"小自我" (是/否)',
        timeExpansion: '是否感到时间扩展 (是/否)',
        prosocialUrge: '是否感到更想帮助他人 (是/否)'
      },
      benefits: [
        '追踪帮助你识别个人的敬畏模式',
        '发现哪些来源最容易触发你的敬畏',
        '观察敬畏体验的长期效益',
        '建立敬畏体验的"数据库"，在需要时可以回顾'
      ]
    };
  },

  /**
   * 与正念模块整合
   */
  integrateWithMindfulness() {
    return {
      connection: '敬畏和正念都强调当下觉察和开放性，但敬畏更侧重于"浩瀚"体验',
      integration: [
        '在正念练习中，可以加入对"浩瀚"的觉察 (如觉察呼吸与宇宙的关系)',
        '用正念的开放性来接纳敬畏体验中的"不知道"',
        '敬畏可以深化正念练习的意义感和连接感'
      ],
      combinedPractice: {
        name: '正念敬畏冥想',
        steps: [
          '以正念呼吸开始，安定身心',
          '将注意力扩展到周围环境，觉察空间的浩瀚',
          '想象自己与更大的存在连接 (自然、宇宙、人类)',
          '接纳任何涌现的敬畏感，不评判不执着',
          '以感恩结束，感谢浩瀚中的存在'
        ]
      }
    };
  },

  /**
   * 与叙事心理学模块整合
   */
  integrateWithNarrative() {
    return {
      connection: '敬畏体验常常是生命故事中的"高峰体验"(peak experience)，具有重要的叙事意义',
      integration: [
        '将敬畏体验整合到生命故事中，作为身份认同的一部分',
        '探索敬畏体验如何改变了你的人生方向或价值观',
        '用敬畏体验作为"救赎序列"的转折点'
      ],
      narrativePrompts: [
        '你生命中最深刻的敬畏体验是什么？它如何塑造了今天的你？',
        '有没有一次敬畏体验改变了你对世界的理解？',
        '敬畏体验在你的生命故事中扮演什么角色？'
      ]
    };
  },

  /**
   * 敬畏视频练习 (Awe Video) - v3.48.0 新增
   * 来源：Berkeley Greater Good in Action
   */
  getAweVideoPractice() {
    return {
      name: '敬畏视频 (Awe Video)',
      duration: '4-5 分钟',
      source: 'UC Berkeley Greater Good in Action',
      research: 'Bai et al. (2017) - 观看 4 分钟敬畏视频可快速诱发敬畏体验，降低 IL-6 水平',
      instructions: [
        {
          step: 1,
          title: '准备环境',
          content: '找一个安静的地方，确保不会被干扰。可以戴上耳机获得更好的沉浸体验。'
        },
        {
          step: 2,
          title: '选择视频',
          content: '选择 awe-inspiring 的视频，推荐：',
          suggestions: [
            'Planet Earth 系列 (BBC) - 自然景观',
            '太空纪录片 (Cosmos, The Universe) - 宇宙浩瀚',
            '人类成就纪录片 - 人类伟大',
            '艺术/音乐表演视频 - 艺术之美',
            'GGSC 推荐的 awe 视频合集'
          ]
        },
        {
          step: 3,
          title: '观看方式',
          content: '全身心投入观看，不要 multitask。让视频带你进入浩瀚的体验。'
        },
        {
          step: 4,
          title: '注意身体反应',
          content: '观看时注意：',
          details: [
            '是否有起鸡皮疙瘩？',
            '呼吸是否变深或暂停？',
            '是否感到"小自我"？',
            '是否有好奇或探索的冲动？'
          ]
        },
        {
          step: 5,
          title: '观看后反思',
          content: '视频结束后，花 1 分钟静默，然后问自己：',
          questions: [
            '刚才的体验中，什么最触动我？',
            '我感受到了什么样的"浩瀚"？',
            '我的理解或视角有什么变化吗？',
            '我现在感觉如何？'
          ]
        }
      ],
      tips: [
        '每周观看 1-2 次，保持新鲜感',
        '尝试不同类型的敬畏视频 (自然/宇宙/人类/艺术)',
        '记录每次观看后的感受，追踪模式',
        '与他人一起观看并讨论体验'
      ]
    };
  },

  /**
   * 敬畏效益详细说明 - v3.48.0 增强
   * 来源：Berkeley Greater Good Science Center
   */
  explainAweBenefitsDetailed() {
    return {
      psychological: [
        {
          benefit: '提升幸福感',
          research: 'Gordon et al. (2016) - 体验敬畏的日子，人们报告更高的幸福感和积极情绪 cascade',
          mechanism: '敬畏引发 joy, gratitude, inspiration 等积极情绪的连锁反应',
          practice: '每天记录一次敬畏体验，持续 2 周'
        },
        {
          benefit: '激发好奇心与创造力',
          research: 'Keltner & Haidt (2003) - 敬畏的"需要顺应"特征促进认知灵活性',
          mechanism: '挑战现有框架，鼓励探索性思维，减少对熟悉答案的依赖',
          practice: '在创造性任务前观看敬畏视频'
        },
        {
          benefit: '增强亲社会行为',
          research: 'Piff et al. (2015) - 敬畏体验后，人们更慷慨、更愿意帮助他人，减少 entitlement',
          mechanism: '"小自我"效应 (small self) 减少自我中心，增强与他人/世界的联结感',
          practice: '在需要增强合作或利他行为的情境前诱发敬畏'
        },
        {
          benefit: '扩展时间感知',
          research: 'Rudd et al. (2012) - 敬畏让人感知更多可用时间，减少不耐烦，增加生活满意度',
          mechanism: '浩瀚体验改变时间参照系，当下时刻被"扩展"',
          practice: '感到时间紧迫时，进行 5 分钟敬畏练习'
        },
        {
          benefit: '促进批判性思维',
          research: '敬畏状态下的认知开放性增强，减少确认偏误',
          mechanism: '挑战现有理解，增加信息整合能力',
          practice: '在重要决策前进行敬畏反思'
        }
      ],
      physical: [
        {
          benefit: '降低炎症水平',
          research: 'Bai et al. (2017) - 敬畏倾向高的人 IL-6 (炎症标志物) 水平更低',
          mechanism: '积极情绪调节免疫系统，减少慢性炎症',
          practice: '每周 3 次敬畏练习，持续 8 周'
        },
        {
          benefit: '改善心血管健康',
          research: '降低 IL-6 与降低心血管疾病风险相关',
          mechanism: '炎症减少 → 心血管负担减轻 → 整体健康改善',
          practice: '将敬畏练习纳入日常健康习惯'
        }
      ],
      social: [
        {
          benefit: '增强社会联结',
          research: '敬畏体验增强集体归属感和共同人性感知',
          mechanism: '小自我效应 + 感受到与更大整体的连接',
          practice: '团体敬畏体验 (如集体观看、自然徒步)'
        },
        {
          benefit: '减少自我中心',
          research: '敬畏后人们更少关注个人烦恼，更多关注他人和集体',
          mechanism: '相对浩瀚，个人问题显得较小',
          practice: '在人际冲突后进行敬畏反思'
        }
      ]
    };
  },

  /**
   * 评估敬畏体验的效价 - v3.48.0 新增
   * @param {string} experience - 用户描述的敬畏体验
   * @returns {Object} 效价评估结果
   */
  assessAweValence(experience) {
    const input = experience.toLowerCase();
    
    // 积极敬畏关键词
    const positiveKeywords = ['wonder', 'amazing', 'beautiful', 'inspiring', 'grateful', 'joy', 'love', 'peace', 'connected', 'expanded', 'enlightened', '奇迹', '美丽', '感动', '启发', '感恩', '喜悦', '平静', '连接', '扩展'];
    
    // 消极敬畏关键词
    const negativeKeywords = ['scary', 'threatening', 'fear', 'dread', 'overwhelming', 'powerless', 'anxious', 'terrifying', 'horror', '可怕', '威胁', '恐惧', '无力', '焦虑', '恐怖', '压倒'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveKeywords.forEach(word => {
      if (input.includes(word)) positiveScore++;
    });
    
    negativeKeywords.forEach(word => {
      if (input.includes(word)) negativeScore++;
    });
    
    let valence, description, suggestions;
    
    if (positiveScore > negativeScore && positiveScore > 0) {
      valence = '积极敬畏';
      description = '你的体验主要是积极敬畏，这种体验能带来幸福感、创造力和亲社会行为。';
      suggestions = [
        '记录和回味这次体验，让它持续影响你',
        '探索类似的敬畏来源',
        '与他人分享你的体验'
      ];
    } else if (negativeScore > positiveScore && negativeScore > 0) {
      valence = '消极敬畏';
      description = '你的体验包含消极敬畏的元素 (恐惧、威胁、无力感)。这种体验可能不会带来积极敬畏的效益。';
      suggestions = [
        '承认并接纳你的感受',
        '如果感到 overwhelmed，考虑寻求专业支持',
        '尝试转向积极敬畏来源 (自然美景、艺术、善举)',
        '用正念练习来 grounding'
      ];
    } else {
      valence = '混合/中性';
      description = '你的体验包含混合元素，或者描述中没有明显的效价线索。敬畏可以是复杂的情绪。';
      suggestions = [
        '进一步探索你的感受',
        '注意体验后的长期影响',
        '尝试不同的敬畏来源，观察哪种最适合你'
      ];
    }
    
    return {
      valence,
      positiveScore,
      negativeScore,
      description,
      suggestions,
      note: '敬畏的效价不是非黑即白的。有些体验可能同时包含敬畏和恐惧，这是正常的。'
    };
  },

  /**
   * 敬畏练习合集 - v3.48.0 整理
   */
  getAllPractices() {
    return {
      quick: [
        { name: 'Awe Video', duration: '4-5 分钟', effect: '快速诱发敬畏' },
        { name: 'Noticing Nature', duration: '5 分钟', effect: '日常敬畏培养' },
        { name: 'Beginner\'s Mind', duration: '10 分钟', effect: '打破自动化知觉' }
      ],
      medium: [
        { name: 'Awe Narrative', duration: '15-20 分钟', effect: '深化敬畏记忆和整合' },
        { name: '正念敬畏冥想', duration: '15 分钟', effect: '敬畏与正念整合' }
      ],
      long: [
        { name: 'Awe Walk', duration: '20+ 分钟', effect: '深度敬畏体验' },
        { name: '敬畏体验追踪', duration: '持续练习', effect: '长期敬畏能力培养' }
      ],
      recommendation: '从 quick 练习开始，逐渐尝试 medium 和 long 练习。每周至少 3 次敬畏练习，持续 8 周以获得最佳效果。'
    };
  }
};

module.exports = AwePsychology;
