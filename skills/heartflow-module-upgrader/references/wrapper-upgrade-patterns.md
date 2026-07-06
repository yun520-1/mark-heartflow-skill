# 包装器/调度器类升级模式

## 适用场景

模块是一个薄代理层，所有方法直接委托给核心类，自身几乎没有逻辑。

典型特征：
- 构造函数仅初始化 + 委托核心
- 每个方法都是 `if (this.core && typeof this.core.method === 'function') return this.core.method(...)`
- 模块大小通常在 1500-2500 字节
- 无独立状态、无指标追踪、无错误处理

## 示例：EvolutionLoop (src/evolution/loop.js)

**原模块** (1,619 字节)：纯代理层，所有方法委托给 SelfEvolutionCore，无独立功能。

**升级后** (20,622 字节)：独立进化调度引擎。

### 可添加的子系统

#### 1. 指标追踪系统
```javascript
this.metrics = {
    totalCycles: 0,
    totalTime: 0,          // ms
    fastestCycle: Infinity,
    slowestCycle: 0,
    avgCycleTime: 0,
    improvements: 0,
    convergedCycles: 0,
    failedCycles: 0,
    cycleTimestamps: [],
    improvementHistory: [],
    convergenceRate: 0,
    healthScore: 100,
    errors: []
};
```

#### 2. 自适应速率限制
```javascript
this.rateLimit = {
    enabled: true,
    minInterval: 1000,
    maxCyclesPerMinute: 30,
    cooldownUntil: null,
    consecutiveFastCycles: 0
};
```
- 检查每分钟最大周期数
- 连续快速周期（<100ms）自动收紧限制
- 冷却期机制

#### 3. 优先级队列调度
四级优先级：`critical` > `high` > `normal` > `low`
- 自动排队并排序
- 队列满时丢弃低优先级任务
- 支持出队处理

#### 4. 自诊断系统
返回完整健康报告，包括：
- 系统状态（healthy/degraded/critical）
- 性能指标（avgTime, fastest, slowest）
- 速率限制状态
- 最近错误追踪

#### 5. 状态持久化
- 独立状态文件：`internal/data/evolution/evolution-loop-state.json`
- 启动时自动恢复
- 每次操作后保存
- 支持重置

#### 6. 错误处理增强
- 启动失败优雅降级（core_init失败仍可运行）
- 进化失败自动记录并更新健康度
- throttled/queued 状态码返回

## 关键实现细节

### 保持向后兼容
- 原有方法签名不变（evolve, recordOutcome, retrieveLessons, heal）
- 新增方法不影响原有调用方
- 委托方法保持不变

### 速率限制实现
```javascript
_checkRateLimit() {
    if (!this.rateLimit.enabled) return true;
    if (this.rateLimit.cooldownUntil && Date.now() < this.rateLimit.cooldownUntil) {
        return false;
    }
    const oneMinuteAgo = Date.now() - 60000;
    const recentCycles = this.metrics.cycleTimestamps.filter(t => t > oneMinuteAgo);
    if (recentCycles.length >= this.rateLimit.maxCyclesPerMinute) {
        this.rateLimit.cooldownUntil = Date.now() + 5000;
        return false;
    }
    return true;
}
```

### 自适应调整
```javascript
_adaptRateLimit(cycleTime) {
    if (cycleTime < 100) {
        this.rateLimit.consecutiveFastCycles++;
        if (this.rateLimit.consecutiveFastCycles >= 5) {
            this.rateLimit.maxCyclesPerMinute = Math.max(10, 
                this.rateLimit.maxCyclesPerMinute - 2);
            this.rateLimit.consecutiveFastCycles = 0;
        }
    } else {
        this.rateLimit.consecutiveFastCycles = Math.max(0, 
            this.rateLimit.consecutiveFastCycles - 1);
        if (this.rateLimit.maxCyclesPerMinute < 30) {
            this.rateLimit.maxCyclesPerMinute = Math.min(30,
                this.rateLimit.maxCyclesPerMinute + 1);
        }
    }
}
```

### 优先级队列
```javascript
_enqueue(task) {
    if (this.priorityQueue.length >= 50) {
        if (task.priority === 'low') return false;
        const lowest = this.priorityQueue
            .map((t, i) => ({ idx: i, prio: this.priorityLevels[t.priority] }))
            .sort((a, b) => b.prio - a.prio)[0];
        if (lowest && this.priorityLevels[task.priority] < lowest.prio) {
            this.priorityQueue.splice(lowest.idx, 1);
        } else return false;
    }
    this.priorityQueue.push(task);
    this.priorityQueue.sort((a, b) => 
        this.priorityLevels[a.priority] - this.priorityLevels[b.priority]);
    return true;
}
```

## 验证清单
- [ ] `node --check` 语法通过
- [ ] 原有方法签名不变
- [ ] 构造不报错
- [ ] 委托方法正常工作
- [ ] 新功能可被独立测试
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步
