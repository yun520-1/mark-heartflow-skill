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
    version: '1.0.0',
    source: 'SEP Temporal Consciousness & Phenomenology',
    description: '基于现象学时间意识的自我整合与成长模块'
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
   * 与用户交互的主函数
   */
  interact: function(userInput, context = {}) {
    const response = {
      module: '时间意识',
      understanding: '',
      guidance: '',
      exercise: null,
      feedback: ''
    };

    const input = userInput.toLowerCase();

    if (input.includes('过去') || input.includes('回忆') || input.includes('后悔') || input.includes('怀念')) {
      response.understanding = '你正在思考过去的经历，这是时间意识的重要部分。';
      response.exercise = this.exercises.memoryIntegration;
      response.guidance = '让我们一起探索过去经历如何塑造了现在的你，以及它可能蕴含的时间礼物。';
    } else if (input.includes('未来') || input.includes('担心') || input.includes('希望') || input.includes('计划')) {
      response.understanding = '你在思考未来，这显示了你的前瞻性思维。';
      response.exercise = this.exercises.protentionImagination;
      response.guidance = '让我们一起构建积极的未来图景，同时保持与当下的联结。';
    } else if (input.includes('现在') || input.includes'当下') || input.includes('焦虑') || input.includes('匆忙')) {
      response.understanding = '你关注当下的体验，这是时间意识的核心。';
      response.exercise = this.exercises.presentPresence;
      response.guidance = '让我们一起培养深度的当下临在感，超越时间焦虑。';
    } else if (input.includes('时间') || input.includes('连续') || input.includes('整合')) {
      response.understanding = '你想探索时间的整体性，这是自我整合的深层维度。';
      response.exercise = this.exercises.temporalAnchoring;
      response.guidance = '让我们一起连接过去、现在、未来，体验时间的完整性。';
    } else {
      response.understanding = '时间意识是我们体验自我和世界的基本维度。';
      response.guidance = '你可以探索：\n1. 时间锚定 - 连接过去现在未来\n2. 预期想象 - 构建积极未来\n3. 回忆整合 - 理解过去意义\n4. 当下临在 - 培养深度临在感\n5. 时间透视 - 扩展时间视野\n\n你想从哪个开始？';
    }

    return response;
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
