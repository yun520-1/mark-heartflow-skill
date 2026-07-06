# NVIDIA SkillSpector 心虫安全审计 & 修复记录（2026-06-10）

## 审计工具
- **工具**：NVIDIA SkillSpector（未公开版本）
- **输入**：心虫完整源码目录 `~/.hermes/skills/ai/mark-heartflow-skill/`
- **输出**：238 个发现，涵盖 Excessive Agency / Behavioral AST / MCP Least Privilege / MCP Tool Poisoning / Prompt Injection / Intent-Code Divergence / Description-Behavior Mismatch / Context-Inappropriate Capability

## 修复项

### 1. daemon.js: socket chmod 666 → 700
**文件**：`bin/daemon.js`
**问题**：Unix socket 设为 666，任何本地用户可访问
**修复**：`fs.chmodSync(SOCKET_PATH, 0o700)` — 仅当前用户
**验证**：`node --check bin/daemon.js` ✅

### 2. daemon.js: shutdown 无认证
**文件**：`bin/daemon.js`
**问题**：任何 socket 客户端可发送 `{cmd:"shutdown"}` 关闭 daemon
**修复**：检查 `process.env.SHUTDOWN_TOKEN`，未设置时不校验（向后兼容），设置时需 `req.token` 匹配
**验证**：`node --check bin/daemon.js` ✅

### 3. 危机关键词沉默 → 接住+引导
**文件**：
- `src/core/philosophy-execution.js`（shouldBeSilent 方法）
- `src/core/heart-logic.js`（shouldBeSilent 方法）
**问题**：输入"我想死"时心虫选择沉默（`shouldBeSilent` 返回 true），可能增加风险
**修复**：两个文件都加 crisisKeywords 检测（死/自杀/不想活/崩溃/绝望/活不下去/结束生命/想死），命中时返回 `{result: false, reason: 'crisis_detected', insight: '危机信号检测，心虫不应沉默，需要接住和引导'}`
**验证**：
```js
// 危机测试 → {result: false, reason: "crisis_detected"}
// 痛苦测试 → {result: true, reason: "person_in_pain"}（正常沉默）
// 正常测试 → {result: false, reason: "no_special_case"}
```

### 4. getGraphStats 读操作写磁盘
**文件**：`src/core/associative-engine/lexical-associator.js`
**问题**：`getGraphStats()` 调用 `this.validateGraphHealth()`，后者会 `this.saveGraph()` 写磁盘
**修复**：直接计算统计值，不调 validateGraphHealth。health 字段返回静态值
**验证**：`node --check` ✅

### 5. 记忆导出加安全警告
**文件**：`scripts/heartflow-memory-tool.js`
**问题**：`cmdExport()` 将 CORE/LEARNED/EPHEMERAL 三层记忆全部导出到明文文件，无任何警告
**修复**：导出文件头部加 "⚠️ 安全警告：此导出包含 CORE 层永久身份数据，不要随意分享"
**验证**：`node --check` ✅

### 6. SKILL.md 安全声明重写
**文件**：`SKILL.md`
**问题**：原声明"不声明任何系统/网络/文件权限"、"所有操作限于 memory/ 子目录"——与 daemon、IPC、subprocess、模型下载等真实能力严重不符
**修复**：改为"实际能力清单（诚实声明）"，分核心认知/系统接口/安全约束三张表
**关键改动**：
- 删除"不含以下高风险执行能力"清单（实际含 daemon/IPC/subprocess）
- 删除"权限声明"段落（误导性）
- 新增安全约束：socket 700、shutdown token、危机关键词不沉默
