/**
 * HeartFlow v5.8.2 — 集成测试：记忆系统端到端流程
 * 
 * 测试流程: 添加记忆 → 检索记忆 → 更新记忆 → 删除记忆
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 简化版记忆系统（用于测试）
class TestMemorySystem {
  constructor() {
    this.memories = new Map();
    this.nextId = 1;
  }

  async add(content, type = 'episodic') {
    const id = `mem_${Date.now()}_${this.nextId++}`;
    const memory = {
      id,
      content,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.memories.set(id, memory);
    return memory;
  }

  async get(id) {
    return this.memories.get(id) || null;
  }

  async update(id, updates) {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory ${id} not found`);
    }

    Object.assign(memory, updates, { updatedAt: new Date().toISOString() });
    this.memories.set(id, memory);
    return memory;
  }

  async delete(id) {
    return this.memories.delete(id);
  }

  async search(query) {
    const results = [];
    for (const [id, memory] of this.memories) {
      if (memory.content.includes(query)) {
        results.push(memory);
      }
    }
    return results;
  }

  async clear() {
    this.memories.clear();
    this.nextId = 1;
  }
}

describe('Memory System Integration Test', () => {
  let memorySystem;

  beforeEach(async () => {
    memorySystem = new TestMemorySystem();
  });

  afterEach(async () => {
    await memorySystem.clear();
  });

  describe('complete workflow', () => {
    it('should add, retrieve, update, and delete a memory', async () => {
      // 1. 添加记忆
      const added = await memorySystem.add('HeartFlow 是一个 AI 认知引擎', 'semantic');
      assert(added.id);
      assert.strictEqual(added.content, 'HeartFlow 是一个 AI 认知引擎');
      assert.strictEqual(added.type, 'semantic');

      // 2. 检索记忆
      const retrieved = await memorySystem.get(added.id);
      assert.strictEqual(retrieved.id, added.id);
      assert.strictEqual(retrieved.content, added.content);

      // 3. 更新记忆
      const updated = await memorySystem.update(added.id, {
        content: 'HeartFlow 是一个开源的 AI 认知引擎',
        type: 'semantic'
      });
      assert.strictEqual(updated.content, 'HeartFlow 是一个开源的 AI 认知引擎');
      assert(updated.updatedAt !== added.updatedAt);

      // 4. 搜索记忆
      const searchResults = await memorySystem.search('开源');
      assert.strictEqual(searchResults.length, 1);
      assert.strictEqual(searchResults[0].id, added.id);

      // 5. 删除记忆
      const deleted = await memorySystem.delete(added.id);
      assert.strictEqual(deleted, true);

      // 6. 验证删除
      const retrievedAfterDelete = await memorySystem.get(added.id);
      assert.strictEqual(retrievedAfterDelete, null);
    });

    it('should handle multiple memories', async () => {
      // 添加多个记忆
      const mem1 = await memorySystem.add('AI 认知引擎', 'concept');
      const mem2 = await memorySystem.add('HeartFlow 核心模块', 'concept');
      const mem3 = await memorySystem.add('决策路由', 'concept');

      // 搜索
      const results = await memorySystem.search('认知');
      assert(results.length >= 1);

      // 批量删除
      await memorySystem.delete(mem1.id);
      await memorySystem.delete(mem2.id);
      await memorySystem.delete(mem3.id);

      const searchAfterDelete = await memorySystem.search('认知');
      assert.strictEqual(searchAfterDelete.length, 0);
    });

    it('should handle non-existent memory', async () => {
      const retrieved = await memorySystem.get('mem_nonexistent');
      assert.strictEqual(retrieved, null);

      try {
        await memorySystem.update('mem_nonexistent', { content: 'test' });
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error.message.includes('not found'));
      }

      const deleted = await memorySystem.delete('mem_nonexistent');
      assert.strictEqual(deleted, false);
    });
  });

  describe('performance', () => {
    it('should add 100 memories within 1 second', async () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        await memorySystem.add(`Memory ${i}`, 'test');
      }

      const elapsed = Date.now() - start;
      assert(elapsed < 1000, `Took ${elapsed}ms, should be < 1000ms`);
    });

    it('should search memories efficiently', async () => {
      // 添加测试数据
      for (let i = 0; i < 100; i++) {
        await memorySystem.add(`Test memory ${i}`, 'test');
      }
      await memorySystem.add('Special memory for search', 'test');

      const start = Date.now();
      const results = await memorySystem.search('Special');
      const elapsed = Date.now() - start;

      assert.strictEqual(results.length, 1);
      assert(elapsed < 100, `Search took ${elapsed}ms, should be < 100ms`);
    });
  });
});
