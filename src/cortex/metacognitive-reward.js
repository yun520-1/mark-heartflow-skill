/**
 * MetacognitiveRewardEngine — computes a composite reward signal
 * from task success, confidence calibration, and metacognitive self-awareness.
 *
 * Formula: R = alpha * success + beta * (1 - confidenceError) + gamma * metacognitiveScore
 */

class MetacognitiveRewardEngine {
  /**
   * @param {Object} [options]
   * @param {number} [options.alpha=0.5] — weight for task-success signal
   * @param {number} [options.beta=0.3]  — weight for confidence-calibration signal
   * @param {number} [options.gamma=0.2] — weight for metacognitive-score signal
   */
  constructor(options = {}) {
    this.alpha = options.alpha ?? 0.5;
    this.beta = options.beta ?? 0.3;
    this.gamma = options.gamma ?? 0.2;
  }

  /**
   * Compute the reward value for a single evaluation cycle.
   *
   * @param {Object} params
   * @param {number} [params.success=0]            — binary or scalar success indicator (0..1)
   * @param {number} [params.confidenceError=0]    — gap between confidence and accuracy (0..1)
   * @param {number} [params.metacognitiveScore=0] — self-awareness / reflection quality (0..1)
   * @returns {number} composite reward R
   */
  compute({ success = 0, confidenceError = 0, metacognitiveScore = 0 } = {}) {
    return (
      this.alpha * success +
      this.beta * (1 - confidenceError) +
      this.gamma * metacognitiveScore
    );
  }

  /**
   * Synthesize a reward from heterogeneous module outputs.
   *
   * Each module output is expected to expose a `.reward` field; the engine
   * aggregates them by normalising to the sum of weights and rescaling
   * to the canonical formula range.
   *
   * @param {Array<{reward:number, weight?:number}>} moduleOutputs
   * @returns {{reward: number, breakdown: number[]}} composite reward + per-module breakdown
   */
  synthesize(moduleOutputs = []) {
    const breakdown = moduleOutputs.map((m, i) => {
      const w = m.weight ?? 1;
      return m.reward * w;
    });

    const reward = this.compute({
      success: breakdown[0] ?? 0,
      confidenceError: breakdown[1] ?? 0,
      metacognitiveScore: breakdown[2] ?? 0,
    });

    return { reward, breakdown };
  }

  /**
   * Adjust engine weights based on historical reward trajectories.
   *
   * A simple gradient-free heuristic: if the rolling reward mean drops
   * below a threshold, slightly re-distribute weight toward the component
   * that historically contributed most to high-reward outcomes.
   *
   * @param {Array<{alpha:number, beta:number, gamma:number, reward:number}>} historicalData
   * @returns {{alpha: number, beta: number, gamma: number, trend: 'improving'|'declining'|'stable'}}
   */
  calibrate(historicalData = []) {
    if (historicalData.length === 0) {
      return { alpha: this.alpha, beta: this.beta, gamma: this.gamma, trend: 'stable' };
    }

    const rewards = historicalData.map((d) => d.reward);
    const mean = rewards.reduce((s, r) => s + r, 0) / rewards.length;

    const firstHalf = rewards.slice(0, Math.floor(rewards.length / 2));
    const secondHalf = rewards.slice(Math.floor(rewards.length / 2));
    const firstMean = firstHalf.reduce((s, r) => s + r, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((s, r) => s + r, 0) / secondHalf.length;

    let trend = 'stable';
    if (secondMean > firstMean + 0.05) trend = 'improving';
    else if (secondMean < firstMean - 0.05) trend = 'declining';

    if (trend === 'declining') {
      const best = historicalData.reduce((a, b) => (a.reward > b.reward ? a : b));
      const total = best.alpha + best.beta + best.gamma || 1;
      this.alpha = (best.alpha / total).toFixed(4);
      this.beta = (best.beta / total).toFixed(4);
      this.gamma = (best.gamma / total).toFixed(4);
    }

    return { alpha: this.alpha, beta: this.beta, gamma: this.gamma, trend };
  }
}

module.exports = { MetacognitiveRewardEngine };
