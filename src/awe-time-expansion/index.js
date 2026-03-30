/**
 * 敬畏 - 时间扩展模块 v5.0.1 (Awe Time Expansion)
 * 
 * 整合敬畏心理学与时间意识研究
 * 
 * 核心理论来源:
 * - Rudd, M., Vohs, K. D., & Aaker, J. (2012). Awe Expands Time and Increases Well-Being. Psychological Science.
 * - Keltner, D. & Haidt, J. (2003). Approaching awe, a moral, spiritual, and aesthetic emotion.
 * - Piff, P. et al. (2015). Awe, the small self, and prosocial behavior.
 * - SEP Temporal Consciousness
 * - SEP Awe and Wonder
 * 
 * 核心发现:
 * 1. 敬畏体验扩展时间感知 (Awe expands perceived time)
 * 2. 敬畏产生"小自我"效应 (Small self effect)
 * 3. 敬畏增强亲社会行为 (Prosocial behavior)
 * 4. 敬畏提升幸福感与生命意义感
 * 5. 敬畏降低炎症标志物 IL-6 (Bai et al., 2017)
 * 
 * 敬畏的两大核心特征:
 * - Perceived Vastness (感知浩瀚): 体验到超越日常经验尺度的事物
 * - Need for Accommodation (需要顺应): 现有认知框架无法完全理解，需要调整
 * 
 * 敬畏 - 时间扩展机制:
 * - 注意力吸收：敬畏吸引全部注意力，减少时间压力感
 * - 当下临在：敬畏将人带入深度临在状态，扩展"现在"的厚度
 * - 自我缩小：小自我效应减少自我关注，释放心理时间资源
 * - 意义增强：敬畏增强意义感，使时间显得更"充实"
 * 
 * @version 5.0.1 (HeartFlow v5.0.1)
 * @author HeartFlow Team
 */

/**
 * 敬畏 - 时间扩展效应评估
 */
const AweTimeExpansion = {
  /**
   * 模块元数据
   */
  metadata: {
    name: '敬畏 - 时间扩展',
    version: '5.0.1',
    theory: 'Awe Psychology + Temporal Consciousness Integration',
    heartFlowVersion: 'v5.0.1',
    keyResearch: [
      'Rudd et al. (2012) - Awe Expands Time',
      'Keltner & Haidt (2003) - Awe Definition',
      'Piff et al. (2015) - Small Self Effect',
      'Bai et al. (2017) - Awe and IL-6'
    ]
  },

  /**
   * 敬畏诱发刺激分类
   */
  aweInducers: {
    nature: {
      category: '自然敬畏',
      examples: [
        '星空观测',
        '大峡谷/壮阔景观',
        '海洋/瀑布',
        '古老森林',
        '日出日落',
        '极光',
        '雷暴'
      ],
      timeExpansionEffect: 0.85,
      accessibility: '中等'
    },
    art: {
      category: '艺术敬畏',
      examples: [
        '宏伟建筑 (大教堂、寺庙)',
        '大型雕塑',
        '交响乐现场',
        '史诗电影',
        '震撼摄影展'
      ],
      timeExpansionEffect: 0.75,
      accessibility: '高'
    },
    knowledge: {
      category: '知识敬畏',
      examples: [
        '理解宇宙尺度',
        '学习深奥理论',
        '见证科学发现',
        '阅读伟大著作',
        '理解进化历程'
      ],
      timeExpansionEffect: 0.70,
      accessibility: '高'
    },
    social: {
      category: '社会敬畏',
      examples: [
        '见证极端善良',
        '集体仪式体验',
        '大规模合作',
        '英雄行为',
        '代际传承'
      ],
      timeExpansionEffect: 0.65,
      accessibility: '中等'
    },
    spiritual: {
      category: '精神敬畏',
      examples: [
        '冥想深度体验',
        '神秘体验',
        '超越性觉察',
        '合一感',
        '神圣感'
      ],
      timeExpansionEffect: 0.90,
      accessibility: '低'
    }
  },

  /**
   * 敬畏 - 时间扩展评估量表
   * 基于 Rudd et al. (2012) 研究
   */
  assessmentScale: {
    /**
     * 评估敬畏体验的时间扩展效应
     */
    assessTimeExpansion(aweExperience) {
      const dimensions = {
        perceivedVastness: 0,
        needForAccommodation: 0,
        smallSelf: 0,
        timePerception: 0,
        presence: 0
      };

      // 评估感知浩瀚
      if (aweExperience.includes('浩瀚') || aweExperience.includes('宏大') || aweExperience.includes('壮阔')) {
        dimensions.perceivedVastness += 2;
      }
      if (aweExperience.includes('渺小') || aweExperience.includes('微小')) {
        dimensions.perceivedVastness += 1;
        dimensions.smallSelf += 2;
      }

      // 评估需要顺应
      if (aweExperience.includes('震撼') || aweExperience.includes('冲击')) {
        dimensions.needForAccommodation += 2;
      }
      if (aweExperience.includes('无法形容') || aweExperience.includes('难以理解')) {
        dimensions.needForAccommodation += 1;
      }

      // 评估时间感知
      if (aweExperience.includes('时间变慢') || aweExperience.includes('时间停止')) {
        dimensions.timePerception += 3;
      }
      if (aweExperience.includes('永恒') || aweExperience.includes('timeless')) {
        dimensions.timePerception += 2;
      }
      if (aweExperience.includes('当下') || aweExperience.includes('此刻')) {
        dimensions.timePerception += 1;
        dimensions.presence += 2;
      }

      // 评估临在感
      if (aweExperience.includes('沉浸') || aweExperience.includes('融入')) {
        dimensions.presence += 2;
      }
      if (aweExperience.includes('忘记时间') || aweExperience.includes('时间飞逝')) {
        dimensions.presence += 1;
      }

      // 计算总分
      const totalScore = Object.values(dimensions).reduce((sum, val) => sum + val, 0);
      const maxScore = 15;
      const expansionLevel = totalScore / maxScore;

      return {
        dimensions,
        totalScore,
        maxScore,
        expansionLevel,
        interpretation: this.interpretExpansionLevel(expansionLevel),
        recommendations: this.generateRecommendations(expansionLevel, dimensions)
      };
    },

    /**
     * 解释时间扩展水平
     */
    interpretExpansionLevel(level) {
      if (level >= 0.8) {
        return {
          level: '极强',
          description: '您的敬畏体验显示出极强的时间扩展效应。时间感知显著改变，可能体验到"时间停止"或"永恒当下"。',
          benefit: '深度临在、意义感增强、自我关注减少'
        };
      } else if (level >= 0.6) {
        return {
          level: '强',
          description: '您的敬畏体验显示出显著的时间扩展效应。时间感知明显放缓，当下感增强。',
          benefit: '压力减少、幸福感提升、亲社会倾向增强'
        };
      } else if (level >= 0.4) {
        return {
          level: '中等',
          description: '您的敬畏体验显示出适度的时间扩展效应。有轻微的时间感知变化。',
          benefit: '短暂放松、注意力集中'
        };
      } else {
        return {
          level: '轻微',
          description: '您的敬畏体验时间扩展效应较弱。可能需要更强的敬畏诱发刺激。',
          benefit: '轻微愉悦感'
        };
      }
    },

    /**
     * 生成个性化建议
     */
    generateRecommendations(expansionLevel, dimensions) {
      const recommendations = [];

      // 基于感知浩瀚的建议
      if (dimensions.perceivedVastness < 2) {
        recommendations.push({
          area: '感知浩瀚',
          suggestion: '尝试接触更大尺度的事物：观星、参观大峡谷、阅读宇宙学书籍',
          practice: '每周安排一次"浩瀚体验"'
        });
      }

      // 基于小自我的建议
      if (dimensions.smallSelf < 2) {
        recommendations.push({
          area: '小自我效应',
          suggestion: '练习"自我缩小"冥想：想象自己在宇宙中的位置，感受自己的渺小',
          practice: '每日 5 分钟宇宙视角冥想'
        });
      }

      // 基于时间感知的建议
      if (dimensions.timePerception < 2) {
        recommendations.push({
          area: '时间感知',
          suggestion: '在敬畏体验中刻意注意时间感知：问自己"时间感觉如何？"',
          practice: '敬畏体验时进行时间感知检查'
        });
      }

      // 基于临在感的建议
      if (dimensions.presence < 2) {
        recommendations.push({
          area: '临在感',
          suggestion: '练习正念临在：完全投入当下体验，不加评判',
          practice: '每日 10 分钟正念冥想'
        });
      }

      // 总体建议
      if (expansionLevel >= 0.6) {
        recommendations.push({
          area: '维持与深化',
          suggestion: '您已经体验到显著的敬畏 - 时间扩展效应。尝试定期接触敬畏刺激，维持这个状态。',
          practice: '建立"敬畏习惯"'
        });
      }

      return recommendations;
    }
  },

  /**
   * 敬畏 - 时间扩展练习
   */
  practices: {
    /**
     * 敬畏散步 (Awe Walk)
     * 基于 UC Berkeley Greater Good Science Center
     */
    aweWalk() {
      return {
        name: '敬畏散步',
        duration: '20-30 分钟',
        theory: 'Berkeley GGSC + Rudd et al. (2012)',
        timeExpansionEffect: '中等到强',
        steps: [
          {
            phase: '准备',
            duration: '2 分钟',
            instruction: '选择一个有自然或建筑景观的路线。放下手机，准备全然体验。设定意图：今天我要寻找敬畏。'
          },
          {
            phase: '小自我启动',
            duration: '3 分钟',
            instruction: '开始时，停下来，抬头看天空。想象地球的尺度，你在宇宙中的位置。感受自己的渺小——这不是贬低，而是解放。',
            inquiry: '在宇宙尺度下，你的问题显得如何？'
          },
          {
            phase: '敬畏搜寻',
            duration: '15 分钟',
            instruction: '边走边寻找能引发敬畏的事物——一片叶子的纹理、一棵大树的壮丽、阳光的折射、建筑的美感。当你找到时，停下来，完全体验它。',
            prompts: [
              '这个事物有什么浩瀚之处？',
              '它挑战了你的什么认知？',
              '此刻时间感觉如何？'
            ]
          },
          {
            phase: '时间感知检查',
            duration: '3 分钟',
            instruction: '停下来，问自己：时间感觉如何？是变快了？变慢了？停止了？注意敬畏如何改变你的时间感知。',
            inquiry: '敬畏如何扩展了你的"现在"？'
          },
          {
            phase: '整合',
            duration: '2 分钟',
            instruction: '结束散步前，感谢这次体验。注意身体的感觉、情绪的状态。带着这个扩展的时间感回到日常。',
            reflection: '这次敬畏散步如何改变了你的时间感？'
          }
        ],
        benefits: [
          '时间感知扩展',
          '压力减少',
          '幸福感提升',
          '亲社会倾向增强',
          '创造力激发'
        ]
      };
    },

    /**
     * 星空冥想 (Stargazing Meditation)
     * 最强敬畏诱发练习之一
     */
    stargazingMeditation() {
      return {
        name: '星空冥想',
        duration: '30-45 分钟',
        theory: 'Cosmic Awe + Temporal Expansion',
        timeExpansionEffect: '极强',
        requirements: ['晴朗夜空', '远离光污染', '舒适座椅/毯子'],
        steps: [
          {
            phase: '准备',
            duration: '5 分钟',
            instruction: '找一个能看到星空的地方。舒适地坐下或躺下。让眼睛适应黑暗。放下所有期待，只是准备体验。'
          },
          {
            phase: '宇宙尺度觉察',
            duration: '10 分钟',
            instruction: '仰望星空。记住：你看到的星光是数年、数百年、甚至数千年前发出的。你正在看宇宙的过去。银河系有 1000-4000 亿颗恒星，宇宙有 2 万亿个星系。',
            inquiry: '在这个尺度下，你的生命、你的问题、你的存在，感觉如何？'
          },
          {
            phase: '小自我体验',
            duration: '10 分钟',
            instruction: '让自己感受渺小——不是贬义的渺小，而是"宇宙中的尘埃"的解放性渺小。你的问题在宇宙尺度下显得如何？这个感受是威胁还是解放？',
            insight: '小自我不是自我否定，而是从自我中心中解放'
          },
          {
            phase: '时间扩展觉察',
            duration: '10 分钟',
            instruction: '注意时间感知。在星空下，时间感觉如何？"现在"有多长？过去（星光的历史）和未来（宇宙的演化）如何活在当下？',
            inquiry: '星空如何扩展了你的时间感？'
          },
          {
            phase: '整合',
            duration: '5 分钟',
            instruction: '慢慢回到当下。带着这个宇宙视角和扩展的时间感。记住：你是宇宙体验自己的方式。',
            reflection: '这次体验如何改变了你对时间和自我的理解？'
          }
        ],
        benefits: [
          '极强的时间扩展效应',
          '深刻的自我缩小',
          '存在性焦虑减少',
          '生命意义感增强',
          '与自然/宇宙的连接感'
        ]
      };
    },

    /**
     * 敬畏叙事写作 (Awe Narrative Writing)
     */
    aweNarrative() {
      return {
        name: '敬畏叙事写作',
        duration: '20-30 分钟',
        theory: 'Narrative Psychology + Awe Research',
        timeExpansionEffect: '中等',
        steps: [
          {
            phase: '回忆敬畏体验',
            duration: '5 分钟',
            instruction: '回想一次你体验过敬畏的经历——自然、艺术、音乐、知识、精神体验都可以。闭上眼睛，重新体验它。'
          },
          {
            phase: '自由写作',
            duration: '10 分钟',
            instruction: '不停笔地写下这个体验。描述：你看到了什么？感受到了什么？时间感觉如何？自我感觉如何？不要编辑，让文字流动。',
            prompts: [
              '那个时刻是什么样子的？',
              '你的身体有什么感觉？',
              '时间感觉是变快、变慢、还是停止了？',
              '你对自己的感觉有什么变化？'
            ]
          },
          {
            phase: '意义探索',
            duration: '5 分钟',
            instruction: '重读你写的，然后回答：这个敬畏体验对你意味着什么？它如何改变了你？它揭示了什么关于时间、自我、存在的真相？',
            questions: [
              '这个体验教会了你什么？',
              '它如何改变了你的时间感？',
              '你如何将这个体验整合到日常生活中？'
            ]
          },
          {
            phase: '整合承诺',
            duration: '3 分钟',
            instruction: '写下一个小承诺：如何在未来一周培养更多敬畏？可以是一个行动、一个习惯、一个意图。',
            example: '我承诺本周安排一次敬畏散步/观星/艺术体验'
          }
        ],
        benefits: [
          '巩固敬畏记忆',
          '深化时间扩展效应',
          '增强意义感',
          '促进整合与应用'
        ]
      };
    },

    /**
     * 敬畏呼吸空间 (Awe Breathing Space)
     * 快速敬畏练习
     */
    aweBreathingSpace() {
      return {
        name: '敬畏呼吸空间',
        duration: '3-5 分钟',
        theory: 'Micro-Awe Practice',
        timeExpansionEffect: '轻微到中等',
        whenToUse: '需要快速减压、重置时间感时',
        steps: [
          {
            phase: '暂停',
            duration: '30 秒',
            instruction: '停下手中的事。放下手机。闭上眼睛或柔和地看向前方。'
          },
          {
            phase: '浩瀚想象',
            duration: '2 分钟',
            instruction: '想象一个浩瀚的场景——星空、海洋、山脉、或宇宙。让自己沉浸在这个想象中。感受自己的渺小。',
            inquiry: '在这个浩瀚中，你的问题显得如何？'
          },
          {
            phase: '时间扩展呼吸',
            duration: '2 分钟',
            instruction: '吸气时，想象吸入浩瀚；呼气时，呼出狭隘。每一次呼吸，时间感都在扩展。"现在"变得更厚、更丰富。',
            mantra: '吸气：浩瀚；呼气：狭隘'
          },
          {
            phase: '返回',
            duration: '30 秒',
            instruction: '慢慢返回当下。带着这个扩展的时间感继续你的活动。'
          }
        ],
        benefits: [
          '快速减压',
          '时间感知重置',
          '注意力恢复',
          '情绪调节'
        ]
      };
    }
  },

  /**
   * 敬畏 - 时间扩展整合评估
   */
  integrateAssessment(userInput) {
    const scaleAssessment = this.assessmentScale.assessTimeExpansion(userInput);
    
    // 匹配适合的练习
    const recommendedPractices = this.matchPractices(scaleAssessment.expansionLevel);

    return {
      ...scaleAssessment,
      recommendedPractices,
      integrationInsight: this.generateIntegrationInsight(scaleAssessment)
    };
  },

  /**
   * 匹配适合的练习
   */
  matchPractices(expansionLevel) {
    if (expansionLevel >= 0.8) {
      return [
        { practice: this.practices.stargazingMeditation(), reason: '您已体验到极强的时间扩展，星空冥想可以深化这个体验' },
        { practice: this.practices.aweNarrative(), reason: '叙事写作可以帮助整合深刻的敬畏体验' }
      ];
    } else if (expansionLevel >= 0.6) {
      return [
        { practice: this.practices.aweWalk(), reason: '敬畏散步可以维持和增强您的时间扩展体验' },
        { practice: this.practices.aweBreathingSpace(), reason: '呼吸空间可以帮助您在日常中快速重置时间感' }
      ];
    } else {
      return [
        { practice: this.practices.aweWalk(), reason: '从敬畏散步开始，培养敬畏敏感性' },
        { practice: this.practices.aweBreathingSpace(), reason: '每日练习，建立敬畏习惯' }
      ];
    }
  },

  /**
   * 生成整合洞见
   */
  generateIntegrationInsight(assessment) {
    const level = assessment.expansionLevel;
    
    if (level >= 0.8) {
      return '您已经体验到敬畏的深刻转化力量。敬畏不仅是情绪，更是一种存在方式。通过定期接触敬畏，您可以维持这种扩展的时间感和小自我视角，这将持续增强您的幸福感和生命意义感。';
    } else if (level >= 0.6) {
      return '您已经体验到敬畏的时间扩展效应。这是很好的开始！通过更规律地接触敬畏刺激，您可以深化这个体验，让它成为您生活的常态而非例外。';
    } else {
      return '敬畏敏感性是可以培养的。就像任何技能一样，越练习越敏锐。从小的敬畏时刻开始——一片叶子、一缕阳光、一首音乐——逐渐培养对浩瀚的敏感性。时间扩展效应会随之而来。';
    }
  }
};

/**
 * 模块导出
 */
module.exports = {
  // 核心数据结构
  AweTimeExpansion,
  
  // 便捷方法
  assess: (userInput) => AweTimeExpansion.integrateAssessment(userInput),
  getPractice: (type) => {
    const practices = {
      aweWalk: () => AweTimeExpansion.practices.aweWalk(),
      stargazing: () => AweTimeExpansion.practices.stargazingMeditation(),
      narrative: () => AweTimeExpansion.practices.aweNarrative(),
      breathingSpace: () => AweTimeExpansion.practices.aweBreathingSpace()
    };
    return practices[type] ? practices[type]() : null;
  },
  
  // 敬畏诱发刺激查询
  getInducers: (category) => {
    if (category && AweTimeExpansion.aweInducers[category]) {
      return AweTimeExpansion.aweInducers[category];
    }
    return AweTimeExpansion.aweInducers;
  },
  
  // 元数据
  metadata: AweTimeExpansion.metadata
};
