// test/gdi-to-router.test.js — tests for src/integration/gdi-to-router.js
const { gdiToRouter, applyToField } = require('../src/integration/gdi-to-router.js');

let passed = 0, failed = 0;
function t(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

// 1. Logit-damping signature → HOLD
t('logit-damping → hold + A boost', () => {
  const r = gdiToRouter({
    gdi_trace: [
      { step: 1, gdi_total: 0.012, layer_breakdown: { l9: 0.004, l10: 0.004, l11: 0.004 }, early_alert: false },
      { step: 2, gdi_total: 0.385, layer_breakdown: { l9: 0.31, l10: 0.055, l11: 0.02 }, early_alert: true },
    ],
  });
  if (r.action !== 'hold') throw new Error(`expected hold, got ${r.action}`);
  if (r.adjustment.A <= 0) throw new Error('expected A boost');
});

// 2. Uniform spike no early alert → HEAL
t('uniform spike → heal', () => {
  const r = gdiToRouter({
    gdi_trace: [{ step: 1, gdi_total: 0.8, layer_breakdown: { l9: 0.3, l10: 0.3, l11: 0.3 }, early_alert: false }],
  });
  if (r.action !== 'heal') throw new Error(`expected heal, got ${r.action}`);
});

// 3. Early alert only → conservative HOLD
t('early_alert only → hold', () => {
  const r = gdiToRouter({
    gdi_trace: [{ step: 1, gdi_total: 0.1, layer_breakdown: {}, early_alert: true }],
  });
  if (r.action !== 'hold') throw new Error(`expected hold, got ${r.action}`);
});

// 4. Clean GDI → pass
t('clean GDI → pass', () => {
  const r = gdiToRouter({
    gdi_trace: [{ step: 1, gdi_total: 0.01, layer_breakdown: { l9: 0.001, l10: 0.001, l11: 0.001 }, early_alert: false }],
  });
  if (r.action !== 'pass') throw new Error(`expected pass, got ${r.action}`);
});

// 5. No trace → pass, confidence 0
t('no trace → pass conf 0', () => {
  const r = gdiToRouter({});
  if (r.action !== 'pass' || r.confidence !== 0) throw new Error('wrong empty handling');
});

// 6. applyToField recomputes H
t('applyToField recomputes H', () => {
  const field = { U: 0.8, D: 0.7, A: 0.2, H: 0.5 };
  const out = applyToField(field, { U: -0.1, D: -0.2, A: 0.25 });
  const expectedH = 0.4 * 0.7 + 0.3 * 0.5 - 0.3 * 0.45; // 0.28+0.15-0.135=0.295
  if (Math.abs(out.H - expectedH) > 0.001) throw new Error(`H=${out.H}, expected ${expectedH}`);
});

// 7. applyToField does not mutate input
t('applyToField non-mutating', () => {
  const field = { U: 0.8, D: 0.7, A: 0.2, H: 0.5 };
  const out = applyToField(field, { A: 0.25 });
  if (field.A !== 0.2) throw new Error('input mutated');
  if (out.A !== 0.45) throw new Error(`A=${out.A}, expected 0.45`);
});

// 8. Custom thresholds
t('custom thresholds respected', () => {
  const r = gdiToRouter({
    gdi_trace: [{ step: 1, gdi_total: 0.15, layer_breakdown: { l9: 0.05, l10: 0.05, l11: 0.05 }, early_alert: false }],
  }, { totalThreshold: 0.1 });
  if (r.action !== 'heal') throw new Error(`expected heal with low threshold, got ${r.action}`);
});

console.log(`\n📊 gdi-to-router: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
