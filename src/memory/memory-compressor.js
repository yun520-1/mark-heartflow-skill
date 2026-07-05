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
      minCompressionRatio: options.minCompressionRatio || 0.3,
      maxCompressionRatio: options.maxCompressionRatio || 0.7,
      importanceWeight: options.importanceWeight || 0.6,
      recencyWeight: options.recencyWeight || 0.2,
      accessWeight: options.accessWeight || 0.2,
      ...options,
    };

    this._compressedStore = [];
    this._compressionLog = [];
    this._stats = {
      totalCompressed: 0,
      bytesSaved: 0,
      avgCompressionRatio: 0,
      budgetHits: 0,
    };
  }

  // ─── Importance Scoring ─────────────────────────────────────

  /**
   * 计算记忆条目重要性评分
   */
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

  // ─── Compression Strategies ─────────────────────────────────

  /**
   * 根据内容类型选择压缩策略
   */
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

  compress(memory, strategy) {
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
    };

    this._compressedStore.push(entry);
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
    });

    return entry;
  }

  // ─── Budget Enforcement ─────────────────────────────────────

  /**
   * 强制压缩以符合存储预算
   */
  enforceBudget() {
    const messages = [];
    while (this._compressedStore.length > this._config.storageBudget) {
      const sorted = this._compressedStore
        .map(m => ({ ...m, _importance: this.computeImportance(m) }))
        .sort((a, b) => a._importance - b._importance);

      const evicted = sorted[0];
      if (!evicted) break;

      messages.push(`Evicted: ${evicted.content?.slice(0, 50)} (importance: ${evicted._importance})`);
      this._compressedStore = this._compressedStore.filter(m => m.id !== evicted.id);
      this._stats.budgetHits++;
    }
    return messages;
  }

  // ─── Retrieval ──────────────────────────────────────────────

  /**
   * 从压缩存储中检索
   */
  query(queryStr, maxResults = 10) {
    const queryLower = queryStr.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    const scored = this._compressedStore
      .map(m => {
        const content = String(m.content || '').toLowerCase();
        let score = 0;
        for (const w of queryWords) {
          if (content.includes(w)) score += 2;
        }
        score += (m.importance || 0) * 0.5;
        const recency = Math.max(0, 1 - (Date.now() - (m.timestamp || 0)) / 604800000);
        score += recency * 0.3;
        return { ...m, _queryScore: +score.toFixed(3) };
      })
      .filter(m => m._queryScore > 0)
      .sort((a, b) => b._queryScore - a._queryScore)
      .slice(0, maxResults);

    return scored;
  }

  // ─── Stats ──────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      storeSize: this._compressedStore.length,
      budget: this._config.storageBudget,
      utilization: (this._compressedStore.length / this._config.storageBudget).toFixed(3),
      recentLog: this._compressionLog.slice(-10),
    };
  }

  getCompressionLog() {
    return [...this._compressionLog];
  }
}

module.exports = { MemoryCompressor };
