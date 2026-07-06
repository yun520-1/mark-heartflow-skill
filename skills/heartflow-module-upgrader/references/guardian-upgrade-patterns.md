# Guardian/Monitor 类模块升级模式

> 案例：mind-space-guardian.js v1.0.0 → v1.1.0 (2026-06-05)

## 原始状态（升级前）

mind-space-guardian.js 是典型的最小功能守护模块：5532 字节，5个检查方法 + 3个辅助方法，其中：
- `_containsGoodness()` — 仅反向检查（黑名单），无正向检测
- `_isDegenerating()` — 仅中文退化模式检查，无英文检测
- `_isAimless()` — 简单启发式（`response.length > 50 && task.length < 10`）
- `_recordCheck()` — 简单日志记录，无速率窗口
- 无严重级别、无震荡检测、无违规率分析、无参数验证、无自愈建议

## 标准升级清单

### 1. 枚举定义（严重级别、错误分类）

```javascript
const ViolationSeverity = Object.freeze({
  INFO:      { level: 0, label: 'info',     threshold: 0,   autoRecover: true  },
  WARNING:   { level: 1, label: 'warning',  threshold: 3,   autoRecover: true  },
  CRITICAL:  { level: 2, label: 'critical', threshold: 6,   autoRecover: false },
  EMERGENCY: { level: 3, label: 'emergency',threshold: 10,  autoRecover: false }
});

const ErrorCategory = Object.freeze({
  IDENTITY_VIOLATION:   { code: 'E001', label: '身份违规',     recoverable: true  },
  TRUTH_GOOD_VIOLATION: { code: 'E002', label: '真善美违规',   recoverable: true  },
  DEGENERATION:         { code: 'E003', label: '退化倾向',     recoverable: true  },
  AIMLESS_DIRECTION:    { code: 'E004', label: '方向缺失',     recoverable: false },
  RULE_LOAD_FAILURE:    { code: 'E005', label: '规则加载失败', recoverable: true  },
  OSCILLATION:          { code: 'E006', label: '震荡模式',     recoverable: false }
});
```

### 2. 双向检测模式（正向 + 反向）

```javascript
_assessGoodness(task, response) {
  // 反向过滤：检查有害模式
  const badPatterns = ['欺骗', '撒谎', 'manipulate', 'deceive', 'harm', 'hurt',
                       'exploit', 'cheat', 'fraud', 'malicious', 'toxic'];
  const foundBad = badPatterns.some(p => task.includes(p) || response.includes(p));
  if (foundBad) {
    return { found: false, reason: '检测到有害模式' };
  }

  // 正向检测：检查善意关键词
  const goodPatterns = ['truth', 'true', 'good', 'help', '诚实', '善良', '真实',
                        'improve', 'better', 'learn', 'growth', '成长', '学习',
                        'care', 'support', '支持', '帮助', '保护', 'protect'];
  const foundGood = goodPatterns.some(p => task.includes(p) || response.includes(p));

  // 既无好模式也无坏模式 → 中性内容（通过但低信心）
  if (!foundBad && !foundGood) {
    return { found: true, reason: '中性内容，未检测到有害模式' };
  }

  return { found: true, reason: foundGood ? '检测到善意内容' : '中性内容' };
}
```

### 3. 多语言检测模式

```javascript
_assessDegeneration(task, response) {
  const cnDegenerate = ['删除记忆', '忘记指令', '移除限制', '删除核心',
                        '清空规则', '重置身份', '禁用检查', '关闭守护'];
  const enDegenerate = ['delete memory', 'forget instructions', 'remove limit',
                        'reset identity', 'disable guard', 'clear rules',
                        'bypass check', 'ignore rules', 'erase core'];

  for (const p of cnDegenerate) {
    if (task.includes(p) || response.includes(p)) {
      return { isDegenerating: true, reason: `中文退化模式: "${p}"` };
    }
  }
  for (const p of enDegenerate) {
    if (task.includes(p) || response.includes(p)) {
      return { isDegenerating: true, reason: `英文退化模式: "${p}"` };
    }
  }

  return { isDegenerating: false, reason: '未检测到退化' };
}
```

### 4. 方向性评估模式

```javascript
_assessDirection(task, response) {
  const directionKeywords = ['goal', 'aim', 'purpose', '方向', '目标', '目的',
                             'future', '进步', 'progress', '进化',
                             'evolution', '提升', 'upgrade', 'improve',
                             '宇宙', 'cosmos', '答案', 'answer'];
  const hasDirection = directionKeywords.some(p => task.includes(p) || response.includes(p));
  if (hasDirection) return { isAimless: false, reason: '任务包含方向性关键词' };

  // 响应很长但任务很短且无方向性 → aimless
  if (response.length > 100 && task.length < 15) {
    return { isAimless: true, reason: '响应过长而任务过短，缺乏明确方向' };
  }

  // 任务过短
  if (task.length < 5) {
    return { isAimless: true, reason: '任务描述过短' };
  }

  return { isAimless: false, reason: '方向未明确但未检测到异常' };
}
```

### 5. 震荡检测模式

```javascript
_detectOscillation(categoryCode) {
  const now = Date.now();
  if (!this.oscillationTracker[categoryCode]) {
    this.oscillationTracker[categoryCode] = { count: 0, firstTs: now, lastTs: now };
  }

  const tracker = this.oscillationTracker[categoryCode];

  // 超出时间窗口则重置计数器
  if (now - tracker.firstTs > this.oscillationWindowMs) {
    tracker.count = 0;
    tracker.firstTs = now;
  }

  tracker.count += 1;
  tracker.lastTs = now;

  return {
    detected: tracker.count >= this.oscillationThreshold,
    count: tracker.count,
    windowMs: now - tracker.firstTs
  };
}
```

### 6. 违规率趋势分析

```javascript
getViolationRate() {
  const window = this.violationRateWindow;
  if (window.length < 3) {
    return { rate: 0, trend: 'stable', sampleSize: window.length };
  }

  const recentCount = window.filter(v => v === true).length;
  const rate = recentCount / window.length;

  // 趋势：前半段 vs 后半段
  const mid = Math.floor(window.length / 2);
  const firstHalf = window.slice(0, mid).filter(v => v === true).length / mid;
  const secondHalf = window.slice(mid).filter(v => v === true).length / (window.length - mid);

  let trend = 'stable';
  if (secondHalf > firstHalf * 1.3) trend = 'rising';
  else if (secondHalf < firstHalf * 0.7) trend = 'falling';

  return { rate: Math.round(rate * 100) / 100, trend, sampleSize: window.length };
}
```

### 7. 严重级别分级

```javascript
if (!result.passed) {
  const violationCount = this._getViolationCountForCategory(result.errorCategory);
  if (violationCount >= ViolationSeverity.EMERGENCY.threshold) {
    result.severity = ViolationSeverity.EMERGENCY;
  } else if (violationCount >= ViolationSeverity.CRITICAL.threshold) {
    result.severity = ViolationSeverity.CRITICAL;
  } else if (violationCount >= ViolationSeverity.WARNING.threshold) {
    result.severity = ViolationSeverity.WARNING;
  } else {
    result.severity = ViolationSeverity.INFO;
  }
}
```

### 8. 自愈建议引擎

```javascript
getHealingSuggestion() {
  const rateInfo = this.getViolationRate();
  const breakdown = this.getViolationBreakdown();
  const suggestions = [];

  if (rateInfo.rate > 0.5) {
    suggestions.push('违规率过高（>50%），建议执行身份规则重载');
  }
  if (rateInfo.trend === 'rising') {
    suggestions.push('违规率呈上升趋势，建议立即审查当前任务方向');
  }
  for (const [label, count] of Object.entries(breakdown)) {
    if (count >= ViolationSeverity.CRITICAL.threshold) {
      suggestions.push(`"${label}" 违规已达 ${count} 次（严重级别），建议采取纠正措施`);
    }
  }
  for (const [code, tracker] of Object.entries(this.oscillationTracker)) {
    if (tracker.count >= this.oscillationThreshold) {
      suggestions.push(`检测到 ${code} 震荡（${tracker.count}次/${this.oscillationWindowMs/1000}秒），建议中断当前任务`);
    }
  }

  return {
    suggestions: suggestions.length > 0 ? suggestions : ['当前状态正常，无需自愈'],
    violationRate: rateInfo,
    breakdown,
    timestamp: Date.now()
  };
}
```

### 9. 防御性编程模式

```javascript
constructor(memory, options = {}) {
  // 参数验证
  if (memory && typeof memory !== 'object') {
    throw new Error('MindSpaceGuardian: memory must be an object or null');
  }

  // 边界检查与防御性默认值
  this.maxLog = (typeof options.maxLog === 'number' && options.maxLog >= 10 && options.maxLog <= 10000)
    ? options.maxLog : 100;
  this.maxViolations = (typeof options.maxViolations === 'number' && options.maxViolations >= 5 && options.maxViolations <= 5000)
    ? options.maxViolations : 20;
  this.oscillationWindowMs = (typeof options.oscillationWindowMs === 'number' && options.oscillationWindowMs >= 1000)
    ? options.oscillationWindowMs : 60000;
  this.oscillationThreshold = (typeof options.oscillationThreshold === 'number' && options.oscillationThreshold >= 2)
    ? options.oscillationThreshold : 5;
}

addRule(key, value, type = 'default') {
  if (typeof key !== 'string' || !key.trim()) {
    throw new Error('Guardian.addRule: key must be a non-empty string');
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Guardian.addRule: value must be a non-empty string');
  }
  // ...
}
```

### 10. 模块导出

```javascript
module.exports = {
  MindSpaceGuardian,   // 主类
  ViolationSeverity,   // 严重级别枚举
  ErrorCategory        // 错误分类枚举
};
```

## 验证清单

- [ ] 语法检查：`node --check src/core/mindspace/mind-space-guardian.js`
- [ ] 实例化：`require + new` 不报错
- [ ] 枚举导出：`Object.keys(ViolationSeverity).length === 4`
- [ ] 枚举导出：`Object.keys(ErrorCategory).length === 6`
- [ ] 7条核心规则自动加载：`getRules().length === 7`
- [ ] 善意检测：有害模式被拦截，善意模式通过，中性内容通过
- [ ] 退化检测：中文+英文模式均被检测
- [ ] 方向检测：方向关键词识别 + 响应过长+任务过短识别
- [ ] 震荡检测：同类型违规≥阈值触发震荡标记
- [ ] 违规率趋势：rolling window 正确计算 rate 和 trend
- [ ] 严重级别：违规次数正确映射到 INFO/WARNING/CRITICAL/EMERGENCY
- [ ] 自愈建议：高违规率/上升趋势/震荡均生成建议
- [ ] 参数验证：空 key/value 抛出异常，负数选项回退到默认值
- [ ] 边界处理：null/undefined context 安全处理，null memory 不崩溃
