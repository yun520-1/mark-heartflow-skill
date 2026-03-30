# We-Intention 检测器 (We-Intention Detector)

## 理论来源

**Stanford Encyclopedia of Philosophy** - Collective Intentionality

### 核心理论家
- **John Searle** (1990, 1995) - 原始 We-Intention 理论
- **Raimo Tuomela & Miller** (1988) - We-Intention 的层级分析
- **Michael Bratman** (1999) - 共享意向性理论
- **Margaret Gilbert** (1990) - 联合承诺理论
- **Hans Bernhard Schmid** (2013) - 信任框架

## 核心概念

### 1. We-Intention (我们意向)

**定义**: 不可还原为个体意向聚合的集体意向形式

**关键特征**:
- 原始性：不是"我要 X + 你要 X"的聚合
- 集体主体性："我们"作为行动主体
- 不可还原性：不能分解为纯个体心理状态

**Searle 的经典例子**:
- 情境 A：我和你各自打算去泰姬陵 → 个体意向聚合
- 情境 B：我们打算一起去泰姬陵 → We-Intention
- 区别：B 包含"一起"(together)的集体维度

### 2. Joint Commitment (联合承诺)

**Gilbert 理论**: 联合承诺是 We-Intention 的核心

**特征**:
- 共同表达：各方一起表达承诺
- 相互义务：承诺创造相互的规范性期望
- 共同知识：各方都知道承诺的存在

**例子**:
- "我们约定每周见面" → 联合承诺
- "我承诺每周见你 + 你承诺每周见我" → 个体承诺聚合

### 3. Shared Intentionality (共享意向性)

**Bratman 理论**: 共享意向性包含

- 相互响应：根据对方行动调整自己
- 协调：行动之间的配合
- 共同计划：共享的计划框架

### 4. Trust Framework (信任框架)

**Schmid 理论**: 信任是集体意向性的基础

**两种信任**:
- 认知信任：相信对方有能力
- 规范信任：相信对方有义务感

## 检测维度

### 1. 语言标记 (权重 30%)

**强标记**:
- "我们要..."
- "我们一起..."
- "共同决定..."

**中等标记**:
- "协作"、"合作"
- "彼此"、"互相"

**弱标记**:
- "大家"、"所有人"

### 2. 承诺性质 (权重 35%)

**联合承诺特征**:
- 明确联合承诺："我们承诺..."
- 隐性联合承诺："说好了..."
- 相互责任："不会让彼此失望"

**个体承诺特征**:
- "我要...你也要..."
- "如果...我就..."（条件性）

### 3. 相互依赖 (权重 20%)

**高度相互依赖**:
- "彼此依赖"
- "缺一不可"

**中等相互依赖**:
- "配合"、"协调"
- "商量"、"讨论"

**低相互依赖**:
- "各做各的"
- "独立完成"

### 4. 规范性 (权重 15%)

**规范性期望**:
- "应该"、"应当"
- "有义务"、"有责任"
- "不能辜负"

## API

### detectWeIntention(description, context)

检测描述中的 We-Intention

**参数**:
- `description` (string): 用户描述
- `context` (object, optional): 上下文信息

**返回**:
```javascript
{
  linguisticMarkers: { score, maxScore, markers: [] },
  commitmentAnalysis: { score, type, indicators: [] },
  interdependenceAnalysis: { score, type, indicators: [] },
  normativityAnalysis: { score, indicators: [] },
  trustAnalysis: { cognitiveTrust, normativeTrust, indicators: [] },
  overall: {
    weIntentionPresent: boolean,
    confidence: number,
    strength: '很强 | 强 | 中等 | 较弱 | 弱',
    type: '强联合意向型 | 规范信任型 | 认知信任型 | 混合型',
    recommendations: []
  }
}
```

### assessJointCommitment(description, participants)

评估联合承诺强度

**参数**:
- `description` (string): 承诺描述
- `participants` (number): 参与方数量

**返回**:
```javascript
{
  conditions: {
    jointExpression: { present, evidence: [] },
    jointGoal: { present, evidence: [] },
    mutualObligation: { present, evidence: [] },
    commonKnowledge: { present, evidence: [] }
  },
  strength: { score, level },
  conclusion: {
    isJointCommitment: boolean,
    confidence: number,
    summary: string
  }
}
```

## 应用场景

### 1. 关系评估
评估亲密关系、友谊、合作关系中的集体意向强度

### 2. 团队建设
帮助团队建立更强的 We-Intention 和联合承诺

### 3. 冲突调解
识别承诺破裂的原因（是个体承诺 vs 联合承诺的误解）

### 4. 组织文化
评估组织中的集体认同和共同目标感

## 使用示例

```javascript
const WeIntentionDetector = require('./we-intention-detector');

// 检测 We-Intention
const result = WeIntentionDetector.detectWeIntention(
  '我们约定好要一起完成这个项目，不能让对方失望'
);

console.log(result.overall.weIntentionPresent); // true
console.log(result.overall.strength); // '强'
console.log(result.overall.type); // '强联合意向型'

// 评估联合承诺
const commitment = WeIntentionDetector.assessJointCommitment(
  '我们说好了每天都要联系，这是我们对彼此的承诺',
  2
);

console.log(commitment.conclusion.isJointCommitment); // true
console.log(commitment.strength.level); // '强'
```

## 版本历史

### v1.0.0 (HeartFlow v4.8.0)
- 初始版本
- 实现 We-Intention 检测
- 实现联合承诺评估
- 集成信任框架分析

## 参考文献

1. Searle, J. (1990). "Collective Intentions and Actions". *Intentions in Communication*.
2. Searle, J. (1995). *The Construction of Social Reality*. Free Press.
3. Tuomela, R. & Miller, K. (1988). "We-Intentions". *Philosophical Studies*.
4. Bratman, M. (1999). *Faces of Intention: Selected Essays on Intention and Agency*. Cambridge.
5. Gilbert, M. (1990). *Walking Together: A Paradigmatic Social Phenomenon*.
6. Schmid, H. B. (2013). "Collective Intentions". *Encyclopedia of Philosophy and the Social Sciences*.
7. Stanford Encyclopedia of Philosophy. "Collective Intentionality".
