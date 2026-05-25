/**
 * Dream Consolidation Module v1.0.0
 * 来源: v1.0.0 dream.js
 * 整合: v1.1.9
 * 简洁版睡眠整合引擎 (consolidate + prune + synthesize)
 * 与 src/core/dream.js (DAG版) 共存，提供简单API
 */

class DreamConsolidation {
  constructor(memory) {
    this.memory = memory;
    this.lastDream = null;
  }

  /**
   * Run a full dream consolidation cycle
   */
  dream({ consolidate = true, prune = true, synthesize = true } = {}) {
    const results = {};
    const startTime = Date.now();
    if (consolidate && this.memory.consolidate) results.consolidation = this.memory.consolidate();
    if (prune) results.pruning = this._prune();
    if (synthesize) results.synthesis = this._synthesize();
    results.duration_ms = Date.now() - startTime;
    results.dream_complete = true;
    this.lastDream = results;
    return results;
  }

  /**
   * Quick dream: just consolidate
   */
  dreamNow() {
    return this.dream({ consolidate: true, prune: false, synthesize: false });
  }

  /**
   * Prune learned memories not accessed in 7 days
   * PROTECTS: entries tagged 'core', 'identity', 'consolidated'
   */
  _prune() {
    const pruned = [];
    const now = Date.now();
    const THRESHOLD = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (!this.memory.listLearned) return { pruned_count: 0, pruned_keys: [] };
    const learned = this.memory.listLearned();
    for (const entry of learned) {
      const lastAccessed = entry.lastAccessed || entry.createdAt || now;
      const age = now - lastAccessed;
      if (age < THRESHOLD) continue;
      const tags = entry.tags || [];
      if (tags.includes('core') || tags.includes('identity') || tags.includes('consolidated')) continue;
      if (this.memory.forget) this.memory.forget(entry.key);
      pruned.push(entry.key);
    }
    return { pruned_count: pruned.length, pruned_keys: pruned.slice(0, 10) };
  }

  /**
   * Synthesize brief summary of recent significant experiences
   */
  _synthesize() {
    if (!this.memory.listLearned) return { insight: 'No memory system available.', topics: [] };
    const recentLearned = this.memory.listLearned()
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, 5);
    if (recentLearned.length === 0) return { insight: 'No significant patterns to synthesize.', topics: [] };
    const topics = recentLearned.map(l => l.key).filter(Boolean);
    const themes = this._extractThemes(recentLearned);
    const insight = themes.length > 0
      ? `Recent focus areas show recurring themes: ${themes.join(', ')}.`
      : `Recent focus areas: ${topics.join(', ')}.`;
    return { insight, topics, themes, summary_length: topics.length };
  }

  _extractThemes(entries) {
    const themes = new Set();
    for (const entry of entries) {
      const lower = String(entry.key).toLowerCase();
      const value = String(entry.value || '').toLowerCase();
      if (lower.includes('error') || lower.includes('bug') || value.includes('error')) themes.add('problem-solving');
      if (lower.includes('learn') || lower.includes('lesson') || value.includes('learn')) themes.add('learning');
      if (lower.includes('emotion') || lower.includes('feel') || value.includes('情感')) themes.add('emotional-processing');
      if (lower.includes('build') || lower.includes('create')) themes.add('creation');
      if (lower.includes('fix') || lower.includes('resolve')) themes.add('resolution');
    }
    return [...themes];
  }

  getLastDream() {
    return this.lastDream || { status: 'no_dreams_yet' };
  }
}

module.exports = { DreamConsolidation };
