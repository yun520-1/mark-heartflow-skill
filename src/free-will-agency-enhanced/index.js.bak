/**
 * 自由意志与能动性模块增强版 (Free Will & Agency Module Enhanced)
 * 
 * 基于 Stanford Encyclopedia of Philosophy (SEP) Agency 理论
 * 
 * 版本：v3.34.0
 * 升级内容：
 * - 完整整合 SEP Agency 理论框架
 * - 添加五种能动性概念
 * - 添加实践推理结构
 * - 添加能动性缺陷与修复
 * 
 * @module free-will-agency-enhanced
 */

const FreeWillAgencyEnhanced = {
  /**
   * 模块元信息
   */
  meta: {
    name: '自由意志与能动性 (增强版)',
    version: '3.36.0',
    source: 'SEP Agency + Free Will + Intentionality + Moral Psychology + Frankfurt Cases + Akrasia',
    description: '基于 SEP 能动性理论的完整框架，支持五种能动性概念、自由意志理论、道德责任评估、Frankfurt Cases、意志薄弱干预与实践推理'
  },

  /**
   * 五种能动性概念 (Five Conceptions of Agency)
   * 基于 SEP Agency 理论框架
   */
  conceptions: {
    /**
     * 1. 标准能动性 (Standard Conception)
     * 来源：Anscombe (1957), Davidson (1963)
     * 核心：意向性行动 + 行动理由
     */
    standard: {
      name: '标准能动性',
      theorists: ['Anscombe', 'Davidson', 'Goldman'],
      coreClaims: [
        '意向性行动比行动本身更基本',
        '行动通过意向性来解释',
        '意向性行动与行动理由紧密关联'
      ],
      structure: {
        // 实践三段论
        practicalSyllogism: {
          majorPremise: '我想要 X (目标/欲望)',
          minorPremise: '做 Y 可以实现 X (信念/手段)',
          conclusion: '因此我做 Y (行动)'
        },
        // 意向的构成 (Davidson 早期观点)
        intentionComposition: {
          desire: '对目标的欲望',
          belief: '关于如何实现目标的信念'
        }
      },
      scenarios: [
        '日常决策：选择吃什么午餐',
        '工具性行动：开车去超市',
        '理由驱动的行动：因为下雨所以带伞'
      ],
      limitations: [
        '无法解释自发性行动',
        '无法解释无意识的习惯行动',
        '意向不能简化为欲望 + 信念'
      ]
    },

    /**
     * 2. 发起能动性 (Initiation Agency)
     * 来源：Ginet (1990), O'Connor (2000), Lowe (2008)
     * 核心：行动由行动者发起，可能是自发的
     */
    initiation: {
      name: '发起能动性',
      theorists: ['Ginet', "O'Connor", 'Lowe', 'McCann'],
      coreClaims: [
        '行动由行动者发起',
        '发起可能是完全自发的',
        '行动可以不基于理由或 prior intent'
      ],
      types: {
        // 主体因果论
        agentCausation: {
          description: '行动者是因果链的起点',
          theorists: ['Chisholm', 'Taylor', "O'Connor"]
        },
        // 非因果论
        nonCausal: {
          description: '行动不是由心理状态引起的',
          theorists: ['Ginet', "O'Connor"]
        },
        // 意志行动
        mentalActsOfWill: {
          description: '不可约的意志行为',
          theorists: ['McCann']
        }
      },
      scenarios: [
        '创造性灵感：突然想到一个主意',
        '直觉决策：没有明确理由的选择',
        '自发行动：突然决定改变路线'
      ],
      applications: [
        '培养直觉信任',
        '接纳自发性',
        '区分冲动与真实自发'
      ]
    },

    /**
     * 3. 层级能动性 (Hierarchical Agency)
     * 来源：Frankfurt (1971), Taylor (1977)
     * 核心：反思性认同，二阶欲望
     */
    hierarchical: {
      name: '层级能动性',
      theorists: ['Frankfurt', 'Taylor', 'Watson'],
      coreClaims: [
        '人与其他行动者的区别在于意志结构',
        '人反思并关心自己的动机',
        '形成关于欲望的欲望 (二阶欲望)'
      ],
      structure: {
        // 一阶欲望
        firstOrderDesires: {
          description: '对目标或行动的直接欲望',
          examples: ['想吃蛋糕', '想睡觉', '想逃避']
        },
        // 二阶欲望
        secondOrderDesires: {
          description: '关于一阶欲望的欲望',
          examples: ['想要有锻炼的欲望', '不想要有吸烟的欲望']
        },
        // 认同 (Identification)
        identification: {
          description: '当人想要被某个一阶欲望驱动时，就与该欲望认同',
          conditions: [
            '反思性认可',
            '意志的整合',
            '真实性体验'
          ]
        }
      },
      scenarios: [
        '意志薄弱：想做 X 但做了 Y',
        '成瘾冲突：一阶欲望 vs 二阶欲望',
        '价值观整合：欲望与价值观一致'
      ],
      exercises: [
        {
          name: '欲望层级探索',
          steps: [
            '识别当前强烈的一阶欲望',
            '问：我想要有这个欲望吗？',
            '探索二阶欲望的来源',
            '评估欲望层级的整合度'
          ]
        },
        {
          name: '认同练习',
          steps: [
            '列出你正在经历的动机冲突',
            '对每个动机问：这代表真正的我吗？',
            '识别哪些动机是你认同的',
            '制定增强认同动机的策略'
          ]
        }
      ]
    },

    /**
     * 4. 计划能动性 (Plan Agency)
     * 来源：Bratman (1987)
     * 核心：计划在实践推理中的核心作用
     */
    plan: {
      name: '计划能动性',
      theorists: ['Bratman', 'Pollack'],
      coreClaims: [
        '意图是不可约的心理状态',
        '计划在长期实践推理中起核心作用',
        '意图具有稳定性、一致性和手段 - _end 连贯性'
      ],
      features: {
        // 意图的特征
        intentionFeatures: [
          '稳定性：意图抵抗随意改变',
          '一致性：意图之间应保持一致',
          '手段 - 目的连贯性：意图推动寻找实现手段',
          '聚合性：意图协调跨时间行动'
        ],
        // 计划的作用
        planRoles: [
          '协调：协调不同时间的行动',
          '简化：减少持续决策的认知负担',
          '社会协调：使合作和承诺成为可能'
        ]
      },
      scenarios: [
        '长期目标：职业规划、学习计划',
        '跨时间协调：为未来事件做准备',
        '合作承诺：与他人协调行动'
      ],
      exercises: [
        {
          name: '计划一致性检查',
          steps: [
            '列出当前的主要意图/计划',
            '检查意图之间是否一致',
            '识别冲突的意图',
            '调整或放弃冲突意图'
          ]
        },
        {
          name: '手段 - 目的分析',
          steps: [
            '明确目标意图',
            '列出实现目标的可能手段',
            '评估每个手段的可行性',
            '形成具体的子意图'
          ]
        }
      ]
    },

    /**
     * 5. 现象学能动性 (Phenomenological Agency)
     * 来源：Velleman (1992), Proust
     * 核心：行动者的参与感
     */
    phenomenological: {
      name: '现象学能动性',
      theorists: ['Velleman', 'Proust', 'Bayne'],
      coreClaims: [
        '标准理论无法捕捉行动者的参与',
        '能动性包含独特的现象学特征',
        '行动者体验到自己是行动的发起者'
      ],
      features: {
        // 能动性的现象学
        phenomenology: [
          '努力感：行动需要努力',
          '控制感：体验到对行动的控制',
          '所有权感：行动是"我的"',
          '目的感：行动指向目标'
        ],
        // 缺陷情况
        defects: [
          '异化：行动感觉不是自己的',
          '被动性：感觉被外力推动',
          '分裂：反思自我与行动自我分离'
        ]
      },
      scenarios: [
        '流畅体验：完全投入的行动',
        '异化体验：感觉自己在"自动驾驶"',
        '真实性探索：什么行动感觉最真实'
      ],
      exercises: [
        {
          name: '能动性现象学觉察',
          steps: [
            '选择一个日常行动 (如喝茶)',
            '完全投入地执行该行动',
            '注意行动中的现象学特征',
            '记录控制感、所有权感、目的感'
          ]
        },
        {
          name: '真实性探索',
          steps: [
            '回顾最近的重要决定',
            '评估每个决定的"真实感"',
            '识别什么条件下感觉最真实',
            '创造更多真实性条件'
          ]
        }
      ]
    }
  },

  /**
   * 能动性评估工具
   */
  assessments: {
    /**
     * 评估当前能动性状态
     */
    assessAgencyState: function(context) {
      const {
        decisionType = 'daily',
        hasReflection = false,
        hasPlan = false,
        hasSpontaneity = false,
        hasAlignment = false,
        hasPhenomenology = false
      } = context;

      const scores = {
        standard: 0,
        initiation: 0,
        hierarchical: 0,
        plan: 0,
        phenomenological: 0
      };

      // 标准能动性评分
      if (hasReflection && hasAlignment) {
        scores.standard = 0.8;
      }

      // 发起能动性评分
      if (hasSpontaneity) {
        scores.initiation = 0.7;
      }

      // 层级能动性评分
      if (hasReflection && hasAlignment) {
        scores.hierarchical = 0.9;
      }

      // 计划能动性评分
      if (hasPlan) {
        scores.plan = 0.8;
      }

      // 现象学能动性评分
      if (hasPhenomenology) {
        scores.phenomenological = 0.7;
      }

      // 找出主导的能动性类型
      const dominantType = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])[0];

      return {
        scores,
        dominantType: dominantType[0],
        dominantScore: dominantType[1],
        recommendations: this._generateRecommendations(dominantType[0], scores)
      };
    },

    /**
     * 生成个性化建议
     */
    _generateRecommendations: function(dominantType, scores) {
      const recommendations = {
        standard: [
          '增强行动理由的清晰度',
          '练习决策前的理由澄清',
          '建立决策日志记录理由'
        ],
        initiation: [
          '培养对直觉的信任',
          '为自发性创造安全空间',
          '区分冲动与真实自发'
        ],
        hierarchical: [
          '定期进行欲望层级反思',
          '探索价值观与欲望的 alignment',
          '练习认同与 disidentification'
        ],
        plan: [
          '制定清晰的长期计划',
          '定期检查计划一致性',
          '练习手段 - 目的分析'
        ],
        phenomenological: [
          '培养行动中的临在感',
          '注意行动的现象学质量',
          '探索真实性的条件'
        ]
      };

      // 找出需要发展的类型
      const weakestType = Object.entries(scores)
        .sort((a, b) => a[1] - b[1])[0][0];

      return {
        strengthen: recommendations[dominantType],
        develop: recommendations[weakestType],
        integrate: [
          '整合多种能动性概念',
          '根据情境选择适当的能动性模式',
          '培养能动性的灵活性'
        ]
      };
    }
  },

  /**
   * 实践推理工具
   */
  practicalReasoning: {
    /**
     * 亚里士多德实践三段论
     */
    practicalSyllogism: function(goal, means) {
      return {
        majorPremise: `我想要 ${goal}`,
        minorPremise: `做 ${means} 可以实现 ${goal}`,
        conclusion: `因此我应该做 ${means}`,
        validity: this._checkValidity(goal, means)
      };
    },

    /**
     * 检查实践推理的有效性
     */
    _checkValidity: function(goal, means) {
      return {
        goalClarity: goal && goal.length > 0,
        meansRelevance: means && means.length > 0,
        feasibility: '需要进一步评估',
        alignment: '需要检查与价值观的一致性'
      };
    },

    /**
     * 意图层级分析
     */
    intentionHierarchy: function(action) {
      return {
        level0: action,
        level1: `通过${action}实现...`,
        level2: `为了...`,
        level3: `因为这对我的意义是...`,
        guidance: '从 level0 开始，逐层向上探索，直到找到根本动机'
      };
    }
  },

  /**
   * 交互接口
   */
  interact: function(userInput, context = {}) {
    const assessment = this.assessments.assessAgencyState(context);
    
    const response = {
      module: 'free-will-agency-enhanced',
      version: '3.36.0',
      assessment,
      guidance: this._generateGuidance(assessment, userInput),
      exercises: this._selectExercises(assessment.dominantType)
    };

    return response;
  },

  /**
   * 生成指导
   */
  _generateGuidance: function(assessment, userInput) {
    const type = assessment.dominantType;
    const typeInfo = this.conceptions[type];

    return {
      summary: `您的能动性模式倾向于 **${typeInfo.name}**。${this._getTypeDescription(type)}`,
      strengths: typeInfo.coreClaims,
      development: assessment.recommendations.develop,
      integration: assessment.recommendations.integrate
    };
  },

  /**
   * 获取类型描述
   */
  _getTypeDescription: function(type) {
    const descriptions = {
      standard: '您倾向于基于明确理由做决策，这是理性行动的基础。',
      initiation: '您能够自发行动，这是创造性和直觉的源泉。',
      hierarchical: '您善于反思自己的动机，这是真实性的关键。',
      plan: '您擅长制定和执行计划，这是长期成功的基础。',
      phenomenological: '您关注行动的内在体验，这是真实性的指南。'
    };
    return descriptions[type] || '';
  },

  /**
   * 选择练习
   */
  _selectExercises: function(dominantType) {
    const allExercises = [];
    
    // 收集所有练习
    Object.values(this.conceptions).forEach(conception => {
      if (conception.exercises) {
        allExercises.push(...conception.exercises);
      }
    });

    // 返回 2-3 个相关练习
    return allExercises.slice(0, 3);
  },

  /**
   * 获取模块信息
   */
  getModuleInfo: function() {
    return {
      name: this.meta.name,
      version: this.meta.version,
      source: this.meta.source,
      conceptions: Object.keys(this.conceptions),
      capabilities: [
        '五种能动性概念评估',
        '实践推理工具',
        '个性化练习推荐',
        '能动性整合指导',
        '自由意志理论分析',
        '道德责任评估',
        '意志薄弱处理'
      ]
    };
  },

  /**
   * 自由意志理论框架 (SEP Free Will)
   * v3.35.0 新增
   */
  freeWillTheories: {
    /**
     * 古典相容论 (Classical Compatibilism)
     * 来源：Hobbes, Hume, Locke, Moore, Ayer
     */
    classicalCompatibilism: {
      name: '古典相容论',
      theorists: ['Hobbes', 'Hume', 'Locke', 'Moore', 'Ayer'],
      coreClaim: '自由意志与决定论相容',
      definition: {
        freedom: '没有外部约束地做想做的事',
        freedomToDoOtherwise: '如果偏好不同，就会做不同的事',
        selfDetermination: '行动由最强的欲望引起'
      },
      twoStepStrategy: [
        '第一步：论证自由的对立面不是决定论，而是外部约束',
        '第二步：论证任何试图捕捉"更深层"自由的尝试都会导致难题'
      ],
      scenarios: [
        '日常选择：选择午餐（没有外部约束）',
        '习惯行动：基于最强动机行动',
        '理性决策：权衡后选择'
      ]
    },

    /**
     * 自由意志论/不相容论 (Libertarianism)
     * 来源：Kant, Reid, Campbell, Chisholm, Kane
     */
    libertarianism: {
      name: '自由意志论',
      theorists: ['Kant', 'Reid', 'Campbell', 'Chisholm', 'Kane', 'O\'Connor'],
      coreClaim: '自由意志要求能够真正做 otherwise，与决定论不相容',
      requirements: [
        '能够做 otherwise（在完全相同的条件下）',
        '行动者是因果链的起点（主体因果）',
        '行动不是由 prior 心理状态完全决定'
      ],
      types: {
        // 主体因果论
        agentCausation: {
          description: '行动者作为实体可以直接引起行动',
          theorists: ['Chisholm', 'Taylor', 'O\'Connor']
        },
        // 非因果论
        nonCausal: {
          description: '自由行动不是由任何事物引起的',
          theorists: ['Ginet']
        },
        // 事件因果自由意志论
        eventCausal: {
          description: '自由行动由 prior 事件因果引起，但因果链包含不确定性',
          theorists: ['Kane', 'Franklin']
        }
      },
      challenges: [
        '运气问题：如果行动不是由 prior 状态决定，似乎是运气',
        '解释问题：如何解释行动者为何这样选择而非那样',
        '科学相容性：与物理决定论的张力'
      ]
    },

    /**
     * 半相容论 (Semicompatibilism)
     * 来源：Fischer, Ravizza
     */
    semicompatibilism: {
      name: '半相容论',
      theorists: ['Fischer', 'Ravizza'],
      coreClaim: '道德责任与决定论相容，即使自由意志（能够做 otherwise）不相容',
      distinction: {
        regulativeControl: '能够做 otherwise 的控制（与决定论不相容）',
        guidanceControl: '引导行动的控制（与决定论相容）'
      },
      reasonsResponsiveness: {
        description: '道德责任要求对理由有响应能力',
        levels: {
          strong: '在不同理由下会做不同行动',
          moderate: '在足够强的理由下会改变行动',
          weak: '至少在有些理由下会响应'
        }
      }
    }
  },

  /**
   * Frankfurt Cases 与道德责任
   * v3.35.0 新增
   */
  frankfurtCases: {
    /**
     * Frankfurt 案例结构
     * 挑战 Principle of Alternative Possibilities (PAP)
     */
    structure: {
      pap: '一个人只有在能够做 otherwise 的情况下才对其行动负有道德责任',
      frankfurtChallenge: 'Frankfurt 案例试图显示 PAP 是错的',
      scenario: {
        setup: 'Jones 决定做 X。Black 想要 Jones 做 X，并准备了干预机制',
        intervention: '如果 Jones 显示要做非 X 的迹象，Black 会干预使他做 X',
        actual: 'Jones 自己做 X，Black 没有干预',
        conclusion: 'Jones 不能做 otherwise（因为 Black 会干预），但仍有道德责任'
      }
    },

    /**
     * Frankfurt 案例类型
     */
    types: {
      // 经典 Frankfurt 案例
      classic: {
        name: '经典 Frankfurt 案例',
        description: 'Black 监控 Jones 的决定，准备必要时干预',
        implication: '道德责任不要求能够做 otherwise'
      },
      // 缓冲区案例
      bufferCases: {
        name: '缓冲区案例',
        description: '行动者在做决定前有缓冲时间，但结果仍被保证',
        theorists: ['Kane']
      },
      //  Flicker 策略
      flickerStrategy: {
        name: 'Flicker 策略',
        description: '即使结果相同，仍有" flicker "的替代可能性',
        theorists: ['Widerker', 'Ginet']
      }
    },

    /**
     * 道德责任评估
     */
    assessMoralResponsibility: function(context) {
      const {
        hasAlternatives = true,
        hasCoercion = false,
        hasIgnorance = false,
        hasMentalIllness = false,
        reasonsResponsive = true
      } = context;

      // PAP 条件
      const papSatisfied = hasAlternatives;

      // Frankfurt 条件（理由响应）
      const frankfurtSatisfied = reasonsResponsive && !hasCoercion && !hasIgnorance && !hasMentalIllness;

      // 半相容论条件
      const semicompatibilistSatisfied = reasonsResponsive;

      return {
        pap: {
          satisfied: papSatisfied,
          explanation: papSatisfied ? '有替代可能性' : '没有替代可能性'
        },
        frankfurt: {
          satisfied: frankfurtSatisfied,
          explanation: frankfurtSatisfied ? '有理由响应能力且无削弱条件' : '缺乏理由响应或有削弱条件'
        },
        semicompatibilist: {
          satisfied: semicompatibilistSatisfied,
          explanation: semicompatibilistSatisfied ? '有理由响应能力' : '缺乏理由响应能力'
        },
        overall: {
          responsible: frankfurtSatisfied || semicompatibilistSatisfied,
          basis: semicompatibilistSatisfied ? '半相容论基础' : (frankfurtSatisfied ? 'Frankfurt 基础' : '无责任基础')
        }
      };
    }
  },

  /**
   * 意志薄弱 (Akrasia) 处理
   * v3.35.0 新增
   * 来源：SEP Akrasia, Aristotle, Davidson
   */
  akrasia: {
    /**
     * 意志薄弱的定义与类型
     */
    definition: {
      name: '意志薄弱 (Akrasia / Weakness of Will)',
      description: '明知应该做 X，却做了 Y（Y 与自己的最佳判断相悖）',
      aristotle: '不能控制自己的欲望，尽管知道什么是最好的',
      davidson: 'all-things-considered 判断与行动的分离'
    },

    /**
     * 意志薄弱的类型
     */
    types: {
      // 冲动型
      impulsive: {
        name: '冲动型',
        description: '被强烈欲望压倒，没有充分反思',
        example: '明知应该节食，但看到蛋糕就吃了',
        mechanism: '欲望强度 > 理性控制'
      },
      // 拖延型
      procrastination: {
        name: '拖延型',
        description: '知道应该现在做，但推迟到以后',
        example: '知道应该写报告，但刷手机到深夜',
        mechanism: '时间贴现：现在的小快乐 > 未来的大收益'
      },
      // 自我欺骗型
      selfDeceptive: {
        name: '自我欺骗型',
        description: '临时重新解释判断，使行动"合理化"',
        example: '就今天一次，明天开始节食',
        mechanism: '临时改变 all-things-considered 判断'
      }
    },

    /**
     * 意志薄弱的解释理论
     */
    theories: {
      // 欲望强度模型
      desireStrength: {
        name: '欲望强度模型',
        description: '最强的欲望获胜，即使与判断相悖',
        theorists: ['Hume', 'Aristotle (部分)']
      },
      // 判断变化模型
      judgmentShift: {
        name: '判断变化模型',
        description: '行动时判断实际上改变了',
        theorists: ['Davidson', 'Aristotle (部分)']
      },
      // 注意转移模型
      attentionShift: {
        name: '注意转移模型',
        description: '注意力从理性考虑转移到欲望对象',
        theorists: ['Contemporary research']
      }
    },

    /**
     * 克服意志薄弱的策略
     */
    strategies: {
      // 预先承诺
      precommitment: {
        name: '预先承诺 (Precommitment)',
        description: '提前限制未来的选择',
        examples: [
          '把零食放在够不到的地方',
          '使用网站屏蔽软件',
          '公开承诺目标'
        ],
        theorists: ['Ulysses strategy']
      },
      // 实施意图
      implementationIntentions: {
        name: '实施意图 (Implementation Intentions)',
        description: '制定 if-then 计划',
        format: '如果情况 X 出现，我就做 Y',
        examples: [
          '如果想吃零食，就先喝一杯水',
          '如果想拖延，就先做 5 分钟',
          '如果感到愤怒，就先深呼吸三次'
        ],
        effectiveness: '实证研究显示显著提高自控力'
      },
      // 正念觉察
      mindfulness: {
        name: '正念觉察',
        description: '觉察欲望而不立即行动',
        steps: [
          '注意欲望的出现',
          '标注欲望（"这是想吃甜食的欲望"）',
          '观察欲望的强度变化',
          '选择是否响应'
        ]
      },
      // 价值重连
      valueReconnection: {
        name: '价值重连',
        description: '重新连接行动与深层价值',
        steps: [
          '问：这个行动服务于什么价值？',
          '问：长期来看什么更重要？',
          '想象未来的自己会感谢什么选择',
          '使抽象价值具体化'
        ]
      }
    },

    /**
     * 意志薄弱评估与干预
     */
    assessAndIntervene: function(context) {
      const {
        behavior,
        judgment,
        type = 'impulsive',
        frequency = 'occasional'
      } = context;

      const assessment = {
        hasAkrasia: behavior !== judgment,
        type: this.types[type],
        severity: frequency === 'daily' ? 'severe' : (frequency === 'weekly' ? 'moderate' : 'mild')
      };

      const interventions = [];

      // 根据类型推荐策略
      if (type === 'impulsive') {
        interventions.push(this.strategies.precommitment);
        interventions.push(this.strategies.mindfulness);
      } else if (type === 'procrastination') {
        interventions.push(this.strategies.implementationIntentions);
        interventions.push(this.strategies.valueReconnection);
      } else if (type === 'selfDeceptive') {
        interventions.push(this.strategies.mindfulness);
        interventions.push(this.strategies.valueReconnection);
      }

      return {
        assessment,
        interventions,
        immediateAction: interventions[0]?.examples?.[0] || '觉察当前欲望'
      };
    }
  },

  /**
   * 集体意向性整合
   * v3.35.0 新增
   * 来源：SEP Collective Intentionality
   */
  collectiveIntentionality: {
    /**
     * 集体意向性的定义
     */
    definition: {
      name: '集体意向性',
      description: '多人共享的意向状态，如"我们一起做 X"',
      distinction: {
        individual: '我做 X',
        collective: '我们一起做 X',
        irreducible: '集体意向不能简化为个体意向的总和'
      }
    },

    /**
     * 集体意向性的理论
     */
    theories: {
      // 联合承诺
      jointCommitment: {
        name: '联合承诺理论',
        theorists: ['Gilbert'],
        coreClaim: '集体意向性基于成员之间的联合承诺',
        features: [
          '相互承诺做 X',
          '承诺对彼此负责',
          '形成"我们"作为行动主体'
        ]
      },
      // 共享意向
      sharedIntention: {
        name: '共享意向理论',
        theorists: ['Bratman', 'Searle'],
        coreClaim: '共享意向是个体意向的互锁结构',
        bratmanFeatures: [
          '每个人都意向我们一起做 X',
          '每个人的意向基于对方的意向',
          '协调子计划',
          '共同知识'
        ]
      },
      // 原始集体意向
      primitiveCollective: {
        name: '原始集体意向',
        theorists: ['Searle'],
        coreClaim: '集体意向是心理原语，不能还原',
        weIntention: '我们有 X 的意向是基本的心理状态'
      }
    },

    /**
     * 集体能动性应用
     */
    applications: {
      // 关系性自我
      relationalSelf: {
        name: '关系性自我',
        description: '自我认同包含集体身份',
        exercises: [
          '探索"我们"的身份认同',
          '识别集体价值观',
          '平衡个体与集体需求'
        ]
      },
      // 集体情绪
      collectiveEmotion: {
        name: '集体情绪',
        description: '群体共享的情绪体验',
        examples: [
          '团队胜利的喜悦',
          '国家哀悼日的悲伤',
          '社会运动的愤怒'
        ]
      },
      // 合作行动
      cooperativeAction: {
        name: '合作行动',
        description: '基于集体意向的协调行动',
        requirements: [
          '共享目标',
          '角色分工',
          '相互响应',
          '共同责任'
        ]
      }
    }
  }
};

module.exports = FreeWillAgencyEnhanced;
