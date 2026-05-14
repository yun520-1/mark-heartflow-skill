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
 *
 * v11.24.002+ 新增：
 * - 全量文本持久化 (text-based persistence)
 * - 工作上下文 (working context) - 仅加载需要的记忆
 * - 长期记忆存档 (long-term archive) - 不需要的保存到文本
 * - 对话全量保存 (conversation logging)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { atomicWriteJSON, atomicWrite, atomicWriteSync, atomicWriteJSONSync } = require('../../utils/atomic-write');

class TrialityMemory {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.dbPath = options.dbPath || path.join(projectRoot, 'data', 'triality-memory.db');
    this.vectorDim = options.vectorDim || 384;
    this.vecEnabled = options.vecEnabled !== false;

    // === 文本持久化配置 ===
    this.textBaseDir = options.textBaseDir || path.join(projectRoot, 'memory', 'texts');
    this.workingContextDir = path.join(this.textBaseDir, 'working');      // 工作上下文
    this.longTermArchiveDir = path.join(this.textBaseDir, 'archive');    // 长期存档
    this.conversationLogDir = path.join(this.textBaseDir, 'conversations'); // 对话日志
    this.indexFile = path.join(this.textBaseDir, 'index.json');          // 记忆索引

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
    // O(1) 内存索引，消除 this.memories.find() 的 O(n) 查找
    this.memoryIndex = new Map();

    // === SwiftMem-inspired 查询感知索引 (v0.13.10) ===
    // 时序索引: topic → [memoryId] (对数时间范围查询)
    this.temporalIndex = new Map();
    // 语义Tag索引: tag → Set(memoryId) (O(1) 标签检索)
    this.tagIndex = new Map();
    // 分层语义DAG: topic → { subtopics: [], memoryIds: [] }
    this.semanticDAG = new Map();
    // LRU 缓存: query → cached result (避免重复计算)
    this.recallCache = new Map();
    this.recallCacheMax = 200;

    // === 工作上下文 (Working Context) ===
    // 仅保存当前推理所需的记忆，其他移到长期存档
    this.workingContext = {
      loaded: [],      // 当前加载的记忆ID列表
      maxWorking: options.maxWorking || 50  // 工作上下文最大容量
    };

    this.stats = {
      totalMemories: 0,
      totalRelationships: 0,
      lastCleanup: null,
      textPersisted: 0,
      longTermArchived: 0
    };

    this.init();
  }

  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 初始化文本存储目录
    this._initTextStorage();

    this.initializeSchema();
    console.log('[TrialityMemory] 三维经验大脑初始化完成');
    console.log(`[TrialityMemory] 文本存储目录: ${this.textBaseDir}`);
  }

  _initTextStorage() {
    // 创建必要的目录
    const dirs = [this.textBaseDir, this.workingContextDir, this.longTermArchiveDir, this.conversationLogDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 初始化索引文件
    if (!fs.existsSync(this.indexFile)) {
      this._saveIndex({ memories: {}, conversations: {}, stats: { total: 0, archived: 0 } });
    }
  }

  // === 核心存储方法 ===

  initializeSchema() {
    this.memories = [];
    this.vectors = new Map();
    this.relationships = new Map();
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
    this.memoryIndex.set(id, memoryRecord); // O(1) lookup
    this.addToLayer(memoryRecord);
    // SwiftMem: 更新查询感知索引
    this._indexMemoryTemporal(memoryRecord);
    this._indexMemoryByTag(memoryRecord);
    this._indexMemoryByTopic(memoryRecord);
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
    console.log(`[TrialityMemory] 记忆存储: ${id} (${this.memories.length} total)`);

    // === 文本持久化 ===
    this._persistMemoryToText(memoryRecord);

    return id;
  }

  // === 文本持久化方法 ===

  /**
   * 将记忆持久化到文本文件
   * @private
   */
  _persistMemoryToText(memoryRecord) {
    try {
      const index = this._loadIndex();

      // 记忆文件路径
      const memoryFile = path.join(this.workingContextDir, `${memoryRecord.id}.md`);
      const content = this._formatMemoryAsText(memoryRecord);

      // 原子写入文本文件（防崩溃损坏）
      atomicWriteSync(memoryFile, content);

      // 更新索引
      index.memories[memoryRecord.id] = {
        id: memoryRecord.id,
        file: `${memoryRecord.id}.md`,
        timestamp: memoryRecord.timestamp,
        layer: memoryRecord.layer,
        importance: memoryRecord.importance,
        summary: memoryRecord.summary,
        content_preview: memoryRecord.content?.substring(0, 100)
      };
      index.stats.total++;

      this._saveIndex(index);
      this.stats.textPersisted++;

    } catch (error) {
      console.error(`[TrialityMemory] 文本持久化失败: ${error.message}`);
    }
  }

  /**
   * 格式化记忆为 Markdown 文本
   * @private
   */
  _formatMemoryAsText(memoryRecord) {
    const lines = [
      `# Memory: ${memoryRecord.id}`,
      '',
      `## 基本信息`,
      `- **时间戳**: ${new Date(memoryRecord.timestamp / 1000).toISOString()}`,
      `- **层级**: ${memoryRecord.layer}`,
      `- **重要性**: ${memoryRecord.importance}`,
      `- **访问次数**: ${memoryRecord.accessCount}`,
      '',
      `## 内容`,
      memoryRecord.content || '',
      '',
      `## 摘要`,
      memoryRecord.summary || '',
      '',
      `## 元数据`,
      JSON.stringify(memoryRecord.metadata || {}, null, 2),
      '',
      `---`,
      `*此记忆由 TrialityMemory 自动生成 - ${new Date().toISOString()}*`
    ];
    return lines.join('\n');
  }

  /**
   * 加载记忆索引
   * @private
   */
  _loadIndex() {
    try {
      if (fs.existsSync(this.indexFile)) {
        return JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
      }
    } catch (error) {
      console.error(`[TrialityMemory] 索引加载失败: ${error.message}`);
    }
    return { memories: {}, conversations: {}, stats: { total: 0, archived: 0 } };
  }

  /**
   * 保存记忆索引
   * @private
   */
  _saveIndex(index) {
    try {
      atomicWriteJSONSync(this.indexFile, index);
    } catch (error) {
      console.error(`[TrialityMemory] 索引保存失败: ${error.message}`);
    }
  }

  /**
   * 加载记忆文本到工作上下文
   * @param {string|Array} memoryIds 记忆ID或ID列表
   */
  loadToWorkingContext(memoryIds) {
    if (!Array.isArray(memoryIds)) {
      memoryIds = [memoryIds];
    }

    const loaded = [];
    for (const id of memoryIds) {
      const memoryFile = path.join(this.workingContextDir, `${id}.md`);
      if (fs.existsSync(memoryFile)) {
        // 复制到工作上下文
        const workingFile = path.join(this.workingContextDir, `working`, `${id}.md`);
        fs.copyFileSync(memoryFile, workingFile);
        loaded.push(id);
      }
    }

    this.workingContext.loaded = [...new Set([...this.workingContext.loaded, ...loaded])];
    console.log(`[TrialityMemory] 加载 ${loaded.length} 条记忆到工作上下文`);
    return loaded;
  }

  /**
   * 将记忆移到长期存档
   * @param {string|Array} memoryIds 记忆ID或ID列表
   */
  archiveToLongTerm(memoryIds) {
    if (!Array.isArray(memoryIds)) {
      memoryIds = [memoryIds];
    }

    const archived = [];
    const index = this._loadIndex();

    for (const id of memoryIds) {
      const sourceFile = path.join(this.workingContextDir, `${id}.md`);
      const archiveFile = path.join(this.longTermArchiveDir, `${id}.md`);

      if (fs.existsSync(sourceFile)) {
        // 移动到存档
        fs.renameSync(sourceFile, archiveFile);

        // 更新索引
        if (index.memories[id]) {
          index.memories[id].archived = true;
          index.memories[id].archivedAt = Date.now();
        }
        archived.push(id);
        this.stats.longTermArchived++;
      }
    }

    this._saveIndex(index);

    // 从工作上下文移除
    this.workingContext.loaded = this.workingContext.loaded.filter(id => !archived.includes(id));

    console.log(`[TrialityMemory] 存档 ${archived.length} 条记忆到长期存储`);
    return archived;
  }

  /**
   * 获取工作上下文中已加载的记忆
   * @returns {Array} 记忆文本内容列表
   */
  getWorkingContext() {
    const memories = [];
    for (const id of this.workingContext.loaded) {
      const file = path.join(this.workingContextDir, `${id}.md`);
      if (fs.existsSync(file)) {
        memories.push({
          id,
          content: fs.readFileSync(file, 'utf8')
        });
      }
    }
    return memories;
  }

  /**
   * 记录对话到文本
   * @param {Object} conversation 对话对象
   */
  logConversation(conversation) {
    try {
      const id = conversation.id || `conv-${Date.now()}`;
      const timestamp = Date.now();
      const filename = `${id}.md`;
      const filepath = path.join(this.conversationLogDir, filename);

      const lines = [
        `# Conversation: ${id}`,
        '',
        `## 元信息`,
        `- **开始时间**: ${conversation.startTime || new Date(timestamp).toISOString()}`,
        `- **结束时间**: ${conversation.endTime || '进行中'}`,
        `- **消息数**: ${conversation.messages?.length || 0}`,
        '',
        `## 对话内容`,
        ''
      ];

      if (conversation.messages) {
        for (const msg of conversation.messages) {
          lines.push(`### ${msg.role || 'user'}`);
          lines.push(msg.content || '');
          lines.push('');
        }
      }

      lines.push(`---`);
      lines.push(`*此对话由 TrialityMemory 自动记录 - ${new Date().toISOString()}*`);

      atomicWriteSync(filepath, lines.join('\n'));

      // 更新索引
      const index = this._loadIndex();
      index.conversations[id] = {
        id,
        file: filename,
        timestamp,
        messageCount: conversation.messages?.length || 0
      };
      this._saveIndex(index);

      console.log(`[TrialityMemory] 对话记录: ${id} (${conversation.messages?.length || 0} 条消息)`);
      return id;

    } catch (error) {
      console.error(`[TrialityMemory] 对话记录失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取所有对话记录
   * @param {number} limit 返回数量限制
   * @returns {Array} 对话列表
   */
  getConversations(limit = 50) {
    const index = this._loadIndex();
    const conversations = Object.values(index.conversations)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return conversations.map(conv => ({
      id: conv.id,
      file: conv.file,
      timestamp: conv.timestamp,
      messageCount: conv.messageCount,
      path: path.join(this.conversationLogDir, conv.file)
    }));
  }

  /**
   * 加载存档记忆到工作上下文
   * @param {string} memoryId 记忆ID
   */
  restoreFromArchive(memoryId) {
    const archiveFile = path.join(this.longTermArchiveDir, `${memoryId}.md`);
    const workingFile = path.join(this.workingContextDir, `${memoryId}.md`);

    if (fs.existsSync(archiveFile)) {
      fs.renameSync(archiveFile, workingFile);

      // 更新索引
      const index = this._loadIndex();
      if (index.memories[memoryId]) {
        index.memories[memoryId].archived = false;
        delete index.memories[memoryId].archivedAt;
      }
      this._saveIndex(index);

      // 添加到工作上下文
      if (!this.workingContext.loaded.includes(memoryId)) {
        this.workingContext.loaded.push(memoryId);
      }

      console.log(`[TrialityMemory] 从存档恢复记忆: ${memoryId}`);
      return true;
    }
    return false;
  }

  /**
   * 检索并加载相关记忆到工作上下文
   * @param {string} query 查询文本
   * @param {number} topK 加载数量
   */
  retrieveAndLoad(query, topK = 10) {
    // 使用 recall 方法查找相关记忆
    const results = this.recall({ text: query, topK });

    const loadedIds = [];
    for (const result of results) {
      if (!this.workingContext.loaded.includes(result.id)) {
        // 如果在存档中，先恢复
        if (result.archived) {
          this.restoreFromArchive(result.id);
        }
        loadedIds.push(result.id);
      }
    }

    console.log(`[TrialityMemory] 检索并加载 ${loadedIds.length} 条相关记忆`);
    return loadedIds;
  }

  /**
   * 获取存储统计
   */
  getStorageStats() {
    const index = this._loadIndex();

    const countFiles = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      return fs.readdirSync(dir).filter(f => f.endsWith('.md')).length;
    };

    return {
      totalMemories: Object.keys(index.memories).length,
      archivedMemories: Object.values(index.memories).filter(m => m.archived).length,
      activeMemories: Object.values(index.memories).filter(m => !m.archived).length,
      workingContextSize: this.workingContext.loaded.length,
      conversationCount: Object.keys(index.conversations).length,
      directories: {
        textBase: this.textBaseDir,
        working: this.workingContextDir,
        archive: this.longTermArchiveDir,
        conversations: this.conversationLogDir
      },
      files: {
        working: countFiles(this.workingContextDir),
        archive: countFiles(this.longTermArchiveDir),
        conversations: countFiles(this.conversationLogDir)
      }
    };
  }

  // === 原有方法保持不变 ===

  generateId() {
    return `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * 生成嵌入 - 优先用 embedder，fallback 到 SHA256
   */
  generateMockEmbedding(content) {
    const ed = this._getEmbedder();
    if (ed) {
      return ed.generateHashEmbedding(content, this.vectorDim);
    }
    // 内联 SHA256 fallback
    const hash = crypto.createHash('sha256').update(content).digest();
    const embedding = [];
    for (let i = 0; i < this.vectorDim; i++) {
      embedding.push((hash[i % hash.length] / 255) * 2 - 1);
    }
    return embedding;
  }

  _getEmbedder() {
    if (!this._embedder) {
      try {
        this._embedder = require('../embedder.js');
      } catch (e) {
        this._embedder = null;
      }
    }
    return this._embedder;
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

  consolidateMemories() {
    const promoted = [];
    const merged = [];
    const now = Date.now();

    for (const mem of this.memories) {
      // 访问频率加权：高频访问的记忆 importance 随时间累积
      const hoursSinceAccess = (now - (mem.updatedAt || mem.createdAt)) / (1000 * 60 * 60);
      if (mem.accessCount > 5 && hoursSinceAccess < 24) {
        mem.importance += Math.min(mem.accessCount * 0.5, 8);
      }

      if (mem.layer === 'working' && mem.importance >= 16) {
        mem.layer = 'semantic';
        promoted.push(mem.id);
      } else if (mem.layer === 'working' && mem.importance >= 12) {
        mem.layer = 'episodic';
        promoted.push(mem.id);
      }

      // 语义去重：相似度 > 0.85 的记忆合并
      const duplicates = this.memories.filter(other => {
        if (other.id === mem.id) return false;
        if (other.summary === mem.summary) return true; // 精确匹配优先
        // 语义相似度检查
        if (mem.embedding && other.embedding) {
          const sim = this._cosineSimilarity(mem.embedding, other.embedding);
          return sim > 0.85;
        }
        return false;
      });
      if (duplicates.length > 0) {
        mem.accessCount += duplicates.reduce((sum, d) => sum + d.accessCount, 0);
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

  /**
   * 健康评分仪表板 (参考 Dream Cycle 五维评分)
   * - Freshness (25%): 7天内记忆占比
   * - Coverage (25%): 有存档页面的聚类占比
   * - Coherence (20%): 非单例聚类占比
   * - Efficiency (15%): 去重率
   * - Reachability (15%): 有图连接的实体占比
   */
  getHealthScore() {
    const now = Date.now() * 1000;
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Freshness: 7天内记忆占比
    const recentMemories = this.memories.filter(m => m.timestamp >= sevenDaysAgo);
    const freshness = this.memories.length > 0 
      ? (recentMemories.length / this.memories.length) * 100 
      : 0;
    
    // Coverage: 基于有访问记录的实体占比估算
    const accessedEntities = this.memories.filter(m => (m.accessCount || 0) > 0);
    const coverage = this.memories.length > 0 
      ? (accessedEntities.length / this.memories.length) * 100 
      : 0;
    
    // Coherence: 有相似记忆的占比(非单例)
    const similarPairs = this.memories.filter(m => (m.mergedWith || m.similarity));
    const coherence = this.memories.length > 0 
      ? Math.min(100, (similarPairs.length / this.memories.length) * 100) 
      : 0;
    
    // Efficiency: 基于压缩/合并操作的去重估算
    const compressedOrMerged = this.memories.filter(m => m.compressed || m.mergedWith);
    const efficiency = this.memories.length > 0 
      ? Math.min(100, (compressedOrMerged.length / this.memories.length) * 100) 
      : 0;
    
    // Reachability: 基于关系连接的实体占比
    const connectedEntities = new Set();
    for (const [sourceId, rels] of this.relationships) {
      if (rels && rels.length > 0) {
        connectedEntities.add(sourceId);
        rels.forEach(r => connectedEntities.add(r.targetId));
      }
    }
    const reachability = this.memories.length > 0 
      ? Math.min(100, (connectedEntities.size / this.memories.length) * 100) 
      : 0;
    
    // 综合评分
    const overall = (
      freshness * 0.25 +
      coverage * 0.25 +
      coherence * 0.20 +
      efficiency * 0.15 +
      reachability * 0.15
    );
    
    return {
      overall: Math.round(overall * 10) / 10,
      breakdown: {
        freshness: { score: Math.round(freshness * 10) / 10, weight: 25, label: '新鲜度' },
        coverage: { score: Math.round(coverage * 10) / 10, weight: 25, label: '覆盖率' },
        coherence: { score: Math.round(coherence * 10) / 10, weight: 20, label: '一致性' },
        efficiency: { score: Math.round(efficiency * 10) / 10, weight: 15, label: '去重效率' },
        reachability: { score: Math.round(reachability * 10) / 10, weight: 15, label: '可达性' }
      },
      stats: {
        totalMemories: this.memories.length,
        recentMemories: recentMemories.length,
        connectedEntities: connectedEntities.size,
        relationships: this.relationships.size
      }
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
      const memory = this.memoryIndex.get(id);
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

  // === 增强检索 (recall) - 模拟 cognee 架构 ===
  // 多路召回 + 重排序，显著提升检索命中率

  /**
   * recall - 多路召回检索
   * 
   * 灵感来源: cognee 的 recall API (16K Stars)
   * 结合向量搜索 + 关键词匹配 + 时间衰减
   * 
   * @param {Object} query 查询对象
   * @param {string} query.text 查询文本
   * @param {number} query.topK 返回数量 (默认 10)
   * @param {number} query.vectorWeight 向量权重 (默认 0.5)
   * @param {number} query.keywordWeight 关键词权重 (默认 0.3)
   * @param {number} query.timeWeight 时间权重 (默认 0.2)
   * @returns {Array} 排序后的记忆列表
   */
  recall(query) {
    const {
      text,
      topK = 10,
      vectorWeight = 0.5,
      keywordWeight = 0.3,
      timeWeight = 0.2
    } = query;

    if (!text || text.trim() === '') {
      return this.getRecentNarrative(topK);
    }

    // SwiftMem: LRU 缓存查询
    const cached = this._getCachedRecall(text);
    if (cached) {
      return cached.slice(0, topK);
    }

    const now = Date.now() * 1000;

    // 1. 向量搜索召回
    const queryEmbedding = this.generateMockEmbedding(text);
    const vectorResults = this.semanticSearch(queryEmbedding, topK * 2);
    const vectorScores = new Map(vectorResults.map(r => [r.id, r.similarity]));

    // 2. 关键词匹配召回
    const keywordResults = this._keywordSearch(text, topK * 2);
    const keywordScores = new Map(keywordResults.map(r => [r.id, r.keywordScore]));

    // 3. SwiftMem 时序索引: 利用 temporalIndex 加速候选筛选
    const timeScores = new Map();
    const recentWindows = this._getRecentTemporalWindows(24); // 最近24小时窗口
    for (const window of recentWindows) {
      const memIds = this.temporalIndex.get(window) || [];
      for (const id of memIds) {
        const mem = this.memoryIndex.get(id);
        if (!mem) continue;
        const ageHours = (now - mem.timestamp) / (1000 * 60 * 60);
        const timeScore = 1 / (1 + Math.log1p(ageHours / 24));
        timeScores.set(id, timeScore);
      }
    }

    // 4. 多路分数融合
    const allCandidateIds = new Set([...vectorScores.keys(), ...keywordScores.keys()]);

    const fusedResults = [];
    for (const id of allCandidateIds) {
      const memory = this.memoryIndex.get(id);
      if (!memory || memory.compressed) continue;

      const vecScore = vectorScores.get(id) || 0;
      const kwScore = keywordScores.get(id) || 0;
      const tmScore = timeScores.get(id) || 0;

      const fusedScore = vecScore * vectorWeight + kwScore * keywordWeight + tmScore * timeWeight;

      fusedResults.push({ ...memory, scores: { vector: vecScore, keyword: kwScore, time: tmScore, fused: fusedScore } });
    }

    fusedResults.sort((a, b) => b.scores.fused - a.scores.fused);
    const results = fusedResults.slice(0, topK);

    console.log(`[TrialityMemory] recall: ${results.length}/${this.memories.length} 候选, 查询: "${text.substring(0, 30)}..."`);

    // SwiftMem: 缓存结果
    this._setCachedRecall(text, results);

    return results;
  }

  _getRecentTemporalWindows(hours) {
    const now = Date.now() * 1000;
    const currentWindow = Math.floor(now / (1000 * 60 * 60));
    const windows = [];
    for (let i = 0; i <= hours; i++) {
      windows.push(currentWindow - i);
    }
    return windows;
  }

  _keywordSearch(text, topK) {
    const keywords = this._extractKeywords(text);
    const results = [];
    for (const mem of this.memories) {
      if (mem.compressed) continue;
      let matchCount = 0;
      const memText = (mem.content || '').toLowerCase();
      const memSummary = (mem.summary || '').toLowerCase();
      for (const kw of keywords) {
        if (memText.includes(kw) || memSummary.includes(kw)) matchCount++;
      }
      if (matchCount > 0) {
        const density = matchCount / keywords.length;
        const keywordScore = density * Math.min(matchCount / 2, 1);
        results.push({ id: mem.id, keywordScore });
      }
    }
    results.sort((a, b) => b.keywordScore - a.keywordScore);
    return results.slice(0, topK);
  }

  _extractKeywords(text) {
    const stopWords = new Set(['的', '了', '是', '在', '和', '与', 'the', 'a', 'an', 'is', 'are', 'and', 'or', 'but', 'to', 'of', 'in']);
    const words = text.toLowerCase().split(/[\s,.!?;:，。！？；：]+/);
    return words.filter(w => w.length > 1 && !stopWords.has(w)).slice(0, 10);
  }

  forget(options = {}) {
    const { maxAge = 30 * 24 * 60 * 60 * 1000, minImportance = 5, maxMemories = 1000 } = options;
    const before = this.memories.length;
    const now = Date.now() * 1000;
    const cutoff = now - maxAge * 1000;

    this.memories = this.memories.filter(mem => {
      if (mem.accessCount > 10) return true;
      if (mem.importance > minImportance + 5) return true;
      if (mem.timestamp > cutoff && mem.importance >= minImportance) return true;
      return false;
    });

    if (this.memories.length > maxMemories) {
      this.memories.sort((a, b) => b.importance - a.importance);
      this.memories = this.memories.slice(0, maxMemories);
    }

    const validIds = new Set(this.memories.map(m => m.id));
    for (const [sourceId, rels] of this.relationships) {
      this.relationships.set(sourceId, rels.filter(r => validIds.has(r.targetId)));
    }

    const removed = before - this.memories.length;
    console.log(`[TrialityMemory] forget: 移除 ${removed} 条记忆, 剩余 ${this.memories.length}`);
    return { removed, remaining: this.memories.length };
  }

  // === improve - 自我改进 (Mem0 风格) ===
  // 根据使用反馈自动优化记忆质量

  /**
   * improve - 自我改进记忆
   * 
   * 灵感来源: Mem0 的 self-improvement 机制
   * 通过分析记忆使用情况，自动提升高价值记忆、合并相似记忆
   */
  improve(options = {}) {
    const { 
      feedbackThreshold = 0.3,  // 反馈阈值
      mergeSimilarity = 0.85,   // 相似度阈值
      boostFactor = 1.5        // 重要性提升因子
    } = options;

    const startTime = Date.now();
    const results = {
      boosted: [],      // 重要性提升的记忆
      merged: [],       // 合并的记忆
      degraded: [],     // 降级的记忆
      removed: []      // 删除的记忆
    };

    console.log(`[TrialityMemory] improve: 开始自我改进...`);

    // 1. 根据访问频率提升重要记忆
    for (const mem of this.memories) {
      if (mem.accessCount >= 5 && mem.importance < 20) {
        const oldImportance = mem.importance;
        mem.importance = Math.min(30, Math.floor(mem.importance * boostFactor));
        results.boosted.push({ id: mem.id, old: oldImportance, new: mem.importance });
      }
    }

    // 2. 合并高度相似的记忆
    const toMerge = [];
    for (let i = 0; i < this.memories.length; i++) {
      for (let j = i + 1; j < this.memories.length; j++) {
        const memA = this.memories[i];
        const memB = this.memories[j];
        
        if (memA.mergedWith || memB.mergedWith) continue;
        
        const similarity = this._calculateContentSimilarity(memA.content, memB.content);
        if (similarity >= mergeSimilarity) {
          toMerge.push([memA, memB, similarity]);
        }
      }
    }

    for (const [memA, memB, similarity] of toMerge) {
      // 保留内容更丰富的，合并元数据
      const [keep, remove] = memA.content.length >= memB.content.length ? [memA, memB] : [memB, memA];
      
      keep.accessCount = (keep.accessCount || 0) + (remove.accessCount || 0);
      keep.importance = Math.max(keep.importance, remove.importance);
      keep.mergedWith = remove.id;
      
      results.merged.push({
        keep: keep.id,
        remove: remove.id,
        similarity: similarity.toFixed(2)
      });

      // 标记为已删除
      remove.deleted = true;
    }

    // 3. 删除被标记的记忆
    const beforeCount = this.memories.length;
    this.memories = this.memories.filter(mem => !mem.deleted);
    results.removed = this.memories.filter(mem => mem.deleted).map(m => m.id);

    // 4. 更新关系
    const validIds = new Set(this.memories.map(m => m.id));
    for (const [sourceId, rels] of this.relationships) {
      this.relationships.set(sourceId, rels.filter(r => validIds.has(r.targetId)));
    }

    results.duration = Date.now() - startTime;
    results.stats = {
      total: this.memories.length,
      boosted: results.boosted.length,
      merged: results.merged.length,
      removed: beforeCount - this.memories.length
    };

    console.log(`[TrialityMemory] improve: 完成`);
    console.log(`   - 提升: ${results.boosted.length}, 合并: ${results.merged.length}, 删除: ${results.stats.removed}`);

    return results;
  }

  /**
   * 计算内容相似度
   * @private
   */
  _calculateContentSimilarity(contentA, contentB) {
    if (!contentA || !contentB) return 0;
    
    const textA = contentA.toLowerCase();
    const textB = contentB.toLowerCase();
    
    // 简单的词重叠相似度
    const wordsA = new Set(textA.split(/[\s,.!?;:，。！？；：]+/).filter(w => w.length > 2));
    const wordsB = new Set(textB.split(/[\s,.!?;:，。！？；：]+/).filter(w => w.length > 2));
    
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    
    const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    
    return intersection.size / union.size;
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

  // === 决策分析 (Decision Analysis) ===
  // 灵感来源: STRIDE 分层决策框架 (SIGIR 2026)
  // 分析记忆中的决策模式，评估决策质量

  /**
   * analyzeDecisions - 分析决策模式
   *
   * 基于分层决策框架分析记忆中的决策
   * @param {Object} options 分析选项
   * @returns {Object} 决策分析结果
   */
  analyzeDecisions(options = {}) {
    const { minConfidence = 0.5, topK = 10 } = options;

    const startTime = Date.now();
    const decisions = [];
    const patterns = {
      strategic: [],   // 战略性决策
      tactical: [],   // 战术性决策
      operational: [] // 操作性决策
    };

    // 分析每条记忆中的决策内容
    for (const mem of this.memories) {
      if (mem.compressed) continue;

      // 简单的决策检测 - 查找包含决策关键词的记忆
      const content = (mem.content || '').toLowerCase();
      const decisionIndicators = ['决定', '选择', '策略', '方案', '计划', '决策', 'choose', 'decision', 'strategy', 'plan'];

      const hasDecision = decisionIndicators.some(ind => content.includes(ind));
      if (!hasDecision) continue;

      // 评估决策质量分数
      const qualityScore = this._evaluateDecisionQuality(mem);

      if (qualityScore >= minConfidence) {
        decisions.push({
          id: mem.id,
          content: mem.content?.substring(0, 200),
          quality: qualityScore,
          importance: mem.importance,
          timestamp: mem.timestamp
        });

        // 分类到不同层级
        if (content.includes('战略') || content.includes('长期') || content.includes('目标')) {
          patterns.strategic.push(mem.id);
        } else if (content.includes('战术') || content.includes('中期') || content.includes('阶段')) {
          patterns.tactical.push(mem.id);
        } else {
          patterns.operational.push(mem.id);
        }
      }
    }

    // 按质量排序
    decisions.sort((a, b) => b.quality - a.quality);

    const results = {
      totalDecisions: decisions.length,
      topDecisions: decisions.slice(0, topK),
      patterns,
      summary: {
        strategic: patterns.strategic.length,
        tactical: patterns.tactical.length,
        operational: patterns.operational.length
      },
      recommendations: this._generateDecisionRecommendations(patterns),
      duration: Date.now() - startTime
    };

    console.log(`[TrialityMemory] analyzeDecisions: 发现 ${decisions.length} 个决策, ${patterns.strategic.length} 战略/${patterns.tactical.length} 战术/${patterns.operational.length} 操作`);

    return results;
  }

  /**
   * 评估决策质量
   * @private
   */
  _evaluateDecisionQuality(memory) {
    let score = 0.5; // 基础分数

    // 重要记忆中的决策更有价值
    if (memory.importance > 15) score += 0.1;
    if (memory.importance > 20) score += 0.1;

    // 有关系链的决策更完整
    const relations = this.relationships.get(memory.id);
    if (relations && relations.length > 0) score += 0.1;
    if (relations && relations.length > 2) score += 0.1;

    // 高访问次数说明决策被验证过
    if (memory.accessCount > 3) score += 0.1;
    if (memory.accessCount > 5) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * 生成决策建议
   * @private
   */
  _generateDecisionRecommendations(patterns) {
    const recommendations = [];

    // 如果战略决策太少，说明缺乏长期规划
    if (patterns.strategic.length < 2) {
      recommendations.push({
        type: 'strategic',
        issue: '战略决策不足',
        suggestion: '建议增加长期目标和规划的记录'
      });
    }

    // 如果操作决策太多，说明可能在战术层面思考不足
    if (patterns.operational.length > patterns.strategic.length * 3) {
      recommendations.push({
        type: 'operational',
        issue: '操作决策过多',
        suggestion: '建议更多关注战略性思考，减少执行细节的过度记录'
      });
    }

    return recommendations;
  }

  narrativeQuery(query) {
    const {
      startMemoryId,
      direction = 'forward',
      relationTypes = ['causal', 'quotes', 'similar', 'related'],
      maxDepth = 5,
      maxNodes = 50,
      analyzePaths = false  // v11.23.4+ 新增：路径分析
    } = query;

    if (!startMemoryId) {
      return this.getRecentNarrative(maxNodes);
    }

    const visited = new Set();
    const narrative = [];
    const queue = [{ id: startMemoryId, depth: 0 }];

    // v11.23.4+ 路径分析：计算度数中心性
    const degreeCentrality = new Map();

    while (queue.length > 0 && narrative.length < maxNodes) {
      const current = queue.shift();

      if (visited.has(current.id) || current.depth > maxDepth) continue;
      const memory = this.memoryIndex.get(current.id);

      if (memory) {
        narrative.push({ ...memory, depth: current.depth });
      }

      const relations = this.relationships.get(current.id) || [];

      // 更新出度中心性
      const outDegree = relations.filter(r => relationTypes.includes(r.relationType) || relationTypes.includes('all')).length;
      degreeCentrality.set(current.id, (degreeCentrality.get(current.id) || 0) + outDegree);

      for (const rel of relations) {
        if (relationTypes.includes(rel.relationType) || relationTypes.includes('all')) {
          if (!visited.has(rel.targetId)) {
            queue.push({ id: rel.targetId, depth: current.depth + 1 });
            // 更新入度中心性
            degreeCentrality.set(rel.targetId, (degreeCentrality.get(rel.targetId) || 0) + 1);
          }
        }
      }

      if (direction === 'bidirectional') {
        for (const [sourceId, rels] of this.relationships) {
          for (const rel of rels) {
            if (rel.targetId === current.id && !visited.has(sourceId)) {
              if (relationTypes.includes(rel.relationType) || relationTypes.includes('all')) {
                queue.push({ id: sourceId, depth: current.depth + 1 });
                degreeCentrality.set(sourceId, (degreeCentrality.get(sourceId) || 0) + 1);
              }
            }
          }
        }
      }
    }

    narrative.sort((a, b) => a.timestamp - b.timestamp);

    // v11.23.4+ 返回路径分析结果
    if (analyzePaths) {
      const topBridgeNodes = [...degreeCentrality.entries()]
        .filter(([id]) => narrative.some(n => n.id === id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, degree]) => ({ id, degree, memory: narrative.find(n => n.id === id) }));

      console.log(`[TrialityMemory] 叙事查询: ${narrative.length} 个记忆节点, ${topBridgeNodes.length} 个桥接节点`);
      return { narrative, bridges: topBridgeNodes, centrality: degreeCentrality };
    }

    console.log(`[TrialityMemory] 叙事查询: ${narrative.length} 个记忆节点`);
    return narrative;
  }

  /**
   * 获取近期叙事记忆（v11.24.006+ 语义重排）
   * 结合时间接近度和语义相关性进行排序
   * @param {number} count 返回数量
   * @param {string} contextQuery 可选的上下文查询，用于语义重排
   */
  getRecentNarrative(count = 20, contextQuery = null) {
    const now = Date.now();
    const recencyWeight = 0.6;  // 时间权重
    const semanticWeight = 0.4; // 语义权重

    let memoriesWithScore = this.memories.map(m => {
      // 时间得分：越近越高，7天外为0
      const ageHours = (now - m.timestamp) / 1000 / (1000 * 60 * 60);
      const recencyScore = Math.max(0, 1 - ageHours / (24 * 7));

      // 访问次数加成（高频访问的记忆更有价值）
      const accessBonus = Math.min(m.accessCount / 20, 1) * 0.2;

      // 重要性加成
      const importanceBonus = (m.importance || 0.5) * 0.2;

      // 基础分数
      let baseScore = recencyScore * recencyWeight + accessBonus + importanceBonus;

      // 语义相似度（如果提供了contextQuery）
      let semanticScore = 0;
      if (contextQuery && m.embedding) {
        semanticScore = this._cosineSimilarity(
          this.generateMockEmbedding(contextQuery),
          m.embedding
        );
        baseScore = recencyWeight * recencyScore + semanticWeight * semanticScore + accessBonus + importanceBonus;
      }

      return {
        ...m,
        depth: 0,
        _recencyScore: recencyScore,
        _semanticScore: semanticScore,
        _finalScore: baseScore
      };
    });

    // 按综合分数排序
    memoriesWithScore.sort((a, b) => b._finalScore - a._finalScore);

    return memoriesWithScore.slice(0, count);
  }

  /**
   * 计算向量余弦相似度（v11.24.006+）
   * @private
   */
  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dot / denominator;
  }

  // === SwiftMem 查询感知索引 (v0.13.10) ===

  /** 时序索引: 将记忆按时间窗口索引 */
  _indexMemoryTemporal(memoryRecord) {
    const window = Math.floor(memoryRecord.timestamp / (1000 * 60 * 60)); // 1小时窗口
    if (!this.temporalIndex.has(window)) {
      this.temporalIndex.set(window, []);
    }
    this.temporalIndex.get(window).push(memoryRecord.id);
  }

  /** 标签索引: 从记忆元数据提取标签并建立倒排索引 */
  _indexMemoryByTag(memoryRecord) {
    const tags = memoryRecord.metadata?.tags || [];
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag).add(memoryRecord.id);
    }
  }

  /** 语义DAG索引: 按主题/话题分层 */
  _indexMemoryByTopic(memoryRecord) {
    const topic = memoryRecord.metadata?.topic || 'general';
    if (!this.semanticDAG.has(topic)) {
      this.semanticDAG.set(topic, { subtopics: new Set(), memoryIds: [] });
    }
    if (!this.semanticDAG.get(topic).memoryIds.includes(memoryRecord.id)) {
      this.semanticDAG.get(topic).memoryIds.push(memoryRecord.id);
    }
  }

  /** 检索结果缓存 (LRU) */
  _getCachedRecall(queryText) {
    return this.recallCache.get(queryText) || null;
  }

  _setCachedRecall(queryText, results) {
    if (this.recallCache.size >= this.recallCacheMax) {
      // 淘汰最老的条目
      const firstKey = this.recallCache.keys().next().value;
      this.recallCache.delete(firstKey);
    }
    this.recallCache.set(queryText, results);
  }

  /** 时序范围查询 (对数时间) */
  queryByTimeRangeIndexed(startTime, endTime) {
    const startWindow = Math.floor(startTime / (1000 * 60 * 60));
    const endWindow = Math.floor(endTime / (1000 * 60 * 60));
    const ids = [];
    for (const [window, memIds] of this.temporalIndex) {
      if (window >= startWindow && window <= endWindow) {
        ids.push(...memIds);
      }
    }
    return ids.map(id => this.memoryIndex.get(id)).filter(Boolean);
  }

  /** 按标签检索 (O(1) 标签匹配) */
  queryByTags(tags) {
    if (!tags || tags.length === 0) return [];
    let resultSets = tags.map(tag => this.tagIndex.get(tag) || new Set());
    // 取交集
    const intersection = new Set();
    for (const id of resultSets[0]) {
      if (resultSets.every(s => s.has(id))) {
        intersection.add(id);
      }
    }
    return Array.from(intersection).map(id => this.memoryIndex.get(id)).filter(Boolean);
  }

  /** 按主题检索 (DAG遍历) */
  queryByTopic(topic) {
    const node = this.semanticDAG.get(topic);
    if (!node) return [];
    const ids = [...node.memoryIds];
    // 递归获取子主题
    for (const sub of node.subtopics) {
      ids.push(...this.queryByTopic(sub));
    }
    return ids.map(id => this.memoryIndex.get(id)).filter(Boolean);
  }

  // === SwiftMem recall: 查询感知优化 ===



  queryByTimeRange(startTime, endTime) {
    return this.memories
      .filter(m => m.timestamp >= startTime && m.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp);
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
    const data = {
      memories: this.memories,
      relationships: Array.from(this.relationships.entries()),
      exportedAt: new Date().toISOString()
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`[TrialityMemory] 导出到: ${filePath}`);
    return { success: true, count: this.memories.length };
  }

  importFromFile(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.memories) {
      for (const mem of data.memories) {
        this.store(mem);
      }
    }
    console.log(`[TrialityMemory] 从 ${filePath} 导入`);
    return { success: true, count: data.memories?.length || 0 };
  }

  cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() * 1000 - maxAge;
    const before = this.memories.length;
    this.memories = this.memories.filter(m => m.timestamp > cutoff);
    this.stats.lastCleanup = new Date().toISOString();
    const removed = before - this.memories.length;
    console.log(`[TrialityMemory] 清理: 移除 ${removed} 条旧记忆`);
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
    for (const id of toDelete) {
      this.memoryIndex.delete(id); // 同步清理内存索引
      // 清理 SwiftMem 索引
      for (const [window, ids] of this.temporalIndex) {
        const idx = ids.indexOf(id);
        if (idx !== -1) ids.splice(idx, 1);
      }
    }

    // 标记压缩
    for (const id of toCompress) {
      const mem = this.memoryIndex.get(id);
      if (mem) mem.compressed = true;
    }

    console.log(`[TrialityMemory] 遗忘曲线清理: 删除 ${toDelete.length} 条, 压缩 ${toCompress.length} 条`);
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
      layers: this.getLayerStats()
    };
  }

  // === 梦境整合 (Dream Consolidation) ===
  // 灵感来源: 人类睡眠周期的记忆整合机制
  // 参考: Zolobaby/autodream, 人类REM睡眠研究

  /**
   * 梦境整合 - 模拟人类睡眠周期的记忆巩固
   * 
   * 睡眠周期阶段:
   * - NREM Stage 1-2: 记忆过滤与初步整合
   * - NREM Stage 3 (深度睡眠): 记忆巩固与结构化
   * - REM (快速眼动): 情感记忆整合与梦境生成
   * 
   * @param {Object} options 配置选项
   * @param {number} options.cycleCount 模拟睡眠周期数 (默认 4)
   * @param {number} options.remIntensity REM阶段强度 0-1 (默认 0.7)
   * @param {boolean} options.generateDreams 是否生成梦境片段 (默认 true)
   * @returns {Object} 整合结果
   */
  dreamConsolidation(options = {}) {
    const {
      cycleCount = 4,
      remIntensity = 0.7,
      generateDreams = true
    } = options;

    const startTime = Date.now();
    const results = {
      cycles: [],
      newRelationships: [],
      promotedMemories: [],
      dreamFragments: [],
      memoryChanges: { compressed: 0, promoted: 0, connectionsFormed: 0 }
    };

    console.log(`[DreamConsolidation] 🚀 开始梦境整合 (${cycleCount} 个睡眠周期)`);

    for (let cycle = 1; cycle <= cycleCount; cycle++) {
      const cycleResult = this._processSleepCycle(cycle, cycleCount, remIntensity);
      results.cycles.push(cycleResult);
      
      // 累加变化
      results.memoryChanges.compressed += cycleResult.compressed;
      results.memoryChanges.promoted += cycleResult.promoted;
      results.memoryChanges.connectionsFormed += cycleResult.connectionsFormed;
      results.newRelationships.push(...cycleResult.newConnections);
      results.promotedMemories.push(...cycleResult.promoted);
      
      if (generateDreams && cycleResult.dreamFragment) {
        results.dreamFragments.push(cycleResult.dreamFragment);
      }

      // 记忆层级更新
      this._updateMemoryLayers();
    }

    // 生成梦境报告
    results.duration = Date.now() - startTime;
    results.dreamNarrative = this._generateDreamNarrative(results);
    results.stats = this.getStats();

    console.log(`[DreamConsolidation] ✅ 梦境整合完成`);
    console.log(`   - 记忆压缩: ${results.memoryChanges.compressed}`);
    console.log(`   - 记忆提升: ${results.memoryChanges.promoted}`);
    console.log(`   - 新连接: ${results.memoryChanges.connectionsFormed}`);
    console.log(`   - 梦境片段: ${results.dreamFragments.length}`);

    return results;
  }

  /**
   * 处理单个睡眠周期
   * @private
   */
  _processSleepCycle(cycleNum, totalCycles, remIntensity) {
    const isREM = cycleNum % 2 === 0; // 偶数周期 = REM
    const isDeepSleep = cycleNum % 3 === 0; // 每3周期一次深度睡眠
    
    const result = {
      cycle: cycleNum,
      phase: isREM ? 'REM' : (isDeepSleep ? 'NREM-Deep' : 'NREM-Light'),
      compressed: 0,
      promotedCount: 0,
      connectionsFormed: 0,
      newConnections: [],
      promoted: [],
      dreamFragment: null
    };

    // NREM Stage 1-2: 记忆过滤
    if (!isREM) {
      const filtered = this._filterWeakMemories();
      result.compressed = filtered.length;
      
      // 标记被压缩的记忆
      for (const memId of filtered) {
        const mem = this.memoryIndex.get(memId);
        if (mem) mem.compressed = true;
      }
    }

    // NREM Stage 3 (深度睡眠): 记忆巩固
    if (isDeepSleep) {
      const promoted = this._promoteImportantMemories();
      result.promoted = promoted.length;
      result.promoted.push(...promoted);
    }

    // REM 阶段: 情感记忆整合与梦境生成
    if (isREM) {
      // 随机连接相似记忆
      const connections = this._formUnexpectedConnections(remIntensity);
      result.connectionsFormed = connections.length;
      result.newConnections.push(...connections);

      // 生成梦境片段
      if (cycleNum > 1) { // 跳过第一个周期
        result.dreamFragment = this._generateDreamFragment(cycleNum);
      }
    }

    return result;
  }

  /**
   * 过滤弱记忆 (NREM Stage 1-2)
   * @private
   */
  _filterWeakMemories() {
    const weakMemoryIds = [];
    const now = Date.now() * 1000;
    const retentionThreshold = 0.4;

    for (const mem of this.memories) {
      if (mem.compressed) continue; // 已压缩跳过
      
      const timeElapsed = now - mem.timestamp;
      const retention = this.ebbinghausForget(mem, timeElapsed).retention;
      
      // 低重要度 + 低保留率 = 压缩
      if (mem.importance < 10 && retention < retentionThreshold) {
        weakMemoryIds.push(mem.id);
      }
    }

    return weakMemoryIds;
  }

  /**
   * 提升重要记忆 (NREM Stage 3)
   * @private
   */
  _promoteImportantMemories() {
    const promotedIds = [];

    for (const mem of this.memories) {
      if (mem.layer === 'semantic') continue; // 已在最高层
      
      // 高重要度 + 高访问 = 提升
      if (mem.importance >= 15 && mem.accessCount >= 3) {
        if (mem.layer === 'working') {
          mem.layer = 'episodic';
          promotedIds.push(mem.id);
        } else if (mem.layer === 'episodic') {
          mem.layer = 'semantic';
          promotedIds.push(mem.id);
        }
      }
    }

    return promotedIds;
  }

  /**
   * 形成意外连接 (REM)
   * @private
   */
  _formUnexpectedConnections(intensity) {
    const newConnections = [];
    const eligibleMemories = this.memories.filter(m => !m.compressed);
    
    if (eligibleMemories.length < 3) return newConnections;

    // 随机选择一些记忆形成新连接
    const connectionCount = Math.floor(eligibleMemories.length * intensity * 0.15);
    
    for (let i = 0; i < connectionCount; i++) {
      const sourceIdx = Math.floor(Math.random() * eligibleMemories.length);
      const targetIdx = Math.floor(Math.random() * eligibleMemories.length);
      
      if (sourceIdx === targetIdx) continue;
      
      const source = eligibleMemories[sourceIdx];
      const target = eligibleMemories[targetIdx];
      
      // 检查是否已存在连接
      const existingRels = this.relationships.get(source.id) || [];
      const hasExisting = existingRels.some(r => r.targetId === target.id);
      
      if (!hasExisting) {
        const relationTypes = ['similar', 'associated', 'contrasts', 'reminds'];
        const relType = relationTypes[Math.floor(Math.random() * relationTypes.length)];
        
        const relId = this.addRelationship({
          sourceId: source.id,
          targetId: target.id,
          relationType: relType,
          strength: 0.3 + Math.random() * 0.4 // 0.3-0.7 随机强度
        });
        
        newConnections.push({ source: source.id, target: target.id, type: relType, relId });
      }
    }

    return newConnections;
  }

  /**
   * 生成梦境片段 (REM)
   * @private
   */
  _generateDreamFragment(cycleNum) {
    const eligibleMemories = this.memories
      .filter(m => !m.compressed && m.layer !== 'working')
      .slice(-20); // 最近20条

    if (eligibleMemories.length < 2) return null;

    // 随机选择2-3条记忆
    const dreamMemories = [];
    const count = 2 + Math.floor(Math.random() * 2);
    
    const shuffled = [...eligibleMemories].sort(() => Math.random() - 0.5);
    dreamMemories.push(...shuffled.slice(0, count));

    // 生成梦境片段
    const dreamTypes = ['symbolic', 'literal', 'abstract', 'emotional'];
    const dreamType = dreamTypes[Math.floor(Math.random() * dreamTypes.length)];
    
    const fragments = dreamMemories.map(m => m.summary || m.content?.slice(0, 50) || '模糊的记忆');
    const connections = ['与', '交织在', '融合为', '转化为'][Math.floor(Math.random() * 4)];

    return {
      id: `dream-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      cycle: cycleNum,
      type: dreamType,
      narrative: fragments.join(` ${connections} `),
      memoryCount: dreamMemories.length,
      timestamp: Date.now()
    };
  }

  /**
   * 更新记忆层级索引
   * @private
   */
  _updateMemoryLayers() {
    this.memoryLayers = { working: [], episodic: [], semantic: [] };
    for (const mem of this.memories) {
      if (mem.compressed) continue;
      this.addToLayer(mem);
    }
  }

  /**
   * 生成梦境叙事报告
   * @private
   */
  _generateDreamNarrative(dreamResults) {
    if (dreamResults.dreamFragments.length === 0) {
      return '今夜无梦。';
    }

    const narratives = dreamResults.dreamFragments.map(f => f.narrative);
    return narratives.join('\n---\n');
  }

  // === 结束 Dream Consolidation 模块 ===
}

module.exports = { TrialityMemory };