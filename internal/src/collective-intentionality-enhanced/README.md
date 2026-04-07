# 集体意向性增强模块 (Collective Intentionality Enhanced)

## 版本
v4.6.0

## 理论来源
- Stanford Encyclopedia of Philosophy: Collective Intentionality
- Searle, J. (1990, 1995). "Collective Intentions and Actions"
- Bratman, M. (1999). "Shared Intention"
- Gilbert, M. (1990, 2006). "Walking Together" / "Joint Commitment"
- Walther, G. (1923). 共享经验三重结构
- Scheler, M. (1954 [1912]). "The Nature of Sympathy"

## 核心功能

### 1. We-Intention 检测与生成
- 识别语言中的"我们意向"标记
- 评估 We-Intention 置信度
- 构建意向结构

### 2. 联合承诺 (Joint Commitment)
- 形成联合承诺
- 评估承诺强度
- 生成规范性期望

### 3. 共享目标表征
- 表征共享目标
- 评估目标共享程度
- 支持子计划协调

### 4. 相互信念建模
- 建模相互信念层级
- 计算信念强度
- 支持共同知识建立

### 5. 集体行动协调
- 协调集体行动
- 定义成功条件
- 识别潜在障碍

## 使用示例

```javascript
const { CollectiveIntentionalityEnhanced } = require('./collective-intentionality-enhanced');

const ci = new CollectiveIntentionalityEnhanced();

// 检测 We-Intention
const detection = ci.detectWeIntention('我们一起完成这个项目');
console.log(detection);

// 形成联合承诺
const commitment = ci.formJointCommitment(
  '共同完成 HeartFlow v4.6.0 升级',
  ['AI', 'User'],
  { mutuality: 0.9, normativity: 0.95 }
);

// 表征共享目标
const goal = ci.representSharedGoal('增强集体情绪理解能力', {
  clarity: 0.8,
  achievability: 0.7,
  importance: 0.9
});

// 评估集体意向性质量
const assessment = ci.assessCollectiveIntentionalityQuality();
console.log(assessment);

// 生成练习
const exercises = ci.generateCollectiveIntentionalityExercises();
console.log(exercises);
```

## 核心理论要点

### Irreducibility Claim (不可还原性)
集体意向不可还原为个体意向的简单加总。"我们意向"不是"我意向"+"你意向"。

### Individual Ownership Thesis (个体所有权论题)
尽管集体意向不可还原，但它仍然由个体承载，不存在"群体心智"。

### We-Intention (Searle)
"We intend to do X" 是一种原始的意向形式，不能分析为 individual intentions + mutual beliefs。

### Joint Commitment (Gilbert)
联合承诺产生规范性约束：每个参与者都有权期望其他参与者履行承诺，单方面撤销需要正当理由。

### Shared Intention (Bratman)
共享意向涉及相互响应、承诺共同目标、承诺相互支持、子计划协调。

## 练习技术

模块提供 5 个核心练习：
1. 我们意向觉察练习 (10-15 分钟)
2. 联合承诺建立练习 (15-20 分钟)
3. 共享目标协调练习 (20-30 分钟)
4. 相互信念建立练习 (10-15 分钟)
5. 集体行动协调练习 (30-60 分钟)

## API 参考

### 类方法

- `detectWeIntention(message, context)` - 检测 We-Intention
- `formJointCommitment(content, participants, options)` - 形成联合承诺
- `representSharedGoal(content, options)` - 表征共享目标
- `modelMutualBelief(content, believers, options)` - 建模相互信念
- `coordinateCollectiveAction(description, participants, options)` - 协调集体行动
- `assessCollectiveIntentionalityQuality()` - 评估集体意向性质量
- `generateCollectiveIntentionalityExercises()` - 生成练习
- `getStatus()` - 获取模块状态

## 依赖
无外部依赖

## 许可证
MIT
