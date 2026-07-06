# Rollback / Circuit Breaker 类模块升级模式

> 案例：rollback-manager.js v1.0.0 → v2.0.0 (2026-06-05, 5657B → 28837B)

## 原始状态（升级前）

rollback-manager.js 是一个薄代理层，核心方法 `performRollback()` 是空壳：
- `performRollback()` — 记录日志但实际不恢复文件（"Would restore"）
- `checkRollbackNeeded()` — 简单逐点比较，无噪声容忍，单个非下降样本立即重置计数
- `isDeclining` — 仅检查 `s <= previous`，无趋势分析，小波动也触发
- 无状态机、无熔断器、无震荡检测、无快照管理、无冷却期升级、无健康指标

## 标准升级清单

### 1. 枚举定义（状态、错误、严重度、熔断器状态）

```javascript
const RollbackState = Object.freeze({
  IDLE: 'idle',           // 初始/已销毁
  MONITORING: 'monitoring', // 正常监控
  DECLINING: 'declining',   // 检测到下降趋势
  ROLLING_BACK: 'rolling_back', // 正在回滚
  COOLDOWN: 'cooldown',     // 冷却期
  CIRCUIT_OPEN: 'circuit_open' // 熔断器打开
});

const RollbackError = Object.freeze({
  VALIDATION: 'validation_error',
  DECLINE: 'performance_decline',
  CIRCUIT: 'circuit_breaker_open',
  OSCILLATION: 'oscillation_detected',
  COOLDOWN: 'in_cooldown',
  IO_ERROR: 'file_io_error',
  NO_VERSION: 'no_previous_version',
  INSUFFICIENT_DATA: 'insufficient_data'
});

const MetricSeverity = Object.freeze({
  NORMAL: 'normal',     // score >= 7
  WARNING: 'warning',   // score >= 4
  CRITICAL: 'critical'  // score < 4
});

const CircuitState = Object.freeze({
  CLOSED: 'closed',     // 正常，允许回滚
  HALF_OPEN: 'half_open', // 试探性恢复
  OPEN: 'open'          // 禁止回滚
});
```

### 2. 状态机守卫

```javascript
const VALID_TRANSITIONS = Object.freeze({
  [RollbackState.IDLE]: [RollbackState.MONITORING],
  [RollbackState.MONITORING]: [RollbackState.DECLINING, RollbackState.IDLE],
  [RollbackState.DECLINING]: [RollbackState.ROLLING_BACK, RollbackState.MONITORING, RollbackState.IDLE],
  [RollbackState.ROLLING_BACK]: [RollbackState.COOLDOWN, RollbackState.IDLE],
  [RollbackState.COOLDOWN]: [RollbackState.MONITORING, RollbackState.CIRCUIT_OPEN],
  [RollbackState.CIRCUIT_OPEN]: [RollbackState.IDLE]
});

_transitionTo(newState) {
  const from = this.state;
  const validTargets = VALID_TRANSITIONS[from] || [];
  if (!validTargets.includes(newState)) {
    this._log(`状态转换拒绝: ${from} → ${newState}（不合法）`, 'WARN');
    return false;
  }
  this.state = newState;
  return true;
}
```

**关键设计决策**：与管道类不同，回滚状态机使用**布尔返回值**而非抛出异常。非法转换时记录警告并返回 `false`，调用方决定处理方式。这避免在自动化流程中抛出未捕获异常。

### 3. 噪声容忍下降检测（线性回归）

替代简单逐点比较，使用线性回归斜率判定趋势方向：

```javascript
_detectDeclineWithNoiseTolerance(scores) {
  if (scores.length < 3) {
    return { isDeclining: false, netDrop: 0, severity: MetricSeverity.NORMAL };
  }

  const n = scores.length;
  const meanX = (n - 1) / 2;
  const meanY = scores.reduce((a, b) => a + b, 0) / n;

  // 斜率 = Σ((x-meanX)*(y-meanY)) / Σ((x-meanX)²)
  let numerator = 0, denominator = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    const dy = scores[i] - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const netDrop = scores[0] - scores[n - 1];
  const isDeclining = slope < 0 && netDrop > noiseTolerance;

  let severity = MetricSeverity.NORMAL;
  if (isDeclining) {
    severity = netDrop > 3 ? MetricSeverity.CRITICAL : MetricSeverity.WARNING;
  }

  return { isDeclining, netDrop, severity, slope };
}
```

**优势**：单个分数波动（7.0→6.8→7.1→6.9）不会触发下降。只有持续净下降才触发，斜率量化趋势强度。

### 4. 版本震荡循环检测

检测 A → B → A → B 模式，防止版本在两个版本间来回跳转：

```javascript
_detectOscillation() {
  const recent = this._versionOscillationTracker.slice(-oscillationWindow);
  if (recent.length < 4) return { isOscillating: false, cycleCount: 0, reason: null };

  // 检测 A → B → A → B 模式
  let cycles = 0;
  for (let i = 2; i < recent.length; i++) {
    if (recent[i].version === recent[i - 2].version &&
        recent[i - 1].version !== recent[i].version) {
      cycles++;
    }
  }

  if (cycles >= 2) {
    return {
      isOscillating: true,
      cycleCount: cycles,
      reason: `版本震荡循环: ${recent[recent.length-3].version} ↔ ${recent[recent.length-2].version}`
    };
  }
  return { isOscillating: false, cycleCount: 0, reason: null };
}
```

**触发动作**：震荡检测到后，冷却期翻倍（是普通翻倍的两倍），阻止继续回滚。

### 5. 智能版本定位

找最后一个稳定版本（评分 >= threshold），而非仅上一个版本：

```javascript
_findLastStableVersion() {
  const versions = this._loadVersions();
  if (versions.length < 2) return { version: null, index: -1 };

  const history = this.metrics.history || [];
  // 从后往前找
  for (let i = versions.length - 2; i >= 0; i--) {
    const ver = versions[i];
    // 查找该版本记录时的评分
    const scoreRecord = history.find(h => {
      const hTime = new Date(h.timestamp).getTime();
      const vTime = new Date(ver.timestamp || ver.ts || 0).getTime();
      return Math.abs(hTime - vTime) < 60000; // 1分钟内
    });
    if (scoreRecord && scoreRecord.score >= threshold) {
      return { version: ver, index: i };
    }
  }
  // 回退到上一个版本
  return { version: versions[versions.length - 2], index: versions.length - 2 };
}
```

### 6. 熔断器模式

```
状态流：CLOSED → (连续N次回滚) → OPEN → (等待3天) → HALF_OPEN → (试探成功) → CLOSED
                                                           ↘ (试探失败) → OPEN
```

```javascript
// 构造时
this.maxConsecutiveRollbacks = 3;
this.circuitResetMs = 3 * 24 * 60 * 60 * 1000; // 3天半开窗口

// performRollback 中
if (this.consecutiveRollbacks >= this.maxConsecutiveRollbacks) {
  this.circuitState = CircuitState.OPEN;
  this._circuitOpenAt = Date.now();
  return { success: false, reason: RollbackError.CIRCUIT };
}

// isInCooldown 中 - 冷却结束后尝试半开
if (this.circuitState === CircuitState.OPEN) {
  const elapsed = now.getTime() - (this._circuitOpenAt || 0);
  if (elapsed >= this.circuitResetMs) {
    this.circuitState = CircuitState.HALF_OPEN;
  }
}
```

### 7. 快照管理

真实文件备份与恢复，替代 "Would restore" 空壳：

```javascript
createSnapshot(filePath, version) {
  const content = fs.readFileSync(safePath, 'utf8');
  const snapshotName = `${version}_${path.basename(filePath)}.snap`;
  const snapshotPath = path.join(this.snapshotDir, snapshotName);
  fs.writeFileSync(snapshotPath, content, 'utf8');
  return { success: true, snapshotPath };
}

restoreFromSnapshot(snapshotName, targetPath) {
  const content = fs.readFileSync(snapshotPath, 'utf8');
  fs.writeFileSync(targetPath, content, 'utf8');
  return { success: true };
}
```

**快照存储**：`internal/snapshots/` 目录，文件名格式 `{version}_{filename}.snap`

### 8. 冷却期升级

连续回滚时冷却期指数级增长：

```javascript
_triggerCooldown(durationMs) {
  this.cooldownUntil = new Date(Date.now() + durationMs);
}

// performRollback 中计算
const cooldownMs = Math.min(
  initialCooldownMs * Math.pow(2, this.consecutiveRollbacks - 1),
  maxCooldownMs
);
```

**典型参数**：初始 24h，每次翻倍，上限 7 天。

### 9. 健康指标

```javascript
healthCheck() {
  const total = this.successfulRollbacks + this.failedRollbacks;
  const successRate = total > 0 ? (this.successfulRollbacks / total * 100).toFixed(1) : 'N/A';
  return {
    pipeline: this.state !== RollbackState.CIRCUIT_OPEN ? 'healthy' : 'blocked',
    state: this.state,
    circuit: this.circuitState,
    currentScore: this.metrics.currentScore,
    rollbacks: {
      total: this.totalRollbacks,
      successful: this.successfulRollbacks,
      failed: this.failedRollbacks,
      successRate,
      consecutive: this.consecutiveRollbacks
    }
  };
}
```

### 10. 路径安全防护

```javascript
_safePath(basePath, userPath) {
  const resolved = path.resolve(basePath, userPath);
  if (!resolved.startsWith(path.resolve(basePath))) {
    throw new Error(`路径遍历攻击检测: ${userPath}`);
  }
  return resolved;
}
```

### 11. 模块导出

```javascript
module.exports = {
  RollbackManager,      // 主类
  RollbackState,        // 状态枚举
  RollbackError,        // 错误类型枚举
  MetricSeverity,       // 严重度枚举
  CircuitState,         // 熔断器状态枚举
  VALID_TRANSITIONS     // 状态转换映射
};
```

## 验证清单

- [ ] 语法检查：`node --check src/core/self-evolution/rollback-manager.js`
- [ ] 实例化：`require + new` 不报错
- [ ] 枚举导出：`Object.keys(RollbackState).length === 6`
- [ ] 状态机：合法转换通过，非法转换返回 false
- [ ] 下降检测：线性回归斜率正确判定趋势
- [ ] 噪声容忍：±0.5 波动不触发下降
- [ ] 震荡检测：A→B→A→B→A 模式正确识别
- [ ] 熔断器：连续 N 次回滚后 OPEN，半开窗口后尝试恢复
- [ ] 快照管理：createSnapshot 和 restoreFromSnapshot 文件读写正确
- [ ] 冷却期升级：连续回滚翻倍，上限正确
- [ ] 路径安全：路径遍历攻击被阻止
- [ ] 健康指标：totalRollbacks = successfulRollbacks + failedRollbacks

## 关键陷阱

### 1. 状态机自转换
回滚状态机与管道状态机不同——**允许在同一个状态上多次调用**（如 `MONITORING` 状态反复调用 `checkRollbackNeeded()`）。`_transitionTo()` 用返回值而非抛异常，调用方自主决定如何处理非法转换。

### 2. 熔断器恢复时序
熔断器 OPEN 后不能立即回滚。必须等待 `circuitResetMs` 后变为 `HALF_OPEN`，然后下一次 `performRollback()` 会将其重置为 `CLOSED` 并允许回滚。这防止快速重试导致无限熔断循环。

### 3. 连续回滚 vs 震荡
连续回滚触发熔断器（OPEN），震荡触发冷却期翻倍。**两者不冲突**：如果既连续回滚又震荡，熔断器优先（OPEN 状态拒绝所有回滚），冷却期在熔断器恢复后仍然生效。
