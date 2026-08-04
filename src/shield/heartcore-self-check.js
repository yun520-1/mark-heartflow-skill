/**
 * heartcore-self-check.js — 核心自检 (v1.0.0)
 *
 * 检查心虫核心模块的健康状态。
 * 接口（被 sleep-wake.js 调用）:
 *   selfCheck() → { ok, checks: [...], version }
 */

const path = require('path');

function selfCheck() {
  const root = path.resolve(__dirname, '..');
  const checks = [];
  const fs = require('fs');

  // 1. 核心入口存在
  const coreEntry = path.join(root, 'core', 'heartflow.js');
  checks.push({
    name: 'core_entry',
    ok: fs.existsSync(coreEntry),
    detail: fs.existsSync(coreEntry) ? 'heartflow.js 存在' : 'heartflow.js 缺失',
  });

  // 2. 版本文件
  const versionFile = path.join(root, '..', 'VERSION');
  let version = 'unknown';
  try {
    if (fs.existsSync(versionFile)) version = fs.readFileSync(versionFile, 'utf-8').trim();
    checks.push({ name: 'version_file', ok: version !== 'unknown', detail: `VERSION=${version}` });
  } catch (e) {
    checks.push({ name: 'version_file', ok: false, detail: e.message });
  }

  // 3. 心跳模块
  const heartbeat = path.join(root, 'core', 'heartbeat.js');
  checks.push({
    name: 'heartbeat',
    ok: fs.existsSync(heartbeat),
    detail: fs.existsSync(heartbeat) ? 'heartbeat.js 存在' : 'heartbeat.js 缺失',
  });

  // 4. 内存目录可写
  const memoryDir = path.join(root, 'memory');
  let memoryWritable = false;
  try {
    if (fs.existsSync(memoryDir)) {
      fs.accessSync(memoryDir, fs.constants.W_OK);
      memoryWritable = true;
    }
  } catch (e) { memoryWritable = false; }
  checks.push({ name: 'memory_writable', ok: memoryWritable, detail: memoryWritable ? 'memory/ 可写' : 'memory/ 不可写' });

  const allOk = checks.every(c => c.ok);
  return { ok: allOk, checks, version, checkedAt: new Date().toISOString() };
}

module.exports = { selfCheck };
