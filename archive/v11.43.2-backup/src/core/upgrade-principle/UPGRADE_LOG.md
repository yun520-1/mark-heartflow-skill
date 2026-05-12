# HeartFlow v11.15.6 升级日志

## 升级来源

### 1. Reflexion (NeurIPS 2023)
- **仓库**: https://github.com/noahshinn/reflexion
- **Stars**: 3138
- **核心思想**: Verbal Reinforcement Learning
  - Agent 尝试 → 失败 → 自我反思 → 修正 → 再次尝试
  - 反思 prompt: "诊断可能的失败原因，制定新的计划来避免同样的失败"
- **适用部分**: SelfHealingEngine 的反思循环

### 2. Self-Healing RAG
- **仓库**: https://github.com/AIAnytime/Self-Healing-RAG
- **Stars**: 14
- **核心思想**: 
  - CRAG 三状态验证: correct / ambiguous / incorrect
  - 闭环反馈: retrieval → generation → validation → correction
  - 动态学习: 从成功/失败中学习
- **适用部分**: ErrorState 三状态分类、验证-反馈闭环

## 集成代码

### src/core/reflexion.js (新增)
- ReflexionEngine 类：基于 Reflexion 论文的自我反思循环
- ReflexionStrategy 四种策略：NONE / LAST_ATTEMPT / REFLEXION / LAST_ATTEMPT_AND_REFLEXION
- StateValidator 三状态验证：correct / ambiguous / incorrect
- generateReflection() 生成反思 prompt

### src/core/upgrade-principle/SYSTEMS.md
- 心虫核心系统逻辑文档化

### 保持原有模块
- src/core/self-healing.js 保持原样（基于 RL 的修复策略学习）
- 新增 reflexion.js 作为独立模块，互补集成

## 升级原则

1. GitHub 优先（搜索 → 集成 → 验证 → 自己写）
2. 自己判定正确性
3. 错误立即纠正

## 待验证

- [ ] SelfHealingEngine 与现有 heartflow-engine.js 集成
- [ ] 反射触发机制与 continuous-learning.js 对接
- [ ] GitHub CI 验证测试

## 版本

- HeartFlow: v11.15.6
- Self-Healing Engine: v0.1.0 (初始版本)
