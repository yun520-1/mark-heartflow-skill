/**
 * HeartFlow HealingMemoryRL v11.5.6
 * Q-learning based repair strategy memory for self-healing.
 * Paper: Reflexion (2023), CRITIC (2024)
 */

class HealingMemoryRL {
  constructor(maxMemory = 100) {
    this.maxMemory = maxMemory;
    // Q-table: key = errorPattern, value = { strategy: qValue }
    this.qTable = new Map();
    // History of (error, strategy, outcome)
    this.history = [];
    this.decorrelationWindow = 3; // 最近N次不同strategy才更新
  }

  /**
   * Update Q-value from repair outcome
   * @param {string} errorPattern - error key (normalized message)
   * @param {string} strategy - repair strategy used
   * @param {boolean} success - whether the repair succeeded
   */
  updateFromRepair(errorPattern, strategy, success) {
    if (!this.qTable.has(errorPattern)) {
      this.qTable.set(errorPattern, {});
    }
    const entry = this.qTable.get(errorPattern);
    const currentQ = entry[strategy] ?? 0.5;
    const reward = success ? 1.0 : -0.5;
    const learningRate = 0.2;
    entry[strategy] = currentQ + learningRate * (reward - currentQ);
  }

  /**
   * Record a repair attempt
   */
  record(errorPattern, strategy, success) {
    this.history.push({ errorPattern, strategy, success, ts: Date.now() });
    if (this.history.length > this.maxMemory) {
      this.history.shift();
    }
  }

  /**
   * Get best strategy for an error pattern
   */
  getBestStrategy(errorPattern) {
    const entry = this.qTable.get(errorPattern);
    if (!entry) return null;
    let best = null;
    let bestQ = -Infinity;
    for (const [strategy, qValue] of Object.entries(entry)) {
      if (qValue > bestQ) {
        bestQ = qValue;
        best = strategy;
      }
    }
    return best;
  }

  /**
   * Get all strategies ranked by Q-value
   */
  getRankedStrategies(errorPattern) {
    const entry = this.qTable.get(errorPattern) || {};
    return Object.entries(entry)
      .sort((a, b) => b[1] - a[1])
      .map(([strategy, qValue]) => ({ strategy, qValue }));
  }

  /**
   * Check if we should retry (has strategies with positive Q)
   */
  shouldRetry(errorPattern) {
    const ranked = this.getRankedStrategies(errorPattern);
    return ranked.length > 0 && ranked[0].qValue > 0.5;
  }

  /**
   * Export Q-table for persistence
   */
  export() {
    return {
      qTable: Object.fromEntries(this.qTable),
      history: this.history.slice(-50),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import Q-table
   */
  import(data) {
    if (data.qTable) {
      this.qTable = new Map(Object.entries(data.qTable));
    }
    if (data.history) {
      this.history = data.history.slice(-this.maxMemory);
    }
  }
}

module.exports = { HealingMemoryRL };
