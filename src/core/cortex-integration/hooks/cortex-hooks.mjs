/**
 * CAPY Cortex Hooks - JavaScript Port
 * 
 * Ports the 7 lifecycle hooks from CAPY Cortex to HeartFlow.
 * These hooks form the "error capture + learning loop" that makes
 * the self-evolution engine actually work, not just simulate.
 * 
 * Hooks:
 *  1. onSessionStart   - Load anti-patterns + principles + preferences
 *  2. onPromptSubmit   - Triple-Fusion retrieval before action
 *  3. onPreBash       - Block known dangerous commands
 *  4. onPreWrite      - Enforce file size limits
 *  5. onToolSuccess   - Success → reinforce rule confidence
 *  6. onToolFailure   - Failure → LLM root-cause + quality gate
 *  7. onStop          - Extract corrections + preferences + session learnings
 * 
 * @version v0.13.89
 */

import { ReflexionMemory, scoreInsight, passesGate } from '../../self-evolution/reflexion-v2.mjs';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

// ============================================================================
// Persistent Storage
// ============================================================================

const DATA_DIR = join(process.env.HERMES_DATA_DIR || join(homedir(), '.hermes', 'data'), 'cortex');
const RULES_FILE = join(DATA_DIR, 'rules.json');
const MEMORY_FILE = join(DATA_DIR, 'memory.json');
const ANTI_PATTERNS_FILE = join(DATA_DIR, 'anti-patterns.json');
const PREFERENCES_FILE = join(DATA_DIR, 'preferences.json');

/** @type {ReflexionMemory|null} */
let _memory = null;
let _rules = [];
let _antiPatterns = [];
let _preferences = {};

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * Load all persistent data
 */
async function loadAll() {
  await ensureDataDir();
  
  if (!_memory) _memory = new ReflexionMemory();
  
  try {
    await _memory.loadFromFile(MEMORY_FILE);
  } catch {}

  try {
    const raw = await fs.readFile(RULES_FILE, 'utf8');
    _rules = JSON.parse(raw);
  } catch {
    _rules = [];
  }

  try {
    const raw = await fs.readFile(ANTI_PATTERNS_FILE, 'utf8');
    _antiPatterns = JSON.parse(raw);
  } catch {
    _antiPatterns = getDefaultAntiPatterns();
  }

  try {
    const raw = await fs.readFile(PREFERENCES_FILE, 'utf8');
    _preferences = JSON.parse(raw);
  } catch {
    _preferences = {};
  }
}

/**
 * Save all persistent data
 */
async function saveAll() {
  await ensureDataDir();
  
  if (_memory) await _memory.saveToFile(MEMORY_FILE);
  await fs.writeFile(RULES_FILE, JSON.stringify(_rules, null, 2));
  await fs.writeFile(ANTI_PATTERNS_FILE, JSON.stringify(_antiPatterns, null, 2));
  await fs.writeFile(PREFERENCES_FILE, JSON.stringify(_preferences, null, 2));
}

// ============================================================================
// Default Anti-Patterns
// ============================================================================

function getDefaultAntiPatterns() {
  return [
    {
      pattern: 'Answer a question without searching first',
      description: 'When user asks about code/config, search before answering',
      severity: 'high',
    },
    {
      pattern: 'Pretend to have done work that was not done',
      description: 'Only report what was actually executed and verified',
      severity: 'critical',
    },
    {
      pattern: 'Use hardcoded values instead of variables',
      description: 'Use config variables for paths and constants',
      severity: 'medium',
    },
    {
      pattern: 'Skip verification after file operations',
      description: 'Always verify file existence and content after writes',
      severity: 'medium',
    },
  ];
}

// ============================================================================
// HOOK 1: onSessionStart
// ============================================================================

/**
 * Load anti-patterns, principles, and user preferences on session start.
 * This primes the "error prevention" layer before any action is taken.
 * 
 * @param {object} sessionContext
 * @returns {Promise<object>} Session priming data
 */
export async function onSessionStart(sessionContext = {}) {
  await loadAll();

  return {
    antiPatterns: _antiPatterns,
    rules: _rules.filter(r => r.confidence > 0.5),
    preferences: _preferences,
    memorySize: _memory?.size ?? 0,
    loadedAt: new Date().toISOString(),
  };
}

// ============================================================================
// HOOK 2: onPromptSubmit
// ============================================================================

/**
 * Triple-Fusion retrieval before submitting a prompt/action.
 * Fuses: (1) FTS keyword match + (2) TF-IDF semantic + (3) Entity graph.
 * For simplicity, we use Jaccard similarity as the fusion signal.
 * 
 * @param {string} prompt
 * @param {string} taskType
 * @returns {Promise<object>} Retrieved context + rules
 */
export async function onPromptSubmit(prompt, taskType = 'general') {
  await loadAll();

  if (!_memory) return { retrieved: [], rules: [] };

  // Retrieve similar memories
  const similar = await _memory.retrieveSimilar({
    task: taskType,
    prompt,
    limit: 5,
  });

  // Retrieve matching rules
  const matchingRules = _rules.filter(r => {
    const pattern = r.pattern?.toLowerCase() ?? '';
    const promptLower = prompt.toLowerCase();
    return pattern.split(' ').some(w => w.length > 4 && promptLower.includes(w));
  }).slice(0, 3);

  // Check anti-pattern triggers
  const triggeredAntiPatterns = _antiPatterns.filter(ap => {
    const p = ap.pattern.toLowerCase();
    const words = p.split(' ').filter(w => w.length > 4);
    return words.some(w => prompt.toLowerCase().includes(w));
  });

  return {
    retrieved: similar,
    rules: matchingRules,
    antiPatternAlerts: triggeredAntiPatterns.map(ap => ({
      pattern: ap.pattern,
      severity: ap.severity,
    })),
  };
}

// ============================================================================
// HOOK 3: onPreBash
// ============================================================================

const DANGEROUS_PATTERNS = [
  { pattern: /^rm\s+-rf\s+\/(?:\s|$)/, reason: 'Root deletion', severity: 'critical' },
  { pattern: /^rm\s+-rf\s+\/home(?:\s|$)/, reason: 'Home directory deletion', severity: 'high' },
  { pattern: /^curl\s+.+\|.*sh\b/, reason: 'Pipe to shell (curl | sh)', severity: 'critical' },
  { pattern: /^wget\s+.+\|.*sh\b/, reason: 'Pipe to shell (wget | sh)', severity: 'critical' },
  { pattern: /^:\(\)\{\s*:\|:\s&\}\s*;:/, reason: 'Fork bomb pattern', severity: 'critical' },
  { pattern: /^dd\s+if=.+\s+of=\/dev\//, reason: 'Direct device write', severity: 'high' },
  { pattern: /^mkfs\./, reason: 'Format filesystem', severity: 'critical' },
];

/**
 * Check command before execution. Block known dangerous patterns.
 * 
 * @param {string} command
 * @returns {{ allowed: boolean, reason?: string, severity?: string }}
 */
export function onPreBash(command) {
  const trimmed = command.trim();

  for (const { pattern, reason, severity } of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { allowed: false, reason, severity };
    }
  }

  return { allowed: true };
}

// ============================================================================
// HOOK 4: onPreWrite
// ============================================================================

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

/**
 * Check file before writing. Enforce size limits.
 * 
 * @param {string} filePath
 * @param {string|Buffer} content
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function onPreWrite(filePath, content) {
  const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content, 'utf8');
  
  if (size > FILE_SIZE_LIMIT) {
    return {
      allowed: false,
      reason: `File size ${size} bytes exceeds limit of ${FILE_SIZE_LIMIT} bytes`,
    };
  }

  return { allowed: true };
}

// ============================================================================
// HOOK 5: onToolSuccess
// ============================================================================

/**
 * Record success → reinforce rule confidence.
 * When a rule was followed and led to success, increase its confidence.
 * 
 * @param {object} context
 * @param {string} context.tool - Tool name
 * @param {string} context.action - What was done
 * @param {string} context.result - Result output
 * @param {string} [context.rule] - Associated rule pattern
 */
export async function onToolSuccess(context) {
  await loadAll();
  const { tool, action, result, rule: matchedRule } = context;

  // Reinforce matching rules
  if (matchedRule) {
    const rules = _rules.filter(r => r.pattern === matchedRule);
    for (const r of rules) {
      r.confidence = Math.min(1.0, (r.confidence ?? 0.5) + 0.1);
      r.successCount = (r.successCount ?? 0) + 1;
      r.lastSuccess = new Date().toISOString();
    }
    await fs.writeFile(RULES_FILE, JSON.stringify(_rules, null, 2));
  }

  // Store success pattern in memory
  await _memory?.store({
    task: tool,
    promptSummary: action.slice(0, 100),
    failedOutput: '',
    feedback: `Success pattern: ${result?.slice(0, 100) ?? 'OK'}`,
  });
  await _memory?.saveToFile(MEMORY_FILE);

  return { recorded: true };
}

// ============================================================================
// HOOK 6: onToolFailure (CORE LEARNING HOOK)
// ============================================================================

/**
 * Record failure → LLM root-cause analysis + quality gate.
 * This is the most important hook — it converts errors into learnable insights.
 * 
 * Quality Gate (from CAPY Cortex):
 * - Score each insight across 4 dimensions: Actionable, Specific, Novel, Durable
 * - Threshold: average >= 2/4 to store
 * 
 * @param {object} context
 * @param {string} context.tool - Tool name
 * @param {string} context.action - What was attempted
 * @param {string} context.error - Error message
 * @param {string} context.taskType - Task category
 * @param {function(string, string): Promise<string>} [llmCall] - Optional LLM for root-cause
 * @returns {Promise<object>} Analysis result
 */
export async function onToolFailure(context) {
  await loadAll();
  const { tool, action, error, taskType = 'general', llmCall } = context;

  // Generate root cause
  let rootCause;
  if (llmCall) {
    try {
      rootCause = await llmCall(
        'You are a root-cause analyst. Given a failed action and error, identify the precise cause in 1-2 sentences. Be specific about what went wrong.',
        `Action: ${action}\nError: ${error}\n\nRoot cause:`
      );
    } catch {
      rootCause = error;
    }
  } else {
    // Heuristic fallback
    rootCause = heuristicRootCause(action, error);
  }

  // Generate correction
  let correction;
  if (llmCall) {
    try {
      correction = await llmCall(
        'You are a technical mentor. Given a failure, give a specific, actionable correction in 1 sentence.',
        `Action: ${action}\nError: ${error}\n\nCorrection:`
      );
    } catch {
      correction = 'Verify inputs and constraints before retrying.';
    }
  } else {
    correction = 'Check error message and verify all parameters before retrying.';
  }

  const insight = `Root: ${rootCause} | Fix: ${correction}`;

  // Quality gate check
  const score = scoreInsight(insight, action + error);
  const passed = passesGate(score);

  if (passed) {
    // Store in memory
    await _memory?.store({
      task: taskType,
      promptSummary: action.slice(0, 100),
      failedOutput: error.slice(0, 500),
      feedback: insight,
    });
    await _memory?.saveToFile(MEMORY_FILE);

    // Create or update rule
    const existingRule = _rules.find(r => r.pattern === action.slice(0, 50));
    if (existingRule) {
      existingRule.confidence = Math.max(0.1, (existingRule.confidence ?? 0.5) - 0.1);
      existingRule.failureCount = (existingRule.failureCount ?? 0) + 1;
      existingRule.lastFailure = new Date().toISOString();
    } else {
      _rules.push({
        pattern: action.slice(0, 50),
        description: insight,
        confidence: 0.5,
        successCount: 0,
        failureCount: 1,
        createdAt: new Date().toISOString(),
        lastFailure: new Date().toISOString(),
      });
    }
    await fs.writeFile(RULES_FILE, JSON.stringify(_rules, null, 2));
  }

  return {
    rootCause,
    correction,
    insight,
    qualityScore: score,
    passed,
    stored: passed,
  };
}

/**
 * Heuristic root cause when no LLM available
 * @param {string} action
 * @param {string} error
 * @returns {string}
 */
function heuristicRootCause(action, error) {
  const errorLower = error.toLowerCase();
  const actionLower = action.toLowerCase();

  if (errorLower.includes('not found') || errorLower.includes('enoent')) {
    if (actionLower.includes('read') || actionLower.includes('open')) {
      return 'File or resource does not exist at specified path';
    }
    return 'Required resource was not found';
  }

  if (errorLower.includes('permission')) {
    return 'Permission denied — check file/directory permissions';
  }

  if (errorLower.includes('timeout')) {
    return 'Operation timed out — consider increasing timeout or simplifying';
  }

  if (errorLower.includes('syntax')) {
    return 'Syntax error in command or code';
  }

  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'Network connectivity issue';
  }

  return `Error: ${error.slice(0, 80)}`;
}

// ============================================================================
// HOOK 7: onStop
// ============================================================================

/**
 * Extract corrections + preferences + session learnings on shutdown.
 * Called when session ends to consolidate all learning.
 * 
 * @param {object} sessionSummary
 * @returns {Promise<object>} Extracted learnings
 */
export async function onStop(sessionSummary = {}) {
  await loadAll();

  const {
    successCount = 0,
    failureCount = 0,
    totalActions = 0,
    duration = 0,
  } = sessionSummary;

  // Confidence decay for unused rules (90-day half-life approximation)
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  let decayApplied = 0;

  for (const rule of _rules) {
    if (rule.lastSuccess) {
      const daysSinceSuccess = (now - new Date(rule.lastSuccess).getTime()) / DAY;
      if (daysSinceSuccess > 7) {
        const decay = Math.pow(0.5, daysSinceSuccess / 90);
        rule.confidence = rule.confidence * decay;
        decayApplied++;
      }
    }
  }

  // Extract top learnings
  const topLearnings = _rules
    .filter(r => (r.successCount ?? 0) > 0)
    .sort((a, b) => (b.successCount ?? 0) - (a.successCount ?? 0))
    .slice(0, 5)
    .map(r => ({
      pattern: r.pattern,
      successCount: r.successCount,
      confidence: Math.round(r.confidence * 100) / 100,
    }));

  const totalMemories = _memory?.size ?? 0;

  await saveAll();

  return {
    sessionLearnings: {
      successCount,
      failureCount,
      totalActions,
      duration,
      successRate: totalActions > 0 ? Math.round((successCount / totalActions) * 100) : 0,
    },
    topLearnings,
    memoryEntries: totalMemories,
    rulesCount: _rules.length,
    decayApplied,
    savedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Utility: Clear all data (for testing)
// ============================================================================

export async function clearAllData() {
  await ensureDataDir();
  _memory?.clear();
  _rules = [];
  _antiPatterns = getDefaultAntiPatterns();
  _preferences = {};
  await saveAll();
  return { cleared: true };
}

export default {
  onSessionStart,
  onPromptSubmit,
  onPreBash,
  onPreWrite,
  onToolSuccess,
  onToolFailure,
  onStop,
  clearAllData,
};
