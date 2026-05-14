"use strict";
/**
 * HEARTCORE v2 — Health Check
 * Continuous health monitoring of all running subsystems
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthCheck = void 0;
exports.builtinMemoryHealth = builtinMemoryHealth;
exports.builtinUptimeHealth = builtinUptimeHealth;
exports.getHealthCheck = getHealthCheck;
// ─── HealthCheck orchestrator ────────────────────────────────
class HealthCheck {
    _checks = new Map();
    _lastResults = new Map();
    _failureThreshold = 3; // consecutive failures before critical
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
    /** Run a single subsystem check by name */
    async checkOne(name) {
        const fn = this._checks.get(name);
        if (!fn)
            return null;
        try {
            const result = await Promise.resolve(fn());
            // On success, reset consecutiveFailures to 0
            const prev = this._lastResults.get(name);
            const prevFailures = prev?.consecutiveFailures ?? 0;
            if (result && typeof result === 'object') {
                result.consecutiveFailures = 0;
                this._lastResults.set(name, result);
                return result;
            }
            else if (prevFailures > 0) {
                // Result is not an object but we had failures — update cached entry
                const reset = {
                    name,
                    level: 'healthy',
                    message: prev?.message ?? 'ok',
                    lastCheck: Date.now(),
                    consecutiveFailures: 0,
                };
                this._lastResults.set(name, reset);
                return reset;
            }
            // Result is healthy scalar, nothing to update
            return null;
        }
        catch (e) {
            const consecutiveFailures = (this._lastResults.get(name)?.consecutiveFailures ?? 0) + 1;
            const level = consecutiveFailures >= this._failureThreshold ? 'critical' : 'warning';
            const failed = {
                name,
                level,
                message: e?.message ?? String(e),
                lastCheck: Date.now(),
                consecutiveFailures,
            };
            this._lastResults.set(name, failed);
            return failed;
        }
    }
    /** Run all registered health checks */
    async runAll(heartbeatMetrics) {
        const results = [];
        for (const [name] of this._checks) {
            const r = await this.checkOne(name);
            if (r)
                results.push(r);
        }
        const overall = this._computeOverall(results);
        const restartRecommended = overall === 'critical';
        return {
            timestamp: Date.now(),
            overall,
            subsystems: results,
            heartbeat: heartbeatMetrics,
            restartRecommended,
        };
    }
    /** Get cached results from last run */
    getLastResults() {
        return new Map(this._lastResults);
    }
    // ─── Internal ─────────────────────────────────────────────
    _computeOverall(subsystems) {
        if (subsystems.some(s => s.level === 'critical'))
            return 'critical';
        if (subsystems.some(s => s.level === 'warning'))
            return 'warning';
        return 'healthy';
    }
}
exports.HealthCheck = HealthCheck;
// ─── Built-in checks ────────────────────────────────────────
function builtinMemoryHealth() {
    const start = Date.now();
    try {
        // Simulate memory pressure check
        const used = process?.memoryUsage?.()?.heapUsed ?? 0;
        const total = process?.memoryUsage?.()?.heapTotal ?? 1;
        const ratio = used / total;
        return {
            name: 'memory',
            level: ratio > 0.9 ? 'critical' : ratio > 0.75 ? 'warning' : 'healthy',
            message: `heap ${Math.round(ratio * 100)}% used`,
            latencyMs: Date.now() - start,
            lastCheck: Date.now(),
            consecutiveFailures: 0,
        };
    }
    catch {
        return {
            name: 'memory',
            level: 'warning',
            message: 'memory info unavailable (non-node env)',
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
        level: hours > 168 ? 'warning' : 'healthy', // warn after 7 days
        message: `uptime ${hours.toFixed(1)}h`,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
    };
}
// ─── Default singleton ─────────────────────────────────────
let _defaultHealth = null;
function getHealthCheck() {
    if (!_defaultHealth) {
        _defaultHealth = new HealthCheck();
        _defaultHealth.register('memory', builtinMemoryHealth);
    }
    return _defaultHealth;
}
//# sourceMappingURL=health-check.js.map