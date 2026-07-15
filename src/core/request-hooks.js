'use strict';

/**
 * HeartFlow Request/Response Interception Hooks
 *
 * Fires:
 *   request.normalize  — input sanitization/standardization
 *   request.validate   — validation, can abort
 *   request.logging    — request logging + traceId generation
 *   response.logging   — response logging + timing
 *
 * Usage:
 *   const { RequestHooks } = require('./request-hooks');
 *   const hooks = new RequestHooks({ bus: hf._hookBus });
 *   await hooks.fireRequest(ctx.request);
 *   // ... think ...
 *   await hooks.fireResponse(ctx.response);
 */

class RequestHooks {
  constructor(options = {}) {
    this.bus = options.bus || null;
    this._enabled = options.enabled !== false;
  }

  async fireRequest(requestCtx) {
    if (!this._enabled || !this.bus) return requestCtx;
    try {
      const ctx = { stage: 'request', hookName: 'request.normalize', timestamp: Date.now(), request: requestCtx, state: {}, meta: {} };
      await this.bus.fire('request', ctx);
      return ctx.request || requestCtx;
    } catch (_) {
      return requestCtx;
    }
  }

  async fireValidate(requestCtx) {
    if (!this._enabled || !this.bus) return { aborted: false };
    try {
      const ctx = { stage: 'request', hookName: 'request.validate', timestamp: Date.now(), request: requestCtx, state: {}, meta: {}, abort: false };
      await this.bus.fire('request.validate', ctx);
      return { aborted: !!ctx.abort, ctx };
    } catch (_) {
      return { aborted: false };
    }
  }

  async fireRequestLog(requestCtx) {
    if (!this._enabled || !this.bus) return;
    try {
      const traceId = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const ctx = { stage: 'request', hookName: 'request.logging', timestamp: Date.now(), request: requestCtx, state: {}, meta: { traceId } };
      await this.bus.fire('request.logging', ctx);
      return traceId;
    } catch (_) {
      return null;
    }
  }

  async fireResponseLog(responseCtx, traceId) {
    if (!this._enabled || !this.bus) return;
    try {
      const ctx = { stage: 'response', hookName: 'response.logging', timestamp: Date.now(), response: responseCtx, state: {}, meta: { traceId, durationMs: Date.now() - (responseCtx?.startTime || Date.now()) } };
      await this.bus.fire('response.logging', ctx);
    } catch (_) { /* ignore */ }
  }
}

module.exports = { RequestHooks };
