/**
 * HeartFlow v5.8.1 — 记忆缓存层（减少 LLM 重复调用）
 * 
 * 来源: Node.js Best Practices (caching best practices)
 * 功能: LRU 缓存、TTL 过期、缓存命中统计
 */

class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();  // key → { value, expiresAt, lastAccessed, accessCount }
    this.maxSize = options.maxSize || 1000;  // 最大缓存条目
    this.ttl = options.ttl || 5 * 60 * 1000;  // 5分钟过期（毫秒）
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix, params) {
    // 基于参数生成唯一键
    const paramStr = typeof params === 'string' ? params : JSON.stringify(params);
    const hash = this.simpleHash(paramStr);
    return `${prefix}:${hash}`;
  }

  /**
   * 简单哈希函数
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;  // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 获取缓存
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // 检查过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }
    
    // LRU：更新访问时间和访问次数
    item.lastAccessed = Date.now();
    item.accessCount = (item.accessCount || 0) + 1;
    
    this.stats.hits++;
    
    return item.value;
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl = this.ttl) {
    // 如果超出最大大小，淘汰最久未访问的
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      accessCount: 0,
      createdAt: Date.now()
    });

    this.stats.sets++;
  }

  /**
   * 淘汰 LRU 条目
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.deletes++;
    }
  }

  /**
   * 删除缓存
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * 清空缓存
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    return size;
  }

  /**
   * 获取缓存命中率
   */
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total).toFixed(2);
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.getHitRate(),
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * 获取所有缓存键
   */
  getKeys() {
    const now = Date.now();
    const validKeys = [];

    for (const [key, item] of this.cache) {
      if (now <= item.expiresAt) {
        validKeys.push(key);
      }
    }

    return validKeys;
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.stats.deletes += cleaned;
    return cleaned;
  }

  /**
   * 预热缓存（批量设置）
   */
  preheat(items) {
    /*
      items = [
        { key: '...', value: '...', ttl: 300000 },
        ...
      ]
    */
    let preheated = 0;

    for (const item of items) {
      if (this.cache.size < this.maxSize) {
        this.set(item.key, item.value, item.ttl);
        preheated++;
      }
    }

    return preheated;
  }
}

/**
 * 创建预配置的缓存
 */
function createCache(options) {
  return new MemoryCache(options);
}

/**
 * 默认缓存（全局复用）
 */
let defaultCache = null;

function getDefaultCache() {
  if (!defaultCache) {
    defaultCache = new MemoryCache({
      maxSize: 1000,
      ttl: 5 * 60 * 1000  // 5分钟
    });
  }
  return defaultCache;
}

module.exports = { MemoryCache, createCache, getDefaultCache };
