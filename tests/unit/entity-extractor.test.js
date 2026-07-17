/**
 * HeartFlow v5.8.2 — 单元测试：实体提取器
 * 
 * 测试目标: src/memory/entity-extractor.js
 */

const { EntityExtractor } = require('../../src/src/memory/entity-extractor.js');
const assert = require('assert');

// Mock LLM caller
function createMockLLMCaller(response) {
  return async (prompt) => {
    return response;
  };
}

describe('EntityExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new EntityExtractor();
    extractor.llm = { call: createMockLLMCaller('[]') };
  });

  describe('extractEntities', () => {
    it('should extract entities from conversation', async () => {
      const mockResponse = JSON.stringify([
        { entity: '苹果公司', type: '组织', confidence: 0.95, context: '用户提到喜欢苹果公司' }
      ]);
      extractor.llm.call = createMockLLMCaller(mockResponse);

      const messages = [
        { role: 'user', content: '我喜欢苹果公司' },
        { role: 'assistant', content: '苹果公司是一家科技公司' }
      ];

      const entities = await extractor.extractEntities(messages);

      assert(Array.isArray(entities));
      assert.strictEqual(entities.length, 1);
      assert.strictEqual(entities[0].entity, '苹果公司');
      assert.strictEqual(entities[0].type, '组织');
    });

    it('should handle empty messages', async () => {
      const entities = await extractor.extractEntities([]);
      assert(Array.isArray(entities));
      assert.strictEqual(entities.length, 0);
    });

    it('should handle LLM call failure', async () => {
      extractor.llm.call = async () => {
        throw new Error('LLM API error');
      };

      const entities = await extractor.extractEntities([{ role: 'user', content: 'test' }]);
      assert(Array.isArray(entities));
      assert.strictEqual(entities.length, 0);
    });

    it('should parse JSON response correctly', async () => {
      const mockResponse = JSON.stringify([
        { entity: 'AI', type: '概念', confidence: 0.9 },
        { entity: 'HeartFlow', type: '产品', confidence: 0.85 }
      ]);
      extractor.llm.call = createMockLLMCaller(mockResponse);

      const entities = await extractor.extractEntities([{ role: 'user', content: 'AI和HeartFlow' }]);

      assert.strictEqual(entities.length, 2);
      assert.strictEqual(entities[0].entity, 'AI');
      assert.strictEqual(entities[1].entity, 'HeartFlow');
    });
  });

  describe('extractAdditive', () => {
    it('should extract only new information', async () => {
      const mockResponse = JSON.stringify([
        { entity: '新实体', type: '概念', isNew: true, content: '新信息', confidence: 0.9 }
      ]);
      extractor.llm.call = createMockLLMCaller(mockResponse);

      const newMessage = { role: 'user', content: '这是新信息' };
      const existingMemories = [{ content: '旧信息' }];

      const newEntities = await extractor.extractAdditive(newMessage, existingMemories);

      assert(Array.isArray(newEntities));
      assert.strictEqual(newEntities[0].isNew, true);
    });

    it('should return empty array when no new information', async () => {
      const mockResponse = '[]';
      extractor.llm.call = createMockLLMCaller(mockResponse);

      const newMessage = { role: 'user', content: '没有新信息' };
      const existingMemories = [{ content: '已有信息' }];

      const newEntities = await extractor.extractAdditive(newMessage, existingMemories);

      assert(Array.isArray(newEntities));
      assert.strictEqual(newEntities.length, 0);
    });
  });

  describe('linkToExistingMemories', () => {
    it('should link to existing entities', () => {
      extractor.entityIndex.set('苹果公司', ['mem_12345']);

      const entities = [
        { entity: '苹果公司', isNew: false }
      ];

      const linked = extractor.linkToExistingMemories(entities);

      assert.strictEqual(linked[0].memoryIds.length, 1);
      assert.strictEqual(linked[0].memoryIds[0], 'mem_12345');
    });

    it('should mark new entities', () => {
      const entities = [
        { entity: '新实体', isNew: true }
      ];

      const linked = extractor.linkToExistingMemories(entities);

      assert.strictEqual(linked[0].isNew, true);
      assert.strictEqual(linked[0].memoryIds.length, 0);
    });
  });

  describe('updateEntityIndex', () => {
    it('should update entity index with memories', () => {
      const memories = [
        { id: 'mem_1', entities: ['AI', 'HeartFlow'] }
      ];

      extractor.updateEntityIndex(memories);

      assert(extractor.entityIndex.has('AI'));
      assert(extractor.entityIndex.has('HeartFlow'));
      assert.strictEqual(extractor.entityIndex.get('AI')[0], 'mem_1');
    });

    it('should not duplicate memory IDs', () => {
      const memories = [
        { id: 'mem_1', entities: ['AI'] }
      ];

      extractor.updateEntityIndex(memories);
      extractor.updateEntityIndex(memories);  // 重复更新

      const memoryIds = extractor.entityIndex.get('AI');
      assert.strictEqual(memoryIds.length, 1);
    });
  });

  describe('buildEntityGraph', () => {
    it('should build entity graph from memories', () => {
      const memories = [
        { entities: ['AI', 'HeartFlow'] },
        { entities: ['HeartFlow', '认知引擎'] }
      ];

      extractor.buildEntityGraph(memories);

      assert(extractor.entityGraph.has('AI'));
      assert(extractor.entityGraph.has('HeartFlow'));
      assert(extractor.entityGraph.get('AI').has('HeartFlow'));
    });
  });

  describe('getRelatedEntities', () => {
    it('should get directly related entities', () => {
      extractor.entityGraph.set('AI', new Set(['HeartFlow', '机器学习']));
      extractor.entityGraph.set('HeartFlow', new Set(['AI', '认知引擎']));

      const related = extractor.getRelatedEntities('AI', 1);

      assert(related.includes('HeartFlow'));
      assert(related.includes('机器学习'));
    });

    it('should get entities within depth', () => {
      extractor.entityGraph.set('AI', new Set(['HeartFlow']));
      extractor.entityGraph.set('HeartFlow', new Set(['AI', '认知引擎']));
      extractor.entityGraph.set('认知引擎', new Set(['HeartFlow']));

      const related = extractor.getRelatedEntities('AI', 2);

      assert(related.includes('AI'));
      assert(related.includes('HeartFlow'));
      assert(related.includes('认知引擎'));
    });
  });
});
