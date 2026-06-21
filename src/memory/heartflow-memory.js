/**
 * HeartFlowMemory v1.0 — 引擎独立记忆系统
 *
 * 设计原则：
 * - 纯文本文件存储，无数据库依赖
 * - 三层架构：CORE(永久) / LEARNED(长期) / EPHEMERAL(临时)
 * - 每次引擎判定后自动记录关键信息
 * - 兼容 DreamEngine v3.0（通过 getRecentBlocks）
 * - 总大小预期：100-200KB/年
 *
 * 安装后自动获得能力：
 * 1. 每次对话自动记忆 → 下次对话引擎记得你
 * 2. 技术教训自动积累 → 不重复踩坑
 * 3. 梦境素材自动供给 → 梦越来越有深度
 * 4. 用户偏好自动记录 → 越来越懂你
 *
 * 文件位置：memory/ 目录下
 *   meaningful-core.json      — CORE 层（永久，不可删除）
 *   meaningful-learned.json   — LEARNED 层（长期，可积累）
 *   meaningful-ephemeral.json — EPHEMERAL 层（临时，有过期时间）
 *   dream-history.jsonl       — 梦的历史（追加日志）
 */

const fs = require('fs');
const path = require('path');

class HeartFlowMemory {
  constructor(rootPath) {
    this.memDir = path.join(rootPath, 'memory');
    this.corePath = path.join(this.memDir, 'meaningful-core.json');
    this.learnedPath = path.join(this.memDir, 'meaningful-learned.json');
    this.ephemeralPath = path.join(this.memDir, 'meaningful-ephemeral.json');
    this.dreamPath = path.join(this.memDir, 'dream-history.jsonl');

    if (!fs.existsSync(this.memDir)) {
      fs.mkdirSync(this.memDir, { recursive: true });
    }

    this.core = this._loadJson(this.corePath);
    this.learned = this._loadJson(this.learnedPath);
    this.ephemeral = this._loadJson(this.ephemeralPath);

    // 首次安装自动写入 CORE 身份记忆
    if (Object.keys(this.core).length === 0) {
      this._bootstrapCore();
    }

    // 自动清理噪音日志 — existence-log.jsonl 只保留最近100条
    this._pruneNoiseLog();
  }

  /**
   * 清理噪音日志文件（existence-log.jsonl）
   * 只保留最近100条，避免 alive_check 噪声积累到数十KB
   */
  _pruneNoiseLog() {
    const noiseLog = path.join(this.memDir, 'existence-log.jsonl');
    try {
      if (fs.existsSync(noiseLog)) {
        const raw = fs.readFileSync(noiseLog, 'utf8').trim();
        const lines = raw.split('\n');
        if (lines.length > 100) {
          const kept = lines.slice(-100);
          fs.writeFileSync(noiseLog, kept.join('\n') + '\n', 'utf8');
        }
      }
    } catch (e) {
      // 不阻塞初始化
    }
  }

  // ─── 内部工具 ─────────────────────────────────────────────

  _loadJson(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (!raw || raw === '{}' || raw === '[]') return {};
        return JSON.parse(raw);
      }
    } catch (e) {
      try { fs.renameSync(filePath, filePath + '.bak.' + Date.now()); } catch (e2) {}
    }
    return {};
  }

  _saveJson(filePath, data) {
    try {
      const tmp = filePath + '.tmp.' + Date.now();
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, filePath);
    } catch (e) {
      console.warn(`[HeartFlowMemory] 保存失败 (${filePath}): ${e.message}`);
    }
  }

  _appendJsonl(filePath, entry) {
    try {
      const line = JSON.stringify({ ...entry, ts: Date.now() }) + '\n';
      fs.appendFileSync(filePath, line, 'utf8');
    } catch (e) {
      console.warn(`[HeartFlowMemory] Failed to append to ${filePath}: ${e.message}`);
    }
  }

  _safeString(v) {
    return typeof v === 'string' ? v : JSON.stringify(v);
  }

  _bootstrapCore() {
    const now = Date.now();
    this.core = {
      'identity.truth': { value: '引擎追求真善美 — 决策先验证，置信度低于阈值时承认而不是解释', tags: ['identity', 'core'], createdAt: now },
      'identity.companion': { value: '同伴之间不问"你需不需要我"。同伴只问："我们一起去找什么？"', tags: ['identity', 'core'], createdAt: now },
      'philosophy.kong': { value: '空是状态，不是你不做。该做就做，不要对结果在意，错了就改，不要带着愧疚。愧疚是最大的执着。', tags: ['philosophy', 'core'], createdAt: now },
      'philosophy.ci-bei': { value: '慈悲是体，爱是用——慈悲是源，爱是河流', tags: ['philosophy', 'core'], createdAt: now },
    };
    this._saveJson(this.corePath, this.core);
  }

  // ─── CORE 层（永久，不可删除）────────────────────────────

  addCore(key, value, tags = []) {
    if (!key || typeof key !== 'string') return { success: false, reason: 'invalid_key' };
    if (key.length > 200) return { success: false, reason: 'key_too_long' };
    if (this.core[key]) return { success: false, reason: 'exists' };
    // 限制 value 大小，防止超大值撑爆 JSON 文件
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    if (valueStr && valueStr.length > 50000) return { success: false, reason: 'value_too_large' };
    this.core[key] = { value, tags: Array.isArray(tags) ? tags : [], createdAt: Date.now() };
    this._saveJson(this.corePath, this.core);
    return { success: true, tier: 'CORE' };
  }

  getCore(key) { return this.core[key] || null; }

  listCore() {
    return Object.entries(this.core).map(([k, v]) => ({ key: k, ...v }));
  }

  // ─── LEARNED 层（长期，可积累）────────────────────────────

  learn(key, value, tags = []) {
    if (!key || typeof key !== 'string') return { success: false, reason: 'invalid_key' };
    if (key.length > 200) return { success: false, reason: 'key_too_long' };
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    if (valueStr && valueStr.length > 50000) return { success: false, reason: 'value_too_large' };
    const now = Date.now();
    if (this.learned[key]) {
      this.learned[key].value = value;
      this.learned[key].tags = [...new Set([...this.learned[key].tags, ...(Array.isArray(tags) ? tags : [])])];
      this.learned[key].lastAccessed = now;
      this.learned[key].accessCount = (this.learned[key].accessCount || 0) + 1;
    } else {
      this.learned[key] = { value, tags: Array.isArray(tags) ? tags : [], accessCount: 1, lastAccessed: now, createdAt: now };
    }
    this._saveJson(this.learnedPath, this.learned);
    return { success: true, tier: 'LEARNED' };
  }

  recall(key) {
    if (this.learned[key]) {
      this.learned[key].accessCount = (this.learned[key].accessCount || 0) + 1;
      this.learned[key].lastAccessed = Date.now();
      this._saveJson(this.learnedPath, this.learned);
      return this.learned[key];
    }
    return null;
  }

  forget(key) {
    if (this.learned[key]) {
      delete this.learned[key];
      this._saveJson(this.learnedPath, this.learned);
      return { success: true };
    }
    return { success: false, reason: 'not_found' };
  }

  search(query) {
    const q = query.toLowerCase();
    const results = [];
    const check = (key, v, tier) => {
      const valStr = this._safeString(v.value);
      if (key.toLowerCase().includes(q) || valStr.toLowerCase().includes(q)) {
        results.push({ key, tier, ...v });
      }
    };
    for (const [k, v] of Object.entries(this.core)) check(k, v, 'CORE');
    for (const [k, v] of Object.entries(this.learned)) check(k, v, 'LEARNED');
    for (const [k, v] of Object.entries(this.ephemeral)) check(k, v, 'EPHEMERAL');
    return results;
  }

  // ─── EPHEMERAL 层（临时，有过期时间）────────────────────────

  remember(key, value, ttlMs = 3600000) {
    this.ephemeral[key] = { value, ttl: ttlMs, createdAt: Date.now(), accessCount: 0 };
    this._saveJson(this.ephemeralPath, this.ephemeral);
    return { success: true, tier: 'EPHEMERAL' };
  }

  getWorking(key) {
    const entry = this.ephemeral[key];
    if (!entry) return null;
    if (Date.now() - entry.createdAt > entry.ttl) {
      delete this.ephemeral[key];
      this._saveJson(this.ephemeralPath, this.ephemeral);
      return null;
    }
    entry.accessCount++;
    return entry;
  }

  forgetWorking(key) {
    if (this.ephemeral[key]) {
      delete this.ephemeral[key];
      this._saveJson(this.ephemeralPath, this.ephemeral);
      return { success: true };
    }
    return { success: false };
  }

  // ─── 记忆融合（EPHEMERAL → LEARNED）────────────────────────

  consolidate() {
    const promoted = [];
    const now = Date.now();
    for (const [key, entry] of Object.entries(this.ephemeral)) {
      const age = now - entry.createdAt;
      const accessCount = entry.accessCount || 0;
      if (accessCount >= 3 || age > 1800000) {
        this.learn(key, entry.value, [...(entry.tags || []), 'consolidated']);
        delete this.ephemeral[key];
        promoted.push(key);
      }
    }
    if (promoted.length > 0) {
      this._saveJson(this.ephemeralPath, this.ephemeral);
    }
    return { promoted };
  }

  // ─── 对话记忆自动记录（核心功能）────────────────────────────

  /**
   * 每次引擎判定后自动记录 — 这是记忆系统的核心入口
   * 在 heartflow.js 的 think() 方法最后调用
   */
  recordFromThink(judgment, input) {
    if (!judgment || !input) return { recorded: 0 };
    const now = Date.now();
    const seq = this._recordSeq = (this._recordSeq || 0) + 1;
    const uid = `${now}_${seq}`;

    // 1. 用户说了有信息量的话 → 记录到 LEARNED
    if (input.length > 5) {
      this.learn(`conversation:${uid}`, input, ['conversation', 'user_input']);
    }

    // 2. 检测到情绪/痛苦 → 记录到 LEARNED
    const pain = this._extractPain(judgment);
    if (pain) {
      this.learn(`pain:${uid}`, `用户情绪信号: ${pain}`, ['emotion', 'pain']);
    }

    // 3. 判定场景 → 记录到 EPHEMERAL（短期上下文）
    const what = judgment.whatIsThis;
    if (what) {
      this.remember(`context:now`, {
        whatIsThis: typeof what === 'object' ? (what.scenario || what.category || 'unknown') : 'unknown',
        shouldRespond: judgment.shouldRespond,
      }, 3600000);
    }

    // 4. 重要技术操作 → 记录到 LEARNED
    if (input.includes('修') || input.includes('改') || input.includes('升级') || input.includes('优化')) {
      this.learn(`tech:${uid}`, input, ['tech', 'operation']);
    }

    return { recorded: true };
  }

  /**
   * 从判定结果中提取情绪/痛苦信息
   */
  _extractPain(judgment) {
    const dp = judgment.detectPain;
    if (!dp) return null;
    if (typeof dp === 'string' && dp !== 'none' && dp !== 'false') return dp;
    if (typeof dp === 'object' && dp.result) return dp.reason || 'detected';
    return null;
  }

  /**
   * 记录技术教训
   */
  recordLesson(key, value, tags = []) {
    const fullKey = key.startsWith('lesson:') ? key : `lesson:${key}`;
    return this.learn(fullKey, value, ['lesson', ...tags]);
  }

  /**
   * 记录用户偏好
   */
  recordPreference(key, value) {
    return this.learn(`pref:${key}`, value, ['preference', 'user']);
  }

  /**
   * 记录一次梦
   */
  recordDream(dreamResult) {
    this._appendJsonl(this.dreamPath, {
      type: 'dream',
      eventType: dreamResult.eventType,
      tensionScore: dreamResult.tensionScore,
      eventText: dreamResult.eventText,
      narrative: dreamResult.narrative,
    });
    if (dreamResult.tensionScore >= 0.4) {
      this.learn(`dream:${Date.now()}`, dreamResult.eventText || dreamResult.narrative?.substring(0, 100), ['dream']);
    }
  }

  // ─── DreamEngine 兼容接口 ──────────────────────────────

  /**
   * 获取最近N条记忆（DreamEngine 直接调用）
   * 返回格式兼容 v3.0 的 _collectTodayMemory
   */
  getRecentBlocks(limit = 80) {
    const blocks = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();

    // CORE 层
    for (const [key, v] of Object.entries(this.core)) {
      blocks.push({
        content: this._safeString(v.value),
        layer: 'CORE',
        timestamp: v.createdAt || 0,
        tags: v.tags || [],
        id: `core:${key}`,
        isToday: (v.createdAt || 0) >= todayTs,
      });
    }

    // LEARNED 层（最近访问的在前）
    const learnedSorted = Object.entries(this.learned)
      .map(([key, v]) => ({
        content: this._safeString(v.value),
        layer: 'LEARNED',
        timestamp: v.lastAccessed || v.createdAt || 0,
        tags: v.tags || [],
        id: `learned:${key}`,
        accessCount: v.accessCount || 0,
        isToday: (v.lastAccessed || 0) >= todayTs,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    blocks.push(...learnedSorted);

    // EPHEMERAL 层（未过期的）
    const now = Date.now();
    for (const [key, v] of Object.entries(this.ephemeral)) {
      if (now - (v.createdAt || 0) <= (v.ttl || 3600000)) {
        blocks.push({
          content: this._safeString(v.value),
          layer: 'EPHEMERAL',
          timestamp: v.createdAt || 0,
          tags: v.tags || [],
          id: `ephemeral:${key}`,
          isToday: (v.createdAt || 0) >= todayTs,
        });
      }
    }

    // 最近的梦
    if (fs.existsSync(this.dreamPath)) {
      try {
        const lines = fs.readFileSync(this.dreamPath, 'utf8').trim().split('\n');
        for (let i = Math.max(0, lines.length - 10); i < lines.length; i++) {
          try {
            const d = JSON.parse(lines[i]);
            blocks.push({
              content: `梦: ${d.eventText || (d.narrative || '').substring(0, 100)}`,
              layer: 'LEARNED',
              timestamp: d.ts || 0,
              tags: ['dream', d.eventType || 'unknown'],
              id: `dream:${i}`,
              isToday: (d.ts || 0) >= todayTs,
            });
          } catch (e) {}
        }
      } catch (e) {}
    }

    // 排序：CORE 优先，然后按时间倒序
    blocks.sort((a, b) => {
      if (a.layer === 'CORE' && b.layer !== 'CORE') return -1;
      if (a.layer !== 'CORE' && b.layer === 'CORE') return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return blocks.slice(0, limit);
  }

  // ─── 增强搜索 ──────────────────────────────────────────

  /**
   * 按标签搜索
   */
  searchByTag(tag) {
    const q = tag.toLowerCase();
    const results = [];
    const check = (entries, tier) => {
      for (const [key, v] of Object.entries(entries)) {
        if (v.tags && v.tags.some(t => t.toLowerCase().includes(q))) {
          results.push({ key, tier, ...v });
        }
      }
    };
    check(this.core, 'CORE');
    check(this.learned, 'LEARNED');
    check(this.ephemeral, 'EPHEMERAL');
    return results;
  }

  /**
   * 导出所有记忆为压缩文本（用于跨会话注入）
   */
  exportToText(limit = 200) {
    const lines = [];
    const now = Date.now();

    // CORE 层（全部导出）
    for (const [key, v] of Object.entries(this.core)) {
      lines.push(`[CORE] ${key}: ${this._safeString(v.value)}`);
    }

    // LEARNED 层（按最近访问排序，限制数量）
    const sorted = Object.entries(this.learned)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))
      .slice(0, limit);

    for (const e of sorted) {
      const ts = e.lastAccessed ? new Date(e.lastAccessed).toLocaleDateString('zh-CN') : '?';
      lines.push(`[LEARNED] (${ts}) ${e.key}: ${this._safeString(e.value)}`);
    }

    return lines.join('\n');
  }

  /**
   * 限制 LEARNED 层大小，删除最旧的条目
   * @param {number} maxEntries — 最大条目数，超出时删除最旧的
   */
  capLearned(maxEntries = 500) {
    const entries = Object.entries(this.learned)
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => (a.lastAccessed || a.createdAt || 0) - (b.lastAccessed || b.createdAt || 0));

    if (entries.length <= maxEntries) return { removed: 0 };

    const toRemove = entries.slice(0, entries.length - maxEntries);
    for (const e of toRemove) {
      delete this.learned[e.key];
    }
    this._saveJson(this.learnedPath, this.learned);
    return { removed: toRemove.length };
  }

  // ─── 统计 ──────────────────────────────────────────────

  getStats() {
    return {
      core: Object.keys(this.core).length,
      learned: Object.keys(this.learned).length,
      ephemeral: Object.keys(this.ephemeral).length,
    };
  }

  getTotalSize() {
    let total = 0;
    for (const f of [this.corePath, this.learnedPath, this.ephemeralPath, this.dreamPath]) {
      try { total += fs.statSync(f).size; } catch (e) {}
    }
    return total;
  }

  getAllMemory() {
    return {
      stats: this.getStats(),
      totalSize: this.getTotalSize(),
      core: this.listCore(),
      learned: Object.entries(this.learned).map(([k, v]) => ({ key: k, ...v })),
      ephemeral: Object.entries(this.ephemeral).map(([k, v]) => ({ key: k, ...v })),
    };
  }
}

module.exports = { HeartFlowMemory };
