'use strict';
/**
 * reference-impl/logger.js
 * 结构化日志 —— 修复质控红线 R6 / 瓶颈 B7（116 处 console.log 进生产代码）。
 * 用法：const { makeLogger } = require('./logger'); const log = makeLogger(() => Config.get('LOG_LEVEL'));
 * 生产环境输出 JSON 行，可后续接 transports（文件 / OpenTelemetry）。
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function makeLogger(getLevel, opts = {}) {
  const minLevel = () => LEVELS[getLevel && getLevel()] ?? LEVELS.info;
  function emit(level, msg, meta) {
    if (LEVELS[level] < minLevel()) return;
    const entry = {
      t: new Date().toISOString(),
      level,
      msg,
      ...(meta ? { meta } : {}),
    };
    // 错误级别写 stderr，便于日志系统分流；其余写 stdout。
    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  }
  return {
    debug: (m, meta) => emit('debug', m, meta),
    info: (m, meta) => emit('info', m, meta),
    warn: (m, meta) => emit('warn', m, meta),
    error: (m, meta) => emit('error', m, meta),
  };
}

module.exports = { makeLogger, LEVELS };
