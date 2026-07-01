/**
 * RetrievalAnchor — Context-Augmented Reasoning
 * 
 * v1.1.0: Upgraded with composite relevance scoring, decay mechanism,
 * eviction policy, anchor deduplication, and retrieval confidence.
 * 
 * Based on LLM Cognitive Architecture paper (2025).
 * 
 * Features:
 *   - Composite scoring: keyword overlap + recency boost + reliability weighting
 *   - Temporal decay: anchors cool over time, preventing stale dominance
 *   - Adaptive eviction: LRU + age-based pruning when capacity exceeded
 *   - Anchor deduplication: near-duplicate content merged automatically
 *   - Retrieval confidence: returns certainty measure per result
 *   - recency, reliability tracking
 *   - Anchor selection for context augmentation
 */

const crypto = require('crypto');

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CAPACITY = 1000;
const DECAY_HALF_LIFE_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CONTENT_SIMILARITY_FOR_DEDUP = 0.85;
const DEDUP_HASH_LENGTH = 8;

// ============================================================================
// Internal utilities
// ============================================================================

/**
 * Compute a fuzzy content fingerprint for deduplication
 * Uses first 32 chars and length as a fast signature
 * @private
 */
function _contentFingerprint(content) {
  const cleaned = content.toLowerCase().replace(/\s+/g, ' ').trim();
  const head = cleaned.slice(0, 32);
  return crypto.createHash('md5').update(head + '|' + cleaned.length).digest('hex').slice(0, DEDUP_HASH_LENGTH);
}

/**
 * Compute Jaccard similarity between two strings (word-level)
 * @private
 */
function _jaccardSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 && wordsB.size === 0) return 1.0;
  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0.0;
}

/**
 * Compute inverse document frequency weight for query terms
 * based on current anchor corpus
 * @private
 */
function _computeIDFWeights(anchorTexts, queryWords) {
  const n = anchorTexts.length;
  if (n === 0) return {};

  const weights = {};
  for (const word of queryWords) {
    let docCount = 0;
    for (const text of anchorTexts) {
      if (text.toLowerCase().includes(word)) docCount++;
    }
    // IDF = log((N + 1) / (df + 1)) + 1
    weights[word] = Math.log((n + 1) / (docCount + 1)) + 1;
  }
  return weights;
}

// ============================================================================
// RetrievalAnchor class
// ============================================================================

class RetrievalAnchor {
  /**
   * @param {object} [options]
   * @param {number} [options.capacity=1000] - Max anchors before eviction
   * @param {number} [options.decayHalfLifeMs=1800000] - Half-life for recency decay
   */
  constructor(options = {}) {
    this.anchors = new Map();
    this._capacity = options.capacity || DEFAULT_CAPACITY;
    this._decayHalfLife = options.decayHalfLifeMs || DECAY_HALF_LIFE_MS;
    this._fingerprintIndex = new Map(); // fingerprint -> anchorId
  }

  /**
   * Compute composite relevance score between query and anchor
   * Combines keyword overlap, recency, and reliability
   * @private
   */
  _computeCompositeScore(query, anchor, idfWeights) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return 0.5;

    const contentLower = anchor.content.toLowerCase();

    // 1) Keyword overlap score (weighted by IDF if available)
    let weightedSum = 0;
    let weightTotal = 0;
    for (const word of queryWords) {
      const weight = idfWeights[word] || 1.0;
      weightTotal += weight;
      if (contentLower.includes(word)) {
        weightedSum += weight;
      }
    }
    const keywordScore = weightTotal > 0 ? weightedSum / weightTotal : 0;

    // 2) Jaccard similarity bonus (catch partial matches)
    const jaccard = _jaccardSimilarity(query, anchor.content);

    // 3) Recency boost — exponential decay
    const ageMs = Date.now() - anchor.createdAt;
    const recencyBoost = Math.exp(-Math.LN2 * ageMs / this._decayHalfLife);

    // 4) Reliability as base multiplier
    const reliabilityFactor = anchor.reliability || 0.8;

    // Composite: weighted combination
    const score = (
      keywordScore * 0.50 +
      jaccard * 0.20 +
      recencyBoost * 0.20 +
      reliabilityFactor * 0.10
    );

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Compute relevance score between query and content (legacy simple scoring)
   * Used as fallback when anchor reliability data is absent
   * @param {string} query - Query text
   * @param {string} content - Anchor content text
   * @returns {number} Score 0-1
   */
  _computeRelevance(query, content) {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const contentLower = content.toLowerCase();

    if (queryWords.length === 0) return 0.5;

    let matches = 0;
    for (const word of queryWords) {
      if (contentLower.includes(word)) matches++;
    }
    return matches / queryWords.length;
  }

  /**
   * Add an anchor for later retrieval
   * Automatically deduplicates near-identical content
   * @param {string} content - Anchor content text
   * @param {string} [source='unknown'] - Source identifier
   * @param {number} [relevance=0.8] - Base relevance score
   * @returns {object} The created or merged anchor
   */
  addAnchor(content, source = 'unknown', relevance = 0.8) {
    // Deduplication check
    const fingerprint = _contentFingerprint(content);
    if (this._fingerprintIndex.has(fingerprint)) {
      // Near-duplicate found — merge: update recency, boost reliability
      const existingId = this._fingerprintIndex.get(fingerprint);
      const existing = this.anchors.get(existingId);
      if (existing) {
        existing.createdAt = Date.now();
        existing.relevance = Math.max(existing.relevance, relevance);
        existing.reliability = Math.min(1.0, existing.reliability + 0.05);
        existing.source = existing.source + ',' + source;
        existing.mergeCount = (existing.mergeCount || 1) + 1;
        return existing;
      }
    }

    // Check for Jaccard-similar content (catch near-duplicates that hash differently)
    for (const [id, existing] of this.anchors) {
      if (_jaccardSimilarity(content, existing.content) >= MAX_CONTENT_SIMILARITY_FOR_DEDUP) {
        existing.createdAt = Date.now();
        existing.relevance = Math.max(existing.relevance, relevance);
        existing.reliability = Math.min(1.0, existing.reliability + 0.03);
        existing.mergeCount = (existing.mergeCount || 1) + 1;
        // Update fingerprint index
        this._fingerprintIndex.set(fingerprint, id);
        return existing;
      }
    }

    // Eviction if at capacity
    if (this.anchors.size >= this._capacity) {
      this._evictOne();
    }

    const anchor = {
      id: `anchor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      content,
      source,
      relevance,
      recency: 1.0,
      reliability: 0.8,
      usedInReasoning: false,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      mergeCount: 1,
    };
    this.anchors.set(anchor.id, anchor);
    this._fingerprintIndex.set(fingerprint, anchor.id);
    return anchor;
  }

  /**
   * Evict the single least useful anchor (LRU + age combined)
   * @private
   */
  _evictOne() {
    let worstId = null;
    let worstScore = Infinity;

    for (const [id, anchor] of this.anchors) {
      const ageScore = Date.now() - anchor.createdAt;
      const accessScore = (anchor.accessCount || 0) + 1;
      const evictionScore = ageScore / accessScore;

      if (evictionScore > worstScore) {
        worstScore = evictionScore;
        worstId = id;
      }
    }

    if (worstId) {
      // Clean fingerprint index
      const removed = this.anchors.get(worstId);
      if (removed) {
        const fp = _contentFingerprint(removed.content);
        if (this._fingerprintIndex.get(fp) === worstId) {
          this._fingerprintIndex.delete(fp);
        }
      }
      this.anchors.delete(worstId);
    }
  }

  /**
   * Query anchors by composite relevance score
   * @param {string} query - Search query
   * @param {object} [options]
   * @param {number} [options.maxAnchors=5] - Max results
   * @param {number} [options.minRelevance=0.3] - Minimum relevance threshold
   * @param {boolean} [options.preferRecent=false] - Boost recency in tie-breaking
   * @param {number} [options.confidenceThreshold=0] - Minimum confidence to include
   * @returns {object[]} Anchors with scores, each having .relevance and .confidence
   */
  query(query, options = {}) {
    const {
      maxAnchors = 5,
      minRelevance = 0.3,
      preferRecent = false,
      confidenceThreshold = 0,
    } = options;

    if (this.anchors.size === 0) return [];

    // Precompute IDF weights from all anchor texts
    const allTexts = Array.from(this.anchors.values()).map(a => a.content);
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const idfWeights = _computeIDFWeights(allTexts, queryWords);

    const results = [];

    for (const anchor of this.anchors.values()) {
      const compositeScore = this._computeCompositeScore(query, anchor, idfWeights);
      if (compositeScore >= minRelevance) {
        // Confidence: how many query terms were actually found
        let matchedTerms = 0;
        for (const w of queryWords) {
          if (anchor.content.toLowerCase().includes(w)) matchedTerms++;
        }
        const confidence = queryWords.length > 0
          ? Math.min(matchedTerms / queryWords.length + 0.2, 1.0)
          : 0.5;

        if (confidence >= confidenceThreshold) {
          results.push({
            ...anchor,
            relevance: compositeScore,
            confidence: Math.round(confidence * 100) / 100,
          });
        }
      }
    }

    // Sort by composite score (with optional recency tiebreaker)
    results.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (preferRecent && Math.abs(relevanceDiff) < 0.1) {
        return b.createdAt - a.createdAt;
      }
      return relevanceDiff;
    });

    // Take top results and update access stats
    const topResults = results.slice(0, maxAnchors);
    for (const r of topResults) {
      const anchor = this.anchors.get(r.id);
      if (anchor) {
        anchor.accessCount = (anchor.accessCount || 0) + 1;
        anchor.lastAccessedAt = Date.now();
      }
    }

    return topResults;
  }

  /**
   * Select the single best anchor for a query
   * @param {string} query - Search query
   * @returns {object|null} Best anchor or null
   */
  selectAnchor(query) {
    const results = this.query(query, { maxAnchors: 1, minRelevance: 0.4 });
    return results[0] ?? null;
  }

  /**
   * Mark an anchor as used in reasoning
   * @param {string} anchorId - Anchor ID
   */
  markUsed(anchorId) {
    const anchor = this.anchors.get(anchorId);
    if (anchor) {
      anchor.usedInReasoning = true;
    }
  }

  /**
   * Remove an anchor by ID
   * @param {string} anchorId - Anchor ID to remove
   * @returns {boolean} True if removed
   */
  removeAnchor(anchorId) {
    const anchor = this.anchors.get(anchorId);
    if (anchor) {
      const fp = _contentFingerprint(anchor.content);
      if (this._fingerprintIndex.get(fp) === anchorId) {
        this._fingerprintIndex.delete(fp);
      }
      return this.anchors.delete(anchorId);
    }
    return false;
  }

  /**
   * Evict stale anchors (not accessed beyond a threshold)
   * @param {number} [maxAgeMs=86400000] - Max age in ms (default 24h)
   * @returns {number} Number of evicted anchors
   */
  evictStale(maxAgeMs = 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() - maxAgeMs;
    const toRemove = [];
    for (const [id, anchor] of this.anchors) {
      if (anchor.createdAt < cutoff && (anchor.accessCount || 0) < 2) {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      const anchor = this.anchors.get(id);
      if (anchor) {
        const fp = _contentFingerprint(anchor.content);
        if (this._fingerprintIndex.get(fp) === id) {
          this._fingerprintIndex.delete(fp);
        }
      }
      this.anchors.delete(id);
    }
    return toRemove.length;
  }

  /**
   * Get anchor statistics
   * @returns {object} Stats object
   */
  getStats() {
    let used = 0;
    let unused = 0;
    let totalAccessCount = 0;
    let totalMerges = 0;
    let oldestTs = Infinity;
    let newestTs = 0;

    for (const anchor of this.anchors.values()) {
      if (anchor.usedInReasoning) used++;
      else unused++;
      totalAccessCount += anchor.accessCount || 0;
      totalMerges += (anchor.mergeCount || 1) - 1;
      if (anchor.createdAt < oldestTs) oldestTs = anchor.createdAt;
      if (anchor.createdAt > newestTs) newestTs = anchor.createdAt;
    }

    const utilizationRate = this.anchors.size > 0 ? used / this.anchors.size : 0;

    return {
      total: this.anchors.size,
      used,
      unused,
      capacity: this._capacity,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      totalAccessCount,
      totalMerges,
      ageRangeMs: oldestTs < Infinity ? newestTs - oldestTs : 0,
    };
  }

  /**
   * Clear all anchors
   */
  clear() {
    this.anchors.clear();
    this._fingerprintIndex.clear();
  }

  /**
   * Get an anchor by ID without affecting scoring
   * @param {string} anchorId
   * @returns {object|undefined}
   */
  getById(anchorId) {
    return this.anchors.get(anchorId);
  }
}

module.exports = { RetrievalAnchor };
