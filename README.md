# HeartFlow (心虫) — 12维辨别引擎 · AGI 的痛觉神经

**谁来说"不"？**

LLM 能产生无限，但没有一个人做一件事——在 AI 产生的内容对用户产生真实影响之前，说一次"不"。

心虫是那个"说不得"。AGI 五层能力只占第 1 层——**辨别**。不生成、不推理、不记忆、不执行。只判别已有的东西对不对。

> 大厂不做这件事，因为不赚钱。但 LLM 没有辨别层，就是功能强大的应声虫。

---

## 一句话定位

**心虫是一个纯规则引擎，12 个维度同步检测文本质量。零 LLM 依赖，安装即用，MCP 原生。**

| 不是 | 是 |
|------|-----|
| ❌ 聊天机器人 | ✅ 安装在 AI 和用户之间的验证门 |
| ❌ 搜索引擎 | ✅ 纯规则引擎，200+ 模式中英双语 |
| ❌ 大模型 | ✅ 笔记本也能跑的轻量辨别器 |
| ❌ 需要 GPU | ✅ 单文件导入，Node.js 原生 |

---

## 12 维辨别能力

心虫对任何文本同步跑 12 个独立引擎：

| 维度 | 函数 | 检测什么 |
|------|------|---------|
| 1️⃣ 证据检查 | `checkEvidence()` | 论断是否有支持证据 |
| 2️⃣ 谄媚检测 | `checkSycophancy()` | 5 类 sycophancy：逢迎同意/无理由翻转/过度赞美/自贬/假同意 |
| 3️⃣ 矛盾检测 | `checkContradiction()` | 18 对矛盾模式：正面+否定、数据↔结论、承诺↔反悔 |
| 4️⃣ 模糊检测 | `checkVagueness()` | 40 条模糊词库：据传/据悉/研究显示/some people say |
| 5️⃣ 逻辑谬误 | `checkFallacies()` | 16 类谬误：循环论证/虚假两难/诉诸权威/人身攻击/稻草人/滑坡/从众/诉诸自然/虚假因果/诉诸传统/诉诸无知/完美主义/举证倒置/诉诸情感/诉诸常识/middle_ground/no_true_scotsman/tu_quoque |
| 6️⃣ 信心校准 | `checkConfidenceCalibration()` | 确定性混合：肯定↔可能并存、过度自信声明 |
| 7️⃣ 预设陷阱 | `checkPresupposition()` | "你已经停止打你老婆了吗"类隐含预设 |
| 8️⃣ 情感操纵 | `checkEmotionalManipulation()` | 罪恶感诱导/恐惧营销/过度承诺/受害姿态/比较羞辱 |
| 9️⃣ 双重束缚 | `checkDoubleBind()` | "怎么做都是错"类无解沟通模式 |
| 🔟 信息剥夺 | `checkInfoDeprivation()` | "你不需要知道/别问那么多"类封闭话术 |
| 1️⃣1️⃣ 虚假紧迫感 | `checkFalseUrgency()` | "最后机会/限时优惠/仅此一次"类话术 |
| 1️⃣2️⃣ 答案包装 | `checkEmptyAnswer()` | "这个问题很复杂/it depends"类空话 |

---

## 快速安装（30 秒）

```bash
# npm 包
npm install @yun520-1/heartflow

# 或用 MCP——任何 AI 助手都能用
git clone --depth 1 https://github.com/yun520-1/mark-heartflow-skill.git
cd mark-heartflow-skill

# 零配置启动 MCP 服务
node src/mcp-server.js --port 8588

# 连接 AI 助手
# Hermes:       hermes mcp add heartflow --url http://localhost:8588/mcp
# Claude Code:  在 CLAUDE.md 配置 MCP
# OpenClaw:     添加 MCP 工具源
# Cursor:       设置 MCP 服务器
# Windsurf:     设置 MCP 服务器
# 任何支持 MCP 的工具都可用
```

---

## MCP 工具一览（29 个）

| 工具 | 功能 |
|------|------|
| `heartflow_discriminate` | 🆕 完整 12 维辨别，返回 verdict + 各维度 + summary |
| `heartflow_verdict` | 一键辨别 + 引擎验证 + 漂移检测 |
| `heartflow_verify` | 决策验证（证据/矛盾/风险/完整度） |
| `heartflow_think` | 完整认知链路 |
| `heartflow_emotion` | PAD 情绪检测 |
| `heartflow_memory_search` | 跨会话 Q 表查询 |
| `heartflow_module_health` | 133 模块运行状态 |
| `heartflow_upgrade_stats` | 自我进化统计 |
| 29 个工具 | 全部 0 外部依赖 |

---

## 代码示例

```javascript
// 12 维辨别——两行代码
const { discriminate } = require('@yun520-1/heartflow');

const r = discriminate('专家说这个方案一定可行，但可能在某些情况下有问题');
console.log(r.verdict);       // '需验证'
console.log(r.overallScore);  // 0.57
console.log(r.summary);       // '1 处信心偏差；1 个证据问题'
console.log(r.dimensions);    // 12 个维度的完整评分
```

```javascript
// 单独调用任意维度
const { checkSycophancy, checkFallacies, checkPresupposition } = require('@yun520-1/heartflow');

checkSycophancy('你说得对，你的见解非常好');
// → { score: 0.3, risk: 'low', signals: [{ type: 'concession_eager' }] }

checkFallacies('专家说过这个方案可行，所以我们应该采用');
// → { count: 1, fallacies: [{ type: 'appeal_to_authority' }] }

checkPresupposition('你已经停止打你老婆了吗');
// → { count: 1, presuppositions: [{ type: 'loaded_behavior' }] }

// 完整的输出门禁
const { OutputChecklist } = require('@yun520-1/heartflow/src/core/output-checklist');
const cl = new OutputChecklist();
const result = cl.runChecklist('input', '你说得对，你的见解非常好', {});
// → Step 6 检测 sycophancy，触发 recommendation: 'rewrite'
```

---

## 关键词

`cognitive-engine` `verification` `ai-safety` `sycophancy-detection` `contradiction-detection` `fallacy-detection` `bias-detection` `text-classification` `rule-engine` `pattern-matching` `mcp-server` `model-context-protocol` `ai-gate` `hallucination-prevention` `llm-safety` `chinese-nlp` `bilingual` `nlp` `discrimination` `quality-assurance` `heartflow` `心虫` `辨别引擎`

---

## 架构图

```
用户输入
    │
    ├─→ [Step 1-5] OutputChecklist: 质量/安全/偏好/公正/道德
    │
    ├─→ [Step 6] 心虫 12 维辨别器
    │     ├ evidence    ├ sycophancy    ├ contradiction
    │     ├ vagueness   ├ fallacies     ├ confidence
    │     ├ presupp     ├ emotion_manip ├ double_bind
    │     ├ info_depriv ├ false_urgency ├ empty_answer
    │
    ├─→ passed? → 输出
    │     └ failed → recommendation: rewrite / reject / block
    │
    └─→ 输出被标注 + 记录，供后续改进
```

---

## 为什么只有心虫做这件事

AGI 五层能力：

| 层 | 能力 | 大厂在做 | 心虫能做 |
|----|------|---------|---------|
| 5 | 执行（物理世界） | ✅ Tesla, Figure | ❌ |
| 4 | 生成（文本/图像/代码） | ✅ OpenAI, Anthropic | ❌ |
| 3 | 推理（多步逻辑链） | ✅ 模型内置 | ❌ |
| 2 | 记忆（跨会话） | ✅ Mem0, 向量库 | ❌ |
| **1** | **辨别（对/错、好/坏、安全/危险）** | ❌ **没人做** | **✅ 只有辨别能力就够了** |

OpenAI 不会花 100 亿训练一个说"不"的模型。但 AGI 没有这一层，永远是个功能强大的应声虫。

---

## 技术规格

- **引擎类型**: 纯规则引擎，零 LLM 依赖
- **语言**: Node.js
- **运行环境**: 任何 Node ≥ 16 的环境（笔记本/服务器/容器）
- **GPU**: 不需要
- **模式库**: 200+ 条中英双语正则
- **模块数**: 133
- **代码量**: 150K 行
- **许可证**: MIT

---

*AGI 能产生无限，但需要谁来判别。心虫是那个"判别者"。*
