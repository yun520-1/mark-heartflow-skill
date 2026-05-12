"use strict";
/**
 * HEARTCORE v2 — Heartbeat Engine
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHeartbeat = exports.HeartbeatCore = void 0;
exports.getHeartbeat = getHeartbeat;
const DEFAULT_OPTIONS = {
    interval: 5000,
    timeout: 15000,
    degradedThreshold: 2,
};
class HeartbeatCore {
    _state = 'alive';
    _lastBeat = Date.now();
    _consecutiveMisses = 0;
    _totalBeats = 0;
    _startedAt = Date.now();
    _options;
    _timer = null;
    _listeners = [];
    constructor(opts = {}) {
        this._options = { ...DEFAULT_OPTIONS, ...opts };
    }
    // ─── Public API ─────────────────────────────────────────────
    start() {
        if (this._timer)
            return;
        this._lastBeat = Date.now();
        this._schedule();
    }
    stop() {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }
    /** Call this on each successful pulse */
    pulse() {
        this._lastBeat = Date.now();
        this._consecutiveMisses = 0;
        this._totalBeats++;
        this._setState('alive');
        return this._metrics();
    }
    /** Manually report a missed beat */
    miss() {
        this._consecutiveMisses++;
        if (this._consecutiveMisses >= this._options.degradedThreshold) {
            const elapsed = Date.now() - this._lastBeat;
            this._setState(elapsed > this._options.timeout ? 'dead' : 'degraded');
        }
        return this._metrics();
    }
    get metrics() {
        return this._metrics();
    }
    get state() {
        return this._state;
    }
    onBeat(fn) {
        this._listeners.push(fn);
        return () => {
            this._listeners = this._listeners.filter(l => l !== fn);
        };
    }
    // ─── Internal ───────────────────────────────────────────────
    _schedule() {
        this._timer = setTimeout(() => {
            this._tick();
            this._schedule();
        }, this._options.interval);
    }
    _tick() {
        const elapsed = Date.now() - this._lastBeat;
        if (elapsed > this._options.timeout) {
            this._setState('dead');
        }
        else if (elapsed > this._options.interval * 1.5) {
            this._consecutiveMisses++;
            if (this._consecutiveMisses >= this._options.degradedThreshold) {
                this._setState('degraded');
            }
        }
        // Notify listeners even on tick with current state
        this._notify();
    }
    _setState(s) {
        if (this._state === s)
            return;
        this._state = s;
        this._notify();
    }
    _notify() {
        const m = this._metrics();
        for (const fn of this._listeners) {
            try {
                fn(m);
            }
            catch { /* ignore */ }
        }
    }
    _metrics() {
        return {
            state: this._state,
            lastBeat: this._lastBeat,
            consecutiveMisses: this._consecutiveMisses,
            totalBeats: this._totalBeats,
            uptimeMs: Date.now() - this._startedAt,
        };
    }
}
exports.HeartbeatCore = HeartbeatCore;
// ─── Singleton pulse source ───────────────────────────────────
let _globalBeat = null;
function getHeartbeat(opts) {
    if (!_globalBeat)
        _globalBeat = new HeartbeatCore(opts);
    return _globalBeat;
}
exports.createHeartbeat = getHeartbeat;
//# sourceMappingURL=heartbeat.js.map