# 自由意志与能动性模块 (Free Will & Agency Module)

**版本**: 3.29.0  
**理论来源**: Stanford Encyclopedia of Philosophy (SEP)  
**创建时间**: 2026-03-30

---

## 📚 理论基础

### 核心理论来源

1. **SEP: Agency** (https://plato.stanford.edu/entries/agency/)
   - 标准能动性理论（Anscombe, Davidson）
   - 发起能动性理论（Ginet, O'Connor）
   - 层级能动性理论（Frankfurt, Taylor）
   - 计划能动性理论（Bratman）
   - 现象学能动性理论（Velleman）

2. **SEP: Free Will** (https://plato.stanford.edu/entries/free-will/)
   - 相容论与不相容论
   - 主体因果论与原因因果论
   - 自由意志怀疑论

3. **经典文献**:
   - Frankfurt, H. (1971). "Freedom of the Will and the Concept of a Person"
   - Bratman, M. (1987). "Intention, Plans, and Practical Reason"
   - Anscombe, G. E. M. (1957). "Intention"
   - Davidson, D. (1963). "Actions, Reasons, and Causes"

---

## 🎯 核心概念

### 1. 能动性类型 (Types of Agency)

| 类型 | 描述 | 应用场景 |
|------|------|---------|
| **标准能动性** | 基于意向的行动 | 日常决策与行动 |
| **发起能动性** | 强调行动的自发性 | 创造性行动、直觉决策 |
| **层级能动性** | 反思性认同 | 价值观冲突、身份认同 |
| **计划能动性** | 长期规划 | 目标设定、人生规划 |
| **现象学能动性** | 主体参与感 | 自我认同、真实性探索 |

### 2. 意向性层次 (Levels of Intentionality)

```
0 - NONE (无意向)          → 纯粹反应
1 - PRE_INTENTIONAL        → 倾向性
2 - INTENTIONAL            → 有意识的目标
3 - REFLECTIVE             → 经过深思熟虑
4 - COMMITTED              → 长期承诺
```

### 3. 实践推理结构 (Practical Reasoning Structure)

#### 亚里士多德实践三段论
```
大前提：我想要 X (目标/欲望)
小前提：做 Y 可以实现 X (信念/手段)
结论：我将做 Y (行动)
```

#### Bratman 计划结构
```
远端意向 (Distal) → 近端意向 (Proximal) → 运动意向 (Motor)
   长期目标           即将执行的计划        具体动作
```

### 4. Frankfurt 层级意志模型

```
一阶欲望 (First-Order Desire)    → "我想吃蛋糕"
二阶欲望 (Second-Order Desire)   → "我希望我不这么想吃蛋糕"
二阶意志 (Second-Order Volition) → "我想让我的健康欲望成为我的意志"
认同 (Identification)            → "我认同健康的自己"
任性 (Wanton)                    → 没有二阶意志的存在
```

**自由意志的关键**: 不在于能否做想做的事，而在于能否与自己的欲望认同。

---

## 🔧 功能特性

### 1. 实践推理分析

分析用户的行动理由结构：
- 目标清晰度检测
- 手段可行性评估
- 意向强度测量
- 冲突识别

**示例对话**:
```
用户：我想减肥，但总是控制不住自己吃东西。

HeartFlow 分析:
✓ 检测到目标："我想减肥"
✓ 检测到冲突："但总是控制不住"
✗ 未检测到明确手段
✗ 未检测到坚定意向

指导方向:
1. 澄清目标的具体内容
2. 探索可行的方法
3. 处理内在冲突
```

### 2. 层级意志分析

分析用户的一阶欲望与二阶欲望之间的关系：
- 识别欲望层次
- 检测层次间冲突
- 评估认同状态
- 测量自主性水平

**示例对话**:
```
用户：我想熬夜玩游戏，但我又希望自己能早睡。

HeartFlow 分析:
一阶欲望："我想熬夜玩游戏"
二阶欲望："我希望自己能早睡"
冲突检测：✓ 存在层次间冲突
自主性水平：中等（有二阶反思但未形成认同）

指导方向:
1. 探索用户真正认同的是什么
2. 理解冲突背后的价值观
3. 促进整合性决策
```

### 3. 能动性评估

评估用户的能动性状态：
- 识别能动性障碍（"我不能"、"我必须"、"没办法"）
- 识别能动性优势（"我选择"、"我决定"、"我可以"）
- 自我决定理论三要素评估（自主性、能力感、关系性）
- 生成个性化建议

### 4. 自主性发展指导

基于 SDT 自我决定理论：
- **自主性 (Autonomy)**: 帮助识别可选择的空间
- **能力感 (Competence)**: 回顾成功经验，建立自信
- **关系性 (Relatedness)**: 探索社会支持与连接

---

## 💡 使用示例

### 命令行使用

```bash
cd mark-heartflow-skill
node src/index.js

# 进入后输入
/agency
```

### 代码调用

```javascript
const { FreeWillAgencyModule } = require('./src/free-will-agency');

const agency = new FreeWillAgencyModule();

// 与实践推理交互
const reasoningResponse = agency.interactWithPracticalSyllogism(
  '我想开始锻炼，但总是找不到时间'
);
console.log(reasoningResponse.guidance);

// 层级意志分析
const hierarchicalAnalysis = agency.analyzeHierarchicalWill(
  '我想吃健康的食物，但我又忍不住想吃垃圾食品'
);
console.log(hierarchicalAnalysis.conflicts);

// 能动性评估
const assessment = agency.assessAgencyState(
  '我必须完成这个项目，但我真的做不到'
);
console.log(assessment.barriers);
console.log(assessment.recommendations);

// 完整交互
const fullResponse = agency.interact(
  '我想改变我的生活，但不知道从哪里开始'
);
console.log(fullResponse.integratedGuidance);
```

---

## 🧠 可操作练习

### 练习 1: 实践推理澄清 (15-20 分钟)

**目标**: 澄清行动的理由结构

**步骤**:
1. 写下你想要实现的目标（大前提）
2. 列出可能实现目标的方法（小前提）
3. 评估每种方法的可行性
4. 做出选择并承诺行动（结论）

**反思问题**:
- 这个目标对你来说为什么重要？
- 你愿意为实现它付出什么代价？
- 什么因素可能阻碍你？如何应对？

### 练习 2: 层级意志探索 (20-30 分钟)

**目标**: 探索不同层次的欲望，找到真正的认同

**步骤**:
1. 列出你当前的一阶欲望（"我想..."）
2. 对每个欲望问："我对这个欲望本身有什么看法？"
3. 识别二阶欲望（"我希望我想/不想..."）
4. 探索你真正认同的是什么
5. 制定与认同一致的行动计划

**反思问题**:
- 哪个欲望更代表"真正的你"？
- 冲突背后的价值观是什么？
- 如何整合这些冲突？

### 练习 3: 能动性障碍识别 (10-15 分钟)

**目标**: 识别并重构能动性障碍

**步骤**:
1. 记录你使用的语言模式
2. 识别"我不能"、"我必须"、"我不得不"等表达
3. 尝试重构为"我选择"、"我决定"、"我可以"
4. 探索重构后的感受

**示例重构**:
- "我必须完成这个报告" → "我选择完成这个报告，因为..."
- "我不能拒绝别人" → "我目前选择不拒绝，因为..."
- "我没办法改变" → "我还没有找到改变的方法"

### 练习 4: 承诺阶梯 (15-20 分钟)

**目标**: 从意向到承诺的进阶

**步骤**:
1. 在 1-10 尺度上评估你对某行动的承诺程度
2. 如果低于 7，探索是什么降低了承诺
3. 设想承诺度提高 1 分会是什么样子
4. 制定提升承诺的具体步骤

---

## 📊 评估工具

### 能动性状态评估

评估维度:
- 意向性水平 (0-4)
- 自主性 (0-1)
- 能力感 (0-1)
- 关系性 (0-1)
- 承诺强度 (0-1)

### 实践推理质量评估

评估维度:
- 目标清晰度
- 手段可行性
- 意向强度
- 冲突解决程度

### 层级意志整合度评估

评估维度:
- 一阶 - 二阶欲望一致性
- 认同清晰度
- 自主性水平
- 内在冲突程度

---

## 🔗 与其他模块的关系

| 相关模块 | 关系描述 |
|---------|---------|
| **自主感情 (v3.7.0)** | 共享自我意识与反思能力 |
| **叙事心理学 (v3.27.0)** | 能动性是生命故事的核心主题 |
| **时间意识 (v3.28.0)** | 计划能动性依赖时间视野 |
| **SDT 自我决定理论** | 共享自主性、能力感、关系性三要素 |
| **ACT 疗法** | 共享价值导向行动理念 |

---

## 📝 理论精华提取

### 从 SEP Agency 理论提取的可操作元素

| 理论概念 | 代码实现 | 应用场景 |
|---------|---------|---------|
| 标准能动性 | `AgencyTypes.STANDARD` | 日常决策分析 |
| 发起能动性 | `AgencyTypes.INITIATION` | 创造性行动支持 |
| 层级能动性 | `AgencyTypes.HIERARCHICAL` | 价值观冲突处理 |
| 计划能动性 | `AgencyTypes.PLANNING` | 长期目标规划 |
| 实践三段论 | `PracticalReasoningStructure.SYLLOGISM` | 行动理由分析 |
| 计划结构 | `PracticalReasoningStructure.PLANNING` | 计划分解 |
| Frankfurt 层级意志 | `HierarchicalWillModel` | 欲望冲突探索 |
| 主体参与感 | `AgencyTypes.PHENOMENOLOGICAL` | 真实性探索 |

---

## 🚀 升级统计

| 指标 | 数值 |
|------|------|
| 新增模块数 | 1 |
| 新增代码行数 | ~550 行 |
| 新增练习数 | 4 个 |
| 新增评估工具 | 3 个 |
| 理论来源 | SEP 2 个条目 + 4 篇经典文献 |
| 文档更新 | 2 个文件 |

---

## 📌 下一步计划

根据 SEP 权威理论，建议后续升级方向：

1. **道德心理学模块** - 基于 SEP Moral Psychology 和 Moral Cognition
2. **集体能动性深化** - 扩展集体意向性到能动性领域
3. **责任理论整合** - 基于 SEP Responsibility 理论
4. **跨文化能动性** - 整合不同文化的能动性理解方式

---

**模块完成时间**: 2026-03-30  
**版本**: v3.29.0  
**作者**: HeartFlow Team
