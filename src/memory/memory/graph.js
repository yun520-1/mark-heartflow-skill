/**
 * HeartFlow Memory Graph — 关系图谱 + 传播激活搜索
 * 
 * 整合来源：
 *   - agentmemory graph relations
 *   - hindsight SearchTracer spreading activation
 * 
 * 核心能力：
 * 1. 关系图谱：entity / temporal / semantic 三种关系类型
 * 2. 传播激活搜索：模拟神经网络激活扩散，支持预算限制
 * 3. 与 memory.js 三层记忆无缝集成
 */

// ─── 关系类型常量 ────────────────────────────────────────────────────────────

const RELATION_TYPES = {
  ENTITY: 'entity',    // 实体关联：概念、对象、主体
  TEMPORAL: 'temporal', // 时序关联：before/after/during
  SEMANTIC: 'semantic', // 语义关联：similar/contradicts/causes
};

// 关系权重配置（可调节）
const RELATION_WEIGHTS = {
  [RELATION_TYPES.ENTITY]: 1.0,
  [RELATION_TYPES.TEMPORAL]: 0.8,
  [RELATION_TYPES.SEMANTIC]: 0.9,
};

// 传播激活配置
const SPREADING_CONFIG = {
  decayRate: 0.5,          // 每跳激活衰减率
  minActivation: 0.01,     // 最低激活阈值
  defaultBudget: 100,      // 默认预算
  maxIterations: 50,       // 最大迭代次数
  boostFactor: 1.5,        // 直接关联节点激活增强因子
};

// ─── 图谱存储 ─────────────────────────────────────────────────────────────────

let _nodes = new Map();      // { id: { id, type, label, metadata, activation } }
let _relations = new Map();  // { sourceId: [ { targetId, type, weight } ] }
let _reverseRelations = new Map(); // { targetId: [ { sourceId, type, weight } ] }

// ─── 辅助函数 ─────────────────────────────────────────────────────────────────

/**
 * 生成唯一节点ID
 */
function generateNodeId(prefix = 'node') {
  const { randomBytes } = require('crypto');
  return `${prefix}-${Date.now()}-${randomBytes(4).toString('hex')}`;
}

/**
 * 获取节点出向关系
 */
function _getOutRelations(nodeId) {
  return _relations.get(nodeId) || [];
}

/**
 * 获取节点入向关系
 */
function _getInRelations(nodeId) {
  return _reverseRelations.get(nodeId) || [];
}

/**
 * 获取节点的直接关联节点
 */
function _getDirectlyConnected(nodeId) {
  const connected = new Set();
  
  for (const rel of _getOutRelations(nodeId)) {
    connected.add(rel.targetId);
  }
  for (const rel of _getInRelations(nodeId)) {
    connected.add(rel.sourceId);
  }
  
  return connected;
}

/**
 * 计算关系权重（考虑类型）
 */
function _computeRelationWeight(type, baseWeight = 1.0) {
  return (RELATION_WEIGHTS[type] || 1.0) * baseWeight;
}

// ─── 节点管理 ─────────────────────────────────────────────────────────────────

/**
 * 添加或更新节点
 * @param {object} opts - { id?, type, label, metadata? }
 * @returns {string} nodeId
 */
function addNode(opts = {}) {
  const id = opts.id || generateNodeId(opts.type || 'node');
  const node = {
    id,
    type: opts.type || 'generic',
    label: opts.label || opts.content || '',
    metadata: opts.metadata || {},
    activation: 0,
    createdAt: Date.now(),
  };
  
  _nodes.set(id, node);
  return id;
}

/**
 * 获取节点
 */
function getNode(id) {
  return _nodes.get(id) || null;
}

/**
 * 获取所有节点
 */
function getAllNodes() {
  return Array.from(_nodes.values());
}

/**
 * 删除节点及其所有关系
 */
function removeNode(id) {
  if (!_nodes.has(id)) return false;
  
  // 删除出向关系
  const outRels = _getOutRelations(id);
  for (const rel of outRels) {
    const revRels = _reverseRelations.get(rel.targetId) || [];
    const filtered = revRels.filter(r => r.sourceId !== id);
    if (filtered.length > 0) {
      _reverseRelations.set(rel.targetId, filtered);
    } else {
      _reverseRelations.delete(rel.targetId);
    }
  }
  
  // 删除入向关系
  const inRels = _getInRelations(id);
  for (const rel of inRels) {
    const outRels2 = _relations.get(rel.sourceId) || [];
    const filtered = outRels2.filter(r => r.targetId !== id);
    if (filtered.length > 0) {
      _relations.set(rel.sourceId, filtered);
    } else {
      _relations.delete(rel.sourceId);
    }
  }
  
  _relations.delete(id);
  _reverseRelations.delete(id);
  _nodes.delete(id);
  
  return true;
}

// ─── 关系管理 ─────────────────────────────────────────────────────────────────

/**
 * 添加关系
 * @param {string} source - 源节点ID
 * @param {string} target - 目标节点ID
 * @param {string} type - 关系类型 (entity/temporal/semantic)
 * @param {number} weight - 自定义权重 (0-1)
 * @returns {boolean} 是否成功
 */
function addRelation(source, target, type = RELATION_TYPES.SEMANTIC, weight = 1.0) {
  // 确保节点存在
  if (!_nodes.has(source)) {
    addNode({ id: source, type: 'unknown' });
  }
  if (!_nodes.has(target)) {
    addNode({ id: target, type: 'unknown' });
  }
  
  // 构建关系
  const relation = {
    targetId: target,
    sourceId: source,
    type,
    weight: _computeRelationWeight(type, weight),
    createdAt: Date.now(),
  };
  
  // 添加出向关系
  if (!_relations.has(source)) {
    _relations.set(source, []);
  }
  // 避免重复关系
  const existingOut = _relations.get(source);
  const duplicate = existingOut.find(r => r.targetId === target && r.type === type);
  if (!duplicate) {
    existingOut.push(relation);
  }
  
  // 添加入向关系（反向索引）
  if (!_reverseRelations.has(target)) {
    _reverseRelations.set(target, []);
  }
  const existingIn = _reverseRelations.get(target);
  const duplicateIn = existingIn.find(r => r.sourceId === source && r.type === type);
  if (!duplicateIn) {
    existingIn.push({
      sourceId: source,
      targetId: target,
      type,
      weight: relation.weight,
    });
  }
  
  return true;
}

/**
 * 获取节点的所有关系
 * @param {string} id - 节点ID
 * @param {string} [type] - 可选：筛选特定类型
 * @returns {Array} 关系数组
 */
function getRelations(id, type = null) {
  const out = _getOutRelations(id).map(r => ({
    ...r,
    direction: 'out',
  }));
  const inn = _getInRelations(id).map(r => ({
    ...r,
    direction: 'in',
  }));
  
  const all = [...out, ...inn];
  if (type) {
    return all.filter(r => r.type === type);
  }
  return all;
}

/**
 * 获取相关节点（快捷方法）
 * @param {string} id - 节点ID
 * @param {object} opts - { type?, direction?, minWeight? }
 * @returns {Array} 相关节点列表
 */
function getRelated(id, opts = {}) {
  const { type = null, direction = null, minWeight = 0 } = opts;
  
  let relations = [];
  
  if (direction === 'out') {
    relations = _getOutRelations(id).map(r => ({ ...r, direction: 'out' }));
  } else if (direction === 'in') {
    relations = _getInRelations(id).map(r => ({ ...r, direction: 'in' }));
  } else {
    relations = getRelations(id, type);
  }
  
  // 过滤
  return relations
    .filter(r => r.weight >= minWeight)
    .map(r => {
      const relatedId = r.direction === 'out' ? r.targetId : r.sourceId;
      const node = _nodes.get(relatedId);
      return {
        node,
        relation: r,
        distance: 1,
      };
    })
    .filter(r => r.node !== null);
}

// ─── 传播激活搜索 ─────────────────────────────────────────────────────────────

/**
 * 重置所有节点的激活值
 */
function resetActivations() {
  for (const node of _nodes.values()) {
    node.activation = 0;
  }
}

/**
 * 设置初始激活（query可以是节点ID数组或关键词匹配）
 * @param {Array|string} query - 初始激活的节点ID或关键词
 * @param {number} initialValue - 初始激活值
 */
function setInitialActivation(query, initialValue = 1.0) {
  resetActivations();
  
  if (Array.isArray(query)) {
    for (const id of query) {
      if (_nodes.has(id)) {
        _nodes.get(id).activation = initialValue;
      }
    }
  } else if (typeof query === 'string') {
    // 关键词匹配：激活标签包含关键词的节点
    const kw = query.toLowerCase();
    for (const node of _nodes.values()) {
      if ((node.label || '').toLowerCase().includes(kw) ||
          (node.metadata?.keywords || []).some(k => k.toLowerCase().includes(kw))) {
        node.activation = initialValue;
      }
    }
  }
}

/**
 * 传播激活搜索（核心算法）
 * 
 * 算法描述：
 * 1. 初始激活分配给query节点
 * 2. 每轮迭代，激活沿边传播到邻居
 * 3. 邻居接收的激活 = sum(来源激活 * 边权重 * 衰减)
 * 4. 激活在传播中衰减，控制预算消耗
 * 5. 迭代直到预算耗尽或收敛
 * 
 * @param {Array|string} query - 查询（初始激活节点）
 * @param {object} opts - { budget?, decayRate?, minActivation? }
 * @returns {Array} 排序后的激活节点 [{ node, activation, path }]
 */
function spreadingActivation(query, opts = {}) {
  const {
    budget = SPREADING_CONFIG.defaultBudget,
    decayRate = SPREADING_CONFIG.decayRate,
    minActivation = SPREADING_CONFIG.minActivation,
  } = opts;
  
  // 1. 初始化
  setInitialActivation(query, 1.0);
  
  const activated = new Map(); // { nodeId: { node, activation, path } }
  let remainingBudget = budget;
  let iteration = 0;
  
  // 2. 将初始激活节点加入结果
  for (const node of _nodes.values()) {
    if (node.activation > 0) {
      activated.set(node.id, {
        node,
        activation: node.activation,
        path: [node.id],
      });
    }
  }
  
  // 3. 迭代传播
  while (remainingBudget > 0 && iteration < SPREADING_CONFIG.maxIterations) {
    iteration++;
    
    const newActivations = new Map(); // { targetId: totalActivation }
    let totalSpread = 0;
    
    // 对每个已激活节点，向邻居传播
    for (const [nodeId, info] of activated) {
      if (info.activation < minActivation) continue;
      
      const node = _nodes.get(nodeId);
      if (!node) continue;
      
      // 获取出向和入向邻居
      const outRels = _getOutRelations(nodeId);
      const inRels = _getInRelations(nodeId);
      
      // 传播到出向邻居
      for (const rel of outRels) {
        const spread = info.activation * rel.weight * decayRate;
        if (spread < minActivation) continue;
        
        const current = newActivations.get(rel.targetId) || 0;
        newActivations.set(rel.targetId, current + spread);
        totalSpread += spread;
        
        // 记录传播路径
        if (!activated.has(rel.targetId)) {
          activated.set(rel.targetId, {
            node: _nodes.get(rel.targetId),
            activation: 0,
            path: [...info.path, rel.targetId],
          });
        }
      }
      
      // 传播到入向邻居（反向传播）
      for (const rel of inRels) {
        const spread = info.activation * rel.weight * decayRate;
        if (spread < minActivation) continue;
        
        const current = newActivations.get(rel.sourceId) || 0;
        newActivations.set(rel.sourceId, current + spread);
        totalSpread += spread;
        
        if (!activated.has(rel.sourceId)) {
          activated.set(rel.sourceId, {
            node: _nodes.get(rel.sourceId),
            activation: 0,
            path: [rel.sourceId, ...info.path],
          });
        }
      }
    }
    
    // 应用新激活
    for (const [nodeId, activation] of newActivations) {
      const info = activated.get(nodeId);
      if (info) {
        info.activation += activation;
      }
    }
    
    // 预算消耗
    remainingBudget -= totalSpread;
    
    // 检查收敛
    if (totalSpread < minActivation) break;
  }
  
  // 4. 排序返回
  const results = Array.from(activated.values())
    .filter(info => info.node && info.activation >= minActivation)
    .sort((a, b) => b.activation - a.activation);
  
  return results;
}

/**
 * 基于传播激活的关联查询
 * @param {string} id - 中心节点ID
 * @param {number} depth - 搜索深度（0=直接邻居）
 * @param {number} budget - 传播预算
 * @returns {Array} 关联节点（带距离和激活值）
 */
function findRelatedByActivation(id, depth = 2, budget = 50) {
  if (!_nodes.has(id)) return [];
  
  // 准备初始查询：中心节点及其直接邻居
  const connected = _getDirectlyConnected(id);
  const queryNodes = [id, ...connected];
  
  // 设置较低初始激活，让传播自然进行
  setInitialActivation(queryNodes, 0.8);
  
  // 执行传播
  const results = spreadingActivation(queryNodes, { budget });
  
  // 计算距离（基于路径长度）
  return results.map(info => {
    const distance = info.path.includes(id) 
      ? Math.abs(info.path.indexOf(id) - info.path.lastIndexOf(id))
      : depth + 1;
    return {
      ...info,
      distance: Math.min(distance, depth + 1),
    };
  }).filter(r => r.node.id !== id); // 排除自身
}

// ─── 图谱统计 ─────────────────────────────────────────────────────────────────

/**
 * 获取图谱统计信息
 */
function getGraphStats() {
  let entityCount = 0;
  let temporalCount = 0;
  let semanticCount = 0;
  
  const relationSet = new Set();
  for (const [source, rels] of _relations) {
    for (const rel of rels) {
      relationSet.add(`${source}->${rel.targetId}:${rel.type}`);
      if (rel.type === RELATION_TYPES.ENTITY) entityCount++;
      else if (rel.type === RELATION_TYPES.TEMPORAL) temporalCount++;
      else if (rel.type === RELATION_TYPES.SEMANTIC) semanticCount++;
    }
  }
  
  return {
    nodeCount: _nodes.size,
    relationCount: relationSet.size,
    entityRelations: entityCount,
    temporalRelations: temporalCount,
    semanticRelations: semanticCount,
  };
}

// ─── 序列化 ───────────────────────────────────────────────────────────────────

/**
 * 导出图谱数据（用于持久化）
 */
function exportGraph() {
  return {
    nodes: Array.from(_nodes.entries()),
    relations: Array.from(_relations.entries()),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * 导入图谱数据
 */
function importGraph(data) {
  _nodes = new Map(data.nodes || []);
  _relations = new Map(data.relations || []);
  
  // 重建反向索引
  _reverseRelations = new Map();
  for (const [source, rels] of _relations) {
    for (const rel of rels) {
      if (!_reverseRelations.has(rel.targetId)) {
        _reverseRelations.set(rel.targetId, []);
      }
      _reverseRelations.get(rel.targetId).push({
        sourceId: source,
        targetId: rel.targetId,
        type: rel.type,
        weight: rel.weight,
      });
    }
  }
  
  return true;
}

// ─── 公开 API ─────────────────────────────────────────────────────────────────

module.exports = {
  // 关系类型
  RELATION_TYPES,
  RELATION_WEIGHTS,
  SPREADING_CONFIG,
  
  // 节点管理
  addNode,
  getNode,
  getAllNodes,
  removeNode,
  
  // 关系管理
  addRelation,
  getRelations,
  getRelated,
  
  // 传播激活
  spreadingActivation,
  setInitialActivation,
  findRelatedByActivation,
  resetActivations,
  
  // 统计与持久化
  getGraphStats,
  exportGraph,
  importGraph,
};
