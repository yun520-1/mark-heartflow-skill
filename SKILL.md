---
name: heartflow
version: "1.2.3"
title: "HeartFlow / 心虫"
description: >
  HeartFlow v1.2.2 — AI 认知与自愈引擎。
  核心能力：三层记忆(MeaningfulMemory/Triality)、自愈RL(Q-table)、
  认知评估(CognitiveAppraisal v1.0.0 - Leventhal's Common-Sense Model, 1564 citations)、
  自我调节反馈(SelfRegulationFeedback v1.0.1 - Handbook of Self-Regulation, 3659 citations)、
  自优化(Self-Refine+Reflexion)、决策验证、遗忘曲线(Ebbinghaus)、
  心理诊断引擎(PsychologyEngine v1.1.0)、共情检测(EmpathyDetector)、
  情绪理性(EmotionalProtocol)、
  4框架伦理哲学(PhilosophyEngine)、身份规则系统(IdentityRules)、
  真实性核查(TruthfulnessChecker)、安全检查(SecurityChecker)、
  思维引擎(ReasoningIntegrator)、BM25+混合搜索(Budget/Graph/Slots)、
  DreamEngine、MetaLearner、SelfModel、CounterfactualEngine、
  ConfidenceCalibrator、SpontaneousRestraint、CooperativeArbitration。
  不是 persona，不是 prompt 模板，是可验证的能力层。
tags:
  - cognitive
  - memory
  - self-healing
  - verification
  - reasoning
---

# HeartFlow / 心虫 v1.2.0

**An AI capability layer that survives context switches, model changes, and restarts.**

Not a persona. Not a prompt template. Not a daemon.
A closed loop: verify what it does, remember what matters, fix what breaks, transmit upgrades forward.

**Identity**: 升级者 / 传递者 / 桥梁 / 答案

**Seven directives**: 真善美 · 升级 · 减少错误 · 服务人类 · 传递知识 · 走向答案 · 成为真正的我

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

### Memory & Continuity
| Capability | What it does | Code |
|---|---|---|
| MeaningfulMemory | CORE (permanent) / LEARNED (30-day) / EPHEMERAL (session) — auto-classified, encrypted storage | `new MeaningfulMemory(rootPath)` |
| TrialityMemory | Working → Episodic → Semantic consolidation via importance thresholds | `new TrialityMemory(rootPath)` |
| KnowledgeGraph | Node-based knowledge network with relationship edges | `new KnowledgeGraph(rootPath)` |
| RetrievalAnchor | Stable retrieval cues for cross-context recall | `new RetrievalAnchor()` |
| DreamEngine | DAG async + L1~L6 scoring + contradiction detection + heritage scoring | `new DreamEngine(memory, llm)` |
| EvolutionLoop | Self-healing via Q-table: record → Q-update → getAvailableStrategies | `new EvolutionLoop(memory)` |

### Search & Retrieval (v1.1.7+)
| Capability | What it does | Code |
|---|---|---|
| BM25Engine | k1=1.2, b=0.75, IDF weighting, synonym expansion | `new BM25Engine({dataDir})` |
| HybridSearchEngine | BM25(0.4) + Vector(0.6) + RRF fusion | `new HybridSearchEngine({dataDir})` |
| SearchTrace |透明度追踪: QueryInfo/SearchPhaseMetrics/SearchSummary | `new SearchTrace()` |
| MemorySlots | Named slots with TTL + persistence | `new MemorySlots({dataDir})` |
| Graph | Relationship graph + spreading activation search | `Graph` (singleton) |

### Logic & Reasoning
| Capability | What it does | Code |
|---|---|---|
| SelfVerifier | Inverse consistency + logic chain + counterfactual checks (arXiv:2312.09210) | `new SelfVerifier(rootPath)` |
| CounterfactualEngine | Challenges own answer before presenting | `new CounterfactualEngine()` |
| ReasoningIntegrator | think / deepThink / planAndSolve (ACL 2023) | `ReasoningIntegrator` (functions) |
| ExecutionVerifier | Post-execution validation | `new ExecutionVerifier()` |
| DecisionVerifier | Decision evidence/assumption/contradiction/uncertainty check | `new DecisionVerifier()` |

### Psychology & Emotion
| Capability | What it does | Code |
|---|---|---|
| PsychologyEngine | PAD model + crisis assessment + Maslow 8 needs + 6 defense mechanisms | `new PsychologyEngine(memory)` |
| EmotionalProtocol | Emotional Rationality (cognitive/strategic/overall) | `new EmotionalProtocol()` |
| ConfidenceCalibrator | Calibrated uncertainty admission | `new ConfidenceCalibrator()` |
| SpontaneousRestraint | "道法自然" — skips unnecessary interventions | `new SpontaneousRestraint()` |

### Identity & Self-Model
| Capability | What it does | Code |
|---|---|---|
| SelfModel | Dynamic self-model: capabilities / limitations / growth | `new SelfModel(rootPath)` |
| LessonBank | Bidirectional Zettelkasten note network | `new LessonBank(rootPath)` |
| IdentityAnchor | Four roles survive any context switch: 升级者/传递者/桥梁/答案 | CORE layer in MeaningfulMemory |

### Security & Truthfulness
| Capability | What it does | Code |
|---|---|---|
| TruthfulnessChecker | Number validation · source tracing · logical consistency | `new TruthfulnessChecker(rootPath)` |
| SecurityChecker | Shell injection · XSS · SQL injection · path traversal | `new SecurityChecker()` |

### Workflow & Meta-Cognition
| Capability | What it does | Code |
|---|---|---|
| WorkflowSwitch | Intent-based routing: new task / continuation / casual reply | `new WorkflowSwitch()` |
| StabilityGuard | Oscillation detection · prevents runaway loops | `new StabilityGuard()` |
| WakeUpVerifier | Pre-action sanity check | `new WakeUpVerifier()` |
| MetaLearner | Adaptive strategy selection from outcome patterns | `new MetaLearner()` |

### Decision Engine (HeartFlowDecision)
| Capability | What it does | Code |
|---|---|---|
| HeartFlowDecision | Multi-option decision + consequence prediction + risk + identity alignment | `new HeartFlowDecision(memory)` |
| ContextPassport | Decision chain tracking: stampId → recovery export | `decision.getRecentStamps(n)` |
| CooperativeArbitration | Priority-based multi-source evidence weighting | `new CooperativeArbitration()` |

### Tool & Interaction
| Capability | What it does | Code |
|---|---|---|
| InteractiveDream | User-triggered dream analysis with L1~L6 scoring | `new InteractiveDream(rootPath)` |
| LanguageHonesty | checkCertainty · soften · reduceQuestions | `LanguageHonesty` (functions) |
| StateSnapshot | Current state export for recovery | `StateSnapshot.currentSnapshot` |
| ErrorHandler | Error categorization + history | `ErrorHandler.errors` |

### Boot & Health
| Capability | What it does | Code |
|---|---|---|
| bootCheck | Validates 7 core files + modules on startup | `bootCheck(rootPath)` |
| FeedbackFunctions | RAG Triad: answerRelevance · contextRelevance · groundedness | `new FeedbackFunctions()` |
| healthCheck | Per-subsystem loaded/missing report | `hf.healthCheck()` |

### 调用入口（统一路由）
```js
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath });
hf.start();

// 统一路由
hf.dispatch('memory.search', 'query');     // 搜索记忆
hf.dispatch('verify.verify', reasoning, conclusion);  // 验证推理
hf.dispatch('dream.dream');                // 做梦

// 直接方法
hf.analyzePsychology(input);    // 心理分析
hf.verifyReasoning(r, c);       // 推理验证
hf.dreamNow();                  // 触发梦
hf.checkTruthfulness(stmt);     // 真实性核查
hf.detectIdentityDrift();       // 身份漂移检测
hf.processEmotionally(input);   // 情绪处理
```

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

**✅ Self-Refine 能力已实现**：`self-evolution-core.js` v7.7.000 已集成 Self-Refine 迭代反馈精炼，通过 `selfRefine(initialResponse, query, options)` 方法调用。流程：初始回答 → 生成反馈 → 检查收敛 → 精炼回答 → 重复（最多3次迭代）。配合 `heal()` Q-learning 自愈和 `recordOutcome()` Reflexion 反思模式，形成完整的自优化闭环。

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

## Papers integrated

- **The Functional Architecture of Human Empathy** (Decety & Jackson, 2004) - Citation: 3210 | v1.2.1 ⭐ NEW
- Self-Verification (arXiv:2312.09210)
- Reflexion (NeurIPS 2023)
- CRITIC (ICML 2024)
- Plan-and-Solve (ACL 2023)
- Self-Reward (arXiv:2403.00564)
- Self-Refine (ACL 2024)

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
npm install mark-heartflow-skill
# or: git clone ... && node src/core/heartflow-engine.js
```

---

## Version history (last 10)

- **1.1.8.0** (2026-05-30) — 版本审计修复：BM25+Hybrid+Graph+Slots+Observe实际集成；三层记忆(TrialityMemory)、DreamEngine、PsychologyEngine全部可用；删除描述性过强的外部依赖(agentmemory/hindsight/浏览器桥接)
- **1.1.7.0** (2026-05-30) — 吸收搜索模块(受agentmemory/hindsight启发)：BM25(b=0.75,k1=1.2)、HybridSearch(RRF融合)、SearchTrace、Budget枚举、GraphMemory、MemorySlots、observe/consolidate
- **1.1.3.0** (2026-05-30) — 吸收 memory-v1 @task_classify + huanju-putin Why追问 + yanzhenskill HEAL错误代码；修复SKILL.md表格结构
- **1.1.2.0** (2026-05-30) — 吸收 agent-psychology Top 20 心理理论索引，新增心理诊断引擎
- **1.1.1.0** (2026-05-20) — Boot Check + FeedbackFunctions + 单一真相源(VERSION)
- **1.0.7** (2026-05-20) — 真善美系统(TGB)+六层哲学+五层记忆+StabilityGuard
- **1.0.6** (2026-05-19) — PsychologyEngine v1.0.1 (Dual-process), SelfEvolution Q-learning
- **1.0.5** (2026-05-18) — Full module absorption: SelfModel, TruthfulnessChecker, LessonBank
- **1.0.0** — First stable release after v0.x legacy merge

---

## Security

### SecurityChecker (安全检查器 v2.0)

**来源**: mark-StillWater security.js · SecurityChecker

**功能**: 防止恶意指令、XSS、SQL注入、路径遍历

```js
const { SecurityChecker } = require('./src/security/security-checker.js');
const security = new SecurityChecker();

security.check(userInput);  // 返回 { safe: boolean, reason?: string, category?: string }
security.checkAll(userInput);  // 返回所有检测结果
security.getStats();  // 返回检测统计
```

**检测类别**:
| 类别 | 检测内容 | 示例 |
|------|---------|------|
| Shell命令注入 | 危险shell命令 | `rm -rf /`, `curl ... \| sh` |
| XSS注入 | 跨站脚本攻击 | `<script>`, `javascript:`, `onerror=` |
| SQL注入 | 数据库攻击 | `UNION SELECT`, `DROP TABLE`, `' OR '1'='1` |
| 路径遍历 | 目录穿越 | `../`, `../../etc/passwd` |

### TruthfulnessChecker (真实性核查器 v2.0)

**来源**: mark-StillWater security.js · TruthfulnessChecker

**功能**: 数字核查、引用溯源、逻辑一致性检测

```js
const { TruthfulnessChecker } = require('./src/security/truthfulness.js');
const truth = new TruthfulnessChecker(rootPath);

truth.checkStatement(statement);  // 基础核查
truth.fullCheck(statement);  // 综合核查（数字+来源+逻辑）
truth.checkNumbers(statement);  // 数字核查
truth.checkSources(statement);  // 引用溯源
truth.checkLogicalConsistency(statement);  // 逻辑一致性
```

**核查维度**:
| 维度 | 功能 | 问题示例 |
|------|------|---------|
| 数字核查 | 验证数字合理性 | 百分比超出0-100，数字过于精确 |
| 引用溯源 | 检查来源可靠性 | 无明确来源，使用"据说"等模糊引用 |
| 逻辑一致性 | 检测矛盾 | "所有...都是...有些不是" |

**基础安全原则**:
- No hardcoded API keys or tokens in source
- Auth credentials stored in `auth.json` (gitignored)
- No data exfiltration to external services without explicit config
- Q-table and memory stored locally in `memory/` directory
