/**
 * AgenticMemoryEngine – evaluates memory salience, prefetches relevant
 * memories, decides write priority, and analyses access patterns.
 *
 * Designed for agent-loop contexts where the cost of retrieving or storing
 * a memory must be weighed against its expected future utility.
 */
class AgenticMemoryEngine {
  /**
   * @param {Object} options
   * @param {number} [options.decayHalfLife=3600000] – ms until a memory's
   *   recency score decays to 0.5.
   * @param {number} [options.tagWeight=0.35] – how much tag overlap
   *   contributes to salience (0-1).
   * @param {number} [options.recencyWeight=0.30] – how much recency
   *   contributes to salience (0-1).
   * @param {number} [options.frequencyWeight=0.20] – how much access
   *   frequency contributes to salience (0-1).
   * @param {number} [options.contextWeight=0.15] – how much contextual
   *   relevance contributes to salience (0-1).
   * @param {number} [options.maxPrefetch=10] – ceiling on prefetch size.
   * @param {Function} [options.tagSimilarity] – optional custom tag
   *   similarity fn(tagsA, tagsB) => number in [0,1].
   */
  constructor(options = {}) {
    this.decayHalfLife = options.decayHalfLife ?? 3600000;
    this.tagWeight = options.tagWeight ?? 0.35;
    this.recencyWeight = options.recencyWeight ?? 0.30;
    this.frequencyWeight = options.frequencyWeight ?? 0.20;
    this.contextWeight = options.contextWeight ?? 0.15;
    this.maxPrefetch = options.maxPrefetch ?? 10;
    this.tagSimilarity = options.tagSimilarity ?? null;
  }

  // ------------------------------------------------------------------ helpers

  /**
   * Exponential-decay factor based on age in milliseconds.
   * @private
   * @param {number} ageMs
   * @returns {number} in (0, 1]
   */
  _decay(ageMs) {
    const halfLife = this.decayHalfLife;
    if (halfLife <= 0) return 1;
    return Math.exp(-(ageMs * Math.LN2) / halfLife);
  }

  /**
   * Default Jaccard similarity over two tag arrays.
   * @private
   * @param {string[]} a
   * @param {string[]} b
   * @returns {number} in [0,1]
   */
  _defaultTagSimilarity(a, b) {
    if (!a.length || !b.length) return 0;
    const setA = new Set(a);
    const setB = new Set(b);
    let intersection = 0;
    for (const t of setA) {
      if (setB.has(t)) intersection += 1;
    }
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  // ------------------------------------------------------------------ public

  /**
   * Compute a salience score for a memory item in the given context.
   *
   * Score ∈ [0, 1] and blends:
   *   - tag similarity to context tags
   *   - recency (exponential decay from last-accessed timestamp)
   *   - access frequency (log-scaled hit count)
   *   - contextual relevance hint already stored in the item
   *
   * @param {Object} memoryItem
   * @param {string[]} memoryItem.tags
   * @param {number} memoryItem.lastAccessed – epoch ms of last access
   * @param {number} memoryItem.accessCount
   * @param {number} [memoryItem.relevance=0.5] – pre-computed context hint
   * @param {Object} context
   * @param {string[]} context.tags – active context tags
   * @param {number} [context.now=Date.now()] – reference timestamp
   * @returns {number} salience score in [0, 1]
   */
  computeSalience(memoryItem, context) {
    const now = context.now ?? Date.now();
    const ageMs = now - (memoryItem.lastAccessed ?? now);
    const recency = this._decay(ageMs);

    const similarityFn = this.tagSimilarity ?? this._defaultTagSimilarity;
    const tagSim = similarityFn(memoryItem.tags ?? [], context.tags ?? []);

    const freq = memoryItem.accessCount ?? 0;
    const frequency = freq === 0 ? 0 : Math.min(1, Math.log(freq + 1) / Math.log(11));

    const relevance = memoryItem.relevance ?? 0.5;

    const score =
      this.tagWeight * tagSim +
      this.recencyWeight * recency +
      this.frequencyWeight * frequency +
      this.contextWeight * relevance;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Return the top-N most salient memories for the given context.
   *
   * @param {Object} context – same shape as {@link computeSalience}
   * @param {Object[]} memories – candidate memory items
   * @param {number} [limit] – max results (defaults to {@link maxPrefetch})
   * @returns {Array<{id: *, score: number}>} sorted desc by salience
   */
  prefetch(context, memories, limit) {
    const n = limit ?? this.maxPrefetch;
    const scored = memories
      .map((m) => ({ id: m.id, score: this.computeSalience(m, context) }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, n);
  }

  /**
   * Decide whether incoming content should be stored now, later, or not
   * at all.
   *
   * Priority levels:
   *   - 'high'   – write immediately (novel tags + high relevance)
   *   - 'medium' – write when load is low (overlapping but not critical)
   *   - 'low'    – defer (likely redundant)
   *   - 'drop'   – discard (no unique signal)
   *
   * @param {string} content – raw memory content
   * @param {string[]} tags – tags describing the content
   * @param {Object} context
   * @param {Object[]} context.existingMemories – already-stored memories
   * @param {number} [context.relevanceThreshold=0.6] – min relevance to
   *   justify a 'high' priority write
   * @returns {'high'|'medium'|'low'|'drop'} write priority
   */
  decideWritePriority(content, tags, context) {
    if (!content || !content.trim()) return 'drop';
    if (!tags || tags.length === 0) return 'low';

    const threshold = context.relevanceThreshold ?? 0.6;
    const existing = context.existingMemories ?? [];

    let maxTagOverlap = 0;
    for (const mem of existing) {
      const memTags = mem.tags ?? [];
      const overlap = this._defaultTagSimilarity(tags, memTags);
      if (overlap > maxTagOverlap) maxTagOverlap = overlap;
    }

    const novelRatio = 1 - maxTagOverlap;

    if (novelRatio >= 0.6 && tags.length >= 3) {
      return 'high';
    }
    if (novelRatio >= 0.3) {
      return 'medium';
    }
    if (novelRatio >= 0.1) {
      return 'low';
    }
    return 'drop';
  }

  /**
   * Analyse access patterns for a specific memory and return a diagnostic
   * summary useful for cache eviction or promotion decisions.
   *
   * Metrics returned:
   *   - totalAccesses: cumulative access count
   *   - avgIntervalMs: mean time between consecutive accesses
   *   - lastAccessed: most recent access timestamp
   *   - trend: 'increasing' | 'stable' | 'declining'
   *   - hotness: 0-1 heat score derived from recent access velocity
   *
   * @param {*} memoryId – identifier of the memory to analyse
   * @param {number[]} accessHistory – ordered epoch-ms timestamps of past
   *   accesses (oldest first)
   * @returns {Object} analysis summary
   */
  analyzeAccessPattern(memoryId, accessHistory) {
    const totalAccesses = accessHistory.length;

    let avgIntervalMs = 0;
    if (totalAccesses >= 2) {
      const first = accessHistory[0];
      const last = accessHistory[accessHistory.length - 1];
      const totalSpan = last - first;
      avgIntervalMs = totalSpan / (totalAccesses - 1);
    }

    const lastAccessed = totalAccesses > 0
      ? accessHistory[accessHistory.length - 1]
      : null;

    // Determine trend from the slope of access timestamps in two halves.
    let trend = 'stable';
    if (totalAccesses >= 4) {
      const mid = Math.floor(totalAccesses / 2);
      const firstHalf = accessHistory.slice(0, mid);
      const secondHalf = accessHistory.slice(mid);
      const firstRate = firstHalf.length / ((firstHalf[firstHalf.length - 1] - firstHalf[0]) || 1);
      const secondRate = secondHalf.length / ((secondHalf[secondHalf.length - 1] - secondHalf[0]) || 1);
      if (secondRate > firstRate * 1.2) trend = 'increasing';
      else if (secondRate < firstRate * 0.8) trend = 'declining';
    }

    // Hotness: fraction of accesses in the last half-life window.
    const now = Date.now();
    const halfLife = this.decayHalfLife;
    const windowStart = now - halfLife;
    const recentCount = accessHistory.filter((t) => t >= windowStart).length;
    const hotness = totalAccesses === 0 ? 0 : recentCount / totalAccesses;

    return {
      memoryId,
      totalAccesses,
      avgIntervalMs,
      lastAccessed,
      trend,
      hotness,
    };
  }
}

module.exports = { AgenticMemoryEngine };
