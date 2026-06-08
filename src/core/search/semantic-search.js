/**
 * SemanticSearch — 语义搜索模块 v2.0
 *
 * 使用 @xenova/transformers 在本地生成文本嵌入向量，
 * 替代传统 TF-IDF 关键词匹配。
 *
 * 设计原则：
 * - 懒加载：首次 search/addDocument 时才下载模型
 * - 优雅降级：模型不可用时返回空结果，不崩溃
 * - 零启动开销：constructor 不做任何 I/O
 * - 全链路防御：参数验证、边界检查、状态诊断全覆盖
 *
 * v2.0 新增:
 * - ErrorClassification — 错误类型枚举 + 重试策略建议
 * - OscillationDetection — 结果震荡检测（相邻查询结果变化率监控）
 * - IndexStatistics — 索引统计（维度、内存估算、文档分布）
 * - QualityFiltering — 最小分数阈值过滤 + 结果归一化
 * - DocumentUpdate — 文档内容更新并自动重新嵌入
 * - MultiQuerySearch — 批量多查询搜索
 * - HealthDiagnostic — 结构化健康诊断报告
 *
 * 使用方式：
 *   const { SemanticSearch } = require('./search/semantic-search.js');
 *   const ss = new SemanticSearch();
 *   await ss.addDocument('id1', '心虫的核心判断引擎');
 *   const results = await ss.search('判断引擎');
 *   const diagnosis = ss.diagnose();  // 全状态诊断
 */

'use strict';

// ============================================================================
// 错误分类枚举 — 提供错误类型识别与重试策略建议
// ============================================================================

/**
 * @enum {string}
 * @readonly
 * SemanticSearch 错误类型分类
 */
const ErrorType = {
  /** @xcause {@link ErrorCategory.MODEL} @xretry exponential backoff, max 3 */
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',
  /** @xcause {@link ErrorCategory.MODEL} @xretry immediate re-init */
  MODEL_NOT_INITIALIZED: 'MODEL_NOT_INITIALIZED',
  /** @xcause {@link ErrorCategory.EMBEDDING} @xretry verify input length */
  EMBEDDING_DIMENSION_MISMATCH: 'EMBEDDING_DIMENSION_MISMATCH',
  /** @xcause {@link ErrorCategory.EMBEDDING} @xretry re-run embed */
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  /** @xcause {@link ErrorCategory.INPUT} @xretry none */
  INPUT_INVALID: 'INPUT_INVALID',
  /** @xcause {@link ErrorCategory.INPUT} @xretry none */
  INPUT_EMPTY: 'INPUT_EMPTY',
  /** @xcause {@link ErrorCategory.MEMORY} @xretry reduce document count */
  INDEX_MEMORY_LIMIT: 'INDEX_MEMORY_LIMIT',
  /** @xcause {@link ErrorCategory.NETWORK} @xretry with longer timeout */
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  /** @xcause {@link ErrorCategory.NETWORK} @xretry check model path or network */
  MODEL_DOWNLOAD_FAILED: 'MODEL_DOWNLOAD_FAILED',
  /** @xcause {@link ErrorCategory.INTERNAL} @xretry report bug */
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  /** @xcause {@link ErrorCategory.INDEX} @xretry re-add document */
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  /** @xcause {@link ErrorCategory.INDEX} @xretry none */
  INDEX_EMPTY: 'INDEX_EMPTY',
};

/**
 * @enum {string}
 * @readonly
 * 错误大类
 */
const ErrorCategory = {
  MODEL: 'MODEL',
  EMBEDDING: 'EMBEDDING',
  INPUT: 'INPUT',
  MEMORY: 'MEMORY',
  NETWORK: 'NETWORK',
  INTERNAL: 'INTERNAL',
  INDEX: 'INDEX',
};

/** @type {Object<ErrorType, {category: ErrorCategory, retryable: boolean, severity: number, recoveryHint: string}>} */
const ERROR_META = {
  [ErrorType.MODEL_LOAD_FAILED]: {
    category: ErrorCategory.MODEL,
    retryable: true,
    severity: 3,
    recoveryHint: '检查网络连接和模型名称，使用 backoff 重试',
  },
  [ErrorType.MODEL_NOT_INITIALIZED]: {
    category: ErrorCategory.MODEL,
    retryable: true,
    severity: 2,
    recoveryHint: '调用 preload() 或 search() 触发懒加载',
  },
  [ErrorType.EMBEDDING_DIMENSION_MISMATCH]: {
    category: ErrorCategory.EMBEDDING,
    retryable: true,
    severity: 2,
    recoveryHint: '文档嵌入维度与查询嵌入维度不一致，需重新嵌入文档',
  },
  [ErrorType.EMBEDDING_FAILED]: {
    category: ErrorCategory.EMBEDDING,
    retryable: true,
    severity: 2,
    recoveryHint: '嵌入计算异常，重试 embed()',
  },
  [ErrorType.INPUT_INVALID]: {
    category: ErrorCategory.INPUT,
    retryable: false,
    severity: 1,
    recoveryHint: '检查输入参数类型和格式',
  },
  [ErrorType.INPUT_EMPTY]: {
    category: ErrorCategory.INPUT,
    retryable: false,
    severity: 1,
    recoveryHint: '输入文本不能为空',
  },
  [ErrorType.INDEX_MEMORY_LIMIT]: {
    category: ErrorCategory.MEMORY,
    retryable: true,
    severity: 3,
    recoveryHint: '减少文档数量或启用索引压缩',
  },
  [ErrorType.NETWORK_TIMEOUT]: {
    category: ErrorCategory.NETWORK,
    retryable: true,
    severity: 2,
    recoveryHint: '增加超时时间或检查网络',
  },
  [ErrorType.MODEL_DOWNLOAD_FAILED]: {
    category: ErrorCategory.NETWORK,
    retryable: true,
    severity: 3,
    recoveryHint: '检查模型路径或网络连接，可尝试本地模型路径',
  },
  [ErrorType.INTERNAL_ERROR]: {
    category: ErrorCategory.INTERNAL,
    retryable: false,
    severity: 4,
    recoveryHint: '内部状态异常，建议报告 bug',
  },
  [ErrorType.DOCUMENT_NOT_FOUND]: {
    category: ErrorCategory.INDEX,
    retryable: false,
    severity: 1,
    recoveryHint: '文档 ID 不存在，检查 addDocument 是否已调用',
  },
  [ErrorType.INDEX_EMPTY]: {
    category: ErrorCategory.INDEX,
    retryable: false,
    severity: 1,
    recoveryHint: '索引为空，请先添加文档',
  },
};

// ============================================================================
// 震荡检测 — 监控连续搜索结果的稳定性
// ============================================================================

/**
 * 计算两组结果之间的 Jaccard 相似度（基于 ID 集合）
 * @param {Array<{id: string}>} prev
 * @param {Array<{id: string}>} curr
 * @returns {number} 0-1，1 表示完全相同
 */
function _jaccardSimilarity(prev, curr) {
  if (!prev.length && !curr.length) return 1;
  const prevIds = new Set(prev.map(r => r.id));
  const currIds = new Set(curr.map(r => r.id));
  const intersection = new Set([...prevIds].filter(id => currIds.has(id)));
  const union = new Set([...prevIds, ...currIds]);
  return intersection.size / union.size;
}

// ============================================================================
// 主类
// ============================================================================

class SemanticSearch {
  /**
   * @param {object} options
   * @param {string} options.model - 模型名称，默认 Xenova/all-MiniLM-L6-v2 (~80MB)
   * @param {string} options.modelPath - 本地模型路径（优先于 model 名称）
   * @param {number} options.maxRetries - 模型加载重试次数
   * @param {number} options.retryDelayMs - 重试间隔毫秒，默认 1000
   * @param {number} options.minScore - 搜索结果最低分数阈值，默认 0
   * @param {number} options.maxDocuments - 最大文档数（内存保护），默认 100000
   * @param {number} options.oscillationThreshold - 震荡检测阈值（0-1），低于此值触发警告，默认 0.3
   * @param {boolean} options.enableDiagnostics - 启用诊断追踪，默认 true
   */
  constructor(options = {}) {
    this.modelName = options.model || 'Xenova/all-MiniLM-L6-v2';
    this.modelPath = options.modelPath || null;
    this.maxRetries = options.maxRetries || 2;
    this.retryDelayMs = options.retryDelayMs || 1000;
    this.minScore = options.minScore || 0;
    this.maxDocuments = options.maxDocuments || 100000;
    this.oscillationThreshold = options.oscillationThreshold ?? 0.3;
    this.enableDiagnostics = options.enableDiagnostics !== false;

    this._pipeline = null;
    this._extract = null;
    this._embeddings = new Map();  // id → Float32Array
    this._documents = new Map();   // id → text
    this._loaded = false;
    this._loadError = null;
    this._embeddingDim = null;     // 嵌入向量维度，首次嵌入后记录

    // 诊断追踪
    this._stats = {
      searchCount: 0,
      embedCount: 0,
      embedErrorCount: 0,
      modelLoadAttempts: 0,
      modelLoadFailures: 0,
      fallbackCount: 0,
      oscillationWarnings: 0,
      lastError: null,
      lastErrorTime: null,
    };

    // 震荡检测：缓存上一次搜索结果
    this._lastSearchResults = null;
    this._lastSearchQuery = null;
  }

  // ==========================================================================
  // 错误分类工具
  // ==========================================================================

  /**
   * 分类错误并返回建议的重试策略
   * @param {Error} err
   * @returns {{ type: ErrorType, category: string, retryable: boolean, severity: number, recoveryHint: string, delayMs: number }}
   */
  classifyError(err) {
    if (!err || !err.message) {
      return this._makeErrorResult(ErrorType.INTERNAL_ERROR);
    }
    const msg = err.message;

    if (msg.includes('not found') && this.modelPath) {
      return this._makeErrorResult(ErrorType.MODEL_DOWNLOAD_FAILED);
    }
    if (msg.includes('load') || msg.includes('download') || msg.includes('fetch')) {
      return this._makeErrorResult(ErrorType.MODEL_LOAD_FAILED, 2000);
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('socket')) {
      return this._makeErrorResult(ErrorType.NETWORK_TIMEOUT, 3000);
    }
    if (msg.includes('dimension') || msg.includes('shape')) {
      return this._makeErrorResult(ErrorType.EMBEDDING_DIMENSION_MISMATCH);
    }
    if (msg.includes('memory') || msg.includes('heap') || msg.includes('allocation')) {
      return this._makeErrorResult(ErrorType.INDEX_MEMORY_LIMIT);
    }
    if (msg.includes('pipeline') || msg.includes('not initialized')) {
      return this._makeErrorResult(ErrorType.MODEL_NOT_INITIALIZED);
    }

    return this._makeErrorResult(ErrorType.EMBEDDING_FAILED);
  }

  /**
   * @private
   */
  _makeErrorResult(type, customDelay) {
    const meta = ERROR_META[type] || ERROR_META[ErrorType.INTERNAL_ERROR];
    return {
      type,
      category: meta.category,
      retryable: meta.retryable,
      severity: meta.severity,
      recoveryHint: meta.recoveryHint,
      delayMs: customDelay || (meta.retryable ? 1000 : 0),
    };
  }

  // ==========================================================================
  // 输入验证
  // ==========================================================================

  /**
   * 验证文本输入
   * @param {*} text
   * @returns {{ valid: boolean, error: ErrorType|null, message: string }}
   */
  validateText(text) {
    if (text === null || text === undefined) {
      return { valid: false, error: ErrorType.INPUT_INVALID, message: '输入不能为 null/undefined' };
    }
    if (typeof text !== 'string') {
      return { valid: false, error: ErrorType.INPUT_INVALID, message: `输入必须为字符串，收到 ${typeof text}` };
    }
    if (text.trim().length === 0) {
      return { valid: false, error: ErrorType.INPUT_EMPTY, message: '输入文本不能为空字符串' };
    }
    if (text.length > 100000) {
      return { valid: false, error: ErrorType.INPUT_INVALID, message: '输入文本过长（超过 100000 字符）' };
    }
    return { valid: true, error: null, message: 'ok' };
  }

  /**
   * 验证文档 ID
   * @param {*} id
   * @returns {{ valid: boolean, error: ErrorType|null, message: string }}
   */
  validateId(id) {
    if (id === null || id === undefined) {
      return { valid: false, error: ErrorType.INPUT_INVALID, message: 'ID 不能为 null/undefined' };
    }
    if (typeof id !== 'string' && typeof id !== 'number') {
      return { valid: false, error: ErrorType.INPUT_INVALID, message: `ID 必须为字符串或数字，收到 ${typeof id}` };
    }
    return { valid: true, error: null, message: 'ok' };
  }

  // ==========================================================================
  // 模型管理
  // ==========================================================================

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

    this._stats.modelLoadAttempts++;

    if (!SemanticSearch.isModuleAvailable()) {
      this._loadError = '@xenova/transformers 未安装';
      console.warn('[SemanticSearch] ' + this._loadError + '，语义搜索降级为空');
      this._stats.modelLoadFailures++;
      return false;
    }

    const { pipeline } = require('@xenova/transformers');
    const modelId = this.modelPath || this.modelName;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this._pipeline = await pipeline('feature-extraction', modelId, {
          quantized: true,
        });
        this._loaded = true;
        return true;
      } catch (e) {
        // 本地路径不存在时不重试
        if (this.modelPath && e.message.includes('not found')) {
          console.warn(`[SemanticSearch] 本地模型路径不存在: ${this.modelPath}`);
          this._loadError = `本地模型路径不存在: ${this.modelPath}`;
          this._stats.modelLoadFailures++;
          return false;
        }
        console.warn(`[SemanticSearch] 模型加载失败 (尝试 ${attempt}/${this.maxRetries}): ${e.message}`);
        if (attempt < this.maxRetries) {
          await new Promise(r => setTimeout(r, this.retryDelayMs));
        }
      }
    }

    this._loadError = `模型 ${modelId} 加载失败`;
    this._stats.modelLoadFailures++;
    return false;
  }

  /**
   * 预加载模型（可主动调用，不依赖首次搜索触发）
   */
  async preload() {
    return this._loadModel();
  }

  /**
   * 重置模型（在模型加载失败后调用，清空错误状态重试）
   */
  resetModel() {
    this._loaded = false;
    this._loadError = null;
    this._pipeline = null;
  }

  // ==========================================================================
  // 嵌入生成
  // ==========================================================================

  /**
   * 生成单个文本的嵌入向量
   * @param {string} text
   * @returns {Promise<Float32Array|null>}
   */
  async embed(text) {
    const validation = this.validateText(text);
    if (!validation.valid) {
      this._recordError(validation.error, validation.message);
      return null;
    }

    const ok = await this._loadModel();
    if (!ok || !this._pipeline) return null;

    try {
      const result = await this._pipeline(text, {
        pooling: 'mean',
        normalize: true,
      });

      this._stats.embedCount++;

      // 记录嵌入维度
      if (result && result.data && result.data.length) {
        if (this._embeddingDim === null) {
          this._embeddingDim = result.data.length;
        } else if (result.data.length !== this._embeddingDim) {
          this._recordError(
            ErrorType.EMBEDDING_DIMENSION_MISMATCH,
            `嵌入维度不一致: 期望 ${this._embeddingDim}, 实际 ${result.data.length}`
          );
        }
      }

      return result.data;
    } catch (e) {
      this._stats.embedErrorCount++;
      const classified = this.classifyError(e);
      this._recordError(classified.type, e.message);
      console.warn(`[SemanticSearch] embed 失败 [${classified.type}]:`, e.message);
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

  // ==========================================================================
  // 文档管理
  // ==========================================================================

  /**
   * 添加单个文档到索引
   * @param {string|number} id
   * @param {string} text
   * @returns {Promise<boolean>} 是否成功添加
   */
  async addDocument(id, text) {
    const idVal = this.validateId(id);
    if (!idVal.valid) {
      this._recordError(idVal.error, idVal.message);
      return false;
    }
    const textVal = this.validateText(text);
    if (!textVal.valid) {
      this._recordError(textVal.error, textVal.message);
      return false;
    }

    // 内存保护
    if (this._documents.size >= this.maxDocuments) {
      this._recordError(ErrorType.INDEX_MEMORY_LIMIT,
        `索引已达上限 ${this.maxDocuments} 条文档`);
      return false;
    }

    const embedding = await this.embed(text);
    this._documents.set(id, text);
    if (embedding) {
      this._embeddings.set(id, embedding);
    }
    return true;
  }

  /**
   * 批量添加文档
   * @param {Array<{id: string, text: string}>} documents
   * @returns {Promise<number>} 成功添加的文档数
   */
  async addDocuments(documents) {
    if (!Array.isArray(documents)) return 0;

    // 批量验证
    const validDocs = documents.filter(doc => {
      if (!doc) return false;
      const idVal = this.validateId(doc.id);
      const textVal = this.validateText(doc.text);
      return idVal.valid && textVal.valid;
    });

    if (validDocs.length === 0) return 0;

    // 内存保护检查
    if (this._documents.size + validDocs.length > this.maxDocuments) {
      this._recordError(ErrorType.INDEX_MEMORY_LIMIT,
        `批量添加 ${validDocs.length} 条文档会超过上限 ${this.maxDocuments}`);
      return 0;
    }

    const texts = validDocs.map(d => d.text);
    const embeddings = await this.embedBatch(texts);
    let added = 0;

    for (let i = 0; i < validDocs.length; i++) {
      const doc = validDocs[i];
      this._documents.set(doc.id, doc.text);
      if (embeddings[i] && embeddings[i].embedding) {
        this._embeddings.set(doc.id, embeddings[i].embedding);
      }
      added++;
    }
    return added;
  }

  /**
   * 更新文档内容（自动重新嵌入）
   * @param {string|number} id
   * @param {string} newText
   * @returns {Promise<boolean>}
   */
  async updateDocument(id, newText) {
    if (!this._documents.has(id)) {
      this._recordError(ErrorType.DOCUMENT_NOT_FOUND, `文档 ${id} 不存在`);
      return false;
    }
    const textVal = this.validateText(newText);
    if (!textVal.valid) {
      this._recordError(textVal.error, textVal.message);
      return false;
    }
    return this.addDocument(id, newText);
  }

  /**
   * 移除文档
   * @param {string|number} id
   * @returns {boolean} 是否存在并删除
   */
  removeDocument(id) {
    const existed = this._documents.has(id) || this._embeddings.has(id);
    this._documents.delete(id);
    this._embeddings.delete(id);
    return existed;
  }

  /**
   * 清空索引
   */
  clear() {
    this._documents.clear();
    this._embeddings.clear();
    this._embeddingDim = null;
    this._lastSearchResults = null;
    this._lastSearchQuery = null;
  }

  /**
   * 获取文档文本
   * @param {string|number} id
   * @returns {string|null}
   */
  getDocument(id) {
    return this._documents.get(id) || null;
  }

  // ==========================================================================
  // 语义搜索
  // ==========================================================================

  /**
   * 语义搜索
   * @param {string} query
   * @param {object} [options]
   * @param {number} [options.topK=5] - 返回结果数
   * @param {number} [options.minScore] - 最低分数阈值（覆盖实例设置）
   * @param {boolean} [options.normalizeScores=false] - 是否归一化分数到 0-1
   * @returns {Promise<Array<{id: string, text: string, score: number}>>}
   */
  async search(query, options = {}) {
    const topK = (options && typeof options === 'object') ? (options.topK || 5) : 5;
    const minScore = (options && typeof options === 'object' && options.minScore !== undefined) ? options.minScore : this.minScore;
    const normalizeScores = (options && typeof options === 'object') ? (options.normalizeScores || false) : false;

    const validation = this.validateText(query);
    if (!validation.valid) {
      this._recordError(validation.error, validation.message);
      return [];
    }

    this._stats.searchCount++;

    if (this._documents.size === 0) {
      this._recordError(ErrorType.INDEX_EMPTY, '索引为空');
      return [];
    }

    const queryEmbed = await this.embed(query);
    if (!queryEmbed) {
      this._stats.fallbackCount++;
      // 降级：返回最近添加的文档
      const all = Array.from(this._documents.entries());
      const results = all.slice(0, topK).map(([id, text]) => ({ id, text, score: 0 }));
      this._detectOscillation(query, results);
      return results;
    }

    const scored = [];
    for (const [id, text] of this._documents) {
      const docEmbed = this._embeddings.get(id);
      if (!docEmbed) continue;

      // 维度检查
      if (queryEmbed.length !== docEmbed.length) {
        this._recordError(ErrorType.EMBEDDING_DIMENSION_MISMATCH,
          `查询维度 ${queryEmbed.length} vs 文档 ${id} 维度 ${docEmbed.length}`);
        continue;
      }

      const score = this._cosineSimilarity(queryEmbed, docEmbed);

      // 质量过滤：低于阈值的结果不返回
      if (score < minScore) continue;

      scored.push({ id, text, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, topK);

    // 可选归一化
    if (normalizeScores && results.length > 0) {
      const maxScore = results[0].score;
      if (maxScore > 0) {
        for (const r of results) {
          r.score = r.score / maxScore;
        }
      }
    }

    // 震荡检测
    this._detectOscillation(query, results);

    return results;
  }

  /**
   * 多查询搜索 — 用多个查询词搜索并合并结果
   * @param {string[]} queries
   * @param {object} [options]
   * @param {number} [options.topK=5] - 每个查询的 topK
   * @param {number} [options.mergeTopK=10] - 合并后返回的结果数
   * @param {number} [options.minScore] - 最低分数阈值
   * @returns {Promise<Array<{id: string, text: string, score: number, fromQuery: string}>>}
   */
  async searchMulti(queries, options = {}) {
    const topK = options.topK || 5;
    const mergeTopK = options.mergeTopK || 10;
    const minScore = options.minScore !== undefined ? options.minScore : this.minScore;

    if (!Array.isArray(queries) || queries.length === 0) return [];

    // 并行搜索
    const allResults = await Promise.all(
      queries.map(q => this.search(q, { topK, minScore, normalizeScores: false }))
    );

    // 合并去重，保留最高分
    const merged = new Map();
    for (let qi = 0; qi < allResults.length; qi++) {
      const results = allResults[qi];
      const query = queries[qi];
      for (const r of results) {
        const key = String(r.id);
        if (!merged.has(key) || merged.get(key).score < r.score) {
          merged.set(key, { ...r, fromQuery: query });
        }
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, mergeTopK);
  }

  // ==========================================================================
  // 震荡检测
  // ==========================================================================

  /**
   * 检测相邻查询的结果震荡
   * @private
   */
  _detectOscillation(query, results) {
    if (!this.enableDiagnostics) return;
    if (!this._lastSearchResults || !this._lastSearchQuery) {
      this._lastSearchResults = results;
      this._lastSearchQuery = query;
      return;
    }

    // 相同查询才比较
    if (query === this._lastSearchQuery) return;

    const similarity = _jaccardSimilarity(this._lastSearchResults, results);

    if (similarity < this.oscillationThreshold) {
      this._stats.oscillationWarnings++;
      console.warn(
        `[SemanticSearch] 结果震荡检测: 查询 "${query}" vs "${this._lastSearchQuery}" ` +
        `Jaccard=${similarity.toFixed(3)} < 阈值=${this.oscillationThreshold}`
      );
    }

    this._lastSearchResults = results;
    this._lastSearchQuery = query;
  }

  // ==========================================================================
  // 相似度计算
  // ==========================================================================

  /**
   * 余弦相似度
   * @param {Float32Array|number[]} a
   * @param {Float32Array|number[]} b
   * @returns {number}
   */
  _cosineSimilarity(a, b) {
    if (!a || !b) return 0;
    if (a.length !== b.length) return 0;

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
   * 计算两个文档之间的语义相似度
   * @param {string|number} id1
   * @param {string|number} id2
   * @returns {number} -1 如果任意文档不存在
   */
  similarityBetween(id1, id2) {
    const emb1 = this._embeddings.get(id1);
    const emb2 = this._embeddings.get(id2);
    if (!emb1 || !emb2) return -1;
    return this._cosineSimilarity(emb1, emb2);
  }

  // ==========================================================================
  // 索引统计与诊断
  // ==========================================================================

  /**
   * 估算索引内存占用（字节）
   * @returns {{ embeddingBytes: number, documentBytes: number, total: number }}
   */
  estimateMemoryUsage() {
    let embeddingBytes = 0;
    let documentBytes = 0;

    if (this._embeddingDim) {
      // Float32Array: 每个 float 4 字节
      embeddingBytes = this._embeddings.size * this._embeddingDim * 4;
    }

    for (const text of this._documents.values()) {
      // 近似：每个字符 ~2 字节（UTF-16）
      documentBytes += text.length * 2;
    }

    return {
      embeddingBytes,
      documentBytes,
      total: embeddingBytes + documentBytes,
    };
  }

  /**
   * 结构化健康诊断报告
   * @returns {object}
   */
  diagnose() {
    const memUsage = this.estimateMemoryUsage();
    const modelStatus = this._loaded ? 'loaded' : (this._loadError ? 'error' : 'pending');

    return {
      version: '2.0',
      model: {
        name: this.modelPath || this.modelName,
        status: modelStatus,
        loadError: this._loadError,
        available: SemanticSearch.isModuleAvailable(),
      },
      index: {
        documentCount: this._documents.size,
        embeddingCount: this._embeddings.size,
        embeddingDimension: this._embeddingDim,
        maxDocuments: this.maxDocuments,
        utilization: this.maxDocuments > 0
          ? (this._documents.size / this.maxDocuments * 100).toFixed(1) + '%'
          : 'N/A',
      },
      memory: {
        ...memUsage,
        embeddingMB: (memUsage.embeddingBytes / (1024 * 1024)).toFixed(2),
        documentMB: (memUsage.documentBytes / (1024 * 1024)).toFixed(2),
        totalMB: (memUsage.total / (1024 * 1024)).toFixed(2),
      },
      stats: {
        ...this._stats,
      },
      quality: {
        minScoreThreshold: this.minScore,
        oscillationThreshold: this.oscillationThreshold,
      },
    };
  }

  /**
   * 健康检查（简洁接口）
   * @returns {boolean}
   */
  isAvailable() {
    return this._loaded;
  }

  // ==========================================================================
  // 错误记录
  // ==========================================================================

  /**
   * @private
   */
  _recordError(type, message) {
    this._stats.lastError = { type, message };
    this._stats.lastErrorTime = Date.now();
  }

  // ==========================================================================
  // 索引属性
  // ==========================================================================

  /** @returns {number} 索引文档数 */
  get size() {
    return this._documents.size;
  }

  /** @returns {string[]} 所有文档 ID */
  get ids() {
    return Array.from(this._documents.keys());
  }

  /** @returns {number|null} 嵌入向量维度 */
  get embeddingDimension() {
    return this._embeddingDim;
  }

  /** @returns {number} 搜索总次数 */
  get searchCount() {
    return this._stats.searchCount;
  }
}

module.exports = { SemanticSearch, ErrorType, ErrorCategory, ERROR_META };
