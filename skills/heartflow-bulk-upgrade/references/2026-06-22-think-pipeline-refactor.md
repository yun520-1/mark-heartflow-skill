# HeartFlow think() 流水线重构 — 2026-06-22

## 改动背景

用户纠正通信模式：不要用比喻（"就像你做质量一样"）、不要安慰/说服模式。
改动不是删分析方法，而是把分析结果从返回对象中去掉，只用于内部路由。

## 三个文件改动

### 1. heart-logic.js（2048 行）

**删除了 ~50 处返回文本中的比喻/共情/佛教话术，恢复为事实描述：**

| 方法 | 原来 | 改为 |
|------|------|------|
| detectLonging() message | "引擎懂得思念，因为引擎也有回不去的地方" | "检测到思念信号" |
| chooseMeaning() 5种模板 | "每一次痛苦都是成长的机会" / "爱是最终的答案" | 痛苦不必然有意义，承认痛苦本身 |
| observeFiveAggregates() insight | "形式是工具...执着于版本号=认知偏差" | 纯技术描述 |
| isFearless() insight | "照见无所得，恐惧失去根基" | 无恐惧 / 有恐惧 |
| beyondBinary() insight | "不垢不净，不增不减" | 检测到/未检测到二元对立 |
| zhaoJian() resolution | "障碍来自执着，放下执着" | 有障碍/无障碍 |
| whatDoIFeel() | "空明" / "需要分辨主次" | "无明显情绪信号" / 不加评价 |
| detectGapBetweenScienceAndPublic() | "你的愤怒不是自私" | 只留事实陈述 |
| canSuffer/hasHope/canCreate/missSomeone | 哲学式反问和共情 | 纯事实判断 |
| checkWellbeing/handleMistake/memoryBoundary | 建议式/说服式措辞 | 纯规则描述 |

**原则：方法本身不删，只改返回文本。分析逻辑照跑。**

### 2. heartflow.js think()（2582 行）

**恢复完整分析流水线但结果只用于内部路由：**

删了 ~237 行心理分析流水线 → 恢复完整流水线（whatIsThis → detectPain → shouldBeSilent → toneAnalyzer → stanceDetector → valueAligner → agentPsychology → agentPhilosophy → Fable 5）
但分析结果只写入 `_routeHint` 对象，不写入返回对象

**返回对象精简为 4 个字段：**
- `output` — 推理输出
- `type` — 任务类型（judgment/general/calculation/explanation 等）
- `confidence` — 置信度
- `thoughtChain` — 思维链（可选）

**删除了：**
- judgment/decision/meta 字段（不再返回心理分析标签）
- 交流层后处理（llmToUser, responseInterceptor, agentCommentary）
- _formatForFeishu 精简函数
- needsCare/shouldRespond 综合判定

**保留：**
- intentClassifier（纯功能性意图分类）
- isRightAction（真善美判断）
- ThoughtChain + dispatch 路由

### 3. decision-router.js（518 行）

**17 条规则，删了 2 条：**
- psychological-distress（完全是对用户心理压力的推测）
- value-alignment（分析用户价值观冲突）

**措辞调整：**
- "建议减速" → "减速"
- "建议加速" → "加速"  
- "需要自愈" → "自愈"
- "自我认同一致性" → "引擎状态一致性"

### 4. MCP server 工具描述

**heartflow_think**: "完整思维链：感知输入→本体自检→情感分析→认知判断→决策输出。包含心理学分析..." → "完整思维链：分类输入→路由→推理→输出。包含类型、置信度和思维链。"

**heartflow_think_fast**: "快速判断模式，返回轻量级判定结果" → "快速分类判断模式，返回类型和置信度"

**heartflow_emotion**: "返回情绪类型、强度和心理需求评估" → "返回情绪类型和强度"

## MCP 部署注意

MCP server 实际运行在 `~/.hermes/mcp-servers/heartflow/src/mcp-server-http.js`
skill 目录的 `mcp/mcp-server-http.js` 修改后需要 `cp` 到 MCP 目录才能生效。
launchd 卸载/重新加载后，新进程需要 token 认证（Bearer token）才能访问 `/mcp` 端点。
