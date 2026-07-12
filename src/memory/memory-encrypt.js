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

const AES_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  authTagLength: 16,
};

let _aesKey = null;
let _aesKeyResolved = false; // true once we've tried to resolve the key
let _encryptionEnabled = null;

/**
 * Resolve the AES key from environment.
 * Returns Buffer if key is set, or null if not available.
 */
function _getAesKey() {
  if (_aesKeyResolved) return _aesKey;

  _aesKeyResolved = true;

  const envKey = process.env.HEARTFLOW_AES_KEY;
  if (!envKey) {
    // Check if explicitly requested
    if (process.env.HEARTFLOW_MEMORY_BANK_ENCRYPT === '1') {
      console.warn('[memory-encrypt] HEARTFLOW_MEMORY_BANK_ENCRYPT=1 but HEARTFLOW_AES_KEY is not set. Writing plaintext.');
    }
    return null;
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

/**
 * Check if encryption is enabled and available.
 * Enabled when: HEARTFLOW_AES_KEY is set (and valid), OR HEARTFLOW_MEMORY_BANK_ENCRYPT=1
 * Actually encrypts only when key is valid.
 */
function isEncryptionEnabled() {
  if (_encryptionEnabled !== null) return _encryptionEnabled;

  const key = _getAesKey();
  if (key) {
    _encryptionEnabled = true;
    return true;
  }

  if (process.env.HEARTFLOW_MEMORY_BANK_ENCRYPT === '1') {
    // Explicitly requested but no key — warn once
    _encryptionEnabled = false;
  } else {
    _encryptionEnabled = false;
  }

  return false;
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
  const key = _getAesKey();
  if (!key) {
    // No key available — return plain JSON
    return JSON.stringify(data, null, 2);
  }

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
    console.warn('[memory-encrypt] Encryption failed, falling back to plaintext:', e.message);
    return JSON.stringify(data, null, 2);
  }
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
    // Not valid JSON, can't decrypt
    console.warn('[memory-encrypt] Failed to parse file content:', e.message);
    return null;
  }

  // Auto-detect: is this encrypted?
  if (parsed && parsed._enc === 'HEARTFLOW_v1') {
    const key = _getAesKey();
    if (!key) {
      throw new Error(
        '[memory-encrypt] Encrypted data detected but HEARTFLOW_AES_KEY is not set. ' +
        'Cannot decrypt memory-bank data. Set HEARTFLOW_AES_KEY to the same key used during encryption, ' +
        'or delete the encrypted data file to start fresh.'
      );
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
      throw new Error(
        '[memory-encrypt] Decryption failed: ' + e.message + '. ' +
        'The HEARTFLOW_AES_KEY may have changed. If you changed keys, delete the ' +
        'encrypted data files to start fresh.'
      );
    }
  }

  // Plain JSON — return as-is
  return parsed;
}

module.exports = {
  encryptJSON,
  decryptJSON,
  isEncryptionEnabled,
};
