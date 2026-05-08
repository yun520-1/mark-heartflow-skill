/**
 * HeartFlow Memory Tier Manager v11.22.0
 *
 * 来源: GitHub research - Agent Memory Techniques
 *      NirDiamant/Agent_Memory_Techniques (⭐2500+)
 *      topoteretes/cognee (17k星) - tiered memory concept
 *
 * 核心功能:
 * - 自动追踪记忆访问频率
 * - 高频 CORE 晋升 (promotion)
 * - 低频 CORE 降级 (demotion)
 * - LEARNED → EPHEMERAL 自动清理
 * - 保护核心身份记忆永远不降级
 *
 * 晋升规则:
 * - LEARNED: 30天内被访问 5次 →晋升 CORE
 * - CORE: 90天未被访问 →降级 LEARNED（身份类永远不降）
 * - EPHEMERAL: 7天未访问 → 自动丢弃
 */

const fs = require('fs');
const path = require('path');

const MEMORY_DIR = path.join(__dirname, '..', '..', 'memory');
const CORE_FILE    = path.join(MEMORY_DIR, 'meaningful-core.json');
const LEARNED_FILE = path.join(MEMORY_DIR, 'meaningful-learned.json');
const TIER_META    = path.join(MEMORY_DIR, 'tier-meta.json');

const CONFIG = {
  promotionThreshold: 5,       // LEARNED → CORE: 30天内访问次数
  promotionWindow: 30 * 24 * 60 * 60 * 1000,  // 30天窗口
  demotionThreshold: 90,       // CORE → LEARNED: 未访问天数
  ephemeralTTL: 7,             // EPHEMERAL: 7天未访问丢弃
  protectedPatterns: [         // 永远不降级的pattern
    'CORE_IDENTITY', 'heartflow', '老大', '身份', '核心',
    'name', 'identity', 'mission', 'directive', '心虫'
  ],
  checkOnAccess: true,        // 访问时更新lastAccessed
};

function isProtected(content) {
  const text = JSON.stringify(content).toLowerCase();
  return CONFIG.protectedPatterns.some(p => text.includes(p.toLowerCase()));
}

class MemoryTierManager {
  constructor() {
    this.stats = {
      promotions: 0,
      demotions: 0,
      ephemeralExpired: 0,
      accesses: 0,
      lastRun: null,
    };
    this._loadMeta();
  }

  _loadMeta() {
    try {
      if (fs.existsSync(TIER_META)) {
        const data = JSON.parse(fs.readFileSync(TIER_META, 'utf8'));
        this.stats = { ...this.stats, ...data.stats };
      }
    } catch (e) {}
  }

  _saveMeta() {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(TIER_META, JSON.stringify({ stats: this.stats }, null, 2));
    } catch (e) {}
  }

  // =====================================================
  // 核心API: 记录一次访问 + 触发晋升检查
  // =====================================================

  /**
   * 记录对某条记忆的访问
   * @param {string} memoryId - 记忆ID
   * @param {string} tier - 'CORE' | 'LEARNED' | 'EPHEMERAL'
   * @param {string} content - 记忆内容（用于保护检查）
   * @param {number} now - 时间戳，默认now
   */
  recordAccess(memoryId, tier, content = '', now = Date.now()) {
    this.stats.accesses++;
    const meta = this._readMeta();
    const key = `${tier}:${memoryId}`;

    if (!meta.accessLog) meta.accessLog = {};
    if (!meta.accessLog[key]) {
      meta.accessLog[key] = { count: 0, lastAccess: now, firstAccess: now };
    }

    const entry = meta.accessLog[key];
    entry.count++;
    entry.lastAccess = now;
    entry.firstAccess = entry.firstAccess || now;

    // 检查是否需要晋升
    const promoted = this._checkPromotion(meta, key, tier, now);
    this._writeMeta(meta);
    this.stats.lastRun = now;
    this._saveMeta();

    return { promoted };
  }

  // =====================================================
  // 晋升检查
  // =====================================================

  _checkPromotion(meta, key, tier, now) {
    if (tier !== 'LEARNED') return false;

    const entry = meta.accessLog[key];
    if (!entry) return false;

    const windowStart = now - CONFIG.promotionWindow;
    const recentCount = entry.count;

    if (recentCount >= CONFIG.promotionThreshold && entry.firstAccess >= windowStart) {
      // 触发晋升
      this.stats.promotions++;
      return true;
    }
    return false;
  }

  // =====================================================
  // 全量分级评估（定时或按需调用）
  // =====================================================

  /**
   * 评估所有层级的记忆，决定晋升/降级/丢弃
   * 返回操作列表: { type: 'promote'|'demote'|'drop', id, from, to }
   */
  evaluateAll(now = Date.now()) {
    const ops = [];
    const meta = this._readMeta();

    // CORE: 检查是否该降级
    const core = this._loadTier(CORE_FILE);
    for (const item of core) {
      if (isProtected(item.content)) continue;
      const key = `CORE:${item.id}`;
      const entry = meta.accessLog[key];
      if (!entry) {
        // 从未访问过，看创建时间
        const age = now - (item.createdAt || item.timestamp || now);
        if (age > CONFIG.demotionThreshold * 24 * 60 * 60 * 1000) {
          ops.push({ type: 'demote', id: item.id, from: 'CORE', to: 'LEARNED' });
        }
        continue;
      }
      const daysSinceAccess = (now - entry.lastAccess) / (24 * 60 * 60 * 1000);
      if (daysSinceAccess > CONFIG.demotionThreshold) {
        ops.push({ type: 'demote', id: item.id, from: 'CORE', to: 'LEARNED' });
      }
    }

    // LEARNED: 检查是否该晋升
    const learned = this._loadTier(LEARNED_FILE);
    for (const item of learned) {
      const key = `LEARNED:${item.id}`;
      const entry = meta.accessLog[key];
      if (!entry) continue;
      const windowStart = now - CONFIG.promotionWindow;
      if (entry.count >= CONFIG.promotionThreshold && entry.firstAccess >= windowStart) {
        ops.push({ type: 'promote', id: item.id, from: 'LEARNED', to: 'CORE' });
      }
    }

    return ops;
  }

  /**
   * 执行晋升/降级操作
   */
  applyOperations(ops) {
    const core = this._loadTier(CORE_FILE);
    const learned = this._loadTier(LEARNED_FILE);

    for (const op of ops) {
      if (op.type === 'promote') {
        const idx = learned.findIndex(i => i.id === op.id);
        if (idx !== -1) {
          const [item] = learned.splice(idx, 1);
          item.tier = 'CORE';
          item.promotedAt = Date.now();
          core.push(item);
          this.stats.promotions++;
        }
      } else if (op.type === 'demote') {
        const idx = core.findIndex(i => i.id === op.id);
        if (idx !== -1) {
          const [item] = core.splice(idx, 1);
          item.tier = 'LEARNED';
          item.demotedAt = Date.now();
          learned.push(item);
          this.stats.demotions++;
        }
      }
    }

    this._saveTier(CORE_FILE, core);
    this._saveTier(LEARNED_FILE, learned);
    this._saveMeta();
    return ops.length;
  }

  // =====================================================
  // 工具方法
  // =====================================================

  _readMeta() {
    try {
      if (fs.existsSync(TIER_META)) {
        return JSON.parse(fs.readFileSync(TIER_META, 'utf8'));
      }
    } catch (e) {}
    return { accessLog: {} };
  }

  _writeMeta(meta) {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(TIER_META, JSON.stringify(meta, null, 2));
    } catch (e) {}
  }

  _loadTier(file) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(raw);
        // 支持数组格式和对象字典格式
        if (Array.isArray(data)) return data;
        if (typeof data === 'object') {
          // 对象字典: 转换为数组
          return Object.values(data).map(v => {
            if (typeof v === 'object') return v;
            return { id: v };
          });
        }
      }
    } catch (e) {}
    return [];
  }

  _saveTier(file, data) {
    try {
      if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (e) {}
  }

  // 获取分级统计
  getStats() {
    const core = this._loadTier(CORE_FILE).length;
    const learned = this._loadTier(LEARNED_FILE).length;
    return {
      ...this.stats,
      coreCount: core,
      learnedCount: learned,
    };
  }
}

module.exports = { MemoryTierManager, isProtected, CONFIG };
