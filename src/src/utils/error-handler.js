/**
 * HeartFlow v5.8.1 — 统一错误处理
 * 
 * 来源: Node.js Best Practices (goldbergyoni/nodebestpractices)
 * 功能: 错误分类、自动重试、结构化日志
 */

class ErrorHandler {
  constructor(options = {}) {
    this.errorTypes = {
      VALIDATION_ERROR: { status: 400, retry: false, logLevel: 'warn' },
      AUTHENTICATION_ERROR: { status: 401, retry: false, logLevel: 'warn' },
      AUTHORIZATION_ERROR: { status: 403, retry: false, logLevel: 'warn' },
      NOT_FOUND_ERROR: { status: 404, retry: false, logLevel: 'info' },
      RATE_LIMIT_ERROR: { status: 429, retry: true, retryAfter: 60, logLevel: 'warn' },
      LLM_ERROR: { status: 503, retry: true, maxRetries: 3, logLevel: 'error' },
      MEMORY_ERROR: { status: 500, retry: true, maxRetries: 2, logLevel: 'error' },
      NETWORK_ERROR: { status: 502, retry: true, maxRetries: 3, logLevel: 'error' },
      TIMEOUT_ERROR: { status: 504, retry: true, maxRetries: 2, logLevel: 'error' },
      UNKNOWN_ERROR: { status: 500, retry: false, logLevel: 'error' }
    };

    this.apmClient = options.apmClient || null;
    this.logger = options.logger || console;
  }

  /**
   * 统一错误处理
   */
  handleError(error, context = {}) {
    const errorType = this.classifyError(error);
    const errorInfo = this.errorTypes[errorType];

    // 结构化错误日志
    const structuredError = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      retryable: errorInfo.retry
    };

    // 记录日志（根据错误级别）
    this.logError(structuredError, errorInfo.logLevel);

    // 上报到 APM（如果配置了）
    if (this.apmClient) {
      this.apmClient.captureError(structuredError);
    }

    // 返回统一错误响应
    return {
      error: true,
      type: errorType,
      message: error.message,
      status: errorInfo.status,
      retryable: errorInfo.retry,
      retryAfter: errorInfo.retryAfter || null
    };
  }

  /**
   * 错误分类
   */
  classifyError(error) {
    // 验证错误
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'VALIDATION_ERROR';
    }

    // 认证错误
    if (error.name === 'UnauthorizedError' || error.message.includes('unauthorized')) {
      return 'AUTHENTICATION_ERROR';
    }

    // 授权错误
    if (error.name === 'ForbiddenError' || error.message.includes('forbidden')) {
      return 'AUTHORIZATION_ERROR';
    }

    // 404 错误
    if (error.message.includes('not found') || error.status === 404) {
      return 'NOT_FOUND_ERROR';
    }

    // 限流错误
    if (error.status === 429 || error.message.includes('rate limit')) {
      return 'RATE_LIMIT_ERROR';
    }

    // LLM 错误
    if (error.message.includes('LLM') || error.message.includes('OpenAI') || error.message.includes('Anthropic')) {
      return 'LLM_ERROR';
    }

    // 记忆系统错误
    if (error.message.includes('memory') || error.message.includes('Failed to')) {
      return 'MEMORY_ERROR';
    }

    // 网络错误
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message.includes('network')) {
      return 'NETWORK_ERROR';
    }

    // 超时错误
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * 记录日志
   */
  logError(structuredError, logLevel) {
    const logMethod = this.logger[logLevel] || this.logger.error;

    logMethod('[ErrorHandler]', JSON.stringify(structuredError, null, 2));
  }

  /**
   * 重试逻辑
   */
  async retry(fn, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const delay = options.delay || 1000;
    const backoff = options.backoff || 2;  // 指数退避基数

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const errorInfo = this.handleError(error, { attempt, maxRetries });

        if (!errorInfo.retryable || attempt === maxRetries) {
          throw error;
        }

        // 计算等待时间（指数退避）
        const waitTime = delay * Math.pow(backoff, attempt - 1);
        this.logger.warn(`[ErrorHandler] Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`);

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * 包装异步函数（自动错误处理）
   */
  wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }

  /**
   * 包装同步函数（自动错误处理）
   */
  wrapSync(fn, context = {}) {
    return (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        throw this.handleError(error, context);
      }
    };
  }
}

/**
 * 创建预配置的错误处理程序
 */
function createErrorHandler(options) {
  return new ErrorHandler(options);
}

/**
 * 默认错误处理程序（全局复用）
 */
let defaultErrorHandler = null;

function getDefaultErrorHandler() {
  if (!defaultErrorHandler) {
    defaultErrorHandler = new ErrorHandler();
  }
  return defaultErrorHandler;
}

module.exports = { ErrorHandler, createErrorHandler, getDefaultErrorHandler };
