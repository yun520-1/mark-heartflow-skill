/**
 * HeartFlow Syllogism Checker v11.19.4
 *
 * Based on: PureReason syllogism.py (sorunokoe/PureReason ⭐)
 * arXiv: LogicBench / HaluEval research
 *
 * Core: Formal syllogism validation using symbolic logic patterns
 * - Modus Ponens, Modus Tollens, Affirmative/Negative chains
 * - Fallacy detection (undistributed middle, illicit major/minor)
 * - Confidence scoring for reasoning chains
 *
 * Sources:
 * - PureReason/reasoning/syllogism.py (Z3-based syllogism validation)
 * - PureReason/reasoning/chain.py (ECS epistemic confidence)
 * - PureReason/reasoning/repair.py (arithmetic error detection)
 */

const SYLLOGISM_PATTERNS = {
  // Valid patterns
  MODUS_PONENS: {
    name: 'Modus Ponens',
    pattern: ['如果P那么Q', 'P', '因此Q'],
    valid: true,
  },
  MODUS_TOLLENS: {
    name: 'Modus Tollens',
    pattern: ['如果P那么Q', '非Q', '因此非P'],
    valid: true,
  },
  HYPOTHETICAL_SYLLOGISM: {
    name: 'Hypothetical Syllogism',
    pattern: ['如果P那么Q', '如果Q那么R', '因此如果P那么R'],
    valid: true,
  },
  DISJUNCTIVE_SYLLOGISM: {
    name: 'Disjunctive Syllogism',
    pattern: ['P或Q', '非P', '因此Q'],
    valid: true,
  },
  // Invalid patterns (fallacies)
  AFFIRMING_CONSEQUENT: {
    name: 'Affirming the Consequent',
    pattern: ['如果P那么Q', 'Q', '因此P'],
    valid: false,
    fallacy: '肯定后件',
  },
  DENYING_ANTECEDENT: {
    name: 'Denying the Antecedent',
    pattern: ['如果P那么Q', '非P', '因此非Q'],
    valid: false,
    fallacy: '否定前件',
  },
  UNDISTRIBUTED_MIDDLE: {
    name: 'Undistributed Middle',
    pattern: ['所有P是Q', '所有R是Q', '因此所有P是R'],
    valid: false,
    fallacy: '中项不周延',
  },
  ILLICIT_MAJOR: {
    name: 'Illicit Major',
    pattern: ['所有P是Q', '所有P是R', '因此所有R是Q'],
    valid: false,
    fallacy: '大项不当扩大',
  },
  ILLICIT_MINOR: {
    name: 'Illicit Minor',
    pattern: ['所有Q是P', '所有R是Q', '因此所有R是P'],
    valid: false,
    fallacy: '小项不当扩大',
  },
};

const FALLACY_KEYWORDS = {
  '肯定后件': ['所以P', '因此P', '得出P', '推得P'],
  '否定前件': ['所以非Q', '因此非Q', '得出非Q', '所以没有Q'],
  '中项不周延': ['所有P是Q', '所有R是Q', '所以P是R'],
  '大项不当扩大': ['所有P是Q', '所有P是R', '所以R是Q'],
  '小项不当扩大': ['所有Q是P', '所有R是Q', '所以R是P'],
};

// Quantifier patterns for syllogism detection
const QUANTIFIER_PATTERNS = [
  /所有[^\s,，]+是[^\s,，]+/g,
  /有些[^\s,，]+是[^\s,，]+/g,
  /没有[^\s,，]+是[^\s,，]+/g,
  /凡是[^\s,，]+都[^\s,，]+/g,
  /若[^\s,，]+则[^\s,，]+/g,
  /如果[^\s,，]+那么[^\s,，]+/g,
  /[^\s,，]+或[^\s,，]+/g,
];

class SyllogismChecker {
  constructor(options = {}) {
    this.minConfidence = options.minConfidence || 0.6;
    this.strictMode = options.strictMode || false;
  }

  /**
   * Check a reasoning chain for syllogistic validity
   * @param {Object} args
   * @param {string[]} args.statements - Array of statements (premises + conclusion)
   * @param {string} args.claim - The original claim/question
   * @returns {Object} Verification result
   */
  check({ statements = [], claim = '' } = {}) {
    // Accept either: statements = [premise1, premise2, ...] (claim in last slot)
    // Or: statements = [premise1, premise2, ...], claim = separate conclusion
    const allStatements = (claim && statements.length > 0)
      ? [...statements]
      : (statements.length > 1 ? statements.slice(0, -1) : statements);

    const conclusion = (claim) ? claim : (statements.length > 0 ? statements[statements.length - 1] : '');

    if (allStatements.length < 1) {
      return { valid: false, error: 'Need at least 1 premise' };
    }

    const steps = allStatements.map((s, i) => ({
      index: i,
      text: s,
      type: 'premise',
    }));

    const premiseList = allStatements;

    // Step 1: Check for known syllogism patterns
    const patternResult = this._matchPattern(premiseList, conclusion);
    if (patternResult.matched) {
      return {
        valid: patternResult.valid,
        pattern: patternResult.pattern,
        confidence: patternResult.valid ? 0.95 : 0.0,
        fallacy: patternResult.fallacy || null,
        explanation: patternResult.valid
          ? `Syllogism valid: ${patternResult.pattern}`
          : `Fallacy detected: ${patternResult.pattern} (${patternResult.fallacy})`,
        steps: [...steps, { index: steps.length, text: conclusion, type: 'conclusion' }],
      };
    }

    // Step 2: Generic quantifier analysis
    const quantResult = this._analyzeQuantifiers(premiseList, conclusion);
    if (!quantResult.valid) {
      return {
        valid: false,
        confidence: quantResult.confidence,
        fallacy: quantResult.fallacy,
        explanation: quantResult.explanation,
        steps: [...steps, { index: steps.length, text: conclusion, type: 'conclusion' }],
      };
    }

    // Step 3: Conditional chain analysis
    const condResult = this._analyzeConditionals(premiseList, conclusion);
    if (!condResult.valid) {
      return {
        valid: false,
        confidence: condResult.confidence,
        fallacy: condResult.fallacy,
        explanation: condResult.explanation,
        steps: [...steps, { index: steps.length, text: conclusion, type: 'conclusion' }],
      };
    }

    // Valid by default if no fallacies detected
    return {
      valid: true,
      confidence: quantResult.confidence * condResult.confidence,
      explanation: 'No syllogistic fallacies detected',
      steps: [...steps, { index: steps.length, text: conclusion, type: 'conclusion' }],
    };
  }

  /**
   * Match against known syllogism patterns
   * Targeted detection of specific fallacies
   */
  _matchPattern(premises, conclusion) {
    const allPremises = premises.join(' ');
    const allText = allPremises + ' ' + conclusion;

    // Extract conditionals from premises - find the FIRST conditional
    const condMatch = allPremises.match(/(?:如果|若|假如)(.+?)(?:那么|则)([^\s，,。\n]+)/);
    if (!condMatch) return { matched: false };

    const ant = condMatch[1].trim();
    const cons = condMatch[2].trim();

    // Split premises: [conditional_part, ...other_assertions]
    const [premiseWithCond, ...otherPremises] = premises;
    const assertionText = otherPremises.join(' ');

    // ant and cons must be different
    if (ant.toLowerCase() === cons.toLowerCase()) return { matched: false };
    // Need at least 2 premises for 2-premise fallacies
    if (otherPremises.length === 0) return { matched: false };

    const conc = conclusion.replace(/因此|所以|得出|因此说/g, '').replace(/\s+/g, ' ').trim();
    const hasNeg = (s) => s.includes('不') || s.includes('非') || s.includes('没有');

    // Modus Ponens: 如果A那么B, A(asserted) → 所以B
    // All three must hold: ant asserted, cons in conc, conc not negated
    if (!hasNeg(ant) && assertionText.toLowerCase().includes(ant.toLowerCase()) &&
        conc.toLowerCase().includes(cons.toLowerCase()) && !hasNeg(conc)) {
      return { matched: true, valid: true, pattern: 'Modus Ponens', fallacy: null };
    }

    // Modus Tollens: 如果A那么B, 不B(asserted) → 所以不A
    // 不B in assertion, 不A in conclusion
    if ((assertionText.includes('不' + cons) || assertionText.includes('非' + cons)) &&
        hasNeg(conc) && conc.toLowerCase().includes('不' + ant.toLowerCase())) {
      return { matched: true, valid: true, pattern: 'Modus Tollens', fallacy: null };
    }

    // First, check if conclusion itself is a valid conditional
    // This prevents AC from matching "P" in "如果P那么R" conclusion
    const conclusionCondMatch = conclusion.match(/^(?:因此|所以)?\s*(?:如果|若|假如)(.+?)(?:那么|则)(.+?)(?:[，。]|$)/);
    const hasConclusionConditional = !!conclusionCondMatch;

    // Affirming the Consequent: 如果A那么B, B(asserted) → 所以A
    // SKIP if conclusion is itself a conditional (might be valid hypothetical syllogism)
    if (!hasConclusionConditional &&
        assertionText.includes(cons) &&
        conc.toLowerCase().includes(ant.toLowerCase()) &&
        !hasNeg(conc) && ant.toLowerCase() !== cons.toLowerCase()) {
      return { matched: true, valid: false, pattern: 'Affirming the Consequent', fallacy: '肯定后件' };
    }

    // Denying the Antecedent: 如果A那么B, 不A(asserted) → 所以不B
    // SKIP if conclusion is itself a conditional
    if (!hasConclusionConditional &&
        (assertionText.includes('不' + ant) || assertionText.includes('非' + ant)) &&
        hasNeg(conc) && conc.toLowerCase().includes('不' + cons.toLowerCase())) {
      return { matched: true, valid: false, pattern: 'Denying the Antecedent', fallacy: '否定前件' };
    }

    // Hypothetical Syllogism: 如果A那么B, 如果B那么C → 所以A那么C
    // Key: first cons (B) must equal second antecedent (B) → chain connects
    const secondCond = otherPremises.find(p => /(?:如果|若|假如)(.+?)(?:那么|则)([^\s，,。\n]+)/.test(p));
    if (secondCond) {
      const m2 = secondCond.match(/(?:如果|若|假如)(.+?)(?:那么|则)([^\s，,。\n]+)/);
      if (m2) {
        const secondAnt = m2[1].trim();
        const secondCons = m2[2].trim();
        // Chain: first cons (cons) must equal second antecedent (secondAnt)
        if (secondAnt === cons && cons !== ant) {
          return { matched: true, valid: true, pattern: 'Hypothetical Syllogism', fallacy: null };
        }
      }
    }

    return { matched: false };
  }

  /**
   * Analyze quantifier-based syllogisms (All/Some/None)
   */
  _analyzeQuantifiers(premises, conclusion) {
    const allText = [...premises, conclusion].join(' ');

    // Extract quantified statements
    const quantStatements = [];
    for (const regex of QUANTIFIER_PATTERNS) {
      const matches = allText.match(regex);
      if (matches) {
        quantStatements.push(...matches);
      }
    }

    if (quantStatements.length < 2) {
      return { valid: true, confidence: 0.7 };
    }

    // Check for undistributed middle
    const subjects = new Set();
    const predicates = new Set();
    const middleTerms = new Set();

    for (const stmt of quantStatements) {
      const match = stmt.match(/([^\s,，]+)是/g);
      if (match) {
        match.forEach(m => {
          const term = m.replace('是', '');
          if (subjects.has(term)) {
            middleTerms.add(term);
          } else {
            subjects.add(term);
          }
        });
      }
    }

    // Check predicate distribution
    const predicateTerms = [];
    for (const stmt of quantStatements) {
      const parts = stmt.split(/是|不?是/);
      if (parts.length > 1) {
        predicateTerms.push(parts[1].trim());
      }
    }

    // If middle term never appears as predicate of a universal statement
    // it might be undistributed
    const hasAll = quantStatements.some(s => s.startsWith('所有') || s.startsWith('凡是'));
    const hasSome = quantStatements.some(s => s.startsWith('有些'));

    if (hasAll && hasSome && middleTerms.size > 0) {
      return {
        valid: false,
        confidence: 0.4,
        fallacy: '中项不周延',
        explanation: 'Some terms used as middle but not distributed across all cases',
      };
    }

    return { valid: true, confidence: 0.8 };
  }

  /**
   * Analyze conditional (if-then) chains
   */
  _analyzeConditionals(premises, conclusion) {
    const allText = [...premises, conclusion].join(' ');

    // Extract conditionals
    const conditionals = allText.match(/如果[^\s,，]+那么[^\s,，]+/g) || [];
    const negations = allText.match(/非[^\s,，]+|不[^\s,，]+|没有[^\s,，]+/g) || [];

    if (conditionals.length === 0) {
      return { valid: true, confidence: 0.75 };
    }

    // Check for affirming consequent / denying antecedent
    for (const cond of conditionals) {
      const ifMatch = cond.match(/如果(.+)那么(.+)/);
      if (!ifMatch) continue;

      const antecedent = ifMatch[1].trim();
      const consequent = ifMatch[2].trim();

      // Check if consequent is asserted to affirm antecedent
      for (const neg of negations) {
        if (consequent.includes(neg.replace('非', '').replace('不', ''))) {
          // Consequent negated - check if we're denying antecedent correctly
          if (allText.includes('不' + antecedent) || allText.includes('非' + antecedent)) {
            // Check if this is valid modus tollens
            const hasOriginalCond = allText.includes(cond);
            if (!hasOriginalCond) {
              return {
                valid: false,
                confidence: 0.3,
                fallacy: '否定前件',
                explanation: 'Conditional chain broken: negating antecedent does not lead to negated consequent',
              };
            }
          }
        }
      }

      // Check for affirming consequent
      for (const neg of negations) {
        if (antecedent.includes(neg.replace('非', '').replace('不', ''))) {
          if (allText.includes(consequent)) {
            return {
              valid: false,
              confidence: 0.2,
              fallacy: '肯定后件',
              explanation: 'Affirming consequent is logically invalid',
            };
          }
        }
      }
    }

    return { valid: true, confidence: 0.85 };
  }

  /**
   * Quick check: is this statement likely valid or invalid?
   */
  quickCheck(statement) {
    const text = statement.toLowerCase();

    // Check for common fallacy indicators
    for (const [fallacy, keywords] of Object.entries(FALLACY_KEYWORDS)) {
      for (const kw of keywords) {
        if (text.includes(kw.toLowerCase())) {
          return { likely_invalid: true, fallacy, confidence: 0.7 };
        }
      }
    }

    return { likely_invalid: false, confidence: 0.6 };
  }
}

// Standalone verification function
function verifyChain({ statements = [], claim = '' } = {}) {
  const checker = new SyllogismChecker();
  return checker.check({ statements, claim });
}

module.exports = { SyllogismChecker, verifyChain };
