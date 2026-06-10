/**
 * @deprecated — use src/core/meaningful-memory.js instead
 * MeaningfulMemory — Three-tier memory system inspired by MemGPT
 * 
 * CORE:     Immutable identity rules (never deleted)
 * LEARNED:  Accumulated knowledge (persisted, selected)
 * EPHEMERAL: Temporary working context (session-scoped)
 * 
 * Design principles:
 * - Simple JSON file storage (no database)
 * - Automatic consolidation from EPHEMERAL → LEARNED
 * - CORE is read-only, protects identity anchor
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class MeaningfulMemory {
  constructor(rootPath) {
    // Validate rootPath — restrict to allowed directories
    const allowed = [process.cwd(), os.homedir(), '/tmp'];
    const resolved = path.normalize(path.resolve(rootPath));
    const safe = allowed.some(d => resolved.startsWith(d + path.sep)) ||
                 allowed.some(d => resolved === d);
    if (!safe) {
      throw new Error(`MeaningfulMemory: rootPath must be within ${allowed.join(', ')}`);
    }

    this.rootPath = rootPath;
    this.corePath = path.join(rootPath, 'meaningful-core.json');
    this.learnedPath = path.join(rootPath, 'meaningful-learned.json');
    this.ephemeralPath = path.join(rootPath, 'meaningful-ephemeral.json');
    
    // Lazy-load flags — only load when actually needed
    this._coreLoaded = false;
    this._learnedLoaded = false;
    this._ephemeralLoaded = false;
    this.core = {};
    this.learned = {};
    this.ephemeral = {};
  }

  // ─── Lazy Loading ─────────────────────────────────────────────────────────

  _ensureCoreLoaded() {
    if (this._coreLoaded) return;
    try { this.core = this._readJson(this.corePath); } catch { /* 文件损坏时降级为空对象 */ this.core = {}; }
    this._coreLoaded = true;
  }

  _ensureLearnedLoaded() {
    if (this._learnedLoaded) return;
    try { this.learned = this._readJson(this.learnedPath); } catch { /* 文件损坏时降级为空对象 */ this.learned = {}; }
    this._learnedLoaded = true;
  }

  _ensureEphemeralLoaded() {
    if (this._ephemeralLoaded) return;
    try { this.ephemeral = this._readJson(this.ephemeralPath); } catch { /* 文件损坏时降级为空对象 */ this.ephemeral = {}; }
    this._ephemeralLoaded = true;
  }

  _load() {
    this._ensureCoreLoaded();
    this._ensureLearnedLoaded();
    this._ensureEphemeralLoaded();
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  _load() {
    try { this.core = this._readJson(this.corePath); } catch { /* 文件损坏时降级为空对象 */ this.core = {}; }
    try { this.learned = this._readJson(this.learnedPath); } catch { /* 文件损坏时降级为空对象 */ this.learned = {}; }
    try { this.ephemeral = this._readJson(this.ephemeralPath); } catch { /* 文件损坏时降级为空对象 */ this.ephemeral = {}; }
  }

  _readJson(p) {
    if (!fs.existsSync(p)) return {};
    try {
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return {};
      return parsed;
    } catch {
      // File is corrupted — rename it to .bak and return empty
      try {
        fs.renameSync(p, p + '.bak.' + Date.now());
      } catch { /* ignore */ }
      return {};
    }
  }

  _atomicWrite(filePath, data) {
    const fs = require('fs');
    const tmp = filePath + '.tmp.' + Date.now();
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, filePath);
  }

  _saveCore() {
    this._atomicWrite(this.corePath, this.core);
  }

  _saveLearned() {
    this._atomicWrite(this.learnedPath, this.learned);
  }

  _saveEphemeral() {
    this._atomicWrite(this.ephemeralPath, this.ephemeral);
  }

  // ─── CORE — Identity Rules (Immutable) ──────────────────────────────────

  /**
   * Add an immutable CORE identity rule.
   * Only succeeds if key doesn't already exist.
   */
  addCore(key, value, tags = []) {
    this._ensureCoreLoaded();
    if (this.core[key]) {
      return { success: false, reason: 'core_key_exists', key };
    }
    this.core[key] = { value, tags, createdAt: Date.now() };
    this._saveCore();
    return { success: true, key, tier: 'CORE' };
  }

  getCore(key) {
    this._ensureCoreLoaded();
    return this.core[key] || null;
  }

  listCore() {
    this._ensureCoreLoaded();
    return Object.entries(this.core).map(([key, v]) => ({ key, ...v }));
  }

  // ─── LEARNED — Accumulated Knowledge (Selected, Persisted) ───────────────

  /**
   * Add or update a LEARNED memory entry.
   * 
   * v1.0.1: Optional spacedRepetition data for SM-2 algorithm
   */
  learn(key, value, tags = [], spacedRepetition = null) {
    this._ensureCoreLoaded();
    this._ensureLearnedLoaded();
    if (this.core[key]) {
      return { success: false, reason: 'key_in_core', key };
    }
    const now = Date.now();
    if (this.learned[key]) {
      this.learned[key].value = value;
      this.learned[key].tags = [...new Set([...this.learned[key].tags, ...tags])];
      this.learned[key].lastAccessed = now;
    } else {
      this.learned[key] = { value, tags, accessCount: 0, lastAccessed: now, createdAt: now };
      if (spacedRepetition) {
        this.learned[key].spacedRepetition = spacedRepetition;
      }
    }
    this._saveLearned();
    return { success: true, key, tier: 'LEARNED' };
  }

  /**
   * store — 统一写入口（v2.9.1 新增）
   * 自动选择层级：core 前缀→CORE，否则→LEARNED
   */
  store(key, value, tags = []) {
    if (key.startsWith('core:') || key.startsWith('identity.')) {
      return this.addCore(key, value, tags);
    }
    return this.learn(key, value, tags);
  }

  recall(key) {
    this._ensureLearnedLoaded();
    if (this.learned[key]) {
      this.learned[key].accessCount = (this.learned[key].accessCount || 0) + 1;
      this.learned[key].lastAccessed = Date.now();
      this._saveLearned();
      return { ...this.learned[key] };
    }
    return null;
  }

  forget(key) {
    this._ensureLearnedLoaded();
    if (this.learned[key]) {
      delete this.learned[key];
      this._saveLearned();
      return { success: true, key };
    }
    return { success: false, reason: 'key_not_found' };
  }

  listLearned(query = null) {
    this._ensureLearnedLoaded();
    let entries = Object.entries(this.learned).map(([key, v]) => ({ key, ...v }));
    if (query) {
      const q = query.toLowerCase();
      entries = entries.filter(e =>
        e.key.toLowerCase().includes(q) ||
        (e.value && e.value.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return entries;
  }

  // ─── EPHEMERAL — Working Memory (Session-Scoped) ───────────────────────

  remember(key, value, ttlMs = 3600000) {
    // Limit key and value length to prevent JSON file bloat
    const MAX_KEY_LEN = 256;
    const MAX_VALUE_LEN = 102400; // 100KB
    if (typeof key !== 'string' || key.length > MAX_KEY_LEN) {
      return { success: false, reason: 'key_too_long', limit: MAX_KEY_LEN };
    }
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (serialized.length > MAX_VALUE_LEN) {
      return { success: false, reason: 'value_too_large', limit: MAX_VALUE_LEN };
    }
    this._ensureEphemeralLoaded();
    this.ephemeral[key] = {
      value,
      ttl: ttlMs,
      createdAt: Date.now(),
      _accessCount: 0,
    };
    this._saveEphemeral();
    return { success: true, key, tier: 'EPHEMERAL' };
  }

  /**
   * Record an access to an ephemeral entry.
   * v0.17: Access heat protects hot entries from eviction.
   */
  _touchEphemeral(key) {
    if (this.ephemeral[key]) {
      this.ephemeral[key]._accessCount = (this.ephemeral[key]._accessCount || 0) + 1;
      // Persist heat data periodically (every 5th access)
      if (this.ephemeral[key]._accessCount % 5 === 0) {
        this._saveEphemeral();
      }
    }
  }

  getWorking(key) {
    this._ensureEphemeralLoaded();
    const entry = this.ephemeral[key];
    if (!entry) return null;
    if (Date.now() - entry.createdAt > entry.ttl) {
      delete this.ephemeral[key];
      this._saveEphemeral();
      return null;
    }
    entry._accessCount = (entry._accessCount || 0) + 1;
    return { ...entry };
  }

  forgetWorking(key) {
    this._ensureEphemeralLoaded();
    if (this.ephemeral[key]) {
      delete this.ephemeral[key];
      this._saveEphemeral();
      return { success: true };
    }
    return { success: false };
  }

  // ─── Consolidation ───────────────────────────────────────────────────────

  /**
   * Consolidate EPHEMERAL → LEARNED.
   * Called during dream() to move frequently-accessed ephemeral memories.
   *
   * v0.17: Heat-aware promotion — access count and emotion tags protect hot data.
   */
  consolidate() {
    this._ensureLearnedLoaded();
    this._ensureEphemeralLoaded();
    const promoted = [];
    const now = Date.now();
    
    for (const [key, entry] of Object.entries(this.ephemeral)) {
      const age = now - entry.createdAt;
      const accessCount = entry._accessCount || 0;
      const heatScore = accessCount + (key.startsWith('signal:') ? 1 : 0);
      if (heatScore >= 3 || age > 1800000) {
        const tags = entry.tags || [];
        if (key.startsWith('signal:')) tags.push('emotion_signal');
        this.learn(key, entry.value, ['consolidated', ...tags]);
        delete this.ephemeral[key];
        promoted.push(key);
      }
    }
    
    if (promoted.length > 0) {
      this._saveEphemeral();
      this._saveLearned();
    }
    
    return { promoted, learnedCount: Object.keys(this.learned).length };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  getStats() {
    this._ensureCoreLoaded();
    this._ensureLearnedLoaded();
    this._ensureEphemeralLoaded();
    return {
      core: Object.keys(this.core).length,
      learned: Object.keys(this.learned).length,
      ephemeral: Object.keys(this.ephemeral).length,
    };
  }

  /**
   * Full snapshot for healthCheck()
   */
  getMemoryStats() {
    const stats = this.getStats();
    const core = this.listCore();
    const learned = this.listLearned();

    return {
      ...stats,
      core_samples: core.slice(0, 3),
      learned_samples: learned.slice(0, 5),
    };
  }

  /**
   * Search across all tiers
   */
  search(query) {
    this._ensureCoreLoaded();
    this._ensureLearnedLoaded();
    this._ensureEphemeralLoaded();
    const q = query.toLowerCase();
    const results = [];

    for (const [key, v] of Object.entries(this.core)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'CORE', ...v });
      }
    }
    for (const [key, v] of Object.entries(this.learned)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'LEARNED', ...v });
      }
    }
    for (const [key, v] of Object.entries(this.ephemeral)) {
      if (key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)) {
        results.push({ key, tier: 'EPHEMERAL', ...v });
      }
    }

    return results;
  }

  // ─── Auto-Record (Automatic Memory Formation) ───────────────────────────

  /**
   * autoRecord — 自动记录高价值事件到 LEARNED 层
   *
   * 触发条件（满足任一）：
   * 1. 情绪强度 high + 主题明确（不是泛泛的"开心"）
   * 2. 用户纠正了AI的错误（AI说了什么，纠正是什么）
   * 3. 任务失败或重大错误
   * 4. 关键决策点（选择了A而非B，原因）
   *
   * @param {object} event — { type, content, emotion?, correction?, outcome? }
   * @returns {{ success, key, recorded }}
   */
  autoRecord(event = {}) {
    if (!this._shouldAutoRecord(event)) {
      return { success: false, reason: 'below_threshold', recorded: false };
    }

    const timestamp = Date.now();
    const type = event.type || 'general';
    const key = `auto:${type}:${timestamp}`;
    const value = event.content || JSON.stringify(event);
    const tags = ['auto-recorded', type];

    // Tag by event quality
    if (event.emotion?.intensity === 'high') tags.push('emotion_signal');
    if (event.correction) tags.push('correction');
    if (event.outcome === 'failed') tags.push('failure');
    if (event.outcome === 'success') tags.push('success');
    if (event.decision) tags.push('decision');

    const result = this.learn(key, value, tags);
    if (result.success) {
      console.log(`[MeaningfulMemory] autoRecord: ${key} (${tags.join(', ')})`);
    }
    return { ...result, recorded: result.success };
  }

  /**
   * _shouldAutoRecord — 判断事件是否值得自动记录
   *
   * 阈值设计：
   * - 情绪事件：必须有明确的情感方向（不只是"neutral"）+ 内容长度>10
   * - 纠正事件：必须有AI原始说法 + 纠正内容
   * - 失败事件：必须有具体错误描述
   * - 决策事件：必须有选择理由
   */
  _shouldAutoRecord(event = {}) {
    const type = event.type || '';

    // 情绪事件：强度 high + 内容具体
    if (type === 'emotion') {
      const intensity = event.emotion?.intensity;
      const hasContent = (event.content || '').length > 10;
      const hasTopic = event.emotion?.topic && event.emotion.topic !== 'general';
      return (intensity === 'high' || intensity === 'medium') && hasContent && hasTopic;
    }

    // 纠正事件：AI说了什么 + 用户纠正了什么
    if (type === 'correction') {
      const hasOriginal = (event.AI_said || '').length > 5;
      const hasCorrection = (event.correction || '').length > 3;
      return hasOriginal && hasCorrection;
    }

    // 失败事件：具体错误描述
    if (type === 'failure') {
      return (event.error || event.content || '').length > 10;
    }

    // 决策事件：选择了A而非B
    if (type === 'decision') {
      return (event.choice || '').length > 2 && (event.alternatives || '').length > 5;
    }

    // 手动标记的重要事件
    if (event.important) {
      return true;
    }

    return false;
  }

  /**
   * recordLesson — 快捷方法：直接记录一条 lesson 到 LEARNED
   *
   * @param {string} key — 如 "lesson:hedging-warning"
   * @param {string} value — lesson 内容
   * @param {array} tags — 额外标签
   */
  recordLesson(key, value, tags = []) {
    const fullKey = key.startsWith('lesson:') ? key : `lesson:${key}`;
    return this.learn(fullKey, value, ['lesson', ...tags]);
  }

  /**
   * recordSignal — 快捷方法：记录一条情感/状态信号到 EPHEMERAL（带TTL）
   *
   * @param {string} topic — 信号主题
   * @param {object} data — 信号数据
   * @param {number} ttlMs — 存活时间，默认30分钟
   */
  recordSignal(topic, data = {}, ttlMs = 1800000) {
    const key = `signal:${topic}:${Date.now()}`;
    const value = typeof data === 'string' ? data : JSON.stringify(data);
    return this.remember(key, { topic, data: typeof data === 'string' ? null : data, raw: value }, ttlMs);
  }

  /**
   * getRecentSignals — 获取最近的情绪/状态信号（用于上下文感知）
   */
  getRecentSignals(limit = 5) {
    this._ensureEphemeralLoaded();
    const signals = Object.entries(this.ephemeral)
      .filter(([k]) => k.startsWith('signal:'))
      .map(([key, entry]) => {
        let parsed = entry;
        try { parsed = typeof entry === 'string' ? JSON.parse(entry) : entry; } catch (e) {
          if (!this._parseWarned) {
            console.warn(`[MeaningfulMemory] 警告: 信号解析失败 (key=${key}): ${e.message}`);
            this._parseWarned = true;
          }
        }
        return {
          key,
          topic: parsed.topic || key,
          data: parsed.data || parsed,
          ts: parsed.createdAt || parsed.ts || 0
        };
      })
      .sort((a, b) => b.ts - a.ts)
      .slice(0, limit);
    return signals;
  }
}

module.exports = { MeaningfulMemory };
