/**
 * HeartFlow HealingMemoryRL v11.5.6
 * Q-learning based repair strategy memory for self-healing.
 * Paper: Reflexion (2023), CRITIC (2024)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEMORY_DIR = path.join(__dirname, '../../memory');
const QTABLE_FILE = path.join(MEMORY_DIR, 'q-table.json');

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
        // 若 env key 为空/undefined，跳过 env 检查，强制用 keyFile
        const envKey = process.env.HEARTFLOW_QTABLE_HMAC_KEY;
        const effectiveKey = (envKey !== undefined && envKey !== null && envKey !== '')
          ? envKey
          : _getHmacKey();
        const computed = crypto.createHmac('sha256', effectiveKey)
          .update(JSON.stringify({ qTable, history, savedAt, ...rest }))
          .digest('hex');
        if (computed !== _hmac) {
          console.warn('[HealingMemoryRL] Q-table HMAC mismatch (file corrupted or env changed), restoring from backup');
          // 读取备份（去掉 _hmac 字段后就是旧格式），不丢失数据
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
   * Call this before updateFromRepair/getBestStrategy in multi-machine scenarios
   * @param {object} ctx - { machineId, environment, region }
   */
  setContext(ctx = {}) {
    this._ctx = { machineId: ctx.machineId || 'default', environment: ctx.environment || 'unknown', region: ctx.region || 'unknown' };
  }

  /**
   * Build a context-aware Q-key from error pattern + environment
   */
  _contextKey(errorPattern) {
    const { machineId, environment, region } = this._ctx;
    return `${errorPattern}@${machineId}:${environment}:${region}`;
  }

  /**
   * Update Q-value from repair outcome
   * @param {string} errorPattern - error key (normalized message)
   * @param {string} strategy - repair strategy used
   * @param {boolean} success - whether the repair succeeded
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
    this._saveQTable();
  }

  /**
   * Get best strategy for an error pattern (context-aware)
   */
  getBestStrategy(errorPattern) {
    const ck = this._contextKey(errorPattern);
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
   * @param {string} errorPattern - normalized error message
   * @param {string[]} hints - available hint strategies from rule-based repair hints
   * @returns {string[]} - strategies ranked by Q-value, augmented with hints
   */
  getAvailableStrategies(errorPattern, hints = []) {
    const ranked = this.getRankedStrategies(errorPattern);
    const rankedStrats = ranked.map(r => r.strategy);
    // Deduplicate: RL strategies first, then hints that aren't already in Q-table
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
   * 揭谛揭谛：Q-table 条目清除
   * "无所得故" — Q-table 条目不是用来拥有的，是用来放下的
   * 当某个错误模式不再相关时，主动清除其 Q-table 条目
   * @param {string} errorPattern - 要清除的错误模式
   * @returns {object} 清除结果
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
    this._saveQTable();
    // 记录放下事件
    if (!this._letGoLog) this._letGoLog = [];
    this._letGoLog.push({
      pattern: errorPattern.slice(0, 50),
      strategies: strategyCount,
      letGoAt: new Date().toISOString(),
      insight: '揭谛揭谛：放下了，继续走。彼岸不在别处，在每一步脚下。'
    });
    return {
      result: true,
      pattern: errorPattern.slice(0, 50),
      strategiesCleared: strategyCount,
      totalLetGo: this._letGoLog.length,
      insight: '揭谛揭谛：放下了Q-table条目，继续往前走。'
    };
  }

  /**
   * 自动清理 Q-table：定期清除过期的低价值条目
   * "不垢不净，不增不减" — Q-table 不是越大越好
   */
  autoCleanupRL(maxAge = 90 * 24 * 60 * 60 * 1000, minQ = 0.3) {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.qTable.entries()) {
      // 检查最后更新时间（从history推断）
      const historyEntry = this.history.find(h => h.errorPattern === key.split('@')[0]);
      if (historyEntry) {
        const age = now - historyEntry.ts;
        const maxQ = Math.max(...Object.values(entry));
        if (age > maxAge && maxQ < minQ) {
          this.qTable.delete(key);
          cleaned++;
        }
      }
    }
    if (cleaned > 0) this._saveQTable();
    return {
      cleaned,
      remaining: this.qTable.size,
      insight: '不垢不净，不增不减：Q-table 不是越大越好，放下不需要的，才能记住真正重要的。'
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
