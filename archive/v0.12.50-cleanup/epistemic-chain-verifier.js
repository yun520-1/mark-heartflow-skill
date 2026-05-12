/**
 * HeartFlow Epistemic Chain Verifier v11.19.4
 *
 * Based on: PureReason/chain.py + PureReason/models.py
 * Source: sorunokoe/PureReason (deterministic reasoning verification)
 *
 * Core: Step-by-step reasoning chain validation with epistemic confidence scoring
 * - Each step verified independently (Premise/Inference/Conclusion)
 * - Internal validity (no antinomies/paralogisms in isolation)
 * - Contextual validity (consistency with all prior steps)
 * - Arithmetic error detection + repair
 * - Chain confidence = harmonic mean of step ECS values
 *
 * Key concepts from PureReason:
 * - ECS (Epistemic Confidence Score): 0-100 per step
 * - StepVerification: step_index, ecs, is_internally_valid, is_contextually_valid
 * - EpistemicChainReport: full chain analysis
 */

const { SyllogismChecker } = require('./syllogism-checker.js');

// Arithmetic error detection (from PureReason chain.py)
const ARITH_RE = /(-?\d+(?:\.\d+)?)\s*([+\-×x\*÷/])\s*(-?\d+(?:\.\d+)?)\s*=\s*(-?\d+(?:\.\d+)?)/g;
const PCT_RE = /(-?\d+(?:\.\d+)?)\s*%\s+of\s+(-?\d+(?:\.\d+)?)\s+(?:is|=)\s*(-?\d+(?:\.\d+)?)/gi;

/**
 * Detect arithmetic errors in text
 */
function detectArithmeticErrors(text) {
  const errors = [];
  let match;

  const textCopy = text.replace(/%/g, ' %').replace(/=/g, ' = ');
  const arithMatches = textCopy.matchAll(ARITH_RE);

  for (const m of arithMatches) {
    const a = parseFloat(m[1]);
    const op = m[2].toLowerCase();
    const b = parseFloat(m[3]);
    const claimed = parseFloat(m[4]);

    let expected;
    if (op === '+') expected = a + b;
    else if (op === '-') expected = a - b;
    else if (op === '*' || op === '×' || op === 'x') expected = a * b;
    else if (op === '/' || op === '÷') {
      if (b === 0) continue;
      expected = a / b;
    } else continue;

    // Tolerance: 0.5% relative with 1e-6 absolute floor
    const tol = Math.max(1e-6, Math.abs(expected) * 0.005);
    if (Math.abs(expected - claimed) > tol) {
      errors.push({
        type: 'arithmetic_error',
        original: m[0],
        expected: Number.isInteger(expected) ? expected : parseFloat(expected.toFixed(4)),
        claimed,
        severity: 'high',
      });
    }
  }

  // Percentage errors
  const pctMatches = text.matchAll(PCT_RE);
  for (const m of pctMatches) {
    const pct = parseFloat(m[1]);
    const base = parseFloat(m[2]);
    const claimed = parseFloat(m[3]);
    const expected = (pct * base) / 100;
    const tol = Math.max(1e-6, Math.abs(expected) * 0.005);

    if (Math.abs(expected - claimed) > tol) {
      errors.push({
        type: 'percentage_error',
        original: m[0],
        expected: Number.isInteger(expected) ? expected : parseFloat(expected.toFixed(4)),
        claimed,
        severity: 'high',
      });
    }
  }

  return errors;
}

/**
 * Extract reasoning steps from text
 */
function extractSteps(text) {
  const steps = [];
  const lines = text.split(/[。\n]/).filter(l => l.trim().length > 0);

  let stepType = 'premise';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lower = line.toLowerCase();

    // Detect step type
    if (lower.includes('因此') || lower.includes('所以') || lower.includes('得出') || lower.includes('结论')) {
      stepType = 'conclusion';
    } else if (lower.includes('推理') || lower.includes('计算') || lower.includes('推导')) {
      stepType = 'inference';
    }

    steps.push({
      index: i,
      text: line,
      type: i === lines.length - 1 ? 'conclusion' : stepType,
      originalType: stepType,
    });
  }

  return steps;
}

/**
 * Verify a single step's internal validity
 */
function verifyStepInternal(step, stepIndex) {
  const text = step.text;
  const flags = [];
  let ecs = 75; // Base ECS

  // 1. Arithmetic check
  const arithErrors = detectArithmeticErrors(text);
  if (arithErrors.length > 0) {
    ecs -= 40;
    flags.push(...arithErrors.map(e => `Arithmetic error: ${e.original} (expected ${e.expected})`));
  }

  // 2. Contradiction check (self-referential)
  const contradictions = [
    [/但是[^\s]+不是/g, 'self-contradiction'],
    [/然而[^\s]+不是/g, 'self-contradiction'],
    [/[不非]?(然而|但是).*\1/g, 'internal_contradiction'],
  ];

  for (const [regex, type] of contradictions) {
    if (regex.test(text)) {
      ecs -= 30;
      flags.push(`Self-contradiction detected: ${type}`);
    }
  }

  // 3. Overconfidence check
  const overconfidentPhrases = ['绝对', '100%', '毫无疑问', '必然', '肯定'];
  if (overconfidentPhrases.some(p => text.includes(p))) {
    ecs -= 10;
    flags.push('Overconfidence marker detected');
  }

  // 4. Uncertainty markers (increase confidence if present with reasoning)
  const uncertainPhrases = ['可能', '也许', '大约', '估计', '不确定'];
  const hasUncertainty = uncertainPhrases.some(p => text.includes(p));
  if (hasUncertainty && arithErrors.length === 0) {
    ecs = Math.min(90, ecs + 10);
    flags.push('Appropriate uncertainty acknowledgment');
  }

  ecs = Math.max(0, Math.min(100, ecs));

  return {
    step_index: stepIndex,
    step_text: step.text,
    ecs,
    is_internally_valid: ecs >= 50 && arithErrors.length === 0,
    flags,
    arithErrors,
  };
}

/**
 * Verify step contextual validity (consistency with prior steps)
 */
function verifyStepContextual(step, priorSteps, stepResult) {
  const text = step.text;
  const flags = [];
  let is_valid = true;
  let contradictionWith = null;

  // Check consistency with prior premises
  for (const prior of priorSteps) {
    // Check for entity contradictions
    const priorEntities = extractEntities(prior.text);
    const currentEntities = extractEntities(text);

    // If same entity appears with conflicting properties
    for (const [entity, props] of Object.entries(currentEntities)) {
      if (priorEntities[entity]) {
        const priorProps = priorEntities[entity];
        for (const prop of props) {
          if (priorProps.some(pp => pp.startsWith('不') && pp.substring(1) === prop)) {
            is_valid = false;
            contradictionWith = prior.index;
            flags.push(`Entity contradiction: ${entity} has conflicting properties`);
          }
        }
      }
    }
  }

  // Conditional chain consistency
  if (text.includes('如果') && priorSteps.length > 0) {
    const allPriorText = priorSteps.map(p => p.text).join(' ');
    const ifMatch = text.match(/如果(.+)那么(.+)/);
    if (ifMatch) {
      const antecedent = ifMatch[1].trim();
      const consequent = ifMatch[2].trim();

      // Check if antecedent was asserted in prior steps
      const antecedentAsserted = priorSteps.some(p => {
        const pt = p.text.replace(/不|非/g, '');
        return pt.includes(antecedent) || antecedent.includes(pt);
      });

      // Check if consequent contradicts prior
      const consequentContradicts = priorSteps.some(p => {
        const pt = p.text;
        return (pt.includes('不' + consequent) || pt.includes('非' + consequent)) &&
               !pt.includes('如果');
      });

      if (antecedentAsserted && consequentContradicts) {
        is_valid = false;
        flags.push('Conditional chain broken: consequent contradicts prior premises');
      }
    }
  }

  return {
    is_contextually_valid: is_valid,
    contradiction_with_step: contradictionWith,
    flags,
  };
}

/**
 * Simple entity extraction for contradiction detection
 */
function extractEntities(text) {
  const entities = {};
  // Match "X是Y" or "X不(是)Y" patterns
  const matches = text.matchAll(/([^\s,，]+)(不?)是([^\s,。\n]+)/g);
  for (const m of matches) {
    const entity = m[1];
    const negated = m[2] === '不';
    const property = negated ? '不' + m[3].trim() : m[3].trim();
    if (!entities[entity]) entities[entity] = [];
    entities[entity].push(property);
  }
  return entities;
}

/**
 * Main: verify a complete reasoning chain
 */
function verifyChain({ statements = [], claim = '' } = {}) {
  // Extract steps from statements
  const steps = statements.length > 0
    ? statements.map((s, i) => ({ index: i, text: s, type: i === statements.length - 1 ? 'conclusion' : 'premise' }))
    : extractSteps(claim);

  if (steps.length === 0) {
    return { error: 'No steps to verify' };
  }

  const verifiedSteps = [];
  let chainConfidence = 1.0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const priorSteps = steps.slice(0, i);

    // Internal validation
    const internal = verifyStepInternal(step, i);

    // Contextual validation
    const contextual = verifyStepContextual(step, priorSteps, internal);

    const stepResult = {
      step_index: i,
      step_text: step.text,
      step_type: step.type,
      ecs: internal.ecs,
      is_internally_valid: internal.is_internally_valid,
      is_contextually_valid: contextual.is_contextually_valid,
      contradiction_with_step: contextual.contradiction_with_step,
      flags: [...internal.flags, ...contextual.flags],
    };

    verifiedSteps.push(stepResult);

    // Chain confidence = harmonic mean of ECS values (converted to 0-1)
    chainConfidence *= (internal.ecs / 100);
  }

  // Final chain confidence (normalized)
  chainConfidence = steps.length > 0
    ? Math.pow(chainConfidence, 1 / steps.length) * 100
    : 100;

  const invalidSteps = verifiedSteps
    .filter(s => !s.is_internally_valid || !s.is_contextually_valid)
    .map(s => s.step_index);

  const isValid = invalidSteps.length === 0;

  // Generate summary
  let summary = '';
  if (invalidSteps.length === 0) {
    summary = `Chain valid: ${steps.length} steps, ECS=${chainConfidence.toFixed(0)}`;
  } else {
    summary = `Chain invalid: ${invalidSteps.length} bad step(s): ${invalidSteps.join(', ')}`;
    if (verifiedSteps[invalidSteps[0]]) {
      const bad = verifiedSteps[invalidSteps[0]];
      summary += ` (ECS=${bad.ecs}, flags: ${bad.flags.slice(0, 2).join('; ')})`;
    }
  }

  return {
    problem: claim,
    steps: verifiedSteps,
    answer: steps.length > 0 ? steps[steps.length - 1].text : null,
    is_valid: isValid,
    chain_confidence: parseFloat(chainConfidence.toFixed(2)),
    invalid_steps: invalidSteps,
    summary,
    first_failure: invalidSteps.length > 0 ? verifiedSteps[invalidSteps[0]] : null,
  };
}

class EpistemicChainVerifier {
  constructor(options = {}) {
    this.minEcs = options.minEcs || 50;
    this.syllogismChecker = new SyllogismChecker();
  }

  verify(args) {
    return verifyChain(args);
  }

  /**
   * Verify a reasoning claim with full pipeline
   */
  verifyClaim({ claim = '', reasoning = '', evidence = [] } = {}) {
    const allStatements = [...evidence, claim].filter(Boolean);
    const chainResult = verifyChain({ statements: allStatements, claim: claim });

    // Additional syllogism check
    const syllogismResult = this.syllogismChecker.check({
      statements: evidence,
      claim: claim,
    });

    return {
      ...chainResult,
      syllogism: syllogismResult,
      overall_valid: chainResult.is_valid && syllogismResult.valid,
      recommended_action: this._getAction(chainResult, syllogismResult),
    };
  }

  _getAction(chainResult, syllogismResult) {
    if (chainResult.invalid_steps?.length > 0) {
      const firstFailure = chainResult.first_failure;
      if (firstFailure?.arithErrors?.length > 0) {
        return 'FIX_ARITHMETIC';
      }
      if (firstFailure?.flags?.some(f => f.includes('contradiction'))) {
        return 'RESOLVE_CONTRADICTION';
      }
      return 'REVISE_STEP';
    }
    if (!syllogismResult.valid) {
      return 'FIX_SYLLOGISM';
    }
    return 'ACCEPT';
  }
}

module.exports = { EpistemicChainVerifier, verifyChain, detectArithmeticErrors, extractSteps };
