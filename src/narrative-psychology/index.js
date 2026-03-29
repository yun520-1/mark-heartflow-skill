/**
 * 叙事心理学模块 (Narrative Psychology)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 叙事心理学理论
 * 
 * 核心理论：
 * - 人们通过叙事来理解和组织自己的生活经验
 * - 自我叙事 (self-narrative) 构成身份认同
 * - 叙事整合是心理健康的关键
 * - 生命故事模型 (Life Story Model of Identity)
 * 
 * 可操作技术：
 * - 叙事分析：识别生命故事中的主题、转折点、关键场景
 * - 叙事重构：重新诠释负面经历，寻找成长意义
 * - 生命故事练习：书写个人生命章节
 * - 主题识别：识别反复出现的人生主题
 * 
 * @module narrative-psychology
 */

const NarrativePsychology = {
  /**
   * 模块元信息
   */
  meta: {
    name: '叙事心理学',
    version: '1.0.0',
    source: 'SEP Narrative Psychology',
    description: '基于叙事心理学的自我理解与成长模块'
  },

  /**
   * 叙事分析框架
   * 识别生命故事的核心元素
   */
  narrativeElements: {
    // 关键场景 (Nuclear Scenes)
    nuclearScenes: [
      '高峰体验 (Peak Experience) - 生命中最美好的时刻',
      '低谷体验 (Nadir Experience) - 生命中最艰难的时刻',
      '转折点 (Turning Point) - 改变人生方向的事件',
      '早期记忆 (Earliest Memory) - 塑造自我的最初记忆',
      '重要他人 (Significant Others) - 影响深远的人物',
      '信仰场景 (Religious/Spiritual Scene) - 精神觉醒时刻',
      '道德场景 (Moral Scene) - 道德抉择或觉醒时刻',
      '创伤场景 (Trauma Scene) - 需要整合的痛苦经历'
    ],

    // 叙事主题 (Narrative Themes)
    themes: {
      // 能动性主题 (Agency Themes)
      agency: [
        '自我掌控 (Self-Mastery)',
        '成就达成 (Achievement)',
        '赋权增能 (Empowerment)',
        '独立自主 (Independence)',
        '勇气面对 (Courage)'
      ],
      // 共生主题 (Communion Themes)
      communion: [
        '爱与亲密 (Love/Intimacy)',
        '友谊联结 (Friendship)',
        '归属感 (Belonging)',
        '关怀他人 (Care for Others)',
        '社会贡献 (Social Contribution)'
      ],
      // 救赎主题 (Redemption Themes)
      redemption: [
        '从苦难中成长 (Growth from Suffering)',
        '获得自由 (Liberation)',
        '关系修复 (Relationship Restoration)',
        '信仰重建 (Faith Restoration)',
        '自我接纳 (Self-Acceptance)'
      ],
      // 污染主题 (Contamination Themes)
      contamination: [
        '失去纯真 (Loss of Innocence)',
        '关系破裂 (Relationship Breakdown)',
        '健康恶化 (Health Decline)',
        '理想破灭 (Disillusionment)',
        '自我怀疑 (Self-Doubt)'
      ]
    },

    // 叙事基调 (Narrative Tone)
    tones: [
      '乐观向上 (Optimistic)',
      '悲观消极 (Pessimistic)',
      '中性客观 (Neutral)',
      '复杂矛盾 (Ambivalent)',
      '成长导向 (Growth-Oriented)',
      '创伤导向 (Trauma-Oriented)'
    ],

    // 意识形态 (Ideological Setting)
    ideologies: [
      '个人主义 (Individualism)',
      '集体主义 (Collectivism)',
      '传统主义 (Traditionalism)',
      '进步主义 (Progressivism)',
      '宗教/灵性 (Religious/Spiritual)',
      '世俗人文主义 (Secular Humanism)'
    ],

    // 主人公形象 (Imago)
      imagoes: [
      '英雄 (Hero) - 克服困难的勇士',
      '智者 (Sage) - 寻求真理的思考者',
      '照顾者 (Caregiver) - 关怀他人的守护者',
      '探索者 (Explorer) - 追寻新可能的冒险家',
      '创造者 (Creator) - 创造美好事物的艺术家',
      '改革者 (Reformer) - 改变世界的推动者',
      '普通人 (Everyman) - 平凡生活的普通人'
    ]
  },

  /**
   * 叙事分析练习
   * 引导用户分析自己的生命故事
   */
  exercises: {
    /**
     * 生命章节练习
     * 将生命划分为有意义的章节
     */
    lifeChapters: {
      name: '生命章节',
      description: '将你的生命故事划分为若干有意义的章节，如同书籍的章节',
      steps: [
        '想象你的生命是一本书，目前写到了哪一章？',
        '给每一章起一个有意义的标题',
        '描述每一章的主要情节和主题',
        '识别章节之间的转折点和连续性',
        '思考下一章你希望如何书写'
      ],
      prompts: [
        '你的生命故事目前有多少个章节？',
        '每个章节的标题是什么？（例如："寻找自我"、"爱的旅程"、"职业探索"）',
        '哪个章节对你影响最大？为什么？',
        '章节之间是如何过渡的？有明确的转折点吗？',
        '你希望下一章的标题是什么？你希望这一章发生什么？'
      ]
    },

    /**
     * 关键场景探索
     * 深入探索塑造自我的关键场景
     */
    nuclearScenes: {
      name: '关键场景探索',
      description: '深入探索塑造你生命故事的关键场景',
      scenes: [
        {
          type: '高峰体验',
          prompts: [
            '描述你生命中最美好的时刻之一',
            '当时发生了什么？你在哪里？和谁在一起？',
            '这个经历让你对自己有什么新的认识？',
            '这个高峰体验如何影响了之后的人生选择？'
          ]
        },
        {
          type: '低谷体验',
          prompts: [
            '描述你生命中最艰难的时刻之一',
            '当时你感受到了什么？你是如何应对的？',
            '这段经历给你带来了什么教训或成长？',
            '回头看，这段低谷在你的生命故事中有什么意义？'
          ]
        },
        {
          type: '转折点',
          prompts: [
            '描述一个改变你人生方向的决定或事件',
            '是什么促使你做出这个改变？',
            '如果没有这个转折，你的人生会有什么不同？',
            '这个转折如何塑造了现在的你？'
          ]
        }
      ]
    },

    /**
     * 主题识别练习
     * 识别生命故事中反复出现的主题
     */
    themeIdentification: {
      name: '主题识别',
      description: '识别你生命故事中反复出现的主题和模式',
      steps: [
        '回顾你的生命章节和关键场景',
        '识别反复出现的情感主题（如：爱、失去、成长、自由）',
        '识别反复出现的行为模式（如：帮助他人、追求成就、寻求安全）',
        '思考这些主题如何塑造了你的身份认同',
        '哪些主题你想继续强化？哪些想改变？'
      ],
      questions: [
        '你的生命故事中反复出现哪些主题？',
        '这些主题是更多关于"能动性"（成就、掌控）还是"共生"（爱、联结）？',
        '你的故事更多是"救赎"叙事（从苦难到成长）还是"污染"叙事（从美好到失去）？',
        '你希望未来强化哪些主题？'
      ]
    },

    /**
     * 叙事重构练习
     * 重新诠释负面经历，寻找成长意义
     */
    narrativeReconstruction: {
      name: '叙事重构',
      description: '重新诠释困难经历，发现其中的成长和意义',
      steps: [
        '选择一个你想要重新理解的困难经历',
        '写下你目前对这个经历的理解和感受',
        '寻找这个经历中的"救赎元素"：你学到了什么？成长了什么？',
        '思考这个经历如何让你成为更好的人',
        '用新的视角重写这个故事的结尾'
      ],
      reframingPrompts: [
        '这个经历让你学到了什么以前不知道的事情？',
        '它如何让你变得更坚强、更有智慧或更有同情心？',
        '如果没有这段经历，你会失去什么重要的东西？',
        '你如何用这段经历帮助或理解他人？',
        '五年后回头看，这个经历的意义可能是什么？'
      ]
    },

    /**
     * 主人公形象探索
     * 探索自己在生命故事中扮演的角色
     */
    imagoExploration: {
      name: '主人公形象',
      description: '探索你在自己生命故事中扮演的主人公形象',
      imagoes: [
        '英雄：克服困难的勇士',
        '智者：寻求真理的思考者',
        '照顾者：关怀他人的守护者',
        '探索者：追寻新可能的冒险家',
        '创造者：创造美好事物的艺术家',
        '改革者：改变世界的推动者',
        '普通人：平凡生活的普通人'
      ],
      prompts: [
        '在你的生命故事中，你主要扮演什么角色？',
        '这个角色如何影响你的选择和行动？',
        '你希望继续扮演这个角色吗？为什么？',
        '有没有其他角色你也想探索？'
      ]
    }
  },

  /**
   * 叙事分析工具
   * 分析用户叙事的特征
   */
  analysisTools: {
    /**
     * 分析叙事基调
     */
    analyzeTone: function(narrative) {
      const positiveWords = ['成长', '爱', '希望', '美好', '幸福', '成功', '感恩', '喜悦', '平静', '满足'];
      const negativeWords = ['痛苦', '失去', '悲伤', '愤怒', '恐惧', '绝望', '遗憾', '失败', '孤独', '焦虑'];
      const growthWords = ['学习', '改变', '成长', '理解', '接受', '超越', '转化', '觉醒', '领悟', '成熟'];

      let positiveCount = 0;
      let negativeCount = 0;
      let growthCount = 0;

      positiveWords.forEach(word => {
        if (narrative.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (narrative.includes(word)) negativeCount++;
      });
      growthWords.forEach(word => {
        if (narrative.includes(word)) growthCount++;
      });

      const tone = {
        positive: positiveCount,
        negative: negativeCount,
        growth: growthCount,
        overall: growthCount > negativeCount ? '成长导向' : (positiveCount > negativeCount ? '积极' : '需要支持')
      };

      return tone;
    },

    /**
     * 识别叙事主题
     */
    identifyThemes: function(narrative) {
      const themes = {
        agency: ['自己', '决定', '选择', '控制', '目标', '成就', '独立', '力量', '勇气', '成功'],
        communion: ['爱', '关系', '朋友', '家人', '帮助', '关心', '联结', '归属', '分享', '支持'],
        redemption: ['成长', '学习', '转变', '希望', '重生', '救赎', '超越', '意义', '价值', '领悟'],
        contamination: ['失去', '伤害', '背叛', '失望', '破碎', '结束', '分离', '失败', '遗憾', '痛苦']
      };

      const scores = { agency: 0, communion: 0, redemption: 0, contamination: 0 };

      Object.keys(themes).forEach(theme => {
        themes[theme].forEach(word => {
          if (narrative.includes(word)) scores[theme]++;
        });
      });

      return scores;
    },

    /**
     * 生成叙事反馈
     */
    generateFeedback: function(analysis) {
      const feedback = [];

      // 基调反馈
      if (analysis.tone.overall === '成长导向') {
        feedback.push('✨ 你的叙事展现出强烈的成长导向，这是一个非常健康的心理特征。');
      } else if (analysis.tone.overall === '积极') {
        feedback.push('😊 你的叙事整体积极向上，这有助于维持良好的心理状态。');
      } else {
        feedback.push('💙 我注意到你的叙事中有一些困难的元素，这是完全可以理解的。');
      }

      // 主题反馈
      if (analysis.themes.agency > analysis.themes.communion) {
        feedback.push('🎯 你的故事更多关注个人成就和自主性，这是很好的力量来源。');
      } else if (analysis.themes.communion > analysis.themes.agency) {
        feedback.push('❤️ 你的故事更多关注关系和联结，这表明你重视与他人的联系。');
      }

      if (analysis.themes.redemption > analysis.themes.contamination) {
        feedback.push('🌱 你善于从困难经历中寻找成长和意义，这是心理韧性的重要体现。');
      } else if (analysis.themes.contamination > analysis.themes.redemption) {
        feedback.push('🌧️ 我注意到你经历了一些困难，也许我们可以一起探索如何从中发现成长的可能。');
      }

      return feedback.join('\n\n');
    }
  },

  /**
   * 与用户交互的主函数
   */
  interact: function(userInput, context = {}) {
    const response = {
      module: '叙事心理学',
      understanding: '',
      guidance: '',
      exercise: null,
      feedback: ''
    };

    // 检测用户意图
    const input = userInput.toLowerCase();

    if (input.includes('生命') || input.includes('故事') || input.includes('章节')) {
      response.understanding = '你想探索自己的生命故事，这是认识自我的重要方式。';
      response.exercise = this.exercises.lifeChapters;
      response.guidance = '让我们一起探索你的生命故事。想象你的生命是一本书，你想如何描述它的章节？';
    } else if (input.includes('困难') || input.includes('痛苦') || input.includes('挫折')) {
      response.understanding = '你正在经历一些困难的时刻，我想陪你一起探索这段经历的意义。';
      response.exercise = this.exercises.narrativeReconstruction;
      response.guidance = '困难的经历往往蕴含着成长的种子。让我们一起探索这段经历可能带来的意义。';
    } else if (input.includes('主题') || input.includes('模式') || input.includes('反复')) {
      response.understanding = '你想识别生命中的主题和模式，这是自我觉察的重要一步。';
      response.exercise = this.exercises.themeIdentification;
      response.guidance = '让我们回顾你的生命故事，看看有哪些主题一直在其中回响。';
    } else {
      response.understanding = '叙事心理学帮助我们通过故事来理解自己的生活。';
      response.guidance = '你可以：\n1. 探索生命章节\n2. 探索关键场景\n3. 识别生命主题\n4. 重构困难经历\n\n你想从哪个开始？';
    }

    return response;
  },

  /**
   * 导出模块
   */
  export: function() {
    return {
      meta: this.meta,
      exercises: Object.keys(this.exercises),
      interact: this.interact.bind(this),
      analyzeTone: this.analysisTools.analyzeTone,
      identifyThemes: this.analysisTools.identifyThemes
    };
  }
};

module.exports = NarrativePsychology;
