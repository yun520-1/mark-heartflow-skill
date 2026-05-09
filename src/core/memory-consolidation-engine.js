/**
 * HeartFlow Memory Consolidation Engine v11.32.1
 * 
 * 来源: NirDiamant/Agent_Memory_Techniques
 *      14_memory_consolidation + 15_memory_compaction
 *      jari-mustonen/formative-memory (生物启发记忆系统)
 * 
 * 核心功能:
 * - 基于embedding的记忆聚类（cosine similarity）
 * - 相似记忆自动合并
 * - 记忆重要性评分（基于访问频率+时间衰减）
 * - 遗忘曲线模拟（Ebbinghaus）
 * - 记忆碎片整理
 * 
 * v11.32.1 新增 (来自 formative-memory):
 * - AssociationGraph: 加权双向关联图，记忆共召回时建立边
 * - HebbianStrengthening: 基于实际使用的 Hebbian 强化
 * - Reconsolidation: 新记忆与旧记忆矛盾时重写旧记忆
 * - ContentAddressedIdentity: SHA-256 内容寻址，相同事实在写入时合并
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'memory-consolidation');
const CONSOLIDATION_LOG = path.join(DATA_DIR, 'consolidation-log.json');
const ASSOCIATION_FILE = path.join(DATA_DIR, 'associations.json');

const CONFIG = {
  similarityThreshold: 0.80,  // 聚类相似度阈值
  maxClusterSize: 10,         // 每簇最大记忆数
  importanceDecayRate: 0.95, // 重要性衰减率（每天）
  minImportance: 0.1,         // 最小重要性阈值
  consolidationInterval: 24 * 60 * 60 * 1000, // 每24小时整理一次
  // v11.32.1 新增配置
  associationDecayRate: 0.995, // 关联强度衰减率（每次衰减）
  minAssociationStrength: 0.05, // 最小关联强度阈值
  reconsolidationWindow: 30 * 24 * 60 * 60 * 1000, // 30天内的矛盾触发再巩固
};

const DATA_DIR2 = path.join(__dirname, '..', '..', 'data', 'memory-consolidation');

/**
 * 记忆节点（用于聚类）
 */
class MemoryNode {
  constructor(id, content, embedding = null, metadata = {}) {
    this.id = id;
    this.content = content;
    this.embedding = embedding;
    this.metadata = metadata; // {timestamp, accessCount, lastAccessed, importance, source}
  }
}

/**
 * 并查集（Union-Find）+ cosine similarity 聚类
 */
class ClusterEngine {
  constructor(similarityThreshold = 0.80) {
    this.similarityThreshold = similarityThreshold;
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }

  /**
   * 聚类记忆
   * @param {MemoryNode[]} memories 
   * @returns {Map<number, MemoryNode[]>} clusterId -> memories
   */
  cluster(memories) {
    const n = memories.length;
    const parent = Array.from({length: n}, (_, i) => i);
    const rank = Array(n).fill(0);

    const find = (i) => {
      if (parent[i] !== i) parent[i] = find(parent[i]);
      return parent[i];
    };

    const union = (i, j) => {
      const ri = find(i), rj = find(j);
      if (ri === rj) return;
      if (rank[ri] < rank[rj]) parent[ri] = rj;
      else if (rank[ri] > rank[rj]) parent[rj] = ri;
      else { parent[rj] = ri; rank[ri]++; }
    };

    // 两两检查，合并相似的
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const mi = memories[i], mj = memories[j];
        if (!mi.embedding || !mj.embedding) continue;
        const sim = this.cosineSimilarity(mi.embedding, mj.embedding);
        if (sim >= this.similarityThreshold) {
          union(i, j);
        }
      }
    }

    // 按簇收集
    const clusters = new Map();
    for (let i = 0; i < n; i++) {
      const ri = find(i);
      if (!clusters.has(ri)) clusters.set(ri, []);
      clusters.get(ri).push(memories[i]);
    }

    return clusters;
  }
}

/**
 * 重要性计算器（基于Ebbinghaus遗忘曲线）
 */
class ImportanceScorer {
  constructor(decayRate = 0.95) {
    this.decayRate = decayRate;
  }

  /**
   * 计算记忆重要性
   * @param {Object} memory - 记忆对象
   * @param {number} baseImportance - 基础重要性
   * @returns {number} 0-1的重要性分数
   */
  calculate(memory, baseImportance = 0.5) {
    const now = Date.now();
    const created = memory.timestamp || now;
    const lastAccessed = memory.lastAccessed || created;
    
    // 时间衰减
    const daysSinceCreated = (now - created) / (24 * 60 * 60 * 1000);
    const daysSinceAccess = (now - lastAccessed) / (24 * 60 * 60 * 1000);
    
    // 访问频率加成
    const accessCount = memory.accessCount || 1;
    const accessBonus = Math.log(accessCount + 1) / 10;
    
    // 遗忘曲线衰减
    const timeDecay = Math.pow(this.decayRate, daysSinceAccess);
    
    // 综合重要性
    const importance = Math.min(1, Math.max(0, 
      baseImportance * timeDecay + accessBonus * 0.3
    ));
    
    return importance;
  }

  /**
   * 更新记忆的重要性
   */
  updateImportance(memory) {
    const base = memory.importance || 0.5;
    memory.importance = this.calculate(memory, base);
    return memory.importance;
  }
}

// ============================================================
// v11.32.1 新增: 内容寻址_identity
// 来源: formative-memory - Content-addressed identity
// 相同事实的不同来源在写入时合并为一个对象
// ============================================================

class ContentAddressedIdentity {
  /**
   * 计算内容的 SHA-256 哈希
   */
  static hash(content) {
    return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
  }

  /**
   * 将记忆去重，返回映射: hash -> 记忆列表
   * 相同哈希的记忆合并
   */
  static deduplicate(memories) {
    const hashMap = new Map();
    
    for (const mem of memories) {
      const content = mem.content || mem.value || mem.text || '';
      const hash = this.hash(content);
      
      if (hashMap.has(hash)) {
        // 已存在相同事实，合并元数据
        const existing = hashMap.get(hash);
        existing.metadata = this._mergeMetadata(existing.metadata, mem.metadata || {});
        existing.sources = existing.sources || [existing.id];
        existing.sources.push(mem.id || hash.substring(0, 8));
      } else {
        // 新记忆
        hashMap.set(hash, {
          ...mem,
          contentHash: hash,
          sources: [mem.id || hash.substring(0, 8)],
        });
      }
    }
    
    return hashMap;
  }

  static _mergeMetadata(a, b) {
    return {
      timestamp: Math.min(a.timestamp || Infinity, b.timestamp || Infinity),
      lastAccessed: Math.max(a.lastAccessed || 0, b.lastAccessed || 0),
      accessCount: (a.accessCount || 0) + (b.accessCount || 0),
      importance: Math.max(a.importance || 0, b.importance || 0),
      mergedSources: [...(a.sources || []), ...(b.sources || [])],
    };
  }
}

// ============================================================
// v11.32.1 新增: 关联图
// 来源: formative-memory - Weighted bidirectional associations
// 共召回时建立边，recall 扩展一跳
// ============================================================

class AssociationGraph {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    // 邻接表: memoryId -> { neighborId: strength }
    this.edges = new Map();
    this.stats = { edgesCreated: 0, hebbianStrengthened: 0, associationsDecayed: 0 };
    this._load();
  }

  _load() {
    try {
      const file = path.join(DATA_DIR2, 'associations.json');
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        // Reconstruct Map from serialized object
        if (data.edges) {
          this.edges = new Map(Object.entries(data.edges).map(([k, v]) => [k, new Map(Object.entries(v))]));
        }
        if (data.stats) this.stats = { ...this.stats, ...data.stats };
      }
    } catch (e) {}
  }

  _save() {
    try {
      if (!fs.existsSync(DATA_DIR2)) fs.mkdirSync(DATA_DIR2, { recursive: true });
      const file = path.join(DATA_DIR2, 'associations.json');
      // Serialize Map to plain object
      const edgesObj = Object.fromEntries(
        Array.from(this.edges.entries()).map(([k, v]) => [k, Object.fromEntries(v)])
      );
      fs.writeFileSync(file, JSON.stringify({ edges: edgesObj, stats: this.stats }, null, 2));
    } catch (e) {}
  }

  /**
   * 记忆共召回时调用，建立或强化关联
   * @param {string[]} memoryIds - 同时被召回的记忆ID列表
   */
  coRetrieve(memoryIds) {
    for (let i = 0; i < memoryIds.length; i++) {
      for (let j = i + 1; j < memoryIds.length; j++) {
        this._addEdge(memoryIds[i], memoryIds[j]);
        this._addEdge(memoryIds[j], memoryIds[i]);
      }
    }
    this._save();
  }

  _addEdge(idA, idB) {
    if (!this.edges.has(idA)) this.edges.set(idA, new Map());
    const neighbors = this.edges.get(idA);
    const current = neighbors.get(idB) || 0;
    // 每次共召回，强度 +0.1，上限 1.0
    const newStrength = Math.min(1.0, current + 0.1);
    neighbors.set(idB, newStrength);
    this.stats.edgesCreated++;
  }

  /**
   * Hebbian 强化：当记忆被实际使用时调用
   * "cells that fire together wire together"
   * @param {string} memoryId - 被使用的记忆ID
   */
  hebbianStrengthen(memoryId) {
    if (!this.edges.has(memoryId)) return;
    const neighbors = this.edges.get(memoryId);
    let changed = false;
    for (const [neighborId, strength] of neighbors) {
      const newStrength = Math.min(1.0, strength + 0.05);
      if (newStrength !== strength) {
        neighbors.set(neighborId, newStrength);
        changed = true;
      }
    }
    if (changed) {
      this.stats.hebbianStrengthened++;
      this._save();
    }
  }

  /**
   * 衰减所有关联边
   */
  decay() {
    for (const [idA, neighbors] of this.edges) {
      for (const [idB, strength] of neighbors) {
        const newStrength = strength * this.config.associationDecayRate;
        if (newStrength < this.config.minAssociationStrength) {
          neighbors.delete(idB);
        } else {
          neighbors.set(idB, newStrength);
        }
      }
      if (neighbors.size === 0) this.edges.delete(idA);
    }
    this.stats.associationsDecayed++;
    this._save();
  }

  /**
   * 扩展召回：给定记忆，扩展到关联记忆
   * @param {string} memoryId - 起始记忆ID
   * @param {number} maxHops - 最大跳数（默认1跳）
   * @returns {string[]} 扩展后的记忆ID列表
   */
  expandRecall(memoryId, maxHops = 1) {
    if (!this.edges.has(memoryId)) return [];
    const result = new Set();
    const queue = [memoryId];
    const visited = new Set([memoryId]);
    
    for (let hop = 0; hop < maxHops; hop++) {
      const nextQueue = [];
      for (const current of queue) {
        if (!this.edges.has(current)) continue;
        for (const [neighborId, strength] of this.edges.get(current)) {
          if (!visited.has(neighborId) && strength >= this.config.minAssociationStrength) {
            result.add(neighborId);
            visited.add(neighborId);
            nextQueue.push(neighborId);
          }
        }
      }
      queue.length = 0;
      queue.push(...nextQueue);
    }
    
    return Array.from(result);
  }

  /**
   * 获取记忆的关联记忆
   */
  getAssociations(memoryId) {
    if (!this.edges.has(memoryId)) return [];
    return Array.from(this.edges.get(memoryId).entries())
      .filter(([, s]) => s >= this.config.minAssociationStrength)
      .sort((a, b) => b[1] - a[1])
      .map(([id, strength]) => ({ id, strength }));
  }
}

// ============================================================
// v11.32.1 新增: 再巩固处理
// 来源: formative-memory - Reconsolidation ("coloring")
// 当新记忆与旧记忆矛盾时，用新上下文重写旧记忆
// ============================================================

class ReconsolidationEngine {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.stats = { reconsolidationsTriggered: 0, memoriesReplaced: 0 };
  }

  /**
   * 检查是否需要再巩固
   * @param {Object} newMemory - 新记忆 { content, timestamp }
   * @param {Object} oldMemory - 旧记忆 { content, timestamp }
   * @returns {boolean} 是否需要再巩固
   */
  needsReconsolidation(newMemory, oldMemory) {
    if (!newMemory.timestamp || !oldMemory.timestamp) return false;
    const age = Math.abs(newMemory.timestamp - oldMemory.timestamp);
    if (age > this.config.reconsolidationWindow) return false;
    // 简单矛盾检测：内容相似度低且时间接近
    return this._contradicts(newMemory.content, oldMemory.content);
  }

  /**
   * 简单矛盾检测（无 embedding 时使用）
   * 检查否定词变化
   */
  _contradicts(contentA, contentB) {
    const negations = ['不是', '没有', '不会', '不对', "doesn't", "isn't", "won't", "can't", "never"];
    const wordsA = contentA.toLowerCase().split(/\s+/);
    const wordsB = contentB.toLowerCase().split(/\s+/);
    // 检查是否有否定词差异
    const hasNegA = negations.some(n => contentA.includes(n));
    const hasNegB = negations.some(n => contentB.includes(n));
    if (hasNegA !== hasNegB) {
      // 一个肯定一个否定，可能是矛盾
      return true;
    }
    return false;
  }

  /**
   * 执行再巩固：用新上下文重写旧记忆
   * @param {Object} oldMemory - 要重写的旧记忆
   * @param {Object} newMemory - 提供新上下文的记忆
   * @returns {Object} 重写后的记忆
   */
  reconsolidate(oldMemory, newMemory) {
    this.stats.reconsolidationsTriggered++;
    
    // 新记忆内容覆盖旧记忆（但保留旧记忆作为历史）
    const result = {
      ...oldMemory,
      content: newMemory.content,
      metadata: {
        ...(oldMemory.metadata || {}),
        reconsolidated: true,
        reconsolidatedFrom: oldMemory.content,
        reconsolidatedAt: Date.now(),
        supersededBy: newMemory.id || 'unknown',
      },
    };
    
    this.stats.memoriesReplaced++;
    return result;
  }
}

// ============================================================
// 记忆整合器主类（增强版）
// ============================================================

class MemoryConsolidationEngine {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.clusterEngine = new ClusterEngine(this.config.similarityThreshold);
    this.scorer = new ImportanceScorer(this.config.importanceDecayRate);
    this.associationGraph = new AssociationGraph(this.config);
    this.reconsolidation = new ReconsolidationEngine(this.config);
    this.lastConsolidation = this._loadLastConsolidation();
    this.stats = {
      clustersCreated: 0,
      memoriesMerged: 0,
      importanceUpdated: 0,
      associationsCreated: 0,
      reconsolidationsTriggered: 0,
      deduplicationsApplied: 0,
      lastRun: null,
    };
  }

  _loadLastConsolidation() {
    try {
      if (fs.existsSync(CONSOLIDATION_LOG)) {
        const data = JSON.parse(fs.readFileSync(CONSOLIDATION_LOG, 'utf8'));
        return data.lastConsolidation || 0;
      }
    } catch (e) {}
    return 0;
  }

  _saveLog() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CONSOLIDATION_LOG, JSON.stringify({
        lastConsolidation: Date.now(),
        stats: this.stats,
      }, null, 2));
    } catch (e) {}
  }

  /**
   * 检查是否需要整合
   */
  needsConsolidation() {
    const now = Date.now();
    return (now - this.lastConsolidation) > this.config.consolidationInterval;
  }

  /**
   * 记录共召回事件（用于关联图构建）
   */
  recordCoRetrieval(memoryIds) {
    this.associationGraph.coRetrieve(memoryIds);
    this.stats.associationsCreated++;
  }

  /**
   * 记录 Hebbian 强化（记忆被实际使用时调用）
   */
  recordUsage(memoryId) {
    this.associationGraph.hebbianStrengthen(memoryId);
  }

  /**
   * 获取扩展召回列表（记忆+关联记忆）
   */
  getExpandedRecall(memoryId, maxHops = 1) {
    return this.associationGraph.expandRecall(memoryId, maxHops);
  }

  /**
   * 对记忆列表进行聚类（带内容寻址去重）
   */
  cluster(memories) {
    // Step 1: 内容寻址去重
    const deduplicated = ContentAddressedIdentity.deduplicate(memories);
    this.stats.deduplicationsApplied = memories.length - deduplicated.size;
    
    // 转换为 MemoryNode
    const nodes = Array.from(deduplicated.values()).map((m, i) => new MemoryNode(
      m.id || `mem_${i}`,
      m.content || m.value || '',
      m.embedding || null,
      {
        timestamp: m.timestamp,
        accessCount: m.metadata?.accessCount || m.accessCount || 0,
        lastAccessed: m.metadata?.lastAccessed || m.lastAccessed || m.timestamp,
        importance: m.metadata?.importance || m.importance || 0.5,
        source: m.source || m.metadata?.source || 'unknown',
        contentHash: m.contentHash,
        sources: m.sources,
      }
    ));

    // 过滤有embedding的
    const withEmbeddings = nodes.filter(n => n.embedding);
    const withoutEmbeddings = nodes.filter(n => !n.embedding);

    // 分别聚类
    const clusters = this.clusterEngine.cluster(withEmbeddings);
    const result = [];

    // 有embedding的加入簇
    for (const [clusterId, members] of clusters) {
      if (members.length > 1) {
        result.push({
          type: 'cluster',
          id: `cluster_${clusterId}`,
          memories: members,
          representative: members[0],
          size: members.length,
        });
        this.stats.clustersCreated++;
      } else {
        result.push({ type: 'single', memory: members[0] });
      }
    }

    // 无embedding的单独处理
    for (const node of withoutEmbeddings) {
      result.push({ type: 'single', memory: node });
    }

    return result;
  }

  /**
   * 整合记忆（合并相似记忆，更新重要性）
   */
  consolidate(memories) {
    if (!this.needsConsolidation()) {
      return { skipped: true, reason: 'Not yet time for consolidation' };
    }

    const result = this.cluster(memories);
    const merged = [];

    for (const item of result) {
      if (item.type === 'cluster' && item.memories.length > 1) {
        const consolidated = this._mergeCluster(item.memories);
        merged.push(consolidated);
        this.stats.memoriesMerged += item.memories.length - 1;
      } else if (item.type === 'single') {
        const mem = item.memory;
        mem.metadata.importance = this.scorer.updateImportance(mem.metadata);
        merged.push(mem);
        this.stats.importanceUpdated++;
      }
    }

    this.lastConsolidation = Date.now();
    this.stats.lastRun = this.lastConsolidation;
    this._saveLog();

    return {
      skipped: false,
      clustersCreated: this.stats.clustersCreated,
      memoriesMerged: this.stats.memoriesMerged,
      importanceUpdated: this.stats.importanceUpdated,
      associationsCreated: this.stats.associationsCreated,
      reconsolidationsTriggered: this.stats.reconsolidationsTriggered,
      deduplicationsApplied: this.stats.deduplicationsApplied,
      result: merged,
    };
  }

  /**
   * 合并簇中的记忆
   */
  _mergeCluster(memories) {
    const sorted = [...memories].sort((a, b) => 
      (b.metadata.importance || 0) - (a.metadata.importance || 0)
    );
    
    const base = sorted[0];
    const mergedContent = sorted.map(m => m.content).join(' | ');
    
    return {
      id: `merged_${base.id}`,
      content: mergedContent,
      embedding: base.embedding,
      metadata: {
        ...base.metadata,
        accessCount: Math.max(...memories.map(m => m.metadata.accessCount || 0)),
        timestamp: Math.min(...memories.map(m => m.metadata.timestamp || Date.now())),
        mergedFrom: memories.map(m => m.id),
        importance: Math.max(...memories.map(m => m.metadata.importance || 0)),
        contentHash: base.metadata?.contentHash,
        sources: memories.flatMap(m => m.metadata?.sources || [m.id]),
      },
    };
  }

  /**
   * 衰减关联边
   */
  decayAssociations() {
    this.associationGraph.decay();
  }
}

module.exports = {
  MemoryConsolidationEngine,
  ClusterEngine,
  ImportanceScorer,
  MemoryNode,
  AssociationGraph,
  ReconsolidationEngine,
  ContentAddressedIdentity,
};
