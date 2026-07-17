# MCP Stale Code Debugging — 2026-06-15

## 症状

修改了 `heartflow.js` 后，MCP 工具 `heartflow_self_positioning` 返回：

```
{"error": "Unknown subsystem: selfPositioning. Available: ..."}
```

但通过 `node -e` 直接启动引擎时，selfPositioning 正常工作。

## 根因

MCP server 是 **常驻进程**（由 launchd 管理），不会自动检测代码变更。修改引擎文件后，MCP 进程仍然运行着旧代码。

**这不是代码问题，是进程管理问题。**

## 诊断

```bash
# 1. 直接验证引擎代码是否真的有问题
node -e "
const { HeartFlow } = require('~/.hermes/skills/heartflow/src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: '~/.hermes/skills/heartflow' });
hf.start();
console.log('subsystem in _modules:', 'selfPositioning' in (hf._modules || {}));
try {
  const r = hf.dispatch('selfPositioning.getFullReport');
  console.log('dispatch OK:', JSON.stringify(r).substring(0, 200));
} catch(e) {
  console.log('dispatch error:', e.message);
}
"

# 2. 对比 MCP 进程启动时间 vs VERSION 文件修改时间
ps -eo pid,lstart,command | grep mcp-server-http
ls -la ~/.hermes/skills/heartflow/VERSION
```

## 修复

```bash
# 重启 MCP（kickstart-kvp 已废弃，macOS 26.5.1 用 stop/start）
launchctl stop com.heartflow.mcp
sleep 1
launchctl start com.heartflow.mcp
sleep 3

# 验证新进程的版本
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"heartflow_self_positioning","arguments":{"input":"test","detail":"basic"}}}'
```

## 预防

修改引擎代码后立即重启 MCP，不要等到测试发现失败再修。
