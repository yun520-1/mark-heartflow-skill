/**
 * HeartFlow Agent Execution Loop v11.19.5
 * 
 * 将所有核心验证模块串联成完整闭环：
 * 
 * 流程:
 *   输入 → SelfBoundary(递弱代偿评估)
 *        → DecisionVerifier.verify() (决策验证)
 *        → DecisionVerifier.selfVerify() (决策自我验证)
 *        → AgentOrchestrator.executeDAG() (执行)
 *        → ExecutionVerifier.verify() (执行验证)
 *        → CriticAgent.verify() (批评)
 *        → CriticHealingBridge (修复)
 *        → SelfHealing.record() (学习)
 * 
 * 集成的模块:
 *   - SelfBoundary: 递弱代偿评估
 *   - DecisionVerifier: 决策验证 + 自我验证
 *   - ExecutionVerifier: 执行验证
 *   - CriticAgent: 批评生成
 *   - CriticHealingBridge: 批评→修复闭环
 *   - SelfHealing: 修复学习
 * 
 * 这是 v11.19.5 的核心落地：将所有散落的验证器串联成一条验证链
 */

const SelfBoundary = require('./self-boundary.js');
const { DecisionVerifier } = require('./decision-verifier.js');
const { ExecutionVerifier } = require('./execution-verifier.js');
const CriticAgent = require('./critic-agent.js');
const { CriticHealingBridge } = require('./critic-healing-bridge.js');
const { AgentOrchestrator } = require('./agents/AgentManager.js');

class AgentExecutionLoop {
  constructor(options = {}) {
    this.selfBoundary = new SelfBoundary(options.boundaryOptions || {});
    this.decisionVerifier = new DecisionVerifier(options.decisionOptions || {});
    this.executionVerifier = new ExecutionVerifier(options.executionOptions || {});
    this.criticAgent = new CriticAgent(options.criticOptions || { verbose: false });
    this.healingBridge = new CriticHealingBridge(options.healingOptions || {});
    
    // AgentOrchestrator 延迟初始化
    this._orchestrator = null;
    
    // 选项
    this.options = {
      skipBoundary: options.skipBoundary || false,
      skipDecisionVerify: options.skipDecisionVerify || false,
      skipCritic: options.skipCritic || false,
      maxRetries: options.maxRetries || 3,
      enforceDecisionThreshold: options.enforceDecisionThreshold ?? 0.6,
      enforceExecutionThreshold: options.enforceExecutionThreshold ?? 0.5,
      ...options,
    };
    
    this.stats = {
      totalRuns: 0,
      boundaryRejected: 0,
      decisionRejected: 0,
      executionFailed: 0,
      healingTriggered: 0,
      retries: 0,
    };
  }

  get orchestrator() {
    if (!this._orchestrator) {
      this._orchestrator = new AgentOrchestrator();
    }
    return this._orchestrator;
  }

  // ============================================================
  // 主入口: run(input, context) → result
  // ============================================================

  /**
   * 完整执行闭环
   * 
   * @param {string} input - 用户输入/任务描述
   * @param {Object} context - { task, plan, previousAttempts, ... }
   * @returns {Object} 完整执行结果
   */
  async run(input, context = {}) {
    this.stats.totalRuns++;
    
    const result = {
      input,
      timestamp: Date.now(),
      stages: {},
      overallPassed: false,
      repairSteps: [],
    };

    // === 阶段0: 递弱代偿边界评估 ===
    if (!this.options.skipBoundary) {
      const boundaryResult = this._runBoundaryCheck(input, context);
      result.stages.boundary = boundaryResult;
      
      if (boundaryResult.status === 'RECOGNIZED') {
        // 触碰已知边界，拒绝执行
        result.overallPassed = false;
        result.rejectedAt = 'boundary';
        result.verdict = 'boundary_rejected';
        return result;
      }
    }

    // === 阶段1: 决策验证 ===
    const decisionRecord = this._buildDecisionRecord(input, context);
    
    if (!this.options.skipDecisionVerify) {
      const dvResult = this.decisionVerifier.verify(decisionRecord);
      const svResult = this.decisionVerifier.selfVerify(decisionRecord);
      
      result.stages.decision = {
        verify: dvResult,
        selfVerify: svResult,
        combinedScore: (dvResult.score + svResult.score) / 2,
      };
      
      const combinedScore = result.stages.decision.combinedScore;
      if (combinedScore < this.options.enforceDecisionThreshold) {
        result.overallPassed = false;
        result.rejectedAt = 'decision';
        result.verdict = 'decision_rejected';
        result.repairHints = dvResult.repairHints || [];
        this.stats.decisionRejected++;
        return result;
      }
    }

    // === 阶段2: Agent 执行 ===
    let agentResult;
    try {
      agentResult = await this.orchestrator.executeDAG({
        message: input,
        ...context,
      });
      result.stages.agent = agentResult;
    } catch (error) {
      result.stages.agent = { error: error.message, success: false };
      agentResult = { success: false, error: error.message };
    }

    // === 阶段3: 执行验证 ===
    const evResult = this.executionVerifier.verify(agentResult, {
      plan: context.plan || {},
      expectedOutcome: decisionRecord.expectedOutcome || '',
    });
    result.stages.execution = evResult;

    // === 阶段4: 批评验证 ===
    if (!this.options.skipCritic) {
      const criticResult = await this.criticAgent.verify(
        { description: input },
        agentResult,
        context
      );
      result.stages.critic = criticResult;

      // === 阶段5: 批评→修复闭环 ===
      if (!criticResult.success) {
        const bridgeResult = this.healingBridge.bridge(criticResult, {
          task: { description: input },
          result: agentResult,
          previousAttempts: context.previousAttempts || [],
          decisionRecord,
        });
        result.stages.healing = bridgeResult;
        result.repairSteps = bridgeResult.repairSteps || [];
        
        if (bridgeResult.shouldRetry && bridgeResult.repairSteps.length > 0) {
          this.stats.healingTriggered++;
          
          // 自动重试（如果还有预算）
          const retryBudget = bridgeResult.retryBudget || 0;
          if (retryBudget > 0 && context.previousAttempts?.length < this.options.maxRetries) {
            const retryResult = await this._runWithRepair(input, context, bridgeResult, decisionRecord);
            result.retryResult = retryResult;
            this.stats.retries++;
            
            if (retryResult.overallPassed) {
              result.overallPassed = true;
              result.verdict = 'passed_on_retry';
              return result;
            }
          }
        }
      }
    }

    // 整体判定
    result.overallPassed = evResult.passed;
    result.verdict = evResult.passed ? 'passed' : 'failed';
    
    if (!evResult.passed) {
      this.stats.executionFailed++;
    }

    return result;
  }

  // ============================================================
  // 各阶段实现
  // ============================================================

  _runBoundaryCheck(input, context) {
    const boundaryResult = this.selfBoundary.assess({
      claim: input,
      task: input,
      domain: context.domain || '',
      requiresEvidence: context.requiresEvidence || false,
      isMoralJudgment: context.isMoralJudgment || false,
      isFuturePrediction: context.isFuturePrediction || false,
      isAbsoluteTruth: context.isAbsoluteTruth || false,
    });

    return {
      status: boundaryResult.boundary,  // CORE | CAUTIOUS | RECOGNIZED
      confidence: boundaryResult.confidence,
      canProceed: boundaryResult.canProceed,
      shouldRequestEvidence: boundaryResult.shouldRequestEvidence,
      signals: boundaryResult.signals,
      recommendedAction: boundaryResult.recommendedAction,
    };
  }

  _buildDecisionRecord(input, context = {}) {
    return {
      decision: input,
      reason: context.reason || `处理任务: ${String(input).slice(0, 50)}`,
      evidence: context.evidence || [],
      risks: context.risks || [],
      expectedOutcome: context.expectedOutcome || '',
      userGoal: context.userGoal || input,
      constraints: context.constraints || [],
      confidence: context.confidence || 0.5,
    };
  }

  async _runWithRepair(input, context, bridgeResult, decisionRecord) {
    // 按照 repairSteps 重新执行
    const repairSteps = bridgeResult.repairSteps || [];
    
    // 简化策略：从 repairSteps 中提取关键信息，构造新的执行上下文
    const repairedContext = {
      ...context,
      repairAttempt: true,
      repairStrategy: bridgeResult.strategy,
      previousAttempts: [...(context.previousAttempts || []), { bridgeResult, decisionRecord }],
    };

    // 直接重试一次（不做复杂的步进式修复，保持简单）
    try {
      const retryResult = await this.orchestrator.executeDAG({
        message: input,
        ...repairedContext,
      });
      
      // 验证重试结果
      const evRetry = this.executionVerifier.verify(retryResult, {
        plan: context.plan || {},
        expectedOutcome: decisionRecord.expectedOutcome || '',
      });

      return {
        overallPassed: evRetry.passed,
        retryResult,
        execution: evRetry,
        verdict: evRetry.passed ? 'retry_passed' : 'retry_failed',
      };
    } catch (error) {
      return {
        overallPassed: false,
        error: error.message,
        verdict: 'retry_error',
      };
    }
  }

  // ============================================================
  // 单独使用各阶段
  // ============================================================

  assessBoundary(input, context = {}) {
    return this._runBoundaryCheck(input, context);
  }

  verifyDecision(decisionRecord) {
    const dv = this.decisionVerifier.verify(decisionRecord);
    const sv = this.decisionVerifier.selfVerify(decisionRecord);
    return {
      verify: dv,
      selfVerify: sv,
      combinedScore: (dv.score + sv.score) / 2,
    };
  }

  verifyExecution(result, context = {}) {
    return this.executionVerifier.verify(result, context);
  }

  async criticize(task, result, context = {}) {
    return this.criticAgent.verify(task, result, context);
  }

  getHealingSuggestion(errorContext = {}) {
    return this.healingBridge.getHealingSuggestion(errorContext);
  }

  // ============================================================
  // 统计
  // ============================================================

  getStats() {
    return {
      ...this.stats,
      healingSuccessRate: this.stats.healingTriggered > 0
        ? ((this.stats.totalRuns - this.stats.executionFailed - this.stats.healingTriggered) / this.stats.totalRuns).toFixed(3)
        : 'N/A',
    };
  }

  getStatus() {
    return {
      runs: this.stats.totalRuns,
      boundary: { rejected: this.stats.boundaryRejected },
      decision: { rejected: this.stats.decisionRejected },
      execution: { failed: this.stats.executionFailed },
      healing: { triggered: this.stats.healingTriggered, retries: this.stats.retries },
      healingBridge: this.healingBridge.getStatus(),
    };
  }
}

module.exports = { AgentExecutionLoop };
