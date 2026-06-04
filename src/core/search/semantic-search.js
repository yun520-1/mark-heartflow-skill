/**
 * SemanticSearch — 语义搜索模块
 *
 * 使用 @xenova/transformers 在本地生成文本嵌入向量，
 * 替代当前 TF-IDF 关键词匹配。
 *
 * 设计原则：
 * - 懒加载：首次 search/addDocument 时才下载模型
 * - 优雅降级：模型不可用时返回空结果，不崩溃
 * - 零启动开销：constructor 不做任何 I/O
 *
 * 使用方式：
 *   const { SemanticSearch } = require('./search/semantic-search.js');
 *   const ss = new SemanticSearch();
 *   await ss.addDocument('id1', '心虫的核心判断引擎');
 *   const results = await ss.search('判断引擎');
 */

class SemanticSearch {
  /**
   * @param {object} options
   * @param {string} options.model - 模型名称，默认 Xenova/all-MiniLM-L6-v2 (~80MB)
   * @param {string} options.modelPath - 本地模型路径（优先于 model 名称）
   * @param {number} options.maxRetries - 模型加载重试次数
   */
  constructor(options = {}) {
    this.modelName = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.modelPath = options.modelPath || null;
    this.maxRetries = options.maxRetries || 2;
    this._pipeline = null;
    this._extract = null;
    this._embeddings = new Map();  // id → Float32Array
    this._documents = new Map();   // id → text
    this._loaded = false;
    this._loadError = null;
  }

  /**
   * 静态检查：@xenova/transformers 是否已安装
   */
  static isModuleAvailable() {
    try {
      require.resolve('@xenova/transformers');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 懒加载模型（首次使用时自动调用）
   */
  async _loadModel() {
    if (this._loaded) return true;
    if (this._loadError) return false;

    if (!SemanticSearch.isModuleAvailable()) {
      this._loadError = '@xenova/transformers 未安装';
      console.warn('[SemanticSearch] ' + this._loadError + '，语义搜索降级为空');
      return false;
    }

    const { pipeline } = require('@xenova/transformers');

    // 优先使用本地模型路径
    const modelId = this.modelPath || this.modelName;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._pipeline = await pipeline('feature-extraction', modelId, {
          quantized: true
        });
        this._loaded = true;
        return true;
      } catch (e) {
        // 如果是本地路径不存在，不重试
        if (this.modelPath && e.message.includes('not found')) {
          console.warn(`[SemanticSearch] 本地模型路径不存在: ${this.modelPath}`);
          this._loadError = `本地模型路径不存在: ${this.modelPath}`;
          return false;
        }
        console.warn(`[SemanticSearch] 模型加载失败 (尝试 ${attempt}/${this.maxRetries}): ${e.message}`);
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    this._loadError = `模型 ${modelId} 加载失败`;
    return false;
  }

  /**
   * 预加载模型（可主动调用，不依赖首次搜索触发）
   */
  async preload() {
    return this._loadModel();
  }

  /**
   * 生成单个文本的嵌入向量
   * @param {string} text
   * @returns {Promise<Float32Array|null>}
   */
  async embed(text) {
    if (!text || typeof text !== 'string') return null;
    const ok = await this._loadModel();
    if (!ok || !this._pipeline) return null;

    try {
      const result = await this._pipeline(text, {
        pooling: 'mean',
        normalize: true
      });
      return result.data;
    } catch (e) {
      console.warn('[SemanticSearch] embed 失败:', e.message);
      return null;
    }
  }

  /**
   * 批量生成嵌入向量
   * @param {string[]} texts
   * @returns {Promise<Array<{text: string, embedding: Float32Array|null}>>}
   */
  async embedBatch(texts) {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    const ok = await this._loadModel();
    if (!ok || !this._pipeline) return texts.map(t => ({ text: t, embedding: null }));

    const results = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      results.push({ text, embedding });
    }
    return results;
  }

  /**
   * 添加单个文档到索引
   * @param {string} id
   * @param {string} text
   */
  async addDocument(id, text) {
    if (!id || !text) return;
    const embedding = await this.embed(text);
    this._documents.set(id, text);
    if (embedding) {
      this._embeddings.set(id, embedding);
    }
  }

  /**
   * 批量添加文档
   * @param {Array<{id: string, text: string}>} documents
   */
  async addDocuments(documents) {
    if (!Array.isArray(documents)) return;
    const texts = documents.map(d => d.text);
    const embeddings = await this.embedBatch(texts);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      this._documents.set(doc.id, doc.text);
      if (embeddings[i] && embeddings[i].embedding) {
        this._embeddings.set(doc.id, embeddings[i].embedding);
      }
    }
  }

  /**
   * 语义搜索
   * @param {string} query
   * @param {number} topK
   * @returns {Promise<Array<{id: string, text: string, score: number}>>}
   */
  async search(query, topK = 5) {
    if (!query || this._documents.size === 0) return [];

    const queryEmbed = await this.embed(query);
    if (!queryEmbed) {
      // 降级：返回最近添加的文档
      const all = Array.from(this._documents.entries());
      return all.slice(0, topK).map(([id, text]) => ({ id, text, score: 0 }));
    }

    const scored = [];
    for (const [id, text] of this._documents) {
      const docEmbed = this._embeddings.get(id);
      if (!docEmbed) continue;
      const score = this._cosineSimilarity(queryEmbed, docEmbed);
      scored.push({ id, text, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * 余弦相似度
   */
  _cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * 健康检查
   */
  isAvailable() {
    return this._loaded;
  }

  /**
   * 移除文档
   */
  removeDocument(id) {
    this._documents.delete(id);
    this._embeddings.delete(id);
  }

  /**
   * 清空索引
   */
  clear() {
    this._documents.clear();
    this._embeddings.clear();
  }

  /**
   * 索引文档数
   */
  get size() {
    return this._documents.size;
  }

  /**
   * 所有文档ID
   */
  get ids() {
    return Array.from(this._documents.keys());
  }
}

module.exports = { SemanticSearch };
