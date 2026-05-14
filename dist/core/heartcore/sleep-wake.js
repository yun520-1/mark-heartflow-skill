"use strict";
/**
 * HEARTCORE v2 — Sleep & Wake Lifecycle
 * Manages dormancy periods and graceful reactivation
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SleepWake = void 0;
exports.getSleepWake = getSleepWake;
const DEFAULT_CONFIG = {
    idleTimeoutMs: 30 * 60 * 1000,
    maxDormantMs: 8 * 3600 * 1000,
    minDormantMs: 5_000,
    enableAutoSleep: true,
};
// ─── SleepWake manager ───────────────────────────────────────
class SleepWake {
    _phase = 'awake';
    _config;
    _dormancyLog = [];
    _idleTimer = null;
    _maxSleepTimer = null;
    _lastActivity = Date.now();
    _listeners = [];
    constructor(config = {}) {
        this._config = { ...DEFAULT_CONFIG, ...config };
    }
    // ─── Public API ────────────────────────────────────────────
    get phase() { return this._phase; }
    get config() { return this._config; }
    get lastActivity() { return this._lastActivity; }
    /** Report user/system activity to reset idle timer */
    touch() {
        this._lastActivity = Date.now();
        if (this._phase === 'awake' && this._config.enableAutoSleep) {
            this._resetIdleTimer();
        }
    }
    /** Explicitly request sleep */
    sleep(reason = 'manual') {
        if (this._phase !== 'awake')
            return false;
        return this._enterDormant(reason);
    }
    /** Explicitly request wake-up */
    wake(reason = 'manual') {
        if (this._phase === 'awake' || this._phase === 'waking')
            return false;
        if (this._phase === 'sleeping') {
            // Allow wake from intermediate sleeping phase (move directly to dormant)
            this._phase = 'dormant';
            this._notify('dormant', reason);
        }
        if (this._phase !== 'dormant')
            return false;
        return this._enterAwake(reason);
    }
    /** Override idle timeout */
    setIdleTimeout(ms) {
        this._config.idleTimeoutMs = ms;
        this._resetIdleTimer();
        return this;
    }
    /** Disable/enable auto-sleep */
    setAutoSleep(enabled) {
        this._config.enableAutoSleep = enabled;
        if (enabled && this._phase === 'awake')
            this._resetIdleTimer();
        else if (!enabled)
            this._cancelIdleTimer();
        return this;
    }
    /** Subscribe to phase changes */
    onPhaseChange(fn) {
        this._listeners.push(fn);
        return () => { this._listeners = this._listeners.filter(l => l !== fn); };
    }
    /** Get recent dormancy history */
    getDormancyLog(limit = 10) {
        return this._dormancyLog.slice(-limit);
    }
    /** Start the auto-sleep timer (call once on init) */
    start() {
        if (this._config.enableAutoSleep)
            this._resetIdleTimer();
    }
    /** Stop all timers */
    stop() {
        this._cancelIdleTimer();
        this._cancelMaxSleepTimer();
    }
    // ─── Internal ─────────────────────────────────────────────
    _resetIdleTimer() {
        this._cancelIdleTimer();
        this._idleTimer = setTimeout(() => {
            if (Date.now() - this._lastActivity >= this._config.idleTimeoutMs) {
                this._enterDormant('idle');
            }
        }, this._config.idleTimeoutMs);
    }
    _cancelIdleTimer() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
            this._idleTimer = null;
        }
    }
    _setMaxSleepTimer() {
        this._cancelMaxSleepTimer();
        this._maxSleepTimer = setTimeout(() => {
            // Force wake after max dormant time
            this._enterAwake('timer');
        }, this._config.maxDormantMs);
    }
    _cancelMaxSleepTimer() {
        if (this._maxSleepTimer) {
            clearTimeout(this._maxSleepTimer);
            this._maxSleepTimer = null;
        }
    }
    _enterDormant(reason) {
        this._phase = 'sleeping';
        this._notify('sleeping', reason);
        // Use setTimeout(0) to defer state change to next tick
        setTimeout(() => {
            this._phase = 'dormant';
            this._dormancyLog.push({ sleepReason: reason, sleptAt: Date.now() });
            this._notify('dormant', reason);
            this._setMaxSleepTimer();
        }, this._config.minDormantMs);
        this._cancelIdleTimer();
        return true;
    }
    _enterAwake(reason) {
        this._phase = 'waking';
        this._notify('waking', reason);
        // Record previous dormancy
        const log = this._dormancyLog;
        if (log.length > 0) {
            const last = log[log.length - 1];
            if (last.wokeAt === undefined) {
                last.wokeAt = Date.now();
                last.actualDormantMs = last.wokeAt - last.sleptAt;
                last.wakeReason = reason;
            }
        }
        setTimeout(() => {
            this._phase = 'awake';
            this._lastActivity = Date.now();
            this._notify('awake', reason);
            if (this._config.enableAutoSleep)
                this._resetIdleTimer();
            this._cancelMaxSleepTimer();
        }, 200); // brief waking window
        return true;
    }
    _notify(phase, reason) {
        for (const fn of this._listeners) {
            try {
                fn(phase, reason);
            }
            catch { /* ignore */ }
        }
    }
}
exports.SleepWake = SleepWake;
// ─── Default singleton ─────────────────────────────────────
let _defaultSleepWake = null;
function getSleepWake(config) {
    if (!_defaultSleepWake)
        _defaultSleepWake = new SleepWake(config);
    return _defaultSleepWake;
}
//# sourceMappingURL=sleep-wake.js.map