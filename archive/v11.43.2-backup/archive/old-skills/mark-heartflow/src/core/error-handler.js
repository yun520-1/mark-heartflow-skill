/**
 * HeartFlow 错误处理器
 * 统一捕获和处理系统异常
 */

const fs = require('fs');
const path = require('path');

const ERROR_LOG = path.join(__dirname, 'error-handler.log');

class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxHistory = 100;
  }

  // 捕获并记录错误
  capture(error, context = {}) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message || String(error),
      stack: error.stack,
      context,
      type: this.classifyError(error)
    };

    this.errors.push(errorRecord);
    if (this.errors.length > this.maxHistory) {
      this.errors.shift();
    }

    this.logError(errorRecord);
    return errorRecord;
  }

  // 分类错误
  classifyError(error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('timeout')) return 'timeout';
    if (msg.includes('memory')) return 'memory';
    if (msg.includes('permission')) return 'permission';
    if (msg.includes('network')) return 'network';
    if (msg.includes('syntax')) return 'syntax';
    return 'unknown';
  }

  // 记录错误到文件
  logError(record) {
    const entry = `[${new Date(record.timestamp).toISOString()}] ${record.type}: ${record.message}\n`;
    fs.appendFileSync(ERROR_LOG, entry);
  }

  // 获取错误历史
  getHistory(count = 10) {
    return this.errors.slice(-count);
  }

  // 获取错误统计
  getStats() {
    const stats = {};
    for (const e of this.errors) {
      stats[e.type] = (stats[e.type] || 0) + 1;
    }
    return stats;
  }
}

module.exports = new ErrorHandler();