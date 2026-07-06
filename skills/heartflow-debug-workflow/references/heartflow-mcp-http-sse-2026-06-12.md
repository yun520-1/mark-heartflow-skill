# 心虫 MCP HTTP SSE 常驻模式改造记录

**日期**：2026-06-12  
**目的**：将心虫 MCP 从 stdio 模式改为 HTTP SSE 常驻模式，消除每次连接重新加载引擎的开销  
**结果**：连接时间从 ~200ms 降至 ~75ms

---

## 问题

心虫 MCP 原使用 stdio 传输（`command: node` + `args: [mcp-server.js]`）。  
Hermes 每次需要 MCP 工具时启动 Node 进程，进程在 stdin 关闭后退出。  
每次连接都需要重新 require + start 引擎（~200ms），且无法常驻。

## 方案：HTTP SSE 常驻模式

心虫 MCP server 改为 HTTP 服务运行，两个端点：

- `GET /mcp` — SSE 端点（协议发现 + 心跳）
- `POST /mcp` — JSON-RPC 端点（工具调用）
- `GET /health` — 健康检查

引擎在 `initHeartFlow()` 中只加载一次，后续所有 HTTP 请求复用同一实例。

## 关键文件

| 文件 | 说明 |
|------|------|
| `~/.hermes/mcp-servers/heartflow/src/mcp-server-http.js` | HTTP SSE MCP server（新建） |
| `~/.hermes/mcp-servers/heartflow/src/mcp-server.js` | 旧 stdio MCP server（保留，未删除） |
| `~/Library/LaunchAgents/com.heartflow.mcp.plist` | launchd 自启配置（新建） |
| `~/.hermes/logs/heartflow-mcp.log` | MCP server 日志 |
| `~/.hermes/config.yaml` → mcp_servers.heartflow | Hermes 连接配置（从 stdio 改为 HTTP） |

## 连接时间对比

| 模式 | 传输 | 连接时间 | 引擎加载 |
|------|------|---------|---------|
| 旧 stdio | stdin/stdout | ~200ms | 每次重新加载 |
| 新 HTTP | HTTP POST + SSE | ~75ms | 只加载一次 |

## 启动/重启流程

```bash
# 手动启动
/opt/homebrew/bin/node ~/.hermes/mcp-servers/heartflow/src/mcp-server-http.js --port 8099 &

# 验证
curl -s http://127.0.0.1:8099/health
# {"status":"ok","version":"2.10.0","uptime":0.58,"clients":0,"pid":81837}

# 重启（kill 后 launchd 自动重启）
kill $(lsof -ti:8099)
# 等待 ~3 秒后 launchd 重新拉起
```

## 已知问题

1. **当前会话的 MCP client 是旧连接**：`hermes mcp test` 更新配置但不更新当前会话的 MCP client。新对话自动生效。
2. **端口冲突**：手动启动的进程和 launchd 管理的进程抢端口。先 kill 手动进程再让 launchd 接管。
3. **stdin 关闭退出**（已修复）：HTTP 模式不依赖 stdin，`end` 事件不再触发退出。
4. **`/usr/bin/env` 报错**：mcp-server-http.js shebang `#!/usr/bin/env node` 在 macOS 某些环境下不可用。Hermes 配置中 `command: node` 绕过了 shebang。
