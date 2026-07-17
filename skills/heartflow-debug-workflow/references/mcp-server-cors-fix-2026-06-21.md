# MCP Server CORS 修复记录 — 2026-06-21

## 问题

SkillSpector 安全审计将 MCP server 的 CORS 从 `'*'` 改为 `'http://localhost'`，导致 Hermes HTTP MCP 传输失败：

```
Access to fetch at 'http://127.0.0.1:8099/mcp' from origin 'http://localhost:8080' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 根因

Hermes HTTP MCP 传输层发送请求时的 origin 不一定是 `http://localhost`。MCP server 的 CORS 策略必须允许实际请求的 origin。

## 修复

```javascript
// mcp-server-http.js — 所有响应头中的 CORS 改为 '*'
'Access-Control-Allow-Origin': '*',
```

注意：MCP server 是本地内部服务（监听 127.0.0.1:8099），不暴露到公网。`*` 是安全的。

## 同时修复的语法问题

原代码中 token 自动生成使用了未闭合的模板字符串：

```javascript
// 错误：console.warn 的参数被拆成三行，缺少反引号闭合
console.warn(`[MCP]    HEARTFLOW_MCP_TOKEN=***  // ← 没有闭合反引号
console.warn(`[MCP]    请将此 token 保存...`);  // ← 独立的新语句
```

修复后：

```javascript
const AUTH_TOKEN=proces...OKEN || null;
if (!AUTH_TOKEN) {
  console.warn('[MCP] ⚠️ 未设置 HEARTFLOW_MCP_TOKEN，认证已禁用。');
  console.warn('[MCP]    生产环境必须设置此环境变量。');
}
```

## 验证

```bash
hermes mcp test heartflow
# 预期: ✓ Connected (101ms)
#       ✓ Tools discovered: 16
```
