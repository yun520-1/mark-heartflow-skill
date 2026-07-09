# Pipeline/Orchestrator 类模块升级模式

> 案例：task-pipeline.js v1.0.0 → v1.1.0 (2026-06-05)

## 原始状态（升级前）

task-pipeline.js 是典型的薄代理层：5585 字节，5个公有方法 + 3个私有方法，其中：
- `_analyzeTask()` — 仅调用 `_classifyTaskType()`，返回 `{text, type, timestamp}`
- `_planTask()` — 返回硬编码 `{skipPlanning: false, plan: {type, approach: 'cognitive', steps: []}}`
- `_verifyResult()` — 仅检查 `!!analysis && !!plan && !!identityCore`
- `_classifyTaskType()` — 简单 `includes()` 关键词匹配
- 无状态机、无超时、无重试、无指标、无取消机制

## 标准升级清单

### 1. 枚举定义（状态、错误、复杂度、域）

```javascript
const STATE = Object.freeze({
  IDLE: 'idle', ANALYZING: 'analyzing', PLANNING: 'planning',
  VERIFYING: 'verifying', COMPLETED: 'completed', FAILED: 'failed', CANCELLED: 'cancelled'
});

const TaskComplexity = Object.freeze({
  TRIVIAL: 'trivial', SIMPLE: 'simple', MODERATE: 'moderate',
  COMPLEX: 'complex', CRITICAL: 'critical'
});

const TaskDomain = Object.freeze({
  CODE: 'code', SEARCH: 'search', WRITING: 'writing', ANALYSIS: 'analysis',
  PLANNING: 'planning', SYSTEM: 'system', CREATIVE: 'creative',
  DATA: 'data', ACADEMIC: 'academic', UNKNOWN: 'unknown'
});

const PipelineError = Object.freeze({
  VALIDATION: 'validation_error', TIMEOUT: 'timeout_error',
  INVALID_STATE: 'invalid_state_transition', DEPENDENCY: 'dependency_error',
  RESOURCE: 'resource_exhausted', INTERNAL: 'internal_error', CANCELLED: 'task_cancelled'
});
```

### 2. 状态机守卫

```javascript
const VALID_TRANSITIONS = Object.freeze({
  [STATE.IDLE]: [STATE.ANALYZING],
  [STATE.ANALYZING]: [STATE.PLANNING, STATE.FAILED, STATE.CANCELLED],
  [STATE.PLANNING]: [STATE.VERIFYING, STATE.FAILED, STATE.CANCELLED],
  [STATE.VERIFYING]: [STATE.COMPLETED, STATE.FAILED, STATE.CANCELLED],
  [STATE.COMPLETED]: [STATE.IDLE],
  [STATE.FAILED]: [STATE.IDLE],
  [STATE.CANCELLED]: [STATE.IDLE]
});

_transitionTo(newState) {
  if (this.config.strictTransitions && !this._validateStateTransition(from, newState)) {
    throw new Error(`非法状态转换: ${from} → ${newState}`);
  }
  this.pipelineState = newState;
}
```

### 3. 复杂度评估模式

多因素评分法（非简单关键词匹配）：

```javascript
_estimateComplexity(text) {
  let score = 0;
  // 长度因素
  if (text.length > 500) score += 4;
  else if (text.length > 200) score += 2;
  // 多步骤关键词
  for (const kw of ['并且', '首先', '然后', 'step', '多个', '依赖']) {
    if (lower.includes(kw)) score += 1;
  }
  // 多域交叉（3+域同时出现 +3，2域 +1）
  // 紧急信号（critical/紧急/生产 +2）
  // 判定
  if (score >= 10) return 'critical';
  if (score >= 7) return 'complex';
  if (score >= 4) return 'moderate';
  if (score >= 2) return 'simple';
  return 'trivial';
}
```

### 4. 域检测模式

多域评分竞争机制：

```javascript
_detectDomain(text) {
  const scores = {};
  scores['code'] = 0;
  if (/函数|class|function|import|api/.test(lower)) scores.code += 3;
  if (/javascript|python|node|docker/.test(lower)) scores.code += 2;

  scores['search'] = 0;
  if (/搜索|search|查询|查找/.test(lower)) scores.search += 3;

  // ... 每个域独立评分 ...

  // 选最高分
  let bestDomain = 'unknown', bestScore = 0;
  for (const [domain, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestDomain = domain; }
  }
  return bestDomain;
}
```

**注意**：域检测的先后顺序影响结果。例如 "搜索论文" 中 "搜索" 触发 search 域（3分），"论文" 触发 academic 域（3分），此时先匹配的 search 胜出。如果希望 academic 优先，需调整评分权重或检测顺序。

### 5. 动态步骤生成

不同域有不同的步骤模板：

```javascript
_generateSteps(type, complexity, domain) {
  const steps = [];
  // 通用第一步
  steps.push({ id: 'step-1', name: '理解任务需求', canParallel: false });

  switch (domain) {
    case 'code':
      steps.push({ id: 'step-2', name: '代码审查', canParallel: false });
      steps.push({ id: 'step-3', name: '实现方案设计', canParallel: false });
      if (complexity !== 'trivial') {
        steps.push({ id: 'step-4', name: '测试与验证', canParallel: true });
      }
      break;
    case 'search':
      steps.push({ id: 'step-2', name: '多源检索', canParallel: true });
      steps.push({ id: 'step-3', name: '信息整合', canParallel: false });
      break;
    // ... 每个域独立模板 ...
  }

  // 高复杂度任务增加验证步骤
  if (complexity === 'complex' || complexity === 'critical') {
    steps.push({ id: 'step-N', name: '全面验证', canParallel: false });
  }
  return steps;
}
```

### 6. 语义验证

四维验证法：

```javascript
_semanticVerify(analysis, plan) {
  // 1. 类型一致性 — 分析结果和规划结果类型应一致
  // 2. 步骤完整性 — 规划应有非空步骤
  // 3. 复杂度可行性 — 复杂任务应有足够步骤 (complex≥3, critical≥4)
  // 4. 时间序合理性 — 规划时间戳应在分析时间戳之后
  const passed = [typeConsistent, hasSteps, feasible, timeOrdered].filter(Boolean).length;
  return { overall: passed >= 3, details: {...}, issues: [...] };
}
```

### 7. 超时 + 重试包装

```javascript
_executeWithTimeout(fn, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`任务超时 (${timeoutMs}ms)`);
      err.type = PipelineError.TIMEOUT;
      reject(err);
    }, timeoutMs);
    fn().then(r => { clearTimeout(timer); resolve(r); })
      .catch(e => { clearTimeout(timer); reject(e); });
  });
}

_executePipeline(taskInput, text, maxRetries) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await this._runPhases(taskInput, text);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await this._delay(500 * attempt); // 指数退避
    }
  }
}
```

### 8. 模块导出

```javascript
module.exports = {
  TaskPipeline,      // 主类
  STATE,             // 状态枚举（外部可监听状态变化）
  TaskComplexity,    // 复杂度枚举
  TaskDomain,        // 域枚举
  PipelineError,     // 错误类型枚举
  VALID_TRANSITIONS  // 状态机映射（外部可查询合法性）
};
```

## 版本同步

升级后执行：
```bash
cd ~/.hermes/skills/heartflow
node -e "require('./src/core/version.js').bumpVersion('patch')"
```

验证：
```bash
cat VERSION && node -e "console.log(require('./package.json').version)"
```

## 验证清单

- [ ] 语法检查：`node --check src/core/task-pipeline.js`
- [ ] 实例化：`require + new` 不报错
- [ ] 枚举导出：`Object.keys(STATE).length === 7`
- [ ] 状态机：连续 handleTask 调用自动重置到 IDLE
- [ ] 域检测：至少 9/10 测试用例通过
- [ ] 复杂度分级：trivial/simple/moderate/complex/critical 均能正确触发
- [ ] 紧迫度：紧急信号正确加分，"不着急"正确减分
- [ ] 指标追踪：totalTasks === completedTasks + failedTasks
- [ ] 取消机制：idle 状态 cancelTask() 返回 false
- [ ] 历史清理：pruneHistory() 正确减少记录数
- [ ] 版本同步：VERSION / package.json / SKILL.md 一致

---

# 自主执行编排器类升级模式（PDCA引擎）

> 案例：pdca-engine.js v1.0 → v2.0 (2026-06-09, 8844B → 35183B)
> 用于：自主目标执行循环、PDCA(Plan-Do-Check-Act)引擎、自治代理执行器

## 原始状态（升级前）

pdca-engine.js 是典型的**薄执行编排器**：8844 字节，包含完整的 PDCA 循环骨架（plan→do→check→act 四个阶段），但每个阶段只有最小实现：
- `executeSubtask()` — 返回硬编码 mock 结果（`'LLM query simulated'`, `'Tests passed'`）
- `plan()` — 固定 3 个模板（interrupt/frustration/default），基于简单 `includes()` 匹配
- `check()` — 仅比较 successRate > 0.6 阈值
- `act()` — 检查重试次数是否超限，无错误类型感知
- 无输入验证、无超时保护、无重试差异化策略、无震荡检测、无失败持久化

## 标准升级清单

### 1. 错误分类系统（三枚举体系）

```javascript
const ErrorCategory = Object.freeze({
  FILESYSTEM: 'filesystem',   // ENOENT, EACCES, EPIPE
  NETWORK: 'network',         // ETIMEDOUT, ECONNREFUSED
  VALIDATION: 'validation',   // 非法参数
  LOGIC: 'logic',             // 状态不一致
  RESOURCE: 'resource',       // 内存不足
  EXTERNAL: 'external',       // API超时、rate limit
  SECURITY: 'security',       // 权限不足
  UNKNOWN: 'unknown'
});

const ErrorSeverity = Object.freeze({
  RECOVERABLE: 'recoverable',  // 可自动恢复
  TRANSIENT: 'transient',      // 需调整策略
  FATAL: 'fatal'               // 不可恢复
});

const RetryStrategy = Object.freeze({
  IMMEDIATE: 'immediate',       // 立即重试（1次）
  BACKOFF: 'backoff',           // 指数退避
  STRATEGY_SHIFT: 'strategy_shift', // 切换策略
  NO_RETRY: 'no_retry'          // 不重试
});
```

### 2. 错误分类器（正则匹配 + 优先级排序）

分类器是一个**有序数组**（优先级决定匹配顺序），每条包含 patterns/category/severity/strategy：

```javascript
const ERROR_CLASSIFIERS = [
  {
    patterns: [/ENOENT|EACCES|EPERM|ENOTDIR/, /no such file|permission denied/],
    category: ErrorCategory.FILESYSTEM,
    severity: ErrorSeverity.TRANSIENT,
    strategy: RetryStrategy.BACKOFF
  },
  {
    patterns: [/ETIMEDOUT|ECONNREFUSED|ECONNRESET/, /timeout|connection refused/],
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.TRANSIENT,
    strategy: RetryStrategy.BACKOFF
  },
  // ... 更多分类器 ...
  {
    patterns: [/rate limit|quota|too many requests|429/, /api error|llm/],
    category: ErrorCategory.EXTERNAL,
    severity: ErrorSeverity.TRANSIENT,
    strategy: RetryStrategy.BACKOFF
  },
  {
    patterns: [/memory|heap|allocation|stack overflow/, /out of memory/],
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.FATAL,
    strategy: RetryStrategy.STRATEGY_SHIFT
  },
  {
    patterns: [/security|unauthorized|forbidden/, /not allowed|access denied/],
    category: ErrorCategory.SECURITY,
    severity: ErrorSeverity.FATAL,
    strategy: RetryStrategy.NO_RETRY
  }
];
```

**⚠️ 关键陷阱 — 分类器优先级（见 SKILL.md 陷阱 18）**：分类器数组的**先后顺序决定匹配优先级**。更具体的模式必须在更宽泛的模式之前。例如 `rate limit` 模式（含 `too many requests`）必须在 `resource` 模式（含 `too many`）之前，否则 `too many requests` 会先匹配 `too many` 而被错误分类为 resource。规则：具体 → 一般，错误类别按 `FILESYSTEM → NETWORK → VALIDATION → LOGIC → EXTERNAL → RESOURCE → SECURITY → UNKNOWN` 顺序排列。

`classifyError()` 函数逐条匹配，返回第一个匹配的分类：

```javascript
function classifyError(error) {
  const message = (typeof error === 'string' ? error : (error && error.message ? error.message : '')) || '';
  for (const classifier of ERROR_CLASSIFIERS) {
    for (const pattern of classifier.patterns) {
      if (pattern.test(message)) {
        return {
          category: classifier.category,
          severity: classifier.severity,
          strategy: classifier.strategy,
          confidence: 0.85
        };
      }
    }
  }
  // 未知错误回退
  return { category: 'unknown', severity: 'transient', strategy: 'backoff', confidence: 0.4 };
}
```

### 3. 震荡/停滞检测

```javascript
detectOscillation(goal) {
  const recentCycles = this.trace.cycles.slice(-10);
  const sameGoalCycles = recentCycles.filter(c => c.goal_id === goal.goal_id);
  
  if (sameGoalCycles.length >= 2) {
    const allFailed = sameGoalCycles.every(c => c.status === 'failed');
    if (allFailed) {
      this.oscillationState.consecutiveFailures = sameGoalCycles.length;
      const threshold = this.config.maxConsecutiveFailures || 3;
      this.oscillationState.oscillationDetected = sameGoalCycles.length >= threshold;
    }
  }
}
```

**震荡感知的计划调整**：检测到震荡时自动切换为诊断优先策略，而非继续重复相同方法：
- 正常策略：research → design → implement
- 震荡策略：deep_analyze(root cause) → research_alternatives → validate_assumptions

### 4. 超时保护

```javascript
async withTimeout(promise, ms, errorMsg) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[TIMEOUT] ${errorMsg} (${ms}ms)`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
```

**阶段级超时配置**：不同阶段设置不同超时（plan=15s, do=60s, check=10s, act=10s），工具级超时（LLM=60s, unit_test=120s, file_ops=10s），整体 PDCA 循环也有全局超时。

### 5. 失败记忆系统（持久化 + 模式匹配）

```javascript
// 每条失败记录包含：goal_id, description, error, phase, category, severity, timestamp
// 模式摘要：category + phase 为 key，频率追踪 + 关键词提取 + 首次/最后出现时间

recordFailure(goal, error, phase) {
  const classified = classifyError(error);
  this.failureMemory.failures.push({
    goal_id: goal.goal_id, description: goal.description,
    error: typeof error === 'string' ? error : error.message,
    phase, category: classified.category, severity: classified.severity,
    timestamp: new Date().toISOString()
  });
  
  // 更新模式摘要（关键词合并 + 频率递增）
  const existing = this.failureMemory.patterns.find(
    p => p.category === classified.category && p.phase === phase
  );
  if (existing) {
    existing.frequency++;
    // 合并新关键词
  } else {
    this.failureMemory.patterns.push({ category, phase, frequency: 1, keywords: [...], ... });
  }
}

// 新目标启动时检查历史
checkFailureMemory(goal) {
  const keywords = goal.description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  for (const pattern of this.failureMemory.patterns) {
    const matchCount = pattern.keywords.filter(kw => keywords.includes(kw)).length;
    if (matchCount >= 2 && pattern.frequency >= 2) {
      return { pattern, suggestion: pattern.avoidedStrategy };
    }
  }
  return null;
}
```

**策略**：失败记忆匹配 → 跳过 fatal 模式 / 切换重试策略 / 建议人工审查。大小限制：max 100 failures, 30 patterns。

### 6. 智能重试（差异化策略）

```javascript
// 在 do() 方法中根据错误分类选择重试策略
const classified = classifyError(lastError);
switch (classified.strategy) {
  case RetryStrategy.IMMEDIATE:
    // 立即重试（最多1次）
    break;
  case RetryStrategy.BACKOFF:
    // 指数退避：1000 * 2^attempt，上限8s
    await new Promise(r => setTimeout(r, backoffMs));
    break;
  case RetryStrategy.STRATEGY_SHIFT:
    // 切换执行路径（震荡模式下有用）
    break;
  case RetryStrategy.NO_RETRY:
    attempt = maxRetries; // 跳出循环
    break;
}
```

### 7. 增强的 Check + Act（错误类型感知）

```javascript
// check() 输出增强：失败细节含 category + errorCategories 统计 + dominantErrorCategory
// act() 根据 dominantErrorCategory 选择不同行动：
switch (checkResult.dominantErrorCategory) {
  case ErrorCategory.FILESYSTEM:
    adjustments = ['check_file_permissions', 'verify_path_exists'];
    break;
  case ErrorCategory.NETWORK:
    adjustments = ['retry_with_backoff', 'check_connectivity'];
    break;
  case ErrorCategory.SECURITY:
    adjustments = ['manual_authorization_required'];
    break;
  // ...
}
```

### 8. 状态查询扩展

```javascript
getStatus() {
  return {
    config: this.config,
    history: this.getHistory(),
    oscillationState: {
      detected: this.oscillationState.oscillationDetected,
      consecutiveFailures: this.oscillationState.consecutiveFailures,
      strategiesTried: this.oscillationState.strategiesTried
    }
  };
}

getHistory() {
  return {
    total_cycles: this.trace.cycles.length,
    completed_goals: this.trace.completed_goals.length,
    recent: this.trace.cycles.slice(-5),
    failureMemory: {
      totalFailures: this.failureMemory.failures.length,
      patterns: this.failureMemory.patterns.length,
      dominantCategories: this.getDominantFailureCategories()
    }
  };
}
```

### 9. 模块导出

```javascript
module.exports = {
  PDCAEngine,          // 主类
  ErrorCategory,       // 错误类别枚举
  ErrorSeverity,       // 严重级别枚举
  RetryStrategy,       // 重试策略枚举
  classifyError        // 错误分类函数（可独立使用）
};
```

## 验证清单（PDCA 引擎特有）

- [ ] 错误分类：所有 7 个已知错误模式正确分类（filesystem/network/validation/logic/resource/external/security）
- [ ] 未知错误回退到 `unknown/transient/backoff`（置信度 0.4）
- [ ] 震荡检测：连续 3 次失败正确触发 oscillationDetected=true
- [ ] 失败记忆：pattern 频率递增 + 关键词合并
- [ ] 超时保护：超时错误正确捕获，不崩溃
- [ ] 向后兼容：原有 executeAutonomousCycle() 签名不变
- [ ] 模块导出：5 个导出项全部可 `require`
- [ ] 持久化文件：`.opencode/logs/pdca_failure_memory.json` 自动创建
