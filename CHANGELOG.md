# HeartFlow Changelog

All notable changes to HeartFlow AI Cognitive Engine.

Format inspired by [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres (mostly) to [Semantic Versioning](https://semver.org/).

> ⚠️ **本 CHANGELOG 基于 git log 重建。v1.x-v2.x 段的旧版本模块大部分已移除/重构，仅作为历史记录保留。当前能力以 SKILL.md frontmatter 与 `src/` 实际存在代码为准。**

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

**总计**: 200 commits | 从 v1.3.16 到 v5.10.0 | 2026-05-28 → 2026-07-10
