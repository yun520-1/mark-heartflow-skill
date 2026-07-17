'use strict';

/**
 * HeartFlow Config Change Hooks
 *
 * Provides lifecycle hooks for configuration mutations:
 *   config.validate   — before applying a change; can reject
 *   config.apply      — after successful application
 *   config.rollback   — when reverting an aborted change
 *
 * Maintains previous config snapshots for rollback support.
 *
 * Usage:
 *   const { ConfigHooks } = require('./config-hooks');
 *   const config = require('./config');
 *   const hooks = new ConfigHooks(config);
 *
 *   hooks.on('config.validate', ({ key, value, snapshot }) => {
 *     if (key === 'mcp.port' && value < 1) throw new Error('Port must be >= 1');
 *   });
 *
 *   // Or use the high-level setters:
 *   await hooks.set('features.dreamEngine', true);
 */

const { HeartFlowConfig, DEFAULTS } = require('./config');

class ConfigHooks {
  /**
   * @param {HeartFlowConfig} configInstance
   * @param {{ maxSnapshots?: number, enabled?: boolean }} options
   */
  constructor(configInstance, options = {}) {
    if (!(configInstance instanceof HeartFlowConfig)) {
      throw new TypeError('[ConfigHooks] expected HeartFlowConfig instance');
    }

    this._config = configInstance;
    this._handlers = {
      config: {
        validate: [],
        apply: [],
        rollback: [],
      },
    };
    this._snapshots = [];
    this._maxSnapshots = typeof options.maxSnapshots === 'number' && options.maxSnapshots > 0
      ? options.maxSnapshots
      : 50;
    this._enabled = options.enabled !== false;
    this._currentKey = null;
    this._currentValue = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Register a hook handler.
   *
   * @param {'config.validate'|'config.apply'|'config.rollback'} event
   * @param {Function} handler
   * @returns {ConfigHooks} this
   */
  on(event, handler) {
    if (!this._enabled) return this;
    if (typeof handler !== 'function') return this;

    const [ns, name] = String(event).split('.');
    if (ns !== 'config' || !['validate', 'apply', 'rollback'].includes(name)) {
      throw new Error(`[ConfigHooks] unsupported event: ${event}`);
    }

    (this._handlers[ns][name] = this._handlers[ns][name] || []).push(handler);
    return this;
  }

  /**
   * Remove a registered handler.
   * @param {string} event
   * @param {Function} handler
   * @returns {ConfigHooks} this
   */
  off(event, handler) {
    if (typeof handler !== 'function') return this;
    const [ns, name] = String(event).split('.');
    if (!this._handlers[ns] || !this._handlers[ns][name]) return this;
    this._handlers[ns][name] = this._handlers[ns][name].filter(h => h !== handler);
    return this;
  }

  removeAll(event) {
    if (!event) {
      this._handlers.config.validate = [];
      this._handlers.config.apply = [];
      this._handlers.config.rollback = [];
      return this;
    }
    const [ns, name] = String(event).split('.');
    if (ns === 'config' && this._handlers[ns] && this._handlers[ns][name]) {
      this._handlers[ns][name] = [];
    }
    return this;
  }

  /**
   * Enable or disable hooks globally.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this._enabled = !!enabled;
    return this;
  }

  get enabled() {
    return this._enabled;
  }

  // ─── Snapshots ──────────────────────────────────────────────────────────

  /**
   * Push a snapshot of the current config for rollback support.
   * @returns {object}
   */
  _pushSnapshot() {
    const snapshot = JSON.parse(JSON.stringify(this._config._values || {}));
    this._snapshots.push(snapshot);
    if (this._snapshots.length > this._maxSnapshots) {
      this._snapshots.shift();
    }
    return snapshot;
  }

  /**
   * Pop the most recent snapshot.
   * @returns {object|undefined}
   */
  _popSnapshot() {
    return this._snapshots.pop();
  }

  /**
   * Peek at the most recent snapshot without removing it.
   * @returns {object|undefined}
   */
  peekSnapshot() {
    return this._snapshots.length > 0 ? this._snapshots[this._snapshots.length - 1] : undefined;
  }

  /**
   * Current snapshot history count.
   */
  get snapshotCount() {
    return this._snapshots.length;
  }

  /**
   * Get a read-only copy of the current snapshot history.
   */
  getSnapshotHistory() {
    return this._snapshots.map(s => JSON.parse(JSON.stringify(s)));
  }

  // ─── Hook delivery ──────────────────────────────────────────────────────

  /**
   * Deliver a hook event synchronously, isolating handler errors.
   * Handler errors are collected but never propagate to the caller.
   *
   * @param {string} event
   * @param {object} context
   * @returns {Array<{ok: boolean, error?: string}>}
   */
  _deliverSync(event, context = {}) {
    if (!this._enabled) return [];
    const list = this._handlers.config[event] || [];
    const results = [];

    for (const handler of list) {
      try {
        handler(context);
        results.push({ ok: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        results.push({ ok: false, error: errorMessage });
      }
    }
    return results;
  }

  // ─── Core mutation flow ─────────────────────────────────────────────────

  /**
   * Set a config value with full lifecycle hooks.
   *
   * 1. Take a snapshot
   * 2. Fire `config.validate` handlers (any failure aborts)
   * 3. Apply the change via `config.set`
   * 4. Fire `config.apply` handlers (best-effort; failures do not rollback)
   *
   * @param {string} key - dotted path, e.g. `mcp.port`
   * @param {*} value
   * @returns {{ applied: boolean, validationResults: Array, applyResults: Array }}
   */
  set(key, value) {
    if (!this._enabled) {
      this._config.set(key, value);
      return { applied: true, validationResults: [], applyResults: [] };
    }

    this._currentKey = key;
    this._currentValue = value;

    const previous = this._pushSnapshot();
    const context = { key, value, previousSnapshot: previous };

    // Phase 1: Validate
    const validationResults = this._deliverSync('validate', context);
    const failedValidation = validationResults.find(r => !r.ok);
    if (failedValidation) {
      this._popSnapshot();
      this._fireRollback(context, 'validation-failed');
      this._currentKey = null;
      this._currentValue = null;
      return {
        applied: false,
        validationResults,
        applyResults: [],
        error: failedValidation.error,
      };
    }

    // Phase 2: Apply
    this._config.set(key, value);
    const applyResults = this._deliverSync('apply', context);

    this._currentKey = null;
    this._currentValue = null;

    return {
      applied: true,
      validationResults,
      applyResults,
    };
  }

  /**
   * Rollback the most recent config change using the previous snapshot.
   *
   * @returns {{ rolledBack: boolean, previousSnapshot: object|undefined }}
   */
  rollback() {
    if (!this._enabled) {
      return { rolledBack: false, previousSnapshot: undefined };
    }

    const previousSnapshot = this._popSnapshot();
    if (!previousSnapshot) {
      return { rolledBack: false, previousSnapshot: undefined };
    }

    const key = this._currentKey;
    const value = this._currentValue;
    this._currentKey = null;
    this._currentValue = null;

    const context = {
      key,
      value,
      previousSnapshot,
      reason: 'manual-rollback',
    };

    // Restore snapshot values onto config
    this._restoreSnapshot(previousSnapshot);
    this._fireRollback(context, 'manual-rollback');

    return { rolledBack: true, previousSnapshot };
  }

  /**
   * Reset the entire config to the built-in DEFAULTS and clear snapshots.
   * Fires rollback hooks for any outstanding mutations.
   *
   * @returns {{ reset: boolean }}
   */
  resetToDefaults() {
    if (!this._enabled) {
      this._config._values = JSON.parse(JSON.stringify(DEFAULTS));
      return { reset: true };
    }

    const previousSnapshot = this._config._values ? JSON.parse(JSON.stringify(this._config._values)) : undefined;
    const context = { key: null, value: null, previousSnapshot, reason: 'reset-defaults' };

    this._config._values = JSON.parse(JSON.stringify(DEFAULTS));
    this._snapshots = [];
    this._currentKey = null;
    this._currentValue = null;

    this._fireRollback(context, 'reset-defaults');

    return { reset: true };
  }

  // ─── Internal helpers ───────────────────────────────────────────────────

  _restoreSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    this._config._values = JSON.parse(JSON.stringify(snapshot));
  }

  _fireRollback(context, reason) {
    const rollbackContext = { ...context, reason };
    this._deliverSync('rollback', rollbackContext);
  }

  /**
   * Get current config stats for observability.
   */
  getStats() {
    return {
      enabled: this._enabled,
      handlers: {
        config: Object.fromEntries(
          Object.entries(this._handlers.config).map(([k, v]) => [k, v.length])
        ),
      },
      snapshots: this._snapshots.length,
      currentKey: this._currentKey,
      currentValue: this._currentValue,
    };
  }
}

module.exports = { ConfigHooks };
