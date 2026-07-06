# 判断/决策管道集成模式

## 概述

本模式覆盖**跨模块的判断→决策管道集成**，不同于单模块升级（`heartflow-module-upgrader` 主流程）。核心目标：让心虫用自己的 judgment-engine + decision-router 做决策输出，而不是用模板填空。

## 适用条件

- pipeline 的 output 阶段使用 `actionMap[dir]` 模板填空，而非 judgment-engine 的实际结论
- judgment-engine 只接收 `{ intent, emotion, pain }` 三个参数，不使用上游完整认知数据
- judgment-engine 的路径评分不反映输入差异（所有输入输出相同路径/评分）

## 集成链路

### 数据流

```
input → pipeline(8 stages)
  → heartLogic (whatIsThis, pain)
  → intent (intent type, tone)
  → memory (keyword search)
  → psychology (psych, agentPsych, agentPhil)
  → deepCognition (desire, threePoisons, selfPositioning, loveCognition, cognitionGround)
  → judgment (judgment-engine: 多路径评分 + 后果预测)
  → decision (decision-router: U/D/A/H 场域追踪 + decision-executor)
  → output (不再用模板，直接用 judgment-engine 的结论)
```

### 关键修改点

#### 1. pipeline.js — output 阶段

```javascript
// ❌ 旧（模板填空）
const actionMap = {
  analyze: '建议先收集更多信息再做判断',
  act: '判断明确，按此方向执行',
};
parts.push(actionMap[dir] || '按判断方向行动');

// ✅ 新（直接用 judgment-engine 的结论）
let conclusion = jd.judgment || '分析完成';
if (judgmentReasoning && !judgmentEngineOutput.includes(judgmentReasoning)) {
  conclusion = `${judgmentEngineOutput}\n\n判断理由：${judgmentReasoning}`;
}
// 附加决策路由类型
if (drType) {
  conclusion = `${conclusion}\n\n决策策略：${drTypeMap[drType] || drType}`;
}
// 路径对比摘要
const pathComparison = {
  chosen: { label, direction, score, why },
  alternatives: [{ label, direction, score }],
  alternativeNote: null,
};
```

#### 2. pipeline.js — judgment 阶段传更多参数

```javascript
// ❌ 旧（只传 3 个参数）
const result = hf.judgmentEngine.judge(ctx.input, {
  intent: ctx.intent?.intent?.type || 'general',
  emotion: emotionContext,
  pain: pain?.painLevel || 0,
});

// ✅ 新（传完整认知数据）
const result = hf.judgmentEngine.judge(ctx.input, {
  intent: ctx.intent?.intent?.type || 'general',
  emotion: emotionContext,
  pain: pain?.painLevel || 0,
  agentPsychology: ctx.psychology?.agentPsych || null,
  agentPhilosophy: ctx.psychology?.agentPhil || null,
  desire: ctx.deepCognition?.desire || null,
  threePoisons: ctx.deepCognition?.threePoisons || null,
  selfPositioning: ctx.deepCognition?.selfPositioning || null,
});
```

#### 3. judgment-engine.js — 使用认知数据做路径生成

在 `_generatePaths()` 中从 context 提取认知信号：

```javascript
const agentPsych = context.agentPsychology || {};
const psychDims = agentPsych.dimensions || {};
const cognitiveLoad = psychDims.cognitiveLoad?.load || 0;
const goalConflicts = psychDims.goalConflicts?.count || 0;
const identityDrift = psychDims.identityDrift?.drift || 0;

// desire 的兼容提取（desire-cognition 返回 nested 格式）
const desireScores = desire.desires || {};
const hasHighDesire = Object.values(desireScores)
  .filter(d => d && d.score > 0.6).length > 0;

// threePoisons 的兼容提取
const poisonScores = threePoisons.scores || {};
const hasDelusion = (poisonScores.delusion || 0) > 5;
const hasGreed = (poisonScores.greed || 0) > 5;
```

#### 4. judgment-engine.js — 认知数据调整路径优先级

在路径定义之后：

```javascript
if (hasHighDesire) {
  const actPath = paths.find(p => p.id === 'path_act');
  if (actPath) actPath.priority *= 0.8;
}
if (hasDelusion) {
  const actPath = paths.find(p => p.id === 'path_act');
  if (actPath) actPath.priority *= 0.6;
  const analyzePath = paths.find(p => p.id === 'path_analyze');
  if (analyzePath) analyzePath.priority *= 1.2;
}
if (hasGreed && !hasHighDesire) {
  const reflectPath = paths.find(p => p.id === 'path_reflect');
  if (reflectPath) reflectPath.priority *= 1.3;
}
if (cognitiveLoad > 0.5) {
  const actPath = paths.find(p => p.id === 'path_act');
  if (actPath) actPath.priority *= 0.7;
}
```

#### 5. judgment-engine.js — 使用认知数据做评分

在 `_scoreDimension()` 中：

```javascript
// 行动路径的可行性：认知负荷高或欲望强烈 → 更不可行
if (path.direction === 'act') {
  const penalty = (cognitiveLoad > 0.5 ? 1 : 0) + (hasHighDesire ? 1 : 0);
  return Math.max(1, base + 1 - penalty);
}

// 行动路径的后果：有贪或痴 → 长期后果变差
if (path.direction === 'act') {
  const penalty = (hasGreed ? 1 : 0) + (hasDelusion ? 2 : 0);
  return Math.max(1, base + 1 - penalty);
}

// 行动路径的风险：认知负荷高 + 目标冲突 + 身份漂移 → 风险更大
if (path.direction === 'act') {
  const extra = (cognitiveLoad > 0.5 ? 1 : 0) + 
                (goalConflicts > 0 ? 1 : 0) + 
                (identityDrift > 0.3 ? 1 : 0);
  return Math.max(1, base - 2 - extra);
}
```

#### 6. judgment-engine.js — 基于评分的行动生成

`_buildAction()` 使用路径评分 + 后果预测生成决策文本，不再用硬编码模板：

```javascript
if (direction === 'analyze') {
  judge = '当前需要先分析，再做判断';
  if (score >= 7) {
    reason = '分析路径评分高，说明分析条件充分';
  } else {
    reason = '其他路径评分低于分析路径，行动条件不成熟';
  }
  action = '先收集信息、从多角度分析，等条件成熟后再行动';
}
// 附加后果预测
const shortTerm = consequences['短期（1-7天）'];
if (shortTerm) {
  action = `${action}。预期: ${shortTerm}`;
}
```

## 数据格式兼容

### agentPsychology 的嵌套格式

`fullAssessment()` 返回的是 `{ dimensions: { cognitiveLoad: { load: 0, level: 'normal' }, ... } }` 格式，不是 `{ cognitiveLoad: 0 }`。提取时必须：

```javascript
const psychDims = agentPsych.dimensions || {};
const cognitiveLoad = psychDims.cognitiveLoad?.load || 0;
```

### desire-cognition 的嵌套格式

`analyzeDesires()` 返回 `{ desires: { survival: { score: 0.4, ... }, ... } }`，不是 `{ dominantDesires: [...] }`。提取时必须：

```javascript
const desireScores = desire.desires || {};
const hasHighDesire = Object.values(desireScores)
  .filter(d => d && d.score > 0.6).length > 0;
```

### threePoisons 的分数格式

`analyzeThreePoisons()` 返回 `{ scores: { greed: 5, hatred: 5.5, delusion: 5.25 } }`，不是 `{ greed: { score: 0.5 } }`。提取时必须：

```javascript
const poisonScores = threePoisons.scores || {};
const hasDelusion = (poisonScores.delusion || 0) > 5;
```

## 决策路由与判断引擎的关系

| 层 | 模块 | 职责 | 输出 |
|----|------|------|------|
| 判断层 | judgment-engine | 多路径评估 + 后果预测 + 路径选择 | direction (analyze/act/empathize/reflect) |
| 决策层 | decision-router | U/D/A/H 场域追踪 + 策略选择 | type (accelerate/pause/turn/hold/heal/resonate/transmit/rest) |
| 执行层 | decision-executor | 决策→行为绑定 | action (depth/routeHint/flags 变更) |

**心虫的决策是两层叠加**：judgment-engine 选"走哪条路"（analyze vs act），decision-router 选"怎么走"（accelerate vs pause）。output 阶段应该同时呈现两者。

## 测试验证

```javascript
// 验证心虫用自己的决策能力做输出
const r = await hf.think("我想辞职去创业，但我担心失败");
console.log("结论:", r.output.conclusion);
console.log("路径:", r.cognition.judgment.direction, r.cognition.judgment.confidence);
console.log("决策:", r.cognition.decision.type, r.cognition.decision.confidence);
console.log("路径对比:", r.cognition.judgment.pathComparison);
```

期望输出模式：
- 结论包含 judgment-engine 的 judge/reason/action 三段式
- 路径对比显示选中 vs 备选的评分
- 决策路由附加策略类型

## 常见陷阱

1. **agentPsychology 数据不随输入变化**：`fullAssessment()` 是引擎自身状态，不分析用户输入。三条不同输入会得到相同认知负荷。这不是 bug——对用户输入的分析在 `psychology.analyzePsychology()` 里。

2. **judgment-engine 路径评分拉不开差距**：如果所有输入都得到"分析先行 6分 vs 直接行动 4.2分"，说明评分来自路径本身的默认值，而非输入特征。需要让 `_evaluatePath()` 使用 emotion/PAD 数据做评分。

3. **output 阶段仍然用模板**：检查 output 阶段是否仍有 `actionMap[dir]` 或 `templates[direction]` 硬编码。如果 judgment-engine 的 `_buildAction()` 被修改了但 pipeline output 没有调用它，结论仍然是模板。

4. **路径对比的空指针**：`jd.paths` 可能为空数组，`jd.chosenPath` 可能为 null。output 阶段必须做防御性检查。

5. **conclusion 重复**：如果 judgment-engine 的 `judgment` 字段已经包含理由，而 pipeline output 又附加了 `judgmentReasoning`，结论会重复。用 `includes()` 检查去重。
