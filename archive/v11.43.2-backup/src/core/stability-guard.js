/**
 * HeartFlow Stability Guard
 *
 * Verifies the runtime stays within a safe execution envelope.
 * It acts as a lightweight gate before and after upgrades.
 */

class StabilityGuard {
  constructor(options = {}) {
    this.thresholds = {
      minConfidence: options.minConfidence ?? 0.6,
      maxNoiseRatio: options.maxNoiseRatio ?? 0.45,
      minActionability: options.minActionability ?? 0.5,
    };
    this.phrases = {
      safe: 'safe to continue',
      repair: 'pause, simplify, and repair',
    };
  }

  evaluate(snapshot = {}) {
    const confidence = Number(snapshot.confidence ?? 0);
    const noiseRatio = Number(snapshot.noiseRatio ?? 0);
    const actionability = Number(snapshot.actionability ?? 0);
    const issues = [];

    if (confidence < this.thresholds.minConfidence) {
      issues.push({ type: 'low_confidence', message: 'confidence below threshold' });
    }
    if (noiseRatio > this.thresholds.maxNoiseRatio) {
      issues.push({ type: 'high_noise', message: 'noise ratio above threshold' });
    }
    if (actionability < this.thresholds.minActionability) {
      issues.push({ type: 'low_actionability', message: 'actionability below threshold' });
    }

    return {
      stable: issues.length === 0,
      issues,
      thresholds: this.thresholds,
      summary: issues.length === 0 ? 'stable' : 'needs repair',
      advice: this.summarizeAdvice(issues),
    };
  }

  gate(result = {}) {
    const verdict = this.evaluate(result);
    return {
      ...verdict,
      allow: verdict.stable,
      hint: verdict.stable ? this.phrases.safe : this.phrases.repair,
      next_step: verdict.stable ? 'continue' : 'repair',
      repairHints: verdict.stable
        ? []
        : verdict.issues.map((issue) => {
            if (issue.type === 'low_confidence') return 'raise evidence density before acting';
            if (issue.type === 'high_noise') return 'trim historical noise and reduce ambiguity';
            if (issue.type === 'low_actionability') return 'compress insights into one concrete action';
            return 're-evaluate with a smaller snapshot';
          }),
    };
  }

  summarizeAdvice(issues) {
    return issues.slice(0, 3).map((issue) => issue.message).join(' | ');
  }
}


module.exports = { StabilityGuard };
