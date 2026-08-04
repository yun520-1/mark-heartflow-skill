/**
 * infra/logger.js — 统一日志工具 (v1.0.0)
 *
 * 轻量日志封装，支持级别过滤 + 可选文件输出。
 * 接口（被 layer-bus.js 调用）:
 *   makeLogger(levelFn) → { debug, info, warn, error }
 */

function makeLogger(levelFn) {
  const getLevel = typeof levelFn === 'function' ? levelFn : () => (process.env.LOG_LEVEL || 'info');
  const levels = { debug: 10, info: 20, warn: 30, error: 40 };

  function shouldLog(method) {
    const current = levels[getLevel()] ?? levels.info;
    return levels[method] >= current;
  }

  function format(method, msg, meta) {
    const ts = new Date().toISOString();
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    return `[${ts}] [${method.toUpperCase()}] ${msg}${metaStr}`;
  }

  return {
    debug(msg, meta) { if (shouldLog('debug')) console.debug(format('debug', msg, meta)); },
    info(msg, meta) { if (shouldLog('info')) console.info(format('info', msg, meta)); },
    warn(msg, meta) { if (shouldLog('warn')) console.warn(format('warn', msg, meta)); },
    error(msg, meta) { if (shouldLog('error')) console.error(format('error', msg, meta)); },
  };
}

module.exports = { makeLogger };
