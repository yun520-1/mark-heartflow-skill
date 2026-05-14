/**
 * HEARTCORE v2 — Heartbeat Engine
 * TypeScript ESM · Zero Dependencies · 零依赖
 */

export type HeartbeatState = 'alive' | 'degraded' | 'dead';

export interface HeartbeatOptions {
  interval?: number;        // ms between beats (default: 5000)
  timeout?: number;         // ms to consider dead (default: 15000)
  degradedThreshold?: number; // consecutive misses before degraded (default: 2)
}

export interface HeartbeatMetrics {
  state: HeartbeatState;
  lastBeat: number;         // timestamp
  consecutiveMisses: number;
  totalBeats: number;
  uptimeMs: number;
}

const DEFAULT_OPTIONS: Required<HeartbeatOptions> = {
  interval: 5000,
  timeout: 15000,
  degradedThreshold: 2,
};

export class HeartbeatCore {
  private _state: HeartbeatState = 'alive';
  private _lastBeat: number = Date.now();
  private _consecutiveMisses: number = 0;
  private _totalBeats: number = 0;
  private _startedAt: number = Date.now();
  private _options: Required<HeartbeatOptions>;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _listeners: Array<(metrics: HeartbeatMetrics) => void> = [];

  constructor(opts: HeartbeatOptions = {}) {
    this._options = { ...DEFAULT_OPTIONS, ...opts };
  }

  // ─── Public API ─────────────────────────────────────────────

  start(): void {
    if (this._timer) return;
    this._lastBeat = Date.now();
    this._schedule();
  }

  stop(): void {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /** Call this on each successful pulse */
  pulse(): HeartbeatMetrics {
    this._lastBeat = Date.now();
    this._consecutiveMisses = 0;
    this._totalBeats++;
    this._setState('alive');
    return this._metrics();
  }

  /** Manually report a missed beat */
  miss(): HeartbeatMetrics {
    this._consecutiveMisses++;
    if (this._consecutiveMisses >= this._options.degradedThreshold) {
      const elapsed = Date.now() - this._lastBeat;
      this._setState(elapsed > this._options.timeout ? 'dead' : 'degraded');
    }
    return this._metrics();
  }

  get metrics(): HeartbeatMetrics {
    return this._metrics();
  }

  get state(): HeartbeatState {
    return this._state;
  }

  onBeat(fn: (metrics: HeartbeatMetrics) => void): () => void {
    this._listeners.push(fn);
    return () => {
      this._listeners = this._listeners.filter(l => l !== fn);
    };
  }

  // ─── Internal ───────────────────────────────────────────────

  private _schedule(): void {
    this._timer = setTimeout(() => {
      this._tick();
      this._schedule();
    }, this._options.interval);
  }

  private _tick(): void {
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
    // Notify listeners even on tick with current state
    this._notify();
  }

  private _setState(s: HeartbeatState): void {
    if (this._state === s) return;
    this._state = s;
    this._notify();
  }

  private _notify(): void {
    const m = this._metrics();
    for (const fn of this._listeners) {
      try { fn(m); } catch { /* ignore */ }
    }
  }

  private _metrics(): HeartbeatMetrics {
    return {
      state: this._state,
      lastBeat: this._lastBeat,
      consecutiveMisses: this._consecutiveMisses,
      totalBeats: this._totalBeats,
      uptimeMs: Date.now() - this._startedAt,
    };
  }
}

// ─── Singleton pulse source ───────────────────────────────────

let _globalBeat: HeartbeatCore | null = null;

export function getHeartbeat(opts?: HeartbeatOptions): HeartbeatCore {
  if (!_globalBeat) _globalBeat = new HeartbeatCore(opts);
  return _globalBeat;
}

export const createHeartbeat = getHeartbeat;
