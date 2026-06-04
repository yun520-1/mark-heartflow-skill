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

    for (const [dim, score] of Object.entries(dimensions)) {
      const weight = weights[dim] || 0.1;
      weightedSum += score * weight;
      totalWeight += weight;
    }

    const weighted = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(3)) : 1.0;

    return {
      weighted,
      dimensions,
      raw: checks.filter(c => c.ok).length / Math.max(1, checks.length)
    };
  }

  /**
   * Generate a human-readable summary
   */
  summarize(status, issues, score) {
    const parts = [];

    if (status === ResultStatus.SUCCESS) {
      parts.push(`✅ 验证通过 (得分: ${score})`);
    } else if (status === ResultStatus.PARTIAL) {
      const partialCount = issues.filter(i => i.category === ErrorCategory.PARTIAL).length;
      parts.push(`⚠️ 部分通过 (得分: ${score}, ${partialCount}项部分完成)`);
    } else if (status === ResultStatus.TIMEOUT) {
      parts.push(`⏰ 执行超时 (得分: ${score})`);
    } else if (status === ResultStatus.SIDE_EFFECT) {
      parts.push(`🔒 检测到副作用 (得分: ${score})`);
    } else {
      parts.push(`❌ 验证失败 (得分: ${score}, ${issues.length}个问题)`);
    }

    // Add top issues (max 3)
    const topIssues = issues.slice(0, 3);
    for (const issue of topIssues) {
      parts.push(`  [${issue.severity}] ${issue.message}`);
    }

    if (issues.length > 3) {
      parts.push(`  ... 以及 ${issues.length - 3} 个其他问题`);
    }

    return parts.join('\n');
  }

  /**
   * Record verification in history ring buffer
   */
  recordVerification(verification) {
    this.verificationHistory.push({
      timestamp: Date.now(),
      status: verification.status,
      score: verification.score,
      issueCount: verification.issues.length,
      dominantCategory: verification.errorClassification.dominantCategory,
      verificationId: verification.verificationId
    });

    // Trim history to max size
    if (this.verificationHistory.length > this.maxHistorySize) {
      this.verificationHistory = this.verificationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get verification history with optional filter
   */
  getHistory(options = {}) {
    const { limit = 10, statusFilter, categoryFilter } = options;
    let filtered = [...this.verificationHistory];

    if (statusFilter) {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter(v => v.dominantCategory === categoryFilter);
    }

    return filtered.slice(-limit);
  }

  /**
   * Analyze verification history for patterns
   */
  analyzeHistory(options = {}) {
    const history = this.getHistory({ limit: options.limit || this.verificationHistory.length });

    if (history.length === 0) {
      return { hasHistory: false, message: '暂无验证历史记录' };
    }

    const statusCounts = {};
    const categoryCounts = {};
    let totalScore = 0;
    let failures = 0;

    for (const v of history) {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
      categoryCounts[v.dominantCategory] = (categoryCounts[v.dominantCategory] || 0) + 1;
      totalScore += v.score;
      if (v.status !== ResultStatus.SUCCESS) failures++;
    }

    const failureRate = Number((failures / history.length).toFixed(3));
    const avgScore = Number((totalScore / history.length).toFixed(3));

    // Find most common failure pattern
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      hasHistory: true,
      totalVerifications: history.length,
      averageScore: avgScore,
      failureRate,
      statusDistribution: statusCounts,
      mostCommonFailureCategory: sortedCategories.length > 0 ? sortedCategories[0][0] : null,
      categoryDistribution: categoryCounts,
      trend: avgScore > 0.8 ? 'stable' : (avgScore > 0.5 ? 'needs_attention' : 'critical')
    };
  }

  /**
   * Legacy support — backward compatible suggestNextStep
   */
  suggestNextStep(issues, context) {
    const types = new Set(issues.map(i => i.type));
    if (types.has('execution_failed')) return '分析错误原因并重试；必要时降级为更小步骤';
    if (types.has('expected_outcome_missing')) return '补充验证步骤或继续执行未完成动作';
    if (types.has('no_action_trace')) return '要求执行器返回结构化 action log';
    return context.fallback || '继续下一步';
  }

  /**
   * Legacy support — backward compatible computeScore
   */
  computeScore(checks) {
    const okCount = checks.filter(c => c.ok).length;
    return Number((okCount / Math.max(1, checks.length)).toFixed(3));
  }

  /**
   * Get the result status enum
   */
  static getStatusEnum() {
    return ResultStatus;
  }

  /**
   * Get the error category enum
   */
  static getErrorCategories() {
    return ErrorCategory;
  }

  /**
   * Get retry strategies reference
   */
  static getRetryStrategies() {
    return RETRY_STRATEGIES;
  }
}

module.exports = { ExecutionVerifier, ResultStatus, ErrorCategory };
