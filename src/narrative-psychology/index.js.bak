/**
 * 叙事心理学模块 (Narrative Psychology)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 叙事心理学理论
 * 及 McAdams 生命故事模型 (Life Story Model of Identity)
 * 
 * 核心理论：
 * - 人们通过叙事来理解和组织自己的生活经验
 * - 自我叙事 (self-narrative) 构成身份认同
 * - 叙事整合是心理健康的关键
 * - 生命故事模型 (Life Story Model of Identity)
 * - 自传体推理 (Autobiographical Reasoning)
 * - 救赎与污染序列 (Redemption & Contamination Sequences)
 * 
 * 可操作技术：
 * - 叙事分析：识别生命故事中的主题、转折点、关键场景
 * - 叙事重构：重新诠释负面经历，寻找成长意义
 * - 生命故事练习：书写个人生命章节
 * - 主题识别：识别反复出现的人生主题
 * - 生命故事访谈 (Life Story Interview)
 * - 自传体推理分析
 * 
 * @module narrative-psychology
 * @version 3.36.0
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

  /**
   * 生命故事访谈框架 (Life Story Interview Framework)
   * 基于 McAdams 的完整访谈协议
   */
  lifeStoryInterview: {
    /**
     * 访谈部分列表
     */
    parts: [
      {
        id: 1,
        name: '生命章节',
        description: '将生命故事划分为有意义的章节',
        prompts: [
          '想象你的生命是一本书，目前写到了哪一章？',
          '给每一章起一个有意义的标题（3-7 章）',
          '描述每一章的主要情节和主题',
          '章节之间是如何过渡的？有明确的转折点吗？',
          '哪一章对你影响最大？为什么？'
        ]
      },
      {
        id: 2,
        name: '高峰体验',
        description: '生命中最美好的时刻',
        prompts: [
          '描述你生命中最美好的时刻之一',
          '当时发生了什么？你在哪里？和谁在一起？',
          '你感受到了什么？这个经历让你对自己有什么新的认识？',
          '这个高峰体验如何影响了之后的人生选择？'
        ]
      },
      {
        id: 3,
        name: '低谷体验',
        description: '生命中最艰难的时刻',
        prompts: [
          '描述你生命中最艰难的时刻之一',
          '当时你感受到了什么？你是如何应对的？',
          '这段经历给你带来了什么教训或成长？',
          '回头看，这段低谷在你的生命故事中有什么意义？'
        ]
      },
      {
        id: 4,
        name: '转折点',
        description: '改变人生方向的事件',
        prompts: [
          '描述一个改变你人生方向的决定或事件',
          '是什么促使你做出这个改变？',
          '如果没有这个转折，你的人生会有什么不同？',
          '这个转折如何塑造了现在的你？'
        ]
      },
      {
        id: 5,
        name: '早期记忆',
        description: '塑造自我的最初记忆',
        prompts: [
          '描述你能记得的最早的记忆',
          '这个记忆中有什么特别重要的元素？',
          '这个早期记忆如何反映了你的核心特质？',
          '回头看，这个记忆对你的发展有什么影响？'
        ]
      },
      {
        id: 6,
        name: '重要他人',
        description: '影响深远的人物',
        prompts: [
          '描述一个对你生命影响最大的人',
          '这个人如何影响了你？',
          '你从他/她身上学到了什么？',
          '这段关系如何塑造了现在的你？'
        ]
      },
      {
        id: 7,
        name: '信仰场景',
        description: '精神觉醒或价值观形成的时刻',
        prompts: [
          '描述一个你的信仰或价值观发生重大变化的时刻',
          '是什么促成了这个变化？',
          '这个变化如何影响了你的生活方向？',
          '你现在持有的核心信念是什么？'
        ]
      },
      {
        id: 8,
        name: '道德场景',
        description: '道德抉择或觉醒时刻',
        prompts: [
          '描述一个你面临重大道德选择的时刻',
          '你是如何做出决定的？',
          '这个选择反映了你的什么价值观？',
          '这个经历如何影响了你的道德观？'
        ]
      },
      {
        id: 9,
        name: '生命主题',
        description: '识别反复出现的主线',
        prompts: [
          '回顾你的生命故事，有哪些主题反复出现？',
          '这些主题更多关于"能动性"（成就、掌控）还是"共生"（爱、联结）？',
          '你的故事更多是"救赎"叙事还是"污染"叙事？',
          '你希望未来强化哪些主题？'
        ]
      },
      {
        id: 10,
        name: '未来脚本',
        description: '对未来的预期和计划',
        prompts: [
          '想象 5 年后的你，他/她会是什么样子？',
          '你希望完成什么样的故事？',
          '什么目标对你最重要？',
          '你希望如何被记住？'
        ]
      }
    ],

    /**
     * 执行完整访谈
     */
    conduct: function() {
      return {
        parts: this.parts,
        instructions: '请按顺序回答每个部分的问题，不需要一次完成。可以分多次进行。',
        estimatedTime: '60-90 分钟（可分次完成）',
        format: '书面或口头回答均可'
      };
    },

    /**
     * 分析访谈结果
     */
    analyze: function(responses) {
      const analysis = {
        chapters: this._analyzeChapters(responses.chapters),
        keyScenes: this._analyzeKeyScenes(responses),
        themes: this._analyzeThemes(responses),
        imago: this._identifyImago(responses),
        coherence: this._assessCoherence(responses),
        redemptionContamination: this._analyzeRedemptionContamination(responses)
      };
      return analysis;
    },

    _analyzeChapters: function(chapters) {
      if (!chapters) return null;
      return {
        count: chapters.length || 0,
        titles: chapters.map(c => c.title),
        dominantTone: chapters.reduce((acc, c) => {
          if (c.tone) acc[c.tone] = (acc[c.tone] || 0) + 1;
          return acc;
        }, {})
      };
    },

    _analyzeKeyScenes: function(responses) {
      const scenes = [];
      if (responses.peakExperience) scenes.push({ type: '高峰体验', content: responses.peakExperience });
      if (responses.nadirExperience) scenes.push({ type: '低谷体验', content: responses.nadirExperience });
      if (responses.turningPoint) scenes.push({ type: '转折点', content: responses.turningPoint });
      return scenes;
    },

    _analyzeThemes: function(responses) {
      const themes = { agency: 0, communion: 0, redemption: 0, contamination: 0 };
      const text = JSON.stringify(responses).toLowerCase();
      
      const agencyWords = ['自己', '决定', '选择', '控制', '目标', '成就', '独立', '力量'];
      const communionWords = ['爱', '关系', '朋友', '家人', '帮助', '关心', '联结', '支持'];
      const redemptionWords = ['成长', '学习', '转变', '希望', '重生', '超越', '意义'];
      const contaminationWords = ['失去', '伤害', '背叛', '失望', '破碎', '结束', '遗憾'];

      agencyWords.forEach(w => { if (text.includes(w)) themes.agency++; });
      communionWords.forEach(w => { if (text.includes(w)) themes.communion++; });
      redemptionWords.forEach(w => { if (text.includes(w)) themes.redemption++; });
      contaminationWords.forEach(w => { if (text.includes(w)) themes.contamination++; });

      return themes;
    },

    _identifyImago: function(responses) {
      const imagoes = [
        '英雄', '智者', '照顾者', '探索者', '创造者', '改革者', '普通人'
      ];
      // 简化的识别逻辑
      return imagoes[Math.floor(Math.random() * imagoes.length)];
    },

    _assessCoherence: function(responses) {
      // 评估故事连贯性
      const hasChapters = responses.chapters && responses.chapters.length > 0;
      const hasKeyScenes = responses.peakExperience || responses.nadirExperience || responses.turningPoint;
      const hasThemes = responses.themes;
      const hasFuture = responses.futureScript;

      let score = 0;
      if (hasChapters) score += 2;
      if (hasKeyScenes) score += 2;
      if (hasThemes) score += 2;
      if (hasFuture) score += 2;

      return {
        score: score / 8,
        level: score >= 6 ? '高连贯性' : score >= 4 ? '中等连贯性' : '需要整合'
      };
    },

    _analyzeRedemptionContamination: function(responses) {
      const text = JSON.stringify(responses).toLowerCase();
      const redemptionCount = ['成长', '学习', '转变', '希望', '超越'].filter(w => text.includes(w)).length;
      const contaminationCount = ['失去', '伤害', '背叛', '失望', '破碎'].filter(w => text.includes(w)).length;
      
      return {
        redemption: redemptionCount,
        contamination: contaminationCount,
        ratio: contaminationCount > 0 ? (redemptionCount / contaminationCount).toFixed(2) : redemptionCount,
        pattern: redemptionCount > contaminationCount ? '救赎导向' : contaminationCount > redemptionCount ? '污染导向' : '平衡'
      };
    }
  },

  /**
   * 自传体推理工具 (Autobiographical Reasoning Tools)
   */
  autobiographicalReasoning: {
    /**
     * 推理类型定义
     */
    reasoningTypes: {
      CAUSAL: {
        name: '因果连接',
        description: '解释过去事件如何导致当前状态',
        example: '因为那次失败，我现在更谨慎了',
        keywords: ['因为', '所以', '导致', '因此', '使得', '造成']
      },
      THEMATIC: {
        name: '主题连接',
        description: '识别跨时间的主题连续性',
        example: '我一直都在追求自由',
        keywords: ['一直', '总是', '从来', '继续', '保持', '仍然']
      },
      GROWTH: {
        name: '成长叙事',
        description: '从过去到现在的积极变化',
        example: '我比以前更成熟了',
        keywords: ['成长', '进步', '改善', '变得', '学会', '发展']
      },
      REDEMPTION: {
        name: '救赎叙事',
        description: '从负面到正面的转化',
        example: '那段痛苦让我变得更坚强',
        keywords: ['虽然', '但是', '然而', '转化', '超越', '重生']
      }
    },

    /**
     * 分析自传体推理
     */
    analyze: function(narrative) {
      const analysis = {
        narrative,
        types: {},
        complexity: 0,
        dominantType: null
      };

      Object.entries(this.reasoningTypes).forEach(([type, info]) => {
        const count = info.keywords.filter(kw => narrative.includes(kw)).length;
        analysis.types[type] = {
          name: info.name,
          detected: count > 0,
          count
        };
        if (count > 0) analysis.complexity++;
      });

      // 确定主导类型
      const maxCount = Math.max(...Object.values(analysis.types).map(t => t.count));
      if (maxCount > 0) {
        analysis.dominantType = Object.entries(analysis.types)
          .find(([_, v]) => v.count === maxCount)[0];
      }

      return analysis;
    },

    /**
     * 评估推理复杂性
     */
    assessComplexity: function(analysis) {
      const score = analysis.complexity;
      return {
        score,
        level: score >= 3 ? '高复杂性' : score >= 2 ? '中等复杂性' : '低复杂性',
        description: score >= 3 
          ? '叙事展现了多维度的自传体推理，显示了深度的自我反思能力'
          : score >= 2
          ? '叙事有一定的自传体推理，可以进一步发展'
          : '叙事中的自传体推理较少，可以尝试建立更多过去与现在的连接'
      };
    },

    /**
     * 评估连贯性
     */
    assessCoherence: function(narrative) {
      const coherenceIndicators = [
        '时间连接词', // 然后、之后、后来
        '因果连接词', // 因为、所以、导致
        '对比连接词', // 但是、然而、虽然
        '总结词' // 总之、总的来说、最终
      ];

      const connectors = {
        temporal: ['然后', '之后', '后来', '接着', '随后', '当时', '现在'],
        causal: ['因为', '所以', '导致', '因此', '使得', '造成'],
        contrast: ['但是', '然而', '虽然', '尽管', '却', '反而'],
        summary: ['总之', '总的来说', '最终', '最后', '结果']
      };

      const scores = { temporal: 0, causal: 0, contrast: 0, summary: 0 };
      Object.entries(connectors).forEach(([type, words]) => {
        words.forEach(w => { if (narrative.includes(w)) scores[type]++; });
      });

      const total = Object.values(scores).reduce((a, b) => a + b, 0);
      return {
        score: total,
        level: total >= 8 ? '高连贯性' : total >= 4 ? '中等连贯性' : '低连贯性',
        breakdown: scores
      };
    }
  },

  /**
   * 叙事与幸福感评估 (Narrative & Wellbeing Assessment)
   */
  wellbeing: {
    /**
     * 基于叙事评估幸福感
     */
    assessFromNarrative: function(narrative) {
      const analysis = {
        redemption: 0,
        contamination: 0,
        agency: 0,
        communion: 0,
        coherence: 0,
        futureOrientation: 0
      };

      const text = narrative.toLowerCase();
      
      // 救赎/污染
      ['成长', '学习', '转变', '希望', '超越', '重生', '意义'].forEach(w => {
        if (text.includes(w)) analysis.redemption++;
      });
      ['失去', '伤害', '背叛', '失望', '破碎', '遗憾', '痛苦'].forEach(w => {
        if (text.includes(w)) analysis.contamination++;
      });

      // 能动性/共生
      ['自己', '决定', '选择', '控制', '目标', '成就', '独立'].forEach(w => {
        if (text.includes(w)) analysis.agency++;
      });
      ['爱', '关系', '朋友', '家人', '帮助', '关心', '联结'].forEach(w => {
        if (text.includes(w)) analysis.communion++;
      });

      // 连贯性
      ['然后', '因为', '所以', '但是', '总之', '最终'].forEach(w => {
        if (text.includes(w)) analysis.coherence++;
      });

      // 未来导向
      ['希望', '计划', '期待', '未来', '想要', '目标', '梦想'].forEach(w => {
        if (text.includes(w)) analysis.futureOrientation++;
      });

      // 计算幸福感指标
      const wellbeingScore = (
        (analysis.redemption - analysis.contamination) * 2 +
        Math.max(analysis.agency, analysis.communion) +
        analysis.coherence +
        analysis.futureOrientation
      ) / 10;

      return {
        scores: analysis,
        wellbeingScore: Math.max(0, Math.min(10, wellbeingScore)).toFixed(1),
        level: wellbeingScore >= 7 ? '高幸福感' : wellbeingScore >= 4 ? '中等幸福感' : '需要支持',
        insights: this._generateWellbeingInsights(analysis)
      };
    },

    _generateWellbeingInsights: function(scores) {
      const insights = [];
      
      if (scores.redemption > scores.contamination) {
        insights.push('✨ 你的叙事展现了救赎倾向，善于从困难中发现成长意义。');
      } else if (scores.contamination > scores.redemption) {
        insights.push('💙 你经历了一些困难，尝试寻找其中的成长可能可能会帮助到你。');
      }

      if (scores.agency > scores.communion) {
        insights.push('🎯 你的叙事强调个人能动性，这是力量的重要来源。');
      } else if (scores.communion > scores.agency) {
        insights.push('❤️ 你的叙事强调关系联结，这表明你重视与他人的联系。');
      }

      if (scores.futureOrientation < 2) {
        insights.push('🔮 可以尝试更多展望积极的未来，这有助于提升幸福感。');
      }

      return insights;
    },

    /**
     * 推荐叙事干预
     */
    recommendInterventions: function(assessment) {
      const interventions = [];

      if (assessment.scores.contamination > assessment.scores.redemption) {
        interventions.push({
          type: '救赎重写',
          description: '重新诠释困难经历，寻找成长意义',
          exercise: '选择一个困难经历，写下它带给你的 3 个成长或收获'
        });
      }

      if (assessment.scores.coherence < 3) {
        interventions.push({
          type: '连贯性建设',
          description: '建立生命故事的连续性',
          exercise: '尝试用"因为...所以..."的句式连接过去和现在'
        });
      }

      if (assessment.scores.futureOrientation < 3) {
        interventions.push({
          type: '未来脚本构建',
          description: '创建积极的未来预期',
          exercise: '想象 1 年后的理想生活，写下具体细节'
        });
      }

      return interventions;
    }
  },

  /**
   * 文化叙事分析 (Cultural Narrative Analysis)
   */
  cultural: {
    /**
     * 文化叙事模式
     */
    patterns: {
      INDIVIDUALIST: {
        name: '个人主义叙事',
        characteristics: [
          '强调个人成就和自主性',
          '英雄叙事常见',
          '线性时间观',
          '自我实现主题',
          '独特性和差异化'
        ],
        keywords: ['我', '自己', '个人', '独特', '成就', '独立', '自由', '选择']
      },
      COLLECTIVIST: {
        name: '集体主义叙事',
        characteristics: [
          '强调关系和责任',
          '家庭/群体叙事常见',
          '循环时间观',
          '和谐主题',
          '归属感和连接'
        ],
        keywords: ['我们', '家庭', '集体', '责任', '和谐', '关系', '义务', '传统']
      }
    },

    /**
     * 分析文化叙事模式
     */
    analyzeCulturalPattern: function(narrative) {
      const text = narrative.toLowerCase();
      
      const individualistScore = this.patterns.INDIVIDUALIST.keywords
        .filter(kw => text.includes(kw)).length;
      const collectivistScore = this.patterns.COLLECTIVIST.keywords
        .filter(kw => text.includes(kw)).length;

      let pattern = '平衡';
      if (individualistScore > collectivistScore * 1.5) pattern = '个人主义倾向';
      else if (collectivistScore > individualistScore * 1.5) pattern = '集体主义倾向';

      return {
        scores: {
          individualist: individualistScore,
          collectivist: collectivistScore
        },
        pattern,
        characteristics: pattern === '个人主义倾向' 
          ? this.patterns.INDIVIDUALIST.characteristics
          : pattern === '集体主义倾向'
          ? this.patterns.COLLECTIVIST.characteristics
          : ['个人与集体元素平衡', '灵活的叙事风格'],
        insight: pattern === '平衡'
          ? '你的叙事融合了个人和集体元素，这是文化整合的表现。'
          : pattern === '个人主义倾向'
          ? '你的叙事强调个人自主性和成就，这是个人主义文化的特征。'
          : '你的叙事强调关系和责任，这是集体主义文化的特征。'
      };
    }
  },

module.exports = NarrativePsychology;
