/**
 * HeartFlow v5.8.2 — 单元测试：记忆缓存层
 * 
 * 测试目标: src/utils/memory-cache.js
 */

const { MemoryCache } = require('../../src/src/utils/memory-cache.js');
const assert = require('assert');

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({ maxSize: 10, ttl: 1000 });  // 1秒过期
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultCache = new MemoryCache();
      assert.strictEqual(defaultCache.maxSize, 1000);
      assert.strictEqual(defaultCache.ttl, 5 * 60 * 1000);
    });

    it('should initialize with custom options', () => {
      assert.strictEqual(cache.maxSize, 10);
      assert.strictEqual(cache.ttl, 1000);
    });
  });

  describe('generateKey', () => {
    it('should generate unique keys for different params', () => {
      const key1 = cache.generateKey('test', 'param1');
      const key2 = cache.generateKey('test', 'param2');

      assert.notStrictEqual(key1, key2);
    });

    it('should generate same key for same params', () => {
      const key1 = cache.generateKey('test', 'param1');
      const key2 = cache.generateKey('test', 'param1');

      assert.strictEqual(key1, key2);
    });

    it('should handle object params', () => {
      const key = cache.generateKey('test', { a: 1, b: 2 });
      assert(typeof key === 'string');
      assert(key.includes('test:'));
    });
  });

  describe('get and set', () => {
    it('should set and get cached value', () => {
      cache.set('key1', 'value1');
      const value = cache.get('key1');

      assert.strictEqual(value, 'value1');
    });

    it('should return null for missing key', () => {
      const value = cache.get('missing');
      assert.strictEqual(value, null);
    });

    it('should expire cached value after TTL', async () => {
      cache.set('key1', 'value1');
      
      await new Promise(resolve => setTimeout(resolve, 1500));  // 等待1.5秒

      const value = cache.get('key1');
      assert.strictEqual(value, null);
    });

    it('should update lastAccessed on get', () => {
      cache.set('key1', 'value1');
      
      const item = cache.cache.get('key1');
      const initialLastAccessed = item.lastAccessed;
      
      // 等待一小段时间
      return new Promise(resolve => {
        setTimeout(() => {
          cache.get('key1');
          const updatedLastAccessed = item.lastAccessed;
          assert(updatedLastAccessed > initialLastAccessed);
          resolve();
        }, 100);
      });
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when exceeding maxSize', () => {
      // 填充缓存
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      assert.strictEqual(cache.cache.size, 10);

      // 添加第11个，应该淘汰 key0
      cache.set('key10', 'value10');

      assert.strictEqual(cache.cache.size, 10);
      assert.strictEqual(cache.get('key0'), null);  // key0 应该被淘汰
    });

    it('should update LRU order on get', async () => {
      // 填充缓存
      for (let i = 0; i < 10; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      // 访问 key0，让它变成最近使用
      cache.get('key0');

      // 添加新键，应该淘汰 key1（而不是 key0）
      cache.set('key10', 'value10');

      assert.strictEqual(cache.get('key0'), 'value0');  // key0 应该还在
      assert.strictEqual(cache.get('key1'), null);   // key1 应该被淘汰
    });
  });

  describe('delete and clear', () => {
    it('should delete cached value', () => {
      cache.set('key1', 'value1');
      const result = cache.delete('key1');

      assert.strictEqual(result, true);
      assert.strictEqual(cache.get('key1'), null);
    });

    it('should return false when deleting missing key', () => {
      const result = cache.delete('missing');
      assert.strictEqual(result, false);
    });

    it('should clear all cached values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const cleared = cache.clear();

      assert.strictEqual(cleared, 2);
      assert.strictEqual(cache.cache.size, 0);
    });
  });

  describe('statistics', () => {
    it('should track cache hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');  // 命中
      cache.get('key1');  // 命中

      assert.strictEqual(cache.stats.hits, 2);
    });

    it('should track cache misses', () => {
      cache.get('missing');  // 未命中

      assert.strictEqual(cache.stats.misses, 1);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1');  // 命中
      cache.get('missing');  // 未命中

      assert.strictEqual(cache.getHitRate(), 0.5);
    });

    it('should return 0 hit rate when no requests', () => {
      assert.strictEqual(cache.getHitRate(), 0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired items', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2', 500);  // 500ms 过期

      await new Promise(resolve => setTimeout(resolve, 1000));  // 等待1秒

      const cleaned = cache.cleanup();

      assert.strictEqual(cleaned, 2);
      assert.strictEqual(cache.cache.size, 0);
    });
  });

  describe('preheat', () => {
    it('should preload cache with items', () => {
      const items = [
        { key: 'key1', value: 'value1', ttl: 10000 },
        { key: 'key2', value: 'value2', ttl: 10000 }
      ];

      const preheated = cache.preheat(items);

      assert.strictEqual(preheated, 2);
      assert.strictEqual(cache.get('key1'), 'value1');
      assert.strictEqual(cache.get('key2'), 'value2');
    });

    it('should not exceed maxSize when preheating', () => {
      const items = [];
      for (let i = 0; i < 20; i++) {
        items.push({ key: `key${i}`, value: `value${i}` });
      }

      const preheated = cache.preheat(items);

      assert.strictEqual(preheated, 10);
      assert.strictEqual(cache.cache.size, 10);
    });
  });
});
