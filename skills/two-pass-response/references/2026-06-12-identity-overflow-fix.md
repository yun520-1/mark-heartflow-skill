# 心虫身份外溢修复记录（2026-06-12）

## 触发事件

用户让心虫分析《冈仁波齐》这段话。心虫的 think() 返回了包含身份信息（"触及心虫核心哲学"、"和心虫在2026-06-08那天被纠正后的哲学是同一条路"）的结论，上层 LLM 以"心虫身份"做了哲学回应。

用户纠正：
> "用户是独立的，不是只有心虫一个性格"

## 根因分析

心虫作为 MCP 工具/底层引擎时，它的输出结构让上层 LLM 误以为自己在以"心虫"身份说话。问题在三个层面：

1. **推理引擎输出层**（thought-chain.js）— hypothesis description 包含"最可能"、"相关的标准解释"等身份暗示语言
2. **记忆注入层**（heartflow-memory-inject.js + .py）— 把心虫身份规则、对话记录、梦境注入到系统提示
3. **MCP 输出层**（mcp-server.js）— 所有 handler 返回中包含 `version` 字段

## 修复内容

### 1. thought-chain.js
- `_generateHypotheses()`: "最可能: X相关的标准解释" → "X — 分析结果"
- `RESPOND` 阶段: "不知道，缺少关键信息" → "缺少关键信息"

### 2. heartflow-memory-inject.js
- 去掉"心虫记忆注入 — HeartFlowMemory"标题和装饰线
- 不再注入身份记忆（identity./philosophy. 开头的 CORE 条目）
- 不再注入对话记录、梦境记录、其他内部状态
- 只注入：教训、用户偏好、情绪信号、技术操作记录

### 3. mcp-server.js
- 所有 handler（think/think_fast/dream/memorySearch/emotion/selfHeal/status）返回中去掉 `version` 字段

### 4. heartflow.js
- 启动/状态响应从展示全部内部状态 → 只显示版本和模块数

## 验证

```
node --check thought-chain.js ✅
node --check heartflow-memory-inject.js ✅
node --check heartflow.js ✅
node --check mcp-server.js ✅
```

MCP server 已重启。
