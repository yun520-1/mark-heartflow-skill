# 图/网络引擎类升级模式
## 从 KnowledgeGraph v1.0.2 → v1.1.0 升级中提取

## 适用场景

模块管理一个**通用实体-关系图**（entity-relationship graph），以节点和边的形式存储结构化知识。典型特征是：

- 维护一个内存中的 `Map<string, Node>` + `Map<string, Edge>` 数据结构
- 核心操作：`addNode()` / `addEdge()` / `getNode()` / `getConnectedNodes()`
- 基于关键词/属性的搜索
- 通常 3000-8000 字节，功能较为原始（纯 CRUD）

典型特征（升级前）：
- `addNode(partial)` — 创建节点，基本字段（name/description/type/importance）
- `addEdge(partial)` — 创建边，source/target/relation/weight
- `getNode(id)` — 按 ID 查找节点
- `getConnectedNodes(nodeId, relation)` — 获取相连节点
- `search(query)` — 按名称/描述关键词搜索
- `getStats()` — 节点数/边数/平均连接数

## 示例：knowledge-graph.js (src/memory/, 5274B → 17838B)

**原模块**：基本图引擎，node/edge CRUD + 简单关键词搜索 + 基础统计。

**升级后**：完整图引擎，含输入验证、错误分类、节点删除、边更新、JSON序列化、增强搜索、重要性衰减、陈旧修剪。

### 可添加的子系统

#### 1. 输入验证层

```javascript
_safeString(val, fallback = '') {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

_safeNumber(val, fallback = 0, min = 0, max = 1) {
  if (typeof val === 'number' && !Number.isNaN(val)) {
    return Math.max(min, Math.min(max, val));
  }
  return fallback;
}

_validateNodeInput(partial) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
    return { valid: false, error: 'INVALID_INPUT', message: 'Node input must be a non-null object' };
  }
  if (!partial.name || typeof partial.name !== 'string' || partial.name.trim().length === 0) {
    return { valid: false, error: 'INVALID_INPUT', message: 'Node name is required and must be a non-empty string' };
  }
  return { valid: true };
}

_validateEdgeInput(partial) {
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
    return { valid: false, error: 'INVALID_INPUT', message: 'Edge input must be a non-null object' };
  }
  if (!partial.sourceId || typeof partial.sourceId !== 'string') {
    return { valid: false, error: 'INVALID_INPUT', message: 'sourceId is required and must be a string' };
  }
  if (!partial.targetId || typeof partial.targetId !== 'string') {
    return { valid: false, error: 'INVALID_INPUT', message: 'targetId is required and must be a string' };
  }
  return { valid: true };
}
```

关键点：
- 每个公开方法增加参数验证
- 验证失败时抛出带有 `code` 属性的 Error 对象（`err.code = KG_ERROR.INVALID_INPUT`）
- 不要用 return 错误码——调用者可能不检查返回值

#### 2. 错误分类枚举

```javascript
const KG_ERROR = {
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  EDGE_NOT_FOUND: 'EDGE_NOT_FOUND',
  CONNECTION_LIMIT: 'CONNECTION_LIMIT',
  INVALID_INPUT: 'INVALID_INPUT',
  SEARCH_EMPTY: 'SEARCH_EMPTY',
  UNKNOWN: 'UNKNOWN',
};
```

关键点：
- 枚举值用大写 SNAKE_CASE
- 配套 `KG_ERROR_MESSAGES` 映射表用于友好错误消息
- 每个方法选择 throw（严重错误）或 return null（预期内的正常路径）
- **关键设计决策**：`addEdge` 返回 `null`（节点不存在/连接数超限）而非 throw——因为这属于业务逻辑预期内的失败，不是编程错误。`removeNode` 返回 `false` 同理。`getNode` 返回 `null` 同理。

#### 3. 节点删除（含级联清理）

```javascript
removeNode(nodeId) {
  if (!nodeId || typeof nodeId !== 'string') {
    const err = new Error('nodeId must be a non-empty string');
    err.code = KG_ERROR.INVALID_INPUT;
    throw err;
  }
  const node = this.nodes.get(nodeId);
  if (!node) {
    const err = new Error(KG_ERROR_MESSAGES[KG_ERROR.NODE_NOT_FOUND]);
    err.code = KG_ERROR.NODE_NOT_FOUND;
    return false;  // 业务预期失败，不 throw
  }
  // 1. 删除所有关联边
  for (const [edgeId, edge] of this.edges) {
    if (edge.sourceId === nodeId || edge.targetId === nodeId) {
      edgesToRemove.push(edgeId);
    }
  }
  for (const edgeId of edgesToRemove) this.edges.delete(edgeId);
  // 2. 从其他节点的 connection 列表中移除
  for (const otherNode of this.nodes.values()) {
    otherNode.connections = otherNode.connections.filter(c => c !== nodeId);
  }
  this.nodes.delete(nodeId);
  return true;
}
```

关键点：
- 级联删除：节点删除 → 所有关联边删除 → 其他节点的连接列表清理
- 遍历 `this.edges` 时不能在迭代中删除——先用数组收集 ID，再遍历删除
- 连接列表清理：`filter` 生成新数组而非 `splice`

#### 4. 边权重更新

```javascript
updateEdgeWeight(edgeId, newWeight) {
  if (!edgeId || typeof edgeId !== 'string') {
    const err = new Error('edgeId must be a non-empty string');
    err.code = KG_ERROR.INVALID_INPUT;
    throw err;
  }
  const edge = this.edges.get(edgeId);
  if (!edge) {
    const err = new Error(KG_ERROR_MESSAGES[KG_ERROR.EDGE_NOT_FOUND]);
    err.code = KG_ERROR.EDGE_NOT_FOUND;
    return null;  // 业务预期失败
  }
  edge.weight = this._safeNumber(newWeight, edge.weight, 0, 1);
  return edge;
}
```

#### 5. JSON 序列化/反序列化

```javascript
toJSON() {
  const nodesArray = [];
  for (const [id, node] of this.nodes) {
    nodesArray.push({
      id, name: node.name, description: node.description,
      type: node.type, importance: node.importance,
      connections: [...node.connections],
      reflectionCount: node.reflectionCount,
      createdAt: node.createdAt, lastAccessed: node.lastAccessed,
    });
  }
  const edgesArray = [];
  for (const [id, edge] of this.edges) {
    edgesArray.push({
      id, sourceId: edge.sourceId, targetId: edge.targetId,
      relation: edge.relation, weight: edge.weight,
      bidirectional: edge.bidirectional, createdAt: edge.createdAt,
    });
  }
  return { nodes: nodesArray, edges: edgesArray };
}

fromJSON(data) {
  if (!data || typeof data !== 'object') return false;
  this.nodes.clear();
  this.edges.clear();
  if (Array.isArray(data.nodes)) {
    for (const n of data.nodes) {
      if (n && n.id && n.name) {
        this.nodes.set(n.id, {
          id: n.id, name: this._safeString(n.name),
          description: this._safeString(n.description),
          type: this._safeString(n.type, 'concept'),
          importance: this._safeNumber(n.importance, 0.5, 0.05, 1.0),
          connections: Array.isArray(n.connections) ? [...n.connections] : [],
          reflectionCount: typeof n.reflectionCount === 'number' ? n.reflectionCount : 0,
          createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(),
          lastAccessed: typeof n.lastAccessed === 'number' ? n.lastAccessed : Date.now(),
        });
      }
    }
  }
  // edges 同理
}
```

关键点：
- 反序列化时必须用 `_safeString` / `_safeNumber` 恢复每个字段——旧数据可能格式不完整
- 用 `Array.isArray()` 检查 connections，用 `typeof === 'number'` 检查数值
- 缺失字段用 `||` 或三元表达式回退默认值
- `fromJSON` 返回 `false` 如果输入无效

#### 6. 增强搜索（评分排序）

```javascript
search(query) {
  if (!query || typeof query !== 'string') return [];
  const lowerQuery = query.toLowerCase().trim();
  if (lowerQuery.length === 0) return [];
  const results = [];
  for (const node of this.nodes.values()) {
    let score = 0;
    const nameLower = node.name.toLowerCase();
    const descLower = node.description.toLowerCase();
    if (nameLower === lowerQuery) score = 1.0;         // 精确名称匹配
    else if (nameLower.includes(lowerQuery)) score = 0.8;  // 名称包含
    else if (descLower.includes(lowerQuery)) score = 0.5;  // 描述包含
    if (score > 0) {
      results.push({ node, score, rankScore: score * node.importance });
    }
  }
  return results.sort((a, b) => b.rankScore - a.rankScore);
}
```

关键点：
- 三级匹配：精确(1.0) > 名称包含(0.8) > 描述包含(0.5)
- 最终排序 = 匹配度 × 重要性（高重要性+低匹配 < 低重要性+高匹配）
- 返回 `{ node, score, rankScore }` 而非裸节点——调用者可能需要评分信息
- **向后兼容陷阱**：如果旧调用者依赖 `search()` 返回裸节点数组，改为返回 `{node, ...}` 对象会破坏它们。必须 grep 确认调用者。

#### 7. findByName（精确名称查找）

```javascript
findByName(name) {
  if (!name || typeof name !== 'string') return null;
  const lower = name.toLowerCase().trim();
  for (const node of this.nodes.values()) {
    if (node.name.toLowerCase() === lower) return node;
  }
  return null;
}
```

#### 8. 重要性衰减

```javascript
_applyDecay() {
  const now = Date.now();
  const elapsed = now - this._lastDecay;
  const days = elapsed / (24 * 60 * 60 * 1000);
  if (days < 1) return; // 每天只衰减一次

  for (const node of this.nodes.values()) {
    const ageDays = (now - node.createdAt) / (24 * 60 * 60 * 1000);
    if (ageDays > STALE_DAYS) {
      node.importance *= Math.pow(IMPORTANCE_DECAY_RATE * 0.9, days);
    } else {
      node.importance *= Math.pow(IMPORTANCE_DECAY_RATE, days);
    }
    node.importance = Math.max(0.05, Math.min(1.0, node.importance));
  }
  this._lastDecay = now;
}
```

关键参数：
- `IMPORTANCE_DECAY_RATE`: 0.95（每天5%衰减）
- `STALE_DAYS`: 30（超过30天加速衰减）
- 最小值: 0.05（永不归零）

关键点：
- 在 `getStats()` 中自动触发（确保统计反映最新状态）
- 不在公开方法中直接调用——延迟到需要时再计算
- 构造函数中记录 `_lastDecay = Date.now()`

#### 9. 陈旧节点修剪

```javascript
pruneStale(options = {}) {
  const minImportance = options.minImportance ?? 0.1;
  const maxAgeMs = options.maxAgeMs ?? (STALE_DAYS * 24 * 60 * 60 * 1000);
  const minReflections = options.minReflections ?? 0;
  const removed = [];
  for (const [id, node] of this.nodes) {
    const tooOld = (now - node.lastAccessed) > maxAgeMs;
    const tooLow = node.importance < minImportance;
    const unreflected = node.reflectionCount <= minReflections;
    if (tooOld && (tooLow || unreflected)) {
      this.removeNode(id);  // 复用级联删除
      removed.push({ id, name: node.name, importance: node.importance, age: now - node.createdAt });
    }
  }
  return removed;
}
```

关键点：
- 使用 `??`（nullish coalescing）而非 `||`——允许显式传 `0`
- 条件：**过期 AND（低重要性 OR 未反射）**——避免误删频繁使用但重要性低的节点
- 复用 `removeNode()` 确保级联清理
- 返回已删除节点的清单（便于日志/审计）

#### 10. 增强统计

```javascript
getStats() {
  this._applyDecay();  // 先衰减再统计
  // ... 原有统计 ...
  const mostReflected = [];
  let staleCount = 0;
  const edgeTypes = new Map();
  
  for (const node of this.nodes.values()) {
    if (node.reflectionCount > 0) {
      mostReflected.push({ id: node.id, name: node.name, count: node.reflectionCount, importance: node.importance });
    }
    if ((now - node.lastAccessed) > STALE_DAYS * 24 * 60 * 60 * 1000) staleCount++;
  }
  for (const edge of this.edges.values()) {
    edgeTypes.set(edge.relation, (edgeTypes.get(edge.relation) || 0) + 1);
  }
  
  return {
    ...原有字段,
    mostReflected: mostReflected.sort((a,b) => b.count - a.count).slice(0, 5),
    staleCount,
    edgeTypeDistribution: Object.fromEntries(edgeTypes),
    nodeTypes: this._getNodeTypeDistribution(),
    isDirty: this._isDirty,
  };
}
```

新增统计字段：
- `mostReflected` — 最高反射次数TOP5
- `staleCount` — 超过30天未访问的节点数
- `edgeTypeDistribution` — 边关系类型分布
- `nodeTypes` — 节点类型分布
- `isDirty` — 是否有未保存的修改

#### 11. reflect 增强（附带重要性提升）

```javascript
reflect(nodeId) {
  // ... 原有反射逻辑 ...
  node.reflectionCount = (node.reflectionCount || 0) + 1;
  node.importance = Math.min(1.0, node.importance + 0.05);  // 每次反射+0.05
  node.lastAccessed = Date.now();
  // ...
}
```

#### 12. 防御性编程 + isDirty/markClean

```javascript
get isDirty() { return this._isDirty; }
markClean() { this._isDirty = false; }
```

## 升级顺序建议

如果模块特别小（<3000B），建议按以下顺序增量升级：

1. **输入验证 + 错误分类**（基础安全网，优先于所有功能）
2. **JSON 序列化/反序列化**（持久化基础）
3. **增强搜索 + findByName**（最小 API 扩展）
4. **节点删除**（完整 CRUD）
5. **边权重更新**（完整 CRUD）
6. **重要性衰减**（图健康管理）
7. **增强统计**（可观测性）
8. **陈旧节点修剪**（内存保护）
9. **reflect 增强**（使用正反馈）

## 验证清单

- [ ] `node --check` 语法通过
- [ ] 原有方法签名不变（addNode, addEdge, getNode, getConnectedNodes, search, reflect, getStats, learnConcept, connect）
- [ ] 构造不报错（`new KnowledgeGraph(root)`）
- [ ] 输入验证：addNode(null) 抛 Error 带 code 属性
- [ ] 级联删除：removeNode → 边也删除，其他节点连接列表更新
- [ ] JSON 序列化/反序列化完整：nodes + edges 正确恢复
- [ ] 增强搜索：返回 `{ node, score, rankScore }` 格式，按 rankScore 排序
- [ ] 衰减：_applyDecay 不报错，重要性在合理范围 [0.05, 1.0]
- [ ] 修剪：pruneStale 返回正确的删除清单
- [ ] 增强统计：staleCount / mostReflected / edgeTypeDistribution 都存在
- [ ] 导出：主类 + KG_ERROR 枚举 + 常量（MAX_CONNECTIONS 等）
- [ ] 核心加载测试：`require('./knowledge-graph.js')` + `new KnowledgeGraph()` 不报错
- [ ] 调用者回归：所有引用该模块的文件加载通过
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步
