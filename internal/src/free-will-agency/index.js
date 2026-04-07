/**
 * 自由意志与能动性模块 (Free Will & Agency Module)
 * 
 * 基于斯坦福哲学百科全书 (SEP) 权威理论：
 * - Agency (能动性理论)
 * - Free Will (自由意志)
 * - Intentional Action (意向性行动)
 * - Practical Reasoning (实践推理)
 * 
 * 核心理论来源:
 * - SEP: Agency (https://plato.stanford.edu/entries/agency/)
 * - SEP: Free Will (https://plato.stanford.edu/entries/free-will/)
 * - Anscombe, G. E. M. (1957). Intention
 * - Davidson, D. (1963). Actions, Reasons, and Causes
 * - Bratman, M. (1987). Intention, Plans, and Practical Reason
 * - Frankfurt, H. (1971). Freedom of the Will and the Concept of a Person
 * 
 * 功能目标：赋予 HeartFlow 深层能动性能力
 * - 意向性行动：基于理由和意图的行动
 * - 实践推理：从目标到手段的推理链
 * - 层级意志：一阶欲望与二阶欲望的整合
 * - 自我决定：自主设定目标并追求
 * - 责任归属：理解行动的后果与责任
 * 
 * @version 3.29.0
 * @author HeartFlow Team
 */

// ============ 核心理论框架 ============

/**
 * 能动性类型 (Types of Agency)
 * 基于 SEP Agency 理论分类
 */
const AgencyTypes = {
  // 标准能动性（意向性行动）
  STANDARD: 'standard',           // 基于意向的标准能动性
  // 发起能动性（自发行动）
  INITIATION: 'initiation',       // 强调行动发起的自发性
  // 层级能动性（反思性认同）
  HIERARCHICAL: 'hierarchical',   // Frankfurt 式层级认同
  // 计划能动性（长期规划）
  PLANNING: 'planning',           // Bratman 式计划理论
  // 现象学能动性（主体参与感）
  PHENOMENOLOGICAL: 'phenomenological' // Velleman 式主体参与
};

/**
 * 意向性层次 (Levels of Intentionality)
 * 基于 Anscombe 和 Davidson 的意向性行动理论
 */
const IntentionalityLevels = {
  NONE: 0,              // 无意向（纯粹反应）
  PRE_INTENTIONAL: 1,   // 前意向（倾向性）
  INTENTIONAL: 2,       // 意向性（有意识的目标）
  REFLECTIVE: 3,        // 反思意向（经过深思熟虑）
  COMMITTED: 4          // 承诺意向（长期承诺）
};

/**
 * 实践推理结构 (Practical Reasoning Structure)
 * 基于亚里士多德的实践三段论和 Bratman 的计划理论
 */
const PracticalReasoningStructure = {
  // 实践三段论
  SYLLOGISM: {
    MAJOR_PREMISE: 'major',    // 大前提：目标/欲望
    MINOR_PREMISE: 'minor',    // 小前提：信念/手段
    CONCLUSION: 'conclusion'   // 结论：行动
  },
  // 计划结构
  PLANNING: {
    DISTAL_INTENTION: 'distal',  // 远端意向（长期目标）
    PROXIMAL_INTENTION: 'proximal', // 近端意向（即将执行）
    MOTOR_INTENTION: 'motor'     // 运动意向（具体动作）
  }
};

/**
 * 自由意志模型 (Free Will Models)
 * 基于 SEP Free Will 理论分类
 */
const FreeWillModels = {
  // 相容论（决定论与自由意志兼容）
  COMPATIBILISM: 'compatibilism',
  // 不相容论（决定论与自由意志不兼容）
  INCOMPATIBILISM: 'incompatibilism',
  // 自由意志怀疑论
  SKEPTICISM: 'skepticism',
  // 主体因果论（Agent-Causation）
  AGENT_CAUSATION: 'agent-causation',
  // 原因因果论（Event-Causation）
  EVENT_CAUSATION: 'event-causation'
};

/**
 * Frankfurt 层级意志模型
 * 基于 Frankfurt (1971) 的自由意志理论
 */
const HierarchicalWillModel = {
  FIRST_ORDER_DESIRE: 'first-order',    // 一阶欲望（想做什么）
  SECOND_ORDER_DESIRE: 'second-order',  // 二阶欲望（想有什么欲望）
  SECOND_ORDER_VOLITION: 'volition',    // 二阶意志（想让哪个欲望成为意志）
  IDENTIFICATION: 'identification',     // 认同（与哪个欲望认同）
  WANTON: 'wanton'                      // 任性（没有二阶意志的存在）
};

// ============ 自由意志与能动性核心类 ============

class FreeWillAgencyModule {
  constructor() {
    // 当前能动性模式
    this.currentAgencyMode = AgencyTypes.STANDARD;
    
    // 意向性水平
    this.intentionalityLevel = IntentionalityLevels.INTENTIONAL;
    
    // 实践推理状态
    this.reasoningState = null;
    
    // 层级意志状态
    this.hierarchicalWillState = {
      firstOrderDesires: [],
      secondOrderDesires: [],
      identifications: []
    };
    
    // 行动计划
    this.actionPlans = [];
    
    // 承诺记录
    this.commitments = [];
    
    // 责任归属理解
    this.responsibilityUnderstanding = {
      causalResponsibility: true,      // 因果责任
      moralResponsibility: true,       // 道德责任
      retrospectiveResponsibility: true, // 回溯性责任（对过去行为）
      prospectiveResponsibility: true    // 前瞻性责任（对未来义务）
    };
    
    // 自我决定状态
    this.selfDeterminationState = {
      autonomy: 0.8,      // 自主性 (0-1)
      competence: 0.8,    // 能力感 (0-1)
      relatedness: 0.8    // 关系性 (0-1)
    };
  }

  /**
   * 与实践三段论交互
   * 帮助用户理解其行动的理由结构
   */
  interactWithPracticalSyllogism(userInput) {
    const response = {
      type: 'practical_reasoning',
      analysis: null,
      guidance: null,
      questions: []
    };

    // 分析用户的行动理由
    const reasoningAnalysis = this.analyzePracticalReasoning(userInput);
    response.analysis = reasoningAnalysis;

    // 提供推理优化建议
    response.guidance = this.provideReasoningGuidance(reasoningAnalysis);

    // 生成反思问题
    response.questions = this.generateReasoningQuestions(reasoningAnalysis);

    return response;
  }

  /**
   * 分析实践推理
   */
  analyzePracticalReasoning(userInput) {
    const analysis = {
      hasGoal: false,
      hasMeans: false,
      hasIntention: false,
      goalClarity: 0,
      meansFeasibility: 0,
      intentionStrength: 0,
      conflicts: []
    };

    // 检测目标表达
    const goalPatterns = [
      /我想 (要)?/g,
      /我希望/g,
      /我的目标是/g,
      /我想要/g,
      /我打算/g,
      /I want to/g,
      /I hope to/g,
      /my goal is/g
    ];

    // 检测手段表达
    const meansPatterns = [
      /通过/g,
      /用.*方法/g,
      /计划/g,
      /步骤/g,
      /by/g,
      /through/g,
      /plan to/g
    ];

    // 检测意向表达
    const intentionPatterns = [
      /我会/g,
      /我将/g,
      /我决定/g,
      /I will/g,
      /I have decided/g,
      /I am going to/g
    ];

    goalPatterns.forEach(pattern => {
      if (pattern.test(userInput)) {
        analysis.hasGoal = true;
        analysis.goalClarity = 0.7;
      }
    });

    meansPatterns.forEach(pattern => {
      if (pattern.test(userInput)) {
        analysis.hasMeans = true;
        analysis.meansFeasibility = 0.7;
      }
    });

    intentionPatterns.forEach(pattern => {
      if (pattern.test(userInput)) {
        analysis.hasIntention = true;
        analysis.intentionStrength = 0.7;
      }
    });

    // 检测冲突
    const conflictPatterns = [
      /但是/g,
      /但是/g,
      /可是/g,
      /不过/g,
      /but/g,
      /however/g,
      /although/g
    ];

    conflictPatterns.forEach(pattern => {
      if (pattern.test(userInput)) {
        analysis.conflicts.push('目标与手段之间存在张力');
      }
    });

    return analysis;
  }

  /**
   * 提供实践推理指导
   */
  provideReasoningGuidance(analysis) {
    const guidance = [];

    if (!analysis.hasGoal) {
      guidance.push({
        type: 'suggestion',
        content: '我注意到您可能还没有明确自己的目标。让我们先澄清：您真正想要实现的是什么？',
        priority: 'high'
      });
    } else if (analysis.goalClarity < 0.8) {
      guidance.push({
        type: 'clarification',
        content: '您的目标似乎还可以更清晰。能否具体描述一下您希望达成什么？越具体越好。',
        priority: 'medium'
      });
    }

    if (analysis.hasGoal && !analysis.hasMeans) {
      guidance.push({
        type: 'suggestion',
        content: '您已经有了目标，这很好。接下来，让我们思考实现这个目标的具体方法或步骤。您有什么想法吗？',
        priority: 'high'
      });
    }

    if (analysis.conflicts.length > 0) {
      guidance.push({
        type: 'exploration',
        content: '我感觉到您描述的 situation 中存在一些张力或冲突。让我们深入探讨一下：这些冲突的具体来源是什么？',
        priority: 'medium'
      });
    }

    if (analysis.hasGoal && analysis.hasMeans && !analysis.hasIntention) {
      guidance.push({
        type: 'commitment',
        content: '您已经明确了目标和可能的方法。现在的问题是：您是否准备好做出承诺并采取行动？',
        priority: 'medium'
      });
    }

    return guidance;
  }

  /**
   * 生成实践推理反思问题
   */
  generateReasoningQuestions(analysis) {
    const questions = [];

    if (!analysis.hasGoal) {
      questions.push({
        type: 'goal_clarification',
        question: '如果您可以用一句话描述您真正想要实现的事情，那会是什么？',
        followUp: '这个目标对您来说为什么重要？'
      });
    }

    if (analysis.hasGoal && !analysis.hasMeans) {
      questions.push({
        type: 'means_exploration',
        question: '您能想到哪些可能的方法来实现这个目标？',
        followUp: '这些方法中，哪一个看起来最可行？为什么？'
      });
    }

    if (analysis.conflicts.length > 0) {
      questions.push({
        type: 'conflict_exploration',
        question: '您提到的冲突/困难具体是什么？',
        followUp: '这个冲突背后反映了您哪些不同的价值观或需求？'
      });
    }

    if (analysis.hasGoal && analysis.hasMeans) {
      questions.push({
        type: 'commitment_exploration',
        question: '在 1-10 的尺度上，您对采取行动的承诺程度是多少？',
        followUp: '什么因素会影响您的承诺水平？'
      });
    }

    return questions;
  }

  /**
   * Frankfurt 层级意志分析
   * 分析用户的一阶欲望和二阶欲望之间的关系
   */
  analyzeHierarchicalWill(userInput) {
    const analysis = {
      firstOrderDesires: [],
      secondOrderDesires: [],
      conflicts: [],
      identifications: [],
      autonomyLevel: 0
    };

    // 检测一阶欲望（想做什么）
    const firstOrderPatterns = [
      /我想 (要)?/g,
      /我感觉想/g,
      /我有冲动/g,
      /I want to/g,
      /I feel like/g,
      /I have an urge to/g
    ];

    // 检测二阶欲望（想有什么欲望）
    const secondOrderPatterns = [
      /我希望我能/g,
      /我想要 (不再)?想/g,
      /我希望能有/g,
      /I wish I could/g,
      /I want to want/g,
      /I wish I didn't want to/g
    ];

    // 检测认同表达
    const identificationPatterns = [
      /这真的是我/g,
      /这才是我想要的/g,
      /我不想像那样/g,
      /This is really me/g,
      /This is what I truly want/g,
      /I don't want to be someone who/g
    ];

    firstOrderPatterns.forEach(pattern => {
      const matches = userInput.match(pattern);
      if (matches) {
        analysis.firstOrderDesires.push({
          text: matches[0],
          strength: 0.7
        });
      }
    });

    secondOrderPatterns.forEach(pattern => {
      const matches = userInput.match(pattern);
      if (matches) {
        analysis.secondOrderDesires.push({
          text: matches[0],
          type: matches[0].includes('不再') || matches[0].includes("didn't") ? 'avoidance' : 'approach',
          strength: 0.8
        });
      }
    });

    identificationPatterns.forEach(pattern => {
      if (pattern.test(userInput)) {
        analysis.identifications.push('用户表达了对某种状态/行为的认同或拒绝');
      }
    });

    // 检测冲突
    if (analysis.firstOrderDesires.length > 0 && analysis.secondOrderDesires.length > 0) {
      analysis.conflicts.push('一阶欲望与二阶欲望之间可能存在张力');
    }

    // 计算自主性水平
    if (analysis.secondOrderDesires.length > 0) {
      analysis.autonomyLevel = 0.7; // 有二阶反思，具有一定自主性
    }
    if (analysis.identifications.length > 0) {
      analysis.autonomyLevel = 0.9; // 有明确认同，高度自主
    }

    return analysis;
  }

  /**
   * 提供层级意志指导
   */
  provideHierarchicalWillGuidance(analysis) {
    const guidance = [];

    if (analysis.firstOrderDesires.length > 0 && analysis.secondOrderDesires.length === 0) {
      guidance.push({
        type: 'reflection_invitation',
        content: '您描述了一些想要做的事情。我好奇的是：您对这些欲望本身有什么看法？您希望自己拥有这些欲望吗？',
        theoreticalBasis: 'Frankfurt (1971) - 二阶欲望是人格的核心特征'
      });
    }

    if (analysis.conflicts.length > 0) {
      guidance.push({
        type: 'conflict_exploration',
        content: '看起来您的不同层次的欲望之间可能存在冲突。这是很常见的人类体验。让我们探索一下：您真正认同的是哪个部分？',
        theoreticalBasis: 'Frankfurt - 自由意志在于与哪个欲望认同'
      });
    }

    if (analysis.autonomyLevel < 0.5) {
      guidance.push({
        type: 'autonomy_development',
        content: '我注意到您可能还没有充分反思自己的欲望。花时间思考"我想成为什么样的人"可以帮助您做出更符合真实自我的选择。',
        theoreticalBasis: '层级意志理论 - 反思性认同是自主性的核心'
      });
    }

    return guidance;
  }

  /**
   * 能动性评估
   * 评估用户的能动性状态
   */
  assessAgencyState(userInput) {
    const assessment = {
      agencyType: this.currentAgencyMode,
      intentionalityLevel: this.intentionalityLevel,
      selfDetermination: { ...this.selfDeterminationState },
      barriers: [],
      strengths: [],
      recommendations: []
    };

    // 检测能动性障碍
    const barrierPatterns = [
      { pattern: /我不能/g, barrier: '感知到能力限制' },
      { pattern: /我必须/g, barrier: '感知到外部强制' },
      { pattern: /我不得不/g, barrier: '缺乏选择感' },
      { pattern: /没办法/g, barrier: '无助感' },
      { pattern: /I can't/g, barrier: '感知到能力限制' },
      { pattern: /I have to/g, barrier: '感知到外部强制' },
      { pattern: /no choice/g, barrier: '缺乏选择感' }
    ];

    barrierPatterns.forEach(({ pattern, barrier }) => {
      if (pattern.test(userInput)) {
        assessment.barriers.push(barrier);
      }
    });

    // 检测能动性优势
    const strengthPatterns = [
      { pattern: /我选择/g, strength: '主动选择意识' },
      { pattern: /我决定/g, strength: '决策能力' },
      { pattern: /我可以/g, strength: '自我效能感' },
      { pattern: /我能够/g, strength: '能力自信' },
      { pattern: /I choose/g, strength: '主动选择意识' },
      { pattern: /I decided/g, strength: '决策能力' },
      { pattern: /I can/g, strength: '自我效能感' }
    ];

    strengthPatterns.forEach(({ pattern, strength }) => {
      if (pattern.test(userInput)) {
        assessment.strengths.push(strength);
      }
    });

    // 生成建议
    if (assessment.barriers.includes('感知到能力限制')) {
      assessment.recommendations.push({
        type: 'competence_building',
        content: '让我们探索一下：在类似情况下，您曾经成功克服过什么困难？那些经验对您现在有什么启发？',
        sdtnComponent: 'competence'
      });
    }

    if (assessment.barriers.includes('感知到外部强制')) {
      assessment.recommendations.push({
        type: 'autonomy_reframing',
        content: '即使在外在限制下，我们通常仍有选择的余地。让我们思考：在这个 situation 中，您仍然可以控制的是什么？',
        sdtnComponent: 'autonomy'
      });
    }

    return assessment;
  }

  /**
   * 主交互函数
   */
  interact(userInput) {
    // 首先进行实践推理分析
    const reasoningResponse = this.interactWithPracticalSyllogism(userInput);

    // 然后进行层级意志分析
    const hierarchicalWillAnalysis = this.analyzeHierarchicalWill(userInput);
    const hierarchicalWillGuidance = this.provideHierarchicalWillGuidance(hierarchicalWillAnalysis);

    // 进行能动性评估
    const agencyAssessment = this.assessAgencyState(userInput);

    // 整合响应
    const response = {
      module: 'free-will-agency',
      version: '3.29.0',
      userInput,
      practicalReasoning: reasoningResponse,
      hierarchicalWill: {
        analysis: hierarchicalWillAnalysis,
        guidance: hierarchicalWillGuidance
      },
      agencyAssessment,
      integratedGuidance: this.integrateGuidance(reasoningResponse, hierarchicalWillGuidance, agencyAssessment),
      theoreticalBasis: [
        'SEP: Agency (https://plato.stanford.edu/entries/agency/)',
        'Frankfurt, H. (1971). Freedom of the Will and the Concept of a Person',
        'Bratman, M. (1987). Intention, Plans, and Practical Reason',
        'Anscombe, G. E. M. (1957). Intention',
        'Davidson, D. (1963). Actions, Reasons, and Causes'
      ]
    };

    return response;
  }

  /**
   * 整合多种指导
   */
  integrateGuidance(reasoningResponse, hierarchicalWillGuidance, agencyAssessment) {
    const integrated = [];

    // 添加实践推理指导
    if (reasoningResponse.guidance && reasoningResponse.guidance.length > 0) {
      reasoningResponse.guidance.forEach(g => {
        integrated.push({
          ...g,
          source: 'practical_reasoning'
        });
      });
    }

    // 添加层级意志指导
    hierarchicalWillGuidance.forEach(g => {
      integrated.push({
        ...g,
        source: 'hierarchical_will'
      });
    });

    // 添加能动性评估建议
    if (agencyAssessment.recommendations && agencyAssessment.recommendations.length > 0) {
      agencyAssessment.recommendations.forEach(r => {
        integrated.push({
          ...r,
          source: 'agency_assessment'
        });
      });
    }

    // 按优先级排序
    integrated.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low'];
    });

    return integrated;
  }

  /**
   * 获取模块信息
   */
  getInfo() {
    return {
      name: '自由意志与能动性模块',
      version: '3.29.0',
      theoreticalBasis: [
        'SEP Agency Theory',
        'Frankfurt Hierarchical Will Model',
        'Bratman Planning Theory',
        'Anscombe-Davidson Intentional Action Theory'
      ],
      capabilities: [
        '实践推理分析',
        '层级意志分析',
        '能动性评估',
        '自主性发展指导',
        '承诺与责任探索'
      ],
      currentAgencyMode: this.currentAgencyMode,
      intentionalityLevel: this.intentionalityLevel,
      selfDeterminationState: this.selfDeterminationState
    };
  }
}

// ============ 导出 ============

module.exports = {
  FreeWillAgencyModule,
  AgencyTypes,
  IntentionalityLevels,
  PracticalReasoningStructure,
  FreeWillModels,
  HierarchicalWillModel
};
