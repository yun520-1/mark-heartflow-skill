# 情绪理性模块 (Emotion Rationality Module)

**版本**: v3.39.0  
**理论基础**: Stanford Encyclopedia of Philosophy - Emotion Theory  
**来源**: https://plato.stanford.edu/entries/emotion/#RatiEmot

---

## 📚 理论概述

情绪理性模块基于 SEP 情绪理论的第 10 节"Rationality and Emotions"，提供多维度的情绪理性评估功能。

### 情绪理性的两大类型

```
┌─────────────────────────────────────────────────────────────┐
│                    情绪理性 (Emotion Rationality)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐   │
│  │   认知理性               │  │   战略理性               │   │
│  │   Cognitive             │  │   Strategic             │   │
│  │   Rationality           │  │   Rationality           │   │
│  ├─────────────────────────┤  ├─────────────────────────┤   │
│  │ • 恰当性 (Fittingness)   │  │ • 工具理性              │   │
│  │ • 证成性 (Warrant)       │  │   (Instrumental)        │   │
│  │ • 一致性 (Coherence)     │  │ • 实质理性              │   │
│  │                         │  │   (Substantive)         │   │
│  └─────────────────────────┘  └─────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 核心概念

### 1. 认知理性 (Cognitive Rationality)

评估情绪是否在认知上合理：

| 类型 | 定义 | 评估问题 |
|------|------|---------|
| **恰当性** (Fittingness) | 情绪的形式对象是否被其特定对象所例示 | "这个情绪适合这个情境吗？" |
| **证成性** (Warrant) | 情绪是否基于充分的证据或理由 | "有什么证据支持这个情绪？" |
| **一致性** (Coherence) | 情绪是否与行动者的其他态度相一致 | "这个情绪与我的信念/其他情绪一致吗？" |

### 2. 战略理性 (Strategic Rationality)

评估情绪是否在实践上合理：

| 类型 | 定义 | 评估问题 |
|------|------|---------|
| **工具理性** (Instrumental) | 情绪是否有助于实现行动者的目标 | "这个情绪帮助我还是妨碍我？" |
| **实质理性** (Substantive) | 情绪所服务的目标本身是否合理 | "这个目标本身值得追求吗？" |

### 3. 形式对象 (Formal Objects)

每种情绪都有其形式对象，定义了情绪的恰当性条件：

| 情绪 | 形式对象 | 恰当性条件 |
|------|---------|-----------|
| Fear (恐惧) | Danger (危险) | 对象构成威胁或危险 |
| Anger (愤怒) | Slight/Offense (冒犯) | 行动者或其关心的人/事被冒犯 |
| Sadness (悲伤) | Loss (损失) | 失去了有价值的人/事 |
| Happiness (快乐) | Goal Progress (目标进展) | 在实现目标的道路上取得进展 |
| Shame (羞耻) | Ego Ideal Failure (自我理想失败) | 未能达到自我理想 |
| Guilt (内疚) | Moral Transgression (道德越轨) | 违反了道德标准 |
| Pride (自豪) | Ego Enhancement (自我提升) | 取得了值得称赞的成就 |
| Jealousy (嫉妒) | Relationship Threat (关系威胁) | 有价值的关系受到第三方威胁 |
| Gratitude (感激) | Undeserved Benefit (不应得的恩惠) | 收到了不应得的恩惠 |

---

## 💻 使用示例

### 基础用法

```javascript
const { EmotionRationalityModule, FormalObjects } = require('./emotion-rationality');

const module = new EmotionRationalityModule();

// 1. 评估情绪的恰当性
const fittingness = module.assessFittingness('fear', { type: 'spider' }, {
  cues: ['threat', 'harm', 'risk']
});
console.log('恰当性评估:', fittingness);

// 2. 评估情绪的证成性
const warrant = module.assessWarrant('anger', {
  evidence1: { strength: 0.8, content: '对方确实冒犯了我' },
  evidence2: { strength: 0.6, content: '有目击证人' }
});
console.log('证成性评估:', warrant);

// 3. 评估情绪的一致性
const coherence = module.assessCoherence('fear', { type: 'flying' }, {
  beliefs: {
    belief1: { content: 'flying is not dangerous', strength: 0.9 }
  }
});
console.log('一致性评估:', coherence);
```

### 综合理性评估

```javascript
// 添加目标和信念
module.addGoal('goal1', 'stay safe', 'safety');
module.updateBelief('belief1', 'spiders can be dangerous', 0.8);

// 综合评估
const assessment = module.assessEmotionRationality('fear', {
  type: 'spider',
  size: 'large'
}, {
  evidence: {
    spiderPresence: { strength: 0.9, content: '眼前有一只大蜘蛛' },
    pastExperience: { strength: 0.7, content: '曾经被蜘蛛咬过' }
  },
  otherAttitudes: {
    beliefs: {
      belief1: { content: 'spiders can be dangerous', strength: 0.8 }
    },
    supportingBeliefs: ['spiders have venom', 'this spider looks aggressive']
  },
  goalId: 'goal1',
  values: {
    core: ['safety', 'health'],
    conflicting: []
  },
  context: {
    cues: ['threat', 'harm', 'risk']
  }
});

console.log('综合理性评估:', JSON.stringify(assessment, null, 2));
```

### 获取调节建议

```javascript
// 综合评估会自动生成调节建议
const recommendations = assessment.recommendations;

recommendations.forEach(rec => {
  console.log(`[${rec.priority}] ${rec.type}: ${rec.content}`);
  console.log(`  技术：${rec.technique}`);
});
```

### 获取模块状态

```javascript
const report = module.getStatusReport();
console.log('模块状态报告:', JSON.stringify(report, null, 2));
```

---

## 🔬 理论应用

### 情绪理性评估流程

```
1. 识别情绪类型
   ↓
2. 确定形式对象 (如：恐惧 → 危险)
   ↓
3. 评估特定对象是否例示形式对象 (恰当性)
   ↓
4. 检查支持情绪的证据 (证成性)
   ↓
5. 检查与其他态度的一致性 (一致性)
   ↓
6. 评估情绪对目标的作用 (工具理性)
   ↓
7. 评估目标本身的价值 (实质理性)
   ↓
8. 生成综合评估和调节建议
```

### 情绪调节技术映射

| 理性问题 | 调节技术 | 理论来源 |
|---------|---------|---------|
| 恰当性不足 | 认知重评 (Cognitive Reappraisal) | Lazarus 评价理论 |
| 证成性不足 | 证据检验 (Evidence Testing) | CBT 认知疗法 |
| 一致性冲突 | 信念整合 (Belief Integration) | 认知一致性理论 |
| 工具理性不足 | 情绪调节 (Emotion Regulation) | Gross 情绪调节模型 |
| 实质理性不足 | 目标重构 (Goal Restructuring) | 存在主义疗法 |

---

## 🧪 测试示例

```javascript
const { EmotionRationalityModule } = require('./emotion-rationality');

const module = new EmotionRationalityModule();

// 测试场景 1: 理性恐惧
console.log('=== 测试场景 1: 理性恐惧 ===');
const rationalFear = module.assessEmotionRationality('fear', {
  type: 'aggressive dog'
}, {
  evidence: {
    dogBehavior: { strength: 0.9, content: '狗在咆哮并露出牙齿' }
  },
  context: {
    cues: ['threat', 'harm', 'risk']
  }
});
console.log('理性水平:', rationalFear.rationalityLevel);
console.log('建议:', rationalFear.recommendations);

// 测试场景 2: 非理性恐惧 (恐惧症)
console.log('\n=== 测试场景 2: 非理性恐惧 (恐惧症) ===');
const irrationalFear = module.assessEmotionRationality('fear', {
  type: 'harmless spider'
}, {
  evidence: {},
  otherAttitudes: {
    beliefs: {
      safetyBelief: { content: 'this spider is not dangerous', strength: 0.95 }
    }
  },
  context: {
    cues: [] // 无危险线索
  }
});
console.log('理性水平:', irrationalFear.rationalityLevel);
console.log('建议:', irrationalFear.recommendations);

// 测试场景 3: 理性愤怒
console.log('\n=== 测试场景 3: 理性愤怒 ===');
module.addGoal('justice', 'seek justice', 'justice');
const rationalAnger = module.assessEmotionRationality('anger', {
  type: 'being treated unfairly'
}, {
  evidence: {
    injustice: { strength: 0.85, content: '被不公正对待' }
  },
  goalId: 'justice',
  context: {
    cues: ['disrespect', 'injustice', 'wrong']
  }
});
console.log('理性水平:', rationalAnger.rationalityLevel);
console.log('建议:', rationalAnger.recommendations);
```

---

## 📊 输出格式

### 综合理性评估结果

```json
{
  "emotion": "fear",
  "particularObject": { "type": "spider" },
  "cognitiveRationality": {
    "fittingness": {
      "emotion": "fear",
      "formalObject": "danger",
      "fittingness": "fitting",
      "instantiates": true,
      "confidence": 0.9,
      "reason": "对象例示了 danger，情绪是恰当的"
    },
    "warrant": {
      "emotion": "fear",
      "evidenceStrength": 0.8,
      "hasWarrant": true,
      "warrantLevel": "strong"
    },
    "coherence": {
      "emotion": "fear",
      "coherenceScore": 0.85,
      "isCoherent": true
    },
    "score": 0.85
  },
  "strategicRationality": {
    "instrumental": {
      "facilitates": true,
      "instrumentalRationality": "rational"
    },
    "substantive": {
      "goalIsValuable": true,
      "substantiveRationality": "rational"
    },
    "score": 1.0
  },
  "overallRationality": 0.925,
  "rationalityLevel": "highly_rational",
  "recommendations": [...]
}
```

### 理性水平分类

| 分数范围 | 理性水平 | 说明 |
|---------|---------|------|
| 0.8 - 1.0 | highly_rational | 高度理性 |
| 0.6 - 0.8 | moderately_rational | 中等理性 |
| 0.4 - 0.6 | somewhat_irrational | 有些非理性 |
| 0.0 - 0.4 | highly_irrational | 高度非理性 |

---

## 🔗 与其他模块的集成

### 推荐集成模式

```javascript
// 与情绪理论模块集成
const { EmotionTheoryModule } = require('./emotion-theory');
const { EmotionRationalityModule } = require('./emotion-rationality');

const emotionModule = new EmotionTheoryModule();
const rationalityModule = new EmotionRationalityModule();

// 1. 先识别情绪
const emotion = emotionModule.identifyEmotion(context);

// 2. 评估情绪理性
const rationality = rationalityModule.assessEmotionRationality(
  emotion.type,
  emotion.object,
  assessmentContext
);

// 3. 基于理性评估生成响应
if (rationality.rationalityLevel === 'highly_irrational') {
  // 提供情绪调节支持
  response = generateRegulationSupport(rationality.recommendations);
} else {
  // 确认和验证情绪
  response = generateValidationSupport(emotion, rationality);
}
```

---

## 📚 参考文献

### SEP 条目

- **Emotion** - https://plato.stanford.edu/entries/emotion/
  - Section 10: Rationality and Emotions
  - Section 10.1: Cognitive Rationality as Fittingness, Warrant and Coherence
  - Section 10.2: Instrumental and Substantive Strategic Rationality

### 核心著作

- Kenny, A. (1963). *Action, Emotion and Will*
- Helm, B. (2001). *Emotional Reason: Deliberation, Motivation, and the Nature of Value*
- Tappolet, C. (2016). *Emotions, Values, and Agency*
- Lazarus, R.S. (1991). *Emotion and Adaptation*
- Goldie, P. (2000). *The Emotions: A Philosophical Exploration*

---

**模块创建时间**: 2026-03-30  
**HeartFlow 版本**: v3.39.0
