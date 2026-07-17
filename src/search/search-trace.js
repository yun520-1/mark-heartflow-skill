/**
 * HeartFlow SearchTrace Transparency Module
 * 
 * Implements hindsight SearchTrace transparency model for search operations.
 * Provides visibility into search phase metrics, weight decomposition,
 * query information, and search statistics.
 * 
 * Architecture:
 *   SearchPhaseMetrics - Individual phase performance metrics
 *   WeightComponents   - Score weight decomposition (activation/semantic/recency/frequency)
 *   QueryInfo         - Query metadata and context
 *   SearchSummary     - Aggregated search statistics
 *   SearchTrace       - Complete search operation trace
 */

'use strict';

// ============================================================================
// Weight Components
// ============================================================================

/**
 * WeightComponents - Score weight decomposition for search ranking
 * 
 * Default weights based on search relevance research:
 *   - activation: 0.30  (recently activated/focused items)
 *   - semantic:   0.30  (semantic similarity to query)
 *   - recency:    0.25  (temporal recency)
 *   - frequency:  0.15  (access frequency)
 */
class WeightComponents {
  constructor(config = {}) {
    this.activation = config.activation ?? 0.30;
    this.semantic = config.semantic ?? 0.30;
    this.recency = config.recency ?? 0.25;
    this.frequency = config.frequency ?? 0.15;
  }

  /**
   * Validate that weights sum to 1.0
   * @returns {boolean}
   */
  isValid() {
    const sum = this.activation + this.semantic + this.recency + this.frequency;
    return Math.abs(sum - 1.0) < 0.0001;
  }

  /**
   * Normalize weights to sum to 1.0
   * @returns {WeightComponents} Normalized instance
   */
  normalize() {
    const sum = this.activation + this.semantic + this.recency + this.frequency;
    if (sum === 0) return new WeightComponents();
    return new WeightComponents({
      activation: this.activation / sum,
      semantic: this.semantic / sum,
      recency: this.recency / sum,
      frequency: this.frequency / sum
    });
  }

  /**
   * Calculate weighted score from component scores
   * @param {Object} scores - { activation, semantic, recency, frequency }
   * @returns {number} Combined weighted score
   */
  calculateScore(scores) {
    return (
      this.activation * (scores.activation || 0) +
      this.semantic * (scores.semantic || 0) +
      this.recency * (scores.recency || 0) +
      this.frequency * (scores.frequency || 0)
    );
  }

  /**
   * Get weights as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      activation: this.activation,
      semantic: this.semantic,
      recency: this.recency,
      frequency: this.frequency
    };
  }

  /**
   * Serialize to JSON-compatible object
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Create from plain object
   * @param {Object} obj
   * @returns {WeightComponents}
   */
  static fromObject(obj) {
    return new WeightComponents(obj);
  }
}

// ============================================================================
// Search Phase Metrics
// ============================================================================

/**
 * SearchPhaseMetrics - Performance metrics for individual search phases
 */
class SearchPhaseMetrics {
  constructor(config = {}) {
    this.phaseName = config.phaseName || 'unknown';
    this.startTime = config.startTime || null;
    this.endTime = config.endTime || null;
    this.durationMs = config.durationMs ?? null;
    this.itemsProcessed = config.itemsProcessed ?? 0;
    this.itemsMatched = config.itemsMatched ?? 0;
    this.cacheHit = config.cacheHit ?? false;
    this.error = config.error || null;
  }

  /**
   * Calculate duration if start/end times available
   * @returns {number|null} Duration in milliseconds
   */
  calculateDuration() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime;
    }
    return this.durationMs;
  }

  /**
   * Get match rate as percentage
   * @returns {number}
   */
  getMatchRate() {
    if (this.itemsProcessed === 0) return 0;
    return (this.itemsMatched / this.itemsProcessed) * 100;
  }

  /**
   * Mark phase as completed
   * @param {number} endTime - Optional end time (defaults to Date.now())
   */
  complete(endTime = null) {
    this.endTime = endTime || Date.now();
    if (this.startTime) {
      this.durationMs = this.endTime - this.startTime;
    }
  }

  /**
   * Get metrics as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      phaseName: this.phaseName,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.calculateDuration(),
      itemsProcessed: this.itemsProcessed,
      itemsMatched: this.itemsMatched,
      matchRate: this.getMatchRate(),
      cacheHit: this.cacheHit,
      error: this.error
    };
  }

  /**
   * Serialize to JSON-compatible object
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }
}

// ============================================================================
// Query Info
// ============================================================================

/**
 * QueryInfo - Metadata and context for a search query
 */
class QueryInfo {
  constructor(config = {}) {
    this.queryId = config.queryId || this._generateId();
    this.queryText = config.queryText || '';
    this.queryType = config.queryType || 'semantic'; // 'semantic', 'keyword', 'hybrid'
    this.timestamp = config.timestamp || Date.now();
    this.context = config.context || {};
    this.filters = config.filters || {};
    this.limit = config.limit ?? 10;
    this.offset = config.offset ?? 0;
  }

  /**
   * Generate a unique query ID
   * @returns {string}
   * @private
   */
  _generateId() {
    const { randomBytes } = require('crypto');
    return `q_${Date.now()}_${randomBytes(4).toString('hex')}`;
  }

  /**
   * Get query length in characters
   * @returns {number}
   */
  getQueryLength() {
    return this.queryText.length;
  }

  /**
   * Get query word count
   * @returns {number}
   */
  getWordCount() {
    return this.queryText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Check if this is a complex query (multiple words)
   * @returns {boolean}
   */
  isComplex() {
    return this.getWordCount() > 1;
  }

  /**
   * Get pagination info
   * @returns {Object}
   */
  getPagination() {
    return {
      limit: this.limit,
      offset: this.offset,
      hasMore: false // Calculated by caller if needed
    };
  }

  /**
   * Get query info as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      queryId: this.queryId,
      queryText: this.queryText,
      queryType: this.queryType,
      timestamp: this.timestamp,
      context: this.context,
      filters: this.filters,
      pagination: this.getPagination(),
      metadata: {
        queryLength: this.getQueryLength(),
        wordCount: this.getWordCount(),
        isComplex: this.isComplex()
      }
    };
  }

  /**
   * Serialize to JSON-compatible object
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }
}

// ============================================================================
// Search Summary
// ============================================================================

/**
 * SearchSummary - Aggregated statistics for a search operation
 */
class SearchSummary {
  constructor(config = {}) {
    this.totalResults = config.totalResults ?? 0;
    this.returnedResults = config.returnedResults ?? 0;
    this.totalDurationMs = config.totalDurationMs ?? 0;
    this.phases = config.phases || [];
    this.weights = config.weights || null;
    this.scoreDistribution = config.scoreDistribution || {};
    this.topScore = config.topScore ?? null;
    this.averageScore = config.averageScore ?? null;
  }

  /**
   * Add a phase metric
   * @param {SearchPhaseMetrics} phase
   */
  addPhase(phase) {
    this.phases.push(phase);
  }

  /**
   * Calculate total duration from phases
   * @returns {number}
   */
  calculateTotalDuration() {
    return this.phases.reduce((sum, phase) => sum + (phase.calculateDuration() || 0), 0);
  }

  /**
   * Get phase count
   * @returns {number}
   */
  getPhaseCount() {
    return this.phases.length;
  }

  /**
   * Calculate coverage (returned/total)
   * @returns {number}
   */
  getCoverage() {
    if (this.totalResults === 0) return 0;
    return this.returnedResults / this.totalResults;
  }

  /**
   * Get efficiency score (results per ms)
   * @returns {number}
   */
  getEfficiency() {
    if (this.totalDurationMs === 0) return 0;
    return this.returnedResults / this.totalDurationMs;
  }

  /**
   * Get score statistics
   * @returns {Object}
   */
  getScoreStats() {
    return {
      top: this.topScore,
      average: this.averageScore,
      distribution: this.scoreDistribution
    };
  }

  /**
   * Get summary as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      results: {
        total: this.totalResults,
        returned: this.returnedResults,
        coverage: this.getCoverage()
      },
      performance: {
        totalDurationMs: this.totalDurationMs,
        calculatedDurationMs: this.calculateTotalDuration(),
        phasesCount: this.getPhaseCount(),
        efficiency: this.getEfficiency()
      },
      phases: this.phases.map(p => p.toObject()),
      weights: this.weights ? this.weights.toObject() : null,
      scores: this.getScoreStats()
    };
  }

  /**
   * Serialize to JSON-compatible object
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }
}

// ============================================================================
// Search Trace
// ============================================================================

/**
 * SearchTrace - Complete transparency trace for a search operation
 * 
 * Provides end-to-end visibility into the search pipeline including:
 * - Query context and metadata
 * - Phase-by-phase performance metrics
 * - Weight decomposition
 * - Result scoring breakdown
 * - Final aggregated summary
 */
class SearchTrace {
  constructor(config = {}) {
    this.traceId = config.traceId || this._generateId();
    this.version = 'v1.0.0';
    this.query = config.query || null;
    this.phases = config.phases || [];
    this.weights = config.weights || null;
    this.results = config.results || [];
    this.summary = config.summary || null;
    this.startTime = config.startTime || Date.now();
    this.endTime = config.endTime || null;
    this.metadata = config.metadata || {};
  }

  /**
   * Generate a unique trace ID
   * @returns {string}
   * @private
   */
  _generateId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set query info
   * @param {QueryInfo} query
   * @returns {SearchTrace} this
   */
  setQuery(query) {
    this.query = query;
    return this;
  }

  /**
   * Add a phase metric
   * @param {SearchPhaseMetrics} phase
   * @returns {SearchTrace} this
   */
  addPhase(phase) {
    this.phases.push(phase);
    return this;
  }

  /**
   * Set weight components
   * @param {WeightComponents} weights
   * @returns {SearchTrace} this
   */
  setWeights(weights) {
    this.weights = weights;
    return this;
  }

  /**
   * Add a result entry with scoring breakdown
   * @param {Object} result - { id, content, score, breakdown }
   * @returns {SearchTrace} this
   */
  addResult(result) {
    this.results.push({
      rank: this.results.length + 1,
      id: result.id,
      content: result.content,
      score: result.score,
      breakdown: result.breakdown || {},
      timestamp: Date.now()
    });
    return this;
  }

  /**
   * Set search summary
   * @param {SearchSummary} summary
   * @returns {SearchTrace} this
   */
  setSummary(summary) {
    this.summary = summary;
    return this;
  }

  /**
   * Mark trace as complete
   * @param {number} endTime - Optional end time
   * @returns {SearchTrace} this
   */
  complete(endTime = null) {
    this.endTime = endTime || Date.now();
    return this;
  }

  /**
   * Get total trace duration
   * @returns {number|null} Duration in milliseconds
   */
  getDuration() {
    if (this.startTime && this.endTime) {
      return this.endTime - this.startTime;
    }
    return null;
  }

  /**
   * Get the number of phases
   * @returns {number}
   */
  getPhaseCount() {
    return this.phases.length;
  }

  /**
   * Get the number of results
   * @returns {number}
   */
  getResultCount() {
    return this.results.length;
  }

  /**
   * Get phase by name
   * @param {string} name
   * @returns {SearchPhaseMetrics|null}
   */
  getPhaseByName(name) {
    return this.phases.find(p => p.phaseName === name) || null;
  }

  /**
   * Get result by rank
   * @param {number} rank
   * @returns {Object|null}
   */
  getResultByRank(rank) {
    return this.results.find(r => r.rank === rank) || null;
  }

  /**
   * Check if trace is complete
   * @returns {boolean}
   */
  isComplete() {
    return this.endTime !== null;
  }

  /**
   * Get performance breakdown by phase
   * @returns {Object}
   */
  getPerformanceBreakdown() {
    const breakdown = {};
    let totalDuration = 0;

    for (const phase of this.phases) {
      const duration = phase.calculateDuration() || 0;
      breakdown[phase.phaseName] = {
        durationMs: duration,
        itemsProcessed: phase.itemsProcessed,
        itemsMatched: phase.itemsMatched,
        matchRate: phase.getMatchRate(),
        cacheHit: phase.cacheHit
      };
      totalDuration += duration;
    }

    // Calculate percentages
    for (const name in breakdown) {
      breakdown[name].percentage = totalDuration > 0 
        ? (breakdown[name].durationMs / totalDuration) * 100 
        : 0;
    }

    return {
      phases: breakdown,
      totalDurationMs: totalDuration
    };
  }

  /**
   * Get score breakdown for a result
   * @param {number} rank
   * @returns {Object}
   */
  getScoreBreakdown(rank) {
    const result = this.getResultByRank(rank);
    if (!result || !result.breakdown) {
      return null;
    }

    const breakdown = result.breakdown;
    let totalWeighted = 0;

    if (this.weights) {
      totalWeighted = this.weights.calculateScore(breakdown);
    } else {
      totalWeighted = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
    }

    return {
      rank: result.rank,
      totalScore: result.score,
      components: breakdown,
      weights: this.weights ? this.weights.toObject() : null,
      calculatedScore: totalWeighted
    };
  }

  /**
   * Export full trace as plain object
   * @returns {Object}
   */
  toObject() {
    return {
      traceId: this.traceId,
      version: this.version,
      query: this.query ? this.query.toObject() : null,
      performance: this.getPerformanceBreakdown(),
      weights: this.weights ? this.weights.toObject() : null,
      results: this.results.map(r => ({
        rank: r.rank,
        id: r.id,
        content: r.content,
        score: r.score,
        breakdown: r.breakdown,
        scoreDetails: this.getScoreBreakdown(r.rank)
      })),
      summary: this.summary ? this.summary.toObject() : null,
      timing: {
        startTime: this.startTime,
        endTime: this.endTime,
        durationMs: this.getDuration()
      },
      metadata: this.metadata
    };
  }

  /**
   * Export as JSON string
   * @param {number} indent - JSON indentation
   * @returns {string}
   */
  toJSONString(indent = 2) {
    return JSON.stringify(this.toObject(), null, indent);
  }

  /**
   * Serialize to JSON-compatible object
   * @returns {Object}
   */
  toJSON() {
    return this.toObject();
  }

  /**
   * Create from JSON string
   * @param {string} json
   * @returns {SearchTrace}
   */
  static fromJSON(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const trace = new SearchTrace({
      traceId: obj.traceId,
      startTime: obj.timing?.startTime,
      endTime: obj.timing?.endTime,
      metadata: obj.metadata
    });

    if (obj.query) {
      trace.query = QueryInfo.fromObject(obj.query);
    }

    if (obj.weights) {
      trace.weights = WeightComponents.fromObject(obj.weights);
    }

    if (obj.results) {
      trace.results = obj.results.map(r => ({
        rank: r.rank,
        id: r.id,
        content: r.content,
        score: r.score,
        breakdown: r.breakdown || {},
        timestamp: r.timestamp || Date.now()
      }));
    }

    return trace;
  }

  /**
   * Create a new empty trace
   * @returns {SearchTrace}
   */
  static create() {
    return new SearchTrace();
  }

  /**
   * Create a trace with standard weights
   * @returns {SearchTrace}
   */
  static createWithDefaults() {
    return new SearchTrace({
      weights: new WeightComponents()
    });
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create SearchPhaseMetrics instance
 * @param {Object} config
 * @returns {SearchPhaseMetrics}
 */
function createSearchPhaseMetrics(config = {}) {
  return new SearchPhaseMetrics(config);
}

/**
 * Create WeightComponents instance
 * @param {Object} config
 * @returns {WeightComponents}
 */
function createWeightComponents(config = {}) {
  return new WeightComponents(config);
}

/**
 * Create QueryInfo instance
 * @param {Object} config
 * @returns {QueryInfo}
 */
function createQueryInfo(config = {}) {
  return new QueryInfo(config);
}

/**
 * Create SearchSummary instance
 * @param {Object} config
 * @returns {SearchSummary}
 */
function createSearchSummary(config = {}) {
  return new SearchSummary(config);
}

/**
 * Create SearchTrace instance
 * @param {Object} config
 * @returns {SearchTrace}
 */
function createSearchTrace(config = {}) {
  return new SearchTrace(config);
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Classes
  SearchPhaseMetrics,
  WeightComponents,
  QueryInfo,
  SearchSummary,
  SearchTrace,
  // Factory functions
  createSearchPhaseMetrics,
  createWeightComponents,
  createQueryInfo,
  createSearchSummary,
  createSearchTrace
};
