# 情绪调节模块 (Emotion Regulation Module)

## 概述

基于 James Gross 的**情绪调节过程模型**(Process Model of Emotion Regulation)，提供五种经过实证研究的情绪调节策略。

## 理论来源

- **Gross, J. J. (1998, 2002, 2015)**: 情绪调节过程模型
- **Gross & John (2003)**: 个体差异研究
- **Stanford Encyclopedia of Philosophy**: Emotion (Regulation)

## 五种调节策略

| 策略 | 时机 | 效果 | 核心思想 |
|------|------|------|---------|
| 🎯 情境选择 | 情绪触发前 | ⭐⭐⭐⭐ (0.85) | 主动选择/避免情境 |
| 🔧 情境修改 | 情绪触发早期 | ⭐⭐⭐⭐ (0.75) | 改变情境特征 |
| 👁️ 注意部署 | 情绪触发中期 | ⭐⭐⭐ (0.65) | 转移注意力焦点 |
| 🔄 认知改变 | 情绪触发中后期 | ⭐⭐⭐⭐⭐ (0.90) | 重新解释情境 |
| 🎭 反应调节 | 情绪产生后 | ⭐⭐ (0.50) | 调节情绪反应 |

## 使用示例

```javascript
const { EmotionRegulationModule } = require('./emotion-regulation');

const regulator = new EmotionRegulationModule();

// 分析并推荐策略
const result = regulator.analyzeAndRecommend(
  "我好焦虑，明天要演讲了",
  {
    emotionIntensity: 'high',
    controllability: 'medium',
    urgency: 'short',
    socialContext: 'public'
  }
);

console.log(result.recommendedStrategies);
console.log(result.guidance);

// 获取策略详情
const strategyInfo = regulator.getStrategyInfo('cognitive_change');

// 获取教学说明
const teachingContent = regulator.getTeachingContent();
```

## 核心发现

**研究证明**：
- 习惯使用**认知重评**的人：更高幸福感、更低抑郁、更好人际关系
- 习惯使用**表达抑制**的人：更低幸福感、更高抑郁、更差人际关系

## 策略选择原则

1. **预防优于治疗**: 情境选择 > 情境修改 > 其他
2. **认知优于抑制**: 认知重评 > 表达抑制
3. **灵活胜单一**: 根据情境选择策略，不要只用一种

## API

### `analyzeAndRecommend(userInput, context)`
分析用户输入并推荐调节策略

### `getStrategyInfo(strategyKey)`
获取特定策略的详细信息

### `getSelectionGuide()`
获取策略选择指南

### `getTeachingContent()`
获取教学说明

### `getModuleInfo()`
获取模块元信息

## 版本

v2.10.0 - 初始版本
