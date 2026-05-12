/**
 * HEARTCORE v2 — Startup Check
 * Verifies all critical subsystems are viable before launch
 * TypeScript ESM · Zero Dependencies · 零依赖
 */
export type Subsystem = 'memory' | 'skills' | 'cron' | 'network' | 'storage';
export interface CheckResult {
    subsystem: Subsystem;
    ok: boolean;
    latencyMs?: number;
    error?: string;
    details?: string;
}
export interface StartupReport {
    timestamp: number;
    passed: boolean;
    checks: CheckResult[];
    totalLatencyMs: number;
    blocked: boolean;
    blockers: string[];
}
type CheckFn = () => Promise<CheckResult> | CheckResult;
export declare class StartupCheck {
    private _checks;
    private _critical;
    constructor();
    /** Override the check function for a subsystem */
    setCheck(subsystem: Subsystem, fn: CheckFn, critical?: boolean): this;
    /** Mark a subsystem as critical (blocks startup if it fails) */
    setCritical(subsystem: Subsystem): this;
    /** Run all checks and return the full report */
    run(): Promise<StartupReport>;
    /** Convenience: run checks and throw if blocked */
    runOrThrow(): Promise<StartupReport>;
}
export declare function getStartupCheck(): StartupCheck;
export {};
//# sourceMappingURL=startup-check.d.ts.map