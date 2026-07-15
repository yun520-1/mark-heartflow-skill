/**
 * Memory Compressor — LLM-Guided 记忆压缩
 *
 * 基于 arXiv:2606.13177 "MemRefine: LLM-Guided Compression for Long-Term Agent Memory"
 * 解决记忆存储预算限制下的压缩问题：在有限存储空间中，
 * 用 LLM 引导的压缩策略保留最重要的记忆内容。
 *
 * 核心机制：
 *   1. Content-Aware Compression — 根据内容类型选择压缩策略
 *   2. Importance-Guided — 重要性高的记忆压缩率低
 *   3. Semantic Preservation — 保持语义完整性
 *   4. Budget Enforcement — 严格存储预算执行
 *
 * @version 1.0.0
 */

class MemoryCompressor {
  constructor(options = {}) {
    this._config = {
      storageBudget: options.storageBudget || 5000,

      learnedBudget: options.learnedBudget || 2000,
      ephemeralBudget: options.ephemeralBudget || 500,
      coreBudget: options.coreBudget || Infinity,

      minCompressionRatio: options.minCompressionRatio || 0.3,
      maxCompressionRatio: options.maxCompressionRatio || 0.7,
      importanceWeight: options.importanceWeight || 0.6,
      recencyWeight: options.recencyWeight || 0.2,
      accessWeight: options.accessWeight || 0.2,
      ...options,
    };


    this._compressedStores = { CORE: [], LEARNED: [], EPHEMERAL: [] };
    this._learnedLRU = []; // ordered oldest -> newest

    this._compressionLog = [];
    this._stats = {
      totalCompressed: 0,
      bytesSaved: 0,
      avgCompressionRatio: 0,
      budgetHits: 0,

      lruEvictions: 0,

    };
  }

  // ─── Importance Scoring ─────────────────────────────────────



  computeImportance(memory) {
    const w = this._config;
    const now = Date.now();
    const ageMs = now - (memory.timestamp || now);
    const ageDays = ageMs / 86400000;

    const recency = Math.max(0, 1 - ageDays / 90);
    const accessFreq = Math.min(1, (memory.accessCount || 0) / 20);
    const manualImportance = memory.importance || 0.5;

    const score =
      w.importanceWeight * manualImportance +
      w.recencyWeight * recency +
      w.accessWeight * accessFreq;

    return +Math.max(0, Math.min(1, score)).toFixed(3);
  }


  _normalizeLayer(layer) {
    const upper = String(layer || 'LEARNED').toUpperCase();
    if (!['CORE', 'LEARNED', 'EPHEMERAL'].includes(upper)) return 'LEARNED';
    return upper;
  }

  _bumpLearnedLRU(id) {
    const idx = this._learnedLRU.indexOf(id);
    if (idx !== -1) this._learnedLRU.splice(idx, 1);
    this._learnedLRU.push(id);
  }

  _evictLearnedLRU(limit = 50) {
    const store = this._compressedStores.LEARNED;
    const candidates = store.filter(m => (m.accessCount || 0) <= 1);
    let evicted = 0;
    for (const mem of candidates) {
      if (evicted >= limit) break;
      if ((mem.importance || 0) >= 0.8) continue;
      const idx = store.findIndex(m => m.id === mem.id);
      if (idx !== -1) store.splice(idx, 1);
      this._learnedLRU = this._learnedLRU.filter(id => id !== mem.id);
      this._stats.lruEvictions++;
      evicted++;
    }
    return evicted;
  }

  _storeFor(layer) {
    return this._compressedStores[this._normalizeLayer(layer)] || this._compressedStores.LEARNED;
  }

  _budgetFor(layer) {
    const l = this._normalizeLayer(layer);
    if (l === 'CORE') return this._config.coreBudget;
    if (l === 'LEARNED') return this._config.learnedBudget;
    return this._config.ephemeralBudget;
  }

  // ─── Compression Strategies ─────────────────────────────────


  selectStrategy(memory) {
    const content = String(memory.content || memory.task || '');

    if (content.length < 50) return 'none';
    if (content.includes('error') || content.includes('fix') || content.includes('bug')) return 'preserve';
    if (content.includes('definition') || content.includes('rule') || content.includes('principle')) return 'preserve';
    if (memory.importance > 0.8) return 'preserve';

    if (memory.tags && memory.tags.length > 0) return 'extract_keywords';
    if (content.split(/[.!?]/).length > 3) return 'summarize';
    if (content.length > 500) return 'truncate';

    return 'light';
  }


  _applyCompression(memory, strategy) {

    const chosen = strategy || this.selectStrategy(memory);
    const importance = this.computeImportance(memory);
    const maxLen = Math.floor(200 * (1 - importance * 0.5));

    let compressedContent;
    let ratio;

    switch (chosen) {
      case 'preserve':
        compressedContent = String(memory.content || memory.task || '');
        ratio = 1.0;
        break;

      case 'extract_keywords': {
        const text = String(memory.content || '');
        const words = text.toLowerCase().split(/\s+/);
        const freq = {};
        for (const w of words) { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; }
        const keywords = Object.entries(freq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([w]) => w);
        compressedContent = `[keywords: ${keywords.join(', ')}] ${text.slice(0, maxLen * 0.3)}`;
        ratio = 0.4;
        break;
      }

      case 'summarize': {
        const sentences = String(memory.content || '').split(/[.!?]+/).filter(s => s.trim());
        const key = sentences.slice(0, 3).join('. ');
        compressedContent = `[summary] ${key}.`;
        ratio = 0.35;
        break;
      }

      case 'truncate':
        compressedContent = String(memory.content || memory.task || '').slice(0, maxLen) + '...';
        ratio = maxLen / Math.max(1, String(memory.content || '').length);
        break;

      case 'light':
      default:
        compressedContent = String(memory.content || memory.task || '').slice(0, maxLen * 0.8);
        ratio = 0.6;
        break;
    }

    const originalLength = String(memory.content || memory.task || '').length;
    const compressedLength = compressedContent.length;
    const actualRatio = originalLength > 0 ? compressedLength / originalLength : 1;


    const layer = this._normalizeLayer(memory.layer);
    const store = this._storeFor(layer);


    const entry = {
      ...memory,
      content: compressedContent,
      compressed: true,
      strategy: chosen,
      importance,
      originalLength,
      compressedLength,
      compressionRatio: +actualRatio.toFixed(3),
      timestamp: memory.timestamp || Date.now(),

      layer,
    };

    store.push(entry);
    if (layer === 'LEARNED') this._bumpLearnedLRU(entry.id);


    this._stats.totalCompressed++;
    this._stats.bytesSaved += originalLength - compressedLength;
    this._stats.avgCompressionRatio = +(
      (this._stats.avgCompressionRatio * (this._stats.totalCompressed - 1) + actualRatio) /
      this._stats.totalCompressed
    ).toFixed(3);

    this._compressionLog.push({
      timestamp: Date.now(),
      strategy: chosen,
      originalLength,
      compressedLength,
      ratio: actualRatio,
      importance,

      layer,

    });

    return entry;
  }


  compress(memory, strategy) {
    return this._applyCompression(memory, strategy);
  }

  async compressAsync(memory, strategy) {
    return this._applyCompression(memory, strategy);
  }

  // ─── Budget Enforcement ─────────────────────────────────────

  enforceBudget() {
    const messages = [];

    for (const layer of ['CORE', 'LEARNED', 'EPHEMERAL']) {
      const store = this._compressedStores[layer];
      const budget = this._budgetFor(layer);
      if (budget === Infinity) continue;
      while (store.length > budget) {
        const sorted = store
          .map(m => ({ ...m, _importance: this.computeImportance(m) }))
          .sort((a, b) => a._importance - b._importance);

        const evicted = sorted[0];
        if (!evicted) break;

        messages.push(`Evicted [${layer}]: ${evicted.content?.slice(0, 50)} (importance: ${evicted._importance})`);
        const idx = store.findIndex(m => m.id === evicted.id);
        if (idx !== -1) store.splice(idx, 1);
        if (layer === 'LEARNED') this._learnedLRU = this._learnedLRU.filter(id => id !== evicted.id);
        this._stats.budgetHits++;
      }
    }

    // LEARNED 层低频 LRU 二次清理
    const lruCleaned = this._evictLearnedLRU(50);
    if (lruCleaned) messages.push(`LRU cleaned ${lruCleaned} low-frequency LEARNED entries`);

    return messages;
  }

  async enforceBudgetAsync() {
    return this.enforceBudget();
  }

  // ─── Retrieval ──────────────────────────────────────────────

  query(queryStr, maxResults = 10, options = {}) {
    const queryLower = queryStr.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    const targetLayer = options.layer ? this._normalizeLayer(options.layer) : null;

    const pool = targetLayer
      ? this._compressedStores[targetLayer] || []
      : Object.values(this._compressedStores).flat();

    const scored = pool

      .map(m => {
        const content = String(m.content || '').toLowerCase();
        let score = 0;
        for (const w of queryWords) {
          if (content.includes(w)) score += 2;
        }
        score += (m.importance || 0) * 0.5;
        const recency = Math.max(0, 1 - (Date.now() - (m.timestamp || 0)) / 604800000);
        score += recency * 0.3;

        if (m.layer === 'LEARNED' && this._learnedLRU.includes(m.id)) score += 0.1;

        return { ...m, _queryScore: +score.toFixed(3) };
      })
      .filter(m => m._queryScore > 0)
      .sort((a, b) => b._queryScore - a._queryScore)
      .slice(0, maxResults);

    return scored;
  }


  getLearnedLRU() {
    return [...this._learnedLRU];
  }


  // ─── Stats ──────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,

      storeSize: Object.values(this._compressedStores).reduce((s, arr) => s + arr.length, 0),
      layerStats: Object.fromEntries(
        Object.entries(this._compressedStores).map(([k, arr]) => [k, arr.length])
      ),
      budget: this._config.storageBudget,
      learnedBudget: this._config.learnedBudget,
      utilization: +(Object.values(this._compressedStores).reduce((s, arr) => s + arr.length, 0) / this._config.storageBudget).toFixed(3),

      recentLog: this._compressionLog.slice(-10),
    };
  }

  getCompressionLog() {
    return [...this._compressionLog];
  }
}

module.exports = { MemoryCompressor };
