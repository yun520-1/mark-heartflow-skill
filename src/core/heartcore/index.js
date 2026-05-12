/**
 * HEARTCORE v2 — Index
 * Integrated from ~/.heartflow/HEARTCORE/ and ~/.heartflow/src/runtime/
 */

'use strict';

const { HeartbeatCore, getHeartbeat } = require('./heartbeat.js');
const { SleepWake, getSleepWake } = require('./sleep-wake.js');
const { EventBus, globalEventBus } = require('./event-bus.js');
const { StateStore, createStore, globalStateStore } = require('./state-store.js');
const { StartupCheck, getStartupCheck } = require('./startup-check.js');
const { HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth } = require('./health-check.js');
const { ToolRegistry, globalToolRegistry } = require('./tool-registry.js');

module.exports = {
  // Heartbeat
  HeartbeatCore, getHeartbeat,
  // Sleep/Wake
  SleepWake, getSleepWake,
  // Event Bus
  EventBus, globalEventBus,
  // State Store
  StateStore, createStore, globalStateStore,
  // Startup Check
  StartupCheck, getStartupCheck,
  // Health Check
  HealthCheck, getHealthCheck, builtinMemoryHealth, builtinUptimeHealth,
  // Tool Registry
  ToolRegistry, globalToolRegistry,
};
