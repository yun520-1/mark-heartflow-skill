# 心虫评测方法论（v5.5.1）

> 2026-06-29 实测总结

## 评测路径

### ❌ 错误路径：直接 require heartflow.js

```javascript
const HeartFlow = require('~/skills/ai/mark-heartflow-skill/src/core/heartflow.js');
const engine = new HeartFlow.HeartFlow(hfDir, { silent: true, minimal: true });
engine.start();
const r = engine.think("test");
```

**问题**：
- `module.exports = { HeartFlow, createHeartFlow, VERSION }` — 需要 `.HeartFlow` 解构
- think() 是 async 函数，不 await 返回 `{}`（Promise 被 JSON.stringify）
- think() 会超时（30s+）因为 await 内部可能死锁
- require 缓存：改代码后需重启进程

### ✅ 正确路径：MCP think_fast

```python
import subprocess, json

HF_DIR = "http://127.0.0.1:8099/mcp"

def think(input_text):
    payload = {
        "jsonrpc": "2.0", "id": 1,
        "method": "tools/call",
        "params": {"name": "heartflow_think_fast", "arguments": {"input": input_text}}
    }
    r = subprocess.run(["curl", "-s", "-X", "POST", HF_DIR,
        "-H", "Content-Type: application/json", "-d", json.dumps(payload)],
        capture_output=True, text=True, timeout=15)
    try:
        data = json.loads(r.stdout)
        text = data.get("result", {}).get("content", [{}])[0].get("text", "")
        return json.loads(text).get("result", {})
    except:
        return {}
```

**优势**：
- MCP server 常驻进程（launchd 管理），不需要每次启动引擎
- think_fast 返回原始 think() 输出（无 report 包装）
- 0-1ms 完成（同步 pipeline）
- 重启 MCP：`kill -9 <PID>`（launchd 自动重启）或 `launchctl kickstart gui/501/com.heartflow.mcp`

## MCP 返回结构

### heartflow_think vs heartflow_think_fast

| 工具 | 返回结构 | 适用场景 |
|------|---------|---------|
| `heartflow_think` | `{ report, timestamp }` — report 含 cognition 摘要 | 完整分析 |
| `heartflow_think_fast` | `{ input, result, timestamp }` — result 是原始 think() 输出 | **评测** |

### 字段路径

```
result (think_fast) 或 report (think)
  ├── cognition           → 所有认知数据
  │   ├── whatIsThis      → 类型/类别/情绪/置信度
  │   │   ├── type        → calculation/code/explanation/judgment/general
  │   │   ├── category    → code/math/emotion/memory/technical/general
  │   │   ├── emotion     → anger/sadness/fear/joy/neutral
  │   │   └── confidence  → 0.0-1.0
  │   ├── logicReasoning  → 推理类型检测
  │   │   └── reasoningType
  │   │       ├── primaryType  → deductive/inductive/abductive/analogical/causal/statistical/general
  │   │       └── primaryScore → 0.0-1.0
  │   ├── decision        → 决策路由输出
  │   │   ├── type        → hold/pause/accelerate/turn/heal/resonate/transmit/rest
  │   │   └── confidence  → 0.0-1.0
  │   └── memoryHits      → 记忆命中数
  ├── decision (顶层)      → 快速决策摘要
  ├── psychology          → 情绪分析
  │   └── emotion         → 情绪字符串
  └── judgment            → 判断引擎结果
```

**重要**：评测时读 `result.cognition.*`，不是顶层字段。顶层 `decision` 和 `psychology` 是简略版。

## 逻辑推理检测细节

### 推理类型模式（REASONING_PATTERNS）

| 类型 | 关键词量 | minKeywords | weight |
|------|---------|-------------|--------|
| deductive | 90+（含 >, <, >=, <=, ==, !=, so） | 2 | 0.25 |
| inductive | 30+ | 3 | 0.20 |
| abductive | 20+ | 2 | 0.20 |
| analogical | 15+ | 2 | 0.25 |
| causal | 20+ | 2 | 0.20 |
| statistical | 20+ | 2 | 0.20 |

**评分公式**：`score = sum(hits × weight)`，上限 1.0。阈值：`bestScore < 0.2` → general。

**传递推理修复**（v5.5.1）：新增 `>`, `<`, `>=`, `<=`, `==`, `!=`, `so` 到 deductive 关键词。`"A > B, B > C, so A > C"` → hits=2(> + so) → score=0.5 → deductive。

### 检测优先级

1. 每个 pattern 独立计算 score
2. 取最高 score 的 pattern.id 作为 primaryType
3. 如果所有 score < 0.2，返回 general

## 情绪检测细节

心虫有两层情绪检测：

1. **whatIsThis.emotion** — 基于 `_emotionKeywords` 信号列表（`emotionSignals`）
2. **psychology.emotion** — PAD 模型分析

评测时用 `whatIsThis.emotion`（更直接、基于关键词匹配）。

### 情绪信号列表

| 情绪 | 信号词 |
|------|--------|
| anger | 怒、恨、烦、受不了、气死了、恼火、火大、受够了、生气、tmd、操 |
| sadness | 难过、伤心、伤心、悲伤、痛苦、心碎、哭、泪、失望、失落、绝望 |
| fear | 焦虑、紧张、害怕、恐惧、担心、不安、慌、吓、恐怖、胆怯 |
| joy | 高兴、开心、快乐、兴奋、激动、太棒了、太好了、成功、庆祝、完美 |
| pain | 疼、痛、难受、不舒服、累、困、疲劳、辛苦、折磨 |
| tired | 累、困、疲劳、疲惫、无力、没力气、不想动、没精神、没劲 |
| neutral | 无以上信号 |

**修复记录**（v5.5.0）：新增"受够了"和"生气"到 anger 列表。"气死了"已在 v5.2.2 修复过。

## 意图分类细节

`whatIsThis.type` 由 `_classifyTask(input)` 决定，`whatIsThis.category` 由 `_categorize(input)` 决定。

### 类型判断优先级（从高到低）

1. **calculation** — `/计算|多少|等于|加减乘除|算式|1\+1|\d+\s*[+\-*/×÷=]\s*\d+/`
2. **code** — `/代码|函数|写一个|写个|帮我写|实现|编程|算法|排序|查找|二分|bug|error|debug|function|class|import/`
3. **explanation** — `/为什么|原因|原理|怎么来的|是什么|定义|概念|指什么/`
4. **memory** — `/上次|之前|以前|你记得|我们说|刚刚|刚才/`
5. **judgment** — `/该不该|要不要|对不对|好不好|值不值得|建议|推荐|你觉得|你认为/`
6. **retrieval** — `/查|找|搜索|查一下|查查/`
7. **default** → general

**注意**：`code` 类型判断优先于 `retrieval`（v5.5.0 修复）。"帮我写一个二分查找"中"查找"不再触发 retrieval 的 `/查|找/` 正则，因为 code 判断优先执行。

### 类别判断

- `code` — 代码/函数/算法/编程相关
- `math` — 数字/计算相关
- `emotion` — 情绪/心情/难过/开心/生气/焦虑相关
- `memory` — 记忆/上次/之前/以前相关
- `technical` — 技术问题
- `general` — 默认

## 决策路由细节

### 字段注入（pipeline decision 阶段）

| 字段 | 来源 | 计算方式 |
|------|------|----------|
| cognitiveLoad | agentPsych | cognitiveLoad.load 或默认0 |
| directionClear | judgment | act→0.8, analyze→0.6, 其他→0.3 |
| quality | judgment | judgment.confidence |
| dissonance | agentPsych | cognitiveDissonance.count×0.2 |
| stability | agentPsych | identityDrift→0.3, 否则0.7 |
| severity | heartLogic | painLevel→high/medium/undefined |
| identityCoherence | agentPsych | identityDrift→0.8, 否则0.5 |
| desireDominant | deepCognition | desire.dominantDesire |
| poisonLevel | deepCognition | threePoisons.totalToxicity |

### 兜底规则（v5.4.1）
无规则匹配时返回 `{ type: 'hold', confidence: 0.3 }`，不是 null。

## MCP Server 注意事项

### 两个副本

| 路径 | 用途 | 修改后需 |
|------|------|---------|
| `~/.hermes/skills/heartflow/mcp/mcp-server-http.js` | 技能目录源码 | 同步到运行目录 |
| `~/.hermes/mcp-servers/heartflow/src/mcp-server-http.js` | **实际运行** | kill -9 重启 |

**核心教训**：修改技能目录的 mcp-server-http.js 不影响运行进程。必须修改 `~/.hermes/mcp-servers/heartflow/src/mcp-server-http.js` 并重启 MCP。

### 空输入验证
```javascript
// 修复前（v5.5.0）
if (!input) throw new Error('input 是必填参数');  // 空字符串被拦截

// 修复后（v5.5.1）
const { input = '' } = args;
if (typeof input !== 'string') throw new Error('input 必须是字符串');  // 允许空字符串
```

### MCP 进程管理
```bash
# 查进程 PID
lsof -i :8099 -P -n | grep LISTEN

# 硬重启（kill -9 后 launchd 自动重启）
kill -9 <PID>

# 等待重启
sleep 2
lsof -i :8099 -P -n | grep LISTEN
```

## 稳定测试集（16题，100%通过）

见 `docs/benchmark-report-v5.5.1.md`。
