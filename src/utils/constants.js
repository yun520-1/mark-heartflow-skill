/**
 * constants.js — 项目级常量统一管理
 *
 * 所有魔法数字和硬编码值集中在此文件定义，
 * 通过具名常量提升可读性和可维护性。
 */

module.exports = {

  // ─── 时间常量（毫秒）──────────────────────────────────────────
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60000,
  MS_PER_HOUR:   3600000,
  MS_PER_DAY:    86400000,

  // ─── CJK Unicode 范围 ─────────────────────────────────────────
  CJK_UNIFIED_CHINESE: { start: 0x4E00, end: 0x9FFF },
  KATAKANA:            { start: 0x3040, end: 0x30FF },
  HANGUL:              { start: 0xAC00, end: 0xD7AF },
  CJK_RANGES: [
    { name: 'CJK统一汉字', start: 0x4E00, end: 0x9FFF },
    { name: '日文假名',   start: 0x3040, end: 0x30FF },
    { name: '韩文音节',   start: 0xAC00, end: 0xD7AF },
  ],

  // ─── 系统限制 ─────────────────────────────────────────────────
  MAX_GOALS:              100,
  MAX_RECORDS_PER_GOAL:   10000,
  LAZY_CACHE_WARN:        100,
  IDEAL_MODULE_MIN_LINES: 1500,
  IDEAL_MODULE_MAX_LINES: 5000,

  // ─── 代码执行超时（毫秒）─────────────────────────────────────
  CMD_TIMEOUT_MS:           3000,
  PYTHON_CHECK_TIMEOUT_MS:  2000,

  // ─── 缓存 TTL（毫秒）─────────────────────────────────────────
  PROVIDER_HEALTH_TTL_MS: 60000,

  // ─── 文件权限 ─────────────────────────────────────────────────
  FILE_MODE_OWNER_RW: 0o600,
  FILE_MODE_OWNER_RWX: 0o700,

  // ─── 振荡检测窗口（毫秒）─────────────────────────────────────
  OSCILLATION_WINDOW_MS: 60000,

  // ─── 成本窗口大小 ────────────────────────────────────────────
  COST_WINDOW_SIZE: 100,

};
