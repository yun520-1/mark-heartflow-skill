/**
 * logger.js — 统一日志模块
 *
 * 替代散落的 console.log / console.warn / console.error 调用，
 * 支持 DEBUG / INFO / WARN / ERROR 四级日志，
 * 通过 LOG_LEVEL 环境变量控制输出级别。
 *
 * 使用方式:
 *   const logger = require('./utils/logger');
 *   logger.debug('module', '调试信息');
 *   logger.info('module', '一般信息');
 *   logger.warn('module', '警告信息');
 *   logger.error('module', '错误信息');
 */

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const LOG_LEVEL = parseInt(process.env.LOG_LEVEL, 10);
const currentLevel = Number.isFinite(LOG_LEVEL) ? LOG_LEVEL : LEVELS.WARN;

function _format(level, module, args) {
  const ts = new Date().toISOString().slice(11, 19);
  const prefix = `${ts} [${level}] [${module}]`;
  const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  return `${prefix} ${message}`;
}

function _log(level, module, ...args) {
  if (level < currentLevel) return;
  const output = _format(level, module, args);
  if (level <= LEVELS.WARN) {
    console.log(output);
  } else {
    console.error(output);
  }
}

const logger = {
  debug: (...args) => _log(LEVELS.DEBUG, ...args),
  info:  (...args) => _log(LEVELS.INFO,  ...args),
  warn:  (...args) => _log(LEVELS.WARN,  ...args),
  error: (...args) => _log(LEVELS.ERROR, ...args),
  LEVELS,
};

module.exports = { logger, LEVELS };
