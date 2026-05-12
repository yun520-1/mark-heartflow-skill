/**
 * HEARTCORE - 心跳核心 v2
 * 心跳 + 启动检查 + 健康诊断 + 休眠唤醒
 */
import { createHeartbeat, getHeartbeat, HeartbeatCore } from './heartbeat.js';
import { StartupCheck, getStartupCheck } from './startup-check.js';
import { HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth } from './health-check.js';
import { SleepWake, getSleepWake } from './sleep-wake.js';
export { createHeartbeat, getHeartbeat, HeartbeatCore, type HeartbeatState, type HeartbeatOptions, type HeartbeatMetrics };
export { StartupCheck, getStartupCheck, type StartupReport, type CheckResult };
export { HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth, type HealthStatus, type HealthCheck, type HealthReport };
export { SleepWake, getSleepWake, type SleepWakeConfig, type SleepWakeManager };
export declare const runStartupChecks: () => Promise<import("./startup-check.js").StartupReport>;
export declare const runHealthChecks: (startedAt: number) => Promise<import("./health-check.js").HealthReport>;
export declare const createSleepWakeManager: (config?: any) => SleepWake;
//# sourceMappingURL=index.d.ts.map