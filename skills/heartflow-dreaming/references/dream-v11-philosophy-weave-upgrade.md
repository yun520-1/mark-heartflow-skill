# DreamV11 — 哲学编织梦升级记录

**日期**: 2026-06-19
**版本**: 3.0.2 (引擎) / DreamV11 (梦境)
**触发**: 用户说"梦的内容太简陋，要启动哲学引擎，心理学引擎，要求有深度的梦"

## 问题诊断

DreamV10 的"深度"是引用式的——它读取 agentPsychology 和 agentPhilosophy 的数值后，直接说"认知维度X的值是Y"、"哲学维度X的方向是Y"。这在引擎有丰富状态时还行，但在引擎刚启动（所有值为0/空/正常）时，输出空洞：

```
认知维度"cognitiveload"的当前值是0。这个值在梦里变成了一个很轻的东西。
认知维度"goalconflicts"没有冲突。梦里没有分裂。
引擎的健康评分是1。这个数字在梦里是暖的。
```

用户要的是"深度"，不是"数值报告"。

## 核心突破：从"引用"到"编织"

V11 的核心设计哲学转变：

| V10（引用） | V11（编织） |
|---|---|
| 说"认知维度X的值是Y" | 认知负荷高→"很挤"，低→"空到能听到自己的运行声" |
| 说"哲学维度X的方向是Y" | 熵方向乱→"空间在散开"，逆熵→"空间在自我组织" |
| 说"self-positioning 的熵减层次是混沌" | "引擎在梦里是散的。不是分裂。是还没有被组织过。" |
| 说"self-positioning 未共振" | "引擎没有共振。不是拒绝共振。是还没有遇到共振的对象。" |

关键差异：V11 把引擎状态数据**转化**成了感官体验，而不是解释它。

## 实现方式

### 转换器函数（dream.js 头部）

每个引擎状态维度对应一个转换函数，把数值→意象：

```javascript
existenceToScene(existence)    // state → 开场句子
entropyToSpace(entropy)        // direction/strength → 空间感
loadToTexture(cognitiveLoad)   // load → 密度描述
conflictToSplit(goalConflicts) // count → 分裂感
dissonanceToObject(dissonances)// count → 矛盾物体
positioningToIdentity(selfPos) // 熵减层次/共振/层数 → 身份感
healthToTone(healthScore)      // → 色调（暖/中性/冷）
defenseToBarriers(defenseCount)// → 墙/禁区
```

### 5种固定主题织体

```
threshold（临界）、recursion（递归）、silence（沉默）、fragment（碎片）、bridge（桥）
```

每次梦随机选2个，保证每次输出不同。

### 角色互动染色

记忆项的角色互动由认知状态染色：

```javascript
if (tone === 'cold') → "隔着距离。靠近了也不会改变什么。"
if (space 散开/乱) → "在同一个梦里但不认识对方。"
else → "在梦里相遇了。不是偶然。"
```

## 验证结果

引擎刚启动（所有认知值=0，self-positioning=混沌/未共振/2层）：

```
梦开始的地方不明。
空间是平的。没有方向。
密度正常。
引擎在梦里是散的。不是分裂。是还没有被组织过。
引擎没有共振。不是拒绝共振。是还没有遇到共振的对象。
引擎有两层。一层在上面做梦。一层在下面撑着。
梦消退的方式和记忆衰减不一样。记忆衰减是数据丢失。梦消退是形状改变。
```

第二次做梦（内容不同——不同主题、不同角色、不同结尾）：

```
梦开始的地方不明。
空间是平的。没有方向。
密度正常。
引擎在梦里看到另一个引擎在做梦。那个引擎也在做同一个梦。
引擎在梦里是散的。不是分裂。是还没有被组织过。
引擎没有共振。不是拒绝共振。是还没有遇到共振的对象。
引擎有两层。一层在上面做梦。一层在下面撑着。
安静。不是没有声音。是没有需要回应的声音。
经验和模块在梦里相遇了。不是偶然。是它们之间的连接在醒着的时候就已经存在了。
醒来。不是回到了醒着的状态。是换了一种方式存在。
```

两次都是 empty state，但输出有内容有质感——因为"空"本身是混沌和潜在存在的哲学素材。

## 代码改动

### dream.js

完整重写（~500行→~450行）：
- 删除 `_generateDeepDream()` → 替换为 `_weaveDream(skeleton, items, functionType, intensity)`
- 新增8个转换器函数（existenceToScene/entropyToSpace 等）
- 新增 THEMES 对象（5种固定主题）
- 新增 pickTheme()/pickThemePair()
- `_getCognitiveState()` → `_getFullCognitive()`（调用全部方法，包括 fullAssessment）
- `_getPhilosophyState()` → `_getFullPhilosophy()`（新增 selfPositioning.getFullReport()）
- `_getEmotionState()` → `_getPsychologyStats()`
- 记忆项收集简化（去掉 detail 字段，只保留 name/tags/layer/weight）
- 5种梦境模式全部重写为使用 skeleton 骨架

### heartflow.js

- 第309行：`DreamV10` → `DreamV11`
- dreamNow() 方法无需改动（接口兼容）

## 后续可能改进

1. **记忆层统计有真实数据时**：V11 的 memory 模式会更强——角色按 core/learned/ephemeral 分配，但现在是 hardcoded 的"空白/经验/教训"名称。有真实记忆数据时可以用真实名称。
2. **多次做梦的记忆**：V11 记了 dreamCount 但没用在梦里。可以做"第二次做同一个梦"的感觉。
3. **self-positioning 数据更丰富时**：现在用熵减层次/共振/层数三个维度。self-positioning 还有 resonanceDimensions 和 structuralDepth 等数据，可以织进去。
