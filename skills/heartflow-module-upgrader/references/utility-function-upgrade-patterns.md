# Utility Function Upgrade Patterns

## When to Upgrade a Utility Function

Utility functions (single-purpose, standalone exported functions, not classes) are ideal targets when:
- They are **small** (< 2KB) and have a single method
- They are **widely referenced** (3+ callers) — high ROI, every caller benefits
- They lack **error classification**, **retry logic**, **fallback paths**, or **stats**
- They are **pure I/O** functions with no validation or verification

## Case Study: atomic-write.js (1057B → 12.3KB)

**Before**: Single function, no error types, no retry, no fallback, no verification.
**After**: 14 exported items with full error classification, retry, fallback, verification, batch ops, backup rotation, stats.

### Standard Upgrade Checklist

1. **ErrorType 枚举** — classify errors by code + message (5-10 types)
2. **classifyError(err)** — dual-channel classification: `err.code` first, `err.message` fallback
3. **Retry with exponential backoff** — max 3 attempts, 100ms→300ms→700ms with jitter
4. **shouldRetry(errorType, attempt)** — don't retry INVALID_INPUT or DIRECTORY_ERROR
5. **Fallback paths** — primary dir → system tmp → user home (3 levels)
6. **verifyWrite(filePath, expectedContent)** — read back and compare content
7. **createBackup(filePath)** — copy to .bak before overwriting
8. **Batch operation** — array of { path, content, json } with summary stats
9. **Stats tracking** — writes/retries/failures/fallbacks/backupFailures + successRate
10. **Backward compatibility** — default behavior unchanged, new behavior opt-in via options

### The Backward Compatibility Pattern

```javascript
async function upgradedFunction(input, options = {}) {
  // ... new logic with retry, fallback, etc.
  
  // On failure:
  const errResult = { ok: false, error: err.message, errorType: classifyError(err) };
  if (options.throw !== false) {    // Default: throw (old behavior)
    const e = new Error(err.message);
    e.result = errResult;            // Structured result on error object
    throw e;
  }
  return errResult;                  // throw:false mode
  
  // On success:
  _stats.writes++;
  return { ok: true, path: filePath, attempts: [] };
}
```

### Verification Steps

```javascript
// 1. Basic write
const r1 = await atomicWrite('/tmp/test.txt', 'hello');
console.log('ok:', r1.ok);

// 2. Backward compat: throw on failure
try { await atomicWrite(null, 'x'); }
catch (e) { console.log('threw:', e.result.ok === false); }

// 3. throw:false mode
const r3 = await atomicWrite(null, 'x', { throw: false });
console.log('ok:', r3.ok === false, 'errorType:', r3.errorType);

// 4. Batch write
const r4 = await batchAtomicWrite([{ name: 'a', path: '/tmp/a.txt', content: 'a' }]);
console.log('summary:', r4.summary);

// 5. Stats
console.log('stats:', getStats());

// 6. Verify write
const r6 = await atomicWrite('/tmp/verify.txt', 'content', { verify: true });
console.log('ok:', r6.ok);
```
