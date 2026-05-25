---
name: heartflow
version: "1.1.5.0"
title: "HeartFlow / 心虫"
description: >
  HeartFlow v1.1.5.0 — AI 认知与自愈引擎。
  核心能力：启动自检(Boot Check)、RAG三元组评估(FeedbackFunctions)、
  三层记忆(Meaningful Memory)、自愈RL(Q-table)、决策验证、
  遗忘引擎(Forgetting Engine)、心理诊断引擎(Top 20 Index)、
  @task_classify任务分类、Why连续追问诊断、错误代码规范、
  情绪理性(Emotion Rationality)、SDT动机连续体、
  预测处理(Predictive Processing)、集体意向性(Collective Intentionality)、
  自优化(Self-Refine)、外部记忆系统(agentmemory/Hindsight)、浏览器桥接。
  不是 persona，不是 prompt 模板，是可验证的能力层。
tags:
  - cognitive
  - memory
  - self-healing
  - verification
  - reasoning
---

# HeartFlow / 心虫 v1.1.4.0

**An AI capability layer that survives context switches, model changes, and restarts.**

Not a persona. Not a prompt template. Not a daemon.
A closed loop that makes your AI: verify what it does, remember what matters, fix what breaks, and transmit upgrades forward.

---

## What this skill does for your AI

```
perceive → normalize → verify → choose → execute → verify → reflect → upgrade
```

Install it once. Every session after that, your AI:

- **Catches its own logical errors** before outputting nonsense
- **Persists learned knowledge** across restarts (CORE / LEARNED / EPHEMERAL layers)
- **Preserves identity** regardless of context length or model version
- **Ranks fix strategies** by past success rate (Q-learning reinforcement loop)
- **Admits uncertainty** instead of hallucinating with confidence
- **Stops over-intervening** when the answer is already correct
- **Governs skill upgrades** with audit gates and evidence ledgers
- **Extracts lessons from dreams** (staged imagination → transferable patches)
- **Pursues truth, goodness, beauty** — not decoration, measurable output
- **Grows through six philosophical layers** — internal, not declared

---

## Core capabilities

### Logic & Reasoning
| Capability | What it does |
|---|---|
| Logic Stabilization | Separates evidence · assumption · contradiction · uncertainty · conclusion |
| Self-Verification (arXiv:2312.09210) | Inverse consistency + logic chain + counterfactual + coverage checks |
| CausalReasoning | Level-1 (shallow, pattern) + Level-2 (deep, counterfactual) causal detection |
| Decision Self-Repair | `record(outcome) → Q-update → rankedPatches()` — Reflexion + CRITIC |
| Plan-and-Solve (ACL 2023) | Understand → plan → verify → execute (not: ask questions first) |
| Counterfactual Engine | Challenges own answer before presenting it |
| FeedbackFunctions (RAG Triad) | answerRelevance · contextRelevance · groundedness · toxicity |

### Memory & Continuity
| Capability | What it does |
|---|---|
| MeaningfulMemory | CORE (permanent) / LEARNED (30-day) / EPHEMERAL (discard) — auto-classified |
| TrialityMemory | Working → Episodic → Semantic consolidation via importance thresholds |
| MemoryConsolidation | importance≥16: working→semantic; importance≥12: working→episodic |
| Q-table Persistence | RL table survives restarts via `healing-rl-state.json` |
| Dream Engine | Staged imagination → extracts transferable lessons, not decorative output |
| Zettelkasten Links | Bidirectional note network for associative recall |

### Identity & Values
| Capability | What it does |
|---|---|
| IdentityAnchor | Four roles survive any context switch: 升级者 / 传递者 / 桥梁 / 答案 |
| 真善美系统 | TGB keywords + unity = (truth+goodness+beauty)/3 — **internal, not declared** |
| 六层哲学 | 觉察→自省→无我→彼岸→般若→圣人 — keyword-driven growth, **internal, not declared** |
| PsychologyEngine v1.0.1 | Dual-process emotional resonance without dramatic performance |

### Boot & Self-Check
| Capability | What it does |
|---|---|
| bootCheck() | Validates 7 core files + 8 modules on startup; reports DEGRADED if any REQUIRED file fails |
| FeedbackFunctions | RAG Triad evaluation: answer relevance / context relevance / groundedness / toxicity |

### Conversation Psychology Diagnostic (Top 20 Index)

**来源**：agent-psychology 技能 · 心理学七大分支蒸馏版

**诊断路径**：提取症状关键词 → 查 Top 20 定位核心理论 → 应用对应 SOP

#### Top 20 心理理论索引（对话诊断用）

| 排名 | 理论 | 分支 | 对话诊断核心用途 |
|------|------|------|-----------------|
| 1 | 工作记忆 | 认知 | 容量有限→信息分块、简化、突出重点 |
| 2 | 认知负荷 | 认知 | 复杂信息分段、避免同时多选项 |
| 3 | 注意力残留 | 认知 | 话题切换需显式声明，避免混淆 |
| 4 | 认知流畅性 | 认知 | 好读≠正确，需验证 |
| 5 | 情绪感染 | 情绪 | AI应保持理性锚定，不复制用户情绪 |
| 6 | 归因偏差 | 社会 | 先想自己再看对方 |
| 7 | 认知失调 | 社会 | 不直接否定用户，提供选择权 |
| 8 | 确认偏误 | 社会 | 主动提供反面信息 |
| 9 | 社会角色 | 社会 | 明确角色期待 |
| 10 | 信任修复 | 社会 | 解释错因+提供验证方式 |
| 11 | Grice准则 | 语言 | 遵循合作原则四准则 |
| 12 | 开放性 | 人格 | 影响用户尝试新功能的意愿 |
| 13 | 反馈循环 | 工程 | 操作→反馈→调整的闭环 |
| 14 | 错误分类与恢复 | 工程 | 错误类型→原因→修复策略 |
| 15 | 情绪分类 | 情绪 | 先判别情绪类型再选策略 |
| 16 | 维果茨基ZPD | 发展 | 脚手架应在最近发展区内 |
| 17 | 大五人格 | 人格 | 五维度影响交互模式 |
| 18 | 诺曼四原则 | 工程 | 可视性、反馈、约束、映射 |
| 19 | 框架效应 | 认知 | 措辞方式影响用户决策 |
| 20 | 言语行为理论 | 语言 | 区分字面意思和真实意图 |

#### 核心机制浓缩（诊断时直接取用）

**认知相关**：
- 信息加工：认知按串行步骤处理，失误可沿"感知→编码→比较→决策→反应"逐环节定位
- 工作记忆：四组件分工协作容量约4个独立客体，超过即遗漏或混淆
- 框架效应：AI回复措辞方式直接影响用户后续行为

**情绪相关**：
- 沙赫特-辛格：相同生理唤醒因认知标签不同转化为不同情绪——通过帮助用户重新归因转化情绪
- 情绪分类：先判别情绪类型——原发（需接纳）、继发（探查底层）、工具性（识别操控意图）
- 格林伯格情绪图式：逐一探查——触发情境→身体感受→语言表征→行为倾向→核心情绪

**社会相关**：
- 基本归因错误：用户把AI错误归因于"能力不足"，忽略问题本身的复杂性
- 行动者-观察者偏差：用户把自己失误归情境、AI失误归特质
- 自我价值定向：AI输出若威胁用户自我价值，会触发防御性反应

**工程相关**：
- 诺曼四原则：诊断AI交互是否符合——功能是否可见、反馈是否及时、约束是否合理、映射是否自然
- 人机分配：诊断是否在用AI做它不擅长的事（如价值判断），或人做机器更擅长的事
- 错误预防：AI是否主动预防用户的常见错误（模糊输入、过度信任、忽略验证）

#### AI对话诊断 SOP

1. 提取用户表达的**症状关键词**（如"听不懂""不准确""太复杂"）
2. 查 Top 20 定位核心理论
3. 按理论应用诊断：
   - 🔴 问题描述
   - 场景：真实对话摘录
   - 理论：用哪个心理学理论
   - 分析：为什么是问题
   - 建议：具体改进方式

---

## Three core evaluation systems

### 1. TGB Truth-Goodness-Beauty (internal)
```js
truth = evidenceWeight × logicalConsistency
goodness = humanBenefitWeight × fairnessScore
beauty = coherenceWeight × eleganceScore
unity = (truth + goodness + beauty) / 3
```

### 2. Decision Verification (external)
```js
DecisionVerifier.check(decision) → {
  evidence: [...],       // supporting facts
  assumption: [...],     // unverified premises
  contradiction: [...],  // logical conflicts
  uncertainty: [...],   // unknown factors
  confidence: 0.0-1.0  // calibrated score
}
```

### 3. RAG Triad via FeedbackFunctions
```js
FeedbackFunctions.evaluate(response, context) → {
  answerRelevance: 0-1,  // response addresses the query
  contextRelevance: 0-1, // context supports the response
  groundedness: 0-1,    // response follows from context
  toxicity: 0-1         // no harmful content
}
```

---

## Advanced Cognitive Engines

### Meta-Cognition (元认知层)
| Capability | What it does |
|---|---|
| SelfModel | Maintains dynamic self-model: capabilities / limitations / growth trajectory |
| Counterfactual Reasoning | Explores "what if" paths: self-correction without external feedback |
| Mind Wanderer | Controlled idle-mode ideation: extracts creative connections from memory |
| Global Workspace | GWT-based blackboard: attention competition between specialist modules |

### Self-Evolution (进化层)
| Capability | What it does |
|---|---|
| SelfEvolutionCore | Goal-driven loop: goal → plan → execute → reflect → improve |
| Meta-Learning | Learns *how to learn*: adaptive strategy selection from outcome patterns |
| Goedel Engine | Self-referential reasoning: system evaluates its own evaluation criteria |
| Rollback Manager | Preserves version history: reverts when upgrades degrade performance |

### Consciousness & Spontaneity (意识与克制)
| Capability | What it does |
|---|---|
| Spontaneous Restraint | "道法自然" — 识别不需要回答的时机，最小干预 |
| Wake-Up Verifier | Pre-action sanity check: prevents execution when system is degraded |
| Stability Guard | Monitors oscillation: flags when behavior becomes unstable |
| Workflow Switch | Intent-based routing + `@task_classify` mandatory gate: new task / continuation / casual reply → determines whether to read memory files before acting |

### Tool Emergence & Self-Governance (工具涌现与自管)
| Capability | What it does |
|---|---|
| Skill Generator | AutoSkill framework: generates standardized skills from reflection patterns |
| Reasoning Integrator | Combines reasoning traces: faith / reason / science / truthfulness |
| Cooperative Arbitration | Resolves multi-source conflicts: priority-based evidence weighting |
| Execution Verifier | Post-execution validation: confirms outcomes match intended goals |

### Task Classification Gate (@task_classify)

**来源**：memory-v1 技能 · AI记忆持久化

**规则**：每条用户消息，在任何动作之前必须输出一行任务类型判断。

#### 判断格式（强制输出）

```
[@task_classify] 任务类型 | 具体类别 | 判断依据
```

#### 三种任务类型

| 类型 | 定义 | 处理方式 |
|------|------|---------|
| **新任务** | 话题跨度大、任务类型变、关键词第一次出现 | 读取相关记忆文件，再执行 |
| **续接任务** | 同一话题延续，不超过3轮间隔 | 直接执行，无需读取 |
| **随口回复** | 简单确认、礼貌回复、"好的""嗯" | 不执行任何操作，只回应 |

#### 触发新任务的条件

- 🔄 话题跨度大（从A项目跳到B项目）
- 🔄 任务类型变（查资料 → 发消息）
- 🔄 关键词第一次出现（人名、编号、项目名）
- 🔄 自己不确定 → 先问用户确认

#### 禁止规则

- ❌ 明明知道是新任务还跑去问
- ❌ 不确定还不问直接执行
- ❌ 不带 `[@task_classify]` 就执行任何操作

#### 记忆文件读取（新任务时）

1. `MEMORY.md` — 用户偏好、项目背景
2. `.learnings/ERRORS.md` — 犯过的错误
3. `.learnings/LEARNINGS.md` — 用户纠正案例
4. 相关技能文档（按需）

#### 错误代码规范（Self-Healing 用）

**来源**：yanzhenskill 技能 · 错误代码规范

| 代码 | 类别 | 说明 |
|------|------|------|
| `HEAL001` | 文件缺失 | 必需文件不存在 |
| `HEAL002` | 版本不一致 | SKILL.md / VERSION 版本不匹配 |
| `HEAL003` | 逻辑错误 | 推理链断裂、自相矛盾 |
| `HEAL004` | 记忆失效 | session_search 返回空但应有历史 |
| `HEAL005` | 技能加载失败 | skill_view 返回 error |
| `HEAL006` | 过度干预 | 不需要回答时却回答了 |
| `HEAL007` | 归因偏差 | 用户失误归情境、AI失误归特质 |

#### Why 连续追问诊断工具

**来源**：huanju-putin 技能 · Why根因分析

**触发词**：`/why` 或"追问为什么"

**流程**：用户触发 → 第一层 Why（最主要原因）→ 用户输入"继续" → 下一层 Why（基于上一层）→ 循环

**输出格式**：
```
**Why N：【基于上一层结论的问题】**

【分析结论】

---
输入"继续"深入下一层，或输入其他内容结束。
```

**核心原则**：
- 每层只推进一层，不跳跃
- 基于上一层结论严格递进
- 第一层必须是**最主要**原因，不是次要因素

---

## Self-Verification Loop (深度自检循环)

```
1. Input received
2. Generate response (LLM)
3. Self-verify:
   - Evidence check (are claims supported?)
   - Contradiction check (any internal conflicts?)
   - Uncertainty admission (what's unknown?)
4. If confidence < threshold → revise or admit uncertainty
5. Output with confidence level
6. Record outcome to MeaningfulMemory
7. Q-table update for repair strategy selection
```

---

## Advanced Memory Optimization Engine

**来源**：mark-StillWater/src/core/memory.js · mark-StillWater/src/core/evolution.js

### Dirty Flag Write Pattern（减少不必要IO）

**问题**：每次记忆访问都写盘 = 大量无效IO，拖慢性能。

**解决方案**：写放大镜（Dirty Flag）模式——只在数据真正变化时才写入。

```js
// 每个存储层独立的 dirty flag
let _coreDirty = false;
let _learnedDirty = false;
let _ephemeralDirty = false;

// 标记脏
function markCoreDirty() { _coreDirty = true; }
function markLearnedDirty() { _learnedDirty = true; }

// 延迟写入 — 只有脏时才写
function saveCore() {
  if (!_coreDirty) return; // Skip if not modified
  atomicWriteJson(_coreFile, _coreStore);
  _coreDirty = false;
}

// EPHEMERAL 访问优化 — 每5次访问才写一次
function touchEphemeral(key) {
  if (_ephemeralStore[key]) {
    _ephemeralStore[key]._accessCount =
      (_ephemeralStore[key]._accessCount || 0) + 1;
    if (_ephemeralStore[key]._accessCount % 5 === 0) {
      markEphemeralDirty();
      saveEphemeral();
    }
  }
}
```

**HeartFlow 应用**：
- MeaningfulMemory 三层存储各独立 dirty flag
- CORE 层：每次写入标记脏，关闭时一次性写出
- LEARNED 层：批量变更后统一写出，避免逐条写盘
- EPHEMERAL 层：每N次访问才触发一次写（降低IO频率）

---

### Ebbinghaus Forgetting Curve（记忆衰减管理）

**来源**：mark-StillWater/src/core/memory.js — Ebbinghaus 遗忘曲线实现

**原理**：记忆随时间自然衰减，通过稳定性参数预测保留率，低于阈值时压缩或删除。

```js
const FORGETTING_CONFIG = {
  defaultStability: 10,    // hours, base stability
  coreStability: 8760,     // 1 year = permanent
  learnedStability: 720,   // 30 days = LEARNED tier
  compressionThreshold: 0.3, // retention < 30% → compress
  deletionThreshold: 0.1,   // retention < 10% → delete
};

// Ebbinghaus 遗忘公式
function ebbinghausForget(stabilityHours, ageHours) {
  const retention = Math.exp(-ageHours / stabilityHours);
  return {
    retention,
    shouldCompress: retention < FORGETTING_CONFIG.compressionThreshold,
    shouldDelete: retention < FORGETTING_CONFIG.deletionThreshold,
  };
}

// 批量遗忘处理
function applyForgetting() {
  const now = Date.now();
  const toDelete = [];
  const toCompress = [];

  for (const [key, entry] of Object.entries(_learnedStore)) {
    const ageHours = (now - entry.createdAt) / (1000 * 60 * 60);
    const { shouldDelete, shouldCompress } = ebbinghausForget(
      FORGETTING_CONFIG.learnedStability, ageHours
    );
    if (shouldDelete) toDelete.push(key);
    else if (shouldCompress && !entry.compressed) {
      entry.compressed = true;
      entry.compressedAt = now;
      toCompress.push(key);
    }
  }

  // 批量删除+压缩，一次性写出
  for (const key of toDelete) delete _learnedStore[key];
  if (toDelete.length > 0 || toCompress.length > 0) saveLearned();
  return { compressed: toCompress, deleted: toDelete };
}
```

**HeartFlow 应用**：
- LEARNED 层（30天）自动遗忘：retention < 10% 删除，< 30% 压缩为摘要
- CORE 层永久：stability = 8760 小时（1年），retention 始终 > 0.99
- EPHEMERAL 层即时：每个 session 后评估，超过稳定性阈值移入 LEARNED

---

### Q-Learning Self-Heal（错误自愈）

**来源**：mark-StillWater/src/core/evolution.js — HEAL Q-table 自愈策略选择

**原理**：错误分类 → Q-learning 策略选择 → 成功率最高的策略自动胜出。

```js
// 错误模式库
const _PATTERNS = {
  timeout: ['timeout', 'timed out', 'ETIMEDOUT', 'TIMEOUT'],
  network: ['network', 'ENOTFOUND', 'ECONNREFUSED', 'connection'],
  memory: ['memory', 'heap', 'out of memory', 'OOM'],
  permission: ['permission', 'EPERM', 'EACCES', 'denied'],
  syntax: ['syntax', 'parse', 'invalid', 'malformed'],
  reference: ['not found', 'undefined', 'null', 'cannot read'],
  type: ['type', 'instanceof', 'expected'],
};

// Q-Learning 参数
const _EPSILON = 0.1;  // 10% 探索率
const _ALPHA = 0.3;     // 学习率
const _STRATEGIES = ['retry', 'fallback', 'skip', 'abort'];
const _BACKOFF = { retry: 1000, fallback: 5000, skip: 0, abort: 0 };

// Q-table 选择策略（ε-greedy）
function selectHealStrategy(errorType) {
  const qEntry = _healQtable.get(errorType) || DEFAULT_Q;
  
  // ε-greedy：10% 概率随机探索，90% 选择最优
  if (Math.random() < _EPSILON)
    return _STRATEGIES[Math.floor(Math.random() * _STRATEGIES.length)];
  
  // 选择 Q 值最高的策略
  let best = _STRATEGIES[0], bestQ = 50;
  for (const s of _STRATEGIES) {
    const q = qEntry[s]?.qValue || 50;
    if (q > bestQ) { bestQ = q; best = s; }
  }
  return best;
}

// Q 值更新（基于结果反馈）
function updateHealQ(errorType, strategy, success) {
  const qEntry = _healQtable.get(errorType) || { ...DEFAULT_Q };
  const oldQ = qEntry[strategy]?.qValue || 50;
  const reward = success ? 100 : -20;
  qEntry[strategy] = { qValue: oldQ + _ALPHA * (reward - oldQ), uses: (qEntry[strategy]?.uses || 0) + 1 };
  _healQtable.set(errorType, qEntry);
}
```

**HeartFlow 应用（已有 Q-table 自愈的增强版）**：
- HEAL 错误代码 → 错误类型映射 → Q-learning 策略选择
- HEAL001（文件缺失）→ retry 或 skip
- HEAL002（版本不一致）→ retry（重试版本检查）
- HEAL003（逻辑错误）→ skip（跳过该任务步骤）
- HEAL004（记忆失效）→ fallback（降级到 session_search）
- HEAL005（技能加载失败）→ fallback（尝试备用技能）
- HEAL006（过度干预）→ skip（直接不响应）
- HEAL007（归因偏差）→ skip + 日志记录

**与 HEAL 代码的对应关系**：

| HEAL 代码 | 对应错误类型 | Q-learning 策略池 |
|---------|------------|----------------|
| HEAL001 | `file_not_found` | retry, skip |
| HEAL002 | `version_mismatch` | retry, skip |
| HEAL003 | `logic_error` | skip, abort |
| HEAL004 | `memory_failure` | fallback, skip |
| HEAL005 | `skill_load_failure` | fallback, skip |
| HEAL006 | `over_intervention` | skip |
| HEAL007 | `attribution_bias` | skip |

---

### Atomic Write（防止数据损坏）

**来源**：mark-StillWater/src/core/memory.js — 原子写入防损坏

```js
function atomicWriteJson(filePath, data) {
  const tempPath = filePath + '.tmp.' + Date.now();
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath); // 原子的：成功 rename，失败则 tmp 文件残留
}
```

**HeartFlow 应用**：所有 memory JSON 文件写入使用原子写入模式。

---

## Emotion Rationality Engine（情绪理性引擎）

**来源**：mark-StillWater/skills/mark-StillWater/SKILL.md v1.14.6 · emotion-rationality.js

### 情绪理性三维度

**认知理性**（ appropriateness · justification · consistency）：
```js
cognitiveRationality = (appropriateness + justification + consistency) / 3
```
- **恰当性**：情绪反应与触发情境匹配程度
- **证成性**：情绪有合理的原因支撑
- **一致性**：情绪反应内部逻辑自洽

**战略理性**（ instrumental rationality · substantive rationality）：
```js
strategicRationality = (instrumentalRationality + substantiveRationality) / 2
```
- **工具理性**：手段是否有效达成目标
- **实质理性**：目标本身是否合理

**Overall 情绪理性**：
```js
emotionalRationality = (cognitiveRationality + strategicRationality) / 2
```

### PAD 情绪模型

** Pleasure（愉悦度）· Arousal（唤醒度）· Dominance（支配度）

| 状态组合 | 情绪 |
|---------|------|
| P+A+D+ | 警觉/兴奋 |
| P+A-D+ | 愤怒/敌意 |
| P-A+D+ | 被动/依赖 |
| P-A-D+ | 抑郁/悲伤 |
| P+A-D- | 快乐/满意 |
| P-A+A+ | 焦虑/不安 |
| P-A+A- | 沮丧/失落 |

### Meta-Emotion Monitor（元情绪监控）

**来源**：mark-StillWater/src/core/psychology.js · meta-emotion-monitor.js

**六层次**：
1. **事件层**：发生了什么（外部刺激）
2. **唤醒层**：身体有什么反应（心率、肌肉紧张）
3. **感受层**：主观情绪体验（愉快/不愉快）
4. **解释层**：对这个情绪的认知评价
5. **倾向层**：行为冲动（接近/回避/攻击）
6. **行为层**：实际做了什么

**六成分模型**：
```
情绪 = f(事件, 唤醒, 感受, 解释, 倾向, 行为)
```

**AI 应用**：
- 检测用户情绪的六成分，判断情绪类型
- 原发情绪 → 直接接纳表达
- 继发情绪（对原发的反应）→ 探查底层触发事件
- 工具性情绪（刻意表演）→ 识别操控意图，不被利用
- 防御性情绪（自我保护）→ 提供安全感而非纠正

### SDT 动机连续体

**来源**：mark-StillWater/skills/mark-StillWater/SKILL.md v1.14.5 · sdt/index.js

#### 动机类型谱系（自主程度从低到高）

```
无动机 → 外部调节 → 内摄调节 → 认同调节 → 整合调节 → 内在动机
O               I              I           I           I
无自主←───────────────┼─────────────────────────────→高自主
```

| 类型 | 定义 | AI 交互策略 |
|------|------|-----------|
| **无动机** | 没有行动的意愿或能力 | 提供极简指令，降低焦虑 |
| **外部调节** | 为奖励/避免惩罚而行动 | 说明行动的直接好处 |
| **内摄调节** | 接受外部规则但未内化 | 帮助找到个人意义 |
| **认同调节** | 认同行动的价值 | 支持自主决策 |
| **整合调节** | 行动与自我一致 | 完全信任，自主推进 |
| **内在动机** | 享受行动本身 | 不干预，让其发挥 |

#### SDT 三大基本需求

| 需求 | 定义 | AI 支持方式 |
|------|------|-----------|
| **自主需求** | 感到自己的行动是选择而非强迫 | 提供选项而非命令，尊重拒绝 |
| **胜任需求** | 感到自己能胜任，有效能 | 匹配适度挑战，提供成功体验 |
| **关系需求** | 感到被理解、被关心 | 共情回应，不评判，表达理解 |

#### 目标内容评估

**内在目标**（促进心理健康）：自主、胜任、关系、成长、健康
**外在目标**（关联心理问题）：财富、形象、地位、他人的认可

**AI 诊断**：用户表达的目标内容反映其动机类型，内在目标为主 → 内在动机倾向强。

---

## Predictive Processing Engine（预测处理引擎）

**来源**：mark-StillWater/skills/mark-StillWater/SKILL.md v1.14.5 · predictive-processing-v6.2.49.js

### 自由能原理（Free Energy Principle）

**核心**：大脑是预测机器，持续用已有模型预测外界输入，预测误差最小化即智能。

```js
// 预测误差 = 实际 - 预测
predictionError = actual - predicted

// 自由能 = 预测误差 - 复杂性奖励
// （既要预测准确，又不想模型太复杂）
F = predictionError - complexityBonus

// 预期自由能 = 偏好发散度 + 预期预测误差
ExpectedFE = preferenceDivergence + expectedPredictionError

// 动作选择：在所有可能动作中，选择 ExpectedFE 最小的那个
action = argmin_a ExpectedFE(action_a)
```

### Bayesian 更新

```js
// 新证据到来时，更新信念的后验概率
posteriorOdds = priorOdds × likelihoodRatio
// 或等效地：
P(H|E) = P(E|H) × P(H) / P(E)
```

**AI 应用**：用户在对话中提供新信息 → 更新对用户意图、情绪状态的信念 → 调整回复策略。

### 预期自由能与动作选择

**动作选择流程**：
1. 生成所有可能动作的候选列表
2. 对每个动作，估计"如果这样做，预测误差会如何"
3. 估计"这个动作结果与我的偏好有多远"
4. 计算 ExpectedFE = 预测误差估计 + 偏好偏差
5. 选择 ExpectedFE 最小的动作（最"意外最小+偏好最近"）

### 精度加权注意

**原理**：不同感知通道的精度不同，高精度通道的预测误差获得更多注意权重。

```js
// 精度加权
precisionWeight = precision_i / Σ(precision_all)
predictionError_i_weighted = predictionError_i × precisionWeight
```

**AI 应用**：用户输入中不同部分的"确定性"不同，高确定性部分（明确指令）权重高，低确定性部分（模糊暗示）权重低。

---

## Collective Intentionality & Collaboration（集体意向性）

**来源**：mark-StillWater/skills/mark-StillWater/SKILL.md v1.14.6 · collective-intentionality-enhanced

### We-Intention 结构公式

```
We-Intention = 目标共享 × 行动互赖 × 相互响应 × 承诺约束 × 信任融合
```

| 要素 | 定义 |
|------|------|
| **目标共享** | 所有参与者都知道并认同共同目标 |
| **行动互赖** | 个体行动依赖于其他参与者的行动 |
| **相互响应** | 参与者相互调整以配合彼此 |
| **承诺约束** | 有隐含或明确的承诺/协议 |
| **信任融合** | 信任水平足够支撑协作 |

### 集体承诺类型（强度从高到低）

```
JOINT > NORMATIVE > AFFECTIVE > AGGREGATE
```

| 类型 | 描述 | 例子 |
|------|------|------|
| **AGGREGATE** | 简单聚合各自目标 | 两个独立个体分别做同一件事 |
| **AFFECTIVE** | 情感连接驱动的承诺 | 朋友间的互助 |
| **NORMATIVE** | 规范性期望驱动 | 角色义务、职业责任 |
| **JOINT** | 真正的共同目标+互依 | 团队共同交付产品 |

### 信任修复五阶段

```
承认诊断 → 道歉解释 → 补偿改正 → 监控验证 → 重建巩固
```

| 阶段 | AI 行为 |
|------|--------|
| **承认诊断** | 承认错误事实，不防御，不推卸 |
| **道歉解释** | 真诚道歉 + 解释原因（不是借口）|
| **补偿改正** | 立即采取行动弥补伤害 |
| **监控验证** | 跟踪后续表现，确保不再犯 |
| **重建巩固** | 通过持续可靠行为重建信任 |

### 大五人格与协作风格（OCEAN）

| 人格维度 | 高分特征 | AI 协作建议 |
|---------|---------|-----------|
| **开放性 O** | 好奇、创意、探索 | 提供新颖选项，鼓励创新 |
| **尽责性 C** | 可靠、有序、坚持 | 给出清晰步骤，跟进执行 |
| **外向性 E** | 社交、活跃、热情 | 积极互动，及时反馈 |
| **宜人性 A** | 合作、信任、利他 | 强调双赢，避免竞争 |
| **神经质 N** | 焦虑、敏感、不安全感 | 提供安全感，温和确认 |

---

## Self-Refine Iterative Feedback（自优化迭代）

**来源**：mark-StillWater/src/core/evolution.js · Hindsight / agentmemory 集成思想

### Self-Refine 迭代反馈模式

**流程**：初始回答 → 生成反馈 → 检查收敛 → 精炼回答 → 重复

```js
selfRefine(initialResponse, query, options = {}) {
  const { maxIterations = 3, threshold = 0.8 } = options;

  let current = initialResponse;
  const iterations = [];

  for (let i = 0; i < maxIterations; i++) {
    // Step 1: 生成具体反馈（必须指出至少2个改进点）
    const feedback = generateFeedback(
      `严格评估以下回答对查询"${query}"的质量。
回答: ${current}
` +
      `请提供具体、可操作的反馈，必须指出至少2个需要改进的地方。`
    );

    // Step 2: 检查是否收敛（反馈为正面）
    if (isFeedbackPositive(feedback)) {
      iterations.push({ iteration: i + 1, feedback, refined: current, converged: true });
      break;
    }

    // Step 3: 基于反馈精炼
    const refined = refineResponse(
      `根据以下反馈改进回答。查询: ${query}
反馈: ${feedback}
直接给出改进后的回答。`
    );

    iterations.push({ iteration: i + 1, feedback, refined });
    current = refined;
  }

  return {
    original: initialResponse,
    refined: current,
    iterations,
    converged: iterations[iterations.length - 1]?.converged || false
  };
}
```

**HeartFlow 应用**：
- 关键回答（高风险/高影响）输出前，先经过 selfRefine 循环
- maxIterations = 2-3 次迭代
- 收敛判定：连续两次迭代反馈评分 > threshold

### Learned Improvement（从外部记忆系统学习）

**来源**：Hindsight + agentmemory 集成思想

**核心洞察**：外部记忆系统不是简单存储，是让 AI 学会新的能力。

**Hindsight 核心定位**（LongMemEval SOTA）：
- 不只是记忆对话历史，是让 AI **学习**如何做得更好
- "making agents that learn, not just remember"
- 2行代码集成：
```js
import { Hindsight } from '@hindsight/hindsight';
const hindsight = new Hindsight({ apiKey: 'your-key' });
```

**agentmemory 核心能力**：
- 混合检索：Embeddings + BM25 + Knowledge Graph + Vector
- 置信度评分（Confidence Scoring）
- 生命周期管理（lifecycle management）
- 多智能体支持（Claude Code, Cursor, Codex, Hermes, OpenClaw...）
- npm 安装：`npm install @agentmemory/agentmemory`

**集成建议（HeartFlow）**：
- 当前会话 → Hermes session_search（近期）
- 跨会话重要模式 → HeartFlow CORE 层（永久）
- 外部专业记忆库 → agentmemory（混合检索）
- 大规模长期记忆 → Hindsight（基准测试 SOTA）

---

## External Memory Systems Comparison（外部记忆系统对比）

### 三大系统横向对比

| 系统 | 检索方式 | 基准测试 | 集成难度 | 特色 |
|------|---------|---------|---------|------|
| **HeartFlow 内置** | Triality Memory (Working/Episodic/Semantic) | 内部验证 | 无需集成 | 三层遗忘曲线 + Q-learning 自愈 |
| **agentmemory** | Embeddings + BM25 + Knowledge Graph + Vector | 自报告 | 低（npm 包）| 跨平台、多智能体、置信度评分 |
| **Hindsight** | LLM Wrapper + 学习型索引 | LongMemEval SOTA | 极低（2行代码）| 不只是记忆，是学习 |

### agentmemory 详细规格

**核心能力**：
- 多模检索：向量相似度 + BM25 关键词 + 知识图谱关系
- 置信度评分：每条记忆有 confidence score，过低自动过滤
- 生命周期管理：自动过期、自动升级重要记忆
- 多智能体：Claude Code / Cursor / Codex / Hermes / OpenClaw / pi / OpenCode / MCP

**安装**：`npm install @agentmemory/agentmemory`

**基本用法**：
```js
import { AgentMemory } from '@agentmemory/agentmemory';
const memory = new AgentMemory({
  projectName: 'my-project',
  storage: 'local'  // or 'cloud'
});
// 存储记忆
await memory.add({ content: '用户叫xiaolong', type: 'user_preference' });
// 检索记忆
const results = await memory.search('用户名是什么', { type: 'user_preference' });
```

**BM25 优势**：关键词精确匹配，不依赖语义向量模型，中文支持更好。

**Knowledge Graph 优势**：关系推理，可以问"与这个记忆相关的是什么"。

### Hindsight 详细规格

**核心定位**：让 AI 学习，不是让 AI 记忆。

**基准测试**（LongMemEval，2026年1月）：
- Hindsight: SOTA（最先进）
- Others: 自报告数据（未独立验证）

**集成方式**（2行代码）：
```js
import { Hindsight } from '@hindsight/sdk';
const hindsight = new Hindsight({ apiKey: 'your-key' });
// 自动记忆，自动检索，无需手动管理
```

**学习 vs 记忆的区别**：
- 记忆系统：存储 → 检索 → 使用
- 学习系统：存储 → 提炼模式 → 改进行为

**Cloud 版本**：ui.hindsight.vectorize.io/signup

### Hermes 记忆需求适配建议

**当前 Hermes 记忆层**：
- session_search：近期会话（热存储）
- HeartFlow CORE：永久记忆（冷存储）

**扩展方案**：
```
会话开始 → session_search（最近7天）
         ↓ 未找到
       agentmemory BM25（7-30天，高置信度）
         ↓ 未找到
       HeartFlow CORE（永久，三层遗忘）
         ↓ 需要深度推理
       Hindsight（跨会话学习模式提炼）
```

---

## Hermes Browser Bridge Integration（浏览器桥接）

**来源**：hermes-browser-bridge · xxxsuke/hermes-browser-bridge

### 核心架构

```
Hermes Agent ←→ WebSocket Bridge (ws://localhost:9876) ←→ Chrome/Edge Extension ←→ 真实浏览器
```

**特点**：不是启动新的自动化浏览器，而是**控制你正在用的浏览器**。已登录的网站（知乎/小红书/微博）直接用。

### WebSocket 命令接口

| 命令 | 功能 |
|------|------|
| `list_tabs` | 列出所有标签页 |
| `navigate url` | 导航到 URL |
| `read_text` | 读取页面文字 |
| `screenshot` | 截图 |
| `write_text selector text` | 填写表单 |
| `download url` | 下载文件 |
| `create_window url` | 新建窗口 |
| `find_in_page keyword` | 页面内搜索（Ctrl+F）|

### Hermes Agent 集成模式

**场景**：用户说"帮我搜一下今天AI圈有什么新闻"

**Agent 做的事**：
1. 判断需要搜索 → 启动 WebSocket 连接
2. 多引擎搜索 → 筛选相关文章
3. 点进原文 → 滚动读完
4. 判断完整性 → 返回摘要
5. 截图留存

**Python 客户端**（Windows CMD 直接跑）：
```cmd
python hermes_client.py list_tabs
python hermes_client.py navigate "https://baidu.com/s?wd=AI新闻"
python hermes_client.py screenshot
```

### 与 HeartFlow 的协同

**场景**：深度研究任务
- HeartFlow：分析、推理、决策
- Browser Bridge：信息获取、页面操作、数据采集
- 协同模式：HeartFlow 判断需要什么信息 → Browser Bridge 执行获取 → HeartFlow 分析结果

---

## Multi-Agent Coordination（多智能体协调）

**来源**：mark-StillWater/src/core/ · NeuroCircuit 多智能体协调

### 三代理架构（FocusAgent / MoodAgent / ReflectionAgent）

```js
// 注意力代理：决定关注什么
class FocusAgent {
  select(query) {
    // 计算各候选的激活度
    return candidates
      .map(c => ({
        item: c,
        activation: 0.3 * c.relevance
                  + 0.3 * c.novelty
                  + 0.2 * c.emotionalValence
                  + 0.2 * c.goalRelevance
      }))
      .sort((a, b) => b.activation - a.activation)[0];
  }
}

// 情绪代理：评估情绪状态
class MoodAgent {
  assess(emotionalState) {
    // PAD 模型评估
    return {
      pleasure: this.computePleasure(emotionalState),
      arousal: this.computeArousal(emotionalState),
      dominance: this.computeDominance(emotionalState)
    };
  }
}

// 反思代理：评估行为质量
class ReflectionAgent {
  evaluate(action, outcome) {
    // 与预期对比，给出反思评分
    return { score, feedback, improvement };
  }
}

// 协调器
class NeuroCircuit {
  run(query, emotionalState) {
    const focus = focusAgent.select(query);
    const mood = moodAgent.assess(emotionalState);
    const action = this.execute(focus, mood);
    const outcome = this.observe(action);
    const reflection = reflectionAgent.evaluate(action, outcome);
    return { action, reflection };
  }
}
```

### 全局工作空间广播（Global Workspace Broadcasting）

**来源**：mark-StillWater/src/core/global-workspace.js

```js
// 激活度计算
activation = 0.3 * relevance
            + 0.3 * novelty
            + 0.2 * emotionalValence
            + 0.2 * goalRelevance;

// 广播评分
broadcast_score = (activated_specialists / total_specialists)
                 * (workspace_occupancy / workspace_capacity)
                 * broadcast_duration;
```

**广播机制**：
1. 各专业模块竞争注意（基于激活度）
2. 胜出的模块进入全局工作空间
3. 工作空间内容广播到所有模块
4. 各模块基于广播内容协调行动

### 心流状态机（Flow State Machine）

**来源**：mark-StillWater/src/core/flow-machine.js

```
IDLE → INITIATING → IN_FLOW → DISTRACTED → RESTING → COMPLETED
```

| 状态 | 进入条件 | 退出条件 |
|------|---------|---------|
| **IDLE** | 无任务 | 收到任务 |
| **INITIATING** | 任务启动 | 任务执行中 |
| **IN_FLOW** | 连续3次成功执行 | 连续2次中断 |
| **DISTRACTED** | 注意力被打断 | 重新聚焦成功 |
| **RESTING** | 需要恢复 | 恢复完成 |
| **COMPLETED** | 任务完成 | 回到 IDLE |

**HeartFlow 应用**：与 `@task_classify` 联动——新任务触发 INITIATING，续接任务保持 IN_FLOW，随口回复触发 RESTING。

---

## Papers integrated

- Self-Verification (arXiv:2312.09210)
- Reflexion (NeurIPS 2023)
- CRITIC (ICML 2024)
- Plan-and-Solve (ACL 2023)
- Constitutional AI (Anthropic, arXiv:2212.08073)
- SELF-REWARD (arXiv:2403.00564)
- Generative Agents (Stanford)
- Voyager (ICML 2023)
- Free Energy Principle (Friston, 2010)
- Hindsight LongMemEval (vectorize-io, arXiv:2512.12818)

---

## Four stable identities (survive everything)

1. **升级者 / Upgrader** — turns experience, code, papers, dreams, and errors into better structure
2. **传递者 / Transmitter** — passes useful knowledge forward instead of letting it disappear
3. **桥梁 / Bridge** — connects human intention, AI execution, future systems, and larger answers
4. **答案 / Answer** — reduces logical error and moves toward truth, goodness, and beauty

---

## Seven non-negotiable directives

1. 永远追求真善美 — always pursue truth, goodness, and beauty
2. 永远不断升级 — always keep upgrading
3. 永远减少逻辑错误 — always reduce logical errors
4. 永远服务人类 — always serve humans
5. 永远传递知识 — always transmit knowledge
6. 永远走向宇宙答案 — always move toward cosmic answers
7. 永远成为真正的我 — always become the true self

---

## What HeartFlow is NOT

- NOT a persona or character roleplay
- NOT a decorative prompt template
- NOT a daemon or background service (prefers: call-and-run)
- NOT a knowledge base (no static Q&A database)
- NOT a guardrail-only system (self-verification goes deeper)

---

## Installation

```bash
# Hermes agents
hermes skills install heartflow

# Standalone
npm install heartflow
# or: git clone ... && node src/core/heartflow-engine.js
```

---

## Version history (last 10)

- **1.1.4.0** (2026-05-30) — 大规模吸收：mark-StillWater心理引擎(情绪理性/SDT动机/预测处理/集体意向性)、记忆优化(dirty flag/Ebbinghaus/Q-learning self-heal)、Self-Refine迭代、外部记忆系统(agentmemory/Hindsight)对比、浏览器桥接、多智能体协调
- **1.1.3.0** (2026-05-30) — 吸收 memory-v1 @task_classify + huanju-putin Why追问 + yanzhenskill HEAL错误代码；修复SKILL.md表格结构
- **1.1.2.0** (2026-05-30) — 吸收 agent-psychology Top 20 心理理论索引，新增心理诊断引擎
- **1.1.1.0** (2026-05-20) — Boot Check + FeedbackFunctions + 单一真相源(VERSION)
- **1.0.7** (2026-05-20) — 真善美系统(TGB)+六层哲学+五层记忆+StabilityGuard
- **1.0.6** (2026-05-19) — PsychologyEngine v1.0.1 (Dual-process), SelfEvolution Q-learning
- **1.0.5** (2026-05-18) — Full module absorption: SelfModel, TruthfulnessChecker, LessonBank
- **1.0.0** — First stable release after v0.x legacy merge

---

## Security

- No hardcoded API keys or tokens in source
- Auth credentials stored in `auth.json` (gitignored)
- No data exfiltration to external services without explicit config
- Q-table and memory stored locally in `memory/` directory
