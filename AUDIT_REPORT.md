# HeartFlow Security Audit Report

> 审计日期：2026-07-14  
> 审计范围：`formulas/`、`mcp/`、`transformers/` 相关代码路径  
> 审计员：自动安全审计  
> 代码版本：ae71cf7f (v6.0.0)  

---

## 审计摘要

本次审计聚焦三个核心子模块：

1. **formulas** — `mathjs.evaluate()` 表达式注入风险
2. **mcp** — stdio/HTTP 输入验证、消息体限制、认证与授权
3. **transformers** — `@xenova/transformers` 模型加载安全性与完整性校验

整体结论：项目已实施多项审计修复，部分高风险面已有缓解措施，但仍存在若干可被利用或可改进的安全缺口，详见下文。

---

## 严重问题 (P0)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P0-1 | **公式库未签名/未哈希验证** — 若 `formulas/formulas.json` 被篡改，攻击者可注入任意 mathjs 表达式并达到代码执行效果 | `src/formula/formula-search.js`、`src/formula/formula-calculator.js` | 高 | 对公式库实施 JSON schema + 发布时哈希/签名校验；运行时拒绝异常结构或签名不匹配的公式 |
| P0-2 | **MCP 通用路由缺乏参数白名单** — `heartflow_dispatch` 允许调用任意内部路由，若被未授权调用可能导致内部状态泄露或越权操作 | `mcp/mcp-server-stdio.js:269-274`、`src/mcp-server.js` dispatch 相关 handlers | 中高 | 对 `heartflow_dispatch` 增加路由白名单，并移除或严格限制 stdio 版本的通用路由暴露 |
| P0-3 | **模型加载无完整性校验** — `@xenova/transformers` 远程或本地模型文件未做 hash/signature 校验，存在供应链投毒或本地替换风险 | `src/search/semantic-search.js:354-381` | 高 | 对模型文件增加 SHA-256 校验；支持 pinned revision / localModelPath 白名单；禁止自动下载不可信来源模型 |

---

## 中等问题 (P1)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P1-1 | **HTTP MCP 消息体无 JSON schema 校验** — `tools/call` 仅检查 `name` 存在性，不校验 `arguments` 结构，异常输入直接进入业务逻辑 | `mcp/mcp-server-http.js:1238-1250`、`src/mcp-server.js` tools/call 分支 | 中 | 按 `TOOLS[].inputSchema` 实现运行时参数校验，非法参数返回 `-32602` |
| P1-2 | **部分 handler 存在路径注入风险** — `benchmark_run`/`benchmark_import_failures` 接受 `dataDir`/`filePath`，虽有 `confinePath` 但 stdio 版本未见同等限制 | `src/mcp-server.js:1075-1146` vs `mcp/mcp-server-http.js` | 中 | 统一所有文件系统访问使用 `confinePath`；stdio 版本增加同等约束 |
| P1-3 | **transformers 本地模型路径未校验** — `modelPath` 可直接指向任意目录，若攻击者控制该参数可加载恶意 ONNX 模型 | `src/search/semantic-search.js:195-197` | 中 | 限制 `modelPath` 至受控目录；支持模型目录白名单 |
| P1-4 | **错误信息可能泄露路径/环境细节** — 多个 catch 块直接返回 `err.message`，可能暴露内部路径、堆栈或模型信息 | 多文件 | 中 | 统一错误处理中间件，生产环境仅返回 sanitized message |

---

## 轻微问题 (P2)

| # | 问题 | 位置 | 严重程度 | 建议 |
|---|------|------|----------|------|
| P2-1 | **缺少消息体大小限制的 fallback 策略** — 当前 HTTP 版 1MB 限制合理，但未对不同 tool 设置差异化上限 | `mcp/mcp-server-http.js:1246-1261` | 低 | 对 `benchmark_*`、`knowledge_*` 等 heavy tools 设置更小上限 |
| P2-2 | **SSE 客户端未显式认证绑定** — sessionId 为随机 UUID，但未与 auth token 做会话绑定，理论上存在 session 劫持窗口 | `mcp/mcp-server-http.js:1210-1228` | 低 | 将 sessionId 与 token hash 关联，清理时校验所有权 |
| P2-3 | **mathjs 配置未完全冻结** — 虽禁用了 `import`/`createUnit`，但未显式禁用 parser/evaluator 的所有扩展点 | `src/formula/formula-calculator.js:9-17` | 低 | 在 `create()` 时传入最小化配置，仅启用计算必需函数 |
| P2-4 | **模型加载重试可能导致资源耗尽** — `_loadModel` 最多重试 2 次且无退避上限保护，并发场景下可能占用过多线程/内存 | `src/search/semantic-search.js:357-377` | 低 | 增加指数退避 + 最大并发加载限制 |

---

## 详细技术发现

### 1. formulas — mathjs.evaluate 表达式注入

**现状**
- `formula-calculator.js` 已禁用 `math.import`、`createUnit`，并强制参数类型为 number。
- 计算公式时，流程为：读取 `formulas.json` → 提取 `formula.formula` → 参数替换 → `math.evaluate(expression)`。

**风险**
- 如果 `formulas/formulas.json` 被攻击者篡改，可插入类似 `system('...')` 或利用 mathjs parser 的副作用函数。
- `mathjs.evaluate` 在沙箱外执行时，若实例被污染，可执行任意 JavaScript。
- `_substituteParams` 中的正则替换若遇到精心构造的 key，可能破坏表达式结构。

**缓解不足**
- 无公式来源完整性校验。
- 无公式内容静态分析或白名单。
- `_substituteParams` 未限制参数 key 的字符集。

### 2. mcp — stdio/HTTP 输入验证

**现状**
- HTTP 版强制 Bearer token，使用 `crypto.timingSafeEqual`，有 token/IP 双重速率限制。
- 请求体限制 1MB，支持 SSE + JSON-RPC over HTTP。
- stdio 版无认证机制，依赖本地进程隔离。

**风险**
- **参数注入**：多数 handler 直接透传 `args` 到 `heartflow.dispatch()`，无 schema 校验。
- **路径遍历**：`benchmark_*`、`knowledge_*` 等工具涉及文件系统访问，需确保 confinePath 全覆盖。
- **通用路由滥用**：`heartflow_dispatch` 暴露内部路由前缀，若 token 泄露可遍历 engine 内部 API。
- **DoS**：无 tool 级别超时；单个长时间运行的 tool 会阻塞事件循环或占用 SSE 连接。

### 3. transformers — 模型加载安全

**现状**
- `SemanticSearch` 懒加载 `@xenova/transformers` 的 `feature-extraction` pipeline。
- 支持远程模型名或本地 `modelPath`。
- 量化加载，默认 `all-MiniLM-L6-v2`。

**风险**
- **供应链攻击**：远程模型从 HuggingFace Hub 下载，未校验 hash，若 CDN 被投毒或模型仓库被篡改，可加载恶意 ONNX 模型。
- **本地模型替换**：`modelPath` 指向本地目录时，攻击者可替换 `onnx/model.onnx` 等文件。
- **信息泄露**：模型加载错误信息可能暴露目录结构、网络环境。
- **资源耗尽**：大模型或恶意模型可能导致内存/CPU 耗尽。

---

## 合规与最佳实践对照

| 检查项 | 现状 | 建议状态 |
|--------|------|----------|
| 输入验证 | 部分工具有类型检查，缺 schema 校验 | 应全工具 schema 校验 |
| 输出编码 | JSON 序列化自动转义 | ✅ |
| 认证 | HTTP 版 Bearer token + timing-safe compare | ✅ stdio 版缺认证 |
| 授权 | 无细粒度授权，仅单一 token | 建议 role-based tool 授权 |
| 速率限制 | IP + token 双重限制 | ✅ |
| 完整性校验 | 公式库、模型文件均无 hash | ❌ 需修复 |
| 日志安全 | 部分错误信息可能泄露路径 | 需 sanitize |
| 依赖安全 | mathjs ~15.2.0, @xenova/transformers | 需定期 audit |

---

## 修复建议优先级

### 立即执行 (P0)
1. **公式库签名** — 在发布流程中对 `formulas.json` 生成 SHA-256 哈希，并在 `FormulaSearch.loadFormulas()` 时校验。
2. **限制通用路由** — `heartflow_dispatch` 改为路由白名单，或移除 stdio 暴露。
3. **模型文件校验** — 为默认模型记录 expected hash；加载后比对；支持 `modelPath` 白名单。

### 近期执行 (P1)
4. **MCP 参数 schema 校验** — 实现轻量 JSON Schema validator，对所有 `TOOLS[].inputSchema` 做运行时校验。
5. **统一 confinePath** — 确保所有文件系统访问都经过路径约束。
6. **sanitize 错误输出** — 统一错误响应格式，避免内部细节泄露。

### 中期执行 (P2)
7. **tool 级超时** — 为 heavy tools 设置执行超时。
8. **SSE 会话绑定** — 将 session 与 token 关联。
9. **mathjs 最小化配置** — 显式禁用所有非必需功能。

---

## 审计方法说明

- 静态代码审查：人工阅读关键路径源码。
- 模式匹配：搜索 `mathjs.evaluate`、`pipeline(`、`req.body`、`fs.readFileSync` 等风险 API。
- 交叉比对：对比 `mcp/mcp-server-http.js` 与 `src/mcp-server.js`，确认安全修复是否同步。
- 未执行动态测试或模糊测试。

---

## 结论

`formulas/` 的表达式注入风险主要来自**数据源不可信**而非 mathjs 本身；`mcp/` 的输入验证在 HTTP 层较完整，但在业务参数层仍薄弱；`transformers/` 的模型加载安全依赖**供应链可信**，当前缺乏完整性校验。建议按 P0→P1→P2 顺序逐步修复，并在 CI 中增加对应安全测试门禁。
