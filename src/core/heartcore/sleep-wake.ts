/**
 * HEARTCORE v2 — Sleep & Wake Lifecycle
 * Manages dormancy periods and graceful reactivation
 * TypeScript ESM · Zero Dependencies · 零依赖
 */

export type SleepReason = 'idle' | 'scheduled' | 'manual' | 'low_power' | 'error';
export type WakeReason = 'timer' | 'signal' | 'manual' | 'error_recovery';
export type SystemPhase = 'awake' | 'dormant' | 'waking' | 'sleeping';

export interface SleepConfig {
  idleTimeoutMs?: number;       // auto-sleep after this idle (default: 30 min)
  maxDormantMs?: number;        // force-wake after this long (default: 8 h)
  minDormantMs?: number;        // minimum time to stay asleep (default: 5 s)
  enableAutoSleep?: boolean;    // default: true
}

export interface DormancyRecord {
  sleepReason: SleepReason;
  sleptAt: number;
  wokeAt?: number;
  actualDormantMs?: number;
  wakeReason?: WakeReason;
}

const DEFAULT_CONFIG: Required<SleepConfig> = {
  idleTimeoutMs: 30 * 60 * 1000,
  maxDormantMs: 8 * 3600 * 1000,
  minDormantMs: 5_000,
  enableAutoSleep: true,
};

// ─── SleepWake manager ───────────────────────────────────────

export class SleepWake {
  private _phase: SystemPhase = 'awake';
  private _config: Required<SleepConfig>;
  private _dormancyLog: DormancyRecord[] = [];
  private _idleTimer: ReturnType<typeof setTimeout> | null = null;
  private _maxSleepTimer: ReturnType<typeof setTimeout> | null = null;
  private _lastActivity: number = Date.now();
  private _listeners: Array<(phase: SystemPhase, reason?: string) => void> = [];

  constructor(config: SleepConfig = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  // ─── Public API ────────────────────────────────────────────

  get phase(): SystemPhase { return this._phase; }
  get config(): Readonly<Required<SleepConfig>> { return this._config; }
  get lastActivity(): number { return this._lastActivity; }

  /** Report user/system activity to reset idle timer */
  touch(): void {
    this._lastActivity = Date.now();
    if (this._phase === 'awake' && this._config.enableAutoSleep) {
      this._resetIdleTimer();
    }
  }

  /** Explicitly request sleep */
  sleep(reason: SleepReason = 'manual'): boolean {
    if (this._phase !== 'awake') return false;
    return this._enterDormant(reason);
  }

  /** Explicitly request wake-up */
  wake(reason: WakeReason = 'manual'): boolean {
    if (this._phase !== 'dormant') return false;
    return this._enterAwake(reason);
  }

  /** Override idle timeout */
  setIdleTimeout(ms: number): this {
    this._config.idleTimeoutMs = ms;
    this._resetIdleTimer();
    return this;
  }

  /** Disable/enable auto-sleep */
  setAutoSleep(enabled: boolean): this {
    this._config.enableAutoSleep = enabled;
    if (enabled && this._phase === 'awake') this._resetIdleTimer();
    else if (!enabled) this._cancelIdleTimer();
    return this;
  }

  /** Subscribe to phase changes */
  onPhaseChange(fn: (phase: SystemPhase, reason?: string) => void): () => void {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  /** Get recent dormancy history */
  getDormancyLog(limit = 10): DormancyRecord[] {
    return this._dormancyLog.slice(-limit);
  }

  /** Start the auto-sleep timer (call once on init) */
  start(): void {
    if (this._config.enableAutoSleep) this._resetIdleTimer();
  }

  /** Stop all timers */
  stop(): void {
    this._cancelIdleTimer();
    this._cancelMaxSleepTimer();
  }

  // ─── Internal ─────────────────────────────────────────────

  private _resetIdleTimer(): void {
    this._cancelIdleTimer();
    this._idleTimer = setTimeout(() => {
      if (Date.now() - this._lastActivity >= this._config.idleTimeoutMs) {
        this._enterDormant('idle');
      }
    }, this._config.idleTimeoutMs);
  }

  private _cancelIdleTimer(): void {
    if (this._idleTimer) { clearTimeout(this._idleTimer); this._idleTimer = null; }
  }

  private _setMaxSleepTimer(): void {
    this._cancelMaxSleepTimer();
    this._maxSleepTimer = setTimeout(() => {
      // Force wake after max dormant time
      this._enterAwake('timer');
    }, this._config.maxDormantMs);
  }

  private _cancelMaxSleepTimer(): void {
    if (this._maxSleepTimer) { clearTimeout(this._maxSleepTimer); this._maxSleepTimer = null; }
  }

  private _enterDormant(reason: SleepReason): boolean {
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

  private _enterAwake(reason: WakeReason): boolean {
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
      if (this._config.enableAutoSleep) this._resetIdleTimer();
      this._cancelMaxSleepTimer();
    }, 200); // brief waking window

    return true;
  }

  private _notify(phase: SystemPhase, reason?: string): void {
    for (const fn of this._listeners) {
      try { fn(phase, reason); } catch { /* ignore */ }
    }
  }
}

// ─── Default singleton ─────────────────────────────────────

let _defaultSleepWake: SleepWake | null = null;

export function getSleepWake(config?: SleepConfig): SleepWake {
  if (!_defaultSleepWake) _defaultSleepWake = new SleepWake(config);
  return _defaultSleepWake;
}
