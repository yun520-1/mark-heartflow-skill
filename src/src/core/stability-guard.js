/**
 * HeartFlow Stability Guard
 *
 * Verifies the runtime stays within a safe execution envelope.
 * Acts as a lightweight gate before and after upgrades.
 *
 * v2 — Added:
 *   - Oscillation detection (history-based flip tracking)
 *   - Trend analysis (confidence/actionability/noise trends over N samples)
 *   - Continuous stability score (0-100 scale)
 *   - Rapid fluctuation suppression with exponential smoothing
 *   - Degradation tracking (slow vs sudden failure detection)
 *   - Dynamic threshold adjustment based on observed patterns
 */

class StabilityGuard {
  constructor(options = {}) {
    this.thresholds = {
      minConfidence: options.minConfidence ?? 0.6,
      maxNoiseRatio: options.maxNoiseRatio ?? 0.45,
      minActionability: options.minActionability ?? 0.5,
    };

    // History tracking for oscillation and trend detection
    this.history = {
      maxSamples: options.maxHistorySamples ?? 20,
      evaluations: [],  // [{ confidence, noiseRatio, actionability, timestamp }]
    };

    // Smoothing state for fluctuation suppression
    this.smoothing = {
      alpha: options.smoothingAlpha ?? 0.3,       // exponential smoothing factor (lower = smoother)
      smoothedConfidence: null,
      smoothedNoiseRatio: null,
      smoothedActionability: null,
    };

    // Oscillation tracking
    this.oscillation = {
      count: 0,
      lastStable: null,    // boolean: was last evaluation stable?
      maxAllowedFlips: options.maxOscillationFlips ?? 5,
      cooldownRemaining: 0,  // evaluation cycles to wait before trusting
    };

    // Degradation tracking
    this.degradation = {
      baselineConfidence: null,
      baselineNoiseRatio: null,
      baselineActionability: null,
      baselineSamples: 3,       // samples needed to establish baseline
      samplesCollected: 0,
      degradationThreshold: options.degradationThreshold ?? 0.15,  // 15% drop = degradation
    };

    // Dynamic threshold adjustment
    this.dynamicAdjust = {
      enabled: options.enableDynamicThresholds ?? true,
      adjustmentFactor: options.adjustmentFactor ?? 0.05,  // max ±5% adjustment per cycle
      adjustedMinConfidence: null,
      adjustedMaxNoiseRatio: null,
      adjustedMinActionability: null,
      baselineSamples: 5,  // samples needed before dynamic adjustment activates
    };

    this.phrases = {
      safe: 'safe to continue',
      repair: 'pause, simplify, and repair',
    };
  }

  /**
   * Evaluate a single snapshot against current thresholds.
   * Returns verdict with stability score, issues, and trend info.
   */
  evaluate(snapshot = {}) {
    const rawConfidence = Number(snapshot.confidence ?? 0);
    const rawNoiseRatio = Number(snapshot.noiseRatio ?? 0);
    const rawActionability = Number(snapshot.actionability ?? 0);

    // Apply exponential smoothing to suppress rapid fluctuations
    const confidence = this._applySmoothing('smoothedConfidence', rawConfidence);
    const noiseRatio = this._applySmoothing('smoothedNoiseRatio', rawNoiseRatio);
    const actionability = this._applySmoothing('smoothedActionability', rawActionability);

    // Record evaluation in history
    this._recordEvaluation({ confidence, noiseRatio, actionability });

    // Establish baseline for degradation tracking
    this._updateBaseline({ confidence, noiseRatio, actionability });

    // Get effective thresholds (possibly dynamically adjusted)
    const effectiveThresholds = this._getEffectiveThresholds();

    // Check individual metrics
    const issues = [];

    if (confidence < effectiveThresholds.minConfidence) {
      issues.push({ type: 'low_confidence', message: 'confidence below threshold', severity: 'warning' });
    }
    if (noiseRatio > effectiveThresholds.maxNoiseRatio) {
      issues.push({ type: 'high_noise', message: 'noise ratio above threshold', severity: 'warning' });
    }
    if (actionability < effectiveThresholds.minActionability) {
      issues.push({ type: 'low_actionability', message: 'actionability below threshold', severity: 'warning' });
    }

    // Oscillation detection
    const oscillationInfo = this._detectOscillation(issues.length === 0);
    if (oscillationInfo.oscillating) {
      issues.push({
        type: 'oscillation',
        message: `rapid state flips detected (${oscillationInfo.count} in recent history)`,
        severity: 'critical',
        flips: oscillationInfo.count,
      });
    }

    // Trend analysis
    const trends = this._analyzeTrends();

    // Add trend warnings
    if (trends.confidenceTrend === 'declining') {
      issues.push({
        type: 'confidence_declining',
        message: `confidence trending down over ${trends.samplesUsed} samples`,
        severity: trends.confidenceTrendStrength === 'strong' ? 'critical' : 'info',
      });
    }
    if (trends.noiseTrend === 'rising') {
      issues.push({
        type: 'noise_rising',
        message: `noise ratio trending up over ${trends.samplesUsed} samples`,
        severity: trends.noiseTrendStrength === 'strong' ? 'critical' : 'info',
      });
    }

    // Degradation detection
    const degradationInfo = this._checkDegradation({ confidence, noiseRatio, actionability });

    if (degradationInfo.degraded) {
      issues.push({
        type: 'degradation',
        message: `system degradation detected: ${degradationInfo.details.join(', ')}`,
        severity: 'critical',
        changes: degradationInfo.changes,
      });
    }

    // Compute continuous stability score (0-100)
    const stabilityScore = this._computeStabilityScore(
      confidence, noiseRatio, actionability,
      effectiveThresholds, issues, trends, oscillationInfo
    );

    // Dynamically adjust thresholds if enabled
    if (this.dynamicAdjust.enabled && this.history.evaluations.length >= this.dynamicAdjust.baselineSamples) {
      this._adjustThresholds(stabilityScore);
    }

    // Decrement oscillation cooldown
    if (this.oscillation.cooldownRemaining > 0) {
      this.oscillation.cooldownRemaining--;
    }

    const stable = issues.length === 0;

    return {
      stable,
      stabilityScore,
      issues,
      raw: { confidence: rawConfidence, noiseRatio: rawNoiseRatio, actionability: rawActionability },
      smoothed: { confidence, noiseRatio, actionability },
      thresholds: effectiveThresholds,
      trends,
      oscillation: oscillationInfo,
      degradation: degradationInfo,
      summary: this._generateSummary(stable, stabilityScore, issues.length),
      advice: this.summarizeAdvice(issues),
    };
  }

  /**
   * Gate check — determines if execution should proceed.
   */
  gate(result = {}) {
    const verdict = this.evaluate(result);
    const hasOscillation = verdict.issues.some(i => i.type === 'oscillation');
    const hasDegradation = verdict.issues.some(i => i.type === 'degradation');
    const hasCritical = verdict.issues.some(i => i.severity === 'critical');

    // Critical issues always block execution
    const allow = !hasCritical && (verdict.stable || verdict.stabilityScore >= 40);

    return {
      ...verdict,
      allow,
      hint: allow ? this.phrases.safe : this.phrases.repair,
      next_step: allow ? 'continue' : (hasOscillation ? 'stabilize' : 'repair'),
      repairHints: this._generateRepairHints(verdict),
    };
  }

  /**
   * Reset all tracking state (for clean start).
   */
  reset() {
    this.history.evaluations = [];
    this.smoothing.smoothedConfidence = null;
    this.smoothing.smoothedNoiseRatio = null;
    this.smoothing.smoothedActionability = null;
    this.oscillation.count = 0;
    this.oscillation.lastStable = null;
    this.oscillation.cooldownRemaining = 0;
    this.degradation.baselineConfidence = null;
    this.degradation.baselineNoiseRatio = null;
    this.degradation.baselineActionability = null;
    this.degradation.samplesCollected = 0;
    this.dynamicAdjust.adjustedMinConfidence = null;
    this.dynamicAdjust.adjustedMaxNoiseRatio = null;
    this.dynamicAdjust.adjustedMinActionability = null;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  _applySmoothing(field, rawValue) {
    if (this.smoothing[field] === null) {
      this.smoothing[field] = rawValue;
      return rawValue;
    }
    const alpha = this.smoothing.alpha;
    this.smoothing[field] = alpha * rawValue + (1 - alpha) * this.smoothing[field];
    return this.smoothing[field];
  }

  _recordEvaluation({ confidence, noiseRatio, actionability }) {
    this.history.evaluations.push({
      confidence,
      noiseRatio,
      actionability,
      timestamp: Date.now(),
    });

    // Trim history to maxSamples
    if (this.history.evaluations.length > this.history.maxSamples) {
      this.history.evaluations.shift();
    }
  }

  _updateBaseline({ confidence, noiseRatio, actionability }) {
    if (this.degradation.samplesCollected < this.degradation.baselineSamples) {
      if (this.degradation.baselineConfidence === null) {
        this.degradation.baselineConfidence = 0;
        this.degradation.baselineNoiseRatio = 0;
        this.degradation.baselineActionability = 0;
      }
      this.degradation.baselineConfidence += confidence;
      this.degradation.baselineNoiseRatio += noiseRatio;
      this.degradation.baselineActionability += actionability;
      this.degradation.samplesCollected++;

      if (this.degradation.samplesCollected >= this.degradation.baselineSamples) {
        this.degradation.baselineConfidence /= this.degradation.baselineSamples;
        this.degradation.baselineNoiseRatio /= this.degradation.baselineSamples;
        this.degradation.baselineActionability /= this.degradation.baselineSamples;
      }
    }
  }

  _getEffectiveThresholds() {
    return {
      minConfidence: this.dynamicAdjust.adjustedMinConfidence ?? this.thresholds.minConfidence,
      maxNoiseRatio: this.dynamicAdjust.adjustedMaxNoiseRatio ?? this.thresholds.maxNoiseRatio,
      minActionability: this.dynamicAdjust.adjustedMinActionability ?? this.thresholds.minActionability,
    };
  }

  _detectOscillation(currentlyStable) {
    const maxFlips = this.oscillation.maxAllowedFlips;

    if (this.oscillation.lastStable === null) {
      this.oscillation.lastStable = currentlyStable;
      return { oscillating: false, count: 0 };
    }

    // Count flips in recent history
    if (this.oscillation.lastStable !== currentlyStable) {
      this.oscillation.count++;
      this.oscillation.lastStable = currentlyStable;

      // If flips exceed threshold, enter cooldown
      if (this.oscillation.count >= maxFlips) {
        this.oscillation.cooldownRemaining = 3;
      }
    }

    const isOscillating = this.oscillation.count >= maxFlips;
    return {
      oscillating: isOscillating,
      count: this.oscillation.count,
      cooldown: this.oscillation.cooldownRemaining,
    };
  }

  _analyzeTrends() {
    const evals = this.history.evaluations;
    if (evals.length < 4) {
      return {
        confidenceTrend: 'insufficient_data',
        noiseTrend: 'insufficient_data',
        actionabilityTrend: 'insufficient_data',
        samplesUsed: evals.length,
        confidenceTrendStrength: 'none',
        noiseTrendStrength: 'none',
        actionabilityTrendStrength: 'none',
      };
    }

    // Use the last 8 samples (or all if fewer) for trend analysis
    const window = evals.slice(-Math.min(8, evals.length));
    const half = Math.floor(window.length / 2);
    const firstHalf = window.slice(0, half);
    const secondHalf = window.slice(half);

    const avgFirstConf = firstHalf.reduce((s, e) => s + e.confidence, 0) / firstHalf.length;
    const avgSecondConf = secondHalf.reduce((s, e) => s + e.confidence, 0) / secondHalf.length;
    const avgFirstNoise = firstHalf.reduce((s, e) => s + e.noiseRatio, 0) / firstHalf.length;
    const avgSecondNoise = secondHalf.reduce((s, e) => s + e.noiseRatio, 0) / secondHalf.length;
    const avgFirstAction = firstHalf.reduce((s, e) => s + e.actionability, 0) / firstHalf.length;
    const avgSecondAction = secondHalf.reduce((s, e) => s + e.actionability, 0) / secondHalf.length;

    const confDiff = avgSecondConf - avgFirstConf;
    const noiseDiff = avgSecondNoise - avgFirstNoise;
    const actionDiff = avgSecondAction - avgFirstAction;

    // Classify trends and strengths
    const classify = (diff, threshold) => {
      const absDiff = Math.abs(diff);
      if (absDiff < threshold) return { direction: 'stable', strength: 'none' };
      return {
        direction: diff > 0 ? 'rising' : 'declining',
        strength: absDiff > threshold * 2 ? 'strong' : 'moderate',
      };
    };

    const confTrend = classify(confDiff, 0.05);
    const noiseTrend = classify(noiseDiff, 0.05);
    const actionTrend = classify(actionDiff, 0.05);

    return {
      confidenceTrend: confTrend.direction,
      noiseTrend: noiseTrend.direction,
      actionabilityTrend: actionTrend.direction,
      samplesUsed: evals.length,
      confidenceTrendStrength: confTrend.strength,
      noiseTrendStrength: noiseTrend.strength,
      actionabilityTrendStrength: actionTrend.strength,
      deltas: { confidence: confDiff, noise: noiseDiff, actionability: actionDiff },
    };
  }

  _checkDegradation({ confidence, noiseRatio, actionability }) {
    if (this.degradation.samplesCollected < this.degradation.baselineSamples) {
      return { degraded: false, details: [], changes: {} };
    }

    const threshold = this.degradation.degradationThreshold;
    const changes = {};
    const details = [];

    if (this.degradation.baselineConfidence !== null) {
      const confChange = (confidence - this.degradation.baselineConfidence) / this.degradation.baselineConfidence;
      changes.confidenceChange = confChange;
      if (confChange < -threshold) {
        details.push(`confidence dropped ${Math.round(Math.abs(confChange) * 100)}% from baseline`);
      }
    }

    if (this.degradation.baselineNoiseRatio !== null) {
      const noiseChange = this.degradation.baselineNoiseRatio > 0
        ? (noiseRatio - this.degradation.baselineNoiseRatio) / this.degradation.baselineNoiseRatio
        : 0;
      changes.noiseChange = noiseChange;
      if (noiseChange > threshold) {
        details.push(`noise increased ${Math.round(noiseChange * 100)}% from baseline`);
      }
    }

    if (this.degradation.baselineActionability !== null) {
      const actionChange = this.degradation.baselineActionability > 0
        ? (actionability - this.degradation.baselineActionability) / this.degradation.baselineActionability
        : 0;
      changes.actionabilityChange = actionChange;
      if (actionChange < -threshold) {
        details.push(`actionability dropped ${Math.round(Math.abs(actionChange) * 100)}% from baseline`);
      }
    }

    return {
      degraded: details.length > 0,
      details,
      changes,
      baseline: {
        confidence: this.degradation.baselineConfidence,
        noiseRatio: this.degradation.baselineNoiseRatio,
        actionability: this.degradation.baselineActionability,
      },
    };
  }

  _computeStabilityScore(confidence, noiseRatio, actionability, thresholds, issues, trends, oscillationInfo) {
    // Start at 100, deduct based on various factors
    let score = 100;

    // Deduction for metrics below thresholds
    if (confidence < thresholds.minConfidence) {
      score -= (thresholds.minConfidence - confidence) * 100;
    }
    if (noiseRatio > thresholds.maxNoiseRatio) {
      score -= (noiseRatio - thresholds.maxNoiseRatio) * 100;
    }
    if (actionability < thresholds.minActionability) {
      score -= (thresholds.minActionability - actionability) * 100;
    }

    // Deduction for oscillation
    if (oscillationInfo.oscillating) {
      score -= Math.min(40, oscillationInfo.count * 8);
    }

    // Deduction for declining trends
    if (trends.confidenceTrend === 'declining') {
      const penalty = trends.confidenceTrendStrength === 'strong' ? 20 : 10;
      score -= penalty;
    }
    if (trends.noiseTrend === 'rising') {
      const penalty = trends.noiseTrendStrength === 'strong' ? 20 : 10;
      score -= penalty;
    }
    if (trends.actionabilityTrend === 'declining') {
      const penalty = trends.actionabilityTrendStrength === 'strong' ? 15 : 8;
      score -= penalty;
    }

    // Deduction for critical issues
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    score -= criticalCount * 15;

    // Bonus for trend recovery (noise going down, confidence going up)
    if (trends.confidenceTrend === 'rising') {
      const bonus = trends.confidenceTrendStrength === 'strong' ? 8 : 4;
      score += bonus;
    }
    if (trends.noiseTrend === 'declining') {
      const bonus = trends.noiseTrendStrength === 'strong' ? 8 : 4;
      score += bonus;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  _adjustThresholds(stabilityScore) {
    const adj = this.dynamicAdjust.adjustmentFactor;

    if (this.history.evaluations.length < 5) return;

    // Calculate recent stability trend
    const recent = this.history.evaluations.slice(-5);
    const avgRecentConf = recent.reduce((s, e) => s + e.confidence, 0) / recent.length;
    const avgRecentNoise = recent.reduce((s, e) => s + e.noiseRatio, 0) / recent.length;
    const avgRecentAction = recent.reduce((s, e) => s + e.actionability, 0) / recent.length;

    // If consistently stable, slightly tighten thresholds (higher bar)
    // If consistently unstable, slightly loosen (more permissive to avoid false alarms)
    const baseConf = this.thresholds.minConfidence;
    const baseNoise = this.thresholds.maxNoiseRatio;
    const baseAction = this.thresholds.minActionability;

    if (stabilityScore >= 80) {
      // System is very stable — tighten thresholds
      this.dynamicAdjust.adjustedMinConfidence = Math.min(1.0, baseConf + adj);
      this.dynamicAdjust.adjustedMaxNoiseRatio = Math.max(0, baseNoise - adj);
      this.dynamicAdjust.adjustedMinActionability = Math.min(1.0, baseAction + adj);
    } else if (stabilityScore < 30) {
      // System is struggling — loosen thresholds
      this.dynamicAdjust.adjustedMinConfidence = Math.max(0, baseConf - adj);
      this.dynamicAdjust.adjustedMaxNoiseRatio = Math.min(1.0, baseNoise + adj);
      this.dynamicAdjust.adjustedMinActionability = Math.max(0, baseAction - adj);
    }
    // Otherwise keep current adjusted values (if any)
  }

  _generateSummary(stable, stabilityScore, issueCount) {
    if (stable && stabilityScore >= 80) return 'stable';
    if (stable && stabilityScore >= 50) return 'mostly stable';
    if (!stable && stabilityScore >= 40) return 'fragile';
    if (!stable && stabilityScore >= 20) return 'needs repair';
    return 'critical';
  }

  _generateRepairHints(verdict) {
    const hints = [];

    for (const issue of verdict.issues) {
      if (issue.type === 'low_confidence') {
        hints.push('raise evidence density before acting');
      } else if (issue.type === 'high_noise') {
        hints.push('trim historical noise and reduce ambiguity');
      } else if (issue.type === 'low_actionability') {
        hints.push('compress insights into one concrete action');
      } else if (issue.type === 'oscillation') {
        hints.push('apply dampening: hold state for at least 3 evaluation cycles');
      } else if (issue.type === 'confidence_declining') {
        hints.push('re-check evidence sources and re-verify key facts');
      } else if (issue.type === 'noise_rising') {
        hints.push('reduce information entropy by filtering low-value inputs');
      } else if (issue.type === 'degradation') {
        hints.push('roll back to last known good state and re-evaluate');
      } else {
        hints.push('re-evaluate with a smaller snapshot');
      }
    }

    // De-duplicate
    return [...new Set(hints)].slice(0, 5);
  }

  summarizeAdvice(issues) {
    return issues.slice(0, 3).map((issue) => issue.message).join(' | ');
  }
}

module.exports = { StabilityGuard };
