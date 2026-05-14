/**
 * HEARTCORE v2 — Health Check
 * Source: ~/.heartflow/HEARTCORE/health-check.ts
 */

'use strict';

const DEFAULT_FAILURE_THRESHOLD = 3;

function builtinMemoryHealth() {
  const start = Date.now();
  try {
    const mem = process?.memoryUsage?.() ?? {};
    const used = mem.heapUsed ?? 0;
    const total = mem.heapTotal ?? 1;
    const ratio = used / total;
    return {
      name: 'memory',
      level: ratio > 0.9 ? 'critical' : ratio > 0.75 ? 'warning' : 'healthy',
      message: `heap ${Math.round(ratio * 100)}% used`,
      latencyMs: Date.now() - start,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
    };
  } catch {
    return {
      name: 'memory',
      level: 'warning',
      message: 'memory info unavailable',
      latencyMs: Date.now() - start,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
    };
  }
}

function builtinUptimeHealth(startedAt) {
  const uptimeMs = Date.now() - startedAt;
  const hours = uptimeMs / 3_600_000;
  return {
    name: 'uptime',
    level: hours > 168 ? 'warning' : 'healthy',
    message: `uptime ${hours.toFixed(1)}h`,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
  };
}

class HealthCheck {
  constructor() {
    this._checks = new Map();
    this._lastResults = new Map();
    this._failureThreshold = DEFAULT_FAILURE_THRESHOLD;
  }

  register(name, fn) {
    this._checks.set(name, fn);
    return this;
  }

  unregister(name) {
    return this._checks.delete(name);
  }

  setFailureThreshold(n) {
    this._failureThreshold = n;
    return this;
  }

  async checkOne(name) {
    const fn = this._checks.get(name);
    if (!fn) return null;
    try {
      const result = await Promise.resolve(fn());
      this._lastResults.set(name, result);
      return result;
    } catch (e) {
      const prevFailures = this._lastResults.get(name)?.consecutiveFailures ?? 0;
      const consecutiveFailures = prevFailures + 1;
      const failed = {
        name,
        level: consecutiveFailures >= this._failureThreshold ? 'critical' : 'warning',
        message: e?.message ?? String(e),
        lastCheck: Date.now(),
        consecutiveFailures,
      };
      this._lastResults.set(name, failed);
      return failed;
    }
  }

  async runAll(heartbeatMetrics) {
    const results = [];
    for (const [name] of this._checks) {
      const r = await this.checkOne(name);
      if (r) results.push(r);
    }

    const overall = this._computeOverall(results);
    return {
      timestamp: Date.now(),
      overall,
      subsystems: results,
      heartbeat: heartbeatMetrics,
      restartRecommended: overall === 'critical',
    };
  }

  getLastResults() {
    return new Map(this._lastResults);
  }

  _computeOverall(subsystems) {
    if (subsystems.some(s => s.level === 'critical')) return 'critical';
    if (subsystems.some(s => s.level === 'warning')) return 'warning';
    return 'healthy';
  }
}

let _defaultHealth = null;
function getHealthCheck() {
  if (!_defaultHealth) {
    _defaultHealth = new HealthCheck();
    _defaultHealth.register('memory', builtinMemoryHealth);
  }
  return _defaultHealth;
}

module.exports = { HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth };
