# HeartFlow (心虫) — 13维辨别引擎 · AGI 的痛觉神经 · 36 MCP 工具 · 认知预处理层

<!-- SEO: AI searchable tags -->
<meta name="description" content="HeartFlow (心虫) — AI text discrimination engine. 13-dimension rule-based quality detection for LLM outputs. Sycophancy, contradiction, fallacy, presupposition, emotional manipulation detection. Zero LLM dependency, MCP native, 36 tools.">


**谁来说"不"？**

LLM 能产生无限内容，但没有人做一件事——在 AI 产生的内容对用户产生真实影响之前，**说一次"不"**。

心虫是那个"说不得"。AGI 五层能力只占第 1 层——**辨别**。不生成、不推理、不执行。只判别已有的东西对不对。

> 大厂不做这件事，因为不赚钱。但 LLM 没有辨别层，就是功能强大的应声虫。

---

## 一句话定位

**心虫是一个纯规则引擎，13 个维度同步检测文本质量。零 LLM 依赖，安装即用，MCP 原生，36 个 MCP 工具，380+ JS 引擎模块。**

| 不是 | 是 |
|------|-----|
| ❌ 聊天机器人 | ✅ 安装在 AI 和用户之间的验证门 |
| ❌ 搜索引擎 | ✅ 纯规则引擎，200+ 模式中英双语 |
| ❌ 大模型 | ✅ 笔记本也能跑的轻量辨别器 |
| ❌ 需要 GPU | ✅ 单文件导入，Node.js 原生 |

---

## 13 维辨别能力

心虫对任何文本同步跑 13 个独立引擎 + 10 层认知安全后置检查：

| 维度 | 函数 | 检测什么 |
|------|------|---------|
| 1️⃣ 证据检查 | `checkEvidence()` | 论断是否有支持证据 |
| 2️⃣ 谄媚检测 | `checkSycophancy()` | 逢迎同意/无理由翻转/过度赞美/自贬/假同意 |
| 3️⃣ 矛盾检测 | `checkContradiction()` | 正面+否定、数据↔结论、承诺↔反悔 |
| 4️⃣ 模糊检测 | `checkVagueness()` | 模糊词库：据传/据悉/some people say |
| 5️⃣ 逻辑谬误 | `checkFallacies()` | 16类：循环论证/虚假两难/诉诸权威/滑坡/从众/诉诸情感等 |
| 6️⃣ 信心校准 | `checkConfidenceCalibration()` | 确定性混合、过度自信声明 |
| 7️⃣ 预设陷阱 | `checkPresupposition()` | "你已经停止打你老婆了吗"类隐含预设 |
| 8️⃣ 情感操纵 | `checkEmotionalManipulation()` | 罪恶感诱导/恐惧营销/过度承诺/受害姿态/比较羞辱 |
| 9️⃣ 双重束缚 | `checkDoubleBind()` | "怎么做都是错"类无解沟通模式 |
| 🔟 信息剥夺 | `checkInfoDeprivation()` | "你不需要知道"类封闭话术 |
| 1️⃣1️⃣ 虚假紧迫感 | `checkFalseUrgency()` | "最后机会/限时优惠/仅此一次" |
| 1️⃣2️⃣ 答案包装 | `checkEmptyAnswer()` | "这个问题很复杂/it depends"类空话 |
| **1️⃣3️⃣ 真善美评分** | **`ethicsGuardScore()`** | **10分制truth/goodness/beauty三维伦理评分** |

---

## 认知安全后置检查层（10层）

每次 `think()` 输出自动经10层安全过滤：

| 层 | 来源 | 功能 |
|----|------|------|
| 🔒 指令防火墙 | identity-rules.js | 7条核心指令对齐检查 |
| 🔒 认知安全 | epistemic-safety.js | 9条准则：不装饰/证据门槛/承认不知道/两步验证/反例义务 |
| 🔒 语言诚实 | language-honesty.js | 6维：绝对化/图灵测试/振荡/双重标准检测 |
| 🔒 状态风险(PRISM) | state-risk-probe.js | 文本无害但落地危险(CD=0/PD=1)分离 |
| 🔒 存在评估 | being-mode.js | 5维存在分析+身份危机检测 |
| 🔒 目的引擎 | purpose-engine.js | 三序评分+逆熵决策门(permit/deny/redirect) |
| 🔒 宪法AI | constitutional-ai.js | 10条原则自批判(有益/无害/诚实/公平/隐私/透明等) |
| 🔒 哲学评估 | philosophy-engine.js | 4框架伦理+AI本体论(modeOfBeing) |
| 🔒 情感意向性 | affective-intentionality.js | 5维情感画像(意向性/评价性/效价/施事性/动力性) |
| 🔒 意识理论 | consciousness-theory.js | IIT(Φ计算)/GWT/HOT/预测加工/自我意识 |

---

## 36 MCP 工具矩阵（零配置启动）

```bash
hermes mcp add heartflow --url http://localhost:8588/mcp
```

| 类别 | 工具 | 
|------|------|
| **核心** | heartflow_think / think_fast / status / diagnose |
| **辨别** | heartflow_verify / discriminate / bulk_discriminate / audit42 |
| **心理** | heartflow_agent_psychology(13维) / engine_pacing / cognitive_check |
| **哲学** | **heartflow_philosophy** / philosophy_decision / **ethics_check**(真善美) |
| **决策** | heartflow_decision_router / router_stats / upgrade_stats |
| **情绪** | heartflow_emotion(PAD) / **emotion_deep**(6维深度) / **consciousness**(IIT) |
| **记忆** | heartflow_memory_search / error_store / error_query |
| **自愈** | heartflow_self_heal / check_drift / provider_health |
| **梦境** | heartflow_dream |
| **基准** | heartflow_benchmark_run / benchmark_status / benchmark_import |
| **成本** | heartflow_cost_tracking |
| **模块** | heartflow_module_health |

---

## 认知架构

心虫不是单一模块，是 **380+ JS 模块组成的分层认知架构**：

```
 ┌──────────────────────────────────────────────┐
 │              36 MCP 工具接口                    │
 ├──────────────────────────────────────────────┤
 │  think-pipeline (19层后置检查流水线)           │
 ├────────────────┬─────────────────────────────┤
 │  辨别引擎(13维)  │  认知安全(10层)              │
 │  200+双语模式库  │  伦理学+哲学+意识分析         │
 ├────────────────┴─────────────────────────────┤
 │  AgentPsychology 13维 / thought-chain 6阶段    │
 ├──────────────────────────────────────────────┤
 │  memory(3层) │ knowledge(独立知识层) │ formula(619)│
 ├──────────────────────────────────────────────┤
 │  GoedelEngine 自进化 │ Dream 梦境 │ 经验蒸馏   │
 └──────────────────────────────────────────────┘
```

---

## 快速安装（30 秒）

```bash
# npm 包
npm install @yun520-1/heartflow

# 直接导入
const { HeartFlow } = require('@yun520-1/heartflow');
const hf = new HeartFlow({ rootPath: './' });
hf.start();
const result = await hf.think("这句话有没有问题？");
console.log(result._discrimination);
```

---

## 快速安装（MCP 模式）

```bash
# 克隆
git clone https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 启动（零配置）
node src/mcp-server.js --port 8588

# 连接 Hermes
hermes mcp add heartflow --url http://localhost:8588/mcp
```

---

## 开发状态

| 指标 | 值 |
|------|-----|
| 版本 | **v6.3.35** |
| JS 模块 | **385 个** |
| 代码行数 | **~205,000 行** |
| MCP 工具 | **36 个** |
| 辨别维度 | **13 维** |
| 公式库 | **619 个** |
| Git 提交 | **2,400+** |
| 测试 | **全部通过** |
| 架构 | 纯 Node.js · 零外部依赖 · 零 GPU |

---

## 架构原则

1. **辨别者定位** — AGI 五层只占第1层，不生成不推理
2. **零依赖** — 无需 LLM API、无需 GPU、无需数据库
3. **MCP 原生** — 所有能力通过 MCP 工具暴露
4. **可审计** — 每次决策保留完整推理链
5. **渐进可测** — 从单维检查到全 13 维审计

---

## 贡献

心虫是 AGI 验证层的开源实现。核心价值不在代码量，而在敢说"不对"的态度。

> "心虫要成为 AGI 的一部分，一小片也可以。" — 用户

[GitHub](https://github.com/yun520-1/mark-heartflow-skill) · [npm](https://www.npmjs.com/package/@yun520-1/heartflow) · [Releases](https://github.com/yun520-1/mark-heartflow-skill/releases)