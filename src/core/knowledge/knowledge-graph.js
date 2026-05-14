/**
 * HeartFlow Knowledge Graph v11.24.4
 * 
 * 实体-关系有向图，基于 Mnemo (hamza2masmoudi/Mnemo) 架构启发。
 * 
 * 功能：
 * - 实体节点：person / tool / concept / project / place
 * - 有向边：关系类型 + 置信度
 * - BFS 遍历：按关系链扩散检索
 * - JSON 持久化
 * 
 * 来源：Mnemo core/graph.py (MIT License)
 * 差异：纯 Node.js 内置实现，无 NetworkX 依赖
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EntityNode {
  constructor({ name, entityType = 'concept', mentionCount = 1, lastMentioned = null } = {}) {
    this.name = name;
    this.entityType = entityType;
    this.mentionCount = mentionCount;
    this.lastMentioned = lastMentioned || new Date().toISOString();
    this.createdAt = this.createdAt || new Date().toISOString();
  }
}

class RelationEdge {
  constructor({ source, target, relationType = 'related', confidence = 1.0, factId = null } = {}) {
    this.source = source;       // 源实体名
    this.target = target;       // 目标实体名
    this.relationType = relationType; // e.g. 'works_at', 'uses', 'depends_on'
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.factId = factId || null;     // 来源事实ID（用于溯源）
    this.createdAt = this.createdAt || new Date().toISOString();
  }
}

class KnowledgeGraph {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'data');
    this.graphFile = path.join(this.dataDir, 'knowledge-graph.json');
    this.nodes = new Map();   // Map<name, EntityNode>
    this.edges = [];           // RelationEdge[]
    this._edgeIndex = new Map(); // "source→target" → edge, for O(1) lookup

    this._ensureDir();
    this._load();
  }

  _ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  _load() {
    if (!fs.existsSync(this.graphFile)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.graphFile, 'utf8'));
      this.nodes = new Map();
      for (const n of (raw.nodes || [])) {
        this.nodes.set(n.name, new EntityNode(n));
      }
      this.edges = (raw.edges || []).map(e => new RelationEdge(e));
      this._rebuildIndex();
    } catch (e) {
      console.warn('[KnowledgeGraph] _load failed:', e.message);
      this.nodes = new Map();
      this.edges = [];
      this._edgeIndex = new Map();
    }
  }

  _save() {
    try {
      const data = {
        nodes: Array.from(this.nodes.values()),
        edges: this.edges,
        savedAt: new Date().toISOString(),
      };
      // Atomic write: temp file + rename to avoid partial writes
      const tmpFile = this.graphFile + '.tmp.' + Date.now() + '.' + crypto.randomBytes(4).toString('hex');
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmpFile, this.graphFile);
    } catch (e) {
      console.warn(`[KnowledgeGraph] _save failed: ${e.message}`);
    }
  }

  _rebuildIndex() {
    this._edgeIndex = new Map();
    for (const edge of this.edges) {
      if (!edge.source || !edge.target) continue;
      const key = `${edge.source}→${edge.target}`;
      this._edgeIndex.set(key, edge);
    }
  }

  // ── Entity Operations ───────────────────────────────────────────────────────

  /**
   * 添加或更新实体
   * @param {Object} entity - { name, entityType, mentionCount, lastMentioned }
   */
  addEntity({ name, entityType = 'concept', mentionCount = 1, lastMentioned = null } = {}) {
    if (!name || typeof name !== 'string') return false;
    const nameNorm = name.trim();
    if (this.nodes.has(nameNorm)) {
      const existing = this.nodes.get(nameNorm);
      existing.mentionCount += 1;
      existing.lastMentioned = lastMentioned || new Date().toISOString();
      existing.entityType = entityType; // 可更新类型
    } else {
      this.nodes.set(nameNorm, new EntityNode({ name: nameNorm, entityType, mentionCount, lastMentioned }));
    }
    this._save();
    return true;
  }

  /**
   * 删除实体及其所有边
   */
  removeEntity(name) {
    if (!this.nodes.has(name)) return false;
    this.nodes.delete(name);
    this.edges = this.edges.filter(e => e.source !== name && e.target !== name);
    this._rebuildIndex();
    this._save();
    return true;
  }

  getEntity(name) {
    return this.nodes.get(name) || null;
  }

  getAllEntities(entityType = null) {
    const all = Array.from(this.nodes.values());
    if (entityType) return all.filter(e => e.entityType === entityType);
    return all;
  }

  // ── Relation Operations ─────────────────────────────────────────────────────

  /**
   * 添加有向关系
   * @param {Object} params - { source, target, relationType, confidence, factId }
   */
  addRelation({ source, target, relationType = 'related', confidence = 1.0, factId = null } = {}) {
    if (!source || !target) return false;
    const key = `${source}→${target}`;
    if (this._edgeIndex.has(key)) {
      // 更新已有关系
      const edge = this._edgeIndex.get(key);
      edge.confidence = Math.max(0, Math.min(1, confidence));
      edge.relationType = relationType;
      edge.factId = factId || edge.factId;
    } else {
      const edge = new RelationEdge({ source, target, relationType, confidence, factId });
      this.edges.push(edge);
      this._edgeIndex.set(key, edge);
    }
    // 确保两端实体存在
    this.addEntity({ name: source });
    this.addEntity({ name: target });
    this._save();
    return true;
  }

  /**
   * 删除两个实体间的关系
   */
  removeRelation(source, target) {
    const key = `${source}→${target}`;
    if (!this._edgeIndex.has(key)) return false;
    this.edges = this.edges.filter(e => `${e.source}→${e.target}` !== key);
    this._edgeIndex.delete(key);
    this._save();
    return true;
  }

  getRelation(source, target) {
    return this._edgeIndex.get(`${source}→${target}`) || null;
  }

  /**
   * 获取实体的所有邻居（出入边）
   * @param {string} name - 实体名
   * @param {string} direction - 'out' | 'in' | 'both'
   */
  getNeighbors(name, direction = 'both') {
    const result = [];
    for (const edge of this.edges) {
      if (direction === 'out' && edge.source === name) {
        result.push({ entity: edge.target, relation: edge.relationType, confidence: edge.confidence, direction: 'out' });
      } else if (direction === 'in' && edge.target === name) {
        result.push({ entity: edge.source, relation: edge.relationType, confidence: edge.confidence, direction: 'in' });
      } else if (direction === 'both') {
        if (edge.source === name) result.push({ entity: edge.target, relation: edge.relationType, confidence: edge.confidence, direction: 'out' });
        if (edge.target === name) result.push({ entity: edge.source, relation: edge.relationType, confidence: edge.confidence, direction: 'in' });
      }
    }
    return result;
  }

  // ── BFS Traversal ─────────────────────────────────────────────────────────

  /**
   * BFS 遍历：从起始实体出发，按关系层扩散
   * @param {string} startEntity - 起始实体
   * @param {Object} options - { maxDepth, relationTypes, direction }
   * @returns {Array} - 按深度组织的实体列表
   */
  bfs(startEntity, options = {}) {
    const { maxDepth = 3, relationTypes = null, direction = 'both' } = options;
    if (!this.nodes.has(startEntity)) return [];

    const visited = new Set([startEntity]);
    const queue = [{ entity: startEntity, depth: 0, path: [] }];
    const result = [{ entity: startEntity, depth: 0, path: [] }];

    while (queue.length > 0) {
      const { entity, depth, path } = queue.shift();
      if (depth >= maxDepth) continue;

      const neighbors = this.getNeighbors(entity, direction);
      for (const n of neighbors) {
        if (!visited.has(n.entity)) {
          visited.add(n.entity);
          const newPath = [...path, { entity: n.entity, relation: n.relation }];
          const nodeResult = { entity: n.entity, depth: depth + 1, path: newPath };
          result.push(nodeResult);
          queue.push({ entity: n.entity, depth: depth + 1, path: newPath });
        }
      }
    }

    return result;
  }

  /**
   * 查询两实体间的路径（如果有）
   */
  findPath(source, target, maxDepth = 4) {
    if (typeof source !== 'string' || typeof target !== 'string') return null;
    if (source === '__proto__' || target === '__proto__' ||
        source === 'constructor' || target === 'constructor') return null;
    if (!this.nodes.has(source) || !this.nodes.has(target)) return null;
    const visited = new Set([source]);
    const queue = [{ entity: source, path: [] }];

    while (queue.length > 0) {
      const { entity, path } = queue.shift();
      if (entity === target) return path;

      const neighbors = this.getNeighbors(entity, 'both');
      for (const n of neighbors) {
        if (!visited.has(n.entity) && path.length < maxDepth) {
          visited.add(n.entity);
          queue.push({ entity: n.entity, path: [...path, { entity: n.entity, relation: n.relation }] });
        }
      }
    }
    return null; // 无路径
  }

  // ── Fact Extraction Integration ─────────────────────────────────────────────

  /**
   * 从记忆记录中提取并添加实体-关系
   * @param {Object} factRecord - { factId, subject, predicate, object, confidence }
   */
  addFact({ factId, subject, predicate, object, confidence = 0.9 }) {
    if (!subject || !object) return false;
    this.addEntity({ name: subject, entityType: this._inferType(subject) });
    this.addEntity({ name: object, entityType: this._inferType(object) });
    this.addRelation({
      source: subject,
      target: object,
      relationType: predicate || 'related',
      confidence,
      factId,
    });
    return true;
  }

  _inferType(entity) {
    // 简单启发式推断实体类型
    const lower = entity.toLowerCase();
    if (['he', 'she', 'they', 'person', 'user', '老大', '用户'].some(t => lower.includes(t))) return 'person';
    if (['tool', 'function', 'module', 'engine', 'script', '引擎', '模块'].some(t => lower.includes(t))) return 'tool';
    if (['project', 'system', 'repo'].some(t => lower.includes(t))) return 'project';
    if (['python', 'javascript', 'java', 'rust', '语言'].some(t => lower.includes(t))) return 'concept';
    return 'concept';
  }

  // ── Serialization ───────────────────────────────────────────────────────────

  /**
   * 导出为 JSON（供 LLM 上下文使用）
   */
  toJSON(entityFilter = null) {
    let nodes = Array.from(this.nodes.values());
    if (entityFilter) {
      nodes = nodes.filter(n => entityFilter(n));
    }
    return {
      nodes: nodes.map(n => ({
        name: n.name,
        type: n.entityType,
        mentions: n.mentionCount,
        lastSeen: n.lastMentioned,
      })),
      edges: this.edges.map(e => ({
        from: e.source,
        to: e.target,
        relation: e.relationType,
        confidence: e.confidence,
      })),
      stats: {
        totalEntities: this.nodes.size,
        totalRelations: this.edges.length,
        byType: this._countByType(),
      },
    };
  }

  _countByType() {
    const counts = {};
    for (const node of this.nodes.values()) {
      counts[node.entityType] = (counts[node.entityType] || 0) + 1;
    }
    return counts;
  }

  /**
   * 生成自然语言图摘要（供 LLM 上下文注入）
   */
  toNaturalLanguage(maxEntities = 20) {
    const entities = this.getAllEntities().slice(0, maxEntities);
    if (entities.length === 0) return '知识图谱为空。';

    const parts = ['【知识图谱】'];
    for (const entity of entities) {
      const neighbors = this.getNeighbors(entity.name, 'both');
      if (neighbors.length > 0) {
        const rels = neighbors.map(n => `${n.entity}(${n.relation})`).join(', ');
        parts.push(`• ${entity.name} [${entity.entityType}]: ${rels}`);
      }
    }
    return parts.join('\n');
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  stats() {
    return {
      totalEntities: this.nodes.size,
      totalRelations: this.edges.length,
      byType: this._countByType(),
      density: this.nodes.size > 0 ? (this.edges.length / (this.nodes.size * (this.nodes.size - 1))).toFixed(4) : '0',
    };
  }
}

module.exports = { KnowledgeGraph, EntityNode, RelationEdge };
