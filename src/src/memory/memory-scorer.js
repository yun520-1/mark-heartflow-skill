/**
 * HeartFlow v5.8.0 — BM25 记忆评分与排序
 * 
 * 来源: mem0 (https://github.com/mem0ai/mem0)
 * 功能: 基于 BM25 算法的记忆检索排序
 */

class MemoryScorer {
  constructor(options = {}) {
    this.k1 = options.k1 || 1.5;      // BM25 参数：词频饱和度
    this.b = options.b || 0.75;     // BM25 参数：字段长度归一化
    this.entityBoostWeight = options.entityBoostWeight || 0.3;  // 实体提升权重
    this.maxResults = options.maxResults || 100;
  }

  /**
   * 计算单个记忆的 BM25 分数
   */
  scoreBM25(query, memory, corpusStats) {
    const queryTerms = this.tokenize(query);
    let score = 0;

    for (const term of queryTerms) {
      const tf = this.getTermFrequency(term, memory.content);  // 词频
      const idf = this.getInverseDocumentFrequency(term, corpusStats);  // 逆文档频率

      // BM25 公式
      const numerator = tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * (memory.length / corpusStats.avgLength));
      score += idf * (numerator / denominator);
    }

    return score;
  }

  /**
   * 对记忆列表进行 BM25 评分与排序
   */
  scoreAndRank(query, memories, options = {}) {
    const corpusStats = this.calculateCorpusStats(memories);
    const scores = [];

    for (const memory of memories) {
      const score = this.scoreBM25(query, memory, corpusStats);
      scores.push({ memory, score });
    }

    // 按分数降序排序
    scores.sort((a, b) => b.score - a.score);

    // 归一化分数（0-1）
    const maxScore = scores[0]?.score || 1;
    const normalized = scores.map(s => ({
      ...s,
      normalizedScore: s.score / maxScore
    }));

    // 实体提升
    if (options.boostByEntity && options.entities) {
      return this.boostByEntity(normalized, options.entities);
    }

    return normalized.slice(0, this.maxResults);
  }

  /**
   * 根据实体相关性提升分数
   */
  boostByEntity(scoredMemories, entities) {
    return scoredMemories.map(s => {
      let boost = 1.0;
      const content = s.memory.content.toLowerCase();

      for (const entity of entities) {
        if (content.includes(entity.toLowerCase())) {
          boost += this.entityBoostWeight;
        }
      }

      return {
        ...s,
        score: s.score * boost,
        boosted: boost > 1.0
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * 计算语料库统计信息
   */
  calculateCorpusStats(memories) {
    const docCount = memories.length;
    const termDocCounts = {};  // 术语在多少文档中出现
    let totalLength = 0;

    for (const memory of memories) {
      const terms = this.tokenize(memory.content);
      totalLength += terms.length;

      const uniqueTerms = new Set(terms);
      for (const term of uniqueTerms) {
        termDocCounts[term] = (termDocCounts[term] || 0) + 1;
      }
    }

    return {
      docCount,
      avgLength: totalLength / docCount,
      termDocCounts
    };
  }

  /**
   * 获取术语在文档中的频率
   */
  getTermFrequency(term, content) {
    const terms = this.tokenize(content);
    return terms.filter(t => t === term).length;
  }

  /**
   * 获取逆文档频率（IDF）
   */
  getInverseDocumentFrequency(term, corpusStats) {
    const docCountWithTerm = corpusStats.termDocCounts[term] || 0;
    if (docCountWithTerm === 0) return 0;

    // IDF 公式：log((N - n + 0.5) / (n + 0.5))
    return Math.log(
      (corpusStats.docCount - docCountWithTerm + 0.5) / 
      (docCountWithTerm + 0.5)
    );
  }

  /**
   * 分词（简化版，生产环境应使用专业分词库）
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
  }

  /**
   * 混合评分（BM25 + 时间衰减 + 置信度）
   */
  hybridScore(query, memories, options = {}) {
    const bm25Results = this.scoreAndRank(query, memories, options);

    return bm25Results.map(s => {
      let finalScore = s.normalizedScore;

      // 时间衰减（越新的记忆分数越高）
      if (options.timeDecay) {
        const ageInDays = (Date.now() - new Date(s.memory.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const timeScore = Math.exp(-options.timeDecay * ageInDays);
        finalScore *= timeScore;
      }

      // 置信度加权
      if (options.useConfidence && s.memory.confidence) {
        finalScore *= s.memory.confidence;
      }

      return {
        ...s,
        finalScore,
        timeScore: options.timeDecay ? Math.exp(-options.timeDecay * ((Date.now() - new Date(s.memory.timestamp).getTime()) / (1000 * 60 * 60 * 24))) : 1.0
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 批量评分（性能优化）
   */
  batchScore(query, memoryBatches) {
    const results = [];

    for (const batch of memoryBatches) {
      const batchResults = this.scoreAndRank(query, batch);
      results.push(...batchResults);
    }

    // 全局排序
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.maxResults);
  }
}

module.exports = { MemoryScorer };
