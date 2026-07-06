/**
 * HeartFlow v5.8.0 — 智能实体提取与记忆链接
 * 
 * 来源: mem0 (https://github.com/mem0ai/mem0)
 * 功能: 从对话中自动提取实体，链接到现有记忆
 */

const { LLMBase } = require('../llm/llm-base.js');

class EntityExtractor {
  constructor(config = {}) {
    this.llm = new LLMBase(config.llmConfig);
    this.entityIndex = new Map();  // entityName → memoryIds
    this.entityGraph = new Map();  // entityName → [relatedEntities]
  }

  /**
   * 从消息中提取实体
   */
  async extractEntities(messages) {
    const prompt = `你是一个实体提取助手。从以下对话中提取关键实体（人物、地点、组织、概念、产品等）。

对话：
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

请以 JSON 格式输出实体列表：
[
  {
    "entity": "实体名称",
    "type": "人物|地点|组织|概念|产品|...",
    "confidence": 0.95,
    "context": "实体出现的上下文"
  }
]

只输出 JSON，不要额外解释。`;

    try {
      const response = await this.llm.call(prompt);
      const entities = JSON.parse(response);
      return this.linkToExistingMemories(entities);
    } catch (error) {
      console.error('[EntityExtractor] 实体提取失败:', error);
      return [];
    }
  }

  /**
   * 增量提取（只提取新信息，避免重复）
   */
  async extractAdditive(newMessage, existingMemories) {
    const prompt = `你是一个增量记忆提取助手。从新消息中提取**相对于现有记忆**的新实体或更新。

现有记忆：
${existingMemories.map(m => `- ${m.content}`).join('\n')}

新消息：
${newMessage.role}: ${newMessage.content}

任务：
1. 识别新消息中的**新实体**（现有记忆中没有的）
2. 识别现有实体的**更新信息**（如新的属性、关系）
3. 如果新消息没有新信息，返回空数组 []

以 JSON 格式输出：
[
  {
    "entity": "实体名称",
    "type": "...",
    "isNew": true,
    "content": "新记忆内容",
    "confidence": 0.9
  }
]

只输出 JSON。`;

    try {
      const response = await this.llm.call(prompt);
      const newEntities = JSON.parse(response);
      return newEntities;
    } catch (error) {
      console.error('[EntityExtractor] 增量提取失败:', error);
      return [];
    }
  }

  /**
   * 链接到现有记忆（避免重复）
   */
  linkToExistingMemories(entities) {
    const linked = [];
    
    for (const entity of entities) {
      const existing = this.entityIndex.get(entity.entity);
      
      if (existing) {
        // 已存在，更新上下文
        entity.memoryIds = existing;
        entity.isNew = false;
      } else {
        // 新实体
        entity.isNew = true;
        entity.memoryIds = [];
      }
      
      linked.push(entity);
    }
    
    return linked;
  }

  /**
   * 更新实体索引
   */
  updateEntityIndex(memories) {
    for (const memory of memories) {
      const entities = memory.entities || [];  // 记忆中包含的实体
      
      for (const entity of entities) {
        if (!this.entityIndex.has(entity)) {
          this.entityIndex.set(entity, []);
        }
        
        const memoryIds = this.entityIndex.get(entity);
        if (!memoryIds.includes(memory.id)) {
          memoryIds.push(memory.id);
        }
      }
    }
  }

  /**
   * 构建实体图（实体关系网络）
   */
  buildEntityGraph(memories) {
    for (const memory of memories) {
      const entities = memory.entities || [];
      
      // 同一记忆中的实体互相关联
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          this.addRelation(entities[i], entities[j]);
        }
      }
    }
  }

  /**
   * 添加实体关系
   */
  addRelation(entity1, entity2) {
    if (!this.entityGraph.has(entity1)) {
      this.entityGraph.set(entity1, new Set());
    }
    if (!this.entityGraph.has(entity2)) {
      this.entityGraph.set(entity2, new Set());
    }
    
    this.entityGraph.get(entity1).add(entity2);
    this.entityGraph.get(entity2).add(entity1);
  }

  /**
   * 查询实体相关记忆
   */
  getMemoriesByEntity(entityName) {
    const memoryIds = this.entityIndex.get(entityName) || [];
    return memoryIds;  // 需要外部根据 ID 获取记忆内容
  }

  /**
   * 查询相关实体
   */
  getRelatedEntities(entityName, depth = 1) {
    if (depth === 0) return [entityName];
    
    const related = this.entityGraph.get(entityName) || new Set();
    const result = new Set([entityName]);
    
    for (const rel of related) {
      if (!result.has(rel)) {
        result.add(rel);
        const subRelated = this.getRelatedEntities(rel, depth - 1);
        subRelated.forEach(r => result.add(r));
      }
    }
    
    return Array.from(result);
  }

  /**
   * 导出实体图（用于可视化）
   */
  exportEntityGraph() {
    const nodes = [];
    const edges = [];
    
    for (const [entity, relations] of this.entityGraph) {
      nodes.push({ id: entity, label: entity });
      
      for (const rel of relations) {
        edges.push({ source: entity, target: rel });
      }
    }
    
    return { nodes, edges };
  }
}

module.exports = { EntityExtractor };
