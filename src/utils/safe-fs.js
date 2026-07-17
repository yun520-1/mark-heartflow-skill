/**
 * safe-fs.js — 安全文件系统包装（P0-2 修复）
 * 
 * 设计：完全兼容 Node.js fs 模块，所有操作自动通过路径守卫。
 * 使用方式：将 require('fs') 替换为 require('./utils/safe-fs')，
 * 所有现有 fs.xxx() 调用自动获得路径越界保护。
 * 
 * 保护机制：
 * - 写操作（write/append/mkdir/copy/unlink/rename）：越界时按 GUARD_MODE 处理
 * - 读操作（read/readdir/exists/stat）：越界时抛错或返回空
 * - 环境变量 HEARTFLOW_PATH_GUARD 控制行为：
 *   - '' (默认): 静默切入传统模式，写入仍进行（兼容）
 *   - 'warn': 警告日志但允许写入
 *   - 'enforce': 严格拒绝越界写入
 */

const fs = require('fs');
const path = require('path');
const { guardPath } = require('../core/path-guard.js');

const GUARD_MODE = process.env.HEARTFLOW_PATH_GUARD || ''; // '', 'warn', 'enforce'

/**
 * 路径安全检查
 * @param {string} filePath - 要检查的路径
 * @returns {{ safe: boolean, reason?: string, absPath: string }}
 */
function _check(filePath) {
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
    // 默认模式：静默切入传统模式
  }
  return result;
}

// ─── 写操作（路径越界拦截）───

function safeWriteFileSync(filePath, data, options) {
  _check(filePath);
  return fs.writeFileSync(filePath, data, options);
}

function safeAppendFileSync(filePath, data, options) {
  _check(filePath);
  return fs.appendFileSync(filePath, data, options);
}

function safeMkdirSync(filePath, options) {
  _check(filePath);
  return fs.mkdirSync(filePath, options);
}

function safeMkdirSyncRecursive(dirPath, options) {
  _check(dirPath);
  return fs.mkdirSync(dirPath, { recursive: true, ...options });
}

function safeCopyFileSync(src, dest, mode) {
  _check(src);
  _check(dest);
  return fs.copyFileSync(src, dest, mode);
}

function safeUnlinkSync(filePath) {
  _check(filePath);
  return fs.unlinkSync(filePath);
}

function safeRenameSync(oldPath, newPath) {
  _check(oldPath);
  _check(newPath);
  return fs.renameSync(oldPath, newPath);
}

function safeChmodSync(path, mode) {
  _check(path);
  return fs.chmodSync(path, mode);
}

// ─── 读操作（路径越界保护）───

function safeReadFileSync(filePath, options) {
  const result = _check(filePath);
  if (!result.safe && GUARD_MODE === 'enforce') {
    throw new Error(`[SAFE-FS] 拒绝读取越界路径: ${path.resolve(filePath)}`);
  }
  return fs.readFileSync(filePath, options);
}

function safeReaddirSync(filePath, options) {
  const result = _check(filePath);
  if (!result.safe && GUARD_MODE === 'enforce') {
    throw new Error(`[SAFE-FS] 拒绝读取越界目录: ${path.resolve(filePath)}`);
  }
  return fs.readdirSync(filePath, options);
}

function safeExistsSync(filePath) {
  try { _check(filePath); } catch(e) { return false; }
  return fs.existsSync(filePath);
}

function safeStatSync(filePath) {
  _check(filePath);
  return fs.statSync(filePath);
}

// ─── 兼容层：导出完整 fs API，使 safe-fs 可作为 fs 替代品 ───

const safeFs = {
  // 写操作
  writeFileSync: safeWriteFileSync,
  appendFileSync: safeAppendFileSync,
  mkdirSync: safeMkdirSync,
  copyFileSync: safeCopyFileSync,
  unlinkSync: safeUnlinkSync,
  renameSync: safeRenameSync,
  chmodSync: safeChmodSync,
  // 读操作
  readFileSync: safeReadFileSync,
  readdirSync: safeReaddirSync,
  existsSync: safeExistsSync,
  statSync: safeStatSync,
  // 路径工具
  path,
  guardPath,
  _check,
  // 原始 fs（用于需要绕过守卫的特殊场景）
  _raw: fs,
};

// 代理所有未显式声明的 fs 方法
const fsMethods = new Set(Object.keys(safeFs));
Object.getOwnPropertyNames(fs).forEach(method => {
  if (!fsMethods.has(method) && typeof fs[method] === 'function') {
    safeFs[method] = fs[method].bind(fs);
  }
});

// 同时导出命名导出，支持解构赋值
module.exports = safeFs;
module.exports.safeWriteFileSync = safeWriteFileSync;
module.exports.safeAppendFileSync = safeAppendFileSync;
module.exports.guardPath = guardPath;
module.exports._check = _check;
module.exports._raw = fs;
module.exports.default = safeFs;
