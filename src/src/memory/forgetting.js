/**
 * ForgettingEngine — Visual Compression Inspired Memory Decay
 * 
 * DeepSeek-OCR paper insight: "Human memory decay over time ≈ visual perception 
 * degradation over spatial distance — both exhibit progressive information loss."
 * 
 * v2.0.0: Class-based upgrade with error handling, oscillation detection,
 * input validation, batch operations, statistics tracking, and configurable thresholds.
 * 
 * Features:
 *   - ErrorCode enum + error suggestions
 *   - Input validation for all public methods
 *   - Oscillation detection (rapid access/consolidation patterns)
 *   - Statistics tracking (compression/consolidation/recall)
 *   - Batch operations (compressBatch, consolidateBatch)
 *   - Configurable thresholds (compression ratios, decay rates)
 *   - Memory access pattern tracking (thrashing detection)
 *   - Backward-compatible Proxy wrapper
 */

// ============ ENUMS ============

/**
 * Error codes for the forgetting engine
 */
const ForgettingErrorCode = {
  INPUT_NULL: 'INPUT_NULL',
  INPUT_EMPTY: 'INPUT_EMPTY',
  MEMORY_INVALID: 'MEMORY_INVALID',
  TIMESTAMP_INVALID: 'TIMESTAMP_INVALID',
  BATCH_FAILED: 'BATCH_FAILED',
  THRESHOLD_INVALID: 'THRESHOLD_INVALID',
  STATE_ERROR: 'STATE_ERROR',
  OSILLATION_DETECTED: 'OSILLATION_DETECTED',
  UNKNOWN: 'UNKNOWN',
};

const ERROR_SUGGESTIONS = {
  [ForgettingErrorCode.INPUT_NULL]: 'Input is null/undefined — provide valid memory object',
  [ForgettingErrorCode.INPUT_EMPTY]: 'Input is empty — memory must have content',
  [ForgettingErrorCode.MEMORY_INVALID]: 'Memory object lacks required fields (id, content)',
  [ForgettingErrorCode.TIMESTAMP_INVALID]: 'Timestamp is missing or not a number',
  [ForgettingErrorCode.BATCH_FAILED]: 'Some items in batch operation failed — check partial results',
  [ForgettingErrorCode.THRESHOLD_INVALID]: 'Threshold must be a number between 0 and 1',
  [ForgettingErrorCode.STATE_ERROR]: 'Engine state is invalid — call reset() first',
  [ForgettingErrorCode.OSILLATION_DETECTED]: 'Rapid oscillation detected — consider reducing access rate',
  [ForgettingErrorCode.UNKNOWN]: 'Unknown error — check memory object format',
};

/**
 * Engine states
 */
const ForgettingState = {
  IDLE: 'idle',
  COMPRESSING: 'compressing',
  CONSOLIDATING: 'consolidating',
  DEGRADED: 'degraded',
  ERROR: 'error',
};

/**
 * Oscillation types for access pattern detection
 */
const OscillationType = {
  NONE: 'none',
  RAPID_ACCESS: 'rapid_access',
  REPEATED_CONSOLIDATION: 'repeated_consolidation',
  FREQUENT_THRASHING: 'frequent_thrashing',
};

/**
 * Memory forgetting levels based on age
 * Each level applies progressive "visual blur" to the memory content
 */
const FORGETTING_LEVELS = {
  RECENT: { maxAge: 3600000, compression: 1, precision: 1.0, label: 'vivid' },
  SHORT_TERM: { maxAge: 86400000, compression: 4, precision: 0.95, label: 'clear' },
  MEDIUM_TERM: { maxAge: 604800000, compression: 10, precision: 0.90, label: 'faded' },
  LONG_TERM: { maxAge: 2592000000, compression: 16, precision: 0.75, label: 'blurred' },
  ARCHIVE: { maxAge: Infinity, compression: 20, precision: 0.60, label: 'abstract' },
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
  defaultThreshold: 0.3,
  consolidationThreshold: 0.5,
  oscillationWindow: 10,
  oscillationThreshold: 0.6,
  maxBatchSize: 100,
  maxHistorySize: 50,
  thrashingThreshold: 0.7,
};

// ============ INPUT VALIDATION ============

/**
 * Validate a memory object
 * @param {object} memory - Memory entry with id, content, and timestamp
 * @returns {{ valid: boolean, error: string|null, errorCode: string|null }}
 */
function validateMemory(memory) {
  if (memory === null || memory === undefined) {
    return { valid: false, error: 'Memory is null/undefined', errorCode: ForgettingErrorCode.INPUT_NULL };
  }
  if (typeof memory !== 'object' || Array.isArray(memory)) {
    return { valid: false, error: 'Memory must be an object', errorCode: ForgettingErrorCode.MEMORY_INVALID };
  }
  if (!memory.id) {
    return { valid: false, error: 'Memory missing id', errorCode: ForgettingErrorCode.MEMORY_INVALID };
  }
  if (memory.content === undefined || memory.content === null) {
    return { valid: false, error: 'Memory missing content', errorCode: ForgettingErrorCode.MEMORY_INVALID };
  }
  if (memory.timestamp !== undefined && (typeof memory.timestamp !== 'number' || isNaN(memory.timestamp))) {
    return { valid: false, error: 'Timestamp must be a valid number', errorCode: ForgettingErrorCode.TIMESTAMP_INVALID };
  }
  return { valid: true, error: null, errorCode: null };
}

/**
 * Clamp a value to [min, max]
 */
function clamp(val, min, max) {
  if (typeof val !== 'number' || isNaN(val)) return min;
  return Math.max(min, Math.min(max, val));
}

/**
 * Safe string extraction
 */
function safeString(val) {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return '';
  return String(val);
}

// ============ CORE FUNCTIONS (keep originals for backward compat) ============

/**
 * Calculate forgetting level based on timestamp
 */
function getForgettingLevel(timestamp) {
  const ts = typeof timestamp === 'number' && !isNaN(timestamp) ? timestamp : Date.now();
  const age = Date.now() - ts;

  if (age < FORGETTING_LEVELS.RECENT.maxAge) return FORGETTING_LEVELS.RECENT;
  if (age < FORGETTING_LEVELS.SHORT_TERM.maxAge) return FORGETTING_LEVELS.SHORT_TERM;
  if (age < FORGETTING_LEVELS.MEDIUM_TERM.maxAge) return FORGETTING_LEVELS.MEDIUM_TERM;
  if (age < FORGETTING_LEVELS.LONG_TERM.maxAge) return FORGETTING_LEVELS.LONG_TERM;
  return FORGETTING_LEVELS.ARCHIVE;
}

/**
 * Abstract content based on compression ratio
 */
function abstractContent(content, compression) {
  const text = safeString(content);
  if (!text) return text;

  if (compression <= 1) return text;

  if (compression <= 10) {
    const words = text.split(/\s+/);
    const abstracted = words.map((word, i) => {
      if (word.length <= 3) return word;
      return word[0] + (i % 3 === 0 ? '..' : '.');
    });
    return abstracted.join(' ');
  }

  if (compression <= 16) {
    const words = text.split(/\s+/);
    const keyWords = words.filter(w => w.length > 3).slice(0, Math.ceil(words.length / 4));
    return '[ ' + keyWords.join(' ') + ' ]';
  }

  return '[ memory trace ]';
}

/**
 * Preserve structural elements
 */
function preserveStructure(content, compression) {
  const text = safeString(content);
  if (!text) return {};

  const words = text.split(/\s+/);
  return {
    length: text.length,
    wordCount: words.length,
    firstWord: words[0] || '',
    lastWord: words.length > 1 ? words[words.length - 1] : words[0] || '',
    semanticDensity: words.length > 0 ? text.length / words.length : 0,
  };
}

/**
 * Apply "visual blur" compression to memory content
 */
function compressMemory(memory) {
  const validation = validateMemory(memory);
  if (!validation.valid) {
    return { error: validation.error, errorCode: validation.errorCode, compressed: null };
  }

  const level = getForgettingLevel(memory.timestamp || Date.now());
  const compressed = {
    id: memory.id,
    timestamp: memory.timestamp || Date.now(),
    forgettingLevel: level.label,
    compression: level.compression,
    precision: level.precision,
    content: abstractContent(memory.content, level.compression),
    preserved: preserveStructure(memory.content, level.compression),
  };

  return { error: null, compressed };
}

/**
 * Attempt to retrieve a compressed memory (with loss)
 */
function retrieveWithForgetting(memory) {
  const validation = validateMemory(memory);
  if (!validation.valid) {
    return { error: validation.error, errorCode: validation.errorCode, result: null };
  }

  const level = getForgettingLevel(memory.timestamp || Date.now());
  return {
    error: null,
    result: {
      id: memory.id,
      timestamp: memory.timestamp,
      forgettingLevel: level.label,
      precision: level.precision,
      content: memory.content,
      preserved: memory.preserved || preserveStructure(memory.content, level.compression),
      reconstructionConfidence: level.precision,
      retrievalNote: level.precision < 0.8
        ? `Memory is ${level.label} — reconstruction with ${Math.round(level.precision * 100)}% confidence`
        : null,
    },
  };
}

/**
 * Check if a memory should be "forgotten"
 */
function shouldForget(memory, threshold) {
  const thresh = (typeof threshold === 'number' && !isNaN(threshold)) ? clamp(threshold, 0, 1) : DEFAULT_CONFIG.defaultThreshold;
  const level = getForgettingLevel(memory.timestamp || Date.now());
  return level.precision < thresh;
}

/**
 * Consolidate multiple memories into an abstracted summary
 */
function consolidateMemories(memories) {
  if (!memories || !Array.isArray(memories) || memories.length === 0) return null;
  if (memories.length === 1) return memories[0];

  const validMemories = memories.filter(m => m && typeof m === 'object');
  if (validMemories.length === 0) return null;

  const timestamps = validMemories.map(m => (m.timestamp && typeof m.timestamp === 'number' ? m.timestamp : 0));
  const avgTimestamp = timestamps.reduce((a, b) => a + b, 0) / timestamps.length;

  const allContent = validMemories.map(m => safeString(m.content)).join(' ');
  const words = allContent.split(/\s+/);
  const wordFreq = {};
  words.forEach(w => { if (w && w.length > 3) wordFreq[w.toLowerCase()] = (wordFreq[w.toLowerCase()] || 0) + 1; });

  const keyThemes = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => e[0]);

  return {
    id: `consolidated-${Date.now()}`,
    timestamp: avgTimestamp,
    forgettingLevel: 'consolidated',
    compression: 25,
    precision: 0.5,
    content: `[Consolidated memory of ${validMemories.length} related experiences: ${keyThemes.join(', ')}]`,
    preserved: {
      memoryCount: validMemories.length,
      themes: keyThemes,
      timeSpan: Math.max(...timestamps) - Math.min(...timestamps),
    },
  };
}

// ============ FORGETTING ENGINE CLASS ============

class ForgettingEngine {
  /**
   * @param {object} options - Configuration options
   * @param {number} options.defaultThreshold - Default forget threshold (0-1)
   * @param {number} options.consolidationThreshold - Min similarity for consolidation
   * @param {number} options.oscillationWindow - History window for oscillation detection
   * @param {number} options.oscillationThreshold - Oscillation trigger threshold (0-1)
   * @param {number} options.maxBatchSize - Maximum items in batch operations
   * @param {number} options.maxHistorySize - Maximum access history entries
   * @param {number} options.thrashingThreshold - Memory thrashing trigger ratio
   */
  constructor(options = {}) {
    // Initialize internal state BEFORE any method calls
    this._state = ForgettingState.IDLE;
    this._errorCount = 0;
    this._lastError = null;

    // Statistics counters
    this._stats = {
      totalCompressions: 0,
      totalRetrievals: 0,
      totalConsolidations: 0,
      totalForgetChecks: 0,
      errorCount: 0,
      oscillationWarnings: 0,
      totalBatchOps: 0,
    };

    // Access history for oscillation detection
    this._accessHistory = [];
    this._consolidationHistory = [];

    // Configuration
    this._config = {
      defaultThreshold: clamp(options.defaultThreshold ?? DEFAULT_CONFIG.defaultThreshold, 0, 1),
      consolidationThreshold: clamp(options.consolidationThreshold ?? DEFAULT_CONFIG.consolidationThreshold, 0, 1),
      oscillationWindow: Math.max(1, Math.min(100, options.oscillationWindow ?? DEFAULT_CONFIG.oscillationWindow)),
      oscillationThreshold: clamp(options.oscillationThreshold ?? DEFAULT_CONFIG.oscillationThreshold, 0, 1),
      maxBatchSize: Math.max(1, Math.min(1000, options.maxBatchSize ?? DEFAULT_CONFIG.maxBatchSize)),
      maxHistorySize: Math.max(10, Math.min(200, options.maxHistorySize ?? DEFAULT_CONFIG.maxHistorySize)),
      thrashingThreshold: clamp(options.thrashingThreshold ?? DEFAULT_CONFIG.thrashingThreshold, 0, 1),
    };
  }

  // ========== INPUT VALIDATION ==========

  /**
   * Validate a memory object (instance method wrapping static)
   */
  _validateMemory(memory) {
    return validateMemory(memory);
  }

  /**
   * Validate threshold parameter
   */
  _validateThreshold(threshold, paramName = 'threshold') {
    if (threshold === undefined || threshold === null) return null;
    if (typeof threshold !== 'number' || isNaN(threshold)) {
      return { error: `${paramName} must be a number`, errorCode: ForgettingErrorCode.THRESHOLD_INVALID };
    }
    if (threshold < 0 || threshold > 1) {
      return { error: `${paramName} must be between 0 and 1`, errorCode: ForgettingErrorCode.THRESHOLD_INVALID };
    }
    return null;
  }

  /**
   * Track an access event for oscillation detection
   */
  _trackAccess(type, metadata = {}) {
    this._accessHistory.push({
      type,
      timestamp: Date.now(),
      ...metadata,
    });

    // Trim history
    if (this._accessHistory.length > this._config.maxHistorySize) {
      this._accessHistory = this._accessHistory.slice(-this._config.maxHistorySize);
    }
  }

  /**
   * Track a consolidation event
   */
  _trackConsolidation(memoryCount) {
    this._consolidationHistory.push({
      timestamp: Date.now(),
      memoryCount,
    });

    if (this._consolidationHistory.length > this._config.maxHistorySize) {
      this._consolidationHistory = this._consolidationHistory.slice(-this._config.maxHistorySize);
    }
  }

  // ========== OSCILLATION DETECTION ==========

  /**
   * Detect oscillation in access patterns
   * @returns {{ oscillating: boolean, type: string, rate: number }}
   */
  detectOscillation() {
    const window = this._config.oscillationWindow;
    const history = this._accessHistory;

    if (history.length < 3) {
      return { oscillating: false, type: OscillationType.NONE, rate: 0 };
    }

    const recent = history.slice(-window);
    const timeSpan = recent.length >= 2 ? recent[recent.length - 1].timestamp - recent[0].timestamp : 0;

    // Rapid access: high frequency of access events
    if (timeSpan > 0 && recent.length >= 5) {
      const accessRate = recent.length / (timeSpan / 1000); // accesses per second
      const rapidThreshold = 5; // 5+ accesses per second = rapid
      if (accessRate > rapidThreshold) {
        this._stats.oscillationWarnings++;
        return { oscillating: true, type: OscillationType.RAPID_ACCESS, rate: accessRate };
      }
    }

    // Repeated consolidation: consolidation events too close together
    if (this._consolidationHistory.length >= 3) {
      const recentConsolidations = this._consolidationHistory.slice(-3);
      const gaps = [];
      for (let i = 1; i < recentConsolidations.length; i++) {
        gaps.push(recentConsolidations[i].timestamp - recentConsolidations[i - 1].timestamp);
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap < 1000 && avgGap > 0) { // consolidations within 1 second of each other
        this._stats.oscillationWarnings++;
        return { oscillating: true, type: OscillationType.REPEATED_CONSOLIDATION, rate: 1000 / avgGap };
      }
    }

    // Frequent thrashing: same memory compressed multiple times in short window
    const typeCounts = {};
    for (const entry of recent) {
      const key = `${entry.type}:${entry.memoryId || 'unknown'}`;
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    }
    const maxRepeats = Math.max(...Object.values(typeCounts));
    const thrashThreshold = Math.ceil(window * this._config.thrashingThreshold);
    if (maxRepeats >= thrashThreshold) {
      this._stats.oscillationWarnings++;
      return { oscillating: true, type: OscillationType.FREQUENT_THRASHING, rate: maxRepeats / window };
    }

    return { oscillating: false, type: OscillationType.NONE, rate: 0 };
  }

  // ========== PUBLIC METHODS ==========

  /**
   * Compress a single memory
   * @param {object} memory - Memory entry
   * @returns {object} Compressed result with error info
   */
  compress(memory) {
    this._state = ForgettingState.COMPRESSING;
    this._stats.totalCompressions++;

    const result = compressMemory(memory);
    if (result.error) {
      this._stats.errorCount++;
      this._lastError = result.error;
      this._state = ForgettingState.ERROR;
      return result;
    }

    this._trackAccess('compress', { memoryId: memory.id });
    this._state = ForgettingState.IDLE;
    return result;
  }

  /**
   * Retrieve a memory with forgetting-aware reconstruction
   * @param {object} memory - Memory entry
   * @returns {object} Retrieval result with confidence
   */
  retrieve(memory) {
    this._stats.totalRetrievals++;

    const result = retrieveWithForgetting(memory);
    if (result.error) {
      this._stats.errorCount++;
      this._lastError = result.error;
      return result;
    }

    this._trackAccess('retrieve', { memoryId: memory.id });
    return result;
  }

  /**
   * Check if a memory should be forgotten
   * @param {object} memory - Memory entry
   * @param {number} [threshold] - Custom threshold (0-1)
   * @returns {{ shouldForget: boolean, level: object, precision: number }}
   */
  checkForget(memory, threshold) {
    this._stats.totalForgetChecks++;

    const validation = validateMemory(memory);
    if (!validation.valid) {
      this._stats.errorCount++;
      this._lastError = validation.error;
      return { shouldForget: true, level: null, precision: 0, error: validation.error, errorCode: validation.errorCode };
    }

    const thresh = threshold !== undefined ? clamp(threshold, 0, 1) : this._config.defaultThreshold;
    const level = getForgettingLevel(memory.timestamp || Date.now());
    const result = level.precision < thresh;

    this._trackAccess('checkForget', { memoryId: memory.id, result });
    return { shouldForget: result, level, precision: level.precision };
  }

  /**
   * Consolidate multiple memories into one abstracted summary
   * @param {object[]} memories - Array of memory entries
   * @returns {object|null} Consolidated memory
   */
  consolidate(memories) {
    this._state = ForgettingState.CONSOLIDATING;
    this._stats.totalConsolidations++;

    if (!memories || !Array.isArray(memories)) {
      this._stats.errorCount++;
      this._lastError = 'memories must be an array';
      this._state = ForgettingState.ERROR;
      return null;
    }

    if (memories.length === 0) {
      this._state = ForgettingState.IDLE;
      return null;
    }

    const result = consolidateMemories(memories);
    if (result) {
      this._trackConsolidation(memories.length);
      this._trackAccess('consolidate', { memoryId: result.id });
    }

    this._state = ForgettingState.IDLE;
    return result;
  }

  /**
   * Batch compress multiple memories
   * @param {object[]} memories - Array of memory entries
   * @returns {{ results: object[], errors: object[], totalSuccess: number, totalFailed: number }}
   */
  compressBatch(memories) {
    this._stats.totalBatchOps++;

    if (!memories || !Array.isArray(memories)) {
      return { results: [], errors: [{ error: 'Input must be an array', errorCode: ForgettingErrorCode.INPUT_NULL }], totalSuccess: 0, totalFailed: 1 };
    }

    const batch = memories.slice(0, this._config.maxBatchSize);
    const results = [];
    const errors = [];
    let successCount = 0;
    let failCount = 0;

    for (const memory of batch) {
      const result = this.compress(memory);
      if (result.error) {
        errors.push({ memoryId: memory?.id || 'unknown', error: result.error, errorCode: result.errorCode });
        failCount++;
      } else {
        results.push(result.compressed);
        successCount++;
      }
    }

    this._stats.totalCompressions += successCount;

    return {
      results,
      errors,
      totalSuccess: successCount,
      totalFailed: failCount,
    };
  }

  /**
   * Batch consolidate groups of memories
   * @param {object[][]} memoryGroups - Array of memory arrays to consolidate
   * @returns {{ results: (object|null)[], errors: object[] }}
   */
  consolidateBatch(memoryGroups) {
    this._stats.totalBatchOps++;

    if (!memoryGroups || !Array.isArray(memoryGroups)) {
      return { results: [], errors: [{ error: 'Input must be an array of arrays', errorCode: ForgettingErrorCode.INPUT_NULL }] };
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < Math.min(memoryGroups.length, this._config.maxBatchSize); i++) {
      try {
        const result = this.consolidate(memoryGroups[i]);
        results.push(result);
      } catch (err) {
        errors.push({ groupIndex: i, error: err.message });
        results.push(null);
      }
    }

    return { results, errors };
  }

  /**
   * Get forgetting level for a given timestamp
   * @param {number} timestamp
   * @returns {object} Level descriptor
   */
  getLevel(timestamp) {
    return getForgettingLevel(timestamp);
  }

  /**
   * Abstract content (static-like access to original function)
   */
  abstract(text, compression) {
    return abstractContent(text, compression);
  }

  /**
   * Get current engine statistics
   * @returns {object} Stats snapshot
   */
  getStats() {
    const oscillation = this.detectOscillation();
    return {
      ...this._stats,
      state: this._state,
      oscillating: oscillation.oscillating,
      oscillationType: oscillation.type,
      accessHistoryLength: this._accessHistory.length,
      consolidationHistoryLength: this._consolidationHistory.length,
      config: { ...this._config },
    };
  }

  /**
   * Get engine configuration (read-only copy)
   */
  getConfig() {
    return { ...this._config };
  }

  /**
   * Update configuration at runtime
   * @param {object} updates - Partial config updates
   * @returns {object} Updated config
   */
  updateConfig(updates = {}) {
    if (!updates || typeof updates !== 'object') return { ...this._config };

    const validKeys = Object.keys(DEFAULT_CONFIG);
    for (const key of Object.keys(updates)) {
      if (validKeys.includes(key)) {
        const val = updates[key];
        if (key === 'oscillationWindow' || key === 'maxBatchSize' || key === 'maxHistorySize') {
          this._config[key] = Math.max(1, val);
        } else {
          this._config[key] = clamp(val, 0, 1);
        }
      }
    }

    return { ...this._config };
  }

  /**
   * Reset all internal state
   */
  reset() {
    this._state = ForgettingState.IDLE;
    this._errorCount = 0;
    this._lastError = null;
    this._accessHistory = [];
    this._consolidationHistory = [];
    this._stats = {
      totalCompressions: 0,
      totalRetrievals: 0,
      totalConsolidations: 0,
      totalForgetChecks: 0,
      errorCount: 0,
      oscillationWarnings: 0,
      totalBatchOps: 0,
    };
  }

  /**
   * Health check — returns engine status
   */
  healthCheck() {
    const oscillation = this.detectOscillation();
    const health = oscillation.oscillating ? 'degraded' : this._state === ForgettingState.ERROR ? 'error' : 'healthy';

    return {
      status: health,
      state: this._state,
      errorCount: this._errorCount,
      lastError: this._lastError,
      oscillationDetected: oscillation.oscillating,
      oscillationType: oscillation.type,
      memoryAccessRate: this._accessHistory.length > 0
        ? this._stats.totalCompressions / Math.max(1, this._accessHistory.length)
        : 0,
    };
  }
}

// ============ PROXY WRAPPER FOR BACKWARD COMPAT ============

const defaultInstance = new ForgettingEngine();
const ForgettingEngineProxy = new Proxy(defaultInstance, {
  get(target, prop) {
    if (prop in target) return target[prop];
    if (prop === 'ForgettingEngine') return ForgettingEngine;
    if (prop === 'ForgettingErrorCode') return ForgettingErrorCode;
    if (prop === 'ForgettingState') return ForgettingState;
    if (prop === 'OscillationType') return OscillationType;
    if (prop === 'DEFAULT_CONFIG') return DEFAULT_CONFIG;
    return undefined;
  },
});

// ============ MODULE EXPORTS ============

module.exports = ForgettingEngineProxy;
module.exports.ForgettingEngine = ForgettingEngine;
module.exports.ForgettingErrorCode = ForgettingErrorCode;
module.exports.ForgettingState = ForgettingState;
module.exports.OscillationType = OscillationType;
module.exports.FORGETTING_LEVELS = FORGETTING_LEVELS;
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;

// Legacy function exports for direct import compatibility
module.exports.getForgettingLevel = getForgettingLevel;
module.exports.compressMemory = compressMemory;
module.exports.abstractContent = abstractContent;
module.exports.preserveStructure = preserveStructure;
module.exports.retrieveWithForgetting = retrieveWithForgetting;
module.exports.shouldForget = shouldForget;
module.exports.consolidateMemories = consolidateMemories;
module.exports.validateMemory = validateMemory;
