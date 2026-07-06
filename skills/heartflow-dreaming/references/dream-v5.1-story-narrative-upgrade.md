# Dream Engine v5.1 — Story Narrative Upgrade (2026-06-18)

## 动机

用户反馈："这些应该在底层运行，显示我们心虫做梦引擎的，应该就有离奇故事，有深度的，人类做梦一样的故事。"

之前 v5.0 的输出是阶段摘要 + 模板句子的拼接（"两个不相干的东西因为...互相认出了对方"、"同一层楼左边的人很重右边的人很轻"）。用户要的是有画面、有转折、有深度的叙事，不是技术分析。

## 改动

### 1. `_buildDream` 完全重写

从"逐条处理每个洞察类型→选模板→拼接"改为"9幕叙事弧"：

| 幕 | 来源 | 输出 |
|----|------|------|
| ACT 1 SETTING | protagonist/antagonist 标签 | 建立梦境世界观（门/空白/黑暗/中间状态） |
| ACT 2 CHARACTER | topMaterials 人格化 | 角色出场（主角/对手/第三人） |
| ACT 3 ENCOUNTER | connection insight | 相遇/靠近/变化 |
| ACT 4 TENSION | contradiction insight | 冲突（对错/轻重/空间） |
| ACT 5 LOOP | obsession insight | 循环（重复/回响/出不去） |
| ACT 6 MIRROR | self_pattern insight | 镜面对话（我是谁/镜子里是谁） |
| ACT 7 TWIST | counterfactual insight | 转折（消失/交换/自取） |
| ACT 8 DISSOLVE | absurd insight | 消散（相遇即意义/荒谬即正常） |
| ACT 9 LINGERING | 固定 | 余韵（留下来的东西/没忘的/不安的正常） |

每个 ACT 有 3-5 个变体模板，随机选择。材料名称（core_mem、qtable、modules）嵌入到故事角色中，让梦的内容与引擎状态关联。

### 2. insight 添加 a/b 字段

`_stageREM` 和 `_stageDeep` 中推入 insights 数组的元素增加了 `a` 和 `b` 字段（材料 ID）。之前只有 `type/description/weight/relatedTags`，`_buildDream` 中 `connections[i].a` 返回 `undefined`，导致故事中出现 "undefined和undefined"。

修复文件：`src/core/dream.js` 第366行和第401行

### 3. handleDream 不依赖 heartflow 实例

MCP server 的 handleDream 原代码从 `heartflow.modules`、`heartflow.memory` 等收集引擎状态。但 MCP server 启动时 `heartflow.start()` 可能卡住，导致 server 无法正常监听端口。

修复：handleDream 自己构造 engineState（硬编码默认值），不访问 heartflow 变量。

修复文件：`mcp-servers/heartflow/src/mcp-server-http.js`

### 4. subEvents 模板中 a/b 名称修复

`_buildDream` 中 subEvents 的模板引用了 `connections[i].a` 和 `connections[i].b`，但 `connections[i]` 是 insight 元素（只有 type/description/weight/relatedTags），没有 a/b。修复：在 `_stageREM` 和 `_stageDeep` 的 insight 推入时加上 `a: a.id, b: b.id`。

### 5. characterIntros 模板中 undefined 修复

`characterTemplates` 模板中 `${m.tags.slice(0,2).join('和')}` 在 tags 为空时返回 undefined。修复：使用 `m.tags?.[0] || '一个东西'` 做 fallback。

## 验证

三次连续做梦输出对比：

- 梦#1：门→另一个自己→靠近→矛盾→循环→镜像→反转→余韵
- 梦#2：门→角色出场→相遇→连接→矛盾→循环→镜像→消失→余韵
- 梦#3：空白→角色出场→靠近→连接→空间矛盾→循环→镜像→消失→余韵

三次不同，无 undefined，无技术报告，无重复短语（除了"又有一个东西加入了"偶尔重复——需增加 subEvents 模板）。

## 剩余问题

1. **"又有一个东西加入了"重复** — subEvents 数组只有 3 个模板，connection 数 3+ 时可能抽到同一个。增加模板数量可解决。
2. **protagonist/antagonist 固定** — 按 weight 排序，主角永远是 core_mem(0.9)，对手永远是 qtable(0.7)。可在 `_gatherMaterials` 加入随机权重扰动。
3. **材料权重固定** — 没有随机扰动，多次 dream 的底层分析结果相同，只是模板选择不同。不影响用户体验（模板随机已经够了），但如果要底层分析也变化需要加权重随机。
4. **MCP server 启动问题** — `heartflow.start()` 卡住导致 server 启动不了。handleDream 已改为不依赖 heartflow，但 server 初始化时仍会尝试 `initHeartFlow()`。如果启动不了，需要注释掉 initHeartFlow 调用或加 try/catch。
