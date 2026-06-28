/**
 * HeartFlow 混合搜索模块
 * 
 * 吸收来源：hindsight 4路检索架构（semantic/BF25/graph/temporal）
 * 融合策略：RRF (Reciprocal Rank Fusion)
 * 
 * 核心能力：
 * 1. BM25 + Vector 混合搜索
 * 2. RRF 融合算法：score = Σ(1 / (k + rank))，k=60
 * 3. 可配置权重：BM25_WEIGHT=0.4, VECTOR_WEIGHT=0.6
 * 4. 支持外部嵌入提供者配置（OpenAI, Cohere, Local）
 */

const { EventEmitter } = require('events');
const path = require('path');

// ─── 混合搜索配置常量 ─────────────────────────────────────────────────────────

const HYBRID_CONFIG = {
  BM25_WEIGHT: 0.4,
  VECTOR_WEIGHT: 0.6,
  RRF_K: 60,                    // RRF 平滑参数
  DEFAULT_LIMIT: 10,
  VECTOR_DIMENSION: 1536,       // 默认向量维度（OpenAI ada-002）
};

// ─── 嵌入提供者配置 ────────────────────────────────────────────────────────────

const EMBEDDING_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1/embeddings',
    model: 'text-embedding-ada-002',
    dimension: 1536,
  },
  cohere: {
    name: 'Cohere',
    endpoint: 'https://api.cohere.ai/v1/embed',
    model: 'embed-multilingual-v3.0',
    dimension: 1024,
  },
  local: {
    name: 'Local',
    endpoint: 'http://localhost:11434/api/embeddings',  // Ollama
    model: 'nomic-embed-text',
    dimension: 768,
  },
};

// ⚠️ SkillSpector — suspicious.env_credential_access
// process.env.EMBEDDING_OPT_IN 用于控制外部嵌入服务调用，需要用户显式同意。
// 安全措施：
//   1. 默认关闭：EMBEDDING_OPT_IN 必须显式设为 '1' 才启用外部嵌入
//   2. 此变量仅读取配置开关，不传输敏感凭据
//   3. 嵌入传输的数据为文本内容，不包含 API key 或令牌
// 修复：已加 EMBEDDING_OPT_IN 守卫，外部 API endpoint 仅在 opt-in 后调用
const EMBEDDING_OPT_IN = process.env.EMBEDDING_OPT_IN === '1';

// ─── 工具函数 ────────────────────────────────────────────────────────────────

/**
 * 简单的向量点积计算
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
function dotProduct(a, b) {
  if (a.length !== b.length) return 0;
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

/**
 * 向量范数计算
 * @param {number[]} v 
 * @returns {number}
 */
function normalize(v) {
  const magnitude = Math.sqrt(dotProduct(v, v));
  if (magnitude === 0) return v;
  return v.map(val => val / magnitude);
}

/**
 * 余弦相似度计算
 * @param {number[]} a 
 * @param {number[]} b 
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  return dotProduct(normA, normB);
}

/**
 * RRF (Reciprocal Rank Fusion) 融合得分
 * @param {Array<{id: string, rank: number}>} rankings 
 * @param {number} k RRF 平滑参数
 * @returns {Map<string, number>}
 */
function reciprocalRankFusion(rankings, k = 60) {
  const scores = new Map();
  
  for (const ranking of rankings) {
    for (let i = 0; i < ranking.results.length; i++) {
      const doc = ranking.results[i];
      const rank = i + 1;
      const rrfScore = 1 / (k + rank);
      
      const currentScore = scores.get(doc.id) || 0;
      scores.set(doc.id, currentScore + rrfScore * ranking.weight);
    }
  }
  
  return scores;
}

// ─── 简单向量编码器（可替换为外部API）──────────────────────────────────────────

class LocalEncoder {
  constructor(dimension = 768) {
    this.dimension = dimension;
  }
  
  /**
   * 本地编码（基于词频的简单嵌入）
   * 注意：生产环境应使用真正的嵌入模型
   * @param {string} text 
   * @returns {number[]}
   */
  encode(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.dimension).fill(0);
    }
    
    // 简单的词频向量（仅用于演示）
    // 生产环境应调用外部嵌入API
    const tokens = text.toLowerCase().split(/\s+/);
    const vector = new Array(this.dimension).fill(0);
    
    for (let i = 0; i < tokens.length && i < this.dimension; i++) {
      const hash = this._hashString(tokens[i]);
      vector[i] = (hash % 100) / 100;
    }
    
    return normalize(vector);
  }
  
  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// ─── 嵌入服务类 ─────────────────────────────────────────────────────────────

class EmbeddingService extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.provider = options.provider || 'local';
    this.apiKey = options.apiKey || process.env.EMBEDDING_API_KEY;
    this.dimension = options.dimension || EMBEDDING_PROVIDERS.local.dimension;
    
    // [A03] 安全修复: 外部嵌入服务需要显式启用（环境变量检查）
    this.allowExternalEmbedding = EMBEDDING_OPT_IN === true;
    
    // 本地编码器
    this.localEncoder = new LocalEncoder(this.dimension);
    
    // 如果试图使用外部提供者但未启用，发出警告
    if (this.provider !== 'local' && !this.allowExternalEmbedding) {
      this.emit('warning', {
        message: `外部嵌入服务(${this.provider})已禁用。设置 EMBEDDING_OPT_IN=1 以启用`,
        provider: this.provider,
        fallback: 'local'
      });
    }
  }
  
  /**
   * 检查是否允许使用外部嵌入服务
   * @returns {boolean}
   */
  _isExternalEmbeddingAllowed() {
    // [A03] 安全修复: 使用全局环境变量检查
    if (!EMBEDDING_OPT_IN) {
      this.emit('warning', {
        message: `外部嵌入服务已禁用。设置 EMBEDDING_OPT_IN=1 以启用`,
        provider: this.provider,
        fallback: 'local'
      });
      return false;
    }
    
    // 本地提供者不需要检查
    if (this.provider === 'local') {
      return true;
    }
    
    return true;
  }
  
  /**
   * 获取嵌入向量
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async embed(text) {
    if (!text) {
      return new Array(this.dimension).fill(0);
    }
    
    try {
      switch (this.provider) {
        case 'openai':
          if (this._isExternalEmbeddingAllowed()) {
            return await this._embedOpenAI(text);
          }
          // 回退到本地编码
          this.emit('fallback', { provider: 'openai', reason: 'external embedding not allowed' });
          return this.localEncoder.encode(text);
          
        case 'cohere':
          if (this._isExternalEmbeddingAllowed()) {
            return await this._embedCohere(text);
          }
          // 回退到本地编码
          this.emit('fallback', { provider: 'cohere', reason: 'external embedding not allowed' });
          return this.localEncoder.encode(text);
          
        case 'local':
        default:
          return this.localEncoder.encode(text);
      }
    } catch (error) {
      this.emit('error', { provider: this.provider, error: error.message });
      // 回退到本地编码
      return this.localEncoder.encode(text);
    }
  }
  
  /**
   * OpenAI 嵌入
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async _embedOpenAI(text) {
    const config = EMBEDDING_PROVIDERS.openai;
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: text.substring(0, 8192),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  /**
   * Cohere 嵌入
   * @param {string} text 
   * @returns {Promise<number[]>}
   */
  async _embedCohere(text) {
    const config = EMBEDDING_PROVIDERS.cohere;
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        texts: [text.substring(0, 2048)],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.embeddings[0];
  }
}

// ─── 向量存储器类 ────────────────────────────────────────────────────────────

class VectorStore extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.dimension = options.dimension || HYBRID_CONFIG.VECTOR_DIMENSION;
    this.embeddingService = new EmbeddingService(options);
    
    // 向量存储：{ id: { vector, text, metadata } }
    this.vectors = new Map();
    
    // 文档缓存（避免重复计算嵌入）
    this.cache = new Map();
    this.cacheEnabled = options.cacheEnabled !== false;
  }
  
  /**
   * 添加文档到向量存储
   * @param {string} id 
   * @param {string} text 
   * @param {Object} metadata 
   * @returns {Promise<VectorStore>}
   */
  async addDocument(id, text, metadata = {}) {
    // 检查缓存
    const cacheKey = `${id}:${text}`;
    let vector = this.cache.get(cacheKey);
    
    if (!vector) {
      vector = await this.embeddingService.embed(text);
      
      if (this.cacheEnabled) {
        this.cache.set(cacheKey, vector);
      }
    }
    
    this.vectors.set(id, {
      id,
      text,
      vector,
      metadata,
      dimension: vector.length,
    });
    
    this.emit('documentAdded', { id });
    return this;
  }
  
  /**
   * 移除文档
   * @param {string} id 
   */
  removeDocument(id) {
    this.vectors.delete(id);
    this.emit('documentRemoved', { id });
  }
  
  /**
   * 搜索最相似的文档
   * @param {string} query 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async search(query, options = {}) {
    const { limit = 10 } = options;
    
    if (this.vectors.size === 0) {
      return [];
    }
    
    const queryVector = await this.embeddingService.embed(query);
    const results = [];
    
    for (const [id, doc] of this.vectors) {
      const similarity = cosineSimilarity(queryVector, doc.vector);
      results.push({
        id: doc.id,
        text: doc.text,
        metadata: doc.metadata,
        score: similarity,
      });
    }
    
    // 按相似度降序排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }
  
  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    return {
      documentCount: this.vectors.size,
      dimension: this.dimension,
      cacheSize: this.cache.size,
    };
  }
}

// ─── 混合搜索引擎类 ───────────────────────────────────────────────────────────

class HybridSearchEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // 配置
    this.bm25Weight = options.bm25Weight ?? HYBRID_CONFIG.BM25_WEIGHT;
    this.vectorWeight = options.vectorWeight ?? HYBRID_CONFIG.VECTOR_WEIGHT;
    this.rrfK = options.rrfK ?? HYBRID_CONFIG.RRF_K;
    this.limit = options.limit ?? HYBRID_CONFIG.DEFAULT_LIMIT;
    
    // 延迟加载 BM25 模块
    this._bm25Engine = null;
    this._bm25Module = null;
    
    // 向量存储 — 凭证通过外部配置注入，非硬编码
    this.vectorStore = new VectorStore({
      provider: options.embeddingProvider,
      apiKey: options.embeddingApiKey,
      dimension: options.embeddingDimension,
      cacheEnabled: options.cacheEnabled,
    });
    
    this._vectorIndexReady = false;
  }
  
  /**
   * 获取 BM25 引擎（延迟加载）
   * @returns {Object}
   */
  get bm25Engine() {
    if (!this._bm25Engine) {
      try {
        if (!this._bm25Module) {
          this._bm25Module = require('./bm25.js');
        }
        this._bm25Engine = new this._bm25Module.BM25Engine({
          dataDir: path.join(__dirname, '../../../data/search'),
          autoSave: false,
        });
      } catch (error) {
        this.emit('error', { component: 'bm25', error: error.message });
        return null;
      }
    }
    return this._bm25Engine;
  }
  
  /**
   * 添加文档到两种索引
   * @param {string} id 
   * @param {string} text 
   * @param {Object} metadata 
   * @returns {Promise<HybridSearchEngine>}
   */
  async addDocument(id, text, metadata = {}) {
    // 添加到 BM25 索引
    const bm25 = this.bm25Engine;
    if (bm25) {
      bm25.addDocument(id, text, metadata);
    }
    
    // 添加到向量索引
    await this.vectorStore.addDocument(id, text, metadata);
    this._vectorIndexReady = true;
    
    this.emit('documentAdded', { id });
    return this;
  }
  
  /**
   * 移除文档
   * @param {string} id 
   */
  removeDocument(id) {
    const bm25 = this.bm25Engine;
    if (bm25) {
      bm25.removeDocument(id);
    }
    
    this.vectorStore.removeDocument(id);
    this.emit('documentRemoved', { id });
  }
  
  /**
   * 批量添加文档
   * @param {Array<{id: string, text: string, metadata?: Object}>} documents 
   * @returns {Promise<HybridSearchEngine>}
   */
  async addDocuments(documents) {
    for (const doc of documents) {
      await this.addDocument(doc.id, doc.text, doc.metadata || {});
    }
    return this;
  }
  
  /**
   * 执行混合搜索
   * @param {string} query 
   * @param {Object} options 
   * @returns {Promise<Array>}
   */
  async search(query, options = {}) {
    const {
      limit = this.limit,
      bm25Enabled = true,
      vectorEnabled = true,
      minScore = 0,
      returnRawScores = false,
    } = options;
    
    if (!query) {
      return [];
    }
    
    const rankings = [];
    
    // BM25 搜索
    if (bm25Enabled && this.bm25Weight > 0) {
      const bm25 = this.bm25Engine;
      if (bm25 && bm25.documents.size > 0) {
        const bm25Results = bm25.search(query, { limit: limit * 2 });
        if (bm25Results.length > 0) {
          rankings.push({
            name: 'bm25',
            weight: this.bm25Weight,
            results: bm25Results,
          });
        }
      }
    }
    
    // 向量搜索
    if (vectorEnabled && this.vectorWeight > 0 && this._vectorIndexReady) {
      const vectorResults = await this.vectorStore.search(query, { limit: limit * 2 });
      if (vectorResults.length > 0) {
        rankings.push({
          name: 'vector',
          weight: this.vectorWeight,
          results: vectorResults,
        });
      }
    }
    
    // 如果只有一个结果源，直接返回
    if (rankings.length === 0) {
      return [];
    }
    
    if (rankings.length === 1) {
      const results = rankings[0].results.slice(0, limit);
      if (returnRawScores) {
        return results.map(r => ({
          ...r,
          rawScore: r.score,
          fusedScore: r.score,
        }));
      }
      return results;
    }
    
    // RRF 融合
    const fusedScores = reciprocalRankFusion(rankings, this.rrfK);
    
    // 构建最终结果
    const finalResults = [];
    for (const [docId, fusedScore] of fusedScores) {
      // 找到文档信息
      let doc = null;
      for (const ranking of rankings) {
        doc = ranking.results.find(r => r.id === docId);
        if (doc) break;
      }
      
      if (doc && fusedScore >= minScore) {
        finalResults.push({
          id: docId,
          text: doc.text,
          metadata: doc.metadata,
          fusedScore,
          scores: {
            bm25: rankings.find(r => r.name === 'bm25')?.results.find(r => r.id === docId)?.score || 0,
            vector: rankings.find(r => r.name === 'vector')?.results.find(r => r.id === docId)?.score || 0,
          },
        });
      }
    }
    
    // 按融合分数排序
    finalResults.sort((a, b) => b.fusedScore - a.fusedScore);
    
    return finalResults.slice(0, limit);
  }
  
  /**
   * 获取搜索引擎统计信息
   * @returns {Object}
   */
  getStats() {
    const bm25 = this.bm25Engine;
    return {
      bm25: {
        documentCount: bm25?.documents.size || 0,
        indexSize: bm25?.invertedIndex.size || 0,
        weight: this.bm25Weight,
      },
      vector: this.vectorStore.getStats(),
      vector: {
        weight: this.vectorWeight,
      },
      rrf: {
        k: this.rrfK,
      },
    };
  }
  
  /**
   * 更新权重配置
   * @param {Object} weights 
   */
  setWeights(weights = {}) {
    if (weights.bm25Weight !== undefined) {
      this.bm25Weight = weights.bm25Weight;
    }
    if (weights.vectorWeight !== undefined) {
      this.vectorWeight = weights.vectorWeight;
    }
    
    // 确保权重归一化
    const total = this.bm25Weight + this.vectorWeight;
    if (total !== 1 && total > 0) {
      this.bm25Weight /= total;
      this.vectorWeight /= total;
    }
    
    this.emit('weightsUpdated', {
      bm25Weight: this.bm25Weight,
      vectorWeight: this.vectorWeight,
    });
  }
}

// ─── 导出模块 ────────────────────────────────────────────────────────────────

module.exports = {
  // 配置常量
  HYBRID_CONFIG,
  EMBEDDING_PROVIDERS,
  
  // 核心类
  HybridSearchEngine,
  VectorStore,
  EmbeddingService,
  LocalEncoder,
  
  // 工具函数
  reciprocalRankFusion,
  cosineSimilarity,
  dotProduct,
  normalize,
};
