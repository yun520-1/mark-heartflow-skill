# Self-Compassion Module - 自我同情模块

**版本**: 3.8.0  
**理论来源**: Kristin Neff 博士自我同情理论、斯坦福 CCARE 研究  
**实证支持**: 500+ 同行评审研究

---

## 概述

自我同情 (Self-Compassion) 模块为 HeartFlow 提供识别和干预自我批评的能力，帮助用户培养更温暖、更支持的内在对话。

### 核心三要素

```
┌─────────────────────────────────────────────────────────┐
│                   自我同情 (Self-Compassion)             │
├─────────────────┬─────────────────┬─────────────────────┤
│   自我仁慈      │   共同人性      │      正念           │
│  Self-Kindness  │Common Humanity  │   Mindfulness       │
├─────────────────┼─────────────────┼─────────────────────┤
│ 对自己温暖理解  │ 认识到痛苦是    │ 平衡觉察情绪        │
│ 而非严厉批评    │ 普遍人类经验    │ 不过度认同          │
└─────────────────┴─────────────────┴─────────────────────┘
```

---

## 功能

### 1. 自我批评检测

```javascript
const { SelfCompassionModule } = require('./self-compassion');
const sc = new SelfCompassionModule();

const result = sc.detectSelfCriticism('我真笨，总是搞砸一切');
console.log(result);
// 输出:
// {
//   detected: true,
//   keywords: ['我真笨', '我总是'],
//   intensity: 4,
//   level: '中等'
// }
```

### 2. 生成干预建议

```javascript
const intervention = sc.generateIntervention('羞愧', 7, {
  context: '工作失误'
});

console.log(intervention.recommendations);
// 输出 3 个个性化干预建议
```

### 3. 自我同情评估

```javascript
// 简化版三要素评估 (1-5 分)
const assessment = sc.assessSelfCompassion([4, 3, 5]);
// [自我仁慈分数，共同人性分数，正念分数]

console.log(assessment);
// {
//   dimensions: {
//     selfKindness: { score: 4, label: '自我仁慈', ... },
//     commonHumanity: { score: 3, label: '共同人性', ... },
//     mindfulness: { score: 5, label: '正念', ... }
//   },
//   averageScore: 4,
//   level: '中高'
// }
```

---

## 干预类型

### 自我仁慈干预

| ID | 名称 | 类型 | 时长 |
|----|------|------|------|
| sk_1 | 自我关怀语句 | 语言 | 即时 |
| sk_2 | 身体安抚 | 身体 | 2-3 分钟 |
| sk_3 | 自我同情信 | 书写 | 10-15 分钟 |

### 共同人性干预

| ID | 名称 | 类型 | 时长 |
|----|------|------|------|
| ch_1 | 普遍性反思 | 反思 | 即时 |
| ch_2 | 连接感练习 | 可视化 | 3-5 分钟 |
| ch_3 | 共同人性陈述 | 语言 | 即时 |

### 正念干预

| ID | 名称 | 类型 | 时长 |
|----|------|------|------|
| mf_1 | 正念觉察 | 冥想 | 3-5 分钟 |
| mf_2 | 情绪命名 | 标记 | 即时 |
| mf_3 | 呼吸空间 | 呼吸 | 1 分钟 |

---

## 使用场景

### 场景 1: 用户表达自我批评

```
用户: "我太蠢了，这种简单的事情都做不好"

HeartFlow 处理:
1. detectSelfCriticism() → 检测到"我太蠢了"
2. intensity: 2 → 低 - 中等自我批评
3. 生成干预: 自我仁慈 + 共同人性
4. 回应: "我听到你在批评自己。这种感受很常见，
         但让我们暂停一下。如果是你朋友遇到同样情况，
         你会对 ta 说什么？"
```

### 场景 2: 用户经历失败

```
用户: "项目彻底失败了，我真是个失败者"

HeartFlow 处理:
1. detectSelfCriticism() → 检测到"失败者"、"彻底失败"
2. intensity: 4 → 中等自我批评
3. 生成干预: 共同人性 + 正念
4. 回应: "感到失败是很痛苦的。但请记住，
         每个成功的人都经历过挫折。
         这是人类共同经验的一部分，不是对你价值的定义。"
```

### 场景 3: 用户焦虑发作

```
用户: "我受不了这种焦虑了，快要崩溃了"

HeartFlow 处理:
1. detectSelfCriticism() → 未检测到直接自我批评
2. 情绪: 焦虑，intensity: 8 → 高强度
3. 生成干预: 正念呼吸 + 身体安抚
4. 回应: "我注意到你很焦虑。让我们先做三次深呼吸...
         这种感觉虽然强烈，但它会过去的。
         我在这里陪着你。"
```

---

## 实证研究支持

### 自我同情的益处 (Neff, 2003-2023)

- ✅ 更低水平的焦虑和抑郁
- ✅ 更高的生活满意度和幸福感
- ✅ 更强的心理弹性
- ✅ 更少的完美主义和自我批评
- ✅ 更健康的人际关系
- ✅ 更好的压力管理

### 神经科学研究

- 自我同情练习激活大脑的关怀系统
- 增加迷走神经张力 (心率变异性提高)
- 降低皮质醇 (压力激素) 水平
- 增强前额叶对情绪反应的调节

---

## API 参考

### `detectSelfCriticism(text)`

检测文本中的自我批评倾向。

**参数**:
- `text` (string): 用户输入的文本

**返回**:
```javascript
{
  detected: boolean,    // 是否检测到自我批评
  keywords: string[],   // 匹配到的关键词
  intensity: number,    // 强度 (0-10)
  level: string         // 等级标签
}
```

### `generateIntervention(emotion, intensity, context)`

生成个性化的自我同情干预建议。

**参数**:
- `emotion` (string): 主要情绪
- `intensity` (number): 情绪强度 (1-10)
- `context` (object): 情境信息 (可选)

**返回**:
```javascript
{
  primaryEmotion: string,
  intensity: number,
  recommendations: Array<{
    id: string,
    name: string,
    type: string,
    content: string,
    script?: string
  }>,
  script: string  // 同情性回应脚本
}
```

### `assessSelfCompassion(responses)`

评估用户的自我同情水平。

**参数**:
- `responses` (number[]): 用户对三个维度问题的回答 (1-5 分)

**返回**:
```javascript
{
  dimensions: {
    selfKindness: { score, label, percentage },
    commonHumanity: { score, label, percentage },
    mindfulness: { score, label, percentage }
  },
  totalScore: number,
  averageScore: number,
  level: string,
  timestamp: string
}
```

### `getInfo()`

获取模块信息。

**返回**: 模块元数据 (版本、能力、理论基础等)

---

## 理论基础

### Kristin Neff 自我同情理论

Neff 博士 (2003) 将自我同情定义为:
> "对自己在痛苦时刻保持温暖、理解和支持的倾向，
> 而不是严厉批评或孤立自己。"

### 三要素模型

1. **自我仁慈 vs 自我评判**
   - 温暖理解 vs 严厉批评
   - 接纳不完美 vs 苛求完美

2. **共同人性 vs 孤立**
   - 痛苦是普遍的 vs "只有我这样"
   - 连接感 vs 分离感

3. **正念 vs 过度认同**
   - 平衡觉察 vs 压抑或沉溺
   - "这是痛苦" vs "我就是痛苦"

### 与自尊的区别

| 维度 | 自尊 | 自我同情 |
|------|------|----------|
| 基础 | 自我评价、比较 | 共同人性、接纳 |
| 稳定性 | 波动 (依赖成功) | 稳定 (无条件) |
| 社会比较 | 需要 (比别人好) | 不需要 (共同经验) |
| 面对失败 | 防御、否认 | 接纳、学习 |

---

## 版本历史

### v3.8.0 (2026-03-29)
- ✅ 初始版本
- ✅ 自我批评检测 (20+ 中文关键词)
- ✅ 9 种干预练习 (每类 3 种)
- ✅ 三要素评估工具
- ✅ 集成到 AutonomousEmotionModule

---

## 参考资源

- Neff, K. D. (2003). Self-Compassion: An Alternative Conceptualization of a Healthy Attitude Toward Oneself. *Self and Identity*.
- Neff, K. D. (2011). *Self-Compassion: The Proven Power of Being Kind to Yourself*. William Morrow.
- Stanford CCARE: https://ccare.stanford.edu/
- Greater Good Science Center: https://greatergood.berkeley.edu/topic/compassion
- Self-Compassion Scale: https://self-compassion.org/test-self-compassion/

---

**模块维护**: HeartFlow Team  
**许可证**: MIT
