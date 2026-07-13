/**
 * ActiveInference — M3 主动推理决策引擎
 * 
 * 基于Friston(2017)主动推理理论: 策略选择最小化期望自由能(EFE)
 * EFE = 实用价值(Pragmatic Value) + 认知价值(Epistemic Value)
 * 
 * v5.17.17 M3: AI人类决策层 — 探索vs利用平衡
 */

const DEFAULT_OPTIONS = {
  pragmaticWeight: 0.6,    // 实用价值权重(目标导向)
  epistemicWeight: 0.4,    // 认知价值权重(信息增益)
  riskTolerance: 0.3,      // 风险容忍度
  minConfidence: 0.1,      // 最小置信度(低于此值强制探索)
};

class ActiveInference {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this._history = [];
  }

  /**
   * 计算期望自由能并选择最优策略
   * @param {Array<{label, pragmaticScore, uncertainty, novelty}>} candidates
   * @param {Object} context — { emotionalState, riskLevel, timePressure }
   * @returns {Object} — { selected, scores[], metrics }
   */
  decide(candidates, context = {}) {
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return { selected: candidates[0], scores: candidates, autoSelect: true };

    const { pragmaticWeight, epistemicWeight, riskTolerance, minConfidence } = this.options;

    // 时间压力→降低探索权重
    const timePressure = context.timePressure || 0.5;
    const adjustedEpistemic = epistemicWeight * (1 - timePressure * 0.5);

    const scored = candidates.map(c => {
      const pragmatic = (c.pragmaticScore || 0.5) * pragmaticWeight;
      const epistemic = (c.novelty || c.uncertainty || 0.3) * adjustedEpistemic;

      // 期望自由能 = -(实用价值 + 认知价值) → 越低越好
      const efe = -1 * (pragmatic + epistemic);
      // 决策得分 = 实用+认知 → 越高越好
      const score = +(pragmatic + epistemic).toFixed(4);

      return {
        ...c,
        pragmaticValue: +pragmatic.toFixed(3),
        epistemicValue: +epistemic.toFixed(3),
        expectedFreeEnergy: +efe.toFixed(4),
        score,
      };
    });

    // 按得分排序
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    const second = scored[1];

    // 判定是否需要更多证据
    const needsMoreEvidence = 
      best.score < minConfidence ||
      (best.pragmaticScore || 0) < riskTolerance ||
      (second && second.score > best.score * 0.8);

    // 记录历史
    this._history.push({
      selected: best.label,
      candidates: scored.length,
      needsMoreEvidence,
      timestamp: Date.now(),
    });
    if (this._history.length > 100) this._history.shift();

    return {
      selected: best,
      scores: scored,
      needsMoreEvidence,
      exploitation: best.pragmaticValue,
      exploration: best.epistemicValue,
      confidenceMargin: second ? +(best.score - second.score).toFixed(4) : 1,
      activeInference: {
        regime: needsMoreEvidence ? 'explore' : (best.pragmaticValue > 0.7 ? 'exploit' : 'balanced'),
      },
    };
  }

  /**
   * 获取决策历史统计
   */
  getStats() {
    if (this._history.length === 0) return null;
    const total = this._history.length;
    const explored = this._history.filter(h => h.needsMoreEvidence).length;
    return {
      totalDecisions: total,
      explorationRate: +(explored / total).toFixed(3),
      recentCandidates: this._history.slice(-10).map(h => h.candidates),
    };
  }
}

module.exports = { ActiveInference, DEFAULT_OPTIONS };