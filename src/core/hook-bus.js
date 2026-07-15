/**
 * HeartFlow HookBus — unified async hook event bus
 *
 * Features:
 *  - Register handlers with optional id, priority, timeout, enabled
 *  - Priority-ordered async fire per event
 *  - maxHandlers cap per event
 *  - Per-handler timeout with default 100ms, hard max 500ms
 *  - Error isolation: handler errors never propagate out of fire()
 *  - Slow/timeout hook recording
 *  - Optional audit logging via enableAudit(logger)
 */

const DEFAULT_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 500;
const MAX_HANDLERS_PER_EVENT = 10;

class HookBus {
  constructor() {
    /** @type {Map<string, Array<{id: string, handler: Function, priority: number, timeout: number, enabled: boolean}>>} */
    this._handlers = new Map();

    /** @type {Map<string, {slow: number, timeout: number, errors: number}>} */
    this._metrics = new Map();

    /** @type {Function|null} */
    this._auditLogger = null;
  }

  /**
   * Enable optional audit logging.
   * @param {Function} logger - function(msg, meta) or compatible structured logger
   */
  enableAudit(logger) {
    this._auditLogger = typeof logger === 'function' ? logger : null;
  }

  /**
   * Register a handler for an event.
   * @param {string} event
   * @param {Function} handler
   * @param {{id?: string, priority?: number, timeout?: number, enabled?: boolean}} opts
   * @returns {{id: string, priority: number, timeout: number, enabled: boolean}}
   */
  on(event, handler, opts = {}) {
    if (typeof event !== 'string' || !event) {
      throw new Error('HookBus: event name must be a non-empty string');
    }
    if (typeof handler !== 'function') {
      throw new Error('HookBus: handler must be a function');
    }

    const id = typeof opts.id === 'string' && opts.id ? opts.id : `hook_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const priority = typeof opts.priority === 'number' ? opts.priority : 100;
    const timeout = Math.min(MAX_TIMEOUT_MS, Math.max(0, typeof opts.timeout === 'number' ? opts.timeout : DEFAULT_TIMEOUT_MS));
    const enabled = opts.enabled !== false;

    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
      this._metrics.set(event, { slow: 0, timeout: 0, errors: 0 });
    }

    const list = this._handlers.get(event);
    if (list.length >= MAX_HANDLERS_PER_EVENT) {
      throw new Error(`HookBus: max handlers (${MAX_HANDLERS_PER_EVENT}) reached for event "${event}"`);
    }

    const entry = { id, handler, priority, timeout, enabled };
    list.push(entry);

    this._auditLogger?.(`hook.registered`, { event, id, priority, timeout, enabled, totalForEvent: list.length });

    return { id, priority, timeout, enabled };
  }

  /**
   * Remove a registered handler by id.
   * @param {string} event
   * @param {string} id
   * @returns {boolean} true if removed
   */
  off(event, id) {
    const list = this._handlers.get(event);
    if (!list) return false;

    const before = list.length;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].id === id) {
        list.splice(i, 1);
        this._auditLogger?.(`hook.unregistered`, { event, id });
        return true;
      }
    }
    return false;
  }

  /**
   * Fire async handlers for an event in priority order (ascending).
   * Errors are isolated and never propagate.
   *
   * @param {string} event
   * @param {*} ctx - context object passed to handlers (recommended plain object)
   * @returns {{event: string, results: Array<{id: string, ok: boolean, error?: string, timedOut?: boolean, durationMs?: number}>, metrics: {slow: number, timeout: number, errors: number}}}
   */
  async fire(event, ctx) {
    const list = this._handlers.get(event);
    if (!list || list.length === 0) {
      return { event, results: [], metrics: this._getMetrics(event) };
    }

    const sorted = list.slice().sort((a, b) => a.priority - b.priority);
    const results = [];

    for (const entry of sorted) {
      if (!entry.enabled) {
        results.push({ id: entry.id, ok: true, skipped: true, reason: 'disabled' });
        continue;
      }

      const result = await this._runHandler(entry, event, ctx);
      results.push(result);

      if (result.timedOut) {
        this._incMetric(event, 'timeout');
      } else if (!result.ok) {
        this._incMetric(event, 'errors');
      } else if (result.durationMs > DEFAULT_TIMEOUT_MS) {
        this._incMetric(event, 'slow');
      }
    }

    return { event, results, metrics: this._getMetrics(event) };
  }

  /**
   * Execute a single handler with timeout and error isolation.
   * @private
   */
  async _runHandler(entry, event, ctx) {
    const started = Date.now();
    const timeoutMs = entry.timeout;

    try {
      const promise = Promise.resolve(entry.handler(ctx));

      const result = await Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`HookBus handler timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      const durationMs = Date.now() - started;

      this._auditLogger?.(`hook.executed`, { event, id: entry.id, durationMs, timedOut: false });

      return { id: entry.id, ok: true, durationMs, timedOut: false };
    } catch (err) {
      const durationMs = Date.now() - started;
      const isTimeout = /timeout after/.test(err?.message || '');
      const errorMessage = isTimeout ? `Timed out after ${timeoutMs}ms` : (err?.message || String(err));

      this._auditLogger?.(`hook.error`, { event, id: entry.id, durationMs, error: errorMessage, timedOut: isTimeout });

      return {
        id: entry.id,
        ok: false,
        timedOut: isTimeout,
        durationMs,
        error: errorMessage,
      };
    }
  }

  /**
   * @private
   */
  _incMetric(event, key) {
    const m = this._metrics.get(event);
    if (m) m[key] = (m[key] || 0) + 1;
  }

  /**
   * @private
   */
  _getMetrics(event) {
    const m = this._metrics.get(event);
    return m ? { slow: m.slow || 0, timeout: m.timeout || 0, errors: m.errors || 0 } : { slow: 0, timeout: 0, errors: 0 };
  }

  /**
   * Current metrics snapshot for an event.
   */
  getMetrics(event) {
    return this._getMetrics(event);
  }

  /**
   * List registered handler ids for an event.
   */
  list(event) {
    const list = this._handlers.get(event);
    if (!list) return [];
    return list.map(entry => ({ id: entry.id, priority: entry.priority, timeout: entry.timeout, enabled: entry.enabled }));
  }

  /**
   * Remove all handlers for an event.
   */
  clear(event) {
    this._handlers.delete(event);
    this._metrics.delete(event);
    this._auditLogger?.(`hook.cleared`, { event });
  }

  /**
   * Enable or disable a handler by id.
   */
  setEnabled(event, id, enabled) {
    const list = this._handlers.get(event);
    if (!list) return false;
    const entry = list.find(e => e.id === id);
    if (!entry) return false;
    entry.enabled = !!enabled;
    this._auditLogger?.(`hook.enabled`, { event, id, enabled: entry.enabled });
    return true;
  }

  /**
   * Update handler timeout by id.
   */
  setTimeout(event, id, timeoutMs) {
    const list = this._handlers.get(event);
    if (!list) return false;
    const entry = list.find(e => e.id === id);
    if (!entry) return false;
    entry.timeout = Math.min(MAX_TIMEOUT_MS, Math.max(0, timeoutMs));
    this._auditLogger?.(`hook.timeout`, { event, id, timeout: entry.timeout });
    return true;
  }
}

module.exports = { HookBus };
