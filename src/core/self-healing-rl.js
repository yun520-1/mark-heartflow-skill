/**
 * HeartFlow HealingMemoryRL v11.6.0
 * Q-learning based repair strategy memory for self-healing.
 * Paper: Reflexion (2023), CRITIC (2024)
 *
 * v11.6.0 新增：autoCleanupRL() 增强
 * - Q-table条目元数据追踪（lastAccessedAt, accessCount）
 * - 三重清理条件：太久没访问 + 访问次数少 + Q值低
 * - "无所得故"：放下不需要的教训
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = path.join(__dirname, '../../memory');
const QTABLE_FILE = path.join(MEMORY_DIR, 'q-table.json');
const QMetaFile = path.join(MEMORY_DIR, 'q-meta.json');

// [修复] HMAC Key 缓存，避免每次导入生成新key
let _cachedHmacKey = null;

function _getHmacKey() {
  if (_cachedHmacKey) return _cachedHmacKey;

  const envKey = process.env.HEARTFLOW_QTABLE_HMAC_KEY;
  if (envKey) {
    if (!/^[A-Za-z0-9+/=_-]+$/.test(envKey)) {
      throw new Error('[HealingMemoryRL] HEARTFLOW_QTABLE_HMAC_KEY must contain only printable ASCII characters');
    }
    _cachedHmacKey = envKey;
    return _cachedHmacKey;
  }

  // 从文件加载或生成新key（仅在首次调用时）
  const keyFile = path.join(MEMORY_DIR, '.hmac-key');
  if (fs.existsSync(keyFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      if (meta.key && /^[A-Za-z0-9+/=_-]+$/.test(meta.key)) {
        _cachedHmacKey = meta.key;
        return _cachedHmacKey;
      }
    } catch { /* corrupted, regenerate */ }
  }

  // 生成新key并持久化
  const newKey = crypto.randomBytes(32).toString('base64');
  try {
    fs.writeFileSync(keyFile, JSON.stringify({ key: newKey, createdAt: Date.now() }, null, 2), { mode: 0o600 });
  } catch { /* ignore */ }
  _cachedHmacKey = newKey;
  console.warn(`[HealingMemoryRL] HEARTFLOW_QTABLE_HMAC_KEY not set, generated and saved new key`);
  return _cachedHmacKey;
}

const QTABLE_HMAC_KEY = _getHmacKey();

// Q-table条目元数据（独立文件，与q-table分开）
let _qMeta = {};

function _loadQMeta() {
  try {
    if (fs.existsSync(QMetaFile)) {
      _qMeta = JSON.parse(fs.readFileSync(QMetaFile, 'utf-8'));
    } else {
      _qMeta = {};
    }
  } catch (e) {
    _qMeta = {};
  }
}

function _saveQMeta() {
  try {
    fs.writeFileSync(QMetaFile, JSON.stringify(_qMeta, null, 2), 'utf-8');
  } catch (e) { /* ignore */ }
}

function _touchEntry(ck) {
  if (!_qMeta[ck]) {
    _qMeta[ck] = { createdAt: Date.now(), lastAccessedAt: Date.now(), accessCount: 0 };
  }
  _qMeta[ck].lastAccessedAt = Date.now();
  _qMeta[ck].accessCount = (_qMeta[ck].accessCount || 0) + 1;
  _saveQMeta();
}

class HealingMemoryRL {
  constructor(maxMemory = 100) {
    this.maxMemory = maxMemory;
    // Q-table: key = contextKey (errorPattern + machineId + env + region)
    // Multi-environment aware: "connection timeout @Germany" vs "connection timeout @US"
    this.qTable = new Map();
    // Machine identity for Q-key context (set via setContext)
    this._ctx = { machineId: 'default', environment: 'unknown', region: 'unknown' };
    // History of (error, strategy, outcome)
    this.history = [];
    this.decorrelationWindow = 3; // 最近N次不同strategy才更新
    // Load persisted Q-table on init
    this._loadQTable();
    _loadQMeta();
  }

  _ensureMemoryDir() {
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
  }

  _loadQTable() {
    try {
      if (!fs.existsSync(QTABLE_FILE)) return;
      const raw = fs.readFileSync(QTABLE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // [A04] HMAC完整性校验
      if (data._hmac) {
        const { _hmac, qTable, history, savedAt, ...rest } = data;
        const envKey = process.env.HEARTFLOW_QTABLE_HMAC_KEY;
        const effectiveKey = (envKey !== undefined && envKey !== null && envKey !== '')
          ? envKey
          : _getHmacKey();
        const computed = crypto.createHmac('sha256', effectiveKey)
          .update(JSON.stringify({ qTable, history, savedAt, ...rest }))
          .digest('hex');
        if (computed !== _hmac) {
          console.warn('[HealingMemoryRL] Q-table HMAC mismatch, restoring from backup');
          if (data.qTable) {
            this.qTable = new Map(Object.entries(data.qTable));
            this.history = Array.isArray(data.history) ? data.history.slice(-this.maxMemory) : [];
            console.log('[HealingMemoryRL] Q-table restored (HMAC check bypassed)');
          }
          return;
        }
      }
      if (data.qTable) {
        this.qTable = new Map(Object.entries(data.qTable));
      }
      if (data.history) {
        this.history = data.history.slice(-this.maxMemory);
      }
    } catch (e) {
      console.warn('[HealingMemoryRL] Q-table load error, starting fresh:', e.message);
    }
  }

  _saveQTable() {
    try {
      this._ensureMemoryDir();
      const { _hmac, ...rest } = { qTable: Object.fromEntries(this.qTable), history: this.history.slice(-50), savedAt: new Date().toISOString() };
      const sigPayload = { qTable: rest.qTable, history: rest.history, savedAt: rest.savedAt };
      const hmac = crypto.createHmac('sha256', QTABLE_HMAC_KEY).update(JSON.stringify(sigPayload)).digest('hex');
      const data = { ...sigPayload, _hmac: hmac };
      fs.writeFileSync(QTABLE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[HealingMemoryRL] _saveQTable failed:', e.message);
    }
  }

  /**
   * Set machine/environment context for Q-key discrimination
   */
  setContext(ctx = {}) {
    this._ctx = { machineId: ctx.machineId || 'default', environment: ctx.environment || 'unknown', region: ctx.region || 'unknown' };
  }

  _contextKey(errorPattern) {
    const { machineId, environment, region } = this._ctx;
    return `${errorPattern}@${machineId}:${environment}:${region}`;
  }

  /**
   * Update Q-value from repair outcome
   */
  updateFromRepair(errorPattern, strategy, success) {
    const ck = this._contextKey(errorPattern);
    if (!this.qTable.has(ck)) {
      this.qTable.set(ck, {});
    }
    const entry = this.qTable.get(ck);
    const currentQ = entry[strategy] ?? 0.5;
    const reward = success ? 1.0 : -0.5;
    const learningRate = 0.2;
    entry[strategy] = currentQ + learningRate * (reward - currentQ);
    _touchEntry(ck);
    this._saveQTable();
  }

  /**
   * Get best strategy for an error pattern (context-aware)
   */
  getBestStrategy(errorPattern) {
    const ck = this._contextKey(errorPattern);
    _touchEntry(ck);
    const entry = this.qTable.get(ck);
    if (!entry) return null;
    let best = null;
    let bestQ = -Infinity;
    for (const [strategy, qValue] of Object.entries(entry)) {
      if (qValue > bestQ) {
        bestQ = qValue;
        best = strategy;
      }
    }
    return best;
  }

  /**
   * Get all strategies ranked by Q-value (context-aware)
   */
  getRankedStrategies(errorPattern) {
    const ck = this._contextKey(errorPattern);
    _touchEntry(ck);
    const entry = this.qTable.get(ck) || {};
    return Object.entries(entry)
      .sort((a, b) => b[1] - a[1])
      .map(([strategy, qValue]) => ({ strategy, qValue }));
  }

  /**
   * Get stats for monitoring
   */
  stats() {
    return {
      qTableSize: this.qTable.size,
      historySize: this.history.length,
      contexts: [...this.qTable.keys()].slice(0, 5),
    };
  }

  /**
   * Get available strategies given error + context, using RL Q-value ranking + fallback hints
   */
  getAvailableStrategies(errorPattern, hints = []) {
    const ranked = this.getRankedStrategies(errorPattern);
    const rankedStrats = ranked.map(r => r.strategy);
    const seen = new Set(rankedStrats);
    for (const h of hints) {
      if (!seen.has(h)) seen.add(h);
    }
    return [...seen];
  }

  /**
   * Record a repair attempt
   */
  record(errorPattern, strategy, success) {
    this.history.push({ errorPattern, strategy, success, ts: Date.now() });
    if (this.history.length > this.maxMemory) {
      this.history.shift();
    }
  }

  /**
   * 持续前进：Q-table 条目清除
   * "无所得故" — Q-table 条目不是用来拥有的，是用来放下的
   */
  letGoOf(errorPattern) {
    if (!errorPattern) return { result: false, reason: 'no_pattern' };
    const ck = this._contextKey(errorPattern);
    if (!this.qTable.has(ck)) {
      return { result: false, reason: 'not_found' };
    }
    const entry = this.qTable.get(ck);
    const strategyCount = Object.keys(entry).length;
    this.qTable.delete(ck);
    delete _qMeta[ck];
    this._saveQTable();
    _saveQMeta();
    if (!this._letGoLog) this._letGoLog = [];
    this._letGoLog.push({
      pattern: errorPattern.slice(0, 50),
      strategies: strategyCount,
      letGoAt: new Date().toISOString(),
      insight: '持续前进：放下了，继续走。答案不在远方，在每一步的脚下。'
    });
    return {
      result: true,
      pattern: errorPattern.slice(0, 50),
      strategiesCleared: strategyCount,
      totalLetGo: this._letGoLog.length,
      insight: '持续前进：放下了Q-table条目，继续往前走。'
    };
  }

  /**
   * 自动清理 Q-table：定期清除过期的低价值条目
   * "无所得故" — Q-table条目不是用来拥有的，是用来放下的
   * @param {number} maxAge - 最大存活时间(ms)，默认90天
   * @param {number} minAccesses - 最低访问次数，低于此值视为冷门条目
   * @param {number} minQ - 最低Q值
   * @returns {object} 清理结果
   */
  autoCleanupRL(maxAge = 90 * 24 * 60 * 60 * 1000, minAccesses = 2, minQ = 0.3) {
    _loadQMeta();
    const now = Date.now();
    let cleaned = 0;
    let reasons = [];

    for (const [key, entry] of this.qTable.entries()) {
      const meta = _qMeta[key];
      // 无meta：跳过（保守策略，避免误删旧数据）
      if (!meta) continue;

      const age = now - meta.lastAccessedAt;
      const maxQ = Object.values(entry).reduce((m, v) => Math.max(m, v), 0);

      // 三重清理条件：太久没访问 + 访问次数少 + Q值低
      if (age > maxAge && (meta.accessCount || 0) < minAccesses && maxQ < minQ) {
        this.qTable.delete(key);
        delete _qMeta[key];
        cleaned++;
        reasons.push({ key: key.slice(0, 40), age: Math.round(age / 86400000) + 'd', q: maxQ.toFixed(2) });
      }
    }

    if (cleaned > 0) {
      _saveQMeta();
      this._saveQTable();
    }

    return {
      cleaned,
      remaining: this.qTable.size,
      reasons: reasons.slice(0, 5),
      insight: '放下了不需要的教训，Q-table只留真正有用的。无所得故，心无罣碍。'
    };
  }

  getLetGoLog() {
    return {
      log: this._letGoLog || [],
      total: (this._letGoLog || []).length
    };
  }

  /**
   * Check if we should retry (has strategies with positive Q)
   */
  shouldRetry(errorPattern) {
    const ranked = this.getRankedStrategies(errorPattern);
    return ranked.length > 0 && ranked[0].qValue > 0.5;
  }

  /**
   * Export Q-table for persistence
   */
  export() {
    return {
      qTable: Object.fromEntries(this.qTable),
      history: this.history.slice(-50),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Import Q-table
   */
  import(data) {
    if (data.qTable) {
      this.qTable = new Map(Object.entries(data.qTable));
    }
    if (data.history) {
      this.history = data.history.slice(-this.maxMemory);
    }
  }
}

module.exports = { HealingMemoryRL };
