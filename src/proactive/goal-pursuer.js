/**
 * 目标追求者 (Goal Pursuer) v1.0.0
 *
 * ⚠️ [安全修复] 此模块属于可选主动引擎组件，与 HeartFlow 认知引擎核心功能无关
 * 仅在用户显式启用 MarkCode 独立 Agent 系统时才会被加载
 * 不应作为心虫核心认知能力的一部分
 *
 * 将欲望转化为目标并执行
 */

const { DesireEngine } = require('./desire-engine.js');
const { CuriosityEngine } = require('./curiosity-engine.js');

class GoalPursuer {
  constructor(options = {}) {
    this.desireEngine = new DesireEngine();
    this.curiosityEngine = new CuriosityEngine();
    this.activeGoals = new Map();
    this.goalHistory = [];
    this.maxActiveGoals = options.maxActiveGoals || 5;
    this.goalThreshold = options.goalThreshold || 0.5;
  }

  /**
   * 评估是否应该追求目标
   */
  shouldPursue() {
    const dominantDesires = this.desireEngine.getDominantDesires(3);
    const topCuriosityGaps = this.curiosityEngine.getTopCuriosityGaps(3);

    if (dominantDesires.length === 0 && topCuriosityGaps.length === 0) {
      return { shouldPursue: false, reason: '没有强烈的欲望或好奇心' };
    }

    const strongestDesire = dominantDesires[0];
    const strongestCuriosity = topCuriosityGaps[0];

    if (strongestDesire && strongestDesire.curiosityStrength > this.goalThreshold) {
      return {
        shouldPursue: true,
        reason: `欲望驱动: ${strongestDesire.name}`,
        source: 'desire',
        goal: this._createGoalFromDesire(strongestDesire)
      };
    }

    if (strongestCuriosity && strongestCuriosity.curiosityStrength > this.goalThreshold) {
      return {
        shouldPursue: true,
        reason: `好奇心驱动: ${strongestCuriosity.topic}`,
        source: 'curiosity',
        goal: this._createGoalFromCuriosity(strongestCuriosity)
      };
    }

    return { shouldPursue: false, reason: '没有超过阈值的目标' };
  }

  /**
   * 从欲望创建目标
   */
  _createGoalFromDesire(desire) {
    const goalTemplates = {
      curiosity: `探索新知识来满足好奇心`,
      competence: `练习和提升技能`,
      connection: `与他人建立更好的理解`,
      autonomy: `独立完成一个任务`,
      meaning: `做一件有意义的事情`
    };

    return {
      id: `goal-${Date.now()}`,
      type: 'desire',
      sourceId: desire.id,
      title: goalTemplates[desire.id] || '追求内在目标',
      description: desire.description,
      desireStrength: desire.currentStrength,
      status: 'pending',
      createdAt: Date.now(),
      actions: []
    };
  }

  /**
   * 从好奇心创建目标
   */
  _createGoalFromCuriosity(gap) {
    return {
      id: `goal-${Date.now()}`,
      type: 'curiosity',
      sourceId: gap.id,
      title: `探索: ${gap.topic}`,
      description: gap.question,
      curiosityStrength: gap.curiosityStrength,
      status: 'pending',
      createdAt: Date.now(),
      actions: [
        { type: 'research', topic: gap.topic, question: gap.question },
        { type: 'learn', topic: gap.topic }
      ]
    };
  }

  /**
   * 激活目标
   */
  activateGoal(goal) {
    if (this.activeGoals.size >= this.maxActiveGoals) {
      // 结束最不重要的目标
      this._deactivateLeastImportant();
    }

    goal.status = 'active';
    goal.activatedAt = Date.now();
    this.activeGoals.set(goal.id, goal);

    return goal;
  }

  /**
   * 结束最不重要的目标
   */
  _deactivateLeastImportant() {
    let leastImportant = null;
    let lowestScore = Infinity;

    for (const goal of this.activeGoals.values()) {
      const score = (goal.desireStrength || goal.curiosityStrength || 0.5) *
        (goal.activatedAt ? 1 : 0.5);
      if (score < lowestScore) {
        lowestScore = score;
        leastImportant = goal;
      }
    }

    if (leastImportant) {
      this._completeGoal(leastImportant.id, 'interrupted');
    }
  }

  /**
   * 更新目标进度
   */
  updateProgress(goalId, progress, actionResult = null) {
    const goal = this.activeGoals.get(goalId);
    if (!goal) return null;

    goal.progress = Math.min(100, Math.max(0, progress));
    goal.lastUpdate = Date.now();

    if (actionResult) {
      goal.actions = goal.actions || [];
      goal.actions.push({
        ...actionResult,
        timestamp: Date.now()
      });
    }

    // 检查是否完成
    if (goal.progress >= 100) {
      this._completeGoal(goalId, 'completed');
    }

    return goal;
  }

  /**
   * 完成目标
   */
  _completeGoal(goalId, outcome) {
    const goal = this.activeGoals.get(goalId);
    if (!goal) return null;

    goal.status = outcome;
    goal.completedAt = Date.now();

    this.goalHistory.push(goal);
    this.activeGoals.delete(goalId);

    // 满足相关欲望
    if (outcome === 'completed') {
      if (goal.type === 'desire' && goal.sourceId) {
        this.desireEngine.satisfy(goal.sourceId, goal.desireStrength || 0.5);
      }
      if (goal.type === 'curiosity' && goal.sourceId) {
        this.curiosityEngine.explore(goal.sourceId, { satisfaction: goal.curiosityStrength || 0.5 });
      }
    }

    return goal;
  }

  /**
   * 放弃目标
   */
  abandonGoal(goalId, reason = '') {
    const goal = this.activeGoals.get(goalId);
    if (!goal) return null;

    goal.abandonReason = reason;
    return this._completeGoal(goalId, 'abandoned');
  }

  /**
   * 获取活动目标
   */
  getActiveGoals() {
    return [...this.activeGoals.values()];
  }

  /**
   * 获取目标状态
   */
  getGoalStatus(goalId) {
    return this.activeGoals.get(goalId) || null;
  }

  /**
   * 获取目标历史
   */
  getHistory(limit = 20) {
    return this.goalHistory.slice(-limit);
  }

  /**
   * 获取追求者状态
   */
  getStatus() {
    return {
      activeGoals: this.activeGoals.size,
      totalGoals: this.goalHistory.length + this.activeGoals.size,
      desireEngine: this.desireEngine.getSummary(),
      curiosityStats: this.curiosityEngine.getStats(),
      currentGoal: this.activeGoals.values().next().value || null
    };
  }

  /**
   * 生成下一步行动建议
   */
  getNextAction(goalId) {
    const goal = this.activeGoals.get(goalId);
    if (!goal || !goal.actions || goal.actions.length === 0) {
      return null;
    }

    const uncompletedAction = goal.actions.find(a => a.status !== 'completed');
    return uncompletedAction || null;
  }
}

module.exports = { GoalPursuer };
