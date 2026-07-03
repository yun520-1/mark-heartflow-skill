/**
 * ActionTracker - 行动追踪系统
 * 来源: claude-clarity v1.8.2 吸收集成
 * 核心：行动大于语言，追踪并评估真实行动
 */

class ActionTracker {
  constructor(options = {}) {
    this.state = {
      actions: {
        planned: [],
        executed: [],
        completed: [],
        failed: [],
        pending: []
      },
      commitments: {
        active: [],
        fulfilled: [],
        broken: [],
        pending: []
      },
      stats: {
        totalPlanned: 0,
        totalExecuted: 0,
        totalCompleted: 0,
        successRate: 0,
        averageCompletionTime: 0,
        streakDays: 0
      },
      intentBehavior: {
        alignment: 0.8,
        gaps: [],
        patterns: []
      },
      quality: {
        thoroughness: 0.7,
        timeliness: 0.8,
        effectiveness: 0.7
      },
      changeStage: 'contemplation',
      learning: {
        lessonsLearnt: [],
        improvements: [],
        adaptations: []
      }
    };
    this.history = [];
    this.activeTimers = {};
    if (options.initialState) {
      this.state = { ...this.state, ...options.initialState };
    }
  }

  /**
   * 记录承诺
   */
  commit(promise, deadline = null, context = {}) {
    const commitment = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      promise,
      deadline,
      context,
      status: 'active',
      createdAt: Date.now(),
      executedAt: null,
      completedAt: null
    };
    this.state.commitments.active.push(commitment);
    this.state.stats.totalPlanned++;
    return { id: commitment.id, status: 'committed', deadline, tracking: this.trackCommitment(commitment.id) };
  }

  trackCommitment(id) {
    const c = this.state.commitments.active.find(c => c.id === id);
    if (!c) return null;
    return { id: c.id, promise: c.promise, status: c.status, overdue: c.deadline && Date.now() > c.deadline, timeRemaining: c.deadline ? c.deadline - Date.now() : null };
  }

  /**
   * 执行承诺行动
   */
  execute(actionId, result = {}) {
    const commitment = this.state.commitments.active.find(c => c.id === actionId);
    if (!commitment) return { success: false, reason: 'Commitment not found' };

    const execution = { ...commitment, executedAt: Date.now(), result, success: result.success !== false };
    this.state.actions.executed.push(execution);
    this.state.stats.totalExecuted++;

    if (execution.success) {
      commitment.status = 'completed';
      commitment.completedAt = Date.now();
      this.state.commitments.fulfilled.push(commitment);
      this.state.actions.completed.push(execution);
      this.state.stats.totalCompleted++;
      this.updateStreak(true);
    } else {
      commitment.status = 'failed';
      this.state.commitments.broken.push(commitment);
      this.state.actions.failed.push(execution);
      this.updateStreak(false);
    }
    this.state.commitments.active = this.state.commitments.active.filter(c => c.id !== actionId);
    this.updateStats();
    return { success: execution.success, execution, stats: this.getStats() };
  }

  /**
   * 直接行动（无承诺）
   */
  act(action, context = {}) {
    const act = { id: Date.now().toString(36), action, context, executedAt: Date.now(), result: null, success: null };
    this.state.actions.executed.push(act);
    this.state.stats.totalExecuted++;
    return { id: act.id, status: 'executed', tracking: this.trackAction(act.id) };
  }

  trackAction(id) {
    const a = this.state.actions.executed.find(a => a.id === id);
    if (!a) return null;
    return { id: a.id, action: a.action, status: a.success === null ? 'in_progress' : (a.success ? 'completed' : 'failed'), timeSinceExecution: Date.now() - a.executedAt };
  }

  reportResult(actionId, result) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return { success: false };
    action.result = result;
    action.success = result.success !== false;
    action.completedAt = Date.now();
    if (action.success) { this.state.actions.completed.push(action); this.state.stats.totalCompleted++; this.updateStreak(true); }
    else { this.state.actions.failed.push(action); this.updateStreak(false); }
    this.updateStats();
    return { success: action.success, stats: this.getStats() };
  }

  updateStreak(success) { if (success) this.state.stats.streakDays++; else this.state.stats.streakDays = 0; }

  updateStats() {
    const { totalExecuted, totalCompleted } = this.state.stats;
    this.state.stats.successRate = totalExecuted > 0 ? totalCompleted / totalExecuted : 0;
    const completed = this.state.actions.completed;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, a) => { if (a.executedAt && a.completedAt) return sum + (a.completedAt - a.executedAt); return sum; }, 0);
      this.state.stats.averageCompletionTime = totalTime / completed.length;
    }
  }

  getStats() { return { ...this.state.stats }; }

  checkIntentBehaviorAlignment() {
    const fulfilled = this.state.commitments.fulfilled.length;
    const total = fulfilled + this.state.commitments.broken.length;
    const alignment = total > 0 ? fulfilled / total : 1;
    const gaps = [];
    if (alignment < 0.8) gaps.push({ type: 'intention_behavior_gap', severity: 1 - alignment, description: '意图与行为不一致' });
    this.state.intentBehavior.alignment = alignment;
    this.state.intentBehavior.gaps = gaps;
    return { alignment, gaps };
  }

  assessQuality(actionId) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return null;
    const quality = { thoroughness: this.assessThoroughness(action), timeliness: this.assessTimeliness(action), effectiveness: this.assessEffectiveness(action) };
    const overall = (quality.thoroughness + quality.timeliness + quality.effectiveness) / 3;
    this.state.quality.thoroughness = this.state.quality.thoroughness * 0.9 + quality.thoroughness * 0.1;
    this.state.quality.timeliness = this.state.quality.timeliness * 0.9 + quality.timeliness * 0.1;
    this.state.quality.effectiveness = this.state.quality.effectiveness * 0.9 + quality.effectiveness * 0.1;
    return { ...quality, overall };
  }

  assessThoroughness(action) { return action.result?.thoroughness || 0.7; }
  assessTimeliness(action) {
    if (!action.completedAt || !action.executedAt) return 0.8;
    const d = action.completedAt - action.executedAt;
    if (d < 60000) return 1; if (d < 3600000) return 0.8; if (d < 86400000) return 0.6; return 0.4;
  }
  assessEffectiveness(action) { return action.result?.effectiveness || (action.success ? 0.8 : 0.4); }

  advanceChangeStage() {
    const stages = ['precontemplation', 'contemplation', 'preparation', 'action', 'maintenance'];
    const ci = stages.indexOf(this.state.changeStage);
    if (ci < stages.length - 1) this.state.changeStage = stages[ci + 1];
    return { currentStage: this.state.changeStage, progress: (ci + 1) / stages.length };
  }

  learnFromAction(actionId) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return null;
    const lesson = { action: action.action, success: action.success, timestamp: Date.now() };
    this.state.learning.lessonsLearnt.push(lesson);
    if (!action.success && action.result?.reason) {
      this.state.learning.improvements.push({ from: action.result.reason, suggestion: this.suggestImprovement(action), timestamp: Date.now() });
    }
    return lesson;
  }

  suggestImprovement(action) {
    if (action.result?.reason === 'timeout') return '需要更充足的时间或分阶段完成';
    if (action.result?.reason === 'resource') return '需要更多资源或简化目标';
    return '重新评估可行性后再次尝试';
  }

  getActiveCommitments() {
    return this.state.commitments.active.map(c => ({ id: c.id, promise: c.promise, deadline: c.deadline, overdue: c.deadline && Date.now() > c.deadline }));
  }

  getSummary() {
    return { stats: this.getStats(), alignment: this.checkIntentBehaviorAlignment(), quality: this.state.quality, changeStage: this.state.changeStage, activeCommitments: this.state.commitments.active.length, lessonsLearnt: this.state.learning.lessonsLearnt.length };
  }

  getHistory(count = 10) { return this.history.slice(-count); }
}

module.exports = { ActionTracker };
