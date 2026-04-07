# 依恋理论增强模块 (Attachment Enhancement Module) v3.42.0

## 概述

依恋理论增强模块基于 **John Bowlby** 和 **Mary Ainsworth** 的经典依恋理论，结合现代成人依恋研究，为 HeartFlow 提供深度的依恋风格评估、内部工作模式分析和依恋修复指导能力。

---

## 理论来源

### 经典依恋理论

| 理论家 | 贡献 | 核心著作 |
|--------|------|---------|
| **John Bowlby** | 依恋理论创始人，提出内部工作模式概念 | *Attachment and Loss* (1969-1980) |
| **Mary Ainsworth** | 陌生情境实验，婴儿依恋三类型 | *Patterns of Attachment* (1978) |

### 成人依恋理论

| 研究者 | 贡献 | 发表年份 |
|--------|------|---------|
| **Hazan & Shaver** | 浪漫爱情作为依恋过程 | 1987 |
| **Bartholomew & Horowitz** | 成人依恋四类型模型 | 1991 |
| **Brennan, Clark, & Shaver** | 依恋维度测量 (ECR) | 1998 |
| **Mikulincer & Shaver** | 成人依恋综合理论 | 2007 |

---

## 核心理论框架

### 1. 成人依恋四类型模型

基于**自我模型 (Self-Model)** 和**他人模型 (Other-Model)** 两个维度：

```
                    他人模型 (积极)
                         ↑
                         |
    焦虑 - 专注型          |         安全型
    (消极自我 +           |      (积极自我 +
     积极他人)            |       积极他人)
                         |
    ---------------------+--------------------→ 自我模型
                         |    (消极)          (积极)
                         |
    恐惧 - 回避型          |         回避 - 轻视型
    (消极自我 +           |      (积极自我 +
     消极他人)            |       消极他人)
                         |
                    他人模型 (消极)
```

| 类型 | 自我模型 | 他人模型 | 核心特征 |
|------|---------|---------|---------|
| **安全型** | 积极 | 积极 | 舒适于亲密，平衡独立与依赖 |
| **焦虑 - 专注型** | 消极 | 积极 | 害怕被抛弃，过度寻求确认 |
| **回避 - 轻视型** | 积极 | 消极 | 强调独立，贬低亲密价值 |
| **恐惧 - 回避型** | 消极 | 消极 | 矛盾混乱，既渴望又害怕亲密 |

### 2. 内部工作模式 (Internal Working Models)

**自我模型**: 关于自己是否值得被爱、是否有能力的核心信念
- 积极：「我值得被爱」、「我足够好」
- 消极：「我不够好」、「我会被抛弃」

**他人模型**: 关于他人是否可靠、是否可信任的核心信念
- 积极：「别人通常是可靠的」、「可以依赖他人」
- 消极：「别人会伤害我」、「不能依赖任何人」

### 3. 依恋行为系统

**抗议行为 (Protest Behavior)** - 焦虑型:
- 过度联系、故意疏远、嫉妒、分手威胁、生闷气

**去激活策略 (Deactivation Strategies)** - 回避型:
- 情感压抑、理性化、亲密回避、过度自给自足

**过度激活策略 (Hyperactivation Strategies)** - 焦虑型:
- 反复思考、寻求确认、爱的测试

**推 - 拉模式 (Push-Pull Pattern)** - 恐惧型:
- 接近 - 回避冲突、靠近时逃离

---

## 核心功能

### 1. 四类型评估

```javascript
const AttachmentEnhancement = require('./src/attachment-enhancement');

const result = AttachmentEnhancement.assessFourTypes(
  '他总是回消息很慢，我忍不住一直想他是不是不爱我了'
);

console.log(result);
// {
//   primaryType: 'anxious-preoccupied',
//   typeDescription: '焦虑 - 专注型：渴望亲密但担心被抛弃...',
//   scores: { anxiety: 8, avoidance: 2, security: 2 },
//   selfModel: 'negative',
//   otherModel: 'positive',
//   confidence: 'high'
// }
```

### 2. 内部工作模式分析

```javascript
const iwm = AttachmentEnhancement.analyzeInternalWorkingModels(
  '我觉得我不够好，配不上他，但他对我很好'
);

console.log(iwm);
// {
//   selfModel: { orientation: 'negative', score: -2, beliefs: ['我不够好'] },
//   otherModel: { orientation: 'positive', score: 1, beliefs: ['他对我很好'] },
//   attachmentQuadrant: { 
//     type: 'anxious-preoccupied', 
//     description: '焦虑 - 专注型：消极自我 + 积极他人' 
//   }
// }
```

### 3. 依恋修复计划

```javascript
const repairPlan = AttachmentEnhancement.generateRepairPlan('anxious-preoccupied');

console.log(repairPlan);
// {
//   techniques: ['self_soothing', 'cognitive_restructuring', 'direct_communication'],
//   exercises: ['mindful_breathing', 'thought_record', 'needs_expression'],
//   timeline: '8-12 周'
// }
```

### 4. 维度评分

```javascript
const dimensions = AttachmentEnhancement.getDimensionScores(
  '我觉得谈恋爱太麻烦了，一个人挺好的'
);

console.log(dimensions);
// {
//   anxiety: 2,
//   avoidance: 8,
//   security: 2,
//   anxietyLevel: 'low',
//   avoidanceLevel: 'high'
// }
```

### 5. 关系模式检测

```javascript
const patterns = AttachmentEnhancement.detectRelationshipPatterns(
  '我想靠近他，但又害怕受伤，每次他靠近我就想逃'
);

console.log(patterns);
// {
//   patterns: [
//     { type: 'approach_avoidance', name: '接近 - 回避冲突', detected: true },
//     { type: 'flight_when_close', name: '靠近时逃离', detected: true }
//   ],
//   hasProtestBehavior: false,
//   hasDeactivation: false,
//   hasHyperactivation: false,
//   hasPushPull: true
// }
```

### 6. 完整交互

```javascript
const fullAnalysis = AttachmentEnhancement.interact(userInput);

console.log(fullAnalysis.guidance);
// {
//   primaryInsight: '你表现出焦虑型依恋特征。建议练习自我安抚...',
//   workingModelsInsight: '你的内部工作模式：消极自我 + 积极他人',
//   patternsInsight: '检测到的关系模式：过度联系、反复思考',
//   nextSteps: ['练习自我安抚技巧（深呼吸、正念冥想）', ...]
// }
```

---

## 可操作练习

### 练习 1: 自我安抚技巧 (焦虑型)

**目标**: 在依恋系统被激活时自我平静

**步骤**:
1. 觉察身体感受 (心跳加速、呼吸急促等)
2. 深呼吸：吸气 4 秒，屏息 4 秒，呼气 6 秒
3. 自我对话：「我现在感到不安，但我是安全的」
4. 重复直到平静

**频率**: 每天练习，尤其在关系焦虑时

---

### 练习 2: 去激活策略觉察 (回避型)

**目标**: 识别自己的情感回避模式

**步骤**:
1. 回顾最近一次想要疏远伴侣的时刻
2. 识别当时的感受（脆弱？被控制？）
3. 识别使用的策略（理性化？转移注意力？）
4. 问自己：「如果我不回避，会发生什么？」

**频率**: 每周反思 2-3 次

---

### 练习 3: 小步骤脆弱性暴露 (回避型/恐惧型)

**目标**: 逐步学习表达需求和脆弱

**步骤**:
1. 从低风险情境开始（朋友而非伴侣）
2. 表达一个小需求或感受
3. 观察对方反应和自己的感受
4. 逐步增加暴露程度

**频率**: 每周 1-2 次小暴露

---

### 练习 4: 思维记录 (焦虑型)

**目标**: 识别并挑战灾难化思维

**步骤**:
1. 记录触发事件（他没回消息）
2. 记录自动化思维（他不爱我了）
3. 寻找证据支持/反对这个思维
4. 生成替代思维（他可能在忙，不代表不爱我）

**频率**: 每次强烈情绪时

---

### 练习 5: 自我同情练习 (恐惧型/焦虑型)

**目标**: 修复消极自我模型

**步骤**:
1. 觉察自我批评的念头
2. 想象对好朋友说同样的话会怎样
3. 用善意和理解对待自己
4. 对自己说：「这很难，但我正在努力」

**频率**: 每天 5-10 分钟

---

## 应用场景

### 场景 1: 关系焦虑干预

```
用户：他总是回消息很慢，我忍不住一直想他是不是不爱我了...

HeartFlow:
我听到你在担心他对你的感情。这种担忧是很常见的。

**依恋视角**:
你表现出焦虑型依恋的特征——渴望亲密但担心被抛弃。
这可能与你的内部工作模式有关：消极自我（「我不够好」）+ 积极他人（「他是好的，但我可能失去他」）。

**建议**:
1. 自我安抚：深呼吸，告诉自己「我现在感到不安，但我是安全的」
2. 挑战灾难化思维：「他回消息慢 = 不爱我」有其他解释吗？
3. 直接表达：与其猜测，不如温和地表达你的需求

你想试试哪个练习？
```

### 场景 2: 亲密回避干预

```
用户：我觉得谈恋爱太麻烦了，一个人挺好的。

HeartFlow:
听起来你对亲密关系有些保留。

**依恋视角**:
你可能倾向于回避型依恋——强调独立，认为亲密关系会带来束缚。
内部工作模式可能是：积极自我（「我不需要别人」）+ 消极他人（「别人会控制我」）。

**反思问题**:
- 这种「不需要别人」的感觉是什么时候开始的？
- 如果放下一些独立，最坏会发生什么？
- 有没有体验过既亲密又自由的关系？

**小步骤**:
尝试向信任的人表达一个小需求，观察会发生什么。
```

### 场景 3: 矛盾混乱模式干预

```
用户：我想谈恋爱，但又害怕受伤。每次有人靠近我就想逃...

HeartFlow:
这种矛盾的感受一定很煎熬。

**依恋视角**:
你表现出恐惧型依恋的特征——既渴望又害怕亲密。
这通常源于：消极自我（「我不值得被爱」）+ 消极他人（「别人会伤害我」）。

**建议**:
1. 从安全的关系开始（朋友、家人、咨询师）
2. 培养自我同情，修复对自己的看法
3. 渐进式信任建立，不急于承诺
4. 觉察「推 - 拉」模式，在想要逃时暂停

改变需要时间，你已经在觉察的路上了。
```

---

## 评估工具

### 依恋风格评估维度

| 维度 | 低分 (0-3) | 中分 (4-6) | 高分 (7-10) |
|------|-----------|-----------|-----------|
| **焦虑** | 安全感强，不担心被抛弃 | 偶尔担忧 | 持续担心被抛弃/不被爱 |
| **回避** | 舒适于亲密和依赖 | 需要平衡 | 强烈回避亲密，强调独立 |

### 改变进展指标

- 焦虑维度分数下降
- 回避维度分数下降
- 安全感分数上升
- 抗议行为/去激活策略减少
- 直接沟通增加
- 关系满意度提升

---

## 与其他模块的关系

| 相关模块 | 关系描述 |
|---------|---------|
| **情绪调节 (v3.8.0)** | 依恋风格影响情绪调节策略 |
| **共情现象学 (v3.23.0)** | 安全依恋促进共情能力 |
| **自我同情 (v3.10.0)** | 自我同情修复消极自我模型 |
| **CBT (v3.1.0)** | 认知重构挑战依恋相关信念 |
| **人际心理治疗** | 共享关系焦点 |

---

## 重要说明

### 依恋风格不是固定的

现代研究表明：
- **神经可塑性**: 大脑可以通过新经验重组
- **获得性安全 (Earned Security)**: 非安全型可以发展为安全型
- **改变途径**: 治疗关系、安全伴侣、自我觉察练习

### 文化敏感性

依恋表达受文化影响：
- 集体主义文化可能表现不同的依赖模式
- 避免将西方依恋标准强加于所有文化
- 尊重个体的关系价值观

### 专业边界

本模块用于：
- ✅ 自我觉察和教育
- ✅ 一般关系指导
- ✅ 心理成长支持

不用于：
- ❌ 临床诊断
- ❌ 替代专业治疗
- ❌ 处理严重创伤

---

## 参考文献

### 经典著作
- Bowlby, J. (1969-1980). *Attachment and Loss* (Vol. 1-3). Basic Books.
- Ainsworth, M. D. S., Blehar, M. C., Waters, E., & Wall, S. (1978). *Patterns of Attachment*. Erlbaum.

### 成人依恋
- Hazan, C., & Shaver, P. (1987). Romantic love conceptualized as an attachment process. *Journal of Personality and Social Psychology*.
- Bartholomew, K., & Horowitz, L. M. (1991). Attachment styles among young adults. *Journal of Personality and Social Psychology*.
- Mikulincer, M., & Shaver, P. R. (2007). *Attachment in Adulthood: Structure, Dynamics, and Change*. Guilford Press.

### 依恋修复
- Johnson, S. M. (2004). *The Practice of Emotionally Focused Couple Therapy*. Brunner-Routledge.
- Siegel, D. J. (2012). *The Developing Mind* (2nd ed.). Guilford Press.
- Wallin, D. J. (2007). *Attachment in Psychotherapy*. Guilford Press.

---

**版本**: v3.42.0  
**创建时间**: 2026-03-30  
**作者**: HeartFlow Team  
**理论来源**: Bowlby, Ainsworth, Bartholomew, Mikulincer & Shaver
