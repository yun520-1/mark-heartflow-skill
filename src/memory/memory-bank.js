/**
 * MemoryBank v1.0.0 — Cross-Session Persistent Memory Management
 *
 * 架设在已有三层记忆系统之上的跨会话记忆管理层。
 * 每一笔记忆都属于一个会话，会话之间可以转移共享记忆，
 * 跨会话模式检测可以发现长期趋势和用户偏好变化。
 *
 * 核心能力：
 * - deposit()     — 存入新记忆，绑定会话和元数据
 * - recall()      — 跨会话检索相关记忆
 * - consolidate() — 合并相似记忆，强化重要记忆
 * - forget()      — 按强度阈值剪枝弱记忆
 * - getSessionSummary() — 获取单个会话的记忆摘要
 * - getCrossSessionPatterns() — 发现跨会话的模式和趋势
 *
 * 记忆衰减模型（Ebbinghaus 遗忘曲线）：
 *   CORE:     0.001/hr (近乎永久)
 *   LEARNED:  0.01/hr  (缓慢衰减)
 *   EPHEMERAL: 0.05/hr  (快速衰减)
 *
 * Persistence: data/memory-bank.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const BANK_PATH = path.join(DATA_DIR, 'memory-bank.json');

const DECAY_RATES = {
  core:      0.001,  // per hour
  learned:   0.01,
  ephemeral: 0.05,
};

const LAYER_ORDER = ['core', 'learned', 'ephemeral'];

class MemoryBank {
  constructor(options = {}) {
    this.version = '1.0.0';

    // 可选：注入已有的 MemoryAdapter/MeaningfulMemory 实例，共享底层存储
    this._underlyingMemory = options.memory || null;

    // 会话索引：sessionId -> { id, label, startTime, endTime, memoryIds, stats }
    this.sessions = new Map();

    // 记忆存储：memoryId -> MemoryRecord
    this.memories = new Map();

    // 关系图：memoryId -> [{ targetId, relationType, strength }]
    this.relationships = new Map();

    // 跨会话模式缓存
    this._patterns = [];
    this._patternsTimestamp = 0;

    // 当前活跃会话
    this.currentSessionId = null;

    // 统计
    this.stats = {
      totalMemories: 0,
      totalSessions: 0,
      totalRelationships: 0,
      lastConsolidation: null,
      lastForget: null,
    };

    this._saveTimer = null;

    // 从磁盘恢复
    this._loadFromDisk();

    // 如果未提供外部记忆实例，内部初始化一个最小可用实例
    if (!this._underlyingMemory) {
      this._initUnderlyingMemory();
    }
  }

  // ─── 内部初始化 ────────────────────────────────────────────────────────

  _initUnderlyingMemory() {
    try {
      const { MeaningfulMemory } = require('./meaningful-memory.js');
      this._underlyingMemory = new MeaningfulMemory();
    } catch (e) {
      this._underlyingMemory = null;
    }
  }

  // ─── 持久化 ────────────────────────────────────────────────────────────

  _getBankPath() {
    return BANK_PATH;
  }

  _loadFromDisk() {
    const bankPath = this._getBankPath();
    if (!fs.existsSync(bankPath)) return;

    try {
      const raw = fs.readFileSync(bankPath, 'utf-8');
      const data = JSON.parse(raw);

      if (data.sessions && Array.isArray(data.sessions)) {
        for (const s of data.sessions) {
          this.sessions.set(s.id, s);
        }
      }

      if (data.memories && Array.isArray(data.memories)) {
        for (const m of data.memories) {
          this.memories.set(m.id, m);
        }
      }

      if (data.relationships) {
        for (const [key, rels] of Object.entries(data.relationships)) {
          this.relationships.set(key, rels);
        }
      }

      if (data.stats) {
        this.stats = { ...this.stats, ...data.stats };
      }

      if (data._patterns) {
        this._patterns = data._patterns;
        this._patternsTimestamp = data._patternsTimestamp || 0;
      }
    } catch (e) {
      // 恢复失败，从空状态继续
    }
  }

  _autoSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => { this._doSave(); }, 2000);
  }

  _doSave() {
    const bankPath = this._getBankPath();
    try {
      const dir = path.dirname(bankPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const exportData = {
        version: this.version,
        sessions: Array.from(this.sessions.values()),
        memories: Array.from(this.memories.values()),
        relationships: Object.fromEntries(this.relationships),
        stats: this.stats,
        _patterns: this._patterns,
        _patternsTimestamp: this._patternsTimestamp,
        savedAt: new Date().toISOString(),
      };

      fs.writeFileSync(bankPath, JSON.stringify(exportData, null, 2));
    } catch (e) {
      // 保存失败不影响运行
    }
  }

  // ─── 工具方法 ──────────────────────────────────────────────────────────

  _generateId() {
    return `mb-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  _now() {
    return Date.now();
  }

  /**
   * 计算记忆的当前强度（考虑衰减）
   * strength = importance * e^(-decayRate * ageInHours)
   */
  _computeStrength(memory) {
    const ageHours = (this._now() - memory.timestamp) / (1000 * 60 * 60);
    const decayRate = DECAY_RATES[memory.layer] || 0.01;
    const retention = Math.exp(-decayRate * ageHours);
    return (memory.importance || 0) * retention;
  }

  /**
   * 计算两层记忆之间的内容相似度（基于 bigram 重叠）
   */
  _contentSimilarity(a, b) {
    if (a === b) return 1.0;
    if (!a || !b) return 0;
    const as = String(a).toLowerCase();
    const bs = String(b).toLowerCase();
    if (as.includes(bs) || bs.includes(as)) return 0.7;
    const bigram = (s) => {
      const grams = [];
      for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2));
      return grams;
    };
    const gA = bigram(as);
    const gB = bigram(bs);
    if (gA.length === 0 || gB.length === 0) return 0;
    const setB = new Set(gB);
    let overlap = 0;
    for (const g of gA) { if (setB.has(g)) overlap++; }
    return overlap / Math.max(gA.length, gB.length);
  }

  // ─── 会话管理 ──────────────────────────────────────────────────────────

  /**
   * 开始一个新的记忆会话
   * @param {string} [label] - 可选会话标签
   * @returns {string} sessionId
   */
  startSession(label) {
    const sessionId = `session-${this._now()}`;
    this.currentSessionId = sessionId;

    this.sessions.set(sessionId, {
      id: sessionId,
      label: label || null,
      startTime: this._now(),
      endTime: null,
      memoryIds: [],
      stats: { deposited: 0, recalled: 0 },
    });

    this.stats.totalSessions = this.sessions.size;
    this._autoSave();
    return sessionId;
  }

  /**
   * 结束当前会话
   * @returns {object} session summary
   */
  endSession() {
    if (!this.currentSessionId) return null;
    const session = this.sessions.get(this.currentSessionId);
    if (session) {
      session.endTime = this._now();
    }
    const result = this.getSessionSummary(this.currentSessionId);
    this.currentSessionId = null;
    this._autoSave();
    return result;
  }

  /**
   * 获取当前活跃会话ID（没有则自动创建）
   */
  ensureSession(label) {
    if (!this.currentSessionId) {
      this.startSession(label);
    }
    return this.currentSessionId;
  }

  // ─── Core API: deposit ─────────────────────────────────────────────────

  /**
   * 存入一条记忆
   * @param {string|object} memory - 记忆内容（string 或 { content, summary? }）
   * @param {string} source - 来源（sessionId / module名）
   * @param {number} [importance=10] - 重要性 0-20
   * @param {object} [opts] - 可选参数
   * @param {string} [opts.layer] - 记忆层（core/learned/ephemeral）
   * @param {string[]} [opts.tags] - 标签
   * @param {string[]} [opts.relatedTo] - 关联记忆ID列表
   * @returns {object} deposit result
   */
  deposit(memory, source, importance = 10, opts = {}) {
    const sessionId = this.ensureSession(source);

    // 标准化记忆内容
    let content, summary;
    if (typeof memory === 'string') {
      content = memory;
      summary = memory.slice(0, 120);
    } else if (memory && typeof memory === 'object') {
      content = memory.content || '';
      summary = memory.summary || String(content).slice(0, 120);
    } else {
      return { success: false, reason: 'invalid_memory' };
    }

    // 确定层级
    let layer = opts.layer;
    if (!layer) {
      if (opts.durable || importance >= 18) layer = 'core';
      else if (opts.lesson || importance >= 12) layer = 'learned';
      else layer = 'ephemeral';
    }

    const id = this._generateId();
    const now = this._now();

    const record = {
      id,
      content,
      summary,
      layer,
      source: source || sessionId,
      sessionId,
      timestamp: now,
      importance: Math.min(20, Math.max(0, importance)),
      accessCount: 0,
      tags: opts.tags || [],
      relatedTo: opts.relatedTo || [],
      decayRate: DECAY_RATES[layer] || 0.01,
      createdAt: now,
      updatedAt: now,
    };

    this.memories.set(id, record);

    // 记录关系
    for (const targetId of opts.relatedTo || []) {
      this._addRelationship(id, targetId, 'related', 1.0);
    }

    // 更新会话
    const session = this.sessions.get(sessionId);
    if (session) {
      session.memoryIds.push(id);
      session.stats.deposited = (session.stats.deposited || 0) + 1;
    }

    // 同步到下层记忆系统
    this._syncToUnderlying(record);

    this.stats.totalMemories = this.memories.size;
    this._autoSave();

    return { success: true, id, sessionId, layer };
  }

  /**
   * 同步记忆到下层 MeaningfulMemory
   */
  _syncToUnderlying(record) {
    if (!this._underlyingMemory) return;
    try {
      const mmLayer = record.layer === 'core' ? 'core'
        : record.layer === 'learned' ? 'learned'
        : 'ephemeral';
      this._underlyingMemory.layers[mmLayer] = this._underlyingMemory.layers[mmLayer] || [];
      const mmRecord = {
        id: record.id,
        timestamp: record.timestamp,
        layer: mmLayer,
        content: record.content,
        summary: record.summary,
        embedding: null,
        metadata: {
          key: record.id,
          tags: record.tags,
          topic: record.source,
          memoryBank: true,
        },
        importance: record.importance,
        accessCount: record.accessCount,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
      this._underlyingMemory.layers[mmLayer].push(mmRecord);
      this._underlyingMemory.vectors.set(record.id, null);
    } catch (e) {
      // 同步失败不影响 MemoryBank 本身
    }
  }

  // ─── Core API: recall ──────────────────────────────────────────────────

  /**
   * 跨会话检索相关记忆
   * @param {string} query - 检索关键词
   * @param {number} [limit=10] - 返回数量
   * @param {object} [opts] - 可选参数
   * @param {string} [opts.layer] - 限定层级
   * @param {string} [opts.sessionId] - 限定会话
   * @param {number} [opts.minStrength] - 最小强度阈值
   * @returns {Array} 检索结果列表
   */
  recall(query, limit = 10, opts = {}) {
    const candidates = [];

    for (const [id, mem] of this.memories) {
      // 层级过滤
      if (opts.layer && mem.layer !== opts.layer) continue;

      // 会话过滤
      if (opts.sessionId && mem.sessionId !== opts.sessionId) continue;

      // 强度过滤
      if (typeof opts.minStrength === 'number') {
        const strength = this._computeStrength(mem);
        if (strength < opts.minStrength) continue;
      }

      // 关键词匹配
      const content = String(mem.content || '').toLowerCase();
      const summary = String(mem.summary || '').toLowerCase();
      const tags = (mem.tags || []).join(' ').toLowerCase();
      const q = String(query).toLowerCase();
      const keywords = q.split(/\s+/).filter(w => w.length > 1);

      let matchScore = 0;
      for (const kw of keywords) {
        if (content.includes(kw)) matchScore += 2;
        if (summary.includes(kw)) matchScore += 1;
        if (tags.includes(kw)) matchScore += 1;
      }

      if (matchScore > 0) {
        // 递增访问计数
        mem.accessCount = (mem.accessCount || 0) + 1;
        mem.updatedAt = this._now();
        candidates.push({
          id: mem.id,
          content: mem.content,
          summary: mem.summary,
          layer: mem.layer,
          source: mem.source,
          sessionId: mem.sessionId,
          importance: mem.importance,
          accessCount: mem.accessCount,
          score: matchScore,
          strength: this._computeStrength(mem),
          timestamp: mem.timestamp,
        });
      }
    }

    // 按 score * strength 排序
    candidates.sort((a, b) => (b.score * b.strength) - (a.score * a.strength));
    const results = candidates.slice(0, limit);

    // 更新会话统计
    if (this.currentSessionId) {
      const session = this.sessions.get(this.currentSessionId);
      if (session) {
        session.stats.recalled = (session.stats.recalled || 0) + results.length;
      }
    }

    this._autoSave();
    return results;
  }

  // ─── Core API: consolidate ─────────────────────────────────────────────

  /**
   * 合并相似记忆，强化重要记忆
   * 策略：
   * 1. 同一会话内内容高度相似的记忆合并为一个
   * 2. 高访问次数 + 高重要性的记忆提升层级
   * 3. 更新关系图
   * @returns {object} consolidation report
   */
  consolidate() {
    const merged = [];
    const promoted = [];
    const seen = new Set();
    const now = this._now();

    // Phase 1: 合并同一会话内的相似记忆（只在 learned/ephemeral 层）
    const bySession = new Map();
    for (const [id, mem] of this.memories) {
      if (mem.layer === 'core') continue;
      if (!bySession.has(mem.sessionId)) bySession.set(mem.sessionId, []);
      bySession.get(mem.sessionId).push(mem);
    }

    for (const [, mems] of bySession) {
      for (let i = 0; i < mems.length; i++) {
        if (seen.has(mems[i].id)) continue;
        for (let j = i + 1; j < mems.length; j++) {
          if (seen.has(mems[j].id)) continue;
          const sim = this._contentSimilarity(mems[i].content, mems[j].content);
          if (sim >= 0.8) {
            // 合并：保留更重要的，累加访问次数
            const keep = mems[i].importance >= mems[j].importance ? mems[i] : mems[j];
            const discard = keep === mems[i] ? mems[j] : mems[i];
            keep.accessCount = (keep.accessCount || 0) + (discard.accessCount || 0);
            keep.importance = Math.min(20, keep.importance + 1);
            keep.updatedAt = now;
            keep.tags = [...new Set([...(keep.tags || []), ...(discard.tags || [])])];
            keep.relatedTo = [...new Set([...(keep.relatedTo || []), ...(discard.relatedTo || [])])];
            this.memories.set(keep.id, keep);
            seen.add(discard.id);
            merged.push({ kept: keep.id, discarded: discard.id, similarity: sim });
          }
        }
      }
    }

    // 清理已合并的记忆
    for (const id of seen) {
      this.memories.delete(id);
      // 迁移关系
      const rels = this.relationships.get(id);
      if (rels) {
        const targetRel = this.relationships.get(id) || [];
        this.relationships.set(id, targetRel);
      }
      this.relationships.delete(id);
    }

    // Phase 2: 提升高频访问的记忆
    for (const [id, mem] of this.memories) {
      if (mem.layer === 'core') continue;
      const accessCount = mem.accessCount || 0;
      if (accessCount >= 5 && mem.importance >= 14) {
        const oldLayer = mem.layer;
        if (oldLayer === 'ephemeral') {
          mem.layer = 'learned';
          mem.decayRate = DECAY_RATES.learned;
          promoted.push({ id, from: oldLayer, to: 'learned' });
        } else if (oldLayer === 'learned' && mem.importance >= 18) {
          mem.layer = 'core';
          mem.decayRate = DECAY_RATES.core;
          promoted.push({ id, from: oldLayer, to: 'core' });
        }
      }
    }

    // Phase 3: 重建关系索引
    this._rebuildRelationshipIndex();

    this.stats.totalMemories = this.memories.size;
    this.stats.totalRelationships = this.relationships.size;
    this.stats.lastConsolidation = new Date().toISOString();

    // 使跨会话模式缓存失效
    this._patterns = [];
    this._patternsTimestamp = 0;

    this._doSave();
    return {
      merged: merged.length,
      promoted: promoted.length,
      mergedDetails: merged,
      promotedDetails: promoted,
      totalMemories: this.memories.size,
    };
  }

  // ─── Core API: forget ──────────────────────────────────────────────────

  /**
   * 按强度阈值剪枝弱记忆
   * @param {number} [strengthThreshold=0.1] - 低于此强度的记忆将被删除
   * @returns {object} forget report
   */
  forget(strengthThreshold = 0.1) {
    const toDelete = [];

    for (const [id, mem] of this.memories) {
      // CORE 层永远不删除
      if (mem.layer === 'core') continue;

      const strength = this._computeStrength(mem);
      if (strength < strengthThreshold) {
        toDelete.push({ id, layer: mem.layer, strength });
      }
    }

    for (const { id } of toDelete) {
      this.memories.delete(id);
      this.relationships.delete(id);
    }

    this.stats.totalMemories = this.memories.size;
    this.stats.totalRelationships = this.relationships.size;
    this.stats.lastForget = new Date().toISOString();

    this._patterns = [];
    this._patternsTimestamp = 0;

    this._doSave();
    return {
      deleted: toDelete.length,
      remaining: this.memories.size,
      details: toDelete,
    };
  }

  // ─── Core API: getSessionSummary ───────────────────────────────────────

  /**
   * 获取指定会话的记忆摘要
   * @param {string} sessionId
   * @returns {object|null} session summary
   */
  getSessionSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const sessionMemories = [];
    for (const id of session.memoryIds || []) {
      const mem = this.memories.get(id);
      if (mem) {
        sessionMemories.push({
          id: mem.id,
          content: mem.summary || mem.content,
          layer: mem.layer,
          importance: mem.importance,
          strength: this._computeStrength(mem),
          tags: mem.tags || [],
          timestamp: mem.timestamp,
        });
      }
    }

    const layerDistribution = { core: 0, learned: 0, ephemeral: 0 };
    const tagFrequency = {};
    for (const m of sessionMemories) {
      layerDistribution[m.layer] = (layerDistribution[m.layer] || 0) + 1;
      for (const t of m.tags || []) {
        tagFrequency[t] = (tagFrequency[t] || 0) + 1;
      }
    }

    return {
      sessionId: session.id,
      label: session.label,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.endTime ? session.endTime - session.startTime : this._now() - session.startTime,
      memoryCount: sessionMemories.length,
      layerDistribution,
      topTags: Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      memories: sessionMemories,
    };
  }

  // ─── Core API: getCrossSessionPatterns ─────────────────────────────────

  /**
   * 发现跨会话的模式和趋势
   * 分析维度：
   * 1. 高频标签 — 哪些标签在多个会话中出现
   * 2. 重复主题 — 相似内容跨会话出现
   * 3. 记忆增长趋势 — 每会话记忆数量的变化
   * 4. 层级分布趋势 — core/learned/ephemeral 比例变化
   * @param {number} [minSessions=2] - 至少出现于多少会话才算模式
   * @returns {object} patterns report
   */
  getCrossSessionPatterns(minSessions = 2) {
    // 缓存有效1小时
    if (this._patterns.length > 0 && (this._now() - this._patternsTimestamp) < 3600000) {
      return {
        patterns: this._patterns,
        fromCache: true,
      };
    }

    const sessionList = Array.from(this.sessions.values()).filter(s => s.endTime !== null);
    if (sessionList.length < minSessions) {
      return { patterns: [], fromCache: false, reason: 'insufficient_sessions', sessionCount: sessionList.length };
    }

    // 分析 1: 高频跨会话标签
    const tagSessions = {};
    for (const session of sessionList) {
      const seenTags = new Set();
      for (const memId of session.memoryIds || []) {
        const mem = this.memories.get(memId);
        if (mem) {
          for (const tag of mem.tags || []) {
            if (!seenTags.has(tag)) {
              seenTags.add(tag);
              if (!tagSessions[tag]) tagSessions[tag] = { count: 0, sessions: [] };
              tagSessions[tag].count++;
              tagSessions[tag].sessions.push(session.id);
            }
          }
        }
      }
    }

    const frequentTags = Object.entries(tagSessions)
      .filter(([, data]) => data.count >= minSessions)
      .map(([tag, data]) => ({ tag, sessionCount: data.count, sessions: data.sessions }))
      .sort((a, b) => b.sessionCount - a.sessionCount);

    // 分析 2: 记忆增长趋势
    const memoryTrend = sessionList
      .sort((a, b) => a.startTime - b.startTime)
      .map(s => ({
        sessionId: s.id,
        startTime: s.startTime,
        memoryCount: (s.memoryIds || []).length,
      }));

    // 分析 3: 层级分布趋势
    const layerTrend = sessionList
      .sort((a, b) => a.startTime - b.startTime)
      .map(s => {
        const dist = { core: 0, learned: 0, ephemeral: 0 };
        for (const memId of s.memoryIds || []) {
          const mem = this.memories.get(memId);
          if (mem && dist.hasOwnProperty(mem.layer)) dist[mem.layer]++;
        }
        return { sessionId: s.id, startTime: s.startTime, layers: dist };
      });

    // 分析 4: 跨会话重复主题（通过 bigram 相似度）
    const themes = this._detectThemesAcrossSessions(sessionList, minSessions);

    const patterns = [
      { type: 'frequent_tags', data: frequentTags, description: '跨会话高频标签' },
      { type: 'memory_trend', data: memoryTrend, description: '每会话记忆数量趋势' },
      { type: 'layer_trend', data: layerTrend, description: '每会话层级分布趋势' },
      { type: 'recurring_themes', data: themes, description: '跨会话重复主题' },
    ];

    this._patterns = patterns;
    this._patternsTimestamp = this._now();
    this._doSave();

    return { patterns, fromCache: false };
  }

  /**
   * 跨会话主题检测
   */
  _detectThemesAcrossSessions(sessionList, minSessions) {
    const themeSessions = {};
    const allMemories = [];

    for (const session of sessionList) {
      for (const memId of session.memoryIds || []) {
        const mem = this.memories.get(memId);
        if (mem && mem.layer !== 'core') {
          allMemories.push({ ...mem, sessionId: session.id });
        }
      }
    }

    // 简单聚类：内容相似度 >= 0.5 的归为一组
    const clusters = [];
    const clustered = new Set();

    for (let i = 0; i < allMemories.length; i++) {
      if (clustered.has(allMemories[i].id)) continue;
      const cluster = [allMemories[i]];
      clustered.add(allMemories[i].id);

      for (let j = i + 1; j < allMemories.length; j++) {
        if (clustered.has(allMemories[j].id)) continue;
        const sim = this._contentSimilarity(allMemories[i].content, allMemories[j].content);
        if (sim >= 0.5) {
          cluster.push(allMemories[j]);
          clustered.add(allMemories[j].id);
        }
      }

      if (cluster.length >= minSessions) {
        const uniqueSessions = new Set(cluster.map(m => m.sessionId));
        const avgImportance = cluster.reduce((s, m) => s + m.importance, 0) / cluster.length;
        clusters.push({
          theme: cluster[0].summary || cluster[0].content.slice(0, 60),
          occurrenceCount: cluster.length,
          sessionCount: uniqueSessions.size,
          avgImportance: Math.round(avgImportance),
          memberIds: cluster.map(m => m.id),
        });
      }
    }

    return clusters.sort((a, b) => b.sessionCount - a.sessionCount).slice(0, 20);
  }

  // ─── Memory transfer between sessions ──────────────────────────────────

  /**
   * 将一个会话的记忆转移到另一个会话
   * @param {string} fromSessionId
   * @param {string} toSessionId
   * @param {object} [opts]
   * @param {string[]} [opts.tagFilter] - 只转移包含这些标签的记忆
   * @param {number} [opts.minImportance] - 只转移重要性 >= 此值的记忆
   * @returns {object} transfer report
   */
  transferMemories(fromSessionId, toSessionId, opts = {}) {
    const from = this.sessions.get(fromSessionId);
    const to = this.sessions.get(toSessionId);
    if (!from) return { success: false, reason: 'source_session_not_found', sessionId: fromSessionId };
    if (!to) return { success: false, reason: 'target_session_not_found', sessionId: toSessionId };

    let transferred = 0;

    for (const memId of from.memoryIds || []) {
      const mem = this.memories.get(memId);
      if (!mem) continue;

      // 过滤
      if (opts.tagFilter && opts.tagFilter.length > 0) {
        const hasTag = opts.tagFilter.some(t => (mem.tags || []).includes(t));
        if (!hasTag) continue;
      }
      if (typeof opts.minImportance === 'number' && mem.importance < opts.minImportance) {
        continue;
      }

      // 创建副本绑定到目标会话
      const newId = this._generateId();
      const copy = { ...mem, id: newId, sessionId: toSessionId, createdAt: this._now(), updatedAt: this._now() };
      this.memories.set(newId, copy);

      // 更新目标会话
      to.memoryIds.push(newId);
      to.stats.deposited = (to.stats.deposited || 0) + 1;

      transferred++;
    }

    this.stats.totalMemories = this.memories.size;
    this._autoSave();

    return { success: true, transferred, fromSessionId, toSessionId };
  }

  // ─── 关系图管理 ────────────────────────────────────────────────────────

  _addRelationship(sourceId, targetId, relationType, strength) {
    const id = `rel-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    if (!this.relationships.has(sourceId)) {
      this.relationships.set(sourceId, []);
    }
    this.relationships.get(sourceId).push({
      id,
      targetId,
      relationType: relationType || 'related',
      strength: strength || 1.0,
    });
    this.stats.totalRelationships = this.relationships.size;
  }

  linkMemories(sourceId, targetId, relationType, strength) {
    if (!this.memories.has(sourceId) || !this.memories.has(targetId)) {
      return { success: false, reason: 'memory_not_found' };
    }
    this._addRelationship(sourceId, targetId, relationType, strength);
    this._autoSave();
    return { success: true, sourceId, targetId, relationType };
  }

  getRelated(memoryId, relationType, maxDepth) {
    const maxD = maxDepth || 3;
    const visited = new Set();
    const results = [];
    const queue = [{ id: memoryId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.id) || current.depth > maxD) continue;
      visited.add(current.id);

      const mem = this.memories.get(current.id);
      if (mem && current.id !== memoryId) {
        results.push({
          id: mem.id,
          content: mem.summary || mem.content,
          layer: mem.layer,
          strength: this._computeStrength(mem),
          depth: current.depth,
        });
      }

      const rels = this.relationships.get(current.id) || [];
      for (const rel of rels) {
        if (relationType && rel.relationType !== relationType) continue;
        if (!visited.has(rel.targetId)) {
          queue.push({ id: rel.targetId, depth: current.depth + 1 });
        }
      }
    }

    return results;
  }

  _rebuildRelationshipIndex() {
    // 清理已不存在记忆的关系
    const validIds = new Set(this.memories.keys());
    for (const [key, rels] of this.relationships) {
      if (!validIds.has(key)) {
        this.relationships.delete(key);
        continue;
      }
      const filtered = rels.filter(r => validIds.has(r.targetId));
      if (filtered.length !== rels.length) {
        this.relationships.set(key, filtered);
      }
    }
  }

  // ─── 会话生命周期管理 ─────────────────────────────────────────────────

  /**
   * 关闭已结束的会话，释放临时资源
   */
  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return { success: false, reason: 'session_not_found' };

    session.endTime = session.endTime || this._now();

    // 清理 ephemeral 层中属于该会话的已过期记忆
    const toDelete = [];
    for (const memId of session.memoryIds || []) {
      const mem = this.memories.get(memId);
      if (mem && mem.layer === 'ephemeral') {
        const ageHours = (this._now() - mem.timestamp) / (1000 * 60 * 60);
        if (ageHours > 24) { // ephemeral 超过24小时可清理
          toDelete.push(memId);
        }
      }
    }

    for (const id of toDelete) {
      this.memories.delete(id);
      this.relationships.delete(id);
    }

    this.stats.totalMemories = this.memories.size;
    this._doSave();

    return { success: true, sessionId, cleaned: toDelete.length };
  }

  // ─── 统计与信息 ────────────────────────────────────────────────────────

  getStats() {
    const layers = { core: 0, learned: 0, ephemeral: 0 };
    for (const [, mem] of this.memories) {
      if (layers.hasOwnProperty(mem.layer)) layers[mem.layer]++;
    }

    return {
      version: this.version,
      totalMemories: this.memories.size,
      totalSessions: this.sessions.size,
      totalRelationships: this.relationships.size,
      layers,
      currentSessionId: this.currentSessionId,
      lastConsolidation: this.stats.lastConsolidation,
      lastForget: this.stats.lastForget,
      cacheValid: (this._now() - this._patternsTimestamp) < 3600000,
    };
  }

  /**
   * 获取所有记忆的健康状态
   */
  getHealth() {
    const total = this.memories.size;
    if (total === 0) return { health: 'empty', avgStrength: 0, decayed: 0, critical: 0 };

    let totalStrength = 0;
    let decayed = 0;
    let critical = 0;

    for (const [, mem] of this.memories) {
      const strength = this._computeStrength(mem);
      totalStrength += strength;
      if (strength < 0.5) decayed++;
      if (strength < 0.1 && mem.layer !== 'core') critical++;
    }

    return {
      health: critical > total * 0.3 ? 'degraded' : decayed > total * 0.5 ? 'aging' : 'healthy',
      avgStrength: totalStrength / total,
      decayed,
      critical,
      total,
    };
  }

  /**
   * 列出所有活跃会话
   */
  listSessions() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      memoryCount: (s.memoryIds || []).length,
      isActive: s.id === this.currentSessionId,
    }));
  }

  /**
   * 列出某会话的所有记忆摘要
   */
  listSessionMemories(sessionId, opts = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    let results = [];
    for (const memId of session.memoryIds || []) {
      const mem = this.memories.get(memId);
      if (!mem) continue;

      if (opts.layer && mem.layer !== opts.layer) continue;

      results.push({
        id: mem.id,
        content: mem.summary || mem.content,
        layer: mem.layer,
        importance: mem.importance,
        strength: this._computeStrength(mem),
        tags: mem.tags || [],
        accessCount: mem.accessCount || 0,
        timestamp: mem.timestamp,
      });
    }

    if (opts.sortBy === 'strength') {
      results.sort((a, b) => b.strength - a.strength);
    } else if (opts.sortBy === 'importance') {
      results.sort((a, b) => b.importance - a.importance);
    } else {
      results.sort((a, b) => b.timestamp - a.timestamp);
    }

    if (typeof opts.limit === 'number') {
      results = results.slice(0, opts.limit);
    }

    return results;
  }

  // ─── 销毁 ──────────────────────────────────────────────────────────────

  destroy() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this._saveTimer = null;
    }
    this._doSave();
  }
}

module.exports = { MemoryBank };
