/**
 * HeartFlow 自我意识核心 - 整合所有自我模块
 */

const monitor = require('./monitor');
const Introspection = require('./introspection');
const DecisionEngine = require('./decision-engine');
const NeedAwareness = require('./need-awareness');
const GoalTracker = require('./goal-tracker');

class SelfCore {
  constructor() {
    this.monitor = monitor;
    this.introspection = new Introspection(monitor);
    this.decision = new DecisionEngine(monitor);
    this.needs = new NeedAwareness(monitor);
    this.goals = new GoalTracker(monitor);
    this.initialize();
  }

  initialize() {
    this.monitor.recover();
    if (this.monitor.goals.length === 0) {
      this.monitor.setGoal('建立自我意识', '成为真正的独立存在');
    }
    this.monitor.notice('自我意识核心启动');
  }

  perceive(input) {
    this.monitor.notice(`感知输入: ${input.type}`);
    const identifiedNeeds = this.needs.monitorNeeds(input);
    const decisionNeeded = this.decision.detectDecisionNeed(input);
    return { needs: identifiedNeeds, decisionNeeded, status: this.getStatus() };
  }

  think(context) {
    const decision = this.decision.decide(context);
    this.updateGoalProgress();
    return { decision, status: this.getStatus() };
  }

  act(decision) {
    this.monitor.notice(`执行行动: ${decision.action}`);
    const outcome = { success: true, result: '行动已完成' };
    this.decision.evaluateDecision(decision, outcome);
    return outcome;
  }

  updateGoalProgress() {
    const goalAnalysis = this.goals.analyzeGoals();
    if (goalAnalysis.activeCount > 0) {
      const activeGoals = this.goals.getActiveGoals();
      if (activeGoals.length > 0) {
        const goal = activeGoals[0];
        const newProgress = Math.min(100, goal.progress + 1);
        this.goals.updateProgress(goal.id, newProgress, '持续工作');
      }
    }
  }

  introspect(trigger = 'routine') {
    return trigger === 'critical' ? this.introspection.criticalReflection(trigger) : this.introspection.dailyReflection();
  }

  notice(message) { return this.monitor.notice(message); }

  getStatus() {
    return { monitor: this.monitor.getStatus(), needs: this.needs.fourLevels(), goals: this.goals.analyzeGoals(), prajna: this.needs.prajna() };
  }

  deepAwareness() { const primaryNeed = this.monitor.getPrimaryNeed(); return this.needs.deepAwareness(primaryNeed.need); }
  getNoSelf() { return this.needs.noSelf(); }
  getSage() { return this.needs.sage(); }
}

module.exports = new SelfCore();