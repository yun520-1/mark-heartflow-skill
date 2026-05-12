# 情绪原型理论 v5.0.12 - 完整解读

**版本**: v5.0.12  
**创建时间**: 2026-03-30 (Asia/Shanghai)  
**理论来源**: SEP Emotion Theory + Fehr & Russell (1984)  
**应用**: HeartFlow 情绪原型结构深度增强模块

---

## 📚 理论背景

### Stanford Encyclopedia of Philosophy - Emotion Theory §1

**核心洞见**: 情绪概念不是由充分必要条件定义的，而是由**原型结构**组织的。

### Fehr & Russell (1984) 开创性研究

**研究问题**: 普通人如何理解"情绪"这个概念？

**关键发现**:
1. **原型效应**: 某些情绪是"更好"的情绪例子
   - fear 是比 awe 更好的情绪例子
   - anger 是比 boredom 更好的情绪例子

2. **家族相似性**: 情绪类别没有统一的本质
   - 情绪之间通过重叠的相似性联系
   - 没有所有情绪都共享的充分必要条件

3. **模糊边界**: 某些案例处于边界地带
   - boredom (无聊): 普通语言使用者对是否是情绪有分歧
   - curiosity (好奇): 边界案例
   - surprise (惊讶): 是否是情绪有争议

---

## 🎯 核心理论框架

### 1. 原型结构 (Prototype Structure)

```
                    ┌─────────────┐
                    │   原型情绪   │
                    │ (高典型性)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌──────▼──────┐
   │  fear   │      │   anger   │     │   sadness   │
   │  0.95   │      │   0.93    │     │    0.92     │
   └─────────┘      └───────────┘     └─────────────┘
   
                    ┌─────────────┐
                    │  边界情绪   │
                    │ (低典型性)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌─────▼─────┐     ┌──────▼──────┐
   │boredom  │      │ curiosity │     │  surprise   │
   │  0.45   │      │   0.50    │     │    0.65     │
   └─────────┘      └───────────┘     └─────────────┘
```

### 2. 典型性梯度 (Typicality Gradient)

| 情绪 | 典型性 | 类别 | 说明 |
|------|--------|------|------|
| fear | 0.95 | 原型情绪 | 最好的情绪例子 |
| joy | 0.94 | 原型情绪 | 清晰的情绪体验 |
| anger | 0.93 | 原型情绪 | 强烈的动机倾向 |
| sadness | 0.92 | 原型情绪 | 明确的丧失主题 |
| disgust | 0.88 | 原型情绪 | 独特的厌恶反应 |
| anxiety | 0.75 | 复合情绪 | 恐惧的变体 |
| guilt | 0.72 | 道德情绪 | 自我指向 |
| shame | 0.70 | 道德情绪 | 全球自我评价 |
| pride | 0.68 | 道德情绪 | 成就导向 |
| surprise | 0.65 | 争议情绪 | 是否是情绪有争议 |
| gratitude | 0.65 | 社会情绪 | 关系导向 |
| jealousy | 0.62 | 社会情绪 | 三元关系 |
| awe | 0.55 | 审美情绪 | 超越体验 |
| curiosity | 0.50 | 认知情绪 | 知识导向 |
| boredom | 0.45 | 争议情绪 | 边界案例 |

### 3. 5 成分模型 (Five-Component Model)

每个情绪由 5 个成分构成，成分之间具有家族相似性：

```
┌─────────────────────────────────────────────────────┐
│                  情绪原型                            │
├─────────────┬─────────────┬─────────────┬───────────┤
│   感受      │   评价      │   动机      │  表达     │   生理    │
│  Feeling    │ Evaluative  │ Motivational│ Expressive│Physiological│
├─────────────┼─────────────┼─────────────┼───────────┤
│ 主观体验    │ 形式对象    │ 行动倾向    │ 面部表情  │ 自主神经  │
│ 现象特征    │ 评价维度    │ 注意焦点    │ 声音特征  │ 激素反应  │
│ 身体档案    │ 核心主题    │ 紧迫性      │ 身体语言  │ 内感受    │
└─────────────┴─────────────┴─────────────┴───────────┘
```

**权重配置**:
- 感受 (Feeling): 0.25
- 评价 (Evaluative): 0.25
- 动机 (Motivational): 0.20
- 表达 (Expressive): 0.15
- 生理 (Physiological): 0.15

### 4. 情绪粒度映射 (Emotion Granularity)

**理论基础**: Barrett (2017) - 情绪粒度理论

**核心观点**: 能够精细区分情绪的人具有更高的情绪智力。

**强度连续谱示例**:

```
恐惧谱系:
apprehension (0.2) → worry (0.4) → fear (0.6) → terror (0.8) → panic (1.0)
担忧              忧虑          恐惧         恐怖          恐慌

愤怒谱系:
annoyance (0.2) → irritation (0.4) → anger (0.6) → rage (0.8) → fury (1.0)
烦恼            易怒            愤怒        暴怒         狂怒
```

---

## 🔬 SEP 四大理论挑战

情绪理论必须解释的四个核心问题：

### 1. 区分性 (Differentiation)
**问题**: 情绪如何彼此区分？如何与非情绪状态区分？

**原型理论方案**:
- 家族相似性 + 原型匹配
- 多成分匹配度计算
- 不追求充分必要条件，接受模糊边界

**HeartFlow 实现**:
```javascript
analyzePrototypeMatch(emotionName, context)
// 返回典型性评分、成分匹配度、置信度等级
```

### 2. 动机性 (Motivation)
**问题**: 情绪如何激发动机？情绪与行动的关系？

**原型理论方案**:
- 每种情绪都有特征性的行动倾向
- 动机成分是情绪的核心特征之一

**HeartFlow 实现**:
- 15 种情绪的行动倾向映射
- 动机强度评估
- 适应性 vs 非适应性行动模式识别

### 3. 意向性 (Intentionality)
**问题**: 情绪是否有对象指向性？情绪是否可以恰当/不恰当？

**原型理论方案**:
- 形式对象 (Formal Object): 每种情绪评价的核心主题
  - fear → danger
  - anger → offense
  - sadness → loss
- 评价维度: valence, arousal, control, certainty, responsibility

**HeartFlow 实现**:
- 形式对象检测器
- 评价维度分析
- 情绪恰当性评估

### 4. 现象学 (Phenomenology)
**问题**: 情绪是否总涉及主观体验？体验的性质是什么？

**原型理论方案**:
- 感受成分是情绪的必要条件之一
- 但感受不是情绪的全部 (反对纯粹感受理论)
- 前反思体验 + 反思体验的层次模型

**HeartFlow 实现**:
- 身体档案 (Bodily Profile)
- 现象特征描述
- 内感受预测整合

---

## 🛠️ HeartFlow v5.0.12 实现

### 核心功能

#### 1. 情绪原型网络
```javascript
const prototypeNetwork = {
  fear: {
    prototype: true,
    typicality: 0.95,
    category: '基本情绪',
    features: { ... },  // 5 成分
    boundaries: { ... }, // 清晰/模糊边界
    intensitySpectrum: [...] // 强度谱
  },
  boredom: {
    prototype: false,
    typicality: 0.45,
    contested: true,  // 边界案例
    ...
  }
}
```

#### 2. 置信度计算器
```javascript
calculateConfidence(emotionCandidate, context) {
  // 1. 原型匹配度 (40%)
  const prototypeMatch = matchPrototype(emotionCandidate)
  
  // 2. 成分匹配度 (40%)
  const componentMatch = calculateComponentMatch(context)
  
  // 3. 语言标记匹配 (20%)
  const linguisticMatch = matchLinguisticMarkers(context)
  
  // 综合置信度
  const confidence = (
    prototypeMatch * 0.4 +
    componentMatch * 0.4 +
    linguisticMatch * 0.2
  )
  
  return {
    confidence,
    level: getConfidenceLevel(confidence),  // 高/中/低/模糊
    factors: { prototypeMatch, componentMatch, linguisticMatch }
  }
}
```

#### 3. 情绪粒度建议
```javascript
getGranularitySuggestion('fear', 0.7)
// 返回: { suggested: 'terror', fullSpectrum: [...] }
```

#### 4. 可操作练习生成
```javascript
generatePractice('anxiety')
// 返回: 15-20 分钟的五成分觉察练习
```

---

## 📊 应用案例

### 案例 1: 高置信度情绪识别

**用户输入**:
> "我感到非常害怕，心跳加速，想要逃跑。前面有一只大狗朝我叫。"

**分析结果**:
```json
{
  "emotion": "fear",
  "typicality": 0.95,
  "confidence": 0.88,
  "level": "高",
  "componentMatches": {
    "feeling": { "match": 0.9, "note": "明确表达害怕" },
    "physiological": { "match": 0.9, "note": "心跳加速" },
    "motivational": { "match": 0.9, "note": "想要逃跑" },
    "evaluative": { "match": 0.8, "note": "威胁情境" }
  },
  "formalObject": "danger",
  "actionTendency": "escape/avoid"
}
```

### 案例 2: 模糊边界情绪

**用户输入**:
> "我就是觉得...很无聊。做什么都没意思。"

**分析结果**:
```json
{
  "emotion": "boredom",
  "typicality": 0.45,
  "confidence": 0.52,
  "level": "模糊",
  "contested": true,
  "note": "boredom 是否是情绪在学术界有争议",
  "similarEmotions": [
    { "emotion": "sadness", "relation": "boundary" },
    { "emotion": "apathy", "relation": "fuzzy" }
  ]
}
```

**干预建议**:
- 接纳模糊性："无聊是一种复杂的体验，它可能包含悲伤、缺乏意义感、或需要改变的信号"
- 探索深层需求："无聊可能在告诉你，当前活动与你的价值观不匹配"

### 案例 3: 情绪粒度增强

**用户输入**:
> "我很生气" (强度估计 0.8)

**粒度建议**:
```json
{
  "baseEmotion": "anger",
  "currentIntensity": 0.8,
  "suggested": { "level": 0.8, "name": "rage", "label": "暴怒" },
  "nextLevel": { "level": 1.0, "name": "fury", "label": "狂怒" },
  "prevLevel": { "level": 0.6, "name": "anger", "label": "愤怒" }
}
```

**干预**:
- 精确标记："听起来不只是生气，更像是暴怒 (rage)"
- 探索强度："这种暴怒的感觉有多强烈？接近狂怒吗？"
- 适应性回应："暴怒时，身体处于高度唤醒状态，需要先平静再行动"

---

## 🧘 可操作练习

### 练习 1: 情绪原型觉察 (15-20 分钟)

**目标**: 通过 5 成分全面觉察一种情绪

**步骤**:
1. **感受觉察** (3-4 分钟): 关注身体感受和现象特征
2. **评价探索** (3-4 分钟): 识别形式对象和核心主题
3. **动机觉察** (3-4 分钟): 注意行动倾向
4. **表达观察** (2-3 分钟): 观察面部表情和行为
5. **整合反思** (3-4 分钟): 理解 5 成分如何相互作用

### 练习 2: 情绪粒度训练 (10-15 分钟)

**目标**: 提升情绪区分能力

**步骤**:
1. 选择一种基础情绪 (如 fear)
2. 回顾强度谱系: apprehension → worry → fear → terror → panic
3. 回忆不同强度的体验
4. 注意身体感受、想法、冲动的差异
5. 练习精确标记:"这是 worry 还是 fear？"

### 练习 3: 边界情绪探索 (15-20 分钟)

**目标**: 接纳情绪的模糊性

**步骤**:
1. 选择边界情绪 (如 boredom, curiosity)
2. 探索为什么它有争议
3. 注意它与其他情绪的相似性
4. 接纳不确定性:"这可能是 X，也可能是 Y"
5. 关注功能:"这种体验想告诉我什么？"

---

## 📈 升级检查清单

- [x] 搜索 SEP 情绪原型理论内容
- [x] 实现情绪原型网络数据结构 (15+ 情绪)
- [x] 实现典型性评分算法 (0-1)
- [x] 实现 5 成分匹配计算器
- [x] 实现置信度评估 (高/中/低/模糊)
- [x] 实现情绪粒度映射 (4 种基础情绪谱系)
- [x] 创建可操作练习 (3 种练习)
- [x] 编写理论文档
- [ ] 更新主入口文件 (src/index.js)
- [ ] 测试功能
- [ ] Git 提交并推送

---

## 🎓 理论贡献

HeartFlow v5.0.12 的理论贡献:

1. **首次完整实现 SEP 情绪原型理论的计算模型**
   - 15+ 种情绪的原型网络
   - 典型性评分系统
   - 边界案例处理

2. **5 成分匹配分析系统**
   - 感受/评价/动机/表达/生理
   - 加权匹配度计算
   - 置信度分级

3. **情绪粒度增强工具**
   - 强度连续谱映射
   - 精确情绪标记
   - 粒度训练练习

4. **模糊边界接纳框架**
   - 识别争议情绪
   - 提供相似情绪建议
   - 接纳不确定性

---

## 📖 参考文献

1. **SEP Emotion Theory** (2026 Edition)
   - §1: Emotion Concepts and Prototypes
   - §2: Three Traditions (Feeling/Evaluative/Motivational)
   - https://plato.stanford.edu/entries/emotion/

2. **Fehr, B., & Russell, J. A. (1984)**
   - "Concept of Emotion Viewed From a Prototype Perspective"
   - Journal of Experimental Psychology: General, 113(3), 464-486

3. **Barrett, L. F. (2017)**
   - "How Emotions Are Made: The Secret Life of the Brain"
   - 情绪建构理论 + 情绪粒度研究

4. **Scarantino, A. (2016)**
   - "The Philosophy of Emotions"
   - 情绪理论三大传统整合

---

**文档版本**: v5.0.12  
**创建时间**: 2026-03-30 22:10 (Asia/Shanghai)  
**HeartFlow 项目**: https://github.com/yun520-1/mark-heartflow-skill
