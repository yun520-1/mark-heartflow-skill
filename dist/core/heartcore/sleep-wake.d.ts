/**
 * HEARTCORE v2 — Sleep & Wake Lifecycle
 * Manages dormancy periods and graceful reactivation
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
export type SleepReason = 'idle' | 'scheduled' | 'manual' | 'low_power' | 'error';
export type WakeReason = 'timer' | 'signal' | 'manual' | 'error_recovery';
export type SystemPhase = 'awake' | 'dormant' | 'waking' | 'sleeping';
export interface SleepConfig {
    idleTimeoutMs?: number;
    maxDormantMs?: number;
    minDormantMs?: number;
    enableAutoSleep?: boolean;
}
export interface DormancyRecord {
    sleepReason: SleepReason;
    sleptAt: number;
    wokeAt?: number;
    actualDormantMs?: number;
    wakeReason?: WakeReason;
}
export declare class SleepWake {
    private _phase;
    private _config;
    private _dormancyLog;
    private _idleTimer;
    private _maxSleepTimer;
    private _lastActivity;
    private _listeners;
    constructor(config?: SleepConfig);
    get phase(): SystemPhase;
    get config(): Readonly<Required<SleepConfig>>;
    get lastActivity(): number;
    /** Report user/system activity to reset idle timer */
    touch(): void;
    /** Explicitly request sleep */
    sleep(reason?: SleepReason): boolean;
    /** Explicitly request wake-up */
    wake(reason?: WakeReason): boolean;
    /** Override idle timeout */
    setIdleTimeout(ms: number): this;
    /** Disable/enable auto-sleep */
    setAutoSleep(enabled: boolean): this;
    /** Subscribe to phase changes */
    onPhaseChange(fn: (phase: SystemPhase, reason?: string) => void): () => void;
    /** Get recent dormancy history */
    getDormancyLog(limit?: number): DormancyRecord[];
    /** Start the auto-sleep timer (call once on init) */
    start(): void;
    /** Stop all timers */
    stop(): void;
    private _resetIdleTimer;
    private _cancelIdleTimer;
    private _setMaxSleepTimer;
    private _cancelMaxSleepTimer;
    private _enterDormant;
    private _enterAwake;
    private _notify;
}
export declare function getSleepWake(config?: SleepConfig): SleepWake;
//# sourceMappingURL=sleep-wake.d.ts.map