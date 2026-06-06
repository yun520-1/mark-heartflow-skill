/**
 * RetrievalAnchor — Context-Augmented Reasoning
 * 
 * v1.0.2: Uses relevant documents/memories as anchors for reasoning.
 * Based on LLM Cognitive Architecture paper (2025).
 * 
 * Features:
 *   - Keyword-based relevance scoring
 *   - recency, reliability tracking
 *   - Anchor selection for context augmentation
 */

const crypto = require('crypto');

class RetrievalAnchor {
  constructor() {
    this.anchors = new Map();
  }

  /**
   * Compute relevance score between query and content
   * Simple keyword overlap scoring
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
   */
  addAnchor(content, source = 'unknown', relevance = 0.8) {
    const anchor = {
      id: `anchor-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      content,
      source,
      relevance,
      recency: 1.0,
      reliability: 0.8,
      usedInReasoning: false,
      createdAt: Date.now(),
    };
    this.anchors.set(anchor.id, anchor);
    return anchor;
  }

  /**
   * Query anchors by relevance
   */
  query(query, options = {}) {
    const {
      maxAnchors = 5,
      minRelevance = 0.3,
      preferRecent = false,
    } = options;

    const results = [];

    for (const anchor of this.anchors.values()) {
      const relevance = this._computeRelevance(query, anchor.content);
      if (relevance >= minRelevance) {
        results.push({ ...anchor, relevance });
      }
    }

    results.sort((a, b) => {
      const relevanceDiff = b.relevance - a.relevance;
      if (preferRecent && Math.abs(relevanceDiff) < 0.1) {
        return b.createdAt - a.createdAt;
      }
      return relevanceDiff;
    });

    return results.slice(0, maxAnchors);
  }

  /**
   * Select the single best anchor for a query
   */
  selectAnchor(query) {
    const results = this.query(query, { maxAnchors: 1, minRelevance: 0.4 });
    return results[0] ?? null;
  }

  /**
   * Mark an anchor as used in reasoning
   */
  markUsed(anchorId) {
    const anchor = this.anchors.get(anchorId);
    if (anchor) {
      anchor.usedInReasoning = true;
    }
  }

  /**
   * Get anchor statistics
   */
  getStats() {
    let used = 0;
    let unused = 0;

    for (const anchor of this.anchors.values()) {
      if (anchor.usedInReasoning) used++;
      else unused++;
    }

    return {
      total: this.anchors.size,
      used,
      unused,
    };
  }
}

module.exports = { RetrievalAnchor };
