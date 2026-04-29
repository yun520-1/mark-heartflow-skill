/**
 * HeartFlow Self-Healing
 *
 * Lightweight recovery loop for agent runtime instability.
 * - detect repeated failures
 * - classify recovery path
 * - emit concrete repair hints
 */

class SelfHealing {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries ?? 2;
    this.backoffMs = options.backoffMs ?? 150;
    this.failureWindow = [];
  }

  normalizeError(errorLike = {}) {
    if (!errorLike) return { message: '', code: null, transient: false };
    if (typeof errorLike === 'string') {
      return this.normalizeError({ message: errorLike });
    }

    const message = String(
      errorLike.message || errorLike.error || errorLike.summary || ''
    );
    const code = errorLike.code || errorLike.statusCode || errorLike.status || null;
    const transient = /timeout|econnreset|eagain|temporar|busy|rate limit|429|throttle/i.test(message)
      || [408, 423, 425, 429, 500, 502, 503, 504].includes(Number(code));

    return { message, code, transient };
  }

  record(event = {}) {
    const normalized = this.normalizeError(event);
    const item = {
      type: String(event.type || 'unknown'),
      message: normalized.message,
      code: normalized.code,
      transient: normalized.transient,
      ts: Date.now(),
    };
    this.failureWindow.push(item);
    if (this.failureWindow.length > 20) this.failureWindow.shift();
    return item;
  }

  summarize() {
    const counts = this.failureWindow.reduce((acc, x) => {
      acc[x.type] = (acc[x.type] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: this.failureWindow.length,
      counts,
      summary: top ? `${top[0]} x${top[1]}` : 'no failures',
    };
  }

  shouldRetry(result = {}) {
    const normalized = this.normalizeError(result);
    return normalized.transient && (result.attempt || 0) < this.maxRetries;
  }

  repairHints(result = {}) {
    const message = this.normalizeError(result).message;
    const hints = [];
    if (/timeout/i.test(message)) hints.push('use smaller scope or longer timeout');
    if (/rate limit|429|throttle/i.test(message)) hints.push('pause and retry with exponential backoff');
    if (/syntax|parse|unexpected token/i.test(message)) hints.push('re-read the target file and patch smaller');
    if (/module not found|cannot find/i.test(message)) hints.push('verify imports and relative paths');
    if (/unknown option|invalid option/i.test(message)) hints.push('remove unsupported CLI flags');
    if (/execution_failed|invalid_structure/i.test(message)) hints.push('force structured result output before retrying');
    if (hints.length === 0) hints.push('reduce the failure surface and retry once');
    return [...new Set(hints)];
  }

  createRetryPlan(result = {}) {
    const attempt = Number(result.attempt || 0) + 1;
    const canRetry = this.shouldRetry({ ...result, attempt });
    const delay = this.backoffMs * Math.max(1, 2 ** (attempt - 1));
    return {
      attempt,
      canRetry,
      delay,
      strategy: canRetry ? 'exponential_backoff' : 'manual_repair',
    };
  }

  recover(result = {}) {
    const retry = this.createRetryPlan(result);
    const snapshot = this.summarize();
    return {
      ok: !!result.ok,
      attempt: retry.attempt,
      canRetry: retry.canRetry,
      backoffMs: retry.delay,
      strategy: retry.strategy,
      hints: this.repairHints(result),
      summary: snapshot.summary,
      details: snapshot,
      next_step: retry.canRetry ? 'retry' : 'repair',
    };
  }
}

module.exports = { SelfHealing };
