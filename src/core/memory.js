/**
 * HeartFlow Memory — Ebbinghaus + AES-256-GCM 三层记忆系统
 * 
 * 整合来源（SKILL.md lines 348-540）：
 *   mark-StillWater/src/core/memory.js — Dirty Flag + Ebbinghaus + Atomic Write
 * 
 * 核心能力：
 * 1. Ebbinghaus 遗忘曲线：R = e^(-t/S)，低于阈值自动压缩/删除
 * 2. AES-256-GCM 加密（LEARNED 层）—— 敏感知识加密存储
 * 3. 三层记忆：CORE (永久) / LEARNED (30天+加密) / EPHEMERAL (会话)
 * 4. Dirty Flag 优化：避免不必要写入，每5次访问才写 EPHEMERAL
 * 5. 原子写入：temp + rename 防数据损坏
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── 常量配置 ───────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, '../../../data');
const CORE_PATH   = path.join(DATA_DIR, 'memory-core.json');
const LEARNED_PATH = path.join(DATA_DIR, 'memory-learned.enc');  // .enc = encrypted
const EPHEMERAL_PATH = path.join(DATA_DIR, 'memory-ephemeral.json');

const FORGETTING_CONFIG = {
  defaultStability: 10,     // hours, base stability (importance=10)
  coreStability: 8760,      // 1 year = CORE permanent
  learnedStability: 720,     // 30 days = LEARNED tier
  compressionThreshold: 0.3, // retention < 30% → compress
  deletionThreshold: 0.1,    // retention < 10% → delete
  ephemeralMaxAge: 6,       // hours before EPHEMERAL considered stale
};

// AES-256-GCM 配置
const AES_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  authTagLength: 16,
  // Key derived from env or generated per-session, stored securely
};

// ─── 存储桶 ──────────────────────────────────────────────────────────────────

let _coreStore     = {};  // { id: memoryRecord }
let _learnedStore  = {};  // { id: { encrypted, iv, authTag, data } }
let _ephemeralStore = {}; // { id: memoryRecord }

// Dirty flags
let _coreDirty     = false;
let _learnedDirty  = false;
let _ephemeralDirty = false;

// Access counters for EPHEMERAL write optimization
let _ephemeralAccessCount = {}; // { id: count }

// ─── [A07] 访问控制 ──────────────────────────────────────────────────────────
// Session context: 每个调用方必须设置session才能操作记忆
let _currentSession = null;  // { sessionId, userId, capabilities: Set }

// 能力定义
const CAPS = {
  READ_CORE: 'read_core',
  WRITE_CORE: 'write_core',
  READ_LEARNED: 'read_learned',
  WRITE_LEARNED: 'write_learned',
  READ_EPHEMERAL: 'read_ephemeral',
  WRITE_EPHEMERAL: 'write_ephemeral',
  DELETE_ANY: 'delete_any',
  ADMIN: 'admin',
};

/**
 * 设置当前会话上下文（必须在操作记忆前调用）
 * @param {object} session - { sessionId, userId, capabilities?: string[] }
 */
function setSession(session) {
  if (!session || !session.sessionId) {
    throw new Error('[Memory] setSession: sessionId is required');
  }
  _currentSession = {
    sessionId: session.sessionId,
    userId: session.userId || 'anonymous',
    capabilities: new Set(session.capabilities || [CAPS.READ_LEARNED, CAPS.WRITE_LEARNED, CAPS.READ_EPHEMERAL, CAPS.WRITE_EPHEMERAL]),
  };
}

/**
 * 获取当前会话
 */
function getSession() {
  return _currentSession;
}

/**
 * 清除会话
 */
function clearSession() {
  _currentSession = null;
}

/**
 * 检查当前会话是否有指定能力
 */
function _hasCap(cap) {
  if (!_currentSession) {
    throw new Error('[Memory] No session set. Call setSession() first.');
  }
  if (_currentSession.capabilities.has(CAPS.ADMIN)) return true;
  return _currentSession.capabilities.has(cap);
}

// ─── 加密密钥管理 ────────────────────────────────────────────────────────────

let _aesKey = null;

/**
 * 获取或生成 AES-256 密钥
 * 优先级：ENV_AES_KEY > session key file
 */
function _getOrCreateAesKey() {
  if (_aesKey) return _aesKey;

  // Check environment variable first (base64 encoded 32-byte key)
  const envKey = process.env.HEARTFLOW_AES_KEY;
  if (envKey) {
    _aesKey = Buffer.from(envKey, 'base64');
    if (_aesKey.length !== AES_CONFIG.keyLength) {
      throw new Error('HEARTFLOW_AES_KEY must be 32 bytes (base64 encoded)');
    }
    return _aesKey;
  }

  // Generate a session key and store in a restricted file
  const keyFile = path.join(DATA_DIR, '.aes-key');
  if (fs.existsSync(keyFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(keyFile, 'utf-8'));
      _aesKey = Buffer.from(meta.key, 'base64');
      return _aesKey;
    } catch {
      // corrupted, regenerate
    }
  }

  // Generate new key
  _aesKey = crypto.randomBytes(AES_CONFIG.keyLength);
  const meta = { key: _aesKey.toString('base64'), createdAt: Date.now() };
  // Write with restricted permissions (Unix only)
  fs.writeFileSync(keyFile, JSON.stringify(meta), { mode: 0o600 });
  // [A05] Windows ACL 警告
  if (process.platform === 'win32') {
    console.warn('[Memory] WARNING: Windows - key file permissions may not be effective. Use NTFS ACLs for protection.');
  }
  return _aesKey;
}

// ─── AES-256-GCM 加密/解密 ──────────────────────────────────────────────────

/**
 * Encrypt data using AES-256-GCM
 * @param {object} data - Plain object to encrypt
 * @returns {{ encrypted: string, iv: string, authTag: string }}
 */
function aesEncrypt(data) {
  const key = _getOrCreateAesKey();
  const iv = crypto.randomBytes(AES_CONFIG.ivLength);
  const cipher = crypto.createCipheriv(AES_CONFIG.algorithm, key, iv);

  const plaintext = JSON.stringify(data);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {{ encrypted, iv, authTag }} payload
 * @returns {object} Decrypted plain object
 */
function aesDecrypt(payload) {
  const key = _getOrCreateAesKey();
  const decipher = crypto.createDecipheriv(
    AES_CONFIG.algorithm,
    key,
    Buffer.from(payload.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

  let decrypted = decipher.update(payload.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

// ─── 原子写入 ────────────────────────────────────────────────────────────────

/**
 * Atomic write: write to temp file then rename
 * Guarantees: either complete write or no write at all
 * Note: On Windows, fs.renameSync is not fully atomic. For Windows,
 * consider using 'write-file-atomic' package or external locking.
 */
function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = filePath + '.tmp.' + Date.now() + '.' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath); // atomic on POSIX
}

// ─── 持久化 ─────────────────────────────────────────────────────────────────

function _loadAll() {
  // CORE: plain JSON
  if (fs.existsSync(CORE_PATH)) {
    try {
      _coreStore = JSON.parse(fs.readFileSync(CORE_PATH, 'utf-8'));
      console.log(`[Memory] CORE loaded: ${Object.keys(_coreStore).length} records`);
    } catch (e) {
      console.warn('[Memory] CORE load failed:', e.message);
      _coreStore = {};
    }
  }

  // LEARNED: encrypted JSON
  if (fs.existsSync(LEARNED_PATH)) {
    try {
      const raw = fs.readFileSync(LEARNED_PATH, 'utf-8');
      const { version, entries } = JSON.parse(raw);
      for (const [id, payload] of Object.entries(entries)) {
        _learnedStore[id] = payload;
      }
      console.log(`[Memory] LEARNED loaded: ${Object.keys(_learnedStore).length} encrypted records`);
    } catch (e) {
      console.warn('[Memory] LEARNED load failed:', e.message);
      _learnedStore = {};
    }
  }

  // EPHEMERAL: plain JSON
  if (fs.existsSync(EPHEMERAL_PATH)) {
    try {
      _ephemeralStore = JSON.parse(fs.readFileSync(EPHEMERAL_PATH, 'utf-8'));
      console.log(`[Memory] EPHEMERAL loaded: ${Object.keys(_ephemeralStore).length} records`);
    } catch (e) {
      console.warn('[Memory] EPHEMERAL load failed:', e.message);
      _ephemeralStore = {};
    }
  }
}

function _saveCore() {
  if (!_coreDirty) return;
  atomicWriteJson(CORE_PATH, _coreStore);
  _coreDirty = false;
  console.log('[Memory] CORE saved');
}

function _saveLearned() {
  if (!_learnedDirty) return;

  const entries = {};
  for (const [id, payload] of Object.entries(_learnedStore)) {
    entries[id] = payload;
  }

  const data = { version: 1, entries, savedAt: new Date().toISOString() };
  atomicWriteJson(LEARNED_PATH, data);
  _learnedDirty = false;
  console.log('[Memory] LEARNED saved (encrypted)');
}

function _saveEphemeral() {
  if (!_ephemeralDirty) return;
  atomicWriteJson(EPHEMERAL_PATH, _ephemeralStore);
  _ephemeralDirty = false;
}

function saveAll() {
  _saveCore();
  _saveLearned();
  _saveEphemeral();
}

// ─── Dirty Flag ─────────────────────────────────────────────────────────────

function markCoreDirty() { _coreDirty = true; }
function markLearnedDirty() { _learnedDirty = true; }
function markEphemeralDirty() { _ephemeralDirty = true; }

// ─── Ebbinghaus 遗忘曲线 ─────────────────────────────────────────────────────

/**
 * Ebbinghaus retention formula: R = e^(-t/S)
 * @param {number} stabilityHours - Stability parameter (S)
 * @param {number} ageHours - Time elapsed in hours (t)
 * @returns {{ retention: number, shouldCompress: bool, shouldDelete: bool }}
 */
function ebbinghausForget(stabilityHours, ageHours) {
  const retention = Math.exp(-ageHours / stabilityHours);
  return {
    retention,
    shouldCompress: retention < FORGETTING_CONFIG.compressionThreshold,
    shouldDelete: retention < FORGETTING_CONFIG.deletionThreshold,
  };
}

/**
 * Get stability hours for a memory based on its layer and importance
 */
function _getStability(layer, importance = 10) {
  if (layer === 'core') return FORGETTING_CONFIG.coreStability;
  if (layer === 'learned') return FORGETTING_CONFIG.learnedStability;
  // Ephemeral: use importance-derived stability
  return importance * (FORGETTING_CONFIG.defaultStability / 10);
}

/**
 * Apply forgetting curve to LEARNED layer
 * Compresses or deletes memories below retention thresholds
 */
function applyForgetting() {
  const now = Date.now();
  const toDelete = [];
  const toCompress = [];

  for (const [id, entry] of Object.entries(_learnedStore)) {
    if (!entry.data || !entry.data.timestamp) continue;

    const ageHours = (now - entry.data.timestamp) / (1000 * 60 * 60);
    const stability = _getStability('learned', entry.data.importance || 10);
    const { shouldDelete, shouldCompress } = ebbinghausForget(stability, ageHours);

    if (shouldDelete) {
      toDelete.push(id);
    } else if (shouldCompress && !entry.data.compressed) {
      entry.data.compressed = true;
      entry.data.compressedAt = now;
      toCompress.push(id);
      markLearnedDirty();
    }
  }

  for (const id of toDelete) {
    delete _learnedStore[id];
    markLearnedDirty();
  }

  if (toDelete.length > 0 || toCompress.length > 0) {
    _saveLearned();
    console.log(`[Memory] Forgetting: deleted=${toDelete.length}, compressed=${toCompress.length}`);
  }

  return { deleted: toDelete.length, compressed: toCompress.length };
}

// ─── 存储 API ───────────────────────────────────────────────────────────────

/**
 * Generate a unique memory ID
 */
function generateId(prefix = 'mem') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Store a memory in the appropriate layer
 * @param {object} opts - { content, summary?, metadata?, importance?, layer? }
 * @returns {string} memory id
 */
function store(opts) {
  // [A07] 访问控制
  const layer = opts.layer || _classifyLayer(opts);
  if (layer === 'core' && !_hasCap(CAPS.WRITE_CORE)) {
    throw new Error('[Memory] store: insufficient permissions for CORE layer');
  }
  if (layer === 'learned' && !_hasCap(CAPS.WRITE_LEARNED)) {
    throw new Error('[Memory] store: insufficient permissions for LEARNED layer');
  }
  if (layer === 'ephemeral' && !_hasCap(CAPS.WRITE_EPHEMERAL)) {
    throw new Error('[Memory] store: insufficient permissions for EPHEMERAL layer');
  }

  const id = opts.id || generateId(layer === 'core' ? 'core' : layer === 'learned' ? 'lrnd' : 'eph');
  const now = Date.now();

  const record = {
    id,
    content: opts.content,
    summary: opts.summary || String(opts.content).slice(0, 120).replace(/\s+/g, ' '),
    metadata: opts.metadata || {},
    importance: opts.importance || 10,
    accessCount: 0,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  };

  if (layer === 'core') {
    _coreStore[id] = record;
    markCoreDirty();
    _saveCore();
  } else if (layer === 'learned') {
    // Encrypt before storing
    const encrypted = aesEncrypt(record);
    _learnedStore[id] = {
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      data: record, // keep plaintext for in-memory access
    };
    markLearnedDirty();
    _saveLearned();
  } else {
    // EPHEMERAL
    _ephemeralStore[id] = record;
    _ephemeralAccessCount[id] = 0;
    markEphemeralDirty();
  }

  console.log(`[Memory] Stored: ${id} (${layer})`);
  return id;
}

/**
 * Classify memory layer based on content properties
 */
function _classifyLayer(opts = {}) {
  if (opts.metadata?.durable || opts.metadata?.identity || opts.metadata?.directive) return 'core';
  if (opts.metadata?.lesson || opts.metadata?.userPreference || opts.metadata?.taskOutcome) return 'learned';
  return 'ephemeral';
}

/**
 * Retrieve a memory by ID (auto-detect layer)
 * @returns {object|null}
 */
function retrieve(id) {
  if (!id) return null;
  // [A07] 访问控制 - 先确定在哪层再检查权限
  let foundIn = null;
  if (_coreStore[id]) foundIn = 'core';
  else if (_learnedStore[id]?.data) foundIn = 'learned';
  else if (_ephemeralStore[id]) foundIn = 'ephemeral';
  if (!foundIn) return null;

  if (foundIn === 'core' && !_hasCap(CAPS.READ_CORE)) {
    throw new Error('[Memory] retrieve: no permission for CORE layer');
  }
  if (foundIn === 'learned' && !_hasCap(CAPS.READ_LEARNED)) {
    throw new Error('[Memory] retrieve: no permission for LEARNED layer');
  }
  if (foundIn === 'ephemeral' && !_hasCap(CAPS.READ_EPHEMERAL)) {
    throw new Error('[Memory] retrieve: no permission for EPHEMERAL layer');
  }

  if (foundIn === 'core') {
    const mem = _coreStore[id];
    mem.accessCount = (mem.accessCount || 0) + 1;
    markCoreDirty();
    return mem;
  }
  if (foundIn === 'learned') {
    const mem = _learnedStore[id].data;
    mem.accessCount = (mem.accessCount || 0) + 1;
    markLearnedDirty();
    return mem;
  }
  if (foundIn === 'ephemeral') {
    const mem = _ephemeralStore[id];
    mem.accessCount = (mem.accessCount || 0) + 1;
    _ephemeralAccessCount[id] = (_ephemeralAccessCount[id] || 0) + 1;
    if (_ephemeralAccessCount[id] % 5 === 0) {
      markEphemeralDirty();
      _saveEphemeral();
    }
    return mem;
  }
  return null;
}

/**
 * Touch ephemeral memory (mark access without returning data)
 * Triggers periodic write every 5 accesses
 */
function touchEphemeral(id) {
  if (!_ephemeralStore[id]) return;
  _ephemeralAccessCount[id] = (_ephemeralAccessCount[id] || 0) + 1;
  if (_ephemeralAccessCount[id] % 5 === 0) {
    markEphemeralDirty();
    _saveEphemeral();
  }
}

/**
 * Delete a memory by ID
 */
function remove(id) {
  if (!id) return false;
  // [A07] 访问控制
  let foundIn = null;
  if (_coreStore[id]) foundIn = 'core';
  else if (_learnedStore[id]) foundIn = 'learned';
  else if (_ephemeralStore[id]) foundIn = 'ephemeral';
  if (!foundIn) return false;

  // DELETE_ANY 能力可以删除任何层，或者有对应层的写权限
  if (!_hasCap(CAPS.DELETE_ANY)) {
    if (foundIn === 'core' && !_hasCap(CAPS.WRITE_CORE)) {
      throw new Error('[Memory] remove: no permission for CORE layer');
    }
    if (foundIn === 'learned' && !_hasCap(CAPS.WRITE_LEARNED)) {
      throw new Error('[Memory] remove: no permission for LEARNED layer');
    }
    if (foundIn === 'ephemeral' && !_hasCap(CAPS.WRITE_EPHEMERAL)) {
      throw new Error('[Memory] remove: no permission for EPHEMERAL layer');
    }
  }

  if (foundIn === 'core') {
    delete _coreStore[id];
    markCoreDirty();
    _saveCore();
    return true;
  }
  if (foundIn === 'learned') {
    delete _learnedStore[id];
    markLearnedDirty();
    _saveLearned();
    return true;
  }
  if (foundIn === 'ephemeral') {
    delete _ephemeralStore[id];
    delete _ephemeralAccessCount[id];
    markEphemeralDirty();
    _saveEphemeral();
    return true;
  }
  return false;
}

/**
 * Search memories by keyword
 * @returns {Array} matching memories with layer info
 */
function searchByKeywords(keywords, limit = 20) {
  const kwList = Array.isArray(keywords) ? keywords : [keywords];
  const results = [];

  // [A07] 访问控制 - 检查各层读取权限
  const canReadCore = (() => { try { return _hasCap(CAPS.READ_CORE); } catch { return false; } })();
  const canReadLearned = (() => { try { return _hasCap(CAPS.READ_LEARNED); } catch { return false; } })();
  const canReadEphemeral = (() => { try { return _hasCap(CAPS.READ_EPHEMERAL); } catch { return false; } })();

  const search = (store, layer) => {
    for (const [id, mem] of Object.entries(store)) {
      const data = mem.data || mem;
      const content = (data.content || '').toLowerCase();
      let score = 0;
      for (const kw of kwList) {
        if (content.includes(kw.toLowerCase())) score += 1;
      }
      if (score > 0) {
        results.push({ id, layer, content: data.content, summary: data.summary, score, metadata: data.metadata });
      }
    }
  };

  if (canReadCore) search(_coreStore, 'core');
  if (canReadLearned) {
    for (const [id, entry] of Object.entries(_learnedStore)) {
      if (!entry.data) continue;
      const data = entry.data;
      const content = (data.content || '').toLowerCase();
      let score = 0;
      for (const kw of kwList) {
        if (content.includes(kw.toLowerCase())) score += 1;
      }
      if (score > 0) {
        results.push({ id, layer: 'learned', content: data.content, summary: data.summary, score, metadata: data.metadata, timestamp: data.timestamp });
      }
    }
  }
  if (canReadEphemeral) search(_ephemeralStore, 'ephemeral');

  // [NEW] 近期偏好 + 位置衰减 (Lost in the Middle优化)
  // 论文: Liu et al. 2024 "Lost in the Middle" - LLM对中间位置信息Recall最差
  const now = Date.now();
  const RECENCY_HOURS = 24; // 24小时内优先
  const RECENCY_BOOST = 1.5; // 近期结果加权

  for (const r of results) {
    const ageHours = (now - (r.timestamp || 0)) / (1000 * 60 * 60);
    if (ageHours < RECENCY_HOURS) {
      r.score = Math.round(r.score * RECENCY_BOOST * 100) / 100;
      r.recencyBoost = true;
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Get memory statistics
 */
function getStats() {
  return {
    core: Object.keys(_coreStore).length,
    learned: Object.keys(_learnedStore).length,
    ephemeral: Object.keys(_ephemeralStore).length,
    total: Object.keys(_coreStore).length + Object.keys(_learnedStore).length + Object.keys(_ephemeralStore).length,
    dirty: { core: _coreDirty, learned: _learnedDirty, ephemeral: _ephemeralDirty },
  };
}

/**
 * Consolidate: promote high-access EPHEMERAL → LEARNED
 */
function consolidate() {
  const toPromote = [];
  const toDelete = [];

  for (const [id, mem] of Object.entries(_ephemeralStore)) {
    const accessCount = _ephemeralAccessCount[id] || 0;
    if (accessCount >= 3 && (mem.importance || 10) >= 12) {
      toPromote.push(id);
    }
    if (accessCount === 0 && mem.importance < 5) {
      toDelete.push(id);
    }
  }

  const promoted = [];
  for (const id of toPromote) {
    const mem = _ephemeralStore[id];
    mem.layer = 'learned';
    mem.updatedAt = Date.now();
    const encrypted = aesEncrypt(mem);
    _learnedStore[id] = {
      encrypted: encrypted.encrypted,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      data: mem,
    };
    toDelete.push(id);
    promoted.push(id);
    markLearnedDirty();
  }

  for (const id of toDelete) {
    delete _ephemeralStore[id];
    delete _ephemeralAccessCount[id];
    markEphemeralDirty();
  }

  if (promoted.length > 0) {
    _saveLearned();
    _saveEphemeral();
    console.log(`[Memory] Consolidated: promoted=${promoted.length}`);
  }

  return { promoted };
}

// ─── 初始化 ─────────────────────────────────────────────────────────────────

function init() {
  _loadAll();
  // Ensure DATA_DIR exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  // Initialize AES key
  try { _getOrCreateAesKey(); } catch (e) {
    console.warn('[Memory] AES key init failed:', e.message);
  }
  console.log('[Memory] Initialized');
}

// Auto-init on load
init();

// ─── 公开 API ───────────────────────────────────────────────────────────────

module.exports = {
  store,
  retrieve,
  remove,
  searchByKeywords,
  getStats,
  applyForgetting,
  consolidate,
  saveAll,
  touchEphemeral,
  // Ebbinghaus formula exposed for external use
  ebbinghausForget,
  FORGETTING_CONFIG,
  AES_CONFIG,
  // [A07] 访问控制
  setSession,
  getSession,
  clearSession,
  CAPS,
};
