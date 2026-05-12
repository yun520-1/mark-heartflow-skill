/**
 * HeartFlow Remediation Playbook
 * 心虫知行合一 · 自主修正手册
 * 
 * Based on: Ouro Loop modules/remediation.md
 * GitHub: VictorVVedtion/ouro-loop (MIT License)
 * 
 * 当 verifier-gates.js 五门验证失败时，
 * 触发对应的自主修正行动，不问人，自己决定执行。
 */

const VERDICT_ACTIONS = {
  STUCK: {
    // same error 3+ times
    condition: (gateResult) => 
      gateResult.gate === 'ROOT_CAUSE' && 
      gateResult.isSymptomFixing === true,
    actions: [
      { step: 1, action: 'revert', description: '回退到上一个已知正常状态' },
      { step: 2, action: 'reanalyze', description: '从零重新分析错误' },
      { step: 3, action: 'alternative', description: '尝试不同的方法' },
      { step: 4, action: 'escalate', condition: '3+ alternatives failed', description: '升级给人类' }
    ],
    reportTemplate: 'Stuck on [error] in [file]. Tried [N] approaches. Reverted to [commit]. Now trying [alternative].'
  },
  DRIFT: {
    // working on out-of-scope files
    condition: (gateResult) => 
      gateResult.gate === 'RELEVANCE' && 
      gateResult.verdict === 'FAIL',
    actions: [
      { step: 1, action: 'stash', description: '暂存超出范围的文件变更' },
      { step: 2, action: 'return', description: '回到计划范围内的任务' },
      { step: 3, action: 'log', description: '记录发现以备后续规划' }
    ],
    reportTemplate: 'Drifted to [files]. Stashed changes. Returned to Phase [N] scope.'
  },
  HALLUCINATION: {
    // referenced non-existent file/API
    condition: (gateResult) => 
      gateResult.gate === 'EXIST' && 
      gateResult.verdict === 'FAIL',
    actions: [
      { step: 1, action: 'remove', description: '移除不存在的引用' },
      { step: 2, action: 'search', description: '搜索正确的文件/API 名称' },
      { step: 3, action: 'correct', description: '用正确的引用更新代码' },
      { step: 4, action: 'reverify', description: '重新验证' }
    ],
    reportTemplate: 'Referenced non-existent [target]. Corrected to [actual].'
  },
  VELOCITY_DEATH: {
    // reading too much without writing
    condition: (gateResult) => 
      gateResult.gate === 'MOMENTUM' && 
      gateResult.verdict === 'FAIL',
    actions: [
      { step: 1, action: 'stop_reading', description: '停止阅读，总结已知内容' },
      { step: 2, action: 'decide', description: '基于现有认知做出决定（即使不完整）' },
      { step: 3, action: 'write', description: '写出一个测试、存根或原型' },
      { step: 4, action: 'iterate', description: '从那里继续迭代' }
    ],
    reportTemplate: 'Spent [N] actions reading. Decision: [action]. Moving forward.'
  },
  CONTEXT_DECAY: {
    // can't recall constraints
    condition: (gateResult) => 
      gateResult.gate === 'RECALL' && 
      gateResult.verdict === 'WARN',
    actions: [
      { step: 1, action: 'reread_bound', description: '重读 CORE_IDENTITY.md 的 BOUND 部分' },
      { step: 2, action: 'reread_phase_plan', description: '重读当前阶段计划' },
      { step: 3, action: 'summarize_constraints', description: '总结 3 条最重要的约束' }
    ],
    reportTemplate: 'Context decay detected. Re-read constraints: [summary].'
  }
};

class RemediationPlaybook {
  constructor() {
    this.actionHistory = [];
    this.retryCount = {};
  }

  /**
   * 根据验证结果决定修正策略
   */
  decide(gateResult) {
    for (const [name, rule] of Object.entries(VERDICT_ACTIONS)) {
      if (rule.condition(gateResult)) {
        const retryKey = gateResult.gate;
        this.retryCount[retryKey] = (this.retryCount[retryKey] || 0) + 1;

        const shouldEscalate = rule.actions.some(a => 
          a.action === 'escalate' && 
          this.retryCount[retryKey] >= 3
        );

        if (shouldEscalate) {
          return {
            verdict: 'ESCALATE',
            reason: '3+ retries failed',
            gate: gateResult.gate,
            recommendation: 'human_intervention_required'
          };
        }

        return {
          verdict: 'AUTONOMOUS',
          playbook: name,
          actions: rule.actions.filter(a => a.action !== 'escalate'),
          report: this._formatReport(rule.reportTemplate, gateResult)
        };
      }
    }

    return {
      verdict: 'NO_ACTION',
      reason: 'No remediation rule matched'
    };
  }

  /**
   * 执行修正
   */
  execute(decision) {
    if (decision.verdict === 'NO_ACTION') {
      return { executed: false, reason: decision.reason };
    }

    if (decision.verdict === 'ESCALATE') {
      return {
        executed: false,
        escalated: true,
        gate: decision.gate,
        recommendation: decision.recommendation
      };
    }

    const executed = [];
    for (const action of decision.actions) {
      executed.push({
        step: action.step,
        action: action.action,
        description: action.description,
        status: 'done'
      });
      this.actionHistory.push({ ...action, timestamp: Date.now() });
    }

    return {
      executed: true,
      playbook: decision.playbook,
      actions: executed,
      report: decision.report
    };
  }

  /**
   * 生成执行报告
   */
  _formatReport(template, gateResult) {
    return template
      .replace('[error]', gateResult.reason || 'unknown')
      .replace('[files]', (gateResult.outOfScope || []).join(', '))
      .replace('[N]', this.actionHistory.length.toString())
      .replace('[target]', (gateResult.failures || []).join(', '));
  }

  /**
   * 获取执行历史摘要
   */
  getHistorySummary() {
    return {
      totalActions: this.actionHistory.length,
      byType: this.actionHistory.reduce((acc, a) => {
        acc[a.action] = (acc[a.action] || 0) + 1;
        return acc;
      }, {}),
      retryCount: this.retryCount
    };
  }
}

module.exports = { RemediationPlaybook, VERDICT_ACTIONS };
