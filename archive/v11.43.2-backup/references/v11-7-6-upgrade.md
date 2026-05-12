# HeartFlow v11.7.6 技术参考

## 新增模块

### Mem0 Memory Engine (`src/core/mem0-memory.js`)
整合 Mem0 ⭐54765 v3 (April 2026) 核心算法：

| 特性 | 实现 | 性能指标 |
|------|------|---------|
| Multi-Signal Retrieval | 语义(Jaccard) + BM25 + 实体 并行融合 | LoCoMo: 91.6, LongMemEval: 93.4 |
| ADD-only | 记忆累积不覆盖，单次 LLM 调用 | Token: ~7KB/query |
| Entity Linking | 实体跨记忆自动链接 | BEAM 1M: 64.1 |
| Agent Facts First-Class | Agent 确认的行动同等权重存储 | — |

**关键类**：`MemoryItem` / `BM25Indexer` / `EntityExtractor` / `MultiSignalMemory` / `Mem0Memory` / `createMem0Agent`

### Eval Engine (`src/core/eval-engine.js`)
整合 TruLens ⭐3288 评估框架：RAG Triad / HHH评估 / Feedback Functions工厂 / Experiment Tracking

### Stateful Agent 整合
`AgentMemory` 底层升级为 Mem0 MultiSignalMemory，新增 `saveAgentFact()`/`reinforce()`/`searchKeywords()`/`searchEntities()`

---

## 调试踩坑记录 (高频模式)

### 1. 工厂闭包内 `this` 上下文丢失
**问题**：`FeedbackFunction.evaluate` 工厂返回的闭包中 `this._tokenize()` 为 undefined。
**修复**：将工具函数提取为模块级独立函数 `_tokenize()`，闭包内直接调用。
```js
// ✅ 模块级函数，闭包内直接调用
function _tokenize(text) { return text.toLowerCase().split(/\s+/); }
evaluate: async (args) => { const t = _tokenize(text); }
```

### 2. `stats` 属性名 vs 方法名冲突
**问题**：`this.stats = {...}` 和 `stats() {}` 同名，方法覆盖属性。
**修复**：属性改 `this._stats`，方法保持 `stats()`。

### 3. 中文分词必须特殊处理
**问题**：纯英文空格分词处理中文返回空数组，Jaccard 全为 0。
**修复**：英文按空格+标点，中文按单字符 `[\u4e00-\u9fff]`。

### 4. 固定维度向量 cosine similarity 维度不匹配
**问题**：不同文本词袋向量维度不同（vocab.size 决定）。
**修复**：改用 Jaccard 相似度（交集/并集），天然支持变长输入。

### 5. BM25 分数与其他信号融合时量纲失衡
**修复**：对数压缩后归一化 `Math.log(score + 1) / Math.log(max + 1)`。

### 6. Patch 后双重 module.exports
**教训**：patch 的 `old_string` 必须全局唯一，必要时读取完整文件确认边界。

### 7. EvalResult 构造丢失 feedback.tags
**修复**：`EvalResult` 从 `options.feedback?.tags` 读取，`FeedbackFunction.run()` 显式传递 `tags: this.tags`。
