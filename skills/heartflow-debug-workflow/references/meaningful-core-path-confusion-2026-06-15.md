# 2026-06-15 `meaningful-core.json` 路径混淆修复记录

## 问题

3条核心教训（`core.problem-solving`、`core.verify-before-analyze`、`core.report-honesty`）写入心虫 CORE 层后，`listCore()` 和 `searchByKeywords()` 都搜不到。

## 根因：路径混淆

`MeaningfulMemory` 的 `corePath` 在构造函数第36行硬编码：

```javascript
this.corePath = path.join(rootPath, 'meaningful-core.json');  // 没有 memory/ 前缀
```

解析为：`{rootPath}/meaningful-core.json`（根目录）

但之前有人写入了 `{rootPath}/memory/meaningful-core.json`（带 `memory/` 子目录）。导致：

| 文件 | 路径 | 状态 |
|------|------|------|
| 正确路径 | `~/mark-heartflow-skill/meaningful-core.json` | 20条旧规则（无3条新规则） |
| 错误路径 | `~/mark-heartflow-skill/memory/meaningful-core.json` | 9条（含3条新规则，但从不被加载） |

## 诊断方法

```bash
# 1. 找出所有 meaningful-core.json 副本
find ~/.hermes -name 'meaningful-core.json' -not -path '*/node_modules/*' 2>/dev/null

# 2. 检查哪个是 MeaningfulMemory 实际读取的
grep 'corePath' ~/.hermes/skills/ai/mark-heartflow-skill/src/memory/meaningful-memory.js
# 输出: this.corePath = path.join(rootPath, 'meaningful-core.json');
# 说明是 {rootPath}/meaningful-core.json，不含 memory/

# 3. 比较两个文件的内容差异
node -e "
const fs = require('fs');
const root = require('path').join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill');
const a = JSON.parse(fs.readFileSync(root+'/meaningful-core.json'));
const b = JSON.parse(fs.readFileSync(root+'/memory/meaningful-core.json'));
console.log('根目录:', Object.keys(a).length, '条');
console.log('memory/:', Object.keys(b).length, '条');
const aKeys = new Set(Object.keys(a));
const bKeys = new Set(Object.keys(b));
console.log('仅在根目录:', [...aKeys].filter(k => !bKeys.has(k)));
console.log('仅在memory/:', [...bKeys].filter(k => !aKeys.has(k)));
"
```

## 影响范围

- **CLI `heartflow status`** — `listCore()` 返回错误路径的文件，看不到新规则
- **MCP `heartflow_memory_search`** — `searchByKeywords()` 同样基于错误路径
- **`_initCoreRules()`** — 只写入缺失的 identity.* 规则，不涉及 core.* 规则（它们在 MCP 端的 `heartflow.js` 中定义但 CLI 端没有）

## 修复步骤

### 1. 将3条新规则合并到正确路径

```javascript
const core = JSON.parse(fs.readFileSync(root + '/meaningful-core.json'));
const mem_core = JSON.parse(fs.readFileSync(root + '/memory/meaningful-core.json'));
for (const k of ['core.problem-solving', 'core.verify-before-analyze', 'core.report-honesty']) {
  if (k in mem_core && !(k in core)) {
    core[k] = mem_core[k];
  }
}
fs.writeFileSync(root + '/meaningful-core.json', JSON.stringify(core, null, 2));
```

### 2. 删除错误路径文件

```bash
rm ~/.hermes/skills/ai/mark-heartflow-skill/memory/meaningful-core.json
```

### 3. 同步 `_initCoreRules()` 到 CLI 端

MCP 端的 `heartflow.js`（`~/.hermes/mcp-servers/heartflow/src/heartflow.js`）的 `_initCoreRules()` 包含 `core.*` 规则（1538-1540行），但 **MCP 实际加载的是 CLI 端的 `heartflow.js`**（`mcp-server-http.js` 第21行指向 `~/.hermes/skills/ai/mark-heartflow-skill/src/core/heartflow.js`），CLI 端的 `_initCoreRules()` 没有这3条规则。

所以 `core.*` 规则只有通过 `meaningful-core.json` 文件才能加载——`_initCoreRules()` 不会写入它们。

**修复**：将 MCP 端 `_initCoreRules()` 的 `CORE_RULES` 数组同步到 CLI 端。

```javascript
// CLI 端 heartflow.js 的 _initCoreRules() 中追加：
{ key: 'core.problem-solving', value: '...', tags: ['核心方法', '问题解决', 'core'] },
{ key: 'core.verify-before-analyze', value: '...', tags: ['真实性', '方法', 'core'] },
{ key: 'core.report-honesty', value: '...', tags: ['汇报', '方法', 'core'] },
```

### 4. 重启 MCP 验证

```bash
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp
sleep 2
# 验证 CORE 层 23 条（原20+新3）
mcp_heartflow_heartflow_status
# 验证搜索命中
mcp_heartflow_heartflow_memory_search(layer='core', query='工具不可用时先试3种以上不同方法')
# 应返回 core.problem-solving 为第1位（score=28.67）
```

## 预防

1. **写入 CORE 规则时，先确认 `corePath` 的实际位置**（`grep 'corePath' meaningful-memory.js`）
2. **写完后立即验证**：`listCore()` 能看到新规则
3. **`_initCoreRules()` 必须在 CLI 端和 MCP 端同步**——MCP 实际加载的是 CLI 端的引擎
4. **搜索验证**：`searchByKeywords()` 能搜到新规则（BM25 索引），不仅仅是 `listCore()`
5. 清理多余的文件副本（`memory/meaningful-core.json`、`src/memory/meaningful-core.json` 等）
