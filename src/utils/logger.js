/**
 * logger.js — 分级日志工具
 * 
 * 提供 trace/debug/info/warn/error 四级日志，生产环境可通过 LOG_LEVEL 过滤。
 * 所有日志带时间戳和级别标识，输出到 stderr（不影响 stdout 数据流）。
 * 
 * @version v0.13.7
 */

'use strict';

const LOG_LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4 };
const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const isColor = process.stderr.isTTY;
const RESET = isColor ? '\x1b[0m' : '';
const RED = isColor ? '\x1b[31m' : '';
const YELLOW = isColor ? '\x1b[33m' : '';
const BLUE = isColor ? '\x1b[36m' : '';

function format(level, msg, meta) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = `${ts} [${level.toUpperCase()}]`;
  if (meta) {
    return `${prefix} ${msg} ${JSON.stringify(meta)}`;
  }
  return `${prefix} ${msg}`;
}

const logger = {
  trace(msg, meta) {
    if (currentLevel <= LOG_LEVELS.trace) {
      console.error(`${BLUE}${format('trace', msg, meta)}${RESET}`);
    }
  },
  debug(msg, meta) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.error(`${BLUE}${format('debug', msg, meta)}${RESET}`);
    }
  },
  info(msg, meta) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.error(`${format('info', msg, meta)}`);
    }
  },
  warn(msg, meta) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.error(`${YELLOW}${format('warn', msg, meta)}${RESET}`);
    }
  },
  error(msg, meta) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(`${RED}${format('error', msg, meta)}${RESET}`);
    }
  },
};

module.exports = logger;
