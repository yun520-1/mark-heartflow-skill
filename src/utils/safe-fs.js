/**
 * safe-fs.js — [AUDIT-FIX P0-5] 安全文件系统写入包装
 * 将 path-guard.js 路径校验接入所有 fs 写入操作。
 * 通过 HEARTFLOW_PATH_GUARD 环境变量控制行为：
 *   未设置  → 静默写入传统行为（兼容模式）
 *   warn    → 警告日志但允许写入
 *   enforce → 严格拒绝越界写入
 */
const fs = require('fs');
const path = require('path');
const { guardPath } = require('../core/path-guard.js');

const GUARD_MODE = process.env.HEARTFLOW_PATH_GUARD || ''; // '', 'warn', 'enforce'

/**
 * 安全写文件
 * @param {string} filePath
 * @param {string|Buffer} data
 * @param {object|string} [options] - fs.writeFileSync options
 * @returns {undefined}
 */
function safeWriteFileSync(filePath, data, options) {
  const absPath = path.resolve(filePath);
  const result = guardPath(absPath);
  if (!result.safe) {
    const msg = `[SAFE-FS] 路径越界: ${result.reason} (${absPath})`;
    if (GUARD_MODE === 'enforce') {
      throw new Error(msg);
    }
    if (GUARD_MODE === 'warn') {
      console.warn(msg);
    }
    // 未设置 → 静默切入传统模式，写入仍进行
  }
  return fs.writeFileSync(filePath, data, options);
}

/**
 * 安全追加写文件
 * @param {string} filePath
 * @param {string|Buffer} data
 * @param {object|string} [options] - fs.appendFileSync options
 * @returns {undefined}
 */
function safeAppendFileSync(filePath, data, options) {
  const absPath = path.resolve(filePath);
  const result = guardPath(absPath);
  if (!result.safe) {
    const msg = `[SAFE-FS] 路径越界: ${result.reason} (${absPath})`;
    if (GUARD_MODE === 'enforce') {
      throw new Error(msg);
    }
    if (GUARD_MODE === 'warn') {
      console.warn(msg);
    }
  }
  return fs.appendFileSync(filePath, data, options);
}

module.exports = { safeWriteFileSync, safeAppendFileSync, guardPath };
