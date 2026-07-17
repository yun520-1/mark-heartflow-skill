# MCP CORE 记忆搜索索引缺口

> 2026-06-15 发现：`addCore()` 写入 CORE 层后，`searchByKeywords()` 搜不到新条目。

## 问题

MCP 的 `heartflow_memory_search` 工具使用 `searchByKeywords` 搜索 CORE 层记忆。
但通过 `addCore()` 新写入的条目无法被 `searchByKeywords` 找到。

## 根因

`MeaningfulMemory` 有两个独立的存储系统：

| 系统 | 写入 | 读取 | 同步 |
|------|------|------|------|
| **Key-value 存储** | `addCore()` / `store()` / `learn()` | `listCore()` / `getCore()` / `recall()` | 即时写入 JSON 文件 |
| **BM25 语义索引** | `searchByKeywords()` 内部构建 | `searchByKeywords()` | 只初始化时构建，不因 addCore 而重建 |

`addCore` 只写入 key-value 存储（JSON 文件），不会自动触发 BM25 索引重建。
`searchByKeywords` 使用的是独立的 BM25 索引，新写入的条目不在索引中。

## 影响

- `listCore()` 能拿到所有 CORE 条目（含新写入的）
- `searchByKeywords()` 搜不到新写入的条目
- 对于用 `heartflow_memory_search` 作为入口的工具，新 CORE 规则不可见
- 对于用 `listCore()` 的内部逻辑，新 CORE 规则可见

## 诊断方法

```bash
# 方法1：通过 status 确认 CORE 层计数
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_status","arguments":{"detail":"full"}}}' | \
  python3 -c "import sys,json; d=json.loads(sys.stdin); print(json.loads(d['result']['content'][0]['text'])['memoryLayers'])"

# 方法2：searchByKeywords 搜索新写入的条目
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_memory_search","arguments":{"query":"关键词","layer":"core","limit":10}}}' | \
  python3 -c "import sys,json; d=json.loads(sys.stdin); print(json.loads(d['result']['content'][0]['text'])['results']['core'][:2])"

# 如果 status 显示计数 > 0 但 searchByKeywords 返回空 = 索引缺口
```

## 修复方向

### 方案 A：写入时重建索引（侵入性修改）

在 `MeaningfulMemory.addCore()` 中，每次写入后调用 `_rebuildBM25Index()` 或类似方法。
缺点：频繁写入时性能下降；BM25 索引结构可能不在 `MeaningfulMemory` 类中。

### 方案 B：searchByKeywords 降级到 listCore（零侵入）

修改 `mcp-server-http.js` 的 `handleMemorySearch`：当 `searchByKeywords` 返回空但 `listCore` 有内容时，返回 `listCore` 结果作为降级。

```javascript
function handleMemorySearch(args) {
  const { query, layer = 'all', limit = 10 } = args;
  const results = {};
  const mem = heartflow ? heartflow.memory : null;
  if (mem) {
    ['core', 'learned', 'ephemeral'].forEach(l => {
      if (layer !== 'all' && layer !== l) return;
      try {
        let r = null;
        // 先试语义搜索
        if (typeof mem.searchByKeywords === 'function') {
          r = mem.searchByKeywords(query, limit);
        }
        // 语义搜索空结果时降级到 listCore
        if ((!r || (Array.isArray(r) && r.length === 0)) && l === 'core' && typeof mem.listCore === 'function') {
          r = mem.listCore().filter(item => 
            item.key.includes(query) || 
            (item.value && item.value.includes(query)) ||
            (item.tags && item.tags.some(t => t.includes(query)))
          ).slice(0, limit);
        }
        results[l] = r || [];
      } catch (e) { results[l] = { error: e.message }; }
    });
  }
  return { query, layer, limit, results, timestamp: Date.now() };
}
```

### 方案 C：CORE 层全量搜索（最简单）

在 `handleMemorySearch` 中，对 `layer='core'` 时，直接 `listCore()` 后做关键词过滤，跳过 `searchByKeywords`。CORE 层通常只有 10-30 条，全量搜索成本极低。

```javascript
if (l === 'core' && typeof mem.listCore === 'function') {
  const all = mem.listCore();
  r = all.filter(item => 
    item.key.includes(query) || 
    (item.value && item.value.includes(query)) ||
    (item.tags && item.tags.some(t => t.includes(query)))
  ).slice(0, limit);
}
```

## 验证

修复后，用 `heartflow_memory_search` 搜索新写入的 CORE 规则 key（如 `core.problem-solving`）应返回匹配结果。
