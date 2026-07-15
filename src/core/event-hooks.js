'use strict';

/**
 * HeartFlow Event Lifecycle Hooks
 *
 * Fires:
 *   event.taskStart        — after successful decision routing, before module method execution
 *   event.taskComplete     — after successful execution
 *   event.taskFail         — on execution errors / rejected promises
 *   event.taskRetry        — before a retry is attempted
 *   event.error            — for uncaught exceptions and async hook delivery failures
 *
 * Includes a bounded dead-letter queue for failed async event emissions.
 */

const DEFAULT_MAX_DEAD_LETTERS = 200;

class EventHooks {
  constructor(options = {}) {
    this._handlers = {};
    this._deadLetters = [];
    this._maxDeadLetters = typeof options.maxDeadLetters === 'number' && options.maxDeadLetters > 0
      ? options.maxDeadLetters
      : DEFAULT_MAX_DEAD_LETTERS;
    this._enabled = options.enabled !== false;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * @param {'taskStart'|'taskComplete'|'taskFail'|'taskRetry'|'error'} event
   * @param {Function} handler
   */
  on(event, handler) {
    if (!this._enabled) return this;
    if (typeof handler !== 'function') return this;
    const key = String(event);
    (this._handlers[key] = this._handlers[key] || []).push(handler);
    return this;
  }

  off(event, handler) {
    const list = this._handlers[String(event)];
    if (!list) return this;
    this._handlers[String(event)] = list.filter(h => h !== handler);
    return this;
  }

  removeAll(event) {
    if (event) {
      delete this._handlers[String(event)];
    } else {
      this._handlers = {};
    }
    return this;
  }

  getDeadLetters() {
    return [...this._deadLetters];
  }

  getStats() {
    return {
      enabled: this._enabled,
      handlersByEvent: Object.fromEntries(
        Object.entries(this._handlers).map(([k, v]) => [k, v.length])
      ),
      deadLetterCount: this._deadLetters.length,
    };
  }

  reset() {
    this._handlers = {};
    this._deadLetters = [];
    return this;
  }

  // ─── Firing helpers ─────────────────────────────────────────────────────

  /**
   * @param {string} event
   * @param {object} payload
   */
  async fireAsync(event, payload = {}) {
    if (!this._enabled) return;
    const list = this._handlers[String(event)] || [];
    const results = [];

    for (const handler of list) {
      try {
        const result = await Promise.resolve(handler(payload));
        results.push({ ok: true, result });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this._recordDeadLetter(event, payload, errorMessage);
        results.push({ ok: false, error: errorMessage });
      }
    }

    return results;
  }

  /**
   * @param {string} event
   * @param {object} payload
   */
  fireSync(event, payload = {}) {
    if (!this._enabled) return [];
    const list = this._handlers[String(event)] || [];
    const results = [];

    for (const handler of list) {
      try {
        const result = handler(payload);
        results.push({ ok: true, result });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this._recordDeadLetter(event, payload, errorMessage);
        results.push({ ok: false, error: errorMessage });
      }
    }

    return results;
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  _recordDeadLetter(event, payload, error) {
    this._deadLetters.push({
      event,
      payload,
      error,
      timestamp: Date.now(),
    });
    if (this._deadLetters.length > this._maxDeadLetters) {
      this._deadLetters.shift();
    }
  }
}

module.exports = { EventHooks };
