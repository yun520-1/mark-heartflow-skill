/**
 * Memory Write Controller — AdaMem 个性化记忆写入控制
 *
 * 基于 arXiv:2606.21144 "AdaMem: Learning What to Remember"
 * 解决记忆膨胀问题：不是记住一切，而是根据用户实际关心的内容
 * 进行写入控制，避免无关信息挤占有用记忆。
 *
 * 核心机制：
 *   1. Utility Scoring — 实用性评分（用户相关性/任务关联/新近度/访问频率）
 *   2. Write Control — 写入决策（accept/reject/compress/defer）
 *   3. Budget Management — 存储预算管理，超限时按优先级淘汰
 *   4. Personalization — 用户画像驱动写入偏好
 *
 * @version 1.0.0
 */

class MemoryWriteController {
  constructor(options = {}) {
    this._config = {
      storageBudget: options.storageBudget || 5000,
      utilityThreshold: options.utilityThreshold || 0.4,
      compressionRatio: options.compressionRatio || 0.5,
      userWeights: options.userWeights || {
        relevance: 0.35,
        recency: 0.20,
        frequency: 0.15,
        importance: 0.20,
        diversity: 0.10,
      },
      ...options,
    };

    this._userProfile = {
      topics: {},        // 用户关注的主题 → 权重
      interactions: [],  // 交互历史
      preferences: {},   // 写入偏好
    };

    this._memoryStore = [];
    this._writeDecisions = [];
    this._stats = {
      totalWrites: 0,
      accepted: 0,
      rejected: 0,
      compressed: 0,
      deferred: 0,
      budgetExceeded: 0,
    };
  }

  // ─── User Profile ───────────────────────────────────────────

  updateUserProfile(interaction) {
    const topics = this._extractTopics(interaction);
    const sentiment = this._estimateSentiment(interaction);

    for (const topic of topics) {
      this._userProfile.topics[topic] = (this._userProfile.topics[topic] || 0) + 1;
    }

    this._userProfile.interactions.push({
      timestamp: Date.now(),
      topics,
      sentiment,
      length: String(interaction).length,
    });

    if (this._userProfile.interactions.length > 500) {
      this._userProfile.interactions = this._userProfile.interactions.slice(-500);
    }
  }

  _extractTopics(text) {
    if (!text) return [];
    const s = String(text).toLowerCase();
    const words = s.split(/[^a-z0-9一-鿿]+/).filter(w => w.length > 2);
    const stopWords = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','has','have','this','that','with','from','they','been','said','each','which','their','would','about','could','other','into','more','some','what','when','make','like','time','just','know','take','people','into','year','your','good','some','could','them','than','then','only','look','also']);
    return [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);
  }

  _estimateSentiment(text) {
    if (!text) return 0;
    const s = String(text).toLowerCase();
    const positive = ['good','great','happy','love','thanks',' wonderful','excellent','helpful','like','appreciate','好的','谢谢','开心','喜欢','棒','有用'];
    const negative = ['bad','wrong','error','fail','hate','terrible','angry','frustrated','no','never','错了','不好','讨厌','没用','问题'];
    let score = 0;
    for (const p of positive) if (s.includes(p)) score += 1;
    for (const n of negative) if (s.includes(n)) score -= 1;
    return score;
  }

  getUserProfile() {
    const topTopics = Object.entries(this._userProfile.topics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([topic, count]) => ({ topic, count }));

    return {
      topTopics,
      totalInteractions: this._userProfile.interactions.length,
      avgSentiment: this._userProfile.interactions.length > 0
        ? (this._userProfile.interactions.reduce((s, i) => s + i.sentiment, 0) / this._userProfile.interactions.length).toFixed(2)
        : 0,
      preferences: this._userProfile.preferences,
    };
  }

  // ─── Utility Scoring ────────────────────────────────────────

  /**
   * 计算记忆条目的实用性评分
   * @param {Object} memory - 记忆条目 { content, timestamp, accessCount, source, tags }
   * @returns {number} 0-1 评分
   */
  computeUtility(memory) {
    const w = this._config.userWeights;
    const now = Date.now();
    const ageHours = (now - (memory.timestamp || now)) / 3600000;

    const relevance = this._computeRelevance(memory);
    const recency = Math.max(0, 1 - ageHours / 720);
    const frequency = Math.min(1, (memory.accessCount || 0) / 10);
    const importance = memory.importance || 0.5;
    const diversity = this._computeDiversity(memory);

    const score =
      w.relevance * relevance +
      w.recency * recency +
      w.frequency * frequency +
      w.importance * importance +
      w.diversity * diversity;

    return +score.toFixed(3);
  }

  _computeRelevance(memory) {
    const content = String(memory.content || memory.task || '').toLowerCase();
    const userTopics = Object.keys(this._userProfile.topics);
    if (userTopics.length === 0) return 0.5;

    let matchCount = 0;
    for (const topic of userTopics) {
      if (content.includes(topic)) matchCount++;
    }
    return Math.min(1, matchCount / Math.max(1, userTopics.length) * 3);
  }

  _computeDiversity(memory) {
    const content = String(memory.content || memory.task || '').slice(0, 100);
    const existing = this._memoryStore.map(m => String(m.content || m.task || '').slice(0, 100));
    const similar = existing.filter(e => this._similarity(e, content) > 0.7).length;
    return similar === 0 ? 1.0 : Math.max(0, 1 - similar * 0.3);
  }

  _similarity(a, b) {
    if (!a || !b) return 0;
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...setA].filter(x => setB.has(x));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.length / union.size;
  }

  // ─── Write Control ──────────────────────────────────────────

  /**
   * 决定是否写入记忆
   * @returns {string} 'accept' | 'reject' | 'compress' | 'defer'
   */
  decideWrite(memory) {
    this._stats.totalWrites++;

    const utility = this.computeUtility(memory);

    if (utility < this._config.utilityThreshold * 0.5) {
      this._stats.rejected++;
      this._writeDecisions.push({ action: 'reject', reason: 'low_utility', utility });
      return 'reject';
    }

    if (this._memoryStore.length >= this._config.storageBudget) {
      this._stats.budgetExceeded++;
      const lowest = this._memoryStore
        .map(m => ({ ...m, utility: this.computeUtility(m) }))
        .sort((a, b) => a.utility - b.utility);

      if (utility > (lowest[0]?.utility || 0)) {
        const evicted = lowest[0];
        this._memoryStore = this._memoryStore.filter(m => m.id !== evicted?.id);
        this._stats.accepted++;
        this._writeDecisions.push({ action: 'accept', reason: 'replaced_low_utility', utility });
        this._memoryStore.push({ ...memory, utility });
        return 'accept';
      } else {
        this._stats.rejected++;
        this._writeDecisions.push({ action: 'defer', reason: 'budget_full_low_utility', utility });
        return 'defer';
      }
    }

    if (utility < this._config.utilityThreshold) {
      this._stats.compressed++;
      this._writeDecisions.push({ action: 'compress', reason: 'medium_utility', utility });
      const compressed = this._compressMemory(memory);
      this._memoryStore.push(compressed);
      return 'compress';
    }

    this._stats.accepted++;
    this._writeDecisions.push({ action: 'accept', reason: 'high_utility', utility });
    this._memoryStore.push({ ...memory, utility });
    return 'accept';
  }

  _compressMemory(memory) {
    const content = String(memory.content || memory.task || '');
    const compressed = content.length > 200 ? content.slice(0, 197) + '...' : content;
    return {
      ...memory,
      content: compressed,
      compressed: true,
      originalLength: content.length,
      utility: this.computeUtility(memory),
    };
  }

  // ─── Query / Retrieval ──────────────────────────────────────

  query(queryStr, maxResults = 10) {
    const queryTopics = this._extractTopics(queryStr);
    const scored = this._memoryStore
      .map(m => ({
        ...m,
        queryScore: this._scoreRelevance(m, queryTopics),
      }))
      .filter(m => m.queryScore > 0)
      .sort((a, b) => b.queryScore - a.queryScore)
      .slice(0, maxResults);

    for (const m of scored) {
      m.accessCount = (m.accessCount || 0) + 1;
    }

    return scored;
  }

  _scoreRelevance(memory, queryTopics) {
    const content = String(memory.content || memory.task || '').toLowerCase();
    const tags = (memory.tags || []).join(' ').toLowerCase();
    const combined = content + ' ' + tags;

    let score = 0;
    for (const topic of queryTopics) {
      if (combined.includes(topic)) score += 2;
    }

    const recency = Math.max(0, 1 - (Date.now() - (memory.timestamp || 0)) / 604800000);
    score += recency * 0.5;

    const utility = memory.utility || this.computeUtility(memory);
    score += utility * 0.3;

    return +score.toFixed(3);
  }

  // ─── Stats ──────────────────────────────────────────────────

  getStats() {
    return {
      ...this._stats,
      storeSize: this._memoryStore.length,
      budget: this._config.storageBudget,
      utilization: (this._memoryStore.length / this._config.storageBudget).toFixed(3),
      recentDecisions: this._writeDecisions.slice(-10),
    };
  }
}

module.exports = { MemoryWriteController };
