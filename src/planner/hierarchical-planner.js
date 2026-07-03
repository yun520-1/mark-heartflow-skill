/**
 * HierarchicalPlanner v1.0.0 — 层次化规划器
 *
 * 灵感来源:
 * - LLM-based hierarchical planning (2024)
 * - ReAct (Yao et al., 2022) — Reasoning + Acting interleaved
 * - Inner Monologue (2023) — 规划 + 执行反馈循环
 * - Task Decomposition in LLMs (2024)
 *
 * 核心机制:
 * 1. 目标分解 (Goal Decomposition)
 * 2. 子目标依赖图 (Sub-goal Dependency Graph)
 * 3. 动态重规划 (Dynamic Replanning)
 * 4. 执行反馈 (Execution Feedback Loop)
 *
 * 规划层次:
 * - Level 1: 战略层 (战略目标)
 * - Level 2: 战术层 (子目标序列)
 * - Level 3: 执行层 (具体行动步骤)
 */

const VERSION = '1.0.0';

class HierarchicalPlanner {
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxDepth: options.maxDepth || 3,  // 最大规划深度
      maxSubGoals: options.maxSubGoals || 5,  // 每个目标最大子目标数
      replanThreshold: options.replanThreshold || 0.3,  // 重规划阈值
      executionFeedbackInterval: options.executionFeedbackInterval || 3,  // 每N步收集反馈
    };

    // 规划状态
    this.plans = new Map();  // planId -> plan
    this.activePlan = null;  // 当前活跃计划
    this.executionHistory = [];  // 执行历史
    this.stats = {
      plansCreated: 0,
      plansCompleted: 0,
      plansFailed: 0,
      replans: 0,
    };
  }

  /**
   * 创建层次化计划
   * @param {Object} goal - 目标 {objective, context, constraints}
   * @returns {Object} 层次化计划
   */
  createPlan(goal) {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Level 1: 战略目标
    const strategic = {
      id: `${planId}_strat`,
      level: 1,
      objective: goal.objective,
      context: goal.context || {},
      constraints: goal.constraints || [],
      successCriteria: this._deriveSuccessCriteria(goal.objective),
    };

    // Level 2: 战术子目标 (由战略目标分解)
    const tactical = this._decomposeGoal(goal.objective, goal.context);

    // Level 3: 执行步骤 (由子目标进一步分解)
    const operational = tactical.flatMap(subGoal =>
      this._decomposeSteps(subGoal)
    );

    const plan = {
      id: planId,
      goal: goal.objective,
      status: 'active',
      progress: 0,
      created: new Date().toISOString(),
      levels: {
        strategic,
        tactical,
        operational,
      },
      dependencyGraph: this._buildDependencyGraph(tactical),
      execution: {
        currentStep: 0,
        completedSteps: [],
        failedSteps: [],
        feedback: [],
      },
    };

    this.plans.set(planId, plan);
    this.activePlan = plan;
    this.stats.plansCreated++;

    return plan;
  }

  /**
   * 从目标中提取子目标
   * @private
   */
  _decomposeGoal(objective, context) {
    const subGoals = [];

    // 基于目标类型进行分解
    if (/代码|编程|实现|code|program|implement/i.test(objective)) {
      subGoals.push(
        { id: 'analyze', description: '分析需求和现有代码', priority: 1 },
        { id: 'design', description: '设计解决方案架构', priority: 2, dependsOn: ['analyze'] },
        { id: 'implement', description: '实现核心功能', priority: 3, dependsOn: ['design'] },
        { id: 'test', description: '编写和执行测试', priority: 4, dependsOn: ['implement'] },
        { id: 'review', description: '代码审查和优化', priority: 5, dependsOn: ['test'] },
      );
    } else if (/搜索|查找|研究|search|find|research/i.test(objective)) {
      subGoals.push(
        { id: 'formulate', description: '构建搜索查询', priority: 1 },
        { id: 'search', description: '执行搜索', priority: 2, dependsOn: ['formulate'] },
        { id: 'synthesize', description: '整合搜索结果', priority: 3, dependsOn: ['search'] },
      );
    } else if (/分析|评估|分析|analyze|evaluate/i.test(objective)) {
      subGoals.push(
        { id: 'gather', description: '收集相关数据', priority: 1 },
        { id: 'analyze', description: '执行分析', priority: 2, dependsOn: ['gather'] },
        { id: 'conclude', description: '得出结论', priority: 3, dependsOn: ['analyze'] },
      );
    } else {
      // 通用分解
      subGoals.push(
        { id: 'understand', description: '理解问题', priority: 1 },
        { id: 'plan', description: '制定计划', priority: 2, dependsOn: ['understand'] },
        { id: 'execute', description: '执行计划', priority: 3, dependsOn: ['plan'] },
        { id: 'verify', description: '验证结果', priority: 4, dependsOn: ['execute'] },
      );
    }

    return subGoals;
  }

  /**
   * 从子目标中提取执行步骤
   * @private
   */
  _decomposeSteps(subGoal) {
    const stepPrefix = `${subGoal.id}_step_`;
    const steps = [
      {
        id: `${stepPrefix}1`,
        description: `执行: ${subGoal.description}`,
        subGoalId: subGoal.id,
        priority: subGoal.priority,
        dependsOn: subGoal.dependsOn || [],
        status: 'pending',
      },
    ];
    return steps;
  }

  /**
   * 构建依赖图
   * @private
   */
  _buildDependencyGraph(subGoals) {
    const graph = new Map();
    for (const sg of subGoals) {
      graph.set(sg.id, {
        dependsOn: sg.dependsOn || [],
        dependents: subGoals.filter(other => other.dependsOn?.includes(sg.id)).map(other => other.id),
      });
    }
    return graph;
  }

  /**
   * 从目标中提取成功标准
   * @private
   */
  _deriveSuccessCriteria(objective) {
    const criteria = [];
    if (/完成|成功|正确|完成|complete|success|correct/i.test(objective)) {
      criteria.push('任务成功完成');
    }
    if (/测试|验证|确认|test|verify|validate/i.test(objective)) {
      criteria.push('所有测试通过');
    }
    criteria.push('输出符合预期');
    return criteria;
  }

  /**
   * 更新执行进度
   * @param {Object} feedback - 执行反馈 {stepId, success, output, error}
   * @returns {Object} 更新后的计划状态
   */
  updateProgress(feedback) {
    if (!this.activePlan) return { status: 'no_active_plan' };

    const plan = this.activePlan;
    const step = plan.levels.operational.find(s => s.id === feedback.stepId);

    if (step) {
      step.status = feedback.success ? 'completed' : 'failed';
      step.output = feedback.output;
      step.error = feedback.error;

      if (feedback.success) {
        plan.execution.completedSteps.push(feedback.stepId);
      } else {
        plan.execution.failedSteps.push(feedback.stepId);
      }
    }

    // 记录反馈
    plan.execution.feedback.push({
      ...feedback,
      timestamp: new Date().toISOString(),
    });

    // 更新总进度
    const total = plan.levels.operational.length;
    const completed = plan.execution.completedSteps.length;
    plan.progress = total > 0 ? completed / total : 0;

    // 检查是否需要重规划
    const replan = this._shouldReplan(plan, feedback);
    if (replan) {
      return this.replan(plan.id, feedback.error);
    }

    // 检查是否完成
    if (plan.progress >= 1.0) {
      plan.status = 'completed';
      this.stats.plansCompleted++;
      this.activePlan = null;
    }

    return { plan, replan: false };
  }

  /**
   * 判断是否需要重规划
   * @private
   */
  _shouldReplan(plan, feedback) {
    const total = plan.levels.operational.length;
    const failed = plan.execution.failedSteps.length;
    if (total === 0) return false;

    const failureRate = failed / total;
    return failureRate > this.config.replanThreshold;
  }

  /**
   * 重规划: 当计划执行受阻时调整
   * @param {string} planId - 计划 ID
   * @param {string} reason - 重规划原因
   * @returns {Object} 新计划
   */
  replan(planId, reason) {
    const oldPlan = this.plans.get(planId);
    if (!oldPlan) return null;

    this.stats.replans++;

    // 创建新计划，基于失败经验
    const newPlan = this.createPlan({
      objective: oldPlan.goal,
      context: {
        ...oldPlan.levels.strategic.context,
        previousFailure: reason,
        previousPlan: oldPlan.id,
        lessons: oldPlan.execution.feedback.slice(-3),
      },
    });

    newPlan.parentPlan = planId;

    // 标记旧计划为已取代
    oldPlan.status = 'superseded';

    return newPlan;
  }

  /**
   * 获取当前活跃计划
   */
  getActivePlan() {
    return this.activePlan;
  }

  /**
   * 获取计划
   */
  getPlan(planId) {
    return this.plans.get(planId);
  }

  /**
   * 获取所有计划
   */
  getAllPlans() {
    return Array.from(this.plans.values());
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(limit = 20) {
    return this.executionHistory.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      activePlan: this.activePlan?.id || null,
      totalPlans: this.plans.size,
    };
  }

  /**
   * 重置规划器
   */
  reset() {
    this.plans.clear();
    this.activePlan = null;
    this.executionHistory = [];
    this.stats = {
      plansCreated: 0,
      plansCompleted: 0,
      plansFailed: 0,
      replans: 0,
    };
  }

  /**
   * 序列化 (用于持久化)
   */
  serialize() {
    return {
      version: this.version,
      plans: Array.from(this.plans.entries()),
      activePlan: this.activePlan?.id || null,
      stats: this.getStats(),
    };
  }
}

module.exports = { HierarchicalPlanner, VERSION };
