/**
 * field-injector.js — 场域注入器 v1.0.0
 *
 * Wraps any module's return value and injects standardized field/confidence
 * data that decision-router can consume.
 *
 * Key consumers: decision-router.js looks for _fieldU, _fieldD, _fieldA,
 * _fieldH, _fieldQuality, _fieldReliable, confidence, and various signal
 * fields (dissonance, quality, stability, cognitiveLoad, etc.)
 *
 * Return patterns across 53 HeartFlow modules:
 *   - { result, ... }                — heart-logic.js, isLove, isRight
 *   - { success, data/result, ... }  — execution-verifier.js, action-tracker
 *   - { status, ... }                — various status reports
 *   - { level, message, ... }        — cognitive-appraisal.js, error-handler
 *   - { score, ... }                 — confidence-calibrator.js, flow-predictor
 *   - { ok, error, ... }             — assertions.js
 *   - { valid, message, ... }        — verification-engine.js
 *   - { severity, ... }              — error-handler.js
 *   - { stability, ... }             — stability-guard.js
 *   - { quality, confidence, ... }   — confidence-calibrator.js
 *   - { error, ... }                 — error-handler.js
 *   - { dissonance, ... }            — decision-router rules
 *   - { cognitiveLoad, ... }         — cognitive-appraisal.js
 */

'use strict';

// ─── Constants ────────────────────────────────────────────────────────────

const FIELD_DEFAULTS = {
  _fieldU: 0.5,         // Unity — identity/stability/ok based
  _fieldD: 0.5,         // Development — quality/success based
  _fieldA: 0.3,         // Adversity — dissonance/severity/error based
  _fieldQuality: 0.5,   // Overall quality (0-1)
  _fieldReliable: false, // Whether the result has enough signal
  confidence: 0.3,      // Auto-calculated from available fields
};

const CONFIDENCE_RULES = {
  // Base levels
  DEFAULT: 0.3,
  // Success indicators → boost to 0.7
  SUCCESS_HIGH: 0.7,
  // Failure indicators → drop to 0.2
  FAILURE_LOW: 0.2,
  // Strong signal → 0.85+
  STRONG_SIGNAL: 0.85,
  // Maximum possible
  MAX: 0.95,
  // Minimum possible
  MIN: 0.05,
  // Weights for field calculations
  U_WEIGHT: 0.4,
  D_WEIGHT: 0.3,
  A_WEIGHT: 0.3,
};

// ─── Signal field patterns ────────────────────────────────────────────────

const DISSONANCE_PATTERNS = [
  'dissonance', 'cognitiveDissonance', 'dissonanceLevel',
  'error', 'severity', 'conflict', 'contradiction',
  'inconsistency', 'tension', 'frustration',
];

const QUALITY_PATTERNS = [
  'quality', 'qualityScore', 'score', 'accuracy',
  'precision', 'relevance', 'coherence', 'completeness',
  'actionability', 'valueResonance',
];

const STABILITY_PATTERNS = [
  'stability', 'stabilityScore', 'confidence', 'consistency',
  'certainty', 'identityCoherence', 'awareness',
  'cognitiveLoad', 'load', 'reliability',
];

// ─── Field Injector class ─────────────────────────────────────────────────

class FieldInjector {
  /**
   * Construct a stateless field injector.
   */
  constructor() {
    // No state — purely utility methods
  }

  /**
   * Inject standardized field/confidence data into any module return value.
   *
   * @param {*} result - Any module return value
   * @param {string} [source='unknown'] - Module source identifier
   * @returns {object} Enhanced result with injected fields
   */
  inject(result, source = 'unknown') {
    // Safety: null/undefined/non-object returns get safe defaults
    if (result == null || typeof result !== 'object' || Array.isArray(result)) {
      return {
        _raw: result,
        source,
        ...FIELD_DEFAULTS,
        confidence: this.computeConfidence(result),
        _fieldReliable: false,
        _fieldQuality: 0.3,
        _fieldU: 0.3,
        _fieldD: 0.3,
        _fieldA: 0.5,
      };
    }

    // Extract all signals from the result
    const signals = this.extractSignals(result);
    const confidence = this.computeConfidence(result);

    // ── Calculate _fieldU (Unity / Identity / Stability) ──
    let _fieldU = FIELD_DEFAULTS._fieldU;
    const stabilitySignals = signals.stabilitySignals;
    if (stabilitySignals.length > 0) {
      // Average stability signals, then blend with default
      const avgStability = stabilitySignals.reduce((a, s) => a + s.value, 0) / stabilitySignals.length;
      _fieldU = clamp(avgStability, 0, 1);
    }

    // Override from explicit fields
    if (typeof result._fieldU === 'number') _fieldU = result._fieldU;
    else if (typeof result.stability === 'number') _fieldU = result.stability;
    else if (typeof result.identityCoherence === 'number') _fieldU = result.identityCoherence;
    else if (typeof result.confidence === 'number') _fieldU = (_fieldU + result.confidence) / 2;
    else if (result.ok === true) _fieldU = Math.max(_fieldU, 0.7);
    else if (result.ok === false) _fieldU = Math.min(_fieldU, 0.3);

    // ── Calculate _fieldD (Development / Quality / Success) ──
    let _fieldD = FIELD_DEFAULTS._fieldD;
    const qualitySignals = signals.qualitySignals;
    if (qualitySignals.length > 0) {
      const avgQuality = qualitySignals.reduce((a, s) => a + s.value, 0) / qualitySignals.length;
      _fieldD = clamp(avgQuality, 0, 1);
    }

    // Override from explicit fields
    if (typeof result._fieldD === 'number') _fieldD = result._fieldD;
    else if (typeof result.quality === 'number') _fieldD = result.quality;
    else if (typeof result.qualityScore === 'number') _fieldD = result.qualityScore;
    else if (typeof result.score === 'number') _fieldD = result.score;
    else if (typeof result.actionability === 'number') _fieldD = (_fieldD + result.actionability) / 2;
    else if (result.success === true) _fieldD = Math.max(_fieldD, 0.7);
    else if (result.success === false) _fieldD = Math.min(_fieldD, 0.3);

    // ── Calculate _fieldA (Adversity / Dissonance / Error) ──
    let _fieldA = FIELD_DEFAULTS._fieldA;
    const dissonanceSignals = signals.dissonanceSignals;
    if (dissonanceSignals.length > 0) {
      const avgDissonance = dissonanceSignals.reduce((a, s) => a + s.value, 0) / dissonanceSignals.length;
      // Dissonance/error signals are inverted — high error = high adversity
      _fieldA = clamp(avgDissonance, 0, 1);
    }

    // Override from explicit fields
    if (typeof result._fieldA === 'number') _fieldA = result._fieldA;
    else if (typeof result.severity === 'number') _fieldA = result.severity;
    else if (typeof result.dissonance === 'number') _fieldA = result.dissonance;
    else if (typeof result.cognitiveDissonance === 'number') _fieldA = result.cognitiveDissonance;
    else if (typeof result.severity === 'string') {
      const sev = result.severity.toLowerCase();
      if (sev === 'critical' || sev === 'fatal' || sev === 'high') _fieldA = Math.max(_fieldA, 0.8);
      else if (sev === 'medium' || sev === 'warning') _fieldA = Math.max(_fieldA, 0.5);
      else if (sev === 'low' || sev === 'transient') _fieldA = Math.min(_fieldA, 0.3);
    }
    else if (result.ok === false) _fieldA = Math.max(_fieldA, 0.7);
    else if (result.valid === false) _fieldA = Math.max(_fieldA, 0.6);
    else if (result.error != null) _fieldA = Math.max(_fieldA, 0.65);
    else if (result.level != null) {
      // level is used by many modules (e.g., cognitive-appraisal: 0-1 scale)
      const lvl = typeof result.level === 'number' ? result.level : 0.5;
      _fieldA = (_fieldA + clamp(lvl, 0, 1)) / 2;
    }

    // ── Calculate _fieldQuality (overall quality 0-1) ──
    // Quality is the positive complement of adversity, blended with development
    let _fieldQuality;
    if (typeof result._fieldQuality === 'number') {
      _fieldQuality = result._fieldQuality;
    } else if (typeof result.quality === 'number') {
      _fieldQuality = result.quality;
    } else if (typeof result.score === 'number') {
      _fieldQuality = result.score;
    } else {
      // Blend: high unity + high development - high adversity = quality
      _fieldQuality = clamp((_fieldU * 0.4 + _fieldD * 0.4 + (1 - _fieldA) * 0.2), 0, 1);
    }

    // ── Calculate _fieldReliable ──
    const _fieldReliable = (
      stabilitySignals.length > 0 ||
      qualitySignals.length > 0 ||
      dissonanceSignals.length > 0 ||
      result.confidence !== undefined ||
      result.score !== undefined ||
      result.severity !== undefined ||
      result.quality !== undefined ||
      result.success !== undefined ||
      result.status !== undefined ||
      result.ok !== undefined ||
      result.valid !== undefined ||
      result.level !== undefined
    );

    // ── Return enhanced result ──
    const enhanced = {
      ...result,
      _fieldU: clamp(_fieldU, 0, 1),
      _fieldD: clamp(_fieldD, 0, 1),
      _fieldA: clamp(_fieldA, 0, 1),
      _fieldQuality: clamp(_fieldQuality, 0, 1),
      _fieldReliable,
      confidence: clamp(confidence, 0, 1),
      _source: source,
    };

    return enhanced;
  }

  /**
   * Extract all available signal fields from any result shape.
   *
   * @param {*} result - Any value to extract signals from
   * @returns {{ dissonanceSignals: Array<{name:string, value:number}>, qualitySignals: Array<{name:string, value:number}>, stabilitySignals: Array<{name:string, value:number}> }}
   */
  extractSignals(result) {
    const dissonanceSignals = [];
    const qualitySignals = [];
    const stabilitySignals = [];

    // Safety: null/undefined/non-object
    if (result == null || typeof result !== 'object' || Array.isArray(result)) {
      return { dissonanceSignals, qualitySignals, stabilitySignals };
    }

    // Scan all keys for known signal patterns
    for (const key of Object.keys(result)) {
      const val = result[key];

      // Skip non-numeric and injected meta-fields
      if (typeof val !== 'number' || key.startsWith('_field') || key === '_source') {
        continue;
      }

      // Check dissonance patterns
      if (DISSONANCE_PATTERNS.some(p => key === p || key.toLowerCase().includes(p))) {
        dissonanceSignals.push({ name: key, value: clamp(val, 0, 1) });
        continue;
      }

      // Check quality patterns
      if (QUALITY_PATTERNS.some(p => key === p || key.toLowerCase().includes(p))) {
        qualitySignals.push({ name: key, value: clamp(val, 0, 1) });
        continue;
      }

      // Check stability patterns
      if (STABILITY_PATTERNS.some(p => key === p || key.toLowerCase().includes(p))) {
        stabilitySignals.push({ name: key, value: clamp(val, 0, 1) });
        continue;
      }
    }

    // Also check boolean fields that carry signal
    if (result.success === true) qualitySignals.push({ name: 'success', value: 0.8 });
    else if (result.success === false) dissonanceSignals.push({ name: 'success', value: 0.7 });

    if (result.ok === true) stabilitySignals.push({ name: 'ok', value: 0.8 });
    else if (result.ok === false) dissonanceSignals.push({ name: 'ok', value: 0.7 });

    if (result.valid === true) stabilitySignals.push({ name: 'valid', value: 0.8 });
    else if (result.valid === false) dissonanceSignals.push({ name: 'valid', value: 0.6 });

    if (result.status != null && typeof result.status === 'string') {
      const s = result.status.toLowerCase();
      if (s === 'success' || s === 'ok' || s === 'active' || s === 'ready') {
        qualitySignals.push({ name: 'status', value: 0.75 });
      } else if (s === 'error' || s === 'failed' || s === 'critical') {
        dissonanceSignals.push({ name: 'status', value: 0.75 });
      }
    }

    return { dissonanceSignals, qualitySignals, stabilitySignals };
  }

  /**
   * Standalone confidence calculator.
   * Examines result fields to produce a confidence score 0-1.
   *
   * @param {*} result - Any value to compute confidence for
   * @returns {number} Confidence score 0-1
   */
  computeConfidence(result) {
    // Safety: null/undefined
    if (result == null) return CONFIDENCE_RULES.DEFAULT;

    // Non-object results
    if (typeof result !== 'object' || Array.isArray(result)) {
      return CONFIDENCE_RULES.DEFAULT;
    }

    // If already has a confidence field, use it (capped)
    if (typeof result.confidence === 'number') {
      return clamp(result.confidence, CONFIDENCE_RULES.MIN, CONFIDENCE_RULES.MAX);
    }

    const signals = this.extractSignals(result);
    let confidence = CONFIDENCE_RULES.DEFAULT;

    // ── Success/ok/valid signals → high confidence ──
    if (result.success === true || result.ok === true || result.valid === true) {
      confidence = Math.max(confidence, CONFIDENCE_RULES.SUCCESS_HIGH);
    }

    // ── Failure/error signals → low confidence ──
    if (result.success === false || result.ok === false || result.valid === false) {
      confidence = Math.min(confidence, CONFIDENCE_RULES.FAILURE_LOW);
    }

    // ── Error presence → low confidence ──
    if (result.error != null) {
      confidence = Math.min(confidence, CONFIDENCE_RULES.FAILURE_LOW);
    }

    // ── Quality/score signals → boost ──
    if (typeof result.quality === 'number') {
      confidence = Math.max(confidence, clamp(result.quality * 0.8, 0, 1));
    }
    if (typeof result.score === 'number') {
      confidence = Math.max(confidence, clamp(result.score * 0.75, 0, 1));
    }
    if (typeof result.stability === 'number') {
      confidence = Math.max(confidence, clamp(result.stability * 0.7, 0, 1));
    }

    // ── Dissonance signals → reduce confidence ──
    if (signals.dissonanceSignals.length > 0) {
      const avgDissonance = signals.dissonanceSignals.reduce((a, s) => a + s.value, 0) / signals.dissonanceSignals.length;
      confidence = Math.min(confidence, clamp(1 - avgDissonance * 0.5, 0, 1));
    }

    // ── Strong signal density → boost ──
    const totalSignals = signals.dissonanceSignals.length + signals.qualitySignals.length + signals.stabilitySignals.length;
    if (totalSignals >= 3) {
      confidence = Math.max(confidence, CONFIDENCE_RULES.STRONG_SIGNAL * 0.8);
    } else if (totalSignals >= 2) {
      confidence = Math.max(confidence, CONFIDENCE_RULES.SUCCESS_HIGH);
    }

    // ── Level field (0-1) → moderate confidence ──
    if (typeof result.level === 'number') {
      // level often indicates severity — invert for confidence
      const levelConf = 1 - clamp(result.level, 0, 1);
      confidence = (confidence + levelConf) / 2;
    }

    // ── String status → adjust ──
    if (typeof result.status === 'string') {
      const s = result.status.toLowerCase();
      if (s === 'success' || s === 'ok' || s === 'ready') {
        confidence = Math.max(confidence, 0.6);
      } else if (s === 'error' || s === 'failed' || s === 'critical') {
        confidence = Math.min(confidence, 0.25);
      }
    }

    // ── Severity string → reduce confidence ──
    if (typeof result.severity === 'string') {
      const sev = result.severity.toLowerCase();
      if (sev === 'critical' || sev === 'fatal') {
        confidence = Math.min(confidence, 0.1);
      } else if (sev === 'high') {
        confidence = Math.min(confidence, 0.2);
      } else if (sev === 'medium' || sev === 'warning') {
        confidence = Math.min(confidence, 0.35);
      }
    }

    return clamp(confidence, CONFIDENCE_RULES.MIN, CONFIDENCE_RULES.MAX);
  }

  /**
   * Batch inject multiple results.
   *
   * @param {Array<{result: *, source?: string}>} results - Array of result objects
   * @returns {Array<object>} Array with all results injected
   */
  batchInject(results) {
    // Safety: null/undefined/non-array
    if (!Array.isArray(results)) {
      return [];
    }

    return results.map((item, index) => {
      if (item == null || typeof item !== 'object') {
        // Treat as direct result with index as fallback
        return this.inject(item, `batch-${index}`);
      }
      const result = item.result !== undefined ? item.result : item;
      const source = item.source || `batch-${index}`;
      return this.inject(result, source);
    });
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────

/**
 * Clamp a number between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  if (typeof val !== 'number' || isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

// ─── Exports ──────────────────────────────────────────────────────────────

module.exports = {
  FieldInjector,
  FIELD_DEFAULTS,
  CONFIDENCE_RULES,
};
