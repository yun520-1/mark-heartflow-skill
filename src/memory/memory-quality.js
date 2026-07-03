/**
 * MemoryQuality v1.0.0 — 记忆质量评估与维护引擎
 *
 * 核心功能:
 *   1. Ebbinghaus 遗忘曲线：按 tier 应用不同衰减率
 *   2. 记忆质量评分 (0-1)：综合访问频率、时效性、关联强度、创建置信度
 *   3. 记忆修剪：总量超阈值时优先修剪低质量记忆
 *   4. 记忆污染检测：识别可能被冲突条目覆盖的记忆
 *
 * 设计约束:
 *   - 纯 JS，无外部依赖
 *   - 可导入并与 MemoryAdapter / pipeline "memory" 阶段集成
 *   - 不修改原始记忆对象，所有计算基于副本
 */

const VERSION = '1.0.0';

// ─── 衰减率（每小时） ─────────────────────────────────────
const DECAY_RATES = Object.freeze({
  CORE:     0.001,  // 核心身份规则，极慢衰减
  LEARNED:  0.01,   // 习得知识，慢衰减
  EPHEMERAL: 0.05,  // 工作记忆，快速衰减
});

// ─── 质量评分权重 ─────────────────────────────────────────
const WEIGHTS = Object.freeze({
  accessFrequency: 0.30,
  recency:         0.25,
  association:     0.20,
  confidence:      0.15,
  tierBonus:       0.10,
});

// ─── 默认配置 ────────────────────────────────────────────
const DEFAULTS = Object.freeze({
  maxMemories:            5000,
  minQuality:             0.05,
  contaminationThreshold: 2,
  accessHalfLife:         720,   // 小时
  recencyHalfLife:        168,   // 小时（7天）
});

// ─── 内部工具 ────────────────────────────────────────────

function clamp01(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function logNormalize(value, max) {
  if (max <= 0) return 0;
  return clamp01(Math.log2(1 + value) / Math.log2(1 + max));
}

function getField(mem, path, fallback) {
  if (!mem || typeof mem !== 'object') return fallback;
  const parts = path.split('.');
  let cur = mem;
  for (const p of parts) {
    if (cur == null) return fallback;
    cur = cur[p];
  }
  return cur !== undefined ? cur : fallback;
}

function msToHours(ms) {
  return ms / 3_600_000;
}

// ═══════════════════════════════════════════════════════════
//  MemoryQuality
// ═══════════════════════════════════════════════════════════

class MemoryQuality {
  /**
   * @param {object} [options]
   * @param {number} [options.maxMemories=5000]
   * @param {number} [options.minQuality=0.05]
   * @param {number} [options.contaminationThreshold=2]
   */
  constructor(options = {}) {
    this.version = VERSION;
    this.config = {
      maxMemories:          options.maxMemories          || DEFAULTS.maxMemories,
      minQuality:           options.minQuality           || DEFAULTS.minQuality,
      contaminationThreshold: options.contaminationThreshold || DEFAULTS.contaminationThreshold,
      accessHalfLife:       options.accessHalfLife        || DEFAULTS.accessHalfLife,
      recencyHalfLife:      options.recencyHalfLife       || DEFAULTS.recencyHalfLife,
    };
    this._stats = { scored: 0, decayed: 0, pruned: 0, contaminated: 0 };
  }

  /**
   * 获取累计统计
   * @returns {{ scored: number, decayed: number, pruned: number, contaminated: number }}
   */
  getStats() {
    return { ...this._stats };
  }

  /**
   * 重置统计计数器
   * @returns {MemoryQuality}
   */
  resetStats() {
    this._stats = { scored: 0, decayed: 0, pruned: 0, contaminated: 0 };
    return this;
  }

  // ─── 质量评分 ──────────────────────────────────────────

  /**
   * 计算单条记忆的质量分数 (0-1)
   *
   * 评分 = accessFreq(30%) + recency(25%) + association(20%)
   *      + confidence(15%) + tierBonus(10%)
   *
   * @param {object} memory — 记忆对象
   * @param {object} [options]
   * @param {number} [options.maxAccessCount]
   * @param {number} [options.maxAgeHours]
   * @param {Map}    [options.associationGraph]
   * @param {string} [options.memoryKey]
   * @returns {number} 0-1
   */
  score(memory, options = {}) {
    const now = Date.now();

    // 1. 访问频率分
    const accessCount = getField(memory, 'accessCount', 0);
    const maxAccess   = options.maxAccessCount != null ? options.maxAccessCount : 50;
    const accessScore = logNormalize(accessCount, maxAccess);

    // 2. 时效性分（半衰期衰减）
    const createdAt  = getField(memory, 'createdAt', now);
    const updatedAt  = getField(memory, 'updatedAt', createdAt);
    const editHours  = msToHours(now - updatedAt);
    const recencyScore = Math.pow(0.5, editHours / this.config.recencyHalfLife);

    // 3. 关联强度分
    let associationScore = 0;
    if (options.associationGraph && options.memoryKey) {
      const assocs = options.associationGraph.get(options.memoryKey);
      if (assocs && assocs.size > 0) {
        const strengths = [...assocs].map(a =>
          getField(a, 'strength', getField(a, 'similarity', 0))
        );
        associationScore = clamp01(
          strengths.reduce((s, v) => s + v, 0) / Math.max(strengths.length, 1)
        );
      }
    }

    // 4. 置信度分（importance 作为代理）
    const importance      = getField(memory, 'importance', 5);
    const confidenceScore = clamp01(importance / 20);

    // 5. 层级加权
    const layer     = (getField(memory, 'layer', 'learned') || 'learned').toUpperCase();
    const tierBonus = layer === 'CORE' ? 1.0 : layer === 'LEARNED' ? 0.6 : 0.3;

    // 加权求和
    const raw =
      accessScore     * WEIGHTS.accessFrequency +
      recencyScore    * WEIGHTS.recency +
      associationScore * WEIGHTS.association +
      confidenceScore * WEIGHTS.confidence +
      tierBonus       * WEIGHTS.tierBonus;

    this._stats.scored++;
    return clamp01(raw);
  }

  // ─── 批量衰减 ──────────────────────────────────────────

  /**
   * 对所有记忆应用遗忘曲线衰减
   * Ebbinghaus: S(t) = e^(-lambda * t)
   *
   * @param {Array} memories
   * @param {number} hoursPassed
   * @param {Map} [associationGraph]
   * @returns {Array} 新记忆数组（不修改原数组）
   */
  decayAll(memories, hoursPassed, associationGraph = null) {
    if (!Array.isArray(memories) || hoursPassed <= 0) {
      return memories.map(m => ({ ...m }));
    }

    return memories.map(mem => {
      const layer      = (getField(mem, 'layer', 'learned') || 'learned').toUpperCase();
      const decayRate  = DECAY_RATES[layer] || DECAY_RATES.LEARNED;
      const decayFactor = Math.exp(-decayRate * hoursPassed);

      const originalImportance = getField(mem, 'importance', 5);
      const decayedImportance  = Math.max(1, Math.round(originalImportance * decayFactor));

      // 衰减关联强度
      let decayedAssociations = null;
      if (associationGraph && mem.metadata && mem.metadata.key) {
        const key   = mem.metadata.key;
        const assocs = associationGraph.get(key);
        if (assocs) {
          decayedAssociations = [...assocs].map(a => ({
            key: a.key,
            strength: getField(a, 'strength', getField(a, 'similarity', 0)) * decayFactor,
          }));
        }
      }

      const out = { ...mem };
      out.importance = decayedImportance;
      if (decayedAssociations !== null) {
        out._decayedAssociations = decayedAssociations;
      }
      this._stats.decayed++;
      return out;
    });
  }

  // ─── 记忆修剪 ──────────────────────────────────────────

  /**
   * 修剪低质量记忆
   *
   * @param {Array} memories
   * @param {number} [maxCount]
   * @param {object} [options]
   * @param {Map}    [options.associationGraph]
   * @returns {{ pruned: Array, kept: Array, stats: object }}
   */
  prune(memories, maxCount, options = {}) {
    const limit = maxCount != null ? maxCount : this.config.maxMemories;
    if (!Array.isArray(memories) || memories.length <= limit) {
      return {
        pruned: [],
        kept:   memories,
        stats:  { total: memories.length, limit, prunedCount: 0, keptCount: memories.length },
      };
    }

    // 为每条记忆计算质量分
    const maxAccess = this._computeMaxAccess(memories);
    const maxAge    = this._computeMaxAge(memories);

    const scored = memories.map((mem, idx) => {
      const key    = getField(mem, 'metadata.key', mem.id || ('mem_' + idx));
      const quality = this.score(mem, {
        maxAccessCount: maxAccess,
        maxAgeHours:    maxAge,
        associationGraph: options.associationGraph || null,
        memoryKey: key,
      });
      return { mem, key, quality, layer: (getField(mem, 'layer', 'learned') || 'learned').toUpperCase() };
    });

    // CORE 不修剪，除非整体严重超标
    const coreItems    = scored.filter(s => s.layer === 'CORE');
    const prunable     = scored.filter(s => s.layer !== 'CORE');
    prunable.sort((a, b) => a.quality - b.quality);

    const overCount      = memories.length - limit;
    const pruneFromPool  = Math.max(0, overCount - coreItems.length);
    const prunedPrunable = pruneFromPool > 0 ? prunable.slice(0, pruneFromPool) : [];
    const keptPrunable   = pruneFromPool > 0 ? prunable.slice(pruneFromPool) : prunable;

    // 如果 CORE 也超了
    let prunedCore = [];
    let keptCore   = coreItems;
    if (overCount > 0 && coreItems.length > limit) {
      const coreOver = coreItems.length - Math.max(0, limit - prunable.length);
      coreItems.sort((a, b) => a.quality - b.quality);
      prunedCore = coreItems.slice(0, coreOver);
      keptCore   = coreItems.slice(coreOver);
    }

    const pruned = [...prunedCore.map(s => s.mem), ...prunedPrunable.map(s => s.mem)];
    const kept   = [...keptCore.map(s => s.mem), ...keptPrunable.map(s => s.mem)];

    this._stats.pruned += pruned.length;

    return {
      pruned,
      kept,
      stats: {
        total:       memories.length,
        limit,
        prunedCount: pruned.length,
        keptCount:   kept.length,
        fromCore:    prunedCore.length,
        fromPrunable: prunedPrunable.length,
      },
    };
  }

  // ─── 污染检测 ──────────────────────────────────────────

  /**
   * 检测记忆污染
   *
   * @param {Array} memories
   * @param {object} [options]
   * @returns {Array<{ type, severity, memoryKey, description, ... }>}
   */
  detectContamination(memories, options = {}) {
    const reports = [];

    // 1. Key 冲突检测
    const keyIndex = new Map();
    for (const mem of memories) {
      const key = getField(mem, 'metadata.key', mem.id);
      if (!key) continue;
      if (!keyIndex.has(key)) keyIndex.set(key, []);
      keyIndex.get(key).push({ mem, layer: getField(mem, 'layer'), id: mem.id });
    }

    for (const [key, entries] of keyIndex) {
      if (entries.length >= this.config.contaminationThreshold) {
        const scored = entries.map(e => ({
          ...e,
          quality: this.score(e.mem, { memoryKey: key }),
        }));
        scored.sort((a, b) => a.quality - b.quality);

        reports.push({
          type: 'key_conflict',
          severity: entries.length > 3 ? 'high' : 'medium',
          memoryKey: key,
          conflicts: entries.map(e => ({
            id: e.id,
            layer: e.layer,
            quality: scored.find(s => s.id === e.id)?.quality,
          })),
          description: 'Key "' + key + '" 出现 ' + entries.length + ' 次，可能存在覆盖写入',
          suspectedOverwritten: scored[0].id,
        });
        this._stats.contaminated++;
      }
    }

    // 2. 质量骤降检测
    const maxAccess = this._computeMaxAccess(memories);
    const maxAge    = this._computeMaxAge(memories);
    const lowQuality = memories.filter(mem => {
      const key = getField(mem, 'metadata.key', mem.id);
      return this.score(mem, { maxAccessCount: maxAccess, maxAgeHours: maxAge, memoryKey: key })
        < this.config.minQuality;
    });

    if (lowQuality.length > 0) {
      reports.push({
        type: 'quality_collapse',
        severity: lowQuality.length > memories.length * 0.1 ? 'high' : 'low',
        count: lowQuality.length,
        memoryKeys: lowQuality.map(m => getField(m, 'metadata.key', m.id)),
        description: lowQuality.length + ' 条记忆质量分低于 ' + this.config.minQuality + '，可能已被污染或过期',
      });
      this._stats.contaminated++;
    }

    // 3. CORE 层近期写入检测
    const recentCore = memories.filter(mem => {
      const layer = (getField(mem, 'layer', '') || '').toUpperCase();
      if (layer !== 'CORE') return false;
      const updatedAt = getField(mem, 'updatedAt', 0);
      const createdAt = getField(mem, 'createdAt', 0);
      return (updatedAt - createdAt) > 0 && msToHours(updatedAt - createdAt) < 24;
    });

    if (recentCore.length > 0) {
      reports.push({
        type: 'core_rewrite',
        severity: 'medium',
        count: recentCore.length,
        memoryKeys: recentCore.map(m => getField(m, 'metadata.key', m.id)),
        description: recentCore.length + ' 条 CORE 记忆在 24h 内被更新——CORE 应为不可变规则',
      });
      this._stats.contaminated++;
    }

    return reports;
  }

  // ─── 质量分布 ──────────────────────────────────────────

  /**
   * 获取记忆质量分布统计
   *
   * @param {Array} memories
   * @returns {{
   *   total: number,
   *   avgQuality: number,
   *   minQuality: number,
   *   maxQuality: number,
   *   distribution: { excellent, good, fair, poor, critical },
   *   byTier: { CORE, LEARNED, EPHEMERAL } each with { count, avg, min, max },
   *   histogram: Array<{ range: string, count: number }>
   * }}
   */
  getQualityDistribution(memories) {
    if (!Array.isArray(memories) || memories.length === 0) {
      return this._emptyDistribution();
    }

    const maxAccess = this._computeMaxAccess(memories);
    const maxAge    = this._computeMaxAge(memories);

    const scores = [];
    const tierData = {
      CORE:     { scores: [], count: 0 },
      LEARNED:  { scores: [], count: 0 },
      EPHEMERAL: { scores: [], count: 0 },
    };

    for (const mem of memories) {
      const key  = getField(mem, 'metadata.key', mem.id);
      const tier = (getField(mem, 'layer', 'learned') || 'learned').toUpperCase();
      const q    = this.score(mem, { maxAccessCount: maxAccess, maxAgeHours: maxAge, memoryKey: key });
      scores.push(q);
      if (tierData[tier]) {
        tierData[tier].scores.push(q);
        tierData[tier].count++;
      }
    }

    const buckets = { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 };
    for (const q of scores) {
      if (q >= 0.8)       buckets.excellent++;
      else if (q >= 0.6)  buckets.good++;
      else if (q >= 0.4)  buckets.fair++;
      else if (q >= 0.2)  buckets.poor++;
      else                buckets.critical++;
    }

    const histogram = [];
    for (let i = 0; i < 10; i++) {
      const low  = i * 0.1;
      const high = (i + 1) * 0.1;
      const count = i === 9
        ? scores.filter(s => s >= low).length
        : scores.filter(s => s >= low && s < high).length;
      histogram.push({ range: low.toFixed(1) + '-' + high.toFixed(1), count });
    }

    const tierStats = {};
    for (const [tier, data] of Object.entries(tierData)) {
      if (data.count === 0) {
        tierStats[tier] = { count: 0, avg: 0, min: 0, max: 0 };
      } else {
        const sum = data.scores.reduce((a, b) => a + b, 0);
        tierStats[tier] = {
          count: data.count,
          avg:   sum / data.count,
          min:   Math.min(...data.scores),
          max:   Math.max(...data.scores),
        };
      }
    }

    return {
      total:        memories.length,
      avgQuality:   scores.reduce((a, b) => a + b, 0) / scores.length,
      minQuality:   Math.min(...scores),
      maxQuality:   Math.max(...scores),
      distribution: buckets,
      byTier:       tierStats,
      histogram,
    };
  }

  // ─── Pipeline 集成 ──────────────────────────────────────

  /**
   * Pipeline memory stage 后处理钩子
   *
   * 在 pipeline 的 "memory" stage 末尾调用：
   *   const step = hf.memoryQuality.pipelineStep(allMemories, { maxCount: 5000 });
   *   ctx.memoryQuality = step;
   *
   * @param {Array} allMemories — 三层记忆合并数组
   * @param {object} [options]
   * @returns {{ shouldPrune: boolean, pruneResult: object|null, contamination: Array, distribution: object }}
   */
  pipelineStep(allMemories, options = {}) {
    const maxCount = options.maxCount || this.config.maxMemories;

    const distribution  = this.getQualityDistribution(allMemories);
    const contamination = this.detectContamination(allMemories);
    const shouldPrune   = allMemories.length > maxCount;

    let pruneResult = null;
    if (shouldPrune) {
      pruneResult = this.prune(allMemories, maxCount, options);
    }

    return { shouldPrune, pruneResult, contamination, distribution };
  }

  // ─── 内部方法 ──────────────────────────────────────────

  _computeMaxAccess(memories) {
    let max = 0;
    for (const m of memories) {
      const ac = getField(m, 'accessCount', 0);
      if (ac > max) max = ac;
    }
    return max > 0 ? max : 1;
  }

  _computeMaxAge(memories) {
    const now = Date.now();
    let maxMs = 0;
    for (const m of memories) {
      const age = now - getField(m, 'createdAt', now);
      if (age > maxMs) maxMs = age;
    }
    const hours = msToHours(maxMs);
    return hours > 0 ? hours : 1;
  }

  _emptyDistribution() {
    return {
      total: 0,
      avgQuality: 0,
      minQuality: 0,
      maxQuality: 0,
      distribution: { excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 },
      byTier: {
        CORE:      { count: 0, avg: 0, min: 0, max: 0 },
        LEARNED:   { count: 0, avg: 0, min: 0, max: 0 },
        EPHEMERAL: { count: 0, avg: 0, min: 0, max: 0 },
      },
      histogram: Array.from({ length: 10 }, (_, i) => ({
        range: (i * 0.1).toFixed(1) + '-' + ((i + 1) * 0.1).toFixed(1),
        count: 0,
      })),
    };
  }
}

module.exports = { MemoryQuality, VERSION, DECAY_RATES, WEIGHTS, DEFAULTS };
