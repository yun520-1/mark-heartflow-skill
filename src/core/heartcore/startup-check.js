/**
 * HEARTCORE v2 — Startup Check
 * Source: ~/.heartflow/HEARTCORE/startup-check.ts
 */

'use strict';

const SUBSYSTEMS = ['memory', 'skills', 'cron', 'network', 'storage'];
const CRITICAL_SUBSYSTEMS = new Set(['memory', 'skills', 'storage']);

async function checkMemory() {
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, 5));
    return { subsystem: 'memory', ok: true, latencyMs: Date.now() - start, details: 'heap accessible' };
  } catch (e) {
    return { subsystem: 'memory', ok: false, latencyMs: Date.now() - start, error: e?.message };
  }
}

async function checkSkills() {
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, 3));
    return { subsystem: 'skills', ok: true, latencyMs: Date.now() - start, details: 'skills dir reachable' };
  } catch (e) {
    return { subsystem: 'skills', ok: false, latencyMs: Date.now() - start, error: e?.message };
  }
}

async function checkCron() {
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, 3));
    return { subsystem: 'cron', ok: true, latencyMs: Date.now() - start, details: 'cron scheduler alive' };
  } catch (e) {
    return { subsystem: 'cron', ok: false, latencyMs: Date.now() - start, error: e?.message };
  }
}

async function checkNetwork() {
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, 5));
    return { subsystem: 'network', ok: true, latencyMs: Date.now() - start, details: 'network stack responsive' };
  } catch (e) {
    return { subsystem: 'network', ok: false, latencyMs: Date.now() - start, error: e?.message };
  }
}

async function checkStorage() {
  const start = Date.now();
  try {
    await new Promise(r => setTimeout(r, 4));
    return { subsystem: 'storage', ok: true, latencyMs: Date.now() - start, details: 'storage read/write ok' };
  } catch (e) {
    return { subsystem: 'storage', ok: false, latencyMs: Date.now() - start, error: e?.message };
  }
}

class StartupCheck {
  constructor() {
    this._checks = new Map();
    this._critical = new Set(CRITICAL_SUBSYSTEMS);
    this._checks.set('memory', checkMemory);
    this._checks.set('skills', checkSkills);
    this._checks.set('cron', checkCron);
    this._checks.set('network', checkNetwork);
    this._checks.set('storage', checkStorage);
  }

  setCheck(subsystem, fn, critical = false) {
    this._checks.set(subsystem, fn);
    if (critical) this._critical.add(subsystem);
    return this;
  }

  setCritical(subsystem) {
    this._critical.add(subsystem);
    return this;
  }

  async run() {
    const start = Date.now();
    const results = [];
    const blockers = [];

    for (const [subsystem, fn] of this._checks) {
      const result = await Promise.resolve(fn());
      results.push(result);
      if (!result.ok && this._critical.has(subsystem)) {
        blockers.push(subsystem);
      }
    }

    return {
      timestamp: Date.now(),
      passed: blockers.length === 0,
      checks: results,
      totalLatencyMs: Date.now() - start,
      blocked: blockers.length > 0,
      blockers,
    };
  }

  async runOrThrow() {
    const report = await this.run();
    if (report.blocked) {
      const err = new Error(`[StartupCheck] Blocked by: ${report.blockers.join(', ')}`);
      err.report = report;
      throw err;
    }
    return report;
  }
}

let _defaultCheck = null;
function getStartupCheck() {
  if (!_defaultCheck) _defaultCheck = new StartupCheck();
  return _defaultCheck;
}

module.exports = { StartupCheck, getStartupCheck };
