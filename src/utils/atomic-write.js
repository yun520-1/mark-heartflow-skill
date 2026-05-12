/**
 * atomic-write.js — 原子写入工具
 * 
 * 原理：先写临时文件，再原子重命名（rename 在同一文件系统内是原子的）。
 * 保证要么旧文件完整，要么新文件完整，绝不会有"写一半"的情况。
 * 
 * @version v0.13.7
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 原子写入 JSON（异步 Promise 版本）
 * @param {string} filePath - 目标文件路径
 * @param {any} data - 要写入的数据（会被 JSON.stringify）
 */
async function atomicWriteJSON(filePath, data) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpFile = path.join(dir, `.${base}.${Date.now()}.${process.pid}.tmp`);
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(tmpFile, content, 'utf8');
    await fs.promises.rename(tmpFile, filePath);
  } catch (err) {
    try { await fs.promises.unlink(tmpFile); } catch (_) {}
    throw err;
  }
}

/**
 * 原子写入普通字符串（异步 Promise 版本）
 * @param {string} filePath - 目标文件路径
 * @param {string} content - 要写入的字符串内容
 */
async function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpFile = path.join(dir, `.${base}.${Date.now()}.${process.pid}.tmp`);
  try {
    await fs.promises.writeFile(tmpFile, content, 'utf8');
    await fs.promises.rename(tmpFile, filePath);
  } catch (err) {
    try { await fs.promises.unlink(tmpFile); } catch (_) {}
    throw err;
  }
}

/**
 * 原子写入（同步版本，用于不想引入 async 的场景）
 * @param {string} filePath - 目标文件路径
 * @param {string} content - 要写入的字符串内容
 */
function atomicWriteSync(filePath, content) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const tmpFile = path.join(dir, `.${base}.${Date.now()}.${process.pid}.tmp`);
  try {
    fs.writeFileSync(tmpFile, content, 'utf8');
    fs.renameSync(tmpFile, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    throw err;
  }
}

/**
 * 原子写入 JSON（同步版本）
 * @param {string} filePath - 目标文件路径
 * @param {any} data - 要写入的数据
 */
function atomicWriteJSONSync(filePath, data) {
  atomicWriteSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
  atomicWrite,
  atomicWriteJSON,
  atomicWriteSync,
  atomicWriteJSONSync,
};
