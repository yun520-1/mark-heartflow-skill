/**
 * SustainedDriftDetector — F3 sustained drift detection module
 *
 * Integrates drift signals from three upstream modules:
 *   - src/identity/self-model.js  (detectDrift, driftScore, conflicts)
 *   - src/core/decision-router.js (identity-drift rule → identityCoherence)
 *   - src/core/cognition-ground.js (drift, dissonance, decay dimensions)
 *
 * v5.7.7: Added persistence support (save/load to data/drift-history.json)
 */

const fs = require('fs');
const path = require('path');

class SustainedDriftDetector {
  /**
   * @param {object} [options={}]
   * @param {number} [options.driftThreshold=0.3]  — raw drift score above which a window entry counts as "drifting"
   * @param {number} [options.windowSize=10]         — number of smoothed scores to examine for sustained drift
   * @param {number} [options.smoothingFactor=0.1]  — EMA alpha (lower = slower response, more history-weighted)
   */
  constructor(options = {}) {
    this.driftThreshold = options.driftThreshold ?? 0.3;
    this.windowSize = options.windowSize ?? 10;
    this.smoothingFactor = options.smoothingFactor ?? 0.1;

    // Persistence
    this._persistPath = options.persistPath || path.join(process.env.HOME || '.', '.hermes', 'heartflow', 'data', 'drift-history.json');

    // Internal state
    this._history = [];
    this._currentEma = null;
    this._driftEvents = 0;
    this._totalRecorded = 0;

    this._load();
  }

  // ─── Persistence ──────────────────────────────────────────────────────

  _load() {
    try {
      if (fs.existsSync(this._persistPath)) {
        const data = JSON.parse(fs.readFileSync(this._persistPath, 'utf8'));
        if (data.history) {
          this._history = data.history;
          this._currentEma = data.currentEma ?? null;
          this._driftEvents = data.driftEvents ?? 0;
          this._totalRecorded = data.totalRecorded ?? 0;
        }
      }
    } catch (e) { /* non-fatal */ }
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this._persistPath), { recursive: true });
      fs.writeFileSync(this._persistPath, JSON.stringify({
        history: this._history,
        currentEma: this._currentEma,
        driftEvents: this._driftEvents,
        totalRecorded: this._totalRecorded,
        savedAt: new Date().toISOString(),
      }, null, 2));
      return true;
    } catch (e) { return false; }
  }

  load() {
    this._history = [];
    this._currentEma = null;
    this._driftEvents = 0;
    this._totalRecorded = 0;
    this._load();
  }

  // ─── Normalization ────────────────────────────────────────────────────────

  /**
   * Normalize an identity-state object into per-dimension drift scores [0, 1].
   *
   * Accepted input fields (any may be missing):
   *   driftScore             — 0-1, higher = more drift (self-model)
   *   identityCoherence      — 0-1, higher = more coherent (decision-router identity-drift rule)
   *   dissonance / cognitiveDissonance — 0-1
   *   decay / decisionDecay  — 0-1
   *   quality                — 0-1, inverted to decay
   *
   * @param {object} state
   * @returns {{ identityDrift: number, dissonance: number, decay: number, rawScore: number }}
   */
  _normalize(state = {}) {
    // Identity drift: prefer explicit driftScore, fall back to inverse of coherence
    const identityDrift = state.driftScore
      ?? (1 - (state.identityCoherence ?? 0.5));

    // Cognitive dissonance
    const dissonance = state.dissonance
      ?? state.cognitiveDissonance
      ?? 0;

    // Decision quality decay: prefer explicit decay, fall back to (1 - quality)
    const decay = state.decay
      ?? state.decisionDecay
      ?? (1 - (state.quality ?? 0.5));

    // Composite: max is conservative — sustained drift flagged if *any* dimension drifts
    const rawScore = Math.max(identityDrift, dissonance, decay);

    return { identityDrift, dissonance, decay, rawScore };
  }

  // ─── EMA ──────────────────────────────────────────────────────────────────

  /**
   * Exponential moving average:  ema = α * x + (1-α) * prev
   * Cold-start: first value seeds the EMA directly.
   *
   * @param {number} value
   * @returns {number}
   */
  _ema(value) {
    if (this._currentEma === null) {
      this._currentEma = value;
    } else {
      const α = this.smoothingFactor;
      this._currentEma = α * value + (1 - α) * this._currentEma;
    }
    return this._currentEma;
  }

  // ─── Core API ─────────────────────────────────────────────────────────────

  /**
   * Record a new identity-state observation for drift tracking.
   * Each call advances the EMA and appends to the rolling window.
   *
   * @param {object} state — identity-state object (see _normalize)
   * @returns {{ rawScore: number, emaScore: number }}
   */
  recordState(state) {
    const dims = this._normalize(state);
    const emaScore = this._ema(dims.rawScore);

    this._history.push({
      ...dims,
      emaScore,
      timestamp: Date.now(),
    });

    // Keep history bounded to 3× windowSize (allows re-detection without data loss)
    const cap = this.windowSize * 3;
    if (this._history.length > cap) {
      this._history.splice(0, this._history.length - cap);
    }

    this._totalRecorded++;
    return { rawScore: dims.rawScore, emaScore };
  }

  /**
   * Detect sustained drift over the recorded window.
   *
   * Sustained drift = a sufficient fraction (≥ 50 %) of EMA-smoothed scores
   * within the last `windowSize` entries exceed `driftThreshold`.
   *
   * @param {object} [identityState] — optional single state to fold in before detection
   * @param {Array<object>} [history] — optional external history (appended to internal)
   * @returns {{ hasSustainedDrift: boolean, driftScore: number, dimensions: object, window: Array }}
   */
  detectDrift(identityState, history) {
    // Fold in optional single state
    if (identityState) {
      this.recordState(identityState);
    }

    // Fold in optional external history
    if (Array.isArray(history)) {
      for (const s of history) {
        this.recordState(s);
      }
    }

    const window = this._history.slice(-this.windowSize);
    if (window.length < this.windowSize) {
      return {
        hasSustainedDrift: false,
        driftScore: this._currentEma ?? 0,
        dimensions: this._latestDimensions(),
        window,
      };
    }

    const driftingCount = window.filter(e => e.emaScore > this.driftThreshold).length;
    const ratio = driftingCount / window.length;
    const hasSustained = ratio >= 0.5;

    if (hasSustained) {
      this._driftEvents++;
    }

    return {
      hasSustainedDrift: hasSustained,
      driftScore: this._currentEma ?? 0,
      driftRatio: ratio,
      dimensions: this._latestDimensions(),
      window,
    };
  }

  /**
   * Return recent EMA-smoothed drift scores.
   * @param {number} [limit] — max entries (defaults to windowSize)
   * @returns {Array<{emaScore, rawScore, timestamp, identityDrift, dissonance, decay}>}
   */
  getDriftHistory(limit) {
    const n = limit ?? this.windowSize;
    return this._history.slice(-n);
  }

  /**
   * Return detection statistics.
   * @returns {object}
   */
  getStats() {
    return {
      totalStates: this._totalRecorded,
      currentDriftScore: this._currentEma ?? 0,
      sustainedDriftEvents: this._driftEvents,
      driftDetected: (this._currentEma ?? 0) > this.driftThreshold,
      dimensions: this._latestDimensions(),
      windowSize: this.windowSize,
      smoothingFactor: this.smoothingFactor,
      driftThreshold: this.driftThreshold,
    };
  }

  /**
   * Reset internal state (useful for testing or session boundaries).
   */
  reset() {
    this._history = [];
    this._currentEma = null;
    this._driftEvents = 0;
    this._totalRecorded = 0;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _latestDimensions() {
    if (this._history.length === 0) {
      return { identityDrift: 0, dissonance: 0, decay: 0 };
    }
    const latest = this._history[this._history.length - 1];
    return {
      identityDrift: latest.identityDrift,
      dissonance: latest.dissonance,
      decay: latest.decay,
    };
  }
}

module.exports = { SustainedDriftDetector };
