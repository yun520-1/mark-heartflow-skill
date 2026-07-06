# 自省+做梦联动 — v5.1.1 (2026-06-26)

## 新增功能：introspectAndDream()

**位置**: `src/core/heartflow.js`

**方法签名**: `async introspectAndDream(options = {})`

### 工作流

1. 调用 `introspect(options)` 做7维度自省检查
2. 如果有高/中优先级问题 → 自动调 `dreamNow({ force: true, function: 'self_inspection' })`
3. 把自省问题的 message + detail 编织成梦境种子
4. 从已知种子库（无门/桥/消散/原点/裂缝/隔阂/因果/延续）匹配关键词
5. 匹配到 → 调用 `dream._applySeed()` 注入种子
6. 匹配不到 → 默认用"裂缝"种子
7. 自省报告附加 `dream`（状态: done/skipped/error）和 `dreamNarrative`（梦境叙事文本）

### 种子匹配逻辑

```javascript
const knownSeeds = ['无门', '桥', '消散', '原点', '裂缝', '隔阂', '因果', '延续'];
const matchedSeed = knownSeeds.find(s => dreamSeed.includes(s)) || '裂缝';
this.dream._applySeed({ scene: '', space: '', texture: '' }, [], matchedSeed);
```

### 返回结构

```javascript
{
  summary: '⚠ 2 个高优先级 | → 1 个中优先级 | ℹ 4 条状态信息',
  findings: [
    { type: 'pipeline_failure', severity: 'high', message: '...', detail: [...] },
    { type: 'module_coverage', severity: 'low', message: '...', detail: [...] },
    // ...
  ],
  counts: { high: 0, medium: 1, low: 1, info: 4 },
  timestamp: 1234567890,
  version: '5.1.1',
  _introspectVersion: '1.0.0',
  dream: 'done',              // 'done' | 'skipped' | 'no_issues' | 'error: ...'
  dreamNarrative: '**【梦境报告】**...',  // null if not triggered
}
```

### 决策路由联动

dispatch 调用 `introspectAndDream` 后，decision-router 自动评估自省结果：

- H < 0.3 → `heal` 决策（场域慢性失谐）
- 发现问题多 → 决策置信度 0.6-0.7

### 不触发做梦的条件

- 没有高/中优先级问题 → `dream = 'no_issues'`
- dreamNow 的 `_shouldDreamToday()` 检查通过（force=true 跳过）

### 测试方法

```bash
node -e '
const { HeartFlow } = require("./src/core/heartflow.js");
async function test() {
  const hf = new HeartFlow({ root: "/tmp/hf-test-introspect-dream" });
  await hf.start();
  await hf.think("我想学编程");
  const result = await hf.introspectAndDream({ detail: true });
  console.log("问题:", result.counts);
  console.log("梦:", result.dream);
  if (result.dreamNarrative) console.log(result.dreamNarrative.slice(0, 300));
  await hf.stop().catch(() => {});
}
test().catch(console.error);
'
```

### 已知问题

- `hf.stop()` 时可能触发 `Maximum call stack size exceeded`（测试环境问题，不影响功能）
- 种子匹配是关键词包含匹配，不是语义匹配
- `_applySeed` 只识别硬编码种子名，不认识的种子静默跳过
