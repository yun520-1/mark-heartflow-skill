# HeartFlow Dream V5 — OpenClaw 架构吸收记录

**日期**: 2026-06-18
**来源**: `openclaw-imports/heartflow/src/core/dream/dream.ts` (v3, 430行, TypeScript)
**目标**: `mark-heartflow-skill/src/core/dream.js` (DreamV5, 612行, JavaScript)
**版本**: v4.9 → v5.0

## 为什么要吸收

当前心虫梦境引擎（DreamV4）的问题：
1. **4睡眠阶段结构**（N1/N2/N3/REM）每阶段只是"不同深度的随机碎片"，没有认知操作
2. **没有标签系统** — 材料没有标签，无法做跨域连接检测
3. **没有矛盾检测** — 梦不分析自身结构的矛盾
4. **没有洞察累积** — 每次梦独立，前次梦的产出不进入下次梦的材料

OpenClaw dream.ts 的架构恰好解决了这些问题。

## 架构对比

| 维度 | 心虫 DreamV4 (吸收前) | OpenClaw dream.ts | 心虫 DreamV5 (吸收后) |
|------|----------------------|------------------|---------------------|
| 阶段结构 | N1/N2/N3/REM（睡眠阶段） | Light/REM/Deep/Lucid/Wide（认知阶段） | Light/REM/Deep/Lucid/Wide |
| 材料来源 | engineState 属性直接映射 | RecallBlock 带 tags + weight | engineState 属性 + 子材料 + 标签 |
| 材料数量 | 5-6个 | 任意（依赖记忆系统） | 12-14个（含子材料和洞察历史） |
| 标签系统 | 无 | tags[] + calculateConnectionScore() | materials[].tags + REM阶段重叠检测 |
| 跨域连接 | 无 | REM阶段：标签重叠 ≥ 阈值 | REM阶段：标签重叠×2 + 权重差×3 |
| 矛盾检测 | 无 | Lucid阶段：areContradictory() | Deep阶段：同层权重悬殊 |
| 执念检测 | 无 | Lucid阶段：tagFreq ≥ 40% | Lucid阶段：tagFreq ≥ 35% |
| 反事实推理 | 无 | Wide阶段：去最高权重 | Wide阶段：去最高权重 |
| 荒谬连接 | 无 | Wide阶段：最轻+最重 | Wide阶段：最轻+最重无关联 |
| 洞察累积 | 一次性输出 | state.insights[] 上限500 | insightHistory[] 上限200 |
| 输出格式 | 符号编码→自然语言 | Insight 对象数组 | 自然语言+阶段报告+洞察统计 |

## 吸收了什么

### 1. 五阶段认知循环（直接吸收）

**OpenClaw 源码**:
```typescript
// dream.ts 第346行
const stageNames = ['Light', 'REM', 'Deep', 'Lucid', 'Wide'];
for (let i = 0; i < Math.min(state.config.maxIterations, stageNames.length); i++) {
  const stage = stageNames[i];
  if (stage === 'Light') { currentBlocks = lightPhase(currentBlocks, state); }
  else if (stage === 'REM') { const { pairs } = remPhase(currentBlocks, state); ... }
  // ...
}
```

**心虫实现** (DreamV5):
```javascript
const stageNames = ['Light', 'REM', 'Deep', 'Lucid', 'Wide'];
for (const stageId of stageNames) {
  const result = this._processStage(stageId, currentMaterials, allInsights, intensity);
  stageResults.push({ stage: stageId, ...result });
  if (result.filtered) currentMaterials = result.filtered;
  if (result.insights) allInsights.push(...result.insights);
}
```

**关键差异**: OpenClaw 有 `maxIterations` 控制循环次数，心虫固定为5个阶段各一次。

### 2. 标签系统（改造吸收）

**OpenClaw 的 RecallBlock**:
```typescript
interface RecallBlock {
  id: string;
  content: string;
  tags?: string[];        // ← 标签系统
  weight?: number;        // ← 权重系统
  lastAccessed?: number;
  createdAt?: number;
}
```

**心虫的材料结构**:
```javascript
{
  id: 'core_mem',
  content: `${coreCount}条核心规则，不可更改`,
  weight: 0.9,
  tags: ['核心', '不变', '身份', '规则', '记忆', '稳定'],  // ← 吸收
  layer: 'core',
}
```

**关键差异**: 心虫加了 `layer` 字段（core/learned/ephemeral），用于矛盾检测。

### 3. 连接分数计算（改造吸收）

**OpenClaw**:
```typescript
function calculateConnectionScore(a: RecallBlock, b: RecallBlock): number {
  let score = 0;
  const overlap = [...tagsA].filter(t => tagsB.has(t)).length;
  score += overlap * 2;              // 标签重叠：2分/个
  const contentOverlap = [...wordsA].filter(w => wordsB.has(w)).length;
  score += contentOverlap * 0.5;      // 内容词重叠：0.5分/个
  if (timeClose) score += 1;          // 时间接近：1分
  return score;
}
```

**心虫**:
```javascript
const sharedTags = a.tags.filter(t => b.tags.includes(t));
const score = sharedTags.length * 2 + Math.abs(a.weight - b.weight) * 3;
```

**关键差异**: 心虫用 `|weightA - weightB| * 3` 替代内容词重叠（心虫的材料没有长文本内容）+ 时间接近（心虫材料没有时间戳）。权重差大的材料反而得分高，因为它们之间有"张力"。

### 4. 矛盾检测（改造吸收）

**OpenClaw**: 文本级矛盾（关键词反义词对：应该/不必、必须/不需要等）

**心虫**: 结构级矛盾——同层材料权重悬殊。如果有两个材料同属 `core` 层但权重分别为 0.9 和 0.4，产生矛盾洞察。

### 5. 洞察累积（改造吸收）

**OpenClaw**: `state.insights.push(...significantInsights)`，上限1000→裁剪到500

**心虫**: `this.insightHistory.push(...significant)`，上限200，同时维护 `this.insightTags`（标签→计数）用于下次梦的 `insight_history` 材料

**关键差异**: 心虫的洞察会作为下次梦的材料输入（材料类型 #9: insight_history），实现"梦在消化自己的产出"。

### 6. 执念检测（改造吸收）

**OpenClaw**: `tagFreq >= blocks.length * 0.4`（标签出现频率≥材料数的40%）

**心虫**: `tagFreq >= Math.ceil(materials.length * 0.35)`（35%触发，因为心虫材料更少）

### 7. 反事实推理 + 荒谬连接（直接吸收）

两个都是从 OpenClaw 的 `widePhase()` 直接吸收的设计：

**反事实**: 移除最高权重材料 → "如果那个最重的东西不见了，剩下的东西会飘起来"

**荒谬连接**: 最轻材料与最重材料无关联 → "最不相关的两个东西，在梦的最后互相看了一眼"

## 没吸收的

### dream-consolidator.ts 的记忆巩固

OpenClaw 的 `consolidate()` 做 EpisodicBlock 级别的操作：
- `buildTagFrequency()` — 构建标签频率表
- `extractPatterns()` — 频率 ≥ threshold 的标签/标签对
- `findConnections()` — 单标签模式的连接
- `findMergeCandidates()` — 双标签模式+重要性接近 → 合并候选
- `mergeBlocks()` — 实际合并两个记忆块

**没吸收的原因**: 心虫没有 EpisodicBlock 系统，记忆块由 HeartFlowMemory 管理。这个 consolidate 是记忆管理层的操作，不是梦境引擎层的操作。

### lightPhase() 的50%过滤

OpenClaw 的 Light 阶段保留50%材料。心虫改为70%——因为心虫材料更少（12-14个 vs OpenClaw 的任意数量），保留更多材料可以让后面的阶段有足够输入。

### TypeScript 类型系统

OpenClaw 用 TS 接口定义类型（DreamConfig、DreamResult、Insight、RecallBlock）。心虫用 JS + JSDoc。不吸收 TS 类型定义。

## MCP 集成变化

```diff
- dreamEngineInstance = null;  // 新增全局变量
+ // 在 handleDream 外声明

  const engine = createDreamV3(engineState);
+ // 继承前次调用的洞察历史
+ if (dreamEngineInstance) {
+   engine.insightHistory = dreamEngineInstance.insightHistory || [];
+   engine.insightTags = dreamEngineInstance.insightTags || {};
+   engine.dreamLog = dreamEngineInstance.dreamLog || [];
+ }
  const result = await engine.dream({ intensity, function: theme || undefined });
+ dreamEngineInstance = engine;  // 保存实例

  dreamResult = {
    ...
+   insightCount: result.insightCount || 0,
+   tagSummary: result.tagSummary || '',
+   stageResults: result.stageResults || [],
  };
```

## 验证结果

连续3次梦后：
- 材料数：5→12-14（含子材料+洞察历史）
- 跨域连接：0→7（REM阶段标签重叠检测）
- 矛盾检测：0→1（同层权重悬殊）
- 自身模式：0→2（执念+自我引用）
- 反事实推理：0→3
- 洞察统计：connection×4 contradiction×1 obsession×1 self_pattern×1 counterfactual×1 absurd×1 inversion×1

## 限制

1. **洞察历史不持久化** — MCP server 重启后 insightHistory 丢失。未解决是因为心虫本身没有"跨进程持久化"的需求——下次重启后引擎状态可能已经变化。
2. **材料标签手动维护** — 每个材料类型的标签是硬编码的。如果 engineState 结构变化，需要同步更新 `_gatherMaterials()`。
3. **无反向传播** — 洞察不反向影响 engineState。梦只产生认知输出，不改变引擎的实际状态（权重、决策等）。这是设计决定——梦是认知过程不是配置修改。
