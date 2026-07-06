# Reflection/Philosophy Engine Upgrade Patterns

适用于：基于关键词匹配的哲学反思引擎（如 `philosophy-engine.js`）

## 区别特征

哲学反思引擎与其他升级目标的关键区别：

| 特征 | 管道类 | 代理类 | 哲学引擎 |
|------|--------|--------|---------|
| 核心操作 | 多步骤编排 | 委托调用 | 关键词分类+硬编码响应 |
| 状态管理 | 复杂状态机 | 无 | 无（或极简） |
| 输入类型 | 结构化任务 | 任意 | 自然语言问题 |
| 输出 | 结构化结果 | 委托结果 | 模板化哲学回应 |
| 典型缺陷 | 无验证/无重试 | 空方法体 | 固定置信度/无输入检查/递归循环 |

## 标准升级清单

### 1. 输入验证层（防御性编程）

哲学引擎接收用户自然语言输入，必须处理各种边界情况：

```javascript
_safeString(val, fallback = '') {
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  try { return String(val); } catch (_) { return fallback; }
}

_safeObject(val) {
  if (val == null || typeof val !== 'object') return {};
  if (Array.isArray(val)) return {};
  return val;
}

_safeArray(val) {
  if (Array.isArray(val)) return val;
  return [];
}
```

### 2. 分数钳制（边界保护）

所有数值评分必须钳制在合法范围内：

```javascript
_clampScore(val) {
  if (typeof val !== 'number' || !Number.isFinite(val)) return 0;
  return Math.max(-1, Math.min(1, val));
}
```

### 3. 动态置信度评分

替代固定置信度，基于以下因素动态计算：

- **问题长度**：越长越复杂 → 置信度降低（-0.1 max）
- **历史同类型**：回答过多次 → 置信度提升（+0.05~+0.1）
- **震荡惩罚**：同类型反复出现 → 降低置信度（最多-0.2）
- **错误惩罚**：累积错误 → 降低置信度（-0.02/次）

```javascript
_computeDynamicConfidence(type, question, baseConfidence = 0.75) {
  let confidence = baseConfidence;
  // 长度惩罚
  const lengthFactor = Math.min(question.length / 500, 1);
  confidence -= lengthFactor * 0.1;
  // 历史经验奖励
  const historyCount = pastReflections.filter(e => e.type === type).length;
  if (historyCount > 3) confidence += 0.05;
  if (historyCount > 10) confidence += 0.05;
  // 震荡惩罚
  if (detectOscillation(type)) confidence -= penalty;
  // 钳制
  return Math.max(0, Math.min(1, confidence));
}
```

### 4. 震荡检测

检测同一类型问题在短时间窗口内反复出现：

```javascript
_detectOscillation(type) {
  // 保持最近 10 次的问题类型序列
  typeSequence.push(type);
  if (typeSequence.length > 10) typeSequence.shift();
  
  // 最近 5 次中同类型 >= 3 次 → 震荡
  const recent = typeSequence.slice(-5);
  const sameTypeCount = recent.filter(t => t === type).length;
  if (sameTypeCount >= 3 && recent.length >= 3) return true;
  return false;
}
```

### 5. 错误处理（public 方法包裹）

所有公开方法必须用 try/catch 包裹，出错时返回降级结果而非崩溃：

```javascript
reflect(question) {
  try {
    // ... 核心逻辑
    return result;
  } catch (e) {
    errorCount++;
    lastError = e.message;
    return { type: 'error', response: '...', confidence: 0, error: e.message };
  }
}
```

### 6. 递归修复

`_consensus` 或 `evaluate()` 类方法必须避免递归调用：

```javascript
// ❌ 错误：consensus 调用 evaluate → evaluate 调用 consensus → 循环
_consensus(ctx) { return this.evaluate(ctx); }

// ✅ 正确：直接并行计算各框架结果，不递归
evaluate(context) {
  const utilitarian = this._utilitarian(...);
  const deontological = this._deontological(...);
  const virtue = this._virtue(...);
  const care = this._care(...);
  // 直接计算共识，不调用 evaluate()
  const scores = [utilitarian.score, deontological.score, virtue.score, care.score];
  const avg = scores.reduce((a, b) => a + b, 0) / 4;
  return { utilitarian, deontological, virtue, care, consensus: { ... } };
}
```

### 7. 反思历史

记录过去的反思，支持统计和模式发现：

```javascript
_recordReflection(type, question) {
  pastReflections.entries.push({ type, timestamp: Date.now(), question: question.slice(0, 100) });
  if (pastReflections.entries.length > maxEntries) pastReflections.entries.shift();
}

getReflectionStats() {
  // 按类型统计分布
  // 暴露震荡检测状态
  // 暴露错误计数
}
```

### 8. 增强关键词检测

使用重叠评分代替简单单关键词匹配：

```javascript
_keywordMatch(text, keywords, minOverlap = 1) {
  const lower = String(text).toLowerCase();
  let matched = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) matched++;
  }
  return matched >= minOverlap;
}
```

用于 `evaluateValues()` 时，计算关键词命中率加成：

```javascript
const matches = keywords.filter(kw => lower.includes(kw)).length;
const matchRatio = matches / keywords.length;
let score = weight + (matchRatio * 0.15);
```

## 典型升级示例（philosophy-engine.js 170 行 → 538 行）

| 新增功能 | 逻辑量 | 说明 |
|---------|--------|------|
| 输入验证工具函数 | 4函数×5行 | `_safeString/_safeObject/_safeArray/_clampScore` |
| 动态置信度 | 1方法×30行 | 4因素加权计算 |
| 震荡检测 | 1方法×15行 | 窗口10次，阈值60% |
| 反思历史 | 2方法×15行 | 50条上限，类型分布统计 |
| 错误处理 | 3处 try/catch | 所有 public 方法 |
| 递归修复 | 1处重构 | `evaluate()` 直接并行 |
| 增强关键词 | 2处升级 | 重叠评分+命中率加成 |
| 版本/统计暴露 | 3字段 | version/getReflectionStats/clearHistory |

## 验证要点

```bash
# 1. null/undefined 安全测试
node -e "const{PhilosophyEngine}=require('./philosophy-engine.js');const pe=new PhilosophyEngine();console.log(pe.reflect(null).type)"

# 2. 震荡检测
node -e "const{PhilosophyEngine}=require('./...');const pe=new PhilosophyEngine();for(let i=0;i<6;i++){const r=pe.reflect('Who am I?');console.log(i+1,r.confidence.toFixed(4));}"

# 3. evaluate 空上下文
node -e "const{PhilosophyEngine}=require('./...');const pe=new PhilosophyEngine();console.log(pe.evaluate(null).consensus.finalRecommendation)"

# 4. 分数边界
node -e "const{PhilosophyEngine}=require('./...');const pe=new PhilosophyEngine();const r=pe.evaluate({outcomes:{benefits:[{value:1e10}]}});console.log('Clamped:',r.utilitarian.score)"
```
