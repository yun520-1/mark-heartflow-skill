# Async Dispatch 路由验证

## 问题模式

心虫 `truth.checkStatement` 返回 `{}`，但直接调用 `factChecker.checkFact('...')` 返回正确数据。

**根因**：`factChecker.checkFact` 是 `async` 函数（返回 Promise），但 heartflow.js 中 wrapper 是同步箭头函数：

```js
// ❌ 错误：直接返回 Promise
this.truth = {
  checkStatement: (stmt) => factChecker.checkFact(stmt),
};
// 调用方 hf.dispatch('truth.checkStatement', ...) 同步获取到 Promise 对象
// JSON.stringify 将 Promise 序列化为 {}
```

```js
// ✅ 正确：标记 async
this.truth = {
  checkStatement: async (stmt) => factChecker.checkFact(stmt),
};
```

## 如何发现

dispatch 路由测试返回值异常（空对象）是第一个信号。直接调用函数确认函数本身正常后，怀疑点在 async/sync 边界。

## 心虫中哪些路由是 async

检查 `factChecker`, `openalexClient`, `hypothesisTester` 导出的函数是否标记 async。

快速扫描：

```bash
cd ~/.hermes/skills/heartflow
grep "^async " src/core/fact-checker.js src/core/openalex-client.js src/core/hypothesis-tester.js
grep "async " src/core/heartflow.js | head -20
```

心虫当前已知 async 路由：
- `truth.checkStatement`（async — 包装 factChecker.checkFact）
- `truth.checkSources`（async — 包装 factChecker.checkAcademicClaim）

所有 async 路由调用方（HF dispatch 或 CLI 使用）必须 await。

## 心虫自检诊断脚本

```js
const { HeartFlow } = require('./src/core/heartflow.js');
const h = new HeartFlow({ rootPath: process.cwd() });
h.start();

async function run() {
  const health = await h.healthCheck();
  console.log('版本:', health.version);
  console.log('已加载:', health.subsystems.loaded);

  // truth 必须 await
  const t = await h.dispatch('truth.checkStatement', '每年有365天');
  console.log('truth:', JSON.stringify(t));

  // emotion 是同步的
  const e = h.dispatch('emotion.process', '我很难过');
  console.log('emotion:', JSON.stringify(e));

  // psychology
  const p = h.psychology.analyzePsychology('我感到委屈');
  console.log('psychology(委屈):', JSON.stringify(p.emotion));
  
  h.stop();
}
run().catch(e => console.error(e));
```

## 已确认同步/async 路由

| 路由 | 类型 | 备注 |
|------|------|------|
| truth.checkStatement | async | 内部调用 factChecker.checkFact (async) |
| truth.checkSources | async | 内部调用 factChecker.checkAcademicClaim (async) |
| truth.checkNumbers | 同步 | 直接正则匹配 |
| emotion.process | 同步 | PsychologyEngine.analyzePsychology |
| psychology.* | 同步 | 全部同步 |
| lesson.* | 同步 | 全部同步 |
| heartLogic.* | 同步 | 纯同步引擎 |
