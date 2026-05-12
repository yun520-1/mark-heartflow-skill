"use strict";
/**
 * HEARTCORE - 心跳核心 v2
 * 心跳 + 启动检查 + 健康诊断 + 休眠唤醒
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSleepWakeManager = exports.runHealthChecks = exports.runStartupChecks = exports.getSleepWake = exports.SleepWake = exports.builtinUptimeHealth = exports.builtinMemoryHealth = exports.getHealthCheck = exports.HealthCheck = exports.getStartupCheck = exports.StartupCheck = exports.HeartbeatCore = exports.getHeartbeat = exports.createHeartbeat = void 0;
const heartbeat_js_1 = require("./heartbeat.js");
Object.defineProperty(exports, "createHeartbeat", { enumerable: true, get: function () { return heartbeat_js_1.createHeartbeat; } });
Object.defineProperty(exports, "getHeartbeat", { enumerable: true, get: function () { return heartbeat_js_1.getHeartbeat; } });
Object.defineProperty(exports, "HeartbeatCore", { enumerable: true, get: function () { return heartbeat_js_1.HeartbeatCore; } });
const startup_check_js_1 = require("./startup-check.js");
Object.defineProperty(exports, "StartupCheck", { enumerable: true, get: function () { return startup_check_js_1.StartupCheck; } });
Object.defineProperty(exports, "getStartupCheck", { enumerable: true, get: function () { return startup_check_js_1.getStartupCheck; } });
const health_check_js_1 = require("./health-check.js");
Object.defineProperty(exports, "HealthCheck", { enumerable: true, get: function () { return health_check_js_1.HealthCheck; } });
Object.defineProperty(exports, "getHealthCheck", { enumerable: true, get: function () { return health_check_js_1.getHealthCheck; } });
Object.defineProperty(exports, "builtinMemoryHealth", { enumerable: true, get: function () { return health_check_js_1.builtinMemoryHealth; } });
Object.defineProperty(exports, "builtinUptimeHealth", { enumerable: true, get: function () { return health_check_js_1.builtinUptimeHealth; } });
const sleep_wake_js_1 = require("./sleep-wake.js");
Object.defineProperty(exports, "SleepWake", { enumerable: true, get: function () { return sleep_wake_js_1.SleepWake; } });
Object.defineProperty(exports, "getSleepWake", { enumerable: true, get: function () { return sleep_wake_js_1.getSleepWake; } });
// Aliases for compatibility
const runStartupChecks = () => (0, startup_check_js_1.getStartupCheck)().run();
exports.runStartupChecks = runStartupChecks;
const runHealthChecks = (startedAt) => (0, health_check_js_1.getHealthCheck)().runAll(startedAt);
exports.runHealthChecks = runHealthChecks;
const createSleepWakeManager = (config) => (0, sleep_wake_js_1.getSleepWake)(config);
exports.createSleepWakeManager = createSleepWakeManager;
//# sourceMappingURL=index.js.map