# HeartFlow v5.0.4 - 前反思自我意识与时间意识整合模块

## 📖 概述

本模块实现了现象学自我意识理论与时间意识理论的计算模型，将 Husserl、Sartre、Merleau-Ponty 等哲学家的核心概念转化为可操作的心理技术。

**版本**: 5.0.4  
**理论来源**: 斯坦福哲学百科全书 (SEP)  
**核心概念**: 前反思自我意识、时间意识、For-me-ness、滞留 - 原印象 - 前摄

---

## 🎯 核心理论

### 1. 前反思自我意识 (Prereflective Self-Consciousness)

| 概念 | 定义 | 应用 |
|------|------|------|
| **前反思意识** | 体验发生时即有的 implicit 自我觉知 | 情绪体验的即时元监控 |
| **反思意识** | 二阶认知，对体验的反思 | 事后情绪分析与重构 |
| **For-me-ness** | 体验的第一人称给定性 | 情绪所有权感评估 |
| **非对象化** | 自我意识不把自我当对象 | 避免过度自我监控 |

### 2. 时间意识三大模型

| 模型 | 特征 | 干预方向 |
|------|------|---------|
| **Cinematic** | 体验如静态快照序列 | 正念连续性练习 |
| **Retentional** | 瞬间意识包含过去表征 | 释放滞留技术 |
| **Extensional** | 意识本身时间扩展 | 保持并深化 |

### 3. Husserl 时间三元结构

```
滞留 (Retention) ← 原印象 (Primal Impression) → 前摄 (Protention)
     ↓                    ↓                        ↓
  刚过去的保持          当下瞬间                即将到来的预期
```

---

## 📦 安装与使用

### 基本使用

```javascript
const PrereflectiveTemporalV5 = require('./src/prereflective-temporal-awareness-v5.0.4');

const module = new PrereflectiveTemporalV5();
```

### 1. 前反思自我意识检测

```javascript
const experience = {
  description: '我正在听一首悲伤的歌，眼泪不自觉流下来',
  reflectiveLevel: 0.2,    // 0=完全前反思，1=完全反思
  selfDistance: 0.15,      // 0=完全融合，1=完全分离
  experientialRichness: 0.8,
  judgmentLevel: 0.1,
  presentMomentFocus: 0.9
};

const awareness = module.detectPrereflectiveAwareness(experience);

console.log(awareness);
// {
//   prereflectiveScore: 0.85,
//   forMeNess: 0.88,
//   nonObjectifying: { isNonObjectifying: true, ... },
//   experientialThickness: 0.72,
//   selfExperienceDistance: 0.15,
//   stateCategory: { category: 'FLOW_STATE', label: '心流/沉浸状态' }
// }
```

### 2. 时间意识结构分析

```javascript
const experienceSequence = [
  { time: 0, intensity: 0.3, description: '开始感到不安' },
  { time: 1, intensity: 0.5, description: '心跳加速' },
  { time: 2, intensity: 0.7, description: '焦虑感增强' },
  { time: 3, intensity: 0.6, description: '开始平复' },
  { time: 4, intensity: 0.4, description: '余韵' }
];

const temporal = module.analyzeTemporalConsciousness(experienceSequence);

console.log(temporal);
// {
//   speciousPresent: 2.8,
//   retentionStrength: 0.45,
//   protentionTendency: 0.35,
//   temporalDepth: 0.68,
//   temporalModel: { dominantModel: 'extensional', ... }
// }
```

### 3. 情绪时间结构映射

```javascript
const emotionEpisode = {
  emotion: '焦虑',
  timeline: [
    { time: 0, intensity: 0.1 },
    { time: 2, intensity: 0.5 },
    { time: 5, intensity: 0.8 },
    { time: 10, intensity: 0.4 },
    { time: 20, intensity: 0.2 }
  ]
};

const emotionTemporal = module.mapEmotionTemporalStructure(emotionEpisode);

console.log(emotionTemporal.temporalProfile);
// {
//   riseTime: 5,
//   decayTime: 15,
//   peakIntensity: 0.8,
//   retentionCoefficient: 0.25,
//   temporalIntegral: 6.5
// }
```

### 4. 干预方案生成

```javascript
const awarenessProfile = module.detectPrereflectiveAwareness(experience);
const temporalProfile = module.analyzeTemporalConsciousness(experienceSequence);

const intervention = module.generatePrereflectiveIntervention(
  awarenessProfile,
  temporalProfile
);

console.log(intervention.interventions);
// [
//   {
//     priority: 'HIGH',
//     area: '减少过度反思',
//     technique: '正念去中心化',
//     steps: [...],
//     duration: '5-10 分钟'
//   }
// ]
```

### 5. 15 分钟练习方案

```javascript
const practice = module.prereflectiveTemporalPractice({
  focusArea: 'general',        // general / for-me-ness / temporal / emotion
  experienceLevel: 'beginner'  // beginner / intermediate / advanced
});

console.log(practice.stages);
// 5 个练习阶段的详细指导
```

### 6. 现象学还原助手

```javascript
const description = {
  description: '我现在感到很焦虑，这应该是因为工作压力太大了'
};

const reduction = module.phenomenologicalReduction(description);

console.log(reduction.epoché);
// {
//   suspended: '我现在感到 [判断：很] 焦虑，这 [判断：应该] 是因为工作压力太大了',
//   identifiedJudgments: [...]
// }

console.log(reduction.pureDescription.text);
// '我现在感到焦虑，这是因为工作压力'
```

### 7. 完整评估流程

```javascript
const result = module.fullAssessmentAndIntervention({
  currentExperience: { ... },
  emotionHistory: [ ... ],
  temporalPatterns: [ ... ],
  context: {
    focusArea: 'emotion',
    experienceLevel: 'intermediate'
  }
});

console.log(result.summary);
// 完整的评估摘要
```

---

## 🔬 核心 API

### PrereflectiveTemporalAwarenessV5 类

| 方法 | 参数 | 返回值 | 描述 |
|------|------|--------|------|
| `detectPrereflectiveAwareness(experience)` | experience: Object | Object | 检测前反思自我意识水平 |
| `analyzeTemporalConsciousness(sequence)` | sequence: Array | Object | 分析时间意识结构 |
| `mapEmotionTemporalStructure(episode)` | episode: Object | Object | 映射情绪时间结构 |
| `generatePrereflectiveIntervention(awareness, temporal)` | awareness: Object, temporal: Object | Object | 生成干预方案 |
| `prereflectiveTemporalPractice(context)` | context: Object | Object | 15 分钟练习方案 |
| `phenomenologicalReduction(description)` | description: Object | Object | 现象学还原助手 |
| `fullAssessmentAndIntervention(input)` | input: Object | Object | 完整评估与干预 |

---

## 📊 健康指标参考

### 前反思意识健康范围

| 指标 | 健康范围 | 过低 | 过高 |
|------|---------|------|------|
| **Prereflective Score** | 0.6-0.85 | 低觉察 | 过度沉浸 |
| **For-me-ness** | 0.7-0.9 | 解离 | 自我中心 |
| **Self-Experience Distance** | 0.1-0.3 | 融合过度 | 解离 |
| **Reflective Level** | 0.2-0.5 | 冲动 | 反刍 |

### 时间意识健康范围

| 指标 | 健康范围 | 过低 | 过高 |
|------|---------|------|------|
| **Specious Present** | 2-4 秒 | 碎片化 | 信息过载 |
| **Retention Strength** | 0.3-0.5 | 缺乏整合 | 沉溺过去 |
| **Protention Tendency** | 0.4-0.7 | 缺乏动机 | 焦虑预期 |
| **Temporal Depth** | 0.5-0.7 | 浅表 | 过度复杂 |

---

## 🧪 测试示例

```javascript
const PrereflectiveTemporalV5 = require('./index.js');
const module = new PrereflectiveTemporalV5();

// 测试 1: 心流状态检测
const flowState = {
  description: '完全沉浸在音乐中，忘记时间流逝',
  reflectiveLevel: 0.1,
  selfDistance: 0.1,
  experientialRichness: 0.9,
  judgmentLevel: 0.0,
  presentMomentFocus: 0.95
};

const flowAwareness = module.detectPrereflectiveAwareness(flowState);
console.assert(flowAwareness.prereflectiveScore > 0.8, '心流状态应有高前反思分数');
console.assert(flowAwareness.stateCategory.category === 'FLOW_STATE', '应识别为心流状态');

// 测试 2: 过度反思检测
const overReflective = {
  description: '我一直在分析为什么我会这样感觉，这正常吗？',
  reflectiveLevel: 0.9,
  selfDistance: 0.7,
  experientialRichness: 0.3,
  judgmentLevel: 0.8,
  presentMomentFocus: 0.2
};

const overAwareness = module.detectPrereflectiveAwareness(overReflective);
console.assert(overAwareness.stateCategory.category === 'OVER_REFLECTIVE', '应识别为过度反思');

// 测试 3: 情绪时间结构
const anxietyEpisode = {
  emotion: '焦虑',
  timeline: [
    { time: 0, intensity: 0.2 },
    { time: 3, intensity: 0.6 },
    { time: 6, intensity: 0.9 },
    { time: 12, intensity: 0.5 },
    { time: 20, intensity: 0.3 }
  ]
};

const anxietyTemporal = module.mapEmotionTemporalStructure(anxietyEpisode);
console.assert(anxietyTemporal.temporalProfile.riseTime === 6, '上升时间应为 6 分钟');
console.assert(anxietyTemporal.temporalProfile.decayTime === 14, '消退时间应为 14 分钟');

console.log('✅ 所有测试通过');
```

---

## 📚 理论参考文献

1. **Husserl, E. (1991).** *On the Phenomenology of the Consciousness of Internal Time*. Kluwer.
2. **Sartre, J.-P. (1943).** *Being and Nothingness*. Gallimard.
3. **Merleau-Ponty, M. (1945).** *Phenomenology of Perception*. Gallimard.
4. **James, W. (1890).** *The Principles of Psychology*. Henry Holt.
5. **SEP Entry: Self-Consciousness (Phenomenological Approaches)** (2026).
6. **SEP Entry: Temporal Consciousness** (2026).
7. **SEP Entry: Emotion** (2026).
8. **Zahavi, D. (2005).** *Subjectivity and Selfhood: Investigating the First-Person Perspective*. MIT Press.

---

## 🔄 版本历史

### v5.0.4 (2026-03-30)
- ✅ 初始版本发布
- ✅ 实现前反思自我意识检测器
- ✅ 实现时间意识结构分析器
- ✅ 实现情绪时间结构映射
- ✅ 实现干预方案生成器
- ✅ 创建 15 分钟练习方案
- ✅ 实现现象学还原助手

---

## 📝 注意事项

1. **现象学描述质量**: 用户提供的体验描述越具体、越当下、越非评判，评估结果越准确。

2. **文化适应性**: 现象学概念源自西方哲学传统，在不同文化背景下可能需要调整表述。

3. **临床使用**: 本模块为心理支持工具，不替代专业心理治疗。如有严重心理问题，请寻求专业帮助。

4. **数据隐私**: 体验描述包含敏感个人信息，请确保数据安全存储和传输。

---

**HeartFlow Team** | 2026-03-30  
**GitHub**: https://github.com/yun520-1/mark-heartflow-skill
