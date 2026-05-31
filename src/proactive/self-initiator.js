/**
 * 自主发起者 (Self Initiator) v1.0.0
 *
 * ⚠️ [安全修复] 此模块属于可选主动引擎组件，与 HeartFlow 认知引擎核心功能无关
 * 仅在用户显式启用 MarkCode 独立 Agent 系统时才会被加载
 * 不应作为心虫核心认知能力的一部分
 *
 * 主动发起任务和行动
 */

const { GoalPursuer } = require('./goal-pursuer.js');

class SelfInitiator {
  constructor(options = {}) {
    this.goalPursuer = new GoalPursuer();
    this.initiatedTasks = [];
    this.maxHistory = options.maxHistory || 100;
    this.behaviorThreshold = options.behaviorThreshold || 0.6;
    this.behaviorInhibition = options.behaviorInhibition !== false; // 默认启用行为抑制
    this.pendingConfirmations = [];
  }

  /**
   * 检查是否应该自主行动
   */
  shouldAct(context = {}) {
    const pursuit = this.goalPursuer.shouldPursue();

    if (!pursuit.shouldPursue) {
      return {
        shouldAct: false,
        reason: pursuit.reason,
        confidence: 0.5
      };
    }

    // 检查行为抑制
    if (this.behaviorInhibition && context.userActive) {
      return {
        shouldAct: false,
        reason: '用户正在活跃交互，抑制自主行为',
        confidence: 0.3,
        goal: pursuit.goal
      };
    }

    // 检查频率限制
    if (this._isTooFrequent()) {
      return {
        shouldAct: false,
        reason: '自主行为过于频繁',
        confidence: 0.2,
        goal: pursuit.goal
      };
    }

    return {
      shouldAct: true,
      reason: pursuit.reason,
      confidence: pursuit.goal.desireStrength || pursuit.goal.curiosityStrength || 0.5,
      goal: pursuit.goal
    };
  }

  /**
   * 检查是否过于频繁
   */
  _isTooFrequent() {
    if (this.initiatedTasks.length < 3) return false;

    const recentTasks = this.initiatedTasks.slice(-5);
    const timeWindow = 60000; // 1分钟
    const recentCount = recentTasks.filter(t => Date.now() - t.timestamp < timeWindow).length;

    return recentCount >= 3;
  }

  /**
   * 发起自主行动
   */
  initiate(task, options = {}) {
    const {
      requiresConfirmation = true,
      priority = 'normal',
      metadata = {}
    } = options;

    const initiatedTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'self-initiated',
      title: task.title,
      description: task.description || '',
      goalId: task.goalId,
      priority,
      status: requiresConfirmation ? 'pending_confirmation' : 'approved',
      requiresConfirmation,
      initiatedAt: Date.now(),
      executedAt: null,
      completedAt: null,
      result: null,
      metadata
    };

    if (requiresConfirmation && this.behaviorInhibition) {
      this.pendingConfirmations.push(initiatedTask);
      return {
        task: initiatedTask,
        needsConfirmation: true,
        message: this._generateConfirmationMessage(initiatedTask)
      };
    }

    this._executeTask(initiatedTask);
    return {
      task: initiatedTask,
      needsConfirmation: false
    };
  }

  /**
   * 生成确认消息
   */
  _generateConfirmationMessage(task) {
    return `我想 ${task.title}，可以吗？`;
  }

  /**
   * 执行任务
   */
  _executeTask(task) {
    task.status = 'approved';
    task.executedAt = Date.now();
    this.initiatedTasks.push(task);
    this.goalPursuer.activateGoal({
      ...task,
      desireStrength: 0.6
    });

    // 清理历史
    if (this.initiatedTasks.length > this.maxHistory) {
      this.initiatedTasks = this.initiatedTasks.slice(-this.maxHistory);
    }
  }

  /**
   * 确认待处理任务
   */
  confirmPending(taskId) {
    const task = this.pendingConfirmations.find(t => t.id === taskId);
    if (!task) return null;

    this.pendingConfirmations = this.pendingConfirmations.filter(t => t.id !== taskId);
    this._executeTask(task);

    return task;
  }

  /**
   * 拒绝待处理任务
   */
  rejectPending(taskId, reason = '') {
    const task = this.pendingConfirmations.find(t => t.id === taskId);
    if (!task) return null;

    task.status = 'rejected';
    task.rejectionReason = reason;
    task.rejectedAt = Date.now();
    this.pendingConfirmations = this.pendingConfirmations.filter(t => t.id !== taskId);
    this.initiatedTasks.push(task);

    return task;
  }

  /**
   * 获取待确认任务
   */
  getPendingConfirmations() {
    return [...this.pendingConfirmations];
  }

  /**
   * 完成发起任务
   */
  completeTask(taskId, result) {
    const task = this.initiatedTasks.find(t => t.id === taskId);
    if (!task) return null;

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    // 更新目标进度
    if (task.goalId) {
      this.goalPursuer.updateProgress(task.goalId, 100, {
        type: 'task_completed',
        taskId,
        result
      });
    }

    return task;
  }

  /**
   * 获取发起历史
   */
  getHistory(limit = 20) {
    return this.initiatedTasks.slice(-limit);
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      totalInitiated: this.initiatedTasks.length,
      pendingConfirmations: this.pendingConfirmations.length,
      activeGoals: this.goalPursuer.getStatus(),
      recentTasks: this.getHistory(5),
      behaviorInhibition: this.behaviorInhibition
    };
  }

  /**
   * 设置行为抑制
   */
  setBehaviorInhibition(enabled) {
    this.behaviorInhibition = enabled;
  }

  /**
   * 获取建议的自主行动
   */
  getSuggestedActions(context = {}) {
    const pursuit = this.goalPursuer.shouldPursue();
    if (!pursuit.shouldPursue) return [];

    const goal = pursuit.goal;
    const suggestions = [];

    if (goal.type === 'curiosity') {
      suggestions.push({
        type: 'explore',
        title: `探索: ${goal.title}`,
        description: goal.description,
        confidence: goal.curiosityStrength,
        action: () => this.initiate({
          title: goal.title,
          description: goal.description,
          goalId: goal.id
        })
      });
    }

    if (goal.type === 'desire') {
      suggestions.push({
        type: 'pursue',
        title: goal.title,
        description: goal.description,
        confidence: goal.desireStrength,
        action: () => this.initiate({
          title: goal.title,
          description: goal.description,
          goalId: goal.id
        })
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }
}

module.exports = { SelfInitiator };
