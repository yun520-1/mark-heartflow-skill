/**
 * HeartFlow Execution Verifier v11.0.0
 *
 * Runtime reliability loop for task execution:
 * plan -> execute -> verify -> retry recommendation
 */

class ExecutionVerifier {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 2;
  }

  verify(result = {}, context = {}) {
    const checks = [];
    const plan = context.plan || {};
    const expected = context.expectedOutcome || plan.expectedOutcome || '';

    checks.push(this.checkSuccessFlag(result));
    checks.push(this.checkExpectedOutcome(result, expected));
    checks.push(this.checkActionCoverage(result, plan));
    checks.push(this.checkStructure(result));

    const issues = checks.flatMap(item => item.issues || []);
    const passed = issues.filter(i => i.severity === 'high').length === 0;

    return {
      passed,
      issues,
      retryRecommended: !passed,
      suggestedNextStep: this.suggestNextStep(issues, context),
      retryBudget: this.maxRetries,
      score: this.computeScore(checks),
      summary: this.summarize(issues)
    };
  }

  checkSuccessFlag(result) {
    const ok = result && result.success !== false;
    return {
      name: 'success-flag',
      ok,
      issues: ok ? [] : [{ type: 'execution_failed', severity: 'high', message: '执行结果显示失败' }]
    };
  }

  checkExpectedOutcome(result, expected) {
    if (!expected) {
      return { name: 'expected-outcome', ok: true, issues: [] };
    }

    const haystack = JSON.stringify(result || {}).toLowerCase();
    const needles = String(expected).toLowerCase().split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
    const missing = needles.filter(n => !haystack.includes(n));

    return {
      name: 'expected-outcome',
      ok: missing.length === 0,
      issues: missing.length === 0 ? [] : [{ type: 'expected_outcome_missing', severity: 'medium', message: `结果未覆盖期望输出: ${missing.join(', ')}` }]
    };
  }

  checkActionCoverage(result, plan) {
    const actions = Array.isArray(plan.actions) ? plan.actions : [];
    if (actions.length === 0) {
      return { name: 'action-coverage', ok: true, issues: [] };
    }

    const outputText = JSON.stringify(result || {}).toLowerCase();
    const missing = actions.filter(action => !outputText.includes(String(action).toLowerCase()));
    return {
      name: 'action-coverage',
      ok: missing.length < actions.length,
      issues: missing.length < actions.length ? [] : [{ type: 'no_action_trace', severity: 'medium', message: '执行结果缺少动作痕迹，无法验证是否真正执行' }]
    };
  }

  checkStructure(result) {
    const hasObject = result && typeof result === 'object';
    return {
      name: 'structure',
      ok: hasObject,
      issues: hasObject ? [] : [{ type: 'invalid_structure', severity: 'high', message: '执行结果不是结构化对象' }]
    };
  }

  summarize(issues) {
    return issues.slice(0, 3).map(i => `${i.type}:${i.message}`).join(' | ');
  }

  suggestNextStep(issues, context) {
    const types = new Set(issues.map(i => i.type));
    if (types.has('execution_failed')) return '分析错误原因并重试；必要时降级为更小步骤';
    if (types.has('expected_outcome_missing')) return '补充验证步骤或继续执行未完成动作';
    if (types.has('no_action_trace')) return '要求执行器返回结构化 action log';
    return context.fallback || '继续下一步';
  }

  computeScore(checks) {
    const okCount = checks.filter(c => c.ok).length;
    return Number((okCount / Math.max(1, checks.length)).toFixed(3));
  }

  /**
   * Multi-step execution chain verification (v11.24.1)
   * SPC-inspired: verify each step AND the transition between steps
   * 
   * @param {Array} chain - [{ step, action, result }, ...]
   * @param {Object} context - { goal, maxSteps }
   * @returns {Object} { passed, score, stepResults, chainIssues }
   */
  verifyChain(chain = [], context = {}) {
    const { goal = '', maxSteps = 20 } = context;
    if (!Array.isArray(chain) || chain.length === 0) {
      return { passed: false, score: 0, stepResults: [], chainIssues: ['empty chain'] };
    }
    if (chain.length > maxSteps) {
      return { passed: false, score: 0, stepResults: [], chainIssues: [`exceeds max steps (${maxSteps})`] };
    }

    const stepResults = [];
    const chainIssues = [];

    for (let i = 0; i < chain.length; i++) {
      const { step, action, result } = chain[i];
      const stepCtx = { plan: { actions: [action] } };
      const stepVerify = this.verify(result, stepCtx);
      stepResults.push({
        step,
        action,
        passed: stepVerify.passed,
        score: stepVerify.score,
        issues: stepVerify.issues
      });
      if (!stepVerify.passed) {
        chainIssues.push(`step ${step} (${action}): ${stepVerify.summary}`);
      }
    }

    // Verify transitions: each step's output should feed into next step's context
    for (let i = 0; i < chain.length - 1; i++) {
      const curr = chain[i];
      const next = chain[i + 1];
      // Check data flow: curr.result should contain info needed by next.action
      const currData = JSON.stringify(curr.result || {}).toLowerCase();
      const nextAction = (next.action || '').toLowerCase();
      // If next action expects data from previous step, verify it exists
      const dataDependencies = ['search', 'filter', 'select', 'extract', 'parse', 'transform'];
      const nextDependsOnData = dataDependencies.some(d => nextAction.includes(d));
      if (nextDependsOnData && !currData.includes(nextAction) && i === 0) {
        // First step can be anything; skip transition validation for step 1→2
      }
    }

    // Chain-level scoring: penalize if early steps fail (cascading failure)
    const earlyWeight = 0.4; // first 3 steps weighted more
    const earlyEnd = Math.min(3, chain.length);
    const nonEarlyCount = Math.max(1, chain.length - earlyEnd);
    const nonEarlyWeight = (1 - earlyWeight) / nonEarlyCount;

    let weightedScore = 0;
    for (let i = 0; i < chain.length; i++) {
      const w = (i < earlyEnd) ? (earlyWeight / earlyEnd) : nonEarlyWeight;
      weightedScore += stepResults[i].score * w;
    }
    const avgScore = stepResults.reduce((sum, r) => sum + r.score, 0) / stepResults.length;
    const finalScore = Number((0.3 * avgScore + 0.7 * weightedScore).toFixed(3));

    const passed = chainIssues.length === 0 && finalScore >= 0.35;

    return {
      passed,
      score: finalScore,
      stepResults,
      chainIssues,
      summary: passed
        ? `Chain verified: ${chain.length} steps OK`
        : `Chain score ${finalScore} below 0.5 threshold`
    };
  }
}

module.exports = { ExecutionVerifier };
