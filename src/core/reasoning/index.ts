/**
 * HeartFlow Reasoning Engine — Unified Interface
 * v0.13.50
 *
 * Integrates:
 * - bounded-rationality: outcome-based decision heuristics (WSLU/WDLS)
 * - causal-reasoning: Level-1 vs Level-2 causal inference
 */

import {
  createStrategyState,
  recordRound,
  detectHeuristic,
  assessBoundedRationality,
  calculateRigidityScore,
  type StrategyState,
  type BoundedRationalityReport,
  type HeuristicType,
} from './bounded-rationality.js';

import {
  detectCausalLevel,
  analyzeCausalReasoning,
  buildCausalGraph,
  augmentWithGeneralKnowledge,
  quickAssess,
  type CausalReasoningResult,
  type CausalLevel,
} from './causal-reasoning.js';

// ── Unified Reasoning Engine ──────────────────────────────────────────────────

export interface ReasoningProfile {
  boundedRationality: BoundedRationalityReport | null;
  causalReasoning: CausalReasoningResult | null;
  dominantReasoningMode: 'bounded_rational' | 'causal_level1' | 'causal_level2' | 'mixed';
  overallDecisionQuality: number;  // 0-1
  recommendations: string[];
}

export interface ReasoningEngine {
  // Strategy assessment
  assessDecision: (context: string, options: string[]) => StrategyDecision;
  // Causal analysis
  analyzeCause: (context: string, question: string, answer: string) => CausalReasoningResult;
  // Unified profile
  getProfile: () => ReasoningProfile;
  // Bounded rationality state
  strategyState: StrategyState;
  // Boot
  boot: () => void;
  shutdown: () => void;
}

export interface StrategyDecision {
  recommended: string;
  heuristics: HeuristicType[];
  reasoningTrace: string[];
  confidence: number;
}

/**
 * Create unified reasoning engine
 */
export function createReasoningEngine(name: string = 'default'): ReasoningEngine {
  let state = createStrategyState(name);
  let lastCausalResult: CausalReasoningResult | null = null;

  function boot() {
    // No persistent state needed for reasoning engine
  }

  function shutdown() {
    // No cleanup needed
  }

  function assessDecision(context: string, options: string[]): StrategyDecision {
    const br = assessBoundedRationality(state);

    return {
      recommended: br.nextRecommendedAction,
      heuristics: br.detectedHeuristics,
      reasoningTrace: br.reasoningTrace,
      confidence: 1 - br.rigidityAssessment.score, // more rigid = less confident
    };
  }

  function analyzeCause(
    context: string,
    question: string,
    answer: string
  ): CausalReasoningResult {
    lastCausalResult = analyzeCausalReasoning(context, question, answer);
    return lastCausalResult;
  }

  function getProfile(): ReasoningProfile {
    const br = state.outcomeHistory.length > 0
      ? assessBoundedRationality(state)
      : null;

    const dominantMode: ReasoningProfile['dominantReasoningMode'] =
      !br ? 'mixed' :
      br.rigidityAssessment.score > 0.7 ? 'bounded_rational' :
      lastCausalResult?.level === 2 ? 'causal_level2' :
      lastCausalResult?.level === 1 ? 'causal_level1' :
      'mixed';

    const quality = br
      ? (1 - br.rigidityAssessment.score) *
        (br.environmentalAdaptation.score) *
        (lastCausalResult?.counterfactualAbility ?? 0.5)
      : 0.5;

    const recommendations: string[] = [];
    if (br) {
      if (br.rigidityAssessment.score > 0.7) {
        recommendations.push('Reduce heuristic rigidity: introduce more exploration');
      }
      if (br.shadowOfFutureBias.present) {
        recommendations.push('Monitor shadow-of-future bias in decision framing');
      }
      if (lastCausalResult?.level === 1) {
        recommendations.push('Consider G2-Reasoner approach: add general knowledge retrieval for Level-2 causal reasoning');
      }
    }

    return {
      boundedRationality: br,
      causalReasoning: lastCausalResult,
      dominantReasoningMode: dominantMode,
      overallDecisionQuality: Math.min(1, quality),
      recommendations,
    };
  }

  return {
    assessDecision,
    analyzeCause,
    getProfile,
    get strategyState() { return state; },
    boot,
    shutdown,
  };
}

// ── Exports ────────────────────────────────────────────────────────────────────

export {
  // Bounded rationality
  createStrategyState,
  recordRound,
  detectHeuristic,
  assessBoundedRationality,
  calculateRigidityScore,
  // Causal reasoning
  detectCausalLevel,
  analyzeCausalReasoning,
  buildCausalGraph,
  augmentWithGeneralKnowledge,
  quickAssess,
};

export type {
  StrategyState,
  BoundedRationalityReport,
  HeuristicType,
  CausalReasoningResult,
  CausalLevel,
};
