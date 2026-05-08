/**
 * HeartFlow 遗忘引擎 v11.15.0
 * 
 * 基于 GitHub 研究:
 * - mem0ai/mem0 (54.8k星) - 通用记忆层
 * - topoteretes/cognee (17k星) - "6行代码的记忆控制平面"
 * - MemoriLabs/Memori (14k星) - Agent原生的持久结构化记忆
 * 
 * 核心洞察:
 * "为学日益，为道日损" — 记忆增加是加法，但智慧是减法
 * 真正强大的AI不是记住一切，而是知道什么该遗忘
 * 
 * 功能:
 * 1. 遗忘曲线模拟 (Ebbinghaus): 不常用的记忆自然衰减
 * 2. 重要性重排: 根据访问频率和时效性重新排序
 * 3. 记忆整合: 相似的记忆碎片合并
 * 4. 主动遗忘: 对潜在有害/误导的记忆主动标记遗忘
 * 5. 战略保留: 核心身份和关键偏好永远保留
 */

class ForgettingEngine {
  constructor(config = {}) {
    this.config = {
      decayRate: config.decayRate || 0.1,       // 遗忘速率
      consolidationThreshold: config.consolidationThreshold || 0.3,  // 整合阈值
      minRelevance: config.minRelevance || 0.15, // 最低相关性阈值
      maxMemoryAge: config.maxMemoryAge || 30 * 24 * 60 * 60 * 1000, // 30天
      protectedPatterns: config.protectedPatterns || [
        'CORE_IDENTITY', 'heartflow', '老大', '身份', '核心'
      ],
      ...config
    };
    
    this.decaySchedule = {
      fast: 0.3,    // 1-7天
      medium: 0.15, // 7-30天
      slow: 0.05    // 30天以上
    };
    
    this.stats = {
      totalDecayCycles: 0,
      memoriesPruned: 0,
      memoriesConsolidated: 0,
      memoriesProtected: 0
    };
  }

  /**
   * 评估记忆的当前"强度"
   * 基于访问频率、最近访问时间、重要性
   */
  evaluateMemoryStrength(memory) {
    const now = Date.now();
    const age = now - (memory.lastAccessed || memory.createdAt);
    const accessCount = memory.accessCount || 0;
    const reinforcementCount = memory.reinforcementCount || 0;
    
    // 1. 访问频率强度 (指数衰减)
    const accessStrength = Math.min(1, accessCount / 10);
    
    // 2. 强化强度 (agent确认的次数)
    const reinforcementStrength = Math.min(1, reinforcementCount / 5);
    
    // 3. 时间衰减强度 (基于遗忘曲线)
    const ageInDays = age / (24 * 60 * 60 * 1000);
    let decayRate;
    if (ageInDays <= 7) {
      decayRate = this.decaySchedule.fast;
    } else if (ageInDays <= 30) {
      decayRate = this.decaySchedule.medium;
    } else {
      decayRate = this.decaySchedule.slow;
    }
    
    // 遗忘曲线: S = e^(-t/τ)
    const timeStrength = Math.exp(-ageInDays * decayRate);
    
    // 4. 重要性加成 (元记忆)
    const importanceBoost = (memory.metadata?.importance || 0.5) * 0.2;
    
    // 综合强度
    const strength = (
      accessStrength * 0.3 +
      reinforcementStrength * 0.3 +
      timeStrength * 0.3 +
      importanceBoost +
      0.1  // 基础强度
    );
    
    return {
      strength: Math.min(1, Math.max(0, strength)),
      components: {
        access: accessStrength,
        reinforcement: reinforcementStrength,
        time: timeStrength,
        ageInDays: Math.round(ageInDays * 10) / 10
      }
    };
  }

  /**
   * 决定哪些记忆需要被遗忘
   * @param {Array} memories - 记忆数组
   * @returns {Object} 遗忘决策
   */
  decideForgetting(memories) {
    const decisions = {
      keep: [],
      decay: [],
      consolidate: [],
      forget: [],
      protect: []
    };
    
    for (const memory of memories) {
      // 1. 检查是否受保护
      const isProtected = this.config.protectedPatterns.some(
        pattern => memory.content && memory.content.includes(pattern)
      );
      
      if (isProtected) {
        decisions.protect.push({
          memory,
          reason: '匹配保护模式',
          strength: 1.0
        });
        this.stats.memoriesProtected++;
        continue;
      }
      
      // 2. 评估强度
      const { strength, components } = this.evaluateMemoryStrength(memory);
      
      // 3. 决定行动
      if (strength >= 0.6) {
        decisions.keep.push({
          memory,
          strength,
          components,
          reason: '强度充足'
        });
      } else if (strength >= 0.3) {
        decisions.decay.push({
          memory,
          strength,
          components,
          reason: `强度不足(decay), 时间=${components.ageInDays}天`
        });
      } else if (strength >= this.config.minRelevance) {
        decisions.consolidate.push({
          memory,
          strength,
          components,
          reason: '需要整合到其他记忆'
        });
      } else {
        decisions.forget.push({
          memory,
          strength,
          components,
          reason: `强度过低(${strength.toFixed(2)})，建议遗忘`
        });
      }
    }
    
    return decisions;
  }

  /**
   * 整合相似记忆
   * @param {Array} memories - 需要整合的记忆
   * @returns {Array} 整合后的记忆
   */
  consolidateMemories(memories) {
    if (memories.length < 2) return memories;
    
    const groups = [];
    const used = new Set();
    
    // 简单相似度分组
    for (let i = 0; i < memories.length; i++) {
      if (used.has(memories[i].memory.id)) continue;
      
      const group = [memories[i]];
      used.add(memories[i].memory.id);
      
      for (let j = i + 1; j < memories.length; j++) {
        if (used.has(memories[j].memory.id)) continue;
        
        const similarity = this._calculateSimilarity(
          memories[i].memory.content,
          memories[j].memory.content
        );
        
        if (similarity >= this.config.consolidationThreshold) {
          group.push(memories[j]);
          used.add(memories[j].memory.id);
        }
      }
      
      if (group.length > 1) {
        groups.push(group);
      }
    }
    
    // 生成整合后的记忆
    const consolidated = [];
    for (const group of groups) {
      this.stats.memoriesConsolidated++;
      
      // 保留最强的，合并其他的内容
      const primary = group.reduce((a, b) => 
        a.strength > b.strength ? a : b
      );
      
      const mergedContent = group
        .map(g => g.memory.content)
        .join(' [整合] ');
      
      consolidated.push({
        original: group.map(g => g.memory.id),
        consolidated: primary.memory.id,
        content: mergedContent.substring(0, 500),  // 限制长度
        combinedStrength: group.reduce((a, b) => a + b.strength, 0) / group.length,
        mergedFrom: group.length
      });
    }
    
    return consolidated;
  }

  /**
   * 简单的文本相似度 (Jaccard)
   */
  _calculateSimilarity(text1, text2) {
    const tokens1 = new Set(text1.toLowerCase().split(/\s+/));
    const tokens2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = [...tokens1].filter(t => tokens2.has(t)).length;
    const union = new Set([...tokens1, ...tokens2]).size;
    
    return union > 0 ? intersection / union : 0;
  }

  /**
   * 遗忘操作
   * @param {Object} decisions - decideForgetting的输出
   * @returns {Object} 遗忘执行结果
   */
  executeForgetting(decisions) {
    const results = {
      pruned: [],
      decayed: [],
      consolidated: [],
      forgotten: [],
      protected: decisions.protect.length
    };
    
    // 1. 彻底遗忘 (标记删除)
    for (const item of decisions.forget) {
      results.forgotten.push({
        id: item.memory.id,
        reason: item.reason,
        lastStrength: item.strength
      });
      this.stats.memoriesPruned++;
    }
    
    // 2. 衰减 (降低优先级，等待后续遗忘)
    for (const item of decisions.decay) {
      results.decayed.push({
        id: item.memory.id,
        newStrength: item.strength * 0.8,  // 衰减20%
        reason: item.reason
      });
    }
    
    // 3. 整合
    if (decisions.consolidate.length > 0) {
      const consolidated = this.consolidateMemories(decisions.consolidate);
      results.consolidated = consolidated;
    }
    
    this.stats.totalDecayCycles++;
    
    return results;
  }

  /**
   * 完整遗忘流程
   * @param {Array} memories - 记忆数组
   * @returns {Object} 执行结果
   */
  processMemory(memories) {
    const decisions = this.decideForgetting(memories);
    const results = this.executeForgetting(decisions);
    
    return {
      decisions,
      results,
      stats: this.getStats(),
      summary: this._generateSummary(decisions, results)
    };
  }

  /**
   * 生成摘要
   */
  _generateSummary(decisions, results) {
    return {
      total: decisions.keep.length + decisions.decay.length + 
             decisions.consolidate.length + decisions.forget.length + 
             decisions.protect.length,
      keep: decisions.keep.length,
      decay: decisions.decay.length,
      consolidate: decisions.consolidate.length,
      forget: decisions.forget.length,
      protect: decisions.protect.length,
      action: decisions.forget.length > decisions.keep.length
        ? '⚠️ 遗忘多于保留，检查遗忘曲线配置'
        : decisions.keep.length > decisions.protect.length * 2
        ? '✓ 记忆健康，有足够的战略保留'
        : '○ 记忆平衡'
    };
  }

  /**
   * 获取统计
   */
  getStats() {
    return {
      ...this.stats,
      decayRate: this.config.decayRate,
      minRelevance: this.config.minRelevance
    };
  }

  /**
   * 重要性重新评估
   * 当发现某条记忆被频繁使用时，提升其重要性
   */
  reassessImportance(memoryId, recentAccessCount) {
    if (recentAccessCount >= 5) {
      return {
        memoryId,
        newImportance: Math.min(1, 0.5 + recentAccessCount * 0.05),
        reason: `近期访问${recentAccessCount}次，提升重要性`
      };
    }
    return null;
  }

  /**
   * 兼容方法：直接传入 memories 数组执行遗忘周期
   * @param {Array} memories - 记忆数组
   * @returns {Object} processMemory 的结果
   */
  runDecayCycle(memories = []) {
    return this.processMemory(memories);
  }
}

module.exports = { ForgettingEngine };
