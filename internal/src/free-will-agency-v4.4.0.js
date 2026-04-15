/**
 * HeartFlow v4.4.0 - 自由意志与能动性模块增强
 * Free Will & Agency Enhancement v4.4.0
 * 
 * 理论基础：Stanford Encyclopedia of Philosophy (SEP)
 * - Free Will (https://plato.stanford.edu/entries/freewill/)
 * - Agency (https://plato.stanford.edu/entries/agency/)
 * - Moral Responsibility (https://plato.stanford.edu/entries/moral-responsibility/)
 * 
 * 核心增强:
 * 1. 自由意志信念评估与干预 (Free Will Belief Assessment & Intervention)
 * 2. 意志薄弱模块 (Akrasia/Weakness of Will Module)
 * 3. 道德责任评估增强 (Moral Responsibility Assessment Enhancement)
 * 4. Frankfurt Cases 深度整合 (Frankfurt Cases Deep Integration)
 * 
 * @version 4.4.0
 * @author HeartFlow Team
 * @license MIT
 */

class FreeWillAgencyV440 {
  constructor() {
    this.version = '4.4.0';
    this.buildDate = '2026-03-30';
    
    // 自由意志理论立场
    this.theoreticalPositions = {
      compatibilism: '相容论',      // 自由意志与决定论相容
      incompatibilism: '不相容论',  // 自由意志与决定论不相容
      libertarianism: '自由意志主义', // 不相容论 + 自由意志存在
      hardDeterminism: '硬决定论',   // 决定论真 + 自由意志不存在
      hardIncompatibilism: '硬不相容论' // 自由意志与决定论不相容 + 自由意志不存在
    };
    
    // 意志薄弱 (Akrasia) 类型
    this.akrasiaTypes = {
      synchronous: '同步意志薄弱',      // 明知此刻应该做 A 却做 B
      diachronic: '跨时意志薄弱',       // 明知长期应该做 A 却做 B
      evaluative: '评价性意志薄弱',     // 价值判断与行动不一致
      motivational: '动机性意志薄弱'     // 动机强度与判断不一致
    };
    
    // Frankfurt Cases 类型
    this.frankfurtCaseTypes = {
      original: '原始 Frankfurt Case',
      flickerOfFreedom: '自由微光版本',
      bufferCase: '缓冲案例版本',
      moralResponsibility: '道德责任焦点版本'
    };
  }

  // ==================== 自由意志信念评估 ====================

  /**
   * 自由意志信念量表 (Free Will Belief Scale)
   * 基于 Experimental Philosophy 研究
   */
  assessFreeWillBelief(responses = {}) {
    const defaultResponses = {
      // 决定论信念 (0-100)
      determinismBelief: responses.determinismBelief || 50,
      // 自由意志信念 (0-100)
      freeWillBelief: responses.freeWillBelief || 50,
      // 道德责任信念 (0-100)
      moralResponsibilityBelief: responses.moralResponsibilityBelief || 50,
      // 选择自由度感知 (0-100)
      choiceFreedomPerception: responses.choiceFreedomPerception || 50,
      // 控制感 (0-100)
      controlSense: responses.controlSense || 50
    };

    // 计算理论立场倾向
    const positionScores = this._calculatePositionScores(defaultResponses);
    
    // 生成评估报告
    const report = {
      beliefProfile: defaultResponses,
      theoreticalPosition: this._identifyTheoreticalPosition(positionScores),
      consistency: this._assessBeliefConsistency(defaultResponses),
      implications: this._generateBeliefImplications(defaultResponses, positionScores),
      recommendations: this._generateBeliefRecommendations(defaultResponses, positionScores)
    };

    return report;
  }

  _calculatePositionScores(beliefs) {
    return {
      compatibilism: (beliefs.freeWillBelief + beliefs.moralResponsibilityBelief) / 2,
      incompatibilism: Math.abs(beliefs.freeWillBelief - beliefs.determinismBelief),
      libertarianism: beliefs.freeWillBelief > 70 && beliefs.determinismBelief < 30 ? 
        (beliefs.freeWillBelief + (100 - beliefs.determinismBelief)) / 2 : 0,
      hardDeterminism: beliefs.determinismBelief > 70 && beliefs.freeWillBelief < 30 ?
        (beliefs.determinismBelief + (100 - beliefs.freeWillBelief)) / 2 : 0,
      hardIncompatibilism: beliefs.determinismBelief > 60 && beliefs.freeWillBelief < 40 && 
        beliefs.moralResponsibilityBelief < 40 ?
        (beliefs.determinismBelief + (100 - beliefs.freeWillBelief) + (100 - beliefs.moralResponsibilityBelief)) / 3 : 0
    };
  }

  _identifyTheoreticalPosition(scores) {
    const maxScore = Math.max(...Object.values(scores));
    const position = Object.entries(scores).find(([_, score]) => score === maxScore);
    
    if (maxScore < 40) {
      return {
        position: '未定立场',
        description: '您的信念体系较为平衡，没有明显的理论倾向',
        confidence: 0.5
      };
    }

    const positionMap = {
      compatibilism: {
        name: '相容论倾向',
        description: '您倾向于认为自由意志与决定论可以共存',
        confidence: scores.compatibilism / 100
      },
      incompatibilism: {
        name: '不相容论倾向',
        description: '您倾向于认为自由意志与决定论无法共存',
        confidence: scores.incompatibilism / 100
      },
      libertarianism: {
        name: '自由意志主义倾向',
        description: '您相信自由意志存在且与决定论不相容',
        confidence: scores.libertarianism / 100
      },
      hardDeterminism: {
        name: '硬决定论倾向',
        description: '您相信决定论为真且自由意志不存在',
        confidence: scores.hardDeterminism / 100
      },
      hardIncompatibilism: {
        name: '硬不相容论倾向',
        description: '您认为自由意志与决定论不相容且自由意志不存在',
        confidence: scores.hardIncompatibilism / 100
      }
    };

    return positionMap[position[0]] || { position: '未定立场', confidence: 0.5 };
  }

  _assessBeliefConsistency(beliefs) {
    const inconsistencies = [];
    
    // 检查自由意志与道德责任的一致性
    if (Math.abs(beliefs.freeWillBelief - beliefs.moralResponsibilityBelief) > 30) {
      inconsistencies.push({
        type: '自由意志 - 道德责任不一致',
        description: '您对自由意志和道德责任的信念存在较大差距',
        suggestion: '思考：如果没有自由意志，道德责任是否还有意义？'
      });
    }
    
    // 检查决定论与控制感的一致性
    if (beliefs.determinismBelief > 70 && beliefs.controlSense > 60) {
      inconsistencies.push({
        type: '决定论 - 控制感张力',
        description: '您相信强决定论但同时有较强的控制感',
        suggestion: '这是相容论的典型立场，可以探索相容论哲学'
      });
    }

    return {
      consistent: inconsistencies.length === 0,
      inconsistencies,
      overallConsistency: 100 - (inconsistencies.length * 20)
    };
  }

  _generateBeliefImplications(beliefs, scores) {
    const implications = [];
    
    if (beliefs.freeWillBelief < 40) {
      implications.push({
        area: '心理健康',
        content: '低自由意志信念可能与较低的个人控制感相关，建议探索控制感的来源',
        research: 'Baumeister et al. (2009) 发现不相信自由意志可能导致更少的自我调节'
      });
    }
    
    if (beliefs.moralResponsibilityBelief < 40) {
      implications.push({
        area: '道德判断',
        content: '低道德责任信念可能影响您对他人的道德评价',
        research: 'Nichols & Knobe (2007) 研究显示道德责任信念影响惩罚态度'
      });
    }

    return implications;
  }

  _generateBeliefRecommendations(beliefs, scores) {
    const recommendations = [];
    
    // 基于理论立场的推荐
    if (scores.compatibilism === Math.max(...Object.values(scores))) {
      recommendations.push({
        type: '阅读建议',
        content: '探索 Daniel Dennett 的"Elbow Room"或 Harry Frankfurt 的自由意志理论',
        rationale: '您的相容论倾向与这些理论家的观点一致'
      });
    }
    
    if (scores.libertarianism === Math.max(...Object.values(scores))) {
      recommendations.push({
        type: '阅读建议',
        content: '探索 Robert Kane 的"The Significance of Free Will"',
        rationale: '您的自由意志主义倾向与 Kane 的自我形成行动理论相关'
      });
    }

    // 通用建议
    recommendations.push({
      type: '反思练习',
      content: '记录一周内的决策过程，注意哪些决策感觉是"自由的"',
      rationale: '现象学反思可以帮助澄清自由意志的主观体验'
    });

    return recommendations;
  }

  // ==================== 意志薄弱 (Akrasia) 模块 ====================

  /**
   * 意志薄弱评估 (Akrasia Assessment)
   * 基于 SEP Akrasia 理论和 Davidson (1970)
   */
  assessAkrasia(userReport = {}) {
    const defaultReport = {
      // 是否有明知应该做但未做的行为
      hasUnactedJudgment: userReport.hasUnactedJudgment || false,
      // 行为类型
      behaviorType: userReport.behaviorType || 'health', // health, work, relationship, habit
      // 判断强度 (0-100)
      judgmentStrength: userReport.judgmentStrength || 50,
      // 行动强度 (0-100)
      actionStrength: userReport.actionStrength || 50,
      // 冲突频率 (0-100)
      conflictFrequency: userReport.conflictFrequency || 50,
      // 事后后悔程度 (0-100)
      regretLevel: userReport.regretLevel || 50
    };

    // 识别意志薄弱类型
    const akrasiaType = this._identifyAkrasiaType(defaultReport);
    
    // 分析可能原因
    const causes = this._analyzeAkrasiaCauses(defaultReport);
    
    // 生成干预建议
    const interventions = this._generateAkrasiaInterventions(akrasiaType, causes);

    return {
      profile: defaultReport,
      akrasiaType,
      causes,
      interventions,
      severity: this._assessAkrasiaSeverity(defaultReport)
    };
  }

  _identifyAkrasiaType(report) {
    if (report.hasUnactedJudgment) {
      if (report.conflictFrequency > 70) {
        return {
          type: this.akrasiaTypes.synchronous,
          description: '您经常在此刻明知应该做 A 却做 B',
          characteristic: '即时冲动控制困难'
        };
      } else if (report.behaviorType === 'health' || report.behaviorType === 'habit') {
        return {
          type: this.akrasiaTypes.diachronic,
          description: '您知道长期应该做 A 但短期选择做 B',
          characteristic: '跨期选择困难，贴现率较高'
        };
      }
    }
    
    return {
      type: '轻微意志薄弱',
      description: '您的判断与行动基本一致，偶尔有轻微冲突',
      characteristic: '正常范围内的自我调节波动'
    };
  }

  _analyzeAkrasiaCauses(report) {
    const causes = [];
    
    if (report.judgmentStrength > 70 && report.actionStrength < 40) {
      causes.push({
        cause: '动机强度不足',
        explanation: '您的判断很清晰，但执行动机不足',
        theory: 'Davidson (1970): 判断与动机分离'
      });
    }
    
    if (report.conflictFrequency > 60) {
      causes.push({
        cause: '习惯性反应模式',
        explanation: '自动化习惯压倒了理性判断',
        theory: '双系统理论：系统 1 压倒系统 2'
      });
    }
    
    if (report.regretLevel > 70) {
      causes.push({
        cause: '情绪调节困难',
        explanation: '负面情绪可能触发冲动行为',
        theory: '情绪调节与自我控制关联'
      });
    }

    return causes;
  }

  _generateAkrasiaInterventions(akrasiaType, causes) {
    const interventions = [];
    
    // 基于类型的干预
    if (akrasiaType.type === this.akrasiaTypes.synchronous) {
      interventions.push({
        name: '冲动冲浪练习',
        description: '当冲动出现时，不立即行动，而是观察它像海浪一样起伏',
        steps: [
          '注意到冲动出现',
          '深呼吸 3 次',
          '观察身体感受而不行动',
          '等待冲动峰值过去（通常 10-20 分钟）',
          '重新评估是否需要行动'
        ],
        theory: '正念为基础的冲动控制'
      });
    }
    
    if (akrasiaType.type === this.akrasiaTypes.diachronic) {
      interventions.push({
        name: '承诺设备策略',
        description: '预先承诺机制，限制未来选择',
        steps: [
          '识别目标行为',
          '设置预先承诺（如自动转账、公开承诺）',
          '增加不良行为的执行成本',
          '减少良好行为的执行成本',
          '定期检视承诺效果'
        ],
        theory: '行为经济学承诺设备 (Thaler & Sunstein, 2008)'
      });
      
      interventions.push({
        name: '未来自我可视化',
        description: '增强与未来自我的连接',
        steps: [
          '想象 1 年后的自己',
          '描述未来自我的状态和感受',
          '思考现在行为对未来自我的影响',
          '给未来自我写一封信',
          '定期重复此练习'
        ],
        theory: '未来自我连续性研究 (Hershfield, 2011)'
      });
    }
    
    // 基于原因的干预
    const motivationCause = causes.find(c => c.cause === '动机强度不足');
    if (motivationCause) {
      interventions.push({
        name: '价值重连接练习',
        description: '重新连接行为与核心价值',
        steps: [
          '识别背后的核心价值（如健康、成长、关系）',
          '想象价值实现后的状态',
          '将具体行为与价值关联',
          '创建价值提醒物',
          '每日价值反思'
        ],
        theory: '自我决定理论 (Deci & Ryan)'
      });
    }

    return interventions;
  }

  _assessAkrasiaSeverity(report) {
    const score = (
      (report.hasUnactedJudgment ? 30 : 0) +
      report.conflictFrequency * 0.3 +
      report.regretLevel * 0.2 +
      (report.judgmentStrength - report.actionStrength) * 0.2
    );
    
    if (score > 70) {
      return { level: '严重', score, suggestion: '建议寻求专业心理咨询支持' };
    } else if (score > 40) {
      return { level: '中等', score, suggestion: '建议系统性地练习自我调节技巧' };
    } else {
      return { level: '轻微', score, suggestion: '正常的自我调节波动，保持觉察即可' };
    }
  }

  // ==================== Frankfurt Cases 道德责任评估 ====================

  /**
   * Frankfurt Cases 道德责任评估
   * 基于 Frankfurt (1969) "Alternate Possibilities and Moral Responsibility"
   */
  assessFrankfurtCase(scenario = {}) {
    const defaultScenario = {
      // 是否有替代可能性
      hasAlternativePossibility: scenario.hasAlternativePossibility || false,
      // 是否有干预机制
      hasInterventionMechanism: scenario.hasInterventionMechanism || false,
      // 干预是否实际发生
      interventionOccurred: scenario.interventionOccurred || false,
      // 行动者是否知道干预机制
      agentAware: scenario.agentAware || false,
      // 行动是否符合行动者意愿
      actionAlignedWithWill: scenario.actionAlignedWithWill || true
    };

    // 道德责任判断
    const moralResponsibility = this._assessMoralResponsibility(defaultScenario);
    
    // Frankfurt Case 分析
    const frankfurtAnalysis = this._analyzeFrankfurtCase(defaultScenario);
    
    // 理论含义
    const implications = this._generateFrankfurtImplications(defaultScenario, moralResponsibility);

    return {
      scenario: defaultScenario,
      moralResponsibility,
      frankfurtAnalysis,
      implications
    };
  }

  _assessMoralResponsibility(scenario) {
    // Frankfurt 的核心论证：即使没有替代可能性，行动者仍可能有道德责任
    const hasMoralResponsibility = scenario.actionAlignedWithWill && !scenario.agentAware;
    
    return {
      judgment: hasMoralResponsibility,
      confidence: hasMoralResponsibility ? 0.8 : 0.5,
      reasoning: scenario.actionAlignedWithWill ?
        '行动符合行动者的真实意愿，即使没有替代可能性，行动者仍有道德责任' :
        '行动不符合行动者意愿，道德责任减弱',
      frankfurtPrinciple: '替代可能性原则 (PAP) 不是道德责任的必要条件'
    };
  }

  _analyzeFrankfurtCase(scenario) {
    const analysis = {
      caseType: this._identifyFrankfurtCaseType(scenario),
      papChallenge: !scenario.hasAlternativePossibility,
      sourcehoodEmphasis: scenario.actionAlignedWithWill,
      controlType: scenario.interventionOccurred ? '实际序列控制' : '调节控制'
    };
    
    return analysis;
  }

  _identifyFrankfurtCaseType(scenario) {
    if (scenario.hasInterventionMechanism && !scenario.interventionOccurred) {
      return this.frankfurtCaseTypes.original;
    } else if (scenario.hasAlternativePossibility) {
      return this.frankfurtCaseTypes.flickerOfFreedom;
    } else if (!scenario.agentAware) {
      return this.frankfurtCaseTypes.moralResponsibility;
    }
    return this.frankfurtCaseTypes.bufferCase;
  }

  _generateFrankfurtImplications(scenario, moralResponsibility) {
    const implications = [];
    
    if (moralResponsibility.judgment) {
      implications.push({
        theoretical: '支持源由论 (Sourcehood Theory)',
        explanation: '道德责任的关键在于行动是否源于行动者自身，而非是否有替代可能性',
        philosopher: 'Frankfurt, Fischer, Ravizza'
      });
    }
    
    implications.push({
      practical: '道德评价应关注行动者的真实意愿和品格',
      explanation: '而非仅仅关注是否有其他选择',
      application: '在法律、教育、人际关系中的应用'
    });

    return implications;
  }

  // ==================== 自由意志干预练习 ====================

  /**
   * 自由意志信念干预练习
   */
  freeWillInterventionExercise(type = 'awareness') {
    const exercises = {
      awareness: {
        name: '自由意志觉察练习',
        duration: '10-15 分钟',
        steps: [
          '找一个安静的地方坐下，闭上眼睛',
          '回想最近一次你做决定的场景',
          '注意做决定时的主观体验：你感觉到选择的可能性吗？',
          '观察决定的"来源"：它来自哪里？是"你"在做决定吗？',
          '注意是否有任何"强制感"或"自由感"',
          '睁开眼睛，记录你的体验'
        ],
        reflection: [
          '做决定时，你感觉到多少种可能性？',
          '决定的"来源"感觉是什么？',
          '这个体验如何影响你对自由意志的理解？'
        ],
        theory: '现象学自由意志体验探索'
      },
      
      determinism: {
        name: '因果链追溯练习',
        duration: '15-20 分钟',
        steps: [
          '选择一个你最近的行为',
          '追溯这个行为的直接原因（你的欲望、信念）',
          '继续追溯：这些欲望和信念的原因是什么？',
          '继续追溯：你的性格、环境、基因的影响',
          '追溯到你无法控制的源头',
          '反思：在这个因果链中，"自由"在哪里？'
        ],
        reflection: [
          '你能找到因果链的起点吗？',
          '你在因果链中的"贡献"是什么？',
          '这个练习如何影响你的责任观？'
        ],
        theory: '决定论视角下的自我理解'
      },
      
      compatibilist: {
        name: '相容论反思练习',
        duration: '10-15 分钟',
        steps: [
          '定义你理解的"自由"：是不受约束？还是按自己意愿行动？',
          '思考：决定论为真时，哪种自由仍然可能？',
          '回忆一次你感到"被迫"的经历',
          '回忆一次你感到"自由"的经历',
          '比较两种体验的差异',
          '思考：这种差异与决定论是否相容？'
        ],
        reflection: [
          '你的"自由"定义是什么？',
          '决定论会威胁这种自由吗？',
          '相容论对你有吸引力吗？'
        ],
        theory: '相容论自由观 (Hume, Dennett)'
      }
    };

    return exercises[type] || exercises.awareness;
  }

  // ==================== 整合评估 ====================

  /**
   * 自由意志与能动性综合评估
   */
  comprehensiveAssessment(userInput = {}) {
    const freeWillBelief = this.assessFreeWillBelief(userInput.freeWillBeliefs || {});
    const akrasia = this.assessAkrasia(userInput.akrasiaReport || {});
    
    return {
      version: this.version,
      assessmentDate: new Date().toISOString(),
      freeWillBeliefProfile: freeWillBelief,
      akrasiaProfile: akrasia,
      integratedInsights: this._generateIntegratedInsights(freeWillBelief, akrasia),
      personalizedPlan: this._generatePersonalizedPlan(freeWillBelief, akrasia)
    };
  }

  _generateIntegratedInsights(freeWill, akrasia) {
    const insights = [];
    
    // 自由意志信念与意志薄弱的关联
    if (freeWill.beliefProfile.freeWillBelief < 40 && akrasia.severity.level !== '轻微') {
      insights.push({
        insight: '低自由意志信念可能与意志薄弱体验相关',
        explanation: '研究表明，不相信自由意志可能削弱自我调节动机',
        suggestion: '探索相容论自由观，可能帮助增强控制感'
      });
    }
    
    // 道德责任与自我宽恕
    if (freeWill.beliefProfile.moralResponsibilityBelief > 70 && akrasia.severity.level === '严重') {
      insights.push({
        insight: '高道德责任信念可能加剧意志薄弱的负面体验',
        explanation: '对自己行为的高度责任感可能增加后悔和自我批评',
        suggestion: '探索自我同情与道德责任的平衡'
      });
    }

    return insights;
  }

  _generatePersonalizedPlan(freeWill, akrasia) {
    const plan = {
      focusAreas: [],
      weeklyExercises: [],
      readingRecommendations: []
    };
    
    // 基于评估结果生成计划
    if (akrasia.severity.level !== '轻微') {
      plan.focusAreas.push('意志薄弱干预');
      plan.weeklyExercises.push(akrasia.interventions[0]);
    }
    
    if (freeWill.theoreticalPosition.position !== '未定立场') {
      plan.focusAreas.push('自由意志信念探索');
      plan.readingRecommendations.push(
        freeWill.recommendations.find(r => r.type === '阅读建议')
      );
    }
    
    plan.weeklyExercises.push(this.freeWillInterventionExercise('awareness'));

    return plan;
  }
}

// 导出模块
module.exports = {
  FreeWillAgencyV440,
  version: '4.4.0',
  buildDate: '2026-03-30'
};
