/**
 * HEARTCORE v2 — Health Check
 * Continuous health monitoring of all running subsystems
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
import type { HeartbeatMetrics } from './heartbeat.js';
export type HealthLevel = 'healthy' | 'warning' | 'critical';
export interface SubsystemHealth {
    name: string;
    level: HealthLevel;
    message: string;
    latencyMs?: number;
    lastCheck: number;
    consecutiveFailures: number;
}
export interface HealthReport {
    timestamp: number;
    overall: HealthLevel;
    subsystems: SubsystemHealth[];
    heartbeat?: HeartbeatMetrics;
    restartRecommended: boolean;
}
type HealthCheckFn = () => Promise<SubsystemHealth> | SubsystemHealth;
export declare class HealthCheck {
    private _checks;
    private _lastResults;
    private _failureThreshold;
    register(name: string, fn: HealthCheckFn): this;
    unregister(name: string): boolean;
    setFailureThreshold(n: number): this;
    /** Run a single subsystem check by name */
    checkOne(name: string): Promise<SubsystemHealth | null>;
    /** Run all registered health checks */
    runAll(heartbeatMetrics?: HeartbeatMetrics): Promise<HealthReport>;
    /** Get cached results from last run */
    getLastResults(): Map<string, SubsystemHealth>;
    private _computeOverall;
}
export declare function builtinMemoryHealth(): SubsystemHealth;
export declare function builtinUptimeHealth(startedAt: number): SubsystemHealth;
export declare function getHealthCheck(): HealthCheck;
export {};
//# sourceMappingURL=health-check.d.ts.map