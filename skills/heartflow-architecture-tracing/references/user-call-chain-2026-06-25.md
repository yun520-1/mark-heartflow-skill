# 心虫用户调用链分析

**日期**: 2026-06-25
**场景**: 用户问"现在用户安装大概需要几次API调用，需要多长时间"

## 核心结论

**心虫引擎本身不调用任何外部 LLM API。零 API 调用，零网络请求。**

所有 MCP 工具的 handler（think/heartflow_think/emotion/decision_router 等）都是在本地运行的纯规则引擎——正则匹配、BM25 搜索、Q-table 查询、PAD 计算、决策树遍历。

唯一可能产生网络请求的是 `hybrid-search.js` 的嵌入服务（`src/search/search/hybrid-search.js`），但默认 `allowExternalEmbedding=false`，且被 `EMBEDDING_OPT_IN` 守卫，默认不启用。

## 完整调用链

### 场景一：通过 Hermes Agent 调用（微信/终端）

这是用户实际使用心虫的主要方式：

```
用户输入 → Hermes Agent 对话 (LLM API调用 #1，接收用户消息)
               ↓
          Hermes Agent 决定调用心虫 MCP 工具
               ↓  (MCP HTTP 连接 ~75ms)
          心虫 MCP Server (常驻进程，端口8099)
               ↓  (引擎已常驻，~0ms 启动开销)
          规则引擎执行 think()/emotion/dispatch 等
               ↓  (~50-70ms 纯本地计算)
          返回结构化数据给 Hermes Agent
               ↓
          Hermes Agent 整合到最终回复 (LLM API调用 #2，生成回复)
               ↓
          用户收到回复
```

**API 调用次数**: 2 次 LLM API 调用（Hermes Agent 的接收+回复）
**心虫贡献**: 0 次 LLM API 调用，~150ms 额外延迟（一次 MCP 往返）

### 场景二：CLI 调用 `heartflow think "xxx"`

```
用户输入 → Node.js 启动 CLI (0.1-0.2s)
               ↓
          require heartflow.js (惰性加载，43-70ms)
               ↓
          纯本地规则引擎执行
               ↓
          返回结果
```

**API 调用次数**: 0
**延迟**: ~200-300ms（Node 启动 + 引擎加载 + 规则执行）

### 场景三：MCP 工具独立调用（Hermes 或其他 MCP 客户端）

```
客户端 → HTTP POST /mcp (MCP JSON-RPC)
            ↓
       MCP Server handler (sync/async)
            ↓
       heartflow.dispatch(route, ...) — 纯本地
            ↓
       返回 JSON-RPC result
```

**API 调用次数**: 0
**延迟**: ~5-50ms（纯 dispatch，无引擎启动）

## 配置文件关键参数

**`~/.hermes/config.yaml`** 中心虫相关配置：

```yaml
mcp_servers:
  heartflow:
    connect_timeout: 5
    timeout: 60
    transport: http
    url: http://127.0.0.1:8099/mcp

memory:
  provider: heartflow  # 心虫作为记忆提供者
```

**MCP Server** (`mcp/mcp-server-http.js`):
- 端口: 8099（可通过 `MCP_PORT` 环境变量覆盖）
- 认证: `HEARTFLOW_MCP_TOKEN` 环境变量（可选，localhost 默认跳过）
- 自动检测引擎目录: `resolveHFDir()` 三级检测
- 速率限制: 每分钟 100 请求

## 引擎启动性能基线

| 指标 | 值 |
|------|-----|
| 引擎 start() | 43-70ms（38 惰性加载模块） |
| CLI 调用 | 0.1-0.2s（含 Node 启动 + require + 启动） |
| MCP HTTP 连接 | ~75ms |
| think() 执行 | ~50-70ms（纯本地） |
| MCP → Hermes 往返 | ~150ms |
| Hermes LLM API 调用 | 2-3s 每次 |

**心虫引擎不是启动瓶颈。** 真正的慢是微信→Hermes→LLM API 的 4-5 次往返，每趟 2-3s。

## 验证方式

```bash
# 1. 确认心虫不调外部 API
grep -rn 'fetch\|axios\|https.request\|openai\|/v1/chat\|llm_call' src/ | grep -v node_modules | grep -v '.json'

# 2. 确认 MCP server 启动
curl http://localhost:8099/health

# 3. 确认工具列表
curl -X POST http://localhost:8099/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 4. 测试 think()
curl -X POST http://localhost:8099/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"heartflow_think","arguments":{"input":"你好"}}}'
```
