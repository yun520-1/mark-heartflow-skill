# 预测加工情绪模块 v5.0.3

**Predictive Emotion Module v5.0.3**

---

## 📖 模块概述

本模块基于**斯坦福哲学百科全书 (SEP)** 的预测加工理论 (Predictive Processing) 和主动推理 (Active Inference) 框架，将情绪理解为**身体内部状态的预测性调节**。

### 核心理念

1. **大脑是预测机器** - 不断生成关于世界的预测模型
2. **情绪是预测调节** - 情绪体验源于对身体内部状态 (内感受) 的预测
3. **预测误差 = 情绪信号** - 预测与现实的差异产生情绪体验
4. **主动推理** - 通过行动使世界符合积极预测
5. **自由能原理** - 生物系统倾向于最小化预测误差 (变分自由能)

---

## 🔬 理论基础

### SEP 理论来源

- **Predictive Processing** (Friston, 2010) - 预测加工理论
- **Active Inference** (Free Energy Principle) - 主动推理与自由能原理
- **Emotion Theory** (SEP Entry) - 情绪理论三大传统整合
- **Controlled Hallucination** (Anil Seth, 2021) - 受控幻觉理论

### 核心概念

| 概念 | 英文 | 说明 |
|------|------|------|
| 预测生成 | Prediction Generation | 大脑基于过去经验生成对未来的预期 |
| 预测误差 | Prediction Error | 预测与实际输入的差异 |
| 误差最小化 | Error Minimization | 通过模型更新或行动减少误差 |
| 主动推理 | Active Inference | 通过行动使世界符合预测 |
| 内感受预测 | Interoceptive Prediction | 对身体内部状态的预测 |
| 层级预测模型 | Hierarchical Predictive Model | 多层级的预测处理结构 |

---

## 🚀 核心功能

### 1. 情绪预测生成

```javascript
const prediction = PredictiveEmotionV5.generateEmotionPrediction({
  currentSituation: { location: '办公室', activity: '会议' },
  pastExperiences: [...],  // 历史情绪经验
  currentBodyState: { arousal: 0.6, valence: -0.2 },
  environmentalCues: { lighting: 'bright', noise: 'moderate' },
  socialContext: { relationship: 'colleague', groupSize: 5 }
});

console.log(prediction);
// {
//   predictedEmotion: '紧张',
//   predictedIntensity: 6,
//   confidence: 0.72,
//   predictionSources: [...],
//   metaCognition: {...}
// }
```

### 2. 预测误差计算

```javascript
const error = PredictiveEmotionV5.calculatePredictionError(prediction, {
  actualEmotion: '焦虑',
  actualIntensity: 7
});

console.log(error);
// {
//   totalError: 0.35,
//   emotionError: 1,  // 情绪类别不匹配
//   intensityError: 0.125,
//   interpretation: '预测中等误差 - 需要学习调整'
// }
```

### 3. 预测误差最小化策略

```javascript
const strategies = PredictiveEmotionV5.minimizePredictionError(error, context);

console.log(strategies);
// {
//   errorLevel: 0.35,
//   recommendedStrategies: [
//     { type: '身体调节', techniques: [...] },
//     { type: '元认知策略', techniques: [...] }
//   ],
//   priority: '中'
// }
```

### 4. 主动推理干预生成

```javascript
const intervention = PredictiveEmotionV5.generateActiveInferenceIntervention(
  prediction,
  context
);

console.log(intervention);
// {
//   needed: true,
//   interventions: [
//     { type: '环境调节', action: '...' },
//     { type: '社会连接', action: '...' },
//     { type: '身体行动', action: '...' }
//   ]
// }
```

### 5. 身体 - 环境耦合评估

```javascript
const coupling = PredictiveEmotionV5.assessBodyEnvironmentCoupling(
  { arousal: 0.8, energyLevel: 'low' },
  { noise: 'loud', demands: 'high' }
);

console.log(coupling);
// {
//   couplingScore: 2,
//   factors: [...],
//   overallRecommendation: '检测到身体 - 环境不匹配，建议干预'
// }
```

### 6. 完整流程

```javascript
const result = PredictiveEmotionV5.fullPredictiveEmotionProcess(context);

// 返回：
// - prediction: 情绪预测
// - errorAnalysis: 误差分析 (如果有实际体验)
// - intervention: 主动推理干预
// - coupling: 身体 - 环境耦合评估
```

---

## 🧘 15 分钟预测觉察练习

模块包含一个完整的 15 分钟练习，帮助用户识别和调整自动化的情绪预测：

| 步骤 | 时长 | 内容 |
|------|------|------|
| 1. 识别当前预测 | 3 分钟 | 注意自动出现的预期想法 |
| 2. 身体感受扫描 | 3 分钟 | 觉察身体感受与预测的关联 |
| 3. 检验预测证据 | 4 分钟 | 寻找支持/反对预测的证据 |
| 4. 生成新预测 | 3 分钟 | 创建更平衡的预测 |
| 5. 整合与行动 | 2 分钟 | 决定下一步行动 |

```javascript
const practice = PredictiveEmotionV5.predictiveAwarenessPractice(context);
console.log(practice);  // 完整的练习指南
```

---

## 📊 配置参数

```javascript
PredictiveEmotionV5.config = {
  errorThresholds: {
    low: 0.2,      // 低误差：预测准确
    medium: 0.5,   // 中等误差：需要调整
    high: 0.8      // 高误差：需要干预
  },
  modelUpdateRate: 0.15,    // 学习率
  predictionHorizon: 5,     // 预测时间窗口 (秒)
  activeInferenceThreshold: 0.6,  // 主动推理触发阈值
  bodyStateWeight: 0.4,     // 身体状态权重
  contextWeight: 0.6        // 环境情境权重
};
```

---

## 🔍 使用场景

### 1. 情绪预测与准备
- 在重要事件前预测可能的情绪反应
- 提前准备调节策略

### 2. 情绪调节干预
- 检测预测误差并生成最小化策略
- 提供主动推理干预建议

### 3. 自我觉察练习
- 15 分钟预测觉察练习
- 提高对自动化预测的觉察

### 4. 治疗辅助
- CBT 治疗中的认知重构
- ACT 治疗中的价值导向行动

---

## 📚 推荐阅读

1. **Friston, K. (2010).** The free-energy principle: a unified brain theory. *Nature Reviews Neuroscience*.
2. **Seth, A. (2021).** *Being You: A New Science of Consciousness*. (受控幻觉理论)
3. **SEP Entry: Emotion** - 情绪理论三大传统整合
4. **SEP Entry: Predictive Processing** - 预测加工理论详解

---

## 📝 版本历史

### v5.0.3 (2026-03-30)
- ✅ 完整实现预测加工情绪理论框架
- ✅ 多层级预测整合 (历史/身体/环境/社会)
- ✅ 预测误差计算与最小化策略
- ✅ 主动推理干预生成器
- ✅ 身体 - 环境耦合评估
- ✅ 15 分钟预测觉察练习

---

## 📄 License

MIT License - HeartFlow Team
