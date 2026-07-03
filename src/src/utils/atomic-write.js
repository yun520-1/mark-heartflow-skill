/**
 * AtomicWrite — 原子写入工具 v2.0
 *
 * 先写临时文件，再 rename，保证：
 * 1. 写入过程中崩溃不会损坏原文件
 * 2. rename 是操作系统级原子操作
 *
 * v2.0 增强：
 * - ErrorType 枚举 + 错误分类
 * - 指数退避自动重试（最多3次）
 * - 多路径回退（同目录→tmp→home→stderr）
 * - 写入后读取验证（verifyRead）
 * - 原子 JSON 写（atomicWriteJson）
 * - 批量操作（batchAtomicWrite）
 * - 备份/版本化（writeWithBackup）
 * - 统计追踪
 * - 结构化 WriteResult
 *
 * 使用方式:
 *   const { atomicWrite, atomicWriteJson, batchAtomicWrite } = require('./utils/atomic-write');
 *   await atomicWrite('/path/to/file.json', JSON.stringify(data));
 *   await atomicWriteJson('/path/to/file.json', data);
 */
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// ========== 错误类型枚举 ==========

const ErrorType = {
  WRITE_ERROR: 'WRITE_ERROR',
  RENAME_ERROR: 'RENAME_ERROR',
  VERIFY_ERROR: 'VERIFY_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  BACKUP_ERROR: 'BACKUP_ERROR',
  DIRECTORY_ERROR: 'DIRECTORY_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  DISK_FULL: 'DISK_FULL',
  UNKNOWN: 'UNKNOWN',
};

// ========== 错误分类 ==========

function classifyError(err) {
  if (!err) return ErrorType.UNKNOWN;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();

  if (code === 'eisdir' || code === 'enotdir') return ErrorType.DIRECTORY_ERROR;
  if (code === 'eacces' || code === 'eperm') return ErrorType.PERMISSION_ERROR;
  if (code === 'enospc') return ErrorType.DISK_FULL;
  if (code === 'eexist') return ErrorType.WRITE_ERROR;
  if (code === 'enoent') return ErrorType.DIRECTORY_ERROR;

  if (msg.includes('permission') || msg.includes('access')) return ErrorType.PERMISSION_ERROR;
  if (msg.includes('disk') || msg.includes('space') || msg.includes('quota')) return ErrorType.DISK_FULL;
  if (msg.includes('invalid') || msg.includes('path') || msg.includes('argument')) return ErrorType.INVALID_INPUT;
  if (msg.includes('rename')) return ErrorType.RENAME_ERROR;
  if (msg.includes('verify') || msg.includes('mismatch')) return ErrorType.VERIFY_ERROR;

  return ErrorType.UNKNOWN;
}

// ========== 重试策略 ==========

function getRetryDelay(attempt) {
  // 指数退避：100ms → 300ms → 700ms（含 0-50% 抖动）
  const base = [100, 200, 400][attempt] || 800;
  const jitter = 1 + (Math.random() * 0.5);
  return Math.round(base * jitter);
}

function shouldRetry(errorType, attempt) {
  if (attempt >= 3) return false; // 最多重试 3 次
  // 不可重试的错误：输入无效、路径错误、磁盘满、权限不足
  if (errorType === ErrorType.INVALID_INPUT) return false;
  if (errorType === ErrorType.DIRECTORY_ERROR) return false;
  if (errorType === ErrorType.DISK_FULL) return false;
  if (errorType === ErrorType.PERMISSION_ERROR) return false;
  return true; // 可重试：WRITE_ERROR, RENAME_ERROR, VERIFY_ERROR, UNKNOWN
}

// ========== 回退路径生成 ==========

function getFallbackPaths(originalPath) {
  const dir = path.dirname(originalPath);
  const base = path.basename(originalPath);
  const fallbacks = [];

  // 1. 同目录备用名
  fallbacks.push(path.join(dir, `.${base}.fallback`));

  // 2. 系统临时目录
  fallbacks.push(path.join(os.tmpdir(), `heartflow-${base}`));

  // 3. 用户 home 目录
  try {
    const home = os.homedir();
    if (home) fallbacks.push(path.join(home, `.heartflow-fallback-${base}`));
  } catch { /* 忽略 */ }

  return fallbacks;
}

// ========== 写入后验证 ==========

async function verifyWrite(filePath, expectedContent) {
  try {
    const actual = await fs.readFile(filePath, 'utf8');
    if (actual !== expectedContent) {
      return { ok: false, reason: 'content_mismatch', expectedLen: expectedContent.length, actualLen: actual.length };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: 'read_failed', error: err.message };
  }
}

// ========== 备份 ==========

async function createBackup(filePath) {
  try {
    await fs.access(filePath, fsSync.constants.F_OK);
    const backupPath = filePath + '.bak';
    await fs.copyFile(filePath, backupPath);
    return { ok: true, backupPath };
  } catch (err) {
    if (err.code === 'ENOENT') return { ok: true, backupPath: null, note: 'no_original' };
    return { ok: false, error: err.message };
  }
}

// ========== 核心原子写入函数 ==========

async function atomicWrite(filePath, content, options = {}) {
  const {
    mode = 0o644,
    encoding = 'utf8',
    retry = true,
    verifyWrite = false,
    createBackup: doBackup = false,
    maxRetries = 3,
  } = options;

  // 参数验证
  if (!filePath || typeof filePath !== 'string') {
    const err = new Error('filePath must be a non-empty string');
    err.result = { ok: false, error: 'filePath must be a non-empty string', errorType: ErrorType.INVALID_INPUT, attempts: 0 };
    if (options.throw !== false) throw err;
    return err.result;
  }
  if (content === undefined || content === null) {
    const err = new Error('content cannot be null/undefined');
    err.result = { ok: false, error: 'content cannot be null/undefined', errorType: ErrorType.INVALID_INPUT, attempts: 0 };
    if (options.throw !== false) throw err;
    return err.result;
  }

  const stringContent = typeof content === 'string' ? content : String(content);

  const dir = path.dirname(filePath);
  const randSuffix = crypto.randomBytes(4).toString('hex');
  const tmpName = `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${randSuffix}.tmp`;
  const tmpPath = path.join(dir, tmpName);

  let lastError = null;
  let attemptStats = [];

  // 可选：写入前备份
  let backupResult = null;
  if (doBackup) {
    backupResult = await createBackup(filePath);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 确保目录存在
      await fs.mkdir(dir, { recursive: true });

      // 1. 写入临时文件
      await fs.writeFile(tmpPath, stringContent, { mode, encoding });

      // 2. 原子 rename（覆盖原文件）
      await fs.rename(tmpPath, filePath);

      // 3. 可选验证
      if (verifyWrite) {
        const vResult = await verifyWrite(filePath, stringContent);
        if (!vResult.ok) {
          const errType = ErrorType.VERIFY_ERROR;
          attemptStats.push({ attempt, error: vResult.reason, errorType: errType });
          if (retry && shouldRetry(errType, attempt)) {
            const delay = getRetryDelay(attempt);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
          _stats.failures++;
          const vErrMsg = `Verify failed: ${vResult.reason}`;
          const vErrResult = {
            ok: false,
            error: vErrMsg,
            errorType: errType,
            path: filePath,
            backupPath: backupResult?.backupPath || null,
            attempts: attemptStats,
            totalAttempts: attemptStats.length,
          };
          if (options.throw !== false) {
            const err = new Error(vErrMsg);
            err.result = vErrResult;
            throw err;
          }
          return vErrResult;
        }
      }

      // 成功
      _stats.writes++;
      return {
        ok: true,
        path: filePath,
        backupPath: backupResult?.backupPath || null,
        attempts: attemptStats,
        totalAttempts: attemptStats.length,
      };
    } catch (err) {
      lastError = err;
      const errType = classifyError(err);
      attemptStats.push({ attempt, error: err.message, errorType: errType });

      // 清理临时文件
      try { await fs.unlink(tmpPath); } catch { /* 最佳努力 */ }

      if (retry && shouldRetry(errType, attempt)) {
        _stats.retries++;
        const delay = getRetryDelay(attempt);
        await new Promise(r => setTimeout(r, delay));
      } else if (attempt < maxRetries) {
        // 非重试错误但还没到 maxRetries — 尝试回退路径
        const fallbacks = getFallbackPaths(filePath);
        for (const fallbackPath of fallbacks) {
          try {
            const fbDir = path.dirname(fallbackPath);
            await fs.mkdir(fbDir, { recursive: true });
            const fbTmp = `.${path.basename(fallbackPath)}.${process.pid}.tmp`;
            const fbTmpPath = path.join(fbDir, fbTmp);
            await fs.writeFile(fbTmpPath, stringContent, { mode, encoding });
            await fs.rename(fbTmpPath, fallbackPath);
            _stats.fallbackWrites++;
            _stats.writes++;
            return {
              ok: true,
              path: fallbackPath,
              fallback: true,
              originalPath: filePath,
              backupPath: backupResult?.backupPath || null,
              error: `Original path failed (${errType}), wrote to fallback`,
              attempts: attemptStats,
              totalAttempts: attemptStats.length,
            };
          } catch { /* 继续尝试下一个回退路径 */ }
        }
        break; // 所有回退路径都失败
      } else {
        break; // 已达最大重试次数
      }
    }
  }

  _stats.failures++;
  const errMsg = `All ${attemptStats.length} attempts failed. Last: ${lastError ? lastError.message : 'unknown'}`;
  const errResult = {
    ok: false,
    error: errMsg,
    errorType: classifyError(lastError),
    path: filePath,
    backupPath: backupResult?.backupPath || null,
    attempts: attemptStats,
    totalAttempts: attemptStats.length,
  };
  // 向后兼容：旧调用者依赖 throw
  if (options.throw !== false) {
    const err = new Error(errMsg);
    err.result = errResult;
    throw err;
  }
  return errResult;
}

// ========== 原子 JSON 写 ==========

async function atomicWriteJson(filePath, data, options = {}) {
  const content = JSON.stringify(data, null, options.pretty !== false ? 2 : undefined);
  return atomicWrite(filePath, content, options);
}

// ========== 批量原子写入 ==========

async function batchAtomicWrite(files, options = {}) {
  // files: [{ path, content, json: false }]
  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, error: 'files must be a non-empty array', errorType: ErrorType.INVALID_INPUT };
  }

  // Phase 1: 创建所有目标文件的备份（用于回滚）
  const backups = [];
  for (const file of files) {
    try {
      const exists = await fs.access(file.path).then(() => true).catch(() => false);
      if (exists) {
        const backupContent = await fs.readFile(file.path, 'utf8');
        backups.push({ path: file.path, content: backupContent, hadFile: true });
      } else {
        backups.push({ path: file.path, hadFile: false });
      }
    } catch {
      backups.push({ path: file.path, hadFile: false });
    }
  }

  // Phase 2: 逐个写入
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let failed = false;

  for (const file of files) {
    if (failed) {
      results.push({ ok: false, name: file.name || path.basename(file.path), skipped: true });
      failCount++;
      continue;
    }
    let result;
    try {
      if (file.json) {
        result = await atomicWriteJson(file.path, file.data, options);
      } else {
        result = await atomicWrite(file.path, file.content, options);
      }
    } catch (e) {
      result = { ok: false, error: e.message };
    }
    results.push({ ...result, name: file.name || path.basename(file.path) });
    if (result.ok) successCount++;
    else { failCount++; failed = true; }
  }

  // Phase 3: 如果有失败，回滚所有已成功的写入
  if (failCount > 0) {
    for (const backup of backups) {
      try {
        if (backup.hadFile) {
          await fs.writeFile(backup.path, backup.content, 'utf8');
        } else {
          await fs.unlink(backup.path).catch(() => {});
        }
      } catch { /* 回滚尽力而为 */ }
    }
  }

  return {
    ok: failCount === 0,
    results,
    summary: { total: files.length, success: successCount, fail: failCount },
    rolledBack: failCount > 0,
  };
}

// ========== 写入带备份 + 版本化 ==========

async function writeWithBackup(filePath, content, options = {}) {
  const { maxBackups = 5, ...rest } = options;

  // 1. 创建轮转备份
  try {
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);

    // 检查原文件是否存在
    await fs.access(filePath, fsSync.constants.F_OK);

    // 轮转备份：.bak.N 后缀，N 越大越旧
    // 先删除最旧的备份
    try {
      await fs.unlink(path.join(dir, `${base}.bak.${maxBackups}`));
    } catch { /* 可能不存在 */ }

    // 逐个后移
    for (let i = maxBackups - 1; i >= 1; i--) {
      const oldBak = path.join(dir, `${base}.bak.${i}`);
      const newBak = path.join(dir, `${base}.bak.${i + 1}`);
      try {
        await fs.rename(oldBak, newBak);
      } catch { /* 跳过不存在的 */ }
    }

    // 最新备份
    await fs.copyFile(filePath, path.join(dir, `${base}.bak.1`));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      _stats.backupFailures++;
    }
  }

  // 2. 执行原子写入
  return atomicWrite(filePath, content, { ...rest, createBackup: false });
}

// ========== 统计追踪 ==========

const _stats = {
  writes: 0,
  retries: 0,
  failures: 0,
  fallbackWrites: 0,
  backupFailures: 0,
  startTime: Date.now(),
};

function getStats() {
  const elapsed = Date.now() - _stats.startTime;
  return {
    ..._stats,
    uptimeMs: elapsed,
    successRate: _stats.writes > 0
      ? ((_stats.writes - _stats.failures) / _stats.writes * 100).toFixed(1) + '%'
      : '0%',
    fallbackRate: _stats.writes > 0
      ? (_stats.fallbackWrites / _stats.writes * 100).toFixed(1) + '%'
      : '0%',
  };
}

function resetStats() {
  _stats.writes = 0;
  _stats.retries = 0;
  _stats.failures = 0;
  _stats.fallbackWrites = 0;
  _stats.backupFailures = 0;
  _stats.startTime = Date.now();
}

// ========== 兼容旧接口 ==========
// 保持原函数签名兼容，同时返回 WriteResult 对象
// 调用方检查 .ok 或 catch 均可

module.exports = {
  atomicWrite,
  atomicWriteJson,
  batchAtomicWrite,
  writeWithBackup,
  classifyError,
  getRetryDelay,
  verifyWrite,
  createBackup,
  getFallbackPaths,
  getStats,
  resetStats,
  ErrorType,
};
