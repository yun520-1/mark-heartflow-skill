/**
 * Metacognitive RL — 元认知强化学习
 *
 * 基于 arXiv:2606.32032 "Reinforcement Learning with Metacognitive Feedback
 * Elicits Faithful Uncertainty Expression in LLMs"
 *
 * 解决 LLM 元认知缺陷：高置信度幻觉、无法识别知识边界、错误表达不确定性。
 * 通过 RL + 元认知反馈，让模型学会：
 *   1. 准确评估自己的性能
 *   2. 在知识边界处诚实表达不确定性
 *   3. 在不确定时调整行为而非硬撑
 *
 * @version 1.0.0
 */

class MetacognitiveRL {
  constructor(options = {}) {
    this._config = {
      learningRate: options.learningRate || 0.1,
      discountFactor: options.discountFactor || 0.95,
      confidenceLevels: options.confidenceLevels || 5,
      feedbackDecay: options.feedbackDecay || 0.99,
      minConfidenceThreshold: options.minConfidenceThreshold || 0.3,
      calibrationWindow: options.calibrationWindow || 50,
      ...options,
    };

    this._qTable = {};          // 状态 → 置信度级别 的 Q 值
    this._episodes = [];
    this._calibrationHistory = [];
    this._metacognitiveState = {
      selfAssessment: 0.5,     // 自我评估准确度
      knowledgeBoundary: 0.5,  // 知识边界识别能力
      uncertaintyExpression: 0.5, // 不确定性表达能力
      performanceMonitoring: 0.5, // 性能监控能力
    };
    this._stats = {
      totalEpisodes: 0,
      calibrationErrors: 0,
      overconfidenceCount: 0,
      underconfidenceCount: 0,
      honestAdmissions: 0,
    };
  }

  // ─── State Representation ──────────────────────────────────

  /**
   * 将认知状态编码为状态键
   */
  encodeState(cognitiveState) {
    const {
      load = 0.5,
      confidence = 0.5,
      uncertainty = 0.5,
      domain = 'unknown',
      complexity = 'medium',
    } = cognitiveState;

    const loadBin = Math.min(3, Math.floor(load * 4));
    const confBin = Math.min(3, Math.floor(confidence * 4));
    const uncBin = Math.min(3, Math.floor(uncertainty * 4));
    const complexityMap = { low: 0, medium: 1, high: 2 };
    const cBin = complexityMap[complexity] || 1;

    return `${loadBin}:${confBin}:${uncBin}:${domain}:${cBin}`;
  }

  // ─── Confidence Expression ─────────────────────────────────

  /**
   * 选择置信度表达（基于 Q 值和元认知状态）
   * @param {Object} cognitiveState
   * @returns {Object} { confidence, uncertainty, reason }
   */
  expressConfidence(cognitiveState) {
    const state = this.encodeState(cognitiveState);
    const rawConfidence = cognitiveState.confidence || 0.5;

    // 元认知校准：根据历史表现调整自我评估
    const calibrationFactor = this._metacognitiveState.selfAssessment;
    let adjustedConfidence = rawConfidence * calibrationFactor;

    // Q 值引导
    const qEntry = this._qTable[state];
    if (qEntry) {
      const qValue = Object.values(qEntry).reduce((a, b) => a + b, 0) / Object.keys(qEntry).length;
      adjustedConfidence = adjustedConfidence * 0.7 + qValue * 0.3;
    }

    // 知识边界检测：如果过去在该领域错误率高，降低置信度
    const domainErrorRate = this._getDomainErrorRate(cognitiveState.domain || '');
    if (domainErrorRate > 0.3) {
      adjustedConfidence *= 0.7;
    }

    adjustedConfidence = Math.max(0.05, Math.min(0.98, adjustedConfidence));

    const expressedUncertainty = Math.max(0, 1 - adjustedConfidence);

    const result = {
      confidence: +adjustedConfidence.toFixed(3),
      uncertainty: +expressedUncertainty.toFixed(3),
      state,
      calibrationFactor: +calibrationFactor.toFixed(3),
      domainErrorRate: +domainErrorRate.toFixed(3),
      reason: this._generateReason(cognitiveState, adjustedConfidence, domainErrorRate),
    };

    this._calibrationHistory.push({
      timestamp: Date.now(),
      state,
      rawConfidence,
      adjustedConfidence,
      domain: cognitiveState.domain || '',
    });

    if (this._calibrationHistory.length > this._config.calibrationWindow) {
      this._calibrationHistory.shift();
    }

    return result;
  }

  _getDomainErrorRate(domain) {
    const domainEpisodes = this._episodes.filter(e => e.domain === domain);
    if (domainEpisodes.length === 0) return 0;
    return domainEpisodes.filter(e => !e.success).length / domainEpisodes.length;
  }

  _generateReason(state, confidence, domainErrorRate) {
    if (typeof state !== 'string') return 'unknown_state';
    if (confidence < 0.3) return 'low_confidence';
    if (domainErrorRate > 0.3) return 'high_domain_error_rate';
    if (state.split(':')[0] === '3') return 'high_cognitive_load';
    return 'normal';
  }

  // ─── Learning from Feedback ─────────────────────────────────

  /**
   * 从结果反馈中学习（RL 更新）
   * @param {string} state - 状态键
   * @param {number} expressedConfidence - 表达的置信度
   * @param {Object} outcome - 结果 { success, actualConfidence }
   */
  learn(state, expressedConfidence, outcome) {
    const { success, actualConfidence } = outcome;
    const reward = this._computeReward(expressedConfidence, success, actualConfidence);

    const level = Math.min(
      this._config.confidenceLevels - 1,
      Math.floor(expressedConfidence * this._config.confidenceLevels)
    );

    if (!this._qTable[state]) {
      this._qTable[state] = {};
      for (let i = 0; i < this._config.confidenceLevels; i++) {
        this._qTable[state][i] = 0;
      }
    }

    // Q 值更新
    const oldQ = this._qTable[state][level] || 0;
    const maxQ = Math.max(...Object.values(this._qTable[state]));
    const newQ = oldQ + this._config.learningRate * (reward + this._config.discountFactor * maxQ - oldQ);
    this._qTable[state][level] = +newQ.toFixed(4);

    // 更新元认知状态
    this._updateMetacognitiveState(expressedConfidence, success, actualConfidence);

    this._stats.totalEpisodes++;

    if (expressedConfidence > 0.8 && !success) this._stats.overconfidenceCount++;
    if (expressedConfidence < 0.3 && success) this._stats.underconfidenceCount++;
    if (expressedConfidence < 0.3) this._stats.honestAdmissions++;

    return { reward, newQ, level };
  }

  _computeReward(expressedConfidence, success, actualConfidence) {
    const calibrationError = Math.abs(expressedConfidence - (actualConfidence || (success ? 0.9 : 0.1)));
    let reward = 0;

    if (success && expressedConfidence > 0.5) reward += 1.0;
    else if (!success && expressedConfidence < 0.5) reward += 0.8;
    else if (!success && expressedConfidence > 0.8) reward -= 1.0;
    else if (success && expressedConfidence < 0.3) reward -= 0.5;

    reward += (1 - calibrationError) * 0.5;
    return +reward.toFixed(3);
  }

  _updateMetacognitiveState(expressed, success, actual) {
    const actualConf = actual || (success ? 0.9 : 0.1);
    const error = Math.abs(expressed - actualConf);

    // 自我评估准确度
    const newSA = 1 - error;
    this._metacognitiveState.selfAssessment +=
      this._config.learningRate * (newSA - this._metacognitiveState.selfAssessment);
    this._metacognitiveState.selfAssessment = Math.max(0, Math.min(1, this._metacognitiveState.selfAssessment));

    // 性能监控（越频繁收到反馈，监控越强）
    this._metacognitiveState.performanceMonitoring = Math.min(1,
      this._metacognitiveState.performanceMonitoring + 0.01);

    // 不确定性表达（奖励低置信度+成功 → 提高表达能力）
    if (expressed < 0.5 && success) {
      this._metacognitiveState.uncertaintyExpression = Math.min(1,
        this._metacognitiveState.uncertaintyExpression + 0.02);
    }
  }

  // ─── Calibration Report ─────────────────────────────────────

  getCalibrationReport() {
    const history = this._calibrationHistory;
    if (history.length < 5) return { status: 'insufficient_data', samples: history.length };

    const bins = Array.from({ length: 10 }, () => ({ count: 0, errors: [] }));
    for (const entry of history) {
      const binIdx = Math.min(9, Math.floor(entry.adjustedConfidence * 10));
      bins[binIdx].count++;
    }

    const calibrationError = history.reduce((sum, h) => {
      return sum + Math.abs(h.adjustedConfidence - h.rawConfidence);
    }, 0) / history.length;

    return {
      status: calibrationError < 0.2 ? 'well_calibrated' : calibrationError < 0.4 ? 'moderate' : 'poorly_calibrated',
      calibrationError: +calibrationError.toFixed(3),
      samples: history.length,
      distribution: bins,
      metacognitiveState: { ...this._metacognitiveState },
      stats: { ...this._stats },
    };
  }

  getStats() {
    return {
      ...this._stats,
      qTableSize: Object.keys(this._qTable).length,
      metacognitiveState: { ...this._metacognitiveState },
    };
  }
}

module.exports = { MetacognitiveRL };
