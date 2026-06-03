/**
 * 自适应规划器 (Adaptive Planner) v1.0.0
 *
 * 根据执行反馈动态调整规划策略
 */

const { StrategySelector } = require('./strategy-selector');
const { ReplanTrigger } = require('./replan-trigger');

class AdaptivePlanner {
  constructor(options = {}) {
    // 安全审计修复：移除执行器引用以防能力描述不匹配
    this.strategySelector = new StrategySelector();
    this.replanTrigger = new ReplanTrigger();
    this.currentStrategy = null;
    this.executionHistory = [];
    this.adaptationCount = 0;
  }

  /**
   * 制定初始计划
   */
  plan(task, context = {}) {
    const strategy = this.strategySelector.selectStrategy(task, context);
    this.currentStrategy = strategy;

    const plan = this._createPlan(task, strategy, context);

    return {
      plan,
      strategy: strategy.name,
      confidence: strategy.confidence,
      metadata: {
        adaptationCount: this.adaptationCount,
        historyLength: this.executionHistory.length
      }
    };
  }

  /**
   * 根据执行反馈调整计划
   */
  adapt(task, currentPlan, executionResult, context = {}) {
    this.executionHistory.push({
      task,
      plan: currentPlan,
      result: executionResult,
      timestamp: Date.now()
    });

    // 检查是否需要重规划
    const shouldReplan = this.replanTrigger.shouldReplan(
      executionResult,
      currentPlan,
      context
    );

    if (!shouldReplan) {
      return {
        needsReplan: false,
        adaptedPlan: currentPlan,
        reason: '当前计划执行良好'
      };
    }

    // 分析失败原因
    const failureAnalysis = this._analyzeFailure(executionResult, currentPlan, context);

    // 选择新策略
    const newStrategy = this.strategySelector.selectStrategy(task, context, {
      previousStrategy: this.currentStrategy,
      failureAnalysis
    });

    this.currentStrategy = newStrategy;
    this.adaptationCount++;

    // 生成新计划
    const newPlan = this._createPlan(task, newStrategy, context, {
      previousPlan: currentPlan,
      failureAnalysis
    });

    return {
      needsReplan: true,
      adaptedPlan: newPlan,
      previousStrategy: this.currentStrategy.name,
      newStrategy: newStrategy.name,
      adaptationCount: this.adaptationCount,
      failureAnalysis,
      reason: failureAnalysis.summary
    };
  }

  /**
   * 快速调整（不重新分解任务）
   */
  quickAdjust(plan, feedback, context = {}) {
    const adjustedSteps = plan.steps.map(step => {
      // 检查步骤是否失败
      const stepResult = feedback.stepResults?.[step.id];
      if (stepResult?.status === 'failed') {
        return {
          ...step,
          status: 'needs_retry',
          retryCount: (step.retryCount || 0) + 1,
          suggestedFix: this._suggestStepFix(step, stepResult, context)
        };
      }
      return step;
    });

    return {
      ...plan,
      steps: adjustedSteps,
      metadata: {
        ...plan.metadata,
        quickAdjusted: true,
        adjustCount: (plan.metadata?.adjustCount || 0) + 1
      }
    };
  }

  /**
   * 创建计划
   */
  _createPlan(task, strategy, context = {}, options = {}) {
    const steps = this._decomposeTask(task, strategy, options);

    return {
      id: `plan-${Date.now()}`,
      task,
      strategy: strategy.name,
      steps,
      metadata: {
        createdAt: Date.now(),
        strategy: strategy.name,
        confidence: strategy.confidence,
        previousPlanId: options.previousPlan?.id,
        failureAnalysis: options.failureAnalysis
      }
    };
  }

  /**
   * 任务分解
   */
  _decomposeTask(task, strategy, options = {}) {
    const steps = [];
    const taskType = this._classifyTask(task);

    switch (taskType) {
      case 'implementation':
        return this._decomposeImplementation(task, options);
      case 'investigation':
        return this._decomposeInvestigation(task, options);
      case 'refactoring':
        return this._decomposeRefactoring(task, options);
      case 'debugging':
        return this._decomposeDebugging(task, options);
      default:
        return this._decomposeGeneric(task, options);
    }
  }

  /**
   * 分类任务
   */
  _classifyTask(task) {
    const taskStr = typeof task === 'string' ? task : task.description || '';

    if (/实现|创建|开发|添加|实现.*功能/.test(taskStr)) return 'implementation';
    if (/调查|分析|研究|检查|查找/.test(taskStr)) return 'investigation';
    if (/重构|重写|优化|整理/.test(taskStr)) return 'refactoring';
    if (/调试|修复|解决|排查|错误/.test(taskStr)) return 'debugging';

    return 'generic';
  }

  /**
   * 分解实现任务
   */
  _decomposeImplementation(task, options = {}) {
    const steps = [];
    const failureAnalysis = options.failureAnalysis;

    // 如果是重试，基于失败分析调整
    if (failureAnalysis) {
      steps.push({
        id: 'step-analyze-failure',
        name: '分析失败原因',
        type: 'analysis',
        tool: 'thought',
        status: 'pending'
      });
    }

    steps.push({
      id: 'step-design',
      name: '设计解决方案',
      type: 'design',
      tool: 'thought',
      status: 'pending'
    });

    steps.push({
      id: 'step-implement',
      name: '编写代码',
      type: 'implementation',
      tool: 'file',
      status: 'pending'
    });

    steps.push({
      id: 'step-verify',
      name: '验证实现',
      type: 'verification',
      tool: 'bash',
      status: 'pending'
    });

    return steps;
  }

  /**
   * 分解调查任务
   */
  _decomposeInvestigation(task, options = {}) {
    return [
      {
        id: 'step-gather',
        name: '收集信息',
        type: 'investigation',
        tool: 'search',
        status: 'pending'
      },
      {
        id: 'step-analyze',
        name: '分析问题',
        type: 'analysis',
        tool: 'thought',
        status: 'pending'
      },
      {
        id: 'step-conclude',
        name: '得出结论',
        type: 'conclusion',
        tool: 'thought',
        status: 'pending'
      }
    ];
  }

  /**
   * 分解重构任务
   */
  _decomposeRefactoring(task, options = {}) {
    return [
      {
        id: 'step-understand',
        name: '理解现有代码',
        type: 'investigation',
        tool: 'search',
        status: 'pending'
      },
      {
        id: 'step-plan-changes',
        name: '规划变更',
        type: 'planning',
        tool: 'thought',
        status: 'pending'
      },
      {
        id: 'step-refactor',
        name: '执行重构',
        type: 'refactoring',
        tool: 'file',
        status: 'pending'
      },
      {
        id: 'step-verify',
        name: '验证功能',
        type: 'verification',
        tool: 'bash',
        status: 'pending'
      }
    ];
  }

  /**
   * 分解调试任务
   */
  _decomposeDebugging(task, options = {}) {
    return [
      {
        id: 'step-reproduce',
        name: '复现问题',
        type: 'investigation',
        tool: 'bash',
        status: 'pending'
      },
      {
        id: 'step-locate',
        name: '定位问题',
        type: 'investigation',
        tool: 'search',
        status: 'pending'
      },
      {
        id: 'step-fix',
        name: '修复问题',
        type: 'implementation',
        tool: 'file',
        status: 'pending'
      },
      {
        id: 'step-verify',
        name: '验证修复',
        type: 'verification',
        tool: 'bash',
        status: 'pending'
      }
    ];
  }

  /**
   * 通用分解
   */
  _decomposeGeneric(task, options = {}) {
    return [
      {
        id: 'step-execute',
        name: '执行任务',
        type: 'execution',
        tool: 'bash',
        status: 'pending'
      }
    ];
  }

  /**
   * 分析失败原因
   */
  _analyzeFailure(executionResult, plan, context = {}) {
    const errors = executionResult.errors || [];
    const failedSteps = plan.steps.filter(s =>
      executionResult.stepResults?.[s.id]?.status === 'failed'
    );

    const errorPatterns = {
      syntax: errors.some(e => /syntax|parse|unexpected/i.test(e)),
      runtime: errors.some(e => /reference|typeerror|cannot read/i.test(e)),
      dependency: errors.some(e => /module|import|require|cannot find/i.test(e)),
      permission: errors.some(e => /permission|denied|access/i.test(e)),
      timeout: errors.some(e => /timeout|timed out/i.test(e)),
      network: errors.some(e => /network|econnrefused|fetch failed/i.test(e))
    };

    const primaryError = Object.entries(errorPatterns)
      .find(([, matches]) => matches)?.[0] || 'unknown';

    return {
      primaryError,
      errorPatterns,
      failedSteps: failedSteps.map(s => s.id),
      errorCount: errors.length,
      summary: this._summarizeFailure(primaryError, failedSteps.length)
    };
  }

  /**
   * 总结失败
   */
  _summarizeFailure(primaryError, failedStepCount) {
    const messages = {
      syntax: '存在语法错误',
      runtime: '存在运行时错误',
      dependency: '存在依赖问题',
      permission: '存在权限问题',
      timeout: '执行超时',
      network: '网络问题',
      unknown: '未知错误'
    };

    const baseMessage = messages[primaryError] || messages.unknown;
    return failedStepCount > 1
      ? `${baseMessage}，${failedStepCount} 个步骤失败`
      : baseMessage;
  }

  /**
   * 建议步骤修复
   */
  _suggestStepFix(step, stepResult, context = {}) {
    const error = stepResult.error || '';

    if (/syntax|parse/.test(error)) {
      return {
        action: 'check_syntax',
        suggestion: '检查语法错误',
        tool: 'file'
      };
    }

    if (/cannot find|module/.test(error)) {
      return {
        action: 'check_dependency',
        suggestion: '检查依赖是否安装',
        tool: 'bash'
      };
    }

    if (/permission|denied/.test(error)) {
      return {
        action: 'check_permissions',
        suggestion: '检查文件权限',
        tool: 'bash'
      };
    }

    return {
      action: 'retry',
      suggestion: '重试此步骤',
      tool: step.tool
    };
  }

  /**
   * 获取规划器状态
   */
  getStatus() {
    return {
      currentStrategy: this.currentStrategy?.name,
      adaptationCount: this.adaptationCount,
      historyLength: this.executionHistory.length,
      recentStrategies: this.executionHistory
        .slice(-5)
        .map(h => h.plan.strategy)
    };
  }
}

module.exports = { AdaptivePlanner };
