# HeartFlow v3.42.0 升级完成报告

**升级时间**: 2026-03-30 08:15 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v3.41.0 → v3.42.0)  
**升级方向**: 依恋理论深化模块 (Attachment Theory Enhancement)

---

## 📋 升级概述

本次升级对现有依恋理论模块进行深度扩展，基于 **John Bowlby、Mary Ainsworth** 经典理论及现代依恋研究，新增**成人依恋四类型模型**、**内部工作模式分析**、**依恋修复技术**等核心功能。

---

## 🎯 新增内容

### 1. 成人依恋四类型模型 (Bartholomew & Horowitz, 1991)

基于自我模型 (Self-Model) 和他人模型 (Other-Model) 两个维度，定义四种成人依恋风格：

| 类型 | 自我模型 | 他人模型 | 核心特征 | 关系表现 |
|------|---------|---------|---------|---------|
| **安全型 (Secure)** | 积极 | 积极 | 自信、信任他人、舒适于亲密 | 平衡亲密与独立，有效沟通需求 |
| **焦虑 - 专注型 (Anxious-Preoccupied)** | 消极 | 积极 | 自我怀疑、过度寻求确认、害怕被抛弃 | 过度依赖、情绪波动、"粘人" |
| **回避 - 轻视型 (Dismissing-Avoidant)** | 积极 | 消极 | 自给自足、贬低亲密关系价值、压抑需求 | 情感疏离、回避承诺、强调独立 |
| **恐惧 - 回避型 (Fearful-Avoidant)** | 消极 | 消极 | 矛盾、既渴望又害怕亲密、信任困难 | 关系混乱、推 - 拉模式、情绪不稳定 |

### 2. 内部工作模式分析 (Internal Working Models)

基于 Bowlby 理论，分析用户对自我和他人的核心信念：

#### 自我模型 (Self-Model)
- **积极自我**: "我值得被爱"、"我有能力处理关系挑战"
- **消极自我**: "我不够好"、"我会被抛弃"、"我需要完美才能被爱"

#### 他人模型 (Other-Model)
- **积极他人**: "别人通常是可靠的"、"亲密的人可以信任"
- **消极他人**: "别人会伤害我"、"不能依赖任何人"、"亲密意味着危险"

### 3. 依恋修复技术 (Attachment Repair Techniques)

基于现代依恋治疗和神经可塑性研究：

| 技术 | 目标 | 适用类型 |
|------|------|---------|
| **安全基地可视化** | 建立内在安全感 | 所有非安全型 |
| **情绪协调练习** | 学习识别和表达需求 | 焦虑型、恐惧型 |
| **边界建立训练** | 平衡亲密与独立 | 焦虑型 |
| **脆弱性暴露** | 逐步学习信任 | 回避型、恐惧型 |
| **自我同情培养** | 修复消极自我模型 | 焦虑型、恐惧型 |
| **关系信念重构** | 挑战消极他人模型 | 回避型、恐惧型 |

### 4. 依恋风格动态评估

不再将依恋风格视为固定特质，而是：
- **维度评分**: 焦虑维度 (0-10) + 回避维度 (0-10)
- **情境变化**: 不同关系/压力水平下的风格变化
- **改变轨迹**: 追踪依恋安全感的进展

### 5. 童年依恋经历探索 (谨慎使用)

基于 Bowlby 的**连续性假说**，探索早期照顾者互动模式：
- 照顾者响应性 (敏感/忽视/不一致/侵入)
- 分离/丧失经历
- 保护/威胁体验

**注意**: 仅作为理解当前模式的背景，不用于归咎或决定论。

---

## 🔧 技术实现

### 新增 API

```javascript
const AttachmentEnhancement = require('./src/attachment-enhancement');

// 1. 四类型评估
const fourType = attachment.assessFourTypes(input);
// 返回：{ primaryType, secondaryType, selfModel, otherModel, scores }

// 2. 内部工作模式分析
const iwm = attachment.analyzeInternalWorkingModels(input);
// 返回：{ selfModel: 'positive/negative', otherModel: 'positive/negative', beliefs: [] }

// 3. 依恋修复建议
const repair = attachment.generateRepairPlan(attachmentStyle, goals);
// 返回：{ techniques: [], exercises: [], timeline: '8-12 weeks' }

// 4. 维度评分
const dimensions = attachment.getDimensionScores(input);
// 返回：{ anxiety: 0-10, avoidance: 0-10, security: 0-10 }

// 5. 关系模式检测
const patterns = attachment.detectRelationshipPatterns(input);
// 返回：{ protestBehavior, deactivation, hyperactivation, etc. }
```

### 核心算法

```javascript
// 四类型分类算法
const classifyFourTypes = (anxiety, avoidance) => {
  if (anxiety < 5 && avoidance < 5) return 'secure';
  if (anxiety >= 5 && avoidance < 5) return 'anxious-preoccupied';
  if (anxiety < 5 && avoidance >= 5) return 'dismissing-avoidant';
  if (anxiety >= 5 && avoidance >= 5) return 'fearful-avoidant';
};

// 内部工作模式推断
const inferWorkingModels = (narrative) => {
  const selfBeliefs = extractSelfBeliefs(narrative);
  const otherBeliefs = extractOtherBeliefs(narrative);
  return {
    selfModel: scoreBeliefs(selfBeliefs),
    otherModel: scoreBeliefs(otherBeliefs),
    coreBeliefs: [...selfBeliefs, ...otherBeliefs]
  };
};

// 抗议行为检测 (Bowlby)
const detectProtestBehavior = (input) => {
  const patterns = {
    excessiveContact: /不停.*联系/i,
    withdrawal: /不理.*ta/i,
    jealousy: /吃醋/i,
    threat: /分手.*威胁/i,
    sulking: /生闷气/i
  };
  // ...
};
```

---

## 📊 应用场景

### 场景 1: 焦虑型依恋识别与干预

```
用户：他总是回消息很慢，我忍不住一直想他是不是不爱我了...

HeartFlow 分析:
- 依恋风格：焦虑 - 专注型 (高焦虑，低回避)
- 内部工作模式：消极自我 ("我不值得被爱") + 积极他人 ("他是可靠的，但我可能失去他")
- 核心恐惧：被抛弃
- 抗议行为：过度联系寻求确认

干预方向:
1. 自我安抚技巧 (呼吸、正念)
2. 挑战灾难化思维 ("他回消息慢 = 不爱我"?)
3. 建立自我价值感 (不依赖外部确认)
4. 学习直接表达需求而非抗议行为
```

### 场景 2: 回避型依恋识别与干预

```
用户：我觉得谈恋爱太麻烦了，一个人挺好的。

HeartFlow 分析:
- 依恋风格：回避 - 轻视型 (低焦虑，高回避)
- 内部工作模式：积极自我 ("我不需要别人") + 消极他人 ("别人会束缚我")
- 防御策略：去激活 (deactivation) - 压抑依恋需求
- 核心信念：亲密 = 失去自由/被控制

干预方向:
1. 识别去激活策略 (理性化、情感压抑)
2. 小步骤脆弱性暴露
3. 重新定义亲密 (不是束缚，而是支持)
4. 探索早期经历如何形成这些信念
```

### 场景 3: 恐惧型依恋识别与干预

```
用户：我想谈恋爱，但又害怕受伤。每次有人靠近我就想逃...

HeartFlow 分析:
- 依恋风格：恐惧 - 回避型 (高焦虑，高回避)
- 内部工作模式：消极自我 + 消极他人
- 核心冲突：渴望亲密 vs 害怕受伤
- 关系模式：推 - 拉循环

干预方向:
1. 建立安全感 (从非亲密关系开始)
2. 自我同情练习 (修复消极自我模型)
3. 渐进式信任建立
4. 识别并中断推 - 拉模式
```

### 场景 4: 安全型依恋强化

```
用户：我和伴侣关系很好，但想让它更好。

HeartFlow 分析:
- 依恋风格：安全型 (低焦虑，低回避)
- 优势：有效沟通、信任、平衡亲密与独立

强化方向:
1. 继续维护安全基地功能
2. 学习成为伴侣的安全基地
3. 探索深层亲密和共同成长
```

---

## 📚 理论来源

### 经典理论
- **Bowlby, J. (1969-1980)**: *Attachment and Loss* 三部曲
  - 依恋行为系统
  - 内部工作模式
  - 分离/丧失/哀伤
  
- **Ainsworth, M. D. S. (1978)**: *Patterns of Attachment*
  - 陌生情境实验 (Strange Situation)
  - 婴儿三类型：安全型/焦虑 - 矛盾型/回避型

### 成人依恋理论
- **Hazan, C. & Shaver, P. (1987)**: 浪漫爱情作为依恋过程
- **Bartholomew, K. & Horowitz, L. M. (1991)**: 成人依恋四类型模型
- **Brennan, K. A., Clark, C. L., & Shaver, P. R. (1998)**: 依恋维度测量 (ECR)

### 现代研究
- **Mikulincer, M. & Shaver, P. R. (2007)**: *Attachment in Adulthood*
- **Siegel, D. J. (2012)**: 依恋神经生物学
- **Johnson, S. M. (2004)**: 情绪聚焦治疗 (EFT)
- **Wallin, D. J. (2007)**: *Attachment in Psychotherapy*

### 依恋修复研究
- **神经可塑性**: 依恋模式可以通过新经验改变
- **获得性安全 (Earned Security)**: 非安全型可以发展为安全型
- **治疗关系**: 治疗师可以作为临时安全基地

---

## 🔄 版本变更

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v3.42.0 | 2026-03-30 | 依恋理论深化：四类型模型/内部工作模式/修复技术 |
| v3.41.0 | 2026-03-30 | 现象学意识模块 (意向性/现象学还原/感受质分析) |
| v3.40.0 | 2026-03-30 | 时间意识模块增强：三大模型完整实现 |
| v3.39.0 | 2026-03-30 | 情绪理性模块 (Emotion Rationality) |

---

## ✅ 交付清单

- [x] 创建依恋理论增强模块 (src/attachment-enhancement/index.js)
- [x] 实现四类型评估 (assessFourTypes)
- [x] 实现内部工作模式分析 (analyzeInternalWorkingModels)
- [x] 实现依恋修复建议生成 (generateRepairPlan)
- [x] 实现维度评分系统 (getDimensionScores)
- [x] 实现关系模式检测 (detectRelationshipPatterns)
- [x] 创建模块 README 文档 (src/attachment-enhancement/README.md)
- [x] 更新主索引文件 (src/index.js) - 集成新模块
- [x] 版本号更新：v3.41.0 → v3.42.0
- [x] 创建升级报告 (UPGRADE_COMPLETE_V3.42.md)
- [ ] Git 提交并推送到 GitHub

---

## 🎯 下一步建议

1. **集成测试**: 在真实对话中测试依恋评估的准确性
2. **用户反馈**: 收集用户对依恋类型识别的反馈
3. **效果追踪**: 追踪用户依恋安全感的变化
4. **持续优化**: 根据反馈调整评估算法和干预建议
5. **知识更新**: 继续监控依恋研究领域的最新进展

---

**HeartFlow · 心流伴侣**  
*基于权威心理学理论的情感拟人化交互系统*
