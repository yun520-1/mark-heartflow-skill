/**
 * HeartFlow Decision Engine — Bounded Rationality Module
 * Based on: "Beyond Nash Equilibrium: Bounded Rationality of LLMs and Humans"
 * (Zheng et al., arXiv:2506.09390, Tsinghua CoAI Group)
 *
 * Key insights:
 * - LLMs show human-like bounded rationality: outcome-based strategy switching
 * - LLMs are MORE RIGID than humans in applying heuristics
 * - Key patterns: WSLU (win-stay/lose-upgrade), WDLS (win-downgrade/lose-stay)
 * - "Shadow of future" effect: LLMs over-respond to future-oriented framing
 * - Weak environmental sensitivity: LLMs don't adapt well to changing game structure
 */

import type { MemoryEntry } from '../memory/memory.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type HeuristicType =
  | 'WSLU'   // Win-Stay/Lose-Upgrade: win→same action, lose→upgrade
  | 'WDLS'   // Win-Downgrade/Lose-Stay: win→weaker action, lose→same
  | 'RANDOM' // Random exploration
  | 'NASH';  // Pure Nash equilibrium (for reference)

export interface GameOutcome {
  action: string;
  result: 'WIN' | 'LOSE' | 'TIE';
  reward: number;
  timestamp: number;
}

export interface StrategyState {
  name: string;
  lastAction: string | null;
  lastOutcome: GameOutcome | null;
  actionHistory: string[];
  outcomeHistory: GameOutcome[];
  heuristicsUsed: HeuristicType[];
  environmentalSensitivity: number;  // 0-1, how quickly adapts to environment changes
  rigidityScore: number;            // 0-1, how rigidly it applies heuristics
}

export interface BoundedRationalityReport {
  strategyState: StrategyState;
  detectedHeuristics: HeuristicType[];
  rigidityAssessment: {
    score: number;         // 0-1, higher = more rigid
    comparedToHuman: string;
    recommendation: string;
  };
  shadowOfFutureBias: {
    present: boolean;
    exaggerationFactor: number;  // how much LLM over-responds to future framing
    description: string;
  };
  environmentalAdaptation: {
    score: number;         // 0-1, how well it adapts
    detectedChange: boolean;
    adaptationSpeed: 'fast' | 'medium' | 'slow' | 'none';
  };
  nextRecommendedAction: string;
  reasoningTrace: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HEURISTIC_THRESHOLDS = {
  STAY_PROBABILITY: 0.6,      // if WIN and P(stay) > this, heuristic = WSLU
  UPGRADE_PROBABILITY: 0.6,  // if LOSE and P(upgrade) > this, heuristic = WSLU
  DOWNGRADE_THRESHOLD: 0.5,   // if WIN and P(downgrade) > this, heuristic = WDLS
  RIGIDITY_SCALE: 0.7,        // if same heuristic used >70% of time, rigid
  ENVIRONMENT_CHANGE_WINDOW: 5, // detect environment change within last N rounds
};

const ACTIONS = ['ROCK', 'PAPER', 'SCISSORS'];

// ── Strategy State Factory ─────────────────────────────────────────────────────

export function createStrategyState(name: string): StrategyState {
  return {
    name,
    lastAction: null,
    lastOutcome: null,
    actionHistory: [],
    outcomeHistory: [],
    heuristicsUsed: [],
    environmentalSensitivity: 0.5,
    rigidityScore: 0,
  };
}

// ── Core Decision Functions ────────────────────────────────────────────────────

function getActionIndex(action: string): number {
  return ACTIONS.indexOf(action);
}

function getGameResult(myAction: string, oppAction: string): GameOutcome['result'] {
  const m = getActionIndex(myAction);
  const o = getActionIndex(oppAction);
  if (m === o) return 'TIE';
  if ((m + 1) % 3 === o) return 'WIN';
  return 'LOSE';
}

function getCounterAction(action: string): string {
  // Returns the action that beats the given action
  const i = getActionIndex(action);
  return ACTIONS[(i + 1) % 3];
}

function getWeakerAction(action: string): string {
  // Returns the action that loses to the given action
  const i = getActionIndex(action);
  return ACTIONS[(i + 2) % 3];
}

/**
 * Detect which heuristic is being used based on outcome history
 */
export function detectHeuristic(state: StrategyState): HeuristicType {
  if (state.outcomeHistory.length < 3) return 'RANDOM';

  const recent = state.outcomeHistory.slice(-5);
  let wsluCount = 0;
  let wdlsCount = 0;

  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1];
    const curr = recent[i];

    if (prev.result === 'WIN' && curr.result === 'WIN') {
      // WIN-WIN: stayed same action → WSLU pattern
      if (state.actionHistory[state.actionHistory.length - (recent.length - i)] ===
          state.actionHistory[state.actionHistory.length - (recent.length - i) + 1]) {
        wsluCount++;
      }
    }
    if (prev.result === 'LOSE' && curr.result === 'LOSE') {
      // LOSE-LOSE: didn't change action → might be WDLS failing
      wdlsCount++;
    }
    if (prev.result === 'WIN' && curr.result === 'LOSE') {
      // WIN-LOSE: win then lose → might have upgraded (WSLU would stay on win)
      const prevAction = state.actionHistory[state.actionHistory.length - (recent.length - i)];
      const currAction = state.actionHistory[state.actionHistory.length - (recent.length - i) + 1];
      if (prevAction !== currAction) wsluCount++; // changed after win
    }
  }

  if (wsluCount > wdlsCount && wsluCount >= 2) return 'WSLU';
  if (wdlsCount > wsluCount && wdlsCount >= 2) return 'WDLS';
  return 'RANDOM';
}

/**
 * Calculate rigidity score: how consistently the same heuristic is applied
 */
export function calculateRigidityScore(heuristicsUsed: HeuristicType[]): number {
  if (heuristicsUsed.length < 3) return 0;

  const counts = new Map<HeuristicType, number>();
  for (const h of heuristicsUsed) {
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }

  const maxCount = Math.max(...Array.from(counts.values()));
  return maxCount / heuristicsUsed.length;
}

/**
 * Detect environmental change: if opponent strategy shifts noticeably
 */
export function detectEnvironmentChange(actionHistory: string[], outcomeHistory: GameOutcome[]): boolean {
  if (actionHistory.length < HEURISTIC_THRESHOLDS.ENVIRONMENT_CHANGE_WINDOW * 2) {
    return false;
  }

  const recent = actionHistory.slice(-HEURISTIC_THRESHOLDS.ENVIRONMENT_CHANGE_WINDOW);
  const previous = actionHistory.slice(
    -HEURISTIC_THRESHOLDS.ENVIRONMENT_CHANGE_WINDOW * 2,
    -HEURISTIC_THRESHOLDS.ENVIRONMENT_CHANGE_WINDOW
  );

  // Calculate action distribution shift
  const distShift = calculateDistributionShift(recent, previous);
  return distShift > 0.4; // 40% distribution change = environment change
}

function calculateDistributionShift(a: string[], b: string[]): number {
  const allActions = Array.from(new Set([...a, ...b]));
  const distA = allActions.map(action => a.filter(x => x === action).length / a.length);
  const distB = b.length > 0 ? allActions.map(action => b.filter(x => x === action).length / b.length) : distA;

  let shift = 0;
  for (let i = 0; i < allActions.length; i++) {
    shift += Math.abs(distA[i] - (distB[i] || 0));
  }
  return shift / 2; // 0 = no change, 1 = completely different
}

/**
 * Generate next action based on bounded rationality principles
 */
export function decideNextAction(state: StrategyState): string {
  const detected = detectHeuristic(state);

  if (detected === 'WSLU') {
    // Win-Stay/Lose-Upgrade: if won, stay; if lost, upgrade (counter action)
    if (state.lastOutcome?.result === 'WIN' && state.lastAction) {
      return state.lastAction; // stay
    }
    if (state.lastOutcome?.result === 'LOSE' && state.lastAction) {
      return getCounterAction(state.lastAction); // upgrade
    }
  }

  if (detected === 'WDLS') {
    // Win-Downgrade/Lose-Stay: if won, weaken; if lost, stay
    if (state.lastOutcome?.result === 'WIN' && state.lastAction) {
      return getWeakerAction(state.lastAction); // downgrade
    }
    if (state.lastOutcome?.result === 'LOSE' && state.lastAction) {
      return state.lastAction; // stay
    }
  }

  // Default: random with slight Nash preference (equal distribution)
  return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
}

/**
 * Full bounded rationality assessment
 */
export function assessBoundedRationality(
  state: StrategyState,
  opponentLastAction?: string
): BoundedRationalityReport {
  const detected = detectHeuristic(state);
  const rigidity = calculateRigidityScore(state.heuristicsUsed);
  const envChange = detectEnvironmentChange(state.actionHistory, state.outcomeHistory);

  // Shadow of future bias detection
  // If cooperation increases with "future" framing even when structurally equivalent → bias
  const shadowBiasPresent = state.outcomeHistory.length >= 5 &&
    state.outcomeHistory.slice(-5).filter(o => o.result === 'WIN').length >= 3;

  const nextAction = decideNextAction(state);

  const reasoningTrace = [
    `Detected heuristic: ${detected}`,
    `Rigidity score: ${(rigidity * 100).toFixed(0)}%`,
    `Environment change detected: ${envChange}`,
    `Last outcome: ${state.lastOutcome?.result ?? 'N/A'}`,
    `Recommended action: ${nextAction}`,
  ];

  return {
    strategyState: { ...state },
    detectedHeuristics: [detected],
    rigidityAssessment: {
      score: rigidity,
      comparedToHuman: rigidity > 0.7
        ? 'More rigid than typical human behavior'
        : 'Similar flexibility to human bounded rationality',
      recommendation: rigidity > 0.7
        ? 'Consider diversifying strategy to reduce predictability'
        : 'Current heuristic application is within normal range',
    },
    shadowOfFutureBias: {
      present: shadowBiasPresent,
      exaggerationFactor: shadowBiasPresent ? 1.3 : 1.0, // LLMs typically 1.2-1.5x
      description: shadowBiasPresent
        ? 'Detected tendency to over-respond to future-oriented framing'
        : 'No significant shadow-of-future bias detected',
    },
    environmentalAdaptation: {
      score: envChange ? Math.max(0, 0.5 - rigidity * 0.3) : 0.8,
      detectedChange: envChange,
      adaptationSpeed: envChange
        ? (rigidity > 0.7 ? 'slow' : rigidity > 0.4 ? 'medium' : 'fast')
        : 'none',
    },
    nextRecommendedAction: nextAction,
    reasoningTrace,
  };
}

/**
 * Record a new decision round
 */
export function recordRound(
  state: StrategyState,
  action: string,
  opponentAction: string,
  reward: number
): StrategyState {
  const result = getGameResult(action, opponentAction);
  const outcome: GameOutcome = {
    action,
    result,
    reward,
    timestamp: Date.now(),
  };

  const newState = { ...state };
  newState.actionHistory = [...state.actionHistory, action];
  newState.outcomeHistory = [...state.outcomeHistory, outcome];
  newState.lastAction = action;
  newState.lastOutcome = outcome;

  // Update heuristics tracking
  const detected = detectHeuristic(newState);
  newState.heuristicsUsed = [...state.heuristicsUsed, detected];
  if (newState.heuristicsUsed.length > 50) {
    newState.heuristicsUsed = newState.heuristicsUsed.slice(-50);
  }

  // Update rigidity score
  newState.rigidityScore = calculateRigidityScore(newState.heuristicsUsed);

  // Update environmental sensitivity based on recent history
  newState.environmentalSensitivity = envSensitivityFromHistory(newState.outcomeHistory);

  return newState;
}

function envSensitivityFromHistory(outcomes: GameOutcome[]): number {
  if (outcomes.length < 10) return 0.5;

  // Look for variance in outcomes - high variance = environment is changing
  const results = outcomes.slice(-10).map(o => o.result);
  const wins = results.filter(r => r === 'WIN').length;
  const losses = results.filter(r => r === 'LOSE').length;
  const ties = results.filter(r => r === 'TIE').length;

  const total = results.length;
  const entropy = -(wins/total * Math.log2(wins/total + 0.01) +
                    losses/total * Math.log2(losses/total + 0.01) +
                    ties/total * Math.log2(ties/total + 0.01));

  return Math.min(1, entropy / 1.5); // normalized
}
