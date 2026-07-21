# 心虫 HeartFlow 对抗式代码评审报告（v6.0.64→HEAD 05cc7502）

- **评审对象**: `/root/.hermes/skills/ai/mark-heartflow-skill`
- **当前 HEAD**: `05cc7502`（commit message 称 v6.0.65；`VERSION` 文件仍为 `6.0.64`，版本不一致未修）
- **评审维度**: 对抗式逻辑评审（逻辑缺陷/边界/错误处理/静默失败/假闭环），非安全专项
- **方法**: 逐条打开源码读上下文 + 真实运行证据（Node 实跑）；区分真实缺陷 vs 误报；只报告不修复
- **验收范围**: 上轮对抗评审 C-1/C-2/H-2~H-4/M-3/M-4 修复真实性 + 挖掘修复轮（2fede84c / fd190f7b）新引入缺陷

---

## 一、上轮对抗评审缺陷验收表

| 代号 | 上轮问题 | 验收结论 | 证据 |
|---|---|---|---|
| **C-1** | run-all.js 4 测试套件埋进 catch 死代码（假绿） | ✅ **真修复** | 2fede84c 在 `test/run-all.js:246` 补闭合 `}`、删 308 行多余 `}`，使 4 套件恢复顶层 try/catch。实跑 `node test/run-all.js` 退出码 0，日志中 SignalAbsorber/PathSampler/KnowledgeGraph 等全部真实执行并打印「N 通过, 0 失败」。 |
| **C-2** | retrieveLessons 双定义 + Reflexion 假闭环（永远空） | ✅ **真修复** | 全仓 grep `retrieveLessons` 仅 1 个真实定义（`self-evolution-core.js:1810`，loop.js:870 是 delegate 转发）。2fede84c 删除 2010 版坏定义，并在 `recordOutcome`（:1926-1934）注入真存储：失败时 push `{lesson,type,task,timestamp}` 到 `reflectionHistory` + `saveState()`。`reflectionHistory:[]` 已初始化（:127），`saveState()` 存在（:223）。 |
| **H-2** | strategy-orchestrator 维度错位 | ❌ **未修复（真实缺陷）** | 见 NEW-2 |
| **H-3** | evolve 收敛失效 | ❌ **未修复（真实缺陷，且实为过早收敛）** | 见 NEW-3 |
| **H-4** | explore 误诊断 | ❌ **未修复（真实缺陷）** | 见 NEW-4 |
| **M-3** | 冷却计时器 | ❌ **未修复（真实缺陷）** | 见 NEW-5 |
| **M-4** | 探针假阳性 | ❌ **未修复（与 H-4 同根因）** | 见 NEW-4 |

> 结论：上轮 3 个 CRITICAL（C-1/C-2/C-3）中 C-1/C-2 确属真修复，C-3（明文 token 入库）由 2fede84c 通过 `git rm --cached .mcp.env` + .gitignore 止血（历史 commit 仍含旧 token，需用户轮换）。**H/M 系列 5 项全部未修复**，且其中 H-2/H-3/H-4/M-4 在修复轮新代码（strategy-orchestrator、self-evolution-core、self-scanner）中继续存在。

---

## 二、本轮新发现（按严重程度）

### 🔴 NEW-1 · CRITICAL · 修复轮引入的真实回归：confinePath 无限递归崩溃
- **文件/行号**: `mcp/mcp-server-http.js:19-22`（fd190f7b 为修 M-1 引入）
- **问题描述**:
  ```js
  function confinePath(filePath, root) {
    const res = confinePath(filePath, root);   // ← 递归调用自身，应为 guardPath
    return res && res.safe ? res.resolved : null;
  }
  ```
  第 20 行调用的是函数**自己**而非导入的 `guardPath`，形成无限递归。`confinePath` 被 3 处调用（:1082 / :1101 / :1151，benchmark 数据目录与 filePath 解析入口）。任何一次调用都会抛 `RangeError: Maximum call stack size exceeded`，MCP HTTP 服务器的这 3 个路径处理入口全部崩溃。
- **是否误报**: 否（真实运行证据）：
  ```
  $ node -e "...复现 confinePath 自递归..."
  CRASH: RangeError - Maximum call stack size exceeded
  ```
  当前 HEAD 05cc7502 未改动该文件，bug 仍在。
- **严重度**: CRITICAL —— 修复 M-1 时引入，等于把「confinePath 未定义（ReferenceError）」变成了「confinePath 无限递归（RangeError）」，MCP 路径约束功能从「恒崩」变为「更隐蔽的恒崩」，且门禁 121 用例未覆盖 mcp-server-http.js 的这 3 个调用点（漏测）。
- **建议**: 第 20 行改为 `const res = guardPath(filePath, [root]);`（guardPath 签名见 `src/core/path-guard.js`）。

### 🟠 NEW-2 · HIGH · strategy-orchestrator 维度错位（H-2 未修，且为 v6.0.61 引入的回归）
- **文件/行号**: `src/cortex/self-evolution/strategy-orchestrator.js:19-51`（CAPABILITY_MAP）与 :97-102（弱点直驱写入维度）
- **问题描述**: `CAPABILITY_MAP` 定义的维度为 `liveness / strategy_inference / auditable_transparency / local_zero_dependency / multi_agent_discipline / safety_governance` 共 6 个。但 self_scan 弱点直驱代码（:97-102）写入的维度是 `maintainability / reliability / testing / architecture` —— **这 4 个维度根本不在 CAPABILITY_MAP 中**。后果：
  1. 排序输出时（:128）`CAPABILITY_MAP.find(...)` 对这 4 维返回 `undefined`，`desc` 全为空字符串，下游消费方拿不到维度描述；
  2. 两套坐标系（信号关键词维度 vs 弱点直驱维度）混在同一 `scores` 对象排序，弱点维度无 weight 参与信号打分，逻辑不统一；
  3. 若下游用白名单只允许 CAPABILITY_MAP 中的 6 维，这 4 维会被静默丢弃，优先级失真。
- **是否误报**: 否（真实运行证据）：
  ```
  orchestrate([self_scan: 50 TODO + 2 dead probes]) ->
    priorities.dimension 含 maintainability/reliability/architecture/testing,
    其 desc 全部为 ''（空）
  ```
- **严重度**: HIGH（战略推演优先级失真，且是自称"真升级"的 v6.0.61 引入的回归）。
- **建议**: 弱点直驱写入的维度应映射到 CAPABILITY_MAP 已有维度（或扩展 CAPABILITY_MAP 显式声明这 4 维并补 weight/desc），保证 single source of truth。

### 🟠 NEW-3 · HIGH · evolve 过早收敛 / 假闭环（H-3 未修）
- **文件/行号**: `src/cortex/self-evolution/self-evolution-core.js:255-420`（evolve），:267（`previousImprovement=Infinity`），:432-446（`_calculateImprovement`）
- **问题描述**:
  1. `_calculateImprovement`（:432）是**纯计数器**：`newKnowledge*0.1 + insights*0.2 + improvements*0.15`。同一 input、代码库未变时，每次迭代 learn() 返回相同计数 → `currentImprovement` 恒定。
  2. 收敛检测（:333-343）：第 1 次迭代跳过（i>1 假），随后 `previousImprovement=currentImprovement`（:347）立即赋值。第 2 次迭代 `improvementDelta=|prev-cur|=0 < 0.01` → **`converged=true`**。
  3. 结果：maxIterations=10 下 evolve **永远只跑 2 次迭代即"收敛"返回**。`Infinity` 初始化（:267）未能起到"首轮不收敛"的缓冲作用（因赋值顺序问题，实际第 2 次就收敛）。
  4. 更深层的假闭环：evolve 只生成 goals/plan/reflection 文本并 `updateGrowth`（更新内存计数器），**不修改任何源文件**，所谓"进化"是文本生成而非真实代码改动。
- **是否误报**: 否。收敛阈值在恒定度量下完全失效（恒等于 0），迭代循环形同虚设。
- **严重度**: HIGH（自我进化引擎的核心迭代机制失效，"收敛"是假象）。
- **建议**: ① 收敛判定应基于"真实改进度量"（如弱点数量下降、测试通过率提升），而非固定计数器；② `previousImprovement` 初始化为 `null`，首轮（i===1）后首个真实值应与"上一轮基线"比而非与前一次比；③ 明确 evolve 是否应承担真实代码改动，避免"假闭环"误导。

### 🟡 NEW-4 · MEDIUM · explore 探针仅查开关不验证行为（H-4 + M-4 同根因，未修）
- **文件/行号**: `src/cortex/self-evolution/self-scanner.js:180-202`（`_probeLiveness`），关键行 :185
- **问题描述**:
  ```js
  const alive = process.env.HEARTFLOW_SELF_EVOLVE_EXPLORE === '1';
  ```
  探针只检查**环境变量是否等于 '1'**，不实际调用 `explore()` 验证其是否真的返回非空（注释 :190 自承"需用 explore() 实际返回非空验证"但代码未做）。
  - 若环境变量='1' 但 `explore()` 因网络/API 故障返回空，探针仍报 `alive:true` → **假阳性（M-4）**：沉默失效被掩盖。
  - 这正是 H-4"explore 误诊断"的根因：诊断只看开关，不看实际能力输出。
- **是否误报**: 否（逻辑确证，无需 PoC）。
- **严重度**: MEDIUM（探针是"发现自身问题"的根因修复宣称，但实际仍会漏报沉默失效）。
- **建议**: 探针应实际调用 `explore()`（或在 EXPLORE=1 时检查 `learning.arxivGaps` 是否非空），以运行时行为而非环境变量作为 alive 判据。

### 🟡 NEW-5 · MEDIUM · 冷却计时器 / 违规计数非持久化（M-3 未修）
- **文件/行号**: `src/shield/ethics/sage-guardian.js:42-43`（`violationCount`/`cooldownUntil` 内存态），:218-220 / :226-231；调用方 `goedel-engine.js:49`（`new SAGEGuardian` 每次新建实例）
- **问题描述**:
  - `cooldownUntil` 是进程内存中的 `Date` 对象，进程重启（pm2/daemon 常见）即归零 → 冷却保护失效。
  - `violationCount` 同样内存态，不持久化 → 长期违规者重启后清零。
  - 更严重：goedel-engine.js:49 每次 `new SAGEGuardian(projectRoot)` 新建实例，若 goedel-engine 被多次实例化，冷却从未跨调用累积（单实例内有效，跨实例/重启失效）。
  - `isInCooldown`（:226）比较方向正确（`new Date() < cooldownUntil`），无比较 bug，缺陷在"非持久化"。
- **是否误报**: 否（逻辑确证）。
- **严重度**: MEDIUM（长期运行服务下冷却/违规统计失效，属静默失效）。
- **建议**: 将 `cooldownUntil`/`violationCount` 持久化到磁盘（如 self-evolution 的 `internal/data/` 或独立 JSON），并在构造时加载；或改为依赖外部存储的冷却标记。

### 🟡 NEW-6 · LOW · VERSION 与 commit message 不一致（版本铁律违反）
- **文件/行号**: `VERSION` 文件 = `6.0.64`；HEAD commit message 称 `v6.0.65`
- **问题描述**: 35eecdb8 曾"版本号对齐到 v6.0.64"，但后续 2fede84c/fd190f7b 的 commit message 均称 v6.0.65，VERSION 文件未同步。违反上轮审计"版本一致性"铁律。
- **是否误报**: 否。
- **严重度**: LOW（文档一致性，不影响运行）。
- **建议**: 将 VERSION 改为 6.0.65 或统一降低 commit message 版本号。

---

## 三、误报清单（命中即报会被误判，已读上下文确认非缺陷）

1. **`test/run-all.js:246/308/313` 孤立 `}` 与 net brace delta -2**：非缺陷。语法 `node --check` 通过，实跑退出码 0，所有测试套件真实执行。孤立 `}` 属旧修复遗留的视觉噪音（多余闭合被其他位置缺失闭合抵消），不影响可达性。C-1 已真修复。
2. **`path-guard.js` 的 `includes('..')` 死代码**：防御性冗余，非本次对抗评审范围（属安全专项，已在 SECURITY-AUDIT-2026-07-20 判定误报）。
3. **`self-evolution-core.js:2021` 残留 `/** 来源: HeartFlowEvolution.retrieveLessons() */` 注释块**：仅是孤立注释，无函数定义，不造成双定义（C-2 已确证单定义）。非缺陷。
4. **`evolve` 的 `Infinity` 初始化（:267）**：初看疑似"首轮不收敛"逻辑 bug，实跑证明第 2 次即收敛——根因在赋值顺序而非 Infinity 本身。已归入 NEW-3 作为"过早收敛"整体描述，Infinity 单独不构成独立缺陷。
5. **`strategy-orchestrator.js` 弱点维度不在 CAPABILITY_MAP**：看似"只是 desc 为空的小问题"，实跑证明会导致优先级维度 desc 全空且坐标系混用（NEW-2），**非误报**——此处特别说明：初判易误判为 cosmetic，经运行验证为真实 HIGH。

---

## 四、综合结论

1. **上轮 CRITICAL 验收**：C-1、C-2 确属真修复（均有实跑证据）；C-3 已止血（入库停止，历史 token 仍需轮换）。
2. **上轮 H/M 系列验收**：H-2、H-3、H-4、M-3、M-4 **全部未修复**，且 H-2/H-3/H-4/M-4 在修复轮新代码中继续存在（H-2 为 v6.0.61 引入的回归）。
3. **修复轮新引入缺陷**：fd190f7b 修 M-1 时引入 **NEW-1（CRITICAL 无限递归）**——把"confinePath 未定义"变成"confinePath 自递归崩溃"，MCP HTTP 服务器 3 个路径入口全部失效，且门禁 121 用例未覆盖该路径（漏测导致假绿）。
4. **版本铁律**：VERSION(6.0.64) 与 commit message(v6.0.65) 不一致（NEW-6）。
5. **核心系统性问题**：多个"自称已修复/真升级"的改动（strategy-orchestrator v6.0.61、M-1 修复 fd190f7b、evolve 收敛）实际仍存在逻辑缺陷或引入新崩溃，说明修复缺乏"运行级验证闭环"——门禁测试未覆盖关键调用路径（mcp-server-http、strategy-orchestrator 输出消费方、evolve 迭代计数），导致假绿。

**一句话**：上轮对抗评审的 CRITICAL 已真修，但 H/M 系列 5 项无一修复，且修复轮新引入 1 个 CRITICAL（confinePath 无限递归）与多个 HIGH/MEDIUM 逻辑缺陷；评审闭环本身存在漏测假绿。
