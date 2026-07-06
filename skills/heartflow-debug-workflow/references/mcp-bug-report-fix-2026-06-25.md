# MCP Bug Report 修复记录（2026-06-25）

**来源：** 用户提交的 `heartflow_bug_report_bundle.tar.gz`
**问题数：** 9项（P0×4, P1×3, P2×2）
**修复方式：** 3子代理并行 + 手动验证

## 修复清单

| # | 问题 | 修复 | 文件 |
|---|------|------|------|
| 1 | HF_DIR 路径硬编码 | `resolveHFDir()` 三级检测：环境变量→__dirname自动检测→fallback | mcp-server-http.js |
| 2 | SSE endpoint 格式错误 | 发送纯URL字符串而非JSON对象 | mcp-server-http.js |
| 3 | SSE 客户端广播 | `Set`→`Map<sessionId, res>`，sessionId-based 精确路由 | mcp-server-http.js |
| 4 | POST 直接返回结果 | `res.writeHead(202)` + `sendEvent(client, 'message', ...)` SSE推送 | mcp-server-http.js |
| 5 | 认证强制 | `AUTH_TOKEN || null`，未设置时跳过认证 | mcp-server-http.js |
| 6 | @xenova/transformers 卡安装 | `dependencies`→`optionalDependencies` | package.json |
| 7 | VERSION 读取无保护 | 统一 `getVersion()` 函数（VERSION→package.json→'unknown'） | mcp-server-http.js |
| 8 | dreamNow 缺 await | 加 `await` 关键字 | mcp-server-http.js |
| 9 | AsyncFunction 类型检查 | 改用 duck-type Promise 检测（`typeof .then === 'function'`） | mcp-server-http.js |

## 关键教训

### 路径自动检测优先于硬编码
```javascript
// 不要写死路径
const HF_DIR = path.join(process.env.HOME, '.hermes', 'skills', 'ai', 'mark-heartflow-skill');

// 改为自动检测
function resolveHFDir() {
  const envDir = process.env.HEARTFLOW_SKILL_DIR || process.env.HEARTFLOW_DIR;
  if (envDir && fs.existsSync(path.join(envDir, 'src/core/heartflow.js'))) return envDir;
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'src/core/heartflow.js'))) return dir;
    dir = path.dirname(dir);
  }
  return path.join(process.env.HOME, '.hermes', 'skills', 'heartflow');
}
```

### SSE endpoint 必须返回 URL 字符串
MCP 规范要求 `endpoint` 事件的数据是纯 URL 字符串，不是 JSON 对象：
```javascript
// ❌ 错误：发送 JSON 对象
sendEvent(res, 'endpoint', { protocolVersion: '2024-11-05', capabilities: {}, serverInfo: {} });

// ✅ 正确：发送 URL 字符串
const sessionId = crypto.randomUUID();
sendEvent(res, 'endpoint', '/mcp?sessionId=' + sessionId);
```

### 认证改为可选（localhost 模式）
```javascript
const AUTH_TOKEN = process.env.HEARTFLOW_MCP_TOKEN || null;
if (!AUTH_TOKEN) {
  console.error('[MCP] HEARTFLOW_MCP_TOKEN not set. Running without authentication (localhost only).');
}
// 认证检查时，无 token 时跳过
if (AUTH_TOKEN && !safeCompare(token, AUTH_TOKEN)) {
  res.writeHead(401);
  return;
}
```

### 大型依赖移到 optionalDependencies
```json
{
  "dependencies": {},
  "optionalDependencies": {
    "@xenova/transformers": "^2.17.2"
  }
}
```
使用时需 try/catch 保护：
```javascript
let transformers = null;
try { transformers = require('@xenova/transformers'); } catch(e) {}
```

### 验证方法
1. `node --check mcp/mcp-server-http.js` — 语法验证
2. 启动后 `curl http://127.0.0.1:PORT/health` — 健康检查
3. `curl -X POST http://127.0.0.1:PORT/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'` — 工具列表
4. `node bin/cli.js status` — CLI 正常
