# 情绪 - 集体意向性整合模块 v5.0.11

## Emotion-Collective Intentionality Integration Module

---

## 📋 模块概述

本模块基于 **SEP 情绪理论三大传统** + **集体意向性理论** 深度整合，提供全面的情绪 - 集体交叉分析能力。

### 理论来源

| 理论领域 | SEP 条目 | 核心概念 |
|---------|---------|---------|
| **情绪理论** | Emotion (SEP) | Feeling/Evaluative/Motivational 三大传统 |
| **集体意向性** | Collective Intentionality (SEP) | We-Intention/联合承诺/信任框架 |
| **现象学** | Scheler 1954, Walther 1923 | 共享体验现象学 |

---

## 🎯 核心功能

### 1. 情绪三大传统整合评估

```javascript
const EmotionCollectiveIntegration = require('./emotion-collective-integration-v5.0.11');

const emotionData = {
  emotionType: '焦虑',
  feelingIntensity: 7,
  phenomenology: {
    clarity: 0.8,
    bodilySensations: ['心跳加速', '手心出汗', '肌肉紧张'],
    immediacy: 0.9,
    nonObjectifyingAwareness: 0.7,
    experientialThickness: 0.6
  },
  evaluativeContent: {
    valence: -1,
    normativeAppropriateness: 0.5
  },
  appraisal: {
    goalRelevance: 0.9,
    goalCongruence: 0.2,
    accountability: 0.6,
    copingPotential: 0.4
  },
  motivationalTendency: {
    strength: 0.8,
    direction: 'avoid',
    clarity: 0.6
  },
  actionReadiness: {
    readiness: 0.7,
    goalDirectedness: 0.5
  }
};

const result = EmotionCollectiveIntegration.assessEmotionTraditions(emotionData);

/*
返回结果示例:
{
  feeling: {
    tradition: 'Feeling',
    totalScore: 0.72,
    subScores: { intensity: 0.7, clarity: 0.8, bodilyComponent: 0.6, firstPersonGivenness: 0.73 },
    description: '焦虑的体验较为清晰，身体感受成分明显'
  },
  evaluative: {
    tradition: 'Evaluative',
    totalScore: 0.58,
    subScores: { ... },
    description: '对焦虑的评价中等，可进一步澄清评价内容'
  },
  motivational: {
    tradition: 'Motivational',
    totalScore: 0.64,
    subScores: { ... },
    description: '焦虑有明显的行动倾向，目标指向性较好'
  },
  integrated: {
    totalScore: 0.65,
    balance: { score: 0.85, interpretation: '高度平衡' },
    dominantTradition: 'Feeling',
    integrationQuality: { level: 'medium', ... }
  },
  traditionProfile: {
    dominant: 'Feeling',
    secondary: 'Motivational',
    tertiary: 'Evaluative',
    pattern: 'differentiated'
  }
}
*/
```

### 2. 集体意向性评估

```javascript
const collectiveData = {
  participants: [
    { 
      id: 'user1', 
      dependsOnOthers: true, 
      commitmentToGroup: 0.8,
      vulnerabilityAcceptance: 0.7
    },
    { 
      id: 'user2', 
      dependsOnOthers: true, 
      commitmentToGroup: 0.75,
      vulnerabilityAcceptance: 0.6
    }
  ],
  sharedGoal: {
    description: '共同完成项目',
    clarity: 0.8,
    agreedByParticipants: 0.9,
    specificity: 0.7
  },
  languageMarkers: {
    wePronouns: 5,      // "我们"使用频率
    sharedVerbs: 3,     // "一起做"等动词
    collectiveNouns: 2  // "团队"等名词
  },
  commitmentSignals: {
    explicitPromises: 2,
    implicitAgreements: 3,
    pastReliability: 0.8,
    sacrificeSignals: 1
  },
  trustSignals: {
    transparency: 0.8,
    reliability: 0.85,
    benevolence: 0.7,
    competence: 0.75
  },
  emotionalClimate: {
    participantEmotions: [
      { type: '兴奋', intensity: 7 },
      { type: '兴奋', intensity: 6 }
    ],
    jointAttention: 0.8,
    synchrony: 0.7,
    depth: 0.6
  },
  reciprocityLevel: 3,  // Walther 层级 (0-4)
  mutualAwareness: {
    level1Aware: true,
    level2Aware: true,
    level3Aware: true,
    level4Aware: false,
    validation: 0.7
  }
};

const result = EmotionCollectiveIntegration.assessCollectiveIntentionality(collectiveData);

/*
返回结果示例:
{
  weIntention: {
    isWeIntention: true,
    totalScore: 0.72,
    type: 'goal-dominant',
    description: '检测到集体意图：参与者共享"我们"的视角'
  },
  jointCommitment: {
    hasJointCommitment: true,
    totalScore: 0.68,
    commitmentType: 'moderate',
    description: '检测到联合承诺：参与者相互承担规范性义务'
  },
  trustFramework: {
    totalScore: 0.74,
    trustLevel: 'high',
    trustType: 'balanced-trust',
    description: '信任度较高：健康的信任关系'
  },
  sharedEmotion: {
    isSharedEmotion: true,
    totalScore: 0.71,
    sharedType: 'empathetic-sharing',
    phenomenologicalDepth: '认同性体验',
    description: '检测到共享情绪体验：参与者共同经历同一情绪'
  },
  overall: {
    totalScore: 0.71,
    collectiveLevel: 'moderate-collective',
    profile: { ... },
    recommendations: [...]
  }
}
*/
```

### 3. 情绪 - 集体交叉分析

```javascript
const crossAnalysis = EmotionCollectiveIntegration.crossAnalyze(emotionData, collectiveData);

/*
返回:
{
  emotionProfile: { ... },           // 情绪三大传统评估
  collectiveProfile: { ... },        // 集体意向性评估
  
  emotionImpactOnCollective: {
    facilitationScore: 0.68,
    interpretation: '情绪状态中性影响集体意向性',
    keyFactors: ['体验主导型情绪']
  },
  
  collectiveImpactOnEmotion: {
    impact: { intensity: 'normal', quality: 'partially-shared', stability: 'moderate' },
    collectiveLevel: 'moderate-collective',
    interpretation: '中等集体状态：情绪部分共享，部分个体化'
  },
  
  integratedRecommendations: [
    {
      domain: '情绪整合',
      priority: 'high',
      suggestion: '平衡情绪三大传统：同时关注体验、评价和动机维度'
    },
    {
      domain: '集体意向性',
      priority: 'medium',
      suggestion: '培养信任：增强透明度、可靠性和善意表达'
    }
  ]
}
*/
```

---

## 📊 情绪三大传统详解

### Feeling Tradition (情绪作为体验)

| 维度 | 说明 | 评分范围 |
|------|------|---------|
| **体验强度** | 情绪的强烈程度 | 0-1 |
| **体验清晰度** | 情绪体验的清晰程度 | 0-1 |
| **身体感受成分** | 身体感觉的丰富程度 | 0-1 |
| **第一人称给定性** | 现象学核心：直接性/非对象化/厚度 | 0-1 |

**理论来源**: James-Lange 理论、现象学情绪理论 (Husserl, Zahavi)

### Evaluative Tradition (情绪作为评价)

| 维度 | 说明 | 评分范围 |
|------|------|---------|
| **效价评价** | 正面/负面评价 | 0/1 |
| **目标相关性** | 与个人目标的相关程度 | 0-1 |
| **目标一致性** | 与个人目标的一致程度 | 0-1 |
| **责任归属** | 归因于谁的责任 | 0-1 |
| **应对潜力** | 应对情境的能力评估 | 0-1 |
| **规范性评价** | 情绪的恰当性评估 | 0-1 |

**理论来源**: 评价理论 (Appraisal Theory)、认知评价理论

### Motivational Tradition (情绪作为动机)

| 维度 | 说明 | 评分范围 |
|------|------|---------|
| **行动倾向强度** | 采取行动的冲动强度 | 0-1 |
| **行动方向** | 趋近/回避倾向 | 0/1 |
| **行动准备度** | 行动准备的程度 | 0-1 |
| **动机清晰度** | 动机的清晰程度 | 0-1 |
| **目标指向性** | 指向目标的程度 | 0-1 |

**理论来源**: 动机理论、行动倾向理论

---

## 📊 集体意向性详解

### We-Intention (集体意图)

**核心特征**:
- 不可还原为个体意图之和
- 使用"我们"语言标记
- 共享目标
- 相互依赖性

**类型分类**:
- `none`: 未检测到集体意图
- `weak`: 弱集体意图
- `linguistic-dominant`: 语言主导型
- `goal-dominant`: 目标主导型
- `balanced`: 平衡型

### Joint Commitment (联合承诺)

**核心特征** (Gilbert 1990, Bratman 1999):
- 明确或隐性的承诺信号
- 规范性期望
- 相互承诺

**类型分类**:
- `none`: 无联合承诺
- `weak`: 弱承诺
- `moderate`: 中等承诺
- `strong`: 强承诺

### Trust Framework (信任框架)

**核心维度** (Schmid 2013):
- 透明度 (Transparency)
- 可靠性 (Reliability)
- 善意 (Benevolence)
- 能力 (Competence)

**信任类型**:
- `cognitive-trust`: 认知信任 (基于信号)
- `dependency-trust`: 依赖信任 (基于相互依赖)
- `balanced-trust`: 平衡信任

### Shared Emotion (共享情绪)

**Walther (1923) 互惠性四层**:

| 层级 | 描述 | 评分 |
|------|------|------|
| **Level 0** | 无互惠 | 0.2 |
| **Level 1** | A 体验 x | 0.4 |
| **Level 2** | A 共情 B 的体验 | 0.6 |
| **Level 3** | A 认同 B 的体验 | 0.8 |
| **Level 4** | 互惠意识 (A 意识到 B 也认同 A) | 1.0 |

**共享类型**:
- `parallel-emotion`: 平行情绪 (非真正共享)
- `contagion`: 情绪传染
- `empathetic-sharing`: 共情式共享
- `full-communal`: 完全共享 (Scheler/Walther)

---

## 🔧 配置参数

```javascript
EmotionCollectiveIntegration.config = {
  // 情绪三大传统权重
  traditionWeights: {
    feeling: 0.35,      // Feeling Tradition 权重
    evaluative: 0.35,   // Evaluative Tradition 权重
    motivational: 0.30  // Motivational Tradition 权重
  },
  
  // 集体意向性阈值
  collectiveThresholds: {
    weIntentionMin: 0.6,      // We-Intention 最小阈值
    jointCommitmentMin: 0.5,  // 联合承诺最小阈值
    trustMin: 0.4,            // 信任最小阈值
    sharedEmotionMin: 0.7     // 共享情绪最小阈值
  }
};
```

---

## 📈 输出解读

### 情绪整合质量

| 质量等级 | 条件 | 说明 |
|---------|------|------|
| **high** | 三个维度都>0.4 且差异<0.3 | 情绪整合质量高，三大传统协调发展 |
| **medium** | 三个维度都>0.2 且差异<0.5 | 情绪整合质量中等，可进一步优化 |
| **low** | 其他情况 | 情绪整合质量低，需要重点关注薄弱维度 |

### 集体意向性水平

| 水平 | 分数范围 | 说明 |
|------|---------|------|
| **deep-communion** | >0.85 | 深度共融状态 |
| **strong-collective** | 0.7-0.85 | 强集体状态 |
| **moderate-collective** | 0.5-0.7 | 中等集体状态 |
| **weak-collective** | 0.3-0.5 | 弱集体状态 |
| **aggregated-individuals** | <0.3 | 个体集合状态 |

---

## 🎯 应用场景

### 1. 个人情绪觉察
- 评估个人情绪的三大传统维度
- 识别情绪整合质量
- 获得个性化情绪调节建议

### 2. 团队情绪氛围分析
- 评估团队集体意向性水平
- 检测共享情绪体验
- 提供团队建设建议

### 3. 亲密关系评估
- 分析关系中的情绪整合
- 评估信任框架质量
- 提供关系深化建议

### 4. 心理咨询辅助
- 全面评估来访者情绪状态
- 识别情绪 - 社会互动模式
- 制定整合性干预方案

---

## 📚 理论参考

### SEP 条目
- [Emotion](https://plato.stanford.edu/entries/emotion/) - 情绪三大传统
- [Collective Intentionality](https://plato.stanford.edu/entries/collective-intentionality/) - 集体意向性

### 经典文献
- Scheler, M. (1954). *The Nature of Sympathy*
- Walther, G. (1923). *Zur Ontologie der sozialen Gemeinschaften*
- Gilbert, M. (1990). *Walking Together: A Paradigmatic Social Phenomenon*
- Bratman, M. (1999). *Shared Intention*
- Searle, J. (1990). *Collective Intentions and Actions*

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| v5.0.11 | 2026-03-30 | 初始版本：情绪三大传统 + 集体意向性深度整合 |

---

## 📄 许可证

MIT License - HeartFlow Project
