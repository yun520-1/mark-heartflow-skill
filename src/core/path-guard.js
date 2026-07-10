/**
 * path-guard.js — [AUDIT-FIX M-03] 文件路径安全校验
 * 防止路径遍历攻击，确保所有 fs 写入在允许目录内
 */

const path = require('path');

// 允许的根目录
const ALLOWED_ROOTS = [
  path.resolve(process.cwd(), 'data'),
  path.resolve(process.cwd(), 'tmp'),
  path.resolve('/tmp'),
];

/**
 * 校验文件路径安全性
 * @param {string} filePath - 待校验路径
 * @param {string[]} [extraRoots] - 额外允许的根目录
 * @returns {{ safe: boolean, resolved: string, reason?: string }}
 */
function guardPath(filePath, extraRoots = []) {
  if (!filePath || typeof filePath !== 'string') {
    return { safe: false, resolved: '', reason: 'path must be a non-empty string' };
  }
  
  const resolved = path.resolve(filePath);
  const roots = [...ALLOWED_ROOTS, ...extraRoots.map(r => path.resolve(r))];
  
  // 检查路径遍历
  if (resolved.includes('..')) {
    return { safe: false, resolved, reason: 'path traversal detected' };
  }
  
  // 检查是否在允许目录内
  const allowed = roots.some(root => resolved.startsWith(root + path.sep) || resolved === root);
  if (!allowed) {
    return { safe: false, resolved, reason: `path outside allowed roots: ${resolved}` };
  }
  
  return { safe: true, resolved };
}

/**
 * 安全的 fs.writeFileSync 包装
 */
function safeWriteSync(filePath, content, encoding = 'utf8', extraRoots = []) {
  const { safe, resolved, reason } = guardPath(filePath, extraRoots);
  if (!safe) throw new Error(`path-guard: ${reason}`);
  const fs = require('fs');
  return fs.writeFileSync(resolved, content, encoding);
}

/**
 * 安全的 fs.readFileSync 包装
 */
function safeReadSync(filePath, encoding = 'utf8', extraRoots = []) {
  const { safe, resolved, reason } = guardPath(filePath, extraRoots);
  if (!safe) throw new Error(`path-guard: ${reason}`);
  const fs = require('fs');
  return fs.readFileSync(resolved, encoding);
}

module.exports = { guardPath, safeWriteSync, safeReadSync, ALLOWED_ROOTS };
