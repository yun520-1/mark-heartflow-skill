/**
 * HEARTCORE v2 — Sleep & Wake Lifecycle
 * TypeScript → JavaScript port · Zero Dependencies
 * Source: ~/.heartflow/HEARTCORE/sleep-wake.ts
 */

'use strict';

const DEFAULT_CONFIG = {
  idleTimeoutMs: 30 * 60 * 1000,  // 30 min
  maxDormantMs: 8 * 3600 * 1000,   // 8 hours
  minDormantMs: 5_000,              // 5 sec
  enableAutoSleep: true,
};

class SleepWake {
  constructor(config = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._phase = 'awake';
    this._dormancyLog = [];
    this._idleTimer = null;
    this._maxSleepTimer = null;
    this._lastActivity = Date.now();
    this._listeners = [];
  }

  get phase() { return this._phase; }
  get config() { return this._config; }
  get lastActivity() { return this._lastActivity; }

  touch() {
    this._lastActivity = Date.now();
    if (this._phase === 'awake' && this._config.enableAutoSleep) {
      this._resetIdleTimer();
    }
  }

  sleep(reason = 'manual') {
    if (this._phase !== 'awake') return false;
    return this._enterDormant(reason);
  }

  wake(reason = 'manual') {
    // Allow wake from both 'sleeping' intermediate and 'dormant' states
    if (this._phase === 'awake' || this._phase === 'waking') return false;
    if (this._phase === 'sleeping') {
      // Force transition through 'dormant' immediately
      this._phase = 'dormant';
      this._notify('dormant', reason);
    }
    return this._enterAwake(reason);
  }

  setIdleTimeout(ms) {
    this._config.idleTimeoutMs = ms;
    this._resetIdleTimer();
    return this;
  }

  setAutoSleep(enabled) {
    this._config.enableAutoSleep = enabled;
    if (enabled && this._phase === 'awake') this._resetIdleTimer();
    else if (!enabled) this._cancelIdleTimer();
    return this;
  }

  onPhaseChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  getDormancyLog(limit = 10) {
    return this._dormancyLog.slice(-limit);
  }

  start() {
    if (this._config.enableAutoSleep) this._resetIdleTimer();
  }

  stop() {
    this._cancelIdleTimer();
    this._cancelMaxSleepTimer();
  }

  _resetIdleTimer() {
    this._cancelIdleTimer();
    this._idleTimer = setTimeout(() => {
      if (Date.now() - this._lastActivity >= this._config.idleTimeoutMs) {
        this._enterDormant('idle');
      }
    }, this._config.idleTimeoutMs);
  }

  _cancelIdleTimer() {
    if (this._idleTimer) { clearTimeout(this._idleTimer); this._idleTimer = null; }
  }

  _setMaxSleepTimer() {
    this._cancelMaxSleepTimer();
    this._maxSleepTimer = setTimeout(() => {
      this._enterAwake('timer');
    }, this._config.maxDormantMs);
  }

  _cancelMaxSleepTimer() {
    if (this._maxSleepTimer) { clearTimeout(this._maxSleepTimer); this._maxSleepTimer = null; }
  }

  _enterDormant(reason) {
    this._phase = 'sleeping';
    this._notify('sleeping', reason);

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
      if (this._config.enableAutoSleep) this._resetIdleTimer();
      this._cancelMaxSleepTimer();
    }, 200);

    return true;
  }

  _notify(phase, reason) {
    for (const fn of this._listeners) {
      try { fn(phase, reason); } catch { /* ignore */ }
    }
  }
}

let _defaultSleepWake = null;
function getSleepWake(config) {
  if (!_defaultSleepWake) _defaultSleepWake = new SleepWake(config);
  return _defaultSleepWake;
}

module.exports = { SleepWake, getSleepWake, createSleepWake: getSleepWake };
