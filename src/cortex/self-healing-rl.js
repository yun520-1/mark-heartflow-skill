/**
 * HeartFlow HealingMemoryRL v11.6.3
 * Q-learning based repair strategy memory for self-healing.
 * Paper: Reflexion (2023), CRITIC (2024), Titans (2025)
 *
 * v11.6.2 新增：reflect() + getReflections()
 * - 基于 Reflexion 2023 自我反思机制
 * - 策略失败时生成失败假设，存储反思历史
 * - 下次选策略时参考，避免重蹈覆辙
 * - 基于 Titans 论文的 Memory Importance Score
 * - 公式：importance = recencyScore * accessScore * qScore
 * - recencyScore: 时间衰减，越久远越低
 * - accessScore: 访问频率评分
 * - qScore: Q值评分
 */

const fs = require('fs');
const path = require('path');
const { atomicWrite } = require('../utils/atomic-write');
const crypto = require('crypto');
// 公式注册表：把 RL 认知公式（Softmax 策略/Q-Learning）注入自我疗愈（v5.9.5 重构）
const { getFormulaRegistry } = require('../formula/formula-registry.js');
const _registry = getFormulaRegistry();

// === Q-table 最大容量 ===
const MAX_QTABLE_SIZE = 500;
/**
 * 有界集合（FIFO 淘汰策略）
 * 当 map 达到 maxSize 且 key 不在 map 中时，删除最早加入的 key
 * @param {Map} map - 目标 Map
 * @param {string} key - 键
 * @param {any} value - 值
 * @param {number} maxSize - 最大容量
 */
function _boundedSet(map, key, value, maxSize) {
  if (map.size >= maxSize && !map.has(key)) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
  map.set(key, value);
}

// === 全局 Q-table 写入防抖锁 ===
const _writeLock = { locked: false, queue: [], pendingTimer: null, dirty: false };
function _debouncedSave(instance) {
  if (_writeLock.locked) {
    _writeLock.dirty = true;
    return;
  }
  _writeLock.locked = true;
  _writeLock.dirty = false;
  instance._saveQTable().finally(() => {
    _writeLock.locked = false;
    if (_writeLock.dirty) {
      _writeLock.dirty = false;
      _debouncedSave(instance);
    }
  });
}

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
    } catch (e) { process.stderr.write('[self-healing-rl] HMAC key file corrupted, regenerating: ' + e.message + '\n'); }
  }

  // 生成新key并持久化
  const newKey = crypto.randomBytes(32).toString('base64');
  try {
    fs.writeFileSync(keyFile, JSON.stringify({ key: newKey, createdAt: Date.now() }, null, 2), { mode: 0o600 });
  } catch (e) { /* info: HMAC 写入失败时 fallback 到内存模式，不影响正常运行 */ }
  _cachedHmacKey = newKey;
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

async function _saveQMeta() {
  await atomicWrite(QMetaFile, JSON.stringify(_qMeta, null, 2));
}

function _touchEntry(ck) {
  if (!_qMeta[ck]) {
    _qMeta[ck] = { createdAt: Date.now(), lastAccessedAt: Date.now(), accessCount: 0 };
  }
  _qMeta[ck].lastAccessedAt = Date.now();
  _qMeta[ck].accessCount = (_qMeta[ck].accessCount || 0) + 1;
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
    // === ε-greedy 探索配置 ===
    // ε = 探索概率（默认10%，每次选策略时有10%概率随机选）
    // ε-greedy = 避免Q-table陷入局部最优，持续探索未知策略
    this.epsilon = parseFloat(process.env.HEARTFLOW_RL_EPSILON || '0.1');
    // ε 衰减：每次成功利用后乘以此值（逐步减少探索）
    // minEpsilon = 下限，确保永远有最小探索率
    this.epsilonDecay = parseFloat(process.env.HEARTFLOW_RL_EPSILON_DECAY || '0.99');
    this.minEpsilon = 0.01;
    // 利用计数器（用于decay触发）
    this._exploitCount = 0;
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
          // [A04-FIX] HMAC 校验失败：拒绝加载被篡改的 Q-table，保留内存中现有状态
          process.stderr.write('[HealingMemoryRL] Q-table HMAC mismatch — refusing to load tampered data, keeping in-memory state\n');
          return;
        }
      }
      if (data.qTable) {
        this.qTable = new Map(Object.entries(data.qTable));
      }
      if (data.history) {
        this.history = data.history.slice(-this.maxMemory);
      }
    } catch (_) { /* [v5.9.18] intentional: graceful degradation */ }
  }

  async _saveQTable() {
    this._ensureMemoryDir();
    const { _hmac, ...rest } = { qTable: Object.fromEntries(this.qTable), history: this.history.slice(-50), savedAt: new Date().toISOString() };
    const sigPayload = { qTable: rest.qTable, history: rest.history, savedAt: rest.savedAt };
    const hmac = crypto.createHmac('sha256', QTABLE_HMAC_KEY).update(JSON.stringify(sigPayload)).digest('hex');
    const data = { ...sigPayload, _hmac: hmac };
    await atomicWrite(QTABLE_FILE, JSON.stringify(data, null, 2));
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
      _boundedSet(this.qTable, ck, {}, MAX_QTABLE_SIZE);
    }
    const entry = this.qTable.get(ck);
    const currentQ = entry[strategy] ?? 0.5;
    const reward = success ? 1.0 : -0.5;
    const learningRate = 0.2;
    entry[strategy] = currentQ + learningRate * (reward - currentQ);
    _touchEntry(ck);
    _debouncedSave(this);
  }

  /**
   * Get best strategy for an error pattern (context-aware)
   * 使用 ε-greedy 探索：
   * - 以 ε 概率随机选择一个策略（探索）
   * - 以 1-ε 概率选择最高 Q 值策略（利用）
   * 探索让引擎能发现新的有效策略，避免被 Q-table 的历史认知困住
   */
  getBestStrategy(errorPattern, options = {}) {
    const ck = this._contextKey(errorPattern);
    _touchEntry(ck);
    const entry = this.qTable.get(ck);
    if (!entry) return null;

    // 当前有效 ε（支持运行时调整）
    const epsilon = options.epsilon !== undefined ? options.epsilon : this.epsilon;

    // ε-greedy 决策
    const strategies = Object.keys(entry);
    if (strategies.length === 0) return null;

    // 探索：以 ε 概率随机选择
    if (Math.random() < epsilon) {
      const randomIdx = Math.floor(Math.random() * strategies.length);
      const chosen = strategies[randomIdx];
      return {
        strategy: chosen,
        mode: 'explore',  // 探索模式
        epsilon,
        insight: `ε-greedy探索：随机选"${chosen}"（Q=${entry[chosen].toFixed(3)}）来发现未知有效策略`
      };
    }

    // 利用：以 1-ε 概率按 Q 值做 Softmax 概率化选择（而非纯 argmax）
    // 公式：π(a|s) = exp(Q(s,a)/τ) / Σ exp(Q(s,a')/τ)，温度 τ 与 ε 反相关
    // （ε 高→探索多→τ 高→选择更均匀；ε 低→利用多→τ 低→偏向高 Q）
    let best = null;
    let bestQ = -Infinity;
    const strategyList = strategies;
    const qValues = strategyList.map(s => entry[s]);
    const tau = Math.max(0.05, epsilon * 2);   // ε=1→τ=2(均匀), ε=0.1→τ=0.2(锐利)
    const probs = _registry.call('decision_utility', 'softmax_policy', qValues, tau) || [];
    if (probs.length === strategyList.length) {
      // 按 softmax 概率抽样选择
      const rnd = Math.random();
      let cum = 0;
      for (let i = 0; i < strategyList.length; i++) {
        cum += probs[i];
        if (rnd <= cum) { best = strategyList[i]; break; }
      }
      if (!best) best = strategyList[strategyList.length - 1];
    } else {
      // softmax 失败回退到 argmax
      for (const [strategy, qValue] of Object.entries(entry)) {
        if (qValue > bestQ) { bestQ = qValue; best = strategy; }
      }
    }
    bestQ = entry[best];

    // ε 衰减（只在利用成功时衰减，鼓励探索）
    this._exploitCount++;
    if (this._exploitCount % 10 === 0 && this.epsilon > this.minEpsilon) {
      this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    }

    return {
      strategy: best,
      mode: 'exploit',  // 利用模式
      qValue: bestQ,
      epsilon,
      insight: `利用：选"${best}"（Q=${bestQ.toFixed(3)}），ε=${(epsilon * 100).toFixed(1)}%`
    };
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
    _debouncedSave(this);
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
      _debouncedSave(this);
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
   * 计算Q值分布的混淆度（熵/方差）
   * 基于RL不确定性探索原理：
   * - 熵高 → 策略之间势均力敌，不确定哪个最好 → 提高探索率
   * - 熵低 → 一个策略明显优于其他 → 降低探索率
   * @returns {object} 混淆度详情
   */
  getConfusionScore(errorPattern) {
    const ck = this._contextKey(errorPattern);
    const entry = this.qTable.get(ck);
    if (!entry || Object.keys(entry).length === 0) {
      return { confusion: 1.0, entropy: 0, stdDev: 0, strategies: 0, insight: '无历史数据，最大混淆' };
    }
    const values = Object.values(entry);
    const n = values.length;
    const mean = values.reduce((s, v) => s + v, 0) / n;

    // 标准差（方差的平方根）
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // 归一化标准差（0=完全确定, 1=完全混乱）
    // 最大stdDev在均匀分布时约为0.5/√3 ≈ 0.289（Q值在[0,1]范围）
    const normalizedStdDev = Math.min(1.0, stdDev / 0.3);

    // 策略之间的最大差距（另一个混淆指标）
    const maxDiff = n > 1 ? (Math.max(...values) - Math.min(...values)) : 0;

    return {
      confusion: parseFloat(normalizedStdDev.toFixed(3)),  // 0-1，越高越混乱
      entropy: parseFloat(stdDev.toFixed(4)),
      maxDiff: parseFloat(maxDiff.toFixed(3)),
      mean: parseFloat(mean.toFixed(3)),
      strategies: n,
      insight: n > 1 && maxDiff < 0.2
        ? '多策略势均力敌，Q值混乱 → 提高探索率'
        : 'Q值分布清晰，某个策略领先 → 降低探索率'
    };
  }

  /**
   * 基于Q值混淆度获取自适应探索率
   * 混淆度高 → 探索率高（想发现更好的策略）
   * 混淆度低 → 探索率低（已有明确最优策略）
   * @param {number} baseEpsilon - 基础探索率
   * @returns {object} 自适应epsilon及原因
   */
  getAdaptiveExploration(baseEpsilon = null) {
    const epsilon = baseEpsilon !== null ? baseEpsilon : this.epsilon;
    // 如果没有context key，返回基础epsilon
    const ctxKeys = [...this.qTable.keys()];
    if (ctxKeys.length === 0) {
      return { epsilon, reason: '无Q表数据，使用基础探索率' };
    }

    // 计算所有context的平均混淆度
    let totalConfusion = 0;
    for (const key of ctxKeys) {
      const entry = this.qTable.get(key);
      if (entry && Object.keys(entry).length > 1) {
        const values = Object.values(entry);
        const mean = values.reduce((s, v) => s + v, 0) / values.length;
        const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        totalConfusion += Math.min(1.0, stdDev / 0.3);
      }
    }
    const avgConfusion = ctxKeys.length > 0 ? totalConfusion / ctxKeys.length : 1.0;

    // 自适应epsilon：基础值 * (1 + confusion)
    // confusion=0时，epsilon不变；confusion=1时，epsilon翻倍
    const adaptiveEpsilon = Math.min(0.9, epsilon * (1 + avgConfusion * 0.5));

    return {
      epsilon: parseFloat(adaptiveEpsilon.toFixed(3)),
      baseEpsilon: epsilon,
      avgConfusion: parseFloat(avgConfusion.toFixed(3)),
      reason: avgConfusion > 0.5
        ? `Q值混乱（${(avgConfusion*100).toFixed(0)}%）→ 提高探索率`
        : `Q值清晰 → 保持基础探索率`
    };
  }

  /**
   * 自我反思：分析策略失败原因（基于 Reflexion 2023, CRITIC 2024）
   * 当策略失败时，生成"失败假设"存储下来，
   * 下次选择策略时参考，避免重蹈覆辙。
   * @param {string} errorPattern - 错误模式
   * @param {string} failedStrategy - 失败的策略名
   * @param {string} failureHypothesis - 失败原因假设（可选，自动生成）
   * @returns {object} 反思结果
   */
  reflect(errorPattern, failedStrategy, failureHypothesis = null) {
    const ck = this._contextKey(errorPattern);
    const entry = this.qTable.get(ck) || {};
    const currentQ = entry[failedStrategy] ?? 0.5;

    // 自动生成失败假设（基于Q值和上下文）
    const autoHypothesis = failureHypothesis || (() => {
      const qLevel = currentQ > 0.6 ? '高' : currentQ > 0.3 ? '中' : '低';
      const strategies = Object.keys(entry);
      const otherStrats = strategies.filter(s => s !== failedStrategy);
      const betterStrats = otherStrats.filter(s => (entry[s] || 0) > currentQ);
      if (betterStrats.length > 0) {
        return `策略"${failedStrategy}"（Q=${currentQ.toFixed(2)}，${qLevel}置信）输给${betterStrats.length}个替代策略，可能不适合此错误模式`;
      }
      return `策略"${failedStrategy}"（Q=${currentQ.toFixed(2)}）失败，所有策略Q值相近，当前模式需要新的策略方向`;
    })();

    // 存储反思结果
    if (!this._reflections) this._reflections = [];
    const reflection = {
      errorPattern: errorPattern.slice(0, 80),
      failedStrategy,
      hypothesis: autoHypothesis,
      qValue: currentQ,
      reflectedAt: new Date().toISOString()
    };
    this._reflections.push(reflection);
    // 只保留最近20条反思
    if (this._reflections.length > 20) this._reflections.shift();

    // 对该策略在当前context降低Q值（强化反思效果）
    entry[failedStrategy] = Math.max(0, currentQ - 0.15);
    _boundedSet(this.qTable, ck, entry, MAX_QTABLE_SIZE);
    // [HIGH FIX] 取消注释 _saveQTable()（之前注释掉导致 Q-table 修改只存内存，进程退出即丢失）
    this._saveQTable().catch(e => console.error('[HealingMemoryRL] reflect save failed:', e.message));

    return {
      strategy: failedStrategy,
      hypothesis: autoHypothesis,
      newQ: entry[failedStrategy],
      insight: `反思：${autoHypothesis} → Q值调整为${entry[failedStrategy].toFixed(3)}`
    };
  }

  /**
   * 获取失败策略的反思历史
   * @param {string} errorPattern - 错误模式
   * @returns {array} 反思历史
   */
  getReflections(errorPattern) {
    if (!this._reflections) return [];
    // [MEDIUM FIX] 避免误匹配：前 40 字符相同的不同错误会被误匹配
    // 改用 includes() 模糊匹配（允许子串匹配，但不止比前 40 字符）
    return this._reflections.filter(r =>
      r.errorPattern.includes(errorPattern) || errorPattern.includes(r.errorPattern)
    );
  }

  /**
   * 言语自修正：基于 Reflexion (2023) 的 verbal reinforcement learning
   * 当策略失败时，生成自然语言描述的错误分析 + 新策略建议
   * 下次 getBestStrategy 会优先选择 verbal 生成的新策略
   *
   * 核心思想：
   * - 不是只调整 Q 值，而是生成可读的失败诊断
   * - 将诊断存储为 verbal trace，用于未来策略决策
   * - 新策略名称包含失败原因摘要，使未来选择更具信息量
   *
   * @param {string} errorPattern - 错误模式
   * @param {string} failedStrategy - 失败的策略名
   * @param {string} diagnosis - 失败诊断（语义分析）
   * @param {string} suggestedStrategy - 建议的新策略名
   * @returns {object} 自修正结果
   */
  verbalSelfCorrect(errorPattern, failedStrategy, diagnosis, suggestedStrategy) {
    const ck = this._contextKey(errorPattern);
    if (!this.qTable.has(ck)) {
      _boundedSet(this.qTable, ck, {}, MAX_QTABLE_SIZE);
    }
    const entry = this.qTable.get(ck);

    // 存储 verbal trace（反思的语义版本）
    if (!this._verbalTraces) this._verbalTraces = [];
    const trace = {
      errorPattern: errorPattern.slice(0, 80),
      failedStrategy,
      diagnosis: diagnosis.slice(0, 200),
      suggestedStrategy,
      timestamp: Date.now()
    };
    this._verbalTraces.push(trace);
    if (this._verbalTraces.length > 30) this._verbalTraces.shift();

    // 对失败策略做强惩罚（比普通 reflect 更重）
    const oldQ = entry[failedStrategy] ?? 0.5;
    entry[failedStrategy] = Math.max(0, oldQ - 0.25);

    // 新策略初始 Q 值设为中等（0.5），给予机会但不偏袒
    entry[suggestedStrategy] = 0.5;

    _boundedSet(this.qTable, ck, entry, MAX_QTABLE_SIZE);

    return {
      failedStrategy,
      newQ: entry[failedStrategy],
      suggestedStrategy,
      initialQ: 0.5,
      traceId: this._verbalTraces.length - 1,
      insight: `Reflexion引导：\"${failedStrategy}\" → \"${suggestedStrategy}\"（Q惩罚${((oldQ - entry[failedStrategy]) * 100).toFixed(0)}%）`
    };
  }

  /**
   * 获取言语自修正的 verbal traces 历史
   * @param {string} errorPattern - 可选，按错误模式过滤
   * @returns {array} verbal traces
   */
  getVerbalTraces(errorPattern = null) {
    if (!this._verbalTraces) return [];
    if (!errorPattern) return this._verbalTraces;
    return this._verbalTraces.filter(t =>
      t.errorPattern.startsWith(errorPattern.slice(0, 40))
    );
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

  /**
   * 计算单条记忆的重要性评分（基于 Titans 论文）
   * @param {string} key - Q-table 的 context key
   * @param {object} entry - Q-table 条目（strategy -> Q值）
   * @returns {object} 重要性评分详情
   */
  _calcMemoryImportance(key, entry) {
    _loadQMeta();
    const meta = _qMeta[key] || { accessCount: 0, lastAccessedAt: Date.now() };

    const now = Date.now();
    const ageMs = now - meta.lastAccessedAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // recencyScore: 时间衰减评分 (1.0 = 刚访问, 0.0 = 很旧)
    // 使用指数衰减：TITAN_HALF_LIFE_DAYS=30天半衰期
    const TITAN_HALF_LIFE_DAYS = 30;
    const recencyScore = Math.exp(-0.693 * ageDays / TITAN_HALF_LIFE_DAYS);

    // accessScore: 访问频率评分 (0-1，访问越多越高)
    const accessScore = Math.min(1.0, (meta.accessCount || 0) / 10);

    // qScore: Q值评分（最高Q值归一化）
    const maxQ = Object.values(entry).reduce((m, v) => Math.max(m, v), 0);
    const qScore = Math.max(0, Math.min(1.0, maxQ)); // Q值通常0-1

    // 综合重要性评分：三个维度相乘
    const importance = recencyScore * accessScore * qScore;

    return {
      recencyScore: parseFloat(recencyScore.toFixed(4)),
      accessScore: parseFloat(accessScore.toFixed(4)),
      qScore: parseFloat(qScore.toFixed(4)),
      importance: parseFloat(importance.toFixed(4)),
      ageDays: parseFloat(ageDays.toFixed(2)),
      accessCount: meta.accessCount || 0,
      strategies: Object.keys(entry).length
    };
  }

  /**
   * 获取所有记忆的重要性评分（用于监控/分析）
   * @returns {array} 按重要性排序的记忆条目
   */
  getMemoryImportance() {
    _loadQMeta();
    const results = [];

    for (const [key, entry] of this.qTable.entries()) {
      const score = this._calcMemoryImportance(key, entry);
      results.push({
        key: key.slice(0, 60),
        ...score
      });
    }

    // 按重要性降序排序
    results.sort((a, b) => b.importance - a.importance);

    return {
      total: results.length,
      items: results.slice(0, 20), // 只返回Top20
      insight: 'Titans-inspired: 记忆重要性 = recency × access × Q-value'
    };
  }

  /**
   * 跨会话 Q-table 合并：从 LEARNED 层加载 lesson patterns，合并到 Q-table
   *
   * 每个 lesson pattern 被视为一个"虚拟策略尝试"：
   *   - pattern = contextKey
   *   - successRate = 该 lesson 的成功率 -> 转为 Q-value
   *   - accessCount = lesson 被引用的次数 -> Q-value 的置信度权重
   *
   * 合并策略：新 Q-value = (oldQ * oldWeight + lessonQ * lessonWeight) / (oldWeight + lessonWeight)
   * 其中 weight = min(1, accessCount / 5) -- 5次以上引用视为"经验丰富"
   *
   * @param {Array} learnedLessons - 从 LEARNED 层读取的 lesson 数组
   *   [{ key, value, successRate, accessCount }]
   * @returns {object} 合并结果
   */
  mergeFromLearnedLayer(learnedLessons = []) {
    if (!learnedLessons || learnedLessons.length === 0) {
      return { merged: 0, skipped: 0, total: 0 };
    }

    let merged = 0;
    let skipped = 0;

    for (const lesson of learnedLessons) {
      const pattern = lesson.key || lesson.pattern || '';
      if (!pattern) { skipped++; continue; }

      const successRate = lesson.successRate !== undefined ? lesson.successRate : 0.5;
      const accessCount = lesson.accessCount || 1;
      const lessonQ = successRate;
      const lessonWeight = Math.min(1.0, accessCount / 5);

      const ck = `${pattern}@${this._ctx.machineId}:${this._ctx.environment}:${this._ctx.region}`;

      if (!this.qTable.has(ck)) {
        _boundedSet(this.qTable, ck, {}, MAX_QTABLE_SIZE);
      }
      const entry = this.qTable.get(ck);

      const strategyKey = `lesson_${pattern.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}`;
      const oldQ = entry[strategyKey] ?? 0.5;
      const oldWeight = 1.0;

      const newQ = (oldQ * oldWeight + lessonQ * lessonWeight) / (oldWeight + lessonWeight);
      entry[strategyKey] = parseFloat(newQ.toFixed(4));

      if (_qMeta[ck]) {
        _qMeta[ck].accessCount = (_qMeta[ck].accessCount || 0) + 1;
        _qMeta[ck].lastAccessedAt = Date.now();
      } else {
        _qMeta[ck] = { createdAt: Date.now(), lastAccessedAt: Date.now(), accessCount: 1 };
      }

      merged++;
    }

    _debouncedSave(this);

    return {
      merged,
      skipped,
      total: learnedLessons.length,
      qTableSize: this.qTable.size,
      insight: `跨会话合并：${merged}条lesson合并到Q-table，${skipped}条跳过`
    };
  }

  /**
   * 导出 Q-table 为可序列化的 lesson 格式（供跨会话传递）
   * @returns {Array} lessons 数组
   */
  exportAsLessons() {
    const lessons = [];
    for (const [ck, entry] of this.qTable.entries()) {
      const pattern = ck.split('@')[0];
      const strategies = Object.entries(entry);
      if (strategies.length === 0) continue;

      const best = strategies.sort((a, b) => b[1] - a[1])[0];
      const maxQ = best[1];
      const totalAttempts = strategies.reduce((s, e) => s + (e[1] > 0.5 ? 1 : 0), 0);

      lessons.push({
        key: pattern,
        value: `lesson_${pattern.slice(0, 40)}: best=${best[0]}, Q=${maxQ.toFixed(3)}`,
        successRate: parseFloat(maxQ.toFixed(3)),
        accessCount: Math.max(1, totalAttempts),
        source: 'qtable_export',
        exportedAt: new Date().toISOString(),
      });
    }
    return lessons;
  }
}

module.exports = { HealingMemoryRL };
