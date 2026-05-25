/**
 * 道德心理学模块 (Moral Psychology Module)
 * v3.30.0 新增
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - Virtue Ethics (美德伦理学)
 * - Consequentialism (后果论/功利主义)
 * - Deontology (义务论)
 * - Moral Cognition (道德认知)
 * - Moral Emotion (道德情感)
 * - Altruism (利他主义)
 * 
 * 核心理论来源:
 * - Aristotle. Nicomachean Ethics (尼各马可伦理学)
 * - Plato. Republic (理想国)
 * - Confucius. Analects (论语)
 * - Mencius (孟子)
 * - Kant, I. (1785). Groundwork of the Metaphysics of Morals (道德形而上学基础)
 * - Bentham, J. (1789). Introduction to the Principles of Morals and Legislation (道德与立法原理)
 * - Mill, J.S. (1861). Utilitarianism (功利主义)
 * - Anscombe, G.E.M. (1958). Modern Moral Philosophy (现代道德哲学)
 * - Kohlberg, L. (1981). Essays on Moral Development (道德发展论文集)
 * - Haidt, J. (2001). The Emotional Dog and Its Rational Tail (道德判断的情感模型)
 * - Haidt, J. (2012). The Righteous Mind (正义之心)
 * - Batson, C.D. (1991). The Altruism Question (利他主义问题)
 * - Hamilton, W.D. (1964). The Genetical Evolution of Social Behaviour (亲缘选择理论)
 * 
 * 功能目标：赋予 HeartFlow 道德判断、道德发展和道德情感支持能力
 * 
 * 1. 三大规范伦理学传统
 *    - 美德伦理学 (Virtue Ethics) - 关注"成为什么样的人"
 *    - 后果论 (Consequentialism) - 关注"行动的结果"
 *    - 义务论 (Deontology) - 关注"行动的规则/义务"
 * 
 * 2. 道德发展理论
 *    - Kohlberg 三水平六阶段模型
 *    - Haidt 社会直觉主义模型
 *    - 道德基础理论 (5+1 基础)
 * 
 * 3. 道德情感
 *    - 自我意识情绪：羞耻 (Shame)、内疚 (Guilt)、自豪 (Pride)
 *    - 他人指向情绪：道德愤怒 (Moral Anger)、蔑视 (Contempt)、厌恶 (Disgust)
 *    - 亲社会情绪：共情 (Empathy)、同情 (Compassion)、道德提升感 (Moral Elevation)
 * 
 * 4. 利他主义与亲社会行为
 *    - 进化利他主义 (亲缘选择、互惠利他)
 *    - 心理利他主义 (共情 - 利他假说)
 *    - 有效利他主义 (Effective Altruism)
 * 
 * 5. 道德困境决策支持
 *    - 电车难题变体分析
 *    - 道德权衡框架
 *    - 价值观冲突调解
 * 
 * @version 3.30.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 规范伦理学三大传统 (Normative Ethics Traditions)
 */
const NormativeEthicsTraditions = {
  VIRTUE_ETHICS: 'virtue_ethics',      // 美德伦理学 - 关注品格
  CONSEQUENTIALISM: 'consequentialism', // 后果论 - 关注结果
  DEONTOLOGY: 'deontology'             // 义务论 - 关注规则
};

/**
 * 美德伦理学核心概念 (Virtue Ethics Core Concepts)
 * 基于 Aristotle、Confucius、Mencius
 */
const VirtueEthicsConcepts = {
  // Aristotle 四主德
  WISDOM: 'wisdom',           // 实践智慧 (Phronesis)
  COURAGE: 'courage',         // 勇气
  TEMPERANCE: 'temperance',   // 节制
  JUSTICE: 'justice',         // 正义
  
  // Confucius 五常
  BENEVOLENCE: 'benevolence', // 仁
  RIGHTEOUSNESS: 'righteousness', // 义
  PROPRIETY: 'propriety',     // 礼
  WISDOM_CONFUCIAN: 'wisdom_confucian', // 智
  FAITHFULNESS: 'faithfulness', // 信
  
  // 其他重要美德
  COMPASSION: 'compassion',   // 慈悲
  INTEGRITY: 'integrity',     // 诚信
  HUMILITY: 'humility',       // 谦逊
  GRATITUDE: 'gratitude',     // 感恩
  Forgiveness: 'forgiveness'  // 宽恕
};

/**
 * 后果论类型 (Consequentialism Types)
 */
const ConsequentialismTypes = {
  ACT_UTILITARIANISM: 'act_utilitarianism',        // 行为功利主义
  RULE_UTILITARIANISM: 'rule_utilitarianism',      // 规则功利主义
  PREFERENCE_UTILITARIANISM: 'preference_utilitarianism', // 偏好功利主义
  NEGATIVE_UTILITARIANISM: 'negative_utilitarianism', // 负面功利主义 (减少痛苦优先)
  EFFECTIVE_ALTRUISM: 'effective_altruism'         // 有效利他主义
};

/**
 * 义务论核心概念 (Deontology Core Concepts)
 * 基于 Kant
 */
const DeontologyConcepts = {
  CATEGORICAL_IMPERATIVE: 'categorical_imperative', // 绝对命令
  UNIVERSALIZABILITY: 'universalizability',         // 可普遍化原则
  HUMANITY_FORMULA: 'humanity_formula',             // 人性公式 (人是目的)
  AUTONOMY: 'autonomy',                             // 自律
  DUTY: 'duty',                                     // 义务
  GOOD_WILL: 'good_will'                            // 善良意志
};

/**
 * Kohlberg 道德发展三水平六阶段 (Kohlberg's Moral Development)
 */
const KohlbergLevels = {
  // 水平 1: 前习俗道德 (Pre-conventional)
  PRE_CONVENTIONAL: {
    STAGE_1_OBEDIENCE: 'stage_1_obedience',     // 阶段 1: 服从与惩罚导向
    STAGE_2_INSTRUMENTAL: 'stage_2_instrumental' // 阶段 2: 个人利益/交换导向
  },
  // 水平 2: 习俗道德 (Conventional)
  CONVENTIONAL: {
    STAGE_3_INTERPERSONAL: 'stage_3_interpersonal', // 阶段 3: 人际和谐/好孩子导向
    STAGE_4_AUTHORITY: 'stage_4_authority'         // 阶段 4: 权威与社会秩序导向
  },
  // 水平 3: 后习俗道德 (Post-conventional)
  POST_CONVENTIONAL: {
    STAGE_5_SOCIAL_CONTRACT: 'stage_5_social_contract', // 阶段 5: 社会契约导向
    STAGE_6_UNIVERSAL_PRINCIPLES: 'stage_6_universal_principles' // 阶段 6: 普遍伦理原则导向
  }
};

/**
 * Haidt 道德基础理论 (Moral Foundations Theory)
 * 5+1 基础：关爱/伤害、公平/欺骗、忠诚/背叛、权威/颠覆、圣洁/堕落、自由/压迫
 */
const MoralFoundations = {
  CARE_HARM: 'care_harm',         // 关爱/伤害 - 保护他人免受伤害
  FAIRNESS_CHEATING: 'fairness_cheating', // 公平/欺骗 - 正义、权利、互惠
  LOYALTY_BETRAYAL: 'loyalty_betrayal', // 忠诚/背叛 - 群体归属、爱国
  AUTHORITY_SUBVERSION: 'authority_subversion', // 权威/颠覆 - 尊重传统、等级
  PURITY_DEGRADATION: 'purity_degradation', // 圣洁/堕落 - 神圣、洁净
  LIBERTY_OPPRESSION: 'liberty_oppression' // 自由/压迫 - 反抗暴政、自主
};

/**
 * 道德情感类型 (Moral Emotion Types)
 */
const MoralEmotionTypes = {
  // 自我意识情绪 (Self-conscious Emotions)
  SHAME: 'shame',         // 羞耻 - "我是个坏人"
  GUILT: 'guilt',         // 内疚 - "我做了坏事"
  PRIDE: 'pride',         // 自豪 - "我做了善事"
  EMBARRASSMENT: 'embarrassment', // 尴尬
  
  // 他人指向情绪 (Other-condemning Emotions)
  MORAL_ANGER: 'moral_anger',     // 道德愤怒
  CONTEMPT: 'contempt',           // 蔑视
  DISGUST: 'disgust',             // 道德厌恶
  
  // 亲社会情绪 (Prosocial Emotions)
  EMPATHY: 'empathy',             // 共情
  COMPASSION: 'compassion',       // 同情/慈悲
  GRATITUDE: 'gratitude',         // 感恩
  MORAL_ELEVATION: 'moral_elevation', // 道德提升感 (见证善行时的感动)
  AWE: 'awe'                      // 敬畏
};

/**
 * 利他主义类型 (Altruism Types)
 */
const AltruismTypes = {
  KIN_ALTRUISM: 'kin_altruism',           // 亲缘利他 (Hamilton 亲缘选择)
  RECIPROCAL_ALTRUISM: 'reciprocal_altruism', // 互惠利他 (Trivers)
  PSYCHOLOGICAL_ALTRUISM: 'psychological_altruism', // 心理利他 (Batson 共情 - 利他假说)
  EFFECTIVE_ALTRUISM: 'effective_altruism', // 有效利他 (用证据和理性最大化善行影响)
  PATHOLOGICAL_ALTRUISM: 'pathological_altruism' // 病理性利他 (过度利他损害自身)
};

// ============ 道德心理学模块类 ============

class MoralPsychologyModule {
  constructor() {
    this.name = 'MoralPsychology';
    this.version = '3.31.0';
    this.description = '基于 SEP 权威理论的道德判断、道德发展与道德情感分析，整合 Frankfurt Cases、意志薄弱干预和道德基础理论';
    
    // 伦理学传统数据库
    this.ethicsTraditions = this._initEthicsTraditions();
    
    // 道德发展阶段描述
    this.kohlbergStages = this._initKohlbergStages();
    
    // 道德基础描述
    this.moralFoundationsDesc = this._initMoralFoundations();
    
    // 道德情感描述
    this.moralEmotionsDesc = this._initMoralEmotions();
  }
  
  // ============ 初始化方法 ============
  
  _initEthicsTraditions() {
    return {
      [NormativeEthicsTraditions.VIRTUE_ETHICS]: {
        name: '美德伦理学',
        coreQuestion: '我应该成为什么样的人？',
        keyConcepts: ['美德 (Virtue)', '实践智慧 (Phronesis)', '幸福/繁荣 (Eudaimonia)', '中道 (Golden Mean)'],
        strengths: ['关注品格而非单一行为', '强调道德教育和习惯养成', '整合情感与理性'],
        limitations: ['在道德困境中可能缺乏明确指导', '美德定义可能有文化差异'],
        application: '反思"一个有美德的人会怎么做"，培养道德品格而非机械遵循规则'
      },
      [NormativeEthicsTraditions.CONSEQUENTIALISM]: {
        name: '后果论/功利主义',
        coreQuestion: '哪个行动会产生最好的结果？',
        keyConcepts: ['最大幸福原则', '结果决定对错', '不偏不倚的旁观者', '成本 - 效益分析'],
        strengths: ['提供清晰的决策程序', '强调行动的实际影响', '适用于公共政策'],
        limitations: ['可能忽视个体权利', '预测后果困难', '可能要求过高的牺牲'],
        application: '评估各选项对所有相关者的影响，选择最大化整体福祉的行动'
      },
      [NormativeEthicsTraditions.DEONTOLOGY]: {
        name: '义务论',
        coreQuestion: '我的义务是什么？什么规则应该遵循？',
        keyConcepts: ['绝对命令', '可普遍化原则', '人是目的而非手段', '义务优先于结果'],
        strengths: ['保护个体权利和尊严', '提供明确的道德约束', '强调动机的重要性'],
        limitations: ['规则冲突时难以解决', '可能忽视行动的实际后果', '显得僵化'],
        application: '检验行动准则是否可普遍化，是否将人当作目的而非仅仅手段'
      }
    };
  }
  
  _initKohlbergStages() {
    return {
      [KohlbergLevels.PRE_CONVENTIONAL.STAGE_1_OBEDIENCE]: {
        level: '前习俗道德',
        stage: 1,
        name: '服从与惩罚导向',
        reasoning: '行为对错取决于是否会受到惩罚。服从权威以避免惩罚。',
        example: '我不应该偷药，因为会被抓去坐牢。',
        limitation: '不考虑他人需求，仅关注自身后果'
      },
      [KohlbergLevels.PRE_CONVENTIONAL.STAGE_2_INSTRUMENTAL]: {
        level: '前习俗道德',
        stage: 2,
        name: '个人利益/交换导向',
        reasoning: '行为对错取决于是否满足自身需求。"你帮我，我帮你"的交换逻辑。',
        example: '我应该偷药，因为妻子活着对我有好处。',
        limitation: '缺乏真正的道德义务感，仅基于利益计算'
      },
      [KohlbergLevels.CONVENTIONAL.STAGE_3_INTERPERSONAL]: {
        level: '习俗道德',
        stage: 3,
        name: '人际和谐/好孩子导向',
        reasoning: '行为对错取决于是否能获得他人认可、维持良好关系。',
        example: '我应该偷药，因为好丈夫应该照顾妻子。',
        limitation: '过度依赖他人意见，可能忽视更广泛的正义'
      },
      [KohlbergLevels.CONVENTIONAL.STAGE_4_AUTHORITY]: {
        level: '习俗道德',
        stage: 4,
        name: '权威与社会秩序导向',
        reasoning: '行为对错取决于是否遵守法律和社会秩序。',
        example: '我不应该偷药，因为偷窃违法，会破坏社会秩序。',
        limitation: '可能僵化遵循规则，忽视特殊情况的人道需求'
      },
      [KohlbergLevels.POST_CONVENTIONAL.STAGE_5_SOCIAL_CONTRACT]: {
        level: '后习俗道德',
        stage: 5,
        name: '社会契约导向',
        reasoning: '法律是社会契约，应服务于人类福祉。不公正的法律可以被质疑。',
        example: '虽然偷窃违法，但生命权高于财产权，法律应该保护生命。',
        limitation: '需要复杂的道德推理能力'
      },
      [KohlbergLevels.POST_CONVENTIONAL.STAGE_6_UNIVERSAL_PRINCIPLES]: {
        level: '后习俗道德',
        stage: 6,
        name: '普遍伦理原则导向',
        reasoning: '基于普遍的正义、平等、人权等抽象原则。即使违法也要遵循良知。',
        example: '生命的尊严是普遍原则，高于任何具体法律。',
        limitation: 'Kohlberg 认为很少有人达到此阶段'
      }
    };
  }
  
  _initMoralFoundations() {
    return {
      [MoralFoundations.CARE_HARM]: {
        name: '关爱/伤害',
        description: '保护他人免受伤害，关心弱者，培养同情心。',
        virtue: '仁爱、慈悲',
        vice: '残忍、冷漠',
        politicalLean: '自由派更强调此基础'
      },
      [MoralFoundations.FAIRNESS_CHEATING]: {
        name: '公平/欺骗',
        description: '正义、权利、互惠、诚实。反对欺骗和搭便车。',
        virtue: '公正、诚实',
        vice: '欺骗、剥削',
        politicalLean: '自由派和保守派都重视，但定义不同'
      },
      [MoralFoundations.LOYALTY_BETRAYAL]: {
        name: '忠诚/背叛',
        description: '对群体、家庭、国家的忠诚。爱国主义，团队精神。',
        virtue: '忠诚、爱国',
        vice: '背叛、叛徒',
        politicalLean: '保守派更强调此基础'
      },
      [MoralFoundations.AUTHORITY_SUBVERSION]: {
        name: '权威/颠覆',
        description: '尊重传统、等级、合法权威。孝道，尊师重道。',
        virtue: '尊重、孝道',
        vice: '叛逆、无礼',
        politicalLean: '保守派更强调此基础'
      },
      [MoralFoundations.PURITY_DEGRADATION]: {
        name: '圣洁/堕落',
        description: '追求神圣、洁净，避免污染和堕落。',
        virtue: '节制、纯洁',
        vice: '放纵、污染',
        politicalLean: '保守派更强调此基础'
      },
      [MoralFoundations.LIBERTY_OPPRESSION]: {
        name: '自由/压迫',
        description: '反抗暴政、压迫，追求自主和自由。',
        virtue: '勇气、独立',
        vice: '压迫、顺从',
        politicalLean: '自由派和自由意志主义者强调'
      }
    };
  }
  
  _initMoralEmotions() {
    return {
      [MoralEmotionTypes.SHAME]: {
        name: '羞耻',
        focus: '自我 ("我是个坏人")',
        trigger: '违背重要价值观或社会规范，感到自我有缺陷',
        function: '维护社会规范，促使自我改进或隐藏',
        healthyResponse: '区分行为与自我价值，从错误中学习而非自我否定'
      },
      [MoralEmotionTypes.GUILT]: {
        name: '内疚',
        focus: '行为 ("我做了坏事")',
        trigger: '伤害他人或违背自己的道德标准',
        function: '促使弥补、道歉、修复关系',
        healthyResponse: '承认错误，采取修复行动，原谅自己'
      },
      [MoralEmotionTypes.PRAY]: {
        name: '自豪',
        focus: '自我与行为',
        trigger: '达成成就或做出符合价值观的行为',
        function: '强化积极行为，提升自尊',
        healthyResponse: '认可自己的努力，同时保持谦逊'
      },
      [MoralEmotionTypes.MORAL_ANGER]: {
        name: '道德愤怒',
        focus: '他人',
        trigger: '目睹不公正、伤害或道德违规',
        function: '激励制止不公、维护正义',
        healthyResponse: '将愤怒转化为建设性行动，避免过度报复'
      },
      [MoralEmotionTypes.MORAL_ELEVATION]: {
        name: '道德提升感',
        focus: '他人与自我',
        trigger: '见证他人的善行、美德或自我牺牲',
        function: '激励自己也行善，增强对人性的信心',
        healthyResponse: '让感动转化为行动，传播善行'
      },
      [MoralEmotionTypes.EMPATHY]: {
        name: '共情',
        focus: '他人',
        trigger: '感知他人的情绪状态',
        function: '促进理解、连接和亲社会行为',
        healthyResponse: '保持共情边界，避免共情疲劳'
      },
      [MoralEmotionTypes.COMPASSION]: {
        name: '同情/慈悲',
        focus: '他人',
        trigger: '感知他人的痛苦并希望减轻',
        function: '激励帮助行为，促进社会连接',
        healthyResponse: '将同情转化为有效帮助，同时自我照顾'
      }
    };
  }
  
  // ============ 核心分析方法 ============
  
  /**
   * 分析道德困境的三大伦理学视角
   * @param {string} dilemma - 道德困境描述
   * @returns {Object} 三大传统的分析结果
   */
  analyzeEthicalTraditions(dilemma) {
    const analysis = {
      dilemma,
      timestamp: new Date().toISOString(),
      traditions: {}
    };
    
    // 美德伦理学分析
    analysis.traditions[NormativeEthicsTraditions.VIRTUE_ETHICS] = {
      tradition: '美德伦理学',
      coreQuestion: '在这种情况下，一个有美德的人会怎么做？',
      analysis: this._analyzeVirtueEthics(dilemma),
      reflection: [
        '这个决定会培养还是削弱我的品格？',
        '我希望成为什么样的人？',
        '这个选择是否符合我的核心价值观？'
      ]
    };
    
    // 后果论分析
    analysis.traditions[NormativeEthicsTraditions.CONSEQUENTIALISM] = {
      tradition: '后果论/功利主义',
      coreQuestion: '哪个选择会产生最好的整体结果？',
      analysis: this._analyzeConsequentialism(dilemma),
      reflection: [
        '每个选项会影响哪些人？',
        '短期和长期后果分别是什么？',
        '如何最大化整体福祉？'
      ]
    };
    
    // 义务论分析
    analysis.traditions[NormativeEthicsTraditions.DEONTOLOGY] = {
      tradition: '义务论',
      coreQuestion: '我的义务是什么？什么规则应该遵循？',
      analysis: this._analyzeDeontology(dilemma),
      reflection: [
        '我的行动准则能普遍化吗？',
        '我是否将他人当作目的而非手段？',
        '我的动机是否出于义务而非私利？'
      ]
    };
    
    return analysis;
  }
  
  _analyzeVirtueEthics(dilemma) {
    // 简化的美德伦理学分析逻辑
    return {
      relevantVirtues: ['智慧', '勇气', '仁爱', '正义'],
      consideration: '美德伦理学关注的是"成为什么样的人"而非"做什么事"。在这个困境中，反思哪种选择能培养和表达你的最佳品格。',
      guidance: '想象一个你尊敬的人（道德榜样）会如何处理这种情况。他们的选择反映了什么美德？'
    };
  }
  
  _analyzeConsequentialism(dilemma) {
    // 简化的后果论分析逻辑
    return {
      stakeholders: '识别所有受影响的人',
      consideration: '后果论要求评估每个选项对所有相关者的影响。考虑短期和长期、直接和间接的后果。',
      guidance: '尝试量化各选项的利弊：谁会受益？谁会受损？受益/受损程度如何？概率多大？'
    };
  }
  
  _analyzeDeontology(dilemma) {
    // 简化的义务论分析逻辑
    return {
      relevantDuties: ['诚实', '尊重生命', '遵守承诺', '公正'],
      consideration: '义务论强调某些行动本身就是对或错，不论结果如何。检验你的行动准则是否能成为普遍法则。',
      guidance: '问自己：如果每个人都按我的准则行动，世界会变得更好还是更糟？我是否尊重了他人的尊严和权利？'
    };
  }
  
  /**
   * 评估道德发展阶段
   * @param {string} reasoning - 用户的道德推理表述
   * @returns {Object} 道德发展阶段评估
   */
  assessMoralDevelopmentStage(reasoning) {
    // 简化的阶段识别逻辑
    const stageIndicators = {
      [KohlbergLevels.PRE_CONVENTIONAL.STAGE_1_OBEDIENCE]: ['惩罚', '被抓', '违法', '坐牢'],
      [KohlbergLevels.PRE_CONVENTIONAL.STAGE_2_INSTRUMENTAL]: ['好处', '利益', '交换', '对我'],
      [KohlbergLevels.CONVENTIONAL.STAGE_3_INTERPERSONAL]: ['别人怎么看', '好丈夫', '认可', '关系'],
      [KohlbergLevels.CONVENTIONAL.STAGE_4_AUTHORITY]: ['法律', '秩序', '规则', '义务'],
      [KohlbergLevels.POST_CONVENTIONAL.STAGE_5_SOCIAL_CONTRACT]: ['权利', '契约', '公正的法律', '福祉'],
      [KohlbergLevels.POST_CONVENTIONAL.STAGE_6_UNIVERSAL_PRINCIPLES]: ['普遍原则', '人权', '尊严', '良知']
    };
    
    let detectedStage = null;
    let highestScore = 0;
    
    for (const [stage, indicators] of Object.entries(stageIndicators)) {
      const score = indicators.filter(ind => reasoning.toLowerCase().includes(ind)).length;
      if (score > highestScore) {
        highestScore = score;
        detectedStage = stage;
      }
    }
    
    const stageInfo = this.kohlbergStages[detectedStage];
    
    return {
      detectedStage: detectedStage,
      stageInfo: stageInfo,
      reasoning: reasoning,
      development: stageInfo ? `当前推理反映了${stageInfo.level}的${stageInfo.name}阶段` : '无法确定阶段',
      nextStage: this._getNextStage(detectedStage)
    };
  }
  
  _getNextStage(currentStage) {
    const stageOrder = Object.values(KohlbergLevels).flat();
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      return this.kohlbergStages[nextStage];
    }
    return null;
  }
  
  /**
   * 分析道德基础倾向
   * @param {string} statement - 用户的道德陈述
   * @returns {Object} 道德基础分析
   */
  analyzeMoralFoundations(statement) {
    const foundationKeywords = {
      [MoralFoundations.CARE_HARM]: ['伤害', '痛苦', '保护', '关爱', '同情', '弱者'],
      [MoralFoundations.FAIRNESS_CHEATING]: ['公平', '正义', '权利', '欺骗', '平等', '互惠'],
      [MoralFoundations.LOYALTY_BETRAYAL]: ['忠诚', '背叛', '国家', '团队', '家庭', '爱国'],
      [MoralFoundations.AUTHORITY_SUBVERSION]: ['权威', '尊重', '传统', '等级', '孝道', '服从'],
      [MoralFoundations.PURITY_DEGRADATION]: ['纯洁', '神圣', '污染', '堕落', '节制', '洁净'],
      [MoralFoundations.LIBERTY_OPPRESSION]: ['自由', '压迫', '自主', '权利', '反抗', '暴政']
    };
    
    const scores = {};
    let maxScore = 0;
    let dominantFoundation = null;
    
    for (const [foundation, keywords] of Object.entries(foundationKeywords)) {
      const score = keywords.filter(kw => statement.toLowerCase().includes(kw)).length;
      scores[foundation] = score;
      if (score > maxScore) {
        maxScore = score;
        dominantFoundation = foundation;
      }
    }
    
    return {
      scores,
      dominantFoundation: dominantFoundation ? this.moralFoundationsDesc[dominantFoundation] : null,
      statement,
      insight: this._generateFoundationInsight(scores)
    };
  }
  
  _generateFoundationInsight(scores) {
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) return '陈述中没有明显的道德基础关键词';
    
    const individualizing = (scores[MoralFoundations.CARE_HARM] || 0) + (scores[MoralFoundations.FAIRNESS_CHEATING] || 0);
    const binding = (scores[MoralFoundations.LOYALTY_BETRAYAL] || 0) + 
                    (scores[MoralFoundations.AUTHORITY_SUBVERSION] || 0) + 
                    (scores[MoralFoundations.PURITY_DEGRADATION] || 0);
    
    let insight = `道德基础分布：关爱/公平=${individualizing}, 忠诚/权威/纯洁=${binding}。`;
    
    if (individualizing > binding) {
      insight += '倾向于个人化道德基础（更关注个体权利和福祉）。';
    } else if (binding > individualizing) {
      insight += '倾向于绑定性道德基础（更关注群体、传统和秩序）。';
    } else {
      insight += '道德基础相对平衡。';
    }
    
    return insight;
  }
  
  /**
   * 分析道德情感状态
   * @param {string} emotionalExpression - 情绪表达
   * @returns {Object} 道德情感分析
   */
  analyzeMoralEmotion(emotionalExpression) {
    const emotionKeywords = {
      [MoralEmotionTypes.SHAME]: ['羞耻', '丢脸', '没脸', '废物', '丢人'],
      [MoralEmotionTypes.GUILT]: ['内疚', '愧疚', '对不起', '后悔', '不该'],
      [MoralEmotionTypes.MORAL_ANGER]: ['愤怒', '生气', '不公平', '可恶', '混蛋'],
      [MoralEmotionTypes.MORAL_ELEVATION]: ['感动', '温暖', '敬佩', '榜样', '人性光辉'],
      [MoralEmotionTypes.EMPATHY]: ['理解', '感受', '体会', '站在', '感同身受'],
      [MoralEmotionTypes.COMPASSION]: ['同情', '可怜', '心疼', '帮助', '减轻痛苦']
    };
    
    let detectedEmotions = [];
    
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some(kw => emotionalExpression.toLowerCase().includes(kw))) {
        detectedEmotions.push({
          emotion: this.moralEmotionsDesc[emotion],
          intensity: keywords.filter(kw => emotionalExpression.toLowerCase().includes(kw)).length
        });
      }
    }
    
    return {
      detectedEmotions: detectedEmotions.sort((a, b) => b.intensity - a.intensity),
      primaryEmotion: detectedEmotions[0]?.emotion || null,
      expression: emotionalExpression,
      guidance: this._generateEmotionGuidance(detectedEmotions[0]?.emotion)
    };
  }
  
  _generateEmotionGuidance(primaryEmotion) {
    if (!primaryEmotion) return '未检测到明显的道德情感';
    
    const guidanceMap = {
      [MoralEmotionTypes.SHAME]: '羞耻感可能让你想隐藏或逃避。试着区分"我做了错事"和"我是坏人"。错误可以改正，你的价值不取决于单一行为。',
      [MoralEmotionTypes.GUILT]: '内疚感是良知的信号。它提示你需要修复关系或弥补错误。考虑：你能做什么来弥补？如何避免重蹈覆辙？',
      [MoralEmotionTypes.MORAL_ANGER]: '道德愤怒可以激励正义行动，但也可能导致过度报复。问自己：我的愤怒是否指向真正的不公？如何将愤怒转化为建设性改变？',
      [MoralEmotionTypes.MORAL_ELEVATION]: '道德提升感是见证善行时的感动。让这份感动激励你也成为他人的榜样。善行会传递。',
      [MoralEmotionTypes.EMPATHY]: '共情是道德的基础。保持开放的心态去感受他人，同时注意边界，避免共情疲劳。',
      [MoralEmotionTypes.COMPASSION]: '同情心促使你帮助他人。将同情转化为有效行动，同时记得照顾自己——你无法从空杯子里倒出水。'
    };
    
    return guidanceMap[primaryEmotion.name] || '';
  }
  
  /**
   * 分析利他主义动机
   * @param {string} altruisticBehavior - 利他行为描述
   * @returns {Object} 利他主义类型分析
   */
  analyzeAltruismType(altruisticBehavior) {
    // 简化的利他类型识别
    const behaviorLower = altruisticBehavior.toLowerCase();
    
    const analysis = {
      behavior: altruisticBehavior,
      possibleTypes: [],
      primaryType: null
    };
    
    // 亲缘利他线索
    if (behaviorLower.includes('家人') || behaviorLower.includes('孩子') || behaviorLower.includes('父母') || behaviorLower.includes('亲戚')) {
      analysis.possibleTypes.push({
        type: AltruismTypes.KIN_ALTRUISM,
        theory: 'Hamilton 亲缘选择理论',
        explanation: '帮助遗传相关的亲属，增加基因传递概率'
      });
    }
    
    // 互惠利他线索
    if (behaviorLower.includes('回报') || behaviorLower.includes('互惠') || behaviorLower.includes('人情') || behaviorLower.includes('将来')) {
      analysis.possibleTypes.push({
        type: AltruismTypes.RECIPROCAL_ALTRUISM,
        theory: 'Trivers 互惠利他理论',
        explanation: '期待未来的互惠回报，建立长期合作关系'
      });
    }
    
    // 心理利他线索
    if (behaviorLower.includes('共情') || behaviorLower.includes('感受') || behaviorLower.includes('痛苦') || behaviorLower.includes('不忍心')) {
      analysis.possibleTypes.push({
        type: AltruismTypes.PSYCHOLOGICAL_ALTRUISM,
        theory: 'Batson 共情 - 利他假说',
        explanation: '由共情驱动的纯粹利他动机，不期待回报'
      });
    }
    
    // 有效利他线索
    if (behaviorLower.includes('最大化') || behaviorLower.includes('证据') || behaviorLower.includes('理性') || behaviorLower.includes('影响')) {
      analysis.possibleTypes.push({
        type: AltruismTypes.EFFECTIVE_ALTRUISM,
        theory: '有效利他主义运动',
        explanation: '用证据和理性分析，最大化善行的影响力'
      });
    }
    
    analysis.primaryType = analysis.possibleTypes[0] || null;
    
    return analysis;
  }
  
  // ============ 主交互方法 ============
  
  /**
   * 与道德心理学模块交互的主方法
   * @param {string} userInput - 用户输入
   * @returns {Object} 综合道德分析
   */
  interact(userInput) {
    const analysis = {
      timestamp: new Date().toISOString(),
      userInput,
      ethicalTraditionsAnalysis: this.analyzeEthicalTraditions(userInput),
      moralDevelopmentAssessment: this.assessMoralDevelopmentStage(userInput),
      moralFoundationsAnalysis: this.analyzeMoralFoundations(userInput),
      moralEmotionAnalysis: this.analyzeMoralEmotion(userInput),
      integratedGuidance: this._generateIntegratedGuidance(userInput)
    };
    
    return analysis;
  }
  
  _generateIntegratedGuidance(userInput) {
    return {
      summary: '道德决策是复杂的，涉及多个维度。以下是综合建议：',
      steps: [
        '1. 从三大伦理学传统角度反思你的困境',
        '2. 觉察你的道德情感（内疚、愤怒、同情等）',
        '3. 识别你的道德基础倾向（关爱、公平、忠诚等）',
        '4. 考虑你的道德发展阶段，是否有更成熟的视角？',
        '5. 整合理性分析与情感智慧，做出符合价值观的决定'
      ],
      reflection: [
        '这个决定会让我成为什么样的人？',
        '我能接受这个决定的所有后果吗？',
        '这个决定是否尊重了所有相关者的尊严？',
        '如果我的选择被公开，我会感到自豪吗？'
      ]
    };
  }
  
  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      traditions: Object.keys(this.ethicsTraditions),
      kohlbergLevels: 6,
      moralFoundations: 6,
      moralEmotions: Object.keys(this.moralEmotionsDesc).length,
      altruismTypes: Object.keys(AltruismTypes).length
    };
  }
}

// ============ 导出模块 ============

module.exports = {
  MoralPsychologyModule,
  NormativeEthicsTraditions,
  VirtueEthicsConcepts,
  ConsequentialismTypes,
  DeontologyConcepts,
  KohlbergLevels,
  MoralFoundations,
  MoralEmotionTypes,
  AltruismTypes
};
