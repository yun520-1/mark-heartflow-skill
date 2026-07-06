# Emotional-Memory Bridge 升级模式

## 适用模块
将情绪/认知评估转化为三层记忆（CORE/LEARNED/EPHEMERAL）的桥接类模块。

**典型文件**：`emotional-memory-bridge.js`

## 典型特征
- 核心函数 `assessEmotionalSalience(text, appraisal, padState)` 基于多因素评分
- 阈值判定（CORE≥0.75, LEARNED≥0.55, EPHEMERAL=0.0）
- 依赖懒加载外部模块（cognitive-appraisal, meaningful-memory, psychology）
- 返回 `{ score, factors, threshold }` 结构
- 约 300-400 行，11-12KB，纯函数式（非 class）

## 标准功能缺失
1. **输入验证** — 所有公开函数直接使用参数，无 null/undefined/类型检查
2. **错误分类** — 所有 catch 返回 `{ success: false, reason: e.message }`，无类型化
3. **重试机制** — 文件 I/O 和存储操作一次失败即放弃
4. **去重检测** — 相同文本重复评估重复存储
5. **显著性衰减模型** — 情绪显著性不随时间衰减
6. **批量处理** — 只能逐条处理，无批量合并
7. **持久化验证** — 存储后不验证数据是否真实写入

## 标准升级清单

### 1. 输入验证系统
创建统一的 `validateInput(value, name, rules)` 函数：
```javascript
function validateInput(value, name, rules = {}) {
  const { type = 'string', required = false, minLength, maxLength, min, max } = rules;
  if (required && (value === undefined || value === null)) {
    return { valid: false, error: { type: ErrorType.INVALID_INPUT, message: `参数 "${name}" 为必填项` } };
  }
  // 类型检查、长度检查、范围检查...
  return { valid: true, error: null };
}
```
- 所有公开函数入口统一调用
- 无效输入返回分类错误而非静默失败

### 2. 错误分类系统
```javascript
const ErrorType = {
  MODULE_UNAVAILABLE: 'MODULE_UNAVAILABLE',
  STORE_FAILED: 'STORE_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_IO_ERROR: 'FILE_IO_ERROR',
  PERSISTENCE_FAILED: 'PERSISTENCE_FAILED',
  DEDUP_CHECK_FAILED: 'DEDUP_CHECK_FAILED',
  BATCH_PARTIAL_FAILURE: 'BATCH_PARTIAL_FAILURE',
  UNKNOWN: 'UNKNOWN'
};

const ErrorSeverity = { FATAL: 'FATAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' };
```
- ERROR_CLASSIFICATION 映射表：每类错误附带 severity/retryable/maxRetries/retryDelayMs/recoverySuggestion
- `classifyError(err, errorType, context)` 统一包装

### 3. 自动重试机制
```javascript
async function withRetry(fn, errorInfo = {}, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await fn();
      return { success: true, data: result, error: null, attempts: attempt };
    } catch (err) {
      lastError = classifyError(err, ...);
      if (attempt <= maxRetries) {
        const delay = (errorInfo.retryDelayMs || 100) * attempt; // 线性退避
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return { success: false, data: null, error: lastError, attempts: maxRetries + 1 };
}
```

### 4. 显著性衰减模型
```javascript
function applySalienceDecay(originalSalience, layer = 'learned', elapsedHours = 0) {
  // 指数衰减: S = S0 * 0.5^(t/T)
  // CORE: 半衰期 = 24h × 3 = 72h (衰减最慢)
  // LEARNED: 半衰期 = 24h (正常)
  // EPHEMERAL: 半衰期 = 24h / 3 = 8h (加速衰减)
  const decayFactors = { core: 3, learned: 1, ephemeral: 0.333 };
  const effectiveHalfLife = HALF_LIFE_HOURS * decayFactors[layer];
  const decayed = originalSalience * Math.pow(0.5, elapsedHours / effectiveHalfLife);
  return Math.max(MIN_SALIENCE, Math.min(1, decayed));
}
```

### 5. 记忆去重系统
使用双策略：
- **精确指纹**：SHA256 前16字符，O(1)查找
- **模糊匹配**：三元组 Jaccard 相似度

```javascript
function computeTextSimilarity(a, b) {
  // 生成字符三元组
  // 计算 Jaccard: |intersection| / |union|
}

function checkDuplicate(text, threshold = 0.85, timeWindowHours = 1) {
  // 指纹快速匹配 → 模糊匹配 → 加入缓存
}
```
- 去重缓存自动过期（1小时窗口）
- 最大100条容量限制
- 缓存满时淘汰最旧条目

### 6. 批量记忆合并
```javascript
async function batchAppraisalToMemory(items, options = {}) {
  // 逐条调用 appraisalToMemory
  // 部分失败容错（成功项返回，失败项记录错误）
  // 汇总统计: total/succeeded/failed/stored/duplicate
}
```

### 7. 持久化验证
```javascript
async function verifyPersistence(mm, storeResult, memoryContent) {
  // 尝试 search/recall/query/get 多方法验证
  // 所有方法失败时标记"未验证"而非失败
}
```

## 向后兼容注意事项

1. **`appraisalToMemory` 改为 async** — 原有调用者需要 await
   - 检查所有 `require('./emotional-memory-bridge.js')` 的调用者
   - 如果存在非 async 调用，提供同步包装器

2. **返回值扩展** — 新字段附加而不改变旧字段
   - 原有 `{ success, reason, salience, layer, stored }` 保持不变
   - 新增 `{ error, verification, isDuplicate }` 为可选字段

3. **懒加载不变** — 保持 `getMeaningfulMemory()` 等懒加载函数签名不变

## 关键陷阱

### 1. 异步迁移陷阱
`appraisalToMemory` 从同步改为 async 后，所有未 await 的调用会返回 Promise 而非结果对象。检查：
```bash
grep -r "appraisalToMemory\|assessEmotionalSalience" src/ --include="*.js"
```

### 2. 去重缓存线程安全
去重缓存在单进程 Node.js 中是安全的，但多进程场景下（如多个 cron job 同时运行）会各自独立去重，无法跨进程共享。

### 3. 显著性衰减的时间基准
`applySalienceDecay` 使用 `Date.now()` 作为当前时间。如果同一会话中多次调用同一记忆的衰减，结果会逐渐降低。应在存储时记录 `timestamp`，调用衰减时基于存储时间计算 `elapsedHours`。

### 4. 空 padState 保护
`assessEmotionalSalience` 中访问 `padState.intensity`、`padState.pleasure` 前必须检查：
```javascript
if (padState && typeof padState === 'object') {
  // 安全访问
}
```

### 5. withRetry 的闭包陷阱
`withRetry` 内部的 `fn` 如果是闭包（捕获外部变量），重试时外部变量可能已变化。确保 `fn` 是纯函数或每次重试独立。
