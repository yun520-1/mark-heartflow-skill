/**
 * HeartFlow Critic-Healing Bridge v11.19.5
 * 
 * 打通两个闭环的核心缺失环节：
 * 
 * 原架构问题：
 *   CriticAgent.verify() → recommendations[] (文字)
 *   SelfHealing.record() → repair hints (从未被调用)
 *   两个模块互相不知道对方存在
 * 
 * 闭环架构：
 *   decision-verifier.js → 决策阶段: verify() → selfVerify()
 *   execution-verifier.js → 执行阶段: verify() → passed/issues
 *   critic-agent.js      → 批评阶段: verify() → recommendations[]
 *   self-healing.js      → 修复阶段: record() / getHealHint()
 *   critic-healing-bridge.js → 打通批评↔修复: 
 *       recommendations[] + failureContext → repairStep[]
 * 
 * Paper:
 *   - Reflexion (arXiv 2304.10773): verbal reinforcement → repair
 *   - CRITIC (arXiv 2312.14187): external verification → self-correction
 *   - Self-Reward (arXiv 2401.06792): self-evaluation → training signal
 * 
 * 核心逻辑：
 *   1. 接收 critic.verification + context
 *   2. 判断是否需要修复（isRetryable + isRepeated）
 *   3. 生成结构化 repairStep[] (不是文字 recommendations)
 *   4. 调用 selfHealing.record() 学习修复结果
 *   5. 输出 { repairSteps, retrySignal, healContext }
 */

const { SelfHealing } = require('./self-healing.js');

class CriticHealingBridge {
  constructor(options = {}) {
    this.healing = new SelfHealing({
      maxRetries: options.maxRetries ?? 3,
      backoffMs: options.backoffMs ?? 200,
    });
    
    // 修复策略到 action type 的映射
    this.strategyMap = {
      'retry_with_modification': 'MODIFY',
      'retry_with_simplification': 'SIMPLIFY',
      'retry_after_analysis': 'ANALYZE',
      'use_alternative_approach': 'ALTERNATIVE',
      'request_human_input': 'ESCALATE',
      'decompose_and_retry': 'DECOMPOSE',
    };
    
    // 统计
    this.stats = {
      totalRepairs: 0,
      successfulRepairs: 0,
      failedRepairs: 0,
      loopsClosed: 0,
    };
  }

  // ============================================================
  // 主入口: bridge(verification, context) → repairResult
  // ============================================================

  /**
   * 接收 critic 的验证结果，打通到 healing
   * 
   * @param {Object} verification - critic-agent 的 verify() 输出
   * @param {Object} context - { task, result, previousAttempts, decisionRecord }
   * @returns {Object} repairResult
   */
  bridge(verification = {}, context = {}) {
    const { task, result, previousAttempts = [], decisionRecord = {} } = context;
    
    // 决策
    const repairDecision = this._decideRepair(verification, result, previousAttempts);
    
    if (!repairDecision.shouldRepair) {
      return {
        shouldRepair: false,
        shouldRetry: false,
        repairSteps: [],
        reason: repairDecision.reason,
        selfHealingSignal: null,
      };
    }

    // 生成结构化修复步骤
    const repairSteps = this._generateRepairSteps(
      verification,
      result,
      decisionRecord,
      repairDecision.strategy
    );

    // 记录到 SelfHealing（用于 RL 学习）
    const normalizedError = this._normalizeForHealing(verification, result);
    this.healing.record(normalizedError, {
      strategy: repairDecision.strategy,
      steps: repairSteps,
      task: task,
    });

    // 更新统计
    this.stats.totalRepairs++;
    this.stats.loopsClosed++;

    return {
      shouldRepair: true,
      shouldRetry: repairDecision.shouldRetry,
      repairSteps,
      strategy: repairDecision.strategy,
      reason: repairDecision.reason,
      selfHealingSignal: {
        error: normalizedError,
        strategy: repairDecision.strategy,
        timestamp: Date.now(),
      },
      retryBudget: this._calcRetryBudget(repairDecision.strategy, previousAttempts),
    };
  }

  // ============================================================
  // 修复决策: 是否修复 + 用什么策略
  // ============================================================

  _decideRepair(verification, result, previousAttempts) {
    const { success, shouldRetry, reason, recommendations } = verification;
    
    // 1. critic 说成功 → 不修复
    if (success) {
      return { shouldRepair: false, reason: 'verification_passed' };
    }

    // 2. critic 说 fatal error → 不重试，直接升级
    const isFatal = this._isFatalError(reason, result);
    if (isFatal) {
      return { shouldRepair: false, shouldRetry: false, reason: 'fatal_error_detected' };
    }

    // 3. 检查是否重复失败
    const isRepeated = this._isRepeatedFailure(reason, previousAttempts);
    if (isRepeated) {
      // 重复失败 → 建议完全换方法
      return {
        shouldRepair: true,
        shouldRetry: true,
        strategy: 'use_alternative_approach',
        reason: 'repeated_failure_switch_strategy',
      };
    }

    // 4. 根据 critic recommendations 匹配策略
    const strategy = this._matchStrategyFromRecommendations(recommendations || [], reason);
    
    return {
      shouldRepair: true,
      shouldRetry: true,
      strategy,
      reason: 'correctable_failure',
    };
  }

  /**
   * 判断是否为 fatal error（不重试）
   */
  _isFatalError(reason, result) {
    const fatalReasons = ['fatal', 'crash', 'permission_denied', 'auth_failed'];
    if (fatalReasons.some(f => String(reason || '').includes(f))) return true;
    
    // 检查 result 中的 fatal 标记
    const resultStr = JSON.stringify(result || {}).toLowerCase();
    if (fatalReasons.some(f => resultStr.includes(f))) return true;
    
    return false;
  }

  /**
   * 检查是否重复失败
   */
  _isRepeatedFailure(reason, previousAttempts) {
    if (!previousAttempts || previousAttempts.length < 2) return false;
    
    const recentSameReason = previousAttempts.filter(a => a.reason === reason);
    return recentSameReason.length >= 2;
  }

  /**
   * 从 critic recommendations 匹配修复策略
   */
  _matchStrategyFromRecommendations(recommendations, reason) {
    const recText = (recommendations.join(' ') + ' ' + (reason || '')).toLowerCase();
    
    // 顺序匹配：具体 → 通用
    if (/重试|retry|再次/.test(recText)) {
      if (/简化|分解|single|一步/.test(recText)) return 'retry_with_simplification';
      if (/修改|调整|change/.test(recText)) return 'retry_with_modification';
      return 'retry_after_analysis';
    }
    
    if (/不同|另外|alternative|换/.test(recText)) return 'use_alternative_approach';
    if (/人工|human|确认|confirm/.test(recText)) return 'request_human_input';
    if (/分解|decompose|分步/.test(recText)) return 'decompose_and_retry';
    
    // 默认：分析后重试
    return 'retry_after_analysis';
  }

  // ============================================================
  // 修复步骤生成 (不是文字 recommendations，是结构化 steps)
  // ============================================================

  _generateRepairSteps(verification, result, decisionRecord, strategy) {
    const steps = [];
    const { task, recommendations, reason } = verification;
    const taskText = typeof task === 'string' ? task : (task.description || task.prompt || '');
    const outputText = typeof result === 'object' ? JSON.stringify(result) : String(result || '');

    switch (strategy) {
      case 'retry_with_modification':
        // 保留核心操作，修改具体参数
        steps.push(
          this._makeStep('ANALYZE', '分析输出与目标的差距', {
            output: outputText.slice(0, 200),
            goal: taskText.slice(0, 200),
            gap: recommendations.slice(0, 2),
          }),
          this._makeStep('MODIFY', '调整参数后重试', {
            originalAction: decisionRecord.decision || '',
            modifications: this._extractModifications(recommendations),
          })
        );
        break;

      case 'retry_with_simplification':
        // 分解为更简单的步骤
        steps.push(
          this._makeStep('DECOMPOSE', '将任务分解为单个操作', {
            originalTask: taskText.slice(0, 100),
            subSteps: this._decomposeTask(taskText),
          }),
          this._makeStep('EXECUTE', '先执行最简单的子步骤', {
            focus: '验证最小步骤是否可执行',
          }),
          this._makeStep('EXPAND', '逐步扩展到完整任务', {
            condition: '每步验证后再继续',
          })
        );
        break;

      case 'retry_after_analysis':
        // 先分析，再重试
        steps.push(
          this._makeStep('ANALYZE', '分析失败原因', {
            reason: reason,
            recommendations: recommendations.slice(0, 3),
          }),
          this._makeStep('PLAN', '制定修复计划', {
            input: '分析结论',
            output: '具体修改方案',
          }),
          this._makeStep('RETRY', '按计划重试', {
            checkFirst: '修改是否到位',
          })
        );
        break;

      case 'use_alternative_approach':
        // 完全换方法
        steps.push(
          this._makeStep('IDENTIFY', '识别当前方法的问题', {
            currentApproach: decisionRecord.decision || '',
            failureMode: reason,
          }),
          this._makeStep('BRAINSTORM', '生成 2-3 个替代方案', {
            count: 2,
            criteria: '与原方法有本质差异',
          }),
          this._makeStep('SELECT', '选择最佳替代方案', {
            method: '成本-效益分析',
          }),
          this._makeStep('EXECUTE', '执行新方案', {
            fallback: '如果失败，换下一个方案',
          })
        );
        break;

      case 'request_human_input':
        // 升级人工
        steps.push(
          this._makeStep('SUMMARIZE', '总结当前状态', {
            task: taskText.slice(0, 100),
            attempts: '多次尝试均失败',
            lastError: reason,
          }),
          this._makeStep('ESCALATE', '请求人工介入', {
            escalate: true,
            humanQuestion: this._formulateHumanQuestion(recommendations, reason),
            context: { decisionRecord, verification },
          })
        );
        break;

      case 'decompose_and_retry':
        steps.push(
          this._makeStep('DECOMPOSE', '任务分解', {
            task: taskText,
            method: '按操作单元分解',
          }),
          this._makeStep('VALIDATE', '验证每个子步骤', {
            checkEach: true,
          }),
          this._makeStep('RETRY', '从失败点重试', {
            resumeFrom: '最后一个成功的子步骤',
          })
        );
        break;

      default:
        steps.push(
          this._makeStep('ANALYZE', '通用分析', { reason: reason }),
          this._makeStep('RETRY', '重试', {})
        );
    }

    return steps;
  }

  _makeStep(action, description, data = {}) {
    return {
      action,          // ANALYZE / MODIFY / RETRY / EXECUTE / etc.
      description,      // 人类可读描述
      data,             // 结构化数据（供后续使用）
      status: 'pending', // pending / done / skip
      timestamp: Date.now(),
    };
  }

  _extractModifications(recommendations) {
    // 从文字 recommendations 提取具体修改建议
    const mods = [];
    for (const rec of recommendations) {
      const recStr = String(rec);
      const changeMatch = recStr.match(/[修改调整change].{0,30}/);
      if (changeMatch) mods.push(changeMatch[0]);
    }
    return mods.length > 0 ? mods : ['根据建议适当调整参数'];
  }

  _decomposeTask(taskText) {
    // 简单任务分解：按步骤/标点拆分
    const sentences = taskText.split(/[。；\n]/).filter(s => s.trim().length > 3);
    if (sentences.length <= 1) {
      return [taskText.slice(0, 50), '...其余部分'];
    }
    return sentences.slice(0, 3);
  }

  _formulateHumanQuestion(recommendations, reason) {
    const recs = (recommendations || []).slice(0, 2).join('；');
    return `无法自动解决。失败原因：${reason || '未知'}。建议：${recs || '请人工判断'}。`;
  }

  // ============================================================
  // 与 SelfHealing 集成
  // ============================================================

  /**
   * 将 verification + result 格式化为 SelfHealing 能理解的格式
   */
  _normalizeForHealing(verification, result) {
    const message = [
      verification.reason || '',
      (verification.critique || '').slice(0, 100),
    ].join(' | ');

    return {
      type: verification.success ? 'success' : 'failure',
      message: message.slice(0, 200),
      code: null,
      transient: verification.shouldRetry && !this._isFatalError(verification.reason, result),
      attempt: 1,
      task: typeof verification.task === 'object' ? JSON.stringify(verification.task).slice(0, 100) : String(verification.task || '').slice(0, 100),
    };
  }

  /**
   * 获取 SelfHealing 的 Q-learning 建议
   */
  getHealingSuggestion(errorContext = {}) {
    const pattern = errorContext.message || errorContext.reason || '';
    if (!pattern) return null;

    const qValue = this.healing.rl ? this.healing.rl.getQValue(pattern, 'best') : null;
    if (qValue) {
      return {
        suggestedStrategy: qValue.action,
        qValue: qValue.value,
        fromMemory: true,
      };
    }
    return null;
  }

  /**
   * 上报修复结果，用于 RL 更新
   */
  reportRepairOutcome(repairSignal, outcome = {}) {
    if (!repairSignal || !repairSignal.selfHealingSignal) return;
    
    const { error, strategy } = repairSignal.selfHealingSignal;
    const success = outcome.success !== false;
    
    this.healing.record(error, { strategy, outcome }, success ? 'success' : 'failure');
    
    if (success) {
      this.stats.successfulRepairs++;
    } else {
      this.stats.failedRepairs++;
    }
  }

  // ============================================================
  // 重试预算
  // ============================================================

  _calcRetryBudget(strategy, previousAttempts) {
    const base = { 
      retry_with_modification: 2,
      retry_with_simplification: 3,
      retry_after_analysis: 2,
      use_alternative_approach: 3,
      request_human_input: 0,
      decompose_and_retry: 2,
    };
    
    const baseBudget = base[strategy] ?? 2;
    const attemptsUsed = previousAttempts ? previousAttempts.length : 0;
    return Math.max(0, baseBudget - attemptsUsed);
  }

  /**
   * SPC-inspired Adversarial Critique (v11.24.1)
   * 
   * Paper: SPC (arXiv 2504.19162) - Self-Play Critic via Adversarial Games
   * Core: Instead of single critique, generate multiple adversarial perspectives
   * and pick the one most likely to find hidden errors.
   * 
   * @param {Object} params - { task, decisions, context }
   * @returns {Object} { critique, verdict, strategy, confidence }
   */
  runAdversarialCritique({ task = {}, decisions = [], context = {} } = {}) {
    const taskText = typeof task === 'string' ? task : (task.description || task.prompt || JSON.stringify(task));
    const goals = Array.isArray(context.goals) ? context.goals : [context.goal || 'complete task'];
    
    // Three adversarial perspectives (SPC-inspired)
    const perspectives = [
      {
        id: 'skeptic',
        label: 'Skeptic',
        focus: '逻辑一致性',
        prompt: '找出这个决策的核心矛盾和漏洞',
        weight: 0.4,
      },
      {
        id: 'risk_analyst',
        label: 'Risk Analyst',
        focus: '风险与后果',
        prompt: '识别可能的负面后果和最坏情况',
        weight: 0.35,
      },
      {
        id: 'advocate',
        label: 'Devil\'s Advocate',
        focus: '替代方案',
        prompt: '如果这个决策错了，最好的替代方案是什么',
        weight: 0.25,
      },
    ];

    const critiques = perspectives.map(p => {
      const { label, focus, prompt, weight } = p;
      // Generate critique from perspective
      let critiqueText = '';
      let errorLikelihood = 0.5;
      let missingEvidence = false;

      // Analyze each decision from this perspective
      for (const decision of decisions) {
        const decText = decision.decision || '';
        const reasonText = decision.reason || '';
        const confidence = typeof decision.confidence === 'number' ? decision.confidence : 0.5;

        // Skeptic: look for logical contradictions
        if (label === 'Skeptic') {
          const hasEvidence = (decision.evidence || []).length > 0;
          if (!hasEvidence) missingEvidence = true;
          if (confidence > 0.8 && !hasEvidence) {
            errorLikelihood = Math.min(1, errorLikelihood + 0.3);
          }
          // Look for overconfidence signals
          if (confidence > 0.9 && (decText.length < 50 || reasonText.length < 30)) {
            errorLikelihood = Math.min(1, errorLikelihood + 0.25);
          }
          critiqueText += `[Skeptic] 决策"${decText.slice(0, 40)}" - `;
          if (missingEvidence) critiqueText += '缺乏证据支持; ';
          if (confidence > 0.85) critiqueText += '高置信度但低理由; ';
          critiqueText = critiqueText.replace(/; $/, '. ');
        }

        // Risk Analyst: identify failure modes
        if (label === 'Risk Analyst') {
          const riskKeywords = ['删除', '修改', '重写', '强制', '覆盖', '不可逆'];
          const hasRisk = riskKeywords.some(k => decText.includes(k));
          if (hasRisk) {
            errorLikelihood = Math.min(1, errorLikelihood + 0.2);
            critiqueText += `[Risk] 决策包含敏感操作; `;
          }
          if (decText.includes('删除') && !reasonText.includes('备份')) {
            errorLikelihood = Math.min(1, errorLikelihood + 0.15);
            critiqueText += '删除操作缺少备份说明; ';
          }
          critiqueText = critiqueText.replace(/; $/, '. ');
        }

        // Devil's Advocate: propose alternatives
        if (label === 'Devil\'s Advocate') {
          if (decisions.length < 2) {
            errorLikelihood = Math.min(1, errorLikelihood + 0.15);
            critiqueText += '没有备选方案; ';
          }
          critiqueText = critiqueText.replace(/; $/, '. ');
        }
      }

      return {
        perspective: label,
        focus,
        prompt,
        weight,
        critique: critiqueText || `${label}: no specific issues found`,
        errorLikelihood: Number(errorLikelihood.toFixed(3)),
        actionable: errorLikelihood > 0.4,
      };
    });

    // Weighted verdict: combine perspectives
    const totalWeight = critiques.reduce((sum, c) => sum + c.weight, 0);
    const weightedError = critiques.reduce((sum, c) => sum + c.errorLikelihood * c.weight, 0) / totalWeight;
    const hasMissingEvidence = critiques.some(c => c.missingEvidence);

    // Select dominant strategy based on highest error likelihood
    const dominant = critiques.reduce((worst, c) => c.errorLikelihood > worst.errorLikelihood ? c : worst);
    const strategy = dominant.actionable
      ? this._strategyFromErrorLikelihood(dominant.errorLikelihood)
      : 'retry_after_analysis';

    return {
      critique: critiques,
      verdict: weightedError > 0.6 ? 'likely_flawed' : weightedError > 0.4 ? 'needs_review' : 'acceptable',
      errorLikelihood: Number(weightedError.toFixed(3)),
      primaryConcern: dominant.perspective === 'Skeptic' ? 'evidence_gap'
        : dominant.perspective === 'Risk Analyst' ? 'risk_unmitigated'
        : 'insufficient_alternatives',
      strategy,
      confidence: Number((1 - weightedError).toFixed(3)),
      hasMissingEvidence,
      repairFocus: dominant.focus,
      summary: `${dominant.label} perspective dominates (error likelihood: ${dominant.errorLikelihood})`,
    };
  }

  _strategyFromErrorLikelihood(errorLikelihood) {
    if (errorLikelihood > 0.7) return 'use_alternative_approach';
    if (errorLikelihood > 0.5) return 'retry_with_modification';
    return 'retry_after_analysis';
  }

  // ============================================================
  // 状态与统计
  // ============================================================

  getStats() {
    return {
      ...this.stats,
      healingSummary: this.healing.summarize(),
      successRate: this.stats.totalRepairs > 0
        ? (this.stats.successfulRepairs / this.stats.totalRepairs).toFixed(3)
        : 'N/A',
    };
  }

  getStatus() {
    return {
      loopsClosed: this.stats.loopsClosed,
      healingReady: !!this.healing,
      lastHealingSummary: this.healing.summarize(),
    };
  }
}

module.exports = { CriticHealingBridge };
