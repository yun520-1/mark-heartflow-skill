/**
 * HEARTCORE v2 — Heartbeat Engine
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
export type HeartbeatState = 'alive' | 'degraded' | 'dead';
export interface HeartbeatOptions {
    interval?: number;
    timeout?: number;
    degradedThreshold?: number;
}
export interface HeartbeatMetrics {
    state: HeartbeatState;
    lastBeat: number;
    consecutiveMisses: number;
    totalBeats: number;
    uptimeMs: number;
}
export declare class HeartbeatCore {
    private _state;
    private _lastBeat;
    private _consecutiveMisses;
    private _totalBeats;
    private _startedAt;
    private _options;
    private _timer;
    private _listeners;
    constructor(opts?: HeartbeatOptions);
    start(): void;
    stop(): void;
    /** Call this on each successful pulse */
    pulse(): HeartbeatMetrics;
    /** Manually report a missed beat */
    miss(): HeartbeatMetrics;
    get metrics(): HeartbeatMetrics;
    get state(): HeartbeatState;
    onBeat(fn: (metrics: HeartbeatMetrics) => void): () => void;
    private _schedule;
    private _tick;
    private _setState;
    private _notify;
    private _metrics;
}
export declare function getHeartbeat(opts?: HeartbeatOptions): HeartbeatCore;
export declare const createHeartbeat: typeof getHeartbeat;
//# sourceMappingURL=heartbeat.d.ts.map