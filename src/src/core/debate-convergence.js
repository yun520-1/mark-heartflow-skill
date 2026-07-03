/**
 * debate-convergence.js
 * 基于 V21.1 双核辩论系统的收敛逻辑
 * 心虫多视角辩论的收敛判断器
 * 
 * 核心思想：
 * 1. 多轮辩论中检测收敛信号
 * 2. 收敛条件：两个视角的一致性超过阈值
 * 3. 收敛速度：记录从开始到收敛的轮次
 * 4. 未收敛：标记为"需要人工判断"
 * 
 * V21.1 辩论战绩（9轮）：
 * - 第1轮：gate叠加问题
 * - 第2轮：ABC颗粒度对齐
 * - 第3-4轮：爆炸根因（两次）
 * - 第5轮：5对也炸了
 * - 第6轮：40M容量辩论
 * - 第7轮：梯度诊断
 * - 第8轮：容量计算
 * - 第9轮：收敛共识
 */

class DebateConvergence {
  constructor(options = {}) {
    this.convergenceThreshold = options.convergenceThreshold || 0.8;
    this.maxRounds = options.maxRounds || 9; // V21.1用了9轮
    this.stagnationThreshold = options.stagnationThreshold || 3; // 连续N轮无改进则提前终止
    
    this.debateLog = [];
    this.currentRound = 0;
    this.converged = false;
    this.convergenceRound = null;
    this.stagnationCount = 0;
    this.lastScore = 0;
    
    this.initialized = false;
    this.stats = {
      totalDebates: 0,
      convergedDebates: 0,
      avgRoundsToConverge: 0,
      avgConvergenceScore: 0,
      stagnationStops: 0
    };
  }

  /**
   * 初始化
   */
  async init() {
    this.initialized = true;
    return true;
  }

  /**
   * 核心方法：执行辩论并判断收敛
   * @param {Object} problem - 问题描述
   * @param {Array} perspectives - 视角列表 [{name, reasonFn}]
   * @returns {Object} 辩论结果
   */
  async conductDebate(problem, perspectives) {
    if (!problem || !perspectives || perspectives.length < 2) {
      return { error: 'Requires problem and at least 2 perspectives' };
    }
    
    const debate = {
      id: `debate_${Date.now()}`,
      problem,
      perspectives: perspectives.map(p => p.name),
      rounds: [],
      startTime: Date.now(),
      converged: false,
      convergenceScore: 0,
      consensus: null,
      disagreements: []
    };
    
    this.currentRound = 0;
    this.converged = false;
    this.stagnationCount = 0;
    this.lastScore = 0;
    
    // 初始分析
    const initialResults = await this._runPerspectives(problem, perspectives);
    debate.rounds.push({
      round: 0,
      results: initialResults,
      score: this._calculateConsensus(initialResults),
      timestamp: Date.now()
    });
    
    this.lastScore = debate.rounds[0].score;
    
    // 多轮辩论
    for (let round = 1; round <= this.maxRounds; round++) {
      this.currentRound = round;
      
      // 每轮：互相审查 → 改进
      const roundResults = await this._debateRound(problem, perspectives, debate.rounds[round - 1]);
      
      const score = this._calculateConsensus(roundResults);
      debate.rounds.push({
        round,
        results: roundResults,
        score,
        timestamp: Date.now()
      });
      
      // 检查收敛
      if (score >= this.convergenceThreshold) {
        debate.converged = true;
        debate.convergenceScore = score;
        debate.convergenceRound = round;
        debate.consensus = this._extractConsensus(roundResults);
        break;
      }
      
      // 检查停滞
      if (Math.abs(score - this.lastScore) < 0.05) {
        this.stagnationCount++;
        if (this.stagnationCount >= this.stagnationThreshold) {
          // 提前终止
          debate.converged = false;
          debate.convergenceScore = score;
          debate.consensus = this._extractBestEffortConsensus(roundResults);
          debate.stoppedEarly = true;
          debate.stagnationRounds = this.stagnationCount;
          break;
        }
      } else {
        this.stagnationCount = 0;
      }
      
      this.lastScore = score;
    }
    
    // 记录分歧点
    debate.disagreements = this._extractDisagreements(debate.rounds);
    
    // 更新统计
    this.debateLog.push(debate);
    this.stats.totalDebates++;
    if (debate.converged) {
      this.stats.convergedDebates++;
      this.stats.avgRoundsToConverge = 
        (this.stats.avgRoundsToConverge * (this.stats.convergedDebates - 1) + debate.convergenceRound) 
        / this.stats.convergedDebates;
    }
    this.stats.avgConvergenceScore = 
      (this.stats.avgConvergenceScore * this.stats.totalDebates + debate.convergenceScore) 
      / this.stats.totalDebates;
    
    if (debate.stoppedEarly) {
      this.stats.stagnationStops++;
    }
    
    return this._formatResult(debate);
  }

  /**
   * 运行所有视角的初始分析
   */
  async _runPerspectives(problem, perspectives) {
    const results = [];
    for (const p of perspectives) {
      const result = await p.reasonFn(problem);
      results.push({
        perspective: p.name,
        conclusion: result.conclusion,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning,
        evidence: result.evidence || [],
        risks: result.risks || []
      });
    }
    return results;
  }

  /**
   * 单轮辩论：互相审查 → 改进
   */
  async _debateRound(problem, perspectives, previousRound) {
    const results = [];
    
    for (let i = 0; i < perspectives.length; i++) {
      const current = perspectives[i];
      const others = perspectives.filter((_, idx) => idx !== i);
      
      // 审查其他视角的结论
      const reviews = [];
      for (const other of others) {
        const previousResult = previousRound.results.find(r => r.perspective === other.name);
        if (previousResult) {
          const review = await this._reviewPerspective(previousResult, current);
          reviews.push(review);
        }
      }
      
      // 改进自己的结论
      const previousResult = previousRound.results.find(r => r.perspective === current.name);
      const improved = await this._improveWithReviews(previousResult, reviews, current);
      
      results.push(improved);
    }
    
    return results;
  }

  /**
   * 审查一个视角的结论
   */
  async _reviewPerspective(target, reviewer) {
    const issues = [];
    
    // 检查1：逻辑漏洞
    if (!target.reasoning || target.reasoning.length < 2) {
      issues.push({
        type: 'insufficient_reasoning',
        severity: 'medium',
        message: '推理过程过于简单'
      });
    }
    
    // 检查2：证据不足
    if (!target.evidence || target.evidence.length === 0) {
      issues.push({
        type: 'missing_evidence',
        severity: 'high',
        message: '缺乏支持证据'
      });
    }
    
    // 检查3：风险识别
    if (!target.risks || target.risks.length === 0) {
      issues.push({
        type: 'unidentified_risks',
        severity: 'medium',
        message: '未识别潜在风险'
      });
    }
    
    // 检查4：过度自信
    if (target.confidence > 0.9 && issues.length > 0) {
      issues.push({
        type: 'overconfidence',
        severity: 'high',
        message: '高置信度但存在明显问题'
      });
    }
    
    return {
      reviewer: reviewer.name,
      target: target.perspective,
      issues,
      verdict: issues.length === 0 ? 'APPROVED' : 'NEEDS_REVISION',
      timestamp: Date.now()
    };
  }

  /**
   * 根据审查意见改进结论
   */
  async _improveWithReviews(currentResult, reviews, perspective) {
    if (!reviews || reviews.length === 0) return currentResult;
    
    const improved = { ...currentResult };
    const newIssues = [];
    
    for (const review of reviews) {
      if (review.verdict === 'NEEDS_REVISION') {
        for (const issue of review.issues) {
          newIssues.push({
            ...issue,
            from: review.reviewer
          });
        }
      }
    }
    
    // 改进策略
    if (newIssues.some(i => i.type === 'missing_evidence')) {
      improved.evidence = improved.evidence || [];
      improved.evidence.push({ type: 'added_during_debate', source: 'debate_process' });
    }
    
    if (newIssues.some(i => i.type === 'unidentified_risks')) {
      improved.risks = improved.risks || [];
      improved.risks.push('风险待进一步评估（辩论中发现）');
    }
    
    if (newIssues.some(i => i.type === 'overconfidence')) {
      improved.confidence = Math.min(improved.confidence || 0.5, 0.7);
    }
    
    improved.improvedInRound = this.currentRound;
    improved.reviewFeedback = newIssues;
    
    return improved;
  }

  /**
   * 计算共识分数
   */
  _calculateConsensus(results) {
    if (results.length < 2) return 1.0;
    
    // 1. 结论一致性
    const conclusions = results.map(r => r.conclusion).filter(c => c);
    const uniqueConclusions = new Set(conclusions);
    const conclusionScore = conclusions.length > 0 
      ? (conclusions.length - uniqueConclusions.size + 1) / conclusions.length 
      : 0;
    
    // 2. 置信度一致性
    const confidences = results.map(r => r.confidence || 0.5);
    const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const confVariance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConf, 2), 0) / confidences.length;
    const confidenceScore = Math.max(0, 1 - confVariance * 5);
    
    // 3. 风险对齐度
    const allRisks = results.flatMap(r => r.risks || []);
    const uniqueRisks = new Set(allRisks);
    const riskAlignment = allRisks.length > 0 
      ? uniqueRisks.size / allRisks.length 
      : 1;
    
    // 综合分数
    return conclusionScore * 0.4 + confidenceScore * 0.4 + riskAlignment * 0.2;
  }

  /**
   * 提取共识
   */
  _extractConsensus(results) {
    // 找出所有视角都同意的结论
    const conclusions = results.map(r => r.conclusion).filter(c => c);
    const consensus = conclusions.find(c => conclusions.filter(x => x === c).length === conclusions.length);
    
    if (consensus) {
      return {
        conclusion: consensus,
        confidence: results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length,
        supportingPerspectives: results.filter(r => r.conclusion === consensus).map(r => r.perspective),
        extractedAt: Date.now()
      };
    }
    
    // 没有完全共识，返回最高置信度的
    const best = results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    return {
      conclusion: best.conclusion,
      confidence: best.confidence,
      note: 'No full consensus, using highest confidence',
      extractedAt: Date.now()
    };
  }

  /**
   * 提取最佳努力共识（未收敛时）
   */
  _extractBestEffortConsensus(results) {
    const best = results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    const disagreements = results.filter(r => r.conclusion !== best.conclusion);
    
    return {
      conclusion: best.conclusion,
      confidence: best.confidence * 0.7, // 降低置信度
      note: 'Debate did not converge, using best effort',
      disagreements: disagreements.map(d => ({
        perspective: d.perspective,
        conclusion: d.conclusion,
        reason: d.reasoning?.slice(0, 1) || []
      })),
      extractedAt: Date.now()
    };
  }

  /**
   * 提取分歧点
   */
  _extractDisagreements(rounds) {
    const disagreements = [];
    
    for (let i = 1; i < rounds.length; i++) {
      const prev = rounds[i - 1].results;
      const curr = rounds[i].results;
      
      for (const c of curr) {
        const prevResult = prev.find(p => p.perspective === c.perspective);
        if (prevResult && c.conclusion !== prevResult.conclusion) {
          disagreements.push({
            round: i,
            perspective: c.perspective,
            from: prevResult.conclusion,
            to: c.conclusion,
            reason: c.reviewFeedback || []
          });
        }
      }
    }
    
    return disagreements;
  }

  /**
   * 格式化结果
   */
  _formatResult(debate) {
    return {
      id: debate.id,
      converged: debate.converged,
      convergenceScore: debate.convergenceScore,
      convergenceRound: debate.convergenceRound,
      consensus: debate.consensus,
      disagreements: debate.disagreements,
      totalRounds: debate.rounds.length,
      totalTime: Date.now() - debate.startTime,
      stoppedEarly: debate.stoppedEarly || false,
      stats: this.getStats()
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      convergenceRate: this.stats.totalDebates > 0
        ? this.stats.convergedDebates / this.stats.totalDebates
        : 0,
      debateLogSize: this.debateLog.length
    };
  }

  /**
   * 获取辩论历史
   */
  getDebateHistory(limit = 10) {
    return this.debateLog.slice(-limit).map(d => ({
      id: d.id,
      converged: d.converged,
      convergenceScore: d.convergenceScore,
      rounds: d.rounds.length,
      consensus: d.consensus?.conclusion
    }));
  }
}

module.exports = DebateConvergence;
