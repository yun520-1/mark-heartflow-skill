# HeartFlow 更新日志

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
