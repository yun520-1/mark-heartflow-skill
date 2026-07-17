/**
 * HeartFlow Execution Verifier v11.1.0
 *
 * Runtime reliability loop for task execution:
 * plan -> execute -> verify -> classify -> retry recommendation
 *
 * Upgraded with:
 * - ResultStatus enum (SUCCESS/PARTIAL/FAILED/TIMEOUT/SIDE_EFFECT)
 * - Error classification system (execution/logic/timeout/side-effect/structural)
 * - Retry strategy recommendation per error category
 * - Timing verification with configurable timeout
 * - Verification history tracking
 * - Partial success detection
 * - Side-effect detection in result objects
 * - Weighted quality scoring with dimension breakdown
 */

// === Result Status Enum ===
const ResultStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  SIDE_EFFECT: 'side_effect',
  UNKNOWN: 'unknown'
};

// === Error Classification ===
const ErrorCategory = {
  EXECUTION: 'execution',
  LOGIC: 'logic',
  TIMEOUT: 'timeout',
  SIDE_EFFECT: 'side_effect',
  STRUCTURAL: 'structural',
  PARTIAL: 'partial',
  UNKNOWN: 'unknown'
};

// === Retry Strategy Definitions ===
const RETRY_STRATEGIES = {
  [ErrorCategory.EXECUTION]: {
    strategy: 'immediate_retry',
    action: 'Rerun with same parameters — likely transient failure',
    maxRetries: 3,
    backoffMs: 500
  },
  [ErrorCategory.LOGIC]: {
    strategy: 'decompose_and_retry',
    action: 'Break task into smaller steps and retry each independently',
    maxRetries: 2,
    backoffMs: 1000
  },
  [ErrorCategory.TIMEOUT]: {
    strategy: 'reduce_scope',
    action: 'Reduce task scope or increase timeout, retry with bounded iteration count',
    maxRetries: 2,
    backoffMs: 2000
  },
  [ErrorCategory.SIDE_EFFECT]: {
    strategy: 'isolate_and_retry',
    action: 'Isolate execution context (sandbox/fresh state), verify no collateral damage',
    maxRetries: 1,
    backoffMs: 100
  },
  [ErrorCategory.STRUCTURAL]: {
    strategy: 'fix_input_format',
    action: 'Validate and fix input/output structure before retrying',
    maxRetries: 2,
    backoffMs: 500
  },
  [ErrorCategory.PARTIAL]: {
    strategy: 'continue_partial',
    action: 'Accept partial success — execute only the missing steps',
    maxRetries: 2,
    backoffMs: 300
  },
  [ErrorCategory.UNKNOWN]: {
    strategy: 'diagnostic_retry',
    action: 'Run diagnostic mode to gather more information, then retry',
    maxRetries: 1,
    backoffMs: 1000
  }
};

class ExecutionVerifier {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 2;
    this.defaultTimeout = options.defaultTimeout || 30000; // 30s default timeout
    this.verificationHistory = [];
    this.maxHistorySize = options.maxHistorySize || 50;
    this.sideEffectAllowlist = options.sideEffectAllowlist || ['timestamp', 'id', 'version', 'duration_ms'];
  }

  /**
   * Main verification entry point
   * @param {Object} result - The execution result object
   * @param {Object} context - Verification context (plan, expected, timeout, etc.)
   */
  verify(result = {}, context = {}) {
    const startTime = Date.now();
    const plan = context.plan || {};
    const expected = context.expectedOutcome || plan.expectedOutcome || '';
    const timeout = context.timeout || this.defaultTimeout;

    // Run all checks
    const checks = [
      this.checkSuccessFlag(result),
      this.checkExpectedOutcome(result, expected),
      this.checkActionCoverage(result, plan),
      this.checkStructure(result),
      this.checkTiming(result, timeout),
      this.checkSideEffects(result, plan)
    ];

    const issues = checks.flatMap(item => item.issues || []);
    const status = this.determineStatus(checks, issues);

    // Classify errors
    const errorClassification = this.classifyErrors(issues);

    // Determine retry strategy
    const retryStrategy = this.recommendRetryStrategy(errorClassification, context);

    // Compute weighted score
    const scoreBreakdown = this.computeScoreBreakdown(checks);
    const overallScore = scoreBreakdown.weighted;

    // Build verification record
    const verification = {
      status,
      issues,
      errorClassification,
      retryStrategy,
      score: overallScore,
      scoreBreakdown,
      summary: this.summarize(status, issues, overallScore),
      verificationId: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      duration_ms: Date.now() - startTime,
      suggestedNextStep: retryStrategy.suggestedNextStep
    };

    // Track history
    this.recordVerification(verification);

    // Return with backward-compatible fields
    return {
      ...verification,
      passed: status === ResultStatus.SUCCESS,
      retryRecommended: status !== ResultStatus.SUCCESS,
      retryBudget: retryStrategy.recommendedMaxRetries
    };
  }

  /**
   * Check if the execution success flag is present
   */
  checkSuccessFlag(result) {
    const ok = result && result.success !== false;
    return {
      name: 'success-flag',
      ok,
      issues: ok ? [] : [{ type: 'execution_failed', severity: 'high', category: ErrorCategory.EXECUTION, message: '执行结果显示失败' }]
    };
  }

  /**
   * Check if expected outcomes are present in the result
   */
  checkExpectedOutcome(result, expected) {
    if (!expected) {
      return { name: 'expected-outcome', ok: true, issues: [] };
    }

    const haystack = JSON.stringify(result || {}).toLowerCase();
    const needles = String(expected).toLowerCase().split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
    const missing = needles.filter(n => !haystack.includes(n));
    const foundCount = needles.length - missing.length;

    // Partial: some expected outcomes found but not all
    if (missing.length > 0 && foundCount > 0) {
      return {
        name: 'expected-outcome',
        ok: false,
        issues: [{ type: 'expected_outcome_partial', severity: 'medium', category: ErrorCategory.PARTIAL, message: `部分期望输出缺失: ${missing.join(', ')} (找到 ${foundCount}/${needles.length})` }]
      };
    }

    return {
      name: 'expected-outcome',
      ok: missing.length === 0,
      issues: missing.length === 0 ? [] : [{ type: 'expected_outcome_missing', severity: 'high', category: ErrorCategory.LOGIC, message: `结果未覆盖期望输出: ${missing.join(', ')}` }]
    };
  }

  /**
   * Check if actions from the plan are traceable in results
   */
  checkActionCoverage(result, plan) {
    const actions = Array.isArray(plan.actions) ? plan.actions : [];
    if (actions.length === 0) {
      return { name: 'action-coverage', ok: true, issues: [] };
    }

    const outputText = JSON.stringify(result || {}).toLowerCase();
    const missing = actions.filter(action => !outputText.includes(String(action).toLowerCase()));
    const foundCount = actions.length - missing.length;

    // Partial action coverage
    if (missing.length > 0 && foundCount > 0) {
      return {
        name: 'action-coverage',
        ok: false,
        issues: [{ type: 'partial_action_coverage', severity: 'low', category: ErrorCategory.PARTIAL, message: `部分动作可追溯 (${foundCount}/${actions.length})，缺失: ${missing.slice(0, 3).join(', ')}` }]
      };
    }

    return {
      name: 'action-coverage',
      ok: missing.length < actions.length,
      issues: missing.length < actions.length ? [] : [{ type: 'no_action_trace', severity: 'medium', category: ErrorCategory.EXECUTION, message: '执行结果缺少动作痕迹，无法验证是否真正执行' }]
    };
  }

  /**
   * Check result structure validity
   */
  checkStructure(result) {
    const hasObject = result && typeof result === 'object';
    const hasContent = hasObject && Object.keys(result).length > 0;

    if (!hasObject) {
      return {
        name: 'structure',
        ok: false,
        issues: [{ type: 'invalid_structure', severity: 'high', category: ErrorCategory.STRUCTURAL, message: '执行结果不是结构化对象' }]
      };
    }

    if (!hasContent) {
      return {
        name: 'structure',
        ok: false,
        issues: [{ type: 'empty_structure', severity: 'medium', category: ErrorCategory.STRUCTURAL, message: '执行结果是空对象，无有效内容' }]
      };
    }

    return { name: 'structure', ok: true, issues: [] };
  }

  /**
   * Check if execution exceeded the expected timeout
   */
  checkTiming(result, timeoutMs) {
    const executionTime = result.duration_ms || result.executionTime || result.timing;
    if (!executionTime) {
      return { name: 'timing', ok: true, issues: [] };
    }

    const duration = typeof executionTime === 'number' ? executionTime : parseInt(executionTime, 10);
    if (isNaN(duration)) {
      return { name: 'timing', ok: true, issues: [] };
    }

    if (duration > timeoutMs) {
      return {
        name: 'timing',
        ok: false,
        issues: [{
          type: 'execution_timeout',
          severity: 'medium',
          category: ErrorCategory.TIMEOUT,
          message: `执行超时: ${duration}ms (限制: ${timeoutMs}ms)`,
          duration,
          limit: timeoutMs,
          overByMs: duration - timeoutMs
        }]
      };
    }

    // Warning: near timeout (within 80%)
    if (duration > timeoutMs * 0.8) {
      return {
        name: 'timing',
        ok: true,
        issues: [{
          type: 'near_timeout_warning',
          severity: 'low',
          category: ErrorCategory.TIMEOUT,
          message: `执行接近超时阈值: ${duration}ms / ${timeoutMs}ms (${Math.round(duration / timeoutMs * 100)}%)`,
          duration,
          limit: timeoutMs
        }]
      };
    }

    return { name: 'timing', ok: true, issues: [] };
  }

  /**
   * Detect unexpected side effects in the result
   */
  checkSideEffects(result, plan) {
    if (!result || typeof result !== 'object') {
      return { name: 'side-effects', ok: true, issues: [] };
    }

    const expectedKeys = new Set([
      'success', 'result', 'data', 'output', 'message', 'error',
      'duration_ms', 'executionTime', 'timing', 'actions', 'logs',
      'status', 'id', 'version', 'timestamp', 'warnings',
      ...(plan.expectedKeys || []),
      ...this.sideEffectAllowlist
    ]);

    const actualKeys = Object.keys(result);
    const unexpected = actualKeys.filter(k => !expectedKeys.has(k));

    if (unexpected.length > 0) {
      // Flag high-severity if unexpected keys contain sensitive-sounding names
      const sensitivePatterns = ['password', 'secret', 'token', 'key', 'credential', 'auth', 'private'];
      const hasSensitive = unexpected.some(k => sensitivePatterns.some(p => k.toLowerCase().includes(p)));

      return {
        name: 'side-effects',
        ok: !hasSensitive,
        issues: [{
          type: hasSensitive ? 'sensitive_side_effect' : 'unexpected_side_effect',
          severity: hasSensitive ? 'high' : 'low',
          category: ErrorCategory.SIDE_EFFECT,
          message: hasSensitive
            ? `检测到可能敏感的输出字段: ${unexpected.join(', ')} — 建议隔离执行上下文`
            : `检测到非预期输出字段: ${unexpected.join(', ')}`,
          unexpectedKeys: unexpected
        }]
      };
    }

    return { name: 'side-effects', ok: true, issues: [] };
  }

  /**
   * Determine overall execution status from all checks
   */
  determineStatus(checks, issues) {
    const hasHigh = issues.some(i => i.severity === 'high');
    const hasSensitiveSideEffect = issues.some(i => i.type === 'sensitive_side_effect');
    const hasTimeout = issues.some(i => i.type === 'execution_timeout');
    const hasPartial = issues.some(i => i.category === ErrorCategory.PARTIAL);
    const hasMedium = issues.some(i => i.severity === 'medium' && i.category !== ErrorCategory.PARTIAL);

    if (hasSensitiveSideEffect) return ResultStatus.SIDE_EFFECT;
    if (hasTimeout) return ResultStatus.TIMEOUT;
    if (hasHigh) return ResultStatus.FAILED;
    if (hasPartial && hasMedium) return ResultStatus.PARTIAL;
    if (hasPartial) return ResultStatus.PARTIAL;
    if (hasMedium) return ResultStatus.PARTIAL;
    if (issues.length === 0) return ResultStatus.SUCCESS;

    return ResultStatus.UNKNOWN;
  }

  /**
   * Classify errors by category for targeted handling
   */
  classifyErrors(issues) {
    const classification = {
      [ErrorCategory.EXECUTION]: { count: 0, items: [] },
      [ErrorCategory.LOGIC]: { count: 0, items: [] },
      [ErrorCategory.TIMEOUT]: { count: 0, items: [] },
      [ErrorCategory.SIDE_EFFECT]: { count: 0, items: [] },
      [ErrorCategory.STRUCTURAL]: { count: 0, items: [] },
      [ErrorCategory.PARTIAL]: { count: 0, items: [] },
      [ErrorCategory.UNKNOWN]: { count: 0, items: [] }
    };

    for (const issue of issues) {
      const category = issue.category || ErrorCategory.UNKNOWN;
      if (!classification[category]) {
        classification[category] = { count: 0, items: [] };
      }
      classification[category].count++;
      classification[category].items.push(issue);
    }

    // Determine dominant category
    let dominantCategory = ErrorCategory.UNKNOWN;
    let maxCount = 0;
    for (const [cat, data] of Object.entries(classification)) {
      if (data.count > maxCount) {
        maxCount = data.count;
        dominantCategory = cat;
      }
    }

    // Highest severity category overrides count
    const severityOrder = ['high', 'medium', 'low'];
    for (const severity of severityOrder) {
      for (const [cat, data] of Object.entries(classification)) {
        if (data.items.some(i => i.severity === severity)) {
          dominantCategory = cat;
          break;
        }
      }
      if (dominantCategory) break;
    }

    return {
      categories: classification,
      dominantCategory,
      totalIssues: issues.length,
      highSeverityCount: issues.filter(i => i.severity === 'high').length,
      mediumSeverityCount: issues.filter(i => i.severity === 'medium').length,
      lowSeverityCount: issues.filter(i => i.severity === 'low').length
    };
  }

  /**
   * Recommend optimal retry strategy based on error classification
   */
  recommendRetryStrategy(errorClassification, context) {
    const { dominantCategory, highSeverityCount, totalIssues } = errorClassification;
    const strategy = RETRY_STRATEGIES[dominantCategory] || RETRY_STRATEGIES[ErrorCategory.UNKNOWN];
    const attemptedRetries = context.attemptedRetries || 0;
    const remainingRetries = Math.max(0, strategy.maxRetries - attemptedRetries);

    // No issues — no retry needed
    if (totalIssues === 0) {
      return {
        needsRetry: false,
        strategy: 'none',
        suggestedNextStep: '验证通过，继续下一步',
        recommendedMaxRetries: 0,
        reason: '未检测到问题'
      };
    }

    // Max retries exceeded
    if (attemptedRetries >= strategy.maxRetries) {
      return {
        needsRetry: false,
        strategy: 'escalate',
        suggestedNextStep: `已达最大重试次数 (${strategy.maxRetries})，需要人工介入`,
        recommendedMaxRetries: 0,
        reason: `超过最大重试次数 (${strategy.maxRetries})`
      };
    }

    // High severity — always retry
    if (highSeverityCount > 0 && remainingRetries > 0) {
      return {
        needsRetry: true,
        strategy: strategy.strategy,
        suggestedNextStep: strategy.action,
        recommendedMaxRetries: remainingRetries,
        backoffMs: strategy.backoffMs * (attemptedRetries + 1), // exponential backoff
        reason: `主导错误类别: ${dominantCategory}`
      };
    }

    // Low severity — may not need retry
    if (totalIssues > 0 && errorClassification.highSeverityCount === 0) {
      return {
        needsRetry: true,
        strategy: strategy.strategy,
        suggestedNextStep: strategy.action,
        recommendedMaxRetries: Math.min(remainingRetries, 1),
        backoffMs: strategy.backoffMs,
        reason: `低严重度问题 (${totalIssues}项)，建议修复后重试`
      };
    }

    // Fallback
    return {
      needsRetry: false,
      strategy: 'continue',
      suggestedNextStep: context.fallback || '继续下一步',
      recommendedMaxRetries: 0,
      reason: '无需重试'
    };
  }

  /**
   * Compute weighted score with dimension breakdown
   */
  computeScoreBreakdown(checks) {
    const dimensions = {};

    for (const check of checks) {
      dimensions[check.name] = check.ok ? 1.0 : 0.0;
    }

    // Weight by importance
    const weights = {
      'success-flag': 0.3,
      'expected-outcome': 0.25,
      'action-coverage': 0.15,
      'structure': 0.15,
      'timing': 0.1,
      'side-effects': 0.05
    };

    let weightedSum = 0;
    let totalWeight = 0;
    const dimensionScores = {};

    for (const check of checks) {
      const weight = weights[check.name] || 0.1;
      totalWeight += weight;
      if (check.ok) {
        weightedSum += weight;
        dimensionScores[check.name] = { score: 1.0, weight, weighted: weight };
      } else {
        dimensionScores[check.name] = { score: 0.0, weight, weighted: 0 };
      }
    }

    const weighted = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      weighted,
      dimensions: dimensionScores,
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.ok).length
    };
  }
}

module.exports = { ExecutionVerifier, ResultStatus, ErrorCategory, RETRY_STRATEGIES };
