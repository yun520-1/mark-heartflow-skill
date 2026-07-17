# 认知包装器/引擎入口类升级模式

## 适用场景

模块是一个薄代理入口/包装层，所有公开方法直接委托给一个核心认知引擎（如 psychology.js），自身几乎无独立逻辑。与通用调度器包装器不同，认知包装器的委托目标是**认知分析引擎**，其核心模式是「输入 → 委托分析 → 结果映射」。

**典型特征**：
- 构造函数仅初始化 + 存储引用到核心模块
- 每个方法都是 `core.method(input)` 的简单透传
- 模块大小通常在 3000-5000 字节（小而薄）
- 无输入验证（null/undefined 直接崩溃）
- 无错误处理（核心模块异常直接冒泡）
- 无状态管理（声明了状态变量但从不使用）
- 无降级回退（核心模块不可用时无替代方案）
- 无结果增强（仅映射字段名，不做跨层分析）

**与通用包装器的区别**：

| 特征 | 通用调度器包装器 | 认知引擎包装器 |
|------|-----------------|----------------|
| 委托目标 | 进化核心/调度器 | 心理/认知分析引擎 |
| 核心操作 | 调度/队列/速率控制 | 分析/分类/检测 |
| 主要风险 | 过载/资源耗尽 | 输入无效/分析失败 |
| 典型增强 | 速率限制/优先级队列 | 输入验证/降级回退/置信度聚合 |

## 示例：PsychologyEngine (src/psychology/engine.js)

**原模块** (3,306 字节)：纯透传层，所有方法直接调用 `psychology.analyzePsychology(input)`，无输入验证、无错误处理、无降级方案。`_crisisCount` 声明但从未使用。

**升级后** (23,618 字节)：完整认知引擎入口，带输入验证、错误分类、降级回退、置信度聚合和跨层洞察。

### 可添加的子系统

#### 1. 输入验证系统

所有公开方法通过统一入口做输入检查，防止 null/undefined/类型错误导致的运行时崩溃。

```javascript
_validateStringInput(input) {
    // 1) null/undefined 检查
    if (input === null || input === undefined) {
        return { valid: false, sanitized: '', error: '输入不能为空' };
    }
    // 2) 类型转换（数字/对象自动转字符串）
    if (typeof input !== 'string') {
        try {
            const sanitized = String(input);
            if (sanitized.length > 0) return { valid: true, sanitized, error: null };
            return { valid: false, sanitized: '', error: '输入转换后为空字符串' };
        } catch (e) {
            return { valid: false, sanitized: '', error: `输入转换失败: ${e.message}` };
        }
    }
    // 3) 空字符串检查
    const trimmed = input.trim();
    if (trimmed.length === 0) {
        return { valid: false, sanitized: '', error: '输入为空字符串' };
    }
    // 4) 长度限制，防止资源耗尽
    if (trimmed.length > MAX_INPUT_LENGTH) {
        return { valid: true, sanitized: trimmed.substring(0, MAX_INPUT_LENGTH), 
                 error: null, warning: `输入过长，已截断至 ${MAX_INPUT_LENGTH} 字符` };
    }
    return { valid: true, sanitized: trimmed, error: null };
}
```

**上下文验证**：防止原型污染，只保留白名单字段：
```javascript
_validateContext(context) {
    if (!context || typeof context !== 'object') return {};
    const SAFE_KEYS = ['userId', 'sessionId', 'history', 'mood', 'topic', 'urgency'];
    const safe = {};
    for (const key of SAFE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(context, key)) {
            safe[key] = context[key];
        }
    }
    return safe;
}
```

#### 2. 状态枚举 + 错误分类

定义引擎运行状态和错误类型，使引擎行为可预测、可诊断。

```javascript
const EngineStatus = Object.freeze({
    READY: 'ready',
    DEGRADED: 'degraded',     // 部分模块失败，降级运行
    ERROR: 'error',           // 初始化或运行时错误
    DISABLED: 'disabled'      // 被外部禁用
});

const ErrorCategory = Object.freeze({
    INPUT_INVALID: 'input_invalid',
    MODULE_FAILURE: 'module_failure',
    DEPENDENCY_MISSING: 'dependency_missing',
    STATE_ERROR: 'state_error',
    UNKNOWN: 'unknown'
});
```

#### 3. 依赖验证 + 自动状态转换

构造函数中验证依赖模块的可用性，自动设置引擎初始状态。

```javascript
constructor(memory) {
    this.memory = memory;
    this._status = EngineStatus.READY;
    this._moduleErrors = [];
    this._verifyDependencies();
}

_verifyDependencies() {
    const errors = [];
    if (!psychology || typeof psychology.analyzePsychology !== 'function') {
        errors.push({ module: 'psychology', category: ErrorCategory.DEPENDENCY_MISSING });
    }
    if (!empathy || typeof empathy.detectEmpathy !== 'function') {
        errors.push({ module: 'empathy-detector', category: ErrorCategory.DEPENDENCY_MISSING });
    }
    if (errors.length > 0) {
        this._moduleErrors = errors;
        this._status = errors.length >= 2 ? EngineStatus.ERROR : EngineStatus.DEGRADED;
    }
}
```

#### 4. 安全调用包装 + 降级回退链

所有对核心模块的调用通过 `_safeCall()` 包装，失败时返回回退值而非崩溃。

```javascript
_safeCall(fn, moduleName, args, fallback) {
    if (typeof fn !== 'function') {
        this._moduleErrors.push({ module: moduleName, category: ErrorCategory.MODULE_FAILURE });
        return { success: false, value: fallback, error: `${moduleName}: 不是可调用的函数` };
    }
    try {
        const result = fn(...args);
        return { success: true, value: result, error: null };
    } catch (e) {
        const errorMsg = `${moduleName}: ${e.message || '未知错误'}`;
        this._moduleErrors.push({ module: moduleName, category: ErrorCategory.MODULE_FAILURE, error: errorMsg });
        if (this._status === EngineStatus.READY) {
            this._status = EngineStatus.DEGRADED;
        }
        return { success: false, value: fallback, error: errorMsg };
    }
}
```

**降级回退优先级**：当核心模块失败时，按以下优先级尝试：
1. 返回 `EMPTY_RESULT` 常量（含合理的默认值）
2. 使用关键词启发式回退（`_fallbackClassify()`）
3. 返回结构化错误信息（含 `error` 和 `status` 字段）

**关键词启发式回退示例**：
```javascript
_fallbackClassify(input) {
    const lower = input.toLowerCase();
    const POSITIVE_WORDS = ['good', 'great', 'happy', 'love', '谢谢', '好', '棒'];
    const NEGATIVE_WORDS = ['bad', 'sad', 'angry', 'hate', '不好', '难过', '生气'];
    const CRISIS_WORDS = ['suicide', 'kill', 'die', '自杀', '死', '不想活'];
    
    let category = 'neutral', crisisLevel = 'none', confidence = 0.3;
    if (CRISIS_WORDS.some(w => lower.includes(w))) {
        category = 'crisis_interaction';
        crisisLevel = 'high';
        confidence = 0.5;
    } else if (POSITIVE_WORDS.some(w => lower.includes(w)) && !NEGATIVE_WORDS.some(w => lower.includes(w))) {
        category = 'positive_interaction';
        confidence = 0.4;
    }
    return { category, emotion: 'neutral', crisisLevel, confidence, fallback: true };
}
```

#### 5. 置信度聚合

多感知层加权平均，低置信度层给予更少权重。

```javascript
_aggregateConfidence(layers) {
    if (!layers || layers.length === 0) {
        return { average: 0, min: 0, max: 0, weighted: 0 };
    }
    const confidences = layers.filter(l => 
        typeof l.confidence === 'number' && l.confidence >= 0 && l.confidence <= 1);
    if (confidences.length === 0) return { average: 0, min: 0, max: 0, weighted: 0 };
    
    const values = confidences.map(l => l.confidence);
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / values.length;
    
    // 加权：较低置信度层给予更少权重
    const weights = values.map(v => Math.max(0.1, v));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const weighted = weights.reduce((acc, w, i) => acc + w * values[i], 0) / weightSum;
    
    return {
        average: Math.round(average * 100) / 100,
        min: Math.round(Math.min(...values) * 100) / 100,
        max: Math.round(Math.max(...values) * 100) / 100,
        weighted: Math.round(weighted * 100) / 100
    };
}
```

#### 6. 跨层洞察生成

从多个感知层（情绪/需求/防御/危机）生成综合洞察。

```javascript
_generateInsights(analysis) {
    if (!analysis) return { layers: 0, primaryConcern: 'unknown', stability: 'unknown' };
    
    // 检测活跃层
    const layers = [];
    if (analysis.emotion) layers.push('emotion');
    if (analysis.needs?.length > 0) layers.push('needs');
    if (analysis.defense?.length > 0) layers.push('defense');
    if (analysis.crisis) layers.push('crisis');
    
    // 情绪稳定性检测
    let stability = 'stable';
    const arousal = Math.abs(analysis.emotion?.arousal || 0);
    if (arousal > 0.7) stability = 'volatile';
    else if (arousal > 0.4) stability = 'moderate';
    
    // 主要关切点识别
    let primaryConcern = 'unknown';
    if (analysis.crisis?.level !== 'none' && analysis.crisis?.level !== 'low') {
        primaryConcern = 'crisis';
    } else if (analysis.needs?.some(n => n.satisfied === false)) {
        primaryConcern = 'unmet_need';
    }
    
    return { layers: layers.length, layersDetected: layers, primaryConcern, 
             stability, isVolatile: stability === 'volatile',
             hasUnmetNeeds: analysis.needs?.some(n => n.satisfied === false) ?? false,
             hasActiveDefenses: analysis.defense?.length > 0 };
}
```

#### 7. 状态追踪增强

原模块声明了 `_crisisCount` 但从未使用。增强后根据危机等级自动递增/递减。

```javascript
// 在 analyzePsychology() 中：
if (mappedResult.crisis?.level) {
    const CRISIS_WEIGHTS = { critical: 3, high: 2, medium: 1, low: 0, none: 0 };
    const weight = CRISIS_WEIGHTS[mappedResult.crisis.level] || 0;
    if (weight >= 2) this._crisisCount++;
    else if (weight === 0 && this._crisisCount > 0) this._crisisCount--;
}
```

#### 8. 引擎恢复机制

从降级或错误状态自动恢复。

```javascript
recover() {
    const previousStatus = this._status;
    this._moduleErrors = [];
    this._verifyDependencies();
    
    if (this._status === EngineStatus.ERROR && previousStatus !== EngineStatus.ERROR) {
        return { success: false, previousStatus, newStatus: this._status,
                 message: '恢复失败：关键依赖仍然缺失' };
    }
    return { success: this._status === EngineStatus.READY,
             previousStatus, newStatus: this._status,
             message: this._status === EngineStatus.READY 
                      ? '引擎已恢复' : '引擎部分恢复，仍有模块不可用' };
}
```

#### 9. 启用/禁用控制

```javascript
disable() { this._status = EngineStatus.DISABLED; return { disabled: true }; }
enable() { this._status = EngineStatus.READY; this._verifyDependencies(); 
           return { enabled: true, status: this._status }; }
```

## 主方法完整流程（analyzePsychology）

升级后的主方法执行以下有序流程：

```
1. 输入验证           → _validateStringInput(input)
   ↓ 无效
2. 返回结构化错误结果  → { ...EMPTY_RESULT, error: '输入不能为空', status: 'error' }
   ↓ 有效
3. 状态检查           → this._status === EngineStatus.ERROR ?
   ↓ ERROR
4. 返回引擎不可用结果  → { ...EMPTY_RESULT, error: '引擎不可用', status: 'error' }
   ↓ 可用
5. 安全调用核心分析    → _safeCall(psychology.analyzePsychology, ...)
   ↓ 失败
6. 降级结果           → 手动构造基本结果对象
   ↓ 成功
7. 结果映射           → 标准化字段名（intent/intention, defenses/defense 等）
8. 危机状态追踪       → 根据危机等级更新 _crisisCount
9. 置信度聚合         → _aggregateConfidence([intention, crisis])
10. 跨层洞察生成      → _generateInsights(mappedResult)
11. 缓存结果          → this._lastAnalysis = { timestamp, emotion, crisisLevel, needs }
12. 返回增强结果      → { ...mappedResult, insights, confidence, crisisCount, status }
```

## 模块级导出

```javascript
module.exports = { PsychologyEngine, EngineStatus, ErrorCategory };
```

## 验证清单

- [ ] `node --check` 语法通过
- [ ] `require()` 加载模块成功
- [ ] `new PsychologyEngine()` 实例化成功
- [ ] `analyzePsychology(null)` 返回结构化错误而非崩溃
- [ ] `analyzePsychology('')` 返回结构化错误而非崩溃
- [ ] `classify(null)` 返回默认分类结果
- [ ] 正常输入返回完整分析（含 insights/confidence/crisisCount）
- [ ] 原有方法签名不变（向后兼容）
- [ ] `recover()` 能从空错误状态恢复
- [ ] `getPsychologyStats()` 返回正确的版本和状态
- [ ] VERSION 文件更新
- [ ] SKILL.md 版本同步
