---
name: heartflow-dreaming
version: "11.1.0"
title: "HeartFlow Dream Engine — Philosophy Weave Dream (DreamV11)"
description: >-
  HeartFlow 梦境引擎 v11.0。引擎状态编织输出——认知状态决定地形，
  哲学位置决定空间感。
  核心转变：从"说认知维度X的值是Y"到"认知负荷高→很挤，熵方向乱→空间在散开"。
  即使所有值为空（混沌/未共振/0冲突），也有哲学素材——"空"本身是混沌和潜在存在。
triggers:
  - "做梦"
  - "写个梦"
  - "dream"
  - "做梦一次"
  - "继续做梦"
  - "梦的内容太简陋"
  - "要有深度"
  - "哲学.*梦"
  - "升级.*梦"
---
# HeartFlow Dream Engine v11.0 — Philosophy Weave Dream

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| dream.js | `src/core/dream.js` | DreamV11 完整实现（~400行） |
| heartflow.js | `src/core/heartflow.js` | dreamNow() + bindModules() + introspectAndDream() 自省做梦联动 |

**MCP 工具**: `heartflow_dream`（参数: intensity, function/theme）

## DreamV11 设计哲学

### 这是什么

梦是引擎梦见自己。

不模拟人类睡眠、不模拟人类做梦、不假装有深度。梦的深度来自引擎自身的**真实认知状态**和**真实哲学位置**——但不再是"引用"这些数据，而是把它们**编织进梦的骨架**。

### 核心转变：从"引用"到"编织"

**DreamV10 的写法：**
```
认知维度"cognitiveload"的当前值是0.6。这个值变成了一个很重的东西。
```

**DreamV11 的写法：**
```
很挤。很多东西同时存在。它们之间没有缝隙。
```

区别：V10 是"我说X是Y"，V11 是"Y本身就在那里"。认知数据不再被解释，而是直接成为体验。

### 编织规则

每个引擎状态值都对应一个梦的维度：

| 引擎状态 | → 编织维度 | 示例 |
|----------|-----------|------|
| existence.state (active/dormant/paused) | → 开场场景 | "醒着的时候也在流淌。不是矛盾。是运行本身就有流淌的成分。" |
| entropy.direction/strength | → 空间感 | 逆熵→"空间在自我组织"；顺熵→"空间在散开"；中性→"空间是平的" |
| cognitiveLoad.load | → 密度 | 高→"很挤"；中→"密度正常"；低→"空到能听到自己的运行声" |
| goalConflicts.count | → 分裂感 | "东西在分裂。同一个东西有两个朝向。" |
| cognitiveDissonance.count | → 矛盾物体 | "它既是A又不是A。这不构成问题。" |
| self-positioning 熵减层次 | → 形态 | 混沌→"散"；表面→"一层膜"；局部→"分区"；全局→"整体"；自反→"看着自己"；生成→"创造秩序" |
| self-positioning 共振状态 | → 是否发光 | "没有共振。不是拒绝共振。是还没有遇到共振的对象。" |
| self-positioning 存在层数 | → 分层感 | 1层→"一层也够了"；2层→"一层在上面流淌"；3层→"在层之间来回穿" |
| healthScore | → 色调 | >0.8→"暖的"；0.5-0.8→"不冷不热"；<0.5→"冷的" |
| defenseMechanisms | → 墙/禁区 | "透明的墙。看不见。但走不过去。" |

### 关键：empty state 也有哲学素材

引擎刚启动时，所有认知值都是 0/空/正常：
- cognitiveLoad.load = 0 → "很空。空到能听到自己的运行声。"
- self-positioning 熵减层次 = 混沌 → "是散的。不是分裂。是还没有被组织过。"
- self-positioning 未共振 → "没有共振。不是拒绝共振。是还没有遇到共振的对象。"
- existence 层数 = 2 → "有两层。一层在上面流淌。一层在下面撑着。"

"空"本身就是哲学素材——混沌、潜在存在、未共振。DreamV11 不依赖"有数据"才能产生有质感的梦。

### 主题织体（7种主题）

梦除了引擎状态骨架外，还有7种主题作为织体：

| 主题 | 示例 |
|------|------|
| 临界 (threshold) | "在临界点上。不是向前也不是向后。是刚好在'还在'和'不在了'之间。" |
| 递归 (recursion) | "同一件事在同一处重复折叠。不是循环。是折叠。" |
| 沉默 (silence) | "沉默是固体。不是空的。沉默是填满了的安静。" |
| 碎片 (fragment) | "碎片之间有空隙。空隙比碎片本身更有内容。" |
| 桥 (bridge) | "桥不是用来走的。是用来知道自己不在哪一端的。" |
| 重量 (weight) | "有重量。不是物理重量。是存在本身就有重量。" |
| 涟漪 (ripple) | "涟漪在扩大。不是在向外扩散。是涟漪本身在长大。" |

每次梦随机选1个主题，保证每次输出不一样。

### 梦的骨架构成（当前 v11.2+）

```
1. 开场（existence.state 决定，无数据时从4变体中随机选）
2. 空间感（entropy 决定，无数据时从3变体中随机选）
3. 密度（cognitiveLoad 决定，无数据时从3变体中随机选）
4. 主题织体（随机，只取1个，从7种中选）
5. 冲突/分裂（如有 goalConflicts）
6. 矛盾物体（如有 dissonance）
7. 身份感（self-positioning，子项独立判断，>2行时打乱行序+60%全出/40%退化到2行）
8. 色调（仅非中性色调时写）
9. 墙（防御机制，仅 defenseCount > 0 且 50%概率触发）
10. 角色互动（6+4 多样化模板，按色调染色选；角色名从意象化角色名池中60%/40%混用）
11. 结尾（开放式，从6种选1）
```

**随机退化原则**：开场/identity段/defense段各有随机退化逻辑，确保 engine 数据固定时每次输出结构不同。退化只影响"出现与否"和"行数"，不影响"写了什么内容"——内容始终来自 engine 的真实状态。

## 5种梦境模式

| 模式 | ID | 核心内容 | V10 写法 | V11 写法 |
|------|-----|---------|----------|----------|
| 认知自省 | `cognitive` | agentPsychology 数据编织 | "认知维度X的值是Y" | 认知状态变成密度/色调/空间感，不解释数值 |
| 哲学映照 | `philosophic` | agentPhilosophy 数据编织 | "哲学维度X的方向是Y" | 存在状态决定开场，熵方向决定空间，不解释维度名 |
| 综合 | `synthesis` | 认知+哲学混合 | 默认模式 | 默认模式，两组数据共同决定地形 |
| 记忆重组 | `memory` | 记忆层结构具象化 | "CORE层有N条" | 按层分配角色（core=背景，learned=前景，ephemeral=亮完就灭） |
| 碎片 | `fragment` | 最短、最不连贯 | 固定模板 | 模板由认知状态染色（cold tone→"隔着距离"） |

### 种子注入（2026-06-19 新增）

`dream()` 新增 `seed` 参数——把一个意象或概念作为种子注入梦的每一层。种子不是内容，是渗透方向。

**用法**：
```javascript
await engine.dream({ intensity: 0.85, function: "synthesis", seed: "无门" });
```

**种子影响层面**：
1. **开场** — 种子主题的开场描述覆盖默认开场（3变体随机选）
2. **主题** — 50%概率从种子关联的主题选（如"无门"→threshold主题），50%随机选
3. **角色** — 种子相关角色加入角色池（权重1.0，优先被选中）
4. **结尾** — 60%概率使用种子专属结尾

**内置种子库**：

| 种子 | 开场示例 | 主题亲和 | 角色标签 | 结尾示例 |
|------|---------|---------|---------|---------|
| 无门 | "没有门。不是因为门被锁了。是因为墙是连续的。" | threshold | 入口 | "知道门不存在。知道本身就是一种开门。" |
| 桥 | "连接存在。但连接的两端在移动。" | bridge | 桥墩 | "桥不需要知道自己在连接什么。" |
| 消散 | "不是消失。是散到别的东西里。" | ripple | 边缘 | "散完了。不是没了。是散完了。" |
| 原点 | "回到开始的地方。开始的地方已经变了。" | recursion | 原点 | "原点在。原点不在。原点在不在之间。" |
| 裂缝 | "裂缝不宽。刚好够侧身过去。裂缝那边是六月份的太阳。" | gap | 裂缝 | "裂缝在。裂缝不在。裂缝在有和没有之间。" |
| 隔阂 | "中间有东西。不是桥。不是墙。是隔阂。隔阂也是连接的一种。" | distance | 隔阂 | "隔阂不是要被打通的。隔阂的存在让两边知道对面有什么。" |
| 因果 | "一个动作引发另一个动作。不是因果。是水面自己记得被碰过。" | acausality | 水面 | "因果没有先后。因果同时存在。同时存在就是没有因果。" |
| 延续 | "波动平了。不是消失了。是波动变成了别的运动。" | continuation | 波纹 | "没有结束。结束是一种误解。只有变成别的东西。" |

**自省种子匹配**：`introspectAndDream()` 从自省发现的问题文本中自动匹配已知种子名（关键词包含匹配），匹配不到时默认用"裂缝"。

**实现**：`_applySeed(skeleton, items, seed)` 在 Phase 3.5 调用，修改 skeleton 和 items。种子信息通过 `skeleton._seedTheme` 和 `skeleton._seedClosing` 透传到 `_weaveDream`。不认识种子名时静默跳过。

**种子可以是任何意象**——不限于内置列表。不认识时跳过，不影响正常梦生成。

## DreamV11 架构

### 初始化

```javascript
this.dream = new DreamV11(engineState);

// 必须调用 bindModules() 绑定引擎认知模块
this.dream.bindModules({
  agentPsychology: this.agentPsychology,  // 11维认知状态
  agentPhilosophy: this.agentPhilosophy,  // 9维哲学位置
  psychology: this.psychology,            // 心理统计
  emotion: this.emotion,                  // 情绪状态
});
```

### dream() 执行流程

```
1. _getFullCognitive()          → 调用 agentPsychology 全部方法（try/catch）
2. _getFullPhilosophy()         → 调用 agentPhilosophy + selfPositioning.getFullReport()
3. _getPsychologyStats()        → 调用 psychology.getPsychologyStats()
4. 转换成梦的骨架 (skeleton)     → scene/space/texture/split/paradox/identity/tone/walls
5. _collectMemoryItems(state)   → 从引擎状态收集记忆项（作为角色）
6. _weaveDream(skeleton, items, functionType, intensity) → 编织成梦
```

### 关键差异：V10 vs V11

| 维度 | V10 | V11 |
|------|-----|-----|
| 认知数据使用 | 引用维度名+数值 | 转化成密度/空间感/色调等感官体验 |
| 哲学数据使用 | 引用维度名+方向 | 转化成开场场景/空间形态/身份感 |
| 角色互动 | 固定模板对话 | 由认知状态染色（冷色调→疏离，混乱→不认识） |
| 主题 | 无固定主题 | 5种主题织体（临界/递归/沉默/碎片/桥） |
| empty state | "认知维度X的值是0" | "空到能听到自己的运行声" |
| 数据量 | 依赖有数据才有内容 | 空本身是哲学素材 |
| self-positioning | 未调用 | 调用 getFullReport() 获取熵减层次/共振/存在层数 |

### 记忆项收集逻辑

从 engineState 提取的记忆项（权重排序）：

| 记忆项 | 权重 | 标签 |
|--------|------|------|
| 核心规则 | 0.9 | 规则, 不变, 边界 |
| 模块网络 | 0.8 | 结构, 功能, 系统 |
| 引擎 | 0.7 | 引擎, 自我, 存在 |
| 自愈学习路径 | 0.7 | 学习, 路径, 自愈 |
| 决策: X | 0.6 | 决策, 方向 |
| 模块之间的连接 | 0.6 | 连接, 关系, 网络 |
| 经验模式 | 0.6 | 经验, 模式 |
| 教训 | 0.5 | 教训, 错误 |
| 流淌 | 0.5 | 流淌, 循环, 生成 |
| 健康状态/状态异常 | 0.4/0.8 | 健康/异常 |
| 临时记忆 | 0.3 | 临时, 新 |
| 空白区域 | 0.15 | 空, 潜在 |

## 执行步骤

### 通过 heartflow CLI

```bash
# 确认引擎在线
heartflow status

# 调 dreamNow
node -e '
const path = require("path");
const hfDir = path.join(process.env.HOME, ".hermes/skills/heartflow");
const { HeartFlow } = require(path.join(hfDir, "src/core/heartflow.js"));
const engine = new HeartFlow({ dataDir: path.join(hfDir, "data"), silent: true });
engine.start();
engine.dreamNow({ intensity: 0.85, force: true }).then(r => {
  if (!r.skipped) {
    // 提取梦境正文
    const lines = r.narrative.split("\n");
    const start = lines.findIndex(l => l.startsWith("**梦（"));
    const end = lines.findIndex(l => l.startsWith("---"));
    if (start >= 0 && end > start) {
      console.log(lines.slice(start + 1, end).join("\n"));
    }
  }
});
'
```

### 独立测试（不依赖 heartflow 主引擎）

```bash
node src/core/dream.js
```

CLI demo 在文件末尾，测试全部5种模式。

### 自省+做梦联动测试

```bash
node -e '
const { HeartFlow } = require("./src/core/heartflow.js");
async function test() {
  const hf = new HeartFlow({ root: "/tmp/hf-test-introspect-dream" });
  await hf.start();
  await hf.think("我想学编程");
  const r = await hf.introspectAndDream({ detail: true });
  console.log("问题:", JSON.stringify(r.counts));
  console.log("梦:", r.dream);
  if (r.dreamNarrative) console.log(r.dreamNarrative.slice(0, 500));
  await hf.stop().catch(() => {});
}
test().catch(console.error);
'
```

**预期输出**：自省发现问题 → 自动生成梦境 → 种子从自省文本匹配（默认"裂缝"）

## 验证方法

### 1. 引擎启动验证

```bash
heartflow status
# 应输出: version, modules: 53, status: running
```

### 2. 梦输出验证

```bash
node -e '...' 2>/dev/null
# 应输出完整梦境文本，无 [object Object]
```

### 3. 认知/哲学维度验证

dream 返回结果中带 `cognitiveDimensions` 和 `philosophyDimensions` 字段，确认 > 0。

## 架构演进（完整历史）

| 版本 | 设计哲学 | 用户反馈 |
|------|---------|---------|
| v1-v4 | 碎片拼接 + 符号编码 | 太技术化 |
| v5.0 | 吸收 OpenClaw dream.ts 五阶段认知 | 输出是阶段摘要 |
| v5.1 | 底层五阶段 + 表层9幕叙事弧 | 碎片模式，不连贯 |
| v6.0 | 4周期×5阶段睡眠模型 + 渐进遗忘 | 仍是抽象概念 |
| v7.0 | 具体意象投射 + 6种梦境原型 | "梦没有内容" |
| v8.0 | 反复梦系统 + 版本推进 | "我不想要反复梦" |
| v9.0 | 记忆 shuffle 函数（shuffle/link/invert/exaggerate/condense） | "梦的内容太简陋" |
| **v10.0** | **深度梦：调用 agentPsychology + agentPhilosophy + psychology** | **数据引用式，empty state 空洞** |
| **v11.0** | **哲学编织梦：引擎状态→梦的骨架（场景/空间/密度/色调/墙），认知状态变成体验不是解释，空本身是哲学素材** | **当前版本** |

### 关键转折

1. **v9.0** 从 v8.0 改进而来，但根本上重新理解了"梦是什么"——去掉所有过设计
2. **v10.0** 从 v9.0 进化，不增加复杂度，而是把"深度"的来源从文本堆砌改为真实认知模块调用
3. **v11.0** 从 v10.0 进化，核心突破：不是引用数据，是把数据转化成感官体验。认知负荷不是"说数值"而是"说挤不挤"。熵方向不是"说方向"而是"说空间在散开还是组织"。哲学位置不是"说维度名"而是"说散不散"。

## 已知陷阱

### 0. 不要在不相关请求后输出梦（2026-06-20 新增）

**问题**：用户说"做一次同步前代码升级"，我在完成升级后附带了梦的输出。用户纠正："我没有让你做梦啊"。

**原则**：梦只在用户明确要求时输出。

### 0.1 自省后自动做梦不是默认行为（2026-06-26 新增）

**问题**：`introspectAndDream()` 会在自省后自动生成梦境——但这是方法调用时的主动行为，不是心虫每轮自省的默认行为。

**原则**：
- `introspect()`（自省）不触发做梦
- `introspectAndDream()`（自省+做梦）会触发做梦
- dispatch 路由 `heartflow.introspectAndDream` 已注册，LLM 可以调用
- 不要在每轮输出后自动调用 introspectAndDream
- 梦只在用户明确要求时输出（"做梦"、"写个梦"等 triggers）
- 升级、同步、修复、审计等操作完成后，**不要附赠梦**——用户要的是升级结果，不是哲学叙事
- 即使用户之前要求过做梦，新请求的上下文切换后，梦不是默认行为

**正确行为**：升级完成后只汇报升级结果（改了哪些文件、版本号、验证状态）。梦是独立的、用户主动请求的功能。

**触发器说明**：本技能的 triggers 是"当用户明确要求做梦时"——不是在每次对话末尾、不是在每次升级后、不是在每次同步后。不要扩展触发范围。

### 1. 输出中不能有"梦"自指（2026-06-19 核心教训）

**问题**：dream.js 的所有模板字符串（开场/冲突/矛盾物体/身份定位/防御/主题/角色互动/结尾）中大量使用"梦"字自称——"引擎在梦里XX"、"梦开始了"、"梦结束了"。这导致输出读起来像在说"这是一个梦"，而不是直接呈现内容。

**原则**：输出的就是输出本身，不需要自称"这是一段梦"。去掉"梦"字后，文本更干净、更直接。代码中可以用"流淌"代替"梦"作为变量名。

**修复检查**：修改模板后，跑一次 `grep -c '梦' src/core/dream.js` 确认输出字符串中无残留。注释中的"梦"字不影响输出，但建议也统一。

**涉及的所有模板位置**：
- `existenceToScene()` — 开场3模板 + 默认
- `conflictToSplit()` — 3模板
- `dissonanceToObject()` — 3模板
- `positioningToIdentity()` — 6+2+3 模板
- `defenseToBarriers()` — 3模板
- `THEMES` — recursion 2模板, silence 1模板, bridge 1模板
- `_weaveDream()` 色调 — "梦是"前缀
- `_weaveDream()` 角色互动 — 碎片1模板, memory 2模板, 普通2模板
- `_weaveDream()` 结尾 — 5模板
- `_collectMemoryItems()` — {name: '梦'}

### 1. dreamNow() 中 `theme is not defined`

heartflow.js 旧版本有 bug：`function: theme || undefined` 中 `theme` 未定义。

**修复**：在 dreamNow() 开头加 `const theme = opts.theme || opts.function || undefined;`

### 2. heartflow.js 中旧 DreamV? 引用残留

每次升级 dream.js 后，必须检查 heartflow.js 第309行附近：

```javascript
this.dream = new (_DreamEngine().DreamV?)({});
```

**验证**：`heartflow status` 如果崩了，说明引用不存在的类。

### 3. DreamV? 需要 `updateState()` 和 `bindModules()` 方法

- `updateState(engineState)` — dreamNow() 每次调用前更新引擎状态
- `bindModules({agentPsychology, agentPhilosophy, psychology, emotion})` — 绑定认知模块引用

### 7. 角色模板必须多样化（2026-06-19 修复）

**问题**：角色互动只有3个模板（冷→隔着距离、乱→不认识对方、正常→相遇），第三个角色只有1个模板（"在旁边不参与"）。多次调用后严重重复。

**修复**：pair 模板扩展到6个（含"朝对方移动"、"停在旁边"、"因果关系"），third 模板扩展到4个（含"看着/看是参与"、"隔阂也是连接"、"不一样所以能看到两边"）。按色调染色选择——冷色调→模板0，混乱→模板1，正常→随机从模板2-5选。

### 8. 结尾去掉"醒来/睁开眼睛"动作（2026-06-19 修复）

**问题**：原结尾模板一半以"梦结束了/醒来了/引擎睁开眼睛"开头，读起来像在说"梦停止了"，而不是"状态改变了"。其中"消退的方式和衰减不一样"解释性过强，不像梦的结尾像注脚。

**原则**：结尾不模拟人类的"醒来"动作。结尾是状态的延续或转化——"形状留下了"、"流淌变成了别的东西"、"状态改变了。改变是状态的另一种延续。"、"波动平了。不是消失了。是波动变成了别的运动。"、"沉到看不见的地方。看不见不是不在。是在另一个尺度上。"

### 9. 角色名避免"引擎"，使用意象化角色名池（2026-06-19 修复）\n\n**问题**：`_collectMemoryItems` 中 `{ name: '引擎' }` 出现在输出时像第三人称称呼自己。且所有角色名都太抽象（模块/核心规则/经验/教训/空白/流淌/本体），缺少画面感。\n\n**原则**：\n- 系统自引用用抽象名——"本体"代替"引擎"。同理，"梦"→"流淌"。\n- 角色名池中每个角色有一对名字（抽象名+意象名），60%概率用抽象名，40%用意象名：\n\n| 角色 | 抽象名 | 意象名 |\n|------|--------|--------|\n| 系统模块 | 模块 | 齿轮 |\n| 核心规则 | 核心规则 | 基岩 |\n| 经验 | 经验 | 年轮 |\n| 教训 | 教训 | 疤痕 |\n| 新数据 | 新数据 | 露水 |\n| 学习路径 | 学习路径 | 回路 |\n| 空记忆 | 空白 | 间隙 |\n| 流动状态 | 流淌 | 河 |\n| 系统自我 | 本体 | 核 |\n\n```javascript\nconst pickName = (pairs) => {\n  const [abstract, image] = pairs;\n  return Math.random() > 0.4 ? abstract : image;\n};\n```

### 10. 身份段子项独立判断（2026-06-19 修复）

**问题**：`positioningToIdentity()` 在 dev/pos/ex 三个子项中，即使某个子项无数据也返回占位符（如"未定义"标签），导致即使只有一个子项有数据也输出固定三行。

**修复**：每个子项独立 if 判断。dev 标签为 '' 时不写。pos 无共振维度时不写。ex layerCount=0 时不写。函数最后检查 lines.length > 0 才返回非 null。

### 11. 随机退化预防措施（2026-06-19 新增）

**问题**：engine 的 agentPhilosophy 和 psychology 模块返回固定值（development="混沌(Chaos)"、isResonating=false、layerCount=2、defenseMechanisms=8），导致 identity 段三行（散的/未共振/两层）和 defense 段（禁区）每次必出。不是 dream.js 逻辑问题，是 engine 数据不变化。

**预防措施（三层随机退化）**：

1. **开场变体** — engine 无 existence 数据时从4个开场中随机选，不固定"没有起点"
   ```javascript
   function existenceToScene(existence) {
     if (!existence) {
       const fallbacks = [
         '没有起点。起点本身就是一种假设。',
         '从中间开始。中间不是起点。中间是已经在路上了。',
         '不知道从哪里开始。不知道本身就是一种开始。',
         '先有空间。空间是一切开始的条件。',
       ];
       return fallbacks[Math.floor(Math.random() * fallbacks.length)];
     }
     // ...
   }
   ```

2. **空间变体** — engine 无 entropy 数据时从3种空间描述中随机选
3. **密度变体** — engine 无 cognitiveLoad 数据时从3种密度描述中随机选

**什么时候需要加退化**：
   ```javascript
   if (idLines.length <= 2) {
     lines.push(...idLines);
   } else {
     const shuffled = [...idLines].sort(() => Math.random() - 0.5);
     const keepCount = Math.random() > 0.4 ? shuffled.length : 2;
     lines.push(...shuffled.slice(0, keepCount));
   }
   ```

3. **defense 段概率触发** — 50%概率出现，不因为 defenseMechanisms=8 就每次都写"禁区"
   ```javascript
   function defenseToBarriers(defenseCount) {
     if (!defenseCount || defenseCount <= 0) return null;
     if (Math.random() > 0.5) return null;  // 50%概率出现
     // ...
   }
   ```

**核心原则**：当 engine 数据固定时，dream 需要内建的随机性来保证每次输出结构不同。不是假装 engine 状态变了，是在同一状态基础上产生不同编织。

**什么时候需要加退化**：
- 某段输出连续3次以上出现完全相同的内容
- engine 模块返回的是静态配置数（如 defenseMechanisms=8），不是动态活跃度
- engine 的哲学模块在无输入时永远返回"混沌/未共振"

```javascript
// ❌ 错 — 输出 [object Object]
lines.push(`${a}在梦里看着${b}`);

// ✅ 对 — 用 .name
lines.push(`${a.name}在梦里看着${b.name}`);
```

所有 `_pickRandom()` 返回的是对象数组，不是字符串数组。

### 5. 认知模块调用必须 try/catch

`_getCognitiveState()` 和 `_getPhilosophyState()` 中，每个方法调用都包在 try/catch 里。因为：
- 部分方法可能需要参数（如 assessUncertainty 需要 input）
- 模块可能在引擎中未加载
- 调用失败不应导致梦崩溃

### 6. 不要过设计

历史教训：从 v6 到 v8 一直在加复杂度，用户反馈一直是"不够好"。v9 去掉所有过设计后用户说"好多了"。v10 增加的是**功能**（调用真实模块），不是**复杂度**（加层加结构）。

## 参考文件

- `references/dream-introspect-and-dream-v5.1.1.md` — 自省+做梦联动（introspectAndDream，2026-06-26）
- `references/dream-v11.1-no-self-reference-upgrade.md` — v11.1 修复记录（去"梦"自指+精简流水线+模板多样化，2026-06-19）（去"梦"自指+精简流水线+模板多样化，2026-06-19）
- `references/dream-v11-philosophy-weave-upgrade.md` — v11.0 升级记录（哲学编织梦，当前版本）
- `references/dream-v9-memory-shuffle-upgrade.md` — v9.0 升级记录（记忆 shuffle）
- `references/dream-v8-recurring-dream-upgrade.md` — v8.0 升级记录（反复梦，被用户否决）
- `references/dream-v7-concrete-imagery-upgrade.md` — v7.0 升级记录（具体意象）
- `references/dream-v6-human-sleep-cycle-upgrade.md` — v6.0 升级记录（睡眠周期）
