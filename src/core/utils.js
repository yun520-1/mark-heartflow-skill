/**
 * HeartFlow Core Utilities — 吸收 agentmemory 核心工具函数
 * 
 * 整合来源：agentmemory 记忆系统核心工具
 * 
 * 功能清单：
 * 1. generateId(prefix)       - 内容寻址ID，格式：{prefix}_{timestamp}_{uuid}
 * 2. fingerprintId(content)   - SHA256哈希用于去重
 * 3. jaccardSimilarity(a, b)  - Jaccard相似度 >0.7 = 覆盖旧记忆
 * 4. stripPrivateData(input)  - 隐私剥离（API keys/passwords/tokens/repo URLs）
 * 5. countTokens(text)        - Token计数（简单空格分词）
 * 6. withKeyedLock(key, fn)   - Per-key互斥锁（用于并发写入）
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. generateId - 内容寻址ID生成器
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 生成唯一内容寻址ID
 * 格式：{prefix}_{timestamp}_{uuid}
 * 
 * @param {string} prefix - ID前缀，如 'mem', 'core', 'eph', 'lrnd'
 * @returns {string} 唯一ID
 * 
 * @example
 * generateId('mem')     // 'mem-1716638400000-a1b2c3d4'
 * generateId('core')    // 'core-1716638400001-e5f6g7h8'
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const uuid = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${uuid}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. fingerprintId - SHA256内容指纹（去重）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 生成内容SHA256哈希指纹，用于去重检测
 * 
 * @param {string|object} content - 要哈希的内容（会自动JSON.stringify对象）
 * @returns {string} 64字符SHA256十六进制哈希
 * 
 * @example
 * fingerprintId('hello world')  // 'b94d27b9934d3e08a...'
 * fingerprintId({a: 1, b: 2})    // 基于JSON序列化后的哈希
 */
function fingerprintId(content) {
  const data = typeof content === 'string' ? content : JSON.stringify(content);
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * 批量生成指纹集合（用于快速去重判断）
 * @param {Array<string>} contents - 内容数组
 * @returns {Set<string>} 指纹集合
 */
function fingerprintSet(contents) {
  return new Set(contents.map(fingerprintId));
}

/**
 * 检查内容是否重复
 * @param {string|object} content - 待检测内容
 * @param {Set<string>} existingSet - 已存在指纹集合
 * @returns {boolean} true=重复，false=新内容
 */
function isDuplicate(content, existingSet) {
  return existingSet.has(fingerprintId(content));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. jaccardSimilarity - Jaccard相似度（记忆覆盖判断）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 计算两个文本的Jaccard相似度
 * 原理：交集/并集，基于词集合
 * 
 * @param {string} a - 文本A
 * @param {string} b - 文本B
 * @returns {number} 相似度 [0, 1]，>0.7 表示高度相似（应覆盖旧记忆）
 * 
 * @example
 * jaccardSimilarity('hello world', 'hello world')  // 1.0
 * jaccardSimilarity('hello world', 'hello there')   // ~0.67
 * jaccardSimilarity('foo bar', 'baz qux')           // 0.0
 */
function jaccardSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  // 计算交集
  const intersection = new Set();
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection.add(token);
    }
  }

  // 计算并集
  const union = new Set(tokensA);
  for (const token of tokensB) {
    union.add(token);
  }

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * 简单分词器（空格分割，转小写）
 * @param {string} text - 原始文本
 * @returns {Array<string>} 词汇数组
 */
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase().split(/\s+/).filter(t => t.length > 0);
}

/**
 * 检查新记忆是否应覆盖旧记忆
 * 阈值：Jaccard > 0.7
 * 
 * @param {string} newContent - 新内容
 * @param {string} oldContent - 旧内容
 * @param {number} threshold - 覆盖阈值，默认0.7
 * @returns {boolean} true=应覆盖
 */
function shouldOverwrite(newContent, oldContent, threshold = 0.7) {
  return jaccardSimilarity(newContent, oldContent) > threshold;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. stripPrivateData - 隐私数据剥离
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 剥离隐私敏感信息
 * 支持：API keys, passwords, tokens, repository URLs, 邮箱, IP等
 * 
 * @param {string|object} input - 输入内容（会自动stringify再处理）
 * @returns {string} 隐私剥离后的安全字符串
 * 
 * @example
 * stripPrivateData('api_key=sk-abc123xyz')  
 * // 'api_key=[REDACTED]'
 * 
 * stripPrivateData('Bearer eyJhbGciOiJIUzI1NiIs...')
 * // 'Bearer [REDACTED_TOKEN]'
 */
function stripPrivateData(input) {
  const text = typeof input === 'string' ? input : JSON.stringify(input);

  const patterns = [
    // API Keys / Tokens
    { regex: /(?:api[_-]?key|apikey|api[_-]?secret|api[_-]?token)["\s:=]+([a-zA-Z0-9_\-]{16,})/gi, replacement: '$1=[REDACTED_API_KEY]' },
    { regex: /(?:bearer|token|auth)["\s:=]+\s*([a-zA-Z0-9_\-\.]{20,})/gi, replacement: '$1=[REDACTED_TOKEN]' },
    { regex: /(sk|pk|api)_[a-zA-Z0-9]{20,}/g, replacement: '$1=[REDACTED_KEY]' },
    { regex: /\b[a-zA-Z0-9]{40,64}\b(?=\s|$|,|"|')/g, replacement: '[REDACTED_HASH]' },

    // Passwords
    { regex: /(?:password|passwd|pwd|secret)["\s:=]+\s*([^\s,"']{4,})/gi, replacement: '$1=[REDACTED_PWD]' },
    { regex: /(?<==)([^\s,"']{4,})(?=\s*$(?:\n|$))/gm, replacement: '[REDACTED_VALUE]' },

    // Git / Repo URLs (剥离token)
    { regex: /https?:\/\/[^:]+:[^@]+@(github|gitlab|bitbucket)\.com\//gi, replacement: 'https://$1.com/' },
    { regex: /git@[^:]+:[^@]+@/gi, replacement: 'git@' },

    // Email
    { regex: /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, replacement: '[EMAIL_REDACTED]' },

    // IP Addresses
    { regex: /\b(\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP_REDACTED]' },

    // Private Keys
    { regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, replacement: '[PRIVATE_KEY_REDACTED]' },

    // AWS Keys
    { regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/g, replacement: '[AWS_ACCESS_KEY_REDACTED]' },

    // Connection strings with credentials
    { regex: /(mongodb|postgres|mysql|redis):\/\/[^@]+@/g, replacement: '$1://[CREDENTIALS_REDACTED]@' },
  ];

  let result = text;
  for (const { regex, replacement } of patterns) {
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * 深度剥离对象中的隐私字段
 * 
 * @param {object} obj - 待处理对象
 * @param {Array<string>} sensitiveKeys - 额外敏感字段名
 * @returns {object} 深度副本（不修改原对象）
 */
function stripPrivateObject(obj, sensitiveKeys = []) {
  const defaultSensitive = ['password', 'token', 'secret', 'key', 'api_key', 'apikey', 'auth', 'credentials', 'private'];
  const allSensitive = [...new Set([...defaultSensitive, ...sensitiveKeys])];

  function redact(value) {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return stripPrivateData(value);
    if (Array.isArray(value)) return value.map(redact);
    if (typeof value === 'object') {
      const result = {};
      for (const [k, v] of Object.entries(value)) {
        const lowerKey = k.toLowerCase();
        const isSensitive = allSensitive.some(sk => lowerKey.includes(sk.toLowerCase()));
        result[k] = isSensitive ? '[REDACTED]' : redact(v);
      }
      return result;
    }
    return value;
  }

  return redact(obj);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. countTokens - Token计数（简单实现）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 简单Token计数（空格分词）
 * 注意：这是粗略估算，实际token数取决于具体tokenizer
 * 
 * @param {string} text - 输入文本
 * @returns {number} 估算token数
 * 
 * @example
 * countTokens('hello world')  // 2
 * countTokens('hello  world') // 2 (多个空格合并)
 */
function countTokens(text) {
  if (!text || typeof text !== 'string') return 0;
  const tokens = text.trim().split(/\s+/).filter(t => t.length > 0);
  return tokens.length;
}

/**
 * 按字符数估算token（平均每4字符≈1 token）
 * 用于估算API成本或上下文长度
 * 
 * @param {string} text - 输入文本
 * @returns {number} 估算token数
 */
function estimateTokens(text) {
  if (!text) return 0;
  // 经验公式：平均每4个字符约1个token
  return Math.ceil(text.length / 4);
}

/**
 * 检查文本是否超过token限制
 * 
 * @param {string} text - 输入文本
 * @param {number} limit - 限制数量
 * @returns {boolean} true=超过限制
 */
function exceedsTokenLimit(text, limit) {
  return countTokens(text) > limit;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. withKeyedLock - Per-key互斥锁
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Per-key互斥锁管理器
 * 用于保护对同一资源的并发写入
 * 
 * @example
 * const lock = createKeyedLock();
 * 
 * await lock.withKey('memory:123', async () => {
 *   // 同一key的并发调用会排队等待
 *   await saveMemory('123', data);
 * });
 */
class KeyedLock {
  constructor() {
    /** @type {Map<string, Promise<void>>} */
    this._locks = new Map();
    this._debug = process.env.DEBUG_LOCKS === 'true';
  }

  /**
   * 获取锁状态（调试用）
   */
  getStatus() {
    return {
      lockedKeys: Array.from(this._locks.keys()),
      lockCount: this._locks.size
    };
  }

  /**
   * 执行带锁的操作
   * 同一key的并发调用会自动排队
   * 
   * @param {string} key - 资源标识
   * @param {Function} fn - 异步操作函数
   * @returns {Promise<any>} fn的返回值
   */
  async withKeyedLock(key, fn) {
    // 如果已有锁，等待它释放
    while (this._locks.has(key)) {
      try {
        await this._locks.get(key);
      } catch {
        // 锁已释放，继续执行
      }
    }

    // 创建新锁
    const lockPromise = this._doExecute(key, fn);
    this._locks.set(key, lockPromise);

    try {
      return await lockPromise;
    } finally {
      // 执行完毕，移除锁
      if (this._locks.get(key) === lockPromise) {
        this._locks.delete(key);
      }
    }
  }

  /**
   * 内部执行（捕获错误）
   */
  async _doExecute(key, fn) {
    try {
      return await fn();
    } catch (error) {
      if (this._debug) {
        console.error(`[KeyedLock] Error in lock ${key}:`, error.message);
      }
      throw error;
    }
  }

  /**
   * 检查key是否被锁定
   * @param {string} key 
   * @returns {boolean}
   */
  isLocked(key) {
    return this._locks.has(key);
  }

  /**
   * 强制解锁（用于错误恢复）
   * @param {string} key 
   */
  forceUnlock(key) {
    this._locks.delete(key);
  }

  /**
   * 清理所有锁
   */
  clearAll() {
    this._locks.clear();
  }
}

/**
 * 创建新的KeyedLock实例（工厂函数）
 * @returns {KeyedLock}
 */
function createKeyedLock() {
  return new KeyedLock();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 原子写入工具（辅助函数）
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 原子写入JSON文件：写入临时文件再rename
 * 保证写入完整性（POSIX系统）
 * 
 * @param {string} filePath - 目标文件路径
 * @param {object} data - 要写入的数据
 */
function atomicWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = filePath + '.tmp.' + Date.now() + '.' + crypto.randomBytes(4).toString('hex');
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // ID生成
  generateId,
  
  // 指纹/去重
  fingerprintId,
  fingerprintSet,
  isDuplicate,
  
  // Jaccard相似度
  jaccardSimilarity,
  tokenize,
  shouldOverwrite,
  
  // 隐私剥离
  stripPrivateData,
  stripPrivateObject,
  
  // Token计数
  countTokens,
  estimateTokens,
  exceedsTokenLimit,
  
  // Per-key锁
  KeyedLock,
  createKeyedLock,
  
  // 原子写入
  atomicWriteJson,
};
