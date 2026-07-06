# 工作流切换/模式路由类模块升级模式

> 案例：workflow-switch.js v1.0.0 → v2.0.0 (2026-06-08)
> 文件大小：9,840 → 25,945 字节

## 适用场景

模块负责在多个**工作流/操作模式**之间智能切换。核心方法是 `analyzeIntent()`（意图分析）和 `switchWorkflow()`（模式切换）。与管道类不同，切换器类不是逐步处理任务，而是**决策「当前应该用哪个模式」**。

典型特征：
- 有一个固定的工作流/模式列表（`availableWorkflows`）
- `analyzeIntent()` 基于关键词匹配计算置信度
- `switchWorkflow()` 切换当前模式并记录历史
- 缺少稳定性保护——没有防止来回切换的机制
- 没有过渡规则——任何工作流到任何工作流的切换都被允许
- 没有意图衰减——旧消息的匹配度与最新消息相同

## 原始状态（升级前）

workflow-switch.js 的原始实现（9,840 字节）：
- 5 个工作流，4 个有意图关键词库
- `analyzeIntent()` 简单 `includes()` 关键词匹配，返回 `matchCount/totalKeywords` 的原始置信度
- `evaluateSwitch()` 只检查「切换是否启用」+ 意图置信度 + 上下文连续性
- `switchWorkflow()` 直接切换，无任何防御机制
- 无冷却、无速率限制、无震荡检测、无过渡规则、无时间衰减

## 标准升级清单

### 1. 状态枚举定义

```javascript
const SwitchStatus = {
  SUCCESS: 'success',
  BLOCKED_COOLDOWN: 'blocked_cooldown',       // 冷却期内禁止切换
  BLOCKED_RATE_LIMIT: 'blocked_rate_limit',   // 速率超限
  BLOCKED_OSCILLATION: 'blocked_oscillation', // 检测到震荡模式
  BLOCKED_INVALID_TRANSITION: 'blocked_invalid_transition', // 无效过渡
  BLOCKED_DISABLED: 'blocked_disabled',       // 切换功能已禁用
  INVALID_TARGET: 'invalid_target'            // 目标工作流不存在
};

const OscillationType = {
  NONE: 'none',
  BACK_AND_FORTH: 'back_and_forth',       // A→B→A→B 模式
  RAPID_CYCLE: 'rapid_cycle',             // A→B→C→A→B→C 模式
  BOUNCE: 'bounce'                        // 在两个工作流间反复弹跳
};
```

### 2. 状态机过渡规则矩阵

定义哪些工作流之间的切换是合理的。不是所有直接切换都有意义——例如从「情感支持」直接跳到「代码审查」不合理，应先经过「心流」模式。

```javascript
this.transitionMatrix = {
  heartflow:     { heartflow: true, code_review: true, debugging: true, education: true, support: true },
  code_review:   { heartflow: true, code_review: true, debugging: true, education: false, support: false },
  debugging:     { heartflow: true, code_review: true, debugging: true, education: false, support: false },
  education:     { heartflow: true, code_review: false, debugging: false, education: true, support: true },
  support:       { heartflow: true, code_review: false, debugging: false, education: false, support: true }
};

_validateTransition(targetWorkflow) {
  const from = this.currentWorkflow;
  const matrix = this.transitionMatrix[from];
  if (!matrix || matrix[targetWorkflow] === undefined) {
    return { allowed: false, reason: `未定义过渡规则` };
  }
  if (matrix[targetWorkflow]) {
    return { allowed: true };
  }
  // 不允许直接切换时，建议中间工作流
  return {
    allowed: false,
    reason: `不允许从 ${from} 直接切换到 ${targetWorkflow}`,
    suggestedIntermediate: 'heartflow'
  };
}
```

### 3. 冷却机制

切换后保持稳定窗口，防止反复跳转。

```javascript
this.config.cooldownMs = 30000; // 默认 30 秒

_checkCooldown() {
  const history = this.config.switchHistory;
  if (history.length === 0) return { allowed: true };

  const lastSwitch = history[history.length - 1];
  const elapsed = Date.now() - new Date(lastSwitch.timestamp).getTime();

  if (elapsed < this.config.cooldownMs) {
    const remaining = this.config.cooldownMs - elapsed;
    return {
      allowed: false,
      reason: `冷却期内，还需 ${(remaining / 1000).toFixed(1)}s`,
      remainingMs: remaining
    };
  }
  return { allowed: true };
}
```

### 4. 速率限制

时间窗口内限制切换总次数，防止突发频繁切换。

```javascript
this.config.rateLimitWindowMs = 60000;   // 统计窗口（1分钟）
this.config.rateLimitMaxSwitches = 3;     // 窗口内上限

_checkRateLimit() {
  const now = Date.now();
  const windowStart = now - this.config.rateLimitWindowMs;
  const recentSwitches = this.config.switchHistory.filter(
    s => new Date(s.timestamp).getTime() > windowStart
  );
  if (recentSwitches.length >= this.config.rateLimitMaxSwitches) {
    return {
      allowed: false,
      reason: `速率超限：窗口内已切换 ${recentSwitches.length} 次`,
      windowCount: recentSwitches.length
    };
  }
  return { allowed: true, windowCount: recentSwitches.length };
}
```

### 5. 震荡检测

检测三种震荡模式并阻止：

```javascript
this.config.oscillationPatternLength = 4;  // 检测窗口
this.config.oscillationThreshold = 0.6;    // 阈值

_detectOscillation(proposedTarget) {
  const history = this.config.switchHistory;
  const sequence = history.slice(-(this.config.oscillationPatternLength - 1))
    .map(s => s.to);
  sequence.push(proposedTarget);

  // 三种震荡评分
  const backAndForthScore = this._scoreBackAndForth(sequence); // A→B→A→B
  const cycleScore = this._scoreCyclicOscillation(sequence);    // A→B→C→A→B→C
  const bounceScore = this._scoreBounceOscillation(sequence);   // A→B→A

  const maxScore = Math.max(backAndForthScore, cycleScore, bounceScore);
  if (maxScore >= this.config.oscillationThreshold) {
    // 更新震荡统计，返回阻止结果
    return { detected: true, type, probability: maxScore };
  }
  return { detected: false, type: OscillationType.NONE, probability: maxScore };
}

_scoreBackAndForth(sequence) {
  if (sequence.length < 4) return 0;
  const last4 = sequence.slice(-4);
  if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) return 1.0;
  return 0;
}

_scoreCyclicOscillation(sequence) {
  // 检测 A→B→C→A→B→C 模式
  for (let period = 2; period <= 3; period++) {
    const cycle = sequence.slice(-period * 2);
    if (cycle.length < period * 2) continue;
    const firstCycle = cycle.slice(0, period);
    const secondCycle = cycle.slice(period);
    if (firstCycle.every((v, i) => v === secondCycle[i])) return 0.8;
  }
  return 0;
}

_scoreBounceOscillation(sequence) {
  if (sequence.length < 3) return 0;
  const last3 = sequence.slice(-3);
  if (last3[0] === last3[2] && last3[0] !== last3[1]) return 0.7;
  return 0;
}
```

### 6. 意图时间衰减

旧消息的意图匹配度随时间指数衰减，防止历史消息触发不恰当的切换。

```javascript
this.config.intentDecayHalfLife = 120000; // 默认 2 分钟半衰期

_computeTimeDecayFactor(age) {
  if (age <= 0) return 1.0;
  // 指数衰减: factor = 0.5^(age/halfLife)
  return Math.pow(0.5, age / this.config.intentDecayHalfLife);
}

// 在 analyzeIntent 中应用衰减
analyzeIntent(userInput, messageAge = 0) {
  // ... 原有关键词匹配逻辑 ...
  if (messageAge > 0 && confidence > 0) {
    confidence *= this._computeTimeDecayFactor(messageAge);
  }
  // ...
}
```

### 7. 增强的报告系统

```javascript
generateReport() {
  // 显示当前工作流 + 可用列表
  // 冷却状态：就绪/冷却中(剩余Xs)
  // 速率状态：正常(N/M) / 超限
  // 切换历史（最近N次）
  // 配置参数一览
  // 震荡检测统计
  // 状态机过渡规则矩阵摘要
}
```

### 8. 模块级导出

```javascript
module.exports = WorkflowSwitch;
module.exports.SwitchStatus = SwitchStatus;
module.exports.OscillationType = OscillationType;
module.exports.workflowSwitch = workflowSwitch;          // 全局实例
module.exports.getConfig = () => workflowSwitch.config;
module.exports.getOscillationStats = () => workflowSwitch.config.oscillationStats;
```

## 防御性编程要点

1. **冷却 → 速率限制 → 震荡 → 过渡规则** 的检查顺序：冷却最快阻断（毫秒级），速率限制最公平（统计窗口），震荡最敏感（模式识别），过渡规则最严格（硬约束）。

2. **`switchWorkflow()` 和 `evaluateSwitch()` 使用相同的检查链**：两者都按相同顺序执行冷却→速率→震荡→过渡检查，确保手动切换和自动切换行为一致。

3. **空历史边界**：冷却检查在历史为空时直接放行（`history.length === 0`），速率限制在无切换时正常。

4. **已处目标工作流检测**：`switchWorkflow()` 应先检查 `targetWorkflow === this.currentWorkflow`，避免不必要的记录。

5. **配置验证**：`setConfig()` 应对数值参数做非负检查，无效配置返回 `{ success: false, message }` 而非静默接受。

## 验证清单

- [ ] 语法检查：`node --check`
- [ ] 实例化：`require + new` 不报错
- [ ] 枚举导出：`Object.keys(SwitchStatus).length === 7`
- [ ] 冷却检测：快速连续两次 `switchWorkflow()`，第二次被拒绝
- [ ] 速率限制：快速切换超过上限后被拒绝
- [ ] 震荡检测：A→B→A→B 模式被识别并阻止
- [ ] 无效过渡：不允许的直接切换返回 `blocked_invalid_transition`
- [ ] 时间衰减：旧消息置信度 < 新消息置信度
- [ ] 已处目标：切换到当前工作流返回 `alreadyInTarget: true`
- [ ] 配置验证：负数配置被拒绝
- [ ] 报告生成：`generateReport()` 输出含冷却/速率/震荡/过渡信息
