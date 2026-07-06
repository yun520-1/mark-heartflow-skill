# Semantic Search / Embedding Engine 升级模式

## 适用模块类型

语义搜索/嵌入引擎类模块，核心操作为：文本→嵌入向量→向量索引→相似度搜索。典型文件：`search/semantic-search.js`。

## 典型特征

- 使用 `@xenova/transformers` 等库在本地生成嵌入向量
- 有 `embed(text)`、`addDocument(id, text)`、`search(query, topK)` 三个核心方法
- 基于余弦相似度做结果排序
- 懒加载模型（首次搜索时初始化）
- 无状态追踪、无错误分类、无质量过滤

## 标准升级清单

### 1. ErrorClassification — 错误类型枚举 + 重试策略建议

```javascript
const ErrorType = {
  MODEL_LOAD_FAILED: 'MODEL_LOAD_FAILED',       // category: MODEL, retryable: true
  MODEL_NOT_INITIALIZED: 'MODEL_NOT_INITIALIZED', // category: MODEL, retryable: true
  EMBEDDING_DIMENSION_MISMATCH: 'EMBEDDING_DIMENSION_MISMATCH', // category: EMBEDDING
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',           // category: EMBEDDING
  INPUT_INVALID: 'INPUT_INVALID',                 // category: INPUT
  INPUT_EMPTY: 'INPUT_EMPTY',                     // category: INPUT
  INDEX_MEMORY_LIMIT: 'INDEX_MEMORY_LIMIT',       // category: MEMORY
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',             // category: NETWORK
  MODEL_DOWNLOAD_FAILED: 'MODEL_DOWNLOAD_FAILED', // category: NETWORK
  INTERNAL_ERROR: 'INTERNAL_ERROR',               // category: INTERNAL
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',       // category: INDEX
  INDEX_EMPTY: 'INDEX_EMPTY',                     // category: INDEX
};
```

每个错误类型附带 `category`、`retryable`、`severity`、`recoveryHint`、`delayMs`。

`classifyError(err)` 方法：基于 `err.message` 中的关键词（timeout/load/not found/dimension/memory/pipeline）自动匹配错误类型。

### 2. 输入验证系统

```javascript
validateText(text) — 检查 null/undefined/类型/空字符串/超长(100K)
validateId(id) — 检查 null/undefined/类型
```

所有公共方法（`embed`、`addDocument`、`addDocuments`、`updateDocument`、`search`）调用前先验证输入。

### 3. 嵌入维度追踪

```javascript
this._embeddingDim = null; // 首次嵌入后记录

// embed() 中：
if (this._embeddingDim === null) {
  this._embeddingDim = result.data.length;
} else if (result.data.length !== this._embeddingDim) {
  // 记录 EMBEDDING_DIMENSION_MISMATCH 错误
}

// search() 中：
if (queryEmbed.length !== docEmbed.length) {
  // 跳过维度不匹配的文档，记录错误
}
```

### 4. QualityFiltering — 质量过滤

- `minScore` 参数（实例级 + 搜索级可覆盖）：低于阈值的结果不返回
- 可选 `normalizeScores`：将分数归一化到 0-1 范围（用最高分做分母）

### 5. OscillationDetection — 搜索结果震荡检测

```javascript
_detectOscillation(query, results) {
  // Jaccard 相似度（基于结果 ID 集合）
  // 如果连续两次不同查询的 Jaccard < oscillationThreshold（默认 0.3），触发震荡警告
  // 统计 oscillationWarnings 计数
}
```

### 6. IndexStatistics — 索引统计与内存估算

```javascript
estimateMemoryUsage() {
  // embeddingBytes = embeddingCount * embeddingDim * 4 (Float32)
  // documentBytes = sum of text.length * 2 (UTF-16 approx)
  // 返回 { embeddingBytes, documentBytes, total }
}

diagnose() {
  // 返回完整健康报告：
  //   model: { name, status, loadError, available }
  //   index: { documentCount, embeddingCount, embeddingDimension, maxDocuments, utilization }
  //   memory: { embeddingMB, documentMB, totalMB }
  //   stats: { searchCount, embedCount, embedErrorCount, modelLoadAttempts, ... }
  //   quality: { minScoreThreshold, oscillationThreshold }
}
```

### 7. Document Management 增强

- `updateDocument(id, newText)` — 更新文档内容并自动重新嵌入
- `getDocument(id)` — 查询文档原文
- `similarityBetween(id1, id2)` — 计算两个文档间的语义相似度
- `addDocuments()` 返回成功添加的文档数（不是 void）
- `removeDocument()` 返回是否实际删除（boolean）
- 内存保护：`maxDocuments` 上限，超限时拒绝添加并记录错误

### 8. MultiQuerySearch — 多查询搜索

```javascript
async searchMulti(queries, options = {}) {
  // 并行搜索所有查询
  // 合并结果去重（保留最高分）
  // 每条结果附带 fromQuery 字段标明来源
  // 按分数降序排列
}
```

### 9. 模型重置

```javascript
resetModel() {
  // 清空 _loaded、_loadError、_pipeline
  // 允许在模型加载失败后重试（不重启进程）
}
```

### 10. 统计追踪

```javascript
this._stats = {
  searchCount: 0,          // 搜索总次数
  embedCount: 0,           // 嵌入成功次数
  embedErrorCount: 0,      // 嵌入失败次数
  modelLoadAttempts: 0,    // 模型加载尝试次数
  modelLoadFailures: 0,    // 模型加载失败次数
  fallbackCount: 0,        // 降级回退次数
  oscillationWarnings: 0,  // 震荡警告次数
  lastError: null,         // 最后一条错误 { type, message }
  lastErrorTime: null,     // 最后错误时间戳
};
```

## 模块级导出

```javascript
module.exports = {
  SemanticSearch,   // 主类
  ErrorType,        // 错误类型枚举
  ErrorCategory,    // 错误大类枚举
  ERROR_META,       // 错误元数据表（含分类/可重试性/严重性/恢复建议）
};
```

## 向后兼容注意事项

- 原有接口（`constructor`、`embed`、`embedBatch`、`addDocument`、`addDocuments`、`search`、`removeDocument`、`clear`、`isAvailable`、`size`、`ids`）保持签名不变
- `search()` 的第二参数从 `topK(number)` 改为 `options(object)` 以兼容旧调用方式：
  ```javascript
  // 兼容旧式调用
  if (typeof options === 'number') topK = options;
  else if (options && typeof options === 'object') topK = options.topK || 5;
  ```
- 新增方法不改变已有方法的返回值结构（旧调用者不受影响）

## 关键陷阱

### 1. Float32Array 维度一致性
嵌入向量维度在首次 embed() 时记录。后续所有 embed 结果必须与首次维度一致。如果不一致，**不能静默接受**——必须记录错误并跳过维度不匹配的文档。

### 2. 内存泄漏预防
- `_embeddings` 和 `_documents` 使用 `Map` 而非 `Object`（避免原型链污染）
- `maxDocuments` 硬上限防止 OOM
- 震荡检测的时间戳列表（如果实现）必须有上限

### 3. 懒加载的竞态条件
多个方法（`embed`、`search`、`addDocument`）都可能触发 `_loadModel()`。内部有 `_loaded`/`_loadError` 双锁保护，但 `pipeline()` 初始化期间并发调用 `_loadModel()` 可能创建多个 pipeline 实例。如果并发问题出现，考虑添加 `_loading` 锁标志。

### 4. 降级搜索的 Jaccard 震荡误报
当模型加载失败触发降级（返回最近添加的文档），结果集可能与前一次搜索完全不同——这是降级导致的伪震荡，不是真正的结果不稳定。建议在降级时跳过震荡检测。

### 5. `search()` 参数格式兼容
从 `search(query, topK)` 改为 `search(query, options)` 时，必须处理 `search('text', 5)` 这种旧式调用。用 `typeof options === 'number'` 检测并回退。
