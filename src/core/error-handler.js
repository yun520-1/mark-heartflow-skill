/**
 * HeartFlow 错误处理器 v2.0.26
 * 统一捕获和处理系统异常
 * 增强：错误类型细分 + 严重等级 + 恢复建议
 * 安全修复：统一错误处理，防止信息泄露
 */

const fs = require('fs');
const path = require('path');

const ERROR_LOG = path.join(__dirname, 'error-handler.log');

// 敏感信息过滤规则
const SENSITIVE_PATTERNS = [
  // 文件路径
  { pattern: /\/[a-zA-Z0-9_\-./]+(\/|[a-zA-Z0-9_\-.])/g, replacement: '[PATH]' },
  // API 密钥（常见格式）
  { pattern: /(sk-|pk-|api[_-]?key[_-]?)[a-zA-Z0-9]{20,}/gi, replacement: '[API_KEY]' },
  // 环境变量中的敏感信息
  { pattern: /(PASSWORD|SECRET|TOKEN|AUTH)[=:]\s*[^\s]+/gi, replacement: '$1=[REDACTED]' },
  // IP 地址
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_ADDRESS]' },
  // 电子邮件
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' }
];

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxHistory = 100;
    // v2.0.25: 可观测性计数器
    this._counters = {
      totalCaptured: 0,
      byType: {},
      bySeverity: { critical: 0, warning: 0, info: 0 }
    };
    
    // 判断是否生产环境
    this.isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.HEARTFLOW_ENV === 'production';
  }

  /**
   * 过滤敏感信息
   * @private
   */
  _filterSensitiveInfo(text) {
    if (!text || typeof text !== 'string') return text;
    
    let filtered = text;
    for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
      filtered = filtered.replace(pattern, replacement);
    }
    return filtered;
  }

  /**
   * 严重等级：critical > warning > info
   */
  _getSeverity(error) {
    const msg = (error.message || '').toLowerCase();
    const criticalPatterns = [
      'out of memory', 'oom', 'heap', 'fatal', 'crash',
      'econnrefused', 'eaddrnotavail', 'ENOENT', 'EBADF'
    ];
    const warningPatterns = [
      'timeout', 'eagain', 'eagain', 'permission', 'access denied',
      'network', 'connection refused', 'ECONNRESET', 'ETIMEDOUT'
    ];
    for (const p of criticalPatterns) {
      if (msg.includes(p)) return 'critical';
    }
    for (const p of warningPatterns) {
      if (msg.includes(p)) return 'warning';
    }
    return 'info';
  }

  /**
   * 捕获并记录错误
   * 安全修复：生产环境不返回堆栈信息
   */
  capture(error, context = {}) {
    const type = this.classifyError(error);
    const severity = this._getSeverity(error);

    // 过滤敏感信息
    const safeMessage = this._filterSensitiveInfo(error.message || String(error));
    const safeStack = this.isProduction ? null : this._filterSensitiveInfo(error.stack);
    const safeContext = this._filterSensitiveInfoInContext(context);

    const errorRecord = {
      timestamp: Date.now(),
      message: safeMessage,
      // 生产环境不记录堆栈（可能包含敏感路径）
      stack: safeStack,
      context: safeContext,
      type,
      severity,
      recovery: this.getRecoverySuggestion(type, error)
    };

    this.errors.push(errorRecord);
    if (this.errors.length > this.maxHistory) {
      this.errors.shift();
    }

    // v2.0.25: 计数器更新
    this._counters.totalCaptured++;
    this._counters.byType[type] = (this._counters.byType[type] || 0) + 1;
    this._counters.bySeverity[severity]++;

    this.logError(errorRecord);
    return errorRecord;
  }

  /**
   * 过滤上下文中的敏感信息
   * @private
   */
  _filterSensitiveInfoInContext(context) {
    if (!context || typeof context !== 'object') return context;
    
    const filtered = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof value === 'string') {
        filtered[key] = this._filterSensitiveInfo(value);
      } else if (typeof value === 'object' && value !== null) {
        // 递归过滤（限制深度）
        filtered[key] = this._filterSensitiveInfoInContext(value);
      } else {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * 根据错误类型给出恢复建议
   */
  getRecoverySuggestion(type, error) {
    const msg = (error.message || '').toLowerCase();
    const suggestions = {
      timeout: '检查网络连接或增加超时阈值；如持续出现考虑服务降级',
      memory: '触发GC或重启进程；长期方案：优化数据结构或增加内存限制',
      permission: '检查文件/目录权限；Unix系统运行 chmod/chown；Windows检查ACL',
      network: '检查网络连通性、端口是否开放、防火墙规则',
      syntax: `检查代码语法错误：${msg.includes('unexpected') ? '发现意外的令牌' : 'JSON/JS语法问题'}`,
      json: 'JSON.parse 失败——检查JSON格式（引号、逗号、括号配对）',
      module: '模块未找到——确认模块已安装且路径正确',
      file_not_found: '文件不存在——检查路径是否正确，是否有读写权限',
      unknown: '未知错误——查看 stack trace 定位问题'
    };
    return suggestions[type] || suggestions.unknown;
  }

  /**
   * 分类错误（v2.0.25 细分版）
   */
  classifyError(error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
    if (msg.includes('out of memory') || msg.includes('heap')) return 'memory';
    if (msg.includes('permission') || msg.includes('eacces') || msg.includes('access denied')) return 'permission';
    if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('connection refused') || msg.includes('connection reset') || msg.includes('etimedout') || msg.includes('connection timed out')) return 'network';
    if (msg.includes('syntax')) return 'syntax';
    if (msg.includes('json') || msg.includes('unexpected token') || msg.includes('parse error')) return 'json';
    if (msg.includes('cannot find module') || msg.includes('module not found')) return 'module';
    if (msg.includes('enoent') || msg.includes('no such file')) return 'file_not_found';
    return 'unknown';
  }

  /**
   * 记录错误到文件
   * 安全修复：日志中也过滤敏感信息
   */
  logError(record) {
    const safeMessage = this._filterSensitiveInfo(record.message);
    const safeRecovery = this._filterSensitiveInfo(record.recovery);
    
    const entry = `[${new Date(record.timestamp).toISOString()}] [${record.severity.toUpperCase()}] ${record.type}: ${safeMessage}\n  recovery: ${safeRecovery}\n`;
    
    try {
      fs.appendFileSync(ERROR_LOG, entry);
    } catch (e) {
      // 避免递归错误
      console.error('[ErrorHandler] 无法写入日志:', e.message);
    }
  }

  /**
   * 获取错误历史
   * 安全修复：返回前过滤敏感信息
   */
  getHistory(count = 10) {
    const history = this.errors.slice(-count);
    return history.map(record => ({
      ...record,
      message: this._filterSensitiveInfo(record.message),
      stack: this.isProduction ? '[REDACTED_IN_PRODUCTION]' : record.stack
    }));
  }

  /**
   * 获取错误统计
   */
  getStats() {
    const stats = {};
    for (const e of this.errors) {
      stats[e.type] = (stats[e.type] || 0) + 1;
    }
    // v2.0.25: 附加计数器
    return { ...stats, counters: this._counters };
  }
}

module.exports = new ErrorHandler();