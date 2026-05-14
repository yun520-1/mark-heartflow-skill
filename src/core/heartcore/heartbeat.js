/**
 * HEARTCORE v2 — Heartbeat Engine
 * TypeScript → JavaScript port · Zero Dependencies · 零依赖
 * Source: ~/.heartflow/HEARTCORE/heartbeat.ts
 */

'use strict';

const DEFAULT_OPTIONS = {
  interval: 5000,
  timeout: 15000,
  degradedThreshold: 2,
};

class HeartbeatCore {
  constructor(opts = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opts };
    this._state = 'alive';
    this._lastBeat = Date.now();
    this._consecutiveMisses = 0;
    this._totalBeats = 0;
    this._startedAt = Date.now();
    this._timer = null;
    this._listeners = [];
  }

  start() {
    if (this._timer) return;
    this._lastBeat = Date.now();
    this._schedule();
  }

  stop() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  pulse() {
    this._lastBeat = Date.now();
    this._consecutiveMisses = 0;
    this._totalBeats++;
    this._setState('alive');
    return this._metrics();
  }

  miss() {
    this._consecutiveMisses++;
    const elapsed = Date.now() - this._lastBeat;
    if (this._consecutiveMisses >= this._options.degradedThreshold) {
      this._setState(elapsed > this._options.timeout ? 'dead' : 'degraded');
    }
    return this._metrics();
  }

  get metrics() { return this._metrics(); }
  get state() { return this._state; }
  get totalBeats() { return this._totalBeats; }
  get lastBeat() { return this._lastBeat; }
  get consecutiveMisses() { return this._consecutiveMisses; }

  onBeat(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  _schedule() {
    this._timer = setTimeout(() => {
      this._tick();
      this._schedule();
    }, this._options.interval);
  }

  _tick() {
    if (this._state === 'dead') {
      this.stop(); // Halt timer loop on terminal state
      return;
    }
    const elapsed = Date.now() - this._lastBeat;
    if (elapsed > this._options.timeout) {
      this._setState('dead');
    } else if (elapsed > this._options.interval * 1.5) {
      this._consecutiveMisses++;
      if (this._consecutiveMisses >= this._options.degradedThreshold) {
        this._setState('degraded');
      }
    }
    this._notify();
  }

  _setState(s) {
    if (this._state === s) return;
    this._state = s;
    this._notify();
  }

  _notify() {
    const m = this._metrics();
    for (const fn of this._listeners) {
      try { fn(m); } catch { /* ignore */ }
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

// Singleton
let _globalBeat = null;
function getHeartbeat(opts) {
  if (!_globalBeat) _globalBeat = new HeartbeatCore(opts);
  return _globalBeat;
}

module.exports = { HeartbeatCore, getHeartbeat, createHeartbeat: getHeartbeat };
