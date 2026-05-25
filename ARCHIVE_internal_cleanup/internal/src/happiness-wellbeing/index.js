/**
 * 幸福与福祉模块 (Happiness & Well-Being Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - Happiness (幸福理论)
 * - Well-Being (福祉理论)
 * - Positive Psychology (积极心理学)
 * 
 * 核心理论来源:
 * - SEP: Happiness (https://plato.stanford.edu/entries/happiness/)
 * - SEP: Well-Being (https://plato.stanford.edu/entries/well-being/)
 * - Seligman, M. (2011). Flourish: A Visionary New Understanding of Happiness and Well-being
 * - Kahneman, D. (1999). Objective Happiness
 * - Diener, E. (1984). Subjective Well-Being
 * - Ryff, C. (1989). Psychological Well-Being (PWB)
 * - Waterman, A. (2008). Eudaimonic Identity Theory
 * 
 * 功能目标：赋予 HeartFlow 幸福感评估、福祉提升和意义发现能力
 * 
 * 1. 幸福的三重理论 (Three Theories of Happiness)
 *    - 享乐主义 (Hedonism) - 快乐与痛苦的平衡
 *    - 生命满足论 (Life Satisfaction Theory) - 认知评价
 *    - 情绪状态论 (Emotional State Theory) - 积极情绪主导
 * 
 * 2. 福祉的三大传统 (Three Traditions of Well-Being)
 *    - 享乐主义福祉 (Hedonic Well-Being) - 主观幸福感 (SWB)
 *    - 实现论福祉 (Eudaimonic Well-Being) - 心理幸福感 (PWB)
 *    - 客观列表理论 (Objective List Theory) - 客观福祉要素
 * 
 * 3. PERMA 模型 (Seligman 积极心理学)
 *    - Positive Emotion (积极情绪)
 *    - Engagement (投入/心流)
 *    - Relationships (关系)
 *    - Meaning (意义)
 *    - Accomplishment (成就)
 * 
 * 4. 幸福感评估与提升
 *    - 多维度幸福感评估
 *    - 个性化福祉提升计划
 *    - 意义发现与目标设定
 * 
 * @version 3.52.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 幸福理论类型 (Theories of Happiness)
 */
const HappinessTheories = {
  HEDONISM: 'hedonism',              // 享乐主义 - 快乐最大化
  LIFE_SATISFACTION: 'life_satisfaction', // 生命满足论 - 认知评价
  EMOTIONAL_STATE: 'emotional_state' // 情绪状态论 - 积极情绪主导
};

/**
 * 福祉理论类型 (Theories of Well-Being)
 */
const WellBeingTheories = {
  HEDONIC: 'hedonic',                // 享乐主义福祉 - 主观幸福感 (SWB)
  EUDAIMONIC: 'eudaimonic',          // 实现论福祉 - 心理幸福感 (PWB)
  OBJECTIVE_LIST: 'objective_list'   // 客观列表理论
};

/**
 * PERMA 模型要素 (Seligman)
 */
const PERMAElements = {
  POSITIVE_EMOTION: 'positive_emotion',    // 积极情绪
  ENGAGEMENT: 'engagement',                // 投入/心流
  RELATIONSHIPS: 'relationships',          // 关系
  MEANING: 'meaning',                      // 意义
  ACCOMPLISHMENT: 'accomplishment'         // 成就
};

/**
 * Ryff 心理幸福感六维度 (Psychological Well-Being)
 */
const PWBDimensions = {
  SELF_ACCEPTANCE: 'self_acceptance',      // 自我接纳
  POSITIVE_RELATIONS: 'positive_relations', // 积极关系
  AUTONOMY: 'autonomy',                    // 自主性
  ENVIRONMENTAL_MASTERY: 'environmental_mastery', // 环境掌控
  PURPOSE_IN_LIFE: 'purpose_in_life',      // 生活目标
  PERSONAL_GROWTH: 'personal_growth'       // 个人成长
};

/**
 * 客观列表理论要素 (Objective List Goods)
 * 基于 SEP Well-Being 和 Nussbaum 能力方法
 */
const ObjectiveGoods = {
  // 基本能力 (Basic Capabilities)
  LIFE: 'life',                    // 生命与健康
  BODILY_HEALTH: 'bodily_health', // 身体健康
  BODILY_INTEGRITY: 'bodily_integrity', // 身体完整性
  
  // 认知与情感 (Cognitive & Emotional)
  KNOWLEDGE: 'knowledge',          // 知识与理解
  EMOTIONAL_HEALTH: 'emotional_health', // 情感健康
  AUTONOMY_OF_THOUGHT: 'autonomy_of_thought', // 思想自主
  
  // 社会与关系 (Social & Relational)
  FRIENDSHIP: 'friendship',        // 友谊
  LOVE: 'love',                    // 爱
  SOCIAL_CONNECTION: 'social_connection', // 社会联结
  
  // 成就与意义 (Achievement & Meaning)
  ACHIEVEMENT: 'achievement',      // 成就
  MEANING: 'meaning',              // 生命意义
  PURPOSE: 'purpose',              // 目标
  
  // 审美与娱乐 (Aesthetic & Recreational)
  AESTHETIC_EXPERIENCE: 'aesthetic_experience', // 审美体验
  PLAY: 'play',                    // 游戏与娱乐
  
  // 实践理性 (Practical Reason)
  PRACTICAL_REASON: 'practical_reason', // 实践理性
  MORAL_AGENCY: 'moral_agency'     // 道德能动性
};

// ============ 幸福与福祉模块类 ============

class HappinessWellBeingModule {
  constructor() {
    this.name = 'HappinessWellBeing';
    this.version = '3.52.0';
    this.description = '基于 SEP 幸福与福祉理论的评估与提升模块，整合享乐主义、实现论和客观列表理论';
    
    // 初始化理论数据库
    this.happinessTheories = this._initHappinessTheories();
    this.wellBeingTheories = this._initWellBeingTheories();
    this.permaModel = this._initPERMA();
    this.pwbDimensions = this._initPWB();
    this.objectiveGoods = this._initObjectiveGoods();
  }
  
  // ============ 初始化方法 ============
  
  _initHappinessTheories() {
    return {
      [HappinessTheories.HEDONISM]: {
        name: '享乐主义幸福观',
        coreThesis: '幸福是快乐与痛苦的平衡，快乐最大化即幸福',
        proponents: ['Epicurus', 'Jeremy Bentham', 'John Stuart Mill'],
        strengths: ['直观清晰', '易于测量', '关注主观体验'],
        limitations: ['忽视意义和成就', '可能鼓励短视行为', '忽视个体差异'],
        measurement: '积极情绪频率 - 消极情绪频率',
        application: '增加积极情绪体验，减少消极情绪，培养感恩和正念'
      },
      [HappinessTheories.LIFE_SATISFACTION]: {
        name: '生命满足论幸福观',
        coreThesis: '幸福是对自己生命整体的认知评价和满意度',
        proponents: ['Ed Diener', 'Richard Lucas'],
        strengths: ['关注长期评价', '包含认知成分', '跨文化适用'],
        limitations: ['可能忽视当下体验', '受当前情绪影响', '标准因人而异'],
        measurement: '生命满意度量表 (SWLS)',
        application: '反思生命整体，识别满意领域，设定有意义目标'
      },
      [HappinessTheories.EMOTIONAL_STATE]: {
        name: '情绪状态论幸福观',
        coreThesis: '幸福是积极情绪占主导的情绪状态',
        proponents: ['Daniel Kahneman', 'Barbara Fredrickson'],
        strengths: ['关注当下体验', '可扩展性 (拓展 - 建构理论)', '可操作'],
        limitations: ['可能忽视深层满足', '情绪波动影响大', '文化差异'],
        measurement: '积极情绪比例 (PANAS)',
        application: '培养积极情绪，练习感恩、善意、心流体验'
      }
    };
  }
  
  _initWellBeingTheories() {
    return {
      [WellBeingTheories.HEDONIC]: {
        name: '享乐主义福祉 (Hedonic Well-Being)',
        alias: '主观幸福感 (Subjective Well-Being, SWB)',
        coreComponents: [
          '生活满意度 (Life Satisfaction)',
          '积极情绪 (Positive Affect)',
          '消极情绪 (Negative Affect, 反向计分)'
        ],
        measurement: 'SWLS + PANAS',
        strengths: ['主观体验优先', '易于自评', '跨文化研究丰富'],
        limitations: ['可能忽视客观条件', '适应效应 (Hedonic Treadmill)', '忽视意义'],
        application: '提升积极情绪，培养感恩，管理消极情绪'
      },
      [WellBeingTheories.EUDAIMONIC]: {
        name: '实现论福祉 (Eudaimonic Well-Being)',
        alias: '心理幸福感 (Psychological Well-Being, PWB)',
        coreComponents: [
          '自我接纳 (Self-Acceptance)',
          '积极关系 (Positive Relations)',
          '自主性 (Autonomy)',
          '环境掌控 (Environmental Mastery)',
          '生活目标 (Purpose in Life)',
          '个人成长 (Personal Growth)'
        ],
        proponents: ['Aristotle', 'Carol Ryff', 'Waterman'],
        measurement: 'Ryff PWB 量表',
        strengths: ['关注潜能实现', '包含意义和成长', '深度满足'],
        limitations: ['测量复杂', '文化差异大', '可能忽视快乐'],
        application: '探索价值观，发展优势，建立深度关系，追求有意义目标'
      },
      [WellBeingTheories.OBJECTIVE_LIST]: {
        name: '客观列表理论 (Objective List Theory)',
        coreThesis: '某些事物客观上对人有益，独立于主观感受',
        proponents: ['Aristotle', 'Martha Nussbaum', 'Amartya Sen', 'G.E. Moore'],
        objectiveGoods: Object.keys(ObjectiveGoods),
        strengths: ['避免主观偏见', '包含多元价值', '指导公共政策'],
        limitations: ['列表争议', '可能忽视个体差异', ' paternalism 风险'],
        application: '评估客观福祉要素，平衡发展各维度'
      }
    };
  }
  
  _initPERMA() {
    return {
      [PERMAElements.POSITIVE_EMOTION]: {
        name: '积极情绪 (Positive Emotion)',
        description: '体验快乐、感恩、希望、爱等积极情绪',
        practices: [
          '三件好事练习 (Three Good Things)',
          '感恩日记 (Gratitude Journal)',
          '品味练习 (Savoring)',
          '善意行为 (Acts of Kindness)'
        ],
        measurement: 'PANAS 积极情绪分量表',
        benefits: ['拓展认知和行为资源', '建构心理韧性', '提升创造力']
      },
      [PERMAElements.ENGAGEMENT]: {
        name: '投入/心流 (Engagement/Flow)',
        description: '完全投入活动，失去时间感的沉浸体验',
        conditions: [
          '挑战与技能平衡',
          '明确目标',
          '即时反馈',
          '行动与意识融合'
        ],
        practices: [
          '识别心流活动',
          '创造无干扰环境',
          '设定清晰目标',
          '培养深度专注'
        ],
        measurement: '心流量表 (Flow Scale)',
        benefits: ['内在动机', '技能提升', '时间感改变']
      },
      [PERMAElements.RELATIONSHIPS]: {
        name: '积极关系 (Relationships)',
        description: '建立和维持深度、支持性的人际联结',
        practices: [
          '主动建设性回应 (Active Constructive Responding)',
          '表达欣赏和感谢',
          '定期深度交流',
          '培养共情能力'
        ],
        measurement: '关系质量量表',
        benefits: ['社会支持', '归属感', '情感安全']
      },
      [PERMAElements.MEANING]: {
        name: '意义 (Meaning)',
        description: '归属于和服务于超越自我的事物',
        sources: [
          '宗教信仰',
          '社会贡献',
          '家庭传承',
          '创造性工作',
          '自然联结'
        ],
        practices: [
          '识别核心价值观',
          '参与志愿服务',
          '反思生命意义',
          '连接更大目标'
        ],
        measurement: '生命意义问卷 (MLQ)',
        benefits: ['生命方向感', '逆境韧性', '深层满足']
      },
      [PERMAElements.ACCOMPLISHMENT]: {
        name: '成就 (Accomplishment)',
        description: '追求和达成目标，体验 mastery 和胜任感',
        practices: [
          '设定 SMART 目标',
          '分解大目标为小步骤',
          '庆祝小胜利',
          '培养成长型思维'
        ],
        measurement: '成就动机量表',
        benefits: ['自我效能感', '内在动机', '持续进步']
      }
    };
  }
  
  _initPWB() {
    return {
      [PWBDimensions.SELF_ACCEPTANCE]: {
        name: '自我接纳',
        description: '对自我持积极态度，接纳自己的优点和缺点',
        indicators: [
          '对过去生活感到满足',
          '接纳自己的多方面',
          '不过分苛责自己'
        ],
        practices: ['自我同情练习', '优势识别', '接纳承诺疗法']
      },
      [PWBDimensions.POSITIVE_RELATIONS]: {
        name: '积极关系',
        description: '拥有温暖、信任、互惠的人际关系',
        indicators: [
          '感到被爱和被关心',
          '愿意为他人付出',
          '能处理人际冲突'
        ],
        practices: ['主动建设性回应', '感恩表达', '深度倾听']
      },
      [PWBDimensions.AUTONOMY]: {
        name: '自主性',
        description: '能独立思考和行动，抵抗社会压力',
        indicators: [
          '能自己做决定',
          '不盲目从众',
          '按自己价值观生活'
        ],
        practices: ['价值观澄清', '自主决策练习', '边界设定']
      },
      [PWBDimensions.ENVIRONMENTAL_MASTERY]: {
        name: '环境掌控',
        description: '能有效管理环境和日常生活',
        indicators: [
          '能创造适合的生活环境',
          '能有效利用机会',
          '能选择或创造适合的情境'
        ],
        practices: ['目标设定', '时间管理', '问题解决技能']
      },
      [PWBDimensions.PURPOSE_IN_LIFE]: {
        name: '生活目标',
        description: '生命有方向感和意义感',
        indicators: [
          '有明确的生活目标',
          '感到日常活动有意义',
          '对未来有期待'
        ],
        practices: ['生命意义探索', '价值观行动', '服务他人']
      },
      [PWBDimensions.PERSONAL_GROWTH]: {
        name: '个人成长',
        description: '持续发展潜能，保持开放和学习',
        indicators: [
          '感到持续成长',
          '愿意尝试新事物',
          '能从经验中学习'
        ],
        practices: ['成长型思维', '学习新技能', '反思实践']
      }
    };
  }
  
  _initObjectiveGoods() {
    return {
      [ObjectiveGoods.LIFE]: { name: '生命与健康', description: '正常寿命，健康身体' },
      [ObjectiveGoods.BODILY_HEALTH]: { name: '身体健康', description: '营养、住所、医疗' },
      [ObjectiveGoods.BODILY_INTEGRITY]: { name: '身体完整性', description: '身体自主权，免受暴力' },
      [ObjectiveGoods.KNOWLEDGE]: { name: '知识与理解', description: '教育、学习、理解世界' },
      [ObjectiveGoods.EMOTIONAL_HEALTH]: { name: '情感健康', description: '情绪调节，心理韧性' },
      [ObjectiveGoods.AUTONOMY_OF_THOUGHT]: { name: '思想自主', description: '思想自由，良心自由' },
      [ObjectiveGoods.FRIENDSHIP]: { name: '友谊', description: '朋友关系，社会支持' },
      [ObjectiveGoods.LOVE]: { name: '爱', description: '亲密关系，被爱和爱人的能力' },
      [ObjectiveGoods.SOCIAL_CONNECTION]: { name: '社会联结', description: '归属感，社区参与' },
      [ObjectiveGoods.ACHIEVEMENT]: { name: '成就', description: '目标达成，能力发挥' },
      [ObjectiveGoods.MEANING]: { name: '生命意义', description: '意义感，目的感' },
      [ObjectiveGoods.PURPOSE]: { name: '目标', description: '生活方向，追求的目标' },
      [ObjectiveGoods.AESTHETIC_EXPERIENCE]: { name: '审美体验', description: '艺术、自然、美的体验' },
      [ObjectiveGoods.PLAY]: { name: '游戏与娱乐', description: '休闲、娱乐、玩耍' },
      [ObjectiveGoods.PRACTICAL_REASON]: { name: '实践理性', description: '反思和规划生活的能力' },
      [ObjectiveGoods.MORAL_AGENCY]: { name: '道德能动性', description: '道德判断和行动能力' }
    };
  }
  
  // ============ 核心评估方法 ============
  
  /**
   * 幸福感综合评估
   * 整合 SWB、PWB 和 PERMA 多维度评估
   */
  assessWellBeing(userProfile) {
    const assessment = {
      timestamp: new Date().toISOString(),
      swb: this._assessSWB(userProfile),
      pwb: this._assessPWB(userProfile),
      perma: this._assessPERMA(userProfile),
      objectiveGoods: this._assessObjectiveGoods(userProfile),
      integratedProfile: null,
      recommendations: []
    };
    
    // 整合评估结果
    assessment.integratedProfile = this._integrateAssessment(assessment);
    assessment.recommendations = this._generateRecommendations(assessment);
    
    return assessment;
  }
  
  _assessSWB(profile) {
    // 主观幸福感评估 (简化版)
    const lifeSatisfaction = profile.lifeSatisfaction || 5; // 1-10
    const positiveAffect = profile.positiveAffectFrequency || 5; // 1-10
    const negativeAffect = profile.negativeAffectFrequency || 5; // 1-10
    
    const swbScore = (lifeSatisfaction + positiveAffect + (10 - negativeAffect)) / 3;
    
    return {
      lifeSatisfaction,
      positiveAffect,
      negativeAffect,
      overallScore: swbScore.toFixed(1),
      level: swbScore >= 7 ? '高' : swbScore >= 4 ? '中等' : '需要支持',
      interpretation: this._interpretSWB(swbScore)
    };
  }
  
  _interpretSWB(score) {
    if (score >= 7) return '你的主观幸福感较高，生活满意度和积极情绪体验良好。';
    if (score >= 4) return '你的主观幸福感处于中等水平，有提升空间。';
    return '你的主观幸福感较低，建议关注情绪管理和生活满意度提升。';
  }
  
  _assessPWB(profile) {
    // 心理幸福感六维度评估
    const dimensions = {};
    const pwbDimensions = Object.keys(PWBDimensions);
    
    pwbDimensions.forEach(dim => {
      const score = profile[dim] || 5; // 默认中等
      dimensions[dim] = {
        score,
        level: score >= 7 ? '高' : score >= 4 ? '中等' : '需要发展',
        description: this.pwbDimensions[dim].description
      };
    });
    
    const overallScore = Object.values(dimensions).reduce((sum, d) => sum + d.score, 0) / 6;
    
    return {
      dimensions,
      overallScore: overallScore.toFixed(1),
      level: overallScore >= 7 ? '高实现论福祉' : overallScore >= 4 ? '中等' : '需要发展',
      strengths: Object.entries(dimensions)
        .filter(([_, d]) => d.score >= 7)
        .map(([k, _]) => PWBDimensions[k].name),
      growthAreas: Object.entries(dimensions)
        .filter(([_, d]) => d.score < 5)
        .map(([k, _]) => PWBDimensions[k].name)
    };
  }
  
  _assessPERMA(profile) {
    // PERMA 五要素评估
    const elements = {};
    const permaElements = Object.keys(PERMAElements);
    
    permaElements.forEach(elem => {
      const score = profile[elem] || 5;
      elements[elem] = {
        score,
        level: score >= 7 ? '丰富' : score >= 4 ? '中等' : '需要培养',
        description: this.permaModel[elem].description,
        practices: this.permaModel[elem].practices
      };
    });
    
    const overallScore = Object.values(elements).reduce((sum, e) => sum + e.score, 0) / 5;
    
    return {
      elements,
      overallScore: overallScore.toFixed(1),
      level: overallScore >= 7 ? '繁荣 (Flourishing)' : overallScore >= 4 ? '中等' : '需要支持',
      strongestElement: Object.entries(elements)
        .sort((a, b) => b[1].score - a[1].score)[0][0],
      weakestElement: Object.entries(elements)
        .sort((a, b) => a[1].score - b[1].score)[0][0]
    };
  }
  
  _assessObjectiveGoods(profile) {
    // 客观福祉要素评估 (简化)
    const goods = {};
    const objectiveGoods = Object.keys(ObjectiveGoods);
    
    // 随机生成示例评估 (实际应用中应由用户自评)
    objectiveGoods.forEach(good => {
      goods[good] = {
        present: Math.random() > 0.3, // 70% 概率存在
        importance: Math.floor(Math.random() * 3) + 1 // 1-3 重要性
      };
    });
    
    return {
      goods,
      presentCount: Object.values(goods).filter(g => g.present).length,
      totalGoods: objectiveGoods.length,
      coverage: (Object.values(goods).filter(g => g.present).length / objectiveGoods.length * 100).toFixed(0) + '%'
    };
  }
  
  _integrateAssessment(assessment) {
    const { swb, pwb, perma, objectiveGoods } = assessment;
    
    // 计算综合福祉指数
    const comprehensiveScore = (
      parseFloat(swb.overallScore) * 0.3 +
      parseFloat(pwb.overallScore) * 0.4 +
      parseFloat(perma.overallScore) * 0.3
    );
    
    // 确定福祉类型
    let wellBeingType;
    if (parseFloat(swb.overallScore) > parseFloat(pwb.overallScore)) {
      wellBeingType = '享乐导向型';
    } else {
      wellBeingType = '实现导向型';
    }
    
    // 识别一致性/不一致性
    const swbPwbGap = Math.abs(parseFloat(swb.overallScore) - parseFloat(pwb.overallScore));
    const consistency = swbPwbGap < 2 ? '高一致' : swbPwbGap < 4 ? '中等一致' : '低一致';
    
    return {
      comprehensiveScore: comprehensiveScore.toFixed(1),
      level: comprehensiveScore >= 7 ? '高福祉' : comprehensiveScore >= 4 ? '中等福祉' : '需要支持',
      wellBeingType,
      consistency,
      swbPwbGap: swbPwbGap.toFixed(1),
      interpretation: this._interpretIntegrated(comprehensiveScore, consistency, wellBeingType)
    };
  }
  
  _interpretIntegrated(score, consistency, type) {
    let interpretation = `你的综合福祉指数为${score.toFixed(1)}/10，属于${score >= 7 ? '高' : score >= 4 ? '中等' : '需要支持'}水平。`;
    
    if (consistency === '高一致') {
      interpretation += ' 你的主观幸福感和心理幸福感较为一致，显示整体平衡的福祉状态。';
    } else if (consistency === '低一致') {
      interpretation += ` 你的 SWB 和 PWB 存在较大差异 (${type})，这可能意味着你在某些方面满足但在其他方面有缺失。`;
    }
    
    return interpretation;
  }
  
  _generateRecommendations(assessment) {
    const recommendations = [];
    const { swb, pwb, perma } = assessment;
    
    // 基于 SWB 的建议
    if (parseFloat(swb.overallScore) < 5) {
      recommendations.push({
        area: '主观幸福感',
        priority: '高',
        practices: [
          '每日记录三件好事',
          '练习感恩日记',
          '增加积极活动频率',
          '学习情绪调节技巧'
        ],
        rationale: '提升积极情绪频率和生活满意度'
      });
    }
    
    // 基于 PWB 的建议
    if (pwb.growthAreas.length > 0) {
      recommendations.push({
        area: '心理幸福感',
        priority: '中',
        focusAreas: pwb.growthAreas,
        practices: pwb.growthAreas.map(area => 
          this.pwbDimensions[Object.keys(PWBDimensions).find(k => PWBDimensions[k].name === area)]?.practices[0]
        ).filter(Boolean),
        rationale: '发展心理幸福感的核心维度'
      });
    }
    
    // 基于 PERMA 的建议
    const weakestPerma = perma.weakestElement;
    if (perma.elements[weakestPerma].score < 5) {
      recommendations.push({
        area: 'PERMA - ' + this.permaModel[weakestPerma].name,
        priority: '中',
        practices: this.permaModel[weakestPerma].practices.slice(0, 3),
        rationale: `加强${this.permaModel[weakestPerma].name}维度的培养`
      });
    }
    
    // 整合建议
    recommendations.push({
      area: '整合福祉',
      priority: '长期',
      practices: [
        '定期 (如每月) 进行福祉自我评估',
        '平衡享乐和实现两种福祉追求',
        '培养深度关系和有意义的活动',
        '设定与价值观一致的目标'
      ],
      rationale: '促进全面、可持续的福祉发展'
    });
    
    return recommendations;
  }
  
  // ============ 干预与练习 ============
  
  /**
   * 生成个性化福祉提升计划
   */
  generateWellBeingPlan(assessment, timeFrame = '4 周') {
    const plan = {
      timeFrame,
      focusAreas: this._identifyFocusAreas(assessment),
      weeklyPlan: [],
      dailyPractices: [],
      progressTracking: {
        metrics: ['SWB 评分', 'PWB 维度', 'PERMA 要素'],
        frequency: '每周',
        method: '自评量表 + 日记'
      }
    };
    
    // 生成每周计划
    plan.weeklyPlan = this._generateWeeklyPlan(plan.focusAreas);
    
    // 生成每日练习
    plan.dailyPractices = this._generateDailyPractices(plan.focusAreas);
    
    return plan;
  }
  
  _identifyFocusAreas(assessment) {
    const areas = [];
    
    // 识别最弱的 PERMA 要素
    const weakestPerma = assessment.perma.weakestElement;
    areas.push({
      name: 'PERMA - ' + this.permaModel[weakestPerma].name,
      currentScore: assessment.perma.elements[weakestPerma].score,
      targetScore: Math.min(10, assessment.perma.elements[weakestPerma].score + 2),
      practices: this.permaModel[weakestPerma].practices
    });
    
    // 识别 PWB 成长领域
    assessment.pwb.growthAreas.forEach(area => {
      const dimKey = Object.keys(PWBDimensions).find(k => PWBDimensions[k].name === area);
      if (dimKey) {
        areas.push({
          name: 'PWB - ' + area,
          currentScore: assessment.pwb.dimensions[dimKey].score,
          targetScore: Math.min(10, assessment.pwb.dimensions[dimKey].score + 2),
          practices: this.pwbDimensions[dimKey].practices
        });
      }
    });
    
    return areas.slice(0, 3); // 最多 3 个焦点领域
  }
  
  _generateWeeklyPlan(focusAreas) {
    const weeklyPlan = [];
    
    for (let week = 1; week <= 4; week++) {
      const weekPlan = {
        week,
        theme: `第${week}周：${focusAreas[week % focusAreas.length]?.name || '整合练习'}`,
        focus: focusAreas[week % focusAreas.length],
        activities: [],
        reflection: []
      };
      
      // 添加具体活动
      if (weekPlan.focus) {
        weekPlan.activities = weekPlan.focus.practices.slice(0, 2).map(practice => ({
          practice,
          frequency: '每周 3-4 次',
          duration: '10-15 分钟'
        }));
      }
      
      // 添加反思问题
      weekPlan.reflection = [
        '这周我注意到了什么关于自己的模式？',
        '什么活动给我带来了最多的满足感？',
        '下周我想尝试什么不同的做法？'
      ];
      
      weeklyPlan.push(weekPlan);
    }
    
    return weeklyPlan;
  }
  
  _generateDailyPractices(focusAreas) {
    return [
      {
        name: '晨间意图设定',
        description: '设定今天的福祉意图',
        duration: '2 分钟',
        instructions: '问自己：今天我想如何照顾自己的福祉？'
      },
      {
        name: '三件好事',
        description: '记录今天发生的三件好事',
        duration: '5 分钟',
        instructions: '睡前记录，包括为什么这些事会发生'
      },
      {
        name: '正念呼吸',
        description: '专注呼吸，培养当下觉察',
        duration: '5 分钟',
        instructions: '专注呼吸，当思绪游离时温柔带回'
      },
      {
        name: '感恩表达',
        description: '向某人表达感谢或写感恩日记',
        duration: '3 分钟',
        instructions: '具体描述你感谢什么以及为什么'
      }
    ];
  }
  
  // ============ 幸福理论分析 ============
  
  /**
   * 分析用户的幸福观倾向
   */
  analyzeHappinessConception(userNarrative) {
    const analysis = {
      narrative: userNarrative,
      dominantTheory: null,
      theoryScores: {},
      interpretation: '',
        recommendations: []
    };
    
    // 检测享乐主义线索
    const hedonicKeywords = ['快乐', '开心', '享受', '舒服', '愉悦', '放松', ' pleasure', 'happy', 'enjoy'];
    let hedonicScore = 0;
    hedonicKeywords.forEach(kw => {
      if (userNarrative.toLowerCase().includes(kw)) hedonicScore++;
    });
    analysis.theoryScores[HappinessTheories.HEDONISM] = hedonicScore;
    
    // 检测生命满足论线索
    const satisfactionKeywords = ['满意', '满足', '值得', '有意义', '不后悔', 'satisfied', 'fulfilled', 'worth'];
    let satisfactionScore = 0;
    satisfactionKeywords.forEach(kw => {
      if (userNarrative.toLowerCase().includes(kw)) satisfactionScore++;
    });
    analysis.theoryScores[HappinessTheories.LIFE_SATISFACTION] = satisfactionScore;
    
    // 检测情绪状态论线索
    const emotionalKeywords = ['情绪', '感受', '感觉', '平静', '焦虑', '兴奋', 'emotion', 'feeling', 'calm'];
    let emotionalScore = 0;
    emotionalKeywords.forEach(kw => {
      if (userNarrative.toLowerCase().includes(kw)) emotionalScore++;
    });
    analysis.theoryScores[HappinessTheories.EMOTIONAL_STATE] = emotionalScore;
    
    // 确定主导理论
    const maxScore = Math.max(hedonicScore, satisfactionScore, emotionalScore);
    if (maxScore === hedonicScore && maxScore > 0) {
      analysis.dominantTheory = HappinessTheories.HEDONISM;
    } else if (maxScore === satisfactionScore && maxScore > 0) {
      analysis.dominantTheory = HappinessTheories.LIFE_SATISFACTION;
    } else if (maxScore === emotionalScore && maxScore > 0) {
      analysis.dominantTheory = HappinessTheories.EMOTIONAL_STATE;
    } else {
      analysis.dominantTheory = '混合或未确定';
    }
    
    analysis.interpretation = this._interpretHappinessConception(analysis);
    analysis.recommendations = this._recommendBasedOnHappinessConception(analysis);
    
    return analysis;
  }
  
  _interpretHappinessConception(analysis) {
    const interpretations = {
      [HappinessTheories.HEDONISM]: '你的幸福观倾向于享乐主义，重视快乐体验和避免痛苦。这本身没有对错，但注意平衡短期快乐和长期福祉。',
      [HappinessTheories.LIFE_SATISFACTION]: '你的幸福观倾向于生命满足论，重视对生命整体的认知评价。这显示你有反思能力和长远视角。',
      [HappinessTheories.EMOTIONAL_STATE]: '你的幸福观倾向于情绪状态论，重视当下的情绪体验。这显示你关注内在感受和情绪健康。',
      '混合或未确定': '你的幸福观可能融合了多种元素，或者需要更多探索来澄清什么对你真正重要。'
    };
    return interpretations[analysis.dominantTheory] || '';
  }
  
  _recommendBasedOnHappinessConception(analysis) {
    const recommendations = {
      [HappinessTheories.HEDONISM]: [
        '在追求快乐的同时，也考虑活动的长期价值',
        '培养"高级快乐"(如学习、创造、深度关系)',
        '练习延迟满足，避免享乐适应'
      ],
      [HappinessTheories.LIFE_SATISFACTION]: [
        '定期反思生命满意度，但不过度分析',
        '平衡认知评价和当下体验',
        '设定与价值观一致的生命目标'
      ],
      [HappinessTheories.EMOTIONAL_STATE]: [
        '培养情绪觉察和调节能力',
        '练习接纳所有情绪，而非只追求积极情绪',
        '通过正念深化情绪体验'
      ],
      '混合或未确定': [
        '探索不同幸福理论，找到最适合自己的',
        '尝试多种福祉练习，观察什么最有效',
        '定期反思和调整你的幸福观'
      ]
    };
    return recommendations[analysis.dominantTheory] || [];
  }
  
  // ============ 主交互方法 ============
  
  /**
   * 与幸福与福祉模块交互的主方法
   */
  interact(userInput, context = {}) {
    const response = {
      module: 'HappinessWellBeing (v3.52.0)',
      timestamp: new Date().toISOString(),
      userInput,
      understanding: '',
      assessment: null,
      guidance: '',
      exercises: [],
      theoreticalBasis: [
        'SEP: Happiness',
        'SEP: Well-Being',
        'Seligman (2011). Flourish',
        'Ryff (1989). Psychological Well-Being',
        'Kahneman (1999). Objective Happiness'
      ]
    };
    
    const input = userInput.toLowerCase();
    
    // 检测用户意图
    if (input.includes('评估') || input.includes('测试') || input.includes('测量')) {
      response.understanding = '你想评估自己的幸福感水平。';
      response.assessment = this._generateSampleAssessment();
      response.guidance = '基于评估结果，我可以为你生成个性化的福祉提升计划。';
      response.exercises = this._getRelevantExercises(response.assessment);
    } else if (input.includes('计划') || input.includes('提升') || input.includes('改善')) {
      response.understanding = '你想制定福祉提升计划。';
      const sampleAssessment = this._generateSampleAssessment();
      response.assessment = sampleAssessment;
      response.guidance = '基于你的情况，我推荐以下提升计划：';
      response.exercises = this.generateWellBeingPlan(sampleAssessment).dailyPractices;
    } else if (input.includes('幸福') || input.includes('快乐') || input.includes('满足')) {
      response.understanding = '你在思考幸福的本质。';
      response.assessment = this.analyzeHappinessConception(userInput);
      response.guidance = response.assessment.interpretation;
      response.exercises = response.assessment.recommendations;
    } else if (input.includes('意义') || input.includes('目标') || input.includes('价值')) {
      response.understanding = '你在探索生命的意义和目标。';
      response.guidance = '意义感是 eudaimonic 福祉的核心要素。让我们一起探索：';
      response.exercises = [
        {
          name: '价值观澄清',
          description: '识别对你最重要的 3-5 个核心价值观',
          steps: ['列出你重视的事物', '分组归类', '选出 top 5', '反思如何活出这些价值']
        },
        {
          name: '生命意义反思',
          description: '探索什么给你的生命带来意义感',
          prompts: [
            '什么活动让你感到最有意义？',
            '你希望如何被记住？',
            '什么超越自我的事物对你重要？'
          ]
        }
      ];
    } else {
      response.understanding = '幸福与福祉是一个多维度的概念。';
      response.guidance = '我可以帮你：\n1. 评估当前福祉水平 (SWB + PWB + PERMA)\n2. 分析你的幸福观倾向\n3. 制定个性化提升计划\n4. 提供基于理论的练习和建议\n\n你想从哪个开始？';
      response.exercises = [
        { name: '福祉评估', description: '全面评估你的主观和心理幸福感' },
        { name: '幸福观分析', description: '探索你对幸福的理解和倾向' },
        { name: 'PERMA 练习', description: '基于 Seligman PERMA 模型的培养练习' },
        { name: '意义探索', description: '探索生命意义和目标' }
      ];
    }
    
    return response;
  }
  
  _generateSampleAssessment() {
    // 生成示例评估 (实际应用中应由用户自评)
    const sampleProfile = {
      lifeSatisfaction: 6,
      positiveAffectFrequency: 6,
      negativeAffectFrequency: 4,
      self_acceptance: 6,
      positive_relations: 7,
      autonomy: 5,
      environmental_mastery: 6,
      purpose_in_life: 5,
      personal_growth: 7,
      positive_emotion: 6,
      engagement: 5,
      relationships: 7,
      meaning: 6,
      accomplishment: 6
    };
    
    return this.assessWellBeing(sampleProfile);
  }
  
  _getRelevantExercises(assessment) {
    const exercises = [];
    
    // 基于最弱的 PERMA 要素推荐
    const weakestPerma = assessment.perma.weakestElement;
    exercises.push({
      name: `加强${this.permaModel[weakestPerma].name}`,
      practices: this.permaModel[weakestPerma].practices.slice(0, 2)
    });
    
    // 基于 PWB 成长领域推荐
    if (assessment.pwb.growthAreas.length > 0) {
      const area = assessment.pwb.growthAreas[0];
      const dimKey = Object.keys(PWBDimensions).find(k => PWBDimensions[k].name === area);
      if (dimKey) {
        exercises.push({
          name: `发展${area}`,
          practices: this.pwbDimensions[dimKey].practices.slice(0, 2)
        });
      }
    }
    
    return exercises;
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      happinessTheories: Object.keys(HappinessTheories),
      wellBeingTheories: Object.keys(WellBeingTheories),
      permaElements: Object.keys(PERMAElements),
      pwbDimensions: Object.keys(PWBDimensions),
      objectiveGoodsCount: Object.keys(ObjectiveGoods).length
    };
  }
}

// ============ 导出模块 ============

module.exports = {
  HappinessWellBeingModule,
  HappinessTheories,
  WellBeingTheories,
  PERMAElements,
  PWBDimensions,
  ObjectiveGoods
};
