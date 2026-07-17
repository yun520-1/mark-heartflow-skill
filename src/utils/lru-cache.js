/**
 * Simple LRU (Least Recently Used) Cache.
 *
 * A drop-in replacement for Map with a configurable max size.
 * When the cache exceeds maxSize, the least recently accessed/inserted
 * entries are evicted first.
 *
 * API matches Map's most common methods:
 *   - get(key)         → value | undefined
 *   - set(key, value)  → this
 *   - has(key)         → boolean
 *   - delete(key)      → boolean
 *   - clear()          → void
 *   - size getter      → number
 *
 * @example
 *   const cache = new LRUCache(3);
 *   cache.set('a', 1);
 *   cache.set('b', 2);
 *   cache.set('c', 3);
 *   cache.set('d', 4); // evicts 'a'
 *   cache.get('a');     // undefined
 */

class LRUCache {
  /**
   * @param {number} maxSize - Maximum number of entries before eviction begins.
   */
  constructor(maxSize) {
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new Error('LRUCache: maxSize must be a positive integer');
    }
    this._maxSize = maxSize;
    this._map = new Map();
  }

  /**
   * Retrieve a value by key. Accessing a key marks it as recently used.
   * @param {*} key
   * @returns {*} The value, or undefined if not found.
   */
  get(key) {
    if (!this._map.has(key)) {
      return undefined;
    }
    // Move to end (most recently used) by deleting and re-inserting.
    const value = this._map.get(key);
    this._map.delete(key);
    this._map.set(key, value);
    return value;
  }

  /**
   * Insert or update a key-value pair. If the cache exceeds maxSize, the
   * least recently used entry is evicted.
   * @param {*} key
   * @param {*} value
   * @returns {LRUCache} this
   */
  set(key, value) {
    if (this._map.has(key)) {
      this._map.delete(key);
    } else if (this._map.size >= this._maxSize) {
      // Evict the oldest entry (first key in insertion order).
      const oldestKey = this._map.keys().next().value;
      this._map.delete(oldestKey);
    }
    this._map.set(key, value);
    return this;
  }

  /**
   * Check whether a key exists in the cache. Does NOT affect recency.
   * @param {*} key
   * @returns {boolean}
   */
  has(key) {
    return this._map.has(key);
  }

  /**
   * Delete a key from the cache.
   * @param {*} key
   * @returns {boolean} true if the key was found and deleted.
   */
  delete(key) {
    return this._map.delete(key);
  }

  /**
   * Remove all entries.
   */
  clear() {
    this._map.clear();
  }

  /**
   * Number of entries currently in the cache.
   * @returns {number}
   */
  get size() {
    return this._map.size;
  }

  entries() {
    return this._map.entries();
  }

  keys() {
    return this._map.keys();
  }

  values() {
    return this._map.values();
  }

  forEach(callback, thisArg) {
    this._map.forEach(callback, thisArg);
  }

  [Symbol.iterator]() {
    return this._map[Symbol.iterator]();
  }
}

module.exports = { LRUCache };