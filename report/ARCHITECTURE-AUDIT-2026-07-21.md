# 心虫 HeartFlow 架构与数据流审计报告（v6.0.64 / HEAD 05cc7502）

- **审计维度**：架构与数据流（依赖图谱 / 核心管线 / think 链路 / 认知四层衔接 / 大模块单体 / 编排器收敛）
- **审计方法**：静态源码复核 + 真实运行证据（node v22.22.2 实启引擎 + 插桩 think 路径 + LayerBus 单元隔离测试）
- **铁律遵守**：①只报问题不报平安；②逐条验证误报；③用真实运行证据；④区分真实缺陷 vs 误报
- **未修改任何文件、未 commit/push**

---

## 〇、上轮架构债现状确认表（验收结论）

> 关键证据：修复轮（commit fd190f7b「审计 M-1+H-1 修复」、2fede84c「3 个 CRITICAL 修复」、05cc7502「停止跟踪 worldtree.json」）的 `git diff --stat` 仅触及 `worldtree.json / mcp-server-http.js / code-executor.js / .gitignore` —— **架构债相关文件（heartflow.js / desire-cognition.js / layer-bus.js / engine-initializer.js / decision-router.js / pipeline.js）零改动**。故上轮架构债在本轮**完全未清偿**。

| # | 上轮架构债 | 验收结果 | 当前实测值 | 状态 |
|---|---|---|---|---|
| D0-1 | 大模块单体：heartflow.js 超大 | **未变** | 6617 行（未减） | ❌ 债仍在 |
| D0-2 | 大模块单体：desire-cognition.js 超大 | **未变** | 6859 行（未减，全仓最大） | ❌ 债仍在 |
| D0-3 | 静默失败 ~44 处空 catch | **未变（略降）** | 空 catch 共 **41** 处（33 处带 `// 防御性`/`已禁用`/清理注释，8 处真静默） | ❌ 债仍在 |
| D0-4 | 编排器未收敛：layer-bus 未删、3 套并存 | **恶化** | layer-bus.js **仍在**（235 行，v5.17.21 新增），且与 pipeline/thought-chain 形成 **3+ 套四层编排并存** | ❌ 债仍在且加重 |
| D0-5 | 模块加载防御性空 catch 掩盖初始化失败 | **未变** | engine-initializer.js 仍有约 20 处 `catch(e){}` 静默跳过模块装配 | ❌ 债仍在 |

---

## 一、本轮新发现（真实缺陷）

### A1 · 编排器发散：四层认知在 3+ 套机制中并行编排，layer-bus 输出无人消费
- **严重程度**：HIGH（架构）
- **类别**：编排器未收敛 / 死计算
- **文件:行号**：`src/core/engine-reasoner.js:497-535`（LayerBus 调用）、`src/workflow/layer-bus.js:1-235`、`src/workflow/pipeline.js:317`（主编排）、`src/workflow/thought-chain.js:1-1257`（fallback）
- **问题描述**：
  - `think()` 主链路先跑 `hf.pipeline.run()`（2491 行主编排，内含 PERCEIVE/COGNIZE/DECIDE/REFLECT 依赖图 stage）；
  - 随后在 `engine-reasoner.js:497` 又 `new LayerBus(this).run()` **再跑一遍四层**（PERCEIVE/COGNIZE/DECIDE/REFLECT），结果写入 `cognitionSnapshot.enrichment.layerBus`；
  - **实测验证**：全局搜索 `enrichment.layerBus` / `layerBus.` 消费点 = **0 处**。LayerBus 的四层计算结果对下游决策、输出、记忆**无任何影响**，属纯诊断/死计算。
  - 此外 `decision-router.js`（3447 行）在第 545/1251 行由 pipeline 内部再次调用，对四层输出做决策路由。
  - 即：同一份「感知→认知→决策→反思」四层逻辑在 **pipeline（主）+ thought-chain（fallback）+ layer-bus（enrichment）+ decision-router（决策）** 至少 3~4 处重复编排。
- **是否误报**：**否**（真实运行证实：插桩显示 `pipeline.run` 调 1 次、`LayerBus.run` 调 1 次；LayerBus 单元隔离测试确认四层正常跑但结果无人读；grep 确认下游零消费）。
- **建议**：删除 `layer-bus.js` 及 `engine-reasoner.js:497-535` 整段调用（或将其四层结果真正并入主输出契约）；统一四层编排到单一 pipeline，thought-chain 仅作 fallback。

### A2 · 大模块单体未拆分（heartflow.js 6617 行）
- **严重程度**：MEDIUM（可维护性）
- **类别**：大模块单体
- **文件:行号**：`src/core/heartflow.js:1-6617`
- **问题描述**：全仓第二大的单体文件，含 think 主链路、各路由分派、对齐检测、可逆回溯、对话记录、MCP 工具注册等，跨多个关注域。已抽出 `engine-reasoner.js` 但仍 6617 行。think 主逻辑散落于 `heartflow.js`（吸收信号、对齐、回溯 6125-6184）与 `engine-reasoner.js`（311-935）两处，链路割裂。
- **是否误报**：否（wc -l 实测 6617 行）。
- **建议**：将 6125-6184 的「信号吸收/想象-执行对齐/可逆回溯」后处理搬入 `engine-reasoner.js`，使 think 链路单一归属；按关注域继续切片。

### A3 · 大模块单体未拆分（desire-cognition.js 6859 行）
- **严重程度**：MEDIUM（可维护性）
- **类别**：大模块单体
- **文件:行号**：`src/emotion/desire-cognition.js:1-6859`
- **问题描述**：全仓最大文件，6859 行，单文件承载欲望认知/三毒/自我定位/爱情认知等多个子域。注意：在 `pipeline.js:363-398` 中 `desireCognition.analyzeDesires` 调用被 `catch(e){/* 已禁用 */}` 包裹，说明该庞然大物在主链路中**实际处于禁用状态**——即 6859 行模块当前主链路基本不被消费，属「大且僵死」双重债。
- **是否误报**：否（wc -l 实测 6859 行；pipeline 调用点确认禁用包裹）。
- **建议**：将主链路真正需要的子能力（如三毒/自我定位）抽成独立小模块并启用；被禁用且无调用的部分评估删除。

### A4 · 静默失败：8 处真·空 catch 吞掉异常（无注释、无日志）
- **严重程度**：MEDIUM（可观测性 / 静默失败）
- **类别**：静默失败
- **文件:行号**：
  - `src/cortex/autopilot.js:41`（日志写入失败静默）
  - `src/cortex/signal-absorber.js:253`（信号吸收结果静默丢弃）
  - `src/core/heartflow.js:6131`（`_autoEvolveIfImproved` 自动进化失败静默）
  - `src/core/heartflow.js:6133`（信号吸收整体失败静默）
  - `src/core/heartflow.js:6151`（对齐检测失败静默）
  - `src/core/heartflow.js:6173`（可逆回溯失败静默）
  - `src/core/heartflow.js:6184`（后处理失败静默）
- **问题描述**：区别于 engine-initializer 中带 `// 防御性` 注释的模块加载 catch，这 8 处**无注释、无 console.warn、无计数**，异常被完全吞掉。例如 6131 自动进化失败、6151 想象-执行对齐失败、6173 可逆回溯失败——这些是认知安全关键路径，静默失败会导致「引擎以为做了对齐/回溯实则没做」且无任何告警。
- **是否误报**：否（逐行 read 确认无补偿逻辑、无日志）。
- **建议**：至少补 `console.warn` + 计数上报（如 `hf._silenceFailCount`）；关键路径（对齐/回溯）失败应写入 `alignmentWarning` 或 `errors` 而非空 catch。

### A5 · decision-router 与 pipeline 内部决策逻辑重叠，路由语义分裂
- **严重程度**：LOW（架构清晰度）
- **类别**：职责重叠
- **文件:行号**：`src/core/decision-router.js:1-3447`、`src/workflow/pipeline.js:545,1251`
- **问题描述**：`decision-router.js`（3447 行）是「通用分析→决策路由引擎」，声明要解决「53 个模块只分析不决策」；但 pipeline 内部 stage 又在 545/1251 行直接调 `hf.decisionRouter` 做场域评估，且 `engine-reasoner.js` 之外还有 `layer-bus.js` 的 DECIDE stage 做 active-inference 决策。决策动作分散在 decision-router / layer-bus(DECIDE) / pipeline 三处，语义不统一。
- **是否误报**：否（源码确认三处决策入口）。
- **建议**：明确唯一决策出口（建议 decision-router），layer-bus 的 DECIDE stage 与 pipeline 内联决策调用统一收口。

---

## 二、误报清单（逐条验证，确认非缺陷）

| # | 疑似问题 | 验证过程 | 结论 |
|---|---|---|---|
| F1 | layer-bus.js 空 catch / 原型污染（Object.assign(ctx,r) at :199） | 读 `layer-bus.js:198-204`，`r` 来自内部 stage 返回值（非用户输入），且 :205-212 已 `log.warn` 记录；对照 07-20 安全审计 D2 同结论 | **误报**（内部对象，不可注入 `__proto__`） |
| F2 | engine-initializer.js 约 20 处 `catch(e){}` 是缺陷 | 逐行确认均带 `// 防御性: 模块加载/调用失败不阻断主流程` 注释，属刻意降级（单模块坏不拖垮引擎）；且 self-scanner.js:84 已将其列为合法静默白名单 | **误报**（设计性防御，已文档化） |
| F3 | LayerBus 四层不执行（探针一度显示 stages=[]） | 隔离单测 `/tmp/lbtest.js` 实测：构造后 `stages.length=4` 且 PERCEIVE/COGNIZE/DECIDE/REFLECT 四层均 `true` 返回；探针 stages=[] 为插桩时序假象 | **误报**（LayerBus 功能正常） |
| F4 | desire-cognition.js 6859 行「未启用=死代码缺陷」 | 主链路 `pipeline.js:365` 确以 `/* 已禁用 */` 包裹 analyzeDesires，但模块自身被 engine-initializer 正常装配且 MCP 工具/其他路径可能调用；属「大且部分僵死」而非「完全死代码」 | **半误报**（僵死属实，但非完全死代码，归 A3） |
| F5 | thought-chain.js（1257 行）是冗余第三编排器 | `engine-reasoner.js:895-913` 确认其仅作 **pipeline.run 失败时的 fallback**，非并行常驻编排；属合理降级设计 | **误报**（fallback 合法） |
| F6 | 静默失败「44 处」 | 实测全仓空 catch = 41 处，其中 33 处带防御性注释；真实无补偿静默 = 8 处（见 A4），非 44 处 | **误报**（数量夸大，已精确为 8） |
| F7 | 修复轮应已清偿架构债 | `git diff --stat fd190f7b~1..05cc7502` 仅 4 文件变更，零触及债务文件 | **误报**（修复轮只动了 worldtree.json 等，架构债未碰） |

---

## 三、架构债现状总结

1. **大模块单体**：heartflow.js 6617 行、desire-cognition.js 6859 行、decision-router.js 3447 行、pipeline.js 2491 行 —— 四个合计 19414 行，上轮至今**零拆分**。
2. **静默失败**：41 处空 catch，33 处合法防御性，8 处真实无补偿静默（集中在 heartflow.js 后处理与 autopilot/signal-absorber）。
3. **编排器收敛**：**恶化**。layer-bus.js 在 v5.17.21 被新增为「统一编排总线」，但实测其四层结果**下游零消费**，反而与 pipeline（主）+ thought-chain（fallback）+ decision-router（决策）形成 3~4 套四层编排并存，未见收敛。
4. **修复轮性质**：本轮 3 个 commit 仅处理 `worldtree.json` 停止跟踪 + `mcp-server-http` 小改 + `code-executor` 微调，**架构维度债务全部遗留未动**。

---

## 四、运行证据附录

- 引擎实启：`node /tmp/probe.js` → `BOOT OK, version=6.0.64, modules=240`；`pipeline wired:true`、`layer-bus exists:true`、`decisionRouter wired:true`。
- think 链路插桩（/tmp/probe2.js）：`pipeline.run invoked=1`、`LayerBus.run invoked=1`，确认两者在单次 think 中**并行各跑一遍四层**。
- LayerBus 隔离单测（/tmp/lbtest.js）：`stages registered=4 (PERCEIVE,COGNIZE,DECIDE,REFLECT)`，四层均正常返回，`errors=[]`。
- 下游消费 grep：`enrichment.layerBus` / `layerBus.` 全仓命中 **0**（排除 engine-reasoner 自身写入行），证实 LayerBus 输出无人读。
- 行数统计：`wc -l` 实测 heartflow.js=6617 / desire-cognition.js=6859 / decision-router.js=3447 / pipeline.js=2491。
- 空 catch 统计：`grep -c` 全仓 41 处；带防御性注释排除后真实静默 8 处。
