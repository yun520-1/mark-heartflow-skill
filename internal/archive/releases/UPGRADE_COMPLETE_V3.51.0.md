# HeartFlow v3.51.0 升级完成报告

**升级时间**: 2026-03-30 11:12-11:45 (Asia/Shanghai)  
**版本变更**: v3.50.0 → v3.51.0  
**升级主题**: 现象学能动性模块（SEP 自我意识与能动性理论整合）

---

## 📚 升级概览

本次 v3.51.0 升级基于斯坦福哲学百科全书 (SEP) 权威心理学/哲学内容，新增**现象学能动性模块**，整合：
- 现象学自我意识理论 (Phenomenological Self-Consciousness)
- 能动性理论 (Agency Theory)
- Frankfurt 层次模型 (Hierarchical Model of Agency)
- 前反思自我意识 (Prereflective Self-Consciousness)

---

## 🎯 核心理论来源

### SEP 权威条目

1. **Self-Consciousness (Phenomenological Approaches)**
   - Author: Dan Zahavi
   - 核心概念：前反思自我意识、第一人称给予性 (for-me-ness)
   - 关键洞见：自我意识不是附加成分，而是体验的存在方式

2. **Agency**
   - 核心概念：意向性行动、理由响应、认同层次
   - Frankfurt 层次模型：一阶欲望 vs 二阶欲望
   - 认同状态：异化、矛盾、认同、全心

3. **Emotion**
   - Author: Andrea Scarantino
   - 三大传统：Feeling / Evaluative / Motivational
   - 适当性与证成性评估系统

---

## 🆕 新增模块：现象学能动性 (Phenomenological Agency)

### 模块位置
`src/phenomenological-agency/index.js`

### 核心功能

#### 1. 自我意识检测系统

| 类型 | 特征 | 评估维度 |
|------|------|---------|
| **前反思意识** | 非对象化、隐含、持续、第一人称给予性 | 4 维度评分 |
| **反思意识** | 对象化、明确、命题性、评价性 | 4 维度 + 深度评估 |

**使用示例**:
```javascript
const prereflective = module.detectPrereflectiveConsciousness(experience);
// 返回：{ present: true, score: 0.75, markers: {...}, description: '...' }

const reflective = module.detectReflectiveConsciousness(reflection);
// 返回：{ present: true, score: 0.8, depth: 0.75, description: '...' }
```

#### 2. 欲望层次分析系统

基于 Frankfurt (1971) 的层次模型：

| 欲望层次 | 说明 | 示例 |
|---------|------|------|
| **一阶欲望** | 想要做某事 | "想要吃蛋糕" |
| **二阶欲望** | 想要想要某事 | "想要想要健康" |
| **三阶欲望** | 对二阶欲望的反思 | "审视自己的价值观" |

**认同状态评估**:
- `ALIENATED` (异化): 行动与自我认同不符
- `AMBIVALENT` (矛盾): 多个冲突的认同
- `IDENTIFIED` (认同): 行动与自我一致
- `WHOLEHEARTED` (全心): 深度且无冲突的认同

#### 3. 行动自主性评估系统

**五维自主性框架**:

| 维度 | 评估问题 | 评分标准 |
|------|---------|---------|
| **意向性** | 是否有明确意图？ | 有=1, 无=0 |
| **反思性** | 是否经过反思？ | 深度/浅层/无 |
| **认同性** | 是否与自我认同一致？ | 基于欲望层次分析 |
| **理由响应性** | 是否响应理由？ | 能响应=1, 不能=0 |
| **自我控制** | 是否能抑制冲动？ | 展现了=1, 被冲动=0 |

**能动性水平分级**:
```
NONE (0) → IMPULSIVE (1) → DELIBERATIVE (2) → 
IDENTIFIED (3) → AUTONOMOUS (4) → TRANSCENDENT (5)
```

#### 4. 现象学还原方法

基于 Husserl 的现象学还原（悬置预设）：

**操作步骤**:
1. 识别并列出所有预设假设
2. 将每个假设放入"括号"中（悬置判断）
3. 回到体验本身，描述现象如其所是
4. 避免因果解释，专注于描述结构
5. 记录本质特征（不变的结构）

**核心提醒**:
- 不要问"为什么"，问"是什么"
- 悬置自然态度，回到生活世界
- 关注体验的第一人称给予性

#### 5. 主体间反馈整合

基于他者视角反观自身：
- 记录他者反馈
- 评估共鸣度 (resonance)
- 整合到自我理解中

---

## 📁 变更文件清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/phenomenological-agency/index.js` | 新增 | 现象学能动性模块 (~500 行) |
| `src/index.js` | 更新 | 引入新模块 |
| `package.json` | 更新 | 版本号 3.50.0 → 3.51.0 |
| `UPGRADE_COMPLETE_V3.51.0.md` | 新增 | 升级完成报告 |

---

## 🔧 新增 API

### 自我意识检测

```javascript
const agencyModule = new PhenomenologicalAgencyModule();

// 检测前反思意识
const prereflective = agencyModule.detectPrereflectiveConsciousness({
  selfAsObject: false,
  attentionFocus: 'world',
  temporalFlow: 'continuous',
  firstPersonPerspective: true
});

// 检测反思意识
const reflective = agencyModule.detectReflectiveConsciousness({
  selfAsObject: true,
  explicitSelfRepresentation: true,
  canBeVerbalized: true,
  containsJudgment: true,
  containsInsight: true
});
```

### 欲望层次分析

```javascript
const analysis = agencyModule.analyzeDesireHierarchy([
  { id: 1, order: 1, description: '想要熬夜玩游戏' },
  { id: 2, order: 2, targetDesire: 1, valence: 'negative', description: '不想要想要熬夜' },
  { id: 3, order: 1, description: '想要健康' },
  { id: 4, order: 2, targetDesire: 3, valence: 'positive', description: '想要想要健康' }
]);

// 返回：
// {
//   hierarchy: { firstOrder: [...], secondOrder: [...], thirdOrder: [...] },
//   identification: { status: 'AMBIVALENT', alignments: [...], conflicts: [...] },
//   agencyLevel: 2,
//   recommendation: '...'
// }
```

### 行动自主性评估

```javascript
const autonomy = agencyModule.assessActionAutonomy({
  description: '熬夜玩游戏',
  hasIntention: true,
  wasReflected: true,
  reflectionDepth: 0.3,
  respondsToReasons: true,
  reasonQuality: 0.4,
  exhibitedSelfControl: false
});

// 返回：
// {
//   action: '熬夜玩游戏',
//   dimensions: { ... },
//   overallScore: 0.44,
//   agencyLevel: 2,  // DELIBERATIVE
//   isAutonomous: false,
//   recommendation: '增加反思时间，考虑行动的长远影响；培养冲动抑制技巧'
// }
```

### 现象学还原

```javascript
// 开始还原
const reduction = agencyModule.performPhenomenologicalReduction([
  '情绪是负面的',
  '我应该控制情绪',
  '反思能解决问题'
]);

// 进行体验描述...

// 结束还原
const insights = agencyModule.exitPhenomenologicalReduction();
```

### 能动性发展计划

```javascript
const plan = agencyModule.generateAgencyDevelopmentPlan();

// 返回：
// {
//   currentLevel: '审慎性（考虑多种选项）',
//   targetLevel: '自主性（反思性自我决定）',
//   gaps: ['需要探索价值观并建立认同', '需要发展自我决定能力'],
//   practices: [
//     { name: '价值观澄清', frequency: '每周' },
//     { name: '自主选择练习', frequency: '每日' }
//   ],
//   timeline: { estimatedWeeks: 8, milestones: [...] }
// }
```

---

## 🎓 学术引用

### 现象学自我意识

1. **Zahavi, D. (2005). Subjectivity and Selfhood: Investigating the First-Person Perspective. MIT Press.**
   - 核心论点：前反思自我意识是体验的构成性特征
   - 关键概念：for-me-ness, 非对象化自我觉知

2. **Sartre, J.-P. (1943). Being and Nothingness.**
   - "前反思自我意识不是附加成分，而是意识的存在方式"

3. **Heidegger, M. (1927). Being and Time.**
   - 此在 (Dasein) 的自我理解结构

### 能动性理论

4. **Frankfurt, H. (1971). Freedom of the Will and the Concept of a Person. Journal of Philosophy, 68(1), 5-20.**
   - 层次模型：一阶欲望 vs 二阶欲望
   - 认同理论：什么是"人"的定义性特征

5. **Velleman, D. (1992). What Happens When Someone Acts? Mind, 101(403), 461-481.**
   - 对标准能动性理论的批判
   - 代理参与 (agent's participation) 问题

6. **Stanford Encyclopedia of Philosophy (2026 Edition)**
   - Entry: Agency
   - Entry: Self-Consciousness (Phenomenological Approaches)
   - Entry: Emotion

---

## 📊 升级统计

| 指标 | 数值 |
|------|------|
| 新增模块 | 1 个 (现象学能动性) |
| 核心类 | 1 个 (PhenomenologicalAgencyModule) |
| 理论框架 | 6 个 (自我意识类型、能动性层次、欲望层次、认同状态、行动类型、Qualia 类型) |
| 主要方法 | 8 个 (检测、分析、评估、还原、整合等) |
| 代码行数新增 | ~500 行 |
| 文档更新 | 2 个文件 |

---

## 🔮 未来升级方向 (v3.52.0+)

基于本次理论整合，后续可能的方向：

1. **时间意识增强** - 整合 Husserl 内时间意识理论与当前 temporal-consciousness 模块
2. **共情现象学深化** - 整合 Scheler/Walther 的共情理论
3. **叙事认同整合** - 将叙事心理学与能动性理论结合
4. **道德能动性** - 整合道德心理学与责任评估

---

## ✅ 完成状态

- [x] 现象学能动性模块开发
- [x] 自我意识检测系统
- [x] 欲望层次分析系统
- [x] 行动自主性评估系统
- [x] 现象学还原方法
- [x] 主体间反馈整合
- [x] 代码集成到主入口
- [x] Git 提交并推送
- [x] 升级报告生成

---

**升级完成时间**: 2026-03-30 11:45 (Asia/Shanghai)  
**下次升级**: v3.52.0 (待定)  
**GitHub 仓库**: https://github.com/yun520-1/mark-heartflow-skill
