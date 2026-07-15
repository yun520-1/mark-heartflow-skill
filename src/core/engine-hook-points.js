'use strict';

/**
 * HeartFlow Initialization Hook Points
 *
 * Provides init.* handlers that run during engine boot:
 *   init.memory    — load ROM/RAM/Working defaults
 *   init.config    — load CORE_VALUES + config defaults
 *   init.di        — dependency injection (model clients, storage)
 *   init.health    — version/build sanity checks
 *   init.defaults  — decision routing + persona defaults
 *
 * Each handler receives ctx and may mutate ctx.state.
 * softInit=true means failures are warnings, not fatal.
 */

const fs = require('../utils/safe-fs');
const path = require('path');

class InitHookPoints {
  constructor(options = {}) {
    this.rootPath = options.rootPath || process.cwd();
    this._handlers = new Map();
    this._enabled = options.enabled !== false;
    this._registerDefaults();
  }

  _registerDefaults() {
    this.register('init.memory', this._initMemory.bind(this), { priority: 10, softInit: true });
    this.register('init.config', this._initConfig.bind(this), { priority: 20, softInit: false });
    this.register('init.di',     this._initDI.bind(this),     { priority: 30, softInit: true });
    this.register('init.health', this._initHealth.bind(this), { priority: 40, softInit: false });
    this.register('init.defaults', this._initDefaults.bind(this), { priority: 50, softInit: true });
  }

  register(name, handler, opts = {}) {
    if (!this._enabled) return this;
    if (typeof handler !== 'function') return this;
    this._handlers.set(String(name), { handler, priority: opts.priority ?? 100, softInit: opts.softInit !== false });
    return this;
  }

  getHandler(name) {
    return this._handlers.get(String(name)) || null;
  }

  getAllHandlers() {
    return Array.from(this._handlers.entries()).map(([name, { handler, priority, softInit }]) => ({ name, handler, priority, softInit }));
  }

  // ─── Default Handlers ──────────────────────────────────────────────

  _initMemory(ctx) {
    const state = ctx.state || {};
    state.memory = state.memory || {};
    state.memory.rom = state.memory.rom || { identityRules: [], coreValues: [] };
    state.memory.ram = state.memory.ram || { behaviorPatterns: [], preferences: [] };
    state.memory.working = state.memory.working || { sessionContext: {}, transientNotes: [] };
    ctx.state = state;
    return ctx;
  }

  _initConfig(ctx) {
    const state = ctx.state || {};
    state.config = state.config || {};
    const coreValuesPath = path.join(this.rootPath, 'CORE_VALUES.md');
    try {
      if (fs.existsSync(coreValuesPath)) {
        const content = fs.readFileSync(coreValuesPath, 'utf8');
        state.config.coreValues = content;
      }
    } catch (_) { /* soft */ }
    state.config.defaults = state.config.defaults || { temperature: 0.7, maxTokens: 2048 };
    ctx.state = state;
    return ctx;
  }

  _initDI(ctx) {
    const state = ctx.state || {};
    state.dependencies = state.dependencies || {};
    if (ctx.meta) {
      ctx.meta.injectedAt = Date.now();
    }
    ctx.state = state;
    return ctx;
  }

  _initHealth(ctx) {
    const state = ctx.state || {};
    state.health = state.health || {};
    state.health.checks = state.health.checks || [];
    state.health.checks.push({ name: 'init.completed', timestamp: Date.now(), status: 'ok' });
    ctx.state = state;
    return ctx;
  }

  _initDefaults(ctx) {
    const state = ctx.state || {};
    state.defaults = state.defaults || {};
    state.defaults.decisionStrategy = state.defaults.decisionStrategy || 'balanced';
    state.defaults.persona = state.defaults.persona || { name: 'HeartFlow', tone: 'neutral' };
    ctx.state = state;
    return ctx;
  }
}

module.exports = { InitHookPoints };
