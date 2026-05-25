# 预测加工情绪增强模块 (Predictive Emotion Enhancement)

> **版本**: 1.0.0 | **HeartFlow**: v4.5.0+

## 理论基础

本模块基于 **Stanford Encyclopedia of Philosophy** 的预测加工理论 (Predictive Processing):

### 核心原理

1. **大脑是预测机器** - 不断生成对世界的假设和预期
2. **情绪是预测调节** - 情绪体验基于对身体状态的预测
3. **预测误差最小化** - 认知系统的核心目标是减少预测与实际输入的差异
4. **主动推理** - 通过行动改变感觉输入以符合预测

### 关键概念

| 概念 | 说明 | 代码实现 |
|------|------|---------|
| 预测生成 | 基于过去经验生成情境预期 | `generateEmotionPrediction()` |
| 预测误差 | 预测与实际体验的差异 | `calculatePredictionError()` |
| 模型更新 | 根据误差调整内部模型 | `updateEmotionModel()` |
| 误差最小化 | 执行策略减少误差 | `minimizePredictionError()` |

## 功能特性

### 1. 情绪预测

```javascript
const prediction = PredictiveEmotionEnhanced.generateEmotionPrediction({
  currentSituation: { keywords: ['工作', '压力', 'deadline'] },
  pastExperiences: [...],
  currentBodyState: { arousal: 0.7 }
});

// 输出:
// {
//   predictedEmotion: '焦虑',
//   predictedIntensity: 3.5,
//   confidence: 0.75,
//   basis: '基于 12 个相似情境'
// }
```

### 2. 预测误差计算

```javascript
const error = PredictiveEmotionEnhanced.calculatePredictionError(
  { predictedEmotion: '焦虑', predictedIntensity: 3.5 },
  { emotion: '平静', intensity: 2 }
);

// 输出:
// {
//   totalError: 0.7,
//   emotionError: 1,
//   intensityError: 0.3,
//   exceedsThreshold: true
// }
```

### 3. 误差最小化策略

当预测误差超过阈值时，系统推荐以下策略：

| 策略 | 类型 | 效果 | 说明 |
|------|------|------|------|
| 认知重评 | 模型更新 | 85% | 调整对情境的解释 |
| 情境改变 | 主动推理 | 75% | 通过行动改变情境 |
| 注意转移 | 注意部署 | 60% | 转向预测准确的方面 |

## 使用示例

### 完整情绪预测循环

```javascript
const PredictiveEmotionEnhanced = require('./predictive-emotion-enhanced');

const context = {
  currentSituation: {
    keywords: ['演讲', '公众', '评价'],
    category: 'social_performance'
  },
  pastExperiences: [
    { situation: { keywords: ['演讲', '紧张'] }, emotion: '焦虑', intensity: 4 },
    { situation: { keywords: ['演讲', '准备充分'] }, emotion: '自信', intensity: 3 }
  ],
  currentEmotion: { emotion: '紧张', intensity: 3 },
  currentBodyState: { arousal: 0.6, heartRate: 85 }
};

const result = PredictiveEmotionEnhanced.processEmotionCycle(context);

console.log('预测:', result.prediction);
console.log('误差:', result.error);
console.log('建议策略:', result.strategies);
```

## 觉察练习

模块提供三种基于预测加工理论的觉察练习：

### 1. 预测觉察冥想 (5 分钟)

**步骤**:
1. 闭上眼睛，注意当前的情绪状态
2. 问自己：我预测接下来会发生什么？
3. 注意身体对预测的反应
4. 观察预测与实际体验的差异
5. 不评判，只是觉察

**益处**: 增强对预测过程的元认知觉察

### 2. 情绪预测日志 (每日)

**步骤**:
1. 记录情境触发事件
2. 写下预测的情绪反应
3. 记录实际的情绪体验
4. 比较预测与实际的差异
5. 反思：什么导致了差异？

**益处**: 提高情绪预测准确性

### 3. 预测误差探索 (10 分钟)

**步骤**:
1. 回想一次情绪预测错误的经历
2. 探索：为什么预测错了？
3. 识别：忽略了什么信息？
4. 学习：如何改进预测模型？
5. 整合：将学习应用到未来情境

**益处**: 从预测误差中学习成长

## 配置选项

```javascript
PredictiveEmotionEnhanced.config = {
  defaultErrorThreshold: 0.5,  // 默认误差阈值
  minErrorThreshold: 0.2,      // 最小阈值
  maxErrorThreshold: 0.8,      // 最大阈值
  modelUpdateRate: 0.1,        // 模型更新率
  predictionHorizon: 5         // 预测时间窗口 (秒)
};
```

## 研究依据

### 预测加工理论核心发现

1. **感知是受控幻觉** (Friston, 2010)
   - 大脑不是被动接收信息，而是主动生成预测
   - 感知是"自上而下"预测与"自下而上"输入的结合

2. **情绪作为预测** (Barrett, 2017)
   - 情绪概念是大脑预测身体状态的模型
   - 情绪体验是预测与身体感觉的整合

3. **预测误差最小化** (Clark, 2013)
   - 认知系统的核心功能是减少预测误差
   - 通过模型更新或主动行动实现

## 与其他模块的整合

### 与情绪调节模块整合

```javascript
// 预测误差检测 → 触发调节策略
if (error.exceedsThreshold) {
  const strategies = EmotionRegulation.recommendStrategies(context);
}
```

### 与 CBT 模块整合

```javascript
// 预测误差 → 认知重评
const reframe = CBT.reframing.generate({
  prediction: result.prediction,
  actual: result.actualState,
  error: result.error
});
```

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-03-30 | 初始版本，整合 SEP 预测加工理论 |

## 参考文献

- Friston, K. (2010). The free-energy principle: a unified brain theory. *Nature Reviews Neuroscience*.
- Barrett, L. F. (2017). *How Emotions Are Made*. Houghton Mifflin Harcourt.
- Clark, A. (2013). Whatever next? Predictive brains, situated agents, and the future of cognitive science. *Behavioral and Brain Sciences*.
- Stanford Encyclopedia of Philosophy. "Predictive Processing". https://plato.stanford.edu/

---

**HeartFlow Companion** - 让 AI 交互更有温度 🌊
