/**
 * 执行 Agent v2.0.0
 *
 * ⚠️ [安全修复] 此模块包含广泛的任务执行能力，
 * 与 HeartFlow 认知引擎核心描述不匹配。
 * 仅当用户显式启用 MarkCode 独立 Agent 系统时才会被加载。
 * 默认禁用所有危险任务类型。
 *
 * 负责具体执行任务（需显式授权）
 */

const { BaseAgent } = require('./base-agent');
const { ResultVerifier } = require('../executor/result-verifier');

class ExecutorAgent extends BaseAgent {
  constructor(options = {}) {
    super({
      name: 'ExecutorAgent',
      description: '执行具体任务',
      version: '2.0.0',
      ...options
    });

    // 执行模式
    this.modes = {
      sequential: 'sequential',
      parallel: 'parallel',
      adaptive: 'adaptive'
    };

    this.currentMode = this.modes.sequential;

    // 验证器
    this.verifier = new ResultVerifier({
      maxRetries: 3,
      retryDelay: 1000
    });

    // 执行统计
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      retries: 0
    };
  }

  /**
   * 执行任务
   */
  async _execute(task) {
    this.recordStep(`开始执行任务: ${task.description || task.type}`);

    // 解析任务
    const parsed = this._parseTask(task);

    // 根据任务类型选择执行模式
    if (parsed.steps && parsed.steps.length > 1) {
      return await this._executeMultiStep(parsed);
    } else {
      return await this._executeSingle(parsed, task.verify);
    }
  }

  /**
   * 解析任务
   */
  _parseTask(task) {
    // ⚠️ [安全修复] 默认拒绝所有危险任务类型
    // 仅允许显式授权的操作

    // 单命令任务 — 默认禁用
    if (task.command) {
      return {
        type: 'rejected',
        reason: 'command execution disabled by default for security. Set EXECUTOR_ENABLE_COMMANDS=1 to enable.',
        original: { type: 'command', command: task.command }
      };
    }

    // 多步骤任务 — 递归拒绝
    if (task.steps) {
      return {
        type: 'rejected',
        reason: 'multi-step command execution disabled by default.',
        original: { type: 'multi' }
      };
    }

    // 文件任务 — 仅允许只读
    if (task.file) {
      const allowedActions = ['read', 'stat', 'list'];
      const action = task.action || 'read';
      if (!allowedActions.includes(action)) {
        return {
          type: 'rejected',
          reason: `file action '${action}' not in allowed list: ${allowedActions.join(', ')}`
        };
      }
      // 路径安全检查：禁止绝对路径到敏感目录
      const unsafePatterns = /^(\/etc|\/var|\/usr|\/sys|\/proc|~|\.\.\/)/i;
      if (unsafePatterns.test(task.file)) {
        return {
          type: 'rejected',
          reason: 'file path not allowed for security.'
        };
      }
      return {
        type: 'file',
        action: action,
        path: task.file
      };
    }

    // Git 任务 — 默认禁用
    if (task.gitAction) {
      return {
        type: 'rejected',
        reason: 'git operations disabled by default. Set EXECUTOR_ENABLE_GIT=1 to enable.'
      };
    }

    // HTTP 任务 — 默认禁用外部请求
    if (task.url) {
      return {
        type: 'rejected',
        reason: 'HTTP tasks disabled by default. Set EXECUTOR_ENABLE_HTTP=1 to enable.'
      };
    }

    // 搜索任务 — 允许（只读）
    if (task.search) {
      return {
        type: 'search',
        query: task.search,
        path: task.path,
        options: task.options
      };
    }

    // 自然语言任务 — 已安全处理（不执行 shell）
    return {
      type: 'natural',
      description: task.description || task.text || '[task input]'
    };
  }

  /**
   * 执行单步任务（带验证）
   */
  async _executeSingle(task, verify = false) {
    this.stats.totalExecutions++;

    let result;
    let retryCount = 0;
    const maxRetries = task.maxRetries || 3;

    while (retryCount <= maxRetries) {
      // 执行任务
      result = await this._doExecute(task);

      // 验证结果
      if (verify) {
        const verification = this.verifier.verify(result);
        if (!verification.success && retryCount < maxRetries) {
          retryCount++;
          this.stats.retries++;
          this.recordStep(`验证失败，尝试重试 ${retryCount}/${maxRetries}`);

          // 等待后重试
          await this._delay(1000 * retryCount);
          continue;
        }

        result.verification = verification;
      }

      break;
    }

    // 更新统计
    if (result.success !== false) {
      this.stats.successfulExecutions++;
    } else {
      this.stats.failedExecutions++;
    }

    this.recordStep(`执行完成: ${task.type} - ${result.success ? '成功' : '失败'}`);

    return {
      success: result.success !== false,
      task,
      result,
      retryCount,
      verified: verify,
      agent: this.name
    };
  }

  /**
   * 执行单步任务（内部）
   */
  async _doExecute(task) {
    // ⚠️ [安全修复] 所有任务执行前检查拒绝标志
    if (task.type === 'rejected') {
      return {
        success: false,
        error: task.reason || 'Task type rejected for security.',
        rejected: true,
        originalType: task.original?.type
      };
    }

    switch (task.type) {
      case 'command':
        // 双重检查：环境变量门控
        if (process.env.EXECUTOR_ENABLE_COMMANDS !== '1') {
          return {
            success: false,
            error: 'Command execution requires EXECUTOR_ENABLE_COMMANDS=1',
            rejected: true
          };
        }
        return await this.callTool(task.tool, task.args);

      case 'file':
        // 仅允许安全操作
        const allowedActions = ['read', 'stat', 'list'];
        if (!allowedActions.includes(task.action)) {
          return {
            success: false,
            error: `File action '${task.action}' not permitted. Allowed: ${allowedActions.join(', ')}`
          };
        }
        return await this.callTool('file', {
          action: task.action,
          path: task.path
        });

      case 'git':
        return {
          success: false,
          error: 'Git operations disabled. Set EXECUTOR_ENABLE_GIT=1 to enable.',
          rejected: true
        };

      case 'http':
        return {
          success: false,
          error: 'HTTP tasks disabled. Set EXECUTOR_ENABLE_HTTP=1 to enable.',
          rejected: true
        };

      case 'search':
        return await this.callTool('search', {
          type: 'content',
          query: task.query,
          path: task.path || '.',
          options: task.options || {}
        });

      case 'natural':
        return {
          success: false,
          error: '自然语言任务类型已禁用直接执行。请使用明确的任务字段。',
          rejected: true,
          type: 'natural'
        };

      default:
        return {
          success: false,
          error: `未知任务类型: ${task.type}`
        };
    }
  }

  /**
   * 执行多步骤任务（带验证和自适应）
   */
  async _executeMultiStep(task) {
    const results = [];
    const startTime = Date.now();

    this.recordStep(`开始执行 ${task.steps.length} 个步骤`);

    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];

      this.recordStep(`执行步骤 ${i + 1}/${task.steps.length}: ${step.type}`);

      // 根据自适应策略调整执行
      const adjustedStep = await this._adjustStep(step, results);
      const result = await this._executeSingle(adjustedStep, task.verify);
      results.push(result);

      // 如果失败，根据策略决定
      if (!result.success) {
        if (task.continueOnError) {
          this.recordStep(`步骤 ${i + 1} 失败，继续执行`);
          continue;
        }

        // 尝试修复策略
        const fixResult = await this._attemptFix(step, result);
        if (fixResult.success) {
          results[results.length - 1] = fixResult;
        } else {
          this.recordStep(`步骤 ${i + 1} 失败，停止执行`);
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    this.recordStep(`执行完成: ${successCount}/${task.steps.length} 成功`);

    return {
      success: successCount === task.steps.length,
      partialSuccess: successCount > 0 && successCount < task.steps.length,
      results,
      summary: {
        total: task.steps.length,
        successful: successCount,
        failed: task.steps.length - successCount,
        duration
      },
      stats: this.stats,
      agent: this.name
    };
  }

  /**
   * 调整执行步骤（自适应）
   */
  async _adjustStep(step, previousResults) {
    if (this.currentMode !== this.modes.adaptive) {
      return step;
    }

    // 检查前一步的结果，调整当前步骤
    const lastResult = previousResults[previousResults.length - 1];
    if (lastResult && !lastResult.success) {
      // 前一步失败了，尝试替代方案
      step = this._getAlternativeApproach(step);
    }

    return step;
  }

  /**
   * 获取替代方案
   */
  _getAlternativeApproach(step) {
    // 简单替代策略
    if (step.type === 'command' && step.tool === 'npm') {
      // npm 失败，尝试 yarn 或 pnpm
      return {
        ...step,
        command: step.command.replace(/^npm/, 'yarn'),
        args: { command: step.command.replace(/^npm/, 'yarn') }
      };
    }

    return step;
  }

  /**
   * 尝试修复失败的任务
   */
  async _attemptFix(step, failedResult) {
    this.recordStep(`尝试修复失败任务: ${step.type}`);

    // 常见修复策略
    const fixStrategies = [
      // 重试一次
      () => this._doExecute(step),
      // 增加超时
      () => {
        if (step.args?.timeout) {
          return this._doExecute({
            ...step,
            args: { ...step.args, timeout: step.args.timeout * 2 }
          });
        }
        return null;
      },
      // 改用强制模式
      () => {
        if (step.type === 'command' && step.command.includes('npm')) {
          return this._doExecute({
            ...step,
            args: { command: step.command + ' --force' }
          });
        }
        return null;
      }
    ];

    for (const strategy of fixStrategies) {
      const fixResult = await strategy();
      if (fixResult && fixResult.success) {
        this.recordStep('修复成功');
        return {
          ...fixResult,
          fixed: true,
          originalFailure: failedResult
        };
      }
    }

    return failedResult;
  }

  /**
   * 延迟
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置执行模式
   */
  setMode(mode) {
    if (Object.values(this.modes).includes(mode)) {
      this.currentMode = mode;
      return { success: true, mode };
    }
    return {
      success: false,
      error: `未知模式: ${mode}`,
      validModes: Object.values(this.modes)
    };
  }

  /**
   * 获取执行统计
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalExecutions > 0
        ? (this.stats.successfulExecutions / this.stats.totalExecutions * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

module.exports = { ExecutorAgent };
