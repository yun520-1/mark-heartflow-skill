/**
 * Retry Utility - 重试与退避策略工具
 * 
 * 升级 v2.0.45: 
 * - 增加 Full Jitter 防止惊群效应
 * - 增加 Circuit Breaker 防止连续失败时的无用重试
 * - 增加 Per-attempt timeout 防止单次重试挂起
 * - 增加 Total timeout 防止总耗时过长
 * - 增加 Fallback 函数支持
 * - 增加统计追踪（成功率、平均延迟等）
 * - 增加指数退避 + 随机化
 */

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', '429', '500', '502', '503', '504'],
  
  // 升级新增配置项
  jitterType: 'full',           // 'none' | 'full' | 'equal' | 'decorrelated'
  circuitBreakerThreshold: 5,    // 连续失败次数触发熔断
  circuitBreakerResetMs: 30000,  // 熔断后多久尝试恢复（毫秒）
  attemptTimeoutMs: 15000,       // 单次重试超时（毫秒）
  totalTimeoutMs: 60000,         // 所有重试总超时（毫秒）
  trackStats: true,              // 是否追踪统计
  maxTrackedCalls: 1000          // 最多保留的调用记录数
};

/** 电路断路器状态 */
const CircuitState = {
  CLOSED: 'closed',           // 正常，允许请求
  OPEN: 'open',               // 熔断，拒绝请求
  HALF_OPEN: 'half_open'      // 半开，允许一个测试请求
};

/** 重试结果状态枚举 */
const RetryStatus = {
  SUCCESS: 'success',
  FAILED: 'failed',
  CIRCUIT_OPEN: 'circuit_open',
  TIMEOUT: 'timeout',
  TOTAL_TIMEOUT: 'total_timeout',
  NON_RETRYABLE: 'non_retryable',
  FALLBACK_SUCCESS: 'fallback_success',
  FALLBACK_FAILED: 'fallback_failed'
};

class CircuitBreaker {
  constructor(config) {
    this.threshold = config.circuitBreakerThreshold || 5;
    this.resetMs = config.circuitBreakerResetMs || 30000;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
    this.maxHalfOpenAttempts = 1;
  }

  /**
   * 记录成功，重置熔断器
   */
  recordSuccess() {
    this.failureCount = 0;
    this.halfOpenAttempts = 0;
    this.state = CircuitState.CLOSED;
  }

  /**
   * 记录失败，检查是否需要熔断
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.maxHalfOpenAttempts) {
        this.state = CircuitState.OPEN;
      }
    }

    if (this.failureCount >= this.threshold && this.state !== CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
    }
  }

  /**
   * 检查是否允许请求通过
   */
  allowRequest() {
    if (this.state === CircuitState.CLOSED) return true;
    
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetMs) {
        // 尝试半开
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenAttempts = 0;
        return true;
      }
      return false;
    }
    
    // HALF_OPEN: 只允许有限次数
    return this.halfOpenAttempts < this.maxHalfOpenAttempts;
  }

  /**
   * 获取当前状态摘要
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      resetRemainingMs: this.state === CircuitState.OPEN 
        ? Math.max(0, this.resetMs - (Date.now() - this.lastFailureTime))
        : 0
    };
  }
}

class RetryStats {
  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries;
    this.calls = [];
    this._resetAggregates();
  }

  _resetAggregates() {
    this.totalCalls = 0;
    this.successCalls = 0;
    this.failedCalls = 0;
    this.totalDelay = 0;
    this.totalRetries = 0;
    this.circuitOpenCount = 0;
    this.fallbackCount = 0;
    this.fallbackSuccessCount = 0;
  }

  /**
   * 记录一次重试调用
   */
  recordCall(callRecord) {
    this.calls.push({
      ...callRecord,
      timestamp: Date.now()
    });

    this.totalCalls++;
    if (callRecord.status === RetryStatus.SUCCESS || callRecord.status === RetryStatus.FALLBACK_SUCCESS) {
      this.successCalls++;
    } else {
      this.failedCalls++;
    }
    this.totalRetries += callRecord.attempts || 0;
    this.totalDelay += callRecord.totalDelay || 0;

    if (callRecord.status === RetryStatus.CIRCUIT_OPEN) {
      this.circuitOpenCount++;
    }
    if (callRecord.fallbackUsed) {
      this.fallbackCount++;
      if (callRecord.status === RetryStatus.FALLBACK_SUCCESS) {
        this.fallbackSuccessCount++;
      }
    }

    // 限制记录数量
    if (this.calls.length > this.maxEntries) {
      this.calls = this.calls.slice(-this.maxEntries);
      this._rebuildAggregates();
    }
  }

  _rebuildAggregates() {
    this._resetAggregates();
    for (const c of this.calls) {
      this.totalCalls++;
      if (c.status === RetryStatus.SUCCESS || c.status === RetryStatus.FALLBACK_SUCCESS) {
        this.successCalls++;
      } else {
        this.failedCalls++;
      }
      this.totalRetries += c.attempts || 0;
      this.totalDelay += c.totalDelay || 0;
      if (c.status === RetryStatus.CIRCUIT_OPEN) this.circuitOpenCount++;
      if (c.fallbackUsed) {
        this.fallbackCount++;
        if (c.status === RetryStatus.FALLBACK_SUCCESS) this.fallbackSuccessCount++;
      }
    }
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    return {
      totalCalls: this.totalCalls,
      successRate: this.totalCalls > 0 
        ? Math.round((this.successCalls / this.totalCalls) * 10000) / 100 
        : 0,
      averageRetries: this.totalCalls > 0 
        ? Math.round((this.totalRetries / this.totalCalls) * 100) / 100 
        : 0,
      averageDelayMs: this.successCalls > 0 
        ? Math.round(this.totalDelay / this.successCalls) 
        : 0,
      circuitOpenCount: this.circuitOpenCount,
      fallbackUsage: this.fallbackCount,
      fallbackSuccessRate: this.fallbackCount > 0
        ? Math.round((this.fallbackSuccessCount / this.fallbackCount) * 10000) / 100
        : 0,
      recentCalls: this.calls.slice(-20).map(c => ({
        status: c.status,
        attempts: c.attempts,
        totalDelay: c.totalDelay,
        timestamp: new Date(c.timestamp).toISOString()
      }))
    };
  }
}

class RetryUtility {
  constructor(config = {}) {
    this.config = { ...RETRY_CONFIG, ...config };
    this.circuitBreaker = new CircuitBreaker(this.config);
    this.stats = this.config.trackStats ? new RetryStats(this.config.maxTrackedCalls) : null;
  }

  /**
   * 带指数退避的重试执行（升级版：jitter + circuit breaker + timeout）
   */
  async executeWithRetry(fn, context = {}) {
    const startTime = Date.now();
    let lastError = null;
    let totalDelay = 0;
    const { maxRetries, initialDelay, backoffFactor, maxDelay, totalTimeoutMs } = this.config;

    // 1. 检查电路断路器
    if (!this.circuitBreaker.allowRequest()) {
      const status = this.circuitBreaker.getStatus();
      const result = {
        success: false,
        status: RetryStatus.CIRCUIT_OPEN,
        error: new Error(`Circuit breaker is OPEN. ${status.resetRemainingMs}ms until retry. Failures: ${status.failureCount}`),
        attempts: 0,
        message: `Circuit breaker open (${status.failureCount} consecutive failures)`,
        circuitStatus: status
      };
      this._recordCall(result, 0, 0);
      return result;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 2. 检查总超时
      const elapsed = Date.now() - startTime;
      if (elapsed >= totalTimeoutMs) {
        const result = {
          success: false,
          status: RetryStatus.TOTAL_TIMEOUT,
          error: new Error(`Total timeout of ${totalTimeoutMs}ms exceeded after ${attempt} attempts`),
          attempts: attempt,
          message: `Total timeout exceeded (${elapsed}ms > ${totalTimeoutMs}ms)`
        };
        this._recordCall(result, attempt, totalDelay);
        return result;
      }

      try {
        // 3. 带单次超时的执行
        const result = await this._executeWithTimeout(fn, this.config.attemptTimeoutMs);
        
        // 成功，记录到电路断路器
        this.circuitBreaker.recordSuccess();
        
        const successResult = {
          success: true,
          result,
          status: RetryStatus.SUCCESS,
          attempts: attempt + 1,
          totalDelay,
          totalTime: Date.now() - startTime
        };
        this._recordCall(successResult, attempt + 1, totalDelay);
        return successResult;
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryable(error);
        
        if (!isRetryable || attempt === maxRetries - 1) {
          // 不可重试错误或已耗尽重试次数
          this.circuitBreaker.recordFailure();

          // 5. 尝试回退函数
          if (context.fallback && !isRetryable) {
            return await this._tryFallback(context.fallback, lastError, attempt + 1, totalDelay, startTime);
          }

          const result = {
            success: false,
            status: isRetryable ? RetryStatus.FAILED : RetryStatus.NON_RETRYABLE,
            error: lastError,
            attempts: attempt + 1,
            message: lastError.message,
            totalDelay,
            totalTime: Date.now() - startTime
          };
          this._recordCall(result, attempt + 1, totalDelay);
          return result;
        }

        // 6. 计算带 jitter 的延迟
        const baseDelay = this.calculateDelay(attempt, initialDelay, backoffFactor, maxDelay);
        const delayWithJitter = this._applyJitter(baseDelay, attempt);
        totalDelay += delayWithJitter;
        
        if (context.onRetry) {
          context.onRetry({
            attempt: attempt + 1,
            maxRetries,
            delay: delayWithJitter,
            baseDelay,
            jitterAmount: delayWithJitter - baseDelay,
            error: error.message,
            elapsed: Date.now() - startTime
          });
        }

        await this.sleep(delayWithJitter);
      }
    }

    // 所有重试失败
    this.circuitBreaker.recordFailure();
    const result = {
      success: false,
      status: RetryStatus.FAILED,
      error: lastError,
      attempts: maxRetries,
      totalDelay,
      totalTime: Date.now() - startTime
    };
    this._recordCall(result, maxRetries, totalDelay);
    return result;
  }

  /**
   * 带超时的执行包装
   */
  async _executeWithTimeout(fn, timeoutMs) {
    if (!timeoutMs || timeoutMs <= 0) {
      return await fn();
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Attempt timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn().then(
        (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

  /**
   * 尝试回退函数
   */
  async _tryFallback(fallbackFn, originalError, attempts, totalDelay, startTime) {
    try {
      const fallbackResult = await this._executeWithTimeout(fallbackFn, this.config.attemptTimeoutMs);
      return {
        success: true,
        result: fallbackResult,
        status: RetryStatus.FALLBACK_SUCCESS,
        attempts,
        fallbackUsed: true,
        originalError: originalError.message,
        totalDelay,
        totalTime: Date.now() - startTime
      };
    } catch (fallbackError) {
      return {
        success: false,
        status: RetryStatus.FALLBACK_FAILED,
        error: fallbackError,
        originalError: originalError.message,
        attempts,
        fallbackUsed: true,
        totalDelay,
        totalTime: Date.now() - startTime
      };
    }
  }

  /**
   * 记录调用到统计
   */
  _recordCall(result, attempts, totalDelay) {
    if (this.stats) {
      this.stats.recordCall({
        status: result.status,
        attempts,
        totalDelay,
        fallbackUsed: result.fallbackUsed || false,
        circuitState: this.circuitBreaker.getStatus().state
      });
    }
  }

  /**
   * 应用 jitter 防止惊群效应
   * 
   * 三种策略：
   * - full: delay = random(0, baseDelay) — 最好的分散效果
   * - equal: delay = baseDelay/2 + random(0, baseDelay/2) — 折中
   * - decorrelated: delay = min(maxDelay, random(baseDelay, baseDelay * 3)) — 适合长退避
   * - none: delay = baseDelay — 无随机化
   */
  _applyJitter(baseDelay, attempt) {
    const jitterType = this.config.jitterType || 'full';
    
    switch (jitterType) {
      case 'full':
        return Math.random() * baseDelay;
      case 'equal':
        return (baseDelay / 2) + (Math.random() * baseDelay / 2);
      case 'decorrelated':
        return Math.min(
          this.config.maxDelay,
          baseDelay / 2 + Math.random() * baseDelay * 1.5
        );
      case 'none':
      default:
        return baseDelay;
    }
  }

  /**
   * 判断错误是否可重试
   */
  isRetryable(error) {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';
    const errorStatus = error.status || error.statusCode || '';

    // 精确匹配可重试错误码
    if (this.config.retryableErrors.includes(errorCode)) {
      return true;
    }
    if (this.config.retryableErrors.includes(String(errorStatus))) {
      return true;
    }

    const patterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONN/i,
      /ETIMEDOUT/i,
      /fetch/i,
      /rate.?limit/i,
      /429/i,
      /5\d{2}/i,
      /too many requests/i,
      /service unavailable/i,
      /temporary failure/i,
      /socket hang up/i,
      /read ECONNRESET/i,
      /write EPIPE/i
    ];

    return patterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorCode) || pattern.test(String(errorStatus))
    );
  }

  /**
   * 计算延迟（指数退避）
   */
  calculateDelay(attempt, initialDelay, backoffFactor, maxDelay) {
    const delay = initialDelay * Math.pow(backoffFactor, attempt);
    return Math.min(delay, maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建带重试的 Promise
   */
  retryablePromise(promiseFn, config = {}) {
    const retry = new RetryUtility({ ...this.config, ...config });
    return retry.executeWithRetry(promiseFn);
  }

  /**
   * 获取电路断路器状态
   */
  getCircuitStatus() {
    return this.circuitBreaker.getStatus();
  }

  /**
   * 手动重置电路断路器
   */
  resetCircuitBreaker() {
    this.circuitBreaker = new CircuitBreaker(this.config);
    return { status: 'reset' };
  }

  /**
   * 获取重试统计
   */
  getStats() {
    if (!this.stats) return { enabled: false };
    return {
      enabled: true,
      ...this.stats.getSummary()
    };
  }

  /**
   * 重置统计
   */
  resetStats() {
    if (this.stats) {
      this.stats = new RetryStats(this.config.maxTrackedCalls);
    }
    return { status: 'reset' };
  }

  /**
   * 创建配置实例（方便创建不同配置的重试器）
   */
  static createWithConfig(config) {
    return new RetryUtility(config);
  }

  /**
   * 便捷方法：执行带重试和回退的调用
   */
  static async withFallback(fn, fallbackFn, config = {}) {
    const retry = new RetryUtility(config);
    return retry.executeWithRetry(fn, { fallback: fallbackFn });
  }

  /**
   * 便捷方法：快速重试（默认配置，无额外设置）
   */
  static async quickRetry(fn, maxRetries = 3) {
    const retry = new RetryUtility({ maxRetries });
    return retry.executeWithRetry(fn);
  }
}

module.exports = { RetryUtility, RETRY_CONFIG, RetryStatus, CircuitState };
