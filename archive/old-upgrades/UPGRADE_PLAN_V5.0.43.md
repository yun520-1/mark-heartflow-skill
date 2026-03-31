# HeartFlow v5.0.43 升级计划

**创建时间**: 2026-03-31 07:33 AM (Asia/Shanghai)  
**当前版本**: v5.0.42  
**目标版本**: v5.0.43  
**升级仓库**: https://github.com/yun520-1/mark-heartflow-skill

---

## 目标

实现"社会自我预测模型"——整合社会身份理论、集体意向性、社会预测加工与群体归属感，将理论整合度从 99.89% 提升至 99.90%。

---

## 步骤

### 步骤 1: 检查 GitHub 仓库更新 ✅

- [x] 执行 git pull 同步最新代码
- [x] 确认当前版本 v5.0.42
- [x] 读取 v5.0.42 升级报告

**状态**: 已完成 (07:33 AM)

---

### 步骤 2: 搜索最新心理学/哲学理论

**核心理论来源**:

#### 2.1 集体意向性 (SEP)
- Searle (1990): "We-intention" 概念
- Bratman (1999): 共享意向性作为相互响应的子计划
- Gilbert (1990): 联合承诺理论
- Schmid (2013): 信任作为集体意向性的基础
- 现象学传统：Scheler (1954), Walther (1923) - 共享体验分析

**关键洞见**:
- 集体意向性不可还原为个体意向性的简单加总
- "我们意图"具有独特的形式结构
- 共享体验需要共情、认同与相互觉察
- 信任是集体意向性的核心纽带

#### 2.2 自我意识 (SEP)
- 前反思自我意识 vs 反思自我意识
- 第一人称给定性 (first-personal givenness)
- 自我意识的具身性与社会性
- Fichte: 自我设定自身存在的直接性
- Kant: 先验统觉作为经验统一的必要条件

#### 2.3 社会身份理论 (Tajfel & Turner)
- 社会分类、社会认同、社会比较三过程
- 内群体偏爱与外群体歧视
- 社会认同威胁与防御性增强
- 去个性化与去个体化

#### 2.4 社会预测加工 (Friston, Clark)
- 社会世界作为预测误差最小化的场域
- 他人心理状态的预测建模
- 社会规范的先验形成
- 群体归属作为预测稳定性来源

#### 2.5 归属需求理论 (Baumeister & Leary, 1995)
- 归属需要是人类基本动机
- 社会排斥的痛苦机制
- 群体成员身份对幸福感的贡献
- 社会联结的预测价值

**状态**: 已完成 (07:34 AM)

---

### 步骤 3: 分析新理论与现有逻辑的集成点

#### P0 优先级集成点 (4 个)

1. **社会身份预测 ↔ 自我模型更新**
   - 现有：自我意识现象学 v5.0.15
   - 新增：社会身份作为自我模型的扩展层
   - 集成机制：社会反馈调制自我预测误差

2. **群体归属 ↔ 情感安全预测**
   - 现有：情感预测误差理论 v5.0.42
   - 新增：归属感作为情感预测稳定性的来源
   - 集成机制：群体成员身份降低社会情感预测误差

3. **社会地位追踪 ↔ 自尊调节**
   - 现有：情绪理性模块 v4.3
   - 新增：社会地位感知与自尊动态追踪
   - 集成机制：社会比较生成自尊预测误差

4. **集体意向性 ↔ 联合行动预测**
   - 现有：集体情绪现象学 v5.0.13
   - 新增：We-intention 形式化与联合承诺追踪
   - 集成机制：共享目标表征协调个体预测

#### P1 优先级集成点 (5 个)

5. **社会认同威胁 ↔ 防御性自我增强**
6. **内群体偏爱 ↔ 社会预测偏差**
7. **社会排斥预测 ↔ 归属需求满足**
8. **群体情感同步 ↔ 情感传染机制**
9. **社会规范内化 ↔ 预测先验形成**

#### P2 优先级集成点 (5 个)

10. **社会自我 vs 个人自我张力**
11. **多重身份协商机制**
12. **群体极化预测模型**
13. **社会学习预测误差**
14. **文化身份预测调制**

#### P3 优先级集成点 (3 个)

15. **病理性社会焦虑预测模型**
16. **自恋型自尊调节异常**
17. **边缘型社会情感不稳定**

**状态**: 已完成 (07:35 AM)

---

### 步骤 4: 更新理论数据库和计算模型

#### 4.1 新增模块结构

```
src/
├── social-self/
│   ├── social-identity-prediction.js    # 社会身份预测模型
│   ├── group-belonging-model.js         # 群体归属自我模型
│   └── social-status-tracking.js        # 社会地位动态追踪
├── collective-intentionality/
│   ├── shared-goal-representation.js    # 共享目标表征
│   ├── joint-commitment.js              # 联合承诺形式化
│   └── we-intention.js                  # "我们意图"计算模型
├── social-affective/
│   ├── social-bonding-prediction.js     # 社会联结预测
│   └── collective-emotion-sync.js       # 集体情感同步
└── integration/
    ├── social-self-unity.js             # 社会自我统一框架
    └── identity-negotiation.js          # 身份协商机制
```

#### 4.2 核心计算模型

**社会身份预测误差 (SIPE)**:
```
SIPE = | Predicted_social_identity_value - Perceived_social_identity_value |

SIPE 层次:
- Level 1: 群体成员身份确认 (我属于这个群体吗？)
- Level 2: 群体内地位评估 (我在群体中的位置？)
- Level 3: 群体价值内化 (群体价值=我的价值？)
- Level 4: 身份整合度 (社会身份与个人身份的一致性)
```

**We-Intention 形式化**:
```
We-Intention(A, B, φ) = 
  ∃shared_goal: φ ∧ 
  mutual_belief(shared_goal) ∧ 
  commitment(A, contribute_to(φ)) ∧ 
  commitment(B, contribute_to(φ)) ∧ 
  trust(A, B, will_contribute) ∧ 
  trust(B, A, will_contribute)
```

**归属感预测模型**:
```
Belonging_Security = f(
  group_acceptance_probability,
  relationship_stability_prediction,
  social_value_contribution,
  identity_overlap_degree
)

归属需求满足 = Belonging_Security > threshold
社会焦虑 = Belonging_Security < threshold + uncertainty
```

**状态**: 进行中 (07:36 AM)

---

### 步骤 5: 生成升级报告

- [ ] 创建 UPGRADE_PLAN_V5.0.43.md
- [ ] 创建 UPGRADE_COMPLETE_V5.0.43.md
- [ ] 创建 upgrade-report-v5.0.43-cron.md
- [ ] 更新 package.json 版本号至 5.0.43
- [ ] 提交并推送至 GitHub

**状态**: 待执行

---

## 当前进度

正在执行：步骤 4 - 更新理论数据库和计算模型

---

## 预期成果

| 指标 | v5.0.42 | v5.0.43 (目标) | 变化 |
|------|---------|---------------|------|
| 理论整合度 | 99.89% | 99.90% | +0.01% |
| 集成点数量 | 87 | ~105 | +18 |
| 理论模块 | 39 | 47 | +8 |
| 社会自我维度 | 基础 | 完整 | 新增 |

---

## 时间估算

| 步骤 | 预计时间 | 实际时间 |
|------|---------|---------|
| 步骤 1: 检查仓库 | 1 min | 1 min |
| 步骤 2: 理论搜索 | 5 min | 3 min |
| 步骤 3: 集成分析 | 10 min | 2 min |
| 步骤 4: 模型更新 | 30 min | 进行中 |
| 步骤 5: 报告生成 | 10 min | 待执行 |
| **总计** | **56 min** | **进行中** |

---

*HeartFlow v5.0.43 升级计划*  
*创建时间：2026-03-31 07:33 AM*  
*Cron 任务 ID: 5ffa3075-fa13-4187-82a5-20fbfab810ac*
