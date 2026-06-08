     1|==> CHANGELOG.head.md <==
     2|
     3|> ⚠️ **本 CHANGELOG 包含历史记录与审计修复段。v1.5.0-v2.0.6 段描述的"MarkCode / 执行能力 / multimodal / executor-agent"等模块大部分已移除（src/agent-core/, src/multimodal/, src/agents/executor-agent.js, scripts/heartflow-sync-upgrade.sh, scripts/comfyui-cron.sh 均不存在），仅作为"已修复"历史保留。当前能力以 SKILL.md frontmatter 与 `src/` 实际存在代码为准。**
     4|
     5|## v2.8.8 (2026-06-08)

### 🔧 版本统一 + README 重写 + 审计修复

- 版本号统一：heartflow.js header / README.md / AGENTS.md / data/memory-index.json → 全部 2.8.8
- README.md 重写：更新为 AI-first 文档风格，展示完整能力与架构
- 隐私检查通过：无 /Users/apple/、微信ID、邮箱泄露
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