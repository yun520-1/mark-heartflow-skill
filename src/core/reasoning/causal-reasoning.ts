/**
 * HeartFlow Causal Reasoning Engine — Level-1/Level-2 Framework
 * Based on: "Unveiling Causal Reasoning in LLMs: Reality or Mirage?"
 * (Chi et al., arXiv:2506.21215, NeurIPS 2024)
 *
 * Key insights:
 * - Level-1 causal reasoning: shallow, based on memorized causal patterns in training data
 * - Level-2 causal reasoning: deep, genuine counterfactual + intervention understanding
 * - Autoregression ≠ causality: sequential ≠ logical
 * - G2-Reasoner: RAG (general knowledge) + goal-oriented prompts for Level-2
 */

import type { MemoryEntry } from '../memory/memory.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CausalLevel = 1 | 2;

export interface CausalProbe {
  context: string;
  question: string;
  choices: string[];
  answer: number;  // index of correct choice
  level: CausalLevel;
  requiresCounterfactual: boolean;
}

export interface CausalReasoningResult {
  level: CausalLevel;
  confidence: number;          // 0-1, confidence in level assessment
  reasoningType: 'pattern_matching' | 'counterfactual' | 'intervention';
  trace: string[];           // reasoning steps
  detectedCausalKnowledge: string[];  // detected causal patterns from training
  counterfactualAbility: number;     // 0-1, ability to reason "what if not X"
  interventionUnderstanding: number;  // 0-1, ability to understand P(Y|do(X))
  recommendation: string;
}

export interface CausalKnowledge {
  cause: string;
  effect: string;
  mechanism: string;
  strength: number;        // 0-1, causal strength
  counterfactuals: string[];
  level: CausalLevel;
  sourceType: 'learned' | 'retrieved' | 'synthetic';
}

export interface CausalGraph {
  nodes: Map<string, CausalNode>;
  edges: CausalEdge[];
}

export interface CausalNode {
  id: string;
  label: string;
  type: 'cause' | 'effect' | 'mediator' | 'confound';
  children: string[];
  parents: string[];
}

export interface CausalEdge {
  from: string;
  to: string;
  type: 'causes' | 'enables' | 'inhibits' | 'correlated';
  strength: number;
}

// ── Level Detection Constants ──────────────────────────────────────────────────

const CAUSAL_INDICATORS = {
  LEVEL1: [
    'because', 'therefore', 'as a result', 'leads to', 'causes',
    'increases', 'decreases', 'results in', 'due to', 'since'
  ],
  LEVEL2: [
    'what if', 'counterfactual', 'intervene', 'manipulate',
    'do(X)', 'would have', 'if not for', 'despite', 'although'
  ],
  COUNTERFACTUAL_MARKERS: [
    'if X had not happened', 'suppose', 'imagine if',
    'what would happen if', 'had X instead'
  ],
  INTERVENTION_MARKERS: [
    'if we force', 'when we make', 'do(X)', 'intervene',
    'manipulate', 'control for'
  ]
};

// ── Level-1 vs Level-2 Detection ────────────────────────────────────────────────

/**
 * Determine if text reflects Level-1 (shallow) or Level-2 (deep) causal reasoning
 */
export function detectCausalLevel(text: string): CausalLevel {
  const lower = text.toLowerCase();

  let level1Score = 0;
  let level2Score = 0;

  // Count Level-1 indicators
  for (const indicator of CAUSAL_INDICATORS.LEVEL1) {
    if (lower.includes(indicator)) level1Score++;
  }

  // Count Level-2 indicators
  for (const indicator of CAUSAL_INDICATORS.LEVEL2) {
    if (lower.includes(indicator)) level2Score++;
  }

  // Level-2 requires counterfactual or intervention language
  const hasCounterfactual = CAUSAL_INDICATORS.COUNTERFACTUAL_MARKERS.some(
    m => lower.includes(m)
  );
  const hasIntervention = CAUSAL_INDICATORS.INTERVENTION_MARKERS.some(
    m => lower.includes(m)
  );

  if (hasCounterfactual || hasIntervention) {
    level2Score += 2;
  }

  // Heuristic: Level-2 if counterfactual/intervention present, else Level-1
  return level2Score >= 2 || hasCounterfactual ? 2 : 1;
}

/**
 * Assess confidence in level determination
 */
export function assessLevelConfidence(text: string): number {
  const lower = text.toLowerCase();

  let indicators = 0;
  for (const ind of [...CAUSAL_INDICATORS.LEVEL1, ...CAUSAL_INDICATORS.LEVEL2]) {
    if (lower.includes(ind)) indicators++;
  }

  // More indicators = higher confidence
  return Math.min(0.95, 0.4 + indicators * 0.1);
}

/**
 * Analyze causal reasoning quality
 */
export function analyzeCausalReasoning(
  context: string,
  question: string,
  answer: string,
  retrievedKnowledge?: string[]
): CausalReasoningResult {
  const fullText = `${context} ${question} ${answer}`;
  const level = detectCausalLevel(fullText);
  const confidence = assessLevelConfidence(fullText);

  const trace: string[] = [];
  let reasoningType: CausalReasoningResult['reasoningType'] = 'pattern_matching';

  // Detect reasoning type
  if (level === 2) {
    const lower = fullText.toLowerCase();
    if (CAUSAL_INDICATORS.COUNTERFACTUAL_MARKERS.some(m => lower.includes(m))) {
      reasoningType = 'counterfactual';
      trace.push('Detected counterfactual reasoning pattern');
    }
    if (CAUSAL_INDICATORS.INTERVENTION_MARKERS.some(m => lower.includes(m))) {
      reasoningType = 'intervention';
      trace.push('Detected intervention/do-calculus pattern');
    }
  }

  // Estimate counterfactual ability
  const counterfactualAbility = level === 2
    ? estimateCounterfactualAbility(fullText)
    : 0.2 + Math.random() * 0.2; // Level-1: some apparent but shallow

  // Estimate intervention understanding
  const interventionUnderstanding = level === 2
    ? estimateInterventionUnderstanding(fullText)
    : 0.15 + Math.random() * 0.15;

  trace.push(`Causal level: ${level}`);
  trace.push(`Reasoning type: ${reasoningType}`);
  trace.push(`Confidence: ${(confidence * 100).toFixed(0)}%`);

  // Detect causal knowledge sources
  const detectedKnowledge = detectedCausalKnowledge(fullText, retrievedKnowledge);

  const recommendation = level === 1
    ? 'Consider augmenting with RAG-based general knowledge retrieval (G2-Reasoner approach) to achieve Level-2 causal reasoning'
    : 'Level-2 reasoning achieved. Maintain counterfactual and intervention patterns.';

  return {
    level,
    confidence,
    reasoningType,
    trace,
    detectedCausalKnowledge: detectedKnowledge,
    counterfactualAbility,
    interventionUnderstanding,
    recommendation,
  };
}

function estimateCounterfactualAbility(text: string): number {
  const lower = text.toLowerCase();
  const markers = CAUSAL_INDICATORS.COUNTERFACTUAL_MARKERS;
  const matches = markers.filter(m => lower.includes(m)).length;

  // More markers = higher ability
  const raw = 0.4 + matches * 0.15;
  return Math.min(0.95, raw);
}

function estimateInterventionUnderstanding(text: string): number {
  const lower = text.toLowerCase();
  const markers = CAUSAL_INDICATORS.INTERVENTION_MARKERS;
  const matches = markers.filter(m => lower.includes(m)).length;

  const raw = 0.35 + matches * 0.15;
  return Math.min(0.95, raw);
}

function detectedCausalKnowledge(
  text: string,
  retrieved?: string[]
): string[] {
  const knowledge: string[] = [];
  const lower = text.toLowerCase();

  // Pattern: "X causes Y"
  const causeEffectPattern = /(\w+)\s+(causes?|leads to|results in|increases|decreases)\s+(\w+)/gi;
  let match;
  while ((match = causeEffectPattern.exec(text)) !== null) {
    knowledge.push(`${match[1]} → ${match[3]}`);
  }

  // Check retrieved knowledge
  if (retrieved) {
    for (const doc of retrieved) {
      const docLower = doc.toLowerCase();
      if (docLower.includes('because') || docLower.includes('therefore')) {
        knowledge.push('general_knowledge_retrieved');
        break;
      }
    }
  }

  return knowledge;
}

// ── Causal Graph ───────────────────────────────────────────────────────────────

/**
 * Build a causal graph from text
 */
export function buildCausalGraph(text: string): CausalGraph {
  const nodes = new Map<string, CausalNode>();
  const edges: CausalEdge[] = [];

  const lower = text.toLowerCase();

  // Extract causal relationships
  const patterns = [
    /(\w+)\s+causes\s+(\w+)/gi,
    /(\w+)\s+leads to\s+(\w+)/gi,
    /(\w+)\s+results in\s+(\w+)/gi,
    /if\s+(\w+),\s+then\s+(\w+)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const [, from, to] = match;
      const fromId = from.toLowerCase();
      const toId = to.toLowerCase();

      // Add nodes
      if (!nodes.has(fromId)) {
        nodes.set(fromId, {
          id: fromId,
          label: from,
          type: 'cause',
          children: [],
          parents: [],
        });
      }
      if (!nodes.has(toId)) {
        nodes.set(toId, {
          id: toId,
          label: to,
          type: 'effect',
          children: [],
          parents: [],
        });
      }

      // Add edge
      nodes.get(fromId)!.children.push(toId);
      nodes.get(toId)!.parents.push(fromId);
      edges.push({
        from: fromId,
        to: toId,
        type: 'causes',
        strength: 0.8,
      });
    }
  }

  return { nodes, edges };
}

/**
 * Check if a causal relationship is synthetic (Level-1) or genuine (Level-2)
 */
export function assessCausalGenuineness(
  cause: string,
  effect: string,
  mechanism: string,
  counterfactualScenario?: string
): { genuine: boolean; level: CausalLevel; confidence: number } {
  // Level-2 indicators
  const hasMechanism = mechanism.length > 20;
  const hasCounterfactual = counterfactualScenario &&
    counterfactualScenario.toLowerCase().includes('if') &&
    counterfactualScenario.toLowerCase().includes('not');

  if (hasMechanism && hasCounterfactual) {
    return { genuine: true, level: 2, confidence: 0.85 };
  }

  if (hasMechanism || hasCounterfactual) {
    return { genuine: true, level: 2, confidence: 0.65 };
  }

  // Level-1: pattern only
  return { genuine: false, level: 1, confidence: 0.5 };
}

/**
 * G2-Reasoner inspired: augment causal reasoning with general knowledge
 */
export function augmentWithGeneralKnowledge(
  causalResult: CausalReasoningResult,
  retrievedKnowledge: string[]
): CausalReasoningResult {
  if (retrievedKnowledge.length === 0) {
    return causalResult;
  }

  // If we have retrieved knowledge and still only got Level-1 → suggest upgrade
  const augmented = { ...causalResult };

  if (causalResult.level === 1 && retrievedKnowledge.length > 0) {
    augmented.recommendation =
      'G2-Reasoner approach: Retrieved general knowledge available. ' +
      'Use goal-oriented prompting to steer toward Level-2 causal reasoning. ' +
      causalResult.recommendation;
    augmented.trace.push(
      `[G2-Reasoner] ${retrievedKnowledge.length} knowledge pieces retrieved`
    );
  }

  return augmented;
}

// ── Quick Assessment ───────────────────────────────────────────────────────────

/**
 * Quick causal reasoning assessment for a single question
 */
export function quickAssess(
  question: string,
  choices: string[],
  selectedAnswer: number
): CausalReasoningResult {
  const level = detectCausalLevel(question);
  const trace = [
    `Question causal level: ${level}`,
    `Choices analyzed: ${choices.length}`,
  ];

  let counterfactualAbility = 0;
  let interventionUnderstanding = 0;

  if (level === 2) {
    counterfactualAbility = estimateCounterfactualAbility(question);
    interventionUnderstanding = estimateInterventionUnderstanding(question);
  }

  return {
    level,
    confidence: assessLevelConfidence(question),
    reasoningType: level === 2 ? 'counterfactual' : 'pattern_matching',
    trace,
    detectedCausalKnowledge: detectedCausalKnowledge(question),
    counterfactualAbility,
    interventionUnderstanding,
    recommendation: level === 1
      ? 'Consider reformulating question with counterfactual framing'
      : 'Strong causal reasoning detected',
  };
}
