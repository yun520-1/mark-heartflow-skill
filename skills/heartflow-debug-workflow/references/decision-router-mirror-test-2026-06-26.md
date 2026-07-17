# decision-router mirrorTest() — Meta-Audit Mirror Test

## Origin

Added v3.8.1 (HeartFlow v4.1.4) in response to luoxuejian000's meta-audit question on DeepSeek-V3 #1447:

> "If the unconscious layer itself begins to drift, who audits the auditor?"

## The Problem

Every self-audit system eventually bottoms out at an un-audited layer. The decision router evaluates engine state, but if the router itself drifts, there's no internal mechanism to detect it.

## The Solution: mirrorTest()

A fixed-stimulus, predictable-response test that detects drift in the decision router's own field tracking.

### Design

```javascript
mirrorTest(options = { threshold: 0.15 })
```

- **Baseline**: Known-healthy field values (U=0.65, D=0.55, A=0.20, H=0.365) derived from initial engine calibration
- **Current**: Gets field summary from `getFieldSummary()` or runs a bare `evaluate({})` if insufficient data
- **Comparison**: Computes absolute deviation per field, flags if H deviation > threshold
- **Logging**: Each test result is pushed to `_auditTrail`

### Return Value

```javascript
{
  passed: boolean,
  baseline: { U, D, A, H },    // fixed reference
  current: { U, D, A, H },     // current engine state
  deviation: { U, D, A, H },   // absolute deltas
  details: string               // human-readable pass/fail message
}
```

### Three-Layer Defense Against Meta-Audit Failure

1. **CORE layer** — Identity rules and decision patterns that require human approval to modify (already exists in MeaningfulMemory)
2. **mirrorTest()** — Scheduled periodic check using fixed baseline to detect drift
3. **Human-in-the-loop approval gate** — Auto-tuning changes require explicit approval before taking effect (already exists in decision-router's suppression mechanism)

### Integration Points

- Called from `heartflow.js` as part of periodic health checks
- Results logged to `_auditTrail` for later review
- Can be integrated into cron-based monitoring (check every N calls, alert on repeated failures)

### Usage Example

```javascript
const { DecisionRouter } = require('./src/core/decision-router.js');
const router = new DecisionRouter();

// Run some evaluations to get field data
router.evaluate({ quality: 0.8, stability: 0.7, coherence: 0.9 }, 'test');
// ...

// Test with default threshold (0.15)
const result = router.mirrorTest();
if (!result.passed) {
  console.warn(result.details);
  // Trigger human review
}
```

### Threshold Tuning

| Threshold | Behavior | Use Case |
|-----------|----------|----------|
| 0.15 | Default | General monitoring |
| 0.20 | Lenient | Early calibration period |
| 0.05 | Strict | Production drift detection |

### Limitations

- Baseline is static — assumes engine was "healthy" at initial calibration. If the engine's optimal operating point shifts over time, the baseline needs recalibration.
- Empty field data returns a bare `evaluate({})` result (H≈0.21), which will fail against the 0.365 baseline — this is intentional, it detects "engine not yet initialized" as a drift state.
- Single-metric (H) threshold may miss field-specific drift where H stays within bounds but U/D/A individually diverge (e.g. U drops 0.4 while D rises 0.4, H unchanged).
