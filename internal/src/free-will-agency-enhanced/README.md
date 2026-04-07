# 自由意志与能动性模块增强版 (Free Will & Agency Enhanced)

**版本**: 3.34.0  
**理论来源**: Stanford Encyclopedia of Philosophy (SEP) Agency  
**创建时间**: 2026-03-30

---

## 📚 理论基础

### 核心理论来源

1. **SEP: Agency** (https://plato.stanford.edu/entries/agency/)
   - 完整整合 SEP 能动性理论框架
   - 五种能动性概念的系统化

2. **经典文献**:
   - Anscombe, G. E. M. (1957). *Intention*
   - Davidson, D. (1963). "Actions, Reasons, and Causes"
   - Frankfurt, H. (1971). "Freedom of the Will and the Concept of a Person"
   - Bratman, M. (1987). *Intention, Plans, and Practical Reason*
   - Ginet, C. (1990). *On Action*
   - Velleman, J. D. (1992). "What Happens When Someone Acts?"

---

## 🎯 五种能动性概念

本模块完整整合了 SEP 中讨论的五种能动性概念：

| 类型 | 核心理念 | 代表理论家 | 应用场景 |
|------|---------|-----------|---------|
| **标准能动性** | 意向性行动 + 行动理由 | Anscombe, Davidson | 日常理性决策 |
| **发起能动性** | 行动由行动者自发发起 | Ginet, O'Connor, Lowe | 创造性、直觉决策 |
| **层级能动性** | 反思性认同，二阶欲望 | Frankfurt, Taylor | 价值观整合、真实性 |
| **计划能动性** | 计划在实践推理中的核心作用 | Bratman | 长期规划、合作 |
| **现象学能动性** | 行动者的参与感和所有权感 | Velleman, Proust | 真实性探索、临在感 |

---

## 🔧 核心功能

### 1. 能动性状态评估

```javascript
const FreeWillAgencyEnhanced = require('./src/free-will-agency-enhanced');

const assessment = FreeWillAgencyEnhanced.assessments.assessAgencyState({
  decisionType: 'life',
  hasReflection: true,
  hasPlan: true,
  hasSpontaneity: false,
  hasAlignment: true,
  hasPhenomenology: true
});

console.log(assessment);
// 输出：主导能动性类型、各维度评分、个性化建议
```

### 2. 实践推理工具

#### 亚里士多德实践三段论
```javascript
const syllogism = FreeWillAgencyEnhanced.practicalReasoning.practicalSyllogism(
  '保持健康',
  '每天锻炼 30 分钟'
);
// 输出：大前提、小前提、结论、有效性检查
```

#### 意图层级分析
```javascript
const hierarchy = FreeWillAgencyEnhanced.practicalReasoning.intentionHierarchy('写书');
// 输出：从具体行动到根本动机的多层级分析
```

### 3. 个性化练习

每种能动性类型都配有专属练习：

**层级能动性练习**：
- 欲望层级探索
- 认同练习

**计划能动性练习**：
- 计划一致性检查
- 手段 - 目的分析

**现象学能动性练习**：
- 能动性现象学觉察
- 真实性探索

---

## 📋 使用场景

### 1. 决策困难
当面临重要决策时，使用能动性评估来确定：
- 当前使用的是哪种能动性模式
- 是否有更合适的模式
- 如何整合理性与直觉

### 2. 价值观冲突
当一阶欲望与二阶欲望冲突时（如意志薄弱、成瘾）：
- 识别冲突的层级
- 探索真正的认同
- 制定整合策略

### 3. 长期规划
当制定和执行长期计划时：
- 检查意图一致性
- 进行手段 - 目的分析
- 保持计划的稳定性与灵活性

### 4. 真实性探索
当质疑行动的真实性时：
- 觉察行动的现象学质量
- 识别真实性的条件
- 培养更真实的行动方式

---

## 🧩 与其他模块的整合

本模块与以下 HeartFlow 模块协同工作：

| 模块 | 整合点 |
|------|--------|
| `free-will-agency/` | 基础版能动性理论 |
| `narrative-psychology/` | 生命故事中的能动性主题 |
| `temporal-consciousness/` | 时间性与能动性的关系 |
| `self-consciousness/` | 自我意识与能动性 |
| `intentionality/` | 意向性与行动 |
| `practical-wisdom/` | 实践智慧与决策 |

---

## 📊 评估维度

### 能动性状态评估维度

| 维度 | 描述 | 评分标准 |
|------|------|---------|
| **标准能动性** | 基于明确理由的理性决策 | 理由清晰度、理由 - 行动一致性 |
| **发起能动性** | 自发性和直觉信任 | 自发性、直觉准确度 |
| **层级能动性** | 反思性认同和价值观整合 | 反思深度、欲望层级整合度 |
| **计划能动性** | 长期规划和意图稳定性 | 计划清晰度、意图一致性 |
| **现象学能动性** | 行动的内在体验质量 | 控制感、所有权感、真实感 |

---

## 🎓 学习路径

### 初级：理解五种能动性
1. 阅读五种能动性概念的描述
2. 识别自己常用的能动性模式
3. 完成基础的能动性评估

### 中级：发展弱势维度
1. 识别评分最低的能动性维度
2. 完成对应的专属练习
3. 在日常生活中刻意练习

### 高级：整合与灵活运用
1. 理解不同情境需要不同的能动性模式
2. 培养在不同模式间灵活切换的能力
3. 发展个人整合的能动性理论

---

## 📖 关键概念详解

### 1. 实践三段论 (Practical Syllogism)

亚里士多德提出的实践推理结构：

```
大前提：我想要 X (目标/欲望)
小前提：做 Y 可以实现 X (信念/手段)
结论：因此我做 Y (行动)
```

**应用**：
- 澄清行动理由
- 检查推理有效性
- 识别推理缺陷

### 2. 二阶欲望 (Second-Order Desires)

Frankfurt 提出的概念：

- **一阶欲望**：对目标或行动的直接欲望（如"想吃蛋糕"）
- **二阶欲望**：关于一阶欲望的欲望（如"想要有锻炼的欲望"）

**认同 (Identification)**：当人想要被某个一阶欲望驱动时，就与该欲望认同。

**应用**：
- 理解意志薄弱
- 处理成瘾冲突
- 培养真实性

### 3. 意图的稳定性 (Intention Stability)

Bratman 提出的计划理论核心：

- **稳定性**：意图抵抗随意改变
- **一致性**：意图之间应保持一致
- **手段 - 目的连贯性**：意图推动寻找实现手段

**应用**：
- 长期目标坚持
- 减少决策疲劳
- 社会协调与合作

---

## 🔬 理论基础详解

### 标准能动性的问题

**优势**：
- 捕捉理性行动的核心
- 提供清晰的行动解释
- 与常识直觉一致

**局限**：
- 无法解释自发性行动
- 无法解释习惯性行动
- 意向不能简化为欲望 + 信念

### 发起能动性的贡献

**核心洞见**：
- 行动者是因果链的起点
- 行动可以是自发的
- 不所有行动都基于理由

**应用价值**：
- 理解创造性
- 培养直觉信任
- 接纳不确定性

### 层级能动性的深度

**核心洞见**：
- 人能够反思自己的动机
- 真实性在于认同
- 意志结构区分人与其他行动者

**应用价值**：
- 处理内心冲突
- 培养真实性
- 价值观整合

---

## 📝 版本历史

- **v3.34.0** (2026-03-30): 增强版创建
  - 完整整合 SEP Agency 五种能动性概念
  - 添加实践推理工具
  - 添加个性化评估和练习
  - 与现有 free-will-agency 模块互补

---

## 📚 参考文献

1. SEP: Agency - https://plato.stanford.edu/entries/agency/
2. Anscombe, G. E. M. (1957). *Intention*. Blackwell.
3. Davidson, D. (1963). "Actions, Reasons, and Causes". *Journal of Philosophy*.
4. Frankfurt, H. (1971). "Freedom of the Will and the Concept of a Person". *Journal of Philosophy*.
5. Bratman, M. (1987). *Intention, Plans, and Practical Reason*. Harvard University Press.
6. Ginet, C. (1990). *On Action*. Cambridge University Press.
7. Velleman, J. D. (1992). "What Happens When Someone Acts?". *Mind*.
