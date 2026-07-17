/**
 * tiered-memory-fusion.js
 * 基于 V21.1 三层GPU缓存设计
 * 心虫记忆层的加权融合机制
 * 
 * 核心思想：
 * L1: 当前batch的组-字关联矩阵 [G, 3000]
 * L2: 最近N个batch的EMA [G, 3000]
 * L3: 长期统计 (整个训练过程的组-字频率)
 * 
 * 读取: L1×0.5 + L2×0.3 + L3×0.2
 * 写入: 每batch更新L1→滑动到L2→定期合并L3
 * 
 * 心虫实现：
 * - L1: 当前对话的即时记忆
 * - L2: 近期对话的滑动窗口（最近N条）
 * - L3: 长期记忆（CORE/LEARNED层）
 */

class TieredMemoryFusion {
  constructor(options = {}) {
    this.l1Size = options.l1Size || 10; // 当前batch大小
    this.l2Window = options.l2Window || 50; // 近期窗口大小
    this.l2Alpha = options.l2Alpha || 0.3; // L2 EMA衰减率
    this.l3MergeInterval = options.l3MergeInterval || 100; // L3合并间隔
    
    // 三层缓存
    this.l1Cache = new Map(); // 当前对话的即时记忆
    this.l2Buffer = []; // 近期记忆滑动窗口
    this.l3Stats = new Map(); // 长期统计
    
    // 权重配置（V21.1 设计）
    this.weights = {
      l1: 0.5, // 当前batch权重
      l2: 0.3, // 近期EMA权重
      l3: 0.2  // 长期统计权重
    };
    
    this.initialized = false;
    this.stats = {
      l1Size: 0,
      l2Size: 0,
      l3Size: 0,
      totalReads: 0,
      totalWrites: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0
    };
    
    this.mergeCounter = 0;
  }

  /**
   * 初始化
   */
  init(memoryLayer = null) {
    if (this.initialized) return true;
    
    // 从现有记忆层加载L3长期统计
    if (memoryLayer) {
      if (memoryLayer.core) {
        for (const [key, value] of Object.entries(memoryLayer.core)) {
          this.l3Stats.set(key, { value, count: 1, lastAccess: Date.now() });
        }
      }
      if (memoryLayer.learned) {
        for (const [key, value] of Object.entries(memoryLayer.learned)) {
          const existing = this.l3Stats.get(key) || { value: 0, count: 0, lastAccess: 0 };
          this.l3Stats.set(key, {
            value: existing.value + (typeof value === 'number' ? value : 1),
            count: existing.count + 1,
            lastAccess: Date.now()
          });
        }
      }
    }
    
    this.initialized = true;
    return true;
  }

  /**
   * 写入：新记忆进入L1
   * @param {String} key - 记忆键
   * @param {*} value - 记忆值
   * @param {Object} metadata - 元数据
   */
  write(key, value, metadata = {}) {
    const entry = {
      key,
      value,
      metadata,
      timestamp: Date.now(),
      accessCount: 0
    };
    
    // 写入L1
    this.l1Cache.set(key, entry);
    this.stats.l1Size = this.l1Cache.size;
    this.stats.totalWrites++;
    
    // 定期合并到L3
    this.mergeCounter++;
    if (this.mergeCounter >= this.l3MergeInterval) {
      this._mergeToL3();
      this.mergeCounter = 0;
    }
    
    return entry;
  }

  /**
   * 读取：三层加权融合
   * @param {String} key - 记忆键
   * @returns {Object} {value, confidence, source, fusedScore}
   */
  read(key) {
    this.stats.totalReads++;
    
    // L1查询
    const l1Entry = this.l1Cache.get(key);
    let l1Score = 0;
    if (l1Entry) {
      l1Score = 1.0;
      this.stats.l1Hits++;
      l1Entry.accessCount++;
    }
    
    // L2查询（近期窗口）
    const l2Entry = this._queryL2(key);
    let l2Score = 0;
    if (l2Entry) {
      l2Score = l2Entry.strength || 0.5;
      this.stats.l2Hits++;
    }
    
    // L3查询（长期统计）
    const l3Entry = this.l3Stats.get(key);
    let l3Score = 0;
    if (l3Entry) {
      // 频率越高，得分越高
      l3Score = Math.min(l3Entry.count / 10, 1.0);
      this.stats.l3Hits++;
      l3Entry.lastAccess = Date.now();
    }
    
    // 加权融合
    const fusedScore = l1Score * this.weights.l1 + l2Score * this.weights.l2 + l3Score * this.weights.l3;
    
    // 确定来源
    let source = 'l3'; // 默认长期记忆
    if (l1Score > 0) source = 'l1';
    else if (l2Score > 0) source = 'l2';
    
    // 返回值优先级：L1 > L2 > L3
    const value = l1Entry?.value || l2Entry?.value || l3Entry?.value || null;
    
    return {
      key,
      value,
      confidence: fusedScore,
      source,
      scores: { l1: l1Score, l2: l2Score, l3: l3Score },
      fusedScore
    };
  }

  /**
   * 批量读取：多个记忆键
   * @param {Array} keys - 记忆键列表
   * @returns {Array} 融合结果列表
   */
  batchRead(keys) {
    return keys.map(key => this.read(key));
  }

  /**
   * 滑动L1到L2
   * 当L1满了，把旧条目移到L2
   */
  slideL1toL2() {
    if (this.l1Cache.size <= this.l1Size) return;
    
    // 按访问时间排序，最旧的移到L2
    const entries = [...this.l1Cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toMove = entries.slice(0, entries.length - this.l1Size);
    
    for (const [key, entry] of toMove) {
      this.l1Cache.delete(key);
      this.l2Buffer.push({
        key,
        value: entry.value,
        strength: 0.8, // 从L1移到L2，初始强度0.8
        timestamp: entry.timestamp
      });
    }
    
    // L2窗口滑动
    if (this.l2Buffer.length > this.l2Window) {
      this.l2Buffer = this.l2Buffer.slice(-this.l2Window);
    }
    
    this.stats.l1Size = this.l1Cache.size;
    this.stats.l2Size = this.l2Buffer.length;
  }

  /**
   * 定期合并L2到L3
   */
  _mergeToL3() {
    for (const entry of this.l2Buffer) {
      const existing = this.l3Stats.get(entry.key) || { value: 0, count: 0, lastAccess: 0 };
      this.l3Stats.set(entry.key, {
        value: existing.value + (typeof entry.value === 'number' ? entry.value : 1),
        count: existing.count + 1,
        lastAccess: Date.now()
      });
    }
    
    this.stats.l3Size = this.l3Stats.size;
  }

  /**
   * L2查询
   */
  _queryL2(key) {
    return this.l2Buffer.find(e => e.key === key) || null;
  }

  /**
   * 获取记忆热力图：哪些记忆被频繁访问
   */
  getMemoryHeatmap(limit = 20) {
    const heatmap = [];
    
    for (const [key, entry] of this.l3Stats) {
      heatmap.push({
        key,
        count: entry.count,
        lastAccess: entry.lastAccess,
        heat: Math.min(entry.count / 10, 1.0)
      });
    }
    
    return heatmap.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * 获取模块状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      stats: { ...this.stats },
      weights: { ...this.weights },
      cacheRatio: {
        l1: this.stats.l1Hits / (this.stats.totalReads || 1),
        l2: this.stats.l2Hits / (this.stats.totalReads || 1),
        l3: this.stats.l3Hits / (this.stats.totalReads || 1)
      }
    };
  }

  /**
   * 获取可持久化的学习数据
   */
  getLearnableData() {
    const l3Data = {};
    for (const [key, entry] of this.l3Stats) {
      l3Data[key] = { value: entry.value, count: entry.count };
    }
    
    return {
      l3Stats: l3Data,
      weights: this.weights
    };
  }
}

module.exports = TieredMemoryFusion;
