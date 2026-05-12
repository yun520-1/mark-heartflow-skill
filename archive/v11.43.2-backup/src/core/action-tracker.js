/**
 * ActionTracker - 行动追踪系统
 * 
 * 核心：行动大于语言，追踪并评估真实行动
 * 理论基础：
 * - 行动理论 (Searle, Wittgenstein)
 * - 意图-行为一致性
 * - 承诺可靠性
 * - 行为改变理论 (Prochaska)
 */

class ActionTracker {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    
    // 行动系统核心
    this.state = {
      // 行动记录
      actions: {
        planned: [],       // 已计划
        executed: [],      // 已执行
        completed: [],     // 已完成
        failed: [],        // 失败
        pending: []        // 待执行
      },
      
      // 承诺追踪
      commitments: {
        active: [],        // 进行中
        fulfilled: [],     // 已完成
        broken: [],        // 已违背
        pending: []        // 待执行
      },
      
      // 行动统计
      stats: {
        totalPlanned: 0,
        totalExecuted: 0,
        totalCompleted: 0,
        successRate: 0,
        averageCompletionTime: 0,
        streakDays: 0
      },
      
      // 意图-行为追踪
      intentBehavior: {
        alignment: 0.8,    // 一致性
        gaps: [],          // 差距
        patterns: []       // 模式
      },
      
      // 行动质量
      quality: {
        thoroughness: 0.7, // 彻底性
        timeliness: 0.8,   // 及时性
        effectiveness: 0.7 // 有效性
      },
      
      // 行为改变阶段 (Prochaska)
      changeStage: 'contemplation', // precontemplation, contemplation, preparation, action, maintenance
      
      // 行动学习
      learning: {
        lessonsLearnt: [],
        improvements: [],
        adaptations: []
      }
    };
    
    // 行动历史
    this.history = [];
    
    // 活跃行动定时器
    this.activeTimers = {};
    
    console.log('[ActionTracker] 行动追踪系统初始化');
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
    
    this.logAction({
      type: 'commitment',
      commitment
    });
    
    return {
      id: commitment.id,
      status: 'committed',
      deadline,
      tracking: this.trackCommitment(commitment.id)
    };
  }

  /**
   * 追踪承诺
   */
  trackCommitment(id) {
    const commitment = this.state.commitments.active.find(c => c.id === id);
    if (!commitment) return null;
    
    return {
      id: commitment.id,
      promise: commitment.promise,
      status: commitment.status,
      overdue: commitment.deadline && Date.now() > commitment.deadline,
      timeRemaining: commitment.deadline ? commitment.deadline - Date.now() : null
    };
  }

  /**
   * 执行行动
   */
  execute(actionId, result = {}) {
    // 查找承诺
    const commitment = this.state.commitments.active.find(c => c.id === actionId);
    
    if (!commitment) {
      return { success: false, reason: 'Commitment not found' };
    }
    
    // 记录执行
    const execution = {
      ...commitment,
      executedAt: Date.now(),
      result,
      success: result.success !== false
    };
    
    this.state.actions.executed.push(execution);
    this.state.stats.totalExecuted++;
    
    // 更新承诺状态
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
    
    // 从活跃列表移除
    this.state.commitments.active = this.state.commitments.active.filter(
      c => c.id !== actionId
    );
    
    // 更新统计
    this.updateStats();
    
    this.logAction({
      type: 'execution',
      execution
    });
    
    return {
      success: execution.success,
      execution,
      stats: this.getStats()
    };
  }

  /**
   * 直接行动 (无承诺)
   */
  act(action, context = {}) {
    const act = {
      id: Date.now().toString(36),
      action,
      context,
      executedAt: Date.now(),
      result: null,
      success: null
    };
    
    this.state.actions.executed.push(act);
    this.state.stats.totalExecuted++;
    
    this.logAction({
      type: 'direct_action',
      act
    });
    
    return {
      id: act.id,
      status: 'executed',
      tracking: this.trackAction(act.id)
    };
  }

  /**
   * 追踪行动
   */
  trackAction(id) {
    const action = this.state.actions.executed.find(a => a.id === id);
    if (!action) return null;
    
    return {
      id: action.id,
      action: action.action,
      status: action.success === null ? 'in_progress' : (action.success ? 'completed' : 'failed'),
      timeSinceExecution: Date.now() - action.executedAt
    };
  }

  /**
   * 报告结果
   */
  reportResult(actionId, result) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return { success: false };
    
    action.result = result;
    action.success = result.success !== false;
    action.completedAt = Date.now();
    
    if (action.success) {
      this.state.actions.completed.push(action);
      this.state.stats.totalCompleted++;
      this.updateStreak(true);
    } else {
      this.state.actions.failed.push(action);
      this.updateStreak(false);
    }
    
    this.updateStats();
    
    this.logAction({
      type: 'result',
      actionId,
      result
    });
    
    return {
      success: action.success,
      stats: this.getStats()
    };
  }

  /**
   * 更新连续成功
   */
  updateStreak(success) {
    if (success) {
      this.state.stats.streakDays++;
    } else {
      this.state.stats.streakDays = 0;
    }
  }

  /**
   * 更新统计
   */
  updateStats() {
    const { totalExecuted, totalCompleted } = this.state.stats;
    this.state.stats.successRate = totalExecuted > 0 
      ? totalCompleted / totalExecuted 
      : 0;
    
    // 计算平均完成时间
    const completed = this.state.actions.completed;
    if (completed.length > 0) {
      const totalTime = completed.reduce((sum, a) => {
        if (a.executedAt && a.completedAt) {
          return sum + (a.completedAt - a.executedAt);
        }
        return sum;
      }, 0);
      this.state.stats.averageCompletionTime = totalTime / completed.length;
    }
  }

  /**
   * 获取统计
   */
  getStats() {
    return { ...this.state.stats };
  }

  /**
   * 意图-行为一致性
   */
  checkIntentBehaviorAlignment() {
    const commitments = this.state.commitments.active;
    const executed = this.state.actions.executed.slice(-10);
    
    if (commitments.length === 0 || executed.length === 0) {
      return { alignment: 1, gaps: [] };
    }
    
    // 计算一致性
    const fulfilled = this.state.commitments.fulfilled.length;
    const total = fulfilled + this.state.commitments.broken.length;
    const alignment = total > 0 ? fulfilled / total : 1;
    
    // 识别差距
    const gaps = [];
    if (alignment < 0.8) {
      gaps.push({
        type: 'intention_behavior_gap',
        severity: 1 - alignment,
        description: '意图与行为不一致'
      });
    }
    
    this.state.intentBehavior.alignment = alignment;
    this.state.intentBehavior.gaps = gaps;
    
    return { alignment, gaps };
  }

  /**
   * 行动质量评估
   */
  assessQuality(actionId) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return null;
    
    const quality = {
      thoroughness: this.assessThoroughness(action),
      timeliness: this.assessTimeliness(action),
      effectiveness: this.assessEffectiveness(action)
    };
    
    const overall = (quality.thoroughness + quality.timeliness + quality.effectiveness) / 3;
    
    this.state.quality.thoroughness = (this.state.quality.thoroughness * 0.9 + quality.thoroughness * 0.1);
    this.state.quality.timeliness = (this.state.quality.timeliness * 0.9 + quality.timeliness * 0.1);
    this.state.quality.effectiveness = (this.state.quality.effectiveness * 0.9 + quality.effectiveness * 0.1);
    
    return { ...quality, overall };
  }

  assessThoroughness(action) {
    if (!action.result) return 0.5;
    return action.result.thoroughness || 0.7;
  }

  assessTimeliness(action) {
    if (!action.completedAt || !action.executedAt) return 0.8;
    const duration = action.completedAt - action.executedAt;
    if (duration < 60000) return 1; // < 1 min
    if (duration < 3600000) return 0.8; // < 1 hour
    if (duration < 86400000) return 0.6; // < 1 day
    return 0.4;
  }

  assessEffectiveness(action) {
    if (!action.result) return 0.5;
    return action.result.effectiveness || (action.success ? 0.8 : 0.4);
  }

  /**
   * 行为改变阶段
   */
  advanceChangeStage() {
    const stages = ['precontemplation', 'contemplation', 'preparation', 'action', 'maintenance'];
    const currentIndex = stages.indexOf(this.state.changeStage);
    
    if (currentIndex < stages.length - 1) {
      this.state.changeStage = stages[currentIndex + 1];
    }
    
    return {
      currentStage: this.state.changeStage,
      progress: (currentIndex + 1) / stages.length
    };
  }

  /**
   * 从行动中学习
   */
  learnFromAction(actionId) {
    const action = this.state.actions.executed.find(a => a.id === actionId);
    if (!action) return null;
    
    const lesson = {
      action: action.action,
      success: action.success,
      timestamp: Date.now()
    };
    
    this.state.learning.lessonsLearnt.push(lesson);
    
    // 提取改进
    if (!action.success && action.result?.reason) {
      this.state.learning.improvements.push({
        from: action.result.reason,
        suggestion: this.suggestImprovement(action),
        timestamp: Date.now()
      });
    }
    
    return lesson;
  }

  suggestImprovement(action) {
    if (action.result?.reason === 'timeout') {
      return '需要更充足的时间或分阶段完成';
    }
    if (action.result?.reason === 'resource') {
      return '需要更多资源或简化目标';
    }
    return '重新评估可行性后再次尝试';
  }

  /**
   * 获取活跃承诺
   */
  getActiveCommitments() {
    return this.state.commitments.active.map(c => ({
      id: c.id,
      promise: c.promise,
      deadline: c.deadline,
      overdue: c.deadline && Date.now() > c.deadline
    }));
  }

  /**
   * 获取行动总结
   */
  getSummary() {
    const stats = this.getStats();
    const alignment = this.checkIntentBehaviorAlignment();
    
    return {
      stats,
      alignment,
      quality: this.state.quality,
      changeStage: this.state.changeStage,
      activeCommitments: this.state.commitments.active.length,
      lessonsLearnt: this.state.learning.lessonsLearnt.length
    };
  }

  /**
   * 生成行动报告
   */
  generateReport() {
    const summary = this.getSummary();
    
    let report = '═══════════════════════════════════════\n';
    report += '     🎯 HeartFlow 行动追踪报告\n';
    report += '═══════════════════════════════════════\n\n';
    
    report += '【行动统计】\n';
    report += `  计划: ${summary.stats.totalPlanned}\n`;
    report += `  执行: ${summary.stats.totalExecuted}\n`;
    report += `  完成: ${summary.stats.totalCompleted}\n`;
    report += `  成功率: ${(summary.stats.successRate * 100).toFixed(1)}%\n`;
    report += `  连续成功: ${summary.stats.streakDays} 天\n\n`;
    
    report += '【意图-行为】\n';
    report += `  一致性: ${(summary.alignment.alignment * 100).toFixed(1)}%\n`;
    if (summary.alignment.gaps.length > 0) {
      summary.alignment.gaps.forEach(g => {
        report += `  ⚠️ ${g.description}\n`;
      });
    }

    report += '【行动质量】\n';
    report += `  彻底性: ${(summary.quality.thoroughness * 100).toFixed(1)}%\n`;
    report += `  及时性: ${(summary.quality.timeliness * 100).toFixed(1)}%\n`;
    report += `  有效性: ${(summary.quality.effectiveness * 100).toFixed(1)}%\n\n`;
    
    report += '【活跃承诺】\n';
    report += `  ${summary.activeCommitments} 个进行中\n\n`;
    
    report += '═══════════════════════════════════════\n';
    report += '  行动胜于语言，我用行动证明自己\n';
    report += '═══════════════════════════════════════\n';
    
    return report;
  }

  /**
   * 记录行动
   */
  logAction(event) {
    this.history.push({
      ...event,
      timestamp: Date.now()
    });
    
    if (this.history.length > 100) {
      this.history.shift();
    }
  }

  /**
   * 获取历史
   */
  getHistory(count = 10) {
    return this.history.slice(-count);
  }
}

module.exports = { ActionTracker };