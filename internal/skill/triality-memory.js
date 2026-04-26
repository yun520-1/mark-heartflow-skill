/**
 * HeartFlow v10.16.0 - 三维记忆架构
 * 集成 v2.2.3 的三维记忆系统
 * 
 * 三维度：
 * 1. 时间维度 - 微秒级时间戳，记录事件发生顺序
 * 2. 语义维度 - 384维向量嵌入表示记忆内容
 * 3. 关系维度 - 因果、引述、相似、相关等关系链
 */

class TrialityMemory {
  constructor(config = {}) {
    this.memories = new Map();
    this.relationships = new Map();
    this.vectorIndex = new Map();
    
    // 配置
    this.config = {
      maxMemories: config.maxMemories || 10000,
      vectorDimension: config.vectorDimension || 384,
      relationshipTypes: ['causal', 'quotes', 'similar', 'related', 'contradicts', 'supports'],
      ...config
    };
    
    this.memoryCounter = 0;
  }

  /**
   * 存储记忆
   * @param {Object} content - 记忆内容
   * @param {Array} relatedTo - 相关的记忆 ID 和关系类型
   */
  store(content) {
    const memoryId = `mem-${Date.now()}-${++this.memoryCounter}`;
    
    const memory = {
      id: memoryId,
      content: content,
      timestamp: Date.now(),
      microseconds: process.hrtime.bigint(),
      vector: this.generateVector(content),
      relationships: new Map(),
      metadata: {
        createdAt: new Date().toISOString(),
        accessCount: 0,
        lastAccessed: null
      }
    };
    
    this.memories.set(memoryId, memory);
    this.vectorIndex.set(memoryId, memory.vector);
    
    console.log(`✓ 记忆已存储: ${memoryId}`);
    return memoryId;
  }

  /**
   * 建立记忆之间的关系
   */
  linkMemories(sourceId, targetId, relationType = 'related') {
    if (!this.memories.has(sourceId) || !this.memories.has(targetId)) {
      console.error('❌ 记忆不存在');
      return false;
    }
    
    const source = this.memories.get(sourceId);
    source.relationships.set(targetId, relationType);
    
    console.log(`✓ 建立关系: ${sourceId} --[${relationType}]--> ${targetId}`);
    return true;
  }

  /**
   * 生成向量嵌入（简化版）
   * 实际应用中应使用真实的向量模型
   */
  generateVector(content) {
    const vector = new Array(this.config.vectorDimension);
    
    // 基于内容的哈希生成向量
    const hash = this.hashContent(content);
    for (let i = 0; i < this.config.vectorDimension; i++) {
      vector[i] = Math.sin(hash + i) * 0.5 + 0.5;
    }
    
    return vector;
  }

  /**
   * 内容哈希
   */
  hashContent(content) {
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 语义搜索
   * 基于向量相似度搜索
   */
  semanticSearch(query, topK = 5) {
    const queryVector = this.generateVector(query);
    const similarities = [];
    
    for (const [memoryId, memory] of this.memories) {
      const similarity = this.cosineSimilarity(queryVector, memory.vector);
      similarities.push({ memoryId, similarity, memory });
    }
    
    // 按相似度排序
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    console.log(`🔍 语义搜索完成，找到 ${similarities.length} 个相关记忆`);
    return similarities.slice(0, topK);
  }

  /**
   * 余弦相似度
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 叙事查询
   * 沿时间线或关系链进行图遍历
   */
  narrativeQuery(options = {}) {
    const {
      startMemoryId,
      direction = 'forward',
      maxDepth = 5,
      relationshipFilter = null
    } = options;
    
    if (!this.memories.has(startMemoryId)) {
      console.error('❌ 起始记忆不存在');
      return [];
    }
    
    const narrative = [];
    const visited = new Set();
    
    const traverse = (memoryId, depth) => {
      if (depth > maxDepth || visited.has(memoryId)) {
        return;
      }
      
      visited.add(memoryId);
      const memory = this.memories.get(memoryId);
      
      narrative.push({
        id: memoryId,
        content: memory.content,
        timestamp: memory.timestamp,
        depth: depth
      });
      
      // 遍历关系
      for (const [targetId, relationType] of memory.relationships) {
        if (!relationshipFilter || relationshipFilter.includes(relationType)) {
          traverse(targetId, depth + 1);
        }
      }
    };
    
    traverse(startMemoryId, 0);
    
    console.log(`📖 叙事查询完成，包含 ${narrative.length} 个记忆`);
    return narrative;
  }

  /**
   * 时间线查询
   * 按时间顺序检索记忆
   */
  timelineQuery(startTime, endTime) {
    const results = [];
    
    for (const [memoryId, memory] of this.memories) {
      if (memory.timestamp >= startTime && memory.timestamp <= endTime) {
        results.push({
          id: memoryId,
          content: memory.content,
          timestamp: memory.timestamp
        });
      }
    }
    
    // 按时间排序
    results.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`⏱️ 时间线查询完成，找到 ${results.length} 个记忆`);
    return results;
  }

  /**
   * 获取记忆统计
   */
  getStats() {
    return {
      totalMemories: this.memories.size,
      totalRelationships: Array.from(this.memories.values())
        .reduce((sum, mem) => sum + mem.relationships.size, 0),
      vectorDimension: this.config.vectorDimension,
      relationshipTypes: this.config.relationshipTypes,
      memoryUtilization: `${(this.memories.size / this.config.maxMemories * 100).toFixed(2)}%`
    };
  }

  /**
   * 导出记忆库
   */
  export() {
    const data = {
      version: '10.16.0',
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      memories: Array.from(this.memories.entries()).map(([id, mem]) => ({
        id,
        content: mem.content,
        timestamp: mem.timestamp,
        relationships: Array.from(mem.relationships.entries())
      }))
    };
    
    return data;
  }

  /**
   * 导入记忆库
   */
  import(data) {
    for (const memData of data.memories) {
      const memory = {
        id: memData.id,
        content: memData.content,
        timestamp: memData.timestamp,
        vector: this.generateVector(memData.content),
        relationships: new Map(memData.relationships),
        metadata: {
          createdAt: new Date(memData.timestamp).toISOString(),
          accessCount: 0,
          lastAccessed: null
        }
      };
      
      this.memories.set(memData.id, memory);
      this.vectorIndex.set(memData.id, memory.vector);
    }
    
    console.log(`✓ 导入 ${data.memories.length} 个记忆`);
  }
}

// 导出
module.exports = TrialityMemory;

// 使用示例
if (require.main === module) {
  const memory = new TrialityMemory();
  
  // 存储记忆
  const mem1 = memory.store({ text: '用户提出问题：如何优化代码？' });
  const mem2 = memory.store({ text: 'AI 回答：使用模块化设计' });
  const mem3 = memory.store({ text: '用户反馈：很有帮助' });
  
  // 建立关系
  memory.linkMemories(mem1, mem2, 'causal');
  memory.linkMemories(mem2, mem3, 'related');
  
  // 语义搜索
  console.log('\n🔍 语义搜索结果:');
  const searchResults = memory.semanticSearch({ text: '代码优化' }, 2);
  searchResults.forEach(r => console.log(`  - ${r.memoryId}: 相似度 ${r.similarity.toFixed(3)}`));
  
  // 叙事查询
  console.log('\n📖 叙事查询结果:');
  const narrative = memory.narrativeQuery({ startMemoryId: mem1, maxDepth: 2 });
  narrative.forEach(n => console.log(`  - [${n.depth}] ${n.id}`));
  
  // 统计
  console.log('\n📊 记忆库统计:');
  console.log(memory.getStats());
}
