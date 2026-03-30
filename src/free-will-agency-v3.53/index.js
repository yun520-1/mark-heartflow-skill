/**
 * 自由意志与能动性增强模块 v3.53.0
 * 
 * 基于 SEP (Stanford Encyclopedia of Philosophy) 权威理论：
 * - Free Will 理论整合（古代至现代）
 * - Agency 能动性理论整合
 * - 道德心理学责任评估
 * 
 * 核心理论来源：
 * - Plato: 灵魂三分说，自由即自我掌控
 * - Aristotle: 选择的力量，德性形成理论
 * - Stoics (Chrysippus): 相容论 - 行动"通过你"发生即自由
 * - Augustine: 意志作为自我决定力量
 * - Aquinas: 意志作为理性欲望
 * - Duns Scotus: 强自由意志论
 * - Anscombe (1957): 意向性行动理论
 * - Davidson (1963): 行动的因果理论
 * - Frankfurt: Frankfurt Cases 与道德责任
 */

class FreeWillAgencyEnhanced {
  constructor() {
    this.name = 'FreeWillAgencyEnhanced';
    this.version = '3.53.0';
    this.theoreticalFoundations = this.initTheoreticalFoundations();
  }

  /**
   * 初始化理论基础
   */
  initTheoreticalFoundations() {
    return {
      // 古代理论
      ancient: {
        plato: {
          name: '柏拉图灵魂三分说',
          core: '理性/激情/欲望三分，自由即理性掌控',
          intervention: '帮助用户识别内在冲突的根源，强化理性引导'
        },
        aristotle: {
          name: '亚里士多德选择理论',
          core: 'power to do or not to do - 选择的力量',
          virtueFormation: '一致性选择形成性格，性格决定行动',
          akrasia: '意志薄弱 - 明知善而行恶的心理机制'
        },
        stoics: {
          name: '斯多葛相容论',
          chrysippus: '行动"通过你"(through you)发生即自由',
          determinism: '因果决定与自由相容 - 关键在于行动来源'
        },
        epicurus: {
          name: '伊壁鸠鲁原子偏斜说',
          swerves: '原子的 indeterministic swerves 作为自由基础',
          controversy: '如何从物理 indeterminacy 过渡到行动自由仍有争议'
        },
        alexander: {
          name: 'Alexander of Aphrodisias',
          contribution: '首位明确自由意志论者 (libertarian)',
          view: '给定所有因素，仍可 do or not do'
        }
      },
      // 中世纪理论
      medieval: {
        augustine: {
          name: '奥古斯丁意志理论',
          core: '意志是自我决定力量 (self-determining power)',
          trueFreedom: '真正自由 = 意志与善对齐，需神圣恩典',
          psychological: '错误排序的欲望使人无法持续选择善'
        },
        aquinas: {
          name: '阿奎那理性欲望理论',
          will: '意志 = 理性欲望 (rational desire)',
          freedom: '自由在于手段选择，而非终极目的',
          compatibilist: '可被解读为相容论者'
        },
        scotus: {
          name: '邓斯·司各脱强自由意志论',
          core: '意志是其活动的唯一完全原因',
          radical: '即使在看见至善时，仍可 refrain from willing',
          twoAffections: '利益 (advantage) 与正义 (justice) 两种善的感知'
        }
      },
      // 现代理论
      modern: {
        anscombe: {
          name: 'Anscombe (1957) 意向性行动',
          contribution: '意向性行动是行动概念的核心'
        },
        davidson: {
          name: 'Davidson (1963) 行动因果理论',
          core: '行动由理由 (欲望 + 信念) 以正确方式引起',
          standardTheory: '标准行动理论奠基者'
        },
        frankfurt: {
          name: 'Frankfurt Cases',
          core: '道德责任不要求能做 otherwise',
          implication: '挑战 Principle of Alternative Possibilities (PAP)'
        }
      },
      // 能动性理论
      agency: {
        standardConception: {
          core1: '意向性行动比行动概念更基础',
          core2: '意向性行动与行动理由紧密联系'
        },
        agencyAsInitiation: {
          core: '能动性在于行动由 agent 发起',
          spontaneous: '可能存在无理由、无预先意图的自发行动',
          nonCausal: '非因果理论 vs 因果理论'
        }
      }
    };
  }

  /**
   * Frankfurt Cases 干预
   * 
   * 用于帮助用户摆脱"我本可以..."的反事实思维困境
   * 
   * Frankfurt 案例核心：
   * - Jones 决定做 X
   * - Black 想确保 Jones 做 X，准备了干预机制
   * - 但 Jones 自己决定做 X，Black 未干预
   * - Jones 道德上应负责任，尽管他不能做 otherwise
   * 
   * 启示：道德责任的基础是实际因果历史，而非替代可能性
   */
  frankfurtCaseIntervention(userStatement, context) {
    const patterns = {
      // 识别"我本可以"类型的反事实思维
      couldHaveDoneOtherwise: /我本可以|我本来能|I could have|I should have/i,
      // 识别后悔/自责
      regret: /后悔|要是...就好了|if only|I regret/i,
      // 识别决定论困境
      determinismTrap: /注定|无法选择|was determined|had no choice/i
    };

    const analysis = {
      hasCounterfactualThinking: patterns.couldHaveDoneOtherwise.test(userStatement),
      hasRegret: patterns.regret.test(userStatement),
      hasDeterminismTrap: patterns.determinismTrap.test(userStatement)
    };

    // 生成干预策略
    const interventions = [];

    if (analysis.hasCounterfactualThinking) {
      interventions.push({
        type: 'frankfurt_insight',
        message: 'Frankfurt 案例告诉我们：道德责任的关键不在于"能否做其他选择"，而在于行动是否真正源于你的理由和性格。让我们关注你实际做决定时的心理过程，而非假设的替代场景。',
        technique: '重新聚焦于实际因果历史'
      });
    }

    if (analysis.hasDeterminismTrap) {
      interventions.push({
        type: 'compatibilist_reframe',
        message: '斯多葛哲学家 Chrysippus 提出：即使行动是因果决定的，只要它是"通过你"(through you)发生的——源于你的信念、欲望和性格——你就是自由的。决定论不取消责任，关键在于行动的来源。',
        technique: '相容论重构'
      });
    }

    if (analysis.hasRegret) {
      interventions.push({
        type: 'aristotelian_growth',
        message: '亚里士多德认为，性格由一致性选择塑造。过去的选择已成事实，但每个当下都是重塑性格的机会。让我们设计一个微小的选择点干预，帮助未来的你做出更符合价值观的决定。',
        technique: '德性形成导向'
      });
    }

    return {
      analysis,
      interventions,
      theoreticalBasis: 'Frankfurt (1969), "Alternate Possibilities and Moral Responsibility"'
    };
  }

  /**
   * 意志薄弱 (Akrasia) 干预
   * 
   * 基于亚里士多德《尼各马可伦理学》卷 VII
   * 
   * 意志薄弱：明知何为善/正确，却行恶/错误
   * 
   * 亚里士多德的解释：
   * - 意志薄弱者有正确的普遍前提（如"甜食有害"）
   * - 但在具体情境中，欲望遮蔽了对特殊前提的认知（"这是甜食"）
   * - 或虽有认知，但欲望压倒了理性选择
   */
  akrasiaIntervention(conflict) {
    const {
      rationalJudgment,  // 理性判断（如"应该锻炼"）
      actualBehavior,    // 实际行为（如"躺在沙发上"）
      conflictingDesire  // 冲突欲望（如"想舒适"）
    } = conflict;

    // 分析意志薄弱的类型
    const type = this.analyzeAkrasiaType(conflict);

    // 生成干预策略
    const strategies = [];

    // 策略 1: 情境重构（减少欲望触发）
    strategies.push({
      name: '情境重构',
      basis: '亚里士多德：避免使欲望被激发的环境',
      action: `识别触发"${conflictingDesire}"的情境线索，提前设计规避策略`,
      example: '想锻炼但总躺沙发？把运动服放在床边，醒来就穿上'
    });

    // 策略 2: 微小承诺（降低行动门槛）
    strategies.push({
      name: '微小承诺',
      basis: '行为心理学：小步骤降低认知阻力',
      action: '将理性目标分解为极小行动，使欲望无法找到拒绝理由',
      example: '"只锻炼 5 分钟"比"锻炼 1 小时"更容易启动'
    });

    // 策略 3: 性格追溯（理解深层原因）
    strategies.push({
      name: '性格追溯',
      basis: '亚里士多德：当前性格是过往选择的累积',
      action: '追溯这种冲突模式的历史，识别性格形成的关键节点',
      reflection: '这种"明知故犯"的模式从何时开始？什么经历强化了它？'
    });

    // 策略 4: 未来选择点设计
    strategies.push({
      name: '未来选择点设计',
      basis: '能动性理论：在每个选择点重新夺回控制权',
      action: '预设"如果 - 那么"计划，在关键时刻自动触发理性行动',
      implementation: '如果 [触发情境]，那么 [预设计划行动]'
    });

    return {
      type,
      strategies,
      theoreticalBasis: 'Aristotle, Nicomachean Ethics Book VII; Mele (2003) "Motivation and Agency"'
    };
  }

  /**
   * 分析意志薄弱类型
   */
  analyzeAkrasiaType(conflict) {
    // 冲动型：欲望强烈压倒理性
    // 软弱型：理性判断不够坚定
    // 认知遮蔽型：情境中理性判断被暂时遮蔽
    
    const desireIntensity = conflict.desireIntensity || 'moderate';
    const judgmentClarity = conflict.judgmentClarity || 'clear';

    if (desireIntensity === 'overwhelming') {
      return {
        type: 'impulsive',
        description: '冲动型意志薄弱 - 欲望强度压倒理性',
        aristotleCategory: 'propeteia (冲动)'
      };
    } else if (judgmentClarity === 'weak') {
      return {
        type: 'weak',
        description: '软弱型意志薄弱 - 理性判断本身不够坚定',
        aristotleCategory: 'astheneia (软弱)'
      };
    } else {
      return {
        type: 'cognitive遮蔽',
        description: '认知遮蔽型 - 情境中理性判断被暂时遮蔽',
        aristotleCategory: '类似醉酒或愤怒状态下的认知受损'
      };
    }
  }

  /**
   * 道德责任评估框架
   * 
   * 基于 SEP 道德心理学和能动性理论
   * 
   * 评估一个行动是否应归责于 agent：
   */
  moralResponsibilityAssessment(action, context) {
    const assessment = {
      // 1. 行动来源评估
      originAssessment: {
        // 行动是否"通过"agent 发生（vs 外部强制）
        isAgentOrigin: this.evaluateAgentOrigin(action, context),
        
        // 是否源于 agent 的理由结构（欲望 + 信念 + 意图）
        hasRationalizingStructure: this.evaluateRationalizingStructure(action, context),
        
        // 是否有发起能力（vs 纯粹被因果链推动）
        hasInitiationPower: this.evaluateInitiationPower(action, context)
      },

      // 2. 性格形成历史评估
      characterHistory: {
        // 当前性格中自主选择的比例
        autonomyRatio: this.calculateCharacterAutonomyRatio(context),
        
        // 关键性格形成节点的可追溯性
        traceableNodes: this.traceCharacterFormationNodes(context),
        
        // 是否存在性格塑造的外部强制
        hasExternalCoercion: this.detectExternalCoercion(context)
      },

      // 3. 替代可能性评估（Frankfurt 式）
      alternativePossibilities: {
        // 是否实际能够做 otherwise（经验层面）
        empiricalAlternatives: this.evaluateEmpiricalAlternatives(action, context),
        
        // 是否有能力响应理由（reasons-responsiveness）
        reasonsResponsiveness: this.evaluateReasonsResponsiveness(context),
        
        // Frankfurt 式判断：即使无替代可能，是否仍应负责
        frankfurtJudgment: this.makeFrankfurtJudgment(action, context)
      },

      // 4. 综合责任判断
      overallResponsibility: {
        // 责任程度 (0-1)
        degree: 0,
        // 判断依据
        basis: [],
        // 减轻因素
        mitigatingFactors: [],
        // 加重因素
        aggravatingFactors: []
      }
    };

    // 计算综合责任程度
    assessment.overallResponsibility.degree = this.calculateResponsibilityDegree(assessment);
    assessment.overallResponsibility.basis = this.generateResponsibilityBasis(assessment);

    return assessment;
  }

  evaluateAgentOrigin(action, context) {
    // 评估行动是否真正源于 agent
    // vs 外部强制、胁迫、操纵
    const coercionFactors = ['external_threat', 'physical_force', 'manipulation'];
    const hasCoercion = coercionFactors.some(f => context.coercionFactors?.includes(f));
    return !hasCoercion && action.source === 'agent_internal';
  }

  evaluateRationalizingStructure(action, context) {
    // 评估行动是否有可理性化的理由结构
    return !!(action.desires && action.beliefs && action.intention);
  }

  evaluateInitiationPower(action, context) {
    // 评估 agent 是否有发起行动的能力
    // vs 纯粹被因果链推动
    return context.hasSpontaneousInitiation || action.initiatedByAgent;
  }

  calculateCharacterAutonomyRatio(context) {
    // 计算性格形成历史中自主选择的比例
    // 这是一个简化版本，实际应用需要更复杂的追溯
    const totalFormativeEvents = context.formativeEvents?.length || 1;
    const autonomousChoices = context.formativeEvents?.filter(e => e.autonomous).length || 0;
    return autonomousChoices / totalFormativeEvents;
  }

  traceCharacterFormationNodes(context) {
    // 追溯性格形成的关键节点
    return context.formativeEvents?.filter(e => e.significance > 0.7) || [];
  }

  detectExternalCoercion(context) {
    // 检测性格塑造过程中的外部强制
    return context.formativeEvents?.some(e => e.coerced) || false;
  }

  evaluateEmpiricalAlternatives(action, context) {
    // 评估经验层面是否实际能够做 otherwise
    return context.availableAlternatives?.length > 0;
  }

  evaluateReasonsResponsiveness(context) {
    // 评估 agent 是否能响应理由
    // 基于 Fischer & Ravizza 的理由响应理论
    const reasonsConsidered = context.reasonsConsidered?.length || 0;
    const reasonsWeighted = context.reasonsProperlyWeighted || false;
    return reasonsConsidered > 0 && reasonsWeighted;
  }

  makeFrankfurtJudgment(action, context) {
    // Frankfurt 式判断：即使无替代可能，只要行动源于 agent 的理由结构，仍应负责
    const isAgentOrigin = this.evaluateAgentOrigin(action, context);
    const hasRationalizingStructure = this.evaluateRationalizingStructure(action, context);
    return isAgentOrigin && hasRationalizingStructure;
  }

  calculateResponsibilityDegree(assessment) {
    // 计算综合责任程度
    const { originAssessment, characterHistory, alternativePossibilities } = assessment;
    
    let score = 0;
    
    // 来源评估权重 40%
    if (originAssessment.isAgentOrigin) score += 0.2;
    if (originAssessment.hasRationalizingStructure) score += 0.1;
    if (originAssessment.hasInitiationPower) score += 0.1;
    
    // 性格历史权重 30%
    score += characterHistory.autonomyRatio * 0.3;
    
    // 替代可能性权重 30%（Frankfurt 式降低权重）
    if (alternativePossibilities.frankfurtJudgment) score += 0.2;
    if (alternativePossibilities.reasonsResponsiveness) score += 0.1;
    
    return Math.min(1, Math.max(0, score));
  }

  generateResponsibilityBasis(assessment) {
    const basis = [];
    
    if (assessment.originAssessment.isAgentOrigin) {
      basis.push('行动源于 agent 自身，非外部强制');
    }
    if (assessment.originAssessment.hasRationalizingStructure) {
      basis.push('行动有可理性化的理由结构');
    }
    if (assessment.characterHistory.autonomyRatio > 0.7) {
      basis.push('性格形成历史中自主选择占主导');
    }
    if (assessment.alternativePossibilities.frankfurtJudgment) {
      basis.push('Frankfurt 式判断：即使无替代可能，行动仍源于 agent');
    }
    
    return basis;
  }

  /**
   * 能动性类型评估
   * 
   * 基于 SEP Agency 理论
   */
  evaluateAgencyType(agent, context) {
    const agencyTypes = {
      // 标准能动性（意向性行动）
      standardAgency: {
        hasIntentionalAction: this.hasIntentionalAction(agent, context),
        hasReasonsConnection: this.hasReasonsConnection(agent, context),
        description: '标准能动性 - 基于意向性行动和理由连接'
      },
      
      // 发起能动性（agent 作为发起者）
      initiatoryAgency: {
        hasSpontaneousInitiation: this.hasSpontaneousInitiation(agent, context),
        hasNonCausalPower: this.hasNonCausalPower(agent, context),
        description: '发起能动性 - 强调 agent 作为行动发起者'
      },
      
      // 理性能动性（基于实践理性）
      rationalAgency: {
        hasPracticalReasoning: this.hasPracticalReasoning(agent, context),
        hasPlanningCapacity: this.hasPlanningCapacity(agent, context),
        description: '理性能动性 - 基于实践理性和规划能力'
      }
    };

    return {
      types: agencyTypes,
      dominantType: this.determineDominantAgencyType(agencyTypes),
      theoreticalBasis: 'Anscombe (1957), Davidson (1963), Bratman (1987), Mele (2003)'
    };
  }

  hasIntentionalAction(agent, context) {
    return agent.actions?.some(a => a.intentional) || false;
  }

  hasReasonsConnection(agent, context) {
    return agent.actions?.some(a => a.hasReasons) || false;
  }

  hasSpontaneousInitiation(agent, context) {
    return agent.actions?.some(a => a.spontaneous && !a.priorIntent) || false;
  }

  hasNonCausalPower(agent, context) {
    // 非因果能动性：行动不由先前的心理状态因果决定
    return agent.nonCausalActions?.length > 0 || false;
  }

  hasPracticalReasoning(agent, context) {
    return agent.practicalReasoning?.length > 0 || false;
  }

  hasPlanningCapacity(agent, context) {
    return agent.plans?.length > 0 || false;
  }

  determineDominantAgencyType(types) {
    // 简单启发式：优先标准能动性，其次是理性能动性
    if (types.standardAgency.hasIntentionalAction && types.standardAgency.hasReasonsConnection) {
      return 'standardAgency';
    }
    if (types.rationalAgency.hasPracticalReasoning && types.rationalAgency.hasPlanningCapacity) {
      return 'rationalAgency';
    }
    return 'initiatoryAgency';
  }

  /**
   * 生成干预建议
   */
  generateIntervention(userSituation) {
    const {
      statement,
      emotionalState,
      decisionContext
    } = userSituation;

    const interventions = [];

    // 1. Frankfurt Cases 干预（针对反事实思维）
    if (this.containsCounterfactualThinking(statement)) {
      interventions.push(this.frankfurtCaseIntervention(statement, decisionContext));
    }

    // 2. 意志薄弱干预（针对知行不一）
    if (this.detectAkrasia(userSituation)) {
      interventions.push(this.akrasiaIntervention(decisionContext.conflict));
    }

    // 3. 道德责任评估（针对自责/责任困惑）
    if (this.detectResponsibilityConcern(statement)) {
      const assessment = this.moralResponsibilityAssessment(
        decisionContext.action,
        decisionContext
      );
      interventions.push({
        type: 'responsibility_assessment',
        assessment,
        guidance: this.generateResponsibilityGuidance(assessment)
      });
    }

    // 4. 能动性增强（针对无力感）
    if (this.detectAgencyConcern(emotionalState)) {
      const agencyEvaluation = this.evaluateAgencyType(
        { actions: decisionContext.actions || [] },
        decisionContext
      );
      interventions.push({
        type: 'agency_enhancement',
        evaluation: agencyEvaluation,
        exercises: this.generateAgencyExercises(agencyEvaluation)
      });
    }

    return {
      interventions,
      theoreticalBasis: 'SEP Free Will & Agency entries',
      version: this.version
    };
  }

  containsCounterfactualThinking(statement) {
    return /我本可以|我本来能|I could have|I should have|if only/i.test(statement);
  }

  detectAkrasia(userSituation) {
    const { statement, decisionContext } = userSituation;
    return statement.includes('知道') && statement.includes('但是') &&
           decisionContext.conflict !== undefined;
  }

  detectResponsibilityConcern(statement) {
    return /我的责任|我应该|I am responsible|I should have/i.test(statement);
  }

  detectAgencyConcern(emotionalState) {
    return ['无力', '被动', '被控制', 'powerless', 'helpless'].some(
      w => emotionalState?.includes(w)
    );
  }

  generateResponsibilityGuidance(assessment) {
    const { degree, basis, mitigatingFactors } = assessment.overallResponsibility;
    
    let guidance = '';
    
    if (degree > 0.7) {
      guidance = '你的责任程度较高。这意味着行动确实源于你的选择和性格。好消息是：这也意味着你有能力通过当下的选择重塑未来的性格。';
    } else if (degree > 0.4) {
      guidance = '你的责任程度中等。存在一些减轻因素，但行动仍有相当部分源于你的选择。让我们关注那些你可以掌控的部分。';
    } else {
      guidance = '你的责任程度较低。存在显著的外部强制或性格形成中的非自主因素。这不是你的错，但你仍有能力在当下做出不同的选择。';
    }

    if (mitigatingFactors.length > 0) {
      guidance += `\n\n减轻因素：${mitigatingFactors.join(', ')}`;
    }

    return guidance;
  }

  generateAgencyExercises(evaluation) {
    const exercises = [];
    
    exercises.push({
      name: '意向性觉察练习',
      description: '在每个行动前，暂停 3 秒，问自己："我为什么做这个？"',
      basis: 'Anscombe: 意向性行动的核心是有意识的理由'
    });

    exercises.push({
      name: '微小选择点练习',
      description: '每天刻意在 3 个微小决定上练习"做或不做"的选择感',
      basis: 'Alexander of Aphrodisias: 自由在于 do or not do 的力量'
    });

    exercises.push({
      name: '性格追溯日记',
      description: '记录当前性格特征的形成历史，识别哪些是自主选择的结果',
      basis: 'Aristotle: 性格由一致性选择塑造'
    });

    return exercises;
  }
}

module.exports = FreeWillAgencyEnhanced;
