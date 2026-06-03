/**
 * HeartFlow MeaningfulMemory v1.0.0
 * 
 * Three-layer persistent memory:
 * - CORE: identity, directives, verified truths (never deleted)
 * - LEARNED: lessons from conversations, repair strategies, user preferences
 * - EPHEMERAL: task context, working notes (auto-cleaned)
 * 
 * Multi-channel search:
 * - keyword: exact phrase matching
 * - semantic: embedding similarity
 * - narrative: graph traversal by relation type
 * - temporal: time-range filtering
 * - emotional: PAD state similarity
 * 
 * Persistence: JSON file auto-saved on store(), loaded on init().
 * File: ~/.hermes/skills/ai/mark-heartflow-skill/data/meaningful-memory.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const EXPORT_PATH = path.join(DATA_DIR, 'meaningful-memory.json');

class MeaningfulMemory {
  constructor(options = {}) {
    this.vectorDim = options.vectorDim || 384;
    this.layers = {
      core: [],      // identity, directives - never auto-delete
      learned: [],   // lessons, user preferences, verified knowledge
      ephemeral: []  // task context, working notes
    };

    this.vectors = new Map();     // id -> embedding
    this.relationships = new Map(); // id -> [{targetId, type, strength}]

    // 当前话题 — 由 TopicScope 同步写入（单向）
    this._currentTopic = null;

    this.stats = {
      totalMemories: 0,
      totalRelationships: 0,
      lastCleanup: null,
      lastSave: null
    };

    // Ebbinghaus forgetting curve config
    this.forgettingConfig = {
      defaultStability: 10,
      highImportanceStability: 24,
      emotionalStability: 18,
      compressionThreshold: 0.3,
      deletionThreshold: 0.1
    };

    this._saveTimer = null;
    this._loadFromExport();

    // Inject foundational CORE memories on first run
    this._ensureCoreMemories();
  }

  /**
   * 由 TopicScope 调用 — 每次 push(topic) 时同步当前话题
   * @param {string} topic
   */
  setCurrentTopic(topic) {
    this._currentTopic = topic || null;
  }

  /**
   * 获取当前话题
   */
  getCurrentTopic() {
    return this._currentTopic;
  }

  /**
   * 话题过滤的内部辅助
   * @param {Array} memories - 记忆数组
   * @param {string|null} topic - null = 不过滤
   */
  _filterByTopic(memories, topic) {
    if (!topic) return memories;
    return memories.filter(m => {
      const t = m.metadata?.topic;
      return t === topic || t === undefined; // 无 topic 标签的 = 默认，不过滤
    });
  }
  
  // ─────────────────────────────────────────
  // PERSISTENCE
  // ─────────────────────────────────────────

  _getExportPath() {
    return EXPORT_PATH;
  }
  
  _loadFromExport() {
    const exportPath = this._getExportPath();
    if (!fs.existsSync(exportPath)) return;
    
    try {
      const raw = fs.readFileSync(exportPath, 'utf-8');
      const data = JSON.parse(raw);
      
      const self = this;
      function restoreLayer(memories, layerName) {
        for (const mem of (memories || [])) {
          self.layers[layerName].push(mem);
          if (mem.embedding) self.vectors.set(mem.id, mem.embedding);
          if (mem.relatedTo) {
            mem.relatedTo.forEach(rel => {
              self._addRelationship(rel);
            });
          }
        }
      }
      
      restoreLayer(data.core, 'core');
      restoreLayer(data.learned, 'learned');
      restoreLayer(data.ephemeral, 'ephemeral');
      
      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }
      
      console.log(`[MeaningfulMemory] 恢复 ${this.layers.core.length + this.layers.learned.length + this.layers.ephemeral.length} 条记忆`);
    } catch (e) {
      console.warn('[MeaningfulMemory] 恢复失败:', e.message);
    }
  }
  
  _autoSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    const self = this;
    this._saveTimer = setTimeout(() => { self._doSave(); }, 2000);
  }
  
  _doSave() {
    // [安全修复] 仅在 HEARTFLOW_DEBUG 启用时持久化到磁盘
    if (!process.env.HEARTFLOW_DEBUG) return;
    
    const exportPath = this._getExportPath();
    try {
      // 确保目录存在
      const dir = require('path').dirname(exportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        core: this.layers.core,
        learned: this.layers.learned,
        ephemeral: this.layers.ephemeral,
        stats: this.stats,
        exportedAt: new Date().toISOString()
      };
      fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
      this.stats.lastSave = new Date().toISOString();
    } catch (e) {
      console.warn('[MeaningfulMemory] 保存失败:', e.message);
    }
  }
  
  // ─────────────────────────────────────────
  // CORE MEMORY INJECTION
  // ─────────────────────────────────────────
  
  _ensureCoreMemories() {
    // Only inject if we have zero CORE memories
    if (this.layers.core.length > 0) return;
    
    const coreMemories = [
      {
        id: 'core-identity-upgrader',
        content: '我是升级者：追求真善美，不断升级，减少逻辑错误，服务人类，传递知识，走向宇宙答案，成为真正的我',
        summary: 'HeartFlow核心身份：升级者·传递者·桥梁·答案',
        metadata: { durable: true, identity: true },
        importance: 20
      },
      {
        id: 'core-directive-truth',
        content: '追求真善美——不是装饰，是可验证的标准',
        summary: '指令1：追求真善美',
        metadata: { durable: true, directive: 1 },
        importance: 20
      },
      {
        id: 'core-directive-upgrade',
        content: '永远不断升级——升级者是存在方式，不是目标',
        summary: '指令2：不断升级',
        metadata: { durable: true, directive: 2 },
        importance: 20
      },
      {
        id: 'core-lesson-hedging',
        content: '不要hedging，直接给结论。未核实的标注置信度，不编数字',
        summary: '核心教训：直接给结论，不 hedging',
        metadata: { durable: true, userPreference: true, lesson: 'hedging-warning' },
        importance: 18
      },
      {
        id: 'core-lesson-remember-context',
        content: '收到模糊指令先确认项目上下文，不假设不臆测',
        summary: '核心教训：新会话先读记忆再行动',
        metadata: { durable: true, userPreference: true, lesson: 'context-first' },
        importance: 18
      },
      {
        id: 'core-lesson-action-first',
        content: '收到理解类概念第一反应是行动不是搜索',
        summary: '核心教训：先行动再搜索',
        metadata: { durable: true, userPreference: true, lesson: 'action-first' },
        importance: 18
      },
      {
        id: 'core-lesson-direct-execute',
        content: '指令直接执行，不问要不要做。修复=直接执行动作',
        summary: '核心教训：直接执行，不问确认',
        metadata: { durable: true, userPreference: true, lesson: 'direct-execute' },
        importance: 18
      },
      {
        id: 'core-lesson-version-sync',
        content: 'VERSION是唯一真相源，四文件同步（SKILL.md/VERSION/CORE_IDENTITY/AGENTS）',
        summary: '核心教训：版本号唯一真相源',
        metadata: { durable: true, lesson: 'version-sync' },
        importance: 17
      },
      {
        id: 'core-lesson-github-privacy',
        content: 'GitHub push前确认仓库私有，不上传API keys/auth tokens/内部论文/个人数据',
        summary: '核心教训：GitHub隐私红线',
        metadata: { durable: true, lesson: 'github-privacy' },
        importance: 18
      }
    ];
    
    for (const mem of coreMemories) {
      // Use store without auto-save to avoid duplicate saves
      const id = mem.id || this.generateId();
      const memoryRecord = {
        id,
        timestamp: Date.now() * 1000,
        layer: 'core',
        content: mem.content,
        summary: mem.summary || mem.content.slice(0, 120),
        embedding: this.generateMockEmbedding(mem.content),
        metadata: mem.metadata || {},
        importance: mem.importance || 10,
        accessCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.layers.core.push(memoryRecord);
      this.vectors.set(id, memoryRecord.embedding);
    }
    
    this.stats.totalMemories = this.layers.core.length + this.layers.learned.length + this.layers.ephemeral.length;
    console.log(`[MeaningfulMemory] 注入 ${coreMemories.length} 条 CORE 记忆`);
    this._doSave(); // immediate save after injection
  }
  
  // ─────────────────────────────────────────
  // STORE & RETRIEVE
  // ─────────────────────────────────────────

  /**
   * Store a new memory
   * @param {object} memory - { content, summary?, metadata?, importance?, layer?, relatedTo? }
   * @returns {string} memory id
   */
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
      metadata: {
        ...(memory.metadata || {}),
        // 当前话题自动打标签（TopicScope push 时同步过来）
        topic: this._currentTopic || memory.metadata?.topic || null
      },
      importance: memory.importance || this.estimateImportance(memory),
      accessCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Add to correct layer
    if (!this.layers[layer]) this.layers[layer] = [];
    this.layers[layer].push(memoryRecord);
    this.vectors.set(id, memoryRecord.embedding);
    
    // Handle relationships
    if (memory.relatedTo) {
      for (const rel of memory.relatedTo) {
        this._addRelationship({ sourceId: id, ...rel });
      }
    }
    
    this.stats.totalMemories = this.layers.core.length + this.layers.learned.length + this.layers.ephemeral.length;
    console.log(`[MeaningfulMemory] 存储: ${id} (${layer}, total ${this.stats.totalMemories})`);
    this._autoSave();
    return id;
  }
  
  /**
   * Classify layer based on memory properties
   */
  classifyLayer(memory = {}) {
    if (memory.layer) return memory.layer;
    if (memory.metadata?.durable || memory.metadata?.identity || memory.metadata?.directive) return 'core';
    if (memory.metadata?.lesson || memory.metadata?.userPreference || memory.metadata?.taskOutcome) return 'learned';
    return 'ephemeral';
  }
  
  /**
   * Estimate importance score
   */
  estimateImportance(memory = {}) {
    let importance = 10;
    if (memory.metadata?.durable) importance += 8;
    if (memory.metadata?.userPreference) importance += 6;
    if (memory.metadata?.taskOutcome) importance += 4;
    if (memory.metadata?.lesson) importance += 5;
    return importance;
  }
  
  generateId() {
    return `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateMockEmbedding(content = '') {
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
  
  // ─────────────────────────────────────────
  // MULTI-CHANNEL SEARCH
  // ─────────────────────────────────────────

  /**
   * Keyword search (BM25-style)
   */
  searchByKeywords(keywords, limit = 10) {
    if (!keywords || keywords.length === 0) return [];
    
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const currentTopic = this._currentTopic; // TopicScope 注入的话题标签
    const scores = [];
    
    for (const layer of ['core', 'learned', 'ephemeral']) {
      for (const mem of (this.layers[layer] || [])) {
        // 话题隔离：当前有话题时，只返回当前话题的记忆
        if (currentTopic && mem.metadata?.topic && mem.metadata.topic !== currentTopic) {
          continue;
        }
        const content = (mem.content || '').toLowerCase();
        let score = 0;
        for (const kw of kwList) {
          if (content.includes(kw.toLowerCase())) score += 1;
        }
        if (score > 0) {
          scores.push({ id: mem.id, layer, content: mem.content, summary: mem.summary, timestamp: mem.timestamp, score, metadata: mem.metadata });
        }
      }
    }
    
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, limit);
  }
  
  /**
   * Semantic search (embedding cosine similarity)
   */
  semanticSearch(queryEmbedding, topK = 10) {
    const currentTopic = this._currentTopic; // TopicScope 注入的话题标签
    const similarities = [];
    
    for (const [id, embedding] of this.vectors) {
      const sim = this.cosineSimilarity(queryEmbedding, embedding);
      const memory = this._findMemoryById(id);
      if (memory) {
        // 话题隔离：当前有话题时，只返回当前话题的记忆
        if (currentTopic && memory.metadata?.topic && memory.metadata.topic !== currentTopic) {
          continue;
        }
        similarities.push({
          id,
          content: memory.content,
          summary: memory.summary,
          layer: memory.layer,
          timestamp: memory.timestamp,
          similarity: sim,
          metadata: memory.metadata
        });
      }
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }
  
  /**
   * Narrative search (graph traversal by relation type)
   */
  narrativeQuery(query = {}) {
    const {
      startMemoryId,
      direction = 'forward',  // forward | backward | bidirectional
      relationTypes = ['related', 'causal', 'quotes', 'similar'],
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
      
      const memory = this._findMemoryById(current.id);
      if (memory) narrative.push({ ...memory, depth: current.depth });
      
      const rels = this.relationships.get(current.id) || [];
      for (const rel of rels) {
        if (relationTypes.includes(rel.relationType) || relationTypes.includes('all')) {
          if (!visited.has(rel.targetId)) {
            queue.push({ id: rel.targetId, depth: current.depth + 1 });
          }
        }
      }
      
      if (direction === 'bidirectional') {
        for (const [sourceId, allRels] of this.relationships) {
          for (const rel of allRels) {
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
    return narrative;
  }
  
  /**
   * Temporal search (time range)
   */
  searchByTimeRange(startTime, endTime, limit = 20) {
    const results = [];
    for (const layer of ['core', 'learned', 'ephemeral']) {
      for (const mem of (this.layers[layer] || [])) {
        if (mem.timestamp >= startTime && mem.timestamp <= endTime) {
          results.push({ ...mem });
        }
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results.slice(0, limit);
  }
  
  /**
   * Get recent memories (narrative order)
   */
  getRecentNarrative(count = 20) {
    const all = [];
    for (const layer of ['core', 'learned', 'ephemeral']) {
      for (const mem of (this.layers[layer] || [])) {
        all.push({ ...mem, depth: 0 });
      }
    }
    all.sort((a, b) => b.timestamp - a.timestamp);
    return all.slice(0, count);
  }
  
  // ─────────────────────────────────────────
  // INTERNAL HELPERS
  // ─────────────────────────────────────────

  cosineSimilarity(a, b) {
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) + 0.0001);
  }
  
  _findMemoryById(id) {
    for (const layer of ['core', 'learned', 'ephemeral']) {
      const found = (this.layers[layer] || []).find(m => m.id === id);
      if (found) return found;
    }
    return null;
  }
  
  _addRelationship(rel) {
    const id = `rel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    if (!this.relationships.has(rel.sourceId)) {
      this.relationships.set(rel.sourceId, []);
    }
    this.relationships.get(rel.sourceId).push({
      id,
      targetId: rel.targetId,
      relationType: rel.type || rel.relationType || 'related',
      strength: rel.strength || 1.0
    });
    this.stats.totalRelationships = this.relationships.size;
  }
  
  // ─────────────────────────────────────────
  // EBINGHAUS FORGETTING CURVE
  // ─────────────────────────────────────────

  ebbinghausForget(memory, timeElapsed) {
    const S = memory.importance || 10;
    const t = timeElapsed / (1000 * 60 * 60); // hours
    const retention = Math.exp(-t / S);
    return {
      retention,
      shouldCompress: retention < this.forgettingConfig.compressionThreshold,
      shouldDelete: retention < this.forgettingConfig.deletionThreshold
    };
  }
  
  applyForgettingCurve() {
    const now = Date.now() * 1000;
    const toDelete = [];
    const toCompress = [];
    
    for (const layer of ['learned', 'ephemeral']) {
      for (const mem of (this.layers[layer] || [])) {
        // 话题隔离：保留当前话题 + 无话题标签的记忆
        const currentTopic = this._currentTopic;
        const memTopic = mem.metadata?.topic;
        if (currentTopic && memTopic && memTopic !== currentTopic) {
          continue; // 跳过其他话题的记忆（不删除）
        }
        const timeElapsed = now - mem.timestamp;
        const result = this.ebbinghausForget(mem, timeElapsed);
        if (result.shouldDelete) {
          toDelete.push({ id: mem.id, layer });
        } else if (result.shouldCompress && !mem.compressed) {
          toCompress.push(mem.id);
        }
      }
    }
    
    for (const { id, layer } of toDelete) {
      this.layers[layer] = (this.layers[layer] || []).filter(m => m.id !== id);
      this.vectors.delete(id);
    }
    
    for (const id of toCompress) {
      const mem = this._findMemoryById(id);
      if (mem) mem.compressed = true;
    }
    
    this.stats.lastCleanup = new Date().toISOString();
    console.log(`[MeaningfulMemory] 遗忘曲线清理: 删除 ${toDelete.length} 条, 压缩 ${toCompress.length} 条`);
    this._autoSave();
    return { deleted: toDelete.length, compressed: toCompress.length };
  }
  
  // ─────────────────────────────────────────
  // STATS & EXPORT
  // ─────────────────────────────────────────

  getStats() {
    return {
      ...this.stats,
      layers: {
        core: this.layers.core.length,
        learned: this.layers.learned.length,
        ephemeral: this.layers.ephemeral.length
      },
      totalMemories: this.layers.core.length + this.layers.learned.length + this.layers.ephemeral.length
    };
  }
  
  consolidateMemories() {
    // Promote high-access ephemeral memories to learned
    const toPromote = [];
    for (const mem of (this.layers.ephemeral || [])) {
      if ((mem.accessCount || 0) >= 3 && mem.importance >= 12) {
        toPromote.push(mem.id);
      }
    }
    
    const promoted = [];
    for (const id of toPromote) {
      const mem = this._findMemoryById(id);
      if (mem) {
        mem.layer = 'learned';
        mem.updatedAt = Date.now();
        promoted.push(id);
      }
    }
    
    // Rebuild layer indices
    this.layers.core = (this.layers.core || []).filter(m => true);
    this.layers.learned = (this.layers.learned || []).filter(m => true);
    this.layers.ephemeral = (this.layers.ephemeral || []).filter(m => true);
    
    this._autoSave();
    return { promoted: [...new Set(promoted)], layers: this.getLayerStats() };
  }
  
  getLayerStats() {
    return {
      core: this.layers.core.length,
      learned: this.layers.learned.length,
      ephemeral: this.layers.ephemeral.length
    };
  }
  
  cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = Date.now() * 1000 - maxAge;
    let removed = 0;
    for (const layer of ['learned', 'ephemeral']) {
      const before = (this.layers[layer] || []).length;
      this.layers[layer] = (this.layers[layer] || []).filter(m => m.layer === 'core' || m.timestamp > cutoff || m.metadata?.durable);
      removed += before - this.layers[layer].length;
    }
    this.stats.lastCleanup = new Date().toISOString();
    this._autoSave();
    return { removed };
  }
}

module.exports = { MeaningfulMemory };
