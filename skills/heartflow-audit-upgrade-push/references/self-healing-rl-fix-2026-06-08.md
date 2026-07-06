# 自愈RL闭环修复记录 — 2026-06-08

**版本：** HeartFlow v2.5.7 → v2.6.0
**来源：** 心虫骨架诊断对话

## 诊断发现

### 核心问题

| # | 问题 | 严重度 |
|---|------|--------|
| 1 | heartflow.js 主入口（1421行）完全未实例化 SelfHealing | 🔴 CRITICAL |
| 2 | heartflow-engine.js 调用 `record()` 缺 repairOutcome 参数 | 🔴 CRITICAL |
| 3 | SelfHealing 和 SelfEvolutionCore 各持独立 RL 实例 | 🔴 CRITICAL |
| 4 | Q-table 写入无防抖/锁 | 🟡 HIGH |
| 5 | Q-table 仅 4 条记录，history 完全为空 | 🟡 HIGH |

### 根因分析

**问题1-2 是同一个 bug 的两面：**
- `heartflow.js` 的 `start()` 方法初始化了 70+ 模块，但唯独没有 `selfHealing`
- `heartflow-engine.js` 的 `runRuntimeReliabilityLoop` 中，`record()` 只传了 `{type, message, code}`，没传第二个参数 `repairOutcome`
- 更严重的是 `record()` 在 `recover()` 之前调用——此时 `_pendingCtx` 为空，即使传了 `repairOutcome` 也无法更新 Q-table

**问题3：**
`self-evolution-core.js` 在自己的构造函数中 `new HealingMemoryRL(100)`，与 `SelfHealing` 的 RL 实例完全独立。两个实例各自维护内存中的 Map，虽然指向同一个 `memory/q-table.json` 文件，但内存状态不同步。

### 数据现状

```json
// memory/q-table.json — 仅4条
{
  "test_v1_3_11@default:unknown:unknown": { "修复策略": { "qValue": 0.6, "uses": 2 } },
  "timeout@default:prod:unknown": { "retry": { "qValue": 0.8, "uses": 2 }, "restart": { "qValue": 0.6, "uses": 2 }, "skip": { "qValue": 0.3, "uses": 2 } },
  "error1@default:unknown:unknown": { "strategyA": { "qValue": 0.6, "uses": 2 }, "strategyB": { "qValue": 0.3, "uses": 2 } },
  "ECONNREFUSED@default:unknown:unknown": { "retry": { "qValue": 0.6, "uses": 2 }, "fallback": { "qValue": 0.15, "uses": 2 } }
}
// history: [] — 完全为空
// q-meta.json — 仅2条meta（另2条缺失）
```

## 修复方案

### 1. heartflow.js 集成 SelfHealing

```javascript
// constructor 中声明
this.selfHealing = null;
this.selfEvolution = null;

// start() 中实例化
const { SelfHealing } = require('./self-healing.js');
this.selfHealing = new SelfHealing({ rootPath: this._rootPath });

// 合并 RL 实例
const { SelfEvolutionCore } = require('./self-evolution/self-evolution-core.js');
this.selfEvolution = new SelfEvolutionCore({ memory: this.meaningfulMemory });
this.selfEvolution.rl = this.selfHealing.rl; // 指向同一实例

// 注册到 _modules
this._modules.selfHealing = this.selfHealing;
this._modules.selfEvolution = this.selfEvolution;
```

### 2. heartflow-engine.js 修复调用顺序和参数

```javascript
// 修复前（Q-table 永不更新）：
selfHealing.recover(error);
// ... 其他处理 ...
selfHealing.record({ type, message, code });  // 缺 repairOutcome，且 record 在 recover 之前

// 修复后：
const repairResult = selfHealing.recover(error);
const success = repairResult && repairResult.strategy === 'retry';
// record() 在 recover() 之后，且传 repairOutcome
selfHealing.record({ type, message, code }, !success);
```

### 3. 合并 RL 实例

将 `self-evolution-core.js` 中的独立 RL 实例指向 `SelfHealing` 的实例：
```javascript
// self-evolution-core.js constructor — 不再 new HealingMemoryRL
this.rl = null;  // 由外部注入

// heartflow.js start() — 注入
this.selfEvolution.rl = this.selfHealing.rl;
```

### 4. Q-table 写入防抖

```javascript
_debouncedSave() {
  if (this._saveInProgress) {
    this._saveDirty = true;
    return;
  }
  this._saveInProgress = true;
  this._saveDirty = false;
  this._saveQTable()
    .then(() => {
      this._saveInProgress = false;
      if (this._saveDirty) {
        this._debouncedSave(); // 再次写入
      }
    })
    .catch(e => {
      this._saveInProgress = false;
      console.error('[HealingMemoryRL] save failed:', e.message);
    });
}
```

## 验证方法

```bash
# 1. 验证 SelfHealing 已加载
node -e "
const { HeartFlow } = require('./src/core/heartflow.js');
const hf = new HeartFlow({ rootPath: __dirname });
hf.start();
console.log('selfHealing:', !!hf.selfHealing);
console.log('selfEvolution:', !!hf.selfEvolution);
console.log('RL shared:', hf.selfEvolution?.rl === hf.selfHealing?.rl);
hf.shutdown();
"

# 2. 验证 Q-table 更新
node -e "
const { SelfHealing } = require('./src/core/self-healing.js');
const sh = new SelfHealing({ rootPath: __dirname });
sh.record({ type: 'timeout', message: 'test', code: 'HEAL001' }, false);
console.log('Q entries:', sh.rl._qtable.size);
console.log('History:', sh.rl._history.length);
"

# 3. 验证防抖
node -e "
const { SelfHealing } = require('./src/core/self-healing.js');
const sh = new SelfHealing({ rootPath: __dirname });
// 快速连续调用 10 次
for (let i = 0; i < 10; i++) {
  sh.record({ type: 'timeout_' + i, message: 'test', code: 'HEAL001' }, false);
}
console.log('Save in progress:', sh.rl._saveInProgress);
console.log('Dirty:', sh.rl._saveDirty);
"
```

## 验证结果（2026-06-08）

| 检查项 | 状态 |
|--------|------|
| heartflow.js start() 集成 SelfHealing | ✅ 已实例化 |
| heartflow.js start() 集成 SelfEvolutionCore | ✅ 已实例化 |
| RL 实例共享 (selfEvolution.rl === selfHealing.rl) | ✅ 同一对象 |
| record() 调用带 repairOutcome 参数 | ✅ `false` |
| record() 在 recover() 之后调用 | ✅ 交换了顺序 |
| Q-table 写入防抖锁 | ✅ `_debouncedSave()` |
| Q-table 文件路径统一 | ✅ 两者指向同一 `memory/q-table.json` |
