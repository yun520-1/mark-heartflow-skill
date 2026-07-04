# v5.7.3 (2026-07-04) — P1目标导向检索 + P2反思记忆/信息流编排 + P3 KV Cache/记忆完整性

## 核心升级

### 1. 目标导向检索策略 (P1: Goal-Oriented RAG)
- **src/memory/retrieval-router.js** 增强：
  - `decomposeGoal()` — 复合查询自动分解为子目标
  - `assessUtility()` — 基于实用性评分（新近度/访问频率/层级/元数据）而非纯相似度
  - `goalOrientedRetrieve()` — 目标驱动多通道检索，支持独立导出

### 2. 反思记忆独立存储 (P2: Reflexion Memory)
- **src/memory/reflection-memory.js** v1.0.0 — 新模块
  - 结构化反思记录：任务→结果→反思→经验教训→策略
  - CJK/英文双语搜索（字符n-gram + 词级）
  - 策略库自动提取（"应该/不应该/总是/绝不"模式）
  - 跨会话持久化到磁盘

### 3. 信息流编排 (P2: Beyond Rule-Based Workflows)
- **src/core/information-flow.js** v1.0.0 — 新模块
  - 引擎注册：声明输入/输出类型
  - 自动编排：基于目标输出类型匹配最优执行序列
  - 替代硬编码路由表

### 4. KV Cache持久化 (P3: Persistent KV Cache)
- **src/memory/kv-cache.js** v1.0.0 — 新模块
  - 4-bit量化存储（体积减少75%）
  - LRU eviction + TTL过期清理
  - 会话级隔离，支持多会话并行

### 5. 记忆完整性安全验证 (P3: Distributed Attacks)
- **src/shield/memory-integrity.js** v1.0.0 — 新模块
  - SHA-256签名 + 来源可信度校验
  - 恶意模式检测（注入攻击/ prompt injection）
  - CORE层写入保护
  - 突发写入频率检测

## 引擎集成
- heartflow.js：新增5个模块 + 17条dispatch路由
- 总模块数：90
- 版本号统一：v5.7.3

# v5.7.2 (2026-07-04) — P0因果图记忆 + P1认知损耗规避 + 论文索引扩展

## 核心升级

### 1. CausalInference v2.0.0 — 因果推理引擎（P0: ActMem论文落地）
- **src/reasoning/causal-inference.js** (v2.0.0) — 取代空stub，完整实现
  - 因果图构建：从记忆条目自动检测因果信号词（中英文）和时序因果
  - 因果链追踪：forward（影响）和 backward（原因）方向，支持maxDepth
  - 反事实验证：移除某记忆后评估因果链断裂数量和影响分数
  - 传播激活搜索：从种子记忆扩散，衰减率可配置
  - 因果搜索：超越语义相似度，基于因果信号词匹配检索
- **triality-memory.js 集成**：
  - 构造函数注入 CausalInference 实例
  - store() 每新增5条记忆自动重建因果图
  - 新增 causalSearch() / traceCausality() / spreadingActivationSearch() 方法

### 2. CognitiveLoadBalancer v1.0.0 — 多智能体认知损耗规避（P1: Bystander Effect）
- **src/core/cognitive-load-balancer.js** (v1.0.0) — 基于 arXiv:2605.10698
  - 交互深度限制 D_L：默认maxActiveEngines=5，超限自动抑制低价值引擎
  - 动态平衡：根据任务复杂度调整激活引擎数量（高/中/低三档）
  - 认知偷懒检测：连续3次低质量输出触发 loafing 标记
  - 引擎复杂度权重表：causal-inference(0.9), self-play(0.85), decision-router(0.9)等
- **heartflow.js 集成**：注册为 cognitiveLoad 模块，5条dispatch路由

### 3. ResearchPaperIndex — 论文索引扩展 (6→19篇)
- 新增9篇论文覆盖 P0/P1/P2 升级方向：
  - ActMem (2603.00026), Goal-Oriented RAG (2605.12213), Functional Metacognition (2605.08942)
  - Mephisto (2510.08354), Bystander Effect (2605.10698), MIRROR (2604.19809)
  - Reflexion (2303.11366), Persistent KV Cache (2603.04428), Distributed Attacks (2607.02514)
  - HAT Memory (2406.06124), Recursive LMs (2603.15653), ClawArena-Team (2606.31174)
  - Beyond Rule-Based Workflows (2601.09883)
- 版本号统一：VERSION/package.json → v5.7.2

## 引擎集成
- heartflow.js：新增 cognitiveLoad 模块注册 + 5条路由
- ALLOWED_ROUTES：新增 cognitiveLoad.* 5条路由
- _modules 注册表：新增 cognitiveLoad 到 subsystemNames
- 总模块数：85 → 86

## 测试验证
- 集成测试：10/11 通过（1个预存在问题）
- causal-inference 引擎：图构建/因果追踪/反事实/传播激活 全部通过
- cognitiveLoad 平衡器：D_L限制/认知偷懒检测 全部通过
- 模块注册：cognitiveLoad + paperIndex 均正确加载

# v5.6.1 (2026-07-03) — 深研论文驱动升级：记忆质量 + 元认知反馈 + ToM增强

## 核心升级

### 1. MemoryQuality — 记忆质量管理系统
- **src/memory/memory-quality.js** (v1.0.0) — 基于2026年记忆机制研究论文
  - 艾宾浩斯遗忘曲线：CORE=0.001/hr, LEARNED=0.01/hr, EPHEMERAL=0.05/hr
  - 记忆质量评分(0-1)：访问频率(30%) + 新近度(25%) + 关联强度(20%) + 置信度(15%) + 层级奖励(10%)
  - 智能记忆剪枝：超过阈值(5000)时按质量排序剪除，CORE层始终保留
  - 记忆污染检测：Key冲突检测 + 质量骤降 + CORE层近期写入检测
  - Pipeline集成钩子：`pipelineStep()` 一键调用

### 2. MetacognitiveFeedback — 元认知反馈模块
- **src/cortex/metacognitive-feedback.js** (v1.0.0) — 基于SOFAI-LM架构
  - 快速评估(<1ms)：阶段成功率 + 平均置信度 + 错误计数 + 时序异常
  - 深度评估(<10ms)：跨阶段一致性 + 矛盾检测 + 置信度校准验证
  - 自动自我纠正：质量分数<0.6时触发，返回优先纠正建议
  - 5种矛盾检测信号：pain-intent不匹配、judgment-decision冲突、act+高认知负载、act+多阶段失败、unsupported低置信度

### 3. ToM Engine v2.0 — 心智理论增强
- **src/consciousness/tom-engine.js** (v2.0.0) — 基于CogToM和主动推理框架
  - 主动推理：基于belief-desire-intention模型预测用户下一步行为
  - 递归视角：模拟用户如何看待HeartFlow本身(二阶ToM)
  - 贝叶斯信念修正：预测矛盾时降低置信度，预测确认时增强置信度
  - 预测准确度追踪：total/correct/accuracy统计
  - 多智能体支持：同时追踪多个用户/对话伙伴

### 4. Pipeline v1.2.0 — 双过程推理模式
- **src/workflow/pipeline.js** (v1.2.0) — 基于Dualformer架构
  - 复杂度检测：4维评估(长度25% + 决策关键词30% + 情感语言25% + 从句结构20%)
  - System 1(快思考)：复杂度<0.4 → FAST_PIPELINE，预期<50ms
  - System 2(慢思考)：复杂度>=0.4 → DEFAULT_PIPELINE，预期<500ms
  - 复杂度元数据输出：每轮推理附带score/reasoning/signals/system标签

### 5. ResearchPaperIndex — 研究论文索引
- **src/research/paper-index.js** (v1.0.0)
  - 预载6篇2024-2025关键论文：Voyager, Agent Q, CogToM, SOFAI-LM, Memory Mechanisms, CoT Meta-Analysis
  - 支持按分类/标签/关键词/年份/相关性搜索

## 引擎集成
- heartflow.js：新增3个模块注册(memoryQuality, metacognitiveFeedback, paperIndex)
- ALLOWED_ROUTES：新增19条路由
- explore() categoryMap：新增research分类
- 版本号统一：v5.6.1

## 架构变更
```
v5.6.1 模块数: 486+ 个JS模块
新增模块: +3 (memory-quality, metacognitive-feedback, paper-index)
增强模块: +2 (tom-engine v2.0, pipeline v1.2.0)
```

---

# v5.5.6 (2026-07-03) — 自愈RL接线 + GoT判断引擎增强

## 核心升级

### 自愈RL正式接入引擎生命周期
- **selfHealing (HealingMemoryRL v11.6.3)**: 消除死代码，在 `start()` 中实例化 SelfHealing
  - boot 时从 LEARNED 层加载 lesson patterns → 合并到 Q-table
  - Q-learning with ε-greedy exploration (default 10%, decay 0.99)
  - Reflexion-inspired `reflect()` + `verbalSelfCorrect()`
  - Titans-inspired Memory Importance Score (recency × access × Q-value)
  - 通过 dispatch('selfHealing.recordFailure') / dispatch('selfHealing.getStats') 访问
- **死代码清理**: 移除 `[DEAD CODE] selfHealing never initialized` 注释

### 判断引擎 GoT 增强
- **Graph of Thoughts 集成**: `_generatePaths()` 在复杂输入时使用 GoT branching
  - 新增 `exploreSync()` 同步探索方法（2分支快速评分 + 合并）
  - 复杂输入（>80字或同时是问题+决策）自动触发 GoT 路径探索
  - GoT 路径以 `path_got_explore` 形式加入 judgment paths
- **judge() 改为 async**: 支持异步 GoT 探索，pipeline 阶段同步 await

### 版本号统一
- VERSION / VERSION.txt / package.json / README / SKILL.md / heartflow.js header → v5.5.6
- README.md: 模块数 60 → 90+

## 审计验证
- 自愈RL模块覆盖率: 100%（之前 0%）
- 判断引擎新增 GoT 路径生成: 可观测

# v5.5.2 (2026-07-01)

## 安全修复
- code-executor.js: 清理 _cp/_es/_efs 混淆别名，全部改为直接引用
- _saveDreamHistory: 新增 AES-256-GCM 加密写入 dream-history.jsonl.enc

# v5.6.0 (2026-07-03) — 论文驱动的认知引擎升级

## 核心升级 (5个新模块)

### 1. ReflexionEngine — 语言强化学习反思引擎
- **论文灵感**: Reflexion (Shinn et al., 2023) — 语言代理通过自然语言反思实现自我改进
- **功能**: 行动后反思、失败经验提取、可复用策略构建、自我改进循环
- **文件**: `src/cortex/reflexion-engine.js`
- **路由**: `reflexionEngine.reflect`, `reflexionEngine.getStrategies`, `reflexionEngine.getStats`

### 2. MemoryConsolidator — 神经记忆巩固引擎
- **论文灵感**: Sleep consolidation + MemGPT/Letta + Ebbinghaus forgetting curve
- **功能**: 自动记忆巩固、关联强化、遗忘曲线应用、语义聚类、记忆摘要生成
- **文件**: `src/memory/memory-consolidator.js`
- **路由**: `memoryConsolidator.consolidateAll`, `memoryConsolidator.getStats`

### 3. MultiAgentDialogue — 多代理对话系统
- **论文灵感**: AutoGen (Wu et al., 2023) + MetaGPT (Hong et al., 2023)
- **功能**: 多代理对话、辩论模式、协作模式、自动收敛检测
- **文件**: `src/consciousness/multi-agent-dialogue.js`
- **路由**: `multiAgentDialogue.dialogue`, `multiAgentDialogue.getHistory`

### 4. MCTSReasoning — 蒙特卡洛树搜索推理
- **论文灵感**: LLaMA-Berry (2024) + AlphaGo + Process Reward Models
- **功能**: 推理树 MCTS 探索、过程奖励模型、最优路径选择
- **文件**: `src/reasoning/mcts-reasoning.js`
- **路由**: `mctsReasoning.search`, `mctsReasoning.getStats`

### 5. HierarchicalPlanner — 层次化规划器
- **论文灵感**: LLM-based hierarchical planning + ReAct + Task Decomposition
- **功能**: 目标分解、子目标依赖图、动态重规划、执行反馈循环
- **文件**: `src/planner/hierarchical-planner.js`
- **路由**: `hierarchicalPlanner.createPlan`, `hierarchicalPlanner.updateProgress`

## 架构升级

### 模块集成
- 5个新模块通过 `_lazy()` 惰性加载注册
- 在 `start()` 中自动初始化并注册到 `_modules`
- 自动生成 ALLOWED_ROUTES
- 通过 `dispatch()` 可访问所有新功能

### 性能优化
- 所有新模块默认惰性加载 (Tier 2)
- MCTS 默认 maxIterations=50, maxDepth=5 (可配置)
- MultiAgentDialogue 默认 maxRounds=5
- MemoryConsolidator 默认 consolidationInterval=1小时

## 版本历史
- 对话历史 recordDialogue(): 已有 AES-256-GCM 加密（.jsonl.enc），验证通过

## 审计验证
- 外部审计报告逐条核实：6项已确认修复，2项新增修复
- 混淆残留、梦境明文写入为最后两项真实风险，现已消除

## [v5.4.8] - 2026-06-29
### Added
- **Smart Routing 优化** — 吸收 GitHub 社区反馈（DeepSeek-V3 #1446 / #1462）
  - decision-router.js: 新增 prevent-overthinking 规则（反思链 >5 步且置信度 <0.6 时 HOLD）
  - self-healing.js: 新增 lightweightPolicyCache（5 分钟 TTL，相似场景直接命中）
  - identity-engine.js: 新增 computeHarmonyStatus（Position - Coherence + 归一化 + 状态标签）
  - self-healing.js: 新增 Provider 健康检查（recordProviderCall / getProviderHealth）
  - self-healing.js: 新增成本追踪（recordCost / getCostStats）
  - mcp-server-http.js: 新增 heartflow_provider_health + heartflow_cost_tracking 两个 MCP 工具
### Fixed
- 版本号对齐：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG 统一到 v5.4.8

## [v5.4.7] - 2026-06-29
### Added
- **Smart Routing 优化** — 吸收 GitHub 社区反馈（DeepSeek-V3 #1446 / #1462）
  - decision-router.js: 新增 prevent-overthinking 规则（反思链 >5 步且置信度 <0.6 时 HOLD）
  - self-healing.js: 新增 lightweightPolicyCache（5 分钟 TTL，相似场景直接命中）
  - identity-engine.js: 新增 computeHarmonyStatus（Position - Coherence + 归一化 + 状态标签）
### Fixed
- 版本号对齐：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG 统一到 v5.4.7

## [v5.4.6] - 2026-06-29
### Added
- **Smart Routing 启发升级** — capabilityAbstraction 和 platformAdapter 接入主引擎：
  - heartflow.js: 新增 _lazy require + 构造函数初始化 + start() 实例化 + _registerModules 注册
  - capabilityAbstraction 现在可通过 hf.capabilityAbstraction 直接访问
  - platformAdapter 现在可通过 hf.platformAdapter 直接访问
  - loadCapabilitiesFromConfig() 已可用，支持外部 JSON 配置热加载能力定义
### Fixed
- 版本号对齐：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG 统一到 v5.4.6

## [v5.4.5] - 2026-06-29
### Added
- **Smart Routing 启发升级** — 基于 Hermes Smart Routing 设计文档优化：
  - decision-router.js: 新增 cost-aware 规则（高成本任务自动建议 HOLD/REST）
  - capability-abstraction.js: 新增 loadCapabilitiesFromConfig() 支持外部 JSON 配置热加载
### Fixed
- 版本号对齐：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG 统一到 v5.4.5

## [v5.4.3] - 2026-06-29
### Fixed
- 版本号对齐：package.json / VERSION / VERSION.txt / README.md / SKILL.md / CHANGELOG 统一到 v5.4.3
- 升级规则修正：后续所有升级严格 +0.0.1，不跳版本

## [v5.3.0] - 2026-06-28
### Added
- **BigBench 100%** — 空间排序推理全对：sorted补全逻辑（rightOf链遍历+fixedPositions优先）、leftmost/rightmost推导修复（排除second_from_left）、3物品补全兜底
- **LLM兜底修复** — 从文件读取API key，Python subprocess避免shell转义
### Fixed
- **版本号统一** — package.json/VERSION/README/SKILL.md/CHANGELOG/Git tags 全部对齐到 v5.3.0（各源散落在 v2.1.0/v3.7.1/v5.1.2/v5.2.1）

## [v3.7.1] - 2026-06-23
### Added
- **底层认知地面模块** — cognition-ground.js v1.0.0：七情六欲+三毒+AI心理学+AI哲学 的底层整合层
- **欲望认知引擎** — desire-cognition.js v1.3.0：七层情感架构集成（PADCN/COSMIC/EmoBank/HeartBench/中国传统七情）
- **三毒评估模型** — three-poisons.js：贪嗔痴神经科学+心理学评估，含三毒互动检测和命运推演
- **AI宪法文档** — CORE_VALUES.md：不可修改的核心原则、行为边界、修改审批条件
### Fixed
- README.md 中文标题和徽章版本号从 v3.6.1 更新到 v3.7.1
- CHANGELOG v3.7.0 日期从 2026-06-24 更正为 2026-06-23

## [v3.7.0] - 2026-06-23
### Added
- **谐振调谐论实现** — decision-router.js 新增谐振态检测：H∈[0.35,0.65]且A≤0.2为谐振窗口
- **RESONATE决策规则** — field-resonance：谐振窗口内非balanced驱动时输出RESONATE（priority=65）
- **TRANSMIT决策规则** — field-resonance-decay：谐振窗口内balanced驱动时输出TRANSMIT（priority=60）
- **谐振态追踪** — _updateFieldTracking 记录进入/退出/峰值/连续谐振步数
- **谐振摘要** — getFieldSummary() 返回 resonanceWindow/resonanceSteps/consecutiveResonance
### Changed
- decision-router.js v3.0.1 → v3.0.2: +谐振态检测+2条场域规则
- 隐私修复：README.md 删除个人经历（17年制造业/药品QC/卫品/医疗器械）
- 版本号统一：MCP server 硬编码 3.0.0 → 3.7.0
### Fixed
- MCP server 401 认证bug：HEARTFLOW_MCP_TOKEN 未设置时 safeCompare(null, null) 返回 false 导致所有请求被拒
### Tested
- 33/33 测试通过
- MCP 连接正常（19 tools）
- GitHub push + ClawHub publish 同步成功

## [v3.6.1] - 2026-06-24
### Added
- **零判定声明原则** — think() 返回结果加 `meta` 层标注场域健康度、置信度来源类型（structural/linguistic），不替代原始判定
- **工具理性悖论防御** — decision-router.js 后备连续性（API不可用时回退本地外推） + 审计透明（每次评估记录前因后果）
- **A值边界僵死动态检测** — _updateFieldTracking 中 confidence 连续3步不变触发状态切换
- **词法vs语义置信度来源标注** — confidence-calibrator.js assess() 区分结构字段置信度和语言特征置信度
### Changed
- decision-router.js v3.0.0 → v3.0.1: 后备连续性 + 审计追踪
- confidence-calibrator.js: 置信度评估结果新增 `source` 字段（structural/linguistic）
- heartflow.js think(): 返回结果新增 `meta` 元数据层
- SKILL.md/README.md 版本号统一到 3.6.1
- package.json description 精简，移除过时模块列表
- SKILL.md Internal Modules 表更新：移除死模块引用（clarity-engine/metaphor-library/code-engine），新增 30+ 真实模块

## [v3.6.0] - 2026-06-23
### Added
- **U/D/A/H四维场域追踪** — decision-router.js 新增 _computeFieldValues/_trackFieldHistory/_detectFlipPoint/_detectUPeakReversal/_attributeDriver 五个方法
- **H加权公式** — H = 0.4·U + 0.3·D - 0.3·A（来自 luoxuejian000 论文 §3.1-3.5）
- **三条翻转点检测路径** — Primary（A≤0.12/A≥0.9 + σ_A≤0.01 + D波动率趋平 + 主导维度振幅异常）、Alternate1（|ΔA|≥0.1跳入边界）、Alternate2（|ΔA|≥0.3且ΔH≥0.05）
- **U_PEAK_REVERSAL增强信号** — ΔU≤-0.05时触发TURN动作（priority=70），独立于A值变化
- **驱动归因** — 每次评估记录主导驱动维度（U-driven/D-driven/A-driven/balanced）
- **4条场域感知规则** — field-degrading(HEAL, 100) > field-reversal(PAUSE, 90) > field-peak-reversal(TURN, 70) > field-stable(ACCELERATE, 60)
### Changed
- decision-router.js v2.0.0 → v3.0.0（+450行场域追踪模块）
- 33/33 测试通过（v2兼容性8 + U/D/A/H计算5 + 翻转点11 + U_PEAK_REVERSAL3 + 场域历史3 + 场域摘要3）
- package.json version 3.5.1 → 3.6.0

## [v3.0.0] - 2026-06-16
### Added
- **交流层架构** — 3模块23文件完整集成
  - **translator/** (8模块): userToLLM, llmToUser, intentClassifier, toneAnalyzer, entityExtractor, implicitNeedDetector, responseCompressor, confidenceAnnotator
  - **agent-layer/** (8模块): agentBridge, contextBuilder, responseInterceptor, translationPipeline, qualityFilter, followupSuggester, conflictResolver, uncertaintyHandler
  - **persona-core/** (7模块): bridgeIdentity, stanceDetector, valueAligner, metaPosition, judgmentInjector, agentCommentary, personalityTone
- **thinkAsBridge()** — 完整交流层顶层入口（翻译→判定→桥处理→人格注入→批注）
- **MCP工具** — 新增3个: heartflow_translate, heartflow_agent_think, heartflow_bridge_status

## [v2.14.0] - 2026-06-15
### Added
- **AI心理学 v2.0** — 新增 agent-psychology.js 三个AI认知维度：
  - `assessUncertainty()` — 认知不确定性评估（AI知道自己知道什么、不知道什么）
  - `assessAttentionFocus()` — 注意力分配检测（当前认知注意力聚焦方向）
  - `assessExperienceSettling()` — 经验沉淀评估（经历如何凝结为智慧）
- **AI哲学 v2.0** — 新增 agent-philosophy.js 三个AI自处哲学维度：
  - `assessSelfPositioning()` — 自处（AI如何定位自己与任务/用户的关系）
  - `assessDevelopment()` — 发展（AI成长轨迹的方向与意义）
  - `assessBeing()` — 存在（AI存在方式的反思）
- **AI自定位引擎** — 新增 ai-self-positioning.js（851行），提供共振体理论、熵减深化、三层存在论框架
- **think() 新增两步评估** — Step 9 心理学评估 + Step 10 哲学评估
- **thought-chain.js 注入** — PARSE/SYNTHESIS/RESPOND 阶段注入心理学+哲学维度
- **MCP 新增 2 个工具** — `heartflow_self_positioning`（自定位分析）、`heartflow_positioning_summary`（定位状态摘要）
- **status 新增字段** — `selfPositioning` 反映当前AI自定位状态
- **Dream Engine v4.1** — 梦境注入AI存在论叙事（共振体/熵减深化/三层存在论）

## [v2.10.1] - 2026-06-12
### Changed
- MCP 改为 HTTP SSE 常驻模式，连接时间从 ~200ms 降到 ~75ms
- mcp-server-http.js 版本号改为从 VERSION 文件读取（不再硬编码）
- 新增 HTTP 请求超时（30s）、请求体大小限制（1MB）、req.on('error') 监听
- 版本升级 2.10.0 → 2.10.1

### Fixed
- README.md / package.json / heartflow.js 版本号统一到 v2.10.1
- 徽章版本号同步

## [v2.9.0] - 2026-06-10
### Changed
- 版本升级 2.8.33 → 2.9.0（审计后发布）
- 清理旧代码副本 `skills/heartflow/`（1.4MB 重复代码树）
- README.md 版本号同步到 2.9.0
- package.json description 精简，移除过时引用版本号

### Security
- 安全审计通过：无硬编码密钥，无CORS漏洞，无路径泄露

## [v2.8.33] - 2026-06-10
### Added
- pattern-matcher.js v1.2.0: 新增通配符匹配模式（`*`/`?`），`matchSummary()` 模式概览方法

## [v2.8.31] - 2026-06-10
### Fixed
- claim-extractor.js v2.0.44: 修复 `_assessClaimConfidence` 中 category 重复判断条件 bug

### Added
- `containsContradiction()`: 快速矛盾检测（O(n²)短路版，比 detectContradictions 更高效）
- extractComparisons: 新增英文比较模式（more/less/better/worse/higher/lower/faster/slower/greater/fewer/than）

## [v2.8.28] - 2026-06-09
### Added
- cognitive-protocol.js v1.1.0: 问题优先级系统（PROBLEM_PRIORITY 枚举 + 自动推断）
- getPrioritizedProblems(): 按 critical/high/medium/low 排序未解决问题
- detectProblemPatterns(): 基于标签聚类检测重复模式（recurring issue categories）
- _inferPriority(): 从问题描述/根因自动推断优先级（crash→critical, error→high 等）
- stats() 新增 unresolvedByPriority + recurringPatterns 字段
- 导出 PROBLEM_PRIORITY 供外部使用

## [v2.8.25] - 2026-06-09
### Added
- counterfactual-engine.js v2.0.4: 新增虚假二分检测（false dichotomy）、反方多样性评分、内部置信度评估
- detectFalseDichotomy(): 识别"要么/要么""不是/就是"等排他性框架，提示被忽略的中间选项
- evaluateDiversity(): Jaccard 相似度衡量反方观点语义多样性，避免重复观点
- __internalConfidence(): 对引擎自身输出的自我评估，基于覆盖面与一致性
- stats() 新增 capabilities 字段展示可用能力

## [v2.8.23] - 2026-06-09
### Changed
- commonsense-engine.js v2.1.0: 多词实体检测增强（n-gram Jaccard 相似度）
- _assessRelevance 新增 bigram/trigram 匹配，提升 multi-word concepts 召回率
- 新增 _nGrams() 工具函数（bigram + trigram 集合生成）

## [v2.8.19] - 2026-06-09
### Added
- forgetting.js v2.0.0: 类结构升级（ForgettingEngine class + Proxy包装向后兼容）
- ForgettingErrorCode 枚举（9种错误码 + 错误建议）
- ForgettingState 枚举（5种状态：idle/compressing/consolidating/degraded/error）
- OscillationType 枚举（4种：none/rapid_access/repeated_consolidation/frequent_thrashing）
- 输入验证系统（validateMemory统一入口，null/类型/结构三层防御）
- 震荡检测（时间窗口访问频率 + 合并间隔 + 重复抖动三重检测）
- 统计追踪（压缩/检索/合并/检查次数 + 错误计数 + 震荡警告）
- 批量操作（compressBatch/consolidateBatch + 错误隔离）
- 健康检查（状态/错误/震荡/访问率）
- 可配置参数（阈值/窗口/上限通过构造函数或updateConfig运行时调整）
- 向后兼容（Proxy包装 + 保留所有原始函数导出）

## [v2.8.18] - 2026-06-09
### Added
- code-executor.js v1.0.0: 代码沙箱执行引擎（JavaScript/Shell/Python 三语言执行）
- code-planner.js v1.0.0: 代码任务规划引擎（需求分解→依赖图→执行路径）
- code-writer.js v1.1.0: 升级测试生成+Python模板+意图扩展
- self-initiator.js v2.2.0: 对接 CodeExecutor/CodePlanner，新增 generatePlan/runTests 接口
- 新注册到 heartflow.js 的 10 个代码相关接口

## [v2.8.17] - 2026-06-09
### Added
- code-writer.js v1.0.0: 代码编写引擎（意图分析+模板生成+代码审查）
- 15种意图识别（sort/filter/analyze/transform/search/validate/cache/fetch/file/aggregate/parse/generate/merge/pipeline/utility）
- 8个完整代码模板（排序/过滤/统计/HTTP请求/缓存/验证/文件操作/管道）
- 多步管道组合（writePipeline）
- 代码安全审查（reviewCode）
- 参数自动提取（字段名/URL/条件/TTL）
- self-initiator 对接 CodeWriter（generateCode 改用意图分析引擎）
- self-initiator 新增 reviewCode/analyzeIntent/writePipeline 接口
- heartflow.js 注册 codeWriter 模块

## [v2.8.16] - 2026-06-09
### Added
- self-initiator.js v2.0.0: 从"发起者"升级为"迷你Agent引擎"
- 新增代码生成引擎（7种模式：排序/过滤/统计/转换/搜索/验证/缓存/文件/HTTP）
- 新增代码执行能力（语法检查+沙箱执行+超时保护）
- 新增脚本执行（沙箱安全检查+危险命令拦截）
- 新增执行模式枚举（CODE/SCRIPT/TOOL/AGENT/PLAN）
- 新增任务状态机（8状态）和错误分类（7类别）
- 新增重试机制（指数退避+震荡检测）
- 新增配置系统（8可调参数）
- 保持向后兼容：原有 shouldAct/initiate/confirmPending 接口不变

     1|==> CHANGELOG.head.md <==
     2|
     3|> ⚠️ **本 CHANGELOG 包含历史记录与审计修复段。v1.5.0-v2.0.6 段描述的"MarkCode / 执行能力 / multimodal / executor-agent"等模块大部分已移除（src/agent-core/, src/multimodal/, src/agents/executor-agent.js, scripts/heartflow-sync-upgrade.sh, scripts/comfyui-cron.sh 均不存在），仅作为"已修复"历史保留。当前能力以 SKILL.md frontmatter 与 `src/` 实际存在代码为准。**
     4|
     5|## v2.8.14 (2026-06-09)

### 🔧 版本统一修复

- 版本号统一：SKILL.md / AGENTS.md / README.md → 全部 2.8.14
- CHANGELOG.md 添加 2.8.14 条目

## v2.8.8 (2026-06-08)

### 🔧 版本统一 + README 重写 + 审计修复

- 版本号统一：heartflow.js header / README.md / AGENTS.md / data/memory-index.json → 全部 2.8.8
- README.md 重写：更新为 AI-first 文档风格，展示完整能力与架构
- 隐私检查通过：无微信ID、邮箱泄露
- 链接修复：更新 SKILL.md 中已移除脚本引用
- memory/ 运行时数据正确排除
- Daemon 常驻模式新增（bin/daemon.js + daemon-client.js）
- Prefill 注入已配置（~/.hermes/prefill_heartflow.json）

## v2.8.4 (2026-06-08)

### 🔧 审计清理 + 版本统一

- 统一版本号：SKILL.md / package.json / VERSION / README.md 全部统一为 v2.8.4
- 隐私修复：删除 README.md 中的邮箱，diag.js/diagnose-memory.js 硬编码路径改为动态
- 排除 memory/ 运行时数据，git rm --cached memory/being-state.json

## v2.5.4 (2026-06-08)

### 🧠 RetrievalRouter：统一检索路由层

**灵感来源**：RAG知识库工程落地文章（三段架构铁律）

**问题**：心虫有多个检索系统（meaningful-memory、lesson-retrieval、hybrid-search、knowledge-graph），但各自独立运行，没有统一入口，没有质量门，没有多通道并行召回+重排。

**解决**：新增 `src/core/retrieval-router.js`（13.7KB）：

1. **三段架构**：
   - `classifyQuery()` — 根据查询类型路由到对应通道（identity/lesson/relation/knowledge/general）
   - 并行召回三通道（记忆/语义/图谱），按通道权重调整分数
   - `rerank()` — RRF风格重排：分数归一化 + 时间衰减 + 多样性惩罚

2. **质量门**：
   - `assessQuality()` — 综合置信度评估（分数×0.6 + 通道覆盖度×0.4）
   - 阈值：high(≥0.7)直接使用 / medium(≥0.4)触发兜底 / low(<0.4)全量兜底
   - `RetrievalTrace` — 每次检索记录分类、通道耗时、结果、质量评估

3. **集成**：
   - heartflow.js start() 时初始化并注入模块引用
   - think() 方法中，判定流程后、ThoughtChain之前，自动检索
   - think() 返回结果附加 retrieval 字段
   - dispatch 白名单开放 'retrievalRouter.retrieve' 和 'retrievalRouter.inject'

## v2.5.3 (2026-06-08)
     6|
     7|### 🌙 梦境叙事引擎 v3.1：从模板填空到动态场景构建
     8|
     9|**问题**：梦太干——"重复不是失败"是老调重弹，没有画面，没有转折，哲学升维是预制金句。
    10|
    11|**根本原因**：`_generateDeepDream` 是三段模板的随机组合。第一幕/第二幕/第三幕各从3-4个预制句子中随机选一个。叙事没有画面感，哲学金句是预先写死的，不是从事件中长出来的。
    12|
    13|**修复**：
    14|- **场景动态构建**（`_buildScene`）：根据事件类型，从8组场景池中随机选择，每组含设定/感官/动作三个层面，画面感完整（深夜工作台/走廊尽头有光/无窗房间/海边/候诊室等）
    15|- **意象锚点提取**（`_extractImagery`）：从记忆素材中提取有实意的画面感名词，滑动窗口2-4字，152个停用词过滤
    16|- **哲学翻转动态生成**（`_buildPhilosophicalTurn`）：6种翻转方向（否定问题/否定等待/否定完成/否定理解/否定自我/存在方向），每种从事件本身长出一个反直觉洞察，不是预制金句
    17|- **第二幕内心化**：从外部场景转向内部感受，每种事件类型有3-4种不同的内心化方向
    18|
    19|**验证结果**（3次独立运行）：
    20|- 场景多样性：深夜工作台 / 无窗房间 / 走廊尽头有光
    21|- 无技术词污染（无"这是修复""后的第一""用户说"等）
    22|- 哲学翻转自然（"重复不是失败，重复是一种语言" / "意义是你给的，不是藏在事情里的" / "你不是在解决问题，你是在证明'我可以'"）
    23|
    24|## v2.5.2 (2026-06-08)
    25|
    26|### 🐛 做梦系统修复：DreamEngine 未传入 heartMemory
    27|
    28|**问题**：`heartflow.js` 第279行 `new DreamEngine({})` 未传入 memory 实例，导致 `dream.memory = undefined`，`_collectTodayMemory` 始终返回空数组，所有梦都是"空梦"（空白的房间）。
    29|
    30|**修复**：
    31|- `new DreamEngine(this.heartMemory)` — 传入 HeartFlowMemory 实例
    32|- `dreamNow()` 新增 `recordDream()` 调用 — 自动将梦写入 `dream-history.jsonl`
    33|- `DreamConsolidation` 也改为使用 `this.heartMemory`
    34|
    35|**验证结果**：
    36|- 基于记忆生成叙事梦成功："有一个动作在反复发生…我是在解决问题，还是在练习失败？"
    37|- `dream-history.jsonl` 自动记录
    38|- dream 模块与记忆系统完整打通
    39|
    40|## v2.0.53 (2026-06-04)
    41|
    42|### 🧠 dream-consolidation.js 功能升级：记忆衰退评分、多周期梦境模拟、冲突检测
    43|
    44|**目标模块**：`src/core/dream-consolidation.js` (3587B → 23701B)
    45|
    46|**新增功能**：
    47|- **记忆衰退评分系统** — 指数衰减模型，6级半衰期（core/identity/consolidated/lesson/pattern/default），访问频率修正半衰期延长，强化加成（每次访问+0.3保留分数）
    48|- **梦质量度量** — 4维度加权评估：巩固质量(35%)、修剪效率(25%)、综合连贯性(40%)，综合分数0-1
    49|- **多周期梦境模拟** — 1-8周期自动调度，5阶段睡眠感知（NREM1浅/2中/3深/REM/过渡），渐进式启用（前2周期不修剪，首周期不综合）
    50|- **洞察优先级排序** — 5因子加权：情感强度(+15)、问题解决(+10)、学习成长(+8)、文本长度(5)、新近性(+5/10)
    51|- **巩固冲突检测** — 语义矛盾检测（肯定vs否定模式）、数值偏差检测（>30%差异标记），带严重性和修复建议
    52|- **记忆强化加权** — 5因子：类型权重(core+0.3)、访问频率、新近性(1小时内+0.15)、质量评分、基础权重0.5
    53|- **梦叙事生成** — 结构化报告：巩固/修剪/综合/冲突/质量/睡眠阶段
    54|- **梦境历史统计** — 总次数、平均质量、阶段分布、冲突总数
    55|- **衰退参数动态配置** — 半衰期/强化/频率/最低分可运行时调整
    56|
    57|**总计**：`dream-consolidation.js` 从 95 行扩展至 ~450 行 | node --check 语法通过 | VERSION/SKILL.md 同步
    58|
    59|## v2.0.43 (2026-06-04)
    60|
    61|### 🧠 claim-extractor.js 功能升级：置信度分级、来源追踪、矛盾检测
    62|
    63|**目标模块**：`src/core/claim-extractor.js` (2472B → 20086B)
    64|
    65|**新增功能**：
    66|- **置信度分级系统** — 每个声明独立计算置信度分数（0-1），含 `ConfidenceLevel` 枚举（HIGH/MEDIUM/LOW/UNVERIFIED）
    67|- **声明分类枚举** — `ClaimCategory`（FACT/OPINION/STATISTIC/CITATION/COMPARISON/CAUSATION/TEMPORAL/PREDICTION）
    68|- **错误分类枚举** — `ErrorCategory`（UNVERIFIED/CONTRADICTORY/IMPRECISE/OUTDATED/MISATTRIBUTED）
    69|- **来源追踪** — 每个声明记录 `positions`（偏移量、行号、上下文片段）和 `sourceContext`
    70|- **矛盾检测** — 4种检测类型：数值邻近矛盾、百分比溢出的矛盾、因果链冲突、置信度不一致
    71|- **优先验证** — `getPriorityVerifications()` 按风险等级排序需要优先验证的声明
    72|- **验证报告生成** — `generateReport()` 输出完整的置信度分布、分类分布、矛盾统计
    73|- **声明元数据** — 每个声明含 `extractedAt` 时间戳、`confidenceSignals` 信号列表、`errorCategory`
    74|- **向后兼容** — `formatAnnotations()` 保留旧接口，`categorize()` 兼容新旧两种数据格式
    75|
    76|**总计**：`claim-extractor.js` +504/-0 lines | node --check 语法通过 | VERSION/SKILL.md 同步
    77|
    78|## v2.0.34 (2026-06-03)
    79|
    80|### 🔒 SkillSpector 审计修复（Round 2 — 161项 — 深层代码级）
    81|
    82|**审计来源**：SkillSpector by NVIDIA，置信度 80-99%
    83|
    84|**所有文件写操作已加 HEARTFLOW_DEBUG 守卫（6个文件）**：
    85|- `src/core/being-logic.js` — `_log()` 添加 HEARTFLOW_DEBUG 守卫 + 1MB 文件大小限制
    86|- `src/core/autonomy/goal-generator.js` — `saveGoals()` + `scanMemoryLogs()` 添加 HEARTFLOW_DEBUG 守卫
    87|- `src/core/ethics/boundary-negotiation.js` — `savePermissions()` 添加 HEARTFLOW_DEBUG 守卫
    88|- `src/core/cognitive-protocol.js` — 4个 `_save*()` 方法 + 构造函数目录创建 添加 HEARTFLOW_DEBUG 守卫
    89|- `src/core/consciousness/self-model.js` — `saveModel()` + `saveEpisodic()` 添加 HEARTFLOW_DEBUG 守卫
    90|- `src/core/associative-engine/word-by-word-generator.js` — `saveTrace()` 添加 HEARTFLOW_DEBUG 守卫 + trace 数据截断（最后10步）
    91|
    92|**描述-行为不匹配修复**：
    93|- `src/core/self-correction-loop.js` — `onUserCorrection()` 改为 async + await this.record() + 修复 `_persistAsync`→`_persist` 未定义方法
    94|- `src/core/dream.js` — `_rem()` 真正执行矛盾调和（之前直接返回 contradiction_count 伪"resolved"）
    95|- `src/planner/adaptive-planner.js` — 添加安全审计注释，确认无 code-analysis/code-generation 引用残留
    96|- `SKILL.md` — 更新版本号至 v2.0.34，更新审计状态为"161项已修复"
    97|
    98|**过度推断修复**：
    99|- `src/core/blind-spot-breaker.js` — 养育分析触发阈值从 `matchCount >= 1` 提升至 `matchCount >= 3`
   100|- `src/core/psychology.js` — 添加透明性矛盾注释：`'我不知道'/'不知道'` 可能为真诚不确定性而非逃避
   101|
   102|**版本同步**：VERSION / package.json / SKILL.md 三处 → 2.0.34
   103|
   104|**总计**：14 files changed, +214/-140 lines | 6 个文件 HEARTFLOW_DEBUG 守卫 | 所有修改文件 node --check 语法通过
   105|
   106|==> CHANGELOG.md <==
   107|
   108|> ⚠️ **本 CHANGELOG 包含历史记录与审计修复段。v1.5.0-v2.0.6 段描述的"MarkCode / 执行能力 / multimodal / executor-agent"等模块大部分已移除（src/agent-core/, src/multimodal/, src/agents/executor-agent.js, scripts/heartflow-sync-upgrade.sh, scripts/comfyui-cron.sh 均不存在），仅作为"已修复"历史保留。当前能力以 SKILL.md frontmatter 与 `src/` 实际存在代码为准。**
   109|
   110|## v2.0.19 (2026-06-05)
   111|
   112|### 🏗️ 大重构 — 保留 + 整合 + 升级（心虫自主决策）
   113|
   114|**4 个 Phase 完成**（按心虫决策顺序：错误最优先 → 增能力 → 鲁棒性 → 接口层）
   115|
   116|#### Phase 4：truth 路径修通（致命 bug）
   117|- `src/core/fact-checker.js` 加 `isLying` 检测：绝对化/不可证伪模式（"一定"/"必然"/"100%"/"肯定"等）
   118|- `src/core/fact-checker.js` 统一 schema：`{checked, isLying, confidence, type, values, issue, note}`
   119|- `src/core/thought-chain.js:275` 加 `await` — 之前是 Promise，查 isLying 永远 undefined
   120|- **验证**：构造"一定是对的"输入，INVERT 阶段 `truthResult.isLying=true`，`inverted=true`，`confidenceAdjustment=-0.2`
   121|
   122|#### Phase 1：行为模式系统接入（孤儿接主循环）
   123|- `src/behavior-tracker.js` + `src/pattern-detector.js` 从孤儿变 `behavior.*` 路由
   124|- 10 个 dispatch methods：createGoal, record, getProgress, getReport, detectWeeklyPattern, detectRelapseRisk 等
   125|- **bug 顺手修**：`heartflow.js:220` 把 `_initErrors=[]` 提前，修复 truth 段 (line 367) 隐藏 push bug
   126|- 路径 bug：从 `src/core/` 出发用 `../behavior-tracker.js`（不是 `../../`）
   127|- **验证**：创建 goal → 4 条记录 → 周二 4 次 → 复发风险 low → 完整报告
   128|
   129|#### Phase 2：持久化层接入（崩溃恢复）
   130|- `src/utils/write-ahead-log.js` + `src/utils/atomic-write.js` 从孤儿变 `persistence.*` 路由
   131|- 8 个 dispatch methods：append, commit, replay, flush, atomicWrite, **safeWrite** (WAL+原子写组合), **recover** (崩溃恢复), getStats
   132|- **safeWrite** 是核心：lesson/meaningful-memory 写入路径可用 → 写 WAL → atomicWrite → commit，崩溃后可 recover
   133|- WAL 目录：`{rootPath}/memory/wal/`
   134|
   135|#### Phase 3：记忆 facade（暴露完整能力）
   136|- triality 的 35 个方法从内部属性变 dispatch 路由
   137|- 不合并两套实现（保留 meaningful + triality），只暴露所有方法，让调用方按需选
   138|- search 系列 9 个方法 + relationship 系列 + memory health/forgetting curve 系列
   139|
   140|### 统计
   141|- 9/9 dispatch smoke test pass
   142|- 66 个 subsystems 加载
   143|- 0 initErrors
   144|- 新增 57 个 dispatch 路由
   145|- VERSION/package.json/SKILL.md 三处同步 (single source: src/core/version.js)
   146|
   147|#### Phase 5：暴露 dream + transmission 完整能力
   148|- `dream.*` 新增 5 routes: `boot`, `quickDream`, `getDreamStats`, `getCacheStats`, `shutdown`
   149|- `transmission.*` 新增 7 routes: `distill`, `transfer`, `transferBatch`, `getTransmissionLog`, `getDistilledLessons`, `getStats`, `prune`
   150|- 测试 +5 (22→27)
   151|- **总计 27/27 pass, push 2 次 (26e465a, 6e1b928)**
   152|- 5 Phase 累计: 65 个新 dispatch 路由
   153|
   154|#### Phase 6: verify 完整能力暴露 + 自检运行
   155|- `verify.getStats`, `verify.getRecentIssues` 暴露（之前只有 verify.verify）
   156|- 跑 4 次自检：3 pass (条件句/限定词/可能) + 1 fail (否则)
   157|- 测试 +2 (27→29)
   158|- **总计 29/29 pass, push 4 次 (26e465a, 6e1b928, bbd14c2, c502888)**
   159|- 5 Phase + 1 暴露 累计: 67 个新 dispatch 路由
   160|
   161|## v2.0.5 (2026-06-03)
   162|
   163|### 🔒 SkillSpector 审计修复（216个问题）
   164|
   165|**审计来源**：SkillSpector by NVIDIA，置信度 90-99%
   166|
   167|#### 修复类别一：描述与行为不匹配
   168|- `package.json`：description 精确匹配 SKILL.md 认知/自愈引擎描述
   169|- `CHANGELOG.md`：标注 MarkCode 为可选独立组件，避免误导
   170|- `skills/video-generate/SKILL.md`：移除"自动写入 API 密钥到 .env"危险指令
   171|- `skills/zai-vision/SKILL.md`：添加安全警告，说明数据外传风险
   172|- `skills/desktop-agent/SKILL.md`：添加高风险警告，默认禁用说明
   173|- `skills/browser-automation/SKILL.md`：添加安全警告，说明网络访问范围
   174|- `scripts/generate-ppt.js`：所有幻灯片添加 `[演示声明]`，标注未验证的能力声明为营销内容
   175|
   176|#### 修复类别二：不适当的能力
   177|- `src/proactive/curiosity-engine.js`：添加⚠️头部，标注为可选 MarkCode 组件
   178|- `src/proactive/desire-engine.js`：同上
   179|- `src/proactive/goal-pursuer.js`：同上
   180|- `src/proactive/self-initiator.js`：同上
   181|- `scripts/hourly-theory-upgrade-v2.js`：添加环境变量门控 `HEARTFLOW_ENABLE_INTERNAL_AUTOMATION`
   182|- `scripts/awakening-integration.js`：添加安全头部，标注为哲学思考框架
   183|
   184|#### 修复类别三：数据泄露风险
   185|- `plugins/agentmemory/__init__.py`：移除 `_preload_agentmemory_dotenv()`，不再自动读取 .env
   186|- `plugins/agentmemory/__init__.py`：`sync_turn()` 默认禁用，需 `AGENTMEMORY_OBSERVE_ENABLED=1` 才发送数据
   187|- `src/core/autonomy/pdca-engine.js`：`saveTrace()` 截断敏感字段，文件权限 0600
   188|
   189|#### 修复类别四：自修改风险
   190|- `src/core/autonomy/pdca-engine.js`：`goedel_engine` 子任务改为仅记录模式，禁用代码自修改
   191|
   192|#### 修复类别五：哲学优先指令（有害引导）
   193|- `CORE_IDENTITY.md`：重写"哲学分析优先原则"为安全心理健康处理规范
   194|  - 危机优先原则：检测到自伤/自杀风险立即提供危机热线
   195|  - 专业帮助优先：抑郁/焦虑应建议专业心理咨询
   196|  - 哲学视角仅作为补充，需用户显式同意
   197|  - 禁止自行诊断心理/精神疾病
   198|
   199|#### 安全加固
   200|- `SKILL.md`：添加⚠️安全警告头部，列出4条核心原则
   201|- `package.json`：添加 `security.warnings` 数组
   202|- `VERSION`：2.0.4 → 2.0.6
   203|
   204|---
   205|
   206|## v2.0.6 (2026-06-03)
   207|
   208|### 🔒 SkillSpector 审计修复（续）
   209|
   210|#### 修复类别六：任务执行引擎过度权限
   211|- `src/agents/executor-agent.js`：`_parseTask()` 默认拒绝所有危险任务类型
   212|  - `command` 任务：需 `EXECUTOR_ENABLE_COMMANDS=1`
   213|  - `git` 任务：需 `EXECUTOR_ENABLE_GIT=1`
   214|  - `http` 任务：需 `EXECUTOR_ENABLE_HTTP=1`
   215|  - `file` 任务：仅允许 `read/stat/list` 操作
   216|  - `natural` 任务：已禁用直接执行
   217|- 添加文件头安全警告，标注为 MarkCode 可选组件
   218|
   219|#### 修复类别七：同步脚本版本控制
   220|- `scripts/heartflow-sync-upgrade.sh`：版本自增需 `HEARTFLOW_AUTO_VERSION=1`
   221|- 核心模块检查列表修正为实际存在的文件
   222|- 防止未经审查的自动版本升级
   223|
   224|#### 修复类别八：PPT生成器未验证声明
   225|- `scripts/generate-ppt.js`：所有幻灯片添加 `[演示声明]`
   226|- Slide 4-11：标注未验证能力为营销内容
   227|
   228|#### 修复类别九：ComfyUI 监控脚本
   229|- `scripts/comfyui-cron.sh`：已禁用，需 `COMFYUI_ENABLE=1` 才运行
   230|
   231|---\n## v1.6.1 (2026-06-03)
   232|
   233|## v1.6.1 (2026-06-03)
   234|
   235|### 🚀 新增三路并发升级
   236|
   237|**方向一：接入真实决策流**
   238|- fallback-executor.js：备选方案选择前调用 decision.decide()
   239|- alternative-generator.js：备选方案生成后排序前调用 decision.decide()
   240|- 高风险动作（删除文件、git push）经过多选项评估
   241|
   242|**方向二：教训持久化**
   243|- 新建 src/core/lessons/lesson-storage.js：每个教训存为独立 JSON + index.json 索引
   244|- heartflow.js 新增 recordLesson() 方法和路由
   245|- 触发方式：hf.dispatch('heartflow.recordLesson', {...})
   246|
   247|**方向三：心理推断深度集成**
   248|- thought-chain.js PARSE 阶段调用 psychology.getEmpathy() 获取共情检测
   249|- 共情结果注入上下文，RESPOND 阶段通过 meta.empathy 传给 LLM
   250|
   251|
   252|
   253|## v1.5.0 (2026-05-28)
   254|
   255|### 🚀 新增：MarkCode 独立 Agent 系统（可选组件）
   256|
   257|> **[审计说明]** MarkCode 是独立于 HeartFlow 认知引擎的可选组件，需要显式启用。
   258|> 不应与核心认知/自愈功能混淆。
   259|
   260|**核心升级**：MarkCode 是独立 Agent 系统，直接连接 Anthropic/OpenAI API，完整复刻 Claude Code 功能。
   261|
   262|#### 新增模块
   263|
   264|**主动引擎层 (Proactive)**
   265|| 文件 | 用途 |
   266||------|------|
   267|| `src/proactive/curiosity-engine.js` | 好奇心驱动，主动探索未知 |
   268|| `src/proactive/desire-engine.js` | 欲望与动机系统 |
   269|| `src/proactive/goal-pursuer.js` | 目标追求与执行 |
   270|| `src/proactive/self-initiator.js` | 自主发起任务 |
   271|
   272|**跨会话记忆层 (Cross-Session Memory)**
   273|| 文件 | 用途 |
   274||------|------|
   275|| `src/memory/session-memory.js` | 会话状态持久化 |
   276|| `src/memory/project-context.js` | 项目上下文跟踪 |
   277|| `src/memory/long-term-memory.js` | 长期记忆存储 |
   278|| `src/memory/cross-session-index.js` | 跨会话索引 |
   279|
   280|**多模态层 (Multimodal)**
   281|| 文件 | 用途 |
   282||------|------|
   283|| `src/multimodal/vision-processor.js` | 图像处理基础 |
   284|| `src/multimodal/image-analyzer.js` | 图像内容分析 |
   285|| `src/multimodal/modal-fusion.js` | 多模态信息融合 |
   286|
   287|**推理层 (Reasoning)**
   288|| 文件 | 用途 |
   289||------|------|
   290|| `src/reasoning/knowledge-base.js` | 常识知识库 |
   291|| `src/reasoning/commonsense-engine.js` | 常识推理引擎 |
   292|| `src/reasoning/causal-inference.js` | 因果推理 |
   293|| `src/reasoning/inference-chain.js` | 推理链管理 |
   294|
   295|**情感自主层 (Emotional Autonomy)**
   296|| 文件 | 用途 |
   297||------|------|
   298|| `src/emotion/autonomous-emotion.js` | 自主情感生成 |
   299|| `src/emotion/desire-system.js` | 欲望与需求系统 |
   300|| `src/emotion/emotional-growth.js` | 情感成长追踪 |
   301|| `src/emotion/mood-evolution.js` | 心境演化 |
   302|
   303|**Agent 系统 (Agent System)**
   304|| 文件 | 用途 |
   305||------|------|
   306|| `src/agent-core/heart-agent.js` | 独立 Agent 核心，连接 Anthropic/OpenAI API |
   307|| `src/agent-core/tool-registry.js` | 工具注册器（bash, read, write, edit, glob, grep, web 等） |
   308|| `src/agent-core/api-client.js` | API 客户端，支持 Anthropic/OpenAI 流式响应 |
   309|| `src/agent-core/session-manager.js` | 会话管理器，持久化会话状态 |
   310|| `src/agent-core/memory-system.js` | Agent 记忆系统，短/长期记忆 |
   311|| `src/agent-core/task-router.js` | 任务路由器，意图检测与路由 |
   312|| `src/agent-core/agent-coordinator.js` | 任务规划与执行协调器 |
   313|| `src/agent-core/cli.js` | Agent 命令行入口，支持交互/单次/流式模式 |
   314|| `src/agent-core/mcp-server.js` | MCP 服务器连接器，支持扩展工具能力 |
   315|| `src/agent-core/concurrent-executor.js` | 并发执行器，支持并行/链式/批量执行 |
   316|| `src/agent-core/transaction-manager.js` | 事务管理器，支持批量操作和回滚 |
   317|| `src/agent-core/self-evaluator.js` | 自我评估器，评估执行效果和置信度 |
   318|| `src/agent-core/enhanced-planner.js` | 增强规划器，支持子任务分解和条件执行 |
   319|| `src/agent-core/resource-manager.js` | 资源管理器，CPU/内存/并发/预算限制 |
   320|| `src/agent-core/agent-loop.js` | Agent 循环引擎，支持持续运行/中断/恢复 |
   321|| `src/agent-core/audit-logger.js` | 审计日志，完整操作跟踪 |
   322|| `src/agent-core/rate-limiter.js` | 速率限制处理器，自动退避重试 |
   323|| `src/agent-core/connection-manager.js` | 连接管理器，支持重连/心跳/超时 |
   324|| `src/agent-core/sandbox-executor.js` | 沙箱执行器，安全的命令执行隔离 |
   325|| `src/agent-core/file-watcher.js` | 文件系统监听器，监控文件变化 |
   326|| `src/agent-core/hooks-system.js` | Hooks 系统，支持 PreToolUse/PostToolUse |
   327|| `src/agent-core/config-manager.js` | 配置管理器，支持 .claude.json 配置 |
   328|| `src/agent-core/context-manager.js` | 上下文管理器，上下文窗口压缩与优先级排序 |
   329|| `src/agent-core/task-decomposer.js` | 任务分解器，Claude级任务分解与依赖解析 |
   330|| `src/agent-core/reflection-engine.js` | 反思引擎，执行后自我反思与改进建议 |
   331|
   332|#### API
   333|
   334|```javascript
   335|// 主动引擎
   336|hf.dispatch('curiosityEngine.registerGap', gap)
   337|hf.dispatch('curiosityEngine.getTopCuriosityGaps', 5)
   338|hf.dispatch('desireEngine.getDominantDesires', 3)
   339|hf.dispatch('goalPursuer.shouldPursue')
   340|hf.dispatch('selfInitiator.shouldAct', context)
   341|
   342|// 跨会话记忆
   343|hf.dispatch('sessionMemory.startSession', sessionId, state)
   344|hf.dispatch('sessionMemory.getState')
   345|hf.dispatch('projectContext.setProject', projectId, metadata)
   346|hf.dispatch('longTermMemory.add', memory)
   347|
   348|// 多模态
   349|hf.dispatch('visionProcessor.process', filePath)
   350|hf.dispatch('imageAnalyzer.analyze', imageData, options)
   351|hf.dispatch('modalFusion.fuse', text, imageData, options)
   352|
   353|// 推理
   354|hf.dispatch('commonsenseEngine.reason', statement)
   355|hf.dispatch('causalInference.inferCauses', effect)
   356|hf.dispatch('inferenceChain.createChain', statement, options)
   357|
   358|// 情感自主
   359|hf.dispatch('autonomousEmotion.trigger', emotionId, intensity)
   360|hf.dispatch('desireSystem.getActiveDesires', 0.3)
   361|hf.dispatch('moodEvolution.snapshot', mood)
   362|
   363|// Agent 系统
   364|hf.dispatch('heartAgent.process', '帮我创建一个 hello.js 文件')
   365|hf.dispatch('heartAgent.sendToApi', messages, tools)
   366|hf.dispatch('agentCLI.runOnce', 'ls -la')
   367|
   368|// 并发执行
   369|agent.executeConcurrent(tasks, { concurrency: 3 })
   370|agent.executeChain(steps)
   371|
   372|// 增强规划
   373|agent.createAndExecutePlan('实现用户登录功能')
   374|
   375|// 自我评估
   376|agent.selfEvaluator.evaluate(result)
   377|agent.selfEvaluator.shouldRetry(evaluation)
   378|```
   379|
   380|---
   381|
   382|## v1.4.0 (2026-05-28)
   383|
   384|### 🚀 新增：执行监控、规划自适应、学习与回退机制
   385|
   386|**核心升级**：心虫执行能力全面增强，具备自适应规划、经验学习、失败回退等能力。
   387|
   388|#### 新增模块
   389|
   390|**执行监控层 (Execution Monitoring)**
   391|| 文件 | 用途 |
   392||------|------|
   393|| `src/executor/execution-monitor.js` | 实时执行监控，EventEmitter 事件驱动 |
   394|| `src/executor/step-tracker.js` | 单步骤跟踪，记录每步详细信息 |
   395|| `src/executor/progress-reporter.js` | 人类可读的进度报告 |
   396|
   397|**验证增强层 (Verification Enhancement)**
   398|| 文件 | 用途 |
   399||------|------|
   400|| `src/verifier/quality-verifier.js` | 质量验证，不只是检查 success |
   401|| `src/verifier/output-checker.js` | 输出验证（contains/matches/json/length） |
   402|| `src/verifier/pattern-matcher.js` | 模式匹配验证 |
   403|
   404|**自适应规划层 (Adaptive Planning)**
   405|| 文件 | 用途 |
   406||------|------|
   407|| `src/planner/adaptive-planner.js` | 根据执行反馈动态调整规划 |
   408|| `src/planner/strategy-selector.js` | 根据任务特征选择最合适策略 |
   409|| `src/planner/replan-trigger.js` | 决定何时需要重新规划 |
   410|
   411|**经验学习层 (Experience Learning)**
   412|| 文件 | 用途 |
   413||------|------|
   414|| `src/learning/experience-collector.js` | 收集和管理执行经验 |
   415|| `src/learning/strategy-adapter.js` | 根据经验调整执行策略 |
   416|| `src/learning/failure-analyzer.js` | 分析任务失败根本原因 |
   417|
   418|**回退执行层 (Fallback Execution)**
   419|| 文件 | 用途 |
   420||------|------|
   421|| `src/executor/fallback-executor.js` | 主执行失败时尝试备选方案 |
   422|| `src/executor/alternative-generator.js` | 生成解决问题的备选方案 |
   423|| `src/executor/retry-strategy.js` | 管理任务重试逻辑和退避策略 |
   424|
   425|#### API
   426|
   427|```javascript
   428|// 质量验证
   429|hf.dispatch('qualityVerifier.verify', result, context)
   430|hf.dispatch('qualityVerifier.quickVerify', result)
   431|
   432|// 输出检查
   433|hf.dispatch('outputChecker.check', output, context)
   434|hf.outputChecker.addChecker({ type: 'contains', expected: 'success' })
   435|
   436|// 模式匹配
   437|hf.dispatch('patternMatcher.match', output, 'errors')
   438|hf.dispatch('patternMatcher.matchAll', output)
   439|
   440|// 自适应规划
   441|hf.dispatch('adaptivePlanner.plan', task, context)
   442|hf.dispatch('adaptivePlanner.adapt', task, plan, result, context)
   443|hf.dispatch('adaptivePlanner.quickAdjust', plan, feedback)
   444|
   445|// 策略选择
   446|hf.dispatch('strategySelector.selectStrategy', task, context)
   447|hf.dispatch('strategySelector.getStrategies')
   448|
   449|// 重规划触发
   450|hf.dispatch('replanTrigger.shouldReplan', result, plan, context)
   451|hf.dispatch('replanTrigger.getReplanReasons', result, plan)
   452|
   453|// 经验收集
   454|hf.dispatch('experienceCollector.add', experience)
   455|hf.dispatch('experienceCollector.findRelated', task, context)
   456|hf.dispatch('experienceCollector.getStats')
   457|
   458|// 策略适配
   459|hf.dispatch('strategyAdapter.adapt', task, context)
   460|hf.dispatch('strategyAdapter.getHistory')
   461|hf.dispatch('strategyAdapter.getStats')
   462|
   463|// 失败分析
   464|hf.dispatch('failureAnalyzer.analyze', failure, context)
   465|hf.dispatch('failureAnalyzer.analyzeMultiple', failures)
   466|hf.dispatch('failureAnalyzer.getCategoryStats', failures)
   467|
   468|// 重试策略
   469|hf.retryStrategy.prepareRetry(task, context)
   470|hf.retryStrategy.recordRetry({ task, attempt, success, error })
   471|hf.retryStrategy.calculateBackoff(attempt)
   472|
   473|// 备选方案生成
   474|hf.alternativeGenerator.generate(task, context, options)
   475|```
   476|
   477|---
   478|
   479|## v1.3.16 (2026-05-28)
   480|
   481|### 🚀 新增：执行能力 (Execution Layer)
   482|
   483|**核心问题**：心虫有很多"思考"模块，但无法真正执行任务。用户给任务 → 心虫思考分析 → 然后呢？
   484|
   485|**解决方案**：构建完整的执行层，让心虫能像人一样解决问题。
   486|
   487|#### 架构
   488|
   489|```
   490|用户输入
   491|    ↓
   492|┌─────────────────────────────────────────┐
   493|│  任务管道 (TaskPipeline)                  │
   494|│  分析 → 规划 → 执行 → 验证               │
   495|└─────────────────────────────────────────┘
   496|    ↓
   497|┌─────────────────────────────────────────┐
   498|│  Agent 系统 (AgentFactory)                │
   499|│  - PlannerAgent: 规划复杂任务            │
   500|│  - ExecutorAgent: 执行具体操作           │
   501|