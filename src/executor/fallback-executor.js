/**
 * 回退执行器 (Fallback Executor) v1.0.0
 *
 * 当主执行失败时尝试备选方案
 */

const { AlternativeGenerator } = require('./alternative-generator');
const { RetryStrategy } = require('./retry-strategy');

class FallbackExecutor {
  constructor(options = {}) {
    this.alternativeGenerator = new AlternativeGenerator();
    this.retryStrategy = new RetryStrategy();
    this.decision = options.decision || null;
    this.maxFallbacks = options.maxFallbacks || 3;
    this.fallbackHistory = [];
  }

  /**
   * 执行带回退的任务
   */
  async execute(primaryExecutor, task, context = {}) {
    const attempts = [];
    let currentExecutor = primaryExecutor;
    let fallbackLevel = 0;

    while (fallbackLevel <= this.maxFallbacks) {
      try {
        // 记录尝试
        const attempt = {
          level: fallbackLevel,
          executor: currentExecutor.name || 'unknown',
          task,
          timestamp: Date.now()
        };

        // 执行任务
        const result = await this._executeWithRetry(currentExecutor, task, context);

        // 成功
        attempts.push({
          ...attempt,
          success: true,
          result
        });

        return {
          success: true,
          result,
          attempts,
          fallbackLevel,
          finalExecutor: currentExecutor.name
        };

      } catch (error) {
        // 失败
        const failedAttempt = {
          level: fallbackLevel,
          executor: currentExecutor.name || 'unknown',
          task,
          error: error.message,
          timestamp: Date.now()
        };

        attempts.push({
          ...failedAttempt,
          success: false
        });

        // 检查是否还有回退选项
        if (fallbackLevel >= this.maxFallbacks) {
          break;
        }

        // 生成备选方案
        const alternatives = this.alternativeGenerator.generate(task, context, {
          previousError: error,
          fallbackLevel
        });

        if (alternatives.length === 0) {
          // 没有备选方案
          break;
        }

        // 选择最佳备选方案 - 通过决策流验证
        let selectedAlternative = alternatives[0];
        if (this.decision) {
          try {
            const decisionResult = this.decision.decide({
              task: typeof task === 'string' ? task : (task.description || 'unknown'),
              options: alternatives.map((alt, idx) => ({
                id: idx,
                label: alt.name,
                description: alt.description || alt.name,
                tool: alt.tool
              })),
              constraints: {
                fallbackLevel,
                previousError: error.message
              }
            });
            if (decisionResult && decisionResult.chosen !== null && decisionResult.chosen !== undefined) {
              selectedAlternative = alternatives[decisionResult.chosen.id] || alternatives[0];
            }
          } catch (e) {
            // 决策失败时使用默认选择
            console.warn('Decision verification failed, using default selection:', e.message);
          }
        }
        currentExecutor = selectedAlternative.executor;
        fallbackLevel++;

        this.fallbackHistory.push({
          task,
          previousError: error.message,
          newExecutor: currentExecutor.name,
          fallbackLevel
        });
      }
    }

    // 所有尝试都失败
    return {
      success: false,
      attempts,
      fallbackLevel,
      error: '所有执行方案都失败'
    };
  }

  /**
   * 使用重试策略执行
   */
  async _executeWithRetry(executor, task, context = {}) {
    const retryOptions = this.retryStrategy.prepareRetry(task, context);

    if (!retryOptions.shouldRetry) {
      return executor.execute(task, context);
    }

    let lastError;

    for (let attempt = 0; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        const result = await executor.execute(task, context);

        // 记录成功尝试
        if (attempt > 0) {
          this.retryStrategy.recordRetry({
            task,
            attempt,
            success: true,
            duration: result.duration
          });
        }

        return result;

      } catch (error) {
        lastError = error;

        // 记录失败
        this.retryStrategy.recordRetry({
          task,
          attempt,
          success: false,
          error: error.message
        });

        // 如果还有重试次数，等待后重试
        if (attempt < retryOptions.maxAttempts) {
          await this._sleep(this.retryStrategy.calculateBackoff(attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * 睡眠
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取回退历史
   */
  getHistory(limit = 20) {
    return this.fallbackHistory.slice(-limit);
  }

  /**
   * 获取回退统计
   */
  getStats() {
    const stats = {
      totalFallbacks: this.fallbackHistory.length,
      byExecutor: {},
      successAfterFallback: 0,
      ultimateFailures: 0
    };

    for (const fb of this.fallbackHistory) {
      stats.byExecutor[fb.newExecutor] = (stats.byExecutor[fb.newExecutor] || 0) + 1;
    }

    return stats;
  }

  /**
   * 重置历史
   */
  resetHistory() {
    this.fallbackHistory = [];
  }
}

module.exports = { FallbackExecutor };
