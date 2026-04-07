/**
 * HeartFlow Universal Cache Layer | 通用缓存层
 * Version: v7.0.0-ASCENSION
 * 
 * Caching strategy for all dimensional computations.
 * 所有维度计算的缓存策略。
 * 
 * Key Principles:
 * - TTL-based expiration (time-to-live)
 * - LRU eviction (least recently used)
 * - Dimension-specific strategies
 * - Cache invalidation on state change
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS | 类型定义
// ═══════════════════════════════════════════════════════════════

/**
 * Cache Entry | 缓存条目
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;          // Time-to-live in ms
  hits: number;         // Access count
  lastAccess: number;
  key: string;
}

/**
 * Cache Statistics | 缓存统计
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  avgAge: number;
}

/**
 * Cache Configuration | 缓存配置
 */
export interface CacheConfig {
  maxSize: number;      // Maximum entries
  defaultTTL: number;   // Default TTL in ms
  cleanupInterval: number;  // Cleanup interval in ms
}

/**
 * Dimension-Specific Cache Config | 维度特定缓存配置
 */
export interface DimensionalCacheConfig {
  // D1: Awareness (fast decay)
  awareness: { ttl: number };    // 60s
  
  // D2: Reflection (medium decay)
  reflection: { ttl: number };   // 300s
  
  // D3: No-Self (slow decay)
  noSelf: { ttl: number };       // 1800s
  
  // D4: Other Shore (very slow)
  otherShore: { ttl: number };   // 3600s
  
  // D5: Wisdom (session-based)
  wisdom: { ttl: 'session' | number };
  
  // D6: Sage (persistent)
  sage: { ttl: 'persistent' };
}

// ═══════════════════════════════════════════════════════════════
// UNIVERSAL CACHE | 通用缓存
// ═══════════════════════════════════════════════════════════════

/**
 * Universal Cache with TTL and LRU Eviction
 * 带 TTL 和 LRU 驱逐的通用缓存
 */
export class UniversalCache<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };
  private cleanupTimer: NodeJS.Timeout | null;
  
  constructor(config?: Partial<CacheConfig>) {
    super();
    
    this.cache = new Map();
    
    this.config = {
      maxSize: config?.maxSize ?? 1000,
      defaultTTL: config?.defaultTTL ?? 300000,  // 5 minutes
      cleanupInterval: config?.cleanupInterval ?? 60000  // 1 minute
    };
    
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    
    // Start cleanup timer
    this.startCleanup();
  }
  
  // ═══════════════════════════════════════════════════════════
  // CORE OPERATIONS | 核心操作
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get or Compute
   * 获取或计算
   * 
   * Returns cached value if available and not expired,
   * otherwise computes, caches, and returns.
   */
  async getOrCompute(
    key: string,
    compute: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get(key);
    
    if (cached !== undefined) {
      this.stats.hits++;
      this.emit('hit', { key, value: cached });
      return cached;
    }
    
    // Cache miss - compute
    this.stats.misses++;
    this.emit('miss', { key });
    
    const value = await compute();
    this.set(key, value, ttl);
    
    return value;
  }
  
  /**
   * Get Value
   * 获取值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check expiration
    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }
    
    // Update access info
    entry.hits++;
    entry.lastAccess = Date.now();
    
    return entry.value;
  }
  
  /**
   * Set Value
   * 设置值
   */
  set(key: string, value: T, ttl?: number): void {
    // Check if need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      hits: 0,
      lastAccess: Date.now(),
      key
    };
    
    this.cache.set(key, entry);
    this.emit('set', { key, value, ttl: entry.ttl });
  }
  
  /**
   * Delete Value
   * 删除值
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.emit('delete', { key });
    }
    
    return deleted;
  }
  
  /**
   * Clear Cache
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.emit('clear');
  }
  
  // ═══════════════════════════════════════════════════════════
  // CACHE MANAGEMENT | 缓存管理
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Check if Expired
   * 检查是否过期
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    // Persistent entries never expire
    if (entry.ttl === Infinity || entry.ttl === ('persistent' as any)) {
      return false;
    }
    
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl;
  }
  
  /**
   * Evict Least Recently Used
   * 驱逐最少使用
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < lruTime) {
        lruTime = entry.lastAccess;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
      this.emit('eviction', { key: lruKey });
    }
  }
  
  /**
   * Cleanup Expired Entries
   * 清理过期条目
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });
    
    if (toDelete.length > 0) {
      this.emit('cleanup', { count: toDelete.length, keys: toDelete });
    }
  }
  
  /**
   * Start Cleanup Timer
   * 启动清理定时器
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      this.config.cleanupInterval
    );
    
    // Cleanup on process exit
    process.on('exit', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
    });
  }
  
  // ═══════════════════════════════════════════════════════════
  // STATISTICS | 统计
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get Cache Statistics
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    
    const totalAge = entries.reduce(
      (sum, e) => sum + (Date.now() - e.timestamp),
      0
    );
    
    const hits = this.stats.hits;
    const misses = this.stats.misses;
    const total = hits + misses;
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0,
      evictions: this.stats.evictions,
      avgAge: entries.length > 0 ? totalAge / entries.length : 0
    };
  }
  
  /**
   * Reset Statistics
   * 重置统计
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }
  
  // ═══════════════════════════════════════════════════════════
  // DIMENSIONAL CACHE | 维度缓存
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Create Dimension-Specific Cache
   * 创建维度特定缓存
   */
  createDimensionalCache(config: DimensionalCacheConfig): DimensionalCache {
    return new DimensionalCache(this, config);
  }
  
  /**
   * Invalidate by Pattern
   * 按模式失效
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const toDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.delete(key));
  }
}

// ═══════════════════════════════════════════════════════════════
// DIMENSIONAL CACHE | 维度缓存
// ═══════════════════════════════════════════════════════════════

/**
 * Dimensional Cache Wrapper
 * 维度缓存包装器
 * 
 * Provides dimension-specific TTL and invalidation rules.
 */
export class DimensionalCache {
  private baseCache: UniversalCache;
  private config: DimensionalCacheConfig;
  
  constructor(baseCache: UniversalCache, config: DimensionalCacheConfig) {
    this.baseCache = baseCache;
    this.config = config;
  }
  
  // ═══════════════════════════════════════════════════════════
  // DIMENSION-SPECIFIC OPERATIONS | 维度特定操作
  // ═══════════════════════════════════════════════════════════
  
  /**
   * D1: Awareness Cache
   * D1: 觉察缓存 (60s TTL)
   */
  async getAwareness(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    return this.baseCache.getOrCompute(
      `d1:awareness:${key}`,
      compute,
      this.config.awareness.ttl
    );
  }
  
  /**
   * D2: Reflection Cache
   * D2: 自省缓存 (300s TTL)
   */
  async getReflection(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    return this.baseCache.getOrCompute(
      `d2:reflection:${key}`,
      compute,
      this.config.reflection.ttl
    );
  }
  
  /**
   * D3: No-Self Cache
   * D3: 无我缓存 (1800s TTL)
   */
  async getNoSelf(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    return this.baseCache.getOrCompute(
      `d3:noself:${key}`,
      compute,
      this.config.noSelf.ttl
    );
  }
  
  /**
   * D4: Other Shore Cache
   * D4: 彼岸缓存 (3600s TTL)
   */
  async getOtherShore(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    return this.baseCache.getOrCompute(
      `d4:othershore:${key}`,
      compute,
      this.config.otherShore.ttl
    );
  }
  
  /**
   * D5: Wisdom Cache
   * D5: 般若缓存 (session TTL)
   */
  async getWisdom(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    const ttl = this.config.wisdom.ttl === 'session' 
      ? Infinity 
      : this.config.wisdom.ttl;
    
    return this.baseCache.getOrCompute(
      `d5:wisdom:${key}`,
      compute,
      ttl
    );
  }
  
  /**
   * D6: Sage Cache
   * D6: 圣人缓存 (persistent)
   */
  async getSage(
    key: string,
    compute: () => Promise<any>
  ): Promise<any> {
    return this.baseCache.getOrCompute(
      `d6:sage:${key}`,
      compute,
      Infinity
    );
  }
  
  // ═══════════════════════════════════════════════════════════
  // INVALIDATION | 失效
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Invalidate Dimension
   * 失效维度
   */
  invalidateDimension(dimension: 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6'): void {
    this.baseCache.invalidatePattern(`^${dimension}:`);
  }
  
  /**
   * Invalidate All
   * 失效所有
   */
  invalidateAll(): void {
    this.baseCache.clear();
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT | 导出
// ═══════════════════════════════════════════════════════════════

export default UniversalCache;
