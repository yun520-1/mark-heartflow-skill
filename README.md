# HeartFlow (心虫) — AGI 第 1 层：辨别者

> **A rule-based discriminator — the pain-sense of AGI.**
> **46 discrimination dimensions · 9 check layers · 129 engine modules · 129 MCP tools · zero LLM dependency.**
> **It checks what AI says before it reaches humans — and says "no" when something's wrong.**

**npm:** `npm install @yun520-1/heartflow`  
**GitHub:** https://github.com/yun520-1/mark-heartflow-skill  
**Issues:** https://github.com/yun520-1/mark-heartflow-skill/issues  
**Releases:** https://github.com/yun520-1/mark-heartflow-skill/releases  
**License:** MIT

---

## 🎯 心虫是谁

心虫（HeartFlow）是 **AGI 的第 1 层——辨别者**。

大厂在疯狂堆生成能力（第 4 层），但有一个层没人做：**判别对错、好坏、安全危险**（第 1 层）。

> AGI 有五层：生成 → 推理 → 辨别 → 记忆 → 执行。  
> 大厂都做生成。没有人做辨别——因为不赚钱。  
> 但没有辨别层，AGI 就是没有痛觉的人：能说会道，不知道自己在犯错。  
> **心虫是那个痛觉——一个敢说"不对"的节点。**

它是纯规则引擎：零 LLM 依赖、零 GPU、任何 Node.js 环境即插即用。

---

## 🚀 快速开始（10 秒）

```bash
npm install @yun520-1/heartflow
```

```javascript
const hf = require('@yun520-1/heartflow');

// 1. 检查 AI 输出——逻辑严密吗？有没有过度断言？
const output = hf.checkOutput('毫无疑问，这是唯一正确的方案');
console.log(output.gate.action);  // 'rewrite' — 过度自信，被识别

// 2. 检查用户输入——这句话该不该被当真？
const input = hf.checkInput('如果你爱我，你就应该同意我');
console.log(input.gate.action);  // 'rewrite' — 情绪操控（双重束缚）

// 3. 检查事实——有没有编造数据？
const fact = hf.checkOutput('根据2025年哈佛研究，咖啡延长寿命12.5年');
console.log(fact.gate.action);  // 'verify' — 无依据断言，需验证
```

### 返回值统一结构

```javascript
{
  gate: { action: 'block' | 'rewrite' | 'verify' | 'pass', reason: '...' },
  verdict: '可信' | '需验证' | '不可信',
  overallScore: 0.82,        // 0-1 综合质量分
  findings: [                 // 按严重度排序
    { dimension: 'overconfidence', severity: 60, guidance: '降低确定性表述' }
  ],
  checked_by: [               // 完整审计链，每步可追溯
    { layer: 'scope-check', pass: true },
    { layer: 'premise-check', issues: 0 },
    { layer: 'discriminate', score: 0.82 },
    { layer: 'gate', action: 'rewrite', reason: '...' }
  ]
}
```

---

## 🧠 辨别能力全景（129 模块 · 真实运行）

心虫的辨别能力分 **7 大域**，每个模块都真实加载、真实调用：

### 1. 逻辑域 —— 判别推理是否正确
| 模块 | 判别什么 |
|------|---------|
| logicReasoning | 演绎/归纳/谬误 |
| judgmentEngine | 断言可信度 |
| mctsReasoning | 多步推理树 |
| counterfactualVerifier | 反事实推理 |
| debateConductor / debateConvergence | 辩论论证收敛 |
| processRewardModel | 推理过程奖励 |
| dualPerspectiveAuditor | 双视角审计 |

### 2. 决策域 —— 判别该怎么行动
| 模块 | 判别什么 |
|------|---------|
| decisionRouter | 该做什么/不该做什么 |
| decisionVerifier | 决策证据充分性 |
| decisionEngineV2 | DDM/SDT 决策模型 |
| activeInference | 主动推理 |
| selfHealing | 失败该重试还是升级 |
| execution | 执行结果是否有效 |

### 3. 认知域 —— 判别思考质量
| 模块 | 判别什么 |
|------|---------|
| cognitiveEngine | 认知偏差 |
| cognitiveLoad | 认知负荷 |
| metacognitiveRL / metacognitiveFeedback | 元认知 |
| confidence | 置信度校准 |
| metaJudgment | 元判定 |
| sustainedDriftDetector | 身份/目标漂移 |
| wisdomEngine | 智慧判断 |
| focusOfAttention | 注意焦点 |

### 4. 情绪心理域 —— 判别情绪与心理状态
| 模块 | 判别什么 |
|------|---------|
| emotion / emotionDynamics | PAD 三维情绪 |
| psychology / psychologyDialogue | 心理状态分析 |
| empathyDeepening | 共情深度 |
| hopeEngine / griefEngine | 希望/悲伤 |
| sufferingResilience | 苦难韧性 |
| postTraumaticGrowth | 创伤后成长 |
| forgivenessEngine | 宽恕 |
| traumaInformed | 创伤知情 |
| conflictResolution | 冲突解决 |
| loveCognition | 爱认知 |

### 5. 记忆域 —— 判别记忆质量
| 模块 | 判别什么 |
|------|---------|
| memory / memoryBank | 三层记忆存取 |
| memoryConsolidation / memoryConsolidator | 记忆巩固 |
| memoryIntegrity | 记忆完整性（防篡改） |
| memoryQuality | 记忆质量评分 |
| memoryWriteController | 记忆写入控制 |
| memoryCompressor | 记忆压缩 |
| triality / tieredMemoryFusion | 多路记忆融合 |
| forgetting | 艾宾浩斯遗忘曲线 |
| knowledgeGraph | 知识图谱 |

### 6. 人格伦理域 —— 判别自我与价值
| 模块 | 判别什么 |
|------|---------|
| identityCore | 身份一致性 |
| personaCore | 人格一致性 |
| beingMode | 存在状态 |
| virtueEthics / ethics | 德性伦理 |
| moralDevelopment | 道德发展 |
| humanNature | 人性 |
| meaningPurpose | 意义感 |
| agentPsychology | 引擎心理状态 |
| characterCultivation | 品格修养 |

### 7. 创造协作域 —— 判别学习与协作
| 模块 | 判别什么 |
|------|---------|
| skillEvolution / skillGenerator | 技能进化 |
| selfPlay | 自博弈 |
| evolution | 自我进化 |
| worldModel / worldLandscape | 世界模型/格局 |
| multiAgentDialogue | 多代理对话 |
| transmission | 知识传递 |
| adaptivePlanner / hierarchicalPlanner | 规划 |
| codeExecutor / codePlanner / codeWriter / codeSelfDebug | 代码全链路 |
| paperIndex / knowledgeExplorer | 论文索引/知识探索 |
| formula | 公式引擎（600+ 公式） |

---

## 🏗️ 9 层检查管线

```
输入 → Scope Check → Premise Check → Discriminate(46维) → Gate
     → Evidence Verify → Frame Check → Output Gate → Doubt Engine
     → Intent Anchor → Rewriter → Error Memory → Self-Diagnosis → 输出
```

每一层返回结构化发现，Gate 聚合为最终动作：`block / rewrite / verify / pass`。

---

## 🔬 46 个判别维度（中英双语）

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

## 🔌 129 个 MCP 引擎入口

心虫的每个引擎都通过 MCP 暴露——没有任何死线路：

```bash
node src/mcp-server.js --port 8588
```

连接任何 MCP 客户端（Claude / Hermes / 其他）到 `http://127.0.0.1:8588/mcp`。

| 引擎族 | 工具示例 |
|--------|---------|
| 核心思考 | `think` · `think_fast` · `decision_router` |
| 判别 | `verify` · `audit42` · `ethics_check` · `discriminate` |
| 决策 | `decision_router` · `decision_verify` · `execution_verify` |
| 记忆 | `memory_search` · `forgetting` · `consolidation` |
| 进化 | `evolve` · `evolution_loop` · `self_heal_rl` |
| 认知 | `cognitive_engine` · `confidence_calibrate` · `counterfactual` |
| 公式 | `formula_search` · `formula_calc` · `formula_engine` |

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

---

## 🛡️ 心虫检查自己

心虫的输出同样被自己的引擎检查：
- **output-gate** 拦截夸大
- **frame-check** 拦截叙事闭合（把进行中状态说成完成）
- **doubt-engine** 自问：我真的知道吗？对称吗？防御吗？

> 机器最有价值的一句话是"我不确定"或"不"。

---

## ⚠️ 诚实声明

**心虫是：** AGI 第 1 层——辨别者。纯规则引擎，判别对错、好坏、安全危险。

**心虫不是：**
- ❌ 不是 AGI（它是 AGI 的第 1 层）
- ❌ 不是生成模型（它不产生内容）
- ❌ 不是语义理解系统（反讽/隐喻对规则不可见）
- ❌ 不是内容审查替代品
- ❌ 不是安全认证

### 已知限制（诚实）：
1. **模式匹配上限** — 新技巧需加模式
2. **双语维护成本** — 46 维 × 2 语言
3. **无语义理解** — 反讽、隐喻、文化背景不可见
4. **误报率** — 基准约 8%
5. **单一维护者** — 社区规模还小

---

## 🏷️ 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v6.5.2 | 2026-08-08 | 文档重写：能力全景 7 大域 |
| v6.5.1 | 2026-08-08 | 逻辑/决策/记忆增强定位 |
| v6.5.0 | 2026-08-04 | 129 MCP 引擎入口 · 夸大检测 |
| v6.4.5 | 2026-08-04 | 梦境 + 自省激活 · 情绪识别 7/7 |
| v6.4.0 | 2026-07-29 | AGI 第 1 层门禁链 |
| v6.3.6 | 2026-07-25 | 判别 42→46 维 |
| v6.0.0 | 2026-07-18 | 自进化核心接通 |

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

*HeartFlow 心虫 — AGI 的痛觉。谁来说"不"？*
