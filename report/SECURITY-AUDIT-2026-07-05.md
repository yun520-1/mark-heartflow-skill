# 安全审计报告 — mark-heartflow-skill v5.7.4

> 审查日期：2026-07-05
> 扫描范围：`src/` + `mcp/` 全量 JS 文件

---

## 安全评分：B+ (良好)

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 硬编码凭据 | ✅ 通过 | 未发现 API keys、密码、令牌 |
| 命令注入 | ✅ 通过 | 使用 execFileSync + 参数数组 |
| 沙箱机制 | ✅ 通过 | 阻断 require/eval/child_process |
| 文件权限 | ✅ 通过 | 0o600/0o700 保护敏感文件 |
| 路径遍历 | 🟡 注意 | 建议增加 path.resolve + 白名单 |
| 原型污染 | ✅ 通过 | 无深层 merge 操作 |
| ReDoS | ✅ 通过 | 正则表达式无嵌套量词 |
| 环境变量 | ✅ 通过 | 无敏感 env 泄露 |

---

## 详细发现

### 🔴 CRITICAL（无）

### 🟠 HIGH（无）

### 🟡 MEDIUM

| # | 位置 | 问题 | 建议 |
|---|------|------|------|
| 1 | 全项目 fs 操作 | 路径遍历风险 | 所有 fs 操作前 path.resolve + 白名单校验 |
| 2 | code-executor.js | 沙箱可被绕过风险 | 定期审查阻断列表完整性 |

### 🟢 INFO

| # | 位置 | 说明 |
|---|------|------|
| 1 | memory.js:164 | 密钥文件写入 mode: 0o600 — 正确 |
| 2 | code-executor.js:701 | execFileSync 使用参数数组 — 正确 |
| 3 | boundary-negotiation.js | tokenize 方法无外部副作用 |

---

## 安全机制说明

### 代码执行沙箱

`code-executor.js` 实现了三层防护：
1. **API 阻断** — 禁用 require/eval/Function/child_process/process
2. **命令解析** — 将 shell 字符串拆分为 command + args 数组
3. **超时控制** — 所有外部命令有 2-3 秒超时

### 记忆系统保护

- 密钥文件使用 `mode: 0o600`（仅所有者可读写）
- WARNING 机制检测过于宽松的文件权限
- Windows 环境降级提示
