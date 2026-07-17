/**
 * dual-perspective-auditor.js
 * 基于 V21.1 双核辩论系统设计
 * 两个AI视角互相审计，比单个视角更不容易出错
 * 
 * 核心思想：
 * 1. 两个Agent独立分析同一问题
 * 2. Agent A 出方案，Agent B 找漏洞
 * 3. 收敛判断：B 回复 CONVERGE 即结束
 * 4. 每次辩论结果持久化，可回溯
 * 
 * 心虫实现：
 * - 用两个不同的推理路径（演绎 vs 归纳）
 * - 自动检测不一致点
 * - 收敛到共识或标记为"需要人工判断"
 */

class DualPerspectiveAuditor {
  constructor(options = {}) {
    this.maxRounds = options.maxRounds || 5;
    this.convergenceThreshold = options.convergenceThreshold || 0.8;
    this.debateHistory = [];
    this.convergenceScore = 0;
    this.consensus = null;
    this.disagreements = [];
    
    // 两个视角的配置
    this.perspectives = {
      deductive: {
        name: '演绎视角',
        description: '从一般原理推导到具体结论',
        bias: '倾向于寻找逻辑一致性',
        strength: 0.7
      },
      inductive: {
        name: '归纳视角',
        description: '从具体案例归纳到一般规律',
        bias: '倾向于寻找反例',
        strength: 0.7
      }
    };
    
    this.initialized = false;
    this.stats = {
      totalDebates: 0,
      convergedDebates: 0,
      avgRounds: 0,
      disagreements: 0
    };
  }

  /**
   * 初始化
   */
  init() {
    if (this.initialized) return true;
    this.initialized = true;
    return true;
  }

  /**
   * 核心方法：双视角辩论
   * @param {Object} problem - 问题描述 {statement, evidence, context}
   * @param {Function} deductiveFn - 演绎视角推理函数
   * @param {Function} inductiveFn - 归纳视角推理函数
   * @returns {Object} 辩论结果 {consensus, confidence, disagreements, rounds}
   */
  async debate(problem, deductiveFn, inductiveFn) {
    if (!problem || !problem.statement) {
      return { error: 'Problem statement required' };
    }
    
    const debate = {
      id: `debate_${Date.now()}`,
      problem: { ...problem },
      rounds: [],
      startTime: Date.now(),
      converged: false,
      consensus: null,
      confidence: 0,
      disagreements: []
    };
    
    // 第1轮：两个视角独立分析
    const deductiveResult = await deductiveFn(problem, this.perspectives.deductive);
    const inductiveResult = await inductiveFn(problem, this.perspectives.inductive);
    
    debate.rounds.push({
      round: 1,
      deductive: deductiveResult,
      inductive: inductiveResult,
      timestamp: Date.now()
    });
    
    // 检查一致性
    const consistency = this._checkConsistency(deductiveResult, inductiveResult);
    
    if (consistency.score >= this.convergenceThreshold) {
      // 快速收敛
      debate.converged = true;
      debate.consensus = this._mergeResults(deductiveResult, inductiveResult);
      debate.confidence = consistency.score;
      this.debateHistory.push(debate);
      this.stats.totalDebates++;
      this.stats.convergedDebates++;
      return this._formatResult(debate);
    }
    
    // 多轮辩论
    let currentDeductive = deductiveResult;
    let currentInductive = inductiveResult;
    
    for (let round = 2; round <= this.maxRounds; round++) {
      // 归纳视角审查演绎视角
      const inductiveReview = await this._review(
        currentInductive, currentDeductive, this.perspectives.inductive
      );
      
      // 演绎视角改进
      const deductiveImproved = await this._improve(
        currentDeductive, inductiveReview, this.perspectives.deductive
      );
      
      // 演绎视角审查归纳视角
      const deductiveReview = await this._review(
        currentDeductive, currentInductive, this.perspectives.deductive
      );
      
      // 归纳视角改进
      const inductiveImproved = await this._improve(
        currentInductive, deductiveReview, this.perspectives.inductive
      );
      
      debate.rounds.push({
        round,
        deductiveReview,
        inductiveReview,
        deductiveImproved,
        inductiveImproved,
        timestamp: Date.now()
      });
      
      currentDeductive = deductiveImproved;
      currentInductive = inductiveImproved;
      
      // 检查收敛
      const newConsistency = this._checkConsistency(currentDeductive, currentInductive);
      if (newConsistency.score >= this.convergenceThreshold) {
        debate.converged = true;
        debate.consensus = this._mergeResults(currentDeductive, currentInductive);
        debate.confidence = newConsistency.score;
        debate.rounds = round;
        break;
      }
      
      // 记录分歧
      if (newConsistency.disagreements.length > 0) {
        debate.disagreements.push(...newConsistency.disagreements);
      }
    }
    
    // 未收敛：返回最佳猜测
    if (!debate.converged) {
      debate.consensus = this._mergeResults(currentDeductive, currentInductive);
      debate.confidence = consistency.score;
      debate.disagreements = consistency.disagreements;
    }
    
    this.debateHistory.push(debate);
    this.stats.totalDebates++;
    if (debate.converged) this.stats.convergedDebates++;
    this.stats.disagreements += debate.disagreements.length;
    this.stats.avgRounds = this.debateHistory.reduce((sum, d) => sum + d.rounds.length, 0) / this.debateHistory.length;
    
    return this._formatResult(debate);
  }

  /**
   * 快速审计：单轮一致性检查
   * @param {Object} conclusion - 待审计的结论
   * @param {Object} evidence - 支持证据
   * @returns {Object} {consistent, score, issues}
   */
  quickAudit(conclusion, evidence = {}) {
    const issues = [];
    
    // 检查1：结论是否有证据支持
    if (!evidence.supporting || evidence.supporting.length === 0) {
      issues.push({
        type: 'missing_evidence',
        severity: 'high',
        message: '结论缺乏支持证据'
      });
    }
    
    // 检查2：是否存在矛盾证据
    if (evidence.contradicting && evidence.contradicting.length > 0) {
      issues.push({
        type: 'contradicting_evidence',
        severity: 'high',
        message: `存在${evidence.contradicting.length}条矛盾证据`,
        details: evidence.contradicting
      });
    }
    
    // 检查3：结论是否过度泛化
    if (conclusion.scope === 'universal' && !evidence.scope) {
      issues.push({
        type: 'overgeneralization',
        severity: 'medium',
        message: '结论声称普遍适用，但证据范围有限'
      });
    }
    
    // 计算一致性分数
    const score = issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2);
    
    return {
      consistent: issues.length === 0,
      score,
      issues,
      recommendation: issues.length === 0 ? 'accept' : issues.some(i => i.severity === 'high') ? 'reject' : 'revise'
    };
  }

  /**
   * 获取辩论历史
   */
  getDebateHistory(limit = 10) {
    return this.debateHistory.slice(-limit);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      historySize: this.debateHistory.length,
      convergenceRate: this.stats.totalDebates > 0 
        ? this.stats.convergedDebates / this.stats.totalDebates 
        : 0
    };
  }

  // 内部方法
  async _review(perspective, target, reviewer) {
    // 简化实现：检查目标结论的逻辑漏洞
    const issues = [];
    
    if (target.conclusion && !target.reasoning) {
      issues.push({ type: 'missing_reasoning', message: '结论缺乏推理过程' });
    }
    
    if (target.confidence && target.confidence > 0.9 && !target.risks) {
      issues.push({ type: 'overconfidence', message: '高置信度但未识别风险' });
    }
    
    return {
      reviewer: reviewer.name,
      target: target.conclusion || target.statement,
      issues,
      verdict: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
      timestamp: Date.now()
    };
  }

  async _improve(current, review, improver) {
    // 简化实现：根据审查意见改进
    if (review.issues.length === 0) return current;
    
    const improved = { ...current };
    
    if (!improved.risks) {
      improved.risks = review.issues.map(i => i.message);
    } else {
      improved.risks.push(...review.issues.map(i => i.message));
    }
    
    improved.improvedBy = improver.name;
    improved.reviewFeedback = review.issues;
    
    return improved;
  }

  _checkConsistency(result1, result2) {
    const disagreements = [];
    
    // 检查结论一致性
    const c1 = result1.conclusion || result1.statement;
    const c2 = result2.conclusion || result2.statement;
    
    if (c1 && c2 && c1 !== c2) {
      disagreements.push({
        type: 'conclusion_mismatch',
        perspective1: result1.perspective || 'deductive',
        perspective2: result2.perspective || 'inductive',
        value1: c1,
        value2: c2
      });
    }
    
    // 检查置信度差异
    const conf1 = result1.confidence || 0.5;
    const conf2 = result2.confidence || 0.5;
    const confDiff = Math.abs(conf1 - conf2);
    
    if (confDiff > 0.3) {
      disagreements.push({
        type: 'confidence_gap',
        difference: confDiff,
        message: `两个视角置信度差异过大 (${conf1.toFixed(2)} vs ${conf2.toFixed(2)})`
      });
    }
    
    // 计算一致性分数
    const baseScore = 1.0 - disagreements.length * 0.2;
    const score = Math.max(0, Math.min(1, baseScore));
    
    return { score, disagreements };
  }

  _mergeResults(r1, r2) {
    // 合并两个视角的结果，取置信度更高的结论
    const conf1 = r1.confidence || 0.5;
    const conf2 = r2.confidence || 0.5;
    
    const primary = conf1 >= conf2 ? r1 : r2;
    const secondary = conf1 >= conf2 ? r2 : r1;
    
    return {
      conclusion: primary.conclusion || primary.statement,
      confidence: Math.max(conf1, conf2),
      primaryPerspective: primary.perspective || 'deductive',
      secondaryPerspective: secondary.perspective || 'inductive',
      agreement: this._checkConsistency(r1, r2).score,
      mergedAt: Date.now()
    };
  }

  _formatResult(debate) {
    return {
      id: debate.id,
      converged: debate.converged,
      consensus: debate.consensus,
      confidence: debate.confidence,
      rounds: debate.rounds.length,
      disagreements: debate.disagreements,
      totalTime: Date.now() - debate.startTime,
      stats: this.getStats()
    };
  }
}

module.exports = DualPerspectiveAuditor;
