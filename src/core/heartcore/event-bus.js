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
    return () => this._handlers.get(type)?.delete(handler);
  }

  emit(type, source, data) {
    const event = { type, timestamp: Date.now(), source, data };
    this._log.push(event);
    this._handlers.get(type)?.forEach(h => h(event));
    this._handlers.get('*')?.forEach(h => h(event));
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
