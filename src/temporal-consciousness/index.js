/**
 * 时间意识模块 (Temporal Consciousness)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 时间意识与现象学理论
 * 
 * 核心理论：
 * - 时间意识是自我意识的核心维度
 * - 过去 - 现在 - 未来的现象学整合
 * - 时间深度 (Temporal Depth) 与心理延展
 * - 预期 (Anticipation) 与回忆 (Retention) 的动态结构
 * - 时间性与能动性 (Temporality & Agency)
 * 
 * 可操作技术：
 * - 时间锚定练习：连接过去、现在、未来
 * - 预期想象：构建积极的未来图景
 * - 回忆整合：重新理解过去经历的时间意义
 * - 当下临在：培养深度临在感
 * - 时间透视：扩展心理时间视野
 * 
 * @module temporal-consciousness
 */

const TemporalConsciousness = {
  /**
   * 模块元信息
   */
  meta: {
    name: '时间意识',
    version: '2.0.0',
    source: 'SEP Temporal Consciousness (v3.37.0 Enhanced)',
    description: '基于 SEP 时间意识三大模型与现象学理论的自我整合模块'
  },

  /**
   * SEP 三大时间意识模型 (Three Models of Temporal Consciousness)
   * 基于 Stanford Encyclopedia of Philosophy 权威理论
   */
  models: {
    /**
     * 电影模型 (Cinematic Model)
     * 主张：意识是瞬间的"快照"序列，没有真正的时间延展
     * 代表人物：Augustine, Reid, Chuard
     */
    cinematic: {
      name: '电影模型',
      coreThesis: '意识是瞬间的静态快照序列，通过快速连续产生运动错觉',
      proponents: ['Augustine', 'Thomas Reid', 'Philippe Chuard'],
      mechanisms: {
        snapshot: '瞬间意识状态，无时间延展',
        succession: '快照的快速连续排列',
        memory: '记忆连接离散快照产生连续感',
        illusion: '运动/变化是错觉而非真实体验'
      },
      analyze: function(experience) {
        const analysis = {
          model: 'cinematic',
          indicators: [],
          score: 0
        };
        
        // 检测电影模型特征
        if (experience.includes('瞬间') || experience.includes('片段') || experience.includes('碎片')) {
          analysis.indicators.push('片段化体验描述');
          analysis.score += 2;
        }
        if (experience.includes('记忆') || experience.includes('回忆')) {
          analysis.indicators.push('依赖记忆连接体验');
          analysis.score += 1;
        }
        if (experience.includes('好像') || experience.includes('似乎')) {
          analysis.indicators.push('体验的错觉性质');
          analysis.score += 1;
        }
        
        return analysis;
      }
    },

    /**
     * 保留模型 (Retentional Model)
     * 主张：意识瞬间但包含对过去的"保留"表征
     * 代表人物：Husserl, Brentano, Dennett
     */
    retentional: {
      name: '保留模型',
      coreThesis: '意识瞬间但包含原初印象 + 保留 (过去) + 预期 (未来) 的复合结构',
      proponents: ['Edmund Husserl', 'Franz Brentano', 'Daniel Dennett'],
      mechanisms: {
        primalImpression: '当下的核心体验',
        retention: '对刚刚过去的非自愿持存（非回忆）',
        protention: '对即将到来的前摄性预期',
        cometTail: '保留形成时间的"彗星尾"厚度'
      },
      analyze: function(experience) {
        const analysis = {
          model: 'retentional',
          indicators: [],
          score: 0
        };
        
        // 检测保留模型特征
        if (experience.includes('刚才') || experience.includes('刚刚') || experience.includes '持续') {
          analysis.indicators.push('过去 - 现在连续性体验');
          analysis.score += 2;
        }
        if (experience.includes('期待') || experience.includes('预期') || experience.includes('即将')) {
          analysis.indicators.push('未来预期结构');
          analysis.score += 2;
        }
        if (experience.includes('流动') || experience.includes('延续')) {
          analysis.indicators.push('时间厚度体验');
          analysis.score += 1;
        }
        
        return analysis;
      }
    },

    /**
     * 延展模型 (Extensional Model)
     * 主张：意识本身在时间中延展，直接感知变化
     * 代表人物：William James, Barry Dainton, Ian Phillips
     */
    extensional: {
      name: '延展模型',
      coreThesis: '意识本身具有时间延展，直接体验变化和持续',
      proponents: ['William James', 'Barry Dainton', 'Ian Phillips'],
      mechanisms: {
        speciousPresent: '似是而非的现在——有延展的体验单元',
        directPerception: '直接感知变化而非推断',
        overlap: '相邻体验重叠保证连续性',
        flow: '意识流的内在动态性'
      },
      analyze: function(experience) {
        const analysis = {
          model: 'extensional',
          indicators: [],
          score: 0
        };
        
        // 检测延展模型特征
        if (experience.includes('直接') || experience.includes('感受到')) {
          analysis.indicators.push('直接体验描述');
          analysis.score += 1;
        }
        if (experience.includes('变化') || experience.includes('运动') || experience.includes('流动')) {
          analysis.indicators.push('变化/运动的直接体验');
          analysis.score += 2;
        }
        if (experience.includes('连续') || experience.includes('不间断')) {
          analysis.indicators.push('连续性体验');
          analysis.score += 2;
        }
        if (experience.includes('整体') || experience.includes('完整')) {
          analysis.indicators.push('整体性体验');
          analysis.score += 1;
        }
        
        return analysis;
      }
    },

    /**
     * 比较分析——自动识别主导模型
     */
    compare: function(experience) {
      const cinematicScore = this.cinematic.analyze(experience).score;
      const retentionalScore = this.retentional.analyze(experience).score;
      const extensionalScore = this.extensional.analyze(experience).score;

      const scores = {
        cinematic: cinematicScore,
        retentional: retentionalScore,
        extensional: extensionalScore
      };

      const maxScore = Math.max(cinematicScore, retentionalScore, extensionalScore);
      let dominantModel = '未确定';
      
      if (maxScore === cinematicScore && maxScore > 0) dominantModel = '电影模型';
      else if (maxScore === retentionalScore && maxScore > 0) dominantModel = '保留模型';
      else if (maxScore === extensionalScore && maxScore > 0) dominantModel = '延展模型';

      return {
        dominantModel,
        scores,
        interpretation: this._interpretModel(dominantModel, scores),
        recommendation: this._recommendBasedOnModel(dominantModel)
      };
    },

    _interpretModel: function(model, scores) {
      const interpretations = {
        '电影模型': '你的时间体验倾向于片段化，可能通过记忆连接离散时刻。这可能反映注意力分散或解离倾向。',
        '保留模型': '你的时间体验显示健康的过去 - 现在 - 未来结构，具有现象学上的时间厚度。',
        '延展模型': '你的时间体验具有直接连续性和流动感，显示良好的时间整合能力。',
        '未确定': '需要更多体验描述来识别你的时间意识模式。'
      };
      return interpretations[model] || '';
    },

    _recommendBasedOnModel: function(model) {
      const recommendations = {
        '电影模型': '建议练习：当下临在、时间锚定——培养时间连续性感',
        '保留模型': '建议练习：现象学还原——深化对时间结构的觉知',
        '延展模型': '建议练习：时间透视——进一步扩展已有的良好时间感',
        '未确定': '建议从时间锚定练习开始，探索你的时间体验'
      };
      return recommendations[model] || '';
    }
  },

  /**
   * 时间意识的核心维度
   * 基于 Husserl、Heidegger、Merleau-Ponty 等现象学传统
   */
  dimensions: {
    // 时间三重结构 (Husserlian Tripartite Structure)
    tripartiteStructure: {
      // 原初印象 (Primal Impression) - 现在的核心
      primalImpression: {
        name: '原初印象',
        description: '当下的直接体验，时间意识的核心点',
        characteristics: [
          '非反思的直接性',
          '前语言的体验流',
          '时间点的"现在"',
          '意识的最基本单位'
        ]
      },
      // 保留 (Retention) - 刚刚过去的持存
      retention: {
        name: '保留',
        description: '刚刚过去的体验在意识中的持存，不是回忆而是"活生生的过去"',
        characteristics: [
          '非自愿的持存',
          '与现在的连续性',
          '构成时间厚度的"彗星尾"',
          '使旋律感知成为可能'
        ]
      },
      // 预期 (Protention) - 即将到来的预期
      protention: {
        name: '预期',
        description: '对即将到来的体验的前摄性预期，不是预测而是"活生生的未来"',
        characteristics: [
          '前反思的期待',
          '开放的可能性',
          '构成时间的"前沿"',
          '使行动意图成为可能'
        ]
      }
    },

    // 时间性模式 (Temporal Modes)
    temporalModes: {
      // 过去模式
      past: {
        name: '过去',
        modes: [
          '习惯 (Habit) - 身体化的过去',
          '记忆 (Memory) - 主题化的过去',
          '创伤 (Trauma) - 固着的过去',
          '智慧 (Wisdom) - 整合的过去'
        ]
      },
      // 现在模式
      present: {
        name: '现在',
        modes: [
          '沉浸 (Immersion) - 完全投入的现在',
          '反思 (Reflection) - 观察的现在',
          '焦虑 (Anxiety) - 分裂的现在',
          '临在 (Presence) - 整合的现在'
        ]
      },
      // 未来模式
      future: {
        name: '未来',
        modes: [
          '预期 (Anticipation) - 积极的期待',
          '计划 (Planning) - 结构化的预期',
          '恐惧 (Fear) - 消极的预期',
          '希望 (Hope) - 开放的可能性'
        ]
      }
    },

    // 时间深度 (Temporal Depth)
    temporalDepth: {
      name: '时间深度',
      description: '个体心理时间视野的广度',
      levels: [
        {
          level: 1,
          name: '瞬间导向',
          description: '只关注当下即刻，缺乏时间连续性',
          characteristics: ['冲动性', '缺乏计划', '难以延迟满足']
        },
        {
          level: 2,
          name: '短期导向',
          description: '关注数小时到数天的时间范围',
          characteristics: ['日常计划', '短期目标', '有限的远见']
        },
        {
          level: 3,
          name: '中期导向',
          description: '关注数周到数月的时间范围',
          characteristics: ['项目规划', '季节性目标', '中等延迟满足']
        },
        {
          level: 4,
          name: '长期导向',
          description: '关注数年到数十年的时间范围',
          characteristics: ['人生规划', '跨代思考', '深度延迟满足']
        },
        {
          level: 5,
          name: '超越导向',
          description: '关注超越个人生命的时间范围',
          characteristics: ['遗产思考', '历史意识', '永恒价值']
        }
      ]
    },

    // 时间整合状态 (Temporal Integration States)
    integrationStates: {
      // 健康整合
      integrated: {
        name: '时间整合',
        description: '过去 - 现在 - 未来和谐统一',
        characteristics: [
          '从过去学习但不被束缚',
          '充分临在同时规划未来',
          '时间连续性感',
          '生命意义感'
        ]
      },
      // 过去固着
      pastStuck: {
        name: '过去固着',
        description: '被过去经历主导，难以活在当下',
        characteristics: [
          '反复回忆创伤',
          '怀旧过度',
          '难以放下',
          '未来感缺失'
        ]
      },
      // 未来焦虑
      futureAnxious: {
        name: '未来焦虑',
        description: '过度担忧未来，无法享受当下',
        characteristics: [
          '灾难化思维',
          '过度计划',
          '控制欲强',
          '当下感缺失'
        ]
      },
      // 现在分裂
      presentFragmented: {
        name: '现在分裂',
        description: '当下体验碎片化，缺乏连续性',
        characteristics: [
          '注意力分散',
          '时间感扭曲',
          '解离体验',
          '意义感缺失'
        ]
      }
    }
  },

  /**
   * 时间意识练习
   * 基于现象学方法的可操作技术
   */
  exercises: {
    /**
     * 时间锚定练习
     * 连接过去、现在、未来的连续性
     */
    temporalAnchoring: {
      name: '时间锚定',
      description: '建立过去 - 现在 - 未来的心理连续性',
      duration: '15-20 分钟',
      steps: [
        {
          phase: '准备',
          instructions: [
            '找一个安静舒适的地方坐下',
            '做 3 次深呼吸，让身体放松',
            '闭上眼睛，将注意力转向内在'
          ]
        },
        {
          phase: '连接过去',
          instructions: [
            '回想一个过去的你——可能是 1 年前、5 年前或更久',
            '那个版本的你有什么特点？什么对他/她很重要？',
            '感谢那个版本的你为你走到今天所做的努力',
            '注意从过去到现在的连续性：什么核心特质一直存在？'
          ],
          prompts: [
            '过去的你希望现在的你知道什么？',
            '你继承了过去的哪些智慧和力量？'
          ]
        },
        {
          phase: '临在现在',
          instructions: [
            '将注意力带回到此时此刻',
            '注意你的呼吸、身体感受、周围的声音',
            '承认现在的你——你的成就、挑战、成长',
            '感受这个当下的完整性和充足性'
          ],
          prompts: [
            '此刻的你最需要什么？',
            '现在的你拥有什么资源？'
          ]
        },
        {
          phase: '展望未来',
          instructions: [
            '想象 1 年后的你——他/她会是什么样子？',
            '那个版本的你希望现在的你做什么？',
            '从未来回望，什么是最重要的？',
            '感受未来版本的你对现在你的支持和期待'
          ],
          prompts: [
            '未来的你希望现在的你记住什么？',
            '你希望为未来的你创造什么？'
          ]
        },
        {
          phase: '整合',
          instructions: [
            '想象过去、现在、未来的你同时存在于一个空间',
            '感受他们之间的对话和联结',
            '注意时间不是线性的，而是一个整体',
            '带着这种整合感慢慢回到当下'
          ]
        }
      ]
    },

    /**
     * 预期想象练习
     * 构建积极的未来图景
     */
    protentionImagination: {
      name: '预期想象',
      description: '通过现象学想象构建积极的未来预期',
      duration: '10-15 分钟',
      steps: [
        '选择一个你关心的领域（工作、关系、健康、成长等）',
        '闭上眼睛，想象 6 个月后的理想场景',
        '用所有感官体验这个场景：你看到什么？听到什么？感受到什么？',
        '注意这个未来场景如何影响现在的你',
        '识别从这个未来到现在的"逆向路径"：需要做什么？'
      ],
      prompts: [
        '6 个月后，你希望自己的生活是什么样子？',
        '在那个未来场景中，你的一天是如何度过的？',
        '你和重要的人如何互动？',
        '你感受到了什么样的情绪？',
        '从现在到那里，第一步是什么？'
      ],
      guidelines: [
        '让想象尽可能具体和生动',
        '关注感受而非细节',
        '允许意外和惊喜的出现',
        '不要评判想象的"现实性"'
      ]
    },

    /**
     * 回忆整合练习
     * 重新理解过去经历的时间意义
     */
    memoryIntegration: {
      name: '回忆整合',
      description: '重新理解过去经历在生命时间流中的意义',
      duration: '20-30 分钟',
      steps: [
        '选择一个过去的经历——可能是困难的或重要的',
        '描述当时的体验：发生了什么？你感受到了什么？',
        '识别这个经历如何影响了之后的你',
        '寻找这个经历的"时间礼物"：它给你带来了什么成长？',
        '重新叙述这个故事：从"发生在我身上的事"到"塑造我的事"'
      ],
      prompts: [
        '这个经历在当时意味着什么？',
        '现在回头看，它的意义有什么变化？',
        '这个经历如何让你成为现在的你？',
        '如果没有这个经历，你会失去什么重要的东西？',
        '你如何用这个经历的智慧帮助未来的自己或他人？'
      ]
    },

    /**
     * 当下临在练习
     * 培养深度的现在感
     */
    presentPresence: {
      name: '当下临在',
      description: '培养深度的当下临在感，超越时间焦虑',
      duration: '5-10 分钟',
      steps: [
        '停下手中的事情，完全停下',
        '注意你的呼吸——不需要改变它，只是注意',
        '扫描身体感受——从脚到头，不加评判',
        '注意周围的声音——远近、高低、连续或间断',
        '注意想法的来去——像云一样，不抓取也不推开',
        '感受这个当下的完整性——什么都不缺'
      ],
      prompts: [
        '此刻，你的身体感受到了什么？',
        '此刻，有什么声音？',
        '此刻，有什么想法在流动？',
        '如果这个当下就是全部，它完整吗？'
      ],
      integration: '每天练习 3-5 次，每次 1-2 分钟，培养临在习惯'
    },

    /**
     * 时间透视练习
     * 扩展心理时间视野
     */
    temporalPerspective: {
      name: '时间透视',
      description: '扩展心理时间视野，培养长远视角',
      duration: '15-20 分钟',
      perspectives: [
        {
          timeframe: '1 天后',
          questions: [
            '明天这个时候，你希望完成什么？',
            '什么是最重要的优先事项？'
          ]
        },
        {
          timeframe: '1 周后',
          questions: [
            '一周后，你希望这周如何被记住？',
            '什么进展会让你感到满意？'
          ]
        },
        {
          timeframe: '1 月后',
          questions: [
            '一个月后，你希望看到什么变化？',
            '什么习惯或项目会有进展？'
          ]
        },
        {
          timeframe: '1 年后',
          questions: [
            '一年后，你希望自己的生活有什么不同了？',
            '什么是最重要的成长领域？'
          ]
        },
        {
          timeframe: '5 年后',
          questions: [
            '五年后，你希望成为什么样的人？',
            '什么价值会指引你？'
          ]
        },
        {
          timeframe: '生命终点',
          questions: [
            '在生命终点回望，什么是最重要的？',
            '你希望被记住什么？',
            '什么 Legacy 你想留下？'
          ]
        }
      ],
      integration: '从最长远的时间框架开始，逐步回到现在，带着长远视角做当下决定'
    },

    /**
     * 时间流日记
     * 记录时间体验的流动
     */
    temporalFlowJournal: {
      name: '时间流日记',
      description: '记录每天的时间体验流，增强时间意识',
      duration: '每日 10 分钟',
      structure: {
        morning: {
          title: '晨间预期',
          prompts: [
            '今天我最期待什么？',
            '我希望对今天保持什么样的临在感？',
            '什么可能挑战我的时间感？'
          ]
        },
        evening: {
          title: '晚间回顾',
          prompts: [
            '今天的哪个时刻我最临在？',
            '哪个时刻我被过去或未来拉走了？',
            '今天的时间体验教会了我什么？',
            '我如何感谢今天的自己？'
          ]
        }
      }
    }
  },

  /**
   * 时间连续性评估 (Temporal Continuity Assessment)
   * 基于 SEP 时间连续性理论的 5 维度评估系统
   */
  continuityAssessment: {
    /**
     * 评估维度定义
     */
    dimensions: {
      coherence: {
        name: '时间连贯性',
        description: '过去 - 现在 - 未来的心理连接感',
        weight: 0.3,
        indicators: {
          high: ['连续', '连接', '延续', '一直', '始终'],
          low: ['断裂', '碎片', '突然', '中断', '分离']
        }
      },
      depth: {
        name: '时间深度',
        description: '心理时间视野的广度',
        weight: 0.2,
        levels: [
          { range: [0, 1], name: '瞬间导向', description: '只关注当下即刻' },
          { range: [2, 3], name: '短期导向', description: '数小时到数天' },
          { range: [4, 5], name: '中期导向', description: '数周到数月' },
          { range: [6, 8], name: '长期导向', description: '数年到数十年' },
          { range: [9, 10], name: '超越导向', description: '超越个人生命' }
        ]
      },
      flow: {
        name: '时间流动性',
        description: '体验的流动感 vs 碎片化',
        weight: 0.2,
        indicators: {
          high: ['流动', '流畅', '自然', '连续'],
          low: ['卡顿', '阻塞', '跳跃', '断裂']
        }
      },
      direction: {
        name: '时间方向感',
        description: '对未来的清晰度和方向感',
        weight: 0.15,
        indicators: {
          high: ['方向', '目标', '计划', '愿景'],
          low: ['迷茫', '不确定', '随机', '被动']
        }
      },
      integration: {
        name: '时间整合度',
        description: '过去 - 现在 - 未来的整合程度',
        weight: 0.15,
        indicators: {
          high: ['整合', '和谐', '统一', '平衡'],
          low: ['冲突', '分裂', '矛盾', '失衡']
        }
      }
    },

    /**
     * 评估时间连续性
     */
    assess: function(narrative) {
      const scores = {};
      const dims = this.dimensions;

      // 评估连贯性
      let coherenceScore = 5;
      dims.coherence.indicators.high.forEach(word => {
        if (narrative.includes(word)) coherenceScore += 0.5;
      });
      dims.coherence.indicators.low.forEach(word => {
        if (narrative.includes(word)) coherenceScore -= 0.5;
      });
      scores.coherence = Math.max(0, Math.min(10, coherenceScore));

      // 评估深度 (简化版)
      scores.depth = this._estimateDepth(narrative);

      // 评估流动性
      let flowScore = 5;
      dims.flow.indicators.high.forEach(word => {
        if (narrative.includes(word)) flowScore += 0.5;
      });
      dims.flow.indicators.low.forEach(word => {
        if (narrative.includes(word)) flowScore -= 0.5;
      });
      scores.flow = Math.max(0, Math.min(10, flowScore));

      // 评估方向感
      let directionScore = 5;
      dims.direction.indicators.high.forEach(word => {
        if (narrative.includes(word)) directionScore += 0.5;
      });
      dims.direction.indicators.low.forEach(word => {
        if (narrative.includes(word)) directionScore -= 0.5;
      });
      scores.direction = Math.max(0, Math.min(10, directionScore));

      // 评估整合度
      let integrationScore = 5;
      dims.integration.indicators.high.forEach(word => {
        if (narrative.includes(word)) integrationScore += 0.5;
      });
      dims.integration.indicators.low.forEach(word => {
        if (narrative.includes(word)) integrationScore -= 0.5;
      });
      scores.integration = Math.max(0, Math.min(10, integrationScore));

      // 计算总分
      const totalScore = 
        scores.coherence * dims.coherence.weight +
        scores.depth * dims.depth.weight +
        scores.flow * dims.flow.weight +
        scores.direction * dims.direction.weight +
        scores.integration * dims.integration.weight;

      return {
        scores,
        totalScore: Math.round(totalScore * 10) / 10,
        level: this._getLevel(totalScore),
        interpretation: this._interpretScore(totalScore),
        recommendations: this._recommendInterventions(scores)
      };
    },

    _estimateDepth: function(narrative) {
      let depth = 5;
      if (narrative.includes('一生') || narrative.includes('遗产') || narrative.includes('永恒')) depth = 9;
      else if (narrative.includes('年') || narrative.includes('未来') || narrative.includes('规划')) depth = 7;
      else if (narrative.includes('月') || narrative.includes('季度')) depth = 5;
      else if (narrative.includes('周') || narrative.includes('这周')) depth = 3;
      else if (narrative.includes('天') || narrative.includes('今天')) depth = 2;
      else if (narrative.includes('此刻') || narrative.includes('马上')) depth = 1;
      return depth;
    },

    _getLevel: function(score) {
      if (score >= 7) return { name: '高连续性', description: '时间体验流畅整合' };
      if (score >= 4) return { name: '中等连续性', description: '部分整合，有改善空间' };
      return { name: '低连续性', description: '时间体验碎片化，需要支持' };
    },

    _interpretScore: function(score) {
      if (score >= 7) return '你的时间体验显示出良好的连续性和整合度。过去、现在、未来在你心中形成了有机的整体，这为你提供了稳定的身份感和方向感。';
      if (score >= 4) return '你的时间体验有一定的连续性，但在某些维度上可能存在断裂。通过针对性练习，你可以进一步增强时间整合感。';
      return '你的时间体验可能比较碎片化，过去、现在、未来之间缺乏清晰的连接。建议从时间锚定练习开始，逐步建立时间连续性感。';
    },

    _recommendInterventions: function(scores) {
      const recommendations = [];
      
      if (scores.coherence < 5) {
        recommendations.push({
          area: '时间连贯性',
          exercise: '时间锚定练习',
          description: '建立过去 - 现在 - 未来的心理连续性'
        });
      }
      if (scores.depth < 5) {
        recommendations.push({
          area: '时间深度',
          exercise: '时间透视练习',
          description: '扩展心理时间视野'
        });
      }
      if (scores.flow < 5) {
        recommendations.push({
          area: '时间流动性',
          exercise: '当下临在练习',
          description: '培养流畅的当下体验'
        });
      }
      if (scores.direction < 5) {
        recommendations.push({
          area: '时间方向感',
          exercise: '预期想象练习',
          description: '构建积极的未来图景'
        });
      }
      if (scores.integration < 5) {
        recommendations.push({
          area: '时间整合度',
          exercise: '回忆整合练习',
          description: '整合过去经历的时间意义'
        });
      }

      return recommendations.length > 0 ? recommendations : [
        { area: '整体', exercise: '时间流日记', description: '持续记录和反思时间体验' }
      ];
    }
  },

  /**
   * 现象学还原方法 (Phenomenological Reduction)
   * 基于 Husserl 现象学的时间意识探索技术
   */
  phenomenologicalReduction: {
    /**
     * 四步还原流程
     */
    steps: [
      {
        step: 1,
        name: '悬置 (Epoché)',
        description: '暂停对时间的自然态度假设',
        instructions: [
          '暂时放下你对时间的日常理解（如"时间是线性的"、"时间流逝"等）',
          '不预设过去、现在、未来的存在方式',
          '回到体验本身，不加评判地观察'
        ],
        prompts: [
          '如果放下所有关于时间的概念，你的直接体验是什么？',
          '不带任何理论框架，此刻的体验如何呈现？'
        ]
      },
      {
        step: 2,
        name: '本质直观 (Eidetic Intuition)',
        description: '想象变化中的不变结构',
        instructions: [
          '想象不同的时间体验场景（快乐时、痛苦时、专注时）',
          '寻找这些体验中不变的结构要素',
          '什么使得时间体验成为时间体验？'
        ],
        prompts: [
          '在所有时间体验中，什么是不变的？',
          '时间体验的本质结构是什么？'
        ]
      },
      {
        step: 3,
        name: '内在时间意识分析',
        description: '关注意识流的结构',
        instructions: [
          '注意当下的直接体验（原初印象）',
          '注意刚刚过去的持存（保留）',
          '注意即将到来的预期（预期）',
          '感受这三者如何构成"活生生的现在"'
        ],
        prompts: [
          '此刻的体验如何包含刚刚过去的痕迹？',
          '此刻的体验如何指向即将到来的？',
          '这三者如何构成一个整体？'
        ]
      },
      {
        step: 4,
        name: '主体间性检验',
        description: '与他人对比时间体验',
        instructions: [
          '与他人分享你的时间体验描述',
          '倾听他人的时间体验',
          '识别共同结构和个体差异'
        ],
        prompts: [
          '他人的时间体验与你有什么共同点？',
          '什么可能是普遍的时间意识结构？'
        ]
      }
    ],

    /**
     * 引导式还原练习
     */
    guide: function(topic = '时间体验') {
      return {
        topic,
        steps: this.steps,
        estimatedDuration: '20-30 分钟',
        guidelines: [
          '找一个安静不被打扰的空间',
          '准备纸笔记录体验',
          '不急于得出结论，让体验自然呈现',
          '可以分多次完成，每次专注一个步骤'
        ]
      };
    },

    /**
     * 悬置练习
     */
    epoché: function() {
      return {
        name: '悬置练习',
        duration: '5-10 分钟',
        instructions: [
          '舒适地坐下，闭上眼睛',
          '注意你对时间的日常假设（"时间在流逝"、"我在变老"等）',
          '将这些假设放在一边，如同把它们放在括号里',
          '回到纯粹的当下体验',
          '注意不带概念的体验是什么样的'
        ],
        reflection: [
          '放下时间概念后，体验有什么变化？',
          '什么体验是直接给予的，什么是概念添加的？'
        ]
      };
    },

    /**
     * 本质直观练习
     */
    eideticIntuition: function() {
      return {
        name: '本质直观练习',
        duration: '10-15 分钟',
        variations: [
          {
            scenario: '想象等待的时刻',
            questions: ['时间如何呈现？', '体验的结构是什么？']
          },
          {
            scenario: '想象沉浸的时刻',
            questions: ['时间如何呈现？', '体验的结构是什么？']
          },
          {
            scenario: '想象震惊的时刻',
            questions: ['时间如何呈现？', '体验的结构是什么？']
          }
        ],
        synthesis: '比较三种场景，寻找不变的时间意识结构'
      };
    }
  },

  /**
   * 自我意识与时间意识关联框架
   */
  selfAwareness: {
    /**
     * 关联维度
     */
    dimensions: {
      prereflective: {
        name: '前反思自我意识',
        temporalBasis: '原初印象的自身给予性',
        description: '在反思之前就已经存在的自我觉知',
        clinical: '基础存在感'
      },
      narrative: {
        name: '叙事自我',
        temporalBasis: '时间连贯性的建构',
        description: '通过生命故事构建的身份感',
        clinical: '身份连续感'
      },
      agency: {
        name: '能动自我',
        temporalBasis: '预期结构的实现',
        description: '基于未来预期的行动能力',
        clinical: '控制感和意图'
      },
      social: {
        name: '社会自我',
        temporalBasis: '主体间时间协调',
        description: '与他人时间节奏的同步',
        clinical: '关系同步感'
      }
    },

    /**
     * 评估自我连续性
     */
    assessContinuity: function() {
      return {
        formula: '自我连续性 = 时间连贯性 × 叙事整合 × 身体连续性',
        dimensions: [
          { name: '时间连贯性', weight: 0.4, assessment: '过去 - 现在 - 未来的连接感' },
          { name: '叙事整合', weight: 0.35, assessment: '生命故事的连贯性' },
          { name: '身体连续性', weight: 0.25, assessment: '身体体验的持续感' }
        ],
        interpretation: '高自我连续性意味着稳定的身份感和存在感，低自我连续性可能与解离、身份混乱相关'
      };
    },

    /**
     * 链接到时间体验
     */
    linkToTemporalExperience: function(experience) {
      const links = [];
      
      if (experience.includes('我') || experience.includes('自己')) {
        links.push({
          aspect: '自我指涉',
          temporalDimension: '前反思自我意识',
          insight: '自我指涉显示时间体验总是"我的"体验'
        });
      }
      if (experience.includes('变化') || experience.includes('成长')) {
        links.push({
          aspect: '自我变化',
          temporalDimension: '叙事自我',
          insight: '变化感预设了跨时间的身份连续性'
        });
      }
      if (experience.includes('选择') || experience.includes('决定')) {
        links.push({
          aspect: '能动性',
          temporalDimension: '能动自我',
          insight: '选择预设了对未来的预期和影响力'
        });
      }

      return {
        experience,
        links,
        synthesis: links.length > 0 
          ? '你的描述显示了自我意识与时间意识的深层关联'
          : '请分享更多关于你的体验，以便探索自我 - 时间关联'
      };
    }
  },

  /**
   * 时间感知的神经科学基础
   */
  neuroscience: {
    /**
     * 时间处理系统
     */
    timeScales: {
      milliseconds: {
        range: '<300ms',
        mechanism: '感觉皮层振荡',
        function: '同时性感知',
        example: '判断两个声音是否同时发生'
      },
      seconds: {
        range: '300ms-3s',
        mechanism: '基底节 - 小脑回路',
        function: '运动时序、节奏感知',
        example: '跟随音乐节拍、估计短时长'
      },
      minutesPlus: {
        range: '3 分钟以上',
        mechanism: '前额叶 - 海马网络',
        function: '情景记忆、规划、自传体时间',
        example: '回忆昨天、计划下周'
      }
    },

    /**
     * 解释时间感知
     */
    explainTimePerception: function(scale) {
      const scales = this.timeScales;
      
      if (scale === '毫秒' || scale === '瞬间') {
        return {
          scale: scales.milliseconds,
          insight: '毫秒级时间处理是自动的、前意识的，由感觉皮层的神经振荡实现'
        };
      }
      if (scale === '秒' || scale === '短时') {
        return {
          scale: scales.seconds,
          insight: '秒级时间处理涉及运动系统和注意力，多巴胺水平影响时间估计准确性'
        };
      }
      if (scale === '分钟' || scale === '长时') {
        return {
          scale: scales.minutesPlus,
          insight: '分钟以上的时间处理依赖记忆和认知系统，与自我意识和情景记忆紧密相关'
        };
      }
      
      return {
        allScales: scales,
        insight: '不同时间尺度由不同神经机制处理，从自动的感觉振荡到复杂的认知网络'
      };
    },

    /**
     * 解释时间幻觉
     */
    explainTemporalIllusion: function(type) {
      const illusions = {
        '时间膨胀': {
          description: '感觉时间变慢',
          mechanism: '杏仁核激活增强，注意力高度集中',
          context: '创伤、危险、新奇体验',
          example: '车祸瞬间感觉像慢动作'
        },
        '时间压缩': {
          description: '感觉时间变快',
          mechanism: '多巴胺水平变化，注意力分散',
          context: '愉悦体验、药物影响、专注状态',
          example: '快乐时光总是过得很快'
        },
        '时间停滞': {
          description: '感觉时间停止',
          mechanism: '去甲肾上腺素激增，记忆编码增强',
          context: '危机时刻、极度震惊',
          example: '听到噩耗的瞬间'
        },
        '时间跳跃': {
          description: '感觉时间有空白',
          mechanism: '记忆编码中断，注意力转移',
          context: '解离、创伤、麻醉',
          example: '酒后断片、解离发作'
        }
      };

      return illusions[type] || {
        available: Object.keys(illusions),
        message: '请指定时间幻觉类型：时间膨胀、时间压缩、时间停滞、时间跳跃'
      };
    }
  },

  /**
   * 时间意识评估工具
   */
  assessmentTools: {
    /**
     * 评估时间整合状态
     */
    assessIntegration: function(userInput) {
      const pastIndicators = ['过去', '曾经', '以前', '后悔', '怀念', '回忆', '当初', '那时候'];
      const futureIndicators = ['将来', '以后', '希望', '担心', '计划', '期待', '害怕', '如果'];
      const presentIndicators = ['现在', '此刻', '当下', '今天', '正在', '此时', '这里'];

      let pastScore = 0;
      let futureScore = 0;
      let presentScore = 0;

      pastIndicators.forEach(word => {
        if (userInput.includes(word)) pastScore++;
      });
      futureIndicators.forEach(word => {
        if (userInput.includes(word)) futureScore++;
      });
      presentIndicators.forEach(word => {
        if (userInput.includes(word)) presentScore++;
      });

      const total = pastScore + futureScore + presentScore;
      if (total === 0) return { state: '需要更多信息', suggestion: '请分享更多关于你的时间体验' };

      const pastRatio = pastScore / total;
      const futureRatio = futureScore / total;
      const presentRatio = presentScore / total;

      let state = '';
      let suggestion = '';

      if (pastRatio > 0.5) {
        state = '过去导向';
        suggestion = '你似乎较多关注过去。尝试一些当下临在练习可能有助于平衡时间感。';
      } else if (futureRatio > 0.5) {
        state = '未来导向';
        suggestion = '你似乎较多关注未来。尝试时间锚定练习可以帮助你连接当下。';
      } else if (presentRatio > 0.4) {
        state = '当下整合';
        suggestion = '你的时间感比较平衡，继续保持这种整合状态。';
      } else {
        state = '混合导向';
        suggestion = '你的时间关注比较分散，时间锚定练习可能帮助你建立连续性。';
      }

      return {
        state,
        suggestion,
        scores: { past: pastRatio, future: futureRatio, present: presentRatio }
      };
    },

    /**
     * 评估时间深度
     */
    assessTemporalDepth: function(planningHorizon) {
      const depthLevels = {
        '今天': 1,
        '这周': 2,
        '这个月': 3,
        '今年': 4,
        '几年后': 4,
        '一生': 5,
        '超越生命': 5
      };

      let score = 1;
      Object.keys(depthLevels).forEach(key => {
        if (planningHorizon.includes(key)) {
          score = Math.max(score, depthLevels[key]);
        }
      });

      const levels = this.dimensions.temporalDepth.levels;
      const level = levels.find(l => l.level === score) || levels[0];

      return {
        score,
        level: level.name,
        description: level.description,
        suggestion: `你的时间深度处于"${level.name}"水平。${level.characteristics.join('、')}`
      };
    }
  },

  /**
   * 与用户交互的主函数 (v3.37.0 Enhanced)
   */
  interact: function(userInput, context = {}) {
    const response = {
      module: '时间意识 (v3.37.0)',
      understanding: '',
      guidance: '',
      exercise: null,
      assessment: null,
      feedback: ''
    };

    const input = userInput.toLowerCase();

    // 检测是否需要模型分析
    if (input.includes('体验') || input.includes('感觉') || input.includes('感受')) {
      const modelAnalysis = this.models.compare(userInput);
      response.understanding = '让我分析你的时间体验模式...';
      response.assessment = { type: '时间意识模型', result: modelAnalysis };
      response.guidance = modelAnalysis.recommendation;
      response.exercise = this._getExerciseForModel(modelAnalysis.dominantModel);
    }
    // 检测是否需要连续性评估
    else if (input.includes('连续') || input.includes('碎片') || input.includes('断裂') || input.includes('整合')) {
      const continuityAssessment = this.continuityAssessment.assess(userInput);
      response.understanding = '让我评估你的时间连续性...';
      response.assessment = { type: '时间连续性', result: continuityAssessment };
      response.guidance = continuityAssessment.interpretation;
      response.exercise = continuityAssessment.recommendations[0]?.exercise || this.exercises.temporalAnchoring;
    }
    // 原有逻辑
    else if (input.includes('过去') || input.includes('回忆') || input.includes('后悔') || input.includes('怀念')) {
      response.understanding = '你正在思考过去的经历，这是时间意识的重要部分。';
      response.exercise = this.exercises.memoryIntegration;
      response.guidance = '让我们一起探索过去经历如何塑造了现在的你，以及它可能蕴含的时间礼物。';
    } else if (input.includes('未来') || input.includes('担心') || input.includes('希望') || input.includes('计划')) {
      response.understanding = '你在思考未来，这显示了你的前瞻性思维。';
      response.exercise = this.exercises.protentionImagination;
      response.guidance = '让我们一起构建积极的未来图景，同时保持与当下的联结。';
    } else if (input.includes('现在') || input.includes('当下') || input.includes('焦虑') || input.includes('匆忙')) {
      response.understanding = '你关注当下的体验，这是时间意识的核心。';
      response.exercise = this.exercises.presentPresence;
      response.guidance = '让我们一起培养深度的当下临在感，超越时间焦虑。';
    } else if (input.includes('时间') || input.includes('现象学') || input.includes('还原')) {
      response.understanding = '你想探索时间的本质或现象学方法。';
      response.exercise = this.phenomenologicalReduction.guide();
      response.guidance = '现象学还原可以帮助你回到时间体验本身，放下概念预设。';
    } else if (input.includes('自我') || input.includes('身份') || input.includes('我是')) {
      response.understanding = '你在探索自我与时间的关系。';
      const selfLink = this.selfAwareness.linkToTemporalExperience(userInput);
      response.assessment = { type: '自我 - 时间关联', result: selfLink };
      response.guidance = selfLink.synthesis;
      response.exercise = this.exercises.temporalAnchoring;
    } else {
      response.understanding = '时间意识是我们体验自我和世界的基本维度。';
      response.guidance = '你可以探索：\n1. 时间意识模型分析 - 识别你的时间体验模式\n2. 时间连续性评估 - 评估时间整合程度\n3. 时间锚定 - 连接过去现在未来\n4. 现象学还原 - 探索时间体验本质\n5. 预期想象 - 构建积极未来\n6. 回忆整合 - 理解过去意义\n7. 当下临在 - 培养深度临在感\n\n你想从哪个开始？';
    }

    return response;
  },

  _getExerciseForModel: function(model) {
    const exerciseMap = {
      '电影模型': this.exercises.presentPresence,
      '保留模型': this.phenomenologicalReduction.guide(),
      '延展模型': this.exercises.temporalPerspective,
      '未确定': this.exercises.temporalAnchoring
    };
    return exerciseMap[model] || this.exercises.temporalAnchoring;
  },

  /**
   * 导出模块
   */
  export: function() {
    return {
      meta: this.meta,
      dimensions: Object.keys(this.dimensions),
      exercises: Object.keys(this.exercises),
      interact: this.interact.bind(this),
      assessIntegration: this.assessmentTools.assessIntegration,
      assessTemporalDepth: this.assessmentTools.assessTemporalDepth
    };
  }
};

module.exports = TemporalConsciousness;
