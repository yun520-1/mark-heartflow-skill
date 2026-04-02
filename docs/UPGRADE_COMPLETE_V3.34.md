# HeartFlow v3.34.0 升级完成报告

**升级时间**: 2026-03-30 05:12 AM (Asia/Shanghai)  
**升级类型**: 小版本升级  
**升级来源**: SEP Agency 理论 + 经典行动哲学

---

## 🎯 本次升级目标

基于 Stanford Encyclopedia of Philosophy (SEP) Agency 理论，完整整合五种能动性概念，增强 HeartFlow 对行动、决策、意图和实践推理的理解能力。

---

## ✨ 新增模块

### 自由意志与能动性增强模块 (Free Will & Agency Enhanced) v3.34.0

**理论来源**:
- SEP: Agency (https://plato.stanford.edu/entries/agency/)
- Anscombe (1957): Intention
- Davidson (1963): Actions, Reasons, and Causes
- Frankfurt (1971): Freedom of the Will and the Concept of a Person
- Bratman (1987): Intention, Plans, and Practical Reason
- Ginet (1990): On Action
- Velleman (1992): What Happens When Someone Acts?

**核心理念**:
能动性不是单一概念，而是包含五种不同但互补的概念。每种概念捕捉了人类行动的不同维度，在不同情境下各有优势。

---

## 📚 五种能动性概念

### 1. 标准能动性 (Standard Agency)
**代表**: Anscombe, Davidson  
**核心**: 意向性行动 + 行动理由  
**结构**: 实践三段论（大前提：目标，小前提：手段，结论：行动）  
**应用**: 日常理性决策、理由澄清  
**局限**: 无法解释自发性行动、习惯性行动

### 2. 发起能动性 (Initiation Agency)
**代表**: Ginet, O'Connor, Lowe  
**核心**: 行动由行动者自发发起  
**类型**: 主体因果论、非因果论、意志行动  
**应用**: 创造性灵感、直觉决策、自发行动  
**价值**: 培养直觉信任、接纳自发性

### 3. 层级能动性 (Hierarchical Agency)
**代表**: Frankfurt, Taylor  
**核心**: 反思性认同，二阶欲望  
**结构**: 一阶欲望 → 二阶欲望 → 认同  
**应用**: 意志薄弱、成瘾冲突、价值观整合  
**练习**: 欲望层级探索、认同练习

### 4. 计划能动性 (Plan Agency)
**代表**: Bratman  
**核心**: 计划在实践推理中的核心作用  
**特征**: 意图的稳定性、一致性、手段 - 目的连贯性  
**应用**: 长期目标、跨时间协调、合作承诺  
**练习**: 计划一致性检查、手段 - 目的分析

### 5. 现象学能动性 (Phenomenological Agency)
**代表**: Velleman, Proust  
**核心**: 行动者的参与感和所有权感  
**特征**: 努力感、控制感、所有权感、目的感  
**应用**: 流畅体验、异化体验、真实性探索  
**练习**: 能动性现象学觉察、真实性探索

---

## 🔧 核心功能

### 1. 能动性状态评估
```javascript
const assessment = FreeWillAgencyEnhanced.assessments.assessAgencyState({
  decisionType: 'life',
  hasReflection: true,
  hasPlan: true,
  hasSpontaneity: false,
  hasAlignment: true,
  hasPhenomenology: true
});
// 输出：主导能动性类型、各维度评分、个性化建议
```

### 2. 实践推理工具
- **实践三段论**: 亚里士多德式行动推理结构
- **意图层级分析**: 从具体行动到根本动机的多层级探索
- **有效性检查**: 评估实践推理的合理性

### 3. 个性化练习推荐
- 根据评估结果推荐专属练习
- 每种能动性类型配有 2-3 个核心练习
- 提供整合建议

---

## 📊 评估维度

| 维度 | 描述 | 评分标准 |
|------|------|---------|
| 标准能动性 | 基于明确理由的理性决策 | 理由清晰度、理由 - 行动一致性 |
| 发起能动性 | 自发性和直觉信任 | 自发性、直觉准确度 |
| 层级能动性 | 反思性认同和价值观整合 | 反思深度、欲望层级整合度 |
| 计划能动性 | 长期规划和意图稳定性 | 计划清晰度、意图一致性 |
| 现象学能动性 | 行动的内在体验质量 | 控制感、所有权感、真实感 |

---

## 🎯 应用场景

### 1. 决策困难
- 识别当前使用的能动性模式
- 评估是否有更合适的模式
- 整合理性与直觉

### 2. 价值观冲突
- 识别一阶欲望与二阶欲望的冲突
- 探索真正的认同
- 制定整合策略

### 3. 长期规划
- 检查意图一致性
- 进行手段 - 目的分析
- 保持计划的稳定性与灵活性

### 4. 真实性探索
- 觉察行动的现象学质量
- 识别真实性的条件
- 培养更真实的行动方式

---

## 🧩 模块整合

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

## 📈 版本升级

| 版本 | 日期 | 内容 |
|------|------|------|
| v3.33.0 | 2026-03-30 | 预测加工与情绪模块 |
| **v3.34.0** | **2026-03-30** | **自由意志与能动性增强模块** |

---

## 📚 关键理论贡献

### 实践三段论 (Practical Syllogism)
```
大前提：我想要 X (目标/欲望)
小前提：做 Y 可以实现 X (信念/手段)
结论：因此我做 Y (行动)
```

### 二阶欲望理论 (Second-Order Desires)
- **一阶欲望**: 对目标或行动的直接欲望
- **二阶欲望**: 关于一阶欲望的欲望
- **认同**: 当人想要被某个一阶欲望驱动时，就与该欲望认同

### 意图的稳定性 (Intention Stability)
- **稳定性**: 意图抵抗随意改变
- **一致性**: 意图之间应保持一致
- **手段 - 目的连贯性**: 意图推动寻找实现手段

---

## ✅ 交付物

- [x] 新模块代码：`src/free-will-agency-enhanced/index.js`
- [x] 模块文档：`src/free-will-agency-enhanced/README.md`
- [x] 模块配置：`src/free-will-agency-enhanced/package.json`
- [x] 版本更新：`package.json` v3.33.0 → v3.34.0
- [x] 升级报告：`UPGRADE_COMPLETE_V3.34.md`

---

## 🚀 下一步

1. **测试新模块**: 验证评估和练习功能
2. **整合到主入口**: 在 `src/index.js` 中注册新模块
3. **用户文档**: 更新主 README 说明新功能
4. **Git 推送**: 提交并推送到 GitHub 仓库

---

## 📖 参考文献

1. SEP: Agency - https://plato.stanford.edu/entries/agency/
2. Anscombe, G. E. M. (1957). *Intention*. Blackwell.
3. Davidson, D. (1963). "Actions, Reasons, and Causes". *Journal of Philosophy*.
4. Frankfurt, H. (1971). "Freedom of the Will and the Concept of a Person". *Journal of Philosophy*.
5. Bratman, M. (1987). *Intention, Plans, and Practical Reason*. Harvard University Press.
6. Ginet, C. (1990). *On Action*. Cambridge University Press.
7. Velleman, J. D. (1992). "What Happens When Someone Acts?". *Mind*.
