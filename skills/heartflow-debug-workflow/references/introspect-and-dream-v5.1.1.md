# introspectAndDream + v5.1.2 修复记录

**日期**: 2026-06-27
**版本**: v5.1.1-v5.1.2
**涉及文件**: `src/core/heartflow.js`, `src/workflow/pipeline.js`

## introspectAndDream() 设计

### 目标
自省发现问题后自动触发梦境，让心虫用梦境处理自己的问题。

### 触发条件
`introspect()` 发现高或中优先级问题（counts.high > 0 或 counts.medium > 0）

### 流程
1. 调 `introspect(options)` 获取问题列表
2. 提取高/中优先级问题的 message + detail 为种子文本
3. 调 `dreamNow({ force: true, function: 'self_inspection' })`
4. 从种子文本中匹配可识别的梦境种子关键词
5. 调 `dream._applySeed()` 注入种子
6. 返回结果含 dream 状态 + 叙事

### 种子关键词匹配
`_applySeed()` 只识别硬编码的 8 个种子名：无门、桥、消散、原点、裂缝、隔阂、因果、延续。从自省问题的拼接文本中匹配第一个出现的已知种子。无匹配时默认"裂缝"。

## v5.1.2 修复清单

### 1. pain 字段为空
- **根因**: `pipeline.js:38` 中 `detectPain()` 返回布尔值 `false`，后续 `ctx.heartLogic?.pain || null` = `null`
- **修复**: 在 heartLogic 阶段将布尔值转为 `{hasPain, painLevel}` 对象
- **验证**: `hf._lastCognition.pain` → `{"hasPain":false,"painLevel":0}`

### 2. LEARNED 记忆层为 0
- **根因**: pipeline output 阶段从不写入记忆
- **修复**: 在 return 前调 `hf.memory.store('learned', key, JSON.stringify(memEntry), tags)`
- **验证**: `hf.memory.getStats().learned` → 1+

### 3. 其他修复
参见 heartflow-github-audit 的 `references/audit-v5.1.2-2026-06-27.md`
