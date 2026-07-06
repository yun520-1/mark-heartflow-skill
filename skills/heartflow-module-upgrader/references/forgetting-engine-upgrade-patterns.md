# Forgetting/Decay Engine Upgrade Pattern

## When to Upgrade

Forgetting/decay engine modules model **time-dependent memory degradation**. They typically:
- Define age-based levels (recent → archive)
- Apply compression/abstraction based on age
- Have a `consolidate()` method for merging related memories
- Export plain functions, no class structure
- Lack input validation, error classification, oscillation detection, stats

## Case Study: forgetting.js (7385B → 24987B)

**Before**: 7 plain functions, `module.exports = { ... }`, no validation, no stats, no oscillation detection.

**After**: ForgettingEngine class + Proxy wrapper, 3 enums (9 error codes, 5 states, 4 oscillation types), input validation, oscillation detection, batch operations, stats tracking, health check, runtime config.

## Standard Upgrade Checklist

1. **ErrorCode 枚举** — 7-9 types: INPUT_NULL, INPUT_EMPTY, MEMORY_INVALID, TIMESTAMP_INVALID, BATCH_FAILED, THRESHOLD_INVALID, STATE_ERROR, OSCILLATION, UNKNOWN
2. **State 枚举** — 4-5 states: IDLE, COMPRESSING, CONSOLIDATING, DEGRADED, ERROR
3. **OscillationType 枚举** — 3-4 types: NONE, RAPID_ACCESS, REPEATED_CONSOLIDATION, FREQUENT_THRASHING
4. **输入验证** — `_validateMemory()` 统一入口，null/类型/结构三层防御
5. **震荡检测** — 三重机制：访问频率(>5次/秒)、合并间隔(<1秒)、同ID重复率(>70%)
6. **统计追踪** — totalCompressions/retrievals/consolidations/forgetChecks/errors/oscillationWarnings
7. **批量操作** — compressBatch(memories) + consolidateBatch(memoryGroups)
8. **健康检查** — healthCheck() 返回状态/错误数/震荡/访问率
9. **运行时配置** — updateConfig() 深度合并，类型+范围验证
10. **向后兼容** — Proxy 包装单例 + 保留所有原始函数导出

## Common Pitfalls

- **Timestamps**: `memory.timestamp` may be undefined — always fall back to `Date.now()`
- **Content types**: `memory.content` may be an object or null — use `safeString()` wrapper
- **Consolidation**: `consolidateMemories()` on single memory should return it unchanged
- **Oscillation window**: window too small (≤3) causes false positives — min 5 entries
- **Proxy export**: `module.exports` must support both `f.method()` and `module.exports.FORGETTING_LEVELS`

## Verification

```javascript
const { ForgettingEngine, ForgettingErrorCode, FORGETTING_LEVELS } = require('./forgetting.js');
const eng = new ForgettingEngine({ defaultThreshold: 0.3 });

// 1. Compress
const result = eng.compress({ id: 't1', content: 'test', timestamp: Date.now() - 86400000 });
console.log('level:', result.compressed?.forgettingLevel);

// 2. Consolidate
const c = eng.consolidate([{ id: 'a', content: 'cat sat on mat' }, { id: 'b', content: 'dog in park' }]);
console.log('themes:', c?.preserved?.themes?.length);

// 3. Batch
const batch = eng.compressBatch([...]);
console.log('ok:', batch.totalSuccess);

// 4. Oscillation
console.log('osc:', eng.detectOscillation());

// 5. Health
console.log('health:', eng.healthCheck().status);

// 6. Legacy functions still work
const { getForgettingLevel } = require('./forgetting.js');
console.log('legacy:', getForgettingLevel(Date.now()).label);
```
