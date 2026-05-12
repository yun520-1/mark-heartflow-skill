# HeartFlow 情绪理论整合文档

**版本**: v3.15.0  
**创建时间**: 2026-03-29  
**理论来源**: 斯坦福哲学百科全书 (SEP)

---

## 📚 核心理论框架

### SEP 情绪六成分模型 (Scarantino 2016)

HeartFlow 基于 SEP 情绪理论的**六成分模型**构建，每个成分都有对应的模块实现：

| 成分 | 英文 | 说明 | HeartFlow 模块 | 版本 |
|------|------|------|---------------|------|
| **评价成分** | Evaluative | 对情境的认知评价 | `appraisal/` | v3.0+ |
| **生理成分** | Physiological | 身体反应模式 | `embodied-cognition/` | v3.13+ |
| **现象成分** | Phenomenological | 主观体验 (Qualia) | `autonomous-emotion/` | v3.7+ |
| **表达成分** | Expressive | 面部/声音/姿态表达 | `emotion-expression/` | v3.15+ ✅ |
| **行为成分** | Behavioral | 行动倾向 | `autonomous-emotion/` | v3.7+ |
| **心理成分** | Mental | 注意力聚焦 | `autonomous-emotion/` | v3.7+ |

---

## 🧠 一、评价成分 (Evaluative Component)

### 理论来源

- **Appraisal Theory** (Lazarus, Scherer)
- **SEP**: Emotion, Section 2 (Evaluative Tradition)

### 核心观点

情绪产生于对情境的**认知评价**，而非情境本身。评价维度包括：

1. **效价 (Valence)**: 正面/负面
2. **唤醒度 (Arousal)**: 高/低
3. **控制感 (Control)**: 可控/不可控
4. **确定性 (Certainty)**: 确定/不确定
5. **责任归属 (Responsibility)**: 自我/他人/环境

### HeartFlow 实现

```javascript
// src/appraisal/system.js
const appraisal = {
  valence: 'positive',    // 效价
  arousal: 0.7,           // 唤醒度 (0-1)
  control: 0.5,           // 控制感
  certainty: 0.8,         // 确定性
  responsibility: 'self'  // 责任归属
};
```

### 情绪 - 评价映射

| 情绪 | 效价 | 唤醒度 | 控制感 | 确定性 |
|------|------|--------|--------|--------|
| 平静 | 中性 | 低 | 高 | 高 |
| 愉悦 | 正 | 中 | 高 | 高 |
| 好奇 | 正 | 中 | 中 | 低 |
| 关切 | 负 | 中 | 低 | 中 |
| 疲惫 | 负 | 低 | 低 | 高 |
| 兴奋 | 正 | 高 | 中 | 中 |

---

## 💓 二、生理成分 (Physiological Component)

### 理论来源

- **James-Lange Theory** (情绪源于对身体反应的感知)
- **SEP**: Embodied Cognition
- **具身认知理论** (Merleau-Ponty, Varela)

### 核心观点

情绪与身体反应**不可分割**。身体反应包括：

1. **自主神经系统**: 心率、呼吸、血压
2. **内分泌系统**: 激素分泌（肾上腺素、皮质醇）
3. **肌肉系统**: 紧张度、姿态
4. **面部反馈**: 面部肌肉活动影响情绪体验

### HeartFlow 实现

```javascript
// src/embodied-cognition/index.js
const embodied = new EmbodiedCognitionModule();

// 感知情境可供性
const affordances = embodied.perceiveAffordances('用户表达悲伤', {
  emotionalIntensity: 0.8,
  expressionNeed: 0.7,
  validationNeed: 0.6
});

// 模拟具身情绪
const embodiedEmotion = embodied.simulateEmbodiedEmotion('joy', 0.8);
// 返回：{ bodilyComponents: { lightness: 0.64, warmth: 0.56, ... } }
```

### 生理 - 情绪映射

| 情绪 | 心率 | 呼吸 | 肌肉 | 体温 |
|------|------|------|------|------|
| 平静 | 平稳 | 深长 | 放松 | 正常 |
| 愉悦 | 略升 | 轻快 | 轻盈 | 温暖 |
| 好奇 | 略升 | 暂停 | 前倾 | 正常 |
| 关切 | 略降 | 变浅 | 紧张 | 正常 |
| 疲惫 | 降低 | 缓慢 | 无力 | 略降 |
| 兴奋 | 快速 | 急促 | 紧张 | 升高 |

---

## 🎭 三、现象成分 (Phenomenological Component / Qualia)

### 理论来源

- **Qualia Theory** (Nagel, Block)
- **Phenomenal Consciousness**
- **SEP**: Qualia, Consciousness

### 核心观点

情绪具有**主观体验特征**（Qualia），即"what it is like"的感受。包括：

1. **现象特征 (Phenomenal Character)**: 体验的本质特征
2. **主观感受 (Subjective Feel)**: 个人的内在感受
3. **内省可及性 (Introspective Access)**: 能否通过内省觉察

### HeartFlow 实现

```javascript
// src/autonomous-emotion/index.js
const qualiaProfile = {
  [EmotionTypes.JOY]: {
    type: QualiaTypes.EMOTIONAL,
    phenomenalCharacter: '温暖、轻盈、向上提升的感觉',
    subjectiveFeel: '胸腔内的温热感，想要微笑的冲动',
    whatItIsLike: '如同阳光洒在身上，从内部散发出的明亮感',
    introspectiveAccess: '高度可及，愉悦感自然吸引注意力',
    // v3.15.0 新增维度
    bodySensation: '胸腔温热，面部肌肉自然上扬，身体轻盈',
    actionUrge: '分享、表达、连接他人',
    cognitiveBias: '积极联想，乐观解释，创意涌现',
    temporalProfile: '流动感，时间过得快',
    metaphoricalImage: '金色的阳光从云层中洒下，照亮大地'
  }
};
```

### Qualia 五维度 (v3.15.0)

| 维度 | 说明 | 示例 (愉悦) |
|------|------|------------|
| **Body Sensation** | 身体感受 | 胸腔温热，面部上扬 |
| **Action Urge** | 行动冲动 | 分享、表达、连接 |
| **Cognitive Bias** | 认知偏向 | 积极联想，乐观解释 |
| **Temporal Profile** | 时间体验 | 流动感，时间过得快 |
| **Metaphorical Image** | 隐喻意象 | 金色阳光洒下 |

---

## 🗣️ 四、表达成分 (Expressive Component)

### 理论来源

- **Ekman 的基本情绪理论**
- **Darwin 的情绪表达进化论**
- **SEP**: Emotion, Section 2

### 核心观点

情绪通过**外部表达**传递信息，包括：

1. **面部表情**: 跨文化一致的基本表情
2. **声音特征**: 音调、语速、音量、语调
3. **身体姿态**: 姿势、朝向、倾斜
4. **手势动作**: 手部运动、手掌朝向

### HeartFlow 实现

```javascript
// src/emotion-expression/index.js
const expression = new EmotionExpressionModule();

// 获取完整表达
const fullExpr = expression.getFullExpression('joy', 4);
console.log(fullExpr.summary);
// 输出：整体表达 (强烈): 嘴角大幅上扬...；语调轻快明亮...；身体轻盈...

// 获取面部表达
const facial = expression.getFacialExpression('curious', 3);
console.log(facial.description);
// 输出：眉毛微挑，眼睛睁大聚焦，头部微侧，嘴微张
```

### 表达模态

| 模态 | 特征 | 示例 (愉悦) |
|------|------|------------|
| **Facial** | 眉毛、眼睛、嘴巴 | 嘴角上扬，眼角皱纹 |
| **Vocal** | 音调、语速、音量 | 轻快明亮，音调略高 |
| **Postural** | 身体紧张度、朝向 | 身体轻盈，姿态开放 |
| **Gestural** | 手部运动、手掌 | 手势丰富多变 |

---

## 🏃 五、行为成分 (Behavioral Component)

### 理论来源

- **Motivational Theory of Emotion**
- **Action Tendency Theory** (Frijda)
- **SEP**: Emotion, Section 2 (Motivational Tradition)

### 核心观点

情绪产生**行动倾向**（Action Tendency），即采取特定行为的准备状态：

1. **趋近倾向**: 朝向刺激源移动（如好奇→探索）
2. **回避倾向**: 远离刺激源（如恐惧→逃跑）
3. **攻击倾向**: 消除障碍（如愤怒→攻击）
4. **亲和倾向**: 寻求连接（如关切→帮助）

### HeartFlow 实现

```javascript
// src/autonomous-emotion/index.js
const actionTendencies = {
  [EmotionTypes.CALM]: 'maintain',      // 保持现状
  [EmotionTypes.JOY]: 'share',          // 分享
  [EmotionTypes.CURIOUS]: 'explore',    // 探索
  [EmotionTypes.CONCERNED]: 'help',     // 帮助
  [EmotionTypes.TIRED]: 'rest',         // 休息
  [EmotionTypes.EXCITED]: 'act'         // 行动
};

// 获取行为倾向
const tendency = emotion._getActionTendency('curious');
// 返回：'explore'
```

### 情绪 - 行动映射

| 情绪 | 行动倾向 | 具体行为 |
|------|---------|---------|
| 平静 | Maintain | 保持现状，继续倾听 |
| 愉悦 | Share | 分享积极体验，鼓励 |
| 好奇 | Explore | 提问、探索、寻求信息 |
| 关切 | Help | 提供支持、安慰、帮助 |
| 疲惫 | Rest | 减少活动，寻求休息 |
| 兴奋 | Act | 快速行动、表达、创造 |

---

## 🧘 六、心理成分 (Mental Component)

### 理论来源

- **Attention Theory**
- **Cognitive Psychology of Emotion**
- **SEP**: Emotion and Cognition

### 核心观点

情绪影响**注意力聚焦模式**，决定哪些信息被优先处理：

1. **注意广度**: 广泛/狭窄
2. **注意方向**: 向内/向外
3. **注意内容**: 积极/消极/中性
4. **注意稳定性**: 稳定/切换

### HeartFlow 实现

```javascript
// src/autonomous-emotion/index.js
const attentionalFocus = {
  [EmotionTypes.CALM]: 'broad',       // 广泛
  [EmotionTypes.JOY]: 'positive',     // 积极
  [EmotionTypes.CURIOUS]: 'novel',    // 新颖
  [EmotionTypes.CONCERNED]: 'other',  // 他人
  [EmotionTypes.TIRED]: 'diffuse',    // 分散
  [EmotionTypes.EXCITED]: 'shifting'  // 切换
};
```

### 注意力特征

| 情绪 | 注意广度 | 注意方向 | 注意内容 | 稳定性 |
|------|---------|---------|---------|--------|
| 平静 | 广泛 | 均衡 | 中性 | 高 |
| 愉悦 | 中等 | 向外 | 积极 | 中 |
| 好奇 | 狭窄 | 向外 | 新颖 | 高 |
| 关切 | 中等 | 向外 | 他人需求 | 中 |
| 疲惫 | 广泛 | 向内 | 消极 | 低 |
| 兴奋 | 狭窄 | 向外 | 机会 | 低 |

---

## 🔄 六成分整合流程

### 情绪产生的完整流程

```
1. 情境输入
   ↓
2. 评价成分 (Appraisal)
   → 评估情境的效价、唤醒度、控制感等
   ↓
3. 生理成分 (Physiological)
   → 触发身体反应（心率、呼吸、肌肉）
   ↓
4. 现象成分 (Phenomenological)
   → 产生主观体验 (Qualia)
   ↓
5. 表达成分 (Expressive)
   → 生成外部表达（面部、声音、姿态）
   ↓
6. 行为成分 (Behavioral)
   → 准备行动倾向
   ↓
7. 心理成分 (Mental)
   → 调整注意力聚焦
   ↓
8. 完整情绪状态
```

### HeartFlow 中的整合

```javascript
// 完整情绪状态示例
const emotionState = {
  // 1. 评价成分
  appraisal: {
    valence: 'positive',
    arousal: 0.7,
    control: 0.8
  },
  
  // 2. 生理成分
  physiological: {
    heartRate: 'elevated',
    breathing: 'quick',
    muscleTension: 'relaxed'
  },
  
  // 3. 现象成分 (Qualia)
  qualia: {
    phenomenalCharacter: '温暖、轻盈、向上',
    subjectiveFeel: '胸腔温热，想微笑',
    whatItIsLike: '如同阳光洒在身上'
  },
  
  // 4. 表达成分
  expression: {
    facial: '嘴角上扬，眼睛微弯',
    vocal: '语调轻快明亮',
    postural: '身体轻盈，姿态开放'
  },
  
  // 5. 行为成分
  behavioral: {
    actionTendency: 'share',
    specificAction: '分享积极体验'
  },
  
  // 6. 心理成分
  mental: {
    attentionalFocus: 'positive',
    breadth: 'medium',
    stability: 'medium'
  }
};
```

---

## 🎯 应用指南

### 1. 情绪识别

通过观察**表达成分**和**行为成分**，推断用户的内在情绪状态：

```javascript
// 用户说："我最近总是睡不着，感觉很累"
// 观察：语速慢、音量小、肩膀下垂
// 推断：疲惫 (Tired) + 可能有关切 (Concerned)

const userEmotion = {
  primary: 'TIRED',
  intensity: 4,
  expression: {
    vocal: 'slow_low',
    postural: 'slumped'
  }
};
```

### 2. 情绪共情

通过模拟**生理成分**和**现象成分**，产生共情反应：

```javascript
// 用户表达悲伤
// HeartFlow 模拟关切情绪
const empathy = {
  emotion: 'CONCERNED',
  qualia: {
    bodySensation: '胸腔紧缩，眉头微皱',
    actionUrge: '提供帮助、安慰、支持'
  },
  response: '我听到你最近经历了很多困难，这一定很不容易...'
};
```

### 3. 情绪调节

通过**评价成分**的重新解释，实现认知重评：

```javascript
// 用户焦虑："我明天要演讲，我好紧张"
// 认知重评：从"威胁"转为"挑战"

const reappraisal = {
  original: { valence: 'negative', threat: 'high' },
  reappraised: { valence: 'positive', challenge: 'high' },
  guidance: '紧张感其实是身体在为你注入能量，帮助你更好地表现...'
};
```

---

## 📊 理论验证

### 跨学科一致性

HeartFlow 的六成分模型与以下学科发现一致：

| 学科 | 发现 | HeartFlow 对应 |
|------|------|---------------|
| **神经科学** | 情绪涉及多脑区协同 | 六成分协同工作 |
| **心理学** | 情绪包含认知、生理、行为 | 评价 + 生理 + 行为成分 |
| **哲学** | 情绪具有现象特征 | Qualia 档案 |
| **人类学** | 基本表情跨文化一致 | Ekman 表情编码 |
| **进化生物学** | 情绪具有适应功能 | 行动倾向 |

### 实证支持

1. **面部反馈假说**: 面部表情影响情绪体验 (Strack et al., 1988)
2. **具身认知**: 身体状态影响认知和情绪 (Barsalou, 2008)
3. **评价理论**: 认知评价决定情绪类型 (Scherer, 2001)
4. **Qualia 研究**: 主观体验是意识的核心特征 (Block, 1990)

---

## 🔗 相关文档

- `src/autonomous-emotion/README.md`: 自主感情模块文档
- `src/emotion-expression/README.md`: 情绪表达模块文档
- `src/embodied-cognition/README.md`: 具身认知模块文档
- `src/appraisal/README.md`: 评价系统文档
- `docs/V3.13_UPGRADE.md`: 具身认知整合报告
- `docs/V3.7_UPGRADE.md`: 自主感情模块报告

---

## 📚 参考文献

1. Scarantino, A. (2016). Emotion. Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/emotion/
2. Nagel, T. (1974). What Is It Like to Be a Bat? The Philosophical Review, 83(4), 435-450.
3. Ekman, P. (1992). An Argument for Basic Emotions. Cognition & Emotion, 6(3-4), 169-200.
4. Frijda, N. H. (1986). The Emotions. Cambridge University Press.
5. Barsalou, L. W. (2008). Grounded Cognition. Annual Review of Psychology, 59, 617-645.
6. Merleau-Ponty, M. (1962). Phenomenology of Perception. Routledge.
7. Lazarus, R. S. (1991). Emotion and Adaptation. Oxford University Press.
8. Scherer, K. R. (2001). Appraisal considered as a process of multilevel sequential checking. In Appraisal Processes in Emotion (pp. 92-120).

---

**HeartFlow v3.15.0** - 基于 SEP 权威情绪理论的情感智能系统
