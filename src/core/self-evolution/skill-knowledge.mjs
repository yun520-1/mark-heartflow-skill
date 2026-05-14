/**
 * Skill Knowledge System - 技能知识优化引擎
 * 
 * Based on:
 * - Dash dual knowledge system (agno-agi/dash): curated static + dynamic learned
 * - Reflexion few-shot prompts (noahshinn/reflexion)
 * - CAPY Cortex quality gate
 * 
 * Dual Knowledge Architecture:
 * - KNOWLEDGE: Static, curated, high-confidence rules (loaded from JSON)
 * - LEARNINGS: Dynamic, discovered from errors/corrections, confidence-scored
 * 
 * @version v0.13.90
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { dirname, join } from 'path';

// ============================================================================
// Constants
// ============================================================================

const KNOWLEDGE_DIR = process.env.HERMES_DATA_DIR 
  ? join(process.env.HERMES_DATA_DIR, 'skill-knowledge')
  : join(homedir(), '.hermes', 'data', 'skill-knowledge');

const KNOWLEDGE_FILE = join(KNOWLEDGE_DIR, 'knowledge.json');
const LEARNINGS_FILE = join(KNOWLEDGE_DIR, 'learnings.json');
const SKILL_RULES_FILE = join(KNOWLEDGE_DIR, 'skill-rules.json');

// ============================================================================
// Types
// ============================================================================

/**
 * @typedef {Object} KnowledgeEntry
 * @property {string} id
 * @property {string} skill - Skill name
 * @property {string} pattern - Match pattern
 * @property {string} guidance - What to do when matched
 * @property {string} [examples] - Example inputs/outputs
 * @property {number} confidence - 0-1, starts at 1.0 for curated
 * @property {string} source - 'curated' | 'learned' | 'correction'
 * @property {string} createdAt
 * @property {string} [updatedAt]
 * @property {number} [hitCount]
 */

/**
 * @typedef {Object} LearnedEntry
 * @property {string} id
 * @property {string} skill
 * @property {string} errorPattern
 * @property {string} correction
 * @property {string} rootCause
 * @property {number} confidence - Decays over time, boosted on success
 * @property {number} successCount
 * @property {number} failureCount
 * @property {string} createdAt
 * @property {string} [lastHit]
 */

// ============================================================================
// Core API
// ============================================================================

/**
 * Load knowledge (static curated rules)
 * @returns {Promise<KnowledgeEntry[]>}
 */
export async function loadKnowledge() {
  try {
    const raw = await fs.readFile(KNOWLEDGE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return getDefaultKnowledge();
  }
}

/**
 * Load learnings (dynamic discovered rules)
 * @returns {Promise<LearnedEntry[]>}
 */
export async function loadLearnings() {
  try {
    const raw = await fs.readFile(LEARNINGS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save knowledge
 * @param {KnowledgeEntry[]} entries
 */
async function saveKnowledge(entries) {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(KNOWLEDGE_FILE, JSON.stringify(entries, null, 2));
}

/**
 * Save learnings
 * @param {LearnedEntry[]} entries
 */
async function saveLearnings(entries) {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(LEARNINGS_FILE, JSON.stringify(entries, null, 2));
}

// ============================================================================
// Default Knowledge (HeartFlow skill patterns)
// ============================================================================

function getDefaultKnowledge() {
  return [
    {
      id: 'kn-001',
      skill: 'heartflow',
      pattern: 'search first before writing code',
      guidance: 'When user asks to implement something: 1) Search GitHub for existing implementations 2) If found, use/adapt them 3) Only write new code if nothing exists',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-002',
      skill: 'heartflow',
      pattern: 'report results without hedging',
      guidance: 'When user asks for results: give direct conclusions with evidence. No "might", "possibly", "I think". If uncertain, say "未核实" and indicate confidence level.',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-003',
      skill: 'heartflow',
      pattern: 'code review requires execution',
      guidance: 'When reviewing code: actually execute it, verify return values. Don\'t just read and assume. Report actual execution results.',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-004',
      skill: 'heartflow',
      pattern: 'remember user corrections',
      guidance: 'When user corrects you (says "don\'t do that again", "remember this", "not like that"): save the correction permanently to memory immediately.',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-005',
      skill: 'heartflow',
      pattern: 'self-improvement requires actual behavior change',
      guidance: 'Self-improvement is not documenting what went wrong — it\'s changing what you actually do next time. If you kept making the same error, you didn\'t improve.',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-006',
      skill: 'coding',
      pattern: 'verify file exists after write',
      guidance: 'After writing a file: always verify it exists and check content with read_file or cat. Don\'t assume the write succeeded.',
      confidence: 1.0,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
    {
      id: 'kn-007',
      skill: 'coding',
      pattern: 'use variables not hardcoded values',
      guidance: 'Use config variables for paths, timeouts, retries. Don\'t hardcode /tmp paths or magic numbers.',
      confidence: 0.9,
      source: 'curated',
      createdAt: new Date().toISOString(),
      hitCount: 0,
    },
  ];
}

// ============================================================================
// Query API
// ============================================================================

/**
 * Query knowledge for matching entries
 * @param {string} input - User input or context
 * @param {string} [skill] - Optional skill filter
 * @param {number} [limit]
 * @returns {Promise<{ matched: KnowledgeEntry[], learnings: LearnedEntry[] }>}
 */
export async function queryKnowledge(input, skill, limit = 5) {
  const knowledge = await loadKnowledge();
  const learnings = await loadLearnings();
  const inputLower = input.toLowerCase();

  // Score knowledge matches
  const scored = knowledge
    .filter(e => !skill || e.skill === skill)
    .map(e => {
      const words = e.pattern.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const hits = words.filter(w => inputLower.includes(w)).length;
      return { entry: e, score: hits / Math.max(words.length, 1) };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Score learnings matches
  const learnedScored = learnings
    .filter(e => !skill || e.skill === skill)
    .filter(e => e.confidence > 0.3)
    .map(e => {
      const words = e.errorPattern.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const hits = words.filter(w => inputLower.includes(w)).length;
      return { entry: e, score: (hits / Math.max(words.length, 1)) * e.confidence };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    matched: scored.map(s => ({ ...s.entry, hitCount: (s.entry.hitCount ?? 0) + 1 })),
    learnings: learnedScored.map(s => s.entry),
  };
}

/**
 * Add a learned entry from error/correction
 * @param {Object} params
 */
export async function addLearnedEntry({ skill, errorPattern, correction, rootCause }) {
  const learnings = await loadLearnings();
  
  // Check if similar entry exists
  const existing = learnings.find(e => 
    e.skill === skill && 
    e.errorPattern.toLowerCase() === errorPattern.toLowerCase()
  );

  if (existing) {
    existing.failureCount = (existing.failureCount ?? 0) + 1;
    existing.confidence = Math.max(0.1, existing.confidence - 0.05);
    existing.lastHit = new Date().toISOString();
  } else {
    learnings.push({
      id: `lrn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      skill,
      errorPattern,
      correction,
      rootCause: rootCause ?? '',
      confidence: 0.6,
      successCount: 0,
      failureCount: 1,
      createdAt: new Date().toISOString(),
      lastHit: new Date().toISOString(),
    });
  }

  await saveLearnings(learnings);
  return { stored: true };
}

/**
 * Record success when a learned rule was applied correctly
 * @param {string} learnedId
 */
export async function boostLearnedEntry(learnedId) {
  const learnings = await loadLearnings();
  const entry = learnings.find(e => e.id === learnedId);
  if (entry) {
    entry.successCount = (entry.successCount ?? 0) + 1;
    entry.confidence = Math.min(1.0, entry.confidence + 0.1);
    entry.lastHit = new Date().toISOString();
    await saveLearnings(learnings);
  }
}

/**
 * Decay confidence for entries not used recently
 * @param {number} daysThreshold
 */
export async function decayOldEntries(daysThreshold = 30) {
  const learnings = await loadLearnings();
  const now = Date.now();
  const threshold = daysThreshold * 24 * 60 * 60 * 1000;
  let decayed = 0;

  for (const e of learnings) {
    const lastHit = e.lastHit ? new Date(e.lastHit).getTime() : new Date(e.createdAt).getTime();
    if (now - lastHit > threshold) {
      const decay = Math.pow(0.5, (now - lastHit) / (90 * 24 * 60 * 60 * 1000));
      e.confidence = e.confidence * decay;
      decayed++;
    }
  }

  // Remove very low confidence entries
  const filtered = learnings.filter(e => e.confidence > 0.05);
  await saveLearnings(filtered);
  return { decayed, removed: learnings.length - filtered.length };
}

/**
 * Get knowledge summary for a skill
 * @param {string} [skill]
 */
export async function getKnowledgeSummary(skill) {
  const knowledge = await loadKnowledge();
  const learnings = await loadLearnings();
  
  const filteredK = skill ? knowledge.filter(e => e.skill === skill) : knowledge;
  const filteredL = skill ? learnings.filter(e => e.skill === skill) : learnings;

  return {
    knowledgeCount: filteredK.length,
    learningsCount: filteredL.length,
    highConfidenceLearnings: filteredL.filter(e => e.confidence > 0.7).length,
    avgConfidence: filteredL.length > 0 
      ? Math.round((filteredL.reduce((s, e) => s + e.confidence, 0) / filteredL.length) * 100) / 100
      : 0,
    topLearned: filteredL
      .sort((a, b) => b.successCount - a.successCount)
      .slice(0, 5)
      .map(e => ({ pattern: e.errorPattern.slice(0, 50), successCount: e.successCount, confidence: Math.round(e.confidence * 100) / 100 })),
  };
}

/**
 * Build context string for system prompt (Dash-style add_learnings_to_context)
 * @param {string} skill
 * @param {string} userInput
 */
export async function buildContextPrompt(skill, userInput) {
  const { matched, learnings } = await queryKnowledge(userInput, skill, 3);
  
  const lines = [];
  
  if (matched.length > 0) {
    lines.push('## SKILL RULES');
    for (const m of matched) {
      lines.push(`- ${m.pattern}: ${m.guidance}`);
    }
  }

  if (learnings.length > 0) {
    lines.push('## LEARNED PATTERNS (from past errors)');
    for (const l of learnings) {
      lines.push(`- [${Math.round(l.confidence * 100)}%] ${l.errorPattern}: ${l.correction}`);
    }
  }

  return lines.join('\n');
}

export default {
  queryKnowledge,
  addLearnedEntry,
  boostLearnedEntry,
  decayOldEntries,
  getKnowledgeSummary,
  buildContextPrompt,
  loadLearnings,
};
