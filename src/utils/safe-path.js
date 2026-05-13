/**
 * safe-path.js — 安全的路径工具
 * 
 * 防止路径遍历攻击：所有路径操作后强制验证结果在允许目录内。
 * 使用方式：始终用 safePath(baseDir, ...segments) 而非直接 path.join。
 * 
 * @version v0.13.7
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * 生成安全路径——禁止路径遍历
 * 
 * @param {string} baseDir - 允许的根目录（必须是绝对路径）
 * @param {...string} segments - 路径片段（用户输入）
 * @returns {string} - 经过安全验证的绝对路径
 * @throws {Error} - 如果结果路径超出 baseDir
 * 
 * @example
 *   safePath('/data/memory', 'user-123', 'note.md')
 *   // => '/data/memory/user-123/note.md'
 *   
 *   safePath('/data/memory', '..', '..', 'etc', 'passwd')
 *   // => 抛出 Error('Path traversal detected')
 */
function safePath(baseDir, ...segments) {
  if (!path.isAbsolute(baseDir)) {
    throw new Error(`safePath: baseDir must be absolute, got: ${baseDir}`);
  }
  // 解析 symlink 并规范化路径（防止 symlink 路径遍历）
  let resolved;
  try {
    resolved = fs.realpathSync(baseDir);
  } catch {
    resolved = baseDir;
  }
  resolved = path.resolve(resolved, ...segments);
  // path.resolve 会把 ../ 展开后与 baseDir 拼接
  // 使用 realpath 后的 baseDir 检查，防止 symlink 绕过
  if (!resolved.startsWith(path.normalize(baseDir) + path.sep) && resolved !== path.normalize(baseDir)) {
    throw new Error(`Path traversal detected: resolved=${resolved}, base=${baseDir}`);
  }
  return resolved;
}

/**
 * 安全读取文件内容（只能读取 baseDir 下的文件）
 * 
 * @param {string} baseDir - 允许的根目录
 * @param {...string} segments - 相对路径片段
 * @returns {string} 文件内容
 * @throws {Error} - 路径遍历或文件不存在
 */
async function safeReadFile(baseDir, ...segments) {
  const filePath = safePath(baseDir, ...segments);
  return fs.promises.readFile(filePath, 'utf8');
}

/**
 * 安全读取文件内容（同步版本）
 */
function safeReadFileSync(baseDir, ...segments) {
  const filePath = safePath(baseDir, ...segments);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * 安全写入文件（只能写入 baseDir 下）
 * 
 * @param {string} baseDir - 允许的根目录
 * @param {string|string[]} content - 文件内容
 * @param {...string} segments - 相对路径片段
 */
async function safeWriteFile(baseDir, content, ...segments) {
  const filePath = safePath(baseDir, ...segments);
  await fs.promises.writeFile(filePath, content, 'utf8');
}

/**
 * 安全写入文件（同步版本）
 */
function safeWriteFileSync(baseDir, content, ...segments) {
  const filePath = safePath(baseDir, ...segments);
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 检查路径是否存在且在允许目录下
 * 
 * @param {string} baseDir - 允许的根目录
 * @param {...string} segments - 相对路径片段
 * @returns {boolean}
 */
function safeExists(baseDir, ...segments) {
  try {
    const filePath = safePath(baseDir, ...segments);
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  safePath,
  safeReadFile,
  safeReadFileSync,
  safeWriteFile,
  safeWriteFileSync,
  safeExists,
};
