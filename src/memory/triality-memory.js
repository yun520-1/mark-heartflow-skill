/**
 * Triality-Memory - 三维经验大脑
 * 
 * 设计理念：
 * - 时间维度：微秒级时间戳，记录事件发生顺序
 * - 语义维度：向量嵌入表示记忆内容
 * - 关系维度：因果、引述、相似等关系链
 * 
 * 本地优先设计：SQLite + 向量扩展 (sqlite-vec)
 * 支持 narrativeQuery 图遍历查询
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TrialityMemory {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.dbPath = options.dbPath || path.join(projectRoot, 'data', 'triality-memory.db');
    this.vectorDim = options.vectorDim || 384;
    this.vecEnabled = options.vecEnabled !== false;
    this.memoryLayers = {
      working: [],
      episodic: [],
      semantic: []
    };
    this.db = null;
    this.useMem = true;
    this.memories = [];
    this.vectors = new Map();
    this.relationships = new Map();

    // 因果推理引擎 (ActMem: causal-semantic graph)
    let CausalInference;
    try { ({ CausalInference } = require('../reasoning/causal-inference.js')); } catch (e) { /* stub fallback */ }
    this.causalEngine = CausalInference ? new CausalInference() : null;

    this.stats = {
      totalMemories: 0,
      totalRelationships: 0,
      lastCleanup: null,
      causalGraphBuilt: false,
    };
    
    this.init();
  }

  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.initializeSchema();
    // 已禁用 console.error: console.error('[TrialityMemory] 三维经验大脑初始化完成');
  }

  initializeSchema() {
    // 只在第一次（db不存在）时清空，不每次启动都清空
    if (!this._schemaInitialized) {
      this.memories = [];
      this.vectors = new Map();
      this.relationships = new Map();
      this._loadFromExport(); // 启动时从文件恢复记忆
      this._schemaInitialized = true;
    }
  }

  _getExportPath() {
    return path.join(path.dirname(this.dbPath), 'triality-memory-export.json');
  }

  _loadFromExport() {
    const exportPath = this._getExportPath();
    if (fs.existsSync(exportPath)) {
      try {
        const raw = fs.readFileSync(exportPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.memories && Array.isArray(data.memories)) {
          for (const mem of data.memories) {
            this.memories.push(mem);
            if (mem.embedding) this.vectors.set(mem.id, mem.embedding);
          }
          if (data.relationships) {
            for (const [k, v] of Object.entries(data.relationships)) {
              this.relationships.set(k, v);
            }
          }
          this.stats.totalMemories = this.memories.length;
          // 已禁用 console.error: console.error(`[TrialityMemory] 从 ${exportPath} 恢复 ${data.memories.length} 条记忆`);
        }
      } catch (e) {
        // 已禁用 console.warn: console.warn('[TrialityMemory] 恢复记忆失败:', e.message);
      }
    }
  }

  _autoSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._doSave();
    }, 2000); // 2秒防抖
  }

  _doSave() {
    const exportPath = this._getExportPath();
    try {
      const data = {
        memories: this.memories,
        relationships: Object.fromEntries(this.relationships),
        exportedAt: new Date().toISOString()
      };
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    } catch (e) {
      // 已禁用 console.warn: console.warn('[TrialityMemory] 自动保存失败:', e.message);
    }
  }

  store(memory) {
    const id = memory.id || this.generateId();
    const timestamp = memory.timestamp || Date.now() * 1000;
    const layer = memory.layer || this.classifyLayer(memory);
    
    const memoryRecord = {
      id,
      timestamp,
      layer,
      content: memory.content,
      summary: memory.summary || this.summarizeContent(memory.content),
      embedding: memory.embedding || this.generateMockEmbedding(memory.content),
      metadata: memory.metadata || {},
      importance: memory.importance || this.estimateImportance(memory),
      accessCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.memories.push(memoryRecord);
    this.vectors.set(id, memoryRecord.embedding);
    this.addToLayer(memoryRecord);
    if (memory.relatedTo) {
      for (const rel of memory.relatedTo) {
        this.addRelationship({
          sourceId: id,
          targetId: rel.targetId,
          relationType: rel.type || 'related',
          strength: rel.strength || 1.0
        });
      }
    }
    
    this.stats.totalMemories = this.memories.length;
    // 已禁用 console.error: console.error(`[TrialityMemory] 记忆存储: ${id} (${this.memories.length} total)`);
    this._autoSave(); // 自动持久化

    // 每新增 5 条记忆重建一次因果图
    if (this.causalEngine && this.memories.length % 5 === 0) {
      this._rebuildCausalGraph();
    }

    return id;
  }

  generateId() {
    return `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  generateMockEmbedding(content) {
    const hash = crypto.createHash('sha256').update(content).digest();
    const embedding = [];
    for (let i = 0; i < this.vectorDim; i++) {
      embedding.push((hash[i % hash.length] / 255) * 2 - 1);
    }
    return embedding;
  }

  summarizeContent(content = '') {
    return String(content).replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  classifyLayer(memory = {}) {
    if (memory.layer) return memory.layer;
    if (memory.metadata?.durable || memory.metadata?.userPreference) return 'semantic';
    if (memory.metadata?.taskId || memory.metadata?.episode) return 'episodic';
    return 'working';
  }

  estimateImportance(memory = {}) {
    let importance = 10;
    if (memory.metadata?.durable) importance += 8;
    if (memory.metadata?.userPreference) importance += 6;
    if (memory.metadata?.taskOutcome) importance += 4;
    return importance;
  }

  addToLayer(memoryRecord) {
    const layer = memoryRecord.layer || 'working';
    if (!this.memoryLayers[layer]) this.memoryLayers[layer] = [];
    this.memoryLayers[layer].push(memoryRecord.id);
  }

  // ─── 因果图集成 (ActMem) ──────────────────────────────────────────────────

  /**
   * 重建因果图（从所有记忆条目）
   * @private
   */
  _rebuildCausalGraph() {
    if (!this.causalEngine) return;
    try {
      this.causalEngine.buildGraph(this.memories);
      this.stats.causalGraphBuilt = true;
    } catch (e) {
      // 已禁用 console.warn: console.warn('[TrialityMemory] 因果图构建失败:', e.message);
    }
  }

  /**
   * 基于因果关联的记忆搜索（超越语义相似度）
   * @param {string} query - 查询文本
   * @param {number} topK - 返回数量
   * @returns {Array} 因果相关的记忆
   */
  causalSearch(query, topK = 10) {
    if (!this.causalEngine) return [];
    return this.causalEngine.searchByCausal(query, topK);
  }

  /**
   * 追踪记忆的因果链
   * @param {string} memoryId - 记忆ID
   * @param {string} direction - 'forward' 或 'backward'
   * @param {number} maxDepth - 最大深度
   * @returns {Array}
   */
  traceCausality(memoryId, direction = 'forward', maxDepth = 5) {
    if (!this.causalEngine) return [];
    return this.causalEngine.trace(memoryId, direction, maxDepth);
  }

  /**
   * 传播激活搜索（从种子记忆扩散）
   * @param {string} seedId - 种子记忆ID
   * @param {number} budget - 激活预算
   * @returns {Array}
   */
  spreadingActivationSearch(seedId, budget = 100) {
    if (!this.causalEngine) return [];
    return this.causalEngine.spreadingActivation(seedId, budget);
  }

  consolidateMemories() {
    const promoted = [];
    const merged = [];

    for (const mem of this.memories) {
      if (mem.layer === 'working' && mem.importance >= 16) {
        mem.layer = 'semantic';
        promoted.push(mem.id);
      } else if (mem.layer === 'working' && mem.importance >= 12) {
        mem.layer = 'episodic';
        promoted.push(mem.id);
      }

      const duplicates = this.memories.filter(other => other.id !== mem.id && other.summary === mem.summary);
      if (duplicates.length > 0) {
        mem.accessCount += duplicates.length;
        merged.push(mem.id);
      }
    }

    this.memoryLayers = { working: [], episodic: [], semantic: [] };
    this.memories.forEach(mem => this.addToLayer(mem));

    return {
      promoted: [...new Set(promoted)],
      merged: [...new Set(merged)],
      layers: this.getLayerStats()
    };
  }

  getLayerStats() {
    return {
      working: this.memoryLayers.working.length,
      episodic: this.memoryLayers.episodic.length,
      semantic: this.memoryLayers.semantic.length
    };
  }

  addRelationship(rel) {
    const id = `rel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const record = {
      id,
      sourceId: rel.sourceId,
      targetId: rel.targetId,
      relationType: rel.relationType,
      strength: rel.strength || 1.0,
      metadata: rel.metadata || {},
      createdAt: Date.now()
    };
    
    if (!this.relationships.has(rel.sourceId)) {
      this.relationships.set(rel.sourceId, []);
    }
    this.relationships.get(rel.sourceId).push(record);
    
    this.stats.totalRelationships = this.relationships.size;
    return id;
  }

  semanticSearch(queryEmbedding, topK = 10) {
    const similarities = [];
    
    for (const [id, embedding] of this.vectors) {
      const sim = this.cosineSimilarity(queryEmbedding, embedding);
      const memory = this.memories.find(m => m.id === id);
      if (memory) {
        similarities.push({
          id,
          content: memory.content,
          timestamp: memory.timestamp,
          similarity: sim,
          metadata: memory.metadata
        });
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }

  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
  }

  narrativeQuery(query) {
    const {
      startMemoryId,
      direction = 'forward',
      relationTypes = ['causal', 'quotes', 'similar', 'related'],
      maxDepth = 5,
      maxNodes = 50
    } = query;

    if (!startMemoryId) {
      return this.getRecentNarrative(maxNodes);
    }

    const visited = new Set();
    const narrative = [];
    const queue = [{ id: startMemoryId, depth: 0 }];

    while (queue.length > 0 && narrative.length < maxNodes) {
      const current = queue.shift();
      
      if (visited.has(current.id) || current.depth > maxDepth) continue;
      visited.add(current.id);

      const memory = this.memories.find(m => m.id === current.id);
      if (memory) {
        narrative.push({ ...memory, depth: current.depth });
      }

      const relations = this.relationships.get(current.id) || [];
      for (const rel of relations) {
        if (relationTypes.includes(rel.relationType) || relationTypes.includes('all')) {
          if (!visited.has(rel.targetId)) {
            queue.push({ id: rel.targetId, depth: current.depth + 1 });
          }
        }
      }

      if (direction === 'bidirectional') {
        for (const [sourceId, rels] of this.relationships) {
          for (const rel of rels) {
            if (rel.targetId === current.id && !visited.has(sourceId)) {
              if (relationTypes.includes(rel.relationType) || relationTypes.includes('all')) {
                queue.push({ id: sourceId, depth: current.depth + 1 });
              }
            }
          }
        }
      }
    }

    narrative.sort((a, b) => a.timestamp - b.timestamp);
    // 已禁用 console.error: console.error(`[TrialityMemory] 叙事查询: ${narrative.length} 个记忆节点`);
    return narrative;
  }

  getRecentNarrative(count = 20) {
    const sorted = [...this.memories].sort((a, b) => b.timestamp - a.timestamp);
    return sorted.slice(0, count).map(m => ({ ...m, depth: 0 }));
  }

  queryByTimeRange(startTime, endTime) {
    return this.memories
      .filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  queryByRelationType(relationType, memoryId) {
    const relations = this.relationships.get(memoryId) || [];
    const targets = relations.filter(r => r.relationType === relationType).map(r => r.targetId);
    return targets.map(id => this.memories.find(m => m.id === id)).filter(Boolean);
  }

  getStats() {
    return {
      ...this.stats,
      vectorDimension: this.vectorDim,
      storageMode: this.useMem ? 'memory' : 'sqlite-vec',
      dbPath: this.dbPath
    };
  }

  exportToFile(filePath) {
    // [A01] 安全修复: 路径验证 — 仅允许导出到项目 data 目录
    const allowedDir = path.join(path.dirname(this.dbPath || __dirname), '..', '..', '..', 'data');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(allowedDir))) {
      // 已禁用 console.error: console.error(`[TrialityMemory] 安全拦截: 不允许导出到 ${resolvedPath}（必须在 data 目录内）`);
      return { success: false, error: 'path_not_allowed' };
    }
    const data = {
      memories: this.memories,
      relationships: Array.from(this.relationships.entries()),
      exportedAt: new Date().toISOString()
    };
    fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2));
    // 已禁用 console.error: console.error(`[TrialityMemory] 导出到: ${resolvedPath}`);
    return { success: true, count: this.memories.length };
  }

  importFromFile(filePath) {
    // [A01] 安全修复: 路径验证 — 仅允许从项目 data 目录导入
    const allowedDir = path.resolve(path.join(path.dirname(this.dbPath || __dirname), '..', '..', '..', 'data'));
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(allowedDir)) {
      // 已禁用 console.error: console.error(`[TrialityMemory] 安全拦截: 不允许从 ${resolvedPath} 导入（必须在 data 目录内）`);
      return { success: false, error: 'path_not_allowed' };
    }
    if (!fs.existsSync(resolvedPath)) {
      // 已禁用 console.error: console.error(`[TrialityMemory] 文件不存在: ${resolvedPath}`);
      return { success: false, error: 'file_not_found' };
    }
    const data = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    if (data.memories) {
      for (const mem of data.memories) {
        this.store(mem);
      }
    }
    // 已禁用 console.error: console.error(`[TrialityMemory] 从 ${filePath} 导入`);
    return { success: true, count: data.memories?.length || 0 };
  }

  cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() * 1000 - maxAge;
    const before = this.memories.length;
    this.memories = this.memories.filter(m => m.timestamp > cutoff);
    this.stats.lastCleanup = new Date().toISOString();
    const removed = before - this.memories.length;
    // 已禁用 console.error: console.error(`[TrialityMemory] 清理: 移除 ${removed} 条旧记忆`);
    return { removed, remaining: this.memories.length };
  }

  // === 艾宾浩斯遗忘曲线 ===

  /**
   * 计算记忆保留概率 (艾宾浩斯遗忘曲线)
   * R = e^(-t/S) 其中 S 是稳定性系数
   */
  ebbinghausForget(memory, timeElapsed) {
    const S = memory.importance || 10; // 稳定性系数
    const t = timeElapsed / (1000 * 60 * 60); // 转换为小时
    
    const retention = Math.exp(-t / S);
    
    return {
      retention,
      shouldCompress: retention < 0.3,
      shouldDelete: retention < 0.1
    };
  }

  /**
   * 遗忘曲线参数配置
   */
  forgettingConfig = {
    defaultStability: 10,      // 默认稳定性
    highImportanceStability: 24, // 高重要性稳定性
    emotionalStability: 18,   // 情感记忆稳定性
    compressionThreshold: 0.3, // 压缩阈值
    deletionThreshold: 0.1     // 删除阈值
  };

  /**
   * 评估并清理记忆 - 应用遗忘曲线
   */
  applyForgettingCurve() {
    const now = Date.now() * 1000;
    const toCompress = [];
    const toDelete = [];

    for (const mem of this.memories) {
      const timeElapsed = now - mem.timestamp;
      const result = this.ebbinghausForget(mem, timeElapsed);

      if (result.shouldDelete) {
        toDelete.push(mem.id);
      } else if (result.shouldCompress && !mem.compressed) {
        toCompress.push(mem.id);
      }
    }

    // 执行清理
    this.memories = this.memories.filter(m => !toDelete.includes(m.id));

    // 标记压缩
    for (const id of toCompress) {
      const mem = this.memories.find(m => m.id === id);
      if (mem) mem.compressed = true;
    }

    // 已禁用 console.error: console.error(`[TrialityMemory] 遗忘曲线清理: 删除 ${toDelete.length} 条, 压缩 ${toCompress.length} 条`);
    return { deleted: toDelete.length, compressed: toCompress.length };
  }

  // === 多通道检索 (5+ 通道) ===

  /**
   * 语义通道 - 向量相似度
   */
  searchBySemantic(queryEmbedding, limit = 10) {
    return this.semanticSearch(queryEmbedding, limit);
  }

  /**
   * 关键词通道 - BM25 风格
   */
  searchByKeywords(keywords, limit = 10) {
    if (!keywords || keywords.length === 0) return [];
    
    const scores = this.memories.map(mem => {
      const content = (mem.content || '').toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (content.includes(kw.toLowerCase())) {
          score += 1;
        }
      }
      return { id: mem.id, content: mem.content, timestamp: mem.timestamp, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit).map(s => ({ id: s.id, content: s.content, timestamp: s.timestamp }));
  }

  /**
   * 时间通道 - 按时间范围过滤
   */
  searchByTimeRange(startTime, endTime, limit = 20) {
    return this.queryByTimeRange(startTime, endTime).slice(0, limit);
  }

  /**
   * 情感通道 - 按 PAD 向量检索相似情感状态的记忆
   */
  searchByEmotion(targetPAD, limit = 10) {
    const similarities = this.memories.map(mem => {
      if (!mem.metadata?.pad) return { id: mem.id, similarity: 0 };
      
      const memPAD = mem.metadata.pad;
      const sim = 1 - (
        Math.abs(targetPAD.pleasure - memPAD.pleasure) +
        Math.abs(targetPAD.arousal - memPAD.arousal) +
        Math.abs(targetPAD.dominance - memPAD.dominance)
      ) / 30;
      
      return { id: mem.id, content: mem.content, timestamp: mem.timestamp, similarity: sim };
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit).filter(s => s.similarity > 0.5);
  }

  /**
   * 传播激活通道 - 沿着联想图谱检索相关记忆
   */
  searchByAssociation(startMemoryId, maxDepth = 3, limit = 20) {
    return this.narrativeQuery({
      startMemoryId,
      direction: 'bidirectional',
      maxDepth,
      maxNodes: limit
    });
  }

  /**
   * 融合多通道检索
   */
  multiChannelSearch(query, options = {}) {
    const {
      keywords = [],
      semanticEmbedding = null,
      timeRange = null,
      emotionPAD = null,
      startMemoryId = null,
      weights = { semantic: 0.3, keyword: 0.2, time: 0.1, emotion: 0.2, association: 0.2 }
    } = options;

    const results = new Map();

    // 语义通道
    if (semanticEmbedding) {
      const semantic = this.searchBySemantic(semanticEmbedding, 10);
      for (const r of semantic) {
        results.set(r.id, { ...r, channel: 'semantic', score: r.similarity * weights.semantic });
      }
    }

    // 关键词通道
    if (keywords.length > 0) {
      const keyword = this.searchByKeywords(keywords, 10);
      for (const r of keyword) {
        const existing = results.get(r.id) || r;
        const newScore = (existing.score || 0) + (r.score / 10) * weights.keyword;
        results.set(r.id, { ...existing, score: newScore });
      }
    }

    // 时间通道
    if (timeRange) {
      const time = this.searchByTimeRange(timeRange.start, timeRange.end, 10);
      for (const r of time) {
        const existing = results.get(r.id) || r;
        const newScore = (existing.score || 0) + 0.5 * weights.time;
        results.set(r.id, { ...existing, score: newScore });
      }
    }

    // 情感通道
    if (emotionPAD) {
      const emotion = this.searchByEmotion(emotionPAD, 10);
      for (const r of emotion) {
        const existing = results.get(r.id) || r;
        const newScore = (existing.score || 0) + r.similarity * weights.emotion;
        results.set(r.id, { ...existing, score: newScore });
      }
    }

    // 联想通道
    if (startMemoryId) {
      const assoc = this.searchByAssociation(startMemoryId, 3, 10);
      for (const r of assoc) {
        const existing = results.get(r.id) || r;
        const newScore = (existing.score || 0) + 0.5 * weights.association;
        results.set(r.id, { ...existing, score: newScore });
      }
    }

    // 排序返回
    return Array.from(results.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, options.limit || 20);
  }

  /**
   * 获取记忆健康状态
   */
  getMemoryHealth() {
    const now = Date.now() * 1000;
    let totalRetention = 0;
    let compressedCount = 0;

    for (const mem of this.memories) {
      const timeElapsed = now - mem.timestamp;
      const result = this.ebbinghausForget(mem, timeElapsed);
      totalRetention += result.retention;
      if (mem.compressed) compressedCount++;
    }

    return {
      totalMemories: this.memories.length,
      averageRetention: this.memories.length > 0 ? (totalRetention / this.memories.length).toFixed(2) : 0,
      compressedCount,
      forgettingParameters: this.forgettingConfig,
      channels: ['semantic', 'keyword', 'time', 'emotion', 'association'],
      layers: this.getLayerStats(),
      lineage: this.getLineageStats(),  // 万俟族族谱：知识谱系统计
    };
  }

  // ============================================================================
  // 知识谱系（Knowledge Lineage）— 万俟族族坊原则
  // ============================================================================
  // 记录知识的来源、演变和传播，像族谱一样追踪"知识来自哪里，传到哪里"

  addKnowledgeLineage(sourceId, targetId, relationType = 'derived_from', metadata = {}) {
    const lineageKey = `${sourceId}->${targetId}`;
    const lineageRecord = {
      sourceId,
      targetId,
      relationType,  // 'derived_from' | 'inspired_by' | 'contradicts' | 'extends'
      metadata,
      timestamp: Date.now(),
      strength: metadata.strength || 1.0,
    };
    this.relationships.set(`lineage:${lineageKey}`, lineageRecord);
    this.stats.totalRelationships = this.relationships.size;
    this._autoSave();
    return lineageKey;
  }

  queryKnowledgeLineage(memoryId, direction = 'both', maxDepth = 5) {
    const results = { ancestors: [], descendants: [], path: [] };
    const visited = new Set();

    const traverse = (id, depth, path) => {
      if (depth > maxDepth || visited.has(id)) return;
      visited.add(id);

      // 查找所有关系
      for (const [key, rel] of this.relationships) {
        if (!key.startsWith('lineage:')) continue;

        if (direction === 'both' || direction === 'ancestors') {
          if (rel.targetId === id) {
            results.ancestors.push({ id: rel.sourceId, relation: rel.relationType, depth });
            traverse(rel.sourceId, depth + 1, [...path, { from: rel.sourceId, to: id, relation: rel.relationType }]);
          }
        }

        if (direction === 'both' || direction === 'descendants') {
          if (rel.sourceId === id) {
            results.descendants.push({ id: rel.targetId, relation: rel.relationType, depth });
            traverse(rel.targetId, depth + 1, [...path, { from: id, to: rel.targetId, relation: rel.relationType }]);
          }
        }
      }
    };

    traverse(memoryId, 0, []);
    results.path = results.ancestors.length > 0 ? results.ancestors : results.descendants;
    return results;
  }

  getKnowledgeDescendants(memoryId, maxDepth = 3) {
    const lineage = this.queryKnowledgeLineage(memoryId, 'descendants', maxDepth);
    return lineage.descendants.map(d => ({
      id: d.id,
      relation: d.relation,
      depth: d.depth,
      memory: this.memories.find(m => m.id === d.id),
    })).filter(r => r.memory);
  }

  getKnowledgeAncestors(memoryId, maxDepth = 3) {
    const lineage = this.queryKnowledgeLineage(memoryId, 'ancestors', maxDepth);
    return lineage.ancestors.map(a => ({
      id: a.id,
      relation: a.relation,
      depth: a.depth,
      memory: this.memories.find(m => m.id === a.id),
    })).filter(r => r.memory);
  }

  getLineageStats() {
    const lineageRels = [...this.relationships.values()].filter(r => r.sourceId && r.targetId);
    const roots = new Set();
    const leaves = new Set();
    const sourceSet = new Set(lineageRels.map(r => r.sourceId));
    const targetSet = new Set(lineageRels.map(r => r.targetId));

    for (const id of sourceSet) {
      if (!targetSet.has(id)) roots.add(id);
    }
    for (const id of targetSet) {
      if (!sourceSet.has(id)) leaves.add(id);
    }

    return {
      totalLineageRelations: lineageRels.length,
      rootKnowledge: roots.size,
      leafKnowledge: leaves.size,
      maxDepth: this._calculateMaxDepth(),
    };
  }

  _calculateMaxDepth() {
    let maxDepth = 0;
    for (const [key, rel] of this.relationships) {
      if (!key.startsWith('lineage:')) continue;
      // 简化计算：通过查询每个节点的深度
      const lineage = this.queryKnowledgeLineage(rel.sourceId, 'descendants', 10);
      maxDepth = Math.max(maxDepth, lineage.descendants.length);
    }
    return maxDepth;
  }

  // 获取知识谱系树（类似族谱的家谱树）
  getKnowledgeTree(rootId, maxDepth = 5) {
    const tree = {
      id: rootId,
      memory: this.memories.find(m => m.id === rootId),
      children: [],
    };

    const buildTree = (nodeId, depth) => {
      if (depth >= maxDepth) return;
      const descendants = this.getKnowledgeDescendants(nodeId, 1);
      for (const desc of descendants) {
        const childNode = {
          id: desc.id,
          memory: desc.memory,
          relation: desc.relation,
          children: [],
        };
        buildTree(desc.id, depth + 1);
        tree.children.push(childNode);
      }
    };

    buildTree(rootId, 0);
    return tree;
  }
}

module.exports = { TrialityMemory };

