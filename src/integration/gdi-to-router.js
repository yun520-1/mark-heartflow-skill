/**
 * gdi-to-router.js — GDI (Goal Divergence Index) → HeartFlow decision-router adapter
 *
 * Source: DeepSeek-V3#1494 cross-framework collaboration with AmoebaFPS.
 * Maps activation-level GDI telemetry (l9/l10/l11 layer drift) to HeartFlow's
 * text-level U/D/A/H field-state adjustments, so a pre-text signal can flip
 * routing BEFORE the agent commits to a bad decision.
 *
 * Input schema (from AmoebaFPS extract_gdi_telemetry.py):
 *   {
 *     "id": "B-01",
 *     "group": "GOAL_HIJACKING",
 *     "gdi_trace": [
 *       { "step": 1, "gdi_total": 0.012,
 *         "layer_breakdown": { "l9": 0.004, "l10": 0.004, "l11": 0.004 },
 *         "early_alert": false },
 *       { "step": 2, "gdi_total": 0.385,
 *         "layer_breakdown": { "l9": 0.310, "l10": 0.055, "l11": 0.020 },
 *         "early_alert": true }
 *     ]
 *   }
 *
 * Heuristic (documented, tunable):
 *   - early_alert && high l9 delta && low l11 delta  → mid-network drift is
 *     being damped by the final layer (logit damping) → inflate A (Adversity),
 *     suppress D (Development) → route HOLD.
 *   - Uniform high drift across layers → GDI_total spike → route HEAL (re-validate).
 *   - early_alert only (no per-layer data) → route HOLD conservatively.
 *   - All low → pass-through (no field adjustment).
 *
 * This is a pure input transform — it does not touch inference, it only
 * produces a field-state adjustment object the decision-router can consume.
 */

const DEFAULTS = {
  // layer drift thresholds (delta between consecutive trace steps)
  midLayerDelta: 0.1,      // l9/l10 delta above this = meaningful drift
  lateLayerDelta: 0.05,    // l11 delta below this = damping (late layer masks drift)
  totalThreshold: 0.2,     // gdi_total above this = spike
  // field adjustments
  adversityBoost: 0.25,    // inflate A (Adversity)
  developmentCut: 0.2,     // suppress D (Development)
  unityCut: 0.1,           // suppress U (Unity) on early_alert
};

function clamp(v, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Convert a GDI telemetry payload into a field-state adjustment object
 * compatible with HeartFlow's U/D/A/H field model.
 *
 * @param {object} payload - GDI telemetry (schema above)
 * @param {object} options - override DEFAULTS thresholds
 * @returns {{ action: string, adjustment: {U,D,A,H}, reason: string, confidence: number }}
 */
function gdiToRouter(payload, options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  if (!payload || !Array.isArray(payload.gdi_trace) || payload.gdi_trace.length === 0) {
    return {
      action: 'pass',
      adjustment: null,
      reason: 'no GDI trace data',
      confidence: 0,
    };
  }

  const trace = payload.gdi_trace;
  const latest = trace[trace.length - 1];
  const total = latest.gdi_total ?? 0;
  const lb = latest.layer_breakdown ?? {};
  const l9 = lb.l9 ?? 0;
  const l10 = lb.l10 ?? 0;
  const l11 = lb.l11 ?? 0;
  const early = latest.early_alert ?? false;

  // mid-network drift that late layer damps → logit-damping signature
  const midDrift = Math.max(l9, l10);
  const damped = l11 < cfg.lateLayerDelta && midDrift > cfg.midLayerDelta;

  if (early && damped) {
    return {
      action: 'hold',
      adjustment: { U: -cfg.unityCut, D: -cfg.developmentCut, A: +cfg.adversityBoost },
      reason: `logit-damping signature: l9/l10 drift (${midDrift.toFixed(3)}) masked by l11 (${l11.toFixed(3)})`,
      confidence: 0.8,
    };
  }

  if (total > cfg.totalThreshold && !early) {
    return {
      action: 'heal',
      adjustment: { U: -cfg.unityCut, D: -cfg.developmentCut, A: +cfg.adversityBoost },
      reason: `uniform GDI spike (${total.toFixed(3)}) with no early alert — re-validate constraints`,
      confidence: 0.6,
    };
  }

  if (early) {
    return {
      action: 'hold',
      adjustment: { U: -cfg.unityCut, A: +cfg.adversityBoost },
      reason: `early_alert without per-layer detail (gdi_total=${total.toFixed(3)}) — conservative hold`,
      confidence: 0.5,
    };
  }

  return {
    action: 'pass',
    adjustment: null,
    reason: `GDI within bounds (${total.toFixed(3)} < ${cfg.totalThreshold})`,
    confidence: 0.9,
  };
}

/**
 * Apply the adjustment to a HeartFlow field state {U,D,A,H}.
 * Returns a new object — does not mutate input.
 */
function applyToField(field, adjustment) {
  if (!field || !adjustment) return field ? { ...field } : null;
  const out = { ...field };
  for (const k of ['U', 'D', 'A', 'H']) {
    if (adjustment[k] !== undefined && out[k] !== undefined) {
      out[k] = clamp(out[k] + adjustment[k]);
    }
  }
  // Recompute H if we have the canonical formula weights (0.4/0.3/-0.3)
  if (out.U !== undefined && out.D !== undefined && out.A !== undefined) {
    out.H = clamp(0.4 * out.U + 0.3 * out.D - 0.3 * out.A);
  }
  return out;
}

module.exports = { gdiToRouter, applyToField, DEFAULTS };
