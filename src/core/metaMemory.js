/**
 * HeartFlow MetaMemory v1.0.0
 * 
 * Memory that reasons about its own memory.
 * Analyzes memory health, suggests pruning, provides memory statistics,
 * and generates reflective insights about memory system patterns.
 * 
 * Reads from MeaningfulMemory storage to analyze memory distribution,
 * access patterns, age distribution, and fragmentation.
 * 
 * Storage: ${HEARTFLOW_ROOT}/data/meta-memory.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Graceful dependency loading
let MeaningfulMemory = null;

try {
  const MM = require('../memory/memory-adapter.js');
  MeaningfulMemory = MM.MeaningfulMemory;
} catch (e) {
  // MeaningfulMemory not available - will use file-based fallback
}

const DATA_DIR = path.join(__dirname, '../../data');
const META_MEMORY_PATH = path.join(DATA_DIR, 'meta-memory.json');

/**
 * MetaMemory analyzes and reflects on the memory system's own behavior
 */
class MetaMemory {
  constructor(options = {}) {
    this.forgettingThresholdDays = options.forgettingThresholdDays || 14;
    this.lowAccessThreshold = options.lowAccessThreshold || 2;
    this.fragmentationWeight = options.fragmentationWeight || 0.3;
    
    this.reflectionHistory = [];
    this.accessPatterns = {
      emotion: { count: 0, lastAccess: 0 },
      logic: { count: 0, lastAccess: 0 },
      identity: { count: 0, lastAccess: 0 },
      task: { count: 0, lastAccess: 0 },
      other: { count: 0, lastAccess: 0 }
    };
    
    this._loadMetaMemory();
  }

  // ─────────────────────────────────────────
  // CORE API
  // ─────────────────────────────────────────

  /**
   * Analyze overall memory health
   * @param {object} memoryInstance - optional MeaningfulMemory instance to analyze
   * @returns {object} health analysis with scores and metrics
   */
  analyzeMemoryHealth(memoryInstance = null) {
    const memory = memoryInstance || this._getMemoryInstance();
    const now = Date.now();
    
    if (!memory) {
      return this._analyzeFromFile();
    }
    
    // Count entries by layer
    const core = (memory.layers?.core || []).length;
    const learned = (memory.layers?.learned || []).length;
    const ephemeral = (memory.layers?.ephemeral || []).length;
    const total = core + learned + ephemeral;
    
    // Compute fragmentation score
    const fragmentationScore = this._computeFragmentation(memory);
    
    // Age distribution analysis
    const ageDistribution = this._computeAgeDistribution(memory);
    
    // Access pattern analysis
    const accessStats = this._computeAccessStats(memory);
    
    // Memory density (importance-weighted)
    const density = this._computeDensity(memory);
    
    // Health score (0-100)
    const healthScore = Math.round(
      (density.score * 0.3) +
      ((1 - fragmentationScore) * 0.25) +
      (ageDistribution.score * 0.25) +
      (accessStats.score * 0.2)
    );
    
    return {
      timestamp: now,
      totalMemories: total,
      layers: { core, learned, ephemeral },
      healthScore,
      fragmentationScore: Math.round(fragmentationScore * 100) / 100,
      fragmentationDiagnosis: this._diagnoseFragmentation(fragmentationScore),
      ageDistribution,
      accessStats,
      density,
      recommendations: this._generateHealthRecommendations({
        fragmentationScore,
        ageDistribution,
        accessStats,
        density
      })
    };
  }

  /**
   * Suggest memories that should be pruned
   * @param {object} memoryInstance - optional MeaningfulMemory instance
   * @param {number} maxSuggestions - max number of suggestions
   * @returns {array} memories to consider pruning
   */
  suggestPruning(memoryInstance = null, maxSuggestions = 10) {
    const memory = memoryInstance || this._getMemoryInstance();
    const now = Date.now();
    
    if (!memory) {
      return this._suggestFromFile(maxSuggestions);
    }
    
    const suggestions = [];
    const dayMs = 24 * 60 * 60 * 1000;
    
    // Analyze learned and ephemeral layers only (never suggest pruning CORE)
    for (const layer of ['learned', 'ephemeral']) {
      const entries = memory.layers[layer] || [];
      
      for (const entry of entries) {
        // Skip if marked as durable
        if (entry.metadata?.durable || entry.metadata?.lesson) continue;
        
        const age = (now - entry.createdAt) / dayMs;
        const accessCount = entry.accessCount || 0;
        const importance = entry.importance || 10;
        
        // Pruning score: higher = more candidates for deletion
        let pruneScore = 0;
        
        // Age factor: older entries score higher
        if (age > this.forgettingThresholdDays) {
          pruneScore += (age - this.forgettingThresholdDays) * 0.5;
        }
        
        // Access factor: low access = higher score
        if (accessCount <= this.lowAccessThreshold) {
          pruneScore += (this.lowAccessThreshold - accessCount + 1) * 2;
        }
        
        // Importance factor: low importance = higher score
        if (importance < 10) {
          pruneScore += (10 - importance) * 0.5;
        }
        
        // Layer factor: ephemeral more likely to prune
        if (layer === 'ephemeral') {
          pruneScore += 1;
        }
        
        if (pruneScore > 3) {
          suggestions.push({
            id: entry.id,
            layer,
            content: entry.content?.slice(0, 100) || '',
            summary: entry.summary?.slice(0, 80) || '',
            ageDays: Math.round(age * 10) / 10,
            accessCount,
            importance,
            pruneScore: Math.round(pruneScore * 10) / 10,
            reason: this._explainPruneReason(age, accessCount, importance, layer)
          });
        }
      }
    }
    
    // Sort by prune score descending
    suggestions.sort((a, b) => b.pruneScore - a.pruneScore);
    
    return suggestions.slice(0, maxSuggestions);
  }

  /**
   * Get memory statistics
   * @param {object} memoryInstance - optional MeaningfulMemory instance
   * @returns {object} comprehensive memory statistics
   */
  getMemoryStats(memoryInstance = null) {
    const memory = memoryInstance || this._getMemoryInstance();
    const now = Date.now();
    
    if (!memory) {
      return this._statsFromFile();
    }
    
    const layers = {
      core: memory.layers?.core || [],
      learned: memory.layers?.learned || [],
      ephemeral: memory.layers?.ephemeral || []
    };
    
    // Compute per-layer stats
    const layerStats = {};
    for (const [name, entries] of Object.entries(layers)) {
      const ages = entries.map(e => (now - e.createdAt) / (24 * 60 * 60 * 1000));
      const accesses = entries.map(e => e.accessCount || 0);
      const importances = entries.map(e => e.importance || 0);
      
      layerStats[name] = {
        count: entries.length,
        avgAge: ages.length > 0 
          ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length * 10) / 10
          : 0,
        maxAge: ages.length > 0 ? Math.round(Math.max(...ages) * 10) / 10 : 0,
        minAge: ages.length > 0 ? Math.round(Math.min(...ages) * 10) / 10 : 0,
        avgAccess: accesses.length > 0
          ? Math.round(accesses.reduce((a, b) => a + b, 0) / accesses.length * 10) / 10
          : 0,
        avgImportance: importances.length > 0
          ? Math.round(importances.reduce((a, b) => a + b, 0) / importances.length * 10) / 10
          : 0,
        totalImportance: importances.reduce((a, b) => a + b, 0)
      };
    }
    
    // Relationships stats
    const relationshipCount = memory.relationships?.size || 0;
    
    return {
      timestamp: now,
      totalMemories: Object.values(layers).reduce((sum, arr) => sum + arr.length, 0),
      layers: layerStats,
      relationships: relationshipCount,
      storage: {
        hasVectorIndex: memory.vectors?.size > 0,
        vectorCount: memory.vectors?.size || 0
      },
      stats: memory.stats || {}
    };
  }

  /**
   * Reflect on memory system patterns and generate insights
   * @param {object} memoryInstance - optional MeaningfulMemory instance
   * @returns {object} reflective insights about memory system weaknesses
   */
  reflect(memoryInstance = null) {
    const memory = memoryInstance || this._getMemoryInstance();
    const analysis = this.analyzeMemoryHealth(memory);
    const stats = this.getMemoryStats(memory);
    
    const insights = [];
    const weaknesses = [];
    const patterns = [];
    
    // Track access patterns from recent activity
    this._updateAccessPatterns(memory);
    
    // Analyze emotion vs logic access
    const emotionAccess = this.accessPatterns.emotion.count;
    const logicAccess = this.accessPatterns.logic.count;
    
    if (emotionAccess > 0 && logicAccess > 0) {
      const ratio = emotionAccess / logicAccess;
      if (ratio > 2) {
        insights.push(`情感相关记忆访问频率是逻辑相关的 ${Math.round(ratio * 10) / 10} 倍`);
        patterns.push('emotion_dominant');
      } else if (ratio < 0.5) {
        insights.push(`逻辑相关记忆访问频率是情感相关的 ${Math.round((1/ratio) * 10) / 10} 倍`);
        patterns.push('logic_dominant');
      }
    }
    
    // Check for memory imbalance
    if (stats.layers.core && stats.layers.learned) {
      const ratio = stats.layers.learned.count / Math.max(1, stats.layers.core.count);
      if (ratio > 5) {
        insights.push('学习记忆增长过快，可能存在知识过载');
        weaknesses.push('knowledge_overload');
      } else if (ratio < 0.5 && stats.layers.learned.count > 3) {
        insights.push('学习记忆偏少，可能未能从经验中充分学习');
        weaknesses.push('insufficient_learning');
      }
    }
    
    // Fragmentation warning
    if (analysis.fragmentationScore > 0.5) {
      insights.push(`记忆碎片化程度较高 (${Math.round(analysis.fragmentationScore * 100)}%)，建议进行整合`);
      weaknesses.push('high_fragmentation');
    }
    
    // Age distribution issues
    if (analysis.ageDistribution) {
      const oldRatio = analysis.ageDistribution.old / Math.max(1, analysis.totalMemories);
      if (oldRatio > 0.6) {
        insights.push('大量记忆超过14天未访问，可能需要清理或强化');
        weaknesses.push('stale_memories');
      }
    }
    
    // Core memory protection
    const coreMemories = stats.layers.core?.count || 0;
    if (coreMemories < 5) {
      insights.push('核心记忆偏少，身份和指令记忆可能不够稳固');
      weaknesses.push('weak_core_identity');
    }
    
    // Ephemeral overflow
    const ephemeralRatio = stats.layers.ephemeral?.count / Math.max(1, stats.totalMemories);
    if (ephemeralRatio > 0.5) {
      insights.push('临时记忆占比过高，可能影响长期知识积累');
      patterns.push('ephemeral_overflow');
    }
    
    // Store reflection
    const reflectionRecord = {
      id: `refl-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: Date.now(),
      insights: [...insights],
      weaknesses: [...weaknesses],
      patterns: [...patterns],
      accessPatterns: { ...this.accessPatterns }
    };
    
    this.reflectionHistory.push(reflectionRecord);
    this._saveReflection(reflectionRecord);
    
    return {
      reflection: reflectionRecord,
      summary: insights.length > 0 
        ? `发现 ${insights.length} 个可改进点：${insights.slice(0, 3).join('；')}`

        : '记忆系统运行正常，未发现明显弱点',
      fullInsights: insights,
      weaknesses,
      patterns,
      healthScore: analysis.healthScore
    };
  }

  // ─────────────────────────────────────────
  // INTERNAL ANALYZERS
  // ─────────────────────────────────────────

  _computeFragmentation(memory) {
    // Fragmentation = how spread out are memories across layers and relationships
    const total = (memory.layers?.core?.length || 0) +
                  (memory.layers?.learned?.length || 0) +
                  (memory.layers?.ephemeral?.length || 0);
    
    if (total === 0) return 0;
    
    // High fragmentation: many ephemeral with no relationships
    const ephemeralCount = memory.layers?.ephemeral?.length || 0;
    const relationshipCount = memory.relationships?.size || 0;
    
    // Fragmentation score: 0 = well-organized, 1 = highly fragmented
    const relationshipRatio = relationshipCount / Math.max(1, total);
    const ephemeralRatio = ephemeralCount / total;
    
    const fragmentation = (ephemeralRatio * 0.6) + ((1 - relationshipRatio) * 0.4);
    return Math.min(1, Math.max(0, fragmentation));
  }

  _computeAgeDistribution(memory) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const allEntries = [
      ...(memory.layers?.core || []),
      ...(memory.layers?.learned || []),
      ...(memory.layers?.ephemeral || [])
    ];
    
    if (allEntries.length === 0) {
      return { score: 0.5, young: 0, middle: 0, old: 0, total: 0 };
    }
    
    let young = 0, middle = 0, old = 0;
    
    for (const entry of allEntries) {
      const age = (now - (entry.createdAt || entry.timestamp || now)) / dayMs;
      if (age < 3) young++;
      else if (age < 14) middle++;
      else old++;
    }
    
    // Score: balanced distribution is best
    const idealRatio = 1 / 3;
    const youngRatio = young / allEntries.length;
    const middleRatio = middle / allEntries.length;
    const oldRatio = old / allEntries.length;
    
    const imbalance = Math.abs(youngRatio - idealRatio) + 
                      Math.abs(middleRatio - idealRatio) + 
                      Math.abs(oldRatio - idealRatio);
    
    return {
      young,
      middle,
      old,
      total: allEntries.length,
      score: Math.max(0, 1 - imbalance)
    };
  }

  _computeAccessStats(memory) {
    const allEntries = [
      ...(memory.layers?.core || []),
      ...(memory.layers?.learned || []),
      ...(memory.layers?.ephemeral || [])
    ];
    
    if (allEntries.length === 0) return { score: 0.5, avgAccess: 0, neverAccessed: 0 };
    
    const accesses = allEntries.map(e => e.accessCount || 0);
    const neverAccessed = accesses.filter(a => a === 0).length;
    const avgAccess = accesses.reduce((a, b) => a + b, 0) / accesses.length;
    
    // Score: lower never-accessed ratio is better
    const neverRatio = neverAccessed / allEntries.length;
    const score = Math.max(0, 1 - neverRatio * 2);
    
    return {
      avgAccess: Math.round(avgAccess * 10) / 10,
      neverAccessed,
      neverRatio: Math.round(neverRatio * 100) / 100,
      score: Math.round(score * 100) / 100
    };
  }

  _computeDensity(memory) {
    const allEntries = [
      ...(memory.layers?.core || []),
      ...(memory.layers?.learned || []),
      ...(memory.layers?.ephemeral || [])
    ];
    
    if (allEntries.length === 0) return { score: 0, avgImportance: 0 };
    
    const importances = allEntries.map(e => e.importance || 0);
    const avgImportance = importances.reduce((a, b) => a + b, 0) / importances.length;
    
    // Score: higher average importance = better quality density
    const score = Math.min(1, avgImportance / 20);
    
    return {
      avgImportance: Math.round(avgImportance * 10) / 10,
      score: Math.round(score * 100) / 100
    };
  }

  _diagnoseFragmentation(score) {
    if (score < 0.2) return '良好';
    if (score < 0.4) return '可接受';
    if (score < 0.6) return '需要注意';
    return '严重碎片化';
  }

  _generateHealthRecommendations(analysis) {
    const recs = [];
    
    if (analysis.fragmentationScore > 0.4) {
      recs.push('建议运行记忆整合（consolidateMemories）减少碎片化');
    }
    if (analysis.ageDistribution?.old > analysis.ageDistribution?.young) {
      recs.push('旧记忆偏多，建议通过遗忘曲线或主动复习更新记忆');
    }
    if (analysis.accessStats?.neverAccessed > analysis.accessStats?.avgAccess) {
      recs.push('存在大量从未访问的记忆，考虑清理');
    }
    if (analysis.density?.avgImportance < 8) {
      recs.push('记忆整体重要性偏低，可能存在低质量记忆积累');
    }
    
    return recs;
  }

  _explainPruneReason(age, accessCount, importance, layer) {
    const reasons = [];
    if (age > 14) reasons.push(`年龄${Math.round(age)}天超过阈值`);
    if (accessCount <= 2) reasons.push(`访问次数${accessCount}过低`);
    if (importance < 10) reasons.push(`重要性${importance}偏低`);
    if (layer === 'ephemeral') reasons.push('属于临时记忆层');
    return reasons.join('，');
  }

  _updateAccessPatterns(memory) {
    // Track what types of memories are being accessed
    // This would be called when memories are accessed
    // For now, initialize from current memory content
    const allEntries = [
      ...(memory.layers?.core || []),
      ...(memory.layers?.learned || []),
      ...(memory.layers?.ephemeral || [])
    ];
    
    for (const entry of allEntries.slice(0, 50)) {
      const content = (entry.content || '').toLowerCase();
      const category = this._categorizeMemory(content);
      this.accessPatterns[category].count += (entry.accessCount || 1);
    }
  }

  _categorizeMemory(content) {
    if (/情感|感受|情绪|喜欢|讨厌|开心|难过|悲伤|愤怒/.test(content)) return 'emotion';
    if (/逻辑|推理|分析|计算|因果|证明/.test(content)) return 'logic';
    if (/我是|我的身份|我是谁|目标|使命/.test(content)) return 'identity';
    if (/任务|工作|完成|执行|下一步/.test(content)) return 'task';
    return 'other';
  }

  // ─────────────────────────────────────────
  // FALLBACK: FILE-BASED ANALYSIS
  // ─────────────────────────────────────────

  _getMemoryInstance() {
    if (MeaningfulMemory) {
      try {
        return new MeaningfulMemory();
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  _analyzeFromFile() {
    try {
      if (!fs.existsSync(META_MEMORY_PATH)) {
        return { error: 'No meta-memory data available' };
      }
      const raw = fs.readFileSync(META_MEMORY_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return data.lastAnalysis || { error: 'No analysis cached' };
    } catch (e) {
      return { error: e.message };
    }
  }

  _suggestFromFile(maxSuggestions) {
    const analysis = this._analyzeFromFile();
    if (analysis.pruningCandidates) {
      return analysis.pruningCandidates.slice(0, maxSuggestions);
    }
    return [];
  }

  _statsFromFile() {
    try {
      if (!fs.existsSync(META_MEMORY_PATH)) {
        return { error: 'No meta-memory data available' };
      }
      const raw = fs.readFileSync(META_MEMORY_PATH, 'utf-8');
      const data = JSON.parse(raw);
      return data.lastStats || { error: 'No stats cached' };
    } catch (e) {
      return { error: e.message };
    }
  }

  // ─────────────────────────────────────────
  // PERSISTENCE
  // ─────────────────────────────────────────

  _loadMetaMemory() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(META_MEMORY_PATH)) {
        const raw = fs.readFileSync(META_MEMORY_PATH, 'utf-8');
        const data = JSON.parse(raw);
        this.accessPatterns = data.accessPatterns || this.accessPatterns;
        this.reflectionHistory = data.reflectionHistory || [];
      }
    } catch (e) {
      // 已禁用 console.warn: console.warn('[MetaMemory] 加载失败:', e.message);
    }
  }

  _saveReflection(reflection) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        accessPatterns: this.accessPatterns,
        reflectionHistory: this.reflectionHistory.slice(-100), // Keep last 100
        lastReflection: reflection,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(META_MEMORY_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      // 已禁用 console.warn: console.warn('[MetaMemory] 保存失败:', e.message);
    }
  }
}

module.exports = { MetaMemory };
