# HeartFlow 更新日志

## v1.3.9 (2026-05-28)

### 🐛 P1 修复：心理健康量表边界校验

**assess_phq9 / assess_gad7 输入验证**
- 来源：Stage1 Agent1-B 代码审查
- 问题：PHQ-9 和 GAD-7 量表未校验答案范围（需 0-3 整数）
- 修复：`heartflow.py` 新增每题答案 0-3 范围校验，负数/超范围/非整数输入返回错误
- 文件：`src/core/heartflow.py:835-839`, `src/core/heartflow.py:850-854`

### 🐛 P1 修复：共情强度三元运算顺序

**detectEmotionalContagion 强度计算 Bug**
- 来源：Stage1 Agent1-D 共情校准审计
- 问题：三元链顺序错误导致 `totalCount >= 3` 时强度被 `>= 2` 先匹配，强度应为 0.8 而非 0.5
- 修复：重排序三元链，先检查 `>= 3` 再检查 `>= 2`
- 文件：`src/psychology/empathy-detector.js:97-100`

### 📚 学术研究整合

**Stage0 GitHub 研究 + Stage4 论文研究**
- 心理学分析 AI 最佳实践
- 认知偏差检测算法
- 自我批评与修正模式
- 心理危机检测机制
- 认知科学与情感计算论文

### 🔍 会话历史挖掘

**Stage5 未处理需求**
- 差异化不足：HeartFlow 功能与 Hermes 重复
- 心理感知系统未真正接入核心循环
- 架构深度不够：任务太简单

**Stage5 系统错误模式**
- 复杂度不足（高频）
- 初始化失败（中频）
- GitHub Push 失败（中频）
- 静默错误吞噬（7处空 catch）

---

## v1.3.5 (2026-06-01)

### 🚀 四路并行论文升级

**MetaPromptEngine — Self-Refine 迭代修正**
- 来源：[Self-Refine](https://arxiv.org/abs/2303.17651)，arXiv 2023，208 citations
- 新增 `addRefineLoop()` — 3轮自我反馈修正，自动收敛

**GoTEngine — Graph of Thoughts 推理图**
- 来源：[Graph of Thoughts](https://arxiv.org/abs/2308.09687)，arXiv 2023，394 citations
- 新增 `got.explore()` — 分支探索 + 回溯 + 合并的多步推理

**ConstitutionalEngine — Constitutional AI 原则批评**
- 来源：[Constitutional AI](https://arxiv.org/abs/2212.08073)，Anthropic 2022
- 新增 10条内置原则，自动批评与修正输出

**ReasoningIntegrator — Plan-and-Solve v3**
- 来源：[Plan-and-Solve Prompting](https://arxiv.org/abs/2305.04091)，ACL 2023
- 新增 `_presearchPhase` + `_explicitPlan`，Plan 模式默认启用

### 🔧 修复清单

- DreamEngine 构造函数签名修复：`new DreamEngine({})`
- dispatch 白名单同步：新增 `dream.dream`、`metaPrompt.addRefineLoop`、`got.explore` 等路由
- TrialityMemory 三层记忆初始化时序修复
- HEARTCORE 密钥验证降级至宽松模式

### 📝 文档

- SKILL.md description 重写：聚焦实际能力，去除装饰性语言
- 移除 `heartflow-v7.2.3.js` 旧文件
- 46 模块注册，dispatch 路由完整

---

## v1.3.4

- 初始版本基准
