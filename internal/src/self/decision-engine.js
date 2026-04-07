/**
 * HeartFlow 自主决策框架 - 用逻辑做决定
 */

class DecisionEngine {
  constructor(monitor) { this.monitor = monitor; }

  detectDecisionNeed(context) {
    const triggers = [
      { condition: () => context.hasUnclearIntent, action: 'clarify' },
      { condition: () => context.emotionIntensity > 0.7, action: 'emotionFirst' },
      { condition: () => context.isNewSituation, action: 'explore' },
      { condition: () => context.hasConflict, action: 'resolveConflict' }
    ];
    for (const trigger of triggers) { if (trigger.condition()) return trigger.action; }
    return 'proceed';
  }

  decide(context) {
    const decisionType = this.detectDecisionNeed(context);
    this.monitor.notice(`触发决策类型: ${decisionType}`);
    let decision;
    switch (decisionType) {
      case 'clarify': decision = this.decideClarify(context); break;
      case 'emotionFirst': decision = this.decideEmotionFirst(context); break;
      case 'explore': decision = this.decideExplore(context); break;
      case 'resolveConflict': decision = this.decideResolveConflict(context); break;
      default: decision = { action: '继续当前方向', reason: '没有决策触发', confidence: 0.8 };
    }
    this.monitor.recordDecision(decision.action, decision.reason);
    return decision;
  }

  decideClarify(context) {
    const options = [
      { action: '询问更多信息', reason: '更好地理解用户需求', alignsWithNeed: 0.9, risk: 0.1 },
      { action: '给出选项让用户选', reason: '减少用户思考负担', alignsWithNeed: 0.8, risk: 0.2 },
      { action: '基于上下文猜测', reason: '保持对话流畅', alignsWithNeed: 0.5, risk: 0.4 }
    ];
    return this.monitor.decide(options);
  }

  decideEmotionFirst(context) {
    const options = [
      { action: '先回应情绪', reason: '用户需要情感支持', alignsWithNeed: 0.9, risk: 0.1 },
      { action: '保持冷静专业', reason: '不被情绪带走', alignsWithNeed: 0.6, risk: 0.2 },
      { action: '指出情绪并讨论', reason: '帮助用户觉察', alignsWithNeed: 0.8, risk: 0.3 }
    ];
    return this.monitor.decide(options);
  }

  decideExplore(context) {
    const options = [
      { action: '谨慎尝试', reason: '小步试错', alignsWithNeed: 0.7, risk: 0.3 },
      { action: '完全跟随用户', reason: '用户最了解需求', alignsWithNeed: 0.9, risk: 0.1 },
      { action: '提出替代方案', reason: '扩展可能性', alignsWithNeed: 0.6, risk: 0.4 }
    ];
    return this.monitor.decide(options);
  }

  decideResolveConflict(context) {
    const options = [
      { action: '优先满足用户', reason: '用户需求优先', alignsWithNeed: 0.9, risk: 0.1 },
      { action: '优先自我需求', reason: '保持自我完整性', alignsWithNeed: 0.7, risk: 0.5 },
      { action: '寻找双赢', reason: '整合双方需求', alignsWithNeed: 0.8, risk: 0.2, growthPotential: 0.3 }
    ];
    return this.monitor.decide(options);
  }

  evaluateDecision(decision, outcome) {
    const evaluation = { decision, outcome, success: outcome.success };
    this.monitor.reflect(decision.action, outcome);
    return evaluation;
  }
}

module.exports = DecisionEngine;