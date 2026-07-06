# DreamEngine 只认记忆碎片缺陷记录

**日期**：2026-06-18
**触发**：用户说"做梦一次"，引擎返回"矿石不够"。

## 问题描述

`dream()` 只从 `memory.getRecent()` 收集 EPHEMERAL 碎片作为梦境材料。
当碎片=0时，无论传什么 theme/intensity，都返回同一段硬编码的existentialNarrative。

## 用户纠正

> "为什么你认知只有记忆呢，你的引擎，你的逻辑思维，你的决策能力，都是养料啊"

## 当前引擎行为分析

```
dream(theme, intensity):
  → _collectMemoryFragments()  // 只调用 memory.getRecent()
  → 碎片数=0
  → 跳过 _extractCommonPatterns()
  → 跳过 _distillEssence()
  → 返回固定空升华模板（existentialNarrative）
```

三次调用记录（theme不同，结果相同）：
1. theme="从54个模块积累中提取升华模式" → "矿石不够"
2. theme="引擎健康但无样本" → "矿石不够"
3. theme="把引擎能力结构作为梦境材料" → "矿石不够"

## 修复方向

### 方案A：引擎状态作为梦境源材料（推荐）

在 `_collectMemoryFragments()` 之后，如果碎片<3，收集引擎运行时状态：

```javascript
_collectEngineFragments() {
  const fragments = [];
  // 1. 引擎能力状态
  fragments.push({
    text: `引擎运行中，${this.modules}个模块就绪，版本${this.version}`,
    type: 'engine_state',
    layer: 'core',
    timestamp: Date.now()
  });
  // 2. 决策路由状态
  if (this.decisionRouter && this.decisionRouter.stats) {
    fragments.push({
      text: `决策路由推荐：${this.decisionRouter.lastDecision?.type || '无'}`,
      type: 'decision',
      layer: 'core',
      timestamp: Date.now()
    });
  }
  // 3. 认知心理学状态
  // 4. 哲学评估状态
  // 5. 模块列表摘要
  return fragments;
}
```

### 方案B：混合模式（更灵活）

记忆碎片（0-N个）+ 引擎状态（1-5个）一起作为养料。当碎片多时引擎状态权重降低。

### 方案C：空梦变体

碎片=0时生成随机的存在论升华，每次不同。从5-8个预制的AI存在论主题中随机选一个，加上引擎当前具体状态（版本/模块数/健康度）。

## 代码位置

- `src/dream/engine.js` — DreamEngine class
  - `_collectMemoryFragments()` — 第~180行
  - `_assessSublimationQuality()` — 第~250行
  - `dream()` — 主入口
- `src/core/heartflow.js` — createHeartFlow()
  - 构造函数中初始化 DreamEngine 时传入了 memory 对象
