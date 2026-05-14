/**
 * Event Bus - 引擎间通信
 * Source: ~/.heartflow/src/runtime/event-bus.ts
 */

'use strict';

class EventBus {
  constructor() {
    this._handlers = new Map();
    this._log = [];
  }

  on(type, handler) {
    if (!this._handlers.has(type)) {
      this._handlers.set(type, new Set());
    }
    this._handlers.get(type).add(handler);
    return () => { const set = this._handlers.get(type); if (set) set.delete(handler); };
  }

  emit(type, source, data) {
    const event = { type, timestamp: Date.now(), source, data };
    this._log.push(event);
    if (this._log.length > 1000) this._log.splice(0, this._log.length - 1000); // cap log size
    for (const h of this._handlers.get(type) ?? []) {
      try { h(event); } catch { /* continue to next handler */ }
    }
    for (const h of this._handlers.get('*') ?? []) {
      try { h(event); } catch { /* continue to next handler */ }
    }
  }

  getLog() {
    return [...this._log];
  }

  clearLog() {
    this._log = [];
  }

  removeAllListeners() {
    this._handlers.clear();
    this._log = [];
  }
}

const globalEventBus = new EventBus();

module.exports = { EventBus, globalEventBus };
