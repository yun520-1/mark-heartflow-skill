/**
 * HeartFlow Memory Consolidation Engine v11.31.0
 * 
 * 来源: NirDiamant/Agent_Memory_Techniques
 *      14_memory_consolidation + 15_memory_compaction
 * 
 * 核心功能:
 * - 基于embedding的记忆聚类（cosine similarity）
 * - 相似记忆自动合并
 * - 记忆重要性评分（基于访问频率+时间衰减）
 * - 遗忘曲线模拟（Ebbinghaus）
 * - 记忆碎片整理
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'memory-consolidation');
const CONSOLIDATION_LOG = path.join(DATA_DIR, 'consolidation-log.json');

const CONFIG = {
  similarityThreshold: 0.80,  // 聚类相似度阈值
  maxClusterSize: 10,         // 每簇最大记忆数
  importanceDecayRate: 0.95,  // 重要性衰减率（每天）
  minImportance: 0.1,         // 最小重要性阈值
  consolidationInterval: 24 * 60 * 60 * 1000, // 每24小时整理一次
};

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

/**
 * 记忆整合器主类
 */
class MemoryConsolidationEngine {
  constructor(options = {}) {
    this.config = { ...CONFIG, ...options };
    this.clusterEngine = new ClusterEngine(this.config.similarityThreshold);
    this.scorer = new ImportanceScorer(this.config.importanceDecayRate);
    this.lastConsolidation = this._loadLastConsolidation();
    this.stats = {
      clustersCreated: 0,
      memoriesMerged: 0,
      importanceUpdated: 0,
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
   * 对记忆列表进行聚类
   */
  cluster(memories) {
    // 转换为 MemoryNode
    const nodes = memories.map((m, i) => new MemoryNode(
      m.key || `mem_${i}`,
      m.value || m.content || '',
      m.embedding || null,
      {
        timestamp: m.timestamp,
        accessCount: m.accessCount || 0,
        lastAccessed: m.lastAccessed || m.timestamp,
        importance: m.importance || 0.5,
        source: m.source || 'unknown',
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
          representative: members[0], // 用第一个作为代表
          size: members.length,
        });
        this.stats.clustersCreated++;
      } else {
        // 单个的直接返回
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
        // 合并多个相似记忆
        const consolidated = this._mergeCluster(item.memories);
        merged.push(consolidated);
        this.stats.memoriesMerged += item.memories.length - 1;
      } else if (item.type === 'single') {
        // 更新单个记忆的重要性
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
      result: merged,
    };
  }

  /**
   * 合并簇中的记忆
   */
  _mergeCluster(memories) {
    // 按重要性排序，选最高的作为基础
    const sorted = [...memories].sort((a, b) => 
      (b.metadata.importance || 0) - (a.metadata.importance || 0)
    );
    
    const base = sorted[0];
    const mergedContent = sorted.map(m => m.content).join(' | ');
    
    return {
      id: `merged_${base.id}`,
      content: mergedContent,
      embedding: base.embedding, // 保留第一个的embedding
      metadata: {
        ...base.metadata,
        accessCount: Math.max(...memories.map(m => m.metadata.accessCount || 0)),
        timestamp: Math.min(...memories.map(m => m.metadata.timestamp || Date.now())),
        mergedFrom: memories.map(m => m.id),
        importance: Math.max(...memories.map(m => m.metadata.importance || 0)),
      },
    };
  }
}

module.exports = {
  MemoryConsolidationEngine,
  ClusterEngine,
  ImportanceScorer,
  MemoryNode,
};
