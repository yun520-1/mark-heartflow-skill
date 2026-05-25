/**
 * 关系性自我模块 (Relational Self)
 * 
 * 理论来源:
 * - SEP: Self-Consciousness (Phenomenological Approaches)
 * - SEP: Collective Intentionality
 * - SEP: Phenomenology
 * - 现象学传统：Husserl, Heidegger, Merleau-Ponty, Sartre
 * - 共情理论：Scheler, Walther, Stein
 * - 社会认同理论：Tajfel & Turner
 * 
 * 核心概念:
 * 1. 前反思自我意识 (Prereflective Self-Consciousness)
 *    - 体验的"为我性"(for-me-ness)
 *    - 非对象化的自我觉知
 *    - 所有现象意识的基础
 * 
 * 2. 关系性自我 (Relational Self)
 *    - 自我在与他人的关系中构成
 *    - 认同融合 (Identity Fusion)
 *    - 关系性自我超越个体边界
 * 
 * 3. 共情结构 (Empathic Structure)
 *    - 体验他人的体验
 *    - 识别与共鸣
 *    - 共情关怀与行动倾向
 * 
 * 4. 集体意向性 (Collective Intentionality)
 *    - "我们意图"(We-intention)
 *    - 共享体验与联合行动
 *    - 集体情绪与团结感
 * 
 * 5. 自我 - 他人区分与融合
 *    - 健康的自我边界
 *    - 情境性的融合与分离
 *    - 关系中的自主与联结
 */

class RelationalSelf {
  constructor() {
    this.name = '关系性自我模块';
    this.version = '3.32.0';
    
    // 前反思自我意识的特征
    this.prereflectiveFeatures = {
      forMeNess: '体验的为我性 - 体验以第一人称方式被给予',
      nonObjectifying: '非对象化 - 不需要将自我作为对象来觉知',
      implicit: '内隐性 - 体验发生时自动伴随的自我觉知',
      foundational: '基础性 - 所有反思性自我意识的前提'
    };
    
    // 关系性自我的维度
    this.dimensions = {
      individualAgency: '个体能动性 - 作为独立行动者的自我感',
      relationalIdentity: '关系认同 - 在关系中定义的自我',
      collectiveBelonging: '集体归属 - 作为群体成员的自我感',
      empathicConnection: '共情联结 - 与他人情感共鸣的能力'
    };
    
    // 共情的层次 (基于 Scheler 和现象学传统)
    this.empathyLevels = {
      emotionalContagion: {
        name: '情绪传染',
        description: '自动捕捉并同步他人的情绪状态',
        example: '看到别人打哈欠自己也困了',
        depth: 1
      },
      affectiveResonance: {
        name: '情感共鸣',
        description: '感受到他人的情感，但保持自我 - 他人区分',
        example: '为朋友的悲伤感到难过，但知道那不是我的悲伤',
        depth: 2
      },
      cognitiveEmpathy: {
        name: '认知共情',
        description: '理解他人的观点和感受的原因',
        example: '理解为什么这件事对他如此重要',
        depth: 3
      },
      empathicConcern: {
        name: '共情关怀',
        description: '对他人的福祉产生关心并采取行动',
        example: '主动提供帮助或支持',
        depth: 4
      },
      identityFusion: {
        name: '认同融合',
        description: '自我与他人/群体的边界暂时模糊',
        example: '为团队的胜利感到如同自己的胜利',
        depth: 5
      }
    };
    
    // 集体意向性的形式
    this.collectiveIntentionalityForms = {
      weIntention: {
        name: '我们意图',
        description: '以"我们"为主语的意向状态',
        example: '我们打算一起完成这个项目',
        irreducible: true
      },
      sharedExperience: {
        name: '共享体验',
        description: '共同经历同一事件或情感',
        example: '一起观看日出时的共同敬畏感',
        irreducible: true
      },
      jointAction: {
        name: '联合行动',
        description: '协调行动以实现共同目标',
        example: '团队合作完成复杂任务',
        irreducible: true
      },
      collectiveEmotion: {
        name: '集体情绪',
        description: '群体中传播和放大的情绪',
        example: '庆典中的集体喜悦或抗议中的集体愤怒',
        irreducible: true
      }
    };
    
    // 自我 - 他人关系的健康模式
    this.healthyRelationalPatterns = {
      balancedBoundaries: {
        name: '平衡的边界',
        description: '既能保持自我完整性，又能与他人深度联结',
        indicators: [
          '能够说"不"而不感到内疚',
          '能够寻求支持而不感到羞耻',
          '在关系中保持自己的观点和感受',
          '能够共情但不被他人情绪淹没'
        ]
      },
      flexibleFusion: {
        name: '灵活的融合',
        description: '根据情境需要调整自我 - 他人边界',
        indicators: [
          '在亲密时刻能够暂时放下自我关注',
          '在需要独立时能够清晰区分自我与他人',
          '能够选择何时融合何时分离',
          '融合后能够恢复自我感'
        ]
      },
      mutualRecognition: {
        name: '相互承认',
        description: '既承认他人的主体性，也被他人承认',
        indicators: [
          '视他人为有自己思想和感受的独立个体',
          '感到自己被他人真正看见和理解',
          '能够承认错误和局限',
          '关系中双方都能成长和改变'
        ]
      }
    };
    
    // 关系性自我的发展阶段
    this.developmentStages = {
      egocentric: {
        name: '自我中心',
        description: '难以区分自己与他人的视角',
        ageRange: '婴幼儿期',
        characteristics: [
          '认为他人看到和自己看到的一样',
          '难以理解他人有不同的想法和感受',
          '共情能力有限'
        ]
      },
      sociocentric: {
        name: '社会中心',
        description: '自我定义主要来自群体归属',
        ageRange: '儿童期 - 青少年期',
        characteristics: [
          '强烈认同家庭、学校、同伴群体',
          '遵守群体规范以获得接纳',
          '集体情绪容易影响个体'
        ]
      },
      individuated: {
        name: '个体化',
        description: '发展出独立的自我认同',
        ageRange: '青少年期 - 成年早期',
        characteristics: [
          '探索并承诺个人价值观',
          '能够批判性思考群体规范',
          '在关系中保持自我边界'
        ]
      },
      integrative: {
        name: '整合',
        description: '整合个体自主与关系联结',
        ageRange: '成年期',
        characteristics: [
          '既能独立自主又能深度联结',
          '灵活调整自我 - 他人边界',
          '在关系中既给予又接受',
          '认同既包含个体也包含关系维度'
        ]
      },
      transcendent: {
        name: '超越',
        description: '自我感扩展到更广泛的共同体',
        ageRange: '成熟期',
        characteristics: [
          '认同扩展到人类、生命、宇宙',
          '超越小我的关切',
          '为更大的善行动',
          '深刻的 interconnectedness 感'
        ]
      }
    };
  }
  
  /**
   * 分析用户输入中的关系性自我主题
   */
  analyzeRelationalSituation(userInput, context = {}) {
    const analysis = {
      detectedThemes: [],
      empathyLevel: null,
      relationalPattern: null,
      developmentStage: null,
      recommendations: []
    };
    
    const input = userInput.toLowerCase();
    
    // 检测关系主题
    if (input.includes('我们') || input.includes('一起') || input.includes('共同')) {
      analysis.detectedThemes.push('集体意向性');
    }
    if (input.includes('理解') || input.includes('感受') || input.includes('共情')) {
      analysis.detectedThemes.push('共情');
    }
    if (input.includes('边界') || input.includes('距离') || input.includes('空间')) {
      analysis.detectedThemes.push('自我边界');
    }
    if (input.includes('孤独') || input.includes('连接') || input.includes('归属')) {
      analysis.detectedThemes.push('关系联结');
    }
    if (input.includes('自己') || input.includes('自我') || input.includes('独立')) {
      analysis.detectedThemes.push('自我认同');
    }
    
    // 评估共情水平
    analysis.empathyLevel = this.assessEmpathyLevel(userInput);
    
    // 识别关系模式
    analysis.relationalPattern = this.identifyRelationalPattern(userInput);
    
    // 判断发展阶段
    analysis.developmentStage = this.assessDevelopmentStage(userInput);
    
    // 生成建议
    analysis.recommendations = this.generateRelationalRecommendations(analysis);
    
    return analysis;
  }
  
  /**
   * 评估共情水平
   */
  assessEmpathyLevel(userInput) {
    const input = userInput.toLowerCase();
    
    // 深度共情指标
    const deepEmpathyIndicators = [
      '我能感受到', '我理解你的', '我体会到',
      '站在你的角度', '如果我是你',
      '你的感受很重要', '我在这里陪你'
    ];
    
    // 认知共情指标
    const cognitiveEmpathyIndicators = [
      '我明白为什么', '我能理解', '从你的角度看',
      '这对你来说', '对你而言'
    ];
    
    // 情绪传染指标
    const contagionIndicators = [
      '我也感到', '让我也', '一起',
      '我们都很', '大家都'
    ];
    
    if (deepEmpathyIndicators.some(ind => input.includes(ind))) {
      return { level: 4, name: '共情关怀', description: '表现出深度的共情关怀和行动倾向' };
    }
    if (cognitiveEmpathyIndicators.some(ind => input.includes(ind))) {
      return { level: 3, name: '认知共情', description: '能够理解他人的观点和感受原因' };
    }
    if (contagionIndicators.some(ind => input.includes(ind))) {
      return { level: 1, name: '情绪传染', description: '表现出情绪同步和共鸣' };
    }
    
    return { level: 2, name: '情感共鸣', description: '基础的情感共鸣能力' };
  }
  
  /**
   * 识别关系模式
   */
  identifyRelationalPattern(userInput) {
    const input = userInput.toLowerCase();
    
    // 边界过度 rigid
    if (input.includes('不需要') || input.includes('我自己') || input.includes('别管我')) {
      return {
        pattern: '过度分离',
        description: '可能过度强调自我边界，回避亲密联结',
        suggestion: '尝试在保持自我的同时，允许适度的脆弱和依赖'
      };
    }
    
    // 边界过度 porous
    if (input.includes('都是我的错') || input.includes('我必须') || input.includes('都是为了')) {
      return {
        pattern: '过度融合',
        description: '可能过度承担他人责任，自我边界模糊',
        suggestion: '练习区分哪些是你的责任，哪些是他人的责任'
      };
    }
    
    // 健康平衡
    if (input.includes('我们可以') || input.includes('一起...但也') || input.includes('理解...同时')) {
      return {
        pattern: '平衡整合',
        description: '表现出健康的自我 - 他人平衡',
        suggestion: '继续保持这种平衡，在自主与联结之间灵活调整'
      };
    }
    
    return {
      pattern: '待评估',
      description: '需要更多信息来评估关系模式',
      suggestion: '可以进一步探索你在关系中的感受和需要'
    };
  }
  
  /**
   * 评估发展阶段
   */
  assessDevelopmentStage(userInput) {
    const input = userInput.toLowerCase();
    
    // 超越阶段指标
    if (input.includes('人类') || input.includes('生命') || input.includes('宇宙') || input.includes('更大的')) {
      return this.developmentStages.transcendent;
    }
    
    // 整合阶段指标
    if (input.includes('既...又') || input.includes('平衡') || input.includes('同时')) {
      return this.developmentStages.integrative;
    }
    
    // 个体化阶段指标
    if (input.includes('我想') || input.includes('我的价值观') || input.includes('我自己决定')) {
      return this.developmentStages.individuated;
    }
    
    // 社会中心阶段指标
    if (input.includes('别人会') || input.includes('应该') || input.includes('正常')) {
      return this.developmentStages.sociocentric;
    }
    
    return this.developmentStages.individuated; // 默认假设成年用户
  }
  
  /**
   * 生成关系性建议
   */
  generateRelationalRecommendations(analysis) {
    const recommendations = [];
    
    // 基于共情水平的建议
    if (analysis.empathyLevel.level <= 2) {
      recommendations.push({
        area: '共情发展',
        suggestion: '练习主动倾听：放下评判，专注于理解对方的感受和需要',
        practice: '每天花 5 分钟，完全专注地倾听一个人，不打断、不给建议'
      });
    }
    
    // 基于关系模式的建议
    if (analysis.relationalPattern.pattern === '过度分离') {
      recommendations.push({
        area: '关系联结',
        suggestion: '尝试适度展示脆弱，分享你的真实感受',
        practice: '选择一个信任的人，分享一件你平时不会说的事'
      });
    } else if (analysis.relationalPattern.pattern === '过度融合') {
      recommendations.push({
        area: '自我边界',
        suggestion: '练习区分：这是谁的感受？谁的需要？谁的责任？',
        practice: '当感到疲惫或委屈时，问自己：我在为什么负责？这真的是我的责任吗？'
      });
    }
    
    // 基于发展阶段的建议
    if (analysis.developmentStage.name === '个体化') {
      recommendations.push({
        area: '整合发展',
        suggestion: '探索如何在保持独立的同时深化关系联结',
        practice: '思考：在什么关系中你能既做自己又感到亲密？'
      });
    }
    
    return recommendations;
  }
  
  /**
   * 获取关系性自我练习
   */
  getPractices(practiceType = 'all') {
    const practices = {
      boundarySetting: {
        name: '健康边界练习',
        duration: '15-20 分钟',
        steps: [
          '列出你生活中的重要关系',
          '对每个关系，评估你的边界状态 (过于 rigid/过于 porous/平衡)',
          '选择一个需要调整的关系',
          '写下你希望设立的边界',
          '练习用温和而坚定的方式表达边界',
          '反思设立边界后的感受'
        ],
        frequency: '每周 1-2 次'
      },
      
      empathicListening: {
        name: '共情倾听练习',
        duration: '10-15 分钟',
        steps: [
          '选择一个对话伙伴',
          '约定 5 分钟，你只倾听不给建议',
          '专注于理解对方的感受和需要',
          '用你的话复述你听到的内容',
          '问：我理解得对吗？',
          '交换角色'
        ],
        frequency: '每周 2-3 次'
      },
      
      perspectiveTaking: {
        name: '视角转换练习',
        duration: '20-30 分钟',
        steps: [
          '选择一个你与他人有分歧的情境',
          '写下你的观点和感受',
          '想象你是对方：你的背景、经历、关切是什么？',
          '从对方的角度重写这个情境',
          '思考：对方的观点有什么合理性？',
          '整合两个视角，寻找共同点'
        ],
        frequency: '遇到冲突时使用'
      },
      
      collectiveIntention: {
        name: '我们意图练习',
        duration: '15-20 分钟',
        steps: [
          '选择一个你参与的关系或群体',
          '思考：我们的共同目标是什么？',
          '思考：我如何为这个共同目标贡献？',
          '与群体成员交流，确认共同意图',
          '讨论：我们如何更好地协作？',
          '承诺一个具体的贡献行动'
        ],
        frequency: '每月 1 次'
      },
      
      relationalReflection: {
        name: '关系反思日记',
        duration: '10-15 分钟',
        steps: [
          '回顾今天的重要关系互动',
          '记录：我在关系中感到什么？',
          '记录：我的什么需要被满足/未被满足？',
          '记录：我如何回应他人？效果如何？',
          '反思：我想如何调整我的关系模式？',
          '为明天设定一个关系意图'
        ],
        frequency: '每日'
      },
      
      identityFusion: {
        name: '健康认同融合练习',
        duration: '20-30 分钟',
        steps: [
          '选择一个你深爱的群体或关系',
          '反思：这个群体/关系如何塑造了你？',
          '思考：你为这个群体/关系贡献了什么？',
          '想象：你们共同经历的美好时刻',
          '感受：作为群体一部分的归属感',
          '同时保持：你独特的个体性是什么？'
        ],
        frequency: '每周 1 次'
      }
    };
    
    if (practiceType === 'all') {
      return practices;
    }
    return practices[practiceType] || practices;
  }
  
  /**
   * 生成关系性自我报告
   */
  generateReport(userInput, context = {}) {
    const analysis = this.analyzeRelationalSituation(userInput, context);
    
    const report = {
      module: '关系性自我模块',
      version: this.version,
      timestamp: new Date().toISOString(),
      analysis: {
        detectedThemes: analysis.detectedThemes,
        empathyLevel: analysis.empathyLevel,
        relationalPattern: analysis.relationalPattern,
        developmentStage: analysis.developmentStage
      },
      recommendations: analysis.recommendations,
      practices: this.getPractices()
    };
    
    return report;
  }
  
  /**
   * 模块帮助信息
   */
  help() {
    return {
      name: this.name,
      version: this.version,
      description: '基于现象学和集体意向性理论的关系性自我模块',
      commands: {
        '/relational': '查看关系性自我模块信息',
        '/relational analyze': '分析当前情境中的关系性自我主题',
        '/relational practices': '获取关系性自我练习',
        '/relational report': '生成完整的关系性自我报告'
      },
      theoreticalBasis: [
        'SEP: Self-Consciousness (Phenomenological Approaches)',
        'SEP: Collective Intentionality',
        'SEP: Phenomenology',
        'Husserl, Heidegger, Merleau-Ponty, Sartre',
        'Scheler, Walther, Stein (共情理论)',
        'Tajfel & Turner (社会认同理论)'
      ]
    };
  }
}

module.exports = RelationalSelf;
