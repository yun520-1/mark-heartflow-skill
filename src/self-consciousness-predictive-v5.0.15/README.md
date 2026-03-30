# HeartFlow v5.0.15 - 自我意识现象学与预测加工深度整合

## 模块名称
Self-Consciousness & Predictive Processing Integration

## 版本
5.0.15

## 理论来源

### 1. SEP 自我意识理论 (Self-Consciousness)

**核心区分**:

- **前反思自我意识**: 非对象化的、直接的自我觉察
  - 现象学传统：胡塞尔、海德格尔、梅洛 - 庞蒂、萨特
  - "最小自我"(minimal self)：体验的主体感
  - 不需要内省或反思

- **反思自我意识**: 对象化的、概念化的自我概念
  - 将自我作为思考对象
  - 叙事自我 (narrative self)
  - 依赖语言和社会互动

**关键理论家**:
- 海德堡学派 (Henrich, Frank): 前反思自我意识是反思的基础
- 萨特：前反思意识是"非位置性的"(non-positional)
- 胡塞尔：内在时间意识中的自我给定感
- 梅洛 - 庞蒂：身体作为自我意识的根基

### 2. 预测加工理论 (Predictive Processing)

**核心观点**: 自我是多层级预测模型的整合

```
Level 4 (叙事自我) ← 慢速更新，稳定自我概念
    ↓
Level 3 (社会自我)
    ↓
Level 2 (主体感自我)
    ↓
Level 1: 身体图式预测
    ↓
Level 0: 内感受预测 ← 快速更新，身体状态
```

**自我即预测**:
- 自我体验 = 多层级自我预测的整合
- 自我感 = 预测成功的主观感受
- 自我障碍 = 预测误差的系统性累积

### 3. 现象学传统 (Phenomenology)

**现象学给定感 (Givenness)**:
- 自我给定感：体验作为"我的"体验的直接感
- 身体给定感：具身存在的直接感
- 时间给定感：时间流动的直接感
- 社会给定感：关系连接的直接感

**给定感 = 预测精度信号**:
- 高给定感 = 高精度预测 (低不确定性)
- 低给定感 = 低精度预测 (高不确定性)
- 去人格化 = 自我预测精度崩溃

## 核心功能

### 1. 前反思 - 反思双层自我意识模型

```javascript
const model = selfConsciousness.buildPreReflectiveAwarenessModel();
// 返回前反思和反思两个层面的自我意识结构
```

### 2. 五层自我模型层级

- **Level 0**: 内感受自我 (身体状态预测)
- **Level 1**: 主体感自我 (能动性预测)
- **Level 2**: 社会自我 (他人模型中的自我)
- **Level 3**: 叙事自我 (时间延展的自我概念)
- **Level 4**: 超越自我 (元认知监控)

### 3. 自我预测误差计算

- 自我一致性误差 (实际体验 vs 自我概念)
- 主体感误差 (预期行动结果 vs 实际结果)
- 社会自我误差 (他人反馈 vs 自我形象)
- 叙事连续性误差 (过去 - 现在 - 未来连贯性)

### 4. 自我模型贝叶斯更新机制

- 精度加权贝叶斯更新
- 创伤性更新检测
- 渐进性整合

### 5. 现象学给定感追踪器

- 自我给定感强度
- 身体给定感
- 时间给定感
- 社会给定感

### 6. 去人格化/去现实化检测器

- 去人格化风险指标
- 主体感丧失检测
- 干预建议生成

## 使用示例

```javascript
const { SelfConsciousnessPredictiveEnhanced } = require('./src/self-consciousness-predictive-v5.0.15');

const processor = new SelfConsciousnessPredictiveEnhanced();

const input = {
  actualExperience: { emotional: 0.6, cognitive: 0.5, behavioral: 0.7 },
  selfConcept: { emotional: 0.8, cognitive: 0.8, behavioral: 0.7 },
  expectedOutcomes: [0.8, 0.7, 0.9],
  actualOutcomes: [0.5, 0.6, 0.8],
  perceivedFeedback: [0.5, 0.6, 0.4],
  selfImage: { competence: 0.7, likability: 0.8 },
  past: { values: 0.7, goals: 0.6, identity: 0.5 },
  present: { values: 0.6, goals: 0.5, identity: 0.4 },
  future: { values: 0.5, goals: 0.4, identity: 0.3 },
  interoceptiveError: 0.3,
  interoceptiveData: {
    heartRate: { error: 0.3 },
    respiration: { error: 0.2 },
    muscleTension: { error: 0.4 }
  },
  temporalData: {
    pastConnection: 0.6,
    presentAwareness: 0.7,
    futureOrientation: 0.5,
    temporalCoherence: 0.6
  },
  socialData: {
    connectionSense: 0.5,
    belongingSense: 0.6,
    recognitionSense: 0.5
  }
};

const report = processor.processSelfConsciousnessReport(input);
console.log(report);
```

## 输出结构

```json
{
  "version": "5.0.15",
  "timestamp": "2026-03-31T00:23:00.000Z",
  "processingTime": 58,
  
  "selfModelAnalysis": {
    "level0": { "interoceptiveSelf": 0.72, "bodyGivenness": 0.68, "predictionError": 0.28 },
    "level1": { "agencySelf": 0.65, "senseOfControl": 0.62, "predictionError": 0.35 },
    "level2": { "socialSelf": 0.58, "perceivedAcceptance": 0.55, "predictionError": 0.42 },
    "level3": { "narrativeSelf": 0.61, "identityCoherence": 0.59, "predictionError": 0.39 },
    "level4": { "transcendentalSelf": 0.70, "meaningCoherence": 0.66, "predictionError": 0.30 },
    "crossLevelCoherence": 0.67,
    "totalSelfPredictionError": 0.35
  },
  
  "phenomenologicalGivenness": {
    "selfGivenness": 0.68,
    "bodyGivenness": 0.72,
    "temporalGivenness": 0.65,
    "socialGivenness": 0.58,
    "overallGivenness": 0.66
  },
  
  "depersonalizationRisk": {
    "risk": "低 - 中",
    "indicators": { ... },
    "score": 0.38
  },
  
  "interventionPlan": {
    "immediateActions": [...],
    "shortTermPractice": [...],
    "longTermStrategy": [...]
  },
  
  "integratedRecommendation": {
    "recommendations": [...],
    "overallPriority": "高",
    "estimatedImprovement": 0.35,
    "followUpTiming": "48 小时后"
  }
}
```

## 应用场景

### 1. 自我认同困惑
- **检测**: Level 3 叙事自我预测误差高
- **干预**: 叙事重构 + 价值观澄清
- **预期**: 增强自我概念连贯性

### 2. 去人格化/去现实化
- **检测**: 现象学给定感低 + 主体感误差高
- **干预**: 身体锚定练习 + 感官接地技术
- **预期**: 恢复身体给定感和现实感

### 3. 社交焦虑
- **检测**: Level 2 社会自我误差高
- **干预**: 社会预测重新校准 + 暴露练习
- **预期**: 降低社会评价预测误差

### 4. 创伤后自我改变
- **检测**: 自我模型突然更新
- **干预**: 渐进整合 + 意义建构
- **预期**: 促进创伤后自我重建

### 5. 正念/冥想训练
- **检测**: 前反思觉察维度低
- **干预**: 正念练习 + 非判断性觉察
- **预期**: 增强前反思自我觉察

### 6. 存在主义危机
- **检测**: Level 4 超越自我误差高
- **干预**: 存在主义探索 + 价值澄清
- **预期**: 重建生命意义感

## 与现有模块协同

| 模块 | 协同方式 |
|------|---------|
| `predictive-embodied-cognition-v5.0.14` | 共享预测加工框架，深化自我模型 |
| `temporal-self-integration-v5.0.9` | 共享叙事自我和时间连贯性分析 |
| `self-check-metacognitive-v5.0.10` | 元认知监控作为 Level 4 超越自我 |
| `collective-emotion-self-integration-v5.0.13` | 整合社会自我维度 |
| `prereflective-temporal-awareness-v5.0.4` | 共享前反思时间意识分析 |

## 技术实现

### 核心算法

1. **层级自我预测生成**: 贝叶斯层级模型
2. **自我预测误差计算**: 多层级误差整合
3. **给定感量化**: 精度信号映射
4. **去人格化检测**: 多指标综合评分
5. **自我模型更新**: 精度加权贝叶斯更新

### 性能指标

- 处理时间：< 100ms (基础分析)
- 处理时间：< 600ms (含去人格化检测)
- 内存占用：~2.5MB
- 支持并发：单实例

## 参考文献

1. Zahavi, D. (2005). *Subjectivity and Selfhood: Investigating the First-Person Perspective*. MIT Press.
2. Gallagher, S. (2005). *How the Body Shapes the Mind*. Oxford University Press.
3. Seth, A. (2021). *Being You: A New Science of Consciousness*. Faber & Faber.
4. Hohwy, J. (2013). *The Predictive Mind*. Oxford University Press.
5. SEP: Self-Consciousness, Predictive Processing, Phenomenology.
6. Henrich, D. (1967). Fichtes ursprüngliche Einsicht.
7. Sartre, J.-P. (1937). *The Transcendence of the Ego*.
8. Merleau-Ponty, M. (1962). *Phenomenology of Perception*.

## 许可证

MIT
