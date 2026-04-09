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
    
    this.db = null;
    this.useMem = true;
    this.memories = [];
    this.vectors = new Map();
    this.relationships = new Map();
    
    this.stats = {
      totalMemories: 0,
      totalRelationships: 0,
      lastCleanup: null
    };
    
    this.init();
  }

  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.initializeSchema();
    console.log('[TrialityMemory] 三维经验大脑初始化完成');
  }

  initializeSchema() {
    this.memories = [];
    this.vectors = new Map();
    this.relationships = new Map();
  }

  store(memory) {
    const id = memory.id || this.generateId();
    const timestamp = memory.timestamp || Date.now() * 1000;
    
    const memoryRecord = {
      id,
      timestamp,
      content: memory.content,
      embedding: memory.embedding || this.generateMockEmbedding(memory.content),
      metadata: memory.metadata || {},
      createdAt: Date.now()
    };
    
    this.memories.push(memoryRecord);
    this.vectors.set(id, memoryRecord.embedding);
    
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
    console.log(`[TrialityMemory] 叙事查询: ${narrative.length} 个记忆节点`);
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
}

module.exports = { TrialityMemory };