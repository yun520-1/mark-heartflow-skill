# think() decision-router 集成修复（2026-06-24）

## 背景

decision-router v4.1 已集成到 heartflow.js 但 **think() 的路由决策仍使用硬编码 if-else**。同时 timeExtension 分支存在变量顺序 bug。

## 两处修复

### 修复1：timeExtension 变量顺序 bug

**症状**：`timeExtension` 分支使用 `needsCrisis`、`needsSilence`、`isFableBlocked` 三个变量，但它们定义在 Step 13 之后（约第 1614 行），而 timeExtension 分支在约第 1579 行就已使用 → 守卫永远不生效。

**修复**：将变量定义上移到 timeExtension 之前（放在 Step 9 心理/哲学评估之后），并删除旧位置的重定义。

```javascript
// Step 9: 心理/哲学评估
const needsCrisis = false;      // 危机检测已整体删除
const needsSilence = false;     // 沉默判定已删除
const isFableBlocked = false;   // Fable 5 检查已删除
// ... timeExtension 分支可以直接使用这些变量 ...
```

### 修复2：decision-router 集成到 think()

**症状**：think() 在 13 步分析流水线之后，调用 `decisionRouter.evaluate()` 生成认知决策，但原代码只有硬编码 if-else 路由决策。

**修复**：在分析流水线末尾（Step 13 之后）添加：

```javascript
// decision-router 决策路由
let drDecision = null;
try {
  const drResult = this.decisionRouter.evaluate({
    result: analysis,
    memoryLayers: memoryStats,
    timeExtension: needsExtension,
    needsCare, needsSilence, needsCrisis
  });
  drDecision = drResult?.decision || null;
} catch (e) {
  drDecision = null;
}
```

并将 drDecision 注入返回值：

```javascript
return {
  ...analysis,
  routing: routingResult,
  drDecision  // ← 新增字段
};
```

## 验证

```bash
# 1. 语法检查
node --check src/core/heartflow.js

# 2. 引擎启动验证
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath:'.'});
h.start();
console.log('started:', h.started);
console.log('decisionRouter:', !!h.decisionRouter);
console.log('modules:', Object.keys(h._modules).length);
process.exit(0);
"

# 3. think() 返回含 drDecision
node -e "
const {HeartFlow} = require('./src/core/heartflow.js');
const h = new HeartFlow({rootPath:'.'});
h.start();
h.think('测试输入').then(r => {
  console.log('drDecision:', JSON.stringify(r.drDecision));
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
"
```

## 关键教训

1. **变量定义在引用之后** — JavaScript 的 `const`/`let` 没有 hoisting（不像 `var`），变量必须先定义再使用。当函数体较长（2000+行）时，变量定义的物理顺序至关重要。

2. **if-else 替换为决策路由** — think() 的原路由逻辑（11个 if-else 分支）替换为 `decisionRouter.evaluate()` 后，新增 `drDecision` 字段。两者正交：原有路由决定响应类型，决策路由决定认知策略。

3. **作用域陷阱** — `let drDecision = null;` 必须定义在 try-catch 块**之外**才能被后续代码访问。如果在 try 块内声明，外部无法引用。

4. **测试验证链** — 语法检查 → 引擎启动 → think() 调用 → 返回值含新字段。跳过任何一步都可能漏掉作用域/async/字段缺失等 bug。
