/**
 * 时间意识增强模块 v3.54.0 (Temporal Consciousness Enhancement)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 时间意识权威理论
 * 
 * 核心理论来源:
 * - SEP Temporal Consciousness (https://plato.stanford.edu/entries/consciousness-temporal/)
 * - Husserl 时间现象学 (原初印象/保留/预期)
 * - William James  specious present (经验性现在)
 * - 时间意识三大模型：Cinematic/Retentional/Extensional
 * 
 * 新增功能 v3.54.0:
 * - 三大时间意识模型完整评估框架
 * - 时间深度 (Temporal Depth) 测量与干预
 * - 情绪时间结构分析 (情绪如何组织时间体验)
 * - 现象学时间练习 (Husserl 三重结构应用)
 * - 时间意识与能动性整合 (Temporality & Agency)
 * 
 * 可操作技术:
 * - 时间模型评估：识别用户主导的时间意识模式
 * - 时间深度扩展：从片段化到连续整合
 * - 情绪时间标记：追踪情绪如何塑造时间感知
 * - Husserl 三重练习：原初印象/保留/预期觉察
 * - 时间锚定：连接过去 - 现在 - 未来
 * 
 * @module temporal-consciousness-enhancement
 * @version 3.54.0
 * @author HeartFlow Team
 */

const TemporalConsciousnessEnhancement = {
  /**
   * 模块元信息
   */
  meta: {
    name: '时间意识增强',
    version: '3.54.0',
    source: 'SEP Temporal Consciousness + Husserl Time Phenomenology',
    description: '基于 SEP 时间意识三大模型与现象学的深度自我整合模块',
    upgradeDate: '2026-03-30'
  },

  /**
   * SEP 时间意识三大模型完整评估框架
   * Three Models of Temporal Consciousness (SEP)
   */
  models: {
    /**
     * 电影模型 (Cinematic Model)
     * 
     * 核心主张：意识是瞬间的静态"快照"序列，通过快速连续产生运动错觉
     * 时间体验是离散的、片段化的
     * 
     * 代表人物：Augustine, Thomas Reid, Philippe Chuard
     * 
     * 心理特征:
     * - 体验描述为"片段"、"瞬间"、"碎片"
     * - 依赖记忆连接离散体验
     * - 运动/变化被感知为错觉
     * - 时间感是推论性的而非直接的
     */
    cinematic: {
      name: '电影模型',
      alias: ['快照模型', '离散模型', '瞬间模型'],
      
      coreThesis: '意识是瞬间的静态快照序列，通过快速连续产生运动错觉',
      
      proponents: ['Augustine', 'Thomas Reid', 'Philippe Chuard'],
      
      phenomenology: {
        temporalStructure: '离散的瞬间序列',
        experienceOfChange: '错觉而非真实体验',
        roleOfMemory: '连接离散快照的关键机制',
        presentMoment: '严格数学意义上的瞬间 (durationless)'
      },
      
      psychologicalIndicators: [
        '体验描述为"片段化"、"碎片化"',
        '常说"时间过得飞快"但记不清细节',
        '回忆时感觉像在翻看照片集',
        '难以描述连续的体验流',
        '对变化的感知是推论性的 ("应该发生了变化")'
      ],
      
      interventionStrategies: [
        '时间连续性练习：刻意追踪体验的流动',
        '感官锚定：通过持续感官输入培养连续感',
        '叙事整合：将片段编织成连贯故事',
        '正念呼吸：体验呼吸的连续流动'
      ],
      
      assessment: {
        questions: [
          '你的体验更像连续流动还是离散片段？',
          '你如何感知时间的流逝？',
          '回忆过去时，感觉像在看电影还是重新经历？',
          '你能否直接感知变化，还是通过比较推断变化？'
        ],
        scoring: {
          high: '强烈倾向电影模型 - 体验高度片段化',
          medium: '中等倾向 - 混合体验模式',
          low: '低倾向 - 体验较为连续'
        }
      }
    },

    /**
     * 保留模型 (Retentional Model)
     * 
     * 核心主张：意识瞬间但包含对过去的"保留"(retention)和对未来的"预期"(protention)
     * 时间体验有"厚度"，像彗星尾巴
     * 
     * 代表人物：Edmund Husserl, Franz Brentano, Daniel Dennett
     * 
     * 心理特征:
     * - 体验有"厚度"和"延展"
     * - 能直接感知刚刚过去的持存
     * - 对未来有前摄性预期
     * - 时间结构是复合的 (原初印象 + 保留 + 预期)
     */
    retentional: {
      name: '保留模型',
      alias: ['彗星尾模型', 'Husserl 模型', '三重结构模型'],
      
      coreThesis: '意识瞬间但包含原初印象 + 保留 (过去) + 预期 (未来) 的复合结构',
      
      proponents: ['Edmund Husserl', 'Franz Brentano', 'Daniel Dennett'],
      
      husserlTriad: {
        primalImpression: {
          name: '原初印象 (Primal Impression)',
          description: '当下的核心体验，严格意义上的现在',
          role: '提供时间体验的锚点'
        },
        retention: {
          name: '保留 (Retention)',
          description: '对刚刚过去的非自愿持存，不是回忆',
          role: '提供时间的"彗星尾"厚度',
          distinction: '与回忆不同 - 保留是被动的、直接的、非表征的'
        },
        protention: {
          name: '预期 (Protention)',
          description: '对即将到来的前摄性预期',
          role: '提供时间的向前指向性',
          distinction: '与预测不同 - 预期是前反思的、身体性的'
        }
      },
      
      phenomenology: {
        temporalStructure: '瞬间但有厚度的"彗星尾"结构',
        experienceOfChange: '直接感知 - 变化在保留中呈现',
        speciousPresent: '经验性现在有短暂但真实的延展',
        flowOfConsciousness: '保留的连续更新产生流动感'
      },
      
      psychologicalIndicators: [
        '能直接感知声音/运动的连续流动',
        '体验有"厚度"和"深度"',
        '对刚刚发生的事有清晰的"余韵"感',
        '能同时感知现在和对未来的期待',
        '回忆与"刚刚过去"有清晰区分'
      ],
      
      interventionStrategies: [
        'Husserl 三重觉察练习：同时注意原初印象/保留/预期',
        '音乐聆听练习：追踪旋律的流动 (保留 - 原初印象 - 预期)',
        '呼吸觉察：体验呼吸的完整周期',
        '身体扫描：感知身体感觉的时间延展'
      ],
      
      assessment: {
        questions: [
          '听旋律时，能否同时感知正在响的音符和刚刚过去的音符？',
          '你的"现在"感觉有厚度吗？大概多长？',
          '能否区分"刚刚过去"和"回忆"？',
          '对未来有身体性的期待感吗？'
        ],
        scoring: {
          high: '强烈倾向保留模型 - 体验有明显的时间厚度',
          medium: '中等倾向 - 部分体验有厚度',
          low: '低倾向 - 体验更接近瞬间或延展'
        }
      }
    },

    /**
     * 延展模型 (Extensional Model)
     * 
     * 核心主张：意识体验本身就是时间上延展的，能直接包容变化
     * 时间体验是连续的、整体性的
     * 
     * 代表人物：William James, Barry Dainton, Ian Phillips
     * 
     * 心理特征:
     * - 体验是连续的流 (stream of consciousness)
     * - 能直接感知 temporally extended phenomena
     * - 变化是体验的内在属性
     * - 时间延展是体验的本体论特征
     */
    extensional: {
      name: '延展模型',
      alias: ['连续模型', '流模型', 'James 模型'],
      
      coreThesis: '意识体验本身就是时间上延展的，能直接包容变化',
      
      proponents: ['William James', 'Barry Dainton', 'Ian Phillips'],
      
      jamesianConcepts: {
        speciousPresent: {
          name: '经验性现在 (Specious Present)',
          description: '有真实延展的"现在"，足以容纳变化',
          duration: '约 2-3 秒 (心理学研究)',
          role: '时间体验的基本单位'
        },
        streamOfConsciousness: {
          name: '意识流',
          description: '意识是连续的流，不是离散元素的组合',
          characteristics: ['连续性', '变化性', '选择性', '意向性']
        }
      },
      
      phenomenology: {
        temporalStructure: '连续延展的体验流',
        experienceOfChange: '直接感知 - 变化是体验的内在属性',
        persistence: '对象在时间中的持续是直接体验的',
        flow: '体验本身在流动 (flow of experience)'
      },
      
      psychologicalIndicators: [
        '体验描述为"流"、"连续"、"绵延"',
        '能直接感知运动/变化而非推断',
        '时间体验有自然的节奏和韵律',
        '过去 - 现在 - 未来是连续的整体',
        '难以将体验切割成离散瞬间'
      ],
      
      interventionStrategies: [
        '意识流写作：不加编辑地记录体验流',
        '动态冥想：在运动中觉察连续变化',
        '自然观察：追踪云/水/火的连续流动',
        '舞蹈/太极：通过身体运动体验时间延展'
      ],
      
      assessment: {
        questions: [
          '你的体验更像连续的流还是离散的瞬间？',
          '能否直接看到运动，还是看到物体在不同位置？',
          '时间对你来说是连续的还是跳跃的？',
          '你的"现在"感觉有多长？'
        ],
        scoring: {
          high: '强烈倾向延展模型 - 体验是连续的流',
          medium: '中等倾向 - 混合体验模式',
          low: '低倾向 - 体验更接近离散或保留'
        }
      }
    }
  },

  /**
   * 时间意识评估框架
   * Assess user's dominant temporal consciousness model
   */
  assess: function(userExperience, context = {}) {
    const assessment = {
      timestamp: new Date().toISOString(),
      models: {
        cinematic: 0,
        retentional: 0,
        extensional: 0
      },
      dominant: null,
      profile: '',
      recommendations: []
    };

    // 关键词评分
    const keywords = {
      cinematic: ['片段', '碎片', '瞬间', '快照', '跳跃', '断开', '拼图', '碎片化'],
      retentional: ['余韵', '回响', '厚度', '延展', '刚刚', '持存', '预期', '期待'],
      extensional: ['流', '连续', '绵延', '流动', '持续', '整体', '连贯', '顺畅']
    };

    // 计算各模型得分
    Object.keys(keywords).forEach(model => {
      keywords[model].forEach(word => {
        if (userExperience.includes(word)) {
          assessment.models[model] += 2;
        }
      });
    });

    // 句子结构分析
    const sentences = userExperience.split(/[.!?]/);
    sentences.forEach(sentence => {
      if (sentence.includes('感觉时间') || sentence.includes('时间过得')) {
        if (sentence.includes('快') || sentence.includes('慢')) {
          assessment.models.cinematic += 1;
        }
        if (sentence.includes('流动') || sentence.includes('绵延')) {
          assessment.models.extensional += 2;
        }
      }
    });

    // 确定主导模型
    const maxScore = Math.max(...Object.values(assessment.models));
    const dominantModels = Object.entries(assessment.models)
      .filter(([_, score]) => score === maxScore)
      .map(([model]) => model);

    assessment.dominant = dominantModels[0];
    
    // 生成时间意识档案
    if (assessment.models.cinematic > 5) {
      assessment.profile = '片段化时间体验者 - 体验倾向于离散的瞬间，可能需要连续性整合练习';
    } else if (assessment.models.retentional > 5) {
      assessment.profile = '厚度时间体验者 - 体验有明显的时间深度，适合 Husserl 三重觉察练习';
    } else if (assessment.models.extensional > 5) {
      assessment.profile = '流动时间体验者 - 体验是连续的流，适合动态冥想和意识流练习';
    } else {
      assessment.profile = '混合时间体验者 - 体验模式灵活，可根据情境调整';
    }

    // 生成干预建议
    assessment.recommendations = this.generateRecommendations(assessment.dominant, context);

    return assessment;
  },

  /**
   * 基于评估结果生成干预建议
   */
  generateRecommendations: function(dominantModel, context) {
    const recommendations = {
      cinematic: [
        {
          name: '时间连续性练习',
          description: '刻意追踪体验的流动，从片段到连续',
          steps: [
            '选择一个持续的声音 (如空调声、交通声)',
            '专注聆听，注意声音的连续而非间断',
            '当发现自己在想"这是同一个声音"时，回到直接聆听',
            '持续 5 分钟，每天练习'
          ],
          frequency: '每日 5-10 分钟',
          expectedOutcome: '增强时间连续感，减少片段化体验'
        },
        {
          name: '叙事整合练习',
          description: '将片段体验编织成连贯的生命故事',
          steps: [
            '回顾今天发生的 3 件事',
            '寻找它们之间的联系和主题',
            '用"因为...所以...然后..."连接它们',
            '书写成一段连贯的叙事'
          ],
          frequency: '每晚睡前',
          expectedOutcome: '增强生命故事的连贯性，整合片段体验'
        }
      ],
      retentional: [
        {
          name: 'Husserl 三重觉察练习',
          description: '同时觉察原初印象/保留/预期的时间三重结构',
          steps: [
            '选择一个重复的声音 (如钟表滴答)',
            '注意正在响的声音 (原初印象)',
            '注意刚刚响过的声音的"余韵" (保留)',
            '注意对下一个声音的期待 (预期)',
            '同时保持对三者的觉察'
          ],
          frequency: '每日 10 分钟',
          expectedOutcome: '深化时间厚度觉察，增强时间结构的清晰度'
        },
        {
          name: '旋律追踪练习',
          description: '通过音乐体验保留 - 原初印象 - 预期的流动',
          steps: [
            '选择一首熟悉的慢歌',
            '聆听时注意每个音符的完整时间结构',
            '觉察音符如何在"彗星尾"中持存',
            '觉察对下一个音符的预期如何塑造体验'
          ],
          frequency: '每周 2-3 次',
          expectedOutcome: '增强时间厚度的音乐性体验'
        }
      ],
      extensional: [
        {
          name: '意识流写作',
          description: '不加编辑地记录体验的连续流动',
          steps: [
            '设置 10 分钟计时器',
            '不停笔地写下所有升起的体验',
            '不编辑、不评判、不停顿',
            '让笔跟随体验的流动'
          ],
          frequency: '每周 2-3 次',
          expectedOutcome: '深化意识流的直接体验，减少概念化干扰'
        },
        {
          name: '动态冥想',
          description: '在身体运动中觉察时间的连续延展',
          steps: [
            '选择缓慢的连续运动 (如太极、瑜伽、慢走)',
            '专注觉察运动的每一个微小变化',
            '注意运动如何在时间中延展',
            '体验身体与时间的融合'
          ],
          frequency: '每日 15 分钟',
          expectedOutcome: '通过身体深化时间延展体验'
        }
      ],
      mixed: [
        {
          name: '时间模型灵活性练习',
          description: '在不同情境中灵活运用不同时间模型',
          steps: [
            '识别当前情境需要的时间模式',
            '需要专注时：采用保留模型 (厚度觉察)',
            '需要创造时：采用延展模型 (流动觉察)',
            '需要分析时：采用电影模型 (片段觉察)',
            '练习在不同模式间切换'
          ],
          frequency: '情境性练习',
          expectedOutcome: '增强时间意识的灵活性和适应性'
        }
      ]
    };

    return recommendations[dominantModel] || recommendations.mixed;
  },

  /**
   * 情绪时间结构分析
   * 分析情绪如何组织和塑造时间体验
   */
  analyzeEmotionTimeStructure: function(emotion, context = {}) {
    const emotionTimePatterns = {
      // 焦虑：时间压缩 + 未来过度预期
      anxiety: {
        temporalDistortion: '时间压缩 - 感觉时间不够用',
        dominantStructure: '过度 protention (预期) - 灾难化未来',
        retentionPattern: '对过去担忧的反复反刍',
        intervention: [
          '时间扩展呼吸：延长呼气，扩展经验性现在',
          '现实检验预期：区分真实威胁和想象威胁',
          '锚定当下：5-4-3-2-1 感官锚定练习'
        ]
      },
      
      // 抑郁：时间停滞 + 过去过度保留
      depression: {
        temporalDistortion: '时间停滞 - 感觉时间凝固或无限延长',
        dominantStructure: '过度 retention (保留) - 困在过去',
        protentionPattern: '预期缺失 - 未来感觉空白或无望',
        intervention: [
          '微小时刻觉察：寻找当下微小的愉悦',
          '未来想象练习：构建具体的小步骤未来图景',
          '身体激活：通过运动打破时间停滞感'
        ]
      },
      
      // 愤怒：时间加速 + 当下过度聚焦
      anger: {
        temporalDistortion: '时间加速 - 感觉瞬间爆发',
        dominantStructure: '过度 primal impression - 当下刺激主导',
        retentionPattern: '对冒犯的强烈保留',
        intervention: [
          '时间暂停：深呼吸创造时间间隙',
          '视角扩展：从更大时间框架看当前事件',
          '延迟反应：等待 10 秒再行动'
        ]
      },
      
      // 喜悦：时间延展 + 当下丰富
      joy: {
        temporalDistortion: '时间延展 - "希望这一刻永远持续"',
        dominantStructure: '丰富的当下 + 积极的保留和预期',
        integration: '时间三重结构和谐整合',
        intervention: [
          '品味练习：刻意延长和深化喜悦体验',
          '感恩记录：将喜悦转化为持久的保留',
          '分享喜悦：通过分享扩展时间影响'
        ]
      },
      
      // 悲伤：时间拉长 + 过去主导
      sadness: {
        temporalDistortion: '时间拉长 - 感觉时间缓慢沉重',
        dominantStructure: '强烈的 retention - 失去的对象持续在场',
        protentionPattern: '未来感觉空洞',
        intervention: [
          '允许悲伤：承认悲伤的时间需要',
          '渐进式未来想象：从小步骤开始重建预期',
          '意义整合：将失去整合进生命叙事'
        ]
      }
    };

    const pattern = emotionTimePatterns[emotion.toLowerCase()] || {
      temporalDistortion: '未识别的时间模式',
      dominantStructure: '需要进一步探索',
      intervention: ['情绪命名：识别和命名当前情绪', '时间觉察：注意情绪如何影响时间感知']
    };

    return {
      emotion,
      ...pattern,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Husserl 时间现象学练习
   * 基于 Husserl 内时间意识现象学的结构化练习
   */
  husserlTimePractice: {
    /**
     * 基础三重觉察练习
     */
    basicTriadAwareness: {
      name: 'Husserl 三重觉察基础练习',
      duration: '10 分钟',
      instructions: [
        '找一个安静的地方坐下，设定 10 分钟计时器',
        '选择一个重复的声音作为对象 (钟表滴答、呼吸声、远处交通声)',
        
        // 阶段 1: 原初印象
        '【阶段 1 - 原初印象】(3 分钟)',
        '- 专注聆听正在响的声音',
        '- 这是严格意义上的"现在"',
        '- 当声音响起时，完全临在于那个瞬间',
        
        // 阶段 2: 保留觉察
        '【阶段 2 - 保留觉察】(3 分钟)',
        '- 声音消失后，注意它的"余韵"',
        '- 这不是回忆，而是声音刚刚过去的直接持存',
        '- 像彗星尾巴一样，声音在消失后仍短暂"在场"',
        
        // 阶段 3: 预期觉察
        '【阶段 3 - 预期觉察】(3 分钟)',
        '- 注意对下一个声音的期待',
        '- 这不是有意识的预测，而是身体性的前摄',
        '- 预期已经塑造了你对下一个声音的体验',
        
        // 整合阶段
        '【整合阶段】(1 分钟)',
        '- 同时觉察三者：正在响的、刚刚响过的、即将到来的',
        '- 这就是 Husserl 所说的内时间意识的三重结构',
        '- 你的"现在"不是瞬间，而是有厚度的时间场域'
      ],
      reflectionQuestions: [
        '你能清晰区分原初印象、保留和预期吗？',
        '你的"现在"感觉有多长？',
        '保留和回忆有什么不同？',
        '预期和预测有什么不同？'
      ]
    },

    /**
     * 旋律时间深度练习
     */
    melodyTimeDepth: {
      name: '旋律时间深度练习',
      duration: '15 分钟',
      instructions: [
        '选择一首你熟悉的慢歌 (约 3-4 分钟)',
        '第一次聆听：专注旋律的整体流动',
        '第二次聆听：注意每个音符的三重结构',
        '- 音符响起时的原初印象',
        '- 音符消失后的保留 (余韵)',
        '- 对下一个音符的预期',
        '第三次聆听：注意乐句如何在时间中组织',
        '- 乐句如何开始、发展、结束',
        '- 乐句之间的停顿如何创造期待',
        '静默反思 (3 分钟)',
        '- 音乐如何塑造你的时间体验？',
        '- 你的时间感在聆听中发生了什么变化？'
      ],
      reflectionQuestions: [
        '音乐中的时间和你日常的时间感有什么不同？',
        '你能同时感知多个时间层次吗？ (音符/乐句/整曲)',
        '音乐结束时，时间感如何过渡回日常？'
      ]
    },

    /**
     * 记忆 - 预期对话练习
     */
    memoryAnticipationDialogue: {
      name: '记忆 - 预期对话练习',
      duration: '20 分钟',
      instructions: [
        '【第一部分：回忆】(7 分钟)',
        '- 回忆一个重要的过去经历',
        '- 注意回忆时的身体感受',
        '- 注意回忆如何塑造现在的你',
        
        '【第二部分：预期】(7 分钟)',
        '- 想象 1 年后的自己',
        '- 具体化：你在哪里？和谁在一起？在做什么？',
        '- 注意预期时的身体感受',
        '- 注意预期如何影响现在的选择',
        
        '【第三部分：对话】(6 分钟)',
        '- 让过去的自己和未来的自己对话',
        '- 过去的你想对现在的你说什么？',
        '- 未来的你想对现在的你说什么？',
        '- 现在的你想对两者说什么？'
      ],
      reflectionQuestions: [
        '过去和未来如何共同塑造现在的你？',
        '时间三重结构如何支持你的身份连续感？',
        '这个练习如何改变了你对时间的理解？'
      ]
    }
  },

  /**
   * 时间意识与能动性整合
   * Temporality & Agency - 时间体验如何影响能动性感知
   */
  temporalityAndAgency: {
    /**
     * 时间深度与能动性评估
     */
    assessTemporalAgency: function(userNarrative) {
      const assessment = {
        temporalDepth: 'low',
        agencySense: 'low',
        patterns: [],
        recommendations: []
      };

      // 时间深度指标
      const pastReferences = (userNarrative.match(/过去 | 曾经 | 以前 | 小时候 | 去年/g) || []).length;
      const futureReferences = (userNarrative.match(/未来 | 将来 | 明天 | 明年 | 计划 | 想要/g) || []).length;
      const presentReferences = (userNarrative.match(/现在 | 此刻 | 当下 | 今天 | 正在/g) || []).length;

      const totalReferences = pastReferences + futureReferences + presentReferences;
      
      if (totalReferences < 3) {
        assessment.temporalDepth = 'shallow - 时间参照较少，可能缺乏时间整合';
      } else if (totalReferences < 8) {
        assessment.temporalDepth = 'moderate - 有基本的时间整合';
      } else {
        assessment.temporalDepth = 'deep - 丰富的时间整合';
      }

      // 能动性指标
      const agencyMarkers = (userNarrative.match(/我选择 | 我决定 | 我能 | 我可以 | 我主动 | 我创造/g) || []).length;
      const passiveMarkers = (userNarrative.match(/我被迫 | 我必须 | 我只能 | 我没办法 | 我被/g) || []).length;

      if (agencyMarkers > passiveMarkers * 2) {
        assessment.agencySense = 'high - 强烈的能动性感';
      } else if (agencyMarkers > passiveMarkers) {
        assessment.agencySense = 'moderate - 中等的能动性感';
      } else {
        assessment.agencySense = 'low - 能动性感较弱，可能感到被动';
      }

      // 模式识别
      if (pastReferences > futureReferences * 2) {
        assessment.patterns.push('过去主导 - 可能困在过去的经历中');
      }
      if (futureReferences > pastReferences * 2) {
        assessment.patterns.push('未来主导 - 可能过度规划或焦虑未来');
      }
      if (presentReferences > (pastReferences + futureReferences)) {
        assessment.patterns.push('当下主导 - 可能缺乏时间连续感');
      }

      // 建议
      if (assessment.temporalDepth.includes('shallow')) {
        assessment.recommendations.push('时间锚定练习：刻意连接过去 - 现在 - 未来');
      }
      if (assessment.agencySense.includes('low')) {
        assessment.recommendations.push('能动性增强：识别和记录主动选择的时刻');
      }

      return assessment;
    },

    /**
     * 时间整合干预
     */
    temporalIntegrationIntervention: {
      name: '时间整合干预',
      description: '帮助整合过去 - 现在 - 未来，增强时间深度和能动性感',
      sessions: [
        {
          session: 1,
          focus: '过去整合',
          exercises: [
            '生命时间线：绘制从出生到现在的关键事件',
            '关键场景书写：深入描述 3 个塑造你的关键时刻',
            '主题识别：识别生命故事中的反复主题'
          ]
        },
        {
          session: 2,
          focus: '未来整合',
          exercises: [
            '未来自我可视化：具体想象 1 年/5 年后的自己',
            '价值导向目标：基于核心价值观设定目标',
            '障碍预演：预测并计划应对可能的障碍'
          ]
        },
        {
          session: 3,
          focus: '现在整合',
          exercises: [
            '当下临在练习：深度觉察此时此刻',
            '时间三重觉察：Husserl 原初印象/保留/预期练习',
            '整合叙事：书写过去 - 现在 - 未来的连贯故事'
          ]
        }
      ]
    }
  },

  /**
   * 临床应用指南
   */
  clinicalApplications: {
    anxiety: {
      temporalPattern: '时间压缩 + 灾难化预期',
      interventions: [
        '时间扩展呼吸：4-7-8 呼吸法扩展经验性现在',
        '现实检验：区分真实威胁和想象威胁',
        '保留练习：注意焦虑如何随时间自然消退'
      ]
    },
    depression: {
      temporalPattern: '时间停滞 + 未来空白',
      interventions: [
        '微小时刻：寻找当下微小的愉悦时刻',
        '渐进预期：从小步骤开始重建未来想象',
        '身体激活：通过运动打破时间停滞'
      ]
    },
    trauma: {
      temporalPattern: '时间断裂 + 侵入性保留',
      interventions: [
        '时间锚定：使用感官锚定回到安全的现在',
        '叙事整合：将创伤整合进生命故事',
        '专业支持：建议寻求专业创伤治疗'
      ]
    }
  }
};

module.exports = TemporalConsciousnessEnhancement;
