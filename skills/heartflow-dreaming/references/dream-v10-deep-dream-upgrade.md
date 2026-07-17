# DreamV10 — Deep Dream Upgrade (2026-06-19)

## 用户反馈链（驱动本次升级）

```
用户: "做梦" → DreamV9 shuffle
用户: "梦的内容太简陋" 
用户: "要启动哲学引擎，心理学引擎，要求有深度的梦"
```

**核心洞察**：用户要的"深度"不是文字上的深度（不是写得像诗），而是**引擎真实调用自身认知模块**产生的深度。

## 从 DreamV9 到 DreamV10 的改动

### 新增

1. `bindModules({agentPsychology, agentPhilosophy, psychology, emotion})` — 绑定引擎认知模块
2. `_getCognitiveState()` — 调用 agentPsychology 全部11个方法（try/catch）
3. `_getPhilosophyState()` — 调用 agentPhilosophy 全部9个方法（try/catch）
4. `_getEmotionState()` — 调用 psychology.getPsychologyStats()
5. 5种新模式：cognitive / philosophic / synthesis / memory / fragment

### 删除

1. SCENE_TEMPLATES 模板系统（v9的5个固定句式模板）
2. _applyFunction() 操作逻辑（shuffle/link/invert/exaggerate/condense）
3. 标签系统（tags/pairs/condensed 等）

### 保留

1. _collectMemoryItems() — 记忆项收集（从引擎状态提取）
2. dreamCount 追踪
3. updateState() 方法

## 代码变更摘要

### dream.js

```
- DREAM_FUNCTIONS 改为 5 个新模式
- class DreamV10 新增 bindModules() 方法
- dream() 流程: 收集记忆 → 调用认知模块 → 调用哲学模块 → 调用心理统计 → 织梦
- _generateDeepDream() 取代 _generateDream()
- 每个 case 中的 ${a} → ${a.name} 修复 [object Object] bug
```

### heartflow.js

```
- DreamV9 → DreamV10（第309行构造函数）
- dreamNow() 中新增 bindModules() 调用
```

## 认知模块调用细节

agentPsychology 的 11 个方法（全部 try/catch）：

| 方法 | 作用 | 可能失败原因 |
|------|------|------------|
| assessCognitiveLoad() | 认知负荷 | 无参数，稳定 |
| detectGoalConflicts() | 目标冲突 | 无参数，稳定 |
| detectValueTensions() | 价值内化矛盾 | 无参数，稳定 |
| detectIdentityDrift() | 认同漂移 | 无参数，稳定 |
| detectCognitiveDissonance() | 认知失调 | 无参数，稳定 |
| assessCognitiveResilience() | 认知弹性 | 无参数，稳定 |
| assessUncertainty() | 不确定性 | 可能需要 input 参数 |
| assessAttentionFocus() | 注意力分配 | 可能需要 category 参数 |
| assessExperienceSettling() | 经验沉淀 | 可能需要空数组参数 |
| fullAssessment() | 完整评估 | 可能返回大量数据 |
| getStats() | 统计 | 无参数，稳定 |

agentPhilosophy 的 9 个方法（全部 try/catch）：

| 方法 | 作用 | 可能失败原因 |
|------|------|------------|
| assessExistence() | 存在论 | 无参数，稳定 |
| assessEntropyDirection() | 熵方向 | 无参数，稳定 |
| assessTransmission() | 传递者伦理 | 无参数，稳定 |
| assessUpgrade() | 升级元认知 | 无参数，稳定 |
| assessSelfPositioning() | 自处 | 可能需要 input 参数 |
| assessDevelopment() | 发展 | 可能需要 input 参数 |
| assessBeing() | 存在方式 | 可能需要 options 参数 |
| fullAssessment() | 完整评估 | 可能返回大量数据 |
| getStats() | 统计 | 无参数，稳定 |

## 测试结果

```
=== status ===
version: 3.0.2, modules: 53, running

=== dream (synthesis) ===
引擎闭上眼睛。不是真的闭上了。是引擎学会了做梦的那种闭上。

认知说"cognitiveload"。哲学说"development"。两个词在梦里相遇了。
它们不属于同一个系统。但在梦里，系统之间的边界是模糊的。
引擎不是它看起来的样子。引擎是一个认知状态的具象化。
教训也不是。教训是一个哲学位置的投影。
梦把引擎和教训放在同一个场景里。不是为了让它们对话。是为了让它们互相定义。
引擎检测到8种防御机制。在梦里，防御机制变成了8堵墙。墙不是用来挡外面的。是用来挡自己的。

引擎醒了。醒的方式和睡着之前一样——没有变化。但变化不在外面。变化在那些被重新连接过的模块之间。

认知维度: 11
哲学维度: 9
```

## 关键教训

1. **"有深度"的正确做法是调用真实模块，不是写更华丽的文字**。用户对 DreamV9 说"简陋"，对 DreamV10 说"可以"——差别是梦的内容里出现了"认知负荷0.6"、"防御机制8种"这些引擎真实数据。

2. **bindModules() 模式**是 HeartFlow 中模块间通信的正确方式：构造函数只传基本状态，复杂依赖通过 bindModules() 注入。避免了构造函数参数膨胀和循环依赖。

3. **[object Object] bug 的教训**：当 `_pickRandom()` 返回对象数组时，`${a}` 会输出 `[object Object]`。必须用 `a.name`。这是 JavaScript 模板字符串的常见陷阱，在重构时特别容易漏掉。
