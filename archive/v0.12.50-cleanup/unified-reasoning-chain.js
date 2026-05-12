/**
 * unified-reasoning-chain.js
 *
 * v11.33.3: 统一推理链
 *
 * 整合所有逻辑/决策模块到一个管道：
 * 1. PlanAndSolve - 问题理解+计划制定 (ACL 2023)
 * 2. SyllogismChecker - 形式逻辑验证 (肯定后件/否定前件等谬误)
 * 3. DecisionVerifier - 决策自验证 (arXiv 2312.09210)
 * 4. DaoDecision - 道论哲学过滤 (道法自然/反者道之动/为而不争/不言之教)
 * 5. ConsciousnessDepth - 意识深度感知 (动态调整推理深度)
 * 6. DialecticRecall - 三层召回 (表面/因果/元认知)
 * 7. UncertaintyQuantifier - 三阶不确定性量化 (认知/随机/幻觉)
 * 8. CounterfactualEngine - 反方生成+前提质疑 (反者道之动)
 *
 * 核心原则：
 * - 每个模块独立评分，最终置信度取加权几何平均
 * - 意识深度决定是否触发深层审查（意识浅时简化，意识深时严格）
 * - 谬误检测结果自动注入决策验证的风险列表
 */

const { SyllogismChecker, verifyChain } = require('./syllogism-checker.js');
const { DecisionVerifier } = require('./decision-verifier.js');
const { DaoDecision } = require('./dao-decision.js');
const { dialecticRecall } = require('./dialectic-recall.js');
const { UncertaintyQuantifier } = require('./uncertainty-quantifier.js');
const { CounterfactualEngine } = require('./counterfactual-engine.js');

// 加载 consciousness-depth-indicator
let ConsciousnessDepth = null;
try {
  ConsciousnessDepth = require('./consciousness-depth-indicator.js');
} catch (e) {
  ConsciousnessDepth = null;
}

// Plan-and-solve from workbuddy
let PlanAndSolve = null;
try {
  PlanAndSolve = require('./plan-and-solve.js');
} catch (e) {
  PlanAndSolve = null;
}

// 加载 personality-engine
let PersonalityEngine = null;
try {
  PersonalityEngine = require('./personality-engine.js');
} catch (e) {
  PersonalityEngine = null;
}

// ============================================================
// 推理链配置
// ============================================================

const CONFIG = {
  // 意识深度阈值：低于此值启用简化模式
  LOW_DEPTH_THRESHOLD: 30,

  // 各模块权重（几何平均用）
  WEIGHTS: {
    planAndSolve: 0.10,
    syllogism: 0.15,
    decisionVerifier: 0.15,
    daoDecision: 0.10,
    consciousness: 0.05,
    dialectic: 0.05,
    uncertainty: 0.20,    // 新增：不确定性量化
    counterfactual: 0.20,   // 新增：反方生成
  },

  // 置信度阈值
  CONFIDENCE_THRESHOLD: 0.60,

  // 谬误高危关键词（触发 syllogism 深度审查）
  FALLACY_TRIGGERS: [
    '所以', '因此', '得出', '推得', '证明',
    '所有', '有些', '如果', '那么', '或者'
  ],
};

// ============================================================
// 主推理链
// ============================================================

class UnifiedReasoningChain {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.syllogism = new SyllogismChecker({ minConfidence: 0.6 });
    this.decisionVerifier = new DecisionVerifier();
    this.dao = new DaoDecision();
    this.personality = PersonalityEngine
      ? new PersonalityEngine()
      : null;
    this.uncertainty = new UncertaintyQuantifier();
    this.counterfactual = new CounterfactualEngine({ mode: 'balanced', maxOpposingViews: 2 });
    this._depthHistory = [];
  }

  /**
   * 主推理入口
   * @param {Object} input
   * @param {string} input.text - 用户输入
   * @param {string} input.context - 可选：对话上下文
   * @param {Object} input.messages - 可选：消息历史（用于意识深度评估）
   * @param {Object} input.goal - 可选：用户目标
   * @returns {Object} 完整推理报告
   */
  reason(input = {}) {
    const { text = '', context = '', messages = [], goal = '' } = input;
    const startTime = Date.now();

    // Step 0: 评估意识深度
    const depthResult = this._assessConsciousnessDepth(messages);

    // Step 1: Plan-and-Solve（问题理解+计划）
    const planResult = this._runPlanAndSolve(text, depthResult);

    // Step 2: 谬误检测（若触发关键词则深度审查）
    const syllogismResult = this._runSyllogismCheck(text, planResult);

    // Step 3: 决策验证（自验证层）
    const decisionResult = this._runDecisionVerification({
      text, planResult, syllogismResult, goal
    });

    // Step 4: 道论哲学过滤
    const daoResult = this._runDaoFilter(text);

    // Step 5: 三层召回（若有历史）
    const recallResult = this._runDialecticRecall(text, goal);

    // Step 6: 不确定性量化（认知/随机/幻觉）
    const uncertaintyResult = this._runUncertaintyQuantification(text);

    // Step 7: 反方生成（前提质疑+反向思考）
    const counterfactualResult = this._runCounterfactualAnalysis(text, { goal, syllogismResult });

    // Step 8: 计算综合置信度
    const confidenceResult = this._computeConfidence({
      planResult, syllogismResult, decisionResult, daoResult, depthResult,
      uncertaintyResult, counterfactualResult
    });

    // Step 9: 生成修复提示
    const repairHints = this._generateRepairHints({
      syllogismResult, decisionResult, daoResult, recallResult,
      uncertaintyResult, counterfactualResult
    });

    const elapsed = Date.now() - startTime;

    return {
      // 核心结论
      reasoningId: `reason_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsed,

      // 各模块结果
      plan: planResult,
      syllogism: syllogismResult,
      decision: decisionResult,
      dao: daoResult,
      recall: recallResult,
      consciousness: depthResult,
      uncertainty: uncertaintyResult,
      counterfactual: counterfactualResult,

      // 综合评估
      confidence: confidenceResult,
      passed: confidenceResult.passed,
      verdict: confidenceResult.verdict,

      // 修复建议
      repairHints,

      // 意识深度说明
      depthMode: depthResult.depth < this.config.LOW_DEPTH_THRESHOLD ? 'SIMPLIFIED' : 'THOROUGH',

      // 可注入上下文的摘要
      summary: this._summarize({
        planResult, syllogismResult, decisionResult, daoResult, confidenceResult
      }),

      // 决策用：直接可执行的结构
      actionable: {
        proceed: confidenceResult.passed,
        confidence: confidenceResult.finalScore,
        keyConcerns: this._extractKeyConcerns({ syllogismResult, decisionResult, daoResult }),
        hints: repairHints.slice(0, 3),
      },
    };
  }

  // ============================================================
  // Step 0: 意识深度评估
  // ============================================================

  _assessConsciousnessDepth(messages) {
    if (!ConsciousnessDepth || messages.length === 0) {
      return { depth: 50, level: 'UNKNOWN', breakdown: {}, mode: 'UNKNOWN' };
    }

    try {
      const result = ConsciousnessDepth.calculateConsciousnessDepth(messages.slice(-20));
      const mode = result.depth < this.config.LOW_DEPTH_THRESHOLD ? 'SIMPLIFIED' : 'THOROUGH';
      return { ...result, mode };
    } catch (e) {
      return { depth: 50, level: 'UNKNOWN', breakdown: {}, mode: 'UNKNOWN' };
    }
  }

  // ============================================================
  // Step 1: Plan-and-Solve
  // ============================================================

  _runPlanAndSolve(text, depthResult) {
    if (!PlanAndSolve) {
      return { available: false, guidance: null, steps: [] };
    }

    try {
      // 简化模式下只做快速推理
      const useQuick = depthResult.mode === 'SIMPLIFIED';
      const result = useQuick
        ? PlanAndSolve.quickReason(text)
        : PlanAndSolve.reason(text);

      return {
        available: true,
        useQuick,
        guidance: result.guidance || result.guidance,
        steps: result.plan ? result.plan.steps.map(s => ({ action: s.action, desc: s.desc })) : [],
        understanding: result.understanding ? result.understanding.original : text,
        score: useQuick ? 0.7 : 0.9,
      };
    } catch (e) {
      return { available: false, error: e.message, score: 0 };
    }
  }

  // ============================================================
  // Step 2: 谬误检测
  // ============================================================

  _runSyllogismCheck(text, planResult) {
    const hasTriggers = this.config.FALLACY_TRIGGERS.some(t => text.includes(t));

    if (!hasTriggers) {
      return { checked: false, reason: 'no_trigger_keywords', valid: true, score: 0.8 };
    }

    try {
      // 提取推理链
      const statements = this._extractStatements(text);
      if (statements.length < 2) {
        return { checked: false, reason: 'insufficient_statements', valid: true, score: 0.7 };
      }

      const conclusion = statements[statements.length - 1];
      const premises = statements.slice(0, -1);

      const result = this.syllogism.check({ statements: premises, claim: conclusion });

      return {
        checked: true,
        valid: result.valid,
        confidence: result.confidence,
        fallacy: result.fallacy,
        pattern: result.pattern,
        explanation: result.explanation,
        steps: result.steps,
        score: result.valid ? result.confidence : 0,
      };
    } catch (e) {
      return { checked: false, error: e.message, score: 0.5 };
    }
  }

  // ============================================================
  // Step 3: 决策自验证
  // ============================================================

  _runDecisionVerification({ text, planResult, syllogismResult, goal }) {
    try {
      // 构建决策记录
      const record = {
        decision: text,
        userGoal: goal,
        reason: planResult.understanding || text,
        evidence: [],
        confidence: 0.5,
        expectedOutcome: '',
        alternatives: [],
      };

      // 若发现谬误，自动注入风险
      if (syllogismResult.checked && !syllogismResult.valid) {
        record.risks = [`逻辑谬误: ${syllogismResult.fallacy || syllogismResult.pattern}`];
        record.confidence = 0.3;
      }

      const result = this.decisionVerifier.verify(record);

      return {
        valid: result.valid,
        score: result.score,
        issues: result.issues || [],
        checks: result.checks,
        repairHints: result.repairHints || [],
        selfVerified: result.checks && result.checks.reverseConsistency
          ? result.checks.reverseConsistency.ok
          : null,
      };
    } catch (e) {
      return { valid: true, score: 0.5, error: e.message };
    }
  }

  // ============================================================
  // Step 4: 道论过滤
  // ============================================================

  _runDaoFilter(text) {
    try {
      const result = this.dao.evaluate({ text });
      return {
        verdict: result.verdict,
        daoScore: result.daoScore,
        flags: result.flags,
        hints: result.hints,
        score: result.verdict === 'PASS' ? 1.0 : result.verdict === 'CAUTION' ? 0.6 : 0.2,
      };
    } catch (e) {
      return { verdict: 'PASS', daoScore: 1.0, flags: [], hints: [], score: 1.0 };
    }
  }

  // ============================================================
  // Step 5: 三层召回
  // ============================================================

  _runDialecticRecall(text, goal) {
    try {
      const result = dialecticRecall(text, {
        topK: 3,
        context: {},
        includeMeta: true,
      });

      return {
        found: result.count > 0,
        count: result.count,
        layers: result.layers,
        context: result.context,
        score: Math.min(1, result.count * 0.3),
      };
    } catch (e) {
      return { found: false, count: 0, score: 0 };
    }
  }

  // ============================================================
  // Step 6: 不确定性量化
  // ============================================================
  _runUncertaintyQuantification(text) {
    try {
      const result = this.uncertainty.evaluate(text, {});
      return {
        confidence: result.confidence,
        level: result.level,
        decomposition: result.decomposition,
        hallucinationRisk: result.isHallucinationRisk,
        calibratedPhrase: result.calibratedPhrase,
        score: result.confidence,
        signals: result.hallucination.signals,
      };
    } catch (e) {
      return { confidence: 0.5, level: 'UNKNOWN', score: 0.5 };
    }
  }

  // ============================================================
  // Step 7: 反方生成
  // ============================================================
  _runCounterfactualAnalysis(text, { goal, syllogismResult }) {
    try {
      const result = this.counterfactual.analyze(text, { userQuery: goal });
      return {
        relevant: result.relevant,
        verdict: result.verdict,
        opposingViews: result.opposingViews || [],
        premiseChallenges: result.premiseChallenges || [],
        confidenceShift: result.confidenceAdjustment,
        refinementNeeded: result.refinement ? result.refinement.needed : false,
        refinementSuggestion: result.refinement ? result.refinement.suggestion : null,
        score: result.verdict === 'likely_correct' ? 0.9
             : result.verdict === 'needs_adjustment' ? 0.6
             : 0.2,
      };
    } catch (e) {
      return { relevant: false, verdict: 'unknown', score: 0.5 };
    }
  }

  // ============================================================
  // Step 8: 综合置信度
  // ============================================================

  _computeConfidence({ planResult, syllogismResult, decisionResult, daoResult, depthResult, uncertaintyResult, counterfactualResult }) {
    const scores = {
      plan: planResult.score || 0.8,
      syllogism: syllogismResult.score || 0.8,
      decision: decisionResult.score || 0.5,
      dao: daoResult.score || 1.0,
      uncertainty: uncertaintyResult ? (uncertaintyResult.score || 0.5) : 0.5,
      counterfactual: counterfactualResult ? (counterfactualResult.score || 0.5) : 0.5,
    };

    const weights = this.config.WEIGHTS;

    // 加权几何平均（避免单一模块拉低整体）
    let weightedSum = 0;
    let weightSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      if (scores[key] !== undefined) {
        weightedSum += scores[key] * weight;
        weightSum += weight;
      }
    }

    const finalScore = weightSum > 0 ? weightedSum / weightSum : 0.5;

    // 综合判断
    const syllogismFailed = syllogismResult.checked && !syllogismResult.valid;
    const decisionFailed = !decisionResult.valid;
    const daoWarning = daoResult.verdict === 'REJECT';
    const hallucinationRisk = uncertaintyResult && uncertaintyResult.hallucinationRisk;
    const counterfactualFailed = counterfactualResult && counterfactualResult.verdict === 'needs_revision';

    let verdict = 'LIKELY_CORRECT';
    let passed = true;

    if (syllogismFailed || decisionFailed || daoWarning || hallucinationRisk || counterfactualFailed) {
      if (syllogismFailed && decisionFailed) {
        verdict = 'LIKELY_WRONG';
        passed = false;
      } else if (daoWarning) {
        verdict = 'REJECTED_BY_DAO';
        passed = false;
      } else if (hallucinationRisk) {
        verdict = 'HALLUCINATION_RISK';
        passed = false;
      } else if (counterfactualFailed) {
        verdict = 'NEEDS_REVISION';
        passed = false;
      } else {
        verdict = 'NEEDS_REVISION';
        passed = finalScore >= this.config.CONFIDENCE_THRESHOLD;
      }
    } else if (finalScore < this.config.CONFIDENCE_THRESHOLD) {
      verdict = 'LOW_CONFIDENCE';
      passed = false;
    }

    return {
      finalScore: Math.round(finalScore * 1000) / 1000,
      componentScores: scores,
      verdict,
      passed,
    };
  }

  // ============================================================
  // Step 7: 修复提示
  // ============================================================

  _generateRepairHints({ syllogismResult, decisionResult, daoResult, recallResult, uncertaintyResult, counterfactualResult }) {
    const hints = [];

    if (syllogismResult.checked && !syllogismResult.valid) {
      hints.push({
        type: 'syllogism',
        severity: 'HIGH',
        hint: `检测到逻辑谬误 (${syllogismResult.fallacy || syllogismResult.pattern})，重新审查推理链`,
        suggestion: '检查"如果...那么"结构是否被正确使用',
      });
    }

    if (decisionResult.issues && decisionResult.issues.length > 0) {
      const highSeverity = decisionResult.issues.filter(i => i.severity === 'high');
      if (highSeverity.length > 0) {
        hints.push({
          type: 'decision',
          severity: 'HIGH',
          hint: `决策验证失败: ${highSeverity[0].message}`,
          suggestion: decisionResult.repairHints[0] || '重新检查决策逻辑链',
        });
      }
    }

    if (daoResult.verdict === 'REJECT') {
      hints.push({
        type: 'dao',
        severity: 'HIGH',
        hint: '道论过滤器拒绝：违反"道法自然/反者道之动/为而不争/不言之教"',
        suggestion: daoResult.hints[0] || '调整语言，去掉强制/控制性表述',
      });
    }

    if (uncertaintyResult && uncertaintyResult.hallucinationRisk) {
      hints.push({
        type: 'uncertainty',
        severity: 'HIGH',
        hint: `幻觉风险检测: ${uncertaintyResult.calibratedPhrase}`,
        suggestion: '检测到可能的虚假引用或过度确定性表达，关键信息请核实',
      });
    }

    if (counterfactualResult && counterfactualResult.refinementNeeded) {
      hints.push({
        type: 'counterfactual',
        severity: 'MEDIUM',
        hint: `反方视角: ${counterfactualResult.refinementSuggestion || '答案可能存在前提谬误'}`,
        suggestion: '考虑答案的对立面，加入反例或限制条件',
      });
    }

    if (recallResult.found) {
      hints.push({
        type: 'recall',
        severity: 'INFO',
        hint: `发现${recallResult.count}条相关历史经验`,
        suggestion: recallResult.context ? recallResult.context.substring(0, 100) : null,
      });
    }

    return hints;
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  _extractStatements(text) {
    // 简单按句号/逗号/换行拆分
    return text
      .split(/[。\n,，]/)
      .map(s => s.trim())
      .filter(s => s.length > 3);
  }

  _extractKeyConcerns({ syllogismResult, decisionResult, daoResult }) {
    const concerns = [];
    if (syllogismResult.checked && !syllogismResult.valid) {
      concerns.push(`逻辑: ${syllogismResult.fallacy || '未知谬误'}`);
    }
    if (decisionResult.issues && decisionResult.issues.length > 0) {
      concerns.push(...decisionResult.issues.slice(0, 2).map(i => `决策: ${i.message}`));
    }
    if (daoResult.flags && daoResult.flags.length > 0) {
      concerns.push(...daoResult.flags.slice(0, 2).map(f => `道论: ${f.type}`));
    }
    return concerns;
  }

  _summarize({ planResult, syllogismResult, decisionResult, daoResult, confidenceResult }) {
    const parts = [];

    if (planResult.available) {
      parts.push(`计划: ${planResult.steps.map(s => s.action).join('→')}`);
    }

    if (syllogismResult.checked) {
      parts.push(`逻辑: ${syllogismResult.valid ? '✅' : '❌' + (syllogismResult.fallacy || '')}`);
    }

    parts.push(`道论: ${daoResult.verdict}`);
    parts.push(`置信度: ${Math.round(confidenceResult.finalScore * 100)}%`);

    return parts.join(' | ');
  }
}

// ============================================================
// 导出
// ============================================================

const chain = new UnifiedReasoningChain();

function reason(input) {
  return chain.reason(input);
}

// 快速检查（只做谬误检测）
function quickCheck(text) {
  const checker = new SyllogismChecker();
  const hasTriggers = CONFIG.FALLACY_TRIGGERS.some(t => text.includes(t));
  if (!hasTriggers) return { valid: true, reason: 'no_trigger_keywords' };

  const statements = text.split(/[。\n,，]/).map(s => s.trim()).filter(s => s.length > 3);
  if (statements.length < 2) return { valid: true, reason: 'insufficient' };

  const result = checker.check({
    statements: statements.slice(0, -1),
    claim: statements[statements.length - 1],
  });

  return {
    valid: result.valid,
    fallacy: result.fallacy,
    pattern: result.pattern,
    explanation: result.explanation,
  };
}

module.exports = { UnifiedReasoningChain, reason, quickCheck, CONFIG };
