# 预测加工情绪增强模块 (Predictive Emotion Enhancement)

## 版本信息
- **版本**: 1.0.0
- **HeartFlow 版本**: v4.5.0
- **理论来源**: Stanford Encyclopedia of Philosophy - Predictive Processing

## 核心理论

### 预测加工理论 (Predictive Processing)

预测加工理论是当代认知科学和神经科学中最具影响力的框架之一。其核心主张：

1. **大脑是预测机器**: 大脑不断生成对世界（包括内部身体状态）的假设和预测
2. **感知是受控幻觉**: 我们感知到的是大脑的预测，而非原始的感官输入
3. **预测误差最小化**: 认知的核心目标是最小化预测与实际输入之间的差异
4. **主动推理**: 我们可以通过行动改变感觉输入，而不仅仅是更新内部模型

### 情绪作为预测

在预测加工框架下，情绪被理解为：
- 对身体内部状态 (interoception) 的预测调节
- 基于过去经验的情绪预期
- 预测误差触发情绪调整和调节策略

## 模块功能

### 1. 情绪预测生成
```javascript
const prediction = PredictiveEmotionEnhanced.predictiveModel.generatePrediction({
  situation: '社交评价',
  bodyState: '高唤醒 + 紧张',
  pastExperience: { similarity: 0.8, emotionIntensity: 0.7 }
});
```

### 2. 预测误差计算
```javascript
const error = PredictiveEmotionEnhanced.predictionError.calculate(prediction, {
  emotion: '焦虑',
  intensity: 0.5
});
```

### 3. 情绪模型更新
```javascript
const update = PredictiveEmotionEnhanced.modelUpdate.update(error, context);
```

### 4. 误差最小化策略
```javascript
const minimization = PredictiveEmotionEnhanced.errorMinimization.minimize(error, context);
```

### 5. 完整预测循环
```javascript
const result = PredictiveEmotionEnhanced.runPredictiveCycle(context, actualEmotion);
```

## 误差类型与策略

| 误差类型 | 特征 | 推荐策略 |
|---------|------|---------|
| minor (微小) | 情绪相同，强度差异<0.2 | 接纳 (Acceptance) |
| moderate (中等) | 同一家族内，强度差异<0.4 | 认知重评 (Reappraisal) |
| significant (显著) | 情绪家族内差异 | 行动改变 (Action) |
| major (重大) | 跨情绪家族 | 模型修正 (Model Revision) |

## 练习技术

### 情绪预测练习
6 步练习，提高情绪预测准确性：
1. 暂停并觉察
2. 生成预测
3. 记录预测
4. 经历情境
5. 对比实际
6. 学习调整

### 预测误差觉察练习
5 步深度反思练习：
1. 回忆最近的情绪意外
2. 分析预测来源
3. 识别误差类型
4. 探索误差原因
5. 提取学习

## 应用场景

### 1. 焦虑管理
- 预测社交情境的焦虑水平
- 识别预测误差（通常高估）
- 通过暴露和证据收集更新模型

### 2. 情绪调节
- 提前预测情绪触发点
- 准备适当的调节策略
- 减少情绪 surprise 的冲击

### 3. 自我理解
- 识别情绪预测模式
- 发现核心情绪信念
- 校准情绪预期

## API 参考

### PredictiveEmotionEnhanced.predictiveModel
- `generatePrediction(context)` - 生成情绪预测
- `adjustByExperience(pastExperience, basePrediction)` - 基于经验调整
- `calculateConfidence(situation, bodyState)` - 计算置信度

### PredictiveEmotionEnhanced.predictionError
- `calculate(prediction, actual)` - 计算预测误差
- `calculateEmotionDifference(predicted, actual)` - 情绪差异
- `classifyError(emotionDiff, intensityDiff)` - 误差分类
- `calculateSignificance(...)` - 误差显著性

### PredictiveEmotionEnhanced.modelUpdate
- `update(error, context)` - 更新情绪模型

### PredictiveEmotionEnhanced.errorMinimization
- `minimize(error, context)` - 执行误差最小化
- `selectStrategy(error, context)` - 选择策略
- `executeStrategy(strategy, context)` - 执行策略

### PredictiveEmotionEnhanced (核心 API)
- `runPredictiveCycle(context, actualEmotion)` - 完整预测循环
- `emotionPredictionExercise(situation)` - 情绪预测练习
- `predictionErrorAwarenessExercise()` - 误差觉察练习

## 理论参考文献

1. **Friston, K.** (2010). The free-energy principle: a unified brain theory? *Nature Reviews Neuroscience*, 11(2), 127-138.

2. **Clark, A.** (2013). Whatever next? Predictive brains, situated agents, and the future of cognitive science. *Behavioral and Brain Sciences*, 36(3), 181-204.

3. **Barrett, L. F.** (2017). *How Emotions Are Made: The Secret Life of the Brain*. Houghton Mifflin Harcourt.

4. **Seth, A. K.** (2013). Interoceptive inference, emotion, and the embodied self. *Trends in Cognitive Sciences*, 17(11), 565-573.

5. **Stanford Encyclopedia of Philosophy**: Predictive Processing

## 与其他 HeartFlow 模块的整合

- **情绪理论模块**: 提供情绪分类和成分分析
- **元情绪模块**: 监控预测和误差的元认知层面
- **自我意识模块**: 提供前反思的自我觉察基础
- **具身认知模块**: 提供身体状态扫描和环境评估

## 版本历史

### v1.0.0 (2026-03-30)
- 初始版本
- 实现预测加工核心循环
- 整合 SEP 预测加工理论
- 提供 2 个练习技术
