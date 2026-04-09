/**
 * Retry Utility - 重试与退避策略工具
 */

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 10000,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED', '429', '500', '502', '503', '504']
};

class RetryUtility {
  constructor(config = {}) {
    this.config = { ...RETRY_CONFIG, ...config };
  }

  /**
   * 带指数退避的重试执行
   */
  async executeWithRetry(fn, context = {}) {
    let lastError = null;
    const { maxRetries, initialDelay, backoffFactor, maxDelay } = this.config;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await fn();
        return {
          success: true,
          result,
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryable(error);
        
        if (!isRetryable || attempt === maxRetries - 1) {
          return {
            success: false,
            error,
            attempts: attempt + 1,
            message: error.message
          };
        }

        const delay = this.calculateDelay(attempt, initialDelay, backoffFactor, maxDelay);
        
        if (context.onRetry) {
          context.onRetry({
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message
          });
        }

        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: maxRetries
    };
  }

  /**
   * 判断错误是否可重试
   */
  isRetryable(error) {
    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    if (this.config.retryableErrors.includes(errorCode)) {
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
      /5\d{2}/i
    ];

    return patterns.some(pattern => 
      pattern.test(errorMessage) || pattern.test(errorCode)
    );
  }

  /**
   * 计算延迟
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
    const retry = new RetryUtility(config);
    return retry.executeWithRetry(promiseFn);
  }
}

module.exports = { RetryUtility, RETRY_CONFIG };
