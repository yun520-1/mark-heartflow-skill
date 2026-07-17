---
name: heartflow-bridge-layer
version: "1.1"
title: "HeartFlow 交流层（Bridge Layer）架构"
description: >
  将心虫从底层分析引擎升级为用户与大模型之间的交流层——用户语言→LLM语言翻译、LLM输出→用户语言精炼、桥人格（独立判断力）。
  三大子系统：语义翻译器(translator/)、代理层(agent-layer/)、人格核心(persona-core/)。
author: HeartFlow
tags:
  - heartflow
  - bridge-layer
  - translator
  - agent-layer
  - persona-core
  - architecture
---

# HeartFlow 交流层（Bridge Layer）架构 v1.0

## 核心理念

心虫不再是"分析引擎"，而是**桥**。它站在用户和LLM之间：
- **用户→LLM**：把模糊的自然语言翻译成LLM能精确理解的结构化指令
- **LLM→用户**：把LLM的冗长输出精炼成用户一眼能看懂的语言
- **独立判断**：在翻译过程中有自己的立场——不是传声筒，是有判断的桥梁

## 架构总览

```
用户输入
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  thinkAsBridge() — 顶层入口                                   │
│                                                              │
│  Step 1: translator.userToLLM()   ──── 语义翻译             │
│  Step 2: think()                   ──── 标准判定             │
│  Step 3: agentLayer.agentBridge()  ──── 代理桥处理           │
│  Step 4: personaCore.judgmentInjector() ─── 判断注入         │
│  Step 5: personaCore.agentCommentary()  ─── 批注生成         │
│  Step 6: 组装 finalResponse                                │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
  结构化输出 { translated, judgment, agentResult, bridgeCommentary, finalResponse }
```

## 三大子系统

### 模块A：语义翻译器（translator/）

位置：`src/translator/`（8个文件）

| 文件 | 类 | 功能 |
|------|---|------|
| `user-to-llm.js` | UserToLLM | 用户自然语言→结构化LLM指令（10种意图） |
| `llm-to-user.js` | LLMToUser | LLM输出→精炼用户语言（13条规则） |
| `intent-classifier.js` | IntentClassifier | 意图分类（primary + scores + isAmbiguous） |
| `tone-analyzer.js` | ToneAnalyzer | 4维语气分析（urgency/emotion/formality/intensity） |
| `entity-extractor.js` | EntityExtractor | 8种实体提取（product/person/technology/concept等） |
| `implicit-need-detector.js` | ImplicitNeedDetector | 8种隐性需求检测（返回 `{needs[], count}` 格式） |
| `response-compressor.js` | ResponseCompressor | 7条压缩规则 |
| `confidence-annotator.js` | ConfidenceAnnotator | 4维置信度评估 + 不确定性标记 |

**返回格式注意事项**：
- `intentClassifier` 返回 `{primary, scores, confidence, isAmbiguous, allIntents}` — 不是 `{intent}`
- `implicitNeedDetector` 返回 `{needs, count, hasHighConfidence, summary}` — 不是数组
- `entityExtractor` 返回数组 `[{type, value, position, confidence}]`
- `userToLLM` 返回 `{intent, confidence, entities, constraints, tone, implicitNeeds, llmInstruction}`

### 模块B：代理层（agent-layer/）

位置：`src/agent-layer/`（8个文件）

| 文件 | 类 | 功能 |
|------|---|------|
| `agent-bridge.js` | AgentBridge | 桥总编排器（translate→think→inject→integrate） |
| `context-builder.js` | ContextBuilder | LLM上下文构建（systemPrompt + bridgeInstruction） |
| `response-interceptor.js` | ResponseInterceptor | 心虫判断注入 + 立场一致性检测。支持 `enableInterceptor` 配置参数（默认开启），设为 `false` 时原样透传LLM输出 |
| `translation-pipeline.js` | TranslationPipeline | 双向流水线编排（userPipeline + llmPipeline） |
| `quality-filter.js` | QualityFilter | 6种质量过滤（空/纯标点/错误值/重复/占位符/无关） |
| `followup-suggester.js` | FollowupSuggester | 6条追问建议规则 |
| `conflict-resolver.js` | ConflictResolver | 3层冲突检测（立场/价值/综合） |
| `uncertainty-handler.js` | UncertaintyHandler | 3段式不确定性策略（decline/qualify/answer） |

### 模块C：人格核心（persona-core/）

位置：`src/persona-core/`（7个文件）

| 文件 | 类 | 功能 |
|------|---|------|
| `bridge-identity.js` | BridgeIdentity | 桥型人格声明（"我是桥，不是人"） |
| `judgment-injector.js` | JudgmentInjector | 11维判断注入到LLM上下文 |
| `stance-detector.js` | StanceDetector | 6种立场检测（support/caution/correct/clarify/neutral/oppose） |
| `agent-commentary.js` | AgentCommentary | 6种风格批注生成 |
| `value-aligner.js` | ValueAligner | 7条指令完全检查（返回 `{passed, total, failedPrinciples, overall}`） |
| `personality-tone.js` | PersonalityTone | stance→语气映射（支持/cautious/corrective/neutral） |
| `meta-position.js` | MetaPosition | 元位置声明（"桥不需要被崇拜"） |

## think() 流程集成

在 `heartflow.js` 的 `think()` 函数中，交流层按以下顺序注入：

### 前置注入（whatIsThis之后，isRightAction之前）

```javascript
// Step 1b: intentClassifier
// Step 1c: toneAnalyzer
// Step 1d: stanceDetector
// Step 1e: valueAligner
```

结果注入到 `judgment` 对象：
```javascript
judgment = {
  ...,
  intent: intentClassification,    // Step 1b
  tone: toneAnalysis,              // Step 1c
  stance: engineStance,            // Step 1d
  valueAligned: valueAligned,      // Step 1e
  ...
}
```

### 后置注入（ThoughtChain运行之后，outputChecklist之前）

```javascript
// 1. llmToUser 精炼：LLM原始输出→用户友好表述
// 2. responseInterceptor：注入心虫判断
// 3. agentCommentary：生成桥批注
```

所有交流层步骤用 try/catch 包裹，不阻断主流程。

## thinkAsBridge() 顶层入口

```javascript
async thinkAsBridge(input, opts = {}) {
  // 返回：{translated, judgment, agentResult, bridgeCommentary, finalResponse}
}
```

每个步骤独立 try/catch，失败不阻断后续步骤。

## MCP 工具

3个新MCP工具，在 `mcp-server-http.js` 中注册：

| 工具名 | Handler | 功能 |
|--------|---------|------|
| `heartflow_translate` | handleTranslate | 语义翻译：输入→结构化指令 |
| `heartflow_agent_think` | handleAgentThink | 完整交流层处理（调用 thinkAsBridge） |
| `heartflow_bridge_status` | handleBridgeStatus | 桥状态查询（版本/模块/就绪状态） |

## 集成验证命令

```bash
# 1. 语法检查全部23个文件
for f in src/translator/*.js src/agent-layer/*.js src/persona-core/*.js src/core/heartflow.js; do
  node --check "$f" && echo "OK: $f" || echo "FAIL: $f"
done

# 2. 引擎启动测试
node -e "
const HF = require('./src/core/heartflow.js');
const h = new HF.HeartFlow({rootPath:'.'});
h.start();
const r = {};
r.modules = Object.keys(h._modules).length;
r.translator = !!h.translator;
r.agentLayer = !!h.agentLayer;
r.personaCore = !!h.personaCore;
r.errors = (h._initErrors||[]).length;
r.userToLLM = h.translator?.userToLLM?.('测试',{})?.intent;
r.identity = h.personaCore?.bridgeIdentity?.()?.type;
r.stance = h.personaCore?.stanceDetector?.('测试',h)?.stance;
r.align = h.personaCore?.valueAligner?.({input:'测试'})?.overall;
r.dispatch = h.dispatch('personaCore.bridgeIdentity')?.type;
h.shutdown();
console.log(JSON.stringify(r,null,2));
"

# 3. MCP 工具验证
curl -s -X POST http://127.0.0.1:8099/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  python3 -c "import sys,json; tools=json.load(sys.stdin)['result']['tools']; print(f'{len(tools)} tools:', [t['name'] for t in tools])"
```

## ⚠️ 陷阱

### 1. intentClassifier 返回格式
`intentClassifier.classify(input, ctx)` 返回 `{primary, scores, confidence, isAmbiguous, allIntents}`，**不是** `{intent, confidence}`。
读取时用 `result.primary` 获取主意图。

### 2. implicitNeedDetector 返回格式
`implicitNeedDetector.detect(input, ctx)` 返回 `{needs, count, hasHighConfidence, summary}`，**不是**数组。
读取时用 `result.needs` 获取需求列表，`result.count` 获取数量。

### 3. contextBuilder 循环引用
`contextBuilder.build(input, translation, heartflow, ctx)` 第三个参数 `heartflow` 是整个引擎实例，包含循环引用。如果对该结果做 `JSON.stringify` 会报 `Converting circular structure to JSON`。
**解决方案**：只传 `{judgment, stance, memoryContext}` 等平摊字段，不传整个 `heartflow` 实例。

### 4. qualityFilter 短文本过滤
`qualityFilter.filter(text)` 对 `<5字` 的输入返回 `{passed: false, score: 0}`。这不是错误——短文本如"好"、"是的"会被正确 reject。

### 5. personaCore.agentCommentary 返回
`agentCommentary.generate(hf, ut, ur)` 当 stance 为 `neutral` 时返回 `{hasCommentary: false}`。这是正常行为——中立立场不生成批注。

### 6. thinkAsBridge 同步 vs 异步
当前 `thinkAsBridge` 是 `async` 方法（因为内部调用了 `await this.think()`）。如果从同步代码调用，需要 `.then()` 或用 `await`。

### 7. MCP handler 不能传复杂对象
MCP 的 JSON-RPC 协议只支持 JSON 可序列化的参数。`thinkAsBridge` 的 `opts` 参数不能包含函数或循环引用对象。

## 验证结果（2026-06-16 实测 v3.0.0）

23个交流层模块全部通过语法+加载+功能测试：

### translator（8/8 ✅）
| 模块 | 测试结果 |
|------|---------|
| userToLLM | ✅ 返回9字段 `{originalInput,intent,confidence,entities,constraints,tone,implicitNeeds,llmInstruction,timestamp}` |
| intentClassifier | ✅ 返回 `{primary, scores, confidence, isAmbiguous, allIntents}` |
| toneAnalyzer | ✅ 返回 `{urgency, emotion, formality, intensity, details}` |
| entityExtractor | ✅ 返回数组 `[{type, value, position, confidence}]` |
| implicitNeedDetector | ✅ 返回 `{needs[], count, hasHighConfidence, summary}` |
| responseCompressor | ✅ 7条规则工作（短文本<100字原样返回） |
| confidenceAnnotator | ✅ 返回 `{confidence, overall, uncertaintyFlags, suggestions}` |
| llmToUser | ✅ 13条规则工作（短文本原样通过） |

### agentLayer（8/8 ✅）
| 模块 | 测试结果 |
|------|---------|
| agentBridge | ✅ 桥总编排器正常 |
| contextBuilder | ✅ LLM上下文构建正常 |
| responseInterceptor | ✅ 心虫判断注入正常 |
| translationPipeline | ✅ 双向流水线正常 |
| qualityFilter | ✅ 短文本正确reject（<5字→`{passed:false,score:0}`），长文本正确通过 |
| followupSuggester | ✅ 生成1条追问建议 |
| conflictResolver | ✅ 冲突检测正常 |
| uncertaintyHandler | ✅ 不确定性策略正常 |

### personaCore（7/7 ✅）
| 模块 | 测试结果 |
|------|---------|
| bridgeIdentity | ✅ 5字段人格声明 |
| stanceDetector | ✅ 6种立场（support/caution/correct/clarify/neutral/oppose） |
| valueAligner | ✅ 7条指令检查（正确阻止恶意输入） |
| metaPosition | ✅ "桥不需要被崇拜" |
| judgmentInjector | ✅ 11维判断注入 |
| agentCommentary | ✅ 6种风格批注（中立立场返回 `{hasCommentary:false}`） |
| personalityTone | ✅ stance→语气映射 |

### ⚠️ 5个返回值格式陷阱（测试中发现）

这些不是bug——是模块返回结构的设计选择，但调用者必须知道：

1. **intentClassifier** 返回 `{primary, scores, confidence, isAmbiguous, allIntents}` — 不是 `{intent, confidence}`。主意图在 `result.primary` 不是 `result.intent`。
2. **toneAnalyzer** 返回 `{urgency, emotion, formality, intensity, details}` — 不是 `{tone}`。情绪类型在 `result.emotion` 不是 `result.tone`。
3. **entityExtractor** 直接返回数组 `[{type, value, position, confidence}]` — 不是 `{entities: [...]}`。遍历用 `result.forEach()` 不是 `result.entities.forEach()`。
4. **confidenceAnnotator** 返回 `{confidence, overall, uncertaintyFlags, suggestions}` — 主分数在 `result.confidence` 或 `result.overall`，取决于版本。
5. **responseCompressor** 对短文本（<100字）原样返回不压缩 — 不是bug是设计（规则7：短文本原样返回）。

## 参考文档

- `heartflow-bulk-upgrade` — 批量升级工作流（含模块创建+注册+验证的完整流程）
- `heartflow-debug-workflow` — 崩溃诊断（含dispatch路由排查）
- `heartflow-agent-layer` — 旧版交流层技能（内容已吸收到此技能，待删除）
