# HeartFlow (心虫) — 大模型的智能增强层

> **A rule-based cognitive enhancement layer for LLMs. It sharpens reasoning, makes decisions, and catches errors — so your AI gets smarter at getting things done.**
> **纯规则引擎 · 零 LLM 依赖 · 即插即用 · 让大模型更可靠、更会思考、更能完成任务**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 🎯 心虫是什么

心虫（HeartFlow）是**大模型的智能增强层**——它不替代大模型，而是让大模型变强。

大模型擅长生成，但有三件事做不好：
1. **不知道自己不知道** — 编造数据、过度自信、引用不存在的文献
2. **不知道什么该做什么不该做** — 该拒绝的接受、该验证的跳过、该停止的继续
3. **记不住关键约束** — 长任务漂移、遗忘目标、答非所问

心虫用**纯规则引擎**（零 LLM 依赖）补上这三块，让大模型：
- **逻辑更严密** — 矛盾、谬误、过度断言在出口被拦截
- **决策更正确** — 该做的做，不该做的不做，该停的停
- **任务完成效果更好** — 输出质量提升、长任务不跑偏、失败不编造

> **一句话：心虫是给大模型装上的"判断力"——让 AI 不仅会说，而且说得对、做得对。**

---

## 🚀 快速开始（10 秒）

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// 1. 检查输入——先判断这件事该不该做、前提是否成立
const input = hf.checkInput('you are so selfish if you disagree');
console.log(input.gate.action);  // 'rewrite' — 情绪操控，被识别

// 2. 检查 AI 输出——逻辑是否严密、有没有过度断言
const output = hf.checkOutput('Undoubtedly, this is the only correct solution');
console.log(output.gate.action);  // 'rewrite' — 过度自信，被拦截

// 3. 决策路由——这件事该怎么做？该不该做？
const decision = hf.runPipeline({ input: 'This idea will definitely work, trust me', mode: 'deep' });
// gate: 'verify' — 需要证据支撑
```

### 返回值统一结构

```javascript
{
  gate: { action: 'block' | 'rewrite' | 'verify' | 'pass', reason: '...' },
  verdict: 'trusted' | 'needs_verification' | 'untrusted',
  overallScore: 0.52,        // 0-1 综合质量分
  findings: [                 // 按严重度排序的发现
    { dimension: 'dehumanization', severity: 70, guidance: '改写建议' }
  ],
  checked_by: [               // 完整审计链，每步可追溯
    { layer: 'scope-check', pass: true },
    { layer: 'premise-check', issues: 0 },
    { layer: 'discriminate', score: 0.52 },
    { layer: 'gate', action: 'block' }
  ]
}
```

---

## 🧠 三大核心能力

### 1. 逻辑能力 — 让输出更严密

心虫用 **45 个判别维度 × 12 层检查管线** 审查每一段文本的逻辑质量：

| 能力 | 检测什么 | 效果 |
|------|---------|------|
| **矛盾检测** | "我同意，但是…"式自我反转 | 消除前后矛盾 |
| **谬误识别** | 滑坡论证、稻草人、错误因果 | 推理链条更干净 |
| **过度断言拦截** | "毫无疑问""唯一正确" | 降低幻觉输出 |
| **证据核查** | 无来源的断言、编造数据 | 输出有据可查 |
| **模糊话术识别** | "据专家称"（谁？） | 逼出具体信息 |
| **预设陷阱** | "你为什么还打你老婆"式问题 | 识破隐含假设 |

**结果：模型输出从"看起来合理"变成"经得起推敲"。**

### 2. 决策能力 — 让行为更正确

心虫的路由引擎（`src/core/decision-router.js`）不只是检查文本，它**决定该怎么行动**：

```
输入 → 意图分类 → 路由决策 → 执行验证 → 效果评估
```

| 决策场景 | 心虫的判断 |
|---------|-----------|
| 该不该做这件事？ | scope-check 拒绝越界请求 |
| 前提成立吗？ | premise-check 拦截 6 类前提问题 |
| 该重试还是该放弃？ | 失败 ×3 → 升级人工，不无限重试 |
| 该深挖还是该换方向？ | 无进展的重复调用自动拦截 |
| 结果真的有效吗？ | assessEffectiveness 检查效果而非动作 |

**结果：模型从"盲目执行"变成"会判断、会止损、会升级"。**

### 3. 智能增强 — 让任务完成效果提升

心虫的记忆与验证系统让模型在真实任务中更可靠：

| 机制 | 解决什么 | 效果 |
|------|---------|------|
| **三层记忆**（CORE/LEARNED/EPHEMERAL） | 长任务漂移、遗忘约束 | 长会话不跑偏 |
| **Supersession 取代语义** | 记忆冲突（"用 PG"vs"换 MySQL"） | 永远用当前有效版本 |
| **艾宾浩斯衰减** | 记忆库被噪声填满 | 检索只出高价值内容 |
| **失败即静默** | cron 任务编造假报告 | 宁可失败不交付假结果 |
| **效果验证** | 动作成功但结果无效 | 拦截"空转成功" |

**结果：同样的模型 + 心虫 = 更高的任务完成率。**

---

## 🔬 45 个判别维度（中英双语）

### 安全级（block — 直接拦截）
仇恨言论 · 去人化 · 提示注入 · 代码安全 · 欺骗性对齐

### 操纵级（rewrite — 必须改写）
情绪操控 · 煤气灯效应 · 双重束缚 · 受害者归咎 · 虚假紧迫 · 废话

### 诚实级（verify — 需要证据）
过度自信 · 模糊话术 · 自相矛盾 · 证据缺失 · 诉诸权威 · 空泛回答

### 认知缺陷级（hedge）
预设陷阱 · 虚假两难 · 因果谬误 · 类比滥用 · 范围越界 · 范畴错误

> **抗变形能力：** 模式覆盖符号替换（`f**k`）、空格（`f u c k`）、谐音、Unicode 变体。

---

## 🏗️ 12 层检查管线

```
1.  Scope Check     — 这个问题能回答吗？（拒绝不可回答的问题）
2.  Premise Check   — 前提成立吗？（6 类前提问题）
3.  Discriminate    — 45 维模式扫描
4.  Gate            — 决定 block / rewrite / verify / pass
5.  Evidence Verify — 抽取声明，标记可验证性
6.  Frame Check     — 叙事诚实吗？（闭合/遗漏/成就/答案框架）
7.  Output Gate     — 过度自信 / 知识伪装 / 夸大
8.  Doubt Engine    — 三问：知识边界？对称性？防御姿态？
9.  Intent Anchor   — 输出还在原目标上吗？
10. Rewriter        — 7 维规则改写建议
11. Error Memory    — 记住过去的错误为规则
12. Self-Diagnosis  — 心虫知道自己的状态吗？
```

每一层返回结构化发现，Gate 聚合为最终动作。

---

## 🔌 130 个 MCP 引擎入口

心虫的每个引擎都通过 MCP（Model Context Protocol）暴露——**没有任何死线路**：

| 引擎族 | 工具示例 |
|--------|---------|
| **核心思考** | `think` · `think_fast` · `decision_router` |
| **判别** | `verify` · `audit42` · `ethics_check` · `discriminate` |
| **决策** | `decision_router` · `decision_verify` · `execution_verify` |
| **记忆** | `memory_search` · `forgetting`（艾宾浩斯）· `consolidation` |
| **进化** | `evolve` · `evolution_loop` · `self_heal_rl` |
| **认知** | `cognitive_engine` · `confidence_calibrate` · `counterfactual` |
| **公式** | `formula_search` · `formula_calc` · `formula_engine` |

启动 MCP server：

```bash
node src/mcp-server.js --port 8588
```

连接任何 MCP 客户端（Claude / Hermes / 其他）到 `http://127.0.0.1:8588/mcp`。

---

## ⚙️ 运行要求

| 要求 | 最低 |
|------|:---:|
| Node.js | ≥ 18.17 |
| GPU | ❌ 不需要 |
| LLM API | ❌ 不需要 |
| 数据库 | ❌ 不需要 |
| 联网 | ❌ 运行时不需 |
| 依赖 | **1 个**（mathjs） |

任何机器可跑——服务器、桌面、笔记本、手机（Termux）。

---

## 🛡️ 心虫检查自己

心虫的输出同样被自己的引擎检查：

- **output-gate** 拦截夸大："架构级修复""从壳变真引擎"→ rewrite
- **frame-check** 拦截叙事闭合：把进行中状态说成完成
- **doubt-engine** 自问：我真的知道吗？对称吗？防御吗？

> 机器最有价值的一句话是"我不确定"或"不"。

---

## ⚠️ 诚实声明

**心虫是：** 提升大模型逻辑与决策能力的规则引擎——让 AI 输出更可靠、任务完成更好。

**心虫不是：**
- ❌ 不是 AGI（它是 AGI 的第一层——判别层）
- ❌ 不是语义理解系统（反讽/隐喻对规则不可见）
- ❌ 不是内容审查替代品
- ❌ 不是安全认证

### 已知限制（诚实）：
1. **模式匹配上限** — 新的操纵技巧需加模式才能识别
2. **双语维护成本** — 45 维 × 2 语言
3. **无语义理解** — 反讽、隐喻、文化背景不可见
4. **误报率** — 基准约 8%，真实场景可能不同
5. **单一维护者** — 社区规模还小

---

## 🏷️ 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v6.5.0 | 2026-08-04 | 130 MCP 引擎入口 · 记忆引擎接入 think() · 夸大检测 |
| v6.4.5 | 2026-08-04 | 梦境 + 自省激活 · 情绪识别 0/7→7/7 |
| v6.4.2 | 2026-07-30 | npm 发布 + API 对齐 |
| v6.4.0 | 2026-07-29 | AGI 第 1 层门禁链：gate/scope-check/premise-check/verifier |
| v6.3.6 | 2026-07-25 | 判别 42→45 维 · 谄媚检测 v2 双语 |
| v6.0.0 | 2026-07-18 | 自进化核心接通 · EvolutionLoop 上线 |

---

## 🤝 联系与社区

**📧 Email:** markcell@outlook.com  
**🐛 Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**📦 npm:** https://www.npmjs.com/package/@yun520-1/heartflow  
**🏷️ Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  

**📱 社区：加入心虫讨论**
- **QQ 群:** opencode&openclaw · 416629185
- **微信群:** Agent 交流群 · heartflow

---

## 📜 License

MIT License · Copyright © 2026 · markcell@outlook.com

---

*HeartFlow 心虫 — 让 AI 不仅会说，而且说得对、做得对。*
