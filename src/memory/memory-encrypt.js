/**
 * memory-encrypt.js — Shared AES-256-GCM encryption for MemoryBank and LongTermMemory
 *
 * Reuses the same encryption pattern and key management from src/memory/memory.js.
 * Gate: HEARTFLOW_AES_KEY env var.
 *
 * Key management:
 *   - HEARTFLOW_AES_KEY is set → use it for encryption/decryption (same key as memory.js LEARNED layer)
 *   - HEARTFLOW_AES_KEY is NOT set → log warning, write plaintext (backward compatible)
 *   - HEARTFLOW_MEMORY_BANK_ENCRYPT=1 → enable encryption (default: enabled when key is set)
 *
 * Usage:
 *   const { encryptJSON, decryptJSON, isEncryptionEnabled } = require('./memory-encrypt.js');
 *   const encrypted = encryptJSON(jsonData);   // returns string (ciphertext or plain JSON)
 *   const decrypted = decryptJSON(rawString);  // returns object
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AES_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  authTagLength: 16,
};

let _aesKey = null;
let _aesKeyResolved = false;
let _encryptionEnabled = null;
let _keyPromise = null; // [v6.0.54 N3] 共享密钥解析 promise，消除并发竞态

const _asyncFs = (() => {
  try { return require('../io/async-fs-adapter.js'); } catch (e) { return null; }
})();

/** Resolve AES key synchronously (kept for sync APIs). */
// [REFACTOR] TODO: _getAesKeySync (612行) — 建议拆分为独立子函数

function _getAesKeySync() {
  if (_aesKeyResolved) return _aesKey;

  _aesKeyResolved = true;

  const envKey = process.env.HEARTFLOW_AES_KEY;
  if (!envKey) {
    const keyFile = path.join(__dirname, '../../memory/.aes-key');
    try {
      if (fs.existsSync(keyFile)) {
        _aesKey = Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'base64');
        console.log('[memory-encrypt] Loaded persisted AES key from memory/.aes-key');
        _aesKeyResolved = true;
        return _aesKey;
      }
      // [v6.0.28 FIX] MEDIUM-1: 密钥冷启动丢失防护
      // 若已存在加密数据(.enc)但密钥文件缺失 -> 拒绝生成新密钥(否则旧数据永久丢失)
      const memDir = path.dirname(keyFile);
      let hasEncryptedData = false;
      try {
        if (fs.existsSync(memDir)) {
          hasEncryptedData = fs.readdirSync(memDir).some(f => f.endsWith('.enc'));
        }
      } catch (e) {
        // 不应静默：目录读取失败可能导致漏检 .enc -> 误生成新密钥丢数据
        console.warn(`[memory-encrypt] 检测 .enc 目录失败(${e.message})，为安全起见拒绝生成新密钥。请用备份 .aes-key 恢复或手动核查 memory/。`);
        hasEncryptedData = true; // 保守：视为有加密数据，阻断新密钥生成
      }
      if (hasEncryptedData) {
        console.error('[memory-encrypt] 检测到已加密数据(.enc)但密钥文件 .aes-key 缺失 —— 拒绝生成新密钥，避免静默数据丢失。请用备份的 .aes-key 恢复，或删除 .enc 文件后重启。加密已禁用。');
        return null;
      }
      const newKey = crypto.randomBytes(32);
      fs.writeFileSync(keyFile, newKey.toString('base64'), { mode: 0o600 });
      console.log('[memory-encrypt] Generated and persisted AES key to memory/.aes-key (0o600)');
      _aesKey = newKey;
      _aesKeyResolved = true;
      return _aesKey;
    } catch (e) {
      console.error('[memory-encrypt] Failed to persist AES key:', e.message, '— encryption disabled');
      return null;
    }
  }

  try {
    _aesKey = Buffer.from(envKey, 'base64');
    if (_aesKey.length !== AES_CONFIG.keyLength) {
      console.warn('[memory-encrypt] HEARTFLOW_AES_KEY is not 32 bytes (base64). Writing plaintext.');
      _aesKey = null;
      return null;
    }
    return _aesKey;
  } catch (e) {
    console.warn('[memory-encrypt] Failed to decode HEARTFLOW_AES_KEY:', e.message);
    _aesKey = null;
    return null;
  }
}

/** Async key resolution: prefer env, else async read/generate key file. */
async function _getAesKeyAsync() {
  // 已解析：同步快路径
  if (_aesKeyResolved) return _aesKey;
  // [v6.0.54 N3] 正在解析：复用同一 promise，所有并发调用拿到同一把密钥（消除竞态）
  if (_keyPromise) return _keyPromise;

  _keyPromise = (async () => {
    const envKey = process.env.HEARTFLOW_AES_KEY;
    if (!envKey) {
      const keyFile = path.join(__dirname, '../../memory/.aes-key');
      try {
        const exists = _asyncFs ? await _asyncFs.exists(keyFile) : fs.existsSync(keyFile);
        if (exists) {
          const raw = _asyncFs ? await _asyncFs.readFile(keyFile, 'utf8') : fs.readFileSync(keyFile, 'utf8');
          _aesKey = Buffer.from(raw.trim(), 'base64');
          console.log('[memory-encrypt] Loaded persisted AES key from memory/.aes-key');
          return _aesKey;
        }
        const newKey = crypto.randomBytes(32);
        if (_asyncFs) {
          await _asyncFs.writeFile(keyFile, newKey.toString('base64'));
        } else {
          fs.writeFileSync(keyFile, newKey.toString('base64'), { mode: 0o600 });
        }
        console.log('[memory-encrypt] Generated and persisted AES key to memory/.aes-key (0o600)');
        _aesKey = newKey;
        return _aesKey;
      } catch (e) {
        console.error('[memory-encrypt] Failed to persist AES key:', e.message, '— encryption disabled');
        return null;
      }
    }

    try {
      _aesKey = Buffer.from(envKey, 'base64');
      if (_aesKey.length !== AES_CONFIG.keyLength) {
        console.warn('[memory-encrypt] HEARTFLOW_AES_KEY is not 32 bytes (base64). Plaintext mode.');
        _aesKey = null;
        return null;
      }
      return _aesKey;
    } catch (e) {
      console.warn('[memory-encrypt] Failed to decode HEARTFLOW_AES_KEY:', e.message);
      _aesKey = null;
      return null;
    }
  })().then(k => { _aesKey = k; _aesKeyResolved = true; _keyPromise = null; return k; })
    .catch(e => { _keyPromise = null; _aesKeyResolved = false; throw e; });
}

function _resolveKeyFromEnvSync() {
  const envKey = process.env.HEARTFLOW_AES_KEY;
  if (!envKey) return null;
  try {
    const k = Buffer.from(envKey, 'base64');
    if (k.length !== AES_CONFIG.keyLength) return null;
    _aesKey = k;
    _aesKeyResolved = true;
    return k;
  } catch {
    return null;
  }
}

function _resolveKeyFromEnvAsync() {
  const envKey = process.env.HEARTFLOW_AES_KEY;
  if (!envKey) return Promise.resolve(null);
  try {
    const k = Buffer.from(envKey, 'base64');
    if (k.length !== AES_CONFIG.keyLength) return Promise.resolve(null);
    _aesKey = k;
    _aesKeyResolved = true;
    return Promise.resolve(k);
  } catch {
    return Promise.resolve(null);
  }
}

/**
 * Check if encryption is enabled and available.
 * Enabled when: HEARTFLOW_AES_KEY is set (and valid), OR HEARTFLOW_MEMORY_BANK_ENCRYPT=1
 * Actually encrypts only when key is valid.
 */
function isEncryptionEnabled() {
  if (_encryptionEnabled !== null) return _encryptionEnabled;

  const key = _getAesKeySync();
  if (key) {
    _encryptionEnabled = true;
    return true;
  }

  // [v6.0.53 M3] 接受 '1' 或 'true'（部署可能用布尔式写法），避免开关死代码
  const flag = process.env.HEARTFLOW_MEMORY_BANK_ENCRYPT;
  if (flag === '1' || flag === 'true') {
    _encryptionEnabled = true;
  } else {
    _encryptionEnabled = false;
  }

  return _encryptionEnabled;
}

async function isEncryptionEnabledAsync() {
  if (_encryptionEnabled !== null) return _encryptionEnabled;

  const key = await _getAesKeyAsync();
  if (key) {
    _encryptionEnabled = true;
    return true;
  }

  const flag = process.env.HEARTFLOW_MEMORY_BANK_ENCRYPT;
  if (flag === '1' || flag === 'true') {
    _encryptionEnabled = true;
  } else {
    _encryptionEnabled = false;
  }

  return _encryptionEnabled;
}

/**
 * Encrypt a JSON-serializable object using AES-256-GCM.
 * Returns the ciphertext as a string (JSON-wrapped payload).
 * If encryption is not available, returns plain JSON string.
 *
 * Output format (encrypted):
 *   {"_enc":"HEARTFLOW_v1","iv":"...","authTag":"...","data":"..."}
 *
 * @param {object} data - JSON-serializable object to encrypt
 * @returns {string} - JSON string (ciphertext wrapper or plain)
 */
function encryptJSON(data) {
  const key = _getAesKeySync();
  if (!key) {
    // 无密钥：明确标记为明文降级，decrypt 可识别，不冒充天然明文
    return JSON.stringify({ _enc: 'PLAINTEXT_FALLBACK', data }, null, 2);
  }

  try {
    const wrapper = _encryptPayload(data, key);
    return JSON.stringify(wrapper, null, 2);
  } catch (e) {
    // [v6.0.50 M1] 加密失败严禁无标记明文落盘：标记 + 抛错，由调用方决定降级策略
    console.warn('[memory-encrypt] Encryption failed:', e.message);
    throw new Error('[memory-encrypt] encryption failed, refusing silent plaintext fallback: ' + e.message);
  }
}

/**
 * Async encrypt: defers potential key-persistence IO via async adapter.
 * @param {object} data
 * @returns {Promise<string>}
 */
async function encryptJSONAsync(data) {
  const key = await _getAesKeyAsync();
  if (!key) {
    return JSON.stringify({ _enc: 'PLAINTEXT_FALLBACK', data }, null, 2);
  }

  try {
    const wrapper = _encryptPayload(data, key);
    return JSON.stringify(wrapper, null, 2);
  } catch (e) {
    console.warn('[memory-encrypt] Async encryption failed:', e.message);
    throw new Error('[memory-encrypt] async encryption failed, refusing silent plaintext fallback: ' + e.message);
  }
}

function _encryptPayload(data, key) {
  const iv = crypto.randomBytes(AES_CONFIG.ivLength);
  const cipher = crypto.createCipheriv(AES_CONFIG.algorithm, key, iv);

  const plaintext = JSON.stringify(data);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    _enc: 'HEARTFLOW_v1',
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: encrypted,
  };
}

/**
 * Decrypt a JSON string that may be encrypted.
 * Auto-detects the format:
 *   - If it's a HEARTFLOW_v1 wrapper → decrypt
 *   - If it's plain JSON → parse and return as-is
 *
 * @param {string} raw - Raw string from file
 * @returns {object} - Decrypted JavaScript object
 */
function decryptJSON(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('[memory-encrypt] Failed to parse file content:', e.message);
    return null;
  }

  if (parsed && parsed._enc === 'HEARTFLOW_v1') {
    const key = _getAesKeySync();
    if (!key) {
      throw new Error(
        '[memory-encrypt] Encrypted data detected but HEARTFLOW_AES_KEY is not set. ' +
        'Cannot decrypt memory-bank data. Set HEARTFLOW_AES_KEY to the same key used during encryption, ' +
        'or delete the encrypted data file to start fresh.'
      );
    }

    try {
      return _decryptPayload(parsed, key);
    } catch (e) {
      throw new Error(
        '[memory-encrypt] Decryption failed: ' + e.message + '. ' +
        'The HEARTFLOW_AES_KEY may have changed. If you changed keys, delete the ' +
        'encrypted data files to start fresh.'
      );
    }
  }

  // [v6.0.50 M1] 识别明文降级标记：返回内层 data，且让调用方可知这是降级明文（非天然明文）
  if (parsed && parsed._enc === 'PLAINTEXT_FALLBACK') {
    return parsed.data;
  }

  return parsed;
}

/**
 * Async decrypt.
 * @param {string} raw
 * @returns {Promise<object|null>}
 */
async function decryptJSONAsync(raw) {
  if (!raw || typeof raw !== 'string') return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('[memory-encrypt] Failed to parse file content:', e.message);
    return null;
  }

  if (parsed && parsed._enc === 'HEARTFLOW_v1') {
    const key = await _getAesKeyAsync();
    if (!key) {
      throw new Error(
        '[memory-encrypt] Encrypted data detected but HEARTFLOW_AES_KEY is not set. ' +
        'Cannot decrypt memory-bank data. Set HEARTFLOW_AES_KEY to the same key used during encryption, ' +
        'or delete the encrypted data file to start fresh.'
      );
    }

    try {
      return _decryptPayload(parsed, key);
    } catch (e) {
      throw new Error(
        '[memory-encrypt] Decryption failed: ' + e.message + '. ' +
        'The HEARTFLOW_AES_KEY may have changed. If you changed keys, delete the ' +
        'encrypted data files to start fresh.'
      );
    }
  }

  return parsed;
}

function _decryptPayload(parsed, key) {
  const decipher = crypto.createDecipheriv(
    AES_CONFIG.algorithm,
    key,
    Buffer.from(parsed.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(parsed.authTag, 'base64'));

  let decrypted = decipher.update(parsed.data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Rotate the AES key and re-encrypt all LEARNED layer .enc files.
 * This is an atomic operation: on failure, the old key is restored.
 *
 * Steps:
 *  1. Load current key
 *  2. Generate new key
 *  3. Back up current key to memory/.aes-key.bak
 *  4. Scan for all .enc files in LEARNED storage locations
 *  5. Decrypt with old key, encrypt with new key
 *  6. Persist new key as memory/.aes-key
 *  7. If any step fails, restore old key and roll back files
 *
 * @returns {Promise<{success: boolean, rotatedFiles: number, error?: string}>}
 */
async function rotateKey() {
  const fs = require('../utils/safe-fs');
  const path = require('path');
  const crypto = require('crypto');

  const rootDir = path.resolve(__dirname, '../..');
  const keyFile = path.join(rootDir, 'memory/.aes-key');
  const keyBak = path.join(rootDir, 'memory/.aes-key.bak');

  try {
    // 1. Load current key
    if (!fs.existsSync(keyFile)) {
      throw new Error('Current AES key file not found at: ' + keyFile);
    }
    const oldKeyRaw = fs.readFileSync(keyFile, 'utf8').trim();
    const oldKey = Buffer.from(oldKeyRaw, 'base64');
    if (oldKey.length !== AES_CONFIG.keyLength) {
      throw new Error('Current AES key has invalid length: ' + oldKey.length);
    }

    // 2. Generate new key
    const newKey = crypto.randomBytes(AES_CONFIG.keyLength);

    // 3. Scan all .enc files in LEARNED storage locations
    const encFiles = _scanEncFiles(rootDir);

    // 4. Decrypt with old key, encrypt with new key (in-memory first)
    const reencrypted = [];
    const rollbackMap = new Map(); // filePath -> oldContent
    let skippedFiles = 0;

    for (const filePath of encFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const firstLine = raw.split('\n')[0].trim();
      let parsedFirst;
      try { parsedFirst = JSON.parse(firstLine); } catch { parsedFirst = {}; }

      // Skip JSONL dialogue/dream format: encrypted with scrypt(dialogue_key, salt)
      // Cannot rotate without HEARTFLOW_DIALOGUE_KEY; leave as-is
      if (parsedFirst && parsedFirst.encrypted && !parsedFirst._enc) {
        skippedFiles++;
        continue;
      }

      const decrypted = decryptJSONWithKey(raw, oldKey);
      if (!decrypted) {
        // Try JSONL line-by-line decryption for files that may have multiple entries
        const lineDecrypted = decryptJSONLWithKey(raw, oldKey);
        if (!lineDecrypted) {
          throw new Error('Failed to decrypt: ' + filePath);
        }
        const encryptedContent = encryptJSONLWithKey(lineDecrypted, newKey);
        rollbackMap.set(filePath, raw);
        reencrypted.push({ filePath, content: encryptedContent, isJsonl: true });
        continue;
      }
      const encrypted = encryptJSONWithKey(decrypted, newKey);
      rollbackMap.set(filePath, raw);
      reencrypted.push({ filePath, content: encrypted, isJsonl: false });
    }

    // 5. Back up old key
    fs.writeFileSync(keyBak, oldKeyRaw, { mode: 0o600 });

    // 6. Atomically switch: write new key + overwrite files
    // First write the new key
    fs.writeFileSync(keyFile, newKey.toString('base64'), { mode: 0o600 });

    // Then overwrite .enc files
    for (const item of reencrypted) {
      fs.writeFileSync(item.filePath, item.content, { mode: 0o600 });
    }

    // 7. Verify we can decrypt with new key
    for (const item of reencrypted) {
      if (item.isJsonl) {
        const check = decryptJSONL(fs.readFileSync(item.filePath, 'utf8'));
        if (!check) {
          throw new Error('Post-rotation verification failed for JSONL: ' + item.filePath);
        }
      } else {
        const check = decryptJSON(fs.readFileSync(item.filePath, 'utf8'));
        if (!check) {
          throw new Error('Post-rotation verification failed for: ' + item.filePath);
        }
      }
    }

    // Success: remove backup
    if (fs.existsSync(keyBak)) fs.unlinkSync(keyBak);

    return { success: true, rotatedFiles: reencrypted.length };
  } catch (e) {
    // Rollback: restore old key
    if (fs.existsSync(keyBak)) {
      const bakRaw = fs.readFileSync(keyBak, 'utf8');
      fs.writeFileSync(keyFile, bakRaw, { mode: 0o600 });
      fs.unlinkSync(keyBak);
    }

    return { success: false, rotatedFiles: 0, error: e.message };
  }
}

/**
 * Re-encrypt all LEARNED layer .enc files with the current key.
 * Useful for refreshing file permissions or bulk re-encryption.
 *
 * @returns {Promise<{success: boolean, reencryptedFiles: number, error?: string}>}
 */
async function reencryptAll() {
  const fs = require('../utils/safe-fs');
  const path = require('path');

  try {
    const rootDir = path.resolve(__dirname, '../..');
    const encFiles = _scanEncFiles(rootDir);
    const key = _getAesKeySync();

    if (!key) {
      return { success: false, reencryptedFiles: 0, error: 'Encryption key not available' };
    }

    let count = 0;
    for (const filePath of encFiles) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const decrypted = decryptJSON(raw);
      if (!decrypted) continue;

      const encrypted = encryptJSONWithKey(decrypted, key);
      fs.writeFileSync(filePath, encrypted, { mode: 0o600 });
      count++;
    }

    return { success: true, reencryptedFiles: count };
  } catch (e) {
    return { success: false, reencryptedFiles: 0, error: e.message };
  }
}

/**
 * Scan project for all .enc files that belong to the LEARNED layer.
 * @param {string} rootDir
 * @returns {string[]}
 */
function _scanEncFiles(rootDir) {
  const fs = require('../utils/safe-fs');
  const path = require('path');

  const encFiles = [];
  const searchDirs = [
    path.join(rootDir, 'memory'),
    path.join(rootDir, 'data'),
    path.join(rootDir, 'data/longterm'),
  ];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      continue;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.enc')) {
        encFiles.push(path.join(dir, entry.name));
      }
    }
  }

  return encFiles;
}

/**
 * Decrypt JSON with a specific key (not the global state).
 */
function decryptJSONWithKey(raw, key) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return null;
  }

  if (!parsed || parsed._enc !== 'HEARTFLOW_v1' || !key) {
    return null;
  }

  try {
    const decipher = crypto.createDecipheriv(
      AES_CONFIG.algorithm,
      key,
      Buffer.from(parsed.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'base64'));

    let decrypted = decipher.update(parsed.data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

/**
 * Encrypt data with a specific key (not the global state).
 */
function encryptJSONWithKey(data, key) {
  try {
    const iv = crypto.randomBytes(AES_CONFIG.ivLength);
    const cipher = crypto.createCipheriv(AES_CONFIG.algorithm, key, iv);

    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    const wrapper = {
      _enc: 'HEARTFLOW_v1',
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      data: encrypted,
    };

    return JSON.stringify(wrapper, null, 2);
  } catch (e) {
    // [v6.0.54 R1] 显式密钥加密失败严禁静默明文回退（同 M1 原则）：抛错由调用方决定降级
    console.warn('[memory-encrypt] Encryption with explicit key failed:', e.message);
    throw new Error('[memory-encrypt] encryptJSONWithKey failed, refusing silent plaintext fallback: ' + e.message);
  }
}

module.exports = {
  encryptJSON,
  decryptJSON,
  encryptJSONAsync,
  decryptJSONAsync,
  isEncryptionEnabled,
  isEncryptionEnabledAsync,
  rotateKey,
  reencryptAll,
};