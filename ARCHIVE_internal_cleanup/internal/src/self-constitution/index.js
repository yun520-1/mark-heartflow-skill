/**
 * 自我构成模块 (Self-Constitution Module)
 * 
 * 基于 Stanford Encyclopedia of Philosophy 自我构成理论
 * 及 Christine Korsgaard 的权威理论
 * 
 * 核心理论：
 * - Korsgaard: 行动者通过行动构成自己
 * - 实践同一性 (Practical Identity) 是自我构成的核心
 * - 自我构成是一个持续的过程，而非固定状态
 * - 行动的统一性原则来自行动者自身
 * - 反思性认可 (Reflective Endorsement) 是自我构成的关键
 * 
 * 可操作技术：
 * - 实践同一性探索：识别定义自我的角色和承诺
 * - 自我构成评估：评估行动与自我的一致性
 * - 反思性认可练习：审视并认可/修正自己的动机
 * - 行动统一性训练：整合分散的行动为连贯整体
 * - 自我构成障碍识别：识别阻碍自我构成的因素
 * 
 * @module self-constitution
 * @version 3.50.0
 */

const SelfConstitution = {
  /**
   * 模块元信息
   */
  meta: {
    name: '自我构成',
    englishName: 'Self-Constitution',
    version: '3.50.0',
    source: 'SEP Self-Constitution + Korsgaard (1996, 2009) + Frankfurt (1988) + Velleman (2000)',
    description: '基于 Korsgaard 自我构成理论的自我理解与整合模块',
    keywords: ['自我构成', '实践同一性', '反思性认可', '行动统一性', '能动性']
  },

  /**
   * 核心理论框架
   */
  theory: {
    /**
     * Korsgaard 自我构成理论核心主张
     */
    coreClaims: [
      '行动不是发生在行动者身上的事情，而是行动者做的事情',
      '通过行动，我们构成自己作为行动者的身份',
      '自我构成是一个持续的过程，需要不断的反思和整合',
      '实践同一性提供了行动的规范和理由',
      '反思性认可能力是人类能动性的核心特征'
    ],

    /**
     * 实践同一性的层次 (Levels of Practical Identity)
     */
    identityLevels: {
      /**
       * 1. 人类同一性 (Human Identity)
       * 最基础的层次：作为人类的共同特征
       */
      human: {
        name: '人类同一性',
        description: '作为人类的基本身份，共享理性、反思能力、道德敏感性',
        norms: [
          '追求真理和理解',
          '维护尊严和尊重',
          '发展理性和智慧',
          '培养关系和联结',
          '创造意义和价值'
        ],
        questions: [
          '作为人类，什么对我来说是重要的？',
          '我如何运用我的理性能力？',
          '我如何对待自己和他人的人性？'
        ]
      },

      /**
       * 2. 社会同一性 (Social Identities)
       * 由社会关系和角色定义的身份
       */
      social: {
        name: '社会同一性',
        description: '由社会关系、角色和群体成员身份定义的身份',
        examples: [
          '家庭角色：父母、子女、兄弟姐妹',
          '职业角色：医生、教师、工程师',
          '社会角色：朋友、公民、志愿者',
          '群体身份：文化、宗教、政治群体'
        ],
        questions: [
          '我的社会角色有哪些？',
          '这些角色对我意味着什么？',
          '角色之间有冲突吗？如何整合？'
        ]
      },

      /**
       * 3. 个人同一性 (Personal Identity)
       * 独特的个人特征、价值观和承诺
       */
      personal: {
        name: '个人同一性',
        description: '区别于他人的独特特征、价值观、兴趣和承诺',
        dimensions: [
          '核心价值观：什么对我来说最重要',
          '人生目标：我想成为什么样的人',
          '个人承诺：我对自己和他人的承诺',
          '独特特质：我的天赋、兴趣、风格'
        ],
        questions: [
          '什么价值观定义了我？',
          '我的人生目标是什么？',
          '我对什么做出了承诺？',
          '什么让我与众不同？'
        ]
      },

      /**
       * 4. 道德同一性 (Moral Identity)
       * 道德承诺和伦理原则
       */
      moral: {
        name: '道德同一性',
        description: '由道德承诺、伦理原则和正义感定义的身份',
        elements: [
          '道德原则：我遵循的伦理准则',
          '道德承诺：对他人的道德义务',
          '正义感：对公平和正义的理解',
          '道德理想：我想成为的道德典范'
        ],
        questions: [
          '我的核心道德原则是什么？',
          '我对谁负有道德义务？',
          '什么是不惜代价也要坚持的？',
          '我的道德理想是什么？'
        ]
      }
    },

    /**
     * 自我构成的条件 (Conditions of Self-Constitution)
     */
    conditions: {
      /**
       * 1. 反思能力 (Reflective Capacity)
       */
      reflection: {
        name: '反思能力',
        description: '审视自己的欲望、信念和动机的能力',
        components: [
          '元认知：思考自己的思考',
          '动机审视：问"我为什么想要这个？"',
          '价值评估：评估欲望的价值',
          '距离感：与冲动保持心理距离'
        ],
        exercises: [
          '每日反思：今天我为什么做了那些选择？',
          '动机探索：这个欲望来自哪里？',
          '价值对齐：这个选择符合我的价值观吗？'
        ]
      },

      /**
       * 2. 反思性认可 (Reflective Endorsement)
       */
      endorsement: {
        name: '反思性认可',
        description: '经过反思后认可某些动机作为行动的根据',
        process: [
          '识别动机：我有什么样的行动冲动？',
          '反思评估：这个动机值得追随吗？',
          '认可/拒绝：我决定认同还是拒绝这个动机？',
          '整合：将认可的动机整合进自我'
        ],
        criteria: [
          '与核心价值观一致',
          '促进长期福祉',
          '维护重要关系',
          '符合道德原则'
        ]
      },

      /**
       * 3. 行动统一性 (Action Unity)
       */
      unity: {
        name: '行动统一性',
        description: '将分散的行动整合为连贯的整体',
        requirements: [
          '时间连续性：行动在时间上保持连贯',
          '主题一致性：行动围绕共同主题',
          '价值一致性：行动反映共同价值',
          '叙事连贯性：行动构成有意义的故事'
        ],
        indicators: [
          '我能解释为什么做这些事',
          '行动之间有逻辑联系',
          '回顾时看到整体模式',
          '他人能理解我的人生方向'
        ]
      },

      /**
       * 4. 自我立法 (Self-Legislation)
       */
      legislation: {
        name: '自我立法',
        description: '为自己制定行动原则和规范',
        aspects: [
          '原则制定：我遵循什么原则？',
          '规范内化：将外部规范转化为内在承诺',
          '自我约束：对自己施加约束',
          '责任承担：为自己的选择负责'
        ],
        examples: [
          '我承诺诚实，即使困难',
          '我选择终身学习',
          '我坚持每周锻炼',
          '我优先考虑家庭时间'
        ]
      }
    },

    /**
     * 自我构成的障碍 (Obstacles to Self-Constitution)
     */
    obstacles: {
      /**
       * 1. 意志薄弱 (Akrasia/Weakness of Will)
       */
      akrasia: {
        name: '意志薄弱',
        description: '明知应该做 X 却做了 Y',
        causes: [
          '即时满足的诱惑',
          '情绪压倒理性',
          '习惯的力量',
          '自我调节能力不足'
        ],
        interventions: [
          '预承诺策略：提前限制选择',
          '情境管理：避免诱惑情境',
          '正念练习：增强觉察力',
          '自我同情：减少自我批评'
        ]
      },

      /**
       * 2. 自我欺骗 (Self-Deception)
       */
      selfDeception: {
        name: '自我欺骗',
        description: '对自己隐藏真实的动机或事实',
        forms: [
          '合理化：为不当行为找借口',
          '否认：拒绝承认不舒服的事实',
          '投射：将自己的问题归因于他人',
          '选择性注意：只看支持自己观点的信息'
        ],
        interventions: [
          '寻求反馈：请他人提供诚实反馈',
          '写日记：记录真实想法',
          '反思练习：问"我在逃避什么？"',
          '培养好奇心：对真相保持开放'
        ]
      },

      /**
       * 3. 同一性混乱 (Identity Confusion)
       */
      identityConfusion: {
        name: '同一性混乱',
        description: '不清楚自己是谁、想要什么',
        causes: [
          '角色冲突：不同角色要求矛盾',
          '价值观冲突：内在价值相互矛盾',
          '生活转变：重大变化打乱原有认同',
          '外部压力：他人期望与自我不符'
        ],
        interventions: [
          '价值观澄清：识别核心价值',
          '角色整合：寻找角色的共同点',
          '生命叙事：整合过去现在未来',
          '减少噪音：减少外部意见干扰'
        ]
      },

      /**
       * 4. 异化 (Alienation)
       */
      alienation: {
        name: '异化',
        description: '感到自己的行为不属于自己',
        forms: [
          '工作异化：工作感觉没有意义',
          '关系异化：关系中失去自我',
          '身体异化：与身体感受脱节',
          '自我异化：感到"这不是真正的我"'
        ],
        interventions: [
          '意义重建：寻找活动的个人意义',
          '边界设立：在关系中保持自我',
          '身体连接：重新连接身体感受',
          '真实性练习：做"真正的自己"'
        ]
      }
    }
  },

  /**
   * 自我构成评估工具
   */
  assessment: {
    /**
     * 实践同一性清晰度评估
     */
    assessIdentityClarity: function() {
      const questions = [
        {
          domain: '人类同一性',
          questions: [
            '我能清楚表达作为人类对我来说意味着什么',
            '我知道如何运用我的理性能力',
            '我理解自己的人性需求'
          ]
        },
        {
          domain: '社会同一性',
          questions: [
            '我能清楚列出我的主要社会角色',
            '我知道每个角色对我的意义',
            '我能处理角色之间的冲突'
          ]
        },
        {
          domain: '个人同一性',
          questions: [
            '我能清楚表达我的核心价值观',
            '我知道自己的人生目标',
            '我了解自己的独特特质'
          ]
        },
        {
          domain: '道德同一性',
          questions: [
            '我能清楚表达我的道德原则',
            '我知道自己的道德承诺',
            '我有清晰的道德理想'
          ]
        }
      ];

      return {
        framework: questions,
        scoring: {
          5: '非常清晰',
          4: '比较清晰',
          3: '一般',
          2: '比较模糊',
          1: '非常模糊'
        },
        instructions: '对每个问题按 1-5 分评分，然后计算每个领域的平均分'
      };
    },

    /**
     * 自我构成完整性评估
     */
    assessConstitutionIntegrity: function() {
      const dimensions = [
        {
          name: '反思能力',
          indicators: [
            '我经常反思自己的动机和选择',
            '我能识别自己的情绪和欲望',
            '我会问"为什么我想要这个？"'
          ]
        },
        {
          name: '反思性认可',
          indicators: [
            '我能区分"我想要的"和"我想要想要的"',
            '我会拒绝某些冲动即使很强烈',
            '我的行动反映我认可的价值观'
          ]
        },
        {
          name: '行动统一性',
          indicators: [
            '我的行动在时间上保持连贯',
            '他人能理解我的人生方向',
            '我能看到自己行动的整体模式'
          ]
        },
        {
          name: '自我立法',
          indicators: [
            '我有清晰的行为原则',
            '我能对自己信守承诺',
            '我为自己的选择承担责任'
          ]
        }
      ];

      return {
        dimensions,
        scoring: '每个指标 1-5 分，计算每个维度的平均分',
        interpretation: {
          '4-5 分': '该维度发展良好',
          '3 分': '该维度有发展空间',
          '1-2 分': '该维度需要重点关注'
        }
      };
    },

    /**
     * 自我构成障碍筛查
     */
    screenObstacles: function() {
      const obstacles = [
        {
          type: '意志薄弱',
          questions: [
            '你是否经常明知应该做某事却做了别的？',
            '你是否事后后悔自己的选择？',
            '你是否感到无法控制自己的冲动？'
          ]
        },
        {
          type: '自我欺骗',
          questions: [
            '你是否曾为自己不当行为找借口？',
            '你是否避免思考某些 uncomfortable 的事实？',
            '他人是否曾说你对自己不够诚实？'
          ]
        },
        {
          type: '同一性混乱',
          questions: [
            '你是否不清楚自己真正想要什么？',
            '你是否感到不同角色之间有冲突？',
            '你是否经常改变自己的目标和价值观？'
          ]
        },
        {
          type: '异化',
          questions: [
            '你是否感到自己的工作没有意义？',
            '你是否在某些关系中失去自我？',
            '你是否有时感到"这不是真正的我"？'
          ]
        }
      ];

      return {
        obstacles,
        instructions: '对每个问题回答是/否，统计每个类型的"是"的数量',
        interpretation: {
          '3 个"是"': '该障碍可能显著影响你',
          '2 个"是"': '该障碍值得注意',
          '0-1 个"是"': '该障碍影响较小'
        }
      };
    }
  },

  /**
   * 自我构成练习
   */
  exercises: {
    /**
     * 实践同一性探索
     */
    explorePracticalIdentity: {
      name: '实践同一性探索',
      description: '系统探索定义你自我的各个层面',
      duration: '60-90 分钟',
      steps: [
        {
          step: 1,
          title: '人类同一性反思',
          prompts: [
            '作为人类，什么对我来说是重要的？',
            '我如何运用我的理性能力？',
            '我如何对待自己和他人的人性？',
            '我的人类潜能是什么？我如何发展它？'
          ]
        },
        {
          step: 2,
          title: '社会同一性地图',
          prompts: [
            '列出你所有的社会角色（家庭、职业、社会）',
            '每个角色对你意味着什么？',
            '哪些角色最重要？为什么？',
            '角色之间有冲突吗？如何整合？'
          ]
        },
        {
          step: 3,
          title: '个人同一性核心',
          prompts: [
            '我的 5 个核心价值观是什么？',
            '我想成为什么样的人？',
            '什么让我与众不同？',
            '我对什么做出了承诺？'
          ]
        },
        {
          step: 4,
          title: '道德同一性澄清',
          prompts: [
            '我的核心道德原则是什么？',
            '我对谁负有道德义务？',
            '什么是不惜代价也要坚持的？',
            '我的道德理想是什么？'
          ]
        },
        {
          step: 5,
          title: '整合反思',
          prompts: [
            '这些层面如何相互关联？',
            '有什么冲突或张力？',
            '如何整合为一个连贯的整体？',
            '下一步我想在哪个层面成长？'
          ]
        }
      ]
    },

    /**
     * 反思性认可练习
     */
    reflectiveEndorsement: {
      name: '反思性认可',
      description: '学习审视并认可/拒绝自己的动机',
      duration: '15-20 分钟/次',
      steps: [
        {
          step: 1,
          title: '识别动机',
          instruction: '选择一个你正在考虑的行动，识别背后的动机',
          prompts: [
            '我想做什么？',
            '我为什么想做这个？',
            '背后有什么欲望或冲动？'
          ]
        },
        {
          step: 2,
          title: '反思评估',
          instruction: '从旁观者角度审视这个动机',
          prompts: [
            '这个动机来自哪里？',
            '它服务于什么目的？',
            '它符合我的价值观吗？',
            '它会促进还是损害我的福祉？'
          ]
        },
        {
          step: 3,
          title: '认可决定',
          instruction: '决定是否认可这个动机',
          options: [
            '完全认可：这个动机值得追随',
            '部分认可：认可但需要调整',
            '不认可：这个动机不符合我的价值观'
          ]
        },
        {
          step: 4,
          title: '整合行动',
          instruction: '根据认可决定采取行动',
          actions: [
            '如果认可：制定行动计划',
            '如果部分认可：调整动机后行动',
            '如果不认可：选择不行动或寻找替代'
          ]
        }
      ]
    },

    /**
     * 行动统一性练习
     */
    actionUnity: {
      name: '行动统一性',
      description: '将分散的行动整合为连贯的整体',
      duration: '30-45 分钟',
      steps: [
        {
          step: 1,
          title: '行动清单',
          instruction: '列出你最近一周的主要行动',
          prompts: [
            '我花了时间做什么？',
            '我做出了哪些决定？',
            '我避免了什么？'
          ]
        },
        {
          step: 2,
          title: '寻找模式',
          instruction: '分析行动之间的关联',
          prompts: [
            '这些行动有什么共同主题？',
            '它们反映了什么价值观？',
            '行动之间有逻辑联系吗？'
          ]
        },
        {
          step: 3,
          title: '叙事构建',
          instruction: '将行动编织成一个故事',
          prompts: [
            '如果这是你人生故事的一章，标题是什么？',
            '这一章的主题是什么？',
            '它如何与前后章节连接？'
          ]
        },
        {
          step: 4,
          title: '调整计划',
          instruction: '基于分析调整未来行动',
          prompts: [
            '哪些行动需要增加？',
            '哪些行动需要减少？',
            '如何让行动更连贯？'
          ]
        }
      ]
    },

    /**
     * 自我立法练习
     */
    selfLegislation: {
      name: '自我立法',
      description: '为自己制定并信守行动原则',
      duration: '30 分钟 + 持续实践',
      steps: [
        {
          step: 1,
          title: '原则识别',
          instruction: '识别你已经遵循的原则',
          prompts: [
            '我始终坚持的原则有哪些？',
            '什么情况下我会违背原则？',
            '我的原则来自哪里？'
          ]
        },
        {
          step: 2,
          title: '原则制定',
          instruction: '制定新的行动原则',
          guidelines: [
            '原则应该是你真正认可的',
            '原则应该具体可操作',
            '原则应该符合你的价值观',
            '原则应该有适当弹性'
          ]
        },
        {
          step: 3,
          title: '承诺仪式',
          instruction: '正式承诺遵循原则',
          actions: [
            '写下你的原则',
            '向自己或他人宣读',
            '设定提醒和检查点',
            '计划如何应对挑战'
          ]
        },
        {
          step: 4,
          title: '持续实践',
          instruction: '在日常生活中实践原则',
          strategies: [
            '每日回顾：今天是否遵循原则？',
            '情境准备：预测可能的挑战',
            '自我同情：违背时温和地重新开始',
            '定期修订：根据需要调整原则'
          ]
        }
      ]
    },

    /**
     * 克服意志薄弱
     */
    overcomeAkrasia: {
      name: '克服意志薄弱',
      description: '增强自我调节，减少明知故犯',
      duration: '持续练习',
      strategies: [
        {
          name: '预承诺策略',
          description: '提前限制未来的选择',
          examples: [
            '把手机放在另一个房间',
            '提前准备健康餐食',
            '设定自动储蓄',
            '公开承诺目标'
          ]
        },
        {
          name: '情境管理',
          description: '避免或改变诱惑情境',
          examples: [
            '避开诱惑场所',
            '改变日常路线',
            '调整社交圈',
            '创造支持性环境'
          ]
        },
        {
          name: '正念觉察',
          description: '增强对冲动和欲望的觉察',
          practices: [
            '冲动来临时暂停呼吸',
            '观察欲望而不立即行动',
            '问"这个冲动会持续多久？"',
            '想象未来的自己'
          ]
        },
        {
          name: '自我同情',
          description: '用善意而非批评对待失败',
          practices: [
            '承认意志薄弱是人之常情',
            '避免过度自我批评',
            '从失败中学习',
            '温和地重新开始'
          ]
        }
      ]
    }
  },

  /**
   * 与用户交互的主函数
   */
  interact: function(userInput, context = {}) {
    const response = {
      module: '自我构成',
      understanding: '',
      guidance: '',
      exercise: null,
      assessment: null,
      feedback: ''
    };

    const input = userInput.toLowerCase();

    // 检测用户意图
    if (input.includes('我是谁') || input.includes('身份') || input.includes('角色')) {
      response.understanding = '你在探索自己的身份和角色，这是自我构成的核心问题。';
      response.exercise = this.exercises.explorePracticalIdentity;
      response.guidance = '让我们一起探索定义你自我的各个层面。你想从哪个层面开始？';
    } else if (input.includes('矛盾') || input.includes('冲突') || input.includes('不一致')) {
      response.understanding = '你感到内在有冲突或不一致，这是自我构成过程中的常见挑战。';
      response.assessment = this.assessment.screenObstacles();
      response.guidance = '让我们先了解可能阻碍你自我构成的因素，然后找到整合的方法。';
    } else if (input.includes('应该') || input.includes'但是') || input.includes('控制')) {
      response.understanding = '你正在经历意志薄弱的困扰，这是自我构成需要克服的障碍。';
      response.exercise = this.exercises.overcomeAkrasia;
      response.guidance = '意志薄弱是可以克服的。让我们探索一些有效的策略。';
    } else if (input.includes('意义') || input.includes('方向') || input.includes('目标')) {
      response.understanding = '你在寻找生活的意义和方向，这是自我构成的重要动力。';
      response.exercise = this.exercises.actionUnity;
      response.guidance = '让我们将你的行动整合为一个有意义的整体。';
    } else {
      response.understanding = '自我构成是一个持续的过程，通过行动我们成为自己。';
      response.guidance = '你可以：\n1. 探索实践同一性\n2. 练习反思性认可\n3. 整合行动统一性\n4. 制定自我立法\n5. 克服意志薄弱\n\n你想从哪个开始？';
    }

    return response;
  },

  /**
   * 导出模块
   */
  export: function() {
    return {
      meta: this.meta,
      theory: {
        coreClaims: this.theory.coreClaims,
        identityLevels: Object.keys(this.theory.identityLevels),
        conditions: Object.keys(this.theory.conditions),
        obstacles: Object.keys(this.theory.obstacles)
      },
      exercises: Object.keys(this.exercises),
      interact: this.interact.bind(this),
      assessIdentityClarity: this.assessment.assessIdentityClarity,
      assessConstitutionIntegrity: this.assessment.assessConstitutionIntegrity
    };
  }
};

module.exports = SelfConstitution;
