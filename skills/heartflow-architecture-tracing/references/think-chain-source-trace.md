# think() → "不知道" 完整路径追溯

> 2026-06-23 session 实测。追踪 "分析巴格内尔" → "不知道，缺少关键信息" 的完整代码路径。

## 输入

```
"分析巴格内尔"
```

## 路径

### heartflow.js think() 第26行

```javascript
const startPatterns = /^(启动引擎|开机|activate|start heartflow|开启引擎)/i;
// "分析巴格内尔" → 不匹配
```

### heartflow.js think() 第48-51行 — 分析流水线

```javascript
const whatIsThisResult = heartLogic.whatIsThis(input, {});
```

whatIsThis() 是本地 JS 函数，检查正则模式：
- `/代码|编程|js|javascript/` → 不匹配
- `/感觉|觉得|难过|开心/` → 不匹配
- `/分析/` → **不在任何匹配模式中**

→ `{ isTechnical: false, isCode: false, isEmotional: false, ... }`

### heartflow.js think() 第160-188行 — 路由决策

```javascript
_routeHint = { type: 'general', confidence: 0.5 };
```

"分析巴格内尔" → 不触发任何特殊路由（不 crisis、不 silent、不 empathic、不 technical）→ **general**

### heartflow.js think() 第193-200行 — ThoughtChain

```javascript
const chain = new ThoughtChain(this);
const chainResult = await chain.run(input);
```

进入 thought-chain.js。

### thought-chain.js _classifyTask()

```javascript
_classifyTask(input) {
  const q = input.toLowerCase();
  if (/\d+[+\-*/=]/.test(q)) return 'calculation';       // "分析巴格内尔" → 不匹配
  if (/为什么|原因|原理/.test(q)) return 'explanation';     // 不匹配
  if (/对不对|是否|应该/.test(q)) return 'judgment';         // 不匹配
  if (/是什么|定义|概念/.test(q)) return 'retrieval';        // "分析"不在列表中！
  return 'general';                                          // → 默认
}
```

**"分析"不在任何分类模式中。** 如果加了 `/分析/`，会匹配到 `explanation` 或 `retrieval`。

### thought-chain.js PARSE 阶段

```javascript
_extractVariables("分析巴格内尔") → {
  numbers: [],
  entities: ["分析巴格内尔"],  // 中文不分词，整体作为实体
  actions: []
}
```

### thought-chain.js HYPOTHESES 阶段

```javascript
_generateHypotheses(input, count) {
  const keywords = input.split(/\s+/).filter(w => w.length > 2).slice(0, 3);
  // "分析巴格内尔".split(/\s+/) → ["分析巴格内尔"]
  // keywords.length = 1 < 2
  return [];  // ⚠️ 返回空数组！
}
```

**根因 #1：中文分词。** `split(/\s+/)` 对中文无效。

### thought-chain.js INVERT 阶段

```javascript
// 没有假设 → inverted: false, reason: 'no_hypothesis'
```

### thought-chain.js EVIDENCE 阶段

```javascript
const hypotheses = [];  // 空
const evidenceForHypotheses = [];
// 没有假设 → 没有证据
const strongHypothesis = null;
const hasWeakSupport = false;
```

### thought-chain.js EVIDENCE 阶段 — 调用 dispatch

```javascript
try {
  commonsenseResult = hf.dispatch('commonsenseEngine.validate', h.description, ...);
} catch (e) { commonsenseResult = null; }
```

**心虫尝试调 commonsenseEngine，但它是 Tier 2 懒加载模块，从未被初始化。** 所以 catch 静默吞错，返回 null。

### thought-chain.js SYNTHESIS 阶段

```javascript
if (!strongHypothesis) {
  conclusion = '需要更多信息';
  confidence = 0.3;
  reasoningChain = ['任务类型: general', '深度: 3'];
}
```

### thought-chain.js CALIBRATE 阶段

```javascript
_getUncertaintyPhrase(0.3) → '不知道，缺少关键信息'
```

CALIBRATE 还调用了 ConfidenceCalibrator（本地规则），输出：
```json
{
  "raw": 0.48,
  "level": "low",
  "scores": {
    "evidenceCoverage": 0.5,
    "consistency": 0.6,
    "specificity": 0.5,
    "sourceReliability": 0.5,
    "complexityFit": 0.3
  },
  "calibrationPhrases": ["不确定", "我不太确定", "这需要进一步验证"]
}
```

### thought-chain.js RESPOND 阶段

```javascript
prefix: "不知道，缺少关键信息 "
conclusion: "不知道，缺少关键信息 需要更多信息"
```

### heartflow.js think() 返回

```json
{
  "output": { "conclusion": "不知道，缺少关键信息 需要更多信息", "meta": {...} },
  "type": "general",
  "confidence": 0.3,
  "thoughtChain": { "stages": [...], "totalDuration": 0, "depth": 3 },
  "meta": { "routeHint": { "type": "general", "confidence": 0.5 } }
}
```

## 修复方向

### 修复1：中文分词

安装 `nodejieba`，替换 `split(/\s+/)`：
```javascript
const nodejieba = require('nodejieba');
const keywords = nodejieba.cut(input).filter(w => w.length > 1).slice(0, 3);
// "分析巴格内尔" → ["分析", "巴格内尔"]
// keywords.length = 2 ≥ 2 → 生成假设！
```

### 修复2：扩展分类模式

```javascript
if (/分析|评价|评估|评价|解读/.test(q)) return 'explanation';
if (/是谁|什么是|查|搜索|查找/.test(q)) return 'retrieval';
```

### 修复3：_findEvidence 不返回空数组

至少从记忆中检索相关上下文：
```javascript
_findEvidence(hypothesis, input) {
  const mem = this.hf?.memory;
  if (mem && typeof mem.searchByKeywords === 'function') {
    return mem.searchByKeywords(hypothesis.description, 5);
  }
  return [];
}
```

### 修复4：API 回退

当本地规则无法生成答案时（confidence < 0.4），调 API：
```javascript
if (finalConfidence < 0.4) {
  const apiResult = await callLLM(input);  // 调 deepseek-v4-flash
  return { output: apiResult, type: 'api_fallback', confidence: 0.7 };
}
```

## 相关文件

- `src/core/heartflow.js` — think() 方法（11304 chars）
- `src/core/thought-chain.js` — 思维链（~1500 lines）
- `src/core/decision-router.js` — 决策路由（1129 lines）
- `src/core/decision-router-v4.js` — 概率分布版本（new）
- `tests/compare-decision-router.js` — 新旧对比测试
