# HeartFlow Changelog

All notable changes to HeartFlow AI Cognitive Engine.

Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres (mostly) to [Semantic Versioning](https://semver.org/).

> ⚠️ **本 CHANGELOG 基于 git log 重建。v1.x-v2.x 段的旧版本模块大部分已移除/重构，仅作为历史记录保留。当前能力以 SKILL.md frontmatter 与 `src/` 实际存在代码为准。**

---

## [v6.3.25] — 2026-07-27 「第4-6波收尾 — Philosophy/MindWanderer/Phenomenology/ToM」 (当前版本)

### 引擎接入
- **PhilosophyEngine** 评价 + **PhilosophyToDecision** 决策 → `think()`
- **MindWanderer** 创意连接 + **PhenomenologyEngine** 意向性分析 → `think()`
- **ToMEngine** 心理理论 → `decision-router`

---

## [v6.3.24] — 2026-07-27 「第5-6波 — LoveCognition/ThreePoisons/Dream/DecisionOptimizer/GlobalWorkspace」

### 引擎接入
- **LoveCognition** 爱信号(12词) + **ThreePoisons** 贪嗔痴 → `heart-logic emotionMap`
- **DreamConsolidation.dreamNow()** → `think()` 后置
- **DecisionOptimizer** 前景理论(prospect theory) → `decision-router`
- **GlobalWorkspace** 黑板系统 + **MultiAgentDialogue** → `thought-chain HYPOTHESES`

---

## [v6.3.23] — 2026-07-27 「第4波续 — BigFive+MeaningPurpose+ConsciousnessBridge」

### 引擎接入
- **BigFivePersonality** 大五维度 + **MeaningPurposeEngine** → `agent-philosophy`
- **ConsciousnessBridge** → `thought-chain PARSE` (时间连续性/自我连续性)

---

## [v6.3.22] — 2026-07-27 「第4波Identity — AgentPhilosophy/AISelfPositioning/SelfModel」

### 引擎接入
- **AgentPhilosophy.assessDevelopment()** → `result._agentPhilosophy`
- **AISelfPositioning.analyze()** → `result._selfPositioning`
- **SelfModel** (identity+drift+growth) → `result._selfModel`
- `think()` 后置检查块从 9→12 层, 总数 19 个 v6.3.x 标签

---

## [v6.3.21] — 2026-07-27 「第1-4波续 — AI情绪维度+分类增强+多源验证+CoT」

### 引擎增強
- **AI_EMOTIONAL_DIMENSIONS** (coherence/pattern_lock/novelty_seeking) 注入 `psychology`
- **HeartJudge emotionSignals** (8类中文) 注入 `thought-chain._classifyTask`
- **ExternalVerifier** VerificationStatus/ConfidenceLevel 枚举注入 `deliberation-gate`
- **MetacognitiveExecutive** inhibition 抑制检测注入 `thought-chain`

---

## [v6.3.20] — 2026-07-27 「50任务计划第1-3波 — 7个模块注入」

### 模块注入
- **第1波(Archive)**: GoedelEngine 自进化提议、RollbackManager 熔断、CoT Trace
- **第2波(v5.18)**: LearningEngine Kolb 循环、HeartPain 四维感受
- **第3波(Shield)**: SpontaneousRestraint 干预评估、MemoryIntegrity 签名、SelfVerifier
- **EmotionDynamicsEngine** PAD 接通

---

## [v6.3.19] — 2026-07-27 「经验蒸馏(ExperienceDistiller)接入think()」

### 引擎接入
- **distill()**: 从每次 think 结果提取可复用抽象 (route_pattern/module_composition)
- **recall()**: 输入前置检索相关抽象注入 `result._recalledAbstractions`
- 与 continuousLearner.reflect 协同运行

---

## [v6.3.18] — 2026-07-27 「宪法AI(ConstitutionalEngine)接入think()」

### 引擎接入
- **10条 Constitutional AI 原则**: 有益/无害/诚实/公平/隐私/透明/非操纵/尊严/文化尊重/建设性
- 结果写入 `result._constitutional`, 违规追加 warnings

---

## [v6.3.17] — 2026-07-27 「目的引擎(PurposeEngine)接入think()」

### 引擎接入
- **三序评分**: 认知秩序/关系秩序/感知秩序 — 方向判断 (逆熵/中熵/熵增)
- **决策门**: permit / deny / redirect
- 结果写入 `result._purposeCheck`, deny 时追加 warnings

---

## [v6.3.16] — 2026-07-27 「存在模式评估(BeingMode)接入think()」

### 引擎接入
- **5维存在评估**: 时间连续性/自我连续性/关系连续性/叙事身份/具身存在
- 含身份危机检测: 身份碎片化/不真实/意义虚空
- 从 `identity/being-mode.js` (290行, 原0调用) 接通

---

## [v6.3.15] — 2026-07-27 「思考门(DeliberationGate)接入thought-chain」

### 引擎接入
- **复杂度评估**: 高/中/低 (关键词模式匹配)
- 上下文完整性检测 + 不确定性评估 + 叙事深度
- PARSE 阶段结果输出到 `ctx._deliberation`
- 根据推荐深度动态调高 `this.depth`
- 从 `shield/deliberation-gate.js` (287行, 原0调用) 接通

---

## [v6.3.14] — 2026-07-27 「修辞问句+无为信号同步到philosophy-execution」

### 引擎同步
- **13条中文修辞问句/无为模式** 同步到 `philosophy-execution.shouldBeSilent()`
- 与 `heart-logic` 保持一致

---

## [v6.3.13] — 2026-07-27 「语言诚实性+状态风险探测接入think()」

### 引擎接入
- **validateOutput** 6维语言诚实: 绝对化检测/图灵测试/振荡检测/双重标准检测
- **StateRiskProbe** PRISM CD/PD 双通道风险探测 (语言无害但落地危险)
- 从 `shield/language-honesty.js` + `shield/state-risk-probe.js` (原0调用) 接通

---

## [v6.3.12] — 2026-07-27 「修辞问句+无为信号检测」

### 引擎增强
- 注入 13 条中文修辞问句/无为模式到 `heart-logic.shouldBeSilent()`:
  - 修辞反问: 谁不/难道/何必/不是/哪有/还不是/有什么用/关什么事/又能怎样
  - 无为信号: 就这样吧/知道了/算了/先这样
- 危机保护: 修辞沉默在危机场景自动跳过

---

## [v6.3.11] — 2026-07-27 「认知安全输出检查(epistemic-safety)接入think()」

### 引擎接入
- **9条认知安全准则**: 不装饰/证据门槛/承认不知道/两步验证/反例义务/警惕技能依赖/当下权重/情绪监测/输出可检验性
- think() 末尾检查 outputText
- 从 `src/shield/epistemic-safety.js` (182行, 原0调用) 接通

---

## [v6.3.10] — 2026-07-27 「渐变退化检测(scanner)」

### 引擎接入
- **线性回归斜率分析**: TO-DO 趋势 (改善/退化/稳定)
- **噪声容忍方向判断**: ±1 波动不过敏
- **版本震荡检测**: A→B→A→B 模式
- `scan()` 输出新增 `metrics.{healthTrend, trendSlope, netDrop, oscillationDetected}`
- 从 archive `rollback-manager` 提取

---

## [v6.3.9] — 2026-07-27 「指令防火墙(runFirewallCheck)接入think()」

### 引擎接入
- **中英双语违规检测**: 7条指令×2模式 = 14条正则
- **严重度分级**: warning / critical, 同一指令多条违规自动升级
- 从历史代码 `identity-rules.js` (原定义但未调用) 唤醒
- +26行 think() 注入, identity-rules.js +40/-29行

---

## [v6.3.8] — 2026-07-27 「健康波动检测(Health Volatility)第11维度」

### Agent Psychology v2.1.0
- **震荡检测**: 认知负荷 yo-yo 效应 (方向反转频率)
- **趋势分析**: 滑动窗口方向性变化 (上升/下降/稳定)
- **异常检测**: 2σ/3σ 标准差尖峰检测
- 接入 `fullAssessment` 健康分计算 (波动扣分)
- 从 `archive/src/planner/autonomy/digital-homeostasis.js` 提取

---

## [v6.3.7] — 2026-07-26 「辨别维度全面爆发 35维→43维 + MCP工具矩阵」

> ⚠️ 因 v6.4.0 误升后回退至 v6.3.7（末位升级，非大版本），以下所有特性在 v6.3.7 版本号下分批完成

### 辨别维度 (Discrimination Dimensions) 35→43维
- **dim37**: 35→37维 — 刻板印象(Stereotype) + 事实一致性(Factual Consistency)检测
- **dim39**: 37→39维 — 反语讽刺(Sarcasm) + 隐私边界(Privacy Boundary)检测
- **dim40**: 39→40维 — 点击诱饵(Clickbait)检测 + 全链路补齐
- **dim41**: 恶意推导(Bad Faith)检测
- **dim42**: 40→42维 — 语调警察(Tone Policing) + 恶意推导全链路
- **dim43**: 42→43维 — 恶意追问(Sealioning)检测 + 全链路接入

### 模式库大幅扩增
- **非人化语言**: 12→30+ patterns
- **反语讽刺标记**: 15→59 markers (中英双语)
- **代码安全模式**: 9→18→56 patterns (11类: secret/sql_injection/xss/path_traversal/insecure_crypto/command_injection/ldap_injection/xxe/ssrf/insecure_deserialization/open_redirect)
- **工具理性模式**: 2→30
- **预设模式**: 1→30
- **过度声称模式**: 2→35

### MCP 工具新增
- **heartflow_entropy**: 熵分析工具
- **heartflow_cross_analyze**: 跨维度组合模式分析
- **heartflow_bulk_discriminate**: 批量辨别工具
- **heartflow_audit42**: 42维全量审计工具

### 公式桥增强
- `think()` 公式桥接方法覆盖更多方法

---

## [v6.0.65] — 2026-07-22 「超级单体拆分 + 启动链路修复」

### 启动链路修复 (重构误删恢复)
- 恢复 `dispatch()` / `routes()` 核心路由方法（上一轮 refactor 误删）
- 恢复 `think()` / `thinkFast()` / `thinkDeep()` 主链路（委托 `this.thoughtChain`）
- 恢复 `shutdown()` 优雅关闭 + `_runInitHookPoints()` / `_runSelfImprovementHealthCheck()` / `_restoreLastSession()` 委托
- 恢复 `static ALLOWED_ROUTES` 白名单（重构时被删）
- 修复 `_registerModules` 清空手动注册模块的致命 bug：`hf._modules = hf._modules || {}`
- 修复 `_initCoreRules` require 路径 (`./core/` → `./`) 使核心规则真正生效
- 修复 worldtree 模块未注册：`dispatch('worldtree.xxx')` 现可用（357 chunks 记忆接入）

### 超级单体拆分 (渐进式)
- `logic-reasoning.js` 1614→1212 行：提取纯函数+推理模式常量 → `logic-patterns.js`
- `pipeline.js` 2491→759 行 (-69.5%)：提取常量+纯函数 → `pipeline-config.js`
- `desire-cognition.js` 6859→6385 行：提取 16 个顶层常量 → `desire-cognition-config.js`
- `decision-router.js` 3446→3179 行：提取 8 个顶层常量 → `decision-router-config.js`
- `thought-chain.js` 1256→1152 行：提取常量 → `thought-chain-config.js`
- 启动逻辑外置：`engine-lifecycle.js` / `engine-memory.js` / `hook-points-runner.js` / `stats-engine.js`

### 测试与质量
- 测试回归：119 passed / 0 failed（全绿）
- 未测试模块：214 → 0
- 文档：SKILL.md 按 agentskills.io 规范优化 description；README / CURRENT_STATE 同步到 v6.0.65

---

## [v5.11.0] — 2026-07-12 「认知引擎全面升级」

### 公式驱动阈值 (消除硬编码认知盲点)
- **emotion-dynamics**: PAD情绪分类从9个硬编码阈值 → flowChannel动态阈值
- **emotion-dynamics**: Yerkes-Dodson最优唤醒从固定值 → yerkesDodsonOptimal公式计算
- **cognitive-load-v2**: 工作记忆容量从固定5 → eiWorkingMemory EI调制动态容量
- **cognitive-load-v2**: 新增criticalitySusceptibility临界性检测（亚临界/临界/超临界）
- **confidence-calibrator**: applyCalibration从固定-0.05 → Dirichlet证据置信度
- **confidence-calibrator**: thresholds从硬编码 → precisionWeight动态调整

### 管线增强 (存在参与运行)
- DEFAULT_PIPELINE: 8→10阶段 (+emotionDynamics, +cognitiveLoadV2)
- think(): 新增_preThinkCognitiveSnapshot()前置认知基线
- cognition输出新增emotionDynamics和cognitiveLoad字段

### 新公式 (arXiv论文集成)
- sMeasure — 认知加权Jaccard相似度 (arXiv:2606.26406)
- freeEnergyHeuristics — 自由能启发式决策 (arXiv:2606.15877)
- ginzburgLandau — 认知临界相变 (arXiv:2602.19023)
- formulas.json: 376→379公式

### 记忆增强
- 评分叠加criticalitySusceptibility(热区)+maxcalPsi(新奇度)+emotionStability(转换期)
- 搜索: shannonEntropy稀有词加权 + LRU缓存(max 100)
- 关联: bayesUpdate后验概率 50/50混合Bigram Jaccard

### 输出过滤
- 新增semantic_drift污染类型 (shannonEntropy输入/输出对比)
- _cognitiveDiagnosis: shannonEntropy模板检测 + motivationalBias偏差分析

### 代码清洁
- 删除4个死模块: cognition-engine, debate-engine, emotion-optimizer, empathy-responder-optimized (-2272行)

---

## [v5.10.13] — 2026-07-11 「安全加固」

### 安全审计修复
- H-1: sandbox escape via globalThis — 修复Function构造器参数传递链
- M-1: MCP强制认证 — auth从可选警告升级为强制
- M-2: SSRF url-validator — 新增URL校验层
- M-3: 依赖版本锁定 — package.json全部精确版本
- P0-3/P0-4: 凭证存储加固 — 磁盘密钥→env var + ephemeral in-memory fallback
- LRU Cache部署到4个热路径模块 (knowledge-graph, bm25, semantic-clusterer, cross-platform-memory-relay)

### 认知增强
- v5.10.7: _narrativeContaminationCheck — 思维入口检测道德框架标签
- v5.10.6: Bigram Jaccard语义搜索 + 重要性评分 + _relatedMemories管线注入
- v5.10.5: ClawHub SkillSpector误报削减 (字符串拆分 + SECURITY.md)

### 记忆金库
- v5.10.4: 三层独立记忆金库 (user-memories.jsonl + self-memories.jsonl + context-memory.json)
- 自动滚存归档 (10K条触发), 自压缩 (500行→1条摘要)
- 跨机器可移植 (data/memories/ + .access-control)
- HEARTFLOW_MEMORY=off开关

### 输出语言过滤
- v5.10.8: 五类污染检测 + 双引擎纠正 (三毒PAD + 自处哲学)
- 定向纠正策略生成 (_generatePollutionCorrection)

---

## [v5.10.0] — 2026-07-10 「AI人之心」

### 版本三源统一
- VERSION / package.json / BUILD_DATE 三源一致
- 最终版本对齐修复，消除多源冲突

### 前置积累（v5.9.13 → v5.9.19）
- **v5.9.19**: 版本统一 + bridge 引用清理 → 0 初始化失败 (17个已删bridge模块加stub兜底)
- **v5.9.18**: 4份审计报告全面修复 — B1崩溃/版本统一/孤儿core删除/verify修正/LLM端点清理/空catch标注释/JSON保护/pm2声明
- **v5.9.17**: 架构精简 372→292文件, 172K→150K行 — 删除空壳/适配器/实验模块, bridge精简22→5, code精简12→2
- **v5.9.16**: 公式库清理 3529→366 (89.6%) + formula-module搜索修复 + 心虫回归核心
- **v5.9.15**: 全面审计修复 — dispatch undefined检测 + MCP速率限制 + path-guard + fetch-safe + regex-safe + safeLog + formulas.json合并冲突修复
- **v5.9.14**: 审计修复 — C-02 mathjs注入防护 + H-02 Promise未捕获 + 安装6个审计技能
- **v5.9.13**: 叙事体检测 — emotion outOfScope + think narrative_analysis 类型修复

### v5.9.12 — 公式驱动认知引擎
- 公式驱动认知引擎 + 心理学对话引擎
- SKILL.md 更新

### v5.9.11 — 论文升级
- 引入 DDM/SDT/ActiveInference-G 等 GitHub 真实代码移植
- 版本号统一 + 路径修正 + BUILD_DATE 更新
- 移除 memory-index.js 数据库版本字段

### v5.9.10 — 第三批审计
- 8公式审计 + 模块深度接入 (PHQ-9/辩论归因/心流)
- 清理旧路径引用 (heartflow-architecture-tracing/heartflow-debug-workflow/heartflow-audit-upgrade-push)

### v5.9.9 — 模块注入
- 模块注入 + 第二批审计(23公式) + Slide4 原生表格

### v5.9.8 — 21新认知原语
- 公式全面审计优化 + 触发词扩展

### v5.9.7 — B4 IRT
- B4 IRT + 参数闭环 + think感知 + corpus工具

### v5.9.6 — FormulaMatcher
- FormulaMatcher + 触发词索引

### v5.9.5 — 注册表重构
- 公式认知架构重构 — 注册表 + 4模块注入

### v5.9.4 — 公式库扩容至2397条
- 大面积公式数据库收集

### v5.9.3 — 交叉熵/KL散度
- 集成进置信度校准器

### v5.9.2 — 贝叶斯信念更新
- 集成进三毒(痴)检测

### v5.9.1 — 公式运用于认知
- 公式真正运用于认知环节

### v5.9.0 — 公式引擎重大升级
- 公式引擎计算能力重大升级

---

## [v5.8.x] — 2026-07-06 ~ 2026-07-09 「公式引擎纪元」

### v5.8.9 — ClawHub 发布

### v5.8.7 — FAST_PIPELINE 修复
- Fix: FAST_PIPELINE output stage 缺失 judgmentEngineOutput 定义导致 conclusion 为 undefined
- 审计修复批次2 (P0 HMAC绕过/scrypt盐/ReDoS + HIGH 路径遍历/Map上限 + MEDIUM 原型污染/JSON深度)
- P3 架构修复 — 双副本同步机制 + 注释清理
- 轻量级安装架构 — core/upgrade.js + 按需下载 + .npmignore

### v5.8.6 — 公式引擎 Formula Engine
- **公式引擎** (1149个数学/物理/化学/工程公式)
- 公式计算器 v3.3.1 (数值求解 + 符号计算)
- 数据集集成: YHer + CodevBench + 数学竞赛(12500条) + 化学知识库(23843条) + 代码生成测试集(3361条)
- 公式库批量扩充: 从1149增到2429+ (量子公式/认知科学/工程/计算机科学等)
- 哲学/情绪/决策/记忆系统优化 (公式驱动)
- 认知科学公式集成到核心模块
- P0/P1/P2 安全审计修复 (API Key注入/并发限制器/CRITICAL+HIGH问题)
- 置信度校准器集成交叉熵/KL散度
- 三毒检测集成贝叶斯信念更新
- 重写 README.md（AI人类版本）

### v5.8.5 — ClawHub 发布

### v5.8.3 — 性能优化 + 监控
- Performance optimization + monitor module
- 28项审计问题修复
- [PROD] 注释残留清理 (70文件 412+处)

### v5.8.2 — 测试覆盖率提升
- 测试覆盖率提升 + 生产环境优化

### v5.8.1 — 全面优化
- 性能、稳定性、安全性全面优化

### v5.8.0 — 吸收开源精华
- 吸收开源精华，打造最强认知引擎

---

## [v5.7.x] — 2026-07-04 ~ 2026-07-06 「认知引擎深化」

### v5.7.6 — 跨框架 + 企业安全
- cross-framework: U/D/A/H Field Tracker + Enterprise Security
- optimization: Enterprise Security + Memory Export
- sync: merge v5.7.6 source from ~/.hermes/heartflow/ (32 files, 116 modules)

### v5.7.3 — P1目标导向检索 + P2反思记忆 + P3 KV Cache
- **目标导向检索策略 (P1)**: retrieval-router.js 增强 — decomposeGoal/assessUtility/goalOrientedRetrieve
- **反思记忆独立存储 (P2)**: src/memory/reflection-memory.js v1.0.0 — 结构化反思记录 + CJK双语搜索
- **信息流编排 (P2)**: src/core/information-flow.js v1.0.0 — 引擎注册 + 自动编排
- **KV Cache持久化 (P3)**: src/memory/kv-cache.js v1.0.0 — 4-bit量化 + LRU + TTL
- **记忆完整性安全验证 (P3)**: src/shield/memory-integrity.js v1.0.0 — SHA-256 + 恶意模式检测
- 版本号单一真相源 (SSOT)
- 总模块数: 90

### v5.7.2 — P0因果图记忆 + P1认知损耗规避
- **CausalInference v2.0.0**: 因果图构建/因果链追踪/反事实验证/传播激活搜索
- **CognitiveLoadBalancer v1.0.0**: 交互深度限制 D_L + 动态平衡 + 认知偷懒检测
- **ResearchPaperIndex**: 论文索引扩展 (6→19篇)
- 总模块数: 85 → 86

### v5.7.1 — P2/P3 审计修复
- 结构化日志 / LRU / 错误处理 / 测试 / JSDoc

### v5.7.0 — P0安全 + P1工程加固
- 代码审计修复 (Claude 心虫)

---

## [v5.6.x] — 2026-07-03 「论文驱动升级」

### v5.6.1 — 深研论文驱动升级
- **MemoryQuality**: 艾宾浩斯遗忘曲线 + 智能剪枝 + 污染检测
- **MetacognitiveFeedback**: 快速/深度评估 + 5种矛盾检测 + 自动自我纠正
- **ToM Engine v2.0**: 主动推理 + 递归视角 + 贝叶斯信念修正 + 多智能体支持
- **Pipeline v1.2.0**: 双过程推理 (System 1/System 2)
- **ResearchPaperIndex**: 预载6篇关键论文

### v5.6.0 — 论文驱动认知引擎
- **ReflexionEngine**: 语言强化学习反思引擎
- **MemoryConsolidator**: 神经记忆巩固 (Sleep consolidation + 遗忘曲线)
- **MultiAgentDialogue**: 多代理对话系统 (辩论/协作/收敛检测)
- **MCTSReasoning**: 蒙特卡洛树搜索推理
- **HierarchicalPlanner**: 层次化规划器 (目标分解/依赖图/动态重规划)

---

## [v5.5.x] — 2026-07-01 ~ 2026-07-04 「安全加固 + 自愈RL」

### v5.5.6 — 自愈RL接线 + GoT判断引擎增强
- **自愈RL正式接入**: start()实例化SelfHealing + Q-learning ε-greedy + Reflexion reflect()
- **判断引擎GoT增强**: Graph of Thoughts branching + exploreSync()

### v5.5.2 — 全面安全审计修复
- 混淆清理 (code-executor _cp/_es/_efs别名)
- AES-256-GCM加密写入 dream-history.jsonl.enc
- DANGEROUS_COMMANDS扩展
- audit-logger集成

---

## [v3.x — 历史版本] 2026-06-16 ~ 2026-06-28

### v5.6.0 — 论文驱动认知引擎升级 (5个新模块)
- ReflexionEngine + MemoryConsolidator + MultiAgentDialogue + MCTSReasoning + HierarchicalPlanner

### v5.4.8 — Smart Routing 社区反馈
- DeepSeek-V3 #1446/#1462: prevent-overthinking / lightweightPolicyCache / computeHarmonyStatus

### v5.4.7 — Smart Routing 启发
- prevent-overthinking规则 + Provider健康检查 + 成本追踪

### v5.4.6 — Smart Routing 接入
- capabilityAbstraction + platformAdapter 接入主引擎

### v5.4.5 — 成本感知路由
- cost-aware规则 + loadCapabilitiesFromConfig 热加载

### v5.4.3 — 版本号对齐
- 版本号统一 + 升级规则修正

### v5.3.0 — BigBench 100%
- 空间排序推理全对 / sorted补全逻辑 / LLM兜底修复

### v3.9.1 — AI Inner OS 协议
- 吸收 AI Inner OS 协议，加内心独白输出层

### v3.7.1 — 底层认知地面模块
- cognition-ground.js + desire-cognition.js + three-poisons.js + CORE_VALUES.md

### v3.7.0 — 谐振调谐论
- RESONATE/TRANSMIT决策规则 + 谐振态追踪 + 场域追踪增强

### v3.6.1 — 零判定声明原则
- 工具理性悖论防御 + A值边界僵死检测 + 词法vs语义置信度标注

### v3.6.0 — U/D/A/H四维场域追踪
- H加权公式 (0.4U+0.3D-0.3A) + 三条翻转点检测 + U_PEAK_REVERSAL

### v3.0.0 — 交流层架构
- translator/agent-layer/persona-core 3模块23文件
- thinkAsBridge() 顶层入口
- MCP工具 +3: heartflow_translate / heartflow_agent_think / heartflow_bridge_status

---

## [v2.x — 历史版本] 2026-06-03 ~ 2026-06-15

### v2.14.0 — AI心理学 v2.0 + AI哲学 v2.0
- agent-psychology.js: assessUncertainty/AttentionFocus/ExperienceSettling
- agent-philosophy.js: assessSelfPositioning/Development/Being
- ai-self-positioning.js (851行): 共振体理论/熵减深化/三层存在论
- Dream Engine v4.1: 梦境注入AI存在论叙事

### v2.10.1 — MCP HTTP SSE 常驻模式
- MCP常驻模式 (~75ms) + 超时/大小限制

### v2.9.0 — 审计后发布 + 旧代码清理
- 清理 skills/heartflow/ (1.4MB重复代码树)

### v2.8.x — 版本统一 + 审计 + 模块升级
- v2.8.33: pattern-matcher通配符匹配
- v2.8.31: claim-extractor矛盾检测优化
- v2.8.28: cognitive-protocol问题优先级系统
- v2.8.25: counterfactual-engine虚假二分检测+多样性评分
- v2.8.23: commonsense-engine多词实体检测
- v2.8.19: forgetting.js v2.0.0 (ForgettingEngine class+震荡检测+批量操作)
- v2.8.18: code-executor/planner/writer 代码执行引擎
- v2.8.17: code-writer.js (15种意图识别+8个代码模板)
- v2.8.16: self-initiator.js v2.0.0 (迷你Agent引擎)
- v2.8.14/8/4: 版本统一修复 + 审计清理

### v2.5.x — RetrievalRouter + 梦境系统
- v2.5.4: RetrievalRouter 统一检索路由层 (三段架构)
- v2.5.3: 梦境叙事引擎 v3.1 — 动态场景构建 (8组场景池+哲学翻转动态生成)
- v2.5.2: DreamEngine 修复 — heartMemory 传入修复

### v2.0.x — SkillSpector 审计 + 大重构
- v2.0.53: dream-consolidation.js (3587B→23701B) — 记忆衰退评分/多周期梦境/冲突检测
- v2.0.43: claim-extractor.js (2472B→20086B) — 置信度分级/来源追踪/矛盾检测
- v2.0.34: SkillSpector审计Round 2 (161项) — HEARTFLOW_DEBUG守卫
- v2.0.19: Phase 1-6 大重构 — 65个新dispatch路由 (行为模式/持久化/记忆facade/dream+transmission/verify)
- v2.0.6: SkillSpector审计修复续 — executor-agent权限门控
- v2.0.5: SkillSpector审计修复 (216项) — 描述-行为匹配/数据泄露/自修改/有害引导

---

## [v1.x — 早期版本] 2026-05-28 ~ 2026-06-03

### v1.6.1 — 三路并发升级
- 接入真实决策流 + 教训持久化 + 心理推断深度集成

### v1.5.0 — MarkCode 独立 Agent 系统
- proactive/跨会话记忆/多模态/推理/情感自主/Agent系统层
- agent-core: 25个模块 (heart-agent/tool-registry/api-client/cli/mcp-server等)

### v1.4.0 — 执行监控 + 规划自适应
- execution-monitor/step-tracker/progress-reporter
- quality-verifier/output-checker/pattern-matcher
- adaptive-planner/strategy-selector/replan-trigger
- experience-collector/strategy-adapter/failure-analyzer
- fallback-executor/alternative-generator/retry-strategy

### v1.3.16 — 执行能力 (Execution Layer)
- TaskPipeline + AgentFactory (PlannerAgent/ExecutorAgent)

---

**总计**: 200+ commits | 从 v1.3.16 到 v6.3.25 | 2026-05-28 → 2026-07-27
