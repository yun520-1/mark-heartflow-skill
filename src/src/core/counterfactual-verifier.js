/**
 * counterfactual-verifier.js
 * 基于 V21.1 对比Loss设计
 * 心虫决策验证的增强模块
 * 
 * 核心思想：
 * 1. 不仅验证结论是否正确
 * 2. 还要验证是否排除了错误选项
 * 3. 反事实检查：如果选了其他方案，结果会怎样？
 * 
 * V21.1 对比Loss:
 * wrong_prob = softmax(logits)在错字位置的概率
 * contrast_loss = wrong_prob.mean()
 * → 模型不仅要输出对字，还要避免输出错字
 * 
 * 心虫实现：
 * - 生成多个候选决策
 * - 对每个决策计算"排除其他选项"的强度
 * - 如果最佳选项的对比度不够高，标记为"需要更多信息"
 */

class CounterfactualVerifier {
  constructor(options = {}) {
    this.minMargin = options.minMargin || 0.3; // 最小决策边际
    this.maxCandidates = options.maxCandidates || 5;
    this.contrastWeight = options.contrastWeight || 0.2; // 对比Loss权重
    
    this.initialized = false;
    this.stats = {
      totalVerifications: 0,
      highConfidence: 0,
      lowConfidence: 0,
      averageMargin: 0
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
   * 核心方法：反事实验证
   * @param {Object} decision - 待验证的决策 {conclusion, confidence, evidence}
   * @param {Array} alternatives - 备选方案列表
   * @param {Object} context - 上下文 {domain, stakes, timePressure}
   * @returns {Object} 验证结果 {verified, margin, contrastScore, recommendation}
   */
  verify(decision, alternatives = [], context = {}) {
    if (!decision || !decision.conclusion) {
      return { verified: false, reason: 'Missing decision conclusion' };
    }
    
    this.stats.totalVerifications++;
    
    // 1. 生成候选方案（如果没有提供）
    const candidates = alternatives.length > 0 
      ? alternatives 
      : this._generateCandidates(decision);
    
    // 2. 对每个候选方案评分
    const scores = candidates.map(c => ({
      candidate: c,
      score: this._scoreCandidate(c, decision, context),
      probability: 0
    }));
    
    // 3. 计算概率分布（softmax）
    const maxScore = Math.max(...scores.map(s => s.score));
    const expScores = scores.map(s => Math.exp((s.score - maxScore) * 10));
    const sumExp = expScores.reduce((a, b) => a + b, 0);
    
    scores.forEach((s, i) => {
      s.probability = expScores[i] / sumExp;
    });
    
    // 4. 排序
    scores.sort((a, b) => b.probability - a.probability);
    
    // 5. 计算决策边际（最佳 vs 次佳）
    const margin = scores.length >= 2 
      ? scores[0].probability - scores[1].probability 
      : 1.0;
    
    // 6. 对比Loss：惩罚高概率的错选项
    const wrongProb = scores.length >= 2 ? scores[1].probability : 0;
    const contrastScore = 1.0 - wrongProb; // 越高越好
    
    // 7. 综合验证
    const verified = margin >= this.minMargin && contrastScore >= (1 - this.minMargin);
    const confidence = (margin * 0.6 + contrastScore * 0.4);
    
    // 8. 更新统计
    if (confidence >= 0.7) {
      this.stats.highConfidence++;
    } else {
      this.stats.lowConfidence++;
    }
    this.stats.averageMargin = 
      (this.stats.averageMargin * (this.stats.totalVerifications - 1) + margin) 
      / this.stats.totalVerifications;
    
    // 9. 生成建议
    let recommendation = 'accept';
    if (!verified) {
      if (margin < this.minMargin) {
        recommendation = 'gather_more_evidence';
      } else if (contrastScore < (1 - this.minMargin)) {
        recommendation = 'challenge_assumptions';
      }
    }
    
    return {
      verified,
      confidence,
      margin,
      contrastScore,
      recommendation,
      topCandidates: scores.slice(0, 3),
      eliminated: scores.filter(s => s.probability < 0.1).map(s => s.candidate),
      context: {
        domain: context.domain,
        stakes: context.stakes || 'medium',
        timePressure: context.timePressure || false
      }
    };
  }

  /**
   * 对候选方案评分
   */
  _scoreCandidate(candidate, decision, context) {
    let score = 0.5; // 基础分
    
    // 1. 证据支持度
    if (candidate.evidence) {
      score += Math.min(candidate.evidence.length * 0.1, 0.3);
    }
    
    // 2. 与原始决策的一致性
    if (candidate.conclusion === decision.conclusion) {
      score += 0.2;
    }
    
    // 3. 风险考量
    if (candidate.risks && candidate.risks.length > 0) {
      score -= candidate.risks.length * 0.05;
    }
    
    // 4. 领域适配
    if (candidate.domain && context.domain) {
      if (candidate.domain === context.domain) {
        score += 0.1;
      }
    }
    
    // 5. 时间压力调整
    if (context.timePressure && candidate.speed) {
      score += candidate.speed * 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * 生成备选方案（如果没有提供）
   */
  _generateCandidates(decision) {
    const candidates = [];
    const conclusion = decision.conclusion;
    
    // 生成"不行动"选项
    candidates.push({
      candidate: 'no_action',
      conclusion: '不行动',
      evidence: decision.evidence?.filter(e => e.type === 'risk') || [],
      risks: ['机会成本', '问题恶化'],
      speed: 1.0
    });
    
    // 生成"反向行动"选项
    candidates.push({
      candidate: 'reverse_action',
      conclusion: `反向：${this._reverseConclusion(conclusion)}`,
      evidence: [],
      risks: ['不确定性', '资源浪费'],
      speed: 0.5
    });
    
    // 生成"部分行动"选项
    candidates.push({
      candidate: 'partial_action',
      conclusion: `部分执行：${conclusion}（小规模试点）`,
      evidence: decision.evidence?.slice(0, 2) || [],
      risks: ['效果有限'],
      speed: 0.7
    });
    
    return candidates;
  }

  /**
   * 反转结论
   */
  _reverseConclusion(conclusion) {
    const opposites = {
      'accept': 'reject',
      'approve': 'deny',
      'invest': 'divest',
      'hire': 'fire',
      'launch': 'delay',
      'expand': 'shrink'
    };
    return opposites[conclusion] || `反向：${conclusion}`;
  }

  /**
   * 批量验证
   */
  batchVerify(decisions, context = {}) {
    return decisions.map(d => this.verify(d, [], context));
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      convergenceRate: this.stats.totalVerifications > 0
        ? this.stats.highConfidence / this.stats.totalVerifications
        : 0
    };
  }
}

module.exports = CounterfactualVerifier;
