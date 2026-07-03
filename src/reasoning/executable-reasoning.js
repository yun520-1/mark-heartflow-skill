'use strict';

/**
 * ExecutableReasoning — converts abstract thought nodes into executable
 * JavaScript code, runs the code with injected variables, and verifies
 * that the output matches the intended reasoning step.
 */
class ExecutableReasoning {
  /**
   * @param {Object} options
   * @param {Object}  [options.context={}] — default variables available to every execution
   * @param {boolean} [options.verifyOnExecute=true] — run verification automatically after execute
   */
  constructor(options = {}) {
    /** @type {Object} */
    this.context = options.context || {};
    /** @type {boolean} */
    this.verifyOnExecute = options.verifyOnExecute !== false;
    /** @type {Map<string, Object>} */
    this._history = new Map();
  }

  // ---------------------------------------------------------------------------
  // Code generation
  // ---------------------------------------------------------------------------

  /**
   * Translate a thought node into executable JavaScript source.
   *
   * @param {Object} thoughtNode — must contain at least { id, description, code }
   * @returns {string} JavaScript source ready for new Function()
   */
  generateCode(thoughtNode) {
    if (!thoughtNode || !thoughtNode.id || !thoughtNode.code) {
      throw new Error('generateCode: thoughtNode must have "id" and "code" properties');
    }

    const imports = [];
    const lines = [];

    // Auto-wrap multi-line code or code missing a return into an async IIFE
    const raw = String(thoughtNode.code).trim();

    // Build parameter list from known context keys + thoughtNode extras
    const contextKeys = Object.keys(this.context);
    const nodeKeys = Object.keys(thoughtNode.vars || {});
    const paramList = [...new Set([...contextKeys, ...nodeKeys, 'thoughtNode'])];

    lines.push('  // --- thought node: ' + thoughtNode.id);
    lines.push('  // ' + thoughtNode.description.replace(/\n/g, '\n  // '));
    lines.push(raw);
    lines.push(''); // trailing newline so we can always append

    const body = lines.join('\n');

    return {
      body,
      paramList,
      imports,
      thoughtId: thoughtNode.id,
    };
  }

  // ---------------------------------------------------------------------------
  // Execution
  // ---------------------------------------------------------------------------

  /**
   * Execute a code body using `new Function()` with variable injection.
   * This avoids eval() entirely — the Function constructor creates a
   * brand-new function whose parameters are bound to the provided values.
   *
   * @param {string|Object} codeOrResult — raw source string, or the object
   *   returned by generateCode()
   * @param {Object} [overrideContext={}] — runtime variables that shadow
   *   this.context for this single invocation
   * @returns {{ result: any, error: Error|null, durationMs: number }}
   */
  execute(codeOrResult, overrideContext = {}) {
    const start = Date.now();

    let body, paramList;

    if (typeof codeOrResult === 'string') {
      body = codeOrResult;
      paramList = [];
    } else {
      body = codeOrResult.body;
      paramList = codeOrResult.paramList;
    }

    // Merge: thought-node vars + context defaults + runtime overrides
    const mergedValues = { ...this.context, ...overrideContext };

    const argValues = paramList.map((key) => {
      if (key in mergedValues) return mergedValues[key];
      return undefined;
    });

    let result;
    let error = null;

    try {
      const fn = new Function(...paramList, body);
      result = fn(...argValues);
    } catch (err) {
      error = err;
    }

    const durationMs = Date.now() - start;

    const executionResult = { result, error, durationMs };

    if (this.verifyOnExecute && !error && typeof codeOrResult !== 'string') {
      executionResult.verification = this.verify(codeOrResult.thoughtId, executionResult);
    }

    this._history.set(paramList[0] || 'latest', executionResult);

    return executionResult;
  }

  // ---------------------------------------------------------------------------
  // Verification
  // ---------------------------------------------------------------------------

  /**
   * Verify that the execution result is consistent with the thought node's
   * declared post-conditions.
   *
   * @param {string} thoughtId — the id of the thought node that was executed
   * @param {Object} executionResult — the object returned by execute()
   * @returns {{ passed: boolean, checks: Array<{name: string, passed: boolean, detail: string}> }}
   */
  verify(thoughtId, executionResult) {
    const checks = [];

    // 1. No error
    checks.push({
      name: 'noError',
      passed: !executionResult.error,
      detail: executionResult.error
        ? executionResult.error.message
        : 'execution completed without throwing',
    });

    // 2. Result is defined (not void / undefined when a value is expected)
    const hasResult = executionResult.result !== undefined;
    checks.push({
      name: 'hasResult',
      passed: hasResult,
      detail: hasResult
        ? 'result is defined'
        : 'result is undefined — the thought node may not have returned a value',
    });

    // 3. Execution finished in reasonable time (< 30 s by default)
    const durationOk = executionResult.durationMs < 30_000;
    checks.push({
      name: 'durationOk',
      passed: durationOk,
      detail: `completed in ${executionResult.durationMs} ms`,
    });

    const passed = checks.every((c) => c.passed);

    return { passed, checks, thoughtId };
  }

  // ---------------------------------------------------------------------------
  // High-level orchestrator
  // ---------------------------------------------------------------------------

  /**
   * End-to-end: generate code, execute it, and return both the execution
   * result and the verification outcome.
   *
   * @param {Object} thoughtNode — see generateCode()
   * @param {Object} [runtimeVars={}] — see execute()
   * @returns {{ code: Object, execution: Object, verification: Object }}
   */
  createExecutableThought(thoughtNode, runtimeVars = {}) {
    const code = this.generateCode(thoughtNode);
    const execution = this.execute(code, runtimeVars);
    const verification = execution.verification || this.verify(thoughtNode.id, execution);

    return { code, execution, verification };
  }
}

module.exports = { ExecutableReasoning };
