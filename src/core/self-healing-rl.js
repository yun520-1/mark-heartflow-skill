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
const QTABLE_HMAC_KEY = process.env.HEARTFLOW_QTABLE_HMAC_KEY || 'heartflow-qtable-default-key-v1';
if (!process.env.HEARTFLOW_QTABLE_HMAC_KEY) {
  console.warn('[HealingMemoryRL] HEARTFLOW_QTABLE_HMAC_KEY not set, using default key (set env var for production)');
}
if (!/^[A-Za-z0-9+/=_-]+$/.test(QTABLE_HMAC_KEY)) {
  throw new Error('[HealingMemoryRL] HEARTFLOW_QTABLE_HMAC_KEY must contain only printable ASCII characters');
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
        const computed = crypto.createHmac('sha256', QTABLE_HMAC_KEY)
          .update(JSON.stringify({ qTable, history, savedAt, ...rest }))
          .digest('hex');
        if (computed !== _hmac) {
          console.warn('[HealingMemoryRL] Q-table HMAC mismatch, starting fresh');
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
