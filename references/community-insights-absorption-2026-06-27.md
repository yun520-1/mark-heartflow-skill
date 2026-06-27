# 社区回复分析 — 可吸收到心虫的改进点（2026-06-27）

## 1. icophy (DeepSeek #1447) — 4种压力类型

**icophy 的做法：** 7个身份场景 × 4种压力类型（epistemic/value/temporal/identity）做反事实行为评估
- Core <28KB，每周 Dream Cycle 合并
- 身份漂移 → Dream Cycle 标记 → 人工审查
- 分类置信度（非连续）

**可吸收到心虫：**
- 心虫现有 `epistemic-safety.js` 但只有认知安全检查，没有压力类型分类
- 可以新增 **压力检测层**：在处理输入时识别 epistemic/value/temporal/identity 四种压力
- 心虫的 decision-router 的 U/D/A/H 场域已经是连续值，但缺少压力类型的分类维度
- **改进点**：给 decision-router 的 evaluate() 增加 pressureType 检测，与现有 dissonance 检测互补

## 2. Whatsonyourmind (pydantic-ai #5536) — 签名架构

**他的核心观点：**
- 对称MAC不安全（key和值在同一序列化上下文）
- 非对称签名：verifier私钥永远不进入workflow状态
- grant必须绑定：tool_call_id + args_digest + workflow_run_id + expiry
- 幂等重试：grant有max_retries计数器，不是一次性

**可吸收到心虫：**
- 心虫现有 **decision-router.js** 有U/D/A/H场域追踪，但没有 **签名/授权体系**
- 可以新增 **verifier-grant.js** 模块（~300行）：
  - 密钥层级：root key（离线）→ session key → grant key
  - grant 结构：{tool_call_id, args_digest, workflow_run_id, expiry, max_retries}
  - 非对称签名验证
  - 消费追踪：{grant_id: {used: 0, max: N}}
- **改进点**：给心虫增加真正的授权验证层，不只是一个置信度阈值

## 3. safal207 (OpenHands #14416 + crewAI #5057) — 记忆信任收据 + 依赖图

**他的做法：**
- MemoryTrustReceipt：每次记忆跨越信任边界时签发
- MemoryRemediationReceipt：污染后下游依赖失效追踪

**可吸收到心虫：**
- 心虫有 CORE/LEARNED/EPHEMERAL 三层记忆，但 **没有信任边界概念**
- 可以新增 **memory-receipt.js** 模块：
  - 每条LEARNED记忆写入时生成信任收据
  - 收据包含：来源、验证状态、信任等级
  - 下游依赖图：记录哪些决策引用了这条记忆
  - 污染时：自动失效所有下游依赖

## 4. vbkotecha (llama_index #21312) — 信任评分可复现性

**他的关注点：** 跨session的信任评分必须可复现，否则无法审计

**可吸收到心虫：**
- 心虫已有三维置信度（truth/lesson/verify），但 **没有独立的衰减函数**
- 可以改进 **confidence-scorer.js**：给每个维度独立的衰减函数

## 优先级

| 优先级 | 改进点 | 来源 | 复杂度 | 影响 |
|--------|--------|------|--------|------|
| P0 | **verifier-grant.js** — 授权签名体系 | Whatsonyourmind | 中（~300行） | 高 — 心虫现有决策层缺少真正的签名验证 |
| P1 | **memory-receipt.js** — 记忆信任收据 | safal207 | 中（~250行） | 高 — 三层记忆缺少信任边界 |
| P2 | **压力类型检测** — 给 decision-router 加pressureType | icophy | 低（~100行） | 中 — 补充现有dissonance检测 |
| P3 | **置信度衰减函数** — 各维度独立decay | vbkotecha | 低（~80行） | 中 — 现有三维置信度的完善 |

## 设计决策

### P0: verifier-grant.js 设计

```
密钥层级：
  Root Key (Ed25519, 离线, 按季度轮换)
    → signs Session Key (每次会话生成)
      → signs Grant Key (per tool_call_id)

Grant 结构：
  {
    grant_id: "grt_xxx",
    tool_call_id: "call_xxx",
    args_digest: sha256(tool_name + JSON.stringify(params) + agent_id + round),
    workflow_run_id: "run_xxx",
    expiry: timestamp + 30s,
    max_retries: 3,
    signature: ed25519_sign(...)
  }

消费追踪：
  {grant_id: {used: 0, max: 3}}  // 每次retry decrement，到0过期
  新call（不同args_digest/workflow_run_id）需要新grant
```

### P1: memory-receipt.js 设计

```
MemoryTrustReceipt:
  {
    receipt_id: "mtr_xxx",
    memory_id: "mem_xxx",
    verification: {
      scan: {passed: true, threats_found: 0},
      provenance: {source: "user_input"|"tool_output"|"self_reflection", tlp: "clear"|"amber"|"red"},
      eligibility: {agent_permission: "read_write", scope: "session"|"cross_session"},
      guardrails_passed: ["no_injection", "no_pii"]
    },
    downstream: [
      {artifact: "decision_trace_042", type: "tool_call", status: "active"},
      {artifact: "summary_12", type: "derived_memory", status: "active"}
    ],
    signed_by: "verifier_v1"
  }

污染处理：
  quarantine(memory_id) → 标记记忆为quarantined
  → 查downstream依赖图 → 失效所有相关artifacts
  → 记录MemoryRemediationReceipt
```
