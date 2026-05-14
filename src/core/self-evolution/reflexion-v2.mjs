/**
 * Reflexion v2 - HeartFlow Integration
 * Based on Reflexion-TS (faveos8758/reflexion-agent-ts) + Reflexion (noahshinn/reflexion)
 * 
 * Core improvements over v1:
 * - LLM-powered reflector (not heuristic)
 * - Jaccard similarity memory (not raw array)
 * - Quality gate: 2/4 threshold filtering
 * - Type-safe ESM module
 * 
 * @version v0.13.89
 */

import { promises as fs } from 'fs';
import { dirname } from 'path';

// ============================================================================
// Types (from Reflexion-TS)
// ============================================================================

/**
 * @typedef {Object} MemoryEntry
 * @property {string} task
 * @property {string} promptSummary
 * @property {string} failedOutput
 * @property {string} feedback
 * @property {number} createdAt
 */

/**
 * @typedef {Object} MemoryQuery
 * @property {string} task
 * @property {string} prompt
 * @property {number} [limit]
 */

/**
 * @typedef {Object} EvaluatorResult
 * @property {boolean} passed
 * @property {number} [score]
 * @property {string} [reason]
 */

/**
 * @typedef {function(string, string, string): Promise<string>} ReflectorFunction
 * @typedef {function(string, unknown?): Promise<EvaluatorResult>} EvaluatorFunction
 */

// ============================================================================
// Jaccard Similarity Memory (from Reflexion-TS, cleaned)
// ============================================================================

/**
 * Tokenize text into word set
 * @param {string} s 
 * @returns {Set<string>}
 */
function tokenize(s) {
  return new Set((s.toLowerCase().match(/\w+/g) ?? []));
}

/**
 * Jaccard similarity between two sets
 * @param {Set<string>} a 
 * @param {Set<string>} b 
 * @returns {number}
 */
function jaccard(a, b) {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter++;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Compute similarity between query and memory entry
 * @param {string} prompt 
 * @param {MemoryEntry} entry 
 * @returns {number}
 */
function similarity(prompt, entry) {
  const q = tokenize(prompt);
  const p = tokenize(entry.promptSummary);
  const f = tokenize(entry.feedback);
  return jaccard(q, p) * 0.7 + jaccard(q, f) * 0.3;
}

/**
 * In-memory reflexion store with Jaccard similarity retrieval.
 * No external vector DB required.
 */
export class ReflexionMemory {
  constructor() {
    /** @type {MemoryEntry[]} */
    this.entries = [];
  }

  /**
   * Store a new memory entry
   * @param {Omit<MemoryEntry, 'createdAt'> & { createdAt?: number }} entry
   */
  async store(entry) {
    const full = {
      ...entry,
      createdAt: entry.createdAt ?? Date.now(),
    };
    this.entries.push(full);
  }

  /**
   * Retrieve similar memories by prompt
   * @param {MemoryQuery} query
   * @returns {Promise<string[]>}
   */
  async retrieveSimilar(query) {
    const limit = query.limit ?? 5;
    const sameTask = this.entries.filter((e) => e.task === query.task);
    const scored = sameTask
      .map((e) => ({ e, s: similarity(query.prompt, e) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.e.feedback);
    return scored;
  }

  /**
   * Save memories to file (JSON)
   * @param {string} path
   */
  async saveToFile(path) {
    await fs.mkdir(dirname(path), { recursive: true });
    const data = JSON.stringify({ entries: this.entries }, null, 0);
    await fs.writeFile(path, data, 'utf8');
  }

  /**
   * Load memories from file
   * @param {string} path
   */
  async loadFromFile(path) {
    try {
      const raw = await fs.readFile(path, 'utf8');
      const parsed = JSON.parse(raw);
      this.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    } catch {
      this.entries = [];
    }
  }

  /** @param {number} maxEntries */
  trim(maxEntries = 1000) {
    if (this.entries.length > maxEntries) {
      this.entries = this.entries.slice(-maxEntries);
    }
  }

  clear() {
    this.entries = [];
  }

  get size() {
    return this.entries.length;
  }
}

// ============================================================================
// LLM Reflector (from Reflexion-TS, enhanced)
// ============================================================================

/**
 * Create default LLM-based reflector
 * Uses HeartFlow's LLM API (generic, works with any provider)
 * 
 * @param {function(string, string): Promise<string>} llmCall - LLM function: (system, prompt) => text
 * @returns {ReflectorFunction}
 */
export function createLLMReflector(llmCall) {
  return async (originalPrompt, failedOutput, evaluationReason) => {
    const system = `You write concise reflective feedback for a failed attempt. Be specific: what went wrong and what to do next time. Output only the feedback, no preamble.`;
    const prompt = `Original task:
${originalPrompt}

Failed output:
${failedOutput}

Evaluation:
${evaluationReason}

Write 2-4 sentences: what went wrong and exactly what to do next time.`;

    try {
      const text = await llmCall(system, prompt);
      return text.trim();
    } catch (err) {
      return `Reflection failed: ${err.message}. Next time, verify output before proceeding.`;
    }
  };
}

/**
 * Template-based reflector (fallback when no LLM available)
 * @returns {ReflectorFunction}
 */
export function createTemplateReflector() {
  return async (_originalPrompt, failedOutput, evaluationReason) =>
    `You failed because: ${evaluationReason}. Your output was: ${failedOutput.slice(0, 200)}${failedOutput.length > 200 ? '…' : ''}. Next time, address the evaluation feedback precisely.`;
}

// ============================================================================
// Quality Gate (from CAPY Cortex)
// ============================================================================

/**
 * Quality dimensions for extracted insights
 * @typedef {{ actionable: number, specific: number, novel: number, durable: number }} QualityScore
 */

/**
 * Score an insight across 4 dimensions (0-4 each)
 * @param {string} insight
 * @param {string} context
 * @returns {QualityScore}
 */
export function scoreInsight(insight, context = '') {
  const words = insight.split(/\s+/);
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  
  // Actionable: contains verbs, recommendations
  const actionable = /should|must|try|use|apply|instead|rather|better|alternative/i.test(insight) ? 3 : 1;
  
  // Specific: contains concrete details (not vague)
  const specific = (insight.match(/\d+|code|file|error|function|command|path/i) || []).length > 2 ? 3 : 1;
  
  // Novel: not just repeating context
  const contextWords = new Set(context.toLowerCase().split(/\s+/));
  let novelCount = 0;
  for (const w of uniqueWords) {
    if (w.length > 4 && !contextWords.has(w)) novelCount++;
  }
  const novel = novelCount > words.length * 0.3 ? 3 : 1;
  
  // Durable: not time-specific or one-shot
  const durable = /\balways|never|whenever|if.*then|consistent/i.test(insight) ? 3 : 1;
  
  return { actionable, specific, novel, durable };
}

/**
 * Check if insight passes quality gate (threshold: 2/4 average)
 * @param {QualityScore} score
 * @returns {boolean}
 */
export function passesGate(score) {
  const avg = (score.actionable + score.specific + score.novel + score.durable) / 4;
  return avg >= 2;
}

// ============================================================================
// Reflexion Agent (HeartFlow-native implementation)
// ============================================================================

/**
 * Normalize maxAttempts to valid integer
 * @param {unknown} raw
 * @returns {number}
 */
function normalizeMaxAttempts(raw) {
  const n = typeof raw === 'number' ? raw
    : typeof raw === 'string' ? Number.parseInt(raw, 10)
    : NaN;
  if (!Number.isFinite(n) || n < 1) return 3;
  return Math.min(50, Math.floor(n));
}

/**
 * Reflexion Agent - Main Loop
 * 
 * Pattern: Attempt -> Evaluate -> Reflect (if failed) -> Retry
 * Until success or maxAttempts
 * 
 * @property {string} task
 * @property {number} maxAttempts
 * @property {EvaluatorFunction} evaluator
 * @property {ReflectorFunction} reflector
 * @property {ReflexionMemory} memory
 */
export class HeartFlowReflexionAgent {
  /**
   * @param {{
   *   task: string,
   *   maxAttempts?: number|string,
   *   evaluator: EvaluatorFunction,
   *   reflector?: ReflectorFunction,
   *   memory?: ReflexionMemory,
   *   onAttempt?: (attempt: number, output: string, feedback?: string) => void,
   * }} config
   */
  constructor(config) {
    this.task = config.task;
    this.maxAttempts = normalizeMaxAttempts(config.maxAttempts ?? 3);
    this.evaluator = config.evaluator;
    this.reflector = config.reflector ?? createTemplateReflector();
    this.memory = config.memory ?? new ReflexionMemory();
    this.onAttempt = config.onAttempt ?? (() => {});
    this._attemptCount = 0;
  }

  /**
   * Run the reflexion loop
   * @param {string} prompt
   * @param {function(string): Promise<{ text: string, done?: boolean }>} executor
   * @returns {Promise<{ success: boolean, output: string, attempts: number, feedbackHistory: string[] }>}
   */
  async run(prompt, executor) {
    let output = '';
    const feedbackHistory = [];
    let finalFeedback;
    this._attemptCount = 0;

    // Retrieve similar past reflections for context
    const similar = await this.memory.retrieveSimilar({
      task: this.task,
      prompt,
      limit: 3,
    });

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      this._attemptCount = attempt;

      // Generate output
      const result = await executor(prompt);
      output = result.text;

      // Evaluate
      const evalResult = await this.evaluator(output);
      this.onAttempt(attempt, output, evalResult.reason);

      if (evalResult.passed) {
        return {
          success: true,
          output,
          attempts: attempt,
          feedbackHistory,
        };
      }

      // Generate reflection
      const reflection = await this.reflector(prompt, output, evalResult.reason ?? 'Evaluation failed');
      feedbackHistory.push(reflection);
      finalFeedback = reflection;

      // Store in memory with quality gate
      const score = scoreInsight(reflection, prompt + output);
      if (passesGate(score)) {
        await this.memory.store({
          task: this.task,
          promptSummary: prompt.slice(0, 100),
          failedOutput: output.slice(0, 500),
          feedback: reflection,
        });
      }
    }

    return {
      success: false,
      output,
      attempts: this._attemptCount,
      feedbackHistory,
      finalFeedback,
    };
  }
}

// ============================================================================
// Factory for HeartFlow integration
// ============================================================================

/**
 * Create a reflexion agent configured for HeartFlow
 * 
 * @param {{
 *   task: string,
 *   llmCall?: function(string, string): Promise<string>,
 *   evaluatorFn?: EvaluatorFunction,
 *   memoryFile?: string,
 * }} options
 */
export function createHeartFlowReflexion(options) {
  const memory = new ReflexionMemory();
  
  // Load existing memory if file provided
  if (options.memoryFile) {
    memory.loadFromFile(options.memoryFile).catch(() => {});
  }

  // Default evaluator: checks for error indicators
  const defaultEvaluator = async (output) => {
    const hasError = /\b(error|failed|exception|crash|wrong|incorrect)\b/i.test(output);
    const hasSuccess = /\b(success|complete|done|working|correct)\b/i.test(output);
    return {
      passed: hasSuccess && !hasError,
      score: hasSuccess && !hasError ? 1 : 0,
      reason: hasError ? 'Output contains error indicators' : hasSuccess ? 'Output looks good' : 'No clear success/error signal',
    };
  };

  return new HeartFlowReflexionAgent({
    task: options.task,
    maxAttempts: options.maxAttempts ?? 3,
    evaluator: options.evaluatorFn ?? defaultEvaluator,
    reflector: options.llmCall ? createLLMReflector(options.llmCall) : createTemplateReflector(),
    memory,
  });
}

export default {
  ReflexionMemory,
  HeartFlowReflexionAgent,
  createLLMReflector,
  createTemplateReflector,
  createHeartFlowReflexion,
  scoreInsight,
  passesGate,
};
