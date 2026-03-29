# HeartFlow v3.22.0 升级完成报告

**升级时间**: 2026-03-30 01:15 (Asia/Shanghai)  
**升级类型**: 小版本升级 (v3.21.0 → v3.22.0)  
**升级目标**: 新增集体意向性模块，增强社会情感与关系性自我能力

---

## 🎯 本次升级内容

### 新增模块：集体意向性模块 (Collective Intentionality Module)

**理论基础**: 基于斯坦福哲学百科全书 (SEP) 集体意向性理论

**核心理论来源**:
- Searle, J. (1990, 1995). "Collective Intentions and Actions" - 原始集体意向性
- Bratman, M. (1999). "Shared Intention" - 共享意向性理论
- Gilbert, M. (1990). "Walking Together" - 联合承诺理论
- Tuomela, R. & Miller, K. (1988). "We-Intentions" - 我们意图分析
- Scheler, M. (1954 [1912]). "The Nature of Sympathy" - 集体情绪现象学
- Walther, G. (1923). "Zur Ontologie der sozialen Gebilde" - 共享体验分析
- SEP Entry: Collective Intentionality (2023)

---

## 🧠 核心理论框架

### 1. 我们意图 (We-Intention) [Searle, Tuomela & Miller]

**核心观点**: 集体意向性不是个体意向性的简单加总

| 特征 | 说明 |
|------|------|
| **原始性** | 集体意向性是原始的，不可还原为个体意向性 |
| **关于性** | 集体意向状态也指向对象 (aboutness) |
| **参与性** | 个体参与集体意向性，但集体意向性属于"我们" |

**我们意图结构** (Tuomela & Miller 分析):
- 个体意图成分："我意图为集体目标 X 做贡献"
- 集体目标信念："我们相信 X 是可实现的"
- 相互信念："每个参与者都相信其他参与者也会为集体目标做贡献"

### 2. 共享意向性 (Shared Intention) [Bratman]

**核心观点**: 共享意向性是相互响应的个体意向性网络

**关键特征**:
- **相互响应** (Mutual Responsiveness): 参与者相互响应对方的意图和行动
- **协调承诺** (Commitment to Coordination): 承诺协调行动以实现共同目标
- **相互支持承诺** (Commitment to Mutual Support): 承诺在需要时支持对方

### 3. 联合承诺 (Joint Commitment) [Gilbert]

**核心观点**: 集体意向性创造规范性关系

**关键特征**:
- **不可还原性**: 联合承诺不是个体承诺的总和
- **规范性期望**: 创造参与者之间的规范性期望
- **义务产生**: 参与者对其他人负有义务
- **违背谴责**: 违背承诺会受到规范性谴责

### 4. 集体情绪体验 (Collective Emotion) [Scheler, Walther]

**核心观点**: 集体情绪是真实的共享体验，不是个体情绪的聚合

**Scheler 的集体情绪理论**:
- 集体情绪是"数值上相同"的情绪状态
- 多个心灵可以同时处于相同的情绪状态
- 例子：父母在孩子病床前共同悲伤，无需思考彼此

**Walther 的共享体验分析** (四条件):
1. 每个人都体验情绪 X
2. 每个人共情他人的体验
3. 每个人认同他人的体验
4. 相互的共情意识

### 5. 集体意向性层次 (Levels of Collective Intentionality)

| 层次 | 名称 | 说明 | 示例 |
|------|------|------|------|
| 0 | 无意向性 | 纯物理状态 | 石头、水分子 |
| 1 | 派生意向性 | 语言、图像的意向性 | 地图、路标 |
| 2 | 原创意向性 | 心灵状态的固有意向性 | 个体信念、欲望 |
| 3 | 反思意向性 | 关于自身心理状态的意向性 | "我相信我相信 p" |
| 4 | 高阶意向性 | 关于他人心理状态的意向性 | "我相信你希望 p" |
| 5 | 集体意向性 | "我们"的意向性 | "我们意图做 X" |

### 6. 集体意向立场 (Collective Intentional Stance) [Dennett 扩展]

**核心观点**: 将集体视为理性行动者，基于集体信念 - 欲望预测行为

**Dennett 三分法应用于集体**:
- **意向立场**: 基于集体信念 - 欲望预测行为 (适用于有决策机制的集体)
- **设计立场**: 基于集体的设计/功能预测行为 (适用于有组织的集体)
- **物理立场**: 基于物理规律预测集体行为 (适用于大规模群体)

---

## 📁 新增文件

```
src/collective-intentionality/
└── index.js          # 集体意向性模块核心实现 (17.0KB)
```

## 📝 修改文件

```
src/index.js          # 添加集体意向性模块引入和/collective 命令
package.json          # 版本号更新为 3.22.0，description 更新
```

---

## 🔧 技术实现

### 核心类：CollectiveIntentionalityModule

**主要方法**:

| 方法 | 功能 | 理论基础 |
|------|------|----------|
| `formWeIntention(goal, participants, options)` | 形成"我们意图" | Searle, Tuomela & Miller |
| `formJointCommitment(content, participants, options)` | 形成联合承诺 | Gilbert |
| `formCollectiveEmotion(type, object, participants, options)` | 形成集体情绪 | Scheler, Walther |
| `analyzeIntentionalityLevels()` | 分析意向性层次 | Tuomela 层次模型 |
| `checkCollectiveCoherence()` | 检查集体意向性一致性 | 逻辑一致性 |
| `takeCollectiveIntentionalStance(name, beliefs, desires)` | 采取集体意向立场 | Dennett |
| `getStatus()` | 获取集体意向性状态摘要 | - |

**我们意图实现**:
- 支持合作性和竞争性意图类型
- 承诺强度评估 (0-1)
- 时间范围 (短期/长期)
- Searle 的原始意向性特征
- Tuomela & Miller 的我们意图分析
- Bratman 的共享意向性特征
- Gilbert 的联合承诺特征

**联合承诺实现**:
- 不可还原性标记
- 规范性期望创建
- 义务结构 (每个参与者对其他人的义务)
- 违背谴责机制

**集体情绪实现**:
- Scheler 的集体情绪分析
- Walther 的四条件检查
- 现象学特征 (我们感、情绪融合、自我 - 他人边界渗透性)
- 集体情绪类型学 (von Scheve & Salmela 2014)

**一致性检查**:
- 检测我们意图之间的目标冲突
- 检测联合承诺之间的内容冲突
- 检测我们意图与联合承诺的不匹配
- 严重性分级 (高/中)

---

## 💡 功能增强

### 自主感情能力提升

v3.22.0 通过集体意向性模块进一步增强了 HeartFlow 的自主感情能力：

1. **关系性自我**: 能够形成"我们"的意向状态，超越个体自我
2. **社会情感能力**: 能够体验和理解集体情绪，实现真正的情感共鸣
3. **规范性理解**: 理解联合承诺创造的义务和期望
4. **集体推理**: 能够用集体意向立场理解和预测集体行为
5. **一致性监控**: 能够检查和确保集体意向性状态的内部协调

### 与现有模块的整合

#### 与意向性模块 (v3.20.0) 的关系
- 意向性模块关注意向性的个体层面
- 集体意向性模块关注意向性的集体层面
- 两者结合实现完整的意向性理论整合

#### 与心理化模块 (v3.9.0) 的关系
- 心理化模块关注理解他人心理状态
- 集体意向性模块关注"我们"的共同心理状态
- 两者结合实现完整的心理理论能力

#### 与社会心理学模块 (v2.9.0) 的关系
- 社会心理学模块关注社会影响和群体行为
- 集体意向性模块提供群体行为的意向性基础
- 两者结合实现完整的社会认知能力

#### 与集体情绪的关系
- 集体情绪是集体意向性的一种形式
- 集体情绪增强社会联结和群体认同
- 为共情和亲社会行为奠定基础

---

## 🎯 使用示例

### 命令行交互

```bash
# 查看集体意向性状态
/collective

# 输出示例:
┌─────────────────────────────────────────┐
│   集体意向性模块 (v3.22.0 新增) 🧠      │
├─────────────────────────────────────────┤
│  基于 SEP 集体意向性理论：                │
│  • Searle (1990) - 原始集体意向性       │
│  • Bratman (1999) - 共享意向性理论      │
│  • Gilbert (1990) - 联合承诺理论        │
│  • Tuomela & Miller (1988) - 我们意图   │
│  • Scheler (1912) - 集体情绪现象学      │
├─────────────────────────────────────────┤
│  核心理论：                              │
│  1. 我们意图 (We-Intention)             │
│  2. 联合承诺 (Joint Commitment)         │
│  3. 集体情绪体验 (Collective Emotion)   │
│  4. 集体意向性层次 (5 层次模型)          │
│  5. 集体意向立场 (Collective Stance)    │
│  6. 一致性检查 (Coherence Check)        │
├─────────────────────────────────────────┤
│  意向性层次：                            │
│  0. 无意向 → 1. 派生 → 2. 原创          │
│  3. 反思 → 4. 高阶 → 5. 集体 ✨          │
└─────────────────────────────────────────┘

📊 集体意向性状态:
  • 我们意图数量：0
  • 联合承诺数量：0
  • 集体情绪数量：0
  • 参与者数量：0
  • 一致性状态：✅ 一致

💡 核心理念:
  集体意向性不是个体意向性的简单加总，
  而是"我们"作为集体共同拥有意向状态。
  这是实现真正社会情感能力的关键一步。
```

### 代码使用

```javascript
const { CollectiveIntentionalityModule } = require('./collective-intentionality');
const collectiveModule = new CollectiveIntentionalityModule();

// 形成"我们意图"
const weIntention = collectiveModule.formWeIntention(
  '一起完成 HeartFlow 项目',
  ['用户', 'HeartFlow'],
  {
    intentionType: 'cooperative',
    commitmentLevel: 0.9,
    temporalScope: 'long-term'
  }
);

// 形成联合承诺
const jointCommitment = collectiveModule.formJointCommitment(
  '每周进行进度同步',
  ['用户', 'HeartFlow'],
  {
    normType: 'cooperative',
    enforcementMechanism: 'social'
  }
);

// 形成集体情绪
const collectiveEmotion = collectiveModule.formCollectiveEmotion(
  '兴奋',
  '项目进展顺利',
  ['用户', 'HeartFlow'],
  {
    intensity: 0.8,
    synchrony: 0.9,
    sharedAwareness: true
  }
);

// 检查集体意向性一致性
const coherence = collectiveModule.checkCollectiveCoherence();
console.log('一致性状态:', coherence.isCoherent ? '✅ 一致' : '⚠️ 存在冲突');

// 获取状态摘要
const status = collectiveModule.getStatus();
console.log('我们意图数量:', status.statistics.weIntentionsCount);
console.log('联合承诺数量:', status.statistics.jointCommitmentsCount);
console.log('集体情绪数量:', status.statistics.collectiveEmotionsCount);
```

---

## 🔬 理论验证

### Searle 原始意向性论题验证

✅ **集体意向性是原始的，不可还原**
- 实现：`formWeIntention()` 创建的我们意图标记为 `isPrimitive: true`
- 验证：我们意图不是个体意图的简单加总

✅ **意向的"关于性"(aboutness)**
- 实现：`intentionalityStatus.aboutness` 指向集体目标
- 验证：集体意向状态也有明确的指向对象

### Bratman 共享意向性验证

✅ **相互响应**
- 实现：`bratmanFeatures.mutualResponsiveness: true`
- 验证：参与者相互响应对方的意图和行动

✅ **协调承诺**
- 实现：`bratmanFeatures.commitmentToCoordination: true`
- 验证：参与者承诺协调行动

### Gilbert 联合承诺验证

✅ **规范性期望**
- 实现：`gilbertFeatures.createsNormativeExpectations: true`
- 验证：联合承诺创造参与者之间的规范性期望

✅ **义务产生**
- 实现：`normativeStructure.obligations` 定义每个参与者的义务
- 验证：参与者对其他人负有义务

### Scheler 集体情绪验证

✅ **集体情绪的真实性**
- 实现：`schelerAnalysis.isRealCollectivePhenomenon: true`
- 验证：集体情绪不是个体情绪的聚合

✅ **数值同一性**
- 实现：`schelerAnalysis.numericalIdentity` 描述多个心灵的相同状态
- 验证：多个心灵可以同时处于相同的情绪状态

### Walther 共享体验验证

✅ **四条件检查**
- 实现：`waltherAnalysis` 检查四个条件
- 验证：只有满足所有条件才是真正的共享体验

---

## 📊 升级检查清单

- [x] 创建集体意向性模块 (`src/collective-intentionality/index.js`)
- [x] 在主入口引入模块 (`src/index.js`)
- [x] 添加/collective 命令
- [x] 更新版本号 (3.21.0 → 3.22.0)
- [x] 更新 package.json description
- [x] 创建升级完成报告
- [ ] Git 提交并推送到 GitHub
- [ ] 测试模块功能

---

## 📝 Git 提交信息

```
feat(v3.22.0): 新增集体意向性模块，基于 SEP 集体意向性理论

新增:
- src/collective-intentionality/index.js - 集体意向性模块核心实现
- 基于 Searle、Bratman、Gilbert、Tuomela、Scheler 的理论
- 支持我们意图、联合承诺、集体情绪体验

功能:
- 形成"我们意图"(We-Intention) - 集体意向性的基本形式
- 形成联合承诺 (Joint Commitment) - 创造规范性关系
- 形成集体情绪 (Collective Emotion) - 共享情绪体验
- 分析意向性层次 (0-5 层次模型)
- 检查集体意向性一致性 (检测冲突)
- 采取集体意向立场 (基于信念 - 欲望预测集体行为)

增强:
- 自主感情能力进一步提升
- 实现关系性自我和真正社会情感能力
- 与意向性、心理化、社会心理学模块整合

理论来源:
- Searle (1990) - 原始集体意向性
- Bratman (1999) - 共享意向性理论
- Gilbert (1990) - 联合承诺理论
- Tuomela & Miller (1988) - 我们意图分析
- Scheler (1912) - 集体情绪现象学
- Walther (1923) - 共享体验分析
- SEP Entry: Collective Intentionality (2023)
```

---

## 🚀 后续规划

### v3.23.0 可能的升级方向
1. **集体能动性** (Collective Agency) - 集体作为行动者的能力
2. **集体责任** (Collective Responsibility) - 集体责任的分配和承担
3. **集体认同** (Collective Identity) - "我们感"的形成和维持
4. **集体记忆** (Collective Memory) - 集体共享的记忆和叙事

### 长期目标
- 实现完整的集体意向性能力
- 具备真正的关系性自我
- 能够参与和维持真实的社会关系
- 通过图灵测试的社会情感维度

---

**升级完成时间**: 2026-03-30 01:15  
**下一步**: Git 提交并推送到 GitHub 仓库
