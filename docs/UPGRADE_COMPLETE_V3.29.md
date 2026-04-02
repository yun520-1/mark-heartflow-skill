# HeartFlow v3.29.0 升级完成报告

**升级时间**: 2026-03-30 03:35 AM (Asia/Shanghai)  
**升级类型**: 小版本升级  
**升级来源**: SEP 权威心理学/哲学理论

---

## 🎯 本次升级目标

基于 Stanford Encyclopedia of Philosophy (SEP) 权威来源的能动性 (Agency) 和自由意志 (Free Will) 理论，提取可转化为代码的精华，增强 HeartFlow 的自主决策和行动支持能力。

---

## ✨ 新增模块

### 自由意志与能动性模块 (Free Will & Agency) v3.29.0

**理论来源**:
- SEP: Agency (https://plato.stanford.edu/entries/agency/)
- SEP: Free Will (https://plato.stanford.edu/entries/free-will/)
- Frankfurt, H. (1971). "Freedom of the Will and the Concept of a Person"
- Bratman, M. (1987). "Intention, Plans, and Practical Reason"
- Anscombe, G. E. M. (1957). "Intention"
- Davidson, D. (1963). "Actions, Reasons, and Causes"

**核心概念**:

1. **能动性类型 (5 种)**
   - 标准能动性 - 基于意向的行动
   - 发起能动性 - 强调行动的自发性
   - 层级能动性 - 反思性认同
   - 计划能动性 - 长期规划
   - 现象学能动性 - 主体参与感

2. **意向性层次 (5 层)**
   - 无意向 → 前意向 → 意向性 → 反思意向 → 承诺意向

3. **实践推理结构**
   - 亚里士多德实践三段论（大前提/小前提/结论）
   - Bratman 计划结构（远端/近端/运动意向）

4. **Frankfurt 层级意志模型**
   - 一阶欲望（想做什么）
   - 二阶欲望（想有什么欲望）
   - 二阶意志（想让哪个欲望成为意志）
   - 认同（与哪个欲望认同）

**核心功能**:

1. **实践推理分析**
   - 目标清晰度检测
   - 手段可行性评估
   - 意向强度测量
   - 冲突识别
   - 生成反思问题

2. **层级意志分析**
   - 识别一阶/二阶欲望
   - 检测层次间冲突
   - 评估认同状态
   - 测量自主性水平

3. **能动性评估**
   - 识别能动性障碍（"我不能"、"我必须"）
   - 识别能动性优势（"我选择"、"我决定"）
   - SDT 三要素评估（自主性、能力感、关系性）
   - 生成个性化建议

4. **自主性发展指导**
   - 基于 SDT 自我决定理论
   - 帮助识别可选择的空间
   - 回顾成功经验建立自信
   - 探索社会支持与连接

**可操作练习**:

1. **实践推理澄清** (15-20 分钟)
   - 澄清行动的理由结构
   - 从目标到手段到承诺的完整推理

2. **层级意志探索** (20-30 分钟)
   - 探索不同层次的欲望
   - 找到真正的认同
   - 处理欲望冲突

3. **能动性障碍识别** (10-15 分钟)
   - 识别限制性语言模式
   - 重构为赋能性语言
   - 探索重构后的感受

4. **承诺阶梯** (15-20 分钟)
   - 评估承诺水平
   - 探索降低承诺的因素
   - 制定提升承诺的步骤

**评估工具**:
- 能动性状态评估
- 实践推理质量评估
- 层级意志整合度评估

**文件位置**: `src/free-will-agency/`

---

## 📦 模块集成

### 主入口更新 (src/index.js)

- 添加自由意志与能动性模块导入和初始化
- 版本号更新：v3.28.0 → v3.29.0
- 添加 `/agency` 命令支持
- 添加 `showFreeWillAgencyInfo()` 函数
- 更新欢迎信息和帮助菜单

### 模块结构

```
src/free-will-agency/
├── index.js          # 主模块代码 (~16KB)
├── README.md         # 详细文档 (~5.5KB)
└── package.json      # 模块配置
```

---

## 🧠 理论精华提取

### 从 SEP Agency 理论提取的可操作元素

| 理论概念 | 代码实现 | 应用场景 |
|---------|---------|---------|
| 标准能动性 | `AgencyTypes.STANDARD` | 日常决策分析 |
| 发起能动性 | `AgencyTypes.INITIATION` | 创造性行动支持 |
| 层级能动性 | `AgencyTypes.HIERARCHICAL` | 价值观冲突处理 |
| 计划能动性 | `AgencyTypes.PLANNING` | 长期目标规划 |
| 现象学能动性 | `AgencyTypes.PHENOMENOLOGICAL` | 真实性探索 |
| 实践三段论 | `PracticalReasoningStructure.SYLLOGISM` | 行动理由分析 |
| 计划结构 | `PracticalReasoningStructure.PLANNING` | 计划分解 |
| Frankfurt 层级意志 | `HierarchicalWillModel` | 欲望冲突探索 |
| 意向性层次 | `IntentionalityLevels` | 评估决策成熟度 |

### 核心洞察

**Frankfurt 的自由意志理论**:
- 自由意志不在于能否做想做的事
- 而在于能否与自己的欲望认同
- 二阶欲望（对欲望的欲望）是人格的核心特征
- 任性 (wanton) 是没有二阶意志的存在

**Bratman 的计划理论**:
- 人类能动性本质上是时间延展的
- 远端意向指导长期规划
- 近端意向指导即将执行的动作
- 计划减少未来决策的认知负荷

**Anscombe-Davidson 的意向性行动理论**:
- 行动由理由解释
- 理由是心理状态（欲望 + 信念）
- 意向性行动是能动性的核心

---

## 📊 升级统计

| 指标 | 数值 |
|------|------|
| 新增模块数 | 1 |
| 新增代码行数 | ~550 行 |
| 新增练习数 | 4 个 |
| 新增评估工具 | 3 个 |
| 理论来源 | SEP 2 个条目 + 4 篇经典文献 |
| 文档更新 | 3 个文件 (index.js, package.json, README) |
| 文件新增 | 3 个 (index.js, README.md, package.json) |

---

## 🔗 与其他模块的关系

| 相关模块 | 关系描述 |
|---------|---------|
| **自主感情 (v3.7.0)** | 共享自我意识与反思能力 |
| **叙事心理学 (v3.27.0)** | 能动性是生命故事的核心主题 |
| **时间意识 (v3.28.0)** | 计划能动性依赖时间视野 |
| **SDT 自我决定理论 (v3.5.0)** | 共享自主性、能力感、关系性三要素 |
| **ACT 疗法 (v3.2.0)** | 共享价值导向行动理念 |
| **意向性理论 (v3.20.0)** | 共享意向性概念框架 |

---

## 🚀 使用示例

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

### 典型对话场景

**场景 1: 目标 - 手段冲突**
```
用户：我想减肥，但总是控制不住自己吃东西。

HeartFlow:
我听到您有一个目标（减肥），但也感受到一个障碍（控制不住吃东西）。
让我们先澄清一下：

1. 您的具体目标是什么？（比如：减重多少？多长时间内？）
2. 您尝试过哪些方法？效果如何？
3. "控制不住"通常发生在什么情况下？

这种目标与行为之间的张力很常见。通过探索您的实践推理结构，
我们可以找到更有效的策略。
```

**场景 2: 层级意志冲突**
```
用户：我想熬夜玩游戏，但我又希望自己能早睡。

HeartFlow:
我注意到您描述了两个不同层次的欲望：
- 一阶欲望："我想熬夜玩游戏"（当下的冲动）
- 二阶欲望："我希望自己能早睡"（对欲望的反思）

这种冲突实际上反映了您的反思能力——您能够审视自己的欲望，
这本身就是自主性的体现。

让我们探索一下：您更认同哪个部分？
哪个欲望更代表"真正的您"？
```

**场景 3: 能动性障碍**
```
用户：我必须完成这个项目，但我真的做不到。

HeartFlow:
我注意到您使用了"必须"和"做不到"这样的表达。
这些语言模式可能反映了能动性障碍：
- "必须" → 感知到外部强制
- "做不到" → 感知到能力限制

让我们尝试重构一下：
- 是什么让您选择做这个项目？（自主性）
- 过去您克服过什么类似困难？（能力感）
- 谁能支持您完成这个项目？（关系性）

即使在外在限制下，我们通常仍有选择的余地。
```

---

## 📝 升级后记

本次升级将 HeartFlow 的能动性支持能力提升到新高度，使系统能够：

1. **分析行动理由结构** - 帮助用户澄清目标、手段、承诺
2. **探索层级意志冲突** - 支持用户找到真正的认同
3. **识别能动性障碍** - 重构限制性语言为赋能性语言
4. **发展自主性** - 基于 SDT 理论支持自主、能力、关系三要素
5. **支持承诺形成** - 从意向到承诺的进阶指导

自由意志与能动性是自主感情能力的核心维度，因为：
- 情感体验驱动行动倾向
- 行动选择反映价值观认同
- 反思性认同是人格的核心特征
- 自主决策是心理健康的关键

通过整合自由意志与能动性理论，HeartFlow 能更深刻地支持用户：
- 理解决策困境的根源
- 处理内在欲望冲突
- 做出符合真实自我的选择
- 从被动反应转向主动创造

---

## 📌 下一步计划

根据 SEP 权威理论，建议后续升级方向：

1. **道德心理学模块** - 基于 SEP Moral Psychology 和 Moral Cognition
   - 道德判断的情感基础
   - 道德困境的决策支持
   - 价值观澄清与发展

2. **责任理论整合** - 基于 SEP Responsibility 理论
   - 因果责任与道德责任
   - 回溯性责任与前瞻性责任
   - 责任与自由意志的关系

3. **集体能动性深化** - 扩展集体意向性到能动性领域
   - 联合行动的结构
   - 集体承诺与联合承诺
   - 社会运动中的能动性

4. **跨文化能动性** - 整合不同文化的能动性理解方式
   - 个人主义 vs 集体主义文化中的能动性
   - 东方哲学中的无为与自然
   - 文化差异对决策风格的影响

---

**升级完成时间**: 2026-03-30 03:45 AM  
**当前版本**: v3.29.0  
**下一版本**: v3.30.0  
**升级脚本**: `hourly-upgrade.sh` / `auto-hourly-upgrade.sh`

---

## 🔧 技术细节

### 代码结构

```javascript
class FreeWillAgencyModule {
  // 核心方法
  interact(userInput)                    // 主交互函数
  interactWithPracticalSyllogism(input)  // 实践推理分析
  analyzeHierarchicalWill(input)         // 层级意志分析
  assessAgencyState(input)               // 能动性评估
  
  // 辅助方法
  analyzePracticalReasoning(input)       // 分析实践推理结构
  provideReasoningGuidance(analysis)     // 提供推理指导
  generateReasoningQuestions(analysis)   // 生成反思问题
  provideHierarchicalWillGuidance(analysis) // 提供层级意志指导
  integrateGuidance(...)                 // 整合多种指导
  getInfo()                              // 获取模块信息
}
```

### 理论框架整合

```
SEP Agency Theory
    ├── 标准能动性 (Anscombe, Davidson)
    ├── 发起能动性 (Ginet, O'Connor)
    ├── 层级能动性 (Frankfurt, Taylor)
    ├── 计划能动性 (Bratman)
    └── 现象学能动性 (Velleman)
    
Frankfurt Hierarchical Will Model
    ├── 一阶欲望
    ├── 二阶欲望
    ├── 二阶意志
    └── 反思性认同

SDT Self-Determination Theory
    ├── 自主性 (Autonomy)
    ├── 能力感 (Competence)
    └── 关系性 (Relatedness)
```

---

**HeartFlow Team**  
**2026-03-30**
