/**
 * AtomicWrite — 原子写入工具
 * 
 * 先写临时文件，再 rename，保证：
 * 1. 写入过程中崩溃不会损坏原文件
 * 2. rename 是操作系统级原子操作
 * 
 * 使用方式:
 *   const { atomicWrite } = require('./utils/atomic-write');
 *   await atomicWrite('/path/to/file.json', JSON.stringify(data));
 */
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function atomicWrite(filePath, content, options = {}) {
  const dir = path.dirname(filePath);
  const tmpName = `.${path.basename(filePath)}.${process.pid}.tmp`;
  const tmpPath = path.join(dir, tmpName);

  try {
    // 1. 写入临时文件
    await fs.writeFile(tmpPath, content, { mode: options.mode || 0o644 });
    // 2. 原子 rename（覆盖原文件）
    await fs.rename(tmpPath, filePath);
  } catch (err) {
    // 清理临时文件（如果存在）
    try { await fs.unlink(tmpPath); } catch { /* ignore */ }
    throw err;
  }
}

module.exports = { atomicWrite };
