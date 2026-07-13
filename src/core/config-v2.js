'use strict';
/**
 * reference-impl/config.js
 * 集中配置模块 —— 修复质控红线 R5 / 瓶颈 B5（59 处 process.env 散读，含 3 个密钥）。
 * 用法：业务代码一律 `const { get, getBool, secret } = require('./config')`，禁止直接读 process.env。
 * 安全默认：加密默认开、沙箱默认关（满足安全门禁 R8）。
 */
const ENV = process.env;

const DEFAULTS = {
  NODE_ENV: 'development',
  HEARTFLOW_ENV: 'development',
  LOG_LEVEL: 'info',
  // ── 安全默认（fail-safe）──
  HEARTFLOW_MEMORY_BANK_ENCRYPT: 'true',     // 存储加密：默认开
  HEARTFLOW_CODE_EXECUTOR_ENABLED: 'false',  // 代码沙箱：默认关
  HEARTFLOW_PATH_GUARD: 'true',              // 路径守卫：默认开
  // ── 能力开关 ──
  HEARTFLOW_ENABLE_SELF_MODIFICATION: 'false',
  HEARTFLOW_SMART_UPGRADE_ENABLED: 'false',
  // ── 性能 ──
  HEARTFLOW_RL_EPSILON: '0.1',
};

function raw(key) {
  const v = ENV[key];
  return v === undefined || v === '' ? DEFAULTS[key] : v;
}

const Config = {
  get: raw,
  getBool(key, dflt = false) {
    const v = raw(key);
    if (v === undefined) return dflt;
    return v === 'true' || v === '1';
  },
  getNumber(key, dflt = 0) {
    const v = raw(key);
    if (v === undefined || v === '') return dflt;
    const n = Number(v);
    return Number.isFinite(n) ? n : dflt;
  },
  isProd() {
    return raw('NODE_ENV') === 'production' || raw('HEARTFLOW_ENV') === 'production';
  },
  /** 密钥统一经此读取；缺失即抛错，绝不静默降级（修复 AES 静默明文问题）。 */
  secret(key) {
    const v = raw(key);
    if (!v) throw new Error(`[Config] 缺失必需密钥: ${key}`);
    return v;
  },
};

module.exports = Config;
