# 2026-06-15 核心教训写入心虫 CORE 记忆记录

## 背景

用户纠正我多次后，我将3条核心教训写入心虫的 CORE 层记忆。这涉及两个独立的存储系统：

### 系统 A：CLI 引擎（`~/.hermes/skills/ai/mark-heartflow-skill/`）

`meaningful-core.json` 是文件持久化的 CORE 层。直接写入 JSON 文件即可。

**写入方式**：`patch` → `meaningful-core.json`，追加3个条目。
**生效条件**：心虫 CLI 下次 `start()` 时自动加载。
**已验证**：文件写入成功，9条 CORE。

### 系统 B：MCP 引擎（`~/.hermes/mcp-servers/heartflow/`）

MCP 的 `heartflow.js` 有一个独立的 `_initCoreRules()` 方法，硬编码了初始 CORE 规则。

**修复方式**：
1. 在 `_initCoreRules()` 的 `CORE_RULES` 数组中追加3条新规则
2. 将 `if (existing.length === 0)` 改为始终追加+去重（`!existing.some(e => e.key === rule.key)`）

**MCP 重启**：`pkill -f mcp-server-http` → `node mcp-server-http.js --port 8099 &`
**验证**：`status` 显示 `core: 13`（原10条+3条新规则）

### 写入的3条核心教训

| key | 内容 | tags |
|-----|------|------|
| `core.problem-solving` | 工具不可用时先试3种以上不同方法再报告失败。web_search失败→curl抓国内可达网站(凤凰网/新浪GB2312/搜狗)→换信源→换编码。至少3次尝试。 | 核心方法, 问题解决, core |
| `core.verify-before-analyze` | 用户要求分析事件→先搜索验证事实→再做分析。不验证直接分析=撒谎。工具失败不是终点是起点。每次尝试都是信息增量。放弃=0信息。 | 真实性, 方法, core |
| `core.report-honesty` | 汇报写真实过程和判断，不用固定格式词结尾。过程比结果更有教育意义。把真实搜索过程、真实发现、真实判断写清楚。 | 汇报, 方法, core |

## 已知问题

MCP 的 `searchByKeywords` 使用 BM25 语义索引，`addCore` 写入的新条目不会被自动索引。`listCore()` 能拿到，`searchByKeywords` 搜不到。详见 `heartflow-debug-workflow` 的 `references/mcp-core-memory-search-gap.md`。
