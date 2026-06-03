/**
 * Error Handler - 全局错误边界与异常处理
 * 安全修复：添加敏感信息过滤，防止信息泄露
 */

const fs = require('fs');
const path = require('path');

const ERROR_CONFIG = {
  maxRetries: 3,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'ECONNREFUSED'],
  logFile: '.opencode/logs/error.log',
  gracefulMessage: '我遇到了一些内部波动，让我们重新聚焦当前任务，你刚才说到哪里了？'
};

// 敏感信息过滤规则
const SENSITIVE_PATTERNS = [
  { pattern: /(sk-|pk-|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}/gi, replacement: '[API_KEY]' },
  { pattern: /(PASSWORD|SECRET|TOKEN|AUTH)[=:]\s*[^\s]+/gi, replacement: '$1=[REDACTED]' },
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { pattern: /\/[a-zA-Z0-9_\-./]+(?:\/|[a-zA-Z0-9_\-.])|[A-Z]:\\[^\s]+/g, replacement: '[PATH]' }
];

/**
 * 过滤敏感信息
 */
function filterSensitiveInfo(text) {
  if (!text || typeof text !== 'string') return text;
  
  let filtered = text;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    filtered = filtered.replace(pattern, replacement);
  }
  return filtered;
}

/**
 * 过滤对象中的敏感信息
 */
function filterSensitiveInObject(obj, depth = 0) {
  if (depth > 3) return obj; // 防止无限递归
  
  if (typeof obj === 'string') {
    return filterSensitiveInfo(obj);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const filtered = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        filtered[key] = filterSensitiveInfo(value);
      } else if (typeof value === 'object' && value !== null) {
        filtered[key] = filterSensitiveInObject(value, depth + 1);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }
  
  return obj;
}

class ErrorHandler {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.logFile = path.join(projectRoot, ERROR_CONFIG.logFile);
    this.retryCounts = new Map();
    this.errorHistory = [];
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * 错误处理主函数
   * 安全修复：过滤敏感信息
   */
  handleError(error, context = {}) {
    const errorInfo = this.formatError(error, context);
    
    this.logError(errorInfo);
    
    this.errorHistory.push(errorInfo);
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    const shouldRetry = this.shouldRetry(error, context);
    
    if (shouldRetry) {
      const retryCount = this.getRetryCount(context.operation || 'default');
      
      if (retryCount < ERROR_CONFIG.maxRetries) {
        const delay = this.calculateBackoff(retryCount);
        return {
          action: 'retry',
          delay,
          retryCount: retryCount + 1,
          operation: context.operation,
          message: `将在 ${delay}ms 后重试 (${retryCount + 1}/${ERROR_CONFIG.maxRetries})`
        };
      }
    }

    return {
      action: 'graceful_degradation',
      userMessage: ERROR_CONFIG.gracefulMessage,
      // 生产环境不暴露内部错误信息
      internalMessage: this.isProduction ? '[ERROR_DETAILS_REDACTED]' : filterSensitiveInfo(error.message),
      recoverable: false
    };
  }

  formatError(error, context) {
    return {
      timestamp: new Date().toISOString(),
      name: filterSensitiveInfo(error.name),
      message: filterSensitiveInfo(error.message || String(error)),
      // 生产环境不记录堆栈
      stack: this.isProduction ? null : filterSensitiveInfo(error.stack || ''),
      context: filterSensitiveInObject(context),
      operation: context.operation || 'unknown'
    };
  }

  logError(errorInfo) {
    try {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const safeMessage = filterSensitiveInfo(errorInfo.message);
      const safeStack = errorInfo.stack ? filterSensitiveInfo(errorInfo.stack) : '';
      const safeContext = filterSensitiveInObject(errorInfo.context);

      const logEntry = `[${errorInfo.timestamp}] ${safeMessage}\n` +
        `  Operation: ${errorInfo.operation}\n` +
        `  Context: ${JSON.stringify(safeContext)}\n` +
        (safeStack ? `  Stack: ${safeStack}\n` : '') +
        '---\n';

      fs.appendFileSync(this.logFile, logEntry);
    } catch (e) {
      console.error('[ErrorHandler] Failed to write log:', e.message);
    }
  }

  shouldRetry(error, context) {
    if (context.noRetry) return false;
    if (context.retriesRemaining !== undefined && context.retriesRemaining <= 0) return false;

    const errorCode = error.code || error.name;
    if (ERROR_CONFIG.retryableErrors.includes(errorCode)) {
      return true;
    }

    const retryablePatterns = [
      /timeout/i,
      /network/i,
      /connection/i,
      /ECONN/i,
      /ETIMEDOUT/i,
      /fetch/i
    ];

    const errorMessage = error.message || '';
    return retryablePatterns.some(pattern => pattern.test(errorMessage));
  }

  getRetryCount(operation) {
    const current = this.retryCounts.get(operation) || 0;
    return current;
  }

  incrementRetryCount(operation) {
    const current = this.retryCounts.get(operation) || 0;
    this.retryCounts.set(operation, current + 1);
  }

  resetRetryCount(operation) {
    this.retryCounts.delete(operation);
  }

  calculateBackoff(retryCount) {
    const baseDelay = 1000;
    const backoffFactor = 2;
    const delay = baseDelay * Math.pow(backoffFactor, retryCount);
    return Math.min(delay, 10000);
  }

  /**
   * 执行带重试的操作
   */
  async executeWithRetry(operationFn, context = {}) {
    const operation = context.operation || 'operation';
    let lastError = null;

    for (let attempt = 0; attempt < ERROR_CONFIG.maxRetries; attempt++) {
      try {
        this.resetRetryCount(operation);
        const result = await operationFn();
        return { success: true, result };
      } catch (error) {
        lastError = error;
        
        const handleResult = this.handleError(error, {
          ...context,
          operation
        });

        if (handleResult.action === 'retry') {
          this.incrementRetryCount(operation);
          await this.sleep(handleResult.delay);
          continue;
        }

        return {
          success: false,
          error: handleResult,
          message: handleResult.userMessage
        };
      }
    }

    return {
      success: false,
      error: lastError,
      message: ERROR_CONFIG.gracefulMessage
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const errorTypes = {};
    for (const e of this.errorHistory) {
      errorTypes[e.name] = (errorTypes[e.name] || 0) + 1;
    }

    return {
      totalErrors: this.errorHistory.length,
      errorTypes,
      recentErrors: this.errorHistory.slice(-5).map(e => ({
        timestamp: e.timestamp,
        name: e.name,
        operation: e.operation
      }))
    };
  }

  /**
   * 清理旧日志
   */
  cleanOldLogs(maxAgeDays = 7) {
    try {
      if (!fs.existsSync(this.logFile)) return;

      const stats = fs.statSync(this.logFile);
      const ageMs = Date.now() - stats.mtimeMs;
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

      if (ageMs > maxAgeMs) {
        const backupFile = this.logFile + '.old';
        fs.renameSync(this.logFile, backupFile);
        console.log(`[ErrorHandler] Rotated old log to ${backupFile}`);
      }
    } catch (e) {
      console.error('[ErrorHandler] Failed to clean logs:', e.message);
    }
  }
}

module.exports = { ErrorHandler, ERROR_CONFIG };
