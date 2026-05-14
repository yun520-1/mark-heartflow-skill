/**
 * StateStore - Reactive State Manager
 * Source: ~/.heartflow/src/runtime/state-store.ts
 */

'use strict';

class StateStore {
  constructor(options = {}) {
    this._options = options;
    this._state = options.defaultState ?? {};
    this._listeners = new Set();
  }

  getState() {
    return { ...this._state };
  }

  setState(updater) {
    const prevState = { ...this._state };
    let partial;
    try {
      partial = typeof updater === 'function'
        ? updater(prevState)
        : updater;
    } catch (err) {
      console.error('[StateStore] updater error:', err);
      return;
    }
    this._state = { ...this._state, ...partial };

    for (const listener of this._listeners) {
      try { listener(this._state, prevState); } catch (err) {
        console.error('[StateStore] Listener error:', err);
      }
    }

    if (this._options.onSet) {
      try { this._options.onSet(this._state, prevState); } catch (err) {
        console.error('[StateStore] onSet error:', err);
      }
    }
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  subscribeOnce(listener) {
    const wrapped = (state, prev) => {
      this._listeners.delete(wrapped);
      listener(state, prev);
    };
    this._listeners.add(wrapped);
  }

  reset() {
    this._state = this._options.defaultState ?? {};
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this.setState({ [key]: value });
  }
}

function createStore(defaultState, options) {
  return new StateStore({ defaultState, ...options });
}

const globalStateStore = new StateStore();

module.exports = { StateStore, createStore, globalStateStore };
