/**
 * semantic-clusterer.js
 * 基于 V21.1 黑盒V2 多元组架构设计
 * 用规则引擎实现"可训练N元组"——哪些字/概念经常一起出现
 * 替代 V21 的 P3 规则引擎，但用心虫自己的规则语言实现
 * 
 * 核心思想：
 * 1. 不是固定三元组，每个概念可以属于 K 个组（K 可训练）
 * 2. 组数 G 是超参，每组最多占 0.05V 个概念
 * 3. 模型自己学习"概念A+概念B=一组"
 * 
 * 心虫实现：
 * - 用 Q-table 记录概念共现频率
 * - 用规则引擎动态聚类
 * - 用三层缓存（L1当前/L2近期/L3长期）加权融合
 * 
 * @version 1.0.0
 * @author HeartFlow
 * @date 2026-06-30
 */

class SemanticClusterer {
  constructor(options = {}) {
    this.maxGroups = options.maxGroups || 64;
    this.maxConceptsPerGroup = options.maxConceptsPerGroup || 20;
    this.kNeighbors = options.kNeighbors || 5; // 每个概念属于K个组
    this.learningRate = options.learningRate || 0.1;
    
    // 核心数据结构
    this.conceptGroups = new Map(); // concept -> Set of groupIds
    this.groupConcepts = new Map(); // groupId -> Set of concepts
    this.groupStrength = new Map(); // groupId -> activation strength
    this.conceptFrequency = new Map(); // concept -> global frequency
    
    // 三层缓存（V21.1 设计）
    this.l1Cache = new Map(); // 当前batch的概念关联
    this.l2Cache = new Map(); // 最近N个batch的EMA
    this.l3Stats = new Map(); // 长期统计（整个生命周期的概念频率）
    
    // Q-table 集成（心虫自愈RL）
    this.qTable = new Map(); // "conceptA+conceptB" -> Q-value
    this.epsilon = 0.1; // 探索率
    this.gamma = 0.9; // 折扣因子
    
    this.initialized = false;
    this.stats = {
      totalClusters: 0,
      totalConcepts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      qTableSize: 0
    };
  }

  /**
   * 初始化：从记忆层加载历史概念关联
   */
  init(memoryLayer = null) {
    if (this.initialized) return true;
    
    // 从记忆层加载历史数据
    if (memoryLayer && memoryLayer.learned) {
      const learned = memoryLayer.learned;
      if (learned.conceptClusters) {
        for (const [group, concepts] of Object.entries(learned.conceptClusters)) {
          this.groupConcepts.set(group, new Set(concepts));
          concepts.forEach(c => {
            if (!this.conceptGroups.has(c)) this.conceptGroups.set(c, new Set());
            this.conceptGroups.get(c).add(group);
          });
        }
      }
      if (learned.conceptFrequency) {
        for (const [concept, freq] of Object.entries(learned.conceptFrequency)) {
          this.conceptFrequency.set(concept, freq);
          this.l3Stats.set(concept, freq);
        }
      }
      if (learned.qTable) {
        for (const [key, value] of Object.entries(learned.qTable)) {
          this.qTable.set(key, value);
        }
      }
    }
    
    this.initialized = true;
    return true;
  }

  /**
   * 核心方法：将概念列表聚类成组
   * @param {Array} concepts - 概念列表
   * @param {Object} context - 上下文信息
   * @returns {Array} 聚类结果 [{groupId, concepts, strength}]
   */
  cluster(concepts, context = {}) {
    if (!concepts || concepts.length === 0) return [];
    
    // 1. 更新频率统计
    concepts.forEach(c => {
      this.conceptFrequency.set(c, (this.conceptFrequency.get(c) || 0) + 1);
      this.l3Stats.set(c, (this.l3Stats.get(c) || 0) + 1);
    });
    
    // 2. 计算概念间关联强度（基于Q-table）
    const associations = new Map(); // "conceptA+conceptB" -> strength
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const key = this._orderKey(concepts[i], concepts[j]);
        const qVal = this.qTable.get(key) || 0;
        const freqBoost = Math.min(
          (this.conceptFrequency.get(concepts[i]) || 0) +
          (this.conceptFrequency.get(concepts[j]) || 0), 10
        ) * 0.1;
        const strength = qVal + freqBoost;
        if (strength > 0.3) {
          associations.set(key, strength);
        }
      }
    }
    
    // 3. 动态分组（贪心聚类）
    const groups = [];
    const assigned = new Set();
    
    // 按关联强度排序
    const sortedAssocs = [...associations.entries()].sort((a, b) => b[1] - a[1]);
    
    for (const [key, strength] of sortedAssocs) {
      const [c1, c2] = key.split('+');
      if (assigned.has(c1) && assigned.has(c2)) continue;
      if (groups.length >= this.maxGroups) break;
      
      // 查找或创建组
      let group = groups.find(g => 
        g.concepts.has(c1) || g.concepts.has(c2)
      );
      
      if (!group) {
        group = {
          groupId: `g_${Date.now()}_${groups.length}`,
          concepts: new Set(),
          strength: 0,
          members: []
        };
        groups.push(group);
      }
      
      if (!group.concepts.has(c1)) {
        group.concepts.add(c1);
        group.members.push(c1);
        assigned.add(c1);
      }
      if (!group.concepts.has(c2)) {
        group.concepts.add(c2);
        group.members.push(c2);
        assigned.add(c2);
      }
      group.strength += strength;
      
      // 检查组大小限制
      if (group.concepts.size >= this.maxConceptsPerGroup) {
        group.members.forEach(c => assigned.add(c));
      }
    }
    
    // 4. 未分配的概念单独成组
    concepts.forEach(c => {
      if (!assigned.has(c)) {
        groups.push({
          groupId: `g_${Date.now()}_${groups.length}`,
          concepts: new Set([c]),
          strength: 0.1,
          members: [c]
        });
      }
    });
    
    // 5. 更新L1缓存
    this.l1Cache.clear();
    groups.forEach(g => {
      g.members.forEach(c => {
        if (!this.l1Cache.has(c)) this.l1Cache.set(c, []);
        this.l1Cache.get(c).push({ groupId: g.groupId, strength: g.strength });
      });
    });
    
    // 6. 更新统计
    this.stats.totalClusters = groups.length;
    this.stats.totalConcepts = concepts.length;
    this.stats.cacheMisses++;
    
    return groups.map(g => ({
      groupId: g.groupId,
      concepts: [...g.concepts],
      strength: Math.min(g.strength, 1.0)
    }));
  }

  /**
   * 从聚类结果中提取组间关系
   * @param {Array} groups - 聚类结果
   * @returns {Array} 关系列表 [{from, to, type, strength}]
   */
  extractRelations(groups) {
    const relations = [];
    
    for (const group of groups) {
      if (group.concepts.length < 2) continue;
      
      // 组内关系：强关联
      for (let i = 0; i < group.concepts.length; i++) {
        for (let j = i + 1; j < group.concepts.length; j++) {
          relations.push({
            from: group.concepts[i],
            to: group.concepts[j],
            type: 'co_occurrence',
            strength: group.strength,
            source: 'semantic-clusterer'
          });
        }
      }
      
      // 组间关系：如果概念出现在多个组
      for (const concept of group.concepts) {
        const otherGroups = groups.filter(g => 
          g.groupId !== group.groupId && g.concepts.includes(concept)
        );
        otherGroups.forEach(og => {
          relations.push({
            from: group.groupId,
            to: og.groupId,
            type: 'bridge',
            strength: 0.3,
            source: 'semantic-clusterer'
          });
        });
      }
    }
    
    return relations;
  }

  /**
   * 学习模式：从反馈中更新Q-table
   * @param {String} conceptA 
   * @param {String} conceptB 
   * @param {Number} reward - 关联强度的反馈（0-1）
   */
  learn(conceptA, conceptB, reward) {
    const key = this._orderKey(conceptA, conceptB);
    const oldQ = this.qTable.get(key) || 0;
    
    // Q-learning更新
    const newQ = oldQ + this.learningRate * (reward + this.gamma * Math.max(...this.qTable.values() || [0]) - oldQ);
    this.qTable.set(key, newQ);
    
    // 更新L2缓存（EMA）
    const l2Key = `ema_${key}`;
    const oldL2 = this.l2Cache.get(l2Key) || 0;
    this.l2Cache.set(l2Key, oldL2 * 0.7 + newQ * 0.3);
    
    this.stats.qTableSize = this.qTable.size;
    return newQ;
  }

  /**
   * 三层缓存加权融合读取
   * @param {String} conceptA 
   * @param {String} conceptB 
   * @returns {Number} 融合后的关联强度
   */
  getAssociationStrength(conceptA, conceptB) {
    const key = this._orderKey(conceptA, conceptB);
    
    // L1: 当前batch（权重0.5）
    const l1 = this.l1Cache.get(conceptA)?.find(a => a.groupId.includes(conceptB))?.strength || 0;
    
    // L2: 近期EMA（权重0.3）
    const l2 = this.l2Cache.get(`ema_${key}`) || 0;
    
    // L3: 长期统计（权重0.2）
    const freqA = this.l3Stats.get(conceptA) || 0;
    const freqB = this.l3Stats.get(conceptB) || 0;
    const l3 = Math.min(freqA + freqB, 10) * 0.1;
    
    // 加权融合
    const fused = l1 * 0.5 + l2 * 0.3 + l3 * 0.2;
    this.stats.cacheHits++;
    
    return fused;
  }

  /**
   * 获取概念的所有关联概念
   * @param {String} concept 
   * @param {Number} threshold - 关联强度阈值
   * @returns {Array} [{concept, strength, groupId}]
   */
  getAssociations(concept, threshold = 0.3) {
    const associations = [];
    
    // 从Q-table查找
    for (const [key, qVal] of this.qTable) {
      if (key.includes(concept)) {
        const other = key.replace(concept, '').replace('+', '');
        const strength = this.getAssociationStrength(concept, other);
        if (strength >= threshold) {
          // 查找groupId
          let groupId = null;
          for (const [gid, concepts] of this.groupConcepts) {
            if (concepts.has(concept) && concepts.has(other)) {
              groupId = gid;
              break;
            }
          }
          associations.push({ concept: other, strength, groupId });
        }
      }
    }
    
    return associations.sort((a, b) => b.strength - a.strength);
  }

  /**
   * 获取模块状态摘要
   */
  getStatus() {
    return {
      initialized: this.initialized,
      stats: { ...this.stats },
      maxGroups: this.maxGroups,
      currentGroups: this.groupConcepts.size,
      kNeighbors: this.kNeighbors,
      cacheRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses || 1)
    };
  }

  /**
   * 获取可持久化的学习数据
   */
  getLearnableData() {
    const conceptClusters = {};
    for (const [gid, concepts] of this.groupConcepts) {
      conceptClusters[gid] = [...concepts];
    }
    
    const qTableObj = {};
    for (const [key, value] of this.qTable) {
      qTableObj[key] = value;
    }
    
    return {
      conceptClusters,
      conceptFrequency: Object.fromEntries(this.conceptFrequency),
      qTable: qTableObj
    };
  }

  // 辅助方法
  _orderKey(c1, c2) {
    return c1 < c2 ? `${c1}+${c2}` : `${c2}+${c1}`;
  }
}

module.exports = SemanticClusterer;
