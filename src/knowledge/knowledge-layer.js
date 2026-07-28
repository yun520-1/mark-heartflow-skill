/**
 * src/knowledge/knowledge-layer.js
 *
 * Independent Knowledge Layer — arXiv:2604.11364
 * Separates structured knowledge from session memory (src/memory/).
 *
 * KnowledgeLayer provides a domain-partitioned fact store that is
 * semantically distinct from episodic/conversation memory. Facts are
 * stored with domain scoping, source tracking, and a recency bonus for
 * queries.
 *
 * Architecture principle:
 *   memory/  = ephemeral, experience-driven, session-bound
 *   knowledge/ = persistent, propositional, domain-structured
 */

const crypto = require('crypto');

class KnowledgeLayer {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxFactsPerDomain=5000]  Soft cap per domain
   * @param {boolean} [options.enableSourceTracking=true]
   */
  constructor(options = {}) {
    this._domains = {};        // { domainName: { facts: Map<factId, Fact>, metadata: {...} } }
    this._maxFactsPerDomain = options.maxFactsPerDomain || 5000;
    this._enableSourceTracking = options.enableSourceTracking !== false;
    this._createdAt = Date.now();
  }

  /**
   * Store a piece of knowledge under a domain.
   *
   * @param {string} domain   Domain namespace (e.g. "mathematics", "psychology", "physics")
   * @param {Object|string} fact  Fact to store. Strings are converted to { value }.
   * @param {Object} [options]
   * @param {string} [options.source]      Origin of the fact (URL, paper ref, etc.)
   * @param {number} [options.confidence]  0-1 confidence score
   * @returns {{ id: string, domain: string }}  Stored fact descriptor
   */
  store(domain, fact, options = {}) {
    if (typeof domain !== 'string' || !domain.trim()) {
      throw new Error('KnowledgeLayer.store: domain must be a non-empty string');
    }
    if (fact === null || fact === undefined) {
      throw new Error('KnowledgeLayer.store: fact cannot be null/undefined');
    }

    // Normalise fact to object
    const factObj = typeof fact === 'string' ? { value: fact } : fact;

    const id = this._generateId(domain, factObj);

    // Lazy-create domain if needed
    if (!this._domains[domain]) {
      this._domains[domain] = {
        facts: new Map(),
        metadata: {
          created: Date.now(),
          factCount: 0,
        },
      };
    }

    const domainStore = this._domains[domain];

    // Enforce soft cap — evict oldest fact when exceeded
    if (domainStore.facts.size >= this._maxFactsPerDomain) {
      const oldestKey = domainStore.facts.keys().next().value;
      domainStore.facts.delete(oldestKey);
    }

    const entry = {
      id,
      domain,
      fact: factObj,
      source: options.source || null,
      confidence: typeof options.confidence === 'number'
        ? Math.max(0, Math.min(1, options.confidence))
        : 0.5,
      storedAt: Date.now(),
    };

    domainStore.facts.set(id, entry);
    domainStore.metadata.factCount = domainStore.facts.size;
    domainStore.metadata.updated = Date.now();

    return { id, domain };
  }

  /**
   * Query knowledge within a specific domain.
   *
   * Performs simple keyword / substring matching with a recency bonus.
   * Returns a ranked array of fact entries.
   *
   * @param {string} domain    Domain to search within
   * @param {string} question  Question or search terms
   * @param {Object} [options]
   * @param {number} [options.limit=10]          Max results to return
   * @param {number} [options.minConfidence=0]   Minimum confidence threshold
   * @returns {Array<{ id, domain, fact, source, confidence, storedAt, score }>}
   */
  query(domain, question, options = {}) {
    if (!this._domains[domain]) {
      return [];
    }

    const limit = options.limit || 10;
    const minConfidence = options.minConfidence || 0;
    const domainStore = this._domains[domain];
    const now = Date.now();

    // Tokenise query into lowercase terms
    const terms = String(question || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) {
      // No query terms: return most recent facts
      const results = [];
      for (const entry of domainStore.facts.values()) {
        if (entry.confidence < minConfidence) continue;
        results.push({
          ...entry,
          score: (now - entry.storedAt) / 1000, // recency in seconds
        });
      }
      results.sort((a, b) => b.score - a.score);
      return results.slice(0, limit);
    }

    // Score each fact by term overlap + recency bonus
    const scored = [];
    for (const entry of domainStore.facts.values()) {
      if (entry.confidence < minConfidence) continue;

      const factText = JSON.stringify(entry.fact).toLowerCase();
      let matchCount = 0;
      for (const term of terms) {
        if (factText.includes(term)) matchCount++;
      }

      if (matchCount === 0) continue;

      const recencyBonus = (now - entry.storedAt) / 1000; // seconds since store
      const score = (matchCount / terms.length) * entry.confidence * 10
        + Math.min(recencyBonus / 86400, 5);     // up to +5 recency (5 days)

      scored.push({ ...entry, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * List all registered domain names.
   *
   * @returns {string[]}  Sorted array of domain names
   */
  getDomains() {
    return Object.keys(this._domains).sort();
  }

  /**
   * Get a single fact by id in a domain.
   *
   * @param {string} domain
   * @param {string} id
   * @returns {Object|null}
   */
  getFact(domain, id) {
    const domainStore = this._domains[domain];
    if (!domainStore) return null;
    return domainStore.facts.get(id) || null;
  }

  /**
   * Remove a fact by id from a domain.
   *
   * @param {string} domain
   * @param {string} id
   * @returns {boolean} True if a fact was removed
   */
  removeFact(domain, id) {
    const domainStore = this._domains[domain];
    if (!domainStore) return false;
    const removed = domainStore.facts.delete(id);
    if (removed) {
      domainStore.metadata.factCount = domainStore.facts.size;
      domainStore.metadata.updated = Date.now();
    }
    return removed;
  }

  /**
   * Get stats about the knowledge layer.
   *
   * @returns {{ domainCount: number, totalFacts: number, createdAt: number, domains: Object }}
   */
  getStats() {
    const domains = {};
    for (const [name, store] of Object.entries(this._domains)) {
      domains[name] = { ...store.metadata };
    }
    return {
      domainCount: this.getDomains().length,
      totalFacts: Object.values(this._domains).reduce(
        (sum, s) => sum + s.facts.size, 0
      ),
      createdAt: this._createdAt,
      maxFactsPerDomain: this._maxFactsPerDomain,
      domains,
    };
  }

  /**
   * Clear all stored knowledge.
   */
  clear() {
    this._domains = {};
  }

  /* ---- internal ---- */

  _generateId(domain, factObj) {
    const hash = crypto.createHash('sha256');
    hash.update(domain);
    hash.update(JSON.stringify(factObj));
    return hash.digest('hex').slice(0, 16);
  }
}

module.exports = { KnowledgeLayer };
