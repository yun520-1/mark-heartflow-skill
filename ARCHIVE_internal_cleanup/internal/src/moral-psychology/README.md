# 道德心理学模块 (Moral Psychology Module) v3.30.0

## 概述

道德心理学模块基于斯坦福哲学百科全书 (SEP) 权威理论，为 HeartFlow 提供道德判断、道德发展和道德情感分析能力。

---

## 理论来源

### 规范伦理学三大传统

| 传统 | 核心问题 | 代表人物 | 关键概念 |
|------|---------|---------|---------|
| **美德伦理学** | 我应该成为什么样的人？ | Aristotle, Confucius, Mencius | 美德、实践智慧、幸福 (Eudaimonia)、中道 |
| **后果论** | 哪个行动会产生最好的结果？ | Bentham, Mill, Sidgwick | 最大幸福原则、结果决定对错、成本 - 效益分析 |
| **义务论** | 我的义务是什么？ | Kant | 绝对命令、可普遍化、人是目的、善良意志 |

### 道德发展理论

**Kohlberg 三水平六阶段模型**:
- **前习俗道德**: 服从惩罚导向 → 个人利益导向
- **习俗道德**: 人际和谐导向 → 权威秩序导向
- **后习俗道德**: 社会契约导向 → 普遍原则导向

**Haidt 道德基础理论** (5+1 基础):
- 关爱/伤害、公平/欺骗、忠诚/背叛、权威/颠覆、圣洁/堕落、自由/压迫

### 道德情感

| 类型 | 情绪 | 焦点 | 功能 |
|------|------|------|------|
| **自我意识情绪** | 羞耻、内疚、自豪 | 自我 | 维护规范、修复关系 |
| **他人谴责情绪** | 道德愤怒、蔑视、厌恶 | 他人 | 制止不公、维护正义 |
| **亲社会情绪** | 共情、同情、道德提升感 | 他人与自我 | 促进连接、激励善行 |

### 利他主义理论

- **亲缘利他** (Hamilton): 帮助遗传相关的亲属
- **互惠利他** (Trivers): 期待未来回报的合作
- **心理利他** (Batson): 共情驱动的纯粹利他
- **有效利他** (Effective Altruism): 用证据最大化善行影响

---

## 核心功能

### 1. 伦理学传统分析

```javascript
const { MoralPsychologyModule } = require('./src/moral-psychology');

const moral = new MoralPsychologyModule();

// 分析道德困境的三大伦理学视角
const analysis = moral.analyzeEthicalTraditions(
  '我应该为了救妻子而偷药吗？'
);

console.log(analysis.traditions.virtue_ethics);
// {
//   tradition: '美德伦理学',
//   coreQuestion: '在这种情况下，一个有美德的人会怎么做？',
//   analysis: {...},
//   reflection: [...]
// }
```

### 2. 道德发展阶段评估

```javascript
// 评估用户的道德推理阶段
const stageAssessment = moral.assessMoralDevelopmentStage(
  '虽然偷窃违法，但生命权高于财产权，法律应该保护生命'
);

console.log(stageAssessment.detectedStage);
// 'stage_5_social_contract'

console.log(stageAssessment.stageInfo.name);
// '社会契约导向'
```

### 3. 道德基础倾向分析

```javascript
// 分析道德基础倾向
const foundationAnalysis = moral.analyzeMoralFoundations(
  '这种行为不公平，损害了弱势群体的权利'
);

console.log(foundationAnalysis.dominantFoundation.name);
// '公平/欺骗'

console.log(foundationAnalysis.insight);
// 道德基础分布及倾向分析
```

### 4. 道德情感识别与指导

```javascript
// 分析道德情感状态
const emotionAnalysis = moral.analyzeMoralEmotion(
  '我感到很内疚，不应该那样对待他'
);

console.log(emotionAnalysis.primaryEmotion.name);
// '内疚'

console.log(emotionAnalysis.guidance);
// '内疚感是良知的信号。它提示你需要修复关系或弥补错误...'
```

### 5. 利他主义动机分析

```javascript
// 分析利他行为类型
const altruismAnalysis = moral.analyzeAltruismType(
  '我捐钱是因为看到那些孩子的痛苦，我想帮助他们'
);

console.log(altruismAnalysis.primaryType.type);
// 'psychological_altruism'

console.log(altruismAnalysis.primaryType.theory);
// 'Batson 共情 - 利他假说'
```

### 6. 完整交互

```javascript
// 综合道德分析
const fullAnalysis = moral.interact(
  '我在工作中发现同事作弊，应该举报吗？'
);

console.log(fullAnalysis.integratedGuidance.steps);
// 综合决策步骤
```

---

## 可操作练习

### 练习 1: 三大传统反思 (20-30 分钟)

**目标**: 从不同伦理学视角分析同一道德困境

**步骤**:
1. 描述你的道德困境
2. 美德伦理学视角：一个有美德的人会怎么做？
3. 后果论视角：各选项的后果是什么？如何最大化整体福祉？
4. 义务论视角：你的义务是什么？行动准则能普遍化吗？
5. 整合：哪个视角最符合你的价值观？

**输出**: 结构化决策框架

---

### 练习 2: 道德发展阶段探索 (15-20 分钟)

**目标**: 识别当前道德推理阶段，探索更成熟的视角

**步骤**:
1. 描述你对某个道德问题的推理
2. 识别主导的道德推理模式（惩罚/利益/关系/规则/契约/原则）
3. 探索下一阶段的视角会如何看待这个问题
4. 反思：是否有更成熟的思考方式？

**输出**: 道德发展洞察

---

### 练习 3: 道德基础平衡 (15 分钟)

**目标**: 识别自己的道德基础倾向，理解不同立场

**步骤**:
1. 回顾最近的道德判断或争议
2. 识别主导的道德基础（关爱/公平/忠诚/权威/纯洁/自由）
3. 探索其他基础会如何看这个问题
4. 反思：如何平衡不同道德基础的关切？

**输出**: 道德多元视角

---

### 练习 4: 道德情感觉察 (10-15 分钟)

**目标**: 识别和转化道德情感

**步骤**:
1. 觉察当前的道德情感（内疚/羞耻/愤怒/同情等）
2. 识别情感的焦点（自我/他人/行为）
3. 理解情感的功能性信息
4. 将情感转化为建设性行动

**输出**: 情感觉察与行动计划

---

### 练习 5: 利他动机反思 (10 分钟)

**目标**: 理解自己的利他行为动机

**步骤**:
1. 回顾最近的利他行为
2. 识别动机类型（亲缘/互惠/共情/有效利他）
3. 反思：动机是否纯粹？是否期待回报？
4. 探索如何使利他行为更有效

**输出**: 利他动机洞察

---

## 评估工具

### 道德困境决策质量评估

评估维度:
- 是否考虑了多伦理学视角
- 是否识别了所有利益相关者
- 是否考虑了短期和长期后果
- 是否尊重了人的尊严和权利
- 是否符合个人核心价值观

### 道德发展成熟度评估

评估维度:
- 道德推理的抽象程度
- 是否超越个人利益
- 是否考虑社会契约和普遍原则
- 是否能整合多视角

### 道德情感觉察评估

评估维度:
- 情绪识别准确性
- 情绪 - 认知整合程度
- 情绪调节能力
- 转化为建设性行动的能力

---

## 与其他模块的关系

| 相关模块 | 关系描述 |
|---------|---------|
| **自由意志与能动性 (v3.29.0)** | 共享自主性、认同、价值观概念 |
| **叙事心理学 (v3.27.0)** | 道德身份是生命故事的核心主题 |
| **共情现象学 (v3.23.0)** | 共情是道德情感的基础 |
| **SDT 自我决定理论 (v3.5.0)** | 共享自主性、整合概念 |
| **积极心理学 (v3.5.0)** | 共享美德、品格优势概念 |
| **斯多葛哲学 (v3.6.0)** | 共享美德伦理学传统 |

---

## 使用场景

### 场景 1: 道德困境决策

```
用户：我在工作中发现同事作弊，应该举报吗？

HeartFlow:
这是一个经典的道德困境。让我们从三个伦理学视角来分析：

**美德伦理学视角**:
一个有美德的人会怎么做？诚实、正直、勇气这些美德会如何指导你？

**后果论视角**:
- 举报的后果：同事可能受处分，团队信任可能受损，但公司利益得到保护
- 不举报的后果：作弊可能继续，公司受损，你可能成为共犯
- 如何最大化整体福祉？

**义务论视角**:
- 你的义务是什么？对公司？对同事？对自己？
- 你的行动准则能普遍化吗？（"发现作弊应该举报"）
- 是否将他人当作目的而非手段？

你的直觉倾向于哪个视角？
```

### 场景 2: 内疚情绪处理

```
用户：我对朋友说了谎，现在感到很内疚。

HeartFlow:
内疚感是良知的信号，它提示你需要修复关系。

**内疚 vs 羞耻**:
- 内疚："我做了坏事"（聚焦行为）
- 羞耻："我是坏人"（聚焦自我）

你体验的是内疚，这是健康的——它指向修复而非自我否定。

**修复步骤**:
1. 承认错误：向朋友坦诚你说了谎
2. 表达歉意：真诚道歉，不找借口
3. 弥补行动：如何修复信任？
4. 学习成长：未来如何避免类似情况？

内疚的价值在于推动我们成为更好的人。你愿意尝试这些步骤吗？
```

### 场景 3: 道德愤怒转化

```
用户：看到那些有钱人逃避税收，我感到非常愤怒！

HeartFlow:
你的道德愤怒是合理的——这涉及公平/欺骗的道德基础。

**道德愤怒的功能**:
- 信号：检测到不公正
- 动机：激励制止不公、推动改变

**建设性转化**:
1. 确认愤怒的合理性：你的正义感是美德
2. 避免过度认同：愤怒是工具，不是主人
3. 探索行动选项：
   - 支持税收改革倡导
   - 支持透明度和问责制
   - 在自己的生活中践行诚信
4. 平衡视角：也有许多富人在积极回馈社会

愤怒可以成为改变的动力。你想探索哪些行动选项？
```

---

## 技术细节

### 代码结构

```javascript
class MoralPsychologyModule {
  // 核心分析方法
  analyzeEthicalTraditions(dilemma)      // 三大伦理学视角分析
  assessMoralDevelopmentStage(reasoning) // 道德发展阶段评估
  analyzeMoralFoundations(statement)     // 道德基础倾向分析
  analyzeMoralEmotion(expression)        // 道德情感识别
  analyzeAltruismType(behavior)          // 利他动机分析
  
  // 主交互方法
  interact(userInput)                    // 综合道德分析
  
  // 辅助方法
  _initEthicsTraditions()                // 初始化伦理学传统
  _initKohlbergStages()                  // 初始化道德发展阶段
  _initMoralFoundations()                // 初始化道德基础
  _initMoralEmotions()                   // 初始化道德情感
  _generateIntegratedGuidance()          // 生成综合指导
}
```

### 理论框架整合

```
SEP Moral Psychology
├── 规范伦理学
│   ├── 美德伦理学 (Aristotle, Confucius)
│   ├── 后果论 (Bentham, Mill)
│   └── 义务论 (Kant)
├── 道德发展
│   ├── Kohlberg 三水平六阶段
│   └── Haidt 道德基础理论
├── 道德情感
│   ├── 自我意识情绪 (羞耻/内疚/自豪)
│   ├── 他人谴责情绪 (道德愤怒/蔑视/厌恶)
│   └── 亲社会情绪 (共情/同情/道德提升感)
└── 利他主义
    ├── 亲缘利他 (Hamilton)
    ├── 互惠利他 (Trivers)
    ├── 心理利他 (Batson)
    └── 有效利他 (Effective Altruism)
```

---

## 参考文献

### 经典文献

- Aristotle. *Nicomachean Ethics*. (尼各马可伦理学)
- Plato. *Republic*. (理想国)
- Confucius. *Analects*. (论语)
- Mencius. *Mencius*. (孟子)
- Kant, I. (1785). *Groundwork of the Metaphysics of Morals*.
- Bentham, J. (1789). *Introduction to the Principles of Morals and Legislation*.
- Mill, J.S. (1861). *Utilitarianism*.

### 现代研究

- Anscombe, G.E.M. (1958). "Modern Moral Philosophy".
- Kohlberg, L. (1981). *Essays on Moral Development*.
- Haidt, J. (2001). "The Emotional Dog and Its Rational Tail". *Psychological Review*.
- Haidt, J. (2012). *The Righteous Mind*.
- Batson, C.D. (1991). *The Altruism Question*.
- Hamilton, W.D. (1964). "The Genetical Evolution of Social Behaviour". *Nature*.
- Trivers, R.L. (1971). "The Evolution of Reciprocal Altruism". *Quarterly Review of Biology*.

### SEP 条目

- Virtue Ethics: https://plato.stanford.edu/entries/ethics-virtue/
- Consequentialism: https://plato.stanford.edu/entries/consequentialism/
- Deontology: https://plato.stanford.edu/entries/deontology/
- Moral Psychology: https://plato.stanford.edu/entries/moral-psychology/
- Altruism: https://plato.stanford.edu/entries/altruism-biological/

---

**版本**: v3.30.0  
**创建时间**: 2026-03-30  
**作者**: HeartFlow Team  
**理论来源**: Stanford Encyclopedia of Philosophy (SEP)
