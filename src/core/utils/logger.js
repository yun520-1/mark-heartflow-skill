/**
 * Logger — 简单日志工具
 * @version v0.12.50
 */
'use strict';

class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
  }
  _log(level, ...args) {
    if (this.levels[level] >= this.levels[this.level]) {
      const ts = new Date().toISOString().slice(0, 19);
      const fn = level === 'debug' ? 'log' : level;
      console[fn](`[${ts}] [${level.toUpperCase()}]`, ...args);
    }
  }
  debug(...a) { this._log('debug', ...a); }
  info(...a)  { this._log('info', ...a); }
  warn(...a)  { this._log('warn', ...a); }
  error(...a) { this._log('error', ...a); }
}

module.exports = { Logger };
