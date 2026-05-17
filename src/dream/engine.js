/**
 * DreamEngine — Memory consolidation during "sleep" cycles
 * 
 * Like biological sleep, the dream engine:
 * 1. Consolidates frequently-accessed EPHEMERAL → LEARNED
 * 2. Prunes forgotten or irrelevant memories
 * 3. Generates insight synthesis from recent experiences
 * 
 * v0.16: Simple but functional.
 */

class DreamEngine {
  constructor(memory, psychology) {
    this.memory = memory;
    this.psychology = psychology;
  }

  /**
   * Run a dream consolidation cycle.
   * 
   * @param {object} options
   * @param {boolean} options.consolidate - Run EPHEMERAL→LEARNED consolidation
   * @param {boolean} options.prune - Remove stale memories
   * @param {boolean} options.synthesize - Generate insight summary
   * @returns {object} Dream results
   */
  dream({ consolidate = true, prune = true, synthesize = true } = {}) {
    const results = {};
    const startTime = Date.now();

    // 1. Consolidate ephemeral memories
    if (consolidate) {
      results.consolidation = this.memory.consolidate();
    }

    // 2. Prune low-value memories
    if (prune) {
      results.pruning = this._prune();
    }

    // 3. Synthesize insights
    if (synthesize) {
      results.synthesis = this._synthesize();
    }

    results.duration_ms = Date.now() - startTime;
    results.dream_complete = true;

    return results;
  }

  _prune() {
    const pruned = [];
    const now = Date.now();
    const PRUNE_THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Prune learned memories not accessed in 7 days
    for (const [key, entry] of Object.entries(this.memory.learned)) {
      const lastAccessed = entry.lastAccessed || entry.createdAt;
      if (now - lastAccessed > PRUNE_THRESHOLD) {
        // Keep CORE-tier
        if (entry.tags && entry.tags.includes('core')) continue;
        this.memory.forget(key);
        pruned.push(key);
      }
    }

    return { pruned_count: pruned.length, pruned_keys: pruned.slice(0, 10) };
  }

  _synthesize() {
    // Generate a brief summary of recent significant experiences
    const recentLearned = this.memory.listLearned()
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, 5);

    if (recentLearned.length === 0) {
      return { insight: 'No significant patterns to synthesize.', topics: [] };
    }

    const topics = recentLearned.map(l => l.key).filter(Boolean);
    
    // Very simple synthesis: just report the topics
    return {
      insight: `Recent focus areas: ${topics.join(', ')}.`,
      topics,
      summary_length: topics.length,
    };
  }

  /**
   * Quick dream: just consolidate.
   */
  dreamNow() {
    return this.dream({ consolidate: true, prune: false, synthesize: false });
  }
}

module.exports = { DreamEngine };
