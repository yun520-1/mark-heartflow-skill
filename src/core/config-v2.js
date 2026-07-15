'use strict';

/**
 * HeartFlow Environment Config Helper (v2)
 *
 * Provides centralized access to HEARTFLOW_* environment variables
 * with safe defaults. This module is intentionally standalone and
 * does not depend on HeartFlowConfig.
 *
 * Usage:
 *   const config = require('./config-v2');
 *   const port = config.getNumber('HEARTFLOW_MCP_PORT', 8099);
 *   const enabled = config.getBool('HEARTFLOW_SMART_UPGRADE_ENABLED', false);
 */

const ENV = process.env;

const DEFAULTS = {
  NODE_ENV: 'development',
  HEARTFLOW_ENV: 'development',
  LOG_LEVEL: 'info',
  // Security defaults (fail-safe)
  HEARTFLOW_MEMORY_BANK_ENCRYPT: 'true',
  HEARTFLOW_CODE_EXECUTOR_ENABLED: 'false',
  HEARTFLOW_PATH_GUARD: 'true',
  // Capability flags
  HEARTFLOW_ENABLE_SELF_MODIFICATION: 'false',
  HEARTFLOW_SMART_UPGRADE_ENABLED: 'false',
  // Performance
  HEARTFLOW_RL_EPSILON: '0.1',
};

function raw(key) {
  const v = ENV[key];
  return v === undefined || v === '' ? DEFAULTS[key] : v;
}

const Config = {
  get(key) {
    return raw(key);
  },
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
  secret(key) {
    const v = raw(key);
    if (!v) throw new Error('[Config] Missing required secret: ' + key);
    return v;
  },
};

module.exports = Config;
