# HeartFlow Awe-Time Expansion Module v5.0.3

## 敬畏与时间意识整合模块

### 理论来源

**1. SEP Temporal Consciousness (斯坦福哲学百科全书)**
- 时间意识三大模型：Cinematic / Retentional / Extensional
- Husserl 时间现象学：原初印象 / 保留 / 预期三重结构
- 时间深度与自我深度的关系

**2. Berkeley Greater Good Awe Psychology**
- 敬畏定义：面对广阔且挑战理解的事物时的体验
- 效价区分：积极敬畏 (wonder) vs 消极敬畏 (dread)
- 时间扩展效应：敬畏让时间感觉变慢，增强当下临在感
- 科学验证的益处：幸福感↑、慷慨↑、好奇心↑、健康 biomarker↓

### 核心洞察

> **敬畏体验通过挑战认知框架，创造时间感知扩展，增强当下临在感。**

这一洞察整合了现象学时间意识理论与现代情绪科学：
- 敬畏的"广阔性"挑战既有认知框架
- 认知框架的暂时"失效"创造时间感知的扩展
- 时间扩展增强当下临在感，促进现象学觉察

---

## 核心功能

### 1. AweTimeExpansionAssessor

评估敬畏体验的时间扩展效应：

```javascript
const { AweTimeExpansionAssessor } = require('./awe-time-expansion');

const assessor = new AweTimeExpansionAssessor();

const report = {
  description: '站在山顶俯瞰云海，感觉时间仿佛静止了',
  source: 'nature',
  intensity: 8,
  emotions: ['wonder', 'peace', 'gratitude']
};

const assessment = assessor.assess(report);
// 输出：
{
  source: 'nature',
  valence: { type: 'positive', score: 1.0 },
  timeExpansion: {
    detected: true,
    indicators: ['slowed_time', 'present_moment'],
    score: 0.75,
    level: 'HIGH'
  },
  integrationScore: { overall: 85 },
  recommendations: [...]
}
```

### 2. 敬畏 - 时间扩展练习

生成个性化练习方案：

```javascript
const practices = assessor.generatePractice({
  availableTime: 20,
  preferredSource: 'nature',
  experienceLevel: 'beginner'
});

// 输出包含：
// - 时间扩展敬畏练习 (20 分钟)
// - Husserl 时间三重觉察 (15 分钟，可选)
```

---

## 新增练习

### 练习 1: 时间扩展敬畏练习 (15-20 分钟)

**步骤**:

1. **敬畏诱导 (5 分钟)**
   - 选择能引发敬畏的场景
   - 选项：自然景观 / 震撼视频 / 深刻回忆 / 艺术体验
   - 让自己完全沉浸其中

2. **时间觉察 (5 分钟)**
   - 注意时间感如何变化
   - 时间变慢了吗？
   - 当下感增强了吗？
   - 不加评判地观察

3. **现象学描述 (5 分钟)**
   - 用语言描述体验本身
   - 不解释、不分析
   - 只描述：感觉、意象、身体感受

4. **整合 (5 分钟)**
   - 将这份敬畏和临在感带入接下来的日常活动
   - 设定一个意图：保持这份觉察

### 练习 2: Husserl 时间三重觉察 (15 分钟)

**理论基础**: Husserl 时间意识现象学

**步骤**:

1. **原初印象觉察 (5 分钟)**
   - 觉察当前的直接体验
   - 声音、触感、视觉、气味
   - 这是"现在"的给定性 (Givenness)

2. **保留觉察 (5 分钟)**
   - 觉察刚刚过去的体验如何在意识中保持
   - 注意"刚才"如何影响"现在"
   - 体验时间的"彗星尾迹"

3. **预期觉察 (5 分钟)**
   - 觉察对即将到来的体验的预期
   - 注意意识如何"向前延伸"
   - 体验时间的"前瞻性"

**核心洞见**: 自我不是瞬间的点，而是过去 - 现在 - 未来的动态统一

### 练习 3: 日常敬畏培养 (每日 5 分钟)

**方式**:

1. **自然觉察**
   - 每天花 5 分钟观察自然
   - 一片叶子的纹理
   - 天空的云彩变化
   - 阳光的角度

2. **儿童视角练习**
   - 花时间和婴幼儿相处
   - 通过他们的眼睛看世界
   - 重新发现日常的奇迹

3. **敬畏叙事写作**
   - 每周写一次敬畏体验
   - 描述场景、感受、身体感觉
   - 记录时间感的变化

---

## 敬畏效价区分

### 积极敬畏 (Positive Awe)
- **特征**: wonder, amazement, beauty, gratitude
- **来源**: 自然美景、艺术体验、深刻连接
- **益处**: 幸福感↑、慷慨↑、好奇心↑、健康↑

### 消极敬畏 (Negative Awe)
- **特征**: fear, threat, dread, powerlessness
- **来源**: 自然灾害、威胁性权威、恐怖场景
- **注意**: 可能导致无力感，益处有限

### 混合敬畏 (Mixed Awe)
- **特征**: 同时包含积极和消极元素
- **来源**: 暴风雨、崇高体验 (sublime)
- **处理**: 引导向积极面向整合

---

## 使用场景

### 1. 情绪调节
当感到焦虑、匆忙、被时间追赶时：
- 使用时间扩展敬畏练习
- 重建与时间的健康关系
- 增强当下临在感

### 2. 自我探索
探索自我意识的时间维度：
- 使用 Husserl 时间三重觉察
- 理解自我是时间性的存在
- 发现时间深度与自我深度的关系

### 3. 幸福感提升
日常敬畏培养：
- 每周 2-3 次自然敬畏散步
- 每日 5 分钟敬畏觉察
- 提升整体幸福感

---

## API 参考

### AweTimeExpansionAssessor

#### `assess(experienceReport)`

评估敬畏体验的时间扩展效应

**参数**:
- `experienceReport.description` (string): 体验描述
- `experienceReport.source` (string): 敬畏来源 (可选)
- `experienceReport.intensity` (number): 强度 1-10
- `experienceReport.emotions` (array): 情绪列表
- `experienceReport.bodilySensations` (array): 身体感受

**返回**:
```javascript
{
  source: string,
  valence: { type, score, note },
  timeExpansion: { detected, indicators, score, level, description },
  integrationScore: { overall, breakdown },
  recommendations: array
}
```

#### `generatePractice(userPreferences)`

生成个性化练习方案

**参数**:
- `userPreferences.availableTime` (number): 可用时间 (分钟)
- `userPreferences.preferredSource` (string): 偏好来源
- `userPreferences.experienceLevel` (string): 经验水平

**返回**:
```javascript
{
  practices: array,
  totalDuration: number,
  theory: { source, keyInsight }
}
```

---

## 参考文献

### SEP 条目
- Dainton, B. (2026). Temporal Consciousness. Stanford Encyclopedia of Philosophy.
- Scarantino, A. (2026). Emotion. Stanford Encyclopedia of Philosophy.

### 敬畏研究
- Keltner, D. & Haidt, J. (2003). Approaching awe, a moral, spiritual, and aesthetic emotion.
- Gordon, A. et al. (2016). Awe, the small self, and prosocial behavior. JPSP.
- Berkeley Greater Good Science Center. (2026). The Science of Awe White Paper.

### 现象学
- Husserl, E. (1928). On the Phenomenology of the Consciousness of Internal Time.
- Zahavi, D. (2005). Subjectivity and Selfhood.

---

## 版本历史

### v5.0.3 (2026-03-30)
- ✅ 初始版本
- ✅ AweTimeExpansionAssessor 实现
- ✅ 时间扩展敬畏练习
- ✅ Husserl 时间三重觉察练习
- ✅ 日常敬畏培养指南
- ✅ 敬畏效价区分

---

## License

MIT License - HeartFlow Team
